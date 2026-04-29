window.PREP_SITE.registerTopic({
  id: 'ts-generics',
  module: 'typescript',
  title: 'Generics',
  estimatedReadTime: '40 min',
  tags: ['typescript', 'generics', 'type-parameters', 'inference', 'constraints', 'variance', 'higher-kinded'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Generics</strong> are functions for the type system. They take types as inputs and produce types as outputs, letting one piece of code work safely with many shapes without losing precision.</p>
<ul>
  <li><strong>Why:</strong> a function that takes any value and returns it should not erase the value's type. <code>identity&lt;T&gt;(x: T): T</code> preserves it.</li>
  <li><strong>Constraints (<code>extends</code>):</strong> "T must be at least this shape." Lets you call <code>.length</code>, <code>.id</code>, etc. on the parameter while staying generic.</li>
  <li><strong>Defaults:</strong> <code>&lt;T = string&gt;</code> for ergonomic call-sites that don't specify.</li>
  <li><strong>Inference</strong> picks T from the call site. You should rarely write the type argument explicitly.</li>
  <li><strong>Generic constraints with <code>keyof</code></strong> are the bread and butter of type-safe property access.</li>
  <li><strong>Variance:</strong> generic positions can be covariant (read), contravariant (write), or invariant (both). TS 4.7+ supports explicit <code>in</code>/<code>out</code> annotations.</li>
  <li><strong>Don't reach for generics by reflex.</strong> If T appears once, it's not generic — it's <code>any</code> in disguise.</li>
</ul>
<p><strong>Mantra:</strong> "Type parameters preserve information across boundaries. Constrain them, infer them, never widen them by hand."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What is a generic?</h3>
<p>A generic is a parameterized type. Just like a regular function takes runtime values as parameters and returns a value, a generic takes <em>types</em> as parameters and returns a <em>type</em> (or a function whose signature uses those type parameters).</p>
<pre><code class="language-ts">// Runtime function
function identity(x: number): number { return x; }

// Generic — accepts any T, returns the same T
function identity&lt;T&gt;(x: T): T { return x; }

identity(42);          // T inferred as number → returns number
identity("hi");        // T inferred as string → returns string
identity&lt;boolean&gt;(true); // T explicitly bound — rarely needed
</code></pre>

<h3>Why we need them</h3>
<p>Without generics, you have two options when modeling a "container of unknown type":</p>
<ol>
  <li>Use <code>any</code> — disables checking, infects the codebase.</li>
  <li>Hand-write one version per concrete type — duplication explodes.</li>
</ol>
<p>Generics resolve both: write the code once, retain the type information for every call.</p>

<h3>Where they actually appear</h3>
<table>
  <thead><tr><th>Position</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td>Function</td><td><code>function map&lt;T, U&gt;(xs: T[], fn: (x: T) =&gt; U): U[]</code></td></tr>
    <tr><td>Type alias</td><td><code>type Box&lt;T&gt; = { value: T }</code></td></tr>
    <tr><td>Interface</td><td><code>interface Repo&lt;T&gt; { get(id: string): T | null }</code></td></tr>
    <tr><td>Class</td><td><code>class Stack&lt;T&gt; { private xs: T[] = []; push(x: T) {} }</code></td></tr>
    <tr><td>Method (different parameter from class)</td><td><code>class Pipe&lt;T&gt; { map&lt;U&gt;(fn: (x: T) =&gt; U): Pipe&lt;U&gt; }</code></td></tr>
  </tbody>
</table>

<h3>The "rule of two" — when generics earn their cost</h3>
<p>A type parameter is justified when it shows up in at least <strong>two</strong> places (parameter and return; two parameters; etc.) so it can <em>relate</em> them. If T only appears once, the function is "secretly any":</p>
<pre><code class="language-ts">// USELESS — T is unrelated to anything else
function logIt&lt;T&gt;(x: T): void { console.log(x); }
// Just write:
function logIt(x: unknown): void { console.log(x); }
</code></pre>

<h3>How generics differ from <code>any</code></h3>
<p><code>any</code> says "trust me, no checks." A generic says "I don't know yet, but whatever T turns out to be, I'll preserve it." The difference shows the moment you compose:</p>
<pre><code class="language-ts">function head1(xs: any[]): any { return xs[0]; }
function head2&lt;T&gt;(xs: T[]): T | undefined { return xs[0]; }

const a = head1([1, 2, 3]);     // any — bug nursery
const b = head2([1, 2, 3]);     // number | undefined — useful
</code></pre>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>"Generics are functions in the type universe"</h3>
<p>Read <code>type Box&lt;T&gt; = { value: T }</code> as: "I'm defining a function called Box that takes one type T and returns the type <code>{ value: T }</code>." When you write <code>Box&lt;string&gt;</code>, you're calling that function. This single mental shift makes everything downstream click.</p>

<h3>Inference: how T is chosen</h3>
<p>When you call <code>identity(42)</code>, TS unifies the parameter type <code>T</code> with the argument type <code>number</code>. The mechanism is structural unification: TS walks the parameter type, finds T, and matches it against the argument's shape. If T appears in multiple positions, TS infers the <em>most general</em> type that satisfies all of them.</p>
<pre><code class="language-ts">function pair&lt;T&gt;(a: T, b: T): [T, T] { return [a, b]; }
pair(1, 2);          // T = number
pair("a", "b");      // T = string
pair(1, "x");        // T = string | number  (the join)

// Force exact match:
function strictPair&lt;T&gt;(a: T, b: NoInfer&lt;T&gt;): [T, T] { return [a, b]; }
strictPair("a", 1);  // ❌ — only the first argument fixes T (TS 5.4+)
</code></pre>

<h3>Constraints — making T usable</h3>
<p>Inside a generic body, T is unknown. You can't read <code>.length</code> or <code>.id</code>. A constraint (<code>T extends ...</code>) narrows what T can be, which lets you operate on it.</p>
<pre><code class="language-ts">// Without constraint — error: Property 'length' does not exist on type 'T'
function biggest&lt;T&gt;(xs: T[]) { return xs.sort((a, b) =&gt; a.length - b.length); }

// Constrained: T is at least { length: number }
function biggest&lt;T extends { length: number }&gt;(xs: T[]): T {
  return xs.sort((a, b) =&gt; b.length - a.length)[0];
}
biggest(["aa", "b"]);  // ✅ strings have length
biggest([{length: 3}, {length: 1}]);  // ✅ shape matches
biggest([1, 2]);       // ❌ numbers don't have length
</code></pre>

<h3>The <code>keyof T</code> pattern</h3>
<p>The single most-used generic pattern in product TS. Lets you write functions that access properties safely:</p>
<pre><code class="language-ts">function get&lt;T, K extends keyof T&gt;(o: T, k: K): T[K] { return o[k]; }

const u = { id: "1", name: "x", age: 30 };
get(u, "name");   // string
get(u, "age");    // number
get(u, "email");  // ❌ "email" not in keyof T
</code></pre>

<h3>Defaults — for ergonomics</h3>
<pre><code class="language-ts">type ApiResponse&lt;T = unknown&gt; = { ok: boolean; data: T };

const r1: ApiResponse = { ok: true, data: { whatever: 1 } };       // T = unknown
const r2: ApiResponse&lt;User&gt; = { ok: true, data: { id: "1", name: "x" } };
</code></pre>

<h3>Variance, briefly</h3>
<table>
  <thead><tr><th>Term</th><th>Meaning</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td>Covariant</td><td>If T is a subtype of U, then F&lt;T&gt; is a subtype of F&lt;U&gt;.</td><td>Read-only positions: <code>readonly T[]</code>, <code>() =&gt; T</code></td></tr>
    <tr><td>Contravariant</td><td>If T is a subtype of U, then F&lt;U&gt; is a subtype of F&lt;T&gt;.</td><td>Argument positions: <code>(x: T) =&gt; void</code></td></tr>
    <tr><td>Invariant</td><td>Neither direction works.</td><td>Mutable read-write: <code>T[]</code></td></tr>
    <tr><td>Bivariant</td><td>Both directions allowed (unsound).</td><td>Method positions without strictFunctionTypes</td></tr>
  </tbody>
</table>
<p>TS 4.7+ lets you mark a type parameter explicitly with <code>in</code> (contravariant), <code>out</code> (covariant), or both:</p>
<pre><code class="language-ts">interface Producer&lt;out T&gt; { make(): T; }
interface Consumer&lt;in T&gt; { take(x: T): void; }
interface Channel&lt;in out T&gt; { send(x: T): void; recv(): T; }
</code></pre>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Generic functions</h3>
<pre><code class="language-ts">// Single param
function identity&lt;T&gt;(x: T): T { return x; }

// Two params, related
function map&lt;T, U&gt;(xs: T[], fn: (x: T) =&gt; U): U[] {
  return xs.map(fn);
}

// Three params with constraint between them
function pluck&lt;T, K extends keyof T&gt;(xs: T[], k: K): T[K][] {
  return xs.map(x =&gt; x[k]);
}

const users = [{ id: "1", name: "a" }, { id: "2", name: "b" }];
const ids = pluck(users, "id");      // string[]
const names = pluck(users, "name");  // string[]
</code></pre>

<h3>Generic interfaces and type aliases</h3>
<pre><code class="language-ts">interface Box&lt;T&gt; { value: T; }
type Pair&lt;A, B&gt; = { first: A; second: B };

const a: Box&lt;number&gt; = { value: 1 };
const p: Pair&lt;string, boolean&gt; = { first: "x", second: true };

// Recursive (self-referential)
type Tree&lt;T&gt; = { value: T; children: Tree&lt;T&gt;[] };
const t: Tree&lt;string&gt; = { value: "root", children: [{ value: "a", children: [] }] };
</code></pre>

<h3>Generic classes</h3>
<pre><code class="language-ts">class Stack&lt;T&gt; {
  private items: T[] = [];
  push(x: T): void { this.items.push(x); }
  pop(): T | undefined { return this.items.pop(); }
  peek(): T | undefined { return this.items[this.items.length - 1]; }
  get size(): number { return this.items.length; }
}

const s = new Stack&lt;string&gt;();
s.push("a");
s.pop();        // string | undefined
</code></pre>

<h3>Method-level generics — different from class-level</h3>
<pre><code class="language-ts">class Box&lt;T&gt; {
  constructor(public value: T) {}

  // T is fixed at construction; U is per-call
  map&lt;U&gt;(fn: (x: T) =&gt; U): Box&lt;U&gt; {
    return new Box(fn(this.value));
  }
}

const b = new Box(5);              // Box&lt;number&gt;
const c = b.map(n =&gt; n.toString()); // Box&lt;string&gt;
</code></pre>

<h3>Constraints — the <code>extends</code> keyword</h3>
<pre><code class="language-ts">// Must have a length
function len&lt;T extends { length: number }&gt;(x: T): number { return x.length; }

// Must be a key of an object
function getValue&lt;T, K extends keyof T&gt;(obj: T, k: K): T[K] { return obj[k]; }

// Must be a subtype of a known union
function paint&lt;C extends "red" | "green" | "blue"&gt;(c: C): C { return c; }

// Must extend a class/interface
interface HasId { id: string }
function dedupe&lt;T extends HasId&gt;(xs: T[]): T[] {
  const seen = new Set&lt;string&gt;();
  return xs.filter(x =&gt; !seen.has(x.id) &amp;&amp; seen.add(x.id));
}
</code></pre>

<h3>Default type parameters</h3>
<pre><code class="language-ts">// T defaults to unknown if not given
type Result&lt;T = unknown, E = Error&gt; =
  | { ok: true; value: T }
  | { ok: false; error: E };

const a: Result = { ok: false, error: new Error("x") };
const b: Result&lt;number&gt; = { ok: true, value: 42 };
const c: Result&lt;number, string&gt; = { ok: false, error: "oops" };
</code></pre>

<h3>Generic constraints that depend on each other</h3>
<pre><code class="language-ts">// K must be a key of T; default to all keys
function mapValues&lt;T, K extends keyof T = keyof T, U = T[K]&gt;(
  obj: T,
  fn: (v: T[K], k: K) =&gt; U
): Record&lt;K, U&gt; {
  const out = {} as Record&lt;K, U&gt;;
  (Object.keys(obj) as K[]).forEach((k) =&gt; { out[k] = fn(obj[k], k); });
  return out;
}
</code></pre>

<h3>Inferring tuple types — the <code>const</code> trick</h3>
<pre><code class="language-ts">function tuple&lt;T extends readonly unknown[]&gt;(...args: T): T { return args; }

const t = tuple(1, "x", true);   // [number, string, boolean]
//   ^? readonly [number, string, boolean] depending on TS version
</code></pre>

<h3>Conditional behavior via overloads vs generics</h3>
<pre><code class="language-ts">// Overloads — clearest when shapes truly differ
function find(xs: string[], q: string): string | undefined;
function find(xs: number[], q: number): number | undefined;
function find&lt;T&gt;(xs: T[], q: T): T | undefined { return xs.find(x =&gt; x === q); }

// Single generic — preferred when uniform behavior
function find2&lt;T&gt;(xs: readonly T[], q: T): T | undefined {
  return xs.find(x =&gt; x === q);
}
</code></pre>

<h3>Generic React component (Hook + component)</h3>
<pre><code class="language-tsx">function useFetch&lt;T&gt;(url: string): { data: T | null; error: Error | null } {
  const [state, setState] = React.useState&lt;{ data: T | null; error: Error | null }&gt;({ data: null, error: null });
  React.useEffect(() =&gt; {
    let alive = true;
    fetch(url).then(r =&gt; r.json()).then((d: T) =&gt; { if (alive) setState({ data: d, error: null }); })
      .catch((e) =&gt; { if (alive) setState({ data: null, error: e }); });
    return () =&gt; { alive = false; };
  }, [url]);
  return state;
}

function List&lt;T extends { id: string }&gt;({ items, render }: { items: T[]; render: (x: T) =&gt; React.ReactNode }) {
  return &lt;&gt;{items.map(item =&gt; (&lt;div key={item.id}&gt;{render(item)}&lt;/div&gt;))}&lt;/&gt;;
}
</code></pre>

<h3>The <code>NoInfer</code> utility (TS 5.4+)</h3>
<pre><code class="language-ts">// You want only the first argument to fix T:
function findInArray&lt;T&gt;(xs: T[], target: NoInfer&lt;T&gt;): T | undefined {
  return xs.find(x =&gt; x === target);
}

findInArray(["a", "b"], "a");   // ✅
findInArray(["a", "b"], 1);     // ❌ — without NoInfer, T would widen to string | number
</code></pre>

<h3>Variance annotations (TS 4.7+)</h3>
<pre><code class="language-ts">interface Producer&lt;out T&gt; { make(): T; }
interface Consumer&lt;in T&gt; { take(x: T): void; }

const animalProducer: Producer&lt;Animal&gt; = { make: () =&gt; new Animal() };
const dogProducer: Producer&lt;Dog&gt; = animalProducer;   // ❌ Producer&lt;Animal&gt; is NOT a Producer&lt;Dog&gt;
const animalProducer2: Producer&lt;Animal&gt; = dogProducer; // ✅ Producer&lt;Dog&gt; IS a Producer&lt;Animal&gt;

const dogConsumer: Consumer&lt;Dog&gt; = { take: (d) =&gt; {} };
const animalConsumer: Consumer&lt;Animal&gt; = dogConsumer;  // ❌
const dogConsumer2: Consumer&lt;Dog&gt; = { take: (a: Animal) =&gt; {} } as Consumer&lt;Animal&gt;; // ✅ Animal-consumer is also a Dog-consumer
</code></pre>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Type-safe Object.entries / fromEntries</h3>
<pre><code class="language-ts">// Object.entries returns [string, T][] which loses keyof info
type Entries&lt;T&gt; = { [K in keyof T]: [K, T[K]] }[keyof T][];

function entries&lt;T extends object&gt;(o: T): Entries&lt;T&gt; {
  return Object.entries(o) as Entries&lt;T&gt;;
}

const u = { id: "1", age: 30 };
const e = entries(u);  // (["id", string] | ["age", number])[]
</code></pre>

<h3>Example 2: Generic event emitter (typed channels)</h3>
<pre><code class="language-ts">type EventMap = Record&lt;string, unknown&gt;;

class Emitter&lt;E extends EventMap&gt; {
  private fns: { [K in keyof E]?: Array&lt;(p: E[K]) =&gt; void&gt; } = {};
  on&lt;K extends keyof E&gt;(k: K, fn: (p: E[K]) =&gt; void): () =&gt; void {
    (this.fns[k] ||= []).push(fn);
    return () =&gt; { this.fns[k] = this.fns[k]?.filter(f =&gt; f !== fn); };
  }
  emit&lt;K extends keyof E&gt;(k: K, p: E[K]): void {
    this.fns[k]?.forEach(fn =&gt; fn(p));
  }
}

// Use it with a typed channel map:
type AppEvents = {
  login: { userId: string };
  logout: void;
  error: Error;
};

const ee = new Emitter&lt;AppEvents&gt;();
ee.on("login", p =&gt; console.log(p.userId));   // p inferred
ee.emit("login", { userId: "1" });            // ✅
ee.emit("login", { wrong: true });            // ❌
</code></pre>

<h3>Example 3: Type-safe API client (route map)</h3>
<pre><code class="language-ts">type Routes = {
  "GET /users":      { res: User[] };
  "GET /users/:id":  { params: { id: string }; res: User };
  "POST /users":     { body: { name: string }; res: User };
};

type RouteKey = keyof Routes;
type RouteOf&lt;K extends RouteKey&gt; = Routes[K];

async function call&lt;K extends RouteKey&gt;(
  key: K,
  ...args: RouteOf&lt;K&gt; extends { body: infer B } &amp; { params: infer P }
    ? [body: B, params: P]
    : RouteOf&lt;K&gt; extends { body: infer B }
      ? [body: B]
      : RouteOf&lt;K&gt; extends { params: infer P }
        ? [params: P]
        : []
): Promise&lt;RouteOf&lt;K&gt;["res"]&gt; {
  // build URL/method from key, run fetch
  return undefined as any;
}

const users = await call("GET /users");                // User[]
const u = await call("GET /users/:id", { id: "1" });   // User
const created = await call("POST /users", { name: "x" }); // User
</code></pre>

<h3>Example 4: Generic memoize</h3>
<pre><code class="language-ts">function memoize&lt;Args extends unknown[], R&gt;(fn: (...args: Args) =&gt; R): (...args: Args) =&gt; R {
  const cache = new Map&lt;string, R&gt;();
  return (...args: Args) =&gt; {
    const key = JSON.stringify(args);
    if (!cache.has(key)) cache.set(key, fn(...args));
    return cache.get(key)!;
  };
}

const add = memoize((a: number, b: number) =&gt; a + b);
add(1, 2);    // computed
add(1, 2);    // cached
</code></pre>

<h3>Example 5: Generic Result/Either monad</h3>
<pre><code class="language-ts">type Result&lt;T, E = Error&gt; =
  | { ok: true; value: T }
  | { ok: false; error: E };

const ok = &lt;T&gt;(value: T): Result&lt;T, never&gt; =&gt; ({ ok: true, value });
const err = &lt;E&gt;(error: E): Result&lt;never, E&gt; =&gt; ({ ok: false, error });

function map&lt;T, U, E&gt;(r: Result&lt;T, E&gt;, fn: (x: T) =&gt; U): Result&lt;U, E&gt; {
  return r.ok ? ok(fn(r.value)) : r;
}

function flatMap&lt;T, U, E&gt;(r: Result&lt;T, E&gt;, fn: (x: T) =&gt; Result&lt;U, E&gt;): Result&lt;U, E&gt; {
  return r.ok ? fn(r.value) : r;
}
</code></pre>

<h3>Example 6: Generic Repository pattern</h3>
<pre><code class="language-ts">interface Entity { id: string }

interface Repo&lt;T extends Entity&gt; {
  get(id: string): Promise&lt;T | null&gt;;
  list(): Promise&lt;T[]&gt;;
  save(item: T): Promise&lt;T&gt;;
  delete(id: string): Promise&lt;boolean&gt;;
}

class InMemoryRepo&lt;T extends Entity&gt; implements Repo&lt;T&gt; {
  private store = new Map&lt;string, T&gt;();
  async get(id: string) { return this.store.get(id) ?? null; }
  async list() { return [...this.store.values()]; }
  async save(item: T) { this.store.set(item.id, item); return item; }
  async delete(id: string) { return this.store.delete(id); }
}

interface User extends Entity { name: string }
const users = new InMemoryRepo&lt;User&gt;();
await users.save({ id: "1", name: "Alice" });
const u = await users.get("1");   // User | null
</code></pre>

<h3>Example 7: Generic discriminated union narrowing</h3>
<pre><code class="language-ts">type Box&lt;T&gt; =
  | { kind: "empty" }
  | { kind: "full"; value: T };

function unwrap&lt;T&gt;(b: Box&lt;T&gt;, fallback: T): T {
  if (b.kind === "full") return b.value;   // T
  return fallback;
}

unwrap({ kind: "empty" } as Box&lt;number&gt;, 0);
unwrap({ kind: "full", value: "hi" } as Box&lt;string&gt;, "");
</code></pre>

<h3>Example 8: Generic React hook with discriminator return</h3>
<pre><code class="language-tsx">type AsyncState&lt;T&gt; =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

function useAsync&lt;T&gt;(fn: () =&gt; Promise&lt;T&gt;): AsyncState&lt;T&gt; {
  const [state, setState] = React.useState&lt;AsyncState&lt;T&gt;&gt;({ status: "idle" });
  React.useEffect(() =&gt; {
    let alive = true;
    setState({ status: "loading" });
    fn()
      .then(d =&gt; { if (alive) setState({ status: "success", data: d }); })
      .catch(e =&gt; { if (alive) setState({ status: "error", error: e }); });
    return () =&gt; { alive = false; };
  }, []);
  return state;
}

// Use site:
const r = useAsync(() =&gt; fetch("/u").then(r =&gt; r.json() as Promise&lt;User&gt;));
if (r.status === "success") r.data.name;   // narrowed
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Inference picks the widest common type</h3>
<pre><code class="language-ts">function pair&lt;T&gt;(a: T, b: T): [T, T] { return [a, b]; }
const p = pair(1, "x");   // T = number | string  — TS unifies upward

// If you want to forbid this, use NoInfer (5.4+):
function strictPair&lt;T&gt;(a: T, b: NoInfer&lt;T&gt;): [T, T] { return [a, b]; }
strictPair(1, "x");        // ❌
</code></pre>

<h3>Empty generic constraint = unknown</h3>
<pre><code class="language-ts">function f&lt;T&gt;(x: T) {
  // T is unconstrained → equivalent to unknown inside the body
  // x.foo;   ❌ 'foo' does not exist on type 'T'
}
</code></pre>

<h3><code>extends</code> in constraints vs in conditional types</h3>
<p>Same keyword, two meanings. In <code>function f&lt;T extends X&gt;</code>, <code>extends</code> is a <em>constraint</em> ("T must satisfy X"). In <code>type Y = T extends X ? A : B</code>, <code>extends</code> is a <em>condition</em> ("if T is assignable to X, then A else B"). Conditional types come next topic.</p>

<h3>Generics and JSX clash</h3>
<pre><code class="language-tsx">// In .tsx, this is parsed as a JSX tag
const id = &lt;T&gt;(x: T) =&gt; x;          // ❌ syntax error

// Workarounds:
const id1 = &lt;T,&gt;(x: T) =&gt; x;         // trailing comma
const id2: &lt;T&gt;(x: T) =&gt; T = (x) =&gt; x;
function id3&lt;T&gt;(x: T): T { return x; }   // function declaration always fine
</code></pre>

<h3>Default-type-parameter ordering</h3>
<pre><code class="language-ts">// Once you set a default, all parameters after must also have defaults
type Pair&lt;A = string, B&gt; = [A, B];   // ❌
type Pair2&lt;A = string, B = number&gt; = [A, B]; // ✅
</code></pre>

<h3>Generic <code>this</code> in classes</h3>
<pre><code class="language-ts">class Builder&lt;T&gt; {
  set(x: T): this { /*...*/ return this; }   // chainable; preserves subclass type
}

class UserBuilder extends Builder&lt;User&gt; {
  withEmail(e: string): this { /*...*/ return this; }
}

new UserBuilder().set({ id: "1", name: "x" }).withEmail("a@b");  // returns UserBuilder, not Builder
</code></pre>

<h3>Type parameters can't be used in static members</h3>
<pre><code class="language-ts">class Box&lt;T&gt; {
  static empty: Box&lt;T&gt; = new Box&lt;T&gt;();   // ❌ static can't see T
  static empty&lt;U&gt;(): Box&lt;U&gt; { return new Box&lt;U&gt;(); }   // ✅ static method with own param
}
</code></pre>

<h3>Inference fails inside callbacks sometimes</h3>
<pre><code class="language-ts">// Sometimes inference doesn't propagate well:
function withConfig&lt;T&gt;(cfg: { onChange: (x: T) =&gt; void }) {}
withConfig({ onChange: (x) =&gt; { /* x is unknown */ } });
// Reason: T isn't reachable from the call. Either supply T explicitly, or
// add a parameter that pins T:
function withConfig2&lt;T&gt;(initial: T, cfg: { onChange: (x: T) =&gt; void }) {}
withConfig2(0, { onChange: (x) =&gt; { /* x: number */ } });
</code></pre>

<h3>Generic constraint with circular reference</h3>
<pre><code class="language-ts">// Constraint sees the unresolved T — works for self-referencing shapes
interface Comparable&lt;T extends Comparable&lt;T&gt;&gt; {
  compareTo(other: T): number;
}
class N implements Comparable&lt;N&gt; { compareTo(other: N) { return 0; } }
</code></pre>

<h3>Higher-kinded types — TS does not have them natively</h3>
<p>You cannot write <code>type F&lt;G&lt;_&gt;&gt; = ...</code>. Workarounds use type-level dispatch (HKT encodings via interfaces and conditional types). Almost always not worth it in product code.</p>

<h3>Generics across module boundaries</h3>
<p>Generic interfaces serialize fine through <code>.d.ts</code>. But <em>inferred</em> types in your published API can leak internal types. Annotate exports explicitly to keep the public surface stable.</p>

<h3>Distributive behavior with naked type parameters</h3>
<pre><code class="language-ts">type Wrap&lt;T&gt; = T extends any ? { value: T } : never;
type W = Wrap&lt;string | number&gt;;   // { value: string } | { value: number }   — distributes
type W2 = Wrap&lt;[string | number]&gt;[0]; // { value: string | number }   — does not distribute (tuple)
</code></pre>
<p>Distribution happens when the type parameter is "naked" (not wrapped). It's powerful — and a frequent source of "why is my type a union of 12 things?" surprises.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: T appears once → it's secretly any</h3>
<pre><code class="language-ts">// USELESS
function logIt&lt;T&gt;(x: T): void { console.log(x); }

// WHAT YOU MEANT
function logIt(x: unknown): void { console.log(x); }
</code></pre>
<p>If a type parameter doesn't appear in two places to <em>relate</em> them, it adds nothing. Worse, it gives the illusion of safety.</p>

<h3>Bug 2: Forcing T with explicit binding when inference is correct</h3>
<pre><code class="language-ts">// REDUNDANT
const xs = identity&lt;number&gt;(42);

// FINE
const xs = identity(42);
</code></pre>
<p>Only specify type arguments when inference is wrong or ambiguous.</p>

<h3>Bug 3: Constraint too loose — body can't operate on T</h3>
<pre><code class="language-ts">// ERROR: 'name' does not exist on type 'T'
function greet&lt;T&gt;(x: T) { return \`Hello \${x.name}\`; }

// FIX
function greet&lt;T extends { name: string }&gt;(x: T) { return \`Hello \${x.name}\`; }
</code></pre>

<h3>Bug 4: Constraint too tight — caller types are excluded</h3>
<pre><code class="language-ts">// Too tight — only Users allowed; can't reuse for any { name }
function greet&lt;T extends User&gt;(x: T) { return \`Hello \${x.name}\`; }

// Right size
function greet&lt;T extends { name: string }&gt;(x: T) { return \`Hello \${x.name}\`; }
</code></pre>
<p>Constrain to the minimum your function needs. Anything more leaks abstraction.</p>

<h3>Bug 5: Returning a wider type than the parameter</h3>
<pre><code class="language-ts">// Loses subclass info
function clone&lt;T extends User&gt;(u: T): User { return { ...u }; }
const admin = clone(adminUser);   // typed as User — admin-specific fields gone

// Preserve T
function clone2&lt;T extends User&gt;(u: T): T { return { ...u }; }
</code></pre>

<h3>Bug 6: Generic constraint with structural overlap surprises</h3>
<pre><code class="language-ts">function biggest&lt;T extends { length: number }&gt;(xs: T[]): T {
  return xs.sort((a, b) =&gt; b.length - a.length)[0];
}
biggest(["a", "bb"]);     // T = string  ✅
biggest([1, 2, 3]);       // ❌ — number doesn't have length
biggest({} as any);       // T = any — sort errors at runtime
</code></pre>
<p>"length" looks safe but is a structural surface — many unrelated types match.</p>

<h3>Bug 7: Mutating shared state in a generic class</h3>
<pre><code class="language-ts">class BadCache&lt;T&gt; {
  static items: any[] = [];   // shared across all generic instantiations
  add(x: T) { BadCache.items.push(x); }
}
new BadCache&lt;number&gt;().add(1);
new BadCache&lt;string&gt;().add("oops");
// BadCache.items is now (number | string)[] but the type system doesn't know
</code></pre>

<h3>Bug 8: Generic on class that doesn't use T in instance fields</h3>
<pre><code class="language-ts">class Useless&lt;T&gt; {
  greet() { return "hi"; }    // T appears nowhere
}
new Useless&lt;number&gt;().greet();
new Useless&lt;User&gt;().greet();   // both look "different" but aren't
</code></pre>

<h3>Bug 9: Excessive default fallbacks hiding bugs</h3>
<pre><code class="language-ts">// User passes nothing → T defaults to unknown → loses signal
type Endpoint&lt;T = any&gt; = { url: string; response: T };
const e: Endpoint = { url: "/x", response: undefined };  // any leaks
</code></pre>
<p>Defaults to <code>unknown</code> are usually safer than <code>any</code>.</p>

<h3>Bug 10: Misusing <code>infer</code> outside conditional types</h3>
<pre><code class="language-ts">// 'infer' is only valid inside the 'true' branch of a conditional type
type Wrong&lt;T&gt; = infer U;        // ❌
type Right&lt;T&gt; = T extends Promise&lt;infer U&gt; ? U : T;   // ✅
</code></pre>

<h3>Anti-pattern 1: type parameters as comments</h3>
<pre><code class="language-ts">// "I want this to feel generic" — T does nothing real
type Cache&lt;TKey, TValue, TConfig&gt; = { /* none of T appears in the shape */ };
</code></pre>

<h3>Anti-pattern 2: 5+ type parameters</h3>
<p>If your function has more type parameters than runtime parameters, the type system is doing more work than the function. Refactor: combine related parameters into a single object type, or split the function into two.</p>

<h3>Anti-pattern 3: nested defaults that drift</h3>
<pre><code class="language-ts">// Hard to reason about which T applies where
function f&lt;A = string, B = A, C = { a: A; b: B } &gt;() {/*...*/}
</code></pre>

<h3>Anti-pattern 4: <code>extends any</code></h3>
<pre><code class="language-ts">function f&lt;T extends any&gt;(x: T) {}     // means nothing — same as no constraint
</code></pre>

<h3>Anti-pattern 5: branded type without a constructor</h3>
<pre><code class="language-ts">type UserId = string &amp; { __brand: "UserId" };
function send(id: UserId) {}
send("u1");         // ❌
send("u1" as UserId); // works but ergonomic disaster everywhere
// Fix: provide a constructor function userIdOf(s: string): UserId
</code></pre>

<h3>Anti-pattern 6: generic React component with no constraint</h3>
<pre><code class="language-tsx">// Items can be anything — caller forgets to give a key
function List&lt;T&gt;({ items }: { items: T[] }) { return &lt;&gt;{items.map(i =&gt; ...)}&lt;/&gt;; }

// Better — constrain to require an id (or accept a getKey prop):
function List&lt;T extends { id: string }&gt;({ items, render }: { items: T[]; render: (x: T) =&gt; React.ReactNode }) {
  return &lt;&gt;{items.map(item =&gt; (&lt;div key={item.id}&gt;{render(item)}&lt;/div&gt;))}&lt;/&gt;;
}
</code></pre>

<h3>Anti-pattern 7: hand-rolling utilities that already exist</h3>
<p>Before writing <code>type MyPick&lt;T, K&gt;</code>, <code>MyOmit</code>, <code>MyPartial</code> — use the built-ins (<code>Pick</code>, <code>Omit</code>, <code>Partial</code>, <code>Required</code>, <code>Readonly</code>, <code>Record</code>, <code>NonNullable</code>, <code>ReturnType</code>, <code>Parameters</code>, <code>Awaited</code>).</p>
`
    },
    {
      id: 'interview-patterns',
      title: '🎤 Interview Patterns',
      html: `
<h3>The 10 questions you should rehearse out loud</h3>
<table>
  <thead><tr><th>Question</th><th>One-liner</th></tr></thead>
  <tbody>
    <tr><td><em>Why use generics?</em></td><td>Preserve type info across boundaries instead of falling back to <code>any</code>.</td></tr>
    <tr><td><em>What does <code>extends</code> mean in <code>&lt;T extends X&gt;</code>?</em></td><td>"T must be assignable to X" — a constraint that lets the body use X's properties.</td></tr>
    <tr><td><em>What's <code>keyof T</code>?</em></td><td>The union of T's own property names as literal types.</td></tr>
    <tr><td><em>What's <code>T[K]</code>?</em></td><td>Indexed access — the type of T's property K.</td></tr>
    <tr><td><em>How is inference chosen?</em></td><td>TS unifies the parameter type with the argument type, taking the most general satisfying type if T appears multiple times.</td></tr>
    <tr><td><em>When do you use a default type parameter?</em></td><td>When 90% of callers want one common type but you want to allow override.</td></tr>
    <tr><td><em>What's the difference between a generic and an overload?</em></td><td>Generic = uniform implementation across types. Overload = N distinct shapes. Prefer generics when behavior is uniform.</td></tr>
    <tr><td><em>What's variance and why does it matter?</em></td><td>How a generic type relates to its parameter's subtypes. Determines if <code>F&lt;Cat&gt;</code> can flow into <code>F&lt;Animal&gt;</code>.</td></tr>
    <tr><td><em>What's <code>NoInfer</code>?</em></td><td>(TS 5.4+) Marks a position as non-inference-source so only earlier positions fix T.</td></tr>
    <tr><td><em>When NOT to use generics?</em></td><td>When the type parameter appears only once, or when an overload reads more clearly.</td></tr>
  </tbody>
</table>

<h3>Live-coding warmups</h3>
<ol>
  <li>Implement <code>identity&lt;T&gt;</code>.</li>
  <li>Implement <code>head&lt;T&gt;(xs: T[]): T | undefined</code>.</li>
  <li>Implement <code>get&lt;T, K extends keyof T&gt;(o: T, k: K): T[K]</code>.</li>
  <li>Implement <code>pluck&lt;T, K extends keyof T&gt;(xs: T[], k: K): T[K][]</code>.</li>
  <li>Implement <code>mapValues</code> over an object preserving keys.</li>
  <li>Implement a typed event emitter.</li>
  <li>Implement a generic Result/Either with <code>map</code> and <code>flatMap</code>.</li>
</ol>

<h3>"Spot the bug" warmups</h3>
<ul>
  <li><code>function logIt&lt;T&gt;(x: T): void { console.log(x); }</code> — useless generic.</li>
  <li><code>function getId&lt;T&gt;(x: T) { return x.id; }</code> — missing constraint.</li>
  <li><code>function clone&lt;T extends User&gt;(u: T): User</code> — return type loses subclass.</li>
  <li><code>const id = &lt;T&gt;(x: T) =&gt; x</code> in <code>.tsx</code> — JSX parse conflict; needs trailing comma.</li>
  <li><code>function strict&lt;T&gt;(a: T, b: T)</code> when caller passes incompatible types — TS widens to union; if you want exact, use <code>NoInfer</code>.</li>
</ul>

<h3>"Two-minute design" prompts</h3>
<ul>
  <li><em>"Type-safe <code>Object.keys</code>."</em>
    <pre><code class="language-ts">function keysOf&lt;T extends object&gt;(o: T): (keyof T)[] {
  return Object.keys(o) as (keyof T)[];
}</code></pre>
  </li>
  <li><em>"Generic React state hook with reducer."</em>
    <pre><code class="language-ts">function useReducer&lt;S, A&gt;(reducer: (s: S, a: A) =&gt; S, initial: S) { /*...*/ }</code></pre>
  </li>
  <li><em>"Function that takes a list of routes and returns a typed router."</em>
    <pre><code class="language-ts">function makeRouter&lt;R extends Record&lt;string, unknown&gt;&gt;(routes: R) {
  return { go: &lt;K extends keyof R&gt;(k: K, p: R[K]) =&gt; { /*...*/ } };
}</code></pre>
  </li>
</ul>

<h3>What FAANG interviewers grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Constraint discipline</td><td>You ask "what does T need to be at minimum?" and constrain to exactly that.</td></tr>
    <tr><td>Inference preference</td><td>You let TS infer; you don't pass explicit type args unless inference fails.</td></tr>
    <tr><td>Two-place rule</td><td>You don't add a type parameter that appears once.</td></tr>
    <tr><td><code>keyof</code> + <code>T[K]</code> fluency</td><td>Comes up in every property-access utility.</td></tr>
    <tr><td>Variance awareness</td><td>You know read positions are covariant, write positions contravariant.</td></tr>
    <tr><td>Distinguishing generics from <code>any</code></td><td>You can articulate the structural difference and show it via composition.</td></tr>
    <tr><td>Generic React</td><td>You know the JSX-arrow trick and constrain components to <code>{ id: string }</code> when iterating.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li><strong>Navigation:</strong> <code>RootStackParamList</code> + <code>NativeStackScreenProps&lt;ParamList, "Detail"&gt;</code> — generic helpers from react-navigation.</li>
  <li><strong>FlatList&lt;Item&gt;:</strong> the <code>FlatList</code> component itself is generic in its item type — you usually let inference handle it from <code>data</code>.</li>
  <li><strong>React Query:</strong> <code>useQuery&lt;T, E, S&gt;</code> — generic over response type, error type, and selected slice.</li>
  <li><strong>Reanimated:</strong> <code>SharedValue&lt;T&gt;</code> — generic shared value used in worklets.</li>
  <li><strong>Native module specs (TurboModules):</strong> the codegen consumes a TS spec and emits typed bindings.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd add a <code>NoInfer</code> wrapper on the second parameter so T is fixed by the first."</li>
  <li>"I'd express the variance with <code>in</code>/<code>out</code> annotations to make assignability explicit."</li>
  <li>"I'd extract a domain-specific constraint type (<code>HasId</code>, <code>Comparable</code>) instead of inlining the shape."</li>
  <li>"I'd publish this as a workspace package so consumers across the monorepo share the contract."</li>
</ul>

<h3>One-liner answers to common follow-ups</h3>
<ul>
  <li><em>"Why doesn't <code>function clone&lt;T extends User&gt;(u: T): User</code> return AdminUser when given an admin?"</em> — Because the return type is widened to <code>User</code>; preserve T by returning <code>T</code>.</li>
  <li><em>"Why does inference fail when T only appears in a callback?"</em> — Because the call site doesn't supply something that pins T; add a positional parameter that does, or take T explicitly.</li>
  <li><em>"Why does <code>Wrap&lt;A | B&gt;</code> distribute?"</em> — Naked type parameters in the check position of a conditional type distribute across union members. Wrap in a tuple to suppress.</li>
  <li><em>"Why is my generic React component complaining about the key prop?"</em> — Because the constraint doesn't guarantee an id; either constrain to <code>{ id: string }</code> or pass a <code>getKey</code> prop.</li>
</ul>
`
    }
  ]
});
