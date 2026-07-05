/* Practice challenges — Arrays & Methods */
(function () {
  var reg = window.PREP_SITE.registerChallenge;

  reg({
    id: 'arr-sort-default',
    category: 'js-arrays', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "console.log([1, 10, 2, 21].sort());",
    answer: "[ 1, 10, 2, 21 ]",
    explanation: "sort() with no comparator coerces elements to strings and orders lexicographically: '1' < '10' < '2' < '21'. Use .sort((a,b)=>a-b) for numeric order."
  });

  reg({
    id: 'arr-splice-return',
    category: 'js-arrays', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var a = [1,2,3,4,5];\nvar r = a.splice(1, 2);\nconsole.log(r);\nconsole.log(a);",
    answer: "[ 2, 3 ]\n[ 1, 4, 5 ]",
    explanation: "splice mutates in place and RETURNS the removed elements ([2,3]); the original array becomes [1,4,5]."
  });

  reg({
    id: 'arr-map-parseint',
    category: 'js-arrays', difficulty: 'hard', type: 'predict-output',
    prompt: 'What does this log?',
    code: "console.log(['1','2','3'].map(parseInt));",
    answer: "[ 1, NaN, NaN ]",
    explanation: "map passes (value, index): parseInt('1',0)=1, parseInt('2',1)=NaN (radix 1 invalid), parseInt('3',2)=NaN ('3' not a base-2 digit)."
  });

  reg({
    id: 'arr-sort-comparator-stability',
    category: 'js-arrays', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var nums = [10, 1, 21, 2];\nnums.sort(function (a, b) { return a - b; });\nconsole.log(nums);\n\nvar people = [{ n: 'A', age: 30 }, { n: 'B', age: 25 }, { n: 'C', age: 30 }];\npeople.sort(function (a, b) { return a.age - b.age; });\nconsole.log(people.map(function (p) { return p.n; }));",
    answer: "[ 1, 2, 10, 21 ]\n[ 'B', 'A', 'C' ]",
    explanation: "A numeric comparator (a-b) gives true ascending order. sort() is also guaranteed stable, so among equal ages (A and C, both 30) their original relative order (A before C) is preserved after B."
  });

  reg({
    id: 'arr-foreach-return-value',
    category: 'js-arrays', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var doubled = [1, 2, 3].map(function (x) { return x * 2; });\nvar result = [1, 2, 3].forEach(function (x) { return x * 2; });\nconsole.log(doubled);\nconsole.log(result);",
    answer: "[ 2, 4, 6 ]\nundefined",
    explanation: "map() collects each callback's return value into a new array. forEach() always returns undefined, no matter what the callback returns — it's used purely for side effects."
  });

  reg({
    id: 'arr-reduce-initial-value',
    category: 'js-arrays', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "console.log([1, 2, 3].reduce(function (a, b) { return a + b; }));\nconsole.log([1, 2, 3].reduce(function (a, b) { return a + b; }, 10));\n[].reduce(function (a, b) { return a + b; });",
    answer: "6\n16\nTypeError: Reduce of empty array with no initial value",
    explanation: "Without an initial value, reduce() uses the first element as the seed (1+2+3=6). With initial 10, it starts there (10+1+2+3=16). On an EMPTY array with no initial value there is nothing to seed with, so reduce() throws a TypeError."
  });

  reg({
    id: 'arr-filter-boolean',
    category: 'js-arrays', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var arr = [0, 1, '', 'a', null, undefined, NaN, 2, false, 3];\nconsole.log(arr.filter(Boolean));",
    answer: "[ 1, 'a', 2, 3 ]",
    explanation: "filter(Boolean) keeps only truthy values, using Boolean as a shorthand for `function(x){ return Boolean(x); }`. All falsy values (0, '', null, undefined, NaN, false) are dropped."
  });

  reg({
    id: 'arr-slice-splice-mutate-insert',
    category: 'js-arrays', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var a = [1, 2, 3, 4, 5];\nvar s = a.slice(-2);\nconsole.log(s);\nconsole.log(a);\nvar removed = a.splice(1, 2, 'x', 'y', 'z');\nconsole.log(removed);\nconsole.log(a);",
    answer: "[ 4, 5 ]\n[ 1, 2, 3, 4, 5 ]\n[ 2, 3 ]\n[ 1, 'x', 'y', 'z', 4, 5 ]",
    explanation: "slice() never mutates: slice(-2) reads the last two elements and `a` stays intact. splice(1,2,'x','y','z') mutates `a`, removing 2 elements starting at index 1 (returning them: [2,3]) and inserting 'x','y','z' in their place — that's how splice both removes AND inserts."
  });

  reg({
    id: 'arr-push-pop-shift-unshift-return',
    category: 'js-arrays', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var a = [1, 2, 3];\nconsole.log(a.push(4));\nconsole.log(a.pop());\nconsole.log(a.shift());\nconsole.log(a.unshift(0));\nconsole.log(a);",
    answer: "4\n4\n1\n3\n[ 0, 2, 3 ]",
    explanation: "push() returns the new length (4). pop() returns the removed last element (4), leaving [1,2,3]. shift() returns the removed first element (1), leaving [2,3]. unshift(0) returns the new length (3) after prepending 0."
  });

  reg({
    id: 'arr-concat-spread-flat-flatmap',
    category: 'js-arrays', difficulty: 'hard', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var a = [1, 2];\nvar b = [3, 4];\nconsole.log(a.concat(b));\nconsole.log([...a, ...b]);\nconsole.log(a);\nconsole.log([1, [2, 3], [4, [5, 6]]].flat());\nconsole.log([1, [2, 3], [4, [5, 6]]].flat(Infinity));\nconsole.log([1, 2, 3].flatMap(function (x) { return [x, x * 2]; }));",
    answer: "[ 1, 2, 3, 4 ]\n[ 1, 2, 3, 4 ]\n[ 1, 2 ]\n[ 1, 2, 3, 4, [ 5, 6 ] ]\n[ 1, 2, 3, 4, 5, 6 ]\n[ 1, 2, 2, 4, 3, 6 ]",
    explanation: "concat() and spread produce equivalent shallow, non-mutating merges — `a` is untouched either way. flat() only flattens one level deep by default, so the nested [5,6] survives; flat(Infinity) flattens fully. flatMap() is map() followed by a one-level flatten."
  });

  reg({
    id: 'arr-indexof-includes-nan',
    category: 'js-arrays', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var a = [1, NaN, 3];\nconsole.log(a.indexOf(NaN));\nconsole.log(a.includes(NaN));\nconsole.log(a.findIndex(function (x) { return Number.isNaN(x); }));",
    answer: "-1\ntrue\n1",
    explanation: "indexOf uses strict equality (===), and NaN === NaN is always false, so it can never find NaN (-1). includes() uses the SameValueZero algorithm, which treats NaN as equal to itself, so it correctly reports true. findIndex with an explicit Number.isNaN check also finds it at index 1."
  });

  reg({
    id: 'arr-array-ctor-fill-from',
    category: 'js-arrays', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "console.log(Array(3));\nconsole.log(Array.of(3));\nconsole.log(Array(3).fill(0));\nconsole.log(Array.from({ length: 3 }, function (_, i) { return i * 2; }));",
    answer: "[ <3 empty items> ]\n[ 3 ]\n[ 0, 0, 0 ]\n[ 0, 2, 4 ]",
    explanation: "Array(3) creates a sparse array with length 3 but no actual elements (empty slots). Array.of(3) instead creates a 1-element array containing the value 3. fill(0) writes 0 into every slot, and Array.from with a length-only array-like plus a mapper builds real, dense elements."
  });

  reg({
    id: 'arr-holes-map-skips',
    category: 'js-arrays', difficulty: 'hard', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var a = [1, , 3];\nvar mapped = a.map(function (x) { return x * 2; });\nconsole.log(mapped);\nconsole.log(a.length);\nconsole.log(1 in a);",
    answer: "[ 2, <1 empty item>, 6 ]\n3\nfalse",
    explanation: "The middle element is a hole (never assigned), not `undefined`. map() skips holes entirely — it doesn't invoke the callback for them — but preserves the hole at the same index in the result. `1 in a` is false because no property exists at index 1, only at 0 and 2."
  });

  reg({
    id: 'arr-find-findindex-findlast',
    category: 'js-arrays', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var a = [5, 12, 8, 20, 3];\nconsole.log(a.find(function (x) { return x > 10; }));\nconsole.log(a.findIndex(function (x) { return x > 10; }));\nconsole.log(a.findLast(function (x) { return x > 10; }));\nconsole.log(a.findLastIndex(function (x) { return x > 10; }));",
    answer: "12\n1\n20\n3",
    explanation: "find/findIndex scan left-to-right and stop at the FIRST match (12 at index 1). findLast/findLastIndex scan right-to-left and stop at the first match from the end, i.e. the LAST match overall (20 at index 3)."
  });

  reg({
    id: 'arr-some-every-empty',
    category: 'js-arrays', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "console.log([].some(function (x) { return x > 0; }));\nconsole.log([].every(function (x) { return x > 0; }));\nconsole.log([1, 2, 3].every(function (x) { return x > 0; }));",
    answer: "false\ntrue\ntrue",
    explanation: "some() on an empty array has no element to satisfy the test, so it's false. every() on an empty array is vacuously true — there's no counterexample, so the claim holds by default."
  });

  reg({
    id: 'arr-join-nullish',
    category: 'js-arrays', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "console.log([1, undefined, 2, null, 3].join('-'));\nconsole.log([undefined, null].join(','));",
    answer: "1--2--3\n,",
    explanation: "join() converts undefined and null elements to empty strings (not the string 'undefined'/'null'), so they contribute nothing but the separator between their neighbors."
  });

  reg({
    id: 'arr-reverse-mutates',
    category: 'js-arrays', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var a = [1, 2, 3];\nvar b = a.reverse();\nconsole.log(a);\nconsole.log(b);\nconsole.log(a === b);",
    answer: "[ 3, 2, 1 ]\n[ 3, 2, 1 ]\ntrue",
    explanation: "reverse() mutates the array in place and returns the SAME reference, not a copy — that's why a === b is true and both print the reversed order."
  });

  reg({
    id: 'arr-isarray-vs-instanceof',
    category: 'js-arrays', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var a = [1, 2, 3];\nconsole.log(Array.isArray(a));\nconsole.log(a instanceof Array);\nvar f = Object.create(Array.prototype);\nconsole.log(Array.isArray(f));\nconsole.log(f instanceof Array);",
    answer: "true\ntrue\nfalse\ntrue",
    explanation: "For a real array both checks agree. But instanceof only walks the prototype chain: an object manually given Array.prototype via Object.create() passes `instanceof Array` even though it's not an actual exotic array. Array.isArray() checks the true internal array-ness and correctly reports false."
  });

  reg({
    id: 'arr-destructure-default-hole',
    category: 'js-arrays', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "const [a, , b = 10] = [1, 2];\nconsole.log(a, b);\nconst [c, , d = 10] = [1, 2, 3];\nconsole.log(c, d);",
    answer: "1 10\n1 3",
    explanation: "The comma skips index 1 entirely (its value is never bound). A default only kicks in when the destructured slot is `undefined`: in the first line index 2 doesn't exist, so b falls back to 10; in the second line index 2 is 3, so the default is not used."
  });

  reg({
    id: 'arr-spread-shallow-copy',
    category: 'js-arrays', difficulty: 'hard', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var original = [{ id: 1 }, { id: 2 }];\nvar copy = [...original];\ncopy[0].id = 99;\ncopy.push({ id: 3 });\nconsole.log(original);\nconsole.log(copy);\nconsole.log(original[0] === copy[0]);",
    answer: "[ { id: 99 }, { id: 2 } ]\n[ { id: 99 }, { id: 2 }, { id: 3 } ]\ntrue",
    explanation: "Spread creates a new top-level array, but its elements are copied by reference. Mutating the shared object (copy[0].id = 99) is visible through `original` too. Pushing a new object onto `copy` only affects `copy`'s own array, not `original`."
  });

  reg({
    id: 'arr-sort-mutates-original',
    category: 'js-arrays', difficulty: 'hard', type: 'spot-the-bug',
    prompt: 'This leaderboard helper has a bug — find it.',
    code: "function topThree(scores) {\n  var sorted = scores.sort(function (a, b) { return b - a; });\n  return sorted.slice(0, 3);\n}\n\nvar leaderboard = [42, 17, 99, 5, 68];\nvar top = topThree(leaderboard);\nconsole.log(top);\nconsole.log(leaderboard); // caller assumed the original order was preserved",
    answer: "function topThree(scores) {\n  var sorted = scores.slice().sort(function (a, b) { return b - a; });\n  return sorted.slice(0, 3);\n}",
    explanation: "Array.prototype.sort() mutates the array it's called on. Since `scores` is the very same reference as the caller's `leaderboard`, sorting inside topThree silently reorders the caller's array as a side effect. Copy first (scores.slice() or [...scores]) so the function stays pure."
  });

  reg({
    id: 'arr-chain-map-filter-reduce',
    category: 'js-arrays', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];\nvar result = nums\n  .filter(function (n) { return n % 2 === 0; })\n  .map(function (n) { return n * n; })\n  .reduce(function (sum, n) { return sum + n; }, 0);\nconsole.log(result);",
    answer: "220",
    explanation: "filter keeps the evens (2,4,6,8,10), map squares them (4,16,36,64,100), and reduce sums those squares: 4+16+36+64+100 = 220."
  });

  reg({
    id: 'arr-length-truncate',
    category: 'js-arrays', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var a = [1, 2, 3, 4, 5];\na.length = 2;\nconsole.log(a);\na.length = 4;\nconsole.log(a);\nconsole.log(a.length);",
    answer: "[ 1, 2 ]\n[ 1, 2, <2 empty items> ]\n4",
    explanation: "Assigning a smaller length truncates the array, permanently discarding the extra elements. Assigning a LARGER length just extends it with empty (hole) slots — it does not restore the deleted values, and doesn't create real `undefined` entries either."
  });

  reg({
    id: 'arr-delete-leaves-hole',
    category: 'js-arrays', difficulty: 'medium', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var a = [1, 2, 3];\ndelete a[1];\nconsole.log(a);\nconsole.log(a.length);\nconsole.log(1 in a);\nconsole.log(a[1]);",
    answer: "[ 1, <1 empty item>, 3 ]\n3\nfalse\nundefined",
    explanation: "delete removes the property at index 1 entirely, leaving a hole, but it does NOT shift elements or update length (still 3) the way splice would. `1 in a` is false because the property no longer exists; reading a[1] still yields undefined either way (hole or explicit undefined look the same when read directly)."
  });

  reg({
    id: 'arr-at-last-element',
    category: 'js-arrays', difficulty: 'easy', type: 'predict-output',
    prompt: 'What does this log?',
    code: "var a = [10, 20, 30, 40];\nconsole.log(a.at(-1));\nconsole.log(a.at(-2));\nconsole.log(a[a.length - 1]);\nconsole.log(a.at(10));",
    answer: "40\n30\n40\nundefined",
    explanation: "at() accepts negative indices to count from the end, so at(-1) is the last element — a tidier equivalent of a[a.length - 1]. Like bracket access, an out-of-range index (at(10)) simply returns undefined rather than throwing."
  });

  reg({
    id: 'arr-foreach-mutate-spot-bug',
    category: 'js-arrays', difficulty: 'hard', type: 'spot-the-bug',
    prompt: 'This should remove every negative number, but one slips through. Find the bug.',
    code: "function removeNegatives(nums) {\n  nums.forEach(function (n, i) {\n    if (n < 0) {\n      nums.splice(i, 1);\n    }\n  });\n  return nums;\n}\n\nconsole.log(removeNegatives([1, -2, -3, 4, -5])); // logs [ 1, -3, 4 ] — -3 was missed",
    answer: "function removeNegatives(nums) {\n  return nums.filter(function (n) { return n >= 0; });\n}",
    explanation: "forEach fixes the iteration length up front and reads each index off the live array as it goes. Splicing out index 1 (-2) shifts every later element one slot left, so the element that used to be at index 2 (-3) slides into index 1 and gets skipped when forEach moves on to index 2. Build a new array with filter() instead of mutating mid-iteration."
  });

  reg({
    id: 'arr-sort-no-comparator-spot-bug',
    category: 'js-arrays', difficulty: 'medium', type: 'spot-the-bug',
    prompt: 'This is meant to sort numbers ascending, but the output is wrong. Find the bug.',
    code: "function sortAscending(nums) {\n  // BUG: sort() defaults to lexicographic (string) comparison\n  return nums.sort();\n}\n\nconsole.log(sortAscending([10, 5, 40, 25, 100])); // logs [ 10, 100, 25, 40, 5 ]",
    answer: "function sortAscending(nums) {\n  return nums.sort(function (a, b) { return a - b; });\n}",
    explanation: "With no comparator, sort() converts every element to a string and compares them lexicographically, so '100' sorts before '25' because '1' < '2'. Numeric order requires an explicit comparator like (a, b) => a - b."
  });

  reg({
    id: 'arr-reduce-missing-initial-spot-bug',
    category: 'js-arrays', difficulty: 'hard', type: 'spot-the-bug',
    prompt: 'This crashes for some inputs. Find the bug.',
    code: "function sumScores(scores) {\n  // BUG: no initial value supplied\n  return scores.reduce(function (total, s) { return total + s; });\n}\n\nconsole.log(sumScores([10, 20, 30])); // 60, looks fine...\nconsole.log(sumScores([])); // ...but throws TypeError here",
    answer: "function sumScores(scores) {\n  return scores.reduce(function (total, s) { return total + s; }, 0);\n}",
    explanation: "Without an initial value, reduce() uses the first element as the seed — which works until the array is empty, in which case there's nothing to seed with and it throws a TypeError. Always pass an explicit initial value (0 here) when the input could be empty."
  });
})();
