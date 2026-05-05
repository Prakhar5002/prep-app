window.PREP_SITE.registerTopic({
  id: 'gql-advanced',
  module: 'graphql',
  title: 'Advanced',
  estimatedReadTime: '50 min',
  tags: ['graphql', 'advanced', 'persisted-queries', 'defer', 'stream', 'fragments', 'file-upload', 'batching', 'federation'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Advanced GraphQL</strong> covers the techniques that turn a working GraphQL client into a production-grade one: <strong>persisted queries</strong> for security + bandwidth, <strong>fragment masking</strong> for refactor safety, <strong>@defer / @stream</strong> for above-the-fold rendering, <strong>file uploads</strong> via multipart spec, <strong>request batching</strong>, <strong>error policies</strong>, <strong>federation from the client perspective</strong>, and the operational concerns (rate limiting, cost analysis, schema evolution, observability) every senior team has to solve.</p>
<ul>
  <li><strong>Persisted queries:</strong> ship a SHA-256 manifest at build time; server only honors known queries. Saves bandwidth, locks API surface, enables CDN caching via GET.</li>
  <li><strong>Fragment masking:</strong> Relay style — components only see the fields they declared. Compiler-enforced; refactor-safe.</li>
  <li><strong>@defer + @stream:</strong> incremental delivery. Above-the-fold renders fast; below-the-fold streams in.</li>
  <li><strong>File upload:</strong> <code>graphql-multipart-request-spec</code> — files outside the GraphQL JSON, referenced by path.</li>
  <li><strong>Request batching:</strong> bundle concurrent operations into one HTTP request — fewer round trips.</li>
  <li><strong>Error policies:</strong> partial-data handling; per-field error semantics.</li>
  <li><strong>Federation client perspective:</strong> one supergraph endpoint; entity references; <code>__resolveReference</code> stitching is server-side, transparent to client.</li>
  <li><strong>Operational:</strong> query complexity / depth limits, rate limiting, observability via tracing extension.</li>
</ul>
<p><strong>Mantra:</strong> "Persist queries for production. Mask fragments for refactor safety. Defer below-fold. Batch requests. Bound query cost. Trace operations."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>The advanced toolbox</h3>
<table>
  <thead><tr><th>Tool</th><th>Solves</th></tr></thead>
  <tbody>
    <tr><td>Persisted queries</td><td>Bandwidth, API surface lockdown, CDN cacheability</td></tr>
    <tr><td>Fragment masking</td><td>Component data isolation, refactor safety</td></tr>
    <tr><td>@defer / @stream</td><td>Time-to-first-paint with incremental data</td></tr>
    <tr><td>Multipart file uploads</td><td>Files alongside GraphQL operations</td></tr>
    <tr><td>Request batching</td><td>Fewer round trips for concurrent ops</td></tr>
    <tr><td>errorPolicy: 'all' / 'ignore' / 'none'</td><td>Partial-data handling</td></tr>
    <tr><td>Apollo Federation</td><td>Multiple subgraphs as one supergraph</td></tr>
    <tr><td>Query complexity / depth / rate limits</td><td>DoS protection</td></tr>
    <tr><td>Tracing extensions</td><td>Per-operation observability</td></tr>
    <tr><td>Schema diff in CI</td><td>Catch breaking changes pre-merge</td></tr>
  </tbody>
</table>

<h3>Why advanced techniques matter</h3>
<table>
  <thead><tr><th>Without</th><th>With</th></tr></thead>
  <tbody>
    <tr><td>Public API → arbitrary clients send arbitrary queries</td><td>Persisted only → server controls what runs</td></tr>
    <tr><td>Changing a fragment breaks every consumer silently</td><td>Compiler tells you exactly what changed</td></tr>
    <tr><td>Slow above-the-fold blocks below-the-fold</td><td>@defer / @stream lets each part arrive independently</td></tr>
    <tr><td>20 concurrent useQuery calls → 20 HTTP requests</td><td>Batch link → 1 HTTP request</td></tr>
    <tr><td>Single field error nullifies entire response branch</td><td>errorPolicy + nullable design = graceful degradation</td></tr>
    <tr><td>Multiple service teams + coordination chaos</td><td>Federation lets each team own a slice</td></tr>
    <tr><td>One bad query melts the DB</td><td>Complexity limits + rate limits per OAuth client</td></tr>
  </tbody>
</table>

<h3>What "production-grade GraphQL" looks like</h3>
<ul>
  <li>Persisted queries enforced in production; server rejects non-persisted hashes.</li>
  <li>Fragment-first component architecture; compiler-validated.</li>
  <li>Above-the-fold deferred render with @defer.</li>
  <li>File uploads via multipart spec.</li>
  <li>Batching link for concurrent ops.</li>
  <li>Error policies tuned per query.</li>
  <li>Schema diff in CI; breaking changes flagged before merge.</li>
  <li>Per-operation tracing in production; slow-query alerts.</li>
  <li>Complexity + depth limits server-side.</li>
  <li>Rate limits per OAuth client / API key.</li>
  <li>Federation if the org has multiple service teams.</li>
</ul>

<h3>What "amateur GraphQL" looks like</h3>
<ul>
  <li>Production accepts arbitrary queries from anyone.</li>
  <li>Anonymous queries; no operation analytics.</li>
  <li>Fragments shared via plain re-export; no compiler validation.</li>
  <li>Single huge query for every screen; long TTFB.</li>
  <li>One HTTP request per useQuery; N round trips.</li>
  <li>Single field error nullifies whole response; "everything broke."</li>
  <li>No complexity limits; one client melts the DB.</li>
  <li>Schema changes ship without diff review; clients break in production.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>Persisted queries flow</h3>
<pre><code class="language-text">Build time:
  - Codegen extracts all queries from src/
  - Compute SHA-256 hash per query
  - Output manifest: { hash → query string }
  - Ship manifest to server (env var, S3, DB)

Runtime (client):
  - Query → SHA-256 hash (precomputed)
  - Send only the hash + variables
  - If hash known: server executes
  - If hash unknown: server rejects (production) OR client retries with full query (APQ)
</code></pre>

<table>
  <thead><tr><th>Mode</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Automatic Persisted Queries (APQ)</td><td>Client tries hash; server falls back to "send full query"; server caches mapping. Forgiving.</td></tr>
    <tr><td>Manifest-based persisted queries</td><td>Build-time manifest shipped to server; server rejects unknown hashes. Strict; locks API surface.</td></tr>
  </tbody>
</table>

<h3>Why persisted queries are non-optional for serious apps</h3>
<ul>
  <li><strong>Bandwidth:</strong> mobile clients ship a 32-byte hash instead of a 4KB query — significant on cellular.</li>
  <li><strong>CDN cacheability:</strong> hash + variables fit in URL → GET → CDN cache hit possible.</li>
  <li><strong>Security:</strong> server doesn't accept arbitrary queries; eliminates ad-hoc DoS via deeply nested queries.</li>
  <li><strong>Observability:</strong> per-hash analytics; you know which queries are slow.</li>
  <li><strong>Schema change visibility:</strong> hash changes when query changes; you know which client versions are still using old shapes.</li>
</ul>

<h3>Fragment masking (Relay)</h3>
<p>Component declares its data needs as a fragment. The compiler generates a <em>fragment ref</em> type that's opaque — the parent passes it down without seeing the underlying fields. Inside the component, <code>useFragment</code> unwraps the ref into typed data.</p>

<pre><code class="language-typescript">// PostCard.tsx
const fragment = graphql\`
  fragment PostCard_post on Post {
    id
    title
    excerpt
  }
\`;

function PostCard({ post }: { post: PostCard_post$key }) {
  const data = useFragment(fragment, post);
  // data.id, data.title, data.excerpt
  // data.author → ERROR (not in fragment)
}

// Feed.tsx
const feedQuery = graphql\`
  query FeedQuery {
    feed {
      edges {
        node {
          ...PostCard_post  # parent passes the ref
        }
      }
    }
  }
\`;
</code></pre>

<p>Why this matters: refactor PostCard to need <code>author { name }</code> → fragment changes → compiler enforces that consumers re-generate types. Without fragment masking, components silently rely on fields the parent happened to fetch.</p>

<h3>@defer / @stream — incremental delivery</h3>
<pre><code class="language-graphql">query ProductPage($id: ID!) {
  product(id: $id) {
    id
    name
    price
    ... @defer(label: "details") {
      description
      reviews(first: 10) {
        edges {
          node {
            ...ReviewCard_review
          }
        }
      }
    }
  }
}
</code></pre>

<p>Server returns the initial payload immediately (<code>id</code>, <code>name</code>, <code>price</code>); product card renders. Then sends the deferred chunk; reviews appear when ready.</p>

<p><code>@stream</code> works on lists — items arrive incrementally:</p>
<pre><code class="language-graphql">query InfiniteList {
  items @stream(initialCount: 5, label: "items") {
    id
    name
  }
}
</code></pre>
<p>First 5 items arrive immediately; rest stream as they're resolved.</p>

<p>Transport: HTTP multipart response; client libraries (Apollo, Relay) handle parsing. Server support: Apollo Server, Hot Chocolate, others growing.</p>

<h3>File uploads — graphql-multipart-request-spec</h3>
<p>GraphQL is JSON; JSON can't hold binary. The multipart spec splits the request:</p>
<ul>
  <li>Field <code>operations</code>: the GraphQL operation, with file variables as <code>null</code>.</li>
  <li>Field <code>map</code>: maps file paths in the operation to multipart field names.</li>
  <li>Other fields: the actual file blobs.</li>
</ul>

<pre><code class="language-typescript">// Apollo + apollo-upload-client
import { createUploadLink } from 'apollo-upload-client';
const link = createUploadLink({ uri: '/graphql' });

// In a component
const UPLOAD = gql\`
  mutation UploadAvatar($file: Upload!) {
    uploadAvatar(file: $file) {
      url
    }
  }
\`;

const [upload] = useMutation(UPLOAD);

async function onSelectFile(file: File) {
  await upload({ variables: { file } });
}
</code></pre>

<p>Server side requires a scalar <code>Upload</code> resolver (graphql-upload, Mercurius file plugins). Big files → use S3 pre-signed URLs out-of-band instead.</p>

<h3>Request batching</h3>
<p>If your component tree fires 5 useQuery calls within a few ms, batching link bundles them into one HTTP POST with an array of operations.</p>
<pre><code class="language-typescript">import { BatchHttpLink } from '@apollo/client/link/batch-http';

const link = new BatchHttpLink({
  uri: '/graphql',
  batchInterval: 10, // ms
  batchMax: 10,
});
</code></pre>

<p>Server receives <code>[op1, op2, op3]</code> as an array; responds with <code>[result1, result2, result3]</code>. Most servers accept arrays by default. Tradeoff: batching delays each operation by up to <code>batchInterval</code>.</p>

<h3>Error policies</h3>
<table>
  <thead><tr><th>Policy</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td><code>none</code> (default)</td><td>Any error → throw; no <code>data</code> in result</td></tr>
    <tr><td><code>ignore</code></td><td>Errors suppressed; <code>data</code> returned even with partial</td></tr>
    <tr><td><code>all</code></td><td>Both <code>data</code> and <code>errors</code> exposed; you handle both</td></tr>
  </tbody>
</table>

<pre><code class="language-typescript">const { data, error } = useQuery(GET_USER, {
  variables: { id },
  errorPolicy: 'all', // see partial data + errors
});
</code></pre>

<p>Use <code>all</code> for screens with multiple independent data sources; one failure shouldn't blank the whole screen.</p>

<h3>Federation from the client</h3>
<p>The client doesn't know there are multiple services. It queries one supergraph URL; the router orchestrates calls to subgraphs and assembles the response.</p>
<p>Client-relevant aspects:</p>
<ul>
  <li>Same query language; same operation types.</li>
  <li>Cache normalization works the same — entities are still <code>__typename + id</code>.</li>
  <li>Latency may be higher; router adds a hop.</li>
  <li>Per-subgraph errors may surface as partial data.</li>
  <li>Router-level rate limits + complexity limits apply.</li>
</ul>

<h3>Query complexity + depth</h3>
<p>Server-side controls:</p>
<table>
  <thead><tr><th>Limit</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td>Max depth (e.g., 8)</td><td>Block cyclic queries (post.comments.author.posts.comments...)</td></tr>
    <tr><td>Max complexity score (e.g., 1000)</td><td>Per-field cost; total per query bounded</td></tr>
    <tr><td>Max alias count</td><td>Block alias-fanout abuse</td></tr>
    <tr><td>Rate limit per OAuth client</td><td>Beyond per-IP; for B2B clients</td></tr>
  </tbody>
</table>

<h3>Tracing + observability</h3>
<p>Server returns <code>extensions.tracing</code> per response with per-resolver durations. Apollo Studio aggregates; alert on slow queries / hot fields. Client-side: <code>onResponse</code> hook in Apollo logs operation name + duration.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Apollo APQ (automatic persisted queries)</h3>
<pre><code class="language-typescript">import { createPersistedQueryLink } from '@apollo/client/link/persisted-queries';
import { sha256 } from 'crypto-hash';

const persistedLink = createPersistedQueryLink({
  sha256,
  useGETForHashedQueries: true,
});

const link = from([persistedLink, httpLink]);
</code></pre>

<p>Flow:</p>
<ol>
  <li>Client computes SHA-256 of query → sends only the hash + variables.</li>
  <li>Server sees hash; if cached, runs query.</li>
  <li>If not cached, returns <code>PersistedQueryNotFound</code> error.</li>
  <li>Client retries with full query + hash.</li>
  <li>Server caches the (hash → query) mapping for next time.</li>
</ol>

<p>For maximum security, switch to <strong>manifest-based persisted queries</strong>: server only accepts queries from a build-time manifest; rejects unknown hashes outright.</p>

<h3>Build-time manifest with codegen</h3>
<pre><code class="language-yaml"># codegen.yml
schema: 'http://localhost:4000/graphql'
documents: 'src/**/*.{ts,tsx}'
generates:
  './persisted-queries.json':
    plugins:
      - graphql-codegen-persisted-query-ids:
          output: client
          algorithm: sha256
</code></pre>

<p>Output: JSON manifest <code>{ hash: query }</code>. Ship to server as part of deploy.</p>

<h3>Server-side enforcement</h3>
<pre><code class="language-typescript">// Apollo Server example with manifest
import { ApolloServer } from '@apollo/server';

const persistedQueries = JSON.parse(fs.readFileSync('persisted-queries.json'));

const server = new ApolloServer({
  typeDefs,
  resolvers,
  persistedQueries: {
    cache: {
      get: async (key) =&gt; persistedQueries[key.replace('apq:', '')],
      set: async () =&gt; {}, // no-op; only known queries allowed
    },
  },
});

// Custom plugin to reject non-persisted in prod
const rejectNonPersisted = {
  async requestDidStart() {
    return {
      async didResolveOperation({ request }) {
        if (process.env.NODE_ENV === 'production' &amp;&amp; request.query &amp;&amp; !request.extensions?.persistedQuery) {
          throw new Error('Non-persisted queries not allowed');
        }
      },
    };
  },
};
</code></pre>

<h3>@defer in Apollo Client</h3>
<pre><code class="language-graphql">query ProductDetails($id: ID!) {
  product(id: $id) {
    id
    name
    price
    inStock
    ... @defer(label: "reviews") {
      reviews(first: 20) {
        edges {
          node {
            id
            rating
            body
            author { id name }
          }
        }
      }
    }
  }
}
</code></pre>

<pre><code class="language-typescript">const { data, loading } = useQuery(PRODUCT_DETAILS, {
  variables: { id },
});

// data.product.reviews initially undefined; arrives after defer
return (
  &lt;&gt;
    &lt;ProductHeader product={data?.product} /&gt;
    {data?.product?.reviews
      ? &lt;ReviewList reviews={data.product.reviews} /&gt;
      : &lt;Skeleton type="reviews" /&gt;}
  &lt;/&gt;
);
</code></pre>

<p>Apollo Client 3.7+ supports <code>@defer</code> with multipart response parsing. Server: Apollo Server 4+, GraphQL Yoga, Hot Chocolate.</p>

<h3>@stream for lists</h3>
<pre><code class="language-graphql">query InfiniteList {
  items @stream(initialCount: 5, label: "items") {
    id
    name
  }
}
</code></pre>

<p>First 5 items arrive immediately; rest stream as resolved. Useful for paginated views where the client wants to render as items become available.</p>

<h3>File uploads with apollo-upload-client</h3>
<pre><code class="language-typescript">// link
import { createUploadLink } from 'apollo-upload-client';

const link = createUploadLink({
  uri: '/graphql',
  headers: { 'apollo-require-preflight': 'true' }, // CSRF protection
});

// schema
type Mutation {
  uploadAvatar(file: Upload!): UploadResult!
}

scalar Upload

// component
const UPLOAD = gql\`
  mutation UploadAvatar($file: Upload!) {
    uploadAvatar(file: $file) {
      url
    }
  }
\`;

function AvatarUploader() {
  const [upload, { loading, data }] = useMutation(UPLOAD);

  return (
    &lt;input
      type="file"
      onChange={(e) =&gt; {
        const file = e.target.files?.[0];
        if (file) upload({ variables: { file } });
      }}
    /&gt;
  );
}
</code></pre>

<p>For large files (videos, datasets) prefer pre-signed S3/GCS URLs:</p>
<pre><code class="language-typescript">// Step 1: Get a pre-signed URL via mutation
const { data } = await getUploadUrl({ variables: { contentType: 'video/mp4' } });
// Step 2: Upload directly to S3
await fetch(data.getUploadUrl.url, { method: 'PUT', body: file });
// Step 3: Confirm completion via mutation
await confirmUpload({ variables: { uploadId: data.getUploadUrl.id } });
</code></pre>

<h3>Batching with BatchHttpLink</h3>
<pre><code class="language-typescript">import { BatchHttpLink } from '@apollo/client/link/batch-http';

const link = new BatchHttpLink({
  uri: '/graphql',
  batchInterval: 10,
  batchMax: 10,
  batchDebounce: false, // batch every batchInterval; not on idle
  batchKey: (op) =&gt; {
    // Group by auth — different headers can't batch together
    return op.getContext().headers?.Authorization ?? '';
  },
});
</code></pre>

<p>Server receives:</p>
<pre><code class="language-json">[
  { "operationName": "GetUser", "query": "...", "variables": { "id": "1" } },
  { "operationName": "GetPosts", "query": "...", "variables": { "first": 10 } }
]
</code></pre>

<p>Responds with array in same order:</p>
<pre><code class="language-json">[
  { "data": { "user": {...} } },
  { "data": { "posts": {...} } }
]
</code></pre>

<h3>Error policies</h3>
<pre><code class="language-typescript">// Default — any error → throw, no data
const { data, error } = useQuery(GET_USER); // errorPolicy: 'none'

// All — both data and errors
const { data, error } = useQuery(GET_USER_AND_BILLING, {
  errorPolicy: 'all',
});
// data.user populated even if data.user.billing failed
// error contains the per-field errors

// Ignore — errors suppressed
const { data } = useQuery(NICE_TO_HAVE, {
  errorPolicy: 'ignore',
});
// data may have nulls; no error visible to component
</code></pre>

<h3>Schema diff in CI</h3>
<pre><code class="language-bash">npx graphql-inspector diff old-schema.graphql new-schema.graphql
# Outputs: breaking changes, dangerous changes, safe changes
# Exit code non-zero on breaking → fail PR
</code></pre>

<p>Or via Apollo Studio's <code>schema:check</code>:</p>
<pre><code class="language-bash">apollo schema:check --endpoint http://localhost:4000/graphql --variant production
</code></pre>

<h3>Client codegen with persisted hashes</h3>
<pre><code class="language-typescript">// Configure graphql-codegen to compute hashes
// codegen.ts
const config = {
  schema,
  documents: 'src/**/*.{ts,tsx}',
  generates: {
    './src/gql/': {
      preset: 'client',
      config: {
        documentMode: 'string',
        persistedDocuments: { hashAlgorithm: 'sha256' },
      },
    },
  },
};
</code></pre>

<p>Output includes per-query hash; client uses hash directly without computing at runtime.</p>

<h3>Query cost analysis</h3>
<p>Server-side: assign cost weights per field; bound total per query.</p>
<pre><code class="language-typescript">import { createComplexityRule, simpleEstimator, fieldExtensionsEstimator } from 'graphql-query-complexity';

const validationRules = [
  createComplexityRule({
    maximumComplexity: 1000,
    estimators: [
      fieldExtensionsEstimator(),  // honor @complexity directive
      simpleEstimator({ defaultComplexity: 1 }),
    ],
  }),
];
</code></pre>

<p>Annotate expensive fields:</p>
<pre><code class="language-graphql">type Query {
  feed(first: Int!): [Post!] @complexity(value: 5, multipliers: ["first"])
}
</code></pre>

<p>Now <code>feed(first: 100)</code> = 500 cost; bounded queries can't blow the budget.</p>

<h3>Tracing + observability</h3>
<pre><code class="language-typescript">// Server: enable tracing
import { ApolloServerPluginInlineTrace } from '@apollo/server/plugin/inlineTrace';

const server = new ApolloServer({
  // ...
  plugins: [ApolloServerPluginInlineTrace()],
});

// Client: log operation duration
const tracingLink = new ApolloLink((operation, forward) =&gt; {
  const start = performance.now();
  return forward(operation).map((response) =&gt; {
    const ms = performance.now() - start;
    log('graphql.operation', { name: operation.operationName, durationMs: ms });
    return response;
  });
});
</code></pre>

<p>Apollo Studio aggregates per-operation stats; slow queries trigger alerts.</p>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Persisted query manifest pipeline</h3>
<pre><code class="language-bash"># Build step — generate hashes
npx graphql-codegen --config codegen.yml

# Output: persisted-queries.json
# {
#   "abc123...": "query GetUser($id: ID!) { user(id: $id) { id name } }",
#   "def456...": "mutation Like($id: ID!) { likePost(id: $id) { post { id likeCount } } }"
# }
</code></pre>

<pre><code class="language-typescript">// Deploy: upload manifest to server
await s3.putObject({
  Bucket: 'manifests',
  Key: \`v\${BUILD_VERSION}/persisted-queries.json\`,
  Body: fs.readFileSync('persisted-queries.json'),
});

// Server: load manifest on boot
const persistedQueries = await loadManifest();

// Reject non-persisted in prod
const plugin = {
  async requestDidStart() {
    return {
      async didResolveOperation({ request }) {
        if (process.env.NODE_ENV === 'production') {
          if (!request.extensions?.persistedQuery) {
            throw new Error('All requests must be persisted');
          }
        }
      },
    };
  },
};
</code></pre>

<p>Now production server only honors known queries from the manifest. Attackers can't send arbitrary deeply-nested queries.</p>

<h3>Example 2: @defer for product page above-the-fold</h3>
<pre><code class="language-graphql">query ProductDetails($slug: String!) {
  product(slug: $slug) {
    id
    name
    price
    primaryImage { url alt }

    ... @defer(label: "details") {
      description
      specs { label value }
      tags { id name }
    }

    ... @defer(label: "reviews") {
      reviews(first: 10) {
        edges {
          node {
            id
            rating
            body
            author { id name avatarUrl }
          }
        }
      }
    }
  }
}
</code></pre>

<pre><code class="language-tsx">function ProductPage({ slug }) {
  const { data } = useQuery(PRODUCT_DETAILS, { variables: { slug } });

  return (
    &lt;&gt;
      {/* Renders immediately — initial payload */}
      {data?.product &amp;&amp; (
        &lt;&gt;
          &lt;ProductHero product={data.product} /&gt;
          &lt;BuyButton id={data.product.id} price={data.product.price} /&gt;
        &lt;/&gt;
      )}

      {/* Fades in when "details" defer arrives */}
      {data?.product?.description
        ? &lt;ProductDetailsSection product={data.product} /&gt;
        : &lt;Skeleton type="details" /&gt;}

      {/* Fades in when "reviews" defer arrives */}
      {data?.product?.reviews
        ? &lt;ReviewSection reviews={data.product.reviews} /&gt;
        : &lt;Skeleton type="reviews" /&gt;}
    &lt;/&gt;
  );
}
</code></pre>

<h3>Example 3: File upload with progress tracking</h3>
<pre><code class="language-typescript">import { createUploadLink } from 'apollo-upload-client';

// Custom link with upload progress
function uploadLinkWithProgress(uri) {
  return new ApolloLink((operation) =&gt; {
    return new Observable((observer) =&gt; {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', uri);
      xhr.upload.onprogress = (e) =&gt; {
        if (e.lengthComputable) {
          operation.getContext().onUploadProgress?.(e.loaded / e.total);
        }
      };
      xhr.onload = () =&gt; {
        observer.next(JSON.parse(xhr.response));
        observer.complete();
      };
      xhr.onerror = (err) =&gt; observer.error(err);

      // Build multipart form per spec
      const form = new FormData();
      const body = JSON.stringify({ query: print(operation.query), variables: operation.variables });
      form.append('operations', body);
      form.append('map', JSON.stringify({ "0": ["variables.file"] }));
      form.append('0', operation.variables.file);

      xhr.send(form);
      return () =&gt; xhr.abort();
    });
  });
}

// Component usage
function UploadAvatar() {
  const [progress, setProgress] = useState(0);
  const [upload] = useMutation(UPLOAD_AVATAR, {
    context: {
      onUploadProgress: (p) =&gt; setProgress(p),
    },
  });

  return /* ... */;
}
</code></pre>

<h3>Example 4: Pre-signed S3 upload (alternative to GraphQL multipart)</h3>
<pre><code class="language-graphql">type Mutation {
  getUploadUrl(input: GetUploadUrlInput!): GetUploadUrlPayload!
  confirmUpload(uploadId: ID!): ConfirmUploadPayload!
}

type GetUploadUrlPayload {
  url: String!
  uploadId: ID!
  expiresAt: DateTime!
}
</code></pre>

<pre><code class="language-typescript">async function uploadFile(file: File) {
  // 1. Get pre-signed URL
  const { data } = await getUploadUrl({
    variables: {
      input: { contentType: file.type, sizeBytes: file.size },
    },
  });

  // 2. Upload directly to S3 (skip GraphQL)
  await fetch(data.getUploadUrl.url, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });

  // 3. Confirm
  await confirmUpload({ variables: { uploadId: data.getUploadUrl.uploadId } });
}
</code></pre>

<p>For files &gt; ~10MB, pre-signed URLs are the only sane choice. Saves GraphQL server bandwidth + works around HTTP body size limits.</p>

<h3>Example 5: Batching with shared headers</h3>
<pre><code class="language-typescript">const batchLink = new BatchHttpLink({
  uri: '/graphql',
  batchInterval: 20,
  batchMax: 5,
  // Group operations by Authorization — different tokens can't batch together
  batchKey: (op) =&gt; op.getContext().headers?.Authorization ?? 'anon',
});

// Now N concurrent useQuery calls in a single screen
// → 1 HTTP POST with array of 5 operations
function ProfileScreen() {
  const user = useQuery(GET_USER, { variables: { id: '1' } });
  const posts = useQuery(GET_POSTS, { variables: { authorId: '1', first: 10 } });
  const followers = useQuery(GET_FOLLOWERS, { variables: { id: '1', first: 5 } });
  const stats = useQuery(GET_STATS, { variables: { id: '1' } });
  // ...
}
</code></pre>

<h3>Example 6: Per-query error policy</h3>
<pre><code class="language-typescript">// Critical query: any error blanks the screen
const { data, error } = useQuery(GET_ORDER, {
  variables: { id },
  errorPolicy: 'none',
});
if (error) return &lt;ErrorPage /&gt;;

// Multi-section query: render what works
const { data, error } = useQuery(GET_DASHBOARD, {
  errorPolicy: 'all',
});
return (
  &lt;&gt;
    {data?.user &amp;&amp; &lt;UserSection user={data.user} /&gt;}
    {data?.recentOrders &amp;&amp; &lt;OrdersSection orders={data.recentOrders} /&gt;}
    {data?.recommendations
      ? &lt;RecsSection recs={data.recommendations} /&gt;
      : &lt;ErrorBanner error={errorForPath(error, ['recommendations'])} /&gt;}
  &lt;/&gt;
);
</code></pre>

<h3>Example 7: Schema diff in CI</h3>
<pre><code class="language-yaml"># .github/workflows/schema-check.yml
name: GraphQL Schema Check

on: pull_request

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npx graphql-inspector diff origin/main:schema.graphql schema.graphql --rule recommended
        # Exits non-zero if breaking changes found
</code></pre>

<h3>Example 8: Client-side tracing</h3>
<pre><code class="language-typescript">const tracingLink = new ApolloLink((operation, forward) =&gt; {
  const start = performance.now();
  const opName = operation.operationName ?? 'anonymous';

  return forward(operation).map((response) =&gt; {
    const duration = performance.now() - start;

    if (duration &gt; 1000) {
      log('warn', \`Slow GraphQL: \${opName} took \${duration}ms\`, {
        variables: operation.variables,
        errors: response.errors,
      });
    }

    analytics.track('graphql.operation', {
      name: opName,
      durationMs: duration,
      hadErrors: !!response.errors,
    });

    return response;
  });
});

const link = from([tracingLink, errorLink, authLink, httpLink]);
</code></pre>

<h3>Example 9: Federation client (transparent)</h3>
<pre><code class="language-graphql"># Client doesn't know about subgraphs
query ProductWithReviews($id: ID!) {
  product(id: $id) {        # Resolved by 'products' subgraph
    id
    name
    price
    reviews {                # Resolved by 'reviews' subgraph via @key
      edges {
        node {
          id
          rating
          body
          author {           # Resolved by 'users' subgraph via @key
            id
            name
          }
        }
      }
    }
  }
}
</code></pre>

<p>The client sees one supergraph endpoint. Apollo Router stitches the response across subgraphs. Cache normalization works the same — entities are still <code>__typename + id</code>.</p>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>Persisted queries — hash mismatches</h3>
<ul>
  <li>Whitespace difference between client + server query strings → different hash → server doesn't recognize.</li>
  <li>Codegen normalizes formatting; manual edits break it.</li>
  <li>Mid-deploy: server has v3 manifest, client still on v2 → some queries unknown.</li>
  <li>Solution: deploy server first; let it accept both old + new manifests during rollout window.</li>
</ul>

<h3>APQ vs strict manifest</h3>
<ul>
  <li><strong>APQ:</strong> server falls back to "send full query" on unknown hash. Forgiving but can be abused.</li>
  <li><strong>Manifest-only:</strong> reject unknown. Strict; locks API surface but breaks ad-hoc dev queries against prod.</li>
  <li>Hybrid: manifest-only in production; APQ in staging.</li>
</ul>

<h3>@defer / @stream support</h3>
<ul>
  <li>Server must support multipart streaming responses; not all do (Apollo Server 4+, GraphQL Yoga, Hot Chocolate).</li>
  <li>Intermediate proxies / CDNs may buffer; defer chunks arrive together.</li>
  <li>Test in production-like environment; localhost may behave differently.</li>
  <li>Browser support: fetch with streaming; works in modern browsers.</li>
  <li>RN: may need polyfill or fall back to non-deferred queries.</li>
</ul>

<h3>File upload edge cases</h3>
<ul>
  <li>Large files exceed HTTP body limits; gateway 413 errors.</li>
  <li>For &gt; ~10MB, use pre-signed URLs; never push through GraphQL.</li>
  <li>CSRF: <code>apollo-require-preflight</code> header forces CORS preflight, blocking simple-CSRF attacks.</li>
  <li>Progress tracking requires custom transport — apollo-upload-client doesn't expose progress by default.</li>
</ul>

<h3>Batching gotchas</h3>
<ul>
  <li>Different headers (Authorization, Content-Type) can't share a batch — set <code>batchKey</code>.</li>
  <li>Subscriptions can't batch — they need separate transport.</li>
  <li>Long-running queries delay shorter ones in the same batch — set reasonable <code>batchMax</code>.</li>
  <li>Server failure on one operation may fail the whole batch (depends on server impl).</li>
  <li>Apollo Server treats batches as independent; one failing doesn't kill others.</li>
</ul>

<h3>Error policy + cache</h3>
<ul>
  <li>With <code>errorPolicy: 'all'</code>, partial data IS written to cache.</li>
  <li>If a critical field errored, you may cache <code>null</code> in its place.</li>
  <li>Subsequent reads return null without re-fetching. Mark such queries <code>fetchPolicy: 'cache-and-network'</code>.</li>
</ul>

<h3>Federation latency</h3>
<ul>
  <li>Each subgraph hop adds latency; cross-subgraph queries can be slow.</li>
  <li>Router caches entity resolution; warm caches help.</li>
  <li>Avoid wide cross-subgraph fan-out; design subgraphs around natural data ownership.</li>
</ul>

<h3>Query complexity false positives</h3>
<ul>
  <li>Cost weights are heuristics; real cost depends on data shape (sparse vs dense).</li>
  <li>Tune via real production traces; don't guess.</li>
  <li>Per-field overrides for known-cheap fields (cached, denormalized).</li>
</ul>

<h3>Schema diff false positives</h3>
<ul>
  <li>Renaming a field internally that no client uses — flagged as breaking.</li>
  <li>Use Apollo Studio's per-client query usage to confirm.</li>
  <li>graphql-inspector supports usage-aware diff via Apollo Studio integration.</li>
</ul>

<h3>Tracing data overhead</h3>
<ul>
  <li><code>extensions.tracing</code> can balloon response size.</li>
  <li>Sample (e.g., 1% of requests) in production; full tracing in staging.</li>
  <li>Or use OpenTelemetry; ship traces server-side without polluting response.</li>
</ul>

<h3>Multipart response parsing</h3>
<ul>
  <li>@defer + @stream return <code>multipart/mixed</code>; client must parse boundaries.</li>
  <li>Apollo Client + Relay handle natively; raw fetch doesn't.</li>
  <li>HTTP/2 + HTTP/3 work; HTTP/1 with proxies sometimes buffer.</li>
</ul>

<h3>RN angle</h3>
<ul>
  <li>Persisted queries especially valuable on mobile — bandwidth + bundle savings.</li>
  <li>@defer / @stream support is newer; test on RN's fetch implementation.</li>
  <li>File uploads: pre-signed S3 URLs preferred; mobile networks unreliable for large multipart.</li>
  <li>Federation client behaves the same; latency matters more on cellular.</li>
  <li>Subscription tracing: log per-message duration; identify backpressure.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common advanced-GraphQL mistakes</h3>
<ol>
  <li><strong>Production accepts non-persisted queries.</strong> Open API surface; ad-hoc DoS.</li>
  <li><strong>APQ in prod without manifest-only fallback.</strong> Attackers can still send arbitrary queries.</li>
  <li><strong>@defer used everywhere.</strong> Multipart parsing overhead; complicates client.</li>
  <li><strong>File upload through GraphQL for &gt; 10MB.</strong> Should be pre-signed URL.</li>
  <li><strong>Batching subscriptions.</strong> Subscriptions need separate transport.</li>
  <li><strong>Error policy 'all' without UI handling.</strong> Partial data renders broken UI.</li>
  <li><strong>No complexity / depth limits.</strong> One query melts the DB.</li>
  <li><strong>No schema diff in CI.</strong> Breaking changes ship.</li>
  <li><strong>No per-operation tracing.</strong> Slow queries invisible until users complain.</li>
  <li><strong>Federation without entity caching.</strong> Cross-subgraph latency multiplies.</li>
  <li><strong>Forgetting CSRF protection on uploads.</strong> Simple CSRF attack vector.</li>
  <li><strong>Manifest mid-deploy mismatch.</strong> Server has v3, client on v2; queries fail mid-rollout.</li>
</ol>

<h3>Anti-pattern: ad-hoc queries in production</h3>
<pre><code class="language-typescript">// BAD — server accepts anything
const server = new ApolloServer({ typeDefs, resolvers });

// GOOD — persisted-only in production
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    {
      async requestDidStart() {
        return {
          async didResolveOperation({ request }) {
            if (process.env.NODE_ENV === 'production' &amp;&amp;
                !request.extensions?.persistedQuery) {
              throw new Error('Persisted queries required in production');
            }
          },
        };
      },
    },
  ],
});
</code></pre>

<h3>Anti-pattern: @defer on every field</h3>
<pre><code class="language-graphql">// BAD — defer overhead exceeds benefit
query {
  user {
    id
    ... @defer { name }
    ... @defer { email }
    ... @defer { avatarUrl }
  }
}

// GOOD — defer expensive sections only
query {
  user {
    id
    name
    avatarUrl
    ... @defer { followers(first: 100) { ... } }  # expensive
  }
}
</code></pre>

<h3>Anti-pattern: large files through GraphQL</h3>
<pre><code class="language-typescript">// BAD — 100MB video through multipart
const [upload] = useMutation(UPLOAD_VIDEO);
upload({ variables: { file: videoBlob } });

// GOOD — pre-signed URL
const { data } = await getUploadUrl({ variables: { contentType: 'video/mp4' } });
await fetch(data.url, { method: 'PUT', body: videoBlob });
await confirmUpload({ variables: { id: data.uploadId } });
</code></pre>

<h3>Anti-pattern: errorPolicy 'ignore'</h3>
<pre><code class="language-typescript">// BAD — errors silenced; bugs hide
useQuery(Q, { errorPolicy: 'ignore' });

// GOOD — see errors; handle deliberately
useQuery(Q, { errorPolicy: 'all' });
</code></pre>

<h3>Anti-pattern: batching across auth boundaries</h3>
<pre><code class="language-typescript">// BAD — operation A has user X's token, operation B has user Y's token
// They share a batch → both go with whichever header was set first

// GOOD — batchKey discriminates
new BatchHttpLink({
  batchKey: (op) =&gt; op.getContext().headers?.Authorization ?? '',
});
</code></pre>

<h3>Anti-pattern: no complexity limit</h3>
<pre><code class="language-typescript">// BAD — server accepts arbitrarily deep queries
const server = new ApolloServer({ typeDefs, resolvers });

// GOOD — bounded
const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [
    depthLimit(8),
    createComplexityRule({ maximumComplexity: 1000, estimators: [...] }),
  ],
});
</code></pre>

<h3>Anti-pattern: no schema diff</h3>
<pre><code class="language-yaml"># BAD — schema changes merge without checks
# (no CI step)

# GOOD
- run: npx graphql-inspector diff origin/main:schema.graphql schema.graphql --rule recommended
</code></pre>

<h3>Anti-pattern: no per-operation tracing</h3>
<pre><code class="language-typescript">// BAD — no per-op metrics
const link = httpLink;

// GOOD — log every operation
const tracingLink = new ApolloLink((op, forward) =&gt; {
  const start = performance.now();
  return forward(op).map((res) =&gt; {
    log('graphql.op', {
      name: op.operationName,
      ms: performance.now() - start,
      hadErrors: !!res.errors,
    });
    return res;
  });
});
</code></pre>

<h3>Anti-pattern: federation without entity cache</h3>
<pre><code class="language-text">// BAD — every cross-subgraph query re-resolves entities
// router → subgraph A → subgraph B → subgraph C; latency multiplies

// GOOD — Apollo Router supports entity caching; configure
- name: entity_cache
  enabled: true
  ttl_seconds: 60
</code></pre>

<h3>Anti-pattern: file upload without CSRF protection</h3>
<pre><code class="language-typescript">// BAD — simple CSRF: a malicious page submits a form to your /graphql
const link = createUploadLink({ uri: '/graphql' });

// GOOD — require preflight (forces CORS check)
const link = createUploadLink({
  uri: '/graphql',
  headers: { 'apollo-require-preflight': 'true' },
});
</code></pre>

<h3>Anti-pattern: client-server hash skew</h3>
<pre><code class="language-text">// BAD — deploy client first; client sends new hashes; server doesn't know them
// Result: errors mid-rollout

// GOOD
// 1. Deploy server with new manifest (accepts old + new hashes during rollout)
// 2. Then deploy client
// 3. Then prune old hashes from server manifest
</code></pre>

<h3>Anti-pattern: tracing in response in prod</h3>
<pre><code class="language-typescript">// BAD — extensions.tracing balloons response size
ApolloServerPluginInlineTrace(); // always on

// GOOD — sample 1% in prod; OpenTelemetry for full coverage
ApolloServerPluginInlineTrace({
  samplingRate: 0.01,
});
</code></pre>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common advanced-GraphQL interview prompts</h3>
<ol>
  <li>How do persisted queries work? Why use them?</li>
  <li>Walk through @defer + @stream.</li>
  <li>How do you handle file uploads in GraphQL?</li>
  <li>Compare APQ vs manifest-based persisted queries.</li>
  <li>How do you protect a GraphQL API from DoS?</li>
  <li>How does fragment masking work in Relay?</li>
  <li>How do you observe a GraphQL operation in production?</li>
  <li>Tell me about a time you debugged a complex GraphQL issue.</li>
</ol>

<h3>The 5-step framework for "scale our GraphQL API"</h3>
<ol>
  <li><strong>Lock the API surface:</strong> persisted queries with build-time manifest; reject unknown in production.</li>
  <li><strong>Bound query cost:</strong> depth + complexity limits + per-field weights.</li>
  <li><strong>Speed perceived load:</strong> @defer / @stream for above-fold; batching link; codegen.</li>
  <li><strong>Observe:</strong> per-operation tracing + slow-query alerts + error rate per op.</li>
  <li><strong>Evolve safely:</strong> schema diff in CI; deprecate before remove; per-version usage telemetry.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"Persisted queries with build-time manifest in production. Server rejects unknown hashes — locks API surface, kills ad-hoc DoS, enables CDN cache via GET."</em></li>
  <li><em>"Fragment masking via Relay compiler — components only see fields they declared. Refactor a fragment → compiler tells me every consumer that needs to update."</em></li>
  <li><em>"@defer for sections that load slow — product page header renders fast, reviews stream in. Multipart response parsed by Apollo Client 3.7+ natively."</em></li>
  <li><em>"File uploads &gt; 10MB via pre-signed S3 URL, not GraphQL multipart — saves bandwidth + works around HTTP body limits."</em></li>
  <li><em>"BatchHttpLink for concurrent queries — N useQuery hooks in a screen → 1 HTTP POST. batchKey to discriminate by auth."</em></li>
  <li><em>"errorPolicy: 'all' for multi-section pages — partial data renders the working sections + error UI for the failed one."</em></li>
  <li><em>"Server-side: depth limit 8, complexity 1000, per-field cost weights tuned on real traffic. Rate limit per OAuth client."</em></li>
  <li><em>"Schema diff in CI via graphql-inspector. Apollo Studio for per-client query usage — informs deprecation timing."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"protect from DoS"</td><td>Persisted queries + complexity limits + rate limiting</td></tr>
    <tr><td>"slow above-fold"</td><td>@defer with multipart response</td></tr>
    <tr><td>"large file"</td><td>Pre-signed URL; never multipart through GraphQL</td></tr>
    <tr><td>"many concurrent queries"</td><td>BatchHttpLink with batchKey</td></tr>
    <tr><td>"partial render acceptable"</td><td>errorPolicy: 'all' + section-level error UI</td></tr>
    <tr><td>"refactor breaks consumers silently"</td><td>Relay fragment masking</td></tr>
    <tr><td>"track slow queries"</td><td>tracingLink + Apollo Studio</td></tr>
    <tr><td>"breaking change check"</td><td>graphql-inspector in CI</td></tr>
    <tr><td>"federation"</td><td>Apollo Router + entity caching</td></tr>
  </tbody>
</table>

<h3>Demo script</h3>
<ol>
  <li>Sketch the production architecture: client → batch link → persisted-query link → http link → router → subgraphs.</li>
  <li>Show the persisted-query manifest pipeline.</li>
  <li>Show one @defer query with skeleton fallback.</li>
  <li>Show pre-signed URL upload flow.</li>
  <li>Show errorPolicy: 'all' handling.</li>
  <li>Show server-side complexity rule + rate limit.</li>
  <li>Show schema-diff CI step.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"Manifest-only persisted queries — reject all unknown hashes in production."</em></li>
  <li><em>"@defer / @stream rollout for slow product pages."</em></li>
  <li><em>"OpenTelemetry tracing replacing inline tracing extension."</em></li>
  <li><em>"Per-OAuth-client cost budgets + per-tier rate limits."</em></li>
  <li><em>"Schema diff in CI with usage-aware breaking-change detection."</em></li>
  <li><em>"Per-operation slow-query alerts via Apollo Studio."</em></li>
  <li><em>"Federation entity caching at the router."</em></li>
  <li><em>"Fragment masking codegen for refactor safety."</em></li>
  <li><em>"Build-time persisted-query hash codegen with @graphql-codegen."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Persisted queries fluency</td><td>APQ vs manifest tradeoff named</td></tr>
    <tr><td>Defer / stream awareness</td><td>Knows when to use; multipart response</td></tr>
    <tr><td>File upload pragmatism</td><td>Pre-signed URLs for large; GraphQL multipart only for small</td></tr>
    <tr><td>Batching</td><td>Names concurrent-op savings + batchKey</td></tr>
    <tr><td>Error policies</td><td>Picks 'all' for multi-section deliberately</td></tr>
    <tr><td>DoS protection</td><td>Complexity + depth + rate + persisted</td></tr>
    <tr><td>Federation</td><td>Knows it's transparent to client; router orchestrates</td></tr>
    <tr><td>Observability</td><td>Per-op tracing, slow-query alerts</td></tr>
    <tr><td>Schema evolution</td><td>Diff in CI; usage-aware deprecation</td></tr>
    <tr><td>Restraint</td><td>Doesn't overuse defer / batching</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>Persisted queries on mobile = bandwidth + bundle savings. Manifest hashes shorter than full query strings.</li>
  <li>@defer / @stream support depends on RN's fetch impl + server compatibility — test before relying.</li>
  <li>File uploads: always pre-signed URLs for media; multipart through RN networking is brittle for large files.</li>
  <li>Batching saves cellular round trips; especially useful on app boot when many queries fire.</li>
  <li>Persisted queries enable build-time manifest distribution via OTA update channels.</li>
  <li>Federation works the same; client doesn't know.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"How would you protect a GraphQL endpoint from DoS?"</em> — Persisted queries (manifest-only); depth + complexity limits; rate limiting per OAuth client; CDN caching for cacheable queries; query timeouts; query allowlist for public endpoints.</li>
  <li><em>"How do persisted queries enable CDN caching?"</em> — APQ + <code>useGETForHashedQueries</code> sends the hash + variables in the URL → GET → CDN can cache the response. Can't cache a POST.</li>
  <li><em>"Walk through @defer's wire format."</em> — HTTP response is multipart/mixed. Initial chunk has <code>data</code> with deferred sections as null + <code>hasNext: true</code>. Subsequent chunks have <code>incremental: [{path, data}]</code> + <code>hasNext: bool</code>. Client merges as chunks arrive.</li>
  <li><em>"Why pre-signed URLs over GraphQL multipart for files?"</em> — GraphQL servers aren't optimized for binary; pre-signed URLs offload bandwidth to S3, which is. Avoids HTTP body limits, gateway timeouts, server memory pressure.</li>
  <li><em>"What's the cost of batching?"</em> — Up to <code>batchInterval</code> ms of latency for the first operation in a batch. Trade off ms-scale latency for round-trip savings.</li>
  <li><em>"How would you find a slow query in production?"</em> — Per-operation tracing + Apollo Studio aggregates; alert on p95 &gt; threshold per operation name. Persisted queries make per-op tracking trivial.</li>
  <li><em>"How does Relay's fragment masking enforce safety?"</em> — Compiler generates an opaque fragment ref type per fragment. Components receive the ref but only <code>useFragment</code> can unwrap to typed fields they declared. Refactor a fragment → consumers re-generate.</li>
  <li><em>"What's the difference between APQ and manifest-only persisted queries?"</em> — APQ: server falls back to "send full query" on unknown hash. Manifest-only: server rejects. Use manifest-only in production for security; APQ in dev for ergonomics.</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Set up persisted queries on a tiny app: APQ first, then build-time manifest.</li>
  <li>Wire BatchHttpLink + measure round-trip savings.</li>
  <li>Try @defer on a slow-loading page; verify multipart parsing.</li>
  <li>Build a pre-signed S3 upload flow.</li>
  <li>Configure server-side complexity + depth limits.</li>
  <li>Set up schema diff in CI with graphql-inspector.</li>
  <li>Add per-operation tracing client-side; log slow queries.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read Apollo Router docs for federation + entity caching."</li>
  <li>"Read Relay compiler internals for fragment masking implementation."</li>
  <li>"Build a defer/stream demo end to end; trace the multipart response."</li>
  <li>"Read GitHub's GraphQL API docs for real-world rate-limit + cost-budget patterns."</li>
</ul>

<h3>GraphQL module summary</h3>
<p>The complete GraphQL module covers:</p>
<ul>
  <li><strong>Basics</strong> — query language: operations, fragments, variables, aliases, directives, introspection, errors.</li>
  <li><strong>Client Libraries</strong> — Apollo / Relay / Urql / TanStack Query tradeoffs; codegen; setup; subscriptions; SSR.</li>
  <li><strong>Caching</strong> — normalized vs document; typePolicies; merge functions; optimistic UI; persistence; SSR safety.</li>
  <li><strong>Advanced</strong> (this topic) — persisted queries, @defer/@stream, file uploads, batching, error policies, federation, complexity limits, schema diff.</li>
</ul>
<p>4 topics. Together with <code>api-graphql</code> (schema design from the server perspective), they cover the full GraphQL stack — language → client → cache → production-grade operational concerns.</p>
`
    }
  ]
});
