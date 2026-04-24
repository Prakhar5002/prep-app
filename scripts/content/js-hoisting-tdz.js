window.PREP_SITE.registerTopic({
  id: 'js-hoisting-tdz',
  module: 'JavaScript Deep',
  title: 'Hoisting & TDZ',
  estimatedReadTime: '28 min',
  tags: ['hoisting', 'tdz', 'temporal-dead-zone', 'var', 'let', 'const', 'function-declaration', 'class', 'fundamentals'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p><strong>Hoisting</strong> is the <em>observable side-effect</em> of the Memory / Creation phase of an Execution Context. Before any line runs, the engine scans the current scope and <em>allocates memory for every declaration it finds</em>. Only <em>after</em> that does it execute code line-by-line. "The declaration is hoisted to the top" is a mental model — nothing literally moves; allocation simply happens first.</p>

<ul>
  <li><code>var</code> → hoisted and <strong>initialized to <code>undefined</code></strong>. Reading before assignment gives <code>undefined</code>, not an error.</li>
  <li><code>function</code> declaration → hoisted <strong>fully with its body</strong>. Callable before the source line.</li>
  <li><code>let</code> / <code>const</code> / <code>class</code> → hoisted but <strong>uninitialized</strong>. Reading them before the declaration line throws <code>ReferenceError: Cannot access '...' before initialization</code>. This uninitialized window is the <strong>Temporal Dead Zone (TDZ)</strong>.</li>
  <li><code>import</code> → hoisted at module-link time, before <em>any</em> code runs in the module.</li>
  <li>Function <em>expressions</em> and arrow functions stored in a variable follow the rules of whichever keyword declares the variable — they do <strong>not</strong> hoist the function body.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Hoisting is not magic — it's just "JS allocates first, runs second." <strong>var</strong> gets <code>undefined</code> on allocation, <strong>let/const/class</strong> get a "do-not-touch" marker (TDZ), <strong>function</strong> declarations get the whole body. Everything else follows from those three rules.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What is Hoisting, precisely?</h3>
<p>Hoisting is the term JavaScript developers use to describe the behavior that results from the engine's <strong>two-phase execution</strong> of an Execution Context (EC):</p>
<ol>
  <li><strong>Creation / Memory phase</strong> — the engine walks the source of the current scope and sets up bindings (identifiers) in the appropriate Environment Record. Different declaration forms get different initial states in this phase.</li>
  <li><strong>Execution phase</strong> — the engine runs the source top-to-bottom using those pre-allocated bindings.</li>
</ol>
<p>Nothing is physically moved. The code you wrote is exactly the code that executes. What <em>feels</em> like motion is simply that some identifiers already exist in memory before their source line runs.</p>

<h3>What is the Temporal Dead Zone, precisely?</h3>
<p>The <strong>Temporal Dead Zone (TDZ)</strong> is the interval during execution from the moment a <code>let</code> / <code>const</code> / <code>class</code> binding is created (start of its enclosing block, during the creation phase) until the line that initializes it actually runs. During that interval, the binding exists but is <em>marked uninitialized</em>. Any read <em>or</em> write access — even <code>typeof</code> — throws <code>ReferenceError</code>.</p>

<p>Key insight: the TDZ is a <em>temporal</em> concept, not a <em>lexical</em> one. Whether a line is inside the TDZ depends on whether it executes before or after the declaration line at runtime, not merely where it appears in the source.</p>

<h3>Why does JS do this?</h3>
<ul>
  <li><strong>Mutual recursion of functions.</strong> If function declarations were not hoisted, two top-level functions that reference each other could not be written in any order that compiles without re-ordering by hand. Hoisting eliminates the order problem.</li>
  <li><strong>Late legacy compatibility.</strong> <code>var</code> was designed in 1995 with loose scoping rules. Hoisting it to <code>undefined</code> kept pre-ES3 code running; breaking that would break the web.</li>
  <li><strong>Safer block scope in modern code.</strong> TC39 chose not to hoist <code>let</code>/<code>const</code> to <code>undefined</code> because that would silently mask bugs. Instead they added the TDZ, which <em>turns the bug into a loud error</em> at the exact moment you touch an unready variable.</li>
  <li><strong>Modules need forward references too.</strong> <code>import</code> bindings are hoisted during link-time so that circular imports can resolve their references lazily.</li>
</ul>

<h3>Where does the TDZ actually live?</h3>
<p>Every <code>{ ... }</code> block (including the body of a function, the body of an <code>if</code>/<code>for</code>/<code>switch</code>, a <code>try</code> clause, a <code>for (let i ...)</code> loop, and the arguments of a class) introduces a new <em>lexical environment</em>. When that block is entered:</p>
<ol>
  <li>All <code>let</code>/<code>const</code>/<code>class</code> declarations inside it are registered in the new environment as <em>uninitialized</em>.</li>
  <li>Execution proceeds. As each <code>let x = ...</code> runs, the corresponding binding transitions from <em>uninitialized</em> to <em>initialized</em> with its value.</li>
  <li>Any identifier read that finds the binding but sees it is still uninitialized throws <code>ReferenceError</code>.</li>
</ol>
<p>So TDZ is bounded on one side by the start of the block and on the other side by the declaration's initializer line.</p>

<div class="callout insight">
  <div class="callout-title">Why TDZ exists instead of just "hoist to undefined"</div>
  <p>If <code>let</code> hoisted to <code>undefined</code> like <code>var</code>, then <code>const</code> could never work — what value would it hold before its initializer? The spec makes all three (<code>let</code>, <code>const</code>, <code>class</code>) consistently throw when touched early. This also protects against stale closures capturing half-initialized state.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "Memory phase first" picture</h3>
<p>Imagine the engine running your program in two passes. On the first pass (creation phase) it only writes names into a notebook — sometimes with a value, sometimes just reserving the page. On the second pass (execution phase) it executes instructions, writing values to the pages as it goes.</p>

<div class="diagram">
<pre>
SOURCE                         MEMORY after creation phase
--------------------------    --------------------------------
console.log(a);               a:        undefined         ← var hoists to undefined
console.log(b);               b:        &lt;uninitialized&gt;  ← let in TDZ
console.log(c);               c:        &lt;uninitialized&gt;  ← const in TDZ
console.log(greet());         greet:    ƒ greet() { ... } ← function fully hoisted
console.log(add);             add:      undefined         ← var, but value not set yet

var a = 1;
let b = 2;
const c = 3;
function greet() { return 'hi'; }
var add = (x, y) =&gt; x + y;
</pre>
</div>

<p>During <em>execution</em>:</p>
<ul>
  <li>Line 1 prints <code>undefined</code> (var bound, not yet assigned).</li>
  <li>Line 2 throws <code>ReferenceError</code> (TDZ).</li>
  <li>Line 3 throws <code>ReferenceError</code> (TDZ).</li>
  <li>Line 4 prints <code>'hi'</code> (function hoisted with its body).</li>
  <li>Line 5 prints <code>undefined</code> (var bound, not yet assigned).</li>
</ul>

<h3>The "buckets" picture</h3>
<p>Every scope is a set of labeled buckets. During the creation phase:</p>
<ul>
  <li><code>var x</code> → bucket created with <code>undefined</code> inside.</li>
  <li><code>function f() {}</code> → bucket created with the compiled function object inside.</li>
  <li><code>let y</code> / <code>const z</code> / <code>class C</code> → bucket created but <em>locked</em>. Touching it triggers the TDZ trap.</li>
</ul>
<p>During execution, each bucket's content may be rewritten by its initializer (<code>let y = 5</code> swaps the lock for the value <code>5</code>). <code>const</code> is single-write: once the initializer runs, the bucket is sealed.</p>

<h3>The "two phases" vs "compiler/interpreter" view</h3>
<p>Under the hood, V8 and similar engines don't actually do a pre-pass and a post-pass — they emit bytecode in a single walk. But the spec <em>defines</em> behavior as if there are two phases, and the emitted bytecode respects that (e.g. <code>let</code> bindings are marked <em>uninitialized</em> in the stack frame at function entry, and any load that sees that marker throws). So the two-phase mental model is <em>observably correct</em> even though the machine doesn't literally do two passes.</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>People say "let isn't hoisted." It <em>is</em> hoisted — the binding is created at the start of the block. What it is <strong>not</strong> is <em>initialized</em>. If it weren't hoisted at all, <code>let</code> shadowing an outer variable would not kick in until the declaration line, and you'd read the outer variable above it. You don't — you get TDZ.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Per-declaration hoisting behavior</h3>
<table>
  <thead>
    <tr><th>Declaration form</th><th>Hoisted?</th><th>Initial value on creation</th><th>Scope</th><th>Re-declarable in same scope?</th></tr>
  </thead>
  <tbody>
    <tr><td><code>var</code></td><td>Yes</td><td><code>undefined</code></td><td>Function (or global)</td><td>Yes</td></tr>
    <tr><td><code>let</code></td><td>Yes (binding)</td><td>&lt;uninitialized&gt; (TDZ)</td><td>Block</td><td>No</td></tr>
    <tr><td><code>const</code></td><td>Yes (binding)</td><td>&lt;uninitialized&gt; (TDZ)</td><td>Block</td><td>No</td></tr>
    <tr><td><code>function</code> decl.</td><td>Yes (with body)</td><td>The function object</td><td>Function (sloppy) / Block (strict, ES2015+ with caveats)</td><td>Yes (overwrites)</td></tr>
    <tr><td><code>class</code></td><td>Yes (binding)</td><td>&lt;uninitialized&gt; (TDZ)</td><td>Block</td><td>No</td></tr>
    <tr><td><code>import</code></td><td>Yes, at link time</td><td>Live binding to export</td><td>Module</td><td>No</td></tr>
    <tr><td>Function <em>expression</em></td><td>Only the variable, per its keyword</td><td>Per its keyword</td><td>Per its keyword</td><td>Per its keyword</td></tr>
    <tr><td>Arrow function (assigned)</td><td>Only the variable, per its keyword</td><td>Per its keyword</td><td>Per its keyword</td><td>Per its keyword</td></tr>
  </tbody>
</table>

<h3>The actual spec mechanism — Environment Records</h3>
<p>Internally, the engine uses <strong>Environment Records</strong> to hold bindings. There are two flavors relevant here:</p>
<ul>
  <li><strong>Declarative Environment Record</strong> — holds <code>let</code>, <code>const</code>, <code>class</code>, function parameters, and function declarations inside blocks. Bindings can be in state "uninitialized" or "initialized".</li>
  <li><strong>Object Environment Record</strong> — backs the global scope in scripts (via the global object) and holds <code>var</code>/<code>function</code>-declared globals as properties.</li>
</ul>
<p>When a function is called or a block is entered, the engine runs the abstract operation <strong>BlockDeclarationInstantiation</strong> (for blocks) or <strong>FunctionDeclarationInstantiation</strong> (for functions). These operations:</p>
<ol>
  <li>Create bindings for every lexical declaration in the scope (<em>uninitialized</em>).</li>
  <li>Create <code>var</code> bindings (<em>initialized to undefined</em>).</li>
  <li>Install function declarations (with their full function value).</li>
  <li>Install parameter bindings (with their passed values or defaults — more on this below).</li>
</ol>

<h3>Hoisting across function boundaries</h3>
<p><code>var</code> hoists to the nearest <em>function</em> (or the global) — not the enclosing block. <code>let</code>/<code>const</code>/<code>class</code> hoist to the enclosing block. This is why:</p>
<pre><code class="language-js">function demo() {
  if (true) {
    var x = 1;    // hoists to demo's scope
    let y = 2;    // hoists only to the if block
  }
  console.log(x); // 1
  console.log(y); // ReferenceError — y is not visible here
}</code></pre>

<h3>Function declarations inside blocks — the awkward corner</h3>
<p>In strict mode / modules, function declarations inside blocks are block-scoped. In sloppy mode, they historically hoisted to the enclosing function (with web-compat "Annex B" quirks in browsers). For interviews: say <em>"use strict / modules → block-scoped; sloppy → don't rely on it; browsers have Annex B legacy rules that create both bindings."</em></p>

<h3>Default parameters and hoisting</h3>
<p>A function's parameter list is its own mini-scope that sits between the enclosing scope and the function body. Inside default-value expressions, later parameters see earlier ones, and the body sees everything in the parameter scope. TDZ applies:</p>
<pre><code class="language-js">function f(a = b, b = 1) {
  return [a, b];
}
f(); // ReferenceError — b is in TDZ when a's default evaluates</code></pre>

<h3>Classes</h3>
<p>A <code>class</code> declaration binds the class name in the enclosing block and puts it in TDZ until the <code>class</code> line executes. Unlike functions, you cannot call or reference the class before the declaration:</p>
<pre><code class="language-js">new Foo(); // ReferenceError — Foo is in TDZ
class Foo {}</code></pre>

<h3>Module-level hoisting</h3>
<p>In ES modules, <code>import</code> bindings are hoisted <em>and</em> initialized at module <em>link</em> time (before any code runs). So <code>import { x } from './mod.js'</code> is usable at the top of the file regardless of where the statement appears syntactically. For <em>cyclic</em> imports, bindings are created and linked but may still be in TDZ if the exporting side hasn't evaluated yet.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — var hoists to undefined</h3>
<pre><code class="language-js">console.log(x); // undefined
var x = 10;
console.log(x); // 10</code></pre>
<p>During the creation phase, <code>x</code> is initialized to <code>undefined</code>. The first <code>console.log</code> sees that. Then the execution phase assigns <code>10</code>.</p>

<h3>Example 2 — let/const TDZ</h3>
<pre><code class="language-js">console.log(a); // ReferenceError: Cannot access 'a' before initialization
let a = 1;

console.log(b); // ReferenceError
const b = 2;</code></pre>

<h3>Example 3 — function declarations hoist fully</h3>
<pre><code class="language-js">greet(); // 'hi'
function greet() { console.log('hi'); }</code></pre>
<p>The <em>entire</em> function object, including its body, is created during the memory phase. You can call it above its declaration.</p>

<h3>Example 4 — function expressions do NOT hoist their body</h3>
<pre><code class="language-js">greet(); // TypeError: greet is not a function
var greet = function () { console.log('hi'); };</code></pre>
<p><code>var greet</code> is hoisted to <code>undefined</code>. At the call site it's still <code>undefined</code>, so calling it throws <code>TypeError</code> (not ReferenceError — the identifier is defined, it's just not a function yet).</p>

<h3>Example 5 — arrow assigned to let</h3>
<pre><code class="language-js">greet(); // ReferenceError — TDZ
const greet = () =&gt; console.log('hi');</code></pre>

<h3>Example 6 — typeof inside TDZ throws</h3>
<pre><code class="language-js">console.log(typeof a); // undefined — a was never declared
console.log(typeof b); // ReferenceError — b is in TDZ
let b = 1;</code></pre>
<p><code>typeof</code> is normally the safe way to probe a variable, but TDZ beats that safety net.</p>

<h3>Example 7 — the infamous for-var loop</h3>
<pre><code class="language-js">for (var i = 0; i &lt; 3; i++) {
  setTimeout(() =&gt; console.log(i), 0);
}
// prints: 3, 3, 3</code></pre>
<pre><code class="language-js">for (let i = 0; i &lt; 3; i++) {
  setTimeout(() =&gt; console.log(i), 0);
}
// prints: 0, 1, 2</code></pre>
<p><code>var i</code> is hoisted to the enclosing function, so all three callbacks close over the <em>same</em> binding, which is <code>3</code> by the time they fire. <code>let i</code> creates a <em>new binding per iteration</em> so each callback sees the value at that tick.</p>

<h3>Example 8 — redeclare protection</h3>
<pre><code class="language-js">var x = 1;
var x = 2;     // OK
let y = 1;
let y = 2;     // SyntaxError: Identifier 'y' has already been declared</code></pre>

<h3>Example 9 — functions override var in same scope</h3>
<pre><code class="language-js">console.log(f); // ƒ f() {}
var f = 10;
function f() {}
console.log(f); // 10</code></pre>
<p>During the memory phase, both <code>var f</code> and <code>function f</code> are processed; the function wins because it gets its body, overwriting the <code>undefined</code>. Execution then assigns <code>10</code>.</p>

<h3>Example 10 — hoisting is per-scope</h3>
<pre><code class="language-js">function outer() {
  console.log(x); // undefined (hoisted within outer)
  var x = 5;
  inner();
  function inner() {
    console.log(x); // 5
  }
}
outer();</code></pre>

<h3>Example 11 — TDZ in default params</h3>
<pre><code class="language-js">function f(x = x) { return x; }
f(); // ReferenceError — x in TDZ when its own default evaluates</code></pre>

<h3>Example 12 — TDZ by reference</h3>
<pre><code class="language-js">{
  // new block starts — a is uninitialized
  const f = () =&gt; a;  // OK to define a closure mentioning a
  // f();               // Would throw if called here
  const a = 10;
  console.log(f());    // 10 — by now a is initialized
}</code></pre>
<p>Creating a function that <em>mentions</em> a TDZ binding is fine. Actually <em>reading</em> the binding while it's still uninitialized throws.</p>

<h3>Example 13 — class in TDZ</h3>
<pre><code class="language-js">const p = new Point(1, 2); // ReferenceError
class Point { constructor(x, y) { this.x = x; this.y = y; } }</code></pre>

<h3>Example 14 — import hoisting</h3>
<pre><code class="language-js">// file: app.js
console.log(sum(1, 2)); // 3 — works even though import is below
import { sum } from './math.js';</code></pre>
<p>Import bindings are wired up at link time before any code runs, so order in the file doesn't matter — though ESLint rules generally want imports at the top for readability.</p>

<h3>Example 15 — the shadowing trap</h3>
<pre><code class="language-js">let x = 'outer';
{
  console.log(x); // ReferenceError — TDZ of the inner x
  let x = 'inner';
}</code></pre>
<p>The inner <code>let x</code> creates a new binding at the top of the block, shadowing the outer one. The <code>console.log</code> happens <em>within</em> that block, so it refers to the inner <code>x</code>, which is in TDZ.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. <code>typeof</code> on an undeclared identifier does NOT throw</h3>
<pre><code class="language-js">console.log(typeof neverDeclared); // 'undefined' — no error</code></pre>
<p>This is the <em>one</em> safe probe. But as soon as the identifier is declared with <code>let</code>/<code>const</code>/<code>class</code>, <code>typeof</code> before the declaration line throws.</p>

<h3>2. Hoisting across different scopes</h3>
<pre><code class="language-js">var a = 1;
function f() {
  console.log(a); // undefined — f has its own a
  var a = 2;
}
f();</code></pre>
<p>The <code>var a = 2</code> inside <code>f</code> creates a new binding inside <code>f</code>, hoisted to <code>undefined</code>, shadowing the outer <code>a</code>.</p>

<h3>3. Function declaration vs function expression hoisting</h3>
<pre><code class="language-js">f(); // 'decl'
g(); // TypeError — g is undefined

function f() { console.log('decl'); }
var g = function () { console.log('expr'); };</code></pre>

<h3>4. let in a for-loop head creates a new binding per iteration</h3>
<pre><code class="language-js">for (let i = 0; i &lt; 3; i++) {
  setTimeout(() =&gt; console.log(i), 0);
}
// 0 1 2 — each iteration gets its own 'i' binding</code></pre>
<p>Spec-wise: at the start of each iteration, the engine creates a new per-iteration environment with <code>i</code> bound to the previous iteration's value.</p>

<h3>5. const on objects — mutable inside, immutable binding</h3>
<pre><code class="language-js">const arr = [];
arr.push(1);  // OK
arr = [];     // TypeError — assignment to constant variable</code></pre>

<h3>6. Hoisting in switch/case</h3>
<pre><code class="language-js">switch (x) {
  case 1:
    let y = 1;   // ReferenceError if you also have case 2 touching y without its own block
    break;
  case 2:
    // Without curly braces, this shares the switch block — TDZ of y still applies
    break;
}</code></pre>
<p>All <code>case</code> labels share the switch's block scope. Declare each case in its own <code>{ }</code> block to avoid leakage.</p>

<h3>7. Hoisting doesn't cross function boundaries (var doesn't leak upward)</h3>
<pre><code class="language-js">function outer() {
  console.log(x); // ReferenceError — x not visible here
  function inner() { var x = 1; }
}</code></pre>

<h3>8. Function declaration inside an if — sloppy vs strict</h3>
<pre><code class="language-js">'use strict';
if (true) {
  function foo() { return 1; }
}
foo(); // ReferenceError in strict/modules — foo is block-scoped</code></pre>
<p>In sloppy script mode (no <code>'use strict'</code>, not a module), browsers implement Annex B semantics that create a second <code>var</code>-style binding in the enclosing function — so <code>foo()</code> <em>might</em> work. Do not rely on it.</p>

<h3>9. Hoisting inside <code>try/catch</code></h3>
<pre><code class="language-js">try { throw new Error('x'); } catch (e) {
  // e is scoped to this catch block
}
console.log(e); // ReferenceError</code></pre>
<p>The catch parameter <code>e</code> is a block-scoped binding with TDZ semantics — not truly different from <code>let</code>.</p>

<h3>10. <code>let</code> at module top-level</h3>
<pre><code class="language-js">// module
export { x };
// ...
let x = 1;</code></pre>
<p>Another module that imports <code>x</code> <em>before</em> this module finishes evaluating (a cyclic import case) will see <code>x</code> in TDZ when it tries to read it.</p>

<h3>11. Redeclaring a function at same scope</h3>
<pre><code class="language-js">function f() { return 'a'; }
function f() { return 'b'; }
f(); // 'b' — second declaration wins during hoisting</code></pre>

<h3>12. var + function duel</h3>
<pre><code class="language-js">function f() { return 'fn'; }
var f;
console.log(f()); // 'fn' — bare var (no initializer) doesn't overwrite</code></pre>

<h3>13. TDZ inside computed class member names</h3>
<pre><code class="language-js">const name = 'greeting';
class A {
  [name]() { return 'hi'; }
}
new A().greeting(); // 'hi'</code></pre>
<p>Computed names evaluate when the class is evaluated, not hoisted. If you reference a TDZ'd name in the computed slot, you'll get a ReferenceError at class-evaluation time.</p>

<h3>14. Arguments vs var in function</h3>
<pre><code class="language-js">function f(a) {
  var a = 10; // OK — just reassigns the parameter 'a'
  return a;
}
f(1); // 10</code></pre>
<p>Parameters count as declarations in the function's variable environment. Declaring <code>var a</code> inside the body is a no-op for the binding; the assignment runs normally.</p>

<h3>15. <code>let</code> vs parameter</h3>
<pre><code class="language-js">function f(a) {
  let a = 10; // SyntaxError: Identifier 'a' has already been declared
}</code></pre>
<p><code>let</code>/<code>const</code> cannot shadow a same-scope parameter. (<code>var</code> can — it just merges.)</p>

<h3>16. Global <code>var</code> becomes a window property; <code>let</code> does not</h3>
<pre><code class="language-js">var v = 1;
let l = 2;
window.v; // 1
window.l; // undefined</code></pre>
<p>Global <code>var</code> and function declarations go on the global object. Global <code>let</code>/<code>const</code>/<code>class</code> sit in the script's lexical environment, separate from the global object — a deliberate ES6 fix to avoid polluting <code>window</code>.</p>

<h3>17. TDZ is observable via Chrome DevTools</h3>
<p>Pausing execution inside the TDZ and inspecting the variable shows it as <em>"&lt;value unavailable&gt;"</em> in the Scopes panel. This confirms the binding exists but is uninitialized.</p>

<h3>18. Engines may warn but can't lift TDZ</h3>
<p>Some ESLint rules (<code>no-use-before-define</code>) and TypeScript compile-time checks flag TDZ issues early, but TDZ itself is a runtime trap — you cannot disable it.</p>

<h3>19. <code>with</code> blocks (don't use them)</h3>
<pre><code class="language-js">with (obj) {
  // inside here, identifier lookup first checks obj
}</code></pre>
<p>Hoisting still happens per block scope; the <code>with</code> block inserts an <em>Object Environment Record</em> into the scope chain, so identifier resolution becomes unpredictable. Banned in strict mode.</p>

<h3>20. Script vs module at top-level</h3>
<p>In a classic script (<code>&lt;script&gt;</code> without <code>type="module"</code>), the global code is one big Execution Context. In a module (<code>&lt;script type="module"&gt;</code>, or any Node ESM file), the module body is still an EC, but its Lexical Environment is separate from the global object. Hoisting rules are the same; visibility differs.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — relying on function-declaration hoisting for setup</h3>
<pre><code class="language-js">// BAD
init();

function init() { /* 200 lines of setup */ }</code></pre>
<p>It works because of hoisting but destroys readability — the reader has to scroll down to find <code>init</code>. Prefer ordering: declare first, call at the bottom or from a clear entry point.</p>

<h3>Anti-pattern 2 — using var everywhere</h3>
<pre><code class="language-js">// BAD
function badLoop(arr) {
  for (var i = 0; i &lt; arr.length; i++) {
    setTimeout(() =&gt; console.log(arr[i]), 100);
  }
}</code></pre>
<p>Every callback sees <code>arr.length</code> because <code>i</code> is function-scoped. Fix: use <code>let</code>. Nine out of ten <code>var</code> bugs are this loop.</p>

<h3>Anti-pattern 3 — "I'll just declare it later, it's hoisted"</h3>
<pre><code class="language-js">// BAD
function getUser() {
  // ... 40 lines ...
  console.log(user); // undefined — hoisted var
  // ... 40 lines ...
  var user = fetchUserSync();
  return user;
}</code></pre>
<p>The top-level read gives <code>undefined</code> silently and downstream logic goes wrong. Either declare at the top, or (much better) use <code>const</code> right where you assign.</p>

<h3>Anti-pattern 4 — block-scoping assumptions with var</h3>
<pre><code class="language-js">// BAD — expecting i to be block-local
if (cond) {
  var i = 1;
}
console.log(i); // 1 or undefined — NOT a ReferenceError</code></pre>
<p><code>var</code> doesn't respect <code>if</code>/<code>for</code>. Reviewer sees "oh, local variable" but the binding leaks.</p>

<h3>Anti-pattern 5 — shadow-before-init bug</h3>
<pre><code class="language-js">let x = 'outer';
function f() {
  console.log(x); // ReferenceError — TDZ of inner x
  let x = 'inner';
}
f();</code></pre>
<p>Reader expects <code>'outer'</code>, but the inner <code>let</code> TDZs above its line. Fix: rename the inner, or move the declaration above the log.</p>

<h3>Anti-pattern 6 — initializer that depends on later binding</h3>
<pre><code class="language-js">// BAD
const total = subtotal + tax;
const subtotal = 100;
const tax = 10;</code></pre>
<p>ReferenceError. Fix: declare in dependency order.</p>

<h3>Anti-pattern 7 — function expression inside an if</h3>
<pre><code class="language-js">// BAD (unreliable across environments)
if (cond) {
  function helper() {}
}
helper(); // Sometimes works (sloppy), sometimes ReferenceError (strict/module)</code></pre>
<p>Assign to a <code>let</code> / <code>const</code> instead: <code>const helper = cond ? () =&gt; {} : () =&gt; {}</code>.</p>

<h3>Anti-pattern 8 — redeclaring a const at runtime</h3>
<pre><code class="language-js">// BAD — SyntaxError, not caught until eval time
const MAX = 100;
if (x) { const MAX = 200; /* new binding, fine, but confusing */ }</code></pre>
<p>Not strictly a bug but confuses readers. Use distinct names.</p>

<h3>Anti-pattern 9 — using class before it's declared</h3>
<pre><code class="language-js">// BAD
class Child extends Parent {}
class Parent {}</code></pre>
<p><code>Parent</code> is in TDZ when <code>extends Parent</code> evaluates. Fix: declare <code>Parent</code> first.</p>

<h3>Anti-pattern 10 — trusting typeof to probe a let</h3>
<pre><code class="language-js">// BAD
function isSet() { return typeof config !== 'undefined'; }
isSet();
let config = {};</code></pre>
<p>Throws in the TDZ region. If you really need probing, hoist the binding up (declare it earlier) or use a sentinel value.</p>

<h3>Anti-pattern 11 — Relying on Annex B browser hoisting</h3>
<pre><code class="language-js">// Works in sloppy browser code, fails in strict / modules / Node ESM
if (true) {
  function f() { return 1; }
}
f();</code></pre>
<p>If your target is modern (modules, TypeScript, bundlers), this won't work. Be explicit.</p>

<h3>Anti-pattern 12 — hoisted var shadowing a parameter accidentally</h3>
<pre><code class="language-js">// BAD
function log(message) {
  if (verbose) {
    var message = '[v] ' + message;
  }
  console.log(message);
}</code></pre>
<p><code>var message</code> is hoisted and merges with the parameter. For <code>verbose === false</code>, the assignment never runs, so message is the original — fine; but debugging <em>why</em> is awkward. Use <code>const</code> for the prefixed version and a new name.</p>

<h3>Anti-pattern 13 — Implicit globals (no declaration)</h3>
<pre><code class="language-js">function f() {
  x = 10; // no var/let/const — creates global x in sloppy mode
}</code></pre>
<p>Strict mode throws <code>ReferenceError</code>, which is actually helpful. Always use <code>'use strict'</code> or modules.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. What gets printed and why?</div>
<pre><code class="language-js">console.log(a);
console.log(b);
var a = 1;
let b = 2;</code></pre>
  <div class="qa-answer">
    <p>Line 1 prints <code>undefined</code>: <code>var a</code> is hoisted to the top of the global EC and initialized to <code>undefined</code> during the creation phase. Line 2 throws <code>ReferenceError: Cannot access 'b' before initialization</code>: <code>let b</code> is hoisted as a binding but in the TDZ until its initializer line runs. Because a ReferenceError is thrown, Line 3 and 4 never execute.</p>
    <p><strong>Keywords to say:</strong> creation phase, memory allocation, <code>undefined</code> vs uninitialized, TDZ, ReferenceError.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Why do function declarations hoist with bodies but function expressions don't?</div>
  <div class="qa-answer">
    <p>A <em>function declaration</em> is a statement that the engine recognizes during the creation phase and binds to the declared name with its full function value. A <em>function expression</em> is a right-hand-side expression — it only executes when the assignment statement runs during the execution phase. Before that, the variable exists (per its keyword: <code>var</code> → <code>undefined</code>; <code>let</code>/<code>const</code> → TDZ) but holds no callable value.</p>
    <p><strong>Follow-up:</strong> What does this print?</p>
<pre><code class="language-js">sayHi(); // TypeError: sayHi is not a function
var sayHi = function () { console.log('hi'); };</code></pre>
    <p>Answer: TypeError because <code>sayHi</code> is hoisted to <code>undefined</code>, and calling <code>undefined()</code> is a TypeError (not a ReferenceError — the identifier resolves).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Explain the Temporal Dead Zone in plain English.</div>
  <div class="qa-answer">
    <p>When the engine enters a block, it registers every <code>let</code>, <code>const</code>, and <code>class</code> declaration inside it — but in an <em>uninitialized</em> state. Execution then proceeds line by line. Between the block's start and the declaration's initializer line, any attempt to read or write the binding throws <code>ReferenceError</code>. That interval is the TDZ. It exists so that using a variable before it's ready is a loud error rather than a silent <code>undefined</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Classic for-loop puzzle with var vs let</div>
<pre><code class="language-js">for (var i = 0; i &lt; 3; i++) setTimeout(() =&gt; console.log(i), 0);
for (let i = 0; i &lt; 3; i++) setTimeout(() =&gt; console.log(i), 0);</code></pre>
  <div class="qa-answer">
    <p>First loop prints <code>3 3 3</code> — <code>var i</code> is one binding in the enclosing scope; all three callbacks close over it; when they run, <code>i</code> is <code>3</code>. Second loop prints <code>0 1 2</code> — <code>let i</code> creates a <em>new per-iteration binding</em>; each callback closes over that iteration's fresh <code>i</code>. The spec calls this mechanism <em>per-iteration binding</em>: the engine clones the lexical environment at the end of each iteration and copies the current value into the clone.</p>
    <p><strong>Keywords to say:</strong> closure, per-iteration binding, function-scoped vs block-scoped.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Will this throw or print?</div>
<pre><code class="language-js">{
  const f = () =&gt; a;
  const a = 10;
  console.log(f());
}</code></pre>
  <div class="qa-answer">
    <p>Prints <code>10</code>. Defining <code>f</code> does not read <code>a</code>; it only captures the variable by reference. By the time <code>f()</code> executes, <code>a</code> is already initialized. TDZ would only trigger if <code>f</code> were <em>called</em> before the <code>const a = 10</code> line ran.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How does hoisting differ between var and function declarations when they share a name?</div>
  <div class="qa-answer">
    <p>During the creation phase, both are processed. Function declarations are instantiated <em>with their function object</em>; <code>var</code> declarations merely reserve a binding and set it to <code>undefined</code>. If both exist for the same name in the same scope, the function declaration wins (its full value overwrites the <code>undefined</code>). Then during execution, the first assignment in the source that targets the name (e.g. <code>var x = 10</code>) will replace the function with the new value.</p>
<pre><code class="language-js">console.log(x); // ƒ x() {}
var x = 10;
function x() {}
console.log(x); // 10</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. What is the output?</div>
<pre><code class="language-js">let x = 1;
function f() {
  console.log(x);
  let x = 2;
}
f();</code></pre>
  <div class="qa-answer">
    <p><code>ReferenceError</code>. Inside <code>f</code>, the <code>let x</code> declaration creates a new binding at the top of the function's block scope, shadowing the outer <code>x</code>. The <code>console.log</code> refers to the inner <code>x</code>, which is in TDZ. A common trap — students expect <code>1</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Are <code>let</code> variables on the window?</div>
  <div class="qa-answer">
    <p>No. Global <code>var</code> and function declarations become properties of the global object (<code>window</code> in browsers, <code>globalThis</code> in general). Global <code>let</code>, <code>const</code>, and <code>class</code> live in a separate <em>Script</em> record's Lexical Environment. They are visible as globals but are not accessible as <code>window.x</code>. This was a deliberate ES6 design to stop polluting the global object.</p>
<pre><code class="language-js">var a = 1; let b = 2;
console.log(window.a, window.b); // 1 undefined</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Predict the output</div>
<pre><code class="language-js">var a = 1;
(function () {
  console.log(a);
  var a = 2;
})();</code></pre>
  <div class="qa-answer">
    <p><code>undefined</code>. Inside the IIFE, <code>var a</code> is hoisted to <code>undefined</code> in the function's scope, shadowing the outer <code>a</code>. The log sees the hoisted inner <code>a</code>, which is still <code>undefined</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Why does <code>typeof x</code> throw here but not elsewhere?</div>
<pre><code class="language-js">console.log(typeof x); // ReferenceError
let x = 1;</code></pre>
  <div class="qa-answer">
    <p>Normally <code>typeof</code> on an <em>undeclared</em> identifier returns the string <code>'undefined'</code> without throwing — that's a special safeguard dating back to ES1. But <code>let x</code> <em>is</em> declared, just not initialized. <code>typeof</code> still has to read the binding, and reading an uninitialized binding triggers the TDZ. So TDZ beats the <code>typeof</code> safety valve.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Where is the TDZ for default parameters?</div>
  <div class="qa-answer">
    <p>The function's parameter list is its own scope. Default expressions are evaluated left-to-right; within the default for <code>a</code>, only parameters to the left of <code>a</code> are initialized. Inside <code>a</code>'s default you can see earlier params, but any later param is still in TDZ.</p>
<pre><code class="language-js">function f(a = b, b = 1) { return [a, b]; }
f(); // ReferenceError — b is in TDZ when a's default runs
function g(a = 1, b = a) { return [a, b]; }
g(); // [1, 1] — a is already initialized when b's default runs</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Minimal hoisting trivia battery (rapid fire)</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Does <code>var</code> hoist?</strong> Yes, to <code>undefined</code>, at the nearest function/global.</li>
      <li><strong>Does <code>let</code> hoist?</strong> Yes (the binding), but uninitialized → TDZ until its line.</li>
      <li><strong>Do function declarations hoist?</strong> Yes, with body.</li>
      <li><strong>Do function expressions hoist?</strong> Only the variable (per its keyword).</li>
      <li><strong>Do arrow functions hoist?</strong> Same — only the variable they're assigned to.</li>
      <li><strong>Does <code>class</code> hoist?</strong> Yes (binding), TDZ until the declaration line.</li>
      <li><strong>Do imports hoist?</strong> Yes, at module link time — before any code runs.</li>
      <li><strong>Does <code>for (let)</code> rebind per iteration?</strong> Yes.</li>
      <li><strong>Is <code>typeof</code> safe?</strong> On undeclared identifiers yes; on TDZ'd bindings no.</li>
      <li><strong>Are global <code>let</code>/<code>const</code> on <code>window</code>?</strong> No.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. What's the TDZ in one sentence?</div>
  <div class="qa-answer">
    <p>"A <code>let</code>/<code>const</code>/<code>class</code> binding is created at the start of its block but marked uninitialized; any access before the declaration line runs throws a <code>ReferenceError</code>, and that unsafe window is called the Temporal Dead Zone."</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Design question — why did TC39 <em>not</em> make let hoist to <code>undefined</code>?</div>
  <div class="qa-answer">
    <p>Three reasons: (1) <code>const</code> has no natural pre-initializer value — it must be uninitialized until assigned. Making <code>let</code> different from <code>const</code> for a marginal convenience would hurt consistency. (2) Early-use bugs silently return <code>undefined</code> today with <code>var</code> and are a major class of production bugs; TDZ turns them into loud errors. (3) The engine already tracks <em>uninitialized</em> state for other reasons (e.g., const initialization); reusing that machinery was cheap.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Implementation trivia — how does V8 actually represent TDZ?</div>
  <div class="qa-answer">
    <p>V8 allocates a local slot in the stack frame (or a context slot for closed-over variables). At the top of a block, slots for <code>let</code>/<code>const</code>/<code>class</code> bindings are filled with a special "the hole" sentinel. The load opcodes emitted by Ignition have a "throw if the value is the hole" check. When the declaration's initializer runs, the slot is overwritten with the real value. That's all TDZ is at the machine level — a sentinel and a check.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You say "creation / execution phase" instead of "hoisting moves code up."</li>
    <li>You distinguish <em>bound</em> vs <em>initialized</em> when discussing TDZ.</li>
    <li>You explain <em>why</em> the for-let loop prints 0,1,2 (per-iteration binding), not just that it does.</li>
    <li>You know function declarations include their bodies, but function expressions don't.</li>
    <li>You mention that global <code>let</code>/<code>const</code> are NOT on <code>window</code>.</li>
    <li>You can debug a default-parameter TDZ example.</li>
  </ul>
</div>
`}

]
});
