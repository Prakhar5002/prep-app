/* Practice challenges — Objects & References */
(function () {
  var reg = window.PREP_SITE.registerChallenge;

  reg({
    id: 'obj-reference-equality',
    category: 'js-objects', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "console.log({} === {});\nvar a = { x: 1 };\nvar b = a;\nconsole.log(a === b);\nb.x = 2;\nconsole.log(a.x);\nconsole.log(a === { x: 2 });",
    answer: "false\ntrue\n2\nfalse",
    explanation: "Object literals always create a brand-new object, so two separately-written `{}` are never === to each other, no matter how identical their shape is — equality for objects checks IDENTITY, not structure. `var b = a` copies the reference (not the object), so a and b point to the exact same object: mutating through b (b.x = 2) is visible through a too, and a === b is true. Comparing a to a freshly-written {x: 2} is false again for the same reason as the first line."
  });

  reg({
    id: 'obj-pass-by-reference-mutation',
    category: 'js-objects', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "function addProp(obj) {\n  obj.added = true;\n}\nfunction reassign(obj) {\n  obj = { fresh: true };\n}\nvar target = { id: 1 };\naddProp(target);\nconsole.log(target);\nreassign(target);\nconsole.log(target);",
    answer: "{ id: 1, added: true }\n{ id: 1, added: true }",
    explanation: "Object references are passed by value: the function parameter is a copy of the reference, but that copy still points at the SAME underlying object, so mutating a property through it (obj.added = true) is visible to the caller. Reassigning the parameter itself (obj = { fresh: true }) only rebinds the local variable to a new object — it does not change what `target` points to outside the function, so the second log is unaffected."
  });

  reg({
    id: 'obj-shallow-copy-nested-shared',
    category: 'js-objects', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var original = { name: 'A', meta: { count: 1 } };\nvar copy1 = { ...original };\nvar copy2 = Object.assign({}, original);\ncopy1.name = 'B';\ncopy2.meta.count = 99;\nconsole.log(original);\nconsole.log(copy1);\nconsole.log(copy2);\nconsole.log(original.meta === copy1.meta);",
    answer: "{ name: 'A', meta: { count: 99 } }\n{ name: 'B', meta: { count: 99 } }\n{ name: 'A', meta: { count: 99 } }\ntrue",
    explanation: "Both spread ({...original}) and Object.assign({}, original) make a SHALLOW copy: top-level primitive props (name) become independent, but nested object props (meta) are copied by reference, so original, copy1, and copy2 all share the exact same `meta` object. Setting copy1.name only affects copy1's own top-level slot, but setting copy2.meta.count mutates the shared nested object, so it shows up in original and copy1 as well — proven by original.meta === copy1.meta being true."
  });

  reg({
    id: 'obj-structured-clone-deep',
    category: 'js-objects', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "// structuredClone is a built-in global in real browsers/Node; the fallback\n// line just keeps this snippet runnable in restricted embedding sandboxes.\nvar cloneDeep = typeof structuredClone === 'function' ? structuredClone : function (o) { return JSON.parse(JSON.stringify(o)); };\nvar original = { name: 'A', meta: { count: 1 } };\nvar clone = cloneDeep(original);\nclone.meta.count = 99;\nclone.name = 'Z';\nconsole.log(original);\nconsole.log(clone);\nconsole.log(original.meta === clone.meta);",
    answer: "{ name: 'A', meta: { count: 1 } }\n{ name: 'Z', meta: { count: 99 } }\nfalse",
    explanation: "structuredClone() performs a DEEP copy: every nested object gets its own brand-new copy recursively, unlike spread/Object.assign which only copy one level deep. Mutating clone.meta.count or clone.name never touches `original`, and original.meta === clone.meta is false because they are now two entirely separate objects with equal but independent contents."
  });

  reg({
    id: 'obj-const-still-mutable',
    category: 'js-objects', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "const obj = { a: 1 };\nobj.a = 2;\nobj.b = 3;\nconsole.log(obj);",
    answer: "{ a: 2, b: 3 }",
    explanation: "const only locks the BINDING — the name `obj` can never be reassigned to point at a different value — it says nothing about the object's own contents. obj.a = 2 and obj.b = 3 mutate the existing object in place rather than reassigning the `obj` binding itself, so both are perfectly legal, and the log shows the mutated object { a: 2, b: 3 }. Reassigning the binding instead, e.g. obj = {}, WOULD throw TypeError: Assignment to constant variable. — that's the one thing const actually forbids."
  });

  reg({
    id: 'obj-freeze-shallow',
    category: 'js-objects', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var obj = Object.freeze({ a: 1, nested: { b: 2 } });\nobj.a = 100;\nobj.nested.b = 200;\nconsole.log(obj);\nconsole.log(Object.isFrozen(obj));\nconsole.log(Object.isFrozen(obj.nested));",
    answer: "{ a: 1, nested: { b: 200 } }\ntrue\nfalse",
    explanation: "Object.freeze() is SHALLOW: it locks the object's own top-level properties, so obj.a = 100 silently fails (no error outside strict mode) and `a` stays 1. But it does nothing to values nested inside — `obj.nested` is a completely separate object that was never frozen, so obj.nested.b = 200 mutates it freely. Object.isFrozen confirms obj itself is frozen while obj.nested is not."
  });

  reg({
    id: 'obj-key-ordering-enumeration',
    category: 'js-objects', difficulty: 'hard', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var obj = {};\nobj.b = 1;\nobj[2] = 'two';\nobj.a = 3;\nobj[1] = 'one';\nconsole.log(Object.keys(obj));\nconsole.log(Object.values(obj));\nconsole.log(Object.entries(obj));",
    answer: "[ '1', '2', 'b', 'a' ]\n[ 'one', 'two', 1, 3 ]\n[ [ '1', 'one' ], [ '2', 'two' ], [ 'b', 1 ], [ 'a', 3 ] ]",
    explanation: "Own-property enumeration order is NOT purely insertion order: keys that look like non-negative integer indices ('1', '2') are always listed first, sorted in ascending NUMERIC order, regardless of when they were added. Only after all integer-like keys are exhausted do the remaining string keys appear, and those follow true insertion order ('b' before 'a', since b was assigned first). Object.keys/values/entries all walk properties in this same order."
  });

  reg({
    id: 'obj-computed-keys',
    category: 'js-objects', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var prefix = 'key';\nvar i = 1;\nvar obj = {\n  [prefix + i]: 'first',\n  [`${prefix}${i + 1}`]: 'second',\n  [i > 0 ? 'positive' : 'negative']: true\n};\nconsole.log(obj);\nconsole.log(obj.key1, obj.key2, obj.positive);",
    answer: "{ key1: 'first', key2: 'second', positive: true }\nfirst second true",
    explanation: "Square brackets in an object literal's property position mark a COMPUTED key: the bracketed expression is evaluated first and its (string-coerced) result becomes the actual property name. So `prefix + i` becomes 'key1', the template literal becomes 'key2', and the ternary becomes 'positive' — none of them are literal keys named after the expression text."
  });

  reg({
    id: 'obj-delete-vs-undefined',
    category: 'js-objects', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var obj = { a: 1, b: 2, c: 3 };\ndelete obj.b;\nobj.c = undefined;\nconsole.log(obj);\nconsole.log('b' in obj, 'c' in obj);\nconsole.log(Object.keys(obj));\nconsole.log(JSON.stringify(obj));",
    answer: "{ a: 1, c: undefined }\nfalse true\n[ 'a', 'c' ]\n{\"a\":1}",
    explanation: "delete completely removes the property — afterward 'b' in obj is false and Object.keys no longer lists it. Assigning undefined instead (obj.c = undefined) is very different: the property KEY still exists on the object (so 'c' in obj is true and Object.keys still lists 'c'), it just now holds the value undefined. JSON.stringify treats these differently too: it silently OMITS any property whose value is undefined, which is why 'c' disappears from the JSON even though it's still 'in' the object."
  });

  reg({
    id: 'obj-json-stringify-roundtrip',
    category: 'js-objects', difficulty: 'hard', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var obj = {\n  name: 'Alice',\n  greet: function () { return 'hi'; },\n  missing: undefined,\n  when: new Date('2024-01-01T00:00:00.000Z'),\n  nested: { valid: true }\n};\nvar json = JSON.stringify(obj);\nconsole.log(json);\nvar restored = JSON.parse(json);\nconsole.log(restored);\nconsole.log(typeof restored.when);",
    answer: "{\"name\":\"Alice\",\"when\":\"2024-01-01T00:00:00.000Z\",\"nested\":{\"valid\":true}}\n{\n  name: 'Alice',\n  when: '2024-01-01T00:00:00.000Z',\n  nested: { valid: true }\n}\nstring",
    explanation: "JSON.stringify silently DROPS properties whose value is a function or undefined (greet and missing both vanish) — JSON has no way to represent them. Date objects get special-cased: they're serialized via their toJSON(), producing an ISO-8601 STRING, not preserved as a Date. JSON.parse has no idea that string used to be a Date, so it comes back as a plain string — typeof restored.when is 'string', not 'object'. Round-tripping through JSON.stringify/parse is therefore lossy for functions, undefined, and Dates."
  });

  reg({
    id: 'obj-optional-chaining-nullish',
    category: 'js-objects', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var user = { profile: { age: 0 } };\nconsole.log(user?.profile?.age);\nconsole.log(user?.profile?.age ?? 'default');\nconsole.log(user?.profile?.age || 'default');\nconsole.log(user?.settings?.theme);\nconsole.log(user?.settings?.theme ?? 'light');\nconsole.log(user.getName?.());",
    answer: "0\n0\ndefault\nundefined\nlight\nundefined",
    explanation: "?. (optional chaining) simply returns undefined the moment it hits a null/undefined link instead of throwing — user.settings is undefined, so user?.settings?.theme short-circuits to undefined without erroring. ?? (nullish coalescing) only falls back when the left side is exactly null or undefined, so 0 (a real, valid value) passes through untouched. || falls back on ANY falsy value, and 0 is falsy, so it gets replaced by 'default' even though 0 was a legitimate age. user.getName?.() calls getName only if it exists; since it doesn't, the whole expression short-circuits to undefined instead of throwing 'getName is not a function'."
  });

  reg({
    id: 'obj-spot-bug-shallow-copy-mutate',
    category: 'js-objects', difficulty: 'hard', type: 'spot-the-bug',
    prompt: 'This is supposed to return an updated COPY without touching the original — find the bug.',
    code: "function updateUserSettings(user, newTheme) {\n  // BUG: spread only copies top-level props; `settings` is still the SAME nested object\n  var updated = { ...user };\n  updated.settings.theme = newTheme;\n  return updated;\n}\n\nvar user = { name: 'Alice', settings: { theme: 'dark', fontSize: 14 } };\nvar updatedUser = updateUserSettings(user, 'light');\nconsole.log(user.settings.theme); // 'light' — the ORIGINAL was mutated too!\nconsole.log(updatedUser.settings.theme);",
    answer: "function updateUserSettings(user, newTheme) {\n  var updated = { ...user, settings: { ...user.settings, theme: newTheme } };\n  return updated;\n}",
    explanation: "{ ...user } only clones user's own top-level properties; the value stored under `settings` is copied by REFERENCE, so updated.settings and user.settings point to the exact same nested object. Writing updated.settings.theme = newTheme therefore mutates that shared object, silently changing the caller's original `user` too. The fix spreads `settings` into a NEW nested object as well, so updated.settings becomes an independent copy that can be changed without touching user.settings."
  });

  reg({
    id: 'obj-spot-bug-object-as-key',
    category: 'js-objects', difficulty: 'medium', type: 'spot-the-bug',
    prompt: 'This cache is supposed to look up values by object identity, but different objects collide. Find the bug.',
    code: "function makeCache() {\n  var cache = {};\n  return function (keyObj, value) {\n    // BUG: plain object keys can only be strings — keyObj gets stringified\n    if (value !== undefined) cache[keyObj] = value;\n    return cache[keyObj];\n  };\n}\n\nvar get = makeCache();\nget({ id: 1 }, 'valueForId1');\nconsole.log(get({ id: 2 })); // expected undefined (different object!), but logs 'valueForId1'",
    answer: "function makeCache() {\n  var cache = new Map();\n  return function (keyObj, value) {\n    if (value !== undefined) cache.set(keyObj, value);\n    return cache.get(keyObj);\n  };\n}",
    explanation: "A plain object's property keys are always coerced to strings (or symbols). Using cache[keyObj] implicitly calls keyObj.toString(), and every ordinary object's default toString() returns the same literal string, \"[object Object]\" — so ANY plain object used as a key collides on that one property, no matter how different their contents are. A Map stores its keys by actual reference/identity instead of stringifying them, so distinct object instances correctly map to distinct entries."
  });
})();
