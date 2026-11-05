window.PREP_SITE.registerTopic({
  id: "be-architecture",
  module: "backend",
  title: "Architecture Patterns",
  estimatedReadTime: "50 min",
  tags: ["architecture","monolith","microservices","modular-monolith","bff","event-driven","cqrs","hexagonal","ddd"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Architecture is about <strong>team size, deploy independence, and ownership boundaries</strong> — not technology fashion. Default to a <strong>modular monolith; extract services only when teams genuinely need independent deploys.</strong></div>
  <h4>Key points</h4>
  <ul>
    <li>The spectrum: <strong>monolith</strong> (one deploy, one DB, one process) → <strong>modular monolith</strong> (one deploy, enforced module boundaries) → <strong>microservices</strong> (independent deploys, independent DBs, network between) → functions.</li>
    <li><strong>Modular monolith wins by default:</strong> one deploy = simpler ops, one DB = trivial cross-module transactions, cross-module refactor = one PR, boundaries enforced by lint + review rather than the network.</li>
    <li><strong>Microservices win at org scale:</strong> teams ship independently many times/day, different scaling profiles and stacks are justified, independent failure domains, clear per-team ownership. Real wins, real ops cost.</li>
    <li>Decision factors that actually matter: team size, deploy independence, domain coupling, tech-stack fit, operational maturity, and scaling profile. Rough guide: under 10 engineers = monolith, 10–30 = modular monolith, 100+ = microservices justified; a single monolith gets hard past ~30.</li>
    <li><strong>BFF (Backend For Frontend):</strong> a thin server tailored to one client that composes microservice data into screen-shaped responses — shields the frontend from composition complexity. A BFF that only proxies is pure overhead.</li>
    <li><strong>Event-driven</strong> decouples via events instead of RPC, at the cost of eventual consistency and harder debugging; <strong>CQRS</strong> splits write model from read model, used selectively for high-throughput reads.</li>
    <li><strong>Hexagonal / clean / DDD</strong> are code-level patterns to keep business logic independent of infra (DB, HTTP) — explicit layers: HTTP routes → application services → domain → DB.</li>
    <li>The wrong pattern is the one that <strong>mismatches your team size + deploy cadence + ownership model</strong>.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>"Microservices first."</strong> A team of 5 builds 8 services, nobody owns end-to-end, debugging takes weeks, and deploy coordination is harder than a monolith would have been. Worst of all is the <strong>"distributed monolith"</strong> — "microservices" that all share one database, so you pay every distributed-systems cost while getting none of the deploy-independence benefit.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"I'd start with a modular monolith and extract a service only when a clear seam emerges and a team genuinely needs an independent deploy cadence — not because the codebase feels big."</div>
  <div class="revision-say">"Microservices sharing one database is a distributed monolith — the worst of both worlds. The database boundary is what makes a service independent."</div>
  <div class="revision-say">"Architecture decisions track team size, deploy independence, and ownership — I pick the shape that lets teams ship without stepping on each other."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>The core spectrum</h3>
<pre><code class="language-text">Monolith ───── Modular Monolith ───── Microservices ───── Functions
   ↑                  ↑                    ↑                  ↑
1 process       1 process; clean    N processes;       N functions per
1 DB; team-     module boundaries;  N DBs; N teams;    request; managed
indistinct;     1 deploy;           independent        runtime; expensive
fast start.     team boundaries     deploys; ops cost. at scale.
                emerge.
</code></pre>

<h3>The decision factors</h3>
<table>
  <thead><tr><th>Factor</th><th>Pushes toward monolith</th><th>Pushes toward services</th></tr></thead>
  <tbody>
    <tr><td>Team size</td><td>&lt; 20</td><td>50+ engineers across many teams</td></tr>
    <tr><td>Deploy independence</td><td>Coordinated deploys are fine</td><td>Teams need to ship independently many times per day</td></tr>
    <tr><td>Domain coupling</td><td>Highly coupled — same data shapes</td><td>Distinct domains with clear boundaries</td></tr>
    <tr><td>Tech stack</td><td>Single language fits all</td><td>Different services genuinely benefit from different stacks</td></tr>
    <tr><td>Operational maturity</td><td>Small ops team</td><td>Strong platform team; observability + CI/CD</td></tr>
    <tr><td>Scale</td><td>Single DB handles load</td><td>Separate scaling profiles per service</td></tr>
  </tbody>
</table>

<h3>Why modular monolith wins by default</h3>
<ul>
  <li>One deploy = simpler ops; no distributed-system bugs.</li>
  <li>One DB = transactions across modules trivially.</li>
  <li>Refactor across modules = one PR.</li>
  <li>Module boundaries enforced by lint + code review; don't need network to enforce.</li>
  <li>Extract to a service later when a clear seam emerges.</li>
</ul>

<p>Failure mode of "microservices first": team of 5 builds 8 services; nobody owns end-to-end; debugging takes weeks; deploy coordination harder than monolith would have been. Famous as "distributed monolith" — worst of both worlds.</p>

<h3>Why microservices win at org scale</h3>
<ul>
  <li>Team A ships 10× per day without stepping on team B.</li>
  <li>Different scaling needs (search service runs 50 instances; admin runs 2).</li>
  <li>Different stacks justified (ML in Python; API in Go; UI in TS).</li>
  <li>Independent failure domains: A's bug doesn't crash B.</li>
  <li>Clear ownership: each service has a team.</li>
</ul>

<h3>What "good architecture" looks like for FE engineers</h3>
<ul>
  <li>You can name where the business logic lives, where it's tested, where infra coupling happens.</li>
  <li>Layers are explicit: HTTP routes → application services → domain → DB.</li>
  <li>BFF (or BFF-equivalent) shields the frontend from microservice composition complexity.</li>
  <li>Boundaries between modules / services map to team ownership.</li>
  <li>Adding a new feature touches predictable files (not random places).</li>
  <li>Test pyramid matches the architecture (unit per module; integration across; E2E at the BFF/API edge).</li>
</ul>

<h3>What "bad architecture" looks like</h3>
<ul>
  <li>"Microservices" that all share the same DB — distributed monolith.</li>
  <li>One service per database table — granular for granularity's sake.</li>
  <li>Cyclic dependencies between modules — refactor blocks itself.</li>
  <li>Business logic in HTTP handlers — untestable, duplicated.</li>
  <li>BFF that just proxies (no composition) — pure overhead.</li>
  <li>Event-driven with no schema registry — silent breakage.</li>
  <li>"God services" that touch every other service — ownership-unclear.</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Monolith</h3>
<pre><code class="language-text">┌────────────────────────────────────┐
│         Web app (Node)             │
│  ┌────────┐ ┌────────┐ ┌────────┐  │
│  │ Users  │ │ Orders │ │ Billing│  │
│  └────────┘ └────────┘ └────────┘  │
│       ↓        ↓         ↓         │
│  ┌────────────────────────────┐    │
│  │      Postgres              │    │
│  └────────────────────────────┘    │
└────────────────────────────────────┘
</code></pre>
<p>One process, one DB. Modules are just folders. Trade simplicity for coupling.</p>

<h3>Modular monolith</h3>
<pre><code class="language-text">┌──────────────────────────────────────────────┐
│              Web app (Node)                  │
│ ┌────────────┐ ┌──────────┐ ┌─────────────┐  │
│ │ Users      │ │ Orders   │ │ Billing     │  │
│ │ ┌────────┐ │ │ ┌──────┐ │ │ ┌─────────┐ │  │
│ │ │ public │ │ │ │public│ │ │ │ public  │ │  │
│ │ │ API    │ │ │ │ API  │ │ │ │ API     │ │  │
│ │ └────────┘ │ │ └──────┘ │ │ └─────────┘ │  │
│ │ ┌────────┐ │ │ ┌──────┐ │ │ ┌─────────┐ │  │
│ │ │ logic  │ │ │ │logic │ │ │ │ logic   │ │  │
│ │ └────────┘ │ │ └──────┘ │ │ └─────────┘ │  │
│ │ ┌────────┐ │ │ ┌──────┐ │ │ ┌─────────┐ │  │
│ │ │ DB     │ │ │ │ DB   │ │ │ │ DB      │ │  │
│ │ │ tables │ │ │ │tables│ │ │ │ tables  │ │  │
│ │ └────────┘ │ │ └──────┘ │ │ └─────────┘ │  │
│ └────────────┘ └──────────┘ └─────────────┘  │
│      ↑              ↑              ↑         │
│  Modules talk only via public APIs           │
└──────────────────────────────────────────────┘
       ↓
   One Postgres (with schemas per module)
</code></pre>

<p>Same monolith deploy; explicit module boundaries; cross-module access only via the public API of the other module. Lint rule prevents direct imports across module-private code.</p>

<h3>Microservices</h3>
<pre><code class="language-text">┌────────┐ ┌────────┐ ┌────────┐
│ Users  │ │ Orders │ │ Billing│
│ Node   │ │ Go     │ │ Node   │
└────┬───┘ └────┬───┘ └────┬───┘
     │          │          │
   Pg(users)  Pg(orders)  Pg(billing)

  Communication: HTTP / gRPC / Kafka
</code></pre>

<p>Each service: own process, own DB, own deploy. Network between. Real cost: distributed-system complexity, observability, ops.</p>

<h3>BFF (Backend For Frontend)</h3>
<pre><code class="language-text">     Web client      Mobile (RN) client
       ↓                    ↓
   ┌─────────┐          ┌─────────┐
   │ Web BFF │          │ App BFF │  (per-client servers; tailored)
   └────┬────┘          └────┬────┘
        ↓                    ↓
   ┌──────────────────────────────┐
   │  Microservices (Users, ...)  │
   └──────────────────────────────┘
</code></pre>

<p>BFF composes microservice data into the exact shape each client needs. Reduces client round trips; lets backend evolve without breaking clients.</p>

<h3>Event-driven</h3>
<pre><code class="language-text">User signs up
   ↓
Users service publishes "user.created"
   ↓
   ├──→ Welcome email service
   ├──→ Analytics service
   ├──→ Provisioning service
   └──→ Sales notification service
</code></pre>

<p>Producer doesn't know consumers. New consumer added without touching producer. Eventually consistent — every consumer processes asynchronously.</p>

<h3>CQRS (Command Query Responsibility Segregation)</h3>
<pre><code class="language-text">Writes (commands)         Reads (queries)
   ↓                         ↑
┌──────┐                  ┌────────┐
│ App  │                  │ App    │
└──┬───┘                  └────────┘
   ↓                         ↑
┌──────┐    sync          ┌────────┐
│ Pg   │ ───────────────→ │ Read   │  (denormalized, optimized for queries)
│write │                  │ replica│  e.g., Elasticsearch, Redis, view
│model │                  │ store  │
└──────┘                  └────────┘
</code></pre>

<p>Use when reads + writes have very different scaling profiles, or when complex query views are expensive to compute on demand. Sync via change-data capture (CDC) or events.</p>

<h3>Hexagonal / Ports & Adapters</h3>
<pre><code class="language-text">          ┌─ Inbound adapters ─┐
          │  HTTP, gRPC, CLI    │
          ↓                    ↑
        ┌──────────────────────┐
        │ Application services │
        │ (use cases)          │
        └──────────────────────┘
                  ↓
        ┌──────────────────────┐
        │   Domain logic       │  (pure; no infra)
        └──────────────────────┘
                  ↓
        ┌─ Outbound ports ──────┐
        │ Repositories          │  (interfaces, not impls)
        │ Email senders         │
        │ Payment gateways      │
        └─────┬─────────────────┘
              ↓
        ┌─ Outbound adapters ───┐
        │ Postgres impl         │
        │ Stripe impl           │
        └───────────────────────┘
</code></pre>

<p>Domain logic depends on <em>interfaces</em>; concrete impls plug in at the edge. Makes testing trivial (swap real with fake).</p>

<h3>Clean Architecture / Onion</h3>
<p>Same idea as hexagonal: dependencies point inward; domain is at the center; outermost layers are infra. Different naming, same essence.</p>

<h3>DDD (Domain-Driven Design)</h3>
<ul>
  <li><strong>Bounded context:</strong> a clear boundary where domain language is consistent (e.g., "Order" in Sales context vs Fulfillment context — same word, different meaning).</li>
  <li><strong>Aggregate:</strong> a cluster of objects treated as a unit (Order + OrderItems; you don't update OrderItem outside Order).</li>
  <li><strong>Repository:</strong> abstraction over persistence; loads + saves aggregates.</li>
  <li><strong>Domain event:</strong> something that happened in the domain (OrderPlaced); often what gets published to event bus.</li>
</ul>

<h3>The "monolith vs microservices" decision tree</h3>
<pre><code class="language-text">Q1: How many engineers?
  &lt; 10 → Monolith. Don't even think about it.
  10-30 → Modular monolith. Extract services later if needed.
  30-100 → Modular monolith with selective service extraction.
  100+ → Microservices justified.

Q2: Are different parts of the system at very different scales?
  Yes → Extract just those parts.
  No → Stay monolith.

Q3: Do you have platform team for observability, CI/CD, service mesh?
  No → Stay monolith.
  Yes → Services possible.

Q4: Is your team currently hating each other on every deploy?
  Yes → Service extraction may help (or maybe better module boundaries).
  No → Don't fix what isn't broken.
</code></pre>

<h3>The 12-factor app (still relevant)</h3>
<ol>
  <li>Codebase: one repo per app; same code across environments.</li>
  <li>Dependencies: declared explicitly; isolated.</li>
  <li>Config: env vars; never hardcoded.</li>
  <li>Backing services: DBs, queues, caches as attached resources via URL.</li>
  <li>Build, release, run: strict separation.</li>
  <li>Processes: stateless; persist state externally.</li>
  <li>Port binding: app exposes port; nothing in front needs to know.</li>
  <li>Concurrency: scale via process model.</li>
  <li>Disposability: fast startup; graceful shutdown.</li>
  <li>Dev/prod parity: same backing services across environments.</li>
  <li>Logs: stream to stdout; aggregator handles.</li>
  <li>Admin processes: one-off tasks via the same release.</li>
</ol>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>Modular monolith file structure</h3>
<pre><code class="language-text">src/
  modules/
    users/
      api.ts          ← public API (other modules import this)
      handlers.ts     ← HTTP / queue handlers
      service.ts      ← business logic
      repository.ts   ← DB access
      domain/
        user.ts       ← entities + invariants
      __tests__/
    orders/
      api.ts
      handlers.ts
      service.ts
      repository.ts
      domain/
      __tests__/
    billing/
      api.ts
      ...
  shared/             ← cross-cutting (logger, db, errors)
  app.ts              ← composes modules; wires HTTP routes
</code></pre>

<p>Lint rule (eslint-plugin-import + boundaries) enforces:</p>
<ul>
  <li><code>orders/</code> can <code>import { something } from '@/modules/users/api'</code></li>
  <li><code>orders/</code> CANNOT <code>import { internal } from '@/modules/users/repository'</code></li>
</ul>

<pre><code class="language-typescript">// .eslintrc — boundary enforcement
module.exports = {
  rules: {
    'import/no-restricted-paths': ['error', {
      zones: [
        {
          target: './src/modules/orders',
          from: './src/modules/users',
          except: ['./src/modules/users/api.ts'],
          message: 'Cross-module access only via api.ts',
        },
      ],
    }],
  },
};
</code></pre>

<h3>Hexagonal architecture in code</h3>
<pre><code class="language-typescript">// Domain (pure; no infra imports)
// src/modules/orders/domain/order.ts
export interface Order {
  id: string;
  userId: string;
  totalCents: number;
  status: 'pending' | 'paid' | 'shipped' | 'cancelled';
}

export function placeOrder(input: PlaceOrderInput): Order {
  if (input.totalCents &lt; 0) throw new Error('invalid_total');
  return {
    id: crypto.randomUUID(),
    userId: input.userId,
    totalCents: input.totalCents,
    status: 'pending',
  };
}

// Port (interface; no impl)
// src/modules/orders/repository.ts
export interface OrderRepository {
  save(order: Order): Promise&lt;void&gt;;
  byId(id: string): Promise&lt;Order | null&gt;;
  byUser(userId: string): Promise&lt;Order[]&gt;;
}

// Application service (uses ports)
// src/modules/orders/service.ts
export class OrderService {
  constructor(
    private orders: OrderRepository,
    private payments: PaymentGateway,
    private events: EventBus,
  ) {}

  async place(input: PlaceOrderInput): Promise&lt;Order&gt; {
    const order = placeOrder(input); // pure domain logic
    await this.orders.save(order);
    await this.events.publish({ type: 'OrderPlaced', orderId: order.id });
    return order;
  }
}

// Adapter (concrete; Postgres impl)
// src/modules/orders/postgres-order-repository.ts
export class PostgresOrderRepository implements OrderRepository {
  constructor(private pool: Pool) {}
  async save(order: Order) {
    await this.pool.query('INSERT INTO orders ... ON CONFLICT ...', [...]);
  }
  // ...
}

// Wiring (composition root)
// src/app.ts
const repo = new PostgresOrderRepository(pgPool);
const payments = new StripePaymentGateway(stripeKey);
const events = new KafkaEventBus(kafkaClient);
const orderService = new OrderService(repo, payments, events);
</code></pre>

<p>Test the service with fakes:</p>
<pre><code class="language-typescript">test('places order + publishes event', async () =&gt; {
  const orders = new InMemoryOrderRepository();
  const events = new MockEventBus();
  const service = new OrderService(orders, fakePayments, events);

  const order = await service.place({ userId: 'u-1', totalCents: 1000 });

  expect(order.status).toBe('pending');
  expect(events.published).toContainEqual(expect.objectContaining({ type: 'OrderPlaced' }));
});
</code></pre>

<h3>BFF in practice</h3>
<pre><code class="language-typescript">// apps/mobile-bff/src/server.ts
import { Hono } from 'hono';

const app = new Hono();

app.get('/screens/profile/:userId', async (c) =&gt; {
  const userId = c.req.param('userId');

  const [user, posts, stats, badges] = await Promise.all([
    fetch(\`http://users-svc/users/\${userId}\`).then(r =&gt; r.json()),
    fetch(\`http://posts-svc/posts?author=\${userId}&amp;first=10\`).then(r =&gt; r.json()),
    fetch(\`http://stats-svc/users/\${userId}\`).then(r =&gt; r.json()),
    fetch(\`http://badges-svc/users/\${userId}\`).then(r =&gt; r.json()),
  ]);

  // Compose into the exact shape mobile screen needs
  return c.json({
    user: {
      id: user.id,
      handle: user.handle,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
    },
    posts: posts.edges.map((e) =&gt; ({
      id: e.node.id,
      excerpt: e.node.excerpt,
      createdAt: e.node.createdAt,
    })),
    stats: {
      followers: stats.followers,
      following: stats.following,
      posts: stats.postCount,
    },
    badges: badges.map((b) =&gt; b.label),
  });
});

export default app; // deploys on Hono / Cloudflare Workers / Node
</code></pre>

<p>The BFF transforms 4 microservice responses into one screen-shaped JSON. Mobile makes 1 request instead of 4.</p>

<h3>Event-driven services with outbox</h3>
<pre><code class="language-typescript">// Order service publishes; Email + Analytics + Provisioning consume
// (see be-queues for the outbox + Kafka details)

// Order service
async function placeOrder(input) {
  await db.transaction(async (tx) =&gt; {
    const order = await tx.orders.insert({ ... });
    await tx.outbox.insert({ topic: 'order.placed', payload: order });
  });
}

// Email service consumes
const consumer = kafka.consumer({ groupId: 'email-svc' });
await consumer.subscribe({ topic: 'order.placed' });
consumer.run({
  eachMessage: async ({ message }) =&gt; {
    const order = JSON.parse(message.value!.toString());
    if (await alreadyProcessed(order.id)) return;
    await sendOrderConfirmation(order);
    await markProcessed(order.id);
  },
});
</code></pre>

<h3>CQRS sketch</h3>
<pre><code class="language-typescript">// Write side — normalized
async function createPost(input) {
  await db.posts.insert({ ... });
  await events.publish({ type: 'PostCreated', payload: input });
}

// Read side — denormalized; subscribed to events
events.subscribe('PostCreated', async (event) =&gt; {
  // Build a denormalized "feed_entries" with author info pre-joined
  await readDb.feedEntries.insert({
    postId: event.payload.id,
    authorId: event.payload.authorId,
    authorName: await getAuthorName(event.payload.authorId), // pre-join
    body: event.payload.body,
    createdAt: event.payload.createdAt,
  });
});

// Read query — simple lookup; no joins
async function getFeedFor(userId) {
  return readDb.feedEntries.find({ followerId: userId }).limit(20);
}
</code></pre>

<p>Don't reach for CQRS until you have a clear read-write asymmetry. For most apps, materialized views / denormalized columns suffice.</p>

<h3>Service mesh + service discovery</h3>
<ul>
  <li>Microservices need to find each other; service discovery (Consul, etcd, K8s DNS) maps service name → IPs.</li>
  <li>Service mesh (Istio, Linkerd) adds: mTLS, traffic shaping, retries, observability, all transparently.</li>
  <li>Tradeoff: another moving part. Justify with multi-team, multi-language scenarios.</li>
</ul>

<h3>API gateway</h3>
<ul>
  <li>One entry point for all clients; routes to services.</li>
  <li>Cross-cutting: auth, rate limit, observability, request transformation.</li>
  <li>Tools: Kong, AWS API Gateway, Apigee, custom Hono / Express.</li>
  <li>BFF + API gateway can overlap; pick one model deliberately.</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1: Modular monolith for a SaaS app</h3>
<pre><code class="language-text">src/
  modules/
    auth/        # signup, login, sessions
    users/       # profiles, settings
    teams/       # multi-tenant
    billing/     # Stripe integration
    notifications/
    audit/
  shared/        # logger, db client, errors
  app.ts         # composition root
</code></pre>

<p>Each module has <code>api.ts</code> exports. Lint enforces: <code>billing</code> can call <code>users.api.getUser(id)</code> but not <code>users.repository.<em>raw</em></code>. Single Postgres instance, but each module has its own schema (<code>auth.users</code>, <code>billing.invoices</code>, etc.).</p>

<h3>Example 2: When to extract a service</h3>
<pre><code class="language-text">Symptoms that justify extraction:
- The video-encoding workload runs 50 instances; everything else runs 2.
  → Extract video-encoding as a service.
- The mobile team needs to deploy 3× per day; web team 1× per week.
  → Extract mobile BFF as a service.
- The ML team writes Python; everyone else TS.
  → Extract recommendation as a Python service.
- One team owns "search"; nobody else touches it.
  → Extract search as a service.

Don't extract because:
- The codebase "feels big" (refactor instead).
- "Microservices are best practice" (no, they're a tradeoff).
- "We might scale" (you might not).
</code></pre>

<h3>Example 3: BFF reduces mobile round trips</h3>
<pre><code class="language-text">Without BFF — mobile makes 5 calls:
GET /users/123          → 200ms
GET /users/123/posts    → 200ms
GET /users/123/stats    → 200ms
GET /users/123/badges   → 200ms
GET /users/123/recent-likes → 200ms
Total: 1000ms+ (sequential) or 200ms (parallel) but 5× battery + radio cost on cellular.

With BFF — mobile makes 1 call:
GET /screens/profile/123 → 200ms
BFF makes the 5 internal calls in parallel, composes, returns one shape.
</code></pre>

<h3>Example 4: Event-driven user provisioning</h3>
<pre><code class="language-typescript">// Producer (signup endpoint)
async function signup(input) {
  await db.transaction(async (tx) =&gt; {
    const user = await tx.users.insert(input);
    await tx.outbox.insert({
      topic: 'user.signed_up',
      payload: { userId: user.id, email: user.email, plan: input.plan },
    });
  });
}

// Multiple consumers, each their own service:
// 1. welcome-email-svc → sends email
// 2. trial-provisioner-svc → creates trial workspace
// 3. analytics-svc → tracks signup
// 4. sales-svc → notifies sales for enterprise plans

// Each consumer dedupes by userId, processes idempotently.
// New consumer added later (e.g., partner integrations) without touching signup.
</code></pre>

<h3>Example 5: CQRS for a feed</h3>
<pre><code class="language-typescript">// Write side: posts table
async function createPost(input) {
  const post = await db.posts.insert(input);
  await events.publish({ type: 'PostCreated', post });
  return post;
}

// Read side: feed_entries denormalized for the timeline query
events.on('PostCreated', async ({ post }) =&gt; {
  const followers = await db.follows.findMany({ where: { followingId: post.authorId } });
  const entries = followers.map((f) =&gt; ({
    feedFor: f.followerId,
    postId: post.id,
    authorId: post.authorId,
    authorName: post.authorName, // denormalized
    body: post.body,
    createdAt: post.createdAt,
  }));
  await db.feedEntries.insertMany(entries);
});

// Read query — simple, fast
async function getFeed(userId) {
  return db.feedEntries.findMany({
    where: { feedFor: userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}
</code></pre>

<p>Tradeoff: write fan-out cost (followers × posts); read is simple. Used by Twitter / Instagram for active users; for inactive users, compute feed on-read.</p>

<h3>Example 6: Hexagonal — switch implementations for tests</h3>
<pre><code class="language-typescript">// Production wiring
const repo = new PostgresOrderRepository(pgPool);
const payments = new StripePaymentGateway(stripeKey);
const orderService = new OrderService(repo, payments);

// Test wiring
const repo = new InMemoryOrderRepository();
const payments = new FakePaymentGateway();
const orderService = new OrderService(repo, payments);

// Tests run in milliseconds without DB or network
test('rejects negative total', async () =&gt; {
  await expect(orderService.place({ userId: 'u-1', totalCents: -1 }))
    .rejects.toThrow('invalid_total');
});
</code></pre>

<h3>Example 7: Strangler fig pattern (monolith → services)</h3>
<pre><code class="language-text">Phase 1: Monolith handles everything. Add a proxy in front.

[client] → [proxy] → [monolith]

Phase 2: Extract one feature (e.g., search) to new service.

[client] → [proxy] ┬─→ [monolith]    (90% of routes)
                   └─→ [search-svc]   (search routes only)

Phase 3: Migrate more features one by one. Eventually monolith may be empty.
</code></pre>

<p>The pattern: proxy routes traffic; new service emerges; monolith shrinks. Lower-risk than big-bang rewrite.</p>

<h3>Example 8: Bounded contexts in DDD</h3>
<pre><code class="language-text">"Order" in Sales context = customer-facing entity (with discount, gift options).
"Order" in Fulfillment context = warehouse-facing entity (with picking list, packing slip).

These are separate types. Translation between contexts via:
- Anti-corruption layer (ACL): adapter that translates between context types.
- Shared kernel (rare): both contexts share a small core.
- Conformist: one context accepts the other's model.
</code></pre>

<p>In code: Sales' <code>Order</code> ≠ Fulfillment's <code>Order</code>. Cross-context calls translate explicitly.</p>

<h3>Example 9: Saga across services</h3>
<pre><code class="language-typescript">// Booking a trip: flight + hotel + payment, across 3 services.
// No global transaction; saga pattern with compensations.

// Orchestrator (could be Temporal)
async function bookTrip(userId, tripDetails) {
  let payment, flight, hotel;
  try {
    payment = await paymentSvc.charge(userId, tripDetails.total);
    flight = await flightSvc.reserve(tripDetails.flight);
    hotel = await hotelSvc.reserve(tripDetails.hotel);
  } catch (err) {
    // Compensate in reverse
    if (hotel) await hotelSvc.cancel(hotel.id);
    if (flight) await flightSvc.cancel(flight.id);
    if (payment) await paymentSvc.refund(payment.id);
    throw err;
  }
}
</code></pre>

<h3>Example 10: API gateway routing</h3>
<pre><code class="language-text">┌──────────────────────────┐
│      API Gateway         │  ← auth, rate limit, observability
└──┬───────┬───────┬──┬────┘
   ↓       ↓       ↓  ↓
 /users  /orders /search /feed
   ↓       ↓       ↓     ↓
[users] [orders][search][feed-bff]
</code></pre>

<p>Gateway: one entry point, single auth + rate-limit + tracing. Services don't reimplement these. Routing rules in the gateway config (Kong, Envoy, AWS API Gateway).</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>Distributed monolith</h3>
<ul>
  <li>You split into "microservices" but they all share a DB, deploy together, and one failure cascades.</li>
  <li>Symptom: you have all the cost of services with none of the independence benefits.</li>
  <li>Fix: either go back to a monolith, or do the work to truly isolate (own DB, independent deploy, async communication).</li>
</ul>

<h3>Service granularity</h3>
<ul>
  <li>Too few services: distributed monolith.</li>
  <li>Too many services: ops chaos; debugging across N hops.</li>
  <li>Heuristic: one service per bounded context, not per entity.</li>
  <li>"Two-pizza team" rule: a team that can be fed with two pizzas owns one service.</li>
</ul>

<h3>Cross-service transactions</h3>
<ul>
  <li>You want atomic write across User + Order + Inventory; they live in 3 services.</li>
  <li>No global tx (2PC unreliable). Use saga + compensations.</li>
  <li>Or: re-evaluate boundaries — maybe these belong in one service.</li>
</ul>

<h3>Eventual consistency surprises</h3>
<ul>
  <li>User signs up; backend creates user; emits event; downstream services not yet ready; user immediately tries to use feature; "user not found" error.</li>
  <li>Mitigations: read-your-write semantics from the source of truth; or wait for "ready" event; or design UX for eventual consistency (show "provisioning..." until ready).</li>
</ul>

<h3>Service discovery + DNS caching</h3>
<ul>
  <li>Service A's DNS points at IP X; X is replaced; A still hits old IP cached for TTL minutes.</li>
  <li>Mitigations: short DNS TTL; client-side health checks; service mesh (handles this).</li>
</ul>

<h3>Inter-service auth</h3>
<ul>
  <li>How does service A authenticate to service B?</li>
  <li>Options: mTLS (service mesh handles); shared internal token; JWT with short-lived signed claims; service account per service.</li>
  <li>Don't propagate end-user JWT through everything — short-lived, scoped tokens are safer.</li>
</ul>

<h3>Versioning across services</h3>
<ul>
  <li>Service A v2 deployed; service B still expects v1 API. Coordinated deploys = "distributed monolith" symptom.</li>
  <li>Mitigations: backwards-compat in API; deploy A first with both versions; deploy B; remove old version.</li>
</ul>

<h3>Trace context propagation</h3>
<ul>
  <li>Request hits 5 services; without trace context, you can't follow it.</li>
  <li>OpenTelemetry / W3C trace headers (<code>traceparent</code>) propagate ID through every hop.</li>
  <li>Service mesh adds this transparently.</li>
</ul>

<h3>BFF complexity creep</h3>
<ul>
  <li>BFF starts as composition; grows business logic; becomes its own monolith.</li>
  <li>Discipline: BFF only composes; logic lives in domain services.</li>
  <li>Smell: writing tests for "the BFF logic" instead of "the user service logic" reflects bad placement.</li>
</ul>

<h3>Event-driven debugging</h3>
<ul>
  <li>Where did this state come from? Producer A 5 minutes ago, consumer B 3 minutes ago, consumer C never (failed silently).</li>
  <li>Mitigations: distributed tracing via correlation ID on every event; event log retention for replay; per-consumer DLQ visibility.</li>
</ul>

<h3>CQRS over-engineering</h3>
<ul>
  <li>Implementing full CQRS for a CRUD app = wasted complexity.</li>
  <li>CQRS pays off when read patterns differ dramatically from write structure (e.g., live-updating feed of denormalized data).</li>
  <li>For most apps: materialized views or read replicas suffice.</li>
</ul>

<h3>Cyclic module dependencies</h3>
<ul>
  <li>Module A depends on B which depends on A.</li>
  <li>Sign of bad boundaries; usually one of them belongs as a third (shared) module.</li>
  <li>Detect with tools: <code>madge --circular src/</code>.</li>
</ul>

<h3>Anti-corruption layer skipped</h3>
<ul>
  <li>External system's data model leaks into your domain types.</li>
  <li>Symptom: every domain change requires touching external API integration.</li>
  <li>Fix: ACL adapter translates external → internal types; internal stable.</li>
</ul>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN apps benefit greatly from BFF — composes microservice data into screen shapes; reduces cellular round trips.</li>
  <li>BFF on Cloudflare Workers / Vercel Edge for low-latency global; Hono runs everywhere.</li>
  <li>Same architecture patterns apply on the backend serving mobile; client-side architecture is its own thing.</li>
</ul>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>The 12 most common architecture mistakes</h3>
<ol>
  <li><strong>Microservices first.</strong> Distributed monolith from day one.</li>
  <li><strong>Sharing a database across services.</strong> Defeats independence.</li>
  <li><strong>Cyclic module / service deps.</strong> Refactor blocks itself.</li>
  <li><strong>Business logic in HTTP handlers.</strong> Untestable; duplicated.</li>
  <li><strong>BFF that grows logic.</strong> Becomes its own monolith.</li>
  <li><strong>God service.</strong> One service touches everything.</li>
  <li><strong>No bounded contexts.</strong> Same word means different things; bugs.</li>
  <li><strong>2PC for distributed transactions.</strong> Brittle; use sagas.</li>
  <li><strong>Synchronous chains 5 deep.</strong> One slow call cascades.</li>
  <li><strong>Event-driven without schema registry.</strong> Silent breakage on producer change.</li>
  <li><strong>CQRS for CRUD.</strong> Over-engineered.</li>
  <li><strong>Service per table.</strong> Granular for granularity's sake.</li>
</ol>

<h3>Anti-pattern: distributed monolith</h3>
<pre><code class="language-text">Symptoms:
- Services share a DB
- All services deploy together
- One service down = all down
- Coordination required for any feature
- Cross-cutting changes touch every repo

Fix: either consolidate to monolith, or invest in true independence
(own DB, async comms, independent deploys, on-call rotation per service)
</code></pre>

<h3>Anti-pattern: business logic in handlers</h3>
<pre><code class="language-typescript">// BAD — logic + infra mixed in handler
app.post('/orders', async (req, res) =&gt; {
  if (req.body.total &lt; 0) return res.status(400).json({ error: 'bad' });
  const result = await db.query('INSERT INTO orders ... RETURNING *', [...]);
  if (result.rows[0].total &gt; 100) {
    await stripe.charges.create({ ... });
    await emailService.send(...);
  }
  res.json(result.rows[0]);
});

// GOOD — handler is thin; service has logic
app.post('/orders', async (req, res, next) =&gt; {
  try {
    const order = await orderService.place(req.user.id, req.body);
    res.status(201).json(order);
  } catch (err) { next(err); }
});

// orderService.place is pure logic + ports; testable in milliseconds
</code></pre>

<h3>Anti-pattern: BFF doing real work</h3>
<pre><code class="language-typescript">// BAD — BFF computes pricing
app.post('/checkout', async (c) =&gt; {
  const cart = await cartSvc.get(c.req.user.id);
  const tax = computeTax(cart, c.req.user.address); // ← business logic in BFF
  const discount = applyDiscount(cart, c.req.user.tier);
  return c.json({ total: cart.subtotal + tax - discount });
});

// GOOD — BFF composes; pricing service computes
app.post('/checkout', async (c) =&gt; {
  const [cart, total] = await Promise.all([
    cartSvc.get(c.req.user.id),
    pricingSvc.computeTotal(c.req.user.id),
  ]);
  return c.json({ cart, total });
});
</code></pre>

<h3>Anti-pattern: leaking domain to infra</h3>
<pre><code class="language-typescript">// BAD — domain depends on Stripe SDK type
class Order {
  paymentIntent: Stripe.PaymentIntent; // ← domain leaks Stripe
}

// GOOD — domain is pure; adapter translates Stripe → domain type
class Order {
  paymentRef: { provider: string; id: string };
}

class StripeAdapter implements PaymentGateway {
  async charge(amount): Promise&lt;{ provider: 'stripe'; id: string }&gt; {
    const intent = await stripe.paymentIntents.create({ amount });
    return { provider: 'stripe', id: intent.id };
  }
}
</code></pre>

<h3>Anti-pattern: synchronous chain</h3>
<pre><code class="language-text">// BAD — A→B→C→D synchronously; each adds latency + failure point
A.handler:
  result = B.call()
  ↓
  B.handler:
    result = C.call()
    ↓
    C.handler:
      result = D.call()

If D times out, A times out 4 hops later.

// GOOD — async event chain where possible
A publishes event → B reacts → publishes event → C reacts → publishes
A's response is fast; downstream eventual.
</code></pre>

<h3>Anti-pattern: cyclic deps</h3>
<pre><code class="language-text">// BAD
modules/orders → modules/users → modules/orders
                                 ^ cyclic!

// GOOD — extract shared concept to a third module
modules/orders → modules/identity ← modules/users
</code></pre>

<h3>Anti-pattern: shared event schema in code</h3>
<pre><code class="language-typescript">// BAD — both services import same TS file; can't deploy independently
import { OrderPlacedEvent } from '@org/events';

// GOOD — schema registry; each service has its own copy of types
// Producer + consumer evolve independently with backwards-compat checks at registry
</code></pre>

<h3>Anti-pattern: god service</h3>
<pre><code class="language-text">// BAD — "platform-svc" handles users, orders, billing, analytics, search
// One team owns everything; deploys take an hour; bugs span everything

// GOOD — split by domain ownership; per-team
users-svc, orders-svc, billing-svc, search-svc; each ownable independently
</code></pre>

<h3>Anti-pattern: CQRS without need</h3>
<pre><code class="language-text">// BAD — "Best practice" CQRS for a 5-route CRUD app
// Now you have: write model, read model, projections, event bus, eventual consistency
// All for 100 users

// GOOD — start with normalized DB + simple queries; add CQRS only when reads
// genuinely diverge from writes (live feed, event sourcing, complex projections)
</code></pre>

<h3>Anti-pattern: ignoring 12-factor</h3>
<ul>
  <li>Hardcoded config; can't change behavior across environments.</li>
  <li>State in process memory; can't scale horizontally.</li>
  <li>Logs to file; aggregator can't pick up.</li>
  <li>Slow startup; deploys take forever.</li>
</ul>
<p>12-factor isn't dogma; it's a checklist of "if you skip this, you'll regret it."</p>

<h3>Anti-pattern: rewrite-based migration</h3>
<pre><code class="language-text">// BAD — "We'll rewrite the monolith in microservices in 18 months"
// Result: 18 months of feature freeze; new system has every old bug + new ones

// GOOD — strangler fig; one feature at a time; old system shrinks gradually
</code></pre>

<h3>Anti-pattern: no per-service ownership</h3>
<p>"This service is on-call'd by whoever happens to know it." Bus factor 1; nobody owns reliability. Each service needs a designated team with on-call rotation.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<h3>Common architecture interview prompts</h3>
<ol>
  <li>Compare monolith vs microservices.</li>
  <li>How would you architect [Twitter / Uber / Slack / Spotify-style app]?</li>
  <li>When do you extract a service from a monolith?</li>
  <li>What's a BFF and when do you use one?</li>
  <li>Walk through CQRS / event sourcing.</li>
  <li>How would you handle distributed transactions?</li>
  <li>How do you organize code in a monolith?</li>
  <li>Tell me about an architecture decision you regret.</li>
</ol>

<h3>The 5-step framework for "design the architecture"</h3>
<ol>
  <li><strong>Clarify scale:</strong> users, traffic, team size, deploy cadence.</li>
  <li><strong>Default to modular monolith</strong> unless team size + scale justifies services.</li>
  <li><strong>Identify bounded contexts:</strong> domain boundaries map to modules / services.</li>
  <li><strong>Pick communication style:</strong> sync (HTTP/gRPC) for read paths; async (events) for cross-domain decoupling.</li>
  <li><strong>Address cross-cutting:</strong> auth, observability, BFF for clients, gateway for ingress.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"Modular monolith by default — one deploy, clean module boundaries enforced via lint, single DB with schema-per-module. Extract services when teams genuinely need independent deploys."</em></li>
  <li><em>"BFF per client — composes microservice data into screen shapes; reduces mobile round trips; doesn't grow business logic (that lives in domain services)."</em></li>
  <li><em>"Event-driven for cross-domain decoupling — outbox pattern for atomic DB+publish; consumers idempotent; schema registry for backwards-compat."</em></li>
  <li><em>"Saga + compensations for distributed transactions — 2PC is brittle; sagas embrace eventual consistency."</em></li>
  <li><em>"Hexagonal architecture in code — domain depends on ports (interfaces); adapters plug in at the edges. Tests run in milliseconds with fakes."</em></li>
  <li><em>"CQRS only when reads diverge dramatically from writes — for most apps, materialized views suffice."</em></li>
  <li><em>"Strangler fig for migrations — one feature extracted at a time; old system shrinks. Big-bang rewrites fail."</em></li>
  <li><em>"12-factor app principles — env config, stateless, logs to stdout. The boring foundation that scales."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"team of 10 building SaaS"</td><td>Modular monolith with module boundaries enforced</td></tr>
    <tr><td>"50+ engineers, multiple teams"</td><td>Service per bounded context; clear ownership</td></tr>
    <tr><td>"mobile app needs faster"</td><td>BFF; aggregate microservice data</td></tr>
    <tr><td>"different scaling profiles"</td><td>Extract just the high-scale parts</td></tr>
    <tr><td>"different stacks justified"</td><td>Service boundary at language change</td></tr>
    <tr><td>"distributed transaction"</td><td>Saga with compensations; Temporal if complex</td></tr>
    <tr><td>"event-driven"</td><td>Outbox + Kafka + idempotent consumers</td></tr>
    <tr><td>"feed of denormalized data"</td><td>CQRS with read model + event projections</td></tr>
    <tr><td>"migrate monolith"</td><td>Strangler fig; one feature at a time</td></tr>
    <tr><td>"clean test boundary"</td><td>Hexagonal; domain pure; adapters at edges</td></tr>
  </tbody>
</table>

<h3>Demo script</h3>
<ol>
  <li>Clarify scale + team.</li>
  <li>Sketch the boundary map (monolith modules or services).</li>
  <li>Identify communication: sync vs async.</li>
  <li>Show one bounded context internal structure (handler → service → domain → repository).</li>
  <li>Address cross-cutting: BFF, gateway, observability.</li>
  <li>Talk migration / evolution path.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"Lint rules enforcing module boundaries (eslint-plugin-boundaries)."</em></li>
  <li><em>"Service mesh (Istio / Linkerd) for mTLS + tracing + retries."</em></li>
  <li><em>"OpenTelemetry trace context propagation across all hops."</em></li>
  <li><em>"Schema registry (Confluent / Pulsar) for event evolution."</em></li>
  <li><em>"BFF on Cloudflare Workers for global low-latency."</em></li>
  <li><em>"Strangler proxy with feature flags for gradual cutover."</em></li>
  <li><em>"Per-service runbooks + on-call rotations."</em></li>
  <li><em>"Architecture Decision Records (ADRs) for context preservation."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Restraint</td><td>Defaults to simpler; justifies complexity</td></tr>
    <tr><td>Boundary instinct</td><td>Maps boundaries to teams + bounded contexts</td></tr>
    <tr><td>Communication choice</td><td>Sync vs async deliberate</td></tr>
    <tr><td>Hexagonal awareness</td><td>Pure domain + ports + adapters</td></tr>
    <tr><td>Migration strategy</td><td>Strangler fig over rewrite</td></tr>
    <tr><td>Distributed-tx handling</td><td>Saga + compensations</td></tr>
    <tr><td>BFF clarity</td><td>Composes; doesn't grow logic</td></tr>
    <tr><td>12-factor literacy</td><td>Names the principles when relevant</td></tr>
    <tr><td>Real war stories</td><td>Specific decisions + outcomes</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN apps benefit hugely from BFF — composes data, reduces cellular round trips.</li>
  <li>BFF deployed on Cloudflare Workers / Vercel Edge for global low-latency.</li>
  <li>Backend architecture for serving mobile is the same as web; mobile has its own client architecture (covered in RN module).</li>
  <li>RN cross-platform sharing benefits from monorepo + shared types between BFF and app.</li>
  <li>Mobile-specific BFF concerns: offline-friendly responses, idempotency keys for retry, push trigger flow.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"When would you NOT pick microservices?"</em> — Team &lt; 30; deploy cadence already aligned; ops budget can't support distributed-system complexity; no clear ownership boundaries; "we might scale" instead of "we are scaling."</li>
  <li><em>"What's the difference between modular monolith and microservices?"</em> — Modular monolith: one deploy, one DB, module boundaries via lint. Microservices: independent deploys, separate DBs, network communication. Modular monolith captures most boundary benefits without ops overhead.</li>
  <li><em>"How does an event-driven system handle a downstream consumer outage?"</em> — Outbox guarantees the event is durable. Queue retains the message. Consumer comes back; processes from where it left off. No data loss; eventually consistent.</li>
  <li><em>"What's the saga pattern?"</em> — Distributed transaction without 2PC: each step has a compensating action. Run forward; on failure, run compensations in reverse. Choreography (events) or orchestration (Temporal).</li>
  <li><em>"How do you decide what's a bounded context?"</em> — Where does the language change? "Order" in Sales context (with discount, gift) vs "Order" in Fulfillment (with picking list). Different contexts = different types = boundary.</li>
  <li><em>"What's wrong with sharing a DB across services?"</em> — Schema changes coordinate across teams; deploy independence lost; one slow query affects all services; defeats the point of services.</li>
  <li><em>"How do you handle versioning across services?"</em> — Backwards-compat in API + events; deploy producer first with both versions; deploy consumers; remove old version from producer. Schema registry enforces compat.</li>
  <li><em>"How do you migrate a monolith without downtime?"</em> — Strangler fig: proxy in front; extract one feature to new service; route fraction of traffic; expand; eventually old monolith shrinks. Months-to-years; never big-bang.</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Build a modular monolith with 3 modules + lint-enforced boundaries.</li>
  <li>Add hexagonal layering (domain pure; adapters at edges).</li>
  <li>Extract one module to a service via strangler fig.</li>
  <li>Wire event-driven communication with outbox + Kafka.</li>
  <li>Add a BFF for one client.</li>
  <li>Read "Building Microservices" by Sam Newman.</li>
  <li>Read DDD foundations (Vaughn Vernon's "Implementing DDD").</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read 'Designing Data-Intensive Applications' part III on distributed systems."</li>
  <li>"Read Shopify's modular monolith blog series."</li>
  <li>"Read 'Microservices Patterns' by Chris Richardson for the saga + outbox details."</li>
  <li>"Audit a real codebase — identify bounded contexts; would you draw the boundaries differently?"</li>
</ul>

<div class="qa-block">
  <div class="qa-question">Q1. Place monolith, modular monolith and microservices on a spectrum. What does each trade off?</div>
  <div class="qa-answer">
    <p>The spectrum runs monolith → modular monolith → microservices → functions. A <strong>monolith</strong> is one process, one DB, one deploy: a fast start and simple ops, traded for coupling and teams stepping on each other as headcount grows. A <strong>modular monolith</strong> is still one deploy and one Postgres (with schemas per module), but modules talk only through public APIs, enforced by lint and review: you get most of the boundary benefits without network or ops overhead. <strong>Microservices</strong> are one process, DB and deploy per service with HTTP/gRPC/Kafka between them: teams ship independently and scale and fail independently, traded for distributed-system complexity, observability and ops cost. Functions push further: a managed runtime per request, expensive at scale.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q2. Why is a modular monolith the default, and what signals justify extracting a service?</div>
  <div class="qa-answer">
    <p>One deploy means simpler ops and no distributed-system bugs; one DB makes cross-module transactions trivial; a cross-module refactor is one PR; and boundaries are enforced by lint and code review instead of the network. Extract a service when a clear seam has emerged and there is a real signal: a team genuinely needs to ship independently many times a day, a part of the system has a very different scaling profile (search at 50 instances, admin at 2), a different stack is justified (ML in Python), or deploys are a constant fight. You also need a platform team for observability, CI/CD and service infrastructure. "The codebase feels big" or "we might scale" are not reasons.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q3. What does a BFF do, and when is it worth adding?</div>
  <div class="qa-answer">
    <p>A Backend For Frontend is a thin server tailored to one client (a web BFF, an app BFF) that composes data from several microservices into the exact, screen-shaped response that client needs. It cuts client round trips — which matters on mobile networks — shields the frontend from composition complexity, and lets the backend evolve without breaking clients. It's worth adding when clients really need composition across services. A BFF that just proxies requests without composing anything is pure overhead: an extra hop and an extra deploy for no benefit.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q4. Contrast event-driven architecture and CQRS. What do they cost in consistency and debugging?</div>
  <div class="qa-answer">
    <p><strong>Event-driven</strong> services communicate through events instead of RPC: the users service publishes <code>user.created</code> and email, analytics and provisioning react, and new consumers can be added without touching the producer. <strong>CQRS</strong> separates the write model (commands, for example Postgres) from a denormalized read model (Elasticsearch, Redis, a view) kept in sync via CDC or events; use it selectively when reads and writes scale very differently or query views are expensive to compute on demand. Both buy decoupling at the price of <strong>eventual consistency</strong> (consumers and read stores lag behind the write) and <strong>harder debugging</strong>, because a flow crosses async hops — so you need a schema registry, an outbox and good tracing.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q5. What decision factors drive the choice between a monolith and microservices?</div>
  <div class="qa-answer">
    <p><strong>Team size</strong> (under ~20 points to a monolith, 50+ engineers across many teams to services), <strong>deploy independence</strong> (are coordinated deploys fine, or do teams need to ship independently many times a day?), <strong>domain coupling</strong> (highly coupled shared data shapes versus distinct domains with clear boundaries), <strong>tech-stack fit</strong>, <strong>operational maturity</strong> (a small ops team versus a strong platform team with observability and CI/CD) and <strong>scaling profile</strong> (one DB handles the load versus very different needs per part). A rough guide: under 10 engineers, a monolith; 10–30, a modular monolith; 30–100, a modular monolith with selective extraction; 100+, microservices are justified.</p>
  </div>
</div>
` },

  ]
});
