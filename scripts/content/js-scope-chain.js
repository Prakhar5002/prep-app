window.PREP_SITE.registerTopic({
  id: 'js-scope-chain',
  module: 'JavaScript Deep',
  title: 'Scope & Scope Chain',
  estimatedReadTime: '25 min',
  tags: ['scope', 'scope-chain', 'lexical-scope', 'hoisting', 'tdz', 'shadowing', 'fundamentals'],
  sections: [

{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p><strong>Scope</strong> is the region of code where an identifier (variable, function, class) is accessible. <strong>The scope chain</strong> is the ordered list of nested scopes the engine searches when looking up an identifier.</p>
<p>JavaScript uses <strong>lexical (static) scoping</strong> — scope is determined by where code is <em>written</em>, not where it's called. A function's scope chain is fixed at definition; calling it from anywhere doesn't change what variables it can see.</p>
<p>Scope types in modern JS: <strong>global</strong>, <strong>module</strong>, <strong>function</strong>, <strong>block</strong> (for <code>let</code>/<code>const</code>/<code>class</code>), and <strong>catch</strong>. <code>var</code> ignores block scope and lives in the nearest function (or global).</p>
<div class="callout insight">
  <div class="callout-title">🧠 One-liner</div>
  <p>The engine walks up the scope chain from innermost outward until it finds the identifier, or reaches the global/module scope and throws <code>ReferenceError</code>.</p>
</div>
`},

{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What is scope?</h3>
<p>Scope answers the question: "From this point in the code, what identifiers can I see?" It's a compile-time concept — the engine knows the scope structure before running code.</p>

<h3>What is the scope chain?</h3>
<p>When you reference a name like <code>count</code>, the engine needs to find <em>which</em> <code>count</code> you mean. It walks a linked list of Lexical Environments:</p>
<div class="diagram">
  Current Lexical Env → Outer Env → Outer's Outer → ... → Global/Module
</div>
<p>At each level it checks "is <code>count</code> defined here?" First match wins. If it reaches the top and still hasn't found it: <code>ReferenceError</code>.</p>

<h3>Why lexical scope?</h3>
<p>Most modern languages use lexical scope (C, Python, Java, Rust, Go). The alternative — <em>dynamic scope</em> (used by early Lisp, Bash, emacs-lisp) — looks up names based on the caller's scope. Lexical scope is:</p>
<ul>
  <li>Easier to reason about (what you see in the file is what you get).</li>
  <li>Faster (the engine can pre-compute scope chains at parse time).</li>
  <li>The foundation of closures.</li>
</ul>

<h3>Scope vs Context</h3>
<p>Two easy-to-confuse concepts:</p>
<ul>
  <li><strong>Scope</strong> — "what variables are visible here?" Determined lexically, by structure.</li>
  <li><strong>Execution Context</strong> — the runtime structure that actually runs a function, including its scope chain PLUS <code>this</code> PLUS <code>arguments</code>.</li>
</ul>
<p>Scope is a subset of what an EC contains.</p>

<h3>Lexical vs Dynamic scope — quick comparison</h3>
<pre><code class="language-js">// JS (lexical)
let x = 10;
function outer() {
  let x = 20;
  inner();
}
function inner() {
  console.log(x);   // 10 — uses global x, because inner is defined in global
}
outer();   // prints 10, NOT 20</code></pre>

<p>Inner's scope chain is [inner → global], not [inner → outer → global]. Where it's <em>written</em> dictates its chain.</p>
`},

{ id: 'scope-types', title: '🪜 All Scope Types', html: `
<h3>1. Global scope</h3>
<pre><code class="language-js">var a = 1;
let b = 2;
const c = 3;</code></pre>

<p>In a classic <code>&lt;script&gt;</code>:</p>
<ul>
  <li><code>var</code> globals attach to <code>window</code>/<code>globalThis</code>.</li>
  <li><code>let</code>/<code>const</code>/<code>class</code> globals live in a separate "Script" record, NOT on <code>window</code>.</li>
</ul>

<p>In ES modules: there is NO global scope in the classic sense. Each module has its own top-level scope.</p>

<h3>2. Module scope (ES modules)</h3>
<pre><code class="language-js">// a.mjs
const secret = 42;
export const util = () =&gt; secret;</code></pre>

<p>Identifiers at the top level of a module are private to that module unless <code>export</code>ed. <code>this</code> at module top-level is <code>undefined</code>.</p>

<h3>3. Function scope</h3>
<pre><code class="language-js">function foo() {
  var a = 1;   // function-scoped
  let b = 2;   // function-scoped (no inner block)
}
// a, b, out of scope here</code></pre>

<p>Function bodies are their own scope. <code>var</code> always lives here (ignoring blocks). Parameters and the implicit <code>arguments</code> object (non-arrow) also live here.</p>

<h3>4. Block scope</h3>
<pre><code class="language-js">{
  let a = 1;
  const b = 2;
  class C {}
  var c = 3;      // but this LEAKS — var ignores blocks
}
console.log(a);   // ReferenceError
console.log(c);   // 3</code></pre>

<p>Blocks (<code>{ }</code>) create scope for <code>let</code>, <code>const</code>, and <code>class</code>. <code>var</code> pretends they don't exist.</p>

<p>Blocks include <code>if</code>, <code>for</code>, <code>while</code>, plain <code>{ }</code>, and <code>switch</code> cases (if you wrap in <code>{ }</code>).</p>

<h3>5. Catch scope (rare)</h3>
<pre><code class="language-js">try { throw new Error(); }
catch (e) {
  // 'e' is scoped to this catch block only
}
console.log(e);   // ReferenceError</code></pre>

<p>The catch parameter has its own mini-scope.</p>

<h3>6. Arrow function scope</h3>
<p>Arrow functions create their own scope for <code>let</code>/<code>const</code>/parameters, but don't create their own <code>this</code> / <code>arguments</code> / <code>super</code> / <code>new.target</code>.</p>

<h3>Visualization</h3>
<div class="diagram">
   [Global/Script]
        │
        ├─ [Module] (if ESM)
        │       │
        │       ├─ [Function: outer]
        │       │       │
        │       │       ├─ [Block: if (true) { ... }]
        │       │       │        └─ let b, const c
        │       │       │
        │       │       └─ [Function: inner]
        │       │                │
        │       │                └─ [Block: for (let i) { ... }]
        │       │                         └─ let i (new binding per iter)
        │       │
        │       └─ [Function: another]
        │
        └─ var globals, function declarations
</div>
`},

{ id: 'mechanics', title: '⚙️ How Lookup Actually Works', html: `
<h3>Lookup algorithm (simplified)</h3>
<p>When the engine needs to resolve identifier <code>x</code>:</p>
<ol>
  <li>Start with the current Lexical Environment's Environment Record.</li>
  <li>Does <code>x</code> exist here?
    <ul>
      <li>Yes, initialized → use it.</li>
      <li>Yes, uninitialized (TDZ) → throw <code>ReferenceError</code>.</li>
      <li>No → continue.</li>
    </ul>
  </li>
  <li>Move to the Outer Environment Reference.</li>
  <li>Repeat until you hit the global env.</li>
  <li>If still not found:
    <ul>
      <li>Reading → <code>ReferenceError</code>.</li>
      <li>Writing in sloppy mode → create a global (ugly!). In strict → <code>ReferenceError</code>.</li>
    </ul>
  </li>
</ol>

<h3>Scope chain is fixed at definition</h3>
<pre><code class="language-js">function createLogger() {
  const tag = '[LOG]';
  return (msg) =&gt; console.log(tag, msg);
}
const log = createLogger();
log('hi');   // [LOG] hi

// Even if called elsewhere:
(function () {
  const tag = '[IGNORED]';
  log('hi');   // Still: [LOG] hi
})();</code></pre>

<p><code>log</code>'s scope chain was fixed inside <code>createLogger</code>. The call site's <code>tag</code> is irrelevant.</p>

<h3>Shadowing</h3>
<pre><code class="language-js">const x = 1;
function f() {
  const x = 2;   // shadows outer x
  return x;
}
f();   // 2</code></pre>

<p>The inner binding takes priority. The outer isn't hidden permanently — it's just not found first.</p>

<h3>Illegal shadowing</h3>
<pre><code class="language-js">function f() {
  let x = 1;
  {
    var x = 2;   // ❌ SyntaxError — var crosses block and collides with let
  }
}</code></pre>

<p><code>var</code> inside a block tries to register in the function scope, where <code>let x</code> already exists. Collision → SyntaxError.</p>

<h3>Reading vs writing an undeclared identifier</h3>
<pre><code class="language-js">// Sloppy mode
function bad() {
  y = 5;   // creates window.y!
}
bad();
console.log(window.y);   // 5

// Strict mode (and modules)
'use strict';
function bad() {
  y = 5;   // ❌ ReferenceError
}</code></pre>

<p>This is why strict mode / modules are preferred — no accidental globals.</p>
`},

{ id: 'examples', title: '📦 Examples (progressive)', html: `
<h3>Example 1 — Basic chain lookup</h3>
<pre><code class="language-js">let a = 10;
function outer() {
  let b = 20;
  function inner() {
    console.log(a, b);   // 10 20
  }
  inner();
}
outer();</code></pre>

<p><code>inner</code>'s chain: [inner → outer → global]. <code>a</code> found in global; <code>b</code> found in outer.</p>

<h3>Example 2 — Shadowing</h3>
<pre><code class="language-js">let a = 10;
function outer() {
  let a = 20;
  function inner() {
    return a;   // 20 — inner's chain finds outer's a first
  }
  return inner();
}
outer();   // 20</code></pre>

<h3>Example 3 — Returning a closure; scope preserved</h3>
<pre><code class="language-js">function outer() {
  let a = 20;
  return function inner() {
    console.log(a);
  };
}
const fn = outer();
fn();   // 20</code></pre>

<p><code>inner</code>'s scope chain includes outer's environment. Even though <code>outer</code> returned, its environment is retained via <code>inner</code>'s reference.</p>

<h3>Example 4 — Scope is defined at creation, not at call</h3>
<pre><code class="language-js">let a = 10;
function outer() {
  let a = 20;
  return function inner() { console.log(a); };
}
let a2 = 30;   // unrelated
const fn = outer();
fn();   // 20 — inner sees outer's 'a', not anything later</code></pre>

<h3>Example 5 — Function declarations hoist; scope chain uses the declared version</h3>
<pre><code class="language-js">greet();   // 'hi'
function greet() { console.log('hi'); }</code></pre>

<p>Function declarations are added to the scope in the memory phase. The call works even before the source line.</p>

<h3>Example 6 — Block scope vs function scope</h3>
<pre><code class="language-js">function f() {
  for (let i = 0; i &lt; 3; i++) {}
  console.log(i);   // ReferenceError — i was block-scoped

  for (var j = 0; j &lt; 3; j++) {}
  console.log(j);   // 3 — var leaks out
}</code></pre>

<h3>Example 7 — Nested closure</h3>
<pre><code class="language-js">function a() {
  let x = 1;
  function b() {
    let y = 2;
    function c() {
      let z = 3;
      return x + y + z;
    }
    return c;
  }
  return b();
}
a()();   // 6</code></pre>

<p><code>c</code>'s chain: [c → b → a → global]. All three variables resolved.</p>

<h3>Example 8 — Catch scope</h3>
<pre><code class="language-js">try { throw new Error('x'); }
catch (e) {
  console.log(e.message);   // 'x'
  let y = 5;
}
console.log(y);   // ReferenceError
console.log(e);   // ReferenceError</code></pre>

<h3>Example 9 — var in a block leaks to function</h3>
<pre><code class="language-js">function f() {
  if (true) {
    var a = 1;
  }
  console.log(a);   // 1
}
f();</code></pre>

<h3>Example 10 — Late mutation visible through scope</h3>
<pre><code class="language-js">let ref;
function makeReader() {
  let val = 10;
  ref = () =&gt; val;   // save the closure to outer variable
  val = 20;            // mutate after closure formed
}
makeReader();
ref();   // 20 — closure sees current value of 'val'</code></pre>

<h3>Example 11 — Loop body scope</h3>
<pre><code class="language-js">for (let i = 0; i &lt; 3; i++) {
  let copy = i;
  setTimeout(() =&gt; console.log(copy), 100);
}
// 0 1 2 — each iteration has its own 'copy'</code></pre>

<p>The spec says each iteration of <code>for (let ...)</code> creates a NEW lexical environment for the loop body. Any <code>let</code>/<code>const</code> inside also gets a new binding per iteration.</p>

<h3>Example 12 — Named function expression scope</h3>
<pre><code class="language-js">const factorial = function fact(n) {
  return n &lt;= 1 ? 1 : n * fact(n - 1);   // 'fact' is in scope inside
};
console.log(factorial(5));
console.log(fact);   // ❌ ReferenceError — 'fact' only in its own body</code></pre>

<p>Named function expressions bind their name in a scope accessible only inside the function body. Useful for recursion without relying on the outer variable.</p>
`},

{ id: 'edge-cases', title: '🔍 All Edge Cases', html: `
<h3>1. TDZ for <code>let</code>/<code>const</code></h3>
<pre><code class="language-js">{
  console.log(x);   // ❌ ReferenceError (TDZ)
  let x = 5;
}</code></pre>

<p>The binding exists in the block's scope from its start, but is uninitialized until the declaration line. Accessing it throws.</p>

<h3>2. TDZ in parameters</h3>
<pre><code class="language-js">function f(a = b, b = 1) { return [a, b]; }
f();   // ❌ ReferenceError — 'b' is in TDZ when 'a' default runs</code></pre>

<h3>3. TDZ bypasses <code>typeof</code></h3>
<pre><code class="language-js">{
  console.log(typeof x);   // ❌ ReferenceError (not 'undefined')
  let x;
}

console.log(typeof undeclared);   // 'undefined' — no TDZ for truly undeclared</code></pre>

<h3>4. <code>var</code> in global attaches to <code>window</code></h3>
<pre><code class="language-js">var a = 1;
let b = 2;
console.log(window.a);   // 1
console.log(window.b);   // undefined</code></pre>

<h3>5. <code>eval</code> and scope</h3>
<pre><code class="language-js">function f() {
  eval('var x = 1');
  console.log(x);   // 1 (sloppy)
}
'use strict';
function g() {
  eval('var x = 1');
  console.log(x);   // ReferenceError (strict: eval has its own scope)
}</code></pre>

<h3>6. <code>with</code> statement (forbidden in strict)</h3>
<pre><code class="language-js">// Sloppy mode only — disallowed in strict/modules
const obj = { x: 1 };
with (obj) {
  console.log(x);   // 1 — treats obj as a scope
}</code></pre>

<p><code>with</code> dynamically inserts an object into the scope chain. Prevents static optimization. Avoid.</p>

<h3>7. Function declaration inside a block (Annex B)</h3>
<pre><code class="language-js">if (true) {
  function foo() {}    // behavior varies by strict/sloppy and browser
}
foo();   // Maybe works (sloppy, browser Annex B), maybe throws</code></pre>

<p>Avoid declaring functions in blocks. Use expressions.</p>

<h3>8. <code>let</code> in a for-loop creates a NEW binding per iteration</h3>
<pre><code class="language-js">const fns = [];
for (let i = 0; i &lt; 3; i++) {
  fns.push(() =&gt; i);
}
fns.map(f =&gt; f());   // [0, 1, 2]</code></pre>

<p>Special spec rule. Each iteration gets a fresh <code>i</code>.</p>

<h3>9. <code>for...in</code> and <code>for...of</code> with <code>let</code>/<code>var</code></h3>
<pre><code class="language-js">const arr = [10, 20, 30];
for (var x of arr) {}
console.log(x);   // 30 — var leaks

for (let y of arr) {}
console.log(y);   // ReferenceError</code></pre>

<h3>10. Destructuring creates scope declarations</h3>
<pre><code class="language-js">function f({ a, b } = {}) {
  return a + b;
}
// 'a' and 'b' are parameter-scoped</code></pre>

<h3>11. Catch without a binding (ES2019+)</h3>
<pre><code class="language-js">try {} catch { /* no binding needed */ }</code></pre>

<h3>12. Optional catch binding and TDZ</h3>
<pre><code class="language-js">try { throw 1; }
catch (e) {
  console.log(e);   // 1
  // Binding is limited to this block
}</code></pre>

<h3>13. Function declaration as a value (sloppy Annex B)</h3>
<p>In sloppy mode, browsers may allow function declarations to leak into the enclosing function scope. In strict: block-scoped. Always test.</p>

<h3>14. <code>class</code> declarations are block-scoped and in TDZ</h3>
<pre><code class="language-js">new Foo();      // ❌ ReferenceError
class Foo {}</code></pre>

<h3>15. Globals shared across <code>&lt;script&gt;</code> tags</h3>
<pre><code class="language-html">&lt;script&gt;var x = 1;&lt;/script&gt;
&lt;script&gt;console.log(x);&lt;/script&gt;   // 1 — shared global</code></pre>

<p>But modules are isolated:</p>
<pre><code class="language-html">&lt;script type="module"&gt;let x = 1;&lt;/script&gt;
&lt;script type="module"&gt;console.log(x);&lt;/script&gt;   // ReferenceError</code></pre>

<h3>16. Closure captures the scope record, not copies</h3>
<pre><code class="language-js">let val = 1;
const fn = () =&gt; val;
val = 99;
fn();   // 99 — captures binding, reads current value</code></pre>

<h3>17. Arrow function inherits scope but creates its own for its body</h3>
<pre><code class="language-js">const f = (x) =&gt; {
  const y = x * 2;
  return y;
};
// 'y' is local to f's body, not visible outside</code></pre>

<h3>18. Hoisted function can reference variables declared later</h3>
<pre><code class="language-js">foo();   // 10 — works!
function foo() { console.log(a); }
var a = 10;</code></pre>

<p>Because <code>foo</code> is called after <code>a</code>'s initialization line (sort of... let me re-check). Actually: <code>foo()</code> runs at the top. Inside, <code>a</code> is hoisted as <code>undefined</code>. Does it print 10? Let's trace:</p>
<ol>
  <li>Memory phase: <code>foo</code> fully hoisted; <code>a</code> hoisted as <code>undefined</code>.</li>
  <li>Execution phase line 1: <code>foo()</code> — inside, <code>a</code> is referenced. In GEC, <code>a</code> is <code>undefined</code>. Prints <code>undefined</code>.</li>
</ol>

<p>Actually the output is <code>undefined</code> — my initial claim was wrong. Careful with hoisting!</p>
`},

{ id: 'bugs-anti', title: '🐛 Common Bugs & Anti-Patterns', html: `
<h3>Bug 1 — Accidental global write</h3>
<pre><code class="language-js">function setConfig() {
  config = { api: 'x' };   // no var — becomes global (sloppy)
}
setConfig();
window.config;   // exists</code></pre>

<p>Strict mode throws here. Always use strict (ES modules do it for you).</p>

<h3>Bug 2 — TDZ access from async</h3>
<pre><code class="language-js">setTimeout(() =&gt; console.log(x), 0);
let x = 5;
// Actually works — by the time the timer fires, x is initialized</code></pre>

<p>But:</p>
<pre><code class="language-js">const x = { get y() { return hidden; } };
console.log(x.y);    // ReferenceError
let hidden = 10;</code></pre>

<p>TDZ trips you up when you access synchronously before the <code>let</code> line.</p>

<h3>Bug 3 — Shadowing makes outer unreachable</h3>
<pre><code class="language-js">let user = 'admin';
function greet() {
  let user = 'guest';
  console.log(user);   // 'guest'
  // How to access outer 'user'? You can't, directly.
}</code></pre>

<h3>Bug 4 — Misusing <code>var</code> in a loop</h3>
<pre><code class="language-js">const fns = [];
for (var i = 0; i &lt; 3; i++) fns.push(() =&gt; i);
fns.map(f =&gt; f());   // [3, 3, 3]</code></pre>

<h3>Bug 5 — Polluting global via <code>this</code> in sloppy callback</h3>
<pre><code class="language-js">function f() {
  this.x = 5;   // ❌ sloppy: this = window → window.x = 5
}
f();</code></pre>

<h3>Bug 6 — Confusing var hoisting with initialization</h3>
<pre><code class="language-js">console.log(a);   // undefined (NOT ReferenceError)
var a = 10;
console.log(a);   // 10</code></pre>

<p>"Hoisted to undefined" means the variable exists but has no value yet.</p>

<h3>Bug 7 — Expecting block scope from <code>var</code></h3>
<pre><code class="language-js">function f() {
  if (true) {
    var a = 1;
  }
  return a;   // 1 — not block scoped!
}</code></pre>

<h3>Bug 8 — Declaring a <code>class</code> before first use</h3>
<pre><code class="language-js">const instance = new Foo();   // ReferenceError
class Foo {}</code></pre>

<p>Classes are block-scoped and in TDZ. Always declare before use.</p>
`},

{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<h3>Common ask formats</h3>
<ol>
  <li>"What will this print?" — scope traversal puzzle.</li>
  <li>"Fix the closure trap." — var in a loop.</li>
  <li>"What's the difference between <code>var</code>, <code>let</code>, <code>const</code>?"</li>
  <li>"Explain lexical scope."</li>
  <li>"Can you access an outer variable after the outer function returns?" (Closure explanation.)</li>
</ol>

<h3>Sample 1 — Shadowing</h3>
<pre><code class="language-js">let x = 10;
function outer() {
  let x = 20;
  function inner() { console.log(x); }
  inner();
}
outer();   // ?</code></pre>

<div class="qa-block">
<div class="qa-q">Expected answer</div>
<div class="qa-a">
<p><strong>20</strong>. <code>inner</code>'s scope chain is [inner → outer → global]. It finds <code>x = 20</code> in outer first.</p>
</div>
</div>

<h3>Sample 2 — Lexical not dynamic</h3>
<pre><code class="language-js">let x = 1;
function outer() {
  let x = 2;
  inner();
}
function inner() { console.log(x); }
outer();   // ?</code></pre>

<div class="qa-block">
<div class="qa-q">Expected answer</div>
<div class="qa-a">
<p><strong>1</strong>. <code>inner</code> is defined in global scope. Its chain is [inner → global]. It never sees outer's <code>x = 2</code> because outer is not in its chain.</p>
</div>
</div>

<h3>Sample 3 — Var leakage from for-loop</h3>
<pre><code class="language-js">for (var i = 0; i &lt; 3; i++) {}
console.log(i);   // ?</code></pre>

<div class="qa-block">
<div class="qa-q">Expected answer</div>
<div class="qa-a">
<p><strong>3</strong>. <code>var i</code> leaks to the enclosing function/global scope. After the loop ends (<code>i = 3</code>), <code>i</code> is still accessible.</p>
</div>
</div>

<h3>Sample 4 — var in an if-block</h3>
<pre><code class="language-js">function f() {
  if (true) {
    var a = 1;
    let b = 2;
  }
  console.log(a);   // ?
  console.log(b);   // ?
}
f();</code></pre>

<div class="qa-block">
<div class="qa-q">Expected answer</div>
<div class="qa-a">
<p><strong>1, ReferenceError.</strong> <code>var a</code> leaks to function scope. <code>let b</code> is block-scoped.</p>
</div>
</div>

<h3>Sample 5 — Closure + loop</h3>
<pre><code class="language-js">const fns = [];
for (let i = 0; i &lt; 3; i++) {
  fns.push(() =&gt; i);
}
fns.map(f =&gt; f());   // ?</code></pre>

<div class="qa-block">
<div class="qa-q">Expected answer</div>
<div class="qa-a">
<p><strong>[0, 1, 2]</strong>. <code>let i</code> creates a new binding per iteration. Each closure captures a different <code>i</code>.</p>
<p>Change <code>let</code> to <code>var</code> → <strong>[3, 3, 3]</strong>.</p>
</div>
</div>

<h3>Sample 6 — Nested scope + TDZ</h3>
<pre><code class="language-js">let a = 1;
function f() {
  console.log(a);
  let a = 2;
}
f();   // ?</code></pre>

<div class="qa-block">
<div class="qa-q">Expected answer</div>
<div class="qa-a">
<p><strong>ReferenceError (TDZ)</strong>. The inner <code>let a</code> creates a binding at the top of the function; it's in TDZ until the declaration line. The <code>console.log</code> sees the inner <code>a</code> (shadowing the outer), uninitialized → throws.</p>
</div>
</div>

<h3>Sample 7 — Explain lexical scope to a junior</h3>
<div class="qa-block">
<div class="qa-q">Acceptable answer</div>
<div class="qa-a">
<p>"Lexical scope means a function's access to variables is determined by where the function is <em>written</em> in the source code, not where it's <em>called</em>. You can see what a function has access to just by looking at the code — no need to trace calls."</p>
<p>"For example: if I define a function inside another, the inner one can see the outer one's variables. Even if I return the inner function and call it elsewhere, it still sees those variables because its scope is fixed at definition."</p>
</div>
</div>

<h3>Sample 8 — When does a variable go out of scope?</h3>
<div class="qa-block">
<div class="qa-q">Expected answer</div>
<div class="qa-a">
<p>"A variable leaves active scope when execution exits its enclosing block/function. But if a closure (inner function) references it, its environment record stays alive — not technically "in scope" for outer code, but reachable via the closure. GC can't reclaim it until the closure is also unreachable."</p>
</div>
</div>

<h3>Follow-ups</h3>
<ul>
  <li>"What's the difference between scope chain and prototype chain?" (Scope chain is compile-time variable lookup. Prototype chain is runtime property lookup on objects.)</li>
  <li>"Why does <code>var</code> leak out of blocks?" (Historical — designed before block scope existed. <code>let</code>/<code>const</code> fixed it.)</li>
  <li>"Can a nested function modify an outer variable?" (Yes, as long as it's not <code>const</code>.)</li>
  <li>"What's the performance cost of deep scope chains?" (Each lookup walks upward — but V8 caches lookups. Usually negligible.)</li>
  <li>"How do ES modules affect scope?" (Each module is its own scope; no leakage; <code>import</code>/<code>export</code> control what crosses.)</li>
</ul>

<div class="callout success">
  <div class="callout-title">✅ Master checklist</div>
  <ul>
    <li>Can you list all scope types (global, module, function, block, catch)?</li>
    <li>Can you explain lexical scope and contrast it with dynamic scope?</li>
    <li>Can you predict which scope a variable resolves to in a nested example?</li>
    <li>Do you know the <code>var</code> vs <code>let</code> vs <code>const</code> differences cold?</li>
    <li>Can you draw the scope chain diagram for any function?</li>
  </ul>
</div>
`}

]});
