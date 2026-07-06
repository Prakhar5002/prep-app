/* Practice challenges — Strings & Manipulation */
(function () {
  var reg = window.PREP_SITE.registerChallenge;

  reg({
    id: "str-split-join-roundtrip",
    category: 'js-strings', difficulty: "easy", type: "predict-output",
    prompt: "What does this log?",
    code: "var csv = \"a,b,,c\";\nvar parts = csv.split(\",\");\nconsole.log(parts);\nconsole.log(parts.length);\nconsole.log(parts.join(\"-\"));",
    answer: "[ 'a', 'b', '', 'c' ]\n4\na-b--c",
    explanation: "split(',') breaks on every comma, including the empty run between the two consecutive commas, producing a 4-element array (an empty string element for the gap). join('-') then round-trips those elements back into a string using '-' as the new separator — the empty element contributes nothing, so 'b' and 'c' end up separated by a double dash."
  });

  reg({
    id: "str-replaceall",
    category: 'js-strings', difficulty: "easy", type: "predict-output",
    prompt: "What does this log?",
    code: "var s = \"a-b-a-b\";\nconsole.log(s.replace(\"a\", \"X\"));\nconsole.log(s.replaceAll(\"a\", \"X\"));\nconsole.log(s);",
    answer: "X-b-a-b\nX-b-X-b\na-b-a-b",
    explanation: "replace() with a plain string pattern only swaps the FIRST occurrence. replaceAll() swaps every occurrence. Neither mutates the original string — strings are immutable — so the final console.log(s) still shows the untouched original."
  });

  reg({
    id: "str-padstart-padend",
    category: 'js-strings', difficulty: "easy", type: "predict-output",
    prompt: "What does this log?",
    code: "console.log(\"5\".padStart(3, \"0\"));\nconsole.log(\"5\".padEnd(3, \"0\"));\nconsole.log(\"abcdef\".padStart(3, \"0\"));\nconsole.log(\"7\".padStart(4, \"12\"));",
    answer: "005\n500\nabcdef\n1217",
    explanation: "padStart/padEnd pad up to a target LENGTH, not by a fixed amount. If the string is already at or beyond that length ('abcdef' is length 6, target 3), nothing is added. When the pad string is multi-character ('12'), it's repeated and truncated as needed to fill the gap: 3 chars needed before '7', so '12' repeats and gets cut to '121'."
  });

  reg({
    id: "str-trim-trimstart-trimend",
    category: 'js-strings', difficulty: "easy", type: "predict-output",
    prompt: "What does this log?",
    code: "var s = \"  hello world  \";\nconsole.log(JSON.stringify(s.trim()));\nconsole.log(JSON.stringify(s.trimStart()));\nconsole.log(JSON.stringify(s.trimEnd()));\nconsole.log(JSON.stringify(s));",
    answer: "\"hello world\"\n\"hello world  \"\n\"  hello world\"\n\"  hello world  \"",
    explanation: "trim() strips whitespace from both ends, trimStart() only the leading whitespace, trimEnd() only the trailing whitespace. JSON.stringify is used here just to make the surviving spaces visible. None of these methods mutate `s` — the last line proves the original string, spaces and all, is unchanged."
  });

  reg({
    id: "str-repeat",
    category: 'js-strings', difficulty: "easy", type: "predict-output",
    prompt: "What does this log?",
    code: "console.log(\"ab\".repeat(3));\nconsole.log(\"x\".repeat(0));\nconsole.log(\"x\".repeat(-1));",
    answer: "ababab\n\nRangeError: Invalid count value: -1",
    explanation: "repeat(3) concatenates the string 3 times. repeat(0) is valid and simply yields an empty string (blank line). A negative count is out of range and repeat() throws a RangeError rather than returning anything."
  });

  reg({
    id: "str-immutability-bracket-assign",
    category: 'js-strings', difficulty: "easy", type: "predict-output",
    prompt: "What does this log?",
    code: "var s = \"hello\";\ns[0] = \"H\";\nconsole.log(s);\nconsole.log(s[0]);\nvar arr = s.split(\"\");\narr[0] = \"H\";\nconsole.log(arr.join(\"\"));",
    answer: "hello\nh\nHello",
    explanation: "Strings are immutable primitives: s[0] = \"H\" is a silent no-op (no error, no effect) because there is no index-0 property to write to. To actually change a character you must build a new string — e.g. split into a mutable array, edit that, and join it back."
  });

  reg({
    id: "str-includes-startswith-endswith",
    category: 'js-strings', difficulty: "easy", type: "predict-output",
    prompt: "What does this log?",
    code: "var s = \"Hello World\";\nconsole.log(s.includes(\"World\"));\nconsole.log(s.includes(\"world\"));\nconsole.log(s.startsWith(\"Hello\"));\nconsole.log(s.endsWith(\"World\"));\nconsole.log(s.startsWith(\"World\", 6));",
    answer: "true\nfalse\ntrue\ntrue\ntrue",
    explanation: "All three checks are case-sensitive, so the lowercase 'world' search fails. startsWith accepts an optional starting index as its second argument — startsWith(\"World\", 6) checks whether the substring beginning at index 6 starts with \"World\", which it does."
  });

  reg({
    id: "str-replace-string-vs-regex",
    category: 'js-strings', difficulty: "medium", type: "predict-output",
    prompt: "What does this log?",
    code: "var s = \"cat bat cat\";\nconsole.log(s.replace(\"cat\", \"dog\"));\nconsole.log(s.replace(/cat/g, \"dog\"));\nconsole.log(s.replace(/cat/, \"dog\"));",
    answer: "dog bat cat\ndog bat dog\ndog bat cat",
    explanation: "A plain string pattern always replaces only the first match, no matter what. A regex only replaces every match if it carries the /g (global) flag; a regex without /g behaves just like the string case and stops after the first match."
  });

  reg({
    id: "str-replace-dollar-patterns",
    category: 'js-strings', difficulty: "medium", type: "predict-output",
    prompt: "What does this log?",
    code: "var s = \"John Smith\";\nconsole.log(s.replace(/(\\w+)\\s(\\w+)/, \"$2 $1\"));\nconsole.log(s.replace(/John/, \"[$&]\"));\nconsole.log(\"no match here\".replace(/xyz/, \"$&\"));",
    answer: "Smith John\n[John] Smith\nno match here",
    explanation: "In a replacement string, $1/$2 refer to captured groups (here swapping first and last name) and $& refers to the entire matched substring (wrapping \"John\" in brackets). If the regex never matches, replace() returns the original string untouched — the replacement pattern is irrelevant."
  });

  reg({
    id: "str-template-literal-tagged",
    category: 'js-strings', difficulty: "medium", type: "predict-output",
    prompt: "What does this log?",
    code: "function tag(strings, ...values) {\n  return strings.raw.join(\"|\") + \" :: \" + values.join(\",\");\n}\nvar name = \"World\";\nconsole.log(`Hello, ${name}!`);\nconsole.log(tag`a${1}b\\nc${2}d`);",
    answer: "Hello, World!\na|b\\nc|d :: 1,2",
    explanation: "A plain template literal interpolates ${name} directly. A TAGGED template instead calls tag(strings, ...values): `strings` is the array of literal chunks around each interpolation ('a', 'b\\nc', 'd'), and `strings.raw` preserves the SOURCE text exactly as typed — so the escape sequence \\n stays as the two literal characters backslash+n instead of becoming an actual newline."
  });

  reg({
    id: "str-charat-bracket-at",
    category: 'js-strings', difficulty: "medium", type: "predict-output",
    prompt: "What does this log?",
    code: "var s = \"hello\";\nconsole.log(s.charAt(1));\nconsole.log(s[1]);\nconsole.log(s.at(-1));\nconsole.log(s.charAt(10));\nconsole.log(s[10]);\nconsole.log(s.at(10));",
    answer: "e\ne\no\n\nundefined\nundefined",
    explanation: "charAt and bracket access agree for in-range indices. at(-1) is shorthand for the last character, counting from the end. Out of range, the three diverge: charAt() falls back to an empty string, while bracket access and at() both return undefined."
  });

  reg({
    id: "str-charcodeat-codepointat-fromcharcode",
    category: 'js-strings', difficulty: "medium", type: "predict-output",
    prompt: "What does this log?",
    code: "console.log(\"A\".charCodeAt(0));\nconsole.log(String.fromCharCode(65, 66, 67));\nconsole.log(\"😀\".charCodeAt(0));\nconsole.log(\"😀\".codePointAt(0));\nconsole.log(String.fromCodePoint(128512));",
    answer: "65\nABC\n55357\n128512\n😀",
    explanation: "charCodeAt always returns a single 16-bit code unit — for a plain BMP character like 'A' that IS the code point (65), but for an emoji stored as a surrogate pair it only returns the leading surrogate's value (55357). codePointAt understands surrogate pairs and returns the full code point (128512). fromCodePoint (unlike fromCharCode) can reconstruct the emoji from that full code point."
  });

  reg({
    id: "str-localecompare",
    category: 'js-strings', difficulty: "medium", type: "predict-output",
    prompt: "What does this log?",
    code: "console.log(\"a\".localeCompare(\"b\"));\nconsole.log(\"b\".localeCompare(\"a\"));\nconsole.log(\"a\".localeCompare(\"a\"));\nconsole.log([\"Zebra\", \"apple\", \"Mango\"].sort());\nconsole.log([\"Zebra\", \"apple\", \"Mango\"].sort(function (a, b) { return a.localeCompare(b); }));",
    answer: "-1\n1\n0\n[ 'Mango', 'Zebra', 'apple' ]\n[ 'apple', 'Mango', 'Zebra' ]",
    explanation: "localeCompare returns -1/0/1 depending on sort order in the current locale. Default Array#sort() converts elements to strings and compares by UTF-16 code unit, so uppercase letters (all < 91) sort before ANY lowercase letter — 'Mango' and 'Zebra' land before 'apple'. Sorting with localeCompare as the comparator instead does locale-aware, effectively case-insensitive ordering: apple, Mango, Zebra."
  });

  reg({
    id: "str-tostring-nullish-spot-bug",
    category: 'js-strings', difficulty: "medium", type: "spot-the-bug",
    prompt: "This formatter crashes for some inputs. Find the bug.",
    code: "function describe(value) {\n  return \"Value: \" + value.toString(); // BUG: crashes when value is null/undefined\n}\n\nconsole.log(describe(42));\nconsole.log(describe(\"hi\"));\nconsole.log(describe(null)); // TypeError: Cannot read properties of null (reading 'toString')",
    answer: "function describe(value) {\n  return \"Value: \" + String(value);\n}",
    explanation: "value.toString() is a method CALL on value itself, and null/undefined have no methods to call, so it throws. String(value) is a standalone function that special-cases null -> 'null' and undefined -> 'undefined' instead of throwing, making it the safer choice whenever the input might be nullish."
  });

  reg({
    id: "str-tostring-radix",
    category: 'js-strings', difficulty: "medium", type: "predict-output",
    prompt: "What does this log?",
    code: "console.log((255).toString(16));\nconsole.log((255).toString(2));\nconsole.log((8).toString(8));\nconsole.log(parseInt(\"ff\", 16));\nconsole.log(parseInt(\"0x1F\"));",
    answer: "ff\n11111111\n10\n255\n31",
    explanation: "Number#toString accepts a radix and renders the number in that base (255 in hex is 'ff', in binary '11111111'; 8 in octal is '10'). parseInt does the reverse, reading a string as an integer in a given base ('ff' base 16 is 255). Without an explicit radix, parseInt auto-detects a '0x' prefix as hexadecimal, so parseInt(\"0x1F\") reads as 31."
  });

  reg({
    id: "str-json-stringify-quotes",
    category: 'js-strings', difficulty: "medium", type: "predict-output",
    prompt: "What does this log?",
    code: "var s = 'He said \"hello\"';\nconsole.log(s);\nconsole.log(JSON.stringify(s));\nconsole.log(JSON.stringify({ msg: s }));\nconsole.log(typeof JSON.stringify(s));",
    answer: "He said \"hello\"\n\"He said \\\"hello\\\"\"\n{\"msg\":\"He said \\\"hello\\\"\"}\nstring",
    explanation: "Logging the raw string shows its plain characters. JSON.stringify() wraps a string in quotes AND escapes any quote characters inside it with a backslash, so the result is itself a STRING (typeof is 'string') whose content happens to look like quoted JSON — that's why the printed line shows literal backslash-quote sequences."
  });

  reg({
    id: "str-mutate-bracket-assign-spot-bug",
    category: 'js-strings', difficulty: "medium", type: "spot-the-bug",
    prompt: "This should capitalize the first letter, but it doesn't. Find the bug.",
    code: "function capitalizeFirst(str) {\n  str[0] = str[0].toUpperCase(); // BUG: strings are immutable; this assignment silently does nothing\n  return str;\n}\n\nconsole.log(capitalizeFirst(\"hello\")); // expected \"Hello\", logs \"hello\"",
    answer: "function capitalizeFirst(str) {\n  return str[0].toUpperCase() + str.slice(1);\n}",
    explanation: "Strings are immutable: assigning to an index like str[0] = ... is a silent no-op (no error is thrown), so `str` comes back unchanged. To transform part of a string you must build and return a brand-new string, e.g. by concatenating the uppercased first character with the rest via slice(1)."
  });

  reg({
    id: "str-replace-expecting-global-spot-bug",
    category: 'js-strings', difficulty: "medium", type: "spot-the-bug",
    prompt: "This censor helper is supposed to redact every match, but only the first one gets redacted. Find the bug.",
    code: "function censor(text, word) {\n  return text.replace(word, \"***\"); // BUG: string pattern only replaces the first occurrence\n}\n\nconsole.log(censor(\"spam spam spam\", \"spam\")); // expected \"*** *** ***\"",
    answer: "function censor(text, word) {\n  return text.replaceAll(word, \"***\");\n}",
    explanation: "String#replace with a plain string (non-regex) pattern always stops after the first match, regardless of how many times it occurs. replaceAll() (or a /g-flagged regex) replaces every occurrence."
  });

  reg({
    id: "str-slice-substring-substr-negative",
    category: 'js-strings', difficulty: "hard", type: "predict-output",
    prompt: "What does this log?",
    code: "var s = \"Hello World\";\nconsole.log(s.slice(-5));\nconsole.log(s.substring(-5));\nconsole.log(s.substr(-5));\nconsole.log(s.slice(3, 1));\nconsole.log(s.substring(3, 1));\nconsole.log(s.substr(3, -1));",
    answer: "World\nHello World\nWorld\n\nel\n",
    explanation: "slice(-5) and substr(-5) both count from the end, returning the last 5 characters ('World'). substring() instead clamps any negative index to 0, so substring(-5) is the same as substring(0) — the whole string. When start > end, slice() just returns an empty string, but substring() SWAPS the two arguments, so substring(3,1) behaves like substring(1,3) ('el'). substr()'s second argument is a length, not an end index, and a negative length is treated as 0, yielding an empty string."
  });

  reg({
    id: "str-match-vs-matchall",
    category: 'js-strings', difficulty: "hard", type: "predict-output",
    prompt: "What does this log?",
    code: "var s = \"cat9 dog3 cat7\";\nconsole.log(s.match(/cat\\d/));\nconsole.log(s.match(/cat\\d/g));\nconsole.log([...s.matchAll(/cat(\\d)/g)].map(function (m) { return m[1]; }));",
    answer: "[ 'cat9', index: 0, input: 'cat9 dog3 cat7', groups: undefined ]\n[ 'cat9', 'cat7' ]\n[ '9', '7' ]",
    explanation: "match() without /g stops at the first match and returns a rich match object (with index/input/groups metadata). With /g it instead returns a flat array of just the matched substrings, discarding capture-group info. matchAll() always requires /g and returns an iterator of full match objects for EVERY match, so it's the only one that lets you pull the captured digit ($1 / m[1]) from each occurrence."
  });

  reg({
    id: "str-plus-concat-coercion",
    category: 'js-strings', difficulty: "hard", type: "predict-output",
    prompt: "What does this log?",
    code: "console.log(1 + \"2\");\nconsole.log(\"2\" + 1);\nconsole.log(1 + 2 + \"3\");\nconsole.log(\"3\" + 1 + 2);\nconsole.log([] + []);\nconsole.log([] + {});\nconsole.log({} + []);\nconsole.log([1, 2] + [3, 4]);",
    answer: "12\n21\n33\n312\n\n[object Object]\n[object Object]\n1,23,4",
    explanation: "+ prefers string concatenation the moment EITHER operand is a string, and evaluates left-to-right: 1+2+\"3\" first does 1+2=3 numerically, THEN concatenates '3'; \"3\"+1+2 concatenates immediately, so the 2 also gets appended as text. Arrays/objects are coerced to strings before concatenation: [].toString() is '', so []+[] is ''; {} .toString() is '[object Object]' for both [] +{} and {}+[] (here {} is just an object literal, not a block, since it's inside a function call argument); array+array stringifies each side via join(',') and concatenates: '1,2' + '3,4'."
  });

  reg({
    id: "str-emoji-length-spread",
    category: 'js-strings', difficulty: "hard", type: "predict-output",
    prompt: "What does this log?",
    code: "var emoji = \"😀\";\nconsole.log(emoji.length);\nconsole.log([...emoji].length);\nvar flag = \"🇺🇸\";\nconsole.log(flag.length);\nconsole.log([...flag].length);",
    answer: "2\n1\n4\n2",
    explanation: ".length counts UTF-16 code units, not visible characters. A single emoji is stored as a surrogate pair, so its .length is 2 even though it's one glyph; spreading a string iterates by Unicode CODE POINT, correctly counting it as 1. A flag emoji is actually two regional-indicator code points, each itself a surrogate pair — so .length is 4 (four code units) while the spread/code-point count is 2 (it does not fuse them into one, since that would require grapheme-cluster awareness, not plain code-point iteration)."
  });

  reg({
    id: "str-normalize-unicode",
    category: 'js-strings', difficulty: "hard", type: "predict-output",
    prompt: "What does this log?",
    code: "var nfc = \"\\u00e9\";\nvar nfd = \"e\\u0301\";\nconsole.log(nfc === nfd);\nconsole.log(nfc.length, nfd.length);\nconsole.log(nfc.normalize(\"NFC\") === nfd.normalize(\"NFC\"));\nconsole.log(nfc.localeCompare(nfd));",
    answer: "false\n1 2\ntrue\n0",
    explanation: "nfc is the single precomposed character 'é' (U+00E9); nfd is the visually identical 'e' followed by a combining acute accent (U+0301) — two different code unit sequences, so === is false and their .length differs (1 vs 2). normalize('NFC') converts both to the same precomposed form, making them equal. localeCompare is locale/collation-aware and treats the two as canonically equivalent, returning 0 even without normalizing first."
  });

  reg({
    id: "str-number-parsing-edge-cases",
    category: 'js-strings', difficulty: "hard", type: "predict-output",
    prompt: "What does this log?",
    code: "console.log(Number(\"\"));\nconsole.log(Number(\" \"));\nconsole.log(Number(\"  123  \"));\nconsole.log(Number(\"123abc\"));\nconsole.log(parseInt(\"123abc\"));\nconsole.log(parseFloat(\"3.14.15\"));\nconsole.log(parseInt(\"\"));\nconsole.log(Number(null));\nconsole.log(Number(undefined));",
    answer: "0\n0\n123\nNaN\n123\n3.14\nNaN\n0\nNaN",
    explanation: "Number() treats an empty or whitespace-only string as 0, and trims surrounding whitespace around a valid number, but returns NaN the instant any non-numeric trailing character is present ('123abc' fails entirely). parseInt/parseFloat instead read as many leading valid characters as they can and stop, so '123abc' parses to 123 and '3.14.15' stops at the second dot, giving 3.14. parseInt('') has nothing to parse, so it's NaN. Number(null) is 0, but Number(undefined) is NaN — null and undefined are NOT treated the same by Number()."
  });

  reg({
    id: "str-substring-off-by-one-spot-bug",
    category: 'js-strings', difficulty: "hard", type: "spot-the-bug",
    prompt: "This should return the first n characters, but the result is one character short. Find the bug.",
    code: "function firstN(str, n) {\n  // BUG: substring's second argument is an end INDEX, not a character count\n  return str.substring(0, n - 1);\n}\n\nconsole.log(firstN(\"hello world\", 5)); // expected \"hello\", logs \"hell\"",
    answer: "function firstN(str, n) {\n  return str.substring(0, n);\n}",
    explanation: "substring(start, end) already treats `end` as an EXCLUSIVE end index, which is what makes it return exactly (end - start) characters. Subtracting 1 from n double-discounts that, chopping off one character too many. substring(0, n) alone already returns exactly the first n characters."
  });

})();
