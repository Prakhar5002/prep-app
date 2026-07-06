/* Practice challenges — Coercion & Edge Cases */
(function () {
  var reg = window.PREP_SITE.registerChallenge;

  reg({
    id: 'coerce-array-object-plus',
    category: 'js-coercion', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "console.log([] + []);\nconsole.log([] + {});\nconsole.log({} + []);",
    answer: "\n[object Object]\n[object Object]",
    explanation: "[] + [] runs ToPrimitive on both arrays: [].toString() is '', so the result is '' + '' = '' — an empty string, which console.log just prints as a blank line. [] + {} coerces the array to '' and the object to its default toString '[object Object]', giving '[object Object]'. Inside a console.log(...) call, {} is unambiguously parsed as an object-literal expression (never a block there), so {} + [] does the same string coercion in the other order, again producing '[object Object]'."
  });

  reg({
    id: 'coerce-brace-parse-ambiguity',
    category: 'js-coercion', difficulty: 'hard', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var a = {} + [];\nconsole.log(a);\nconsole.log(typeof a);\nconsole.log(eval('{} + []'));",
    answer: "[object Object]\nstring\n0",
    explanation: "On the right-hand side of an assignment, {} can only be an expression, so it's parsed as an empty object literal: {} + [] coerces both sides to strings and concatenates, producing the STRING '[object Object]' (typeof confirms 'string'). But eval('{} + []') runs a brand-new top-level program, where a '{' at the very start of a statement is parsed as an empty BLOCK statement, not an object literal. That leaves '+ []' as a separate expression statement, which just applies unary plus to convert [] into the number 0 — identical source text, two completely different results, depending purely on whether the parser expected a statement or an expression."
  });

  reg({
    id: 'coerce-string-number-mixed-ops',
    category: 'js-coercion', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "console.log(1 + '1');\nconsole.log(1 - '1');\nconsole.log('5' * 2);",
    answer: "11\n0\n10",
    explanation: "+ is overloaded: if EITHER operand is a string, it performs string concatenation, so 1 + '1' converts the number 1 to '1' and concatenates, giving '11'. Every other arithmetic operator (-, *, /) only has a numeric meaning, so it coerces both operands with ToNumber first: 1 - '1' becomes 1 - 1 = 0, and '5' * 2 becomes 5 * 2 = 10."
  });

  reg({
    id: 'coerce-loose-vs-strict-basic',
    category: 'js-coercion', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "console.log(null == undefined);\nconsole.log(null === undefined);\nconsole.log(NaN == NaN);",
    answer: "true\nfalse\nfalse",
    explanation: "The == abstract equality algorithm special-cases null and undefined: they are loosely equal to each other (and to themselves) and to NOTHING else — no numeric coercion happens for this pair. === never coerces, and null and undefined are different types, so it's false. NaN is defined by IEEE-754 to never equal anything, including itself, under either == or ===, so NaN == NaN is false."
  });

  reg({
    id: 'coerce-loose-equality-traps',
    category: 'js-coercion', difficulty: 'hard', type: 'predict-output',
    prompt: 'What does this log?',
    code: "console.log(0 == '');\nconsole.log(0 == '0');\nconsole.log('' == 0);\nconsole.log([] == ![]);",
    answer: "true\ntrue\ntrue\ntrue",
    explanation: "Comparing a number to a string with == converts the string via ToNumber first: Number('') is 0, so 0 == '' is true; Number('0') is also 0, so 0 == '0' is true (and equality is symmetric, so '' == 0 is true too). For [] == ![]: ! has higher precedence, so ![] evaluates first — [] is a truthy object, so ![] is false. Then [] == false: false converts to the number 0, and the array converts via ToPrimitive to '' and then to the number 0 — so it's 0 == 0, true."
  });

  reg({
    id: 'coerce-truthiness-basics',
    category: 'js-coercion', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "console.log(Boolean([]));\nconsole.log(Boolean({}));\nconsole.log(Boolean(''));\nconsole.log(Boolean(0));\nconsole.log(Boolean('0'));\nconsole.log(Boolean(NaN));",
    answer: "true\ntrue\nfalse\nfalse\ntrue\nfalse",
    explanation: "Every object is truthy, no exceptions — even an empty array [] or empty object {} converts to true. The ONLY falsy values in JS are false, 0, -0, 0n, '', null, undefined, and NaN. '0' is a non-empty STRING (not the number 0), so it's truthy; only the number 0 and NaN are falsy here."
  });

  reg({
    id: 'coerce-typeof-quirks',
    category: 'js-coercion', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "console.log(typeof null);\nconsole.log(typeof NaN);\nconsole.log(typeof function () {});\nconsole.log(typeof undeclaredVar);",
    answer: "object\nnumber\nfunction\nundefined",
    explanation: "typeof null is 'object' — a long-standing bug baked into JS since 1995 (null's internal type tag matched the tag used for objects) that can never be fixed without breaking the web. NaN is still a value of the Number type, so typeof NaN is 'number'. Functions get their own typeof result, 'function', even though they're technically objects. typeof is also special-cased to never throw on an undeclared identifier — it returns 'undefined' instead of a ReferenceError, which is what makes typeof safe for feature-detecting globals."
  });

  reg({
    id: 'coerce-unary-plus-everything',
    category: 'js-coercion', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "console.log(+true);\nconsole.log(+null);\nconsole.log(+undefined);\nconsole.log(+'');\nconsole.log(+[]);\nconsole.log(+[1]);\nconsole.log(+[1, 2]);",
    answer: "1\n0\nNaN\n0\n0\n1\nNaN",
    explanation: "Unary + runs ToNumber on its operand. true becomes 1, null becomes 0, but undefined becomes NaN (null and undefined are NOT treated the same by ToNumber). An empty string is 0. For arrays, ToNumber first goes through ToPrimitive, which calls toString(): [].toString() is '' -> 0; [1].toString() is '1' -> 1; [1,2].toString() is '1,2', which is not a valid numeric literal -> NaN."
  });

  reg({
    id: 'coerce-number-string-conversions',
    category: 'js-coercion', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "console.log(Number(null));\nconsole.log(Number(undefined));\nconsole.log(String(null));\nconsole.log('' + null);\nconsole.log(String(undefined));\nconsole.log('' + undefined);",
    answer: "0\nNaN\nnull\nnull\nundefined\nundefined",
    explanation: "Number() and String() disagree on how to treat null vs undefined. Number(null) is 0 while Number(undefined) is NaN — null is treated as an absence-of-value that defaults to zero, but undefined means 'not even a value to convert', which has no numeric equivalent. For string conversion, String(x) and the '' + x idiom both run the same ToString operation, which is special-cased for null/undefined to literally return the strings 'null' and 'undefined' (it does NOT call a .toString() method — neither value has one) — so both forms always agree with each other."
  });

  reg({
    id: 'coerce-parseint-vs-number',
    category: 'js-coercion', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "console.log(parseInt('08'));\nconsole.log(Number('08'));",
    answer: "8\n8",
    explanation: "It's tempting to expect parseInt('08') to be a classic trap returning 0, from very old engines that guessed octal from a leading zero. That legacy auto-octal behavior was removed as of ES5: parseInt only switches to base 16 for a '0x'/'0X' prefix, and otherwise defaults to base 10, so parseInt('08') parses cleanly as 8. Number('08') was always 8, since Number() has no octal-guessing logic at all. In every modern engine both give the same answer — the real gotcha here is expecting a mismatch that no longer exists."
  });

  reg({
    id: 'coerce-float-precision',
    category: 'js-coercion', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "console.log(0.1 + 0.2);\nconsole.log(0.1 + 0.2 === 0.3);",
    answer: "0.30000000000000004\nfalse",
    explanation: "JS numbers are IEEE-754 double-precision floats, and 0.1 and 0.2 have no exact binary fractional representation, so each is stored as the closest representable approximation. Adding those approximations accumulates a tiny rounding error, producing 0.30000000000000004 instead of the mathematically exact 0.3 — and the literal 0.3 rounds to a DIFFERENT nearby double, so the strict equality check is false. Float comparisons should use an epsilon-based tolerance instead of ===."
  });

  reg({
    id: 'coerce-isnan-vs-number-isnan',
    category: 'js-coercion', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "console.log(isNaN('abc'));\nconsole.log(Number.isNaN('abc'));\nconsole.log(isNaN(undefined));\nconsole.log(Number.isNaN(NaN));",
    answer: "true\nfalse\ntrue\ntrue",
    explanation: "The global isNaN() coerces its argument to a number FIRST (via ToNumber) and then checks whether the result is NaN: Number('abc') is NaN, so isNaN('abc') is true, and Number(undefined) is also NaN, so isNaN(undefined) is true — even though neither input was ever literally the NaN value. Number.isNaN(), added in ES2015, does NOT coerce: it only returns true when the argument's type is already number AND its value is NaN, so Number.isNaN('abc') is false ('abc' is a string) while Number.isNaN(NaN) correctly reports true."
  });

  reg({
    id: 'coerce-double-bang',
    category: 'js-coercion', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "console.log(!!'hello');\nconsole.log(!!0);\nconsole.log(!!null);\nconsole.log(!!'0');\nconsole.log(!![]);",
    answer: "true\nfalse\nfalse\ntrue\ntrue",
    explanation: "!! is the idiomatic way to force ToBoolean coercion: the first ! converts the operand to its boolean opposite, and the second ! flips it back to the 'real' truthiness. 'hello' is a non-empty string (truthy), 0 is one of the falsy primitives, null is falsy, '0' is a non-empty STRING so it's truthy (don't confuse it with the falsy number 0), and any object/array like [] is always truthy regardless of what it contains."
  });

  reg({
    id: 'coerce-nan-comparisons-infinity',
    category: 'js-coercion', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "console.log(NaN < 1);\nconsole.log(NaN > 1);\nconsole.log(1 / 0);\nconsole.log(Infinity + 1 === Infinity);",
    answer: "false\nfalse\nInfinity\ntrue",
    explanation: "Relational comparisons involving NaN always return false — NaN is defined as 'unordered' with respect to every value, including itself, so it's neither less than, greater than, nor equal to 1. Dividing a nonzero number by 0 doesn't throw in JS (unlike many other languages); it produces the special Infinity value. Arithmetic on Infinity also saturates: adding any finite number to it is still indistinguishable from Infinity at double precision, so Infinity + 1 === Infinity is true."
  });

  reg({
    id: 'coerce-negative-zero',
    category: 'js-coercion', difficulty: 'hard', type: 'predict-output',
    prompt: 'What does this log?',
    code: "console.log(-0 === 0);\nconsole.log(Object.is(-0, 0));\nconsole.log(Object.is(NaN, NaN));\nconsole.log(1 / -0);",
    answer: "true\nfalse\ntrue\n-Infinity",
    explanation: "IEEE-754 doubles have two zeros, +0 and -0, but both == and === special-case numeric comparison so that -0 === 0 is true — they're treated as indistinguishable. Object.is() uses the stricter SameValue algorithm instead, which DOES distinguish the sign of zero (so Object.is(-0, 0) is false) but, unlike ===, treats NaN as equal to itself (Object.is(NaN, NaN) is true). The sign of zero isn't just theoretical: dividing by -0 instead of 0 flips the sign of the result, giving -Infinity instead of Infinity — a difference === can never reveal."
  });

  reg({
    id: 'coerce-loose-equality-bug',
    category: 'js-coercion', difficulty: 'medium', type: 'spot-the-bug',
    prompt: 'This ownership check has a bug — find it.',
    code: "function isOwner(sessionUserId, resourceOwnerId) {\n  return sessionUserId == resourceOwnerId;\n}\n\nconsole.log(isOwner('123', 123));  // true — looks correct\nconsole.log(isOwner('', 0));        // true — but this should NEVER match!\nconsole.log(isOwner(null, 0));      // false",
    answer: "function isOwner(sessionUserId, resourceOwnerId) {\n  return String(sessionUserId) === String(resourceOwnerId);\n}",
    explanation: "== silently coerces mismatched types before comparing. Here sessionUserId is an empty string (e.g. no session id yet) and resourceOwnerId is the number 0; '' == 0 coerces the empty string to the number 0 via ToNumber, so the comparison incorrectly succeeds and grants access to a resource owned by id 0. Simply swapping in === would fix that case but break the legitimate '123' vs 123 comparison (different types, so === would now always be false). The safer fix is to make the coercion explicit and consistent on BOTH sides — normalize both values to strings with String(...) and then compare with strict === — so a genuine value match still succeeds (in either original type) while accidental cross-type matches like '' vs 0 no longer sneak through."
  });

  reg({
    id: 'coerce-assignment-in-conditional-bug',
    category: 'js-coercion', difficulty: 'medium', type: 'spot-the-bug',
    prompt: 'This admin check has a bug — find it.',
    code: "function isAdmin(role) {\n  if (role = 'admin') {\n    return true;\n  }\n  return false;\n}\n\nconsole.log(isAdmin('admin'));  // true — looks correct\nconsole.log(isAdmin('guest'));  // true — should be false!",
    answer: "function isAdmin(role) {\n  if (role === 'admin') {\n    return true;\n  }\n  return false;\n}",
    explanation: "= is assignment, not comparison — a single missing '=' turns the condition into an assignment expression. `role = 'admin'` overwrites the parameter with the string 'admin', and the expression evaluates to that assigned value, which is truthy — so the if-block runs unconditionally no matter what was originally passed in. That's why isAdmin('guest') incorrectly returns true. Using === (strict equality) makes the intent a comparison rather than a mutation, and also rules out any type coercion."
  });

  reg({
    id: 'coerce-nan-self-compare-bug',
    category: 'js-coercion', difficulty: 'hard', type: 'spot-the-bug',
    prompt: 'This age validator has a bug — find it.',
    code: "function validateAge(input) {\n  var parsed = parseInt(input, 10);\n  if (parsed !== NaN) {\n    return 'valid age: ' + parsed;\n  }\n  return 'invalid age';\n}\n\nconsole.log(validateAge('25'));   // 'valid age: 25'\nconsole.log(validateAge('abc'));  // should be 'invalid age', but...",
    answer: "function validateAge(input) {\n  var parsed = parseInt(input, 10);\n  if (!Number.isNaN(parsed)) {\n    return 'valid age: ' + parsed;\n  }\n  return 'invalid age';\n}",
    explanation: "NaN is the one value in JS that is never equal to anything, including itself — so `parsed !== NaN` is ALWAYS true, regardless of whether parsed actually is NaN. That makes the validation check a no-op: it can never detect a failed parse, so validateAge('abc') slips through and returns 'valid age: NaN'. The fix is Number.isNaN(parsed), the only reliable way to test whether a value literally is NaN, since it doesn't rely on an equality comparison at all."
  });
})();
