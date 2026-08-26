window.PREP_SITE.registerTopic({
  id: 'andr-folder-tour',
  module: 'Android Native (Deep)',
  title: 'Anatomy of android/ Folder',
  estimatedReadTime: '22 min',
  tags: ['android', 'gradle', 'folder-structure', 'androidmanifest', 'kotlin', 'java', 'react-native', 'prebuild', 'expo', 'source-sets', 'gradlew', 'proguard', 'autolinking', 'jni', 'jnilibs', 'local-properties', 'settings-gradle', 'gradle-properties', 'mainactivity', 'mainapplication'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>The <code>android/</code> folder is a standard Gradle project: a root project plus a set of <strong>modules</strong>. In a React Native app the only module that ships to users is <code>app/</code>; everything else is autolinked native library modules and Gradle plumbing.</p>
<p>Learn to read it in three layers:</p>
<ul>
  <li><strong>Top level</strong> — build orchestration: <code>build.gradle</code> (root), <code>settings.gradle</code>, <code>gradle.properties</code>, the <code>gradlew</code> wrapper, and the git-ignored <code>local.properties</code>.</li>
  <li><strong>The <code>app/</code> module</strong> — your actual app: <code>app/build.gradle</code>, <code>proguard-rules.pro</code>, <code>debug.keystore</code>, and the <code>src/main</code>, <code>src/debug</code>, <code>src/release</code> source sets holding <code>AndroidManifest.xml</code>, your Kotlin/Java <code>MainActivity</code> + <code>MainApplication</code>, and <code>res/</code> resources.</li>
  <li><strong>Generated/ignored</strong> — <code>.gradle/</code>, <code>build/</code>, <code>.cxx/</code>, and codegen/autolinking output that you never edit and never commit.</li>
</ul>
<p>If you are on Expo (which all of Prakhar's apps are), this entire folder is <strong>generated</strong> by <code>expo prebuild</code> from <code>app.json</code> / <code>app.config.js</code> plus config plugins — hand-edits get wiped on <code>--clean</code>.</p>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p><code>android/</code> is a Gradle multi-module project where <code>app/</code> is the shipped module and every RN library is an autolinked module; on Expo the whole folder is a build artifact of <code>app.json</code> + config plugins, so you edit the config, not the folder.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What the folder actually is</h3>
<p>When you run an Android build, you are not running "React Native" — you are running <strong>Gradle</strong>, Android's build system, which compiles a real native Android app that happens to embed the React Native runtime and load your JS bundle. The <code>android/</code> folder is that Gradle project on disk. Everything Android Studio, <code>gradlew</code>, and the Play Store care about lives here. The JS side (Metro, your <code>App.tsx</code>) is loaded at runtime; the <code>android/</code> folder is what gets compiled into the <code>.apk</code> / <code>.aab</code>.</p>

<h3>Why you must know it file-by-file</h3>
<ul>
  <li><strong>Debugging native crashes</strong> — a launch crash, a missing permission, a ProGuard-stripped class, a 16 KB page-size failure: the fix is almost always a specific file in here (<code>AndroidManifest.xml</code>, <code>proguard-rules.pro</code>, <code>gradle.properties</code>).</li>
  <li><strong>Build configuration</strong> — SDK versions, signing, ABIs, Hermes on/off, New Architecture on/off are all set in Gradle files here.</li>
  <li><strong>Autolinking</strong> — understanding how a library like <code>react-native-mmkv</code> ends up in your app means understanding how <code>settings.gradle</code> and <code>app/build.gradle</code> pull it in as a module.</li>
  <li><strong>Interview signal</strong> — "walk me through an Android RN project" is a real question. Naming every file and its job is the green flag.</li>
</ul>

<h3>Gradle vocabulary you need first</h3>
<table>
  <thead><tr><th>Term</th><th>Meaning</th></tr></thead>
  <tbody>
    <tr><td><strong>Root project</strong></td><td>The whole <code>android/</code> directory. Owns global build config and lists the modules.</td></tr>
    <tr><td><strong>Module</strong> (subproject)</td><td>A unit that produces one artifact (an APK or an AAR library). <code>:app</code> is your app module; each RN lib is its own module like <code>:react-native-mmkv</code>.</td></tr>
    <tr><td><strong>Source set</strong></td><td>A named group of sources + resources for a build type or flavor: <code>main</code>, <code>debug</code>, <code>release</code>. Gradle merges them at build time.</td></tr>
    <tr><td><strong>Build type</strong></td><td><code>debug</code> vs <code>release</code> — different signing, minification, and manifest values.</td></tr>
    <tr><td><strong>Gradle plugin</strong></td><td>Code that adds tasks. <code>com.android.application</code> makes a module build an app; <code>com.facebook.react</code> wires in RN.</td></tr>
  </tbody>
</table>

<p>For how Gradle itself evaluates and what tasks run, see the sibling topic <strong>andr-gradle</strong>; for the manifest in depth see <strong>andr-manifest</strong>; for <code>MainActivity</code>/<code>MainApplication</code> internals see <strong>andr-entry-code</strong>. This topic is the map — those are the deep dives on individual rooms.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The whole tree at a glance</h3>
<div class="diagram">
<pre>
android/                         &lt;- ROOT Gradle project
├── build.gradle                 root build script: buildscript{}, allprojects{}, ext versions
├── settings.gradle              declares modules (:app + autolinked libs), plugin mgmt
├── gradle.properties            JVM args + flags: newArchEnabled, hermesEnabled, AndroidX
├── gradlew                      wrapper script (macOS/Linux) - ALWAYS use this
├── gradlew.bat                  wrapper script (Windows)
├── local.properties            *sdk.dir=... - machine-specific, GIT-IGNORED
├── .gitignore                   ignores build/, .gradle/, local.properties, .cxx/
├── gradle/
│   └── wrapper/
│       ├── gradle-wrapper.properties   pins the Gradle version (distributionUrl)
│       └── gradle-wrapper.jar          tiny bootstrapper that downloads Gradle
│
└── app/                         &lt;- the SHIPPED application MODULE (:app)
    ├── build.gradle             app-level: android{}, defaultConfig, dependencies{}
    ├── proguard-rules.pro       R8/ProGuard keep rules for release minification
    ├── debug.keystore           shared debug signing key (checked in, NOT for release)
    └── src/
        ├── main/                code + resources for EVERY build
        │   ├── AndroidManifest.xml     package, permissions, activities, &lt;application&gt;
        │   ├── java/ (or kotlin/)
        │   │   └── com/yourapp/
        │   │       ├── MainActivity.kt      the launched Activity
        │   │       └── MainApplication.kt    app entry, RN host, package list
        │   ├── res/            drawable/, mipmap-*/, values/, xml/, raw/
        │   ├── assets/         bundled JS + fonts (release bundle lands here)
        │   └── jniLibs/        prebuilt native .so libraries per ABI
        ├── debug/              overrides applied ONLY to debug builds
        └── release/           overrides applied ONLY to release builds
</pre>
</div>

<h3>The "generated vs committed" picture</h3>
<div class="diagram">
<pre>
 COMMIT these (source of truth):        NEVER commit (regenerated):
 ─────────────────────────────          ────────────────────────────
 build.gradle, settings.gradle          build/            (compiled output, APK/AAB)
 gradle.properties, .gitignore          .gradle/          (Gradle cache/state)
 gradlew, gradlew.bat                    .cxx/             (native C/C++ build cache)
 gradle/wrapper/*                        app/build/generated/  (codegen, autolinking)
 app/build.gradle, proguard-rules.pro    local.properties  (machine SDK path)
 app/src/**  (manifest, code, res)
 app/debug.keystore  (debug only!)
</pre>
</div>

<h3>How an RN library slots in (autolinking)</h3>
<div class="diagram">
<pre>
 node_modules/react-native-mmkv/android/   (the lib's OWN gradle module)
        │
        │  npx react-native config  (scans node_modules)
        ▼
 settings.gradle  --applyNativeModulesSettingsGradle-->  include ':react-native-mmkv'
        │
        ▼
 app/build.gradle --applyNativeModulesAppBuildGradle--> implementation project(':react-native-mmkv')
        │
        ▼
 MainApplication.getPackages()  <- PackageList(this).packages auto-adds the lib
</pre>
</div>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — this whole folder is a build artifact</div>
  <p>In an Expo prebuild / Continuous Native Generation (CNG) project — which is every one of Prakhar's apps (<code>sw-mobile</code>, <code>sw-ticketing</code>) — the entire <code>android/</code> tree is <strong>generated</strong> by <code>npx expo prebuild</code> from <code>app.json</code> / <code>app.config.js</code> and config plugins. Many teams git-ignore it entirely. Any hand-edit you make here is fair game to be <strong>wiped</strong> by <code>expo prebuild --clean</code>. So think of this whole map as "the output", and edit the config that produces it instead (covered in Mechanics and the Expo notes throughout).</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>1. Root build.gradle — global build config</h3>
<p>The <em>project-level</em> build script. It does NOT build anything itself; it sets versions and repositories that every module inherits. Classic RN template:</p>
<pre><code class="language-groovy">// android/build.gradle
buildscript {
    ext {
        buildToolsVersion = "35.0.0"
        minSdkVersion = 24
        compileSdkVersion = 35
        targetSdkVersion = 35
        ndkVersion = "27.1.12297006"
        kotlinVersion = "2.0.21"
    }
    repositories { google(); mavenCentral() }
    dependencies {
        classpath("com.android.tools.build:gradle")
        classpath("com.facebook.react:react-native-gradle-plugin")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin")
    }
}

apply plugin: "com.facebook.react.rootproject"</code></pre>
<p>Those <code>ext</code> values are the single knobs for SDK levels across the app. <code>minSdkVersion</code> is the oldest Android you support; <code>compileSdkVersion</code> is the API you compile against; <code>targetSdkVersion</code> is what you promise Play you tested against.</p>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — you do not edit ext here</div>
  <p>Under prebuild these versions come from Expo's template and, for overrides, from <code>expo-build-properties</code> in <code>app.json</code>:</p>
  <pre><code class="language-json">{
  "expo": {
    "plugins": [
      ["expo-build-properties", {
        "android": {
          "minSdkVersion": 26,
          "compileSdkVersion": 35,
          "targetSdkVersion": 35,
          "kotlinVersion": "2.0.21"
        }
      }]
    ]
  }
}</code></pre>
  <p>That is exactly how the sw-mobile VAPT work raised <code>minSdkVersion</code> to 26 — through the plugin, not by hand in <code>build.gradle</code>.</p>
</div>

<h3>2. settings.gradle — which modules exist</h3>
<p>Defines the root project name and <code>include</code>s every module. This is also where autolinking hooks in — it applies a generated file that <code>include</code>s each native library as a subproject:</p>
<pre><code class="language-groovy">// android/settings.gradle
pluginManagement { includeBuild("../node_modules/@react-native/gradle-plugin") }
plugins { id("com.facebook.react.settings") }

extensions.configure(com.facebook.react.ReactSettingsExtension) { ex -&gt;
    ex.autolinkLibrariesFromCommand()
}

rootProject.name = 'MyApp'
include ':app'
includeBuild('../node_modules/@react-native/gradle-plugin')</code></pre>
<p>If a library is "not found" at build time, the first thing to check is whether it got <code>include</code>d here (via <code>npx react-native config</code>).</p>

<h3>3. gradle.properties — build-wide flags</h3>
<p>Key-value settings read by Gradle and the Android plugin. The RN-relevant ones:</p>
<pre><code class="language-properties"># JVM heap for the Gradle daemon
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
org.gradle.parallel=true

# AndroidX (mandatory on modern RN)
android.useAndroidX=true

# React Native architecture + engine toggles
newArchEnabled=false        # Fabric/TurboModules OFF (Paper) - sw-mobile is here
hermesEnabled=true          # Hermes JS engine on

# Which ABIs to build
reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64</code></pre>
<p><code>newArchEnabled</code> and <code>hermesEnabled</code> are the two flags interviewers love. <code>sw-mobile</code> runs OLD architecture (Paper), so <code>newArchEnabled=false</code>.</p>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — set these via app.json, not the file</div>
  <p><code>newArchEnabled</code> is controlled by <code>"newArchEnabled"</code> in <code>app.json</code> (or the <code>expo-build-properties</code> plugin); Hermes by <code>"jsEngine": "hermes"</code>. Editing <code>gradle.properties</code> directly is wiped on prebuild.</p>
</div>

<h3>4. gradlew / gradlew.bat + gradle/wrapper/ — the wrapper</h3>
<p>The <strong>Gradle Wrapper</strong> lets everyone build with the exact same Gradle version without installing Gradle globally. Four files work together:</p>
<ul>
  <li><code>gradlew</code> — shell script for macOS/Linux. Always run <code>./gradlew ...</code>, never a system <code>gradle</code>.</li>
  <li><code>gradlew.bat</code> — the same for Windows cmd.</li>
  <li><code>gradle/wrapper/gradle-wrapper.jar</code> — a tiny bootstrapper the scripts run; it downloads the pinned Gradle distribution on first use.</li>
  <li><code>gradle/wrapper/gradle-wrapper.properties</code> — pins the version via <code>distributionUrl</code>:</li>
</ul>
<pre><code class="language-properties"># gradle/wrapper/gradle-wrapper.properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.10.2-all.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists</code></pre>
<p>To upgrade Gradle you bump the version in <code>distributionUrl</code> (or run <code>./gradlew wrapper --gradle-version=8.10.2</code>). All four wrapper files are committed so CI reproduces your build exactly.</p>

<h3>5. local.properties — machine-specific, git-ignored</h3>
<p>One line most of the time:</p>
<pre><code class="language-properties">sdk.dir=/Users/you/Library/Android/sdk</code></pre>
<p>It points Gradle at your Android SDK. It is <strong>git-ignored</strong> because the path differs per machine (and per OS). If a build errors "SDK location not found", this file is missing — Android Studio writes it automatically, or you set <code>ANDROID_HOME</code>. You can also put <code>ndk.dir</code> here. Never commit it.</p>

<h3>6. .gitignore — what stays out of git</h3>
<p>The Android <code>.gitignore</code> keeps generated and machine-specific paths out of source control:</p>
<pre><code class="language-text"># android/.gitignore (typical)
build/
.gradle/
local.properties
*.keystore        # but debug.keystore is often force-added
!debug.keystore
.cxx/
*.iml
.idea/</code></pre>

<h3>7. app/build.gradle — the app module build script</h3>
<p>This is the most-edited Gradle file. It applies the app + RN plugins, and configures the <code>android { }</code> block:</p>
<pre><code class="language-groovy">// android/app/build.gradle
apply plugin: "com.android.application"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "com.facebook.react"

android {
    namespace "com.yourapp"
    compileSdk rootProject.ext.compileSdkVersion

    defaultConfig {
        applicationId "com.yourapp"     // the Play Store identity
        minSdk rootProject.ext.minSdkVersion
        targetSdk rootProject.ext.targetSdkVersion
        versionCode 42                   // integer Play uses to order builds
        versionName "3.4.0"              // human-facing version string
    }

    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }

    buildTypes {
        debug   { signingConfig signingConfigs.debug }
        release {
            signingConfig signingConfigs.debug      // replace with real release key!
            minifyEnabled true                       // run R8/ProGuard
            proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"),
                          "proguard-rules.pro"
        }
    }
}

dependencies {
    implementation("com.facebook.react:react-android")   // RN itself
    // autolinked libraries are injected here automatically
}

apply from: file("../../node_modules/@react-native-community/cli-platform-android/native_modules.gradle")
applyNativeModulesAppBuildGradle(project)</code></pre>
<p><code>applicationId</code>, <code>versionCode</code>, and <code>versionName</code> are the values you bump for every Play release. <code>minifyEnabled true</code> turns on R8 shrinking, which is why <code>proguard-rules.pro</code> matters.</p>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — app/build.gradle is generated too</div>
  <p><code>applicationId</code> comes from <code>android.package</code>, <code>versionName</code> from <code>version</code>, and <code>versionCode</code> from <code>android.versionCode</code> in <code>app.json</code>. NDK/ABI/min-SDK overrides go through <code>expo-build-properties</code>. Signing for release is handled by EAS credentials, not by hand-editing <code>signingConfigs</code>.</p>
</div>

<h3>8. app/proguard-rules.pro — keep rules for release</h3>
<p>When <code>minifyEnabled</code> is on, R8 (the modern successor to ProGuard) removes unused classes and renames the rest. Code reached only via reflection or JNI looks unused, so you add <strong>keep rules</strong> so it survives:</p>
<pre><code class="language-text"># android/app/proguard-rules.pro
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keepclassmembers class * { @com.facebook.react.uimanager.annotations.ReactProp *; }
# a specific lib that crashes when stripped:
-keep class com.yourpaymentsdk.** { *; }</code></pre>
<p>A release-only crash that does not happen in debug is very often a missing keep rule here — debug builds do not minify.</p>

<h3>9. app/debug.keystore — the shared debug key</h3>
<p>A checked-in keystore used to sign <em>debug</em> builds so every developer's debug app has the same signature (needed for e.g. Google Sign-In debug SHA-1). It is intentionally committed and its passwords are public (<code>android</code> / <code>androiddebugkey</code>). <strong>Never</strong> ship a release signed with it — release uses a private upload/signing key kept out of git (or EAS-managed on Expo).</p>

<h3>10. Source sets — src/main, src/debug, src/release</h3>
<p>Gradle <strong>merges</strong> source sets by build type. <code>src/main</code> applies to every build; <code>src/debug</code> and <code>src/release</code> add or override for that build type. Common uses: a debug-only <code>AndroidManifest.xml</code> that adds <code>usesCleartextTraffic</code> or a Flipper init, or a release-only manifest that removes a permission. Manifests are merged; Java/Kotlin classes with the same name in <code>debug</code>/<code>release</code> replace the main one.</p>

<h3>11. app/src/main/AndroidManifest.xml — the app blueprint</h3>
<p>Declares the package, permissions, the <code>&lt;application&gt;</code>, and the launcher <code>&lt;activity&gt;</code>:</p>
<pre><code class="language-xml">&lt;manifest xmlns:android="http://schemas.android.com/apk/res/android"&gt;
  &lt;uses-permission android:name="android.permission.INTERNET" /&gt;
  &lt;application
      android:name=".MainApplication"
      android:label="@string/app_name"
      android:icon="@mipmap/ic_launcher"
      android:allowBackup="false"
      android:theme="@style/AppTheme"&gt;
    &lt;activity
        android:name=".MainActivity"
        android:exported="true"
        android:launchMode="singleTask"&gt;
      &lt;intent-filter&gt;
        &lt;action android:name="android.intent.action.MAIN" /&gt;
        &lt;category android:name="android.intent.category.LAUNCHER" /&gt;
      &lt;/intent-filter&gt;
    &lt;/activity&gt;
  &lt;/application&gt;
&lt;/manifest&gt;</code></pre>
<p>Deep dive in <strong>andr-manifest</strong>. On Expo, permissions and manifest entries are injected by config plugins and <code>app.json</code> (e.g. <code>android.permissions</code>), then merged.</p>

<h3>12. app/src/main/java (or kotlin) — the entry code</h3>
<p>Under a package path like <code>com/yourapp/</code> you get the two classes RN needs:</p>
<ul>
  <li><code>MainActivity.kt</code> — the Android <code>Activity</code> that hosts the RN root view. Overrides <code>getMainComponentName()</code> to return the JS component name registered with <code>AppRegistry</code>.</li>
  <li><code>MainApplication.kt</code> — the <code>Application</code> subclass; the app's true entry point. Builds the <code>ReactNativeHost</code> / <code>ReactHost</code>, returns the list of native packages (via <code>PackageList(this)</code>, which autolinking fills), and initializes Hermes/SoLoader.</li>
</ul>
<p>Full walkthrough in <strong>andr-entry-code</strong>. Newer RN template folders use <code>kotlin/</code>; older ones use <code>java/</code> — Gradle treats both the same for the JVM.</p>

<h3>13. app/src/main/res — resources</h3>
<table>
  <thead><tr><th>Directory</th><th>Holds</th></tr></thead>
  <tbody>
    <tr><td><code>res/drawable/</code></td><td>Vector/bitmap drawables; splash and notification icons.</td></tr>
    <tr><td><code>res/mipmap-mdpi..xxxhdpi/</code></td><td>Launcher icons per density (<code>ic_launcher</code>). Mipmap, not drawable, so the launcher can up-scale.</td></tr>
    <tr><td><code>res/values/</code></td><td><code>strings.xml</code> (<code>app_name</code>), <code>colors.xml</code>, <code>styles.xml</code>/<code>themes.xml</code> (<code>AppTheme</code>).</td></tr>
    <tr><td><code>res/xml/</code></td><td>Config XML: <code>network_security_config.xml</code>, <code>file_paths.xml</code> for FileProvider, backup rules.</td></tr>
    <tr><td><code>res/raw/</code></td><td>Raw files kept verbatim (sounds, a bundled font, a config JSON) — read by resource id.</td></tr>
  </tbody>
</table>

<h3>14. app/src/main/assets — bundled assets</h3>
<p><code>assets/</code> holds files copied verbatim into the APK and read by path. For RN the big one is <code>index.android.bundle</code> — the release JS bundle is emitted here at build time (in debug, JS is served by Metro instead, so it is absent). Custom fonts linked via <code>react-native.config.js</code> also land here.</p>

<h3>15. app/src/main/jni and jniLibs — native libraries</h3>
<ul>
  <li><code>jniLibs/&lt;abi&gt;/*.so</code> — <strong>prebuilt</strong> native shared libraries per ABI (<code>arm64-v8a</code>, <code>armeabi-v7a</code>, <code>x86_64</code>). Libraries shipping compiled C/C++ drop <code>.so</code> files here.</li>
  <li><code>jni/</code> — C/C++ <strong>source</strong> plus an <code>Android.mk</code>/<code>CMakeLists.txt</code> compiled by the NDK during the build (produces <code>.so</code> into <code>build/</code> / <code>.cxx/</code>). Most app modules have no <code>jni/</code>; RN core and libs like Reanimated do.</li>
</ul>

<h3>16. Generated and ignored directories</h3>
<table>
  <thead><tr><th>Path</th><th>What it is</th></tr></thead>
  <tbody>
    <tr><td><code>.gradle/</code></td><td>Gradle's own cache and incremental-build state for this project. Deletable; regenerated.</td></tr>
    <tr><td><code>build/</code> and <code>app/build/</code></td><td>All compiled output: merged manifest, R.java, DEX, the final <code>.apk</code>/<code>.aab</code>. Wiped by <code>./gradlew clean</code>.</td></tr>
    <tr><td><code>app/build/generated/</code></td><td>Autolinking's <code>PackageList.java</code> and New-Arch codegen output (spec classes) — generated each build.</td></tr>
    <tr><td><code>.cxx/</code></td><td>NDK/CMake native build intermediates (object files, ninja cache). Deletable.</td></tr>
  </tbody>
</table>
<p>None of these are committed and none should be hand-edited — a change there is overwritten on the next build.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — "Where do I bump the app version?"</h3>
<p>Edit <code>android/app/build.gradle</code> &rarr; <code>defaultConfig</code>:</p>
<pre><code class="language-groovy">versionCode 43        // must strictly increase for each Play upload
versionName "3.4.1"   // shown to users</code></pre>
<p>On Expo: bump <code>version</code> and <code>android.versionCode</code> in <code>app.json</code> and re-prebuild (or let EAS auto-increment <code>versionCode</code>).</p>

<h3>Example 2 — "Add a permission"</h3>
<p>Bare RN: add to <code>app/src/main/AndroidManifest.xml</code>:</p>
<pre><code class="language-xml">&lt;uses-permission android:name="android.permission.CAMERA" /&gt;</code></pre>
<p>Expo: add to <code>app.json</code> so prebuild injects it:</p>
<pre><code class="language-json">{ "expo": { "android": { "permissions": ["CAMERA"] } } }</code></pre>

<h3>Example 3 — "A release build crashes but debug is fine"</h3>
<p>Classic ProGuard/R8 stripping. Add a keep rule in <code>app/proguard-rules.pro</code> for the reflected class, then rebuild release. Debug never reproduces it because <code>minifyEnabled</code> is false there.</p>

<h3>Example 4 — "SDK location not found"</h3>
<p><code>android/local.properties</code> is missing. Create it (git-ignored):</p>
<pre><code class="language-properties">sdk.dir=/Users/you/Library/Android/sdk</code></pre>

<h3>Example 5 — "Turn on the New Architecture"</h3>
<p>Bare RN: <code>gradle.properties</code> &rarr; <code>newArchEnabled=true</code>. Expo: set <code>"newArchEnabled": true</code> in <code>app.json</code> and prebuild. Then rebuild native.</p>

<h3>Example 6 — "Reduce APK size / target one ABI in dev"</h3>
<p>Limit ABIs in <code>gradle.properties</code>:</p>
<pre><code class="language-properties">reactNativeArchitectures=arm64-v8a</code></pre>
<p>A physical modern phone is <code>arm64-v8a</code>; an Intel emulator is <code>x86_64</code>. Building one ABI is much faster while iterating.</p>

<h3>Example 7 — "Upgrade Gradle"</h3>
<pre><code class="language-bash">cd android
./gradlew wrapper --gradle-version=8.10.2
# updates gradle/wrapper/gradle-wrapper.properties + the jar</code></pre>

<h3>Example 8 — "Where did the JS bundle go in a release APK?"</h3>
<p>Into <code>app/src/main/assets/index.android.bundle</code> plus its drawable assets under <code>res/</code>. In debug there is no bundle file — Metro serves it over the dev server.</p>

<h3>Example 9 — "A library isn't being found at runtime"</h3>
<pre><code class="language-bash"># confirm autolinking sees it
npx react-native config | grep -A3 mmkv
# confirm it was included as a module
grep react-native-mmkv android/settings.gradle
cd android &amp;&amp; ./gradlew clean</code></pre>

<h3>Example 10 — "Debug-only manifest tweak"</h3>
<p>Create <code>app/src/debug/AndroidManifest.xml</code> to allow cleartext traffic to Metro on debug only:</p>
<pre><code class="language-xml">&lt;application android:usesCleartextTraffic="true" /&gt;</code></pre>
<p>Merged into debug builds only; release stays locked down.</p>

<h3>Example 11 — "16 KB page-size Play warning" (sw-ticketing)</h3>
<p>The fix lived in native-build config: newer NDK + alignment flags, reached by upgrading the Expo template (Expo 53 / RN 0.79) so the generated <code>android/</code> ships 16 KB-aligned <code>.so</code> files. The point: the remedy was a Gradle/NDK config change under <code>android/</code>, not JS.</p>

<h3>Example 12 — "Add a raw sound file"</h3>
<p>Drop it in <code>app/src/main/res/raw/ping.mp3</code> and reference by resource id <code>R.raw.ping</code>. On Expo, a config plugin or <code>expo-asset</code> copies it in during prebuild.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Editing generated files under Expo</h3>
<p>Any change inside <code>android/</code> on a CNG project is a ticking bomb — <code>expo prebuild --clean</code> deletes and regenerates the folder, silently discarding your edit. Always move the change into <code>app.json</code> / a config plugin / <code>expo-build-properties</code>.</p>

<h3>2. local.properties committed by accident</h3>
<p>If someone commits it, teammates on other OSes get "SDK location not found" pointing at a path that does not exist. Keep it in <code>.gitignore</code>; delete it from history if leaked.</p>

<h3>3. Confusing compileSdk, targetSdk, minSdk</h3>
<p><code>compileSdk</code> = APIs available at compile time; <code>targetSdk</code> = behavior/compat level you opt into at runtime; <code>minSdk</code> = oldest device that can install. Raising <code>targetSdk</code> can change runtime behavior (permissions, background limits) even with no code change.</p>

<h3>4. debug.keystore used for release</h3>
<p>Signing a release with the checked-in debug key is insecure and Play rejects it (or you can never rotate). Release must use a private keystore (or Play App Signing / EAS-managed credentials).</p>

<h3>5. versionCode not incremented</h3>
<p>Play rejects an upload whose <code>versionCode</code> is not strictly greater than the last. It is an integer, independent of the human <code>versionName</code>.</p>

<h3>6. mipmap vs drawable for launcher icons</h3>
<p>Launcher icons belong in <code>mipmap-*</code>, not <code>drawable-*</code>. Density-split APKs can strip the wrong-density <code>drawable</code>, but launchers pull from <code>mipmap</code> across densities. Wrong folder = blurry or missing icon.</p>

<h3>7. Stale build/ or .cxx/ causing phantom errors</h3>
<p>Weird "cannot find symbol" or duplicate-class errors after a dependency change are often stale caches. <code>./gradlew clean</code> (and sometimes deleting <code>.gradle/</code>, <code>.cxx/</code>, <code>app/build/</code>) fixes them.</p>

<h3>8. Source-set collisions</h3>
<p>A resource or class present in both <code>src/main</code> and <code>src/debug</code> with the same name: the build-type source set wins for that build. Surprising if you forgot a leftover file in <code>src/debug</code>.</p>

<h3>9. Manifest merger conflicts</h3>
<p>An autolinked library's manifest can clash with yours (duplicate <code>android:name</code>, conflicting <code>allowBackup</code>). The merger fails with a "Manifest merger" error; resolve with <code>tools:replace</code> or <code>tools:node="merge"</code>.</p>

<h3>10. namespace vs applicationId</h3>
<p><code>namespace</code> (in <code>app/build.gradle</code>) is the package for the generated <code>R</code> class and BuildConfig; <code>applicationId</code> is the store identity. They usually match but do not have to — renaming <code>applicationId</code> does not move your Kotlin package.</p>

<h3>11. jniLibs ABI missing</h3>
<p>If a prebuilt <code>.so</code> ships only for <code>arm64-v8a</code> but you build <code>x86_64</code> for an emulator, you get <code>UnsatisfiedLinkError</code> at runtime. Match <code>reactNativeArchitectures</code> to the ABIs your libs provide, or use an arm64 device.</p>

<h3>12. Gradle wrapper jar not committed</h3>
<p>If <code>gradle-wrapper.jar</code> is git-ignored by mistake, a fresh clone cannot bootstrap Gradle — <code>./gradlew</code> fails immediately. All four wrapper files must be committed.</p>

<h3>13. gradle.properties heap too small</h3>
<p>Large RN apps OOM the Gradle daemon during DEX/R8. Raise <code>org.gradle.jvmargs=-Xmx4096m</code>. This is a build-machine setting, not shipped to the device.</p>

<h3>14. Two histories after AWS migration (meeting-room-tablet)</h3>
<p>Not a folder file per se, but a real gotcha: a repo can have divergent history lines, so the <code>android/</code> you branch from matters — PR against the right base (there, <code>release_1.0.x</code>), or you rebuild against stale native config.</p>

<h3>15. New Arch codegen output looks like source but is not</h3>
<p>Files under <code>app/build/generated/</code> (spec classes, <code>PackageList.java</code>) are compelling to open and edit — they are regenerated every build. Change the TS spec / library instead.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — hand-editing android/ on an Expo project</h3>
<p>You add a manifest entry directly, it works locally, then a teammate runs <code>expo prebuild --clean</code> and it vanishes. Always encode native changes as config plugins / <code>app.json</code>.</p>

<h3>Anti-pattern 2 — committing build/, .gradle/, or .cxx/</h3>
<p>Bloats the repo, causes merge conflicts on generated binaries, and leaks machine paths. Let <code>.gitignore</code> exclude them.</p>

<h3>Anti-pattern 3 — shipping release signed with debug.keystore</h3>
<p>Insecure and non-rotatable; Play may reject it. Use a real release key / Play App Signing / EAS credentials.</p>

<h3>Anti-pattern 4 — turning on minifyEnabled without keep rules</h3>
<p>R8 strips reflection/JNI-reached classes and the release build crashes only in production. Add targeted <code>-keep</code> rules and test the release variant before shipping.</p>

<h3>Anti-pattern 5 — bumping targetSdk blindly</h3>
<p>New <code>targetSdk</code> silently changes runtime behavior (scoped storage, notification permission, background limits). Read the migration notes and test, do not just raise the number.</p>

<h3>Anti-pattern 6 — editing generated PackageList / codegen files</h3>
<p>Overwritten every build. Fix the library, the autolinking config, or your spec.</p>

<h3>Anti-pattern 7 — treating gradle.properties flags as JS config</h3>
<p><code>newArchEnabled</code> / <code>hermesEnabled</code> require a full native rebuild to take effect — a Metro reload does nothing. Rebuild the app after changing them.</p>

<h3>Anti-pattern 8 — global gradle instead of ./gradlew</h3>
<p>Using a system-installed Gradle version skews from the pinned wrapper version and produces "works on my machine" build breaks. Always <code>./gradlew</code>.</p>

<h3>Anti-pattern 9 — putting launcher icons in drawable</h3>
<p>Use <code>mipmap-*</code> so density stripping does not remove your icon.</p>

<h3>Anti-pattern 10 — duplicating SDK versions across files</h3>
<p>Hard-coding <code>minSdk</code>/<code>compileSdk</code> in <code>app/build.gradle</code> instead of referencing <code>rootProject.ext</code> leads to mismatched versions across modules. Keep one source of truth in root <code>build.gradle</code> (or <code>expo-build-properties</code>).</p>

<h3>Anti-pattern 11 — ignoring manifest merger warnings</h3>
<p>They downgrade to silent behavior changes (an autolinked lib flipping <code>allowBackup</code>). Read the merged manifest under <code>build/</code> when in doubt.</p>

<h3>Anti-pattern 12 — deleting local.properties to "fix" a build</h3>
<p>That just removes your SDK path; the next build fails to locate the SDK. Fix the actual cause (usually stale <code>build/</code> or a dependency), not this file.</p>

<h3>Anti-pattern 13 — checking in large assets under res/raw</h3>
<p>Bloats every APK for all users. Prefer remote fetch or on-demand download for big media; keep <code>raw/</code> for small, always-needed files.</p>

<h3>Anti-pattern 14 — assuming android/ is "the RN code"</h3>
<p>It is a real Gradle Android project; RN is just an embedded dependency plus a bundle. Reasoning about it as a normal Android app is what unlocks native debugging.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. Walk me through the top level of an RN android/ folder.</div>
  <div class="qa-answer">
    <p>It is a Gradle root project. <code>build.gradle</code> holds global config (SDK versions, plugin classpaths); <code>settings.gradle</code> declares the modules (<code>:app</code> plus autolinked libraries); <code>gradle.properties</code> carries build flags like <code>newArchEnabled</code> and <code>hermesEnabled</code>; <code>gradlew</code>/<code>gradlew.bat</code> plus <code>gradle/wrapper/</code> pin the exact Gradle version; <code>local.properties</code> (git-ignored) points at the SDK; and <code>.gitignore</code> keeps generated output out of git. The shipped app lives in the <code>app/</code> module.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. What is a Gradle module, and what modules does an RN app have?</div>
  <div class="qa-answer">
    <p>A module (subproject) is a unit that produces one artifact — an APK or an AAR. An RN app has the <code>:app</code> module (produces the APK/AAB) plus one module per autolinked native library (each produces an AAR). <code>settings.gradle</code> <code>include</code>s them; <code>app/build.gradle</code> depends on them via <code>implementation project(':lib')</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Explain source sets: main vs debug vs release.</div>
  <div class="qa-answer">
    <p>Source sets group sources and resources by build type. <code>src/main</code> applies to every build. <code>src/debug</code> and <code>src/release</code> add or override for that build type — Gradle merges manifests and lets a build-type class or resource replace the main one. Typical use: a debug-only manifest that allows cleartext traffic to Metro, or a release-only tweak.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. What is the Gradle wrapper and why does it exist?</div>
  <div class="qa-answer">
    <p><code>gradlew</code>/<code>gradlew.bat</code> plus <code>gradle/wrapper/gradle-wrapper.jar</code> and <code>gradle-wrapper.properties</code>. The <code>.properties</code> <code>distributionUrl</code> pins a Gradle version; the jar bootstraps and downloads it. It guarantees every developer and CI builds with the identical Gradle version without a global install — reproducible builds. Always run <code>./gradlew</code>, never a system <code>gradle</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Why is local.properties git-ignored, and what breaks without it?</div>
  <div class="qa-answer">
    <p>It contains machine-specific paths — <code>sdk.dir</code> (and optionally <code>ndk.dir</code>) — which differ per developer and OS, so it must not be committed. Without it (and without <code>ANDROID_HOME</code>), Gradle fails with "SDK location not found". Android Studio writes it automatically on first open.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Difference between minSdk, compileSdk, and targetSdk?</div>
  <div class="qa-answer">
    <p><code>minSdk</code> is the oldest Android version that can install the app. <code>compileSdk</code> is the API level you compile against (what symbols are visible). <code>targetSdk</code> is the version whose runtime behavior you opt into — raising it can flip runtime behaviors (permissions, background limits) even without code changes. They live in root <code>build.gradle ext</code> and <code>app/build.gradle defaultConfig</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. What are proguard-rules.pro and minifyEnabled for?</div>
  <div class="qa-answer">
    <p><code>minifyEnabled true</code> on the release build type runs R8 to shrink and obfuscate code. R8 removes classes it thinks are unused — but reflection/JNI-reached code looks unused, so <code>proguard-rules.pro</code> holds <code>-keep</code> rules to preserve them. A crash that happens only in release and not debug is very often a missing keep rule, since debug does not minify.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Where does the JS bundle end up in a release build?</div>
  <div class="qa-answer">
    <p>In <code>app/src/main/assets/index.android.bundle</code>, with its image assets under <code>res/</code>, emitted at build time by the RN Gradle plugin running Metro. In debug there is no bundle file — Metro serves JS over the dev server, which is why debug builds need a running packager.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. How does an autolinked library get into the build?</div>
  <div class="qa-answer">
    <p><code>npx react-native config</code> scans <code>node_modules</code> for packages with native Android code. A generated script <code>include</code>s each as a module in <code>settings.gradle</code> and adds an <code>implementation project(':lib')</code> in <code>app/build.gradle</code>. At runtime, <code>MainApplication.getPackages()</code> returns <code>PackageList(this).packages</code>, which includes the auto-added packages. No manual Gradle editing needed since RN 0.60.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. What lives in res/ and how is it organized?</div>
  <div class="qa-answer">
    <p><code>drawable/</code> for images/vectors, <code>mipmap-*</code> for launcher icons per density, <code>values/</code> for <code>strings.xml</code>/<code>colors.xml</code>/<code>themes.xml</code>, <code>xml/</code> for config files like <code>network_security_config.xml</code> and FileProvider <code>file_paths.xml</code>, and <code>raw/</code> for verbatim files read by resource id. Launcher icons must be in <code>mipmap</code>, not <code>drawable</code>, so density stripping does not remove them.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. jniLibs vs jni — what is the difference?</div>
  <div class="qa-answer">
    <p><code>jniLibs/&lt;abi&gt;/*.so</code> holds prebuilt native shared libraries per ABI (<code>arm64-v8a</code>, etc.). <code>jni/</code> holds C/C++ source plus <code>CMakeLists.txt</code>/<code>Android.mk</code> that the NDK compiles during the build. Most app modules have neither; RN core and libraries like Reanimated ship native code. A missing <code>.so</code> for the built ABI throws <code>UnsatisfiedLinkError</code> at runtime.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Which directories should never be committed?</div>
  <div class="qa-answer">
    <p><code>build/</code> and <code>app/build/</code> (compiled output, APK/AAB, merged manifest, <code>app/build/generated/</code> codegen and <code>PackageList.java</code>), <code>.gradle/</code> (Gradle cache/state), <code>.cxx/</code> (NDK/CMake intermediates), and <code>local.properties</code>. All are regenerated; committing them causes conflicts and leaks paths. The committed source of truth is the Gradle scripts, wrapper, manifest, code, and <code>res/</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. On an Expo project, how do you change something in android/?</div>
  <div class="qa-answer">
    <p>You do not edit <code>android/</code> directly — it is generated by <code>expo prebuild</code> from <code>app.json</code>/<code>app.config.js</code> and config plugins, and <code>--clean</code> wipes hand-edits. Instead: permissions and manifest via <code>app.json</code> / a config plugin; SDK/NDK/Kotlin versions and flags via <code>expo-build-properties</code>; <code>newArchEnabled</code> and <code>jsEngine</code> via <code>app.json</code>; signing via EAS credentials. Then re-prebuild.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. What are MainActivity and MainApplication?</div>
  <div class="qa-answer">
    <p><code>MainApplication</code> is the <code>Application</code> subclass — the true entry point — which builds the <code>ReactNativeHost</code>/<code>ReactHost</code>, returns the native package list, and initializes SoLoader/Hermes. <code>MainActivity</code> is the launched <code>Activity</code> hosting the RN root view; it returns the JS component name via <code>getMainComponentName()</code>. Both live under <code>app/src/main/java</code> (or <code>kotlin/</code>). Deep dive: the andr-entry-code topic.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Debug build works, release crashes on launch. First checks?</div>
  <div class="qa-answer">
    <p>Release differs from debug mainly by <code>minifyEnabled</code> (R8) and the bundled JS. So: (1) suspect a stripped class — add <code>-keep</code> rules in <code>proguard-rules.pro</code> and test; (2) check the release <code>AndroidManifest</code> merge for a removed permission; (3) verify the JS bundle is embedded in <code>assets/</code>; (4) read logcat for the native stack, since the JS trace will not show the native crash point.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You describe android/ as a Gradle multi-module project, not "the RN code".</li>
    <li>You can name each top-level file and its job (settings vs build vs gradle.properties).</li>
    <li>You explain source sets and how debug/release override main.</li>
    <li>You know the wrapper pins Gradle and why to always use ./gradlew.</li>
    <li>You distinguish minSdk / compileSdk / targetSdk precisely.</li>
    <li>You tie release-only crashes to minifyEnabled + proguard keep rules.</li>
    <li>You know autolinking wires libs via settings.gradle + app/build.gradle + PackageList.</li>
    <li>You flag that on Expo the whole folder is generated and edit config instead.</li>
    <li>You list what must never be committed (build/, .gradle/, .cxx/, local.properties).</li>
  </ul>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'revision', title: '⚡ Revision — Points to Remember', collapsible: true, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline"><code>android/</code> is a <strong>Gradle multi-module project</strong> where <code>app/</code> is the shipped module and every RN library is an autolinked module; on Expo the whole folder is <strong>generated</strong> from <code>app.json</code> + config plugins, so you edit the config, not the folder.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Top level = build orchestration.</strong> Root <code>build.gradle</code> (global SDK/plugin versions in <code>ext</code>), <code>settings.gradle</code> (declares modules + autolinking), <code>gradle.properties</code> (flags: <code>newArchEnabled</code>, <code>hermesEnabled</code>, <code>android.useAndroidX</code>, <code>reactNativeArchitectures</code>).</li>
    <li><strong>The wrapper</strong> = <code>gradlew</code> + <code>gradlew.bat</code> + <code>gradle/wrapper/gradle-wrapper.jar</code> + <code>gradle-wrapper.properties</code> (<code>distributionUrl</code> pins the version). Always <code>./gradlew</code>; all four files are committed.</li>
    <li><strong><code>local.properties</code></strong> holds <code>sdk.dir</code> (and optional <code>ndk.dir</code>) — machine-specific, <strong>git-ignored</strong>; missing it = "SDK location not found".</li>
    <li><strong><code>app/</code> is the shipped module</strong> (<code>:app</code>). <code>app/build.gradle</code> sets <code>applicationId</code>, <code>versionCode</code>, <code>versionName</code>, <code>minSdk</code>/<code>compileSdk</code>/<code>targetSdk</code>, <code>signingConfigs</code>, <code>buildTypes</code>.</li>
    <li><strong><code>proguard-rules.pro</code></strong> = R8/ProGuard <code>-keep</code> rules; only matters when <code>minifyEnabled true</code> (release). Release-only crashes are usually a missing keep rule (debug does not minify).</li>
    <li><strong><code>debug.keystore</code></strong> is committed and public (<code>android</code>/<code>androiddebugkey</code>) for shared debug signing — NEVER for release.</li>
    <li><strong>Source sets:</strong> <code>src/main</code> (every build) plus <code>src/debug</code> / <code>src/release</code> overrides; Gradle merges manifests and lets build-type files replace <code>main</code>.</li>
    <li><strong><code>src/main</code> contents:</strong> <code>AndroidManifest.xml</code> (package, permissions, <code>&lt;application android:name=".MainApplication"&gt;</code>, launcher <code>MainActivity</code>); <code>java/</code> or <code>kotlin/</code> with <code>MainActivity</code> + <code>MainApplication</code>; <code>res/</code> (<code>drawable/</code>, <code>mipmap-*</code> launcher icons, <code>values/</code>, <code>xml/</code>, <code>raw/</code>); <code>assets/</code> (release <code>index.android.bundle</code>); <code>jniLibs/</code> (prebuilt <code>.so</code> per ABI) / <code>jni/</code> (C/C++ source + CMake).</li>
    <li><strong>Never commit / never hand-edit:</strong> <code>build/</code>, <code>app/build/</code> (incl. <code>generated/</code> = codegen + <code>PackageList.java</code>), <code>.gradle/</code>, <code>.cxx/</code>, <code>local.properties</code>.</li>
    <li><strong>Autolinking:</strong> <code>npx react-native config</code> scans <code>node_modules</code> &rarr; <code>settings.gradle</code> <code>include</code>s each lib module &rarr; <code>app/build.gradle</code> adds <code>implementation project(':lib')</code> &rarr; <code>PackageList(this).packages</code> in <code>MainApplication</code>.</li>
    <li><strong>Expo/CNG:</strong> whole folder generated by <code>expo prebuild</code>; edit <code>app.json</code>/config plugins/<code>expo-build-properties</code>; hand-edits wiped by <code>--clean</code>. sw-mobile/sw-ticketing are all prebuild + OLD arch (Paper, <code>newArchEnabled=false</code>).</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Hand-editing <code>android/</code> on an Expo project</strong> (a manifest entry, a gradle flag) — it works locally, then <code>expo prebuild --clean</code> silently wipes it. Fix: put the change in <code>app.json</code> / a config plugin / <code>expo-build-properties</code> so it survives regeneration. (Second trap: a release-only crash is almost always a missing <code>proguard-rules.pro</code> keep rule, since debug does not run R8.)</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"<code>android/</code> is a Gradle multi-module project: <code>settings.gradle</code> lists the modules, root <code>build.gradle</code> sets global versions, and <code>app/</code> is the only module that ships. Every RN library is an autolinked module."</div>
  <div class="revision-say">"Source sets merge by build type — <code>src/main</code> for everything, <code>src/debug</code>/<code>src/release</code> for overrides. Release turns on <code>minifyEnabled</code>, so a release-only crash is usually a missing ProGuard keep rule."</div>
  <div class="revision-say">"On Expo the whole folder is generated from <code>app.json</code> and config plugins, so I never hand-edit it — I change <code>expo-build-properties</code> or a config plugin and re-prebuild, or <code>--clean</code> wipes my edits."</div>
</div>
`},

{ id: 'checklist', title: '✅ Interview Checklist', collapsible: true, html: `
<div class="callout success">
  <div class="callout-title">Can you answer these before moving on?</div>
  <ul>
    <li>Can you name every top-level file in <code>android/</code> and say what each one does?</li>
    <li>Can you explain what a Gradle module is and which modules an RN app has?</li>
    <li>Can you describe how <code>src/main</code>, <code>src/debug</code>, and <code>src/release</code> source sets merge?</li>
    <li>Can you distinguish <code>minSdk</code>, <code>compileSdk</code>, and <code>targetSdk</code> and where they are set?</li>
    <li>Can you explain why a release build crashes when debug does not, and where the fix lives?</li>
    <li>Can you trace how an autolinked library gets from <code>node_modules</code> into the running app?</li>
    <li>Can you list which directories must never be committed and why, and what changes on an Expo prebuild project?</li>
  </ul>
</div>
`}

]
});
