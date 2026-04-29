window.PREP_SITE.registerTopic({
  id: 'ts-advanced',
  module: 'typescript',
  title: 'Advanced Tricks',
  estimatedReadTime: '50 min',
  tags: ['typescript', 'advanced', 'variance', 'higher-kinded', 'recursive-types', 'compiler-api', 'type-level-programming', 'performance'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>This is the upper crust of TypeScript: the type-level features you reach for when normal techniques run out. Most product code never needs these. Library authors, framework builders, and people writing the type-level glue under tools like <code>zod</code>, <code>tRPC</code>, <code>react-router</code>, and <code>react-query</code> live here.</p>
<ul>
  <li><strong>Variance annotations</strong> (<code>in</code>, <code>out</code>) — control whether a generic is co-/contra-/in-variant.</li>
  <li><strong>Recursive types &amp; tail-recursive conditional types</strong> — string parsing, object paths, deep transforms, all type-level.</li>
  <li><strong>Higher-kinded type encodings</strong> — TS doesn't have HKTs natively, but you can simulate them.</li>
  <li><strong>Type-level state machines</strong> — phantom types track which methods are legal at compile time.</li>
  <li><strong>Compiler API &amp; transformers</strong> — programmatic codegen, custom lints, and type-aware refactors.</li>
  <li><strong>Decorators</strong> — TS 5+ aligned with the TC39 stage-3 spec; useful for class metadata, validation, DI.</li>
  <li><strong>Performance:</strong> deep recursive types, huge unions, and conditional explosions are real costs — diagnose with <code>--extendedDiagnostics</code>, <code>--generateTrace</code>, and the type-tree viewer.</li>
  <li><strong>The unsoundness map:</strong> there are five well-known intentional holes in TS's soundness — know them so you can avoid relying on them.</li>
</ul>
<p><strong>Mantra:</strong> "Power and cost. Use these tools when the API surface justifies them. Otherwise prefer ordinary patterns."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What "advanced" means in TypeScript</h3>
<p>Advanced TS is type-level <em>computation</em>. Mapped, conditional, template literal, and recursive types form a Turing-complete sublanguage. You can implement a JSON parser, route extractor, SQL builder, or state machine that lives entirely in the type system. The output: better autocompletion, fewer runtime checks, and stronger contracts at module boundaries.</p>

<h3>Why ever go this deep?</h3>
<table>
  <thead><tr><th>Use case</th><th>Why advanced TS pays off</th></tr></thead>
  <tbody>
    <tr><td>Library API design</td><td>You author the type once; thousands of consumers benefit silently. <code>tRPC</code>, <code>zod</code>, <code>react-router</code>, <code>react-query</code> are powered by deep type-level work.</td></tr>
    <tr><td>Type-safe DSLs</td><td>SQL, GraphQL, validators — embed the language in TS, get IDE autocomplete and compile-time safety for free.</td></tr>
    <tr><td>Frameworks</td><td>RN navigation, form libraries, animation systems — typed APIs that scale beyond what runtime checks can validate.</td></tr>
    <tr><td>Migration tools</td><td>Compiler API + transformers let you write codemods that understand types, not just text.</td></tr>
    <tr><td>Internal correctness</td><td>State machines, branded types, exhaustiveness — once you've prevented a class of bugs at the type level, that class is just gone.</td></tr>
  </tbody>
</table>

<h3>And why NOT to go deep</h3>
<ul>
  <li><strong>Slow IDE.</strong> Deep recursion, huge unions, and template-literal cartesian products tank autocomplete and tsserver.</li>
  <li><strong>Cryptic errors.</strong> A 5-deep conditional type with three <code>infer</code>s emits a tooltip nobody can read. Consumers blame you.</li>
  <li><strong>Maintenance debt.</strong> Type-level code lacks tests in the conventional sense. It rots silently.</li>
  <li><strong>You probably don't need it.</strong> If three engineers can solve the problem with a discriminated union, that's the answer.</li>
</ul>

<h3>The two skills you actually need</h3>
<ol>
  <li><strong>Recognize when to reach for the advanced tool.</strong> Most of the time you won't.</li>
  <li><strong>Read advanced types fluently.</strong> Even if you don't write them, you'll consume APIs whose tooltips display 10-line conditional types. Reading is more important than writing.</li>
</ol>

<h3>The five intentional unsoundness holes</h3>
<table>
  <thead><tr><th>Hole</th><th>Why TS allows it</th></tr></thead>
  <tbody>
    <tr><td>Function parameter bivariance (in method positions, before <code>strictFunctionTypes</code>)</td><td>Ergonomics with React event handlers, EventEmitter callbacks.</td></tr>
    <tr><td><code>any</code> assignability</td><td>By design — gradual typing escape hatch.</td></tr>
    <tr><td><code>as</code> assertion</td><td>You're explicitly overriding inference; required for some patterns.</td></tr>
    <tr><td>Excess property check elision when source is a variable</td><td>Most "object literal" checks happen only at the literal site.</td></tr>
    <tr><td>Mutable arrays as covariant</td><td>Type-theoretically unsound but ergonomic; rarely bites in practice.</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>"Types as a small functional language"</h3>
<p>Think of TS's type system as a pure, lazy functional language whose values are types. Conditional types are <code>if/else</code>. Mapped types are <code>map</code>. Template literal types are <code>concat</code>. <code>infer</code> is destructuring. Recursion replaces loops. Once you internalize this, every advanced trick maps to a familiar functional idiom.</p>

<h3>The "type budget"</h3>
<p>Every conditional, every mapped, every <code>infer</code>, every template literal expansion costs CPU cycles in tsserver and tsc. There's a literal budget. Symptoms of exceeding it:</p>
<ul>
  <li>Autocomplete delay &gt;200ms.</li>
  <li><code>Type instantiation is excessively deep and possibly infinite</code> errors.</li>
  <li>"Expression produces a union type that is too complex to represent."</li>
  <li>Build times growing linearly with codebase size.</li>
</ul>
<p>You diagnose this via <code>tsc --extendedDiagnostics</code>, <code>tsc --generateTrace ./trace</code>, and the <a href="https://github.com/microsoft/typescript-analyze-trace" target="_blank" rel="noopener">analyze-trace tool</a>.</p>

<h3>Variance, deeply</h3>
<p>Variance describes how a type constructor F behaves under subtyping. Given <code>Cat &lt;: Animal</code>:</p>
<table>
  <thead><tr><th>Variance</th><th>Direction</th><th>Position</th></tr></thead>
  <tbody>
    <tr><td>Covariant</td><td><code>F&lt;Cat&gt; &lt;: F&lt;Animal&gt;</code></td><td>Read positions: <code>readonly T[]</code>, <code>() =&gt; T</code></td></tr>
    <tr><td>Contravariant</td><td><code>F&lt;Animal&gt; &lt;: F&lt;Cat&gt;</code></td><td>Write/argument positions: <code>(x: T) =&gt; void</code></td></tr>
    <tr><td>Invariant</td><td>Neither</td><td>Both read and write: mutable <code>T[]</code></td></tr>
    <tr><td>Bivariant</td><td>Both</td><td>Method parameters before <code>strictFunctionTypes</code></td></tr>
  </tbody>
</table>
<pre><code class="language-ts">interface ReadOnlyBox&lt;out T&gt; { read(): T; }       // covariant
interface WriteOnlyBox&lt;in T&gt; { write(x: T): void; } // contravariant
interface RWBox&lt;in out T&gt; { read(): T; write(x: T): void; } // invariant
</code></pre>

<h3>Higher-kinded types — the workaround</h3>
<p>TS doesn't have first-class HKTs (you can't write <code>F&lt;G&gt;</code> where G is itself a type constructor). The community workaround uses interface-keyed lookups:</p>
<pre><code class="language-ts">// Encode HKTs via a key/registry
interface URI2HKT&lt;A&gt; {
  Array: A[];
  Maybe: A | null;
  Promise: Promise&lt;A&gt;;
}
type URIs = keyof URI2HKT&lt;unknown&gt;;
type Kind&lt;F extends URIs, A&gt; = URI2HKT&lt;A&gt;[F];

type X = Kind&lt;"Array", number&gt;;     // number[]
type Y = Kind&lt;"Promise", string&gt;;   // Promise&lt;string&gt;
</code></pre>
<p>Practical takeaway: <strong>almost never needed in product code.</strong> Libraries like <code>fp-ts</code> use it; most apps don't.</p>

<h3>Recursive types — the depth limit</h3>
<p>Conditional types support recursion. TS 4.5+ optimizes tail-recursive cases (TS detects when a recursive call is the last thing in the conditional and eliminates the stack frame). Non-tail recursion has a hard depth cap (~50). Workarounds: restructure to tail position, or split into two passes.</p>

<h3>The "phantom type" trick</h3>
<p>A type parameter that doesn't appear in any runtime field. Used to track state at the type level without runtime cost.</p>
<pre><code class="language-ts">// Builder phase tracking
class Q&lt;P extends "init" | "ready" = "init"&gt; {
  private _phantom!: P;     // never read; just for type tracking
  ready(this: Q&lt;"init"&gt;): Q&lt;"ready"&gt; { return this as any; }
  fire(this: Q&lt;"ready"&gt;): void { /*...*/ }
}
new Q().ready().fire();   // ✅
new Q().fire();            // ❌
</code></pre>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Variance annotations (TS 4.7+)</h3>
<pre><code class="language-ts">interface Producer&lt;out T&gt; { make(): T; }
interface Consumer&lt;in T&gt; { take(x: T): void; }
interface Channel&lt;in out T&gt; { send(x: T): void; recv(): T; }

class Animal {}
class Dog extends Animal {}

const dp: Producer&lt;Dog&gt; = { make: () =&gt; new Dog() };
const ap: Producer&lt;Animal&gt; = dp;     // ✅ — Dog producer IS an Animal producer
const dp2: Producer&lt;Dog&gt; = ap;        // ❌ — Animal producer is not a Dog producer

const ac: Consumer&lt;Animal&gt; = { take: (a) =&gt; {} };
const dc: Consumer&lt;Dog&gt; = ac;         // ✅ — anything that takes Animals takes Dogs
const ac2: Consumer&lt;Animal&gt; = dc;     // ❌ — Dog consumer doesn't accept arbitrary animals
</code></pre>

<h3>Recursive conditional types — tail-recursive form</h3>
<pre><code class="language-ts">// Bad — non-tail recursion, depth-limited
type Reverse&lt;T extends readonly any[]&gt; =
  T extends readonly [infer H, ...infer R] ? [...Reverse&lt;R&gt;, H] : [];

// Better — tail-recursive accumulator (TS 4.5+ unrolls efficiently)
type ReverseTR&lt;T extends readonly any[], Acc extends readonly any[] = []&gt; =
  T extends readonly [infer H, ...infer R] ? ReverseTR&lt;R, [H, ...Acc]&gt; : Acc;

type R = ReverseTR&lt;[1, 2, 3, 4, 5]&gt;;   // [5, 4, 3, 2, 1]
</code></pre>

<h3>Type-level arithmetic (the cute, mostly-useless trick)</h3>
<pre><code class="language-ts">// Build a tuple of length N
type Tuple&lt;N extends number, A extends unknown[] = []&gt; =
  A["length"] extends N ? A : Tuple&lt;N, [unknown, ...A]&gt;;

// Add: concat tuples
type Add&lt;A extends number, B extends number&gt; =
  [...Tuple&lt;A&gt;, ...Tuple&lt;B&gt;]["length"] &amp; number;

type Five = Add&lt;2, 3&gt;;     // 5
</code></pre>
<p>Cap'd at ~999 because TS limits tuple length. Useful for nothing in production. Useful in interview banter.</p>

<h3>Object path types (deep keys + deep values)</h3>
<pre><code class="language-ts">type DeepKey&lt;T, P extends string = ""&gt; =
  T extends object
    ? { [K in keyof T &amp; (string | number)]:
          T[K] extends object
            ? DeepKey&lt;T[K], \`\${P}\${P extends "" ? "" : "."}\${K}\`&gt;
              | (P extends "" ? \`\${K}\` : \`\${P}.\${K}\`)
            : (P extends "" ? \`\${K}\` : \`\${P}.\${K}\`)
      }[keyof T &amp; (string | number)]
    : never;

type DeepValue&lt;T, P extends string&gt; =
  P extends \`\${infer Head}.\${infer Tail}\`
    ? Head extends keyof T ? DeepValue&lt;T[Head], Tail&gt; : never
    : P extends keyof T ? T[P] : never;

type Cfg = { db: { host: string; port: number }; ui: { theme: "light" | "dark" } };

function getDeep&lt;T, P extends DeepKey&lt;T&gt;&gt;(o: T, p: P): DeepValue&lt;T, P &amp; string&gt; {
  return p.split(".").reduce&lt;any&gt;((a, k) =&gt; a?.[k], o);
}

const v1 = getDeep({ db: { host: "x", port: 1 }, ui: { theme: "dark" as const } }, "db.host");   // string
const v2 = getDeep({ db: { host: "x", port: 1 }, ui: { theme: "dark" as const } }, "ui.theme");  // "dark"
</code></pre>

<h3>String parsing at the type level</h3>
<pre><code class="language-ts">// Parse a CSS-like duration: "300ms", "1.5s"
type ParseDuration&lt;S extends string&gt; =
  S extends \`\${infer N extends number}ms\` ? { value: N; unit: "ms" }
  : S extends \`\${infer N extends number}s\` ? { value: N; unit: "s" }
  : never;

type A = ParseDuration&lt;"300ms"&gt;;   // { value: 300; unit: "ms" }
type B = ParseDuration&lt;"1.5s"&gt;;    // { value: 1.5; unit: "s" }
type C = ParseDuration&lt;"oops"&gt;;    // never
</code></pre>
<p>The <code>infer N extends number</code> form (TS 4.8+) coerces an inferred substring to a numeric literal type when possible.</p>

<h3>Compiler API — programmatic type inspection</h3>
<pre><code class="language-ts">// scripts/find-any.ts — flag every 'any' annotation in a project
import * as ts from "typescript";

const program = ts.createProgram(["src/index.ts"], { strict: true });
for (const sf of program.getSourceFiles()) {
  if (sf.isDeclarationFile) continue;
  ts.forEachChild(sf, function visit(node) {
    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart());
      console.log(\`\${sf.fileName}:\${line + 1}:\${character + 1}\`);
    }
    ts.forEachChild(node, visit);
  });
}
</code></pre>
<p>The compiler API powers ESLint TS rules, the LSP, codemods (jscodeshift, ts-morph), and bundlers' type-aware passes.</p>

<h3>Custom transformers</h3>
<pre><code class="language-ts">// Conceptual: a transformer that strips all console.log calls
import * as ts from "typescript";

const stripConsoleLog: ts.TransformerFactory&lt;ts.SourceFile&gt; = (ctx) =&gt; (sf) =&gt; {
  function visit(node: ts.Node): ts.Node | undefined {
    if (
      ts.isCallExpression(node) &amp;&amp;
      ts.isPropertyAccessExpression(node.expression) &amp;&amp;
      node.expression.expression.getText() === "console" &amp;&amp;
      node.expression.name.text === "log"
    ) return undefined; // delete it
    return ts.visitEachChild(node, visit, ctx);
  }
  return ts.visitNode(sf, visit) as ts.SourceFile;
};
</code></pre>

<h3>Decorators (TS 5+, Stage 3)</h3>
<pre><code class="language-ts">function logged&lt;T extends (...a: any[]) =&gt; any&gt;(orig: T, ctx: ClassMethodDecoratorContext): T {
  return function (this: any, ...args: any[]) {
    console.log(\`[\${String(ctx.name)}]\`, args);
    return orig.apply(this, args);
  } as T;
}

class S {
  @logged
  greet(name: string) { return \`Hi \${name}\`; }
}
</code></pre>
<p>Note: TS legacy decorators (with <code>experimentalDecorators</code>) are still around because Angular and TypeORM rely on them. New code should target the stage-3 form.</p>

<h3>Phantom types for compile-time state machines</h3>
<pre><code class="language-ts">type State = "open" | "closed";

class File&lt;S extends State = "closed"&gt; {
  declare private _phantom: S;
  open(this: File&lt;"closed"&gt;): File&lt;"open"&gt; { return this as any; }
  read(this: File&lt;"open"&gt;): string { return ""; }
  close(this: File&lt;"open"&gt;): File&lt;"closed"&gt; { return this as any; }
}

const f = new File();
const fo = f.open();         // File&lt;"open"&gt;
const data = fo.read();       // ✅
const fc = fo.close();        // File&lt;"closed"&gt;
fc.read();                    // ❌ — closed file
</code></pre>

<h3>Brand erosion vs preservation</h3>
<pre><code class="language-ts">// Brand survives intersection
type SafeHTML = string &amp; { __brand: "SafeHTML" };
type DataAttr = string &amp; { __brand: "DataAttr" };

function html(strings: TemplateStringsArray, ...values: SafeHTML[]): SafeHTML {
  return strings.reduce((acc, s, i) =&gt; acc + s + (values[i] ?? ""), "") as SafeHTML;
}
</code></pre>

<h3>Performance — diagnose slow types</h3>
<pre><code class="language-bash">tsc --extendedDiagnostics                        # cumulative type-checking time
tsc --generateTrace ./trace                      # per-symbol traces
npx @typescript/analyze-trace ./trace            # inspect &amp; rank slow types
</code></pre>
<p>Common offenders: huge string-literal cartesian products, recursive types without tail calls, deeply-nested mapped types over wide unions.</p>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Type-safe SQL-like builder (compile-time joins)</h3>
<pre><code class="language-ts">type Schema = {
  users: { id: string; name: string };
  orders: { id: string; userId: string; total: number };
};

type TableOf&lt;S, T extends keyof S&gt; = S[T];

class Q&lt;S, T extends keyof S = never, Cols extends keyof TableOf&lt;S, T&gt; = never&gt; {
  private state: any = {};

  from&lt;T2 extends keyof S&gt;(table: T2): Q&lt;S, T2&gt; {
    return Object.assign(new Q(), { state: { ...this.state, table } });
  }
  select&lt;C extends keyof TableOf&lt;S, T&gt;&gt;(...cols: C[]): Q&lt;S, T, C&gt; {
    return Object.assign(new Q(), { state: { ...this.state, cols } });
  }
  async run(this: Q&lt;S, T, Cols&gt;): Promise&lt;Pick&lt;TableOf&lt;S, T&gt;, Cols&gt;[]&gt; {
    return [] as any;
  }
}

const rows = await new Q&lt;Schema&gt;().from("users").select("id", "name").run();
//    ^ Pick&lt;User, "id" | "name"&gt;[]
</code></pre>

<h3>Example 2: Phantom builder for required fields</h3>
<pre><code class="language-ts">type Required&lt;T, K extends keyof T&gt; = T &amp; { [P in K]-?: T[P] };

class UserBuilder&lt;Built = {}&gt; {
  private data = {} as any;
  name(v: string): UserBuilder&lt;Built &amp; { name: string }&gt; { this.data.name = v; return this as any; }
  age(v: number): UserBuilder&lt;Built &amp; { age: number }&gt; { this.data.age = v; return this as any; }
  build(this: UserBuilder&lt;{ name: string }&gt;): { name: string; age?: number } { return this.data; }
}

new UserBuilder().name("a").build();              // ✅
new UserBuilder().age(30).build();                // ❌ — name missing
new UserBuilder().name("a").age(30).build();      // ✅
</code></pre>

<h3>Example 3: Recursive deep readonly + writable inverses</h3>
<pre><code class="language-ts">type DeepReadonly&lt;T&gt; = T extends Function ? T :
  T extends Array&lt;infer U&gt; ? readonly DeepReadonly&lt;U&gt;[] :
  T extends object ? { readonly [K in keyof T]: DeepReadonly&lt;T[K]&gt; } : T;

type DeepWritable&lt;T&gt; = T extends Function ? T :
  T extends ReadonlyArray&lt;infer U&gt; ? DeepWritable&lt;U&gt;[] :
  T extends object ? { -readonly [K in keyof T]: DeepWritable&lt;T[K]&gt; } : T;

type X = DeepReadonly&lt;{ a: { b: number[] } }&gt;;     // { readonly a: { readonly b: readonly number[] } }
type Y = DeepWritable&lt;X&gt;;                           // { a: { b: number[] } }
</code></pre>

<h3>Example 4: Type-safe URL parser</h3>
<pre><code class="language-ts">type Split&lt;S extends string, D extends string&gt; =
  S extends \`\${infer H}\${D}\${infer T}\` ? [H, ...Split&lt;T, D&gt;] : [S];

type ExtractParams&lt;P extends string&gt; =
  Split&lt;P, "/"&gt;[number] extends infer Seg
    ? Seg extends \`:\${infer Name}\` ? Name : never
    : never;

type RouteParams&lt;P extends string&gt; = { [K in ExtractParams&lt;P&gt;]: string };

function navigate&lt;P extends string&gt;(path: P, params: RouteParams&lt;P&gt;) { /*...*/ }

navigate("/users/:id/posts/:postId", { id: "u1", postId: "p1" });   // ✅
navigate("/users/:id", {});                                          // ❌ — id missing
</code></pre>

<h3>Example 5: Higher-kinded encoding (Functor)</h3>
<pre><code class="language-ts">interface URI2HKT&lt;A&gt; {
  Array: A[];
  Maybe: A | null;
  Promise: Promise&lt;A&gt;;
}
type URIS = keyof URI2HKT&lt;unknown&gt;;
type Kind&lt;F extends URIS, A&gt; = URI2HKT&lt;A&gt;[F];

interface Functor&lt;F extends URIS&gt; {
  map: &lt;A, B&gt;(fa: Kind&lt;F, A&gt;, fn: (a: A) =&gt; B) =&gt; Kind&lt;F, B&gt;;
}

const arrayFunctor: Functor&lt;"Array"&gt; = {
  map: (fa, fn) =&gt; fa.map(fn),
};
const maybeFunctor: Functor&lt;"Maybe"&gt; = {
  map: (fa, fn) =&gt; fa === null ? null : fn(fa),
};
</code></pre>

<h3>Example 6: Compile-time CSV header parser</h3>
<pre><code class="language-ts">type ParseCSV&lt;S extends string, Acc extends string[] = []&gt; =
  S extends \`\${infer Head},\${infer Rest}\` ? ParseCSV&lt;Rest, [...Acc, Head]&gt; :
  S extends \`\${string}\` ? [...Acc, S] : Acc;

type Cols = ParseCSV&lt;"id,name,email,age"&gt;;   // ["id", "name", "email", "age"]
type ColUnion = Cols[number];                 // "id" | "name" | "email" | "age"
</code></pre>

<h3>Example 7: Compile-time JSON to TypeScript</h3>
<pre><code class="language-ts">// Trivially handles primitives; full JSON would be deeper
type JsonOf&lt;T&gt; =
  T extends string ? string :
  T extends number ? number :
  T extends boolean ? boolean :
  T extends null ? null :
  T extends Array&lt;infer U&gt; ? JsonOf&lt;U&gt;[] :
  T extends object ? { [K in keyof T]: JsonOf&lt;T[K]&gt; } :
  never;

// Convert a literal-typed const to its JSON-shaped type
const x = { id: "1" as const, age: 30, tags: ["a", "b"] as const };
type JX = JsonOf&lt;typeof x&gt;;   // { id: "1"; age: number; tags: ("a" | "b")[] }
</code></pre>

<h3>Example 8: Decorator for runtime field validation (Stage 3)</h3>
<pre><code class="language-ts">function nonEmpty&lt;This, V&gt;(_: ClassAccessorDecoratorTarget&lt;This, V&gt;, ctx: ClassAccessorDecoratorContext&lt;This, V&gt;): ClassAccessorDecoratorResult&lt;This, V&gt; {
  return {
    set(value: V) {
      if (typeof value !== "string" || value.length === 0) {
        throw new Error(\`\${String(ctx.name)} must be non-empty\`);
      }
      (this as any)[\`__\${String(ctx.name)}\`] = value;
    },
    get() {
      return (this as any)[\`__\${String(ctx.name)}\`];
    },
  };
}

class User {
  @nonEmpty accessor name = "anon";
}

const u = new User();
u.name = "";   // throws at runtime
</code></pre>

<h3>Example 9: Phantom type for unit safety</h3>
<pre><code class="language-ts">type Unit = "px" | "ms" | "kg" | "m";
type Quantity&lt;U extends Unit&gt; = number &amp; { __unit: U };

const px = (n: number): Quantity&lt;"px"&gt; =&gt; n as Quantity&lt;"px"&gt;;
const ms = (n: number): Quantity&lt;"ms"&gt; =&gt; n as Quantity&lt;"ms"&gt;;

function setMargin(left: Quantity&lt;"px"&gt;) {/*...*/}

setMargin(px(16));        // ✅
setMargin(ms(300));       // ❌
setMargin(16);            // ❌ — must brand
</code></pre>

<h3>Example 10: Compiler API — emit a metrics file</h3>
<pre><code class="language-ts">// scripts/typecheck-metrics.ts
import * as ts from "typescript";

const config = ts.parseJsonConfigFileContent(
  ts.readConfigFile("tsconfig.json", ts.sys.readFile).config,
  ts.sys, "."
);

const program = ts.createProgram(config.fileNames, config.options);
const diags = ts.getPreEmitDiagnostics(program);

const errorCount = diags.filter(d =&gt; d.category === ts.DiagnosticCategory.Error).length;
const fileCount = program.getSourceFiles().filter(sf =&gt; !sf.isDeclarationFile).length;

ts.sys.writeFile("metrics.json", JSON.stringify({ errorCount, fileCount }, null, 2));
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Recursion depth limit</h3>
<p>TS hard-caps non-tail-recursive instantiation at depth ~50. Symptom: <code>Type instantiation is excessively deep and possibly infinite.</code> Fix:</p>
<ul>
  <li>Restructure to tail-recursive form (accumulator parameter).</li>
  <li>Cap the recursion explicitly with a counter type parameter.</li>
  <li>Split into shorter passes, exposing intermediate aliases.</li>
</ul>

<h3>Union type complexity limit</h3>
<p>TS rejects unions exceeding ~100,000 members. Template literal cartesian products (e.g., <code>\`\${A}-\${B}-\${C}\`</code> with three 50-member unions = 125,000) blow this limit.</p>

<h3>Variance annotations don't auto-detect — they assert</h3>
<pre><code class="language-ts">interface Wrong&lt;in T&gt; { read(): T; }   // ❌ — T is in a covariant position, not contravariant
// TS errors at definition time when usage contradicts the annotation.
</code></pre>

<h3>HKT encodings break under naming changes</h3>
<p>Adding/removing keys to your <code>URI2HKT</code> registry forces every HKT consumer to update. There's no escape — TS's lookup is structural by interface, not first-class.</p>

<h3>Tail-recursion isn't always recognized</h3>
<p>TS's tail-call optimization for conditional types is heuristic. Patterns that <em>look</em> tail-recursive can still hit the depth limit if the matcher introduces an intermediate inferred type that isn't position-substitutable. Workaround: feed the recursive call only the same type parameter shape (avoid wrapping/unwrapping).</p>

<h3>Phantom types and serialization</h3>
<p>Phantom types vanish through JSON: <code>JSON.parse(JSON.stringify(qty))</code> returns a plain number. Re-brand at the deserialization boundary.</p>

<h3>Decorators — Stage 3 vs legacy</h3>
<p>If your project still has Angular, Nest, or TypeORM decorators (<code>@Component</code>, <code>@Entity</code>), you're on legacy decorators (<code>experimentalDecorators</code>). The two specs aren't compatible — choose one per project.</p>

<h3>Compiler API version drift</h3>
<p>The TS compiler API exposes types like <code>ts.SyntaxKind</code> with numeric values that change between versions. Pin <code>typescript</code> exactly when authoring transformers; don't rely on cross-version stability.</p>

<h3>Conditional types over functions infer only the last overload</h3>
<pre><code class="language-ts">interface F {
  (x: string): number;
  (x: number): boolean;
}
type R = ReturnType&lt;F&gt;;   // boolean — last overload only
</code></pre>
<p>Long-standing limitation. Workaround: write a type-level dispatcher that probes each overload by hand.</p>

<h3>Distribution interacts with phantom types</h3>
<pre><code class="language-ts">type Brand&lt;T, B&gt; = T &amp; { __brand: B };
type Wrap&lt;T&gt; = T extends string ? Brand&lt;T, "S"&gt; : never;
type X = Wrap&lt;"a" | "b"&gt;;   // Brand&lt;"a", "S"&gt; | Brand&lt;"b", "S"&gt;   — distributed
</code></pre>

<h3>Compiler trace gotchas</h3>
<p><code>--generateTrace</code> emits multi-megabyte JSON; the analyzer can crash on the largest files. Filter by file or by symbol for usable output.</p>

<h3>The <code>satisfies</code> trap with widening</h3>
<pre><code class="language-ts">const t = { a: 1 } satisfies Record&lt;string, number&gt;;
// reading t.a → 1 (literal preserved)
const u: Record&lt;string, number&gt; = t;
// u.a → number (annotation widened)
</code></pre>

<h3>Generic constraint cycles</h3>
<pre><code class="language-ts">// Self-referential constraint — sometimes TS gives up
interface Comp&lt;T extends Comp&lt;T&gt;&gt; {
  cmp(other: T): number;
}
class N implements Comp&lt;N&gt; { cmp(o: N) { return 0; } }
// Works, but more complex variants cause "Type 'X' is not assignable to type 'Comp&lt;X&gt;'."
</code></pre>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: variance annotation contradicts the type body</h3>
<pre><code class="language-ts">interface X&lt;in T&gt; { make(): T; }   // ❌ — make returns T, that's covariant, not contravariant
</code></pre>

<h3>Bug 2: non-tail recursion hitting the limit</h3>
<pre><code class="language-ts">// Bad — the recursive call is wrapped, not tail position
type Reverse&lt;T extends any[]&gt; =
  T extends [infer H, ...infer R] ? [...Reverse&lt;R&gt;, H] : [];
// At about 30 elements, TS errors out.
</code></pre>

<h3>Bug 3: HKT encoding leaks unrelated keys</h3>
<pre><code class="language-ts">// If consumers add their own URI2HKT entries via declaration merging,
// your generic Functor accidentally accepts unforeseen kinds.
declare module "your-lib" {
  interface URI2HKT&lt;A&gt; {
    "RogueKind": A;
  }
}
</code></pre>

<h3>Bug 4: phantom type erased by inference</h3>
<pre><code class="language-ts">type Tagged&lt;T&gt; = string &amp; { __brand: T };
function id&lt;T extends string&gt;(s: T): T { return s; }

const u = "u_1" as Tagged&lt;"User"&gt;;
const x = id(u);   // T = Tagged&lt;"User"&gt; — but if the function is more complex, the brand may erode
</code></pre>

<h3>Bug 5: decorator misuse losing 'this' type</h3>
<pre><code class="language-ts">function bad(orig: any) { return orig; }     // 'any' deletes typing for the wrapped method
function good&lt;T extends (...a: any[]) =&gt; any&gt;(orig: T, ctx: ClassMethodDecoratorContext): T { return orig; }
</code></pre>

<h3>Bug 6: compiler trace omitting hot paths</h3>
<p>Trace files miss code that's not directly imported into the entry. To diagnose tsserver slowness specifically, enable <code>tsserver --traceDir</code> and reproduce in your editor — different trace from <code>tsc --generateTrace</code>.</p>

<h3>Bug 7: type-level "loop" without termination</h3>
<pre><code class="language-ts">type Forever&lt;T&gt; = Forever&lt;T&gt;;   // ❌ — TS errors immediately
type Bounded&lt;T, D extends number = 0&gt; = D extends 5 ? T : Bounded&lt;T, [D, unknown]["length"] &amp; number&gt;;
</code></pre>

<h3>Bug 8: generic component with no narrowing in render</h3>
<pre><code class="language-tsx">function List&lt;T&gt;({ items }: { items: T[] }) {
  // T isn't narrowed; we can't read fields of items
  return &lt;&gt;{items.map(i =&gt; (i as any).name)}&lt;/&gt;;   // unsafe
}
// Constrain or accept a render fn from the caller.
</code></pre>

<h3>Bug 9: emitted .d.ts using internal types</h3>
<pre><code class="language-ts">// In your library:
type _InternalShape = { /*...*/ };
export function api(): _InternalShape { /*...*/ }
// Emitted .d.ts now references _InternalShape — consumers see a private name.
// Either export the type or inline its shape in the API surface.
</code></pre>

<h3>Bug 10: type-level numeric overflow</h3>
<pre><code class="language-ts">type N&lt;T extends any[], A extends any[] = []&gt; =
  A["length"] extends 1000 ? A : N&lt;T, [...A, unknown]&gt;;
// At runtime, fast. At compile time, instantiation depth explodes around ~999.
</code></pre>

<h3>Anti-pattern 1: type-level programming for its own sake</h3>
<p>Building a 30-line <code>Path&lt;T&gt;</code> generic when an opaque <code>string</code> would do. Cleverness costs IDE perf and onboarding.</p>

<h3>Anti-pattern 2: HKT encodings in app code</h3>
<p>If you're not building a library and your team isn't fluent in <code>fp-ts</code>, don't bring HKTs in. The cognitive cost dwarfs the benefit.</p>

<h3>Anti-pattern 3: phantom types where runtime checks would work</h3>
<p>Phantom-typed units sound elegant — but if you do <em>any</em> arithmetic, the type fades. A runtime-typed value object is more forgiving.</p>

<h3>Anti-pattern 4: extreme conditional chains in a library's public type</h3>
<p>Tooltips become unreadable. Wrap the result in a named alias and export the alias.</p>

<h3>Anti-pattern 5: recursive type that re-derives on every render</h3>
<p>If a generic prop is parameterized by a deep recursive type, every consumer pays the type-checking cost. Profile with <code>--generateTrace</code>; consider freezing the type at the boundary.</p>

<h3>Anti-pattern 6: compiler API as a hammer</h3>
<p>Many tasks (codemods over text, AST manipulation) have lighter alternatives — <code>jscodeshift</code>, <code>ts-morph</code>, <code>babel-plugin</code>. Reach for the lowest-power tool that solves it.</p>

<h3>Anti-pattern 7: relying on intentional unsoundness</h3>
<p>"It works because of array covariance" — for now. TS may tighten the rules; your code rests on a known hole.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '🎤 Interview Patterns',
      html: `
<h3>The 12 advanced questions worth being ready for</h3>
<table>
  <thead><tr><th>Question</th><th>One-liner</th></tr></thead>
  <tbody>
    <tr><td><em>What is variance?</em></td><td>How a generic type relates to its parameter's subtypes — covariant (read), contravariant (write), invariant (both), bivariant (unsound).</td></tr>
    <tr><td><em>What's a higher-kinded type?</em></td><td>A type constructor parameterized by another type constructor. TS doesn't have native HKTs; we encode them with key-based interface lookups.</td></tr>
    <tr><td><em>What does <code>infer X extends Y</code> do?</em></td><td>(TS 4.8+) constrains <code>infer</code> to coerce the matched type to <code>Y</code> when valid — most useful for <code>infer N extends number</code>.</td></tr>
    <tr><td><em>How do you make a recursive type tail-recursive?</em></td><td>Move the recursive call to terminal position with an accumulator parameter so TS unrolls without growing depth.</td></tr>
    <tr><td><em>How do you implement compile-time route param extraction?</em></td><td>Template literal type that recursively splits on <code>:</code> and <code>/</code>.</td></tr>
    <tr><td><em>What's a phantom type?</em></td><td>A type parameter that doesn't appear in any runtime field; used to track state at the type level.</td></tr>
    <tr><td><em>What's the difference between Stage-3 and legacy decorators?</em></td><td>Stage 3 ships in TS 5+ and aligns with the JS spec. Legacy is enabled by <code>experimentalDecorators</code> for Angular/TypeORM/Nest.</td></tr>
    <tr><td><em>How do you diagnose slow type-checking?</em></td><td><code>--extendedDiagnostics</code> for cumulative time; <code>--generateTrace</code> + <code>analyze-trace</code> for per-symbol cost.</td></tr>
    <tr><td><em>Why does <code>ReturnType</code> only see the last overload?</em></td><td>TS's overload resolution for inference picks the last signature — a long-standing limitation.</td></tr>
    <tr><td><em>What's the compiler API for?</em></td><td>Programmatic AST inspection, type-aware lints, codemods, custom transformers.</td></tr>
    <tr><td><em>What are the soundness holes in TS?</em></td><td>Function bivariance (pre-strict), <code>any</code> assignability, <code>as</code> assertions, fresh-only excess property checks, mutable-array covariance.</td></tr>
    <tr><td><em>When should you NOT reach for advanced TS?</em></td><td>App code with predictable shapes, junior-heavy teams, hot paths in tsserver, or anywhere the gain is &lt;10% over plain patterns.</td></tr>
  </tbody>
</table>

<h3>"Two-minute" type-level challenges interviewers love</h3>
<ol>
  <li><em>"Implement <code>Reverse</code> on a tuple."</em> — show tail-recursive form.</li>
  <li><em>"Type a builder where <code>build()</code> requires <code>name()</code> was called first."</em> — phantom intersection.</li>
  <li><em>"Type a function that extracts <code>:foo</code> params from a route string."</em> — template literal + <code>infer</code>.</li>
  <li><em>"Type-safe <code>Object.entries</code>."</em> — mapped + indexed access.</li>
  <li><em>"Brand UserId so it can't be passed to functions taking OrderId."</em> — intersection brand.</li>
  <li><em>"Implement <code>DeepReadonly&lt;T&gt;</code>."</em> — recursive mapped over object/array.</li>
  <li><em>"Implement <code>Awaited&lt;T&gt;</code> from scratch."</em> — recursive conditional + <code>infer</code>.</li>
</ol>

<h3>Live "spot the issue" classics</h3>
<ul>
  <li>A library type whose tooltip is 12 lines of conditional types — propose a named alias.</li>
  <li>A recursive type that compiles fine on a small example but fails on production data — non-tail recursion; rewrite with accumulator.</li>
  <li>A generic that "loses its brand" through a chain of utility transforms — suggest preserving the intersection through each transform.</li>
  <li>A decorator typed with <code>any</code> that erases its target's signature — re-type with <code>&lt;T extends ...&gt;</code> generic + <code>ClassMethodDecoratorContext</code>.</li>
  <li>A workspace whose tsserver hangs on a <code>satisfies</code> over a 10k-key map — propose narrowing the type or splitting the file.</li>
</ul>

<h3>What "staff+" candidates show</h3>
<table>
  <thead><tr><th>Signal</th><th>What's expected</th></tr></thead>
  <tbody>
    <tr><td>Pragmatism</td><td>You explicitly choose plain patterns when they suffice; you don't reach for advanced types reflexively.</td></tr>
    <tr><td>Diagnostic skill</td><td>You can recognize and explain a "type instantiation excessively deep" error; you know how to investigate compile-time perf.</td></tr>
    <tr><td>Library awareness</td><td>You know how <code>tRPC</code>, <code>react-router</code>, <code>react-query</code> use template literal types for route safety.</td></tr>
    <tr><td>Compiler API fluency</td><td>You can sketch a transformer or a codemod using ts-morph or the raw compiler API.</td></tr>
    <tr><td>Variance awareness</td><td>You can articulate when to use <code>in</code>/<code>out</code> annotations and when they constrain rather than help.</td></tr>
    <tr><td>Soundness understanding</td><td>You can name the intentional unsoundness holes; you don't rely on them in load-bearing code.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li><strong>React Navigation v6+</strong> uses declaration merging on <code>RootParamList</code> — a phantom-style global registry.</li>
  <li><strong>Reanimated</strong> exposes <code>SharedValue&lt;T&gt;</code> with worklet annotations; the type system enforces what crosses the JS/UI thread boundary.</li>
  <li><strong>Expo Router</strong> generates types for routes using template literal types over the <code>app/</code> directory.</li>
  <li><strong>TurboModule codegen</strong> consumes a TS spec and emits typed C++ bindings — illustrates the practical payoff of strong types.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd add <code>--generateTrace</code> to CI and fail builds when type-checking exceeds a budget."</li>
  <li>"I'd extract the deepest types into a library boundary so consumer tooltips show a stable named alias."</li>
  <li>"I'd convert legacy decorators incrementally to Stage 3, gated behind a feature flag in the build."</li>
  <li>"I'd write a small ts-morph script to detect any <code>any</code> annotations and report them as a code-health metric."</li>
  <li>"I'd add variance annotations to the most-imported generic interfaces so cross-package assignability stops surprising us."</li>
</ul>

<h3>One-liner answers to interviewer follow-ups</h3>
<ul>
  <li><em>"Why did your route parser fail at 50 routes?"</em> — Non-tail recursion hit the depth cap; refactor to accumulator-style.</li>
  <li><em>"Why doesn't <code>Awaited</code> unwrap your custom thenable?"</em> — Built-in <code>Awaited</code> tests against <code>PromiseLike</code>; if your shape lacks <code>then</code>, add it or write a custom unwrap.</li>
  <li><em>"Why did your <code>satisfies</code> not narrow the call site?"</em> — A subsequent annotation widened the variable; capture the value in a <code>const</code> and reference it directly.</li>
  <li><em>"Why is your variance annotation rejected?"</em> — TS verifies that the body actually exhibits that variance; a contradicting position causes the error.</li>
  <li><em>"Why is the IDE slow in this file?"</em> — Likely a huge cartesian template literal type or an unbounded recursive type; trace and decompose.</li>
</ul>
`
    }
  ]
});
