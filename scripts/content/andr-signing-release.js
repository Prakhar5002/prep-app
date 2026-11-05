window.PREP_SITE.registerTopic({
  id: "andr-signing-release",
  module: "Android Native (Deep)",
  title: "Signing, Build Types & Release",
  estimatedReadTime: "25 min",
  tags: ["android","keystore","signing-config","keytool","apk-signature-scheme","v1-jar","v2","v3","v4","r8","proguard","minify","shrink-resources","mapping-txt","aab","app-bundle","apk","bundletool","play-app-signing","upload-key","build-types","product-flavors","variants","versioncode","versionname","gradle","eas-build","expo","release"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">The signing key <strong>is</strong> the app's identity — Android only installs an update whose signature matches the installed app — so enroll in <strong>Play App Signing</strong>, keep a resettable <strong>upload key</strong>, back up the release keystore offline, ship an <strong>AAB</strong> with R8 on and <code>mapping.txt</code> archived, and bump <code>versionCode</code> every upload.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Every APK/AAB must be signed.</strong> First install records the signer cert; updates must match it or fail with <code>INSTALL_FAILED_UPDATE_INCOMPATIBLE</code>. Different key = different app.</li>
    <li><strong>Debug keystore</strong>: auto-generated <code>~/.android/debug.keystore</code>, alias <code>androiddebugkey</code>, public password <code>android</code> — teams often commit <code>android/app/debug.keystore</code> to keep a stable SHA-1 for Maps/Firebase. <strong>Release keystore</strong>: your permanent secret identity.</li>
    <li><strong>keytool</strong>: <code>keytool -genkeypair -keystore my.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000</code>. Keystore = container; alias = one key inside; storePassword unlocks the file, keyPassword unlocks the alias.</li>
    <li><strong>Signature schemes</strong>: v1 (JAR, per-file, &lt;API24), v2 (API24, whole-APK block), v3 (API28, key rotation), v4 (API30, Merkle sidecar <code>.idsig</code> for incremental install). AGP picks by minSdk.</li>
    <li><strong>signingConfigs</strong> in <code>app/build.gradle</code> → wired to <code>buildTypes.release.signingConfig</code>; secrets live in <code>~/.gradle/gradle.properties</code> or env vars, <strong>never committed</strong>.</li>
    <li><strong>Build types</strong>: debug (debuggable, no minify) vs release (minify+shrink, release-signed); <code>applicationIdSuffix</code> lets variants coexist; custom types via <code>initWith</code>.</li>
    <li><strong>Product flavors</strong> (dev/staging/prod) need a <code>flavorDimension</code>; <strong>variant = flavor × buildType</strong>; per-flavor values via <code>resValue</code> and <code>buildConfigField</code>.</li>
    <li><strong>R8</strong> (replaced ProGuard, same rule syntax): one pass shrinks + optimizes + obfuscates; <code>shrinkResources</code> needs <code>minifyEnabled true</code>. RN/Gson/Retrofit/JNI need <code>-keep</code> rules or they're stripped/renamed → release-only crashes.</li>
    <li><strong>mapping.txt</strong> (in <code>build/outputs/mapping/release/</code>) deobfuscates crash traces; archive one per <code>versionCode</code>, upload to Play/Crashlytics/Sentry.</li>
    <li><strong>APK vs AAB</strong>: <code>assembleRelease</code> → APK; <code>bundleRelease</code> → AAB. Play requires the AAB and splits it into per-device APKs (density/ABI/language) via Dynamic Delivery. AAB isn't installable — test with <code>bundletool</code>.</li>
    <li><strong>Play App Signing</strong>: Google holds the app signing key and re-signs; you sign with a resettable upload key. Lose the upload key → reset it; the app signing key is safe with Google.</li>
    <li><strong>versionCode</strong> = integer Play uses to order builds (must increment); <strong>versionName</strong> = cosmetic display string.</li>
    <li><strong>ANDROID_ID gotcha</strong>: since Android 8 it's scoped to signing key + user + device; reinstalling with a different signature changes it → kiosk server enrollments keyed on it break (FR Kiosk).</li>
    <li><strong>Expo/EAS</strong>: <code>eas build -p android --profile production</code> makes the AAB, keystore managed in cloud (<code>eas credentials</code>); version in <code>app.json</code> (<code>android.versionCode</code>); R8 tweaks via <code>expo-build-properties</code>; hand-edits to <code>android/</code> die on <code>prebuild --clean</code>.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Testing only the debug build.</strong> R8 shrinking/obfuscation runs only in release, so a missing <code>-keep</code> rule produces a <code>ClassNotFoundException</code>/<code>NoSuchMethodError</code> that never appears in debug. Fix: always smoke-test the real <code>release</code> variant (or an internal-track AAB), add targeted <code>-keep</code> rules for reflection/JNI/serialization targets, and archive <code>mapping.txt</code> per version — never "fix" it by disabling minify.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"The signing key is the app's identity — Android only installs an update whose signature matches the installed app. So I enroll in Play App Signing, keep a resettable upload key, and back up the release keystore offline; losing it without Play App Signing means I can never update the listing again."</div>
  <div class="revision-say">"I ship an AAB via bundleRelease — Play splits it into per-device APKs by density, ABI, and language via Dynamic Delivery. An AAB isn't installable directly, so I reproduce store builds locally with bundletool."</div>
  <div class="revision-say">"R8 shrinks, optimizes, and obfuscates in one pass; reflection and JNI targets like RN codegen and Gson models need -keep rules or they're stripped and crash only in release. I archive mapping.txt per versionCode to deobfuscate production traces."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>Why signing exists at all</h3>
<p>Android has no central gatekeeper checking the <em>authorship</em> of code — anyone can build an APK. Instead the OS uses <strong>signature-based identity continuity</strong>: the first install records the certificate that signed the APK, and every future update must be signed by the <em>same</em> key (technically the same certificate / signing lineage). This is how the system knows that "the new v2 APK is really from the same author as the installed v1" without any account or server. It also gates <strong>signature-level permissions</strong> and lets apps signed by the same key share a UID (<code>sharedUserId</code>, now deprecated).</p>
<p>Consequence: if two builds of "the same app" are signed by different keys, Android treats them as <strong>different, incompatible apps</strong>. You cannot install one over the other — you get <code>INSTALL_FAILED_UPDATE_INCOMPATIBLE</code> and must uninstall first (losing all app data). This is the single most common "why won't it install" bug in day-to-day RN work.</p>

<h3>APK signature schemes (v1 → v4)</h3>
<table>
  <thead><tr><th>Scheme</th><th>Since</th><th>What it signs</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td><strong>v1 (JAR)</strong></td><td>Android 1.0</td><td>Individual files, via <code>META-INF/*.SF</code>/<code>*.RSA</code> like a signed JAR</td><td>Slow to verify, doesn't protect the ZIP structure; vulnerable to some tampering. Still needed for devices below API 24.</td></tr>
    <tr><td><strong>v2</strong></td><td>API 24 (7.0)</td><td>The <em>whole</em> APK as one blob (APK Signing Block)</td><td>Faster + tamper-evident; whole-file hash.</td></tr>
    <tr><td><strong>v3</strong></td><td>API 28 (9.0)</td><td>Whole APK + <strong>key rotation</strong> metadata</td><td>Lets you rotate the signing key while proving lineage.</td></tr>
    <tr><td><strong>v4</strong></td><td>API 30 (11)</td><td>Merkle-tree hash in a sidecar <code>.apk.idsig</code> file</td><td>Enables incremental install (<code>adb install --incremental</code>, ADB streaming).</td></tr>
  </tbody>
</table>
<p>Modern builds sign with several schemes at once for backward compatibility; the Android Gradle Plugin (AGP) enables v1+v2 (and v3/v4 where configured) automatically based on your <code>minSdk</code>. You rarely toggle these by hand — but interviewers love asking "what changed between v1 and v2." Answer: v1 signs files, v2 signs the entire archive as a block, which is both faster and harder to tamper with.</p>

<h3>Debug keystore vs release keystore</h3>
<ul>
  <li><strong>Debug keystore</strong> — auto-created at <code>~/.android/debug.keystore</code> (alias <code>androiddebugkey</code>, store &amp; key password both <code>android</code>). Many RN projects also commit an <code>android/app/debug.keystore</code> so the whole team shares one debug identity (useful for Google Maps/Firebase SHA-1 registration). It is <strong>public and worthless as security</strong> — never ship anything signed with it.</li>
  <li><strong>Release keystore</strong> — one you generate, containing your private key + self-signed certificate. This is the identity of your production app forever. Treat it like a root password.</li>
</ul>

<h3>Why the artifact format matters</h3>
<p>Historically you shipped a single universal <strong>APK</strong>. Since Aug 2021 the Play Store <strong>requires an AAB (Android App Bundle)</strong> for new apps — a publishing format Google splits into per-device APKs (per screen density, ABI, language) so users download only what their device needs. You still build APKs for local installs, CI smoke tests, and sideloading.</p>

<div class="callout info">
  <div class="callout-title">Where this sits relative to the New Architecture</div>
  <p>Signing, build types, R8, and the AAB pipeline are <strong>architecture-agnostic</strong> — they behave identically whether you're on the old Paper/Bridge runtime or Fabric/TurboModules. The one place the New Architecture leaks in is R8 <code>-keep</code> rules for JSI/codegen classes, covered in Mechanics.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>The "identity chain" picture</h3>
<div class="diagram">
<pre>
  keytool  ─────►  my-release.jks  (private key + self-signed cert)
                        │
                        │  referenced by
                        ▼
  android/app/build.gradle  signingConfigs { release { ... } }
                        │
                        │  used by
                        ▼
  buildTypes.release.signingConfig = signingConfigs.release
                        │
        ./gradlew assembleRelease / bundleRelease
                        ▼
        signed app-release.apk  /  app-release.aab
                        │
                        ▼
  Device: install → OS stores signer cert → future updates
          MUST match this cert (or INSTALL_FAILED_UPDATE_INCOMPATIBLE)
</pre>
</div>

<h3>The "variant matrix" picture (flavors × build types)</h3>
<div class="diagram">
<pre>
              buildType: debug        buildType: release
             ┌──────────────────────┬──────────────────────┐
 flavor: dev │ devDebug             │ devRelease           │
             ├──────────────────────┼──────────────────────┤
 flavor: prod│ prodDebug            │ prodRelease          │
             └──────────────────────┴──────────────────────┘
   variant = flavor  ×  buildType
   Gradle tasks:  assembleDevDebug, bundleProdRelease, ...
   applicationId:  com.app.dev (debug)   vs   com.app (prod)
</pre>
</div>

<h3>The "Play App Signing" picture (two keys)</h3>
<div class="diagram">
<pre>
  YOU                              GOOGLE PLAY
  ───                              ───────────
  upload key ──sign──► AAB ──────► verifies upload key
  (resettable)                          │
                                        │ strips your sig,
                                        │ re-signs with:
                                        ▼
                              APP SIGNING KEY (Google holds)
                                        │
                                        ▼
                              split APKs delivered to devices
   Lose the UPLOAD key?  → reset it with Google (app survives).
   Lose the APP SIGNING key? → Google holds it; you're safe.
</pre>
</div>

<h3>The "R8 pipeline" picture</h3>
<div class="diagram">
<pre>
  .class / .kt bytecode + libs
          │
          ▼   R8 (single pass)
  ┌───────────────────────────────────┐
  │ 1. SHRINK   remove unused code     │  ← tree-shaking from entry points
  │ 2. OPTIMIZE inline, merge, devirt  │
  │ 3. OBFUSCATE rename to a,b,c...     │  → mapping.txt (renames)
  │ 4. (shrinkResources) drop res/     │
  └───────────────────────────────────┘
          │
          ▼
  minified classes.dex  +  mapping.txt (KEEP THIS!)
   -keep rules protect reflection targets from steps 1 & 3
</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"The debug and release builds are the same app, so I can build release locally and install it over my debug build." No — debug is signed with the debug keystore, release with your release keystore. Different signatures → the OS refuses the update. And with an <code>applicationIdSuffix</code> like <code>.debug</code> they're literally different package names that coexist. Uninstall or match the variant.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>Step 1 — Generate a release keystore with keytool</h3>
<p><code>keytool</code> ships with the JDK. Generate an RSA key valid well past any plausible app lifetime (Play requires validity through at least 2033; 10000 days is the convention):</p>
<pre><code class="language-bash">keytool -genkeypair -v \\
  -keystore my-release-key.jks \\
  -alias my-key-alias \\
  -keyalg RSA -keysize 2048 \\
  -validity 10000</code></pre>
<p>It prompts for a <strong>keystore password</strong> (protects the file), a <strong>key password</strong> (protects the specific alias — can match the store password), and a Distinguished Name (CN, OU, O, L, ST, C). Key vocabulary:</p>
<ul>
  <li><strong>Keystore (.jks / .keystore)</strong> — an encrypted container that can hold many keys. Modern format is PKCS12; older is proprietary JKS. Convert with <code>keytool -importkeystore</code>.</li>
  <li><strong>Alias</strong> — the name of one key entry inside the keystore (<code>my-key-alias</code>). One keystore can hold aliases for several apps.</li>
  <li><strong>storePassword</strong> — unlocks the keystore file. <strong>keyPassword</strong> — unlocks the alias's private key.</li>
</ul>
<p>Inspect a keystore / read the SHA-1 &amp; SHA-256 fingerprints (needed for Google Maps, Firebase, App Links):</p>
<pre><code class="language-bash">keytool -list -v -keystore my-release-key.jks -alias my-key-alias</code></pre>

<div class="callout danger">
  <div class="callout-title">Guard the keystore</div>
  <p>If you are <strong>not</strong> on Play App Signing and you lose this file (or forget its password), you can <em>never publish an update</em> to that app again — you'd have to ship a brand-new listing with a new package name and lose all installs, reviews, and ranking. Back it up in at least two secure offline locations. Never commit it. Never paste passwords into <code>build.gradle</code> or git.</p>
</div>

<h3>Step 2 — Store credentials outside version control</h3>
<p>Put the secrets in <code>~/.gradle/gradle.properties</code> (global, never in the repo) or an untracked <code>android/gradle.properties</code>, or read them from environment variables in CI:</p>
<pre><code class="language-properties"># ~/.gradle/gradle.properties  (NOT committed)
MYAPP_UPLOAD_STORE_FILE=my-release-key.jks
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=********
MYAPP_UPLOAD_KEY_PASSWORD=********</code></pre>
<p>In CI, prefer environment variables read via <code>System.getenv("...")</code> and inject the keystore file as a base64-decoded secret. Never let secrets reach <code>git</code> or build logs.</p>

<h3>Step 3 — Wire up signingConfigs in app/build.gradle</h3>
<pre><code class="language-groovy">// android/app/build.gradle
android {
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
    }

    buildTypes {
        debug {
            signingConfig signingConfigs.debug   // auto debug.keystore
        }
        release {
            signingConfig signingConfigs.release  // wire the real key
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}</code></pre>
<p>The <code>debug</code> signing config is predefined by AGP and points at <code>~/.android/debug.keystore</code>; you normally don't declare it.</p>

<h3>Step 4 — Build types in depth</h3>
<ul>
  <li><strong>debug</strong> — <code>debuggable true</code> (attach a debugger, allows cleartext by default in dev), <code>minifyEnabled false</code>, signed with the debug key, no optimization. Fast builds.</li>
  <li><strong>release</strong> — <code>debuggable false</code>, minify + shrink on, signed with the release key, optimized. Slow builds, small artifact.</li>
  <li><strong>applicationIdSuffix</strong> — appends to the package name so builds coexist on one device: <code>applicationIdSuffix ".debug"</code> makes <code>com.app.debug</code> sit beside prod <code>com.app</code>.</li>
  <li><strong>versionNameSuffix</strong> — e.g. <code>"-DEBUG"</code> so QA can read the flavor from the About screen.</li>
  <li>You can define <strong>custom build types</strong> (e.g. <code>staging</code>) with <code>initWith debug</code> then override fields.</li>
</ul>
<pre><code class="language-groovy">buildTypes {
    staging {
        initWith debug
        applicationIdSuffix ".staging"
        versionNameSuffix "-STAGING"
        matchingFallbacks = ['debug']   // for flavor dimension resolution
    }
}</code></pre>

<h3>Step 5 — Product flavors, dimensions, and variants</h3>
<p>Flavors are compile-time variations of the <em>same</em> app (different API base URL, app name, icon, feature flags). Every flavor must belong to a <strong>flavor dimension</strong>. A <strong>variant</strong> is the cross product flavor × buildType.</p>
<pre><code class="language-groovy">android {
    flavorDimensions "env"
    productFlavors {
        dev {
            dimension "env"
            applicationId "com.myapp.dev"
            resValue "string", "app_name", "MyApp Dev"
            buildConfigField "String", "API_BASE", "\\"https://dev.api.myapp.com\\""
        }
        prod {
            dimension "env"
            applicationId "com.myapp"
            resValue "string", "app_name", "MyApp"
            buildConfigField "String", "API_BASE", "\\"https://api.myapp.com\\""
        }
    }
}</code></pre>
<ul>
  <li><strong>resValue</strong> generates a resource (e.g. a string) at build time — read via <code>@string/app_name</code>.</li>
  <li><strong>buildConfigField</strong> generates a constant on the <code>BuildConfig</code> class — read in Kotlin as <code>BuildConfig.API_BASE</code>. (Requires <code>buildFeatures.buildConfig true</code> on newer AGP.)</li>
  <li>Multiple dimensions (e.g. <code>env</code> × <code>store</code>) multiply: <code>devGoogleDebug</code>, <code>prodAmazonRelease</code>, etc. Gradle tasks become <code>assembleDevDebug</code>, <code>bundleProdRelease</code>.</li>
</ul>

<h3>Step 6 — R8 / ProGuard (shrink, optimize, obfuscate)</h3>
<p><strong>R8</strong> is Google's default code shrinker since AGP 3.4; it replaced ProGuard but <em>reuses ProGuard's rule syntax</em> (<code>proguard-rules.pro</code>). One pass does four jobs:</p>
<ol>
  <li><strong>Shrinking</strong> (<code>minifyEnabled true</code>) — tree-shakes unreachable classes/methods from the entry points (manifest, keep rules).</li>
  <li><strong>Optimization</strong> — inlining, class merging, devirtualization, removing logging, etc. (<code>proguard-android-optimize.txt</code> enables the aggressive set).</li>
  <li><strong>Obfuscation</strong> — renames classes/methods to <code>a</code>, <code>b</code>, <code>c</code> to shrink and deter reverse engineering. Produces <code>mapping.txt</code>.</li>
  <li><strong>Resource shrinking</strong> (<code>shrinkResources true</code>, requires <code>minifyEnabled true</code>) — strips unreferenced <code>res/</code> entries.</li>
</ol>
<p><strong>Why RN and reflection-based libs need keep rules:</strong> R8 removes/renames anything it can't see being called <em>statically</em>. Code reached only by reflection or JNI — Gson model fields, Retrofit interfaces, native methods, RN's generated TurboModule/Fabric classes — looks "unused," so R8 deletes or renames it and the app crashes at runtime with <code>ClassNotFoundException</code>/<code>NoSuchMethodError</code>. You protect them with <code>-keep</code> rules:</p>
<pre><code class="language-text"># proguard-rules.pro
# Keep a class and all members (reflection/JNI targets)
-keep class com.myapp.model.** { *; }

# Keep classes referenced from native (JSI/JNI)
-keepclasseswithmembernames class * {
    native &lt;methods&gt;;
}

# Gson: keep model field names (obfuscation would break JSON mapping)
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.google.gson.** { *; }

# Don't warn about optional deps
-dontwarn okhttp3.**</code></pre>
<p>React Native ships default keep rules for its runtime; most breakage comes from <em>your own</em> reflection/serialization models and third-party SDKs. Always do a full <code>release</code> smoke test — bugs from over-aggressive shrinking only appear in release.</p>

<div class="callout warn">
  <div class="callout-title">mapping.txt is not optional</div>
  <p>After obfuscation, a production crash stack trace is gibberish (<code>a.b.c(Unknown Source)</code>). The per-build <code>android/app/build/outputs/mapping/release/mapping.txt</code> is the decoder ring. Upload it to Play Console / Crashlytics / Sentry for that exact version so traces are deobfuscated. Archive one per <code>versionCode</code> — a mapping from a different build won't decode correctly.</p>
</div>

<h3>Step 7 — Build the artifacts</h3>
<pre><code class="language-bash"># APK (sideload, CI, QA). Output: app/build/outputs/apk/release/app-release.apk
./gradlew assembleRelease

# AAB (Play Store). Output: app/build/outputs/bundle/release/app-release.aab
./gradlew bundleRelease

# Flavor-specific
./gradlew bundleProdRelease
./gradlew assembleDevDebug</code></pre>

<h3>Step 8 — What an AAB is, and testing it locally with bundletool</h3>
<p>An <strong>AAB</strong> is a publishing container (protobuf manifest + per-module code/resources) that is <em>not installable directly</em> — a device can't run an <code>.aab</code>. Google Play (or <code>bundletool</code>) generates <strong>split APKs</strong> from it: a base APK plus config splits per <strong>density</strong>, <strong>ABI</strong> (arm64-v8a, x86_64…), and <strong>language</strong>, delivered via <strong>Dynamic Delivery</strong> so a user only downloads what their device needs. To test an AAB locally you convert it to a device-specific APK set:</p>
<pre><code class="language-bash"># Build an APK set for a connected device and install it
bundletool build-apks \\
  --bundle=app-release.aab \\
  --output=app.apks \\
  --connected-device \\
  --ks=my-release-key.jks --ks-key-alias=my-key-alias

bundletool install-apks --apks=app.apks</code></pre>
<p>This is how you reproduce "works as an APK but breaks from the store" bugs (missing ABI split, stripped resource, language config).</p>

<h3>Step 9 — Google Play App Signing (upload key vs app signing key)</h3>
<ul>
  <li>When you enroll, Google holds the real <strong>app signing key</strong> (the identity users' devices verify) in their secure infrastructure and re-signs every delivered APK with it.</li>
  <li>You sign uploads with an <strong>upload key</strong> (often a separate key you generate). Play verifies the upload key, discards your signature, and re-signs with the app signing key.</li>
  <li><strong>Lose the upload key?</strong> Contact Google, prove ownership, and <strong>reset</strong> it — the app is fine. <strong>Lose the app signing key?</strong> Google has it; you were never the single point of failure. This is the whole reason to enroll.</li>
</ul>

<h3>Step 10 — Versioning</h3>
<ul>
  <li><strong>versionCode</strong> — a monotonically increasing integer. Play uses <em>only</em> this to decide which build is "newer" and to gate updates/staged rollouts. Every upload to a track must have a strictly higher <code>versionCode</code> than any prior upload. Users never see it.</li>
  <li><strong>versionName</strong> — a display string (<code>"3.4.1"</code>). Purely cosmetic to Play; shown on the store listing and About screen. Any format.</li>
</ul>
<pre><code class="language-groovy">android {
    defaultConfig {
        applicationId "com.myapp"
        versionCode 42          // MUST increment every Play upload
        versionName "3.4.1"     // human-readable, cosmetic
    }
}</code></pre>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — EAS Build manages the keystore in the cloud</div>
  <p>In Prakhar's Expo prebuild apps (<code>sw-mobile</code>, <code>sw-ticketing</code>) you usually never touch <code>signingConfigs</code> by hand. <code>eas build --platform android --profile production</code> produces the <strong>AAB</strong>, and EAS <strong>generates and stores the release keystore in the cloud</strong>. Inspect/download/rotate it with <code>eas credentials</code> (choose Android → your build profile). Set the version in <code>app.json</code> under <code>android.versionCode</code> (and <code>expo.version</code> for versionName), or let EAS auto-increment with <code>"autoIncrement": true</code> in <code>eas.json</code>. Because these are <strong>prebuild</strong> projects, hand-edits to <code>android/app/build.gradle</code> get wiped by <code>expo prebuild --clean</code> — set signing/version via <code>app.json</code> + <code>eas.json</code> and R8/ProGuard tweaks via the <code>expo-build-properties</code> config plugin (<code>enableProguardInReleaseBuilds</code>, <code>enableShrinkResourcesInReleaseBuilds</code>, <code>extraProguardRules</code>) instead. Local <code>expo run:android --variant release</code> still works for a device release build if you have the keystore configured.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — Full generate → inspect → sign flow</h3>
<pre><code class="language-bash"># 1. Generate
keytool -genkeypair -v -keystore my-release-key.jks \\
  -alias upload -keyalg RSA -keysize 2048 -validity 10000

# 2. Read fingerprints (register SHA-1/SHA-256 with Firebase, Maps)
keytool -list -v -keystore my-release-key.jks -alias upload

# 3. Build the signed AAB
./gradlew bundleRelease
# → android/app/build/outputs/bundle/release/app-release.aab</code></pre>

<h3>Example 2 — A three-flavor, three-buildtype setup</h3>
<pre><code class="language-groovy">flavorDimensions "env"
productFlavors {
    dev     { dimension "env"; applicationIdSuffix ".dev";     versionNameSuffix "-dev" }
    staging { dimension "env"; applicationIdSuffix ".staging"; versionNameSuffix "-stg" }
    prod    { dimension "env" }  // no suffix — the real package
}
// Variants: devDebug, devRelease, stagingDebug, stagingRelease, prodDebug, prodRelease
// Coexist on one device: com.myapp.dev, com.myapp.staging, com.myapp</code></pre>

<h3>Example 3 — Reading a flavor-injected constant in RN native code</h3>
<pre><code class="language-kotlin">// buildConfigField "String", "API_BASE", "\\"https://dev.api.myapp.com\\""
// generates: BuildConfig.API_BASE
val baseUrl = BuildConfig.API_BASE
// Exposed to JS via a native module / react-native-config equivalent</code></pre>

<h3>Example 4 — react-native-config style env per flavor</h3>
<p>Many RN apps use <code>react-native-config</code>: a <code>.env.dev</code> / <code>.env.prod</code> file maps to a flavor and surfaces values on <code>BuildConfig</code> + <code>Config</code> in JS. The Gradle side wires <code>project.ext.envConfigFiles</code> to flavor names — a concrete use of product flavors driving app config.</p>

<h3>Example 5 — Minimal release buildType with R8</h3>
<pre><code class="language-groovy">release {
    minifyEnabled true
    shrinkResources true
    proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'),
                  'proguard-rules.pro'
    signingConfig signingConfigs.release
    debuggable false
}</code></pre>

<h3>Example 6 — Keep rules that fix a classic RN release crash</h3>
<pre><code class="language-text"># Gson models parsed by reflection — without this, field names get renamed
# and JSON keys stop matching → nulls everywhere in release only.
-keep class com.myapp.data.dto.** { *; }
-keepclassmembers class com.myapp.data.dto.** { &lt;fields&gt;; }

# Keep enum values() used by reflection
-keepclassmembers enum * { public static **[] values(); public static ** valueOf(java.lang.String); }</code></pre>

<h3>Example 7 — Deobfuscating a production stack trace</h3>
<pre><code class="language-bash"># Crash shows: at a.b.c.d(Unknown Source:3)
# Use the mapping.txt archived for THAT versionCode:
retrace mapping.txt obfuscated-stacktrace.txt
# (retrace ships with the Android SDK build-tools / R8)</code></pre>

<h3>Example 8 — Local AAB test cycle with bundletool</h3>
<pre><code class="language-bash">./gradlew bundleRelease
bundletool build-apks --bundle=app-release.aab --output=app.apks \\
  --connected-device --ks=my-release-key.jks --ks-key-alias=upload
bundletool install-apks --apks=app.apks
# Now the device runs the exact split APK Play would generate.</code></pre>

<h3>Example 9 — CI signing via env vars (no secrets in repo)</h3>
<pre><code class="language-groovy">signingConfigs {
    release {
        storeFile file(System.getenv("KEYSTORE_PATH") ?: "dummy.jks")
        storePassword System.getenv("KEYSTORE_PASSWORD")
        keyAlias System.getenv("KEY_ALIAS")
        keyPassword System.getenv("KEY_PASSWORD")
    }
}</code></pre>

<h3>Example 10 — Expo EAS production build</h3>
<pre><code class="language-bash"># Cloud-managed keystore, produces an AAB ready for Play
eas build --platform android --profile production

# Inspect / rotate / download the managed keystore
eas credentials
</code></pre>
<pre><code class="language-json">// app.json
{
  "expo": {
    "version": "3.4.1",
    "android": { "versionCode": 42, "package": "com.myapp" }
  }
}</code></pre>

<h3>Example 11 — Auto-increment versionCode on EAS</h3>
<pre><code class="language-json">// eas.json
{
  "build": {
    "production": {
      "autoIncrement": true,
      "android": { "buildType": "app-bundle" }
    }
  }
}</code></pre>

<h3>Example 12 — FR Kiosk: ANDROID_ID tied to signing identity</h3>
<pre><code class="language-kotlin">// FR Kiosk derives a device/enrollment id from ANDROID_ID (Settings.Secure)
val androidId = Settings.Secure.getString(
    context.contentResolver, Settings.Secure.ANDROID_ID
)
// ANDROID_ID is scoped to (app signing key + user + device) since Android 8.
// Reinstall the kiosk signed with a DIFFERENT key → ANDROID_ID changes →
// any server-side enrollment keyed on it breaks. See Edge Cases #7.</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. INSTALL_FAILED_UPDATE_INCOMPATIBLE</h3>
<p>Installing a release build over a debug build (or a build signed by a different key) fails because signatures differ. Fix: <code>adb uninstall com.myapp</code> then reinstall, or match the variant/keystore. This is the #1 "won't install" cause.</p>

<h3>2. Forgetting to increment versionCode</h3>
<p>Play rejects an upload whose <code>versionCode</code> equals or is lower than an existing one on that track. Bump it every single upload, even for a tiny hotfix.</p>

<h3>3. Debug keystore expired / regenerated</h3>
<p>The auto-generated debug key is valid ~30 years, but if you delete <code>~/.android/debug.keystore</code> a new one is created — your registered Firebase/Maps SHA-1 no longer matches, breaking Google sign-in and Maps in debug. Commit a shared <code>android/app/debug.keystore</code> to keep the team's SHA-1 stable.</p>

<h3>4. Release-only crashes from over-shrinking</h3>
<p>Everything works in debug (no minify) but the release build crashes with <code>ClassNotFoundException</code>/<code>NoSuchMethodError</code>. Cause: R8 stripped/renamed a reflection or JNI target. Fix with targeted <code>-keep</code> rules; always smoke-test the actual release variant, not just debug.</p>

<h3>5. Wrong mapping.txt archived</h3>
<p>Each build produces a fresh <code>mapping.txt</code>. Deobfuscating a v42 crash with v43's mapping yields wrong symbols. Automate uploading the mapping per <code>versionCode</code> (Play Console does this if you build the AAB there; Crashlytics/Sentry via their Gradle plugins).</p>

<h3>6. shrinkResources without minifyEnabled</h3>
<p><code>shrinkResources true</code> requires <code>minifyEnabled true</code> — Gradle errors otherwise. Resource shrinking piggybacks on code shrinking's reachability graph.</p>

<h3>7. ANDROID_ID changes with the signing key (kiosk gotcha)</h3>
<p>Since Android 8, <code>Settings.Secure.ANDROID_ID</code> is derived from the app's <strong>signing key + user + device</strong>. In FR Kiosk, any id derived from <code>ANDROID_ID</code> changes if you reinstall the app signed with a different signature (e.g. a locally-signed test build vs the CI/Play-signed build). Server enrollments keyed on it silently break. Pin one signing identity for kiosk builds, and be aware Play App Signing means the <em>delivered</em> app is signed by Google's key — its ANDROID_ID differs from a locally-signed sideload. Never derive a stable device id purely from ANDROID_ID across signing environments.</p>

<h3>8. AAB won't install directly</h3>
<p><code>adb install app-release.aab</code> fails — an AAB is not an installable format. Convert to an APK set with <code>bundletool</code> (or upload to an internal test track) to run it on a device.</p>

<h3>9. Universal APK size vs split delivery</h3>
<p>A single universal APK bundles every ABI and density → large. The store's per-device splits are much smaller. If you distribute an APK outside Play (sideload), you either ship a bloated universal APK or generate ABI splits yourself (<code>splits { abi { ... } }</code>), which then need distinct <code>versionCode</code> offsets.</p>

<h3>10. Missing v1 signature on old devices</h3>
<p>If you disable the v1 (JAR) scheme but still support devices below API 24, they can't verify v2-only APKs and installation fails. Let AGP pick schemes based on <code>minSdk</code> rather than hand-disabling v1.</p>

<h3>11. Key/keystore password mismatch</h3>
<p>If <code>keyPassword</code> ≠ the alias's real password you get <code>Failed to read key ... wrong password</code>. The store password and key password are separate secrets; keep them straight.</p>

<h3>12. PKCS12 vs JKS warnings</h3>
<p>Newer <code>keytool</code> defaults to PKCS12 and warns that JKS is proprietary. Migrate with <code>keytool -importkeystore -srckeystore old.jks -destkeystore new.p12 -deststoretype pkcs12</code>. Gradle reads both.</p>

<h3>13. buildConfigField requires buildConfig feature</h3>
<p>On AGP 8+, <code>BuildConfig</code> generation is off by default; add <code>buildFeatures { buildConfig true }</code> or <code>buildConfigField</code> silently produces nothing.</p>

<h3>14. Flavor dimension resolution failures</h3>
<p>Adding a flavor dimension makes Gradle unable to resolve which library variant to use, erroring on <code>matchingFallbacks</code>. Declare <code>flavorDimensions</code> and set <code>matchingFallbacks</code> on custom build types/flavors.</p>

<h3>15. Expo prebuild wipes native signing edits</h3>
<p>Editing <code>android/app/build.gradle</code> signing/R8 config directly in an Expo prebuild project is lost on <code>expo prebuild --clean</code>. Use <code>app.json</code>, <code>eas.json</code>, and the <code>expo-build-properties</code> plugin instead.</p>

<h3>16. Testing production signing before release</h3>
<p>Play App Signing means the app users receive is signed by Google's key, whose SHA-256 differs from your upload key. Register the <strong>app signing certificate</strong> fingerprint (shown in Play Console → App Signing) with Firebase/Maps/App Links — not just your upload key's — or those services break in production only.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — committing the keystore or passwords</h3>
<p>Never put <code>my-release-key.jks</code> or its passwords in git. A leaked release key lets anyone ship a malware update signed as you. Store secrets in <code>~/.gradle/gradle.properties</code>, CI secret stores, or EAS.</p>

<h3>Anti-pattern 2 — not enrolling in Play App Signing</h3>
<p>Holding the only copy of the app signing key means one lost laptop ends the app forever. Enroll so Google holds it and you keep a resettable upload key.</p>

<h3>Anti-pattern 3 — shipping a debug-signed or debuggable release</h3>
<p><code>debuggable true</code> or debug signing in production is a security hole (debugger attach, cleartext, no obfuscation). Verify the release variant's config before uploading.</p>

<h3>Anti-pattern 4 — testing only the debug build</h3>
<p>R8 runs only in release, so shrinking/obfuscation bugs never appear in debug. Always QA the actual <code>release</code> (or an internal-track AAB), not just Metro debug.</p>

<h3>Anti-pattern 5 — disabling minify to "fix" a crash</h3>
<p>Turning off <code>minifyEnabled</code> to dodge a keep-rule bug bloats the APK, kills the optimizer, and hides the real issue. Add the correct <code>-keep</code> rule instead.</p>

<h3>Anti-pattern 6 — losing mapping.txt</h3>
<p>Without the version-matched mapping, production crashes are undebuggable. Archive it per <code>versionCode</code> and upload to your crash reporter automatically.</p>

<h3>Anti-pattern 7 — reusing a versionCode</h3>
<p>Rebuilding without bumping <code>versionCode</code> gets rejected by Play and confuses staged rollouts. Automate the increment.</p>

<h3>Anti-pattern 8 — one keystore password across all apps with no backup</h3>
<p>Shared, unmanaged, un-backed-up keystores are a time bomb. One per app (or documented aliases), backed up offline in multiple locations.</p>

<h3>Anti-pattern 9 — deriving stable IDs from ANDROID_ID across signing identities</h3>
<p>ANDROID_ID depends on the signing key; a re-signed/reinstalled build changes it, breaking server enrollments (FR Kiosk lesson). Use a persisted UUID or Instance ID and pin the signing identity for kiosk fleets.</p>

<h3>Anti-pattern 10 — sideloading a universal APK to "match" the store build</h3>
<p>A sideloaded universal APK differs from the store's per-device split (different ABI/resources), so "works locally, breaks from store" bugs slip through. Reproduce with <code>bundletool</code> against the AAB.</p>

<h3>Anti-pattern 11 — hardcoding secrets in build.gradle for CI convenience</h3>
<p>Inline passwords leak into build logs and git history. Read from <code>System.getenv</code> and inject the keystore as a decoded secret file.</p>

<h3>Anti-pattern 12 — hand-editing android/ in an Expo prebuild app</h3>
<p>Signing/R8 edits in generated <code>android/</code> vanish on <code>prebuild --clean</code>. Configure via <code>app.json</code>/<code>eas.json</code>/<code>expo-build-properties</code>.</p>

<h3>Anti-pattern 13 — forgetting the app signing cert fingerprint in Firebase/Maps</h3>
<p>Registering only the upload key's SHA-1 leaves Google sign-in / Maps broken in production, where Google's app signing key is what actually signs the delivered APK. Register both.</p>

<h3>Anti-pattern 14 — validity too short</h3>
<p>A keystore that expires (Play requires validity through 2033+) can strand your app. Generate with <code>-validity 10000</code> days.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. Why must every Android APK be signed, and what happens on update if the key changes?</div>
  <div class="qa-answer">
    <p>Signing gives the app a cryptographic identity. On first install the OS records the signer certificate; every update must be signed by the same key (or a rotated lineage). If a new build is signed by a different key, Android refuses the update with <code>INSTALL_FAILED_UPDATE_INCOMPATIBLE</code> — you'd have to uninstall (losing data) or publish under a new package name. Signing also gates signature-level permissions and shared-UID.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Debug keystore vs release keystore?</div>
  <div class="qa-answer">
    <p>The debug keystore is auto-generated at <code>~/.android/debug.keystore</code> with a well-known public password (<code>android</code>, alias <code>androiddebugkey</code>) — zero security, only for local/dev installs. The release keystore is one you generate and guard; it's the permanent identity of your production app. Losing it (without Play App Signing) means you can never update the app again.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Walk me through generating a release keystore.</div>
  <div class="qa-answer">
    <p><code>keytool -genkeypair -v -keystore my.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000</code>. It prompts for a keystore password (protects the file), a key password (protects the alias), and a DN. The <strong>keystore</strong> is the container; the <strong>alias</strong> names one key inside it. Then reference it from <code>signingConfigs</code> in <code>app/build.gradle</code>, with credentials read from <code>~/.gradle/gradle.properties</code> or env vars — never committed.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Difference between the v1, v2, v3, and v4 signature schemes?</div>
  <div class="qa-answer">
    <p>v1 (JAR) signs individual files via META-INF — slow, doesn't protect the archive structure, needed below API 24. v2 (API 24) signs the whole APK as one block — faster and tamper-evident. v3 (API 28) adds key rotation with proven lineage. v4 (API 30) adds a Merkle-tree hash in a sidecar <code>.idsig</code> for incremental/streamed installs. Builds usually sign with multiple schemes; AGP picks based on minSdk.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Build types vs product flavors vs variants?</div>
  <div class="qa-answer">
    <p>A <strong>build type</strong> is how you build (debug vs release: debuggable, minify, signing, applicationIdSuffix). A <strong>product flavor</strong> is a variation of the app itself (dev/staging/prod: different API URL, app name, package). A <strong>variant</strong> is the cross product flavor × buildType (e.g. <code>prodRelease</code>). Flavors need a <code>flavorDimension</code>; multiple dimensions multiply. Per-flavor values come from <code>resValue</code> and <code>buildConfigField</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. What is R8 and how does it differ from ProGuard?</div>
  <div class="qa-answer">
    <p>R8 is Google's default shrinker/optimizer/obfuscator since AGP 3.4, replacing ProGuard but reusing its rule syntax (<code>proguard-rules.pro</code>). In one pass it shrinks unused code, optimizes (inlining, merging), obfuscates names, and — with <code>shrinkResources</code> — strips unused resources. It's faster and produces smaller output than ProGuard's multi-tool pipeline.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Why do React Native and reflection-based libraries need -keep rules?</div>
  <div class="qa-answer">
    <p>R8 removes/renames anything it can't see called statically. Code reached only via reflection or JNI — Gson model fields, Retrofit interfaces, native methods, RN's generated TurboModule/Fabric classes — appears unused, so R8 deletes or renames it, and the app crashes at runtime (only in release). <code>-keep</code> rules whitelist those classes/members so shrinking and obfuscation skip them.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. What is mapping.txt and why must you keep it?</div>
  <div class="qa-answer">
    <p>Obfuscation renames symbols, so a production stack trace looks like <code>a.b.c</code>. <code>mapping.txt</code> (in <code>build/outputs/mapping/release/</code>) records the original→obfuscated mapping for that exact build. You archive one per <code>versionCode</code> and upload it to Play Console / Crashlytics / Sentry so crashes deobfuscate to real symbols. A mismatched mapping decodes to wrong methods.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. APK vs AAB — what's the difference and why does Play require AAB?</div>
  <div class="qa-answer">
    <p>An APK is a directly installable package. An AAB (Android App Bundle) is a <em>publishing</em> format Google splits into per-device APKs — base + config splits by density, ABI, and language — via Dynamic Delivery, so users download only what their device needs (smaller downloads). Play requires AAB for new apps (since Aug 2021). You build it with <code>./gradlew bundleRelease</code>; APKs come from <code>assembleRelease</code>. An AAB isn't installable directly — use <code>bundletool</code> to test locally.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Explain Google Play App Signing (upload key vs app signing key).</div>
  <div class="qa-answer">
    <p>Google holds the real <strong>app signing key</strong> and re-signs every delivered APK with it. You sign uploads with a separate <strong>upload key</strong>; Play verifies it, strips your signature, and re-signs. If you lose the upload key you can reset it with Google and keep publishing; the critical app signing key is safe in Google's infrastructure. It removes the single-point-of-failure of self-holding the one irreplaceable key.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. versionCode vs versionName?</div>
  <div class="qa-answer">
    <p><code>versionCode</code> is a monotonically increasing integer Play uses to determine which build is newer and to gate updates/rollouts — it must strictly increase per upload and is invisible to users. <code>versionName</code> is a cosmetic display string (e.g. "3.4.1") shown on the listing. Play ignores versionName for ordering.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. How do you test an AAB locally before releasing?</div>
  <div class="qa-answer">
    <p>Use <code>bundletool build-apks --bundle=app.aab --output=app.apks --connected-device --ks=... --ks-key-alias=...</code> to generate the exact device-specific split set Play would deliver, then <code>bundletool install-apks --apks=app.apks</code>. This reproduces store-only bugs (missing ABI, stripped resource, language config) that a universal debug APK hides. Alternatively upload to an internal test track.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. A feature works in debug but crashes in the release build. How do you debug it?</div>
  <div class="qa-answer">
    <ol>
      <li>Recognize R8 only runs in release → suspect over-shrinking/obfuscation.</li>
      <li>Grab the crash (<code>adb logcat</code>) — usually <code>ClassNotFoundException</code>/<code>NoSuchMethodError</code> on a reflection/JNI/serialization target.</li>
      <li>Deobfuscate with the build's <code>mapping.txt</code> (<code>retrace</code>).</li>
      <li>Add a targeted <code>-keep</code> rule for that class/members; rebuild release and re-test.</li>
      <li>Never "fix" it by disabling minify globally.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. How is signing handled in an Expo / EAS project?</div>
  <div class="qa-answer">
    <p>EAS Build generates and stores the release keystore in the cloud; <code>eas build --platform android --profile production</code> produces the AAB, and <code>eas credentials</code> lets you inspect/download/rotate the keystore. Version comes from <code>app.json</code> (<code>android.versionCode</code>, <code>expo.version</code>), optionally auto-incremented via <code>eas.json</code>. Since it's a prebuild project, native <code>android/</code> edits get wiped by <code>expo prebuild --clean</code>, so R8/ProGuard tweaks go through the <code>expo-build-properties</code> plugin. Local <code>expo run:android --variant release</code> is still possible.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. You reinstalled a kiosk app and its server-side device enrollment broke. Why?</div>
  <div class="qa-answer">
    <p>Likely the app derives its device id from <code>Settings.Secure.ANDROID_ID</code>, which since Android 8 is scoped to the app's <strong>signing key</strong> + user + device. Reinstalling signed with a different key (local test build vs CI/Play-signed) changes ANDROID_ID, so any id derived from it changes and the server no longer recognizes the device. Fix: pin one signing identity for the kiosk fleet and persist a generated UUID rather than trusting ANDROID_ID across signing environments. (This is a real FR Kiosk gotcha.)</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You explain signature identity continuity and the update-incompatible failure.</li>
    <li>You distinguish debug vs release keystores and know the debug password is public.</li>
    <li>You can recite the keytool command and keystore-vs-alias distinction.</li>
    <li>You know v2 signs the whole APK block vs v1's per-file JAR signing.</li>
    <li>You separate build types, product flavors, and variants cleanly.</li>
    <li>You know R8 keep rules protect reflection/JNI/RN codegen targets, and why release-only crashes happen.</li>
    <li>You treat mapping.txt as mandatory, archived per versionCode.</li>
    <li>You explain AAB vs APK, Dynamic Delivery, and bundletool testing.</li>
    <li>You explain Play App Signing (upload key vs app signing key) as loss protection.</li>
    <li>You never commit keystores/passwords and enroll in Play App Signing.</li>
  </ul>
</div>
` },

  ]
});
