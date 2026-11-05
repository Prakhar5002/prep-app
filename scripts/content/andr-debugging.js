window.PREP_SITE.registerTopic({
  id: "andr-debugging",
  module: "Android Native (Deep)",
  title: "Debugging Native Android Errors",
  estimatedReadTime: "26 min",
  tags: ["debugging","logcat","stacktrace","crash","classcastexception","unsatisfiedlinkerror","noclassdeffounderror","anr","oom","r8","proguard","manifest-merger","gradle","duplicate-class","install-failed","16kb-page-size","soloader","hermes","mapping-txt","retrace","adb","dumpsys","bugreport","crashlytics","sentry","expo","react-native","android"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Classify the failure as <strong>build / install / runtime</strong> first, then read the <code>Caused by:</code> chain <strong>bottom-up</strong> to the root cause and the first frame in <em>your</em> package, map the exception type to a known category, fix it, and <strong>clean rebuild</strong> to confirm.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Three failure classes:</strong> build-time (Gradle/R8/codegen/manifest, seen in the terminal — <code>Execution failed for task</code>), install-time (<code>INSTALL_FAILED_*</code> from <code>adb install</code>/Play), runtime (<code>FATAL EXCEPTION</code> in logcat, or a native SIGSEGV tombstone).</li>
    <li><strong>Read a stack trace bottom-up:</strong> the deepest <code>Caused by:</code> is the root cause; inside a block the top <code>at</code> is where it threw; skip <code>com.facebook.react.*</code>/<code>android.*</code> and find the first frame in your package or a named library. Note the <strong>thread name</strong> (main = UI).</li>
    <li><strong>Capture cleanly:</strong> <code>adb logcat -c</code> then reproduce; <code>adb logcat -b crash -d</code>, <code>--pid=$(adb shell pidof -s pkg)</code>, <code>*:E</code>. Build detail: <code>./gradlew task --stacktrace --info</code>, <code>:app:dependencies</code>, <code>./gradlew clean</code>.</li>
    <li><strong><code>ClassCastException</code>:</strong> object cast to wrong type; classic old-arch <code>getConstants()</code> mis-cast. Real case: jail-monkey 3.0.0 <code>rootedDetectionMethods()</code> → launch crash on old arch; fix = patch/drop the constant.</li>
    <li><strong><code>UnsatisfiedLinkError</code> / couldn't find libX.so:</strong> ABI mismatch (arm64 vs x86 emulator), missing/stale <code>.so</code>, Hermes toggle without rebuild, SoLoader init. Check <code>abiFilters</code>/<code>splits</code>, clean rebuild.</li>
    <li><strong><code>NoClassDefFoundError</code>/<code>ClassNotFoundException</code>:</strong> R8 stripped a reflection-referenced class (release-only) → add <code>-keep</code> in <code>proguard-rules.pro</code>; or multidex below minSdk 21.</li>
    <li><strong><code>Duplicate class</code>:</strong> version conflict; read <code>:app:dependencies</code>, then <code>resolutionStrategy.force</code> or <code>exclude</code> the transitive.</li>
    <li><strong>Manifest merger failed:</strong> conflicting <code>android:exported</code>/<code>allowBackup</code>/permissions; use <code>tools:replace</code> / <code>tools:node="remove"</code>; <code>exported</code> must be explicit on Android 12+. Read <code>manifest-merger-*-report.txt</code>.</li>
    <li><strong>Gradle <code>Execution failed for task</code>:</strong> the task name is the clue (<code>minifyReleaseWithR8</code>, <code>processDebugManifest</code>); <code>--stacktrace</code>/<code>--info</code>; watch JDK 17 / AGP / Gradle version match; clean caches.</li>
    <li><strong>OOM:</strong> build-time → <code>org.gradle.jvmargs=-Xmx4096m</code>; runtime → bitmaps/leak, resize + Fresco/Glide, <code>largeHeap</code> only as a smell-stopgap.</li>
    <li><strong>ANR:</strong> main thread blocked ~5s; pull <code>/data/anr/traces.txt</code>, <code>dumpsys activity</code>; move heavy/sync work off the UI thread.</li>
    <li><strong><code>INSTALL_FAILED_*</code>:</strong> UPDATE_INCOMPATIBLE (signature mismatch → uninstall), VERSION_DOWNGRADE (bump versionCode), INSUFFICIENT_STORAGE, NO_MATCHING_ABIS.</li>
    <li><strong>16 KB page size (Android 15/Play):</strong> old 4 KB-aligned prebuilt <code>.so</code> won't load / gets rejected; fix = toolchain upgrade (NDK r27+/AGP/RN). Real case: RN 0.76 prebuilts couldn't align → upgraded to Expo 53 / RN 0.79.</li>
    <li><strong>Obfuscated release crashes:</strong> R8 <code>mapping.txt</code> in <code>build/outputs/mapping/release/</code>; <code>retrace</code> or auto-deobfuscate via Crashlytics/Sentry; archive mapping per versionCode.</li>
    <li><strong>Tools:</strong> logcat filtering, Android Studio debugger + Kotlin breakpoints, <code>adb shell dumpsys</code>, <code>adb bugreport</code>, <code>ndk-stack</code> for native SIGSEGV, Hermes debugging, React Native DevTools (Flipper deprecated), Crashlytics/Sentry with native symbols + mapping upload.</li>
    <li><strong>Expo:</strong> <code>expo-doctor</code>, EAS Build logs, <code>npx expo prebuild --clean</code> to reset native state (wipes hand edits — use config plugins / <code>expo-build-properties</code>), gradle cache clears, symbolicate EAS release crashes with uploaded symbols/mapping.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Fixating on the top line of the stack trace</strong> — it's usually a generic <code>RuntimeException</code>/<code>Handler</code> from RN's module system, not your bug. The real cause is the <strong>last</strong> <code>Caused by:</code>, and the actionable frame is the first one in your package or a named library. Second trap: chasing a <strong>release-only</strong> crash in debug — R8 is off there, so the bug vanishes; reproduce with a release build and add a keep rule.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"I classify it first — build, install, or runtime — because the tools and fix location are completely different. Then for a runtime crash I read the <code>Caused by:</code> chain bottom-up and find the first frame in my own package."</div>
  <div class="revision-say">"Release-only crashes are almost always R8 stripping a reflection-referenced class — I add a <code>-keep</code> rule and I always archive <code>mapping.txt</code> so production stacks deobfuscate."</div>
  <div class="revision-say">"The jail-monkey launch crash was a <code>ClassCastException</code> in the old-arch <code>getConstants()</code> — I patched out the bad constant. And the 16 KB page-size issue isn't a flag, it's a toolchain upgrade — we moved sw-ticketing to Expo 53 / RN 0.79."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>Why native errors feel harder than JS errors</h3>
<p>In JS, a red screen / Metro overlay gives you a symbolicated stack trace pointing straight at your source line. Native Android failures are different: they surface as Java/Kotlin exceptions in <strong>logcat</strong>, as Gradle task failures in the <strong>build log</strong>, or as install refusals from the package manager. The JS stack trace does not reach them, and Metro cannot symbolicate them. You have to go one layer down — to the tools the Android platform itself uses.</p>

<h3>The three failure classes (learn to classify instantly)</h3>
<table>
  <thead><tr><th>Class</th><th>When it happens</th><th>Where you see it</th><th>Typical signatures</th></tr></thead>
  <tbody>
    <tr><td><strong>Build-time</strong></td><td>During <code>./gradlew assembleDebug</code> / <code>bundleRelease</code>, codegen, R8, manifest merge</td><td>Terminal / CI log</td><td><code>Execution failed for task</code>, <code>Duplicate class</code>, <code>Manifest merger failed</code></td></tr>
    <tr><td><strong>Install-time</strong></td><td>APK/AAB exists but won't install</td><td><code>adb install</code> output, Play Console</td><td><code>INSTALL_FAILED_UPDATE_INCOMPATIBLE</code>, signature mismatch, 16 KB alignment</td></tr>
    <tr><td><strong>Runtime</strong></td><td>App running on device</td><td>logcat (<code>FATAL EXCEPTION</code>) / native tombstone</td><td><code>ClassCastException</code>, <code>UnsatisfiedLinkError</code>, ANR, SIGSEGV</td></tr>
  </tbody>
</table>
<p>Why this matters: the tools differ completely. A build failure is fixed in <code>build.gradle</code> / <code>gradle.properties</code> / the manifest and re-running Gradle; a runtime crash is fixed by reading logcat and touching native or JS code; an install failure is often just <code>adb uninstall</code> away. Guessing the wrong class wastes hours.</p>

<h3>Why RN adds its own failure modes</h3>
<ul>
  <li><strong>Two architectures</strong>: old (Paper / Bridge) modules implement <code>getConstants()</code> and are cast to a specific type; new arch (Fabric / TurboModules / JSI / Codegen) generates C++ and Kotlin bindings. A library that assumes one and runs on the other throws at launch (see the <code>rn-architecture</code> topic for the full model).</li>
  <li><strong>Native <code>.so</code> libraries</strong>: Hermes, JSC, SoLoader, Reanimated, and many community libs ship compiled C++ per ABI. Mismatches produce <code>UnsatisfiedLinkError</code>.</li>
  <li><strong>R8 / ProGuard</strong> in release strips and renames classes — reflection-based libs break in release but not debug, and the crash stack is obfuscated.</li>
  <li><strong>Autolinking + transitive deps</strong> mean two libraries can pull conflicting versions of the same AndroidX/Kotlin artifact → <code>Duplicate class</code> or a runtime <code>NoSuchMethodError</code>.</li>
</ul>

<h3>Why a disciplined method beats intuition</h3>
<p>Native errors are noisy — a single crash can print 200 lines. Without a method you fixate on the top frame (usually framework code, not your bug) or on a scary-looking but irrelevant warning. The bottom-up <code>Caused by:</code> read plus the build/install/runtime triage is what turns a wall of red text into a one-line category and a known fix.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>How to read a Java/Kotlin stack trace</h3>
<p>A native crash in logcat has a fixed shape. The exception <em>type</em> and message are at the top; the <code>at</code> frames below it are the call stack (most recent call first, i.e. top = where it threw); and one or more <code>Caused by:</code> blocks chain the wrapped root cause underneath. You read the <strong>chain</strong> bottom-up but each individual block top-down.</p>
<div class="diagram">
<pre>
 --------- logcat (a single FATAL EXCEPTION block) -------------

 E AndroidRuntime: FATAL EXCEPTION: main            &lt;- thread name (UI thread!)
 E AndroidRuntime: Process: com.smartworks.mobile, PID: 12934
 E AndroidRuntime: java.lang.RuntimeException: ...  &lt;- outermost (wrapper)
 E AndroidRuntime:   at com.facebook.react...       &lt;- framework frame
 E AndroidRuntime:   at android.os.Handler...       &lt;- framework frame
 E AndroidRuntime: Caused by: java.lang.ClassCastException: ...   &lt;- READ THIS
 E AndroidRuntime:   at com.reactnativejailmonkey.JailMonkeyModule.getConstants
 E AndroidRuntime:   at com.facebook.react.bridge.ModuleHolder...
 E AndroidRuntime: Caused by: ...                    &lt;- even deeper? go lower

           read the CHAIN bottom-up:  the LAST "Caused by" is the root
           inside a block, the TOP "at" is where it actually threw
           find the FIRST frame in YOUR package / a named library
</pre>
</div>

<h3>The triage flowchart</h3>
<div class="diagram">
<pre>
  a failure happened
        |
        v
  where did it appear?
   |            |               |
 terminal    adb install     on device
 (Gradle)    output          (logcat)
   |            |               |
 BUILD-TIME  INSTALL-TIME    RUNTIME
   |            |               |
   v            v               v
 read the     read the        adb logcat -v time *:E
 failing      INSTALL_FAILED_ grab the FATAL EXCEPTION block
 task +       reason code           |
 --stacktrace       |               v
   |            uninstall?    find last "Caused by:" (root)
   v            storage?            |
 map task     re-sign?              v
 (R8 / merge  align?         first frame in your pkg / lib
 / codegen /       |               |
 dep conflict)     v               v
   |          fix + reinstall  map exception TYPE to category
   v                            (see Mechanics catalogue)
 fix config                          |
   |                                 v
   +-------------> CLEAN REBUILD <----+
                 ./gradlew clean, then confirm fix
</pre>
</div>

<h3>Frames: yours vs the framework's</h3>
<p>In any block, most <code>at</code> frames are <code>com.facebook.react.*</code>, <code>android.*</code>, <code>java.*</code>, <code>kotlin.*</code> — the platform and RN runtime. Those tell you the <em>machinery</em> that was running, not your bug. Scan downward for the first frame that names <strong>your application package</strong> (e.g. <code>com.smartworks.mobile.*</code>) or a <strong>named third-party module</strong> (e.g. <code>com.reactnativejailmonkey.*</code>). That is almost always the culprit or the library at fault.</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"The top line of the stack trace is my bug." Usually it is not — the top of the outer exception is a generic <code>RuntimeException</code> from RN's module system or a <code>Handler</code>. The actual cause is in the deepest <code>Caused by:</code>, and the actionable frame is the first one in your package or a named library. Always scroll to the bottom of the chain first.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>Step 0 — Capture the evidence cleanly</h3>
<p>Never debug from a screenshot of a truncated toast. Get the full log:</p>
<pre><code class="language-bash"># clear the buffer, reproduce the crash, then read
adb logcat -c
# ... reproduce the crash on the device ...
adb logcat -d -v time > crash.txt      # dump everything with timestamps

# live, errors + fatals only:
adb logcat *:E

# filter to one process by name (Android 7+):
adb logcat --pid=$(adb shell pidof -s com.smartworks.mobile)

# just the crash buffer (Android keeps a dedicated crash log):
adb logcat -b crash -d</code></pre>
<p>For build failures, re-run the exact Gradle task with more detail:</p>
<pre><code class="language-bash">cd android
./gradlew assembleDebug --stacktrace          # Java stack of the Gradle failure
./gradlew assembleDebug --info                 # verbose task-by-task
./gradlew assembleDebug --scan                 # shareable build report
./gradlew :app:dependencies                    # full dependency tree
./gradlew clean                                # nuke build/ outputs</code></pre>

<h3>Step 1 — Classify: build vs install vs runtime</h3>
<ul>
  <li>Message contains <code>Execution failed for task ':app:...'</code>, <code>Duplicate class</code>, <code>Manifest merger failed</code>, <code>Could not resolve</code> → <strong>build-time</strong>.</li>
  <li>Message from <code>adb install</code> starts with <code>Failure [INSTALL_FAILED_...]</code> or <code>adb: failed to install</code> → <strong>install-time</strong>.</li>
  <li>You see <code>FATAL EXCEPTION</code> in logcat, or the app dies with a native tombstone (<code>signal 11 (SIGSEGV)</code>) → <strong>runtime</strong>.</li>
</ul>

<h3>Step 2 — Find the root cause</h3>
<p>For runtime: locate <code>FATAL EXCEPTION</code>, jump to the <strong>last</strong> <code>Caused by:</code>, note the exception type + message, then the first frame in your package. For build: read the <em>failing task name</em> — it names the phase (<code>:app:mergeDebugResources</code>, <code>:app:checkDebugAarMetadata</code>, <code>:app:minifyReleaseWithR8</code>, <code>:app:processDebugManifest</code>).</p>

<hr>

<h3><code>java.lang.ClassCastException</code></h3>
<p><strong>Cause:</strong> code cast an object to a type it is not. In RN old-arch modules this classically happens inside <code>getConstants()</code> when a value's runtime type does not match what the bridge expects. <strong>Real case (your fleet):</strong> <code>jail-monkey</code> 3.0.0's <code>rootedDetectionMethods()</code> returned a type that the old-architecture (Paper) <code>getConstants()</code> then cast wrongly, throwing a <code>ClassCastException</code> at launch on a Samsung S25 — an instant startup crash, not a slow-burn bug.</p>
<pre><code class="language-text">Caused by: java.lang.ClassCastException: java.lang.Boolean cannot be cast to ...
  at com.reactnativejailmonkey.JailMonkeyModule.getConstants(JailMonkeyModule.java)
  at com.facebook.react.bridge.ModuleHolder.create(ModuleHolder.java)</code></pre>
<p><strong>Fix:</strong> drop / patch the offending constant. Use <code>patch-package</code> to remove that key from the returned map so the bad cast never happens:</p>
<pre><code class="language-bash">npx patch-package jail-monkey      # after editing node_modules/jail-monkey</code></pre>
<p>General fix: identify the mis-cast value, guard the type, or upgrade/patch the library. Note it reproduced only on old arch — RootBeer-native and ProGuard theories were both disproven; the constant itself was the cause.</p>

<h3><code>UnsatisfiedLinkError</code> / <code>couldn't find "libX.so"</code></h3>
<p><strong>Cause:</strong> the JVM tried to load a native <code>.so</code> that is missing for the device's ABI, wasn't packaged, or failed to link (SoLoader can't find it). Common with Hermes, Reanimated, or any lib shipping C++.</p>
<pre><code class="language-text">java.lang.UnsatisfiedLinkError: dlopen failed: library "libhermes.so" not found
  at com.facebook.soloader.SoLoader.loadLibrary(SoLoader.java)</code></pre>
<p><strong>Fixes:</strong></p>
<ul>
  <li><strong>ABI mismatch</strong>: you built for <code>arm64-v8a</code> only but ran on an x86 emulator (or vice-versa). Check <code>ndk { abiFilters }</code> and <code>splits { abi }</code> in <code>app/build.gradle</code>; build a universal APK or the right ABI.</li>
  <li><strong>Stale build</strong>: <code>./gradlew clean</code>, delete <code>android/app/build</code>, rebuild — a partial build can drop a <code>.so</code>.</li>
  <li><strong>Hermes toggle mismatch</strong>: <code>hermesEnabled</code> in <code>gradle.properties</code> flipped but not rebuilt → <code>libhermes.so</code> absent. Rebuild after changing the JS engine.</li>
  <li><strong>SoLoader init</strong>: ensure <code>SoLoader.init(this, false)</code> runs in <code>Application.onCreate</code> (RN template does this).</li>
</ul>

<h3><code>NoClassDefFoundError</code> / <code>ClassNotFoundException</code></h3>
<p><strong>Cause (release only, usually):</strong> R8/ProGuard stripped or renamed a class that is referenced by <strong>reflection</strong> (so R8 couldn't see the reference and considered it dead). Also occurs with <strong>multidex</strong> problems on old minSdk / large apps.</p>
<pre><code class="language-text">java.lang.ClassNotFoundException: Didn't find class "com.somelib.Thing"
  at java.lang.Class.classForName(Native Method)</code></pre>
<p><strong>Fix:</strong> add a keep rule in <code>android/app/proguard-rules.pro</code>:</p>
<pre><code class="language-text">-keep class com.somelib.** { *; }
-keepnames class com.somelib.Thing
# keep annotated / reflection-accessed members generally:
-keepclassmembers class * { @com.somelib.Keep *; }</code></pre>
<p>For multidex: set <code>multiDexEnabled true</code> in <code>defaultConfig</code> (needed below minSdk 21; above 21 it's automatic). Verify the crash is release-only to confirm R8 is the cause — if debug works and release crashes, it is almost always minification.</p>

<h3><code>Duplicate class</code> / dependency version conflict</h3>
<p><strong>Cause:</strong> two dependencies pull the same class (often a Kotlin stdlib, AndroidX, or a relocated Guava/OkHttp) at different versions.</p>
<pre><code class="language-text">Duplicate class kotlin.collections.ArraysUtilJVM found in modules
  kotlin-stdlib-1.8.0 and kotlin-stdlib-jdk8-1.6.0</code></pre>
<p><strong>Fixes:</strong> inspect the tree, then force one version or exclude the transitive:</p>
<pre><code class="language-groovy">// android/app/build.gradle
configurations.all {
  resolutionStrategy {
    force "org.jetbrains.kotlin:kotlin-stdlib:1.9.24"
  }
}

dependencies {
  implementation("com.some:lib:2.0") {
    exclude group: "com.google.guava", module: "guava"
  }
}</code></pre>
<pre><code class="language-bash">./gradlew :app:dependencies --configuration releaseRuntimeClasspath   # see who pulls what</code></pre>

<h3>Manifest merger failures</h3>
<p><strong>Cause:</strong> two manifests (your app + a library) declare conflicting attributes — most often <code>android:exported</code>, an <code>android:allowBackup</code> difference, or duplicate permissions/activities. Android 12+ requires <code>android:exported</code> to be explicit on any component with an intent-filter.</p>
<pre><code class="language-text">Manifest merger failed : Attribute application@allowBackup value=(false)
  is also present at [com.lib:x] AndroidManifest.xml value=(true).
  Suggestion: add 'tools:replace="android:allowBackup"' to &lt;application&gt;</code></pre>
<pre><code class="language-xml">&lt;!-- android/app/src/main/AndroidManifest.xml --&gt;
&lt;manifest xmlns:tools="http://schemas.android.com/tools"&gt;
  &lt;application
    android:allowBackup="false"
    tools:replace="android:allowBackup"&gt;
    &lt;activity
      android:name=".MainActivity"
      android:exported="true" /&gt;   &lt;!-- required, must be explicit --&gt;
  &lt;/application&gt;
&lt;/manifest&gt;</code></pre>
<p>Inspect the merged result at <code>android/app/build/outputs/logs/manifest-merger-*-report.txt</code> to see exactly which library injected the conflicting value.</p>

<h3><code>Execution failed for task ':app:...'</code> (generic Gradle)</h3>
<p><strong>Cause:</strong> anything in a Gradle task — compilation, codegen, resource merge, R8, packaging. The <em>task name</em> is the clue.</p>
<ul>
  <li><code>./gradlew &lt;task&gt; --stacktrace</code> — the Java exception behind the failure.</li>
  <li><code>--info</code> / <code>--debug</code> — verbose output to find the real error line.</li>
  <li><strong>JDK / AGP mismatch</strong>: RN 0.79 wants JDK 17; an AGP version needs a matching Gradle version. Check <code>JAVA_HOME</code>, <code>org.gradle.java.home</code>, and <code>distributionUrl</code> in <code>gradle/wrapper/gradle-wrapper.properties</code>.</li>
  <li><strong>Stale caches</strong>: <code>./gradlew clean</code>, delete <code>~/.gradle/caches</code> and <code>android/.gradle</code>, then rebuild.</li>
</ul>

<h3><code>OutOfMemoryError</code> — build heap vs app heap</h3>
<p>Two very different OOMs:</p>
<ul>
  <li><strong>Build-time</strong> (Gradle/Kotlin daemon or R8 runs out of heap): raise the JVM args in <code>android/gradle.properties</code>:
    <pre><code class="language-properties">org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m</code></pre>
  </li>
  <li><strong>Runtime</strong> (<code>java.lang.OutOfMemoryError: Failed to allocate a ... byte allocation</code>): usually huge bitmaps / images decoded at full resolution, or a leak. Resize images before decode, use a proper image lib (Fresco/Glide), and as a stopgap set <code>android:largeHeap="true"</code> on <code>&lt;application&gt;</code> — but treat that as a smell, not a fix.</li>
</ul>

<h3>ANR (Application Not Responding)</h3>
<p><strong>Cause:</strong> the <strong>main (UI) thread</strong> was blocked ~5s (input dispatch) or a broadcast/service exceeded its limit. In RN this means heavy work on the UI thread — a synchronous native module call, a giant JSON parse on the main thread, or a deadlock.</p>
<pre><code class="language-bash"># the system writes an ANR trace:
adb shell dumpsys activity | grep ANR
adb pull /data/anr/traces.txt          # main-thread stacks of all processes
adb shell dumpsys gfxinfo com.smartworks.mobile   # frame timings / jank</code></pre>
<p><strong>Fix:</strong> move blocking work off the main thread (coroutine / background queue / worker thread on native side; keep RN sync TurboModule calls cheap). Read <code>traces.txt</code> — the <code>main</code> thread's top frame shows what it was stuck on.</p>

<h3><code>INSTALL_FAILED_*</code> (install-time)</h3>
<table>
  <thead><tr><th>Code</th><th>Cause</th><th>Fix</th></tr></thead>
  <tbody>
    <tr><td><code>INSTALL_FAILED_UPDATE_INCOMPATIBLE</code></td><td>Installed build was signed with a different key (debug vs release, or two machines)</td><td><code>adb uninstall com.smartworks.mobile</code> then reinstall</td></tr>
    <tr><td><code>INSTALL_FAILED_VERSION_DOWNGRADE</code></td><td>New <code>versionCode</code> is lower than installed</td><td>Bump <code>versionCode</code> or uninstall first</td></tr>
    <tr><td><code>INSTALL_FAILED_INSUFFICIENT_STORAGE</code></td><td>Device / emulator out of space</td><td>Free space, wipe emulator data</td></tr>
    <tr><td><code>INSTALL_FAILED_NO_MATCHING_ABIS</code></td><td>APK has no <code>.so</code> for the device ABI</td><td>Build a matching / universal ABI</td></tr>
  </tbody>
</table>

<h3>16 KB page-size incompatibility (Android 15 / Play)</h3>
<p><strong>Cause:</strong> Android 15 devices can use a 16 KB memory page size (up from 4 KB). Native <code>.so</code> libraries must be 16 KB-aligned; older <strong>prebuilt</strong> libraries aligned to 4 KB fail to load and Play blocks the upload. <strong>Real case (your fleet):</strong> RN 0.76 prebuilts <em>couldn't</em> be 16 KB-aligned, so <code>sw-ticketing</code> was upgraded mainline in-place to <strong>Expo 53 / RN 0.79</strong> (the "expo53 sibling folder" approach was abandoned).</p>
<pre><code class="language-bash"># check alignment of the .so files inside an APK/AAB:
unzip -l app-release.apk | grep '\\.so'
# then per-lib (needs NDK): check LOAD segment alignment is 0x4000 (16 KB)
llvm-readelf -l lib/arm64-v8a/libX.so | grep LOAD</code></pre>
<p><strong>Fix:</strong> upgrade the toolchain — NDK r27+, AGP that packages 16 KB-aligned libs, and RN/Expo versions whose prebuilt <code>.so</code> files are already aligned (RN 0.79 / Expo 53). Libraries with 4 KB-only prebuilts must be updated or replaced.</p>

<h3>R8 / ProGuard obfuscated release crashes → deobfuscate</h3>
<p><strong>Cause:</strong> in release, class/method names are renamed to <code>a.a.b</code>, so the crash stack is unreadable. R8 writes a <code>mapping.txt</code> that reverses it.</p>
<pre><code class="language-bash"># mapping produced here for a release build:
#   android/app/build/outputs/mapping/release/mapping.txt

# turn an obfuscated stack back into real names:
retrace mapping.txt obfuscated-stacktrace.txt
# (retrace ships with the Android SDK / R8; Play &amp; Crashlytics &amp; Sentry
#  can ingest mapping.txt and deobfuscate automatically)</code></pre>
<p>Always archive <code>mapping.txt</code> per release and upload it to your crash reporter, or production stacks are meaningless.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — Reading a real launch-crash trace end to end</h3>
<pre><code class="language-text">FATAL EXCEPTION: main
Process: com.smartworks.mobile, PID: 9931
java.lang.RuntimeException: Unable to instantiate application ...
  at android.app.LoadedApk.makeApplication(LoadedApk.java:1350)
Caused by: com.facebook.react.common.JavascriptException: ...
Caused by: java.lang.ClassCastException: java.lang.Boolean
    cannot be cast to com.facebook.react.bridge.WritableMap
  at com.reactnativejailmonkey.JailMonkeyModule.getConstants(JailMonkeyModule.java:64)
  at com.facebook.react.bridge.ModuleHolder.doInitialize(ModuleHolder.java:250)</code></pre>
<p><strong>Read it:</strong> thread = <code>main</code> (UI). Chain bottom-up → the last <code>Caused by:</code> is <code>ClassCastException</code>. First non-framework frame = <code>JailMonkeyModule.getConstants</code>. Category = old-arch <code>getConstants()</code> mis-cast. Fix = patch the constant. This is the exact jail-monkey 3.0.0 crash.</p>

<h3>Example 2 — UnsatisfiedLinkError on an emulator</h3>
<pre><code class="language-text">java.lang.UnsatisfiedLinkError: couldn't find "libreanimated.so"</code></pre>
<p>You built <code>abiFilters "arm64-v8a"</code> only and launched an <code>x86_64</code> emulator. Fix: add the emulator ABI or use an arm64 emulator; for release keep the ABI splits but test on matching hardware.</p>

<h3>Example 3 — Release-only NoClassDefFoundError</h3>
<p>Debug works, release crashes with <code>ClassNotFoundException: com.acme.reflectedThing</code>. Cause: R8 stripped it (referenced only via reflection). Fix:</p>
<pre><code class="language-text"># android/app/proguard-rules.pro
-keep class com.acme.** { *; }</code></pre>

<h3>Example 4 — Duplicate class from two libs</h3>
<pre><code class="language-groovy">// force one Kotlin stdlib version to end the conflict
configurations.all {
  resolutionStrategy.force "org.jetbrains.kotlin:kotlin-stdlib:1.9.24"
}</code></pre>

<h3>Example 5 — Manifest merger: exported required</h3>
<pre><code class="language-text">Manifest merger failed : android:exported needs to be explicitly specified
for &lt;activity&gt;. Apps targeting Android 12+ are required to specify it.</code></pre>
<pre><code class="language-xml">&lt;activity android:name=".MainActivity" android:exported="true" /&gt;</code></pre>

<h3>Example 6 — Gradle task failure, get the real error</h3>
<pre><code class="language-bash">./gradlew :app:assembleRelease --stacktrace --info 2>&amp;1 | tee build.log
# then search build.log for "FAILED", "error:", "What went wrong"</code></pre>

<h3>Example 7 — JDK mismatch</h3>
<pre><code class="language-text">&gt; Unsupported class file major version 61</code></pre>
<p>A dependency was compiled with a newer JDK than your build JVM. Fix: install/select JDK 17, set <code>JAVA_HOME</code> or <code>org.gradle.java.home</code> in <code>gradle.properties</code>.</p>

<h3>Example 8 — Build OOM during R8</h3>
<pre><code class="language-properties"># android/gradle.properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
org.gradle.daemon=true</code></pre>

<h3>Example 9 — ANR from a synchronous native call</h3>
<p>A TurboModule sync getter did file I/O on the UI thread; under load the app froze and the system raised an ANR. <code>adb pull /data/anr/traces.txt</code> showed <code>main</code> blocked in the module. Fix: make it async / move I/O off the main thread.</p>

<h3>Example 10 — Install failure after switching machines</h3>
<pre><code class="language-bash">adb install app-release.apk
# Failure [INSTALL_FAILED_UPDATE_INCOMPATIBLE: ... signatures do not match]
adb uninstall com.smartworks.mobile &amp;&amp; adb install app-release.apk</code></pre>

<h3>Example 11 — 16 KB alignment check before a Play upload</h3>
<pre><code class="language-bash">unzip -l app-release.aab | grep '\\.so'
llvm-readelf -l base/lib/arm64-v8a/libhermes.so | grep LOAD
# want Align 0x4000 (16384). 0x1000 (4096) = will fail on Android 15.</code></pre>

<h3>Example 12 — Deobfuscating a production Crashlytics stack</h3>
<pre><code class="language-bash">retrace android/app/build/outputs/mapping/release/mapping.txt stack.txt
# or let Crashlytics/Sentry auto-deobfuscate by uploading mapping.txt at build</code></pre>

<h3>Example 13 — Expo: reset native state and re-check</h3>
<pre><code class="language-bash">npx expo-doctor                 # flags version / config mismatches
npx expo prebuild --clean       # regenerate android/ &amp; ios/ from config
cd android &amp;&amp; ./gradlew clean
npx expo run:android            # rebuild the dev client</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. The crash is in a background thread, not <code>main</code></h3>
<p>The <code>FATAL EXCEPTION:</code> line names the thread. If it's not <code>main</code>, a background executor (OkHttp dispatcher, a coroutine, a native module's queue) threw. The fix location differs — look at what runs on that thread, not your UI code.</p>

<h3>2. Native SIGSEGV has no Java stack</h3>
<p>A pure C++ crash (Hermes, JSI, a native lib) produces a <strong>tombstone</strong>, not a Java exception: <code>signal 11 (SIGSEGV)</code>, <code>backtrace:</code> with addresses. You need <code>ndk-stack</code> + the unstripped <code>.so</code> to symbolicate, or a crash reporter with native symbol upload. Logcat alone shows hex addresses.</p>
<pre><code class="language-bash">adb logcat | ndk-stack -sym android/app/build/intermediates/merged_native_libs/release/out/lib/arm64-v8a</code></pre>

<h3>3. Debug works, release crashes → almost always R8</h3>
<p>The single most common "works on my machine" native bug. Reproduce with <code>./gradlew assembleRelease</code> + install the release APK, then add keep rules. Do not chase it in debug — minification is off there.</p>

<h3>4. Emulator ABI ≠ device ABI</h3>
<p>Modern emulators are <code>x86_64</code>; phones are <code>arm64-v8a</code>. A lib shipping only arm64 prebuilts loads on the phone but <code>UnsatisfiedLinkError</code>s on the emulator (or vice-versa). Match ABIs when reproducing.</p>

<h3>5. Manifest merger conflict comes from a transitive lib</h3>
<p>The conflicting attribute may be injected by a library you never edited. The <code>manifest-merger-*-report.txt</code> shows the exact source AAR. Use <code>tools:replace</code> or <code>tools:node="remove"</code> to override it.</p>

<h3>6. Duplicate class only appears in release</h3>
<p>R8 merges classpaths differently than the debug packager; a duplicate can surface only when minifying. Check both variants' dependency trees (<code>releaseRuntimeClasspath</code> vs <code>debugRuntimeClasspath</code>).</p>

<h3>7. <code>largeHeap</code> hides a leak</h3>
<p>Setting <code>android:largeHeap="true"</code> delays the OOM instead of fixing it. If memory grows unbounded you have a leak (retained Activity/Context, unbounded cache) — profile with Android Studio Memory Profiler / LeakCanary, don't just raise the ceiling.</p>

<h3>8. ANR with an empty-looking main stack</h3>
<p>Sometimes <code>main</code> is waiting on a lock held by another thread — a deadlock. Read the whole <code>traces.txt</code>: find which thread holds the monitor <code>main</code> is blocked on.</p>

<h3>9. Codegen-stale crash after a version bump</h3>
<p>Changing RN/Expo versions without regenerating native code leaves stale generated TurboModule/Fabric bindings → <code>NoSuchMethodError</code> or link errors. Clean generated dirs: <code>./gradlew clean</code>, delete <code>android/app/build/generated</code>, and on Expo re-run <code>expo prebuild --clean</code>.</p>

<h3>10. <code>INSTALL_FAILED_UPDATE_INCOMPATIBLE</code> from mixing signing keys</h3>
<p>A debug build then a differently-signed release build (or two dev machines) won't overwrite each other. Uninstall first. This is expected, not a bug.</p>

<h3>11. Log truncation / ring buffer overflow</h3>
<p>logcat's default buffer is small; a chatty app can push the crash out before you read it. Increase it (<code>adb logcat -G 16M</code>) or use <code>-b crash</code> which is dedicated to fatals.</p>

<h3>12. 16 KB failure only on Android 15 hardware</h3>
<p>A 4 KB-aligned <code>.so</code> loads fine on Android 14 and older, and on many emulators — the crash / rejection appears only on real 16 KB-page Android 15 devices or when Play validates the bundle. Test on an Android 15 image configured for 16 KB pages.</p>

<h3>13. Hermes bytecode mismatch</h3>
<p>A precompiled Hermes bundle (<code>.hbc</code>) built with a different Hermes version than the runtime <code>libhermes.so</code> fails to load. Keep the bundler and the native engine on the same RN version; rebuild the bundle after upgrades.</p>

<h3>14. Multidex only below minSdk 21</h3>
<p><code>NoClassDefFoundError</code> from the 64K method limit is a pre-21 concern. With <code>minSdk 26</code> (your VAPT remediation baseline) multidex is native and this is moot — if you see it above 21, suspect R8, not method count.</p>

<h3>15. Obfuscated line numbers off by a bit</h3>
<p>Even with <code>mapping.txt</code>, if the archived mapping doesn't match the exact build that crashed, names deobfuscate but line numbers can be wrong. Archive the mapping per <em>build</em>, keyed by versionCode.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — reading the top frame instead of the root cause</h3>
<p>Fixating on the outer <code>RuntimeException</code> / <code>Handler</code> frames. The bug is in the last <code>Caused by:</code>. Always scroll to the bottom of the chain first.</p>

<h3>Anti-pattern 2 — debugging from a truncated screenshot</h3>
<p>A cropped toast or Play "app keeps stopping" dialog is not evidence. Get the full <code>adb logcat -b crash -d</code> or the Crashlytics/Sentry event with the complete stack.</p>

<h3>Anti-pattern 3 — chasing a release crash in debug</h3>
<p>Debug has R8 off, so the class isn't stripped and the bug vanishes. Reproduce with a release build; then add keep rules.</p>

<h3>Anti-pattern 4 — blanket <code>-keep class ** { *; }</code></h3>
<p>Keeping everything defeats minification, bloats the APK, and hides which class actually needed keeping. Keep the specific package/class the reflection touches.</p>

<h3>Anti-pattern 5 — bumping <code>largeHeap</code> to "fix" OOM</h3>
<p>It delays the crash and masks a leak. Profile allocations; resize bitmaps; fix the retention.</p>

<h3>Anti-pattern 6 — force-resolving a dependency without reading the tree</h3>
<p>Blindly <code>force</code>-ing a version can break the lib that needed the other version. Run <code>:app:dependencies</code>, understand who needs what, then pin deliberately.</p>

<h3>Anti-pattern 7 — hand-editing <code>android/</code> in an Expo prebuild project</h3>
<p>Your fix to <code>AndroidManifest.xml</code> / <code>build.gradle</code> is wiped on the next <code>expo prebuild --clean</code>. Encode it as a config plugin or <code>expo-build-properties</code> instead.</p>

<h3>Anti-pattern 8 — not archiving <code>mapping.txt</code></h3>
<p>Ship a release without saving the mapping and every production stack is <code>a.b.c</code> forever. Upload it to the crash reporter at build time.</p>

<h3>Anti-pattern 9 — synchronous / heavy work on the main thread</h3>
<p>Big JSON parses, disk I/O, or a blocking native call on the UI thread → ANR. Move it off <code>main</code>.</p>

<h3>Anti-pattern 10 — ignoring the failing Gradle <em>task name</em></h3>
<p>The task (<code>:app:minifyReleaseWithR8</code>, <code>:app:processDebugManifest</code>, <code>:app:mergeDebugNativeLibs</code>) tells you the phase. Skipping it means guessing which subsystem failed.</p>

<h3>Anti-pattern 11 — not doing a clean rebuild after a native change</h3>
<p>Stale <code>build/</code>, caches, or generated codegen produce phantom errors that survive your fix. <code>./gradlew clean</code> before declaring victory.</p>

<h3>Anti-pattern 12 — shipping without native crash reporting</h3>
<p>Native SIGSEGV and background-thread exceptions never reach a JS error boundary. Without Crashlytics/Sentry (with native symbols + mapping upload) you're blind in production.</p>

<h3>Anti-pattern 13 — assuming an emulator-only <code>UnsatisfiedLinkError</code> is a real device bug</h3>
<p>It's often just an ABI mismatch with the emulator. Confirm on the target device's ABI before rearchitecting.</p>

<h3>Anti-pattern 14 — leaving <code>android:exported</code> implicit</h3>
<p>On Android 12+ it fails the merge outright. Always set it explicitly on components with intent-filters.</p>

<h3>Anti-pattern 15 — treating the 16 KB issue as a config toggle</h3>
<p>You can't flip a flag to align an old prebuilt <code>.so</code>. It's a toolchain upgrade (NDK/AGP/RN). Plan the version bump, don't hunt for a magic gradle property.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. Walk me through how you read a native Android crash.</div>
  <div class="qa-answer">
    <p>I get the full logcat (<code>adb logcat -b crash -d</code>), find the <code>FATAL EXCEPTION</code> line and note the <strong>thread</strong> (main vs background). Then I read the <code>Caused by:</code> chain <strong>bottom-up</strong> — the deepest one is the real cause. Inside that block I scan the <code>at</code> frames for the first one in <strong>my package or a named library</strong>, ignoring <code>com.facebook.react.*</code> / <code>android.*</code> framework frames. That gives me the exception type, the offending class, and a category to map to a fix.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. How do you tell a build failure from a runtime crash from an install failure?</div>
  <div class="qa-answer">
    <p>By where it surfaces. Build-time failures appear in the terminal/CI as <code>Execution failed for task ':app:...'</code> — no APK is produced. Install-time failures come from <code>adb install</code> / Play as <code>INSTALL_FAILED_*</code>. Runtime crashes appear on the device in logcat as <code>FATAL EXCEPTION</code> (or a native SIGSEGV tombstone). The tools and the fix location are completely different, so classifying first saves time.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. An app crashes at launch with a <code>ClassCastException</code> inside a module's <code>getConstants</code>. What's happening?</div>
  <div class="qa-answer">
    <p>That's an old-architecture (Paper) pattern: the module's <code>getConstants()</code> returns a value whose runtime type doesn't match what the bridge casts it to. I hit this with <strong>jail-monkey 3.0.0</strong> — <code>rootedDetectionMethods()</code> returned a type the old-arch <code>getConstants()</code> cast wrongly, crashing at launch on a Samsung S25. Fix: patch the library (via <code>patch-package</code>) to drop that constant. It only reproduced on old arch; RootBeer-native and ProGuard were red herrings.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. You get <code>UnsatisfiedLinkError: couldn't find libX.so</code>. Causes?</div>
  <div class="qa-answer">
    <p>A native <code>.so</code> couldn't be loaded: ABI mismatch (built arm64, ran on x86 emulator), the lib wasn't packaged (stale build — <code>./gradlew clean</code>), a Hermes/JSC toggle changed without rebuild so <code>libhermes.so</code> is absent, or SoLoader failed to init. I check <code>abiFilters</code>/<code>splits</code>, confirm the device ABI, and rebuild clean.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Debug build works, release crashes with <code>ClassNotFoundException</code>. Why?</div>
  <div class="qa-answer">
    <p>R8/ProGuard runs only in release. It stripped or renamed a class that's referenced by <strong>reflection</strong>, so R8 thought it was dead code. Fix: add a <code>-keep</code> rule for that specific class/package in <code>proguard-rules.pro</code>. The tell is that it's release-only — minification is off in debug.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How do you resolve a <code>Duplicate class</code> Gradle error?</div>
  <div class="qa-answer">
    <p>Two deps pull the same class at different versions. I run <code>./gradlew :app:dependencies</code> to see who pulls what, then either <code>resolutionStrategy.force</code> a single version or <code>exclude</code> the transitive module from the offending dependency. I read the tree first so I don't break the lib that needed the other version.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. What causes a manifest merger failure and how do you fix it?</div>
  <div class="qa-answer">
    <p>Two manifests declare conflicting attributes — commonly <code>android:allowBackup</code>, duplicate permissions, or a missing <code>android:exported</code> (required on Android 12+ for components with intent-filters). I read <code>manifest-merger-*-report.txt</code> to find which AAR injected the conflict, then use <code>tools:replace</code> (or <code>tools:node="remove"</code>) in my manifest, or set <code>android:exported</code> explicitly.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. What is an ANR and how do you debug it in RN?</div>
  <div class="qa-answer">
    <p>Application Not Responding — the main/UI thread was blocked ~5s. In RN it's usually heavy work on the UI thread: a synchronous native call, a big JSON parse, or a deadlock. I pull <code>/data/anr/traces.txt</code> (or <code>adb shell dumpsys activity</code>), read the <code>main</code> thread's top frame to see what it's stuck on, and move that work off the main thread.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Two kinds of OutOfMemoryError — distinguish them.</div>
  <div class="qa-answer">
    <p>Build-time OOM is the Gradle/Kotlin/R8 daemon exhausting heap — fixed by raising <code>org.gradle.jvmargs=-Xmx4096m</code> in <code>gradle.properties</code>. Runtime OOM is the app failing to allocate — usually full-resolution bitmaps or a leak; I resize images, use Fresco/Glide, and profile for retention. <code>android:largeHeap="true"</code> is a stopgap that hides leaks, not a fix.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Production stack traces are obfuscated (<code>a.b.c</code>). How do you read them?</div>
  <div class="qa-answer">
    <p>R8 writes a <code>mapping.txt</code> per release build (<code>build/outputs/mapping/release/</code>). I run <code>retrace mapping.txt stack.txt</code> to reverse the names, or — better — upload the mapping to Crashlytics/Sentry at build time so they auto-deobfuscate. The key discipline is archiving <code>mapping.txt</code> keyed by versionCode, or old crashes become unreadable.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Explain the 16 KB page-size problem and how you fixed it.</div>
  <div class="qa-answer">
    <p>Android 15 devices can use 16 KB memory pages; native <code>.so</code> libs must be 16 KB-aligned or they won't load, and Play blocks the upload. Old <strong>prebuilt</strong> libs aligned to 4 KB can't just be re-flagged — it needs a toolchain upgrade (NDK r27+, matching AGP, aligned RN prebuilts). In <code>sw-ticketing</code>, RN 0.76 prebuilts couldn't be aligned, so we upgraded mainline in-place to <strong>Expo 53 / RN 0.79</strong> rather than maintaining a sibling folder.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. A native crash shows only <code>signal 11 (SIGSEGV)</code> and hex addresses. What do you do?</div>
  <div class="qa-answer">
    <p>That's a C++ crash with a tombstone, not a Java exception — Hermes/JSI or a native lib. There's no Java stack, so I symbolicate: pipe logcat through <code>ndk-stack</code> with the unstripped <code>.so</code> directory, or rely on a crash reporter with native symbol upload. Logcat alone only shows addresses.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Your fix to <code>AndroidManifest.xml</code> keeps disappearing. Why?</div>
  <div class="qa-answer">
    <p>It's an Expo prebuild (CNG) project — <code>expo prebuild --clean</code> regenerates <code>android/</code> from config and wipes hand edits. The right place is a config plugin or <code>expo-build-properties</code> in <code>app.json</code>/<code>app.config.js</code>, so the change is reapplied on every prebuild.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. First tool you reach for on any native failure?</div>
  <div class="qa-answer">
    <p>logcat for runtime (<code>adb logcat -b crash -d</code>, filtered by pid), and <code>./gradlew &lt;task&gt; --stacktrace --info</code> for build. Beyond that: Android Studio debugger with breakpoints in the Kotlin impl, <code>adb shell dumpsys</code> (activity/meminfo/gfxinfo), <code>adb bugreport</code> for a full snapshot, <code>ndk-stack</code>/retrace for symbolication, and Crashlytics/Sentry for production with native symbols + mapping.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. <code>INSTALL_FAILED_UPDATE_INCOMPATIBLE</code> — cause and fix?</div>
  <div class="qa-answer">
    <p>The installed app was signed with a different key than the one you're pushing (debug vs release, or two machines). Android won't overwrite across signatures. Fix: <code>adb uninstall &lt;package&gt;</code> then reinstall. It's expected behavior, not a code bug.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You classify build vs install vs runtime before touching anything.</li>
    <li>You read the <code>Caused by:</code> chain bottom-up and find the first frame in your package.</li>
    <li>You know release-only crashes are almost always R8, and reach for keep rules + <code>mapping.txt</code>.</li>
    <li>You can name the real jail-monkey <code>ClassCastException</code> / <code>getConstants</code> old-arch case.</li>
    <li>You explain <code>UnsatisfiedLinkError</code> via ABI/Hermes/SoLoader, not hand-waving.</li>
    <li>You resolve dependency conflicts by reading the tree, then <code>force</code>/<code>exclude</code>.</li>
    <li>You debug ANRs from <code>traces.txt</code> and move work off the main thread.</li>
    <li>You understand the 16 KB page-size issue as a toolchain upgrade, and know the Expo prebuild wipe gotcha.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q16. In an Expo prebuild / EAS project, how do you reset native state and investigate a native build failure?</div>
  <div class="qa-answer">
    <p>Start with <code>npx expo-doctor</code>, which flags version and config mismatches. Then <code>npx expo prebuild --clean</code> regenerates <code>android/</code> and <code>ios/</code> from config (it also wipes any hand edits, so durable fixes must live in config plugins or <code>expo-build-properties</code>), followed by <code>cd android &amp;&amp; ./gradlew clean</code> and <code>npx expo run:android</code> to rebuild the dev client. For cloud builds, read the EAS Build logs the same way you would a local Gradle failure: find the failing task. For release crashes from EAS builds, symbolicate with the uploaded symbols and <code>mapping.txt</code>.</p>
  </div>
</div>
` },

  ]
});
