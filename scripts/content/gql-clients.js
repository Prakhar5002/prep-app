window.PREP_SITE.registerTopic({
  id: 'gql-clients',
  module: 'graphql',
  title: 'Client Libraries',
  estimatedReadTime: '50 min',
  tags: ['graphql', 'apollo-client', 'relay', 'urql', 'graphql-request', 'tanstack-query', 'codegen', 'cache'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>The <strong>GraphQL client library</strong> is the runtime that turns a query string into a hook your component calls and a cache that survives across screens. It handles transport, cache normalization, request deduplication, optimistic updates, subscriptions, codegen integration, and devtools. Picking the right one shapes your DX more than the schema does.</p>
<ul>
  <li><strong>The big four:</strong> <strong>Apollo Client</strong> (most popular; full-featured), <strong>Relay</strong> (Meta's; opinionated, fragment-first, performance-tuned), <strong>Urql</strong> (lightweight; modular), <strong>TanStack Query + graphql-request</strong> (minimal; you bring caching).</li>
  <li><strong>What clients give you:</strong> hooks (<code>useQuery</code> / <code>useMutation</code> / <code>useSubscription</code>), normalized cache, request batching, optimistic updates, error policies, polling, refetch.</li>
  <li><strong>Codegen is non-negotiable.</strong> <code>graphql-codegen</code> generates per-query TypeScript types so renames / removals fail at compile time.</li>
  <li><strong>Apollo defaults:</strong> in-memory normalized cache, automatic <code>__typename</code> injection, batched HTTP, subscription split-link, devtools.</li>
  <li><strong>Relay defaults:</strong> compiler-driven; fragment masking; suspense-first; powerful but steep learning curve.</li>
  <li><strong>Urql defaults:</strong> document cache by default; switch to graphcache for normalized; tiny bundle.</li>
  <li><strong>TanStack + graphql-request:</strong> manual cache via TanStack Query keys; no normalization; cheapest option for small / hybrid apps.</li>
  <li><strong>RN angle:</strong> all four work in RN; persisted queries + offline-aware cache critical.</li>
</ul>
<p><strong>Mantra:</strong> "Pick by app shape: Apollo for ecosystem; Relay for performance discipline; Urql for lightness; TanStack + request when GraphQL is just one of many APIs."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What a client library actually does</h3>
<table>
  <thead><tr><th>Layer</th><th>Responsibility</th></tr></thead>
  <tbody>
    <tr><td>Transport</td><td>HTTP POST, batched HTTP, WebSocket / SSE for subscriptions</td></tr>
    <tr><td>Request lifecycle</td><td>Send, cancel, retry, deduplicate concurrent requests</td></tr>
    <tr><td>Cache</td><td>Normalize by id; track which queries are watching which records</td></tr>
    <tr><td>Optimistic UI</td><td>Apply expected mutation result immediately; rollback on error</td></tr>
    <tr><td>Reactivity</td><td>Re-render components when their cached data changes</td></tr>
    <tr><td>Codegen integration</td><td>Type-safe hooks generated from schema + queries</td></tr>
    <tr><td>Devtools</td><td>Browser extension to inspect cache + network</td></tr>
  </tbody>
</table>

<h3>The big four in one table</h3>
<table>
  <thead><tr><th></th><th>Apollo Client</th><th>Relay</th><th>Urql</th><th>TanStack + graphql-request</th></tr></thead>
  <tbody>
    <tr><td>Bundle size</td><td>~32 KB gz</td><td>~26 KB gz + compiler</td><td>~6 KB core, +12 graphcache</td><td>~13 KB TanStack + 2 KB graphql-request</td></tr>
    <tr><td>Normalized cache</td><td>Default</td><td>Default + compiler-validated</td><td>Optional via graphcache</td><td>None — query-key-based</td></tr>
    <tr><td>Codegen</td><td>graphql-codegen with apollo plugin</td><td>relay-compiler (built-in)</td><td>graphql-codegen with urql plugin</td><td>graphql-codegen with TanStack plugin</td></tr>
    <tr><td>Subscriptions</td><td>splitLink + wsLink</td><td>built-in transport hooks</td><td>subscriptionExchange</td><td>via separate WS lib</td></tr>
    <tr><td>Optimistic UI</td><td>optimisticResponse + update</td><td>optimisticUpdater</td><td>cacheExchange.optimistic</td><td>onMutate + setQueryData</td></tr>
    <tr><td>SSR support</td><td>Strong</td><td>Strong (compiler-driven)</td><td>Strong</td><td>Strong (TanStack)</td></tr>
    <tr><td>Suspense</td><td>v3.8+ supports</td><td>First-class</td><td>useQuery suspense option</td><td>TanStack suspense option</td></tr>
    <tr><td>Learning curve</td><td>Moderate</td><td>Steep</td><td>Gentle</td><td>Gentle if you know TanStack</td></tr>
    <tr><td>Ecosystem</td><td>Largest</td><td>Meta + community</td><td>Growing</td><td>Tiny (intentionally)</td></tr>
  </tbody>
</table>

<h3>Why pick Apollo Client</h3>
<ul>
  <li>Largest ecosystem — Apollo Studio, Federation, Server, Client all integrate.</li>
  <li>Best devtools (Apollo DevTools browser extension).</li>
  <li>Sensible defaults; gets you running in 10 minutes.</li>
  <li>Mature optimistic UI patterns; cache.modify is powerful.</li>
  <li>Server + client from the same team; bug fixes flow together.</li>
</ul>

<h3>Why pick Relay</h3>
<ul>
  <li>Battle-tested at Meta scale.</li>
  <li>Compiler enforces schema correctness at build time.</li>
  <li>Fragment masking — components only see the fields they declared.</li>
  <li>Suspense-first; integrates with React 18+ concurrent features cleanly.</li>
  <li>Performance discipline by default — connections, refetchable fragments, etc.</li>
  <li>Strong opinions = team consistency.</li>
</ul>

<h3>Why pick Urql</h3>
<ul>
  <li>Tiny bundle (6KB core).</li>
  <li>Modular: pick caches, exchanges, subscription transports independently.</li>
  <li>Document cache (default) is simpler than normalized; faster to onboard.</li>
  <li>Graphcache opt-in when you need normalization.</li>
  <li>SSR support clean.</li>
  <li>Maintained by Formidable Labs; transparent roadmap.</li>
</ul>

<h3>Why pick TanStack Query + graphql-request</h3>
<ul>
  <li>You already use TanStack Query for REST; one library across all APIs.</li>
  <li>No normalized cache — query keys are the cache.</li>
  <li>Smallest mental model; great for teams that mostly do REST.</li>
  <li>Best when GraphQL is one endpoint among many, not the architecture.</li>
</ul>

<h3>What "good GraphQL client setup" looks like</h3>
<ul>
  <li>Codegen wired into the build — types per query.</li>
  <li>Single client instance shared across the app.</li>
  <li>Cache normalization configured (typePolicies / keyFields).</li>
  <li>Optimistic UI for high-frequency mutations.</li>
  <li>Persisted queries for production builds.</li>
  <li>Subscription transport configured if needed.</li>
  <li>Error link / exchange for global error handling.</li>
  <li>SSR / hydration story documented.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The Apollo Client architecture</h3>
<pre><code class="language-text">Component
   ↓ useQuery / useMutation / useSubscription
ApolloClient
   ├── InMemoryCache       (normalized by __typename + id)
   └── Link chain
        ├── errorLink      (catch top-level errors)
        ├── authLink       (inject Authorization header)
        ├── retryLink      (exponential backoff)
        ├── splitLink      (subscriptions → WS, queries/mutations → HTTP)
        ├── batchHttpLink  (combine concurrent requests)
        └── wsLink         (graphql-ws)
                ↓
              Network
</code></pre>

<h3>The Relay architecture</h3>
<pre><code class="language-text">Components (declare fragments)
   ↓
Relay Compiler (build-time)
   ├── Validates fragments against schema
   ├── Generates types
   └── Outputs persisted query manifest
        ↓
Environment (runtime)
   ├── Store (normalized record map)
   ├── Network (fetch function — you provide)
   └── Subscriptions (you provide transport)
</code></pre>

<h3>The Urql architecture</h3>
<pre><code class="language-text">Component
   ↓ useQuery / useMutation
Client
   └── Exchange chain
        ├── cacheExchange       (document or graphcache)
        ├── authExchange        (token injection + refresh)
        ├── retryExchange       (custom retry policy)
        ├── ssrExchange         (server-side rendering)
        ├── subscriptionExchange (graphql-ws or sse)
        └── fetchExchange       (HTTP)
                ↓
              Network
</code></pre>
<p><strong>Note:</strong> as of urql v4, request deduplication is built into the <code>Client</code> itself — there's no more <code>dedupExchange</code> to add to the chain.</p>

<h3>The TanStack Query approach</h3>
<pre><code class="language-text">Component
   ↓ useQuery (key = ['user', id])
QueryClient (caches by key)
   └── queryFn = async () =&gt; gqlRequest(GET_USER, { id })
        ↓
graphql-request → fetch → server
</code></pre>
<p>Cache keys are explicit; no automatic normalization. Trade simplicity for fewer features.</p>

<h3>Cache normalization vs document caching</h3>
<table>
  <thead><tr><th>Style</th><th>How it works</th><th>Pros</th><th>Cons</th></tr></thead>
  <tbody>
    <tr><td>Normalized</td><td>Each entity stored by <code>__typename + id</code>; queries reference shape</td><td>Mutation to one record updates everywhere; less storage</td><td>Setup complexity; type policies needed</td></tr>
    <tr><td>Document</td><td>Whole query response cached by query+vars hash</td><td>Simple mental model; fast lookup</td><td>Same record duplicated across queries; updates need invalidation</td></tr>
  </tbody>
</table>

<h3>Codegen — the connective tissue</h3>
<p><strong>graphql-codegen</strong> reads your schema + your queries → generates TypeScript types + (optionally) typed hooks.</p>
<pre><code class="language-yaml"># codegen.yml
schema: 'http://localhost:4000/graphql'
documents: 'src/**/*.{ts,tsx,graphql}'
generates:
  src/gql/:
    preset: client
    plugins: []
  src/gql/operations.ts:
    plugins:
      - typescript
      - typescript-operations
      - typescript-react-apollo  # or urql / relay / tanstack equivalents
</code></pre>

<p>Generated output:</p>
<pre><code class="language-typescript">// generated
export type GetUserQuery = { user: { id: string; name: string; avatarUrl: string } };
export type GetUserQueryVariables = { id: string };

export function useGetUserQuery(opts: QueryHookOptions&lt;GetUserQuery, GetUserQueryVariables&gt;) {
  return useQuery&lt;GetUserQuery, GetUserQueryVariables&gt;(GET_USER_QUERY, opts);
}
</code></pre>

<p>Now consumer code is fully type-safe; renames in the schema break the build.</p>

<h3>Optimistic UI — the four-layer pattern</h3>
<pre><code class="language-typescript">await mutate({
  variables: { id, like: true },
  optimisticResponse: {
    likePost: {
      __typename: 'LikePostPayload',
      post: {
        __typename: 'Post',
        id,
        likeCount: currentCount + 1,
        hasLiked: true,
      },
    },
  },
  update(cache, { data }) {
    cache.modify({
      id: cache.identify({ __typename: 'Post', id }),
      fields: {
        likeCount: () =&gt; data.likePost.post.likeCount,
        hasLiked: () =&gt; data.likePost.post.hasLiked,
      },
    });
  },
});
</code></pre>

<p>Steps:</p>
<ol>
  <li>Fire mutation with <code>optimisticResponse</code>.</li>
  <li>Apollo applies optimistic data to cache immediately.</li>
  <li>Server response arrives; replaces optimistic data.</li>
  <li>If error, optimistic data rolled back.</li>
</ol>

<h3>Polling vs subscriptions vs refetch</h3>
<table>
  <thead><tr><th>Pattern</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td>Polling (interval)</td><td>Low-frequency updates; non-realtime</td></tr>
    <tr><td>Subscription</td><td>True realtime cross-client (chat, presence)</td></tr>
    <tr><td>Manual refetch</td><td>After action where staleness is briefly OK</td></tr>
    <tr><td>Cache update from mutation</td><td>Most common — mutation returns affected entity, cache updates by id</td></tr>
  </tbody>
</table>

<h3>The fetch policies (Apollo)</h3>
<table>
  <thead><tr><th>Policy</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td><code>cache-first</code> (default)</td><td>Use cache if available; fetch if not</td></tr>
    <tr><td><code>cache-and-network</code></td><td>Return cache + fire request; update on response</td></tr>
    <tr><td><code>network-only</code></td><td>Always fetch; update cache</td></tr>
    <tr><td><code>no-cache</code></td><td>Fetch; don't write to cache</td></tr>
    <tr><td><code>cache-only</code></td><td>Cache or error; never fetch</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Apollo Client setup</h3>
<p><strong>Note:</strong> as of Apollo Client 4 (Sept 2025), the React hooks import from <code>@apollo/client/react</code> (not <code>@apollo/client</code>). v4 ships a smaller (~24 KB) React-decoupled core, so the client + cache still come from <code>@apollo/client</code> while <code>useQuery</code>/<code>useMutation</code>/<code>ApolloProvider</code> move to the <code>/react</code> entry point.</p>
<pre><code class="language-typescript">import { ApolloClient, InMemoryCache, from } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { split } from '@apollo/client';

const httpLink = createHttpLink({ uri: '/graphql' });

const wsLink = new GraphQLWsLink(createClient({
  url: 'wss://api.example.com/graphql',
  connectionParams: () =&gt; ({ Authorization: \`Bearer \${getToken()}\` }),
}));

const splitLink = split(
  ({ query }) =&gt; {
    const def = getMainDefinition(query);
    return def.kind === 'OperationDefinition' &amp;&amp; def.operation === 'subscription';
  },
  wsLink,
  httpLink,
);

const authLink = setContext((_, { headers }) =&gt; ({
  headers: {
    ...headers,
    Authorization: \`Bearer \${getToken()}\`,
  },
}));

const errorLink = onError(({ graphQLErrors, networkError }) =&gt; {
  graphQLErrors?.forEach((e) =&gt; logError(e));
  if (networkError) logNetworkError(networkError);
});

const client = new ApolloClient({
  link: from([errorLink, new RetryLink(), authLink, splitLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Post: {
        fields: {
          // Custom merge function for paginated comments
          comments: {
            keyArgs: false,
            merge(existing, incoming) {
              return {
                ...incoming,
                edges: [...(existing?.edges ?? []), ...incoming.edges],
              };
            },
          },
        },
      },
    },
  }),
});

function App() {
  return &lt;ApolloProvider client={client}&gt;&lt;Routes /&gt;&lt;/ApolloProvider&gt;;
}
</code></pre>

<h3>Apollo: useQuery / useMutation / useSubscription</h3>
<pre><code class="language-typescript">import { useQuery, useMutation, useSubscription } from '@apollo/client/react';
import { GET_USER, UPDATE_USER, ON_NEW_COMMENT } from './queries';

function UserCard({ id }: { id: string }) {
  const { data, loading, error, refetch } = useQuery(GET_USER, {
    variables: { id },
    fetchPolicy: 'cache-and-network',
  });

  const [updateUser, { loading: saving }] = useMutation(UPDATE_USER, {
    update(cache, { data }) {
      // cache auto-updates by id; no manual work needed for this case
    },
    onError(err) { logError(err); },
  });

  const { data: comments } = useSubscription(ON_NEW_COMMENT, {
    variables: { postId: id },
  });

  if (loading &amp;&amp; !data) return &lt;Spinner /&gt;;
  if (error) return &lt;Error error={error} /&gt;;

  return /* ... */;
}
</code></pre>

<h3>Apollo: cache.modify for surgical updates</h3>
<pre><code class="language-typescript">// After deleting a post, remove it from the feed
const [deletePost] = useMutation(DELETE_POST, {
  update(cache, { data }, { variables }) {
    cache.modify({
      fields: {
        feed(existing, { readField }) {
          return {
            ...existing,
            edges: existing.edges.filter(
              (edge: any) =&gt; readField('id', edge.node) !== variables.id
            ),
          };
        },
      },
    });
    // Also evict the post itself from cache
    cache.evict({ id: cache.identify({ __typename: 'Post', id: variables.id }) });
    cache.gc();
  },
});
</code></pre>

<h3>Apollo: optimistic UI for like / unlike</h3>
<pre><code class="language-typescript">async function onLike(post: Post) {
  await likePost({
    variables: { id: post.id, like: !post.hasLiked },
    optimisticResponse: {
      likePost: {
        __typename: 'LikePostPayload',
        post: {
          __typename: 'Post',
          id: post.id,
          hasLiked: !post.hasLiked,
          likeCount: post.likeCount + (post.hasLiked ? -1 : 1),
        },
      },
    },
  });
}
</code></pre>
<p>Apollo applies the optimistic data immediately; UI updates instantly. Server response replaces; rollback on error.</p>

<h3>Relay setup</h3>
<pre><code class="language-typescript">// RelayEnvironment.ts
import { Environment, Network, RecordSource, Store } from 'relay-runtime';

async function fetchQuery(operation, variables) {
  const response = await fetch('/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${getToken()}\`,
    },
    body: JSON.stringify({
      query: operation.text, // or operation.id with persisted queries
      variables,
    }),
  });
  return response.json();
}

export const RelayEnv = new Environment({
  network: Network.create(fetchQuery),
  store: new Store(new RecordSource()),
});
</code></pre>

<h3>Relay: fragment-first component</h3>
<pre><code class="language-typescript">import { graphql, useFragment } from 'react-relay';

const userCardFragment = graphql\`
  fragment UserCard_user on User {
    id
    name
    avatarUrl
  }
\`;

function UserCard({ user }: { user: UserCard_user$key }) {
  const data = useFragment(userCardFragment, user);
  return (
    &lt;div&gt;
      &lt;img src={data.avatarUrl} /&gt;
      &lt;span&gt;{data.name}&lt;/span&gt;
    &lt;/div&gt;
  );
}
</code></pre>

<p>The component declares its data needs as a fragment; the parent passes the fragment ref. Relay <em>masks</em> data so the component can only see what it declared.</p>

<h3>Relay: query loader + suspense</h3>
<pre><code class="language-typescript">const profileQuery = graphql\`
  query ProfileQuery($id: ID!) {
    user(id: $id) {
      ...UserCard_user
      bio
    }
  }
\`;

function ProfileScreen({ id }) {
  const data = useLazyLoadQuery&lt;ProfileQuery&gt;(profileQuery, { id });
  return (
    &lt;Suspense fallback={&lt;Spinner /&gt;}&gt;
      &lt;UserCard user={data.user} /&gt;
      &lt;p&gt;{data.user.bio}&lt;/p&gt;
    &lt;/Suspense&gt;
  );
}
</code></pre>

<h3>Urql setup</h3>
<pre><code class="language-typescript">import { createClient, Provider, fetchExchange, cacheExchange } from 'urql';

const client = createClient({
  url: '/graphql',
  fetchOptions: () =&gt; ({
    headers: { Authorization: \`Bearer \${getToken()}\` },
  }),
  // urql v4: dedup is built into the Client — no dedupExchange needed
  exchanges: [cacheExchange, fetchExchange],
});

function App() {
  return &lt;Provider value={client}&gt;&lt;Routes /&gt;&lt;/Provider&gt;;
}
</code></pre>

<h3>Urql: useQuery</h3>
<pre><code class="language-typescript">import { useQuery, useMutation } from 'urql';

function UserCard({ id }) {
  const [{ data, fetching, error }] = useQuery({
    query: GET_USER,
    variables: { id },
  });

  const [, updateUser] = useMutation(UPDATE_USER);

  return /* ... */;
}
</code></pre>

<h3>Urql: graphcache for normalized cache</h3>
<pre><code class="language-typescript">import { cacheExchange } from '@urql/exchange-graphcache';

const cache = cacheExchange({
  keys: {
    Post: (data) =&gt; data.id, // default; can customize
  },
  resolvers: {
    Query: {
      // Cursor-based pagination
      feed: relayPagination(),
    },
  },
  updates: {
    Mutation: {
      deletePost(_result, args, cache) {
        cache.invalidate({ __typename: 'Post', id: args.id });
      },
    },
  },
  optimistic: {
    likePost(args, cache) {
      const post = cache.readFragment(LIKE_FRAGMENT, { id: args.id });
      return {
        __typename: 'LikePostPayload',
        post: {
          ...post,
          hasLiked: !post.hasLiked,
          likeCount: post.likeCount + (post.hasLiked ? -1 : 1),
        },
      };
    },
  },
});
</code></pre>

<h3>TanStack Query + graphql-request</h3>
<pre><code class="language-typescript">import { GraphQLClient } from 'graphql-request';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const gqlClient = new GraphQLClient('/graphql', {
  headers: () =&gt; ({ Authorization: \`Bearer \${getToken()}\` }),
});

function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () =&gt; gqlClient.request(GET_USER, { id }),
  });
}

function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserInput) =&gt; gqlClient.request(UPDATE_USER, { input }),
    onSuccess(data, vars) {
      qc.invalidateQueries({ queryKey: ['user', vars.id] });
    },
  });
}
</code></pre>

<h3>Codegen with graphql-codegen</h3>
<pre><code class="language-bash">npm install -D @graphql-codegen/cli @graphql-codegen/client-preset
</code></pre>

<pre><code class="language-yaml"># codegen.ts
import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'http://localhost:4000/graphql',
  documents: ['src/**/*.{ts,tsx}', '!src/gql/**/*'],
  generates: {
    './src/gql/': {
      preset: 'client',
      config: { documentMode: 'string' },
    },
  },
};
export default config;
</code></pre>

<pre><code class="language-typescript">// usage with the client preset
import { graphql } from '@/gql';

const GetUser = graphql(\`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      avatarUrl
    }
  }
\`);

const { data } = useQuery(GetUser, { variables: { id } });
// data is fully typed: { user: { id: string; name: string; avatarUrl: string } }
</code></pre>

<h3>Persisted queries</h3>
<pre><code class="language-typescript">// Apollo
import { createPersistedQueryLink } from '@apollo/client/link/persisted-queries';
import { sha256 } from 'crypto-hash';

const persistedLink = createPersistedQueryLink({
  sha256,
  useGETForHashedQueries: true,
});

const link = from([persistedLink, httpLink]);
</code></pre>

<p>Production builds: ship a <em>manifest</em> of approved queries (hash → query string). Server only honors known hashes. Locks the API surface; eliminates ad-hoc queries from clients.</p>

<h3>SSR with Apollo (Next.js example)</h3>
<pre><code class="language-typescript">// pages/_app.tsx
import { ApolloProvider } from '@apollo/client';
import { useApollo } from '@/lib/apolloClient';

function App({ Component, pageProps }) {
  const apolloClient = useApollo(pageProps.initialApolloState);
  return (
    &lt;ApolloProvider client={apolloClient}&gt;
      &lt;Component {...pageProps} /&gt;
    &lt;/ApolloProvider&gt;
  );
}

// pages/profile/[id].tsx
export async function getServerSideProps({ params }) {
  const apolloClient = initializeApolloClient();
  await apolloClient.query({ query: PROFILE_QUERY, variables: { id: params.id } });
  return {
    props: { initialApolloState: apolloClient.cache.extract() },
  };
}
</code></pre>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Apollo end-to-end CRUD</h3>
<pre><code class="language-typescript">import { gql, useQuery, useMutation } from '@apollo/client';

const POSTS = gql\`
  query GetPosts($first: Int!, $after: String) {
    posts(first: $first, after: $after) {
      edges {
        node {
          id
          title
          author { id name }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
\`;

const CREATE_POST = gql\`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      post {
        id
        title
        author { id name }
      }
    }
  }
\`;

const DELETE_POST = gql\`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id) { id }
  }
\`;

function PostList() {
  const { data, fetchMore, loading } = useQuery(POSTS, {
    variables: { first: 20 },
    notifyOnNetworkStatusChange: true,
  });

  const [createPost] = useMutation(CREATE_POST, {
    update(cache, { data }) {
      const newPost = data?.createPost.post;
      if (!newPost) return;
      cache.modify({
        fields: {
          posts(existing) {
            return {
              ...existing,
              edges: [{ node: newPost, __typename: 'PostEdge' }, ...existing.edges],
            };
          },
        },
      });
    },
  });

  const [deletePost] = useMutation(DELETE_POST, {
    update(cache, { data }) {
      cache.evict({ id: cache.identify({ __typename: 'Post', id: data.deletePost.id }) });
      cache.gc();
    },
  });

  return (
    &lt;div&gt;
      &lt;NewPostForm onSubmit={(input) =&gt; createPost({ variables: { input } })} /&gt;
      {data?.posts.edges.map(({ node }) =&gt; (
        &lt;PostRow key={node.id} post={node} onDelete={() =&gt; deletePost({ variables: { id: node.id } })} /&gt;
      ))}
      {data?.posts.pageInfo.hasNextPage &amp;&amp; (
        &lt;button onClick={() =&gt; fetchMore({
          variables: { first: 20, after: data.posts.pageInfo.endCursor },
        })}&gt;
          Load more
        &lt;/button&gt;
      )}
    &lt;/div&gt;
  );
}
</code></pre>

<h3>Example 2: Optimistic like with Apollo</h3>
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

<h3>Example 3: Relay with suspense + fragment composition</h3>
<pre><code class="language-typescript">// PostCard.tsx
import { graphql, useFragment } from 'react-relay';

const fragment = graphql\`
  fragment PostCard_post on Post {
    id
    title
    excerpt
    author {
      ...UserAvatar_user
    }
  }
\`;

function PostCard({ post }) {
  const data = useFragment(fragment, post);
  return (
    &lt;article&gt;
      &lt;UserAvatar user={data.author} /&gt;
      &lt;h2&gt;{data.title}&lt;/h2&gt;
      &lt;p&gt;{data.excerpt}&lt;/p&gt;
    &lt;/article&gt;
  );
}

// Feed.tsx
const feedQuery = graphql\`
  query FeedQuery {
    feed(first: 20) {
      edges {
        node {
          ...PostCard_post
        }
      }
    }
  }
\`;

function Feed() {
  const data = useLazyLoadQuery&lt;FeedQuery&gt;(feedQuery, {});
  return data.feed.edges.map((edge) =&gt; (
    &lt;Suspense key={edge.node.id} fallback={&lt;Skeleton /&gt;}&gt;
      &lt;PostCard post={edge.node} /&gt;
    &lt;/Suspense&gt;
  ));
}
</code></pre>

<h3>Example 4: Urql with graphcache pagination</h3>
<pre><code class="language-typescript">import { cacheExchange } from '@urql/exchange-graphcache';
import { relayPagination } from '@urql/exchange-graphcache/extras';

const cache = cacheExchange({
  resolvers: {
    Query: {
      feed: relayPagination(),
    },
  },
});

function Feed() {
  const [{ data, fetching }] = useQuery({
    query: FEED,
    variables: { first: 20, after: cursor },
  });

  return /* ... */;
}
</code></pre>

<h3>Example 5: TanStack Query for GraphQL</h3>
<pre><code class="language-typescript">import { request } from 'graphql-request';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const GET_USER = \`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      bio
    }
  }
\`;

function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () =&gt; request('/graphql', GET_USER, { id }),
    staleTime: 60_000,
  });
}

function useUpdateBio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; bio: string }) =&gt;
      request('/graphql', UPDATE_BIO, vars),
    onMutate: async ({ id, bio }) =&gt; {
      await qc.cancelQueries({ queryKey: ['user', id] });
      const prev = qc.getQueryData(['user', id]);
      qc.setQueryData(['user', id], (old: any) =&gt; ({
        ...old,
        user: { ...old.user, bio },
      }));
      return { prev };
    },
    onError: (err, vars, ctx) =&gt; qc.setQueryData(['user', vars.id], ctx?.prev),
    onSettled: (_, __, vars) =&gt; qc.invalidateQueries({ queryKey: ['user', vars.id] }),
  });
}
</code></pre>

<h3>Example 6: Subscription with Apollo split-link</h3>
<pre><code class="language-typescript">const NEW_COMMENT = gql\`
  subscription OnNewComment($postId: ID!) {
    newComment(postId: $postId) {
      id
      body
      author { id name avatarUrl }
    }
  }
\`;

function CommentThread({ postId }) {
  const { data: subData } = useSubscription(NEW_COMMENT, {
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
              fragment: COMMENT_FRAGMENT,
            });
            return { ...existing, edges: [...existing.edges, { node: newRef }] };
          },
        },
      });
    },
  });

  // ...
}
</code></pre>

<h3>Example 7: Codegen + graphql-eslint setup</h3>
<pre><code class="language-typescript">// codegen.ts
import { CodegenConfig } from '@graphql-codegen/cli';
const config: CodegenConfig = {
  schema: process.env.GRAPHQL_SCHEMA_URL,
  documents: ['src/**/*.{ts,tsx}'],
  generates: {
    './src/gql/': {
      preset: 'client',
      plugins: [],
    },
  },
};
export default config;
</code></pre>

<pre><code class="language-json">// .eslintrc with graphql-eslint
{
  "overrides": [
    {
      "files": ["*.ts", "*.tsx"],
      "extends": "plugin:@graphql-eslint/operations-recommended",
      "parserOptions": {
        "schema": "./schema.graphql",
        "operations": "src/**/*.{ts,tsx}"
      }
    }
  ]
}
</code></pre>

<h3>Example 8: Switching client mid-flow</h3>
<pre><code class="language-typescript">// Auth + non-auth requests in parallel
const authClient = new ApolloClient({ link: authLink.concat(httpLink), cache });
const publicClient = new ApolloClient({ link: httpLink, cache });

function App({ user }) {
  return (
    &lt;ApolloProvider client={user ? authClient : publicClient}&gt;
      &lt;Routes /&gt;
    &lt;/ApolloProvider&gt;
  );
}
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>Cache normalization without <code>id</code></h3>
<ul>
  <li>Apollo expects <code>__typename + id</code> by default. If your type uses a different key (<code>email</code>, <code>uuid</code>), configure <code>typePolicies</code>:</li>
</ul>
<pre><code class="language-typescript">new InMemoryCache({
  typePolicies: {
    User: { keyFields: ['email'] },
    Post: { keyFields: ['slug', 'authorId'] }, // composite key
    AnonymousType: { keyFields: false }, // disable normalization
  },
});
</code></pre>

<h3>Apollo cache writing missing fields</h3>
<ul>
  <li>If you read a fragment that requires a field not in the cache, Apollo returns null (with warning).</li>
  <li>Symptom: components disappear or render empty after a write.</li>
  <li>Fix: ensure mutations return all fields the consumer needs OR add <code>cache.modify</code> for derived fields.</li>
</ul>

<h3>Polling overhead</h3>
<ul>
  <li><code>useQuery({ pollInterval: 5000 })</code> fires every 5s, even when tab not visible.</li>
  <li>Combine with <code>skipPollAttempt</code> to pause when tab hidden.</li>
  <li>For real-time data, prefer subscriptions; for "fresh on focus," use <code>refetchOnWindowFocus</code> (TanStack) or manual refetch on visibility.</li>
</ul>

<h3>Pagination merge function correctness</h3>
<ul>
  <li>Without a custom <code>merge</code>, paginated queries overwrite the cache; <code>fetchMore</code> replaces instead of appending.</li>
  <li>Apollo <code>typePolicies</code> + <code>keyArgs: false</code> + custom merge handles this.</li>
  <li>Relay handles via <code>@connection</code> directive automatically.</li>
  <li>Urql graphcache: <code>relayPagination()</code> helper.</li>
</ul>

<h3>Subscription reconnection</h3>
<ul>
  <li>WebSocket drops on bad network; client libs auto-reconnect but state is lost.</li>
  <li>On reconnect, re-subscribe + manually fetch any missed events via a "since" cursor.</li>
  <li>Don't rely on subscriptions for system-of-record data; treat as a hint to refetch.</li>
</ul>

<h3>Auth token refresh</h3>
<ul>
  <li>Token expires mid-flight; query returns 401.</li>
  <li>Apollo <code>errorLink</code> can detect, refresh, retry:</li>
</ul>
<pre><code class="language-typescript">const errorLink = onError(({ graphQLErrors, operation, forward }) =&gt; {
  if (graphQLErrors?.some(e =&gt; e.extensions?.code === 'UNAUTHENTICATED')) {
    return new Observable((observer) =&gt; {
      refreshToken().then(() =&gt; {
        const ctx = operation.getContext();
        operation.setContext({
          headers: { ...ctx.headers, Authorization: \`Bearer \${getToken()}\` },
        });
        forward(operation).subscribe(observer);
      });
    });
  }
});
</code></pre>

<h3>Stale cache after schema change</h3>
<ul>
  <li>Server adds new required field; client cache has old shape.</li>
  <li>Apollo logs warning + may render with missing fields.</li>
  <li>On app start, version-check; if schema changed, evict + reload.</li>
</ul>

<h3>SSR + cache extraction</h3>
<ul>
  <li>SSR renders → <code>cache.extract()</code> → ship to client → <code>cache.restore()</code> on hydration.</li>
  <li>If extraction includes per-user data, leaks to other users in shared CDN cache.</li>
  <li>Mark per-user queries as <code>no-cache</code> on SSR; or use Next.js's per-request cache.</li>
</ul>

<h3>Suspense + Apollo</h3>
<ul>
  <li>Apollo Client 3.8+ supports React Suspense via <code>useSuspenseQuery</code>.</li>
  <li>Throws a promise on first render; Suspense catches.</li>
  <li>Don't mix <code>useQuery</code> + <code>useSuspenseQuery</code> in the same tree without testing — different rendering models.</li>
</ul>

<h3>Codegen pitfalls</h3>
<ul>
  <li>Codegen requires the schema; if schema is private + you don't have access, you can't generate types.</li>
  <li>Solution: persist schema.graphql in repo; update via cron / CI.</li>
  <li>Per-document codegen creates lots of files; may slow watch mode. Use <code>client preset</code> for single-file output.</li>
</ul>

<h3>Optimistic UI rollback</h3>
<ul>
  <li>Apollo rolls back optimistic data on mutation error automatically.</li>
  <li>If your <code>update</code> writes to other parts of the cache, those don't auto-rollback. Apollo handles only the optimistic record itself.</li>
  <li>For complex updates with derived state elsewhere, use <code>cache.evict</code> + manual restore.</li>
</ul>

<h3>Bundle size</h3>
<ul>
  <li>Apollo Client ~32 KB gz; Relay runtime ~26 KB; Urql core ~6 KB.</li>
  <li>For mobile, every kB matters; weigh features vs size.</li>
  <li>Tree-shake links / exchanges; don't import what you don't use.</li>
</ul>

<h3>Devtools</h3>
<table>
  <thead><tr><th>Library</th><th>Devtools</th></tr></thead>
  <tbody>
    <tr><td>Apollo</td><td>Apollo Client DevTools (browser extension); cache + queries + mutations + cache writes</td></tr>
    <tr><td>Relay</td><td>Relay DevTools; store inspection; environment debugging</td></tr>
    <tr><td>Urql</td><td>Urql DevTools (Chrome ext); slower update than Apollo's</td></tr>
    <tr><td>TanStack Query</td><td>TanStack Query Devtools; works for GraphQL via TanStack but no schema awareness</td></tr>
  </tbody>
</table>

<h3>RN angle</h3>
<ul>
  <li>All four work in RN; Apollo + Urql ship the most polished RN documentation.</li>
  <li>Persisted queries critical: smaller payload + bundle savings.</li>
  <li>Subscription transport over WebSocket disconnects on background; reconnect on foreground; replay.</li>
  <li>Codegen output checked into the repo so RN bundles correctly.</li>
  <li>Apollo / Urql cache persistence on RN: <code>apollo3-cache-persist</code> with AsyncStorage / MMKV.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common GraphQL-client mistakes</h3>
<ol>
  <li><strong>Skipping codegen.</strong> Type drift; refactors silently break.</li>
  <li><strong>Multiple Apollo Client instances.</strong> Cache fragmentation; mutation in one doesn't update another.</li>
  <li><strong>Refetch instead of cache update.</strong> Wasted network round trips.</li>
  <li><strong>Custom merge function returning <code>incoming</code>.</strong> Pagination overwrites; <code>fetchMore</code> replaces.</li>
  <li><strong>Forgetting <code>typePolicies</code> for non-id keys.</strong> Cache duplicates records.</li>
  <li><strong>Optimistic UI without <code>__typename</code>.</strong> Cache can't merge; UI flickers.</li>
  <li><strong>Subscriptions over HTTP link.</strong> Long-running connection; HTTP timeout breaks it.</li>
  <li><strong>No error link.</strong> 401 silently fails; no auth refresh.</li>
  <li><strong>Polling without skip on hidden.</strong> Battery drain; network spam.</li>
  <li><strong>Cache.persist without size cap.</strong> Mobile storage exhaustion.</li>
  <li><strong>SSR cache leaks across users.</strong> Per-user data shared via CDN cache.</li>
  <li><strong>Manual fetch with global Apollo.</strong> Bypasses cache + dedup; back to REST-style problems.</li>
</ol>

<h3>Anti-pattern: skip codegen</h3>
<pre><code class="language-typescript">// BAD — types are <code>any</code>; refactor breaks silently
const { data } = useQuery(GET_USER, { variables: { id } });
data.user.name; // any.any

// GOOD — codegen-generated typed hook
const { data } = useGetUserQuery({ variables: { id } });
data?.user.name; // string
</code></pre>

<h3>Anti-pattern: multiple clients</h3>
<pre><code class="language-typescript">// BAD — two clients; two caches
const apollo1 = new ApolloClient({ ... });
const apollo2 = new ApolloClient({ ... });

// Mutation in apollo1 doesn't update apollo2's view
useMutation(M, { client: apollo1 });
useQuery(Q, { client: apollo2 });

// GOOD — single client; route via separate links
const client = new ApolloClient({
  link: split(condition, link1, link2),
  cache: sharedCache,
});
</code></pre>

<h3>Anti-pattern: refetchQueries everywhere</h3>
<pre><code class="language-typescript">// BAD — wastes network
const [createPost] = useMutation(CREATE_POST, {
  refetchQueries: ['GetFeed', 'GetUser', 'GetStats'],
});

// GOOD — cache update + selective refetch
const [createPost] = useMutation(CREATE_POST, {
  update(cache, { data }) {
    cache.modify({
      fields: {
        feed(existing) {
          return { ...existing, edges: [{ node: data.createPost.post }, ...existing.edges] };
        },
      },
    });
  },
});
</code></pre>

<h3>Anti-pattern: bad pagination merge</h3>
<pre><code class="language-typescript">// BAD — incoming replaces existing on fetchMore
typePolicies: {
  Query: {
    fields: {
      feed: {
        merge(existing, incoming) {
          return incoming;
        },
      },
    },
  },
}

// GOOD — append edges
typePolicies: {
  Query: {
    fields: {
      feed: {
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
}
</code></pre>

<h3>Anti-pattern: optimistic without <code>__typename</code></h3>
<pre><code class="language-typescript">// BAD — cache can't normalize
optimisticResponse: {
  likePost: {
    post: { id, hasLiked: true, likeCount: 5 },
  },
}

// GOOD
optimisticResponse: {
  likePost: {
    __typename: 'LikePostPayload',
    post: {
      __typename: 'Post',
      id,
      hasLiked: true,
      likeCount: 5,
    },
  },
}
</code></pre>

<h3>Anti-pattern: subscriptions through batchHttpLink</h3>
<pre><code class="language-typescript">// BAD — subscriptions get HTTP timeout
const link = new BatchHttpLink({ uri: '/graphql' });

// GOOD — split: subscriptions to WS, queries/mutations to HTTP batch
const link = split(
  ({ query }) =&gt; {
    const def = getMainDefinition(query);
    return def.kind === 'OperationDefinition' &amp;&amp; def.operation === 'subscription';
  },
  wsLink,
  batchHttpLink,
);
</code></pre>

<h3>Anti-pattern: no error link</h3>
<pre><code class="language-typescript">// BAD — every component handles its own errors
const { data, error } = useQuery(Q);
if (error) return /* 50 different error UIs */;

// GOOD — errorLink for global concerns (401, 500, network)
const errorLink = onError(({ graphQLErrors, networkError }) =&gt; {
  if (graphQLErrors?.some(e =&gt; e.extensions?.code === 'UNAUTHENTICATED')) {
    redirectToLogin();
  }
  if (networkError) showOfflineToast();
});
</code></pre>

<h3>Anti-pattern: per-user data in shared cache</h3>
<pre><code class="language-typescript">// BAD — SSR cache extracted; sent to all users via CDN
// GOOD — mark per-user as no-cache; or per-request cache
const { data } = useQuery(GET_ME, { fetchPolicy: 'no-cache' });
</code></pre>

<h3>Anti-pattern: cache.persist without limits</h3>
<pre><code class="language-typescript">// BAD — cache grows unbounded
import { persistCache } from 'apollo3-cache-persist';
await persistCache({ cache, storage: AsyncStorage });

// GOOD — cap size
await persistCache({
  cache,
  storage: AsyncStorage,
  maxSize: 5 * 1024 * 1024, // 5MB
});
</code></pre>

<h3>Anti-pattern: fetch directly bypassing client</h3>
<pre><code class="language-typescript">// BAD — manual fetch; loses dedup, cache, devtools
fetch('/graphql', { method: 'POST', body: JSON.stringify({ query, variables }) });

// GOOD — use the client even from non-React code
import { client } from './apollo';
client.query({ query: GET_USER, variables: { id } });
</code></pre>

<h3>Anti-pattern: useQuery in loops</h3>
<pre><code class="language-typescript">// BAD — N queries; N round trips (unless batchLink); React re-render storm
items.map((item) =&gt; {
  const { data } = useQuery(GET_DETAIL, { variables: { id: item.id } });
  return /* ... */;
});

// GOOD — one query that returns the list
const { data } = useQuery(GET_ALL_DETAILS, { variables: { ids: items.map(i =&gt; i.id) } });
</code></pre>

<h3>Anti-pattern: ignoring devtools</h3>
<p>Apollo Client DevTools shows live cache + every query / mutation. Engineers who never open it miss obvious bugs (cache duplication, slow queries, unsubscribed subscriptions).</p>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common GraphQL-client interview prompts</h3>
<ol>
  <li>Compare Apollo Client vs Relay vs Urql vs TanStack Query.</li>
  <li>How does Apollo's normalized cache work?</li>
  <li>How do you do optimistic UI?</li>
  <li>How do you handle pagination?</li>
  <li>How do you set up subscriptions?</li>
  <li>How do you ensure end-to-end type safety?</li>
  <li>How do you handle authentication / token refresh?</li>
  <li>Tell me about a time you debugged a GraphQL client issue.</li>
</ol>

<h3>The 5-step framework for "set up GraphQL on a new app"</h3>
<ol>
  <li><strong>Pick the client</strong> by app shape (Apollo for full-feature, Urql for light, Relay for performance, TanStack for hybrid).</li>
  <li><strong>Wire codegen</strong> early — types from day one.</li>
  <li><strong>Configure cache</strong> — typePolicies, keyFields, pagination merge functions.</li>
  <li><strong>Configure links / exchanges</strong> — auth, error, retry, split for subscriptions.</li>
  <li><strong>SSR / persistence</strong> — extract / restore cache; persist on mobile with size cap.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"Apollo Client by default — largest ecosystem, best devtools, sensible cache. Relay if we need fragment masking + suspense-first; Urql if bundle size is critical; TanStack if we mostly do REST."</em></li>
  <li><em>"Normalized cache: Apollo / Relay store entities by id; mutation to one record updates everywhere. Document cache (Urql default) caches by query string."</em></li>
  <li><em>"Codegen via graphql-codegen with the client preset — single-file output; types per query; renames break the build."</em></li>
  <li><em>"Optimistic UI: <code>optimisticResponse</code> applied immediately; server response replaces; auto-rollback on error. <code>__typename</code> mandatory."</em></li>
  <li><em>"Pagination via Relay-style cursor connections + custom merge function in typePolicies."</em></li>
  <li><em>"Subscriptions over WS via splitLink; auth via <code>connectionParams</code>."</em></li>
  <li><em>"errorLink centralizes 401 → token refresh → retry; no per-component auth handling."</em></li>
  <li><em>"Persisted queries in production — locks API surface + saves bandwidth."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"end-to-end type safety"</td><td>graphql-codegen client preset</td></tr>
    <tr><td>"like / unlike instant"</td><td>optimisticResponse + cache update</td></tr>
    <tr><td>"infinite scroll"</td><td>Relay connections + merge function</td></tr>
    <tr><td>"realtime chat"</td><td>Subscription over WS + splitLink</td></tr>
    <tr><td>"token refresh"</td><td>errorLink intercept 401 + retry</td></tr>
    <tr><td>"persistent cache"</td><td>apollo3-cache-persist + size cap</td></tr>
    <tr><td>"SSR"</td><td>cache.extract + restore on client</td></tr>
    <tr><td>"smaller bundle"</td><td>Urql core + only needed exchanges</td></tr>
    <tr><td>"performance discipline"</td><td>Relay compiler + fragment masking</td></tr>
  </tbody>
</table>

<h3>Demo script</h3>
<ol>
  <li>Sketch the architecture: client → links/exchanges → network → server.</li>
  <li>Show ApolloClient setup with auth + error + split links.</li>
  <li>Show useQuery + useMutation with codegen-typed hooks.</li>
  <li>Show one optimistic mutation.</li>
  <li>Show one cache.modify after delete.</li>
  <li>Talk pagination merge function.</li>
  <li>Talk SSR + cache persistence + persisted queries.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"graphql-codegen client preset for single-file typed output."</em></li>
  <li><em>"Apollo persisted queries with build-time manifest."</em></li>
  <li><em>"Relay compiler for refactor safety + fragment masking."</em></li>
  <li><em>"errorLink with 401 → refresh → retry pattern."</em></li>
  <li><em>"apollo3-cache-persist on RN with MMKV + size cap."</em></li>
  <li><em>"Apollo Studio integration for query analytics + slow-query alerts."</em></li>
  <li><em>"Schema diff in CI to catch breaking changes before merge."</em></li>
  <li><em>"useSuspenseQuery for React Suspense-first rendering."</em></li>
  <li><em>"BatchHttpLink + AutomaticPersistedQueriesLink for bandwidth + cache wins."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Library tradeoff fluency</td><td>Compares Apollo / Relay / Urql / TanStack; picks by use case</td></tr>
    <tr><td>Codegen instinct</td><td>Wires it on day one</td></tr>
    <tr><td>Cache understanding</td><td>typePolicies, keyFields, merge functions named</td></tr>
    <tr><td>Optimistic discipline</td><td>__typename + cache.modify + rollback</td></tr>
    <tr><td>Link / exchange chain</td><td>Auth, error, retry, split for subscriptions</td></tr>
    <tr><td>Pagination handling</td><td>Relay connections + merge</td></tr>
    <tr><td>SSR awareness</td><td>extract + restore + per-user no-cache</td></tr>
    <tr><td>RN awareness</td><td>cache.persist + size cap + WS reconnect</td></tr>
    <tr><td>DevTools fluency</td><td>Inspects cache + queries; doesn't ship blind</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>Apollo Client + apollo3-cache-persist with MMKV — fast normalized cache, persisted across launches.</li>
  <li>Persisted queries critical — bandwidth + bundle savings on mobile networks.</li>
  <li>Subscription over WS dies on background; reconnect on foreground; replay missed via "since" cursor.</li>
  <li>Codegen output checked into repo so RN bundles don't break in CI.</li>
  <li>Avoid Suspense + RN Navigation conflicts; older react-navigation + Apollo Suspense don't always play well.</li>
  <li>Optimistic UI mandatory: users on cellular can't wait round trips.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"Why might you choose Relay over Apollo?"</em> — Compiler-validated correctness; fragment masking enforces that components only see fields they declared; suspense-first; performance discipline by default. Steeper learning curve.</li>
  <li><em>"How does the normalized cache decide what to update?"</em> — Cache stores entities keyed by <code>__typename + id</code>. When a mutation returns an entity with the same key, all queries referencing it re-render with the new fields.</li>
  <li><em>"What's the deal with <code>keyArgs</code> in pagination?"</em> — <code>keyArgs: false</code> tells Apollo "treat this field as one cache entry regardless of args." Without it, each <code>fetchMore</code> with new variables creates a separate cache entry, breaking append.</li>
  <li><em>"How would you handle token refresh?"</em> — errorLink catches 401; calls refresh endpoint; updates Authorization header; forwards original operation. Use Observable to chain async work.</li>
  <li><em>"How does <code>useSuspenseQuery</code> differ from <code>useQuery</code>?"</em> — Suspense version throws a promise on first render so React's Suspense can catch + show fallback. No <code>loading</code> state — replaced by Suspense boundary.</li>
  <li><em>"How do you debug a slow Apollo query in production?"</em> — Apollo Studio tracing; persisted-query operation names enable per-operation analytics; client-side: Apollo DevTools Network tab.</li>
  <li><em>"How would you implement infinite scroll with Apollo?"</em> — Cursor-based connection + typePolicies merge function + <code>fetchMore</code>; trigger via IntersectionObserver on the last item.</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Build a tiny app with Apollo: query + mutation + subscription + optimistic UI.</li>
  <li>Wire graphql-codegen client preset.</li>
  <li>Configure typePolicies for a paginated connection.</li>
  <li>Build the same app with Urql + graphcache; feel the difference.</li>
  <li>Try Relay's compiler workflow on a small example.</li>
  <li>Wire apollo3-cache-persist on a RN demo app.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read Apollo Client source for the link chain implementation."</li>
  <li>"Read Relay source for fragment masking + suspense integration."</li>
  <li>"Compare the same app built in all four; document the tradeoffs."</li>
  <li>"Audit a real codebase's Apollo cache config; identify missing typePolicies / merge functions."</li>
</ul>
`
    }
  ]
});
