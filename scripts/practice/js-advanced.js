/* Practice challenges — Advanced (Proxy/Symbol/GC/Iterators) */
(function () {
  var reg = window.PREP_SITE.registerChallenge;

  reg({
    id: 'adv-symbol-uniqueness',
    category: 'js-advanced', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var a = Symbol('x');\nvar b = Symbol('x');\nconsole.log(a === b);\nconsole.log(a.toString());\nconsole.log(typeof a);\nconsole.log(a);",
    answer: "false\nSymbol(x)\nsymbol\nSymbol(x)",
    explanation: "Every call to Symbol(...) creates a brand-new, completely unique primitive value, even when passed the same description string — the description is just a label for debugging, not an identifier. So a === b is false. typeof a is the dedicated 'symbol' primitive type, and both .toString() and console.log render it as 'Symbol(x)'."
  });

  reg({
    id: 'adv-symbol-keys-skipped',
    category: 'js-advanced', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var id = Symbol('id');\nvar user = { name: 'Ada', age: 30 };\nuser[id] = 42;\n\nconsole.log(Object.keys(user));\nconsole.log(JSON.stringify(user));\nconsole.log(Object.getOwnPropertySymbols(user).length);\nconsole.log(user[id]);",
    answer: "[ 'name', 'age' ]\n{\"name\":\"Ada\",\"age\":30}\n1\n42",
    explanation: "Symbol-keyed properties are intentionally invisible to the 'ordinary' enumeration APIs: Object.keys(), for...in, and JSON.stringify() all skip them entirely, so the id property never shows up in either the keys array or the serialized JSON. It hasn't disappeared, though — Object.getOwnPropertySymbols() reveals it (length 1), and the value is still directly readable via user[id]. This is how libraries attach 'hidden' metadata to objects without polluting the object's visible shape."
  });

  reg({
    id: 'adv-custom-iterable-spread',
    category: 'js-advanced', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var range = {\n  from: 1,\n  to: 3,\n  [Symbol.iterator]: function () {\n    var current = this.from;\n    var last = this.to;\n    return {\n      next: function () {\n        if (current <= last) {\n          return { value: current++, done: false };\n        }\n        return { value: undefined, done: true };\n      }\n    };\n  }\n};\n\nconsole.log([...range]);\nconsole.log(Array.from(range));\n\nvar it = range[Symbol.iterator]();\nconsole.log(it.next());\nconsole.log(it.next());\nconsole.log(it.next());\nconsole.log(it.next());",
    answer: "[ 1, 2, 3 ]\n[ 1, 2, 3 ]\n{ value: 1, done: false }\n{ value: 2, done: false }\n{ value: 3, done: false }\n{ value: undefined, done: true }",
    explanation: "Defining a [Symbol.iterator] method makes a plain object 'iterable' — anything that consumes the well-known iterator protocol (spread syntax, Array.from, for...of, destructuring) calls that method to get an iterator object, then repeatedly calls its .next() until done is true. Spread and Array.from each run their OWN independent iterator from scratch (a fresh `current` closure starting at 1), so both correctly produce [1, 2, 3]. Calling range[Symbol.iterator]() manually and driving .next() by hand shows the raw protocol underneath: three {value, done:false} steps followed by a final {value: undefined, done:true} that signals exhaustion."
  });

  reg({
    id: 'adv-generator-next-yield-value-passing',
    category: 'js-advanced', difficulty: 'hard', type: 'predict-output',
    prompt: 'What does this log?',
    code: "function* counter() {\n  var reset = yield 1;\n  if (reset) {\n    yield 100;\n  } else {\n    yield 2;\n  }\n  return 'done';\n}\n\nvar gen = counter();\nconsole.log(gen.next());\nconsole.log(gen.next(false));\nconsole.log(gen.next());",
    answer: "{ value: 1, done: false }\n{ value: 2, done: false }\n{ value: 'done', done: true }",
    explanation: "The FIRST gen.next() call just starts the generator running up to its first yield 1 — there's no paused yield expression yet, so any argument to this call would be discarded; it returns { value: 1, done: false }. The SECOND call, gen.next(false), resumes execution exactly at that paused 'yield 1' expression, substituting false in as its result, so `reset` becomes false — the else branch runs, hitting 'yield 2' and returning { value: 2, done: false }. The THIRD call resumes past that yield, runs the return 'done' statement, and — because a return exits the generator — reports done: true alongside the returned value."
  });

  reg({
    id: 'adv-weakmap-object-key-required',
    category: 'js-advanced', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var wm = new WeakMap();\nvar keyObj = {};\nvar keySym = Symbol('k');\n\nwm.set(keyObj, 'obj-value');\nwm.set(keySym, 'sym-value');\n\nconsole.log(wm.get(keyObj));\nconsole.log(wm.get(keySym));\nconsole.log(wm.has(keyObj));\n\ntry {\n  wm.set('plain-string', 'nope');\n} catch (err) {\n  console.log(err.name + ': ' + err.message);\n}",
    answer: "obj-value\nsym-value\ntrue\nTypeError: Invalid value used as weak map key",
    explanation: "WeakMap keys must be values the engine can hold a WEAK reference to and garbage-collect once nothing else points to them — that means ordinary objects work fine, and (per an ES2023 update) so do ordinary Symbol() values, since both are unique, non-interned, and collectible. Primitives like strings and numbers don't qualify: they're compared by value rather than identity and are commonly interned/cached by the engine, so they can never be safely 'weakly' collected — attempting wm.set('plain-string', ...) throws a TypeError instead of silently doing the wrong thing. This ES2023 symbol carve-out has a boundary, though: it only covers UNREGISTERED symbols like Symbol('k'). A REGISTERED symbol obtained via Symbol.for('k') is interned in the global symbol registry (keyed by that string, retrievable from anywhere), so it behaves like a string/number for this purpose and still throws a TypeError if used as a WeakMap key."
  });

  reg({
    id: 'adv-proxy-has-trap-bypass-spot-bug',
    category: 'js-advanced', difficulty: 'hard', type: 'spot-the-bug',
    prompt: 'This permission check is supposed to reject actions that were never granted, but every action passes. Find the bug.',
    code: "var allowedActions = { read: true, write: true };\n\nvar guardedActions = new Proxy(allowedActions, {\n  has: function (target, prop) {\n    // BUG: always reports the action as present, ignoring the real target\n    return true;\n  }\n});\n\nfunction isPermitted(action) {\n  return action in guardedActions;\n}\n\nconsole.log(isPermitted('read'));   // true — correct\nconsole.log(isPermitted('delete')); // should be false, but logs true — 'delete' was never granted!",
    answer: "var guardedActions = new Proxy(allowedActions, {\n  has: function (target, prop) {\n    return Reflect.has(target, prop); // delegate to the real target lookup\n  }\n});",
    explanation: "The `has` trap intercepts the `in` operator for every property check against the proxy, and this one unconditionally returns true no matter what `prop` is — so `action in guardedActions` reports EVERY action as granted, including ones that were never added to allowedActions. That's why isPermitted('delete') incorrectly returns true. The fix delegates the actual existence check back to the real target — Reflect.has(target, prop) (equivalent here to prop in target) — so the trap reflects the target's real own+inherited properties instead of rubber-stamping everything."
  });

  reg({
    id: 'adv-proxy-get-trap',
    category: 'js-advanced', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var withDefaults = new Proxy({ a: 1, b: 2 }, {\n  get: function (target, prop) {\n    if (prop in target) {\n      return target[prop];\n    }\n    return 'N/A';\n  }\n});\n\nconsole.log(withDefaults.a);\nconsole.log(withDefaults.b);\nconsole.log(withDefaults.c);\nconsole.log('c' in withDefaults);\nconsole.log(Object.keys(withDefaults));",
    answer: "1\n2\nN/A\nfalse\n[ 'a', 'b' ]",
    explanation: "The `get` trap intercepts every property READ on the proxy — both dot and bracket access — receiving (target, prop, receiver) and returning whatever value should stand in for that property. Here it checks whether prop actually exists on the real target: withDefaults.a and .b are real own properties, so the trap forwards to target[prop] and returns 1 and 2 unchanged. withDefaults.c has no matching key on the target, so the trap falls through to the 'N/A' default instead of undefined — this is the classic 'default value proxy' pattern. Note that only get is overridden here: no has trap was defined, so 'c' in withDefaults falls back to the proxy's default [[HasProperty]] behavior, which forwards straight to the real target and correctly reports false; likewise Object.keys(withDefaults) has no ownKeys trap to intercept it, so it reflects the target's real keys, [ 'a', 'b' ], not anything the get trap fabricates."
  });
})();
