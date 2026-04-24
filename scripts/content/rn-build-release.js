window.PREP_SITE.registerTopic({
  id: 'rn-build-release',
  module: 'React Native',
  title: 'Build & Release',
  estimatedReadTime: '24 min',
  tags: ['react-native', 'build', 'release', 'eas', 'fastlane', 'codepush', 'ota', 'signing', 'app-store', 'play-store'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>Shipping an RN app requires platform-specific builds, signing, and distribution. Two main workflows:</p>
<ul>
  <li><strong>Expo + EAS Build</strong> — cloud-hosted builds, managed signing, OTA updates via EAS Update. Simplest for most teams.</li>
  <li><strong>Bare RN + Fastlane + CI</strong> — full control, uses your own provisioning, for teams with complex native needs.</li>
</ul>
<ul>
  <li><strong>iOS</strong>: signing via Apple Developer certificates + provisioning profiles. Upload to App Store Connect via Xcode / <code>altool</code> / <code>xcrun</code>. Distribution: TestFlight (beta) → App Store review → production.</li>
  <li><strong>Android</strong>: signing via keystore (<code>.jks</code>). Build as AAB (App Bundle, required by Play). Upload to Play Console → internal / closed / open / production tracks.</li>
  <li><strong>OTA updates</strong>: EAS Update, CodePush (deprecated), Expo Updates — push JS bundle changes without full app review. Works only for JS / asset changes; native code changes still need a full build.</li>
  <li><strong>Release channels / environments</strong>: dev, staging, prod. Configure via <code>.env</code> files + <code>react-native-config</code> or Expo's <code>extra</code> config.</li>
  <li><strong>Versioning</strong>: semantic version for users + build number monotonically increasing per upload.</li>
  <li><strong>Crash reporting + RUM</strong>: Sentry is the de facto tool — symbolication for both JS and native stacks.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Use EAS Build + Update if you're on Expo or want managed infra. Use Fastlane + GitHub Actions if you need full control. Always pair with Sentry (symbolicated crashes) and a staged rollout (TestFlight / Play internal track).</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What "build" means in RN</h3>
<p>Two halves:</p>
<ul>
  <li><strong>JS bundle</strong> — Metro bundles your JS/TS code into a single file (or bytecode .hbc with Hermes), plus assets.</li>
  <li><strong>Native binary</strong> — Xcode produces a <code>.ipa</code>, gradle produces a <code>.aab</code> / <code>.apk</code> — these embed the JS bundle plus native code (libs, pod-installed ObjC/Swift, JNI).</li>
</ul>
<p>A full "release build" is the native binary. You can update just the JS bundle post-release via OTA — that's how CodePush / EAS Update work.</p>

<h3>Why code signing</h3>
<p>Apple and Google both require apps to be cryptographically signed by the publisher. Without signing: can't upload, can't install outside of debug. Signing scheme:</p>
<ul>
  <li>iOS: team's Apple Developer certificate + provisioning profile matching the bundle id. Managed via Xcode or Fastlane Match.</li>
  <li>Android: a local keystore (<code>.jks</code>) holding a private key. Losing it means you can never update your app again — CRITICAL to back up.</li>
</ul>

<h3>Why AAB on Android</h3>
<p>Since 2021, Play Store requires Android App Bundles (<code>.aab</code>) for new uploads. Play Store serves per-device APKs derived from your AAB — smaller downloads. APK is still used for sideloading / CI installs.</p>

<h3>Why TestFlight / Play internal track</h3>
<p>Before releasing to production:</p>
<ul>
  <li><strong>TestFlight</strong>: Apple's beta platform. Up to 100 internal testers (immediate), 10,000 external (requires Apple review of the beta build, same as App Store but faster).</li>
  <li><strong>Play Console internal testing</strong>: up to 100 testers, no review, instant. Plus closed / open / production tracks.</li>
</ul>
<p>Use for QA + staged rollout. Catching a crash here is cheap; catching it in production causes 1-star reviews.</p>

<h3>Why OTA updates</h3>
<p>App Store review takes days. An urgent JS fix (typo, broken API handler) can't wait. OTA pushes the new JS bundle to devices directly from your infra → users get the fix on next launch. Constraints:</p>
<ul>
  <li>Native code (ObjC, Kotlin, native modules) can't be updated OTA.</li>
  <li>Apple's guidelines allow bug-fix OTA but not major feature changes (they want to review).</li>
  <li>Rollout control essential: stage 1%, 10%, 50%, 100% with monitoring.</li>
</ul>

<h3>Why environments matter</h3>
<p>Different API endpoints, analytics IDs, feature flags, Sentry DSNs per environment. Don't ship staging API to production. Use <code>.env</code> files with <code>react-native-config</code> (bare) or <code>extra</code> in <code>app.config.ts</code> (Expo) + a build script that selects per environment.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "release pipeline" picture</h3>
<div class="diagram">
<pre>
  Developer commits
          │
          ▼
  CI (GitHub Actions / Bitrise / GitLab CI)
          │
          ├── Lint + Test + Type check
          ├── EAS Build (or Fastlane) per platform
          │   ├── iOS: pod install → archive → sign → upload to TestFlight
          │   └── Android: gradle assembleRelease → sign → upload to Play internal
          │
          ▼
  Beta testing (TestFlight / Play internal)
          │
          ▼
  Staged rollout to production (1% → 10% → 50% → 100%)
          │
          ├── Sentry crash monitoring
          ├── RUM (perf, INP, crashes)
          └── Revenue / conversion / feature metrics</pre>
</div>

<h3>The "what goes in a build" picture</h3>
<div class="diagram">
<pre>
  Native binary (.ipa / .aab)
  ├── Native code (ObjC, Swift, Kotlin, Java, C++)
  ├── JS engine (Hermes or JSC)
  ├── Bundled JS (app.bundle or .hbc bytecode)
  ├── Assets (images, fonts, audio)
  ├── Localization files
  └── Signed with your certificate</pre>
</div>

<h3>The "OTA update" picture</h3>
<div class="diagram">
<pre>
  EAS Update / CodePush
        │
        ▼
  Server stores {bundleId, platform, releaseChannel, version}
        │
  Client on launch → check for update matching its version → download if new → swap on next launch</pre>
</div>

<h3>The "version numbers" picture</h3>
<pre><code>User-visible version (semver):    1.2.3
Build number (monotonic):          42

iOS: CFBundleShortVersionString = "1.2.3", CFBundleVersion = "42"
Android: versionName = "1.2.3", versionCode = 42

Rules:
  - versionCode / CFBundleVersion MUST increase with each upload.
  - versionName / CFBundleShortVersionString user-facing, doesn't have to match.
  - Use CI to auto-bump on tag.</code></pre>

<h3>The "signing" picture</h3>
<div class="diagram">
<pre>
  iOS                                          Android
  ───                                          ───────
  Apple Developer Cert                          Keystore (.jks)
      │                                            │
      ├── development (team)                      ├── upload key (goes to Play)
      ├── distribution (production)               └── signing key (Play re-signs with theirs now)
      │
  Provisioning profile (links cert + app ID + entitlements)
      │
      ├── dev (locally-installed builds)
      └── distribution (App Store)</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"OTA updates let me push native code." No. OTA updates replace the JS bundle only. Native code (Swift, Kotlin, native modules) requires a full native rebuild + app-store review. If you change a native module, you ship a new binary.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>EAS Build (Expo or bare)</h3>
<pre><code># install
npm install -g eas-cli
eas login

# configure
eas build:configure
# Generates eas.json — build profiles (development, preview, production)

# build
eas build --platform ios --profile production
eas build --platform android --profile production

# submit (auto-submit to stores)
eas submit --platform ios --latest</code></pre>
<pre><code class="language-json">// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": { "distribution": "internal" },
    "production": {
      "autoIncrement": true,
      "ios": { "resourceClass": "m-medium" }
    }
  },
  "submit": {
    "production": { "ios": { "ascAppId": "1234567890" } }
  }
}</code></pre>

<h3>EAS Update — OTA</h3>
<pre><code>eas update:configure
# Adds runtime config; linking app to updates server

eas update --branch production --message "Fix login bug"
# Pushes to 'production' channel; devices with the matching runtimeVersion pick it up</code></pre>

<h3>Fastlane (bare RN)</h3>
<pre><code># iOS Fastfile
lane :beta do
  increment_build_number
  match(type: "appstore")    # fetches certs + profiles from git
  gym(scheme: "YourApp")     # xcode build + archive
  pilot(skip_waiting_for_build_processing: true) # upload to TestFlight
end

# Run:
bundle exec fastlane ios beta</code></pre>

<h3>GitHub Actions example</h3>
<pre><code class="language-yaml">name: Release
on:
  push: { tags: ['v*'] }
jobs:
  ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: cd ios &amp;&amp; pod install
      - uses: maierj/fastlane-action@v3
        with: { lane: 'beta' }
        env:
          MATCH_PASSWORD: \${{ secrets.MATCH_PASSWORD }}
          FASTLANE_PASSWORD: \${{ secrets.FASTLANE_PASSWORD }}</code></pre>

<h3>Environment configs — Expo</h3>
<pre><code class="language-ts">// app.config.ts
export default {
  expo: {
    name: 'MyApp',
    slug: 'myapp',
    extra: {
      apiUrl: process.env.API_URL ?? 'https://dev.api.com',
      env: process.env.APP_ENV ?? 'development',
    },
  },
};

// anywhere:
import Constants from 'expo-constants';
const apiUrl = Constants.expoConfig?.extra?.apiUrl;</code></pre>

<h3>Environment configs — bare (react-native-config)</h3>
<pre><code>// .env.production
API_URL=https://api.example.com
SENTRY_DSN=...

// .env.staging
API_URL=https://staging.example.com

// Build script selects .env:
ENVFILE=.env.production eas build --platform ios --profile production</code></pre>
<pre><code class="language-ts">import Config from 'react-native-config';
const apiUrl = Config.API_URL;</code></pre>

<h3>Version management</h3>
<pre><code># manually bump both platforms
npm version 1.2.3
# iOS: increment Info.plist CFBundleVersion (build number)
# Android: increment versionCode in android/app/build.gradle

# OR use a script that reads package.json and syncs
// react-native-version package, or custom script
npx react-native-version</code></pre>

<h3>iOS code signing — Fastlane Match</h3>
<pre><code># Matchfile
git_url("git@github.com:myorg/certs.git")
type("appstore")

# Developers run once:
fastlane match appstore
# Fetches certs + profiles from shared git repo, installs locally</code></pre>

<h3>Android signing — keystore</h3>
<pre><code># Generate keystore (one-time per app)
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.jks -alias my-app -keyalg RSA -keysize 2048 -validity 10000

# In android/gradle.properties (do NOT commit passwords):
MYAPP_UPLOAD_STORE_FILE=my-release-key.jks
MYAPP_UPLOAD_KEY_ALIAS=my-app
MYAPP_UPLOAD_STORE_PASSWORD=...
MYAPP_UPLOAD_KEY_PASSWORD=...

# android/app/build.gradle:
signingConfigs {
  release {
    storeFile file(MYAPP_UPLOAD_STORE_FILE)
    storePassword MYAPP_UPLOAD_STORE_PASSWORD
    keyAlias MYAPP_UPLOAD_KEY_ALIAS
    keyPassword MYAPP_UPLOAD_KEY_PASSWORD
  }
}
buildTypes {
  release {
    signingConfig signingConfigs.release
    minifyEnabled true
    proguardFiles ...
  }
}</code></pre>

<h3>Upload AAB to Play</h3>
<pre><code># Build:
cd android &amp;&amp; ./gradlew bundleRelease
# AAB at: android/app/build/outputs/bundle/release/app-release.aab

# Upload via:
- Play Console web UI (manual)
- Fastlane supply (automated)
- EAS Submit</code></pre>

<h3>Crash reporting — Sentry</h3>
<pre><code class="language-ts">import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://...',
  environment: 'production',
  release: 'myapp@1.2.3+42',
  dist: '42',
  tracesSampleRate: 0.1,
  enabled: !__DEV__,
});

// Native + JS crashes symbolicated to source.
// In CI after build: upload source maps + debug symbols:
npx sentry-expo-upload-sourcemaps dist</code></pre>

<h3>Staged rollout on Play</h3>
<p>In Play Console → Production → Release to 5% first → monitor crash rate → increase to 25% → 50% → 100%. Can halt if crashes spike.</p>

<h3>Phased release on App Store</h3>
<p>App Store Connect → your app → Version → Phased Release = 7-day default rollout (increases users served each day).</p>

<h3>OTA best practices</h3>
<ul>
  <li>Tie JS bundles to a <strong>runtimeVersion</strong> (native code version). Incompatible native + JS = crash; runtimeVersion prevents.</li>
  <li>Stage rollouts — start with a preview channel, then production.</li>
  <li>Monitor Sentry for spike after OTA push; rollback if needed.</li>
  <li>Don't push risky native-incompatible changes OTA — ship via App Store.</li>
  <li>For critical perf issues, OTA can save the day; for new features, usually ship via binary.</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — EAS build profiles</h3>
<pre><code class="language-json">{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal", "android": { "buildType": "apk" } },
    "production": {
      "autoIncrement": true,
      "env": { "APP_ENV": "production" }
    }
  }
}</code></pre>

<h3>Example 2 — runtimeVersion policy</h3>
<pre><code class="language-ts">// app.config.ts
export default {
  expo: {
    runtimeVersion: { policy: 'sdkVersion' },   // tied to Expo SDK major version
    // or: runtimeVersion: '1.0.0' — explicit; bump when native changes
    updates: {
      url: 'https://u.expo.dev/your-project-id'
    }
  }
};</code></pre>

<h3>Example 3 — Sentry + source maps</h3>
<pre><code># After EAS build, upload source maps
eas update --branch production --message "v1.2.3"
npx sentry-expo-upload-sourcemaps --auth-token $SENTRY_AUTH_TOKEN</code></pre>

<h3>Example 4 — Fastlane iOS deploy</h3>
<pre><code class="language-ruby">lane :production do
  match(type: "appstore", readonly: true)
  increment_build_number(build_number: latest_testflight_build_number + 1)
  gym(scheme: "YourApp", configuration: "Release", export_method: "app-store")
  pilot(skip_waiting_for_build_processing: true)
  upload_to_app_store(skip_metadata: true, skip_screenshots: true, submit_for_review: false)
end</code></pre>

<h3>Example 5 — Fastlane Android deploy</h3>
<pre><code class="language-ruby">lane :production do
  gradle(task: "bundleRelease", project_dir: "android/")
  upload_to_play_store(
    track: "production",
    aab: "android/app/build/outputs/bundle/release/app-release.aab",
    rollout: "0.1"  # 10% staged
  )
end</code></pre>

<h3>Example 6 — environment switch at runtime</h3>
<pre><code class="language-ts">import Constants from 'expo-constants';
const env = Constants.expoConfig?.extra?.env ?? 'development';
const config = {
  apiUrl: { development: 'http://localhost:3000', staging: 'https://staging.api', production: 'https://api' }[env],
  sentryDsn: { development: '', staging: '...', production: '...' }[env],
};
export default config;</code></pre>

<h3>Example 7 — bundle identifier per env</h3>
<pre><code class="language-ts">// app.config.ts
export default ({ config }) =&gt; ({
  ...config,
  ios: { bundleIdentifier: process.env.APP_ENV === 'staging' ? 'com.app.staging' : 'com.app' },
  android: { package: process.env.APP_ENV === 'staging' ? 'com.app.staging' : 'com.app' },
});
// Different bundle IDs allow staging + production apps installed side-by-side</code></pre>

<h3>Example 8 — GitHub Actions for EAS</h3>
<pre><code class="language-yaml">on:
  push: { tags: ['v*'] }
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with: { eas-version: 'latest', token: \${{ secrets.EXPO_TOKEN }} }
      - run: eas build --platform all --profile production --non-interactive
      - run: eas submit --platform all --latest --non-interactive</code></pre>

<h3>Example 9 — Code signing with Match</h3>
<pre><code># Initial setup (once per team):
fastlane match appstore

# Every developer, once:
fastlane match appstore --readonly

# In CI:
match(type: "appstore", readonly: true,
      git_url: "git@github.com:myorg/certs",
      git_branch: "main")</code></pre>

<h3>Example 10 — CodePush (deprecated, for reference)</h3>
<pre><code># Publish update
appcenter codepush release-react -a myorg/myapp-ios -d Production
# Client checks for update on launch, downloads if available</code></pre>
<p>Microsoft deprecated CodePush; migrate to EAS Update or Expo Updates.</p>

<h3>Example 11 — Play Store versioning script</h3>
<pre><code class="language-js">// scripts/bump-version.js
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json'));
const [maj, min, pat] = pkg.version.split('.').map(Number);
const next = \`\${maj}.\${min}.\${pat + 1}\`;
pkg.version = next;
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
// Also update ios/Info.plist and android/app/build.gradle build number</code></pre>

<h3>Example 12 — OTA rollback</h3>
<pre><code># EAS Update — republish a prior runtime manifest:
eas update --branch production --message "Rollback to 1.2.2" --rollback-to-embedded

# Or publish the previous JS bundle explicitly:
git checkout v1.2.2
eas update --branch production</code></pre>

<h3>Example 13 — hotfix vs full release decision</h3>
<p>Hotfix via OTA if: JS-only change, small scope, low risk. Full app release if: native code changes, privacy policy changes, significant UX changes, something Apple might flag.</p>

<h3>Example 14 — keystore backup (critical)</h3>
<pre><code># Back up your Android keystore + passwords to a secure store:
- Password manager
- Company vault (1Password, Bitwarden Teams)
- Encrypted cloud storage

# If lost: you can never update your app on Play Store again.
# Play now allows "Play App Signing" → Google holds the signing key.</code></pre>

<h3>Example 15 — preview deployment for a PR</h3>
<pre><code class="language-yaml"># Every PR gets a preview build uploaded to TestFlight / Play internal
on: pull_request
jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
      - run: eas build --platform all --profile preview --message "PR #\${{ github.event.number }}"
      # QA team installs the preview build, tests, approves the PR</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Forgotten Info.plist usage description</h3>
<p>Missing <code>NSCameraUsageDescription</code> causes App Store rejection. Review every permission you might request.</p>

<h3>2. Keystore lost</h3>
<p>You cannot update your Android app without the original keystore — app effectively dead on Play. Google's "Play App Signing" option (since 2021) lets them hold the signing key; only upload key can be rotated. Enable for new apps.</p>

<h3>3. Version code mismatch between Play and Apple</h3>
<p>Play and App Store use different numbering; you don't need to keep them in sync. But you do need to always increment for each upload to the same platform.</p>

<h3>4. OTA incompatible with native change</h3>
<p>Ship OTA JS that calls a new native method → crash on old binaries. Always bump <code>runtimeVersion</code> when native changes, so OTA doesn't cross-pollinate.</p>

<h3>5. Metro bundling include/exclude</h3>
<p>Dev-only code leaking into prod bundles. Configure <code>__DEV__</code> checks and Babel transforms to strip.</p>

<h3>6. iOS "Missing compliance" export compliance</h3>
<p>Every App Store upload asks about cryptography. If you use standard HTTPS, you're exempt — add <code>ITSAppUsesNonExemptEncryption=false</code> to Info.plist.</p>

<h3>7. App Store review rejection patterns</h3>
<ul>
  <li>Sign-in required without explaining why.</li>
  <li>Apple Pay / IAP bypassed for digital goods.</li>
  <li>Privacy manifest missing.</li>
  <li>Broken features in reviewer's test.</li>
</ul>

<h3>8. Android 64-bit requirement</h3>
<p>Since 2019, APKs must include 64-bit (arm64-v8a) support. RN default covers this. Lean out 32-bit if possible (reduce app size).</p>

<h3>9. Privacy manifests (iOS 17+)</h3>
<p>Apps must declare data collection, tracking, required reason API usage in <code>PrivacyInfo.xcprivacy</code>. Some libraries now ship their own privacy manifests; you aggregate.</p>

<h3>10. Target SDK requirements</h3>
<p>Play raises minimum targetSdkVersion yearly. Missing the deadline blocks new uploads. RN new-arch ready projects stay current.</p>

<h3>11. OTA update download size</h3>
<p>A big JS change (10MB+) on cellular is painful. Keep bundles small; split per route with Suspense + lazy.</p>

<h3>12. Multiple schemes for environments</h3>
<p>Xcode can define multiple schemes (Development, Staging, Production). Each builds with different configs / bundle IDs. Keeps production clean from dev analytics DSNs.</p>

<h3>13. Expo bare vs managed workflow</h3>
<p>Managed: Expo runs prebuild automatically, you don't touch native. Bare: you have ios/ and android/ directories with custom native code. Choose based on whether you need custom native modules.</p>

<h3>14. Expo Dev Client vs Expo Go</h3>
<p>Expo Go: sandboxed test app — runs only libraries shipped in Go. Custom native modules don't work. Dev Client: your app's own dev build — supports all installed native code. Essential when you have any custom native.</p>

<h3>15. CI build time</h3>
<p>Fresh CI runners re-install node_modules, pods, gradle caches every build. Multi-minute adds. Cache <code>node_modules</code>, <code>~/.pod</code>, <code>~/.gradle</code> across runs.</p>

<h3>16. Forgotten app icon / launch screen</h3>
<p>App Store will reject an iOS app missing full icon set. Test icons on the target device — they can look different in context.</p>

<h3>17. iOS entitlements mismatch</h3>
<p>Using Push Notifications / Apple Pay / iCloud requires entitlements enabled in Apple Developer portal AND in the provisioning profile. Mismatch → runtime error.</p>

<h3>18. ProGuard / R8 (Android) obfuscation</h3>
<p>Release builds enable minification. Native module reflection can break. Add keep rules for problem libraries.</p>

<h3>19. iOS build archive vs generic build</h3>
<p>Xcode archive for distribution is different from running on simulator. Release builds may have different Swift compilation settings, bitcode (now deprecated), symbols. Test archives before uploading.</p>

<h3>20. Versioning for hotfix vs feature</h3>
<p>Semver: bug fix = patch bump, backward-compat feature = minor, breaking = major. Mobile is less strict but: keep your schema consistent. Users see "1.2.3" and "2.0.0" differently.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — committing secrets</h3>
<p>Keystore passwords, Sentry DSNs, API keys in git. Use CI secrets, <code>.env</code> files (not committed), or Fastlane <code>Match</code>.</p>

<h3>Anti-pattern 2 — no staged rollout</h3>
<p>Ship 100% on day 1. A latent crash hits every user. Always stage on Play + phased release on App Store.</p>

<h3>Anti-pattern 3 — OTA without runtimeVersion</h3>
<p>Push a JS bundle that depends on a native change not in the user's binary → crashes. Bind OTA to runtimeVersion matching the native code.</p>

<h3>Anti-pattern 4 — no crash reporting</h3>
<p>Users reporting "it just crashes" — you have no stack. Always install Sentry / Crashlytics before production.</p>

<h3>Anti-pattern 5 — manual versioning</h3>
<p>Forgetting to bump versionCode causes Play upload failure. Automate via CI script.</p>

<h3>Anti-pattern 6 — copying development config to production</h3>
<p>Points at dev API, dev analytics. Use environment-specific configs.</p>

<h3>Anti-pattern 7 — not testing release builds</h3>
<p>Dev builds have Fast Refresh, console warnings, different JS engine behavior. Test the actual release binary before shipping.</p>

<h3>Anti-pattern 8 — source maps not uploaded to Sentry</h3>
<p>Production stack traces show minified identifiers — useless. Upload source maps after each build.</p>

<h3>Anti-pattern 9 — over-relying on OTA</h3>
<p>"We'll fix it OTA." OTA is powerful but has limits (can't fix native, stage requires discipline, size-bounded). Don't ship rushed native code thinking you'll patch later.</p>

<h3>Anti-pattern 10 — releasing on Friday afternoon</h3>
<p>Crash spikes discovered Saturday morning with nobody to respond. Ship Monday-Wednesday.</p>

<h3>Anti-pattern 11 — no rollback plan</h3>
<p>App is on fire; nobody knows how to revert. Practice OTA rollback + staged revert; document it.</p>

<h3>Anti-pattern 12 — skipping privacy manifests</h3>
<p>Apple rejects or warns about missing PrivacyInfo. Include from your first submission.</p>

<h3>Anti-pattern 13 — letting one person hold signing creds</h3>
<p>Bus factor 1. Keystore + App Store Connect credentials must be accessible to the team.</p>

<h3>Anti-pattern 14 — broken app icon / launch screen</h3>
<p>Wrong size, missing variants. Apple rejects. Use icon-generator tools.</p>

<h3>Anti-pattern 15 — no alpha / beta distribution</h3>
<p>Internal team only tests in dev (simulator). Production-only issues. TestFlight / Play internal is free and fast.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. Walk me through shipping an RN app to production.</div>
  <div class="qa-answer">
    <ol>
      <li>Code frozen; run CI (lint, test, type check).</li>
      <li>Build binaries per platform (EAS Build or Fastlane).</li>
      <li>Sign with production certificates (iOS) / release keystore (Android).</li>
      <li>Upload to TestFlight / Play internal track.</li>
      <li>QA + stakeholder review on the beta build.</li>
      <li>Submit for review (iOS) / promote to production track (Android).</li>
      <li>Staged rollout — start at 5-10%, monitor crash rate + RUM metrics.</li>
      <li>Increase to 100% over days/week; halt if crashes spike.</li>
      <li>Sentry captures any issues; hotfix via OTA if JS-only.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. EAS Build vs Fastlane vs custom CI?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>EAS Build</strong>: managed cloud builds from Expo. Zero native infrastructure. Best for Expo teams or teams avoiding iOS build machines.</li>
      <li><strong>Fastlane</strong>: mature, flexible, works on any CI. Handles signing via Match, uploads via pilot / supply. Best for teams with complex native / custom workflows.</li>
      <li><strong>Custom CI</strong> (GitHub Actions / Bitrise): use either EAS or Fastlane as the execution layer; CI orchestrates.</li>
    </ul>
    <p>Recommendation: EAS if on Expo; Fastlane + GitHub Actions for bare RN.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. What are OTA updates and when do you use them?</div>
  <div class="qa-answer">
    <p>OTA (Over-The-Air) updates push a new JS bundle to already-installed devices without going through the app store. Use for:</p>
    <ul>
      <li>Urgent JS bug fixes.</li>
      <li>Rapid iteration on JS-only features.</li>
      <li>Backend API compatibility fixes.</li>
    </ul>
    <p>Don't use for: native code changes (impossible), major new features (review risk), permissions-requiring features.</p>
    <p>Libraries: EAS Update (current), Expo Updates, legacy CodePush (deprecated).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. What's runtimeVersion and why does it matter?</div>
  <div class="qa-answer">
    <p>A version number tied to the native binary. OTA bundles specify a runtimeVersion — devices only download updates matching their current runtimeVersion. Prevents incompatible JS from running against mismatched native. Bump it when native code changes. Common policies: <code>sdkVersion</code> (bump with Expo SDK upgrades), <code>appVersion</code> (bump with user version), or explicit strings.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. How do you manage code signing?</div>
  <div class="qa-answer">
    <p><strong>iOS</strong>: certificates + provisioning profiles. Easiest: Fastlane Match — stores signed assets in a private git repo, fetches as needed. Team members + CI run <code>match readonly</code>. Apple Developer account admin manages revocation.</p>
    <p><strong>Android</strong>: keystore (.jks) + password. Generate once, back up to vault, pass via CI secrets. Play App Signing lets Google hold the final signing key; you rotate upload key independently.</p>
    <p><strong>EAS Build</strong>: manages certificates/keystores for you via <code>eas credentials</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How do you handle environments (dev/staging/prod)?</div>
  <div class="qa-answer">
    <p>Separate build profiles that set environment variables and, optionally, different bundle IDs. Expo: <code>app.config.ts</code> reads <code>process.env</code> and puts into <code>extra</code>. Bare: <code>react-native-config</code> with <code>.env</code> files. Key decisions:</p>
    <ul>
      <li>Different API URLs per env.</li>
      <li>Different Sentry DSNs.</li>
      <li>Different bundle IDs for staging — allows side-by-side install with production.</li>
      <li>Feature flags read from env.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How do you implement crash reporting?</div>
  <div class="qa-answer">
    <p>Sentry (most popular) or Firebase Crashlytics.</p>
    <ol>
      <li>Init on app start with DSN, release version, environment.</li>
      <li>Wrap navigation with Sentry's tracing integration.</li>
      <li>Upload source maps + native debug symbols (dSYM iOS, mapping.txt Android) with each build.</li>
      <li>Set user context (<code>Sentry.setUser</code>) so crashes are correlated.</li>
      <li>Monitor dashboard; alert on new issues.</li>
    </ol>
    <p>Without symbols, stack traces are useless — the post-build upload is critical.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. You deployed a broken version. How do you respond?</div>
  <div class="qa-answer">
    <ol>
      <li>Halt staged rollout (Play Console / App Store Connect).</li>
      <li>If broken code is JS-only → OTA rollback to previous bundle. Users get fix on next launch.</li>
      <li>If native → can't quickly revert; prepare a hotfix binary, submit expedited review on iOS.</li>
      <li>Communicate via in-app banner or status page.</li>
      <li>Post-mortem: what caught the bug? How to prevent in CI?</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Expo managed vs bare workflow?</div>
  <div class="qa-answer">
    <p><strong>Managed</strong>: Expo runs prebuild; your app has no <code>ios/</code> or <code>android/</code> directories. Can only use libraries that Expo supports. EAS Build generates the native project at build time. Simpler; less control.</p>
    <p><strong>Bare</strong>: you have full native projects. Can install any native library. More setup. EAS Build still works.</p>
    <p>Migrate managed → bare with <code>npx expo prebuild</code> when you need custom native. Going back is hard.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. What's TestFlight and how do you use it?</div>
  <div class="qa-answer">
    <p>Apple's beta platform. Upload an IPA to App Store Connect, wait ~10-30 minutes for processing, distribute to testers. Two tiers: Internal (100 team members, no review, instant access) and External (up to 10K, requires lightweight Apple review, takes minutes to hours). Use for QA + stakeholder preview before production submission. Builds auto-expire after 90 days.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Play Store tracks — explain.</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Internal testing</strong>: 100 testers, no review, immediate.</li>
      <li><strong>Closed testing</strong> (alpha): larger group via email invites or Google Groups.</li>
      <li><strong>Open testing</strong> (beta): public opt-in; users find on Play Store.</li>
      <li><strong>Production</strong>: global release, with staged rollout percentages.</li>
    </ul>
    <p>Promote the same build up through tracks — no re-upload if stable on internal.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. How do you version your app?</div>
  <div class="qa-answer">
    <p>Semantic version for users (<code>1.2.3</code>) + monotonic build number (<code>42</code>) for stores. Bump build number on every CI upload (EAS has <code>autoIncrement</code>). Bump user-facing version per release (CI script on git tag, or manual). iOS uses <code>CFBundleShortVersionString</code> + <code>CFBundleVersion</code>; Android uses <code>versionName</code> + <code>versionCode</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. What's Play App Signing?</div>
  <div class="qa-answer">
    <p>Google holds your app's signing key in their secure infrastructure. You upload with an "upload key" (different, rotatable). Benefits: losing your upload key is recoverable; Google can re-sign with optimized splits per device. Enable for new apps; existing apps can migrate. Avoids the catastrophe of losing the original keystore.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. How do you test an OTA update?</div>
  <div class="qa-answer">
    <ol>
      <li>Build a dev-client binary, or use Expo's preview channel.</li>
      <li>Publish OTA to a non-production channel (e.g., "staging").</li>
      <li>Point the staging build at that channel.</li>
      <li>QA team installs → receives OTA → validates.</li>
      <li>Promote to production channel.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Describe a reliable release workflow for a 5-person team.</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Main branch</strong> always releasable. Feature branches merge via PR with CI running tests + type check + preview build.</li>
      <li><strong>Preview</strong>: every PR triggers EAS Build preview profile → TestFlight + Play internal. QA reviews PRs against live binaries.</li>
      <li><strong>Release</strong>: tag <code>v1.2.3</code> → CI runs <code>eas build --profile production</code> → <code>eas submit</code>.</li>
      <li><strong>Rollout</strong>: staged 5% → 25% → 100% over 3-5 days, monitoring Sentry.</li>
      <li><strong>Hotfix</strong>: patch branch from release tag → fast merge → OTA for JS, binary for native.</li>
      <li><strong>Tooling</strong>: Sentry for crashes, LogRocket / FullStory-equivalent for RUM, PagerDuty for alerts.</li>
    </ul>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You know EAS Build + EAS Update for Expo, Fastlane + Match for bare.</li>
    <li>You use staged rollouts (Play) and phased release (App Store).</li>
    <li>You explain OTA constraints (JS-only, runtimeVersion binding).</li>
    <li>You secure your keystore (or use Play App Signing).</li>
    <li>You separate environments via config + bundle IDs.</li>
    <li>You install Sentry and upload source maps.</li>
    <li>You maintain CI previews per PR.</li>
    <li>You have a rollback plan.</li>
  </ul>
</div>
`}

]
});
