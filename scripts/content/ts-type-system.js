window.PREP_SITE.registerTopic({
  id: 'ts-type-system',
  module: 'typescript',
  title: 'Type System Basics',
  estimatedReadTime: '40 min',
  tags: ['typescript', 'type-system', 'structural-typing', 'narrowing', 'never', 'unknown', 'union', 'intersection', 'literal-types'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>TypeScript is a <strong>structural, gradual, erased</strong> type system layered over JavaScript. Types describe the shape of values; they vanish at compile time and have <em>zero runtime cost</em>. Your job as a TS user is to give the checker enough information to catch real bugs without drowning the codebase in noise.</p>
<ul>
  <li><strong>Structural:</strong> two types match if their shapes match. There is no nominal "<em>this is a User and that is a User-shaped thing</em>" distinction unless you opt in.</li>
  <li><strong>Gradual:</strong> <code>any</code> opts out, <code>unknown</code> is the safe escape hatch, <code>never</code> represents impossible values. Use them on purpose.</li>
  <li><strong>Erased:</strong> nothing in <code>.ts</code> survives compilation except runtime JS. Types do not validate input at runtime — that's <code>zod</code>/<code>io-ts</code>'s job.</li>
  <li><strong>Inference is your friend:</strong> annotate function parameters and exported APIs; let TS infer almost everything else.</li>
  <li><strong>Narrowing:</strong> <code>typeof</code>, <code>instanceof</code>, <code>in</code>, equality, and discriminated unions tighten a wide type within a branch.</li>
  <li><strong>Union vs intersection:</strong> <code>A | B</code> is "either"; <code>A &amp; B</code> is "both at once" (the merged shape).</li>
  <li><strong>Literal types and <code>const</code> assertions</strong> make the type system express domain rules ("status must be one of these four strings") for free.</li>
</ul>
<p><strong>Mantra:</strong> "Model the data, narrow the unknowns, refuse <code>any</code>, never trust the network."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What is the TypeScript type system?</h3>
<p>TypeScript adds a <em>static</em> type checker on top of JavaScript. You write code that looks like JS plus type annotations; the compiler (<code>tsc</code>) reads the annotations and either tells you something is wrong or strips them away and emits plain JS. The type system itself is a separate language that runs only at compile time.</p>
<p>Three properties define how it behaves:</p>
<table>
  <thead><tr><th>Property</th><th>Meaning</th><th>Why it matters</th></tr></thead>
  <tbody>
    <tr><td><strong>Structural</strong></td><td>Compatibility is by shape, not name. <code>{ name: string }</code> matches <em>anything</em> with a string <code>name</code>.</td><td>Drives why duck-typed JS interop works; also why "branding" is needed for nominal-feeling types.</td></tr>
    <tr><td><strong>Gradual</strong></td><td>You can mix typed and untyped code. <code>any</code> short-circuits the checker.</td><td>Lets you migrate big JS codebases incrementally; also makes "death by <code>any</code>" possible.</td></tr>
    <tr><td><strong>Erased</strong></td><td>Types disappear at compile time. The runtime never sees them.</td><td>Means types can't validate user input; means runtime perf is identical to JS.</td></tr>
  </tbody>
</table>

<h3>Primitives, the building blocks</h3>
<table>
  <thead><tr><th>Type</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td><code>string, number, boolean</code></td><td>Lowercase. Avoid the uppercase wrappers <code>String</code>/<code>Number</code> — they refer to the boxed object types.</td></tr>
    <tr><td><code>null, undefined</code></td><td>Distinct types. With <code>strictNullChecks</code> on (always be on), you must explicitly handle them.</td></tr>
    <tr><td><code>bigint</code></td><td>For integers larger than <code>Number.MAX_SAFE_INTEGER</code>.</td></tr>
    <tr><td><code>symbol</code></td><td>Unique runtime identifiers; rarely user-facing.</td></tr>
    <tr><td><code>void</code></td><td>"Don't care about the return value." Different from <code>undefined</code>.</td></tr>
    <tr><td><code>never</code></td><td>"Cannot happen." Functions that throw or loop forever return <code>never</code>.</td></tr>
    <tr><td><code>any</code></td><td>"Trust me." Disables checks. Avoid.</td></tr>
    <tr><td><code>unknown</code></td><td>"Could be anything." Forces you to narrow before use. The right escape hatch.</td></tr>
    <tr><td><code>object</code></td><td>Any non-primitive. Almost never useful — prefer <code>Record</code> or a specific shape.</td></tr>
  </tbody>
</table>

<h3>Why TypeScript exists</h3>
<ol>
  <li><strong>Catch bugs before runtime.</strong> Misnamed properties, mismatched arguments, undefined access — caught at edit time.</li>
  <li><strong>Editor power.</strong> Autocomplete, jump-to-definition, safe rename. The compiler powers your IDE.</li>
  <li><strong>Living documentation.</strong> Types describe contracts more reliably than comments because they're checked.</li>
  <li><strong>Refactor confidence.</strong> Changing a function signature instantly highlights every caller that's now wrong.</li>
  <li><strong>Cross-team API contracts.</strong> Frontend, backend, mobile can share types and trust them.</li>
</ol>

<h3>Why it does NOT exist</h3>
<ul>
  <li>It is <strong>not a runtime guard.</strong> Network responses, JSON.parse outputs, user input — all need real validation.</li>
  <li>It is <strong>not perfectly sound.</strong> Several intentional unsoundness escape hatches (function parameter bivariance, <code>as</code>, indexed access into arrays) trade safety for ergonomics.</li>
  <li>It is <strong>not a substitute for tests.</strong> Types prove "I called the function with the right shape." Tests prove "the function does the right thing."</li>
</ul>

<h3>Compiler flags every project must have</h3>
<pre><code class="language-jsonc">// tsconfig.json — minimum viable strict
{
  "compilerOptions": {
    "strict": true,                       // umbrella for the below
    "noImplicitAny": true,                // every parameter must have a known type
    "strictNullChecks": true,             // null/undefined cannot be silently used
    "strictFunctionTypes": true,          // contravariant parameters
    "strictBindCallApply": true,          // .bind/.call/.apply checked
    "noUncheckedIndexedAccess": true,     // arr[i] becomes T | undefined — HUGE bug-catcher
    "exactOptionalPropertyTypes": true,   // optional ≠ explicitly undefined
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
</code></pre>
<p><code>noUncheckedIndexedAccess</code> in particular catches the most common real-world bug class: assuming an array lookup returns the element type when it can return <code>undefined</code>.</p>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>"Types are sets of values"</h3>
<p>This is the single most clarifying mental model in TS. Forget "type" as a class label. A type is a <em>set</em>; a value belongs to that set if it's a member.</p>
<table>
  <thead><tr><th>Type</th><th>The set</th></tr></thead>
  <tbody>
    <tr><td><code>string</code></td><td>All strings (infinite)</td></tr>
    <tr><td><code>"red"</code></td><td>The set containing exactly the string "red"</td></tr>
    <tr><td><code>"red" | "green"</code></td><td>The two-element set {"red", "green"}</td></tr>
    <tr><td><code>number</code></td><td>All numbers</td></tr>
    <tr><td><code>boolean</code></td><td>{true, false}</td></tr>
    <tr><td><code>never</code></td><td>The empty set ∅</td></tr>
    <tr><td><code>unknown</code></td><td>The universal set (everything)</td></tr>
    <tr><td><code>any</code></td><td>The universal set, but the checker stops asking</td></tr>
  </tbody>
</table>
<p>Once you're in this frame:</p>
<ul>
  <li><strong>Union (<code>A | B</code>) = set union.</strong> Wider, accepts more values.</li>
  <li><strong>Intersection (<code>A &amp; B</code>) = set intersection.</strong> Narrower; for object types it's the <em>combined</em> shape because a value with both shapes is in both sets.</li>
  <li><strong>Subtype = subset.</strong> <code>"red"</code> is a subtype of <code>string</code> because <code>{"red"} ⊂</code> all-strings.</li>
  <li><strong>Assignability: a value of type T can go into a slot of type S iff T's set ⊆ S's set.</strong></li>
</ul>

<h3>Variance, in one paragraph</h3>
<p>If <code>Cat extends Animal</code>, is <code>Array&lt;Cat&gt;</code> a subtype of <code>Array&lt;Animal&gt;</code>? It depends on usage. Read-only positions are <strong>covariant</strong> (Cat → Animal works). Write positions are <strong>contravariant</strong> (Animal → Cat works). Read-and-write positions are <strong>invariant</strong>. TS arrays are pragmatically covariant — convenient and slightly unsound.</p>

<h3>Structural typing, the "duck" model</h3>
<p>Two types are compatible if they have the same shape. There is no "this came from class A, that came from class B" check unless you add a private/protected member or a brand.</p>
<pre><code class="language-ts">interface Point { x: number; y: number }
class Vec { x = 0; y = 0; magnitude() { return Math.hypot(this.x, this.y); } }

const p: Point = new Vec();   // ✅ Vec has x and y, that's enough
</code></pre>

<h3>Inference, the "be lazy" model</h3>
<p>TS infers a lot. The rules of thumb:</p>
<ul>
  <li><strong>Annotate function parameters and exported APIs.</strong> These are contracts.</li>
  <li><strong>Don't annotate local variables.</strong> Inference is more accurate than your annotation will be (especially with literal types).</li>
  <li><strong>Annotate <em>return</em> types of public functions.</strong> Catches drift; gives faster compile.</li>
  <li><strong>Don't annotate when destructuring</strong> unless the inference is wrong.</li>
</ul>

<h3>Widening vs narrowing</h3>
<table>
  <thead><tr><th>Concept</th><th>Direction</th><th>Trigger</th></tr></thead>
  <tbody>
    <tr><td>Widening</td><td>specific → general</td><td><code>let s = "hi"</code> is <code>string</code>, not <code>"hi"</code></td></tr>
    <tr><td>Narrowing</td><td>general → specific</td><td><code>typeof v === "string"</code> inside an if</td></tr>
    <tr><td><code>const</code> & literal contexts</td><td>preserves literal</td><td><code>const s = "hi"</code> is <code>"hi"</code></td></tr>
    <tr><td><code>as const</code></td><td>locks all literals + readonly</td><td><code>{x: 1, y: 2} as const</code></td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Defining types: <code>type</code> vs <code>interface</code></h3>
<pre><code class="language-ts">// Both define a User
type User = { id: string; name: string };
interface User2 { id: string; name: string; }

// Differences:
// 1. interface can be re-opened (declaration merging) — type cannot
interface User2 { email: string; }   // augments User2

// 2. type can express unions, primitives, tuples, mapped, conditional
type Status = "draft" | "published" | "archived";
type Pair = [number, number];
type Readonly&lt;T&gt; = { readonly [K in keyof T]: T[K] };

// 3. interfaces extend; types intersect
interface Admin extends User2 { role: "admin"; }
type Admin2 = User &amp; { role: "admin" };
</code></pre>
<p><strong>Rule of thumb:</strong> <code>interface</code> for object shapes you might extend or that are part of public API. <code>type</code> for everything else (unions, tuples, mapped types).</p>

<h3>Object types, optional, and readonly</h3>
<pre><code class="language-ts">type Book = {
  readonly id: string;       // can't reassign
  title: string;
  subtitle?: string;         // may be omitted; type is string | undefined
  authors: readonly string[]; // can't push/splice
};

const b: Book = { id: "x", title: "TS", authors: ["a"] };
b.id = "y";                   // ❌ readonly
b.authors.push("c");          // ❌ readonly array
</code></pre>

<h3>Union and intersection — the workhorses</h3>
<pre><code class="language-ts">type Id = string | number;
type Point = { x: number } &amp; { y: number };  // { x: number; y: number }

// Discriminated union — the most useful TS pattern in product code
type Loading = { state: "loading" };
type Loaded&lt;T&gt; = { state: "loaded"; data: T };
type Failed = { state: "failed"; error: Error };
type Result&lt;T&gt; = Loading | Loaded&lt;T&gt; | Failed;

function render(r: Result&lt;User&gt;) {
  switch (r.state) {
    case "loading": return "…";
    case "loaded":  return r.data.name;   // narrowed: data exists
    case "failed":  return r.error.message;
  }
}
</code></pre>

<h3>Literal types and <code>as const</code></h3>
<pre><code class="language-ts">// Without as const, this is { name: string; size: number }
const config = { name: "primary", size: 10 };

// With as const, it's { readonly name: "primary"; readonly size: 10 }
const cfg = { name: "primary", size: 10 } as const;

// Most useful with arrays of allowed values:
const STATUSES = ["draft", "published", "archived"] as const;
type Status = (typeof STATUSES)[number];   // "draft" | "published" | "archived"
</code></pre>

<h3>Narrowing — typeof, in, instanceof, equality, predicates</h3>
<pre><code class="language-ts">function area(s: { kind: "circle"; r: number } | { kind: "square"; side: number }) {
  if (s.kind === "circle") return Math.PI * s.r ** 2;     // narrowed by literal equality
  return s.side ** 2;                                      // narrowed via exhaustive check
}

function len(x: string | string[]) {
  if (typeof x === "string") return x.length;
  return x.length;
}

function isError(x: unknown): x is Error {                 // user-defined type guard
  return x instanceof Error;
}

function processBox(b: { width: number } | { radius: number }) {
  if ("width" in b) return b.width;                        // 'in' narrowing
  return b.radius;
}
</code></pre>

<h3>Tuples and array types</h3>
<pre><code class="language-ts">// Fixed-shape array
type Pair = [number, number];
type Range = [start: number, end: number];                  // labeled tuple (docs only)

// Rest in tuples
type Args = [first: string, ...rest: number[]];

// readonly tuple — immutable shape
type Vec3 = readonly [number, number, number];

// Common pitfall: array literal infers as T[], not tuple
const t = [1, "a"];                       // (string | number)[]
const t2 = [1, "a"] as const;             // readonly [1, "a"]
</code></pre>

<h3>Functions: parameters, returns, overloads</h3>
<pre><code class="language-ts">// Annotate parameters + return type for public APIs
function add(a: number, b: number): number { return a + b; }

// Optional and default
function greet(name: string, greeting: string = "hi"): string { return \`\${greeting} \${name}\`; }

// Rest
function sum(...ns: number[]): number { return ns.reduce((a, b) =&gt; a + b, 0); }

// Function type aliases
type Reducer&lt;T, A&gt; = (acc: A, item: T) =&gt; A;

// Overloads — when one function legitimately has multiple shapes
function len(x: string): number;
function len(x: unknown[]): number;
function len(x: string | unknown[]): number { return x.length; }

// Prefer a union signature when overloads aren't doing real work:
function len2(x: string | unknown[]): number { return x.length; }
</code></pre>

<h3>The trio: <code>any</code>, <code>unknown</code>, <code>never</code></h3>
<pre><code class="language-ts">// any — gives up safety. Banned by default; needs justification.
const x: any = somethingDynamic();
x.totallyMadeUp();                // accepted (lol)

// unknown — accept anything, demand a check before use.
const y: unknown = JSON.parse(raw);
if (typeof y === "object" && y && "name" in y) {
  // y is now { name: unknown } — still need more narrowing for actual use
}

// never — exhaustiveness, impossible branches.
type Shape = { kind: "circle"; r: number } | { kind: "square"; s: number };
function area(s: Shape): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.r ** 2;
    case "square": return s.s ** 2;
    default: { const _exhaustive: never = s; return _exhaustive; }
  }
}
// If a third case is added later, the assignment to never errors — caught at compile time.
</code></pre>

<h3>Type aliasing utilities you'll use weekly</h3>
<pre><code class="language-ts">type User = { id: string; name: string; email?: string };

// Built-in helpers
type R1 = Partial&lt;User&gt;;          // every prop optional
type R2 = Required&lt;User&gt;;         // every prop required
type R3 = Readonly&lt;User&gt;;         // every prop readonly
type R4 = Pick&lt;User, "id" | "name"&gt;;
type R5 = Omit&lt;User, "email"&gt;;
type R6 = Record&lt;"a" | "b", number&gt;;     // { a: number; b: number }
type R7 = NonNullable&lt;string | null&gt;;    // string
type R8 = ReturnType&lt;() =&gt; User&gt;;        // User
type R9 = Parameters&lt;(a: string, b: number) =&gt; void&gt;; // [a: string, b: number]
type R10 = Awaited&lt;Promise&lt;User&gt;&gt;;        // User
</code></pre>

<h3>Enums — and why most teams avoid them</h3>
<pre><code class="language-ts">// Numeric enum (default)
enum Status { Draft, Published, Archived }
// Compiles to a runtime object — adds bytes, can't be tree-shaken cleanly.

// String enum
enum Role { Admin = "admin", User = "user" }

// Const enum — fully erased at build, but breaks under isolatedModules and Babel
const enum Direction { Up, Down }

// Modern preferred alternative — string union + as const:
const ROLE = ["admin", "user"] as const;
type Role2 = typeof ROLE[number];        // "admin" | "user"
// Zero runtime cost, plays nicely with bundlers, exhaustively checkable.
</code></pre>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Modeling a Result type for async data</h3>
<pre><code class="language-ts">type Result&lt;T, E = Error&gt; =
  | { tag: "idle" }
  | { tag: "loading" }
  | { tag: "ok"; data: T }
  | { tag: "err"; error: E };

function ok&lt;T&gt;(data: T): Result&lt;T&gt; { return { tag: "ok", data }; }
function err&lt;E&gt;(error: E): Result&lt;never, E&gt; { return { tag: "err", error }; }

function display(r: Result&lt;string&gt;) {
  switch (r.tag) {
    case "idle":    return "—";
    case "loading": return "…";
    case "ok":      return r.data;          // narrowed
    case "err":     return r.error.message; // narrowed
  }
}
</code></pre>

<h3>Example 2: Parsing untrusted JSON the right way</h3>
<pre><code class="language-ts">// WRONG — types are erased; this is a lie at runtime
const user = JSON.parse(raw) as User;       // any unsafe field passes

// RIGHT — cast to unknown, narrow with a guard
function isUser(x: unknown): x is User {
  return (
    typeof x === "object" &amp;&amp; x !== null &amp;&amp;
    "id" in x &amp;&amp; typeof (x as any).id === "string" &amp;&amp;
    "name" in x &amp;&amp; typeof (x as any).name === "string"
  );
}

const parsed: unknown = JSON.parse(raw);
if (!isUser(parsed)) throw new Error("Bad payload");
const user: User = parsed;     // safe, type-narrowed
// In real life, use zod or io-ts for schema validation rather than hand-rolling.
</code></pre>

<h3>Example 3: Branded types for nominal typing</h3>
<pre><code class="language-ts">// Problem: UserId and OrderId are both string, but should not interchange.
type Brand&lt;T, B&gt; = T &amp; { readonly __brand: B };
type UserId = Brand&lt;string, "UserId"&gt;;
type OrderId = Brand&lt;string, "OrderId"&gt;;

const userId = "u1" as UserId;
const orderId = "o1" as OrderId;

function getUser(id: UserId) {/*...*/}
getUser(userId);     // ✅
getUser(orderId);    // ❌ Argument of type 'OrderId' not assignable to 'UserId'

// Use a constructor to avoid scattering 'as':
function userIdOf(s: string): UserId { return s as UserId; }
</code></pre>

<h3>Example 4: Exhaustive switch with <code>never</code></h3>
<pre><code class="language-ts">type Event =
  | { type: "click"; x: number; y: number }
  | { type: "keypress"; key: string }
  | { type: "scroll"; deltaY: number };

function handle(e: Event): string {
  switch (e.type) {
    case "click":     return \`(\${e.x}, \${e.y})\`;
    case "keypress":  return e.key;
    case "scroll":    return \`Δy=\${e.deltaY}\`;
    default: {
      const _exhaustive: never = e;
      throw new Error(\`Unhandled: \${(_exhaustive as any).type}\`);
    }
  }
}
// Add a new event variant — the assignment fails until you add a case.
</code></pre>

<h3>Example 5: Index signatures and Records</h3>
<pre><code class="language-ts">// Generic dictionary
type Headers = { [name: string]: string };

// Better: Record + a known key set
type StatusCode = 200 | 400 | 404 | 500;
type StatusMessages = Record&lt;StatusCode, string&gt;;

const messages: StatusMessages = {
  200: "OK", 400: "Bad", 404: "Missing", 500: "Boom",   // ✅ exhaustive
};

// Index access — pull the type of a property
type ResponseShape = { user: User; meta: { v: number } };
type MetaV = ResponseShape["meta"]["v"];   // number
</code></pre>

<h3>Example 6: Optional vs <code>| undefined</code> with <code>exactOptionalPropertyTypes</code></h3>
<pre><code class="language-ts">// With exactOptionalPropertyTypes: true
type Profile = { nickname?: string };

const a: Profile = {};                  // ✅ omitted
const b: Profile = { nickname: "x" };   // ✅ provided
const c: Profile = { nickname: undefined }; // ❌ explicit undefined now banned

// If you DO want explicit undefined to count as "present":
type Profile2 = { nickname?: string | undefined };
</code></pre>

<h3>Example 7: <code>typeof</code> a value to derive its type</h3>
<pre><code class="language-ts">const config = {
  url: "https://api.example.com",
  retries: 3,
  features: ["a", "b"],
} as const;

type Config = typeof config;
// {
//   readonly url: "https://api.example.com";
//   readonly retries: 3;
//   readonly features: readonly ["a", "b"];
// }
</code></pre>

<h3>Example 8: <code>keyof</code> + indexed access</h3>
<pre><code class="language-ts">type User = { id: string; name: string; age: number };
type UserKey = keyof User;            // "id" | "name" | "age"

function get&lt;K extends keyof User&gt;(u: User, k: K): User[K] {
  return u[k];
}
const id = get(user, "id");           // string
const age = get(user, "age");         // number
const bad = get(user, "phone");       // ❌ "phone" not assignable
</code></pre>

<h3>Example 9: Type-safe event emitter</h3>
<pre><code class="language-ts">type Events = {
  login: { userId: string };
  logout: void;
  message: { from: string; text: string };
};

class TypedEmitter&lt;E&gt; {
  private fns: { [K in keyof E]?: Array&lt;(p: E[K]) =&gt; void&gt; } = {};
  on&lt;K extends keyof E&gt;(k: K, fn: (p: E[K]) =&gt; void) {
    (this.fns[k] ||= []).push(fn);
  }
  emit&lt;K extends keyof E&gt;(k: K, p: E[K]) {
    this.fns[k]?.forEach(fn =&gt; fn(p));
  }
}

const ee = new TypedEmitter&lt;Events&gt;();
ee.on("login", p =&gt; console.log(p.userId));
ee.emit("login", { userId: "1" });    // ✅
ee.emit("login", { wrong: true });    // ❌
ee.emit("nope", undefined);           // ❌
</code></pre>

<h3>Example 10: <code>satisfies</code> vs annotation vs assertion</h3>
<pre><code class="language-ts">// Annotation widens the type — you lose literal precision
const colors: Record&lt;string, string&gt; = { red: "#f00", green: "#0f0" };
colors.red;           // string (you lost the fact 'red' is in the object)

// Assertion (as) lies if you're wrong — no check
const c1 = { red: "#f00" } as Record&lt;"red" | "green", string&gt;;  // 'green' missing — TS allows it!

// satisfies — checks shape, preserves narrow type
const c2 = { red: "#f00", green: "#0f0" } satisfies Record&lt;string, string&gt;;
c2.red;               // "#f00" (still literal)
c2.purple;            // ❌ does not exist
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Optional vs <code>undefined</code> property</h3>
<p>With <code>exactOptionalPropertyTypes</code> off (the default), <code>{ x?: number }</code> and <code>{ x: number | undefined }</code> are nearly identical. With it on (<em>recommended</em>), they're different — the former allows omission, the latter requires you to write <code>undefined</code> explicitly.</p>

<h3>Excess property checks (only on object literals)</h3>
<pre><code class="language-ts">type Point = { x: number; y: number };

const p: Point = { x: 1, y: 2, z: 3 };       // ❌ excess 'z'
const obj = { x: 1, y: 2, z: 3 };
const p2: Point = obj;                        // ✅ no check — only fresh literals
</code></pre>
<p>This catches the most common typo class on direct assignment, but is bypassed once a value is in a variable. Use <code>satisfies</code> to keep the check downstream.</p>

<h3>Function parameter bivariance</h3>
<pre><code class="language-ts">// Without strictFunctionTypes:
type Handler = (e: MouseEvent) =&gt; void;
const fn: Handler = (e: Event) =&gt; {};       // accepted in method-position
// With strictFunctionTypes (in 'strict'):
const fn2: Handler = (e: Event) =&gt; {};      // ✅ contravariant — Event is wider, ok
const fn3: Handler = (e: SpecificEvent) =&gt; {}; // ❌ now correctly rejected
</code></pre>

<h3>The "fresh literal" widening trap</h3>
<pre><code class="language-ts">let s = "red";              // string (let widens)
const t = "red";            // "red"

let arr = ["red", "blue"];  // string[]
const arr2 = ["red", "blue"] as const;  // readonly ["red", "blue"]
</code></pre>

<h3>Array destructuring vs index access (with noUncheckedIndexedAccess)</h3>
<pre><code class="language-ts">const xs: number[] = [1, 2, 3];
const a = xs[0];       // number | undefined (with the flag)
const [b] = xs;        // number (destructure assumes presence — known unsoundness)
</code></pre>

<h3><code>void</code> ≠ <code>undefined</code></h3>
<pre><code class="language-ts">type Cb = () =&gt; void;
const cb: Cb = () =&gt; 42;       // ✅ — caller agrees not to look at the return
const result = (cb as any)();  // technically 42, but you said you wouldn't look
</code></pre>
<p><code>void</code> means "the caller should ignore my return value" — it doesn't force the function to actually return undefined. This is why <code>arr.forEach(x =&gt; arr.push(x*2))</code> compiles even though <code>push</code> returns a number.</p>

<h3>Empty object type <code>{}</code></h3>
<p><code>{}</code> means "any non-null, non-undefined value" — not "an empty object." Equivalent to <code>NonNullable&lt;unknown&gt;</code>. Almost never what you want.</p>
<pre><code class="language-ts">const x: {} = "hello";       // ✅ — strings have no required properties to fail
const y: {} = null;          // ❌
</code></pre>

<h3>Excess <code>any</code> infection</h3>
<pre><code class="language-ts">// any is contagious through expressions
const a: any = ...;
const b = a.x.y.z;           // any
const c = b + 1;             // any
const d = [a, "x"];          // any[]   — typed array poisoned
</code></pre>
<p>One <code>any</code> at a boundary infects every downstream value. <code>unknown</code> stops the bleeding because you must narrow before use.</p>

<h3><code>NaN</code> and friends</h3>
<p>TS doesn't track <code>NaN</code> as a separate type. <code>Number("foo")</code> returns <code>NaN</code> typed as <code>number</code>. Same for <code>parseInt</code>. If you need safety here, validate at the boundary.</p>

<h3>Index signature widens too much</h3>
<pre><code class="language-ts">type Bag = { [key: string]: number };
const b: Bag = { a: 1 };
b.totallyMadeUp;        // number (TS thinks it's there)
// Better: Map&lt;string, number&gt; or a known key set
</code></pre>

<h3>Subclass surprises with structural typing</h3>
<pre><code class="language-ts">class Dog { bark() {} }
class Cat { meow() {} }

const c: Cat = new Dog();    // ❌ Cat needs meow
class Cat2 { /* nothing */ }
const c2: Cat2 = new Dog();  // ✅ structurally compatible (both have nothing required)
</code></pre>
<p>Empty classes accept anything. Add a private member or branding for nominal feel.</p>

<h3>Function return type contravariance</h3>
<pre><code class="language-ts">type Get = () =&gt; { name: string };
const g: Get = () =&gt; ({ name: "x", age: 1 });   // ✅ wider return is fine
</code></pre>

<h3>Optional chaining + non-null assertion lies</h3>
<pre><code class="language-ts">const u = users.find(u =&gt; u.id === id);  // User | undefined
return u!.name;        // !  — "trust me, not undefined". Crashes if it is.
// Prefer: if (!u) throw new Error("..."); return u.name;
</code></pre>

<h3>Class field default initialization with strictPropertyInitialization</h3>
<pre><code class="language-ts">class Foo {
  bar: string;        // ❌ — no initializer, no constructor assignment
}
class Foo2 {
  bar!: string;       // definite-assignment assertion (escape hatch)
  bar2: string = "";  // initialized
  constructor(public bar3: string) {}  // assigned in constructor
}
</code></pre>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: <code>as</code> instead of narrowing</h3>
<pre><code class="language-ts">// BAD — silent at compile time, crashes at runtime
const data = JSON.parse(raw) as User;
console.log(data.name);

// GOOD — narrow first
function isUser(x: unknown): x is User { /*...*/ }
const parsed: unknown = JSON.parse(raw);
if (isUser(parsed)) console.log(parsed.name);
else throw new Error("Invalid payload");
</code></pre>

<h3>Bug 2: <code>any</code> in <code>catch</code></h3>
<pre><code class="language-ts">// Old default — every catch was 'any'
try { /* ... */ } catch (e) { console.log(e.message); }

// Modern (useUnknownInCatchVariables: true)
try { /* ... */ } catch (e) {
  if (e instanceof Error) console.log(e.message);
  else console.log(String(e));
}
</code></pre>

<h3>Bug 3: Optional chaining swallowing real errors</h3>
<pre><code class="language-ts">// BAD — silently turns "missing required field" into undefined
const name = user?.profile?.name ?? "";

// GOOD — at boundaries, fail loud
if (!user.profile) throw new Error("profile required");
const name = user.profile.name;
</code></pre>

<h3>Bug 4: Array index treated as guaranteed</h3>
<pre><code class="language-ts">// BAD — arr[0] could be undefined
const first = arr[0];
console.log(first.name);     // crashes if arr is empty

// With noUncheckedIndexedAccess: arr[0] is T | undefined — TS forces a check.
</code></pre>

<h3>Bug 5: <code>Object.keys</code> returns string[]</h3>
<pre><code class="language-ts">type User = { id: string; name: string };
const u: User = { id: "1", name: "x" };
Object.keys(u).forEach((k) =&gt; {
  // k is string, not keyof User — because the runtime object may have extra keys.
  // u[k];   // ❌ string can't index User
});

// If you need keyof typing:
(Object.keys(u) as Array&lt;keyof User&gt;).forEach((k) =&gt; { u[k]; });
// — but this is unsafe if u has extra keys at runtime.
</code></pre>

<h3>Bug 6: Generic with no constraint becomes <code>unknown</code> downstream</h3>
<pre><code class="language-ts">function pluckId&lt;T&gt;(x: T) { return x.id; }   // ❌ id might not exist on T

// Constrain it
function pluckId&lt;T extends { id: string }&gt;(x: T) { return x.id; }
</code></pre>

<h3>Bug 7: Returning a wider type than intended</h3>
<pre><code class="language-ts">// Inferred return is User | null
function findUser(id: string) {
  return users.find(u =&gt; u.id === id) ?? null;
}

// If callers must handle null, annotate to make the contract explicit and stable
function findUser2(id: string): User | null {
  return users.find(u =&gt; u.id === id) ?? null;
}
</code></pre>

<h3>Bug 8: Mutating a <code>readonly</code> array via cast</h3>
<pre><code class="language-ts">function freezeIds(ids: readonly string[]) {
  (ids as string[]).push("oops");   // compiles but corrupts caller's data
}
</code></pre>

<h3>Bug 9: Type predicate that lies</h3>
<pre><code class="language-ts">function isUser(x: any): x is User {
  return !!x;   // says yes for "hello", 42, []
}
// Type predicates are trusted by the compiler. A wrong predicate is worse than no predicate.
</code></pre>

<h3>Bug 10: Discriminated union without a literal discriminator</h3>
<pre><code class="language-ts">// BAD — no narrow-able discriminator
type A = { x: number; y?: string };
type B = { x: number; z?: number };
type AB = A | B;

function f(v: AB) {
  if ("y" in v) v.y;   // works, but as union shapes converge it stops being reliable
}

// GOOD — explicit tag
type A2 = { kind: "a"; payload: string };
type B2 = { kind: "b"; payload: number };
function f2(v: A2 | B2) {
  if (v.kind === "a") v.payload;   // string
}
</code></pre>

<h3>Anti-pattern 1: <code>any</code> everywhere "to make TS quiet"</h3>
<p>Every <code>any</code> is a bug waiting to happen. If you're stuck, reach for <code>unknown</code>, then narrow. If you can't model it, that's a code-design hint.</p>

<h3>Anti-pattern 2: parallel JSDoc + TS</h3>
<pre><code class="language-ts">/**
 * @param {string} name — the user's name
 * @returns {User} a user
 */
function makeUser(name: string): User { /*...*/ }
// JSDoc adds zero info TS doesn't already have. It rots. Delete it.
</code></pre>

<h3>Anti-pattern 3: bottomless type gymnastics</h3>
<p>If your conditional type is 80 lines, your domain model probably needs to change instead. Types should serve the code; the code shouldn't serve the types.</p>

<h3>Anti-pattern 4: Big interfaces with everything optional</h3>
<pre><code class="language-ts">// BAD — useless safety
interface Order {
  id?: string;
  amount?: number;
  items?: Item[];
  status?: string;
}
// Now every read needs a null check. Split into states (Draft/Placed/Shipped) with required fields per state.
</code></pre>

<h3>Anti-pattern 5: <code>as unknown as Foo</code> double-cast</h3>
<p>"<code>as Foo</code> failed, so I'll <code>as unknown as Foo</code>." This is a flag that you're forcing a type the value doesn't have. Almost always means you should validate, not assert.</p>

<h3>Anti-pattern 6: Defining types in <code>.d.ts</code> for project code</h3>
<p><code>.d.ts</code> is for declaring types of <em>external</em> code (npm packages, globals). Your own types belong in <code>.ts</code> next to the implementation.</p>

<h3>Anti-pattern 7: Ignoring the lint warning that the compiler is wrong</h3>
<p>"It's just a TS error, the code works." Read the error. They are almost always real issues — wrong assumptions about nullability, wrong shape, stale signatures.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '🎤 Interview Patterns',
      html: `
<h3>The 12 must-know answers</h3>
<table>
  <thead><tr><th>Question</th><th>One-liner</th></tr></thead>
  <tbody>
    <tr><td><em>What kind of typing does TS use?</em></td><td>Structural. Compatibility is by shape, not name.</td></tr>
    <tr><td><em>Are types available at runtime?</em></td><td>No. Types are erased; emit is plain JS.</td></tr>
    <tr><td><em>Difference between <code>type</code> and <code>interface</code>?</em></td><td>Interface declarations merge and extend; type aliases handle unions, primitives, tuples, and computed types.</td></tr>
    <tr><td><em><code>any</code> vs <code>unknown</code> vs <code>never</code>?</em></td><td>Top type that disables checks; top type that demands narrowing; bottom type representing impossibility.</td></tr>
    <tr><td><em>Union vs intersection?</em></td><td>Union widens the value set; intersection narrows it (or merges shapes).</td></tr>
    <tr><td><em>What is a discriminated union?</em></td><td>A union where each variant has a literal-typed shared field used to narrow.</td></tr>
    <tr><td><em>How do you narrow a value?</em></td><td><code>typeof</code>, <code>instanceof</code>, <code>in</code>, equality, user-defined predicates.</td></tr>
    <tr><td><em>Why does <code>let s = "x"</code> infer <code>string</code>?</em></td><td>Mutable bindings widen literal types; <code>const</code> preserves them.</td></tr>
    <tr><td><em>What does <code>as const</code> do?</em></td><td>Locks all literals to their narrow types and marks arrays/objects readonly.</td></tr>
    <tr><td><em>Why <code>satisfies</code>?</em></td><td>Verifies a value matches a type without widening it; preserves the precise inferred type.</td></tr>
    <tr><td><em>How would you validate JSON.parse?</em></td><td>Cast to <code>unknown</code>, then narrow with a guard or schema (zod / io-ts).</td></tr>
    <tr><td><em>Why prefer string-union over enum?</em></td><td>Zero runtime cost, tree-shakable, plays with isolatedModules and any bundler.</td></tr>
  </tbody>
</table>

<h3>Live-coding: model a state machine</h3>
<p>Common ask. The expected shape is a discriminated union plus an exhaustive switch:</p>
<pre><code class="language-ts">type AsyncState&lt;T, E = Error&gt; =
  | { tag: "idle" }
  | { tag: "loading" }
  | { tag: "success"; data: T }
  | { tag: "error"; error: E };

function reducer&lt;T&gt;(s: AsyncState&lt;T&gt;, ev: { type: "fetch" } | { type: "ok"; data: T } | { type: "err"; error: Error }): AsyncState&lt;T&gt; {
  switch (ev.type) {
    case "fetch": return { tag: "loading" };
    case "ok":    return { tag: "success", data: ev.data };
    case "err":   return { tag: "error", error: ev.error };
  }
}
</code></pre>

<h3>Live-coding: type a fetch wrapper</h3>
<pre><code class="language-ts">async function getJSON&lt;T&gt;(url: string): Promise&lt;T&gt; {
  const r = await fetch(url);
  if (!r.ok) throw new Error(\`HTTP \${r.status}\`);
  return (await r.json()) as T;        // <- mention: caller's responsibility to validate; or accept unknown
}

// Better, type-safer alternative:
async function getJSONSafe&lt;T&gt;(url: string, validate: (x: unknown) =&gt; x is T): Promise&lt;T&gt; {
  const r = await fetch(url);
  if (!r.ok) throw new Error(\`HTTP \${r.status}\`);
  const body: unknown = await r.json();
  if (!validate(body)) throw new Error("Invalid response");
  return body;
}
</code></pre>

<h3>"Spot the bug" classics</h3>
<ol>
  <li><code>arr[0].x</code> with strict array indexing — needs a check.</li>
  <li><code>JSON.parse(s) as Config</code> — runtime lie, swap to <code>unknown</code> + validate.</li>
  <li><code>catch (e)</code> reading <code>e.message</code> — type is <code>unknown</code> in strict mode.</li>
  <li>Discriminated union without a discriminator — narrowing falls back to <code>in</code>-checks; suggest adding a <code>kind</code>.</li>
  <li>Function param <code>x: any</code> with downstream <code>x.foo</code> — propose <code>unknown</code> + narrowing.</li>
</ol>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want to see</th></tr></thead>
  <tbody>
    <tr><td>Boundary thinking</td><td>You distinguish typed code from untyped (network, LocalStorage, JSON) and validate at the seam.</td></tr>
    <tr><td>Inference fluency</td><td>You annotate parameters/exports and let the rest infer; no over-annotated code.</td></tr>
    <tr><td>Discriminated unions</td><td>You reach for them as the default for state, errors, and event shapes.</td></tr>
    <tr><td><code>never</code> for exhaustiveness</td><td>You write the <code>const _: never = ...</code> trick in switch defaults.</td></tr>
    <tr><td><code>satisfies</code> awareness</td><td>You can describe when to use it vs an annotation vs an assertion.</td></tr>
    <tr><td>Zero <code>any</code></td><td>If you used one, you can defend it. Otherwise it's <code>unknown</code> + narrow.</td></tr>
    <tr><td>Strict tsconfig</td><td>You volunteer that <code>strict</code> + <code>noUncheckedIndexedAccess</code> are baseline.</td></tr>
    <tr><td>Domain-driven types</td><td>You model states as separate types ("Draft / Placed / Shipped") not one giant optional bag.</td></tr>
  </tbody>
</table>

<h3>"Two-minute design" prompts and their answers</h3>
<ul>
  <li><em>"Type a function that picks N keys from an object."</em>
    <pre><code class="language-ts">function pick&lt;T, K extends keyof T&gt;(o: T, ks: readonly K[]): Pick&lt;T, K&gt; {
  const out = {} as Pick&lt;T, K&gt;;
  ks.forEach(k =&gt; { out[k] = o[k]; });
  return out;
}</code></pre>
  </li>
  <li><em>"Type a function that swaps two object properties."</em>
    <pre><code class="language-ts">function swap&lt;T, A extends keyof T, B extends keyof T&gt;(o: T, a: A, b: B): Omit&lt;T, A | B&gt; &amp; Record&lt;A, T[B]&gt; &amp; Record&lt;B, T[A]&gt; {
  const { [a]: va, [b]: vb, ...rest } = o as any;
  return { ...rest, [a]: vb, [b]: va };
}</code></pre>
  </li>
  <li><em>"Make UserId and ProductId not interchangeable."</em>
    <pre><code class="language-ts">type Brand&lt;T, B&gt; = T &amp; { readonly __brand: B };
type UserId = Brand&lt;string, "UserId"&gt;;
type ProductId = Brand&lt;string, "ProductId"&gt;;</code></pre>
  </li>
</ul>

<h3>Mobile / RN angle</h3>
<ul>
  <li><strong>Navigation params</strong> — <code>RootStackParamList</code> + <code>NativeStackScreenProps&lt;RootStackParamList, "Detail"&gt;</code> gives type-safe <code>navigation</code> and <code>route.params</code>.</li>
  <li><strong>Style typing</strong> — <code>StyleProp&lt;ViewStyle&gt;</code>, <code>StyleProp&lt;TextStyle&gt;</code>; never <code>any</code> for <code>style</code> props.</li>
  <li><strong>Native module bridge</strong> — old arch: hand-rolled types in <code>.d.ts</code>; new arch (TurboModules): codegen from a TS spec.</li>
  <li><strong>Reanimated worklets</strong> — <code>SharedValue&lt;number&gt;</code>, plus <code>worklet</code> annotations limit what types can cross threads.</li>
</ul>

<h3>Things to volunteer at the close</h3>
<ul>
  <li>"In a real codebase I'd pair this with <code>zod</code> at the network boundary so types and runtime stay in sync."</li>
  <li>"For monorepos I'd publish shared types as a workspace package and reference them via project references."</li>
  <li>"For migrations from JS, <code>allowJs</code> + <code>checkJs</code> with JSDoc gives you 80% of TS at 0% of the rewrite cost."</li>
  <li>"<code>noUncheckedIndexedAccess</code> is the single highest-leverage flag for catching null-deref bugs in real codebases."</li>
</ul>
`
    }
  ]
});
