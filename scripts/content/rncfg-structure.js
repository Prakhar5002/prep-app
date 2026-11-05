window.PREP_SITE.registerTopic({
  id: "rncfg-structure",
  module: "RN Project & Config (Deep)",
  title: "Project Structure & Entry Point",
  estimatedReadTime: "22 min",
  tags: ["react-native","project-structure","entry-point","appregistry","index-js","app-tsx","folder-conventions","path-aliases","module-resolver","monorepo","metro","watchfolders","barrel-files","feature-folders","expo","expo-router","registerrootcomponent","assets"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">A RN app boots <strong>index.js → AppRegistry.registerComponent(appName, () =&gt; App) → App.tsx → navigation → screens</strong>; <code>index.js</code> (not <code>App.tsx</code>) is the entry point, and the <code>appName</code> string must match in index.js, the native host, and app.json.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Entry point is <code>index.js</code></strong>, found via package.json <code>"main"</code>. It runs at bundle load and calls <code>AppRegistry.registerComponent(appName, () =&gt; App)</code> — a string key bound to a lazy component provider.</li>
    <li><strong><code>App.tsx</code> is the root component</strong>, not the entry: it holds global providers (store, query client, theme, safe-area) + the <code>NavigationContainer</code> and root navigator. Keep screens and logic OUT of it to avoid whole-tree re-renders.</li>
    <li><strong>The appName contract:</strong> app.json <code>"name"</code> = key in <code>registerComponent</code> = Android <code>MainActivity.getMainComponentName()</code> = iOS <code>moduleName</code>. Mismatch → red box "Application X has not been registered."</li>
    <li><strong>Metro starts from <code>"main"</code></strong> (bare: <code>index.js</code>; Expo: <code>expo/AppEntry.js</code> or <code>expo-router/entry</code>); older RN honored a <code>"react-native"</code> field; <code>--entry-file</code> overrides when bundling by hand.</li>
    <li><strong>src/ layouts:</strong> layer-based (<code>components/ screens/ navigation/ hooks/ services|api/ store/ utils/ types/ theme/ constants/ assets/</code>) for small/medium apps; feature-based (<code>features/&lt;name&gt;</code> colocating everything) for large multi-team apps; hybrid is common.</li>
    <li><strong>Presentational vs container/screen:</strong> presentational = props-only reusable UI (lives in <code>components/</code>); container/screen = wires data + navigation (lives in <code>screens/</code>). Don't fetch data inside a "reusable" component.</li>
    <li><strong>Path aliases need TWO configs:</strong> <code>tsconfig.json</code> <code>paths</code> (editor + type-check) AND <code>babel-plugin-module-resolver</code> (runtime bundle) — plus Jest <code>moduleNameMapper</code>. tsconfig-only = green editor but runtime "Unable to resolve module."</li>
    <li><strong>Barrel files (<code>index.ts</code> re-exports):</strong> tidy imports but Metro has weak tree-shaking (bundle bloat + slow cold start) and barrels cause circular deps (<code>undefined</code> at import). Use small per-folder barrels; never one giant <code>src/index.ts</code>.</li>
    <li><strong>Assets:</strong> local <code>require()</code> must be a static literal (Metro hashes at build time — no computed paths); remote images use <code>{ uri }</code>. Fonts: bare RN via <code>react-native.config.js</code> assets + <code>react-native-asset</code>; Expo via <code>expo-font</code> <code>useFonts()</code>.</li>
    <li><strong>Monorepo:</strong> <code>apps/</code> + <code>packages/</code> with workspaces; Metro needs <code>watchFolders</code> (workspace root) + <code>resolver.nodeModulesPaths</code>; dedupe React or "Invalid hook call."</li>
    <li><strong>Expo reality:</strong> <code>registerRootComponent(App)</code> replaces hand-written <code>index.js</code> and sets the root key for you; Expo Router = file-based routing under <code>app/</code> with no <code>App.tsx</code>; with CNG the <code>android/</code>/<code>ios/</code> folders are generated (hand-edits wiped by <code>expo prebuild --clean</code> — use config plugins / <code>app.json</code> / <code>expo-build-properties</code>).</li>
    <li><strong>Root config files to name:</strong> package.json, app.json/app.config.js, metro.config.js, babel.config.js, tsconfig.json, .eslintrc, .prettierrc, .watchmanconfig, react-native.config.js, .gitignore, Gemfile, .nvmrc, node_modules/, android/, ios/.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Saying "App.tsx is the entry point" — it isn't.</strong> <code>index.js</code> is the entry: Metro runs it, and its <code>AppRegistry.registerComponent(appName, () =&gt; App)</code> call is what binds the root component to the string the native host requests. <code>App.tsx</code> only renders after the native side mounts the registered component. (Second trap: adding an alias to <code>tsconfig.json</code> only — you also need <code>babel-plugin-module-resolver</code> or it crashes at runtime.)</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"The boot chain is index.js → AppRegistry.registerComponent(appName, () =&gt; App) → App.tsx → NavigationContainer → screens. index.js is the entry point; App.tsx is just the first component it registers, and the appName string has to match the native host and app.json."</div>
  <div class="revision-say">"I organize small apps layer-based — components, screens, navigation, hooks, services, store — and switch to feature folders as domains grow so each feature colocates its UI, data, and state and can be deleted as a unit."</div>
  <div class="revision-say">"Path aliases like @/ need both tsconfig paths for the type-checker and babel-plugin-module-resolver for the runtime bundle; miss the Babel side and the editor is happy but the app throws 'Unable to resolve module' at launch."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What "project structure" actually means here</h3>
<p>A React Native project is a Node package (it has <code>package.json</code>, <code>node_modules/</code>) whose UI is authored in React but whose runtime is native. So the repo has three logical zones:</p>
<ul>
  <li><strong>Root config files</strong> — how the JS is bundled, transpiled, type-checked, linted, and named.</li>
  <li><strong>Your JS/TS source</strong> — conventionally under <code>src/</code>, organized into components, screens, navigation, state, services, utils.</li>
  <li><strong>Native projects</strong> — <code>android/</code> (a Gradle project) and <code>ios/</code> (an Xcode project + CocoaPods), each a full app that hosts a JS bundle.</li>
</ul>

<h3>Why the entry point matters so much</h3>
<p>Unlike a web app where the browser loads <code>index.html</code>, a native app process starts in native code (Java/Kotlin <code>MainActivity</code>, ObjC/Swift AppDelegate). That native host asks React Native for a component <strong>by name</strong>. The only place that name is bound to an actual React component is <code>index.js</code> via <code>AppRegistry.registerComponent</code>. If the name is wrong, the JS bundle loads fine but the native side asks for a component that was never registered — you get a blank screen or an "Application X has not been registered" red box. Understanding this chain is the difference between guessing and debugging launch failures.</p>

<h3>Why a conventional folder layout</h3>
<ul>
  <li><strong>Findability</strong> — every RN dev expects <code>src/screens</code>, <code>src/components</code>, <code>src/navigation</code>. Following the convention makes onboarding and code review fast.</li>
  <li><strong>Refactor safety</strong> — clear boundaries (UI vs data vs navigation) keep changes local; a screen change doesn't ripple into your API layer.</li>
  <li><strong>Scale</strong> — layer-based works for small apps; feature-based scales to many teams because a feature is self-contained.</li>
</ul>

<h3>Layer-based vs feature-based (the core decision)</h3>
<table>
  <thead><tr><th></th><th>Layer-based</th><th>Feature-based</th></tr></thead>
  <tbody>
    <tr><td>Top-level folders</td><td>By technical role (components, screens, hooks, services)</td><td>By feature (auth, booking, profile)</td></tr>
    <tr><td>A feature's files</td><td>Scattered across many layer folders</td><td>Colocated in one folder</td></tr>
    <tr><td>Best for</td><td>Small / medium apps, solo or small team</td><td>Large apps, multiple teams, many domains</td></tr>
    <tr><td>Deleting a feature</td><td>Hunt through every layer</td><td>Delete one folder</td></tr>
    <tr><td>Risk</td><td>Layer folders balloon (200 files in components/)</td><td>Shared code placement gets debated</td></tr>
  </tbody>
</table>

<h3>Why path aliases exist</h3>
<p>Deep relative imports like <code>import Button from '../../../../components/Button'</code> are fragile — moving a file breaks every <code>../</code>. Aliases (<code>@/components/Button</code>) give stable, root-anchored paths. Because RN transpiles with Babel, aliases need configuring in <strong>two</strong> places: <code>tsconfig.json</code> paths (so TypeScript and your editor resolve them) AND <code>babel-plugin-module-resolver</code> (so the actual runtime bundle resolves them). One without the other means either red squiggles or a runtime "module not found."</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>The root file map at a glance</h3>
<div class="diagram">
<pre>
my-app/
├── index.js              entry file — AppRegistry.registerComponent
├── App.tsx               root React component (providers, navigation)
├── package.json          deps, scripts, "main", codegenConfig
├── app.json              app "name"/"displayName" (RN) OR Expo config
├── app.config.js         dynamic Expo config (alt to app.json)
├── metro.config.js       Metro bundler config (watchFolders, resolver)
├── babel.config.js       Babel presets/plugins (module-resolver, reanimated)
├── tsconfig.json         TS compiler options + path aliases
├── .eslintrc / eslint.config.js   lint rules
├── .prettierrc           formatting
├── .watchmanconfig       Watchman file-watch settings
├── react-native.config.js  autolinking + asset (font) linking
├── .gitignore            ignores node_modules, ios/Pods, build dirs
├── Gemfile               Ruby gems (CocoaPods, fastlane) for iOS tooling
├── .nvmrc                pinned Node version
├── node_modules/         installed deps (incl. react-native itself)
├── src/                  YOUR app code (see below)
├── android/              Gradle project (native host)  → see native topics
└── ios/                  Xcode project + Podfile        → see native topics
</pre>
</div>
<p>The native folders (<code>android/</code>, <code>ios/</code>) and the config files (<code>metro.config.js</code>, <code>babel.config.js</code>, <code>tsconfig.json</code>, <code>app.json</code>) each get their own deep topic — here we care about how they name the entry point and where your source lives.</p>

<h3>The boot chain (this is the whole picture)</h3>
<div class="diagram">
<pre>
 NATIVE HOST                         JS BUNDLE
 ───────────                         ─────────
 Android: MainActivity
   getMainComponentName() = "myapp"
 iOS: AppDelegate
   moduleName = "myapp"
        │
        │ "give me the component named 'myapp'"
        ▼
   AppRegistry ───────────────►  index.js ran at bundle load:
                                   AppRegistry.registerComponent(
                                     "myapp", () =&gt; App)
        │                              │
        │  found → mount               ▼
        ▼                            App.tsx  (root component)
   RCTRootView / ReactRootView         │
   hosts the React tree                ├─ &lt;Providers&gt; (Redux, Query, Theme)
                                       ├─ &lt;NavigationContainer&gt;
                                       │     └─ &lt;Stack.Navigator&gt;
                                       │           ├─ HomeScreen
                                       │           └─ DetailsScreen
                                       └─ ...
</pre>
</div>

<h3>A typical src/ tree (layer-based)</h3>
<div class="diagram">
<pre>
src/
├── components/     reusable presentational UI (Button, Card, Avatar)
├── screens/        full screens wired to navigation (HomeScreen.tsx)
├── navigation/     navigators, route params types, linking config
├── hooks/          reusable hooks (useAuth, useDebounce)
├── services/ (api/) network layer, API clients, endpoints
├── store/          state (Redux slices / Zustand / Jotai atoms)
├── utils/          pure helpers (formatDate, currency)
├── types/          shared TypeScript types/interfaces
├── theme/          colors, spacing, typography tokens
├── constants/      app-wide constants (config, enums)
└── assets/         images, fonts, lottie
</pre>
</div>

<h3>The same app, feature-based</h3>
<div class="diagram">
<pre>
src/
├── features/
│   ├── auth/       (components/ screens/ hooks/ api/ store/ types.ts)
│   ├── booking/    (self-contained: everything booking lives here)
│   └── profile/
├── components/     truly shared UI only
├── navigation/     top-level navigators tying features together
├── services/       shared API client, http, storage
└── theme/          shared design tokens
</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"<code>App.tsx</code> is the entry point." No — <code>index.js</code> is. <code>App.tsx</code> is just the first component that <code>index.js</code> registers. Metro starts bundling from the <code>"main"</code> field in <code>package.json</code> (usually <code>index.js</code>), runs it top-to-bottom, and that execution is what calls <code>AppRegistry.registerComponent</code>. <code>App.tsx</code> never runs until the native host requests the registered component.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>Step 1 — package.json "main" tells Metro where to start</h3>
<p>Metro reads the <code>"main"</code> field to find the entry file. In a bare RN app it is usually <code>index.js</code>; in Expo it points at Expo's own entry.</p>
<pre><code class="language-json">// package.json (bare RN)
{
  "name": "myapp",
  "main": "index.js",
  "scripts": {
    "start": "react-native start",
    "android": "react-native run-android",
    "ios": "react-native run-ios"
  }
}</code></pre>
<pre><code class="language-json">// package.json (Expo) — entry comes from the expo package
{
  "name": "sw-mobile",
  "main": "expo/AppEntry.js"
}</code></pre>
<p>Older RN also honored a <code>"react-native"</code> field as a bundler-specific entry override, and the CLI accepts <code>--entry-file index.js</code> when bundling manually (<code>npx react-native bundle --entry-file index.js --bundle-output ...</code>). The <code>"main"</code> field is the default; the flag wins when you build a bundle by hand for release.</p>

<h3>Step 2 — index.js registers the root component</h3>
<pre><code class="language-js">// index.js
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () =&gt; App);</code></pre>
<p>Key facts:</p>
<ul>
  <li><code>registerComponent(appKey, componentProvider)</code> takes a <strong>string key</strong> and a <strong>function that returns the component</strong> (a "component provider" — lazy, so the component isn't constructed until the native side mounts it).</li>
  <li><code>appName</code> here is imported from <code>app.json</code>'s <code>"name"</code> field so the string stays in one place.</li>
  <li>This runs as a <strong>side effect at bundle load</strong> — merely loading the bundle registers the component; nothing renders yet.</li>
</ul>

<h3>Step 3 — the appName contract across native</h3>
<p>The registered key MUST match on both native platforms, or the native host asks <code>AppRegistry</code> for a name that was never registered.</p>
<pre><code class="language-kotlin">// android/app/src/main/java/.../MainActivity.kt
class MainActivity : ReactActivity() {
  // MUST equal the key passed to registerComponent
  override fun getMainComponentName(): String = "myapp"
}</code></pre>
<pre><code class="language-objc">// ios/myapp/AppDelegate.mm  (classic RN)
self.moduleName = @"myapp";   // MUST equal the registered key
// this becomes the moduleName of the RCTRootView that hosts the tree</code></pre>
<pre><code class="language-json">// app.json — the single source of truth for that string
{
  "name": "myapp",
  "displayName": "My App"
}</code></pre>
<p>So the chain of equality is: <code>app.json</code> <code>"name"</code> = the key in <code>AppRegistry.registerComponent</code> = <code>MainActivity.getMainComponentName()</code> = iOS <code>moduleName</code>. Break any link and you get "Application 'myapp' has not been registered."</p>

<h3>Step 4 — App.tsx is the root component</h3>
<pre><code class="language-ts">// App.tsx
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Provider as ReduxProvider } from 'react-redux';
import RootNavigator from '@/navigation/RootNavigator';
import { store } from '@/store';
import { queryClient } from '@/services/queryClient';

export default function App() {
  return (
    &lt;ReduxProvider store={store}&gt;
      &lt;QueryClientProvider client={queryClient}&gt;
        &lt;SafeAreaProvider&gt;
          &lt;NavigationContainer&gt;
            &lt;RootNavigator /&gt;
          &lt;/NavigationContainer&gt;
        &lt;/SafeAreaProvider&gt;
      &lt;/QueryClientProvider&gt;
    &lt;/ReduxProvider&gt;
  );
}</code></pre>
<p>Conventionally <code>App.tsx</code> holds nothing but <strong>global providers + the top navigator</strong>. Keep screens out of it — a fat <code>App.tsx</code> becomes a re-render bottleneck because every provider state change re-renders the whole tree.</p>

<h3>Step 5 — path aliases need TWO configs</h3>
<p>TypeScript resolves aliases for the editor/type-checker; Babel resolves them for the actual bundle at build time. You need both.</p>
<pre><code class="language-json">// tsconfig.json — for TypeScript + IDE
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"]
    }
  }
}</code></pre>
<pre><code class="language-js">// babel.config.js — for the runtime bundle
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module-resolver', {
      root: ['./src'],
      alias: { '@': './src', '@components': './src/components' },
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
    }]
    // reanimated/plugin must stay LAST if used
  ]
};</code></pre>
<p>Deep dives on these two files live in the Babel and TypeScript config topics; the point here is that an alias is a <strong>project-structure convenience that is only real once both layers agree</strong>. Miss the Babel side and you ship a "Unable to resolve module @/..." runtime error even though the editor was happy.</p>

<h3>Step 6 — barrel files (index.ts re-exports)</h3>
<pre><code class="language-ts">// src/components/index.ts  (a "barrel")
export { default as Button } from './Button';
export { default as Card } from './Card';
export { default as Avatar } from './Avatar';

// consumer — one import line
import { Button, Card, Avatar } from '@/components';</code></pre>
<p>Barrels tidy imports but have real costs on RN: (1) Metro has <strong>no reliable tree-shaking</strong>, so importing one symbol from a barrel can pull the whole barrel's module graph into the bundle; (2) they are a classic source of <strong>circular dependencies</strong> (A imports the barrel, the barrel imports B, B imports the barrel) which surface as <code>undefined</code> at import time; (3) they can slow cold start. Use barrels sparingly — per small folder, not one giant <code>src/index.ts</code>.</p>

<h3>Step 7 — assets (images + fonts)</h3>
<pre><code class="language-ts">// static require — resolved by Metro at build time (path must be literal)
const logo = require('@/assets/images/logo.png');
&lt;Image source={logo} /&gt;
&lt;Image source={require('./assets/icon.png')} /&gt;

// remote/dynamic — a URI object, NOT require()
&lt;Image source={{ uri: 'https://cdn.example.com/a.png' }} /&gt;</code></pre>
<p><code>require()</code> for local assets must be a <strong>static string literal</strong> — Metro resolves and hashes it at bundle time, so you cannot build the path dynamically ('assets/' + name). For fonts in bare RN, list asset dirs in <code>react-native.config.js</code> and run <code>npx react-native-asset</code> to link them:</p>
<pre><code class="language-js">// react-native.config.js
module.exports = {
  assets: ['./src/assets/fonts'],   // fonts copied into native projects
};</code></pre>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — entry point and assets differ</div>
  <p>In Expo you rarely hand-write <code>index.js</code>. Managed apps use <code>"main": "expo/AppEntry.js"</code>, which imports your <code>App.tsx</code> and calls <code>registerRootComponent(App)</code> for you — that wrapper both registers the component AND sets the correct root key automatically, so you never touch the <code>appName</code> string. Expo Router apps go further: <code>"main": "expo-router/entry"</code> and file-based routing under <code>app/</code> — there is no manual <code>App.tsx</code> or navigator at all. For fonts, Expo uses <code>expo-font</code> (<code>useFonts()</code> hook / <code>Font.loadAsync</code>) instead of <code>react-native.config.js</code> asset linking, and with Continuous Native Generation the <code>android/</code> and <code>ios/</code> folders may not exist in the repo until you run <code>npx expo prebuild</code>. Prakhar's <code>sw-mobile</code> and <code>sw-ticketing</code> (Expo 53) use prebuild, so they DO have native folders, but those folders are generated output — hand-edits get wiped by <code>expo prebuild --clean</code>; use <code>app.json</code> / config plugins instead.</p>
</div>

<h3>Step 8 — monorepo layout</h3>
<pre><code class="language-text">workspace/
├── package.json          workspaces: ["apps/*", "packages/*"]
├── apps/
│   ├── mobile/           the RN app (its own index.js/App.tsx)
│   └── web/
└── packages/
    ├── ui/               shared components
    ├── core/             shared business logic
    └── config/           shared eslint/tsconfig</code></pre>
<pre><code class="language-js">// apps/mobile/metro.config.js — Metro must watch sibling packages
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];   // watch the whole monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
module.exports = config;</code></pre>
<p>Structure changes in a monorepo because Metro defaults to watching only the app folder. Shared code lives outside that folder, so you add it to <code>watchFolders</code> and teach the resolver where hoisted <code>node_modules</code> live. Without this you get "Unable to resolve module" for your own workspace packages.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — minimal bare-RN index.js + App.tsx</h3>
<pre><code class="language-js">// index.js
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
AppRegistry.registerComponent(appName, () =&gt; App);</code></pre>
<pre><code class="language-ts">// App.tsx
import React from 'react';
import { Text, View } from 'react-native';
export default function App() {
  return (
    &lt;View&gt;&lt;Text&gt;Hello&lt;/Text&gt;&lt;/View&gt;
  );
}</code></pre>

<h3>Example 2 — Expo managed entry (no hand-written index.js)</h3>
<pre><code class="language-json">// package.json
{ "main": "expo/AppEntry.js" }</code></pre>
<pre><code class="language-ts">// App.tsx is your root; expo/AppEntry.js does:
//   import App from '../../App';
//   import { registerRootComponent } from 'expo';
//   registerRootComponent(App);
// registerRootComponent = AppRegistry.registerComponent with the
// correct root key set for you.</code></pre>

<h3>Example 3 — Expo Router (file-based, no App.tsx)</h3>
<pre><code class="language-json">// package.json
{ "main": "expo-router/entry" }</code></pre>
<pre><code class="language-text">app/
├── _layout.tsx     root layout (providers + Stack)
├── index.tsx       route "/"
├── booking/
│   └── [id].tsx    route "/booking/:id"
└── (tabs)/
    ├── _layout.tsx tab navigator
    └── home.tsx</code></pre>
<p>Routing is derived from the file tree — no manual navigator wiring, no <code>App.tsx</code>.</p>

<h3>Example 4 — layer-based screen import</h3>
<pre><code class="language-ts">// src/screens/HomeScreen.tsx
import React from 'react';
import { ScreenContainer } from '@/components';
import { useBookings } from '@/hooks/useBookings';
import { colors } from '@/theme';
export default function HomeScreen() {
  const { data } = useBookings();
  return &lt;ScreenContainer bg={colors.bg}&gt;{/* ... */}&lt;/ScreenContainer&gt;;
}</code></pre>

<h3>Example 5 — feature folder (self-contained)</h3>
<pre><code class="language-text">src/features/booking/
├── screens/BookingListScreen.tsx
├── components/BookingCard.tsx
├── hooks/useBookings.ts
├── api/bookingApi.ts
├── store/bookingSlice.ts
└── types.ts
// delete the feature = delete this one folder</code></pre>

<h3>Example 6 — presentational vs container/screen split</h3>
<pre><code class="language-ts">// presentational: dumb, props-only, reusable, testable
function BookingCardView(props: { title: string; onCancel: () =&gt; void }) {
  return &lt;Card&gt;{/* renders props, no data fetching */}&lt;/Card&gt;;
}
// container/screen: wires data + navigation to the view
function BookingCardContainer({ id }: { id: string }) {
  const booking = useBooking(id);
  const cancel = useCancelBooking(id);
  return &lt;BookingCardView title={booking.title} onCancel={cancel} /&gt;;
}</code></pre>

<h3>Example 7 — colocating tests and styles</h3>
<pre><code class="language-text">src/components/Button/
├── Button.tsx
├── Button.styles.ts        // or StyleSheet in-file
├── Button.test.tsx         // colocated unit test
└── index.ts                // barrel: export { default } from './Button'</code></pre>

<h3>Example 8 — path alias in action</h3>
<pre><code class="language-ts">// BEFORE — fragile relative import
import Button from '../../../../components/Button';
// AFTER — stable alias (needs tsconfig paths + babel module-resolver)
import Button from '@/components/Button';</code></pre>

<h3>Example 9 — static vs dynamic asset require</h3>
<pre><code class="language-ts">// WORKS — literal path, resolved at build time
const a = require('@/assets/images/logo.png');
// FAILS — Metro cannot resolve a computed require
const name = 'logo';
const b = require('@/assets/images/' + name + '.png'); // error
// pattern: build a static map instead
const IMAGES = { logo: require('@/assets/images/logo.png') };
const c = IMAGES[name];</code></pre>

<h3>Example 10 — expo-font vs react-native.config.js</h3>
<pre><code class="language-ts">// Expo — load fonts at runtime
import { useFonts } from 'expo-font';
const [loaded] = useFonts({
  'Inter-Bold': require('@/assets/fonts/Inter-Bold.ttf'),
});
if (!loaded) return null;</code></pre>
<pre><code class="language-js">// Bare RN — link at build time, then use fontFamily by name
// react-native.config.js
module.exports = { assets: ['./src/assets/fonts'] };
// then: npx react-native-asset</code></pre>

<h3>Example 11 — monorepo shared package import</h3>
<pre><code class="language-ts">// apps/mobile/src/screens/HomeScreen.tsx
import { Button } from '@myorg/ui';        // packages/ui
import { formatCurrency } from '@myorg/core'; // packages/core
// only resolves because metro.config.js sets watchFolders +
// nodeModulesPaths to the workspace root</code></pre>

<h3>Example 12 — Prakhar's sw-mobile (Expo 53, prebuild) shape</h3>
<pre><code class="language-text">sw-mobile/
├── app.json / app.config.js   // Expo config + plugins
├── package.json               // "main": expo entry
├── App.tsx                    // root: providers + navigation
├── src/                       // screens, components, services, store
├── android/  ios/             // GENERATED by expo prebuild (don't hand-edit)
└── metro.config.js babel.config.js tsconfig.json
// old (Paper) architecture, Hermes engine, primary test device Android</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. "Application X has not been registered"</h3>
<p>The classic launch red box. The key in <code>AppRegistry.registerComponent</code> doesn't match the native <code>getMainComponentName()</code> / iOS <code>moduleName</code>. Fix the string so all three (plus <code>app.json</code> "name") are identical.</p>

<h3>2. Metro can't find the entry file</h3>
<p>If <code>"main"</code> in package.json points at a missing/renamed file, Metro errors at bundle start. In Expo, <code>"main"</code> must stay the Expo entry (<code>expo/AppEntry.js</code> or <code>expo-router/entry</code>) — accidentally changing it to <code>index.js</code> breaks the managed boot.</p>

<h3>3. Alias works in editor but crashes at runtime</h3>
<p>You added <code>paths</code> to <code>tsconfig.json</code> but not <code>babel-plugin-module-resolver</code>. TypeScript is happy (no red squiggle) but the bundle throws "Unable to resolve module @/...". Both configs are required; they serve different layers.</p>

<h3>4. reanimated/babel plugin ordering</h3>
<p>If you use <code>module-resolver</code> and Reanimated, <code>react-native-reanimated/plugin</code> must be the <strong>last</strong> plugin in <code>babel.config.js</code>. Wrong order causes cryptic worklet/resolution failures. After changing babel config, restart Metro with <code>--reset-cache</code>.</p>

<h3>5. Barrel-file circular dependency</h3>
<p>A imports <code>@/components</code> (barrel), the barrel imports B, B imports <code>@/components</code> again → at module-eval time one of them is still <code>undefined</code>, so you get "undefined is not a function" or a component rendering as blank. Import the concrete file (<code>@/components/Button</code>) to break the cycle.</p>

<h3>6. Editing generated native folders under Expo</h3>
<p>Hand-editing <code>android/</code> or <code>ios/</code> in an Expo prebuild project works until the next <code>expo prebuild --clean</code>, which regenerates them and wipes your changes. Put native changes in <code>app.json</code> / <code>app.config.js</code> / config plugins (e.g. <code>expo-build-properties</code>) instead.</p>

<h3>7. Case-sensitivity mismatches</h3>
<p>macOS is case-insensitive; CI (Linux) is case-sensitive. <code>import Button from '@/components/button'</code> works locally but fails the CI build. Match the real filename case exactly.</p>

<h3>8. Monorepo "Unable to resolve module react"</h3>
<p>Hoisted <code>node_modules</code> at the workspace root aren't seen because Metro only watches the app folder. Add <code>watchFolders</code> and <code>resolver.nodeModulesPaths</code> pointing at the root. Duplicate React copies (app-level AND root-level) cause "Invalid hook call" — dedupe with a single hoisted React.</p>

<h3>9. Dynamic require of assets</h3>
<p>Metro requires static literal paths in <code>require()</code>. A computed path silently returns nothing or errors. Build a static lookup object mapping names to <code>require()</code> calls.</p>

<h3>10. app.json "name" vs "displayName" vs "slug"</h3>
<p>In bare RN, <code>"name"</code> is the registration key and <code>"displayName"</code> is the springboard/home-screen label — they can differ. In Expo, <code>"name"</code> is the human app name and <code>"slug"</code> is the URL-safe project id — different fields entirely from the bare-RN meaning. Don't conflate them.</p>

<h3>11. Multiple registered components</h3>
<p>An app can register more than one root component (e.g. a main app + a share extension + a widget). Each native host requests its own key. Getting the wrong key on a secondary surface blanks only that surface.</p>

<h3>12. Fast Refresh vs full reload on entry changes</h3>
<p>Editing a screen hot-reloads. Editing <code>index.js</code>, <code>App.tsx</code> root providers, or any config file (babel/metro/tsconfig) usually needs a full reload — and config changes need Metro restarted with <code>--reset-cache</code> to take effect.</p>

<h3>13. tsconfig paths and Jest</h3>
<p>Jest doesn't read <code>tsconfig.json</code> paths or babel module-resolver automatically; you must mirror aliases in <code>jest.config</code> <code>moduleNameMapper</code> or tests fail to resolve <code>@/</code> imports.</p>

<h3>14. Absolute imports vs aliases confusion</h3>
<p>Setting <code>baseUrl: "src"</code> lets you write <code>import x from 'components/x'</code> (no <code>@</code>) — but this collides with real npm package names. Prefer a distinct alias prefix (<code>@/</code>, <code>~/</code>) to avoid ambiguity with <code>node_modules</code>.</p>

<h3>15. Provider order in App.tsx</h3>
<p>Order matters: a provider that reads another's context must sit inside it (e.g. a theme provider that reads auth state must be under the auth provider). Wrong nesting throws "could not find context" or gives stale values.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — putting screens and logic in App.tsx</h3>
<p>A fat <code>App.tsx</code> with screens, effects, and state means every provider update re-renders the whole tree. Keep <code>App.tsx</code> to providers + the root navigator only.</p>

<h3>Anti-pattern 2 — one giant barrel at src/index.ts</h3>
<p>A single <code>src/index.ts</code> re-exporting everything maximizes circular-dependency risk and defeats Metro's already-weak tree-shaking, bloating the bundle and slowing cold start. Prefer small per-folder barrels or direct imports.</p>

<h3>Anti-pattern 3 — deep relative imports everywhere</h3>
<p><code>../../../../</code> chains are fragile and break on every file move. Set up path aliases once (tsconfig paths + babel module-resolver) and use <code>@/</code>.</p>

<h3>Anti-pattern 4 — aliases in tsconfig only</h3>
<p>Adding <code>paths</code> without <code>babel-plugin-module-resolver</code> ships a runtime "cannot resolve module" even though the editor was green. Configure both layers together.</p>

<h3>Anti-pattern 5 — hand-editing generated native folders (Expo)</h3>
<p>Native edits in an Expo prebuild project get wiped by <code>expo prebuild --clean</code>. Move them into config plugins / <code>app.json</code> / <code>expo-build-properties</code>.</p>

<h3>Anti-pattern 6 — mismatched appName string</h3>
<p>Changing the registration key without updating <code>MainActivity.getMainComponentName()</code> and iOS <code>moduleName</code> gives "has not been registered." Keep the string sourced from <code>app.json</code> in one place.</p>

<h3>Anti-pattern 7 — dumping everything in components/</h3>
<p>Layer-based works until <code>components/</code> holds 200 unrelated files. At that scale, migrate to feature folders so a domain's code colocates.</p>

<h3>Anti-pattern 8 — mixing presentational and data concerns</h3>
<p>A "reusable" component that fetches its own data isn't reusable — it can't be reused with different data or tested in isolation. Split into a presentational view + a container that supplies data.</p>

<h3>Anti-pattern 9 — dynamic require() for assets</h3>
<p><code>require('./img/' + name)</code> breaks Metro's static resolution. Use a static require map.</p>

<h3>Anti-pattern 10 — not pinning Node</h3>
<p>No <code>.nvmrc</code> / engines field means teammates and CI run different Node versions and get non-reproducible Metro/native build failures. Pin it.</p>

<h3>Anti-pattern 11 — committing node_modules / ios/Pods / build dirs</h3>
<p>A missing or wrong <code>.gitignore</code> bloats the repo and causes merge hell. Ignore <code>node_modules/</code>, <code>ios/Pods/</code>, <code>android/build/</code>, <code>*.keystore</code>, <code>.env</code>.</p>

<h3>Anti-pattern 12 — wrong babel plugin order with reanimated</h3>
<p>Any plugin after <code>react-native-reanimated/plugin</code> breaks worklets. Keep it strictly last.</p>

<h3>Anti-pattern 13 — feature folders with no shared boundary</h3>
<p>Going 100% feature-based but letting features import each other's internals creates a tangled graph. Expose a feature's public API via a small barrel and keep internals private.</p>

<h3>Anti-pattern 14 — provider nesting mistakes</h3>
<p>Placing a consumer above its provider (or duplicating a provider) yields "context not found" or two isolated stores. Nest deliberately, once, at the root.</p>

<h3>Anti-pattern 15 — monorepo without watchFolders</h3>
<p>Shared workspace packages fail to resolve because Metro watches only the app. Configure <code>watchFolders</code> + <code>nodeModulesPaths</code>, and dedupe React to avoid "Invalid hook call."</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. What is the entry point of a React Native app and what does it do?</div>
  <div class="qa-answer">
    <p><code>index.js</code> (pointed to by <code>"main"</code> in package.json). It imports the root <code>App</code> component and calls <code>AppRegistry.registerComponent(appName, () =&gt; App)</code>, binding a string key to a component provider. That registration runs as a side effect when Metro loads the bundle; the native host later requests the component by that key and mounts it. <code>App.tsx</code> is NOT the entry point — it is just the first component <code>index.js</code> registers.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Walk me through the boot chain from process start to the first screen.</div>
  <div class="qa-answer">
    <ol>
      <li>Native process starts (Android <code>MainActivity</code> / iOS AppDelegate).</li>
      <li>RN runtime loads the JS bundle; running it top-to-bottom executes <code>index.js</code>, which calls <code>AppRegistry.registerComponent(appName, () =&gt; App)</code>.</li>
      <li>The native host asks <code>AppRegistry</code> for the component named <code>appName</code> and mounts it into an <code>RCTRootView</code> (iOS) / <code>ReactRootView</code> (Android).</li>
      <li><code>App.tsx</code> renders: providers → <code>NavigationContainer</code> → root navigator → first screen.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Why must appName match across files, and what breaks if it doesn't?</div>
  <div class="qa-answer">
    <p>The native side asks for a component by a string key. That key must equal the key in <code>AppRegistry.registerComponent</code>, <code>MainActivity.getMainComponentName()</code>, iOS <code>moduleName</code>, and <code>app.json</code> "name". If they diverge, the bundle loads but the requested key was never registered, so you get the red box "Application 'X' has not been registered" and a blank screen.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. How does Metro know where to start bundling?</div>
  <div class="qa-answer">
    <p>From the <code>"main"</code> field in package.json (default <code>index.js</code>; Expo uses <code>expo/AppEntry.js</code> or <code>expo-router/entry</code>). Older RN also honored a <code>"react-native"</code> field as a bundler override, and <code>react-native bundle --entry-file</code> lets you specify the entry explicitly when producing a release bundle by hand.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Contrast layer-based and feature-based folder organization.</div>
  <div class="qa-answer">
    <p>Layer-based groups by technical role (<code>components/</code>, <code>screens/</code>, <code>hooks/</code>, <code>services/</code>) — simple, great for small/medium apps, but a feature's files scatter across many folders and layer folders balloon at scale. Feature-based groups by domain (<code>features/auth</code>, <code>features/booking</code>), colocating each feature's UI, hooks, API, and state so it can be added or deleted as a unit — better for large apps and multiple teams, at the cost of debating where shared code lives. Many apps do a hybrid: feature folders plus a shared <code>components/</code>, <code>services/</code>, and <code>theme/</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How do path aliases work in RN and why do you need two configs?</div>
  <div class="qa-answer">
    <p>An alias like <code>@/</code> maps to <code>src/</code>. TypeScript/IDE resolution comes from <code>tsconfig.json</code> <code>paths</code> (plus <code>baseUrl</code>); the actual runtime bundle resolution comes from <code>babel-plugin-module-resolver</code> in <code>babel.config.js</code>. You need both because they operate on different layers — miss the Babel side and the editor is green but the bundle throws "Unable to resolve module." Jest needs a third mirror via <code>moduleNameMapper</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. What are barrel files and what are their downsides on RN?</div>
  <div class="qa-answer">
    <p>An <code>index.ts</code> that re-exports a folder's modules so consumers import from one path. Downsides: Metro has no reliable tree-shaking, so importing one symbol can pull the whole barrel's graph into the bundle (size + cold start); barrels are a top source of circular dependencies that surface as <code>undefined</code> at import time. Use small per-folder barrels, never one giant <code>src/index.ts</code>, and import concrete files to break cycles.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Presentational vs container/screen components — where does the line sit?</div>
  <div class="qa-answer">
    <p>Presentational components take props and render UI only — no data fetching, no navigation — so they're reusable and easy to test. Container/screen components wire data (hooks, store, API) and navigation, then hand plain props down to presentational views. <code>components/</code> tends to hold presentational pieces; <code>screens/</code> holds route-connected containers. Mixing the two makes "reusable" components un-reusable.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. What belongs in App.tsx and what does not?</div>
  <div class="qa-answer">
    <p>Belongs: global providers (state store, query client, theme, safe-area, gesture handler) and the top-level <code>NavigationContainer</code> + root navigator. Does not belong: screens, business logic, effects, or per-screen state — those inflate re-renders because any provider change re-renders the whole tree. Provider nesting order matters: a consumer must sit inside its provider.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. How does the entry point differ in Expo?</div>
  <div class="qa-answer">
    <p>Managed Expo uses <code>"main": "expo/AppEntry.js"</code>, which imports your <code>App.tsx</code> and calls <code>registerRootComponent(App)</code> — a wrapper over <code>AppRegistry.registerComponent</code> that also sets the correct root key for you, so you never manage the <code>appName</code> string. Expo Router uses <code>"main": "expo-router/entry"</code> with file-based routing under <code>app/</code> and no <code>App.tsx</code> at all. With Continuous Native Generation the <code>android/</code>/<code>ios/</code> folders may not even exist until <code>expo prebuild</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. How do you reference images and fonts, and what's the static-require constraint?</div>
  <div class="qa-answer">
    <p>Local assets use <code>require('./path.png')</code> with a <strong>static string literal</strong> — Metro resolves and hashes it at build time, so computed paths fail; build a static map instead. Remote images use a <code>{ uri }</code> source. Fonts: bare RN links them via <code>react-native.config.js</code> <code>assets</code> + <code>npx react-native-asset</code>; Expo loads them at runtime with <code>expo-font</code>'s <code>useFonts()</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. What changes about project structure in a monorepo?</div>
  <div class="qa-answer">
    <p>You split into <code>apps/</code> (the RN app) and <code>packages/</code> (shared UI/logic), tied together by workspaces. Metro defaults to watching only the app folder, so you add <code>watchFolders</code> pointing at the workspace root and set <code>resolver.nodeModulesPaths</code> for hoisted dependencies. You also dedupe React (a second copy causes "Invalid hook call"). Without this, your own workspace packages fail to resolve.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Name the key root config files and each one's job.</div>
  <div class="qa-answer">
    <ul>
      <li><code>index.js</code> — entry; registers the root component.</li>
      <li><code>App.tsx</code> — root component (providers + navigation).</li>
      <li><code>package.json</code> — deps, scripts, <code>"main"</code>, codegenConfig.</li>
      <li><code>app.json</code> / <code>app.config.js</code> — app name / Expo config.</li>
      <li><code>metro.config.js</code> — bundler (watchFolders, resolver).</li>
      <li><code>babel.config.js</code> — transpile presets/plugins (module-resolver).</li>
      <li><code>tsconfig.json</code> — TS options + path aliases.</li>
      <li><code>react-native.config.js</code> — autolinking + font asset linking.</li>
      <li><code>.watchmanconfig</code>, <code>.nvmrc</code>, <code>Gemfile</code>, <code>.eslintrc</code>, <code>.prettierrc</code>, <code>.gitignore</code> — file-watching, Node pin, Ruby tooling, lint, format, ignores.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Your alias imports work in VS Code but the app crashes at launch. Why?</div>
  <div class="qa-answer">
    <p>You configured <code>tsconfig.json</code> <code>paths</code> (so the editor and type-checker resolve aliases) but forgot <code>babel-plugin-module-resolver</code> in <code>babel.config.js</code> (which the runtime bundle needs). TypeScript type resolution and runtime module resolution are separate layers. Add the babel plugin with matching <code>alias</code> entries and restart Metro with <code>--reset-cache</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Where does navigation sit in the structure and how does it connect to the entry chain?</div>
  <div class="qa-answer">
    <p><code>src/navigation/</code> holds the navigators, route param types, and deep-linking config. <code>App.tsx</code> renders a single <code>NavigationContainer</code> wrapping the root navigator (e.g. a stack or tab navigator), which renders screens from <code>src/screens/</code>. So the full chain is <code>index.js</code> → <code>AppRegistry</code> → <code>App.tsx</code> → <code>NavigationContainer</code> → root navigator → screens. In Expo Router this collapses into the <code>app/</code> file tree with <code>_layout.tsx</code> files replacing explicit navigators.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You name <code>index.js</code> (not <code>App.tsx</code>) as the entry point and explain <code>AppRegistry.registerComponent</code>.</li>
    <li>You can recite the boot chain: native host → AppRegistry → App → navigation → screens.</li>
    <li>You know the <code>appName</code> string must match across index.js, native host, and app.json.</li>
    <li>You contrast layer-based vs feature-based and can justify a hybrid.</li>
    <li>You explain why path aliases need both tsconfig paths AND babel module-resolver.</li>
    <li>You know barrel files hurt bundling/cold start and cause circular deps.</li>
    <li>You separate presentational from container/screen components.</li>
    <li>You know Expo's <code>registerRootComponent</code> / <code>expo-router/entry</code> and CNG generated native folders.</li>
    <li>You can set up a monorepo with <code>watchFolders</code> and dedupe React.</li>
  </ul>
</div>
` },

  ]
});
