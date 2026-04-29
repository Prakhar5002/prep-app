window.PREP_SITE.registerTopic({
  id: 'ts-conditional',
  module: 'typescript',
  title: 'Conditional & Mapped Types',
  estimatedReadTime: '45 min',
  tags: ['typescript', 'conditional-types', 'mapped-types', 'infer', 'distributive', 'template-literal-types', 'utility-types'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Conditional and mapped types</strong> are TypeScript's type-level programming primitives. Conditional types are <code>if/else</code> for types; mapped types are <code>map()</code> for object shapes. Combined with <code>infer</code> and template literal types, they let you derive new types from existing ones instead of duplicating them.</p>
<ul>
  <li><strong>Conditional:</strong> <code>type X = T extends U ? A : B</code> — type-level ternary.</li>
  <li><strong>Distributive:</strong> when T is a "naked" type parameter and a union, the conditional applies to each member individually.</li>
  <li><strong>infer:</strong> the type-level pattern-match — extracts a sub-type from inside another type.</li>
  <li><strong>Mapped types:</strong> <code>{ [K in keyof T]: ... }</code> — transform every property of T.</li>
  <li><strong>Modifiers:</strong> <code>+/-readonly</code> and <code>+/-?</code> on mapped types to add or strip readonly/optional.</li>
  <li><strong>Key remapping (<code>as</code>):</strong> rename or filter keys during a map.</li>
  <li><strong>Template literal types:</strong> string-level type computation for routes, event names, css properties.</li>
  <li><strong>Utility types</strong> like <code>Pick</code>, <code>Omit</code>, <code>Partial</code>, <code>ReturnType</code>, <code>Parameters</code> are built from these primitives — and you can write your own.</li>
</ul>
<p><strong>Mantra:</strong> "If your type is a function of another type, write it that way — don't duplicate."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What problem do conditional types solve?</h3>
<p>Sometimes the type you want depends on another type. The classic example: a function that, given an array, returns one element of it. The return type is always "the array's element type" — but that depends on the array.</p>
<pre><code class="language-ts">// Without conditional types — verbose, duplicated
function head1(xs: string[]): string | undefined;
function head1(xs: number[]): number | undefined;
function head1(xs: any[]): any { return xs[0]; }

// With generics — already nice
function head2&lt;T&gt;(xs: T[]): T | undefined { return xs[0]; }

// With conditional types — derive the element type from the array type
type ElementOf&lt;A&gt; = A extends readonly (infer E)[] ? E : never;

function head3&lt;A extends readonly unknown[]&gt;(a: A): ElementOf&lt;A&gt; | undefined {
  return a[0] as ElementOf&lt;A&gt; | undefined;
}
</code></pre>

<h3>What problem do mapped types solve?</h3>
<p>You frequently want a type that mirrors another type's shape with a transformation: every field optional, every field readonly, every field a Promise. Without mapped types you'd hand-write each variant.</p>
<pre><code class="language-ts">type User = { id: string; name: string; age: number };

// Hand-written — duplicates the shape
type PartialUser = { id?: string; name?: string; age?: number };

// Mapped — derived
type PartialUser2 = { [K in keyof User]?: User[K] };

// Built-in
type PartialUser3 = Partial&lt;User&gt;;
</code></pre>

<h3>Why this matters in real code</h3>
<table>
  <thead><tr><th>Pattern</th><th>Real-world use</th></tr></thead>
  <tbody>
    <tr><td><code>Partial&lt;T&gt;</code></td><td>PATCH endpoints — update a subset of fields</td></tr>
    <tr><td><code>Required&lt;T&gt;</code></td><td>Strip optionality after validation</td></tr>
    <tr><td><code>Pick&lt;T, K&gt;</code> / <code>Omit&lt;T, K&gt;</code></td><td>Public-facing DTO shapes from richer domain types</td></tr>
    <tr><td><code>ReturnType&lt;F&gt;</code> / <code>Parameters&lt;F&gt;</code></td><td>Don't repeat function types — derive them</td></tr>
    <tr><td><code>Awaited&lt;T&gt;</code></td><td>Strip Promise wrapper from async returns</td></tr>
    <tr><td>Template literal types</td><td>Type-safe routes, event names, css properties</td></tr>
    <tr><td>Custom utility types</td><td>Domain-specific transforms (e.g., <code>Stringify&lt;T&gt;</code>, <code>DeepReadonly&lt;T&gt;</code>)</td></tr>
  </tbody>
</table>

<h3>The mental shift</h3>
<p>You stop thinking "I need to write a type" and start thinking "I need to compute a type." Conditional types are <code>if</code>, mapped types are <code>map</code>, <code>infer</code> is destructuring. Together they form a tiny pure functional language whose values are types.</p>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>Conditional type = ternary on types</h3>
<pre><code class="language-ts">// Reads exactly like JS ternary
type IsString&lt;T&gt; = T extends string ? "yes" : "no";

type A = IsString&lt;"hi"&gt;;       // "yes"
type B = IsString&lt;42&gt;;          // "no"
type C = IsString&lt;string&gt;;      // "yes"
type D = IsString&lt;number | string&gt;; // "yes" | "no"  ← distribution!
</code></pre>

<h3>Distribution: the union surprise</h3>
<p>When the checked type is a "naked" type parameter (i.e., not wrapped) and you pass it a union, the conditional <em>distributes</em> over each member. This is powerful but sometimes counter-intuitive.</p>
<pre><code class="language-ts">type ToArray&lt;T&gt; = T extends any ? T[] : never;
type R = ToArray&lt;string | number&gt;;     // string[] | number[]   (distributed)

// To suppress distribution, wrap in a tuple:
type ToArrayNonDist&lt;T&gt; = [T] extends [any] ? T[] : never;
type R2 = ToArrayNonDist&lt;string | number&gt;;  // (string | number)[]
</code></pre>

<h3>Distribution and <code>never</code></h3>
<pre><code class="language-ts">// never is the empty union; distribution over empty = empty
type X = ToArray&lt;never&gt;;     // never (not never[]!)
type Y = ToArrayNonDist&lt;never&gt;; // never[]
</code></pre>
<p>This is a common surprise. If you want a function that maps <code>never</code> to <code>never[]</code>, suppress distribution.</p>

<h3><code>infer</code> = destructure inside a conditional</h3>
<p><code>infer</code> only appears in the <code>extends</code> branch of a conditional type. It binds a name to whatever sub-type matches the pattern, available in the true branch.</p>
<pre><code class="language-ts">type ReturnT&lt;F&gt; = F extends (...args: any[]) =&gt; infer R ? R : never;
type ParamsT&lt;F&gt; = F extends (...args: infer A) =&gt; any ? A : never;

type R1 = ReturnT&lt;() =&gt; string&gt;;             // string
type R2 = ParamsT&lt;(a: number, b: string) =&gt; void&gt;;   // [number, string]

// Multiple infers
type FirstArg&lt;F&gt; = F extends (a: infer A, ...rest: any[]) =&gt; any ? A : never;

// Recursive infer (TS 4.5+)
type Awaited2&lt;T&gt; = T extends Promise&lt;infer U&gt; ? Awaited2&lt;U&gt; : T;
</code></pre>

<h3>Mapped type = "for each key in T, produce a property"</h3>
<pre><code class="language-ts">type Stringify&lt;T&gt; = { [K in keyof T]: string };
type S = Stringify&lt;{ a: number; b: boolean }&gt;;   // { a: string; b: string }
</code></pre>
<p>The <code>[K in U]</code> syntax iterates over each member of U (typically <code>keyof T</code>) and produces one property per iteration. The right-hand side computes the value type, often using <code>T[K]</code>.</p>

<h3>Mapped type modifiers: + and -</h3>
<table>
  <thead><tr><th>Syntax</th><th>Effect</th></tr></thead>
  <tbody>
    <tr><td><code>readonly</code> / <code>+readonly</code></td><td>Add readonly</td></tr>
    <tr><td><code>-readonly</code></td><td>Strip readonly (mutable)</td></tr>
    <tr><td><code>?</code> / <code>+?</code></td><td>Add optional</td></tr>
    <tr><td><code>-?</code></td><td>Strip optional (required)</td></tr>
  </tbody>
</table>
<pre><code class="language-ts">type Mutable&lt;T&gt; = { -readonly [K in keyof T]: T[K] };
type RequiredX&lt;T&gt; = { [K in keyof T]-?: T[K] };
</code></pre>

<h3>Key remapping with <code>as</code> (TS 4.1+)</h3>
<pre><code class="language-ts">type Getters&lt;T&gt; = {
  [K in keyof T as \`get\${Capitalize&lt;string &amp; K&gt;}\`]: () =&gt; T[K];
};

type G = Getters&lt;{ name: string; age: number }&gt;;
// { getName: () =&gt; string; getAge: () =&gt; number }

// Filter keys by remapping to never
type StringKeys&lt;T&gt; = { [K in keyof T as T[K] extends string ? K : never]: T[K] };
type SK = StringKeys&lt;{ a: string; b: number; c: string }&gt;;
// { a: string; c: string }   — number keys filtered out
</code></pre>

<h3>Template literal types — strings as type-level computation</h3>
<pre><code class="language-ts">type Greeting = \`hello \${string}\`;
const a: Greeting = "hello world";   // ✅
const b: Greeting = "hi there";       // ❌

type Method = "GET" | "POST" | "PUT" | "DELETE";
type Path = "/users" | "/orders";
type Endpoint = \`\${Method} \${Path}\`;  // 8 string literals, fully enumerated

type CSSProp = \`--\${string}\`;   // any CSS variable name
</code></pre>

<h3>The four built-in string-manipulation types</h3>
<pre><code class="language-ts">type A = Uppercase&lt;"hello"&gt;;    // "HELLO"
type B = Lowercase&lt;"HELLO"&gt;;    // "hello"
type C = Capitalize&lt;"hello"&gt;;   // "Hello"
type D = Uncapitalize&lt;"Hello"&gt;; // "hello"
</code></pre>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Conditional type basics</h3>
<pre><code class="language-ts">// Subtype check
type IsArray&lt;T&gt; = T extends unknown[] ? true : false;

// Default fallback in generic position
type Default&lt;T, D&gt; = [T] extends [undefined] ? D : T;

// Filter from a union
type NonNull&lt;T&gt; = T extends null | undefined ? never : T;
type Clean = NonNull&lt;string | null | undefined&gt;;   // string

// The built-in form:
type Clean2 = NonNullable&lt;string | null | undefined&gt;;
</code></pre>

<h3>Inferring from arrays, tuples, functions, promises</h3>
<pre><code class="language-ts">// Element of array
type ElementOf&lt;A&gt; = A extends readonly (infer E)[] ? E : never;
type E1 = ElementOf&lt;number[]&gt;;        // number
type E2 = ElementOf&lt;[1, "x", true]&gt;;  // 1 | "x" | true

// First element of tuple
type Head&lt;T extends readonly any[]&gt; = T extends readonly [infer H, ...any[]] ? H : never;
type H1 = Head&lt;[1, 2, 3]&gt;;             // 1

// Tail
type Tail&lt;T extends readonly any[]&gt; = T extends readonly [any, ...infer R] ? R : never;
type T1 = Tail&lt;[1, 2, 3]&gt;;             // [2, 3]

// Last
type Last&lt;T extends readonly any[]&gt; = T extends readonly [...any[], infer L] ? L : never;
type L1 = Last&lt;[1, 2, 3]&gt;;             // 3

// Function return + parameters
type Return&lt;F&gt; = F extends (...a: any[]) =&gt; infer R ? R : never;
type Params&lt;F&gt; = F extends (...a: infer A) =&gt; any ? A : never;

// Promise unwrap (one level)
type UnwrapPromise&lt;T&gt; = T extends Promise&lt;infer U&gt; ? U : T;

// Recursive promise unwrap (TS 4.5+ — Awaited&lt;T&gt; is built-in)
type DeepUnwrap&lt;T&gt; = T extends Promise&lt;infer U&gt; ? DeepUnwrap&lt;U&gt; : T;
</code></pre>

<h3>Distributive vs non-distributive — a side-by-side</h3>
<pre><code class="language-ts">// Distributive — applies to each union member
type Box&lt;T&gt; = T extends any ? { value: T } : never;
type B1 = Box&lt;string | number&gt;;  // { value: string } | { value: number }

// Non-distributive — wrap T in a tuple to suppress
type BoxAll&lt;T&gt; = [T] extends [any] ? { value: T } : never;
type B2 = BoxAll&lt;string | number&gt;;  // { value: string | number }

// Common use: filter a union
type ExcludeNumber&lt;T&gt; = T extends number ? never : T;
type R = ExcludeNumber&lt;string | number | boolean&gt;;  // string | boolean
// Built-in equivalent: Exclude&lt;T, U&gt;
type Exclude2&lt;T, U&gt; = T extends U ? never : T;
type Extract2&lt;T, U&gt; = T extends U ? T : never;
</code></pre>

<h3>Mapped types — full toolkit</h3>
<pre><code class="language-ts">// Identity (same as T)
type Identity&lt;T&gt; = { [K in keyof T]: T[K] };

// All optional
type Partial2&lt;T&gt; = { [K in keyof T]?: T[K] };

// All required
type Required2&lt;T&gt; = { [K in keyof T]-?: T[K] };

// All readonly
type Readonly2&lt;T&gt; = { readonly [K in keyof T]: T[K] };

// All mutable
type Mutable&lt;T&gt; = { -readonly [K in keyof T]: T[K] };

// Pick by key set
type Pick2&lt;T, K extends keyof T&gt; = { [P in K]: T[P] };

// Omit (build via Pick + Exclude)
type Omit2&lt;T, K extends keyof any&gt; = Pick&lt;T, Exclude&lt;keyof T, K&gt;&gt;;

// Record (uniform value type for a key set)
type Record2&lt;K extends keyof any, T&gt; = { [P in K]: T };
</code></pre>

<h3>Combining mapped + conditional</h3>
<pre><code class="language-ts">// Stringify all values — preserves keys
type Stringify&lt;T&gt; = { [K in keyof T]: string };

// Wrap each value in Promise
type Promisify&lt;T&gt; = { [K in keyof T]: Promise&lt;T[K]&gt; };

// Convert a value-bag of types into a function-bag of getters
type Getters&lt;T&gt; = { [K in keyof T as \`get\${Capitalize&lt;string &amp; K&gt;}\`]: () =&gt; T[K] };

// Pick only function-typed keys
type Functions&lt;T&gt; = { [K in keyof T as T[K] extends (...args: any) =&gt; any ? K : never]: T[K] };
type FN = Functions&lt;{ name: string; greet(): void; size: number; calc(): number }&gt;;
// { greet(): void; calc(): number }
</code></pre>

<h3>Deep mapped types — recursion</h3>
<pre><code class="language-ts">// Deep partial — recursively make every nested field optional
type DeepPartial&lt;T&gt; = T extends object
  ? T extends Function ? T : { [K in keyof T]?: DeepPartial&lt;T[K]&gt; }
  : T;

type Config = { db: { host: string; port: number }; flags: { enabled: boolean } };
type DC = DeepPartial&lt;Config&gt;;
// { db?: { host?: string; port?: number }; flags?: { enabled?: boolean } }

// Deep readonly
type DeepReadonly&lt;T&gt; = T extends object
  ? T extends Function ? T : { readonly [K in keyof T]: DeepReadonly&lt;T[K]&gt; }
  : T;
</code></pre>

<h3>Template literal types — practical patterns</h3>
<pre><code class="language-ts">// Build a path like "/users/:id/orders/:orderId"
type ExtractParams&lt;P extends string&gt; =
  P extends \`\${string}:\${infer Param}/\${infer Rest}\`
    ? Param | ExtractParams&lt;\`/\${Rest}\`&gt;
    : P extends \`\${string}:\${infer Param}\`
      ? Param
      : never;

type Params = ExtractParams&lt;"/users/:id/orders/:orderId"&gt;;
// "id" | "orderId"

// Type-safe route params
type Route = "/users/:id/orders/:orderId";
type RouteParams&lt;R extends string&gt; = { [K in ExtractParams&lt;R&gt;]: string };
type P = RouteParams&lt;Route&gt;;   // { id: string; orderId: string }

// Event names with namespacing
type EventName&lt;NS extends string, E extends string&gt; = \`\${NS}:\${E}\`;
type AppEvent = EventName&lt;"auth", "login" | "logout"&gt;;   // "auth:login" | "auth:logout"

// CSS property name validation
type CSSCustomProp&lt;Name extends string&gt; = \`--\${Name}\`;
type Color = CSSCustomProp&lt;"primary" | "secondary"&gt;;   // "--primary" | "--secondary"
</code></pre>

<h3>Conditional types in function signatures</h3>
<pre><code class="language-ts">// Function whose return type depends on input
function parse&lt;T extends "json" | "text"&gt;(
  raw: string,
  kind: T
): T extends "json" ? object : string {
  return (kind === "json" ? JSON.parse(raw) : raw) as any;
}

const j = parse("{}", "json");    // object
const s = parse("hello", "text"); // string
</code></pre>

<h3>The "never" trick for filtering keys</h3>
<pre><code class="language-ts">// Remove keys whose value type is undefined
type RemoveUndefined&lt;T&gt; = {
  [K in keyof T as T[K] extends undefined ? never : K]: T[K]
};

type X = RemoveUndefined&lt;{ a: string; b: undefined; c: number }&gt;;
// { a: string; c: number }
</code></pre>

<h3>Built-in utility types — one-line equivalents</h3>
<pre><code class="language-ts">// Partial&lt;T&gt;        = { [K in keyof T]?: T[K] }
// Required&lt;T&gt;       = { [K in keyof T]-?: T[K] }
// Readonly&lt;T&gt;       = { readonly [K in keyof T]: T[K] }
// Pick&lt;T, K&gt;        = { [P in K]: T[P] }
// Omit&lt;T, K&gt;        = Pick&lt;T, Exclude&lt;keyof T, K&gt;&gt;
// Record&lt;K, T&gt;      = { [P in K]: T }
// Exclude&lt;T, U&gt;     = T extends U ? never : T
// Extract&lt;T, U&gt;     = T extends U ? T : never
// NonNullable&lt;T&gt;    = T extends null | undefined ? never : T
// ReturnType&lt;F&gt;     = F extends (...a: any[]) =&gt; infer R ? R : never
// Parameters&lt;F&gt;     = F extends (...a: infer A) =&gt; any ? A : never
// ConstructorParameters&lt;C&gt; = C extends new (...a: infer A) =&gt; any ? A : never
// InstanceType&lt;C&gt;   = C extends new (...a: any) =&gt; infer R ? R : never
// Awaited&lt;T&gt;        = T extends Promise&lt;infer U&gt; ? Awaited&lt;U&gt; : T
// ThisParameterType&lt;F&gt; = F extends (this: infer T, ...a: any[]) =&gt; any ? T : unknown
// OmitThisParameter&lt;F&gt; = ...
</code></pre>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Type-safe Redux-style action creator</h3>
<pre><code class="language-ts">type ActionCreators = {
  setUser: (id: string) =&gt; void;
  setTheme: (theme: "light" | "dark") =&gt; void;
  logout: () =&gt; void;
};

// Derive action union from creators
type Action&lt;T&gt; = {
  [K in keyof T]: T[K] extends (...args: infer A) =&gt; any
    ? A extends []
      ? { type: K }
      : { type: K; payload: A[0] }
    : never;
}[keyof T];

type AppAction = Action&lt;ActionCreators&gt;;
// | { type: "setUser"; payload: string }
// | { type: "setTheme"; payload: "light" | "dark" }
// | { type: "logout" }
</code></pre>

<h3>Example 2: Form state derived from a schema</h3>
<pre><code class="language-ts">type FieldType = "string" | "number" | "boolean";
type Schema = Record&lt;string, FieldType&gt;;

type FieldValue&lt;T extends FieldType&gt; =
  T extends "string" ? string
  : T extends "number" ? number
  : T extends "boolean" ? boolean
  : never;

type FormState&lt;S extends Schema&gt; = { [K in keyof S]: FieldValue&lt;S[K]&gt; };
type FormErrors&lt;S extends Schema&gt; = { [K in keyof S]?: string };

const profileSchema = { name: "string", age: "number", subscribed: "boolean" } as const;
type ProfileForm = FormState&lt;typeof profileSchema&gt;;
// { name: string; age: number; subscribed: boolean }
type ProfileErrors = FormErrors&lt;typeof profileSchema&gt;;
</code></pre>

<h3>Example 3: Type-safe URL builder</h3>
<pre><code class="language-ts">type ExtractParams&lt;P extends string&gt; =
  P extends \`\${string}:\${infer Param}/\${infer Rest}\`
    ? Param | ExtractParams&lt;\`/\${Rest}\`&gt;
    : P extends \`\${string}:\${infer Param}\`
      ? Param
      : never;

function buildUrl&lt;P extends string&gt;(
  path: P,
  params: { [K in ExtractParams&lt;P&gt;]: string }
): string {
  return path.replace(/:(\\w+)/g, (_, k) =&gt; (params as any)[k]);
}

buildUrl("/users/:id/orders/:orderId", { id: "1", orderId: "5" });   // ✅
buildUrl("/users/:id", { id: "1", extra: "x" });                      // ❌ extra not allowed (excess)
buildUrl("/users/:id", { id: "1" });                                   // ✅
buildUrl("/users/:id", {});                                            // ❌ missing 'id'
</code></pre>

<h3>Example 4: Recursive deep types</h3>
<pre><code class="language-ts">type DeepPartial&lt;T&gt; = T extends Function
  ? T
  : T extends Array&lt;infer U&gt;
    ? DeepPartial&lt;U&gt;[]
    : T extends object
      ? { [K in keyof T]?: DeepPartial&lt;T[K]&gt; }
      : T;

type DeepRequired&lt;T&gt; = T extends Function
  ? T
  : T extends Array&lt;infer U&gt;
    ? DeepRequired&lt;U&gt;[]
    : T extends object
      ? { [K in keyof T]-?: DeepRequired&lt;T[K]&gt; }
      : T;

type Settings = { ui?: { theme?: "light" | "dark"; size?: number } };
type LooseSettings = DeepPartial&lt;Settings&gt;;     // identical here, T already optional
type StrictSettings = DeepRequired&lt;Settings&gt;;
// { ui: { theme: "light" | "dark"; size: number } }
</code></pre>

<h3>Example 5: Pick by value type</h3>
<pre><code class="language-ts">type PickByValue&lt;T, V&gt; = {
  [K in keyof T as T[K] extends V ? K : never]: T[K]
};

type Mixed = { name: string; age: number; greet(): void; calc(n: number): number };
type Methods = PickByValue&lt;Mixed, Function&gt;;        // { greet: ...; calc: ... }
type Strings = PickByValue&lt;Mixed, string&gt;;          // { name: string }
</code></pre>

<h3>Example 6: Function overload-to-union via inference</h3>
<pre><code class="language-ts">// Extract last overload's return type (a known TS quirk: only the last is inferred)
type LastReturnType&lt;F&gt; = F extends { (...a: infer _): infer R } ? R : never;

interface Foo {
  (x: string): number;
  (x: number): boolean;
}

type R = LastReturnType&lt;Foo&gt;;   // boolean
</code></pre>

<h3>Example 7: Mutable-only / readonly-only key sets</h3>
<pre><code class="language-ts">// Detect which keys are readonly
type IfEquals&lt;X, Y, A, B&gt; =
  (&lt;T&gt;() =&gt; T extends X ? 1 : 2) extends
  (&lt;T&gt;() =&gt; T extends Y ? 1 : 2) ? A : B;

type WritableKeys&lt;T&gt; = {
  [K in keyof T]-?: IfEquals&lt;{ [P in K]: T[K] }, { -readonly [P in K]: T[K] }, K, never&gt;
}[keyof T];

type ReadonlyKeys&lt;T&gt; = Exclude&lt;keyof T, WritableKeys&lt;T&gt;&gt;;

interface Mixed { readonly id: string; name: string; readonly created: number }
type W = WritableKeys&lt;Mixed&gt;;   // "name"
type R = ReadonlyKeys&lt;Mixed&gt;;   // "id" | "created"
</code></pre>

<h3>Example 8: Discriminated-union narrowing helpers</h3>
<pre><code class="language-ts">type Shape =
  | { kind: "circle"; r: number }
  | { kind: "square"; s: number }
  | { kind: "triangle"; b: number; h: number };

type ShapeOf&lt;K&gt; = Extract&lt;Shape, { kind: K }&gt;;
type Circle = ShapeOf&lt;"circle"&gt;;     // { kind: "circle"; r: number }

type AllKinds = Shape["kind"];        // "circle" | "square" | "triangle"

// Map handlers by kind
type Handlers = { [K in Shape["kind"]]: (s: ShapeOf&lt;K&gt;) =&gt; number };
const handlers: Handlers = {
  circle: (s) =&gt; Math.PI * s.r ** 2,
  square: (s) =&gt; s.s ** 2,
  triangle: (s) =&gt; (s.b * s.h) / 2,
};
</code></pre>

<h3>Example 9: Strict typed-event channels</h3>
<pre><code class="language-ts">type EventMap = {
  "user:login":  { id: string };
  "user:logout": void;
  "msg:received": { from: string; text: string };
};

type Listener&lt;K extends keyof EventMap&gt; = (
  ...args: EventMap[K] extends void ? [] : [payload: EventMap[K]]
) =&gt; void;

class Emitter&lt;E&gt; {
  on&lt;K extends keyof E&gt;(k: K, fn: Listener&lt;K extends keyof EventMap ? K : never&gt;) {/*...*/}
}
</code></pre>

<h3>Example 10: Object path to indexed access</h3>
<pre><code class="language-ts">type DeepKey&lt;T&gt; =
  T extends object
    ? { [K in keyof T &amp; (string | number)]:
          T[K] extends object
            ? \`\${K}\` | \`\${K}.\${DeepKey&lt;T[K]&gt;}\`
            : \`\${K}\`
      }[keyof T &amp; (string | number)]
    : never;

type DeepValue&lt;T, P extends string&gt; =
  P extends \`\${infer Head}.\${infer Tail}\`
    ? Head extends keyof T ? DeepValue&lt;T[Head], Tail&gt; : never
    : P extends keyof T ? T[P] : never;

type Cfg = { db: { host: string; port: number }; ui: { theme: "light" | "dark" } };
type K = DeepKey&lt;Cfg&gt;;       // "db" | "db.host" | "db.port" | "ui" | "ui.theme"
type V = DeepValue&lt;Cfg, "db.host"&gt;;   // string

function getPath&lt;T, P extends DeepKey&lt;T&gt;&gt;(obj: T, path: P): DeepValue&lt;T, P &amp; string&gt; {
  return path.split(".").reduce((acc: any, k) =&gt; acc?.[k], obj);
}
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Distribution surprise — <code>never</code></h3>
<pre><code class="language-ts">type ToArray&lt;T&gt; = T extends any ? T[] : never;
type X = ToArray&lt;never&gt;;     // never (NOT never[])
// because never is the empty union, distributing yields nothing.

type ToArrayStrict&lt;T&gt; = [T] extends [any] ? T[] : never;
type Y = ToArrayStrict&lt;never&gt;;  // never[]
</code></pre>

<h3>Distribution surprise — boolean</h3>
<pre><code class="language-ts">// boolean is true | false internally
type Wrap&lt;T&gt; = T extends any ? { v: T } : never;
type R = Wrap&lt;boolean&gt;;      // { v: true } | { v: false }   — distributed over boolean
</code></pre>

<h3>Empty mapped over an empty union</h3>
<pre><code class="language-ts">type M&lt;T extends string&gt; = { [K in T]: number };
type E = M&lt;never&gt;;     // {} (intersection identity)
</code></pre>

<h3>Mapping over a union vs an object</h3>
<pre><code class="language-ts">// Union of strings
type M1&lt;K extends string&gt; = { [P in K]: P };
type R1 = M1&lt;"a" | "b"&gt;;     // { a: "a"; b: "b" }

// Object — must use keyof
type M2&lt;T&gt; = { [K in keyof T]: T[K] };
</code></pre>

<h3>Inferring tuple <code>length</code> by literal type</h3>
<pre><code class="language-ts">type Length&lt;T extends readonly any[]&gt; = T["length"];
type L = Length&lt;[1, 2, 3]&gt;;        // 3   (literal)
type L2 = Length&lt;number[]&gt;;        // number   (variadic — no literal)
</code></pre>

<h3>Template literal types and <code>string</code> placeholder</h3>
<pre><code class="language-ts">type G = \`hello \${string}\`;
const a: G = "hello world";       // ✅
const b: G = "hello";              // ❌ — needs at least the prefix and one char
const c: G = "hello ";             // ✅ — empty trailing matches \${string}
</code></pre>

<h3>Conditional type recursion limit</h3>
<p>TS 4.5+ has tail-recursion elimination for conditional types in many cases. But long template-literal recursions can still hit the 1000-depth limit. Symptom: <code>Type instantiation is excessively deep and possibly infinite</code>. Workarounds:</p>
<ul>
  <li>Restructure the recursion as tail-position.</li>
  <li>Add a counter type parameter to enforce a bound.</li>
  <li>Split the type into smaller pieces.</li>
</ul>

<h3>Mapped type over an interface vs a type</h3>
<p>Both work. But interfaces with declaration merging may produce a mapped type that picks up the merged keys — sometimes desired, sometimes confusing.</p>

<h3>Optional vs <code>undefined</code> — <code>Required&lt;T&gt;</code> behavior</h3>
<pre><code class="language-ts">type Profile = { name?: string };
type R = Required&lt;Profile&gt;;   // { name: string }   — strips both '?' and 'undefined'

type Profile2 = { name: string | undefined };
type R2 = Required&lt;Profile2&gt;;  // { name: string | undefined }   — only '?' affected
</code></pre>

<h3>Picking from a union</h3>
<pre><code class="language-ts">type Shape = { kind: "circle"; r: number } | { kind: "square"; s: number };
type Picked = Pick&lt;Shape, "kind"&gt;;   // ❌ — Pick distributes over union; result is { kind: "circle" } | { kind: "square" }
// To extract a specific variant, use Extract:
type Circle = Extract&lt;Shape, { kind: "circle" }&gt;;
</code></pre>

<h3>Function inference — only last overload is captured</h3>
<pre><code class="language-ts">interface Multi {
  (x: string): number;
  (x: number): boolean;
}
type R = ReturnType&lt;Multi&gt;;   // boolean — last overload only
</code></pre>
<p>This is a long-standing TS limitation. To recover all overloads, write a manual match (one branch per known signature).</p>

<h3>Excess types in template literal positions</h3>
<pre><code class="language-ts">type N = \`\${number}\`;
const a: N = "42";       // ✅
const b: N = "1e5";      // ✅
const c: N = "0x10";     // ✅
// '${number}' is a permissive shape — any JS-numeric string parses.
</code></pre>

<h3>Mapped with key remap losing modifiers</h3>
<pre><code class="language-ts">// 'as' remap doesn't propagate optional/readonly automatically — apply explicitly
type R&lt;T&gt; = { [K in keyof T as \`get\${Capitalize&lt;string &amp; K&gt;}\`]-?: () =&gt; T[K] };
</code></pre>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: Forgetting distribution</h3>
<pre><code class="language-ts">// Goal: wrap T in an array
type ToArray&lt;T&gt; = T extends any ? T[] : never;
type R = ToArray&lt;string | number&gt;;   // string[] | number[]
// If you wanted (string | number)[]:
type ToArrayStrict&lt;T&gt; = [T] extends [any] ? T[] : never;
</code></pre>

<h3>Bug 2: <code>extends any</code> as a no-op</h3>
<pre><code class="language-ts">type X&lt;T&gt; = T extends any ? Foo&lt;T&gt; : never;
// You probably wrote this to enable distribution. Document it — it looks like a typo.
</code></pre>

<h3>Bug 3: Mapped type that mutates source</h3>
<pre><code class="language-ts">type Mutable&lt;T&gt; = { -readonly [K in keyof T]: T[K] };
const r: Readonly&lt;User&gt; = { id: "1", name: "x" };
const m = r as Mutable&lt;Readonly&lt;User&gt;&gt;;
m.id = "2";   // mutates the original — not a copy!
</code></pre>

<h3>Bug 4: <code>Pick</code> with non-existent key</h3>
<pre><code class="language-ts">type X = Pick&lt;User, "id" | "fone"&gt;;   // ❌ — caught
// But:
type Y = Pick&lt;User, keyof User | "extra"&gt;;   // ❌ — caught
// Until:
type Z = Pick&lt;Record&lt;string, unknown&gt;, "id" | "fone"&gt;;   // ✅ — wide source allows anything
</code></pre>

<h3>Bug 5: Recursive type without termination</h3>
<pre><code class="language-ts">// Infinite recursion — TS errors with "type instantiation excessively deep"
type Bad&lt;T&gt; = { [K in keyof T]: Bad&lt;T[K]&gt; };

// Add a base case for non-objects
type Good&lt;T&gt; = T extends object ? { [K in keyof T]: Good&lt;T[K]&gt; } : T;
</code></pre>

<h3>Bug 6: Confusing <code>extends</code> with assignability check</h3>
<pre><code class="language-ts">// Using extends on conflicting unions
type X = { a: 1 } extends { a: number } ? "yes" : "no";   // "yes"
type Y = { a: number } extends { a: 1 } ? "yes" : "no";   // "no"
// The narrower type extends the wider type, not the reverse.
</code></pre>

<h3>Bug 7: Template literal type explosion</h3>
<pre><code class="language-ts">// Cartesian product of two large unions explodes — TS may slow to a crawl
type A = "a" | "b" | "c" | ... 100 items;
type B = "x" | "y" | ... 100 items;
type C = \`\${A}-\${B}\`;   // 10,000 strings — slow autocomplete, slow type checking
</code></pre>

<h3>Bug 8: Type-level <code>any</code> leak</h3>
<pre><code class="language-ts">type Wrap&lt;T = any&gt; = { value: T };
const w: Wrap = { value: undefined };   // T defaults to any — silent
</code></pre>

<h3>Bug 9: Conditional return type that doesn't narrow at call site</h3>
<pre><code class="language-ts">function parse&lt;T extends "json" | "text"&gt;(raw: string, kind: T): T extends "json" ? object : string {
  return (kind === "json" ? JSON.parse(raw) : raw) as any;
}
// At call site:
function caller&lt;T extends "json" | "text"&gt;(kind: T) {
  const r = parse("...", kind);   // type is { object | string } — TS can't narrow inside the generic
}
</code></pre>
<p>TS doesn't always evaluate conditional types when the input is still generic. Workaround: use overloads or a discriminated input.</p>

<h3>Bug 10: Distribution over <code>boolean</code> when you didn't want it</h3>
<pre><code class="language-ts">type Wrap&lt;T&gt; = T extends any ? Box&lt;T&gt; : never;
type R = Wrap&lt;boolean&gt;;   // Box&lt;true&gt; | Box&lt;false&gt;
// If you want a single Box&lt;boolean&gt;, suppress distribution.
</code></pre>

<h3>Anti-pattern 1: writing your own <code>Partial</code>, <code>Pick</code>, etc.</h3>
<p>Built-in utilities exist and are tested by the TS team. Use <code>Partial</code>, <code>Required</code>, <code>Pick</code>, <code>Omit</code>, <code>Readonly</code>, <code>Record</code>, <code>Exclude</code>, <code>Extract</code>, <code>NonNullable</code>, <code>Parameters</code>, <code>ReturnType</code>, <code>Awaited</code>, <code>InstanceType</code>, <code>ConstructorParameters</code>, <code>ThisParameterType</code>, <code>OmitThisParameter</code>, <code>ThisType</code>, <code>Uppercase</code>, <code>Lowercase</code>, <code>Capitalize</code>, <code>Uncapitalize</code>.</p>

<h3>Anti-pattern 2: clever type-level hacks for tiny gains</h3>
<p>If your conditional type uses 4 helper types, distributes twice, and ends with <code>infer X extends infer Y</code>, ask: does this catch real bugs? Often a simple union-of-shapes is clearer.</p>

<h3>Anti-pattern 3: deeply recursive template literal types in product code</h3>
<p>Cool demos, slow IDE. Object-path types, route param extraction, etc. — fine for one or two utilities; don't apply them to 50 routes in a hot path.</p>

<h3>Anti-pattern 4: conditional types in public API surfaces</h3>
<p>If your library export uses a 5-deep conditional type, consumers will see the unrolled garbage in tooltips and errors. Wrap the result in a named alias and export that alias instead.</p>

<h3>Anti-pattern 5: using mapped types to enforce runtime invariants</h3>
<p>Types are erased. <code>Required&lt;T&gt;</code> doesn't actually populate fields at runtime — you still need validation.</p>

<h3>Anti-pattern 6: simulating switch with conditional chains</h3>
<pre><code class="language-ts">type Lookup&lt;K&gt; =
  K extends "a" ? A
  : K extends "b" ? B
  : K extends "c" ? C
  : never;
// 6 cases? OK. 60? Use a Record-style mapping.
type LookupBetter = { a: A; b: B; c: C; /* ... */ };
type LB&lt;K extends keyof LookupBetter&gt; = LookupBetter[K];
</code></pre>

<h3>Anti-pattern 7: <code>infer</code> chains that hide design issues</h3>
<p>If you find yourself <code>infer</code>ing 4 layers deep to extract some metadata, the source type's design is probably the problem. Refactor the source.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '🎤 Interview Patterns',
      html: `
<h3>The 12 questions interviewers actually ask</h3>
<table>
  <thead><tr><th>Question</th><th>One-liner</th></tr></thead>
  <tbody>
    <tr><td><em>What's a conditional type?</em></td><td>A type-level ternary: <code>T extends U ? A : B</code>.</td></tr>
    <tr><td><em>What's distribution?</em></td><td>If T is a naked type parameter and a union, the conditional applies per-member. Wrap in a tuple to suppress.</td></tr>
    <tr><td><em>What does <code>infer</code> do?</em></td><td>Pattern-matches a sub-type inside a conditional and binds it for use in the true branch.</td></tr>
    <tr><td><em>What's a mapped type?</em></td><td><code>{ [K in U]: ... }</code> — generates one property per member of U.</td></tr>
    <tr><td><em>Why does <code>ToArray&lt;never&gt;</code> equal <code>never</code>?</em></td><td>Distribution over the empty union yields nothing.</td></tr>
    <tr><td><em>How do you suppress distribution?</em></td><td>Wrap T in a tuple: <code>[T] extends [U]</code>.</td></tr>
    <tr><td><em>How do you implement <code>Pick</code>?</em></td><td><code>{ [P in K]: T[P] }</code></td></tr>
    <tr><td><em>How do you implement <code>Omit</code>?</em></td><td><code>Pick&lt;T, Exclude&lt;keyof T, K&gt;&gt;</code></td></tr>
    <tr><td><em>What's <code>+/-</code> on mapped modifiers?</em></td><td>Add or strip <code>readonly</code>/<code>?</code>.</td></tr>
    <tr><td><em>What's key remapping?</em></td><td><code>[K in keyof T as Expr]</code> — rename or filter keys.</td></tr>
    <tr><td><em>Where would you use template literal types?</em></td><td>Type-safe routes, event names, branded prefixes, css custom properties.</td></tr>
    <tr><td><em>How do you extract function return types?</em></td><td><code>F extends (...a: any[]) =&gt; infer R ? R : never</code> — i.e., <code>ReturnType&lt;F&gt;</code>.</td></tr>
  </tbody>
</table>

<h3>Implement these from memory</h3>
<ul>
  <li><strong><code>Partial&lt;T&gt;</code></strong> — <code>{ [K in keyof T]?: T[K] }</code></li>
  <li><strong><code>Required&lt;T&gt;</code></strong> — <code>{ [K in keyof T]-?: T[K] }</code></li>
  <li><strong><code>Readonly&lt;T&gt;</code></strong> — <code>{ readonly [K in keyof T]: T[K] }</code></li>
  <li><strong><code>Pick&lt;T, K&gt;</code></strong> — <code>{ [P in K]: T[P] }</code></li>
  <li><strong><code>Omit&lt;T, K&gt;</code></strong> — <code>Pick&lt;T, Exclude&lt;keyof T, K&gt;&gt;</code></li>
  <li><strong><code>Record&lt;K, T&gt;</code></strong> — <code>{ [P in K]: T }</code></li>
  <li><strong><code>NonNullable&lt;T&gt;</code></strong> — <code>T extends null | undefined ? never : T</code></li>
  <li><strong><code>Exclude&lt;T, U&gt;</code></strong> — <code>T extends U ? never : T</code></li>
  <li><strong><code>Extract&lt;T, U&gt;</code></strong> — <code>T extends U ? T : never</code></li>
  <li><strong><code>ReturnType&lt;F&gt;</code></strong> — <code>F extends (...a: any[]) =&gt; infer R ? R : never</code></li>
  <li><strong><code>Parameters&lt;F&gt;</code></strong> — <code>F extends (...a: infer A) =&gt; any ? A : never</code></li>
  <li><strong><code>Awaited&lt;T&gt;</code></strong> — recursive promise unwrap (TS 4.5+)</li>
</ul>

<h3>"Spot the issue" interview questions</h3>
<ol>
  <li><code>Wrap&lt;never&gt;</code> evaluates to <code>never</code> — explain why and how to fix.</li>
  <li><code>Pick&lt;Shape, "kind"&gt;</code> on a discriminated union — why does it not give you the kind union? (<em>Pick distributes; use <code>Shape["kind"]</code> directly</em>.)</li>
  <li><code>ReturnType</code> of an overloaded function — why only the last overload? (<em>TS limitation</em>.)</li>
  <li>A deep mapped type that hangs the IDE — which loop is unbounded? (<em>Missing base case for non-object</em>.)</li>
  <li>A conditional return type that doesn't narrow at call site — why? (<em>Generic input prevents resolution; use overloads</em>.)</li>
</ol>

<h3>"Two-minute" type-level challenges</h3>
<ul>
  <li><em>"Type-safe Object.fromEntries"</em>:
    <pre><code class="language-ts">type FromEntries&lt;E extends readonly [PropertyKey, unknown][]&gt; = {
  [K in E[number] as K[0]]: K[1]
};</code></pre>
  </li>
  <li><em>"Map every method to async"</em>:
    <pre><code class="language-ts">type Asyncify&lt;T&gt; = {
  [K in keyof T]: T[K] extends (...a: infer A) =&gt; infer R
    ? (...a: A) =&gt; Promise&lt;R&gt;
    : T[K]
};</code></pre>
  </li>
  <li><em>"Extract route params"</em>:
    <pre><code class="language-ts">type Params&lt;P extends string&gt; =
  P extends \`\${string}:\${infer X}/\${infer Rest}\`
    ? X | Params&lt;\`/\${Rest}\`&gt;
    : P extends \`\${string}:\${infer X}\` ? X : never;</code></pre>
  </li>
  <li><em>"Filter keys whose value is string"</em>:
    <pre><code class="language-ts">type StringKeys&lt;T&gt; = { [K in keyof T as T[K] extends string ? K : never]: T[K] };</code></pre>
  </li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Distinguishes assignability from value-set comparison</td><td>"<code>{a:1} extends {a:number}</code>" — narrower extends wider.</td></tr>
    <tr><td>Knows about distribution</td><td>Names it; demonstrates the tuple-wrap trick.</td></tr>
    <tr><td>Reaches for utility types</td><td>Uses <code>Partial</code>/<code>Pick</code>/<code>Omit</code> etc. before hand-rolling.</td></tr>
    <tr><td>Uses <code>infer</code> idiomatically</td><td>For element-of, return-of, params-of patterns.</td></tr>
    <tr><td>Composes types deliberately</td><td>Knows when to stop — doesn't over-engineer.</td></tr>
    <tr><td>Aware of perf implications</td><td>Mentions slow autocomplete from huge cartesian template types.</td></tr>
    <tr><td>Knows the limits</td><td>Doesn't claim runtime guarantees from mapped/conditional types.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li><strong>Navigation params:</strong> <code>type ScreenParams&lt;K extends keyof RootStackParamList&gt; = RootStackParamList[K]</code> — indexed access into a route map.</li>
  <li><strong>Style merging:</strong> <code>StyleProp&lt;ViewStyle&gt;</code> internally a recursive type that allows nested arrays.</li>
  <li><strong>Reanimated:</strong> <code>UseSharedValue</code> generic + conditional types differentiate "shared" vs "derived" values.</li>
  <li><strong>Expo SDK:</strong> uses template-literal types for route names in expo-router for type-safe deep links.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd use <code>satisfies</code> on the schema literal so its precise type stays narrow while we get a structural check."</li>
  <li>"I'd suppress distribution where unnecessary to avoid expensive union expansions in the IDE."</li>
  <li>"I'd cap recursion depth with a counter type to keep error messages legible."</li>
  <li>"I'd export a named alias instead of the conditional expression so consumer tooltips stay readable."</li>
</ul>
`
    }
  ]
});
