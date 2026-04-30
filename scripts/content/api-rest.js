window.PREP_SITE.registerTopic({
  id: 'api-rest',
  module: 'api-design',
  title: 'REST Principles',
  estimatedReadTime: '45 min',
  tags: ['rest', 'http', 'api-design', 'idempotency', 'caching', 'pagination', 'status-codes', 'http-verbs'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>REST</strong> is an architectural style for distributed systems that uses HTTP as a protocol of <em>resources</em> (nouns) manipulated by <em>verbs</em> (GET, POST, PUT, PATCH, DELETE). The core appeal: it leverages everything HTTP already gives you — caching, status codes, content negotiation, redirects — and it's polyglot-friendly. The core pain: schemas are external (OpenAPI), error semantics drift, and over-/under-fetching is unavoidable for read-heavy UIs.</p>
<ul>
  <li><strong>Resources, not actions:</strong> URIs are nouns (<code>/users/42/orders</code>), not verbs (<code>/getOrdersForUser?id=42</code>).</li>
  <li><strong>Pick the right verb:</strong> GET reads, POST creates, PUT replaces, PATCH partially updates, DELETE removes. Use HEAD for existence + OPTIONS for CORS preflight.</li>
  <li><strong>Status codes carry semantics:</strong> 2xx success, 3xx redirect, 4xx client error, 5xx server error. Be specific — 422 for validation, 409 for conflict, 404 for missing, 401 for auth, 403 for permission.</li>
  <li><strong>Idempotency matters:</strong> GET, PUT, DELETE are idempotent by spec; POST isn't unless you add an <code>Idempotency-Key</code> header.</li>
  <li><strong>Pagination, filtering, sorting</strong> are first-class concerns: cursor &gt; offset for large or live datasets.</li>
  <li><strong>Cache aggressively:</strong> <code>Cache-Control</code>, <code>ETag</code>, <code>Last-Modified</code>, <code>304 Not Modified</code> save bandwidth and round-trips.</li>
  <li><strong>Errors:</strong> consistent shape — <code>application/problem+json</code> (RFC 7807) or your team's equivalent.</li>
</ul>
<p><strong>Mantra:</strong> "Resources as nouns, HTTP verbs as actions, status codes as semantics, headers as metadata."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What "REST" actually means</h3>
<p>REST (REpresentational State Transfer) is the dissertation thesis Roy Fielding wrote in 2000 that codified the constraints of HTTP-style architectures. In practice, "REST" today usually means HTTP+JSON APIs that <em>follow most</em> of those constraints. Pure REST is rare; "RESTful" is the working term.</p>

<h3>The 6 constraints (Fielding's original)</h3>
<table>
  <thead><tr><th>Constraint</th><th>What it means in practice</th></tr></thead>
  <tbody>
    <tr><td>Client–server</td><td>Clear separation of UI / data; clients evolve independently of servers.</td></tr>
    <tr><td>Stateless</td><td>Every request carries everything the server needs (auth token, body). No server-side session for the request itself.</td></tr>
    <tr><td>Cacheable</td><td>Responses must indicate whether they can be cached and for how long.</td></tr>
    <tr><td>Uniform interface</td><td>One way to address resources, one way to manipulate them.</td></tr>
    <tr><td>Layered system</td><td>Clients can't tell if they're talking to the origin or a CDN/proxy/gateway.</td></tr>
    <tr><td>Code-on-demand (optional)</td><td>Server can ship JS to clients (rarely cited; basically "the web").</td></tr>
  </tbody>
</table>

<h3>Why REST won the public-API battle</h3>
<ul>
  <li><strong>It uses HTTP, not on top of HTTP.</strong> Caching, redirects, content negotiation, observability — all free.</li>
  <li><strong>Every language has an HTTP client.</strong> Polyglot teams ship in days.</li>
  <li><strong>Tooling everywhere:</strong> Postman, curl, browser DevTools, OpenAPI, gateways, CDNs all speak HTTP natively.</li>
  <li><strong>Versioning &amp; cache stories</strong> are well-trodden — TTL + ETag + If-None-Match has been industry-default for 25 years.</li>
</ul>

<h3>Where REST hurts</h3>
<ul>
  <li><strong>Over- / under-fetching:</strong> "Give me a user with their orders and addresses" is 3 round trips or one bloated endpoint.</li>
  <li><strong>Schema drift:</strong> OpenAPI is external; nothing in HTTP enforces it. Frontend types lag the backend.</li>
  <li><strong>Verb mapping awkwardness:</strong> "Activate this account" — POST <code>/users/42/activate</code> or PATCH <code>/users/42 { status: "active" }</code>?</li>
  <li><strong>N+1 batching:</strong> client has to assemble multiple endpoints; mobile apps on bad networks pay for every round trip.</li>
  <li><strong>Realtime:</strong> REST is request/response. WebSockets / SSE bolted on, not native.</li>
</ul>

<h3>When REST is the right answer</h3>
<ul>
  <li>Public API consumed by partners / SDKs / curl / browsers.</li>
  <li>Polyglot consumers (Java, Go, Rust, Python, Swift, Kotlin, JS).</li>
  <li>CRUD-shaped domain (resources have natural URIs).</li>
  <li>You want CDN caching for read-heavy endpoints.</li>
  <li>Operational tooling (gateways, WAFs) speaks HTTP.</li>
</ul>

<h3>When to reach for something else</h3>
<table>
  <thead><tr><th>Scenario</th><th>Better fit</th></tr></thead>
  <tbody>
    <tr><td>Mobile-heavy product, narrow client list</td><td>GraphQL or tRPC — fewer round trips, type safety</td></tr>
    <tr><td>Realtime / bidirectional</td><td>WebSocket / SSE / WebRTC</td></tr>
    <tr><td>RPC-style internal service-to-service</td><td>gRPC / tRPC</td></tr>
    <tr><td>Streaming large payloads</td><td>HTTP/2 or gRPC streams</td></tr>
    <tr><td>Strict schema enforcement at compile time</td><td>tRPC / gRPC</td></tr>
  </tbody>
</table>

<h3>What "good REST" looks like to a senior reviewer</h3>
<ul>
  <li>Resource hierarchy reads like a sentence: <code>/orgs/42/projects/7/issues/15/comments</code>.</li>
  <li>Verbs match semantics. PUT and DELETE are idempotent by behaviour, not just by accident.</li>
  <li>Status codes are specific (422 not 400, 409 not 500, 204 not 200).</li>
  <li>Errors have a stable schema with code, message, details.</li>
  <li>Pagination is cursor-based by default; client doesn't paginate by counting.</li>
  <li>Caching headers exist and are honoured.</li>
  <li>Idempotency keys protect POST.</li>
  <li>Auth is one mechanism, documented; rate limits are documented.</li>
  <li>OpenAPI is generated from code (or vice versa) and published alongside the API.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>Resources, representations, and state</h3>
<p>A <strong>resource</strong> is a conceptual thing (a User, an Order, a list of Comments). A <strong>representation</strong> is a concrete encoding of that thing (JSON, XML, HTML). The same resource may have multiple representations negotiated via <code>Accept</code>:</p>
<pre><code class="language-http">GET /users/42 HTTP/1.1
Accept: application/json

GET /users/42 HTTP/1.1
Accept: text/html
</code></pre>

<h3>Verb cheat sheet</h3>
<table>
  <thead><tr><th>Verb</th><th>Use for</th><th>Idempotent</th><th>Safe</th><th>Body</th><th>Common status</th></tr></thead>
  <tbody>
    <tr><td>GET</td><td>Read a resource</td><td>✅</td><td>✅</td><td>none</td><td>200 / 304 / 404</td></tr>
    <tr><td>HEAD</td><td>Read headers only</td><td>✅</td><td>✅</td><td>none</td><td>200 / 404</td></tr>
    <tr><td>POST</td><td>Create / non-idempotent action</td><td>❌</td><td>❌</td><td>required</td><td>201 / 200 / 202 / 400 / 409</td></tr>
    <tr><td>PUT</td><td>Replace whole resource</td><td>✅</td><td>❌</td><td>required</td><td>200 / 204 / 404</td></tr>
    <tr><td>PATCH</td><td>Partial update</td><td>can be</td><td>❌</td><td>required</td><td>200 / 204 / 409</td></tr>
    <tr><td>DELETE</td><td>Remove resource</td><td>✅</td><td>❌</td><td>none/optional</td><td>200 / 204 / 404</td></tr>
    <tr><td>OPTIONS</td><td>CORS preflight, capability discovery</td><td>✅</td><td>✅</td><td>none</td><td>204</td></tr>
  </tbody>
</table>
<p><em>Safe</em> = no side effects on resource state. <em>Idempotent</em> = same call multiple times = same final state.</p>

<h3>Status code cheat sheet</h3>
<table>
  <thead><tr><th>Code</th><th>Meaning</th><th>When</th></tr></thead>
  <tbody>
    <tr><td>200 OK</td><td>Success with body</td><td>GET / PATCH that returns updated entity</td></tr>
    <tr><td>201 Created</td><td>Resource created</td><td>POST that produces a new entity; include <code>Location</code> header</td></tr>
    <tr><td>202 Accepted</td><td>Will be processed async</td><td>Long-running ops; return job ID + status URL</td></tr>
    <tr><td>204 No Content</td><td>Success, empty body</td><td>DELETE; PUT/PATCH with no return body</td></tr>
    <tr><td>301 / 308</td><td>Permanent redirect</td><td>URL moved; 308 preserves method</td></tr>
    <tr><td>302 / 307</td><td>Temporary redirect</td><td>307 preserves method (POST stays POST)</td></tr>
    <tr><td>304 Not Modified</td><td>Use cached version</td><td>GET with <code>If-None-Match</code> matched ETag</td></tr>
    <tr><td>400 Bad Request</td><td>Malformed request</td><td>Bad JSON, missing required field</td></tr>
    <tr><td>401 Unauthorized</td><td>No / invalid auth</td><td>Missing or expired token</td></tr>
    <tr><td>403 Forbidden</td><td>Authenticated but not allowed</td><td>Token valid, lacks permission</td></tr>
    <tr><td>404 Not Found</td><td>Resource doesn't exist</td><td>Includes "you can't see this" if hiding existence</td></tr>
    <tr><td>405 Method Not Allowed</td><td>Verb not supported</td><td>POST to read-only endpoint; include <code>Allow</code> header</td></tr>
    <tr><td>409 Conflict</td><td>State conflict</td><td>Optimistic lock failure, duplicate unique key</td></tr>
    <tr><td>410 Gone</td><td>Resource permanently removed</td><td>Sunset endpoint; better than 404 for retired</td></tr>
    <tr><td>415 Unsupported Media Type</td><td>Bad <code>Content-Type</code></td><td>Sent XML to a JSON endpoint</td></tr>
    <tr><td>422 Unprocessable Entity</td><td>Validation failed</td><td>Body parsed but failed business rules</td></tr>
    <tr><td>429 Too Many Requests</td><td>Rate-limited</td><td>Include <code>Retry-After</code></td></tr>
    <tr><td>500 Internal Server Error</td><td>Unhandled bug</td><td>Should be an alert; never expose stack trace</td></tr>
    <tr><td>502 Bad Gateway</td><td>Upstream returned junk</td><td>Reverse proxy can't get a sane reply</td></tr>
    <tr><td>503 Service Unavailable</td><td>Down or maintenance</td><td>Include <code>Retry-After</code></td></tr>
    <tr><td>504 Gateway Timeout</td><td>Upstream too slow</td><td>Often a chain-tightening problem</td></tr>
  </tbody>
</table>

<h3>URI design rules</h3>
<ol>
  <li><strong>Plural nouns:</strong> <code>/users/42</code> not <code>/user/42</code>.</li>
  <li><strong>Hierarchy reflects ownership:</strong> <code>/orgs/42/projects/7</code>.</li>
  <li><strong>No verbs in URIs.</strong> "Activate" → PATCH <code>/users/42 { status: "active" }</code> or POST <code>/users/42/activations</code>.</li>
  <li><strong>Lowercase, kebab-case.</strong> <code>/order-items</code> not <code>/orderItems</code>.</li>
  <li><strong>No file extensions.</strong> Negotiate with <code>Accept</code>, not <code>.json</code>.</li>
  <li><strong>Stable IDs.</strong> Use UUIDs or opaque IDs; don't leak DB sequences if you can help it.</li>
  <li><strong>Filtering / sorting / paging are query strings,</strong> not URI segments: <code>?status=active&amp;sort=-createdAt&amp;cursor=…</code>.</li>
  <li><strong>Avoid deep nesting beyond 2–3 levels.</strong> <code>/orgs/42/projects/7/issues/15</code> is fine; deeper becomes brittle.</li>
</ol>

<h3>Idempotency: why it matters</h3>
<p>An <strong>idempotent</strong> operation produces the same final state whether you call it once or N times. This matters because networks fail mid-request — clients retry, and you don't want duplicate orders.</p>
<table>
  <thead><tr><th>Verb</th><th>Idempotent by spec</th><th>How clients use it</th></tr></thead>
  <tbody>
    <tr><td>GET / HEAD</td><td>✅</td><td>Retry freely.</td></tr>
    <tr><td>PUT</td><td>✅</td><td>Retry freely. <em>"Set this resource to X"</em> N times = X.</td></tr>
    <tr><td>DELETE</td><td>✅</td><td>Retry freely. After first success, subsequent return 404 — that's fine.</td></tr>
    <tr><td>POST</td><td>❌</td><td>Use <code>Idempotency-Key: &lt;uuid&gt;</code> header — server dedupes.</td></tr>
    <tr><td>PATCH</td><td>Depends</td><td><code>{ status: "active" }</code> = idempotent. <code>{ counter: { $inc: 1 } }</code> isn't.</td></tr>
  </tbody>
</table>

<h3>Cacheability mental model</h3>
<p>Three layers of cache cooperation:</p>
<ol>
  <li><strong>Browser cache</strong> — controlled by <code>Cache-Control</code>; survives across requests in same tab/session.</li>
  <li><strong>CDN / shared cache</strong> — same headers; controlled by <code>s-maxage</code>, <code>public</code>.</li>
  <li><strong>App-level cache</strong> — controlled by <code>ETag</code> + <code>If-None-Match</code> revalidation.</li>
</ol>
<p>Default rule of thumb: GET with no Authorization → <code>Cache-Control: public, max-age=&lt;short&gt;</code>. Authenticated GET → <code>private, no-cache</code> + ETag.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Pagination strategies</h3>
<table>
  <thead><tr><th>Style</th><th>How</th><th>Pro</th><th>Con</th></tr></thead>
  <tbody>
    <tr><td>Offset / limit</td><td><code>?offset=40&amp;limit=20</code></td><td>Familiar, jumpable</td><td>Slow on large tables; rows shift, dupes/skips</td></tr>
    <tr><td>Page-based</td><td><code>?page=3&amp;perPage=20</code></td><td>Friendly URLs</td><td>Same problems as offset</td></tr>
    <tr><td>Cursor</td><td><code>?cursor=eyJpZCI6NDJ9</code></td><td>Stable across writes; fast</td><td>No "page 5" UX without extra work</td></tr>
    <tr><td>Keyset / seek</td><td><code>?after_id=42&amp;limit=20</code></td><td>Stable + index-friendly</td><td>Forward-only by default</td></tr>
  </tbody>
</table>
<p>Default for new APIs: <strong>cursor pagination</strong>. Encode the cursor opaque (base64 of the sort key) so clients can't mutate it.</p>

<pre><code class="language-json">// GET /orders?cursor=eyJpZCI6MTAwfQ%3D%3D&amp;limit=20
{
  "data": [ /* items */ ],
  "page": {
    "next_cursor": "eyJpZCI6MTIwfQ==",
    "has_more": true
  }
}
</code></pre>

<h3>Filtering, sorting, sparse fields</h3>
<pre><code class="language-text">GET /users?status=active&amp;role=admin
GET /users?createdAt[gte]=2026-01-01&amp;createdAt[lt]=2026-02-01
GET /users?sort=-createdAt,lastName
GET /users?fields=id,name,email
</code></pre>
<p>Conventions worth picking once and sticking to:</p>
<ul>
  <li>Equality: <code>?status=active</code></li>
  <li>Ranges: <code>?price[gte]=10&amp;price[lt]=100</code> or <code>?price=10..100</code></li>
  <li>Sort: <code>?sort=-createdAt,name</code> (leading <code>-</code> = descending)</li>
  <li>Sparse fields: <code>?fields=id,name</code> (saves bandwidth)</li>
  <li>Includes / expansion: <code>?expand=customer,items</code></li>
</ul>

<h3>Caching headers</h3>
<pre><code class="language-http">GET /products/42 HTTP/1.1
If-None-Match: "v3-abc"

HTTP/1.1 304 Not Modified
ETag: "v3-abc"
Cache-Control: public, max-age=60, s-maxage=300
</code></pre>
<table>
  <thead><tr><th>Header</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td><code>Cache-Control</code></td><td>How long to cache (<code>max-age</code>), where (<code>public</code> / <code>private</code>), revalidation (<code>no-cache</code> / <code>must-revalidate</code>).</td></tr>
    <tr><td><code>ETag</code></td><td>Opaque version token; client sends back via <code>If-None-Match</code>.</td></tr>
    <tr><td><code>Last-Modified</code></td><td>Timestamp; client sends back via <code>If-Modified-Since</code>.</td></tr>
    <tr><td><code>Vary</code></td><td>Tells caches the response varies by listed headers (<code>Accept-Encoding</code>, <code>Authorization</code>, <code>Accept-Language</code>).</td></tr>
    <tr><td><code>Age</code></td><td>How long the response has been cached (set by intermediaries).</td></tr>
  </tbody>
</table>

<h3>Idempotency keys for POST</h3>
<pre><code class="language-http">POST /orders HTTP/1.1
Idempotency-Key: 9f1c5d2e-7a3b-4d8e-9f1c-5d2e7a3b4d8e
Content-Type: application/json

{ "items": [...] }
</code></pre>
<p>Server stores <code>(idempotency_key, request_hash) → response</code> for some TTL (24h typical). On retry: same key → return cached response without re-executing. Different key → process normally. Same key + different body → 422 Conflict.</p>

<h3>Conditional updates (optimistic concurrency)</h3>
<pre><code class="language-http">PATCH /users/42 HTTP/1.1
If-Match: "v3-abc"
Content-Type: application/merge-patch+json

{ "status": "inactive" }
</code></pre>
<p>If the resource's current ETag isn't <code>v3-abc</code>, server returns <strong>412 Precondition Failed</strong> — preventing lost updates from concurrent clients.</p>

<h3>Long-running operations (LRO)</h3>
<pre><code class="language-text">POST /reports
→ 202 Accepted
   Location: /jobs/77
   Retry-After: 5

GET /jobs/77
→ 200 OK
  { "status": "running", "progress": 0.4 }

GET /jobs/77
→ 303 See Other
  Location: /reports/9911
</code></pre>

<h3>Auth patterns</h3>
<table>
  <thead><tr><th>Pattern</th><th>Where</th><th>When to use</th></tr></thead>
  <tbody>
    <tr><td>Bearer token (JWT / opaque)</td><td><code>Authorization: Bearer ...</code></td><td>Most APIs; OAuth-issued</td></tr>
    <tr><td>API key</td><td>Header or query (deprecated)</td><td>Server-to-server with simple auth</td></tr>
    <tr><td>HMAC signature</td><td>Header (<code>X-Signature</code>) over body + timestamp</td><td>Webhooks, AWS-style signing</td></tr>
    <tr><td>mTLS</td><td>TLS client certs</td><td>Service-to-service, B2B partners</td></tr>
    <tr><td>Cookie / session</td><td><code>Cookie:</code> header</td><td>Browser-only same-origin; pair with CSRF protection</td></tr>
  </tbody>
</table>

<h3>Error envelope (RFC 7807 problem+json)</h3>
<pre><code class="language-http">HTTP/1.1 422 Unprocessable Entity
Content-Type: application/problem+json

{
  "type": "https://example.com/errors/validation",
  "title": "Validation failed",
  "status": 422,
  "detail": "Email is required and must be unique.",
  "instance": "/users",
  "errors": [
    { "field": "email", "code": "required" },
    { "field": "email", "code": "duplicate" }
  ]
}
</code></pre>
<p>Pick one shape — RFC 7807 or your own — and use it everywhere. Inconsistent error shapes are the #1 client-team complaint.</p>

<h3>Rate limit headers</h3>
<pre><code class="language-http">HTTP/1.1 429 Too Many Requests
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 1714471800
Retry-After: 30
</code></pre>
<p>Modern <code>RateLimit-*</code> headers (RFC drafts) replace the old <code>X-RateLimit-*</code>. Both still seen. Always document which.</p>

<h3>Content negotiation</h3>
<pre><code class="language-http">GET /reports/9911
Accept: application/json
Accept: application/pdf
Accept: text/csv
</code></pre>
<p>Same resource, multiple representations. Server picks the best match and returns <code>Content-Type</code>. <code>406 Not Acceptable</code> if it can't satisfy.</p>

<h3>HATEOAS (hypermedia)</h3>
<p>Responses include links to related resources / next actions. Pure REST gospel; rare in practice. A pragmatic compromise:</p>
<pre><code class="language-json">{
  "id": 42,
  "status": "pending",
  "_links": {
    "self":   { "href": "/orders/42" },
    "cancel": { "href": "/orders/42/cancellation", "method": "POST" }
  }
}
</code></pre>
<p>Useful for state-machine APIs (only show <code>cancel</code> link when cancellable). Most teams skip and document state machines elsewhere.</p>

<h3>OpenAPI / Swagger</h3>
<p>OpenAPI is the schema language for REST. Use it as the contract:</p>
<pre><code class="language-yaml">paths:
  /users/{id}:
    get:
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200':
          content:
            application/json:
              schema: { $ref: '#/components/schemas/User' }
        '404':
          $ref: '#/components/responses/NotFound'
</code></pre>
<p>Generate types for every consumer (TS, Swift, Kotlin) and run contract tests in CI. The bigger your API surface, the more this pays off.</p>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Designing a Comments API</h3>
<p>Requirements: posts have many comments; comments have author, body, createdAt; comments support pagination, edits, deletes; abuse reports need to be tracked.</p>

<pre><code class="language-text">GET    /posts/{postId}/comments?cursor=...&amp;limit=20
POST   /posts/{postId}/comments
GET    /comments/{id}
PATCH  /comments/{id}
DELETE /comments/{id}
POST   /comments/{id}/reports
</code></pre>

<p>Why this shape:</p>
<ul>
  <li><code>/posts/{postId}/comments</code> for listing / creating: hierarchy makes ownership explicit.</li>
  <li><code>/comments/{id}</code> for read / update / delete: avoid forcing clients to remember postId for every op (URLs are routed independently).</li>
  <li>"Report a comment" is its own resource (<code>/comments/{id}/reports</code>) — it's a creation, not a mutation of the comment itself.</li>
  <li>Cursor pagination because comments are append-mostly with frequent inserts.</li>
</ul>

<pre><code class="language-http">POST /posts/42/comments
Authorization: Bearer ...
Idempotency-Key: 9f1c-...
Content-Type: application/json

{ "body": "Great post!" }

→ 201 Created
  Location: /comments/77
  ETag: "v1-abc"

  {
    "id": 77,
    "postId": 42,
    "authorId": 5,
    "body": "Great post!",
    "createdAt": "2026-04-30T12:00:00Z"
  }
</code></pre>

<h3>Example 2: PATCH semantics — JSON Merge Patch vs JSON Patch</h3>
<p>Two competing standards for partial updates:</p>

<h4>JSON Merge Patch (RFC 7396) — simpler, most common</h4>
<pre><code class="language-http">PATCH /users/42
Content-Type: application/merge-patch+json

{ "email": "new@example.com", "phone": null }
</code></pre>
<p>Rules: keys in the patch overwrite; <code>null</code> means delete. Doesn't support reordering arrays or deep ops.</p>

<h4>JSON Patch (RFC 6902) — operation-based</h4>
<pre><code class="language-http">PATCH /users/42
Content-Type: application/json-patch+json

[
  { "op": "replace", "path": "/email", "value": "new@example.com" },
  { "op": "remove",  "path": "/phone" },
  { "op": "add",     "path": "/tags/-", "value": "vip" }
]
</code></pre>
<p>Use Merge Patch by default. Reach for JSON Patch when the API needs precise array operations or atomic multi-field changes.</p>

<h3>Example 3: Bulk operations</h3>
<p>Clients hate N round trips. Three patterns:</p>

<h4>1. Array body (preferred when natural)</h4>
<pre><code class="language-http">POST /tags/bulk
{ "tags": [{ "name": "vip" }, { "name": "trial" }] }

→ 207 Multi-Status   (or 200 with per-item results)
  {
    "results": [
      { "status": 201, "data": { "id": 1, "name": "vip" } },
      { "status": 409, "error": { "code": "duplicate", "message": "..." } }
    ]
  }
</code></pre>

<h4>2. Batch transaction</h4>
<pre><code class="language-http">POST /transactions
{
  "operations": [
    { "method": "POST", "path": "/users", "body": {...} },
    { "method": "PATCH", "path": "/orgs/42", "body": {...} }
  ]
}
</code></pre>

<h4>3. Async job + polling</h4>
<pre><code class="language-http">POST /imports
→ 202 Accepted
  Location: /jobs/77
</code></pre>
<p>Pick batch transactions only if you genuinely need atomicity. Most "bulk" prompts want 1, not 2.</p>

<h3>Example 4: Versioning a breaking change</h3>
<p>Change: rename <code>full_name</code> → <code>name</code> on User. How to ship without breaking clients?</p>
<ol>
  <li>Add <code>name</code> alongside <code>full_name</code> in v1; both populated by same source.</li>
  <li>Document <code>full_name</code> as deprecated; emit <code>Deprecation</code> + <code>Sunset</code> headers when read.</li>
  <li>Track usage by header / oauth client.</li>
  <li>Email partners; show banner in dev portal.</li>
  <li>Cut v2 with only <code>name</code>. Sunset v1 after the announced window (often 6–12 months).</li>
</ol>
<pre><code class="language-http">HTTP/1.1 200 OK
Deprecation: true
Sunset: Wed, 31 Dec 2026 00:00:00 GMT
Link: &lt;https://api.example.com/v2/users/42&gt;; rel="successor-version"
</code></pre>

<h3>Example 5: File upload</h3>
<p>Three patterns; pick by file size + control needed.</p>
<table>
  <thead><tr><th>Approach</th><th>When</th></tr></thead>
  <tbody>
    <tr><td><code>multipart/form-data</code> POST</td><td>Small files (&lt;~10MB); one round trip; classic browser flow.</td></tr>
    <tr><td>Pre-signed S3/GCS URL</td><td>Anything bigger; client uploads direct to object storage; server only mints a URL. Saves bandwidth + scales.</td></tr>
    <tr><td>Resumable upload (tus, S3 multipart)</td><td>Large files on flaky networks (mobile). Upload in chunks; resume on disconnect.</td></tr>
  </tbody>
</table>

<pre><code class="language-http">POST /uploads
{ "filename": "photo.jpg", "size": 5242880, "contentType": "image/jpeg" }

→ 201 Created
  {
    "uploadUrl": "https://s3.amazonaws.com/.../photo.jpg?X-Amz-Signature=...",
    "fileId": "f-9911",
    "expiresIn": 900
  }
</code></pre>

<h3>Example 6: Webhook design</h3>
<p>Server pushes events to consumer URLs.</p>
<pre><code class="language-http">POST https://customer.example.com/webhooks/orders
X-Event-Type: order.completed
X-Event-Id: evt_9911
X-Signature: t=1714471800,v1=hex_hmac
Content-Type: application/json

{ "id": "evt_9911", "type": "order.completed", "data": { "orderId": 42 } }
</code></pre>
<ul>
  <li>Sign payloads with HMAC-SHA256; verify on receiver.</li>
  <li>Include event ID for dedup; consumers should be idempotent.</li>
  <li>Retry with exponential backoff on 5xx / 429.</li>
  <li>Stop on 4xx (except 429); send dead-letter alert.</li>
  <li>Document delivery guarantees: at-least-once, possibly out-of-order.</li>
</ul>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>Trailing slashes</h3>
<p>Pick one (with or without) and 308-redirect the other. Mixing breaks caches and bookmarks.</p>

<h3>Time zones</h3>
<ul>
  <li>Always serialise timestamps as <strong>ISO 8601 in UTC</strong> with <code>Z</code> suffix.</li>
  <li>If user-local time matters, send the IANA TZ (<code>"timeZone": "America/Los_Angeles"</code>) alongside UTC, never offsets like <code>-08:00</code> (DST drifts).</li>
  <li>Dates without time (birthdays): use <code>"YYYY-MM-DD"</code>; never store as a midnight UTC datetime.</li>
</ul>

<h3>Number precision</h3>
<ul>
  <li>JS clients lose precision past 2⁵³. Send IDs and money as strings: <code>"id": "9007199254740993"</code>, <code>"amount_cents": "1234567890"</code>.</li>
  <li>Money is integer cents (or smallest unit), never floats.</li>
  <li>Document decimal precision per field.</li>
</ul>

<h3>Null vs absent vs empty</h3>
<table>
  <thead><tr><th>Shape</th><th>Means</th></tr></thead>
  <tbody>
    <tr><td><code>{ "phone": null }</code></td><td>"phone is explicitly unset"</td></tr>
    <tr><td><code>{ "phone": "" }</code></td><td>"phone is empty string" (avoid; ambiguous)</td></tr>
    <tr><td><code>{ }</code> (key absent)</td><td>"phone is unspecified" (in PATCH, "don't change")</td></tr>
  </tbody>
</table>
<p>Pick one rule and document it. Merge Patch treats absent as "don't change" and <code>null</code> as "remove."</p>

<h3>Soft vs hard delete</h3>
<ul>
  <li>Soft delete (set <code>deletedAt</code>) preserves history but pollutes lists; remember to filter every query.</li>
  <li>Hard delete is simpler but irreversible. Pair with audit log + offline backup.</li>
  <li>Best of both: archive table for restored access; live table stays clean.</li>
</ul>

<h3>Slow / failing dependencies</h3>
<ul>
  <li><strong>Circuit breaker</strong> on calls to flaky upstreams; return 503 quickly instead of timing out.</li>
  <li><strong>Per-request timeouts</strong> at every hop; otherwise queues stack.</li>
  <li><strong>Bulkhead</strong>: limit concurrent calls to one upstream so one bad service doesn't drown the others.</li>
  <li>Return <code>503 + Retry-After</code> rather than <code>504</code> when you choose to fail fast.</li>
</ul>

<h3>Race conditions</h3>
<ul>
  <li><code>If-Match: ETag</code> for optimistic concurrency (<code>412 Precondition Failed</code> on conflict).</li>
  <li>Idempotency keys for double-tap on POST.</li>
  <li>Transactional DB writes; don't mutate cross-resource without a transaction.</li>
</ul>

<h3>CORS</h3>
<ul>
  <li>Browsers preflight non-simple requests with <code>OPTIONS</code>. Return <code>Access-Control-Allow-Origin</code>, <code>...Headers</code>, <code>...Methods</code>.</li>
  <li><code>Access-Control-Allow-Credentials: true</code> requires a specific origin (no <code>*</code>).</li>
  <li>Cache preflight: <code>Access-Control-Max-Age: 600</code>.</li>
  <li>Mobile RN doesn't trigger CORS — it's a browser concept. Document that clearly.</li>
</ul>

<h3>Compression</h3>
<ul>
  <li>Negotiate via <code>Accept-Encoding: gzip, br</code>. Brotli wins for large JSON; gzip is universal.</li>
  <li>Don't compress small payloads (&lt;1 KB) — overhead beats savings.</li>
  <li>Don't compress already-compressed (<code>image/png</code>, <code>application/zip</code>).</li>
  <li>Set <code>Vary: Accept-Encoding</code> so caches don't cross contaminate.</li>
</ul>

<h3>Mobile-specific edges</h3>
<ul>
  <li>Networks die mid-request constantly. Idempotency keys on every POST that mutates.</li>
  <li>Bandwidth is expensive. ETag + 304 saves real money on cellular.</li>
  <li>Background fetch / app-suspend kills sockets. Short-lived requests; reconnect with exponential backoff.</li>
  <li>iOS App Transport Security forbids plain HTTP. TLS 1.2+ only.</li>
  <li>Token refresh on every cold start; tokens expire while app was backgrounded.</li>
</ul>

<h3>Security edges</h3>
<ul>
  <li>Always use TLS; redirect HTTP → HTTPS.</li>
  <li>Reject mixed JSON/XML; pick one. <code>415 Unsupported Media Type</code> for the other.</li>
  <li>Validate all input; never trust query params.</li>
  <li>Rate-limit auth endpoints separately and stricter.</li>
  <li>Don't echo user input into errors verbatim — XSS into JSON is rare but real.</li>
  <li>Include <code>X-Content-Type-Options: nosniff</code>.</li>
  <li>Pin sensitive endpoints behind extra auth (re-auth for delete-account flows).</li>
</ul>

<h3>Versioning + caching collision</h3>
<p>If you key cache by URI alone, switching response shape breaks consumers stuck on stale CDN copies. Either bump URI version (<code>/v1/users/42</code> → <code>/v2/users/42</code>) or include version in <code>Vary</code> + cache key.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 10 most common REST anti-patterns</h3>
<ol>
  <li><strong>Verbs in URIs.</strong> <code>POST /getUser</code>, <code>POST /updatePassword</code>. Use <code>GET /users/42</code>, <code>PATCH /users/42/password</code>.</li>
  <li><strong>Returning 200 for errors.</strong> <code>{ "success": false, "error": ... }</code> with HTTP 200. Loses every middleware that observes status codes.</li>
  <li><strong>Returning 500 for client mistakes.</strong> Map validation errors to 422; auth errors to 401/403. 500 means "we have a bug."</li>
  <li><strong>Pagination by counting.</strong> Client sums and pages — fragile when items are added/removed mid-session.</li>
  <li><strong>Mutating GETs.</strong> "Visit this URL to confirm" → bots, prefetchers, and crawlers will trigger it. Confirm with POST.</li>
  <li><strong>Different error shapes per endpoint.</strong> Each one is a pull request from a frustrated client team.</li>
  <li><strong>Timestamps without UTC.</strong> Local time strings, offsets only, missing TZ. Use ISO 8601 + <code>Z</code>.</li>
  <li><strong>Money as float.</strong> <code>0.1 + 0.2 ≠ 0.3</code>. Integer minor units.</li>
  <li><strong>Leaky DB IDs.</strong> Using auto-increment IDs lets attackers enumerate; lets competitors infer growth.</li>
  <li><strong>Gigantic responses.</strong> <code>GET /users</code> returns 50k users. Always paginate; cap default + max page sizes.</li>
</ol>

<h3>Anti-pattern: chatty endpoints</h3>
<pre><code class="language-text">// BAD — client makes 4 calls to render a screen
GET /user
GET /user/preferences
GET /user/billing
GET /user/notifications

// GOOD — one composed endpoint for the screen
GET /user?expand=preferences,billing,notifications
</code></pre>
<p>Or model the screen as its own resource: <code>GET /screens/profile</code>. Beware: every "screen endpoint" you add has its own coupling cost. Keep them narrow and time-bounded.</p>

<h3>Anti-pattern: <code>/getUserById</code> + body</h3>
<pre><code class="language-text">// BAD
POST /getUserById  body: { id: 42 }

// GOOD
GET /users/42
</code></pre>
<p>The bad version forfeits all caching, logging, and "is this safe to retry?" semantics.</p>

<h3>Anti-pattern: leaking internals through errors</h3>
<pre><code class="language-json">// BAD
{
  "error": "ER_DUP_ENTRY: Duplicate entry 'foo@x.com' for key 'users.email_unique'\\n at server.js:243..."
}

// GOOD
{
  "type": "https://example.com/errors/duplicate-email",
  "title": "Email already in use",
  "status": 409,
  "detail": "An account already exists with that email."
}
</code></pre>

<h3>Anti-pattern: query strings for sensitive data</h3>
<p>Never put tokens, passwords, or PII in query strings — they get logged in webserver access logs, browser history, and CDN logs. Use the <code>Authorization</code> header or POST body.</p>

<h3>Anti-pattern: ignoring conditional requests</h3>
<p>Server returns ETag but doesn't honour <code>If-None-Match</code> on the next request. You're paying for the cache infrastructure without benefit.</p>

<h3>Anti-pattern: <code>POST /users/42/delete</code></h3>
<p>If your routing layer doesn't allow DELETE, fix the routing layer. Don't pollute the URI with verbs.</p>

<h3>Anti-pattern: ambiguous bulk endpoints</h3>
<p><code>POST /users/bulk</code> — does it create, update, upsert? Be explicit: <code>POST /users:batchCreate</code> or have separate endpoints. (Google's APIs use <code>:batchCreate</code> as a "custom verb" suffix; debatable but at least explicit.)</p>

<h3>Anti-pattern: forgetting <code>Vary</code></h3>
<p>Auth-aware response cached by CDN as the public version. Add <code>Vary: Authorization</code> (or use <code>Cache-Control: private</code>).</p>

<h3>Anti-pattern: relying on undocumented behaviour</h3>
<p>API returns extra fields "for now" that frontend depends on. Server team removes them in a refactor; frontend breaks. Document or strip.</p>

<h3>Anti-pattern: backwards-compatible "forever"</h3>
<p>Some teams refuse to ever break clients. The cost: the API accumulates 5 ways to do the same thing, all of which must be maintained. Plan deprecation cycles from day one — communicate, sunset, remove.</p>

<h3>Anti-pattern: status code 200 + body says "rate limited"</h3>
<p>Some legacy APIs return 200 with <code>{"error": "rate limit exceeded"}</code>. Use 429. Otherwise CDNs / clients can't tell the difference between success and rate-limit.</p>

<h3>Anti-pattern: enums as strings without versioning policy</h3>
<p>Adding a new enum value (<code>status: "archived"</code>) breaks clients that did <code>switch (status) { case "active": ... default: throw }</code>. Document: "new enum values may appear; clients must handle unknown."</p>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common REST design prompts</h3>
<ol>
  <li>Design the API for Twitter / Instagram / Pinterest feed.</li>
  <li>Design a comments API.</li>
  <li>Design a payments API (Stripe-style).</li>
  <li>Design a file upload API.</li>
  <li>Design a notifications subscription / unsubscription API.</li>
  <li>Design a search API with facets / filters.</li>
  <li>Design a webhook system.</li>
  <li>Design rate limiting + idempotency for a public API.</li>
</ol>

<h3>The 6-step framework for any "design this REST API" prompt</h3>
<ol>
  <li><strong>Clarify scope:</strong> who's the consumer (browser, mobile, partner SDK)? What scale (RPS, dataset size)? Read-heavy or write-heavy?</li>
  <li><strong>Identify resources and their hierarchy.</strong> Draw the URI tree on the whiteboard.</li>
  <li><strong>Map verbs to operations.</strong> CRUD what's natural; explicit nouns for "actions."</li>
  <li><strong>Pick representations + auth.</strong> JSON, ISO 8601 dates, Bearer tokens, problem+json errors.</li>
  <li><strong>Add cross-cutting:</strong> pagination, caching, idempotency, rate limits, versioning policy.</li>
  <li><strong>Talk through edges:</strong> long-running ops, bulk, webhooks, file uploads, errors.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"REST is great for polyglot consumers; for our internal mobile-only stack tRPC or GraphQL would cut N+1 round trips."</em></li>
  <li><em>"Cursor pagination because feeds are append-mostly and offset breaks under writes."</em></li>
  <li><em>"PATCH with merge semantics; null deletes, absent ignores. Saves a round trip for partial updates."</em></li>
  <li><em>"422 instead of 400 when the JSON parses but business rules fail — distinguishes 'bad request' from 'bad data'."</em></li>
  <li><em>"Idempotency-Key on every mutating POST. Mobile networks fail mid-request — clients retry safely."</em></li>
  <li><em>"ETag + If-None-Match revalidation. Cuts mobile bandwidth ~80% on listing endpoints."</em></li>
  <li><em>"Pre-signed S3 URLs for uploads — server avoids the bandwidth bill, scales naturally."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt keyword</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"feed", "timeline"</td><td>Cursor pagination, ETags, server-side ranking</td></tr>
    <tr><td>"upload", "file"</td><td>Pre-signed URLs or resumable upload</td></tr>
    <tr><td>"webhook", "event push"</td><td>HMAC-signed payload, retries, idempotent receivers</td></tr>
    <tr><td>"long running", "report", "export"</td><td>202 Accepted + job polling</td></tr>
    <tr><td>"public API", "partner"</td><td>API key + OAuth2 + rate limit + sandbox env</td></tr>
    <tr><td>"don't double-charge", "exactly once"</td><td>Idempotency keys + dedup window</td></tr>
    <tr><td>"version this without breaking"</td><td>Deprecation header + sunset window + parallel /v2</td></tr>
    <tr><td>"search"</td><td>GET with filters; cursor; facets; cap response size</td></tr>
  </tbody>
</table>

<h3>Demo script (whiteboard / spec)</h3>
<ol>
  <li>Write the URI tree.</li>
  <li>Annotate verb + status code expectations on each endpoint.</li>
  <li>Show a request + response sample for the most interesting one.</li>
  <li>Draw the error envelope.</li>
  <li>Talk pagination, caching, rate limit, idempotency, versioning — even if interviewer doesn't ask.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"OpenAPI spec generated from code; types published to all clients."</li>
  <li>"Contract tests in CI between server and each client."</li>
  <li>"Per-endpoint rate limits with burst allowance."</li>
  <li>"Idempotency keys with Redis-backed dedup window."</li>
  <li>"Webhook delivery dashboard with retries / dead-letter visibility."</li>
  <li>"Versioning runbook: deprecation, sunset window, migration guide template."</li>
  <li>"PII scrubbing in access logs; query-string secrets blocked at gateway."</li>
  <li>"Server-side pagination on every list endpoint, capped at 100."</li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Verb / status code fluency</td><td>422 vs 400, 409 vs 500, 204 for no-body deletes</td></tr>
    <tr><td>Pagination instinct</td><td>Cursor before offset; pagination on every list</td></tr>
    <tr><td>Caching awareness</td><td>ETag + Cache-Control + Vary; conditional requests</td></tr>
    <tr><td>Idempotency awareness</td><td>POST gets a key; PUT/DELETE retried freely</td></tr>
    <tr><td>Error shape consistency</td><td>One envelope, problem+json or equivalent</td></tr>
    <tr><td>Mobile / bandwidth empathy</td><td>304 / sparse fields / pagination caps</td></tr>
    <tr><td>Versioning maturity</td><td>Names a deprecation policy, not just /v1</td></tr>
    <tr><td>Security posture</td><td>TLS, no secrets in URLs, rate limit auth endpoints</td></tr>
    <tr><td>Restraint</td><td>No HATEOAS dogma if the team doesn't need it</td></tr>
    <tr><td>Communication</td><td>Names tradeoffs aloud, asks scope questions early</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>Mobile networks are flaky. Idempotency on every mutation; client retries with exponential backoff + jitter.</li>
  <li>304 + ETag saves real cellular cost; default to it for list endpoints.</li>
  <li>Pre-signed S3/GCS URLs for uploads — RN files can be huge (camera, video).</li>
  <li>Background app refresh kills sockets; favour short HTTP requests over long-lived connections.</li>
  <li>iOS ATS forbids plain HTTP. TLS 1.2+; HSTS preloaded.</li>
  <li>OAuth refresh on cold start; tokens lapse while suspended.</li>
  <li>Client-side schema codegen (Swift, Kotlin, TS) from OpenAPI prevents type drift.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"How would you prevent a mobile retry from creating duplicate orders?"</em> — Idempotency-Key + server-side dedup window keyed on (key, request hash).</li>
  <li><em>"Why 422 vs 400?"</em> — 400 for malformed (broken JSON); 422 for validated-but-business-invalid.</li>
  <li><em>"How do you handle 'the response shape changed'?"</em> — Versioning + deprecation; or backwards-compatible additive only.</li>
  <li><em>"How do you paginate when the dataset has frequent inserts?"</em> — Cursor; encode the sort key + ID; document "may skip new items inserted ahead of cursor."</li>
  <li><em>"How would you rate-limit a public API?"</em> — Token bucket per API key; sliding window for fairness; 429 + Retry-After; document quotas.</li>
  <li><em>"How would you secure webhook delivery?"</em> — HMAC-SHA256 signature with shared secret, replay protection via timestamp + nonce, retries on 5xx.</li>
  <li><em>"Why not just use GraphQL?"</em> — Polyglot consumers, CDN cacheability, simpler ops, public-API distribution. (Pros and cons; don't pretend either is universally better.)</li>
</ul>

<h3>"What I'd do day one prepping REST"</h3>
<ul>
  <li>Memorise the verb / status code cheat sheets.</li>
  <li>Build a small CRUD API from scratch with cursor pagination, ETag, idempotency, OpenAPI.</li>
  <li>Read Stripe and GitHub API docs — both are gold standards for shape, errors, pagination, deprecation.</li>
  <li>Practice the 6-step framework on 5 prompts.</li>
  <li>Memorise problem+json shape.</li>
  <li>Practice CORS preflight reasoning out loud.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read Roy Fielding's dissertation chapter 5 once for the constraints."</li>
  <li>"Skim the JSON:API spec — different vibe than problem+json, useful contrast."</li>
  <li>"Read AWS S3 API docs for pre-signed URL flow + multipart upload."</li>
  <li>"Pair-design a payments API with someone; idempotency stories make it real."</li>
</ul>
`
    }
  ]
});
