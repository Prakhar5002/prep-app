window.PREP_SITE.registerTopic({
  id: 'js-prototypes',
  module: 'JavaScript Deep',
  title: 'Prototypes & Inheritance',
  estimatedReadTime: '30 min',
  tags: ['prototype', 'inheritance', 'proto', 'class', 'constructor', 'prototype-chain', 'instanceof', 'fundamentals'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>JavaScript has <strong>prototypal inheritance</strong>, not classical inheritance. Every object has a hidden internal slot <code>[[Prototype]]</code> (accessible via <code>Object.getPrototypeOf(obj)</code> or the legacy <code>obj.__proto__</code>) pointing at <em>another object</em>. When you read <code>obj.x</code>, the engine walks this chain until it finds <code>x</code> or hits <code>null</code>.</p>
<ul>
  <li><code>ClassName.prototype</code> is the object that will become the <code>[[Prototype]]</code> of every <code>new ClassName()</code> instance.</li>
  <li><code>new Fn()</code> creates an object whose <code>[[Prototype]]</code> is <code>Fn.prototype</code> and calls <code>Fn</code> with <code>this</code> bound to that new object.</li>
  <li><code>class Foo {}</code> is <strong>syntactic sugar</strong> over a function constructor plus prototype assignment — with a few real differences (strict by default, non-callable without <code>new</code>, proper <code>extends</code>/<code>super</code>, private fields).</li>
  <li><code>instanceof</code> checks whether <code>C.prototype</code> appears anywhere in the object's prototype chain.</li>
  <li>Writing to <code>obj.x</code> creates/updates <code>x</code> directly on <code>obj</code>; it does NOT modify the prototype (the <em>write shadows</em>, read walks up).</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Objects inherit from objects. Classes are a syntax on top. Read goes up the chain; write stays on the instance. That's 90% of the model.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What is a prototype, precisely?</h3>
<p>Every JavaScript object has an <strong>internal slot</strong> called <code>[[Prototype]]</code>. It is either another object or <code>null</code>. That slot is the object's link to its "parent" object — not a parent class, a parent <em>object</em>.</p>

<p>When you do a property read like <code>user.name</code>:</p>
<ol>
  <li>Engine checks if <code>name</code> is an <em>own</em> property of <code>user</code>.</li>
  <li>If not, it follows <code>user.[[Prototype]]</code> and checks there.</li>
  <li>Repeats up the chain until it finds <code>name</code> or hits <code>null</code>.</li>
  <li>If it hits <code>null</code> without finding <code>name</code>, the result is <code>undefined</code> (never a ReferenceError — that's only for un-declared identifiers).</li>
</ol>

<p>That single mechanism — the prototype chain walk on read — is the <em>entire</em> inheritance model of JavaScript. Everything else (classes, <code>instanceof</code>, <code>extends</code>) is syntax that ultimately manipulates that chain.</p>

<h3>Two things called "prototype" — don't confuse them</h3>
<table>
  <thead><tr><th>Term</th><th>Where it lives</th><th>What it does</th></tr></thead>
  <tbody>
    <tr><td><code>obj.[[Prototype]]</code> (aka <code>__proto__</code>)</td><td>On every object</td><td>The internal link used during property lookup.</td></tr>
    <tr><td><code>Fn.prototype</code></td><td>Only on <em>function</em> objects</td><td>A plain object that will become the <code>[[Prototype]]</code> of any <code>new Fn()</code> instance.</td></tr>
  </tbody>
</table>
<p><code>Fn.prototype</code> has NO effect when you call <code>Fn()</code> normally — only when you use <code>new</code>. And arrow functions have no <code>prototype</code> property at all (they can't be called with <code>new</code>).</p>

<h3>Why does JS do this?</h3>
<ul>
  <li><strong>Memory sharing.</strong> If 10,000 <code>User</code> instances all need the method <code>greet</code>, defining it once on <code>User.prototype</code> means one function object, not 10,000.</li>
  <li><strong>Runtime composability.</strong> You can mutate prototype chains at runtime — add a method, swap a parent, mix in behavior — without recompiling.</li>
  <li><strong>Single model.</strong> There is no separate "class" primitive at the runtime level. Everything is an object; "inheritance" is "this object points at that object."</li>
  <li><strong>Performance path.</strong> Modern engines (V8's hidden classes, JSC's structures) cache the chain walk aggressively, so property lookups compile down to near-direct memory loads.</li>
</ul>

<h3>What is a class, really?</h3>
<p>A <code>class</code> declaration creates a <em>function</em> (the constructor) and <em>decorates</em> it with a <code>prototype</code> object carrying the methods. <code>new MyClass()</code> runs the same <code>new</code> machinery as any other constructor. The only runtime differences between <code>class Foo</code> and <code>function Foo</code> are:</p>
<ul>
  <li>Class body is in strict mode automatically.</li>
  <li>The class function cannot be called without <code>new</code> — throws <code>TypeError</code>.</li>
  <li>Class declarations are <em>not hoisted</em> like function declarations — they're in TDZ until the declaration line.</li>
  <li><code>extends</code> sets up the prototype chain properly (static <em>and</em> instance sides).</li>
  <li>You get <code>super</code>, private fields (<code>#x</code>), and static blocks.</li>
  <li>Methods are non-enumerable by default; manually-assigned <code>Fn.prototype.x = ...</code> is enumerable.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">Class is sugar — but not zero sugar</div>
  <p>If an interviewer asks "is class just syntactic sugar?", the precise answer is <em>"yes at the inheritance/chain level, no at the semantics level"</em> — classes add stricter invariants (strict mode, new-only, TDZ, non-enumerable methods) that bare functions don't.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "linked list of objects" picture</h3>
<p>Draw any object as a box with its own properties inside and an arrow labeled <code>[[Prototype]]</code> pointing up to another box. That's it. Lookup walks arrows; writes happen in the starting box.</p>

<div class="diagram">
<pre>
                    Object.prototype
                    ┌─────────────────┐
                    │ toString: ƒ     │
                    │ hasOwnProperty: │
                    │ valueOf: ƒ      │
                    │ [[Prototype]]: null
                    └──────▲──────────┘
                           │
                    User.prototype
                    ┌─────────────────┐
                    │ greet: ƒ        │
                    │ constructor: User│
                    │ [[Prototype]]: ──┼──┐
                    └──────▲──────────┘  │
                           │              └──► Object.prototype
                    user (instance)
                    ┌─────────────────┐
                    │ name: 'Ada'     │
                    │ [[Prototype]]: ──┼──► User.prototype
                    └─────────────────┘

user.name      →  found on instance, returns 'Ada'
user.greet     →  not on instance, walk up → User.prototype.greet
user.toString  →  walk up twice → Object.prototype.toString
user.xyz       →  walk up, hit null → undefined
</pre>
</div>

<h3>The "what <code>new</code> does" picture</h3>
<pre><code class="language-js">// Pseudo-code of what 'new Fn(args)' does:
function pseudoNew(Fn, args) {
  const obj = Object.create(Fn.prototype); // 1. fresh object linked to Fn.prototype
  const result = Fn.apply(obj, args);      // 2. run Fn with this = obj
  return (typeof result === 'object' && result !== null) ? result : obj; // 3. honor explicit object return
}</code></pre>
<p>Only the prototype wiring in step 1 is "magic." Everything else is a normal call. If the constructor explicitly <code>return</code>s an object, that object wins; otherwise the new instance wins.</p>

<h3>The "read walks, write shadows" picture</h3>
<pre><code class="language-js">const animal = { legs: 4 };
const dog = Object.create(animal);
console.log(dog.legs);   // 4  (read walks up to animal)
dog.legs = 3;            // write creates own property on dog
console.log(dog.legs);   // 3  (read now finds dog's own)
console.log(animal.legs); // 4  (unchanged)
delete dog.legs;
console.log(dog.legs);   // 4  (back to walking up)</code></pre>
<p>This is the <strong>single most important</strong> behavior to internalize. It's why mutating the prototype from the instance side feels "wrong" — you can't. You can only <em>shadow</em>.</p>

<h3>The "class is a function with a named tag" picture</h3>
<pre><code class="language-js">class User {
  constructor(name) { this.name = name; }
  greet() { return 'hi ' + this.name; }
}
// is approximately:
function User(name) { this.name = name; }
User.prototype.greet = function () { return 'hi ' + this.name; };
// differences: class is strict, non-callable without new, has TDZ, methods non-enumerable.</code></pre>

<div class="callout warn">
  <div class="callout-title">Two traps</div>
  <ul>
    <li><strong>Arrow functions have no <code>prototype</code>.</strong> <code>const Foo = () =&gt; {}; new Foo();</code> → TypeError.</li>
    <li><strong>Replacing <code>Fn.prototype</code> wholesale breaks instanceof for existing instances.</strong> They still point at the old object.</li>
  </ul>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Creating prototype links — four ways</h3>
<pre><code class="language-js">// 1. Object literal — [[Prototype]] defaults to Object.prototype
const a = { x: 1 };

// 2. Object.create(proto) — set [[Prototype]] directly
const b = Object.create(a);       // b.[[Prototype]] = a
const c = Object.create(null);    // c has NO prototype at all — no toString!

// 3. new Fn() — [[Prototype]] = Fn.prototype
function F() {}
const d = new F();                // d.[[Prototype]] = F.prototype

// 4. class syntax (same as 3 under the hood)
class G {}
const e = new G();                // e.[[Prototype]] = G.prototype</code></pre>

<h3>Reading the chain</h3>
<pre><code class="language-js">Object.getPrototypeOf(obj)           // canonical, recommended
obj.__proto__                        // legacy accessor (works, avoid in production)
Reflect.getPrototypeOf(obj)          // same result</code></pre>

<h3>Writing the chain (rare, often wrong)</h3>
<pre><code class="language-js">Object.setPrototypeOf(obj, newProto) // canonical
obj.__proto__ = newProto             // legacy
Reflect.setPrototypeOf(obj, newProto)</code></pre>
<p>This <em>deoptimizes</em> the object in V8: hidden-class chains are invalidated, inline caches get cleared. Fine at startup, disastrous in hot paths. Prefer <code>Object.create(proto)</code> at construction time.</p>

<h3>Own vs inherited properties</h3>
<pre><code class="language-js">obj.hasOwnProperty('x')             // true only for own
Object.hasOwn(obj, 'x')             // modern, safe against null prototype
'x' in obj                          // true for own OR inherited
Object.keys(obj)                    // own enumerable string keys
Object.getOwnPropertyNames(obj)     // own string keys, enumerable or not
Object.getOwnPropertySymbols(obj)   // own symbol keys
Reflect.ownKeys(obj)                // all own keys (strings + symbols, incl. non-enum)</code></pre>

<h3>The <code>for...in</code> gotcha</h3>
<p><code>for...in</code> walks <em>enumerable</em> properties of the object AND its prototype chain. Almost always you want <code>Object.keys</code> or <code>for...of Object.entries(obj)</code>.</p>
<pre><code class="language-js">Array.prototype.bogus = 1;
const arr = [1,2,3];
for (const k in arr) console.log(k); // 0, 1, 2, 'bogus'  ← leak!
for (const v of arr) console.log(v); // 1, 2, 3  ← safe</code></pre>

<h3>instanceof explained</h3>
<pre><code class="language-js">obj instanceof Ctor
// Equivalent to:
let p = Object.getPrototypeOf(obj);
while (p !== null) {
  if (p === Ctor.prototype) return true;
  p = Object.getPrototypeOf(p);
}
return false;</code></pre>
<p>Note: it walks the chain looking for <code>Ctor.prototype</code>. If you swap <code>Ctor.prototype</code> after construction, old instances fail the check.</p>

<h3>Constructors and <code>.constructor</code></h3>
<p>By default, <code>Fn.prototype</code> has a non-enumerable <code>constructor</code> property pointing back at <code>Fn</code>. If you overwrite <code>Fn.prototype</code> wholesale (e.g., <code>Fn.prototype = Object.create(Parent.prototype)</code>), the link is lost — restore it if you rely on it:</p>
<pre><code class="language-js">Child.prototype = Object.create(Parent.prototype);
Child.prototype.constructor = Child;</code></pre>

<h3>ES6 class inheritance</h3>
<pre><code class="language-js">class Animal {
  constructor(name) { this.name = name; }
  speak() { return this.name + ' speaks'; }
}
class Dog extends Animal {
  constructor(name) { super(name); }
  speak() { return super.speak() + ' (woof)'; }
}</code></pre>
<p><code>extends</code> sets up <em>two</em> prototype links:</p>
<ul>
  <li><code>Dog.prototype.[[Prototype]] = Animal.prototype</code> — for instance methods.</li>
  <li><code>Dog.[[Prototype]] = Animal</code> — for <em>static</em> methods, so <code>Dog.staticFromAnimal()</code> works.</li>
</ul>
<p><code>super.speak()</code> uses the class's <code>[[HomeObject]]</code> to find the parent method — not <code>this.[[Prototype]]</code>. That's important for multi-level inheritance where <code>this</code> is the grandchild.</p>

<h3>Property shadowing — reads vs writes</h3>
<p>When you assign <code>obj.x = v</code>, even if <code>x</code> exists on the prototype as a data property, the assignment creates an own property on <code>obj</code>. BUT: if <code>x</code> exists on the prototype as a <em>setter</em>, the setter is invoked (no shadowing happens). Likewise, if the prototype's <code>x</code> is defined as non-writable (<code>writable: false</code>), the assignment silently fails in sloppy mode and throws in strict mode.</p>

<h3>null-prototype objects</h3>
<p><code>Object.create(null)</code> produces an object with <em>no</em> prototype chain. It has no <code>toString</code>, no <code>hasOwnProperty</code>. Useful as a dictionary (map) because you never accidentally collide with inherited properties like <code>constructor</code> or <code>__proto__</code>.</p>
<pre><code class="language-js">const dict = Object.create(null);
dict['__proto__'] = 'hello'; // becomes a real own property
dict.toString; // undefined</code></pre>

<h3>Private fields (<code># syntax</code>)</h3>
<p>Private fields are lexically scoped to the class body — they're not on the prototype and not accessible via bracket notation. They're stored in a per-class <em>WeakMap</em>-like slot keyed by the instance. You can only read/write them inside the class that declared them.</p>
<pre><code class="language-js">class Counter {
  #n = 0;
  inc() { this.#n++; return this.#n; }
}
const c = new Counter();
c.#n; // SyntaxError — not in this class</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — manual prototype chain with Object.create</h3>
<pre><code class="language-js">const animal = {
  type: 'animal',
  describe() { return 'I am a ' + this.type; }
};
const dog = Object.create(animal);
dog.type = 'dog';
console.log(dog.describe()); // 'I am a dog'</code></pre>

<h3>Example 2 — constructor function</h3>
<pre><code class="language-js">function User(name) {
  this.name = name;
}
User.prototype.greet = function () {
  return 'hi ' + this.name;
};
const u = new User('Ada');
console.log(u.greet());                       // 'hi Ada'
console.log(Object.getPrototypeOf(u) === User.prototype); // true</code></pre>

<h3>Example 3 — ES6 class, same thing</h3>
<pre><code class="language-js">class User {
  constructor(name) { this.name = name; }
  greet() { return 'hi ' + this.name; }
}
const u = new User('Ada');
console.log(u.greet()); // 'hi Ada'</code></pre>

<h3>Example 4 — extends / super</h3>
<pre><code class="language-js">class Animal {
  constructor(name) { this.name = name; }
  speak() { return this.name + ' makes a sound'; }
}
class Dog extends Animal {
  constructor(name) { super(name); this.tricks = []; }
  speak() { return super.speak() + ' (bark)'; }
}
const d = new Dog('Rex');
console.log(d.speak()); // 'Rex makes a sound (bark)'
console.log(d instanceof Dog);    // true
console.log(d instanceof Animal); // true</code></pre>

<h3>Example 5 — instanceof walks the chain</h3>
<pre><code class="language-js">class A {}
class B extends A {}
class C extends B {}
const c = new C();
console.log(c instanceof C); // true
console.log(c instanceof B); // true
console.log(c instanceof A); // true
console.log(c instanceof Object); // true — end of chain</code></pre>

<h3>Example 6 — read walks up, write shadows</h3>
<pre><code class="language-js">const parent = { color: 'blue' };
const child = Object.create(parent);
console.log(child.color);  // 'blue' — read walked up
child.color = 'red';       // write: own property on child
console.log(child.color);  // 'red'
console.log(parent.color); // 'blue' — unchanged
delete child.color;
console.log(child.color);  // 'blue' — back to inherited</code></pre>

<h3>Example 7 — for...in sees inherited properties</h3>
<pre><code class="language-js">const parent = { a: 1 };
const child = Object.create(parent);
child.b = 2;
for (const k in child) console.log(k); // 'b', 'a'</code></pre>
<p>Use <code>Object.keys(child)</code> → <code>['b']</code> for own only, or add <code>Object.hasOwn(child, k)</code> guard in the loop.</p>

<h3>Example 8 — polyfill pattern</h3>
<pre><code class="language-js">if (!Array.prototype.last) {
  Object.defineProperty(Array.prototype, 'last', {
    value: function () { return this[this.length - 1]; },
    writable: true, configurable: true, enumerable: false
  });
}
[1,2,3].last(); // 3</code></pre>
<p>Defined as non-enumerable so <code>for...in</code> doesn't see it. This pattern is how libraries added methods pre-ES6.</p>

<h3>Example 9 — null-prototype dictionary</h3>
<pre><code class="language-js">const userIds = Object.create(null);
userIds['alice'] = 1;
userIds['toString'] = 99; // safe — no inherited toString to shadow
console.log('toString' in userIds); // true (own)
console.log(userIds.hasOwnProperty); // undefined — no prototype!
Object.hasOwn(userIds, 'alice');     // true — safer API</code></pre>

<h3>Example 10 — mixin pattern</h3>
<pre><code class="language-js">const Serializable = {
  toJSON() { return JSON.stringify(this); }
};
const Trackable = {
  track() { console.log('tracked', this); }
};
class User {
  constructor(name) { this.name = name; }
}
Object.assign(User.prototype, Serializable, Trackable);
new User('Ada').toJSON(); // '{"name":"Ada"}'</code></pre>
<p>JS has no multi-inheritance, but mixins give you compositional sharing.</p>

<h3>Example 11 — implementing instanceof by hand</h3>
<pre><code class="language-js">function isInstanceOf(obj, Ctor) {
  let p = Object.getPrototypeOf(obj);
  while (p) {
    if (p === Ctor.prototype) return true;
    p = Object.getPrototypeOf(p);
  }
  return false;
}
isInstanceOf([], Array);  // true
isInstanceOf([], Object); // true
isInstanceOf({}, Array);  // false</code></pre>

<h3>Example 12 — implementing Object.create by hand</h3>
<pre><code class="language-js">function myCreate(proto) {
  function F() {}
  F.prototype = proto;
  return new F();
}
const a = { x: 1 };
const b = myCreate(a);
console.log(b.x); // 1</code></pre>

<h3>Example 13 — implementing new by hand</h3>
<pre><code class="language-js">function myNew(Ctor, ...args) {
  const obj = Object.create(Ctor.prototype);
  const ret = Ctor.apply(obj, args);
  return (ret !== null && typeof ret === 'object') ? ret : obj;
}
function Point(x, y) { this.x = x; this.y = y; }
const p = myNew(Point, 1, 2);
console.log(p instanceof Point); // true</code></pre>

<h3>Example 14 — constructor returning object</h3>
<pre><code class="language-js">function Weird() {
  this.a = 1;
  return { b: 2 };
}
const w = new Weird();
console.log(w.a); // undefined — new honored the explicit object return
console.log(w.b); // 2</code></pre>
<p>If the constructor returns a primitive, the instance wins. Return an object, and the object wins. Rarely useful; often a bug.</p>

<h3>Example 15 — super in a multilevel chain</h3>
<pre><code class="language-js">class A { greet() { return 'A'; } }
class B extends A { greet() { return super.greet() + 'B'; } }
class C extends B { greet() { return super.greet() + 'C'; } }
new C().greet(); // 'ABC'</code></pre>

<h3>Example 16 — private fields are not on the prototype</h3>
<pre><code class="language-js">class Counter {
  #n = 0;
  inc() { return ++this.#n; }
}
const c = new Counter();
Object.getPrototypeOf(c); // Counter.prototype — has inc, no #n
c.inc(); // 1</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Arrow functions have no <code>prototype</code></h3>
<pre><code class="language-js">const F = () =&gt; {};
F.prototype;    // undefined
new F();        // TypeError: F is not a constructor</code></pre>

<h3>2. Replacing <code>Fn.prototype</code> wholesale</h3>
<pre><code class="language-js">function F() {}
const a = new F();
F.prototype = { greet() { return 'hi'; } };
const b = new F();
b.greet();                // 'hi'
a.greet;                  // undefined — a still linked to OLD F.prototype
a instanceof F;           // false — its chain no longer contains F.prototype</code></pre>
<p>Why: <code>instanceof</code> checks the <em>current</em> <code>F.prototype</code> against the chain. Old instances are frozen to the old prototype object.</p>

<h3>3. Losing <code>constructor</code> on manual inheritance</h3>
<pre><code class="language-js">function Parent() {}
function Child() {}
Child.prototype = Object.create(Parent.prototype);
// Child.prototype.constructor is now Parent!
new Child().constructor === Parent; // true  ← confusing
// Fix:
Child.prototype.constructor = Child;</code></pre>

<h3>4. Setters on the prototype prevent shadowing</h3>
<pre><code class="language-js">const proto = {
  set x(v) { this._x = v * 2; },
  get x() { return this._x; }
};
const obj = Object.create(proto);
obj.x = 5;        // runs the setter — no own x created
console.log(obj); // { _x: 10 }</code></pre>

<h3>5. Non-writable properties on the prototype block shadowing</h3>
<pre><code class="language-js">'use strict';
const proto = {};
Object.defineProperty(proto, 'x', { value: 1, writable: false });
const obj = Object.create(proto);
obj.x = 2; // TypeError in strict; silent no-op in sloppy</code></pre>

<h3>6. Classes are not hoisted (unlike functions)</h3>
<pre><code class="language-js">new A(); // ReferenceError — TDZ
class A {}</code></pre>

<h3>7. Class constructor cannot be called without <code>new</code></h3>
<pre><code class="language-js">class A {}
A(); // TypeError: Class constructor A cannot be invoked without 'new'
function B() {}
B(); // OK — B runs as a plain function call, this = undefined (strict) / global (sloppy)</code></pre>

<h3>8. Class methods are non-enumerable, but prototype-assigned methods are</h3>
<pre><code class="language-js">class A { m() {} }
Object.getOwnPropertyDescriptor(A.prototype, 'm').enumerable; // false
function B() {}
B.prototype.m = function () {};
Object.getOwnPropertyDescriptor(B.prototype, 'm').enumerable; // true</code></pre>
<p>Consequence: <code>for...in</code> over an instance of <code>B</code> will see <code>m</code>; over an instance of <code>A</code>, won't.</p>

<h3>9. <code>instanceof</code> across realms / iframes</h3>
<pre><code class="language-js">// In an iframe:
iframe.contentWindow.Array !== Array;
const arr = new iframe.contentWindow.Array();
arr instanceof Array; // false — different realm, different Array.prototype</code></pre>
<p>Use <code>Array.isArray(arr)</code> — it's realm-safe because it checks an internal slot.</p>

<h3>10. Methods defined on <code>Object.prototype</code> are visible on EVERY object</h3>
<pre><code class="language-js">Object.prototype.spoof = 'bad';
const o = {};
o.spoof; // 'bad'
for (const k in o) console.log(k); // 'spoof' — leaks into every iteration</code></pre>
<p>Never extend <code>Object.prototype</code>. It's the #1 library-incompatibility bug.</p>

<h3>11. <code>typeof instance.constructor</code> vs <code>instanceof</code></h3>
<pre><code class="language-js">class A {}
class B extends A {}
const b = new B();
b.constructor;           // B
b.constructor === A;     // false — constructor is B even though chain includes A
b instanceof A;          // true
b instanceof B;          // true</code></pre>
<p>Use <code>instanceof</code> for "is-a" checks; use <code>constructor</code> for "exactly which class made this" — and even then, <code>constructor</code> can be overwritten.</p>

<h3>12. Calling <code>super()</code> rules in subclass constructors</h3>
<pre><code class="language-js">class A { constructor() { this.a = 1; } }
class B extends A {
  constructor() {
    console.log(this); // ReferenceError — this is in TDZ before super()
    super();
    console.log(this); // OK
  }
}</code></pre>

<h3>13. <code>super</code> in plain objects</h3>
<pre><code class="language-js">const parent = { greet() { return 'parent'; } };
const child = {
  __proto__: parent,
  greet() { return super.greet() + ' + child'; }
};
child.greet(); // 'parent + child'</code></pre>
<p><code>super</code> works in method shorthand in object literals too, not just classes. It uses the method's <code>[[HomeObject]]</code> to find the prototype.</p>

<h3>14. <code>Object.create(null)</code> has no <code>toString</code></h3>
<pre><code class="language-js">const o = Object.create(null);
'' + o; // TypeError: Cannot convert object to primitive value</code></pre>
<p>You lose all inherited methods. Concatenation, <code>console.log</code> formatting, <code>JSON.stringify</code> (ok), and most protocols behave differently.</p>

<h3>15. <code>__proto__</code> is accessor, not data</h3>
<p><code>__proto__</code> is actually a getter/setter on <code>Object.prototype</code>. That's why <code>Object.create(null).__proto__</code> is <code>undefined</code> — the accessor isn't inherited. In ES2022, <code>__proto__</code> in object literal syntax (<code>{ __proto__: parent }</code>) is a special syntactic form — it <em>does</em> set the prototype even on null-prototype cases. Confusing; prefer <code>Object.create</code>.</p>

<h3>16. Performance cost of setPrototypeOf</h3>
<p>Every V8 optimization built around an object's <em>shape</em> (hidden class) is invalidated when you <code>Object.setPrototypeOf</code>. Caches get cleared, polymorphic inline caches degrade, future lookups on that object slow down. Assume 10-100× slower for the next few hundred property accesses. Always set the prototype at construction time (<code>Object.create</code>, <code>new</code>) when performance matters.</p>

<h3>17. Circular prototype chains throw</h3>
<pre><code class="language-js">const a = {};
const b = Object.create(a);
Object.setPrototypeOf(a, b); // TypeError: Cyclic __proto__ value</code></pre>

<h3>18. <code>class</code> declaration creates a function</h3>
<pre><code class="language-js">class A {}
typeof A; // 'function'</code></pre>
<p>Classes <em>are</em> functions at the runtime level. The "class" is just a tagged function with a properly set-up prototype.</p>

<h3>19. Static members live on the constructor, not the prototype</h3>
<pre><code class="language-js">class A { static s() { return 1; } }
A.s();                  // 1
new A().s;              // undefined — s is not on instances
A.prototype.s;          // undefined — s is not on the prototype either</code></pre>
<p><code>extends</code> sets up the static chain too: <code>Child.s</code> works because <code>Object.getPrototypeOf(Child) === Parent</code>.</p>

<h3>20. Frozen prototype</h3>
<pre><code class="language-js">Object.freeze(Object.prototype);
// now nothing can extend Object.prototype — defensive in trusted runtimes</code></pre>
<p>SES / Realms use this pattern to protect core prototypes from prototype pollution attacks.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — extending built-in prototypes</h3>
<pre><code class="language-js">// BAD
Array.prototype.first = function () { return this[0]; };</code></pre>
<p>Collides with future standards (e.g., <code>Array.prototype.at</code>), breaks <code>for...in</code> everywhere, and conflicts with libraries that do the same. If you really must, define it non-enumerable with <code>Object.defineProperty</code>. Better: use a plain function or a module utility.</p>

<h3>Anti-pattern 2 — Object.setPrototypeOf in hot code</h3>
<pre><code class="language-js">// BAD
for (const item of items) {
  Object.setPrototypeOf(item, MyClass.prototype);
}</code></pre>
<p>Massive deopt. Either use <code>Object.create(MyClass.prototype)</code> at item creation or construct <code>new MyClass()</code> instances with proper shape.</p>

<h3>Anti-pattern 3 — relying on <code>constructor</code> for instance-of checks</h3>
<pre><code class="language-js">// BAD — constructor can be overwritten
if (obj.constructor === User) { ... }</code></pre>
<p>Prefer <code>instanceof</code> or a duck-typed check.</p>

<h3>Anti-pattern 4 — forgetting <code>super()</code> in a subclass constructor</h3>
<pre><code class="language-js">class Dog extends Animal {
  constructor() {
    this.name = 'Rex'; // ReferenceError: Must call super constructor
  }
}</code></pre>
<p>In subclasses, <code>this</code> is in TDZ until <code>super()</code> runs.</p>

<h3>Anti-pattern 5 — using <code>for...in</code> on arrays</h3>
<pre><code class="language-js">// BAD
for (const i in arr) { ... }  // iterates keys, including inherited ones</code></pre>
<p>Use <code>for</code>, <code>for...of</code>, or <code>forEach</code>. <code>for...in</code> makes prototype pollution bugs louder than they should be.</p>

<h3>Anti-pattern 6 — prototype pollution via user input</h3>
<pre><code class="language-js">// BAD
function merge(target, source) {
  for (const k in source) target[k] = source[k];
}
merge({}, JSON.parse('{"__proto__": {"admin": true}}'));
({}).admin; // true — Object.prototype polluted</code></pre>
<p>Defense: use <code>Object.hasOwn</code>, reject <code>__proto__</code>/<code>constructor</code>/<code>prototype</code> keys, or merge into <code>Object.create(null)</code>. This is a real CVE class — lodash, qs, ramda have all shipped fixes.</p>

<h3>Anti-pattern 7 — over-inheritance</h3>
<pre><code class="language-js">// BAD
class Employee extends Person {}
class Manager extends Employee {}
class Director extends Manager {}</code></pre>
<p>Deep inheritance hierarchies are brittle. Prefer composition: <code>new Person(profile, role, reports)</code>.</p>

<h3>Anti-pattern 8 — instance methods instead of prototype methods</h3>
<pre><code class="language-js">// BAD — one function per instance, wastes memory
class User {
  constructor(name) {
    this.name = name;
    this.greet = function () { return 'hi ' + this.name; };
  }
}</code></pre>
<p>Define methods on the prototype (class methods do this for free). Only use instance methods when you need per-instance bindings (e.g., bound callbacks — and even then, prefer class fields or a constructor-time <code>this.method = this.method.bind(this)</code>).</p>

<h3>Anti-pattern 9 — assuming <code>class</code> is "classical"</h3>
<p>Don't expect private-by-default, abstract classes, interfaces, or multi-inheritance. JS only recently got <code>#</code> private fields. "Abstract" is a convention you enforce in the constructor (<code>if (new.target === Base) throw ...</code>).</p>

<h3>Anti-pattern 10 — forgetting <code>new</code></h3>
<pre><code class="language-js">function User(name) { this.name = name; }
const u = User('Ada'); // u is undefined; set global 'name' in sloppy mode
const u2 = new User('Ada'); // correct</code></pre>
<p>Class syntax throws a TypeError instead of silently polluting the global, which is one reason to prefer it.</p>

<h3>Anti-pattern 11 — <code>this</code> loss in class methods</h3>
<pre><code class="language-js">class User {
  constructor(name) { this.name = name; }
  greet() { return 'hi ' + this.name; }
}
const u = new User('Ada');
const fn = u.greet;
fn(); // TypeError — this is undefined
[u].map(u.greet); // same issue</code></pre>
<p>Fix: bind in constructor, use arrow class field <code>greet = () =&gt; ...</code>, or wrap at the call site.</p>

<h3>Anti-pattern 12 — mutating shared prototype state</h3>
<pre><code class="language-js">class User {
  constructor() {}
}
User.prototype.tags = []; // shared array!
const a = new User(), b = new User();
a.tags.push('x');
b.tags; // ['x']  ← cross-instance pollution</code></pre>
<p>Arrays/objects on the prototype are shared across all instances. Initialize mutable state in the constructor: <code>this.tags = []</code>.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. Explain how <code>new</code> works under the hood.</div>
  <div class="qa-answer">
    <p>Four steps:</p>
    <ol>
      <li>A new plain object is created and its <code>[[Prototype]]</code> is set to <code>Ctor.prototype</code>.</li>
      <li><code>Ctor</code> is called with <code>this</code> bound to that new object and the arguments passed.</li>
      <li>If <code>Ctor</code> explicitly returns an object, that object becomes the result; otherwise the new object does.</li>
      <li>The result is the instance you get back.</li>
    </ol>
    <p>I can write <code>myNew</code>: <code>const obj = Object.create(Ctor.prototype); const ret = Ctor.apply(obj, args); return (ret && typeof ret === 'object') ? ret : obj;</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. What is the prototype chain?</div>
  <div class="qa-answer">
    <p>Every object has a hidden link called <code>[[Prototype]]</code> to another object. When you read a property, the engine checks the object itself; if not found, follows the link to the prototype; repeats until it finds the property or hits <code>null</code>. Writes always land on the originating object, creating or updating an own property (unless blocked by a prototype setter or a non-writable prototype property). That walk-up-on-read, stay-on-write mechanism IS inheritance in JS.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Difference between <code>__proto__</code> and <code>prototype</code>?</div>
  <div class="qa-answer">
    <p><code>__proto__</code> is a property on <em>every object</em> (a legacy accessor for the internal <code>[[Prototype]]</code> slot). <code>prototype</code> is a property on <em>function objects</em>; it holds the object that will become the <code>[[Prototype]]</code> of any instance made with <code>new Fn()</code>. So <code>u.__proto__ === User.prototype</code> for <code>const u = new User()</code>. In modern code, use <code>Object.getPrototypeOf(u)</code> instead of <code>u.__proto__</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Implement <code>instanceof</code></div>
  <div class="qa-answer">
<pre><code class="language-js">function myInstanceof(obj, Ctor) {
  if (obj == null || (typeof obj !== 'object' && typeof obj !== 'function')) return false;
  let p = Object.getPrototypeOf(obj);
  const target = Ctor.prototype;
  while (p !== null) {
    if (p === target) return true;
    p = Object.getPrototypeOf(p);
  }
  return false;
}</code></pre>
    <p>Edge: primitives always return false. <code>Ctor</code> must be a function with a <code>prototype</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Is <code>class</code> just syntactic sugar?</div>
  <div class="qa-answer">
    <p>At the inheritance/chain level, yes — classes use the same <code>[[Prototype]]</code> and <code>new</code> machinery. But there are real semantic differences: class bodies are strict by default, classes can't be called without <code>new</code>, class declarations are in TDZ (not hoisted like function declarations), class methods are non-enumerable by default, and <code>extends</code> sets up both instance and static prototype links. Private fields (<code>#x</code>) are not representable with plain function syntax at all.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Write inheritance without <code>class</code></div>
  <div class="qa-answer">
<pre><code class="language-js">function Animal(name) { this.name = name; }
Animal.prototype.speak = function () { return this.name + ' speaks'; };

function Dog(name) { Animal.call(this, name); }
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;
Dog.prototype.bark = function () { return 'woof'; };

const d = new Dog('Rex');
d.speak(); // 'Rex speaks'
d.bark();  // 'woof'
d instanceof Dog;    // true
d instanceof Animal; // true</code></pre>
    <p>This is what <code>class</code> roughly desugars to. <code>Animal.call(this, name)</code> is <code>super(name)</code>. <code>Object.create(Animal.prototype)</code> sets up the chain. <code>.constructor</code> is restored manually.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. What does this print?</div>
<pre><code class="language-js">function F() {}
const a = new F();
F.prototype = { x: 1 };
const b = new F();
console.log(a.x, b.x);</code></pre>
  <div class="qa-answer">
    <p><code>undefined 1</code>. Instance <code>a</code> was linked to the OLD <code>F.prototype</code> at construction time; changing <code>F.prototype</code> later doesn't retroactively update <code>a</code>'s chain. Instance <code>b</code> was constructed after the swap, so its <code>[[Prototype]]</code> is the new object. Also: <code>a instanceof F</code> → false; <code>b instanceof F</code> → true.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. What's prototype pollution and how do you defend?</div>
  <div class="qa-answer">
    <p>A class of vulnerabilities where untrusted input (JSON merge, query-string parsing, lodash's <code>_.set</code>) walks into a key like <code>__proto__</code> or <code>constructor.prototype</code> and ends up mutating <code>Object.prototype</code>. Every object in the runtime then inherits the injected property.</p>
    <p>Defenses: (1) block dangerous keys (<code>__proto__</code>, <code>prototype</code>, <code>constructor</code>) in any recursive merge; (2) use <code>Object.hasOwn</code> instead of <code>in</code> when iterating; (3) parse into null-prototype targets (<code>Object.create(null)</code>); (4) freeze <code>Object.prototype</code> in trusted environments; (5) keep dependencies patched.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Why is <code>Array.isArray</code> preferred over <code>arr instanceof Array</code>?</div>
  <div class="qa-answer">
    <p>Across realms (iframes, Node worker_threads, vm contexts), each realm has its own <code>Array</code> constructor and therefore its own <code>Array.prototype</code>. An array created in one realm fails <code>instanceof Array</code> in another. <code>Array.isArray</code> checks an internal slot that's universal across realms.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. What does <code>super.method()</code> actually do inside a class method?</div>
  <div class="qa-answer">
    <p>It's compiled to a call on the method's <code>[[HomeObject]].[[Prototype]]</code>, with <code>this</code> preserved from the current call. So in a three-level chain <code>A &lt;- B &lt;- C</code>, inside <code>B.prototype.method</code>, <code>super.method()</code> finds <code>A.prototype.method</code> and calls it with <code>this = c</code> (the C instance). Key: <code>super</code> does NOT use <code>this.[[Prototype]]</code> — that would infinitely recurse when called from a grandchild. Each method's compiled <code>[[HomeObject]]</code> is fixed at class-definition time.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Write a shallow <code>Object.create</code>.</div>
  <div class="qa-answer">
<pre><code class="language-js">function myCreate(proto, propertiesObject) {
  if (proto !== null && (typeof proto !== 'object' &amp;&amp; typeof proto !== 'function')) {
    throw new TypeError('proto must be object or null');
  }
  function F() {}
  F.prototype = proto;
  const obj = new F();
  if (propertiesObject) Object.defineProperties(obj, propertiesObject);
  return obj;
}</code></pre>
    <p>Caveat: <code>Object.create(null)</code> needs special handling — the <code>F.prototype = null</code> assignment still works, but some engines historically had quirks.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Predict the output</div>
<pre><code class="language-js">class A {}
class B extends A {}
console.log(Object.getPrototypeOf(B) === A);           // ?
console.log(Object.getPrototypeOf(B.prototype) === A.prototype); // ?</code></pre>
  <div class="qa-answer">
    <p>Both <code>true</code>. <code>extends</code> wires TWO chains: the static chain (<code>B.[[Prototype]] = A</code> so <code>A</code>'s static methods are inherited by <code>B</code>) and the instance chain (<code>B.prototype.[[Prototype]] = A.prototype</code> so instance methods work).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Why is defining mutable state on the prototype a bug?</div>
  <div class="qa-answer">
    <p>Because the prototype object is shared across every instance. If you write <code>Foo.prototype.items = []</code>, then <code>new Foo().items</code> and <code>new Foo().items</code> are the same array. A <code>push</code> on one appears on all. Always initialize mutable per-instance state in the constructor via <code>this.items = []</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. When would you use <code>Object.create(null)</code>?</div>
  <div class="qa-answer">
    <p>When you need a pure dictionary with no inherited keys. Use cases: (1) storing user-provided keys where collision with <code>toString</code>/<code>hasOwnProperty</code>/<code>__proto__</code> would be a bug; (2) defending against prototype pollution; (3) hot maps where <code>in</code> checks need to be true-own. Downsides: no <code>toString</code>, no <code>hasOwnProperty</code>, so use <code>Object.hasOwn</code> and explicit JSON serialization.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Debug this:</div>
<pre><code class="language-js">class Counter {
  constructor() { this.n = 0; }
  inc() { this.n++; }
}
const c = new Counter();
setTimeout(c.inc, 100);
// Error a moment later</code></pre>
  <div class="qa-answer">
    <p>The issue is <code>this</code>-loss. <code>c.inc</code> is detached from <code>c</code>; when <code>setTimeout</code> calls it, <code>this</code> is <code>undefined</code> (classes are strict), so <code>this.n++</code> throws. Fixes: <code>setTimeout(() =&gt; c.inc(), 100)</code>, <code>setTimeout(c.inc.bind(c), 100)</code>, or define <code>inc</code> as an arrow class field: <code>inc = () =&gt; { this.n++; };</code> — the arrow captures <code>this</code> lexically.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You clearly separate <code>__proto__</code> (every object) from <code>prototype</code> (functions only).</li>
    <li>You can walk through what <code>new</code> does in 4 steps.</li>
    <li>You describe the read-up / write-shadow rule.</li>
    <li>You implement <code>instanceof</code> and know the realm pitfall.</li>
    <li>You explain why <code>class</code> is not purely sugar (strict, TDZ, non-enumerable, new-only).</li>
    <li>You can cite prototype pollution as a real vulnerability class.</li>
    <li>You warn against mutable state on the prototype.</li>
  </ul>
</div>
`}

]
});
