window.PREP_SITE.registerTopic({
  id: 'api-trpc',
  module: 'api-design',
  title: 'tRPC / Type-Safe APIs',
  estimatedReadTime: '40 min',
  tags: ['trpc', 'type-safety', 'rpc', 'zod', 'react-query', 'end-to-end-types', 'monorepo'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>tRPC</strong> gives you end-to-end TypeScript safety from server function to React component without any code generation, schema language, or build step. You write a server <em>router</em>, infer its type, and call it on the client like a typed function. The killer feature: rename a procedure on the server and the client breaks at compile time. The trade: it's TS-only and not designed for public APIs or polyglot consumers.</p>
<ul>
  <li><strong>No schema language.</strong> Routes are TS functions; types flow via <code>typeof router</code>. Refactors propagate at compile time.</li>
  <li><strong>Procedures:</strong> <code>query</code> for reads, <code>mutation</code> for writes, <code>subscription</code> for streams. Validate inputs with <code>zod</code> (or any standard-schema-compatible lib).</li>
  <li><strong>Composable middleware:</strong> auth, logging, rate-limit, transactions, all via <code>.use()</code>.</li>
  <li><strong>React Query under the hood</strong> on the client — caching, retry, refetch on focus, optimistic updates for free.</li>
  <li><strong>Transport: HTTP for query/mutation, WebSocket / SSE for subscriptions.</strong> Default uses HTTP <code>POST</code> with batching link.</li>
  <li><strong>Best fit:</strong> TS-only product, monorepo, single client, single server. <strong>Not</strong> for public APIs, mobile-Swift/Kotlin clients, or polyglot consumers.</li>
  <li><strong>Cousins:</strong> ts-rest (REST + types), Hono RPC (RPC over Hono routes), Effect Schema, GraphQL with codegen — all solve "type safety without OpenAPI" differently.</li>
</ul>
<p><strong>Mantra:</strong> "TypeScript on both ends. No schema language. No codegen. The router is the contract."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>The pitch</h3>
<p>You write a function on the server. You call it on the client. The types flow. There's no OpenAPI yaml, no GraphQL SDL, no codegen step. If you rename <code>getUser</code> to <code>fetchUser</code>, every caller in the monorepo breaks immediately — IDE-level instant feedback.</p>

<pre><code class="language-typescript">// server/router.ts
export const appRouter = router({
  user: router({
    byId: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input, ctx }) =&gt; ctx.db.users.byId(input.id)),

    update: protectedProcedure
      .input(z.object({ id: z.string(), name: z.string() }))
      .mutation(async ({ input, ctx }) =&gt; ctx.db.users.update(input.id, { name: input.name })),
  }),
});
export type AppRouter = typeof appRouter;
</code></pre>

<pre><code class="language-typescript">// client/anywhere.tsx
const user = await trpc.user.byId.query({ id: '42' });
//    ^? type is User — fully inferred from the server signature

const { mutate } = trpc.user.update.useMutation();
mutate({ id: '42', name: 'Prakhar' }); // input type-checked
</code></pre>

<h3>Why this is different from REST + OpenAPI</h3>
<table>
  <thead><tr><th>Concern</th><th>REST + OpenAPI</th><th>tRPC</th></tr></thead>
  <tbody>
    <tr><td>Source of truth</td><td>OpenAPI yaml</td><td>TypeScript router</td></tr>
    <tr><td>Type generation</td><td>Codegen step (regenerate to refresh types)</td><td>Inference at compile time (no step)</td></tr>
    <tr><td>Refactor safety</td><td>Codegen lag = client lag = bugs</td><td>Refactor + compile = client breaks instantly</td></tr>
    <tr><td>Polyglot consumers</td><td>Yes (any language with HTTP client)</td><td>No (TS-only)</td></tr>
    <tr><td>Public API friendliness</td><td>Yes (curl, Postman, gateways)</td><td>No (no static contract)</td></tr>
    <tr><td>Caching</td><td>HTTP caches work natively</td><td>POSTs by default — server-side opt-in for GET</td></tr>
  </tbody>
</table>

<h3>Why this is different from GraphQL</h3>
<table>
  <thead><tr><th>Concern</th><th>GraphQL</th><th>tRPC</th></tr></thead>
  <tbody>
    <tr><td>Schema</td><td>SDL written or generated</td><td>None — TS types are the schema</td></tr>
    <tr><td>Client picks shape</td><td>Yes (selection set)</td><td>No (server defines return type)</td></tr>
    <tr><td>Over-/under-fetching</td><td>Solved (selection)</td><td>Solved by RPC granularity (one call = one shape)</td></tr>
    <tr><td>Tooling overhead</td><td>Heavy (SDL, codegen, gateway)</td><td>Light (just TS)</td></tr>
    <tr><td>Federation / multi-team</td><td>First-class (Apollo Federation)</td><td>Possible via merging routers; weaker story</td></tr>
    <tr><td>Real-time</td><td>Subscriptions (WS)</td><td>Subscriptions (WS / SSE)</td></tr>
    <tr><td>Cross-language</td><td>Yes (GraphQL is a spec)</td><td>No (TS-only)</td></tr>
  </tbody>
</table>

<h3>Where tRPC shines</h3>
<ul>
  <li>Monorepo with Next.js / Remix / SvelteKit on top of a Node backend.</li>
  <li>Internal admin tools, dashboards, full-stack TS startups.</li>
  <li>Mobile RN with TS — types travel from backend straight into RN code.</li>
  <li>Refactor-heavy domains where renaming things daily.</li>
  <li>Solo devs / small teams — no schema layer to maintain.</li>
</ul>

<h3>Where tRPC doesn't fit</h3>
<ul>
  <li>Public APIs: no machine-readable schema, no easy curl, no SDK languages other than TS.</li>
  <li>Polyglot teams: backend is Go / Rust / Java? Use REST or gRPC.</li>
  <li>Native iOS (Swift) / Android (Kotlin) without RN: Swift/Kotlin can't import TS types. Use REST + codegen or gRPC.</li>
  <li>CDN-cached read APIs at scale: GET-able fingerprints harder; persisted-style flow is bolt-on.</li>
  <li>Schema-stitching across teams: federation isn't a first-class story.</li>
</ul>

<h3>What "good tRPC" looks like</h3>
<ul>
  <li>Routers grouped by domain (<code>user</code>, <code>order</code>, <code>billing</code>) — not one mega-router.</li>
  <li>Inputs validated with zod; never accept <code>z.any()</code> in production.</li>
  <li>Auth + rate-limit applied as middleware, not per-procedure boilerplate.</li>
  <li>Errors are <code>TRPCError</code> instances with stable codes.</li>
  <li>Server batching via <code>httpBatchLink</code> on the client.</li>
  <li>Long-lived subscriptions on a separate transport (WebSocket).</li>
  <li>Versioning policy documented (additive procedures, deprecate before remove).</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The four building blocks</h3>
<ol>
  <li><strong>Procedures</strong> — single endpoint functions: <code>query</code> (read), <code>mutation</code> (write), <code>subscription</code> (push).</li>
  <li><strong>Routers</strong> — namespaces grouping procedures: <code>router({ list, byId, update })</code>.</li>
  <li><strong>Context</strong> — per-request data (DB handle, auth viewer, request headers). Built by <code>createContext()</code>.</li>
  <li><strong>Middleware</strong> — function that wraps a procedure, runs before/after, can modify context (e.g., assert auth).</li>
</ol>

<h3>The flow of a request</h3>
<pre><code class="language-text">Client call (proxy method)
   ↓
Link chain  (batching, splitting query/mutation/subscription, retries)
   ↓
HTTP POST / WebSocket frame
   ↓
Server adapter (express / fetch / Next.js handler)
   ↓
createContext({ req, res })
   ↓
Router resolves path → procedure
   ↓
Middleware chain
   ↓
zod input parse
   ↓
Resolver function
   ↓
JSON-serialised response
</code></pre>

<h3>Procedure types</h3>
<table>
  <thead><tr><th>Type</th><th>Verb mapping</th><th>Cacheable?</th><th>Side effects</th></tr></thead>
  <tbody>
    <tr><td><code>query</code></td><td>GET (with batched-link override)</td><td>Yes (server can opt-in)</td><td>None expected</td></tr>
    <tr><td><code>mutation</code></td><td>POST</td><td>No</td><td>Yes</td></tr>
    <tr><td><code>subscription</code></td><td>WebSocket / SSE</td><td>No</td><td>None (push only)</td></tr>
  </tbody>
</table>

<h3>Inputs and outputs</h3>
<ul>
  <li><strong>Input validation:</strong> <code>.input(zod schema)</code>. tRPC will reject malformed inputs with <code>BAD_REQUEST</code>.</li>
  <li><strong>Output validation:</strong> <code>.output(zod schema)</code> (optional). Catches accidental over-/under-returning at runtime.</li>
  <li><strong>Inferred types:</strong> client-side, <code>RouterInputs</code> / <code>RouterOutputs</code> helpers give you <code>RouterInputs['user']['byId']</code> and <code>RouterOutputs['user']['byId']</code> as TS types.</li>
</ul>

<pre><code class="language-typescript">import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '../server/router';

type RouterInputs  = inferRouterInputs&lt;AppRouter&gt;;
type RouterOutputs = inferRouterOutputs&lt;AppRouter&gt;;

type UserByIdInput  = RouterInputs['user']['byId'];   // { id: string }
type UserByIdOutput = RouterOutputs['user']['byId'];  // User
</code></pre>

<h3>Middleware mental model</h3>
<pre><code class="language-typescript">const t = initTRPC.context&lt;Context&gt;().create();

const isAuthed = t.middleware(({ ctx, next }) =&gt; {
  if (!ctx.viewer) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, viewer: ctx.viewer } }); // narrow viewer to non-null
});

export const protectedProcedure = t.procedure.use(isAuthed);
</code></pre>
<p>Key insight: middleware can <em>narrow the context type</em> — after <code>isAuthed</code>, downstream resolvers see <code>ctx.viewer</code> as non-null.</p>

<h3>Error model</h3>
<pre><code class="language-typescript">throw new TRPCError({
  code: 'CONFLICT',           // maps to HTTP 409
  message: 'Email already taken',
  cause: originalError,        // for logging, not exposed to client
});
</code></pre>
<table>
  <thead><tr><th><code>code</code></th><th>HTTP</th></tr></thead>
  <tbody>
    <tr><td><code>BAD_REQUEST</code></td><td>400</td></tr>
    <tr><td><code>UNAUTHORIZED</code></td><td>401</td></tr>
    <tr><td><code>FORBIDDEN</code></td><td>403</td></tr>
    <tr><td><code>NOT_FOUND</code></td><td>404</td></tr>
    <tr><td><code>CONFLICT</code></td><td>409</td></tr>
    <tr><td><code>UNPROCESSABLE_CONTENT</code></td><td>422</td></tr>
    <tr><td><code>TOO_MANY_REQUESTS</code></td><td>429</td></tr>
    <tr><td><code>INTERNAL_SERVER_ERROR</code></td><td>500</td></tr>
    <tr><td><code>SERVICE_UNAVAILABLE</code></td><td>503</td></tr>
  </tbody>
</table>

<h3>Client transports (links)</h3>
<table>
  <thead><tr><th>Link</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td><code>httpLink</code></td><td>One HTTP request per call</td></tr>
    <tr><td><code>httpBatchLink</code></td><td>Batches concurrent calls into one HTTP POST</td></tr>
    <tr><td><code>splitLink</code></td><td>Routes by op type — e.g., subscriptions to WS, queries to HTTP</td></tr>
    <tr><td><code>wsLink</code></td><td>WebSocket transport for subscriptions</td></tr>
    <tr><td><code>loggerLink</code></td><td>Dev-only console logging</td></tr>
    <tr><td><code>retryLink</code></td><td>Configurable retry on failure</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Server setup (Node + Express adapter)</h3>
<pre><code class="language-typescript">import { initTRPC, TRPCError } from '@trpc/server';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { z } from 'zod';

interface Context {
  viewer: { id: string; role: 'ADMIN' | 'MEMBER' } | null;
  db: DB;
}

async function createContext({ req }: trpcExpress.CreateExpressContextOptions): Promise&lt;Context&gt; {
  const viewer = await authFromHeaders(req.headers);
  return { viewer, db };
}

const t = initTRPC.context&lt;Context&gt;().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: { ...shape.data, zodError: error.cause instanceof ZodError ? error.cause.flatten() : null },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) =&gt; {
  if (!ctx.viewer) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { ...ctx, viewer: ctx.viewer } });
});

const userRouter = router({
  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ input, ctx }) =&gt; ctx.db.users.byId(input.id)),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid(), name: z.string().min(1).max(80) }))
    .mutation(async ({ input, ctx }) =&gt; {
      if (input.id !== ctx.viewer.id &amp;&amp; ctx.viewer.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      return ctx.db.users.update(input.id, { name: input.name });
    }),
});

export const appRouter = router({
  user: userRouter,
  // post: postRouter, billing: billingRouter, ...
});
export type AppRouter = typeof appRouter;

app.use('/trpc', createExpressMiddleware({ router: appRouter, createContext }));
</code></pre>

<h3>Client setup (React + React Query)</h3>
<pre><code class="language-typescript">import { httpBatchLink, loggerLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AppRouter } from '../server/router';

export const trpc = createTRPCReact&lt;AppRouter&gt;();

const queryClient = new QueryClient();
const trpcClient = trpc.createClient({
  links: [
    loggerLink({ enabled: () =&gt; process.env.NODE_ENV !== 'production' }),
    httpBatchLink({
      url: '/trpc',
      headers: () =&gt; ({ Authorization: \`Bearer \${getToken()}\` }),
    }),
  ],
});

function App() {
  return (
    &lt;trpc.Provider client={trpcClient} queryClient={queryClient}&gt;
      &lt;QueryClientProvider client={queryClient}&gt;
        &lt;Routes /&gt;
      &lt;/QueryClientProvider&gt;
    &lt;/trpc.Provider&gt;
  );
}
</code></pre>

<h3>Calling on the client</h3>
<pre><code class="language-typescript">// Hooks (React)
function UserCard({ id }: { id: string }) {
  const { data, isLoading, error } = trpc.user.byId.useQuery({ id });
  const updateUser = trpc.user.update.useMutation({
    onSuccess: () =&gt; utils.user.byId.invalidate({ id }),
  });

  if (isLoading) return &lt;Spinner /&gt;;
  if (error) return &lt;ErrorBox message={error.message} /&gt;;
  return (
    &lt;form onSubmit={e =&gt; { e.preventDefault(); updateUser.mutate({ id, name: e.currentTarget.name.value }); }}&gt;
      &lt;input name="name" defaultValue={data!.name} /&gt;
      &lt;button disabled={updateUser.isLoading}&gt;Save&lt;/button&gt;
    &lt;/form&gt;
  );
}

// Vanilla (no React):
const user = await trpc.user.byId.query({ id });
const updated = await trpc.user.update.mutate({ id, name });
</code></pre>

<h3>Optimistic updates</h3>
<pre><code class="language-typescript">const utils = trpc.useUtils();

const updateUser = trpc.user.update.useMutation({
  onMutate: async ({ id, name }) =&gt; {
    await utils.user.byId.cancel({ id });
    const prev = utils.user.byId.getData({ id });
    utils.user.byId.setData({ id }, (old) =&gt; (old ? { ...old, name } : old));
    return { prev };
  },
  onError: (err, vars, ctx) =&gt; {
    utils.user.byId.setData({ id: vars.id }, ctx?.prev);
  },
  onSettled: ({ id }) =&gt; utils.user.byId.invalidate({ id }),
});
</code></pre>
<p>Same shape as React Query directly. tRPC v11 also has <code>useOptimisticMutation</code> helpers.</p>

<h3>Subscriptions over WebSocket</h3>
<pre><code class="language-typescript">// Server
import { observable } from '@trpc/server/observable';

const postRouter = router({
  onNewComment: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .subscription(({ input, ctx }) =&gt;
      observable&lt;Comment&gt;((emit) =&gt; {
        const handler = (c: Comment) =&gt; { if (c.postId === input.postId) emit.next(c); };
        ctx.events.on('comment.created', handler);
        return () =&gt; ctx.events.off('comment.created', handler);
      })
    ),
});

// Client
trpc.post.onNewComment.useSubscription({ postId }, {
  onData: (comment) =&gt; addComment(comment),
});
</code></pre>

<p>Transport setup with <code>splitLink</code>:</p>
<pre><code class="language-typescript">import { createWSClient, wsLink, splitLink, httpBatchLink } from '@trpc/client';

const wsClient = createWSClient({ url: 'ws://localhost:3000/trpc' });

const links = [
  splitLink({
    condition: (op) =&gt; op.type === 'subscription',
    true: wsLink({ client: wsClient }),
    false: httpBatchLink({ url: '/trpc' }),
  }),
];
</code></pre>

<h3>Server-side caller (server components, scripts)</h3>
<pre><code class="language-typescript">import { appRouter } from '../router';

const caller = appRouter.createCaller({ viewer: serverUser, db });
const user = await caller.user.byId({ id: '42' }); // no HTTP, direct call
</code></pre>
<p>Same router, no network. Used in Next.js server components, edge functions, scripts, tests.</p>

<h3>Versioning</h3>
<p>Two main strategies:</p>
<table>
  <thead><tr><th>Strategy</th><th>Use when</th></tr></thead>
  <tbody>
    <tr><td>Additive evolution</td><td>Default. Add new procedure or input field; never remove without deprecation.</td></tr>
    <tr><td>Versioned router subtree</td><td><code>v1: router({...})</code>, <code>v2: router({...})</code> when a breaking change is unavoidable.</td></tr>
  </tbody>
</table>

<h3>Migration / interop</h3>
<ul>
  <li><strong>tRPC ↔ OpenAPI:</strong> <code>trpc-openapi</code> auto-generates an OpenAPI spec from your router so non-TS consumers can call typed REST endpoints.</li>
  <li><strong>tRPC inside Next.js:</strong> <code>@trpc/next</code> wires SSR-friendly hooks; server components can use <code>createCaller</code> directly.</li>
  <li><strong>tRPC + RN:</strong> works the same as React; share <code>AppRouter</code> type via a shared package in the monorepo.</li>
  <li><strong>tRPC + native (Swift/Kotlin):</strong> not supported directly. Either expose a parallel REST/gRPC layer or use <code>trpc-openapi</code> + standard SDK codegen.</li>
</ul>

<h3>Cousins worth knowing</h3>
<table>
  <thead><tr><th>Tool</th><th>Niche</th></tr></thead>
  <tbody>
    <tr><td>ts-rest</td><td>Type-safe REST. Define a contract once, share with server (Express/Nest/Fastify) and client. Plays well with OpenAPI.</td></tr>
    <tr><td>Hono RPC</td><td>If you're on Hono, RPC types come for free; lighter than tRPC for edge / serverless.</td></tr>
    <tr><td>Effect Schema / Effect HTTP</td><td>Schema-first; ties into the broader Effect ecosystem (errors, fibers, retries).</td></tr>
    <tr><td>Connect (gRPC-Web for TS)</td><td>Schema-first via Protobuf; cross-language; runs on browsers + Node.</td></tr>
    <tr><td>GraphQL + codegen</td><td>If you want GraphQL but with tRPC-level inference; <code>graphql-codegen</code> + Apollo / Urql.</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Cursor-paginated feed</h3>
<pre><code class="language-typescript">// Server
const postRouter = router({
  feed: publicProcedure
    .input(z.object({
      cursor: z.string().nullish(),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ input, ctx }) =&gt; {
      const cursor = input.cursor ? decodeCursor(input.cursor) : null;
      const rows = await ctx.db.posts.list({
        where: cursor ? { id: { lt: cursor.id } } : {},
        orderBy: { id: 'desc' },
        limit: input.limit + 1,
      });
      const hasMore = rows.length &gt; input.limit;
      const items = hasMore ? rows.slice(0, -1) : rows;
      return {
        items,
        nextCursor: hasMore ? encodeCursor({ id: items.at(-1)!.id }) : null,
      };
    }),
});

// Client (React Query infinite query)
function Feed() {
  const query = trpc.post.feed.useInfiniteQuery(
    { limit: 20 },
    { getNextPageParam: (last) =&gt; last.nextCursor }
  );
  return (
    &lt;div&gt;
      {query.data?.pages.flatMap(p =&gt; p.items).map(p =&gt; &lt;PostCard key={p.id} {...p} /&gt;)}
      {query.hasNextPage &amp;&amp; (
        &lt;button onClick={() =&gt; query.fetchNextPage()} disabled={query.isFetchingNextPage}&gt;
          {query.isFetchingNextPage ? 'Loading…' : 'Load more'}
        &lt;/button&gt;
      )}
    &lt;/div&gt;
  );
}
</code></pre>

<h3>Example 2: Auth + role-based middleware</h3>
<pre><code class="language-typescript">const isAuthed = t.middleware(({ ctx, next }) =&gt; {
  if (!ctx.viewer) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { ...ctx, viewer: ctx.viewer } });
});

const isAdmin = t.middleware(({ ctx, next }) =&gt; {
  if (ctx.viewer?.role !== 'ADMIN') throw new TRPCError({ code: 'FORBIDDEN' });
  return next({ ctx });
});

export const protectedProcedure = t.procedure.use(isAuthed);
export const adminProcedure = protectedProcedure.use(isAdmin);

const adminRouter = router({
  banUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(({ input, ctx }) =&gt; ctx.db.users.ban(input.userId)),
});
</code></pre>

<h3>Example 3: Rate limiting middleware</h3>
<pre><code class="language-typescript">import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const limiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
});

const rateLimited = t.middleware(async ({ ctx, next, path }) =&gt; {
  const key = ctx.viewer?.id ?? ctx.ipAddress;
  const { success, reset } = await limiter.limit(\`\${key}:\${path}\`);
  if (!success) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Slow down, retry after ' + new Date(reset).toISOString(),
    });
  }
  return next();
});

export const rateLimitedProcedure = t.procedure.use(rateLimited);
</code></pre>

<h3>Example 4: Transactional mutation with optimistic update</h3>
<pre><code class="language-typescript">// Server
const orderRouter = router({
  place: protectedProcedure
    .input(z.object({ items: z.array(z.object({ sku: z.string(), qty: z.number().int().positive() })) }))
    .output(z.object({ orderId: z.string(), totalCents: z.number() }))
    .mutation(async ({ input, ctx }) =&gt; {
      return ctx.db.transaction(async (tx) =&gt; {
        const totalCents = await pricing.compute(tx, input.items);
        const order = await tx.orders.create({ userId: ctx.viewer.id, totalCents });
        await tx.orderItems.bulkCreate(order.id, input.items);
        await tx.inventory.deduct(input.items);
        return { orderId: order.id, totalCents };
      });
    }),
});

// Client (optimistic basket clear)
const utils = trpc.useUtils();

const place = trpc.order.place.useMutation({
  onMutate: async () =&gt; {
    const prev = utils.cart.get.getData();
    utils.cart.get.setData(undefined, (old) =&gt; old ? { ...old, items: [] } : old);
    return { prev };
  },
  onError: (err, vars, ctx) =&gt; utils.cart.get.setData(undefined, ctx?.prev),
  onSettled: () =&gt; utils.cart.get.invalidate(),
});
</code></pre>

<h3>Example 5: Server-side prefetch (Next.js)</h3>
<pre><code class="language-typescript">// app/post/[id]/page.tsx (Next.js app router)
import { appRouter } from '@/server/router';
import { createContext } from '@/server/context';

export default async function PostPage({ params }: { params: { id: string } }) {
  const ctx = await createContext({ headers: headers() });
  const caller = appRouter.createCaller(ctx);
  const post = await caller.post.byId({ id: params.id });
  return &lt;PostView post={post} /&gt;;
}
</code></pre>
<p>No HTTP, no client hydration mismatch — calling the router as a function on the server.</p>

<h3>Example 6: tRPC + RN with shared types</h3>
<p>Monorepo layout:</p>
<pre><code class="language-text">apps/
  api/         (Node + Express + tRPC)
  mobile/      (React Native + Expo)
packages/
  api-types/   (re-exports type AppRouter from apps/api/router)
</code></pre>

<pre><code class="language-typescript">// apps/mobile/src/trpc.ts
import { createTRPCReact, httpBatchLink } from '@trpc/react-query';
import type { AppRouter } from '@my-org/api-types';

export const trpc = createTRPCReact&lt;AppRouter&gt;();
export const trpcClient = trpc.createClient({
  links: [httpBatchLink({
    url: 'https://api.example.com/trpc',
    headers: () =&gt; ({ Authorization: \`Bearer \${SecureStore.getItemAsync('jwt')}\` }),
  })],
});
</code></pre>
<p>RN screens call <code>trpc.user.byId.useQuery</code> identically to web. The shared package gives RN the type without bundling server code.</p>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>Type inference pitfalls</h3>
<ul>
  <li><strong>Async types blow up with deep recursion.</strong> Long routers (50+ procedures) can hit TS recursion limits — split into sub-routers.</li>
  <li><strong>Re-exporting types loses inference.</strong> Always export <code>type AppRouter = typeof appRouter</code> from the same module that builds the router.</li>
  <li><strong>Generics in resolvers cause "any" leak.</strong> If a procedure returns <code>T</code> from a generic helper, the inferred output collapses. Be explicit.</li>
  <li><strong>Conditional types in inputs / outputs</strong> often work but are brittle; prefer concrete types.</li>
</ul>

<h3>Serialisation</h3>
<ul>
  <li>Default transformer: JSON. Lose <code>Date</code>, <code>Map</code>, <code>Set</code>, <code>BigInt</code>, <code>undefined</code>.</li>
  <li>Use <code>superjson</code> as the data transformer to round-trip these:</li>
</ul>
<pre><code class="language-typescript">import superjson from 'superjson';

const t = initTRPC.context&lt;Context&gt;().create({ transformer: superjson });
// also pass on the client link.
</code></pre>
<ul>
  <li>BigInt + JSON.stringify still throws without a custom replacer; superjson handles it.</li>
  <li>File uploads — tRPC doesn't natively handle multipart. Use a separate upload endpoint or pre-signed URLs.</li>
</ul>

<h3>Caching gotchas</h3>
<ul>
  <li>POSTs aren't HTTP-cacheable by default. Set <code>maxAge</code> per-procedure with response meta and switch transport to GET for those (<code>httpBatchLink({ headers, fetch, methodOverride: 'GET' })</code>).</li>
  <li>React Query cache key = procedure path + serialised input. Same input but different cache namespace? You probably need different paths.</li>
  <li>Optimistic updates need <code>onSettled: () =&gt; invalidate</code> to reconcile.</li>
</ul>

<h3>Subscription scaling</h3>
<ul>
  <li>In-memory event emitters don't scale across server instances. Use Redis pub/sub or NATS.</li>
  <li>WebSocket reconnect: client lib auto-reconnects, but subscriptions must re-subscribe on reconnect — handled by <code>wsLink</code>.</li>
  <li>Backpressure: slow consumers can stack up emissions. Cap queue or drop old events.</li>
  <li>Mobile: WS dies on background. For "live" content, fall back to push notification for trigger + polling on foreground.</li>
</ul>

<h3>Error surface</h3>
<ul>
  <li>Don't throw bare <code>Error</code> — clients see <code>INTERNAL_SERVER_ERROR</code> with stack-trace stripped (good for security, bad for UX).</li>
  <li>Pin <code>cause</code> to the original error for server logs without leaking it to clients.</li>
  <li>For domain failures clients should branch on, prefer return-typed results over throws — <code>{ ok: false, code: 'EMAIL_TAKEN' }</code> beats <code>throw</code> when the failure is expected.</li>
</ul>

<h3>Auth + middleware edges</h3>
<ul>
  <li>Middleware runs <em>before</em> input parsing. Don't read input in middleware unless you opt into the slower path.</li>
  <li>Refresh tokens: re-auth on 401 in a link, then retry. tRPC's <code>retryLink</code> + custom logic.</li>
  <li>RBAC: middlewares stack — <code>protectedProcedure.use(isOrgAdmin)</code>; type narrowing carries through.</li>
</ul>

<h3>Versioning + monorepo realities</h3>
<ul>
  <li>Mobile RN apps keep older AppRouter type in their bundle. Server must accept old shapes for the lifetime of the app version on user devices.</li>
  <li>If the type changes, the app can't decode the response — your contract has broken.</li>
  <li>Plan: additive only. New procedures, new input fields. Deprecate first; remove only after telemetry shows zero usage.</li>
  <li>Use a shared <code>@my-org/api-types</code> package versioned independently; pin clients deliberately.</li>
</ul>

<h3>Public-facing constraints</h3>
<ul>
  <li>tRPC has no machine-readable schema by default. If you need one for partners, use <code>trpc-openapi</code> to auto-generate.</li>
  <li>Rate limit at the gateway, not just middleware — middleware runs after parsing; gateways protect the parser.</li>
  <li>CORS: fully open is fine for dev; production should pin origin.</li>
</ul>

<h3>Testing</h3>
<ul>
  <li><code>appRouter.createCaller(ctx)</code> for unit / integration tests — no HTTP needed.</li>
  <li>Mock context for auth scenarios; assert middleware throws.</li>
  <li>Type tests with <code>expect-type</code> or <code>@ts-expect-error</code> to lock the schema.</li>
  <li>Snapshot tests for router shape: prevents accidental procedure removal.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 10 most common tRPC mistakes</h3>
<ol>
  <li><strong>Skipping zod input validation.</strong> "It's TypeScript, the client knows the shape." Then someone calls the endpoint with curl and your server crashes.</li>
  <li><strong>One mega-router.</strong> 200 procedures in one file. Split by domain.</li>
  <li><strong>Ignoring middleware.</strong> Auth checks duplicated across every procedure.</li>
  <li><strong>Throwing <code>Error</code> instead of <code>TRPCError</code>.</strong> Client gets unhelpful 500s.</li>
  <li><strong>Returning DB rows directly.</strong> Internal columns leak (password hashes, internal flags).</li>
  <li><strong>Forgetting superjson.</strong> Dates serialise as strings; arithmetic breaks downstream.</li>
  <li><strong>Mutating data in <code>query</code>.</strong> Queries should be read-only — caching assumes it.</li>
  <li><strong>Not invalidating after mutations.</strong> UI shows stale data; users hit refresh.</li>
  <li><strong>Calling <code>.mutate()</code> in a loop.</strong> N HTTP requests instead of one batch endpoint.</li>
  <li><strong>Tightly coupling app to <code>typeof appRouter</code>.</strong> Use <code>inferRouterInputs</code> / <code>inferRouterOutputs</code> for ergonomic types in components.</li>
</ol>

<h3>Anti-pattern: returning DB models directly</h3>
<pre><code class="language-typescript">// BAD — leaks internal fields
.query(({ ctx }) =&gt; ctx.db.users.findUnique({ where: { id } }));

// GOOD — explicit projection
.output(UserPublic)
.query(async ({ ctx }) =&gt; {
  const u = await ctx.db.users.findUnique({ where: { id } });
  return { id: u.id, name: u.name, avatarUrl: u.avatarUrl };
});
</code></pre>

<h3>Anti-pattern: untyped <code>any</code> inputs</h3>
<pre><code class="language-typescript">// BAD
.input(z.any())
.mutation(({ input }) =&gt; { /* whatever */ });

// GOOD
.input(z.object({ id: z.string().uuid(), name: z.string().min(1).max(80) }))
.mutation(({ input }) =&gt; { /* typed */ });
</code></pre>

<h3>Anti-pattern: per-procedure auth checks</h3>
<pre><code class="language-typescript">// BAD
.query(async ({ input, ctx }) =&gt; {
  if (!ctx.viewer) throw new TRPCError({ code: 'UNAUTHORIZED' });
  // ...
})

// GOOD
const protectedProcedure = t.procedure.use(isAuthed);
protectedProcedure.query(({ ctx }) =&gt; { /* ctx.viewer is non-null */ });
</code></pre>

<h3>Anti-pattern: ignoring batching</h3>
<pre><code class="language-typescript">// BAD — N independent HTTP requests
for (const id of ids) {
  await trpc.user.byId.query({ id });
}

// GOOD — Promise.all + batch link coalesces into one POST
await Promise.all(ids.map(id =&gt; trpc.user.byId.query({ id })));

// BETTER — server endpoint that takes an array
.input(z.object({ ids: z.array(z.string()).max(100) }))
.query(({ input, ctx }) =&gt; ctx.loaders.user.loadMany(input.ids));
</code></pre>

<h3>Anti-pattern: forgetting query invalidation</h3>
<pre><code class="language-typescript">// BAD
const updateUser = trpc.user.update.useMutation();

// GOOD
const utils = trpc.useUtils();
const updateUser = trpc.user.update.useMutation({
  onSuccess: () =&gt; utils.user.byId.invalidate(),
});
</code></pre>

<h3>Anti-pattern: subscription + REST mix-up</h3>
<p>Don't expose long-lived <code>subscription</code> over <code>httpBatchLink</code>; HTTP timeouts will sever it. Always use <code>wsLink</code> via <code>splitLink</code> for subscriptions.</p>

<h3>Anti-pattern: trying to use tRPC as a public API</h3>
<p>If your consumers are partners writing in 5 languages, they don't have your TS types. Either:</p>
<ul>
  <li>Add <code>trpc-openapi</code> and ship a generated REST spec.</li>
  <li>Or use REST + OpenAPI from the start; tRPC isn't the right tool.</li>
</ul>

<h3>Anti-pattern: dropping zod and writing custom validators</h3>
<pre><code class="language-typescript">// BAD — duplicates type + validator + error format
.input(rawInputCheck)

// GOOD — zod is the source of truth, types inferred
.input(z.object({ id: z.string().uuid() }))
</code></pre>

<h3>Anti-pattern: not splitting context</h3>
<p>Stuffing every dependency into context (db, logger, queue, redis, search, mail, ...) makes testing painful. Group by service and inject at boundaries.</p>

<h3>Anti-pattern: leaking <code>Date</code> assumptions</h3>
<p>Without superjson, <code>new Date()</code> on the server arrives as a string on the client. Code that does <code>data.createdAt.getTime()</code> dies silently. Either ship superjson or always serialise to ISO strings explicitly.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common tRPC design prompts</h3>
<ol>
  <li>Design a tRPC router for a small e-commerce app.</li>
  <li>Compare tRPC vs REST vs GraphQL for X scenario.</li>
  <li>How would you add auth + rate limit + logging cleanly?</li>
  <li>How would you migrate an existing REST API to tRPC?</li>
  <li>How would you handle real-time chat with tRPC?</li>
  <li>How would you expose a tRPC API to a non-TS partner?</li>
  <li>How would you version a tRPC router across mobile app releases?</li>
</ol>

<h3>The 5-step framework for any tRPC prompt</h3>
<ol>
  <li><strong>Confirm the fit.</strong> "tRPC is great for TS-only monorepos; if there are non-TS consumers, we should add OpenAPI or pick REST/gRPC." — score points by naming this up front.</li>
  <li><strong>Sketch routers by domain.</strong> Top-level router composes sub-routers.</li>
  <li><strong>Pick procedure types and inputs.</strong> zod schemas for everything.</li>
  <li><strong>Add cross-cutting middleware.</strong> Auth, rate-limit, logging, transactions.</li>
  <li><strong>Address transport + caching:</strong> batching link, splitLink for WS, response cache for hot queries, optimistic updates on the client.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"tRPC since this is a TS-only monorepo with one client and one server. If we were polyglot, REST + OpenAPI would be the call."</em></li>
  <li><em>"zod for input validation — single source of truth; types are inferred from the schema, no codegen."</em></li>
  <li><em>"Auth as middleware that narrows the context — every protected procedure sees a non-null viewer at compile time."</em></li>
  <li><em>"<code>httpBatchLink</code> on the client batches concurrent calls into one POST — saves round trips, especially on mobile."</em></li>
  <li><em>"superjson transformer so Dates and BigInts round-trip cleanly. JSON-only loses them."</em></li>
  <li><em>"<code>splitLink</code> routes subscriptions to WebSocket and queries/mutations to HTTP — same router, two transports."</em></li>
  <li><em>"Versioning by additive evolution — never remove without deprecation telemetry showing zero usage."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt keyword</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"TS monorepo", "share types"</td><td>tRPC's main fit</td></tr>
    <tr><td>"public API", "partners"</td><td>tRPC + <code>trpc-openapi</code> or just REST</td></tr>
    <tr><td>"polyglot consumers"</td><td>Not tRPC. REST or gRPC.</td></tr>
    <tr><td>"real-time chat"</td><td>tRPC subscription over WebSocket + Redis pub/sub</td></tr>
    <tr><td>"infinite feed"</td><td><code>useInfiniteQuery</code> with cursor</td></tr>
    <tr><td>"rate limit"</td><td>Middleware with Upstash / Redis sliding window</td></tr>
    <tr><td>"file upload"</td><td>Pre-signed S3 URL via mutation, not multipart through tRPC</td></tr>
    <tr><td>"optimistic UI"</td><td><code>onMutate</code> + cache <code>setData</code> + rollback in <code>onError</code></td></tr>
    <tr><td>"server-side render"</td><td><code>appRouter.createCaller(ctx)</code> for direct calls</td></tr>
  </tbody>
</table>

<h3>Demo script (whiteboard / IDE)</h3>
<ol>
  <li>Sketch one or two routers with key procedures.</li>
  <li>Show input schemas with zod.</li>
  <li>Show middleware composition (public / protected / admin).</li>
  <li>Show one client call with React Query hook + invalidation.</li>
  <li>Walk through the type flow: rename a procedure → compile error in the consumer.</li>
  <li>Talk transports: <code>httpBatchLink</code> + <code>splitLink</code> for subscriptions.</li>
  <li>Address versioning + interop with non-TS clients.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"Add <code>trpc-openapi</code> for partner consumers; ship parallel REST."</em></li>
  <li><em>"Per-procedure metrics: latency, error rate, batch size, top callers."</em></li>
  <li><em>"Output validation with zod for paranoid contract enforcement."</em></li>
  <li><em>"Subscription transport over WebSocket with Redis pub/sub for multi-instance."</em></li>
  <li><em>"Auth + RBAC middleware library shared across all routers."</em></li>
  <li><em>"OpenTelemetry tracing in middleware — span per procedure."</em></li>
  <li><em>"Persisted-query-style allowlist for mobile clients to lock the API surface."</em></li>
  <li><em>"Migration tooling: codemod to bump procedure inputs across the monorepo."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Fit awareness</td><td>Names tRPC's TS-only constraint up front</td></tr>
    <tr><td>Validation hygiene</td><td>zod inputs everywhere, no <code>z.any()</code></td></tr>
    <tr><td>Middleware fluency</td><td>Auth, RBAC, rate-limit as composed procedures</td></tr>
    <tr><td>Error model</td><td><code>TRPCError</code> with code + cause; doesn't expose internals</td></tr>
    <tr><td>Transport instinct</td><td><code>httpBatchLink</code>, <code>splitLink</code>, <code>wsLink</code> chosen deliberately</td></tr>
    <tr><td>Cache + invalidation</td><td>Mutations invalidate; optimistic updates with rollback</td></tr>
    <tr><td>Versioning maturity</td><td>Names additive evolution, deprecation telemetry</td></tr>
    <tr><td>Mobile awareness</td><td>Shared types via package; batching on RN; superjson</td></tr>
    <tr><td>Restraint</td><td>Recommends REST/GraphQL when the prompt fits them better</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>tRPC is one of the cleanest ways to share types between a Node backend and an RN app — <code>type AppRouter</code> in a shared package, no codegen.</li>
  <li>React Query under the hood gives offline-first ergonomics: stale-while-revalidate, cache persistence with <code>react-query-async-storage-persister</code>.</li>
  <li>Mobile networks are flaky; <code>retryLink</code> + idempotent mutations + idempotency keys handle retries.</li>
  <li>Subscriptions over WebSocket die on background; for live content, mix push notifications + polling on foreground.</li>
  <li>Versioning is critical: app versions linger on devices for months. Additive evolution; deprecate before remove; track usage by app version.</li>
  <li>If the team also has native iOS / Android (no RN), don't try to make tRPC fit — expose REST via <code>trpc-openapi</code> or build a parallel layer.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"Why not GraphQL?"</em> — GraphQL pays for client-picks-shape with SDL + codegen + gateway. If we don't need that and we're TS-only, tRPC is lighter and refactor-safer.</li>
  <li><em>"How do you handle a mobile app version that's six months out of date?"</em> — Additive-only schema evolution, keep deprecated procedures alive, track usage per app version, sunset only when usage hits zero.</li>
  <li><em>"How do you do rate limiting fairly?"</em> — Sliding-window in middleware keyed on viewer + procedure path; gateway-level for unauthenticated endpoints.</li>
  <li><em>"How do you handle transactions?"</em> — Wrap the resolver body in <code>db.transaction</code>; never split a transaction across procedures.</li>
  <li><em>"How would you trace one user's request through your system?"</em> — OpenTelemetry middleware; correlation ID in context propagated to logger and downstream services.</li>
  <li><em>"What if a partner wants to call this API in Go?"</em> — <code>trpc-openapi</code> generates an OpenAPI spec; partner uses standard codegen. Or build a parallel REST layer; don't force tRPC on non-TS clients.</li>
  <li><em>"How do you migrate from REST to tRPC?"</em> — Wrap REST handlers in tRPC procedures during the transition. Ship the new client behind a flag. Migrate consumers; retire REST.</li>
</ul>

<h3>"What I'd do day one prepping tRPC"</h3>
<ul>
  <li>Build a small monorepo: Node + tRPC + RN, share <code>AppRouter</code> via a package.</li>
  <li>Wire <code>httpBatchLink</code>, <code>splitLink</code>, <code>wsLink</code>, <code>loggerLink</code>.</li>
  <li>Add zod validation, middleware (auth, rate-limit), error mapping.</li>
  <li>Add a subscription endpoint with Redis pub/sub.</li>
  <li>Add SSR via <code>createCaller</code>.</li>
  <li>Practice the comparison: tRPC vs REST vs GraphQL — five sentences each.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read the tRPC v11 docs end to end."</li>
  <li>"Compare with ts-rest, Hono RPC, Effect HTTP for the lay of the land."</li>
  <li>"Build a sample with <code>trpc-openapi</code> + a Go client to feel the polyglot story."</li>
  <li>"Practice writing middleware that narrows context — it's the headline TS move."</li>
</ul>
`
    }
  ]
});
