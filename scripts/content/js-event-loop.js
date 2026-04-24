window.PREP_SITE.registerTopic({
  id: 'js-event-loop',
  module: 'JavaScript Deep',
  title: 'Event Loop',
  estimatedReadTime: '35 min',
  tags: ['event-loop', 'microtasks', 'macrotasks', 'async', 'promises', 'settimeout', 'concurrency', 'fundamentals'],
  sections: [

{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>JavaScript is <strong>single-threaded</strong> — one call stack. Yet it handles async (timers, fetch, events) without blocking. The secret is the <strong>Event Loop</strong>: a coordinator between the JS thread, external APIs, and a set of queues.</p>
<p>Key components:</p>
<ul>
  <li><strong>Call stack</strong> — synchronous execution.</li>
  <li><strong>Web APIs / Host APIs</strong> — timers, fetch, DOM events (browser); fs, net (Node). Run OUTSIDE the JS thread.</li>
  <li><strong>Task queue (macrotask)</strong> — <code>setTimeout</code>, <code>setInterval</code>, I/O, UI events, <code>MessageChannel</code>.</li>
  <li><strong>Microtask queue</strong> — <code>Promise.then</code>, <code>queueMicrotask</code>, <code>MutationObserver</code>. <em>Higher priority</em> than macrotasks.</li>
  <li><strong>Animation frame queue</strong> — <code>requestAnimationFrame</code>, fires before next paint.</li>
</ul>
<p>The loop's cadence: <strong>run sync code → drain ALL microtasks → maybe render → run ONE macrotask → drain microtasks → ...</strong></p>
<div class="callout insight">
  <div class="callout-title">🧠 The one rule</div>
  <p>Microtasks are drained <em>completely</em> between macrotasks. A microtask that schedules another microtask will run it before any macrotask.</p>
</div>
`},

{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>The problem JS solves</h3>
<p>JavaScript was designed to be single-threaded in the browser (to avoid DOM race conditions). But web pages need to handle clicks, timers, and network requests concurrently. The Event Loop is the answer: a cooperative scheduler.</p>

<h3>What "single-threaded" really means</h3>
<p>JS has ONE call stack per realm. At any moment, only one function runs. However, the browser itself is multithreaded — networking, timers, rendering all run on other threads. They <em>hand back</em> callbacks to JS via queues.</p>

<h3>Why two queues?</h3>
<p>Historically, JS only had the macrotask queue. Then promises arrived (ES6). Promises needed "run after current sync code but before any I/O" semantics — they're "job queue" (now microtask queue). Giving promises their own higher-priority queue ensures consistent behavior: <em>when a Promise resolves, its <code>.then</code> runs before any pending timer</em>.</p>

<h3>Browser vs Node</h3>
<p>Same conceptual model but different implementations:</p>
<ul>
  <li><strong>Browser</strong> — V8 + Chrome's scheduler. Multiple queues per task source (UI, timers, network, etc.). Paint happens between tasks.</li>
  <li><strong>Node</strong> — V8 + libuv. The loop has distinct phases (timers, pending callbacks, idle, poll, check, close). Microtasks drained between <em>every</em> macrotask within a phase.</li>
</ul>
<p>For interviews: focus on the browser model unless the question is explicitly Node.</p>
`},

{ id: 'mental-model', title: '🪜 Mental Model', html: `
<h3>The big picture</h3>
<div class="diagram">
           ┌──────────────┐   browser/host APIs
           │ CALL STACK   │   (setTimeout, fetch, DOM)
           │  [frame 2]   │
           │  [frame 1]   │     ▲
           │  [GEC    ]   │     │ when done, push callback
           └──────┬───────┘     │
                  │             │
                  ▼ pops when empty
           ┌──────────────┐
           │ EVENT LOOP   │ ← checks queues when stack is empty
           └──────┬───────┘
                  │
     ┌────────────┼───────────────┐
     ▼            ▼               ▼
  ┌─────────┐  ┌────────────┐  ┌─────────────┐
  │Microtask│  │ Macrotask  │  │ Animation    │
  │ queue   │  │ queue      │  │ frame queue  │
  │(Promise)│  │(setTimeout)│  │ (rAF)        │
  └─────────┘  └────────────┘  └─────────────┘
   (drained     (ONE task       (before paint,
    completely) per tick)        every ~16.6ms)
</div>

<h3>One tick of the loop (simplified algorithm)</h3>
<ol>
  <li>If call stack empty, check queues.</li>
  <li>Drain the entire microtask queue. Each microtask may schedule more — keep draining.</li>
  <li>If it's time to render (typically every 16.6ms at 60fps):
    <ul>
      <li>Run <code>requestAnimationFrame</code> callbacks.</li>
      <li>Compute style, layout, paint.</li>
    </ul>
  </li>
  <li>Pick <strong>one</strong> task from the macrotask queue and run it. The task may push more sync work onto the stack.</li>
  <li>Drain microtasks again (new ones from the macrotask).</li>
  <li>Repeat.</li>
</ol>

<h3>Visualizing priority</h3>
<div class="diagram">
  sync code
     │
     ▼
  drain ALL microtasks (promises, queueMicrotask, MutationObserver)
     │
     ▼
  maybe render (rAF → style → layout → paint)
     │
     ▼
  ONE macrotask (setTimeout callback, event handler, I/O)
     │
     ▼
  drain ALL microtasks again
     │
     ▼
  ... repeat
</div>

<h3>What counts as what</h3>
<table>
  <tr><th>Microtasks</th><th>Macrotasks</th></tr>
  <tr>
    <td>
      <ul>
        <li>Promise <code>.then</code>/<code>.catch</code>/<code>.finally</code></li>
        <li><code>async</code>/<code>await</code> (resumption)</li>
        <li><code>queueMicrotask()</code></li>
        <li>MutationObserver callbacks</li>
      </ul>
    </td>
    <td>
      <ul>
        <li><code>setTimeout</code>, <code>setInterval</code> callbacks</li>
        <li>UI events (click, input, scroll)</li>
        <li>I/O completion (fetch response, file read)</li>
        <li><code>MessageChannel.postMessage</code></li>
        <li>Script evaluation (top-level)</li>
      </ul>
    </td>
  </tr>
</table>

<p><code>requestAnimationFrame</code> is in its own bucket, NOT a macrotask. It runs just before paint.</p>
`},

{ id: 'mechanics', title: '⚙️ Step-by-Step Mechanics', html: `
<h3>When you call <code>setTimeout(fn, 100)</code>:</h3>
<ol>
  <li>The JS call to <code>setTimeout</code> runs synchronously. It hands <code>fn</code> and the delay to the browser's timer API.</li>
  <li>JS continues executing — <code>fn</code> is NOT on the stack.</li>
  <li>100ms later (approximately), the browser moves <code>fn</code> to the macrotask queue.</li>
  <li>Whenever the event loop next pulls from the macrotask queue, <code>fn</code> runs — only if the stack is empty AND all microtasks are drained first.</li>
</ol>

<h3>When a Promise resolves:</h3>
<ol>
  <li>If the Promise is resolved synchronously (<code>Promise.resolve(x)</code>), its <code>.then</code> callback is queued as a microtask.</li>
  <li>If asynchronously (e.g., <code>fetch</code>), when the HTTP response arrives the fulfillment triggers the <code>.then</code>, queued as a microtask.</li>
  <li>Microtasks always run before any pending macrotask.</li>
</ol>

<h3>Key invariant: sync runs to completion</h3>
<p>No timer, no promise, no UI event can interrupt synchronous code. <code>while (true) {}</code> will freeze the whole page — no rendering, no clicks, nothing.</p>

<h3>Key invariant: microtask draining</h3>
<pre><code class="language-js">Promise.resolve().then(() =&gt; {
  console.log('a');
  Promise.resolve().then(() =&gt; console.log('b'));
});
setTimeout(() =&gt; console.log('c'), 0);
console.log('d');</code></pre>

<p>Output: <code>d a b c</code>. The second microtask (<code>b</code>) is added while draining the first — it runs before <code>c</code> (the timer) because microtasks drain to completion.</p>

<h3>async/await is promise sugar</h3>
<pre><code class="language-js">async function foo() {
  console.log('1');
  await null;
  console.log('2');   // this runs as a microtask
  await null;
  console.log('3');   // another microtask
}
foo();
console.log('4');</code></pre>

<p>Output: <code>1 4 2 3</code>. Each <code>await</code> suspends and re-queues the rest of the function as a microtask.</p>
`},

{ id: 'examples', title: '📦 Examples (progressive)', html: `
<h3>Example 1 — Classic interleave</h3>
<pre><code class="language-js">console.log('1');
setTimeout(() =&gt; console.log('2'), 0);
Promise.resolve().then(() =&gt; console.log('3'));
console.log('4');</code></pre>

<h4>Output</h4>
<pre><code class="language-js">1
4
3
2</code></pre>

<h4>Why</h4>
<ol>
  <li>Sync: <code>1</code>.</li>
  <li>Sync: <code>setTimeout</code> schedules macrotask.</li>
  <li>Sync: <code>Promise.resolve().then</code> schedules microtask.</li>
  <li>Sync: <code>4</code>.</li>
  <li>Stack empty. Drain microtasks: <code>3</code>.</li>
  <li>Pick one macrotask: <code>2</code>.</li>
</ol>

<h3>Example 2 — Microtask chain</h3>
<pre><code class="language-js">Promise.resolve().then(() =&gt; console.log('a'))
                  .then(() =&gt; console.log('b'))
                  .then(() =&gt; console.log('c'));
setTimeout(() =&gt; console.log('d'), 0);
console.log('e');</code></pre>

<h4>Output</h4>
<pre><code class="language-js">e
a
b
c
d</code></pre>

<p>The chained <code>.then</code>s each add a microtask as the previous resolves. All three drain before the timer.</p>

<h3>Example 3 — Interleaving macros and micros</h3>
<pre><code class="language-js">setTimeout(() =&gt; console.log('t1'), 0);
setTimeout(() =&gt; {
  console.log('t2');
  Promise.resolve().then(() =&gt; console.log('p2'));
}, 0);
Promise.resolve().then(() =&gt; console.log('p1'));
console.log('sync');</code></pre>

<h4>Output</h4>
<pre><code class="language-js">sync
p1
t1
t2
p2</code></pre>

<h4>Why</h4>
<ol>
  <li>Sync: <code>sync</code>.</li>
  <li>Drain microtasks: <code>p1</code>.</li>
  <li>Pick one macrotask: <code>t1</code>.</li>
  <li>Drain microtasks: (none).</li>
  <li>Pick next macrotask: <code>t2</code>, which adds a microtask.</li>
  <li>Drain microtasks: <code>p2</code>.</li>
</ol>

<h3>Example 4 — async/await</h3>
<pre><code class="language-js">async function run() {
  console.log('1');
  await null;
  console.log('2');
}
run();
console.log('3');</code></pre>

<h4>Output</h4>
<pre><code class="language-js">1
3
2</code></pre>

<p><code>run()</code> runs synchronously up to the <code>await</code>. At <code>await</code>, the rest (<code>console.log('2')</code>) is suspended and queued as a microtask. <code>console.log('3')</code> runs. Then microtasks drain.</p>

<h3>Example 5 — Multiple await</h3>
<pre><code class="language-js">async function f() {
  console.log('a');
  await null;
  console.log('b');
  await null;
  console.log('c');
}
f();
console.log('d');</code></pre>

<h4>Output</h4>
<pre><code class="language-js">a
d
b
c</code></pre>

<h3>Example 6 — The microtask trap</h3>
<pre><code class="language-js">function trap() {
  Promise.resolve().then(trap);
}
trap();
// This drains forever — microtask adds new microtask endlessly.
// Browser UI freezes. Macrotasks never get a turn.</code></pre>

<p>Be careful with recursive promises. The loop never progresses to macrotasks.</p>

<h3>Example 7 — rAF timing</h3>
<pre><code class="language-js">console.log('1');
requestAnimationFrame(() =&gt; console.log('rAF'));
setTimeout(() =&gt; console.log('timer'), 0);
Promise.resolve().then(() =&gt; console.log('promise'));
console.log('2');</code></pre>

<h4>Likely output (browser)</h4>
<pre><code class="language-js">1
2
promise
timer    // OR rAF first, depends on timing
rAF</code></pre>

<p>rAF fires at the next paint, which happens after current task + microtasks. setTimeout(0) fires ASAP in the macrotask queue. Order between the two depends on exact timing.</p>

<h3>Example 8 — Event handler ordering</h3>
<pre><code class="language-js">button.addEventListener('click', () =&gt; {
  console.log('handler start');
  Promise.resolve().then(() =&gt; console.log('promise'));
  setTimeout(() =&gt; console.log('timer'), 0);
  console.log('handler end');
});</code></pre>

<p>When clicked: <code>handler start → handler end → promise → timer</code>. Same pattern: sync, drain microtasks, then macrotasks.</p>

<h3>Example 9 — Node <code>process.nextTick</code> (Node-specific)</h3>
<pre><code class="language-js">// Node only
process.nextTick(() =&gt; console.log('nt'));
Promise.resolve().then(() =&gt; console.log('p'));
setImmediate(() =&gt; console.log('im'));
setTimeout(() =&gt; console.log('st'), 0);
console.log('sync');</code></pre>

<h4>Node output</h4>
<pre><code class="language-js">sync
nt
p
st
im   // OR 'im' before 'st' — ordering between these two varies</code></pre>

<p><code>process.nextTick</code> has higher priority than microtasks in Node. Use sparingly.</p>

<h3>Example 10 — The "zero delay" myth</h3>
<pre><code class="language-js">setTimeout(() =&gt; console.log('A'), 0);
setTimeout(() =&gt; console.log('B'), 5);
const start = Date.now();
while (Date.now() - start &lt; 50) {}   // block for 50ms
console.log('done');</code></pre>

<h4>Output</h4>
<pre><code class="language-js">done
A
B</code></pre>

<p>Blocking the event loop delays ALL pending timers. They fire in order once we return to idle.</p>

<h3>Example 11 — fetch then promise chain</h3>
<pre><code class="language-js">console.log('1');
fetch('/api').then(r =&gt; r.json()).then(data =&gt; console.log('data', data));
console.log('2');</code></pre>

<p>Output starts <code>1, 2</code>. Eventually: <code>data {...}</code> (when HTTP response arrives, the <code>.then</code> is queued as microtask).</p>

<h3>Example 12 — queueMicrotask vs setTimeout(0)</h3>
<pre><code class="language-js">queueMicrotask(() =&gt; console.log('q'));
setTimeout(() =&gt; console.log('t'), 0);
console.log('sync');</code></pre>

<h4>Output</h4>
<pre><code class="language-js">sync
q
t</code></pre>

<p><code>queueMicrotask</code> is equivalent to <code>Promise.resolve().then</code> minus the promise overhead.</p>
`},

{ id: 'edge-cases', title: '🔍 All Edge Cases', html: `
<h3>1. setTimeout minimum delay</h3>
<pre><code class="language-js">setTimeout(() =&gt; ..., 0);   // actually clamped to 4ms after 5 nested timeouts</code></pre>
<p>HTML spec clamps nested timer delays to 4ms after the 5th nesting.</p>

<h3>2. setInterval can drift</h3>
<pre><code class="language-js">setInterval(() =&gt; {
  // if the handler takes &gt; 1s, the next one queues up immediately
}, 1000);</code></pre>
<p>Slow handlers cause overlapping. Use <code>setTimeout</code> recursive pattern for accurate spacing.</p>

<h3>3. Promise microtask is ALWAYS async</h3>
<pre><code class="language-js">const p = Promise.resolve(1);
p.then(v =&gt; console.log(v));   // logs async — microtask
console.log('sync');
// Order: sync, 1</code></pre>

<p>Even resolved promises defer their <code>.then</code> to a microtask. Never call <code>.then</code> sync.</p>

<h3>4. Errors in event handlers don't stop the loop</h3>
<pre><code class="language-js">button.addEventListener('click', () =&gt; { throw new Error('x'); });
// Error is reported but loop continues</code></pre>

<h3>5. Unhandled promise rejection</h3>
<pre><code class="language-js">Promise.reject(new Error('x'));
// 'unhandledrejection' event fires on window, but loop continues</code></pre>

<h3>6. Nested <code>await</code> adds multiple microtasks</h3>
<pre><code class="language-js">async function f() {
  await await await null;
}</code></pre>
<p>Each <code>await</code> adds one microtask. Deep awaits compound.</p>

<h3>7. MutationObserver fires as microtask</h3>
<pre><code class="language-js">const mo = new MutationObserver(() =&gt; console.log('mutated'));
mo.observe(el, { childList: true });
el.appendChild(newChild);
// 'mutated' is queued as microtask (not synchronously)</code></pre>

<h3>8. rAF throttled in background tabs</h3>
<p>rAF runs at ~60fps when tab is visible, ~1fps (or paused) when hidden. Use Page Visibility API to detect.</p>

<h3>9. MessageChannel is a fast macrotask</h3>
<pre><code class="language-js">const { port1, port2 } = new MessageChannel();
port2.onmessage = () =&gt; console.log('msg');
port1.postMessage(null);
// Fires as macrotask, faster than setTimeout(0) typically</code></pre>

<h3>10. Worker threads have their own event loop</h3>
<p>Web Workers run in a separate event loop on a different thread. They communicate via messages.</p>

<h3>11. <code>scheduler.yield()</code> (newer) yields cooperatively</h3>
<pre><code class="language-js">async function doWork() {
  for (let i = 0; i &lt; 1000; i++) {
    await scheduler.yield();   // lets browser handle other tasks
    heavyComputation(i);
  }
}</code></pre>

<p>Splits long work without blocking. Available in newer Chrome.</p>

<h3>12. <code>await</code> with non-promise</h3>
<pre><code class="language-js">await 5;   // equivalent to await Promise.resolve(5)</code></pre>

<h3>13. Promise constructor runs synchronously</h3>
<pre><code class="language-js">console.log('1');
new Promise((resolve) =&gt; {
  console.log('2');   // SYNC
  resolve();
}).then(() =&gt; console.log('3'));
console.log('4');</code></pre>
<p>Output: <code>1 2 4 3</code>. Only <code>.then</code> callbacks are microtasks; the executor is sync.</p>

<h3>14. <code>finally</code> still defers</h3>
<pre><code class="language-js">Promise.resolve().finally(() =&gt; console.log('f'));
console.log('s');
// Output: s f</code></pre>

<h3>15. Browser render frequency</h3>
<p>Most browsers cap rendering at the display refresh rate (usually 60Hz = 16.6ms). Doing too much per frame drops frames.</p>

<h3>16. Long tasks (&gt; 50ms) harm INP</h3>
<p>Tasks over 50ms block interaction. The Performance Observer API can report long tasks. Break them up.</p>

<h3>17. Node's libuv phases</h3>
<p>Node's loop has distinct phases: timers → pending callbacks → idle → <strong>poll</strong> → check → close. Microtasks drain between each phase AND between every macrotask.</p>
`},

{ id: 'bugs-anti', title: '🐛 Common Bugs & Anti-Patterns', html: `
<h3>Bug 1 — Blocking the event loop</h3>
<pre><code class="language-js">function heavy() {
  for (let i = 0; i &lt; 1e9; i++) {}   // blocks ~5 seconds
}
button.onclick = heavy;   // UI freezes</code></pre>

<p>Offload to Web Worker, or split using <code>setTimeout(0)</code> / <code>scheduler.yield()</code>.</p>

<h3>Bug 2 — Assuming setTimeout(0) is immediate</h3>
<pre><code class="language-js">setTimeout(() =&gt; updateUI(), 0);
doBlocking();    // still blocks; timer waits</code></pre>

<h3>Bug 3 — Interval overlap</h3>
<pre><code class="language-js">setInterval(async () =&gt; {
  await slowWork();   // if work takes &gt; interval, overlapping calls
}, 100);</code></pre>

<p>Use <code>setTimeout</code>-recursive pattern:</p>

<pre><code class="language-js">async function loop() {
  await slowWork();
  setTimeout(loop, 100);
}
loop();</code></pre>

<h3>Bug 4 — Infinite microtask loop</h3>
<pre><code class="language-js">function f() { queueMicrotask(f); }
f();   // UI freezes forever</code></pre>

<h3>Bug 5 — Race: out-of-order promises</h3>
<pre><code class="language-js">let latest;
onInput(async (q) =&gt; {
  const data = await fetch(\`/s?q=\${q}\`).then(r =&gt; r.json());
  render(data);   // earlier request may resolve AFTER later one
});</code></pre>

<p>Fix with AbortController or by tracking the latest request ID.</p>

<h3>Bug 6 — Using Promise.all when you wanted sequential</h3>
<pre><code class="language-js">// Bad if each depends on the previous
await Promise.all([a(), b(), c()]);   // fires all in parallel

// Sequential if needed:
for (const fn of [a, b, c]) await fn();</code></pre>

<h3>Bug 7 — Catching errors in a forgotten chain</h3>
<pre><code class="language-js">async function a() { throw new Error('x'); }
a();   // no await, no .catch — unhandled rejection</code></pre>

<h3>Bug 8 — rAF loop without cleanup</h3>
<pre><code class="language-js">function animate() {
  update();
  requestAnimationFrame(animate);   // runs forever even after unmount
}
animate();</code></pre>

<p>Always provide a cancel mechanism and call <code>cancelAnimationFrame</code> on unmount.</p>

<h3>Bug 9 — Assuming synchronous return from async</h3>
<pre><code class="language-js">function getData() {
  let result;
  fetch('/').then(r =&gt; { result = r; });
  return result;   // undefined — fetch hasn't resolved
}</code></pre>

<h3>Bug 10 — Calling setState inside synchronous loop</h3>
<pre><code class="language-js">for (let i = 0; i &lt; 10; i++) setState(i);
// React 18 batches these — only one render
// React 17 caused one render per call — janky</code></pre>
`},

{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<h3>Common ask formats</h3>
<ol>
  <li>"What does this code log?" — classic ordering puzzle.</li>
  <li>"What's the difference between macrotask and microtask?"</li>
  <li>"Explain how <code>async/await</code> integrates with the event loop."</li>
  <li>"Why is <code>setTimeout(fn, 0)</code> not immediate?"</li>
  <li>"Implement a <code>sleep(ms)</code> function."</li>
  <li>"How would you prevent UI freezing while processing a large array?"</li>
</ol>

<h3>Sample 1 — The classic mix</h3>
<pre><code class="language-js">console.log('1');
setTimeout(() =&gt; console.log('2'), 0);
Promise.resolve().then(() =&gt; console.log('3'));
console.log('4');</code></pre>

<div class="qa-block">
<div class="qa-q">Expected answer</div>
<div class="qa-a">
<p><strong>1, 4, 3, 2</strong>. Sync runs first. Promise microtask drains before any macrotask. Timer runs last.</p>
</div>
</div>

<h3>Sample 2 — Multiple awaits</h3>
<pre><code class="language-js">async function a() {
  console.log('a1');
  await b();
  console.log('a2');
}
async function b() {
  console.log('b1');
  await null;
  console.log('b2');
}
a();
console.log('sync');</code></pre>

<div class="qa-block">
<div class="qa-q">Expected answer</div>
<div class="qa-a">
<p>Output: <code>a1, b1, sync, b2, a2</code>.</p>
<ol>
  <li><code>a()</code> starts; <code>a1</code>.</li>
  <li>inside <code>a</code>, <code>b()</code> called; <code>b1</code>.</li>
  <li>in <code>b</code>, <code>await null</code> suspends <code>b</code>, queues <code>b2</code> as microtask.</li>
  <li>control returns to <code>a</code>, but <code>a</code> is awaiting <code>b</code>'s promise, so <code>a</code> is suspended too.</li>
  <li><code>sync</code> logs.</li>
  <li>Microtasks drain: <code>b2</code> resumes <code>b</code>. <code>b</code> resolves, which allows <code>a</code> to resume; <code>a2</code>.</li>
</ol>
</div>
</div>

<h3>Sample 3 — Nested timers + promises</h3>
<pre><code class="language-js">setTimeout(() =&gt; {
  console.log('T1');
  Promise.resolve().then(() =&gt; console.log('P1'));
  setTimeout(() =&gt; console.log('T2'), 0);
}, 0);
Promise.resolve().then(() =&gt; console.log('P0'));
console.log('sync');</code></pre>

<div class="qa-block">
<div class="qa-q">Expected answer</div>
<div class="qa-a">
<p>Output: <code>sync, P0, T1, P1, T2</code>.</p>
<ol>
  <li>Sync logs <code>sync</code>.</li>
  <li>Microtasks drain: <code>P0</code>.</li>
  <li>Macrotask 1: T1 callback runs → logs <code>T1</code>, schedules <code>P1</code> microtask and <code>T2</code> macrotask.</li>
  <li>Microtasks drain: <code>P1</code>.</li>
  <li>Macrotask 2: <code>T2</code> runs.</li>
</ol>
</div>
</div>

<h3>Sample 4 — Implement sleep()</h3>
<pre><code class="language-js">// sleep(ms) should return a promise resolving after ms</code></pre>

<div class="qa-block">
<div class="qa-q">Solution</div>
<div class="qa-a">
<pre><code class="language-js">const sleep = (ms) =&gt; new Promise(r =&gt; setTimeout(r, ms));

// Usage:
async function run() {
  console.log('a');
  await sleep(1000);
  console.log('b');
}</code></pre>
</div>
</div>

<h3>Sample 5 — Process array without blocking UI</h3>
<pre><code class="language-js">// Process 1 million items without freezing</code></pre>

<div class="qa-block">
<div class="qa-q">Solution</div>
<div class="qa-a">
<pre><code class="language-js">async function process(items) {
  const CHUNK = 1000;
  for (let i = 0; i &lt; items.length; i += CHUNK) {
    const end = Math.min(i + CHUNK, items.length);
    for (let j = i; j &lt; end; j++) {
      doWork(items[j]);
    }
    // Yield to browser — let it render / handle events
    await new Promise(r =&gt; setTimeout(r, 0));
  }
}</code></pre>
<p>Or use <code>scheduler.yield()</code> (newer), or move to a Web Worker for heavy CPU work.</p>
</div>
</div>

<h3>Sample 6 — What's the difference between macrotask and microtask?</h3>
<div class="qa-block">
<div class="qa-q">Acceptable answer</div>
<div class="qa-a">
<p>"Macrotasks are things like setTimeout, setInterval, UI events, I/O callbacks. Microtasks are promise callbacks, queueMicrotask, MutationObserver. Microtasks have higher priority — the event loop drains the ENTIRE microtask queue between each macrotask. So a promise resolution always beats a pending timer."</p>
</div>
</div>

<h3>Sample 7 — Why is setTimeout(fn, 0) not truly immediate?</h3>
<div class="qa-block">
<div class="qa-q">Acceptable answer</div>
<div class="qa-a">
<p>"Three reasons: (1) minimum delay clamping to ~4ms after nested timers. (2) it goes into the macrotask queue — microtasks drain before it. (3) any sync code must finish first. Even if you specify 0ms, it's always asynchronous."</p>
</div>
</div>

<h3>Sample 8 — Promise execution timing trap</h3>
<pre><code class="language-js">console.log('1');
new Promise((resolve) =&gt; {
  console.log('2');
  resolve();
}).then(() =&gt; console.log('3'));
console.log('4');</code></pre>

<div class="qa-block">
<div class="qa-q">Expected answer</div>
<div class="qa-a">
<p><strong>1, 2, 4, 3</strong>. The Promise constructor's executor runs SYNCHRONOUSLY. Only the <code>.then</code> callback is microtask.</p>
</div>
</div>

<h3>Sample 9 — rAF ordering</h3>
<pre><code class="language-js">requestAnimationFrame(() =&gt; console.log('rAF'));
Promise.resolve().then(() =&gt; console.log('promise'));
setTimeout(() =&gt; console.log('timer'), 0);
console.log('sync');</code></pre>

<div class="qa-block">
<div class="qa-q">Expected answer</div>
<div class="qa-a">
<p>Output (browser): <code>sync, promise, timer, rAF</code> — typically. But rAF timing depends on when the next paint is scheduled; if the loop is fast enough, rAF might come before the timer. The reliable bits: sync first, promise (microtask) second, timer (macrotask) before rAF usually.</p>
</div>
</div>

<h3>Sample 10 — Real-world debounce with event loop awareness</h3>
<p>Covered in separate topic; the engine runs the debounced function via <code>setTimeout</code>, so it's a macrotask.</p>

<h3>Follow-ups</h3>
<ul>
  <li>"How does Node's event loop differ from the browser's?" (libuv phases, <code>process.nextTick</code>.)</li>
  <li>"What's <code>queueMicrotask</code>?" (Spec-exposed way to schedule a microtask without needing a promise.)</li>
  <li>"How do Web Workers interact with the event loop?" (Separate thread, separate loop; communicate via postMessage.)</li>
  <li>"How does React's rendering fit in?" (Before 18: sync within event handlers. 18+: automatic batching across promises/timeouts too.)</li>
  <li>"What's a 'long task' and why does it matter?" (>50ms; hurts INP, blocks interactions.)</li>
  <li>"How would you detect frame drops?" (<code>PerformanceObserver</code> with entry type 'longtask' or 'event-timing'.)</li>
</ul>

<div class="callout success">
  <div class="callout-title">✅ Master checklist</div>
  <ul>
    <li>Can you predict ordering of sync, promise, setTimeout, rAF without running?</li>
    <li>Can you explain why microtasks drain completely between macrotasks?</li>
    <li>Can you explain the role of the call stack, queues, and loop coordinator?</li>
    <li>Can you implement sleep, debounce, yield-to-browser helpers?</li>
    <li>Do you know how to avoid blocking the loop (Web Workers, chunking, rAF)?</li>
    <li>Can you describe how async/await integrates via microtasks?</li>
  </ul>
</div>
`}

]});
