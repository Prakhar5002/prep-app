/* Practice challenges — this & Binding */
(function () {
  var reg = window.PREP_SITE.registerChallenge;

  reg({
    id: 'this-method-call-vs-detached',
    category: 'js-this', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var obj = {\n  label: 'Ann',\n  greet: function () { return this.label; }\n};\nconsole.log(obj.greet());\nvar f = obj.greet;\nconsole.log(f());",
    answer: "Ann\nundefined",
    explanation: "`this` is determined by HOW a function is called, not where it's defined. obj.greet() calls it as a method, so `this` is `obj` and this.label is 'Ann'. Once detached into `f`, calling f() is a plain function call — `this` is no longer `obj`, so this.label reads a missing property and gives undefined."
  });

  reg({
    id: 'this-plain-function-global',
    category: 'js-this', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "function whoAmI() {\n  console.log(typeof this);\n  console.log(this === globalThis);\n  console.log(this.missingProp);\n}\nwhoAmI();",
    answer: "object\ntrue\nundefined",
    explanation: "In non-strict mode, a plain function call with no receiver doesn't leave `this` as undefined — it defaults to the global object (here, `globalThis`), which is why `typeof this` is 'object' and `this === globalThis` is true. Reading a property that was never set on that object (missingProp) simply gives undefined, same as any object."
  });

  reg({
    id: 'this-strict-plain-function',
    category: 'js-this', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "function whoAmI() {\n  'use strict';\n  console.log(typeof this);\n  console.log(this === undefined);\n}\nwhoAmI();",
    answer: "undefined\ntrue",
    explanation: "Putting 'use strict' inside a function body switches ONLY that function to strict mode. In strict mode, a plain function call with no receiver leaves `this` exactly as `undefined` — it does NOT fall back to the global object the way the non-strict case above does. That's why typeof this is 'undefined' and this === undefined is true, in direct contrast to this-plain-function-global's globalThis result for the same no-receiver call pattern."
  });

  reg({
    id: 'this-arrow-lexical',
    category: 'js-this', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var obj = {\n  name: 'Lex',\n  regular: function () {\n    var arrow = () => console.log(this.name);\n    arrow();\n  }\n};\nobj.regular();",
    answer: "Lex",
    explanation: "Arrow functions don't have their own `this` — they capture it lexically from the enclosing scope at definition time. `arrow` is defined inside `regular`, where `this` is `obj` (because regular() was called as obj.regular()), so the arrow sees the same `this` and this.name is 'Lex'."
  });

  reg({
    id: 'this-call-apply',
    category: 'js-this', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "function introduce(greeting, punctuation) {\n  return greeting + ', ' + this.name + punctuation;\n}\nvar user = { name: 'Sam' };\nconsole.log(introduce.call(user, 'Hello', '!'));\nconsole.log(introduce.apply(user, ['Hi', '?']));",
    answer: "Hello, Sam!\nHi, Sam?",
    explanation: "call() and apply() both invoke the function immediately with an explicit `this` (here, `user`); they only differ in how the remaining arguments are passed — call() takes them individually (call(thisArg, a, b)), apply() takes them as a single array (apply(thisArg, [a, b]))."
  });

  reg({
    id: 'this-bind-permanent',
    category: 'js-this', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "function show() { return this.id; }\nvar a = { id: 'A' };\nvar b = { id: 'B' };\nvar boundA = show.bind(a);\nconsole.log(boundA());\nvar boundAgain = boundA.bind(b);\nconsole.log(boundAgain());\nconsole.log(boundA.call(b));",
    answer: "A\nA\nA",
    explanation: "bind() returns a new function whose `this` is permanently locked to the argument given — here `a`. Once bound, NOTHING can override that binding: calling .bind(b) on the already-bound function just wraps it again (still reporting 'A'), and even an explicit .call(b) is ignored. Only the first bind() ever counts."
  });

  reg({
    id: 'this-new-binding',
    category: 'js-this', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "function Person(name) {\n  this.name = name;\n}\nPerson.prototype.greet = function () { return 'Hi, ' + this.name; };\nvar p = new Person('Rae');\nconsole.log(p.greet());\nconsole.log(p instanceof Person);",
    answer: "Hi, Rae\ntrue",
    explanation: "The `new` keyword creates a brand-new object, binds `this` to it for the duration of the constructor call, and returns that object (since Person doesn't explicitly return an object of its own). So this.name = name sets the property on the new instance, greet() sees the same instance as `this`, and p is indeed a Person."
  });

  reg({
    id: 'this-settimeout-callback',
    category: 'js-this', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var timer = {\n  label: 'Timer',\n  startRegular: function () {\n    setTimeout(function () {\n      console.log('regular:', this && this.label);\n    }, 0);\n  },\n  startArrow: function () {\n    setTimeout(() => {\n      console.log('arrow:', this.label);\n    }, 0);\n  }\n};\ntimer.startRegular();\ntimer.startArrow();",
    answer: "regular: undefined\narrow: Timer",
    explanation: "setTimeout always invokes its callback as a plain function call, with no receiver — so a regular `function` callback loses whatever `this` its surrounding method had, and this.label is undefined. An arrow function callback has no `this` of its own; it keeps the lexical `this` from startArrow (which was called as timer.startArrow(), so `this` is `timer`), so this.label correctly reads 'Timer'."
  });

  reg({
    id: 'this-array-thisarg',
    category: 'js-this', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var total = { sum: 0 };\n[1, 2, 3].forEach(function (n) {\n  this.sum += n;\n}, total);\nconsole.log(total.sum);\n\nvar noThisArg = { sum: 0 };\n[1, 2, 3].forEach(function (n) {\n  noThisArg.sum += n;\n});\nconsole.log(noThisArg.sum);",
    answer: "6\n6",
    explanation: "forEach (like map, filter, some, every) accepts an optional second argument: a `thisArg` that becomes `this` inside the callback. Passing `total` there makes this.sum refer to total.sum, accumulating 6. The second call gets no thisArg, so it instead relies on the closure variable `noThisArg` directly — also arriving at 6, just via a different mechanism."
  });

  reg({
    id: 'this-spot-bug-detached-class-method',
    category: 'js-this', difficulty: 'hard', type: 'spot-the-bug',
    prompt: 'increment() is supposed to bump the counter and log it when used as a standalone handler, but calling it detached from the instance blows up. Find the bug.',
    code: "class Counter {\n  constructor() {\n    this.count = 0;\n  }\n  increment() {\n    this.count += 1;\n    console.log(this.count);\n  }\n}\n\nvar counter = new Counter();\nvar handler = counter.increment; // BUG: method detached from its instance, e.g. passed to addEventListener\nhandler(); // expected 1, throws \"Cannot read properties of undefined (reading 'count')\" instead",
    answer: "class Counter {\n  constructor() {\n    this.count = 0;\n    this.increment = this.increment.bind(this); // bind once, in the constructor\n  }\n  increment() {\n    this.count += 1;\n    console.log(this.count);\n  }\n}\nvar counter = new Counter();\nvar handler = counter.increment;\nhandler(); // logs 1",
    explanation: "Class method bodies are always strict mode, so a detached method called as a plain function (handler()) gets `this === undefined` — it does NOT fall back to the global object the way an ordinary non-strict function would. So this.count throws immediately. The fix is to bind the method to the instance once (commonly in the constructor, or by using a class field arrow function) so it carries its `this` wherever it's passed."
  });

  reg({
    id: 'this-spot-bug-arrow-method',
    category: 'js-this', difficulty: 'hard', type: 'spot-the-bug',
    prompt: 'increment() is supposed to bump counter.count on every call, but it never updates the object and produces a strange value. Find the bug.',
    code: "var counter = {\n  count: 0,\n  increment: () => { // BUG: arrow function used as an object method\n    this.count += 1;\n    console.log(this.count);\n  }\n};\ncounter.increment(); // expected 1, logs NaN instead",
    answer: "var counter = {\n  count: 0,\n  increment: function () { // regular function: `this` is bound at call time\n    this.count += 1;\n    console.log(this.count);\n  }\n};\ncounter.increment(); // logs 1",
    explanation: "Arrow functions ignore the caller entirely and use the `this` captured from their surrounding (lexical) scope — here, that's whatever `this` was outside the object literal, NOT `counter`. So this.count reads undefined off the wrong object, undefined + 1 is NaN, and the assignment writes `count` onto that wrong object instead of onto `counter`. Object methods that need a dynamic, call-site `this` must be regular `function` expressions (or shorthand methods), never arrows."
  });
})();
