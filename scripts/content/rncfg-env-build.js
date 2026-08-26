window.PREP_SITE.registerTopic({
  id: 'rncfg-env-build',
  module: 'RN Project & Config (Deep)',
  title: 'Environments & Build Config',
  estimatedReadTime: '24 min',
  tags: ['eas-json', 'env-vars', 'dotenv', 'react-native-config', 'react-native-dotenv', 'babel-plugin-dotenv-import', 'expo-constants', 'expo-public-env', 'build-profiles', 'distribution', 'channel', 'eas-secret', 'eas-env', 'app-config-js', 'app-json', 'product-flavors', 'xcconfig', 'schemes', 'gemfile', 'nvmrc', 'node-version', 'ruby-version', 'expo-updates', 'runtime-version', 'codepush', 'ota-updates', 'secrets', 'uat-prod-switch'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>One codebase has to run against many <strong>environments</strong> — dev, staging/UAT, production — each with a different API base URL, keys, app name, bundle id, and set of feature flags. The job of "environments &amp; build config" is to feed the right values into the JS bundle and the native build for each environment, <strong>without committing secrets</strong>.</p>
<ul>
  <li><strong>Where values live</strong>: <code>.env</code> files (git-ignored), <code>eas.json</code> build profiles, EAS secrets, <code>app.config.js</code> reading <code>process.env</code>, and native config (Android product flavors, iOS schemes/xcconfig).</li>
  <li><strong>The RN reality</strong>: there is <strong>no built-in dotenv</strong> like on the web — you need a library (<code>react-native-config</code>, <code>react-native-dotenv</code>) or Expo's <code>EXPO_PUBLIC_</code> / <code>expo-constants</code> mechanism.</li>
  <li><strong>The hard rule</strong>: anything shipped inside the JS bundle is <strong>readable, not secret</strong>. Real secrets live server-side or in EAS secrets, injected only at build time.</li>
</ul>
<p>Expo 53 apps like <code>sw-mobile</code> and <code>sw-ticketing</code> use <code>app.config.js</code> + <code>eas.json</code> profiles; a runtime <strong>UAT/PROD switch</strong> (the developer-options toggle) rides on top of the same values baked into the bundle.</p>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Pick the environment at <strong>build time</strong> via a profile (<code>eas.json</code> / flavor / scheme) that sets an <code>APP_ENV</code>, keep secrets out of the bundle (EAS secrets, server-side), and remember that RN has no free dotenv — a library or Expo's <code>EXPO_PUBLIC_</code> inlines the values.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>The core problem</h3>
<p>A single React Native codebase must talk to different backends and wear different identities depending on where it runs:</p>
<ul>
  <li><strong>API base URL</strong> — <code>https://api-uat.example.com</code> vs <code>https://api.example.com</code>.</li>
  <li><strong>Keys / IDs</strong> — analytics keys, Sentry DSN, OneSignal app id, Google Maps key, OAuth client ids.</li>
  <li><strong>App identity</strong> — a different <code>applicationId</code> / bundle identifier, display name, and icon so a dev/staging build installs <em>side by side</em> with production on one device.</li>
  <li><strong>Feature flags</strong> — turn a half-built screen on in staging, off in production.</li>
</ul>
<p>You need a disciplined way to select the correct set of values per build, and to keep the sensitive ones out of version control. That is the whole discipline of environments &amp; build config.</p>

<h3>Why not just hardcode and comment things out?</h3>
<p>Manually editing a constant before each build is how you ship a debug URL to the App Store. Environment config makes the selection <strong>deterministic and reproducible</strong>: a named profile always produces the same wiring, in CI as on your laptop.</p>

<h3>Two axes: build-time vs runtime</h3>
<table>
  <thead><tr><th></th><th>Build-time selection</th><th>Runtime selection</th></tr></thead>
  <tbody>
    <tr><td>How</td><td>Profile/flavor/scheme sets values baked into the bundle</td><td>App reads a stored flag and swaps values while running</td></tr>
    <tr><td>Example</td><td><code>eas build --profile production</code></td><td>Developer-options UAT/PROD toggle</td></tr>
    <tr><td>Bundle</td><td>One env per binary; can install side by side</td><td>All candidate URLs are in one binary</td></tr>
    <tr><td>Good for</td><td>Store releases, clean separation</td><td>QA switching backends without a reinstall</td></tr>
  </tbody>
</table>
<p>Prakhar's <strong>UAT/PROD switch</strong> is the runtime flavour: both base URLs are compiled in, and a developer-options screen (revealed by 5 taps on the app version) flips which one the API client uses, persisted locally. That is legitimate <em>because URLs are not secrets</em>. You would never do this with a private signing key.</p>

<h3>Why secrets can't live in the bundle</h3>
<p>The JS bundle ships to the device as plain (minified) text. Anyone can unzip an <code>.apk</code>/<code>.ipa</code>, pull <code>index.android.bundle</code>, and grep it. Every <code>EXPO_PUBLIC_*</code> value, every <code>Config.*</code> string, every <code>extra</code> field is client-visible. So the rule is absolute: <strong>public config (URLs, public keys, flags) can be inlined; true secrets (signing keys, private API secrets, service-account JSON) must stay server-side or in build-only EAS secrets that never land in the JS.</strong></p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"I put the API secret in <code>.env</code> and <code>.gitignore</code>'d it, so it's safe." Git-ignoring only keeps it out of the repo. If a bundler inlines that value into the JS (which is exactly what dotenv libraries and <code>EXPO_PUBLIC_</code> do), it ships to every device in plain text. Git-ignore protects the repo; it does not make a bundled value secret.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "where does a value come from" picture</h3>
<div class="diagram">
<pre>
  .env / .env.production        eas.json profile env       EAS secrets (server)
        │                              │                          │
        │  (dotenv lib / EXPO_PUBLIC_) │  (build machine env)      │  (build-only, never in JS)
        ▼                              ▼                          ▼
   ┌──────────────────────────  process.env  ──────────────────────────┐
   │              app.config.js  reads process.env.APP_ENV             │
   │              → sets name, bundleId, icon, extra{...}              │
   └──────────────────────────────────┬───────────────────────────────┘
                                       │  prebuild / build
                     ┌─────────────────┴─────────────────┐
                     ▼                                     ▼
             JS bundle (extra,                      native project
             EXPO_PUBLIC_*, Config.*)               (AndroidManifest, Info.plist,
             ── CLIENT-VISIBLE ──                    flavors, xcconfig)
</pre>
</div>

<h3>The "three tiers of secrecy" picture</h3>
<div class="diagram">
<pre>
  Tier 1  PUBLIC, inline freely
          API base URL, public analytics id, app scheme, feature flags
          → .env / EXPO_PUBLIC_ / extra   (ships in bundle, that's fine)

  Tier 2  BUILD-ONLY, keep out of JS
          Sentry auth token (upload), Play service-account json, keystore
          → EAS secrets / CI secrets      (used during build, NOT bundled)

  Tier 3  TRUE RUNTIME SECRET, never on device
          DB password, private API signing secret, admin key
          → lives ONLY on your server, device calls an endpoint
</pre>
</div>

<h3>The "one env per binary vs runtime switch" picture</h3>
<div class="diagram">
<pre>
  BUILD-TIME (side-by-side installs)      RUNTIME SWITCH (one binary)
  ───────────────────────────────        ───────────────────────────
  MyApp (dev)   com.app.dev              MyApp   com.app
  MyApp (stg)   com.app.staging          ├─ dev-options: [UAT] [PROD]
  MyApp         com.app                   └─ AsyncStorage/MMKV remembers choice
                                             API client reads flag → base URL
</pre>
</div>

<h3>The mental checklist for any value</h3>
<ul>
  <li><strong>Is it secret?</strong> If yes → EAS secret / server, never <code>EXPO_PUBLIC_</code> or <code>extra</code>.</li>
  <li><strong>Does it change per environment?</strong> If yes → drive it from <code>APP_ENV</code> in <code>app.config.js</code> or an <code>eas.json</code> profile <code>env</code> block.</li>
  <li><strong>Is it needed by native (name, id, icon, manifest keys)?</strong> If yes → it must be set before/at prebuild, not just in JS.</li>
  <li><strong>Does it need to change without a store release?</strong> If yes → OTA (EAS Update) for JS-only, or a runtime flag you can flip.</li>
</ul>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — app.config.js runs on the build machine, not the device</div>
  <p><code>app.config.js</code> is evaluated by the Expo CLI during <code>expo prebuild</code> / <code>eas build</code>, in Node, on the build host. So <code>process.env.APP_ENV</code> there reads the <em>build machine's</em> environment (your shell, or the EAS profile's <code>env</code>). Whatever it returns is frozen into <code>app.json</code>/native files and into <code>Constants.expoConfig</code>. It does not re-run on the phone — there is no "read env at runtime" here.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>1. The <code>.env</code> files and why they need a library</h3>
<p>Convention (borrowed from web / twelve-factor):</p>
<pre><code class="language-text">.env            # committed defaults OR shared non-secret keys (team choice)
.env.local      # your machine only, git-ignored, overrides
.env.development
.env.staging
.env.production # per-environment values</code></pre>
<p>Always ignore the sensitive ones:</p>
<pre><code class="language-bash"># .gitignore
.env
.env.local
.env.*.local
# keep an .env.example (committed) documenting the KEYS with dummy values</code></pre>
<p>Here is the RN gotcha: <strong>React Native's Metro bundler does not read <code>.env</code> automatically.</strong> On the web, tools like Webpack/Vite/Next inject <code>process.env.*</code> for you. In bare RN, <code>process.env.API_URL</code> is just <code>undefined</code> unless a library rewrites it. You pick one of the mechanisms below.</p>

<h3>2. Option A — <code>react-native-config</code> (native-level env)</h3>
<p>This library reads a <code>.env</code> file and exposes it both to JS (<code>Config.API_URL</code>) <em>and</em> to the native build (BuildConfig fields on Android, <code>Info.plist</code>/xcconfig on iOS) — so you can use the same value in <code>AndroidManifest.xml</code> or app name.</p>
<pre><code class="language-ts">import Config from 'react-native-config';
const baseURL = Config.API_URL;          // string, from .env at build time</code></pre>
<pre><code class="language-groovy">// android/app/build.gradle — pick env file per flavor/variant
project.ext.envConfigFiles = [
  debug:   ".env.development",
  release: ".env.production",
]
apply from: project(':react-native-config').projectDir.getPath() + "/dotenv.gradle"</code></pre>
<p>Because values are baked at <strong>native build</strong> time, changing <code>.env</code> requires a rebuild (not just a Metro reload). Values are still client-visible — this is not a secret store.</p>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — react-native-config needs a config plugin / prebuild</div>
  <p><code>react-native-config</code> touches <code>android/</code> and <code>ios/</code>, so in a managed/prebuild Expo app you must add it via its config plugin and re-run <code>expo prebuild</code>; hand-edited native files are wiped on <code>expo prebuild --clean</code>. Most Expo apps skip it entirely in favour of <code>EXPO_PUBLIC_</code> + <code>expo-constants</code> (below), which are first-class in the managed workflow.</p>
</div>

<h3>3. Option B — <code>react-native-dotenv</code> / <code>babel-plugin-dotenv-import</code> (the <code>@env</code> module)</h3>
<p>This is a <strong>Babel</strong> plugin: at transform time it replaces imports from a virtual <code>@env</code> module with the literal values from <code>.env</code>. Pure JS, no native change.</p>
<pre><code class="language-js">// babel.config.js
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
      safe: false,
      allowUndefined: true,
    }],
  ],
};</code></pre>
<pre><code class="language-ts">import { API_URL, SENTRY_DSN } from '@env';
console.log(API_URL);   // inlined string literal after Babel runs</code></pre>
<p>Because Babel inlines at build, changing <code>.env</code> needs a <strong>Metro cache reset</strong> (see gotchas). Cross-reference the Babel topic for how plugins transform the AST; this one is just a compile-time find-and-replace, so again — <em>not secret</em>.</p>

<h3>4. Option C — Expo: <code>EXPO_PUBLIC_</code> and <code>expo-constants</code></h3>
<p>Expo has dotenv built into its CLI. Any variable prefixed <code>EXPO_PUBLIC_</code> in a <code>.env</code> file is inlined into the bundle as <code>process.env.EXPO_PUBLIC_*</code>:</p>
<pre><code class="language-bash"># .env
EXPO_PUBLIC_API_URL=https://api-uat.example.com
EXPO_PUBLIC_ENV=uat</code></pre>
<pre><code class="language-ts">const url = process.env.EXPO_PUBLIC_API_URL;   // inlined at build; NOT secret</code></pre>
<p>The prefix is a deliberate warning label: <strong>EXPO_PUBLIC_ means public.</strong> A variable without the prefix is available to <code>app.config.js</code> (build host) but is NOT inlined into the app.</p>
<p>The structured alternative is <code>extra</code> + <code>expo-constants</code>:</p>
<pre><code class="language-js">// app.config.js
export default ({ config }) => {
  const env = process.env.APP_ENV || 'development';
  const apiUrl = {
    development: 'http://localhost:3000',
    staging:     'https://api-uat.example.com',
    production:  'https://api.example.com',
  }[env];
  return {
    ...config,
    name: env === 'production' ? 'SmartWorks' : 'SmartWorks (' + env + ')',
    extra: { env, apiUrl, easProjectId: 'xxxx-xxxx' },
  };
};</code></pre>
<pre><code class="language-ts">import Constants from 'expo-constants';
const { apiUrl, env } = Constants.expoConfig.extra;   // read at runtime, from baked config</code></pre>

<h3>5. <code>eas.json</code> — build profiles</h3>
<p><code>eas.json</code> defines named <strong>build profiles</strong>. Each profile controls distribution, native build type, per-profile <code>env</code>, and update <code>channel</code>.</p>
<pre><code class="language-json">{
  "cli": { "version": "&gt;= 12.0.0", "appVersionSource": "remote" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "APP_ENV": "development" },
      "android": { "buildType": "apk" },
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview",
      "env": { "APP_ENV": "staging" },
      "android": { "buildType": "apk" }
    },
    "production": {
      "distribution": "store",
      "channel": "production",
      "env": { "APP_ENV": "production" },
      "android": { "buildType": "app-bundle" },
      "ios": { "resourceClass": "m-medium" }
    }
  },
  "submit": {
    "production": {
      "android": { "serviceAccountKeyPath": "./pc-api.json", "track": "internal" },
      "ios": { "appleId": "dev@example.com", "ascAppId": "1234567890" }
    }
  }
}</code></pre>
<p>Key fields:</p>
<ul>
  <li><strong><code>developmentClient: true</code></strong> — builds a dev client (Expo Dev Client) that can load JS from Metro, for the <code>development</code> profile.</li>
  <li><strong><code>distribution</code></strong> — <code>internal</code> (shareable install link / ad-hoc / internal track) vs <code>store</code> (signed for App Store / Play).</li>
  <li><strong><code>channel</code></strong> — ties this build to an <strong>EAS Update</strong> channel so OTA updates target it.</li>
  <li><strong><code>env</code></strong> — environment variables set on the build machine; this is how <code>app.config.js</code> sees <code>APP_ENV</code> per profile.</li>
  <li><strong><code>android.buildType</code></strong> — <code>apk</code> (installable directly, good for QA) vs <code>app-bundle</code> (<code>.aab</code>, required by Play Store).</li>
  <li><strong><code>ios.simulator</code></strong> — build a simulator-runnable app; <strong><code>resourceClass</code></strong> — the build worker size.</li>
  <li><strong><code>cli.appVersionSource</code></strong> — <code>remote</code> (EAS manages the build number) vs <code>local</code> (from <code>app.json</code>).</li>
</ul>
<p>Commands: <code>eas build --profile production --platform android</code>, <code>eas submit --profile production</code>, <code>eas update --branch production</code>.</p>

<h3>6. EAS secrets and <code>eas env</code></h3>
<p>For values that must be present <em>during the build</em> but must NOT sit in the repo (a Sentry auth token to upload sourcemaps, a private key an <code>app.config.js</code> plugin reads), store them as EAS secrets:</p>
<pre><code class="language-bash">eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value "xxxx"
eas secret:list
# newer, environment-scoped API:
eas env:create --name SENTRY_AUTH_TOKEN --value "xxxx" --environment production --visibility secret</code></pre>
<p>During <code>eas build</code>, these appear as environment variables on the build machine. If you feed one into <code>EXPO_PUBLIC_</code> or <code>extra</code>, you have leaked it into the bundle — the point is to <em>consume it at build time only</em> (e.g., a plugin uploads sourcemaps and the token never reaches the JS).</p>

<h3>7. App variants — side-by-side installs</h3>
<p>To install dev/staging/prod together, each needs a distinct <strong>applicationId / bundle identifier</strong>, name, and icon. Managed Expo does this in <code>app.config.js</code>:</p>
<pre><code class="language-js">// app.config.js (variant identity)
const env = process.env.APP_ENV || 'development';
const idSuffix = env === 'production' ? '' : '.' + env;
export default ({ config }) => ({
  ...config,
  name: env === 'production' ? 'SmartWorks' : 'SW ' + env,
  ios:     { ...config.ios,     bundleIdentifier: 'com.company.sw' + idSuffix },
  android: { ...config.android, package:          'com.company.sw' + idSuffix },
  icon: './assets/icon-' + env + '.png',
});</code></pre>
<p>Bare RN does the same natively: <strong>Android product flavors</strong> (<code>applicationIdSuffix</code>, per-flavor <code>resValue</code>/manifest) and <strong>iOS schemes + build configurations + xcconfig</strong>. Cross-reference the native signing / Gradle / Xcode topics for the mechanics.</p>
<pre><code class="language-groovy">// android/app/build.gradle — product flavors (bare RN)
android {
  flavorDimensions "env"
  productFlavors {
    dev     { dimension "env"; applicationIdSuffix ".dev";     resValue "string", "app_name", "SW dev" }
    staging { dimension "env"; applicationIdSuffix ".staging"; resValue "string", "app_name", "SW stg" }
    prod    { dimension "env"; resValue "string", "app_name", "SmartWorks" }
  }
}</code></pre>

<h3>8. Version / runtime pinning files</h3>
<p>These freeze the <em>toolchain</em> so every machine and CI runner builds the same way:</p>
<ul>
  <li><strong><code>.nvmrc</code></strong> / <strong><code>.node-version</code></strong> — the Node version (<code>nvm use</code> / fnm / Volta read it).</li>
  <li><strong><code>.ruby-version</code></strong> — the Ruby version (rbenv/chruby) used for CocoaPods/Fastlane.</li>
  <li><strong><code>Gemfile</code></strong> + <strong><code>Gemfile.lock</code></strong> — pin CocoaPods, Fastlane, and their transitive gems so <code>pod install</code> is reproducible; run <code>bundle install</code> then <code>bundle exec pod install</code>.</li>
</ul>
<pre><code class="language-ruby"># Gemfile (RN default)
source 'https://rubygems.org'
ruby '&gt;= 2.6.10'
gem 'cocoapods', '~&gt; 1.13'
gem 'fastlane'</code></pre>
<p>Pinning matters because an unpinned CocoaPods or Ruby is a classic "works on my machine" failure — cross-reference the M4 Pro migration notes where a dual-Homebrew/Rosetta Ruby broke pods.</p>

<h3>9. OTA updates — <code>expo-updates</code> / EAS Update</h3>
<p>JS-only changes (a bug fix, a copy change, a new screen with no native deps) can ship <strong>without a store review</strong> via over-the-air updates.</p>
<pre><code class="language-json">// app.json (expo-updates)
{ "expo": {
    "runtimeVersion": { "policy": "appVersion" },
    "updates": { "url": "https://u.expo.dev/your-project-id" }
} }</code></pre>
<pre><code class="language-bash">eas update --branch production --message "fix cafe filter"</code></pre>
<ul>
  <li><strong><code>runtimeVersion</code></strong> — the native contract. An update only installs on a binary whose runtimeVersion matches; bump it whenever native code changes so old JS never runs against a new/old native ABI.</li>
  <li><strong>channel → branch</strong> — a build points at a <code>channel</code> (from <code>eas.json</code>); <code>eas update</code> publishes to a <code>branch</code>; a channel maps to a branch, so <code>production</code> builds pull the <code>production</code> branch.</li>
  <li><strong>CodePush (legacy)</strong> — Microsoft's App Center CodePush was the old OTA path (retired); EAS Update is the current Expo mechanism.</li>
</ul>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — OTA cannot change native code</div>
  <p>EAS Update ships the <em>JS bundle and assets</em> only. Adding a native module, changing an <code>Info.plist</code> permission, or bumping a native dependency needs a new binary through the store — you cannot OTA it. Mismatch is exactly what <code>runtimeVersion</code> guards against.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — a UAT/PROD runtime switch (Prakhar's dev-options)</h3>
<p>Both URLs are compiled in; a persisted flag chooses. This is the pattern behind the 5-tap developer-options toggle.</p>
<pre><code class="language-ts">// config/endpoints.ts
export const ENDPOINTS = {
  uat:  'https://api-uat.example.com',
  prod: 'https://api.example.com',
};

// api/baseUrl.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
let current = ENDPOINTS.prod;
export async function loadEnv() {
  const saved = await AsyncStorage.getItem('APP_ENV');
  current = saved === 'uat' ? ENDPOINTS.uat : ENDPOINTS.prod;
}
export function getBaseUrl() { return current; }
export async function setEnv(env: 'uat' | 'prod') {
  current = ENDPOINTS[env];
  await AsyncStorage.setItem('APP_ENV', env);
}</code></pre>
<p>The API client calls <code>getBaseUrl()</code> on each request, so flipping the toggle takes effect immediately. Legit because URLs are not secret.</p>

<h3>Example 2 — reading a build-time env in three flavours</h3>
<pre><code class="language-ts">// react-native-config
import Config from 'react-native-config';
const a = Config.API_URL;

// react-native-dotenv
import { API_URL } from '@env';
const b = API_URL;

// Expo
const c = process.env.EXPO_PUBLIC_API_URL;
import Constants from 'expo-constants';
const d = Constants.expoConfig.extra.apiUrl;</code></pre>

<h3>Example 3 — <code>app.config.js</code> switching identity + config by <code>APP_ENV</code></h3>
<pre><code class="language-js">const env = process.env.APP_ENV ?? 'development';
const variants = {
  development: { name: 'SW dev', id: 'com.company.sw.dev',     url: 'http://10.0.2.2:3000' },
  staging:     { name: 'SW stg', id: 'com.company.sw.staging', url: 'https://api-uat.example.com' },
  production:  { name: 'SmartWorks', id: 'com.company.sw',     url: 'https://api.example.com' },
};
const v = variants[env];
export default ({ config }) => ({
  ...config,
  name: v.name,
  ios:     { ...config.ios,     bundleIdentifier: v.id },
  android: { ...config.android, package: v.id },
  extra:   { env, apiUrl: v.url, easProjectId: process.env.EAS_PROJECT_ID },
});</code></pre>

<h3>Example 4 — building each environment</h3>
<pre><code class="language-bash"># local dev client
APP_ENV=development eas build --profile development --platform android

# internal QA build (staging), installable apk
eas build --profile preview --platform android

# store release
eas build --profile production --platform ios
eas submit --profile production --platform ios</code></pre>

<h3>Example 5 — a build-only secret used by a plugin, never bundled</h3>
<pre><code class="language-bash">eas env:create --name SENTRY_AUTH_TOKEN --value "s3cr3t" \
  --environment production --visibility secret</code></pre>
<pre><code class="language-js">// app.config.js — the token is read on the build host to configure the plugin;
// it is NOT placed into extra / EXPO_PUBLIC_, so it never reaches the JS bundle.
export default ({ config }) => ({
  ...config,
  plugins: [
    ['@sentry/react-native/expo', {
      organization: 'my-org', project: 'sw-mobile',
      // authToken pulled from process.env.SENTRY_AUTH_TOKEN at build time only
    }],
  ],
});</code></pre>

<h3>Example 6 — a leak you must never ship</h3>
<pre><code class="language-bash"># .env  — WRONG: a real secret behind the PUBLIC prefix
EXPO_PUBLIC_STRIPE_SECRET_KEY=sk_live_abcd    # ← inlined into the bundle, exposed to every user</code></pre>
<p>Fix: the secret key lives on your server; the app only ever sees the <em>publishable</em> key (<code>pk_live_...</code>), which is designed to be public.</p>

<h3>Example 7 — Android product flavors selecting a <code>.env</code> file (bare RN + react-native-config)</h3>
<pre><code class="language-groovy">project.ext.envConfigFiles = [
  devdebug:      ".env.development",
  stagingrelease:".env.staging",
  prodrelease:   ".env.production",
]</code></pre>

<h3>Example 8 — pinning the toolchain</h3>
<pre><code class="language-text">// .nvmrc
20.11.1</code></pre>
<pre><code class="language-text">// .ruby-version
3.2.2</code></pre>
<pre><code class="language-bash">nvm use            # reads .nvmrc → Node 20.11.1
bundle install     # reads Gemfile.lock → exact CocoaPods/Fastlane
bundle exec pod install</code></pre>

<h3>Example 9 — an OTA hotfix with matching runtimeVersion</h3>
<pre><code class="language-bash"># JS-only fix, same native binary → OTA it
eas update --branch production --message "hotfix: reorder rating"
# native dep changed? bump runtimeVersion and ship a NEW store build instead.</code></pre>

<h3>Example 10 — an <code>.env.example</code> you DO commit</h3>
<pre><code class="language-text"># .env.example  (committed — documents keys, no real values)
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_ONESIGNAL_APP_ID=
SENTRY_AUTH_TOKEN=   # build-only, set via EAS secret</code></pre>

<h3>Example 11 — feature flag gated by environment</h3>
<pre><code class="language-ts">import Constants from 'expo-constants';
const { env } = Constants.expoConfig.extra;
const SHOW_CHECKIN = env !== 'production';   // enable half-built feature only in dev/staging
</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Env not reloading after you edit <code>.env</code></h3>
<p>Babel/Metro cache the inlined values. After changing a JS-level env (<code>react-native-dotenv</code>, <code>EXPO_PUBLIC_</code>) restart Metro with <code>npx expo start --clear</code> or <code>npx react-native start --reset-cache</code>. For native-level env (<code>react-native-config</code>, flavors) you must <strong>rebuild the app</strong>, not just reload JS.</p>

<h3>2. <code>EXPO_PUBLIC_</code> only inlines at build, not in <code>app.config.js</code> at will</h3>
<p><code>process.env.EXPO_PUBLIC_FOO</code> is replaced in <em>app code</em>. Variables <em>without</em> the prefix are visible to <code>app.config.js</code> (build host) but are NOT inlined into the bundle — reading a non-prefixed var in a component gives <code>undefined</code>.</p>

<h3>3. Wrong env baked into a profile</h3>
<p>Forgetting <code>"env": { "APP_ENV": "production" }</code> in the production profile means <code>app.config.js</code> falls back to its default (often development) and you ship a staging URL to the store. Always set <code>env</code> explicitly per profile and log the resolved env on a debug screen.</p>

<h3>4. Forgetting to set EAS secrets in CI</h3>
<p>A build that reads <code>SENTRY_AUTH_TOKEN</code> works locally (your shell has it) but fails or silently skips on EAS/CI because the secret was never created there. Create project-scoped EAS secrets / CI secrets, and fail loudly if a required build var is missing.</p>

<h3>5. <code>runtimeVersion</code> mismatch → update never applies</h3>
<p>If you bump native code but not <code>runtimeVersion</code>, an OTA update can land on an incompatible binary and crash; if you bump <code>runtimeVersion</code> unnecessarily, existing users stop receiving updates until they install a new build. Use a policy (<code>appVersion</code> / <code>fingerprint</code>) and change it only on native changes.</p>

<h3>6. Channel vs branch confusion</h3>
<p>A build is tied to a <strong>channel</strong> (<code>eas.json</code>); <code>eas update</code> publishes to a <strong>branch</strong>; a channel is mapped to a branch. Publishing to the wrong branch, or a channel pointing at the wrong branch, means QA never sees the update. Verify with <code>eas channel:view</code> and <code>eas branch:list</code>.</p>

<h3>7. Committing <code>.env</code> by accident</h3>
<p>If a secret-bearing <code>.env</code> was ever committed, git-ignoring it later does not remove it from history. Rotate the secret and scrub history (<code>git filter-repo</code>). Prefer never committing it — commit <code>.env.example</code> instead.</p>

<h3>8. Values are strings — no types</h3>
<p>Every env value is a string. <code>EXPO_PUBLIC_FEATURE=false</code> is the truthy string "false". Coerce explicitly: <code>flag === 'true'</code>, <code>Number(x)</code>. Mis-coercion is a common "flag won't turn off" bug.</p>

<h3>9. <code>app.config.js</code> vs <code>app.json</code> precedence</h3>
<p>If both exist, <code>app.config.js</code> wins (it can import <code>app.json</code> as its base). Editing <code>app.json</code> while a <code>app.config.js</code> ignores it silently drops your change.</p>

<h3>10. Hand-editing native files in a prebuild app</h3>
<p>In managed/prebuild Expo, changes to <code>android/</code> or <code>ios/</code> are erased by <code>expo prebuild --clean</code>. Put native config in <code>app.config.js</code> / config plugins (<code>expo-build-properties</code> for gradle/pod properties) instead.</p>

<h3>11. iOS needs pod install after native env deps</h3>
<p>Adding <code>react-native-config</code> or changing native env plumbing requires <code>bundle exec pod install</code>; a JS reload will not surface it.</p>

<h3>12. Metro <code>process.env</code> is not Node's</h3>
<p>In app code, <code>process.env</code> is a compile-time shim, not a live object. You cannot mutate it at runtime or read arbitrary keys — only the ones the bundler inlined (e.g. <code>EXPO_PUBLIC_*</code>).</p>

<h3>13. Different Node/Ruby than CI</h3>
<p>No <code>.nvmrc</code>/<code>.ruby-version</code> means your machine and CI may resolve different toolchains, producing subtly different builds or pod failures. Pin them and have CI honour the pins.</p>

<h3>14. Simulator vs device build profile</h3>
<p><code>ios.simulator: true</code> produces a build that will NOT run on a physical device (wrong architecture/signing). Keep a separate device/internal profile; do not submit a simulator build.</p>

<h3>15. <code>appVersionSource: remote</code> surprises</h3>
<p>With <code>remote</code>, EAS auto-increments the build number and ignores the local <code>buildNumber</code>/<code>versionCode</code> — editing them locally does nothing. With <code>local</code>, you own them and must bump manually.</p>

<h3>16. Extra bloating the manifest</h3>
<p><code>extra</code> ships inside the update manifest and bundle; dumping large blobs there wastes size and exposes them. Keep it to small scalars (env name, url, ids).</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — a real secret behind <code>EXPO_PUBLIC_</code> / in <code>extra</code></h3>
<p>Any secret you inline ships to every device in readable form. Publishable/public keys only in the bundle; private keys stay server-side or in build-only EAS secrets.</p>

<h3>Anti-pattern 2 — assuming <code>.gitignore</code> makes a value secret</h3>
<p>Git-ignore protects the repo, not the bundle. If a bundler inlines a git-ignored value, it still ships. Two different protections.</p>

<h3>Anti-pattern 3 — hardcoding the URL and commenting out per build</h3>
<p>Manual edits before release are how a debug endpoint reaches production. Drive URLs from <code>APP_ENV</code> / profiles, never by hand-editing a constant.</p>

<h3>Anti-pattern 4 — no default / no explicit env in a profile</h3>
<p>Relying on the implicit default means the wrong env ships when someone forgets to set it. Set <code>env</code> in every <code>eas.json</code> profile and assert the resolved env at startup.</p>

<h3>Anti-pattern 5 — editing <code>.env</code> and expecting a hot reload</h3>
<p>Env is inlined at build/transform time. Not resetting Metro cache (JS env) or rebuilding (native env) leaves stale values and hours of confusion.</p>

<h3>Anti-pattern 6 — treating string env as typed</h3>
<p><code>if (process.env.EXPO_PUBLIC_DEBUG)</code> is truthy even when the value is "false". Compare strings or coerce explicitly.</p>

<h3>Anti-pattern 7 — hand-editing android/ios in a prebuild app</h3>
<p>Native edits get wiped on <code>expo prebuild --clean</code>. Use config plugins / <code>app.config.js</code> / <code>expo-build-properties</code>.</p>

<h3>Anti-pattern 8 — OTA-ing a native change</h3>
<p>EAS Update carries JS only. Shipping a JS bundle that expects a native module not in the installed binary crashes users. Bump <code>runtimeVersion</code> and release a real build.</p>

<h3>Anti-pattern 9 — same bundle id across environments</h3>
<p>Reusing <code>com.company.app</code> for dev and prod means the dev build overwrites the user's real app and they cannot coexist. Suffix ids per variant.</p>

<h3>Anti-pattern 10 — committing the <code>.env</code>, not the <code>.env.example</code></h3>
<p>You leak secrets and give teammates no schema. Commit a documented <code>.env.example</code> with empty values; git-ignore the real files.</p>

<h3>Anti-pattern 11 — no toolchain pinning</h3>
<p>Missing <code>.nvmrc</code>/<code>.ruby-version</code>/<code>Gemfile.lock</code> yields "works on my machine" pod and build failures across the team and CI.</p>

<h3>Anti-pattern 12 — secrets only in your shell, never in EAS/CI</h3>
<p>Local builds pass; CI builds fail or silently skip sourcemap upload. Create the secret in the build environment too, and fail the build if a required var is absent.</p>

<h3>Anti-pattern 13 — logging the whole config (secrets and all) at startup</h3>
<p><code>console.log(Constants.expoConfig)</code> in release dumps every extra/plugin value to device logs. Log only the resolved env name in production.</p>

<h3>Anti-pattern 14 — one giant <code>.env</code> for all environments</h3>
<p>Mixing prod and dev keys in a single file invites shipping the wrong one. Separate per-environment files (or profile <code>env</code> blocks) and select by <code>APP_ENV</code>.</p>

<h3>Anti-pattern 15 — submitting a simulator or wrong-profile build</h3>
<p>An <code>ios.simulator</code> or <code>preview</code> (internal) artifact cannot go to the store. Match the build profile to the intended distribution.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. How do you manage dev / staging / production in one RN codebase?</div>
  <div class="qa-answer">
    <p>Select the environment at build time via a named profile — <code>eas.json</code> build profiles in Expo, or Android product flavors + iOS schemes/configs in bare RN — and let each profile set an <code>APP_ENV</code>. <code>app.config.js</code> (or the native config) reads <code>APP_ENV</code> to choose the API URL, app name, bundle id, icon, and feature flags. Non-secret values live in <code>.env</code> files or the profile's <code>env</code> block; secrets stay in EAS secrets / server-side. Optionally add a runtime switch (a persisted flag) for QA to flip backends without reinstalling.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Does React Native read <code>.env</code> files automatically?</div>
  <div class="qa-answer">
    <p>No. Unlike web bundlers, Metro has no built-in dotenv. In bare RN you add a library: <code>react-native-config</code> (native-level, exposes <code>Config.*</code> to JS and to the native build) or <code>react-native-dotenv</code>/<code>babel-plugin-dotenv-import</code> (a Babel plugin that inlines a virtual <code>@env</code> module). Expo is the exception — its CLI has dotenv built in via the <code>EXPO_PUBLIC_</code> prefix and <code>process.env.EXPO_PUBLIC_*</code>, plus <code>extra</code> read through <code>expo-constants</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Why can't you keep an API secret in a <code>.env</code> file in the app?</div>
  <div class="qa-answer">
    <p>Because every dotenv mechanism <em>inlines</em> the value into the JS bundle, which ships to the device as readable text — anyone can unzip the apk/ipa and grep it. Git-ignoring the file only protects the repo, not the bundle. Public config (URLs, publishable keys, flags) can be inlined; true secrets must live server-side, or as build-only EAS secrets that are consumed during the build and never placed into <code>extra</code>/<code>EXPO_PUBLIC_</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. What is <code>eas.json</code> and what does a build profile contain?</div>
  <div class="qa-answer">
    <p><code>eas.json</code> defines named build/submit profiles. A build profile controls <code>distribution</code> (internal vs store), <code>channel</code> (which EAS Update channel it pulls), a per-profile <code>env</code> block, <code>developmentClient</code>, and platform sub-config — <code>android.buildType</code> (apk vs app-bundle), <code>ios.simulator</code>, <code>ios.resourceClass</code>. There's also <code>cli.appVersionSource</code> (remote vs local versioning) and <code>submit</code> profiles for store credentials. You run <code>eas build --profile X</code>, <code>eas submit</code>, and <code>eas update</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Difference between <code>EXPO_PUBLIC_</code> variables and EAS secrets?</div>
  <div class="qa-answer">
    <p><code>EXPO_PUBLIC_*</code> is inlined into the JS bundle and is therefore <strong>public</strong> — the prefix is a warning label. EAS secrets (<code>eas secret:create</code> / <code>eas env</code>) are set on the build machine and used <em>only during the build</em> (e.g. a Sentry token to upload sourcemaps); they never reach the bundle unless you mistakenly copy them into <code>extra</code>/<code>EXPO_PUBLIC_</code>. Public config → EXPO_PUBLIC_; build-only secret → EAS secret; runtime secret → server.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How do you install dev, staging, and prod side by side on one device?</div>
  <div class="qa-answer">
    <p>Give each variant a distinct <code>applicationId</code>/bundle identifier (usually a suffix like <code>.dev</code>/<code>.staging</code>), plus its own display name and icon. In managed Expo, compute these in <code>app.config.js</code> from <code>process.env.APP_ENV</code>. In bare RN, use Android product flavors (<code>applicationIdSuffix</code>, per-flavor resources) and iOS schemes + build configurations + xcconfig. Distinct ids let the OS treat them as separate apps.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How would you implement a UAT/PROD switch QA can toggle at runtime?</div>
  <div class="qa-answer">
    <p>Compile <em>both</em> base URLs into the app (they're not secret). Expose a hidden developer-options screen (e.g. 5 taps on the app version), persist the choice in AsyncStorage/MMKV, and have the API client read the current base URL on each request. Flipping it takes effect immediately, no reinstall. This is a legitimate runtime approach precisely because URLs are public; you'd never do it with a signing key.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. What are OTA updates and what can't they do?</div>
  <div class="qa-answer">
    <p>EAS Update (<code>expo-updates</code>) ships the JS bundle and assets over the air, so JS-only fixes reach users without a store review. It <strong>cannot</strong> change native code — a new native module, a permission, or a native dependency bump requires a new store binary. <code>runtimeVersion</code> is the native contract: an update only installs on a binary with a matching runtimeVersion, preventing new JS from running against incompatible native. CodePush was the legacy (retired) mechanism.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. What's the role of <code>runtimeVersion</code>, channels, and branches?</div>
  <div class="qa-answer">
    <p><code>runtimeVersion</code> pins the native ABI an update is compatible with (policy <code>appVersion</code>/<code>fingerprint</code>, or a manual string). A build is tied to a <strong>channel</strong> (in <code>eas.json</code>); <code>eas update</code> publishes to a <strong>branch</strong>; a channel maps to a branch. So a <code>production</code> build on the <code>production</code> channel pulls updates from the <code>production</code> branch, but only those whose runtimeVersion matches.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Why do <code>.nvmrc</code>, <code>.ruby-version</code>, and <code>Gemfile.lock</code> matter?</div>
  <div class="qa-answer">
    <p>They pin the toolchain so every developer and CI runner builds identically. <code>.nvmrc</code>/<code>.node-version</code> fix the Node version; <code>.ruby-version</code> fixes Ruby for CocoaPods/Fastlane; <code>Gemfile</code> + <code>Gemfile.lock</code> pin CocoaPods/Fastlane and their gems so <code>bundle exec pod install</code> is reproducible. Without them you get "works on my machine" pod and build failures — a Ruby/Homebrew mismatch is a classic culprit.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. You changed <code>.env</code> but the app still shows the old value. Why?</div>
  <div class="qa-answer">
    <p>Env is inlined at build/transform time, not read live. For JS-level env (<code>react-native-dotenv</code>, <code>EXPO_PUBLIC_</code>) you must reset the Metro cache (<code>expo start --clear</code> / <code>--reset-cache</code>). For native-level env (<code>react-native-config</code>, product flavors) you must rebuild the app — a JS reload won't pick it up. Also remember <code>process.env</code> in app code is a compile-time shim, not a live object.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Where does <code>app.config.js</code> run, and what env does it see?</div>
  <div class="qa-answer">
    <p>It runs in Node on the build machine during <code>expo prebuild</code>/<code>eas build</code>, not on the device. So <code>process.env</code> there is the build host's environment — your shell or the profile's <code>env</code> block. Whatever it returns is frozen into the native project and into <code>Constants.expoConfig</code>. That's why <code>APP_ENV</code> flows from the <code>eas.json</code> profile into <code>app.config.js</code> and out to the bundle; it does not re-evaluate at runtime.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. How do you keep native config in a prebuild (managed) Expo app?</div>
  <div class="qa-answer">
    <p>Never hand-edit <code>android/</code> or <code>ios/</code> — <code>expo prebuild --clean</code> wipes them. Put native settings in <code>app.config.js</code> and config plugins; use <code>expo-build-properties</code> to set gradle/pod values (min SDK, compile SDK, deployment target). This keeps Continuous Native Generation reproducible so any machine regenerates the same native project.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. A build works locally but fails on EAS/CI. Common config cause?</div>
  <div class="qa-answer">
    <p>A required build-time variable exists in your shell but was never created as an EAS/CI secret — so the build can't read it and either fails or silently skips (e.g. no sourcemap upload). Fix: create project-scoped EAS secrets / CI secrets, and make the build assert that required vars are present rather than proceeding with <code>undefined</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Contrast build-time environment selection with a runtime switch.</div>
  <div class="qa-answer">
    <p>Build-time: a profile/flavor/scheme bakes one environment into each binary, allowing side-by-side installs and clean store separation — the safe default for releases. Runtime: all candidate values are compiled into one binary and a persisted flag chooses among them — convenient for QA to swap non-secret backends without reinstalling. Use build-time for identity/secrets and store builds; use runtime only for non-secret toggles like a UAT/PROD URL switch.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You know RN has no built-in dotenv and can name the libraries plus Expo's <code>EXPO_PUBLIC_</code>.</li>
    <li>You state the rule that anything in the bundle is public, not secret.</li>
    <li>You can describe <code>eas.json</code> profiles: distribution, channel, env, buildType.</li>
    <li>You distinguish <code>EXPO_PUBLIC_</code> (bundled) from EAS secrets (build-only) from server-side secrets.</li>
    <li>You drive per-env identity (bundle id / name / icon) from <code>APP_ENV</code> in <code>app.config.js</code> or flavors/schemes.</li>
    <li>You explain OTA (EAS Update) limits and <code>runtimeVersion</code>.</li>
    <li>You pin the toolchain with <code>.nvmrc</code> / <code>.ruby-version</code> / <code>Gemfile.lock</code>.</li>
    <li>You know env is inlined at build time and needs a cache reset / rebuild to change.</li>
  </ul>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'revision', title: '⚡ Revision — Points to Remember', collapsible: true, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Select the environment at <strong>build time</strong> via a profile that sets <code>APP_ENV</code> (<code>eas.json</code> / Android flavors / iOS schemes), feed non-secret values through <code>.env</code> or <code>EXPO_PUBLIC_</code>/<code>extra</code>, and keep real secrets out of the bundle (EAS secrets / server) — because anything shipped in the JS is readable, not secret.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>The problem:</strong> one codebase, many environments — API URL, keys, app name/id, icon, feature flags — with secrets kept out of version control.</li>
    <li><strong>No built-in dotenv in RN.</strong> Bare RN needs a library: <code>react-native-config</code> (native-level, <code>Config.API_URL</code>, exposed to Android/iOS build too) or <code>react-native-dotenv</code>/<code>babel-plugin-dotenv-import</code> (Babel inlines a virtual <code>@env</code> module).</li>
    <li><strong>Expo has dotenv built in:</strong> <code>EXPO_PUBLIC_*</code> vars inline as <code>process.env.EXPO_PUBLIC_*</code>; structured config goes in <code>extra</code> and is read via <code>Constants.expoConfig.extra</code> (<code>expo-constants</code>).</li>
    <li><strong>Bundle = public.</strong> Every inlined value ships in readable JS. <code>.gitignore</code> protects the repo, not the bundle. Publishable keys only; private secrets never inlined.</li>
    <li><strong><code>eas.json</code> profiles:</strong> <code>development</code> (<code>developmentClient</code>), <code>preview</code> (<code>distribution: internal</code>, apk), <code>production</code> (<code>distribution: store</code>, app-bundle). Fields: <code>channel</code>, per-profile <code>env</code>, <code>android.buildType</code>, <code>ios.simulator</code>/<code>resourceClass</code>, <code>cli.appVersionSource</code>, <code>submit</code> profiles.</li>
    <li><strong>Three tiers of secrecy:</strong> public (URL/flags → <code>.env</code>/<code>EXPO_PUBLIC_</code>/<code>extra</code>), build-only (Sentry token, service-account → EAS secrets via <code>eas secret:create</code>/<code>eas env</code>, used at build, not bundled), true runtime secret (DB/private key → server only).</li>
    <li><strong>App variants side by side:</strong> distinct <code>applicationId</code>/bundle id + name + icon per env, from <code>process.env.APP_ENV</code> in <code>app.config.js</code>, or Android product flavors / iOS schemes+configs+xcconfig in bare RN.</li>
    <li><strong>UAT/PROD runtime switch:</strong> compile both (non-secret) URLs in, persist the choice (AsyncStorage/MMKV), API client reads current base URL each request — flips without reinstall.</li>
    <li><strong>Toolchain pinning:</strong> <code>.nvmrc</code>/<code>.node-version</code> (Node), <code>.ruby-version</code> (Ruby), <code>Gemfile</code>+<code>Gemfile.lock</code> (CocoaPods/Fastlane) → reproducible <code>bundle exec pod install</code>.</li>
    <li><strong>OTA:</strong> <code>expo-updates</code>/EAS Update ships JS + assets only, no native. <code>runtimeVersion</code> is the native contract; channels (build) map to branches (<code>eas update</code>). CodePush is legacy/retired.</li>
    <li><strong>Env is inlined at build/transform time:</strong> change JS env → reset Metro cache (<code>--clear</code>/<code>--reset-cache</code>); change native env → rebuild. <code>process.env</code> in app code is a compile-time shim.</li>
    <li><strong>Expo prebuild reality:</strong> don't hand-edit <code>android/</code>/<code>ios/</code> (wiped by <code>expo prebuild --clean</code>) — use config plugins / <code>expo-build-properties</code>; <code>app.config.js</code> runs on the build host, not the device.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Putting a real secret behind <code>EXPO_PUBLIC_</code> (or in <code>extra</code>) and thinking <code>.gitignore</code> keeps it safe.</strong> The bundler inlines it into the JS and it ships to every device in plain text — grep-able from the apk/ipa. Fix: only publishable/public values in the bundle; build-only secrets in EAS secrets consumed at build time; true secrets on the server. (Second trap: editing <code>.env</code> and expecting a hot reload — you must reset Metro cache for JS env or rebuild for native env.)</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"I select the environment at build time with a profile that sets <code>APP_ENV</code> — <code>eas.json</code> in Expo, product flavors and schemes in bare RN — and <code>app.config.js</code> reads it to set the URL, name, bundle id, icon, and flags."</div>
  <div class="revision-say">"Anything in the JS bundle is public, so <code>EXPO_PUBLIC_</code> and <code>extra</code> are for URLs and publishable keys; real secrets go in EAS secrets used only at build time, or stay on the server. Git-ignore protects the repo, not the bundle."</div>
  <div class="revision-say">"For a QA UAT/PROD switch I compile both URLs in and flip a persisted flag at runtime — legit because URLs aren't secret. And RN has no built-in dotenv, so it's a library or Expo's <code>EXPO_PUBLIC_</code>, inlined at build time."</div>
</div>
`},

{ id: 'checklist', title: '✅ Interview Checklist', collapsible: true, html: `
<div class="callout success">
  <div class="callout-title">Can you answer these before moving on?</div>
  <ul>
    <li>Can you explain why RN has no built-in dotenv and name the libraries (plus Expo's <code>EXPO_PUBLIC_</code>) that fill the gap?</li>
    <li>Can you state why a value in the JS bundle is not secret, and where real secrets should live instead?</li>
    <li>Can you describe the main <code>eas.json</code> build-profile fields and what <code>distribution</code>, <code>channel</code>, and <code>buildType</code> control?</li>
    <li>Can you set up dev/staging/prod as side-by-side installs with distinct bundle ids, names, and icons?</li>
    <li>Can you implement a runtime UAT/PROD switch and justify why it's safe for URLs but not for keys?</li>
    <li>Can you explain what OTA (EAS Update) can and cannot ship, and the role of <code>runtimeVersion</code>, channels, and branches?</li>
    <li>Can you say why <code>.nvmrc</code>/<code>.ruby-version</code>/<code>Gemfile.lock</code> matter and when a changed env needs a cache reset vs a rebuild?</li>
  </ul>
</div>
`}

]
});
