window.PREP_SITE.registerTopic({
  id: "rncfg-babel",
  module: "RN Project & Config (Deep)",
  title: "Babel Config",
  estimatedReadTime: "22 min",
  tags: ["babel","babel-config","babel.config.js","presets","plugins","reanimated-plugin","react-native-worklets","module-resolver","worklets","transpilation","jsx","hermes","metro","babel-preset-expo","metro-react-native-babel-preset","transform-remove-console","react-native-dotenv","babel-jest","decorators","path-aliases"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Babel transpiles JSX/TS/modern JS into Hermes-runnable JavaScript and <strong>strips types without checking them</strong>; Metro runs it per module; presets bundle transforms, plugins run in array order — and the <strong>reanimated / worklets plugin must be LAST</strong>.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Babel = transpiler.</strong> JSX → <code>React.createElement</code>/<code>jsx()</code>, TypeScript/Flow types stripped, modern syntax (<code>?.</code>, <code>??</code>, class fields, spread) lowered for Hermes.</li>
    <li><strong>Strips types, never type-checks.</strong> That's <code>tsc --noEmit</code>'s job and it's not in the runtime path — an app can bundle while <code>tsc</code> shows errors. Cross-ref the TypeScript config topic.</li>
    <li><strong>Metro invokes Babel per module</strong> via <code>@react-native/metro-babel-transformer</code> in the transform step (resolve → transform → serialize), and caches results — so config or <code>.env</code> changes need a cache reset (<code>expo start -c</code> / <code>--reset-cache</code>).</li>
    <li><strong>babel.config.js anatomy:</strong> function form with <code>api.cache(true)</code>, <code>presets</code> array, <code>plugins</code> array, <code>env</code> overrides (production/test), and <code>overrides</code> globs.</li>
    <li><strong>Presets:</strong> bare RN uses <code>module:metro-react-native-babel-preset</code>; Expo uses <code>babel-preset-expo</code>. Both bundle JSX, TS strip, class fields, optional chaining. <code>@babel/preset-env</code> targets Hermes (configured for you).</li>
    <li><strong>ORDER rule:</strong> plugins run first and in array order (top→bottom); presets run after and in REVERSE order (bottom→top). So the last plugin listed runs last.</li>
    <li><strong>Reanimated / worklets plugin (<code>react-native-reanimated/plugin</code> → <code>react-native-worklets/plugin</code>) MUST be last</strong> — it needs the final code shape to find <code>'worklet'</code> functions and serialize their closures for the UI-thread runtime.</li>
    <li><strong>module-resolver:</strong> path aliases like <code>@/…</code> must mirror tsconfig <code>paths</code> exactly, or it "resolves in TS but crashes at runtime" (or the reverse).</li>
    <li><strong>Other plugins:</strong> <code>react-native-dotenv</code> / <code>transform-inline-environment-variables</code> (build-time inlined env, NOT secret), <code>transform-remove-console</code> (prod only, exclude error/warn), <code>@babel/plugin-proposal-decorators</code> (MobX, order/legacy-sensitive), <code>expo-router/babel</code> (removed in SDK 50+, folded into preset).</li>
    <li><strong>Env-specific:</strong> Babel reads <code>NODE_ENV</code>/<code>BABEL_ENV</code> to pick the <code>env</code> key; strip logs under <code>env.production</code>; Jest uses <code>babel-jest</code> + <code>env.test</code> (via <code>jest-expo</code>).</li>
    <li><strong>api.cache gotcha:</strong> <code>api.cache(true)</code> while reading <code>process.env</code> freezes the first value — use <code>api.cache.using(() =&gt; process.env.NODE_ENV)</code>.</li>
    <li><strong>Expo reality:</strong> the preset does most of the work and absorbs former standalone plugins; <code>npx expo customize babel.config.js</code> to extend; the file survives <code>expo prebuild --clean</code> (only <code>android/</code>/<code>ios/</code> are regenerated); worklets plugin still last.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Putting the reanimated/worklets plugin anywhere but last</strong> — or editing babel.config.js and not clearing the Metro cache, so your fix appears to do nothing. Everything else goes ABOVE <code>react-native-worklets/plugin</code>, and every config change ends with <code>expo start -c</code> / <code>--reset-cache</code>.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Babel transpiles JSX and TypeScript into Hermes-runnable JS and strips types, but it never type-checks — that's <code>tsc</code>'s separate job. Metro runs Babel on every module and caches the result."</div>
  <div class="revision-say">"Plugins run in array order and presets in reverse; the reanimated/worklets plugin must be last because it needs the final code shape to serialize worklets for the UI thread."</div>
  <div class="revision-say">"module-resolver aliases must mirror tsconfig paths, console-stripping goes under env.production with error/warn excluded, and I clear the Metro cache after any Babel config change."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What Babel actually does</h3>
<p>Babel is a source-to-source compiler (a "transpiler"). It parses your source into an AST, applies a pipeline of transforms, and prints JavaScript back out. In a React Native project it handles four categories of input the JS engine cannot run directly:</p>
<ul>
  <li><strong>JSX</strong> — <code>&lt;View /&gt;</code> is not valid JavaScript. Babel rewrites it to <code>React.createElement(...)</code> (or the automatic-runtime <code>jsx()</code> calls).</li>
  <li><strong>TypeScript / Flow</strong> — Babel <em>strips</em> the type annotations, generics, interfaces, and <code>enum</code>/decorator syntax, leaving plain JS. It does no type-checking whatsoever.</li>
  <li><strong>Modern syntax Hermes doesn't parse</strong> — depending on the Hermes version: optional chaining <code>?.</code>, nullish coalescing <code>??</code>, class fields, object rest/spread, logical assignment, and so on get lowered to older equivalents.</li>
  <li><strong>Custom transforms</strong> — path aliases, worklet marking, console stripping, inlining env vars, decorators.</li>
</ul>

<h3>How Metro invokes Babel (the transformer)</h3>
<p>Metro is RN's bundler. Its pipeline is <strong>resolution → transformation → serialization</strong>. The transformation step runs <code>metro-transform-worker</code>, which for each JS/TS module calls a Babel transformer (<code>@react-native/metro-babel-transformer</code> in modern RN, historically <code>metro-react-native-babel-transformer</code>). So Babel is not a separate build step you run — it runs <strong>inline, per file, every time Metro bundles</strong>. Metro also caches transform results, which is why a stale Babel result usually means "clear the Metro cache."</p>

<div class="callout info">
  <div class="callout-title">Babel vs TypeScript's tsc — a classic confusion</div>
  <p>Babel and <code>tsc</code> both understand TypeScript but do opposite halves of the job. <strong>Babel strips types file-by-file and emits runnable JS but never checks them</strong> — it has no cross-file view, so it cannot catch a type error. <strong><code>tsc</code> (or <code>tsc --noEmit</code>) type-checks the whole program but is NOT in the RN runtime path.</strong> Because Babel works one isolated file at a time, some TS features that need type information are unsupported or need flags: <code>const enum</code>, namespaces, and legacy <code>experimentalDecorators</code> emit. This is why RN apps run fine even while <code>tsc</code> reports red errors — the bundle already shipped. See the TypeScript config topic.</p>
</div>

<h3>Why this matters for you</h3>
<p>Every "unexpected token", "plugin must be last", "alias can't be resolved", and "why is <code>console.log</code> still in my release build" bug lives in this one file. Knowing the anatomy turns a 40-minute head-scratch into a 30-second fix.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>The pipeline: where Babel sits</h3>
<div class="diagram">
<pre>
 your source                Metro                         engine
 ───────────                ─────                         ──────
 App.tsx  (JSX + TS)
    │
    │  Metro resolves the module graph
    ▼
 metro-transform-worker
    │
    ├──► Babel transformer  ◄── reads babel.config.js
    │        parse → AST
    │        apply PRESETS + PLUGINS
    │        print plain JS
    │
    ▼
 Metro serializes → one JS bundle
    │
    ▼
 Hermes bytecode (hermesc) ──► runs on device
</pre>
</div>

<h3>The two arrays inside babel.config.js</h3>
<div class="diagram">
<pre>
 module.exports = function (api) {
   api.cache(true);              // memoize this config
   return {
     presets: [ ... ],           // BUNDLES of plugins
     plugins: [ ... ],           // individual transforms
     env: { production: {...} }, // per-NODE_ENV overrides
     overrides: [ ... ],         // per-file-glob overrides
   };
 };
</pre>
</div>

<h3>The ORDER rule (the part everyone gets wrong)</h3>
<p>Babel has a precise, non-obvious ordering. Memorize this:</p>
<div class="diagram">
<pre>
 PLUGINS run  FIRST, in  ARRAY order      (top → bottom)
 PRESETS run  AFTER,  in REVERSE order     (bottom → top)

 plugins: [ A, B, C ]     runs A, then B, then C
 presets: [ X, Y, Z ]     runs Z, then Y, then X

 ┌─────────────────────────────────────────────┐
 │  So the LAST plugin in the array is the      │
 │  last plugin to see the code before presets. │
 │  ► react-native-worklets/plugin goes LAST.   │
 └─────────────────────────────────────────────┘
</pre>
</div>

<h3>Preset vs plugin — the mental split</h3>
<ul>
  <li>A <strong>plugin</strong> is one transform (e.g. "turn <code>?.</code> into safe property access").</li>
  <li>A <strong>preset</strong> is a curated, ordered <em>collection</em> of plugins shipped as one name (e.g. <code>babel-preset-expo</code> contains dozens of plugins for JSX, TS, class fields, etc.). You add one preset instead of twenty plugins.</li>
</ul>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Babel compiles my whole app." No — Babel sees exactly <strong>one file at a time</strong>, with zero knowledge of the other files. That is precisely why it can strip types (no cross-file checking needed) but cannot type-check, and why aliases must be re-declared for Babel even though TypeScript already knows them from <code>tsconfig.json</code>.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>Anatomy of babel.config.js — bare React Native</h3>
<pre><code class="language-js">// babel.config.js  (bare RN)
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    // ...your plugins...
    'react-native-reanimated/plugin', // MUST be last (older API name)
  ],
};</code></pre>

<h3>Anatomy — Expo project (what your apps use)</h3>
<pre><code class="language-js">// babel.config.js  (Expo — sw-mobile / sw-ticketing style)
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // module-resolver, dotenv, etc. go here...
      'react-native-worklets/plugin', // MUST be last (new name)
    ],
  };
};</code></pre>

<h3>The function form and api.cache</h3>
<p>Babel calls your config as a function and passes an <code>api</code> object. <code>api.cache(true)</code> tells Babel the config is static — compute it once and memoize forever (fast). If your config depends on an environment variable, you must invalidate the cache instead:</p>
<pre><code class="language-js">module.exports = function (api) {
  // recompute config whenever NODE_ENV changes:
  api.cache.using(function () { return process.env.NODE_ENV; });
  const isProd = api.env('production');
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      isProd &amp;&amp; 'transform-remove-console',
      'react-native-worklets/plugin',
    ].filter(Boolean), // drop the false entries
  };
};</code></pre>
<p>Using a plain <code>api.cache(true)</code> while reading <code>process.env</code> is a bug: the first value gets baked in and never re-read. Use <code>api.cache.using(...)</code> or <code>api.cache.invalidate(...)</code>.</p>

<h3>Presets — what they bundle</h3>
<table>
  <thead><tr><th>Preset</th><th>Used by</th><th>Bundles</th></tr></thead>
  <tbody>
    <tr><td><code>module:metro-react-native-babel-preset</code></td><td>Bare RN</td><td>JSX (automatic runtime), TypeScript &amp; Flow strip, class properties, object rest/spread, optional chaining, nullish coalescing, async/await via regenerator when needed, Hermes-parser wiring</td></tr>
    <tr><td><code>babel-preset-expo</code></td><td>Expo (managed &amp; prebuild)</td><td>Everything above, tuned for Expo — plus (SDK-version dependent) inlining of <code>expo-router</code>, <code>react-native-web</code> transforms for web, and since SDK 50 it folded in plugins that used to be separate</td></tr>
    <tr><td><code>@babel/preset-env</code></td><td>Under the hood / libraries</td><td>Lowers modern JS to a <code>targets</code> level. In RN the target is Hermes, so RN presets configure this for you; you rarely add it directly.</td></tr>
    <tr><td><code>@babel/preset-typescript</code></td><td>Inside the RN/Expo presets</td><td>The type-strip itself. You almost never list it directly in RN.</td></tr>
  </tbody>
</table>

<h3>The critical plugin: Reanimated / Worklets — and why it is LAST</h3>
<p>Reanimated (and the newer standalone <code>react-native-worklets</code>) run animation and gesture code on the <strong>UI thread</strong>, not the JS thread. A function marked with the <code>'worklet'</code> directive is compiled specially so it can be shipped to and executed on a separate worklet runtime. The Babel plugin is what performs that compilation — it finds worklets, serializes their code and captured closure variables, and rewrites them.</p>
<p>It must run <strong>after every other plugin has finished transforming the file</strong>, because it needs to see the <em>final</em> shape of the code (post module-resolver, post any syntax lowering). Remember the ordering rule: plugins run top-to-bottom, so "last in the array" = "runs last." If another plugin runs after it and rewrites the code, the worklet metadata no longer matches and animations silently fall back to the JS thread or throw at runtime.</p>
<pre><code class="language-js">plugins: [
  ['module-resolver', { /* ... */ }],
  'transform-remove-console',
  'react-native-worklets/plugin', // ← absolutely last
],</code></pre>

<div class="callout danger">
  <div class="callout-title">The interview + debugging gotcha</div>
  <p>If you see <em>"[Reanimated] Native part of Reanimated doesn't seem to be initialized"</em>, worklets that "do nothing", or a build error literally telling you the plugin must be last — the fix is almost always: move <code>react-native-reanimated/plugin</code> (or <code>react-native-worklets/plugin</code>) to the very end of the plugins array, then clear the Metro cache. In RN 0.79 / Reanimated 3.x era, <code>react-native-reanimated/plugin</code> re-exports the worklets plugin; newer setups import <code>react-native-worklets/plugin</code> directly.</p>
</div>

<h3>Other common plugins</h3>
<table>
  <thead><tr><th>Plugin</th><th>Job</th><th>Note</th></tr></thead>
  <tbody>
    <tr><td><code>babel-plugin-module-resolver</code></td><td>Path aliases: <code>import x from '@/utils'</code> instead of <code>'../../../utils'</code></td><td>Must <strong>mirror the <code>paths</code> in tsconfig.json</strong> exactly, or TS resolves but runtime doesn't (or vice versa)</td></tr>
    <tr><td><code>react-native-dotenv</code></td><td>Turns <code>import { API_URL } from '@env'</code> into inlined values from a <code>.env</code> file</td><td>Values are inlined at build time — restart Metro with cache clear after editing <code>.env</code></td></tr>
    <tr><td><code>transform-inline-environment-variables</code></td><td>Replaces <code>process.env.FOO</code> with the literal value at build time</td><td>Lower-level alternative to dotenv</td></tr>
    <tr><td><code>babel-plugin-transform-remove-console</code></td><td>Strips <code>console.*</code> calls (keeps <code>console.error</code> if you configure it)</td><td>Enable <strong>only in production</strong> via <code>env.production</code></td></tr>
    <tr><td><code>@babel/plugin-proposal-decorators</code></td><td>Enables <code>@decorator</code> syntax (MobX, legacy libs)</td><td>Order-sensitive vs class-properties; set <code>legacy: true</code> for old-style</td></tr>
    <tr><td><code>expo-router/babel</code></td><td>Older Expo (SDK &lt; 50) wiring for expo-router</td><td><strong>Deprecated / removed</strong> — folded into <code>babel-preset-expo</code> in SDK 50+</td></tr>
  </tbody>
</table>

<h3>module-resolver — mirror your tsconfig</h3>
<pre><code class="language-js">// babel.config.js
plugins: [
  ['module-resolver', {
    root: ['./src'],
    alias: {
      '@': './src',
      '@components': './src/components',
      '@utils': './src/utils',
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  }],
  'react-native-worklets/plugin',
],</code></pre>
<pre><code class="language-json">// tsconfig.json — MUST match, or TS and runtime disagree
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@components/*": ["components/*"],
      "@utils/*": ["utils/*"]
    }
  }
}</code></pre>

<h3>Env-specific config: strip logs only in production</h3>
<pre><code class="language-js">// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    env: {
      production: {
        plugins: ['transform-remove-console'],
      },
    },
    plugins: [
      'react-native-worklets/plugin', // still last, even with env overrides
    ],
  };
};</code></pre>
<p>Babel reads <code>NODE_ENV</code> (falling back to <code>BABEL_ENV</code>) to pick the <code>env</code> key. Metro sets <code>NODE_ENV=production</code> for release bundles, so <code>env.production.plugins</code> only applies then. The <code>test</code> key is used by Jest (see below).</p>

<h3>Jest / test transforms</h3>
<p>Jest cannot run JSX/TS either. It uses <code>babel-jest</code>, which reads the <strong>same</strong> <code>babel.config.js</code> and applies the <code>env.test</code> overrides (Jest sets <code>NODE_ENV=test</code>). Expo/RN projects usually use a Jest preset (<code>jest-expo</code> or <code>react-native</code>) that wires <code>babel-jest</code> in as the transform for JS/TS files.</p>
<pre><code class="language-json">// package.json (Expo)
{
  "jest": { "preset": "jest-expo" }
}</code></pre>

<h3>overrides — per-file-glob rules</h3>
<pre><code class="language-js">// apply a plugin only to certain files
overrides: [
  {
    test: /\\.mjs$/,
    plugins: [['@babel/plugin-transform-modules-commonjs']],
  },
],</code></pre>

<h3>Clearing the Babel/Metro cache</h3>
<p>Babel results are cached by Metro. After changing <code>babel.config.js</code>, a <code>.env</code> file, or plugin options, you MUST clear the cache or you keep running the old transform:</p>
<pre><code class="language-bash">npx expo start -c          # Expo: -c clears Metro cache
npx react-native start --reset-cache   # bare RN
rm -rf node_modules/.cache  # nuke Babel's on-disk cache if stuck</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — minimal Expo config (correct order)</h3>
<pre><code class="language-js">module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin'], // last
  };
};</code></pre>

<h3>Example 2 — bare RN config</h3>
<pre><code class="language-js">module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: ['react-native-reanimated/plugin'], // last
};</code></pre>

<h3>Example 3 — path aliases + worklets (order-safe)</h3>
<pre><code class="language-js">module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        root: ['./src'],
        alias: { '@': './src' },
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      }],
      'react-native-worklets/plugin', // AFTER module-resolver
    ],
  };
};</code></pre>

<h3>Example 4 — strip console.* in production only</h3>
<pre><code class="language-js">module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    env: {
      production: {
        plugins: [['transform-remove-console', { exclude: ['error', 'warn'] }]],
      },
    },
    plugins: ['react-native-worklets/plugin'],
  };
};</code></pre>
<p>Here <code>console.log</code> and <code>console.debug</code> are removed in release builds, but <code>console.error</code> and <code>console.warn</code> survive for crash triage.</p>

<h3>Example 5 — env vars via react-native-dotenv</h3>
<pre><code class="language-js">plugins: [
  ['module:react-native-dotenv', {
    moduleName: '@env',
    path: '.env',
    safe: false,
    allowUndefined: true,
  }],
  'react-native-worklets/plugin',
],</code></pre>
<pre><code class="language-ts">// usage in app code:
import { API_URL } from '@env';
console.log(API_URL); // inlined at build time from .env</code></pre>

<h3>Example 6 — legacy decorators (MobX)</h3>
<pre><code class="language-js">plugins: [
  ['@babel/plugin-proposal-decorators', { legacy: true }],
  'react-native-worklets/plugin',
],</code></pre>

<h3>Example 7 — cache-busting on NODE_ENV</h3>
<pre><code class="language-js">module.exports = function (api) {
  api.cache.using(function () { return process.env.NODE_ENV; });
  const isProd = process.env.NODE_ENV === 'production';
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      isProd &amp;&amp; 'transform-remove-console',
      'react-native-worklets/plugin',
    ].filter(Boolean),
  };
};</code></pre>

<h3>Example 8 — what JSX compiles to</h3>
<pre><code class="language-tsx">// you write:
const El = () =&gt; &lt;View style={s.box}&gt;&lt;Text&gt;Hi&lt;/Text&gt;&lt;/View&gt;;

// Babel (automatic runtime) emits roughly:
import { jsx as _jsx } from 'react/jsx-runtime';
const El = () =&gt; _jsx(View, { style: s.box, children: _jsx(Text, { children: 'Hi' }) });</code></pre>

<h3>Example 9 — what TypeScript stripping looks like</h3>
<pre><code class="language-ts">// you write:
function add(a: number, b: number): number { return a + b; }
interface Props { title: string }

// Babel emits (types simply deleted, interface gone entirely):
function add(a, b) { return a + b; }</code></pre>
<p>Notice: no type-checking happened. If you called <code>add('x', 'y')</code>, Babel ships it happily — only <code>tsc</code> would complain.</p>

<h3>Example 10 — regenerating the Expo babel.config.js</h3>
<pre><code class="language-bash"># Expo ships a working babel.config.js after prebuild, but to customize it:
npx expo customize babel.config.js</code></pre>
<p>This writes a starter <code>babel.config.js</code> with <code>babel-preset-expo</code> that you then extend. Reanimated / worklets plugin still goes last.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. Reanimated plugin not last</h3>
<p>Any plugin after <code>react-native-worklets/plugin</code> can invalidate worklet transforms. Symptom: animations don't run, gestures do nothing, or a hard error telling you the plugin must be last. Fix: move it to the end, clear cache.</p>

<h3>2. Editing babel.config.js without clearing cache</h3>
<p>Metro caches Babel output. Your change appears to do nothing. Fix: <code>npx expo start -c</code> or <code>--reset-cache</code>.</p>

<h3>3. api.cache(true) while reading process.env</h3>
<p>The first env value is baked in forever. Symptom: production-only plugins never activate, or dev config leaks into release. Fix: <code>api.cache.using(() =&gt; process.env.NODE_ENV)</code>.</p>

<h3>4. Alias resolves in TS but crashes at runtime</h3>
<p>You added <code>paths</code> to tsconfig.json but forgot <code>module-resolver</code> in babel.config.js. TypeScript is happy; Metro throws "Unable to resolve module '@/utils'". Fix: add the matching alias to babel.config.js.</p>

<h3>5. Alias resolves at runtime but TS errors</h3>
<p>The reverse: you added <code>module-resolver</code> but not tsconfig <code>paths</code>. App runs; the editor and <code>tsc</code> show red squiggles. Fix: mirror the alias in tsconfig.</p>

<h3>6. Missing plugin for a syntax</h3>
<p>"SyntaxError: Support for the experimental syntax 'X' isn't currently enabled." Something (usually decorators or a stage-N proposal) needs a plugin the preset doesn't include. Add the specific plugin.</p>

<h3>7. .env edits not picked up</h3>
<p><code>react-native-dotenv</code> inlines values at build time. Editing <code>.env</code> after Metro started shows stale values. Fix: restart Metro with cache clear.</p>

<h3>8. transform-remove-console kills error logs</h3>
<p>Stripping ALL console methods removes <code>console.error</code>, hurting production crash triage. Fix: <code>exclude: ['error', 'warn']</code>.</p>

<h3>9. Decorators + class properties order</h3>
<p><code>@babel/plugin-proposal-decorators</code> must precede class-properties handling, and the <code>legacy</code>/<code>version</code> option must match your decorator style, or you get parse errors on <code>@observable</code>.</p>

<h3>10. Old expo-router/babel still listed</h3>
<p>On Expo SDK 50+, <code>expo-router/babel</code> was removed and folded into <code>babel-preset-expo</code>. Leaving it in throws "Cannot find module 'expo-router/babel'." Fix: delete that plugin entry.</p>

<h3>11. Wrong config filename</h3>
<p>RN wants a project-wide <code>babel.config.js</code> (not <code>.babelrc</code>, which is package-relative and can be ignored across <code>node_modules</code>). Using <code>.babelrc</code> can silently skip your config for some files.</p>

<h3>12. process.env.NODE_ENV not set as expected</h3>
<p>Locally <code>NODE_ENV</code> may be undefined; Babel then treats env as development. Release bundles set it to <code>production</code>. Don't assume it — gate on the exact value or use <code>api.env('production')</code>.</p>

<h3>13. Hermes vs older syntax mismatch</h3>
<p>Hermes parses most modern syntax natively now, so the preset may NOT lower <code>?.</code> — if you rely on a transform that isn't happening, verify what your Hermes/preset version actually emits before assuming Babel lowered it.</p>

<h3>14. Monorepo / multiple babel.config.js</h3>
<p>In a monorepo, a nested package's config can shadow or conflict with the root. Babel's root-resolution and <code>babelrcRoots</code> matter. Keep one authoritative <code>babel.config.js</code> at the app root.</p>

<h3>15. Plugin installed but not in devDependencies</h3>
<p>Referencing a plugin you never installed → "Cannot find module 'babel-plugin-...'". Install it (usually as a devDependency) and clear cache.</p>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — don't fight the preset</div>
  <p>In Expo prebuild apps (sw-mobile, sw-ticketing), <code>babel-preset-expo</code> already handles JSX, TS, class fields, and most syntax. Since SDK 50 it also absorbed plugins that used to be listed separately (like <code>expo-router/babel</code>). Your <code>babel.config.js</code> lives at the JS root and is NOT wiped by <code>expo prebuild --clean</code> (that only regenerates <code>android/</code> and <code>ios/</code>). So Babel config is safe to hand-edit — but keep it minimal, let the preset do the heavy lifting, and remember the worklets plugin still must be last.</p>
</div>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — putting the reanimated/worklets plugin anywhere but last</h3>
<p>The number-one RN config bug. It must be the final plugin array entry. Everything else in your config that adds a plugin goes ABOVE it.</p>

<h3>Anti-pattern 2 — expecting Babel to type-check</h3>
<p>Babel strips types; it never validates them. Relying on the bundle succeeding as "proof the types are correct" is wrong. Run <code>tsc --noEmit</code> in CI separately.</p>

<h3>Anti-pattern 3 — api.cache(true) with env-dependent config</h3>
<p>Reading <code>process.env</code> under <code>api.cache(true)</code> freezes the first value. Use <code>api.cache.using</code> or <code>api.cache.invalidate</code>.</p>

<h3>Anti-pattern 4 — aliases in only one of tsconfig / babel</h3>
<p>They must be mirrored. One-sided aliases give you "works in editor, crashes at runtime" or the reverse. Keep them in sync (or generate one from the other).</p>

<h3>Anti-pattern 5 — stripping every console in production</h3>
<p>Removing <code>console.error</code> blinds your crash reporting. Always <code>exclude</code> error/warn.</p>

<h3>Anti-pattern 6 — leaving deprecated plugins in place after an SDK bump</h3>
<p><code>expo-router/babel</code> and similar were folded into the preset. Stale entries throw "cannot find module." Remove them when you upgrade.</p>

<h3>Anti-pattern 7 — not clearing cache after config changes</h3>
<p>You "fixed" babel.config.js but Metro serves cached transforms. You conclude the fix didn't work and thrash. Always reset cache after touching Babel config or <code>.env</code>.</p>

<h3>Anti-pattern 8 — using .babelrc instead of babel.config.js</h3>
<p><code>.babelrc</code> is file-relative and is skipped for <code>node_modules</code> and across package boundaries. RN needs the project-wide <code>babel.config.js</code>.</p>

<h3>Anti-pattern 9 — hand-adding @babel/preset-env manually</h3>
<p>The RN/Expo preset already configures targets for Hermes. Adding your own <code>preset-env</code> with browser targets can double-transform or lower code Hermes handles fine, bloating the bundle.</p>

<h3>Anti-pattern 10 — heavy custom plugins that slow every transform</h3>
<p>Babel runs on every module on every bundle. A slow custom plugin taxes cold-start and CI. Keep custom transforms cheap or scope them with <code>overrides</code>.</p>

<h3>Anti-pattern 11 — inlining secrets via dotenv and thinking they're hidden</h3>
<p><code>react-native-dotenv</code> literally bakes values into the JS bundle. They are extractable from the shipped app. Don't treat build-time env inlining as secure secret storage.</p>

<h3>Anti-pattern 12 — decorators plugin order/version mismatch</h3>
<p>Wrong <code>legacy</code>/<code>version</code> option or wrong ordering vs class-properties produces confusing parse errors. Match your library's expected decorator spec.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. What does Babel do in a React Native project?</div>
  <div class="qa-answer">
    <p>It transpiles the source you write — JSX, TypeScript/Flow, and modern JS syntax — into plain JavaScript the engine (Hermes) can run. It rewrites JSX to <code>React.createElement</code>/<code>jsx()</code> calls, strips TypeScript type annotations, and lowers syntax Hermes doesn't parse. Metro invokes it per module during bundling. Crucially, it strips types but does NOT type-check.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. How does Metro use Babel?</div>
  <div class="qa-answer">
    <p>Metro's pipeline is resolve → transform → serialize. In the transform step, <code>metro-transform-worker</code> runs a Babel transformer (<code>@react-native/metro-babel-transformer</code>) on each JS/TS module, reading <code>babel.config.js</code>. So Babel isn't a separate build; it runs inline, per file, and its results are cached by Metro — which is why config changes need a cache reset.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Babel vs tsc — what's the difference?</div>
  <div class="qa-answer">
    <p>Both understand TypeScript but do opposite jobs. Babel strips types file-by-file and emits runnable JS with no cross-file view, so it can't catch type errors. <code>tsc</code> (or <code>tsc --noEmit</code>) type-checks the whole program but isn't in the RN runtime path. That's why an app can bundle and run while <code>tsc</code> reports errors. You run <code>tsc</code> separately in CI for type safety.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Why must the Reanimated / worklets Babel plugin be last?</div>
  <div class="qa-answer">
    <p>Because plugins run in array order (top to bottom). The worklets plugin needs to see the FINAL form of the code — after module-resolver, syntax lowering, everything — so it can correctly find <code>'worklet'</code> functions, serialize them and their captured closures, and ship them to the UI-thread worklet runtime. If another plugin runs after it and rewrites the code, the worklet metadata no longer matches and animations fall back to the JS thread or throw. So it goes dead last in the plugins array.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. What's the difference between a preset and a plugin?</div>
  <div class="qa-answer">
    <p>A plugin is a single transform. A preset is a curated, ordered bundle of plugins shipped under one name — e.g. <code>babel-preset-expo</code> or <code>module:metro-react-native-babel-preset</code> bundle JSX, TS stripping, class fields, optional chaining, etc. You add one preset instead of a dozen plugins. And note the ordering asymmetry: plugins run in array order, presets run in REVERSE array order.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. What preset does a bare RN app use vs an Expo app?</div>
  <div class="qa-answer">
    <p>Bare RN uses <code>module:metro-react-native-babel-preset</code>. Expo uses <code>babel-preset-expo</code>, which extends the same idea but is tuned for Expo (web transforms, expo-router support, and since SDK 50 it absorbed several plugins that used to be listed separately). Both give you JSX, TS, and modern-syntax support out of the box.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How do you set up path aliases like @/components?</div>
  <div class="qa-answer">
    <p>Two places that MUST match: <code>babel-plugin-module-resolver</code> in babel.config.js (for runtime resolution) and <code>paths</code>/<code>baseUrl</code> in tsconfig.json (for the type checker and editor). If they diverge you get "resolves in TS but crashes at runtime" or the reverse. I keep them mirrored, and the module-resolver entry sits above the worklets plugin.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How do you strip console.log only in production?</div>
  <div class="qa-answer">
    <p>Use <code>babel-plugin-transform-remove-console</code> under the <code>env.production</code> key of babel.config.js, so it only applies when <code>NODE_ENV=production</code> (which Metro sets for release bundles). I always pass <code>exclude: ['error', 'warn']</code> so crash-relevant logs survive. Babel picks the <code>env</code> key from <code>NODE_ENV</code>/<code>BABEL_ENV</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. What is api.cache(true) and when does it bite you?</div>
  <div class="qa-answer">
    <p>Babel calls the config as a function with an <code>api</code> object; <code>api.cache(true)</code> says "this config is static, memoize it." It bites you when your config reads <code>process.env</code> — the first value gets frozen and env-specific plugins never re-evaluate. The fix is <code>api.cache.using(() =&gt; process.env.NODE_ENV)</code> so the config recomputes when the env changes.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. How does Jest transform your code?</div>
  <div class="qa-answer">
    <p>Jest uses <code>babel-jest</code>, which reads the same <code>babel.config.js</code> and applies the <code>env.test</code> overrides (Jest sets <code>NODE_ENV=test</code>). RN/Expo projects wire this through a Jest preset like <code>jest-expo</code> or <code>react-native</code>. So there's one Babel config, and env keys (development/production/test) branch behavior.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. You changed babel.config.js and nothing happened. Why?</div>
  <div class="qa-answer">
    <p>Metro caches Babel transform output. Config or <code>.env</code> changes need a cache reset: <code>npx expo start -c</code> or <code>react-native start --reset-cache</code> (and if truly stuck, delete <code>node_modules/.cache</code>). Forgetting this is the classic "my fix did nothing" trap.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. What are worklets and what does the Babel plugin do for them?</div>
  <div class="qa-answer">
    <p>A worklet is a JS function (marked with the <code>'worklet'</code> directive, or auto-detected) that runs on the UI thread in a separate JS runtime, so animations and gestures stay smooth even if the main JS thread is busy. The Babel plugin finds these functions, serializes their code and captured closure variables, and rewrites them so the worklet runtime can execute them. Because it depends on the final code shape, it must run last.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. How do env vars like API_URL get into the app via Babel?</div>
  <div class="qa-answer">
    <p>With <code>react-native-dotenv</code> (import from <code>@env</code>) or <code>transform-inline-environment-variables</code> (<code>process.env.FOO</code>), Babel inlines the literal value from <code>.env</code> at build time. Important caveats: values are baked into the bundle so they're not secret, and editing <code>.env</code> requires a Metro cache reset to take effect.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. In Expo, do you even need to touch babel.config.js?</div>
  <div class="qa-answer">
    <p>Often not much — <code>babel-preset-expo</code> handles JSX, TS, class fields, and most syntax, and SDK 50+ folded former standalone plugins (like <code>expo-router/babel</code>) into the preset. You run <code>npx expo customize babel.config.js</code> when you need to add module-resolver, dotenv, or console-stripping. It lives at the JS root and survives <code>expo prebuild --clean</code>. The worklets plugin still goes last.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Explain the plugin/preset ordering rules precisely.</div>
  <div class="qa-answer">
    <p>Plugins run BEFORE presets. Plugins run in the order they're listed (first to last). Presets run in REVERSE order (last to first). Within that, the practical takeaway is: the last plugin in the array is the last plugin to touch the code before presets — which is exactly why <code>react-native-worklets/plugin</code> belongs at the end.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You say Babel strips types but doesn't type-check, and name <code>tsc</code> as the checker.</li>
    <li>You know Metro invokes Babel per module and that config changes need a cache reset.</li>
    <li>You state the worklets/reanimated plugin must be LAST and can explain WHY (needs final code shape).</li>
    <li>You can recite the ordering: plugins first &amp; in order, presets after &amp; reversed.</li>
    <li>You distinguish preset (bundle) from plugin (single transform).</li>
    <li>You mirror module-resolver aliases with tsconfig paths.</li>
    <li>You strip console only in <code>env.production</code> and exclude error/warn.</li>
    <li>You know <code>api.cache(true)</code> freezes env-dependent config and use <code>api.cache.using</code>.</li>
    <li>You know Expo's preset absorbs most plugins and that config survives prebuild.</li>
  </ul>
</div>
` },

  ]
});
