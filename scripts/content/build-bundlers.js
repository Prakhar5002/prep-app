window.PREP_SITE.registerTopic({
  id: 'build-bundlers',
  module: 'Build Tooling',
  title: 'Bundlers (Webpack / Vite / Metro)',
  estimatedReadTime: '28 min',
  tags: ['build', 'bundler', 'webpack', 'vite', 'rollup', 'esbuild', 'metro', 'rspack', 'turbopack'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>A bundler walks your dependency graph (imports / requires) and produces optimized output for the browser or runtime. Different tools for different needs.</p>
<ul>
  <li><strong>Webpack</strong> — most flexible, plugin-rich, slowest. Still dominant in legacy and complex configs.</li>
  <li><strong>Vite</strong> — modern default. Native ESM in dev (no bundling), Rollup for production. Fast.</li>
  <li><strong>Rollup</strong> — best for libraries (small clean ESM/CJS output). Used inside Vite.</li>
  <li><strong>esbuild</strong> — extremely fast (Go). Bundle + transform + minify in one. Smaller plugin ecosystem.</li>
  <li><strong>Rspack</strong> — Rust port of Webpack. Drop-in replacement, ~10× faster.</li>
  <li><strong>Turbopack</strong> — Vercel's incremental Rust bundler, used in Next.js dev (production still maturing).</li>
  <li><strong>Metro</strong> — React Native's bundler. JS-based, optimized for RN's deferred-require + asset model.</li>
  <li><strong>Parcel</strong> — zero-config bundler; less popular than Vite now but strong dev experience.</li>
  <li><strong>Bun</strong> — newer all-in-one runtime + bundler (Zig); promising, ecosystem still maturing.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>For new SPAs / SSGs: Vite. For Next.js: built-in (swc + Turbopack). For libraries: tsup (esbuild) or Rollup. For React Native: Metro is your only choice. For migrating Webpack with minimal changes: Rspack.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What a bundler does</h3>
<p>A bundler:</p>
<ol>
  <li><strong>Resolves modules</strong> — follows imports to find dependencies.</li>
  <li><strong>Builds a graph</strong> — DAG of all modules from entry points.</li>
  <li><strong>Transforms</strong> — JSX → JS, TS → JS, SCSS → CSS, etc. (via loaders / plugins).</li>
  <li><strong>Optimizes</strong> — tree shaking, dead code elimination, minification, scope hoisting.</li>
  <li><strong>Splits</strong> — emits multiple chunks (vendor, app, async).</li>
  <li><strong>Hashes + emits</strong> — content-hashed filenames for long cache.</li>
  <li><strong>Generates</strong> — manifests, source maps, asset pipelines.</li>
</ol>

<h3>Why we need bundlers (still)</h3>
<p>Native ESM works in browsers — why bundle at all?</p>
<ul>
  <li><strong>Fewer requests</strong> — even with HTTP/2, parse + compile favors fewer larger files than thousands of native modules.</li>
  <li><strong>Tree shaking</strong> — drop unused exports.</li>
  <li><strong>Polyfills + transforms</strong> — TS, JSX, optional chaining, etc. for browser compatibility.</li>
  <li><strong>Asset handling</strong> — images, CSS, fonts handled as part of the graph.</li>
  <li><strong>Code splitting</strong> — emit per-route chunks.</li>
</ul>
<p>Vite's dev-time approach (serve native ESM, bundle only for prod) shows the middle ground.</p>

<h3>Why Webpack ruled for a decade</h3>
<p>Most flexible — anything could be a "module" via loaders (CSS, images, GraphQL, MDX). Plugin API enabled crazy customizations. Mature SSR / HMR / DLL strategies. But: written in JS, single-threaded for transforms, slow on large projects. Modern alternatives match its flexibility while being 10-100× faster.</p>

<h3>Why Vite changed the game</h3>
<p>Two innovations:</p>
<ul>
  <li><strong>Dev: native ESM</strong> — browser handles module loading; only changed files re-transform. Startup near-instant; HMR sub-100ms.</li>
  <li><strong>Prod: Rollup with esbuild</strong> — Rollup's optimal output + esbuild's fast transforms.</li>
</ul>
<p>Result: dev experience that scales with project size. 1000 files: still &lt;1s startup.</p>

<h3>Why Metro is special</h3>
<p>React Native has constraints web doesn't:</p>
<ul>
  <li>Output bundled JS that JSCore / Hermes evaluates on device.</li>
  <li>Asset pipeline for images at multiple resolutions (1x, 2x, 3x).</li>
  <li>Platform-specific files (.ios.tsx vs .android.tsx).</li>
  <li>Inline-requires for startup performance.</li>
  <li>Hot module replacement over WebSocket to native runtime.</li>
</ul>
<p>Metro is purpose-built for this. Alternatives (Re.Pack with Webpack) exist but Metro is the default and most teams use it.</p>

<h3>Why Rust / Go bundlers (Rspack, Turbopack)</h3>
<p>Webpack's plugin API became its bottleneck — JS callbacks per module. Rust ports rebuild the core in native code while preserving config compat. Rspack: drop-in Webpack replacement (~10× faster). Turbopack: incremental, designed from scratch for Next.js. Both still maturing on plugin ecosystem.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "module graph" picture</h3>
<div class="diagram">
<pre>
  Entry: src/index.ts
    │
    ├─► imports './App.tsx'
    │     │
    │     ├─► imports 'react'
    │     ├─► imports './styles.css'
    │     └─► imports './Header.tsx'
    │           │
    │           └─► imports 'lodash'
    │
    └─► imports './polyfills.ts'

 Bundler walks this graph, transforms each node, emits as chunks.</pre>
</div>

<h3>The "comparison" picture</h3>
<table>
  <thead><tr><th>Tool</th><th>Lang</th><th>Best for</th><th>Speed</th><th>Config</th></tr></thead>
  <tbody>
    <tr><td>Webpack 5</td><td>JS</td><td>Legacy / complex configs</td><td>Slow</td><td>Heavy</td></tr>
    <tr><td>Vite</td><td>JS + esbuild + Rollup</td><td>SPAs, SSGs, modern apps</td><td>Very fast</td><td>Light</td></tr>
    <tr><td>Rollup</td><td>JS</td><td>Libraries</td><td>Medium</td><td>Light</td></tr>
    <tr><td>esbuild</td><td>Go</td><td>Library bundles, dev tools</td><td>Extremely fast</td><td>Minimal</td></tr>
    <tr><td>Rspack</td><td>Rust</td><td>Webpack-compat fast</td><td>Fast</td><td>Webpack-style</td></tr>
    <tr><td>Turbopack</td><td>Rust</td><td>Next.js dev</td><td>Fast (incremental)</td><td>Built-in</td></tr>
    <tr><td>Metro</td><td>JS</td><td>React Native only</td><td>Medium</td><td>Light</td></tr>
    <tr><td>Parcel</td><td>JS</td><td>Quick prototypes</td><td>Medium</td><td>Zero</td></tr>
    <tr><td>Bun</td><td>Zig</td><td>All-in-one (runtime + bundler)</td><td>Very fast</td><td>Light</td></tr>
  </tbody>
</table>

<h3>The "Vite dev flow"</h3>
<div class="diagram">
<pre>
 Browser requests /src/App.tsx
    │
    ▼
 Vite dev server (Node)
    │
    ├─► If TS / JSX / SCSS: transform via esbuild (sync, fast)
    ├─► If npm dep: pre-bundled to ESM (cached)
    └─► Returns native ESM source

 Browser parses ESM, requests imports recursively
 HMR via WebSocket: changed file → invalidate + re-fetch</pre>
</div>

<h3>The "Webpack build flow"</h3>
<div class="diagram">
<pre>
 Read entry
    │
    ▼
 Resolve all imports → module graph
    │
    ▼
 For each module: run loaders (Babel, css-loader, etc.)
    │
    ▼
 Tree shake (mark unused exports)
    │
    ▼
 Code split (extract chunks per import())
    │
    ▼
 Optimize (Terser minify, scope hoist)
    │
    ▼
 Emit bundle.[hash].js, vendor.[hash].js, manifest.json</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Vite uses esbuild in production." Vite uses esbuild for <em>dev transforms + dependency pre-bundling</em>; production builds use <strong>Rollup</strong> for the actual bundling (with esbuild for minification). Rollup's tree-shaking + chunk-splitting is more battle-tested for production output.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Webpack 5</h3>
<pre><code class="language-js">// webpack.config.js
const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true,
  },
  resolve: { extensions: ['.tsx', '.ts', '.jsx', '.js'] },
  module: {
    rules: [
      { test: /\\.[jt]sx?$/, exclude: /node_modules/, use: 'swc-loader' },
      { test: /\\.css$/, use: ['style-loader', 'css-loader'] },
      { test: /\\.(png|jpg|svg)$/, type: 'asset/resource' },
    ],
  },
  optimization: {
    splitChunks: { chunks: 'all' },
    runtimeChunk: 'single',
  },
  cache: { type: 'filesystem' },
  plugins: [/* HtmlWebpackPlugin, etc. */],
};</code></pre>

<h3>Vite</h3>
<pre><code class="language-js">// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          ui: ['@mui/material'],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});</code></pre>
<p>Run: <code>vite</code> for dev (instant), <code>vite build</code> for prod, <code>vite preview</code> to serve build.</p>

<h3>Rollup (libraries)</h3>
<pre><code class="language-js">// rollup.config.mjs
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/index.ts',
  output: [
    { file: 'dist/index.cjs', format: 'cjs' },
    { file: 'dist/index.mjs', format: 'esm' },
  ],
  external: ['react', 'react-dom'],   // peer deps not bundled
  plugins: [nodeResolve(), commonjs(), typescript()],
};</code></pre>

<h3>esbuild (libraries / scripts)</h3>
<pre><code class="language-js">// build.mjs
import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'browser',
  format: 'esm',
  target: ['es2020'],
  outdir: 'dist',
  sourcemap: true,
  minify: true,
  external: ['react', 'react-dom'],
});
// Library bundle in &lt; 1s</code></pre>

<h3>tsup (wrapper around esbuild)</h3>
<pre><code class="language-js">// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,                  // emit .d.ts via tsc
  clean: true,
  sourcemap: true,
  minify: true,
});
// One config; handles dual ESM/CJS + types. Most popular library bundler.</code></pre>

<h3>Rspack (drop-in Webpack replacement)</h3>
<pre><code class="language-js">// rspack.config.js — same shape as webpack.config.js
module.exports = {
  mode: 'production',
  entry: './src/index.tsx',
  output: { filename: '[name].[contenthash].js' },
  module: {
    rules: [
      { test: /\\.[jt]sx?$/, use: 'builtin:swc-loader' },   // built-in swc
    ],
  },
};
// Migrate by renaming webpack.config.js → rspack.config.js (mostly)</code></pre>

<h3>Turbopack (Next.js)</h3>
<pre><code class="language-bash"># Next.js 14+ dev mode uses Turbopack by default
next dev --turbo

# Production build: still using webpack/swc by default
# Turbopack production builds are gradually rolling out</code></pre>

<h3>Metro (React Native)</h3>
<pre><code class="language-js">// metro.config.js
const { getDefaultConfig } = require('@react-native/metro-config');

const config = {
  transformer: {
    getTransformOptions: async () =&gt; ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,           // critical for startup perf
      },
    }),
  },
  resolver: {
    sourceExts: ['ts', 'tsx', 'js', 'jsx', 'json'],
    assetExts: ['png', 'jpg', 'gif', 'svg', 'mp3', 'mp4', 'ttf'],
    platforms: ['ios', 'android'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);</code></pre>

<h3>Parcel (zero-config)</h3>
<pre><code class="language-bash">parcel src/index.html              # dev
parcel build src/index.html       # production
# No config needed — auto-detects HTML, JS, CSS, assets</code></pre>

<h3>Bun (all-in-one)</h3>
<pre><code class="language-bash">bun build src/index.ts \\
  --outdir=dist \\
  --target=browser \\
  --minify \\
  --splitting

# Bun is also a runtime + package manager + test runner</code></pre>

<h3>Choosing per project type</h3>
<table>
  <thead><tr><th>Project</th><th>Recommendation</th></tr></thead>
  <tbody>
    <tr><td>SPA / SSG (React, Vue, Svelte)</td><td>Vite</td></tr>
    <tr><td>Next.js</td><td>Built-in (Turbopack dev, swc + webpack prod)</td></tr>
    <tr><td>Remix</td><td>Built-in (Vite-based since v2)</td></tr>
    <tr><td>Library (TS / JS)</td><td>tsup or Rollup</td></tr>
    <tr><td>Component library</td><td>tsup with <code>--external react</code></td></tr>
    <tr><td>React Native app</td><td>Metro</td></tr>
    <tr><td>Legacy webpack project</td><td>Rspack (drop-in upgrade) or migrate to Vite</td></tr>
    <tr><td>Quick prototype</td><td>Parcel or Vite</td></tr>
    <tr><td>Edge function / Cloudflare Workers</td><td>esbuild or Bun</td></tr>
  </tbody>
</table>

<h3>Asset handling — built-in or plugin</h3>
<pre><code class="language-ts">// Vite — built-in
import logo from './logo.svg';                         // emits as URL
import logoUrl from './logo.svg?url';                  // explicit URL
import LogoComponent from './logo.svg?react';          // React component (with plugin)
import data from './data.json';                        // ESM module (parsed)
import data from './data.json?inline';                 // inline as data URL</code></pre>

<h3>HMR (Hot Module Replacement)</h3>
<pre><code class="language-js">// Vite HMR — opt into module updates
if (import.meta.hot) {
  import.meta.hot.accept((newMod) =&gt; {
    // re-init when this module updates
  });
  import.meta.hot.dispose(() =&gt; {
    // cleanup before replacement
  });
}

// React Fast Refresh: built-in via @vitejs/plugin-react — preserves component state.</code></pre>

<h3>Bundle visualization</h3>
<pre><code class="language-js">// Vite: rollup-plugin-visualizer
import { visualizer } from 'rollup-plugin-visualizer';
plugins: [visualizer({ open: true, gzipSize: true })];

// Webpack: webpack-bundle-analyzer
plugins: [new BundleAnalyzerPlugin()];

// esbuild: --metafile + esbuild-visualizer
esbuild build --metafile=meta.json
npx esbuild-visualizer --metadata meta.json</code></pre>

<h3>Plugin systems</h3>
<table>
  <thead><tr><th>Bundler</th><th>Plugin API</th></tr></thead>
  <tbody>
    <tr><td>Webpack</td><td>Tap into compiler hooks (compilation.hooks.*); plugin classes</td></tr>
    <tr><td>Vite / Rollup</td><td>Rollup plugin API (resolveId, load, transform). Vite extends with serverMiddleware, HMR</td></tr>
    <tr><td>esbuild</td><td>onResolve, onLoad. Smaller surface but fast</td></tr>
    <tr><td>Rspack</td><td>Webpack plugin API (mostly compatible)</td></tr>
    <tr><td>Metro</td><td>Transformers + resolvers; not as flexible</td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — Vite + React + TS minimal</h3>
<pre><code class="language-bash">npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm run dev      # vite — instant
npm run build    # rollup + esbuild minify
npm run preview  # serve build locally</code></pre>

<h3>Example 2 — migrating CRA to Vite</h3>
<pre><code class="language-bash">npm install -D vite @vitejs/plugin-react
# Move public/index.html → root index.html
# Add &lt;script type="module" src="/src/index.tsx"&gt;&lt;/script&gt;
# Replace process.env.REACT_APP_* with import.meta.env.VITE_*
# Update package.json scripts:
#   "dev": "vite", "build": "vite build", "preview": "vite preview"
# Build time: 60s → 5s typical</code></pre>

<h3>Example 3 — Webpack production config</h3>
<pre><code class="language-js">// webpack.prod.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'production',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].chunk.js',
    publicPath: '/',
    clean: true,
  },
  module: {
    rules: [
      { test: /\\.[jt]sx?$/, exclude: /node_modules/, loader: 'swc-loader' },
      { test: /\\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] },
      { test: /\\.(png|jpg|webp)$/, type: 'asset/resource' },
    ],
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: { test: /node_modules/, name: 'vendor', priority: 10 },
      },
    },
    runtimeChunk: 'single',
  },
  cache: { type: 'filesystem' },
  plugins: [
    new HtmlWebpackPlugin({ template: './public/index.html' }),
    new MiniCssExtractPlugin({ filename: '[name].[contenthash:8].css' }),
  ],
};</code></pre>

<h3>Example 4 — Rollup library config</h3>
<pre><code class="language-js">// rollup.config.mjs
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { dts } from 'rollup-plugin-dts';

export default [
  {
    input: 'src/index.ts',
    output: [
      { file: 'dist/index.cjs', format: 'cjs', sourcemap: true },
      { file: 'dist/index.mjs', format: 'esm', sourcemap: true },
    ],
    external: ['react'],
    plugins: [nodeResolve(), commonjs(), typescript()],
  },
  {
    input: 'src/index.ts',
    output: { file: 'dist/index.d.ts', format: 'esm' },
    plugins: [dts()],
  },
];</code></pre>

<h3>Example 5 — tsup library config</h3>
<pre><code class="language-ts">// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  external: ['react', 'react-dom'],
});</code></pre>

<h3>Example 6 — esbuild watch mode</h3>
<pre><code class="language-js">// dev.mjs
import { context } from 'esbuild';
const ctx = await context({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/bundle.js',
  sourcemap: 'inline',
});
await ctx.watch();
console.log('Watching for changes...');</code></pre>

<h3>Example 7 — Vite manual chunk strategy</h3>
<pre><code class="language-ts">build: {
  rollupOptions: {
    output: {
      manualChunks(id) {
        if (id.includes('node_modules')) {
          if (id.includes('react') || id.includes('scheduler')) return 'react';
          if (id.includes('@mui')) return 'mui';
          if (id.includes('lodash')) return 'lodash';
          return 'vendor';
        }
      },
    },
  },
},</code></pre>

<h3>Example 8 — Vite plugin example</h3>
<pre><code class="language-ts">// vite-plugin-example.ts
import type { Plugin } from 'vite';

export function pluginExample(): Plugin {
  return {
    name: 'plugin-example',
    transform(code, id) {
      if (id.endsWith('.special.ts')) {
        return { code: \`/* transformed */ \${code}\`, map: null };
      }
    },
    handleHotUpdate({ file, server }) {
      if (file.endsWith('.config.json')) {
        server.ws.send({ type: 'full-reload' });
      }
    },
  };
}</code></pre>

<h3>Example 9 — Webpack DLL plugin (legacy fast rebuilds)</h3>
<pre><code class="language-js">// webpack.dll.config.js
new webpack.DllPlugin({
  path: path.join(__dirname, 'dist', 'manifest.json'),
  name: 'vendor',
});
// Pre-builds vendor bundles; main build references manifest.
// Mostly obsolete with Webpack 5 filesystem cache.</code></pre>

<h3>Example 10 — Metro custom resolver</h3>
<pre><code class="language-js">// metro.config.js
const config = {
  resolver: {
    resolveRequest: (context, moduleName, platform) =&gt; {
      if (moduleName === 'crypto') {
        return { filePath: require.resolve('react-native-crypto'), type: 'sourceFile' };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};</code></pre>

<h3>Example 11 — bundle visualization</h3>
<pre><code class="language-ts">// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';
plugins: [
  visualizer({
    filename: 'dist/stats.html',
    open: true,
    gzipSize: true,
    brotliSize: true,
  }),
],
// Treemap shows: react+react-dom = 130KB gzipped, your code = 50KB, etc.</code></pre>

<h3>Example 12 — Webpack 5 → Rspack migration</h3>
<pre><code class="language-bash">npm install -D @rspack/cli @rspack/core
mv webpack.config.js rspack.config.js
# Rename: WebpackPlugin → RspackPlugin (most plugin equivalents exist)
# Run: rspack build
# 5-10× faster on most projects</code></pre>

<h3>Example 13 — Vite SSR</h3>
<pre><code class="language-ts">// vite.config.ts
build: {
  ssr: 'src/entry-server.ts',     // produces a Node-compatible bundle
  outDir: 'dist/server',
}
// Run: vite build --ssr
// Use with custom Express / Fastify server, or with frameworks (Astro, SvelteKit, SolidStart)</code></pre>

<h3>Example 14 — Webpack federation (microfrontends)</h3>
<pre><code class="language-js">new ModuleFederationPlugin({
  name: 'host',
  remotes: { mfe1: 'mfe1@https://mfe1.example.com/remoteEntry.js' },
  shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
});
// Allow runtime sharing of modules across separately-deployed apps</code></pre>

<h3>Example 15 — esbuild plugin to log stats</h3>
<pre><code class="language-js">await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/index.js',
  metafile: true,
  plugins: [{
    name: 'log-build',
    setup(build) {
      build.onEnd((res) =&gt; {
        const total = Object.values(res.metafile.outputs)
          .reduce((s, o) =&gt; s + o.bytes, 0);
        console.log('Total:', (total / 1024).toFixed(1), 'KB');
      });
    },
  }],
});</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Vite optimizeDeps quirks</h3>
<p>Vite pre-bundles CommonJS deps to ESM on first run. Adding a new dep triggers a 5-10s pause. Pre-warm with <code>vite optimize</code> in CI.</p>

<h3>2. Webpack and ESM dependencies</h3>
<p>Some libraries dual-publish ESM + CJS. Webpack's exports field resolution can pick CJS by accident — defeats tree shaking. Verify with bundle analyzer; force ESM with <code>resolve.mainFields: ['module', 'main']</code>.</p>

<h3>3. Rollup's tree shaking is strict</h3>
<p>If a library has side effects (top-level mutations, polyfill registration), Rollup keeps everything. Add <code>"sideEffects": false</code> to library's package.json.</p>

<h3>4. esbuild's TypeScript handling</h3>
<p>esbuild transpiles TS but doesn't type-check. For type errors, run <code>tsc --noEmit</code> separately. esbuild also doesn't fully implement <code>const enum</code> (rare but bites).</p>

<h3>5. Metro and symlinks (monorepos)</h3>
<p>Metro has historically had trouble with workspace symlinks. Solutions: <code>nohoist</code> in workspace config; <code>watchFolders</code> in metro.config.js; or use Yarn workspaces with <code>nodeLinker: 'node-modules'</code>.</p>

<h3>6. Vite's CSS code splitting</h3>
<p>By default, Vite extracts CSS per chunk. For SSR, may want <code>build.cssCodeSplit: false</code> to inline everything.</p>

<h3>7. Source map alignment</h3>
<p>Different bundlers + minifiers produce different source map qualities. esbuild's are good but slightly less precise than Terser's. Test with Sentry symbolication.</p>

<h3>8. HMR boundaries</h3>
<p>HMR updates work for accepted modules. If a non-accepted module changes, full reload. Frameworks (React Fast Refresh, Vue HMR) auto-accept components; non-component files (utilities, constants) cause full reloads.</p>

<h3>9. Rspack plugin compatibility</h3>
<p>Rspack supports most Webpack plugins but not all — especially complex ones using deep compiler hooks. Check Rspack's compatibility list before migrating.</p>

<h3>10. Turbopack's beta status</h3>
<p>As of 2024, Turbopack is stable for Next.js dev, beta for production builds. Some Webpack features (custom plugins) not yet supported. Watch for stable production release.</p>

<h3>11. Parcel auto-config trap</h3>
<p>Parcel detects file types and applies transformers automatically. Adding an unusual file extension can fail silently. Explicit <code>.parcelrc</code> config helps.</p>

<h3>12. Bun bundler ecosystem gaps</h3>
<p>Bun's bundler is fast and Node-compatible but newer. Some npm packages with native dependencies don't work; some plugins / loaders missing. Use for greenfield projects with vetted deps.</p>

<h3>13. Webpack ResolveExtensionAliasOption</h3>
<p>Modern Node ESM requires explicit <code>.js</code> in imports even for <code>.ts</code> files. Webpack and Vite handle differently. Configure <code>resolve.extensionAlias</code> for cross-tool consistency.</p>

<h3>14. Public path / base URL</h3>
<p>If serving from a sub-path (e.g., <code>https://example.com/app/</code>), set the bundler's public path:</p>
<ul>
  <li>Webpack: <code>output.publicPath: '/app/'</code></li>
  <li>Vite: <code>base: '/app/'</code></li>
  <li>Metro: not relevant</li>
</ul>

<h3>15. Asset URLs in CSS</h3>
<p>Bundlers rewrite <code>url()</code> in CSS to point to emitted assets. Cross-package CSS imports can fail if asset path resolution differs. Test asset URLs in production.</p>

<h3>16. Tree-shaking React</h3>
<p>React is mostly tree-shakable but historically had hooks attached as named exports — some bundles still ship the whole API surface. Modern React + Vite handle well.</p>

<h3>17. Deprecated loaders</h3>
<p>Old Webpack configs use deprecated loaders (<code>file-loader</code>, <code>url-loader</code>). Webpack 5 has Asset Modules built in — migrate.</p>

<h3>18. Bundle size after framework upgrade</h3>
<p>Major framework upgrades (React 18 → 19, Vue 2 → 3) can drop bundle size significantly. Audit after each upgrade.</p>

<h3>19. Metro inline-requires breaking patterns</h3>
<p><code>inlineRequires: true</code> moves <code>require</code> calls inline. Some patterns relying on import order fail. Test thoroughly after enabling.</p>

<h3>20. Custom Metro transformers</h3>
<p>Metro's transformer is configurable but the API is less documented than Webpack's. Reaching for custom transforms is often a sign you should pre-process at build time outside Metro.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — Webpack 4 in 2024</h3>
<p>Webpack 5 has filesystem cache, asset modules, ESM support. Webpack 4 is EOL. Upgrade.</p>

<h3>Anti-pattern 2 — Babel + Webpack for new projects</h3>
<p>Slower than alternatives. Use swc-loader or migrate to Vite.</p>

<h3>Anti-pattern 3 — bundling everything into one file</h3>
<p>Defeats long-term caching. Always split vendor + app + per-route chunks.</p>

<h3>Anti-pattern 4 — bundling for libraries that should be peer deps</h3>
<p>Libraries shouldn't bundle React. Mark React + ReactDOM as <code>external</code>.</p>

<h3>Anti-pattern 5 — emitting CommonJS only for libraries</h3>
<p>Modern apps use ESM. Dual-publish (CJS + ESM) via <code>exports</code> field.</p>

<h3>Anti-pattern 6 — missing source maps in prod</h3>
<p>Production crashes show minified stacks. Use hidden source maps + Sentry.</p>

<h3>Anti-pattern 7 — over-configuring Webpack</h3>
<p>500-line webpack.config.js with custom loaders and plugins for every edge case. Migrate to Vite — usually 30 lines.</p>

<h3>Anti-pattern 8 — committing dist folder</h3>
<p>Build artifacts in git → bloated repo, merge conflicts. Build in CI; deploy from there.</p>

<h3>Anti-pattern 9 — hashed filenames in HTML hardcoded</h3>
<p>Use HtmlWebpackPlugin (Webpack) or Vite's auto-injection. Manually editing HTML breaks every deploy.</p>

<h3>Anti-pattern 10 — disabling tree shaking by mistake</h3>
<p><code>"sideEffects": true</code> in package.json (or omitted). Bundler keeps everything. Verify.</p>

<h3>Anti-pattern 11 — using parcel/rollup for SPA prod</h3>
<p>They work but Vite is more SPA-tailored. Less config, better defaults.</p>

<h3>Anti-pattern 12 — forgetting publicPath for sub-path deploys</h3>
<p>App at <code>example.com/app</code> with publicPath <code>/</code> → asset URLs broken. Configure correctly.</p>

<h3>Anti-pattern 13 — ignoring Metro inline-requires for RN</h3>
<p>Default off; turning on improves startup 30-50%. Most teams don't realize.</p>

<h3>Anti-pattern 14 — running bundler on wrong Node version</h3>
<p>Bundlers depend on Node features. Pin Node version (.nvmrc + engines) to avoid mysterious build failures.</p>

<h3>Anti-pattern 15 — manual minification</h3>
<p>Don't pre-minify your source. Bundlers handle minification; pre-minified inputs are slower to parse and harder to debug.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. What does a bundler do?</div>
  <div class="qa-answer">
    <p>Walks the dependency graph from entry points, transforms each module (TS, JSX, SCSS), tree-shakes unused exports, code-splits into chunks, minifies, and emits the result with content-hashed filenames + source maps. Provides asset handling (images, CSS, fonts) and dev server with HMR.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Webpack vs Vite — when to use which?</div>
  <div class="qa-answer">
    <p><strong>Vite</strong>: new projects, SPAs, SSGs. Native ESM dev (instant startup), Rollup prod, lighter config. Default for modern apps.</p>
    <p><strong>Webpack</strong>: legacy projects with complex configs, niche plugins not yet ported, microfrontends with Module Federation. Slower; consider Rspack as drop-in faster replacement.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. How does Vite achieve fast dev?</div>
  <div class="qa-answer">
    <p>Vite serves source files as native ES modules to the browser without bundling. Browser handles import resolution. On change, only the changed file is re-transformed (via esbuild) — startup time stays roughly constant regardless of project size. Pre-bundles CommonJS dependencies once on first run. HMR via WebSocket. Production uses Rollup for optimal output.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Rollup vs Webpack — when to use which?</div>
  <div class="qa-answer">
    <p><strong>Rollup</strong>: libraries. Cleanest ESM/CJS output, best tree shaking, smaller plugin overhead. Used inside Vite for production.</p>
    <p><strong>Webpack</strong>: applications with many features (HMR, code splitting, asset pipeline, dev server). Heavier but more complete.</p>
    <p>For a library, Rollup or tsup. For an app, Vite (which uses Rollup under the hood).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. What's Metro?</div>
  <div class="qa-answer">
    <p>React Native's bundler. JS-based, tailored for RN's needs: outputs RN-evaluable JS, asset pipeline at multiple resolutions, platform-specific files (.ios.tsx vs .android.tsx), inline-requires for startup perf, native HMR. Default since RN's inception; alternative is Re.Pack (Webpack-based) but most teams use Metro.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. esbuild vs swc?</div>
  <div class="qa-answer">
    <p><strong>esbuild</strong> (Go): all-in-one — bundling + transform + minify. Used by Vite for dev + library tools (tsup). Faster bundling, smaller plugin ecosystem.</p>
    <p><strong>swc</strong> (Rust): primarily a Babel replacement (transform only, no bundling). Used by Next.js and as a transformer in Webpack/Rspack/Vite. Plugin system more mature than esbuild.</p>
    <p>They often coexist: swc transforms TS/JSX, esbuild bundles or minifies.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How does code splitting work?</div>
  <div class="qa-answer">
    <p>Two paths:</p>
    <ul>
      <li><strong>Static splitting</strong>: bundler emits separate chunks based on configuration (vendor chunk, runtime chunk).</li>
      <li><strong>Dynamic splitting</strong>: <code>import('./feature')</code> creates a chunk loaded on demand. Common with route-level lazy loading (<code>React.lazy</code> + <code>Suspense</code>).</li>
    </ul>
    <p>Bundler outputs one file per chunk, loaded as needed. Reduces initial bundle size.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. What's Module Federation?</div>
  <div class="qa-answer">
    <p>Webpack 5 feature for runtime module sharing across separately-deployed apps (microfrontends). One app exposes modules; another consumes them at runtime. Enables independent deploys + shared dependencies (e.g., one React copy across apps). Powerful but adds complexity (version coordination, network failure handling). Used by Shopify, ATT, others. Vite-equivalent: <code>vite-plugin-federation</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Why do we still need bundlers if browsers support ESM?</div>
  <div class="qa-answer">
    <p>Native ESM works but browsers fetching thousands of small modules has overhead even with HTTP/2. Bundling enables tree shaking, code splitting at chunk boundaries, polyfills + transforms (TS, JSX), minification, asset handling, content hashing. Vite shows the middle ground: ESM in dev (fast), bundled in prod (optimized).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. What's HMR and how does it work?</div>
  <div class="qa-answer">
    <p>Hot Module Replacement: swap a changed module in a running app without full page reload. Dev server detects file change, re-compiles only that module, sends update to browser via WebSocket. Browser executes the new module; framework adapter (React Fast Refresh, Vue HMR) re-instantiates the component while preserving local state. Enables sub-second iteration.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Walk through Webpack to Vite migration.</div>
  <div class="qa-answer">
    <ol>
      <li>Install Vite + plugin: <code>npm install -D vite @vitejs/plugin-react</code>.</li>
      <li>Move <code>public/index.html</code> to root <code>index.html</code>; add <code>&lt;script type="module" src="/src/index.tsx"&gt;</code>.</li>
      <li>Replace <code>process.env.REACT_APP_*</code> with <code>import.meta.env.VITE_*</code>.</li>
      <li>Update package.json scripts: <code>dev / build / preview</code>.</li>
      <li>Verify: most apps work out of the box. Edge cases: SVG imports (use <code>vite-plugin-svgr</code>), CSS imports.</li>
      <li>Build time often drops from 60s to 5s; dev cold-start from 30s to 1s.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Best bundler for a library?</div>
  <div class="qa-answer">
    <p><strong>tsup</strong> (esbuild wrapper) for most cases — single config, dual ESM/CJS, .d.ts emit, fast. <strong>Rollup</strong> for fine-grained control or complex output formats. Both: declare React, ReactDOM as <code>external</code>; emit ESM + CJS; ship .d.ts for TypeScript users; use <code>"sideEffects": false</code> for tree shaking.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. What's Rspack?</div>
  <div class="qa-answer">
    <p>Rust port of Webpack. Drop-in replacement for most projects: same config shape, most plugin API. ~10× faster on typical projects. Used by ByteDance, Microsoft, others. Migration: rename config file, install Rspack, adjust a few plugin imports. Production-ready for most apps; check plugin compatibility for complex cases.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. What does <code>"external"</code> do in a bundler config?</div>
  <div class="qa-answer">
    <p>Tells the bundler "don't bundle this module — treat it as available at runtime." Used in libraries to avoid bundling React (consumer provides it as a peer dep). Used in Node libraries to externalize node_modules so they're loaded at runtime, not duplicated. The output references the module by name; the runtime resolves it.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. How would you start a new React project today?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Vite + React</strong>: <code>npm create vite@latest my-app -- --template react-ts</code>. Best for SPAs.</li>
      <li><strong>Next.js</strong>: <code>npx create-next-app@latest</code>. Best for SSR, RSC, full-stack.</li>
      <li><strong>Remix</strong>: <code>npx create-remix@latest</code>. Best for nested routing, progressive enhancement.</li>
      <li><strong>Astro + React</strong>: <code>npm create astro@latest</code>. Best for content-heavy sites with islands.</li>
    </ul>
    <p>Avoid: Create React App (deprecated 2023). Avoid: vanilla Webpack setup unless required.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You pick Vite for new SPAs by default.</li>
    <li>You explain Vite's "native ESM in dev, Rollup in prod" model.</li>
    <li>You use tsup or Rollup for libraries.</li>
    <li>You know Rspack as a drop-in faster Webpack.</li>
    <li>You know Metro is RN-specific.</li>
    <li>You configure code splitting and content hashing for caching.</li>
    <li>You separate transform (swc/esbuild) from bundle (Vite/Rollup/Rspack).</li>
    <li>You externalize peer deps in library bundles.</li>
    <li>You use bundle visualizers to find size bloat.</li>
  </ul>
</div>
`}

]
});
