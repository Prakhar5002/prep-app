window.PREP_SITE.registerTopic({
  id: "js-this",
  module: "JavaScript Deep",
  title: "this Keyword",
  estimatedReadTime: "25 min",
  tags: ["this","binding-rules","arrow-functions","call-apply-bind","context","fundamentals"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline"><code>this</code> is decided at <strong>call time by HOW a function is invoked</strong> — priority <code>new</code> &gt; explicit (<code>call</code>/<code>apply</code>/<code>bind</code>) &gt; implicit (<code>obj.method()</code>) &gt; default (<code>undefined</code> in strict) — and arrows have no <code>this</code> of their own.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong><code>this</code> is decided at call time by HOW a function is invoked</strong> — not by where it was written.</li>
    <li>Four binding rules, in priority order: <strong><code>new</code> &gt; explicit (<code>call</code>/<code>apply</code>/<code>bind</code>) &gt; implicit (<code>obj.method()</code>) &gt; default (bare <code>fn()</code>)</strong>.</li>
    <li><code>new Fn()</code> → <code>this</code> is the new object; explicit → the passed context; implicit → the object before the dot; default → global (sloppy) or <strong><code>undefined</code></strong> (strict / ES modules).</li>
    <li><strong>Arrow functions have no <code>this</code> of their own</strong> — they inherit it lexically from where they're defined; <code>call</code>/<code>apply</code>/<code>bind</code> can NOT change an arrow's <code>this</code>.</li>
    <li><strong>Read the call expression:</strong> whatever sits immediately before the <code>()</code> usually becomes <code>this</code> — nothing (bare call) → default rule; <code>new</code> → the new object; <code>call</code>/<code>apply</code>/<code>bind</code> → the explicit argument.</li>
    <li>In implicit binding only the <em>last</em> object in the path matters: <code>b.a.greet()</code> → <code>this</code> is <code>a</code>, not <code>b</code>.</li>
    <li><strong>You "lose <code>this</code>" whenever the dot is dropped</strong>: assigning a method to a variable, passing it as a callback, destructuring it, or returning the reference.</li>
    <li><code>bind</code> cannot be re-bound — <code>fn.bind(a).bind(b)</code> stays bound to <code>a</code>.</li>
    <li><strong><code>new</code> beats <code>bind</code></strong>: <code>new (Fn.bind(ctx))()</code> ignores <code>ctx</code> and uses the fresh object.</li>
    <li>Classes are always strict, so a detached method call throws a <code>TypeError</code> (<code>this</code> is <code>undefined</code>) rather than silently using the global.</li>
    <li>Arrows can't be <code>new</code>'d — they have no <code>[[Construct]]</code>.</li>
    <li>DOM event handlers: a regular <code>function</code> gets <code>this</code> = the element; an arrow gets the lexical <code>this</code>. Array methods like <code>forEach</code>/<code>map</code> accept a <code>thisArg</code> second argument.</li>
    <li>Fix lost <code>this</code> with <code>bind</code>, an arrow wrapper (<code>() =&gt; obj.method()</code>), or an arrow class field.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap">Losing <code>this</code> by dropping the dot: <code>const f = obj.method; f()</code> makes <code>this</code> <code>undefined</code> in strict mode (and classes are always strict). Fix with <code>bind</code>, an arrow wrapper, or a class arrow field — and remember <code>call</code>/<code>apply</code>/<code>bind</code> can <strong>never</strong> change an arrow's <code>this</code>.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"<code>this</code> is decided at call time by how a function is invoked — four rules in priority: <code>new</code>, explicit bind, implicit dot, then default."</div>
  <div class="revision-say">"Arrow functions have no <code>this</code> of their own; they inherit it lexically, and <code>call</code>/<code>apply</code>/<code>bind</code> can't change it."</div>
  <div class="revision-say">"The moment you detach a method from its object — destructure it or pass it as a callback — you lose the dot, and <code>this</code> becomes <code>undefined</code> in strict mode."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What is <code>this</code>?</h3>
<p><code>this</code> is a keyword that refers to an object — the <em>execution context's object reference</em>. Every non-arrow function, when called, receives a <code>this</code> binding as part of its Execution Context.</p>

<p>Unlike most other languages (where <code>this</code>/<code>self</code> refers to the class instance and is static), JavaScript's <code>this</code> is <strong>dynamic</strong>: the same function can have different <code>this</code> depending on how it's invoked.</p>

<h3>Why does JS work this way?</h3>
<p>Historically: Brendan Eich designed JS to support multiple programming paradigms. <code>this</code>'s dynamic behavior enables:</p>
<ul>
  <li><strong>Method borrowing</strong> — use a function from object A on object B via <code>call/apply</code>.</li>
  <li><strong>Constructor pattern</strong> — <code>new Person()</code> reuses <code>Person</code>'s body with a fresh <code>this</code>.</li>
  <li><strong>Generic utilities</strong> — <code>Array.prototype.slice.call(arguments)</code>.</li>
</ul>

<p>The cost is confusion — most bugs around <code>this</code> come from forgetting that it depends on <em>how</em> you call the function.</p>

<h3>Where does <code>this</code> NOT exist?</h3>
<ul>
  <li>Inside an <strong>arrow function</strong> body (it's inherited from the enclosing scope).</li>
  <li>Top-level code in an <strong>ES module</strong> (it's <code>undefined</code>).</li>
  <li>In <strong>strict-mode</strong> top-level code (it's <code>undefined</code>).</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "rules", title: "🪜 The Four Rules (priority order)", collapsible: true, html: `
<h3>Rule 1 — <code>new</code> binding (highest priority)</h3>
<pre><code class="language-js">function Person(name) {
  this.name = name;
}
const p = new Person('Prakhar');
console.log(p.name);   // 'Prakhar'</code></pre>

<p><code>new Fn()</code>:</p>
<ol>
  <li>Creates a new empty object.</li>
  <li>Links its <code>__proto__</code> to <code>Fn.prototype</code>.</li>
  <li>Calls <code>Fn</code> with <code>this</code> bound to the new object.</li>
  <li>Returns the new object (unless <code>Fn</code> explicitly returns an object, which then replaces it).</li>
</ol>

<h3>Rule 2 — Explicit binding: <code>call</code>, <code>apply</code>, <code>bind</code></h3>
<pre><code class="language-js">function greet(greeting) {
  return \`\${greeting}, \${this.name}\`;
}
const user = { name: 'Prakhar' };

greet.call(user, 'Hi');        // 'Hi, Prakhar'
greet.apply(user, ['Hi']);     // 'Hi, Prakhar'
const bound = greet.bind(user);
bound('Hi');                    // 'Hi, Prakhar'</code></pre>

<p>The difference:</p>
<ul>
  <li><code>call(ctx, a, b, c)</code> — invoke immediately with positional args.</li>
  <li><code>apply(ctx, [a, b, c])</code> — invoke immediately with args-as-array.</li>
  <li><code>bind(ctx, a, b)</code> — returns a new function with <code>this</code> permanently set.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🔥 Key insight</div>
  <p><code>bind</code> cannot be re-bound. <code>fn.bind(a).bind(b)</code> is still bound to <code>a</code>.</p>
</div>

<h3>Rule 3 — Implicit binding</h3>
<pre><code class="language-js">const obj = {
  name: 'Prakhar',
  greet() {
    return \`Hi, \${this.name}\`;
  }
};
obj.greet();   // 'Hi, Prakhar' — 'this' is obj</code></pre>

<p>When you call <code>obj.method()</code>, <code>this</code> becomes <code>obj</code>. Rule: the <em>object immediately before the dot</em> is the <code>this</code>.</p>

<p>Only the <em>last</em> object in the call path matters:</p>
<pre><code class="language-js">const a = { name: 'A', greet() { return this.name; } };
const b = { name: 'B', a };
b.a.greet();   // 'A' — 'this' is a, not b</code></pre>

<h3>Rule 4 — Default binding (bare call)</h3>
<pre><code class="language-js">function show() {
  console.log(this);
}
show();   // window (sloppy) / undefined (strict)</code></pre>

<p>A "bare" call — no dot, no <code>new</code>, no <code>call/apply/bind</code> — triggers the default. In sloppy mode, <code>this</code> is the global object. In strict mode (and all ES modules), <code>this</code> is <code>undefined</code>.</p>

<h3>Priority summary</h3>
<div class="diagram">
  new  &gt;  call/apply/bind  &gt;  obj.method()  &gt;  bare fn()
</div>
<p>When multiple could apply, higher priority wins.</p>

<h3>Special: Arrow functions break the rules</h3>
<pre><code class="language-js">const obj = {
  name: 'Prakhar',
  greet: () =&gt; this.name
};
obj.greet();   // undefined — arrow's 'this' is inherited, NOT obj</code></pre>

<p>Arrow functions don't get their own <code>this</code>. They inherit it from the <strong>enclosing lexical scope at definition time</strong>. <code>call/apply/bind</code> cannot change an arrow's <code>this</code>.</p>

<p>This is why arrow functions shine as callbacks that should preserve <code>this</code>:</p>
<pre><code class="language-js">class Timer {
  constructor() {
    this.seconds = 0;
    setInterval(() =&gt; {
      this.seconds++;   // 'this' is the Timer instance (inherited)
    }, 1000);
  }
}</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "⚙️ Mental Model", collapsible: true, html: `
<h3>Read the call expression</h3>
<p>When you see a function call, answer three questions:</p>
<ol>
  <li>Is there a <code>new</code>? → Rule 1 wins.</li>
  <li>Is there an explicit <code>call</code>/<code>apply</code>/<code>bind</code>? → Rule 2.</li>
  <li>Is there a dot (<code>a.b()</code>)? → Rule 3: <code>this</code> is whatever's before the last dot.</li>
  <li>Otherwise: default binding.</li>
  <li>ALL of the above: ignored if the function is an arrow — it uses its lexical <code>this</code>.</li>
</ol>

<h3>The "who called me" diagram</h3>
<div class="diagram">
    obj.method()
        │
        ▼
    [ Function EC created ]
    [ this = obj ]
    [ Outer = &lt;where fn defined&gt; ]

    vs.

    fn()  (where fn = obj.method reference)
        │
        ▼
    [ Function EC created ]
    [ this = undefined (strict) or window (sloppy) ]
</div>

<p>The dot isn't carried along when you extract the reference. <code>this</code> is decided at the call site.</p>

<h3>What triggers "losing this"?</h3>
<ol>
  <li>Assigning a method to a variable: <code>const f = obj.method</code> then <code>f()</code>.</li>
  <li>Passing a method as a callback: <code>setTimeout(obj.method, 0)</code>.</li>
  <li>Destructuring: <code>const { method } = obj; method()</code>.</li>
  <li>Returning a method reference from another function.</li>
</ol>

<p>In all cases, the dot is lost. Fix with <code>bind</code>, arrow wrapping, or by using arrow functions from the start.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — Method call vs bare call</h3>
<pre><code class="language-js">const obj = {
  name: 'Prakhar',
  greet() { return this.name; }
};
obj.greet();                  // 'Prakhar'

const fn = obj.greet;
fn();                         // undefined (strict) / window.name (sloppy)

// Fix:
const bound = obj.greet.bind(obj);
bound();                      // 'Prakhar'</code></pre>

<h3>Example 2 — Callback loses <code>this</code></h3>
<pre><code class="language-js">class Clock {
  constructor() {
    this.seconds = 0;
  }
  start() {
    setInterval(function () {
      this.seconds++;   // ❌ 'this' is undefined or window
    }, 1000);
  }
}</code></pre>

<h4>Three fixes</h4>
<pre><code class="language-js">// 1. Arrow function (preferred)
setInterval(() =&gt; { this.seconds++; }, 1000);

// 2. bind
setInterval(function () { this.seconds++; }.bind(this), 1000);

// 3. Capture 'this' in a variable (old-school)
const self = this;
setInterval(function () { self.seconds++; }, 1000);</code></pre>

<h3>Example 3 — <code>setTimeout</code> losing method context</h3>
<pre><code class="language-js">const obj = {
  name: 'Prakhar',
  say() { console.log(this.name); }
};
setTimeout(obj.say, 0);   // undefined</code></pre>

<h4>What happens internally</h4>
<p><code>setTimeout</code> receives a function reference. When the timer fires, it does (roughly): <code>fn()</code> — a bare call. The dot is gone. <code>this</code> defaults to undefined/global.</p>

<h4>Fixes</h4>
<pre><code class="language-js">setTimeout(obj.say.bind(obj), 0);      // 'Prakhar'
setTimeout(() =&gt; obj.say(), 0);         // 'Prakhar'  (arrow preserves obj via call)
setTimeout(function () { obj.say(); }, 0);   // 'Prakhar'</code></pre>

<h3>Example 4 — Arrow at definition inherits <code>this</code></h3>
<pre><code class="language-js">const obj = {
  name: 'Prakhar',
  say: () =&gt; console.log(this.name)   // arrow here
};
obj.say();   // undefined — 'this' is the module/global, not obj</code></pre>

<p>The arrow is defined in the module/global scope. Its <code>this</code> is fixed to whatever <code>this</code> is there (<code>undefined</code> in modules / <code>window</code> in scripts). <code>obj.say()</code> doesn't change that.</p>

<h3>Example 5 — Arrow <em>inside</em> a method DOES work</h3>
<pre><code class="language-js">const obj = {
  name: 'Prakhar',
  say() {
    const inner = () =&gt; console.log(this.name);
    inner();
  }
};
obj.say();   // 'Prakhar'</code></pre>

<p>Inside <code>say</code>, <code>this = obj</code>. The arrow inherits from <code>say</code>'s scope, so <code>this</code> is <code>obj</code>.</p>

<h3>Example 6 — <code>new</code> with a constructor that returns an object</h3>
<pre><code class="language-js">function Foo() {
  this.a = 1;
  return { a: 99 };
}
const f = new Foo();
f.a;   // 99 — the returned object replaced 'this'</code></pre>

<p>But:</p>
<pre><code class="language-js">function Bar() {
  this.a = 1;
  return 42;   // primitive return — ignored
}
const b = new Bar();
b.a;   // 1 — primitive return ignored by 'new'</code></pre>

<h3>Example 7 — Method borrowing with <code>call</code></h3>
<pre><code class="language-js">function sumArgs() {
  // turn 'arguments' into array
  const arr = Array.prototype.slice.call(arguments);
  return arr.reduce((a, b) =&gt; a + b, 0);
}
sumArgs(1, 2, 3);   // 6</code></pre>

<p>We borrow <code>Array.prototype.slice</code> and apply it to <code>arguments</code> (which is array-like but not an array).</p>

<h3>Example 8 — Chained <code>bind</code> doesn't work</h3>
<pre><code class="language-js">function log() { console.log(this.x); }
const a = { x: 1 };
const b = { x: 2 };
const bound = log.bind(a).bind(b);
bound();   // 1 — first bind wins, second is ignored</code></pre>

<h3>Example 9 — Arrow with <code>bind</code></h3>
<pre><code class="language-js">const arrow = () =&gt; this;
const ctx = { x: 42 };
arrow.bind(ctx)();   // inherited 'this', NOT ctx</code></pre>

<p>You can't bind an arrow's <code>this</code>. The bind call doesn't error, but it's a no-op for <code>this</code> (args binding still works).</p>

<h3>Example 10 — Class methods and <code>this</code></h3>
<pre><code class="language-js">class Dog {
  constructor(name) { this.name = name; }
  bark() { console.log(this.name + ' says woof'); }
}
const d = new Dog('Rex');
d.bark();                  // 'Rex says woof'
const b = d.bark;
b();                       // ❌ TypeError — 'this' is undefined in strict (classes are strict)</code></pre>

<p>Classes are always strict. Losing the dot means losing <code>this</code>. Fix with <code>bind</code> in constructor or use class field arrow syntax:</p>

<pre><code class="language-js">class Dog {
  constructor(name) { this.name = name; }
  bark = () =&gt; console.log(this.name + ' says woof');   // arrow field
}
const b = new Dog('Rex').bark;
b();   // 'Rex says woof' — arrow field binds 'this' per instance</code></pre>

<h3>Example 11 — <code>this</code> inside event handler</h3>
<pre><code class="language-js">button.addEventListener('click', function () {
  this;   // the button element (browser sets 'this' to currentTarget)
});

button.addEventListener('click', () =&gt; {
  this;   // inherited from enclosing — NOT the button
});</code></pre>

<p>DOM events set <code>this</code> to the element for non-arrow handlers.</p>

<h3>Example 12 — <code>this</code> in a <code>forEach</code> callback</h3>
<pre><code class="language-js">[1, 2, 3].forEach(function (n) {
  console.log(this);   // undefined (strict) or window
});

[1, 2, 3].forEach(function (n) {
  console.log(this);   // { name: 'Prakhar' }
}, { name: 'Prakhar' });   // second arg is thisArg</code></pre>

<p>Many array methods accept a <code>thisArg</code> as the second parameter.</p>

<h3>Example 13 — Nested this with regular functions</h3>
<pre><code class="language-js">const obj = {
  name: 'Prakhar',
  outer() {
    function inner() {
      console.log(this);   // undefined/global — inner is called without a dot
    }
    inner();
  }
};
obj.outer();</code></pre>

<p>Inside <code>outer</code>, <code>this = obj</code>. But <code>inner()</code> is a bare call; <code>this</code> resets to default binding.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. Arrow in object literal — lexical <code>this</code> is the outer scope</h3>
<pre><code class="language-js">const obj = {
  arrow: () =&gt; console.log(this)   // outer 'this' (global / undefined in module)
};</code></pre>

<h3>2. <code>bind</code> with <code>null</code> or <code>undefined</code> context</h3>
<pre><code class="language-js">function show() { console.log(this); }
show.call(null);        // null (strict) / global (sloppy)
show.call(undefined);   // undefined (strict) / global (sloppy)</code></pre>

<p>In sloppy mode, <code>this = null</code> coerces to the global object. Strict mode keeps it as <code>null</code>.</p>

<h3>3. Primitive <code>this</code> in sloppy mode — boxing</h3>
<pre><code class="language-js">function show() { return typeof this; }
show.call(5);   // 'object' in sloppy (boxed to Number), 'number' in strict</code></pre>

<p>Sloppy mode auto-boxes primitives. Strict mode preserves the primitive.</p>

<h3>4. <code>new</code> with <code>bind</code>-ed function</h3>
<pre><code class="language-js">function Foo(x) { this.x = x; }
const Bound = Foo.bind({ a: 1 });
const f = new Bound(5);
f.x;   // 5 — 'new' overrides bind's 'this'</code></pre>

<p><code>new</code> has higher priority than <code>bind</code>. The bound context is thrown out.</p>

<h3>5. <code>new</code> with arrow — TypeError</h3>
<pre><code class="language-js">const Foo = () =&gt; {};
new Foo();   // ❌ TypeError — arrow has no [[Construct]]</code></pre>

<h3>6. <code>super</code> inside classes is a special form of <code>this</code></h3>
<pre><code class="language-js">class A {
  say() { return 'A'; }
}
class B extends A {
  say() { return super.say() + ' B'; }
}
new B().say();   // 'A B'</code></pre>

<p><code>super</code> is scoped to the class and uses <code>[[HomeObject]]</code> internally, not <code>this</code>.</p>

<h3>7. <code>.prototype</code> method called on an instance</h3>
<pre><code class="language-js">function Foo() {}
Foo.prototype.bar = function () { return this; };
const f = new Foo();
f.bar();   // f — implicit binding via prototype chain</code></pre>

<h3>8. Getters and setters — <code>this</code> is the object</h3>
<pre><code class="language-js">const obj = {
  _x: 0,
  get x() { return this._x; },
  set x(v) { this._x = v; }
};
obj.x = 5;
obj.x;   // 5 — 'this' inside getter/setter is obj</code></pre>

<h3>9. Nested methods — regular function resets <code>this</code></h3>
<pre><code class="language-js">const obj = {
  m() {
    function n() { return this; }
    return n();   // default binding, not obj
  }
};
obj.m();   // undefined / window</code></pre>

<h3>10. <code>this</code> inside a generator</h3>
<pre><code class="language-js">const obj = {
  *gen() {
    yield this;
  }
};
const it = obj.gen();
it.next().value;   // obj</code></pre>

<h3>11. <code>this</code> inside async function</h3>
<pre><code class="language-js">const obj = {
  async fetch() {
    return this;
  }
};
obj.fetch().then(t =&gt; console.log(t));   // obj</code></pre>

<p>async functions behave like regular functions for <code>this</code> purposes.</p>

<h3>12. Destructured methods lose <code>this</code></h3>
<pre><code class="language-js">const obj = {
  x: 1,
  get() { return this.x; }
};
const { get } = obj;
get();   // ❌ undefined</code></pre>

<p>Destructuring extracts the reference, dropping the dot.</p>

<h3>13. <code>this</code> in a tagged template literal</h3>
<pre><code class="language-js">function tag(strings, ...values) { return this; }
const obj = { t: tag };
obj.t\`hello\`;   // obj</code></pre>

<p>Tagged templates are method-like calls; <code>this</code> follows implicit binding.</p>

<h3>14. <code>this</code> in <code>eval</code></h3>
<pre><code class="language-js">function foo() {
  eval('console.log(this)');   // same 'this' as foo (sloppy)
}</code></pre>

<h3>15. <code>this</code> in <code>module</code> top-level</h3>
<pre><code class="language-js">// in an .mjs or &lt;script type="module"&gt;
console.log(this);   // undefined</code></pre>

<h3>16. Chained method call</h3>
<pre><code class="language-js">class Builder {
  set(k, v) {
    this[k] = v;
    return this;
  }
}
new Builder().set('a', 1).set('b', 2);   // works — 'this' is preserved in chain</code></pre>

<h3>17. <code>this</code> in an IIFE</h3>
<pre><code class="language-js">(function () { console.log(this); })();   // undefined (strict) / window (sloppy)
(() =&gt; console.log(this))();             // inherited 'this'</code></pre>

<h3>18. DOM handlers with arrow vs regular function</h3>
<pre><code class="language-js">el.addEventListener('click', function () {
  this;   // the el
});
el.addEventListener('click', () =&gt; {
  this;   // lexical (NOT el)
});</code></pre>

<h3>19. React class component methods</h3>
<pre><code class="language-js">class Btn extends React.Component {
  handle() { console.log(this.props); }
  render() {
    return &lt;button onClick={this.handle}&gt;x&lt;/button&gt;;   // ❌ 'this' lost
  }
}</code></pre>

<p>Fix with <code>bind</code> in constructor or arrow class fields. Modern React with hooks avoids this entirely.</p>

<h3>20. <code>this</code> in static methods of a class</h3>
<pre><code class="language-js">class Foo {
  static create() { return new this(); }   // 'this' = the class itself
}
Foo.create();   // new Foo instance</code></pre>

<p>Static methods have <code>this</code> = the class constructor, not an instance.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Bug 1 — Losing <code>this</code> when passing methods</h3>
<pre><code class="language-js">class Counter {
  count = 0;
  increment() { this.count++; }
}
const c = new Counter();
document.getElementById('btn').addEventListener('click', c.increment);
// ❌ 'this' inside increment is the button, not c</code></pre>

<h4>Fix</h4>
<pre><code class="language-js">// Option 1: arrow class field
class Counter {
  count = 0;
  increment = () =&gt; this.count++;
}

// Option 2: bind at attach-time
btn.addEventListener('click', c.increment.bind(c));

// Option 3: wrap in arrow
btn.addEventListener('click', () =&gt; c.increment());</code></pre>

<h3>Bug 2 — Arrow method in object literal</h3>
<pre><code class="language-js">const counter = {
  count: 0,
  inc: () =&gt; this.count++   // ❌ 'this' is enclosing scope
};
counter.inc();
// counter.count is still 0</code></pre>

<p>Always use regular methods for object methods that need <code>this</code>.</p>

<h3>Bug 3 — Forgetting <code>new</code></h3>
<pre><code class="language-js">function Person(name) {
  this.name = name;
}
const p = Person('Prakhar');   // ❌ without 'new'
// In sloppy mode, 'this' is window → window.name = 'Prakhar'
// In strict mode, 'this' is undefined → TypeError</code></pre>

<p>Modern fix: use ES6 classes (calling a class without <code>new</code> throws).</p>

<h3>Bug 4 — Confusing <code>this</code> in nested callbacks</h3>
<pre><code class="language-js">const user = {
  name: 'Prakhar',
  fetch() {
    this.name;    // works
    [1, 2].forEach(function () {
      this.name;  // ❌ 'this' is undefined or global
    });
  }
};</code></pre>

<p>Use arrow in <code>forEach</code>, or pass <code>this</code> as second arg: <code>[1,2].forEach(fn, this)</code>.</p>

<h3>Bug 5 — Destructured method</h3>
<pre><code class="language-js">const { useState } = React;   // this is fine — React.useState doesn't use 'this'
const { addEventListener } = window;
addEventListener('click', ...);   // ❌ 'this' in addEventListener expects window</code></pre>

<p>Some native methods are sensitive to their <code>this</code>.</p>

<h3>Bug 6 — Promise callback losing <code>this</code></h3>
<pre><code class="language-js">class Api {
  url = 'https://x';
  fetch() {
    return fetch(this.url).then(function (r) {
      this.parse(r);   // ❌ 'this' is undefined
      return r.json();
    });
  }
}</code></pre>

<p>Use arrow: <code>.then(r =&gt; this.parse(r))</code>.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<h3>How this gets asked</h3>
<ol>
  <li>"What does this code log?" — puzzle with mix of methods, callbacks, arrows.</li>
  <li>"Why is <code>this</code> undefined here?" — spot the bug.</li>
  <li>"Implement <code>call</code>/<code>apply</code>/<code>bind</code> from scratch."</li>
  <li>"Explain the 4 rules of <code>this</code>."</li>
  <li>"When would you use arrow vs regular function?"</li>
</ol>

<h3>Sample 1 — Basic priority</h3>
<pre><code class="language-js">const obj = {
  x: 1,
  show() { console.log(this.x); }
};
const f = obj.show;
f();           // ?
obj.show();    // ?</code></pre>

<div class="qa-block">
<div class="qa-q">Expected answer</div>
<div class="qa-a">
<p><code>f()</code> → <strong>undefined</strong> (bare call, default binding, strict undefined).</p>
<p><code>obj.show()</code> → <strong>1</strong> (implicit binding).</p>
</div>
</div>

<h3>Sample 2 — setTimeout trap</h3>
<pre><code class="language-js">const obj = {
  name: 'Prakhar',
  say() { console.log(this.name); }
};
setTimeout(obj.say, 100);   // ?</code></pre>

<div class="qa-block">
<div class="qa-q">Expected answer</div>
<div class="qa-a">
<p>Logs <strong>undefined</strong> (or empty string on the browser's <code>window.name</code>). <code>setTimeout</code> receives the function reference; the dot is lost; when timer fires, it calls it bare. <code>this</code> defaults to undefined/global.</p>
<p>Fixes: <code>setTimeout(obj.say.bind(obj), 100)</code>, <code>setTimeout(() =&gt; obj.say(), 100)</code>.</p>
</div>
</div>

<h3>Sample 3 — Arrow in object</h3>
<pre><code class="language-js">const obj = {
  name: 'Prakhar',
  say: () =&gt; console.log(this.name)
};
obj.say();   // ?</code></pre>

<div class="qa-block">
<div class="qa-q">Expected answer</div>
<div class="qa-a">
<p><strong>undefined</strong>. Arrow's <code>this</code> is lexical — inherited from where it's defined (module/global). <code>this.name</code> is reading from the global, which is undefined.</p>
</div>
</div>

<h3>Sample 4 — new vs bind priority</h3>
<pre><code class="language-js">function F(x) { this.x = x; }
const Bound = F.bind({ x: 999 });
const f = new Bound(5);
console.log(f.x);   // ?</code></pre>

<div class="qa-block">
<div class="qa-q">Expected answer</div>
<div class="qa-a">
<p><strong>5</strong>. <code>new</code> has higher priority than <code>bind</code>. The bound context is ignored; a fresh object is created.</p>
</div>
</div>

<h3>Sample 5 — Implement <code>myBind</code></h3>
<div class="qa-block">
<div class="qa-q">Acceptable answer</div>
<div class="qa-a">
<pre><code class="language-js">Function.prototype.myBind = function (ctx, ...presetArgs) {
  const fn = this;
  return function (...laterArgs) {
    // Handle 'new' properly — if called with new, use 'this' (the new object)
    const isNew = this instanceof fn;
    return fn.apply(isNew ? this : ctx, [...presetArgs, ...laterArgs]);
  };
};</code></pre>
<p>Edge case: if <code>myBind</code>-returned function is called with <code>new</code>, should behave like <code>new fn()</code>. The <code>this instanceof fn</code> check handles this.</p>
</div>
</div>

<h3>Sample 6 — Implement <code>myCall</code> and <code>myApply</code></h3>
<div class="qa-block">
<div class="qa-q">Acceptable answer</div>
<div class="qa-a">
<pre><code class="language-js">Function.prototype.myCall = function (ctx, ...args) {
  ctx = ctx ?? globalThis;
  const key = Symbol();
  ctx[key] = this;     // attach this function as a temporary property
  const result = ctx[key](...args);
  delete ctx[key];
  return result;
};

Function.prototype.myApply = function (ctx, args = []) {
  return this.myCall(ctx, ...args);
};</code></pre>
<p><code>Symbol</code> prevents name collision with existing properties.</p>
</div>
</div>

<h3>Sample 7 — Which to use, arrow or regular?</h3>
<div class="qa-block">
<div class="qa-q">Expected answer</div>
<div class="qa-a">
<p><strong>Arrow</strong> when: callback that should inherit <code>this</code> (timers, promise <code>.then</code>, event handlers stored on class fields, array methods like <code>forEach</code>/<code>map</code>/<code>filter</code> that operate on <code>this</code>).</p>
<p><strong>Regular</strong> when: object methods needing <code>this</code> = the object, class methods, constructor functions (arrows can't be <code>new</code>'d), anything requiring <code>arguments</code> or dynamic <code>this</code>.</p>
</div>
</div>

<h3>Sample 8 — Chained implicit binding</h3>
<pre><code class="language-js">const a = {
  name: 'A',
  greet() { return this.name; }
};
const b = {
  name: 'B',
  fn: a.greet
};
b.fn();   // ?</code></pre>

<div class="qa-block">
<div class="qa-q">Expected answer</div>
<div class="qa-a">
<p><strong>'B'</strong>. Calling <code>b.fn()</code> binds <code>this</code> to <code>b</code>. <code>greet</code>'s code runs, <code>this.name</code> → 'B'. The fact that <code>greet</code> was "originally" from <code>a</code> doesn't matter.</p>
</div>
</div>

<h3>Sample 9 — Arrow inside class method</h3>
<pre><code class="language-js">class Timer {
  seconds = 0;
  start() {
    setInterval(() =&gt; this.seconds++, 1000);
  }
}
new Timer().start();   // works — 'this' inside arrow is Timer instance</code></pre>

<div class="qa-block">
<div class="qa-q">Why does this work?</div>
<div class="qa-a">
<p>Inside <code>start</code>, <code>this</code> is the Timer instance. The arrow inherits <code>this</code> from <code>start</code>'s scope. Even though <code>setInterval</code> calls its callback bare, the arrow doesn't care — it has no <code>this</code> of its own.</p>
</div>
</div>

<h3>Sample 10 — Mixed puzzle</h3>
<pre><code class="language-js">const user = {
  name: 'Prakhar',
  sayHi() {
    console.log(this.name);
  }
};

const admin = { name: 'Admin' };

// 1
admin.sayHi = user.sayHi;
admin.sayHi();       // ?

// 2
const { sayHi } = user;
sayHi();             // ?

// 3
user.sayHi.call(admin);   // ?

// 4
const wrap = () =&gt; user.sayHi();
wrap();              // ?</code></pre>

<div class="qa-block">
<div class="qa-q">Expected answers</div>
<div class="qa-a">
<ol>
  <li><strong>'Admin'</strong> — implicit binding (called via <code>admin.sayHi()</code>).</li>
  <li><strong>undefined</strong> — bare call (destructured).</li>
  <li><strong>'Admin'</strong> — explicit binding via <code>call</code>.</li>
  <li><strong>'Prakhar'</strong> — arrow calls <code>user.sayHi()</code>, still implicit binding to <code>user</code>.</li>
</ol>
</div>
</div>

<h3>Follow-ups interviewers love</h3>
<ul>
  <li>"How is arrow function's <code>this</code> different?"</li>
  <li>"What's the priority order?"</li>
  <li>"When would you use <code>bind</code> vs arrow?"</li>
  <li>"Can you <code>new</code> an arrow?"</li>
  <li>"What happens to <code>this</code> in a class method passed as a callback?"</li>
  <li>"Why are arrow functions lighter memory-wise?" (no own <code>this</code>/<code>arguments</code> — shared with enclosing.)</li>
</ul>

<div class="qa-block">
  <div class="qa-question">Q11. What are the four <code>this</code> binding rules in priority order, and what is <code>this</code> under each?</div>
  <div class="qa-answer">
    <p><code>this</code> is decided at call time by how the function is invoked, checking these rules from highest priority down. (1) <strong><code>new</code> binding</strong>: <code>new Foo()</code> → the newly created object. (2) <strong>Explicit</strong>: <code>fn.call(ctx)</code>, <code>fn.apply(ctx, args)</code> or <code>fn.bind(ctx)</code> → <code>ctx</code>. (3) <strong>Implicit</strong>: <code>obj.fn()</code> → <code>obj</code>, the object immediately before the dot. (4) <strong>Default</strong>: a bare <code>fn()</code> → <code>undefined</code> in strict mode and ES modules, the global object (<code>window</code>) in sloppy mode. <code>new</code> beats even <code>bind</code>: <code>new (Fn.bind(ctx))()</code> ignores <code>ctx</code>. Arrow functions sit outside all four rules.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q12. Why can't <code>call</code>, <code>apply</code> or <code>bind</code> change an arrow function's <code>this</code>?</div>
  <div class="qa-answer">
    <p>An arrow function has no <code>this</code> binding of its own — it doesn't receive one when called. Inside it, <code>this</code> is just a variable lookup that resolves through the enclosing lexical scope at definition time, exactly like any outer variable. <code>call</code>/<code>apply</code>/<code>bind</code> work by supplying the <code>this</code> for a new call, so for an arrow there's nothing for them to set: <code>arrow.bind(ctx)()</code> doesn't error, but it still uses the inherited <code>this</code> (argument binding still works). For the same reason arrows can't be used with <code>new</code> — they have no <code>[[Construct]]</code>.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q13. Why does <code>b.a.greet()</code> bind <code>this</code> to <code>a</code> and not <code>b</code>?</div>
  <div class="qa-answer">
    <p>Implicit binding uses only the object immediately before the final dot — the one the method is actually read from at the call. In <code>b.a.greet()</code>, <code>b.a</code> is evaluated first to get the object <code>a</code>, then <code>greet</code> is called on it, so <code>this</code> is <code>a</code> and <code>this.name</code> is <code>'A'</code>. Everything earlier in the path just helps locate that object and has no effect on <code>this</code>.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q14. How do you "lose <code>this</code>", and how do you fix a detached method?</div>
  <div class="qa-answer">
    <p>You lose <code>this</code> whenever the dot is dropped between reading a method and calling it: assigning it to a variable (<code>const f = obj.method; f()</code>), passing it as a callback (<code>setTimeout(obj.method, 0)</code>), destructuring it (<code>const { method } = obj</code>), or returning the method reference from another function. The call becomes a bare call, so the default rule applies. Three fixes: <code>bind</code> it (<code>obj.method.bind(obj)</code>, or bind in the constructor), wrap it in an arrow (<code>() =&gt; obj.method()</code>) so the dot is kept, or define it as an arrow class field (<code>bark = () =&gt; ...</code>), which captures the instance's <code>this</code> per instance.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q15. Why does a detached class method throw a <code>TypeError</code> instead of silently using the global object?</div>
  <div class="qa-answer">
    <p>Class bodies are always strict mode. When <code>const b = d.bark; b()</code> runs, it's a bare call, and under strict mode the default binding is <code>undefined</code>, not the global object. Reading <code>this.name</code> then means reading a property of <code>undefined</code>, which throws a <code>TypeError</code>. In sloppy-mode code the same detached call would quietly use <code>window</code> and return a wrong value, so the class behaviour is actually the safer one — it fails loudly.</p>
  </div>
</div>
` },

  ]
});
