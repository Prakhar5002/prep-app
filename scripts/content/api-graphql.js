window.PREP_SITE.registerTopic({
  id: 'api-graphql',
  module: 'api-design',
  title: 'GraphQL Schema Design',
  estimatedReadTime: '50 min',
  tags: ['graphql', 'schema', 'resolvers', 'dataloader', 'pagination', 'federation', 'persisted-queries', 'apollo'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>GraphQL</strong> is a query language for APIs where the client picks the exact shape it needs from a typed schema, and the server returns exactly that shape. The wins: one endpoint, no over-/under-fetching, end-to-end types, evolvable without versioning. The costs: caching is harder (POST by default), schema design is its own discipline, and resolvers fan out into N+1 queries unless you batch.</p>
<ul>
  <li><strong>One endpoint, one HTTP method:</strong> almost always <code>POST /graphql</code> with a JSON body containing <code>query</code> + <code>variables</code> + optional <code>operationName</code>.</li>
  <li><strong>Three operation types:</strong> Query (read), Mutation (write), Subscription (server push, usually over WebSocket).</li>
  <li><strong>Resolvers:</strong> one function per field. Composition gives flexibility; lack of batching gives N+1. Solve with <strong>DataLoader</strong>.</li>
  <li><strong>Pagination:</strong> Relay-style cursor connections (edges + pageInfo) is the standard.</li>
  <li><strong>Errors:</strong> top-level <code>errors</code> array for system failures; for expected failures, model results as a <strong>union / result type</strong>.</li>
  <li><strong>Versioning:</strong> evolve by adding fields and deprecating old ones (<code>@deprecated(reason: "…")</code>); rarely cut a v2.</li>
  <li><strong>Federation:</strong> multiple subgraphs compose into one supergraph. Use when the org has multiple teams owning their slice.</li>
  <li><strong>Performance levers:</strong> persisted queries, query complexity / depth limits, response caching keyed by query + variables, automatic batching at the client.</li>
</ul>
<p><strong>Mantra:</strong> "The client picks the shape. The server batches the fetch. The schema is the contract."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>The shape of a GraphQL request/response</h3>
<pre><code class="language-graphql"># Query
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    avatarUrl
    posts(first: 5) {
      edges { node { id title } }
    }
  }
}
</code></pre>
<pre><code class="language-json">{
  "data": {
    "user": {
      "id": "42",
      "name": "Prakhar",
      "avatarUrl": "https://...",
      "posts": { "edges": [{ "node": { "id": "1", "title": "Hello" } }] }
    }
  }
}
</code></pre>
<p>Same request asks for what it needs. Want the email too? Add <code>email</code> to the selection set; the server already had it.</p>

<h3>Why GraphQL exists</h3>
<table>
  <thead><tr><th>REST pain</th><th>GraphQL answer</th></tr></thead>
  <tbody>
    <tr><td>Over-fetching: <code>/users/42</code> returns 30 fields, you needed 3.</td><td>Selection set: ask for 3, get 3.</td></tr>
    <tr><td>Under-fetching: 1 user + 1 posts call + 1 comments call = 3 round trips.</td><td>One query, server resolves everything.</td></tr>
    <tr><td>Versioning: every breaking change forks the URL.</td><td>Evolve by adding fields, deprecating old ones.</td></tr>
    <tr><td>Schema lives in docs / OpenAPI yaml; types drift.</td><td>Schema is the runtime contract; codegen is built-in.</td></tr>
    <tr><td>Different clients want different fields.</td><td>Each client expresses its own needs.</td></tr>
  </tbody>
</table>

<h3>Where GraphQL hurts</h3>
<ul>
  <li><strong>Caching is harder:</strong> POST + dynamic queries means HTTP cache layers can't fingerprint trivially. Use persisted queries to make queries GET-able.</li>
  <li><strong>N+1 queries</strong> are the default surprise. Without DataLoader, a list of 50 users with author info = 51 DB calls.</li>
  <li><strong>Schema design is hard.</strong> You'll regret leaky types, weak nullability, "God objects."</li>
  <li><strong>Auth gets complex:</strong> field-level / type-level / depth-based permissions all coexist.</li>
  <li><strong>Public APIs are awkward:</strong> arbitrary queries from unknown clients = expensive queries DoS risk.</li>
  <li><strong>Tooling overhead:</strong> server framework, codegen, gateway, tracing, persisted-query store.</li>
</ul>

<h3>When GraphQL fits</h3>
<ul>
  <li>Mobile + web product owned by same org with diverse view requirements.</li>
  <li>Microservices stitched into one client-facing graph (federation).</li>
  <li>Read-heavy apps where over-fetching pain is real.</li>
  <li>Internal tools where schema-driven UIs (admin dashboards) save engineering time.</li>
</ul>

<h3>When to reach for something else</h3>
<table>
  <thead><tr><th>Scenario</th><th>Better fit</th></tr></thead>
  <tbody>
    <tr><td>Public, polyglot consumers</td><td>REST + OpenAPI</td></tr>
    <tr><td>Single-team TS-only product</td><td>tRPC (lighter, no schema language)</td></tr>
    <tr><td>Service-to-service RPC</td><td>gRPC</td></tr>
    <tr><td>Streaming / pub-sub heavy</td><td>WebSocket / SSE direct</td></tr>
    <tr><td>Simple CRUD with CDN caching</td><td>REST</td></tr>
  </tbody>
</table>

<h3>The schema mental model</h3>
<p>The schema is a <strong>graph</strong>. Types are nodes; fields are edges. Clients walk edges to compose responses. Designing GraphQL is designing the graph: what's a thing, what relates to what, what's required, what nullable.</p>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The 6 type kinds</h3>
<table>
  <thead><tr><th>Kind</th><th>Use for</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td>Object type</td><td>A thing with fields</td><td><code>type User { id: ID! name: String! }</code></td></tr>
    <tr><td>Scalar</td><td>Leaf value</td><td><code>String</code>, <code>Int</code>, <code>Boolean</code>, <code>ID</code>, custom (<code>DateTime</code>, <code>JSON</code>)</td></tr>
    <tr><td>Enum</td><td>Closed set of values</td><td><code>enum Role { ADMIN MEMBER GUEST }</code></td></tr>
    <tr><td>Interface</td><td>Contract reusable across types</td><td><code>interface Node { id: ID! }</code></td></tr>
    <tr><td>Union</td><td>One-of without shared fields</td><td><code>union SearchResult = User | Post | Comment</code></td></tr>
    <tr><td>Input type</td><td>Argument shape (no resolvers)</td><td><code>input CreateUserInput { name: String! email: String! }</code></td></tr>
  </tbody>
</table>

<h3>Nullability is a contract</h3>
<p>By default everything is nullable. <code>!</code> makes it non-null. Get this wrong and you've shipped a footgun.</p>
<ul>
  <li><strong>Bias toward nullable</strong> for forward-compatibility — a field that must always exist is brittle if a downstream service goes down.</li>
  <li><strong>Non-null IDs:</strong> if there's no ID, the entity doesn't exist; a missing ID is a bug.</li>
  <li><strong>Non-null lists vs items:</strong> <code>[Post!]!</code> means "a list (always present) of non-null Posts." <code>[Post]</code> means "list may be null, items may be null." Pick deliberately.</li>
  <li><strong>Mutation results:</strong> nullable when failures are expected; result-type unions when failures are domain events.</li>
</ul>

<h3>Query, Mutation, Subscription</h3>
<table>
  <thead><tr><th>Operation</th><th>Use for</th><th>Side effects</th><th>Field execution</th></tr></thead>
  <tbody>
    <tr><td>Query</td><td>Reads</td><td>None</td><td>Parallel</td></tr>
    <tr><td>Mutation</td><td>Writes</td><td>Yes</td><td>Sequential top-level fields</td></tr>
    <tr><td>Subscription</td><td>Server push</td><td>None</td><td>One field at a time, long-lived</td></tr>
  </tbody>
</table>

<h3>Resolver mental model</h3>
<p>Each field has (or inherits) a resolver: <code>(parent, args, context, info) =&gt; value</code>. Resolvers form a tree — root resolver returns the User, User.posts resolver returns posts, Post.author resolver returns the author. Each call to <code>Post.author</code> can be its own DB hit unless batched.</p>

<pre><code class="language-typescript">const resolvers = {
  Query: {
    user: (_, { id }, ctx) =&gt; ctx.db.users.byId(id),
  },
  User: {
    posts: (user, args, ctx) =&gt; ctx.db.posts.byAuthor(user.id, args),
  },
  Post: {
    author: (post, _, ctx) =&gt; ctx.loaders.user.load(post.authorId), // DataLoader
  },
};
</code></pre>

<h3>The N+1 problem and DataLoader</h3>
<p>Without batching, <code>posts(first: 50)</code> with each <code>post.author</code> resolved = 51 queries. <strong>DataLoader</strong> coalesces concurrent <code>load(id)</code> calls into one batch per tick, plus per-request memoization.</p>

<pre><code class="language-typescript">import DataLoader from 'dataloader';

function makeLoaders(db) {
  return {
    user: new DataLoader(async (ids) =&gt; {
      const rows = await db.users.byIds(ids);
      const map = new Map(rows.map(r =&gt; [r.id, r]));
      return ids.map(id =&gt; map.get(id) ?? null);
    }),
  };
}

// In context per request:
context: () =&gt; ({ db, loaders: makeLoaders(db) }),
</code></pre>
<p>Rules: one loader per request (per-request cache), batch by ID, return results in input order, return <code>null</code> for misses (not throw).</p>

<h3>The Relay cursor connection spec</h3>
<pre><code class="language-graphql">type Query {
  posts(first: Int, after: String, last: Int, before: String): PostConnection!
}

type PostConnection {
  edges: [PostEdge!]!
  pageInfo: PageInfo!
  totalCount: Int  # optional, often expensive
}

type PostEdge {
  node: Post!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
</code></pre>
<p>Why this shape: clients can paginate forward and backward, the cursor encodes the sort position opaquely, edges allow per-relationship metadata (e.g., when a follow happened), and the spec composes with Apollo / Relay caches.</p>

<h3>Versioning by deprecation</h3>
<pre><code class="language-graphql">type User {
  fullName: String! @deprecated(reason: "Use name instead.")
  name: String!
}
</code></pre>
<p>Add the new field, mark the old one deprecated, monitor usage, remove when usage hits zero. Do not cut <code>/v2</code>.</p>

<h3>Errors: two paths</h3>
<table>
  <thead><tr><th>Style</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td>Top-level <code>errors</code> array</td><td>System failures (DB down, auth missing, bad query)</td></tr>
    <tr><td>Result union types</td><td>Expected domain failures (validation, conflicts, "not found")</td></tr>
  </tbody>
</table>
<pre><code class="language-graphql">type Mutation {
  createUser(input: CreateUserInput!): CreateUserResult!
}

union CreateUserResult = User | EmailTaken | ValidationFailed

type EmailTaken { suggestedNames: [String!]! }
type ValidationFailed { fieldErrors: [FieldError!]! }
</code></pre>
<p>Result unions force clients to handle each outcome — TS narrowing makes this delightful.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Schema-first vs code-first</h3>
<table>
  <thead><tr><th>Style</th><th>Pros</th><th>Cons</th></tr></thead>
  <tbody>
    <tr><td>Schema-first (write SDL, codegen types)</td><td>Schema is the source of truth; designers can review SDL.</td><td>Requires codegen pipeline; drift between SDL and resolvers possible.</td></tr>
    <tr><td>Code-first (write TS classes/decorators, generate SDL)</td><td>Single source of truth in code; refactor safety.</td><td>SDL is generated, not authored; harder for non-coders to review.</td></tr>
  </tbody>
</table>
<p>Both work. TypeScript shops often pick code-first (Pothos, Nexus, TypeGraphQL) for refactor safety. Polyglot teams pick schema-first.</p>

<h3>Anatomy of a server (Apollo, Yoga, Mercurius, etc.)</h3>
<pre><code class="language-typescript">import { ApolloServer } from '@apollo/server';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== 'production',
  validationRules: [depthLimit(8), createComplexityLimitRule(1000)],
});

await server.start();
app.use('/graphql', expressMiddleware(server, {
  context: async ({ req }) =&gt; ({
    user: await authFromHeaders(req.headers),
    loaders: makeLoaders(),
  }),
}));
</code></pre>

<h3>Batching client-side (Apollo)</h3>
<p>Apollo's <code>HttpLink</code> can batch concurrent operations into one POST:</p>
<pre><code class="language-typescript">import { BatchHttpLink } from '@apollo/client/link/batch-http';

const link = new BatchHttpLink({
  uri: '/graphql',
  batchInterval: 10, // ms
  batchMax: 10,
});
</code></pre>
<p>Server must accept arrays of operations (most servers do by default).</p>

<h3>Persisted queries (APQ)</h3>
<p>The two big wins of APQ: smaller payloads (send a SHA256 hash, not the query body) and CDN-cacheable GETs.</p>
<pre><code class="language-text">// First request — server doesn't know the hash
POST /graphql
{ "extensions": { "persistedQuery": { "version": 1, "sha256Hash": "abc..." } } }

→ { "errors": [{ "extensions": { "code": "PERSISTED_QUERY_NOT_FOUND" } }] }

// Client retries with full query
POST /graphql
{ "query": "...", "extensions": { "persistedQuery": { "version": 1, "sha256Hash": "abc..." } } }

// Server caches; subsequent requests are GETs:
GET /graphql?extensions=...persistedQuery...
</code></pre>
<p>For mobile / public APIs, ship a <strong>build-time persisted query manifest</strong> — the server only accepts approved queries. Eliminates ad-hoc client queries and DoS from arbitrary nesting.</p>

<h3>Query complexity + depth limits</h3>
<pre><code class="language-typescript">import depthLimit from 'graphql-depth-limit';
import { createComplexityRule, simpleEstimator, fieldExtensionsEstimator } from 'graphql-query-complexity';

const rules = [
  depthLimit(8),
  createComplexityRule({
    maximumComplexity: 1000,
    estimators: [
      fieldExtensionsEstimator(), // honour @complexity directive
      simpleEstimator({ defaultComplexity: 1 }),
    ],
    onComplete: (cost) =&gt; console.log('query cost', cost),
  }),
];
</code></pre>
<p>Mark expensive fields:</p>
<pre><code class="language-graphql">type Query {
  feed(first: Int!): [Post!] @complexity(value: 5, multipliers: ["first"])
}
</code></pre>

<h3>Caching strategies</h3>
<table>
  <thead><tr><th>Layer</th><th>Approach</th></tr></thead>
  <tbody>
    <tr><td>HTTP / CDN</td><td>Persisted queries → GET → cache by URL hash. Set <code>Cache-Control</code> per-query.</td></tr>
    <tr><td>Server-side</td><td>Per-resolver cache keyed by args + auth scope. Apollo Server response cache plugin.</td></tr>
    <tr><td>DB / loader</td><td>DataLoader (per-request) + Redis (cross-request). Layered.</td></tr>
    <tr><td>Client</td><td>Apollo / Relay normalized cache by <code>__typename</code> + <code>id</code>. Optimistic updates.</td></tr>
  </tbody>
</table>

<h3>Subscriptions transport</h3>
<p>Most servers use <code>graphql-ws</code> over WebSocket; some use SSE for one-way. Apollo Server v4 ships subscription support via standalone <code>useServer</code> from <code>graphql-ws</code>:</p>
<pre><code class="language-typescript">import { useServer } from 'graphql-ws/lib/use/ws';
import { WebSocketServer } from 'ws';

const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });
useServer({ schema }, wsServer);
</code></pre>
<p>Subscriptions are usually backed by pub/sub: in-memory for dev, Redis Pub/Sub or Kafka for prod.</p>

<h3>Federation (Apollo)</h3>
<p>Multiple subgraphs (services) define their slice of the schema; a router composes them into a supergraph.</p>
<pre><code class="language-graphql"># users-subgraph
type User @key(fields: "id") {
  id: ID!
  name: String!
}

# posts-subgraph
type User @key(fields: "id") {
  id: ID! @external
  posts: [Post!]!
}

type Post {
  id: ID!
  title: String!
  author: User!
}
</code></pre>
<p>Router resolves <code>User.posts</code> by routing the sub-query to posts-subgraph; entity resolution by <code>id</code> ensures cross-subgraph joins.</p>

<h3>Auth: where to put it</h3>
<table>
  <thead><tr><th>Layer</th><th>Pattern</th></tr></thead>
  <tbody>
    <tr><td>Transport</td><td>JWT in <code>Authorization</code> header → context</td></tr>
    <tr><td>Schema</td><td><code>@auth</code> directive + custom validation rule</td></tr>
    <tr><td>Field</td><td>Wrap resolver: <code>requireAuth(resolver)</code> or check role inside</td></tr>
    <tr><td>Type</td><td>Whole types behind a guard — sensitive entities</td></tr>
  </tbody>
</table>

<pre><code class="language-graphql">directive @auth(role: Role!) on FIELD_DEFINITION

type User {
  id: ID!
  email: String! @auth(role: ADMIN)
}
</code></pre>

<h3>Custom scalars</h3>
<pre><code class="language-typescript">import { GraphQLScalarType } from 'graphql';

const DateTime = new GraphQLScalarType({
  name: 'DateTime',
  serialize: (v: unknown) =&gt; (v as Date).toISOString(),
  parseValue: (v: unknown) =&gt; new Date(v as string),
  parseLiteral: (ast) =&gt; ast.kind === 'StringValue' ? new Date(ast.value) : null,
});
</code></pre>
<p>Common custom scalars: <code>DateTime</code>, <code>JSON</code>, <code>EmailAddress</code>, <code>URL</code>, <code>Decimal</code>, <code>BigInt</code>. Document validation; use <code>graphql-scalars</code> library.</p>

<h3>Mutation conventions</h3>
<ul>
  <li><strong>One input type per mutation</strong>: <code>createUser(input: CreateUserInput!): User!</code>. Easier to add fields without breaking the call site.</li>
  <li><strong>Return the affected entity</strong> so clients can update caches without a second roundtrip.</li>
  <li><strong>Return rich payloads</strong> for related changes: <code>type CreateOrderPayload { order: Order! cart: Cart! user: User! }</code>.</li>
</ul>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Schema for a social timeline</h3>
<pre><code class="language-graphql">scalar DateTime
scalar URL

interface Node {
  id: ID!
}

type User implements Node {
  id: ID!
  handle: String!
  displayName: String!
  avatar: URL
  followers(first: Int!, after: String): UserConnection!
  posts(first: Int!, after: String): PostConnection!
}

type Post implements Node {
  id: ID!
  author: User!
  body: String!
  createdAt: DateTime!
  comments(first: Int!, after: String): CommentConnection!
  likeCount: Int!
  hasLiked: Boolean!
}

type Comment implements Node {
  id: ID!
  author: User!
  post: Post!
  body: String!
  createdAt: DateTime!
}

# Connection types (Relay spec)
type UserConnection { edges: [UserEdge!]! pageInfo: PageInfo! }
type UserEdge       { node: User!  cursor: String! }
type PostConnection { edges: [PostEdge!]! pageInfo: PageInfo! }
type PostEdge       { node: Post!  cursor: String! }
type CommentConnection { edges: [CommentEdge!]! pageInfo: PageInfo! }
type CommentEdge       { node: Comment! cursor: String! }
type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type Query {
  me: User
  user(handle: String!): User
  feed(first: Int!, after: String): PostConnection!
  search(q: String!, first: Int!, after: String): SearchConnection!
}

union SearchHit = User | Post

type Mutation {
  createPost(input: CreatePostInput!): CreatePostResult!
  likePost(postId: ID!): LikePostResult!
}

input CreatePostInput { body: String! }

union CreatePostResult = Post | ValidationFailed | RateLimited
type ValidationFailed { fieldErrors: [FieldError!]! }
type RateLimited      { retryAfterSeconds: Int! }
type FieldError { field: String! message: String! }

type Subscription {
  newComments(postId: ID!): Comment!
}
</code></pre>

<p>Why these choices:</p>
<ul>
  <li><code>Node</code> interface for global IDs (Relay) — clients can refetch any entity by ID.</li>
  <li><code>hasLiked</code> on Post — derived per-viewer, computed in the resolver from context.</li>
  <li><code>Connection</code> wrappers everywhere — consistent pagination shape.</li>
  <li>Result unions for mutations — clients exhaustively switch on outcomes.</li>
  <li>Subscription for real-time comments — server pushes via pub/sub.</li>
</ul>

<h3>Example 2: Resolver with DataLoader and auth</h3>
<pre><code class="language-typescript">interface Context {
  viewer: { id: string; role: 'ADMIN' | 'MEMBER' } | null;
  loaders: {
    user: DataLoader&lt;string, UserRow | null&gt;;
    likeCount: DataLoader&lt;string, number&gt;;
  };
  db: DB;
}

const Post = {
  author: (post: PostRow, _: unknown, ctx: Context) =&gt;
    ctx.loaders.user.load(post.authorId),

  likeCount: (post: PostRow, _: unknown, ctx: Context) =&gt;
    ctx.loaders.likeCount.load(post.id),

  hasLiked: async (post: PostRow, _: unknown, ctx: Context) =&gt; {
    if (!ctx.viewer) return false;
    return ctx.db.likes.exists({ postId: post.id, userId: ctx.viewer.id });
  },
};

const Mutation = {
  createPost: async (
    _: unknown,
    { input }: { input: CreatePostInput },
    ctx: Context
  ) =&gt; {
    if (!ctx.viewer) throw new GraphQLError('Unauthenticated', {
      extensions: { code: 'UNAUTHENTICATED' },
    });

    const errors = validateBody(input.body);
    if (errors.length) {
      return { __typename: 'ValidationFailed', fieldErrors: errors };
    }

    const allowed = await ctx.rateLimit.check(ctx.viewer.id, 'createPost');
    if (!allowed) {
      return { __typename: 'RateLimited', retryAfterSeconds: 30 };
    }

    const post = await ctx.db.posts.create({
      authorId: ctx.viewer.id,
      body: input.body,
    });
    return { __typename: 'Post', ...post };
  },
};
</code></pre>

<h3>Example 3: Cursor pagination resolver</h3>
<pre><code class="language-typescript">async function paginatedPosts(parent, { first, after }, ctx) {
  const limit = Math.min(first, 100);
  const cursor = after ? decodeCursor(after) : null;

  const rows = await ctx.db.posts.list({
    where: cursor ? { id: { lt: cursor.id } } : {},
    orderBy: { id: 'desc' },
    limit: limit + 1, // overfetch by 1 to detect hasNextPage
  });

  const hasNextPage = rows.length &gt; limit;
  const items = hasNextPage ? rows.slice(0, -1) : rows;

  return {
    edges: items.map(node =&gt; ({
      node,
      cursor: encodeCursor({ id: node.id }),
    })),
    pageInfo: {
      hasNextPage,
      hasPreviousPage: cursor !== null,
      startCursor: items[0] ? encodeCursor({ id: items[0].id }) : null,
      endCursor: items.at(-1) ? encodeCursor({ id: items.at(-1)!.id }) : null,
    },
  };
}

const encodeCursor = (obj) =&gt; Buffer.from(JSON.stringify(obj)).toString('base64url');
const decodeCursor = (s)   =&gt; JSON.parse(Buffer.from(s, 'base64url').toString());
</code></pre>

<h3>Example 4: Subscription with Redis Pub/Sub</h3>
<pre><code class="language-typescript">import { RedisPubSub } from 'graphql-redis-subscriptions';

const pubsub = new RedisPubSub({ connection: process.env.REDIS_URL });

const Mutation = {
  postComment: async (_, { postId, body }, ctx) =&gt; {
    const comment = await ctx.db.comments.create({
      postId, authorId: ctx.viewer.id, body,
    });
    await pubsub.publish(\`COMMENTS:\${postId}\`, { newComments: comment });
    return comment;
  },
};

const Subscription = {
  newComments: {
    subscribe: (_, { postId }) =&gt; pubsub.asyncIterator(\`COMMENTS:\${postId}\`),
  },
};
</code></pre>

<h3>Example 5: Federation entity</h3>
<pre><code class="language-graphql"># orders-subgraph
extend type User @key(fields: "id") {
  id: ID! @external
  orders: [Order!]!
}

type Order {
  id: ID!
  total: Money!
  items: [OrderItem!]!
}
</code></pre>
<pre><code class="language-typescript">// orders-subgraph resolvers
const User = {
  __resolveReference: (ref: { id: string }, ctx) =&gt; ({ id: ref.id }),
  orders: (user, _, ctx) =&gt; ctx.db.orders.byUserId(user.id),
};
</code></pre>
<p>The router calls <code>__resolveReference</code> with <code>{ id }</code> when a field on User from another subgraph references this one.</p>

<h3>Example 6: Client query with fragments</h3>
<pre><code class="language-graphql">fragment UserCard on User {
  id
  handle
  displayName
  avatar
}

fragment PostCard on Post {
  id
  body
  createdAt
  likeCount
  hasLiked
  author { ...UserCard }
}

query Feed($first: Int!, $after: String) {
  feed(first: $first, after: $after) {
    edges {
      node { ...PostCard }
      cursor
    }
    pageInfo { hasNextPage endCursor }
  }
}
</code></pre>
<p>Fragments are how clients keep selection sets DRY. Every component "owns" its fragment; the screen composes them into one query (Relay) or many (Apollo).</p>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>N+1 detection</h3>
<ul>
  <li>Apollo trace plugin shows resolver count + duration. If "User.author" fires 50 times for one query, you've got N+1.</li>
  <li>Add request-level metrics: total resolver calls, total DB queries. Alert if ratio is &gt; 5x.</li>
  <li>DataLoader is per-request — never share across requests; you'll cross-pollinate auth contexts.</li>
</ul>

<h3>Caching pitfalls</h3>
<ul>
  <li>HTTP cache by default doesn't work — POST + dynamic body. Use persisted queries for cacheability.</li>
  <li>Apollo client cache keys by <code>__typename + id</code>. Forget to ask for <code>id</code> and the cache de-duplicates incorrectly.</li>
  <li>Custom scalars need cache normalization rules; otherwise references break.</li>
  <li>Pagination connections need <code>keyArgs</code> + merge function in Apollo, otherwise <code>fetchMore</code> overwrites instead of appending.</li>
</ul>

<h3>Auth pitfalls</h3>
<ul>
  <li><strong>Field-level auth must run after parent resolution.</strong> Don't filter at the list level only; nested fields can leak.</li>
  <li><strong>Introspection in production:</strong> default-on means anyone can read your schema. Disable in prod or behind auth.</li>
  <li><strong>Errors leak entity existence.</strong> "Not authorized" vs "not found" tells attackers if a record exists. Be deliberate.</li>
  <li><strong>Per-field auth + DataLoader caching:</strong> if you cache by ID without scope, viewer A may see cached data fetched by viewer B. Key by ID + viewer.</li>
</ul>

<h3>Schema evolution traps</h3>
<ul>
  <li><strong>Removing a field is breaking.</strong> Mark <code>@deprecated</code>, monitor usage, remove only when zero.</li>
  <li><strong>Changing nullability from non-null to null is breaking</strong> — clients may not handle the null.</li>
  <li><strong>Renaming an enum value is breaking.</strong> Add new value, deprecate old, never delete.</li>
  <li><strong>Adding a required input field is breaking</strong> — old clients omit it. Add with a default or as nullable.</li>
  <li><strong>Changing field type</strong> (Int → ID) is breaking. Add a parallel field.</li>
</ul>

<h3>Subscription gotchas</h3>
<ul>
  <li>WebSocket reconnection: client libs auto-reconnect, but state on server may be lost. Re-authenticate on reconnect; consumers may need to "catch up" with a query.</li>
  <li>Backpressure: if a subscriber is slow, messages queue. Drop or batch on the publisher side.</li>
  <li>Cross-instance pub/sub: in-memory pub/sub doesn't scale past one node. Use Redis / Kafka / NATS.</li>
  <li>Mobile: WebSockets disconnect when app backgrounds. Reconnect on foreground; consider SSE or push for true background.</li>
</ul>

<h3>Public API surface</h3>
<ul>
  <li>Don't expose internal types. Map domain models to GraphQL types deliberately.</li>
  <li>Whitelist queries via persisted queries for public clients.</li>
  <li>Cap list sizes — <code>first: Int!</code> with server-enforced max.</li>
  <li>Depth + complexity limits non-negotiable.</li>
  <li>Rate limit per OAuth client / token.</li>
  <li>Disable introspection or restrict to authenticated requests.</li>
</ul>

<h3>Mobile GraphQL realities</h3>
<ul>
  <li>Apollo iOS / Android codegen — client types are generated; ship updates carefully.</li>
  <li>Persisted queries reduce payload + bandwidth on cellular.</li>
  <li>Background app: subscriptions die; rely on push (FCM / APNs) for true real-time.</li>
  <li>Optimistic updates are mandatory for write UIs (likes, follows) — clients can't wait for the round trip.</li>
  <li>Schema versioning matters across app versions: old clients still query old schema for months. Deprecate, don't delete.</li>
</ul>

<h3>Testing</h3>
<ul>
  <li>Schema diff tooling (<code>graphql-inspector</code>) in CI to catch breaking changes.</li>
  <li>Resolver unit tests + integration tests against a test DB.</li>
  <li>Persisted query tests: each app version's manifest must still be served.</li>
  <li>Visual regression on key client screens after schema changes.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 10 most common GraphQL mistakes</h3>
<ol>
  <li><strong>No DataLoader → N+1 queries.</strong> Single user with 50 posts hits the user table 50 times.</li>
  <li><strong>Mirroring the database schema.</strong> One-to-one with DB tables loses the "what does the client need" framing.</li>
  <li><strong>Returning nullable everywhere "for safety."</strong> Forces clients into defensive null checks; the schema becomes useless as a contract.</li>
  <li><strong>Returning non-null everywhere.</strong> Single resolver throw bubbles up and nullifies parent — whole branch goes <code>null</code>.</li>
  <li><strong>No depth / complexity limits.</strong> One client query can melt the DB.</li>
  <li><strong>Introspection enabled in prod for public APIs.</strong> Free schema dump for attackers.</li>
  <li><strong>Errors as strings.</strong> No <code>code</code> / <code>extensions</code> → clients can't branch on outcomes.</li>
  <li><strong>Wide mutation outputs that re-resolve everything.</strong> "Return the whole user after edit" reloads avatars, posts, etc. Return only what changed.</li>
  <li><strong>Custom pagination shapes.</strong> Drift from Relay spec; Apollo cache integration breaks.</li>
  <li><strong>Mixing transport, business, and schema concerns.</strong> Auth in resolvers AND in directives AND in middleware. Pick one layer.</li>
</ol>

<h3>Anti-pattern: mirroring REST</h3>
<pre><code class="language-graphql"># BAD — RPC-style verbs, GraphQL is being misused
type Mutation {
  getUser(id: ID!): User
  fetchUserPosts(userId: ID!): [Post!]!
  doLikePost(postId: ID!): Boolean!
}
</code></pre>
<p>Queries belong on <code>Query</code>; mutations are for writes; "do" is implicit.</p>

<h3>Anti-pattern: God objects</h3>
<pre><code class="language-graphql"># BAD — User exposes 100 fields
type User {
  id: ID!
  preferences: UserPreferences!
  notifications: NotificationSettings!
  billing: BillingProfile!
  posts: [Post!]!
  followers: [User!]!
  following: [User!]!
  # ... 50 more
}
</code></pre>
<p>Pure schema-wise this is fine — clients select what they want. But it tempts implementations to load everything. Prefer narrow types + explicit relations: <code>type UserCore</code>, <code>type UserBilling</code>, etc.</p>

<h3>Anti-pattern: returning <code>Boolean</code> from mutations</h3>
<pre><code class="language-graphql"># BAD
type Mutation { likePost(postId: ID!): Boolean! }

# GOOD
type Mutation { likePost(postId: ID!): LikePostResult! }
type LikePostResult { post: Post! }
</code></pre>
<p>Return the affected entity so clients can update without a second round trip.</p>

<h3>Anti-pattern: filter explosion as args</h3>
<pre><code class="language-graphql"># BAD
type Query {
  posts(authorId: ID, tag: String, before: DateTime, after: DateTime, status: Status, ...): [Post!]!
}

# GOOD
type Query { posts(filter: PostFilter, sort: PostSort, first: Int!, after: String): PostConnection! }
input PostFilter { authorId: ID, tag: String, range: DateRange, status: Status }
input DateRange { from: DateTime, to: DateTime }
</code></pre>

<h3>Anti-pattern: inconsistent IDs</h3>
<p>Mix of internal int IDs and global Relay IDs across types. Pick one. Relay style: <code>id: ID!</code> is opaque base64-encoded <code>type:internal_id</code>. Then clients can refetch any node via the <code>node(id: ID!)</code> root field.</p>

<h3>Anti-pattern: leaking pagination details</h3>
<pre><code class="language-graphql"># BAD
type Query { posts(offset: Int!, limit: Int!): [Post!]! }

# GOOD
type Query { posts(first: Int!, after: String): PostConnection! }
</code></pre>

<h3>Anti-pattern: stringly-typed errors</h3>
<pre><code class="language-json">// BAD
{ "errors": [{ "message": "user not found" }] }

// GOOD
{
  "errors": [{
    "message": "User not found",
    "extensions": { "code": "USER_NOT_FOUND", "userId": "42" }
  }]
}
</code></pre>

<h3>Anti-pattern: per-resolver auth checks</h3>
<pre><code class="language-typescript">// BAD — repeated everywhere, easy to miss
const Query = {
  user: (_, args, ctx) =&gt; { if (!ctx.viewer) throw ...; ... },
  post: (_, args, ctx) =&gt; { if (!ctx.viewer) throw ...; ... },
};

// GOOD — directive or middleware
schema = applyDirectiveTransforms(schema, { auth: authDirectiveTransformer });
</code></pre>

<h3>Anti-pattern: <code>JSON</code> scalar everywhere</h3>
<p><code>JSON</code> defeats the type system. If you find yourself using it, you've outgrown a pattern — either model it as a real type or extract it to a separate API.</p>

<h3>Anti-pattern: too-deep schema</h3>
<p><code>user.posts.comments.author.posts.comments.author...</code> — depth limit catches this. Senior teams prevent it at design time: posts return <code>commentCount</code>, not the full comment list.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common GraphQL design prompts</h3>
<ol>
  <li>Design a GraphQL schema for Twitter / Instagram / Reddit.</li>
  <li>Design a schema for an e-commerce product catalog + cart.</li>
  <li>Design a schema for a chat app.</li>
  <li>Design a federated schema across users, orders, products subgraphs.</li>
  <li>How would you handle pagination + caching for an infinite feed?</li>
  <li>How would you prevent a malicious client from DoS-ing the API?</li>
  <li>How would you migrate an existing REST API to GraphQL?</li>
  <li>How would you handle real-time updates (likes, comments)?</li>
</ol>

<h3>The 6-step framework for any GraphQL prompt</h3>
<ol>
  <li><strong>Clarify scope:</strong> read-heavy or write-heavy? Public or internal? Mobile + web?</li>
  <li><strong>Sketch the type graph.</strong> Domain entities, relationships, nullability.</li>
  <li><strong>Add cursor pagination + Node interface.</strong> Always.</li>
  <li><strong>Design mutations with input types + result unions.</strong></li>
  <li><strong>Address cross-cutting:</strong> N+1 (DataLoader), auth, complexity, errors, caching.</li>
  <li><strong>Talk through edges:</strong> subscriptions, persisted queries, evolution policy, federation.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"Cursor pagination via Relay connections — composes with Apollo cache + Relay client out of the box."</em></li>
  <li><em>"DataLoader per request, batched by ID, returns null for misses. Keeps N+1 from creeping in."</em></li>
  <li><em>"Result unions for mutations so the client exhaustively handles each outcome — TS narrowing makes the call site safe."</em></li>
  <li><em>"Persisted queries in production — smaller payloads, GET-able, no arbitrary queries from unknown clients."</em></li>
  <li><em>"Versioning by deprecation, never <code>/v2</code>. Add the new field, mark old <code>@deprecated</code>, monitor usage, remove."</em></li>
  <li><em>"Field-level auth via a <code>@auth</code> directive — single source of truth instead of resolver-by-resolver checks."</em></li>
  <li><em>"Federation if the org has multiple teams owning their slice; otherwise a single graph is simpler to evolve."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt keyword</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"feed", "timeline"</td><td>Relay connection + DataLoader + persisted queries</td></tr>
    <tr><td>"real-time", "live"</td><td>Subscription over WebSocket + Redis pub/sub</td></tr>
    <tr><td>"multiple teams", "modular"</td><td>Federation + subgraphs + entities</td></tr>
    <tr><td>"public API", "third-party"</td><td>Persisted queries only, depth + complexity, rate limit per client</td></tr>
    <tr><td>"prevent DoS"</td><td>Depth + complexity + persisted-only + per-client quotas</td></tr>
    <tr><td>"don't break clients"</td><td>Deprecation cycle, additive evolution, schema-diff CI</td></tr>
    <tr><td>"cache for speed"</td><td>Persisted GET + CDN + per-resolver server cache + DataLoader</td></tr>
    <tr><td>"mobile-first"</td><td>Persisted queries, optimistic updates, push for background updates</td></tr>
  </tbody>
</table>

<h3>Demo script (whiteboard / SDL editor)</h3>
<ol>
  <li>Sketch the entity types with key fields.</li>
  <li>Draw relationships (one-to-many, many-to-many).</li>
  <li>Annotate nullability deliberately.</li>
  <li>Add Connection types for pagination.</li>
  <li>Show one Query resolver + one Mutation with result union.</li>
  <li>Talk N+1: where would it bite, where would DataLoader sit.</li>
  <li>Walk through one realistic client query + variable.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"Persisted-query manifest generated from each client build."</em></li>
  <li><em>"Apollo / Relay client codegen wired into CI."</em></li>
  <li><em>"Schema diff in CI — break the build on incompatible changes."</em></li>
  <li><em>"Per-field cost weights tuned with real production traffic."</em></li>
  <li><em>"Federation router with auth + tracing centralised."</em></li>
  <li><em>"Subscription transport over <code>graphql-ws</code> with Redis pub/sub."</em></li>
  <li><em>"Field-level metrics — drop unused fields, inform deprecation."</em></li>
  <li><em>"Custom scalars: DateTime, Money, EmailAddress for stricter validation."</em></li>
  <li><em>"Optimistic UI for likes / follows on the client to hide latency."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Pagination instinct</td><td>Reaches for cursor connections without prompt</td></tr>
    <tr><td>N+1 awareness</td><td>Mentions DataLoader before it's asked about</td></tr>
    <tr><td>Schema design</td><td>Nullability deliberate; types narrow; result unions for failures</td></tr>
    <tr><td>Public-API security</td><td>Persisted queries, complexity, depth, rate limits</td></tr>
    <tr><td>Versioning</td><td>Deprecation cycle, additive-only evolution</td></tr>
    <tr><td>Federation knowledge</td><td>Knows when it fits; <code>@key</code>, <code>@external</code>, <code>__resolveReference</code></td></tr>
    <tr><td>Caching strategy</td><td>Multi-layer — CDN (persisted GET), server, DataLoader, client</td></tr>
    <tr><td>Mobile empathy</td><td>Persisted queries, optimistic UI, push fallback</td></tr>
    <tr><td>Restraint</td><td>Doesn't over-design; recommends REST when it'd fit better</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>Apollo Client iOS / Android / RN — type-safe codegen from schema; auto-cache normalization.</li>
  <li>Persisted queries: map app version → query manifest; reject unknown queries server-side.</li>
  <li>Optimistic UI mandatory: likes, follows, sends. Apollo's <code>optimisticResponse</code> updates cache instantly; rollback on error.</li>
  <li>Background fetch + suspended app: WebSocket subscriptions disconnect; rely on push notifications + polling for catch-up.</li>
  <li>Bandwidth: Apollo's automatic-batching link reduces round trips; persisted queries reduce payload; <code>@defer</code>/<code>@stream</code> (newer specs) prioritise above-the-fold rendering.</li>
  <li>Offline cache: Apollo's MMKV / SQLite persistence on RN — clients show stale data + revalidate.</li>
  <li>Schema versioning across long-installed app versions: keep deprecated fields working; remove only when usage hits zero.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"How would you handle a feed where authors live in one service and posts in another?"</em> — Federation, <code>@key(fields: "id")</code> on User in both subgraphs.</li>
  <li><em>"Why not just send the entire user object on a mutation?"</em> — Wide mutations re-resolve unrelated fields and bloat payload. Return only what changed.</li>
  <li><em>"How would you design a search endpoint?"</em> — Cursor connection on a union of result types; consider weight-based ranking exposed as a field.</li>
  <li><em>"How do you prevent a query that asks for posts → comments → posts → comments?"</em> — Depth limit + per-field complexity weights; persisted queries for production clients.</li>
  <li><em>"How do mutations stay idempotent?"</em> — Optional <code>clientMutationId</code> in input; server dedupes; result echoes the ID for client correlation.</li>
  <li><em>"How would you migrate an existing REST API to GraphQL?"</em> — Wrap REST in resolvers first, ship the schema, gradually move logic. Don't try big-bang.</li>
  <li><em>"What goes in the response cache vs DataLoader vs Redis?"</em> — DataLoader for per-request batching, Redis for cross-request entity caches, response cache for entire query results.</li>
</ul>

<h3>"What I'd do day one prepping GraphQL"</h3>
<ul>
  <li>Memorise the Relay connection spec.</li>
  <li>Build a small server end-to-end: schema, resolvers, DataLoader, auth directive, persisted queries.</li>
  <li>Read Shopify's GraphQL admin API docs — gold standard for schema design at scale.</li>
  <li>Read Apollo Federation docs — minimum supergraph + 2 subgraphs.</li>
  <li>Practice the 6-step framework on 5 prompts.</li>
  <li>Memorise common scalars + when to use them (<code>DateTime</code>, <code>JSON</code>, <code>EmailAddress</code>).</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read the GraphQL specification skim — it's only ~150 pages and very readable."</li>
  <li>"Build a tiny federation example with two services and a router."</li>
  <li>"Implement a custom complexity directive and tune it on real traffic."</li>
  <li>"Read GitHub's GraphQL API docs end to end."</li>
</ul>
`
    }
  ]
});
