window.PREP_SITE.registerTopic({
  id: 'gql-basics',
  module: 'graphql',
  title: 'Basics',
  estimatedReadTime: '45 min',
  tags: ['graphql', 'queries', 'mutations', 'subscriptions', 'fragments', 'directives', 'variables', 'introspection'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>GraphQL the query language</strong> is what clients <em>write</em> — selection sets that ask the server for an exact shape of data. It's the language layer above the schema; you can know schema design (covered in <code>api-graphql</code>) and still write inefficient or buggy queries. Mastery of the query language is what separates "I sent it through the SDK" from "I picked the right shape, fragment, alias, and variable strategy."</p>
<ul>
  <li><strong>Three operation types:</strong> <code>query</code> (reads), <code>mutation</code> (writes), <code>subscription</code> (server push). Operation type + name + variables + selection set.</li>
  <li><strong>Selection sets:</strong> the shape of the response. Ask for what you need; nothing more, nothing less.</li>
  <li><strong>Fragments:</strong> reusable selection sets. Co-locate with the component that needs them; compose at the screen level.</li>
  <li><strong>Variables:</strong> dynamic values passed alongside the query. Always use them; never string-interpolate user input.</li>
  <li><strong>Aliases:</strong> rename a field in the response. Used to query the same field twice with different args.</li>
  <li><strong>Directives:</strong> <code>@include</code>, <code>@skip</code>, <code>@deprecated</code>; libraries add custom directives.</li>
  <li><strong>Introspection:</strong> the schema is queryable. Tools like Apollo DevTools, GraphiQL, codegen all rely on it.</li>
  <li><strong>Errors:</strong> top-level <code>errors</code> array (system) vs result-type unions (domain).</li>
</ul>
<p><strong>Mantra:</strong> "Select what you need. Use variables. Co-locate fragments. Read introspection. Mutations return what changed."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>The shape of a request</h3>
<pre><code class="language-graphql">query GetUserPosts($id: ID!, $first: Int = 10) {
  user(id: $id) {
    id
    name
    posts(first: $first) {
      edges {
        node {
          id
          title
          excerpt
        }
      }
    }
  }
}
</code></pre>

<p>Three layers:</p>
<ol>
  <li><strong>Operation:</strong> <code>query GetUserPosts(...)</code> — type + name + arguments.</li>
  <li><strong>Selection set:</strong> <code>{ user(id: $id) { ... } }</code> — the shape requested.</li>
  <li><strong>Fields:</strong> leaf scalars (<code>id</code>, <code>name</code>) and nested objects with their own selection sets.</li>
</ol>

<h3>Why the query language matters separately from the schema</h3>
<table>
  <thead><tr><th>Concern</th><th>Schema (server)</th><th>Query language (client)</th></tr></thead>
  <tbody>
    <tr><td>Decides what's possible</td><td>Yes</td><td>No (consumes)</td></tr>
    <tr><td>Decides what's efficient</td><td>Partially</td><td>Mostly</td></tr>
    <tr><td>Decides what to refetch on cache miss</td><td>No</td><td>Yes</td></tr>
    <tr><td>Decides client cache shape</td><td>No</td><td>Yes (selection determines normalization)</td></tr>
    <tr><td>Reads like a spec</td><td>SDL is opaque to non-engineers</td><td>The query is what runs in production</td></tr>
  </tbody>
</table>

<h3>Why "send it through the SDK" isn't enough</h3>
<ul>
  <li>SDK calls are typed; bad queries still type-check but fetch too much / too little.</li>
  <li>Apollo cache normalizes by <code>__typename + id</code>; if you forget <code>id</code>, cache misses are silent.</li>
  <li>N+1 problems show up in queries; resolvers can't fix what queries don't ask cleanly.</li>
  <li>Persisted queries require knowing the exact query string; bad query = bad persisted ID.</li>
</ul>

<h3>What "good queries" look like</h3>
<ul>
  <li>Each query has an explicit name (<code>GetUser</code>, not anonymous) — for analytics + persisted queries.</li>
  <li>Variables for every dynamic input; never string interpolation.</li>
  <li>Fragments co-located with components that use them.</li>
  <li><code>id</code> + <code>__typename</code> always selected for normalizable types.</li>
  <li>Selection narrowed to what the screen needs.</li>
  <li>Mutations return enough data to update the cache without refetching.</li>
  <li>Errors handled with both top-level array AND domain-level result types.</li>
</ul>

<h3>What "bad queries" look like</h3>
<ul>
  <li>Anonymous queries — no name, no analytics, no persisted-query story.</li>
  <li>Inline values where variables should be — defeats persisted queries + cache reuse.</li>
  <li>One giant query selecting every field on every type "just in case" — bandwidth + parse cost.</li>
  <li>Skipping <code>id</code> — Apollo cache fragments your data into new objects per query.</li>
  <li>Fragments named generically (<code>UserFields</code>) instead of context-aware (<code>UserCard_User</code>).</li>
  <li>Mutations returning <code>Boolean</code> — client must refetch to update UI.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The three operation types</h3>
<table>
  <thead><tr><th>Type</th><th>Use for</th><th>Cache effect</th><th>Side effects</th></tr></thead>
  <tbody>
    <tr><td><code>query</code></td><td>Reads</td><td>Populates cache</td><td>None expected</td></tr>
    <tr><td><code>mutation</code></td><td>Writes</td><td>Updates cache (manually or automatically by id)</td><td>Yes</td></tr>
    <tr><td><code>subscription</code></td><td>Server push</td><td>Streams updates into cache</td><td>None (push only)</td></tr>
  </tbody>
</table>

<h3>Anatomy of a query</h3>
<pre><code class="language-graphql">query GetUserCard($id: ID!) {
  user(id: $id) {
    id
    name
    avatarUrl
    bio
    followerCount
  }
}
</code></pre>
<p>Variables (<code>$id</code>) are typed. <code>!</code> = non-null. The server validates argument types against the schema.</p>

<h3>Mutations</h3>
<pre><code class="language-graphql">mutation UpdateProfile($input: UpdateProfileInput!) {
  updateProfile(input: $input) {
    user {
      id
      name
      bio
    }
  }
}
</code></pre>
<p>Best practice: mutation takes a single <code>input</code> object (extensible without breaking call sites) and returns a payload type with the affected entity.</p>

<h3>Subscriptions</h3>
<pre><code class="language-graphql">subscription OnNewComment($postId: ID!) {
  newComment(postId: $postId) {
    id
    body
    author { id name avatarUrl }
    createdAt
  }
}
</code></pre>
<p>Long-lived; transport is usually WebSocket via <code>graphql-ws</code>. Subscription handlers receive a stream of events that update the cache.</p>

<h3>Variables — always</h3>
<table>
  <thead><tr><th>Why</th><th>Outcome</th></tr></thead>
  <tbody>
    <tr><td>Persisted queries</td><td>Same query string for different inputs → one persisted hash</td></tr>
    <tr><td>Cache reuse</td><td>Apollo normalizes by query + variables; inline values break dedup</td></tr>
    <tr><td>Type safety</td><td>Variables are typed; server validates</td></tr>
    <tr><td>Injection safety</td><td>String interpolation = injection vector</td></tr>
    <tr><td>Codegen</td><td>Types generated for variable shape</td></tr>
  </tbody>
</table>

<pre><code class="language-graphql">// BAD — inline; new query string per id
query { user(id: "42") { name } }

// GOOD — variable; one query string for any id
query GetUser($id: ID!) {
  user(id: $id) { name }
}
</code></pre>

<h3>Fragments</h3>
<pre><code class="language-graphql">fragment UserCard_User on User {
  id
  name
  avatarUrl
}

fragment PostCard_Post on Post {
  id
  title
  excerpt
  author {
    ...UserCard_User
  }
}

query Feed {
  feed {
    edges {
      node { ...PostCard_Post }
    }
  }
}
</code></pre>

<p>Naming convention: <code>ComponentName_TypeName</code>. Each component owns its fragment and exports it. The screen composes everything into one query.</p>

<h3>Aliases</h3>
<pre><code class="language-graphql">query Compare {
  asia: regionStats(region: "asia") { population gdp }
  europe: regionStats(region: "europe") { population gdp }
  americas: regionStats(region: "americas") { population gdp }
}
</code></pre>
<p>Same field, three calls, different args. Without aliases the response would have a key collision.</p>

<h3>Directives — built-in</h3>
<pre><code class="language-graphql">query GetUser($id: ID!, $includeBio: Boolean!) {
  user(id: $id) {
    id
    name
    bio @include(if: $includeBio)
    avatarUrl @skip(if: $useSpriteSheet)
  }
}
</code></pre>
<table>
  <thead><tr><th>Directive</th><th>Effect</th></tr></thead>
  <tbody>
    <tr><td><code>@include(if: Boolean)</code></td><td>Include the field if true</td></tr>
    <tr><td><code>@skip(if: Boolean)</code></td><td>Skip the field if true</td></tr>
    <tr><td><code>@deprecated(reason: String)</code></td><td>Schema-level; warns clients</td></tr>
    <tr><td><code>@defer</code></td><td>Newer; defer this part of the response</td></tr>
    <tr><td><code>@stream</code></td><td>Newer; stream list items as they arrive</td></tr>
  </tbody>
</table>

<h3>Custom client directives</h3>
<p>Apollo / Relay / Urql add their own:</p>
<table>
  <thead><tr><th>Directive</th><th>Library</th><th>Effect</th></tr></thead>
  <tbody>
    <tr><td><code>@client</code></td><td>Apollo</td><td>Resolved by client local state, not server</td></tr>
    <tr><td><code>@connection</code></td><td>Relay</td><td>Marks a paginated connection for cache merging</td></tr>
    <tr><td><code>@refetchable</code></td><td>Relay</td><td>Generates a refetch query from a fragment</td></tr>
    <tr><td><code>@arguments</code></td><td>Relay</td><td>Fragment-local arguments</td></tr>
  </tbody>
</table>

<h3>Introspection</h3>
<p>Every GraphQL server (unless explicitly disabled) responds to introspection queries:</p>
<pre><code class="language-graphql">{
  __schema {
    queryType { name }
    types {
      name
      kind
      fields { name type { name } }
    }
  }
}
</code></pre>
<p>Tools that consume introspection:</p>
<ul>
  <li>GraphiQL / Apollo Sandbox / Altair — autocomplete + docs.</li>
  <li>Codegen tools — generate TS types from schema.</li>
  <li>SDL printers — reverse-generate <code>schema.graphql</code> from a live server.</li>
  <li>Schema diff tools — detect breaking changes in CI.</li>
</ul>
<p>In production, you may disable introspection for security (or restrict to authenticated requests). Trades off DX for hiding the schema from attackers — usually not worth it.</p>

<h3>Errors</h3>
<table>
  <thead><tr><th>Error type</th><th>Where</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td>System / network / parse</td><td>Top-level <code>errors</code> array</td><td>Auth missing, server crash, malformed query</td></tr>
    <tr><td>Domain / business</td><td>Result-type union in payload</td><td>Validation failed, conflict, not authorized</td></tr>
  </tbody>
</table>

<pre><code class="language-graphql">type Mutation {
  createPost(input: CreatePostInput!): CreatePostResult!
}

union CreatePostResult = Post | ValidationFailed | RateLimited

type ValidationFailed { fieldErrors: [FieldError!]! }
type RateLimited { retryAfterSeconds: Int! }
</code></pre>

<p>Client-side:</p>
<pre><code class="language-graphql">mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    __typename
    ... on Post { id title }
    ... on ValidationFailed { fieldErrors { field message } }
    ... on RateLimited { retryAfterSeconds }
  }
}
</code></pre>
<p>TypeScript narrowing on <code>__typename</code> makes the call site type-safe.</p>

<h3>Inline fragments + type conditions</h3>
<pre><code class="language-graphql">query Search($q: String!) {
  search(query: $q) {
    __typename
    ... on User { id name }
    ... on Post { id title }
    ... on Comment { id body author { name } }
  }
}
</code></pre>
<p>Used when the field returns a union or interface; you select per type.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Sending a query (raw)</h3>
<pre><code class="language-typescript">const QUERY = \`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      avatarUrl
    }
  }
\`;

const response = await fetch('/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${token}\`,
  },
  body: JSON.stringify({
    query: QUERY,
    variables: { id: '42' },
    operationName: 'GetUser',
  }),
});

const result = await response.json();
// { data: { user: { ... } }, errors?: [...] }
</code></pre>

<p>You'll almost never write this directly — the client libraries (Apollo, Relay, Urql) handle it. But knowing the wire format helps debug.</p>

<h3>Anatomy of the response</h3>
<pre><code class="language-json">{
  "data": {
    "user": {
      "id": "42",
      "name": "Prakhar",
      "avatarUrl": "https://..."
    }
  },
  "errors": [
    {
      "message": "Field 'bio' is deprecated",
      "locations": [{ "line": 5, "column": 5 }],
      "path": ["user", "bio"],
      "extensions": { "code": "DEPRECATED" }
    }
  ],
  "extensions": {
    "tracing": { "...": "..." }
  }
}
</code></pre>

<table>
  <thead><tr><th>Field</th><th>Meaning</th></tr></thead>
  <tbody>
    <tr><td><code>data</code></td><td>The result, shaped exactly like the query.</td></tr>
    <tr><td><code>errors</code></td><td>Array of system / partial errors. Per-field paths.</td></tr>
    <tr><td><code>extensions</code></td><td>Server-defined metadata: tracing, complexity, deprecation warnings.</td></tr>
  </tbody>
</table>

<h3>Partial responses</h3>
<p>GraphQL returns partial data when a non-required field errors. The client sees both <code>data</code> and <code>errors</code> at once.</p>
<pre><code class="language-json">{
  "data": {
    "user": {
      "id": "42",
      "name": "Prakhar",
      "billing": null
    }
  },
  "errors": [
    { "message": "billing service unavailable", "path": ["user", "billing"] }
  ]
}
</code></pre>
<p>If the field is non-null, the error bubbles up to its parent. Schema design (nullability) controls how aggressive partial responses are.</p>

<h3>Mutation with input type</h3>
<pre><code class="language-graphql">mutation UpdateProfile($input: UpdateProfileInput!) {
  updateProfile(input: $input) {
    user {
      id
      name
      bio
      avatarUrl
    }
  }
}
</code></pre>

<pre><code class="language-typescript">await client.mutate({
  mutation: UPDATE_PROFILE,
  variables: {
    input: {
      name: 'New name',
      bio: 'Updated bio',
    },
  },
});
</code></pre>

<h3>Selection set best practices</h3>
<ul>
  <li><strong>Always select <code>id</code> + <code>__typename</code></strong> on normalizable types — Apollo Client, Relay, Urql all rely on this for cache normalization.</li>
  <li><strong>Avoid wildcards.</strong> No <code>SELECT *</code> equivalent; you must list every field.</li>
  <li><strong>Match the component's needs exactly.</strong> Don't over-select "for safety" — you pay in payload + parse + cache.</li>
  <li><strong>Reuse via fragments.</strong> Don't repeat field lists.</li>
</ul>

<h3>Pagination patterns</h3>

<h4>Relay-style cursor connections (most common)</h4>
<pre><code class="language-graphql">query Feed($first: Int!, $after: String) {
  feed(first: $first, after: $after) {
    edges {
      node { id title }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
</code></pre>

<h4>Offset / limit (legacy)</h4>
<pre><code class="language-graphql">query Posts($offset: Int!, $limit: Int!) {
  posts(offset: $offset, limit: $limit) {
    items { id title }
    totalCount
  }
}
</code></pre>

<h4>Fetching more (Apollo)</h4>
<pre><code class="language-typescript">const { data, fetchMore } = useQuery(FEED, {
  variables: { first: 10 },
});

await fetchMore({
  variables: { first: 10, after: data.feed.pageInfo.endCursor },
  updateQuery: (prev, { fetchMoreResult }) =&gt; ({
    feed: {
      ...fetchMoreResult.feed,
      edges: [...prev.feed.edges, ...fetchMoreResult.feed.edges],
    },
  }),
});
</code></pre>

<h3>Fragment composition</h3>
<pre><code class="language-graphql"># Each component owns a fragment
fragment Avatar_User on User {
  id
  avatarUrl
  name
}

fragment Header_User on User {
  ...Avatar_User
  bio
}

fragment Profile_User on User {
  ...Header_User
  followerCount
  posts(first: 10) {
    edges {
      node { ...PostCard_Post }
    }
  }
}

query GetProfile($id: ID!) {
  user(id: $id) {
    ...Profile_User
  }
}
</code></pre>

<h3>Field arguments</h3>
<pre><code class="language-graphql">query Article($id: ID!) {
  article(id: $id) {
    title
    body(format: MARKDOWN)
    publishedAt(timezone: "America/New_York")
    relatedArticles(limit: 5) {
      id
      title
    }
  }
}
</code></pre>
<p>Each field can take arguments — common for formatting, filtering, pagination, locale.</p>

<h3>Field aliases for collision-free shape</h3>
<pre><code class="language-graphql">query AvatarVariants($id: ID!) {
  user(id: $id) {
    id
    small: avatarUrl(size: SMALL)
    medium: avatarUrl(size: MEDIUM)
    large: avatarUrl(size: LARGE)
  }
}
</code></pre>

<h3>Operation names — non-optional in practice</h3>
<pre><code class="language-graphql">// BAD — anonymous; no name in logs, persisted queries don't work, devtools harder
query { user(id: "42") { name } }

// GOOD
query GetUser { user(id: "42") { name } }
</code></pre>
<p>Conventions: <code>VerbNoun</code> — <code>GetUser</code>, <code>CreatePost</code>, <code>OnNewMessage</code>. Match component / hook usage.</p>

<h3>Inspecting a server (introspection)</h3>
<p>GraphiQL / Apollo Sandbox / Altair load schema on connect; you get autocomplete, type info, docs.</p>
<pre><code class="language-bash">npx graphql-codegen --schema https://api.example.com/graphql --check
# Or query introspection raw:
curl -X POST https://api.example.com/graphql \\
  -H 'Content-Type: application/json' \\
  -d '{"query": "{ __schema { types { name } } }"}'
</code></pre>

<h3>Variables with default values</h3>
<pre><code class="language-graphql">query Posts($first: Int = 10, $after: String) {
  feed(first: $first, after: $after) {
    edges { node { id title } }
  }
}
</code></pre>
<p>If the client doesn't pass <code>$first</code>, it defaults to 10. Useful for backwards-compat when you add a new variable.</p>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Profile screen with composed fragments</h3>

<pre><code class="language-graphql"># UserCard component fragment
fragment UserCard_User on User {
  id
  name
  avatarUrl
}

# PostCard component fragment
fragment PostCard_Post on Post {
  id
  title
  excerpt
  createdAt
  author {
    ...UserCard_User
  }
}

# Header component fragment
fragment ProfileHeader_User on User {
  ...UserCard_User
  bio
  followerCount
  followingCount
}

# Top-level query
query ProfileScreen($id: ID!, $postsFirst: Int = 10, $postsAfter: String) {
  user(id: $id) {
    ...ProfileHeader_User
    posts(first: $postsFirst, after: $postsAfter) {
      edges {
        node {
          ...PostCard_Post
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
</code></pre>

<p>Why: each component owns its fragment; the query is composed from leaf fragments. Refactor a component → only its fragment changes.</p>

<h3>Example 2: Create + cache update</h3>

<pre><code class="language-graphql">mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    post {
      id
      title
      body
      createdAt
      author {
        id
        name
      }
    }
  }
}
</code></pre>

<pre><code class="language-typescript">// Apollo example
const [createPost] = useMutation(CREATE_POST, {
  update(cache, { data }) {
    if (!data?.createPost?.post) return;
    cache.modify({
      fields: {
        feed(existing = { edges: [], pageInfo: {} }, { readField }) {
          const newRef = cache.writeFragment({
            data: data.createPost.post,
            fragment: gql\`
              fragment NewPost on Post {
                id
                title
                body
                createdAt
              }
            \`,
          });
          return {
            ...existing,
            edges: [{ node: newRef, cursor: data.createPost.post.id }, ...existing.edges],
          };
        },
      },
    });
  },
});
</code></pre>

<h3>Example 3: Mutation with result-union error handling</h3>

<pre><code class="language-graphql">mutation Login($input: LoginInput!) {
  login(input: $input) {
    __typename
    ... on LoginSuccess {
      token
      user { id name }
    }
    ... on InvalidCredentials {
      message
    }
    ... on RateLimited {
      retryAfterSeconds
    }
  }
}
</code></pre>

<pre><code class="language-typescript">const [login] = useMutation(LOGIN);

async function onSubmit(values) {
  const { data } = await login({ variables: { input: values } });
  if (!data) return;

  switch (data.login.__typename) {
    case 'LoginSuccess':
      saveToken(data.login.token);
      navigate('/dashboard');
      return;
    case 'InvalidCredentials':
      setFieldError('password', data.login.message);
      return;
    case 'RateLimited':
      showToast(\`Please wait \${data.login.retryAfterSeconds} seconds\`);
      return;
  }
}
</code></pre>

<h3>Example 4: Subscription for live comments</h3>

<pre><code class="language-graphql">subscription OnNewComment($postId: ID!) {
  newComment(postId: $postId) {
    id
    body
    author {
      id
      name
      avatarUrl
    }
    createdAt
  }
}
</code></pre>

<pre><code class="language-typescript">// Apollo
const { data } = useSubscription(ON_NEW_COMMENT, {
  variables: { postId },
  onData({ client, data }) {
    if (!data.data?.newComment) return;
    // Update the cache for the post's comments connection
    client.cache.modify({
      id: client.cache.identify({ __typename: 'Post', id: postId }),
      fields: {
        comments(existing) {
          const newRef = client.cache.writeFragment({
            data: data.data.newComment,
            fragment: NewCommentFragment,
          });
          return { ...existing, edges: [...existing.edges, { node: newRef }] };
        },
      },
    });
  },
});
</code></pre>

<h3>Example 5: Multiple aliased fields</h3>

<pre><code class="language-graphql">query DashboardStats {
  today: stats(period: TODAY) {
    revenue
    orders
    visitors
  }
  yesterday: stats(period: YESTERDAY) {
    revenue
    orders
    visitors
  }
  thisMonth: stats(period: THIS_MONTH) {
    revenue
    orders
    visitors
  }
}
</code></pre>

<h3>Example 6: Conditional field with directives</h3>

<pre><code class="language-graphql">query GetPost($id: ID!, $isAdmin: Boolean!) {
  post(id: $id) {
    id
    title
    body
    publishedAt
    moderation @include(if: $isAdmin) {
      status
      flaggedAt
      reportCount
    }
  }
}
</code></pre>

<h3>Example 7: Search across union types</h3>

<pre><code class="language-graphql">query GlobalSearch($q: String!) {
  search(query: $q) {
    edges {
      node {
        __typename
        ... on User {
          id
          name
          avatarUrl
        }
        ... on Post {
          id
          title
          excerpt
        }
        ... on Tag {
          id
          name
          postCount
        }
      }
    }
  }
}
</code></pre>

<pre><code class="language-tsx">function SearchResult({ node }) {
  switch (node.__typename) {
    case 'User':  return &lt;UserHit user={node} /&gt;;
    case 'Post':  return &lt;PostHit post={node} /&gt;;
    case 'Tag':   return &lt;TagHit tag={node} /&gt;;
    default:      return null;
  }
}
</code></pre>

<h3>Example 8: Refetch after a mutation</h3>

<pre><code class="language-typescript">const [deletePost] = useMutation(DELETE_POST, {
  refetchQueries: [
    { query: GET_FEED, variables: { first: 10 } },
  ],
  awaitRefetchQueries: true, // wait until refetch finishes before resolving
});
</code></pre>
<p>Use sparingly — refetching defeats normalization. Prefer cache <code>update</code> when possible.</p>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>Forgetting <code>__typename</code> + <code>id</code></h3>
<ul>
  <li>Apollo cache normalizes by <code>__typename + id</code>. Without them, two queries return separate cache entries even for the same object.</li>
  <li>Symptom: updating user A in mutation doesn't update user A elsewhere on screen.</li>
  <li>Apollo auto-injects <code>__typename</code> by default. <code>id</code> you have to remember.</li>
  <li>Custom keyFields configurable via <code>typePolicies</code>: <code>{ User: { keyFields: ['email'] } }</code>.</li>
</ul>

<h3>Anonymous queries</h3>
<ul>
  <li>Server logs show "<anonymous>" — no metric for "which query is slow."</li>
  <li>Persisted queries can't work without an operation name.</li>
  <li>DevTools harder to inspect.</li>
  <li>Lint rule: <code>graphql-eslint/no-anonymous-operations</code>.</li>
</ul>

<h3>Inline values vs variables</h3>
<ul>
  <li>Inline <code>(id: "42")</code> → new query string per id; cache + persisted query break.</li>
  <li>Always use variables.</li>
  <li>Lint rule: <code>graphql-eslint/no-inline-fragments</code> or your codegen guards.</li>
</ul>

<h3>Fragment naming collisions</h3>
<ul>
  <li>Two fragments with the same name in one query → server rejects.</li>
  <li>Convention: <code>ComponentName_TypeName</code> avoids collisions naturally.</li>
  <li>Fragments compile to a flat namespace at the document level.</li>
</ul>

<h3>Over-fetching for "future-proofing"</h3>
<ul>
  <li>Devs add fields "in case we need them" → bandwidth bloat, parse time, cache size.</li>
  <li>Add fields when components need them; leverage codegen for type changes.</li>
</ul>

<h3>Large lists without pagination</h3>
<ul>
  <li><code>posts</code> returning 10k items → multi-MB response, JS thread freeze.</li>
  <li>Always paginate; Relay connections are the standard.</li>
  <li>Cap server-side limit independently of client request.</li>
</ul>

<h3>Mutation returning <code>Boolean</code></h3>
<pre><code class="language-graphql">// BAD
mutation { likePost(id: "1"): Boolean! }

// GOOD — return the post; client cache auto-updates by id
mutation {
  likePost(id: "1") {
    post { id likeCount hasLiked }
  }
}
</code></pre>

<h3>Subscriptions over HTTP</h3>
<ul>
  <li>HTTP transport doesn't support subscriptions; uses long-running connection (WebSocket / SSE).</li>
  <li>If your client doesn't have a <code>subscriptionClient</code> or <code>wsLink</code>, subscriptions fall back to errors.</li>
  <li>Apollo: split link to route subscriptions to WS, queries/mutations to HTTP.</li>
</ul>

<h3>Variable type mismatches</h3>
<ul>
  <li>Schema expects <code>$id: ID!</code>; client sends number 42 instead of string "42".</li>
  <li>ID is a String at runtime; some servers coerce, some don't.</li>
  <li>Always send strings for ID variables; codegen catches at compile time.</li>
</ul>

<h3>Null-bubble surprises</h3>
<ul>
  <li>Non-null field errors → null bubbles up to nearest nullable parent.</li>
  <li>Whole subtree may be wiped from response.</li>
  <li>Schema design choice: bias toward nullable for resilience.</li>
</ul>

<h3>Persisted query mismatch</h3>
<ul>
  <li>Client calculates SHA-256 hash of query; sends only hash.</li>
  <li>If the query string differs by even whitespace, hash differs → server doesn't recognize → error.</li>
  <li>Codegen normalizes formatting; manual edits break it.</li>
</ul>

<h3>Subscription auth</h3>
<ul>
  <li>WebSocket handshake doesn't carry standard <code>Authorization</code> header.</li>
  <li>Pass token via connection params (<code>connectionParams</code> in <code>graphql-ws</code>).</li>
  <li>Server validates on connect; closes if expired.</li>
  <li>Long-lived sub may outlive token; refresh + reconnect.</li>
</ul>

<h3>Tooling for query authoring</h3>
<table>
  <thead><tr><th>Tool</th><th>What it does</th></tr></thead>
  <tbody>
    <tr><td>graphql-eslint</td><td>Lint queries: anonymous ops, missing variables, missing id</td></tr>
    <tr><td>GraphQL Codegen</td><td>Types from schema + queries; per-query type generated</td></tr>
    <tr><td>Apollo Studio / GraphQL Inspector</td><td>Schema diffing in CI</td></tr>
    <tr><td>GraphiQL / Sandbox</td><td>Interactive query playground</td></tr>
  </tbody>
</table>

<h3>RN angle</h3>
<ul>
  <li>RN ships GraphQL via Apollo / Urql / Relay just like web.</li>
  <li>Persisted queries are essential on mobile — saves bandwidth + bundle size.</li>
  <li>Subscriptions over WebSocket survive backgrounding poorly; design for reconnect.</li>
  <li>Codegen output should be checked into the repo for offline builds.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common query-language mistakes</h3>
<ol>
  <li><strong>Anonymous queries.</strong> No analytics, no persisted queries, harder debugging.</li>
  <li><strong>Inline values instead of variables.</strong> Defeats persisted queries, breaks cache reuse.</li>
  <li><strong>Forgetting <code>id</code>.</strong> Apollo can't normalize; cache fragments.</li>
  <li><strong>One mega-query.</strong> Massive selection set; payload + parse cost.</li>
  <li><strong>Mutation returning <code>Boolean</code>.</strong> Forces refetch.</li>
  <li><strong>Fragments named generically.</strong> <code>UserFields</code> collides; <code>ComponentName_Type</code> doesn't.</li>
  <li><strong>Refetching instead of cache update.</strong> Wastes network round trips.</li>
  <li><strong>Skipping result-type unions for domain errors.</strong> Top-level errors mix system + domain failures.</li>
  <li><strong>Subscriptions used for everything.</strong> WebSocket overhead; polling or SSE often suffice.</li>
  <li><strong>Forgetting to fragment-co-locate.</strong> One file owns all queries; impossible to refactor.</li>
  <li><strong>Hardcoded connection limits.</strong> <code>posts(first: 1000)</code> works locally, dies in prod.</li>
  <li><strong>Ignoring <code>extensions</code>.</strong> Server hints (deprecation, complexity) silently lost.</li>
</ol>

<h3>Anti-pattern: anonymous query</h3>
<pre><code class="language-graphql">// BAD
query {
  user(id: "42") { name }
}

// GOOD
query GetUser($id: ID!) {
  user(id: $id) { id name }
}
</code></pre>

<h3>Anti-pattern: inline values</h3>
<pre><code class="language-graphql">// BAD — every id creates a new query fingerprint
query GetUser1 { user(id: "1") { name } }
query GetUser2 { user(id: "2") { name } }

// GOOD — one query, parameterized
query GetUser($id: ID!) { user(id: $id) { id name } }
</code></pre>

<h3>Anti-pattern: missing <code>id</code></h3>
<pre><code class="language-graphql">// BAD — cache can't normalize; updates elsewhere don't propagate
query { user(id: $id) { name avatarUrl } }

// GOOD
query { user(id: $id) { id name avatarUrl } }
</code></pre>

<h3>Anti-pattern: deeply nested mega-query</h3>
<pre><code class="language-graphql">// BAD — fetches everything; payload + parse + cache cost
query GetEverything {
  user(id: $id) {
    ...AllUserFields
    posts(first: 100) { edges { node { ...AllPostFields, comments(first: 100) { ... } } } }
    followers(first: 100) { ...AllUserFields }
  }
}
</code></pre>
<p>Split into per-screen queries; load on-demand.</p>

<h3>Anti-pattern: mutation returns nothing useful</h3>
<pre><code class="language-graphql">// BAD — forced to refetch
mutation LikePost($id: ID!) {
  likePost(id: $id)  # returns Boolean
}

// GOOD — returns affected entity; cache auto-updates by id
mutation LikePost($id: ID!) {
  likePost(id: $id) {
    post {
      id
      likeCount
      hasLiked
    }
  }
}
</code></pre>

<h3>Anti-pattern: fragment over-sharing</h3>
<pre><code class="language-graphql">// BAD — UserFields used by 30 components, all coupled
fragment UserFields on User {
  id name email avatarUrl bio createdAt followerCount followingCount
  posts { ... } billing { ... } /* 50 fields */
}

// GOOD — per-component fragments
fragment Avatar_User on User { id avatarUrl }
fragment UserCard_User on User { ...Avatar_User name }
fragment ProfileHeader_User on User { ...UserCard_User bio followerCount }
</code></pre>

<h3>Anti-pattern: refetch instead of cache update</h3>
<pre><code class="language-typescript">// BAD — refetch the whole feed
useMutation(CREATE_POST, {
  refetchQueries: ['GetFeed'],
});

// GOOD — update the cache directly
useMutation(CREATE_POST, {
  update(cache, { data }) {
    cache.modify({
      fields: {
        feed(existing) {
          // prepend the new post
          return { ...existing, edges: [{ node: data.createPost.post }, ...existing.edges] };
        },
      },
    });
  },
});
</code></pre>

<h3>Anti-pattern: errors-as-strings</h3>
<pre><code class="language-graphql">// BAD — everything in top-level errors; can't branch
mutation Login { login(input: {...}) { token user { id } } }
// then errors: [{ message: "invalid credentials" }]

// GOOD — domain errors as result types
mutation Login($input: LoginInput!) {
  login(input: $input) {
    __typename
    ... on LoginSuccess { token user { id } }
    ... on InvalidCredentials { message }
  }
}
</code></pre>

<h3>Anti-pattern: subscription instead of cache invalidation</h3>
<p>Using a subscription to "refresh" data on every mutation is overkill. Most state can be updated client-side after the mutation returns; subscriptions are for cross-client realtime (chat, presence).</p>

<h3>Anti-pattern: ignoring <code>extensions</code></h3>
<pre><code class="language-typescript">// Server returns deprecation warnings in errors[].extensions
// Client logs only error.message; loses code

// BETTER
const errs = result.errors;
errs?.forEach((e) =&gt; {
  if (e.extensions?.code === 'DEPRECATED') {
    log('deprecated field', e.path, e.extensions.deprecatedSince);
  }
});
</code></pre>

<h3>Anti-pattern: huge first page</h3>
<pre><code class="language-graphql">// BAD
query { feed(first: 1000) { edges { node { ... } } } }

// GOOD — small page; paginate
query Feed($first: Int = 20, $after: String) {
  feed(first: $first, after: $after) { ... }
}
</code></pre>

<h3>Anti-pattern: no operation name in production builds</h3>
<p>Some bundlers strip operation names if not used elsewhere. Make them visible in dev + production by codegen-generating them or naming them explicitly.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common GraphQL-basics interview prompts</h3>
<ol>
  <li>Walk through writing a query / mutation / subscription.</li>
  <li>What's the difference between fragments and inline fragments?</li>
  <li>How do variables work? Why use them?</li>
  <li>Compare REST vs GraphQL request shape.</li>
  <li>How does the cache normalize without <code>id</code>?</li>
  <li>How do you handle errors — top-level vs domain?</li>
  <li>What does <code>__typename</code> do?</li>
  <li>Walk through a Relay-style connection query.</li>
</ol>

<h3>The 5-step framework for "write a query"</h3>
<ol>
  <li><strong>Name the operation</strong> — <code>VerbNoun</code>.</li>
  <li><strong>Declare variables</strong> — typed, with defaults where appropriate.</li>
  <li><strong>Compose fragments</strong> — per-component; co-located.</li>
  <li><strong>Always include <code>id</code> + <code>__typename</code></strong> on normalizable types.</li>
  <li><strong>Mutations return affected entity;</strong> use result-type unions for domain errors.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"Operation names always — analytics, persisted queries, devtools all need them."</em></li>
  <li><em>"Variables for every dynamic input — persisted queries hash by query string; inline values defeat that."</em></li>
  <li><em>"Fragment co-location: each component owns its fragment named <code>ComponentName_TypeName</code>; the screen composes."</em></li>
  <li><em>"Always select <code>id</code> + <code>__typename</code> — the cache keys on them; without them, mutations don't propagate."</em></li>
  <li><em>"Mutations return the affected entity, not Boolean — saves a refetch round trip."</em></li>
  <li><em>"Result-type unions for domain errors; top-level errors only for system failures."</em></li>
  <li><em>"Relay-style cursor connections for pagination — composes with Apollo + Relay caches."</em></li>
  <li><em>"Subscription over WebSocket only when realtime cross-client matters; cache invalidation handles the rest."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt keyword</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"reusable selection"</td><td>Named fragment + co-location</td></tr>
    <tr><td>"same field, different args"</td><td>Aliases</td></tr>
    <tr><td>"conditional field"</td><td><code>@include</code> / <code>@skip</code> directive</td></tr>
    <tr><td>"union / interface"</td><td>Inline fragments + <code>__typename</code></td></tr>
    <tr><td>"pagination"</td><td>Relay cursor connection (edges / pageInfo)</td></tr>
    <tr><td>"realtime"</td><td>Subscription over WS (graphql-ws)</td></tr>
    <tr><td>"mutation cache update"</td><td>Return affected entity; cache auto-updates by id</td></tr>
    <tr><td>"domain errors"</td><td>Result-type union with <code>__typename</code> branching</td></tr>
    <tr><td>"deprecation"</td><td><code>@deprecated</code> directive in schema; <code>extensions</code> in response</td></tr>
  </tbody>
</table>

<h3>Demo script</h3>
<ol>
  <li>Write a query with name + variables + fragment composition.</li>
  <li>Show <code>id</code> + <code>__typename</code> selected throughout.</li>
  <li>Show the response shape mirroring the query.</li>
  <li>Show a mutation that returns the affected entity.</li>
  <li>Walk through a result-union for error handling.</li>
  <li>Address pagination via Relay-style connection.</li>
  <li>Talk subscriptions only if scope demands it.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"GraphQL Codegen for end-to-end TS types."</em></li>
  <li><em>"graphql-eslint rules: no-anonymous-operations, no-deprecated, naming-convention."</em></li>
  <li><em>"Persisted query manifest at build time — server only accepts approved queries."</em></li>
  <li><em>"Schema-diff in CI to catch breaking changes before merge."</em></li>
  <li><em>"<code>@defer</code> / <code>@stream</code> for above-the-fold rendering."</em></li>
  <li><em>"Fragment masking (Relay-style) so components only see their own fields."</em></li>
  <li><em>"Per-query complexity weights + budget enforcement."</em></li>
  <li><em>"Apollo / Relay devtools integration for cache inspection."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Operation hygiene</td><td>Names + variables + composed fragments</td></tr>
    <tr><td>Cache awareness</td><td>Always selects <code>id</code> + <code>__typename</code></td></tr>
    <tr><td>Fragment composition</td><td>Per-component naming; not generic shared fragments</td></tr>
    <tr><td>Mutation pattern</td><td>Returns entity; cache update over refetch</td></tr>
    <tr><td>Error handling</td><td>Top-level vs result-union deliberate</td></tr>
    <tr><td>Pagination</td><td>Relay connections by default</td></tr>
    <tr><td>Subscription discipline</td><td>Only when realtime cross-client needed</td></tr>
    <tr><td>Tooling</td><td>Codegen + lint + persisted queries</td></tr>
    <tr><td>Communication</td><td>Tradeoffs spoken aloud</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>Persisted queries critical on mobile — bandwidth savings + smaller bundle.</li>
  <li>Optimistic UI with mutation result + cache update; users don't wait on round trips.</li>
  <li>Subscriptions over WS struggle on background; reconnect on foreground; replay missed via "since" cursor.</li>
  <li>Codegen output checked into the repo so RN builds work offline.</li>
  <li>For shared web + RN, shared fragments / queries via codegen — single source of truth.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"Why is <code>__typename</code> auto-injected?"</em> — Apollo / Relay normalize cache by <code>__typename + id</code>; without it, every selection creates a new cache entry. Apollo auto-injects to save repeated boilerplate.</li>
  <li><em>"Why use fragments instead of duplicating fields?"</em> — Reusability + co-location. Component owns its data needs; screen composes. Refactor a component → only its fragment changes.</li>
  <li><em>"Why use variables?"</em> — Persisted queries (one query string, many inputs); cache reuse; type safety; injection safety; codegen.</li>
  <li><em>"What's the difference between a fragment and an inline fragment?"</em> — Named fragment is reusable + composable; inline fragment (<code>... on Type {}</code>) is anonymous and used for type narrowing on unions / interfaces.</li>
  <li><em>"How do mutations update the cache?"</em> — If the mutation returns an entity with <code>id</code> + <code>__typename</code>, Apollo auto-updates that record. For lists / connections, you need <code>update</code> callback to insert / remove.</li>
  <li><em>"What's the difference between <code>data</code> + <code>errors</code>?"</em> — GraphQL returns partial responses; <code>data</code> may be present even when <code>errors</code> exist. Path-scoped errors point at which fields failed.</li>
  <li><em>"How do you debug a slow query?"</em> — Apollo Studio tracing; server-side spans; complexity / depth metrics; persisted-query operation names enable per-operation analytics.</li>
  <li><em>"How would you cache a query that depends on the current user?"</em> — Variables include user id (or token); Apollo auto-keys cache by variables. For per-user data scope cache to <code>cache.identify({ __typename: 'User', id: userId })</code>.</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Build a tiny app with Apollo Client; write 5 queries + 3 mutations.</li>
  <li>Practice composing fragments per component.</li>
  <li>Write a result-type union for one mutation; wire <code>__typename</code> branching.</li>
  <li>Write a subscription over WebSocket.</li>
  <li>Run GraphQL Codegen; inspect generated types.</li>
  <li>Use GraphiQL / Apollo Sandbox to explore introspection.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read the GraphQL spec sections on Operations + Selections + Fragments + Directives."</li>
  <li>"Build a Relay-style app to feel fragment masking + connections."</li>
  <li>"Compare query shapes between Shopify / GitHub / Stripe (which still ships REST) — see real-world patterns."</li>
  <li>"Wire persisted queries end-to-end on a tiny app."</li>
</ul>
`
    }
  ]
});
