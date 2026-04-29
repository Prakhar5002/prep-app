window.PREP_SITE.registerTopic({
  id: 'build-optimizations',
  module: 'Build Tooling',
  title: 'Build Optimizations',
  estimatedReadTime: '32 min',
  tags: ['build', 'optimization', 'cache', 'incremental', 'parallelization', 'esbuild', 'swc', 'turbopack', 'turborepo', 'ci'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>Build optimization is about <strong>making the build itself fast</strong> — not the runtime bundle. Slow builds hurt developer velocity, bloat CI cost, and delay deploys. The dominant levers are caching, parallelization, and choosing fast tools.</p>
<ul>
  <li><strong>Modern compilers</strong>: <strong>esbuild</strong> (Go), <strong>swc</strong> (Rust), <strong>Rspack</strong> (Rust port of Webpack), <strong>Turbopack</strong> (Rust, incremental). 10-100× faster than Babel + Webpack.</li>
  <li><strong>Persistent file-system cache</strong>: bundlers cache transformed modules + chunk graphs across builds. <strong>Webpack 5 filesystem cache</strong>, <strong>Vite cache</strong>, <strong>Turbopack persistent cache</strong>.</li>
  <li><strong>Incremental builds</strong>: rebuild only what changed. Vite dev = native ESM (no rebundle); production tools track module dependency graphs.</li>
  <li><strong>Parallelization</strong>: esbuild parallelizes via Go's goroutines; <strong>Turborepo</strong> / <strong>Nx</strong> orchestrate parallel + cached builds across a monorepo.</li>
  <li><strong>Source maps</strong> strategy: <code>eval-cheap-module-source-map</code> in dev (fast), <code>hidden-source-map</code> in prod (uploaded to Sentry, not exposed).</li>
  <li><strong>HMR (Hot Module Replacement)</strong>: swap modules without full reload — keeps state across edits.</li>
  <li><strong>Tree shaking + minification</strong>: terser, swc minify, esbuild minify. swc / esbuild are 10-50× faster than terser.</li>
  <li><strong>CI cache</strong>: cache <code>node_modules</code>, build outputs, persistent compiler caches. 5min build → 30s on cache hit.</li>
  <li><strong>Codegen</strong> at build time: GraphQL types, route manifests, TS declarations. Cache aggressively.</li>
  <li><strong>Bundle splitting</strong>: balance between chunk count and HTTP/2 multiplexing. Don't blindly split into 1000 micro-chunks.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Slow build = wasted developer time × team size × deploys per day. Pick fast tools (esbuild / swc / Rust-based bundlers), enable persistent caches, parallelize across a monorepo, and cache aggressively in CI. A 5-second build feels free; a 5-minute build poisons workflow.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Build vs runtime — different concerns</h3>
<p>Two distinct optimization domains:</p>
<ul>
  <li><strong>Runtime bundle</strong>: what the user downloads and runs. Smaller is better; covered in Bundle &amp; Loading topic.</li>
  <li><strong>Build pipeline</strong>: developer + CI experience. Faster is better. Tools, caches, parallelization. This topic.</li>
</ul>
<p>A 50KB bundle still requires the build to compile sources, transform syntax, resolve modules, optimize, hash, minify. That work runs every build. Optimizing it is independent of runtime perf.</p>

<h3>Why builds got slow</h3>
<p>JS tooling matured around Babel + Webpack — both written in JavaScript. Single-threaded by default; transformations chained per-file. A 1000-file project spends most build time in: Babel transforms (~50% of dev rebuild), Webpack module resolution + dependency graph (~30%), Terser minification (~20%). Total: minutes.</p>

<h3>Why Rust / Go tools win</h3>
<p>esbuild (Go), swc (Rust), Turbopack / Rspack (Rust). Reasons:</p>
<ul>
  <li><strong>Native code</strong> — no JS VM overhead.</li>
  <li><strong>True parallelism</strong> — Go goroutines, Rust threads, vs Node single-threaded (workers add overhead).</li>
  <li><strong>Memory layout</strong> — compact data structures, less GC pressure.</li>
  <li><strong>Faster parsers</strong> — hand-tuned vs JS-on-JS.</li>
</ul>
<p>Result: 10-100× speedups for transformation passes.</p>

<h3>Why caching matters most</h3>
<p>The fastest build is the one you don't run. Caching avoids redoing work:</p>
<ul>
  <li><strong>In-memory cache</strong>: dev server holds parsed modules; rebuild on change is incremental.</li>
  <li><strong>File-system cache</strong>: persistent across processes / restarts. Webpack 5, Vite, Turbopack.</li>
  <li><strong>Content cache</strong>: hash inputs (source + config + deps) → cache outputs. Hit rate 90%+ on warm CI.</li>
  <li><strong>Build cache (Turborepo / Nx)</strong>: cache entire package builds across a monorepo + machines.</li>
</ul>

<h3>Why incremental beats full rebuild</h3>
<p>Vite's dev server doesn't bundle at all — serves source files as native ESM via the browser. On change, only the changed file recompiles. Production builds use Rollup with persistent cache. Webpack 5 has filesystem cache that approximates this. The point: rebuild scope = changed files + their dependents, not the world.</p>

<h3>Why parallelization isn't free</h3>
<p>Some build steps are sequential (dependency graph traversal). Others parallelize trivially (per-file transforms). Tools like esbuild parallelize aggressively via worker pools. In monorepos, Turborepo / Nx parallelize package builds with dependency-aware scheduling. But: each spawned process / thread has overhead; for tiny tasks, sequential can win.</p>

<h3>Why CI caching is high-leverage</h3>
<p>Every PR build re-runs from scratch unless you cache. Caching <code>node_modules</code> (saves 30-60s of npm install), the persistent compiler cache (saves transform work), and final outputs can turn 5-minute builds into 30-second ones. Most CI providers (GitHub Actions, CircleCI, GitLab) have built-in cache primitives.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "build pipeline" picture</h3>
<div class="diagram">
<pre>
 source files
    │
    ▼
 Module graph resolution (which file imports which?)
    │
    ▼
 Transform per file (Babel / SWC / esbuild / TS)
    │   ── caches per file ──
    ▼
 Tree shaking (drop unused exports)
    │
    ▼
 Code splitting (chunk graph)
    │
    ▼
 Minification (Terser / swc / esbuild)
    │
    ▼
 Asset hashing + emit
    │
    ▼
 Source maps + manifest
</pre>
</div>

<h3>The "speed comparison" picture</h3>
<table>
  <thead><tr><th>Stage</th><th>Babel + Webpack</th><th>swc + Rspack</th><th>esbuild</th></tr></thead>
  <tbody>
    <tr><td>Parse + transform 1000 files</td><td>10-30s</td><td>1-3s</td><td>0.3-1s</td></tr>
    <tr><td>Bundle</td><td>5-15s</td><td>2-5s</td><td>1-3s</td></tr>
    <tr><td>Minify</td><td>10-30s (Terser)</td><td>1-2s (swc)</td><td>0.5-1s (esbuild)</td></tr>
    <tr><td>Total cold build (1000 files)</td><td>30-90s</td><td>5-15s</td><td>3-8s</td></tr>
  </tbody>
</table>

<h3>The "cache layers" picture</h3>
<div class="diagram">
<pre>
 Process memory cache (dev server)
   ↓ persists across HMR cycles
 Filesystem cache (.next, .vite, .swc)
   ↓ persists across process restarts
 CI cache (GitHub Actions cache, S3)
   ↓ persists across builds, machines
 Distributed cache (Turborepo Remote Cache)
   ↓ shared across team + CI
</pre>
</div>

<h3>The "what triggers rebuild" picture</h3>
<table>
  <thead><tr><th>Change</th><th>What rebuilds</th></tr></thead>
  <tbody>
    <tr><td>Source file</td><td>That module + downstream chunks</td></tr>
    <tr><td>Config (vite.config.ts, webpack.config.js)</td><td>Full rebuild, cache invalidated</td></tr>
    <tr><td>package.json deps</td><td>Full rebuild, cache invalidated</td></tr>
    <tr><td>Type definition only</td><td>Type check; no bundle change (with Vite/swc)</td></tr>
    <tr><td>CSS module</td><td>That module + chunks importing it</td></tr>
  </tbody>
</table>

<h3>The "monorepo build dependency" picture</h3>
<div class="diagram">
<pre>
 packages/
   shared-utils ──┐
       │           │
       ▼           │
   api-client     ui-lib ───┐
       │           │         │
       ▼           ▼         ▼
       app-web    app-mobile  app-admin

 Turborepo / Nx:
   - Track which package depends on which.
   - Build in topological order.
   - Parallelize independent leaves.
   - Cache per-package by content hash.
   - Skip rebuilding packages whose hash matches cache.</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Build optimizations make my app faster for users." Build optimization makes <em>the build</em> faster — affecting developer iteration speed, CI cost, deploy frequency. Runtime perf is governed by bundle size, code splitting, image optimization (separate topic). Conflating the two leads to misdirected work.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Choosing fast tools</h3>
<table>
  <thead><tr><th>Need</th><th>Recommendation (2024+)</th></tr></thead>
  <tbody>
    <tr><td>New SPA / SSG</td><td><strong>Vite</strong> (esbuild dev + Rollup prod)</td></tr>
    <tr><td>Next.js</td><td>Built-in (swc compiler, Turbopack in dev for 14+)</td></tr>
    <tr><td>Library bundling</td><td><strong>tsup</strong> (esbuild) or <strong>unbuild</strong></td></tr>
    <tr><td>Migrating from Webpack with minimal config change</td><td><strong>Rspack</strong></td></tr>
    <tr><td>TypeScript-only transform</td><td><strong>swc</strong> or <strong>esbuild</strong> (drop tsc emit; use tsc --noEmit for type check)</td></tr>
    <tr><td>Babel-specific plugins</td><td>swc has a plugin system; Babel is fallback for niche plugins</td></tr>
  </tbody>
</table>

<h3>Vite — incremental dev</h3>
<pre><code class="language-js">// vite.config.ts
import { defineConfig } from 'vite';
export default defineConfig({
  // Dev: serves native ESM; HMR via WebSocket
  // Prod: Rollup with esbuild minification by default
  build: {
    target: 'es2020',           // skip transpiling to ES5
    minify: 'esbuild',          // 10-50× faster than terser
    cssMinify: 'lightningcss',  // Rust-based CSS minifier
  },
  optimizeDeps: {
    // Pre-bundle CommonJS dependencies into ESM (esbuild)
    include: ['lodash-es'],
    exclude: ['some-esm-only-lib'],
  },
});</code></pre>

<h3>Webpack 5 persistent cache</h3>
<pre><code class="language-js">module.exports = {
  cache: {
    type: 'filesystem',
    buildDependencies: { config: [__filename] },  // invalidate when config changes
    cacheDirectory: path.resolve(__dirname, '.webpack-cache'),
    compression: 'gzip',
  },
};
// Second build: 10-30× faster than first (cache hit on most files).</code></pre>

<h3>Replacing Babel with swc</h3>
<pre><code class="language-json">// package.json
{
  "devDependencies": {
    "@swc/core": "^1.x",
    "@swc/cli": "^0.x"
  }
}

// .swcrc
{
  "jsc": {
    "parser": { "syntax": "typescript", "tsx": true, "decorators": true },
    "target": "es2022",
    "transform": { "react": { "runtime": "automatic" } }
  },
  "module": { "type": "es6" }
}</code></pre>
<p>Webpack: <code>swc-loader</code>. Vite uses esbuild by default for transforms (also Rust/Go fast).</p>

<h3>tsc as type-check only</h3>
<pre><code class="language-json">// tsconfig.json
{
  "compilerOptions": {
    "noEmit": true        // tsc only verifies types; doesn't emit JS
  }
}

// package.json scripts
{
  "scripts": {
    "build": "vite build",          // emits via esbuild — fast
    "type-check": "tsc --noEmit",   // pure type checking
    "ci": "npm run type-check &amp;&amp; npm run build"
  }
}</code></pre>

<h3>Source map strategies</h3>
<pre><code class="language-js">// Webpack devtool options
{
  // Development — fast rebuild, good DX
  devtool: 'eval-cheap-module-source-map',

  // Production — full quality, hidden from public
  devtool: 'hidden-source-map',     // emits .map files, removes //# sourceMappingURL comment
  // Upload .map to Sentry; users get minified, devs get readable stacks.
}</code></pre>

<h3>Persistent compiler cache (swc / esbuild)</h3>
<pre><code class="language-bash"># swc
SWC_CACHE_DIR=.swc-cache npm run build

# tsc incremental
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}
# Second tsc run: only re-checks changed files</code></pre>

<h3>Turborepo for monorepos</h3>
<pre><code class="language-json">// turbo.json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"],
      "cache": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": [],
      "cache": true
    },
    "lint": { "outputs": [], "cache": true }
  }
}

// Run:
turbo run build --filter=web      // builds web + its deps in topological order
turbo run build --parallel        // ignore deps, run in parallel</code></pre>
<p>Turborepo hashes inputs (source + config + dep versions); on cache hit, restores outputs without running. Remote cache shares across team + CI: <code>turbo login</code>; <code>turbo link</code>.</p>

<h3>Nx alternative</h3>
<pre><code># Similar capabilities; richer plugin ecosystem
nx affected --target=build       # build only packages affected by changes
nx run-many --target=test --parallel=4</code></pre>

<h3>CI caching (GitHub Actions)</h3>
<pre><code class="language-yaml">- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'npm'                  # caches node_modules
- run: npm ci
- uses: actions/cache@v4
  with:
    path: |
      .next/cache
      node_modules/.cache
      .turbo
    key: build-\${{ hashFiles('package-lock.json', 'turbo.json') }}-\${{ github.sha }}
    restore-keys: |
      build-\${{ hashFiles('package-lock.json', 'turbo.json') }}-
- run: npm run build</code></pre>

<h3>HMR (Hot Module Replacement)</h3>
<pre><code class="language-js">// Vite HMR — automatic for components
if (import.meta.hot) {
  import.meta.hot.accept((newModule) =&gt; {
    // custom logic when this module updates
  });
  import.meta.hot.dispose(() =&gt; {
    // cleanup when replaced
  });
}
// React Fast Refresh: built-in for React components — preserves state across edits.</code></pre>

<h3>Bundle inspection during build</h3>
<pre><code># Vite
npx vite build --mode analyze    # with rollup-plugin-visualizer

# Webpack
webpack --json &gt; stats.json
npx webpack-bundle-analyzer stats.json

# Next.js
ANALYZE=true npm run build       # with @next/bundle-analyzer plugin

# Rspack
RSPACK_PROFILE=true npm run build</code></pre>

<h3>Build profiling</h3>
<pre><code># Webpack
npm run build -- --profile --json &gt; profile.json
# Inspect with speedscope or webpack-bundle-analyzer

# Vite
DEBUG="vite:*" npm run build      # verbose timing per stage

# tsc
tsc --extendedDiagnostics
# Outputs phase timings: parse, bind, check, emit</code></pre>

<h3>Codegen</h3>
<pre><code># GraphQL Code Generator
graphql-codegen --config codegen.yml
# Generates TypeScript types from GraphQL schema

# Route manifest (Next.js auto, Remix auto)

# OpenAPI client gen
openapi-typescript schema.yaml -o src/types/api.ts</code></pre>
<p>Cache codegen outputs; only re-run when schema changes.</p>

<h3>Asset processing</h3>
<pre><code class="language-js">// Vite asset handling
// SVG → React component:
import Logo from './logo.svg?react';

// Image processing (vite-imagetools):
import Hero from '/hero.jpg?w=800;1600&amp;format=webp&amp;as=srcset';

// Inline if small:
import data from './data.json?inline';</code></pre>

<h3>Output size budgets in build</h3>
<pre><code class="language-js">// vite.config.ts
build: {
  chunkSizeWarningLimit: 500,    // warn if chunk &gt; 500KB
}

// Webpack performance hints
performance: {
  hints: 'error',               // fail build if exceeded
  maxAssetSize: 250000,
  maxEntrypointSize: 250000,
}</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — Vite migration from CRA</h3>
<pre><code class="language-bash">npm create vite@latest my-app -- --template react-ts
# Copy over src/ from CRA
# Move public/ assets
# Update src/index.html → index.html in root
# Replace process.env.REACT_APP_* with import.meta.env.VITE_*
# Build time often drops from 60s → 5s</code></pre>

<h3>Example 2 — swc replaces Babel in Webpack</h3>
<pre><code class="language-js">// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'swc-loader',
          options: {
            jsc: {
              parser: { syntax: 'typescript', tsx: true },
              target: 'es2022',
              transform: { react: { runtime: 'automatic' } },
            },
          },
        },
      },
    ],
  },
};
// Babel removed → 5-10× faster transforms</code></pre>

<h3>Example 3 — Webpack 5 filesystem cache</h3>
<pre><code class="language-js">module.exports = {
  cache: {
    type: 'filesystem',
    buildDependencies: { config: [__filename] },
  },
  // Persistent cache: subsequent builds 10-30× faster
};</code></pre>

<h3>Example 4 — esbuild for library</h3>
<pre><code class="language-js">// build.mjs
import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'esm',
  outdir: 'dist',
  target: ['es2020'],
  sourcemap: true,
  minify: true,
});
// Library build in &lt; 1s</code></pre>

<h3>Example 5 — Turborepo task graph</h3>
<pre><code class="language-json">// turbo.json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "inputs": ["src/**", "tsconfig.json", "package.json"]
    }
  }
}

// Run:
// turbo build --filter=web → builds web + its dependencies, parallelized
// Cache hit on unchanged packages → restored from cache, not re-run</code></pre>

<h3>Example 6 — Turborepo Remote Cache</h3>
<pre><code class="language-bash"># Sign in to Vercel for free remote cache
turbo login
turbo link

# Now: dev runs are cached + shared across team
# CI runs benefit from previous local builds
# A teammate's build of "shared-utils" is reusable on your machine</code></pre>

<h3>Example 7 — GitHub Actions cache</h3>
<pre><code class="language-yaml">name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - uses: actions/cache@v4
        with:
          path: |
            node_modules/.cache
            .next/cache
            .turbo
          key: build-\${{ runner.os }}-\${{ hashFiles('**/package-lock.json') }}-\${{ github.sha }}
          restore-keys: build-\${{ runner.os }}-\${{ hashFiles('**/package-lock.json') }}-
      - run: npm run build</code></pre>

<h3>Example 8 — separate type check from build</h3>
<pre><code class="language-json">// package.json
{
  "scripts": {
    "build": "vite build",
    "type-check": "tsc --noEmit",
    "ci": "npm-run-all --parallel build type-check"
  }
}
// Two parallel tasks: build (fast, esbuild) + type-check (tsc).
// CI runs both in parallel; total ~ max of the two.</code></pre>

<h3>Example 9 — Next.js with Turbopack</h3>
<pre><code class="language-bash">next dev --turbo      # Rust-based incremental dev (Turbopack)

# In production:
# Next 14+ uses swc for transforms by default
# Turbopack for production builds is opt-in (still maturing)</code></pre>

<h3>Example 10 — bundle visualization</h3>
<pre><code class="language-js">// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default {
  plugins: [
    visualizer({ open: true, filename: 'stats.html', gzipSize: true, brotliSize: true }),
  ],
};
// After build: opens an interactive treemap of bundle composition</code></pre>

<h3>Example 11 — incremental TypeScript</h3>
<pre><code class="language-json">// tsconfig.json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "node_modules/.cache/.tsbuildinfo"
  },
  "include": ["src/**/*"]
}
// Subsequent tsc runs are 5-10× faster on typical projects</code></pre>

<h3>Example 12 — code splitting at build time</h3>
<pre><code class="language-js">// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        react: ['react', 'react-dom'],
        ui: ['@mui/material', '@emotion/react'],
        utils: ['lodash-es', 'date-fns'],
      },
    },
  },
},</code></pre>

<h3>Example 13 — esbuild plugin to inline an asset</h3>
<pre><code class="language-js">import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  loader: { '.svg': 'dataurl', '.png': 'file' },
  outdir: 'dist',
});
// SVGs inlined as data URIs; PNGs emitted as files</code></pre>

<h3>Example 14 — Bun as bundler / runtime</h3>
<pre><code class="language-bash">bun build src/index.ts --outdir dist --target browser --minify
# Bun's bundler — fast (Zig), bundles + transpiles + minifies
# Full Node/npm ecosystem compat in most cases</code></pre>

<h3>Example 15 — measuring CI time savings</h3>
<pre><code># Before optimizations:
# - npm ci: 60s
# - tsc: 90s
# - webpack build: 120s
# Total: 4.5 min

# After (cached):
# - npm ci (cached): 5s
# - swc transform (cached): 10s
# - bundle: 30s (skipped: most modules cached)
# Total: 45s

# 6× faster CI = faster PR feedback, fewer "is the build done yet" interruptions</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Babel plugins that swc doesn't support</h3>
<p>swc's plugin system is improving but doesn't have feature parity with Babel. Niche plugins (custom JSX transforms, decorators with specific options, some transpilation passes) may not work. Audit before migrating.</p>

<h3>2. tsc emit vs swc/esbuild emit</h3>
<p>tsc emit is slow but precise (full semantic analysis). swc/esbuild are faster but skip type checking — they emit based on syntax only. Use them for emit; tsc <code>--noEmit</code> for type check. If you need const enums or full TS semantics in emit, you may still need tsc.</p>

<h3>3. Cache invalidation</h3>
<p>Webpack 5 filesystem cache occasionally goes stale (rare). <code>rm -rf .webpack-cache</code> + rebuild. Vite: <code>rm -rf node_modules/.vite</code>. Turborepo: <code>turbo run build --force</code>.</p>

<h3>4. Source maps in CI fail upload to Sentry</h3>
<p>Production build emits maps; you upload to Sentry; the <em>release name</em> on Sentry must match the SDK's release name. Mismatch → no symbolication. Automate with <code>sentry-cli releases new $RELEASE</code> + matching SDK init.</p>

<h3>5. Persistent cache across machine restarts</h3>
<p>FS cache survives restarts but not <code>rm -rf node_modules</code>. Don't put cache inside node_modules unless OK with reinstalls clearing it (some teams want this).</p>

<h3>6. Differential serving (modern + legacy)</h3>
<p>Module/nomodule pattern requires two builds. Some bundlers do it in one pass; others require two passes. Measure CI time; one pass with esbuild is usually fast enough.</p>

<h3>7. esbuild minification edge cases</h3>
<p>esbuild's minifier is faster than terser but slightly less aggressive. ~5-10% larger output in some cases. Acceptable trade in dev / small projects; for max compression, use terser as final pass.</p>

<h3>8. Vite's optimizeDeps quirks</h3>
<p>Vite pre-bundles CommonJS dependencies on first run. New dep added → 5-10s pre-bundle pause. Pre-warm in CI by running <code>vite optimize</code>.</p>

<h3>9. Webpack 5 + ESM dependencies</h3>
<p>Some libs ship dual ESM/CJS but mis-configured exports field can cause Webpack to grab CJS variant → tree shaking blocked. Verify with bundle analyzer.</p>

<h3>10. Monorepo: package versions misalign</h3>
<p>Workspace A depends on react@18, B on react@19. Bundler can pull both → duplicate. Use peerDependencies + lockfile dedup.</p>

<h3>11. Turbo cache hit but wrong inputs declared</h3>
<p>If you forget to declare a file in <code>inputs</code>, Turbo doesn't include it in the hash → stale cache used. Default is "all files in package"; tighten with care.</p>

<h3>12. Dev server slow even with Vite</h3>
<p>Many CSS-in-JS or styled-components imports trigger pre-bundle on every dep. Use <code>optimizeDeps.include</code>. Or the lib uses non-ESM exports — Vite has to convert.</p>

<h3>13. Type-checking inside build vs separate</h3>
<p>Old setups: tsc inside webpack. Slow. Modern: tsc parallel via npm-run-all or Turbo. Faster on multi-core CI.</p>

<h3>14. Build output non-deterministic</h3>
<p>Two builds of identical input produce different bundles → cache miss. Causes: timestamps, random IDs, plugin order issues. Set <code>output.deterministic: true</code> or similar in config; verify with diff.</p>

<h3>15. Source maps blow up build size</h3>
<p>Source maps can be 5-10× the bundle size. Don't ship them to users; upload to crash service + serve them only behind authenticated paths.</p>

<h3>16. CI cache evicted under quota</h3>
<p>GitHub Actions cache: 10GB limit per repo. Old caches evicted. Check usage; clean up periodically; use restore-keys for graceful degradation.</p>

<h3>17. Codegen runs slower than expected</h3>
<p>GraphQL Code Gen on a 200-type schema can take 30s. Cache outputs; only re-run on schema change. Or use SWC-based gen tools (gql.tada).</p>

<h3>18. Builds vary across local + CI</h3>
<p>Different Node versions, npm versions, machine specs. Lock with <code>"engines"</code> in package.json + nvmrc. Use Docker or ephemeral CI runners for reproducibility.</p>

<h3>19. Bundle size regression from a small dep</h3>
<p>Adding a "tiny" dep that pulls a 200KB transitive dep. Always check bundle analyzer after adding deps.</p>

<h3>20. Watch mode misses changes</h3>
<p>File system watcher (chokidar) limits on Linux (default 8192 inotify watches). Symlinks, network drives can confuse. <code>echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf</code>.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — running tsc as the bundler</h3>
<p>tsc is a type checker that happens to emit JS. Slow at emit. Use esbuild / swc / Vite for emit; <code>tsc --noEmit</code> for type check.</p>

<h3>Anti-pattern 2 — Babel for new projects</h3>
<p>swc / esbuild are 10-100× faster, support TS + JSX + decorators natively. Babel only when you need a specific plugin not in swc.</p>

<h3>Anti-pattern 3 — webpack without cache: filesystem</h3>
<p>Webpack 5 default cache is memory-only. Persistent cache turns minutes into seconds; opt in.</p>

<h3>Anti-pattern 4 — no CI cache</h3>
<p>Every PR pays full <code>npm install</code> + clean build cost. <code>actions/cache</code> + <code>setup-node cache: 'npm'</code> are free wins.</p>

<h3>Anti-pattern 5 — Terser as the only minifier</h3>
<p>Terser is the slowest part of many builds. Switch to swc minify or esbuild minify; 10-50× faster.</p>

<h3>Anti-pattern 6 — full rebuild on dev start</h3>
<p>If your dev server cold-starts in 30+ seconds, you're not using incremental tools. Vite / Turbopack solve this.</p>

<h3>Anti-pattern 7 — manual bundle splitting that defeats caching</h3>
<p>Splitting wrong: vendor chunk includes app code; updates invalidate everything. Use stable splits (framework + vendor + app) with content hashing.</p>

<h3>Anti-pattern 8 — ignoring source map size</h3>
<p>Inline source maps in production HTML inflate transfer + parse. Use <code>hidden-source-map</code> + upload to Sentry.</p>

<h3>Anti-pattern 9 — running lint + test + build sequentially</h3>
<p>Independent tasks should parallelize. Use Turborepo / Nx / npm-run-all.</p>

<h3>Anti-pattern 10 — committed lockfile drift</h3>
<p>Lockfile out of sync with package.json → CI installs different deps than local. Always commit; CI uses <code>npm ci</code> (not <code>npm install</code>) for strict lockfile adherence.</p>

<h3>Anti-pattern 11 — global installs in CI</h3>
<p>Slow + nondeterministic. Use <code>npx</code> or local <code>devDependencies</code>.</p>

<h3>Anti-pattern 12 — building everything on every CI run</h3>
<p>Monorepo with 50 packages: a docs change doesn't need to rebuild the API. Use Turborepo / Nx affected detection.</p>

<h3>Anti-pattern 13 — non-deterministic builds</h3>
<p>Embed timestamps, random IDs, varying plugin order → cache misses + diff noise. Configure for determinism.</p>

<h3>Anti-pattern 14 — disabling cache because "it's broken"</h3>
<p>The 1% case where cache goes stale; team disables persistent cache entirely. Net loss. Fix the inputs declaration; debug the bad invalidation.</p>

<h3>Anti-pattern 15 — no build size budget</h3>
<p>Bundle grows over months; nobody notices until users complain. Set budgets in config (chunkSizeWarningLimit, performance.maxAssetSize) + CI gate.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. How do you make a build faster?</div>
  <div class="qa-answer">
    <ol>
      <li>Use modern Rust/Go-based tools — esbuild, swc, Rspack, Turbopack — over Babel + Webpack.</li>
      <li>Enable persistent filesystem cache.</li>
      <li>Replace Terser with swc minify or esbuild minify.</li>
      <li>Run type check separately from emit (tsc --noEmit, parallel).</li>
      <li>For monorepos: Turborepo / Nx with content-hash caching, parallel build.</li>
      <li>CI cache for node_modules, build cache, persistent compiler cache.</li>
      <li>Don't bundle in dev — Vite-style native ESM is incremental by nature.</li>
      <li>Profile to find specific slow stages; optimize the bottleneck first.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. esbuild vs swc — when to use which?</div>
  <div class="qa-answer">
    <p><strong>esbuild</strong> (Go): bundling + transform + minify, all-in-one. Extremely fast. Used by Vite for dev + many library tools (tsup). Smaller plugin ecosystem.</p>
    <p><strong>swc</strong> (Rust): primarily a Babel-replacement transform. Used by Next.js, plugin system more mature than esbuild. Pairs with Webpack/Rspack/Vite as a transformer.</p>
    <p>For new SPAs: Vite (esbuild dev + Rollup prod). For Next.js: built-in swc. For library bundling: tsup or unbuild.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Why is Vite so much faster than Webpack in dev?</div>
  <div class="qa-answer">
    <p>Vite's dev server doesn't bundle. It serves source files as native ES modules to the browser — the browser handles module loading. On change, only the changed file is re-transformed (via esbuild). HMR via WebSocket. Webpack rebuilds the bundle on each change, which scales with project size. Vite's startup time stays roughly constant regardless of project size.</p>
    <p>For production: Vite uses Rollup (bundling matters in prod for optimal output).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Explain Turborepo / Nx caching.</div>
  <div class="qa-answer">
    <p>Both hash inputs (source + config + dep versions) per task per package. On task run:</p>
    <ol>
      <li>Compute hash.</li>
      <li>Check cache (local + remote).</li>
      <li>Cache hit → restore outputs without running.</li>
      <li>Cache miss → run task, store outputs.</li>
    </ol>
    <p>Remote cache shares across team + CI. Saves enormous time in active monorepos: a teammate's build of <code>shared-utils</code> is reusable on your machine and in CI.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. How do you keep tsc fast in CI?</div>
  <div class="qa-answer">
    <ul>
      <li>Use <code>"incremental": true</code> + <code>tsBuildInfoFile</code> for cached re-checks.</li>
      <li>Run <code>tsc --noEmit</code> in parallel with the bundle build (npm-run-all -p).</li>
      <li>Use project references in monorepos for partial type checking.</li>
      <li>Avoid <code>--skipLibCheck false</code> unless really needed (slow).</li>
      <li>Cache <code>.tsbuildinfo</code> across CI runs.</li>
      <li>For very large codebases: tsserver in watch mode locally; tsc --noEmit gating CI only.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. What's HMR?</div>
  <div class="qa-answer">
    <p>Hot Module Replacement — swap a changed module in a running app without a full reload. Preserves component state, scroll position, open modals. React Fast Refresh is the React-specific HMR with state preservation across edits to component code. Implementation: dev server pushes the new module via WebSocket; client runtime applies it; framework adapters handle re-instantiating affected components.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Source maps strategy for production?</div>
  <div class="qa-answer">
    <p>Generate full source maps; emit them as separate files (<code>.js.map</code>). Choose between:</p>
    <ul>
      <li><strong><code>hidden-source-map</code></strong>: maps emitted but no <code>//# sourceMappingURL</code> comment. Maps not discoverable from public URL; upload to Sentry / Crashlytics for symbolication. Most secure.</li>
      <li><strong><code>source-map</code></strong>: maps emitted with public URL. Anyone can download — exposes source.</li>
      <li><strong><code>nosources-source-map</code></strong>: maps with line/column but no source content. Smaller, less useful.</li>
    </ul>
    <p>Recommendation: <code>hidden-source-map</code> + upload to Sentry. Errors symbolicate; source not exposed.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How do you optimize CI build time?</div>
  <div class="qa-answer">
    <ol>
      <li>Cache <code>node_modules</code> (or use <code>actions/setup-node cache: npm</code>).</li>
      <li>Cache build outputs (.next/cache, dist, .turbo).</li>
      <li>Cache compiler caches (.swc, .vite, .webpack-cache).</li>
      <li>Use <code>npm ci</code> (faster + deterministic) over <code>npm install</code>.</li>
      <li>Parallelize independent jobs (lint + test + type-check + build).</li>
      <li>Use Turborepo / Nx affected to skip unchanged packages.</li>
      <li>Use shallow git clone (<code>fetch-depth: 1</code>) when full history not needed.</li>
      <li>Profile CI; identify slowest stages.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. What's tsbuildinfo and why does it matter?</div>
  <div class="qa-answer">
    <p>TypeScript's incremental build info file. Stores file checksums and resolved types from the last build. On next <code>tsc</code>, files unchanged since last build are skipped — only changed files (and their dependents) are re-checked. 5-10× speedup on repeat type checks. Configure with <code>"incremental": true</code> + <code>"tsBuildInfoFile": "..."</code>. Cache in CI.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Persistent cache vs in-memory cache?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>In-memory</strong>: dev server lives in one process; cache resets on restart. Fast access while running.</li>
      <li><strong>Persistent (filesystem)</strong>: survives restarts. Build once, restart, build again — second is fast. Webpack 5, Vite, Turbopack, Rspack support.</li>
      <li><strong>Distributed (remote cache)</strong>: shared across machines + team + CI. Turborepo Remote Cache, Nx Cloud, sccache for Rust.</li>
    </ul>
    <p>Layer them: in-memory for active session, FS for restarts, remote for team sharing.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. How do you make builds deterministic?</div>
  <div class="qa-answer">
    <ul>
      <li>Pin dependency versions (lockfile committed).</li>
      <li>Use <code>npm ci</code> in CI (strict lockfile install).</li>
      <li>Set bundler options for deterministic chunk IDs (Webpack <code>optimization.moduleIds: 'deterministic'</code>).</li>
      <li>Avoid timestamps / random IDs in output.</li>
      <li>Sort plugin results stably.</li>
      <li>Use <code>SOURCE_DATE_EPOCH</code> for reproducible build times.</li>
      <li>Verify by comparing two builds of the same commit.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. What's the build optimization "low-hanging fruit"?</div>
  <div class="qa-answer">
    <ol>
      <li>Replace Babel with swc.</li>
      <li>Replace Terser with swc/esbuild minify.</li>
      <li>Enable Webpack 5 filesystem cache.</li>
      <li>Add CI cache for node_modules + build cache.</li>
      <li>Parallel type-check + bundle.</li>
      <li>Move tsc to <code>--noEmit</code>.</li>
    </ol>
    <p>Each is a config-level change with 2-10× speedup. Together: 10-50× faster builds. No deep refactor needed.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. What tools profile a slow build?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Webpack</strong>: <code>--profile --json</code> + <code>speedscope</code> or analyzer.</li>
      <li><strong>Vite</strong>: <code>DEBUG="vite:*"</code> for verbose timing.</li>
      <li><strong>tsc</strong>: <code>--extendedDiagnostics</code> shows phase timings.</li>
      <li><strong>Turborepo</strong>: <code>--profile=profile.json</code> + chrome://tracing.</li>
      <li><strong>esbuild</strong>: <code>metafile: true</code> emits a JSON for analysis.</li>
    </ul>
    <p>Goal: find the slowest 1-2 stages, optimize them. Often: minification, type-checking, or a single misbehaving plugin.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Monorepo build strategy?</div>
  <div class="qa-answer">
    <ol>
      <li>Pick a tool: Turborepo (lightweight, simple) or Nx (richer, opinionated).</li>
      <li>Define task graph: which packages depend on which.</li>
      <li>Each task has inputs + outputs declared.</li>
      <li>Hash-based caching per task.</li>
      <li>Parallelize independent tasks.</li>
      <li>Remote cache across team.</li>
      <li>Affected detection: only build/test packages affected by the diff.</li>
      <li>CI runs <code>turbo run build test lint</code> with affected scope on PRs; full build on main.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. You inherit a 5-minute build. First moves?</div>
  <div class="qa-answer">
    <ol>
      <li>Run with profile flags; identify slowest stages.</li>
      <li>If Babel + Webpack 4: migrate to swc + Webpack 5 (or Vite). Often 5× speedup.</li>
      <li>Enable filesystem cache.</li>
      <li>Replace Terser → swc/esbuild minify.</li>
      <li>Move tsc to --noEmit + parallel.</li>
      <li>Add CI cache for everything (node_modules + build cache + .turbo).</li>
      <li>If monorepo: add Turborepo/Nx with affected detection.</li>
      <li>Re-measure; aim for &lt;1 minute on incremental, &lt;3 minutes cold.</li>
    </ol>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You distinguish build pipeline perf from runtime perf.</li>
    <li>You pick Vite / esbuild / swc / Rspack / Turbopack over Babel + Webpack.</li>
    <li>You enable persistent filesystem cache.</li>
    <li>You separate type check (tsc --noEmit) from emit (esbuild/swc).</li>
    <li>You use Turborepo / Nx for monorepo builds with caching + affected detection.</li>
    <li>You cache aggressively in CI (node_modules + build outputs + compiler cache).</li>
    <li>You profile to find bottlenecks before optimizing.</li>
    <li>You use hidden source maps + Sentry symbolication.</li>
    <li>You parallelize independent tasks (lint + test + type-check + build).</li>
    <li>You set bundle size budgets in build config.</li>
  </ul>
</div>
`}

]
});
