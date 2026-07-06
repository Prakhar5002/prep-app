/* Practice challenges — Closures & Scope */
(function () {
  var reg = window.PREP_SITE.registerChallenge;

  reg({
    id: 'clo-var-settimeout-loop',
    category: 'js-closures-scope', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "for (var i = 0; i < 3; i++) {\n  setTimeout(function () { console.log(i); }, 0);\n}",
    answer: "3\n3\n3",
    explanation: "var is function/global-scoped, not block-scoped, so all three callbacks close over the SAME `i` binding. The loop finishes (i becomes 3) before any timer fires, so every callback reads the final value: 3, 3, 3."
  });

  reg({
    id: 'clo-let-settimeout-loop',
    category: 'js-closures-scope', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "for (let i = 0; i < 3; i++) {\n  setTimeout(function () { console.log(i); }, 0);\n}",
    answer: "0\n1\n2",
    explanation: "let is block-scoped: each iteration of a `let` for-loop gets its OWN fresh binding of `i`. Each callback closes over its iteration's private copy, so the timers log 0, 1, 2 in order."
  });

  reg({
    id: 'clo-iife-capture-fix',
    category: 'js-closures-scope', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "for (var i = 0; i < 3; i++) {\n  (function (i) {\n    setTimeout(function () { console.log(i); }, 0);\n  })(i);\n}",
    answer: "0\n1\n2",
    explanation: "This is the pre-`let` fix for the classic var/setTimeout bug: the IIFE is invoked immediately each iteration with the CURRENT value of the outer `i`, creating a new parameter `i` per call. Each setTimeout callback then closes over its own IIFE's parameter, so the values 0, 1, 2 are preserved."
  });

  reg({
    id: 'clo-counter-factory',
    category: 'js-closures-scope', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "function createCounter() {\n  var count = 0;\n  return function () {\n    count += 1;\n    return count;\n  };\n}\n\nvar counterA = createCounter();\nvar counterB = createCounter();\n\nconsole.log(counterA());\nconsole.log(counterA());\nconsole.log(counterB());\nconsole.log(counterA());",
    answer: "1\n2\n1\n3",
    explanation: "Each call to createCounter() creates a brand-new `count` variable and a brand-new closure over it. counterA and counterB are independent factory instances with their own private state, so counterB starting at 1 doesn't affect counterA's running total of 3."
  });

  reg({
    id: 'clo-spot-bug-shared-counter',
    category: 'js-closures-scope', difficulty: 'hard', type: 'spot-the-bug',
    prompt: 'Each call to createCounter() is supposed to return an independent counter, but they all share state. Find the bug.',
    code: "var count = 0; // BUG: lives outside the factory\nfunction createCounter() {\n  return function () {\n    count += 1;\n    return count;\n  };\n}\n\nvar counterA = createCounter();\nvar counterB = createCounter();\n\nconsole.log(counterA()); // expected 1\nconsole.log(counterB()); // expected 1 (independent), logs 2\nconsole.log(counterA()); // expected 2, logs 3",
    answer: "function createCounter() {\n  var count = 0; // moved inside: a fresh binding per call\n  return function () {\n    count += 1;\n    return count;\n  };\n}",
    explanation: "`count` was declared in the outer/module scope instead of inside createCounter(), so every returned function closes over the SAME single variable instead of getting its own private copy. Moving the declaration inside the factory function gives each call its own closure and its own independent counter."
  });

  reg({
    id: 'clo-stale-closure-reassign',
    category: 'js-closures-scope', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "function makeLogger() {\n  var message = 'hello';\n  var logIt = function () { console.log(message); };\n  message = 'world';\n  return logIt;\n}\n\nvar log = makeLogger();\nlog();",
    answer: "world",
    explanation: "A closure captures a LIVE BINDING (a reference to the variable), not a snapshot of its value at creation time. `message` is reassigned to 'world' before `logIt` is ever called, so when `log()` finally runs, it reads the current value of `message`, which is 'world'."
  });

  reg({
    id: 'clo-event-handler-loop-index',
    category: 'js-closures-scope', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var handlers = [];\nfor (let i = 0; i < 3; i++) {\n  handlers.push(function () { console.log('handler', i); });\n}\nhandlers.forEach(function (h) { h(); });",
    answer: "handler 0\nhandler 1\nhandler 2",
    explanation: "This is the pattern behind attaching click handlers in a loop (e.g. one per list item). Because the loop uses `let`, each pushed function closes over its own per-iteration `i`, so invoking the handlers later still reports the correct index each was created with — 0, 1, 2 — instead of whatever `i` ended up being."
  });

  reg({
    id: 'clo-block-scope-let-const',
    category: 'js-closures-scope', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "let x = 'outer';\n{\n  let x = 'inner';\n  console.log(x);\n}\nconsole.log(x);\n\nif (true) {\n  var y = 'var-leaks';\n}\nconsole.log(y);",
    answer: "inner\nouter\nvar-leaks",
    explanation: "`let` is scoped to the nearest enclosing block ({ }), so the inner `let x` shadows the outer one only within that block and the outer `x` is untouched afterward. `var`, in contrast, ignores block boundaries entirely and attaches to the nearest function/global scope, so `y` declared inside the `if` block is visible outside it too."
  });

  reg({
    id: 'clo-tdz-in-closure',
    category: 'js-closures-scope', difficulty: 'hard', type: 'predict-output',
    prompt: 'What does this log?',
    code: "function makeReader() {\n  var read = function () { return count; };\n  let count = 5;\n  return read;\n}\n\nvar reader = makeReader();\nconsole.log(reader());\n\nfunction tryEarly() {\n  console.log(typeof value);\n  let value = 10;\n}\n\ntry {\n  tryEarly();\n} catch (e) {\n  console.log(e.name);\n}",
    answer: "5\nReferenceError",
    explanation: "In makeReader(), `read` closes over `count`, but by the time `reader()` is actually called, `let count = 5;` has already run inside makeReader — the Temporal Dead Zone (see the hoisting/TDZ task) only bites if you access the binding BEFORE its declaration executes, and here it doesn't. In tryEarly(), though, `value` is accessed while still in its TDZ; unlike an undeclared variable (where `typeof` is safely 'undefined'), `typeof` on a TDZ `let`/`const` binding throws a ReferenceError."
  });

  reg({
    id: 'clo-function-accumulator',
    category: 'js-closures-scope', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "function makeAdder() {\n  var total = 0;\n  return function (n) {\n    total += n;\n    return total;\n  };\n}\n\nvar add = makeAdder();\nconsole.log(add(5));\nconsole.log(add(10));\nconsole.log(add(-3));",
    answer: "5\n15\n12",
    explanation: "makeAdder() returns a function that closes over `total` and mutates it on every call, so the running total persists across calls: 0+5=5, 5+10=15, 15-3=12. This is the same private-state pattern as the counter factory, generalized to accept an argument."
  });

  reg({
    id: 'clo-memoize-closure',
    category: 'js-closures-scope', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "function memoize(fn) {\n  var cache = {};\n  return function (n) {\n    if (cache.hasOwnProperty(n)) {\n      console.log('cache hit', n);\n      return cache[n];\n    }\n    console.log('computing', n);\n    var result = fn(n);\n    cache[n] = result;\n    return result;\n  };\n}\n\nvar square = memoize(function (n) { return n * n; });\n\nconsole.log(square(4));\nconsole.log(square(4));\nconsole.log(square(5));",
    answer: "computing 4\n16\ncache hit 4\n16\ncomputing 5\n25",
    explanation: "The function returned by memoize() closes over a single `cache` object that persists across every call. The first square(4) is a cache miss (logs 'computing 4', computes 16). The second square(4) is a cache hit (logs 'cache hit 4', returns the stored 16 without recomputing). square(5) is a new input, so it's a fresh miss."
  });

  reg({
    id: 'clo-this-lexical-arrow',
    category: 'js-closures-scope', difficulty: 'hard', type: 'predict-output',
    prompt: 'What does this log?',
    code: "function Timer() {\n  this.seconds = 0;\n  setTimeout(function () {\n    this.seconds += 1;\n    console.log(this.seconds);\n  }, 0);\n}\nnew Timer();\n\nfunction ArrowTimer() {\n  this.seconds = 0;\n  setTimeout(() => {\n    this.seconds += 1;\n    console.log(this.seconds);\n  }, 0);\n}\nnew ArrowTimer();",
    answer: "NaN\n1",
    explanation: "Unlike variables, `this` is NOT closed over by a regular function — its value depends on how that function is CALLED. setTimeout invokes the plain callback with no receiver, so inside it `this` is the global object, not the Timer instance; `this.seconds` is undefined there, and undefined + 1 is NaN (see the `this`/binding task for the full rules). An arrow function has no `this` of its own — it lexically inherits `this` from ArrowTimer's constructor call, so `this.seconds` correctly refers to the new instance's property and increments to 1."
  });

  reg({
    id: 'clo-module-pattern',
    category: 'js-closures-scope', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var Counter = (function () {\n  var count = 0;\n  function increment() { count += 1; return count; }\n  function reset() { count = 0; return count; }\n  return { increment: increment, reset: reset };\n})();\n\nconsole.log(Counter.increment());\nconsole.log(Counter.increment());\nconsole.log(Counter.reset());\nconsole.log(Counter.count);",
    answer: "1\n2\n0\nundefined",
    explanation: "The classic module pattern: an IIFE runs once and returns only the public API (increment/reset), while `count` stays trapped in the closure as private state. There is no `Counter.count` property at all — accessing it from outside gives undefined, proving the variable is truly encapsulated, not just hidden by convention."
  });

  reg({
    id: 'clo-spot-bug-var-loop-handlers',
    category: 'js-closures-scope', difficulty: 'medium', type: 'spot-the-bug',
    prompt: 'Each handler is supposed to log the button index it was created for, but they all report the same wrong number. Find the bug.',
    code: "function createHandlers() {\n  var handlers = [];\n  for (var i = 0; i < 3; i++) {\n    handlers.push(function () {\n      console.log('clicked button', i);\n    });\n  }\n  return handlers;\n}\n\nvar handlers = createHandlers();\nhandlers[0](); // expected 'clicked button 0', logs 'clicked button 3'\nhandlers[1](); // expected 'clicked button 1', logs 'clicked button 3'\nhandlers[2](); // expected 'clicked button 2', logs 'clicked button 3'",
    answer: "function createHandlers() {\n  var handlers = [];\n  for (let i = 0; i < 3; i++) {\n    handlers.push(function () {\n      console.log('clicked button', i);\n    });\n  }\n  return handlers;\n}",
    explanation: "`var` creates one shared binding for the whole loop, so every pushed closure references the same `i`, which is 3 by the time the loop finishes and any handler actually runs. Switching to `let` gives each iteration its own `i`, so each handler correctly remembers the index it was created with."
  });

  reg({
    id: 'clo-spot-bug-recreate-memo-loses-cache',
    category: 'js-closures-scope', difficulty: 'hard', type: 'spot-the-bug',
    prompt: 'This price lookup is supposed to be cached so repeated renders for the same id only compute once, but the cache never seems to help. Find the bug.',
    code: "function memoize(fn) {\n  var cache = {};\n  return function (n) {\n    if (cache.hasOwnProperty(n)) return cache[n];\n    var result = fn(n);\n    cache[n] = result;\n    return result;\n  };\n}\n\nvar calls = 0;\nfunction lookupPrice(id) { calls += 1; return id * 100; }\n\nfunction renderPrice(id) {\n  // BUG: memoize() (and its private `cache`) is recreated on every render call\n  var getPrice = memoize(function (id) { return lookupPrice(id); });\n  return getPrice(id);\n}\n\nrenderPrice(7);\nrenderPrice(7);\nrenderPrice(7);\nconsole.log(calls); // expected 1 (cached after first render), logs 3",
    answer: "var getPrice = memoize(function (id) { return lookupPrice(id); }); // created ONCE, outside\nfunction renderPrice(id) {\n  return getPrice(id);\n}",
    explanation: "memoize(fn) is called fresh inside renderPrice() every single time, so a brand-new `cache` closure is created — and thrown away — on every render; nothing ever survives to be reused. The fix is to create the memoized function ONCE, outside renderPrice, so its closure over `cache` persists across every call and actually gets to serve cache hits."
  });
})();
