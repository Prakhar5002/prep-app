/* Practice challenges — Modules (ESM vs CJS) */
(function () {
  var reg = window.PREP_SITE.registerChallenge;

  reg({
    id: 'mod-esm-live-binding-vs-cjs-copy',
    category: 'js-modules', difficulty: 'medium', type: 'predict-output',
    prompt: 'This models the difference between an ESM named import (a live binding) and a CommonJS destructured require (a one-time value copy). What does this log?',
    code: "var internal = { count: 1 };\n\n// Models `import { count } from './counter.js'`: a live binding — reading it\n// later re-reads whatever the source module's variable currently holds.\nvar esmImportedCount = {\n  get value() { return internal.count; }\n};\n\n// Models `const { count } = require('./counter')`: a plain value copy taken\n// once, at require-time — later changes to the source are invisible to it.\nvar cjsImportedCount = internal.count;\n\ninternal.count = 99; // the \"module\" changes its own exported value later\n\nconsole.log('ESM live binding sees:', esmImportedCount.value);\nconsole.log('CJS copied value sees:', cjsImportedCount);",
    answer: "ESM live binding sees: 99\nCJS copied value sees: 1",
    explanation: "A real `import { count } from './counter.js'` does not copy a value — it creates a live, read-only reference to the exporting module's binding, so if the source later reassigns `count`, every importer sees the new value on next read. A CommonJS `const { count } = require('./counter')` destructures the value ONCE, at require-time, into an ordinary local variable; later changes inside the required module are invisible to that copy. This snippet models the live binding with a getter (`esmImportedCount.value` always re-reads `internal.count`) and the CJS copy with a plain variable snapshotted before the mutation — hence 99 vs 1."
  });

  reg({
    id: 'mod-named-vs-default-export',
    category: 'js-modules', difficulty: 'easy', type: 'spot-the-bug',
    prompt: 'main.js is supposed to import the add function and the PI constant from mathUtils.js, but the import fails. Find the bug.',
    code: "// mathUtils.js\nexport default function add(a, b) { return a + b; }\nexport const PI = 3.14159;\n\n// main.js\nimport { add, PI } from './mathUtils.js';\n\nconsole.log(add(2, 3));\nconsole.log(PI);",
    answer: "// main.js\nimport add, { PI } from './mathUtils.js';\n\nconsole.log(add(2, 3));\nconsole.log(PI);",
    explanation: "`export default function add(...)` creates a single, special DEFAULT export — it does not also register a named export called `add`. Writing `import { add, PI } from './mathUtils.js'` asks for a named export literally called `add`, which doesn't exist, so native ESM throws a SyntaxError at module-link time (\"does not provide an export named 'add'\"); bundlers often surface this instead as `add` being `undefined` at call time. The fix is to import the default with the no-braces default-import syntax (`import add, { PI } from ...`), while `PI`, a real named export, stays inside the braces."
  });

  reg({
    id: 'mod-import-readonly-reassign',
    category: 'js-modules', difficulty: 'medium', type: 'spot-the-bug',
    prompt: 'main.js tries to keep its own copy of count in sync after calling increment(), but it crashes instead. Find the bug.',
    code: "// state.js\nexport let count = 0;\nexport function increment() { count += 1; }\n\n// main.js\nimport { count, increment } from './state.js';\n\nincrement();\ncount = count + 1; // trying to manually bump the local view too\nconsole.log(count);",
    answer: "// main.js\nimport { count, increment } from './state.js';\n\nincrement();\nconsole.log(count); // live binding already reflects the update, no reassignment needed",
    explanation: "Every imported binding is a read-only VIEW onto the exporting module's own variable — you may read `count`, but you may not assign to it from the importing side, even though `state.js` declared it with `let`. The line `count = count + 1;` throws `TypeError: Assignment to constant variable.` at runtime. The correct pattern is to let the exporting module own all writes (here, via `increment()`); because the import is a live binding, `console.log(count)` afterward already reflects the update automatically, with no local reassignment required or allowed."
  });

  reg({
    id: 'mod-import-hoisting',
    category: 'js-modules', difficulty: 'easy', type: 'predict-output',
    prompt: 'This models import hoisting using an ordinary hoisted function declaration standing in for a hoisted import. What does this log?',
    code: "console.log(triple(4)); // used one line above its \"declaration\", like a name used before its import statement\n\nfunction triple(n) { return n * 3; }",
    answer: "12",
    explanation: "Real `import` declarations are hoisted: the module loader resolves and fully evaluates every imported module and wires up its bindings BEFORE any of the importing module's own top-level statements run, so code positioned above an `import` line in the source can still use the imported name once the module actually executes. This snippet can't literally run an `import`, so it models the same 'usable before its declaration position in source' guarantee with a hoisted `function` declaration, which JS hoists (name and body both) to the top of its scope — letting `triple(4)` be called on the line before `function triple` appears. The mechanisms differ (module linking vs. declaration hoisting), but the observable ordering effect is the same, hence 12."
  });

  reg({
    id: 'mod-top-level-this',
    category: 'js-modules', difficulty: 'hard', type: 'predict-output',
    prompt: 'This models what `this` refers to at the top level of an ES module vs. a CommonJS module. What does this log?',
    code: "'use strict';\n\n// Models ESM: at the top level of a module, `this` is undefined (strict-mode\n// module code is never given an implicit receiver).\nfunction esmTopLevel() {\n  console.log(this);\n}\nesmTopLevel.call(undefined);\n\n// Models CJS: Node wraps each file's code in a function and invokes it with\n// `this` set to that file's `module.exports`.\nfunction cjsTopLevel(module) {\n  console.log(this === module.exports);\n}\nvar fakeModule = { exports: {} };\ncjsTopLevel.call(fakeModule.exports, fakeModule);",
    answer: "undefined\ntrue",
    explanation: "At the top level of a real ES module, `this` is `undefined` — modules are always strict-mode and, unlike a plain function call in non-strict sloppy mode, strict mode never substitutes the global object for a missing receiver. This is modeled by calling `esmTopLevel` with `.call(undefined)` inside a `'use strict'` script, so `this` stays `undefined`. At the top level of a real CommonJS file, Node wraps the whole file in `function (exports, require, module, __filename, __dirname) { ... }` and invokes that wrapper with `this` bound to `module.exports` — modeled here by `cjsTopLevel.call(fakeModule.exports, fakeModule)`, where `this === module.exports` is `true`. This is exactly why top-level `this.foo = ...` works as an export alias in CJS but is meaningless (and undefined) in ESM."
  });

  reg({
    id: 'mod-circular-import-partial-value',
    category: 'js-modules', difficulty: 'medium', type: 'predict-output',
    prompt: 'This models a circular import: moduleA loads moduleB partway through its own top-level code, and moduleB reads one of moduleA\'s exports right then. What does this log?',
    code: "var moduleAExports = {};\nvar moduleBExports = {};\n\n(function loadModuleA() {\n  moduleAExports.value = 'A-initial';\n\n  (function loadModuleB() {\n    // B is loaded from inside A's top-level code, before A has finished running\n    console.log('B sees A.value while loading:', moduleAExports.value);\n    moduleBExports.value = 'B-final';\n  })();\n\n  moduleAExports.value = 'A-final'; // A keeps running after B loads, and updates its export\n})();\n\nconsole.log('A.value once both are fully loaded:', moduleAExports.value);\nconsole.log('B.value once both are fully loaded:', moduleBExports.value);",
    answer: "B sees A.value while loading: A-initial\nA.value once both are fully loaded: A-final\nB.value once both are fully loaded: B-final",
    explanation: "With circular ESM imports, the module graph is set up so that importing a binding gives a live reference, not a snapshot — but that only helps for reads that happen AFTER both modules finish evaluating. If moduleB reads moduleA's export WHILE moduleA is still mid-execution (which is exactly what happens on a circular import, since loading B is itself part of running A's top-level code), it only sees whatever partial value A has assigned so far ('A-initial'), not the final one. Once both modules have fully finished loading, any later read of either export (e.g. from a function called after startup) sees the fully updated value ('A-final' / 'B-final'), because the binding is live. This is why circular imports are safe for functions (hoisted, so always \"final\" by the time they're called) but risky for values read at the very top of a module body."
  });
})();
