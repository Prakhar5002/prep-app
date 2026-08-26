window.PREP_SITE.registerTopic({
  id: 'rncfg-ts-lint',
  module: 'RN Project & Config (Deep)',
  title: 'TypeScript & Linting',
  estimatedReadTime: '22 min',
  tags: ['tsconfig', 'typescript', 'eslint', 'prettier', 'react-native-eslint-config', 'eslint-config-expo', 'type-checking', 'declaration-files', 'ambient-modules', 'paths', 'path-aliases', 'module-resolver', 'flat-config', 'husky', 'lint-staged', 'exhaustive-deps', 'noEmit', 'skipLibCheck', 'react-native-svg-transformer', 'react-native-config'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>Three separate tools sit on top of your source and each has one job. They do NOT run your app — they run over your files while you code and in CI:</p>
<ul>
  <li><strong>TypeScript (tsc)</strong> — the <em>type checker</em>. Driven by <code>tsconfig.json</code>. In RN it runs with <code>noEmit</code> (or <code>tsc --noEmit</code>): it checks types and produces NO JavaScript. Babel does the actual transpile.</li>
  <li><strong>ESLint</strong> — the <em>linter</em>. Catches bugs and enforces rules (unused vars, missing hook deps, banned patterns). Configured by <code>eslint.config.js</code> (flat) or legacy <code>.eslintrc</code>.</li>
  <li><strong>Prettier</strong> — the <em>formatter</em>. Only cares about whitespace, quotes, commas. It has no opinion about correctness.</li>
</ul>
<p>The single most important mental split: <strong>Babel transpiles and runs your code; tsc only type-checks it.</strong> Babel strips the types and never looks at them — so a red squiggle from tsc can sit right next to code that runs perfectly at runtime, and vice-versa. That gap is the source of half the "but it works!" confusion in RN.</p>
<p>The second most important thing: <strong>path aliases must be declared twice</strong> — once in <code>tsconfig.json</code> <code>paths</code> (so tsc and your editor resolve them) and once in <code>babel.config.js</code> <code>module-resolver</code> (so they actually exist at runtime). Declare one but not the other and you get a build that type-checks but crashes, or an app that runs but shows red imports everywhere.</p>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Babel runs your code and never type-checks it; tsc type-checks and never runs it; ESLint finds bugs; Prettier fixes whitespace. Path aliases live in TWO files (tsconfig <code>paths</code> + babel <code>module-resolver</code>) or they break.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What this layer is</h3>
<p>Every serious RN project ships a set of "dev-time" config files that never appear in the bundle but shape everything you type: <code>tsconfig.json</code>, one or more <code>.d.ts</code> declaration files, <code>eslint.config.js</code> (or <code>.eslintrc.js</code>), <code>.prettierrc</code>, and Git-hook config for <code>husky</code> + <code>lint-staged</code>. Together they form the <strong>static analysis</strong> layer: tools that read your code without executing it and tell you about problems before you ever hit the simulator.</p>

<h3>Why TypeScript in RN at all</h3>
<p>React Native is a JavaScript runtime (Hermes or JSC) — it has no idea what a "type" is. TypeScript gives you compile-time guarantees: prop shapes, navigation param lists, the return of a native module, the keys on a theme object. Since RN 0.71 the community template ships TypeScript by default, and Expo templates are TypeScript-first. The payoff in a mobile codebase is huge because refactors ripple across dozens of screens, and a wrong navigation param or a renamed API surface fails loudly in the editor instead of silently at runtime on a user's device.</p>

<h3>Why tsc does NOT emit</h3>
<p>Historically TypeScript both checked types AND compiled to JS. In RN that second job is handed to <strong>Babel</strong> (via <code>metro-react-native-babel-preset</code> / <code>babel-preset-expo</code>, which include <code>@babel/preset-typescript</code>). Babel is faster, integrates with Metro's transform pipeline, and handles the RN-specific transforms (JSX, Flow/TS stripping, Reanimated plugin, etc.). But Babel's TypeScript support works <strong>one file at a time</strong> and simply <em>deletes</em> the type annotations — it performs zero type checking, has no cross-file knowledge, and cannot see whether a type is actually correct. So the division of labor is:</p>
<ul>
  <li><strong>Babel</strong> — strips types, transpiles, and emits the JS that Metro bundles and Hermes runs. Fast, per-file, type-blind.</li>
  <li><strong>tsc</strong> — reads the whole program, checks every type, emits nothing (<code>noEmit: true</code>). Slower, whole-program, type-aware.</li>
</ul>
<p>(This is the exact reason you run a separate <code>npx tsc --noEmit</code> in CI: Metro will happily bundle code with type errors, because Babel never asked tsc's opinion. See the babel topic for the transform-pipeline detail.)</p>

<h3>Why a separate linter and formatter</h3>
<p>People conflate the three tools. They are orthogonal:</p>
<table>
  <thead><tr><th>Tool</th><th>Question it answers</th><th>Config file</th></tr></thead>
  <tbody>
    <tr><td>tsc</td><td>"Do the <em>types</em> line up?"</td><td>tsconfig.json</td></tr>
    <tr><td>ESLint</td><td>"Is this a <em>bug or bad pattern</em>?" (unused var, missing dep, <code>==</code>)</td><td>eslint.config.js / .eslintrc</td></tr>
    <tr><td>Prettier</td><td>"Is the <em>whitespace</em> consistent?"</td><td>.prettierrc</td></tr>
  </tbody>
</table>
<p>You want all three because they catch disjoint problem classes. A missing <code>useEffect</code> dependency is invisible to tsc (types are fine) and to Prettier (formatting is fine) — only ESLint's <code>react-hooks/exhaustive-deps</code> rule sees it. Conversely a wrong prop type is invisible to ESLint but caught by tsc.</p>

<h3>Why Git hooks</h3>
<p><code>husky</code> + <code>lint-staged</code> move these checks to <strong>commit time</strong> so broken code never enters history. The classic setup: on <code>pre-commit</code>, run Prettier + ESLint <code>--fix</code> on only the staged files, and run <code>tsc --noEmit</code> on the whole project. This is the local mirror of what CI enforces, so you fail in 3 seconds on your machine instead of 6 minutes in the pipeline.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "two pipelines" picture — the single most important diagram here</h3>
<div class="diagram">
<pre>
                 your .ts / .tsx source
                          │
        ┌─────────────────┴──────────────────┐
        │                                    │
   RUNTIME PIPELINE                      CHECK PIPELINE
   (makes the app)                       (makes you correct)
        │                                    │
   Babel (@babel/preset-typescript)      tsc  (tsconfig.json)
        │  STRIPS types, no checking          │  reads whole program
        ▼                                    ▼  checks every type
   Metro bundles JS                       noEmit: true → emits NOTHING
        │                                    │
        ▼                                    ▼
   Hermes runs it                        errors in editor / CI only
        │                                    │
        └── app runs even with ───────────────┘
              type errors!   ◄── the gap that confuses everyone
</pre>
</div>
<p>Read the arrows: the left pipeline never consults the right. That is why <em>"red squiggles but the app runs"</em> and <em>"app crashes but tsc was green"</em> are both normal.</p>

<h3>The "path alias must be declared twice" picture</h3>
<div class="diagram">
<pre>
   import Button from '@/components/Button'
                    │
      ┌──────────────┴───────────────┐
      │                              │
  tsconfig.json paths           babel.config.js
  "@/*": ["src/*"]              module-resolver alias
      │                              │
  tsc + VS Code resolve         Metro rewrites at build
  the import (RED squiggle       (module actually FOUND
   gone, autocomplete works)      at runtime)
      │                              │
      └── BOTH needed ── miss one ── ┘
           │                    │
     miss babel:            miss tsconfig:
     "Unable to resolve     editor red squiggle +
      module @/components"   no autocomplete, but
      at runtime            app runs fine
</pre>
</div>

<h3>The "who catches what" picture</h3>
<div class="diagram">
<pre>
  bug class                       caught by
  ─────────                       ─────────
  wrong prop type            →    tsc
  unused variable            →    ESLint (@typescript-eslint/no-unused-vars)
  missing useEffect dep      →    ESLint (react-hooks/exhaustive-deps)
  inline style object        →    ESLint (react-native/no-inline-styles)
  == instead of ===          →    ESLint (eqeqeq)
  double quotes vs single    →    Prettier
  trailing whitespace        →    Prettier
  crash on undefined at run  →    NONE of them (that's a runtime test)
</pre>
</div>

<h3>The config-file family tree</h3>
<div class="diagram">
<pre>
  tsconfig.json ──extends──► @react-native/typescript-config  (bare RN)
                            expo/tsconfig.base                (Expo)
  declarations.d.ts / *.d.ts  (ambient modules: png, svg, env)
  eslint.config.js ──uses──► @react-native/eslint-config      (bare RN)
                            eslint-config-expo                (Expo)
                            eslint-config-prettier            (turns off clashes)
  .prettierrc
  .husky/pre-commit ──runs──► lint-staged ──► eslint --fix, prettier, tsc
</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"If <code>tsc</code> passes, my app is type-safe at runtime." No. Types are erased by Babel before the code ever runs — there is <strong>zero</strong> runtime type enforcement. A JSON response typed as <code>User</code> can be anything at runtime; tsc only checked that your code <em>treats</em> it as a User. For real boundaries (API responses, deep links) validate with a runtime schema library (zod, io-ts) — the type is just a compile-time promise.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>File 1 — tsconfig.json (bare React Native)</h3>
<p>The RN template keeps this tiny by extending a shared base. <code>@react-native/typescript-config</code> ships the RN-correct defaults (Hermes lib, JSX mode, strictness):</p>
<pre><code class="language-json">// tsconfig.json  (bare RN, 0.71+)
{
  "extends": "@react-native/typescript-config/tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"]
    }
  },
  "include": ["src", "index.js", "declarations.d.ts", ".eslintrc.js"],
  "exclude": ["node_modules", "babel.config.js", "metro.config.js"]
}</code></pre>

<h3>File 1 — tsconfig.json (Expo, managed / prebuild)</h3>
<pre><code class="language-json">// tsconfig.json  (Expo SDK 50+)
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts"
  ]
}</code></pre>
<p>Two Expo-specific things: <code>.expo/types/**</code> holds generated types for <strong>Expo Router</strong>'s typed routes, and <code>expo-env.d.ts</code> is a generated ambient file — never edit it, and keep it in <code>include</code>. You get a starter with <code>expo customize tsconfig.json</code>.</p>

<h3>The compilerOptions that matter in RN</h3>
<table>
  <thead><tr><th>Option</th><th>RN value</th><th>Why</th></tr></thead>
  <tbody>
    <tr><td><code>strict</code></td><td><code>true</code></td><td>Turns on <code>strictNullChecks</code>, <code>noImplicitAny</code>, etc. Non-negotiable for a real app.</td></tr>
    <tr><td><code>jsx</code></td><td><code>react-native</code></td><td>Preserves JSX as-is for Metro/Babel to transform (unlike <code>react-jsx</code> which emits calls). RN-specific.</td></tr>
    <tr><td><code>moduleResolution</code></td><td><code>bundler</code> (or <code>node</code>)</td><td><code>bundler</code> matches how Metro resolves (supports <code>package.json</code> <code>exports</code>). Older templates used <code>node</code>.</td></tr>
    <tr><td><code>noEmit</code></td><td><code>true</code></td><td>tsc checks only; Babel emits. THE key RN setting.</td></tr>
    <tr><td><code>baseUrl</code> + <code>paths</code></td><td><code>.</code> + aliases</td><td>Path aliases. MUST mirror babel <code>module-resolver</code>.</td></tr>
    <tr><td><code>esModuleInterop</code></td><td><code>true</code></td><td>Lets <code>import React from 'react'</code> work with CommonJS default interop.</td></tr>
    <tr><td><code>allowJs</code></td><td><code>true</code></td><td>Lets tsc see <code>.js</code> files (mixed codebases, JS config).</td></tr>
    <tr><td><code>skipLibCheck</code></td><td><code>true</code></td><td>Skips type-checking <code>node_modules/**/*.d.ts</code>. Huge speed + avoids third-party type clashes.</td></tr>
    <tr><td><code>types</code> / <code>typeRoots</code></td><td>e.g. <code>["react-native", "jest"]</code></td><td>Which global ambient type packages to include.</td></tr>
    <tr><td><code>resolveJsonModule</code></td><td><code>true</code></td><td>Lets you <code>import data from './x.json'</code> typed.</td></tr>
  </tbody>
</table>

<h3>Why paths must mirror babel — the exact mechanism</h3>
<p><code>tsconfig.json</code> <code>paths</code> is <strong>type-checking only</strong>. It tells tsc and your editor "when you see <code>@/foo</code>, resolve it to <code>src/foo</code> for the purpose of checking types." It does <strong>NOT</strong> rewrite the import in the output — remember, tsc emits nothing. At runtime the string <code>'@/foo'</code> is literally handed to Metro, which has no idea what <code>@</code> means unless you also teach Babel:</p>
<pre><code class="language-js">// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'], // or 'module:metro-react-native-babel-preset'
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@hooks': './src/hooks'
          },
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json']
        }
      ]
      // reanimated plugin stays LAST if present
    ]
  };
};</code></pre>
<p>Keep the two alias maps byte-for-byte in sync. The babel-plugin does the real work (rewriting <code>@/foo</code> to a real path during the Metro transform); tsconfig <code>paths</code> only quiets the editor and lets <code>tsc --noEmit</code> succeed.</p>

<h3>File 2 — declaration files (.d.ts) for non-code imports</h3>
<p>Metro (via transformers) lets you <code>import</code> a PNG, an SVG, or an env var — but tsc doesn't know those imports have a type, so it errors "Cannot find module './logo.png'." You silence that with <strong>ambient module declarations</strong>. Put them in a project-root <code>declarations.d.ts</code> (any name works as long as it's in <code>include</code>):</p>
<pre><code class="language-ts">// declarations.d.ts

// Static image assets (Metro asset registry returns a number/opaque type)
declare module '*.png';
declare module '*.jpg';
declare module '*.webp';

// SVGs via react-native-svg-transformer → each becomes a React component
declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC&lt;SvgProps&gt;;
  export default content;
}

// Env vars via react-native-config
declare module 'react-native-config' {
  export interface NativeConfig {
    API_URL: string;
    SENTRY_DSN?: string;
  }
  export const Config: NativeConfig;
  export default Config;
}

// Env vars via babel-plugin-dotenv-import / @env
declare module '@env' {
  export const API_URL: string;
  export const STAGE: 'uat' | 'prod';
}</code></pre>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — SVG and env look different in managed projects</div>
  <p>In Expo you don't hand-configure <code>react-native-svg-transformer</code> in <code>metro.config.js</code> the same way, and instead of <code>react-native-config</code> you typically use <code>process.env.EXPO_PUBLIC_*</code> (statically inlined at build) or values from <code>expo-constants</code> (<code>Constants.expoConfig.extra</code>). <code>EXPO_PUBLIC_</code> vars are typed via <code>expo-env.d.ts</code> automatically — you generally do NOT hand-write <code>declare module '@env'</code>. And because Expo prebuild regenerates native folders, any ambient <code>.d.ts</code> you add stays safe (it's JS-side), but Metro transformer config belongs in <code>metro.config.js</code>, which Expo owns via <code>@expo/metro-config</code>.</p>
</div>

<h3>Extending third-party types via .d.ts (navigation is the classic)</h3>
<p>React Navigation lets you make <code>navigation.navigate('Screen', params)</code> fully typed by <strong>declaration merging</strong> into its global namespace — a <code>.d.ts</code> that augments an existing module:</p>
<pre><code class="language-ts">// navigation.d.ts
import type { StackParamList } from './src/navigation/types';

declare global {
  namespace ReactNavigation {
    interface RootParamList extends StackParamList {}
  }
}
export {};</code></pre>
<p>Now every <code>useNavigation()</code> across the app is typed with your routes and no explicit generic. The <code>export {};</code> makes the file a module so <code>declare global</code> is legal. These files go anywhere inside <code>include</code>; <code>typeRoots</code> only matters if you ship types as a fake package under <code>node_modules/@types</code>-style folders (rare in apps).</p>

<h3>File 3 — ESLint (flat config, the modern default)</h3>
<p>ESLint 9 defaults to <strong>flat config</strong> — a single <code>eslint.config.js</code> exporting an array. The bare-RN shared config is <code>@react-native/eslint-config</code>; Expo ships <code>eslint-config-expo</code>:</p>
<pre><code class="language-js">// eslint.config.js  (Expo, flat config)
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', 'android/*', 'ios/*'],
    rules: {
      'react-native/no-inline-styles': 'warn',
      'react-hooks/exhaustive-deps': 'warn'
    }
  }
]);</code></pre>
<p>The legacy equivalent (still very common, ESLint 8 and RN template pre-0.74) is <code>.eslintrc.js</code>:</p>
<pre><code class="language-js">// .eslintrc.js  (legacy)
module.exports = {
  root: true,
  extends: '@react-native',   // = @react-native/eslint-config
  rules: {
    'react-native/no-inline-styles': 'warn',
    'react-hooks/exhaustive-deps': 'warn'
  }
};</code></pre>
<p>The <code>@react-native</code> preset already bundles the plugins you need: <code>eslint-plugin-react</code>, <code>eslint-plugin-react-hooks</code> (this is where <code>rules-of-hooks</code> and <code>exhaustive-deps</code> live), <code>eslint-plugin-react-native</code>, <code>@typescript-eslint/eslint-plugin</code> + parser, and <code>eslint-plugin-import</code>. <code>eslint-config-universe</code> (used by older Expo) is the same idea. Ignore files go in <code>.eslintignore</code> (legacy) or the <code>ignores</code> key (flat).</p>

<h3>The RN-specific ESLint rules to name</h3>
<ul>
  <li><code>react-hooks/exhaustive-deps</code> — warns when a <code>useEffect</code>/<code>useCallback</code>/<code>useMemo</code> dependency array omits a referenced value. The most valuable RN lint rule; stale-closure bugs die here.</li>
  <li><code>react-hooks/rules-of-hooks</code> — errors on conditionally-called hooks.</li>
  <li><code>react-native/no-inline-styles</code> — flags <code>style={{...}}</code> literals (re-created every render → GC pressure).</li>
  <li><code>react-native/no-unused-styles</code> — flags <code>StyleSheet.create</code> keys nobody uses.</li>
  <li><code>react-native/no-color-literals</code>, <code>react-native/split-platform-components</code> — RN hygiene.</li>
  <li><code>@typescript-eslint/no-unused-vars</code>, <code>@typescript-eslint/no-explicit-any</code> — TS hygiene.</li>
</ul>

<h3>File 4 — Prettier and its ESLint integration</h3>
<pre><code class="language-json">// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "all",
  "arrowParens": "avoid",
  "printWidth": 100,
  "semi": true,
  "bracketSameLine": false
}</code></pre>
<p>The catch: ESLint has some <em>stylistic</em> rules that overlap Prettier (quotes, semicolons). If both are on, they fight — ESLint wants one thing, Prettier undoes it. The fix is <strong><code>eslint-config-prettier</code></strong>: add it LAST in your extends/array and it <em>turns off</em> every ESLint rule that Prettier already handles. Now ESLint owns correctness, Prettier owns formatting, no overlap. (Do NOT confuse it with <code>eslint-plugin-prettier</code>, which runs Prettier <em>as</em> a lint rule — popular but slower and noisier; the config-only approach is generally preferred.)</p>
<pre><code class="language-js">// legacy .eslintrc.js — prettier LAST so it wins the "turn off" war
module.exports = {
  extends: ['@react-native', 'prettier'] // 'prettier' = eslint-config-prettier
};</code></pre>

<h3>File 5 — Git hooks: husky + lint-staged</h3>
<pre><code class="language-json">// package.json
{
  "scripts": {
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml}": ["prettier --write"]
  }
}</code></pre>
<pre><code class="language-bash"># .husky/pre-commit
npx lint-staged
npx tsc --noEmit</code></pre>
<p>Design choice: <code>lint-staged</code> runs ESLint + Prettier only on the <strong>staged</strong> files (fast, and it re-stages the auto-fixes), while <code>tsc --noEmit</code> runs on the <strong>whole project</strong> — because a type error is rarely confined to the file you touched (rename a type in <code>A.ts</code> and <code>Z.tsx</code> breaks). You can't meaningfully type-check "just staged files" without whole-program context.</p>

<h3>Running the checks in CI</h3>
<pre><code class="language-bash"># typical CI job
npm ci
npm run typecheck   # tsc --noEmit  → the thing Metro never does
npm run lint        # eslint .      (Expo: expo lint)
npx prettier --check .</code></pre>
<p>Note <code>prettier --check</code> (verify, exit non-zero on drift) in CI vs <code>--write</code> (mutate) locally. Expo wraps linting as <code>expo lint</code>, which installs/config-bootstraps ESLint for you on first run.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — the minimal RN tsconfig that extends the base</h3>
<pre><code class="language-json">{
  "extends": "@react-native/typescript-config/tsconfig.json",
  "compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["src/*"] } },
  "include": ["src", "index.js"]
}</code></pre>
<p>Everything strict/JSX/lib-related is inherited; you only add <code>paths</code>.</p>

<h3>Example 2 — a path alias that works in tsc but crashes at runtime</h3>
<pre><code class="language-ts">// tsconfig.json HAS  "@/utils/*": ["src/utils/*"]
// babel.config.js has NO module-resolver alias
import { formatDate } from '@/utils/date'; // ✅ green in VS Code, ✅ tsc passes
// at runtime: Error: Unable to resolve module @/utils/date</code></pre>
<p>The fix is not in tsconfig (that's already correct) — it's adding the matching alias to <code>module-resolver</code> in babel.config.js, then restarting Metro with <code>--reset-cache</code>.</p>

<h3>Example 3 — the reverse: runs fine, red squiggle in editor</h3>
<pre><code class="language-ts">// babel module-resolver HAS the alias, tsconfig paths does NOT
import Button from '@components/Button'; // ❌ TS2307 red squiggle, no autocomplete
// but the app runs perfectly because Babel rewrote it
</code></pre>
<p>Fix: add the alias to tsconfig <code>paths</code>. Same lesson, mirrored — both files always.</p>

<h3>Example 4 — SVG-as-component declaration in action</h3>
<pre><code class="language-ts">// declarations.d.ts →  declare module '*.svg' { ... default React.FC&lt;SvgProps&gt; }
import Logo from '../assets/logo.svg';
// now typed as a component:
&lt;Logo width={120} height={40} fill="#E5860B" /&gt;</code></pre>

<h3>Example 5 — typed env with react-native-config</h3>
<pre><code class="language-ts">import Config from 'react-native-config';
const url: string = Config.API_URL;          // typed via the .d.ts augmentation
fetch(url + '/health');</code></pre>

<h3>Example 6 — the red-squiggle-but-runs classic (type error is NOT a runtime error)</h3>
<pre><code class="language-ts">const user = { name: 'Prakhar' };
console.log(user.age.toFixed(2)); // TS: 'age' does not exist  ← squiggle
// Babel strips the types → at runtime this THROWS
//   TypeError: Cannot read property 'toFixed' of undefined
</code></pre>
<p>Here tsc was RIGHT and warned you — but note the app still <em>built and launched</em>; the type check is advisory unless CI gates on it. Metro bundled it regardless.</p>

<h3>Example 7 — the exhaustive-deps warning that's a real bug</h3>
<pre><code class="language-ts">useEffect(() =&gt; {
  fetchBookings(userId);         // uses userId
}, []);                          // ⚠ react-hooks/exhaustive-deps: missing 'userId'
// Bug: when userId changes, the effect does NOT re-run → stale data.
// Fix: }, [userId]);  or genuinely justify the empty array.</code></pre>

<h3>Example 8 — silencing a node_modules type error with skipLibCheck</h3>
<pre><code class="language-json">// a third-party lib ships broken .d.ts → tsc errors inside node_modules
{ "compilerOptions": { "skipLibCheck": true } }
// now tsc trusts library declarations without re-checking them</code></pre>

<h3>Example 9 — eslint-config-prettier disabling the quote war</h3>
<pre><code class="language-js">// WITHOUT eslint-config-prettier:
//   ESLint 'quotes' rule: wants "double"
//   Prettier: rewrites to 'single'  → infinite fix loop / CI flip-flop
// WITH it (added last):  ESLint stops enforcing quotes → Prettier alone decides
module.exports = { extends: ['@react-native', 'prettier'] };</code></pre>

<h3>Example 10 — navigation param augmentation making navigate() typed</h3>
<pre><code class="language-ts">// after the declare global ReactNavigation.RootParamList merge:
navigation.navigate('BookingDetails', { bookingId: '42' }); // ✅ params typed
navigation.navigate('BookingDetails');                       // ❌ TS: missing bookingId</code></pre>

<h3>Example 11 — lint-staged config that only touches staged files</h3>
<pre><code class="language-json">"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
}
// commit 2 files → ESLint/Prettier run on those 2, not the whole repo.
// tsc --noEmit still runs whole-project in the pre-commit hook separately.</code></pre>

<h3>Example 12 — Expo type-checking + lint commands</h3>
<pre><code class="language-bash">npx tsc --noEmit          # type-check (no Expo wrapper needed)
npx expo customize tsconfig.json   # scaffold/refresh the tsconfig
npx expo lint             # bootstraps eslint-config-expo + runs eslint</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Alias in tsconfig but not babel (or vice-versa)</h3>
<p>The number-one config bug. tsconfig <code>paths</code> = editor/tsc only; babel <code>module-resolver</code> = runtime. You need both, kept identical. Symptom-to-cause: "Unable to resolve module" at runtime → babel missing; TS2307 red squiggle but app runs → tsconfig missing.</p>

<h3>2. Metro caches the old alias</h3>
<p>After editing <code>babel.config.js</code> you MUST restart Metro with <code>npx react-native start --reset-cache</code> (or <code>expo start -c</code>). Babel transforms are cached; a new alias won't apply until the cache is cleared.</p>

<h3>3. tsc is green, the app crashes anyway</h3>
<p>Types are erased at runtime. A network response typed <code>User</code> can be <code>null</code> or malformed and tsc never knew. Validate external data at the boundary (zod / manual guards). Type ≠ runtime guarantee.</p>

<h3>4. Red squiggle, app runs fine</h3>
<p>Babel stripped the types and ran the code; tsc's complaint is advisory unless CI gates on it. Common with a missing <code>.d.ts</code> for an asset import — the import works via Metro's asset plugin, tsc just lacks the ambient declaration.</p>

<h3>5. skipLibCheck hides YOUR bugs too</h3>
<p><code>skipLibCheck: true</code> skips ALL <code>.d.ts</code> — including your own hand-written ones. A typo in <code>declarations.d.ts</code> won't be reported. It's a pragmatic speed/compat tradeoff, not free.</p>

<h3>6. moduleResolution mismatch with Metro</h3>
<p>If tsc uses <code>node</code> but a library only exposes types via <code>package.json</code> <code>exports</code>, tsc can't find them while Metro can. Switching to <code>moduleResolution: "bundler"</code> aligns tsc with Metro's resolver. Reverse mismatches also happen — keep tsc and Metro on the same resolution model.</p>

<h3>7. include / exclude too narrow</h3>
<p>If a <code>.d.ts</code> file isn't under <code>include</code>, its <code>declare module</code> is invisible and you still get "Cannot find module '*.svg'." Root-level ambient files must be explicitly included (that's why templates list <code>declarations.d.ts</code>).</p>

<h3>8. exhaustive-deps false "positives"</h3>
<p>Sometimes you intentionally want an effect to run once. Silence with a scoped <code>// eslint-disable-next-line react-hooks/exhaustive-deps</code> AND a comment saying why — never disable the rule globally. Most "false positives" are real stale-closure bugs in disguise.</p>

<h3>9. Flat config vs legacy config resolution</h3>
<p>ESLint 9 looks for <code>eslint.config.js</code> first and ignores <code>.eslintrc*</code> unless you set <code>ESLINT_USE_FLAT_CONFIG=false</code>. Mixing both silently drops one. RN 0.74+ / Expo SDK 51+ moved to flat; older projects are still <code>.eslintrc</code>.</p>

<h3>10. Prettier vs ESLint stylistic clash</h3>
<p>Without <code>eslint-config-prettier</code>, ESLint's <code>quotes</code>/<code>semi</code>/<code>comma-dangle</code> fight Prettier — CI flip-flops on formatting. Always add <code>eslint-config-prettier</code> LAST to disable the overlapping rules.</p>

<h3>11. tsc --noEmit is slow on big apps</h3>
<p>Whole-program check can take 30–90s. Speed levers: <code>skipLibCheck: true</code>, <code>incremental: true</code> (writes a <code>.tsbuildinfo</code> cache), splitting into project references, or <code>tsc --noEmit --incremental</code>. Don't put full whole-project tsc inside <code>lint-staged</code> per-file globs — run it once in the hook.</p>

<h3>12. husky "prepare" not running</h3>
<p><code>husky</code> installs hooks via the <code>prepare</code> npm lifecycle script. If a teammate cloned before that script existed, hooks silently don't run. Symptom: bad code gets committed despite the config. Re-run <code>npm install</code> / <code>npx husky init</code>. Hooks also don't run with <code>git commit --no-verify</code>.</p>

<h3>13. Expo expo-env.d.ts / .expo/types getting deleted</h3>
<p>These are GENERATED. If they vanish (fresh clone, cleaned) you get transient type errors until <code>npx expo start</code> regenerates them. Keep them in <code>include</code>; don't commit-ignore <code>expo-env.d.ts</code> if your CI type-checks before starting Expo.</p>

<h3>14. allowJs surfaces node_modules noise</h3>
<p>Turning on <code>allowJs</code> without <code>checkJs: false</code> can pull JS files into checking. Combined with a loose <code>include</code>, tsc may start type-checking config files you didn't intend. Scope <code>include</code> tightly.</p>

<h3>15. Global .d.ts vs module .d.ts</h3>
<p>A <code>.d.ts</code> with a top-level <code>import</code>/<code>export</code> becomes a MODULE — its <code>declare module '*.svg'</code> then only applies if imported, surprising people. For truly global ambient declarations keep the file free of top-level import/export, OR wrap globals in <code>declare global { } export {};</code>.</p>

<h3>16. Path alias breaks Jest</h3>
<p>Jest doesn't read babel <code>module-resolver</code> the same way for module <em>resolution</em> unless configured. You often need a matching <code>moduleNameMapper</code> in <code>jest.config.js</code> mirroring the SAME aliases — so an alias can live in THREE places (tsconfig, babel, jest).</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — declaring a path alias in only one file</h3>
<p>tsconfig <code>paths</code> without babel <code>module-resolver</code> (or the reverse). Type-checks but crashes at runtime, or runs but shows red imports. Always mirror; add to Jest's <code>moduleNameMapper</code> too.</p>

<h3>Anti-pattern 2 — believing tsc guarantees runtime safety</h3>
<p>Types are erased. Trusting an unvalidated API response because it's "typed <code>User</code>" ships crashes. Validate boundaries at runtime (zod). A type is a promise, not a check.</p>

<h3>Anti-pattern 3 — disabling exhaustive-deps globally</h3>
<p>Turning off <code>react-hooks/exhaustive-deps</code> repo-wide to "stop the noise" removes your best stale-closure detector. Fix the deps, or disable per-line with a justifying comment.</p>

<h3>Anti-pattern 4 — <code>any</code> everywhere to silence tsc</h3>
<p>Casting to <code>any</code> (or <code>@ts-ignore</code> without explanation) defeats the whole point. Prefer <code>unknown</code> + narrowing, or a real type. Enforce with <code>@typescript-eslint/no-explicit-any</code>.</p>

<h3>Anti-pattern 5 — no eslint-config-prettier</h3>
<p>Letting ESLint and Prettier both enforce quotes/semis. CI flip-flops, PR diffs churn. Add <code>eslint-config-prettier</code> last; let Prettier own formatting.</p>

<h3>Anti-pattern 6 — running full tsc per-file in lint-staged</h3>
<p><code>tsc</code> needs whole-program context; feeding it single staged files misses cross-file errors or is meaningless. Run whole-project <code>tsc --noEmit</code> once in the pre-commit hook, not inside the per-glob lint-staged command.</p>

<h3>Anti-pattern 7 — committing generated Expo type files as source of truth</h3>
<p>Editing <code>expo-env.d.ts</code> or <code>.expo/types/*</code> by hand. They're regenerated and your edits vanish. Configure via <code>app.json</code>/<code>app.config.js</code> and let Expo emit the types.</p>

<h3>Anti-pattern 8 — skipLibCheck: false on a big app "for safety"</h3>
<p>Turning it off drags in every third-party <code>.d.ts</code>, exploding check time and surfacing errors you can't fix (they're in node_modules). <code>skipLibCheck: true</code> is the RN norm.</p>

<h3>Anti-pattern 9 — mixing flat and legacy ESLint config</h3>
<p>Keeping both <code>eslint.config.js</code> and <code>.eslintrc.js</code>. ESLint 9 silently uses only flat; your legacy rules quietly stop applying. Pick one for your ESLint version.</p>

<h3>Anti-pattern 10 — forgetting --reset-cache after babel changes</h3>
<p>New <code>module-resolver</code> alias not taking effect, then "fixing" it randomly. Metro cached the old transform. <code>--reset-cache</code> / <code>expo start -c</code>.</p>

<h3>Anti-pattern 11 — no CI type-check because "the app builds"</h3>
<p>Metro/Babel build ignores type errors entirely. Without a <code>tsc --noEmit</code> CI gate, type errors merge freely and rot. The build passing means nothing about types.</p>

<h3>Anti-pattern 12 — inline styles everywhere</h3>
<p>Ignoring <code>react-native/no-inline-styles</code>. Inline <code>style={{...}}</code> objects re-allocate each render and can defeat memoization. Hoist to <code>StyleSheet.create</code> (and <code>no-unused-styles</code> keeps that tidy).</p>

<h3>Anti-pattern 13 — putting huge types in a wrongly-scoped .d.ts</h3>
<p>A <code>.d.ts</code> outside <code>include</code>, or one that accidentally became a module via a stray import, so its ambient <code>declare module '*.svg'</code> silently doesn't apply. Keep global ambient files import/export-free and inside <code>include</code>.</p>

<h3>Anti-pattern 14 — bypassing hooks with --no-verify as a habit</h3>
<p><code>git commit --no-verify</code> to "just commit real quick" routinely defeats husky. Occasional use is fine; as a habit it lets unformatted, un-linted, type-broken code into history — exactly what the hook prevents.</p>

<h3>Anti-pattern 15 — copying a web tsconfig (jsx: react-jsx, dom lib)</h3>
<p>Using a Create-React-App-style tsconfig with <code>"jsx": "react-jsx"</code> and <code>"lib": ["dom"]</code> in RN. You want <code>jsx: react-native</code> and the RN lib set (no DOM) — extend <code>@react-native/typescript-config</code> or <code>expo/tsconfig.base</code> instead of hand-rolling.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. In an RN project, what compiles your TypeScript — tsc or Babel? What does the other one do?</div>
  <div class="qa-answer">
    <p><strong>Babel compiles it</strong> (via <code>@babel/preset-typescript</code> inside <code>metro-react-native-babel-preset</code> / <code>babel-preset-expo</code>) — it strips the type annotations one file at a time and emits the JS Metro bundles for Hermes. It does <em>zero</em> type checking. <strong>tsc</strong> is run separately with <code>noEmit: true</code> (or <code>tsc --noEmit</code>) purely to type-check the whole program; it emits nothing. So they're two independent pipelines: Babel makes the app, tsc makes you correct.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Why does <code>noEmit: true</code> appear in an RN tsconfig?</div>
  <div class="qa-answer">
    <p>Because Babel already emits the runtime JS. If tsc also emitted, you'd have two compilers producing output and they'd conflict. <code>noEmit</code> tells tsc "only check types, produce no files." That's why type-checking is a distinct CI step (<code>npx tsc --noEmit</code>) — Metro/Babel will happily bundle code with type errors.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. You added <code>"@/*": ["src/*"]</code> to tsconfig paths, VS Code is happy, but the app crashes with "Unable to resolve module @/foo". Why?</div>
  <div class="qa-answer">
    <p>tsconfig <code>paths</code> only affects tsc and the editor — it does NOT rewrite imports at runtime, because tsc emits nothing. Metro receives the literal string <code>'@/foo'</code> and doesn't know the alias. You must ALSO add the matching alias to <code>babel-plugin-module-resolver</code> in <code>babel.config.js</code>, then restart Metro with <code>--reset-cache</code>. Aliases live in both files (and often Jest's <code>moduleNameMapper</code> too).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. "There are red squiggles in my editor but the app runs perfectly." Explain.</div>
  <div class="qa-answer">
    <p>Type errors are not runtime errors. Babel strips types and runs the code regardless of what tsc thinks, so an editor/tsc complaint (say a missing <code>.d.ts</code> for an asset import) doesn't stop the bundle. The inverse is also true: tsc can be green while the app crashes, because types are erased and provide no runtime guarantee. Type-checking is advisory unless CI gates on it.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. How do you make <code>import Logo from './logo.svg'</code> or <code>import img from './x.png'</code> type-check?</div>
  <div class="qa-answer">
    <p>Add an ambient module declaration in a <code>.d.ts</code> that's inside <code>include</code>: <code>declare module '*.png';</code> for assets, and for SVG-as-component (react-native-svg-transformer) a <code>declare module '*.svg'</code> exporting a <code>React.FC&lt;SvgProps&gt;</code>. Metro's transformer handles the actual import at build time; the <code>.d.ts</code> only tells tsc the import has a type.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. What does <code>skipLibCheck</code> do and why is it on in most RN projects?</div>
  <div class="qa-answer">
    <p>It tells tsc to skip type-checking the <code>.d.ts</code> files in <code>node_modules</code> (and all declaration files). RN apps pull in dozens of libraries with imperfect or mutually-conflicting types; without <code>skipLibCheck</code> tsc reports errors you can't fix and check time balloons. Tradeoff: it also skips YOUR own <code>.d.ts</code>, so a typo in your declarations won't be caught.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. ESLint vs Prettier vs TypeScript — who owns what, and how do you stop ESLint and Prettier fighting?</div>
  <div class="qa-answer">
    <p>tsc = type correctness; ESLint = bug/pattern rules (unused vars, hook deps, no-inline-styles); Prettier = whitespace/quotes/commas. ESLint and Prettier overlap on stylistic rules and will fight (CI flip-flops). Fix: add <strong><code>eslint-config-prettier</code></strong> last in your config — it disables every ESLint rule Prettier already handles, so ESLint owns correctness and Prettier owns formatting.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. What's the single most valuable RN-specific ESLint rule and why?</div>
  <div class="qa-answer">
    <p><code>react-hooks/exhaustive-deps</code>. It warns when a <code>useEffect</code>/<code>useCallback</code>/<code>useMemo</code> dependency array omits a value the callback reads — the classic stale-closure bug where an effect doesn't re-run when it should. tsc can't see it (types are fine) and Prettier can't (formatting is fine); only this rule catches it. Also <code>react-hooks/rules-of-hooks</code> and <code>react-native/no-inline-styles</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Flat config vs legacy .eslintrc — what changed?</div>
  <div class="qa-answer">
    <p>ESLint 9 (and RN 0.74+ / newer Expo) default to <strong>flat config</strong>: a single <code>eslint.config.js</code> exporting an array of config objects, using <code>ignores</code> instead of <code>.eslintignore</code> and importing shareable configs directly (<code>eslint-config-expo/flat</code>). Legacy <code>.eslintrc.js</code> uses <code>extends: '@react-native'</code>. ESLint 9 ignores <code>.eslintrc</code> when a flat config exists — don't keep both.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. How do you make React Navigation's <code>navigate()</code> fully typed globally?</div>
  <div class="qa-answer">
    <p>Declaration merging in a <code>.d.ts</code>: augment the library's global namespace — <code>declare global { namespace ReactNavigation { interface RootParamList extends MyParamList {} } }</code> plus <code>export {};</code> to make it a module. After that every <code>useNavigation()</code> across the app knows your routes and their params without passing a generic each time.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Walk me through a husky + lint-staged pre-commit setup for an RN app.</div>
  <div class="qa-answer">
    <p>Install husky, add a <code>prepare: "husky"</code> script so hooks install on <code>npm install</code>. A <code>.husky/pre-commit</code> runs <code>npx lint-staged</code> (which runs <code>eslint --fix</code> + <code>prettier --write</code> on ONLY the staged files and re-stages the fixes) and then <code>npx tsc --noEmit</code> on the WHOLE project — because type errors span files, you can't check "just staged." CI mirrors this with <code>typecheck</code>, <code>lint</code>, and <code>prettier --check</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Why run <code>tsc --noEmit</code> on the whole project but ESLint only on staged files in lint-staged?</div>
  <div class="qa-answer">
    <p>ESLint is per-file — it evaluates each file mostly in isolation, so linting only the changed files is correct and fast. TypeScript is whole-program — renaming a type in one file breaks consumers elsewhere, so checking "just the staged file" would miss those errors. Hence lint-staged runs ESLint/Prettier per staged file, and the hook runs one whole-project <code>tsc --noEmit</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. What are <code>moduleResolution: "bundler"</code> and <code>jsx: "react-native"</code> and why those values in RN?</div>
  <div class="qa-answer">
    <p><code>moduleResolution: "bundler"</code> makes tsc resolve modules the way Metro does — honoring <code>package.json</code> <code>exports</code> — so tsc finds the same types Metro finds at build (older templates used <code>node</code>). <code>jsx: "react-native"</code> tells tsc to leave JSX untouched for Babel/Metro to transform, rather than emitting <code>React.createElement</code> calls itself (<code>react-jsx</code>) — appropriate because tsc emits nothing here.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. How does the Expo TypeScript/lint story differ from bare RN?</div>
  <div class="qa-answer">
    <p>Expo extends <code>expo/tsconfig.base</code> (vs <code>@react-native/typescript-config</code>), generates <code>expo-env.d.ts</code> and <code>.expo/types</code> for typed env vars and Expo Router routes (never hand-edit them), uses <code>eslint-config-expo</code>, and wraps setup as <code>expo lint</code> and <code>expo customize tsconfig.json</code>. Env vars are <code>EXPO_PUBLIC_*</code> (statically inlined) or <code>Constants.expoConfig.extra</code> rather than <code>react-native-config</code>. Type-checking is still plain <code>npx tsc --noEmit</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Someone puts <code>@ts-ignore</code> or casts to <code>any</code> to make an error go away. What's your review comment?</div>
  <div class="qa-answer">
    <p>That suppresses the checker instead of fixing the problem — it hides the very class of bug TypeScript exists to catch, and it rots (the underlying type can drift and you'll never know). Prefer <code>unknown</code> + narrowing, a proper type, or <code>@ts-expect-error</code> WITH a comment explaining why (it self-removes when the error disappears). Enforce with <code>@typescript-eslint/no-explicit-any</code> and <code>ban-ts-comment</code>.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You know Babel transpiles/runs and tsc only type-checks (<code>noEmit</code>) — two separate pipelines.</li>
    <li>You explain why a path alias must be in BOTH tsconfig <code>paths</code> and babel <code>module-resolver</code> (and Jest).</li>
    <li>You can say "type error ≠ runtime error" and explain type erasure by Babel.</li>
    <li>You name <code>react-hooks/exhaustive-deps</code> as the key RN lint rule and know it catches stale closures.</li>
    <li>You separate the three tools: tsc = types, ESLint = bugs, Prettier = whitespace.</li>
    <li>You know <code>eslint-config-prettier</code> stops the ESLint/Prettier stylistic war.</li>
    <li>You can write an ambient <code>declare module '*.svg'</code> / <code>'*.png'</code> declaration.</li>
    <li>You know <code>skipLibCheck</code>, <code>moduleResolution: bundler</code>, and <code>jsx: react-native</code> and why RN uses them.</li>
    <li>You set up husky + lint-staged with per-file ESLint and whole-project <code>tsc --noEmit</code>, mirrored in CI.</li>
  </ul>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'revision', title: '⚡ Revision — Points to Remember', collapsible: true, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline"><strong>Babel transpiles and runs your code (stripping types, never checking them); tsc only type-checks with <code>noEmit</code>; ESLint finds bugs; Prettier fixes whitespace</strong> — and path aliases must be declared in BOTH <code>tsconfig paths</code> and <code>babel module-resolver</code> or they break.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Two pipelines:</strong> Babel (<code>@babel/preset-typescript</code> in <code>metro-react-native-babel-preset</code> / <code>babel-preset-expo</code>) strips types one file at a time and emits the JS Metro bundles; <strong>tsc runs separately with <code>noEmit: true</code></strong> and checks the whole program, emitting nothing. That's why CI needs a distinct <code>npx tsc --noEmit</code>.</li>
    <li><strong>tsconfig extends a base:</strong> <code>@react-native/typescript-config</code> (bare) or <code>expo/tsconfig.base</code> (Expo). You mostly add <code>baseUrl</code> + <code>paths</code>.</li>
    <li><strong>Key compilerOptions:</strong> <code>strict</code>, <code>jsx: react-native</code> (leave JSX for Babel), <code>moduleResolution: bundler</code> (match Metro / honor <code>exports</code>), <code>noEmit</code>, <code>esModuleInterop</code>, <code>allowJs</code>, <code>skipLibCheck</code> (skip node_modules .d.ts — speed + avoid third-party clashes), <code>resolveJsonModule</code>, <code>types</code>/<code>typeRoots</code>.</li>
    <li><strong>Path aliases live in TWO (often three) files:</strong> tsconfig <code>paths</code> = tsc + editor only; babel <code>module-resolver</code> = the actual runtime rewrite; Jest <code>moduleNameMapper</code> for tests. Miss babel → "Unable to resolve module" at runtime; miss tsconfig → red squiggle but app runs. Restart Metro with <code>--reset-cache</code> after babel changes.</li>
    <li><strong>Type error ≠ runtime error.</strong> Babel erases types, so tsc is advisory: red squiggles can run fine, and green tsc can still crash (validate API/deep-link boundaries at runtime with zod).</li>
    <li><strong>Declaration files (.d.ts):</strong> ambient <code>declare module '*.png'</code> for assets, <code>declare module '*.svg'</code> as <code>React.FC&lt;SvgProps&gt;</code> (react-native-svg-transformer), typed env via <code>declare module 'react-native-config'</code> or <code>'@env'</code>. Must sit inside <code>include</code>; keep global ambient files free of top-level import/export or they become modules and stop applying.</li>
    <li><strong>Extend third-party types</strong> with declaration merging — the classic is augmenting <code>ReactNavigation.RootParamList</code> so <code>navigate()</code> is globally typed.</li>
    <li><strong>ESLint = bugs/patterns.</strong> Shared config: <code>@react-native/eslint-config</code> (bare) / <code>eslint-config-expo</code> / <code>eslint-config-universe</code>. Bundles plugins: <code>react</code>, <code>react-hooks</code>, <code>react-native</code>, <code>@typescript-eslint</code>, <code>import</code>. Flat config (<code>eslint.config.js</code>, <code>ignores</code>) in ESLint 9 vs legacy <code>.eslintrc</code> + <code>.eslintignore</code> — don't keep both.</li>
    <li><strong>Rules to name:</strong> <code>react-hooks/exhaustive-deps</code> (stale-closure detector — the star), <code>rules-of-hooks</code>, <code>react-native/no-inline-styles</code>, <code>no-unused-styles</code>, <code>@typescript-eslint/no-unused-vars</code>/<code>no-explicit-any</code>.</li>
    <li><strong>Prettier = whitespace only</strong> (<code>.prettierrc</code>). Add <strong><code>eslint-config-prettier</code> LAST</strong> to turn off ESLint's stylistic rules so the two don't fight. (Not <code>eslint-plugin-prettier</code>.)</li>
    <li><strong>Git hooks:</strong> husky (<code>prepare: "husky"</code> installs on <code>npm install</code>) + lint-staged. Pre-commit runs <code>eslint --fix</code> + <code>prettier --write</code> on STAGED files, then <code>tsc --noEmit</code> on the WHOLE project (type errors span files). CI mirrors with typecheck/lint/<code>prettier --check</code>. <code>--no-verify</code> bypasses hooks.</li>
    <li><strong>Expo deltas:</strong> <code>expo/tsconfig.base</code>, generated <code>expo-env.d.ts</code> + <code>.expo/types</code> (never edit), <code>EXPO_PUBLIC_*</code> env, <code>eslint-config-expo</code>, <code>expo lint</code>, <code>expo customize tsconfig.json</code>; still <code>npx tsc --noEmit</code> to type-check.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Declaring a path alias in only one place</strong> — tsconfig <code>paths</code> quiets the editor and lets <code>tsc --noEmit</code> pass, but ONLY babel <code>module-resolver</code> makes the import exist at runtime. tsconfig-only → "Unable to resolve module @/foo" crash; babel-only → app runs but red squiggles + no autocomplete. Fix both, add Jest <code>moduleNameMapper</code>, and restart Metro with <code>--reset-cache</code>. (Related trap: assuming a green <code>tsc</code> means runtime safety — types are erased by Babel, so validate external data yourself.)</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"In React Native, Babel transpiles and runs the code — it strips the types one file at a time and never checks them — while tsc runs separately with <code>noEmit</code> purely to type-check the whole program. That's why Metro can bundle code with type errors and why CI needs its own <code>tsc --noEmit</code>."</div>
  <div class="revision-say">"A path alias has to be declared twice: tsconfig <code>paths</code> for tsc and the editor, and babel <code>module-resolver</code> for the actual runtime rewrite. Declare only one and you get either a runtime resolve crash or a red squiggle on code that runs — plus Jest needs the same alias in <code>moduleNameMapper</code>."</div>
  <div class="revision-say">"tsc owns types, ESLint owns bugs like missing hook deps via <code>exhaustive-deps</code>, and Prettier owns whitespace. I add <code>eslint-config-prettier</code> last so ESLint and Prettier don't fight, and I gate all three on commit with husky + lint-staged and again in CI."</div>
</div>
`},

{ id: 'checklist', title: '✅ Interview Checklist', collapsible: true, html: `
<div class="callout success">
  <div class="callout-title">Can you answer these before moving on?</div>
  <ul>
    <li>Can you explain which tool compiles your TypeScript in RN, which one type-checks it, and why <code>noEmit</code> is set?</li>
    <li>Can you say exactly why a path alias must live in both <code>tsconfig paths</code> and <code>babel module-resolver</code>, and what breaks if it's in only one?</li>
    <li>Can you explain why a type error is not a runtime error (and why a green tsc can still crash)?</li>
    <li>Can you write ambient <code>.d.ts</code> declarations for importing PNGs, SVGs-as-components, and typed env vars?</li>
    <li>Can you separate the jobs of tsc, ESLint, and Prettier, and stop ESLint and Prettier from fighting?</li>
    <li>Can you name the key RN ESLint rules (exhaustive-deps, no-inline-styles) and what class of bug each catches?</li>
    <li>Can you set up husky + lint-staged so ESLint/Prettier run on staged files but <code>tsc --noEmit</code> runs whole-project, and mirror it in CI?</li>
  </ul>
</div>
`}

]
});
