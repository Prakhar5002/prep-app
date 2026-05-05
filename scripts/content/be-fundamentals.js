window.PREP_SITE.registerTopic({
  id: 'be-fundamentals',
  module: 'backend',
  title: 'Fundamentals',
  estimatedReadTime: '50 min',
  tags: ['backend', 'http', 'server', 'node', 'go', 'python', 'event-loop', 'thread-pool', 'middleware', 'request-response'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Backend fundamentals</strong> for a frontend / RN engineer means knowing enough to design, debug, and discuss server-side code without being a full-time backend engineer. The goal: pass the "system design" rounds, understand where latency comes from, write a small backend service when needed, and collaborate with backend teams in a language they recognize.</p>
<ul>
  <li><strong>Request lifecycle:</strong> connection → routing → middleware → handler → response. Every framework is a variation on this loop.</li>
  <li><strong>Two runtime models:</strong> <em>event-loop</em> (Node.js, Deno, async Python) — one thread, non-blocking I/O — and <em>thread-per-request</em> (Java, Go, Ruby) — concurrency via threads / goroutines.</li>
  <li><strong>HTTP is the protocol</strong>; understand verbs, status codes, headers, content negotiation. Cookies, auth headers, CORS, redirects all live here.</li>
  <li><strong>Frameworks:</strong> Express / Fastify / Hono / Koa (Node), Echo / Gin / Fiber (Go), FastAPI / Django (Python), Spring Boot (Java).</li>
  <li><strong>Connection management:</strong> connection pools (DB, HTTP); request timeouts; keep-alive; graceful shutdown.</li>
  <li><strong>Middleware pipeline:</strong> auth, logging, tracing, rate limiting, body parsing — applied per route or globally.</li>
  <li><strong>Error model:</strong> never throw raw stack traces to clients; map domain errors to HTTP codes; centralized error handler.</li>
  <li><strong>Where latency comes from:</strong> network (10-200ms), DB query (1-100ms), external API (100-1000ms), CPU work (variable). Understand the budget per layer.</li>
</ul>
<p><strong>Mantra:</strong> "Request in, response out. Middleware composes. Pool connections. Map errors deliberately. Know your runtime model."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What a backend service actually does</h3>
<p>At its core: receives HTTP requests, looks at them, possibly talks to other systems (DB, cache, queue, external APIs), and returns HTTP responses. That's it. Everything else — frameworks, ORMs, middleware, microservices — is variations on this loop.</p>

<h3>Why FE engineers should know this</h3>
<table>
  <thead><tr><th>Reason</th><th>Outcome</th></tr></thead>
  <tbody>
    <tr><td>System design rounds</td><td>FAANG senior loops always include backend-shape design</td></tr>
    <tr><td>Debugging across the stack</td><td>"Is this slow because frontend or backend?" → you can answer</td></tr>
    <tr><td>BFF (backend-for-frontend) pattern</td><td>FE often owns a thin backend layer; node + Express knowledge needed</td></tr>
    <tr><td>API design conversations</td><td>Better collaboration with backend teams when you speak the language</td></tr>
    <tr><td>Production triage</td><td>Trace logs, error messages, status codes mean things; you're closer to fixes</td></tr>
    <tr><td>Full-stack credibility</td><td>"Senior FE" sometimes implicitly means "could ship a backend if you had to"</td></tr>
  </tbody>
</table>

<h3>Why backend feels different from frontend</h3>
<table>
  <thead><tr><th>Frontend</th><th>Backend</th></tr></thead>
  <tbody>
    <tr><td>Single user, single device</td><td>Many users concurrently</td></tr>
    <tr><td>State lives in the user's browser</td><td>State lives in shared DBs / caches</td></tr>
    <tr><td>Crash = one user reloads</td><td>Crash = everyone affected; alerting fires</td></tr>
    <tr><td>Slow render = bad experience</td><td>Slow request = throughput drop</td></tr>
    <tr><td>Test in browser</td><td>Test in CI + staging + prod</td></tr>
    <tr><td>Memory leak inconvenience</td><td>Memory leak takes the whole service down</td></tr>
    <tr><td>Deploy = users see new code on next refresh</td><td>Deploy = blue/green / canary / rollback strategy</td></tr>
  </tbody>
</table>

<h3>What "good backend basics" look like</h3>
<ul>
  <li>Framework chosen for the runtime (Express/Fastify/Hono on Node; Echo/Gin on Go; FastAPI on Python).</li>
  <li>Middleware pipeline: auth → logging → tracing → rate limit → handler.</li>
  <li>Connection pools for DB + HTTP clients; never per-request connections.</li>
  <li>Request timeouts + per-handler deadlines; nothing runs forever.</li>
  <li>Graceful shutdown: stop accepting new connections, drain in-flight, exit cleanly.</li>
  <li>Errors mapped to HTTP codes; no raw stack traces leaked.</li>
  <li>Logs structured (JSON); per-request correlation ID flows through.</li>
  <li>Health check endpoint (<code>/health</code>) for load balancers.</li>
  <li>Config from env vars (12-factor); never hardcoded.</li>
</ul>

<h3>What "bad backend basics" look like</h3>
<ul>
  <li>One request opens its own DB connection; pool exhausted under load.</li>
  <li>Stack traces leak to clients; security + UX disaster.</li>
  <li>No timeouts; one slow upstream blocks the entire process.</li>
  <li>Logs as plain strings; impossible to grep / aggregate.</li>
  <li>Request-scoped state stored in module-level variables; race conditions.</li>
  <li>Synchronous file I/O on the event loop; blocks all requests.</li>
  <li>Unbounded queues; OOM under load.</li>
  <li>"500 Internal Server Error" for every failure; no diagnostic info.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The request lifecycle</h3>
<pre><code class="language-text">Client sends HTTP request
   ↓
Load balancer / reverse proxy
   ├─ TLS termination
   ├─ Rate limit / WAF
   └─ Health check awareness
   ↓
Application server (Node / Go / Python / Java)
   ├─ Connection handler (accept new TCP / reuse keep-alive)
   ├─ Parse HTTP (method, URL, headers, body)
   ├─ Route match (which handler?)
   ├─ Middleware chain (auth, logging, parsing)
   ├─ Handler (business logic)
   │     ├─ DB query (via connection pool)
   │     ├─ Cache lookup
   │     ├─ External API call
   │     └─ Compose response
   ├─ Response middleware (compression, headers)
   └─ Write response
   ↓
Connection close (or kept alive)
</code></pre>

<h3>The two runtime models</h3>
<table>
  <thead><tr><th></th><th>Event loop (Node, async Python, Deno, Bun)</th><th>Thread-per-request (Java, Go, Ruby Puma, .NET)</th></tr></thead>
  <tbody>
    <tr><td>Concurrency unit</td><td>Async tasks on one thread</td><td>OS threads / goroutines / fibers</td></tr>
    <tr><td>I/O</td><td>Non-blocking; libuv / uvloop callbacks</td><td>Blocking but each thread has its own stack</td></tr>
    <tr><td>CPU-bound work</td><td>Blocks the loop; need workers / processes</td><td>Multi-core natural; each thread runs independently</td></tr>
    <tr><td>Memory per request</td><td>~KB</td><td>~MB (thread stack) — Go goroutines are KB</td></tr>
    <tr><td>Best at</td><td>I/O-heavy: API gateways, BFF, real-time</td><td>CPU-heavy: image processing, ML, complex business logic</td></tr>
    <tr><td>Pitfall</td><td>One sync operation blocks everyone</td><td>Thread context-switch overhead at very high concurrency</td></tr>
  </tbody>
</table>

<p>Modern reality: event-loop runtimes for I/O work; threaded for CPU; Go (M:N scheduler) bridges both. Cloud functions (Lambda) are a third model: one request per execution.</p>

<h3>HTTP at a glance</h3>
<table>
  <thead><tr><th>Layer</th><th>Concerns</th></tr></thead>
  <tbody>
    <tr><td>TCP</td><td>Connection setup (3-way handshake), keep-alive, congestion</td></tr>
    <tr><td>TLS</td><td>Encryption + cert validation; usually terminated at LB</td></tr>
    <tr><td>HTTP/1.1</td><td>One request per connection (pipelining rarely used); keep-alive</td></tr>
    <tr><td>HTTP/2</td><td>Multiplexed streams over one connection; binary; HPACK header compression</td></tr>
    <tr><td>HTTP/3 (QUIC)</td><td>Over UDP; faster handshake; survives connection migration</td></tr>
  </tbody>
</table>

<h3>HTTP verbs (semantics matter)</h3>
<table>
  <thead><tr><th>Verb</th><th>Idempotent</th><th>Safe</th><th>Body</th></tr></thead>
  <tbody>
    <tr><td>GET</td><td>Yes</td><td>Yes</td><td>None</td></tr>
    <tr><td>HEAD</td><td>Yes</td><td>Yes</td><td>None</td></tr>
    <tr><td>POST</td><td>No</td><td>No</td><td>Yes</td></tr>
    <tr><td>PUT</td><td>Yes</td><td>No</td><td>Yes</td></tr>
    <tr><td>PATCH</td><td>Maybe</td><td>No</td><td>Yes</td></tr>
    <tr><td>DELETE</td><td>Yes</td><td>No</td><td>Optional</td></tr>
    <tr><td>OPTIONS</td><td>Yes</td><td>Yes</td><td>None</td></tr>
  </tbody>
</table>

<h3>Status codes</h3>
<table>
  <thead><tr><th>Range</th><th>Meaning</th></tr></thead>
  <tbody>
    <tr><td>1xx</td><td>Informational (rarely seen by app code)</td></tr>
    <tr><td>2xx</td><td>Success (200 OK, 201 Created, 204 No Content)</td></tr>
    <tr><td>3xx</td><td>Redirect (301 permanent, 302 temporary, 304 Not Modified)</td></tr>
    <tr><td>4xx</td><td>Client error (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable, 429 Too Many)</td></tr>
    <tr><td>5xx</td><td>Server error (500 Internal, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout)</td></tr>
  </tbody>
</table>

<h3>Middleware as composition</h3>
<p>Middleware = function that wraps the handler. Most frameworks expose a chain:</p>
<pre><code class="language-typescript">// Express / Fastify / Koa share this shape conceptually
app.use(requestLogger());
app.use(authenticate());
app.use(rateLimit({ rpm: 60 }));
app.use(parseJson());

app.get('/users/:id', getUserHandler);
app.post('/users', createUserHandler);

app.use(errorHandler()); // catches anything thrown above
</code></pre>

<p>Order matters: logging before auth (so you log unauthenticated attempts); rate limit before expensive work (so abusers can't burn CPU); error handler last.</p>

<h3>Connection pooling — the multiplier</h3>
<table>
  <thead><tr><th>Resource</th><th>Why pool</th></tr></thead>
  <tbody>
    <tr><td>DB connections</td><td>Postgres ~50 connections per server; opening = 5-50ms; reuse them</td></tr>
    <tr><td>HTTP clients</td><td>TCP handshake + TLS = ~100ms; reuse keep-alive</td></tr>
    <tr><td>Redis</td><td>Single connection per pool worker; node-redis client handles automatically</td></tr>
    <tr><td>S3 / external</td><td>Reuse the SDK client across requests; don't <code>new S3Client()</code> per request</td></tr>
  </tbody>
</table>

<h3>Timeouts everywhere</h3>
<table>
  <thead><tr><th>Layer</th><th>Reasonable timeout</th></tr></thead>
  <tbody>
    <tr><td>HTTP request from client</td><td>30s (LB level)</td></tr>
    <tr><td>DB query</td><td>3-10s; per-query budget</td></tr>
    <tr><td>External API call</td><td>3-5s; circuit-break beyond</td></tr>
    <tr><td>Internal microservice call</td><td>1-2s</td></tr>
    <tr><td>Cache lookup</td><td>50-200ms</td></tr>
    <tr><td>End-to-end request budget</td><td>1-3s for interactive UI</td></tr>
  </tbody>
</table>

<p>Without timeouts, one slow upstream cascades: client retries; queue fills; worker exhaustion; service unavailable.</p>

<h3>Where latency comes from</h3>
<pre><code class="language-text">Client request
  └─ DNS lookup           (~10-100ms first time, cached after)
  └─ TCP handshake        (~10-50ms)
  └─ TLS handshake        (~30-100ms; resumed sessions ~10ms)
  └─ Request transit      (~10-100ms cross-region)
  └─ Server processing
       ├─ Auth check       (~1-5ms)
       ├─ DB query         (~1-100ms; depends on indexes)
       ├─ Cache lookup     (~1-5ms)
       ├─ External API     (~50-500ms)
       └─ Response build   (~1-5ms)
  └─ Response transit     (~10-100ms)
  └─ Render               (frontend)
</code></pre>

<p>For p50 sub-200ms server time: cache hits on hot reads; DB queries indexed; no synchronous external calls; minimal serialization.</p>

<h3>Graceful shutdown</h3>
<ol>
  <li>Receive SIGTERM (deploy / scale down).</li>
  <li>Stop accepting new connections (close listener).</li>
  <li>Drain in-flight requests (wait for them to complete, with timeout).</li>
  <li>Close DB / Redis pools.</li>
  <li>Exit.</li>
</ol>
<p>Without graceful shutdown: in-flight requests cut mid-way; partial DB writes; user sees errors.</p>

<h3>Health checks</h3>
<ul>
  <li><code>/health</code> or <code>/healthz</code> — for load balancers; should return 200 quickly.</li>
  <li><code>/ready</code> (readiness) vs <code>/live</code> (liveness):
    <ul>
      <li>Liveness: is the process alive? Restart if not.</li>
      <li>Readiness: can it serve traffic? Take out of LB rotation if not (e.g., DB down).</li>
    </ul>
  </li>
  <li>Don't bury heavy work in /health; LBs poll it every few seconds.</li>
</ul>

<h3>Configuration via env vars (12-factor)</h3>
<ul>
  <li>Code is identical across environments; behavior comes from config.</li>
  <li><code>DATABASE_URL</code>, <code>REDIS_URL</code>, <code>API_KEY</code> all from env.</li>
  <li>Local: <code>.env</code> file (never committed).</li>
  <li>Prod: secret manager (AWS Secrets Manager, GCP Secret Manager, Vault).</li>
</ul>

<h3>Logging structure</h3>
<pre><code class="language-typescript">// Bad — unstructured
console.log(\`User \${userId} did \${action}\`);

// Good — structured (JSON)
logger.info({
  msg: 'user_action',
  userId,
  action,
  timestamp: Date.now(),
  requestId: ctx.requestId,
});
</code></pre>
<p>Aggregators (Datadog, Splunk, ELK) parse JSON natively. Strings need regex.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Minimal Express server</h3>
<pre><code class="language-typescript">import express from 'express';
import pino from 'pino';

const app = express();
const logger = pino();

// Middleware (order matters)
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) =&gt; {
  req.id = crypto.randomUUID();
  req.log = logger.child({ requestId: req.id });
  req.log.info({ method: req.method, url: req.url, ip: req.ip }, 'request_start');
  res.on('finish', () =&gt; {
    req.log.info({ status: res.statusCode }, 'request_end');
  });
  next();
});

// Health check
app.get('/health', (_req, res) =&gt; res.json({ ok: true }));

// Routes
app.get('/users/:id', async (req, res, next) =&gt; {
  try {
    const user = await db.users.byId(req.params.id);
    if (!user) return res.status(404).json({ error: 'not_found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Error handler
app.use((err, req, res, _next) =&gt; {
  req.log.error({ err }, 'unhandled_error');
  res.status(500).json({ error: 'internal_server_error' });
});

const server = app.listen(3000, () =&gt; logger.info('listening on 3000'));

// Graceful shutdown
process.on('SIGTERM', async () =&gt; {
  logger.info('shutdown_starting');
  server.close(async () =&gt; {
    await db.close();
    process.exit(0);
  });
  setTimeout(() =&gt; { logger.warn('forced_shutdown'); process.exit(1); }, 30_000);
});
</code></pre>

<h3>Fastify — same shape, faster</h3>
<pre><code class="language-typescript">import Fastify from 'fastify';

const app = Fastify({
  logger: { level: 'info' },
  genReqId: () =&gt; crypto.randomUUID(),
});

app.addHook('onRequest', async (req) =&gt; {
  req.log.info({ method: req.method, url: req.url }, 'request_start');
});

app.get('/users/:id', {
  schema: {
    params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    response: {
      200: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
  },
  handler: async (req, reply) =&gt; {
    const user = await db.users.byId(req.params.id);
    if (!user) return reply.code(404).send({ error: 'not_found' });
    return user;
  },
});

await app.listen({ port: 3000 });
</code></pre>

<p>Fastify is ~2-3× faster than Express, has built-in schema validation + JSON Schema response serialization (skips JSON.stringify for known shapes).</p>

<h3>Hono — modern; runs everywhere</h3>
<pre><code class="language-typescript">import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('*', logger());
app.use('/api/*', cors());

app.get('/health', (c) =&gt; c.json({ ok: true }));

app.get('/users/:id', async (c) =&gt; {
  const id = c.req.param('id');
  const user = await db.users.byId(id);
  if (!user) return c.json({ error: 'not_found' }, 404);
  return c.json(user);
});

export default app; // works on Node, Bun, Deno, Cloudflare Workers
</code></pre>

<p>Hono is the modern choice for edge runtimes (Cloudflare Workers, Deno Deploy) — same code runs on Node + serverless + edge.</p>

<h3>Go server (for comparison)</h3>
<pre><code class="language-go">package main

import (
    "encoding/json"
    "log"
    "net/http"
    "github.com/go-chi/chi/v5"
)

func main() {
    r := chi.NewRouter()
    r.Use(requestLogger)

    r.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
        json.NewEncoder(w).Encode(map[string]bool{"ok": true})
    })

    r.Get("/users/{id}", func(w http.ResponseWriter, r *http.Request) {
        id := chi.URLParam(r, "id")
        user, err := db.UserByID(r.Context(), id)
        if err != nil { http.Error(w, "internal", 500); return }
        if user == nil { http.Error(w, "not found", 404); return }
        json.NewEncoder(w).Encode(user)
    })

    log.Fatal(http.ListenAndServe(":3000", r))
}
</code></pre>

<p>Each request gets its own goroutine; no event-loop blocking concerns; std lib is enough for production.</p>

<h3>Connection pool — pg example</h3>
<pre><code class="language-typescript">import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // max connections
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// Reuse the pool; never new Pool() per request
async function getUser(id: string) {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
}

// On shutdown
async function close() {
  await pool.end();
}
</code></pre>

<h3>HTTP client with keep-alive</h3>
<pre><code class="language-typescript">import { Agent } from 'node:https';

const agent = new Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 50,
  timeout: 5000,
});

async function callExternal() {
  const res = await fetch('https://api.example.com/data', {
    // @ts-expect-error — node fetch supports custom agent via dispatcher
    agent,
    signal: AbortSignal.timeout(3000),
  });
  return res.json();
}
</code></pre>

<h3>Per-request timeout via AbortSignal</h3>
<pre><code class="language-typescript">app.get('/heavy', async (req, res, next) =&gt; {
  const controller = new AbortController();
  const timeout = setTimeout(() =&gt; controller.abort(), 3000);
  req.on('close', () =&gt; controller.abort()); // client disconnected

  try {
    const data = await fetchExternal({ signal: controller.signal });
    res.json(data);
  } catch (err) {
    if (err.name === 'AbortError') return res.status(504).json({ error: 'timeout' });
    next(err);
  } finally {
    clearTimeout(timeout);
  }
});
</code></pre>

<h3>Auth middleware</h3>
<pre><code class="language-typescript">import jwt from 'jsonwebtoken';

function authenticate(req, res, next) {
  const authz = req.header('authorization');
  if (!authz?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'missing_token' });
  }
  try {
    const token = authz.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid_token' });
  }
}

// Apply to protected routes
app.get('/me', authenticate, (req, res) =&gt; {
  res.json({ id: req.user.sub });
});
</code></pre>

<h3>Centralized error handler</h3>
<pre><code class="language-typescript">class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

app.get('/users/:id', async (req, res, next) =&gt; {
  const user = await db.users.byId(req.params.id);
  if (!user) throw new HttpError(404, 'user_not_found', 'No user with that ID');
  res.json(user);
});

app.use((err, req, res, _next) =&gt; {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.code, message: err.message });
  }
  req.log.error({ err }, 'unhandled');
  res.status(500).json({ error: 'internal_server_error' });
});
</code></pre>

<h3>Body parsing limits</h3>
<pre><code class="language-typescript">app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
</code></pre>

<p>Without limits, an attacker can send a 100MB body and exhaust memory.</p>

<h3>Rate limiting at the gateway / app</h3>
<pre><code class="language-typescript">import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

const limiter = rateLimit({
  store: new RedisStore({ sendCommand: (...args) =&gt; redis.sendCommand(args) }),
  windowMs: 60 * 1000,
  max: 100, // 100 requests per minute per key
  keyGenerator: (req) =&gt; req.user?.id ?? req.ip,
  handler: (req, res) =&gt; {
    res.status(429).set('Retry-After', '60').json({ error: 'rate_limited' });
  },
});

app.use('/api/', limiter);
</code></pre>

<h3>CORS</h3>
<pre><code class="language-typescript">import cors from 'cors';

app.use(cors({
  origin: ['https://app.example.com', 'https://admin.example.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
</code></pre>

<h3>Compression</h3>
<pre><code class="language-typescript">import compression from 'compression';
app.use(compression({ threshold: 1024 })); // only compress &gt; 1KB
</code></pre>

<h3>Server-side rendering note</h3>
<p>Next.js / Remix / SvelteKit run a Node server (or edge runtime) under the hood. Same patterns apply: connection pools, timeouts, error handling. The "BFF" (backend-for-frontend) is often just an SSR framework with API routes.</p>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: REST API with auth + DB</h3>
<pre><code class="language-typescript">import express from 'express';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import pino from 'pino';

const app = express();
const logger = pino();
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 20 });

// Request ID + structured logging
app.use((req, res, next) =&gt; {
  req.id = crypto.randomUUID();
  req.log = logger.child({ requestId: req.id });
  next();
});

app.use(express.json({ limit: '1mb' }));

// Auth middleware
async function requireAuth(req, res, next) {
  const token = req.header('authorization')?.slice(7);
  if (!token) return res.status(401).json({ error: 'missing_token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'invalid_token' });
  }
}

// Public
app.post('/login', async (req, res) =&gt; {
  const { email, password } = req.body;
  const result = await pool.query('SELECT id, password_hash FROM users WHERE email = $1', [email]);
  const user = result.rows[0];
  if (!user || !await verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
});

// Protected
app.get('/me', requireAuth, async (req, res) =&gt; {
  const result = await pool.query('SELECT id, email, name FROM users WHERE id = $1', [req.user.sub]);
  if (!result.rows[0]) return res.status(404).json({ error: 'not_found' });
  res.json(result.rows[0]);
});

// Error handler
app.use((err, req, res, _next) =&gt; {
  req.log.error({ err }, 'unhandled');
  res.status(500).json({ error: 'internal_server_error' });
});

app.listen(3000);
</code></pre>

<h3>Example 2: BFF pattern (frontend's own thin backend)</h3>
<pre><code class="language-typescript">// apps/bff/server.ts — sits between mobile/web and microservices
import { Hono } from 'hono';
import { authMiddleware } from './middleware/auth';

const app = new Hono();

app.use('*', authMiddleware);

// Composes data from 3 microservices into the shape the screen needs
app.get('/screens/profile/:userId', async (c) =&gt; {
  const userId = c.req.param('userId');
  const [user, posts, stats] = await Promise.all([
    fetchUserService(userId),
    fetchPostsService(userId, { first: 10 }),
    fetchStatsService(userId),
  ]);

  return c.json({
    user,
    recentPosts: posts.edges.map((e) =&gt; e.node),
    followerCount: stats.followers,
    postCount: stats.posts,
  });
});

export default app;
</code></pre>

<h3>Example 3: Graceful shutdown handling in-flight requests</h3>
<pre><code class="language-typescript">const server = app.listen(3000);

let shuttingDown = false;
const inFlightRequests = new Set();

app.use((req, res, next) =&gt; {
  if (shuttingDown) {
    return res.status(503).set('Connection', 'close').json({ error: 'shutting_down' });
  }
  inFlightRequests.add(req);
  res.on('finish', () =&gt; inFlightRequests.delete(req));
  res.on('close', () =&gt; inFlightRequests.delete(req));
  next();
});

async function shutdown() {
  shuttingDown = true;
  logger.info('shutdown_starting');

  // Stop accepting new
  server.close();

  // Wait for in-flight to drain (max 30s)
  const start = Date.now();
  while (inFlightRequests.size &gt; 0 &amp;&amp; Date.now() - start &lt; 30_000) {
    logger.info({ remaining: inFlightRequests.size }, 'draining');
    await new Promise((r) =&gt; setTimeout(r, 500));
  }

  // Close pools
  await pool.end();
  await redis.quit();

  logger.info('shutdown_complete');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
</code></pre>

<h3>Example 4: External API call with timeout + retry</h3>
<pre><code class="language-typescript">async function callWithRetry&lt;T&gt;(
  fn: (signal: AbortSignal) =&gt; Promise&lt;T&gt;,
  { timeoutMs = 3000, maxAttempts = 3 } = {}
): Promise&lt;T&gt; {
  let lastErr: unknown;
  for (let i = 0; i &lt; maxAttempts; i++) {
    const ac = new AbortController();
    const t = setTimeout(() =&gt; ac.abort(), timeoutMs);
    try {
      return await fn(ac.signal);
    } catch (err: any) {
      lastErr = err;
      if (err.status &amp;&amp; err.status &lt; 500) throw err; // 4xx don't retry
      const backoff = Math.min(2 ** i * 200, 2000) + Math.random() * 200;
      await new Promise((r) =&gt; setTimeout(r, backoff));
    } finally {
      clearTimeout(t);
    }
  }
  throw lastErr;
}

// Use it
const data = await callWithRetry((signal) =&gt;
  fetch('https://api.example.com/data', { signal }).then((r) =&gt; r.json())
);
</code></pre>

<h3>Example 5: File upload streaming (don't buffer)</h3>
<pre><code class="language-typescript">import busboy from 'busboy';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';

app.post('/upload', (req, res) =&gt; {
  const bb = busboy({ headers: req.headers, limits: { fileSize: 50 * 1024 * 1024 } });

  bb.on('file', async (name, file, info) =&gt; {
    const path = \`/tmp/\${crypto.randomUUID()}-\${info.filename}\`;
    await pipeline(file, createWriteStream(path));
    res.json({ path });
  });

  bb.on('error', (err) =&gt; {
    req.log.error({ err }, 'upload_failed');
    res.status(500).json({ error: 'upload_failed' });
  });

  req.pipe(bb);
});
</code></pre>

<h3>Example 6: Health + readiness</h3>
<pre><code class="language-typescript">// Liveness — is the process alive?
app.get('/live', (_req, res) =&gt; res.status(200).json({ alive: true }));

// Readiness — can we serve traffic?
app.get('/ready', async (_req, res) =&gt; {
  try {
    await pool.query('SELECT 1');
    await redis.ping();
    res.json({ ready: true });
  } catch (err) {
    res.status(503).json({ ready: false, error: String(err) });
  }
});
</code></pre>

<h3>Example 7: Per-request DB transaction</h3>
<pre><code class="language-typescript">async function withTransaction&lt;T&gt;(fn: (client: PoolClient) =&gt; Promise&lt;T&gt;): Promise&lt;T&gt; {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

app.post('/orders', requireAuth, async (req, res) =&gt; {
  const order = await withTransaction(async (tx) =&gt; {
    const result = await tx.query(
      'INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING *',
      [req.user.sub, req.body.total]
    );
    await tx.query(
      'INSERT INTO order_items (order_id, sku, qty) SELECT $1, sku, qty FROM unnest($2::jsonb[]) AS t(sku, qty)',
      [result.rows[0].id, req.body.items]
    );
    return result.rows[0];
  });
  res.status(201).json(order);
});
</code></pre>

<h3>Example 8: Per-route schema validation (zod)</h3>
<pre><code class="language-typescript">import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(80),
  password: z.string().min(12),
});

function validate&lt;T extends z.ZodTypeAny&gt;(schema: T) {
  return (req, res, next) =&gt; {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(422).json({ error: 'validation_failed', details: result.error.flatten() });
    }
    req.body = result.data; // typed, sanitized
    next();
  };
}

app.post('/users', validate(CreateUserSchema), async (req, res) =&gt; {
  // req.body is fully typed
  const user = await createUser(req.body);
  res.status(201).json(user);
});
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>Event-loop blocking (Node)</h3>
<ul>
  <li>Sync operations block all requests until done.</li>
  <li>Common offenders: <code>readFileSync</code>, <code>JSON.parse</code> on huge strings, regex with catastrophic backtracking, sync crypto.</li>
  <li>Use async APIs (<code>fs.promises</code>); offload CPU work to worker_threads.</li>
  <li>Detect with <code>blocked-at</code> npm package or APM tools.</li>
</ul>

<h3>Connection pool exhaustion</h3>
<ul>
  <li>20 DB connections; 100 concurrent requests; 80 wait for a connection; latency spikes.</li>
  <li>Fix: increase pool size (within DB max); reduce per-request DB time; add caching layer.</li>
  <li>Symptom: P99 spikes under load while P50 stable.</li>
</ul>

<h3>Memory leaks</h3>
<ul>
  <li>Module-level Map / Set that only grows. Common: caching without eviction, error-tracking without trimming.</li>
  <li>Long-lived event listeners attached per-request without cleanup.</li>
  <li>Closures capturing big objects.</li>
  <li>Detect with <code>--inspect</code> + Chrome DevTools heap snapshot; or APM tools.</li>
</ul>

<h3>Slow upstream cascade</h3>
<ul>
  <li>External API takes 30s instead of 200ms; your handlers wait; queue fills; service unavailable.</li>
  <li>Fix: per-call timeout (3s), circuit breaker after N failures, fallback (cached / default response).</li>
</ul>

<h3>Request body size attacks</h3>
<ul>
  <li>Without <code>limit</code>, 100MB JSON body fills memory.</li>
  <li>Fix: explicit <code>limit</code> on body parser; pre-validate <code>Content-Length</code> at LB.</li>
</ul>

<h3>Slow loris / connection exhaustion</h3>
<ul>
  <li>Attacker opens 1000 TCP connections; sends 1 byte per minute; keeps your sockets occupied.</li>
  <li>Fix: connection idle timeouts; LB-level connection limits; tools like nginx with <code>limit_conn</code>.</li>
</ul>

<h3>Timeout cascade</h3>
<ul>
  <li>Service A → B → C all with 30s timeouts. C fails at 30s; B's timer fires too late; A's already gone.</li>
  <li>Budget propagation: parent gives child a deadline shorter than its own remaining budget.</li>
  <li>Common: gRPC <code>Deadline</code> propagation; HTTP <code>X-Request-Deadline</code> header.</li>
</ul>

<h3>Thundering herd on cache miss</h3>
<ul>
  <li>Cache expires; 1000 requests hit DB at once.</li>
  <li>Fix: stale-while-revalidate; single-flight (only one fetcher, others wait); sharded TTL with jitter.</li>
</ul>

<h3>Race conditions on concurrent updates</h3>
<ul>
  <li>Two requests read counter = 5; both write 6; should be 7.</li>
  <li>Fix: DB transaction with row lock; <code>UPDATE ... SET counter = counter + 1</code>; optimistic concurrency (version column).</li>
</ul>

<h3>Unbounded queues</h3>
<ul>
  <li>Internal queue fills; OOM.</li>
  <li>Fix: bounded queue with rejection policy; backpressure to upstream; load shedding (return 503).</li>
</ul>

<h3>Unhandled promise rejections</h3>
<ul>
  <li>Async function throws; nothing awaits it; Node crashes (newer versions) or silently logs (older).</li>
  <li>Fix: always await or attach <code>.catch</code>; <code>process.on('unhandledRejection', ...)</code> handler logs + maybe exits.</li>
</ul>

<h3>Async middleware error swallowing</h3>
<pre><code class="language-typescript">// BAD — Express &lt; 5 doesn't catch async errors automatically
app.get('/foo', async (req, res) =&gt; {
  await mayThrow(); // if this throws, it's an unhandledRejection
});

// GOOD — wrap or use Express 5+ / Fastify (which handle async natively)
app.get('/foo', async (req, res, next) =&gt; {
  try {
    await mayThrow();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
</code></pre>

<h3>HTTP/2 + TLS termination</h3>
<ul>
  <li>HTTP/2 between LB and client; HTTP/1.1 between LB and your service is fine.</li>
  <li>If you do HTTP/2 directly to your service: gRPC, server-push, multiplexed streams.</li>
  <li>Most cloud LBs (ALB, GCP LB) handle HTTP/2 termination.</li>
</ul>

<h3>Cold start (serverless)</h3>
<ul>
  <li>First request after deploy / scale-up: 100-3000ms longer than warm.</li>
  <li>Fix: provisioned concurrency (Lambda); keep-warm pings; smaller bundles; init-time work minimized.</li>
</ul>

<h3>Time zones + clock</h3>
<ul>
  <li>Server time often UTC; user time may not be.</li>
  <li>Always store UTC; convert at presentation layer.</li>
  <li>Server clock drift: NTP keeps within ms; for high-precision (financial), use clock-skew-aware libraries.</li>
</ul>

<h3>Idempotency</h3>
<ul>
  <li>Network may deliver same POST twice (retry on timeout); without idempotency keys, duplicate orders / charges.</li>
  <li>Fix: <code>Idempotency-Key</code> header; server stores key → result for some TTL; replay returns stored result.</li>
</ul>

<h3>Mobile-network gotchas</h3>
<ul>
  <li>Mobile clients flap; long-polling drops mid-response; WebSocket reconnects.</li>
  <li>Design API to be retry-friendly (idempotency).</li>
  <li>Compress responses; mobile networks have bandwidth + latency.</li>
  <li>Validate <code>Content-Length</code>; mobile may misreport.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common backend basics mistakes</h3>
<ol>
  <li><strong>One DB connection per request.</strong> Pool exhaustion under load.</li>
  <li><strong>Stack traces leaked to clients.</strong> Security risk + bad UX.</li>
  <li><strong>No timeouts on external calls.</strong> One slow upstream blocks the process.</li>
  <li><strong>Sync I/O on the event loop.</strong> Blocks every other request.</li>
  <li><strong>Module-level mutable state shared across requests.</strong> Race conditions.</li>
  <li><strong>Unbounded body sizes.</strong> Memory exhaustion attack.</li>
  <li><strong>String logging instead of structured.</strong> Impossible to aggregate.</li>
  <li><strong>No graceful shutdown.</strong> In-flight requests cut mid-way; partial DB writes.</li>
  <li><strong>Hardcoded config.</strong> Can't change behavior across environments.</li>
  <li><strong>500 for everything.</strong> No diagnostic info; auth errors look like bugs.</li>
  <li><strong>Synchronous CPU work in handler.</strong> Blocks event loop.</li>
  <li><strong>No request ID.</strong> Distributed tracing impossible; debugging nightmare.</li>
</ol>

<h3>Anti-pattern: connection per request</h3>
<pre><code class="language-typescript">// BAD — opens new connection every time
app.get('/users/:id', async (req, res) =&gt; {
  const client = new Pool({ connectionString: DATABASE_URL });
  const result = await client.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  await client.end();
  res.json(result.rows[0]);
});

// GOOD — single shared pool
const pool = new Pool({ connectionString: DATABASE_URL, max: 20 });
app.get('/users/:id', async (req, res) =&gt; {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  res.json(result.rows[0]);
});
</code></pre>

<h3>Anti-pattern: stack trace exposure</h3>
<pre><code class="language-typescript">// BAD
app.use((err, req, res, _next) =&gt; {
  res.status(500).json({ error: err.stack }); // leaks file paths, secrets
});

// GOOD
app.use((err, req, res, _next) =&gt; {
  req.log.error({ err }, 'unhandled');
  res.status(500).json({ error: 'internal_server_error', requestId: req.id });
});
</code></pre>

<h3>Anti-pattern: no timeout on fetch</h3>
<pre><code class="language-typescript">// BAD — waits forever if upstream stalls
const data = await fetch('https://slow-api.example.com').then(r =&gt; r.json());

// GOOD — abort on timeout
const data = await fetch('https://slow-api.example.com', {
  signal: AbortSignal.timeout(3000),
}).then(r =&gt; r.json());
</code></pre>

<h3>Anti-pattern: sync I/O in handler</h3>
<pre><code class="language-typescript">// BAD — blocks event loop
import { readFileSync } from 'fs';
app.get('/config', (_req, res) =&gt; {
  const config = JSON.parse(readFileSync('./config.json', 'utf-8'));
  res.json(config);
});

// GOOD — async; or read once at startup
import { readFile } from 'fs/promises';
const config = JSON.parse(await readFile('./config.json', 'utf-8')); // at startup
app.get('/config', (_req, res) =&gt; res.json(config));
</code></pre>

<h3>Anti-pattern: shared mutable state</h3>
<pre><code class="language-typescript">// BAD — module-level cache; no eviction; grows forever
const cache = {};
app.get('/items/:id', (req, res) =&gt; {
  if (!cache[req.params.id]) cache[req.params.id] = expensive(req.params.id);
  res.json(cache[req.params.id]);
});

// GOOD — bounded LRU + eviction
import LRU from 'lru-cache';
const cache = new LRU({ max: 10_000, ttl: 60_000 });
app.get('/items/:id', (req, res) =&gt; {
  let value = cache.get(req.params.id);
  if (!value) {
    value = expensive(req.params.id);
    cache.set(req.params.id, value);
  }
  res.json(value);
});
</code></pre>

<h3>Anti-pattern: unbounded body</h3>
<pre><code class="language-typescript">// BAD
app.use(express.json()); // default = 100kb but easy to override carelessly

// GOOD — explicit, conservative
app.use(express.json({ limit: '1mb' }));
app.use('/api/upload', express.json({ limit: '50mb' })); // wider limit only where needed
</code></pre>

<h3>Anti-pattern: string logs</h3>
<pre><code class="language-typescript">// BAD — strings; hard to query
console.log(\`User \${userId} placed order \${orderId} for $\${amount}\`);

// GOOD — JSON; queryable
logger.info({ userId, orderId, amount, action: 'order_placed' });
</code></pre>

<h3>Anti-pattern: no graceful shutdown</h3>
<pre><code class="language-typescript">// BAD — no shutdown; SIGTERM kills mid-request
app.listen(3000);

// GOOD — drain on SIGTERM
const server = app.listen(3000);
process.on('SIGTERM', () =&gt; {
  server.close(async () =&gt; {
    await pool.end();
    process.exit(0);
  });
});
</code></pre>

<h3>Anti-pattern: hardcoded config</h3>
<pre><code class="language-typescript">// BAD
const DB_URL = 'postgres://localhost:5432/myapp';
const REDIS_URL = 'redis://localhost:6379';

// GOOD
import { z } from 'zod';
const env = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
}).parse(process.env);

const DB_URL = env.DATABASE_URL;
</code></pre>

<h3>Anti-pattern: 500 for everything</h3>
<pre><code class="language-typescript">// BAD
app.get('/users/:id', async (req, res) =&gt; {
  try {
    const user = await getUser(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GOOD — typed errors mapped to status codes
class NotFoundError extends Error { constructor(public resource: string) { super(); } }
class ValidationError extends Error { constructor(public details: object) { super(); } }

app.get('/users/:id', async (req, res, next) =&gt; {
  try {
    const user = await getUser(req.params.id);
    if (!user) throw new NotFoundError('user');
    res.json(user);
  } catch (err) { next(err); }
});

app.use((err, req, res, _next) =&gt; {
  if (err instanceof NotFoundError) return res.status(404).json({ error: \`\${err.resource}_not_found\` });
  if (err instanceof ValidationError) return res.status(422).json({ error: 'validation_failed', details: err.details });
  req.log.error({ err }, 'unhandled');
  res.status(500).json({ error: 'internal_server_error' });
});
</code></pre>

<h3>Anti-pattern: CPU work in event loop</h3>
<pre><code class="language-typescript">// BAD — 200ms image resize blocks all other requests
app.post('/resize', async (req, res) =&gt; {
  const resized = sharp(req.body.image).resize(800).toBuffer(); // sync; blocks
  res.send(resized);
});

// GOOD — worker thread / queue
import { Worker } from 'node:worker_threads';
// or push to a queue (BullMQ) and async-respond
</code></pre>

<h3>Anti-pattern: no request ID</h3>
<pre><code class="language-typescript">// BAD — error logs untraceable
app.use((req, _res, next) =&gt; {
  req.log = logger;
  next();
});

// GOOD — every request gets an ID; flows to logs + downstream services
app.use((req, _res, next) =&gt; {
  req.id = req.header('x-request-id') ?? crypto.randomUUID();
  req.log = logger.child({ requestId: req.id });
  next();
});

// Pass to downstream
async function callDownstream(req) {
  return fetch(url, { headers: { 'x-request-id': req.id } });
}
</code></pre>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common backend-fundamentals interview prompts</h3>
<ol>
  <li>Walk through what happens when a client makes a request to your server.</li>
  <li>Compare event-loop vs thread-per-request models.</li>
  <li>How do you handle timeouts + cascading failures?</li>
  <li>How do you implement graceful shutdown?</li>
  <li>How would you build a BFF for a mobile app?</li>
  <li>How do you debug a slow endpoint?</li>
  <li>What's wrong with this code? (one of the anti-patterns)</li>
  <li>Tell me about a time you debugged a production backend issue.</li>
</ol>

<h3>The 5-step framework for "design an HTTP service"</h3>
<ol>
  <li><strong>Pick the runtime + framework</strong> based on workload (I/O-heavy → Node/Bun + Fastify/Hono; CPU-heavy → Go/Java; event-driven → Lambda).</li>
  <li><strong>Define routes + handlers</strong> with explicit verbs + status codes.</li>
  <li><strong>Wire middleware</strong>: request-id → logging → auth → rate-limit → body-parser.</li>
  <li><strong>Connection management</strong>: pools for DB / HTTP; per-call timeouts; graceful shutdown.</li>
  <li><strong>Error model</strong>: typed errors mapped to status codes; centralized handler; structured logs.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"Event-loop runtime (Node / Bun) for I/O-heavy services — API gateways, BFFs. Threaded (Go, Java) when CPU-bound work matters."</em></li>
  <li><em>"Connection pool for DB + HTTP clients — opening a connection is 5-50ms; reuse keep-alive."</em></li>
  <li><em>"Per-call timeouts everywhere — without them one slow upstream blocks the whole process. Budget propagation: parent gives child shorter deadline than its own remaining."</em></li>
  <li><em>"Graceful shutdown: stop accepting new, drain in-flight, close pools, exit. Without it, deploys cut requests mid-way."</em></li>
  <li><em>"Structured logs (JSON) with per-request correlation ID flowing through to downstream services. Aggregators parse natively."</em></li>
  <li><em>"Typed errors (NotFoundError, ValidationError) mapped to status codes in a centralized handler. 500 for everything is a debugging nightmare."</em></li>
  <li><em>"Body size limits on every parser — without them, 100MB body exhausts memory."</em></li>
  <li><em>"Liveness vs readiness: liveness restarts a dead process; readiness takes out-of-rotation when temporarily unable to serve."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"BFF for mobile"</td><td>Hono / Fastify; compose data from microservices; per-screen endpoints</td></tr>
    <tr><td>"slow endpoint"</td><td>Profile: DB query? External call? Serialization? Add tracing.</td></tr>
    <tr><td>"prevent abuse"</td><td>Rate limit per user / IP at gateway; LB-level connection limits</td></tr>
    <tr><td>"upstream cascade"</td><td>Per-call timeout + circuit breaker + fallback</td></tr>
    <tr><td>"retry safety"</td><td>Idempotency keys; server dedupes</td></tr>
    <tr><td>"file upload"</td><td>Stream to disk / S3; never buffer; size limit</td></tr>
    <tr><td>"long-running task"</td><td>202 Accepted + queue + status endpoint</td></tr>
    <tr><td>"deploy without downtime"</td><td>Graceful shutdown + LB removes from rotation pre-shutdown</td></tr>
    <tr><td>"trace a request"</td><td>Request ID flowing through logs + downstream calls</td></tr>
  </tbody>
</table>

<h3>Demo script</h3>
<ol>
  <li>Sketch the request flow (LB → app → DB / cache / external).</li>
  <li>Show middleware chain (request-id → auth → rate-limit → handler → error handler).</li>
  <li>Show one handler with structured error.</li>
  <li>Show graceful shutdown.</li>
  <li>Talk timeouts + retries + circuit breaker.</li>
  <li>Address logging + tracing + health checks.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"OpenTelemetry for distributed tracing across services."</em></li>
  <li><em>"Circuit breakers (opossum / Polly) on every external call."</em></li>
  <li><em>"Request-budget propagation via deadline header."</em></li>
  <li><em>"Schema validation at every public boundary (zod)."</em></li>
  <li><em>"Worker threads for CPU-heavy work in Node."</em></li>
  <li><em>"Bounded queues with backpressure / load shedding."</em></li>
  <li><em>"Production runbook: alerts, dashboards, on-call playbook."</em></li>
  <li><em>"Slow query log + APM (Datadog / New Relic) integration."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Runtime model awareness</td><td>Names event-loop vs threaded tradeoffs</td></tr>
    <tr><td>Pool discipline</td><td>Reaches for connection pools without prompting</td></tr>
    <tr><td>Timeout discipline</td><td>Per-call timeouts; budget propagation</td></tr>
    <tr><td>Error mapping</td><td>Typed errors → status codes; not 500 for everything</td></tr>
    <tr><td>Logging discipline</td><td>Structured + correlation ID</td></tr>
    <tr><td>Graceful shutdown</td><td>Names the SIGTERM → drain → exit flow</td></tr>
    <tr><td>Health check awareness</td><td>Liveness vs readiness distinction</td></tr>
    <tr><td>Restraint</td><td>Doesn't over-engineer for hypothetical scale</td></tr>
    <tr><td>Real war stories</td><td>Specific debugging anecdotes</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN apps often need their own BFF — composes microservice data into per-screen shapes; reduces client round trips.</li>
  <li>Hono / Fastify on Cloudflare Workers / Vercel Edge — low-latency global BFF for RN apps.</li>
  <li>Mobile networks flap; design BFF to be retry-safe (idempotency keys).</li>
  <li>Compress responses; mobile bandwidth matters.</li>
  <li>Long-running mobile actions (uploads): use queue + 202 + status polling, not blocking HTTP.</li>
  <li>Per-device rate limits + per-user limits combined; cellular NAT means many users share IPs.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"Why does Node use an event loop?"</em> — V8 is single-threaded for JS execution; event loop + libuv handle async I/O without thread overhead. Tradeoff: I/O-heavy efficient, CPU-bound is a problem.</li>
  <li><em>"How do you debug a slow endpoint?"</em> — APM / OpenTelemetry traces; identify the slow span (DB? external? CPU?); profile that layer; add caching, indexing, or async-ify.</li>
  <li><em>"What happens during graceful shutdown?"</em> — SIGTERM → stop accepting new connections → drain in-flight (with timeout) → close pools → exit 0. LB takes the instance out of rotation before sending SIGTERM.</li>
  <li><em>"How do you propagate timeouts?"</em> — Parent service has 10s budget; calls child with 8s deadline (leaving margin for response transit). Child propagates to its own children. Prevents cascade failures.</li>
  <li><em>"How do you handle a thundering herd on cache miss?"</em> — Single-flight (only one fetcher; others wait); stale-while-revalidate; jittered TTL on cache entries.</li>
  <li><em>"When would you choose Go over Node?"</em> — CPU-bound work; need true parallelism without complexity; large memory footprint per request unacceptable; team has Go expertise.</li>
  <li><em>"How do you make the same code run on Node + Cloudflare Workers + Lambda?"</em> — Hono / Hattip / WinterCG-compatible code; only use platform-agnostic Web APIs; avoid Node-only modules.</li>
  <li><em>"What's the difference between liveness and readiness probes?"</em> — Liveness: "is the process alive?" — restart if not. Readiness: "can it serve traffic?" — pull out of LB rotation but don't restart (e.g., DB is temporarily down).</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Build a small REST API end-to-end with Express or Fastify: auth + DB + middleware + graceful shutdown.</li>
  <li>Add structured logging with pino + per-request ID.</li>
  <li>Wire OpenTelemetry tracing.</li>
  <li>Add timeouts + retry on one external call.</li>
  <li>Build same in Hono on Cloudflare Workers; feel the constraint differences.</li>
  <li>Read 12-factor app guidelines.</li>
  <li>Read "Designing Data-Intensive Applications" first 3 chapters for the foundation.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read 'High Performance Browser Networking' (free online) for the HTTP / TCP / TLS deep."</li>
  <li>"Try Go's net/http for comparison; feel the threading model."</li>
  <li>"Build an RN app + BFF together to feel the cross-stack patterns."</li>
  <li>"Read Stripe + GitHub API docs for production-grade design references."</li>
</ul>
`
    }
  ]
});
