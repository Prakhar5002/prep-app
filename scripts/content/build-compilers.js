window.PREP_SITE.registerTopic({
  id: 'build-compilers',
  module: 'Build Tooling',
  title: 'Compilers (Babel / SWC / tsc)',
  estimatedReadTime: '26 min',
  tags: ['build', 'compiler', 'babel', 'swc', 'tsc', 'esbuild', 'transform', 'browserslist'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>A "compiler" in JS-land usually means a <strong>transformer</strong>: takes source code (TS, JSX, modern JS) and produces target output (JS for the browser, CJS for Node, .d.ts for types). Different from a bundler — though they often run in the same pipeline.</p>
<ul>
  <li><strong>Babel</strong> — JS-based, plugin-rich, slowest. The reference implementation. Use only for niche plugins.</li>
  <li><strong>SWC</strong> — Rust-based Babel replacement. 10-50× faster, supports TS + JSX + decorators natively. Default in Next.js, common in modern apps.</li>
  <li><strong>esbuild</strong> — Go-based, all-in-one (transform + bundle + minify). Used by Vite for dev transforms.</li>
  <li><strong>tsc</strong> — TypeScript's official compiler. Slowest emit; gold standard for type checking. Use <code>--noEmit</code> for type-check-only; let SWC/esbuild emit JS.</li>
  <li><strong>Sucrase</strong> — JS-based, super-fast for dev. Doesn't aim for production output (no down-leveling).</li>
  <li><strong>Browserslist</strong> — config that drives target — what each compiler outputs.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Compilers transform; bundlers stitch. For new projects: SWC or esbuild for emit, <code>tsc --noEmit</code> for type check, run them in parallel. Babel only when you have a Babel-specific plugin you can't replace.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What a JS compiler does</h3>
<p>Take input → AST → transform → output:</p>
<ol>
  <li><strong>Parse</strong> source to an AST (Abstract Syntax Tree).</li>
  <li><strong>Transform</strong> nodes — apply each plugin / pass in order.</li>
  <li><strong>Generate</strong> output code from the AST.</li>
  <li>Optionally: source maps, type declarations, format conversion (ESM → CJS).</li>
</ol>

<h3>Common transforms</h3>
<ul>
  <li><strong>TypeScript → JavaScript</strong> — strip types, lower TS-specific syntax.</li>
  <li><strong>JSX → JS</strong> — <code>&lt;div /&gt;</code> → <code>React.createElement('div')</code> or new automatic runtime.</li>
  <li><strong>Modern JS → older JS</strong> — optional chaining, nullish coalescing, async/await for older browsers.</li>
  <li><strong>Decorators</strong> — class decorators, parameter decorators.</li>
  <li><strong>Module conversion</strong> — ESM → CJS or vice versa.</li>
  <li><strong>JSX runtime selection</strong> — classic vs automatic.</li>
  <li><strong>Custom transforms</strong> — styled-components display names, GraphQL strings → IDs, React Compiler memoization.</li>
</ul>

<h3>Why Babel was the standard</h3>
<p>Babel pioneered the plugin model. Every cutting-edge JS feature was implemented as a Babel plugin first, then standardized. Plugins exist for almost every transform. Plugin ecosystem is mature; even the React team's React Compiler is a Babel plugin first (with a Rust port underway). Cost: written in JS; slow on big projects.</p>

<h3>Why SWC / esbuild took over</h3>
<p>Babel is interpreted JS interpreting JS. Native code (Rust / Go) parses and transforms 10-50× faster. SWC reimplements most popular Babel transforms — including TS, JSX, decorators, optional chaining. esbuild does similar but as part of a bundler. Net: same outputs, fraction of the time.</p>

<h3>Why <code>tsc</code> for emit is slow</h3>
<p>tsc does full semantic analysis: type checking, inference, declaration emit. Emit work is mostly straightforward syntax stripping. Other tools (SWC, esbuild) skip type analysis entirely — just strip TS syntax. For type checking, you still need tsc; for emit, prefer faster tools.</p>

<h3>Why split type check from emit</h3>
<pre><code class="language-bash"># Old (slow):
tsc                    # type check + emit, 60s

# New (fast):
swc --noEmit-from-tsc  # SWC emits JS, 5s
tsc --noEmit           # type check only, 30s parallel
# Total wall time: 30s (parallel)</code></pre>
<p>Modern setups always separate them.</p>

<h3>Why Browserslist matters</h3>
<p>Tells your toolchain which browsers to target. Drives:</p>
<ul>
  <li>Babel preset-env: which transforms apply.</li>
  <li>Autoprefixer / Lightning CSS: which CSS prefixes.</li>
  <li>Polyfills (core-js): which to include.</li>
  <li>esbuild target: ES output level.</li>
</ul>
<p>Reasonable defaults today: <code>"&gt; 0.5%, last 2 versions, not dead"</code>. Drop IE11 (gone since 2022).</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "compiler stages" picture</h3>
<div class="diagram">
<pre>
 Input source (TS, TSX, modern JS)
    │
    ▼
 Parse → AST
    │
    ▼
 Transform passes (one or many)
    ├── Strip TypeScript types
    ├── Lower JSX
    ├── Down-level optional chaining (if target old)
    ├── Inject polyfills (if needed)
    ├── Inject React imports for automatic runtime
    └── Custom transforms (e.g., React Compiler)
    │
    ▼
 Generate output (JS source + source map)
</pre>
</div>

<h3>The "comparison" table</h3>
<table>
  <thead><tr><th>Compiler</th><th>Lang</th><th>TypeScript</th><th>Type check</th><th>Plugins</th><th>Speed</th></tr></thead>
  <tbody>
    <tr><td>Babel</td><td>JS</td><td>Strip types only</td><td>No</td><td>Huge ecosystem</td><td>Slow</td></tr>
    <tr><td>SWC</td><td>Rust</td><td>Strip + decorators</td><td>No</td><td>Growing</td><td>Very fast</td></tr>
    <tr><td>esbuild</td><td>Go</td><td>Strip + JSX</td><td>No</td><td>Smaller</td><td>Extremely fast</td></tr>
    <tr><td>tsc</td><td>TS</td><td>Full</td><td>Yes (full)</td><td>None</td><td>Slow emit; necessary for types</td></tr>
    <tr><td>Sucrase</td><td>JS</td><td>Strip only</td><td>No</td><td>Limited</td><td>Very fast (dev only)</td></tr>
  </tbody>
</table>

<h3>The "responsibility split"</h3>
<div class="diagram">
<pre>
 Type checking      → tsc --noEmit
 Code emit          → SWC / esbuild / Babel
 Bundling           → Vite / Rollup / Webpack / Rspack
 Minifying          → SWC minify / esbuild minify / Terser
 Asset processing   → Bundler's loaders / plugins

 Each step independent; pick fastest tool per step.
</pre>
</div>

<h3>The "JSX runtime" picture</h3>
<pre><code class="language-tsx">// Source
&lt;div className="x"&gt;hi&lt;/div&gt;

// Classic runtime (older):
React.createElement('div', { className: 'x' }, 'hi');
// Requires: import React from 'react' in every file using JSX

// Automatic runtime (React 17+, default since):
import { jsx as _jsx } from 'react/jsx-runtime';
_jsx('div', { className: 'x', children: 'hi' });
// No React import needed</code></pre>

<h3>The "polyfill strategy" picture</h3>
<pre><code>core-js polyfills + Babel @babel/preset-env:
  - Detects required polyfills based on browserslist
  - "useBuiltIns: 'usage'" — only imports polyfills you actually use
  - "useBuiltIns: 'entry'" — imports per-feature based on entry pragma

Modern alternative:
  - Drop core-js entirely; only target browsers that support modern syntax
  - "browserslist: ['last 2 chrome versions, last 2 firefox versions, last 2 safari versions']"</code></pre>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"SWC is just a Babel plugin." SWC is a full compiler — it has its own parser, AST, transform pipeline, and code generator. Written in Rust. It can't run Babel plugins directly; it has its own (smaller) plugin system. They share goals, not implementations.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Babel</h3>
<pre><code class="language-json">// .babelrc.json
{
  "presets": [
    ["@babel/preset-env", { "targets": { "esmodules": true } }],
    "@babel/preset-typescript",
    ["@babel/preset-react", { "runtime": "automatic" }]
  ],
  "plugins": [
    "@babel/plugin-proposal-decorators",
    "babel-plugin-styled-components"
  ]
}</code></pre>
<pre><code class="language-bash">npx babel src --out-dir dist --extensions .ts,.tsx</code></pre>

<h3>SWC</h3>
<pre><code class="language-json">// .swcrc
{
  "$schema": "https://json.schemastore.org/swcrc",
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "tsx": true,
      "decorators": true
    },
    "target": "es2022",
    "transform": {
      "react": {
        "runtime": "automatic",
        "development": false,
        "refresh": true
      },
      "decoratorMetadata": true
    },
    "experimental": {
      "plugins": [["@swc/plugin-styled-components", {}]]
    }
  },
  "module": { "type": "es6" },
  "minify": true
}</code></pre>
<pre><code class="language-bash">npx swc src -d dist --copy-files</code></pre>

<h3>esbuild</h3>
<pre><code class="language-js">// build.mjs
import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.tsx'],
  bundle: true,
  platform: 'browser',
  target: ['es2020', 'chrome100', 'firefox100', 'safari16'],
  jsx: 'automatic',
  jsxImportSource: 'react',
  loader: { '.svg': 'dataurl', '.png': 'file' },
  outdir: 'dist',
  sourcemap: true,
  minify: true,
});</code></pre>

<h3>tsc — type checking only</h3>
<pre><code class="language-json">// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",            // bundler will handle JSX
    "noEmit": true,                // tsc only verifies types
    "strict": true,
    "incremental": true,
    "tsBuildInfoFile": "node_modules/.cache/.tsbuildinfo",
    "isolatedModules": true,       // each file independently transpilable (required for SWC/esbuild)
    "skipLibCheck": true,          // skip type checking node_modules — much faster
    "resolveJsonModule": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"]
}</code></pre>
<pre><code class="language-bash">tsc --noEmit            # type check, no output
tsc --noEmit --watch    # watch mode for dev</code></pre>

<h3>Browserslist</h3>
<pre><code class="language-json">// package.json
{
  "browserslist": [
    "&gt; 0.5%",
    "last 2 versions",
    "Firefox ESR",
    "not dead",
    "not IE 11"
  ]
}</code></pre>
<pre><code class="language-bash"># See what browsers your config targets:
npx browserslist
# chrome 121
# firefox 122
# safari 17.2
# ...</code></pre>

<h3>Modern target — drop polyfills</h3>
<pre><code class="language-json">// Aggressive: only browsers with native ES2022 support
{
  "browserslist": [
    "Chrome &gt;= 100",
    "Firefox &gt;= 100",
    "Safari &gt;= 16",
    "Edge &gt;= 100"
  ]
}
// Skip down-leveling, skip core-js. Smaller bundles, fewer polyfills shipped.</code></pre>

<h3>tsc project references (monorepos)</h3>
<pre><code class="language-json">// tsconfig.json (root)
{
  "files": [],
  "references": [
    { "path": "./packages/utils" },
    { "path": "./packages/api" },
    { "path": "./packages/web" }
  ]
}

// packages/utils/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "outDir": "dist",
    "declaration": true
  }
}</code></pre>
<p>Run <code>tsc --build</code> — checks dependent packages first, caches per package. Faster incremental type checking in monorepos.</p>

<h3>tsc emit settings</h3>
<pre><code class="language-json">{
  "compilerOptions": {
    "target": "ES2022",         // syntax level of output
    "module": "ESNext",          // module format (ESM)
    "outDir": "dist",
    "declaration": true,         // emit .d.ts
    "declarationMap": true,      // sourcemaps for .d.ts
    "sourceMap": true,
    "removeComments": false,
    "preserveConstEnums": true
  }
}</code></pre>

<h3>Babel → SWC migration</h3>
<pre><code class="language-bash"># 1. Install SWC
npm install -D @swc/core @swc/cli

# 2. Create .swcrc
{
  "jsc": { "parser": { "syntax": "typescript", "tsx": true }, "target": "es2022" },
  "module": { "type": "es6" }
}

# 3. Replace babel-loader with swc-loader (Webpack)
# 4. Or replace @babel/preset-env scripts with swc CLI
# 5. Verify output; check JSX runtime, decorators
# 6. Drop @babel/* deps</code></pre>

<h3>tsc + SWC parallel in CI</h3>
<pre><code class="language-json">// package.json
{
  "scripts": {
    "build:emit": "swc src -d dist",
    "type-check": "tsc --noEmit",
    "build": "npm-run-all --parallel build:emit type-check"
  }
}</code></pre>

<h3>JSX runtime config</h3>
<pre><code class="language-json">// SWC
{
  "jsc": {
    "transform": {
      "react": {
        "runtime": "automatic",        // jsx-runtime imports auto-injected
        "importSource": "react",        // or 'preact', 'solid-js'
        "development": false,           // adds debug info if true
        "refresh": true                 // React Fast Refresh in dev
      }
    }
  }
}</code></pre>

<h3>tsx-loader / ts-node alternatives</h3>
<pre><code class="language-bash"># For Node scripts written in TS:
tsx src/script.ts            # tsx package — esbuild-based, fast
ts-node src/script.ts        # legacy; slower
node --import tsx src/script.ts   # Node 20+ with tsx loader</code></pre>

<h3>Sucrase for dev</h3>
<pre><code class="language-bash">npx sucrase ./src -d ./dist --transforms typescript,jsx
# Very fast — but only for dev. No down-leveling, no polyfills.</code></pre>

<h3>Polyfill strategies</h3>
<ul>
  <li><strong>None</strong> — modern target, accept losing IE / old Safari users.</li>
  <li><strong>core-js with usage</strong> — Babel preset-env detects + injects only polyfills your code uses.</li>
  <li><strong>Polyfill.io</strong> — runtime polyfills based on User-Agent. Trade-off: a tiny request before main bundle runs.</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — minimal SWC config</h3>
<pre><code class="language-json">// .swcrc
{
  "jsc": {
    "parser": { "syntax": "typescript", "tsx": true },
    "target": "es2022",
    "transform": { "react": { "runtime": "automatic" } }
  },
  "module": { "type": "es6" }
}</code></pre>

<h3>Example 2 — Babel preset-env with usage-based polyfills</h3>
<pre><code class="language-json">{
  "presets": [
    ["@babel/preset-env", {
      "useBuiltIns": "usage",
      "corejs": 3,
      "targets": "&gt; 0.5%, not dead"
    }]
  ]
}</code></pre>

<h3>Example 3 — esbuild minimal</h3>
<pre><code class="language-js">await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outdir: 'dist',
  target: 'es2022',
  jsx: 'automatic',
});</code></pre>

<h3>Example 4 — tsc strict mode</h3>
<pre><code class="language-json">{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "noEmit": true
  }
}</code></pre>

<h3>Example 5 — JSX automatic runtime</h3>
<pre><code class="language-json">// Babel
{ "presets": [["@babel/preset-react", { "runtime": "automatic" }]] }

// SWC
{ "jsc": { "transform": { "react": { "runtime": "automatic" } } } }

// tsc tsconfig
{ "compilerOptions": { "jsx": "react-jsx" } }
// All produce: import { jsx as _jsx } from 'react/jsx-runtime'</code></pre>

<h3>Example 6 — TS path aliases</h3>
<pre><code class="language-json">// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"]
    },
    "baseUrl": "."
  }
}</code></pre>
<pre><code class="language-ts">// In code:
import { Button } from '@components/Button';
// tsc resolves; bundler must also resolve — configure plugin (vite-tsconfig-paths, tsconfig-paths-webpack-plugin)</code></pre>

<h3>Example 7 — SWC plugin (Rust)</h3>
<pre><code class="language-rust">// Custom SWC plugin written in Rust, compiled to WASM
// In .swcrc:
{
  "jsc": {
    "experimental": {
      "plugins": [
        ["@swc/plugin-styled-components", {}],
        ["./my-custom-plugin.wasm", { /* options */ }]
      ]
    }
  }
}</code></pre>

<h3>Example 8 — replacing tsc emit with SWC in a monorepo</h3>
<pre><code class="language-json">// packages/library/package.json
{
  "scripts": {
    "build:js": "swc src -d dist",
    "build:types": "tsc --emitDeclarationOnly",
    "build": "npm-run-all build:js build:types",
    "type-check": "tsc --noEmit"
  }
}
// SWC handles JS emit (fast); tsc emits .d.ts only (still slow for declarations, but parallelizable)</code></pre>

<h3>Example 9 — verbose tsc diagnostics</h3>
<pre><code class="language-bash">tsc --extendedDiagnostics
# Output:
# Files:                            234
# Lines of Library:               24015
# Lines of Definitions:           54322
# Nodes of Definitions:          203412
# Identifiers:                    78023
# I/O read time:                   0.30s
# I/O write time:                  0.05s
# Parse time:                      0.45s
# ResolveModule time:              0.20s
# Bind time:                       0.15s
# Check time:                      4.20s    ← biggest bottleneck
# Total time:                      5.40s</code></pre>

<h3>Example 10 — incremental tsc</h3>
<pre><code class="language-json">{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "node_modules/.cache/.tsbuildinfo"
  }
}</code></pre>
<pre><code class="language-bash">tsc --noEmit         # first run: 30s
tsc --noEmit         # second run, no changes: 5s
# Cache invalidated if any file changes</code></pre>

<h3>Example 11 — moving from CRA to Vite + SWC</h3>
<pre><code class="language-bash">npm install -D vite @vitejs/plugin-react-swc
# vite.config.ts:
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
export default defineConfig({ plugins: [react()] });
// Vite uses esbuild for transform by default; @vitejs/plugin-react-swc switches to SWC for React HMR features</code></pre>

<h3>Example 12 — TypeScript only "scripts" project</h3>
<pre><code class="language-json">// For CLI tools / scripts written in TS:
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src"
  }
}
// Use tsx for dev: npm exec tsx src/script.ts
// Build for prod: tsc</code></pre>

<h3>Example 13 — debugging output differences</h3>
<pre><code class="language-bash"># Babel and SWC should produce equivalent output for most code.
# Differences usually come from:
# - Different decorator implementations
# - Optional chaining edge cases
# - Module helpers (each tool has its own runtime helpers)

# Diff outputs:
diff &lt;(babel src/file.ts -o -) &lt;(swc src/file.ts -o -)</code></pre>

<h3>Example 14 — React Compiler (2024+)</h3>
<pre><code class="language-bash"># React Compiler — Babel plugin (Rust port WIP)
npm install babel-plugin-react-compiler

# .babelrc:
{
  "plugins": ["babel-plugin-react-compiler"]
}
# Auto-memoizes components based on static analysis.</code></pre>

<h3>Example 15 — measuring transform time</h3>
<pre><code class="language-bash"># Babel
npx babel src --out-dir dist --extensions .ts,.tsx --verbose
# Logs per-file time

# SWC
SWC_LOG=swc=trace npx swc src -d dist
# Detailed timing per pass

# esbuild metafile
npm exec esbuild src/index.ts --metafile=meta.json --bundle</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. SWC + decorators</h3>
<p>SWC supports legacy + Stage-3 decorators. Set <code>parser.decorators</code> + <code>transform.legacyDecorator</code> appropriately. Mismatch → silent failure or crash.</p>

<h3>2. Babel + tsc agreement</h3>
<p>Babel strips types via syntax only — no semantic checking. <code>const enum</code> doesn't work. <code>namespace</code> works only as ES module workaround. Use <code>isolatedModules: true</code> in tsconfig to mirror Babel's constraints.</p>

<h3>3. tsc declaration emit slowness</h3>
<p>Emitting .d.ts files requires full type analysis. Even with <code>--emitDeclarationOnly</code>, it's slow on large codebases. Consider <code>--skipLibCheck true</code> and project references.</p>

<h3>4. <code>useBuiltIns: 'usage'</code> false positives</h3>
<p>preset-env analyzes your code statically. If you use a feature dynamically (e.g., <code>Array.prototype.flat</code> via lookup), it may miss the polyfill need. Test in target browsers.</p>

<h3>5. JSX classic runtime requires React import</h3>
<p>Old: every JSX file needs <code>import React from 'react'</code>. Automatic runtime: not needed. Mismatch → <code>React is not defined</code> at runtime if classic but import missing.</p>

<h3>6. tsc and namespaces</h3>
<p>TS <code>namespace</code> emit relies on tsc-specific output. Babel and SWC don't emit namespaces correctly — use ES modules instead.</p>

<h3>7. ConstEnum issues</h3>
<p><code>const enum X { A = 1 }</code> inlines values at compile time. SWC and Babel don't do this — they emit regular enum. Disable const enums via <code>"isolatedModules": true</code> and avoid them in code.</p>

<h3>8. Babel polyfills bloat</h3>
<p><code>useBuiltIns: 'entry'</code> imports many polyfills. <code>'usage'</code> is more selective but slower analysis. Default has changed across Babel versions; verify.</p>

<h3>9. Targeting "esmodules: true"</h3>
<p>Browserslist <code>"esmodules: true"</code> means: every browser that supports ES modules (no IE11). Looser than <code>"&gt; 0.5%"</code>. Choose intentionally.</p>

<h3>10. SWC plugins are WASM</h3>
<p>SWC's plugin system uses WASM. Plugin must be compiled (Rust → WASM). Custom plugins are harder to write than Babel's JS plugins.</p>

<h3>11. Module format conversions</h3>
<p>Compilers can convert ESM → CJS or vice versa. Done improperly, you get <code>require is not defined</code> in the browser, or top-level <code>await</code> failures in CJS. Configure module type carefully.</p>

<h3>12. JSX import source for non-React</h3>
<pre><code class="language-jsonc">{
  "jsc": {
    "transform": {
      "react": {
        "runtime": "automatic",
        "importSource": "preact"   // or 'solid-js'
      }
    }
  }
}</code></pre>

<h3>13. tsc and bundler module formats</h3>
<p>If tsc emits ESM and your bundler expects CJS (rare today), runtime errors. Set <code>module</code> in tsconfig + bundler to match.</p>

<h3>14. tsc "incremental" with branch switches</h3>
<p>Switching git branches changes many files; tsbuildinfo has stale data. tsc auto-detects but sometimes corrupts. Delete .tsbuildinfo if oddities.</p>

<h3>15. Babel + SWC together</h3>
<p>Some projects run Babel for one transform and SWC for another. Mostly avoidable; pick one. Mixing has subtle interaction bugs.</p>

<h3>16. tsc with verbatimModuleSyntax</h3>
<p>TS 5+ flag: <code>verbatimModuleSyntax: true</code> requires explicit <code>type</code> imports. Behaves more like Babel's syntactic-only transform.</p>

<h3>17. SWC parser differences</h3>
<p>SWC's parser sometimes accepts code that Babel rejects (or vice versa). Edge cases: numeric separators, hashbangs, top-level await. Stay current; report bugs.</p>

<h3>18. Output target vs bundler target</h3>
<p>SWC <code>target: 'es2022'</code> produces ES2022 output. Bundler then bundles. If bundler also has <code>target: 'es2018'</code>, it may down-level your output further. Match them.</p>

<h3>19. Polyfill duplication</h3>
<p>core-js polyfills imported by Babel + a library that ships its own polyfills → duplicate. Audit with bundle analyzer.</p>

<h3>20. Tsx vs tsx-loader vs ts-node</h3>
<p>Three similar names. <strong>tsx</strong>: esbuild-based runner (fast, modern). <strong>ts-node</strong>: tsc-based runner (older, slow). <strong>tsx-loader</strong>: Webpack loader. Pick tsx for new tools.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — Babel for new projects</h3>
<p>SWC / esbuild are 10-50× faster, support everything Babel does for typical projects. Use Babel only for niche plugins.</p>

<h3>Anti-pattern 2 — tsc as the bundler emitter</h3>
<p>tsc is slow at emit. Use SWC / esbuild for emit; tsc <code>--noEmit</code> for type check.</p>

<h3>Anti-pattern 3 — ignoring browserslist</h3>
<p>No config → tools use varying defaults. Inconsistent output. Set explicitly in package.json.</p>

<h3>Anti-pattern 4 — polyfilling for IE11 in 2024</h3>
<p>IE11 is dead. Drop polyfills targeting it; bundle shrinks 30-100KB.</p>

<h3>Anti-pattern 5 — forgetting <code>isolatedModules</code></h3>
<p>SWC/esbuild require each file to be transpilable in isolation. Without <code>isolatedModules: true</code>, certain TS patterns fail silently. Always set in tsconfig.</p>

<h3>Anti-pattern 6 — type checking inside webpack-loader</h3>
<p>Old: <code>ts-loader</code> with <code>transpileOnly: false</code>. Slow. Modern: SWC/esbuild loader for emit; tsc separately.</p>

<h3>Anti-pattern 7 — class enum + isolatedModules</h3>
<p><code>const enum</code> and <code>isolatedModules</code> are incompatible. Use plain enums or string unions.</p>

<h3>Anti-pattern 8 — running Babel + SWC + Webpack</h3>
<p>Triple compilation overhead. Pick one transformer.</p>

<h3>Anti-pattern 9 — JSX classic runtime in 2024</h3>
<p>Automatic runtime is the default since React 17. Don't manually import React in every JSX file.</p>

<h3>Anti-pattern 10 — skipping <code>tsc --noEmit</code></h3>
<p>If only SWC emits JS (no type check), bugs ship to runtime. Always run <code>tsc --noEmit</code> in CI.</p>

<h3>Anti-pattern 11 — committed dist for libraries</h3>
<p>Library publishes from <code>dist</code>. Don't commit <code>dist</code>; build during publish.</p>

<h3>Anti-pattern 12 — tsx and ts-node mixed</h3>
<p>Use one runner. tsx is newer + faster; default to it.</p>

<h3>Anti-pattern 13 — minified TypeScript output</h3>
<p>Minify only at the bundle step, not the transform step. Source code intermediate output should be readable.</p>

<h3>Anti-pattern 14 — config sprawl</h3>
<p>.babelrc + .swcrc + tsconfig + webpack.config + browserslist + .eslintrc. Consolidate where possible (Vite has one config).</p>

<h3>Anti-pattern 15 — no skipLibCheck</h3>
<p>tsc checking 100MB of node_modules type definitions. Massive slowdown. <code>"skipLibCheck": true</code> is standard.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. Difference between a compiler and a bundler?</div>
  <div class="qa-answer">
    <p><strong>Compiler / transformer</strong>: takes one file, produces one file (TS → JS, JSX → JS). Examples: Babel, SWC, tsc, esbuild's transform mode.</p>
    <p><strong>Bundler</strong>: walks dependency graph, combines many files into bundles. Examples: Webpack, Rollup, Vite (in build mode).</p>
    <p>They often run together: a bundler invokes a compiler per file as part of the pipeline.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Babel vs SWC vs esbuild?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Babel</strong> (JS): mature, plugin-rich, slowest. Use for niche plugins.</li>
      <li><strong>SWC</strong> (Rust): Babel-compatible transforms (TS, JSX, decorators), 10-50× faster. Default for new projects + Next.js.</li>
      <li><strong>esbuild</strong> (Go): all-in-one transform + bundle + minify. Used by Vite for dev. Smaller plugin ecosystem.</li>
    </ul>
    <p>Pick one transformer; don't run multiple.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Why split type check from emit?</div>
  <div class="qa-answer">
    <p>Two different jobs:</p>
    <ul>
      <li><strong>Type check</strong>: tsc, requires full semantic analysis. Slow (~30s on a real project).</li>
      <li><strong>Emit</strong>: produce JS from source. SWC/esbuild do this in seconds without type analysis.</li>
    </ul>
    <p>Run <code>tsc --noEmit</code> for type checking; let SWC/esbuild emit. Run them in parallel in CI for fastest total time.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. What's <code>isolatedModules: true</code> in tsconfig?</div>
  <div class="qa-answer">
    <p>Tells TypeScript that the project will be transpiled file-by-file by another tool (SWC, esbuild, Babel). Forbids TS features that require cross-file context: <code>const enum</code>, <code>namespace</code>, certain re-exports. Always set when using a non-tsc emitter.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. JSX classic vs automatic runtime?</div>
  <div class="qa-answer">
    <p><strong>Classic</strong> (older): <code>&lt;div /&gt;</code> compiles to <code>React.createElement('div')</code> — requires <code>import React</code> in every JSX file.</p>
    <p><strong>Automatic</strong> (React 17+): compiles to <code>jsx('div')</code> with auto-injected <code>import { jsx } from 'react/jsx-runtime'</code>. No React import needed. Default in modern projects.</p>
    <p>Configure via <code>"jsx": "react-jsx"</code> in tsconfig, or <code>{ runtime: "automatic" }</code> in Babel/SWC React preset.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. What's Browserslist?</div>
  <div class="qa-answer">
    <p>A config that declares which browsers your build targets. Used by Babel, SWC, esbuild, Autoprefixer, Lightning CSS, Modernizr. Format: <code>"&gt; 0.5%, last 2 versions, not dead"</code>. Drives polyfill selection, CSS prefixes, syntax down-leveling. Lives in <code>package.json</code> or <code>.browserslistrc</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How would you migrate from Babel to SWC?</div>
  <div class="qa-answer">
    <ol>
      <li>Install <code>@swc/core</code> + <code>@swc/cli</code>.</li>
      <li>Create <code>.swcrc</code> mirroring your Babel config: TS parser, JSX automatic, target.</li>
      <li>Replace babel-loader with swc-loader in Webpack (or use Vite's @vitejs/plugin-react-swc).</li>
      <li>Remove Babel deps: <code>@babel/*</code>, <code>babel-loader</code>.</li>
      <li>Test: build artifact bytes shouldn't differ much; runtime behavior should match.</li>
      <li>For Babel plugins not in SWC, look for SWC equivalents or Rust plugin. Most popular ones are covered.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Why is tsc so slow?</div>
  <div class="qa-answer">
    <p>tsc does full semantic analysis: parses every file + every dependency type definition, builds the type graph, infers types, checks assignability. It's not designed for emit speed; it's designed for correctness. SWC and esbuild skip semantic analysis entirely (just strip TS syntax), making them 10-100× faster at emit. For type checking, tsc is still the only choice.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. What's <code>skipLibCheck</code>?</div>
  <div class="qa-answer">
    <p>tsc setting that skips type checking of declaration files (<code>.d.ts</code>) in node_modules. Massive speed-up; minor risk that a library's types have errors that affect your code (rare). Standard recommendation: <code>"skipLibCheck": true</code> in every project.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. What does a Babel plugin do?</div>
  <div class="qa-answer">
    <p>Visits AST nodes and transforms them. Plugins implement visitors:</p>
<pre><code class="language-js">module.exports = () =&gt; ({
  visitor: {
    Identifier(path) { if (path.node.name === 'foo') path.node.name = 'bar'; }
  }
});</code></pre>
    <p>Applied in order; each visits the AST and emits modified AST. Babel infrastructure handles parsing + generation.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. SWC plugin vs Babel plugin?</div>
  <div class="qa-answer">
    <p>SWC plugins are written in Rust, compiled to WASM. Higher barrier to authoring (Rust + WASM build). But: same speed as core SWC. Babel plugins are JS — easier to write but execute on JS VM (slower). For widespread plugins, SWC ports exist. For one-off transforms, Babel is easier.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. tsc emit vs SWC emit — semantic differences?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>const enum</strong>: tsc inlines, SWC emits regular enum (or fails with <code>isolatedModules</code>).</li>
      <li><strong>namespace</strong>: tsc emits IIFE-style code, SWC + Babel don't fully support.</li>
      <li><strong>Decorators</strong>: differ in implementation (legacy vs Stage-3); choose consistent setting.</li>
      <li><strong>Module helpers</strong>: each tool has its own <code>__decorate</code>, <code>__extends</code>, etc.</li>
    </ul>
    <p>For typical app code, output is functionally identical.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. What's <code>verbatimModuleSyntax</code>?</div>
  <div class="qa-answer">
    <p>TS 5.0+ flag. Forces explicit <code>type</code> imports for type-only imports (so they can be erased syntactically). Replaces older <code>importsNotUsedAsValues</code>. Aligns tsc emit with Babel/SWC's syntactic transformation. Recommended for projects using SWC/esbuild emit.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Is the React Compiler a build-time tool?</div>
  <div class="qa-answer">
    <p>Yes — a Babel plugin (Rust port via SWC under way) that statically analyzes React components and auto-inserts memoization (<code>useMemo</code>, <code>useCallback</code>, <code>React.memo</code>). Runs at build time; output is regular React with explicit memo calls. Reduces need for manual memoization. Opt-in; eslint-plugin-react-compiler helps catch violations.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Walk me through a modern build pipeline.</div>
  <div class="qa-answer">
    <ol>
      <li><strong>Source</strong>: TS, TSX, CSS, assets in <code>src/</code>.</li>
      <li><strong>Transform</strong>: SWC (or esbuild) strips types, lowers JSX, applies React Fast Refresh in dev.</li>
      <li><strong>Type check</strong>: tsc <code>--noEmit</code> in parallel.</li>
      <li><strong>Bundle</strong>: Vite (Rollup in prod, native ESM in dev).</li>
      <li><strong>Optimize</strong>: tree shake, code split, minify (esbuild), content hash.</li>
      <li><strong>Emit</strong>: hashed JS, CSS, assets to <code>dist/</code>.</li>
      <li><strong>Source maps</strong>: hidden, uploaded to Sentry.</li>
      <li><strong>CI</strong>: caches node_modules, .vite, .tsbuildinfo. Total &lt; 1 minute on cache hit.</li>
    </ol>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You distinguish compiler (transform) from bundler (graph).</li>
    <li>You pick SWC or esbuild for transforms; Babel only for niche plugins.</li>
    <li>You separate type check from emit (<code>tsc --noEmit</code> + SWC).</li>
    <li>You use <code>isolatedModules: true</code> for SWC/esbuild compatibility.</li>
    <li>You configure JSX automatic runtime.</li>
    <li>You set browserslist to a sensible modern target.</li>
    <li>You use <code>skipLibCheck: true</code> for tsc speed.</li>
    <li>You enable incremental TypeScript with tsbuildinfo.</li>
    <li>You parallelize type-check + emit in CI.</li>
  </ul>
</div>
`}

]
});
