/* Practice challenges — Hoisting & TDZ */
(function () {
  var reg = window.PREP_SITE.registerChallenge;

  reg({
    id: 'hoist-var-hoisted-undefined',
    category: 'js-hoisting-tdz', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "console.log(x);\nvar x = 5;\nconsole.log(x);",
    answer: "undefined\n5",
    explanation: "`var` declarations are hoisted to the top of their enclosing function/global scope and initialized with `undefined` — only the ASSIGNMENT stays where it's written. So reading `x` before the `var x = 5;` line doesn't throw; it simply reads the not-yet-assigned value, `undefined`. Once the assignment line runs, `x` becomes 5."
  });

  reg({
    id: 'hoist-function-declaration-hoisted',
    category: 'js-hoisting-tdz', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "console.log(greet());\n\nfunction greet() {\n  return 'hello';\n}",
    answer: "hello",
    explanation: "Function DECLARATIONS are hoisted completely — not just the name, but the entire function body/value is available from the top of the scope. That's why `greet()` can be called before the `function greet() {...}` line is textually reached; it's already fully defined by the time execution starts."
  });

  reg({
    id: 'hoist-let-tdz-block-shadow',
    category: 'js-hoisting-tdz', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "let x = 'outer';\nconsole.log('start', x);\n{\n  console.log('inner', x);\n  let x = 'inner';\n}",
    answer: "start outer\nReferenceError: Cannot access 'x' before initialization",
    explanation: "Hoisting isn't only function-scoped — every block gets its own hoisting pass too. The inner `let x` is hoisted to the top of the `{ }` block and shadows the outer `x` for the WHOLE block, placing it in the Temporal Dead Zone from the block's very first line. So `console.log('inner', x)` does not fall back to the outer 'outer' value — it fails because the block's own `x` hasn't been initialized yet."
  });

  reg({
    id: 'hoist-const-before-declaration-bug',
    category: 'js-hoisting-tdz', difficulty: 'medium', type: 'spot-the-bug',
    prompt: 'getConfig() is supposed to log a loading message and return the config, but it throws instead. Find the bug.',
    code: "function getConfig() {\n  console.log('loading config for', env); // BUG: env is read before its declaration\n  const env = 'production';\n  return env;\n}\n\ngetConfig(); // expected 'loading config for production', throws ReferenceError instead",
    answer: "function getConfig() {\n  const env = 'production'; // declare (and assign) BEFORE any use\n  console.log('loading config for', env);\n  return env;\n}\n\ngetConfig();",
    explanation: "`const` (like `let`) is hoisted to the top of its scope but stays in the Temporal Dead Zone until its declaration line actually executes. Reading `env` on the line before `const env = 'production';` runs throws `ReferenceError: Cannot access 'env' before initialization` — it does NOT quietly read as `undefined` the way a hoisted `var` would. The fix is to move the declaration above any code that reads it."
  });

  reg({
    id: 'hoist-function-expression-not-hoisted',
    category: 'js-hoisting-tdz', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "console.log(typeof sayHi);\nsayHi();\n\nvar sayHi = function () {\n  console.log('hi');\n};",
    answer: "undefined\nTypeError: sayHi is not a function",
    explanation: "Only the `var sayHi` declaration is hoisted — the function VALUE isn't assigned until the `= function () {...}` line actually runs. Before that, `sayHi` behaves like any other hoisted `var` and holds `undefined`, so `typeof sayHi` is 'undefined' and calling `sayHi()` throws `TypeError: sayHi is not a function` (it's a call-on-undefined error, not a ReferenceError, since the identifier itself does exist)."
  });

  reg({
    id: 'hoist-typeof-tdz-vs-undeclared',
    category: 'js-hoisting-tdz', difficulty: 'hard', type: 'predict-output',
    prompt: 'What does this log?',
    code: "console.log(typeof totallyUndeclaredThing);\nconsole.log(typeof value);\nlet value = 5;",
    answer: "undefined\nReferenceError: Cannot access 'value' before initialization",
    explanation: "`typeof` on an identifier that was NEVER declared anywhere is always safe and returns 'undefined' — this is the one case where probing an unknown name doesn't throw. But `value` here IS declared (with `let`, later in the same scope) — it's just still in its Temporal Dead Zone. `typeof` gets no special exemption for TDZ bindings: it throws the exact same `ReferenceError` a plain read of `value` would."
  });

  reg({
    id: 'hoist-function-var-precedence-bug',
    category: 'js-hoisting-tdz', difficulty: 'medium', type: 'spot-the-bug',
    prompt: 'greet() is expected to keep returning its greeting after setup runs, but the second call blows up. Find the bug.',
    code: "function greet() {\n  return 'Hello from function';\n}\n\nconsole.log(greet()); // logs 'Hello from function'\n\nvar greet = 'not a function anymore'; // BUG: reassigns the same name the function uses\n\nconsole.log(greet()); // expected 'Hello from function' again, throws TypeError instead",
    answer: "function greet() {\n  return 'Hello from function';\n}\n\nconsole.log(greet());\n\nvar greetingLabel = 'not a function anymore'; // renamed — no longer collides with greet\n\nconsole.log(greet());",
    explanation: "During hoisting, a function declaration's binding wins over a plain `var` of the same name — that's why the FIRST `greet()` call still works even though a `var greet` appears later in the file. But that only protects the initial hoisted value: once execution actually reaches `var greet = 'not a function anymore';`, the assignment runs and overwrites the binding with a string, permanently clobbering the function. The fix is to not reuse the function's name for an unrelated variable."
  });

  reg({
    id: 'hoist-default-param-tdz',
    category: 'js-hoisting-tdz', difficulty: 'hard', type: 'predict-output',
    prompt: 'What does this log?',
    code: "function greet(a = b, b = 2) {\n  return a;\n}\n\nconsole.log(greet());",
    answer: "ReferenceError: Cannot access 'b' before initialization",
    explanation: "Default parameters are evaluated left to right, and each parameter is its own binding sitting in the Temporal Dead Zone until its default is evaluated (or an argument is supplied). `a`'s default (`= b`) runs first and tries to read `b`, but `b` hasn't been initialized yet — its own default hasn't run — so it throws the same TDZ error a `let`/`const` would. Reordering the parameters to `(b = 2, a = b)` would fix it."
  });
})();
