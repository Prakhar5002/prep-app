window.PREP_SITE.registerTopic({
  id: 'js-closures',
  module: 'JavaScript Deep',
  title: 'Closures',
  estimatedReadTime: '30 min',
  tags: ['closures', 'lexical-scope', 'memory', 'functional-patterns', 'react-hooks', 'fundamentals'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>A <strong>closure</strong> is a function together with the lexical environment it was born in — the variables it can "see" from its surrounding scope. When the outer function returns, those variables <em>don't disappear</em> if an inner function still references them; they're kept alive inside the closure.</p>
<p>Every JS function technically <em>is</em> a closure (it remembers where it was defined). The term matters when the inner function <strong>escapes</strong> its birthplace — returned, passed to an event handler, scheduled on a timer — and continues to access outer-scope variables.</p>
<div class="callout insight">
  <div class="callout-title">🧠 One-liner</div>
  <p>Closure = function + its lexical environment reference, captured at <em>creation time</em>, kept alive as long as the function reference exists.</p>
</div>
<p>Closures power: data privacy, currying, memoization, React hooks (useState, useEffect dependencies), event handlers, module patterns, once-only functions, rate limiters, and more.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What is a closure?</h3>
<p>MDN's definition: "A closure is the combination of a function bundled together with references to its surrounding state (the lexical environment)."</p>
<p>Another angle: a closure is the mechanism by which an inner function <strong>retains access</strong> to variables in an outer scope, even after that outer scope has <em>finished executing</em>.</p>

<h3>Why does it work?</h3>
<p>Recall the Execution Context: every EC has a Variable Environment + an Outer Environment Reference. When a function is created, the engine stores a reference to the enclosing lexical environment on the function object itself (internally: <code>[[Environment]]</code>). When the function is later called from anywhere, its new EC's Outer Environment is set to this stored reference — <em>not</em> to the caller's environment.</p>

<p>That's why closures work: the function carries its birth scope with it wherever it goes.</p>

<h3>Why is this useful?</h3>
<ul>
  <li><strong>Encapsulation</strong> — private variables accessible only via specific methods.</li>
  <li><strong>Memoization</strong> — cache results in a variable that persists between calls.</li>
  <li><strong>Partial application / currying</strong> — bake in arguments for later use.</li>
  <li><strong>Callbacks</strong> — preserve context when passing functions around.</li>
  <li><strong>React hooks</strong> — useState's setter closes over React's internal fiber; useEffect callback closes over props/state.</li>
</ul>

<h3>Why does garbage collection not reclaim the outer scope?</h3>
<p>Because the inner function still holds a reference to it through <code>[[Environment]]</code>. GC can only reclaim <em>unreachable</em> objects. As long as the closure exists, its captured environment is reachable.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🪜 Mental Model', html: `
<h3>The backpack metaphor</h3>
<p>Every function carries a <em>backpack</em> — the variables from the scope it was defined in. When called, it unpacks that backpack alongside the new local scope. This is the closure.</p>

<div class="diagram">
  Defined inside outer():
  ┌──────────────────┐      backpack
  │ function inner() │ ──► { count, outer scope ... }
  │  { count++; }    │
  └──────────────────┘

  Later, outer() has returned but inner() is called somewhere else:
  ┌──────────────────┐
  │ inner()          │  opens its backpack, sees count still alive
  │   count++        │
  └──────────────────┘
</div>

<h3>Lexical environment chain</h3>
<p>A closure isn't just ONE scope — it's the whole chain of parent environments up to global.</p>

<div class="diagram">
  function outer() {
    const a = 1;
    function middle() {
      const b = 2;
      function inner() {
        const c = 3;
        // Can see: a (outer), b (middle), c (inner), + globals
      }
      return inner;
    }
    return middle();
  }

  inner's environment chain:
  [inner EC: c] → [middle EC: b] → [outer EC: a] → [global]
</div>

<p>When <code>inner</code> is returned out, the whole chain stays alive — <em>as long as inner is reachable</em>.</p>

<h3>The "is it a closure?" test</h3>
<p>Strictly: every function is a closure. Casually: we say "a closure is formed" when the inner function <em>references</em> outer variables AND is <em>used outside</em> its birthplace.</p>

<pre><code class="language-js">function outer() {
  const x = 10;
  return function () { return x; };   // closure — uses x after outer returns
}</code></pre>

<p>Versus:</p>

<pre><code class="language-js">function outer() {
  const x = 10;
  return function () { return 0; };   // technically a closure, but doesn't USE x
                                      // engines may optimize away the x reference
}</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Step-by-Step Mechanics', html: `
<h3>Formation in the engine</h3>
<p>When the engine executes a function <em>declaration</em> or <em>expression</em>, it:</p>
<ol>
  <li>Creates the function object.</li>
  <li>Sets the function's internal <code>[[Environment]]</code> slot to the current Lexical Environment.</li>
  <li>Returns or stores the function.</li>
</ol>

<p>Later, when this function is <em>called</em>:</p>
<ol>
  <li>A new Execution Context is created.</li>
  <li>Its Outer Environment reference is set to the function's stored <code>[[Environment]]</code> — NOT the caller's environment.</li>
  <li>The function body runs. Identifier lookups walk this chain.</li>
</ol>

<div class="callout insight">
  <div class="callout-title">🔥 Key insight</div>
  <p>Closures are about the <em>definition site</em>, not the <em>call site</em>. A function inherits its scope from where it was written, not where it's invoked.</p>
</div>

<h3>Captured by reference, not by value</h3>
<pre><code class="language-js">let x = 10;
const log = () =&gt; console.log(x);
x = 20;
log();   // 20 — captures the binding, sees current value</code></pre>

<p>Closures capture the <strong>binding</strong>, not the <strong>value</strong>. Variables can be reassigned and the closure sees the latest.</p>

<h3>Each function call creates new captures</h3>
<pre><code class="language-js">function makeCounter() {
  let count = 0;
  return () =&gt; ++count;
}
const a = makeCounter();
const b = makeCounter();
a();   // 1
a();   // 2
b();   // 1   — b has its OWN count
a();   // 3</code></pre>

<p>Each call to <code>makeCounter</code> creates a <strong>new Execution Context</strong> with its own <code>count</code>. The returned closure captures THAT specific <code>count</code>, not a shared one.</p>

<h3>What can a closure see?</h3>
<ul>
  <li>Its own local variables.</li>
  <li>All enclosing functions' variables (up the chain).</li>
  <li>Module/global scope.</li>
</ul>

<p>What it CAN'T see:</p>
<ul>
  <li>Variables of the caller (only the definer).</li>
  <li>Variables declared AFTER it in the same scope (runtime order matters for initialization, though the binding exists).</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '📦 Examples (progressive)', html: `
<h3>Example 1 — The basic counter</h3>
<pre><code class="language-js">function outer() {
  let count = 0;
  function inner() {
    count++;
    console.log(count);
  }
  return inner;
}
const fn = outer();
fn();   // 1
fn();   // 2
fn();   // 3</code></pre>

<h4>🔍 What's happening</h4>
<ol>
  <li><code>outer()</code> runs, creates a new EC with <code>count = 0</code>.</li>
  <li><code>inner</code> is defined; its <code>[[Environment]]</code> points to outer's lexical environment (the one with <code>count</code>).</li>
  <li><code>outer()</code> returns <code>inner</code>. Outer's EC is popped off the stack — but <em>its environment record is not garbage collected</em> because <code>inner</code> still references it.</li>
  <li>Each <code>fn()</code> call creates a new EC for <code>inner</code>, whose outer reference leads back to the captured <code>count</code>. Incrementing that binding persists across calls.</li>
</ol>

<h3>Example 2 — Independent closures from the same factory</h3>
<pre><code class="language-js">function outer() {
  let x = 10;
  return function () { return x; };
}
const fn1 = outer();
const fn2 = outer();
console.log(fn1 === fn2);   // false — different function objects
console.log(fn1());          // 10
console.log(fn2());          // 10 — different x, different closure</code></pre>

<p>Each call to <code>outer</code> creates a separate lexical environment with its own <code>x</code>. Critically: modifying <code>fn1</code>'s <code>x</code> doesn't affect <code>fn2</code>'s.</p>

<h3>Example 3 — The <code>for var</code> closure trap</h3>
<pre><code class="language-js">for (var i = 0; i &lt; 3; i++) {
  setTimeout(() =&gt; console.log(i), 100);
}
// 3, 3, 3</code></pre>

<h4>Why?</h4>
<ol>
  <li><code>var</code> is function-scoped. There's ONE <code>i</code> shared across all loop iterations.</li>
  <li>All three arrow-function closures capture the SAME <code>i</code> binding.</li>
  <li>The loop completes synchronously; <code>i</code> becomes <code>3</code>.</li>
  <li>When the timers fire (100ms later), all three closures read <code>i === 3</code>.</li>
</ol>

<h3>Example 3a — The <code>let</code> fix</h3>
<pre><code class="language-js">for (let i = 0; i &lt; 3; i++) {
  setTimeout(() =&gt; console.log(i), 100);
}
// 0, 1, 2</code></pre>

<p><code>let</code> creates a <strong>new binding per iteration</strong>. Each closure captures its own <code>i</code> — one with value 0, one with 1, one with 2. This is a special rule defined by the spec for <code>for</code> loops with <code>let</code>/<code>const</code>.</p>

<h3>Example 3b — IIFE alternative</h3>
<pre><code class="language-js">for (var i = 0; i &lt; 3; i++) {
  ((j) =&gt; {
    setTimeout(() =&gt; console.log(j), 100);
  })(i);
}
// 0, 1, 2</code></pre>

<p>The IIFE creates a new function scope per iteration, capturing the current <code>i</code> as its parameter <code>j</code>.</p>

<h3>Example 4 — Data privacy (module pattern)</h3>
<pre><code class="language-js">function createUser(name) {
  let loginCount = 0;
  return {
    getName: () =&gt; name,
    login: () =&gt; ++loginCount,
    getLogins: () =&gt; loginCount
  };
}
const u = createUser('Prakhar');
u.login();
u.login();
console.log(u.getLogins());  // 2
console.log(u.loginCount);   // undefined — private!</code></pre>

<p><code>loginCount</code> is closed over, so the methods can read/mutate it. Nothing outside the returned object can touch it. This is JS's pre-class way of doing private state.</p>

<h3>Example 5 — Memoization</h3>
<pre><code class="language-js">function memoize(fn) {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const slowSquare = (n) =&gt; {
  // imagine this is expensive
  return n * n;
};
const fastSquare = memoize(slowSquare);
fastSquare(5);   // 25 — computed
fastSquare(5);   // 25 — from cache</code></pre>

<p><code>cache</code> is closed over. Each call to <code>memoize</code> creates its own private cache. The returned function can access it forever.</p>

<h3>Example 6 — Currying</h3>
<pre><code class="language-js">const curry = (fn) =&gt; {
  return function curried(...args) {
    if (args.length &gt;= fn.length) return fn.apply(this, args);
    return (...more) =&gt; curried.apply(this, args.concat(more));
  };
};

const add = (a, b, c) =&gt; a + b + c;
const curriedAdd = curry(add);

curriedAdd(1)(2)(3);   // 6
curriedAdd(1, 2)(3);   // 6
curriedAdd(1)(2, 3);   // 6</code></pre>

<p>Each partial application creates a new closure holding the collected arguments so far.</p>

<h3>Example 7 — once()</h3>
<pre><code class="language-js">const once = (fn) =&gt; {
  let done = false;
  let result;
  return function (...args) {
    if (!done) {
      done = true;
      result = fn.apply(this, args);
    }
    return result;
  };
};

const initApp = once(() =&gt; console.log('app init'));
initApp();   // 'app init'
initApp();   // (nothing)
initApp();   // (nothing)</code></pre>

<h3>Example 8 — Debounce using closure</h3>
<pre><code class="language-js">function debounce(fn, delay) {
  let timerId;
  return function (...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() =&gt; fn.apply(this, args), delay);
  };
}

const search = debounce((q) =&gt; console.log('searching', q), 300);
search('a'); search('ap'); search('app');
// After 300ms of silence: 'searching app'</code></pre>

<p><code>timerId</code> lives in the closure across every invocation of the returned function.</p>

<h3>Example 9 — Event handlers holding state</h3>
<pre><code class="language-js">function attachClickCounter(button) {
  let clicks = 0;
  button.addEventListener('click', () =&gt; {
    clicks++;
    button.textContent = \`Clicked \${clicks} times\`;
  });
}</code></pre>

<p>The handler closes over <code>clicks</code> and <code>button</code>. State persists across clicks without globals.</p>

<h3>Example 10 — React hook patterns (closures at work)</h3>
<pre><code class="language-js">function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() =&gt; {
    const id = setInterval(() =&gt; {
      console.log('Count is', count);   // ⚠️ closes over 'count' at mount time
    }, 1000);
    return () =&gt; clearInterval(id);
  }, []);

  return (
    &lt;button onClick={() =&gt; setCount(count + 1)}&gt;{count}&lt;/button&gt;
  );
}</code></pre>

<p>The <code>setInterval</code> callback closes over <code>count</code> <em>from the first render</em>. Because <code>useEffect</code>'s dep array is empty, the effect runs once; the interval never gets a new <code>count</code>. This is the infamous <strong>stale closure</strong> bug. Fix with functional updater: <code>setCount(c =&gt; c + 1)</code>, or add <code>count</code> to the dep array (and restart the interval).</p>

<h3>Example 11 — Accidental closure over DOM</h3>
<pre><code class="language-js">function bind() {
  const bigData = new Array(1_000_000).fill('x');
  const btn = document.getElementById('btn');
  btn.addEventListener('click', () =&gt; {
    console.log('clicked');
    // doesn't USE bigData, but still closes over it
  });
}
bind();</code></pre>

<p>Even though <code>bigData</code> isn't referenced in the handler, engines sometimes can't prove it's unused (especially when <code>eval</code> or <code>with</code> are present — not here). Modern V8 does scope analysis and strips unused captures. Still: if it references ANY variable in <code>bind</code>'s scope, the entire scope record can be retained.</p>

<h3>Example 12 — Closure with <code>this</code></h3>
<pre><code class="language-js">function User(name) {
  this.name = name;
  this.greet = function () {
    return () =&gt; \`Hi \${this.name}\`;
  };
}
const u = new User('Prakhar');
const greeter = u.greet();
greeter();   // "Hi Prakhar"</code></pre>

<p>The returned arrow closes over both <code>name</code> (via lexical scope) and <code>this</code> (via the arrow's lexical <code>this</code> inheritance). Without the arrow — with a regular function — <code>this</code> would be undefined when greeter is called standalone.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🔍 All Edge Cases', html: `
<h3>1. Closure over a <code>let</code> in a loop — per-iteration binding</h3>
<p>Already covered: <code>for (let i = 0; i &lt; 3; i++)</code> creates a new binding per iteration. This is a special-case spec rule. Outside <code>for</code> loops, <code>let</code> follows normal block-scope rules (one binding per block).</p>

<h3>2. Closure over <code>const</code></h3>
<pre><code class="language-js">const x = 1;
const fn = () =&gt; x;
fn();   // 1</code></pre>
<p>Works identically — closures capture <em>bindings</em>, and <code>const</code> bindings can still be observed; they just can't be reassigned.</p>

<h3>3. Closing over a mutated <code>const</code> object</h3>
<pre><code class="language-js">const state = { count: 0 };
const inc = () =&gt; state.count++;
inc(); inc();
console.log(state.count);   // 2</code></pre>
<p><code>const</code> protects the binding, not the contents. The closure sees the latest object state.</p>

<h3>4. The function itself is the captured thing</h3>
<pre><code class="language-js">function outer() {
  let f = () =&gt; 1;
  const g = () =&gt; f();
  f = () =&gt; 2;
  return g;
}
outer()();   // 2</code></pre>
<p><code>g</code> closes over the <em>binding</em> <code>f</code>, not a snapshot of it. By the time g is called, f points to the second arrow.</p>

<h3>5. Closures retain the ENTIRE scope, not just used variables — unless optimized</h3>
<pre><code class="language-js">function outer() {
  const heavy = new Array(1_000_000);
  const notHeavy = 42;
  return () =&gt; notHeavy;
}
const fn = outer();</code></pre>
<p>In theory, <code>fn</code> only needs <code>notHeavy</code>. Modern V8 performs scope analysis and trims out unused captures. But <code>eval</code>, <code>with</code>, or dynamic property access (<code>this[x]</code>) can defeat the optimization and retain the whole scope.</p>

<h3>6. Circular closures (A &lt;-&gt; B referencing each other)</h3>
<pre><code class="language-js">function make() {
  let a, b;
  a = () =&gt; b();
  b = () =&gt; a();
  return { a, b };
}</code></pre>
<p>Valid. GC tracks reachability, not reference count; both can still be collected if nothing external holds them.</p>

<h3>7. Closure formed by <code>new Function()</code></h3>
<pre><code class="language-js">function outer() {
  const x = 10;
  const fn = new Function('return x');
  return fn;
}
outer()();   // ❌ ReferenceError — new Function is GLOBAL scope only</code></pre>
<p><code>new Function()</code> does NOT create a closure over its caller. The constructed function has only global scope in its closure. Use function expressions or <code>eval</code> for closure behavior.</p>

<h3>8. Closure via <code>bind</code></h3>
<pre><code class="language-js">function greet(greeting, name) {
  return \`\${greeting}, \${name}\`;
}
const hi = greet.bind(null, 'Hi');
hi('Prakhar');   // 'Hi, Prakhar'</code></pre>
<p><code>bind</code> creates a new function that "closes over" the supplied args. Internally it's a closure with a prefixed argument list.</p>

<h3>9. Closure over <code>this</code>? (arrow functions)</h3>
<pre><code class="language-js">const obj = {
  name: 'Prakhar',
  greet() {
    const inner = () =&gt; this.name;
    return inner;
  }
};
const f = obj.greet();
f();   // 'Prakhar' — arrow inherits this from greet's EC</code></pre>
<p>Arrow functions lexically inherit <code>this</code>. A closure over <code>this</code> is sometimes called "lexical this".</p>

<h3>10. Memoization cache can leak</h3>
<pre><code class="language-js">const memoize = (fn) =&gt; {
  const cache = new Map();
  return (x) =&gt; {
    if (cache.has(x)) return cache.get(x);
    const r = fn(x);
    cache.set(x, r);
    return r;
  };
};
const getUserData = memoize(fetchUser);
// cache grows forever; if users contain heavy data, memory climbs</code></pre>
<p>Use <code>WeakMap</code> when keys are objects (they can be GC'd), or cap size with LRU eviction.</p>

<h3>11. Closures and async/await</h3>
<pre><code class="language-js">async function run() {
  let state = 'start';
  setTimeout(() =&gt; { state = 'changed'; }, 100);
  await new Promise((r) =&gt; setTimeout(r, 200));
  console.log(state);   // 'changed'
}</code></pre>
<p>The async function's entire body forms one closure. <code>state</code> is mutated by the timer while the function is paused on <code>await</code>. When it resumes, it reads the new value.</p>

<h3>12. Closures capture <code>arguments</code> in non-arrow functions</h3>
<pre><code class="language-js">function outer() {
  return () =&gt; arguments[0];   // arrow inherits outer's arguments
}
outer(42)();   // 42</code></pre>
<p>Regular functions have their own <code>arguments</code>; arrows don't and inherit from the enclosing regular function.</p>

<h3>13. The <code>eval</code> hazard with closures</h3>
<pre><code class="language-js">function outer() {
  const secret = 'shhh';
  return (code) =&gt; eval(code);
}
outer()('secret');   // 'shhh' — eval sees the closure's scope (sloppy mode)</code></pre>
<p>In non-strict mode, <code>eval</code> has access to the enclosing closure. In strict mode, <code>eval</code> has its own scope and can't reach in.</p>

<h3>14. Closure survives outer function throwing</h3>
<pre><code class="language-js">function risky() {
  let n = 0;
  const inc = () =&gt; ++n;
  throw new Error('oops');
  return inc;
}
try { risky(); } catch (e) {}
// Closure never escaped — inc is unreachable, collected</code></pre>

<h3>15. Closures and reassigned function reference</h3>
<pre><code class="language-js">let fn;
function outer() {
  const secret = 42;
  fn = () =&gt; secret;
}
outer();
fn();   // 42 — fn is the closure
outer();   // new call, overwrites fn with a new closure capturing a new secret</code></pre>

<h3>16. Closures and modules</h3>
<pre><code class="language-js">// counter.mjs
let count = 0;
export const inc = () =&gt; ++count;
export const get = () =&gt; count;</code></pre>
<p>All exports close over the same module-scoped <code>count</code>. Modules are essentially one big closure. If two files import from this module, they share the state.</p>

<h3>17. Hermes / React Native — closures behave identically</h3>
<p>Hermes implements ES2015+ closures per spec. The one difference you might notice: Hermes' bytecode compiler does aggressive scope analysis, so "captures unused vars" rarely leaks memory.</p>

<h3>18. Closures inside class methods</h3>
<pre><code class="language-js">class Counter {
  constructor() {
    this.count = 0;
    this.inc = () =&gt; ++this.count;   // arrow closes over 'this'
  }
}
const c = new Counter();
[1,2,3].forEach(c.inc);
console.log(c.count);   // 3</code></pre>
<p>Arrow class fields create per-instance closures over <code>this</code>, which is often what you want for event handlers passed as props.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-anti', title: '🐛 Common Bugs & Anti-Patterns', html: `
<h3>Bug 1 — Stale closure in React</h3>
<pre><code class="language-js">function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() =&gt; {
    const id = setInterval(() =&gt; {
      setCount(count + 1);    // ⚠️ always 0 + 1 = 1, forever
    }, 1000);
    return () =&gt; clearInterval(id);
  }, []);   // empty deps

  return &lt;div&gt;{count}&lt;/div&gt;;
}</code></pre>

<h4>Why</h4>
<p>The effect runs once at mount. The <code>setInterval</code> callback closes over <code>count</code> from that first render (0). It keeps setting <code>setCount(1)</code>, which after the first tick doesn't even trigger a rerender (same value), so the interval stays 1 forever.</p>

<h4>Fix</h4>
<pre><code class="language-js">// Option 1: functional updater (no closure over count needed)
setCount(c =&gt; c + 1);

// Option 2: include count in deps (but effect restarts, interval restarts)
useEffect(() =&gt; {...}, [count]);</code></pre>

<h3>Bug 2 — Memory leak via retained closure</h3>
<pre><code class="language-js">function setup() {
  const huge = new Array(1e6).fill({...});
  setInterval(() =&gt; {
    // doesn't use huge, but if we reference ANYTHING from setup's scope,
    // V8 may retain the whole frame
    console.log('tick');
  }, 1000);
}
setup();</code></pre>

<p>If the interval callback doesn't reference <em>any</em> variable from <code>setup</code>, V8 can reclaim the frame. If it does (even one variable), the entire environment record is retained. Always clear intervals and release big data before exiting.</p>

<h3>Bug 3 — Closure over mutable loop variable</h3>
<pre><code class="language-js">const fns = [];
for (var i = 0; i &lt; 3; i++) {
  fns.push(() =&gt; i);
}
fns.map(f =&gt; f());   // [3, 3, 3]</code></pre>

<p>Again: <code>var</code>-shared binding. Fix with <code>let</code>.</p>

<h3>Bug 4 — Accidentally sharing state between instances</h3>
<pre><code class="language-js">// Wrong — counter is outside the factory
let counter = 0;
function makeCounter() {
  return () =&gt; ++counter;
}
const a = makeCounter();
const b = makeCounter();
a(); a(); b();   // counter = 3 — shared!</code></pre>

<p>Move <code>counter</code> inside <code>makeCounter</code> so each call gets its own.</p>

<h3>Bug 5 — <code>once</code> that doesn't handle arguments</h3>
<pre><code class="language-js">const once = (fn) =&gt; {
  let called = false;
  return () =&gt; called ? undefined : (called = true, fn());
};
const load = once(fetchData);
load('/api/x');   // ❌ arguments ignored</code></pre>

<p>Forward arguments and <code>this</code>:</p>

<pre><code class="language-js">const once = (fn) =&gt; {
  let called = false, result;
  return function (...args) {
    if (!called) { called = true; result = fn.apply(this, args); }
    return result;
  };
};</code></pre>

<h3>Bug 6 — Race in async closure</h3>
<pre><code class="language-js">async function fetchAll(urls) {
  const results = [];
  for (const url of urls) {
    fetch(url).then(r =&gt; results.push(r));   // ⚠️ order not guaranteed
  }
  return results;   // probably empty — returns before any fetch resolves
}</code></pre>

<p>The closure over <code>results</code> works, but the outer function returns before any promise resolves. Use <code>Promise.all</code>.</p>

<h3>Bug 7 — Handler captured on wrong render</h3>
<pre><code class="language-js">function List({ items, onSelect }) {
  return items.map((item, i) =&gt; (
    &lt;button key={i} onClick={() =&gt; onSelect(i)}&gt;{item}&lt;/button&gt;
  ));
}</code></pre>

<p>This is fine — each iteration's arrow captures its own <code>i</code>. But if written with <code>for var</code>, all buttons would fire with the final <code>i</code>.</p>

<h3>Bug 8 — Shared mutable cache across "separate" closures</h3>
<pre><code class="language-js">const cache = new Map();
function memoize(fn) {
  return (x) =&gt; {
    if (cache.has(x)) return cache.get(x);
    const r = fn(x);
    cache.set(x, r);
    return r;
  };
}
const a = memoize(fnA);
const b = memoize(fnB);
// a and b share cache — collisions!</code></pre>

<p>Keep the cache inside the factory.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<h3>How closures get asked</h3>
<ol>
  <li>"What is a closure?" — define + give an example.</li>
  <li>"Predict the output" — loop + setTimeout or nested-function puzzle.</li>
  <li>"Fix this bug" — stale closure, wrong <code>this</code>, or shared state.</li>
  <li>"Implement <code>X</code> using closures" — debounce, throttle, once, memoize, curry, EventEmitter.</li>
  <li>"How do React hooks work internally?" — closures over fiber state.</li>
</ol>

<h3>Sample 1 — The classic output puzzle</h3>
<pre><code class="language-js">for (var i = 1; i &lt;= 3; i++) {
  setTimeout(() =&gt; console.log(i), i * 1000);
}</code></pre>

<div class="qa-block">
<div class="qa-q">Expected answer</div>
<div class="qa-a">
<p>After 1s, 2s, 3s — all three log <strong>4</strong>. Because:</p>
<ol>
  <li><code>var i</code> is function-scoped — ONE binding shared.</li>
  <li>Loop runs synchronously. After iteration 1: <code>i = 2</code>, after 2: <code>i = 3</code>, loop exits when <code>i = 4</code>.</li>
  <li>All three arrow closures reference the same <code>i</code>, which is now <code>4</code>.</li>
</ol>
<p>Fix: <code>let i</code> (new binding per iteration) → logs 1, 2, 3.</p>
</div>
</div>

<h3>Sample 2 — Closure puzzle with nested functions</h3>
<pre><code class="language-js">function outer() {
  let x = 1;
  function middle() {
    let y = 2;
    function inner() {
      let z = 3;
      return x + y + z;
    }
    return inner;
  }
  return middle;
}

const m = outer();
const i = m();
console.log(i());   // ?</code></pre>

<div class="qa-block">
<div class="qa-q">Expected answer</div>
<div class="qa-a">
<p><strong>6.</strong> <code>inner</code> closes over its own <code>z=3</code>, its parent's <code>y=2</code>, and grandparent's <code>x=1</code>. Each function carries the entire scope chain up to global.</p>
</div>
</div>

<h3>Sample 3 — Implement <code>counter</code> with increment, decrement, reset</h3>
<pre><code class="language-js">// Your task: build createCounter so that
const c = createCounter(5);
c.inc(); c.inc(); c.dec();
c.get();    // 6
c.reset();
c.get();    // 5 (initial)</code></pre>

<div class="qa-block">
<div class="qa-q">Solution</div>
<div class="qa-a">
<pre><code class="language-js">function createCounter(initial = 0) {
  let count = initial;
  return {
    inc: () =&gt; ++count,
    dec: () =&gt; --count,
    get: () =&gt; count,
    reset: () =&gt; { count = initial; }
  };
}</code></pre>
<p><strong>Follow-up</strong>: add <code>incBy(n)</code>, a step parameter, max/min bounds.</p>
</div>
</div>

<h3>Sample 4 — Implement <code>createToggle</code></h3>
<pre><code class="language-js">// const toggle = createToggle(['a', 'b', 'c']);
// toggle();  // 'a'
// toggle();  // 'b'
// toggle();  // 'c'
// toggle();  // 'a' again</code></pre>

<div class="qa-block">
<div class="qa-q">Solution</div>
<div class="qa-a">
<pre><code class="language-js">function createToggle(values) {
  let idx = 0;
  return () =&gt; values[idx++ % values.length];
}</code></pre>
</div>
</div>

<h3>Sample 5 — Implement <code>once</code></h3>
<pre><code class="language-js">// const init = once(expensive);
// init();  // runs
// init();  // returns first result, doesn't run</code></pre>

<div class="qa-block">
<div class="qa-q">Solution (correct, handles args + this + return value)</div>
<div class="qa-a">
<pre><code class="language-js">function once(fn) {
  let called = false, result;
  return function (...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}</code></pre>
</div>
</div>

<h3>Sample 6 — Stale closure in React</h3>
<pre><code class="language-js">function TimerBug() {
  const [count, setCount] = useState(0);
  useEffect(() =&gt; {
    setInterval(() =&gt; setCount(count + 1), 1000);
  }, []);
  return &lt;div&gt;{count}&lt;/div&gt;;
}</code></pre>

<div class="qa-block">
<div class="qa-q">What's the bug? How do you fix it?</div>
<div class="qa-a">
<p>Interval is created once at mount. The callback closes over <code>count</code> from that render (0). It keeps setting <code>setCount(1)</code> repeatedly. Moreover, <code>setInterval</code> isn't cleared — it keeps running after unmount (memory leak).</p>
<p><strong>Fix:</strong></p>
<pre><code class="language-js">useEffect(() =&gt; {
  const id = setInterval(() =&gt; setCount(c =&gt; c + 1), 1000);
  return () =&gt; clearInterval(id);
}, []);</code></pre>
<p>Functional updater avoids the stale closure. Cleanup prevents leak.</p>
</div>
</div>

<h3>Sample 7 — Why can one function "remember" another's variables?</h3>
<div class="qa-block">
<div class="qa-q">Expected answer</div>
<div class="qa-a">
<p>When a function is defined, the engine saves a reference to the current Lexical Environment on the function object (<code>[[Environment]]</code>). When the function is later called, its EC's Outer Environment is set to that stored reference. So identifier lookups walk up through the environment where the function was <em>born</em>, not where it's <em>called</em>. This is the mechanism of closures.</p>
</div>
</div>

<h3>Sample 8 — Implement a private counter using closure (no classes)</h3>
<div class="qa-block">
<div class="qa-q">Acceptable answer</div>
<div class="qa-a">
<pre><code class="language-js">function Counter() {
  let value = 0;
  return {
    inc() { return ++value; },
    value() { return value; }
  };
}</code></pre>
<p><code>value</code> is inaccessible except via the returned methods.</p>
</div>
</div>

<h3>Sample 9 — Debounce from scratch</h3>
<p>Covered in JS Practical questions file; answer involves closure over <code>timerId</code>.</p>

<h3>Sample 10 — Closures and memory: is this a leak?</h3>
<pre><code class="language-js">function attach(button) {
  const data = fetchLargeData();
  button.onclick = () =&gt; sendData(data);
}</code></pre>

<div class="qa-block">
<div class="qa-q">Is it a leak?</div>
<div class="qa-a">
<p>Only if <code>button</code> never gets removed from the DOM. The click handler holds <code>data</code>; <code>button</code> holds the handler via its <code>onclick</code>; if <code>button</code> is removed and no other references to it exist, the whole graph (button → handler → data) becomes unreachable and GC'd. It's a leak ONLY if your code retains a reference to <code>button</code> elsewhere without intending to.</p>
</div>
</div>

<h3>Follow-up questions interviewers love</h3>
<ul>
  <li>"When does a closure stop holding its scope?"<br>(When all references to the inner function are gone.)</li>
  <li>"Do closures capture by value or reference?"<br>(Reference — to the binding.)</li>
  <li>"Can two closures share state?"<br>(Yes, if they're from the same outer-function call.)</li>
  <li>"How do closures enable currying?"<br>(Each partial call returns a new closure over the accumulated args.)</li>
  <li>"What's the performance cost of a closure?"<br>(Minimal — creating the function object + environment reference. Calling it is the same as any function call.)</li>
</ul>

<div class="callout success">
  <div class="callout-title">✅ Master closures checklist</div>
  <ul>
    <li>Can you trace what variables a function "sees" by looking at where it's defined (not called)?</li>
    <li>Can you explain the <code>var</code>-vs-<code>let</code>-in-a-loop trap in terms of bindings?</li>
    <li>Can you implement debounce, throttle, once, memoize, curry from scratch?</li>
    <li>Can you spot a stale-closure bug in React useEffect code?</li>
    <li>Do you know how module scope is a closure?</li>
    <li>Can you reason about when a closure's captured scope is garbage collected?</li>
  </ul>
</div>
`}

]});
