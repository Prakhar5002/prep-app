window.PREP_SITE.registerTopic({
  id: 'js-modules',
  module: 'js',
  title: 'Modules (ESM vs CJS)',
  estimatedReadTime: '40 min',
  tags: ['esm', 'commonjs', 'modules', 'bundlers', 'tree-shaking', 'dual-package', 'node', 'webpack', 'metro'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>JavaScript has two module systems in production today: <strong>ESM</strong> (ECMAScript Modules — <code>import</code>/<code>export</code>, the official standard) and <strong>CJS</strong> (CommonJS — <code>require</code>/<code>module.exports</code>, the original Node convention). They look similar but have profoundly different semantics: ESM is static, async, live-bound; CJS is dynamic, synchronous, value-copied. Almost every real-world bug at the boundary comes from confusing the two.</p>
<ul>
  <li><strong>ESM:</strong> static syntax (parsable without execution), top-level <code>import</code>/<code>export</code>, async load, live read-only bindings, file-as-module.</li>
  <li><strong>CJS:</strong> dynamic <code>require()</code> (runs as a function), <code>module.exports</code> assignment, synchronous, value snapshot at the moment of import.</li>
  <li><strong>Tree shaking</strong> works well only with ESM. Bundlers can statically analyze named exports; CJS's dynamic shape blocks dead-code elimination.</li>
  <li><strong>Node interop:</strong> ESM can import CJS (with namespace caveats); CJS cannot statically <code>import</code> ESM (only via dynamic <code>import()</code>).</li>
  <li><strong>Detection:</strong> <code>"type": "module"</code> in package.json, <code>.mjs</code> / <code>.cjs</code> extension, <code>--experimental-vm-modules</code>, or bundler-specific config.</li>
  <li><strong>Dual package hazard:</strong> a library publishing both ESM and CJS can be loaded twice in one process — different copies of state.</li>
  <li><strong>RN / Metro:</strong> Metro accepts both ESM source and CJS source; it always emits CJS-style bundles. Tree shaking works only on ESM imports.</li>
  <li><strong>Modern stack:</strong> author in ESM + TypeScript; let the bundler emit whatever format the runtime wants.</li>
</ul>
<p><strong>Mantra:</strong> "Author in ESM, tree-shake aggressively, mind the interop, never publish both formats without an export map."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What is a "module" in JavaScript?</h3>
<p>A module is a unit of code with its own scope, an explicit list of things it exposes (exports), and an explicit list of things it depends on (imports). The <em>module system</em> is the rulebook that says how those imports and exports resolve and execute.</p>

<h3>The historical lineage</h3>
<table>
  <thead><tr><th>System</th><th>Era</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td>IIFE</td><td>2008–2013</td><td>"Module pattern" via closures: wrap code in <code>(function(){ })()</code> to escape global scope.</td></tr>
    <tr><td>CommonJS (CJS)</td><td>2009–present</td><td>Node's original system; synchronous file-based <code>require()</code>.</td></tr>
    <tr><td>AMD</td><td>2010–2018</td><td>Browser-side async loader (<code>RequireJS</code>); now obsolete.</td></tr>
    <tr><td>UMD</td><td>2012–present</td><td>Wrapper that auto-detects CJS vs AMD vs global; bundle output for libraries.</td></tr>
    <tr><td>ES Modules (ESM)</td><td>2015 spec → 2017 browsers → 2019 Node</td><td>Official standard; static, async, live-bound.</td></tr>
  </tbody>
</table>

<h3>Why two systems still coexist</h3>
<ol>
  <li><strong>Massive ecosystem inertia.</strong> Millions of npm packages publish CJS; rewriting them is impractical.</li>
  <li><strong>Different semantics.</strong> CJS is synchronous and dynamic — Node could ship it in 2009. ESM requires async loading and static analysis — needs a different runtime model.</li>
  <li><strong>Browser behavior.</strong> ESM in browsers is loaded over HTTP (one round-trip per import without HTTP/2 push) — significant latency on cold load. Bundlers exist partly to flatten this.</li>
</ol>

<h3>Why bundlers exist (one paragraph)</h3>
<p>The browser ESM model — fetch each import over HTTP — is too slow for app bundles with thousands of modules. Bundlers (Webpack, Rollup, esbuild, Vite, Metro) read your module graph statically, concatenate it into a few files, eliminate dead code (tree shaking), and emit a runtime appropriate for the target. They are the bridge between "author in ESM" and "ship in whatever format works."</p>

<h3>Why interviewers ask</h3>
<ul>
  <li>The CJS/ESM boundary is where <em>most</em> production-grade JavaScript bugs live — circular imports, dual packages, the "esModuleInterop" question.</li>
  <li>Tree shaking, side effects, and bundle size all depend on understanding module semantics.</li>
  <li>Library authoring requires knowing how to publish for both worlds without breaking either.</li>
  <li>Server-side: Node's quirky ESM-from-CJS rules cause the "I can't import this package" pain in modern Express / Next backends.</li>
</ul>

<h3>What "good" looks like</h3>
<ul>
  <li>Source code is ESM (<code>import</code>/<code>export</code>) regardless of output format.</li>
  <li>Library packages declare both <code>"main"</code> (CJS) and <code>"exports"</code> (with conditional exports) for dual-format support.</li>
  <li>Tree shaking enabled in production bundles; <code>"sideEffects": false</code> in package.json where applicable.</li>
  <li>No mixed-format authoring within a single package.</li>
  <li>Circular imports are diagnosed and broken (live bindings make them subtler than in CJS).</li>
  <li>For RN / Hermes: source can be ESM, but final bundle is CJS-style; tree shaking works during bundling.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>Five fundamental differences</h3>
<table>
  <thead><tr><th>Property</th><th>CJS</th><th>ESM</th></tr></thead>
  <tbody>
    <tr><td>Syntax</td><td><code>require()</code>, <code>module.exports</code></td><td><code>import</code>, <code>export</code></td></tr>
    <tr><td>Top-level position</td><td>Anywhere — runs at evaluation time</td><td>Top-level only (with rare TLA exceptions)</td></tr>
    <tr><td>Resolution</td><td>Synchronous, dynamic</td><td>Asynchronous, static</td></tr>
    <tr><td>Bindings</td><td>Value snapshot</td><td>Live read-only references</td></tr>
    <tr><td>Tree-shakable</td><td>No (dynamic shape)</td><td>Yes (static analyzable)</td></tr>
    <tr><td>Execution timing</td><td>On <code>require</code> call</td><td>After parsing the entire graph</td></tr>
  </tbody>
</table>

<h3>"Live bindings" in 60 seconds</h3>
<pre><code class="language-js">// counter.mjs (ESM)
export let count = 0;
export function inc() { count++; }

// app.mjs
import { count, inc } from './counter.mjs';
console.log(count);   // 0
inc();
console.log(count);   // 1 — bindings are LIVE
count = 5;            // ❌ TypeError — read-only on the import side

// counter.cjs (CJS)
let count = 0;
function inc() { count++; }
module.exports = { count, inc };

// app.cjs
const { count, inc } = require('./counter.cjs');
console.log(count);   // 0
inc();
console.log(count);   // 0 — value was COPIED at require time
</code></pre>

<h3>How ESM loads — the 4 phases</h3>
<ol>
  <li><strong>Construction:</strong> the loader parses each module to find imports, then recursively fetches them. Builds the dependency graph without executing.</li>
  <li><strong>Instantiation:</strong> wires the live bindings — <code>import { x } from './a'</code> creates a binding from <code>x</code> to <code>./a</code>'s exported slot.</li>
  <li><strong>Evaluation:</strong> walks the graph in dependency order and executes each module body once.</li>
  <li><strong>Use:</strong> imports are now usable.</li>
</ol>
<p>This is why ESM <em>can</em> exist in browsers: the static syntax allows the loader to build the graph before any code runs.</p>

<h3>How CJS loads — one phase</h3>
<pre><code class="language-text">require('./foo')
   ↓
1. Resolve path (algorithm: file, then dir/index, then up the tree)
2. Check cache (if seen, return cached module.exports)
3. Read file synchronously
4. Wrap in (function (exports, require, module, __filename, __dirname) { ... })
5. Execute. The function's last assignment to module.exports is the exported value.
6. Cache.
7. Return module.exports.
</code></pre>
<p>Synchronous, dynamic, and the cache is the source of truth for "have we loaded this?"</p>

<h3>The "default export" mismatch</h3>
<pre><code class="language-js">// CJS authoring
module.exports = function () { /* ... */ };

// ESM consuming
import fn from './lib.cjs';     // works thanks to esModuleInterop / __esModule fixup
import * as ns from './lib.cjs';
ns.default;                      // also works
</code></pre>
<p>Without <code>esModuleInterop</code>, you'd write <code>import * as fn from './lib.cjs'</code>, and TypeScript / bundlers would complain about the ergonomic mismatch. Modern tsconfigs enable <code>esModuleInterop: true</code> by default.</p>

<h3>Detection — how Node decides "CJS or ESM"</h3>
<table>
  <thead><tr><th>Signal</th><th>Decision</th></tr></thead>
  <tbody>
    <tr><td>File extension <code>.mjs</code></td><td>ESM, regardless of package.json</td></tr>
    <tr><td>File extension <code>.cjs</code></td><td>CJS, regardless of package.json</td></tr>
    <tr><td>File extension <code>.js</code> + <code>"type": "module"</code> in package.json</td><td>ESM</td></tr>
    <tr><td>File extension <code>.js</code> + <code>"type": "commonjs"</code> or absent</td><td>CJS</td></tr>
    <tr><td>Top-level <code>import</code>/<code>export</code> (Node 22+)</td><td>ESM (auto-detected)</td></tr>
  </tbody>
</table>

<h3>Top-level await</h3>
<p>ESM allows <code>await</code> at the top level of a module body. CJS does not. This is one reason CJS can never replace ESM: TLA breaks the synchronous import contract.</p>
<pre><code class="language-js">// data.mjs
export const config = await fetch('/config').then(r =&gt; r.json());

// Importing 'data.mjs' suspends until config resolves; subsequent imports wait.
</code></pre>

<h3>Dynamic <code>import()</code> (works everywhere)</h3>
<pre><code class="language-js">// Both CJS and ESM support dynamic import() — returns a Promise
const mod = await import('./feature.mjs');
mod.doStuff();
</code></pre>
<p>This is the only way for CJS to load ESM. Non-optional in modern stacks.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>ESM syntax — every flavor</h3>
<pre><code class="language-js">// Named exports
export const PI = 3.14;
export function add(a, b) { return a + b; }
export class Foo {}

// Default export
export default function () { /* ... */ }

// Re-export
export { default as Foo } from './foo.mjs';
export * from './bar.mjs';
export * as Bar from './bar.mjs';

// Named imports
import { add, PI } from './math.mjs';
import { add as plus } from './math.mjs';

// Default import
import Foo from './foo.mjs';

// Namespace import
import * as math from './math.mjs';

// Mixed
import Foo, { add } from './math.mjs';

// Side-effect import (no bindings, run for effects)
import './polyfill.mjs';

// Dynamic
const mod = await import('./lazy.mjs');

// Import attributes (Node 22+, browsers)
import data from './data.json' with { type: 'json' };
</code></pre>

<h3>CJS syntax</h3>
<pre><code class="language-js">// Named exports — multiple flavors
exports.add = (a, b) =&gt; a + b;       // attaches to the existing exports object
module.exports.PI = 3.14;             // same thing
module.exports = { add, PI };         // OVERWRITES — careful

// Default export
module.exports = function () { /* ... */ };

// Importing
const math = require('./math');
const { add, PI } = require('./math');
const Foo = require('./foo');         // default-style
</code></pre>

<h3>Resolution algorithm — Node CJS</h3>
<pre><code class="language-text">require('./util')
   ↓
1. Try ./util.js
2. Try ./util.json
3. Try ./util/index.js
4. Try ./util/package.json's "main" field
5. Else throw

require('lodash')
   ↓
1. Walk up node_modules dirs from current location
2. Find lodash/package.json
3. Resolve "main" field (default "index.js")
4. Apply same file-extension fallback
</code></pre>

<h3>Resolution — Node ESM with import maps</h3>
<p>ESM resolution requires explicit file extensions:</p>
<pre><code class="language-js">// CJS allows
require('./util');               // resolves ./util.js

// ESM requires the extension
import './util.js';              // OK
import './util';                 // ❌ — error in raw Node ESM
</code></pre>
<p>Bundlers (Webpack, Vite, Metro) often add a "resolve.extensions" config so omitted extensions still work.</p>

<h3>package.json fields that matter</h3>
<table>
  <thead><tr><th>Field</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td><code>"main"</code></td><td>CJS entry — legacy / Node default</td></tr>
    <tr><td><code>"module"</code></td><td>ESM entry (bundler-recognized convention; not Node)</td></tr>
    <tr><td><code>"types"</code> / <code>"typings"</code></td><td>TS declaration entry</td></tr>
    <tr><td><code>"exports"</code></td><td>Modern, conditional, the right answer for libraries</td></tr>
    <tr><td><code>"sideEffects"</code></td><td>Tells bundlers which files are pure (tree-shakable)</td></tr>
    <tr><td><code>"type"</code></td><td><code>"module"</code> or <code>"commonjs"</code> — affects <code>.js</code> file interpretation</td></tr>
    <tr><td><code>"bin"</code></td><td>CLI entry points</td></tr>
    <tr><td><code>"engines"</code></td><td>Node version requirements</td></tr>
  </tbody>
</table>

<h3>Conditional exports — the modern dual package</h3>
<pre><code class="language-jsonc">{
  "name": "my-lib",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "default": "./dist/index.mjs"
    },
    "./feature": {
      "types": "./dist/feature.d.ts",
      "import": "./dist/feature.mjs",
      "require": "./dist/feature.cjs"
    }
  },
  "files": ["dist"]
}
</code></pre>
<p>Properties of this map:</p>
<ul>
  <li><strong>Subpath isolation:</strong> consumers can only import paths declared in the map (<code>my-lib</code>, <code>my-lib/feature</code>). Internal files become unreachable.</li>
  <li><strong>Conditional resolution:</strong> Node resolves <code>"import"</code> for ESM consumers, <code>"require"</code> for CJS. <code>"types"</code> for TS.</li>
  <li><strong>Order matters:</strong> first matching condition wins. Always put <code>"types"</code> first (or in its own block).</li>
</ul>

<h3>"sideEffects" — the tree-shaking lever</h3>
<pre><code class="language-jsonc">{
  "sideEffects": false,                 // entire package is pure — bundler can drop unused exports
  "sideEffects": ["./polyfills.js", "*.css"]   // these files have side effects; everything else pure
}
</code></pre>
<p>Without this hint, bundlers conservatively keep the whole module.</p>

<h3>Tree shaking — what makes it work</h3>
<ul>
  <li>ESM <code>import</code>/<code>export</code> (static; analyzable).</li>
  <li>No top-level side effects (no <code>console.log</code>, no class registration, no module-init code).</li>
  <li><code>"sideEffects": false</code> in package.json.</li>
  <li>Bundler in production mode (Webpack, Rollup, esbuild — all support it).</li>
  <li>Pure annotations (<code>/*#__PURE__*/</code>) where bundler can't tell.</li>
</ul>

<h3>Tree shaking — what defeats it</h3>
<ul>
  <li>CJS <code>require()</code> — dynamic; bundler keeps everything.</li>
  <li>Re-exporting <code>export * from './x'</code> can lose granularity if downstream isn't pure.</li>
  <li>Module-init side effects (<code>const x = setupSomething();</code>).</li>
  <li>Class field decorators that register globally (e.g., older MobX).</li>
</ul>

<h3>Circular imports</h3>
<pre><code class="language-js">// a.mjs
import { b } from './b.mjs';
export const a = () =&gt; b();

// b.mjs
import { a } from './a.mjs';
export const b = () =&gt; 'b';
</code></pre>
<p>ESM handles this gracefully thanks to live bindings: each module's exports are wired before bodies execute. The cycle is detected; the loader returns whatever's available so far.</p>
<p>CJS handles it less gracefully: at the moment of <code>require</code> in the cycle, the partially-evaluated <code>module.exports</code> is returned. If <code>module.exports = { a }</code> hasn't run yet, the consumer gets <code>{}</code>. Common bug: imports of unresolved values appear as <code>undefined</code>.</p>

<h3>Importing JSON</h3>
<pre><code class="language-js">// CJS
const data = require('./data.json');

// ESM (Node 22+ stable, browsers)
import data from './data.json' with { type: 'json' };

// Older ESM Node
import { readFileSync } from 'fs';
const data = JSON.parse(readFileSync('./data.json', 'utf8'));
</code></pre>

<h3>__filename / __dirname in ESM</h3>
<p>Don't exist in ESM. Workaround:</p>
<pre><code class="language-js">import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
</code></pre>

<h3>Browser ESM via &lt;script type="module"&gt;</h3>
<pre><code class="language-html">&lt;script type="module" src="./app.js"&gt;&lt;/script&gt;
</code></pre>
<ul>
  <li>Browser fetches each import over HTTP.</li>
  <li>Modules are deferred by default (similar to <code>defer</code>).</li>
  <li>CORS rules apply for cross-origin imports.</li>
  <li>Production: bundle to flatten the import graph; serve a single (or few) file(s).</li>
</ul>

<h3>Metro / RN module behavior</h3>
<ul>
  <li>Metro accepts ESM and CJS sources transparently; uses Babel to lower ESM to CJS-style during bundling.</li>
  <li>Final bundle is a single file with a custom module-loader runtime; <code>__d(id, factory)</code> registers each module.</li>
  <li>Tree shaking: Metro 0.73+ supports it; production builds respect <code>"sideEffects"</code>.</li>
  <li>Hermes runtime supports ES2015+ syntax; Hermes does <em>not</em> have native ESM — Metro pre-processes everything.</li>
</ul>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: ESM → CJS interop in modern Node</h3>
<pre><code class="language-js">// commonjs-lib/index.cjs (legacy package on npm)
module.exports = {
  add: (a, b) =&gt; a + b,
  multiply: (a, b) =&gt; a * b,
};

// app.mjs (ESM consumer)
import lib from 'commonjs-lib';        // default import — gets module.exports
const { add } = lib;
import { add as namedAdd } from 'commonjs-lib';   // named import — works since Node 14
add(1, 2);                              // 3
</code></pre>

<h3>Example 2: CJS → ESM interop (only via dynamic import)</h3>
<pre><code class="language-js">// esm-lib/index.mjs
export function greet(name) { return \`hi \${name}\`; }

// legacy.cjs
// ❌ const { greet } = require('esm-lib');   — throws ERR_REQUIRE_ESM in strict mode
// ✅ Use dynamic import (returns Promise)
async function main() {
  const { greet } = await import('esm-lib');
  console.log(greet('world'));
}
main();
</code></pre>

<h3>Example 3: Authoring a dual-package library</h3>
<pre><code class="language-jsonc">// my-lib/package.json
{
  "name": "my-lib",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "sideEffects": false,
  "files": ["dist"]
}
</code></pre>
<pre><code class="language-jsonc">// tsup.config.ts (or rollup, etc.)
{
  "entry": ["src/index.ts"],
  "format": ["esm", "cjs"],
  "dts": true,
  "clean": true,
  "treeshake": true
}
</code></pre>

<h3>Example 4: A circular import bug in CJS</h3>
<pre><code class="language-js">// a.cjs
const { b } = require('./b');
function a() { return 'a' + b(); }
module.exports = { a };

// b.cjs
const { a } = require('./a');
function b() { return 'b' + (a ? a() : '?'); }   // a is undefined!
module.exports = { b };

// runner.cjs
const { a } = require('./a');
console.log(a());   // 'ab?'   — a was the partial export when b loaded
</code></pre>
<p>ESM equivalent works correctly because of live bindings:</p>
<pre><code class="language-js">// a.mjs
import { b } from './b.mjs';
export function a() { return 'a' + b(); }

// b.mjs
import { a } from './a.mjs';
export function b() { return 'b' + a();}   // a is the live binding; resolved at call time

// runner.mjs
import { a } from './a.mjs';
console.log(a());   // 'aba' — but watch for infinite recursion if not guarded
</code></pre>

<h3>Example 5: Tree-shaking in action</h3>
<pre><code class="language-js">// utils.mjs
export function used() { return 1; }
export function unused() {
  const heavy = require('heavy-lib');   // would balloon the bundle
  return heavy.compute();
}

// app.mjs
import { used } from './utils.mjs';
console.log(used());

// With tree-shaking + "sideEffects": false:
// - 'unused' is dropped
// - 'heavy-lib' never imported
// Bundle: ~200 bytes instead of ~1MB
</code></pre>

<h3>Example 6: Re-exporting safely</h3>
<pre><code class="language-js">// barrel.mjs — re-exports for ergonomic imports
export { Button } from './Button.mjs';
export { Card } from './Card.mjs';
export { Input } from './Input.mjs';

// app.mjs
import { Button, Card } from './barrel.mjs';
// Tree-shaking still works as long as everything in the barrel is pure
// (no module-init side effects in any of them).
</code></pre>

<h3>Example 7: Dynamic feature loading</h3>
<pre><code class="language-tsx">// React component that lazy-loads a heavy module on demand
const ChartScreen = React.lazy(() =&gt; import('./screens/ChartScreen'));

function App() {
  return (
    &lt;Suspense fallback={&lt;Spinner /&gt;}&gt;
      &lt;ChartScreen /&gt;
    &lt;/Suspense&gt;
  );
}
</code></pre>
<p>The bundler emits a separate chunk for <code>./screens/ChartScreen</code>; the chunk loads on first render of the component.</p>

<h3>Example 8: Reading <code>import.meta</code></h3>
<pre><code class="language-js">// In ESM you have import.meta — environment metadata
import.meta.url;          // "file:///path/to/file.mjs"
import.meta.resolve('./other.mjs');   // resolved URL (Node 20+)

// Vite extends it with import.meta.env
import.meta.env.MODE;     // "development" or "production"
import.meta.env.VITE_API_URL;
</code></pre>

<h3>Example 9: Migrating CJS to ESM</h3>
<pre><code class="language-js">// Before — index.js (CJS)
const { add, multiply } = require('./math');
module.exports = { compute: (a, b) =&gt; multiply(add(a, b), 2) };

// After — index.mjs (ESM)
import { add, multiply } from './math.mjs';
export const compute = (a, b) =&gt; multiply(add(a, b), 2);
</code></pre>
<p>Migration steps:</p>
<ol>
  <li>Add <code>"type": "module"</code> to package.json.</li>
  <li>Rename or update extensions (<code>.js</code>, <code>.mjs</code>, <code>.cjs</code>).</li>
  <li>Replace <code>require</code>/<code>module.exports</code> with <code>import</code>/<code>export</code>.</li>
  <li>Add file extensions to all imports (or configure bundler).</li>
  <li>Replace <code>__dirname</code>/<code>__filename</code> with <code>import.meta.url</code> derivations.</li>
  <li>Replace <code>require.resolve</code> with <code>import.meta.resolve</code> (Node 20+) or a workaround.</li>
</ol>

<h3>Example 10: Diagnosing dual-package hazard</h3>
<pre><code class="language-text">Bug: a singleton pattern returns two different instances.

Root cause:
  Library 'state-lib' publishes both ESM and CJS.
  Your app's main entry imports it as ESM.
  A transitive dependency requires it as CJS.
  Node loads BOTH copies — ESM and CJS — in the same process.
  Each copy has its own module-level state.

Symptoms:
  - "Why is the user logged in twice?"
  - "Why does setState in feature A not propagate to feature B?"

Fix:
  - Use a proper "exports" map that isolates the package to one resolution per process.
  - Or move the singleton state outside the library (e.g., a globalThis-keyed store).
  - Or eliminate the dual format — publish ESM-only and force consumers to migrate.
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>ESM imports require file extensions in Node</h3>
<p>Raw Node ESM resolution does <em>not</em> auto-append <code>.js</code>:</p>
<pre><code class="language-js">// In ESM Node:
import './util';        // ❌ ERR_MODULE_NOT_FOUND
import './util.js';     // ✅
</code></pre>
<p>Bundlers and TypeScript usually paper over this. If you're authoring TS that emits ESM, configure <code>"moduleResolution": "Bundler"</code> or use the <code>.js</code> extension in source — TypeScript 5.x specifically allows this for ESM emit.</p>

<h3>Cannot conditionally <code>import</code></h3>
<pre><code class="language-js">// ❌ ESM static imports must be top-level, unconditional
if (x) import './foo';

// ✅ Use dynamic import
if (x) await import('./foo');
</code></pre>

<h3>Top-level <code>this</code></h3>
<ul>
  <li>CJS: <code>this === module.exports</code> at the top level.</li>
  <li>ESM: <code>this === undefined</code>.</li>
</ul>
<p>Some legacy code patterns (<code>this.foo = ...</code> at file scope) silently break when migrated to ESM.</p>

<h3>JSON imports caveats</h3>
<p>Node ESM requires <code>with { type: 'json' }</code> for JSON imports (Node 22+ stable, earlier had <code>--experimental-json-modules</code>). Bundlers handle JSON natively, so the syntax difference is bundler-dependent.</p>

<h3>Browser ESM CORS</h3>
<p>Cross-origin <code>&lt;script type="module"&gt;</code> requires <code>Access-Control-Allow-Origin</code> header on the response. Same-origin loads are fine. Inline modules use <code>nonce</code> or <code>integrity</code> for CSP.</p>

<h3>Bundler "alias" tricks confusing imports</h3>
<pre><code class="language-jsonc">// webpack.config.js or tsconfig paths
{
  "alias": { "@": "./src" }
}
</code></pre>
<pre><code class="language-js">import x from '@/components/Button';
</code></pre>
<p>Aliases are bundler-only conventions. Test runners (Jest, Vitest) need separate alias config; failure to mirror in tests is a common source of "works in app, fails in test."</p>

<h3>Strict mode</h3>
<p>ESM is strict mode by default. CJS is not. Migrating CJS code to ESM may surface latent bugs (<code>'use strict'</code> issues with arguments, octal literals, undeclared assignments).</p>

<h3>"const enum" + isolated modules</h3>
<p>TypeScript <code>const enum</code> doesn't transpile cleanly when each file is compiled independently (Babel, esbuild). With <code>--isolatedModules</code>, <code>const enum</code> is forbidden. Use string-union types instead.</p>

<h3>Re-export of types in ESM</h3>
<pre><code class="language-ts">// Pure type re-exports must be marked
export type { User } from './user';
// Otherwise bundlers may emit a runtime require that doesn't exist.
</code></pre>

<h3>Mixed import in same file</h3>
<pre><code class="language-js">// Allowed in ESM
import a from './a';
import b from './b';
const c = await import('./c');     // top-level await — only in ESM

// CJS must use require for static, can call await import() for dynamic ESM
</code></pre>

<h3>Library re-imports the main bundle</h3>
<p>If your library publishes both ESM and CJS, and your library's <em>own</em> internal imports use the wrong format, you can pull in two copies of yourself. Tools like <code>publint</code> and <code>arethetypeswrong.github.io</code> catch this.</p>

<h3>Hermes &amp; ESM</h3>
<p>Hermes (RN's JS engine) does not natively support ESM — it expects CJS-style bundles. Metro bundles ESM source into CJS-equivalent output. If you're authoring an RN library, ship CJS or both; ESM-only won't work for older RN versions.</p>

<h3>Top-level await in modules that import each other</h3>
<p>If module A awaits a network resource and module B imports A, B's evaluation is deferred until A resolves. This can dramatically slow startup. Apply TLA judiciously; prefer constructing async resources inside functions called on demand.</p>

<h3>Module evaluation order with ESM</h3>
<p>ESM evaluates modules in <em>post-order</em> of the dependency graph (leaves first). This is well-defined; mistakes usually arise when assuming a different order.</p>

<h3>"package.json" parsing</h3>
<p>Node treats package.json as the authority for <code>"type"</code>. Be careful with monorepos: each workspace has its own package.json; the resolver walks up the tree.</p>

<h3>Symlinks and pnpm</h3>
<p>pnpm's symlinked node_modules can confuse resolvers that don't preserve symlinks. Modern Node + bundlers handle it; older tools may need <code>--preserve-symlinks</code> flags.</p>

<h3>Default-export gotcha</h3>
<pre><code class="language-js">// Many tutorials say:
export default { add, sub };
// Now consumers do:
import math from './math';
math.add(1, 2);
// vs the ergonomic:
import { add } from './math';   // ❌ doesn't work — only default exported

// Prefer named exports unless the entire module IS one thing.
</code></pre>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: <code>module.exports</code> overwrite after attaching</h3>
<pre><code class="language-js">// BAD — first attaches, then overwrites; first attachments lost
exports.foo = 1;
module.exports = { bar: 2 };
// Consumers get { bar: 2 } only.

// GOOD — pick one style:
module.exports = { foo: 1, bar: 2 };
</code></pre>

<h3>Bug 2: Mixing <code>require</code> and <code>import</code> in same file</h3>
<pre><code class="language-js">// In ESM:
import x from './x';
const y = require('./y');   // ❌ require is not defined in ESM by default
// Workaround: const require = createRequire(import.meta.url);
</code></pre>

<h3>Bug 3: Importing default that's actually named</h3>
<pre><code class="language-js">// CJS module
exports.add = (a, b) =&gt; a + b;

// Wrong ESM consumer:
import add from './math';
add(1, 2);   // TypeError — 'add' is undefined; default doesn't exist
// FIX: import { add } from './math';
</code></pre>

<h3>Bug 4: Forgetting <code>.js</code> in ESM imports (Node)</h3>
<pre><code class="language-js">// In ESM Node:
import './util';   // ❌ ERR_MODULE_NOT_FOUND

// FIX
import './util.js';
</code></pre>

<h3>Bug 5: Side effects in "side-effect-free" packages</h3>
<pre><code class="language-jsonc">// package.json declares "sideEffects": false
// But code does:
console.log('library loaded');   // side effect!
window.MyLib = ...;               // side effect!

// Bundler trusts the lie; tree-shaking may eliminate the file
// → Side effects silently disappear from the bundle.
</code></pre>

<h3>Bug 6: Circular import returning undefined</h3>
<pre><code class="language-js">// a.cjs and b.cjs cross-require each other.
// Whichever is required second sees undefined for properties not yet attached.

// FIX — refactor to break the cycle, or use lazy access:
function getA() { return require('./a').a; }
</code></pre>

<h3>Bug 7: <code>require</code> at runtime in production-bundled code</h3>
<pre><code class="language-js">// Bundler doesn't see a static require call → can't include the module → ReferenceError
function loadFeature(name) {
  return require(\`./features/\${name}\`);   // ❌ dynamic require
}

// FIX — use a known map or dynamic import
const features = { foo: () =&gt; import('./features/foo') };
</code></pre>

<h3>Bug 8: Dual package — two copies in memory</h3>
<p>Library publishes both ESM and CJS without a proper <code>"exports"</code> map. App imports it as ESM; transitive dependency requires it as CJS. Each copy has its own module-level state. Singleton patterns break.</p>

<h3>Bug 9: Importing a CJS package's "default"</h3>
<pre><code class="language-js">// Without esModuleInterop in tsconfig:
import express from 'express';
// TS error — "module has no default export"

// FIX 1: enable esModuleInterop (modern default)
// FIX 2: import * as express from 'express'   then express()
</code></pre>

<h3>Bug 10: Top-level await blocking startup</h3>
<pre><code class="language-js">// config.mjs
export const config = await fetch('/config').then(r =&gt; r.json());

// Every importer of config.mjs waits for fetch.
// Multi-second startup delay.

// FIX — defer the fetch:
let cachedConfig;
export async function getConfig() {
  if (cachedConfig) return cachedConfig;
  cachedConfig = await fetch('/config').then(r =&gt; r.json());
  return cachedConfig;
}
</code></pre>

<h3>Anti-pattern 1: Default exports for libraries</h3>
<pre><code class="language-js">export default class FooClient { /*...*/ }
// Consumers do:
import FooClient from 'foo';   // works
import { FooClient } from 'foo';  // ❌ no named export
// + IDE auto-import gets confused; rename refactors break everywhere.

// PREFER named exports.
</code></pre>

<h3>Anti-pattern 2: Barrel files of everything</h3>
<pre><code class="language-js">// src/index.ts
export * from './a';
export * from './b';
export * from './c';
// ... 50 modules
</code></pre>
<p>Tools that need to import a single thing (Storybook, test runners) parse the entire barrel, which transitively pulls in everything. Tree-shaking helps in production bundles but slows IDE / test startup. Barrel files are convenient but expensive — use them sparingly.</p>

<h3>Anti-pattern 3: <code>require</code> + dynamic key</h3>
<pre><code class="language-js">// Defeats bundler analysis
const mod = require(modName);
</code></pre>

<h3>Anti-pattern 4: Publishing without <code>"exports"</code></h3>
<p>Modern libraries should always declare <code>"exports"</code>. Without it, consumers can deep-import internals (<code>my-lib/dist/internal/private.js</code>), creating breakage when you refactor.</p>

<h3>Anti-pattern 5: Not declaring <code>"sideEffects"</code></h3>
<p>If your library is purely functional, declaring <code>"sideEffects": false</code> can shrink consumer bundles dramatically. Skipping it is leaving free perf on the table.</p>

<h3>Anti-pattern 6: Mutable global state at module scope</h3>
<pre><code class="language-js">// foo.mjs
let counter = 0;
export function increment() { counter++; }
export function get() { return counter; }

// Tests fail mysteriously when run in parallel — modules are cached and shared.
</code></pre>

<h3>Anti-pattern 7: <code>module.exports = require('./internal')</code></h3>
<p>Re-exports through CJS are fine, but encourage tree-shaking-busting deep imports. Use ESM <code>export *</code> with explicit lists where possible.</p>

<h3>Anti-pattern 8: Long migration paths</h3>
<p>"We're 60% migrated to ESM." This state lingers for years. Either commit to a hard cutover or accept a permanent dual-format setup with <code>"exports"</code> maps.</p>

<h3>Anti-pattern 9: Coupling production code to bundler aliases</h3>
<p>Path aliases like <code>@/components</code> are convenient but lock you into the bundler. When publishing a library, resolve them at build time so consumers don't need the alias.</p>

<h3>Anti-pattern 10: Skipping <code>publint</code> / <code>are-the-types-wrong</code> on library releases</h3>
<p>These tools catch dual-package hazards, missing <code>"exports"</code> conditions, type/runtime mismatches. Run them in CI on every release.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '🎤 Interview Patterns',
      html: `
<h3>The 12 questions worth rehearsing</h3>
<table>
  <thead><tr><th>Question</th><th>One-liner</th></tr></thead>
  <tbody>
    <tr><td><em>What's the difference between ESM and CJS?</em></td><td>Static + async + live-bound vs dynamic + sync + value-copied.</td></tr>
    <tr><td><em>What's a live binding?</em></td><td>The importer references the exporter's binding slot directly; mutations are visible.</td></tr>
    <tr><td><em>How does Node decide ESM vs CJS?</em></td><td>File extension (.mjs/.cjs) or <code>"type"</code> in package.json; auto-detect from syntax in 22+.</td></tr>
    <tr><td><em>Why does ESM enable tree shaking?</em></td><td>Static syntax lets bundlers prove which exports are unused.</td></tr>
    <tr><td><em>What's <code>"sideEffects": false</code>?</em></td><td>Tells bundlers the package is pure so it can drop unused modules entirely.</td></tr>
    <tr><td><em>Can you require an ESM module from CJS?</em></td><td>Only via dynamic <code>await import()</code>; static <code>require</code> throws.</td></tr>
    <tr><td><em>What's a dual-package hazard?</em></td><td>Same library loaded as both ESM and CJS in one process; module state diverges.</td></tr>
    <tr><td><em>What does <code>esModuleInterop</code> do?</em></td><td>TS flag that synthesizes default imports for CJS modules so <code>import x from 'cjs'</code> works.</td></tr>
    <tr><td><em>What's <code>import.meta</code>?</em></td><td>ESM-only object with module metadata (<code>url</code>, sometimes <code>env</code>, <code>resolve</code>).</td></tr>
    <tr><td><em>What's a top-level await?</em></td><td>ESM-only ability to <code>await</code> at module scope; suspends importers until the await resolves.</td></tr>
    <tr><td><em>How do you migrate from CJS to ESM?</em></td><td>Set <code>"type": "module"</code>, rewrite require/exports, add file extensions, replace <code>__dirname</code>.</td></tr>
    <tr><td><em>How do circular imports work in ESM?</em></td><td>Live bindings let modules see partial exports of each other; usually OK, but watch for use-before-init.</td></tr>
  </tbody>
</table>

<h3>Live coding warmups</h3>
<ol>
  <li><em>"Convert this CJS file to ESM."</em>
    <pre><code class="language-js">// before
const { add } = require('./math');
module.exports.compute = (a, b) =&gt; add(a, b) * 2;

// after
import { add } from './math.mjs';
export const compute = (a, b) =&gt; add(a, b) * 2;</code></pre>
  </li>
  <li><em>"Write a package.json that publishes both ESM and CJS with proper types."</em> — see Worked Example 3.</li>
  <li><em>"Lazy-load a heavy module on first use."</em>
    <pre><code class="language-js">async function loadHeavy() {
  const mod = await import('./heavy.mjs');
  return mod.default;
}</code></pre>
  </li>
  <li><em>"Demonstrate live bindings."</em>
    <pre><code class="language-js">// counter.mjs
export let n = 0;
export function inc() { n++; }
// app.mjs
import { n, inc } from './counter.mjs';
inc(); inc();
console.log(n);   // 2 — live binding</code></pre>
  </li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li><code>const { add } = require('./math')</code> in an ESM file — require not defined; use createRequire or rewrite as import.</li>
  <li>Library publishes <code>"main": "dist/index.cjs"</code> + <code>"module": "dist/index.mjs"</code> but no <code>"exports"</code> — risk of dual-package; use exports map.</li>
  <li>Bundle is huge; investigation shows lodash imported as <code>import _ from 'lodash'</code> — replace with <code>import { debounce } from 'lodash-es'</code> for tree-shaking.</li>
  <li>Top-level <code>await fetch(...)</code> in a deeply imported module — startup time tanks; refactor to a function.</li>
  <li>Re-export <code>export * from './everything'</code> in a barrel — slow IDE / test startup; consider explicit named re-exports or no barrel.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Static vs dynamic awareness</td><td>You connect ESM's static analyzability to tree shaking and bundle size.</td></tr>
    <tr><td>Interop fluency</td><td>You can describe how Node + TypeScript handle CJS↔ESM crossings.</td></tr>
    <tr><td>Library publishing</td><td>You volunteer the <code>"exports"</code> map and conditional resolution.</td></tr>
    <tr><td>Tree-shaking discipline</td><td>You name <code>"sideEffects"</code>, pure annotations, ESM as enabler.</td></tr>
    <tr><td>Circular awareness</td><td>You know live bindings make ESM cycles tolerable but not bug-free.</td></tr>
    <tr><td>Migration path</td><td>You can sketch a CJS→ESM migration without breaking consumers.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>Author RN libraries in TS/ESM; ship CJS-formatted dist (Hermes doesn't have native ESM).</li>
  <li>Metro tree-shakes ESM imports in production builds (Metro 0.73+); use ESM authoring for size wins.</li>
  <li>Avoid CJS-only deps where possible — they hurt tree-shaking.</li>
  <li>RN plugins often require CJS-style native registration; <code>"main"</code> still relevant for those.</li>
  <li>Beware: some RN libraries break with strict ESM mode in tsconfig; fall back to <code>"moduleResolution": "Bundler"</code>.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"Why was ESM designed to be async?"</em> — Browsers fetch modules over HTTP; the loader needs to traverse the graph without executing user code, which is inherently asynchronous. CJS's <code>require()</code> can't represent this.</li>
  <li><em>"How does Node resolve <code>require('foo')</code> internally?"</em> — Walks node_modules up the directory tree, looks at <code>package.json#main</code> (with extension fallback to <code>.js</code>, <code>.json</code>, <code>/index.js</code>); cached in <code>require.cache</code>.</li>
  <li><em>"How would you debug a 'cannot find module' error in production?"</em> — Verify <code>"exports"</code>; check that the imported subpath is exposed; for monorepos, ensure the workspace symlinks resolved; for ESM, verify file extensions.</li>
  <li><em>"Why does the bundle include the whole lodash?"</em> — <code>import _ from 'lodash'</code> on the legacy CJS package; bundler can't statically analyze the dynamic require map. Switch to <code>lodash-es</code> + named imports.</li>
  <li><em>"What's the cost of dynamic <code>import()</code>?"</em> — Returns a Promise; bundlers split the imported module into its own chunk; first call triggers a fetch + parse + evaluate cycle. Use for genuinely deferred / conditional features.</li>
</ul>

<h3>"What I'd do day one on the team"</h3>
<ul>
  <li>Audit package.json: <code>"type"</code>, <code>"main"</code>/<code>"module"</code>/<code>"exports"</code>, <code>"sideEffects"</code>.</li>
  <li>Run <code>publint</code> on every published library.</li>
  <li>Identify CJS-only dependencies that hurt tree-shaking; check for ESM alternatives.</li>
  <li>Find barrel files that pull in too much; consider explicit imports.</li>
  <li>Set up bundle-analyzer; flag any unexpected large modules.</li>
  <li>Confirm test runners use the same module resolution as the production bundler (matching aliases, JSON imports, etc.).</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd migrate our CJS-only utility packages to dual-format with proper exports maps."</li>
  <li>"I'd add a CI step running <code>arethetypeswrong</code> and <code>publint</code> to catch dual-package hazards before publish."</li>
  <li>"I'd refactor the largest barrel files to explicit re-exports to keep tree-shaking sharp."</li>
  <li>"I'd sweep the codebase for module-level side effects and either eliminate them or document them in <code>"sideEffects"</code>."</li>
  <li>"I'd build a tiny dependency-graph viewer to spot accidental circular imports — they survive longer in ESM than in CJS because of live bindings."</li>
</ul>
`
    }
  ]
});
