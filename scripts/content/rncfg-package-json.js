window.PREP_SITE.registerTopic({
  id: 'rncfg-package-json',
  module: 'RN Project & Config (Deep)',
  title: 'package.json Deep',
  estimatedReadTime: '23 min',
  tags: ['package-json', 'npm', 'yarn', 'pnpm', 'bun', 'dependencies', 'devdependencies', 'peerdependencies', 'optionaldependencies', 'semver', 'caret', 'tilde', 'lockfile', 'package-lock', 'yarn-lock', 'npm-ci', 'scripts', 'engines', 'packagemanager', 'workspaces', 'monorepo', 'hoisting', 'nohoist', 'overrides', 'resolutions', 'patch-package', 'autolinking', 'codegenconfig', 'expo-install', 'expo-doctor', 'metro', 'watchfolders', 'react-native', 'expo'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p><code>package.json</code> is the manifest at the root of every RN / Expo app. It names the package, pins its dependency versions, defines the scripts you run daily, and carries RN-specific blocks (<code>codegenConfig</code>, the <code>expo</code> object, <code>react-native</code> config) that drive the native build.</p>
<p>The parts that bite in React Native specifically:</p>
<ul>
  <li><strong>Autolinking scans <code>dependencies</code></strong> — a native library in <code>devDependencies</code> won't link, and the module is "not found" at runtime.</li>
  <li><strong>Semver on native modules is dangerous</strong> — a <code>^</code> caret can silently pull a version whose native code no longer matches your installed RN, so Expo apps pin exact versions via <code>expo install</code>.</li>
  <li><strong>The lockfile is the real source of truth</strong> — <code>package.json</code> declares ranges; <code>package-lock.json</code> / <code>yarn.lock</code> records the exact tree. Commit it or your CI, your teammates, and your build servers install different code.</li>
  <li><strong>patch-package is the RN escape hatch</strong> — when a dependency ships broken native code, you patch <code>node_modules</code> and replay it on every install via a <code>postinstall</code> hook.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p><code>package.json</code> declares intent (ranges + config); the lockfile records reality (the exact tree). In RN, <code>dependencies</code> is what autolinking sees, exact pins protect native code, and patch-package is how you fix a dependency you can't wait on upstream to fix.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What package.json is</h3>
<p>A JSON manifest read by your package manager (npm / Yarn / pnpm / Bun), by the RN CLI's <strong>autolinking</strong>, by <strong>Metro</strong>, by <strong>codegen</strong>, and by Expo's tooling. It answers: what is this package called, what version is it, what does it depend on, what scripts can I run, and what native/build configuration applies.</p>

<h3>The core fields</h3>
<table>
  <thead><tr><th>Field</th><th>Purpose in an RN app</th></tr></thead>
  <tbody>
    <tr><td><code>name</code></td><td>Package identifier. For an app it's mostly cosmetic; for a published library it's the npm name. Must be URL-safe, lowercase.</td></tr>
    <tr><td><code>version</code></td><td>Semver of this package. Apps often keep it in sync with the store version; Expo also reads <code>version</code> in <code>app.json</code>/<code>app.config.js</code> for the binary.</td></tr>
    <tr><td><code>private</code></td><td><code>true</code> on apps — prevents accidental <code>npm publish</code> and is required for npm/Yarn <code>workspaces</code>.</td></tr>
    <tr><td><code>main</code></td><td>Entry file. RN apps commonly point at <code>node_modules/expo/AppEntry.js</code> (Expo) or <code>index.js</code> (bare). Metro, not <code>main</code>, resolves your app graph, but tooling still reads it.</td></tr>
    <tr><td><code>react-native</code> (field)</td><td>An alternate entry / config field some libraries use so bundlers pick RN-specific source. Also where a library declares its native <code>sourceDir</code> for autolinking.</td></tr>
    <tr><td><code>scripts</code></td><td>Named shell commands run via <code>npm run &lt;name&gt;</code> / <code>yarn &lt;name&gt;</code>.</td></tr>
    <tr><td><code>engines</code></td><td>Declares required <code>node</code> (and optionally npm/yarn) versions.</td></tr>
    <tr><td><code>packageManager</code></td><td>Corepack field pinning the exact package manager + version (e.g. <code>yarn@3.6.4</code>).</td></tr>
  </tbody>
</table>

<h3>Why the dependency split matters more in RN</h3>
<p>In a plain web app, putting a package in <code>dependencies</code> vs <code>devDependencies</code> mostly affects what ships to a server or how a bundler tree-shakes. In React Native it has a <strong>native</strong> consequence: RN's autolinking walks your <code>dependencies</code> (and their transitive deps) looking for packages with an <code>android/</code> or <code>ios/</code> folder or a <code>react-native.config.js</code>, and links those into the Gradle / CocoaPods build. Miss the right section and the native code is never compiled in.</p>

<h3>Why RN/Expo distrust the caret</h3>
<p>JS-only packages tolerate <code>^</code> because a minor bump is usually backward-compatible source. A native module is different: its compiled Kotlin/ObjC is built against a specific RN version's headers and its autolinking contract. A minor bump can require a different RN, a different <code>compileSdkVersion</code>, or a codegen change. That's why <code>expo install</code> resolves versions the installed SDK was tested against, and why lockfiles matter so much here.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>Declaration vs resolution</h3>
<div class="diagram">
<pre>
 package.json                         lockfile                     node_modules/
 (what you WANT)                      (what you GOT)               (what's on disk)
 ───────────────                      ─────────────               ─────────────
 "react": "^18.2.0"        resolve    react 18.2.0     install    react/
 "react-native": "0.79.5"  ───────►   react-native 0.79.5 ──────► react-native/
 "expo": "~53.0.0"                    expo 53.0.11                 expo/
      │                                    │                            │
   ranges + config                    exact tree, hashes          real files
   (human intent)                     (reproducible)              (used at build)
</pre>
</div>

<h3>Where each consumer reads package.json</h3>
<div class="diagram">
<pre>
                         package.json
                              │
      ┌───────────┬───────────┼────────────┬──────────────┐
      ▼           ▼           ▼            ▼              ▼
  pkg manager  autolinking   Metro       codegen        Expo CLI
  (npm/yarn)   (RN CLI)      bundler     (native specs) (expo install,
      │           │           │            │             expo-doctor)
  installs     scans        resolves     reads          resolves SDK
  deps into    dependencies JS graph +   codegenConfig  compatible
  node_modules for native   watchFolders                versions
               folders
</pre>
</div>

<h3>The dependency-type decision tree</h3>
<div class="diagram">
<pre>
 Is it needed at RUNTIME (imported by app code, or a native module)?
   │
   ├─ YES ──► dependencies         (react, react-native, native libs, expo-*)
   │
   └─ NO ──► only for building/testing/linting?
                 │
                 ├─ YES ──► devDependencies   (@types/*, eslint, jest, babel,
                 │                              typescript, detox)
                 │
                 └─ "my consumers must provide it" (LIBRARY authoring)?
                        │
                        └─ YES ──► peerDependencies  (react, react-native)
</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"It works locally, so the section doesn't matter." It works locally because everything is flat in your <code>node_modules</code> during development. The section matters when autolinking decides what native code to compile, when a CI does a production-only install, and when your package is consumed by someone else. Put runtime/native deps in <code>dependencies</code>.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>A representative RN / Expo package.json</h3>
<pre><code class="language-json">{
  "name": "sw-mobile",
  "version": "1.8.0",
  "private": true,
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "pod-install": "npx pod-install ios",
    "postinstall": "patch-package",
    "test": "jest",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "typecheck": "tsc --noEmit",
    "doctor": "npx expo-doctor",
    "eas:build:prod": "eas build --profile production --platform all",
    "eas:submit:ios": "eas submit --profile production --platform ios"
  },
  "dependencies": {
    "expo": "~53.0.0",
    "react": "18.3.1",
    "react-native": "0.79.5",
    "react-native-mmkv": "2.12.2",
    "@react-navigation/native": "^6.1.18"
  },
  "devDependencies": {
    "@babel/core": "^7.25.2",
    "@types/react": "~18.3.12",
    "typescript": "~5.3.3",
    "eslint": "^8.57.0",
    "jest": "^29.7.0",
    "patch-package": "^8.0.0"
  },
  "engines": { "node": "&gt;=18.18" },
  "packageManager": "yarn@3.6.4"
}</code></pre>

<h3>Scripts you actually run in RN</h3>
<table>
  <thead><tr><th>Script</th><th>What it does</th></tr></thead>
  <tbody>
    <tr><td><code>start</code></td><td>Boots the Metro dev server (<code>expo start</code> or <code>react-native start</code>).</td></tr>
    <tr><td><code>android</code> / <code>ios</code></td><td>Builds the native app and installs on a device/emulator (<code>expo run:*</code> or <code>react-native run-*</code>).</td></tr>
    <tr><td><code>pod-install</code></td><td>Runs CocoaPods for iOS after adding a native dependency.</td></tr>
    <tr><td><code>postinstall</code></td><td>Lifecycle hook auto-run after every install — the standard home of <code>patch-package</code> (and sometimes <code>pod-install</code> or <code>jetify</code>).</td></tr>
    <tr><td><code>test</code> / <code>lint</code> / <code>typecheck</code></td><td>Jest, ESLint, and <code>tsc --noEmit</code>.</td></tr>
    <tr><td><code>eas:build:*</code> / <code>eas:submit:*</code></td><td>Thin wrappers over <code>eas build</code> / <code>eas submit</code> so build profiles are one command.</td></tr>
  </tbody>
</table>
<p>Npm exposes lifecycle hooks: <code>pre&lt;name&gt;</code> and <code>post&lt;name&gt;</code> run automatically around a script, and <code>preinstall</code>/<code>postinstall</code>/<code>prepare</code> run around install. Yarn 2+ (Berry) dropped implicit <code>pre</code>/<code>post</code> for arbitrary scripts, but still runs <code>postinstall</code>.</p>

<h3>The four dependency buckets</h3>
<pre><code class="language-json">{
  "dependencies":        { "react-native-mmkv": "2.12.2" },
  "devDependencies":     { "typescript": "~5.3.3" },
  "peerDependencies":    { "react": "*", "react-native": "*" },
  "optionalDependencies":{ "fsevents": "^2.3.3" }
}</code></pre>
<ul>
  <li><strong><code>dependencies</code></strong> — installed for anyone who installs your package; the set autolinking and Metro treat as your runtime graph. Native modules and every runtime import live here.</li>
  <li><strong><code>devDependencies</code></strong> — installed only when you develop this package (skipped by <code>npm install --omit=dev</code> / <code>--production</code>). Types, ESLint, Jest, Babel, Detox, TypeScript.</li>
  <li><strong><code>peerDependencies</code></strong> — "the host app must provide this." RN libraries declare <code>react</code> and <code>react-native</code> as peers so there is exactly one copy in the app, not one bundled per library. npm 7+ auto-installs missing peers; Yarn/pnpm warn instead.</li>
  <li><strong><code>optionalDependencies</code></strong> — install is attempted but a failure doesn't abort (e.g. <code>fsevents</code>, macOS-only). Your code must guard for its absence.</li>
</ul>
<p>Related: <code>peerDependenciesMeta</code> marks a peer <code>optional</code>; <code>bundledDependencies</code> ships specific deps inside your tarball (rare in apps).</p>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — expo install, not npm install</div>
  <p>In an Expo project prefer <code>npx expo install &lt;pkg&gt;</code> over <code>npm/yarn add</code>. Expo maintains a table of versions each SDK was tested against and writes the <strong>SDK-compatible</strong> version (often an exact pin or a tight range) into <code>package.json</code>. <code>npm install react-native-reanimated</code> may pull a version built for a different RN and crash at native runtime; <code>expo install react-native-reanimated</code> picks the one SDK 53 expects. Validate with <code>npx expo install --check</code> and repair with <code>npx expo install --fix</code>.</p>
</div>

<h3>Semver: caret, tilde, exact, ranges</h3>
<table>
  <thead><tr><th>Range</th><th>Matches</th><th>Meaning</th></tr></thead>
  <tbody>
    <tr><td><code>^1.2.3</code></td><td>&gt;=1.2.3 &lt;2.0.0</td><td>Caret: allow minor + patch. (Special case: <code>^0.2.3</code> = &gt;=0.2.3 &lt;0.3.0 — for 0.x, minor is treated as breaking.)</td></tr>
    <tr><td><code>~1.2.3</code></td><td>&gt;=1.2.3 &lt;1.3.0</td><td>Tilde: allow patch only (when a minor is given).</td></tr>
    <tr><td><code>1.2.3</code></td><td>exactly 1.2.3</td><td>Exact pin — what native modules want.</td></tr>
    <tr><td><code>1.2.x</code> / <code>1.2</code></td><td>&gt;=1.2.0 &lt;1.3.0</td><td>X-range.</td></tr>
    <tr><td><code>*</code> / <code>""</code></td><td>any version</td><td>Common inside <code>peerDependencies</code> so the host decides.</td></tr>
    <tr><td><code>&gt;=1.2 &lt;2</code></td><td>compound</td><td>Explicit range; <code>||</code> unions ranges (<code>18.x || 19.x</code>).</td></tr>
    <tr><td><code>1.2.3-rc.1</code></td><td>pre-release</td><td>Pre-release tags sort below the release and only match if you opt in explicitly.</td></tr>
  </tbody>
</table>
<p>A semver version is <code>MAJOR.MINOR.PATCH</code> with optional <code>-prerelease</code> and <code>+build</code> metadata. Note RN itself is versioned <code>0.79.5</code> — while RN sits at <code>0.x</code>, a <strong>minor</strong> bump (0.79 → 0.80) is a breaking release, which is exactly why you never caret-range <code>react-native</code>.</p>

<div class="callout danger">
  <div class="callout-title">The caret-on-native-modules trap</div>
  <p><code>"react-native-reanimated": "^3.6.0"</code> lets a fresh install grab 3.10.x whose native code targets a newer RN. Your JS still resolves, but the app crashes at launch or fails to build. Pin native modules exactly (or let <code>expo install</code> do it) and rely on the lockfile.</p>
</div>

<h3>Lockfiles — the exact tree</h3>
<table>
  <thead><tr><th>Manager</th><th>Lockfile</th><th>Format</th></tr></thead>
  <tbody>
    <tr><td>npm</td><td><code>package-lock.json</code></td><td>JSON, full tree + integrity hashes.</td></tr>
    <tr><td>Yarn Classic (1)</td><td><code>yarn.lock</code></td><td>Custom text.</td></tr>
    <tr><td>Yarn Berry (2/3/4)</td><td><code>yarn.lock</code></td><td>YAML-ish; paired with <code>.yarnrc.yml</code>.</td></tr>
    <tr><td>pnpm</td><td><code>pnpm-lock.yaml</code></td><td>YAML; content-addressable store.</td></tr>
    <tr><td>Bun</td><td><code>bun.lockb</code> (or text <code>bun.lock</code>)</td><td>Binary (historically) — very fast.</td></tr>
  </tbody>
</table>
<ul>
  <li><strong>Commit the lockfile.</strong> It records the exact resolved version + integrity hash for every package, transitive included, so every machine installs the identical tree.</li>
  <li><strong>Pick one manager.</strong> Never commit two lockfiles — npm and Yarn resolve differently and you get drift.</li>
  <li><strong><code>npm ci</code></strong> installs strictly from the lockfile, errors if <code>package.json</code> and the lock disagree, and wipes <code>node_modules</code> first — the correct install for CI and reproducible builds. Yarn's equivalent is <code>yarn install --immutable</code> (Berry) / <code>--frozen-lockfile</code> (Classic).</li>
</ul>

<h3>overrides / resolutions — forcing a transitive version</h3>
<pre><code class="language-json">// npm (7+): overrides
{
  "overrides": {
    "react": "18.3.1",
    "some-lib": { "semver": "7.6.0" }
  }
}

// Yarn: resolutions
{
  "resolutions": {
    "react": "18.3.1",
    "**/react-native-safe-area-context": "4.10.5"
  }
}</code></pre>
<p>Both let you override a version buried deep in the tree that you don't directly depend on. In RN the common reasons are: <strong>dedupe React</strong> so there's exactly one copy (see the invalid-hook-call trap), pin a transitive native dep to a version compatible with your RN, or hotfix a transitive package with a known bug. pnpm uses <code>pnpm.overrides</code>.</p>

<h3>workspaces — monorepos</h3>
<pre><code class="language-json">// root package.json
{
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "workspaces": {
    "packages": ["apps/*", "packages/*"],
    "nohoist": ["**/react-native", "**/react-native/**"]
  }
}</code></pre>
<ul>
  <li><strong>Hoisting:</strong> the workspace root installs shared deps once into the root <code>node_modules</code>, so packages share a single copy — this is what dedupes React across a monorepo.</li>
  <li><strong>nohoist</strong> (Yarn Classic) keeps named packages inside each workspace's own <code>node_modules</code>. RN often needs this because Gradle/CocoaPods and Metro expect certain native packages at a predictable, per-app path.</li>
  <li><strong>Metro must be told about the extra roots:</strong> a hoisted dependency lives outside the app folder, so <code>metro.config.js</code> needs <code>watchFolders</code> pointing at the monorepo root (and often <code>resolver.nodeModulesPaths</code>) or Metro can't resolve/hot-reload it.</li>
</ul>
<pre><code class="language-js">// metro.config.js (monorepo)
const path = require('path');
const monorepoRoot = path.resolve(__dirname, '../..');
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];</code></pre>

<h3>patch-package — the RN escape hatch</h3>
<p>When a dependency ships a bug you can't wait for upstream to fix, you edit the file in <code>node_modules</code>, then run <code>npx patch-package &lt;pkg&gt;</code>. It writes a diff into <code>patches/&lt;pkg&gt;+&lt;version&gt;.patch</code>. Wire <code>postinstall</code> so the patch re-applies on every install:</p>
<pre><code class="language-json">{
  "scripts": { "postinstall": "patch-package" },
  "devDependencies": { "patch-package": "^8.0.0" }
}</code></pre>
<pre><code class="language-bash"># 1. edit node_modules/jail-monkey/.../SomeFile.java
# 2. capture the diff
npx patch-package jail-monkey
# 3. commit patches/jail-monkey+3.0.0.patch</code></pre>
<p>The version in the patch filename is matched against the installed version; if it drifts, patch-package warns the patch may not apply cleanly. Real examples from Prakhar's apps: the <strong>jail-monkey</strong> patch on <em>sw-ticketing</em> that drops a rooted-detection constant to stop an old-arch <code>getConstants()</code> launch crash, and the iOS-launch patches on <em>smart-works-mobile</em>. Patch-package is the standard way to carry those fixes across installs without forking.</p>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — patches + prebuild + config plugins</div>
  <p>patch-package patches JS/native files that live in <code>node_modules</code>, and those survive <code>expo prebuild</code> because they're re-applied on install. But hand-edits inside the generated <code>android/</code> and <code>ios/</code> folders are <strong>wiped by <code>expo prebuild --clean</code></strong> (Continuous Native Generation). For native project changes in a managed/prebuild workflow, use a <strong>config plugin</strong> or <code>expo-build-properties</code> (which sets values like <code>compileSdkVersion</code> / <code>deploymentTarget</code>) rather than editing the folders directly.</p>
</div>

<h3>RN-specific blocks in package.json</h3>
<pre><code class="language-json">{
  "codegenConfig": {
    "name": "AppSpecs",
    "type": "modules",
    "jsSrcsDir": "./specs",
    "android": { "javaPackageName": "com.myapp.specs" }
  },
  "react-native": {
    "ios": { "sourceDir": "./ios" },
    "android": { "sourceDir": "./android" }
  },
  "expo": {
    "install": { "exclude": ["react-native-reanimated"] },
    "autolinking": { "exclude": ["some-native-lib"] }
  }
}</code></pre>
<ul>
  <li><strong><code>codegenConfig</code></strong> — tells RN codegen where the TurboModule / Fabric TypeScript specs live and how to name the generated native artifacts.</li>
  <li><strong><code>react-native</code> field</strong> — a library uses it to declare its native <code>sourceDir</code> for autolinking, or an app can use <code>react-native.config.js</code> for the same.</li>
  <li><strong><code>expo.install.exclude</code></strong> — stop <code>expo install</code>/<code>expo install --check</code> from forcing the SDK-pinned version of a package when you deliberately need a different one; it silences the doctor warning for that package.</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — native module in the wrong section (broken autolinking)</h3>
<pre><code class="language-json">// WRONG — react-native-mmkv is native but lives in devDependencies
{
  "dependencies": { "react": "18.3.1", "react-native": "0.79.5" },
  "devDependencies": { "react-native-mmkv": "2.12.2" }
}
// Autolinking scans dependencies, not devDependencies →
// "TypeError: Cannot read property 'getString' of null" / module not found.
// FIX: move react-native-mmkv into "dependencies".</code></pre>

<h3>Example 2 — caret vs tilde vs exact side by side</h3>
<pre><code class="language-json">{
  "dependencies": {
    "lodash": "^4.17.21",          // JS-only, caret is fine → up to &lt;5.0.0
    "@react-navigation/native": "~6.1.0", // patch-only within 6.1.x
    "react-native": "0.79.5",       // EXACT — never range the RN core
    "react-native-reanimated": "3.16.1" // EXACT — native, must match RN
  }
}</code></pre>

<h3>Example 3 — dedupe React with overrides (fixes invalid hook call)</h3>
<pre><code class="language-json">// A stray second copy of react (pulled by a mislabeled dep) causes
// "Invalid hook call. Hooks can only be called inside a function component."
{
  "overrides": { "react": "18.3.1", "react-dom": "18.3.1" }
}
// Yarn equivalent:
{
  "resolutions": { "react": "18.3.1" }
}</code></pre>

<h3>Example 4 — postinstall wiring for patch-package</h3>
<pre><code class="language-json">{
  "scripts": {
    "postinstall": "patch-package",
    "pod-install": "npx pod-install ios"
  },
  "devDependencies": { "patch-package": "^8.0.0" }
}
// patches/jail-monkey+3.0.0.patch is replayed after every install.</code></pre>

<h3>Example 5 — capturing a patch (the jail-monkey case)</h3>
<pre><code class="language-bash"># Edit the offending file so getConstants() no longer touches the bad constant
vim node_modules/jail-monkey/android/.../JailMonkeyModule.java
# Freeze the change into a committed patch
npx patch-package jail-monkey
# → creates patches/jail-monkey+3.0.0.patch  (git add + commit it)</code></pre>

<h3>Example 6 — monorepo workspaces + nohoist</h3>
<pre><code class="language-json">// root package.json
{
  "private": true,
  "workspaces": {
    "packages": ["apps/mobile", "packages/ui", "packages/shared"],
    "nohoist": ["**/react-native", "**/react-native/**", "**/@react-native/**"]
  }
}</code></pre>

<h3>Example 7 — Metro watchFolders for a hoisted dep</h3>
<pre><code class="language-js">// apps/mobile/metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const config = getDefaultConfig(__dirname);
const workspaceRoot = path.resolve(__dirname, '../..');
config.watchFolders = [workspaceRoot];               // watch shared packages
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
module.exports = config;</code></pre>

<h3>Example 8 — engines + packageManager (Corepack)</h3>
<pre><code class="language-json">{
  "engines": { "node": "&gt;=18.18 &lt;21" },
  "packageManager": "yarn@3.6.4"
}
// "engines" warns/errors on wrong Node; "packageManager" makes Corepack
// use exactly that Yarn version, so everyone installs identically.</code></pre>

<h3>Example 9 — expo install vs npm install</h3>
<pre><code class="language-bash"># WRONG in Expo: may pull a version built for a different RN
npm install react-native-reanimated

# RIGHT: writes the SDK-53-compatible version into package.json
npx expo install react-native-reanimated

# Audit + repair the whole manifest against the SDK
npx expo install --check
npx expo install --fix
npx expo-doctor</code></pre>

<h3>Example 10 — expo.install.exclude</h3>
<pre><code class="language-json">// You intentionally run a newer reanimated than SDK 53 pins.
// Stop expo-doctor / expo install --check from "fixing" it back.
{
  "expo": { "install": { "exclude": ["react-native-reanimated"] } }
}</code></pre>

<h3>Example 11 — reproducible CI install</h3>
<pre><code class="language-bash"># npm — strict, lockfile-only, fails on drift
npm ci
# Yarn Berry equivalent
yarn install --immutable
# pnpm equivalent
pnpm install --frozen-lockfile</code></pre>

<h3>Example 12 — a dev dep that must be a runtime dep</h3>
<pre><code class="language-json">// react-native-gesture-handler is imported at runtime (native) →
// it MUST be a dependency, even though it "felt" like tooling.
{
  "dependencies": {
    "react-native-gesture-handler": "2.24.0",
    "react-native-screens": "3.34.0"
  }
}</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Autolinking only scans dependencies</h3>
<p>A native module in <code>devDependencies</code> (or <code>peerDependencies</code> only) won't be linked into the Gradle/Pods build. Symptom: "Native module not found" / null module at runtime. Move it to <code>dependencies</code>.</p>

<h3>2. 0.x caret semantics</h3>
<p><code>^0.79.5</code> does NOT allow 0.80 — for <code>0.x</code>, caret pins the minor (&gt;=0.79.5 &lt;0.80.0). Since RN lives at 0.x, its minor bumps are breaking. Still, pin RN exactly; don't lean on caret's 0.x rule.</p>

<h3>3. Two lockfiles in one repo</h3>
<p>A stray <code>package-lock.json</code> next to <code>yarn.lock</code> means different tools resolve different trees. Pick one manager, delete the other lockfile, and enforce with <code>packageManager</code> + a <code>preinstall</code> guard (e.g. <code>only-allow yarn</code>).</p>

<h3>4. Lockfile not committed</h3>
<p>Without a committed lockfile, <code>npm install</code> re-resolves ranges every time — your machine, CI, and a teammate can each get different transitive versions. "Works on my machine" native bugs. Always commit it; use <code>npm ci</code> in CI.</p>

<h3>5. postinstall didn't run</h3>
<p>Some CI setups pass <code>--ignore-scripts</code> (a security default) which skips <code>postinstall</code> → patch-package never runs → your patched bug returns in the build. Re-enable scripts for trusted installs or run <code>npx patch-package</code> explicitly as a build step.</p>

<h3>6. Patch version drift</h3>
<p><code>patches/jail-monkey+3.0.0.patch</code> only cleanly applies to 3.0.0. Bump the dependency and patch-package warns the patch may not apply; you must re-create the patch against the new version.</p>

<h3>7. peerDependencies unmet</h3>
<p>npm 7+ auto-installs missing peers (sometimes creating a duplicate); Yarn/pnpm only warn. An RN library expecting <code>react-native</code> as a peer will misbehave if the app's version is outside the peer range — read the warning, don't ignore it.</p>

<h3>8. overrides can hide a real incompatibility</h3>
<p>Forcing a transitive version via <code>overrides</code>/<code>resolutions</code> silences the resolver but can pin a package to something it wasn't tested against. Use it as a targeted fix, document why, and revisit after the upstream release.</p>

<h3>9. Metro can't resolve hoisted monorepo deps</h3>
<p>Hoisting a shared package to the root means it lives outside the app folder. Without <code>watchFolders</code> + <code>nodeModulesPaths</code>, Metro throws "Unable to resolve module" or won't hot-reload edits in the shared package.</p>

<h3>10. nohoist and duplicate native code</h3>
<p>Over-broad <code>nohoist</code> can leave two copies of a native package in different workspaces → duplicate symbols at link time on iOS, or duplicate class errors on Android. Hoist native singletons (react-native, react) to a single copy.</p>

<h3>11. engines is advisory by default</h3>
<p>npm treats <code>engines</code> as a warning unless <code>engine-strict=true</code> in <code>.npmrc</code>. A wrong Node version can still install and then fail cryptically at build. Pin CI's Node to match.</p>

<h3>12. main vs Metro entry confusion</h3>
<p>Metro resolves your app graph from the registered entry (Expo's <code>AppEntry.js</code> / <code>index.js</code> calling <code>registerRootComponent</code> / <code>AppRegistry.registerComponent</code>), not necessarily from <code>main</code>. Changing <code>main</code> alone doesn't repoint the app; other tooling still reads it.</p>

<h3>13. expo install writing a range you didn't expect</h3>
<p><code>expo install</code> may write <code>~53.0.0</code> or an exact pin depending on the package. That's intentional — it's the SDK-tested version. Don't manually widen it to <code>^</code>; you'll drift off the tested set and <code>expo-doctor</code> will flag it.</p>

<h3>14. Pre-release tags won't match normal ranges</h3>
<p><code>^1.0.0</code> will NOT install <code>2.0.0-rc.1</code> — pre-releases only match if you name a range that includes a pre-release at that tuple. To try a canary you opt in explicitly (e.g. <code>react-native@next</code> or an exact <code>-rc</code> version).</p>

<h3>15. optionalDependencies silently missing</h3>
<p><code>fsevents</code> installs on macOS and silently skips on Linux CI. If your code assumes it exists you get a runtime error on CI only. Guard optional deps with a try/require.</p>

<h3>16. dist-tags vs versions</h3>
<p><code>npm install react-native@latest</code> resolves a moving tag, not a fixed version. In an RN app that's risky — prefer an exact version (or <code>expo install</code>) so the lockfile is the pin, not a tag that moved yesterday.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — native module in devDependencies</h3>
<p>Autolinking ignores it, the native code never compiles in, and you burn an hour on a "module not found" that's actually a one-line section move.</p>

<h3>Anti-pattern 2 — caret-ranging react-native or native modules</h3>
<p><code>"react-native": "^0.79.5"</code> invites a fresh install to build against a different RN. Pin the RN core and native modules exactly; let the lockfile hold the line.</p>

<h3>Anti-pattern 3 — not committing the lockfile</h3>
<p>Ranges alone are non-deterministic. Skipping the lockfile means CI and teammates resolve a different tree — the classic source of "works on my machine" native crashes.</p>

<h3>Anti-pattern 4 — mixing package managers</h3>
<p>Running <code>npm install</code> in a Yarn repo (or vice versa) creates a second lockfile and a divergent tree. Commit to one manager and enforce it.</p>

<h3>Anti-pattern 5 — hand-editing node_modules without patch-package</h3>
<p>The edit vanishes on the next <code>npm install</code> / CI build. If you must change a dependency, capture it with <code>patch-package</code> and a <code>postinstall</code> hook so it persists.</p>

<h3>Anti-pattern 6 — editing android/ or ios/ in an Expo prebuild project</h3>
<p>Those folders are regenerated; <code>expo prebuild --clean</code> wipes your changes. Use a config plugin or <code>expo-build-properties</code> instead.</p>

<h3>Anti-pattern 7 — using overrides/resolutions as a permanent crutch</h3>
<p>Force-pinning a transitive dep hides the real version conflict. Fine as a temporary fix, but leave a comment and remove it once upstream ships a compatible release.</p>

<h3>Anti-pattern 8 — duplicate React (invalid hook call)</h3>
<p>A second copy of <code>react</code> in the tree makes hooks throw "Invalid hook call." Dedupe with <code>overrides</code>/<code>resolutions</code> and by keeping <code>react</code> hoisted to one copy in monorepos.</p>

<h3>Anti-pattern 9 — npm install in CI instead of npm ci</h3>
<p><code>npm install</code> may mutate the lockfile mid-build. Use <code>npm ci</code> (or <code>yarn install --immutable</code> / <code>pnpm --frozen-lockfile</code>) so CI installs exactly the committed tree and fails on drift.</p>

<h3>Anti-pattern 10 — running npm install in an Expo app instead of expo install</h3>
<p>You can pull a version incompatible with the SDK. Use <code>expo install</code>, then <code>npx expo install --check</code> / <code>expo-doctor</code> to keep the manifest SDK-aligned.</p>

<h3>Anti-pattern 11 — over-broad nohoist</h3>
<p><code>nohoist: ["**"]</code> defeats deduping and can produce two copies of native singletons → duplicate-symbol link errors. Nohoist only the packages that truly need a per-app path.</p>

<h3>Anti-pattern 12 — forgetting Metro watchFolders in a monorepo</h3>
<p>Shared packages hoisted to the root won't resolve and won't hot-reload. Add <code>watchFolders</code> + <code>nodeModulesPaths</code> to <code>metro.config.js</code>.</p>

<h3>Anti-pattern 13 — depending on @latest / dist-tags</h3>
<p>Installing <code>@latest</code> pins nothing durable. Record an exact version; let the lockfile, not a moving tag, decide what builds.</p>

<h3>Anti-pattern 14 — misusing optionalDependencies for required native code</h3>
<p>An <code>optionalDependency</code> can silently fail to install and your build proceeds without it. Runtime-required native modules belong in <code>dependencies</code>.</p>

<h3>Anti-pattern 15 — bloating dependencies with dev-only tools</h3>
<p>Types, ESLint, Jest, Detox in <code>dependencies</code> enlarge a published package's install and blur intent. Keep build/test/lint tooling in <code>devDependencies</code>.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. dependencies vs devDependencies vs peerDependencies — what goes where in an RN app?</div>
  <div class="qa-answer">
    <p><strong>dependencies</strong>: everything imported at runtime, including all native modules — RN autolinking scans this set to decide what native code to compile. <strong>devDependencies</strong>: build/test/lint-only tools (<code>@types/*</code>, ESLint, Jest, Babel, TypeScript, Detox) that consumers don't need. <strong>peerDependencies</strong>: for library authors — "the host app must provide this," e.g. <code>react</code> and <code>react-native</code>, so there's exactly one copy in the app instead of one bundled per library. <strong>optionalDependencies</strong>: install may fail without aborting (e.g. <code>fsevents</code>).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Why does autolinking make the dependencies section load-bearing?</div>
  <div class="qa-answer">
    <p>RN's autolinking walks <code>dependencies</code> (and transitively their deps) for packages that declare native code — an <code>android/</code> or <code>ios/</code> folder or a <code>react-native.config.js</code> — and wires them into Gradle and CocoaPods automatically. If a native module sits in <code>devDependencies</code>, autolinking never sees it, the native side isn't compiled, and you get a "module not found" at runtime even though the JS import resolves.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Explain caret vs tilde, and why RN pins exact versions.</div>
  <div class="qa-answer">
    <p><code>^1.2.3</code> allows minor + patch (&lt;2.0.0); <code>~1.2.3</code> allows patch only (&lt;1.3.0); a bare <code>1.2.3</code> is exact. JS-only packages tolerate caret because minors are backward-compatible source. A native module's compiled Kotlin/ObjC is built against a specific RN version and its codegen/autolinking contract, so a minor bump can break the native build. That's why RN and native modules are pinned exactly, and why <code>expo install</code> writes SDK-tested versions.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Why does RN sit at 0.x, and what does that mean for caret?</div>
  <div class="qa-answer">
    <p>RN is still pre-1.0 (<code>0.79.5</code>), so by semver's 0.x rule a <strong>minor</strong> bump (0.79 → 0.80) is a breaking release, and <code>^0.79.5</code> only allows &lt;0.80.0. Even with that protection, you pin RN exactly — 0.79.4 → 0.79.5 patches can still shift native behavior, and the lockfile is what actually guarantees the build.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. What is a lockfile and why must it be committed?</div>
  <div class="qa-answer">
    <p><code>package.json</code> declares <em>ranges</em>; the lockfile (<code>package-lock.json</code>, <code>yarn.lock</code>, <code>pnpm-lock.yaml</code>, <code>bun.lockb</code>) records the <em>exact</em> resolved version and integrity hash for every package, transitive included. Committing it makes installs deterministic — every developer, CI job, and build server gets the identical tree. Without it, ranges re-resolve and you get "works on my machine" divergence, which in RN often surfaces as a native crash.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. npm install vs npm ci?</div>
  <div class="qa-answer">
    <p><code>npm install</code> reconciles <code>package.json</code> with the lockfile and may update the lock. <code>npm ci</code> installs strictly from the lockfile, wipes <code>node_modules</code> first, and errors if the lock and manifest disagree — deterministic and faster, so it's the right choice for CI and reproducible builds. Yarn's equivalent is <code>yarn install --immutable</code>; pnpm's is <code>--frozen-lockfile</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. What are overrides / resolutions and when do you use them in RN?</div>
  <div class="qa-answer">
    <p>They force a specific version of a <em>transitive</em> dependency you don't directly depend on — npm calls it <code>overrides</code>, Yarn calls it <code>resolutions</code>, pnpm <code>pnpm.overrides</code>. In RN the common uses are: dedupe <code>react</code> to one copy (fixes "invalid hook call"), pin a transitive native dep to a version compatible with your RN, or hotfix a transitive package with a known bug. Treat it as a targeted, documented fix, not a permanent crutch.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How do workspaces work, and what breaks in RN monorepos?</div>
  <div class="qa-answer">
    <p><code>workspaces</code> lets one repo hold multiple packages; shared deps are hoisted to the root <code>node_modules</code> and shared (this dedupes React). RN complications: native packages sometimes need a predictable per-app path, so you use <strong>nohoist</strong> (Yarn Classic) to keep them local; and hoisted deps live outside the app folder, so Metro needs <code>watchFolders</code> + <code>resolver.nodeModulesPaths</code> pointed at the monorepo root or it can't resolve or hot-reload them.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Walk me through patch-package.</div>
  <div class="qa-answer">
    <ol>
      <li>Edit the buggy file directly in <code>node_modules/&lt;pkg&gt;</code>.</li>
      <li>Run <code>npx patch-package &lt;pkg&gt;</code> — it writes a diff to <code>patches/&lt;pkg&gt;+&lt;version&gt;.patch</code>.</li>
      <li>Commit the patch and add <code>"postinstall": "patch-package"</code> so it re-applies on every install.</li>
    </ol>
    <p>It's the RN escape hatch for shipping a fix before upstream does — e.g. the jail-monkey patch that removes a rooted-detection constant to stop an old-arch launch crash, or iOS-launch patches. The version in the filename is matched to the installed version; on a bump you re-create the patch.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. A dependency ships a native bug and upstream is slow. Options?</div>
  <div class="qa-answer">
    <p>In order of preference: (1) pin/downgrade to a known-good version via the lockfile or an <code>override</code>; (2) <strong>patch-package</strong> the specific file plus a <code>postinstall</code> hook; (3) in an Expo prebuild project, a <strong>config plugin</strong> for native-project changes (never hand-edit <code>android/</code>/<code>ios/</code> — prebuild wipes it); (4) fork the package as a last resort. Patch-package is usually the smallest durable fix.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Why expo install instead of npm install in an Expo app?</div>
  <div class="qa-answer">
    <p><code>expo install</code> resolves the version each SDK was tested against and writes that (often an exact pin or tight range) into <code>package.json</code>, so native modules match the installed RN. <code>npm install</code> resolves the newest in-range version, which can be built for a different RN and crash at native runtime. Validate the manifest with <code>npx expo install --check</code>, repair with <code>npx expo install --fix</code>, and audit the whole project with <code>npx expo-doctor</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. You get "Invalid hook call. Hooks can only be called inside a function component." How is this a package.json problem?</div>
  <div class="qa-answer">
    <p>The most common cause is <strong>two copies of React</strong> in the tree — a library bundled its own, or a monorepo failed to hoist. Dedupe with an <code>overrides</code>/<code>resolutions</code> pin on <code>react</code>, ensure <code>react</code> is a peer (not a direct dep) of your libraries, and in monorepos hoist it to a single root copy. Confirm with <code>npm ls react</code> / <code>yarn why react</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. What's the difference between the main field and the app's Metro entry?</div>
  <div class="qa-answer">
    <p><code>main</code> is the package's nominal entry file, read by tooling and by consumers who <code>require</code> the package. But Metro bundles the app from the registered root component — Expo's <code>node_modules/expo/AppEntry.js</code> or a bare <code>index.js</code> calling <code>AppRegistry.registerComponent</code> / <code>registerRootComponent</code>. Some libraries also add a <code>react-native</code> entry field so bundlers pick RN-specific source over the web <code>main</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. What do engines and packageManager do?</div>
  <div class="qa-answer">
    <p><code>engines</code> declares the required Node (and optionally npm/yarn) — advisory by default in npm unless <code>engine-strict=true</code>. <code>packageManager</code> is the Corepack field pinning the exact manager and version (e.g. <code>yarn@3.6.4</code>), so everyone on the repo installs with the identical tool — closing another source of tree drift beyond the lockfile.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. How would you diagnose a dependency that works locally but fails in CI?</div>
  <div class="qa-answer">
    <ol>
      <li>Check the lockfile is committed and CI uses <code>npm ci</code> / <code>--immutable</code>, not <code>npm install</code>.</li>
      <li>Check <code>--ignore-scripts</code> isn't skipping <code>postinstall</code> (patch-package never ran).</li>
      <li><code>npm ls &lt;pkg&gt;</code> / <code>yarn why &lt;pkg&gt;</code> to spot duplicate or unexpected transitive versions.</li>
      <li>Confirm the section: native module in <code>dependencies</code>, not <code>devDependencies</code> (CI may omit dev deps).</li>
      <li>Match Node via <code>engines</code>, and in Expo run <code>expo-doctor</code> / <code>expo install --check</code>.</li>
    </ol>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You put native modules in <code>dependencies</code> because autolinking scans it.</li>
    <li>You pin RN and native modules exactly, and know caret's 0.x rule.</li>
    <li>You commit the lockfile and use <code>npm ci</code> / <code>--immutable</code> in CI.</li>
    <li>You reach for <code>overrides</code>/<code>resolutions</code> to dedupe React or pin a transitive.</li>
    <li>You can wire patch-package with a <code>postinstall</code> hook and explain when to use it.</li>
    <li>You know monorepos need nohoist for native singletons and Metro <code>watchFolders</code>.</li>
    <li>You use <code>expo install</code> + <code>expo-doctor</code>, not raw <code>npm install</code>, in Expo apps.</li>
    <li>You never hand-edit <code>android/</code>/<code>ios/</code> in a prebuild project.</li>
  </ul>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'revision', title: '⚡ Revision — Points to Remember', collapsible: true, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline"><code>package.json</code> declares intent (ranges + RN config) and the <strong>lockfile records the exact tree</strong>; in RN, <code>dependencies</code> is what autolinking compiles, exact pins protect native code, and <strong>patch-package</strong> is how you carry a dependency fix across installs.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Core fields:</strong> <code>name</code>, <code>version</code>, <code>private: true</code> (apps, required for workspaces), <code>main</code> (Expo <code>AppEntry.js</code> / bare <code>index.js</code>), the <code>react-native</code> entry/config field, <code>scripts</code>, <code>engines</code> (Node), <code>packageManager</code> (Corepack pin).</li>
    <li><strong>Typical scripts:</strong> <code>start</code>, <code>android</code>, <code>ios</code>, <code>pod-install</code>, <code>postinstall</code> (patch-package), <code>test</code>, <code>lint</code>, <code>typecheck</code>, <code>eas:build:*</code> / <code>eas:submit:*</code>. Npm runs <code>pre</code>/<code>post</code> hooks automatically.</li>
    <li><strong>dependencies</strong> = everything at runtime incl. native modules — <strong>autolinking scans it</strong>; <strong>devDependencies</strong> = build/test/lint tools (<code>@types</code>, eslint, jest, babel, typescript, detox); <strong>peerDependencies</strong> = host must provide (react, react-native) so there's one copy; <strong>optionalDependencies</strong> = install may fail without aborting.</li>
    <li><strong>Semver:</strong> <code>^</code> minor+patch (0.x: minor is breaking, so <code>^0.79</code> = &lt;0.80), <code>~</code> patch-only, bare = exact, <code>*</code> = any (peers), <code>||</code> unions, <code>-rc.1</code> pre-releases only match if opted in. Pin RN + native modules exactly — caret on native code is dangerous.</li>
    <li><strong>Lockfiles:</strong> <code>package-lock.json</code> (npm) / <code>yarn.lock</code> / <code>pnpm-lock.yaml</code> / <code>bun.lockb</code> — commit them for deterministic installs; never two in one repo. <code>npm ci</code> (Yarn <code>--immutable</code>, pnpm <code>--frozen-lockfile</code>) installs strictly from the lock in CI.</li>
    <li><strong>overrides (npm) / resolutions (Yarn) / pnpm.overrides:</strong> force a transitive version — dedupe React (fixes invalid hook call), pin a transitive native dep, or hotfix a broken transitive.</li>
    <li><strong>workspaces (monorepo):</strong> hoist shared deps to root (dedupes React); <strong>nohoist</strong> keeps native singletons per-app; Metro needs <code>watchFolders</code> + <code>resolver.nodeModulesPaths</code> for hoisted deps.</li>
    <li><strong>patch-package:</strong> edit <code>node_modules</code> → <code>npx patch-package &lt;pkg&gt;</code> → <code>patches/&lt;pkg&gt;+&lt;ver&gt;.patch</code> → <code>postinstall: patch-package</code> replays it. Real cases: jail-monkey rooted-detection launch crash, iOS-launch patches.</li>
    <li><strong>RN blocks:</strong> <code>codegenConfig</code> (TurboModule/Fabric specs), <code>react-native</code> field (native <code>sourceDir</code>), <code>expo.install.exclude</code> (stop expo install from re-pinning a package).</li>
    <li><strong>Expo:</strong> <code>expo install</code> writes SDK-compatible versions (not <code>npm install</code>); audit with <code>npx expo install --check</code> / <code>expo-doctor</code>, repair with <code>--fix</code>. Prebuild wipes hand-edited <code>android/</code>/<code>ios/</code> — use config plugins / <code>expo-build-properties</code>.</li>
    <li><strong>Pitfalls:</strong> duplicate React → invalid hook call; native module mislabeled as a dev dep; forgetting to commit the lockfile; <code>--ignore-scripts</code> skipping patch-package; caret on native modules; mixing package managers.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Putting a native module in <code>devDependencies</code> (or caret-ranging it).</strong> Autolinking scans <code>dependencies</code> only, so the native code never compiles in — you get "Native module not found" at runtime even though the JS import resolves. Fix: native/runtime deps go in <code>dependencies</code>, pinned exactly (or via <code>expo install</code>), and the lockfile holds the tree.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"package.json declares ranges plus RN config, but the lockfile records the exact tree — commit it and use npm ci so CI, teammates, and build servers install identical code."</div>
  <div class="revision-say">"Native modules go in dependencies because RN autolinking scans that set, and I pin them exactly — a caret can pull native code built for a different RN and crash at launch. In Expo I use expo install so versions match the SDK."</div>
  <div class="revision-say">"When a dependency ships a bug I can't wait on, I patch-package the file and replay it via a postinstall hook — that's how I carried the jail-monkey launch-crash fix without forking."</div>
</div>
`},

{ id: 'checklist', title: '✅ Interview Checklist', collapsible: true, html: `
<div class="callout success">
  <div class="callout-title">Can you answer these before moving on?</div>
  <ul>
    <li>Can you explain why a native module must live in <code>dependencies</code>, and what autolinking does with that section?</li>
    <li>Can you contrast <code>^</code>, <code>~</code>, and exact versions, and say why RN pins native modules exactly?</li>
    <li>Can you explain what a lockfile records, why it's committed, and the difference between <code>npm install</code> and <code>npm ci</code>?</li>
    <li>Can you use <code>overrides</code>/<code>resolutions</code> to dedupe React and describe the invalid-hook-call bug?</li>
    <li>Can you set up a monorepo with <code>workspaces</code>, <code>nohoist</code>, and Metro <code>watchFolders</code>?</li>
    <li>Can you wire patch-package with a <code>postinstall</code> hook and explain when to reach for it?</li>
    <li>Can you say why <code>expo install</code> beats <code>npm install</code> in an Expo app and what <code>expo-doctor</code> checks?</li>
  </ul>
</div>
`}

]
});
