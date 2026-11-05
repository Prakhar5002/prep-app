window.PREP_SITE.registerTopic({
  id: "andr-gradle",
  module: "Android Native (Deep)",
  title: "Gradle & Build System",
  estimatedReadTime: "26 min",
  tags: ["gradle","agp","android-gradle-plugin","groovy","kotlin-dsl","build-gradle","settings-gradle","gradle-properties","gradle-wrapper","autolinking","r8","proguard","sdk-versions","compilesdk","minsdk","targetsdk","ndk","jvm","jdk","hermes","newarchenabled","16kb-page-size","expo-build-properties","react-native","android"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Gradle is the JVM build engine, the <strong>wrapper pins its version</strong>, <strong>AGP</strong> is the Android plugin that drives it, and <strong>Gradle ↔ AGP ↔ JDK must agree</strong> — in Expo apps you set these via <code>expo-build-properties</code>, never by hand-editing the regenerated <code>android/</code>.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Gradle</strong> = JVM build tool modeling the build as a DAG of tasks with inputs/outputs → incremental builds (UP-TO-DATE skips) + build cache + parallel execution. Three phases: initialization → configuration → execution.</li>
    <li><strong>Gradle Wrapper:</strong> <code>./gradlew</code> reads <code>distributionUrl</code> in <code>gradle-wrapper.properties</code> to download/run a pinned Gradle version. Commit <code>gradlew</code>, <code>gradle-wrapper.jar</code>, <code>gradle-wrapper.properties</code>. Wrapper &gt; local gradle = reproducible builds, no install step, CI needs only a JDK. Never run bare <code>gradle</code>.</li>
    <li><strong>AGP</strong> (<code>com.android.tools.build:gradle</code>) adds the <code>android {}</code> DSL, R8/D8, aapt2, manifest merge, variants — versioned separately from Gradle.</li>
    <li><strong>Compatibility triangle AGP ↔ Gradle ↔ JDK</strong>: RN 0.79/Expo 53 ≈ AGP 8.6 + Gradle 8.7+ + JDK 17 (older RN = JDK 11). Mismatch fails before compiling ("requires Java 17", "Minimum supported Gradle version…"). Most "works on my machine" Android build failures are a mismatch in this triangle or a stale build cache.</li>
    <li><strong>Groovy DSL</strong> (<code>.gradle</code>, RN default, dynamic) vs <strong>Kotlin DSL</strong> (<code>.gradle.kts</code>, static, IDE-friendly, double quotes + <code>=</code>).</li>
    <li><strong>Root build.gradle:</strong> <code>buildscript</code> + <code>ext</code> block centralizes <code>buildToolsVersion</code>, <code>minSdkVersion</code>, <code>compileSdkVersion</code>, <code>targetSdkVersion</code>, <code>ndkVersion</code>, <code>kotlinVersion</code>; <code>repositories { google(); mavenCentral() }</code>; classpath deps; <code>allprojects</code>.</li>
    <li><strong>settings.gradle:</strong> <code>pluginManagement</code>, <code>include ':app'</code>, RN autolinking via the <code>com.facebook.react.settings</code> plugin (older: <code>apply from native_modules.gradle</code>) — scans <code>node_modules</code> and pulls community libs into the build automatically.</li>
    <li><strong>app/build.gradle:</strong> <code>apply plugin</code>, <code>android {}</code> (<code>compileSdk</code>, <code>defaultConfig</code> with <code>applicationId</code>/<code>minSdk</code>/<code>targetSdk</code>/<code>versionCode</code>/<code>versionName</code>, <code>buildTypes</code>, <code>signingConfigs</code>, <code>buildFeatures</code>, <code>packagingOptions</code>, <code>splits</code>/<code>abiFilters</code>), <code>react {}</code>, <code>dependencies {}</code>.</li>
    <li><strong>SDK versions:</strong> compileSdk = API you compile against; minSdk = oldest device; targetSdk = tested-against behavior level (Play forces upward); buildToolsVersion = aapt2/dexer; ndkVersion = C++/Hermes/JSI.</li>
    <li><strong>Dependency keywords:</strong> <code>implementation</code> (no transitive leak, default), <code>api</code> (re-exported), <code>compileOnly</code>, <code>runtimeOnly</code>, <code>debugImplementation</code>, <code>testImplementation</code> (JVM/JUnit), <code>androidTestImplementation</code> (device/Espresso), <code>annotationProcessor</code>/<code>kapt</code>/<code>ksp</code>.</li>
    <li><strong>gradle.properties:</strong> <code>org.gradle.jvmargs</code>, <code>org.gradle.parallel</code>, <code>org.gradle.configureondemand</code>, <code>org.gradle.caching</code>, <code>android.useAndroidX</code>, plus RN flags <code>newArchEnabled</code>, <code>hermesEnabled</code>, <code>reactNativeArchitectures</code> (arm64-v8a, armeabi-v7a, x86, x86_64).</li>
    <li><strong>Tasks:</strong> <code>assembleDebug</code>/<code>assembleRelease</code> (APK), <code>bundleRelease</code> (AAB for Play), <code>installDebug</code>, <code>clean</code>, <code>app:dependencies</code>, <code>signingReport</code>, <code>tasks</code>; flags <code>--stacktrace</code>, <code>--info</code>, <code>-x lint</code>.</li>
    <li><strong>R8</strong> (<code>minifyEnabled true</code>) shrinks/obfuscates → release-only crashes from stripped reflection targets → fix with keep rules in <code>proguard-rules.pro</code>, not by disabling minify.</li>
    <li><strong>16 KB page size:</strong> Android 15+/Play (Nov 2025) needs 16 KB-aligned <code>.so</code>s; RN 0.76 prebuilts were 4 KB and couldn't be re-aligned → <code>sw-ticketing</code> upgraded to Expo 53/RN 0.79 (NDK r27+/AGP 8.5.1+), plus <code>jniLibs { useLegacyPackaging false }</code>.</li>
    <li><strong>Expo reality:</strong> <code>android/</code> is regenerated by <code>expo prebuild</code> (CNG); set compileSdk/ndkVersion/etc. via <code>expo-build-properties</code> in <code>app.json</code>; hand-edits are wiped by <code>--clean</code>.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Bumping AGP alone (or running the wrong JDK) and expecting it to work.</strong> AGP, Gradle, and the JDK move together — change one and the build dies with "requires Java 17" or "Minimum supported Gradle version…". Read the Gradle version from <code>gradle-wrapper.properties</code> and the AGP version from the root <code>build.gradle</code> classpath — they are two different numbers. And in Expo apps, editing <code>android/</code> directly is wiped on the next <code>expo prebuild --clean</code>; set values in <code>expo-build-properties</code> instead.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Gradle is the JVM build engine, the wrapper pins its exact version so everyone builds identically, and AGP is the separately-versioned Android plugin that drives it — they're not the same number."</div>
  <div class="revision-say">"AGP, Gradle, and the JDK form a compatibility triangle — RN 0.79 is AGP 8.6-ish on Gradle 8.7+ with JDK 17; a mismatch fails before any of my code compiles."</div>
  <div class="revision-say">"compileSdk is what I compile against, minSdk is the oldest device, targetSdk is the behavior level Play forces upward. And in my Expo apps I set all of these through expo-build-properties, because prebuild regenerates the android folder."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What Gradle actually is</h3>
<p>Gradle is a general-purpose, JVM-based build automation tool. It runs on the JVM, and its build scripts are written in a JVM language — Groovy (the <code>.gradle</code> files) or Kotlin (<code>.gradle.kts</code>). It is not Android-specific; it also builds plain Java, Kotlin, Spring, and Gradle-plugin projects. Android just happens to use it as its official build system, driven by a plugin (AGP).</p>
<p>Gradle's core model is a <strong>directed acyclic graph (DAG) of tasks</strong>. A "task" is a unit of work — <code>compileDebugKotlin</code>, <code>mergeReleaseResources</code>, <code>packageRelease</code>. Each task declares inputs and outputs. Gradle computes the graph, orders tasks by their dependencies, and runs them. Two features make this fast:</p>
<ul>
  <li><strong>Incremental builds</strong> — if a task's inputs haven't changed since last run, Gradle marks it <code>UP-TO-DATE</code> and skips it.</li>
  <li><strong>Build cache</strong> — task outputs are cached (locally, and optionally remotely) keyed by a hash of inputs, so even a clean checkout can reuse prior outputs.</li>
</ul>

<h3>Why a build system at all (for RN)</h3>
<p>An Android RN build is not just "compile Kotlin." It must: run <strong>Codegen</strong> for the New Architecture, compile your Java/Kotlin plus every autolinked native module, invoke the <strong>NDK/CMake</strong> to build C++ (<code>.so</code>) libraries, merge resources and manifests from dozens of libraries, bundle and (in release) minify the JS with Metro + Hermes, run <strong>R8</strong> to shrink/obfuscate bytecode, and finally sign and package into an APK/AAB. Gradle orchestrates all of it as one task graph. This is why an Android build has hundreds of tasks and why "just rebuild" can take minutes.</p>

<h3>The three build phases</h3>
<table>
  <thead><tr><th>Phase</th><th>What happens</th></tr></thead>
  <tbody>
    <tr><td><strong>Initialization</strong></td><td>Gradle reads <code>settings.gradle</code>, decides which projects/modules make up the build (<code>:app</code>, autolinked libraries).</td></tr>
    <tr><td><strong>Configuration</strong></td><td>Every <code>build.gradle</code> is evaluated top-to-bottom, building the task graph. Slow if you do real work here instead of inside tasks.</td></tr>
    <tr><td><strong>Execution</strong></td><td>The requested tasks (and their dependencies) actually run, honoring UP-TO-DATE checks and the cache.</td></tr>
  </tbody>
</table>

<h3>Why version alignment matters</h3>
<p>Gradle, AGP, and the JDK evolve on separate schedules but are tightly coupled. A given AGP version requires a minimum Gradle version and a specific JDK range. Ship RN 0.79 (Expo 53) and you are on a JDK 17 + AGP 8.x + Gradle 8.x world; older RN pinned JDK 11. Mismatches produce cryptic errors ("Unsupported class file major version", "AGP requires Gradle X") long before your code compiles.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>The "who drives whom" picture</h3>
<div class="diagram">
<pre>
  ./gradlew  ──reads──►  gradle-wrapper.properties
     │                        │  distributionUrl pins Gradle 8.x
     │                        ▼
     │                   downloads + runs GRADLE (the engine, on the JVM)
     ▼
  GRADLE  ──applies──►  ANDROID GRADLE PLUGIN (AGP 8.x)
     │                        │  adds android {} DSL, R8, D8, aapt2, tasks
     │                        ▼
     │                   uses JDK 17 (compiler + toolchain)
     ▼
  reads build.gradle / settings.gradle / gradle.properties
     │
     ▼
  builds TASK GRAPH ──► executes ──► APK / AAB
</pre>
</div>

<h3>The "which file does what" picture</h3>
<div class="diagram">
<pre>
 android/
 ├─ gradlew, gradlew.bat            (wrapper launchers — commit these)
 ├─ gradle/wrapper/
 │    ├─ gradle-wrapper.properties  (distributionUrl → pins GRADLE version)
 │    └─ gradle-wrapper.jar         (tiny bootstrap jar)
 ├─ build.gradle                    (ROOT: buildscript, ext SDK versions,
 │                                    plugin classpaths, allprojects repos)
 ├─ settings.gradle                 (pluginManagement, include ':app',
 │                                    RN autolinking apply-from)
 ├─ gradle.properties               (JVM args + feature flags:
 │                                    newArchEnabled, hermesEnabled, ...)
 └─ app/
      ├─ build.gradle               (APP module: android {}, react {},
      │                              defaultConfig, buildTypes, dependencies)
      ├─ proguard-rules.pro         (R8/ProGuard keep rules)
      └─ src/main/AndroidManifest.xml
</pre>
</div>

<h3>The "wrapper vs local gradle" idea</h3>
<p>You never run the <code>gradle</code> you happened to install with Homebrew. You run <code>./gradlew</code> (the <em>wrapper</em>), a script committed into the repo that reads <code>distributionUrl</code>, downloads the exact pinned Gradle version into <code>~/.gradle/wrapper/</code>, and runs it. Every developer and every CI machine therefore builds with the identical Gradle version regardless of what is installed globally. That reproducibility is the whole point.</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Gradle and AGP are the same version." They are not. Gradle might be 8.10 while AGP is 8.6 — two independent version lines with their own compatibility rules. Reading the "Gradle version" from <code>gradle-wrapper.properties</code> and the "AGP version" from the root <code>build.gradle</code> classpath are two different lookups.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>The Gradle Wrapper — gradle-wrapper.properties</h3>
<p>This one-file pins the Gradle engine version for the whole repo:</p>
<pre><code class="language-properties"># android/gradle/wrapper/gradle-wrapper.properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.10.2-all.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists</code></pre>
<p>Change <code>gradle-8.10.2</code> to bump Gradle. Prefer the <code>-all</code> distribution (includes sources/docs for IDEs) over <code>-bin</code>. You run it as:</p>
<pre><code class="language-bash">cd android
./gradlew --version        # prints Gradle + JVM + Kotlin versions
./gradlew assembleDebug    # never "gradle assembleDebug"</code></pre>
<p><strong>Why wrapper &gt; local gradle:</strong> reproducible builds (everyone uses the pinned version), no "install Gradle" step for new devs, and CI needs only a JDK. The wrapper files (<code>gradlew</code>, <code>gradlew.bat</code>, <code>gradle-wrapper.jar</code>, <code>gradle-wrapper.properties</code>) are committed to git.</p>

<h3>The Android Gradle Plugin (AGP)</h3>
<p>AGP is the plugin that adds Android's build logic to Gradle: the <code>android {}</code> DSL, R8/D8, <code>aapt2</code> resource compilation, manifest merging, variant generation, and the whole APK/AAB pipeline. It is declared as a classpath dependency (or in the plugins block) and versioned independently of Gradle:</p>
<pre><code class="language-groovy">// android/build.gradle (root) — classpath style
buildscript {
  dependencies {
    classpath("com.android.tools.build:gradle:8.6.0")   // &lt;-- AGP version
    classpath("org.jetbrains.kotlin:kotlin-gradle-plugin")
    classpath("com.facebook.react:react-native-gradle-plugin")
  }
}</code></pre>

<h3>The compatibility triangle: AGP ↔ Gradle ↔ JDK</h3>
<table>
  <thead><tr><th>AGP</th><th>Min Gradle</th><th>Required JDK</th><th>Typical RN/Expo era</th></tr></thead>
  <tbody>
    <tr><td>7.4</td><td>7.5</td><td>JDK 11</td><td>RN 0.71–0.72</td></tr>
    <tr><td>8.1</td><td>8.0</td><td>JDK 17</td><td>RN 0.73–0.74</td></tr>
    <tr><td>8.6</td><td>8.7</td><td>JDK 17</td><td>RN 0.79 / Expo 53</td></tr>
  </tbody>
</table>
<p>Get any pair wrong and the build refuses to start: "Android Gradle plugin requires Java 17"; "Minimum supported Gradle version is 8.7. Current version is 8.0." Check your JDK with <code>java -version</code> and pin it in Android Studio (Settings → Build → Gradle → Gradle JDK).</p>

<h3>Groovy DSL vs Kotlin DSL</h3>
<p>Build scripts come in two flavors. RN and Expo ship <strong>Groovy</strong> (<code>.gradle</code>) by default; Kotlin DSL (<code>.gradle.kts</code>) is an option some teams prefer for IDE autocompletion and type safety.</p>
<table>
  <thead><tr><th></th><th>Groovy DSL</th><th>Kotlin DSL</th></tr></thead>
  <tbody>
    <tr><td>File</td><td><code>build.gradle</code></td><td><code>build.gradle.kts</code></td></tr>
    <tr><td>Strings</td><td>single or double quotes</td><td>double quotes only</td></tr>
    <tr><td>Assignment</td><td><code>compileSdkVersion 34</code></td><td><code>compileSdk = 34</code></td></tr>
    <tr><td>Typing</td><td>dynamic (errors at runtime)</td><td>static (errors in IDE)</td></tr>
    <tr><td>RN default</td><td>yes</td><td>no</td></tr>
  </tbody>
</table>

<h3>Root build.gradle — the ext block</h3>
<p>The root script's <code>buildscript.ext</code> block is where every SDK version is centralized so all modules read the same numbers:</p>
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
  repositories {
    google()
    mavenCentral()
  }
  dependencies {
    classpath("com.android.tools.build:gradle")
    classpath("com.facebook.react:react-native-gradle-plugin")
    classpath("org.jetbrains.kotlin:kotlin-gradle-plugin")
  }
}

apply plugin: "com.facebook.react.rootproject"

allprojects {
  repositories {
    google()
    mavenCentral()
    maven { url("$rootDir/../node_modules/react-native/android") }  // RN AARs
  }
}</code></pre>
<p><strong>The four SDK numbers you must know cold:</strong></p>
<ul>
  <li><strong>compileSdkVersion</strong> — the API level your code is <em>compiled</em> against. You can call any API up to this level. Usually the latest stable.</li>
  <li><strong>minSdkVersion</strong> — the <em>oldest</em> Android version the app installs on (e.g. 24 = Android 7.0). Lower = more devices, but you must guard newer-API calls.</li>
  <li><strong>targetSdkVersion</strong> — the API level you <em>tested against</em>; tells Android which runtime behaviors to apply. Play Store forces this upward every year.</li>
  <li><strong>buildToolsVersion</strong> — version of the SDK Build Tools (aapt2, dexer). <strong>ndkVersion</strong> — the NDK used to compile C++/JSI/Hermes.</li>
</ul>

<h3>settings.gradle — modules + autolinking</h3>
<pre><code class="language-groovy">// android/settings.gradle
pluginManagement {
  repositories {
    gradlePluginPortal()
    google()
    mavenCentral()
  }
}
plugins { id("com.facebook.react.settings") }

// RN autolinking: run the native_modules plugin that scans node_modules
extensions.configure(com.facebook.react.ReactSettingsExtension) { ex -&gt;
  ex.autolinkLibrariesFromCommand()
}

rootProject.name = 'sw-mobile'
include ':app'
includeBuild('../node_modules/@react-native/gradle-plugin')</code></pre>
<p><strong>How autolinking works:</strong> RN's Gradle plugin runs <code>npx react-native config</code>, which scans <code>node_modules</code> for packages that declare Android native code (via a <code>react-native.config.js</code> or the package's own gradle). For each, it auto-generates the <code>include ':library'</code> entries and adds them as dependencies — so installing <code>react-native-mmkv</code> and rebuilding is all it takes; no manual <code>settings.gradle</code> editing. Older RN used an explicit <code>apply from: "../node_modules/@react-native-community/cli-platform-android/native_modules.gradle"</code> line; modern RN uses the <code>com.facebook.react.settings</code> plugin.</p>

<h3>app/build.gradle — the app module</h3>
<pre><code class="language-groovy">// android/app/build.gradle
apply plugin: "com.android.application"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "com.facebook.react"

react {
  // controls the RN/Hermes/bundle tasks; autolinking hooks live here
  autolinkLibrariesWithApp()
}

android {
  namespace "com.workctrl.swmobile"
  compileSdk rootProject.ext.compileSdkVersion
  buildToolsVersion rootProject.ext.buildToolsVersion
  ndkVersion rootProject.ext.ndkVersion

  defaultConfig {
    applicationId "com.workctrl.swmobile"
    minSdk rootProject.ext.minSdkVersion
    targetSdk rootProject.ext.targetSdkVersion
    versionCode 42
    versionName "3.4.1"
  }

  signingConfigs {
    release {
      storeFile file(RELEASE_STORE_FILE)
      storePassword RELEASE_STORE_PASSWORD
      keyAlias RELEASE_KEY_ALIAS
      keyPassword RELEASE_KEY_PASSWORD
    }
  }

  buildTypes {
    debug { signingConfig signingConfigs.debug }
    release {
      signingConfig signingConfigs.release
      minifyEnabled true                       // run R8 (shrink + obfuscate)
      shrinkResources true
      proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"),
                    "proguard-rules.pro"
    }
  }

  buildFeatures { buildConfig true }

  packagingOptions {
    jniLibs { useLegacyPackaging false }        // relevant to 16 KB alignment
    pickFirsts += ["**/libc++_shared.so"]
  }

  splits {
    abi {
      enable false                              // per-ABI APKs vs one fat APK
      universalApk false
    }
  }
}

dependencies {
  implementation("com.facebook.react:react-android")   // RN core
  implementation("com.facebook.react:hermes-android")  // Hermes engine
  implementation("androidx.core:core-ktx:1.13.1")
  debugImplementation("com.facebook.flipper:flipper:0.x")
  testImplementation("junit:junit:4.13.2")
  androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
}</code></pre>

<h3>Dependency configuration keywords</h3>
<table>
  <thead><tr><th>Keyword</th><th>Meaning</th></tr></thead>
  <tbody>
    <tr><td><code>implementation</code></td><td>On compile + runtime classpath; NOT leaked to modules that depend on you (faster incremental builds).</td></tr>
    <tr><td><code>api</code></td><td>Like implementation but also exposed transitively to consumers. Use sparingly.</td></tr>
    <tr><td><code>compileOnly</code></td><td>Compile classpath only, not packaged (e.g. annotations, provided libs).</td></tr>
    <tr><td><code>runtimeOnly</code></td><td>Packaged + on runtime classpath, not visible at compile time.</td></tr>
    <tr><td><code>debugImplementation</code> / <code>releaseImplementation</code></td><td>Variant-scoped — Flipper only in debug, etc.</td></tr>
    <tr><td><code>testImplementation</code></td><td>Local JVM unit tests (JUnit).</td></tr>
    <tr><td><code>androidTestImplementation</code></td><td>Instrumented tests on a device/emulator (Espresso).</td></tr>
    <tr><td><code>annotationProcessor</code> / <code>kapt</code> / <code>ksp</code></td><td>Annotation processors: Java uses <code>annotationProcessor</code>; Kotlin uses <code>kapt</code> (slow) or the newer, faster <code>ksp</code> (Kotlin Symbol Processing).</td></tr>
  </tbody>
</table>

<h3>gradle.properties — JVM + feature flags</h3>
<pre><code class="language-properties"># android/gradle.properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m -Dfile.encoding=UTF-8
org.gradle.parallel=true            # build independent modules concurrently
org.gradle.configureondemand=false  # only configure needed projects
org.gradle.caching=true             # reuse cached task outputs

android.useAndroidX=true            # AndroidX (not old support lib)
android.enableJetifier=false        # rewrite old support-lib deps (legacy)

# React Native flags
newArchEnabled=false                # Fabric + TurboModules on/off
hermesEnabled=true                  # Hermes JS engine vs JSC
reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64</code></pre>
<p><strong>reactNativeArchitectures</strong> lists the CPU ABIs to build native libs for: <code>arm64-v8a</code> (modern phones), <code>armeabi-v7a</code> (older 32-bit), <code>x86</code>/<code>x86_64</code> (emulators). Trimming to <code>arm64-v8a</code> alone speeds up local builds but produces an APK that won't run on emulators or old devices.</p>

<div class="callout note">
  <div class="callout-title">newArchEnabled and hermesEnabled cross-reference</div>
  <p>These two flags are the on/off switches for the New Architecture (Fabric + TurboModules + Codegen + bridgeless) and the Hermes engine. See the <code>rn-architecture</code> topic for what they turn on internally; here they matter because flipping <code>newArchEnabled</code> triggers Codegen tasks and a full native rebuild. <code>sw-mobile</code> runs <strong>old arch (Paper) with Hermes</strong>: <code>newArchEnabled=false</code>, <code>hermesEnabled=true</code>.</p>
</div>

<h3>Common ./gradlew tasks</h3>
<pre><code class="language-bash">./gradlew assembleDebug       # build debug APK  -&gt; app/build/outputs/apk/
./gradlew assembleRelease     # build release APK
./gradlew bundleRelease       # build release AAB (.aab) for Play Store
./gradlew installDebug        # build + install debug APK on device/emulator
./gradlew clean               # delete build/ outputs (fixes stale-cache bugs)
./gradlew app:dependencies    # print the full dependency tree (resolve conflicts)
./gradlew signingReport       # print keystore SHA-1/SHA-256 (for Firebase/maps)
./gradlew tasks               # list available tasks
./gradlew assembleRelease --stacktrace   # full stack trace on failure
./gradlew assembleDebug --info           # verbose logging
./gradlew assembleRelease -x lint        # exclude the lint task</code></pre>
<p>APK = installable file; AAB (Android App Bundle) = the upload format for Play, which generates per-device APKs server-side. Always <code>bundleRelease</code> for the Play Store, <code>assembleRelease</code> for a directly-shared APK.</p>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — you don't hand-edit these files</div>
  <p>In an Expo prebuild app (<code>sw-mobile</code>, <code>sw-ticketing</code>), the entire <code>android/</code> folder is <strong>generated</strong> by <code>expo prebuild</code> (Continuous Native Generation). Editing <code>build.gradle</code> or <code>gradle.properties</code> by hand gets wiped on the next <code>expo prebuild --clean</code>. Instead you set these values in <code>app.json</code> via the <code>expo-build-properties</code> config plugin, and prebuild writes them into the native files. Example:</p>
  <pre><code class="language-json">// app.json
{
  "expo": {
    "plugins": [
      ["expo-build-properties", {
        "android": {
          "compileSdkVersion": 35,
          "targetSdkVersion": 35,
          "minSdkVersion": 24,
          "buildToolsVersion": "35.0.0",
          "ndkVersion": "27.1.12297006",
          "enableProguardInReleaseBuilds": true
        }
      }]
    ]
  }
}</code></pre>
  <p><code>newArchEnabled</code> and <code>hermesEnabled</code> are set at the top level of <code>app.json</code> (or via the RN version defaults), not by editing <code>gradle.properties</code>.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — reading your three key versions</h3>
<pre><code class="language-bash"># Gradle version:
grep distributionUrl android/gradle/wrapper/gradle-wrapper.properties
#   ...gradle-8.10.2-all.zip

# AGP version:
grep "com.android.tools.build:gradle" android/build.gradle
#   classpath("com.android.tools.build:gradle:8.6.0")

# JDK Gradle uses:
cd android &amp;&amp; ./gradlew --version</code></pre>

<h3>Example 2 — bumping only the Gradle version</h3>
<pre><code class="language-bash"># Preferred: let the wrapper rewrite itself
cd android
./gradlew wrapper --gradle-version 8.10.2 --distribution-type all
# then commit gradle-wrapper.properties + gradle-wrapper.jar</code></pre>

<h3>Example 3 — the ext block feeding the app module</h3>
<pre><code class="language-groovy">// root build.gradle sets it once:
ext { compileSdkVersion = 35 }

// app/build.gradle reads it:
android { compileSdk rootProject.ext.compileSdkVersion }</code></pre>

<h3>Example 4 — a debug-only dependency</h3>
<pre><code class="language-groovy">dependencies {
  debugImplementation("com.facebook.flipper:flipper:0.201.0")
  releaseImplementation("com.example:no-op-stub:1.0")   // stubbed in release
}</code></pre>

<h3>Example 5 — abiFilters to shrink a local build</h3>
<pre><code class="language-groovy">android {
  defaultConfig {
    ndk { abiFilters "arm64-v8a" }   // build only for your test phone
  }
}</code></pre>
<p>Speeds up iteration, but do NOT ship this — release must include all target ABIs (or use ABI splits / an AAB).</p>

<h3>Example 6 — resolving a version conflict via the dependency tree</h3>
<pre><code class="language-bash">cd android
./gradlew app:dependencies --configuration releaseRuntimeClasspath | grep androidx.core
# find who pulls an old version, then force it:</code></pre>
<pre><code class="language-groovy">configurations.all {
  resolutionStrategy { force "androidx.core:core-ktx:1.13.1" }
}</code></pre>

<h3>Example 7 — getting the keystore fingerprint for Firebase</h3>
<pre><code class="language-bash">cd android &amp;&amp; ./gradlew signingReport
# copy the SHA-1 / SHA-256 into Firebase / Google Maps console</code></pre>

<h3>Example 8 — a Kotlin DSL equivalent (for contrast)</h3>
<pre><code class="language-kotlin">// app/build.gradle.kts
android {
  compileSdk = 35
  defaultConfig {
    applicationId = "com.workctrl.swmobile"
    minSdk = 24
    targetSdk = 35
    versionCode = 42
    versionName = "3.4.1"
  }
}
dependencies {
  implementation("androidx.core:core-ktx:1.13.1")
}</code></pre>

<h3>Example 9 — signing config pulled from gradle.properties (keystore secrets out of git)</h3>
<pre><code class="language-properties"># ~/.gradle/gradle.properties (NOT committed)
RELEASE_STORE_FILE=/Users/me/keys/sw-mobile.keystore
RELEASE_STORE_PASSWORD=...
RELEASE_KEY_ALIAS=swmobile
RELEASE_KEY_PASSWORD=...</code></pre>

<h3>Example 10 — a release build with a clean cache</h3>
<pre><code class="language-bash">cd android
./gradlew clean
./gradlew bundleRelease --stacktrace
ls app/build/outputs/bundle/release/    # app-release.aab</code></pre>

<h3>Example 11 — Expo: set SDK versions without touching android/</h3>
<pre><code class="language-json">// app.json — then run: npx expo prebuild --clean &amp;&amp; npx expo run:android
{ "expo": { "plugins": [["expo-build-properties",
  { "android": { "compileSdkVersion": 35, "minSdkVersion": 24 } }]] } }</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. Wrong JDK (the #1 failure)</h3>
<p>"Unsupported class file major version 65" or "requires Java 17" means Gradle is running under the wrong JDK. Fix: install JDK 17, set <code>JAVA_HOME</code>, and set Android Studio's Gradle JDK (Settings → Build → Gradle). RN 0.79 needs 17; older RN needed 11.</p>

<h3>2. Gradle vs AGP mismatch</h3>
<p>"Minimum supported Gradle version is 8.7" after bumping AGP — bump the wrapper too. They move together; never one alone.</p>

<h3>3. Stale build cache</h3>
<p>Ghost errors that survive code changes: run <code>./gradlew clean</code>, and if still broken, delete <code>~/.gradle/caches/</code> and the module <code>build/</code> folders. In RN also clear Metro (<code>npx react-native start --reset-cache</code>).</p>

<h3>4. compileSdk lower than a library needs</h3>
<p>"Dependency X requires compileSdkVersion 35 or higher." A library was compiled against a newer SDK than yours. Raise <code>compileSdkVersion</code> (safe — it only affects compilation, not min supported device).</p>

<h3>5. minSdk too low for a dependency</h3>
<p>"uses-sdk:minSdkVersion 21 cannot be smaller than version 24 declared in library." A dependency's floor is higher than yours; raise <code>minSdkVersion</code> or drop the library.</p>

<h3>6. targetSdk and the Play Store deadline</h3>
<p>Play rejects new uploads whose <code>targetSdkVersion</code> is below the yearly floor. Raising it can change runtime behavior (permissions, background limits, storage) — test after bumping, don't just change the number.</p>

<h3>7. Duplicate class / "More than one file with OS-independent path"</h3>
<p>Two libraries ship the same class or <code>.so</code>. Resolve with <code>packagingOptions { pickFirst "..." }</code> or exclude a transitive dependency.</p>

<h3>8. Out-of-memory during build</h3>
<p>"Java heap space" or the daemon dies: raise <code>org.gradle.jvmargs=-Xmx4096m</code> in <code>gradle.properties</code>. R8 and Kotlin compilation are memory-hungry.</p>

<h3>9. NDK version not installed</h3>
<p>"NDK not configured / version X not found." The pinned <code>ndkVersion</code> must be installed via SDK Manager. RN/Hermes/JSI need it; mismatches cause C++ link errors.</p>

<h3>10. Autolinking didn't pick up a new library</h3>
<p>Added a native package but it's "not found" at runtime — rebuild (JS reload isn't enough), and check <code>npx react-native config</code> lists it. For Expo, re-run <code>expo prebuild</code>.</p>

<h3>11. Jetifier slowness / AndroidX conflicts</h3>
<p><code>android.enableJetifier=true</code> rewrites old support-library deps to AndroidX at build time — slow and legacy. Modern deps are all AndroidX; turn it off if nothing needs it.</p>

<h3>12. Release crashes only after minify</h3>
<p>Works in debug, crashes in release = R8 stripped a class reflected at runtime. Add keep rules to <code>proguard-rules.pro</code>. Read the mapping file / deobfuscate the stack trace.</p>

<h3>13. Signing config missing on CI</h3>
<p>Release build fails on CI because keystore properties live in your local <code>~/.gradle/gradle.properties</code>. Inject them as CI secrets / env vars.</p>

<h3>14. Configuration-phase work slows every build</h3>
<p>Doing real work (network calls, file reads) at the top level of <code>build.gradle</code> runs on <em>every</em> invocation, even <code>./gradlew tasks</code>. Put work inside tasks; enable <code>org.gradle.configureondemand</code> where safe.</p>

<h3>15. Gradle daemon corruption</h3>
<p>Weird intermittent failures: <code>./gradlew --stop</code> kills stale daemons; then rebuild.</p>

<h3>16. Manifest merger conflicts</h3>
<p>Two libraries declare conflicting <code>&lt;uses-permission&gt;</code> or attributes. The merged manifest fails; use <code>tools:replace</code> / <code>tools:remove</code> in <code>AndroidManifest.xml</code>.</p>

<h3>17. Editing android/ in an Expo app</h3>
<p>Hand-edits to <code>android/</code> survive until the next <code>expo prebuild --clean</code>, which regenerates the folder and silently discards them. Move changes into a config plugin or <code>expo-build-properties</code>.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — running system gradle instead of ./gradlew</h3>
<p>Typing <code>gradle assembleDebug</code> uses whatever version Homebrew installed, not the pinned one. Always <code>./gradlew</code>. The wrapper exists precisely to avoid version drift.</p>

<h3>Anti-pattern 2 — bumping AGP without bumping Gradle (or the JDK)</h3>
<p>Change one leg of the AGP↔Gradle↔JDK triangle and the build breaks. Move all three together, checking the compatibility matrix.</p>

<h3>Anti-pattern 3 — hardcoding SDK versions in each module</h3>
<p>Copy-pasting <code>compileSdk 35</code> into every module drifts over time. Centralize in the root <code>ext</code> block and read <code>rootProject.ext.compileSdkVersion</code>.</p>

<h3>Anti-pattern 4 — using api everywhere instead of implementation</h3>
<p><code>api</code> leaks a dependency to every consumer and forces recompilation of the whole graph on change. Default to <code>implementation</code>; use <code>api</code> only when you deliberately re-export a type.</p>

<h3>Anti-pattern 5 — committing keystore passwords in build.gradle</h3>
<p>Never inline <code>storePassword "hunter2"</code>. Read from <code>~/.gradle/gradle.properties</code> or env vars, keep the keystore out of git.</p>

<h3>Anti-pattern 6 — shipping a single-ABI or debug-signed release</h3>
<p>An <code>abiFilters "arm64-v8a"</code> release excludes 32-bit devices; a debug-signed APK can't go to Play. Build a proper <code>bundleRelease</code> AAB with the release signing config.</p>

<h3>Anti-pattern 7 — disabling minify to "fix" a release crash</h3>
<p>Turning off <code>minifyEnabled</code> hides an R8 keep-rule problem and bloats the app. Fix the keep rules in <code>proguard-rules.pro</code> instead.</p>

<h3>Anti-pattern 8 — hand-editing android/ in an Expo project</h3>
<p>Edits vanish on the next prebuild. Author a config plugin or use <code>expo-build-properties</code>. This is the single most common Expo gotcha.</p>

<h3>Anti-pattern 9 — cranking targetSdk without testing</h3>
<p>Raising <code>targetSdkVersion</code> opts you into new OS behaviors (scoped storage, notification permission, background limits). Bump deliberately and QA, don't chase the number blindly.</p>

<h3>Anti-pattern 10 — deleting the wrapper files from git</h3>
<p>Removing <code>gradle-wrapper.jar</code>/<code>gradlew</code> from version control breaks reproducible builds and CI. They belong in the repo.</p>

<h3>Anti-pattern 11 — heavy work in the configuration phase</h3>
<p>Network/file/git calls at script top level slow every single Gradle invocation. Wrap them in tasks with declared inputs/outputs so they cache and skip.</p>

<h3>Anti-pattern 12 — enableJetifier left on forever</h3>
<p>Jetifier rewrites every dependency at build time. If no support-library dep remains, it's pure slowdown — turn it off.</p>

<h3>Anti-pattern 13 — ignoring the 16 KB page-size requirement</h3>
<p>Shipping native <code>.so</code> libs that aren't 16 KB-aligned will fail on Android 15+ devices and, past the Play deadline, be rejected. See the next section — it bit <code>sw-ticketing</code> directly.</p>

<div class="callout danger">
  <div class="callout-title">🐛 The 16 KB page-size requirement (a real build constraint)</div>
  <p>Historically Android used a <strong>4 KB memory page size</strong>. Android 15+ devices (and Play Store policy, enforced from Nov 2025) require apps to support a <strong>16 KB page size</strong>, meaning every bundled native library (<code>.so</code>) must be aligned to a 16 KB ELF segment boundary. RN 0.76-era prebuilt native libraries (React Native core, Hermes, and many third-party <code>.so</code>s) were compiled 4 KB-aligned and <strong>could not simply be re-aligned</strong> — the fix required rebuilding those prebuilts with an NDK/AGP that emits 16 KB-aligned segments (NDK r27+, AGP 8.5.1+). This is why <code>sw-ticketing</code> was <strong>upgraded in place to Expo 53 / RN 0.79</strong> rather than patched on RN 0.76: the older prebuilts couldn't be made 16 KB-compliant. Practically you also set <code>packagingOptions { jniLibs { useLegacyPackaging false } }</code> so <code>.so</code>s are stored uncompressed and page-aligned in the APK/AAB. Verify with <code>zipalign -c -P 16 -v 4 app.apk</code> or check segment alignment on each <code>.so</code>.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. What is Gradle and why does Android use it?</div>
  <div class="qa-answer">
    <p>Gradle is a JVM-based, general-purpose build automation tool that models a build as a directed acyclic graph of tasks with declared inputs and outputs, enabling incremental builds and output caching. Android adopted it as its official build system, driven by the Android Gradle Plugin. For RN it orchestrates Codegen, Kotlin/Java compilation, NDK/CMake C++ builds, resource/manifest merging, JS bundling with Hermes, R8 shrinking, and signing/packaging into APK/AAB — all as one task graph.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. What is the Gradle Wrapper and why prefer it over a locally installed Gradle?</div>
  <div class="qa-answer">
    <p>The wrapper is a committed launcher (<code>gradlew</code> + <code>gradle-wrapper.jar</code> + <code>gradle-wrapper.properties</code>) that reads <code>distributionUrl</code> to download and run an exact pinned Gradle version. So every developer and CI machine builds with the identical Gradle regardless of what's installed globally — reproducible builds, no "install Gradle" onboarding step, and CI needs only a JDK. You always run <code>./gradlew</code>, never <code>gradle</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Difference between Gradle and the Android Gradle Plugin (AGP)?</div>
  <div class="qa-answer">
    <p>Gradle is the generic engine; AGP is the plugin that teaches Gradle how to build Android — it adds the <code>android {}</code> DSL, R8/D8, aapt2, manifest merging, variants, and the APK/AAB pipeline. They are versioned on separate lines with their own compatibility rules: you read the Gradle version from <code>gradle-wrapper.properties</code> and the AGP version from the root <code>build.gradle</code> classpath. They are not the same number.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Explain the AGP ↔ Gradle ↔ JDK compatibility triangle.</div>
  <div class="qa-answer">
    <p>Each AGP version requires a minimum Gradle version and a specific JDK range. RN 0.79 / Expo 53 sits on AGP 8.6-ish + Gradle 8.7+ + JDK 17; older RN used JDK 11. If any pair disagrees the build fails before compiling your code — "requires Java 17", "Minimum supported Gradle version is 8.7". You bump all three together, never one alone, and pin the Gradle JDK in Android Studio.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Contrast compileSdk, minSdk, and targetSdk.</div>
  <div class="qa-answer">
    <p><strong>compileSdkVersion</strong> is the API level you compile against — which APIs you can call. <strong>minSdkVersion</strong> is the oldest Android version the app installs on (lower = more devices, but you must guard newer APIs). <strong>targetSdkVersion</strong> is the level you tested against; it tells the OS which runtime behaviors to apply, and Play forces it upward yearly. Rule of thumb: compileSdk = latest, targetSdk = latest tested, minSdk = as low as your users need.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. What is autolinking and where is it wired in Gradle?</div>
  <div class="qa-answer">
    <p>Since RN 0.60, autolinking scans <code>node_modules</code> (via <code>npx react-native config</code>) for packages that declare Android native code and automatically includes them as modules and dependencies — no manual <code>settings.gradle</code> or Xcode editing. It's wired via the <code>com.facebook.react.settings</code> plugin in <code>settings.gradle</code> (older RN used <code>apply from: native_modules.gradle</code>) and <code>autolinkLibrariesWithApp()</code> in the app's <code>react {}</code> block. Installing a native lib plus a rebuild is all it takes.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Difference between implementation and api dependency configurations?</div>
  <div class="qa-answer">
    <p><code>implementation</code> puts a dependency on your compile + runtime classpath but does NOT expose it to modules that depend on you, so a change only recompiles you — faster builds. <code>api</code> also re-exports it transitively to consumers, which is occasionally needed but forces wider recompilation. Default to <code>implementation</code>; reach for <code>api</code> only when you deliberately expose a library's types in your public API. Related: <code>compileOnly</code>, <code>runtimeOnly</code>, and variant-scoped <code>debugImplementation</code> / <code>testImplementation</code> / <code>androidTestImplementation</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Groovy DSL vs Kotlin DSL for build scripts?</div>
  <div class="qa-answer">
    <p><code>.gradle</code> files are Groovy — dynamic, terse, the RN/Expo default. <code>.gradle.kts</code> files are Kotlin — statically typed with better IDE autocompletion and compile-time errors, at the cost of slower script compilation and stricter syntax (double quotes, explicit <code>=</code> assignment). Both express the same DSL; teams pick Kotlin DSL mainly for tooling/refactoring safety.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. What do assembleRelease, bundleRelease, and installDebug produce?</div>
  <div class="qa-answer">
    <p><code>assembleRelease</code> builds a signed release <strong>APK</strong> (a directly installable file). <code>bundleRelease</code> builds an <strong>AAB</strong> (Android App Bundle) — the upload format for the Play Store, from which Google generates per-device APKs. <code>installDebug</code> builds and installs the debug APK onto a connected device/emulator. For Play you upload the AAB; for a shared test build you hand out the APK.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. What is R8 and how does it relate to release crashes?</div>
  <div class="qa-answer">
    <p>R8 is Android's code shrinker/optimizer/obfuscator (successor to ProGuard), run when <code>minifyEnabled true</code>. It removes unused classes/methods and renames symbols to shrink the app. The classic bug: something accessed via reflection at runtime gets stripped or renamed, so the app works in debug but crashes only in release. Fix by adding keep rules in <code>proguard-rules.pro</code> and deobfuscating the stack trace with the mapping file — never by disabling minify.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. What do newArchEnabled and hermesEnabled control, and where are they set?</div>
  <div class="qa-answer">
    <p>Both are flags in <code>gradle.properties</code>. <code>newArchEnabled</code> turns on the New Architecture (Fabric + TurboModules + Codegen + bridgeless), which triggers Codegen tasks and a full native rebuild. <code>hermesEnabled</code> selects the Hermes JS engine over JSC. <code>sw-mobile</code> runs old arch (Paper) with Hermes: <code>newArchEnabled=false</code>, <code>hermesEnabled=true</code>. In Expo these are set in <code>app.json</code>, not by hand-editing <code>gradle.properties</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Your teammate's build works and yours fails with "Unsupported class file major version." What's wrong?</div>
  <div class="qa-answer">
    <p>A JDK mismatch — Gradle is running under the wrong Java version for your AGP. Check <code>./gradlew --version</code> and <code>java -version</code>, install the required JDK (17 for RN 0.79), set <code>JAVA_HOME</code>, and set Android Studio's Gradle JDK. If it persists, kill stale daemons with <code>./gradlew --stop</code> and clean.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Explain the 16 KB page-size requirement and why RN 0.76-era apps couldn't just re-align.</div>
  <div class="qa-answer">
    <p>Android 15+ (and Play policy from Nov 2025) requires apps to support a 16 KB memory page size, so every bundled native <code>.so</code> must be aligned to 16 KB ELF segment boundaries instead of the historical 4 KB. RN 0.76-era prebuilt libraries (RN core, Hermes, third-party) were compiled 4 KB-aligned and couldn't be re-aligned in place — they had to be rebuilt with NDK r27+/AGP 8.5.1+ that emit 16 KB segments. That's why <code>sw-ticketing</code> was upgraded to Expo 53 / RN 0.79 rather than patched. You also set <code>jniLibs { useLegacyPackaging false }</code> and verify with <code>zipalign -P 16</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. How does Gradle make builds fast?</div>
  <div class="qa-answer">
    <p>Three mechanisms: <strong>incremental builds</strong> (tasks with unchanged inputs are marked UP-TO-DATE and skipped), the <strong>build cache</strong> (<code>org.gradle.caching=true</code> — task outputs keyed by an input hash, reusable even on a fresh checkout), and <strong>parallel execution</strong> (<code>org.gradle.parallel=true</code> builds independent modules concurrently) plus the long-lived <strong>Gradle daemon</strong>. Keeping real work inside tasks (not the configuration phase) is what lets these kick in.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. How do you set SDK versions in an Expo prebuild app without them being wiped?</div>
  <div class="qa-answer">
    <p>You don't edit <code>android/build.gradle</code> — <code>expo prebuild</code> regenerates the folder and discards hand-edits. Instead you configure the <code>expo-build-properties</code> config plugin in <code>app.json</code> (<code>compileSdkVersion</code>, <code>targetSdkVersion</code>, <code>minSdkVersion</code>, <code>ndkVersion</code>, <code>buildToolsVersion</code>, <code>enableProguardInReleaseBuilds</code>), and prebuild writes those into the native files. Anything more custom goes in a config plugin. This is the core Expo Continuous Native Generation model.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You distinguish Gradle (engine) from AGP (Android plugin) and know they're versioned separately.</li>
    <li>You always run <code>./gradlew</code> and can explain why the wrapper beats a local install.</li>
    <li>You can recite the AGP↔Gradle↔JDK triangle and diagnose a JDK mismatch.</li>
    <li>You correctly contrast compileSdk / minSdk / targetSdk.</li>
    <li>You explain autolinking and where it's wired in <code>settings.gradle</code>.</li>
    <li>You know <code>implementation</code> vs <code>api</code> and the variant/test configurations.</li>
    <li>You can name the common <code>./gradlew</code> tasks and what APK vs AAB means.</li>
    <li>You understand R8/minify release crashes and keep rules.</li>
    <li>You can explain the 16 KB page-size constraint and the <code>sw-ticketing</code> upgrade rationale.</li>
    <li>You know Expo prebuild regenerates <code>android/</code> and that <code>expo-build-properties</code> is where SDK values belong.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q16. Beyond implementation and api, which dependency configurations should you know, and what is the difference between kapt and ksp?</div>
  <div class="qa-answer">
    <p><code>compileOnly</code> is on the compile classpath but not packaged (annotations, provided libs); <code>runtimeOnly</code> is packaged but not visible at compile time. <code>debugImplementation</code>/<code>releaseImplementation</code> are variant-scoped (e.g. a debug-only tool). <code>testImplementation</code> is for local JVM unit tests (JUnit) and <code>androidTestImplementation</code> for instrumented device/emulator tests (Espresso). For annotation processors, Java uses <code>annotationProcessor</code>; Kotlin uses <code>kapt</code>, which is slow, or the newer, faster <code>ksp</code> (Kotlin Symbol Processing).</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q17. Which ./gradlew tasks and flags do you use day to day?</div>
  <div class="qa-answer">
    <p><code>assembleDebug</code>/<code>assembleRelease</code> build APKs, <code>bundleRelease</code> builds the AAB for Play, <code>installDebug</code> builds and installs on a connected device, and <code>clean</code> wipes build output. For diagnosis: <code>app:dependencies</code> prints the full dependency tree to resolve conflicts, <code>signingReport</code> prints keystore SHA-1/SHA-256 for Firebase/Maps, and <code>tasks</code> lists what's available. Useful flags are <code>--stacktrace</code> and <code>--info</code> for detail on a failure, and <code>-x lint</code> to exclude the lint task.</p>
  </div>
</div>
` },

  ]
});
