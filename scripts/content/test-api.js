window.PREP_SITE.registerTopic({
  id: "test-api",
  module: "testing",
  title: "API Testing",
  estimatedReadTime: "45 min",
  tags: ["api-testing","supertest","testcontainers","pact","contract-testing","newman","nock","msw","k6","rbac","integration-tests"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Test an API <strong>over HTTP, against a real database, with real auth and validated response schemas</strong>, faking only third-party network edges — then add contracts for consumers you don't deploy, smoke tests per environment, and thresholds-based load tests.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>API tests prove the HTTP contract from the outside in</strong> &mdash; status codes, response shapes, auth rules, side effects, performance. For a backend it is the highest-return layer: one request exercises routing, middleware, validation, business logic and the DB together.</li>
    <li>Export the app (<code>createApp(deps)</code>) without <code>listen</code>; drive it in-process with <strong>supertest</strong>.</li>
    <li>Real DB via <strong>Testcontainers</strong>, same engine + major version as prod, real migrations; never SQLite-for-Postgres.</li>
    <li>Isolation: one container per run, schema per worker, truncate per test, factories instead of a shared seed, injected clock.</li>
    <li>Assert <strong>status + schema (zod <code>.strict()</code>/OpenAPI) + key values + side effects</strong>; strict schemas catch data leaks.</li>
    <li>RBAC as a <strong>role × endpoint matrix</strong>; cross-tenant → 404; plus bad-token cases.</li>
    <li><strong>Mock only what you don't own</strong> &mdash; never your own DB in integration tests. Fake third parties with <strong>nock</strong> (<code>disableNetConnect</code>, <code>isDone</code>) or <strong>MSW</strong> (<code>onUnhandledRequest: 'error'</code>); test timeouts, 429, 5xx.</li>
    <li>A concurrency test (<code>Promise.all</code> of identical requests) proves the DB constraint, not the app-level check.</li>
    <li><strong>Pact</strong>: consumer records minimal expectations with matchers → broker → provider verifies with state handlers → <code>can-i-deploy</code>.</li>
    <li><strong>Newman</strong> for post-deploy smoke; <strong>k6</strong> with thresholds (p95, error rate) against staging with realistic data.</li>
    <li>Mantra: <strong>contracts protect the clients you can't see; load tests protect the ones you can't count.</strong></li>
    <li>Async side effects: assert on the outbox or poll with a deadline — never sleep.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Mocking your own database and asserting only status codes</strong> — the suite is fast and green while the real SQL leaks another tenant's rows, the overlap check races, and the response quietly gains a <code>passwordHash</code> field.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Most of my API tests are supertest against a real Postgres in a container — I mock only what I don't own, like the payment provider."</div>
  <div class="revision-say">"Every endpoint gets a role-by-status matrix, and cross-tenant access returns 404 so we never confirm the resource exists."</div>
  <div class="revision-say">"For consumers we can't redeploy — mobile apps, partners — I use consumer-driven contracts and gate releases with can-i-deploy."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What "API testing" covers</h3>
<p>Anything that drives your service through its <strong>public interface</strong> (HTTP/GraphQL/gRPC) and asserts on what a client would observe: the response (status, headers, body shape, error format) and the <strong>side effects</strong> (row written, event published, email queued). It sits between unit tests of pure functions and full UI E2E (<a href="#/topic/test-e2e">E2E testing</a>).</p>

<h3>Why it's the sweet spot for backend code</h3>
<ul>
  <li><strong>Most backend bugs live in the seams</strong> — middleware ordering, a missing <code>await</code>, an ORM query that returns the wrong tenant's rows, a validation rule that 500s instead of 400s. Unit tests with mocked repositories can't see these.</li>
  <li><strong>The contract is the product.</strong> A mobile client shipped 6 months ago can't be hot-fixed; a renamed field breaks it in production. API tests pin the contract.</li>
  <li><strong>They survive refactors.</strong> Rewrite the service layer from Express to NestJS and the supertest suite still runs unchanged — the HTTP contract didn't move.</li>
  <li><strong>They are fast enough.</strong> In-process supertest + a containerised Postgres runs hundreds of tests in tens of seconds.</li>
</ul>
<p>This is the backend equivalent of the "Testing Trophy" argument in <a href="#/topic/test-strategies">Test Strategies</a>: integration tests give the most confidence per minute.</p>

<h3>What each tool catches</h3>
<table>
  <thead><tr><th>Layer / tool</th><th>Catches</th><th>Misses</th><th>Runs</th></tr></thead>
  <tbody>
    <tr><td>Unit (Vitest/Jest) on services</td><td>Business-rule logic, edge maths, pure mapping</td><td>Routing, middleware, SQL, serialisation</td><td>Every save</td></tr>
    <tr><td>Integration (supertest + Testcontainers)</td><td>Handler + middleware + validation + real SQL + auth</td><td>Network config, real third parties, infra</td><td>Every PR</td></tr>
    <tr><td>Schema validation</td><td>Shape drift, undocumented fields, wrong types</td><td>Wrong values</td><td>Inside integration tests</td></tr>
    <tr><td>Contract (Pact)</td><td>Breaking changes for specific consumers</td><td>Business correctness</td><td>Every PR on both sides + before deploy</td></tr>
    <tr><td>Smoke (Postman/Newman)</td><td>Deployed env broken: config, secrets, DNS, gateway</td><td>Edge cases</td><td>After each deploy</td></tr>
    <tr><td>Load (k6)</td><td>Latency/throughput regressions, pool exhaustion, N+1</td><td>Functional bugs</td><td>Nightly / pre-release</td></tr>
    <tr><td>Fuzz / property (Schemathesis)</td><td>500s on unexpected inputs from the OpenAPI spec</td><td>Logic bugs with valid input</td><td>Nightly</td></tr>
  </tbody>
</table>

<div class="callout note">
  <div class="callout-title">Where this sits among the testing topics</div>
  <p>Test doubles and MSW basics are in <a href="#/topic/test-mocking">Mocking Strategies</a>; Jest/Vitest runner mechanics in <a href="#/topic/test-jest-rtl">Jest + RTL</a>; portfolio and CI shape in <a href="#/topic/test-strategies">Test Strategies</a>. This topic is the server side: how to test an HTTP API you are shipping.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>The API test pyramid</h3>
<div class="diagram">
<pre>
                    ┌──────────────┐
                    │  Load (k6)   │  few, slow, staging      ── "does it hold at 200 rps?"
                 ┌──┴──────────────┴──┐
                 │ Smoke (Newman) on  │  ~10 requests per env    ── "is the deploy alive?"
                 │ deployed env       │
              ┌──┴────────────────────┴──┐
              │ Contract (Pact)          │  per consumer          ── "did we break the app?"
           ┌──┴──────────────────────────┴──┐
           │ Integration: supertest + real  │  MOST tests here      ── "does the endpoint work?"
           │ DB (Testcontainers) + nock     │
        ┌──┴────────────────────────────────┴──┐
        │ Unit: services, validators, mappers  │  fast, many           ── "is the rule right?"
        └──────────────────────────────────────┘
</pre>
</div>
<p>Unlike the classic UI pyramid, the <em>integration</em> layer is the widest by value for APIs: it's cheap enough to run on every PR and realistic enough to trust.</p>

<h3>Real or fake? Decide per dependency</h3>
<table>
  <thead><tr><th>Dependency</th><th>In integration tests</th><th>Why</th></tr></thead>
  <tbody>
    <tr><td>Your database</td><td><strong>Real</strong> (container, same engine + major version as prod)</td><td>SQL semantics, constraints, transactions, JSON operators differ in SQLite/in-memory fakes</td></tr>
    <tr><td>Your cache (Redis)</td><td>Real container, or skip the cache path</td><td>Cheap to run; TTL bugs are real bugs</td></tr>
    <tr><td>Your queue (SQS/Kafka)</td><td>LocalStack / Kafka container, or assert on an outbox table</td><td>Test that you <em>publish</em>; consumers get their own tests (<a href="#/topic/be-queues">queues</a>)</td></tr>
    <tr><td>Third-party HTTP APIs</td><td><strong>Fake</strong> (nock / MSW / WireMock)</td><td>Rate limits, cost, flakiness, can't force error cases</td></tr>
    <tr><td>Auth provider (Cognito/Auth0)</td><td>Fake: sign test JWTs with a test key; real for a few smoke tests</td><td>Need every role on demand</td></tr>
    <tr><td>Clock</td><td>Injectable / fake timers</td><td>Bookings "in the future" become "in the past" next week</td></tr>
  </tbody>
</table>

<h3>The anatomy of one good API test</h3>
<div class="diagram">
<pre>
 ARRANGE   seed DB via factories (user, room)     token = signToken({ role: 'member' })
    │      nock('https://calendar.example')...    (fake only the outside world)
    ▼
 ACT       await request(app).post('/bookings').set('Authorization', 'Bearer ' + token).send(body)
    │
    ▼
 ASSERT    1. status 201
           2. body matches BookingResponse schema   (shape)
           3. body values: id, roomId, status       (meaning)
           4. side effect: row exists in DB, outbox event written
           5. external calls: nock scope isDone()
</pre>
</div>

<h3>Consumer-driven contracts in one picture</h3>
<div class="diagram">
<pre>
 CONSUMER (RN tablet app) CI                     PROVIDER (Bookings API) CI
 ───────────────────────────                     ─────────────────────────────
 unit test against Pact mock server              start real API + test DB
   │ records interactions → pact JSON            fetch pacts from broker
   ▼                                              │ replay each request,
 publish pact to Pact Broker ──────────────────►  │ set "provider state" first,
   (version = git sha, branch)                    │ compare responses to expectations
                                                  ▼
                                              publish verification result
 before deploying either side:
   pact-broker can-i-deploy --pacticipant X --version SHA --to-environment production
</pre>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. Make the app testable: export it, don't listen</h3>
<pre><code class="language-ts">// src/app.ts — build the app; no .listen() here
import express from 'express';
import { bookingsRouter } from './bookings/router';
import { authenticate } from './auth/middleware';
import { errorHandler } from './errors';
import type { Deps } from './deps';

export function createApp(deps: Deps) {
  const app = express();
  app.use(express.json({ limit: '100kb' }));
  app.use(authenticate(deps.jwtVerifier));
  app.use('/bookings', bookingsRouter(deps));
  app.use(errorHandler);
  return app;
}

// src/server.ts — the only place that listens
import { createApp } from './app';
import { buildDeps } from './deps';
createApp(buildDeps(process.env)).listen(Number(process.env.PORT ?? 3000));</code></pre>
<p>Injecting <code>deps</code> (DB, clock, HTTP clients, JWT verifier) is what makes the next sections easy. Same idea in NestJS via <code>Test.createTestingModule</code> and <code>overrideProvider</code> (<a href="#/topic/be-nestjs">NestJS (Advanced)</a>).</p>

<h3>2. supertest basics</h3>
<pre><code class="language-ts">import request from 'supertest';

const res = await request(app)
  .post('/bookings')
  .set('Authorization', 'Bearer ' + token)
  .send({ roomId: 'r_42', title: 'Stand-up', startsAt: '2030-01-01T10:00:00Z', endsAt: '2030-01-01T10:15:00Z' })
  .expect('Content-Type', /json/)
  .expect(201);

expect(res.body).toMatchObject({ roomId: 'r_42', status: 'CONFIRMED' });</code></pre>
<p>supertest binds the app to an ephemeral port per request — no port clashes across parallel workers. For NestJS pass <code>app.getHttpServer()</code>; for Fastify, use its <code>inject()</code> instead.</p>

<h3>3. A real database with Testcontainers</h3>
<pre><code class="language-ts">// test/global-setup.ts  (Vitest globalSetup)
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'node:child_process';

let container: StartedPostgreSqlContainer;

export default async function setup() {
  container = await new PostgreSqlContainer('postgres:16-alpine').start();   // match prod major version
  process.env.DATABASE_URL = container.getConnectionUri();
  execSync('npx prisma migrate deploy', { env: process.env, stdio: 'inherit' }); // real migrations
  return async () =&gt; { await container.stop(); };                            // teardown
}</code></pre>
<p>Env vars set in <code>globalSetup</code> are visible to test workers in Vitest; if your runner differs, use its provide/inject mechanism (verify for your Vitest/Jest version). Startup cost is a few seconds once per run, not per test.</p>

<h4>Isolation strategies</h4>
<table>
  <thead><tr><th>Strategy</th><th>How</th><th>Pros</th><th>Cons</th></tr></thead>
  <tbody>
    <tr><td>Truncate between tests</td><td><code>TRUNCATE ... RESTART IDENTITY CASCADE</code> in <code>beforeEach</code></td><td>Simple, works with any code</td><td>Serial per DB; slower with many tables</td></tr>
    <tr><td>Transaction rollback</td><td>Begin tx before test, roll back after; app must use the same connection</td><td>Very fast</td><td>Breaks if code under test opens its own transactions or uses a pool</td></tr>
    <tr><td>Database/schema per worker</td><td>Create <code>test_1</code>, <code>test_2</code>… keyed by worker id</td><td>Parallel workers, no interference</td><td>More setup; migrate each</td></tr>
    <tr><td>Unique data per test</td><td>Random tenant/org id per test, never clean</td><td>Parallel, zero cleanup</td><td>Queries must be tenant-scoped; counts across tables unreliable</td></tr>
  </tbody>
</table>
<p>Practical default: one container per run, schema-per-worker, truncate in <code>beforeEach</code>.</p>

<h3>4. Factories, not fixtures files</h3>
<pre><code class="language-ts">// test/factories.ts
import { randomUUID } from 'node:crypto';
import { db } from '../src/db';

export async function makeUser(overrides: Partial&lt;{ role: 'member' | 'admin'; orgId: string }&gt; = {}) {
  return db.user.create({
    data: { id: randomUUID(), email: randomUUID() + '@test.dev', role: 'member', orgId: 'org_1', ...overrides },
  });
}

export async function makeRoom(orgId = 'org_1') {
  return db.room.create({ data: { id: randomUUID(), name: 'Room ' + randomUUID().slice(0, 4), capacity: 6, orgId } });
}</code></pre>
<p>Each test creates exactly what it needs and reads it back by ID — no shared "seed.sql" that every test silently depends on.</p>

<h3>5. Auth in tests</h3>
<pre><code class="language-ts">// test/auth.ts — sign tokens with a test key the app is configured to trust
import { SignJWT } from 'jose';
const key = new TextEncoder().encode('test-only-secret-at-least-32-bytes-long!!');

export function tokenFor(user: { id: string; role: string; orgId: string }) {
  return new SignJWT({ role: user.role, orgId: user.orgId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(key);
}</code></pre>
<p>Production uses RS256/JWKS from your IdP; tests inject a verifier configured with the test key. Also write a handful of tests for <em>bad</em> tokens: expired, wrong signature, missing claim, <code>alg: none</code>. See <a href="#/topic/api-auth-rbac">Auth &amp; RBAC</a> for the model being tested.</p>

<h3>6. Response schema validation</h3>
<pre><code class="language-ts">// shared/schemas.ts — the same zod schemas the API uses to build/serialise responses
import { z } from 'zod';
export const BookingResponse = z.object({
  id: z.string(),
  roomId: z.string(),
  title: z.string(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  status: z.enum(['CONFIRMED', 'CANCELLED']),
}).strict();                                      // fail on unexpected (leaked) fields

// in a test
const parsed = BookingResponse.safeParse(res.body);
expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);</code></pre>
<p>If you publish OpenAPI, validate responses against the spec instead (e.g. <code>jest-openapi</code>'s <code>toSatisfyApiSpec</code>, or compile the schema with Ajv). This also catches the spec drifting from reality. <code>.strict()</code> is the cheapest data-leak detector you will ever write.</p>

<h3>7. Mocking third-party APIs: nock vs MSW vs WireMock</h3>
<table>
  <thead><tr><th></th><th>nock</th><th>MSW (<code>msw/node</code>)</th><th>WireMock / Mockoon / Prism</th></tr></thead>
  <tbody>
    <tr><td>Where it intercepts</td><td>Node HTTP layer in-process</td><td>Request interception in-process (Node) or Service Worker (browser)</td><td>Separate HTTP server</td></tr>
    <tr><td>Best for</td><td>Backend tests, strict "this exact call happened"</td><td>Sharing handlers between frontend and backend tests</td><td>Polyglot teams, docker-compose envs, OpenAPI-driven stubs (Prism)</td></tr>
    <tr><td>Native <code>fetch</code></td><td>Older nock only patched <code>http</code>/<code>https</code>; nock 14 added fetch support via MSW's interceptors — verify for your version</td><td>Supported</td><td>N/A (real HTTP)</td></tr>
    <tr><td>Block real network</td><td><code>nock.disableNetConnect()</code></td><td><code>onUnhandledRequest: 'error'</code></td><td>Point base URL at stub</td></tr>
  </tbody>
</table>
<pre><code class="language-ts">// nock: payment provider returns a decline
import nock from 'nock';

beforeAll(() =&gt; { nock.disableNetConnect(); nock.enableNetConnect('127.0.0.1'); }); // allow supertest + DB
afterEach(() =&gt; { nock.cleanAll(); });

it('maps a provider decline to 402', async () =&gt; {
  const scope = nock('https://payments.example.com')
    .post('/v1/charges', (body) =&gt; body.amount === 5000)
    .reply(402, { error: { code: 'card_declined' } });

  await request(app).post('/checkout').set('Authorization', 'Bearer ' + token)
    .send({ amount: 5000 }).expect(402);
  expect(scope.isDone()).toBe(true);           // the call really happened
});

// MSW equivalent (v2 API)
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
const server = setupServer(
  http.post('https://payments.example.com/v1/charges', () =&gt;
    HttpResponse.json({ error: { code: 'card_declined' } }, { status: 402 })),
);
beforeAll(() =&gt; server.listen({ onUnhandledRequest: 'error' }));
afterEach(() =&gt; server.resetHandlers());
afterAll(() =&gt; server.close());</code></pre>
<p>Always test the unhappy paths you can't trigger for real: timeouts (<code>.delay()</code> in nock), 429 with <code>Retry-After</code>, 5xx, malformed JSON. That is where your retry and circuit-breaker logic lives (<a href="#/topic/be-resilience">resilience</a>).</p>

<h3>8. Contract testing with Pact</h3>
<ul>
  <li><strong>Consumer test</strong>: the client code calls a Pact mock server; Pact records each interaction (request + minimal expected response) into a pact file.</li>
  <li><strong>Matchers, not values</strong>: <code>like('b_1')</code> means "any string", <code>eachLike(...)</code> means "array of at least one of these". The consumer specifies only fields it actually reads — that's what lets the provider add fields freely.</li>
  <li><strong>Provider states</strong>: <code>given('room r_42 has one upcoming booking')</code> → the provider runs a state handler that seeds the DB before replay.</li>
  <li><strong>Pact Broker / PactFlow</strong>: stores pacts and verification results per version, branch and environment; <code>can-i-deploy</code> answers "is this version compatible with what's in production?"</li>
  <li><strong>Pact vs schema/OpenAPI</strong>: OpenAPI says what the provider <em>offers</em>; Pact says what each consumer <em>uses</em>. Bi-directional contract testing (PactFlow) compares a consumer pact to the provider's OpenAPI spec instead of replaying.</li>
</ul>

<h3>9. Postman collections in CI with Newman</h3>
<pre><code class="language-bash">npx newman run tests/postman/bookings.postman_collection.json   -e tests/postman/staging.postman_environment.json   --env-var "token=$SMOKE_TOKEN"   --reporters cli,junit --reporter-junit-export results/newman.xml   --bail</code></pre>
<pre><code class="language-js">// Postman "Tests" tab for POST /bookings
pm.test('status is 201', () =&gt; pm.response.to.have.status(201));
pm.test('has id', () =&gt; pm.expect(pm.response.json().id).to.be.a('string'));
pm.collectionVariables.set('bookingId', pm.response.json().id);   // chain into DELETE</code></pre>
<p>Use Newman for <strong>post-deploy smoke tests</strong> and for sharing executable examples with QA or a customer's integration team. Don't make it your main regression suite: collections are JSON blobs that diff and refactor badly, and they can't seed a DB or fake a third party.</p>

<h3>10. Load testing with k6</h3>
<pre><code class="language-js">// load/bookings.js — run: k6 run -e BASE_URL=https://staging.example.com -e TOKEN=... load/bookings.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },    // ramp up to 50 virtual users
    { duration: '3m', target: 50 },    // hold
    { duration: '1m', target: 0 },     // ramp down
  ],
  thresholds: {
    http_req_failed: ['rate&lt;0.01'],                    // &lt; 1% errors
    'http_req_duration{name:availability}': ['p(95)&lt;300'], // p95 under 300 ms
  },
};

export default function () {
  const res = http.get(__ENV.BASE_URL + '/rooms/r_42/availability', {
    headers: { Authorization: 'Bearer ' + __ENV.TOKEN },
    tags: { name: 'availability' },
  });
  check(res, { 'status 200': (r) =&gt; r.status === 200 });
  sleep(1);                                              // think time
}</code></pre>
<p>k6 exits non-zero when a threshold fails, so it can gate a pipeline. Test types: <strong>smoke</strong> (1–2 VUs, sanity), <strong>load</strong> (expected peak), <strong>stress</strong> (beyond peak to find the knee), <strong>soak</strong> (hours, find leaks), <strong>spike</strong> (sudden burst — think 9:00 am when every meeting-room tablet wakes up).</p>

<h3>11. Wiring it into CI</h3>
<pre><code class="language-yaml"># .github/workflows/api-tests.yml
name: api-tests
on: [pull_request]
jobs:
  integration:
    runs-on: ubuntu-latest            # Docker available → Testcontainers works
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run test:integration -- --reporter=junit --outputFile=results/junit.xml
      - run: npm run test:pact:provider
        env:
          PACT_BROKER_BASE_URL: \${{ secrets.PACT_BROKER_BASE_URL }}
          PACT_BROKER_TOKEN: \${{ secrets.PACT_BROKER_TOKEN }}
          GIT_SHA: \${{ github.sha }}</code></pre>
<p>Smoke (Newman) runs in the deploy workflow after each environment rollout; k6 runs nightly against staging. Pipeline design is covered in <a href="#/topic/cloud-cicd">CI/CD</a>.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<p>Worked suite for a meeting-room <strong>Bookings API</strong> (Express + Prisma + Postgres) consumed by an RN tablet app and a web console. Rules: members book rooms in their org; owners or admins cancel; slots can't overlap; <code>POST /bookings</code> accepts an <code>Idempotency-Key</code>.</p>

<h3>Example 1 — test harness</h3>
<pre><code class="language-ts">// test/harness.ts
import { createApp } from '../src/app';
import { db } from '../src/db';
import { testJwtVerifier } from './auth';

export const app = createApp({
  db,
  jwtVerifier: testJwtVerifier,
  clock: () =&gt; new Date('2030-01-01T09:00:00Z'),   // frozen "now" — no flaky dates
  calendarClient: undefined as never,               // set per test when needed
});

export async function resetDb() {
  await db.$executeRawUnsafe('TRUNCATE "Booking", "Room", "User", "IdempotencyKey" RESTART IDENTITY CASCADE');
}</code></pre>

<h3>Example 2 — happy path + side effect</h3>
<pre><code class="language-ts">// test/bookings.create.test.ts
import request from 'supertest';
import { app, resetDb } from './harness';
import { makeUser, makeRoom } from './factories';
import { tokenFor } from './auth';
import { BookingResponse } from '../shared/schemas';
import { db } from '../src/db';

beforeEach(resetDb);

it('creates a booking and returns the contract shape', async () =&gt; {
  const user = await makeUser();
  const room = await makeRoom();

  const res = await request(app)
    .post('/bookings')
    .set('Authorization', 'Bearer ' + (await tokenFor(user)))
    .send({ roomId: room.id, title: 'Stand-up', startsAt: '2030-01-01T10:00:00Z', endsAt: '2030-01-01T10:15:00Z' })
    .expect(201);

  expect(BookingResponse.safeParse(res.body).success).toBe(true);    // shape
  expect(res.body).toMatchObject({ roomId: room.id, status: 'CONFIRMED' }); // meaning
  expect(res.headers.location).toBe('/bookings/' + res.body.id);

  const row = await db.booking.findUnique({ where: { id: res.body.id } });  // side effect
  expect(row?.ownerId).toBe(user.id);
});</code></pre>

<h3>Example 3 — validation and conflict paths</h3>
<pre><code class="language-ts">it.each([
  ['missing title', { title: undefined }, 'title'],
  ['end before start', { endsAt: '2030-01-01T09:30:00Z' }, 'endsAt'],
  ['in the past', { startsAt: '2029-12-31T10:00:00Z', endsAt: '2029-12-31T10:30:00Z' }, 'startsAt'],
])('400 when %s', async (_name, patch, field) =&gt; {
  const user = await makeUser(); const room = await makeRoom();
  const body = { roomId: room.id, title: 'x', startsAt: '2030-01-01T10:00:00Z', endsAt: '2030-01-01T11:00:00Z', ...patch };
  const res = await request(app).post('/bookings')
    .set('Authorization', 'Bearer ' + (await tokenFor(user))).send(body).expect(400);
  expect(res.body.error.fields).toHaveProperty(field);           // consistent error envelope
});

it('409 when the slot overlaps an existing booking', async () =&gt; {
  const user = await makeUser(); const room = await makeRoom();
  const auth = 'Bearer ' + (await tokenFor(user));
  const slot = { roomId: room.id, title: 'A', startsAt: '2030-01-01T10:00:00Z', endsAt: '2030-01-01T11:00:00Z' };
  await request(app).post('/bookings').set('Authorization', auth).send(slot).expect(201);
  await request(app).post('/bookings').set('Authorization', auth)
    .send({ ...slot, title: 'B', startsAt: '2030-01-01T10:30:00Z', endsAt: '2030-01-01T11:30:00Z' })
    .expect(409);
});

it('two concurrent requests for the same slot: exactly one wins', async () =&gt; {
  const user = await makeUser(); const room = await makeRoom();
  const auth = 'Bearer ' + (await tokenFor(user));
  const slot = { roomId: room.id, title: 'race', startsAt: '2030-01-01T12:00:00Z', endsAt: '2030-01-01T13:00:00Z' };
  const results = await Promise.all([1, 2, 3, 4, 5].map(() =&gt;
    request(app).post('/bookings').set('Authorization', auth).send(slot)));
  const codes = results.map((r) =&gt; r.status).sort();
  expect(codes).toEqual([201, 409, 409, 409, 409]);             // proves the DB constraint, not just the check
});</code></pre>
<p>The concurrency test is the one that catches "check-then-insert without a constraint" — a mocked repository could never find that bug.</p>

<h3>Example 4 — idempotency</h3>
<pre><code class="language-ts">it('replays the same response for a repeated Idempotency-Key', async () =&gt; {
  const user = await makeUser(); const room = await makeRoom();
  const auth = 'Bearer ' + (await tokenFor(user));
  const send = () =&gt; request(app).post('/bookings').set('Idempotency-Key', 'tablet-r42-0001');
  const body = { roomId: room.id, title: 'retry', startsAt: '2030-01-01T14:00:00Z', endsAt: '2030-01-01T14:30:00Z' };

  const first = await send().set('Authorization', auth).send(body).expect(201);
  const second = await send().set('Authorization', auth).send(body).expect(201);
  expect(second.body.id).toBe(first.body.id);
  expect(await db.booking.count()).toBe(1);
});</code></pre>
<p>Tablets on flaky Wi-Fi retry; this test pins the guarantee that retries don't double-book.</p>

<h3>Example 5 — the RBAC matrix</h3>
<pre><code class="language-ts">type Role = 'anonymous' | 'member' | 'owner' | 'admin' | 'otherOrgAdmin';

const matrix: Array&lt;[string, 'get' | 'delete', (id: string) =&gt; string, Record&lt;Role, number&gt;]&gt; = [
  ['read booking',   'get',    (id) =&gt; '/bookings/' + id, { anonymous: 401, member: 200, owner: 200, admin: 200, otherOrgAdmin: 404 }],
  ['cancel booking', 'delete', (id) =&gt; '/bookings/' + id, { anonymous: 401, member: 403, owner: 204, admin: 204, otherOrgAdmin: 404 }],
];

describe.each(matrix)('%s', (_label, method, path, expected) =&gt; {
  it.each(Object.keys(expected) as Role[])('as %s', async (role) =&gt; {
    const owner = await makeUser();
    const room = await makeRoom();
    const booking = await db.booking.create({ data: {
      roomId: room.id, ownerId: owner.id, title: 't', status: 'CONFIRMED',
      startsAt: new Date('2030-01-01T10:00:00Z'), endsAt: new Date('2030-01-01T11:00:00Z') } });

    const actor =
      role === 'owner' ? owner :
      role === 'member' ? await makeUser() :
      role === 'admin' ? await makeUser({ role: 'admin' }) :
      role === 'otherOrgAdmin' ? await makeUser({ role: 'admin', orgId: 'org_2' }) : null;

    let req = request(app)[method](path(booking.id));
    if (actor) req = req.set('Authorization', 'Bearer ' + (await tokenFor(actor)));
    const res = await req;
    expect(res.status).toBe(expected[role]);
  });
});</code></pre>
<p>Ten tests from one table. Note the cross-tenant case returns <strong>404, not 403</strong> — don't confirm that another org's resource exists. Adding a new role means adding a column, and a forgotten permission shows up as a red cell.</p>

<h3>Example 6 — third-party calendar sync with nock</h3>
<pre><code class="language-ts">it('still confirms the booking when calendar sync times out, and queues a retry', async () =&gt; {
  nock('https://calendar.example.com')
    .post('/v1/events')
    .delay(5_000)                         // longer than the client's 2 s timeout
    .reply(201, { id: 'evt_1' });

  const user = await makeUser(); const room = await makeRoom();
  const res = await request(app).post('/bookings')
    .set('Authorization', 'Bearer ' + (await tokenFor(user)))
    .send({ roomId: room.id, title: 'sync', startsAt: '2030-01-01T15:00:00Z', endsAt: '2030-01-01T15:30:00Z' })
    .expect(201);

  const outbox = await db.outbox.findMany({ where: { aggregateId: res.body.id } });
  expect(outbox).toEqual([expect.objectContaining({ type: 'calendar.sync.retry' })]);
});</code></pre>

<h3>Example 7 — Pact consumer test (tablet app's API client)</h3>
<pre><code class="language-ts">// tablet-app/src/api/__tests__/bookings.pact.test.ts
import path from 'node:path';
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { BookingsClient } from '../bookingsClient';

const { like, eachLike } = MatchersV3;
const pact = new PactV3({
  consumer: 'RoomTabletApp',
  provider: 'BookingsAPI',
  dir: path.resolve(process.cwd(), 'pacts'),
});

it('fetches availability for its room', async () =&gt; {
  pact
    .given('room r_42 has one upcoming booking')
    .uponReceiving('a request for room availability')
    .withRequest({
      method: 'GET',
      path: '/rooms/r_42/availability',
      headers: { Authorization: like('Bearer device-token') },
    })
    .willRespondWith({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        roomId: 'r_42',
        bookings: eachLike({ id: like('b_1'), title: like('Stand-up'), startsAt: like('2030-01-01T10:00:00Z') }),
      },
    });

  await pact.executeTest(async (mockServer) =&gt; {
    const client = new BookingsClient(mockServer.url, 'device-token');
    const result = await client.availability('r_42');
    expect(result.bookings[0].title).toBe('Stand-up');
  });
});</code></pre>
<p>The consumer lists only <code>id</code>, <code>title</code>, <code>startsAt</code> — the fields the tablet renders. The provider can add <code>endsAt</code> or rename internal fields freely; renaming <code>title</code> fails verification.</p>

<h3>Example 8 — Pact provider verification</h3>
<pre><code class="language-ts">// bookings-api/test/pact.provider.test.ts
import { Verifier } from '@pact-foundation/pact';
import type { Server } from 'node:http';
import { app, resetDb } from './harness';
import { db } from '../src/db';

let server: Server;
beforeAll(() =&gt; new Promise&lt;void&gt;((r) =&gt; { server = app.listen(4010, r); }));
afterAll(() =&gt; new Promise&lt;void&gt;((r) =&gt; server.close(() =&gt; r())));

it('honours all consumer pacts', async () =&gt; {
  await new Verifier({
    provider: 'BookingsAPI',
    providerBaseUrl: 'http://127.0.0.1:4010',
    pactBrokerUrl: process.env.PACT_BROKER_BASE_URL,
    pactBrokerToken: process.env.PACT_BROKER_TOKEN,
    consumerVersionSelectors: [{ mainBranch: true }, { deployedOrReleased: true }],
    publishVerificationResult: process.env.CI === 'true',
    providerVersion: process.env.GIT_SHA,
    stateHandlers: {
      'room r_42 has one upcoming booking': async () =&gt; {
        await resetDb();
        await db.room.create({ data: { id: 'r_42', name: 'Everest', capacity: 6, orgId: 'org_1' } });
        await db.booking.create({ data: { id: 'b_1', roomId: 'r_42', ownerId: 'u_1', title: 'Stand-up',
          status: 'CONFIRMED', startsAt: new Date('2030-01-01T10:00:00Z'), endsAt: new Date('2030-01-01T10:15:00Z') } });
      },
    },
    // device tokens: inject a valid one for replayed requests
    requestFilter: (req, _res, next) =&gt; { req.headers.authorization = 'Bearer ' + process.env.PACT_DEVICE_TOKEN; next(); },
  }).verifyProvider();
}, 60_000);</code></pre>
<pre><code class="language-bash"># release gate in each repo's deploy job
pact-broker can-i-deploy --pacticipant BookingsAPI --version "$GIT_SHA" --to-environment production
pact-broker record-deployment --pacticipant BookingsAPI --version "$GIT_SHA" --environment production</code></pre>

<h3>Example 9 — fuzzing from the OpenAPI spec</h3>
<pre><code class="language-bash"># Schemathesis generates inputs from your spec and flags 5xx / schema violations
schemathesis run https://staging.example.com/openapi.json   --header "Authorization: Bearer $TOKEN" --checks all</code></pre>
<p>Nightly job. It reliably finds the "unexpected unicode / huge integer / null where object expected → 500" class of bugs. Exact CLI flags vary by version — check <code>schemathesis run --help</code>.</p>

<h3>Example 10 — testing an async side effect without sleeps</h3>
<pre><code class="language-ts">// poll until a condition holds, with a deadline — never sleep(2000) and hope
async function eventually&lt;T&gt;(fn: () =&gt; Promise&lt;T&gt;, ok: (v: T) =&gt; boolean, timeoutMs = 3000) {
  const start = Date.now();
  for (;;) {
    const v = await fn();
    if (ok(v)) return v;
    if (Date.now() - start &gt; timeoutMs) throw new Error('condition not met in ' + timeoutMs + 'ms');
    await new Promise((r) =&gt; setTimeout(r, 50));
  }
}

await eventually(() =&gt; db.notification.count({ where: { bookingId } }), (n) =&gt; n === 1);</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. Time and timezones</h3>
<p>"Book tomorrow at 10:00" tests break at midnight UTC, on DST changes, and when CI runs in a different timezone. Inject a clock, use fixed ISO timestamps with <code>Z</code>, and set <code>TZ=UTC</code> in the test script. Add one explicit test for a DST boundary if your domain cares (meeting rooms do).</p>

<h3>2. Parallel workers sharing one database</h3>
<p>Truncating in one worker wipes another worker's data mid-test → random failures. Use schema-per-worker (Vitest exposes a worker/pool id via env — check your version), or run integration files serially.</p>

<h3>3. Testcontainers in CI</h3>
<p>Needs a Docker daemon. GitHub-hosted Linux runners have one; some self-hosted/Kubernetes runners don't (use Docker-in-Docker, a remote Docker host, or Testcontainers Cloud). Testcontainers starts a "Ryuk" reaper container to clean up — some locked-down environments block it (it can be disabled via env var; you then own cleanup). Pin image tags; <code>postgres:latest</code> changes underneath you.</p>

<h3>4. Ordering in list endpoints</h3>
<p>Without an explicit <code>ORDER BY</code>, Postgres returns rows in no guaranteed order; a test asserting <code>body.items[0]</code> passes locally and fails in CI. Either the API should define an order (it should) or the test should sort before comparing. Test pagination boundaries: empty page, exactly one page, cursor of a deleted item.</p>

<h3>5. Mocks that never fire</h3>
<p>A nock interceptor that doesn't match (wrong path, body predicate) lets the code under test hit the real network — or throw an unhelpful connection error. Always <code>disableNetConnect()</code> and assert <code>scope.isDone()</code>; with MSW use <code>onUnhandledRequest: 'error'</code>.</p>

<h3>6. Pact provider states drift</h3>
<p>The consumer writes <code>given('user has an expired subscription')</code>; nobody implements the handler on the provider → verification fails with a confusing error. Treat state names as part of the contract; keep them few and generic.</p>

<h3>7. Rate limiting and security middleware in tests</h3>
<p>The rate limiter blocks your 50-test suite from one IP; helmet/CORS behave differently without an Origin header. Configure limits via deps (high in tests) but keep <em>one</em> test that proves the limiter returns 429 with <code>Retry-After</code>, and one that checks CORS headers for an allowed and a disallowed origin.</p>

<h3>8. File uploads and streaming</h3>
<p>supertest's <code>.attach('file', buffer, 'photo.jpg')</code> sends multipart. Test size limits (413), wrong MIME types (415) and that the stream is aborted, not buffered, for oversized files. For presigned-URL flows, test the signing endpoint, not S3.</p>

<h3>9. Eventual consistency</h3>
<p>Endpoints that enqueue work (email, sync, search indexing) can't be asserted immediately. Assert on the outbox/queue message, or poll with a deadline (Example 10). Never <code>sleep(2000)</code>.</p>

<h3>10. Load tests that lie</h3>
<p>Running k6 from a laptop over VPN measures your Wi-Fi. Caches warmed by the first run make the second look great. Load-testing an empty staging DB hides index problems that appear at 10M rows. Generate realistic data volume, run from a machine in the same region, and watch server-side metrics (<a href="#/topic/be-observability">observability</a>) alongside k6's client-side numbers.</p>

<h3>11. Error format consistency</h3>
<p>Validation errors return <code>{ error: { fields } }</code> but an uncaught exception returns Express's default HTML page. Add a test that forces an unexpected error (inject a failing dependency) and asserts a JSON 500 with a correlation ID and no stack trace.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>1. Asserting only the status code</h3>
<pre><code class="language-ts">// ❌ passes even if the body is {} or leaks passwordHash
await request(app).get('/users/me').expect(200);
// ✅ shape + meaning
const res = await request(app).get('/users/me').set('Authorization', auth).expect(200);
expect(UserResponse.strict().parse(res.body).email).toBe(user.email);</code></pre>

<h3>2. Mocking your own database in "integration" tests</h3>
<p>Mocking the repository/ORM means the SQL is never run: wrong joins, missing tenant filters and constraint violations go untested. Use a real DB; mock only the boundaries you don't own (<a href="#/topic/test-mocking">Mocking Strategies</a> — "mock the boundary").</p>

<h3>3. SQLite in tests, Postgres in prod</h3>
<p>Different type system, no <code>JSONB</code>, different locking, different case sensitivity. Bugs hide in exactly those differences. Containers made "same engine" cheap — use them.</p>

<h3>4. Tests that depend on each other</h3>
<p>Test 2 uses the booking created by test 1. Run test 2 alone (or in a different order, or in parallel) and it fails. Every test arranges its own data.</p>

<h3>5. Only testing happy paths</h3>
<p>Most production incidents are in the 4xx/5xx branches: expired token, cross-tenant access, duplicate submission, upstream timeout. A rough target: for every endpoint, at least one test each for 2xx, 400, 401, 403/404 and a conflict/upstream failure where relevant.</p>

<h3>6. Hitting real third-party sandboxes on every PR</h3>
<p>Sandboxes rate-limit, go down, and change. Run a small nightly suite against them (to catch provider-side changes) and use nock/MSW in PR tests.</p>

<h3>7. Giant response snapshots</h3>
<p><code>expect(res.body).toMatchSnapshot()</code> on a 300-line payload with timestamps and UUIDs: noisy diffs, reviewers press "u" to update. Assert on a schema plus the few values that matter.</p>

<h3>8. Using Pact as a functional test suite</h3>
<p>Pact verifies the <em>shape</em> consumers rely on, not business rules. Writing Pact interactions for every validation edge case creates a brittle, slow contract. Keep pacts minimal; business rules belong in provider integration tests.</p>

<h3>9. Secrets in Postman collections</h3>
<p>Exported collections and environments committed with real tokens. Use environment variables injected by CI (<code>--env-var</code>), and short-lived smoke-test credentials scoped to a test tenant.</p>

<h3>10. Load testing production without a plan</h3>
<p>A surprise 500 rps test against prod triggers autoscaling bills, alerts and real-user impact. Use staging with prod-like data, or agree a window, a kill switch and a test tenant with ops.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. How do you test a REST API you've built?</div>
  <div class="qa-answer">
    <p>Mostly with in-process integration tests: export the app, drive it with supertest, against a real Postgres in a Testcontainers container with real migrations. Each test seeds via factories, sends a request with a signed test token, and asserts status, response schema (zod <code>.strict()</code>), key values, and DB side effects. Third-party HTTP is faked with nock or MSW. On top: Pact for consumers I don't deploy with, Newman smoke after deploy, and k6 for performance on staging. Pure business rules get plain unit tests.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Why not just mock the database? It's faster.</div>
  <div class="qa-answer">
    <p>Because the bugs I care about are in the SQL and the constraints: missing tenant filter, wrong join, race conditions that only a unique/exclusion constraint prevents, transaction isolation. A mocked repository returns whatever I told it to. A containerised Postgres starts once per run in a few seconds and each test is still milliseconds — the speed difference is small, the confidence difference is large.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. How do you keep integration tests isolated and parallel?</div>
  <div class="qa-answer">
    <p>One container per run, a schema or database per worker, and truncate in <code>beforeEach</code>. Factories create unique data, nothing depends on a shared seed, the clock is injected, and every list endpoint has a defined order. If code uses its own transactions, I avoid the rollback trick because nested transactions break it.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. How do you test authentication and RBAC?</div>
  <div class="qa-answer">
    <p>Table-driven: a matrix of endpoint × role → expected status, generated into tests with <code>describe.each</code>/<code>it.each</code>. Include anonymous (401), wrong role (403), owner vs non-owner, and cross-tenant (404 so we don't leak existence). Separately, token edge cases: expired, bad signature, wrong audience, <code>alg: none</code>. Tokens are signed with a test key the app's verifier trusts in tests; a couple of smoke tests use the real IdP.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. What is contract testing and when is it worth it?</div>
  <div class="qa-answer">
    <p>Consumer-driven contract testing (Pact): each consumer's tests record the requests it makes and the minimal response fields it reads; the provider replays them against the real service in its CI; a broker tracks which versions are compatible and <code>can-i-deploy</code> gates releases. It's worth it when consumers deploy independently — mobile apps already in users' hands, partner integrations, many microservices. For a monolith with one web client in the same repo, shared types plus integration tests are usually enough.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Pact vs OpenAPI schema validation — aren't they the same?</div>
  <div class="qa-answer">
    <p>No. OpenAPI describes what the provider offers; validating responses against it catches drift between docs and implementation. Pact captures what each consumer actually uses, so it can tell you <em>which</em> client a change breaks and allows everything else to change freely. Bi-directional contract testing combines them by comparing consumer pacts to the provider's spec.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. nock or MSW for mocking third-party APIs in Node?</div>
  <div class="qa-answer">
    <p>Both intercept in-process. nock is backend-focused with strict request matching and <code>isDone()</code> checks; older versions only patched Node's <code>http</code> module so native <code>fetch</code> slipped through, while newer versions support fetch (I'd verify for the version in use). MSW uses one handler syntax for browser and Node, which is great when frontend and backend share mocks. Whichever I choose, I block unmatched requests so tests never silently hit the real API.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How would you load test the availability endpoint?</div>
  <div class="qa-answer">
    <p>Define the target first: e.g. 2,000 tablets polling every 30 s ≈ 67 rps steady, with a 9:00 am spike. Write a k6 script with stages (ramp, hold, spike) and thresholds (<code>http_req_failed</code> under 1%, p95 under 300 ms) so it fails the job automatically. Run it from the same region against staging seeded with production-scale data, and watch server metrics — DB connections, CPU, slow queries — because the knee is usually pool exhaustion or a missing index, not Node itself.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Where do Postman/Newman fit if you already have supertest?</div>
  <div class="qa-answer">
    <p>Black-box smoke tests against a deployed environment: does the gateway route, are secrets and DNS right, does auth work end to end. They run after each deploy with environment-specific variables. They're also a good hand-off artefact for QA or a customer's integration team. I don't use them as the main regression suite because they can't seed data or fake dependencies and they review badly in PRs.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. FDE scenario: "Your deploy last night broke our integration." What do you do now, and what do you change?</div>
  <div class="qa-answer">
    <p>Now: get the failing request/response (correlation ID, logs), diff against the previous release, and roll back or ship a compatibility shim — restoring the customer comes before root cause. Then: write a failing test that reproduces their call. Longer term: capture their usage as a contract — a Pact if they'll run it, or a provider-side "consumer suite" of their real requests that runs on every PR — plus response schema validation, additive-only changes and versioning for breaking ones (<a href="#/topic/api-versioning">API versioning</a>). Gate deploys on it.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. FDE scenario: "The API is slow for us but your tests are green." How do you investigate?</div>
  <div class="qa-answer">
    <p>Green functional tests say nothing about latency at their data volume. I'd ask for timestamps, endpoints, payload sizes and their tenant ID; check server-side p95/p99 for that tenant; look for tenant-specific data shape (one org with 50k rooms → an N+1 or missing index that small fixtures never hit). Reproduce with a k6 script using their access pattern against staging seeded with comparable volume, fix, and keep that script as a regression threshold.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Senior probe: your integration suite takes 25 minutes. What do you do?</div>
  <div class="qa-answer">
    <p>Measure where time goes: container startup per file instead of per run, migrations per test, sleeps, serial execution. Fixes: one container per run with schema-per-worker so files run in parallel, truncate instead of re-migrating, replace sleeps with polling, push pure-logic cases down to unit tests, shard across CI machines. Then set a budget (say 5 minutes) and track it like a flake budget (<a href="#/topic/test-strategies">Test Strategies</a>).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. How do you structure an Express or NestJS app so supertest can drive it with injected dependencies?</div>
  <div class="qa-answer">
    <p>Split building the app from listening: <code>src/app.ts</code> exports <code>createApp(deps)</code>, which wires middleware and routers from injected <code>deps</code> (DB, clock, HTTP clients, JWT verifier) and returns the app without calling <code>.listen()</code>; <code>src/server.ts</code> is the only place that listens. Tests call <code>createApp</code> with test dependencies and pass the result to <code>request(app)</code>, so requests run in-process with no port. In NestJS the same idea is <code>Test.createTestingModule</code> with <code>overrideProvider</code>.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q14. How do you test a third-party timeout, and how do you guarantee no test reaches the real network?</div>
  <div class="qa-answer">
    <p>With nock, make the fake slower than the client's timeout, e.g. <code>nock('https://calendar.example.com').post('/v1/events').delay(5_000).reply(201, ...)</code> against a 2 s client timeout, then assert the behaviour you want: the booking still returns 201 and a <code>calendar.sync.retry</code> message lands in the outbox. Test 429 with Retry-After, 5xx and malformed JSON the same way, because that is where retry and circuit-breaker logic lives. Block unmatched requests so nothing silently hits the real API: <code>nock.disableNetConnect()</code> plus <code>isDone()</code> checks, or MSW with <code>onUnhandledRequest: 'error'</code>.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q15. Why might k6 load-test results mislead you?</div>
  <div class="qa-answer">
    <p>Running k6 from a laptop over VPN measures your Wi-Fi, not the API. Caches warmed by the first run make the second run look great. An empty staging DB hides index problems that only appear at 10M rows. Generate realistic data volume, run from a machine in the same region, keep the stages (ramp, hold, spike) and thresholds (e.g. <code>http_req_failed</code> under 1%, p95 under 300 ms), and watch server-side metrics such as DB connections, CPU and slow queries alongside k6's client-side numbers.</p>
  </div>
</div>
` },

  ]
});
