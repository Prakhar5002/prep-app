window.PREP_SITE.registerTopic({
  id: 'perf-bundle-loading',
  module: 'Frontend Performance',
  title: 'Bundle & Loading',
  estimatedReadTime: '32 min',
  tags: ['performance', 'bundle', 'code-splitting', 'tree-shaking', 'webpack', 'vite', 'rollup', 'esbuild', 'cdn', 'http2'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>Bundle and loading optimization is about <strong>shipping less JavaScript and shipping it smarter</strong>. Every kilobyte costs download, parse, compile, and execute time — exponentially worse on mid-range mobile devices.</p>
<ul>
  <li><strong>Measure first</strong> — bundle analyzer (source-map-explorer, webpack-bundle-analyzer, vite-bundle-visualizer) reveals what's actually shipped.</li>
  <li><strong>Code splitting</strong>: route-based (lazy import per route), component-based (lazy modal, lazy chart), vendor splitting.</li>
  <li><strong>Tree shaking</strong>: only ESM imports (named) get dead-code-eliminated; CJS (<code>require</code>) doesn't tree-shake.</li>
  <li><strong>Dynamic <code>import()</code></strong> creates async chunks; bundler outputs separate JS files loaded on demand.</li>
  <li><strong>Modern bundlers</strong>: <strong>Vite</strong> (esbuild + Rollup), <strong>esbuild</strong>, <strong>swc</strong>, <strong>Rspack</strong>, <strong>Turbopack</strong>. Replace Webpack for new projects — order-of-magnitude faster builds.</li>
  <li><strong>Compression</strong>: serve Brotli (better) with gzip fallback. Always.</li>
  <li><strong>Long cache + content hashing</strong>: <code>app.[hash].js</code> with <code>Cache-Control: public, max-age=31536000, immutable</code>.</li>
  <li><strong>HTTP/2 + HTTP/3</strong>: multiplexed streams. Bundling matters less than it did, but a balance still helps (one giant bundle is bad; 1000 tiny chunks is also bad).</li>
  <li><strong>Polyfills only when needed</strong>: <code>module/nomodule</code> pattern serves modern code to modern browsers.</li>
  <li><strong>Third-party scripts</strong> are often the biggest perf killers — analytics, tag managers. Async / defer / Partytown.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Don't ship code your users don't run. Tree-shake; route-split; lazy-load below-the-fold features; compress with Brotli; cache forever with content hashes; defer third-parties. Measure with a bundle analyzer — you'll find a 200KB lib someone forgot.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What "bundle" means</h3>
<p>Modern apps ship many JS modules. The browser can't import a thousand small files efficiently — request overhead per file. Bundlers (Webpack, Vite, esbuild) walk the dependency graph and produce one or a few <code>.js</code> files. Trade-offs:</p>
<ul>
  <li>Too few files: one giant bundle blocks render until fully downloaded.</li>
  <li>Too many: per-request overhead + browser cap on parallel connections.</li>
  <li>Smart split: small critical chunk first; route + feature chunks loaded on demand.</li>
</ul>

<h3>Why bundle size matters disproportionately on mobile</h3>
<p>Network is part of the cost; <strong>CPU is the bigger half</strong>. A 1MB bundle on a fast desktop = 200ms parse + compile. On a mid-range Android phone = 3-5 seconds. Hermes / V8 cache helps repeat visits, but first-load is what users see.</p>

<h3>Why code splitting</h3>
<p>The vast majority of users only use a fraction of an app's features. Why ship the admin panel code to the logged-out marketing visitor? Code splitting carves the bundle into chunks loaded on demand:</p>
<ul>
  <li><strong>Route-level</strong>: each route lazy-imports its component.</li>
  <li><strong>Feature-level</strong>: a heavy chart library loaded only when the dashboard route mounts.</li>
  <li><strong>Vendor</strong>: separate chunk for stable libraries — long-cached, rarely re-downloaded.</li>
</ul>

<h3>Why tree shaking depends on ESM</h3>
<p>Tree shaking is dead-code elimination based on import / export analysis. ESM is statically analyzable: <code>import { foo } from 'lib'</code> tells the bundler exactly what's used, so unused exports can be dropped. CommonJS (<code>require</code>, <code>module.exports</code>) is dynamic — bundlers can't safely shake. Rule: prefer ESM-published libraries; configure <code>"type": "module"</code> in package.json; check <code>"sideEffects": false</code>.</p>

<h3>Why compression beats minification</h3>
<p>Minification (UglifyJS, esbuild, swc) renames identifiers and strips whitespace — saves maybe 50%. Compression (gzip ~70%, Brotli ~80%) on top of minified code saves another 70-80%. Always serve compressed; configure your CDN / server. <strong>Brotli &gt; gzip</strong> for static text-based assets.</p>

<h3>Why content hashing + long cache</h3>
<p>Filename includes hash of contents (<code>app.a1b2c3.js</code>). When code changes, hash changes, URL changes — clients fetch fresh. When code doesn't change, hash matches, browsers serve from local cache for up to a year. Headers:</p>
<pre><code>Cache-Control: public, max-age=31536000, immutable</code></pre>

<h3>Why HTTP/2 and HTTP/3 changed the game</h3>
<p>HTTP/1.1: one request per connection at a time; browsers limit ~6 connections per origin → bundling necessary. HTTP/2: multiplexed streams over one connection — sending many small files cheap; bundling less critical. HTTP/3 over QUIC: better on lossy mobile networks. But: the parse + compile cost still favors smaller bundles.</p>

<h3>Why third-party scripts are the elephant</h3>
<p>Average site loads ~30 third-party scripts (analytics, ads, chat, A/B tests, fingerprinting, social embeds). Often unsized, unbudgeted, on critical render path. They can dominate INP and LCP regressions. Strategies: defer or async; load only on interaction; tag manager governance; Partytown to relocate to Web Worker.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "bundle anatomy" picture</h3>
<div class="diagram">
<pre>
 main.[hash].js              ← critical: app shell, root component
 vendor.[hash].js             ← stable libs (React, lodash) — long cache
 routes/home.[hash].js        ← lazy-loaded per route
 routes/settings.[hash].js
 routes/billing.[hash].js
 components/chart.[hash].js   ← lazy-loaded when chart is used
 polyfills.[hash].js          ← only for old browsers (nomodule)
 runtime.[hash].js            ← bundler's small loader
</pre>
</div>

<h3>The "split layer" picture</h3>
<table>
  <thead><tr><th>Layer</th><th>Examples</th><th>Update frequency</th><th>Cache</th></tr></thead>
  <tbody>
    <tr><td>Vendor</td><td>React, lodash, date-fns</td><td>Rarely</td><td>1 year</td></tr>
    <tr><td>App shell</td><td>Layout, routing, shared utilities</td><td>Per release</td><td>1 year (hashed)</td></tr>
    <tr><td>Routes / features</td><td>Per-page components, modals</td><td>Per release</td><td>1 year (hashed)</td></tr>
    <tr><td>Async tail</td><td>Charts, editors, image cropper</td><td>Per release</td><td>1 year (hashed)</td></tr>
  </tbody>
</table>

<h3>The "loading priority" picture</h3>
<div class="diagram">
<pre>
 HTML download
    │
    ▼
 Critical CSS (inline)        Hero image preload  Fonts preload
    │                            │                    │
    ▼                            ▼                    ▼
 main.js (defer)              ↘
                                 First paint
 vendor.js (defer)
    │
 Below-the-fold images load (lazy)
    │
 Async chunks loaded on user interaction (route nav, modal open)
    │
 Third-party scripts (async, lowest priority)
</pre>
</div>

<h3>The "dynamic import" picture</h3>
<pre><code class="language-js">// Static — included in main bundle
import { Chart } from 'chart-lib';

// Dynamic — bundler emits separate chunk; loaded on demand
const Chart = lazy(() =&gt; import('chart-lib'));
// or:
async function showChart() {
  const { Chart } = await import('chart-lib');
  // ...
}</code></pre>

<h3>The "module / nomodule" pattern</h3>
<div class="diagram">
<pre>
 &lt;script type="module" src="/main.modern.js"&gt;&lt;/script&gt;     ← modern browsers run this
 &lt;script nomodule src="/main.legacy.js"&gt;&lt;/script&gt;          ← old browsers run this

 Modern: ES2020+ syntax, smaller, no polyfills.
 Legacy: transpiled to ES5 + polyfills for IE/old Safari.
 Browsers run exactly one (mutually exclusive).
</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Bigger CDN tier with HTTP/2 means I can stop bundling." Mostly true at the network layer — but parse + compile time still favor smaller bundles, and most asset pipelines benefit from chunking strategy. Don't ship 1000 native ES modules to production.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Bundle analysis tools</h3>
<pre><code># Webpack / CRA
npx webpack-bundle-analyzer ./dist/stats.json

# Vite
npx vite-bundle-visualizer

# Generic source-map → analyzer
npx source-map-explorer 'dist/**/*.js' 'dist/**/*.js.map'

# Next.js
ANALYZE=true next build  # with @next/bundle-analyzer plugin</code></pre>
<p>Output: hierarchical map of bytes per dependency. Common findings: a 200KB date library, an unused-feature SDK, duplicate copies of lodash.</p>

<h3>Route-level code splitting (React)</h3>
<pre><code class="language-jsx">import { lazy, Suspense } from 'react';

const Home = lazy(() =&gt; import('./pages/Home'));
const Settings = lazy(() =&gt; import('./pages/Settings'));
const Billing = lazy(() =&gt; import('./pages/Billing'));

&lt;Routes&gt;
  &lt;Route path="/" element={&lt;Suspense fallback={&lt;Spinner /&gt;}&gt;&lt;Home /&gt;&lt;/Suspense&gt;} /&gt;
  &lt;Route path="/settings" element={&lt;Suspense fallback={&lt;Spinner /&gt;}&gt;&lt;Settings /&gt;&lt;/Suspense&gt;} /&gt;
&lt;/Routes&gt;</code></pre>
<p>Each route is a separate chunk. Bundler emits <code>Home.[hash].js</code>, etc.</p>

<h3>Component-level lazy loading</h3>
<pre><code class="language-jsx">// Heavy editor only when modal opens
const RichEditor = lazy(() =&gt; import('./RichEditor'));
{open &amp;&amp; (
  &lt;Suspense fallback={&lt;EditorSkeleton /&gt;}&gt;
    &lt;RichEditor /&gt;
  &lt;/Suspense&gt;
)}</code></pre>

<h3>Tree shaking essentials</h3>
<pre><code class="language-json">// package.json (your library)
{
  "type": "module",
  "main": "dist/index.cjs",
  "module": "dist/index.mjs",
  "exports": {
    ".": { "import": "./dist/index.mjs", "require": "./dist/index.cjs" }
  },
  "sideEffects": false
}</code></pre>
<p><code>sideEffects: false</code> tells the bundler that importing your package has no side effects — safe to drop unused exports. If you have side effects (e.g., polyfill), list them: <code>"sideEffects": ["./polyfill.js"]</code>.</p>

<h3>Webpack splitChunks</h3>
<pre><code class="language-js">// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\\\/]node_modules[\\\\/]/,
          name: 'vendor',
          priority: 10,
        },
        common: { minChunks: 2, name: 'common', priority: 5 },
      },
    },
    runtimeChunk: 'single',
  },
};</code></pre>

<h3>Vite (Rollup-based)</h3>
<pre><code class="language-js">// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          ui: ['@mui/material', '@emotion/react'],
        },
      },
    },
  },
});</code></pre>
<p>Vite uses esbuild for dev (instant HMR) and Rollup for production (optimal bundling).</p>

<h3>Module / nomodule for browser tiers</h3>
<pre><code class="language-html">&lt;script type="module" src="/main.modern.js"&gt;&lt;/script&gt;
&lt;script nomodule src="/main.legacy.js"&gt;&lt;/script&gt;</code></pre>
<p>Build pipeline produces both. Modern is smaller (no polyfills, ES2020+ syntax). Legacy is for IE11 / old Safari. Most sites can drop legacy entirely now (IE11 dead; Safari 14+ supports modules).</p>

<h3>Dynamic imports with prefetch hints</h3>
<pre><code class="language-jsx">const Settings = lazy(() =&gt; import(/* webpackPrefetch: true */ './Settings'));
// Webpack emits &lt;link rel="prefetch"&gt; — browser fetches when idle.

const Editor = lazy(() =&gt; import(/* webpackPreload: true */ './Editor'));
// Webpack emits &lt;link rel="preload"&gt; — fetched in parallel with parent chunk.</code></pre>

<h3>Server-side compression</h3>
<pre><code># nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript application/wasm;
gzip_min_length 1024;

brotli on;                    # nginx brotli module
brotli_types text/plain text/css application/json application/javascript;
brotli_comp_level 6;
brotli_static on;             # serve pre-compressed .br files</code></pre>
<p>Pre-compress at build (e.g., webpack <code>compression-webpack-plugin</code>) to <code>app.js.br</code> + <code>app.js.gz</code>; serve the right one based on <code>Accept-Encoding</code>.</p>

<h3>Long cache + immutable</h3>
<pre><code class="language-html">&lt;!-- HTML — short cache, must revalidate --&gt;
Cache-Control: no-cache

&lt;!-- JS / CSS / images with content hash — forever --&gt;
app.a1b2c3.js → Cache-Control: public, max-age=31536000, immutable</code></pre>

<h3>Resource hints in HTML</h3>
<pre><code class="language-html">&lt;link rel="preconnect" href="https://api.example.com" crossorigin /&gt;
&lt;link rel="dns-prefetch" href="//cdn.example.com" /&gt;
&lt;link rel="preload" as="script" href="/main.[hash].js" /&gt;
&lt;link rel="modulepreload" href="/main.[hash].js" /&gt;
&lt;link rel="prefetch" href="/settings.[hash].js" /&gt;</code></pre>

<h3>Third-party script management</h3>
<pre><code class="language-html">&lt;!-- Async — non-blocking; runs ASAP after download --&gt;
&lt;script async src="https://www.googletagmanager.com/gtag/js?id=..."&gt;&lt;/script&gt;

&lt;!-- Defer — non-blocking; runs after HTML parse, in order --&gt;
&lt;script defer src="/app.js"&gt;&lt;/script&gt;

&lt;!-- On-interaction load --&gt;
&lt;script&gt;
  ['click', 'scroll', 'keydown'].forEach(e =&gt;
    addEventListener(e, () =&gt; { /* load chat widget */ }, { once: true })
  );
&lt;/script&gt;</code></pre>

<h3>Partytown — third-parties in a worker</h3>
<pre><code class="language-html">&lt;script src="/~partytown/partytown.js"&gt;&lt;/script&gt;
&lt;script type="text/partytown" src="https://www.googletagmanager.com/gtag/js?id=..."&gt;&lt;/script&gt;
&lt;!-- Partytown intercepts and runs the third-party in a Web Worker
     via a synchronous proxy. Main thread stays free. --&gt;</code></pre>

<h3>Detecting unused JavaScript</h3>
<pre><code>// Chrome DevTools → Coverage tab (Ctrl/Cmd+Shift+P → "Show Coverage")
// Reload + interact → see % of bytes actually executed
// Below 50% on critical bundles = signal to split or remove</code></pre>

<h3>Modern bundlers (2024+)</h3>
<table>
  <thead><tr><th>Bundler</th><th>Speed</th><th>Maturity</th><th>When to use</th></tr></thead>
  <tbody>
    <tr><td>Vite (esbuild + Rollup)</td><td>Very fast dev, fast prod</td><td>Mature</td><td>Most new SPAs / SSGs</td></tr>
    <tr><td>esbuild</td><td>Extremely fast</td><td>Mature for libraries</td><td>Library bundling, CI builds</td></tr>
    <tr><td>swc (Speedy Web Compiler)</td><td>Very fast transform</td><td>Mature</td><td>Drop-in Babel replacement</td></tr>
    <tr><td>Rspack (Rust port of Webpack)</td><td>Fast</td><td>Newer</td><td>Migrate from Webpack with minimal config change</td></tr>
    <tr><td>Turbopack</td><td>Fast (incremental)</td><td>Beta</td><td>Next.js 14+ dev mode</td></tr>
    <tr><td>Webpack</td><td>Slower</td><td>Mature, plugin-rich</td><td>Legacy projects; complex custom needs</td></tr>
  </tbody>
</table>

<h3>Bundle budget in CI</h3>
<pre><code class="language-json">// bundlewatch.config.json
{
  "files": [
    { "path": "dist/main.*.js", "maxSize": "200kb" },
    { "path": "dist/vendor.*.js", "maxSize": "150kb" }
  ]
}</code></pre>
<p>CI fails the PR if bundle exceeds the limit. Forces conscious decisions about new dependencies. Tools: bundlewatch, size-limit, lighthouse-ci.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — finding a bloat dependency</h3>
<pre><code># Build with stats
npm run build -- --stats
npx webpack-bundle-analyzer build/stats.json

# Visual map shows: moment.js taking 230KB.
# Replace with date-fns (treeshakable, ~3KB used) or dayjs (~2KB).</code></pre>

<h3>Example 2 — switching moment to dayjs</h3>
<pre><code class="language-ts">// Before:
import moment from 'moment';
moment(date).format('YYYY-MM-DD');   // pulls all of moment

// After:
import dayjs from 'dayjs';
dayjs(date).format('YYYY-MM-DD');    // 2KB</code></pre>

<h3>Example 3 — lodash → lodash-es with named imports</h3>
<pre><code class="language-ts">// Before — pulls all of lodash:
import _ from 'lodash';
_.debounce(fn, 200);

// After — tree-shaken to just debounce:
import { debounce } from 'lodash-es';</code></pre>

<h3>Example 4 — route-level split + prefetch</h3>
<pre><code class="language-jsx">const Settings = lazy(() =&gt;
  import(/* webpackChunkName: "settings", webpackPrefetch: true */ './pages/Settings')
);
// User more likely to visit Settings → prefetch idle. Loaded by the time they navigate.</code></pre>

<h3>Example 5 — lazy heavy component</h3>
<pre><code class="language-jsx">const RichTextEditor = lazy(() =&gt; import('./RichTextEditor'));

function Compose() {
  const [open, setOpen] = useState(false);
  return (
    &lt;&gt;
      &lt;button onClick={() =&gt; setOpen(true)}&gt;Compose&lt;/button&gt;
      {open &amp;&amp; (
        &lt;Suspense fallback={&lt;EditorSkeleton /&gt;}&gt;
          &lt;RichTextEditor /&gt;
        &lt;/Suspense&gt;
      )}
    &lt;/&gt;
  );
}
// 500KB editor only ships if user clicks "Compose."</code></pre>

<h3>Example 6 — manual vendor split (Vite)</h3>
<pre><code class="language-js">// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) =&gt; {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'react';
            if (id.includes('@mui')) return 'mui';
            return 'vendor';
          }
        },
      },
    },
  },
});</code></pre>

<h3>Example 7 — module / nomodule with Babel</h3>
<pre><code class="language-js">// babel.config.js — modern target
module.exports = (api) =&gt; ({
  presets: [['@babel/preset-env', { targets: { esmodules: true } }]],
});

// Build twice — once with esmodules target (modern), once with es5 (legacy).
// Output: main.modern.js (smaller) + main.legacy.js (with polyfills)</code></pre>
<pre><code class="language-html">&lt;script type="module" src="/main.modern.js"&gt;&lt;/script&gt;
&lt;script nomodule src="/main.legacy.js"&gt;&lt;/script&gt;</code></pre>

<h3>Example 8 — bundle budget in CI</h3>
<pre><code class="language-yaml"># .github/workflows/ci.yml
- run: npm run build
- run: npx bundlewatch
# Fails if any file exceeds its declared maxSize.</code></pre>

<h3>Example 9 — defer third-party until interaction</h3>
<pre><code class="language-html">&lt;script&gt;
function loadChat() {
  if (window.__chatLoaded) return;
  window.__chatLoaded = true;
  const s = document.createElement('script');
  s.src = 'https://chat.example.com/widget.js';
  s.async = true;
  document.head.appendChild(s);
}
['click','scroll','keydown','touchstart'].forEach(e =&gt;
  addEventListener(e, loadChat, { once: true, passive: true })
);
setTimeout(loadChat, 5000);  // fallback: load after 5s if no interaction
&lt;/script&gt;</code></pre>

<h3>Example 10 — Partytown integration</h3>
<pre><code class="language-html">&lt;script src="/~partytown/partytown.js"&gt;&lt;/script&gt;
&lt;script&gt;
  partytown = { forward: ['gtag', 'dataLayer.push'] };
&lt;/script&gt;
&lt;script type="text/partytown" src="https://www.googletagmanager.com/gtag/js?id=GA_ID"&gt;&lt;/script&gt;
&lt;!-- All gtag calls and the GA script run in a Web Worker. Main thread free. --&gt;</code></pre>

<h3>Example 11 — Coverage analysis</h3>
<pre><code>1. Chrome DevTools → Cmd+Shift+P → "Show Coverage"
2. Click record + reload page
3. Interact normally
4. Stop record
5. See: main.js — 45% used (55% wasted bytes)
6. Identify large unused chunks → split or remove</code></pre>

<h3>Example 12 — preconnect + preload combination</h3>
<pre><code class="language-html">&lt;link rel="preconnect" href="https://api.example.com" crossorigin /&gt;
&lt;link rel="preconnect" href="https://images.cdn.example.com" /&gt;
&lt;link rel="preload" as="script" href="/main.[hash].js" /&gt;
&lt;link rel="modulepreload" href="/main.[hash].js" /&gt;
&lt;link rel="preload" as="font" href="/fonts/inter.woff2" crossorigin /&gt;
&lt;link rel="preload" as="image" href="/hero.webp" fetchpriority="high" /&gt;</code></pre>

<h3>Example 13 — sideEffects: false in monorepo</h3>
<pre><code class="language-json">// packages/utils/package.json
{
  "name": "@myorg/utils",
  "main": "dist/index.cjs.js",
  "module": "dist/index.esm.js",
  "sideEffects": false
}
// Bundlers will tree-shake unused functions across the workspace.</code></pre>

<h3>Example 14 — Webpack runtime chunk for caching</h3>
<pre><code class="language-js">module.exports = {
  optimization: {
    runtimeChunk: 'single',  // emit runtime.js — small, changes often
    splitChunks: {
      cacheGroups: {
        vendor: { test: /node_modules/, name: 'vendor', chunks: 'all' },
      },
    },
  },
};
// Now: vendor.[hash].js cached forever; only runtime.js + entry change between deploys.</code></pre>

<h3>Example 15 — measuring with Lighthouse CI</h3>
<pre><code class="language-yaml">- name: Lighthouse CI
  uses: treosh/lighthouse-ci-action@v10
  with:
    urls: |
      https://preview.example.com/
      https://preview.example.com/billing
    budgetPath: lighthousebudget.json</code></pre>
<pre><code class="language-json">// lighthousebudget.json
[
  {
    "path": "/*",
    "resourceSizes": [
      { "resourceType": "script", "budget": 200 },
      { "resourceType": "stylesheet", "budget": 50 },
      { "resourceType": "total", "budget": 500 }
    ]
  }
]</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Tree shaking blocked by side effects</h3>
<p>If a library imports another module for its side effects (polyfill registration, CSS injection), tree shaking can't drop it. <code>sideEffects: false</code> in package.json signals safety. Missing → bundler keeps everything.</p>

<h3>2. CommonJS in a tree-shaken context</h3>
<p>A library shipped as CJS only is opaque to bundlers — full file included even if you only import one function. Workaround: prefer ESM-published libs; for CJS-only libs, see if there's an "es" variant.</p>

<h3>3. Dynamic import path must be statically analyzable</h3>
<pre><code class="language-js">// BAD — bundler can't determine the chunk
const mod = await import(\`./locales/\${locale}.js\`);
// Webpack handles patterns like this with "magic comments" and emits multiple chunks,
// but only when the pattern is decipherable.

// Explicit:
const mod = await import(/* webpackChunkName: "locale-[request]" */ \`./locales/\${locale}.js\`);</code></pre>

<h3>4. Top-level await delays whole module</h3>
<pre><code class="language-js">// At top of module:
const data = await fetch(...).then(r =&gt; r.json());
// Module evaluation pauses until fetch settles → blocks dependents.
// Use within functions instead.</code></pre>

<h3>5. duplicate package versions</h3>
<p>Lockfile drift: <code>react</code> at 18.2 and 18.3 both bundled because two libs depend on different majors. Fix: <code>npm dedupe</code> / <code>yarn dedupe</code>; use peerDependencies correctly.</p>

<h3>6. Vendor chunk too large</h3>
<p>One single vendor chunk including everything from node_modules → first cold-start downloads it all. Split by group (UI lib, framework, utils).</p>

<h3>7. Source maps in production</h3>
<p>Don't expose source maps publicly (reveals source). Upload to Sentry / similar; serve only minified to users. Configure header <code>SourceMap: ...</code> only on protected paths.</p>

<h3>8. CSS-in-JS adds runtime cost</h3>
<p>Libraries like styled-components / emotion ship a runtime that processes styles in the browser. Modern alternatives (vanilla-extract, Panda, CSS Modules) are zero-runtime.</p>

<h3>9. Tree shaking import * as ns</h3>
<pre><code class="language-js">import * as utils from 'big-lib';
utils.foo();
// Bundler sees full namespace import; harder to shake.
// Prefer named: import { foo } from 'big-lib';</code></pre>

<h3>10. Missing "exports" field in package.json</h3>
<p>Newer Node ESM resolution requires <code>exports</code> field. Library without it works in Webpack but may fail in Vite/esbuild ESM resolution. Add <code>exports</code> when authoring libraries.</p>

<h3>11. Polyfills shipped to modern browsers</h3>
<p>If your build pipeline targets ES5 globally, you ship polyfills nobody needs. Use <code>browserslist</code>:</p>
<pre><code class="language-json">"browserslist": ["&gt;0.5%", "not ie 11", "last 2 versions"]</code></pre>

<h3>12. Brotli not negotiated</h3>
<p>Server only sends gzip even if Accept-Encoding includes br. Often nginx config issue. Confirm with <code>curl -I -H "Accept-Encoding: br" https://yoursite/main.js</code>.</p>

<h3>13. Cache-Control: no-cache vs no-store</h3>
<p>Both differ:</p>
<ul>
  <li><code>no-cache</code> = revalidate before using cached copy.</li>
  <li><code>no-store</code> = don't cache at all.</li>
</ul>
<p>For HTML you usually want <code>no-cache</code>; for hashed assets, <code>max-age=31536000, immutable</code>.</p>

<h3>14. Service Worker stale-while-revalidate</h3>
<p>SW serves cached bundles instantly; revalidates in background. Mismatched cached HTML + new JS can break — use SW cache versioning.</p>

<h3>15. Webpack Module Federation</h3>
<p>Microfrontends share runtime modules across separately-deployed apps. Powerful but adds load-time overhead + version compatibility complexity. Not free.</p>

<h3>16. Magic comments don't survive minification edge cases</h3>
<p>Webpack magic comments (<code>/* webpackChunkName */</code>) must be in specific positions; check final bundle.</p>

<h3>17. import.meta.url and bundling</h3>
<p>Some libraries use <code>import.meta.url</code> for asset paths. Bundlers handle differently. Test loading after build.</p>

<h3>18. Large data files in JS</h3>
<p>Importing a 500KB JSON via <code>import data from './x.json'</code> embeds it in the bundle. For static data, fetch as a separate file from CDN.</p>

<h3>19. CDN cache pollution</h3>
<p>If a CDN caches a request with old code (no content hash) under a stable URL, users see stale content. Always use content-hashed filenames; CDN purge before deploy if not.</p>

<h3>20. Pre-compression with mismatched encodings</h3>
<p>Server sends Brotli to client that requested gzip → broken. Configure properly. Tools to verify: <code>curl -H "Accept-Encoding: gzip"</code> vs <code>br</code>.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — single giant bundle</h3>
<p>1MB main.js for a 100-byte landing page. Cold start blocks render. Split.</p>

<h3>Anti-pattern 2 — moment.js for date formatting</h3>
<p>~230KB. Replace with dayjs (~2KB) or date-fns (treeshakable, ~3KB used).</p>

<h3>Anti-pattern 3 — full lodash via default import</h3>
<p><code>import _ from 'lodash'</code> bundles all of lodash. Use <code>lodash-es</code> with named imports.</p>

<h3>Anti-pattern 4 — no bundle analyzer in CI</h3>
<p>App bloats over months; nobody notices. Run analyzer per release; fail PR if size grows beyond budget.</p>

<h3>Anti-pattern 5 — synchronous third-party scripts in head</h3>
<p>Analytics, tag managers blocking render. Always async or defer; ideally Partytown.</p>

<h3>Anti-pattern 6 — no compression</h3>
<p>Serving uncompressed JS. Each request is 4-5× the bytes it needs to be. Enable Brotli + gzip.</p>

<h3>Anti-pattern 7 — short cache headers on hashed assets</h3>
<p>Filename has hash → contents stable for that URL. <code>Cache-Control: max-age=31536000, immutable</code> or browsers re-fetch unnecessarily.</p>

<h3>Anti-pattern 8 — shipping legacy code to modern browsers</h3>
<p>ES5 + polyfills for users with Chrome 120. Use module/nomodule or modern-only browserslist.</p>

<h3>Anti-pattern 9 — eager loading every modal</h3>
<p>The "settings" modal nobody opens contributes 50KB to main bundle. Lazy-load.</p>

<h3>Anti-pattern 10 — ignoring third-party impact</h3>
<p>"Just one tiny widget." Adds 200KB + DNS + TLS + JS execution. Audit and budget third-parties.</p>

<h3>Anti-pattern 11 — CSS-in-JS for the design system</h3>
<p>Runtime style insertion in hot paths costs INP. Switch to zero-runtime CSS-in-JS (vanilla-extract) or CSS modules.</p>

<h3>Anti-pattern 12 — duplicate React versions</h3>
<p>Pinning libs to specific React versions ends with two Reacts in your bundle. Use peerDeps; align versions.</p>

<h3>Anti-pattern 13 — pre-rendering HTML with the full bundle inline</h3>
<p>Some SSR setups inline the JS bundle in the HTML. Defeats caching. Reference external <code>.js</code> files with content hashes.</p>

<h3>Anti-pattern 14 — no route prefetch</h3>
<p>User navigates to /settings; chunk only starts downloading then. Add <code>webpackPrefetch</code> hint or framework's prefetch (Next Link).</p>

<h3>Anti-pattern 15 — stale CDN cache after deploy</h3>
<p>Forgetting to purge CDN, or using stable URLs without content hash. Old code persists. Use hashed filenames; CDN serves immutable.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. How do you reduce bundle size?</div>
  <div class="qa-answer">
    <ol>
      <li>Run a bundle analyzer; identify the biggest contributors.</li>
      <li>Replace heavy libraries (moment → dayjs, full lodash → lodash-es with named imports).</li>
      <li>Enable tree shaking — ESM imports, <code>sideEffects: false</code>.</li>
      <li>Code-split by route and by feature (lazy + Suspense).</li>
      <li>Drop polyfills for browsers you don't support (modern target only).</li>
      <li>Use module/nomodule pattern.</li>
      <li>Compress with Brotli + gzip.</li>
      <li>Set bundle budgets in CI; fail PRs that bloat.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Tree shaking — explain.</div>
  <div class="qa-answer">
    <p>Dead-code elimination based on static import / export analysis. ESM is required because <code>import { foo } from 'lib'</code> tells the bundler exactly what's used, so unused exports are dropped. CommonJS (<code>require</code>) is dynamic — bundlers can't safely shake. <code>"sideEffects": false</code> in package.json is also required to assert that imports have no side effects (so the bundler can drop them entirely if unused).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Static vs dynamic import — when to use which?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Static</strong>: critical code that runs immediately (app shell, framework, current route).</li>
      <li><strong>Dynamic <code>import()</code></strong>: features that aren't always needed (admin panel, settings, heavy editor, modal). Bundler emits a separate chunk; loaded on demand. Cuts initial bundle.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. How does code splitting work in React?</div>
  <div class="qa-answer">
<pre><code class="language-jsx">const Settings = lazy(() =&gt; import('./Settings'));
&lt;Suspense fallback={&lt;Spinner /&gt;}&gt;
  &lt;Settings /&gt;
&lt;/Suspense&gt;</code></pre>
    <p><code>lazy</code> wraps the dynamic import; the bundler emits a separate chunk (<code>Settings.[hash].js</code>). When React tries to render <code>&lt;Settings/&gt;</code>, it suspends until the chunk arrives; <code>Suspense</code> shows the fallback. Once loaded, real component renders.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Webpack vs Vite — key differences?</div>
  <div class="qa-answer">
    <p><strong>Webpack</strong>: mature, plugin ecosystem, slower (especially dev), config-heavy.</p>
    <p><strong>Vite</strong>: native ESM in dev (no bundling = instant HMR), Rollup in prod, simpler config, much faster builds.</p>
    <p>For new projects, Vite (or Next.js with Turbopack). For complex legacy setups with custom plugins, Webpack still works.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. What's <code>module/nomodule</code>?</div>
  <div class="qa-answer">
    <p>Two script tags — one with <code>type="module"</code> (modern browsers), one with <code>nomodule</code> (legacy browsers). Each browser executes exactly one. Modern bundle is smaller (no polyfills, native ES2020+). Legacy is transpiled with polyfills. Old browsers don't understand <code>type="module"</code> so they skip; modern browsers ignore <code>nomodule</code>. Net: pay legacy cost only where needed.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How do you handle third-party scripts?</div>
  <div class="qa-answer">
    <ul>
      <li>Always <code>async</code> or <code>defer</code> them.</li>
      <li>Audit: do we need this? Each adds ~100-300ms.</li>
      <li>Load on first interaction (click, scroll) for non-critical scripts.</li>
      <li>Move to a worker via <strong>Partytown</strong>.</li>
      <li>Use a tag manager with strict approval governance.</li>
      <li>Track via RUM — third-party impact on INP / LCP.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Cache-Control headers — what do you set?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>HTML</strong>: <code>Cache-Control: no-cache</code> (revalidate every request).</li>
      <li><strong>Hashed assets (.js, .css, images with content hash)</strong>: <code>Cache-Control: public, max-age=31536000, immutable</code> (cache forever; never revalidate).</li>
      <li><strong>Unhashed assets</strong>: short cache + revalidation, e.g., <code>max-age=600, must-revalidate</code>.</li>
      <li><strong>API responses</strong>: depends — static reference data can cache; user data shouldn't.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Walk me through diagnosing a 5MB initial bundle.</div>
  <div class="qa-answer">
    <ol>
      <li>Run bundle analyzer.</li>
      <li>Identify top contributors (often: a date library, a chart library, full SDK, polyfills).</li>
      <li>For each: is it actually needed at startup? If no → lazy load.</li>
      <li>Check tree shaking — ESM imports, <code>sideEffects: false</code>.</li>
      <li>Replace heavy libs with smaller alternatives where possible.</li>
      <li>Drop legacy polyfills if browser support allows.</li>
      <li>Vendor split for caching.</li>
      <li>Re-measure; aim for &lt;200KB main + chunks loaded on demand.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. What's preload vs prefetch vs preconnect?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>preconnect</strong>: open TCP+TLS to a domain now — cheap setup for upcoming requests.</li>
      <li><strong>preload</strong>: actually fetch a resource at high priority — for what the current page WILL use (hero image, hero font, critical script).</li>
      <li><strong>prefetch</strong>: low-priority idle fetch — for what the NEXT page might use (likely route).</li>
      <li><strong>modulepreload</strong>: like preload but for ES modules; also fetches dependencies.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. How do you keep bundle size from regressing?</div>
  <div class="qa-answer">
    <p>Bundle budget in CI:</p>
    <ul>
      <li>bundlewatch / size-limit / Lighthouse CI declare per-file maxSize.</li>
      <li>Each PR runs the build + checks sizes.</li>
      <li>Exceeded budget → PR fails until justified or reduced.</li>
      <li>Force conscious decisions: "we're adding 80KB chart lib for X feature; here's why."</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Why is HTTP/2 important for bundling?</div>
  <div class="qa-answer">
    <p>HTTP/1.1 had a connection limit per origin (~6) → bundling everything was necessary to avoid head-of-line blocking. HTTP/2 multiplexes streams over one connection — many small files become cheap. Bundling matters less for the network; you can split more aggressively. But CPU parse / compile still favor smaller bundles, so a balance: ~5-15 well-sized chunks per page is the sweet spot.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Explain modulepreload.</div>
  <div class="qa-answer">
    <p>Like <code>preload</code> but for ES modules. The browser fetches the module AND its dependency graph (other modules it imports). This warms up the entire module tree before execution. Without it, browsers discover module dependencies during parse — sequential round-trips.</p>
<pre><code class="language-html">&lt;link rel="modulepreload" href="/main.js" /&gt;
&lt;script type="module" src="/main.js"&gt;&lt;/script&gt;</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. What's Partytown?</div>
  <div class="qa-answer">
    <p>A library that runs third-party scripts in a Web Worker, freeing the main thread. Uses a synchronous proxy via <code>Atomics</code> + service worker fetch interception so third-parties can't tell they're not on the main thread. Result: GA, GTM, ad scripts, chat widgets all run in a worker; main thread INP improves dramatically. Caveats: not all third-parties work cleanly; some need DOM access that Partytown can't fully proxy.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Walk through a deploy with safe caching.</div>
  <div class="qa-answer">
    <ol>
      <li>Build emits <code>main.[hash].js</code>, <code>vendor.[hash].js</code>, etc.</li>
      <li>Deploy to CDN: hashed files immutable, long cache.</li>
      <li>HTML references new hashed filenames.</li>
      <li>HTML has <code>Cache-Control: no-cache</code> — revalidates every request.</li>
      <li>Old users with cached HTML revalidate; get new HTML referencing new JS hashes.</li>
      <li>Old hashed JS files remain in CDN for in-flight users; new hashed files cached forever.</li>
      <li>Optional: clean up old hashes after 30 days.</li>
    </ol>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You measure with a bundle analyzer before optimizing.</li>
    <li>You set bundle budgets in CI.</li>
    <li>You route-split + feature-split with lazy / Suspense.</li>
    <li>You use ESM + <code>sideEffects: false</code> for tree shaking.</li>
    <li>You configure <code>module/nomodule</code> or modern-only target.</li>
    <li>You use Brotli + gzip + content-hashed long cache.</li>
    <li>You audit and defer third-party scripts; consider Partytown.</li>
    <li>You use preconnect / preload / modulepreload appropriately.</li>
    <li>You replace heavy libs (moment, full lodash) with lighter alternatives.</li>
    <li>You're on Vite / esbuild / swc rather than vanilla Webpack for new projects.</li>
  </ul>
</div>
`}

]
});
