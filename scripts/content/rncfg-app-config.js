window.PREP_SITE.registerTopic({
  id: "rncfg-app-config",
  module: "RN Project & Config (Deep)",
  title: "App Config & Autolinking",
  estimatedReadTime: "25 min",
  tags: ["app-json","app-config-js","app-config-ts","expo-config","config-plugins","prebuild","cng","continuous-native-generation","autolinking","react-native-config-js","react-native.config.js","expo-build-properties","eas","eas-update","expo-constants","runtime-version","react-native","expo-53"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">The Expo <strong>app config</strong> (<code>app.json</code> / <code>app.config.js</code> / <code>app.config.ts</code>) plus <strong>config plugins</strong> generate the native projects at <strong>prebuild</strong> (CNG), and <strong>autolinking</strong> turns <code>package.json</code> dependencies into linked native modules — so you edit config, not <code>android/</code>/<code>ios/</code>.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Static vs dynamic config:</strong> <code>app.json</code> is JSON; <code>app.config.js</code>/<code>.ts</code> export a function that can read <code>process.env</code> and branch per environment. Use <code>export default ({ config }) =&gt; ({ ...config, ... })</code>; the dynamic file <strong>overrides</strong> <code>app.json</code> but must spread <code>...config</code> or it drops those values.</li>
    <li><strong>The <code>expo</code> object:</strong> <code>name</code>, <code>slug</code>, <code>version</code>, <code>orientation</code>, <code>icon</code>, <code>scheme</code> (deep links), <code>userInterfaceStyle</code>, <code>splash</code>/<code>expo-splash-screen</code>, <code>assetBundlePatterns</code>, <code>updates</code>/<code>runtimeVersion</code> (EAS Update/OTA), <code>extra</code> (+ <code>extra.eas.projectId</code>), <code>owner</code>.</li>
    <li><strong>Runtime read:</strong> <code>extra</code> is surfaced to JS via <code>expo-constants</code> — <code>Constants.expoConfig?.extra?.x</code>. It ships in the bundle, so it is <em>not</em> secret.</li>
    <li><strong><code>ios</code> block:</strong> <code>bundleIdentifier</code>, <code>buildNumber</code>, <code>infoPlist</code>, <code>entitlements</code>, <code>supportsTablet</code>. <strong><code>android</code> block:</strong> <code>package</code>, <code>versionCode</code>, <code>permissions</code>, <code>intentFilters</code>, <code>adaptiveIcon</code>. Prebuild writes these into <code>Info.plist</code> / <code>AndroidManifest.xml</code> / Gradle.</li>
    <li><strong>Config plugins</strong> mutate native files during prebuild via mods: <code>withAndroidManifest</code>, <code>withInfoPlist</code>, <code>withXcodeProject</code>, <code>withEntitlementsPlist</code>, and the escape-hatch <code>withDangerousMod</code> (you own idempotency). List them in <code>plugins</code>; pass options with <code>["plugin", { props }]</code>.</li>
    <li><strong>Why plugins beat hand edits:</strong> they re-apply on every <code>expo prebuild</code>, so the change survives <code>--clean</code>, upgrades, and CI. Hand edits to <code>android/</code>/<code>ios/</code> get wiped. <code>expo-build-properties</code> is the plugin for <code>compileSdkVersion</code>/<code>minSdkVersion</code>/<code>deploymentTarget</code>/<code>kotlinVersion</code>.</li>
    <li><strong>CNG / prebuild:</strong> <code>expo prebuild</code> generates <code>android/</code>+<code>ios/</code> from config + plugins, then runs autolinking. <code>--clean</code> wipes first; <code>--platform</code> limits. Native folders can be git-ignored because EAS/prebuild regenerates them.</li>
    <li><strong>Bare RN <code>app.json</code>:</strong> just <code>name</code>+<code>displayName</code>, no <code>expo</code> object. <code>name</code> must match <code>AppRegistry.registerComponent</code> or you get "app not registered".</li>
    <li><strong><code>react-native.config.js</code>:</strong> tunes autolinking — <code>assets</code> (font/asset linking via <code>npx react-native-asset</code>), <code>dependencies</code> overrides (platform <code>null</code> to <strong>exclude</strong>; <code>sourceDir</code>/<code>podspecPath</code> for local modules), <code>project</code> paths for monorepos.</li>
    <li><strong>Autolinking:</strong> RN CLI (and Expo) scan <code>package.json</code> deps, find native packages, and wire them into Gradle (<code>settings.gradle</code>, <code>PackageList</code>) + CocoaPods (Podfile). Inspect with <code>npx react-native config</code>. Install → linked; no manual Gradle/Podfile edits.</li>
    <li><strong><code>runtimeVersion</code></strong> gates OTA: bump it whenever native changes and ship a new build, or EAS Update hands JS to an incompatible binary → crash.</li>
    <li><strong>Prakhar's apps:</strong> <code>sw-mobile</code>/<code>sw-ticketing</code> are Expo 53 prebuild apps — native config via plugins + <code>expo-build-properties</code> (e.g. <code>minSdkVersion 26</code>); <code>FR Kiosk</code> is bare native Android with committed folders.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Hand-editing <code>android/</code>/<code>ios/</code> in a prebuild app</strong> — it works locally, then <code>expo prebuild --clean</code> (or CI/EAS) wipes it and you ship a different app than you tested. Fix: move the edit into a config plugin or <code>expo-build-properties</code>. (Second trap: a dynamic config that forgets <code>...config</code> silently drops every value from <code>app.json</code>.)</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"The app config plus config plugins <em>generate</em> the native projects at prebuild, so I treat <code>android/</code>/<code>ios/</code> as build artifacts and make native changes through plugins or <code>expo-build-properties</code> — that survives <code>prebuild --clean</code>; a hand edit doesn't."</div>
  <div class="revision-say">"I use static <code>app.json</code> until I need env-driven values, then move to <code>app.config.ts</code> and export a function that spreads <code>config</code> and reads <code>process.env</code> for per-environment name and bundle id."</div>
  <div class="revision-say">"Autolinking scans <code>package.json</code> for packages shipping native code and wires them into Gradle and CocoaPods automatically; <code>react-native.config.js</code> is only for excluding or overriding what it discovers."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What "app config" actually is</h3>
<p>Your JavaScript project is not an app. Something has to turn it into an Android <code>.apk</code>/<code>.aab</code> and an iOS <code>.ipa</code> — with a real bundle identifier, a signed manifest, an icon, permissions, and a list of linked native libraries. The <strong>app config</strong> is the single declarative source that describes all of that. In an Expo/prebuild workflow it is literally the input that <em>generates</em> the native projects; in bare RN it is a much thinner file and the native projects are checked into git directly.</p>

<h3>The two config families (don't confuse them)</h3>
<table>
  <thead><tr><th></th><th>Expo app config</th><th>RN CLI config</th></tr></thead>
  <tbody>
    <tr><td>File</td><td><code>app.json</code> / <code>app.config.js</code> / <code>app.config.ts</code></td><td><code>react-native.config.js</code></td></tr>
    <tr><td>Owns</td><td>App identity + native generation (via plugins/prebuild)</td><td>Autolinking behavior + asset linking</td></tr>
    <tr><td>Read by</td><td>Expo CLI, EAS, prebuild, <code>expo-constants</code></td><td><code>@react-native-community/cli</code> (autolinking)</td></tr>
    <tr><td>Top key</td><td><code>expo</code> object</td><td><code>module.exports</code> with <code>dependencies</code>/<code>assets</code></td></tr>
    <tr><td>Present in bare RN?</td><td>Only a minimal <code>app.json</code> (<code>name</code>/<code>displayName</code>)</td><td>Yes, this is its home</td></tr>
  </tbody>
</table>
<p>They can coexist. An Expo prebuild project still uses RN CLI autolinking under the hood, so <code>react-native.config.js</code> can still influence things even in a managed app.</p>

<h3>Why a <em>dynamic</em> config exists</h3>
<p>Static <code>app.json</code> is perfect until you need values that differ per environment or must not be committed: a different <code>name</code>/<code>bundleIdentifier</code> for a "dev" vs "prod" build, an API URL from <code>process.env</code>, a Sentry DSN, an EAS <code>projectId</code> that varies by profile. JSON can't run code, so Expo lets you rename the file to <code>app.config.js</code> or <code>app.config.ts</code> and <strong>export a function</strong> that returns the config object at evaluation time.</p>

<h3>Why config plugins + prebuild exist</h3>
<p>Historically you "ejected" and then hand-edited <code>AndroidManifest.xml</code>, <code>Info.plist</code>, <code>build.gradle</code>, and the Xcode project. That's fragile and un-upgradable. <strong>Config plugins</strong> make those native edits <em>programmatic and repeatable</em>: a plugin is a function that mutates native files every time you prebuild, so the edit is reapplied on every regeneration and survives RN/Expo upgrades. This is the whole point of <strong>Continuous Native Generation</strong> — treat <code>android/</code>/<code>ios/</code> as build artifacts, not source.</p>

<h3>Why autolinking exists</h3>
<p>Before RN 0.60 you ran <code>react-native link</code>, which physically edited your Gradle files and Podfile and frequently corrupted them. <strong>Autolinking</strong> replaced that: the CLI scans <code>node_modules</code> at build time, finds packages that declare native code, and wires them into Gradle (via <code>settings.gradle</code>/<code>app/build.gradle</code>) and CocoaPods (via the generated Podfile) automatically. You install a package and it "just links." <code>react-native.config.js</code> exists for the cases where the automatic discovery needs help or needs to be turned off.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>The "config drives generation" picture</h3>
<div class="diagram">
<pre>
  app.json / app.config.(js|ts)          package.json (dependencies)
        │  expo: { ...identity... }             │
        │  plugins: [ ... ]                      │ autolinking scans
        ▼                                        ▼
   ┌──────────────────── expo prebuild ────────────────────┐
   │  1. write base android/ + ios/ template               │
   │  2. apply each config plugin (mods) in order          │
   │  3. run autolinking → link native deps                │
   └───────────────────────────────────────────────────────┘
        │                                        │
        ▼                                        ▼
   android/                                 ios/
   ├─ AndroidManifest.xml (permissions,     ├─ Info.plist (bundle id,
   │   intentFilters, package)              │   NS*UsageDescription, scheme)
   ├─ build.gradle (compileSdk from         ├─ Podfile (autolinked pods)
   │   expo-build-properties)               ├─ *.entitlements
   └─ settings.gradle (autolinked modules)  └─ *.xcodeproj / *.xcworkspace
</pre>
</div>

<h3>The "who reads what" picture</h3>
<div class="diagram">
<pre>
  app.config.ts ──read by──► Expo CLI / EAS Build / prebuild
       │                              (native generation)
       └──serialized into──► expo-constants
                             Constants.expoConfig.extra.*   (runtime, JS)

  react-native.config.js ──read by──► @react-native-community/cli
                                       (autolinking + react-native-asset)

  bare app.json { name, displayName } ──read by──► AppRegistry / native
                                                   (which JS component to boot)
</pre>
</div>

<h3>The "precedence" picture</h3>
<div class="diagram">
<pre>
  If BOTH exist in the project root:

     app.config.js  ──overrides──►  app.json
     app.config.ts                  (JSON is loaded first, then the
                                     function receives it as { config }
                                     and returns the FINAL object)

  So: JSON = defaults, dynamic file = the last word.
</pre>
</div>

<h3>The "managed vs bare" mental split</h3>
<ul>
  <li><strong>Managed / prebuild (CNG):</strong> <code>android/</code>+<code>ios/</code> are generated and usually git-ignored. You never hand-edit them; you edit <code>app.json</code> + plugins. This is Prakhar's world — <code>sw-mobile</code> and <code>sw-ticketing</code> are Expo 53 prebuild apps.</li>
  <li><strong>Bare RN:</strong> <code>android/</code>+<code>ios/</code> are committed source you edit directly. <code>app.json</code> is a two-line file; <code>react-native.config.js</code> tunes autolinking. This is <code>FR Kiosk</code>'s world (native Android).</li>
</ul>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — the folders are outputs, not inputs</div>
  <p>In a prebuild app, treat <code>android/</code> and <code>ios/</code> like <code>node_modules</code>: regenerable, disposable, and safe to git-ignore. Any manual change you make there is silently discarded the next time someone runs <code>expo prebuild --clean</code>. If you find yourself editing a native file by hand, that edit belongs in a config plugin or in <code>expo-build-properties</code> instead — otherwise CI will build a different app than your laptop does.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1 — <code>app.json</code> (static) vs <code>app.config.js</code>/<code>.ts</code> (dynamic)</h3>
<p>The simplest form is static JSON. Everything lives under the <code>expo</code> key:</p>
<pre><code class="language-json">// app.json
{
  "expo": {
    "name": "SmartWorks",
    "slug": "smartworks",
    "version": "1.4.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "smartworks",
    "userInterfaceStyle": "automatic",
    "owner": "workctrl",
    "runtimeVersion": { "policy": "appVersion" },
    "updates": { "url": "https://u.expo.dev/your-project-id" },
    "extra": { "apiUrl": "https://api.prod.example.com", "eas": { "projectId": "your-project-id" } }
  }
}</code></pre>

<p>When you need code — env vars, per-environment identity, secrets — rename to <code>app.config.js</code> or <code>app.config.ts</code> and export a function. Expo loads <code>app.json</code> first, then calls your function with that parsed object as <code>{ config }</code>, and uses whatever you return:</p>
<pre><code class="language-ts">// app.config.ts
import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig =&gt; {
  const isDev = process.env.APP_ENV !== 'production';
  return {
    ...config,                                  // inherit app.json values
    name: isDev ? 'SmartWorks (Dev)' : 'SmartWorks',
    slug: 'smartworks',
    ios: {
      ...config.ios,
      bundleIdentifier: isDev ? 'tech.workctrl.sw.dev' : 'tech.workctrl.sw',
    },
    android: {
      ...config.android,
      package: isDev ? 'tech.workctrl.sw.dev' : 'tech.workctrl.sw',
    },
    extra: {
      apiUrl: process.env.API_URL,              // read at config-eval time
      eas: { projectId: process.env.EAS_PROJECT_ID },
    },
  };
};</code></pre>

<div class="callout info">
  <div class="callout-title">Precedence, precisely</div>
  <p>If <strong>both</strong> <code>app.json</code> and <code>app.config.js</code>/<code>.ts</code> exist, the dynamic file <strong>wins</strong> — but only because it explicitly receives and spreads <code>config</code>. If you forget <code>...config</code>, you drop everything from <code>app.json</code>. Between <code>app.config.js</code> and <code>app.config.ts</code>, pick one; don't ship both.</p>
</div>

<h3>2 — The Expo config object, field by field</h3>
<table>
  <thead><tr><th>Field</th><th>What it controls</th></tr></thead>
  <tbody>
    <tr><td><code>name</code></td><td>Display name shown under the icon (feeds Android <code>app_name</code> / iOS <code>CFBundleDisplayName</code>).</td></tr>
    <tr><td><code>slug</code></td><td>URL-safe project name; part of the EAS project identity.</td></tr>
    <tr><td><code>version</code></td><td>Human version string (<code>CFBundleShortVersionString</code> / <code>versionName</code>).</td></tr>
    <tr><td><code>orientation</code></td><td><code>portrait</code> / <code>landscape</code> / <code>default</code>.</td></tr>
    <tr><td><code>icon</code></td><td>Master icon asset; prebuild generates per-density outputs.</td></tr>
    <tr><td><code>scheme</code></td><td>Custom URL scheme for deep links (e.g. <code>smartworks://</code>); written to the manifest/plist.</td></tr>
    <tr><td><code>userInterfaceStyle</code></td><td><code>automatic</code> / <code>light</code> / <code>dark</code> — the OS appearance the app opts into.</td></tr>
    <tr><td><code>splash</code></td><td>Legacy splash config; modern apps use the <code>expo-splash-screen</code> plugin.</td></tr>
    <tr><td><code>assetBundlePatterns</code></td><td>Globs of assets bundled into the binary (so they're available offline/OTA).</td></tr>
    <tr><td><code>updates</code> / <code>runtimeVersion</code></td><td>EAS Update (OTA) endpoint + the runtime-version fence that decides which native binary an OTA update is compatible with.</td></tr>
    <tr><td><code>extra</code></td><td>Arbitrary values surfaced to JS at runtime via <code>expo-constants</code>. Holds <code>extra.eas.projectId</code>.</td></tr>
    <tr><td><code>owner</code></td><td>The Expo account/organization that owns the project (matters for EAS).</td></tr>
  </tbody>
</table>

<p>Read <code>extra</code> at runtime with <code>expo-constants</code>:</p>
<pre><code class="language-ts">import Constants from 'expo-constants';

const apiUrl = Constants.expoConfig?.extra?.apiUrl;
const projectId = Constants.expoConfig?.extra?.eas?.projectId;</code></pre>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — runtimeVersion is the OTA safety fence</div>
  <p>EAS Update only delivers a JS bundle to a binary whose <code>runtimeVersion</code> matches. If you add or upgrade a native module (new native code) but keep the same <code>runtimeVersion</code>, an OTA push can hand a JS bundle to a binary that lacks that native code → crash. Bump <code>runtimeVersion</code> (or use a policy like <code>appVersion</code>/<code>fingerprint</code>) whenever native changes, and ship a new build.</p>
</div>

<h3>3 — The <code>ios</code> and <code>android</code> blocks</h3>
<pre><code class="language-json">{
  "expo": {
    "ios": {
      "bundleIdentifier": "tech.workctrl.sw",
      "buildNumber": "42",
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "Scan visitor QR codes",
        "NSLocationWhenInUseUsageDescription": "Check you in at the office"
      },
      "entitlements": { "aps-environment": "production" }
    },
    "android": {
      "package": "tech.workctrl.sw",
      "versionCode": 42,
      "permissions": ["CAMERA", "ACCESS_FINE_LOCATION"],
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#E5860B"
      },
      "intentFilters": [{
        "action": "VIEW",
        "data": [{ "scheme": "https", "host": "app.workctrl.tech" }],
        "category": ["BROWSABLE", "DEFAULT"]
      }]
    }
  }
}</code></pre>
<p>At prebuild these become concrete native files: <code>ios.infoPlist</code> keys land in <code>Info.plist</code>, <code>ios.entitlements</code> land in the <code>.entitlements</code> file, <code>android.permissions</code> become <code>&lt;uses-permission&gt;</code> lines in <code>AndroidManifest.xml</code>, and <code>android.intentFilters</code> become <code>&lt;intent-filter&gt;</code> blocks (deep/App Links). Cross-reference the native manifest and Info.plist topics for exactly what the generated output looks like.</p>

<h3>4 — <code>plugins</code> array + Config Plugins</h3>
<p>A <strong>config plugin</strong> is a JavaScript function that receives the config object and returns it modified, typically after registering <em>mods</em> that mutate native files during prebuild. You list plugins (built-in or community) in the <code>plugins</code> array. A bare string uses defaults; a <code>[name, props]</code> tuple passes options:</p>
<pre><code class="language-json">{
  "expo": {
    "plugins": [
      "expo-secure-store",
      ["expo-splash-screen", { "backgroundColor": "#0B0B0F", "image": "./assets/splash.png" }],
      ["expo-build-properties", {
        "android": { "compileSdkVersion": 35, "targetSdkVersion": 35, "minSdkVersion": 26 },
        "ios": { "deploymentTarget": "15.1", "useFrameworks": "static" }
      }]
    ]
  }
}</code></pre>

<p>Under the hood, plugins compose small mod functions. The common ones:</p>
<ul>
  <li><code>withAndroidManifest</code> — edit the parsed <code>AndroidManifest.xml</code> (add permissions, meta-data, activities).</li>
  <li><code>withInfoPlist</code> — set <code>Info.plist</code> keys (usage strings, URL types).</li>
  <li><code>withXcodeProject</code> — mutate the <code>.pbxproj</code> (build phases, capabilities, files).</li>
  <li><code>withStringsXml</code> / <code>withColorsXml</code> / <code>withGradleProperties</code> — Android resource + Gradle tweaks.</li>
  <li><code>withEntitlementsPlist</code> — iOS entitlements.</li>
  <li><code>withDangerousMod</code> — an escape hatch that runs arbitrary file-system code against the generated project (e.g. write a raw file). Called "dangerous" because it isn't a structured/idempotent mod — you own correctness and re-runnability.</li>
</ul>

<p>A minimal local plugin looks like this:</p>
<pre><code class="language-js">// plugins/withCustomManifest.js
const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withCustomManifest(config) {
  return withAndroidManifest(config, (cfg) =&gt; {
    const app = cfg.modResults.manifest.application[0];
    app.$['android:largeHeap'] = 'true';
    return cfg;
  });
};</code></pre>
<pre><code class="language-json">{ "expo": { "plugins": ["./plugins/withCustomManifest"] } }</code></pre>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — this is the RIGHT way to edit native config</div>
  <p>Say you need <code>android:largeHeap</code>, a new <code>Info.plist</code> key, or a bumped <code>minSdkVersion</code>. Hand-editing <code>AndroidManifest.xml</code>/<code>Info.plist</code>/<code>build.gradle</code> works until the next <code>expo prebuild --clean</code> wipes it. A config plugin (or <code>expo-build-properties</code> for SDK/deployment-target/NDK/Kotlin values) re-applies the edit on <em>every</em> regeneration, so it survives prebuild, upgrades, and CI. Many native libraries ship their own plugin — you just add it to <code>plugins</code> and prebuild wires the native side for you. Prakhar's Expo 53 apps use exactly this: e.g. <code>expo-build-properties</code> to hold <code>minSdkVersion 26</code> for the VAPT remediation instead of touching Gradle.</p>
</div>

<h3>5 — Continuous Native Generation / <code>expo prebuild</code></h3>
<p><code>expo prebuild</code> is the command that turns your app config + plugins into real native projects:</p>
<pre><code class="language-bash"># Generate/refresh android/ + ios/ from app config + plugins
npx expo prebuild

# Wipe and regenerate from scratch (discards any hand edits)
npx expo prebuild --clean

# Only one platform
npx expo prebuild --platform android
npx expo prebuild --platform ios</code></pre>
<p>Sequence of events: prebuild lays down a base template for each platform, applies each config plugin's mods in order, then runs autolinking so native dependencies are linked into Gradle/Pods. Because the whole folder is reproducible from committed inputs, teams often add <code>/android</code> and <code>/ios</code> to <code>.gitignore</code> and let EAS Build (or a local prebuild step) regenerate them. <code>eas build</code> runs prebuild for you in the cloud.</p>

<h3>6 — Bare RN <code>app.json</code></h3>
<p>A non-Expo RN app has an <code>app.json</code> too, but it's tiny and has <strong>no <code>expo</code> object</strong>:</p>
<pre><code class="language-json">// app.json (bare RN)
{
  "name": "FRKiosk",
  "displayName": "FR Kiosk"
}</code></pre>
<p><code>name</code> is the key the native side registers the root component under — it must match the string passed to <code>AppRegistry.registerComponent(appName, () =&gt; App)</code> in <code>index.js</code>. <code>displayName</code> seeds the launcher label. That's it; everything else (bundle id, permissions, SDK versions) lives directly in the committed <code>android/</code>+<code>ios/</code> files.</p>

<h3>7 — <code>react-native.config.js</code> (bare-RN autolinking control)</h3>
<pre><code class="language-js">// react-native.config.js
module.exports = {
  // Font/asset linking targets for: npx react-native-asset
  assets: ['./assets/fonts'],

  dependencies: {
    // Exclude a package from autolinking on a platform (or entirely)
    'some-broken-lib': {
      platforms: { android: null, ios: null },  // null = do not autolink
    },
    // Point autolinking at a non-standard native source dir
    'my-local-module': {
      root: './modules/my-local-module',
      platforms: {
        android: { sourceDir: './modules/my-local-module/android' },
        ios: { podspecPath: './modules/my-local-module/MyLocalModule.podspec' },
      },
    },
  },

  // Tell the CLI where the app's native projects live (monorepos, custom layout)
  project: {
    ios: { sourcePath: './ios' },
    android: { sourceDir: './android' },
  },
};</code></pre>
<p>Three jobs here: (1) <code>assets</code> lists folders that <code>npx react-native-asset</code> copies/links (fonts, images) into both native projects — the modern replacement for the old <code>react-native link</code> asset step; (2) <code>dependencies</code> overrides autolinking per package — set a platform to <code>null</code> to <strong>exclude</strong> a misbehaving library, or point at a custom <code>sourceDir</code>/<code>podspecPath</code> for a local module; (3) <code>project</code> tells the CLI where your native folders are when they aren't in the default location.</p>

<h3>8 — Autolinking (the JS half)</h3>
<p>Autolinking is run by <code>@react-native-community/cli</code>. You can see exactly what it resolves:</p>
<pre><code class="language-bash">npx react-native config     # prints the resolved dependency graph the CLI will link</code></pre>
<p>How discovery works: the CLI walks <code>package.json</code> dependencies, and for each package checks whether it declares native code (an <code>android/</code> folder with a Gradle module, an <code>ios/</code> podspec, or a <code>react-native.config.js</code>/<code>package.json#react-native</code> hint). Matching packages are then injected:</p>
<ul>
  <li><strong>Android:</strong> the CLI's Gradle plugin reads the resolved list and adds each module in <code>settings.gradle</code> + <code>app/build.gradle</code>, and generates <code>PackageList</code> so the native <code>ReactPackage</code>s are registered.</li>
  <li><strong>iOS:</strong> the generated <code>Podfile</code> calls the autolinking helper, which adds a <code>pod</code> entry per discovered library; <code>npx pod-install</code> then fetches them.</li>
</ul>
<p>Expo projects use Expo's autolinking on top of this, but the model is the same: install a package → it's discovered from <code>package.json</code> → its native code is linked at build time. Cross-reference the native (Gradle/CocoaPods/PackageList) topics for the native half of this pipeline.</p>

<div class="callout note">
  <div class="callout-title">Rule of thumb</div>
  <p>You almost never hand-edit Gradle or the Podfile to add a library — you <code>npm install</code> it and rebuild. You touch <code>react-native.config.js</code> only to <em>exclude</em> a library, point at a <em>local</em> module, or fix a monorepo path. In managed Expo you go one further: even the exclude/override lives in config, not in the (regenerated) native files.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — Per-environment identity with <code>app.config.ts</code></h3>
<pre><code class="language-ts">// app.config.ts — dev vs prod get different name + bundle id
import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig =&gt; {
  const prod = process.env.APP_ENV === 'production';
  return {
    ...config,
    name: prod ? 'SmartWorks' : 'SmartWorks Dev',
    ios: { ...config.ios, bundleIdentifier: prod ? 'tech.workctrl.sw' : 'tech.workctrl.sw.dev' },
    android: { ...config.android, package: prod ? 'tech.workctrl.sw' : 'tech.workctrl.sw.dev' },
  };
};</code></pre>
<p>Different <code>bundleIdentifier</code>/<code>package</code> means dev and prod install side-by-side on one device — invaluable for QA.</p>

<h3>Example 2 — Secret from env into <code>extra</code>, read via <code>expo-constants</code></h3>
<pre><code class="language-ts">// app.config.ts
export default ({ config }) =&gt; ({
  ...config,
  extra: { ...config.extra, sentryDsn: process.env.SENTRY_DSN },
});</code></pre>
<pre><code class="language-ts">// somewhere in JS
import Constants from 'expo-constants';
const dsn = Constants.expoConfig?.extra?.sentryDsn;</code></pre>

<h3>Example 3 — <code>plugins</code> with props (build properties)</h3>
<pre><code class="language-json">{
  "expo": {
    "plugins": [
      ["expo-build-properties", {
        "android": { "minSdkVersion": 26, "compileSdkVersion": 35, "kotlinVersion": "1.9.24" },
        "ios": { "deploymentTarget": "15.1" }
      }]
    ]
  }
}</code></pre>
<p>This is how you raise <code>minSdkVersion</code> to 26 (a VAPT-remediation requirement in <code>sw-mobile</code>) <em>without</em> editing <code>android/build.gradle</code> — the plugin re-applies it on every prebuild.</p>

<h3>Example 4 — A tiny local config plugin (Info.plist)</h3>
<pre><code class="language-js">// plugins/withNsdUsage.js
const { withInfoPlist } = require('expo/config-plugins');

module.exports = (config) =&gt; withInfoPlist(config, (cfg) =&gt; {
  cfg.modResults.NSLocalNetworkUsageDescription = 'Discover nearby meeting-room tablets';
  return cfg;
});</code></pre>
<pre><code class="language-json">{ "expo": { "plugins": ["./plugins/withNsdUsage"] } }</code></pre>

<h3>Example 5 — <code>withDangerousMod</code> to write a raw file</h3>
<pre><code class="language-js">const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = (config) =&gt; withDangerousMod(config, ['android', (cfg) =&gt; {
  const dir = path.join(cfg.modRequest.platformProjectRoot, 'app/src/main/res/raw');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'network_security_config.xml'), '&lt;network-security-config/&gt;');
  return cfg;
}]);</code></pre>
<p>Use only when no structured mod exists — you're responsible for making it idempotent across prebuilds.</p>

<h3>Example 6 — Deep-link scheme + Android App Links</h3>
<pre><code class="language-json">{
  "expo": {
    "scheme": "smartworks",
    "android": {
      "intentFilters": [{
        "autoVerify": true,
        "action": "VIEW",
        "data": [{ "scheme": "https", "host": "app.workctrl.tech", "pathPrefix": "/booking" }],
        "category": ["BROWSABLE", "DEFAULT"]
      }]
    }
  }
}</code></pre>

<h3>Example 7 — Bare RN <code>app.json</code> + matching AppRegistry</h3>
<pre><code class="language-json">// app.json
{ "name": "FRKiosk", "displayName": "FR Kiosk" }</code></pre>
<pre><code class="language-js">// index.js — the name MUST match app.json "name"
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
AppRegistry.registerComponent(appName, () =&gt; App);</code></pre>

<h3>Example 8 — Exclude a library from autolinking (bare RN)</h3>
<pre><code class="language-js">// react-native.config.js
module.exports = {
  dependencies: {
    'react-native-flipper': { platforms: { ios: null } },  // skip on iOS only
  },
};</code></pre>

<h3>Example 9 — Font linking via <code>react-native-asset</code></h3>
<pre><code class="language-js">// react-native.config.js
module.exports = { assets: ['./assets/fonts'] };</code></pre>
<pre><code class="language-bash">npx react-native-asset      # copies fonts into android + ios, updates Info.plist UIAppFonts</code></pre>

<h3>Example 10 — Inspect what autolinking resolved</h3>
<pre><code class="language-bash">npx react-native config | less     # bare RN: full resolved dependency graph
npx expo config --type prebuild    # Expo: the fully-evaluated config prebuild will use</code></pre>

<h3>Example 11 — EAS projectId in <code>extra.eas</code></h3>
<pre><code class="language-json">{ "expo": { "extra": { "eas": { "projectId": "5f2e...-...-...." } } } }</code></pre>
<p><code>eas init</code> writes this; EAS Build/Update read it to identify the project. In a dynamic config, source it from <code>process.env.EAS_PROJECT_ID</code> so it isn't hardcoded.</p>

<h3>Example 12 — Local native module wired through <code>react-native.config.js</code></h3>
<pre><code class="language-js">module.exports = {
  dependencies: {
    'kiosk-lock': {
      root: './modules/kiosk-lock',
      platforms: {
        android: { sourceDir: './modules/kiosk-lock/android', packageImportPath: 'import tech.workctrl.kiosk.KioskLockPackage;' },
      },
    },
  },
};</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. Both <code>app.json</code> and <code>app.config.js</code> present</h3>
<p>The dynamic file wins, but only if it spreads <code>...config</code>. Forgetting the spread silently drops every value from <code>app.json</code>. Symptom: your icon/name/plugins vanish after adding a dynamic config.</p>

<h3>2. Editing <code>android/</code>/<code>ios/</code> in a prebuild app</h3>
<p>Your change works locally, then disappears in CI or after <code>expo prebuild --clean</code>. Move the edit into a config plugin. If <code>android/</code>/<code>ios/</code> are git-ignored, hand edits aren't even committed — a classic "works on my machine" trap.</p>

<h3>3. <code>extra</code> read as undefined at runtime</h3>
<p><code>Constants.expoConfig</code> can be <code>null</code> in some contexts (older <code>Constants.manifest</code> vs newer <code>Constants.expoConfig</code>). Always optional-chain: <code>Constants.expoConfig?.extra?.x</code>. Values are frozen at build/eval time — changing <code>.env</code> without rebuilding won't update them.</p>

<h3>4. Secrets in <code>extra</code> are NOT secret</h3>
<p>Anything in <code>extra</code> ships inside the JS bundle and is trivially extractable. It's fine for public config (API base URL, project id) but never for private keys. Real secrets belong in EAS secrets / server-side.</p>

<h3>5. <code>runtimeVersion</code> mismatch after native change</h3>
<p>Add a native module but push only an OTA JS update against the same <code>runtimeVersion</code> → the running binary lacks the native code the JS expects → crash. Bump <code>runtimeVersion</code> and ship a new build whenever native changes.</p>

<h3>6. Plugin order matters</h3>
<p>Plugins run top-to-bottom. Two plugins editing the same manifest node can stomp each other; the later one wins. If a plugin depends on another's output, order it after.</p>

<h3>7. <code>ios.buildNumber</code> / <code>android.versionCode</code> not bumped</h3>
<p>Stores reject a re-upload with the same build number/version code. These live in the config (or are auto-incremented by EAS). Forgetting to bump is a common CI failure.</p>

<h3>8. Autolinking picks up a transitive/duplicate native lib</h3>
<p>Two packages depending on different versions of the same native module cause duplicate-symbol or Gradle conflicts. Inspect with <code>npx react-native config</code> and dedupe, or exclude one via <code>dependencies.*.platforms = null</code>.</p>

<h3>9. Forgot <code>npx pod-install</code> after adding a library (bare RN)</h3>
<p>Autolinking updates the Podfile logic, but you still must run <code>npx pod-install</code>/<code>cd ios &amp;&amp; pod install</code> to actually fetch the pods. JS reload won't surface a new native module.</p>

<h3>10. <code>react-native-asset</code> vs the deprecated <code>react-native link assets</code></h3>
<p>The old <code>react-native link</code> is gone for modules but the <em>asset</em> step migrated to the separate <code>react-native-asset</code> package. Fonts declared in <code>react-native.config.js</code> <code>assets</code> only link when you run that tool.</p>

<h3>11. Expo config plugin can't do everything a bare edit can</h3>
<p>Some deep Xcode project changes are painful via <code>withXcodeProject</code>. When a structured mod doesn't exist you fall back to <code>withDangerousMod</code> — powerful but you own idempotency, and a non-idempotent dangerous mod corrupts the project on the second prebuild.</p>

<h3>12. <code>scheme</code> collisions</h3>
<p>Two apps claiming the same custom scheme means the OS routes the link ambiguously. Namespace your scheme (e.g. <code>smartworks</code>, not <code>app</code>).</p>

<h3>13. Monorepo autolinking can't find packages</h3>
<p>Hoisted <code>node_modules</code> or a custom layout can hide native packages from the CLI. Fix with the <code>project</code>/<code>dependencies</code> overrides in <code>react-native.config.js</code>, or Expo's autolinking search-paths config.</p>

<h3>14. <code>slug</code>/<code>owner</code>/<code>projectId</code> drift</h3>
<p>If <code>slug</code>/<code>owner</code> or <code>extra.eas.projectId</code> don't match the actual Expo project, EAS Build/Update target the wrong project or fail auth. Keep them in sync (<code>eas init</code> manages <code>projectId</code>).</p>

<h3>15. <code>app.config.ts</code> import types</h3>
<p>Import <code>ExpoConfig</code>/<code>ConfigContext</code> from <code>expo/config</code>. A wrong import path or returning a non-<code>ExpoConfig</code> shape yields cryptic "invalid config" errors at prebuild.</p>

<h3>16. Static analysis can't evaluate a dynamic config</h3>
<p>Tools/CI that expect static <code>app.json</code> may fail against <code>app.config.ts</code> if required env vars are missing at eval time. Provide sane defaults so <code>npx expo config</code> never throws.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — hand-editing <code>android/</code>/<code>ios/</code> in a prebuild app</h3>
<p>The single biggest CNG mistake. The edit survives until the next <code>--clean</code> and then vanishes. Always encode native config as a plugin or <code>expo-build-properties</code>.</p>

<h3>Anti-pattern 2 — forgetting <code>...config</code> in a dynamic config</h3>
<p>Returning a fresh object without spreading the incoming <code>config</code> silently discards everything from <code>app.json</code>. Always start from <code>...config</code>.</p>

<h3>Anti-pattern 3 — putting secrets in <code>extra</code></h3>
<p><code>extra</code> ships in the bundle and is readable by anyone. Private keys/tokens belong in EAS secrets or a backend, never in the config object.</p>

<h3>Anti-pattern 4 — not bumping <code>runtimeVersion</code> after native changes</h3>
<p>OTA-pushing JS that assumes new native code to an old binary crashes users. Native change → new <code>runtimeVersion</code> → new build.</p>

<h3>Anti-pattern 5 — hardcoding <code>projectId</code>/env into static JSON</h3>
<p>Ties one build to one environment. Move per-env values into <code>app.config.ts</code> reading <code>process.env</code>.</p>

<h3>Anti-pattern 6 — <code>react-native link</code> muscle memory</h3>
<p>Manually linking (old <code>react-native link</code>, hand-editing Gradle/Podfile) fights autolinking and creates duplicate entries. Trust autolinking; use <code>react-native.config.js</code> only to override.</p>

<h3>Anti-pattern 7 — committing generated <code>android/</code>/<code>ios/</code> AND editing config</h3>
<p>Pick a model. Either the native folders are generated (git-ignored, config is truth) or committed (you edit them directly). Doing both means edits and regenerations silently disagree.</p>

<h3>Anti-pattern 8 — a non-idempotent <code>withDangerousMod</code></h3>
<p>Appending to a file on every prebuild duplicates content across runs. Dangerous mods must check-then-write so a second prebuild is a no-op.</p>

<h3>Anti-pattern 9 — mismatched bare-RN <code>app.json</code> <code>name</code></h3>
<p>If <code>name</code> ≠ the string in <code>AppRegistry.registerComponent</code>, the app boots to a red screen ("app has not been registered"). Keep them identical.</p>

<h3>Anti-pattern 10 — shipping both <code>app.config.js</code> and <code>app.config.ts</code></h3>
<p>Ambiguous which one Expo loads. Keep exactly one dynamic config.</p>

<h3>Anti-pattern 11 — huge/unbounded <code>assetBundlePatterns</code></h3>
<p>Globbing your whole repo into the binary bloats app size. Bundle only assets you actually need offline.</p>

<h3>Anti-pattern 12 — assuming Expo Go loads your config plugin's native code</h3>
<p>Config plugins mutate a <em>prebuilt</em> project — Expo Go can't run arbitrary native code. Use a Dev Client / real build to test plugin output.</p>

<h3>Anti-pattern 13 — leaving a broken lib autolinked</h3>
<p>A library that fails to build blocks the whole app. Exclude it cleanly with <code>platforms: { android: null, ios: null }</code> instead of commenting out Gradle lines that regenerate.</p>

<h3>Anti-pattern 14 — trusting <code>.env</code> changes without rebuild</h3>
<p>Config is evaluated at build/prebuild time; runtime <code>.env</code> edits don't reach <code>extra</code>. Rebuild (or re-prebuild) after changing env values that feed the config.</p>

<h3>Anti-pattern 15 — diverging iOS/Android identity by accident</h3>
<p>Setting a different <code>bundleIdentifier</code> than <code>package</code> unintentionally (typo) fragments analytics/push. Keep them deliberately in sync unless you mean to split dev/prod.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. What is the difference between <code>app.json</code>, <code>app.config.js</code>, and <code>app.config.ts</code>?</div>
  <div class="qa-answer">
    <p><code>app.json</code> is static JSON — no logic. <code>app.config.js</code>/<code>.ts</code> are dynamic: they export a function (or object) evaluated at config time, so they can read <code>process.env</code>, branch on environment, and return the config programmatically. You reach for the dynamic form when identity/values differ per environment (dev vs prod name/bundle id) or come from env/secrets. If both exist, the dynamic file receives the parsed JSON as <code>{ config }</code> and its return value wins — it must spread <code>...config</code> to keep the JSON values.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. What is a config plugin and when does it run?</div>
  <div class="qa-answer">
    <p>A config plugin is a JS function that mutates native project files during <strong>prebuild</strong>. It composes mods like <code>withAndroidManifest</code>, <code>withInfoPlist</code>, <code>withXcodeProject</code>, <code>withEntitlementsPlist</code>, and the escape-hatch <code>withDangerousMod</code>. It runs every time <code>expo prebuild</code> regenerates <code>android/</code>/<code>ios/</code>, which is exactly why it's the correct way to make native edits in a managed app — the change is re-applied on every regeneration instead of being wiped.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Why is hand-editing <code>android/</code>/<code>ios/</code> discouraged in an Expo/prebuild app?</div>
  <div class="qa-answer">
    <p>Because those folders are <em>generated</em>. Continuous Native Generation treats them as build artifacts produced from <code>app.json</code> + plugins. <code>expo prebuild --clean</code> deletes and regenerates them, so any manual edit is lost — and if they're git-ignored, the edit isn't even committed. The durable place for a native change is a config plugin, or <code>expo-build-properties</code> for SDK/deployment-target-style values.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. What is Continuous Native Generation (CNG)?</div>
  <div class="qa-answer">
    <p>The model where <code>android/</code>+<code>ios/</code> are continuously (re)generated from your app config and plugins via <code>expo prebuild</code>, rather than being hand-maintained source. It means native folders can be git-ignored, upgrades are less painful (regenerate from the new template), and CI/EAS can build reproducibly from committed inputs. Flags: <code>--clean</code> (wipe first), <code>--platform android|ios</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. What is <code>expo-build-properties</code> for?</div>
  <div class="qa-answer">
    <p>It's a config plugin that sets low-level native build values you'd otherwise edit in Gradle/Podfile — <code>compileSdkVersion</code>, <code>targetSdkVersion</code>, <code>minSdkVersion</code>, <code>kotlinVersion</code>, NDK, iOS <code>deploymentTarget</code>, <code>useFrameworks</code>. You pass them as plugin props in the <code>plugins</code> array, and prebuild applies them every regeneration. Example: raising <code>minSdkVersion</code> to 26 for a security requirement without touching <code>build.gradle</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How do you pass options to a plugin?</div>
  <div class="qa-answer">
    <p>Use the tuple form in the <code>plugins</code> array: <code>["plugin-name", { ...props }]</code>. A bare string uses defaults; the array form passes a props object the plugin reads. You can list local plugins by relative path (<code>"./plugins/withThing"</code>) and pass them props the same way.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. What is autolinking and how does it discover native modules?</div>
  <div class="qa-answer">
    <p>Autolinking (RN 0.60+) is run by <code>@react-native-community/cli</code>: it scans <code>package.json</code> dependencies, detects packages shipping native code (Gradle module, podspec, or a <code>react-native.config.js</code>/<code>package.json#react-native</code> hint), and injects them into the Android Gradle build (<code>settings.gradle</code>, generated <code>PackageList</code>) and iOS Podfile automatically. So installing a package links it — no manual Xcode/Gradle wiring. Inspect the result with <code>npx react-native config</code>. Expo layers its own autolinking on top with the same model.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. What does <code>react-native.config.js</code> do?</div>
  <div class="qa-answer">
    <p>It's the bare-RN config for the community CLI. Three jobs: (1) <code>assets</code> — folders that <code>npx react-native-asset</code> links (fonts/images) into both platforms; (2) <code>dependencies</code> — per-package autolinking overrides: set a platform to <code>null</code> to exclude a library, or point at a custom <code>sourceDir</code>/<code>podspecPath</code> for a local module; (3) <code>project</code> — where the native folders live (monorepos/custom layouts).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. How do you exclude a library from autolinking?</div>
  <div class="qa-answer">
    <p>In <code>react-native.config.js</code>, set the package's platform(s) to <code>null</code>: <code>dependencies: { 'lib': { platforms: { android: null, ios: null } } }</code>. This is the clean way to skip a broken/unwanted native lib instead of deleting regenerated Gradle/Podfile lines by hand.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. What's in a bare-RN <code>app.json</code> vs an Expo one?</div>
  <div class="qa-answer">
    <p>Bare RN: just <code>{ "name", "displayName" }</code> — no <code>expo</code> object. <code>name</code> is the identifier <code>AppRegistry.registerComponent</code> must match to boot the root component; <code>displayName</code> is the launcher label. Expo: everything lives under the <code>expo</code> key (identity, <code>ios</code>/<code>android</code> blocks, <code>plugins</code>, <code>extra</code>, <code>updates</code>) and drives native generation.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. How do you read config values at runtime?</div>
  <div class="qa-answer">
    <p>Put them under <code>extra</code> in the app config, then read <code>Constants.expoConfig?.extra?.yourKey</code> via <code>expo-constants</code>. This is how public per-env config (API base URL, feature flags, <code>extra.eas.projectId</code>) reaches JS. Values are frozen at build/eval time; they don't update from a runtime <code>.env</code> change without a rebuild — and they're not secret (they ship in the bundle).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. What is <code>runtimeVersion</code> and why does it matter for OTA?</div>
  <div class="qa-answer">
    <p>It's the compatibility fence for EAS Update: an OTA JS bundle is only delivered to a binary whose <code>runtimeVersion</code> matches. Because a JS bundle can assume native code that only a specific binary has, you must bump <code>runtimeVersion</code> (or use a policy like <code>appVersion</code>/<code>fingerprint</code>) whenever native code changes, then ship a new build — otherwise an OTA push to an old binary crashes.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. What does <code>expo prebuild</code> actually do, step by step?</div>
  <div class="qa-answer">
    <p>It lays down a base native template for each platform, applies each config plugin's mods in order (editing manifest/plist/Gradle/pbxproj), then runs autolinking so native dependencies are wired into Gradle/CocoaPods. <code>--clean</code> wipes the folders first; <code>--platform</code> limits to one. <code>eas build</code> runs this in the cloud, which is why native folders can be git-ignored.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. When would you use <code>withDangerousMod</code>?</div>
  <div class="qa-answer">
    <p>When no structured mod (<code>withInfoPlist</code>, <code>withAndroidManifest</code>, etc.) covers what you need — e.g. writing a raw resource file or running arbitrary filesystem logic against the generated project. It's "dangerous" because it isn't structured/idempotent by construction: you must make it a no-op on re-run, or a second prebuild corrupts/duplicates. Prefer structured mods; use this as a last resort.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. How do the <code>ios</code>/<code>android</code> config blocks map to native files?</div>
  <div class="qa-answer">
    <p><code>ios.bundleIdentifier</code>/<code>buildNumber</code>/<code>infoPlist</code>/<code>entitlements</code>/<code>supportsTablet</code> feed <code>Info.plist</code> and the <code>.entitlements</code>/Xcode project. <code>android.package</code>/<code>versionCode</code>/<code>permissions</code>/<code>intentFilters</code>/<code>adaptiveIcon</code> feed <code>AndroidManifest.xml</code>, <code>build.gradle</code>, and the adaptive-icon resources. So you declare intent in config and prebuild writes the concrete manifest/plist — the native-manifest and Info.plist topics show the generated output.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You distinguish the Expo app config from <code>react-native.config.js</code> (identity/generation vs autolinking).</li>
    <li>You know when static JSON is enough and when you need a dynamic <code>app.config.ts</code>.</li>
    <li>You explain config plugins as prebuild-time native mutators and why they beat hand edits.</li>
    <li>You can name the mods (<code>withAndroidManifest</code>/<code>withInfoPlist</code>/<code>withXcodeProject</code>/<code>withDangerousMod</code>).</li>
    <li>You describe CNG and why native folders can be git-ignored.</li>
    <li>You explain autolinking discovery from <code>package.json</code> and how to exclude/override it.</li>
    <li>You read runtime config via <code>expo-constants</code> <code>extra</code> and know it isn't secret.</li>
    <li>You tie <code>runtimeVersion</code> to OTA safety.</li>
  </ul>
</div>
` },

  ]
});
