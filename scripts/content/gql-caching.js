window.PREP_SITE.registerTopic({
  id: 'gql-caching',
  module: 'graphql',
  title: 'Caching',
  estimatedReadTime: '50 min',
  tags: ['graphql', 'cache', 'normalization', 'apollo', 'relay', 'urql', 'graphcache', 'type-policies', 'persistence'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>GraphQL caching</strong> at the client level is what makes a typed network library feel like a database. Get it right and your app re-uses data across screens, updates everywhere on one mutation, and survives reload + offline. Get it wrong and you ship a beautiful UI with stale data, double-renders, and "why is this empty after I refresh?" bugs that take days to find.</p>
<ul>
  <li><strong>Two cache models:</strong> <em>document</em> (cache the whole response, key by query+vars) and <em>normalized</em> (split response into entities, key by <code>__typename + id</code>).</li>
  <li><strong>Apollo + Relay default to normalized.</strong> Urql's default is document; opt into <code>graphcache</code> for normalization.</li>
  <li><strong>Cache keys:</strong> Apollo uses <code>__typename + id</code> by default; configure via <code>keyFields</code> when entities use a different identifier (slug, email, composite).</li>
  <li><strong>Cache merges:</strong> pagination + dynamic lists need <strong>merge functions</strong> in typePolicies; without them, <code>fetchMore</code> overwrites instead of appending.</li>
  <li><strong>Fetch policies:</strong> <code>cache-first</code> (default), <code>cache-and-network</code> (fast + fresh), <code>network-only</code>, <code>no-cache</code>, <code>cache-only</code>.</li>
  <li><strong>Mutations update cache automatically</strong> for entities returned with <code>id + __typename</code>; lists / connections / derived fields need manual <code>cache.modify</code>.</li>
  <li><strong>Persistence:</strong> <code>apollo3-cache-persist</code> with AsyncStorage / MMKV on RN; with size cap to avoid quota exhaustion.</li>
  <li><strong>HTTP caching is separate.</strong> POSTs aren't cacheable by intermediaries; persisted queries enable GET → CDN cache.</li>
</ul>
<p><strong>Mantra:</strong> "Normalize by id. Configure typePolicies. Update cache from mutations. Persist with limits. Trust but verify in DevTools."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>Why client-side cache matters</h3>
<table>
  <thead><tr><th>Without cache</th><th>With normalized cache</th></tr></thead>
  <tbody>
    <tr><td>Every navigation re-fetches</td><td>Cached views render instantly</td></tr>
    <tr><td>Mutation result must be hand-applied to every UI</td><td>One mutation updates all screens showing the entity</td></tr>
    <tr><td>Multiple queries fetching same record = duplicate data</td><td>Records deduplicated by id</td></tr>
    <tr><td>Optimistic UI is hard / impossible</td><td>Optimistic fits naturally with cache writes</td></tr>
    <tr><td>Offline = empty screens</td><td>Offline = previously cached views still render</td></tr>
  </tbody>
</table>

<h3>Two cache models</h3>
<h4>Document cache</h4>
<p>Cache key = <code>(query + variables)</code>. Whole response stored as a blob. Examples: Apollo's old "data ID from object" mode (deprecated), Urql default, TanStack Query.</p>
<ul>
  <li><strong>Pro:</strong> Simple. No setup. Predictable.</li>
  <li><strong>Con:</strong> Same record duplicated across queries. Mutation to one record doesn't update other queries.</li>
  <li><strong>Use:</strong> apps where queries don't overlap; small features; REST-like usage.</li>
</ul>

<h4>Normalized cache</h4>
<p>Each entity stored once, keyed by <code>__typename + id</code>. Queries reference entities by id; reading a query reconstructs from the entity store.</p>
<ul>
  <li><strong>Pro:</strong> Mutation to one record updates everywhere. Less storage. Optimistic UI clean.</li>
  <li><strong>Con:</strong> Setup overhead (typePolicies, keyFields, merge functions). Mental model harder.</li>
  <li><strong>Use:</strong> default for production GraphQL apps; Apollo + Relay assume this.</li>
</ul>

<h3>What "good caching" looks like</h3>
<ul>
  <li>Every entity has stable normalization (<code>id</code> + <code>__typename</code> selected; <code>keyFields</code> configured for non-id entities).</li>
  <li>Mutations return enough data to update affected entities — no refetch.</li>
  <li>Lists / connections have merge functions; <code>fetchMore</code> appends correctly.</li>
  <li>Optimistic responses for high-frequency mutations (likes, votes, follows).</li>
  <li>Eviction on logout — clear all per-user data.</li>
  <li>Persistence on mobile with size cap.</li>
  <li>SSR cache extracted + restored without leaking per-user data.</li>
  <li>DevTools used regularly to verify cache state.</li>
</ul>

<h3>What "bad caching" looks like</h3>
<ul>
  <li>No <code>id</code> selected → cache duplicates records under different keys.</li>
  <li>No merge function on connections → <code>fetchMore</code> replaces instead of appending.</li>
  <li>Mutation returns <code>Boolean</code> → manual refetch on every mutation.</li>
  <li>Per-user data cached without eviction on logout → next user sees previous user's data.</li>
  <li>SSR cache extracted globally → CDN ships per-user data to other users.</li>
  <li>No persistence → reload = empty cache = full re-fetch.</li>
  <li>Persistence without size cap → mobile storage exhaustion.</li>
  <li>Polling used where mutation cache update would suffice.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>How Apollo's normalized cache stores data</h3>
<p>Imagine a flat key/value store of entity records:</p>
<pre><code class="language-text">{
  "User:1": {
    __typename: "User",
    id: "1",
    name: "Prakhar",
    avatarUrl: "https://...",
    posts: { __ref: "Post:42" } // reference to another record
  },
  "Post:42": {
    __typename: "Post",
    id: "42",
    title: "Hello",
    author: { __ref: "User:1" } // back-reference
  },
  "ROOT_QUERY": {
    user({"id":"1"}): { __ref: "User:1" }, // query result is a pointer
  }
}
</code></pre>

<p>Each record stored once. Multiple queries pointing to the same entity all dereference the same record. Mutation to <code>Post:42</code> automatically updates every UI watching it.</p>

<h3>Cache identification (<code>cache.identify</code>)</h3>
<pre><code class="language-typescript">cache.identify({ __typename: 'User', id: '1' });
// → "User:1"

cache.identify({ __typename: 'Post', slug: 'hello-world' });
// → undefined (no <code>id</code>; Apollo can't normalize unless configured)
</code></pre>

<p>Configure non-default keys via <code>typePolicies.{TypeName}.keyFields</code>:</p>
<pre><code class="language-typescript">new InMemoryCache({
  typePolicies: {
    Book: { keyFields: ['isbn'] },                    // single field
    Address: { keyFields: ['street', 'city', 'zip'] }, // composite
    Quote: { keyFields: false },                       // no normalization
  },
});
</code></pre>

<h3>Type policies and field policies</h3>
<table>
  <thead><tr><th>Hook</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td><code>keyFields</code></td><td>Override default <code>id</code> normalization</td></tr>
    <tr><td><code>fields[fieldName].keyArgs</code></td><td>Tell Apollo which args contribute to the cache key</td></tr>
    <tr><td><code>fields[fieldName].read</code></td><td>Custom read; transform / synthesize values</td></tr>
    <tr><td><code>fields[fieldName].merge</code></td><td>Custom merge for paginated lists / connections</td></tr>
  </tbody>
</table>

<h3>The merge function (pagination)</h3>
<pre><code class="language-typescript">typePolicies: {
  Query: {
    fields: {
      feed: {
        keyArgs: false, // single cache entry regardless of pagination args
        merge(existing = { edges: [], pageInfo: {} }, incoming) {
          return {
            ...incoming,
            edges: [...existing.edges, ...incoming.edges],
          };
        },
      },
    },
  },
}
</code></pre>

<p>Why <code>keyArgs: false</code>: without it, Apollo creates separate cache entries per <code>(first, after)</code> tuple. <code>keyArgs: false</code> says "this is one logical list; merge them."</p>

<p>For filters that <em>do</em> create a separate logical list:</p>
<pre><code class="language-typescript">feed: {
  keyArgs: ['filter'], // separate cache per filter; pagination merged within
  merge(existing, incoming) { /* ... */ },
}
</code></pre>

<h3>Cache reads</h3>
<table>
  <thead><tr><th>Method</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td><code>cache.readQuery</code></td><td>Read a query result from cache</td></tr>
    <tr><td><code>cache.readFragment</code></td><td>Read a fragment off a specific entity</td></tr>
    <tr><td><code>cache.identify</code></td><td>Compute the cache key for an object</td></tr>
    <tr><td><code>cache.extract</code></td><td>Snapshot the entire cache (SSR)</td></tr>
  </tbody>
</table>

<h3>Cache writes</h3>
<table>
  <thead><tr><th>Method</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td><code>cache.writeQuery</code></td><td>Replace a query result</td></tr>
    <tr><td><code>cache.writeFragment</code></td><td>Update a specific entity's fields</td></tr>
    <tr><td><code>cache.modify</code></td><td>Surgically update specific fields on a record</td></tr>
    <tr><td><code>cache.evict</code></td><td>Remove an entity from the cache</td></tr>
    <tr><td><code>cache.gc</code></td><td>Garbage-collect orphaned records</td></tr>
    <tr><td><code>cache.reset</code></td><td>Clear everything</td></tr>
  </tbody>
</table>

<h3>Fetch policies — when to skip / hit cache</h3>
<table>
  <thead><tr><th>Policy</th><th>Behaviour</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td><code>cache-first</code> (default)</td><td>Use cache if complete; fetch if not</td><td>Default for most reads</td></tr>
    <tr><td><code>cache-and-network</code></td><td>Return cache + fire request; update on response</td><td>"Show stale + refresh" pattern</td></tr>
    <tr><td><code>network-only</code></td><td>Always fetch; update cache</td><td>Hard refresh; avoid stale</td></tr>
    <tr><td><code>no-cache</code></td><td>Fetch; don't read or write cache</td><td>One-off / per-user / SSR personal data</td></tr>
    <tr><td><code>cache-only</code></td><td>Read cache or error; never fetch</td><td>Render synchronously; offline-only</td></tr>
    <tr><td><code>standby</code></td><td>Don't fetch; resume on next active</td><td>Background tabs</td></tr>
  </tbody>
</table>

<h3>Optimistic responses</h3>
<pre><code class="language-typescript">await mutate({
  variables: { id, like: true },
  optimisticResponse: {
    likePost: {
      __typename: 'LikePostPayload',
      post: {
        __typename: 'Post',
        id,
        likeCount: post.likeCount + 1,
        hasLiked: true,
      },
    },
  },
});
</code></pre>

<p>Apollo writes optimistic data with a special "optimistic layer." Subsequent reads see the optimistic values. When the real response arrives, the optimistic layer is discarded and replaced.</p>

<p>Rollback on error is automatic. If your <code>update</code> wrote to other parts of the cache (not just the optimistic record), those changes don't auto-rollback — handle manually.</p>

<h3>Subscription + cache</h3>
<p>Subscriptions stream data; you decide how to merge into cache. Common pattern:</p>
<pre><code class="language-typescript">useSubscription(NEW_COMMENT, {
  variables: { postId },
  onData({ client, data }) {
    const newComment = data.data?.newComment;
    if (!newComment) return;
    client.cache.modify({
      id: client.cache.identify({ __typename: 'Post', id: postId }),
      fields: {
        comments(existing) {
          const newRef = client.cache.writeFragment({
            data: newComment,
            fragment: NEW_COMMENT_FRAGMENT,
          });
          return { ...existing, edges: [...existing.edges, { node: newRef }] };
        },
      },
    });
  },
});
</code></pre>

<h3>Eviction on logout</h3>
<pre><code class="language-typescript">async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  await client.clearStore(); // or resetStore() to refetch active queries after
  clearLocalStorage();
  navigate('/login');
}
</code></pre>

<table>
  <thead><tr><th>Method</th><th>Effect</th></tr></thead>
  <tbody>
    <tr><td><code>client.clearStore()</code></td><td>Wipes cache; doesn't refetch active queries</td></tr>
    <tr><td><code>client.resetStore()</code></td><td>Wipes cache + refetches all active queries</td></tr>
  </tbody>
</table>

<h3>Persistence</h3>
<pre><code class="language-typescript">import { persistCache, AsyncStorageWrapper } from 'apollo3-cache-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

await persistCache({
  cache,
  storage: new AsyncStorageWrapper(AsyncStorage),
  maxSize: 5 * 1024 * 1024, // 5 MB
  trigger: 'background', // persist on app background
  debug: false,
});
</code></pre>

<p>On app boot, cache restores from storage; queries hit cache instantly. Without size cap, cache grows unbounded — mobile storage quota exhaustion.</p>

<h3>HTTP cache vs Apollo cache</h3>
<table>
  <thead><tr><th></th><th>HTTP cache (browser)</th><th>Apollo cache</th></tr></thead>
  <tbody>
    <tr><td>Layer</td><td>Network</td><td>Application</td></tr>
    <tr><td>Key</td><td>URL + headers</td><td>__typename + id (entities); query+vars (root)</td></tr>
    <tr><td>Cacheable methods</td><td>GET, HEAD</td><td>Any (POST is fine)</td></tr>
    <tr><td>Eviction</td><td>Browser-managed</td><td>App-managed (persist + limits)</td></tr>
    <tr><td>Mutation invalidation</td><td>None</td><td>Automatic by id; manual for lists</td></tr>
  </tbody>
</table>

<p>For GraphQL, HTTP cache is mostly bypassed (POST). To enable: persisted queries → GET requests → CDN-cacheable.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Configuring InMemoryCache (Apollo)</h3>
<pre><code class="language-typescript">import { InMemoryCache, makeVar } from '@apollo/client';

const cache = new InMemoryCache({
  typePolicies: {
    User: {
      keyFields: ['id'], // default; explicit for clarity
      fields: {
        fullName: {
          read(_, { readField }) {
            return \`\${readField('firstName')} \${readField('lastName')}\`;
          },
        },
      },
    },
    Post: {
      keyFields: ['id'],
      fields: {
        comments: {
          keyArgs: false,
          merge(existing = { edges: [] }, incoming) {
            return {
              ...incoming,
              edges: [...existing.edges, ...incoming.edges],
            };
          },
        },
      },
    },
    Query: {
      fields: {
        feed: relayPagination(),  // use the helper
      },
    },
  },
});

// Helper for Relay-style cursor pagination
function relayPagination() {
  return {
    keyArgs: false,
    merge(existing = { edges: [], pageInfo: {} }, incoming) {
      return {
        ...incoming,
        edges: [...existing.edges, ...incoming.edges],
      };
    },
  };
}
</code></pre>

<h3>Reading from cache</h3>
<pre><code class="language-typescript">// Read a query result
const data = client.readQuery({
  query: GET_USER,
  variables: { id: '1' },
});

// Read a specific entity via fragment
const post = client.readFragment({
  id: client.cache.identify({ __typename: 'Post', id: '42' }),
  fragment: gql\`
    fragment PostFields on Post {
      id
      title
      likeCount
    }
  \`,
});

// Compute identity
const cacheKey = client.cache.identify({ __typename: 'User', id: '1' });
// → "User:1"
</code></pre>

<h3>Writing to cache (cache.modify)</h3>
<pre><code class="language-typescript">// Add a like to a post
client.cache.modify({
  id: client.cache.identify({ __typename: 'Post', id: '42' }),
  fields: {
    likeCount: (current) =&gt; current + 1,
    hasLiked: () =&gt; true,
  },
});

// Add an item to a list
client.cache.modify({
  fields: {
    feed(existing) {
      const newRef = client.cache.writeFragment({
        data: newPost,
        fragment: gql\`fragment NewPost on Post { id title }\`,
      });
      return {
        ...existing,
        edges: [{ node: newRef, __typename: 'PostEdge' }, ...existing.edges],
      };
    },
  },
});

// Remove an item
client.cache.modify({
  fields: {
    feed(existing, { readField }) {
      return {
        ...existing,
        edges: existing.edges.filter(
          (edge) =&gt; readField('id', edge.node) !== deletedId
        ),
      };
    },
  },
});

// Evict + GC after delete
client.cache.evict({ id: client.cache.identify({ __typename: 'Post', id: '42' }) });
client.cache.gc();
</code></pre>

<h3>Mutation cache update patterns</h3>
<h4>Auto-update by id (no work needed)</h4>
<pre><code class="language-graphql">mutation UpdateBio($id: ID!, $bio: String!) {
  updateBio(id: $id, bio: $bio) {
    user {
      id
      bio
    }
  }
}
</code></pre>
<p>If the mutation returns the user with <code>id</code> + the updated <code>bio</code>, Apollo merges by id. All UIs watching <code>User:id</code> re-render.</p>

<h4>Manual update for list addition</h4>
<pre><code class="language-typescript">const [createPost] = useMutation(CREATE_POST, {
  update(cache, { data }) {
    cache.modify({
      fields: {
        feed(existing) {
          const newPostRef = cache.writeFragment({
            data: data.createPost.post,
            fragment: NEW_POST_FRAGMENT,
          });
          return {
            ...existing,
            edges: [{ node: newPostRef, __typename: 'PostEdge' }, ...existing.edges],
          };
        },
      },
    });
  },
});
</code></pre>

<h4>Manual update for derived counts</h4>
<pre><code class="language-typescript">const [follow] = useMutation(FOLLOW_USER, {
  update(cache, { data }, { variables }) {
    // Update target user's followerCount
    cache.modify({
      id: cache.identify({ __typename: 'User', id: variables.targetId }),
      fields: {
        followerCount: (current) =&gt; current + 1,
        isFollowedByViewer: () =&gt; true,
      },
    });
    // Update viewer's followingCount
    cache.modify({
      id: cache.identify({ __typename: 'User', id: viewerId }),
      fields: {
        followingCount: (current) =&gt; current + 1,
      },
    });
  },
});
</code></pre>

<h3>Custom merge example: connection with stable order</h3>
<pre><code class="language-typescript">comments: {
  keyArgs: ['filter', 'sortBy'], // separate cache per (filter, sortBy)
  merge(existing = { edges: [], pageInfo: {} }, incoming, { args }) {
    // For "load more," append
    if (args?.after) {
      return {
        ...incoming,
        edges: [...existing.edges, ...incoming.edges],
      };
    }
    // For initial load (no after), replace
    return incoming;
  },
}
</code></pre>

<h3>Reactive variables (Apollo local state)</h3>
<pre><code class="language-typescript">import { makeVar, useReactiveVar } from '@apollo/client';

export const cartItemCount = makeVar(0);

// In a component
function Header() {
  const count = useReactiveVar(cartItemCount);
  return &lt;span&gt;Cart: {count}&lt;/span&gt;;
}

// Anywhere
cartItemCount(cartItemCount() + 1);
</code></pre>
<p>Reactive vars live alongside the cache; component re-renders when they change. Useful for client-only state (theme, drawer open, cart total) without going to the cache.</p>

<h3>Local fields (<code>@client</code>)</h3>
<pre><code class="language-graphql">query GetCart {
  me {
    id
    name
    cartItemCount @client
  }
}
</code></pre>

<pre><code class="language-typescript">typePolicies: {
  User: {
    fields: {
      cartItemCount: {
        read() {
          return cartItemCount();
        },
      },
    },
  },
}
</code></pre>
<p>The query mixes server fields and client-only fields seamlessly; the <code>@client</code> directive marks fields resolved locally.</p>

<h3>Cache eviction strategies</h3>
<pre><code class="language-typescript">// Evict a single entity
cache.evict({ id: 'User:1' });
cache.gc(); // remove orphaned children

// Evict all queries with a specific name
cache.evict({ fieldName: 'feed' });

// Evict all queries returning a specific type
cache.evict({ id: 'ROOT_QUERY', fieldName: 'feed' });

// Nuclear option: clear everything
client.clearStore(); // wipes; no refetch
client.resetStore(); // wipes + refetches active queries
</code></pre>

<h3>Persistence with apollo3-cache-persist</h3>
<pre><code class="language-typescript">import { persistCache, AsyncStorageWrapper, CachePersistor } from 'apollo3-cache-persist';

const persistor = new CachePersistor({
  cache,
  storage: new AsyncStorageWrapper(AsyncStorage),
  maxSize: 5 * 1024 * 1024,
  trigger: 'background',
  debug: __DEV__,
});

// Restore on app boot
await persistor.restore();

// Manually persist
await persistor.persist();

// Purge (e.g., on logout)
await persistor.purge();
</code></pre>

<p>For RN, use MMKV-backed wrapper for ~10× faster persistence:</p>
<pre><code class="language-typescript">import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();
const apolloStorage = {
  getItem: (k: string) =&gt; storage.getString(k) ?? null,
  setItem: (k: string, v: string) =&gt; storage.set(k, v),
  removeItem: (k: string) =&gt; storage.delete(k),
};

await persistCache({ cache, storage: apolloStorage, maxSize: 5 * 1024 * 1024 });
</code></pre>

<h3>SSR cache lifecycle</h3>
<pre><code class="language-typescript">// Server: per-request cache
export async function getServerSideProps(context) {
  const apolloClient = initializeApolloClient();
  await apolloClient.query({ query: PROFILE_QUERY, variables: { id: context.params.id } });
  return {
    props: {
      initialApolloState: apolloClient.cache.extract(),
    },
  };
}

// Client: hydrate
function App({ pageProps }) {
  const apolloClient = useApollo(pageProps.initialApolloState);
  return &lt;ApolloProvider client={apolloClient}&gt;...&lt;/ApolloProvider&gt;;
}

function useApollo(initialState) {
  const client = useMemo(() =&gt; {
    const c = createApolloClient();
    if (initialState) c.cache.restore(initialState);
    return c;
  }, [initialState]);
  return client;
}
</code></pre>

<p>Critical: per-request cache. Sharing a server-side cache across requests = data leak between users.</p>

<h3>Persisted queries (HTTP-level cache)</h3>
<pre><code class="language-typescript">import { createPersistedQueryLink } from '@apollo/client/link/persisted-queries';
import { sha256 } from 'crypto-hash';

const persistedLink = createPersistedQueryLink({
  sha256,
  useGETForHashedQueries: true, // CDN-cacheable
});
</code></pre>

<p>First request sends the hash; if server doesn't recognize, server responds with error; client retries with full query. Server caches the (hash → query) mapping. Subsequent calls send only the hash → small payload + GET → CDN cache hit possible.</p>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Configuring typePolicies for a real app</h3>
<pre><code class="language-typescript">const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Top-level paginated feed
        feed: {
          keyArgs: ['filter'],
          merge(existing = { edges: [] }, incoming, { args }) {
            if (!args?.after) return incoming; // first page; replace
            return { ...incoming, edges: [...existing.edges, ...incoming.edges] };
          },
        },
        // Singleton current user; no args
        me: {
          merge: true, // shallow merge (default for objects)
        },
      },
    },
    User: {
      keyFields: ['id'],
      fields: {
        // User's posts also paginated
        posts: {
          keyArgs: false,
          merge(existing = { edges: [] }, incoming) {
            return { ...incoming, edges: [...existing.edges, ...incoming.edges] };
          },
        },
        // Computed display name from first/last
        displayName: {
          read(_, { readField }) {
            return \`\${readField('firstName')} \${readField('lastName')}\`;
          },
        },
      },
    },
    Post: {
      keyFields: ['id'],
      fields: {
        comments: {
          keyArgs: false,
          merge(existing = { edges: [] }, incoming) {
            return { ...incoming, edges: [...existing.edges, ...incoming.edges] };
          },
        },
      },
    },
    // Custom-key entity
    Address: {
      keyFields: ['street', 'city', 'zip'],
    },
    // Embedded type that should not be normalized
    Money: {
      keyFields: false,
    },
  },
});
</code></pre>

<h3>Example 2: Optimistic like with cache update</h3>
<pre><code class="language-typescript">const LIKE = gql\`
  mutation Like($id: ID!) {
    likePost(id: $id) {
      post { id likeCount hasLiked }
    }
  }
\`;

function LikeButton({ post }) {
  const [like] = useMutation(LIKE);

  const onClick = () =&gt; {
    like({
      variables: { id: post.id },
      optimisticResponse: {
        likePost: {
          __typename: 'LikePostPayload',
          post: {
            __typename: 'Post',
            id: post.id,
            likeCount: post.likeCount + (post.hasLiked ? -1 : 1),
            hasLiked: !post.hasLiked,
          },
        },
      },
    });
  };

  return (
    &lt;button onClick={onClick}&gt;
      {post.hasLiked ? '♥' : '♡'} {post.likeCount}
    &lt;/button&gt;
  );
}
</code></pre>
<p>Apollo merges by id automatically; no <code>update</code> needed for fields on the existing entity.</p>

<h3>Example 3: Add to feed via cache.modify</h3>
<pre><code class="language-typescript">const CREATE_POST = gql\`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      post {
        id
        title
        body
        createdAt
        author { id name }
      }
    }
  }
\`;

const NEW_POST_FRAGMENT = gql\`
  fragment NewPost on Post {
    id
    title
    body
    createdAt
    author { id name }
  }
\`;

const [createPost] = useMutation(CREATE_POST, {
  update(cache, { data }) {
    if (!data?.createPost?.post) return;
    cache.modify({
      fields: {
        feed(existing = { edges: [] }, { readField }) {
          const newRef = cache.writeFragment({
            data: data.createPost.post,
            fragment: NEW_POST_FRAGMENT,
          });
          // Avoid duplicates
          if (existing.edges.some((e: any) =&gt; readField('id', e.node) === data.createPost.post.id)) {
            return existing;
          }
          return {
            ...existing,
            edges: [{ node: newRef, __typename: 'PostEdge' }, ...existing.edges],
          };
        },
      },
    });
  },
});
</code></pre>

<h3>Example 4: Delete with eviction</h3>
<pre><code class="language-typescript">const DELETE_POST = gql\`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id) {
      id
    }
  }
\`;

const [deletePost] = useMutation(DELETE_POST, {
  update(cache, { data }) {
    if (!data?.deletePost?.id) return;
    const id = cache.identify({ __typename: 'Post', id: data.deletePost.id });
    if (id) {
      cache.evict({ id });
      cache.gc(); // clean up orphaned children
    }
  },
});
</code></pre>

<h3>Example 5: Persistence on RN with MMKV</h3>
<pre><code class="language-typescript">import { ApolloClient, InMemoryCache } from '@apollo/client';
import { CachePersistor } from 'apollo3-cache-persist';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();
const apolloStorage = {
  getItem: (k) =&gt; storage.getString(k) ?? null,
  setItem: (k, v) =&gt; storage.set(k, v),
  removeItem: (k) =&gt; storage.delete(k),
};

const cache = new InMemoryCache({ /* typePolicies */ });

export const persistor = new CachePersistor({
  cache,
  storage: apolloStorage,
  maxSize: 5 * 1024 * 1024,
  trigger: 'background',
});

export const client = new ApolloClient({
  link: /* ... */,
  cache,
});

// In App.tsx
useEffect(() =&gt; {
  persistor.restore().then(() =&gt; setReady(true));
}, []);

// On logout
function logout() {
  persistor.purge();
  client.clearStore();
}
</code></pre>

<h3>Example 6: Reactive vars for client-only state</h3>
<pre><code class="language-typescript">import { makeVar, useReactiveVar } from '@apollo/client';

export const themeVar = makeVar&lt;'light' | 'dark'&gt;('light');
export const sidebarOpenVar = makeVar(false);

function Header() {
  const theme = useReactiveVar(themeVar);
  const isOpen = useReactiveVar(sidebarOpenVar);
  return /* ... */;
}

function ThemeToggle() {
  const theme = useReactiveVar(themeVar);
  return (
    &lt;button onClick={() =&gt; themeVar(theme === 'light' ? 'dark' : 'light')}&gt;
      Switch
    &lt;/button&gt;
  );
}
</code></pre>

<h3>Example 7: Per-user cache eviction on logout</h3>
<pre><code class="language-typescript">async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  await client.clearStore();
  await persistor.purge();
  AsyncStorage.removeItem('auth-token');
  navigate('/login');
}
</code></pre>

<h3>Example 8: SSR with per-request cache</h3>
<pre><code class="language-typescript">// Next.js
let apolloClient;

function createApolloClient() {
  return new ApolloClient({
    ssrMode: typeof window === 'undefined',
    link: /* ... */,
    cache: new InMemoryCache({ typePolicies: { /* ... */ } }),
  });
}

export function initializeApollo(initialState = null) {
  // ALWAYS create a new instance on the server
  const _apolloClient = apolloClient ?? createApolloClient();

  if (initialState) {
    const existingCache = _apolloClient.extract();
    _apolloClient.cache.restore({ ...existingCache, ...initialState });
  }

  // Server: always new
  if (typeof window === 'undefined') return _apolloClient;
  // Client: reuse
  if (!apolloClient) apolloClient = _apolloClient;
  return _apolloClient;
}

// Page
export async function getServerSideProps(ctx) {
  const apollo = initializeApollo();
  await apollo.query({ query: PROFILE_QUERY, variables: { id: ctx.params.id } });
  return { props: { initialApolloState: apollo.cache.extract() } };
}
</code></pre>

<h3>Example 9: Custom field policy with arguments</h3>
<pre><code class="language-typescript">User: {
  fields: {
    // Avatar URL with size argument; treat each size as separate
    avatarUrl: {
      keyArgs: ['size'],
      read(existing) {
        return existing;
      },
    },
    // Recent posts: take first N from cached list
    recentPosts: {
      read(existing, { args }) {
        if (!existing) return undefined;
        return existing.slice(0, args?.limit ?? 10);
      },
    },
  },
}
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>Missing <code>id</code> means missing normalization</h3>
<ul>
  <li>If your selection set forgets <code>id</code>, Apollo can't write to a normalized record.</li>
  <li>Symptom: mutation updates one screen but not another showing the same entity.</li>
  <li>Apollo logs warning in dev: "Cache data may be lost when replacing the X field..."</li>
  <li>Fix: always select <code>id</code> + <code>__typename</code>; configure <code>keyFields</code> for non-id entities.</li>
</ul>

<h3>Custom <code>keyFields</code> with composite keys</h3>
<pre><code class="language-typescript">// Address keyed by all three fields
typePolicies: {
  Address: {
    keyFields: ['street', 'city', 'zip'],
  },
}

// Or by a function
typePolicies: {
  Address: {
    keyFields: (data) =&gt; \`Address:\${data.street}-\${data.city}-\${data.zip}\`,
  },
}
</code></pre>

<h3>Pagination merge gotchas</h3>
<ul>
  <li><strong>No <code>keyArgs: false</code> or list of args:</strong> Apollo creates separate entries per arg combination; <code>fetchMore</code> appears to "do nothing."</li>
  <li><strong>Merge function returns <code>incoming</code>:</strong> overwrites instead of appending.</li>
  <li><strong>Filter changes:</strong> first page after filter change should replace, not append. Check <code>args.after</code>.</li>
  <li><strong>Duplicates:</strong> if a record can appear in two pages (race conditions), check <code>readField('id', edge.node)</code> before appending.</li>
</ul>

<h3>Subscription doubling</h3>
<ul>
  <li>Subscription pushes a new comment; you append to cache; refetch also returns it; you have a duplicate.</li>
  <li>Check by id before appending in the subscription handler.</li>
</ul>

<h3>Stale optimistic data</h3>
<ul>
  <li>If your <code>update</code> writes to derived fields that depend on the optimistic record, those derived writes don't auto-rollback.</li>
  <li>Symptom: server fails; optimistic record reverts but follower count stays incremented.</li>
  <li>Fix: keep <code>update</code> minimal; let Apollo handle optimistic rollback for the entity itself.</li>
</ul>

<h3>Cache leaking across users</h3>
<ul>
  <li>User A logs out; user B logs in same device → user B sees user A's cached data.</li>
  <li>Always <code>client.clearStore()</code> + <code>persistor.purge()</code> on logout.</li>
  <li>SSR: per-request cache; never share server-side cache across requests.</li>
</ul>

<h3>SSR cache leaking through CDN</h3>
<ul>
  <li>SSR extracts cache; serializes into HTML; ships to CDN; next user's request hits cached HTML.</li>
  <li>Personal data appears for unrelated users.</li>
  <li>Fix: per-user pages should have <code>Cache-Control: private</code> or be SSR'd per request without CDN cache.</li>
</ul>

<h3>Persistence quota</h3>
<ul>
  <li>Without <code>maxSize</code>, persisted cache grows indefinitely; hit RN AsyncStorage limits or browser quota.</li>
  <li>Symptom: app crashes on persistence; quota exceeded errors.</li>
  <li>Fix: <code>maxSize</code> in CachePersistor; trigger eviction at 80%.</li>
</ul>

<h3>Cache size in Apollo InMemoryCache</h3>
<ul>
  <li>InMemoryCache has no built-in size limit — entities accumulate forever in memory.</li>
  <li>Long-lived sessions on mobile: memory pressure → JS crashes.</li>
  <li>Periodically <code>cache.gc()</code> + selectively <code>cache.evict</code> stale entities.</li>
  <li>Apollo Client 3.8+ supports <code>cache.gc({ resetResultCache: true })</code> for deeper cleanup.</li>
</ul>

<h3>Reactive vars + persistence</h3>
<ul>
  <li><code>makeVar</code> values aren't persisted by default — they reset on app boot.</li>
  <li>For per-user state that should survive (cart, theme), persist separately + restore.</li>
</ul>

<h3>Mutation cache update with stale snapshot</h3>
<ul>
  <li>If you read existing data inside <code>update</code> and pass into the new state, race conditions can yield stale data.</li>
  <li>Use cache modifiers' callback form (existing → next) over reading + writing.</li>
</ul>

<h3>Refetch after mutation invalidates everything</h3>
<ul>
  <li><code>refetchQueries: ['ALL_FEED', 'STATS', 'NOTIFICATIONS']</code> kills network on every mutation.</li>
  <li>Prefer cache.modify; reserve refetch for cases where logic is too complex.</li>
</ul>

<h3>Cache restore on schema change</h3>
<ul>
  <li>You ship v2 of your schema; client cache has v1 shape.</li>
  <li>On restore, queries match v2 schema; cached data has v1 fields → null + warning.</li>
  <li>Fix: version cache; nuke on schema mismatch on app boot.</li>
</ul>

<h3>Multi-tab sync</h3>
<ul>
  <li>Two tabs both have Apollo Client; mutation in tab A doesn't update tab B.</li>
  <li>Use <code>BroadcastChannel</code> to notify other tabs; they invalidate / refetch.</li>
  <li>Or share state via SW + push events.</li>
</ul>

<h3>RN angle</h3>
<ul>
  <li>InMemoryCache lives in JS heap; large caches → memory pressure.</li>
  <li>MMKV-backed persistence is faster than AsyncStorage; recommended.</li>
  <li>Background reload may clear cache; persist explicitly on background.</li>
  <li>Multi-app-version: schema migration may require nuking persisted cache on first launch of new version.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common GraphQL caching mistakes</h3>
<ol>
  <li><strong>No <code>id</code> selected.</strong> Cache duplicates records; mutations don't propagate.</li>
  <li><strong>No <code>keyFields</code> for non-id entities.</strong> Same as above for slug / email / composite-key types.</li>
  <li><strong>No merge function on connections.</strong> Pagination overwrites instead of appending.</li>
  <li><strong>Optimistic without <code>__typename</code>.</strong> Cache can't merge.</li>
  <li><strong>Refetch instead of cache.modify.</strong> Wasted network round trips.</li>
  <li><strong>Mutation returns Boolean.</strong> Forces refetch.</li>
  <li><strong>SSR cache shared across requests.</strong> Data leak between users.</li>
  <li><strong>Persistence without <code>maxSize</code>.</strong> Mobile storage exhaustion.</li>
  <li><strong>Forgot to clear cache on logout.</strong> Next user sees previous user's data.</li>
  <li><strong>Reactive vars used as global state without persistence.</strong> Resets on reload.</li>
  <li><strong>cache.modify reading + writing in two steps.</strong> Race conditions.</li>
  <li><strong>No DevTools usage.</strong> Cache bugs invisible until users report.</li>
</ol>

<h3>Anti-pattern: missing id</h3>
<pre><code class="language-graphql">// BAD
query { user(id: "1") { name email } }

// GOOD
query { user(id: "1") { id name email } }
</code></pre>

<h3>Anti-pattern: missing keyFields</h3>
<pre><code class="language-typescript">// Type uses slug, not id
type Post {
  slug: ID!
  title: String!
}

// BAD — no normalization
new InMemoryCache({});

// GOOD
new InMemoryCache({
  typePolicies: {
    Post: { keyFields: ['slug'] },
  },
});
</code></pre>

<h3>Anti-pattern: pagination overwriting</h3>
<pre><code class="language-typescript">// BAD — fetchMore replaces existing
typePolicies: {
  Query: {
    fields: {
      feed: {
        merge(existing, incoming) { return incoming; }
      },
    },
  },
}

// GOOD
typePolicies: {
  Query: {
    fields: {
      feed: {
        keyArgs: false,
        merge(existing = { edges: [] }, incoming, { args }) {
          if (!args?.after) return incoming;
          return { ...incoming, edges: [...existing.edges, ...incoming.edges] };
        },
      },
    },
  },
}
</code></pre>

<h3>Anti-pattern: optimistic without typename</h3>
<pre><code class="language-typescript">// BAD
optimisticResponse: {
  likePost: {
    post: { id: '1', hasLiked: true, likeCount: 5 },
  },
}

// GOOD
optimisticResponse: {
  likePost: {
    __typename: 'LikePostPayload',
    post: {
      __typename: 'Post',
      id: '1',
      hasLiked: true,
      likeCount: 5,
    },
  },
}
</code></pre>

<h3>Anti-pattern: refetch over cache update</h3>
<pre><code class="language-typescript">// BAD — wastes network
useMutation(CREATE_POST, {
  refetchQueries: ['GetFeed'],
});

// GOOD — cache.modify
useMutation(CREATE_POST, {
  update(cache, { data }) {
    cache.modify({
      fields: {
        feed(existing) {
          const newRef = cache.writeFragment({ data: data.createPost.post, fragment: F });
          return { ...existing, edges: [{ node: newRef }, ...existing.edges] };
        },
      },
    });
  },
});
</code></pre>

<h3>Anti-pattern: shared SSR cache</h3>
<pre><code class="language-typescript">// BAD — module-level singleton; shared across requests
let apolloClient = new ApolloClient({ /* ... */ });

// GOOD — per-request on server
function initializeApollo(initialState) {
  if (typeof window === 'undefined') {
    return new ApolloClient({ /* ... */ });
  }
  // client-side: reuse
  if (!apolloClient) apolloClient = new ApolloClient({ /* ... */ });
  if (initialState) apolloClient.cache.restore(initialState);
  return apolloClient;
}
</code></pre>

<h3>Anti-pattern: persistence without size limit</h3>
<pre><code class="language-typescript">// BAD — unbounded growth
await persistCache({ cache, storage });

// GOOD — capped
await persistCache({
  cache,
  storage,
  maxSize: 5 * 1024 * 1024,
});
</code></pre>

<h3>Anti-pattern: no logout cleanup</h3>
<pre><code class="language-typescript">// BAD
function logout() {
  navigate('/login');
}

// GOOD
async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  await client.clearStore();
  await persistor.purge();
  navigate('/login');
}
</code></pre>

<h3>Anti-pattern: reactive vars without persistence</h3>
<pre><code class="language-typescript">// BAD — cart resets on app reload
const cartCount = makeVar(0);

// GOOD — persist + restore
const cartCount = makeVar(loadCartFromStorage());
useEffect(() =&gt; {
  const sub = subscribe(cartCount, (v) =&gt; saveCartToStorage(v));
  return () =&gt; sub.unsubscribe();
}, []);
</code></pre>

<h3>Anti-pattern: read + write race</h3>
<pre><code class="language-typescript">// BAD — read existing, then write; concurrent updates clobber
const existing = cache.readQuery({ query: FEED });
cache.writeQuery({ query: FEED, data: { feed: [...existing.feed, newPost] } });

// GOOD — use cache.modify with callback (sees latest state)
cache.modify({
  fields: {
    feed(existing) {
      return [...existing, newPost];
    },
  },
});
</code></pre>

<h3>Anti-pattern: never opening DevTools</h3>
<p>Apollo Client DevTools shows live cache state, every query / mutation, optimistic layer, evictions. Engineers who never open it ship cache bugs that surface as "stale data" reports months later.</p>

<h3>Anti-pattern: mixing fetch policies inconsistently</h3>
<pre><code class="language-typescript">// BAD — same query with different policies in different places; cache state inconsistent
useQuery(GET_USER, { fetchPolicy: 'cache-first' });
useQuery(GET_USER, { fetchPolicy: 'no-cache' }); // doesn't write back

// GOOD — pick one policy per query, document it
const useUser = (id) =&gt; useQuery(GET_USER, { variables: { id }, fetchPolicy: 'cache-and-network' });
</code></pre>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common GraphQL caching interview prompts</h3>
<ol>
  <li>Walk through how Apollo's normalized cache works.</li>
  <li>Compare normalized vs document caching.</li>
  <li>How do you implement pagination with custom merge functions?</li>
  <li>How do you ensure mutations update the cache correctly?</li>
  <li>How do you handle SSR cache extraction without leaking data?</li>
  <li>How do you persist cache on mobile?</li>
  <li>What's the difference between fetch policies?</li>
  <li>Tell me about a cache bug you debugged.</li>
</ol>

<h3>The 5-step framework for "design our cache strategy"</h3>
<ol>
  <li><strong>Identify entities + their keys:</strong> default <code>id</code>; configure <code>keyFields</code> for slug / email / composite.</li>
  <li><strong>Identify lists / connections:</strong> add merge functions; choose <code>keyArgs</code> per filter.</li>
  <li><strong>Plan mutation updates:</strong> let Apollo auto-update by id where possible; cache.modify for lists / derived counts.</li>
  <li><strong>Plan persistence:</strong> apollo3-cache-persist with size cap; trigger on background.</li>
  <li><strong>Plan logout / multi-user:</strong> clearStore + purge; per-request SSR cache.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"Normalized cache by default — Apollo / Relay store entities by <code>__typename + id</code>; mutation to one record updates everywhere. Document cache (Urql default) caches by query string, simpler but duplicates data."</em></li>
  <li><em>"<code>keyFields</code> in typePolicies for non-id entities; without it Apollo can't normalize; mutations fail to propagate."</em></li>
  <li><em>"Merge functions for connections: <code>keyArgs: false</code> + custom merge appends edges on <code>fetchMore</code>; without it pagination overwrites."</em></li>
  <li><em>"<code>cache.modify</code> for surgical updates over <code>refetchQueries</code> — saves network round trips."</em></li>
  <li><em>"Optimistic responses with <code>__typename</code> on every entity; Apollo merges by id; auto-rollback on error."</em></li>
  <li><em>"Persistence on mobile: apollo3-cache-persist + MMKV + maxSize cap to avoid quota exhaustion."</em></li>
  <li><em>"Per-request SSR cache via initializeApollo; sharing across requests leaks data between users."</em></li>
  <li><em>"clearStore on logout + persistor.purge; multi-user device safety."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"mutation doesn't update screen"</td><td>Check <code>id</code> + <code>__typename</code>; verify mutation returns affected entity</td></tr>
    <tr><td>"infinite scroll broken"</td><td>Check merge function + keyArgs in typePolicies</td></tr>
    <tr><td>"slug-based entities"</td><td>typePolicies with <code>keyFields: ['slug']</code></td></tr>
    <tr><td>"persisted cache on mobile"</td><td>apollo3-cache-persist + MMKV + maxSize</td></tr>
    <tr><td>"data leaks between users"</td><td>clearStore on logout; per-request SSR cache</td></tr>
    <tr><td>"optimistic UI"</td><td>optimisticResponse with __typename + cache merges by id</td></tr>
    <tr><td>"derived count not updating"</td><td>cache.modify with field updater</td></tr>
    <tr><td>"client-only state"</td><td>Reactive vars (makeVar) + useReactiveVar</td></tr>
  </tbody>
</table>

<h3>Demo script</h3>
<ol>
  <li>Show a typePolicies config with keyFields, merge, read.</li>
  <li>Show one mutation with optimistic response + auto cache update by id.</li>
  <li>Show one cache.modify for adding to a list.</li>
  <li>Show evict + gc after delete.</li>
  <li>Talk SSR + persistence flows.</li>
  <li>Address logout cleanup.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"Schema-aware cache codegen for typePolicies."</em></li>
  <li><em>"apollo3-cache-persist with MMKV on RN + maxSize."</em></li>
  <li><em>"cache.modify utilities library for common patterns."</em></li>
  <li><em>"Multi-tab cache sync via BroadcastChannel."</em></li>
  <li><em>"Background cache cleanup task on app idle."</em></li>
  <li><em>"Persisted query manifest at build time → CDN cache hit."</em></li>
  <li><em>"Schema version stamp in cache; nuke on mismatch."</em></li>
  <li><em>"DevTools-style cache snapshot diff in CI."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Normalization fluency</td><td>Selects id + __typename; configures keyFields</td></tr>
    <tr><td>Pagination handling</td><td>typePolicies merge + keyArgs deliberate</td></tr>
    <tr><td>Mutation discipline</td><td>cache.modify over refetchQueries</td></tr>
    <tr><td>Optimistic technique</td><td>__typename everywhere; let Apollo auto-merge</td></tr>
    <tr><td>SSR safety</td><td>Per-request cache; no shared singleton</td></tr>
    <tr><td>Persistence awareness</td><td>maxSize cap; trigger on background</td></tr>
    <tr><td>Multi-user safety</td><td>clearStore + purge on logout</td></tr>
    <tr><td>DevTools usage</td><td>Inspects cache regularly</td></tr>
    <tr><td>Restraint</td><td>Doesn't reach for global cache invalidation</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>InMemoryCache lives in JS heap; large caches → memory pressure on low-end devices.</li>
  <li>MMKV-backed persistence is ~10× faster than AsyncStorage.</li>
  <li>Trigger persist on app background — last write before suspended.</li>
  <li>Schema version stamp; nuke cache on app version upgrade if shape changed.</li>
  <li>Optimistic UI is mandatory — cellular users can't wait round trips.</li>
  <li>Use <code>cache-and-network</code> on critical screens — instant render + background freshness.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"How does Apollo know two queries return the same entity?"</em> — By <code>__typename + id</code> (or whatever <code>keyFields</code> says). The cache stores entities by that key; queries become references to entities.</li>
  <li><em>"What does <code>keyArgs: false</code> mean?"</em> — "Treat this field as one cache entry regardless of arguments." Used for paginated lists where pagination args shouldn't fragment the cache.</li>
  <li><em>"How would you implement infinite scroll?"</em> — typePolicies merge function appends edges; <code>fetchMore</code> with new <code>after</code> cursor; trigger via IntersectionObserver.</li>
  <li><em>"How do you ensure cache doesn't leak between users?"</em> — <code>clearStore</code> + <code>persistor.purge</code> on logout; per-request SSR cache; no module-level singleton on server.</li>
  <li><em>"What's the difference between <code>cache.evict</code> and <code>cache.modify</code>?"</em> — Evict removes the entity entirely; modify changes specific fields. After evict, run <code>cache.gc()</code> to remove orphaned children.</li>
  <li><em>"How does <code>cache-and-network</code> differ from <code>cache-first</code>?"</em> — cache-first returns cache if complete; doesn't fetch. cache-and-network returns cache <em>and</em> fetches; updates UI on response.</li>
  <li><em>"How do you handle a schema change that renames a field?"</em> — Server keeps both during deprecation; client codegen regenerates; old cache data may have old field name → null on read; nuke cache on app version upgrade.</li>
  <li><em>"How would you implement optimistic UI for a mutation that adds to a list?"</em> — optimisticResponse with __typename + temporary id; <code>update</code> writes to the list field; on real response Apollo replaces; on error the optimistic write is undone.</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Build a small Apollo app with paginated feed + likes + comments + create/delete.</li>
  <li>Configure typePolicies for keyFields + pagination merge.</li>
  <li>Wire optimistic UI + cache.modify.</li>
  <li>Set up cache persistence with apollo3-cache-persist + MMKV.</li>
  <li>Open Apollo DevTools; trace every mutation's cache effects.</li>
  <li>Read Apollo's "Caching" docs end to end.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read the Apollo InMemoryCache source — typePolicies + writeQuery + readQuery internals."</li>
  <li>"Compare Apollo vs Relay vs Urql graphcache normalization details."</li>
  <li>"Audit a real codebase's cache config — find missing keyFields / merge functions."</li>
  <li>"Build a cache-debugging dashboard that visualizes the entity store."</li>
</ul>
`
    }
  ]
});
