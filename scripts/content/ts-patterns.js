window.PREP_SITE.registerTopic({
  id: 'ts-patterns',
  module: 'typescript',
  title: 'Common Patterns',
  estimatedReadTime: '45 min',
  tags: ['typescript', 'patterns', 'discriminated-union', 'branded-types', 'builder', 'enums', 'state-machines', 'result-type'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>This is the working library of TypeScript patterns that show up in real product code, on real PR reviews, and in real interviews. Each one solves a specific problem; together they cover ~80% of the type-modeling decisions you make weekly.</p>
<ul>
  <li><strong>Discriminated unions</strong> for state, results, events.</li>
  <li><strong>Branded types</strong> for IDs and trusted strings.</li>
  <li><strong>Const-as-union</strong> instead of <code>enum</code>.</li>
  <li><strong>Builder pattern</strong> with <code>this</code> chaining.</li>
  <li><strong>Result/Either</strong> instead of throwing for expected errors.</li>
  <li><strong>State machines</strong> as discriminated unions of states with typed transitions.</li>
  <li><strong>Type-safe events / route maps</strong> — keyof + indexed access.</li>
  <li><strong>Validation at boundaries</strong> with <code>zod</code> or hand-rolled guards.</li>
  <li><strong>Builder of public API</strong> using <code>satisfies</code> + <code>as const</code>.</li>
  <li><strong>Type predicate functions</strong> (<code>x is T</code>) over assertions.</li>
</ul>
<p><strong>Mantra:</strong> "Don't model with optionality and any. Model with shape, narrow with discriminators, validate at the seam."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>Why patterns matter more than features</h3>
<p>TypeScript has hundreds of features — generics, conditional types, mapped types, template literals. Knowing them isn't enough. The skill that separates a senior TS engineer from a junior is recognizing which combination of features fits the situation, and reaching for the right one fast.</p>

<h3>What "common" means here</h3>
<p>These patterns appear in almost every nontrivial TS codebase: state managers, API clients, navigation libraries, form validators, error handlers, design tokens. Master them and you'll read any TS codebase confidently and write it idiomatically.</p>

<h3>The 10 patterns we'll cover</h3>
<table>
  <thead><tr><th>#</th><th>Pattern</th><th>Solves</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>Discriminated unions</td><td>Modeling states / results / events with exhaustiveness</td></tr>
    <tr><td>2</td><td>Branded (nominal) types</td><td>Distinguishing structurally-equal types (UserId vs OrderId)</td></tr>
    <tr><td>3</td><td>Const-as-union</td><td>Replacing <code>enum</code> with zero-runtime literal unions</td></tr>
    <tr><td>4</td><td>Builder pattern</td><td>Fluent, type-safe object construction with required-fields tracking</td></tr>
    <tr><td>5</td><td>Result / Either</td><td>Errors as values; exhaustive error handling</td></tr>
    <tr><td>6</td><td>State machines</td><td>Disallow invalid transitions at compile time</td></tr>
    <tr><td>7</td><td>Type-safe event emitter / router</td><td>Keying events/routes by literal types; payloads checked</td></tr>
    <tr><td>8</td><td>Boundary validation</td><td>Cast to <code>unknown</code>, narrow with guards or zod schemas</td></tr>
    <tr><td>9</td><td><code>satisfies</code> + <code>as const</code></td><td>Validate without widening; preserve literal types</td></tr>
    <tr><td>10</td><td>Type predicates &amp; assertion functions</td><td>Reusable narrowing utilities</td></tr>
  </tbody>
</table>

<h3>The unifying philosophy</h3>
<ol>
  <li><strong>Make illegal states unrepresentable.</strong> If "loading" and "error" can't coexist, don't model them as two booleans — model them as one tag.</li>
  <li><strong>Narrow at the boundary.</strong> Outside the boundary, types are lies (network, JSON, user input). Inside, types are truth.</li>
  <li><strong>Lean on inference.</strong> Annotate inputs and exports; let TS infer the rest. The narrower TS infers, the more it catches.</li>
  <li><strong>Compose small primitives.</strong> Each pattern is a few lines. Combinations cover the whole domain.</li>
</ol>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The "shape vs flag" rule</h3>
<p>If two states have different fields, they should be different shapes — not the same shape with optional fields and booleans. TS narrows by shape, not by flag.</p>
<pre><code class="language-ts">// BAD — every read needs ifs and ?? guards
interface State {
  loading: boolean;
  data?: User;
  error?: Error;
}

// GOOD — discriminated union, exhaustive narrowing
type State =
  | { kind: "loading" }
  | { kind: "loaded"; data: User }
  | { kind: "failed"; error: Error };
</code></pre>

<h3>The "boundary" rule</h3>
<p>Draw a line around your code. Inside the line, types are guaranteed. Outside (network, storage, user input, FFI), types are wishes. <strong>Validate every value crossing the line in.</strong> Don't validate ones already inside.</p>
<pre><code class="language-text">┌──────────────────────────────────────────┐
│       Inside the boundary (TS world)     │
│                                          │
│  TypedAPI ──&gt; pure logic ──&gt; UI         │
│      ▲                                   │
│      │ narrowed/validated here           │
│      │                                   │
└──────┼───────────────────────────────────┘
       │
   raw bytes / JSON / FormData / native bridge
</code></pre>

<h3>The "ID as not-just-string" rule</h3>
<p>If you have multiple ID flavors (UserId, ProductId, OrderId), make them distinguishable types. The cost is one tiny type alias; the benefit is "I just passed an order id to a user lookup" caught at compile time.</p>

<h3>The "<code>const</code> over <code>enum</code>" rule</h3>
<p>String unions + <code>as const</code> tuples replace 95% of enum use cases. Zero runtime cost, tree-shakable, no <code>const enum</code> footgun.</p>

<h3>The "result, not throw" rule</h3>
<p>Throwing is for genuinely exceptional things (programmer errors, infrastructure failure). For <em>expected</em> failure modes (form invalid, user not found, payment declined) — return a tagged result. Callers must handle it.</p>

<h3>The "<code>satisfies</code> first" rule</h3>
<p><code>satisfies</code> is the right default for object literals that should match a contract. It checks the shape without widening the inferred type — you keep the precise literal types for downstream use.</p>

<h3>The "predicate over assertion" rule</h3>
<p>Prefer <code>function isUser(x: unknown): x is User</code> (a type predicate) over <code>const u = x as User</code>. Predicates create real safety; assertions are statements of belief.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Pattern 1 — Discriminated union</h3>
<pre><code class="language-ts">type AsyncState&lt;T, E = Error&gt; =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; data: T }
  | { kind: "error"; error: E };

function render&lt;T&gt;(s: AsyncState&lt;T&gt;): string {
  switch (s.kind) {
    case "idle":    return "—";
    case "loading": return "…";
    case "success": return String(s.data);     // narrowed
    case "error":   return s.error.message;
    default: { const _: never = s; return _; } // exhaustiveness
  }
}
</code></pre>

<h3>Pattern 2 — Branded types</h3>
<pre><code class="language-ts">type Brand&lt;T, B extends string&gt; = T &amp; { readonly __brand: B };
type UserId  = Brand&lt;string, "UserId"&gt;;
type OrderId = Brand&lt;string, "OrderId"&gt;;

const userIdOf  = (s: string): UserId  =&gt; s as UserId;
const orderIdOf = (s: string): OrderId =&gt; s as OrderId;

function getUser(id: UserId): User { /*...*/ return null as any; }

const u = userIdOf("u_1");
const o = orderIdOf("o_1");
getUser(u);   // ✅
getUser(o);   // ❌
getUser("u_1"); // ❌ — must use the constructor
</code></pre>

<h3>Pattern 3 — Const-as-union (instead of enum)</h3>
<pre><code class="language-ts">// Tuple of constants
const STATUSES = ["draft", "published", "archived"] as const;
type Status = typeof STATUSES[number];     // "draft" | "published" | "archived"

// Object map
const ROLES = { admin: "admin", user: "user", guest: "guest" } as const;
type Role = typeof ROLES[keyof typeof ROLES];

// vs enum (avoid):
enum LegacyStatus { Draft, Published, Archived }   // adds a runtime object, harder to tree-shake
</code></pre>

<h3>Pattern 4 — Builder with type tracking</h3>
<pre><code class="language-ts">// Builder enforces required fields at compile time using a phantom type
type Required&lt;T, K extends keyof T&gt; = T &amp; { [P in K]-?: T[P] };

class QueryBuilder&lt;Built = {}&gt; {
  private opts = {} as any;

  table&lt;T extends string&gt;(t: T): QueryBuilder&lt;Built &amp; { table: T }&gt; {
    this.opts.table = t;
    return this as any;
  }

  where&lt;K extends string, V&gt;(k: K, v: V): QueryBuilder&lt;Built &amp; { where: { [P in K]: V } }&gt; {
    this.opts.where = { ...(this.opts.where || {}), [k]: v };
    return this as any;
  }

  build(this: QueryBuilder&lt;{ table: string }&gt;): Built {
    return this.opts;   // table required at .build() time
  }
}

// Usage:
const q = new QueryBuilder().table("users").where("id", "1").build();   // ✅
const q2 = new QueryBuilder().where("id", "1").build();                  // ❌ missing 'table'
</code></pre>

<h3>Pattern 5 — Result / Either</h3>
<pre><code class="language-ts">type Result&lt;T, E = Error&gt; =
  | { ok: true; value: T }
  | { ok: false; error: E };

const ok  = &lt;T&gt;(value: T): Result&lt;T, never&gt; =&gt; ({ ok: true, value });
const err = &lt;E&gt;(error: E): Result&lt;never, E&gt; =&gt; ({ ok: false, error });

function map&lt;T, U, E&gt;(r: Result&lt;T, E&gt;, fn: (x: T) =&gt; U): Result&lt;U, E&gt; {
  return r.ok ? ok(fn(r.value)) : r;
}
function flatMap&lt;T, U, E&gt;(r: Result&lt;T, E&gt;, fn: (x: T) =&gt; Result&lt;U, E&gt;): Result&lt;U, E&gt; {
  return r.ok ? fn(r.value) : r;
}

// Domain-specific error union
type ValidationError =
  | { code: "required"; field: string }
  | { code: "tooShort"; field: string; min: number };

function parseAge(raw: string): Result&lt;number, ValidationError&gt; {
  if (!raw) return err({ code: "required", field: "age" });
  const n = Number(raw);
  if (!Number.isInteger(n) || n &lt; 0) return err({ code: "tooShort", field: "age", min: 0 });
  return ok(n);
}
</code></pre>

<h3>Pattern 6 — State machine as discriminated union</h3>
<pre><code class="language-ts">// Order lifecycle: each state allows only some transitions
type Order =
  | { state: "draft"; items: Item[] }
  | { state: "submitted"; items: Item[]; submittedAt: Date }
  | { state: "shipped"; items: Item[]; submittedAt: Date; shippedAt: Date; tracking: string }
  | { state: "delivered"; items: Item[]; submittedAt: Date; shippedAt: Date; deliveredAt: Date };

function submit(o: Order &amp; { state: "draft" }): Order &amp; { state: "submitted" } {
  return { ...o, state: "submitted", submittedAt: new Date() };
}

function ship(o: Order &amp; { state: "submitted" }, tracking: string): Order &amp; { state: "shipped" } {
  return { ...o, state: "shipped", shippedAt: new Date(), tracking };
}

// Calling submit on a shipped order is a compile error.
const o1: Order = { state: "draft", items: [] };
const o2 = submit(o1);
const o3 = ship(o2, "TRK1");
const o4 = ship(o1, "TRK1");        // ❌ — draft, not submitted
</code></pre>

<h3>Pattern 7 — Type-safe event emitter / router</h3>
<pre><code class="language-ts">type EventMap = {
  "user:login":  { id: string };
  "user:logout": void;
  "msg:received": { from: string; text: string };
};

type Handler&lt;K extends keyof EventMap&gt; =
  EventMap[K] extends void
    ? () =&gt; void
    : (payload: EventMap[K]) =&gt; void;

class TypedEmitter&lt;E extends Record&lt;string, unknown&gt;&gt; {
  private fns = new Map&lt;keyof E, Function[]&gt;();
  on&lt;K extends keyof E&gt;(k: K, fn: E[K] extends void ? () =&gt; void : (p: E[K]) =&gt; void) {
    this.fns.set(k, [...(this.fns.get(k) ?? []), fn as Function]);
  }
  emit&lt;K extends keyof E&gt;(k: K, ...args: E[K] extends void ? [] : [payload: E[K]]) {
    this.fns.get(k)?.forEach(fn =&gt; fn(...args));
  }
}

const ee = new TypedEmitter&lt;EventMap&gt;();
ee.on("user:login", p =&gt; console.log(p.id));     // ✅
ee.emit("user:login", { id: "1" });                // ✅
ee.emit("user:login", { wrong: 1 });               // ❌
ee.emit("user:logout");                            // ✅
</code></pre>

<h3>Pattern 8 — Boundary validation</h3>
<pre><code class="language-ts">// Hand-rolled guard
function isUser(x: unknown): x is User {
  if (typeof x !== "object" || x === null) return false;
  const u = x as Record&lt;string, unknown&gt;;
  return typeof u.id === "string" &amp;&amp; typeof u.name === "string";
}

const raw: unknown = JSON.parse(text);
if (!isUser(raw)) throw new Error("Bad payload");
// raw is User here — narrowed safely

// With zod (recommended for non-trivial shapes):
import { z } from "zod";
const UserSchema = z.object({ id: z.string(), name: z.string() });
type User = z.infer&lt;typeof UserSchema&gt;;
const u = UserSchema.parse(JSON.parse(text));   // throws on invalid; returns User on success
</code></pre>

<h3>Pattern 9 — <code>satisfies</code> + <code>as const</code></h3>
<pre><code class="language-ts">// Routes — preserve literals while validating shape
const ROUTES = {
  home: "/",
  user: "/users/:id",
  order: "/orders/:id/items",
} satisfies Record&lt;string, string&gt;;

type RouteKey = keyof typeof ROUTES;          // "home" | "user" | "order"
const home: typeof ROUTES.home = "/";          // type narrowed to "/"

// Theme tokens with literal types preserved for autocomplete
const theme = {
  colors: { primary: "#1d72b8", danger: "#c42" },
  spacing: { xs: 4, sm: 8, md: 16 },
} as const satisfies { colors: Record&lt;string, string&gt;; spacing: Record&lt;string, number&gt; };

theme.colors.primary;   // type "#1d72b8" — autocomplete shows the literal
</code></pre>

<h3>Pattern 10 — Type predicates &amp; assertion functions</h3>
<pre><code class="language-ts">// Predicate — returns boolean, narrows in callers
function isString(x: unknown): x is string {
  return typeof x === "string";
}
function nonNull&lt;T&gt;(x: T): x is NonNullable&lt;T&gt; {
  return x !== null &amp;&amp; x !== undefined;
}

const xs: (string | null)[] = ["a", null, "b"];
const clean: string[] = xs.filter(nonNull);    // narrowed

// Assertion function — throws if not, narrows after
function assertIsString(x: unknown): asserts x is string {
  if (typeof x !== "string") throw new Error("Not a string");
}
function fn(x: unknown) {
  assertIsString(x);
  console.log(x.length);   // x narrowed to string
}
</code></pre>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Form validation with discriminated errors</h3>
<pre><code class="language-ts">type ValidationIssue =
  | { code: "required"; field: string }
  | { code: "tooShort"; field: string; min: number }
  | { code: "invalidFormat"; field: string; pattern: string };

type FormResult&lt;T&gt; =
  | { ok: true; value: T }
  | { ok: false; issues: ValidationIssue[] };

function validateLogin(input: { email?: string; password?: string }): FormResult&lt;{ email: string; password: string }&gt; {
  const issues: ValidationIssue[] = [];
  if (!input.email) issues.push({ code: "required", field: "email" });
  else if (!/^[^@]+@[^@]+\\.[^@]+$/.test(input.email)) issues.push({ code: "invalidFormat", field: "email", pattern: "email" });
  if (!input.password) issues.push({ code: "required", field: "password" });
  else if (input.password.length &lt; 8) issues.push({ code: "tooShort", field: "password", min: 8 });

  return issues.length
    ? { ok: false, issues }
    : { ok: true, value: { email: input.email!, password: input.password! } };
}

// Display layer — exhaustively switch on issue.code
function describe(issue: ValidationIssue): string {
  switch (issue.code) {
    case "required":      return \`\${issue.field} is required\`;
    case "tooShort":      return \`\${issue.field} must be at least \${issue.min} chars\`;
    case "invalidFormat": return \`\${issue.field} must match \${issue.pattern}\`;
  }
}
</code></pre>

<h3>Example 2: API client with typed routes</h3>
<pre><code class="language-ts">type Routes = {
  "GET /users":      { res: User[] };
  "GET /users/:id":  { params: { id: UserId }; res: User };
  "POST /users":     { body: { name: string }; res: User };
  "DELETE /users/:id": { params: { id: UserId }; res: { deleted: true } };
};

type RouteKey = keyof Routes;
type Has&lt;K, P extends string&gt; = K extends Record&lt;P, unknown&gt; ? K[P] : never;

async function api&lt;K extends RouteKey&gt;(
  key: K,
  ...args: Routes[K] extends { params: infer P; body: infer B }
    ? [{ params: P; body: B }]
    : Routes[K] extends { params: infer P }
      ? [{ params: P }]
      : Routes[K] extends { body: infer B }
        ? [{ body: B }]
        : []
): Promise&lt;Routes[K]["res"]&gt; {
  // build url + method from key, run fetch
  return null as any;
}

const list = await api("GET /users");
const u    = await api("GET /users/:id", { params: { id: userIdOf("1") } });
const new_ = await api("POST /users", { body: { name: "Jane" } });
const del  = await api("DELETE /users/:id", { params: { id: userIdOf("1") } });
</code></pre>

<h3>Example 3: React Native navigation with branded screen IDs</h3>
<pre><code class="language-ts">// In a feature module
declare global {
  namespace ReactNavigation {
    interface RootParamList {
      Profile: { userId: UserId };
      OrderDetail: { orderId: OrderId };
      Settings: undefined;
    }
  }
}
export {};

// Usage
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type Nav = NativeStackNavigationProp&lt;ReactNavigation.RootParamList&gt;;

function Btn() {
  const nav = useNavigation&lt;Nav&gt;();
  nav.navigate("Profile", { userId: userIdOf("u1") });    // ✅
  nav.navigate("Profile", { userId: orderIdOf("o1") });   // ❌ — type-incompatible
  nav.navigate("Settings");                                // ✅ — no params
}
</code></pre>

<h3>Example 4: Reducer with exhaustive action handling</h3>
<pre><code class="language-ts">type CartState =
  | { stage: "empty" }
  | { stage: "filled"; items: Item[]; subtotal: number };

type CartAction =
  | { type: "addItem"; item: Item }
  | { type: "removeItem"; id: ItemId }
  | { type: "clear" };

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "addItem": {
      if (state.stage === "empty") return { stage: "filled", items: [action.item], subtotal: action.item.price };
      return { ...state, items: [...state.items, action.item], subtotal: state.subtotal + action.item.price };
    }
    case "removeItem": {
      if (state.stage !== "filled") return state;
      const items = state.items.filter(i =&gt; i.id !== action.id);
      const subtotal = items.reduce((s, i) =&gt; s + i.price, 0);
      return items.length === 0 ? { stage: "empty" } : { stage: "filled", items, subtotal };
    }
    case "clear":
      return { stage: "empty" };
    default: { const _: never = action; return state; }
  }
}
</code></pre>

<h3>Example 5: Immutable theme tokens</h3>
<pre><code class="language-ts">const tokens = {
  color: { brand: "#5e3aee", danger: "#e02d35", text: "#1a1a1a" },
  radius: { sm: 4, md: 8, lg: 12 },
  font: { display: "Inter, sans-serif", mono: "Menlo, monospace" },
} as const;

type ColorToken = keyof typeof tokens.color;     // "brand" | "danger" | "text"
type RadiusToken = keyof typeof tokens.radius;

function color(t: ColorToken): string { return tokens.color[t]; }
color("brand");     // ✅
color("missing");   // ❌
</code></pre>

<h3>Example 6: API error union → user-facing copy</h3>
<pre><code class="language-ts">type ApiError =
  | { code: "network" }
  | { code: "auth"; reason: "expired" | "invalid" }
  | { code: "rateLimit"; retryAfter: number }
  | { code: "server"; status: 500 | 502 | 503 };

function userMessage(e: ApiError): string {
  switch (e.code) {
    case "network":    return "You're offline. Tap to retry.";
    case "auth":       return e.reason === "expired" ? "Session expired. Please log in." : "Authentication failed.";
    case "rateLimit":  return \`Too many requests. Try again in \${e.retryAfter}s.\`;
    case "server":     return \`Service unavailable (\${e.status}). We're on it.\`;
  }
}
</code></pre>

<h3>Example 7: Builder of a chainable HTTP request</h3>
<pre><code class="language-ts">class Req&lt;Method extends string = "GET", Body = undefined&gt; {
  constructor(
    private url: string,
    private method: Method = "GET" as Method,
    private body: Body = undefined as Body,
    private headers: Record&lt;string, string&gt; = {}
  ) {}
  post&lt;B&gt;(body: B): Req&lt;"POST", B&gt; { return new Req(this.url, "POST", body, this.headers); }
  put&lt;B&gt;(body: B): Req&lt;"PUT", B&gt; { return new Req(this.url, "PUT", body, this.headers); }
  header(k: string, v: string): this { this.headers[k] = v; return this; }
  async send&lt;T&gt;(): Promise&lt;T&gt; {
    const init: RequestInit = { method: this.method, headers: this.headers };
    if (this.body !== undefined) init.body = JSON.stringify(this.body);
    const r = await fetch(this.url, init);
    return r.json();
  }
}

const userList = await new Req&lt;"GET"&gt;("/users").header("X-Trace", "1").send&lt;User[]&gt;();
const created  = await new Req("/users").post({ name: "x" }).send&lt;User&gt;();
</code></pre>

<h3>Example 8: Predicate utilities</h3>
<pre><code class="language-ts">// Generic guards
const isString = (x: unknown): x is string =&gt; typeof x === "string";
const isNumber = (x: unknown): x is number =&gt; typeof x === "number" &amp;&amp; !Number.isNaN(x);
const isObject = (x: unknown): x is Record&lt;string, unknown&gt; =&gt; typeof x === "object" &amp;&amp; x !== null;
const hasKey = &lt;K extends string&gt;(k: K) =&gt; (x: unknown): x is Record&lt;K, unknown&gt; =&gt;
  isObject(x) &amp;&amp; k in x;

// Compose
const isError = (x: unknown): x is Error =&gt; x instanceof Error;
const isErrorish = (x: unknown): x is { message: string } =&gt;
  isObject(x) &amp;&amp; isString(x.message);

function fmt(e: unknown): string {
  if (isError(e)) return e.message;
  if (isErrorish(e)) return e.message;
  return String(e);
}
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Discriminated unions need a literal-typed discriminator</h3>
<pre><code class="language-ts">// BAD — string isn't narrowing the variants
type S = { kind: string; data: number } | { kind: string; error: string };

// GOOD — literal types
type S2 = { kind: "ok"; data: number } | { kind: "err"; error: string };
</code></pre>

<h3>Branded types lose their brand on serialization</h3>
<pre><code class="language-ts">const u: UserId = userIdOf("1");
const s = JSON.stringify({ id: u });   // string in JSON
const back = JSON.parse(s).id;         // string — no brand
// Re-brand at the boundary if you need the type back.
</code></pre>

<h3>Const-as-union doesn't enforce at runtime</h3>
<pre><code class="language-ts">const STATUSES = ["draft", "published"] as const;
type Status = typeof STATUSES[number];

const s: Status = "draft";       // ✅ at compile time
const raw = "frobnicated";        // any string
function take(s: Status) {}
take(raw as Status);              // bypass — TS can't know
</code></pre>
<p>For runtime checks: <code>STATUSES.includes(value)</code> with a type guard.</p>

<h3>Builder with phantom types — methods may need <code>this</code> constraints</h3>
<pre><code class="language-ts">// Forces .build() only after .table() was called
build(this: QueryBuilder&lt;{ table: string }&gt;): /*...*/
// vs naive return — would allow .build() on incomplete state
</code></pre>

<h3>Result type — be careful with default error types</h3>
<pre><code class="language-ts">type R&lt;T&gt; = { ok: true; value: T } | { ok: false; error: Error };
// Forces every error to be Error. Often you want a tighter union, parameterize E:
type R2&lt;T, E&gt; = { ok: true; value: T } | { ok: false; error: E };
</code></pre>

<h3>State machine — mutation shadows the discriminator</h3>
<pre><code class="language-ts">type Order = { state: "draft"; items: Item[] } | { state: "shipped"; items: Item[]; tracking: string };
const o: Order = { state: "draft", items: [] };
(o as any).state = "shipped";   // type system stale, code path now wrong
// Treat states as immutable — return new objects rather than mutating.
</code></pre>

<h3>Event emitter with overlapping payloads</h3>
<pre><code class="language-ts">type EventMap = {
  "click": { x: number; y: number };
  "click:hover": { x: number; y: number };   // same shape — TS can't disambiguate by structure
};
// Always discriminate on the key, not the payload.
</code></pre>

<h3>Boundary validation — partial validation lies</h3>
<pre><code class="language-ts">// BAD — half-validated, then trusted
function validateUser(x: unknown): x is User {
  return typeof x === "object" &amp;&amp; x !== null &amp;&amp; "id" in x;
  // missing: id is string, name is string, email format, etc.
}
// Use zod or write the check completely.
</code></pre>

<h3><code>satisfies</code> can still leak through inference</h3>
<pre><code class="language-ts">const t = { a: 1 } satisfies Record&lt;string, number&gt;;
const v = t.a;       // 1 (literal)
const x: Record&lt;string, number&gt; = t;
// x is now widened — copying widens the type
</code></pre>

<h3>Type predicates can lie</h3>
<pre><code class="language-ts">function isUser(x: any): x is User {
  return !!x;        // says yes for any truthy value
}
// TS believes the predicate. Wrong predicates poison the type system.
</code></pre>

<h3>Assertion functions need return type <code>asserts ...</code></h3>
<pre><code class="language-ts">// Without 'asserts', TS can't narrow
function check(x: unknown) {
  if (typeof x !== "string") throw new Error();
}

function fn(x: unknown) {
  check(x);
  x.length;        // ❌ — still unknown, TS didn't see assertion
}

// Fix
function check2(x: unknown): asserts x is string {
  if (typeof x !== "string") throw new Error();
}
</code></pre>

<h3>Discriminated union exhaustiveness — switch fallthrough</h3>
<pre><code class="language-ts">// Without break, fallthrough loses narrowing in subsequent cases
switch (s.kind) {
  case "ok": handleOk(s.data);    // narrowed
  case "err": handleErr(s.error); // ❌ — also runs after ok
}
// Always 'return' or 'break' per case.
</code></pre>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: Optional fields that should be discriminated</h3>
<pre><code class="language-ts">// BAD — every field optional, every read needs a check
interface State { loading?: boolean; data?: User; error?: Error; }

// GOOD — discriminator
type State =
  | { kind: "loading" }
  | { kind: "loaded"; data: User }
  | { kind: "failed"; error: Error };
</code></pre>

<h3>Bug 2: Branded type without a constructor</h3>
<pre><code class="language-ts">type UserId = string &amp; { __brand: "UserId" };

function send(id: UserId) {}
send("u_1");                  // ❌
send("u_1" as UserId);         // works but every call site needs 'as'

// FIX — provide a parser
const userIdOf = (s: string): UserId =&gt; {
  if (!/^u_/.test(s)) throw new Error("Bad UserId");
  return s as UserId;
};
</code></pre>

<h3>Bug 3: Reaching for <code>enum</code> by reflex</h3>
<pre><code class="language-ts">// BAD
enum Status { Draft, Published }
// Adds runtime object; numeric enums silently allow Status[5]; const enums break with isolatedModules

// GOOD
const STATUSES = ["draft", "published"] as const;
type Status = typeof STATUSES[number];
</code></pre>

<h3>Bug 4: Builder that always returns <code>this</code> the wrong way</h3>
<pre><code class="language-ts">// Loses subclass type
class Base {
  set(x: number): Base { return this; }
}
class Sub extends Base {
  extra(): Sub { return this; }
}
new Sub().set(1).extra();   // ❌ — set returned Base

// FIX — return 'this'
class Base2 { set(x: number): this { return this; } }
new Sub().set(1).extra();   // ✅
</code></pre>

<h3>Bug 5: Result type that throws inside</h3>
<pre><code class="language-ts">// BAD — defeats the whole point
function parseAge(raw: string): Result&lt;number, Error&gt; {
  return ok(Number(raw));   // throws never; but if it did, Result is bypassed
}
// Make sure functions returning Result NEVER throw for expected errors.
</code></pre>

<h3>Bug 6: State machine without state-typed mutators</h3>
<pre><code class="language-ts">// BAD — anyone can call ship() on any order
function ship(o: Order, tracking: string) {
  if (o.state !== "submitted") throw new Error("..."); // runtime check duplicates the type
  return { ...o, state: "shipped", tracking };
}

// GOOD — narrow at the parameter
function ship(o: Order &amp; { state: "submitted" }, tracking: string): Order &amp; { state: "shipped" } {
  return { ...o, state: "shipped", shippedAt: new Date(), tracking };
}
</code></pre>

<h3>Bug 7: Event emitter with <code>any</code> handlers</h3>
<pre><code class="language-ts">// Common before generics
class Emitter {
  on(event: string, fn: (payload: any) =&gt; void) {/*...*/}
}
// Now every handler accepts any payload — silently breaks across refactors
</code></pre>

<h3>Bug 8: Trusting <code>JSON.parse</code> with a cast</h3>
<pre><code class="language-ts">// BAD
const u = JSON.parse(raw) as User;

// GOOD
const u = UserSchema.parse(JSON.parse(raw));   // zod, throws on invalid
</code></pre>

<h3>Bug 9: Theme widened by annotation</h3>
<pre><code class="language-ts">// BAD — annotation widens
const theme: { colors: Record&lt;string, string&gt; } = { colors: { primary: "#1d72b8" } };
theme.colors.primary;   // string (you lost "#1d72b8")

// GOOD — satisfies preserves
const theme2 = { colors: { primary: "#1d72b8" } } satisfies { colors: Record&lt;string, string&gt; };
theme2.colors.primary;  // "#1d72b8"
</code></pre>

<h3>Bug 10: Predicate that's narrower than reality</h3>
<pre><code class="language-ts">function isError(x: unknown): x is Error {
  return x instanceof Error;
}
// Misses Errors thrown across realms (iframes), or custom error-like objects.
// Often safer:
function isErrorLike(x: unknown): x is { message: string; name?: string } {
  return typeof x === "object" &amp;&amp; x !== null &amp;&amp; typeof (x as any).message === "string";
}
</code></pre>

<h3>Anti-pattern 1: building patterns nobody uses</h3>
<p>If a pattern shows up once in your codebase, just inline it. Patterns earn their cost when applied 3+ times.</p>

<h3>Anti-pattern 2: hand-rolling <code>Result</code> in every project</h3>
<p>If your team uses <code>fp-ts</code>, <code>neverthrow</code>, or <code>ts-results</code> — adopt one. Your handwritten <code>Result</code> won't have map/flatMap/zip/sequence and the team will reinvent them.</p>

<h3>Anti-pattern 3: 12-state state machines as flat unions</h3>
<p>Past 6–8 states, the discriminator pattern strains. Reach for XState or a finite-state-machine library; the type system will still enforce transitions, but you get tooling and visualization.</p>

<h3>Anti-pattern 4: branded types for everything string</h3>
<p>Useful for IDs, tokens, and trusted strings (e.g., <code>SafeHtml</code>, <code>Sql</code>). Overkill for every domain string. Brand when confusion has bitten you, not preemptively.</p>

<h3>Anti-pattern 5: builders for 2-field constructors</h3>
<p>If your builder builds an object with 2 properties and no required-field tracking, just take an object: <code>new Foo({ x: 1, y: 2 })</code>.</p>

<h3>Anti-pattern 6: skipping boundary validation because "the backend is also TypeScript"</h3>
<p>Shared types are great. They're also a contract that holds for the version you both currently deploy. Validate at boundaries anyway — costs nothing, catches mismatches.</p>

<h3>Anti-pattern 7: predicates with <code>any</code> input</h3>
<pre><code class="language-ts">function isUser(x: any): x is User { /*...*/ }   // any erodes safety in callers
function isUser(x: unknown): x is User { /*...*/ } // safer; forces narrowing
</code></pre>
`
    },
    {
      id: 'interview-patterns',
      title: '🎤 Interview Patterns',
      html: `
<h3>Patterns FAANG and mid-size shops actually grade on</h3>
<table>
  <thead><tr><th>Pattern</th><th>What's being tested</th></tr></thead>
  <tbody>
    <tr><td>Discriminated unions</td><td>Domain modeling skill; exhaustiveness via <code>never</code>.</td></tr>
    <tr><td>Branded types</td><td>You think about type-level safety beyond shape; you can defend the cost.</td></tr>
    <tr><td>Const-as-union</td><td>You reach for it before <code>enum</code>; you can articulate the runtime difference.</td></tr>
    <tr><td>Result / Either</td><td>You distinguish expected vs unexpected errors.</td></tr>
    <tr><td>State machines</td><td>You make illegal transitions unrepresentable.</td></tr>
    <tr><td>Boundary validation</td><td>You don't trust JSON.parse; you cast to <code>unknown</code> and narrow.</td></tr>
    <tr><td><code>satisfies</code> + <code>as const</code></td><td>You preserve literals; you understand why annotation widens.</td></tr>
    <tr><td>Type predicates</td><td>You write reusable narrow functions instead of <code>as</code>.</td></tr>
  </tbody>
</table>

<h3>Live-coding warmups</h3>
<ol>
  <li>Write an <code>AsyncState&lt;T&gt;</code> discriminated union and a <code>render</code> that exhaustively narrows.</li>
  <li>Implement <code>UserId</code> and <code>OrderId</code> as branded types with constructor functions.</li>
  <li>Convert an existing <code>enum</code> to a const-as-union without breaking callers.</li>
  <li>Build a <code>Result&lt;T, E&gt;</code> with <code>ok</code>/<code>err</code>/<code>map</code>/<code>flatMap</code>.</li>
  <li>Type a state machine for an order: draft → submitted → shipped → delivered.</li>
  <li>Build a typed event emitter where <code>on</code>/<code>emit</code> reject wrong payloads.</li>
  <li>Write a <code>nonNull</code> predicate that filters out <code>null</code>/<code>undefined</code>.</li>
  <li>Use <code>satisfies</code> to validate a tokens object while preserving literal hex values.</li>
  <li>Type a <code>buildUrl</code> function that derives required params from a path string.</li>
  <li>Define an <code>ApiError</code> union and a <code>userMessage</code> mapping that's exhaustive.</li>
</ol>

<h3>"Spot the issue" classics</h3>
<ul>
  <li>State modeled as 3 booleans + optional data + optional error → suggest discriminated union.</li>
  <li>Function with parameter typed <code>any</code> at call site → suggest <code>unknown</code> + narrowing.</li>
  <li>Builder returning <code>Base</code> instead of <code>this</code> → loses subclass type.</li>
  <li><code>JSON.parse(raw) as Config</code> → suggest validation library or hand-rolled guard.</li>
  <li><code>enum</code> with const-as-union opportunity → swap.</li>
  <li>Predicate <code>(x: any): x is User</code> with body <code>!!x</code> → broken; fix the body and tighten input to <code>unknown</code>.</li>
</ul>

<h3>"Two-minute" design prompts</h3>
<ul>
  <li><em>"Type a feature flag config so unknown flags fail at compile time."</em>
    <pre><code class="language-ts">const FLAGS = { newCheckout: false, fastList: true } as const;
type Flag = keyof typeof FLAGS;
function isOn(f: Flag): boolean { return FLAGS[f]; }
isOn("newCheckout"); // ✅
isOn("nope");        // ❌</code></pre>
  </li>
  <li><em>"Type a function that picks a user by ID where IDs differ between admin and customer."</em>
    <pre><code class="language-ts">type AdminId = Brand&lt;string, "AdminId"&gt;;
type CustomerId = Brand&lt;string, "CustomerId"&gt;;
function findCustomer(id: CustomerId) {/*...*/}
function findAdmin(id: AdminId) {/*...*/}</code></pre>
  </li>
  <li><em>"A multi-step form where each step's data is required to advance to the next."</em>
    <pre><code class="language-ts">type Step1 = { step: 1; email: string };
type Step2 = Step1 &amp; { step: 2; password: string };
type Step3 = Step2 &amp; { step: 3; profile: { name: string } };
type FormState = Step1 | Step2 | Step3;</code></pre>
  </li>
</ul>

<h3>"What pattern would you reach for?" prompts</h3>
<table>
  <thead><tr><th>Problem</th><th>Pattern</th></tr></thead>
  <tbody>
    <tr><td>Replace <code>throw</code> for expected validation failures</td><td>Result / Either</td></tr>
    <tr><td>Catch "passed an order id where a user id was expected"</td><td>Branded types</td></tr>
    <tr><td>Domain has 4 states with different fields per state</td><td>Discriminated union (+ exhaustive switch)</td></tr>
    <tr><td>Public theme tokens with autocomplete on hex values</td><td><code>as const</code> + <code>satisfies</code></td></tr>
    <tr><td>Listening to a typed event channel</td><td>Type-safe event emitter (keyof + indexed access)</td></tr>
    <tr><td>Preventing <code>shipOrder</code> from being called on a draft</td><td>State machine via discriminated union</td></tr>
    <tr><td>Trusting incoming JSON</td><td>Boundary validation (zod/io-ts/hand-rolled guard)</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li><strong>Navigation:</strong> branded screen-param IDs prevent crossing user/order/post types in <code>navigate(...)</code>.</li>
  <li><strong>Reducers:</strong> RN apps that use <code>useReducer</code> or Redux benefit hugely from discriminated action unions and exhaustive <code>switch</code>.</li>
  <li><strong>Theme tokens:</strong> <code>as const</code> + <code>satisfies</code> make the design system autocompleted across a hundred call sites.</li>
  <li><strong>Native bridge results:</strong> wrap return values in <code>Result&lt;T, NativeError&gt;</code> — native modules fail in many ways and the type system can capture them.</li>
  <li><strong>Form state machines:</strong> multi-step onboarding flows are perfect for state-as-discriminated-union with phased required fields.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd add <code>zod</code> at every boundary so the runtime and types stay aligned."</li>
  <li>"I'd promote the action union into a feature-scoped event bus typed by event name + payload."</li>
  <li>"I'd extract the branded type constructors into a tiny utilities package shared across services."</li>
  <li>"I'd explore <code>xstate</code> once we exceed ~6 states — its visualizer becomes net positive past that size."</li>
  <li>"I'd convert legacy <code>enum</code>s gradually with a codemod, keeping public API stable via re-exports."</li>
</ul>
`
    }
  ]
});
