window.PREP_SITE.registerTopic({
  id: "be-nestjs",
  module: "backend-stack",
  title: "NestJS (Advanced)",
  estimatedReadTime: "55 min",
  tags: ["backend","node","nestjs","dependency-injection","guards","interceptors","pipes","exception-filters","prisma","bullmq","rbac","testing","typescript"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">NestJS = a <strong>DI container that builds a singleton graph at boot</strong> plus a <strong>fixed request pipeline</strong>: middleware → guards → interceptors → pipes → handler → interceptors (reverse) → filters on error.</div>
  <h4>Key points</h4>
  <ul>
    <li>Enhancer order within a type: <strong>global → controller → route</strong>; pipes add param-level last; filters go <strong>route → controller → global</strong> and only the first match runs.</li>
    <li>Runs over an <strong>HTTP adapter</strong> (Express by default, Fastify optionally). Roles: guards = "may this run?", interceptors = wrap the handler, pipes = transform/validate args, filters = exceptions → responses.</li>
    <li>Middleware can't see route metadata — authN/RBAC belong in <strong>guards</strong>, which read <code>@Roles()</code>/<code>@Public()</code> via <code>Reflector.getAllAndOverride([handler, class])</code>.</li>
    <li>Interceptors wrap the handler's Observable: timing, timeouts, response envelopes, caching, serialization. Error envelopes belong in filters.</li>
    <li><strong>Scopes:</strong> DEFAULT (free), REQUEST (per request, bubbles up to all dependents, no lifecycle hooks, breaks in workers), TRANSIENT (per consumer). Use nestjs-cls for request context; durable providers for per-tenant instances.</li>
    <li>Register globals with <code>APP_GUARD/APP_INTERCEPTOR/APP_PIPE/APP_FILTER</code> — DI-enabled and present in e2e tests; use <code>useExisting</code> to make them overridable.</li>
    <li>Dynamic modules: <code>forRoot/forRootAsync</code> returning <code>DynamicModule</code>; <code>ConfigurableModuleBuilder</code> generates them.</li>
    <li>Prisma: one global <code>PrismaService</code> singleton (one pool), <code>$connect</code> in <code>onModuleInit</code>, <code>enableShutdownHooks()</code>; map P2002 → 409, P2025 → 404 in a filter.</li>
    <li>Cross-service transactions: pass <code>tx</code> or propagate via CLS; keep them short; let DB constraints enforce invariants.</li>
    <li>BullMQ: deterministic <code>jobId</code>, attempts + backoff, idempotent processor, workers as a separate deployment.</li>
    <li>Circular deps: extract a service or use events; <code>forwardRef</code> is a bandage; barrel-file cycles cause the "<code>(?)</code>" error.</li>
    <li>Testing: <code>Test.createTestingModule</code> + <code>overrideProvider</code>/<code>overrideGuard</code>; e2e = <code>createNestApplication()</code> + supertest. <code>main.ts</code> doesn't run in tests, so <code>useGlobalX</code> settings vanish.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap">Making a provider <code>Scope.REQUEST</code> "just to get the current user" — scope bubbles up so half the app becomes per-request, lifecycle hooks stop firing, and queue/cron consumers break. Use AsyncLocalStorage (nestjs-cls) or pass the user explicitly.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"The lifecycle is middleware, guards, interceptors, pipes, handler, interceptors in reverse — and exception filters catch from route to global, first match wins."</div>
  <div class="revision-say">"I keep everything singleton and carry request context in AsyncLocalStorage, because request scope bubbles up the dependency chain and costs on every request."</div>
  <div class="revision-say">"Guards do coarse RBAC from route metadata; resource-level checks — tenant and ownership — live in the service queries."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What Nest adds over Express</h3>
<table>
  <thead><tr><th>Concern</th><th>Plain Express</th><th>NestJS</th></tr></thead>
  <tbody>
    <tr><td>Wiring dependencies</td><td>Hand-written composition root</td><td>IoC container: <code>@Injectable()</code> classes resolved from constructor types (via <code>emitDecoratorMetadata</code>)</td></tr>
    <tr><td>Boundaries</td><td>Convention (folders)</td><td><code>@Module</code> with explicit <code>imports</code>/<code>exports</code> — a provider is private unless exported</td></tr>
    <tr><td>Cross-cutting concerns</td><td>Middleware only</td><td>Middleware, guards, interceptors, pipes, filters — each with a specific job and position</td></tr>
    <tr><td>Metadata</td><td>None</td><td>Decorators write metadata (<code>Reflect.defineMetadata</code>) that guards/interceptors read with <code>Reflector</code></td></tr>
    <tr><td>Transports</td><td>HTTP</td><td>Same controllers model for HTTP, WebSockets, microservices (Kafka, Redis, NATS, RabbitMQ, gRPC, MQTT…), GraphQL</td></tr>
    <tr><td>Testing</td><td>Module mocking or manual DI</td><td>Testing module that rebuilds the graph with overrides</td></tr>
  </tbody>
</table>

<h3>Why teams choose it</h3>
<ul>
  <li><strong>Consistency at team scale.</strong> Ten developers write guards and services the same way; reviews focus on logic, not plumbing.</li>
  <li><strong>Testability through DI.</strong> Every dependency is a token you can override.</li>
  <li><strong>Batteries:</strong> config, validation, OpenAPI (<code>@nestjs/swagger</code>), queues (<code>@nestjs/bullmq</code>), scheduling, throttling, CQRS, event emitter.</li>
  <li><strong>Angular-style architecture</strong> that FE engineers recognise — modules, providers, decorators.</li>
</ul>

<h3>Why teams regret it (be honest in interviews)</h3>
<ul>
  <li><strong>Indirection.</strong> Behaviour is spread across decorators and global enhancers; "why did this return 403?" can take a while if you don't know the pipeline.</li>
  <li><strong>Decorator + reflection coupling.</strong> Depends on TypeScript's legacy <code>experimentalDecorators</code> / <code>emitDecoratorMetadata</code>; bundlers/transpilers that drop metadata (some esbuild/SWC setups without the right config) break DI with "can't resolve dependencies".</li>
  <li><strong>Boot time + memory</strong> are higher than a bare Express app — relevant for serverless cold starts.</li>
  <li><strong>Request scope foot-gun</strong> silently turns large parts of the graph into per-request allocations.</li>
</ul>

<h3>Versions worth knowing</h3>
<p>Nest 10 dropped Node 12/14 and supports SWC builds; <strong>Nest 11</strong> (early 2025) moved the Express adapter to <strong>Express 5</strong> (so wildcard route syntax in middleware <code>forRoutes()</code> changed) and made other breaking changes. Check the official migration guide for the exact list before upgrading a production app.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Two phases: bootstrap, then requests</h3>
<div class="diagram">
<pre>
BOOTSTRAP (once)                                   REQUEST (every time)
────────────────                                   ────────────────────
NestFactory.create(AppModule)                      HTTP adapter (Express/Fastify)
  │ scan @Module graph (imports/exports)              │
  │ read constructor param types (reflect-metadata)   ▼
  │ topologically instantiate singletons           Middleware      (global app.use → module-bound)
  │ run onModuleInit → onApplicationBootstrap         ▼
  │ build per-route enhancer chains                Guards          (global → controller → route)
  ▼                                                   ▼ false → ForbiddenException
app.listen()                                       Interceptors    (before next.handle(): global → ctrl → route)
                                                      ▼
                                                   Pipes           (global → ctrl → route → param)
                                                      ▼
                                                   Route handler → services → Prisma
                                                      ▼
                                                   Interceptors    (after, on the Observable: route → ctrl → global)
                                                      ▼
                                                   Response
                     any throw ───────────────▶    Exception filters (route → ctrl → global; FIRST match only)
</pre>
</div>

<h3>Which enhancer for which job</h3>
<table>
  <thead><tr><th>Enhancer</th><th>Sees</th><th>Returns</th><th>Use for</th><th>Not for</th></tr></thead>
  <tbody>
    <tr><td>Middleware</td><td>raw <code>req</code>/<code>res</code>, no route metadata</td><td>calls <code>next()</code></td><td>request id, raw-body capture, CLS setup, helmet/cors</td><td>authorization (doesn't know which handler will run)</td></tr>
    <tr><td>Guard</td><td><code>ExecutionContext</code> (handler + class + metadata)</td><td><code>boolean | Promise | Observable</code></td><td>authentication, RBAC, feature flags, tenant checks</td><td>transforming data</td></tr>
    <tr><td>Interceptor</td><td>context + the handler as an <code>Observable</code></td><td><code>Observable</code></td><td>logging/timing, timeouts, response envelopes, caching, serialization</td><td>rejecting unauthenticated users (guards run first for a reason)</td></tr>
    <tr><td>Pipe</td><td>one argument value + its metadata</td><td>transformed value or throw</td><td>validation (DTO / zod), parsing (<code>ParseUUIDPipe</code>)</td><td>anything needing the whole request</td></tr>
    <tr><td>Exception filter</td><td>the exception + <code>ArgumentsHost</code></td><td>writes the response</td><td>mapping domain/Prisma errors to HTTP, error envelope, logging</td><td>business logic</td></tr>
  </tbody>
</table>

<h3>The module graph is an encapsulation boundary</h3>
<div class="diagram">
<pre>
AppModule
 ├── ConfigModule.forRoot({ isGlobal: true })   global: available everywhere without import
 ├── PrismaModule        exports PrismaService
 ├── AuthModule          imports UsersModule; provides APP_GUARD(JwtAuthGuard), RolesGuard
 ├── BookingsModule      imports PrismaModule, RoomsModule; exports BookingsService
 └── RoomsModule         imports PrismaModule; exports RoomsService

Rule: a provider is visible only inside its module unless the module EXPORTS it
      and the consumer IMPORTS that module.
</pre>
</div>

<h3>Scope bubbling — the picture to draw on the whiteboard</h3>
<div class="diagram">
<pre>
 BookingsController ──▶ BookingsService ──▶ TenantContext (scope: REQUEST)
       ▲ becomes REQUEST          ▲ becomes REQUEST           ▲ declared REQUEST

 Every request now allocates 3 objects (and every other dependent of
 BookingsService). Singletons that inject REQUEST-scoped providers stop being singletons.
</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Guards and interceptors are just fancy middleware." They are not interchangeable: middleware runs <em>before Nest knows which handler will run</em>, so it cannot read <code>@Roles()</code> metadata. Guards and interceptors receive an <code>ExecutionContext</code> with <code>getHandler()</code> and <code>getClass()</code> — that's what makes declarative RBAC possible.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. Providers and tokens</h3>
<pre><code class="language-ts">// Class token (the common case) — resolved from the constructor's TS type
@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService, private readonly rooms: RoomsService) {}
}

// Non-class tokens: interfaces disappear at runtime, so use a symbol/string token
export const CLOCK = Symbol('CLOCK');
export interface Clock { now(): Date }

@Module({
  providers: [
    BookingsService,
    { provide: CLOCK, useValue: { now: () =&gt; new Date() } satisfies Clock },
    { provide: 'LLM_CLIENT', useFactory: (cfg: ConfigService) =&gt; new LlmClient(cfg.getOrThrow('LLM_KEY')), inject: [ConfigService] },
    { provide: NotificationSender, useClass: process.env.NODE_ENV === 'test' ? FakeSender : SesSender },
    { provide: 'LEGACY_SENDER', useExisting: NotificationSender },   // alias, same instance
  ],
  exports: [BookingsService],
})
export class BookingsModule {}

// Consuming a token
constructor(@Inject(CLOCK) private readonly clock: Clock, @Optional() @Inject('TRACER') private tracer?: Tracer) {}</code></pre>
<p>Under the hood, <code>emitDecoratorMetadata</code> stores constructor parameter types as <code>design:paramtypes</code>. If that metadata is missing — type-only import, interface type, or a transpiler not emitting it — Nest reports "can't resolve dependencies of X (?)" with a <code>?</code> at the unknown index.</p>

<h3>2. Scopes and their cost</h3>
<table>
  <thead><tr><th>Scope</th><th>Instances</th><th>Per-request cost</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td><code>DEFAULT</code> (singleton)</td><td>One per app (per module token)</td><td>None — resolved at bootstrap</td><td>Almost everything: services, repos, clients, Prisma</td></tr>
    <tr><td><code>REQUEST</code></td><td>One per incoming request, garbage-collected after</td><td>Allocation of this provider <strong>and every dependent up the chain</strong>; metadata lookups; more GC</td><td>Truly per-request state when ALS isn't an option; per-tenant connection selection (prefer durable)</td></tr>
    <tr><td><code>TRANSIENT</code></td><td>One per consumer that injects it</td><td>None if consumers are singletons (created at boot)</td><td>Stateful helpers that must not be shared, e.g. a logger with a per-class context</td></tr>
  </tbody>
</table>
<pre><code class="language-ts">// Request-scoped provider (and how it poisons the graph)
@Injectable({ scope: Scope.REQUEST })
export class TenantContext {
  constructor(@Inject(REQUEST) private readonly req: Request) {}
  get tenantId(): string { return (this.req as any).user.tenantId; }
}
// Any service that injects TenantContext is now implicitly REQUEST-scoped,
// and so is every controller/service that injects THAT service.</code></pre>
<p>Nest's docs note request-scoped providers have a measurable latency cost (a few percent in their guidance) — but the real damage in practice is architectural: request-scoped providers <strong>don't fire lifecycle hooks</strong> like <code>onModuleInit</code>, can't be used where no HTTP request exists (cron jobs, BullMQ processors, most WebSocket gateway paths), and a request-scoped class that constructs a <code>PrismaClient</code> creates a connection pool <em>per request</em>.</p>

<h4>The better default: AsyncLocalStorage via nestjs-cls</h4>
<pre><code class="language-ts">// app.module.ts
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,                                   // CLS context per HTTP request
        generateId: true,
        setup: (cls, req: Request) =&gt; {
          cls.set('requestId', req.headers['x-request-id'] ?? cls.getId());
        },
      },
    }),
  ],
})
export class AppModule {}

// Any SINGLETON can now read per-request values — no scope bubbling
@Injectable()
export class AuditService {
  constructor(private readonly cls: ClsService, private readonly prisma: PrismaService) {}
  record(action: string, entityId: string) {
    return this.prisma.auditLog.create({
      data: { action, entityId, actorId: this.cls.get('userId'), tenantId: this.cls.get('tenantId') },
    });
  }
}</code></pre>
<p>Set <code>userId</code>/<code>tenantId</code> into CLS from your auth guard after verifying the token. (nestjs-cls is a community package; API names above match its docs at time of writing — check current docs.)</p>

<h4>Durable providers (multi-tenant, when you do need request scope)</h4>
<p>If each tenant needs its own instance (e.g. a per-tenant DB connection), mark the provider <code>durable: true</code> and register a <code>ContextIdStrategy</code> that maps requests to a per-tenant context id. Nest then builds the request-scoped subtree <strong>once per tenant</strong> and reuses it, instead of once per request. Cap the number of tenants or you trade a CPU problem for a memory problem. The exact strategy interface is in the "Injection scopes → Durable providers" docs.</p>

<h3>3. The lifecycle, precisely</h3>
<table>
  <thead><tr><th>#</th><th>Step</th><th>Order within the step</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>Middleware</td><td>Global (<code>app.use</code>) then module-bound (<code>configure(consumer)</code>)</td><td>No handler metadata; Express/Fastify-level</td></tr>
    <tr><td>2</td><td>Guards</td><td>Global → controller → route</td><td>First <code>false</code> stops the chain → 403 (or whatever exception the guard throws)</td></tr>
    <tr><td>3</td><td>Interceptors (pre)</td><td>Global → controller → route</td><td>Code before <code>next.handle()</code></td></tr>
    <tr><td>4</td><td>Pipes</td><td>Global → controller → route → param-level</td><td>Per argument; the docs note route-parameter pipes run for the last parameter first</td></tr>
    <tr><td>5</td><td>Handler</td><td>—</td><td>Return value (or Promise/Observable) becomes the response stream</td></tr>
    <tr><td>6</td><td>Interceptors (post)</td><td>Route → controller → global</td><td>RxJS operators on the returned Observable</td></tr>
    <tr><td>7</td><td>Exception filters</td><td>Route → controller → global</td><td>Only the <strong>first</strong> filter whose <code>@Catch()</code> matches runs; filters don't cascade</td></tr>
  </tbody>
</table>
<p>Exceptions thrown by guards, interceptors and pipes also go to exception filters. And an exception thrown in a guard means interceptors and pipes never run — which is why a logging interceptor doesn't see 401s/403s (log those in the filter).</p>

<h3>4. Global enhancers: APP_* tokens vs useGlobalX</h3>
<pre><code class="language-ts">// ❌ main.ts — no DI, and NOT present when tests call createNestApplication()
app.useGlobalGuards(new JwtAuthGuard(/* can't inject Reflector/JwtService cleanly */));

// ✅ app.module.ts — DI-enabled, part of the module graph, present in e2e tests
@Module({
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },        // runs first (registration order)
    { provide: APP_GUARD, useClass: RolesGuard },          // runs second
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_PIPE, useValue: new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }) },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}</code></pre>

<h3>5. Custom decorators</h3>
<pre><code class="language-ts">// Param decorator: typed current user
export interface AuthUser { id: string; tenantId: string; roles: Role[]; permissions: string[] }

export const CurrentUser = createParamDecorator(
  (field: keyof AuthUser | undefined, ctx: ExecutionContext) =&gt; {
    const user = ctx.switchToHttp().getRequest().user as AuthUser | undefined;
    if (!user) throw new UnauthorizedException();
    return field ? user[field] : user;
  },
);

// Metadata decorators
export const IS_PUBLIC = 'isPublic';
export const Public = () =&gt; SetMetadata(IS_PUBLIC, true);

export const ROLES = 'roles';
export const Roles = (...roles: Role[]) =&gt; SetMetadata(ROLES, roles);

export const PERMS = 'permissions';
export const RequirePermissions = (...perms: string[]) =&gt; SetMetadata(PERMS, perms);

// Composition: one decorator = auth docs + metadata + guard
export function AdminOnly() {
  return applyDecorators(
    Roles(Role.ADMIN),
    ApiBearerAuth(),
    ApiForbiddenResponse({ description: 'Admin role required' }),
  );
}

// Usage
@Controller('bookings')
export class BookingsController {
  @Get('mine')
  list(@CurrentUser('id') userId: string) { /* ... */ }

  @Delete(':id')
  @RequirePermissions('booking:cancel:any')
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) { /* ... */ }
}</code></pre>
<p>Newer Nest versions also offer <code>Reflector.createDecorator()</code>, which creates a typed decorator and its metadata key in one go — check current docs; <code>SetMetadata</code> works everywhere.</p>

<h3>6. Guards for authentication + RBAC</h3>
<pre><code class="language-ts">@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly jwt: JwtService, private readonly cls: ClsService) {}

  async canActivate(ctx: ExecutionContext): Promise&lt;boolean&gt; {
    // getAllAndOverride: route-level metadata wins over class-level
    const isPublic = this.reflector.getAllAndOverride&lt;boolean&gt;(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest();
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException();

    try {
      const p = await this.jwt.verifyAsync&lt;{ sub: string; tid: string; roles: Role[]; perms: string[] }&gt;(token);
      req.user = { id: p.sub, tenantId: p.tid, roles: p.roles, permissions: p.perms } satisfies AuthUser;
      this.cls.set('userId', p.sub);
      this.cls.set('tenantId', p.tid);
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const targets = [ctx.getHandler(), ctx.getClass()];
    const roles = this.reflector.getAllAndOverride&lt;Role[]&gt;(ROLES, targets);
    const perms = this.reflector.getAllAndMerge&lt;string[]&gt;(PERMS, targets);   // merge class + method
    if (!roles?.length &amp;&amp; !perms?.length) return true;                      // no requirement declared

    const user: AuthUser | undefined = ctx.switchToHttp().getRequest().user;
    if (!user) return false;
    const roleOk = !roles?.length || roles.some(r =&gt; user.roles.includes(r));
    const permOk = !perms?.length || perms.every(p =&gt; user.permissions.includes(p));
    if (!roleOk || !permOk) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}</code></pre>
<div class="callout info">
  <div class="callout-title">What a guard can't decide</div>
  <p>A guard sees the route and the user, not the database row. "Can this member cancel <em>this</em> booking?" needs the booking's owner and tenant — enforce it in the service (<code>where: { id, tenantId, ownerId }</code>) or a policy class. Guards = coarse RBAC; services/queries = resource-level authorization. Details in <a href="#/topic/api-auth-rbac">AuthN, AuthZ &amp; RBAC</a>.</p>
</div>

<h3>7. Interceptors</h3>
<pre><code class="language-ts">@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly log = new Logger('HTTP');
  intercept(ctx: ExecutionContext, next: CallHandler): Observable&lt;unknown&gt; {
    if (ctx.getType() !== 'http') return next.handle();       // also used by rpc/ws contexts
    const req = ctx.switchToHttp().getRequest();
    const started = performance.now();
    return next.handle().pipe(
      tap({
        next: () =&gt; this.log.log(req.method + ' ' + req.url + ' ' + Math.round(performance.now() - started) + 'ms'),
        error: (e) =&gt; this.log.warn(req.method + ' ' + req.url + ' failed: ' + e?.message),
      }),
    );
  }
}

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(private readonly ms = 10_000) {}
  intercept(_ctx: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      timeout(this.ms),
      catchError(err =&gt; throwError(() =&gt; (err instanceof TimeoutError ? new RequestTimeoutException() : err))),
    );
  }
}</code></pre>
<p>The timeout only stops <em>waiting</em>; the underlying Prisma query keeps running. Pair it with DB-side statement timeouts. Interceptors also power caching (<code>CacheInterceptor</code>) and serialization (<code>ClassSerializerInterceptor</code> + <code>@Exclude()</code> to keep <code>passwordHash</code> out of responses).</p>

<h3>8. Pipes: ValidationPipe options that matter</h3>
<table>
  <thead><tr><th>Option</th><th>Effect</th><th>Why you want it</th></tr></thead>
  <tbody>
    <tr><td><code>whitelist: true</code></td><td>Strips properties without class-validator decorators</td><td>Blocks mass assignment (<code>role: 'admin'</code> in a profile update)</td></tr>
    <tr><td><code>forbidNonWhitelisted: true</code></td><td>Rejects instead of stripping</td><td>Clients learn about typos instead of silently losing fields</td></tr>
    <tr><td><code>transform: true</code></td><td>Instantiates DTO classes; converts primitive params by TS type</td><td><code>@Param('n') n: number</code> actually becomes a number</td></tr>
    <tr><td><code>transformOptions.enableImplicitConversion</code></td><td>Converts based on TS types without <code>@Type()</code></td><td>Convenient but surprising: <code>"false"</code> → <code>true</code> for booleans</td></tr>
  </tbody>
</table>
<p>Prefer zod? A small custom pipe works the same way:</p>
<pre><code class="language-ts">export class ZodPipe&lt;T extends ZodTypeAny&gt; implements PipeTransform {
  constructor(private readonly schema: T) {}
  transform(value: unknown): z.infer&lt;T&gt; {
    const r = this.schema.safeParse(value);
    if (!r.success) {
      throw new BadRequestException({ code: 'VALIDATION_FAILED', issues: r.error.issues.map(i =&gt; ({ path: i.path.join('.'), message: i.message })) });
    }
    return r.data;
  }
}

@Post()
create(@Body(new ZodPipe(CreateBookingSchema)) dto: CreateBooking, @CurrentUser() user: AuthUser) { /* ... */ }</code></pre>

<h3>9. Exception filters: mapping Prisma errors</h3>
<pre><code class="language-ts">import { Prisma } from '@prisma/client';   // import path depends on your Prisma version/generator — check docs

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(e: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    switch (e.code) {
      case 'P2002':   // unique constraint failed
        return res.status(409).json({ error: { code: 'CONFLICT', message: 'Already exists', target: e.meta?.target } });
      case 'P2025':   // record required but not found
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } });
      default:
        return res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal Server Error' } });
    }
  }
}

// Catch-all, adapter-agnostic (works on Express and Fastify)
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly log = new Logger('Exceptions');
  constructor(private readonly adapterHost: HttpAdapterHost, private readonly cls: ClsService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.adapterHost;
    const ctx = host.switchToHttp();
    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    if (status &gt;= 500) this.log.error(exception);

    const body = isHttp ? exception.getResponse() : { message: 'Internal Server Error' };
    httpAdapter.reply(ctx.getResponse(), { error: body, requestId: this.cls.getId() }, status);
  }
}</code></pre>
<p>Remember "first match wins": if <code>AllExceptionsFilter</code> is bound at route level and <code>PrismaExceptionFilter</code> globally, the catch-all handles everything. Bind specific filters closer to the route, or handle Prisma codes inside the single global filter.</p>

<h3>10. Dynamic modules</h3>
<pre><code class="language-ts">// Hand-rolled: forRoot + forRootAsync
export interface LlmModuleOptions { apiKey: string; model: string; timeoutMs?: number }
export const LLM_OPTIONS = Symbol('LLM_OPTIONS');

@Module({})
export class LlmModule {
  static forRoot(opts: LlmModuleOptions): DynamicModule {
    return {
      module: LlmModule,
      providers: [{ provide: LLM_OPTIONS, useValue: opts }, LlmService],
      exports: [LlmService],
    };
  }

  static forRootAsync(opts: {
    imports?: any[];
    inject?: any[];
    useFactory: (...args: any[]) =&gt; LlmModuleOptions | Promise&lt;LlmModuleOptions&gt;;
  }): DynamicModule {
    return {
      module: LlmModule,
      imports: opts.imports ?? [],
      providers: [{ provide: LLM_OPTIONS, useFactory: opts.useFactory, inject: opts.inject ?? [] }, LlmService],
      exports: [LlmService],
    };
  }
}

// Usage
LlmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (cfg: ConfigService) =&gt; ({ apiKey: cfg.getOrThrow('LLM_API_KEY'), model: cfg.get('LLM_MODEL', 'default-model') }),
});</code></pre>
<pre><code class="language-ts">// Less boilerplate: ConfigurableModuleBuilder generates forRoot/forRootAsync (+ useClass/useExisting variants)
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder&lt;LlmModuleOptions&gt;()
    .setClassMethodName('forRoot')
    .setExtras({ isGlobal: false }, (def, extras) =&gt; ({ ...def, global: extras.isGlobal }))
    .build();

@Module({ providers: [LlmService], exports: [LlmService] })
export class LlmModule extends ConfigurableModuleClass {}

@Injectable()
export class LlmService {
  constructor(@Inject(MODULE_OPTIONS_TOKEN) private readonly opts: LlmModuleOptions) {}
}</code></pre>
<p>Convention: <code>forRoot</code> = configure once for the app; <code>register</code> = configure per importing module; <code>forFeature</code> = per-module additions to a root config (e.g. <code>BullModule.registerQueue</code>, <code>TypeOrmModule.forFeature([Entity])</code>).</p>

<h3>11. Config, validated at boot</h3>
<pre><code class="language-ts">const Env = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  REDIS_URL: z.string().url(),
});

export const dbConfig = registerAs('db', () =&gt; ({ url: process.env.DATABASE_URL!, logQueries: process.env.NODE_ENV !== 'production' }));

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, cache: true, load: [dbConfig], validate: (raw) =&gt; Env.parse(raw) })],
})
export class AppModule {}

// Typed injection of a namespace
constructor(@Inject(dbConfig.KEY) private readonly db: ConfigType&lt;typeof dbConfig&gt;) {}</code></pre>

<h3>12. Lifecycle hooks and shutdown</h3>
<table>
  <thead><tr><th>Hook</th><th>When</th><th>Typical use</th></tr></thead>
  <tbody>
    <tr><td><code>onModuleInit</code></td><td>After the module's dependencies resolve</td><td>Connect clients, warm caches</td></tr>
    <tr><td><code>onApplicationBootstrap</code></td><td>After all modules initialised, before listening</td><td>Start consumers/schedulers</td></tr>
    <tr><td><code>onModuleDestroy</code></td><td>Shutdown signal received (needs <code>enableShutdownHooks()</code>)</td><td>Stop taking new work</td></tr>
    <tr><td><code>beforeApplicationShutdown</code></td><td>After all <code>onModuleDestroy</code> resolved; HTTP server then closes</td><td>Drain in-flight jobs</td></tr>
    <tr><td><code>onApplicationShutdown</code></td><td>After connections close</td><td>Close DB pools, flush telemetry</td></tr>
  </tbody>
</table>
<pre><code class="language-ts">// main.ts
const app = await NestFactory.create(AppModule, { bufferLogs: true });
app.enableShutdownHooks();                      // otherwise SIGTERM skips the destroy hooks
await app.listen(process.env.PORT ?? 3000);</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — Prisma integration done properly</h3>
<pre><code class="language-ts">// prisma/prisma.service.ts — ONE singleton = ONE connection pool per process
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnApplicationShutdown {
  constructor(cfg: ConfigService) {
    super({ datasourceUrl: cfg.getOrThrow('DATABASE_URL'), log: ['warn', 'error'] });
    // constructor options vary by Prisma major version (v6/v7 changed engines/adapters) — check current docs
  }
  async onModuleInit() { await this.$connect(); }             // fail fast at boot, not on first query
  async onApplicationShutdown() { await this.$disconnect(); }
}

@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}</code></pre>

<h4>Transactions that span services</h4>
<p>The classic problem: <code>BookingsService.create</code> and <code>AuditService.record</code> must commit together, but each injects <code>PrismaService</code>. Three options:</p>
<table>
  <thead><tr><th>Approach</th><th>How</th><th>Trade-off</th></tr></thead>
  <tbody>
    <tr><td>Pass the tx client</td><td><code>prisma.$transaction(async tx =&gt; { await bookings.create(tx, ...); await audit.record(tx, ...); })</code> with methods accepting <code>tx: Prisma.TransactionClient</code></td><td>Explicit and obvious; noisy signatures</td></tr>
    <tr><td>CLS-propagated transaction</td><td><code>@nestjs-cls/transactional</code> with a Prisma adapter: <code>@Transactional()</code> on the method, repositories use <code>txHost.tx</code></td><td>Clean signatures; "magic" — make sure the team understands it (check current docs for the adapter API)</td></tr>
    <tr><td>Single repository method</td><td>Put both writes in one repo method with nested writes</td><td>Simplest when it fits the aggregate</td></tr>
  </tbody>
</table>
<pre><code class="language-ts">@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async create(user: AuthUser, dto: CreateBooking) {
    return this.prisma.$transaction(async (tx) =&gt; {
      const clash = await tx.booking.findFirst({
        where: { roomId: dto.roomId, status: 'CONFIRMED', start: { lt: dto.end }, end: { gt: dto.start } },
        select: { id: true },
      });
      if (clash) throw new ConflictException('Room already booked for that slot');

      const booking = await tx.booking.create({
        data: { ...dto, tenantId: user.tenantId, ownerId: user.id, status: 'CONFIRMED' },
      });
      await this.audit.recordTx(tx, 'booking.created', booking.id);
      return booking;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 5_000 });
  }
}</code></pre>
<p>The check-then-insert above is still racy under weaker isolation; Serializable makes Postgres abort one of two conflicting transactions (retry on serialization failure). The most robust guard is a Postgres <strong>exclusion constraint</strong> on <code>(room_id, tstzrange(start, end))</code> added via a raw SQL migration — then map the constraint violation to 409 in your filter.</p>

<h4>Tenant scoping with a Prisma client extension</h4>
<pre><code class="language-ts">// Every query on tenant-owned models automatically filtered by the CLS tenant
export function tenantScoped(prisma: PrismaService, cls: ClsService) {
  return prisma.$extends({
    query: {
      booking: {
        async findMany({ args, query }) {
          args.where = { ...args.where, tenantId: cls.get('tenantId') };
          return query(args);
        },
        // findFirst, update, delete... — every operation you allow needs the same treatment
      },
    },
  });
}</code></pre>
<p>Useful defence in depth, but it is easy to miss an operation (or a raw query). Postgres Row-Level Security with a per-transaction <code>set_config('app.tenant_id', ...)</code> is the stronger guarantee.</p>

<h3>Example 2 — Background jobs with BullMQ</h3>
<pre><code class="language-ts">// queue.module.ts
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) =&gt; ({ connection: { url: cfg.getOrThrow('REDIS_URL') } }),
    }),
    BullModule.registerQueue({ name: 'call-scoring' }),
  ],
  providers: [ScoringProducer, ScoringProcessor],
  exports: [ScoringProducer],
})
export class ScoringQueueModule {}

// Producer: idempotent enqueue via a deterministic jobId
@Injectable()
export class ScoringProducer {
  constructor(@InjectQueue('call-scoring') private readonly queue: Queue) {}
  enqueue(callId: string, rubricVersion: number) {
    return this.queue.add('score', { callId, rubricVersion }, {
      jobId: 'score:' + callId + ':v' + rubricVersion,   // re-enqueue = no-op while the job exists
      attempts: 5,
      backoff: { type: 'exponential', delay: 2_000 },
      removeOnComplete: 1_000,
      removeOnFail: 5_000,
    });
  }
}

// Consumer
@Processor('call-scoring', { concurrency: 4 })
export class ScoringProcessor extends WorkerHost {
  private readonly log = new Logger(ScoringProcessor.name);
  constructor(private readonly scoring: ScoringService) { super(); }

  async process(job: Job&lt;{ callId: string; rubricVersion: number }&gt;) {
    await job.updateProgress(10);
    const result = await this.scoring.scoreCall(job.data.callId, job.data.rubricVersion);  // must be idempotent
    await job.updateProgress(100);
    return { score: result.total };
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.log.error('job ' + job.id + ' failed attempt ' + job.attemptsMade + ': ' + err.message);
  }
}</code></pre>
<ul>
  <li>Processors run outside an HTTP request: no <code>REQUEST</code>, no CLS context unless you create one (<code>cls.run(...)</code>) — another reason not to make shared services request-scoped.</li>
  <li>Run workers as a <strong>separate deployment</strong> (same codebase, different entry module) so CPU-heavy jobs don't hurt API latency and you can scale them independently.</li>
  <li>BullMQ is at-least-once: <code>scoreCall</code> must be safe to run twice (upsert by <code>callId + rubricVersion</code>). For higher-volume event streams see <a href="#/topic/be-kafka">Kafka Deep</a> and <a href="#/topic/be-event-driven">Event-Driven Systems</a>.</li>
</ul>

<h3>Example 3 — Microservices / hybrid app</h3>
<pre><code class="language-ts">// main.ts — HTTP API that also consumes Kafka events
const app = await NestFactory.create(AppModule);
app.connectMicroservice&lt;MicroserviceOptions&gt;({
  transport: Transport.KAFKA,
  options: { client: { brokers: [process.env.KAFKA_BROKER!] }, consumer: { groupId: 'bookings-svc' } },
});
await app.startAllMicroservices();
await app.listen(3000);

// bookings.events.controller.ts
@Controller()
export class RoomEventsController {
  constructor(private readonly bookings: BookingsService) {}

  @EventPattern('room.decommissioned')            // fire-and-forget event (no reply)
  async onRoomDecommissioned(@Payload() evt: { roomId: string }, @Ctx() ctx: KafkaContext) {
    await this.bookings.cancelFutureForRoom(evt.roomId);
  }

  @MessagePattern('bookings.count')               // request-response over the transport
  count(@Payload() q: { roomId: string }) { return this.bookings.countForRoom(q.roomId); }
}</code></pre>
<p>Guards, interceptors, pipes and filters work on these handlers too — use <code>ctx.getType() === 'rpc'</code> and <code>ctx.switchToRpc()</code> inside shared enhancers, and use <code>RpcException</code> rather than <code>HttpException</code>.</p>

<h3>Example 4 — Testing module: unit, guard, e2e</h3>
<pre><code class="language-ts">// Unit: service with mocked Prisma
describe('BookingsService', () =&gt; {
  let service: BookingsService;
  const prisma = { $transaction: jest.fn(), booking: { findFirst: jest.fn(), create: jest.fn() } };

  beforeEach(async () =&gt; {
    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { recordTx: jest.fn() } },
      ],
    }).compile();
    service = moduleRef.get(BookingsService);
    prisma.$transaction.mockImplementation((fn: any) =&gt; fn(prisma));   // run callback with the mock as tx
  });

  it('throws 409 on overlap', async () =&gt; {
    prisma.booking.findFirst.mockResolvedValue({ id: 'b1' });
    await expect(service.create(user, dto)).rejects.toBeInstanceOf(ConflictException);
  });
});

// Guard unit test: fake ExecutionContext + real Reflector
it('RolesGuard rejects members on admin routes', () =&gt; {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
  jest.spyOn(reflector, 'getAllAndMerge').mockReturnValue([]);
  const ctx = { getHandler: () =&gt; null, getClass: () =&gt; null,
    switchToHttp: () =&gt; ({ getRequest: () =&gt; ({ user: { roles: [Role.MEMBER], permissions: [] } }) }) } as any;
  expect(() =&gt; guard.canActivate(ctx)).toThrow(ForbiddenException);
});</code></pre>
<pre><code class="language-ts">// e2e: real module graph, real pipeline, overridden edges
describe('Bookings (e2e)', () =&gt; {
  let app: INestApplication;

  beforeAll(async () =&gt; {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(LlmService).useValue({ complete: jest.fn().mockResolvedValue('ok') })
      .overrideProvider(JwtAuthGuard).useClass(FakeAuthGuard)   // works because APP_GUARD uses useExisting (below)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();                         // main.ts is NOT run — APP_* globals are why this still has validation
  });
  afterAll(() =&gt; app.close());

  it('POST /bookings validates body', () =&gt;
    request(app.getHttpServer()).post('/bookings').send({ roomId: 'nope' }).expect(400));
});

// app.module.ts — make the global guard overridable in tests
providers: [JwtAuthGuard, { provide: APP_GUARD, useExisting: JwtAuthGuard }]</code></pre>
<p>Real-database e2e (testcontainers Postgres + <code>prisma migrate deploy</code>) catches what mocks can't: constraint violations, isolation behaviour, migration drift. See <a href="#/topic/test-api">API Testing</a>.</p>

<h3>Example 5 — Untangling a circular dependency</h3>
<pre><code class="language-ts">// The cycle: Bookings needs Rooms (validate room), Rooms needs Bookings (can't delete a room with bookings)
// Bandage (works, but the cycle remains):
@Module({ imports: [forwardRef(() =&gt; RoomsModule)], providers: [BookingsService], exports: [BookingsService] })
export class BookingsModule {}

@Injectable()
export class RoomsService {
  constructor(@Inject(forwardRef(() =&gt; BookingsService)) private readonly bookings: BookingsService) {}
}</code></pre>
<p>Fixes, from best to worst:</p>
<ol>
  <li><strong>Extract the shared concern</strong>: a <code>RoomAvailabilityService</code> (or query service) that both depend on — the dependency graph becomes a DAG.</li>
  <li><strong>Invert with events</strong>: Rooms emits <code>room.deleting</code>; Bookings listens (<code>@nestjs/event-emitter</code>, or the outbox for cross-service). Rooms no longer knows Bookings exists.</li>
  <li><strong>Depend on data, not the service</strong>: Rooms queries <code>prisma.booking.count()</code> directly through a repository.</li>
  <li><code>forwardRef</code> on both sides — last resort. Instantiation order is indeterminate, so neither constructor may use the other.</li>
</ol>
<p>Also check for <strong>file-level</strong> cycles: barrel files (<code>index.ts</code> re-exporting everything) can make a class <code>undefined</code> at decorator-evaluation time, which surfaces as the "<code>(?)</code>" resolution error even when the module graph is fine.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>Request scope where there is no request</h3>
<p>Cron jobs (<code>@nestjs/schedule</code>), BullMQ processors, Kafka consumers and app bootstrap have no HTTP request. A singleton processor that depends (transitively) on a request-scoped provider either fails to resolve or behaves unexpectedly. Keep request-scoped providers at the very edge of the graph, or remove them.</p>

<h3>@Res() switches off Nest's response handling</h3>
<pre><code class="language-ts">@Get('report')
report(@Res() res: Response) {         // library-specific mode: YOU must send the response
  res.json(data);                       // interceptors that map the return value see nothing
}

@Get('report')
report(@Res({ passthrough: true }) res: Response) {   // set headers/cookies, still return a value
  res.setHeader('cache-control', 'no-store');
  return data;
}</code></pre>
<p>Use <code>passthrough</code>, or <code>StreamableFile</code> for file downloads, so interceptors and filters keep working.</p>

<h3>Interceptor that never calls next.handle()</h3>
<p>A caching interceptor that returns <code>of(cached)</code> on a hit means the handler never runs — correct for caching, catastrophic if the cache key ignores the user (one user's data served to another). Include user/tenant in cache keys for authenticated routes.</p>

<h3>Global prefix, versioning and middleware routes</h3>
<p><code>app.setGlobalPrefix('api')</code> and URI versioning change the actual paths; middleware <code>forRoutes()</code> patterns and exclusion lists must match. On Nest 11 (Express 5) the wildcard syntax inside <code>forRoutes</code> changed — check current docs rather than copying older examples.</p>

<h3>Fastify adapter differences</h3>
<ul>
  <li><code>req</code>/<code>res</code> are Fastify objects; Express-only middleware (or code calling <code>res.status().json()</code> in a filter) breaks. Use <code>HttpAdapterHost.httpAdapter.reply()</code> for adapter-agnostic filters.</li>
  <li>File uploads use different packages (<code>@fastify/multipart</code> instead of Multer-based <code>FileInterceptor</code>).</li>
</ul>

<h3>DTO transforms with surprises</h3>
<ul>
  <li><code>enableImplicitConversion</code> turns the string <code>"false"</code> into boolean <code>true</code> (non-empty string). Use an explicit <code>@Transform</code> for booleans.</li>
  <li>Nested objects aren't validated unless you add <code>@ValidateNested()</code> <em>and</em> <code>@Type(() =&gt; Child)</code>.</li>
  <li><code>whitelist</code> without <code>forbidNonWhitelisted</code> silently drops misspelled fields — clients think they set something they didn't.</li>
</ul>

<h3>Multiple PrismaClient instances</h3>
<p>Each <code>PrismaClient</code> owns a connection pool (default size derived from CPU count — check docs). Creating one per module, per request (request-scoped service extending PrismaClient), or per Lambda invocation multiplies connections until Postgres hits <code>max_connections</code>. One global singleton per process; in serverless, use a pooler (PgBouncer / RDS Proxy / Prisma Accelerate).</p>

<h3>Exceptions inside Observables and streams</h3>
<p>If a handler returns an Observable that errors <em>after</em> headers are sent (SSE via <code>@Sse()</code>), a filter can't change the status code. Emit an in-band error event and complete the stream.</p>

<h3>Guard order across modules</h3>
<p>Multiple <code>APP_GUARD</code> providers run in the order they are registered across the module graph. If <code>RolesGuard</code> ends up registered before <code>JwtAuthGuard</code>, <code>req.user</code> isn't set yet → every protected route returns 403. Register both in the same module, in order, or merge them.</p>

<h3>Serverless (Lambda) cold starts</h3>
<p>Bootstrapping the full module graph on every cold start costs hundreds of milliseconds or more for big apps. Cache the bootstrapped app across invocations (module-level variable), trim unused modules, prefer the SWC builder, and consider whether a long-running container fits the workload better.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>The usual suspects</h3>
<table>
  <thead><tr><th>Anti-pattern</th><th>Symptom</th><th>Fix</th></tr></thead>
  <tbody>
    <tr><td><code>Scope.REQUEST</code> to get the current user into a service</td><td>Latency + GC up, lifecycle hooks silently skipped, workers fail to resolve</td><td>nestjs-cls / AsyncLocalStorage, or pass <code>user</code> as an argument</td></tr>
    <tr><td><code>app.useGlobalPipes/Guards</code> in <code>main.ts</code></td><td>e2e tests pass invalid bodies / unauthenticated calls that prod rejects</td><td><code>APP_PIPE</code>/<code>APP_GUARD</code> providers</td></tr>
    <tr><td>Fat controllers (Prisma calls in controllers)</td><td>Logic duplicated in queue consumers; hard to unit test</td><td>Controller = HTTP mapping; service = rules; repo = data</td></tr>
    <tr><td>Everything <code>@Global()</code></td><td>Module boundaries meaningless; hidden coupling</td><td>Global only for true infrastructure (config, Prisma, logger)</td></tr>
    <tr><td>Throwing <code>HttpException</code> from domain services</td><td>Services tied to HTTP; wrong status codes from queue/RPC contexts</td><td>Throw domain errors (<code>BookingConflictError</code>); map in a filter per transport</td></tr>
    <tr><td><code>forwardRef</code> everywhere</td><td>Undefined dependencies at runtime, fragile boot order</td><td>Extract shared service or use events</td></tr>
    <tr><td>Returning Prisma entities directly</td><td><code>passwordHash</code>, internal ids, soft-delete flags leak</td><td>Explicit <code>select</code>, response DTOs, or <code>ClassSerializerInterceptor</code></td></tr>
    <tr><td>Auth check in middleware</td><td>Can't honour <code>@Public()</code> / <code>@Roles()</code> metadata</td><td>Guards</td></tr>
    <tr><td><code>type</code>-only imports for injected classes</td><td>"Nest can't resolve dependencies (?)" — metadata erased</td><td>Value import for constructor-injected classes</td></tr>
  </tbody>
</table>

<h3>Bug: the forgotten await in a guard</h3>
<pre><code class="language-ts">canActivate(ctx: ExecutionContext) {
  const req = ctx.switchToHttp().getRequest();
  return this.auth.isAllowed(req.user, req.params.id) !== false;   // Promise !== false → always true
}</code></pre>
<p>A Promise is truthy. Make <code>canActivate</code> <code>async</code> and <code>await</code> the check — this exact bug ships to production because the happy-path test passes.</p>

<h3>Bug: interceptor that swallows errors</h3>
<pre><code class="language-ts">return next.handle().pipe(catchError(() =&gt; of({ ok: false })));   // every error becomes 200 { ok: false }</code></pre>
<p>Interceptors should rethrow (<code>throwError(() =&gt; err)</code>) unless they deliberately translate one error type. Error-to-response mapping belongs in filters.</p>

<h3>Bug: role check that trusts the client</h3>
<pre><code class="language-ts">@Post('bookings')
create(@Body() dto: CreateBookingDto) {
  return this.svc.create(dto);           // dto.ownerId / dto.tenantId come from the request body
}</code></pre>
<p>Tenant and owner must come from the verified token (<code>@CurrentUser()</code>), never the payload. With <code>whitelist</code>, keep those fields off the DTO entirely.</p>

<h3>Anti-pattern: one giant SharedModule</h3>
<p>A <code>SharedModule</code> that imports and re-exports twenty modules makes every feature depend on everything; circular dependencies and slow test bootstraps follow. Prefer small infrastructure modules imported where needed.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. Walk me through what happens when a request hits a Nest controller.</div>
  <div class="qa-answer"><p>The adapter (Express/Fastify) receives it and runs middleware — global then module-bound. Then guards (global → controller → route); any <code>false</code> or thrown exception stops the chain. Then interceptors' "before" logic in the same order, then pipes transform and validate each argument (global → controller → route → param). The handler runs; its return value — a value, Promise or Observable — flows back through interceptors in reverse order, where they can map, time or time-out the result. If anything throws, exception filters resolve from route to controller to global, and only the first matching filter handles it.</p></div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Guard vs middleware vs interceptor for authentication — which and why?</div>
  <div class="qa-answer"><p>A guard. Middleware runs before routing metadata is available, so it can't respect <code>@Public()</code> or <code>@Roles()</code>. Interceptors run after guards and are meant to wrap execution, not decide it. Guards get the <code>ExecutionContext</code> (handler, class, transport type), return a boolean or throw, and naturally produce 401/403. I register the JWT guard globally via <code>APP_GUARD</code> and opt routes out with a <code>@Public()</code> decorator — secure by default.</p></div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Explain DI scopes and the cost of request scope.</div>
  <div class="qa-answer"><p>Default scope is a singleton built once at bootstrap — no per-request cost. Request scope creates a new instance per request, and the scope bubbles: anything injecting it becomes request-scoped too, so one innocent <code>TenantContext</code> can turn controllers and services across the app into per-request allocations. Costs: allocation and GC per request, measurable latency, no lifecycle hooks, and failures in contexts without a request (cron, queue workers). Transient is one instance per consumer, usually created at boot. My default is singletons plus AsyncLocalStorage (nestjs-cls) for request context; if I truly need per-tenant instances, durable providers keyed by tenant.</p></div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. How did you implement RBAC in Nest?</div>
  <div class="qa-answer"><p>Two layers. Declarative: <code>@Roles()</code>/<code>@RequirePermissions()</code> decorators write metadata; a <code>RolesGuard</code> reads it with <code>Reflector.getAllAndOverride</code> (method overrides class) or <code>getAllAndMerge</code> and compares against roles/permissions from the verified JWT. Resource-level: the service scopes queries by <code>tenantId</code> and owner (<code>where: { id, tenantId }</code>), so even a correctly-roled user can't touch another tenant's row. Roles map to permissions in the DB, so product can add a role without a deploy; permissions are embedded in the token with a short TTL or looked up and cached. See <a href="#/topic/api-auth-rbac">AuthN, AuthZ &amp; RBAC</a>.</p></div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. What's a dynamic module and when would you write one?</div>
  <div class="qa-answer"><p>A module whose providers depend on configuration supplied by the importer: a static method like <code>forRoot(options)</code> returns a <code>DynamicModule</code> object (<code>module</code>, <code>providers</code>, <code>exports</code>, optionally <code>global</code>). <code>forRootAsync</code> takes <code>useFactory</code> + <code>inject</code> + <code>imports</code> so options can come from <code>ConfigService</code>. I write one for reusable infrastructure — an LLM client wrapper, a tenant-aware storage module. <code>ConfigurableModuleBuilder</code> generates the sync/async variants and the options token so you don't hand-roll them.</p></div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. You hit "Nest can't resolve dependencies of BookingsService (?, RoomsService)". How do you debug it?</div>
  <div class="qa-answer"><p>The <code>?</code> at index 0 means Nest couldn't determine that parameter's token. Causes, in order of likelihood: a circular <em>file</em> import (often via a barrel) making the class <code>undefined</code> when the decorator ran; a <code>type</code>-only import or an interface type, so no runtime metadata; a build setup that doesn't emit decorator metadata. If the name is shown instead of <code>?</code>, it's a module problem: the provider isn't exported by its module or the module isn't imported. Fix the import, use an explicit <code>@Inject(TOKEN)</code>, or break the cycle.</p></div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How do you handle circular dependencies?</div>
  <div class="qa-answer"><p>Treat it as a design signal. Usually two services each own half of a concept. I extract the shared logic into a third service both depend on, or invert one direction with domain events (<code>EventEmitter2</code> in-process, outbox + broker across services). <code>forwardRef(() =&gt; X)</code> on both the module import and the <code>@Inject</code> works, but instantiation order is undefined, so neither constructor can use the other — I'd only accept it temporarily.</p></div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How do you manage Prisma transactions across multiple services?</div>
  <div class="qa-answer"><p>Interactive <code>$transaction(async tx =&gt; ...)</code> with a timeout and the right isolation level. To span services either pass <code>tx</code> explicitly (service methods accept a <code>TransactionClient</code>) or propagate it with CLS (<code>@nestjs-cls/transactional</code>) so repositories transparently use the active transaction. Keep transactions short — no LLM or HTTP calls inside, since they hold row locks and a pool connection. For invariants like "no double booking", I rely on DB constraints (exclusion constraint) and map violations to 409, rather than only check-then-insert.</p></div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. How do you test a Nest app?</div>
  <div class="qa-answer"><p>Unit: <code>Test.createTestingModule</code> with only the class under test and <code>useValue</code> mocks for its dependencies. Enhancers: instantiate guards/pipes directly with a fake <code>ExecutionContext</code> and a real or spied <code>Reflector</code>. e2e: import <code>AppModule</code>, override external edges (<code>overrideProvider</code> for LLM/email clients, <code>overrideGuard</code> or an overridable <code>useExisting</code> APP_GUARD for auth), <code>createNestApplication()</code>, <code>init()</code>, then supertest against <code>app.getHttpServer()</code>, ideally on a real Postgres from testcontainers. Key gotcha: <code>main.ts</code> doesn't run in tests, so anything configured with <code>useGlobalX</code> is missing — another reason to use <code>APP_*</code> providers.</p></div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Interceptor or exception filter for a standard error envelope? And for a response envelope?</div>
  <div class="qa-answer"><p>Errors: exception filter — it's the only enhancer guaranteed to see exceptions from guards, pipes and handlers, and it controls the status code. Success envelope (<code>{ data, meta }</code>): an interceptor with <code>map()</code> on the handler's Observable. Using an interceptor's <code>catchError</code> for error envelopes misses guard failures (guards run before interceptors) and tends to swallow errors.</p></div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. How do you run background work — and why not just do it in the request?</div>
  <div class="qa-answer"><p>Anything slow, retriable or bursty (transcription, LLM scoring, emails, webhooks) goes to a queue: <code>@nestjs/bullmq</code> with a producer that enqueues with a deterministic <code>jobId</code> for idempotency, <code>attempts</code> + exponential backoff, and a <code>WorkerHost</code> processor with bounded concurrency. The API returns 202 with a job/resource id; the client polls or gets a push. Workers run as a separate deployment from the same codebase. Processing must be idempotent because delivery is at-least-once. For cross-service event streams with replay, Kafka instead — see <a href="#/topic/be-kafka">Kafka Deep</a>.</p></div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. (FDE) After a release, a customer reports p99 latency on the Nest API doubled, with no code change in the slow endpoints. Where do you look?</div>
  <div class="qa-answer"><p>First, what <em>did</em> change: dependency bumps, new global enhancers, a new provider. A classic culprit is a newly request-scoped provider — scope bubbling turns many controllers into per-request allocations without touching their code; check for <code>Scope.REQUEST</code> or <code>@Inject(REQUEST)</code> in the diff. Second, a new global interceptor or guard doing I/O per request (permission lookup without cache). Third, Prisma: a new <code>include</code> creating N+1 or a missing index, pool exhaustion (watch pool wait time), or a second <code>PrismaClient</code> doubling connections. I'd compare traces before/after per span (guard, handler, DB), confirm with a flame graph and event-loop lag, fix, and add a latency budget alert per route.</p></div>
</div>

<h3>Follow-ups interviewers love</h3>
<ul>
  <li>"Why does <code>getAllAndOverride</code> take an array of targets?" (Handler first, then class — first defined value wins.)</li>
  <li>"Where do you put rate limiting?" (<code>ThrottlerGuard</code> as an APP_GUARD with a Redis storage for multi-pod; key by user for authenticated routes.)</li>
  <li>"How does Nest know what to inject without decorators on every parameter?" (<code>emitDecoratorMetadata</code> → <code>design:paramtypes</code>.)</li>
  <li>"Express or Fastify adapter?" (Fastify for throughput, but check middleware/upload compatibility; filters must be adapter-agnostic.)</li>
</ul>
` },

  ]
});
