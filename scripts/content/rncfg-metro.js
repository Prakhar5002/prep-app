window.PREP_SITE.registerTopic({
  id: 'rncfg-metro',
  module: 'RN Project & Config (Deep)',
  title: 'Metro Bundler',
  estimatedReadTime: '24 min',
  tags: ['metro', 'bundler', 'metro-config', 'resolver', 'transformer', 'serializer', 'sourceexts', 'assetexts', 'hermes', 'monorepo', 'cache', 'watchman', 'inline-requires', 'fast-refresh', 'jsbundle', 'expo', 'react-native', 'port-8081', 'babel', 'source-maps', 'autolinking'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>Metro is React Native's default JavaScript bundler. It takes your hundreds of <code>.js</code>/<code>.ts</code>/<code>.tsx</code> files plus assets and produces <strong>one</strong> JavaScript bundle the JS engine (Hermes or JSC) can run, along with a source map. It was built specifically for RN: fast <strong>incremental</strong> rebuilds, sub-second Fast Refresh, and a dev server that streams your app to the device.</p>
<p>In development Metro runs as an HTTP server on <strong>port 8081</strong>. The app fetches <code>http://localhost:8081/index.bundle?platform=ios&amp;dev=true</code>, gets the bundle, and Metro keeps the socket open to push Fast Refresh / Hot Module Replacement (HMR) updates when you save.</p>
<p>Every bundle passes through <strong>three stages</strong>: <strong>Resolution</strong> (build the module dependency graph), <strong>Transformation</strong> (Babel-transform each file, one worker per CPU), and <strong>Serialization</strong> (concatenate into a single bundle + source map). You steer all three from <code>metro.config.js</code> via the <code>resolver</code>, <code>transformer</code>, and <code>serializer</code> keys.</p>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Metro is RN's purpose-built bundler that turns your module graph into one bundle through Resolution → Transformation → Serialization, serving it over HTTP on port 8081 in dev with Fast Refresh — and when a bundle looks stale or "ghosts," the answer is almost always <code>--reset-cache</code>.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What Metro is</h3>
<p>Metro is a JavaScript bundler — the tool that reads your entry file (<code>index.js</code>), follows every <code>import</code>/<code>require</code>, transforms each file down to a form the engine understands, and stitches them into a single output. For web you would use Webpack, Vite, esbuild, or Rollup; for React Native you use Metro. It ships with React Native (and with Expo, via <code>@expo/metro-config</code>). The project lives under <code>metro</code>, <code>metro-config</code>, <code>metro-resolver</code>, <code>metro-transform-worker</code>, and friends in your <code>node_modules</code>.</p>

<h3>Why RN has its own bundler (not Webpack/Vite)</h3>
<ul>
  <li><strong>No HTML/DOM, no chunks.</strong> A web app lazy-loads many chunks over the network. A mobile app ships ONE bundle inside the binary; there is no <code>&lt;script&gt;</code> tag and no code-splitting-by-route in the Webpack sense. Metro is designed to emit a single self-contained bundle.</li>
  <li><strong>Platform-aware resolution.</strong> Metro natively understands <code>Foo.ios.js</code> vs <code>Foo.android.js</code> and the <code>react-native</code> package field. The <code>platform</code> query parameter drives which files win.</li>
  <li><strong>Speed on huge graphs.</strong> RN apps pull in thousands of modules. Metro keeps a persistent transform cache and rebuilds only what changed (incremental), so Fast Refresh feels instant even in a large app.</li>
  <li><strong>Integrated dev server.</strong> Metro is both the bundler and the dev server that pushes HMR — it is not a separate concern.</li>
</ul>

<h3>Metro vs Webpack/Vite — the mental contrast</h3>
<table>
  <thead><tr><th></th><th>Webpack / Vite (web)</th><th>Metro (React Native)</th></tr></thead>
  <tbody>
    <tr><td>Output</td><td>Many chunks + HTML</td><td>One bundle (no HTML)</td></tr>
    <tr><td>Platform files</td><td>Not built-in</td><td><code>.ios/.android/.native</code> first-class</td></tr>
    <tr><td>Dev serving</td><td>Dev server + HMR</td><td>Dev server + Fast Refresh, port 8081</td></tr>
    <tr><td>Config surface</td><td>Loaders, plugins, huge</td><td>resolver / transformer / serializer</td></tr>
    <tr><td>Transform</td><td>Babel/SWC/esbuild loaders</td><td>Babel via metro-transform-worker</td></tr>
    <tr><td>Native ESM</td><td>First-class (Vite)</td><td>CommonJS-style, ESM via package exports (opt-in)</td></tr>
  </tbody>
</table>

<h3>The dev server and the bundle URL</h3>
<p>When you run <code>npx react-native start</code> (or <code>expo start</code>), Metro binds to <strong>0.0.0.0:8081</strong>. The native app requests the bundle by URL. Anatomy of that URL:</p>
<pre><code class="language-text">http://localhost:8081/index.bundle?platform=ios&amp;dev=true&amp;minify=false&amp;modulesOnly=false</code></pre>
<ul>
  <li><code>index.bundle</code> — the entry file, <code>.bundle</code> asks Metro to serialize.</li>
  <li><code>platform=ios|android</code> — selects platform-specific files and the <code>react-native</code> field.</li>
  <li><code>dev=true</code> — keeps <code>__DEV__</code> on, enables dev warnings and Fast Refresh; <code>dev=false</code> for release.</li>
  <li><code>minify</code> — run the minifier or not.</li>
</ul>
<p>Sibling endpoints: <code>/index.map</code> (source map), <code>/status</code> (is Metro alive), <code>/reload</code>, and the WebSocket endpoints for HMR and the debugger.</p>

<h3>Fast Refresh / HMR</h3>
<p>Fast Refresh is RN's hot-reloading. On save, Metro re-transforms only the changed module, sends the delta over a WebSocket, and the RN runtime swaps that module and re-renders — preserving component state where it safely can (React function components with Hooks). It replaces the old "Live Reload" (full reload) and "Hot Reloading" toggles. If a module has side effects at import time or exports non-components, Fast Refresh falls back to a full reload of that module tree.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The three stages of every bundle</h3>
<div class="diagram">
<pre>
  index.js (entry)
        │
        ▼
 ┌───────────────────────────────────────────────────────────┐
 │ 1. RESOLUTION  (metro-resolver)                            │
 │    Follow every import/require from the entry.            │
 │    Apply sourceExts, platform (.ios/.android), package    │
 │    "react-native"/"browser"/"main" fields, node_modules,  │
 │    extraNodeModules, blockList. Build the MODULE GRAPH.    │
 └───────────────────────────────────────────────────────────┘
        │  (a graph of file paths)
        ▼
 ┌───────────────────────────────────────────────────────────┐
 │ 2. TRANSFORMATION  (metro-transform-worker + Babel)       │
 │    For EACH file, in a worker pool (maxWorkers):          │
 │      JSX/TS -> JS, class fields, inlineRequires, minify.  │
 │    Results cached on disk (transform cache).              │
 └───────────────────────────────────────────────────────────┘
        │  (transformed module + per-module deps)
        ▼
 ┌───────────────────────────────────────────────────────────┐
 │ 3. SERIALIZATION  (metro-serializer)                      │
 │    Assign numeric module ids, wrap each in __d(...),      │
 │    order them, prepend polyfills + require(entry),        │
 │    emit ONE bundle string + a source map.                 │
 └───────────────────────────────────────────────────────────┘
        │
        ▼
   index.bundle  (+ index.map)  ->  Hermes/JSC runs it
</pre>
</div>

<h3>Where each config key plugs in</h3>
<div class="diagram">
<pre>
  metro.config.js
  ├── resolver     -> controls STAGE 1 (what file wins)
  │     sourceExts, assetExts, extraNodeModules,
  │     nodeModulesPaths, resolverMainFields,
  │     blockList, disableHierarchicalLookup
  ├── transformer  -> controls STAGE 2 (how each file is transformed)
  │     babelTransformerPath, getTransformOptions,
  │     minifierPath, assetPlugins
  ├── serializer   -> controls STAGE 3 (how the bundle is assembled)
  │     getModulesRunBeforeMainModule,
  │     createModuleIdFactory, customSerializer
  ├── watchFolders -> extra dirs Metro watches (MONOREPO)
  └── maxWorkers / resetCache / cacheStores
</pre>
</div>

<h3>Dev vs release, in one picture</h3>
<div class="diagram">
<pre>
  DEV:      device --HTTP--> Metro@8081 --Fast Refresh (WebSocket)--> device
            (bundle lives on your laptop, streamed each launch)

  RELEASE:  npx react-native bundle  (or the Xcode/Gradle build phase)
            -> main.jsbundle (iOS) / index.android.bundle (Android)
            -> baked INTO the .ipa/.apk, no Metro at runtime
            -> often compiled further to Hermes bytecode (.hbc)
</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Metro runs on the phone." No. In development the bundle is built on your machine by the Metro server and streamed to the device; in release there is no Metro at all — a pre-built bundle (usually Hermes bytecode) is shipped inside the binary. That is why a release build works with your laptop off, and why a dev build shows the red "Could not connect to development server" screen when Metro isn't running.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>metro.config.js anatomy (bare React Native)</h3>
<p>A fresh RN app ships this file. <code>getDefaultConfig</code> gives you RN's sensible defaults; <code>mergeConfig</code> deep-merges your overrides on top (never spread by hand — arrays like <code>sourceExts</code> need proper merge semantics).</p>
<pre><code class="language-js">// metro.config.js  (bare RN)
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    // add/remove extensions, set extra module roots, etc.
  },
  transformer: {
    getTransformOptions: async () =&gt; ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,   // big startup win, on by default in newer RN
      },
    }),
  },
};

module.exports = mergeConfig(defaultConfig, config);</code></pre>

<h3>metro.config.js anatomy (Expo)</h3>
<p>Expo projects use <code>expo/metro-config</code> instead, which layers Expo's asset registry, CSS support, and expo-router resolution on top of RN's defaults. Generate the file with <code>npx expo customize metro.config.js</code> only when you actually need to change something.</p>
<pre><code class="language-js">// metro.config.js  (Expo)
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// example: enable react-native-svg-transformer
config.resolver.assetExts = config.resolver.assetExts.filter((e) =&gt; e !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');

module.exports = config;</code></pre>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — same config, EAS uses it too</div>
  <p>Under Expo you must start from <code>expo/metro-config</code>'s <code>getDefaultConfig</code>, not <code>@react-native/metro-config</code> — otherwise you lose Expo's asset registry, <code>isCSSEnabled</code>, and expo-router resolution. The <strong>same</strong> <code>metro.config.js</code> is used both by <code>expo start</code> locally and by <code>eas build</code> in the cloud, so a resolver tweak you add for local dev also affects your production bundle. Regenerate the file only via <code>npx expo customize metro.config.js</code> so it stays on the Expo base.</p>
</div>

<h3>resolver — Stage 1 controls</h3>
<ul>
  <li><strong><code>sourceExts</code></strong> — the extensions Metro treats as source, in priority order. Default is roughly <code>['js','jsx','ts','tsx','json']</code> (Metro also tries <code>.native.*</code> and the platform variants ahead of these). Add <code>'cjs'</code>, <code>'mjs'</code>, or <code>'svg'</code> here when a library needs it.</li>
  <li><strong><code>assetExts</code></strong> — extensions treated as static assets (copied + registered, not parsed as code): <code>png</code>, <code>jpg</code>, <code>gif</code>, <code>ttf</code>, <code>mp4</code>, etc. To make <code>react-native-svg-transformer</code> parse SVGs as React components, you REMOVE <code>'svg'</code> from <code>assetExts</code> and ADD it to <code>sourceExts</code> — the classic two-line swap.</li>
  <li><strong><code>resolverMainFields</code></strong> — which <code>package.json</code> fields to try, in order. RN default is <code>['react-native', 'browser', 'main']</code> so a lib's <code>react-native</code> entry wins over its web <code>main</code>.</li>
  <li><strong><code>extraNodeModules</code></strong> — a map that force-resolves a module name to a specific path. Used for aliases (<code>'@app' -&gt; src</code>) and to point hoisted monorepo deps at the right copy.</li>
  <li><strong><code>nodeModulesPaths</code></strong> — extra <code>node_modules</code> roots to search (monorepo: the workspace root's <code>node_modules</code>).</li>
  <li><strong><code>blockList</code></strong> (was <code>blacklistRE</code>) — a RegExp of paths Metro must ignore. Classic use: exclude a second copy of <code>react-native</code> in a nested folder, or a build output dir, to kill "duplicate module" errors.</li>
  <li><strong><code>disableHierarchicalLookup</code></strong> — turn OFF Metro's walk-up-the-tree <code>node_modules</code> search and rely only on <code>nodeModulesPaths</code>. The canonical monorepo switch to stop Metro from grabbing the wrong hoisted copy.</li>
  <li><strong><code>unstable_enablePackageExports</code></strong> — honor the <code>"exports"</code> field in <code>package.json</code> (subpath exports / conditional exports). Increasingly needed for modern ESM-first libraries; still guarded because it changes resolution.</li>
  <li><strong>Symlinks</strong> — newer Metro follows symlinks (important for <code>pnpm</code> and workspace links); older Metro did not, which is why some monorepos needed <code>extraNodeModules</code> workarounds.</li>
</ul>
<pre><code class="language-js">config.resolver = {
  sourceExts: [...config.resolver.sourceExts, 'cjs'],
  extraNodeModules: {
    '@app': require('path').resolve(__dirname, 'src'),
  },
  blockList: exclusionList([/nested\/.*\/react-native\/.*/]),
  resolverMainFields: ['react-native', 'browser', 'main'],
  unstable_enablePackageExports: true,
};</code></pre>

<h3>transformer — Stage 2 controls</h3>
<ul>
  <li><strong><code>babelTransformerPath</code></strong> — swap the per-file transformer. Default is <code>metro-react-native-babel-transformer</code> (which reads your <code>babel.config.js</code>). Point it at <code>react-native-svg-transformer</code> to compile SVGs.</li>
  <li><strong><code>getTransformOptions</code></strong> — returns transform flags; the important one is <strong><code>inlineRequires</code></strong>. With inline requires ON, a module's <code>require()</code> calls are moved to the point of first use instead of the top of the file, so modules initialize lazily — a large real-world <strong>startup</strong> and time-to-interactive win. On by default in recent RN/Expo.</li>
  <li><strong><code>minifierPath</code></strong> / <code>minifierConfig</code> — the minifier (default <code>metro-minify-terser</code>; some setups use <code>metro-minify-esbuild</code> for speed). Only runs when <code>minify=true</code> (release).</li>
  <li><strong><code>assetPlugins</code></strong> — hooks that run over assets (e.g. hashing, generating <code>@2x/@3x</code> variants metadata).</li>
</ul>
<pre><code class="language-js">config.transformer = {
  getTransformOptions: async () =&gt; ({
    transform: { inlineRequires: true, experimentalImportSupport: false },
  }),
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};</code></pre>

<h3>serializer — Stage 3 controls</h3>
<ul>
  <li><strong><code>getModulesRunBeforeMainModule</code></strong> — modules to execute before your entry (polyfills, <code>InitializeCore</code>). RN sets these; you rarely touch them.</li>
  <li><strong><code>createModuleIdFactory</code></strong> — how numeric module ids are assigned. Override it to get <strong>stable, deterministic ids</strong> across builds — essential for reliable OTA/CodePush/EAS Update diffing so the same file keeps the same id.</li>
  <li><strong><code>customSerializer</code></strong> — full control over the final bundle assembly (advanced; used by tools that emit custom formats or split bundles).</li>
</ul>

<h3>watchFolders, maxWorkers, resetCache</h3>
<ul>
  <li><strong><code>watchFolders</code></strong> — extra directories outside the project root that Metro should watch and allow imports from. This is THE monorepo knob (point it at the repo root so packages resolve).</li>
  <li><strong><code>maxWorkers</code></strong> — number of transform worker processes (defaults to CPU count). Lower it on constrained CI; it does not change output, only parallelism.</li>
  <li><strong><code>resetCache</code></strong> — force a cold transform cache on every start (rarely set permanently; usually you pass <code>--reset-cache</code> on demand).</li>
</ul>

<h3>Hermes: from bundle to bytecode</h3>
<p>Hermes is RN's default JS engine. In a release build, after Metro produces the plain-JS bundle, the Hermes compiler (<code>hermesc</code>) compiles it to <strong>Hermes bytecode</strong> (a <code>.hbc</code> file). The RN build scripts invoke <code>hermesc</code> automatically; the path is exposed as <code>hermesCommand</code> in the native build config. Shipping bytecode means no on-device parse/compile of JS at startup — faster launch and lower memory. If Hermes is disabled, the app falls back to <strong>JSC</strong> (JavaScriptCore) and ships the plain JS bundle instead. Metro itself does not run Hermes; it hands the bundle to the native build, which calls <code>hermesc</code>.</p>
<pre><code class="language-bash"># conceptually, in the release build:
node node_modules/react-native/... bundle --minify   # Metro -> main.jsbundle
./ios/Pods/hermes-engine/destroot/bin/hermesc \\
  -emit-binary -out main.jsbundle.hbc main.jsbundle   # Hermes bytecode</code></pre>

<h3>Bundling for release manually</h3>
<pre><code class="language-bash"># iOS
npx react-native bundle \\
  --platform ios --dev false --minify true \\
  --entry-file index.js \\
  --bundle-output ios/main.jsbundle \\
  --assets-dest ios

# Android
npx react-native bundle \\
  --platform android --dev false --minify true \\
  --entry-file index.js \\
  --bundle-output android/app/src/main/assets/index.android.bundle \\
  --assets-dest android/app/src/main/res</code></pre>
<p>In a normal Xcode build the <strong>"Bundle React Native code and images"</strong> build phase runs this for you (via <code>react-native-xcode.sh</code>), producing <code>main.jsbundle</code>. On Android, the Gradle React plugin produces <code>index.android.bundle</code> under <code>assets/</code>. <strong>RAM bundles</strong> (<code>--ram-bundle</code> / unbundle) were a legacy way to load modules on demand to cut startup; with Hermes bytecode + inline requires they are effectively obsolete.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — Minimal bare-RN metro.config.js</h3>
<pre><code class="language-js">const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
module.exports = mergeConfig(getDefaultConfig(__dirname), {});</code></pre>

<h3>Example 2 — SVG-as-component (the assetExts/sourceExts swap)</h3>
<pre><code class="language-js">const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const base = getDefaultConfig(__dirname);
module.exports = mergeConfig(base, {
  transformer: { babelTransformerPath: require.resolve('react-native-svg-transformer') },
  resolver: {
    assetExts: base.resolver.assetExts.filter((e) =&gt; e !== 'svg'),
    sourceExts: [...base.resolver.sourceExts, 'svg'],
  },
});
// now: import Logo from './logo.svg';  -&gt; &lt;Logo width={40} /&gt;</code></pre>

<h3>Example 3 — Turn on inline requires explicitly</h3>
<pre><code class="language-js">module.exports = mergeConfig(getDefaultConfig(__dirname), {
  transformer: {
    getTransformOptions: async () =&gt; ({
      transform: { inlineRequires: true },
    }),
  },
});</code></pre>

<h3>Example 4 — Path alias without a Babel plugin</h3>
<pre><code class="language-js">const path = require('path');
module.exports = mergeConfig(getDefaultConfig(__dirname), {
  resolver: {
    extraNodeModules: {
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
    },
  },
});
// import Button from '@components/Button';</code></pre>

<h3>Example 5 — blockList to kill a duplicate react-native</h3>
<pre><code class="language-js">const exclusionList = require('metro-config/src/defaults/exclusionList');
module.exports = mergeConfig(getDefaultConfig(__dirname), {
  resolver: {
    blockList: exclusionList([/legacy-app\/node_modules\/react-native\/.*/]),
  },
});</code></pre>

<h3>Example 6 — Classic monorepo config (watchFolders + nodeModulesPaths)</h3>
<pre><code class="language-js">const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;
module.exports = config;</code></pre>

<h3>Example 7 — Deterministic module ids for OTA updates</h3>
<pre><code class="language-js">const path = require('path');
module.exports = mergeConfig(getDefaultConfig(__dirname), {
  serializer: {
    createModuleIdFactory: () =&gt; (modulePath) =&gt; {
      // stable id derived from the relative path (not an incrementing counter)
      const rel = path.relative(__dirname, modulePath);
      let hash = 0;
      for (let i = 0; i &lt; rel.length; i++) hash = (hash * 31 + rel.charCodeAt(i)) | 0;
      return hash;
    },
  },
});</code></pre>

<h3>Example 8 — Manual release bundle for a smoke test</h3>
<pre><code class="language-bash">npx react-native bundle --platform android --dev false \\
  --entry-file index.js \\
  --bundle-output /tmp/index.android.bundle \\
  --sourcemap-output /tmp/index.android.map</code></pre>

<h3>Example 9 — Expo config enabling package exports</h3>
<pre><code class="language-js">const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.unstable_enablePackageExports = true;
module.exports = config;</code></pre>

<h3>Example 10 — Reading the bundle over curl (debugging)</h3>
<pre><code class="language-bash"># Is Metro even up? Should print: packager-status:running
curl http://localhost:8081/status

# Force a full bundle build and see errors in the JSON/headers
curl "http://localhost:8081/index.bundle?platform=android&amp;dev=true" -o /tmp/out.js</code></pre>

<h3>Example 11 — Custom port when 8081 is taken</h3>
<pre><code class="language-bash">npx react-native start --port 8088
# app must then load from :8088 — set it in the Dev Menu -&gt; Settings -&gt; Debug server host</code></pre>

<h3>Example 12 — Excluding extra source extensions for platform files</h3>
<pre><code class="language-js">// Prefer .native.ts over .ts across the app (RN already does .ios/.android)
module.exports = mergeConfig(getDefaultConfig(__dirname), {
  resolver: {
    sourceExts: ['native.ts', 'native.tsx', ...getDefaultConfig(__dirname).resolver.sourceExts],
  },
});</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Port 8081 already in use</h3>
<p>"error listen EADDRINUSE :::8081" means another Metro (or an unrelated process) holds the port. Find and kill it: <code>lsof -ti:8081 | xargs kill -9</code>, or start on another port with <code>--port 8088</code> and update the device's debug server host.</p>

<h3>2. Stale / ghost bundle after a config or dependency change</h3>
<p>Metro caches transformed modules aggressively. After changing <code>babel.config.js</code>, <code>metro.config.js</code>, or upgrading a dep, the old cache can serve a stale bundle. Fix: <code>npx react-native start --reset-cache</code> (Expo: <code>npx expo start -c</code>).</p>

<h3>3. Watchman is confused</h3>
<p>Metro uses Watchman to watch the filesystem. If file changes stop being picked up, clear its state: <code>watchman watch-del-all</code>. On macOS this fixes a surprising number of "my edit isn't showing up" issues.</p>

<h3>4. Full cache nuke</h3>
<p>The heavy hammer when nothing else works: <code>rm -rf $TMPDIR/metro-*</code> (macOS) plus <code>rm -rf $TMPDIR/haste-map-*</code>, <code>watchman watch-del-all</code>, delete <code>node_modules</code>, reinstall. Metro's cache lives in the OS temp dir keyed by config, so a mismatched cache key can silently poison builds.</p>

<h3>5. "Unable to resolve module X from Y"</h3>
<p>Resolution failure. Causes: the package isn't installed, a typo in the import, a missing <code>sourceExts</code> entry for the file type, a <code>blockList</code> that excludes it, or (monorepo) Metro looking in the wrong <code>node_modules</code>. Read the exact "from" path in the error — it tells you which file's import failed.</p>

<h3>6. Monorepo grabs the wrong hoisted copy</h3>
<p>With Yarn/pnpm hoisting, two packages may resolve to different <code>react</code>/<code>react-native</code> copies → "Invalid hook call" or "duplicate React." Fix with <code>disableHierarchicalLookup: true</code> + explicit <code>nodeModulesPaths</code>, or <code>extraNodeModules</code> pinning <code>react</code>/<code>react-native</code> to one path.</p>

<h3>7. SVG import returns a number, not a component</h3>
<p>Without <code>react-native-svg-transformer</code> wired up, an <code>import x from './a.svg'</code> gives you the asset registry number (because <code>svg</code> is still in <code>assetExts</code>). You must remove <code>svg</code> from <code>assetExts</code> AND add it to <code>sourceExts</code> AND set <code>babelTransformerPath</code>.</p>

<h3>8. package "exports" field breaks resolution</h3>
<p>Modern libs ship an <code>"exports"</code> map that hides <code>main</code>. If Metro can't find a subpath, either enable <code>unstable_enablePackageExports: true</code> or add the subpath to <code>extraNodeModules</code>. Enabling it can also change which condition (import/require/react-native) is picked — test after flipping it.</p>

<h3>9. .cjs / .mjs modules fail to resolve</h3>
<p>Some packages (e.g. certain Firebase/gRPC builds) ship <code>.cjs</code>. If <code>cjs</code> isn't in <code>sourceExts</code>, resolution fails. Add <code>'cjs'</code> to <code>sourceExts</code>.</p>

<h3>10. Symlinks not followed (older Metro / pnpm)</h3>
<p>Older Metro didn't traverse symlinks, so pnpm's linked store or a <code>yarn link</code>ed local package wouldn't resolve. Newer Metro follows symlinks; if stuck on an old version, use <code>extraNodeModules</code> to point at the real path.</p>

<h3>11. Fast Refresh silently does a full reload</h3>
<p>If a file exports something that isn't a React component, or has import-time side effects, Fast Refresh can't hot-swap it and re-runs the whole module tree — state is lost. Keep components as the default/only exports of a file to keep refresh "hot."</p>

<h3>12. Assets missing from the release binary</h3>
<p>If you bundle manually and forget <code>--assets-dest</code>, images resolve in dev (served by Metro) but are blank in release. The build phase handles this; a hand-rolled bundle must pass <code>--assets-dest</code>.</p>

<h3>13. Source maps not lining up</h3>
<p>Wrong or missing <code>--sourcemap-output</code> at bundle time means release crash stacks show minified positions. For Hermes, you also need to compose the JS map with the Hermes bytecode map (<code>compose-source-maps.js</code>) before uploading to Sentry.</p>

<h3>14. inlineRequires changes evaluation order</h3>
<p>Because requires move to first use, a module with side effects expected "at import" may now run later (or not at all if never used). Rare, but it can surprise polyfill/patch code that relied on eager top-of-file execution.</p>

<h3>15. Device can't reach Metro on a real phone</h3>
<p>"Could not connect to development server." On a physical device, <code>localhost</code> is the phone, not your laptop. Use <code>adb reverse tcp:8081 tcp:8081</code> (Android) or set the debug host to your machine's LAN IP; ensure both are on the same network / firewall allows 8081.</p>

<h3>16. maxWorkers on CI</h3>
<p>On memory-limited CI, the default (all CPUs) worker pool can OOM during transform. Set <code>--max-workers 2</code> or <code>maxWorkers: 2</code> in config.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — hand-editing defaults instead of mergeConfig</h3>
<p>Spreading over <code>getDefaultConfig</code> by hand drops nested defaults (e.g. clobbering <code>resolver.assetExts</code> entirely). Always <code>mergeConfig(defaultConfig, overrides)</code> and derive arrays FROM the default (<code>[...base.resolver.sourceExts, 'x']</code>).</p>

<h3>Anti-pattern 2 — replacing sourceExts/assetExts instead of extending</h3>
<p>Writing <code>sourceExts: ['svg']</code> wipes <code>js/ts/tsx</code> and nothing resolves. Extend the default array; never replace it.</p>

<h3>Anti-pattern 3 — committing --reset-cache into the start script</h3>
<p>Permanently resetting the cache throws away Metro's biggest speed feature; every start becomes a cold build. Use <code>--reset-cache</code> as a one-off fix, not the default.</p>

<h3>Anti-pattern 4 — mixing @react-native/metro-config in an Expo app</h3>
<p>Using RN's base config in an Expo project loses the Expo asset registry, CSS, and expo-router resolver. Always start from <code>expo/metro-config</code> in Expo apps.</p>

<h3>Anti-pattern 5 — random module ids + OTA updates</h3>
<p>Leaving the default incrementing id factory makes module ids shift between builds, bloating OTA diffs and risking mismatches. Use a deterministic <code>createModuleIdFactory</code> for CodePush/EAS Update.</p>

<h3>Anti-pattern 6 — a too-broad blockList</h3>
<p>A greedy RegExp in <code>blockList</code> (e.g. matching all of <code>node_modules</code>) silently excludes real modules → confusing "Unable to resolve" errors. Anchor the pattern to the exact path.</p>

<h3>Anti-pattern 7 — ignoring Watchman state</h3>
<p>Chasing a "my edit doesn't show" bug by restarting Metro repeatedly instead of running <code>watchman watch-del-all</code>. Clear Watchman first.</p>

<h3>Anti-pattern 8 — huge inline assets / requiring big JSON</h3>
<p>Importing a multi-MB JSON at the top level bloats the bundle and startup. Load big data lazily or from the filesystem, not through a top-of-file <code>require</code>.</p>

<h3>Anti-pattern 9 — expecting code-splitting like the web</h3>
<p>Trying to Webpack-style split routes into separately fetched chunks. RN ships one bundle; use <code>inlineRequires</code> for lazy init and RAM-bundle-era tricks are obsolete under Hermes. Don't architect around web chunking.</p>

<h3>Anti-pattern 10 — editing generated metro cache or the bundle by hand</h3>
<p>Poking the cached transform output or a built <code>main.jsbundle</code> to "patch" something. Change the source and rebuild; hand-edits get overwritten and desync source maps.</p>

<h3>Anti-pattern 11 — forgetting adb reverse on device</h3>
<p>Blaming Metro when a real device shows "could not connect," when the fix is <code>adb reverse tcp:8081 tcp:8081</code> or a LAN IP host. <code>localhost</code> on the phone is the phone.</p>

<h3>Anti-pattern 12 — leaving resolverMainFields default when a lib needs the web build</h3>
<p>Some libs only ship a correct <code>browser</code>/<code>main</code> build; if <code>react-native</code> field points to broken code, override <code>resolverMainFields</code> order. Conversely, dropping <code>react-native</code> from the list breaks platform builds. Change it deliberately.</p>

<h3>Anti-pattern 13 — disabling Hermes to "fix" a Metro issue</h3>
<p>Metro output problems are almost never solved by switching to JSC; you just hide the symptom and lose Hermes' startup/memory wins. Fix the resolution/transform cause instead.</p>

<h3>Anti-pattern 14 — not clearing cache after a native/dep upgrade</h3>
<p>Upgrading RN/Expo or a Babel plugin without <code>--reset-cache</code> can serve transforms from the old toolchain → baffling runtime errors. Reset once after any toolchain bump.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. What is Metro and why does React Native use it instead of Webpack?</div>
  <div class="qa-answer">
    <p>Metro is RN's default JavaScript bundler, built specifically for React Native. Unlike Webpack/Vite (which emit multiple chunks + HTML for the web), Metro emits ONE self-contained bundle for a mobile binary, understands platform-specific files (<code>.ios.js</code>/<code>.android.js</code>) and the <code>react-native</code> package field natively, and ships an integrated dev server with Fast Refresh. It is optimized for fast incremental rebuilds over very large module graphs, which is exactly what RN apps have.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Walk me through the three stages of a Metro build.</div>
  <div class="qa-answer">
    <ol>
      <li><strong>Resolution</strong> — starting from the entry file, Metro follows every import/require to build the module graph, applying <code>sourceExts</code>, platform variants, <code>resolverMainFields</code>, <code>node_modules</code> lookup, and <code>blockList</code>.</li>
      <li><strong>Transformation</strong> — each file is Babel-transformed (JSX/TS → JS, inline requires, etc.) in a worker pool, with results cached on disk.</li>
      <li><strong>Serialization</strong> — modules get numeric ids, each is wrapped, ordered, prefixed with polyfills, and concatenated into one bundle plus a source map.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. What runs on port 8081 and what's in the bundle URL?</div>
  <div class="qa-answer">
    <p>The Metro dev server binds to port 8081. The app fetches something like <code>http://localhost:8081/index.bundle?platform=ios&amp;dev=true&amp;minify=false</code>. <code>platform</code> selects platform files and the <code>react-native</code> field, <code>dev</code> toggles <code>__DEV__</code> and Fast Refresh, and <code>minify</code> controls the minifier. Metro keeps a WebSocket open for Fast Refresh/HMR. There's also <code>/status</code>, <code>/index.map</code>, and <code>/reload</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. What are the three top-level sections of metro.config.js?</div>
  <div class="qa-answer">
    <p><code>resolver</code> (controls resolution — <code>sourceExts</code>, <code>assetExts</code>, <code>extraNodeModules</code>, <code>blockList</code>, <code>resolverMainFields</code>), <code>transformer</code> (controls transformation — <code>babelTransformerPath</code>, <code>getTransformOptions</code>/<code>inlineRequires</code>, <code>minifierPath</code>), and <code>serializer</code> (controls bundle assembly — <code>createModuleIdFactory</code>, <code>getModulesRunBeforeMainModule</code>). Plus top-level <code>watchFolders</code>, <code>maxWorkers</code>, and <code>resetCache</code>. You build it with <code>getDefaultConfig</code> + <code>mergeConfig</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. How do you make Metro treat SVGs as React components?</div>
  <div class="qa-answer">
    <p>Install <code>react-native-svg-transformer</code>, set <code>transformer.babelTransformerPath</code> to it, REMOVE <code>'svg'</code> from <code>resolver.assetExts</code>, and ADD <code>'svg'</code> to <code>resolver.sourceExts</code>. That moves SVG from the "static asset" pipeline to the "source, transform it" pipeline. Then <code>import Logo from './logo.svg'</code> gives you a component instead of an asset number.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. What is inlineRequires and why does it matter?</div>
  <div class="qa-answer">
    <p>An <code>inlineRequires</code> transform (set in <code>getTransformOptions</code>) moves <code>require()</code> calls from the top of a file to the point of first use, so modules initialize lazily rather than all at import time. It's a significant startup / time-to-interactive win because the app doesn't eagerly evaluate modules it hasn't reached yet. It's on by default in recent RN/Expo.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How does Metro relate to Hermes?</div>
  <div class="qa-answer">
    <p>Metro produces a plain-JS bundle. In a release build the Hermes compiler (<code>hermesc</code>) then compiles that bundle to Hermes bytecode (<code>.hbc</code>), which is baked into the app. Shipping bytecode skips on-device JS parsing → faster launch, less memory. Metro doesn't run Hermes itself — the native build phase invokes <code>hermesc</code> (via <code>hermesCommand</code>). If Hermes is off, the app uses JSC and ships the plain JS bundle.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. What actually ships in a release build — where does Metro fit?</div>
  <div class="qa-answer">
    <p>In dev, the bundle is built on your machine and streamed from Metro@8081. In release there's no Metro at runtime: the "Bundle React Native code and images" Xcode build phase (or the Android Gradle React plugin) runs <code>react-native bundle</code> to produce <code>main.jsbundle</code> (iOS) / <code>index.android.bundle</code> (Android), usually then compiled to Hermes bytecode, and embedded in the <code>.ipa</code>/<code>.apk</code>. That's why release builds work with your laptop off.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Your edit isn't showing up / the bundle looks stale. How do you fix it?</div>
  <div class="qa-answer">
    <ol>
      <li><code>npx react-native start --reset-cache</code> (Expo: <code>expo start -c</code>) to drop the transform cache.</li>
      <li><code>watchman watch-del-all</code> to clear the file watcher's state.</li>
      <li>Nuke <code>$TMPDIR/metro-*</code> / <code>haste-map-*</code> if needed.</li>
      <li>As a last resort, reinstall <code>node_modules</code>.</li>
    </ol>
    <p>Metro caches transformed modules keyed by config; a mismatched key or a Watchman hiccup is the usual culprit.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. "Unable to resolve module X from Y" — how do you debug it?</div>
  <div class="qa-answer">
    <p>Read the exact "from Y" path — that's the file whose import failed. Check the package is installed, the import string is right, the file's extension is in <code>sourceExts</code>, it isn't excluded by <code>blockList</code>, and (monorepo) Metro is searching the right <code>node_modules</code>. For <code>.cjs</code> add <code>'cjs'</code> to <code>sourceExts</code>; for a lib using <code>exports</code>, enable <code>unstable_enablePackageExports</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Set up Metro for a monorepo.</div>
  <div class="qa-answer">
    <p>Point <code>watchFolders</code> at the workspace root so Metro watches and can import shared packages. Set <code>resolver.nodeModulesPaths</code> to both the app's and the root's <code>node_modules</code>. Set <code>disableHierarchicalLookup: true</code> so Metro only searches those paths and doesn't grab a stray hoisted copy. Use <code>extraNodeModules</code> to pin a single <code>react</code>/<code>react-native</code> and avoid "duplicate React"/"Invalid hook call."</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. What does resolverMainFields do?</div>
  <div class="qa-answer">
    <p>It's the ordered list of <code>package.json</code> fields Metro tries when resolving a package's entry — default <code>['react-native', 'browser', 'main']</code>. So a library's <code>react-native</code> build wins over its web <code>main</code>. You reorder it only when a lib ships a broken RN entry and you must prefer <code>browser</code>/<code>main</code>, or vice versa.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Port 8081 is already in use — what now?</div>
  <div class="qa-answer">
    <p>Something else holds the port (often a zombie Metro). Kill it with <code>lsof -ti:8081 | xargs kill -9</code>, or start Metro on another port: <code>react-native start --port 8088</code>, then set the device's debug server host to that port. On a real device also remember <code>adb reverse tcp:8081 tcp:8081</code> so <code>localhost</code> on the phone forwards to your machine.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. How does Expo's Metro differ from bare RN's?</div>
  <div class="qa-answer">
    <p>Expo uses <code>expo/metro-config</code>'s <code>getDefaultConfig</code>, which layers Expo's asset registry, CSS support (<code>isCSSEnabled</code>), and expo-router resolution over RN's defaults. You customize via <code>npx expo customize metro.config.js</code>. Critically, the same config is used by <code>expo start</code> locally and by <code>eas build</code> in the cloud — so resolver/transformer tweaks affect production too. In an Expo app you must NOT start from <code>@react-native/metro-config</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Why does inlineRequires occasionally cause bugs, and what about source maps under Hermes?</div>
  <div class="qa-answer">
    <p>inlineRequires moves module evaluation to first use, so code that relied on a side effect running "at import" (a polyfill, a monkey-patch) may run later or never. Rare, but real. For Hermes source maps, the JS map from Metro must be composed with the Hermes bytecode map (<code>compose-source-maps.js</code>) so crash stacks (e.g. in Sentry) point at your original source rather than minified/bytecode positions.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You name the three stages (Resolution → Transformation → Serialization) and what each does.</li>
    <li>You know Metro serves on port 8081 and can read the bundle URL query params.</li>
    <li>You map <code>resolver</code>/<code>transformer</code>/<code>serializer</code> to the three stages.</li>
    <li>You explain the assetExts/sourceExts swap for SVGs.</li>
    <li>You know inlineRequires is a startup win and why.</li>
    <li>You explain that Metro output becomes Hermes bytecode at build time, and there's no Metro in release.</li>
    <li>Your first move for a stale bundle is <code>--reset-cache</code> + <code>watchman watch-del-all</code>.</li>
    <li>You can lay out the monorepo config (<code>watchFolders</code>, <code>nodeModulesPaths</code>, <code>disableHierarchicalLookup</code>).</li>
    <li>You know Expo uses <code>expo/metro-config</code> and EAS reuses the same file.</li>
  </ul>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'revision', title: '⚡ Revision — Points to Remember', collapsible: true, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Metro is RN's purpose-built bundler that turns your module graph into <strong>one</strong> bundle through <strong>Resolution → Transformation → Serialization</strong>, served over HTTP on <strong>port 8081</strong> with Fast Refresh in dev — and stale bundles almost always mean <strong>reset the cache</strong>.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>What it is:</strong> RN's default JS bundler (ships with RN and Expo). Emits ONE self-contained bundle (no HTML, no web-style chunks), understands <code>.ios/.android/.native</code> files and the <code>react-native</code> package field, and includes the dev server.</li>
    <li><strong>Three stages:</strong> <strong>Resolution</strong> (metro-resolver builds the module graph from the entry, applying sourceExts/platform/mainFields/blockList) → <strong>Transformation</strong> (Babel per file in a worker pool, disk-cached) → <strong>Serialization</strong> (numeric module ids, wrap + order + polyfills → one bundle + source map).</li>
    <li><strong>Dev server on port 8081:</strong> app fetches <code>/index.bundle?platform=ios&amp;dev=true&amp;minify=false</code>; <code>platform</code> picks platform files, <code>dev</code> toggles <code>__DEV__</code>/Fast Refresh. Sibling routes: <code>/status</code>, <code>/index.map</code>, <code>/reload</code>. Fast Refresh/HMR pushes deltas over a WebSocket, preserving component state when safe.</li>
    <li><strong>metro.config.js:</strong> build with <code>getDefaultConfig(__dirname)</code> + <code>mergeConfig(defaults, overrides)</code> — never spread defaults by hand. Three sections map to the three stages: <code>resolver</code>, <code>transformer</code>, <code>serializer</code>.</li>
    <li><strong>resolver keys:</strong> <code>sourceExts</code> (js/jsx/ts/tsx/json), <code>assetExts</code> (png/ttf/mp4…), <code>resolverMainFields</code> (<code>['react-native','browser','main']</code>), <code>extraNodeModules</code> (aliases/pins), <code>nodeModulesPaths</code>, <code>blockList</code> (was <code>blacklistRE</code>), <code>disableHierarchicalLookup</code>, <code>unstable_enablePackageExports</code>, symlink support.</li>
    <li><strong>transformer keys:</strong> <code>babelTransformerPath</code> (e.g. react-native-svg-transformer), <code>getTransformOptions</code> → <strong><code>inlineRequires</code></strong> (lazy module init, big startup win), <code>minifierPath</code>, <code>assetPlugins</code>.</li>
    <li><strong>serializer keys:</strong> <code>getModulesRunBeforeMainModule</code>, <code>createModuleIdFactory</code> (deterministic ids for OTA/CodePush/EAS Update), <code>customSerializer</code>.</li>
    <li><strong>SVG-as-component:</strong> set <code>babelTransformerPath</code> to react-native-svg-transformer, REMOVE <code>svg</code> from <code>assetExts</code>, ADD <code>svg</code> to <code>sourceExts</code>.</li>
    <li><strong>Hermes:</strong> Metro emits plain JS → build phase runs <code>hermesc</code> (<code>hermesCommand</code>) to compile to bytecode <code>.hbc</code> baked into the binary → faster launch/less memory; JSC is the fallback when Hermes is off. Metro doesn't run Hermes itself.</li>
    <li><strong>Release:</strong> no Metro at runtime. The "Bundle React Native code and images" Xcode phase / Android Gradle plugin runs <code>react-native bundle</code> → <code>main.jsbundle</code> (iOS) / <code>index.android.bundle</code> (Android), <code>--assets-dest</code> for images, usually then Hermes bytecode. RAM bundles are legacy (obsolete under Hermes + inline requires).</li>
    <li><strong>Cache fixes:</strong> <code>--reset-cache</code> (Expo <code>-c</code>) for stale/ghost bundles, <code>watchman watch-del-all</code> when edits don't show, nuke <code>$TMPDIR/metro-*</code> as the hammer, <code>lsof -ti:8081 | xargs kill -9</code> or <code>--port</code> for "8081 in use."</li>
    <li><strong>Monorepo:</strong> <code>watchFolders = [workspaceRoot]</code>, <code>nodeModulesPaths</code> = app + root, <code>disableHierarchicalLookup: true</code>, and pin <code>react</code>/<code>react-native</code> via <code>extraNodeModules</code> to avoid duplicate-React / Invalid hook call.</li>
    <li><strong>Expo:</strong> use <code>expo/metro-config</code>'s <code>getDefaultConfig</code> (asset registry, <code>isCSSEnabled</code>, expo-router); customize via <code>npx expo customize metro.config.js</code>; the SAME file is used by <code>eas build</code>.</li>
    <li><strong>Device debugging:</strong> on a real phone <code>localhost</code> is the phone → use <code>adb reverse tcp:8081 tcp:8081</code> or a LAN IP host to reach Metro.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Replacing (instead of extending) <code>sourceExts</code>/<code>assetExts</code>, or spreading over <code>getDefaultConfig</code> by hand</strong> — you wipe the built-in <code>js/ts/tsx</code> extensions and nothing resolves. Always derive arrays from the default (<code>[...base.resolver.sourceExts, 'svg']</code>) and combine with <code>mergeConfig</code>. Second trap: chasing a "stale bundle" for ten minutes when <code>--reset-cache</code> + <code>watchman watch-del-all</code> fixes it in seconds.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Metro is RN's bundler. Every build is Resolution → Transformation → Serialization: it builds the module graph, Babel-transforms each file in a worker pool with disk caching, then serializes everything into one bundle plus a source map. In dev it serves that on port 8081 with Fast Refresh."</div>
  <div class="revision-say">"You steer it from metro.config.js — resolver, transformer, serializer map onto the three stages. For SVGs I move 'svg' from assetExts to sourceExts and set the svg babel transformer. For startup I rely on inlineRequires."</div>
  <div class="revision-say">"In release there's no Metro: the Xcode/Gradle build phase runs react-native bundle to main.jsbundle / index.android.bundle, then Hermes compiles it to bytecode baked into the app. When a dev bundle looks stale, I reset the Metro cache and clear Watchman."</div>
</div>
`},

{ id: 'checklist', title: '✅ Interview Checklist', collapsible: true, html: `
<div class="callout success">
  <div class="callout-title">Can you answer these before moving on?</div>
  <ul>
    <li>Can you name Metro's three stages and say what each one produces?</li>
    <li>Can you decode a bundle URL like <code>/index.bundle?platform=ios&amp;dev=true</code> and say what runs on port 8081?</li>
    <li>Can you map <code>resolver</code>/<code>transformer</code>/<code>serializer</code> to the three stages and name the key fields in each?</li>
    <li>Can you configure Metro so an SVG import becomes a React component?</li>
    <li>Can you explain what inlineRequires does and why it helps startup?</li>
    <li>Can you trace how a Metro bundle becomes Hermes bytecode and what ships in a release binary?</li>
    <li>Can you write the classic monorepo Metro config and say why each of watchFolders / nodeModulesPaths / disableHierarchicalLookup is there?</li>
  </ul>
</div>
`}

]
});
