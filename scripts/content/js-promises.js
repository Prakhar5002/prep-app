window.PREP_SITE.registerTopic({
  id: 'js-promises',
  module: 'JavaScript Deep',
  title: 'Promises & async/await',
  estimatedReadTime: '32 min',
  tags: ['promise', 'async', 'await', 'microtask', 'then', 'chaining', 'error-handling', 'concurrency', 'fundamentals'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>A <strong>Promise</strong> is a first-class object that represents the eventual result of an asynchronous operation. It lives in exactly one of three internal states — <code>pending</code>, <code>fulfilled</code>, or <code>rejected</code> — and transitions from <code>pending</code> to one of the other two at most once. That transition is called <em>settling</em>, and after it happens, the promise is immutable.</p>
<ul>
  <li><code>new Promise(executor)</code> runs <code>executor</code> synchronously and gives you <code>resolve</code> / <code>reject</code> to settle it.</li>
  <li><code>.then(onFulfilled, onRejected)</code> returns a <strong>new</strong> promise — that's what makes chaining work.</li>
  <li>Callbacks attached via <code>.then</code> / <code>.catch</code> / <code>.finally</code> run on the <strong>microtask queue</strong>, not the macrotask queue — after the current stack, before the next <code>setTimeout</code> / <code>setImmediate</code> / paint.</li>
  <li><code>async function</code> always returns a promise; <code>await</code> pauses the function and schedules its resumption as a microtask when the awaited value settles.</li>
  <li>An unhandled rejection produces a runtime warning (Node: crashes in newer versions; browsers: <code>unhandledrejection</code> event).</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>A Promise is a placeholder for a value you'll have later. <code>.then</code> returns a new placeholder. <code>async/await</code> is just a nicer way to write <code>.then</code> chains, with <code>await</code> meaning "pause this function until this promise settles, then resume as a microtask."</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What is a Promise, precisely?</h3>
<p>A <strong>Promise</strong> is an object defined by the ECMAScript spec with an internal slot <code>[[PromiseState]]</code> that starts as <code>pending</code>. The object also holds:</p>
<ul>
  <li><code>[[PromiseResult]]</code> — once settled, the fulfillment value or rejection reason.</li>
  <li><code>[[PromiseFulfillReactions]]</code> — queue of callbacks to run when it fulfills.</li>
  <li><code>[[PromiseRejectReactions]]</code> — queue of callbacks to run when it rejects.</li>
  <li><code>[[PromiseIsHandled]]</code> — flag tracking whether any <code>.then</code>/<code>.catch</code> has ever been attached (used to detect unhandled rejections).</li>
</ul>
<p>The transition rules are strict: <strong>pending → fulfilled</strong> or <strong>pending → rejected</strong>, never the other direction and never twice. After settling, calls to <code>resolve</code> / <code>reject</code> are ignored.</p>

<h3>Why do we need promises?</h3>
<p>Before promises, async was modeled with <em>callbacks</em> passed as function arguments. This suffers from three problems:</p>
<ol>
  <li><strong>Callback hell</strong> — every dependent async step adds an indent level and a custom error-handling path.</li>
  <li><strong>Inversion of control</strong> — you hand a callback to a library, which may call it zero times, once, or a hundred times, in any state. You lost control of your own code's lifecycle.</li>
  <li><strong>Non-composable errors</strong> — every callback step has to remember to check and propagate its own errors.</li>
</ol>
<p>Promises fix all three. They're first-class values (composable like any other object), they settle exactly once, and <code>.then</code> automatically propagates both success values and errors down the chain.</p>

<h3>Why a microtask queue?</h3>
<p>Synchronous code continues to run on the call stack. When the stack is empty, the engine decides what to run next. Two queues feed it:</p>
<ul>
  <li><strong>Microtask queue</strong> — promise reactions, <code>queueMicrotask(fn)</code>, <code>MutationObserver</code> callbacks. Drained <em>completely</em> before yielding to anything else.</li>
  <li><strong>Macrotask (task) queue</strong> — <code>setTimeout</code>, <code>setInterval</code>, I/O, UI events, <code>setImmediate</code> (Node). The engine picks ONE task per cycle, then drains microtasks again.</li>
</ul>
<p>This design means <code>.then</code> callbacks fire <em>before</em> the next <code>setTimeout</code>, which is often what you want: "finish reacting to this promise before doing anything else." But it's also why an infinite chain of microtasks can starve rendering — see Edge Cases.</p>

<h3>What is async/await?</h3>
<p>Syntactic sugar over promises. The spec defines <code>async function</code> to <em>always</em> return a promise. <code>await expr</code> does:</p>
<ol>
  <li>Resolve <code>expr</code> to a promise (if it's not already one, wrap it via <code>Promise.resolve(expr)</code>).</li>
  <li>Suspend the function, register a continuation as a <code>.then</code> reaction.</li>
  <li>Yield control back to the event loop.</li>
  <li>When the promise settles, schedule a microtask that resumes the function with the fulfilled value (or throws the rejection reason).</li>
</ol>
<p>No magic — under the hood it's exactly <code>.then(v =&gt; /* continue */).catch(err =&gt; /* throw inside function */)</code>. The benefit is readability: sequential code reads sequentially.</p>

<h3>Why Promises are not cancellable (yet)</h3>
<p>A Promise, once created, cannot be cancelled — only ignored. The language left cancellation to the caller (via <code>AbortController</code> for fetch, or a <code>rejected</code> race). TC39 has a stage-1 proposal for first-class cancellation, but as of today, you design around <code>AbortSignal</code>.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "slot machine" picture</h3>
<p>A promise is a machine with exactly three LEDs: <span style="color:#999">pending</span>, <span style="color:#40c057">fulfilled</span>, <span style="color:#fa5252">rejected</span>. Exactly one LED is lit at any time. It starts on <em>pending</em>. At some moment it transitions to fulfilled or rejected, and it never changes again.</p>

<h3>The "chain of placeholders" picture</h3>
<div class="diagram">
<pre>
fetch(url)                    ──► Promise&lt;Response&gt;
  .then(r =&gt; r.json())        ──► Promise&lt;Data&gt;
  .then(data =&gt; process(data))──► Promise&lt;Processed&gt;
  .catch(err =&gt; handle(err))  ──► Promise&lt;FinalValue&gt;

Each .then/.catch returns a NEW promise whose settlement depends on
(a) whether the callback ran without throwing, and
(b) whether the callback returned a value, a thenable, or threw.
</pre>
</div>

<h3>The "event loop vs microtasks" picture</h3>
<div class="diagram">
<pre>
┌────────────────┐   pop one task   ┌───────────────────┐
│ Macrotask Queue│ ───────────────► │  Call Stack runs  │
│ (setTimeout,   │                  │  until empty      │
│  I/O, events)  │                  └─────────┬─────────┘
└────────────────┘                            │
                                              ▼
                                      drain ALL microtasks
                                   (.then reactions, queueMicrotask,
                                    MutationObserver)
                                              │
                                              ▼
                                        render (maybe)
                                              │
                                              ▼
                                      back to macrotask pop
</pre>
</div>

<p>Consequence: a <code>.then</code> handler always runs before the next <code>setTimeout</code> callback, even if that <code>setTimeout</code> was queued first.</p>

<h3>The "await = pause, then resume as microtask" picture</h3>
<pre><code class="language-js">async function f() {
  console.log('A');
  const x = await something();
  console.log('B'); // ← this line runs as a MICROTASK when something() settles
  return x;
}</code></pre>
<p>Think of <code>await</code> as: save the rest of the function, hook it as a <code>.then</code> reaction on the awaited promise, and return a promise for the eventual completion of <code>f</code> to the caller.</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"<code>async</code> makes the function run on a background thread." No. JavaScript is single-threaded. <code>async</code> is entirely about scheduling — splitting the function body into chunks separated by microtask boundaries. All the chunks run on the same main thread.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Three ways to create a promise</h3>
<pre><code class="language-js">// 1. Constructor — when wrapping a callback/event-based API
const p = new Promise((resolve, reject) =&gt; {
  fs.readFile(path, (err, data) =&gt; err ? reject(err) : resolve(data));
});

// 2. Static — already-settled
Promise.resolve(42);       // fulfilled with 42
Promise.reject(new Error('x')); // rejected with the error

// 3. async function
async function f() { return 42; } // returns Promise&lt;42&gt;</code></pre>

<h3>Promise static methods — all combinators</h3>
<table>
  <thead><tr><th>Method</th><th>Settles when…</th><th>Result</th><th>Short-circuits on reject?</th></tr></thead>
  <tbody>
    <tr><td><code>Promise.all([p1, p2])</code></td><td>all fulfilled, OR any rejected</td><td>array of values, or first rejection</td><td>Yes</td></tr>
    <tr><td><code>Promise.allSettled([p1, p2])</code></td><td>all settled (any way)</td><td>array of <code>{status, value?, reason?}</code></td><td>No</td></tr>
    <tr><td><code>Promise.race([p1, p2])</code></td><td>first settled (any way)</td><td>the first value or reason</td><td>N/A — first wins</td></tr>
    <tr><td><code>Promise.any([p1, p2])</code></td><td>first fulfilled, OR all rejected</td><td>first fulfilled value, or <code>AggregateError</code></td><td>No (waits for one success)</td></tr>
  </tbody>
</table>

<h3>The <code>.then</code> resolution algorithm (simplified)</h3>
<p>Every <code>.then(onF, onR)</code> returns a NEW promise <code>p2</code>. When the original promise settles, the engine:</p>
<ol>
  <li>Picks <code>onF</code> or <code>onR</code> based on fulfilled vs rejected.</li>
  <li>Schedules a microtask to call it with the value/reason.</li>
  <li>Inside that microtask, captures the callback's return value <code>v</code>:
    <ul>
      <li>If the callback threw, <code>p2</code> rejects with the thrown error.</li>
      <li>If <code>v</code> is a promise or thenable, <code>p2</code> "adopts" it — settles when <code>v</code> settles.</li>
      <li>Otherwise <code>p2</code> fulfills with <code>v</code>.</li>
    </ul>
  </li>
</ol>
<p>This adoption rule is why returning a promise from inside a <code>.then</code> chains correctly without manual nesting.</p>

<h3><code>.catch</code> is <code>.then(undefined, onR)</code></h3>
<pre><code class="language-js">p.catch(f) // identical to p.then(undefined, f)</code></pre>
<p>It returns a new promise. If <code>f</code> runs without throwing and returns a value, the chain <em>recovers</em> — subsequent <code>.then</code> handlers see the recovered value as fulfillment.</p>

<h3><code>.finally</code> does NOT see the value</h3>
<pre><code class="language-js">p.finally(f)
// f runs on settle, with NO arguments.
// If f returns normally, the next promise adopts p's original settlement.
// If f throws or returns a rejected promise, the chain rejects with THAT.</code></pre>

<h3>async/await desugaring</h3>
<pre><code class="language-js">async function f() {
  const a = await getA();
  const b = await getB(a);
  return a + b;
}
// roughly equivalent to:
function f() {
  return Promise.resolve().then(() =&gt; getA()).then(a =&gt;
    getB(a).then(b =&gt; a + b)
  );
}</code></pre>
<p>Every <code>await</code> splits the function at that point. The "continuation" (everything below) becomes a <code>.then</code> handler on the awaited promise.</p>

<h3>Error handling with async/await</h3>
<pre><code class="language-js">async function f() {
  try {
    const x = await mayReject();
    return x * 2;
  } catch (e) {
    console.error(e);
    throw e; // re-throw to propagate, or return a fallback
  }
}</code></pre>
<p>Rejections become thrown errors in <code>try/catch</code>. If you don't catch, the <code>async</code> function's returned promise rejects.</p>

<h3>Unhandled rejection semantics</h3>
<ul>
  <li><strong>Browser:</strong> <code>window.addEventListener('unhandledrejection', e =&gt; ...)</code> fires at the end of the microtask drain if no handler attached. Preventable via <code>e.preventDefault()</code>.</li>
  <li><strong>Node (v15+):</strong> an unhandled rejection terminates the process by default (<code>--unhandled-rejections=strict</code>). Listen on <code>process.on('unhandledRejection', h)</code> to override.</li>
</ul>

<h3>Microtask vs macrotask ordering (must-know)</h3>
<pre><code class="language-js">console.log('A');
setTimeout(() =&gt; console.log('B'), 0);
Promise.resolve().then(() =&gt; console.log('C'));
console.log('D');
// Output: A, D, C, B
// - 'A' and 'D' are synchronous.
// - After sync code, drain microtasks → 'C'.
// - Then macrotask pops → 'B'.</code></pre>

<h3>queueMicrotask vs Promise.resolve().then</h3>
<p>Both schedule a microtask. <code>queueMicrotask</code> is lighter (no promise allocation) and exists exactly for "schedule this as a microtask without inventing a throwaway promise." Semantically identical scheduling.</p>

<h3>AbortController for cancellation</h3>
<pre><code class="language-js">const ctrl = new AbortController();
fetch(url, { signal: ctrl.signal }).catch(e =&gt; {
  if (e.name === 'AbortError') console.log('cancelled');
});
setTimeout(() =&gt; ctrl.abort(), 1000);</code></pre>
<p>The promise itself isn't cancelled — the underlying operation is aborted, and that aborted state rejects the promise with an <code>AbortError</code>.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — basic creation and consumption</h3>
<pre><code class="language-js">const p = new Promise((resolve, reject) =&gt; {
  setTimeout(() =&gt; resolve(42), 100);
});
p.then(v =&gt; console.log(v));  // 42 after 100ms</code></pre>

<h3>Example 2 — chain propagation</h3>
<pre><code class="language-js">Promise.resolve(1)
  .then(v =&gt; v + 1)          // 2
  .then(v =&gt; v * 10)         // 20
  .then(v =&gt; Promise.resolve(v + 5)) // 25 (adopted)
  .then(console.log);        // 25</code></pre>

<h3>Example 3 — error propagation</h3>
<pre><code class="language-js">Promise.resolve(1)
  .then(v =&gt; { throw new Error('boom'); })
  .then(v =&gt; 'skipped')     // never runs
  .catch(e =&gt; 'recovered')  // 'recovered'
  .then(console.log);       // 'recovered'</code></pre>
<p>A thrown error is equivalent to returning a rejected promise. The chain skips every <code>.then</code> until a <code>.catch</code> (or the <code>onR</code> of a <code>.then(onF, onR)</code>).</p>

<h3>Example 4 — microtask ordering</h3>
<pre><code class="language-js">console.log(1);
setTimeout(() =&gt; console.log(2), 0);
Promise.resolve().then(() =&gt; console.log(3));
Promise.resolve().then(() =&gt; console.log(4));
console.log(5);
// 1, 5, 3, 4, 2</code></pre>

<h3>Example 5 — async function returns a promise</h3>
<pre><code class="language-js">async function f() { return 1; }
f().then(v =&gt; console.log(v)); // 1
// f() is NOT 1 — it's a Promise&lt;1&gt;</code></pre>

<h3>Example 6 — await inside async</h3>
<pre><code class="language-js">async function main() {
  console.log('start');
  const v = await Promise.resolve(42);
  console.log('got', v);
}
main();
console.log('after main');
// start, after main, got 42
//                   ^ the await's continuation runs as a microtask
//                     after the current stack finishes.</code></pre>

<h3>Example 7 — Promise.all</h3>
<pre><code class="language-js">const [a, b, c] = await Promise.all([fetch(u1), fetch(u2), fetch(u3)]);
// All three requests start immediately, in parallel.
// await blocks until ALL fulfill, or throws on FIRST rejection.</code></pre>

<h3>Example 8 — Promise.allSettled</h3>
<pre><code class="language-js">const results = await Promise.allSettled([p1, p2, p3]);
results.forEach(r =&gt; {
  if (r.status === 'fulfilled') console.log('ok', r.value);
  else console.log('err', r.reason);
});
// Waits for all. Never rejects. Use when partial failure is OK.</code></pre>

<h3>Example 9 — Promise.race</h3>
<pre><code class="language-js">function timeout(ms) {
  return new Promise((_, reject) =&gt;
    setTimeout(() =&gt; reject(new Error('timeout')), ms));
}
const data = await Promise.race([fetch(url), timeout(5000)]);
// Wins whichever settles first — fetch result OR a 5s timeout rejection.</code></pre>

<h3>Example 10 — Promise.any</h3>
<pre><code class="language-js">const fastest = await Promise.any([
  fetch('https://mirror1'),
  fetch('https://mirror2'),
  fetch('https://mirror3'),
]);
// Returns the first fulfillment. Rejects with AggregateError only if ALL fail.</code></pre>

<h3>Example 11 — sequential vs parallel</h3>
<pre><code class="language-js">// SEQUENTIAL (slow — total time = sum)
const a = await fetchA();
const b = await fetchB();
const c = await fetchC();

// PARALLEL (fast — total time = max)
const [a, b, c] = await Promise.all([fetchA(), fetchB(), fetchC()]);</code></pre>
<p>Classic interview gotcha: people write sequential <code>await</code>s and hit N× latency. Spot independent calls and <code>Promise.all</code> them.</p>

<h3>Example 12 — wrapping callback APIs (promisify)</h3>
<pre><code class="language-js">function promisify(fn) {
  return (...args) =&gt; new Promise((resolve, reject) =&gt; {
    fn(...args, (err, result) =&gt; err ? reject(err) : resolve(result));
  });
}
const readFile = promisify(fs.readFile);
const buf = await readFile('a.txt');</code></pre>

<h3>Example 13 — retry with exponential backoff</h3>
<pre><code class="language-js">async function retry(fn, { tries = 3, base = 100 } = {}) {
  for (let i = 0; i &lt; tries; i++) {
    try { return await fn(); }
    catch (e) {
      if (i === tries - 1) throw e;
      await new Promise(r =&gt; setTimeout(r, base * 2 ** i));
    }
  }
}</code></pre>

<h3>Example 14 — concurrency limit</h3>
<pre><code class="language-js">async function mapLimit(items, limit, fn) {
  const out = [];
  const inFlight = new Set();
  for (const item of items) {
    const p = fn(item).then(v =&gt; { inFlight.delete(p); return v; });
    inFlight.add(p);
    out.push(p);
    if (inFlight.size &gt;= limit) await Promise.race(inFlight);
  }
  return Promise.all(out);
}</code></pre>

<h3>Example 15 — cancellable fetch</h3>
<pre><code class="language-js">function fetchWithTimeout(url, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() =&gt; ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal })
    .finally(() =&gt; clearTimeout(timer));
}</code></pre>

<h3>Example 16 — implementing Promise.all</h3>
<pre><code class="language-js">function myAll(promises) {
  return new Promise((resolve, reject) =&gt; {
    const out = new Array(promises.length);
    let done = 0;
    if (promises.length === 0) return resolve([]);
    promises.forEach((p, i) =&gt; {
      Promise.resolve(p).then(v =&gt; {
        out[i] = v;
        if (++done === promises.length) resolve(out);
      }, reject);
    });
  });
}</code></pre>

<h3>Example 17 — implementing Promise.race</h3>
<pre><code class="language-js">function myRace(promises) {
  return new Promise((resolve, reject) =&gt; {
    for (const p of promises) Promise.resolve(p).then(resolve, reject);
  });
}</code></pre>

<h3>Example 18 — microtask starvation demo</h3>
<pre><code class="language-js">function runAway() {
  Promise.resolve().then(runAway);
}
runAway();
// The microtask queue never drains → event loop stalls → page freezes.
// setTimeout would NOT cause this because each tick runs one macrotask.</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Settling more than once is silently ignored</h3>
<pre><code class="language-js">const p = new Promise((resolve, reject) =&gt; {
  resolve(1);
  resolve(2); // ignored
  reject(new Error('x')); // ignored
});
p.then(console.log); // 1</code></pre>
<p>Only the first settlement wins. Good for safety; surprising when debugging a "double-fire" bug.</p>

<h3>2. Executor throws = promise rejects</h3>
<pre><code class="language-js">const p = new Promise(() =&gt; { throw new Error('boom'); });
p.catch(e =&gt; console.log(e.message)); // 'boom'</code></pre>
<p>A throw inside the executor is equivalent to calling <code>reject(err)</code> — but only if it happens <em>synchronously</em>. Async throws inside the executor are NOT caught.</p>

<h3>3. Async throws inside the executor are lost</h3>
<pre><code class="language-js">new Promise((resolve) =&gt; {
  setTimeout(() =&gt; { throw new Error('lost'); }, 0);
  resolve(1);
});
// Unhandled exception — promise already resolved with 1.</code></pre>

<h3>4. <code>.then</code> callbacks always run asynchronously</h3>
<pre><code class="language-js">let order = [];
order.push('A');
Promise.resolve().then(() =&gt; order.push('C'));
order.push('B');
// after microtask drain: ['A', 'B', 'C']</code></pre>
<p>Even if the promise is already settled, callbacks are enqueued as microtasks — never called synchronously. This is a spec invariant.</p>

<h3>5. <code>await</code> on a non-promise</h3>
<pre><code class="language-js">const x = await 42;  // equivalent to: const x = await Promise.resolve(42);
// Yes, it introduces a microtask boundary even though 42 is synchronous.</code></pre>
<p>So <code>await</code> always yields control at least once, regardless of the operand. Use for deterministic scheduling. (Note: V8 optimizes <code>await &lt;non-thenable&gt;</code> in some cases, but spec still requires the microtask boundary.)</p>

<h3>6. Returning from .then — value vs promise vs thenable</h3>
<pre><code class="language-js">Promise.resolve(1)
  .then(v =&gt; v + 1)        // p2 fulfills with 2
  .then(v =&gt; Promise.resolve(v)) // p3 adopts that promise, fulfills with 2
  .then(v =&gt; { return { then(r){ r(v+100); } }; }) // thenable adopted, fulfills with 102
  .then(console.log);      // 102</code></pre>

<h3>7. Async function return value is always wrapped</h3>
<pre><code class="language-js">async function f() { return Promise.resolve(1); }
f().then(v =&gt; console.log(v, typeof f().then)); // 1 'function'
// Note: f() returns Promise&lt;1&gt;, not Promise&lt;Promise&lt;1&gt;&gt; — adoption flattens.</code></pre>

<h3>8. try/catch vs .catch — subtle semantic difference</h3>
<pre><code class="language-js">async function bad() {
  try {
    return mayReject(); // NO await!
  } catch (e) {
    return 'handled';   // never runs — rejection escapes try/catch
  }
}</code></pre>
<p>Without <code>await</code>, the rejection propagates to the returned promise, NOT to the surrounding <code>try/catch</code>. Always <code>await</code> things you want to catch.</p>

<h3>9. <code>.finally</code> overrides with its own rejection</h3>
<pre><code class="language-js">Promise.resolve(1)
  .finally(() =&gt; Promise.reject('oops'))
  .then(console.log, err =&gt; console.log('caught', err));
// caught oops — finally's rejection shadowed the original fulfillment.</code></pre>

<h3>10. Unhandled rejection timing</h3>
<pre><code class="language-js">const p = Promise.reject('x');
// At the end of the current microtask drain, if no .catch attached → unhandledrejection.
setTimeout(() =&gt; p.catch(() =&gt; {}), 0);
// Too late — unhandledrejection already fired. 'rejectionhandled' event may then fire.</code></pre>
<p>Attach handlers synchronously (or in the same tick) after creating a promise that can reject.</p>

<h3>11. Promise constructor runs synchronously</h3>
<pre><code class="language-js">console.log(1);
new Promise((resolve) =&gt; {
  console.log(2);
  resolve();
});
console.log(3);
// 1, 2, 3 — executor is synchronous.</code></pre>

<h3>12. <code>Promise.resolve(thenable)</code> adopts</h3>
<pre><code class="language-js">const t = { then(resolve) { resolve(42); } };
Promise.resolve(t).then(console.log); // 42</code></pre>

<h3>13. <code>Promise.resolve(nativePromise)</code> returns the same promise</h3>
<pre><code class="language-js">const p = Promise.resolve(1);
Promise.resolve(p) === p; // true — optimization for native Promise</code></pre>

<h3>14. Async iteration loop awaits sequentially</h3>
<pre><code class="language-js">for (const url of urls) {
  const res = await fetch(url); // waits for EACH — slow if they're independent
}
// For parallel:
await Promise.all(urls.map(fetch));</code></pre>

<h3>15. Mixing callback and promise — wrap carefully</h3>
<pre><code class="language-js">// BAD — double-invoke
function bad(cb) {
  fetch('...').then(cb).catch(cb); // calls cb twice on rejection (then catch)</code></pre>

<h3>16. Node's <code>unhandledRejection</code> terminates in v15+</h3>
<p>Default behavior switched. Always attach a <code>.catch</code> to top-level promises or wrap in <code>try/catch</code>.</p>

<h3>17. Throwing non-Error values</h3>
<pre><code class="language-js">Promise.reject('string reason').catch(console.log); // 'string reason'</code></pre>
<p>Allowed but painful — no stack trace, no <code>.message</code>. Always reject with an <code>Error</code> (or subclass).</p>

<h3>18. <code>await</code> in a loop swallowing errors</h3>
<pre><code class="language-js">async function bad() {
  for (const p of promises) {
    await p; // if p rejects, loop exits — remaining promises still pending unhandled
  }
}</code></pre>
<p>Consider <code>allSettled</code> or explicit try/catch inside.</p>

<h3>19. Promise inside setTimeout vs setImmediate (Node)</h3>
<pre><code class="language-js">setTimeout(() =&gt; console.log('timeout'), 0);
setImmediate(() =&gt; console.log('immediate'));
Promise.resolve().then(() =&gt; console.log('microtask'));
// microtask, then order between timeout/immediate depends on phase — usually immediate first if inside I/O</code></pre>

<h3>20. <code>Promise.all</code> with an empty array</h3>
<pre><code class="language-js">await Promise.all([]); // fulfills immediately with []
await Promise.any([]); // rejects immediately with AggregateError — no candidate</code></pre>

<h3>21. <code>resolve</code> with a rejected promise</h3>
<pre><code class="language-js">new Promise((resolve) =&gt; resolve(Promise.reject('boom')))
  .catch(e =&gt; console.log(e)); // 'boom'
// resolve(promise) causes adoption — including adopting a rejection.</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — the Promise constructor antipattern</h3>
<pre><code class="language-js">// BAD
function getData() {
  return new Promise((resolve, reject) =&gt; {
    fetch(url).then(resolve, reject);
  });
}
// GOOD
function getData() { return fetch(url); }</code></pre>
<p>Wrapping an existing promise in <code>new Promise</code> adds an allocation, hides error stacks, and risks forgetting to call <code>reject</code> on some path.</p>

<h3>Anti-pattern 2 — sequential awaits on independent calls</h3>
<pre><code class="language-js">// BAD
const user = await getUser();
const settings = await getSettings();
// GOOD
const [user, settings] = await Promise.all([getUser(), getSettings()]);</code></pre>

<h3>Anti-pattern 3 — forgetting <code>await</code></h3>
<pre><code class="language-js">// BAD
async function save(data) {
  db.save(data);       // returns promise; async work abandoned
  return 'ok';         // caller sees 'ok' before save settles
}
// GOOD
async function save(data) {
  await db.save(data);
  return 'ok';
}</code></pre>
<p>Linters (<code>@typescript-eslint/no-floating-promises</code>, <code>require-await</code>) catch this.</p>

<h3>Anti-pattern 4 — <code>async</code> on a function that has no <code>await</code></h3>
<pre><code class="language-js">// Confusing
async function square(x) { return x * x; } // unnecessarily returns a Promise
// Fine only if caller always uses it as promise (e.g., interface consistency).</code></pre>

<h3>Anti-pattern 5 — swallowing errors with empty catch</h3>
<pre><code class="language-js">// BAD
doSomething().catch(() =&gt; {}); // silently ignores errors
// BETTER
doSomething().catch(err =&gt; logger.warn('...', err));</code></pre>

<h3>Anti-pattern 6 — nested <code>.then</code></h3>
<pre><code class="language-js">// BAD
fetch(a).then(ra =&gt; {
  fetch(b, ra.data).then(rb =&gt; {
    fetch(c, rb.data).then(rc =&gt; {...});
  });
});
// GOOD — flatten
fetch(a).then(ra =&gt; fetch(b, ra.data)).then(rb =&gt; fetch(c, rb.data)).then(...);
// BEST — async/await
const ra = await fetch(a); const rb = await fetch(b, ra.data); const rc = await fetch(c, rb.data);</code></pre>

<h3>Anti-pattern 7 — using <code>.then(cb, cb)</code> or both <code>.then</code> and <code>.catch</code> on the same action</h3>
<pre><code class="language-js">// BAD
p.then(cb).catch(cb); // cb fires once for success AND once for any error in cb itself</code></pre>

<h3>Anti-pattern 8 — rejecting with non-Error</h3>
<pre><code class="language-js">// BAD
return Promise.reject('user not found');
// GOOD
return Promise.reject(new Error('user not found'));</code></pre>

<h3>Anti-pattern 9 — forEach with async callback</h3>
<pre><code class="language-js">// BAD — forEach ignores the returned promises
[1,2,3].forEach(async (i) =&gt; await save(i));
// The outer code proceeds before saves complete.
// GOOD
for (const i of [1,2,3]) await save(i);        // sequential
await Promise.all([1,2,3].map(save));          // parallel</code></pre>

<h3>Anti-pattern 10 — awaiting inside .map() and hoping for parallelism</h3>
<pre><code class="language-js">// BAD — looks parallel but maps return promises; not awaited until Promise.all
const results = items.map(async (i) =&gt; {
  const r = await process(i);
  return r * 2;
});
console.log(results); // [Promise, Promise, Promise] — not values
// GOOD
const results = await Promise.all(items.map(async (i) =&gt; (await process(i)) * 2));</code></pre>

<h3>Anti-pattern 11 — unbounded concurrency</h3>
<pre><code class="language-js">// BAD — spawns 10000 requests at once
await Promise.all(urls.map(fetch));
// GOOD — use mapLimit or a library (p-limit, p-queue)</code></pre>

<h3>Anti-pattern 12 — long <code>.then</code> chains with shared state</h3>
<pre><code class="language-js">// BAD — pass-through-by-variable leaks
let userData;
getUser().then(u =&gt; { userData = u; return getPosts(u.id); })
  .then(posts =&gt; ({ user: userData, posts }));
// GOOD — return tuple or use async/await
const user = await getUser();
const posts = await getPosts(user.id);
return { user, posts };</code></pre>

<h3>Anti-pattern 13 — using <code>.finally</code> for cleanup that returns a promise</h3>
<pre><code class="language-js">// BAD — finally returns promise that rejects, masking original error
p.finally(() =&gt; cleanupMayFail());
// GOOD — explicit try/finally in async
async function run() {
  try { return await work(); }
  finally { try { await cleanupMayFail(); } catch {} }
}</code></pre>

<h3>Anti-pattern 14 — Promise.all with mixed fail-OK items</h3>
<pre><code class="language-js">// BAD — one failure wastes all completed work
await Promise.all([critical(), optional()]); // optional fails → whole thing fails
// GOOD
const [c, o] = await Promise.allSettled([critical(), optional()]);
if (c.status === 'rejected') throw c.reason;
const optionalValue = o.status === 'fulfilled' ? o.value : null;</code></pre>

<h3>Anti-pattern 15 — leaking promises (unhandled in-flight)</h3>
<pre><code class="language-js">// BAD — component unmounts, response arrives, setState on unmounted
useEffect(() =&gt; { fetch(url).then(setState); }, []);
// GOOD
useEffect(() =&gt; {
  const ctrl = new AbortController();
  fetch(url, { signal: ctrl.signal }).then(setState).catch(() =&gt; {});
  return () =&gt; ctrl.abort();
}, []);</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. What are the three states of a Promise?</div>
  <div class="qa-answer">
    <p><strong>pending</strong>, <strong>fulfilled</strong>, and <strong>rejected</strong>. A promise starts pending. It transitions <em>exactly once</em> to either fulfilled (with a value) or rejected (with a reason). Once settled, further calls to <code>resolve</code>/<code>reject</code> are no-ops, and the state and value are immutable.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Predict the output</div>
<pre><code class="language-js">console.log(1);
setTimeout(() =&gt; console.log(2), 0);
Promise.resolve().then(() =&gt; console.log(3));
console.log(4);</code></pre>
  <div class="qa-answer">
    <p><code>1, 4, 3, 2</code>. Sync code logs 1 and 4. The call stack empties; the engine drains microtasks first (promise reaction logs 3); then takes a macrotask (timeout logs 2).</p>
    <p><strong>Keywords:</strong> microtask queue, macrotask queue, drain between tasks.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Implement Promise.all from scratch.</div>
  <div class="qa-answer">
<pre><code class="language-js">function myAll(iterable) {
  return new Promise((resolve, reject) =&gt; {
    const results = [];
    let remaining = 0, i = 0;
    let started = false;
    for (const item of iterable) {
      const idx = i++;
      remaining++;
      Promise.resolve(item).then(v =&gt; {
        results[idx] = v;
        if (--remaining === 0 && started) resolve(results);
      }, reject);
    }
    started = true;
    if (remaining === 0) resolve(results); // empty iterable
  });
}</code></pre>
    <p>Key points: (a) preserve input order with an indexed slot, (b) short-circuit on first rejection, (c) handle empty iterable, (d) wrap each item in <code>Promise.resolve</code> so non-promises work.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Difference between <code>Promise.all</code>, <code>allSettled</code>, <code>race</code>, <code>any</code>?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>all</strong>: wait for all; short-circuit on first rejection.</li>
      <li><strong>allSettled</strong>: wait for all; never rejects. Returns status objects.</li>
      <li><strong>race</strong>: first settlement (fulfill or reject) wins.</li>
      <li><strong>any</strong>: first fulfillment wins; rejects only if ALL reject, with an <code>AggregateError</code>.</li>
    </ul>
    <p><strong>Use-cases:</strong> all → batch, allSettled → partial OK, race → timeouts, any → mirrors/fallbacks.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. What does this print?</div>
<pre><code class="language-js">async function f() {
  console.log('A');
  await null;
  console.log('B');
}
f();
console.log('C');</code></pre>
  <div class="qa-answer">
    <p><code>A, C, B</code>. <code>await null</code> wraps in <code>Promise.resolve(null)</code> and yields — even though the value is ready synchronously, the continuation is scheduled as a microtask. 'C' runs synchronously after <code>f()</code> returns; then the microtask fires and logs 'B'.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Implement a retry with exponential backoff.</div>
  <div class="qa-answer">
<pre><code class="language-js">async function retry(fn, { tries = 3, baseMs = 100, factor = 2 } = {}) {
  let err;
  for (let i = 0; i &lt; tries; i++) {
    try { return await fn(); }
    catch (e) {
      err = e;
      if (i === tries - 1) break;
      await new Promise(r =&gt; setTimeout(r, baseMs * factor ** i));
    }
  }
  throw err;
}</code></pre>
    <p>Extensions: jitter (randomize delay), exponential cap, retry only on specific error types.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Implement fetch with timeout.</div>
  <div class="qa-answer">
<pre><code class="language-js">function fetchWithTimeout(url, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() =&gt; ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal })
    .finally(() =&gt; clearTimeout(timer));
}</code></pre>
    <p>Alternative using <code>Promise.race</code>: race the fetch against a timeout rejection — but that leaves the underlying request in-flight, wasting bandwidth. <code>AbortController</code> actually cancels.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Why is <code>async function</code> always returning a promise useful?</div>
  <div class="qa-answer">
    <p>It enables uniform composition. Any caller can <code>await</code> the result or chain <code>.then</code> — regardless of whether the function had any real async work inside. You can swap a synchronous implementation for an async one without changing callers, and interfaces (repositories, services) can be defined in terms of "returns a promise" without the implementation needing to be actually async today.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. What's a microtask and how does it differ from a macrotask?</div>
  <div class="qa-answer">
    <p><strong>Microtask</strong>: high-priority task scheduled from within the JS runtime. Promise reactions, <code>queueMicrotask</code>, <code>MutationObserver</code> callbacks. After the current script and each macrotask, the engine drains ALL microtasks before moving on. <strong>Macrotask</strong>: timers, I/O, UI events, postMessage. The engine picks ONE per event-loop cycle. Implication: microtasks run before the next paint and before the next <code>setTimeout</code>. That lets promise chains complete atomically before observable side effects (rendering, timers).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. What happens if an unhandled rejection occurs?</div>
  <div class="qa-answer">
    <p>At the end of the microtask drain, if a rejected promise has no <code>.then(_, onR)</code> or <code>.catch</code> registered, the host fires an <code>unhandledrejection</code> event (browsers) or emits <code>unhandledRejection</code> (Node). In Node 15+, the default is to terminate the process. Attach handlers synchronously to any promise that might reject.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Is this parallel or sequential?</div>
<pre><code class="language-js">async function f() {
  const a = fetch('a');
  const b = fetch('b');
  return [await a, await b];
}</code></pre>
  <div class="qa-answer">
    <p><strong>Parallel.</strong> Both <code>fetch</code> calls START at the moment they're invoked — <code>fetch</code> returns a promise immediately and the network request begins. The <code>await</code>s then wait for each. So requests overlap in time. This is idiomatic and <em>equivalent</em> in wall-clock behavior to <code>await Promise.all([fetch('a'), fetch('b')])</code>, but differs in error handling: <code>Promise.all</code> rejects on first failure; the above style still awaits <code>a</code> even if <code>b</code> has rejected (but <code>await a</code> will throw first if it rejects before <code>b</code>).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. What's wrong here?</div>
<pre><code class="language-js">[1,2,3].forEach(async (n) =&gt; {
  await save(n);
  console.log('done', n);
});
console.log('all done');</code></pre>
  <div class="qa-answer">
    <p><code>forEach</code> doesn't await promises returned by its callback. The outer <code>'all done'</code> logs before any <code>save</code> completes. Fixes: use a <code>for...of</code> loop (sequential), or <code>await Promise.all([1,2,3].map(async n =&gt; await save(n)))</code> (parallel).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Implement a concurrency-limited map.</div>
  <div class="qa-answer">
<pre><code class="language-js">async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  const executing = new Set();
  for (let i = 0; i &lt; items.length; i++) {
    const p = Promise.resolve().then(() =&gt; fn(items[i], i)).then(r =&gt; {
      results[i] = r;
      executing.delete(p);
    });
    executing.add(p);
    if (executing.size &gt;= limit) await Promise.race(executing);
  }
  await Promise.all(executing);
  return results;
}</code></pre>
    <p>Avoids the "fire 10000 at once" pitfall. Libraries: <code>p-limit</code>, <code>p-queue</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Explain promise chaining and how it flattens nested promises.</div>
  <div class="qa-answer">
    <p>Every <code>.then</code> returns a new promise <code>p2</code>. When the callback runs, its return value determines <code>p2</code>'s settlement: a thrown error rejects <code>p2</code>; a non-promise value fulfills <code>p2</code>; a returned promise causes <code>p2</code> to <em>adopt</em> it (p2 waits and settles exactly the same way). This adoption is recursive — so <code>p.then(() =&gt; Promise.resolve(Promise.resolve(1)))</code> fulfills with <code>1</code>, not with a nested promise. That's why you almost never see <code>Promise&lt;Promise&lt;T&gt;&gt;</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Can you cancel a Promise?</div>
  <div class="qa-answer">
    <p>Not natively. A Promise can only be fulfilled or rejected — there is no "cancelled" state. You cancel the <em>underlying operation</em> (e.g., with <code>AbortController</code> for fetch), which causes the promise to reject with an <code>AbortError</code>. TC39 has entertained proposals for cancellable promises but none have shipped. In practice: design with <code>AbortSignal</code> for all cancellable work; ignore a promise's result in your own code once you no longer care.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q16. What's the output order?</div>
<pre><code class="language-js">async function a() { console.log('a1'); await b(); console.log('a2'); }
async function b() { console.log('b1'); }
a();
console.log('main');</code></pre>
  <div class="qa-answer">
    <p><code>a1, b1, main, a2</code>. <code>a()</code> logs a1, then calls <code>b()</code> which logs b1 synchronously. <code>b()</code> returns a resolved promise (because <code>async</code>). <code>await</code> on it still schedules a2's continuation as a microtask. Control returns to the top level, which logs 'main'. Then microtasks drain and a2 logs.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q17. Write promisify for Node-style callbacks.</div>
  <div class="qa-answer">
<pre><code class="language-js">function promisify(fn) {
  return function (...args) {
    return new Promise((resolve, reject) =&gt; {
      fn.call(this, ...args, (err, data) =&gt; err ? reject(err) : resolve(data));
    });
  };
}
// const readFile = promisify(fs.readFile);
// const buf = await readFile('a.txt');</code></pre>
    <p>Node already exports <code>util.promisify</code>, which also understands <code>fn[util.promisify.custom]</code> overrides.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You use the word "microtask" correctly and can order code involving both timers and promises.</li>
    <li>You can desugar <code>async/await</code> to <code>.then</code> chains.</li>
    <li>You implement <code>Promise.all</code> / <code>race</code> / <code>any</code> from scratch.</li>
    <li>You know Promises aren't cancellable and reach for <code>AbortController</code>.</li>
    <li>You distinguish parallel vs sequential <code>await</code> patterns.</li>
    <li>You mention unhandled-rejection termination in modern Node.</li>
    <li>You warn against <code>async</code> inside <code>forEach</code> and against sequential awaits on independent work.</li>
  </ul>
</div>
`}

]
});
