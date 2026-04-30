window.PREP_SITE.registerTopic({
  id: 'js-advanced',
  module: 'js',
  title: 'Advanced (Proxy, Symbol, Intl)',
  estimatedReadTime: '45 min',
  tags: ['proxy', 'reflect', 'symbol', 'iterator', 'generator', 'intl', 'weakmap', 'weakset', 'meta-programming'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>Past the everyday surface of JavaScript sits a "metaprogramming" layer: <strong>Symbol</strong> for unforgeable keys, <strong>Proxy</strong>/<strong>Reflect</strong> for intercepting object operations, <strong>iterators &amp; generators</strong> for custom traversal, <strong>WeakMap</strong>/<strong>WeakSet</strong> for memory-safe associations, and <strong>Intl</strong> for locale-correct formatting. These features power libraries (Vue's reactivity, Mobx, Zod), the language internals you depend on, and the bug surface you'll meet in interview deep-dives.</p>
<ul>
  <li><strong>Symbol:</strong> primitive that's <em>unique</em> per instantiation. Use as object keys to prevent collisions; well-known symbols (<code>Symbol.iterator</code>, <code>Symbol.asyncIterator</code>, <code>Symbol.toPrimitive</code>) are protocol hooks.</li>
  <li><strong>Proxy:</strong> wraps an object with a "trap" handler that intercepts <code>get</code>, <code>set</code>, <code>has</code>, <code>deleteProperty</code>, <code>apply</code>, etc. The foundation of Vue 3 reactivity, Immer, and most observability libraries.</li>
  <li><strong>Reflect:</strong> the canonical, non-throwing API for low-level object operations. Always pair with Proxy traps to forward defaults.</li>
  <li><strong>Iterators / generators:</strong> any object with <code>[Symbol.iterator]() → { next() }</code> works in <code>for...of</code>. <code>function*</code> compiles to such an object; <code>yield</code> pauses execution.</li>
  <li><strong>WeakMap / WeakSet:</strong> keys held weakly — entries vanish when the key has no other references. Memory-leak-safe caches and per-DOM-node metadata storage.</li>
  <li><strong>Intl:</strong> built-in localized formatting — numbers, dates, currencies, plurals, list joining, segmentation. Replaces 90% of moment.js use cases at zero bundle cost.</li>
  <li><strong>FinalizationRegistry / WeakRef</strong> exist but are intentionally limited; use sparingly.</li>
</ul>
<p><strong>Mantra:</strong> "Symbols for protocols. Proxy for observation. Iterators for traversal. Weak collections for memory safety. Intl for the world."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What "advanced" means here</h3>
<p>This topic groups features that exist in modern JS engines (ES2015+) but rarely show up in everyday product code. They're the level you operate at when you're <em>writing</em> the library that other developers consume — or when you're debugging that library's internals.</p>

<h3>Why each piece matters</h3>
<table>
  <thead><tr><th>Feature</th><th>Where it shows up</th></tr></thead>
  <tbody>
    <tr><td>Symbol</td><td>Iteration protocol, well-known protocols (<code>Symbol.iterator</code>, <code>Symbol.asyncIterator</code>, <code>Symbol.toPrimitive</code>); private-ish object keys; React/RN internals.</td></tr>
    <tr><td>Proxy + Reflect</td><td>Vue 3 reactivity, MobX 6, Immer, valtio, observable property tracking, automatic memoization, validation libraries.</td></tr>
    <tr><td>Iterators / generators</td><td>Lazy sequences, custom <code>for...of</code> traversal, <code>redux-saga</code>, async iteration over server-sent events.</td></tr>
    <tr><td>WeakMap / WeakSet</td><td>Per-instance metadata in libraries; preventing memory leaks in caches; private-ish state.</td></tr>
    <tr><td>WeakRef / FinalizationRegistry</td><td>Cache eviction, resource cleanup. Rarely the right answer; avoid by default.</td></tr>
    <tr><td>Intl</td><td>Date / number / currency / plural / list / segment localization.</td></tr>
  </tbody>
</table>

<h3>Why interviewers ask</h3>
<p>These features separate "I write apps" from "I understand the language." They probe whether you can:</p>
<ol>
  <li>Reason about object operations at the meta-level (what <em>does</em> <code>obj.foo = 1</code> actually do?).</li>
  <li>Build a small reactive system in 20 lines using Proxy.</li>
  <li>Understand why a Map can leak and a WeakMap can't.</li>
  <li>Use Symbol.iterator correctly so a custom collection plugs into the language.</li>
  <li>Format prices and dates without bringing in a 50KB locale library.</li>
</ol>

<h3>What "good" looks like</h3>
<ul>
  <li>You reach for Symbol when adding a key that should never collide with user-data keys.</li>
  <li>You use Proxy for cross-cutting concerns (logging, validation, dependency tracking) — not for hand-rolling getters/setters.</li>
  <li>You always pair Proxy traps with <code>Reflect.*</code> to preserve correct semantics.</li>
  <li>You write iterators when collections need lazy / infinite traversal.</li>
  <li>You use WeakMap for "metadata associated with this object that should die with it."</li>
  <li>You never hand-roll a <code>formatCurrency</code> — you reach for <code>Intl.NumberFormat</code>.</li>
</ul>

<h3>What this topic is NOT</h3>
<p>It's not a kitchen sink of every ES feature. We skip <code>BigInt</code>, <code>regex</code> deep dives, top-level <code>await</code>, decorators, and tagged templates — they each warrant their own topic. We focus on the meta-programming axis: features that change <em>how the engine evaluates code</em>, not features that just add new syntax for the same semantics.</p>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The "object operation" abstraction</h3>
<p>Every line of JS that touches an object compiles down to one of a small set of <em>internal operations</em> the spec calls "essential internal methods":</p>
<table>
  <thead><tr><th>You write</th><th>Engine performs</th></tr></thead>
  <tbody>
    <tr><td><code>obj.foo</code></td><td>[[Get]]</td></tr>
    <tr><td><code>obj.foo = 1</code></td><td>[[Set]]</td></tr>
    <tr><td><code>'foo' in obj</code></td><td>[[HasProperty]]</td></tr>
    <tr><td><code>delete obj.foo</code></td><td>[[Delete]]</td></tr>
    <tr><td><code>Object.keys(obj)</code></td><td>[[OwnPropertyKeys]]</td></tr>
    <tr><td><code>Object.getPrototypeOf(obj)</code></td><td>[[GetPrototypeOf]]</td></tr>
    <tr><td><code>fn()</code></td><td>[[Call]] (if function)</td></tr>
    <tr><td><code>new Cls()</code></td><td>[[Construct]]</td></tr>
  </tbody>
</table>
<p><strong>Proxy intercepts every one of these.</strong> Once you see operations as a finite list of trappable hooks, Proxy stops feeling magical.</p>

<h3>Symbol — the "unguessable string"</h3>
<p>A Symbol is a primitive value that is unique by construction. Two calls to <code>Symbol("foo")</code> produce non-equal symbols even though both have the same description. They never collide with regular string keys, never appear in <code>JSON.stringify</code>, and (when used as keys) require explicit <code>Object.getOwnPropertySymbols</code> to enumerate.</p>
<pre><code class="language-js">const tag = Symbol('tag');
const obj = { name: 'x', [tag]: 'secret' };
JSON.stringify(obj);                 // '{"name":"x"}' — tag invisible
Object.keys(obj);                    // ['name'] — tag invisible
Object.getOwnPropertySymbols(obj);   // [Symbol(tag)] — must opt in
</code></pre>

<h3>Well-known symbols are protocol slots</h3>
<table>
  <thead><tr><th>Symbol</th><th>Protocol</th></tr></thead>
  <tbody>
    <tr><td><code>Symbol.iterator</code></td><td>"How does <code>for...of</code> traverse me?"</td></tr>
    <tr><td><code>Symbol.asyncIterator</code></td><td>"How does <code>for await...of</code> traverse me?"</td></tr>
    <tr><td><code>Symbol.toPrimitive</code></td><td>"How do I convert to primitive when used in <code>+</code>, <code>String()</code>, etc.?"</td></tr>
    <tr><td><code>Symbol.toStringTag</code></td><td>"What does <code>Object.prototype.toString.call(me)</code> return?"</td></tr>
    <tr><td><code>Symbol.hasInstance</code></td><td>"Override <code>x instanceof MyClass</code>."</td></tr>
    <tr><td><code>Symbol.species</code></td><td>"What constructor do <code>.map</code>/<code>.filter</code> on me use?"</td></tr>
  </tbody>
</table>

<h3>Iterator protocol — the contract</h3>
<pre><code class="language-js">const iterable = {
  [Symbol.iterator]() {
    let i = 0;
    return {
      next() {
        return i &lt; 3 ? { value: i++, done: false } : { value: undefined, done: true };
      }
    };
  }
};

for (const x of iterable) console.log(x);   // 0, 1, 2
[...iterable];                                // [0, 1, 2]
const [a, b] = iterable;                      // 0, 1
</code></pre>

<h3>Generators desugar iterators</h3>
<pre><code class="language-js">function* gen() {
  yield 1;
  yield 2;
  yield 3;
}

const it = gen();
it.next();   // { value: 1, done: false }
it.next();   // { value: 2, done: false }
it.next();   // { value: 3, done: false }
it.next();   // { value: undefined, done: true }
</code></pre>

<h3>Proxy: the meta-object</h3>
<p>A Proxy is a wrapper. Whenever you perform an operation on the proxy, the corresponding trap (if defined) runs; otherwise the operation forwards to the underlying target.</p>
<pre><code class="language-js">const p = new Proxy({}, {
  get(target, key, receiver) {
    console.log('get', key);
    return Reflect.get(target, key, receiver);   // forward
  },
  set(target, key, value, receiver) {
    console.log('set', key, value);
    return Reflect.set(target, key, value, receiver);
  },
});

p.foo = 1;     // logs: set foo 1
p.foo;         // logs: get foo, returns 1
</code></pre>

<h3>WeakMap — the "die together" map</h3>
<p>Map keys keep their values alive forever (memory leak waiting to happen). WeakMap keys are held weakly: when the key has no other references, the entry is collected.</p>
<pre><code class="language-js">const meta = new WeakMap();
{
  const node = document.querySelector('#x');
  meta.set(node, { renderCount: 0 });
}   // node out of scope; if the DOM also released it, the entry vanishes
</code></pre>
<p>Because keys can be GC'd at any time, WeakMap has no <code>.size</code>, no iteration, no <code>.keys()</code>. This is intentional.</p>

<h3>Intl — the runtime's i18n library</h3>
<p>Browsers and Node ship with full ICU data (or close to it). Node's flag <code>--icu=full-icu</code> ensures all locales are available; Node 19+ does this by default. RN ships with Hermes which has Intl support since Hermes 0.10.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Symbol basics</h3>
<pre><code class="language-js">// Local symbol — unique forever
const a = Symbol('id');
const b = Symbol('id');
a === b;                  // false

// Registry-shared (cross-realm) symbol
const c = Symbol.for('app/id');
const d = Symbol.for('app/id');
c === d;                  // true
Symbol.keyFor(c);          // 'app/id'

// Description (since ES2019)
Symbol('hi').description;  // 'hi'

// Symbol cannot be coerced to string implicitly
\`\${Symbol('x')}\`;          // throws TypeError
String(Symbol('x'));        // 'Symbol(x)' — explicit ok
</code></pre>

<h3>Symbol as object key</h3>
<pre><code class="language-js">const SECRET = Symbol('secret');
class User {
  constructor(name) {
    this.name = name;
    this[SECRET] = generateToken();
  }
}

const u = new User('a');
u.name;            // 'a'
u[SECRET];         // token (only callers with the symbol can read)
Object.keys(u);    // ['name'] — SECRET hidden from normal enumeration
</code></pre>

<h3>Well-known symbols in action</h3>
<pre><code class="language-js">// Custom toString tag
class Range {
  get [Symbol.toStringTag]() { return 'Range'; }
}
Object.prototype.toString.call(new Range());   // '[object Range]'

// toPrimitive: control coercion
class Temperature {
  constructor(c) { this.c = c; }
  [Symbol.toPrimitive](hint) {
    if (hint === 'number') return this.c;
    if (hint === 'string') return \`\${this.c}°C\`;
    return \`\${this.c}°C\`;   // 'default' (e.g., +)
  }
}
const t = new Temperature(20);
+t;                         // 20
\`\${t}\`;                     // '20°C'
t + ' outside';             // '20°C outside'
</code></pre>

<h3>Proxy traps — the full list</h3>
<table>
  <thead><tr><th>Trap</th><th>Trigger</th></tr></thead>
  <tbody>
    <tr><td>get(target, prop, receiver)</td><td>obj.prop</td></tr>
    <tr><td>set(target, prop, value, receiver)</td><td>obj.prop = value</td></tr>
    <tr><td>has(target, prop)</td><td>'prop' in obj</td></tr>
    <tr><td>deleteProperty(target, prop)</td><td>delete obj.prop</td></tr>
    <tr><td>ownKeys(target)</td><td>Object.keys(obj), for...in</td></tr>
    <tr><td>getOwnPropertyDescriptor</td><td>Object.getOwnPropertyDescriptor</td></tr>
    <tr><td>defineProperty</td><td>Object.defineProperty</td></tr>
    <tr><td>getPrototypeOf / setPrototypeOf</td><td>Reflective access</td></tr>
    <tr><td>isExtensible / preventExtensions</td><td>Object.isExtensible</td></tr>
    <tr><td>apply(target, thisArg, args)</td><td>fn(...) — function-only</td></tr>
    <tr><td>construct(target, args, newTarget)</td><td>new fn(...) — function-only</td></tr>
  </tbody>
</table>

<h3>Reflect — the canonical fallback</h3>
<pre><code class="language-js">// Reflect mirrors the trap names; pairs with Proxy
Reflect.get(target, key, receiver);
Reflect.set(target, key, value, receiver);
Reflect.has(target, key);
Reflect.deleteProperty(target, key);
Reflect.ownKeys(target);
Reflect.getOwnPropertyDescriptor(target, key);
Reflect.defineProperty(target, key, desc);
Reflect.getPrototypeOf(target);
Reflect.setPrototypeOf(target, proto);
Reflect.isExtensible(target);
Reflect.preventExtensions(target);
Reflect.apply(fn, thisArg, args);
Reflect.construct(fn, args, newTarget);
</code></pre>

<h3>Why always Reflect inside Proxy</h3>
<pre><code class="language-js">// BAD — naive forwarding loses 'receiver' context
new Proxy(target, {
  get(t, key) { return t[key]; }
});

// GOOD — preserves correct 'this' through prototype access
new Proxy(target, {
  get(t, key, receiver) { return Reflect.get(t, key, receiver); }
});
</code></pre>

<h3>Generators with values + return + throw</h3>
<pre><code class="language-js">function* counter(start) {
  let n = start;
  while (true) {
    const cmd = yield n;
    if (cmd === 'reset') n = start;
    else n++;
  }
}

const c = counter(10);
c.next();         // { value: 10 }
c.next();         // { value: 11 }
c.next('reset');  // { value: 10 }
c.throw(new Error('stop'));  // delivers Error inside the generator
c.return(42);                 // forces { value: 42, done: true }
</code></pre>

<h3>Async iterators</h3>
<pre><code class="language-js">async function* lines(stream) {
  let buf = '';
  for await (const chunk of stream) {
    buf += chunk;
    let i;
    while ((i = buf.indexOf('\\n')) !== -1) {
      yield buf.slice(0, i);
      buf = buf.slice(i + 1);
    }
  }
  if (buf) yield buf;
}

for await (const line of lines(file)) console.log(line);
</code></pre>

<h3>WeakMap as private state</h3>
<pre><code class="language-js">const _state = new WeakMap();

class Counter {
  constructor() { _state.set(this, { count: 0 }); }
  inc() { _state.get(this).count++; }
  get value() { return _state.get(this).count; }
}
</code></pre>
<p>Modern preferred alternative: class private fields (<code>#count</code>). Both achieve genuine privacy; private fields are syntax sugar with stronger encapsulation.</p>

<h3>WeakRef + FinalizationRegistry</h3>
<pre><code class="language-js">// Hold a weak reference to allow GC
const ref = new WeakRef(someBigObject);
// Later
const obj = ref.deref();
if (obj) doSomething(obj);   // may be undefined if GC'd

// Run a callback when the target is collected (no guarantees!)
const reg = new FinalizationRegistry((heldValue) =&gt; {
  console.log('cleanup', heldValue);
});
reg.register(someBigObject, 'someBigObject', someBigObject);
</code></pre>
<p><strong>Caveat:</strong> the spec says these may never fire. Don't use for correctness — only for opportunistic optimization (e.g., releasing native handles).</p>

<h3>Intl.NumberFormat</h3>
<pre><code class="language-js">new Intl.NumberFormat('en-US').format(1234567.89);              // "1,234,567.89"
new Intl.NumberFormat('de-DE').format(1234567.89);              // "1.234.567,89"
new Intl.NumberFormat('en-IN').format(1234567.89);              // "12,34,567.89"
new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(99.5);   // "$99.50"
new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(99);     // "¥99"
new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1 }).format(0.235);  // "23.5%"
new Intl.NumberFormat('en-US', { notation: 'compact' }).format(1500);   // "1.5K"
new Intl.NumberFormat('en-US', { notation: 'scientific' }).format(12345);  // "1.2345E4"
</code></pre>

<h3>Intl.DateTimeFormat</h3>
<pre><code class="language-js">const d = new Date('2026-04-29T14:30:00Z');

new Intl.DateTimeFormat('en-US').format(d);                       // "4/29/2026"
new Intl.DateTimeFormat('en-GB').format(d);                       // "29/04/2026"
new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
//   "Apr 29, 2026, 2:30 PM"
new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(d);
//   "Wednesday, April 29"

// Time zone control
new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tokyo', timeStyle: 'short' }).format(d);
//   "11:30 PM"
</code></pre>

<h3>Intl.RelativeTimeFormat</h3>
<pre><code class="language-js">const rtf = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });
rtf.format(-1, 'day');     // "yesterday"
rtf.format(0, 'day');      // "today"
rtf.format(1, 'day');      // "tomorrow"
rtf.format(-7, 'day');     // "7 days ago"
rtf.format(2, 'week');     // "in 2 weeks"
</code></pre>

<h3>Intl.PluralRules</h3>
<pre><code class="language-js">const pr = new Intl.PluralRules('en-US');
pr.select(1);    // 'one'
pr.select(2);    // 'other'
const messages = { one: '1 item', other: '{n} items' };
const n = 5;
messages[pr.select(n)].replace('{n}', n);   // "5 items"
</code></pre>

<h3>Intl.ListFormat</h3>
<pre><code class="language-js">new Intl.ListFormat('en-US', { type: 'conjunction' }).format(['Sara', 'Anna', 'Lia']);
//   "Sara, Anna, and Lia"
new Intl.ListFormat('en-US', { type: 'disjunction' }).format(['Mon', 'Tue', 'Wed']);
//   "Mon, Tue, or Wed"
</code></pre>

<h3>Intl.Segmenter</h3>
<pre><code class="language-js">// Word, sentence, or grapheme segmentation that's locale-aware
const seg = new Intl.Segmenter('ja-JP', { granularity: 'word' });
[...seg.segment('東京は美しい')].map(s =&gt; s.segment);   // ['東京', 'は', '美しい']
</code></pre>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: A reactive object in 20 lines</h3>
<pre><code class="language-js">const subscribers = new Map();   // proxy → Set&lt;callback&gt;

function reactive(target) {
  const subs = new Set();
  const proxy = new Proxy(target, {
    get(t, key, recv) {
      track(proxy, key);
      const v = Reflect.get(t, key, recv);
      return typeof v === 'object' &amp;&amp; v !== null ? reactive(v) : v;
    },
    set(t, key, val, recv) {
      const result = Reflect.set(t, key, val, recv);
      trigger(proxy, key);
      return result;
    },
  });
  subscribers.set(proxy, subs);
  return proxy;
}

let activeEffect = null;
function effect(fn) { activeEffect = fn; fn(); activeEffect = null; }
function track(proxy, key) {
  if (activeEffect) subscribers.get(proxy).add(activeEffect);
}
function trigger(proxy, key) {
  for (const fn of subscribers.get(proxy) ?? []) fn();
}

const state = reactive({ count: 0, doubled: 0 });
effect(() =&gt; { state.doubled = state.count * 2; console.log('doubled:', state.doubled); });
state.count = 5;   // logs: doubled: 10
</code></pre>
<p>This is the core of Vue 3's reactivity in &lt; 30 lines. Real Vue handles batching, deep tracking, deletion, array push, and Map/Set — but the kernel is exactly this.</p>

<h3>Example 2: Validation proxy</h3>
<pre><code class="language-js">function validated(schema, target = {}) {
  return new Proxy(target, {
    set(t, key, value) {
      const validator = schema[key];
      if (validator &amp;&amp; !validator(value)) {
        throw new TypeError(\`Invalid value for \${String(key)}\`);
      }
      return Reflect.set(t, key, value);
    }
  });
}

const user = validated({
  age: (v) =&gt; typeof v === 'number' &amp;&amp; v &gt;= 0,
  email: (v) =&gt; typeof v === 'string' &amp;&amp; /^.+@.+$/.test(v),
});

user.age = 30;             // ok
user.email = 'a@b.c';      // ok
user.age = -5;             // throws
</code></pre>

<h3>Example 3: Default values via Proxy</h3>
<pre><code class="language-js">const settings = new Proxy({}, {
  get(t, key) { return key in t ? t[key] : null; }
});

settings.foo;          // null
settings.foo = 'bar';
settings.foo;          // 'bar'
</code></pre>

<h3>Example 4: Read-only deep freeze (lazy)</h3>
<pre><code class="language-js">function readonly(target) {
  return new Proxy(target, {
    get(t, key, recv) {
      const v = Reflect.get(t, key, recv);
      return typeof v === 'object' &amp;&amp; v !== null ? readonly(v) : v;
    },
    set() { throw new TypeError('readonly'); },
    deleteProperty() { throw new TypeError('readonly'); },
  });
}

const cfg = readonly({ a: { b: 1 } });
cfg.a.b;        // 1
cfg.a.b = 2;    // throws
</code></pre>

<h3>Example 5: Range as iterable</h3>
<pre><code class="language-js">class Range {
  constructor(start, end, step = 1) {
    this.start = start; this.end = end; this.step = step;
  }
  *[Symbol.iterator]() {
    for (let i = this.start; i &lt; this.end; i += this.step) yield i;
  }
}

[...new Range(0, 5)];               // [0, 1, 2, 3, 4]
for (const x of new Range(0, 10, 2)) console.log(x);
</code></pre>

<h3>Example 6: Lazy infinite sequence</h3>
<pre><code class="language-js">function* naturals() { let n = 1; while (true) yield n++; }
function* take(it, n) { for (const x of it) { if (n-- &lt;= 0) return; yield x; } }
function* map(it, fn) { for (const x of it) yield fn(x); }
function* filter(it, fn) { for (const x of it) if (fn(x)) yield x; }

const evens = filter(naturals(), n =&gt; n % 2 === 0);
[...take(map(evens, n =&gt; n * n), 5)];   // [4, 16, 36, 64, 100]
</code></pre>

<h3>Example 7: Async iterator over an event stream</h3>
<pre><code class="language-js">async function* eventStream(target, eventName) {
  const queue = [];
  let resolve;
  const handler = (e) =&gt; {
    if (resolve) { resolve(e); resolve = null; }
    else queue.push(e);
  };
  target.addEventListener(eventName, handler);
  try {
    while (true) {
      yield queue.length ? queue.shift() : new Promise(r =&gt; { resolve = r; });
    }
  } finally {
    target.removeEventListener(eventName, handler);
  }
}

for await (const click of eventStream(button, 'click')) console.log(click.x);
</code></pre>

<h3>Example 8: WeakMap-backed memoization</h3>
<pre><code class="language-js">const cache = new WeakMap();

function expensive(node) {
  if (cache.has(node)) return cache.get(node);
  const result = compute(node);
  cache.set(node, result);
  return result;
}

// When 'node' is removed from the DOM and dereferenced, the cache entry
// vanishes automatically — no manual cleanup needed.
</code></pre>

<h3>Example 9: Locale-aware sort</h3>
<pre><code class="language-js">const names = ['Ávila', 'Anders', 'Bach', 'Çağdaş'];
const collator = new Intl.Collator('tr', { sensitivity: 'base' });
names.sort(collator.compare);   // Turkish-correct order
</code></pre>

<h3>Example 10: Smart relative time</h3>
<pre><code class="language-js">const rtf = new Intl.RelativeTimeFormat(navigator.language, { numeric: 'auto' });
function ago(date) {
  const diff = (date - Date.now()) / 1000;
  if (Math.abs(diff) &lt; 60)        return rtf.format(Math.round(diff), 'second');
  if (Math.abs(diff) &lt; 3600)      return rtf.format(Math.round(diff / 60), 'minute');
  if (Math.abs(diff) &lt; 86400)     return rtf.format(Math.round(diff / 3600), 'hour');
  return rtf.format(Math.round(diff / 86400), 'day');
}

ago(new Date(Date.now() - 30_000));    // "30 seconds ago"
ago(new Date(Date.now() - 3_600_000)); // "1 hour ago"
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Symbols and JSON</h3>
<p><code>JSON.stringify</code> ignores symbol-keyed properties. If you need to serialize them, use a custom <code>toJSON</code> or <code>replacer</code>.</p>

<h3>Symbol.for vs Symbol</h3>
<pre><code class="language-js">Symbol('a') === Symbol('a');                 // false — local
Symbol.for('a') === Symbol.for('a');         // true — registry
</code></pre>
<p><code>Symbol.for</code> uses a global registry, shared across realms (iframes, workers). Use cautiously — it bypasses the "uniqueness" guarantee.</p>

<h3>Proxy traps must obey invariants</h3>
<p>The spec mandates that traps preserve certain invariants. If your <code>has</code> trap returns <code>false</code> for a non-configurable property, the engine throws. Common ones:</p>
<ul>
  <li><code>get</code>: if the target has a non-writable, non-configurable own property, <code>get</code> must return that value.</li>
  <li><code>set</code>: must return <code>true</code> for success, <code>false</code> for refusal.</li>
  <li><code>deleteProperty</code>: must return <code>true</code> if delete succeeded; throws if non-configurable.</li>
  <li><code>ownKeys</code>: must include all non-configurable own keys.</li>
</ul>
<p>Violations throw <code>TypeError</code>. Hard to debug; use <code>Reflect</code> defaults whenever possible.</p>

<h3>Proxy preserves identity, not equality with target</h3>
<pre><code class="language-js">const target = { a: 1 };
const p = new Proxy(target, {});
p === target;          // false
target === target;     // true
p.a === target.a;      // true
</code></pre>
<p>Identity tests against the target fail. If you store both somewhere, you've doubled your data. Pick one and stick with it.</p>

<h3>Proxy + private fields</h3>
<pre><code class="language-js">class Foo {
  #priv = 1;
  get() { return this.#priv; }
}

const p = new Proxy(new Foo(), {});
p.get();   // throws TypeError — private field accessed via wrong receiver
</code></pre>
<p>Private fields use the receiver to look up the private slot; Proxy receivers don't have it. Workaround: use <code>Reflect.get(target, key, target)</code> (force the target as receiver).</p>

<h3>Proxy and <code>typeof</code></h3>
<p><code>typeof proxy</code> returns the same as the target's <code>typeof</code>. Wrapping a function returns <code>"function"</code>; wrapping an object returns <code>"object"</code>.</p>

<h3>Generator throw / return semantics</h3>
<pre><code class="language-js">function* gen() {
  try {
    yield 1;
  } catch (e) {
    yield 2;
  }
}

const g = gen();
g.next();                      // { value: 1, done: false }
g.throw(new Error('hi'));      // { value: 2, done: false } — caught by try
g.next();                      // { value: undefined, done: true }
</code></pre>

<h3>Generators are not reusable</h3>
<pre><code class="language-js">function* g() { yield 1; yield 2; }
const x = g();
[...x];   // [1, 2]
[...x];   // [] — exhausted
</code></pre>

<h3>WeakMap key types</h3>
<p>Only objects can be WeakMap keys. Numbers, strings, symbols (until ES2023) cannot. ES2023 added <code>Symbol</code> as a valid WeakMap key (only registered symbols can't be — to prevent global retention).</p>

<h3>WeakRef timing</h3>
<p>The spec says <code>deref()</code> may return the object even after it's "logically" GC'd, until "checkpoint." Engines guarantee in practice — but write defensive code.</p>

<h3>FinalizationRegistry never guarantees execution</h3>
<p>If the JS process exits, the callback never runs. Even mid-process, the engine may decide not to run it. Design assuming "this is just a hint."</p>

<h3>Intl behavior in Node</h3>
<p>Pre-Node 19, <code>--icu=full-icu</code> was needed for non-English locales. Node 19+ ships with full ICU by default. RN's Hermes supports Intl since 0.10; older Hermes needs polyfills (e.g., <code>@formatjs/intl-*</code>).</p>

<h3>Intl date timezone defaults</h3>
<p><code>Intl.DateTimeFormat</code> defaults to the system timezone. Pass <code>timeZone</code> explicitly to avoid surprises in server-side rendering.</p>

<h3>Intl.PluralRules with non-Western languages</h3>
<p>English has <code>one | other</code>. Polish has <code>one | few | many | other</code>. Arabic has <code>zero | one | two | few | many | other</code>. <code>Intl.PluralRules</code> handles all of these — but you must define messages for every category your locales need.</p>

<h3>RN Hermes Intl gotchas</h3>
<p>Hermes' Intl implementation is correct but doesn't include all locale data on Android (size constraints). Use <code>@formatjs/intl-locale</code> + appropriate polyfills if you need ICU-complete behavior on Android.</p>

<h3>Deep proxies allocate aggressively</h3>
<p>Lazy reactive proxies (Vue 3 style) create a new Proxy per nested object on first access. Memory usage scales with the number of distinct nested objects you access. For massive data structures, consider lazy <em>read-only</em> wrappers or skip the abstraction.</p>

<h3>Symbol.iterator on arrays is built-in</h3>
<p>Arrays already implement <code>Symbol.iterator</code>. <code>arr[Symbol.iterator]()</code> returns the array iterator. You don't need to add it.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: Forgetting to forward via Reflect</h3>
<pre><code class="language-js">// BAD — breaks getters that look up via prototype chain
const p = new Proxy(target, {
  get(t, key) { return t[key]; }
});

// GOOD
const p = new Proxy(target, {
  get(t, key, receiver) { return Reflect.get(t, key, receiver); }
});
</code></pre>

<h3>Bug 2: Returning false from a strict-mode setter</h3>
<pre><code class="language-js">// BAD — throws TypeError in strict mode
new Proxy({}, { set() { return false; } }).x = 1;

// Either return true (silent ignore) or throw explicitly
</code></pre>

<h3>Bug 3: Identity comparisons across proxy/target</h3>
<pre><code class="language-js">const target = {};
const p = new Proxy(target, {});
const seen = new Set([target]);
seen.has(p);   // false — Proxy is not the target
</code></pre>

<h3>Bug 4: Assuming Symbol coercion</h3>
<pre><code class="language-js">const s = Symbol('x');
\`\${s}\`;        // throws TypeError
String(s);    // OK — explicit
</code></pre>

<h3>Bug 5: Generator inside async function trap</h3>
<pre><code class="language-js">// BAD — async generator, but you wrote sync
function* fetcher() {
  const r = await fetch('/x');   // syntax error, no await in sync gen
  yield r;
}

// FIX
async function* fetcher() {
  const r = await fetch('/x');
  yield r;
}
</code></pre>

<h3>Bug 6: WeakMap with primitive key</h3>
<pre><code class="language-js">const wm = new WeakMap();
wm.set('a', 1);   // throws TypeError pre-ES2023; works only with object keys
</code></pre>

<h3>Bug 7: Hand-rolling currency formatting</h3>
<pre><code class="language-js">// BAD — wrong for half the world
function formatUSD(n) { return '$' + n.toFixed(2); }
formatUSD(1234.5);   // "$1234.50"  — missing thousands separator

// GOOD
new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(1234.5);
//   "$1,234.50"
</code></pre>

<h3>Bug 8: Date math with timezone confusion</h3>
<pre><code class="language-js">// BAD — uses local timezone implicitly
const formatted = new Date(serverTimestamp).toLocaleString();

// GOOD — explicit
new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', dateStyle: 'short', timeStyle: 'short' }).format(new Date(serverTimestamp));
</code></pre>

<h3>Bug 9: Pluralization via if/else</h3>
<pre><code class="language-js">// BAD — wrong for Polish, Arabic, Russian
const n = items.length;
const msg = n === 1 ? '1 item' : \`\${n} items\`;

// GOOD
const pr = new Intl.PluralRules(locale);
const messages = { one: '1 item', other: '{n} items', few: '{n} items', many: '{n} items' };
const msg = messages[pr.select(n)].replace('{n}', n);
</code></pre>

<h3>Bug 10: FinalizationRegistry as a destructor</h3>
<p>Code that depends on FinalizationRegistry firing for correctness is broken. The spec allows callbacks to never run. Use only for opportunistic cleanup of resources where leaking is acceptable.</p>

<h3>Anti-pattern 1: Proxy for trivial getters/setters</h3>
<pre><code class="language-js">// Overkill — use a plain getter
const p = new Proxy({}, { get(t, k) { return k.toUpperCase(); } });
// vs
const obj = { get foo() { return 'FOO'; } };
</code></pre>

<h3>Anti-pattern 2: Storing both proxy and target</h3>
<p>You expose a reactive proxy to consumers and also keep the target for internal use. Now you have two references; mutations on the target don't trigger reactivity. Pick one and route everything through it.</p>

<h3>Anti-pattern 3: Symbol-keyed "private" fields</h3>
<p>Symbols are <em>discoverable</em> via <code>Object.getOwnPropertySymbols</code>. They prevent accidental collision but not deliberate access. For real privacy use class private fields (<code>#name</code>) or WeakMap.</p>

<h3>Anti-pattern 4: Generator as state machine when you have actions/transitions</h3>
<p>Generators are great for sequential consumption (lazy iterables, async iteration). For complex state machines with branches and async events, reach for XState or a discriminated-union reducer — generators get tangled fast.</p>

<h3>Anti-pattern 5: WeakRef for caching</h3>
<p>WeakRef-backed caches behave unpredictably: an entry may vanish at any moment. Use a real LRU (Map-based with size limit) instead. WeakRef is for "I want to know if this exists, without keeping it alive."</p>

<h3>Anti-pattern 6: Re-implementing Intl</h3>
<p>"We just need to format numbers; let's write our own." Now you've reinvented locale-aware formatting. Use Intl. The output is correct in every market your app reaches.</p>

<h3>Anti-pattern 7: Polyfilling Intl in modern environments</h3>
<p>If you support Node 19+, modern browsers, and Hermes 0.10+, you don't need polyfills. Auditing dependencies will often find a 50KB polyfill that wasn't needed.</p>

<h3>Anti-pattern 8: Deep reactive everything</h3>
<p>Wrapping every object in a Vue-style proxy adds tracking overhead on every property read. For perf-critical hot paths, opt out (Vue's <code>shallowReactive</code>, <code>markRaw</code>; valtio's <code>ref</code>).</p>

<h3>Anti-pattern 9: Symbol.toPrimitive abuse</h3>
<pre><code class="language-js">// Confuses every reader
class Money {
  [Symbol.toPrimitive](hint) { return hint === 'string' ? 'expensive' : 9999; }
}
\`\${new Money()} dollars\`;   // "expensive dollars"
new Money() + 1;             // 10000

// Don't lie about what your object is. Provide explicit methods (.toString, .valueOf).
</code></pre>

<h3>Anti-pattern 10: trapping every operation</h3>
<p>Defining all 13 Proxy traps is a sign of over-engineering. Most libraries only need <code>get</code> and <code>set</code>. Any extras should be justified by a real use case.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '🎤 Interview Patterns',
      html: `
<h3>The 12 questions worth rehearsing</h3>
<table>
  <thead><tr><th>Question</th><th>One-liner</th></tr></thead>
  <tbody>
    <tr><td><em>What's a Symbol?</em></td><td>A primitive that's unique by construction; non-enumerable as a key by default.</td></tr>
    <tr><td><em>What's the iterator protocol?</em></td><td>An object with <code>[Symbol.iterator]() → { next() }</code> returning <code>{ value, done }</code>.</td></tr>
    <tr><td><em>How does <code>for...of</code> work on a custom class?</em></td><td>Implement <code>[Symbol.iterator]</code> (or use a generator method).</td></tr>
    <tr><td><em>What's a generator?</em></td><td>A function that returns an iterator and can pause via <code>yield</code>.</td></tr>
    <tr><td><em>What's a Proxy?</em></td><td>A wrapper that intercepts internal object operations via traps.</td></tr>
    <tr><td><em>Why pair Proxy with Reflect?</em></td><td>Reflect mirrors the trap names with correct receiver semantics; preserves prototype-chain access.</td></tr>
    <tr><td><em>What's the difference between Map and WeakMap?</em></td><td>WeakMap holds keys weakly; entries vanish when keys are GC'd; no iteration, no size.</td></tr>
    <tr><td><em>How do you build a private field via WeakMap?</em></td><td>External WeakMap keyed by instance; lookups go through it. (Modern alternative: class <code>#priv</code>.)</td></tr>
    <tr><td><em>What's <code>Symbol.toPrimitive</code>?</em></td><td>Hook to control coercion to primitive (number / string / default hints).</td></tr>
    <tr><td><em>What does <code>Intl.NumberFormat</code> handle?</em></td><td>Locale-aware number formatting: separators, currency, percent, compact notation.</td></tr>
    <tr><td><em>How do you format relative time?</em></td><td><code>Intl.RelativeTimeFormat</code> with appropriate unit.</td></tr>
    <tr><td><em>When NOT to use Proxy?</em></td><td>For trivial getters/setters; in hot loops where the trap overhead matters.</td></tr>
  </tbody>
</table>

<h3>Live coding warmups</h3>
<ol>
  <li><em>"Build a <code>Range</code> class iterable in <code>for...of</code>."</em>
    <pre><code class="language-js">class Range {
  constructor(s, e) { this.s = s; this.e = e; }
  *[Symbol.iterator]() { for (let i = this.s; i &lt; this.e; i++) yield i; }
}</code></pre>
  </li>
  <li><em>"Implement a logging Proxy that prints every read and write."</em>
    <pre><code class="language-js">function logged(obj) {
  return new Proxy(obj, {
    get(t, k, r) { console.log('get', k); return Reflect.get(t, k, r); },
    set(t, k, v, r) { console.log('set', k, v); return Reflect.set(t, k, v, r); },
  });
}</code></pre>
  </li>
  <li><em>"Build a tiny reactive system."</em> — see Worked Example 1.</li>
  <li><em>"Write a <code>memoize</code> using WeakMap so cleanup happens automatically."</em>
    <pre><code class="language-js">function memoize(fn) {
  const cache = new WeakMap();
  return (arg) =&gt; {
    if (cache.has(arg)) return cache.get(arg);
    const v = fn(arg);
    cache.set(arg, v);
    return v;
  };
}</code></pre>
  </li>
  <li><em>"Format 1234567.89 as USD currency in en-US locale."</em>
    <pre><code class="language-js">new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(1234567.89);</code></pre>
  </li>
</ol>

<h3>"Spot the issue" classics</h3>
<ul>
  <li>Proxy <code>get</code> trap that doesn't forward via Reflect → breaks <code>this</code> in nested getters.</li>
  <li>Generator inside async function but missing <code>async</code> keyword → syntax error.</li>
  <li>Map cache holding DOM nodes → memory leak; switch to WeakMap.</li>
  <li>Hand-rolled currency formatter with no Intl → wrong in 80% of locales.</li>
  <li>Symbol used in JSON.stringify expecting it to serialize → silently dropped.</li>
  <li>FinalizationRegistry expected to fire deterministically → spec says it may never run.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Internal-method awareness</td><td>You connect <code>obj.foo</code> to [[Get]] and to the <code>get</code> Proxy trap.</td></tr>
    <tr><td>Reflect discipline</td><td>You always pair Proxy traps with <code>Reflect.*</code> for correct receiver handling.</td></tr>
    <tr><td>Iterator fluency</td><td>You can hand-implement <code>[Symbol.iterator]</code> or use a generator method.</td></tr>
    <tr><td>Memory thinking</td><td>You distinguish Map vs WeakMap; you understand WeakRef caveats.</td></tr>
    <tr><td>Intl preference</td><td>You reach for Intl before reaching for moment.js / date-fns / hand-rolled formatters.</td></tr>
    <tr><td>Restraint</td><td>You don't propose Proxy for trivial cases; you justify the cost.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li><strong>Hermes:</strong> ES6+ baseline; supports Proxy, Symbol, generators, async iterators. Intl support in Hermes 0.10+; older Hermes needs <code>@formatjs/*</code> polyfills.</li>
  <li><strong>RN navigation:</strong> internally uses Symbols for actions/markers; opaque to consumers.</li>
  <li><strong>Reanimated worklets:</strong> only a subset of JS runs on the UI thread — Proxies and complex iterators don't cross the boundary.</li>
  <li><strong>WeakMap usage in RN:</strong> caches keyed by component instance; vanishes when the component unmounts (if no other refs exist).</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"How does Vue 3's reactivity actually work?"</em> — Wraps target in a Proxy; <code>get</code> trap tracks "what effect is currently running" and registers it as a dependency on this property; <code>set</code> trap notifies all dependents to re-run. Lazy: nested objects only become proxies when accessed.</li>
  <li><em>"Why can't a Proxy fully impersonate its target?"</em> — Identity (<code>===</code>) is preserved per-Proxy; private fields use the actual receiver, breaking through the Proxy. Spec invariants prevent some lies (non-configurable properties).</li>
  <li><em>"Why no <code>.size</code> on WeakMap?"</em> — Because the count is non-deterministic — entries can be GC'd at any time. Exposing it would make GC behavior observable, breaking referential transparency.</li>
  <li><em>"What's the difference between <code>Symbol.iterator</code> and <code>Symbol.asyncIterator</code>?"</em> — Sync version's <code>next()</code> returns <code>{value, done}</code>; async version returns <code>Promise&lt;{value, done}&gt;</code>. <code>for...of</code> uses sync; <code>for await...of</code> uses async.</li>
  <li><em>"When would you use <code>Symbol.species</code>?"</em> — When subclassing built-ins like Array or Promise, to control which constructor <code>.map</code>/<code>.filter</code>/<code>.then</code> use for the result. Rare; mostly for libraries.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd build a typed wrapper over Intl with a small DSL so calling code can say <code>format.currency(1234, 'USD')</code> without remembering options."</li>
  <li>"I'd benchmark Proxy overhead in our hot rendering paths and consider <code>shallowReactive</code> escape hatches."</li>
  <li>"I'd convert legacy private-via-WeakMap patterns to class private fields where readable and migrate gradually."</li>
  <li>"I'd add a small generator-based test harness for streaming protocols (server-sent events, chat) — async iteration reads cleaner than callback-heavy code."</li>
</ul>
`
    }
  ]
});
