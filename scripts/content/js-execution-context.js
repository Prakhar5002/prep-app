window.PREP_SITE.registerTopic({
  id: 'js-execution-context',
  module: 'JavaScript Deep',
  title: 'Execution Context',
  estimatedReadTime: '25 min',
  tags: ['execution-context', 'memory-phase', 'execution-phase', 'hoisting', 'call-stack', 'fundamentals'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>An <strong>Execution Context</strong> (EC) is the sealed environment JavaScript creates to run a piece of code — global code, a function call, or an <code>eval</code>. Each EC has its own <em>Variable Environment</em>, <em>Scope Chain</em>, and <em>this</em>. The engine creates every EC in <strong>two phases</strong>:</p>
<ol>
  <li><strong>Memory / Creation Phase</strong> — scan the code, allocate memory, hoist declarations.</li>
  <li><strong>Execution Phase</strong> — run the code line by line using the pre-allocated memory.</li>
</ol>
<p>Execution contexts are pushed on and off the <strong>Call Stack</strong> (LIFO). The global EC sits at the bottom; every function call pushes a new EC on top; returning pops it off.</p>
<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>JavaScript <em>prepares</em> the memory first, then <em>runs</em> the code — that's the whole reason <code>var</code> hoists to <code>undefined</code>, function declarations can be called above their definition, and <code>let</code>/<code>const</code> throw in the TDZ.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What is an Execution Context, precisely?</h3>
<p>An Execution Context is a <em>data structure</em> maintained internally by the JavaScript engine (V8, SpiderMonkey, JavaScriptCore, Hermes). Conceptually it bundles three things:</p>
<ul>
  <li><strong>Variable Environment</strong> — an object-like record holding the variables, function declarations, and parameters of this context.</li>
  <li><strong>Scope Chain (Outer Environment Reference)</strong> — a link to the parent lexical environment, so inner code can look up outer variables.</li>
  <li><strong>ThisBinding</strong> — the value of <code>this</code> for this context, decided at call time (for functions) or fixed (for modules/global).</li>
</ul>

<p>Modern ECMAScript specs split the Variable Environment into two records — <code>LexicalEnvironment</code> (for <code>let</code>/<code>const</code>/<code>class</code>) and <code>VariableEnvironment</code> (for <code>var</code>/function declarations) — but at interview level think of them as one "memory" object.</p>

<h3>Why does JS need this at all?</h3>
<p>JavaScript is a dynamically-scoped, first-class-function language. To resolve identifiers correctly, the engine needs:</p>
<ol>
  <li>To know <strong>what identifiers exist</strong> in the current scope before execution begins (so function declarations can be called from above).</li>
  <li>To know <strong>how to walk outward</strong> if a variable isn't here (scope chain).</li>
  <li>To know <strong>who called me</strong> (for <code>this</code>, return values, stack traces).</li>
</ol>

<p>The EC model answers all three at once. It's also what enables hoisting, closures (which capture the Outer Environment reference), and accurate stack traces.</p>

<h3>Types of Execution Contexts</h3>
<ul>
  <li><strong>Global Execution Context (GEC)</strong> — one per program. Creates <code>window</code>/<code>globalThis</code>, sets <code>this</code> to the global object (or <code>undefined</code> in ES modules).</li>
  <li><strong>Function Execution Context (FEC)</strong> — created on every function <em>call</em> (not definition). One function can have many live FECs (recursion).</li>
  <li><strong>Eval Execution Context</strong> — created when <code>eval()</code> runs. Avoid in production.</li>
  <li><strong>Module Execution Context</strong> — each ES module file. Always strict mode; <code>this</code> is <code>undefined</code>; own module-scope (not leaked to global).</li>
</ul>

<div class="callout warn">
  <div class="callout-title">⚠️ Misconception alert</div>
  <p>A function's EC is created when the function is <em>called</em>, not when it's defined. Defining a function doesn't push anything on the call stack. Only <em>invocation</em> does.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🪜 Mental Model', html: `
<h3>The two-phase mental model</h3>
<p>For any block of JS that's about to run (the whole file, a function body, or an eval), picture the engine doing this:</p>

<div class="diagram">
  ┌───────────────────────────────────────────────┐
  │         CREATE EXECUTION CONTEXT              │
  ├───────────────────────────────────────────────┤
  │ Phase 1: MEMORY (Creation)                    │
  │   • scan for var/let/const/function           │
  │   • var     → allocated as undefined          │
  │   • function → fully allocated (hoisted body) │
  │   • let/const → allocated but UNINITIALIZED   │
  │                 (Temporal Dead Zone)          │
  │   • set 'this' binding                        │
  │   • link outer (parent) environment           │
  ├───────────────────────────────────────────────┤
  │ Phase 2: EXECUTION                            │
  │   • run code line-by-line                     │
  │   • assignments happen NOW                    │
  │   • function calls → push new EC              │
  │   • identifier lookups walk the scope chain   │
  └───────────────────────────────────────────────┘
</div>

<h3>The call stack analogy</h3>
<p>Execution contexts live on the call stack — a simple LIFO stack. When you run <code>main() → a() → b()</code>, the stack looks like this:</p>

<div class="diagram">
  time →  t0         t1         t2         t3         t4         t5
         ┌────┐    ┌────┐     ┌────┐     ┌────┐     ┌────┐    ┌────┐
         │    │    │    │     │    │     │ b  │     │    │    │    │
         │    │    │    │     │ a  │     │ a  │     │ a  │    │    │
         │    │    │main│     │main│     │main│     │main│    │main│
         │GEC │    │GEC │     │GEC │     │GEC │     │GEC │    │GEC │
         └────┘    └────┘     └────┘     └────┘     └────┘    └────┘
          start    call main  call a     call b     b returns main returns
</div>

<p>Key takeaways:</p>
<ul>
  <li>The top of the stack is the <strong>currently running</strong> EC.</li>
  <li>The EC below it is <strong>paused</strong>, waiting for the top to return.</li>
  <li>When an EC returns, it's <strong>destroyed</strong> (usually — unless captured by a closure, see "Memory & GC" topic).</li>
  <li>A "stack overflow" error means too many ECs stacked up (usually infinite recursion).</li>
</ul>

<h3>What lives inside a single EC</h3>
<div class="diagram">
  ┌─ Function Execution Context ──────────────────────┐
  │                                                   │
  │   VariableEnvironment:                            │
  │     x       → undefined   (var, hoisted)          │
  │     inner   → &lt;function body&gt;                    │
  │     count   → &lt;TDZ&gt;       (let, before declared)  │
  │                                                   │
  │   ScopeChain: [this EC] → [outer EC] → ...        │
  │                                                   │
  │   ThisBinding: (decided by how fn was called)     │
  │                                                   │
  │   'arguments' object (non-arrow fns only)         │
  │                                                   │
  └───────────────────────────────────────────────────┘
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Step-by-Step Mechanics', html: `
<h3>The two phases in detail</h3>

<h4>Phase 1 — Memory Creation</h4>
<p>Before any line of code in this context runs, the engine walks the source once and does:</p>
<ol>
  <li><strong>Create the Variable Environment object</strong> — an internal map.</li>
  <li><strong>Parameters first</strong> — for FECs, parameters are bound to their argument values (default values evaluated lazily in Phase 2).</li>
  <li><strong>Function declarations</strong> — a full function object is created and stored (name → fn).</li>
  <li><strong>Variables with <code>var</code></strong> — stored with the initial value <code>undefined</code>.</li>
  <li><strong>Variables with <code>let</code>/<code>const</code>/<code>class</code></strong> — the binding is created but marked <em>uninitialized</em> (TDZ). Any access before the actual declaration line throws <code>ReferenceError</code>.</li>
  <li><strong>Outer reference is set</strong> — this EC links to the enclosing lexical scope.</li>
  <li><strong>This binding is set</strong> — rules depend on call type (see "this Keyword" topic).</li>
</ol>

<h4>Phase 2 — Execution</h4>
<p>Now the engine runs the code line by line. For each line:</p>
<ol>
  <li><strong>Identifier lookup</strong> — resolve names using the current Variable Environment, falling back through the scope chain.</li>
  <li><strong>Assignment</strong> — <code>var x = 5</code> sets <code>x</code> from <code>undefined</code> to <code>5</code>.</li>
  <li><strong>Function calls</strong> — create a new FEC, push on the stack, jump to its Phase 1.</li>
  <li><strong>Returns</strong> — pop the top EC off the stack; control resumes in the caller.</li>
  <li><strong>Exceptions</strong> — if uncaught, the engine unwinds the stack until it finds a <code>try/catch</code>.</li>
</ol>

<h3>Exact rule for function declarations vs var collisions</h3>
<p>When both <code>var</code> and a function declaration share the same name:</p>
<ul>
  <li><strong>Memory Phase:</strong> function declaration wins — the name points to the full function object.</li>
  <li><strong>Execution Phase:</strong> any <code>var x = ...</code> assignment (at its source line) overwrites the function.</li>
</ul>

<p>That's why this logs the function first, then the number:</p>
<pre><code class="language-js">console.log(a);       // [Function: a]
function a() {}
var a = 10;
console.log(a);       // 10</code></pre>

<h3>Block scopes inside a function</h3>
<p>Every <code>{ }</code> block creates a <em>Lexical Environment</em> record (not a full EC, but a mini scope) for <code>let</code>/<code>const</code>/<code>class</code>. <code>var</code> ignores blocks and binds to the enclosing function.</p>

<pre><code class="language-js">function foo() {
  if (true) {
    var a = 1;      // belongs to foo's EC
    let b = 2;      // belongs to this block's LexicalEnvironment
    const c = 3;
  }
  console.log(a);   // 1
  console.log(b);   // ReferenceError — b not in this scope
}</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '📦 Examples (progressive)', html: `
<h3>Example 1 — Classic <code>var</code> hoisting</h3>
<pre><code class="language-js">console.log(x);
var x = 5;
function foo() {
  console.log(x);
  var x = 10;
}
foo();</code></pre>

<h4>🌍 GEC — Memory Phase</h4>
<pre><code class="language-js">x   → undefined
foo → function () {...}</code></pre>

<h4>⚙️ GEC — Execution Phase</h4>
<ol>
  <li><code>console.log(x)</code> → <strong>undefined</strong> (x exists, no value yet)</li>
  <li><code>x = 5</code></li>
  <li><code>foo()</code> → push a new FEC</li>
</ol>

<h4>🧩 Function Execution Context (foo) — Memory</h4>
<pre><code class="language-js">x → undefined   // local var hoisted — shadows outer x</code></pre>

<h4>🧩 foo EC — Execution</h4>
<ol>
  <li><code>console.log(x)</code> → local <code>x</code> is <strong>undefined</strong> (NOT outer 5)</li>
  <li><code>x = 10</code></li>
</ol>

<div class="callout insight">
  <div class="callout-title">🔥 Key insight</div>
  <p>JS does NOT check "is there a better value outside?" It checks "does this identifier exist in my current scope?" If yes → use it, even if <code>undefined</code>. That's shadowing.</p>
</div>

<h3>Example 2 — <code>var</code> that appears AFTER the function call</h3>
<pre><code class="language-js">var x = 5;
function foo() {
  console.log(x);
  var x = 10;
}
foo();</code></pre>

<p>Still logs <strong>undefined</strong>. Reason: inside <code>foo</code>, <code>var x</code> is hoisted to the top of its own EC as <code>undefined</code>. The assignment <code>x = 10</code> hasn't happened yet at the <code>console.log</code> line. The outer <code>x = 5</code> is irrelevant because foo has its own local <code>x</code>.</p>

<h3>Example 3 — Function declaration wins, then gets reassigned</h3>
<pre><code class="language-js">console.log(a);     // [Function: a]
function a() {}
var a = 10;
console.log(a);     // 10</code></pre>

<h4>Memory Phase</h4>
<pre><code class="language-js">a → function a() {}   // fn declaration wins over var
</code></pre>

<h4>Execution Phase</h4>
<ol>
  <li><code>console.log(a)</code> → <strong>function a() {}</strong></li>
  <li><code>var a = 10</code> → assignment overwrites</li>
  <li><code>console.log(a)</code> → <strong>10</strong></li>
</ol>

<h3>Example 4 — Swapped order of declarations</h3>
<pre><code class="language-js">var a = 1;
function a() {}
console.log(a);    // 1</code></pre>

<p>Memory phase: function wins (<code>a → function</code>). Execution phase: first line <code>var a = 1</code> overwrites to <strong>1</strong>. By the time we log, <code>a</code> is already <code>1</code>.</p>

<h3>Example 5 — <code>let</code> and the Temporal Dead Zone</h3>
<pre><code class="language-js">console.log(a);    // ❌ ReferenceError — TDZ
let a = 5;</code></pre>

<p>In the Memory Phase, <code>a</code>'s binding exists but is marked "uninitialized". Accessing it throws until the engine reaches <code>let a = 5</code>. This proves <code>let</code> IS hoisted — just not to <code>undefined</code>.</p>

<h3>Example 6 — <code>typeof</code> is NOT safe in TDZ</h3>
<pre><code class="language-js">console.log(typeof undeclared);  // "undefined"  ✅  (never declared)
console.log(typeof a);            // ❌ ReferenceError
let a = 5;</code></pre>

<p>A common myth: "<code>typeof</code> never throws". It does throw for TDZ variables. It's safe only for truly undeclared identifiers.</p>

<h3>Example 7 — Nested ECs and recursion</h3>
<pre><code class="language-js">function factorial(n) {
  if (n &lt;= 1) return 1;
  return n * factorial(n - 1);
}
console.log(factorial(3));  // 6</code></pre>

<div class="diagram">
Call stack evolution:

   ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
   │              │        │ factorial(1) │        │              │
   │ factorial(2) │  →     │ factorial(2) │  →     │ factorial(2) │
   │ factorial(3) │        │ factorial(3) │        │ factorial(3) │
   │ GEC          │        │ GEC          │        │ GEC          │
   └──────────────┘        └──────────────┘        └──────────────┘
       3 pushed              4 pushed (base)        returns 1, unwinds
</div>

<p>Each call creates its own EC with its own <code>n</code>. When <code>factorial(1)</code> returns, its EC is popped; the result bubbles up.</p>

<h3>Example 8 — Parameters arrive in Memory Phase</h3>
<pre><code class="language-js">function foo(x) {
  console.log(x);   // 10
  var x = 20;
  console.log(x);   // 20
}
foo(10);</code></pre>

<p>In the Memory Phase, <code>x</code> is bound to the argument value <code>10</code> (parameters are treated as pre-declared). The <code>var x</code> line adds no new binding (same name already exists). Assignment happens at its line.</p>

<h3>Example 9 — Block scope doesn't push a new EC</h3>
<pre><code class="language-js">function foo() {
  console.log(this);   // depends on how foo() was called
  if (true) {
    let inside = 1;
    console.log(this); // SAME 'this' as above
  }
}</code></pre>

<p>Blocks create lexical environments but NOT new ECs. So <code>this</code>, <code>arguments</code>, and the call-stack frame remain the same. Only <code>let</code>/<code>const</code>/<code>class</code> bindings are block-scoped.</p>

<h3>Example 10 — Arrow functions and ECs</h3>
<pre><code class="language-js">const obj = {
  x: 10,
  m() {
    const arrow = () =&gt; console.log(this.x);
    arrow();
  }
};
obj.m();   // 10</code></pre>

<p>Arrow functions DO create a new EC when called, but they <strong>don't have their own <code>this</code> / <code>arguments</code> / <code>super</code> / <code>new.target</code></strong>. They inherit those from the enclosing EC. This is the whole secret of arrow functions.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🔍 All Edge Cases', html: `
<h3>1. <code>function</code> declarations vs function expressions</h3>
<pre><code class="language-js">foo();  // ✅ works
function foo() { console.log('decl'); }

bar();  // ❌ TypeError: bar is not a function
var bar = function () { console.log('expr'); };

baz();  // ❌ ReferenceError (TDZ on 'baz')
const baz = () =&gt; console.log('arrow');</code></pre>

<p>Only function <strong>declarations</strong> are fully hoisted. Expressions assigned to <code>var</code> get <code>undefined</code>; assigned to <code>let</code>/<code>const</code> are in TDZ.</p>

<h3>2. Function declarations inside blocks — legacy weirdness</h3>
<pre><code class="language-js">if (true) {
  function foo() { return 1; }
} else {
  function foo() { return 2; }
}
foo();</code></pre>
<p>This behaves differently across strict/sloppy mode and browsers. In strict mode (modules), function declarations are block-scoped. In sloppy mode, browsers implement "Annex B" semantics and hoist them with surprising rules. <strong>Rule: never declare functions inside blocks — use function expressions.</strong></p>

<h3>3. Parameter hoisting precedes the body</h3>
<pre><code class="language-js">function foo(a, b) {
  var a = 99;       // 'a' already exists as parameter, no new binding
  console.log(a, b);
}
foo(1, 2);  // 99 2</code></pre>
<p>Parameters are initialized before <code>var</code> declarations in the Memory Phase. A <code>var</code> with the same name is a no-op declaration (but the assignment at its line runs normally).</p>

<h3>4. <code>let</code>/<code>const</code> in the same block cannot be redeclared</h3>
<pre><code class="language-js">let x = 1;
let x = 2;   // ❌ SyntaxError: Identifier 'x' has already been declared</code></pre>

<p><code>var</code> can be redeclared freely. <code>let</code>/<code>const</code> cannot.</p>

<h3>5. <code>eval</code> creates a new EC (in non-strict) and can inject bindings</h3>
<pre><code class="language-js">function foo() {
  eval('var sneaky = 1');
  console.log(sneaky);  // 1
}
foo();

'use strict';
function bar() {
  eval('var hidden = 1');
  console.log(hidden);  // ❌ ReferenceError in strict mode
}</code></pre>
<p>In non-strict, <code>eval</code> pollutes the calling EC. In strict, <code>eval</code> has its own EC and can't leak. Avoid <code>eval</code> entirely.</p>

<h3>6. Global EC — <code>var</code> attaches to <code>window</code>; <code>let</code>/<code>const</code> do NOT</h3>
<pre><code class="language-js">var a = 1;
let b = 2;
console.log(window.a);  // 1
console.log(window.b);  // undefined</code></pre>
<p>Globals with <code>let</code>/<code>const</code> live on a separate <em>Script</em> environment record, not on <code>globalThis</code>.</p>

<h3>7. ES modules have their own EC — top-level <code>this</code> is <code>undefined</code></h3>
<pre><code class="language-js">// index.html
&lt;script type="module"&gt;
  console.log(this);   // undefined
  var x = 1;
  console.log(window.x); // undefined — modules don't leak to window
&lt;/script&gt;</code></pre>

<h3>8. Classes are hoisted but in TDZ</h3>
<pre><code class="language-js">new Foo();         // ❌ ReferenceError
class Foo {}</code></pre>
<p>Same rule as <code>let</code>/<code>const</code>. Classes are NOT the same as function declarations.</p>

<h3>9. <code>arguments</code> object shares slots with named params (sloppy mode)</h3>
<pre><code class="language-js">function foo(a) {
  arguments[0] = 99;
  console.log(a);   // 99  (sloppy)
}

function bar(a) {
  'use strict';
  arguments[0] = 99;
  console.log(a);   // original value (strict disconnects them)
}</code></pre>
<p>Surprise: in sloppy mode, mutating <code>arguments[i]</code> mutates the named parameter. Strict mode severs this link. Arrow functions don't have <code>arguments</code> at all.</p>

<h3>10. Default parameter values run in their own inner scope</h3>
<pre><code class="language-js">function foo(a, b = a * 2, c = b + 1) {
  console.log(a, b, c);
}
foo(1);         // 1 2 3
foo(1, 10);     // 1 10 11

function bar(a = b, b = 1) {
  return [a, b];
}
bar();          // ❌ ReferenceError — 'b' is in TDZ when 'a' default runs</code></pre>
<p>Default-param expressions are evaluated left-to-right during Memory Phase. Each earlier param is visible to later ones, but not vice versa.</p>

<h3>11. <code>new Function()</code> is its own EC with NO closure over the caller</h3>
<pre><code class="language-js">const x = 5;
const f = new Function('return x');
f();   // ❌ ReferenceError</code></pre>
<p>Unlike <code>function</code> expressions, <code>new Function</code> always runs in global scope — it doesn't capture the lexical scope where it was created.</p>

<h3>12. Errors thrown in Memory Phase are SyntaxErrors</h3>
<pre><code class="language-js">try {
  const x = y; // ok — runtime error
} catch (e) { console.log(1); }

// But:
// let a;
// let a;        // SyntaxError — entire script rejected, no try/catch helps</code></pre>
<p>Syntax errors are detected during parsing (before any EC is pushed). You can't catch them with <code>try/catch</code>. Runtime errors happen during Execution Phase and are catchable.</p>

<h3>13. Stack Overflow</h3>
<pre><code class="language-js">function recurse() { recurse(); }
recurse();   // RangeError: Maximum call stack size exceeded</code></pre>
<p>Each call pushes a new EC; the JS engine enforces a stack size limit (typically 10,000-15,000 frames in V8). Tail-call optimization (TCO) is ONLY implemented in strict-mode Safari. Don't rely on it.</p>

<h3>14. Tail calls don't optimize in Node/Chrome</h3>
<pre><code class="language-js">'use strict';
function count(n) {
  if (n === 0) return;
  return count(n - 1);  // tail call — in theory reuses EC
}
count(100000);  // ❌ stack overflow in V8 anyway</code></pre>
<p>ES6 specifies TCO, but V8 never shipped it (Google decided against it for debuggability). Safari JavaScriptCore has it. Don't write recursive algorithms relying on TCO in browsers.</p>

<h3>15. Hermes (React Native) behaves the same way conceptually</h3>
<p>Hermes is bytecode-based and doesn't have a traditional interpreter loop, but the EC model is the same. TDZ, hoisting, two phases — all identical.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-anti', title: '🐛 Common Bugs & Anti-Patterns', html: `
<h3>Bug 1 — Assuming <code>var</code> is block-scoped</h3>
<pre><code class="language-js">for (var i = 0; i &lt; 3; i++) {
  setTimeout(() =&gt; console.log(i), 0);
}
// Logs: 3, 3, 3   (not 0, 1, 2)</code></pre>
<p>There's ONE <code>i</code> shared by all iterations (function-scoped). By the time the timers fire, the loop has ended and <code>i</code> is <code>3</code>. Fix with <code>let i</code> (new binding per iteration).</p>

<h3>Bug 2 — "I'll log it before declaring, it's fine"</h3>
<pre><code class="language-js">function process() {
  if (condition) {
    console.log(user);   // ❌ TDZ — even though 'user' is declared below
    let user = getUser();
  }
}</code></pre>
<p>TDZ is real. Always declare before use.</p>

<h3>Bug 3 — Accidental globals (non-strict mode)</h3>
<pre><code class="language-js">function bad() {
  name = 'Prakhar';   // no var/let/const — becomes window.name
}
bad();
console.log(window.name);   // 'Prakhar'</code></pre>
<p>Strict mode turns this into a ReferenceError. ES modules are always strict.</p>

<h3>Bug 4 — Shadowing that surprises</h3>
<pre><code class="language-js">var user = 'Admin';
function greet() {
  if (!user) {
    var user = 'Guest';    // hoisted to top of greet, undefined
  }
  console.log('Hi', user);
}
greet();   // Hi Guest   ⚠️</code></pre>
<p>Inside <code>greet</code>, <code>var user</code> is hoisted to the top of the function as <code>undefined</code>. The <code>!user</code> check reads the local <code>undefined</code>, not the outer <code>'Admin'</code>. Shadowing bites here. Fix: use <code>let</code> and don't shadow.</p>

<h3>Bug 5 — Calling arrow function as constructor</h3>
<pre><code class="language-js">const Foo = () =&gt; {};
new Foo();   // ❌ TypeError — arrow can't be used with 'new'</code></pre>
<p>Arrow functions don't have a <code>[[Construct]]</code> internal method. They can't create ECs with <code>this</code> bound to a new object.</p>

<h3>Bug 6 — Assuming <code>this</code> is inherited from module</h3>
<pre><code class="language-js">// ES module
console.log(this);             // undefined (NOT window!)
setTimeout(function () {
  console.log(this);           // window (sloppy) / undefined (strict)
}, 0);</code></pre>
<p>Top-level <code>this</code> in a module is <code>undefined</code>, but a callback invoked later by <code>setTimeout</code> has its own EC and its own <code>this</code>.</p>

<h3>Bug 7 — IIFE with <code>var</code>-pollution</h3>
<pre><code class="language-js">(function () {
  var api = 'https://...';   // scoped to IIFE
})();
console.log(api);  // ❌ ReferenceError — good, IIFE scoped it
</code></pre>
<p>Pre-ES6, IIFEs were the standard way to create scope. Post-ES6, just use <code>let</code>/<code>const</code> in a block or an ES module.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<h3>How this topic gets asked</h3>
<p>Execution Context rarely comes up as "explain execution context". Instead interviewers test it via hoisting puzzles and scope traps. Your job is to <em>walk through the two phases out loud</em> as the interviewer watches.</p>

<h3>Common question shapes</h3>
<ol>
  <li><strong>"What does this code print?"</strong> — hoisting puzzle with <code>var</code>/function/<code>let</code>.</li>
  <li><strong>"Fix the loop/setTimeout trap"</strong> — classic closure-over-var bug.</li>
  <li><strong>"Why does <code>typeof</code> throw here?"</strong> — TDZ check.</li>
  <li><strong>"What's the difference between hoisting and initialization?"</strong> — direct EC model test.</li>
  <li><strong>"Explain how a function call creates a new context"</strong> — whiteboard the stack.</li>
</ol>

<h3>How to answer out loud (script)</h3>
<blockquote>
<p>"Let me walk through the two phases. First, memory creation — I see <code>var</code>, so the engine hoists it as <code>undefined</code>. The function declaration gets its full body. There's a <code>let</code> here, so it's in the TDZ. Now execution phase — line 1 accesses <code>x</code> which is <code>undefined</code>, line 2 calls <code>foo()</code> which pushes a new FEC..." </p>
</blockquote>

<h3>Sample question 1 — Classic hoisting trap</h3>
<pre><code class="language-js">// What prints?
var x = 1;
function foo() {
  console.log(x);
  var x = 2;
}
foo();</code></pre>

<div class="qa-block">
<div class="qa-q">Expected answer</div>
<div class="qa-a">
<p><strong>undefined.</strong> Inside <code>foo</code>'s EC, <code>var x</code> is hoisted to the top as <code>undefined</code>, shadowing the outer <code>x = 1</code>. At the <code>console.log</code> line, the local <code>x</code> is still <code>undefined</code>.</p>
</div>
</div>

<h3>Sample question 2 — Function wins over var in memory phase</h3>
<pre><code class="language-js">console.log(a);
var a = 10;
function a() {}
console.log(a);</code></pre>

<div class="qa-block">
<div class="qa-q">Expected answer</div>
<div class="qa-a">
<p>Memory phase: <code>a → function a() {}</code> (function declaration wins over var).<br>Execution phase: line 1 logs the function. Line 2 assigns <code>10</code>. Line 4 logs <code>10</code>.</p>
<p><strong>Output: <code>[Function: a]</code> then <code>10</code>.</strong></p>
</div>
</div>

<h3>Sample question 3 — TDZ gotcha</h3>
<pre><code class="language-js">let x = 1;
{
  console.log(x);
  let x = 2;
}</code></pre>

<div class="qa-block">
<div class="qa-q">Expected answer</div>
<div class="qa-a">
<p><strong>ReferenceError.</strong> The inner block has its own <code>let x</code>. Memory phase marks it as TDZ. The <code>console.log</code> sees the <em>inner</em> <code>x</code> (not the outer 1), but it's uninitialized — throws.</p>
</div>
</div>

<h3>Sample question 4 — The setTimeout classic</h3>
<pre><code class="language-js">for (var i = 0; i &lt; 3; i++) {
  setTimeout(() =&gt; console.log(i), 100);
}</code></pre>

<div class="qa-block">
<div class="qa-q">Expected answer</div>
<div class="qa-a">
<p>Prints <strong>3, 3, 3</strong>. The loop runs synchronously to completion; <code>i</code> becomes <code>3</code>. All three timer callbacks close over the SAME <code>i</code> (one shared binding). When they finally fire, they all see <code>i === 3</code>.</p>
<p><strong>Fixes:</strong></p>
<ul>
  <li>Use <code>let i</code> — each iteration gets a new binding.</li>
  <li>Wrap in an IIFE that captures <code>i</code> as an argument.</li>
  <li><code>setTimeout(console.log.bind(null, i), 100)</code>.</li>
</ul>
</div>
</div>

<h3>Sample question 5 — Nested scopes + block</h3>
<pre><code class="language-js">function outer() {
  var x = 1;
  if (true) {
    var x = 2;
    let y = 3;
  }
  console.log(x);   // ?
  console.log(y);   // ?
}
outer();</code></pre>

<div class="qa-block">
<div class="qa-q">Expected answer</div>
<div class="qa-a">
<p><strong>x → 2</strong> (var ignores the block — there's ONE <code>x</code> in <code>outer</code>'s EC, reassigned to 2).</p>
<p><strong>y → ReferenceError</strong> (let is block-scoped; <code>y</code> is out of scope here).</p>
</div>
</div>

<h3>Follow-up questions interviewer may ask</h3>
<ul>
  <li>"Can you show me the call stack diagram for this?"</li>
  <li>"What's the difference between TDZ and 'undefined'?"</li>
  <li>"How would you verify there's a fresh EC per function call?" (answer: recursion produces independent stack frames with independent locals.)</li>
  <li>"What happens to an EC when a closure captures it?" (the EC's environment record is kept alive by the closure — not garbage collected.)</li>
  <li>"How does this differ in ES modules vs classic scripts?"</li>
  <li>"Why can you call a function declared below but not a <code>const</code> arrow?"</li>
</ul>

<h3>What this question tests</h3>
<p>Fluency with Execution Context signals you understand:</p>
<ul>
  <li>Hoisting (vars and functions)</li>
  <li>TDZ (lets and classes)</li>
  <li>Scope chain basics</li>
  <li>How closures capture environments</li>
  <li>The mental separation between <em>declaration</em> and <em>initialization</em></li>
</ul>
<p>Mastering this topic makes every subsequent JS question easier. It's the foundation of closures, hoisting, scope, and <code>this</code>.</p>

<div class="callout success">
  <div class="callout-title">✅ Interview checklist before moving on</div>
  <ul>
    <li>Can you name the two phases of EC creation?</li>
    <li>Can you explain why <code>var</code> hoists to <code>undefined</code> but <code>let</code> doesn't?</li>
    <li>Can you predict the output of 3 hoisting traps without running the code?</li>
    <li>Can you draw the call stack at any point during a recursive call?</li>
    <li>Can you explain why function declarations "win" over <code>var</code> in memory phase?</li>
  </ul>
</div>
`}

]});
