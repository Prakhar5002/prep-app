/* Practice challenges — Async & Event Loop */
(function () {
  var reg = window.PREP_SITE.registerChallenge;

  reg({
    id: 'async-sync-microtask-macrotask',
    category: 'js-async', difficulty: 'easy', type: 'predict-output',
    prompt: 'In what order does this log?',
    code: "console.log('start');\nsetTimeout(function () { console.log('timeout'); }, 0);\nPromise.resolve().then(function () { console.log('promise'); });\nconsole.log('end');",
    answer: "start\nend\npromise\ntimeout",
    explanation: "Synchronous code always runs first, so 'start' and 'end' log immediately. Then the microtask queue (Promise callbacks) drains completely before the event loop moves on to macrotasks (setTimeout callbacks), so 'promise' logs before 'timeout' even though the timeout was scheduled first."
  });

  reg({
    id: 'async-promise-then-chain-order',
    category: 'js-async', difficulty: 'easy', type: 'predict-output',
    prompt: 'In what order does this log?',
    code: "console.log('A');\nPromise.resolve(1)\n  .then(function (v) { console.log('B', v); return v + 1; })\n  .then(function (v) { console.log('C', v); return v + 1; })\n  .then(function (v) { console.log('D', v); });\nconsole.log('E');",
    answer: "A\nE\nB 1\nC 2\nD 3",
    explanation: "All synchronous code (A, E) runs before any .then callback. Each .then schedules its callback as a microtask only once the previous link resolves, so B, C, D run one after another in the microtask queue, each receiving the value returned by the previous handler."
  });

  reg({
    id: 'async-function-returns-promise',
    category: 'js-async', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log, and in what order?',
    code: "async function f() {\n  return 42;\n}\nconsole.log('before');\nf().then(function (v) { console.log('resolved', v); });\nconsole.log('after');",
    answer: "before\nafter\nresolved 42",
    explanation: "An async function always returns a Promise, even when it just returns a plain value — the value is wrapped automatically. That wrapped Promise only settles as a microtask, so 'before' and 'after' (both synchronous) log first, and 'resolved 42' logs afterward."
  });

  reg({
    id: 'async-await-pause-resume',
    category: 'js-async', difficulty: 'medium', type: 'predict-output',
    prompt: 'In what order does this log?',
    code: "async function f() {\n  console.log('1');\n  await null;\n  console.log('2');\n}\nconsole.log('start');\nf();\nconsole.log('end');",
    answer: "start\n1\nend\n2",
    explanation: "console.log('start') runs first as plain synchronous code, before f() is even invoked. THEN calling f() runs synchronously up to its first await, logging '1' — at which point await suspends the function and returns control to the caller right away, letting 'end' log before the function resumes. The resumption after await is scheduled as a microtask, so '2' logs last."
  });

  reg({
    id: 'async-settimeout-zero-after-sync',
    category: 'js-async', difficulty: 'easy', type: 'predict-output',
    prompt: 'In what order does this log?',
    code: "console.log('one');\nsetTimeout(function () { console.log('two'); }, 0);\nconsole.log('three');",
    answer: "one\nthree\ntwo",
    explanation: "setTimeout(..., 0) does not run immediately — it queues a macrotask that can only run after the current synchronous script has fully finished, so 'three' always logs before 'two' regardless of the 0ms delay."
  });

  reg({
    id: 'async-classic-async1-async2-order',
    category: 'js-async', difficulty: 'hard', type: 'predict-output',
    prompt: 'This is a classic event-loop puzzle. In what exact order does everything log?',
    code: "async function async1() {\n  console.log('async1 start');\n  await async2();\n  console.log('async1 end');\n}\nasync function async2() {\n  console.log('async2');\n}\n\nconsole.log('script start');\nsetTimeout(function () {\n  console.log('setTimeout');\n}, 0);\nasync1();\nnew Promise(function (resolve) {\n  console.log('promise1');\n  resolve();\n}).then(function () {\n  console.log('promise2');\n});\nconsole.log('script end');",
    answer: "script start\nasync1 start\nasync2\npromise1\nscript end\nasync1 end\npromise2\nsetTimeout",
    explanation: "async1() runs synchronously until it awaits async2(), and async2() itself runs synchronously up to its (implicit) return, so 'async1 start' and 'async2' log immediately. The Promise executor also runs synchronously, so 'promise1' logs next. 'script end' finishes the synchronous script. Only then does the microtask queue drain: the paused async1() resumes ('async1 end'), then the .then callback runs ('promise2'). The setTimeout macrotask runs last, after all microtasks."
  });

  reg({
    id: 'async-promise-all-preserves-order',
    category: 'js-async', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "function delay(ms, value) {\n  return new Promise(function (resolve) {\n    setTimeout(function () { resolve(value); }, ms);\n  });\n}\nPromise.all([delay(6, 'a'), delay(2, 'b'), delay(4, 'c')]).then(function (results) {\n  console.log(results);\n});\nconsole.log('start');",
    answer: "start\n[ 'a', 'b', 'c' ]",
    explanation: "The .then() callback can only run once ALL of the input promises have settled, and even the fastest one ('b' at 2ms) still needs at least a tick to actually resolve — so the synchronous console.log('start') right after the Promise.all(...) call always runs first, before any of that. Promise.all also resolves with results in the SAME ORDER as the input array, regardless of which promise actually settles first internally — the result array always mirrors the input positions."
  });

  reg({
    id: 'async-promise-race-fastest-wins',
    category: 'js-async', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "function delay(ms, value) {\n  return new Promise(function (resolve) {\n    setTimeout(function () { resolve(value); }, ms);\n  });\n}\nPromise.race([delay(8, 'slow'), delay(2, 'fast')]).then(function (v) {\n  console.log(v);\n});",
    answer: "fast",
    explanation: "Promise.race() settles with whichever promise settles FIRST, ignoring the rest. The 2ms delay finishes well before the 8ms one, so the race resolves with 'fast'."
  });

  reg({
    id: 'async-promise-any-ignores-rejections',
    category: 'js-async', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "function rejectAfter(ms, reason) {\n  return new Promise(function (_, reject) {\n    setTimeout(function () { reject(reason); }, ms);\n  });\n}\nfunction resolveAfter(ms, value) {\n  return new Promise(function (resolve) {\n    setTimeout(function () { resolve(value); }, ms);\n  });\n}\nPromise.any([rejectAfter(1, 'err0'), resolveAfter(6, 'ok'), rejectAfter(2, 'err1')])\n  .then(function (v) { console.log(v); })\n  .catch(function () { console.log('all rejected'); });",
    answer: "ok",
    explanation: "Promise.any() ignores individual rejections and only rejects overall (with an AggregateError) if EVERY input rejects. Here two inputs reject early, but the third eventually fulfills with 'ok', so that becomes the result — the earlier rejections are silently discarded."
  });

  reg({
    id: 'async-promise-allsettled-shape',
    category: 'js-async', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "Promise.allSettled([\n  Promise.resolve(1),\n  Promise.reject('err'),\n  new Promise(function (resolve) { setTimeout(function () { resolve(2); }, 2); })\n]).then(function (results) {\n  console.log(results);\n});",
    answer: "[\n  { status: 'fulfilled', value: 1 },\n  { status: 'rejected', reason: 'err' },\n  { status: 'fulfilled', value: 2 }\n]",
    explanation: "Unlike Promise.all, allSettled() never short-circuits on a rejection — it waits for every promise to settle and reports each outcome as an object: { status: 'fulfilled', value } or { status: 'rejected', reason }, in the original input order."
  });

  reg({
    id: 'async-try-catch-await-rejection',
    category: 'js-async', difficulty: 'easy', type: 'predict-output',
    prompt: 'In what order does this log?',
    code: "async function f() {\n  try {\n    await Promise.reject(new Error('boom'));\n  } catch (err) {\n    console.log('caught:', err.message);\n  }\n}\nf();\nconsole.log('sync');",
    answer: "sync\ncaught: boom",
    explanation: "await always suspends and resumes as a microtask, even for an already-rejected promise — so a normal try/catch around await correctly catches the rejection as if it were a thrown exception, but only after the synchronous 'sync' log finishes first."
  });

  reg({
    id: 'async-await-in-for-loop-sequential',
    category: 'js-async', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log, and in what order?',
    code: "function delay(ms, value) {\n  return new Promise(function (resolve) {\n    setTimeout(function () { console.log('resolve', value); resolve(value); }, ms);\n  });\n}\nasync function run() {\n  for (const v of ['a', 'b', 'c']) {\n    const result = await delay(2, v);\n    console.log('got', result);\n  }\n  console.log('done');\n}\nrun();",
    answer: "resolve a\ngot a\nresolve b\ngot b\nresolve c\ngot c\ndone",
    explanation: "await inside a for-of loop makes each iteration wait for the previous one to fully resolve before starting the next. Each delay() call only fires its setTimeout AFTER the prior iteration's promise has resolved and logged 'got', so the three tasks run strictly one after another rather than concurrently."
  });

  reg({
    id: 'async-sequential-vs-parallel-await',
    category: 'js-async', difficulty: 'hard', type: 'predict-output',
    prompt: 'One of these finishes before the other. What logs, and in what order?',
    code: "function task(id, ms) {\n  return new Promise(function (resolve) {\n    setTimeout(function () { resolve(id); }, ms);\n  });\n}\nasync function sequential() {\n  var a = await task('A', 3);\n  var b = await task('B', 3);\n  console.log('sequential:', a, b);\n}\nasync function parallel() {\n  var results = await Promise.all([task('C', 3), task('D', 3)]);\n  console.log('parallel:', results[0], results[1]);\n}\nsequential();\nparallel();\nconsole.log('sync end');",
    answer: "sync end\nparallel: C D\nsequential: A B",
    explanation: "sequential() awaits task('A') then task('B') one after another, so it takes roughly 3ms + 3ms. parallel() starts both task('C') and task('D') at the same time via Promise.all, so it only takes roughly 3ms total. Both async functions start running synchronously (logging nothing before their first await), 'sync end' logs immediately after, and then parallel's shorter total wait means it finishes and logs before sequential does."
  });

  reg({
    id: 'async-queuemicrotask-vs-promise-vs-timeout',
    category: 'js-async', difficulty: 'medium', type: 'predict-output',
    prompt: 'In what order does this log?',
    code: "console.log('1');\nsetTimeout(function () { console.log('2'); }, 0);\nqueueMicrotask(function () { console.log('3'); });\nPromise.resolve().then(function () { console.log('4'); });\nqueueMicrotask(function () { console.log('5'); });\nconsole.log('6');",
    answer: "1\n6\n3\n4\n5\n2",
    explanation: "queueMicrotask() callbacks and Promise .then() callbacks share the SAME microtask queue and run in the order they were queued (FIFO): 3, then 4, then 5. All of that happens after the synchronous code (1, 6) and before the setTimeout macrotask (2)."
  });

  reg({
    id: 'async-then-returning-promise-flattens',
    category: 'js-async', difficulty: 'medium', type: 'predict-output',
    prompt: 'In what order does this log?',
    code: "var innerPromise = new Promise(function (resolve) {\n  setTimeout(function () { resolve('inner'); }, 2);\n});\nconsole.log('start');\nPromise.resolve('outer').then(function (v) {\n  console.log('then1', v);\n  return innerPromise;\n}).then(function (v) {\n  console.log('then2', v);\n});\nconsole.log('end');",
    answer: "start\nend\nthen1 outer\nthen2 inner",
    explanation: "Returning a Promise (innerPromise) from inside a .then() handler flattens it into the chain — the next .then() doesn't fire right away but waits for that returned Promise to settle. Since innerPromise only resolves via a setTimeout (a macrotask), 'then2' has to wait for that timer to fire, arriving after 'then1'."
  });

  reg({
    id: 'async-error-propagates-past-then-to-catch',
    category: 'js-async', difficulty: 'hard', type: 'predict-output',
    prompt: 'What does this log, and in what order?',
    code: "Promise.resolve()\n  .then(function () {\n    console.log('step1');\n    throw new Error('fail in step1');\n  })\n  .then(function () {\n    console.log('step2 (skipped)');\n  })\n  .catch(function (err) {\n    console.log('caught:', err.message);\n  })\n  .then(function () {\n    console.log('step3');\n  });",
    answer: "step1\ncaught: fail in step1\nstep3",
    explanation: "Throwing inside a .then() handler rejects the chain from that point on. The rejection skips over any following .then() handlers (so 'step2' never logs) until it reaches the nearest .catch(), which handles it and returns a normal (fulfilled) promise — letting the chain continue normally into the final .then() and log 'step3'."
  });

  reg({
    id: 'async-then-missing-return-spot-bug',
    category: 'js-async', difficulty: 'hard', type: 'spot-the-bug',
    prompt: 'This is supposed to log the user’s posts, but it logs undefined instead. Find the bug.',
    code: "function fetchUser(id) {\n  return Promise.resolve({ id: id, name: 'Ada' });\n}\nfunction fetchPosts(user) {\n  return new Promise(function (resolve) {\n    setTimeout(function () { resolve(['post1', 'post2']); }, 2);\n  });\n}\n\nfetchUser(1)\n  .then(function (user) {\n    // BUG: forgot to return the inner promise\n    fetchPosts(user);\n  })\n  .then(function (posts) {\n    console.log(posts); // logs undefined instead of waiting for ['post1', 'post2']\n  });",
    answer: "fetchUser(1)\n  .then(function (user) {\n    return fetchPosts(user);\n  })\n  .then(function (posts) {\n    console.log(posts);\n  });",
    explanation: "When a .then() callback doesn't return the promise it starts, the chain doesn't wait for it — the callback implicitly returns undefined, so the next .then() runs immediately with undefined instead of the eventual posts array. Returning fetchPosts(user) flattens that inner promise into the chain so the next handler correctly receives its resolved value."
  });

  reg({
    id: 'async-foreach-doesnt-await-spot-bug',
    category: 'js-async', difficulty: 'hard', type: 'spot-the-bug',
    prompt: 'This is supposed to wait for all items to load before logging the results, but it logs an empty array. Find the bug.',
    code: "function fetchData(id) {\n  return new Promise(function (resolve) {\n    setTimeout(function () { resolve('data' + id); }, 2);\n  });\n}\n\nasync function processAll(ids) {\n  var results = [];\n  ids.forEach(async function (id) {\n    var data = await fetchData(id);\n    results.push(data);\n  });\n  console.log('done, results:', results); // logs done, results: [] — forEach doesn't wait\n  return results;\n}\n\nprocessAll([1, 2, 3]);",
    answer: "async function processAll(ids) {\n  var results = await Promise.all(ids.map(function (id) { return fetchData(id); }));\n  console.log('done, results:', results);\n  return results;\n}",
    explanation: "Array.prototype.forEach() completely ignores the return value of its callback and never awaits anything — it fires all three async callbacks and moves on immediately, so processAll() reaches console.log() before any fetchData() call has resolved, printing an empty array. Use map() to create an array of promises and await Promise.all() on it (or a for...of loop with await) to actually wait for every item."
  });

  reg({
    id: 'async-missing-await-spot-bug',
    category: 'js-async', difficulty: 'medium', type: 'spot-the-bug',
    prompt: 'This throws a TypeError at runtime. Find the bug.',
    code: "function fetchItems(cartId) {\n  return Promise.resolve([{ price: 10 }, { price: 20 }]);\n}\n\nasync function getTotal(cartId) {\n  // BUG: missing await\n  var items = fetchItems(cartId);\n  return items.reduce(function (sum, item) { return sum + item.price; }, 0);\n}\n\ngetTotal(1).then(function (total) { console.log(total); });\n// throws: TypeError: items.reduce is not a function — items is a Promise, not an array",
    answer: "async function getTotal(cartId) {\n  var items = await fetchItems(cartId);\n  return items.reduce(function (sum, item) { return sum + item.price; }, 0);\n}",
    explanation: "fetchItems() returns a Promise. Without await, `items` IS that Promise object, not the resolved array inside it, so calling .reduce() on it throws a TypeError. Adding await unwraps the resolved value before array methods are used on it."
  });

  reg({
    id: 'async-await-outside-async-function-spot-bug',
    category: 'js-async', difficulty: 'easy', type: 'spot-the-bug',
    prompt: 'This code fails to even run — find the bug.',
    code: "function loadConfig(path) {\n  // BUG: `await` used inside a function that isn't declared `async`\n  var data = await fetch(path);\n  return data;\n}\n// SyntaxError: await is only valid in async functions and the top level bodies of modules",
    answer: "async function loadConfig(path) {\n  var data = await fetch(path);\n  return data;\n}",
    explanation: "`await` is only legal inside a function declared with the `async` keyword (or at the top level of an ES module). Using it in an ordinary function is a SyntaxError caught when the file is parsed, before anything even executes — the fix is simply marking the function `async`."
  });

  reg({
    id: 'async-unhandled-rejection-spot-bug',
    category: 'js-async', difficulty: 'medium', type: 'spot-the-bug',
    prompt: 'This code is supposed to gracefully report a failure, but instead it produces an unhandled promise rejection. Find the bug.',
    code: "function fetchUser(id) {\n  return Promise.reject(new Error('user not found'));\n}\n\nasync function loadProfile(id) {\n  const user = await fetchUser(id);\n  console.log('welcome,', user.name);\n}\n\n// BUG: loadProfile() returns a Promise that rejects, but nothing\n// ever attaches a .catch() (or awaits it inside a try/catch).\nloadProfile(1);\nconsole.log('rendering page...');",
    answer: "async function loadProfile(id) {\n  const user = await fetchUser(id);\n  console.log('welcome,', user.name);\n}\n\nloadProfile(1).catch(function (err) {\n  console.log('failed to load profile:', err.message);\n});\nconsole.log('rendering page...');",
    explanation: "An async function always returns a Promise, and if that Promise rejects (here because fetchUser() rejects and the await re-throws inside loadProfile()) with no .catch() attached and no surrounding try/catch, it becomes an UNHANDLED REJECTION. In browsers, this fires a global 'unhandledrejection' event and logs an uncaught error to the console; in modern Node.js, an unhandled rejection prints a warning/stack trace and, since Node 15, crashes the process with a non-zero exit code by default. The fix is to either attach a .catch() to the returned promise (as shown) or wrap the await in a try/catch inside an async caller that itself is awaited or caught."
  });
})();
