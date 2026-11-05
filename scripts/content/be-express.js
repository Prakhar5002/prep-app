window.PREP_SITE.registerTopic({
  id: "be-express",
  module: "backend-stack",
  title: "Express.js Deep",
  estimatedReadTime: "45 min",
  tags: ["backend","node","express","middleware","zod","helmet","cors","rate-limit","supertest","streaming","graceful-shutdown","typescript"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Express is an <strong>ordered stack of <code>(req, res, next)</code> functions</strong> — each layer ends the response, calls <code>next()</code>, or calls <code>next(err)</code> to jump to the 4-arity error handlers registered after it.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Registration order is execution order</strong>: request-id/log → helmet/CORS → health → body parsers (with limits) → rate limit → auth → routers → 404 → error handler.</li>
    <li>Error handlers are recognised by <strong>four parameters</strong> and must be registered <strong>last</strong>.</li>
    <li><strong>Express 4</strong> ignores rejected promises from async handlers (request hangs); <strong>Express 5</strong> forwards them to <code>next(err)</code>. Callbacks outside the promise chain are uncaught in both.</li>
    <li>Express 5 migration traps: named wildcards (<code>/*path</code>), brace optionals, <code>req.query</code> is a getter, <code>req.body</code> undefined without a parser.</li>
    <li>Validate body/query/params with <strong>zod</strong>, coerce strings, <code>.strict()</code> to block mass assignment, infer handler types from the schema.</li>
    <li>Throw typed <code>AppError</code>s; one handler maps them to <code>{ error: { code, message, details, requestId } }</code>; never expose 5xx details or stacks.</li>
    <li>helmet = browser security headers; CORS = browser relaxation, <em>not</em> auth; rate limits need a shared store and correct <code>trust proxy</code>.</li>
    <li>Controllers translate HTTP; services own rules; repos own SQL. <code>createApp(deps)</code> makes supertest trivial.</li>
    <li>Stream big bodies with <code>pipeline()</code>/busboy (backpressure + cleanup); prefer presigned S3 URLs for uploads.</li>
    <li><code>keepAliveTimeout</code> &gt; LB idle timeout, <code>headersTimeout</code> &gt; <code>keepAliveTimeout</code>; graceful shutdown = readiness off → <code>server.close()</code> → deadline → close pools.</li>
    <li>Express is a <strong>thin routing + middleware layer over Node's <code>http</code> module</strong>; <code>req.body</code> is <code>any</code> until a schema proves otherwise ("parse, don't validate").</li>
    <li><code>trust proxy</code>: <code>false</code> → every client is the LB's IP; <code>true</code> → clients spoof <code>X-Forwarded-For</code> and dodge limits; set the <strong>exact hop count</strong> (e.g. <code>1</code> behind one ALB).</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap">Believing a <code>try/catch</code>-free <code>async</code> handler is safe on Express 4 — a rejected promise never reaches your error handler, so the request <strong>hangs silently</strong> until the LB returns a 504 with nothing in the logs. Same family: an error handler that lost its fourth parameter, or a middleware path that forgets <code>next()</code>.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"In Express the order of <code>app.use</code> calls <em>is</em> the program — security and logging first, routes in the middle, a 4-arity error handler last."</div>
  <div class="revision-say">"I validate at the edge with zod and infer handler types from the schema, so after the boundary the data is typed and trusted."</div>
  <div class="revision-say">"Sporadic 502s behind an ALB are usually Node's keep-alive timeout being shorter than the load balancer's idle timeout."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What Express actually is</h3>
<p>Node ships <code>http.createServer((req, res) =&gt; ...)</code>: one callback per request, raw streams, no routing, no body parsing. Express wraps that callback with:</p>
<ul>
  <li><strong>A router</strong> — match method + path (with params like <code>/users/:id</code>) to handlers.</li>
  <li><strong>A middleware stack</strong> — an ordered array of functions that share <code>req</code>/<code>res</code> and hand off via <code>next()</code>.</li>
  <li><strong>Request/response helpers</strong> — <code>req.params</code>, <code>req.query</code>, <code>res.json()</code>, <code>res.status()</code>, <code>res.sendFile()</code>, content negotiation.</li>
  <li><strong>Error routing</strong> — <code>next(err)</code> skips normal middleware and lands in 4-arity error handlers.</li>
</ul>
<p>That's it. No DI, no ORM, no validation, no config system. Everything else is a library you choose — which is both the appeal and the risk.</p>

<h3>Why it still matters (in 2026)</h3>
<ul>
  <li><strong>It is the default substrate.</strong> NestJS uses Express as its default HTTP adapter; countless BFFs, webhooks receivers, internal tools and LLM-proxy services are plain Express.</li>
  <li><strong>FDE reality:</strong> customer codebases you are dropped into are very often an Express app someone grew for five years. Reading and safely changing one is a core skill.</li>
  <li><strong>Interviews</strong> use it as the lingua franca for "build me a small API" exercises — you will be judged on ordering, errors, validation and testability, not on knowing the API.</li>
</ul>

<h3>Express 4 vs Express 5 — what changed</h3>
<p>Express 5 went stable in late 2024 after a decade in beta; it is the current major. Things that bite during migration (verify the full list in the official migration guide):</p>
<table>
  <thead><tr><th>Area</th><th>Express 4</th><th>Express 5</th></tr></thead>
  <tbody>
    <tr><td>Async errors</td><td>Rejected promise in a handler is <em>not</em> caught → request hangs / unhandledRejection</td><td>Rejected promise / thrown error in an async handler is forwarded to <code>next(err)</code></td></tr>
    <tr><td>Path syntax</td><td><code>'/files/*'</code>, <code>'/:id?'</code>, regex-ish strings</td><td>New path-to-regexp: wildcards must be <strong>named</strong> (<code>'/files/*path'</code>), optional segments use braces (<code>'/user{/:id}'</code>), regex chars in strings are not allowed</td></tr>
    <tr><td><code>req.body</code> when no parser ran</td><td><code>{}</code></td><td><code>undefined</code></td></tr>
    <tr><td><code>req.query</code></td><td>Writable property, "extended" (qs) parser by default</td><td>Getter (not writable — middleware that reassigns it breaks), "simple" parser by default</td></tr>
    <tr><td>Removed APIs</td><td><code>app.del</code>, <code>res.redirect('back')</code>, <code>req.param()</code>, <code>res.send(status)</code></td><td>Gone — use <code>app.delete</code>, explicit URLs, <code>req.params</code>/<code>req.query</code>, <code>res.sendStatus()</code></td></tr>
    <tr><td><code>express.urlencoded</code></td><td><code>extended</code> default true</td><td><code>extended</code> default false</td></tr>
    <tr><td>Node version</td><td>Very old Nodes supported</td><td>Requires a modern Node (18+ at release — check current docs)</td></tr>
  </tbody>
</table>

<h3>Express vs alternatives</h3>
<table>
  <thead><tr><th></th><th>Express</th><th>Fastify</th><th>Hono</th><th>NestJS</th></tr></thead>
  <tbody>
    <tr><td>Philosophy</td><td>Minimal, unopinionated</td><td>Performance + JSON-schema first</td><td>Web-standard <code>Request</code>/<code>Response</code>, runs on edge runtimes</td><td>Opinionated framework (DI, modules) on top of Express/Fastify</td></tr>
    <tr><td>Throughput</td><td>Lowest of the four in micro-benchmarks</td><td>Typically several times Express in hello-world benchmarks</td><td>Very fast; tiny</td><td>Same as underlying adapter + small DI overhead</td></tr>
    <tr><td>Validation</td><td>BYO (zod)</td><td>Built-in JSON Schema (ajv) + fast serialization</td><td>Validator middleware (zod)</td><td>Pipes (class-validator / zod)</td></tr>
    <tr><td>Ecosystem</td><td>Largest by far</td><td>Large, plugin-encapsulation model</td><td>Growing</td><td>Large, batteries included</td></tr>
    <tr><td>Pick when</td><td>Existing app, small service, max library compatibility</td><td>Throughput-sensitive JSON API</td><td>Edge/Workers/Bun, BFF</td><td>Larger team, many modules, want structure</td></tr>
  </tbody>
</table>
<div class="callout note">
  <div class="callout-title">Perspective on "Express is slow"</div>
  <p>Hello-world benchmarks measure framework overhead (tens of microseconds). A real endpoint spends milliseconds in the database and upstream calls. Framework choice rarely decides your p99; N+1 queries, missing indexes and no connection pooling do. Say this in interviews — it shows judgement.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>The pipeline picture</h3>
<div class="diagram">
<pre>
  HTTP request
      │
      ▼
 ┌────────────────┐   next()   ┌──────────┐  next()  ┌──────────────┐  next()  ┌────────────┐
 │ requestId/log  │──────────▶│ helmet   │────────▶│ cors         │────────▶│ express    │
 └────────────────┘            └──────────┘          └──────────────┘          │ .json()    │
                                                                               └─────┬──────┘
                                                                                     │ next()
      ┌──────────────────────────────────────────────────────────────────────────────┘
      ▼
 ┌────────────┐ next() ┌───────────────┐ match? ┌─────────────────────────┐
 │ rateLimit  │──────▶│ /api router    │──────▶│ auth → validate → handler│──▶ res.json()  (DONE)
 └────────────┘        └───────────────┘        └─────────────────────────┘
                              │ no match                │ next(err) / throw (Express 5)
                              ▼                         ▼
                        ┌──────────┐             ┌──────────────────────┐
                        │ 404 mw   │──next(err)─▶│ error handler (4 args)│──▶ res.status(..).json()
                        └──────────┘             └──────────────────────┘
</pre>
</div>

<h3>Three rules that explain every Express behaviour</h3>
<ol>
  <li><strong>Registration order = execution order.</strong> <code>app.use</code> / <code>app.get</code> push onto one stack. A request walks the stack top to bottom, skipping layers whose path/method do not match.</li>
  <li><strong>Each layer must do exactly one of:</strong> end the response (<code>res.json</code>, <code>res.end</code>, <code>res.send</code>…), call <code>next()</code>, or call <code>next(err)</code>. Doing none → the request hangs until a timeout. Doing two → "Cannot set headers after they are sent".</li>
  <li><strong><code>next(err)</code> switches tracks.</strong> Once an error is passed, Express skips all 3-arity middleware and only runs 4-arity <code>(err, req, res, next)</code> handlers that come <em>after</em> the current position.</li>
</ol>

<h3>Special values of next</h3>
<table>
  <thead><tr><th>Call</th><th>Effect</th></tr></thead>
  <tbody>
    <tr><td><code>next()</code></td><td>Go to the next matching layer.</td></tr>
    <tr><td><code>next(err)</code></td><td>Skip to the next error-handling middleware.</td></tr>
    <tr><td><code>next('route')</code></td><td>Skip the remaining callbacks of <em>this route</em> and try the next matching route (only in <code>app.METHOD</code>/<code>router.METHOD</code> handlers).</td></tr>
    <tr><td><code>next('router')</code></td><td>Exit the current router instance entirely and continue after it.</td></tr>
  </tbody>
</table>

<h3>Routers are mini-apps</h3>
<p>An <code>express.Router()</code> has its own stack. Mounting it with <code>app.use('/api/bookings', router)</code> strips the prefix (inside, <code>req.path</code> starts at <code>/</code>; <code>req.baseUrl</code> holds <code>/api/bookings</code>). Parent params are <em>not</em> visible inside unless you create the router with <code>{ mergeParams: true }</code>.</p>

<h3>The FE analogy</h3>
<p>If you know Redux middleware (<code>store =&gt; next =&gt; action</code>) or Axios interceptors, you already know this: each layer can inspect, short-circuit, decorate, or forward. The difference is that Express middleware is <em>not</em> an onion by default — code after <code>next()</code> runs after downstream middleware <em>returns synchronously</em>, not after the response finishes. To run "after the response", listen to <code>res.on('finish')</code>.</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Code after <code>await next()</code> runs after the handler, like Koa." No. Express's <code>next</code> does not return a promise of the downstream chain. Timing and logging middleware must hook <code>res.on('finish')</code> (or <code>'close'</code> for aborted requests).</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. The app factory (testable by construction)</h3>
<pre><code class="language-ts">// src/app.ts
import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { requestContext } from './middleware/request-context';
import { notFound, errorHandler } from './middleware/errors';
import { bookingsRouter } from './modules/bookings/bookings.router';
import type { Deps } from './deps';

export function createApp(deps: Deps): Express {
  const app = express();

  app.disable('x-powered-by');               // helmet also does this; belt + braces
  app.set('trust proxy', deps.config.trustProxyHops); // e.g. 1 behind one ALB/nginx

  // 1. Observability first so everything below is traced
  app.use(requestContext(deps.logger));

  // 2. Security headers + CORS before any route can respond
  app.use(helmet());
  app.use(cors({
    origin: deps.config.corsOrigins,         // explicit allow-list, never '*' with credentials
    credentials: true,
    maxAge: 600,
  }));

  // 3. Health check BEFORE rate limiting and auth (LB probes must not be throttled)
  app.get('/healthz', (_req, res) =&gt; res.status(200).json({ ok: true }));

  // 4. Body parsing with explicit limits
  app.use(express.json({ limit: '100kb' }));

  // 5. Rate limit the API surface
  app.use('/api', rateLimit({
    windowMs: 60_000,
    limit: 120,                              // 'max' in older versions — check current docs
    standardHeaders: true,
    legacyHeaders: false,
  }));

  // 6. Feature routers
  app.use('/api/bookings', bookingsRouter(deps));

  // 7. 404 then error handler — ALWAYS last
  app.use(notFound);
  app.use(errorHandler(deps.logger));

  return app;
}</code></pre>

<pre><code class="language-ts">// src/server.ts — the only file that listens on a port
import { createApp } from './app';
import { buildDeps } from './deps';

const deps = await buildDeps();
const app = createApp(deps);
const server = app.listen(deps.config.port, () =&gt;
  deps.logger.info({ port: deps.config.port }, 'listening'));

// Keep-alive must outlive the load balancer's idle timeout (ALB default 60s)
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;              // must be greater than keepAliveTimeout

installShutdown(server, deps);               // see Examples</code></pre>

<h3>2. Typing req: declaration merging</h3>
<pre><code class="language-ts">// src/types/express.d.ts
import type { Logger } from 'pino';

declare global {
  namespace Express {
    interface Request {
      id: string;
      log: Logger;
      user?: { id: string; tenantId: string; roles: string[] };
    }
  }
}
export {};</code></pre>
<p>Make sure the file is included by <code>tsconfig</code> (<code>include</code> or <code>typeRoots</code>). The <code>user?</code> is optional on purpose: unauthenticated routes exist, and a <code>requireUser(req)</code> helper that throws 401 narrows it.</p>

<h3>3. Request context with AsyncLocalStorage</h3>
<pre><code class="language-ts">// src/middleware/request-context.ts
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import type { Logger } from 'pino';

type Ctx = { requestId: string; userId?: string };
export const als = new AsyncLocalStorage&lt;Ctx&gt;();

export function requestContext(logger: Logger): RequestHandler {
  return (req, res, next) =&gt; {
    const incoming = req.header('x-request-id');
    const requestId = incoming &amp;&amp; incoming.length &lt;= 128 ? incoming : randomUUID();
    req.id = requestId;
    req.log = logger.child({ requestId });
    res.setHeader('x-request-id', requestId);

    const start = process.hrtime.bigint();
    res.on('finish', () =&gt; {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      req.log.info({ method: req.method, path: req.originalUrl, status: res.statusCode, ms }, 'request');
    });
    res.on('close', () =&gt; {
      if (!res.writableFinished) req.log.warn('client aborted');
    });

    als.run({ requestId }, () =&gt; next());   // every await downstream sees this ctx
  };
}</code></pre>

<h3>4. Async errors — Express 4 vs 5</h3>
<pre><code class="language-ts">// Express 4: this request HANGS if findById rejects
router.get('/:id', async (req, res) =&gt; {
  const b = await svc.findById(req.params.id);   // rejection → unhandledRejection, no response
  res.json(b);
});

// Express 4 fix: wrap (or use the 'express-async-errors' patch)
export const ah = (fn: RequestHandler): RequestHandler =&gt;
  (req, res, next) =&gt; { Promise.resolve(fn(req, res, next)).catch(next); };

router.get('/:id', ah(async (req, res) =&gt; {
  res.json(await svc.findById(req.params.id));
}));

// Express 5: the plain async version works — rejection goes to next(err)</code></pre>
<p>Even on Express 5, errors thrown inside a <strong>callback</strong> that is not part of the returned promise (a <code>setTimeout</code>, an event emitter, a stream <code>'error'</code> you didn't await) are not caught. Promisify or use <code>pipeline()</code>.</p>

<h3>5. Typed errors + the central error handler</h3>
<pre><code class="language-ts">// src/errors.ts
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
    public readonly expose = status &lt; 500,   // only expose client errors
  ) { super(message); this.name = 'AppError'; }
}
export const NotFound = (what: string) =&gt; new AppError(404, 'NOT_FOUND', what + ' not found');
export const Conflict = (msg: string) =&gt; new AppError(409, 'CONFLICT', msg);
export const Forbidden = () =&gt; new AppError(403, 'FORBIDDEN', 'Forbidden');</code></pre>

<pre><code class="language-ts">// src/middleware/errors.ts
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors';

export const notFound: RequestHandler = (req, _res, next) =&gt;
  next(new AppError(404, 'ROUTE_NOT_FOUND', 'No route for ' + req.method + ' ' + req.path));

export const errorHandler = (logger: { error: Function }): ErrorRequestHandler =&gt;
  (err, req, res, next) =&gt; {
    // Headers already streamed? Let Express close the socket.
    if (res.headersSent) return next(err);

    let status = 500, code = 'INTERNAL', message = 'Internal Server Error', details: unknown;

    if (err instanceof AppError) {
      status = err.status; code = err.code;
      if (err.expose) { message = err.message; details = err.details; }
    } else if (err instanceof ZodError) {
      status = 400; code = 'VALIDATION_FAILED'; message = 'Invalid request';
      details = err.issues.map(i =&gt; ({ path: i.path.join('.'), message: i.message }));
    } else if (err?.type === 'entity.too.large') {
      status = 413; code = 'PAYLOAD_TOO_LARGE'; message = 'Body too large';
    } else if (err?.type === 'entity.parse.failed') {
      status = 400; code = 'BAD_JSON'; message = 'Malformed JSON';
    }

    if (status &gt;= 500) (req.log ?? logger).error({ err }, 'unhandled error');

    res.status(status).json({ error: { code, message, details, requestId: req.id } });
  };</code></pre>
<div class="callout danger">
  <div class="callout-title">Arity is how Express recognises error handlers</div>
  <p>An error handler <strong>must declare four parameters</strong>, even if you don't use <code>next</code>. If a linter or refactor removes the unused <code>next</code>, Express treats it as normal middleware and your errors fall through to the default HTML error page (with a stack trace when <code>NODE_ENV</code> is not <code>production</code>).</p>
</div>

<h3>6. Validation with zod (parse, don't validate)</h3>
<pre><code class="language-ts">// src/middleware/validate.ts
import type { RequestHandler } from 'express';
import { z, type ZodTypeAny } from 'zod';

type Schemas = { body?: ZodTypeAny; query?: ZodTypeAny; params?: ZodTypeAny };

// Stores parsed values on res.locals.input (Express 5: req.query is a getter — don't reassign it)
export function validate&lt;S extends Schemas&gt;(schemas: S): RequestHandler {
  return (req, res, next) =&gt; {
    const input = {
      body: schemas.body ? schemas.body.parse(req.body) : undefined,
      query: schemas.query ? schemas.query.parse(req.query) : undefined,
      params: schemas.params ? schemas.params.parse(req.params) : undefined,
    };
    res.locals.input = input;   // ZodError thrown synchronously → error handler → 400
    next();
  };
}

export type Input&lt;S extends Schemas&gt; = {
  body: S['body'] extends ZodTypeAny ? z.infer&lt;S['body']&gt; : undefined;
  query: S['query'] extends ZodTypeAny ? z.infer&lt;S['query']&gt; : undefined;
  params: S['params'] extends ZodTypeAny ? z.infer&lt;S['params']&gt; : undefined;
};</code></pre>
<pre><code class="language-ts">// src/modules/bookings/bookings.schemas.ts
import { z } from 'zod';

export const createBooking = {
  body: z.object({
    roomId: z.string().uuid(),
    start: z.coerce.date(),
    end: z.coerce.date(),
    title: z.string().trim().min(1).max(120),
    attendees: z.array(z.string().email()).max(50).default([]),
  }).strict()                                         // reject unknown keys (mass-assignment)
    .refine(b =&gt; b.end &gt; b.start, { message: 'end must be after start', path: ['end'] }),
};

export const listBookings = {
  query: z.object({
    roomId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z.string().optional(),
  }),
};</code></pre>
<p>Query strings and params are <strong>always strings</strong>; <code>z.coerce</code> turns <code>"20"</code> into <code>20</code>. Zod's error-formatting helpers have changed between major versions — <code>error.issues</code> is the stable thing to map from (check current docs for v4 helpers).</p>

<h3>7. Router, controller, service</h3>
<pre><code class="language-ts">// src/modules/bookings/bookings.router.ts
import { Router } from 'express';
import { validate, type Input } from '../../middleware/validate';
import { requireAuth, requireRole } from '../../middleware/auth';
import { createBooking, listBookings } from './bookings.schemas';
import type { Deps } from '../../deps';

export function bookingsRouter({ bookingService, auth }: Deps) {
  const r = Router();
  r.use(requireAuth(auth));                       // every route below is authenticated

  r.get('/', validate(listBookings), async (req, res) =&gt; {
    const { query } = res.locals.input as Input&lt;typeof listBookings&gt;;
    const page = await bookingService.list(req.user!.tenantId, query);
    res.json(page);
  });

  r.post('/', validate(createBooking), async (req, res) =&gt; {
    const { body } = res.locals.input as Input&lt;typeof createBooking&gt;;
    const booking = await bookingService.create(req.user!, body);
    res.status(201).location('/api/bookings/' + booking.id).json(booking);
  });

  r.delete('/:id', requireRole('admin', 'owner'), async (req, res) =&gt; {
    await bookingService.cancel(req.user!, req.params.id);
    res.sendStatus(204);
  });

  return r;
}</code></pre>
<p>The handler only translates HTTP ↔ domain. <code>bookingService</code> knows nothing about <code>req</code>/<code>res</code>, so it is unit-testable and reusable from a queue consumer or CLI.</p>

<h3>8. Auth middleware (JWT) and role check</h3>
<pre><code class="language-ts">// src/middleware/auth.ts
import type { RequestHandler } from 'express';
import { AppError, Forbidden } from '../errors';

export interface TokenVerifier { verify(token: string): Promise&lt;{ sub: string; tid: string; roles: string[] }&gt; }

export const requireAuth = (verifier: TokenVerifier): RequestHandler =&gt; async (req, _res, next) =&gt; {
  const h = req.header('authorization') ?? '';
  const [scheme, token] = h.split(' ');
  if (scheme !== 'Bearer' || !token) return next(new AppError(401, 'UNAUTHENTICATED', 'Missing token'));
  try {
    const claims = await verifier.verify(token);  // checks signature, exp, iss, aud
    req.user = { id: claims.sub, tenantId: claims.tid, roles: claims.roles };
    next();
  } catch {
    next(new AppError(401, 'UNAUTHENTICATED', 'Invalid token'));
  }
};

export const requireRole = (...roles: string[]): RequestHandler =&gt; (req, _res, next) =&gt;
  req.user?.roles.some(r =&gt; roles.includes(r)) ? next() : next(Forbidden());</code></pre>
<p>Role middleware answers "may this <em>kind</em> of user call this endpoint?". "May this user touch <em>this</em> booking?" (ownership, tenant) belongs in the service/query — see <a href="#/topic/api-auth-rbac">AuthN, AuthZ &amp; RBAC</a>.</p>

<h3>9. Security middleware — what each one actually does</h3>
<table>
  <thead><tr><th>Middleware</th><th>What it does</th><th>Gotcha</th></tr></thead>
  <tbody>
    <tr><td><code>helmet()</code></td><td>Sets security headers: CSP, HSTS, X-Content-Type-Options, frame-ancestors / X-Frame-Options, Referrer-Policy, removes X-Powered-By</td><td>The default CSP can break a server-rendered admin page or Swagger UI — tune <code>contentSecurityPolicy</code> per route instead of disabling it globally.</td></tr>
    <tr><td><code>cors()</code></td><td>Answers preflight <code>OPTIONS</code> and sets <code>Access-Control-Allow-*</code></td><td>CORS is a <em>browser</em> policy, not auth. curl and mobile apps ignore it. <code>origin: '*'</code> cannot be combined with credentials.</td></tr>
    <tr><td><code>express-rate-limit</code></td><td>Per-key counters (IP by default) → 429 with <code>RateLimit-*</code> headers</td><td>Default in-memory store is <strong>per process</strong> — with 4 pods the real limit is 4×. Use a Redis store. Behind a proxy without <code>trust proxy</code>, every client shares the LB's IP.</td></tr>
    <tr><td><code>express.json({ limit })</code></td><td>Parses JSON, rejects bodies over the limit with 413</td><td>Default limit is 100kb. Raising it globally to fix one upload route turns every route into a memory-DoS target.</td></tr>
    <tr><td><code>hpp</code> / query parser choice</td><td>Mitigates parameter pollution (<code>?role=a&amp;role=b</code> becoming an array)</td><td>Your zod schema is the real defence: an array where a string is expected fails parsing.</td></tr>
  </tbody>
</table>

<h3>10. trust proxy — why req.ip lies</h3>
<p>Behind a load balancer, the TCP peer is the LB. The client IP is in <code>X-Forwarded-For</code>. <code>app.set('trust proxy', n)</code> tells Express how many proxy hops to trust when computing <code>req.ip</code>, <code>req.protocol</code> and <code>req.secure</code>.</p>
<ul>
  <li><code>false</code> (default): <code>req.ip</code> = LB address → rate limiter sees one client.</li>
  <li><code>true</code>: trust everything → the client can spoof <code>X-Forwarded-For</code> and dodge rate limits.</li>
  <li><code>1</code> (or the exact number of hops / the proxy CIDRs): correct.</li>
</ul>

<h3>11. Streaming responses (and backpressure)</h3>
<pre><code class="language-ts">import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';

// CSV export of a large table without loading it into memory
r.get('/export.csv', async (req, res) =&gt; {
  res.setHeader('content-type', 'text/csv; charset=utf-8');
  res.setHeader('content-disposition', 'attachment; filename="bookings.csv"');

  const rows = bookingRepo.streamAll(req.user!.tenantId);   // Readable in objectMode (DB cursor)
  const toCsv = new Transform({
    writableObjectMode: true,
    transform(row, _enc, cb) {
      cb(null, [row.id, row.roomId, row.start.toISOString(), csvEscape(row.title)].join(',') + '
');
    },
  });
  res.write('id,roomId,start,title
');
  await pipeline(rows, toCsv, res);   // respects backpressure, destroys all streams on error/abort
});</code></pre>
<p><code>pipeline</code> pauses the DB cursor when the client's socket buffer is full (backpressure) and tears everything down if the client disconnects. Hand-wired <code>rows.on('data', d =&gt; res.write(d))</code> ignores the return value of <code>write()</code> and buffers unboundedly for slow clients.</p>

<h3>12. Server-Sent Events (LLM token streaming)</h3>
<pre><code class="language-ts">r.get('/chat/stream', async (req, res) =&gt; {
  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no',          // disable nginx buffering
  });
  const ac = new AbortController();
  req.on('close', () =&gt; ac.abort());     // stop paying for tokens when the user leaves

  try {
    for await (const chunk of llm.stream(String(req.query.q ?? ''), { signal: ac.signal })) {
      res.write('data: ' + JSON.stringify({ delta: chunk }) + '

');
    }
    res.write('event: done
data: {}

');
  } catch (e) {
    if (!ac.signal.aborted) res.write('event: error
data: ' + JSON.stringify({ message: 'stream failed' }) + '

');
  } finally {
    res.end();
  }
});</code></pre>
<p>Note <code>compression()</code> buffers output and breaks SSE unless you flush or exclude the route. Errors after headers are sent cannot become a 500 — they must be in-band events.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — Streaming file upload straight to S3 (no disk, bounded memory)</h3>
<p>A meeting-room tablet app uploads a floor-plan image or a call recording. Buffering a 200 MB file with <code>multer.memoryStorage()</code> per request will OOM the pod under modest concurrency. Stream it.</p>
<pre><code class="language-ts">import busboy from 'busboy';
import { Upload } from '@aws-sdk/lib-storage';
import { PassThrough } from 'node:stream';
import { randomUUID } from 'node:crypto';

const MAX_BYTES = 250 * 1024 * 1024;
const ALLOWED = new Set(['audio/mpeg', 'audio/wav', 'image/png', 'image/jpeg']);

r.post('/uploads', requireAuth(auth), (req, res, next) =&gt; {
  const bb = busboy({ headers: req.headers, limits: { files: 1, fileSize: MAX_BYTES } });
  let handled = false;

  bb.on('file', (_field, file, info) =&gt; {
    handled = true;
    if (!ALLOWED.has(info.mimeType)) {          // client-declared — verify magic bytes downstream too
      file.resume();
      return next(new AppError(415, 'UNSUPPORTED_MEDIA', 'Type not allowed'));
    }
    const key = 'tenants/' + req.user!.tenantId + '/' + randomUUID();
    const body = new PassThrough();
    file.on('limit', () =&gt; body.destroy(new AppError(413, 'TOO_LARGE', 'File too large')));
    file.pipe(body);

    new Upload({                                // multipart upload, bounded part buffers
      client: s3,
      params: { Bucket: cfg.bucket, Key: key, Body: body, ContentType: info.mimeType },
      queueSize: 4, partSize: 8 * 1024 * 1024,
    }).done()
      .then(() =&gt; res.status(201).json({ key }))
      .catch(next);
  });

  bb.on('error', next);
  bb.on('close', () =&gt; { if (!handled) next(new AppError(400, 'NO_FILE', 'No file field')); });
  req.pipe(bb);
});</code></pre>
<p>Memory is bounded by <code>queueSize × partSize</code> (about 32 MB here) regardless of file size. For mobile clients, the even better answer is often <strong>don't proxy at all</strong>: issue an S3 presigned URL and let the device upload directly — the API only signs and later receives the S3 event.</p>

<h3>Example 2 — Idempotent POST with an Idempotency-Key</h3>
<p>Mobile networks retry. A user on a flaky tablet taps "Book" and the request is sent twice; you must not create two bookings.</p>
<pre><code class="language-ts">export const idempotent = (store: IdemStore): RequestHandler =&gt; async (req, res, next) =&gt; {
  const key = req.header('idempotency-key');
  if (!key) return next();
  const scoped = req.user!.id + ':' + req.method + ':' + req.baseUrl + req.path + ':' + key;

  const existing = await store.get(scoped);
  if (existing?.state === 'done') return res.status(existing.status).json(existing.body);
  if (existing?.state === 'in_progress') return next(new AppError(409, 'IN_PROGRESS', 'Retry later'));

  const acquired = await store.setIfAbsent(scoped, { state: 'in_progress' }, 60); // SET NX EX in Redis
  if (!acquired) return next(new AppError(409, 'IN_PROGRESS', 'Retry later'));

  // Capture the response body so retries replay it
  const originalJson = res.json.bind(res);
  res.json = (body: unknown) =&gt; {
    if (res.statusCode &lt; 500) void store.set(scoped, { state: 'done', status: res.statusCode, body }, 86_400);
    else void store.del(scoped);              // let a retry try again after a server failure
    return originalJson(body);
  };
  next();
};

r.post('/', idempotent(redisIdem), validate(createBooking), createHandler);</code></pre>
<p>Pair it with a DB-level guarantee (exclusion constraint / unique index on room + slot) — middleware reduces duplicates, constraints <em>prevent</em> them.</p>

<h3>Example 3 — Testing with supertest (no port, real pipeline)</h3>
<pre><code class="language-ts">// test/bookings.test.ts  (vitest or jest)
import request from 'supertest';
import { createApp } from '../src/app';
import { fakeDeps } from './fakes';

describe('POST /api/bookings', () =&gt; {
  const deps = fakeDeps();                         // in-memory repo, fake verifier, silent logger
  const app = createApp(deps);
  const token = deps.auth.issue({ sub: 'u1', tid: 't1', roles: ['member'] });

  it('creates a booking', async () =&gt; {
    const res = await request(app)
      .post('/api/bookings')
      .set('authorization', 'Bearer ' + token)
      .send({ roomId: crypto.randomUUID(), start: '2026-11-05T10:00:00Z', end: '2026-11-05T11:00:00Z', title: 'Standup' })
      .expect('content-type', /json/)
      .expect(201);
    expect(res.headers.location).toMatch(/^/api/bookings//);
  });

  it('rejects end before start with a 400 and field path', async () =&gt; {
    const res = await request(app)
      .post('/api/bookings')
      .set('authorization', 'Bearer ' + token)
      .send({ roomId: crypto.randomUUID(), start: '2026-11-05T11:00:00Z', end: '2026-11-05T10:00:00Z', title: 'x' })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    expect(res.body.error.details[0].path).toBe('end');
  });

  it('401 without token, and never leaks a stack', async () =&gt; {
    const res = await request(app).get('/api/bookings').expect(401);
    expect(JSON.stringify(res.body)).not.toMatch(/at .*.ts/);
  });

  it('413 on oversized JSON', async () =&gt; {
    await request(app).post('/api/bookings').set('authorization', 'Bearer ' + token)
      .set('content-type', 'application/json').send('{"title":"' + 'a'.repeat(200_000) + '"}')
      .expect(413);
  });
});</code></pre>
<p><code>request(app)</code> binds an ephemeral server internally — no port management, parallel-safe. Integration tests against a real Postgres (testcontainers) are covered in <a href="#/topic/test-api">API Testing</a>.</p>

<h3>Example 4 — Graceful shutdown that actually drains</h3>
<pre><code class="language-ts">// src/shutdown.ts
import type { Server } from 'node:http';

export function installShutdown(server: Server, deps: { db: { end(): Promise&lt;void&gt; }; logger: any }) {
  let shuttingDown = false;

  const shutdown = async (signal: string) =&gt; {
    if (shuttingDown) return;
    shuttingDown = true;
    deps.logger.info({ signal }, 'draining');

    // 1. Fail readiness so the LB stops sending new traffic (k8s: readinessProbe → 503)
    readiness.ready = false;

    // 2. Stop accepting new connections; in-flight requests continue
    const closed = new Promise&lt;void&gt;(resolve =&gt; server.close(() =&gt; resolve()));
    server.closeIdleConnections?.();           // Node 18.2+: drop idle keep-alive sockets now

    // 3. Hard deadline below the orchestrator's grace period (k8s default 30s)
    const deadline = setTimeout(() =&gt; {
      deps.logger.warn('forcing close');
      server.closeAllConnections?.();
    }, 20_000).unref();

    await closed;
    clearTimeout(deadline);

    // 4. Close resources AFTER requests finished using them
    await deps.db.end();
    deps.logger.info('bye');
    process.exit(0);
  };

  process.on('SIGTERM', () =&gt; void shutdown('SIGTERM'));
  process.on('SIGINT', () =&gt; void shutdown('SIGINT'));
}</code></pre>
<p>Why the readiness flip first: Kubernetes removes the pod from Service endpoints <em>asynchronously</em>. For a few seconds after SIGTERM, traffic still arrives. Many teams add a short <code>preStop</code> sleep so the endpoint removal propagates before <code>server.close()</code>.</p>

<h3>Example 5 — Project structure that scales</h3>
<div class="diagram">
<pre>
src/
  app.ts                 createApp(deps) — middleware order lives here, nowhere else
  server.ts              listen + timeouts + shutdown
  deps.ts                composition root: build db pool, repos, services, clients
  config.ts              zod-validated env (fail fast on boot)
  errors.ts              AppError + helpers
  middleware/            request-context, auth, validate, errors, idempotent
  modules/
    bookings/
      bookings.router.ts     HTTP: routes, validate, status codes
      bookings.service.ts    business rules, transactions, authorization of ownership
      bookings.repo.ts       SQL / Prisma only
      bookings.schemas.ts    zod schemas → inferred types shared with handlers
    rooms/ ...
test/
  fakes.ts, *.test.ts, *.int.test.ts
</pre>
</div>
<pre><code class="language-ts">// src/config.ts — crash at boot, not at the first request
import { z } from 'zod';
const Env = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  CORS_ORIGINS: z.string().transform(s =&gt; s.split(',').map(x =&gt; x.trim())),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(1),
});
export const config = Env.parse(process.env);</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>Errors after headers are sent</h3>
<p>Once you have called <code>res.write()</code> (streaming, SSE) you cannot change the status. Your error handler must check <code>res.headersSent</code> and delegate to <code>next(err)</code>, which makes Express destroy the socket — the client sees a truncated response rather than a fake 200 body.</p>

<h3>Double responses</h3>
<pre><code class="language-ts">r.get('/:id', async (req, res) =&gt; {
  const b = await svc.find(req.params.id);
  if (!b) res.status(404).json({ error: 'nope' });   // missing 'return'
  res.json(b);                                        // ERR_HTTP_HEADERS_SENT
});</code></pre>
<p>Always <code>return</code> the response call, or prefer throwing <code>NotFound()</code> and letting the error handler respond.</p>

<h3>Route ordering shadows</h3>
<pre><code class="language-ts">r.get('/:id', getOne);
r.get('/stats', getStats);   // never reached: '/stats' matches '/:id' with id = 'stats'</code></pre>
<p>Register static paths before parameterised ones, or constrain the param (validate UUID and call <code>next('route')</code> when it isn't one).</p>

<h3>Path normalisation surprises</h3>
<ul>
  <li>By default routing is case-insensitive and non-strict: <code>/Bookings/</code> matches <code>/bookings</code>. Enable <code>case sensitive routing</code> / <code>strict routing</code> settings if caching keys or auth rules depend on exact paths.</li>
  <li>Auth middleware mounted with <code>app.use('/admin', ...)</code> protects <code>/admin</code> and <code>/admin/x</code> but your <em>reverse proxy</em> may forward <code>/admin%2F..</code> differently. Enforce auth at the router that owns the routes, not by path string-matching.</li>
</ul>

<h3>Body parser + content-type mismatches</h3>
<ul>
  <li><code>express.json()</code> only parses when <code>Content-Type</code> matches <code>application/json</code>. A client sending <code>text/plain</code> gets <code>req.body</code> undefined (Express 5) → zod error "expected object, received undefined". Good: it is a 400, not a crash.</li>
  <li>Webhooks (Stripe and similar) need the <strong>raw body</strong> to verify the signature. Mount <code>express.raw({ type: 'application/json' })</code> on the webhook route <em>before</em> the global <code>express.json()</code>, or the bytes are gone.</li>
</ul>

<h3>JSON serialization traps</h3>
<ul>
  <li><code>res.json({ n: 10n })</code> throws (BigInt is not JSON-serializable) — Prisma returns BigInt for <code>BIGINT</code> columns. Convert to string at the boundary.</li>
  <li><code>Date</code> becomes an ISO string; on the client it comes back as a string, not a Date.</li>
  <li>Prototype-pollution payloads (<code>{"__proto__": {...}}</code>) — <code>JSON.parse</code> creates an own property, which is safe, but a naive deep-merge into config is not. Strict zod schemas strip/reject unknown keys.</li>
</ul>

<h3>Client aborts</h3>
<p>A user closes the app mid-request: <code>req</code> emits <code>'close'</code>, but your handler keeps running, querying the DB and calling the LLM. For expensive work, wire an <code>AbortController</code> to <code>req.on('close')</code> and pass the signal down (fetch, LLM SDKs, and many DB drivers accept one).</p>

<h3>Keep-alive race with the load balancer</h3>
<p>Node's default <code>keepAliveTimeout</code> is short (5s at time of writing). If the LB's idle timeout is longer (AWS ALB: 60s default), Node closes an idle socket just as the LB reuses it → sporadic <strong>502s</strong> under low traffic. Set <code>keepAliveTimeout</code> above the LB idle timeout and <code>headersTimeout</code> above that.</p>

<h3>Event-loop blocking</h3>
<p>One synchronous <code>bcrypt.hashSync</code>, a huge <code>JSON.parse</code>, or a catastrophic-backtracking regex stalls <em>every</em> request on that process. Express gives you zero protection — see <a href="#/topic/be-fundamentals">Backend Fundamentals</a> for the event-loop model; use async crypto, worker threads, and monitor event-loop lag (<code>perf_hooks.monitorEventLoopDelay</code>).</p>

<h3>Rate limiting across a cluster</h3>
<p>In-memory counters reset on deploy and are per-process. With horizontal scaling, use a shared store (Redis) and decide the key deliberately: IP for anonymous routes, user/tenant id for authenticated ones (a whole office behind one NAT IP must not share a limit).</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>The usual suspects</h3>
<table>
  <thead><tr><th>Anti-pattern</th><th>Symptom</th><th>Fix</th></tr></thead>
  <tbody>
    <tr><td>Error handler registered before routes</td><td>Errors return the default HTML page</td><td>Error handler is the <em>last</em> <code>app.use</code></td></tr>
    <tr><td>Error handler with 3 params</td><td>Same as above, silently</td><td>Keep the 4-arity signature; lint-ignore unused <code>next</code></td></tr>
    <tr><td><code>async</code> handlers on Express 4 without a wrapper</td><td>Hanging requests, <code>unhandledRejection</code> logs, LB 504s</td><td>Upgrade to 5, or wrap / use <code>express-async-errors</code></td></tr>
    <tr><td><code>res.status(500).json({ error: err.stack })</code></td><td>Leaks file paths, library versions, SQL</td><td>Expose only for <code>status &lt; 500</code>; log the stack server-side with a request id</td></tr>
    <tr><td>Business logic in route handlers</td><td>Untestable without HTTP; duplicated rules between REST and queue consumer</td><td>Controller → service → repo</td></tr>
    <tr><td>Module-level singletons imported everywhere (<code>import { db } from './db'</code>)</td><td>Tests need module mocking; hidden boot order</td><td>Composition root + <code>createApp(deps)</code></td></tr>
    <tr><td><code>cors({ origin: true, credentials: true })</code></td><td>Reflects any origin with cookies → CSRF-like data theft</td><td>Explicit allow-list</td></tr>
    <tr><td><code>express.json({ limit: '50mb' })</code> globally</td><td>Memory DoS on every route</td><td>Small global limit; per-route larger limit or streaming</td></tr>
    <tr><td>Mutating <code>req.query</code> in a validation middleware</td><td>Works on 4, throws/ignored on 5</td><td>Store parsed input on <code>res.locals</code> or a typed property</td></tr>
    <tr><td>Logging the whole <code>req.body</code></td><td>Passwords, tokens, PII in logs</td><td>Log redaction (pino <code>redact</code> paths)</td></tr>
    <tr><td>No timeout on outbound calls</td><td>Slow upstream exhausts sockets and memory</td><td><code>AbortSignal.timeout(ms)</code> on every fetch</td></tr>
  </tbody>
</table>

<h3>Bug: middleware that forgets next</h3>
<pre><code class="language-ts">app.use((req, res, next) =&gt; {
  if (req.header('x-maintenance') === '1') {
    res.status(503).json({ error: 'maintenance' });
  }
  // missing next() in the else-path → every normal request hangs forever
});</code></pre>
<p>Symptom in production: requests time out at the LB (504) with no error logs at all, because nothing threw. If "nothing in the logs but the client times out", look for a missing <code>next()</code> or a promise nobody awaited.</p>

<h3>Bug: the try/catch that swallows</h3>
<pre><code class="language-ts">r.post('/', async (req, res) =&gt; {
  try {
    res.json(await svc.create(req.body));
  } catch (e) {
    console.log(e);                       // logged, but...
    res.status(500).send('error');        // ...every 400/404/409 becomes a 500
  }
});</code></pre>
<p>Local try/catch in handlers defeats the central error handler and flattens all your typed errors. Catch only when you are <em>translating</em> a specific error (e.g. a unique-violation into <code>Conflict</code>) and rethrow everything else.</p>

<h3>Bug: auth applied after the router</h3>
<pre><code class="language-ts">app.use('/api/bookings', bookingsRouter(deps));
app.use(requireAuth(verifier));           // too late — bookings already responded</code></pre>

<h3>Anti-pattern: rolling your own security</h3>
<p>Hand-written CORS headers that forget <code>Vary: Origin</code> (caches serve one tenant's CORS response to another), DIY JWT parsing with <code>jwt.decode</code> instead of <code>verify</code>, home-made rate limiters in a global <code>Map</code> that grows without bound. Use the boring, maintained libraries; spend your creativity on domain logic.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. Explain how Express processes a request.</div>
  <div class="qa-answer"><p>Express keeps an ordered stack of layers registered by <code>app.use</code> and <code>app.METHOD</code>. For each request it walks the stack, skipping layers whose path or method don't match, and calls each matching function with <code>(req, res, next)</code>. A layer ends the response, calls <code>next()</code> to continue, or <code>next(err)</code> to jump to the first 4-arity error handler after it. Routers are nested stacks with their own path prefix. So the behaviour of the app is literally the order of registration.</p></div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. What order do you register middleware in, and why?</div>
  <div class="qa-answer"><p>Request id/logging first (so everything is traced) → security headers and CORS (so even errors carry them, and preflights answer before auth) → health check (unauthenticated, not rate-limited) → body parsers with size limits → rate limiting → auth → routers (validation per route) → 404 → error handler last. The reasoning for each position matters more than the list: CORS before auth because browsers send preflight <code>OPTIONS</code> without credentials; rate limit before expensive auth lookups; error handler last because only later layers receive <code>next(err)</code>.</p></div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. An async route handler throws. What happens in Express 4 vs 5?</div>
  <div class="qa-answer"><p>In 4, Express calls the handler and ignores the returned promise. A rejection becomes an <code>unhandledRejection</code>; nothing calls <code>next(err)</code>, so the request hangs until a client or LB timeout — and on recent Node versions an unhandled rejection can crash the process by default. Fixes: a wrapper that does <code>.catch(next)</code>, or <code>express-async-errors</code>. In 5, Express detects the returned promise and forwards rejections to <code>next(err)</code>. Caveat in both: errors from callbacks outside the promise chain (timers, emitters) are still uncaught.</p></div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. How do you validate input and keep types in sync?</div>
  <div class="qa-answer"><p>Zod schemas per route for body, query and params. A middleware parses (coercing query strings to numbers/dates), rejects unknown keys with <code>.strict()</code>, and stores the parsed result; the handler's types come from <code>z.infer</code>, so there's one source of truth. The ZodError maps to a 400 with field paths in the central error handler. The schemas can be shared with a TS frontend or exported to OpenAPI. I'd mention this is "parse, don't validate" — after the boundary, the data is typed and trusted.</p></div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. What does helmet do, and is CORS a security feature?</div>
  <div class="qa-answer"><p>Helmet sets response headers that instruct browsers: CSP, HSTS, nosniff, frame protections, referrer policy. CORS is a browser mechanism that <em>relaxes</em> the same-origin policy for allowed origins — it doesn't protect your API from curl, scripts or mobile apps. It does matter for cookie-authenticated browser clients: a wildcard or reflected origin with credentials lets a malicious site read authenticated responses. Real API protection is authentication, authorization and rate limiting.</p></div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How would you structure an Express codebase for a team of 8?</div>
  <div class="qa-answer"><p>Feature modules (<code>modules/bookings</code>) each with router, service, repository and schemas; a composition root that builds dependencies; <code>createApp(deps)</code> that owns middleware order; <code>server.ts</code> that only listens. Typed config validated at boot. Typed <code>AppError</code>s and a single error handler. Services never import Express. That gives unit tests at the service level, supertest at the HTTP level, and a clear place for each change. If the team keeps re-inventing DI and module boundaries, that's the signal to consider NestJS.</p></div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How do you handle a 2 GB upload?</div>
  <div class="qa-answer"><p>Ideally, not through the API: return a presigned S3 URL (or multipart presigned parts) so the client uploads directly, and process via the S3 event. If it must pass through: stream with busboy into a multipart S3 upload, enforce <code>fileSize</code> limits on the stream, bound concurrency, and never use memory storage. Also raise the timeouts only on that route, and make sure the proxy in front (nginx <code>client_max_body_size</code>, API Gateway payload limits) allows it — API Gateway in particular has a small max payload, so presigned URLs are the standard answer on AWS.</p></div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Walk me through graceful shutdown.</div>
  <div class="qa-answer"><p>On SIGTERM: flip readiness to failing so the LB stops routing new requests; call <code>server.close()</code> so no new connections are accepted while in-flight requests finish; close idle keep-alive sockets; set a hard deadline shorter than the orchestrator's grace period that force-closes remaining connections; then close DB pools, flush logs and queue consumers, and exit. Order matters: resources close only after the requests using them finish. Without this, every deploy produces a burst of 502s.</p></div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Sporadic 502s from the ALB, only at low traffic. What's going on?</div>
  <div class="qa-answer"><p>Classic keep-alive mismatch. The ALB keeps idle connections to targets for its idle timeout (60s default), but Node closes idle sockets after its own <code>keepAliveTimeout</code> (5s by default). The ALB reuses a socket Node just closed → 502. It's worse at low traffic because sockets sit idle longer. Fix: <code>server.keepAliveTimeout</code> greater than the LB idle timeout (e.g. 65s) and <code>headersTimeout</code> slightly above that.</p></div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. How do you test Express apps?</div>
  <div class="qa-answer"><p>Three layers. Services: plain unit tests with fake repositories. HTTP: supertest against <code>createApp(fakeDeps)</code> — exercises the real middleware order, validation, status codes and error shape without a port. Integration: the same supertest suite against real Postgres/Redis in containers to catch SQL and transaction bugs. I'd specifically test the unhappy paths: 400 field paths, 401/403, 404 for unknown routes, 413 oversized body, and that 500s never leak stacks. More in <a href="#/topic/test-api">API Testing</a>.</p></div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Express vs Fastify vs NestJS — which would you pick for a new service?</div>
  <div class="qa-answer"><p>Depends on team and service shape. A small webhook receiver or LLM proxy: Express or Hono — minimal, everyone knows it. A throughput-heavy JSON API where serialization cost shows up in profiles: Fastify with JSON schemas. A product backend with many modules, multiple developers, queues and RBAC: NestJS (optionally on the Fastify adapter) because DI, module boundaries and the guard/interceptor model stop each developer inventing their own. I'd also say the framework rarely dominates latency — the database usually does.</p></div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. (FDE) A customer says "your API is randomly slow — some requests take 30 seconds". What do you do?</div>
  <div class="qa-answer"><p>First get specifics: which endpoints, time window, request ids, is it the client's p99 or every request? Then check our side: request logs keyed by request id (duration, status), and whether 30s matches a timeout somewhere — 30s is a smell (a default client or LB timeout, or a DB lock wait). Look at event-loop lag metrics (a blocking sync call stalls everything on the pod, so slowness is "random" across endpoints), DB pool saturation (requests queue waiting for a connection), and slow upstreams without timeouts. Reproduce with the customer's payload size — maybe they send large bodies or huge result pages. Fix the root cause (index, timeout + retry with budget, offload CPU work), add a dashboard and an alert on p99 per route, and report back with the request ids and what changed.</p></div>
</div>

<h3>Follow-ups interviewers love</h3>
<ul>
  <li>"Why does code after <code>next()</code> not run after the response?" (Express's <code>next</code> isn't promise-returning; use <code>res.on('finish')</code>.)</li>
  <li>"How do you share request context without passing <code>req</code> everywhere?" (AsyncLocalStorage.)</li>
  <li>"Where does authorization live?" (Role checks in middleware; resource/tenant checks in the service and queries.)</li>
  <li>"How do you version the API?" (URL prefix routers <code>/v1</code>, <code>/v2</code> mounted side by side — see <a href="#/topic/api-versioning">API Versioning</a>.)</li>
</ul>

<div class="qa-block">
  <div class="qa-question">Q13. Why does trust proxy matter for rate limiting, and what goes wrong if you set it to true?</div>
  <div class="qa-answer">
    <p>Behind a load balancer the TCP peer is the LB, and the real client IP is in <code>X-Forwarded-For</code>. <code>app.set('trust proxy', n)</code> tells Express how many proxy hops to trust when computing <code>req.ip</code>, <code>req.protocol</code> and <code>req.secure</code>. With the default <code>false</code>, <code>req.ip</code> is the LB's address, so an IP-keyed rate limiter sees every user as one client. With <code>true</code> Express trusts everything, so a client can spoof <code>X-Forwarded-For</code> and dodge the limit. The correct setting is the exact number of hops (e.g. <code>1</code> behind one ALB or nginx) or the proxy CIDRs; and the limiter also needs a shared store like Redis, since the default in-memory store is per process.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q14. How would you stream a large CSV export with bounded memory, and what happens when the client disconnects?</div>
  <div class="qa-answer">
    <p>Read rows from a DB cursor as an object-mode <code>Readable</code>, convert them with a <code>Transform</code> into CSV lines, and connect everything with <code>pipeline(rows, toCsv, res)</code> from <code>node:stream/promises</code>. <code>pipeline</code> respects backpressure, pausing the cursor when the client's socket buffer is full, and destroys all the streams on error or client abort, so nothing leaks. Hand-wiring <code>rows.on('data', d =&gt; res.write(d))</code> ignores the return value of <code>write()</code> and buffers unboundedly for slow clients. For uploads, the same idea applies: stream with busboy into a multipart S3 upload with a <code>fileSize</code> limit, or better, hand out a presigned S3 URL.</p>
  </div>
</div>
` },

  ]
});
