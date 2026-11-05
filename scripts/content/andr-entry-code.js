window.PREP_SITE.registerTopic({
  id: "andr-entry-code",
  module: "Android Native (Deep)",
  title: "Entry Code & RN Wiring",
  estimatedReadTime: "24 min",
  tags: ["mainactivity","mainapplication","reactnativehost","reacthost","soloader","hermes","jsc","jni","autolinking","new-architecture","packagelist","reactpackage","reactactivitydelegate","fabric","turbomodules","jsi","bridge","catalystinstance","bridgeless","jnilibs","abi","expo","android"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline"><strong>MainApplication</strong> boots the React runtime and lists native packages for the whole process; <strong>MainActivity</strong> mounts one React root view whose name must match <code>AppRegistry.registerComponent</code> — with SoLoader loading the <code>.so</code> files, JNI bridging to C++, and Hermes running the JS.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>MainApplication</strong> = process entry: extends <code>Application</code>, implements <code>ReactApplication</code>, owns the <code>ReactNativeHost</code> (old arch) or <code>ReactHost</code> (new arch); runs once per process before any Activity.</li>
    <li><strong>MainActivity</strong> = screen entry: extends <code>ReactActivity</code>, returns <code>getMainComponentName()</code>, builds a <code>ReactActivityDelegate</code> (<code>DefaultReactActivityDelegate</code> with <code>fabricEnabled</code>) that mounts the <code>ReactRootView</code>.</li>
    <li><strong>Three names must match:</strong> <code>app.json</code> "name" = <code>AppRegistry.registerComponent(name, ...)</code> = <code>getMainComponentName()</code>, or you get an "not been registered" red screen.</li>
    <li><strong>Host members:</strong> <code>getPackages()</code> → <code>PackageList(this).packages</code> + custom; <code>getJSMainModuleName()</code> → "index" (dev only); <code>getUseDeveloperSupport()</code> → <code>BuildConfig.DEBUG</code>; <code>isNewArchEnabled</code>/<code>isHermesEnabled</code> from BuildConfig.</li>
    <li><strong>onCreate order:</strong> <code>super.onCreate()</code> → <code>SoLoader.init(this, false)</code> FIRST → on new arch <code>DefaultNewArchitectureEntryPoint.load()</code> → then app singletons.</li>
    <li><strong>Autolinking</strong> generates <code>PackageList.java</code> at build time (one <code>ReactPackage</code> per native lib) into the generated folder — never hand-edit it; register a local module by appending a <code>ReactPackage</code> in <code>getPackages()</code>.</li>
    <li><strong>Native stack:</strong> <code>SoLoader</code> loads <code>.so</code> libs → <strong>JNI</strong> (wrapped by <strong>fbjni</strong>) bridges Java↔C++ → C++ core <code>libreactnativejni</code>/<code>libjsi</code> + engine <code>libhermes</code> (or JSC).</li>
    <li><strong>Hermes</strong> precompiles the bundle to <strong>bytecode</strong> via <code>hermesc</code> → faster startup, less memory; JSC runs plain source. Chosen by the <code>hermesEnabled</code> flag.</li>
    <li><strong>Old arch (Paper):</strong> <code>ReactNativeHost</code> + async <strong>Bridge</strong> (<code>CatalystInstance</code>, JSON, eager modules). <strong>New arch:</strong> <code>ReactHost</code> + <strong>JSI</strong>, <strong>TurboModules</strong> (lazy), <strong>Fabric</strong> (<code>fabricEnabled</code>), optionally <strong>bridgeless</strong> (no bridge). Deep model → <code>rn-architecture</code>.</li>
    <li><strong>ABIs:</strong> <code>arm64-v8a</code> (phones), <code>armeabi-v7a</code>, <code>x86</code>/<code>x86_64</code> (emulators); controlled by <code>abiFilters</code>/ABI splits, packaged under <code>jniLibs/&lt;abi&gt;/</code>. Miss arm64-v8a → <code>UnsatisfiedLinkError</code> on real devices.</li>
    <li><strong>super.onCreate(null)</strong> (not <code>savedInstanceState</code>) when overriding, for <code>react-native-screens</code>.</li>
    <li><strong>sw-mobile</strong> = OLD arch (Paper) + Hermes: <code>ReactNativeHost</code>, bridge present, no <code>load()</code> call.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Hand-editing MainApplication/MainActivity/PackageList in an Expo prebuild project</strong> — <code>expo prebuild --clean</code> regenerates and wipes them. Fix: use a config plugin (<code>withMainApplication</code>/<code>withMainActivity</code>) or <code>expo-build-properties</code>. (Second trap: dropping <code>arm64-v8a</code> to shrink builds — works on the emulator, crashes on every real phone.)</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"MainApplication is process scope — it builds the React host, lists native packages via autolinked PackageList, and calls SoLoader.init in onCreate. MainActivity is screen scope — it returns the component name and mounts the root view into that host."</div>
  <div class="revision-say">"SoLoader loads the .so libraries, JNI (via fbjni) bridges Kotlin to the C++ core in libreactnativejni, and Hermes runs the bundle — precompiled to bytecode at build time for faster startup."</div>
  <div class="revision-say">"On old arch the host is a ReactNativeHost talking over the async bridge; on new arch it's a ReactHost with JSI, TurboModules, and Fabric, and onCreate calls DefaultNewArchitectureEntryPoint.load(). sw-mobile is still on Paper with Hermes."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What these files are</h3>
<p>When you run a bare/prebuilt RN app you get an <code>android/</code> folder with a Gradle project. Inside <code>android/app/src/main/java/&lt;your/package&gt;/</code> live exactly two hand-editable entry files: <code>MainApplication.kt</code> and <code>MainActivity.kt</code> (older templates use <code>.java</code>). They are the seam where the Android OS process meets the React Native runtime.</p>
<ul>
  <li><strong>MainApplication</strong> runs <em>once per process</em>, before any Activity. Android instantiates the class named in <code>AndroidManifest.xml</code> under <code>&lt;application android:name="..."&gt;</code>. This is where you initialize the React runtime, SoLoader, Flipper (debug), crash reporting, and anything that must exist for the whole app lifetime.</li>
  <li><strong>MainActivity</strong> is the launcher screen. The manifest's <code>&lt;activity&gt;</code> with the <code>MAIN</code>/<code>LAUNCHER</code> intent-filter points at it. It hosts the <code>ReactRootView</code> that renders your JS component tree.</li>
</ul>

<h3>Why RN splits it this way</h3>
<p>Android already separates process setup (<code>Application</code>) from UI (<code>Activity</code>). RN maps onto that: the <strong>host</strong> (the React runtime, the JS engine, the module registry) is process-scoped, so it lives on <code>MainApplication</code>; the <strong>root view</strong> is UI, so it lives on <code>MainActivity</code>. One host can back multiple activities/root views (think Brownfield apps embedding RN in a native screen).</p>

<h3>Why the boot chain matters for debugging</h3>
<p>Most "app won't launch" native crashes happen in this window: an <code>UnsatisfiedLinkError</code> from SoLoader failing to find a <code>.so</code>, a missing package in <code>getPackages()</code> giving "Native module ... doesn't exist," an ABI filter stripping the library your device needs, or a mismatch between <code>getMainComponentName()</code> and the JS <code>registerComponent</code> name yielding a red screen. Knowing the chain tells you where to put the breakpoint.</p>

<h3>Old arch vs new arch — the shape of the difference</h3>
<table>
  <thead><tr><th></th><th>Old arch (Paper)</th><th>New arch</th></tr></thead>
  <tbody>
    <tr><td>Host type</td><td><code>ReactNativeHost</code></td><td><code>ReactHost</code> (via <code>DefaultReactHost</code>)</td></tr>
    <tr><td>JS ↔ native</td><td>Async <strong>Bridge</strong> (JSON, serialized)</td><td><strong>JSI</strong> (direct C++), TurboModules, Fabric</td></tr>
    <tr><td>Module loading</td><td>Eager at startup</td><td>Lazy (TurboModuleManager)</td></tr>
    <tr><td>Boot flag</td><td><code>newArchEnabled=false</code></td><td><code>newArchEnabled=true</code> → <code>DefaultNewArchitectureEntryPoint.load()</code></td></tr>
    <tr><td>Bridgeless</td><td>No (CatalystInstance always present)</td><td>Optional — no traditional bridge object</td></tr>
  </tbody>
</table>
<p>Both use the same two files; the flags and one-line host choice change. This topic stays grounded in the files — for the deep conceptual model of Bridge vs JSI/Fabric, cross-reference the <code>rn-architecture</code> topic.</p>

<h3>sw-mobile reality</h3>
<p>Your <code>sw-mobile</code> (Expo 53 / RN 0.79) runs on the <strong>OLD architecture (Paper)</strong> with <strong>Hermes</strong>. So in that codebase the host is a <code>ReactNativeHost</code>, the bridge is present, and <code>newArchEnabled</code> is false. Everything below applies; you just don't take the <code>DefaultNewArchitectureEntryPoint.load()</code> branch.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>The boot chain, top to bottom</h3>
<div class="diagram">
<pre>
 Android OS
   │  zygote forks process, reads AndroidManifest.xml
   ▼
 MainApplication.onCreate()          (once per process)
   │  SoLoader.init(this, false)      ← loads native .so libs
   │  if (newArch) DefaultNewArchitectureEntryPoint.load()
   │  builds ReactNativeHost / ReactHost   (holds packages, JS bundle name)
   ▼
 MainActivity.onCreate()             (launcher screen)
   │  super.onCreate()  → ReactActivity plumbing
   │  createReactActivityDelegate()
   ▼
 ReactActivityDelegate
   │  asks host for a ReactInstanceManager / ReactHost
   │  loadApp(getMainComponentName())    ← "sw_mobile"
   ▼
 ReactRootView  ← startReactApplication(name, initialProps)
   │
   ▼
 JS: AppRegistry.registerComponent("sw_mobile", () =&gt; App)
   │  Hermes evaluates index bundle, mounts &lt;App/&gt;
   ▼
 Pixels on screen
</pre>
</div>

<h3>Who owns what</h3>
<div class="diagram">
<pre>
 MainApplication (Application, ReactApplication)   ── process scope
   └─ ReactNativeHost / ReactHost
        ├─ getPackages()  → PackageList(this).packages + custom
        ├─ getJSMainModuleName()  → "index"
        ├─ getUseDeveloperSupport() → BuildConfig.DEBUG
        ├─ isNewArchEnabled / isHermesEnabled
        └─ (builds) ReactInstanceManager
                        ├─ CatalystInstance (old arch bridge)
                        ├─ NativeModuleRegistry  (from packages)
                        └─ JS engine (Hermes / JSC)

 MainActivity (ReactActivity)                      ── screen scope
   └─ ReactActivityDelegate (Default*, fabricEnabled)
        └─ ReactRootView  → renders component "sw_mobile"
</pre>
</div>

<h3>The native library stack SoLoader assembles</h3>
<div class="diagram">
<pre>
 Kotlin/Java  ── JNI ──►  C++ core
   MainApplication          libreactnativejni.so   (bridge / JSI glue)
        │                   libjsi.so
        │                   libfabricjni.so        (new arch UI)
        ▼                   libturbomodulejsijni.so
   SoLoader.init ──loads──► libhermes.so  OR  libjsc.so   (JS engine)
                            libfbjni.so    (Java↔C++ helper)
                            your app's .so per ABI (arm64-v8a, ...)
</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"MainActivity starts React." No — <strong>MainApplication</strong> builds the React runtime (the host) for the whole process; MainActivity only mounts <em>a root view</em> into that already-existing runtime. That is why a Brownfield app can have several activities all sharing one host, and why heavy init belongs in <code>Application.onCreate()</code>, not the Activity.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>File 1 — MainActivity.kt (screen entry)</h3>
<pre><code class="language-kotlin">package com.swmobile

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  // Must EXACTLY match AppRegistry.registerComponent(name, ...) in JS.
  override fun getMainComponentName(): String = "sw_mobile"

  // Chooses the delegate that mounts the React root view.
  override fun createReactActivityDelegate(): ReactActivityDelegate =
    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}</code></pre>
<ul>
  <li><code>ReactActivity</code> is RN's base <code>Activity</code>; its <code>onCreate</code> calls <code>getReactDelegate().onCreate(...)</code> which ultimately calls <code>loadApp(getMainComponentName())</code>.</li>
  <li><code>getMainComponentName()</code> returns the string the JS side registered. Mismatch → "Application ... has not been registered" red screen.</li>
  <li><code>DefaultReactActivityDelegate</code> (RN 0.71+) is the arch-aware delegate; <code>fabricEnabled</code> tells it to build a Fabric-backed root view when the new arch is on.</li>
  <li>If you override <code>onCreate</code> yourself (e.g. for <code>react-native-screens</code>, edge-to-edge, or a splash), you MUST call <code>super.onCreate(null)</code> — passing <code>null</code> (not <code>savedInstanceState</code>) avoids a known state-restore crash with fragments.</li>
</ul>

<h3>File 2 — MainApplication.kt (process entry)</h3>
<pre><code class="language-kotlin">package com.swmobile

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
    object : DefaultReactNativeHost(this) {

      override fun getPackages(): List&lt;ReactPackage&gt; {
        // Autolinked packages + any you add by hand:
        val packages = PackageList(this).packages
        // packages.add(MyCustomPackage())
        return packages
      }

      override fun getJSMainModuleName(): String = "index"

      override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

      override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
    }

  // New arch host (only used when isNewArchEnabled):
  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, /* native exopackage */ false)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // Loads the C++ TurboModule/Fabric entry point:
      load()
    }
  }
}</code></pre>
<p>Line by line, the members that interviewers probe:</p>
<ul>
  <li><code>implements ReactApplication</code> — the contract that exposes <code>reactNativeHost</code> (and <code>reactHost</code>) so <code>ReactActivity</code> can find the runtime.</li>
  <li><code>getPackages()</code> → <code>PackageList(this).packages</code> — the <strong>autolinking</strong> output. Every community lib with native code contributes a <code>ReactPackage</code> here. You append custom packages after.</li>
  <li><code>getJSMainModuleName()</code> → <code>"index"</code> — used by Metro in dev to know the entry module for the bundle (matches your <code>index.js</code>). Release builds read the precompiled bundle from assets instead.</li>
  <li><code>getUseDeveloperSupport()</code> → <code>BuildConfig.DEBUG</code> — enables the dev menu, red boxes, and Metro connection only in debug.</li>
  <li><code>isNewArchEnabled</code> / <code>isHermesEnabled</code> — read from <code>BuildConfig</code> constants that Gradle injects from <code>gradle.properties</code>.</li>
  <li><code>SoLoader.init(this, false)</code> — MUST run before any React class touches native code; it registers where the <code>.so</code> libraries live.</li>
  <li><code>load()</code> (a.k.a. <code>DefaultNewArchitectureEntryPoint.load()</code>) — only on new arch; wires up the C++ TurboModule and Fabric entry points.</li>
</ul>

<h3>How PackageList.java is generated (autolinking)</h3>
<p>You never write <code>PackageList</code> by hand. During the Gradle build, the <code>@react-native-community/cli</code> autolinking + the RN Gradle plugin scan <code>node_modules</code> for packages declaring Android native code (via their <code>react-native.config.js</code> or <code>package.json</code>), then <em>codegen</em> emits <code>PackageList.java</code> into the generated build folder:</p>
<pre><code class="language-java">// android/app/build/generated/.../PackageList.java  (generated — do not edit)
public class PackageList {
  public ArrayList&lt;ReactPackage&gt; getPackages() {
    return new ArrayList&lt;&gt;(Arrays.asList(
      new MainReactPackage(mConfig),
      new AsyncStoragePackage(),
      new RNGestureHandlerPackage(),
      new RNScreensPackage(),
      new SvgPackage()
      // ...one entry per autolinked library
    ));
  }
}</code></pre>
<p>So <code>PackageList(this).packages</code> in your <code>MainApplication</code> is literally reading this generated list. Add a library → rebuild → its package appears here automatically.</p>

<h3>Registering a custom native module by hand</h3>
<p>A local module (not published to npm) is registered by writing a <code>ReactPackage</code> and appending it:</p>
<pre><code class="language-kotlin">class MyCustomPackage : ReactPackage {
  override fun createNativeModules(ctx: ReactApplicationContext): List&lt;NativeModule&gt; =
    listOf(MyDeviceModule(ctx))

  override fun createViewManagers(ctx: ReactApplicationContext): List&lt;ViewManager&lt;*, *&gt;&gt; =
    emptyList()
}

// then in getPackages():
val packages = PackageList(this).packages
packages.add(MyCustomPackage())
return packages</code></pre>

<h3>The JS side of the handshake</h3>
<pre><code class="language-js">// index.js — the counterpart to getMainComponentName()
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';   // "sw_mobile"

AppRegistry.registerComponent(appName, () =&gt; App);</code></pre>
<p>The string in <code>app.json</code> under <code>"name"</code>, the argument to <code>registerComponent</code>, and <code>getMainComponentName()</code> must all be identical.</p>

<h3>SoLoader, JNI, and the C++ core</h3>
<p><strong>SoLoader</strong> is Facebook's library loader. <code>SoLoader.init()</code> records the paths to the packaged <code>.so</code> files; later, when a Java class runs a <code>static { SoLoader.loadLibrary("reactnativejni") }</code> block, SoLoader <code>dlopen</code>s that library and resolves its dependencies (it handles older Android <code>System.loadLibrary</code> quirks and merged/exopackage layouts).</p>
<p><strong>JNI</strong> (Java Native Interface) is the ABI that lets Java/Kotlin call C/C++ and vice versa. RN uses <strong>fbjni</strong> (<code>libfbjni.so</code>) as an ergonomic wrapper over raw JNI. The C++ core lives in libraries like <code>libreactnativejni.so</code> (bridge + JSI glue), <code>libjsi.so</code> (the JS Interface abstraction), and the engine — <code>libhermes.so</code> (Hermes) or JSC (<code>libjsc.so</code> / system JSC).</p>

<h3>Hermes vs JSC and bytecode precompilation</h3>
<pre><code class="language-properties"># android/gradle.properties
hermesEnabled=true
newArchEnabled=false</code></pre>
<ul>
  <li><strong>Hermes</strong> is the default engine. During the release build, the <code>hermesc</code> compiler turns your JS bundle into <strong>Hermes bytecode</strong> (<code>index.android.bundle</code> as bytecode), so the device skips parsing/compiling JS at startup — faster TTI and lower memory.</li>
  <li><strong>JSC</strong> (JavaScriptCore) runs plain JS source; historically used before Hermes. Selection is the <code>hermesEnabled</code> flag; the Gradle plugin packages the matching <code>.so</code> and <code>isHermesEnabled</code> reflects it at runtime.</li>
  <li>Engine choice affects debugging: Hermes debugging goes through the Hermes inspector / new debugger, not legacy Chrome remote JS debugging.</li>
</ul>

<h3>ABIs, jniLibs, and packaging the .so files</h3>
<p>Native libraries are compiled per CPU architecture (<strong>ABI</strong>): <code>arm64-v8a</code> (modern phones), <code>armeabi-v7a</code> (older 32-bit), <code>x86</code> / <code>x86_64</code> (emulators). Gradle controls which ship:</p>
<pre><code class="language-groovy">// android/app/build.gradle
android {
  defaultConfig {
    ndk { abiFilters "armeabi-v7a", "arm64-v8a", "x86", "x86_64" }
  }
  // Split per-ABI APKs to shrink download size:
  splits {
    abi {
      enable true
      reset()
      include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
      universalApk false
    }
  }
}</code></pre>
<p>Prebuilt <code>.so</code> files land under <code>jniLibs/&lt;abi&gt;/</code> inside the APK/AAB. If a device's ABI is filtered out, SoLoader throws <code>UnsatisfiedLinkError</code> at launch. Google Play's App Bundle delivers only the device's ABI automatically; a bare APK needs the right ABI included.</p>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — these files are generated, don't hand-edit</div>
  <p>In an Expo prebuild / Continuous Native Generation project, <code>MainActivity</code> and <code>MainApplication</code> are produced by <code>expo prebuild</code> from templates and are <strong>overwritten by</strong> <code>expo prebuild --clean</code>. Expo wraps the host: <code>MainApplication</code> uses <code>ReactNativeHostWrapper</code> and calls <code>ApplicationLifecycleDispatcher.onApplicationCreate(this)</code> in <code>onCreate</code>; <code>MainActivity</code> uses <code>ReactActivityDelegateWrapper</code> and dispatches config changes to Expo modules. The Expo module system does its own autolinking, so <code>PackageList</code> includes <code>expo</code>. To change these files reliably, use a <strong>config plugin</strong> — <code>withMainApplication</code> / <code>withMainActivity</code> mods, or <code>expo-build-properties</code> for flags like <code>newArchEnabled</code>/<code>hermes</code> — not manual edits.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — the three names that must match</h3>
<pre><code class="language-text">app.json           "name": "sw_mobile"
index.js           AppRegistry.registerComponent("sw_mobile", () =&gt; App)
MainActivity.kt    override fun getMainComponentName() = "sw_mobile"
                   └── all three identical, or red screen at launch</code></pre>

<h3>Example 2 — adding heavy init to MainApplication.onCreate</h3>
<pre><code class="language-kotlin">override fun onCreate() {
  super.onCreate()
  SoLoader.init(this, false)                 // 1. libs first, always
  if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) load()
  Sentry.init(this)                          // 2. crash reporting early
  MyAnalytics.bootstrap(this)                // 3. process-wide singletons
}</code></pre>
<p>Order matters: SoLoader before anything that touches native React classes.</p>

<h3>Example 3 — overriding onCreate on MainActivity safely</h3>
<pre><code class="language-kotlin">class MainActivity : ReactActivity() {
  override fun getMainComponentName() = "sw_mobile"

  override fun onCreate(savedInstanceState: Bundle?) {
    // react-native-screens requires null here, NOT savedInstanceState:
    super.onCreate(null)
  }

  override fun createReactActivityDelegate() =
    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}</code></pre>

<h3>Example 4 — passing initial props into the root view</h3>
<pre><code class="language-kotlin">override fun createReactActivityDelegate(): ReactActivityDelegate =
  object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
    override fun getLaunchOptions(): Bundle =
      Bundle().apply { putString("deepLink", intent?.data?.toString() ?: "") }
  }
// JS: props.deepLink is available on the root App component.</code></pre>

<h3>Example 5 — old arch host (what sw-mobile uses)</h3>
<pre><code class="language-kotlin">override val reactNativeHost: ReactNativeHost =
  object : DefaultReactNativeHost(this) {
    override fun getPackages() = PackageList(this).packages
    override fun getJSMainModuleName() = "index"
    override fun getUseDeveloperSupport() = BuildConfig.DEBUG
    override val isNewArchEnabled = false      // Paper
    override val isHermesEnabled = true        // Hermes
  }
// onCreate: SoLoader.init(this, false)  — NO load() call, old arch.</code></pre>

<h3>Example 6 — a registered custom package</h3>
<pre><code class="language-kotlin">override fun getPackages(): List&lt;ReactPackage&gt; {
  val packages = PackageList(this).packages
  packages.add(KioskPackage())     // FR Kiosk: lock-task, device-owner module
  return packages
}</code></pre>

<h3>Example 7 — reading generated PackageList after autolinking</h3>
<pre><code class="language-text">$ ls android/app/build/generated/autolinking/src/main/java/com/facebook/react/
PackageList.java     ← regenerated every build; lists every autolinked lib
$ npx expo-modules-autolinking search --platform android
# or, bare RN:
$ npx react-native config      # prints the resolved autolinking graph</code></pre>

<h3>Example 8 — the manifest wiring that points at these classes</h3>
<pre><code class="language-xml">&lt;application android:name=".MainApplication" ...&gt;   &lt;!-- process entry --&gt;
  &lt;activity android:name=".MainActivity" android:exported="true"&gt;
    &lt;intent-filter&gt;
      &lt;action android:name="android.intent.action.MAIN" /&gt;
      &lt;category android:name="android.intent.category.LAUNCHER" /&gt;
    &lt;/intent-filter&gt;
  &lt;/activity&gt;
&lt;/application&gt;</code></pre>

<h3>Example 9 — Hermes bytecode in a release build</h3>
<pre><code class="language-bash"># During ./gradlew assembleRelease, the RN Gradle plugin runs hermesc:
# node --> Metro bundle (index.android.bundle, plain JS)
#        --> hermesc -O -emit-binary  --> Hermes BYTECODE bundle
# The bytecode ships in assets/; device skips JS parse at startup.
adb shell run-as com.swmobile ls files   # inspect on a debuggable build</code></pre>

<h3>Example 10 — inspecting which .so libraries shipped</h3>
<pre><code class="language-bash"># Unzip an APK and list native libs per ABI:
unzip -l app-release.apk | grep '\\.so'
# Typical: lib/arm64-v8a/libhermes.so, libreactnativejni.so,
#          libfbjni.so, libjsi.so, libfabricjni.so (new arch)</code></pre>

<h3>Example 11 — Expo-wrapped MainApplication (generated)</h3>
<pre><code class="language-kotlin">class MainApplication : Application(), ReactApplication {
  override val reactNativeHost: ReactNativeHost =
    ReactNativeHostWrapper(this, object : DefaultReactNativeHost(this) {
      override fun getPackages() = PackageList(this).packages   // includes expo
      override fun getJSMainModuleName() = ".expo/.virtual-metro-entry"
      override fun getUseDeveloperSupport() = BuildConfig.DEBUG
      override val isNewArchEnabled = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      override val isHermesEnabled = BuildConfig.IS_HERMES_ENABLED
    })

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, false)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) load()
    ApplicationLifecycleDispatcher.onApplicationCreate(this)   // Expo hook
  }
}</code></pre>
<p>Note the Expo entry module name and the <code>ReactNativeHostWrapper</code> — signs you should edit via config plugin, not by hand.</p>

<h3>Example 12 — a withMainApplication config plugin mod</h3>
<pre><code class="language-js">// plugins/withKioskInit.js
const { withMainApplication } = require('@expo/config-plugins');

module.exports = function withKioskInit(config) {
  return withMainApplication(config, (cfg) =&gt; {
    cfg.modResults.contents = cfg.modResults.contents.replace(
      'SoLoader.init(this, false)',
      'SoLoader.init(this, false)\\n    KioskManager.bootstrap(this)'
    );
    return cfg;
  });
};
// Survives expo prebuild --clean because it re-applies each generation.</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. Name mismatch → red screen</h3>
<p>If <code>getMainComponentName()</code> is <code>"main"</code> but JS registered <code>"sw_mobile"</code>, launch fails with "Application main has not been registered." All three sources (<code>app.json</code>, <code>registerComponent</code>, the override) must match exactly, case-sensitive.</p>

<h3>2. SoLoader not initialized → UnsatisfiedLinkError</h3>
<p>Calling any React class before <code>SoLoader.init()</code> (e.g. custom init that instantiates a native module in <code>onCreate</code> before the init line) throws <code>UnsatisfiedLinkError</code> / "couldn't find DSO to load." SoLoader must be the first React-related call.</p>

<h3>3. Missing ABI → crash on real device but not emulator</h3>
<p>Emulator is <code>x86_64</code>; a physical phone is <code>arm64-v8a</code>. If <code>abiFilters</code> omits <code>arm64-v8a</code>, it runs on the emulator but crashes on the phone with a missing-<code>.so</code> error. Always include arm64-v8a for release.</p>

<h3>4. Package missing from getPackages → "module doesn't exist"</h3>
<p>A local native module you forgot to append (or a lib autolinking didn't pick up) gives "Native module X doesn't exist" at the JS call site. Verify it's in <code>PackageList</code> (autolinked) or appended manually.</p>

<h3>5. super.onCreate(savedInstanceState) vs super.onCreate(null)</h3>
<p>With <code>react-native-screens</code>, passing the real <code>savedInstanceState</code> to <code>super.onCreate</code> can crash on state restoration (fragment recreation). RN templates pass <code>null</code>. Losing this line is a classic rotation/process-death crash.</p>

<h3>6. newArchEnabled flag mismatch</h3>
<p>Setting <code>isNewArchEnabled=true</code> in the host but <code>newArchEnabled=false</code> in <code>gradle.properties</code> (or vice versa) produces inconsistent behavior; the Gradle flag governs which codegen/.so ship. Keep them in sync; on Expo, set it via <code>expo-build-properties</code>.</p>

<h3>7. Editing android/ in an Expo prebuild project</h3>
<p>Hand-edited <code>MainApplication</code>/<code>MainActivity</code> are wiped by <code>expo prebuild --clean</code> (and silently re-diffed by a plain <code>expo prebuild</code>). Symptoms: "my native init disappeared after a dependency bump." Move edits into a config plugin.</p>

<h3>8. getJSMainModuleName only matters in dev</h3>
<p>It tells Metro the dev entry module. Release builds load the precompiled bundle from assets, so a wrong value fails only in debug (blank screen / Metro 404), which confuses people who test release.</p>

<h3>9. Hermes bytecode version mismatch</h3>
<p>A bundle compiled by one Hermes version loaded by a runtime expecting another (stale cached bundle, OTA/CodePush pushing a bytecode bundle to a mismatched app) crashes at load. Ship source or matching bytecode; CodePush must respect the engine.</p>

<h3>10. Multiple Application classes / manifest merge</h3>
<p>A library injecting its own <code>android:name</code> or a manifest-merge conflict can replace your <code>MainApplication</code>. Check the merged manifest (<code>build/outputs/logs/manifest-merger-*.txt</code>) if <code>onCreate</code> isn't running.</p>

<h3>11. ProGuard/R8 stripping a module</h3>
<p>Release minification can strip a native module class reflected into by name, causing "module doesn't exist" only in release. Add keep rules for your package classes.</p>

<h3>12. TurboModule vs legacy registration on new arch</h3>
<p>On new arch, a legacy <code>ReactPackage</code> still works (interop layer), but a module marked <code>isTurboModule=true</code> in its <code>ReactModuleInfo</code> is resolved lazily by the <code>TurboModuleManager</code>. Mismatched flags → module not found or eager-loaded unexpectedly.</p>

<h3>13. Bridgeless mode has no CatalystInstance</h3>
<p>Old-arch code reaching for <code>reactContext.catalystInstance</code> crashes under bridgeless (new arch), where there is no traditional bridge. Use the modern APIs (<code>ReactHost</code>, <code>UIManager</code> via Fabric) instead.</p>

<h3>14. Debug uses Metro, release uses the bundled asset</h3>
<p><code>getUseDeveloperSupport()=BuildConfig.DEBUG</code> means a debug build needs Metro running (or shows a connection error), while release reads <code>index.android.bundle</code> from assets. "Works in release, red in debug" usually means Metro isn't up.</p>

<h3>15. x86 removed for size but tester uses an emulator</h3>
<p>Dropping <code>x86</code>/<code>x86_64</code> to shrink the APK breaks emulator testing on Intel machines. Keep them for internal builds; strip only for Play (App Bundle handles per-device delivery anyway).</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — heavy work in MainActivity instead of MainApplication</h3>
<p>Initializing analytics/DB/crash-reporting in every Activity's <code>onCreate</code> re-runs it on each screen. Process-wide singletons belong in <code>Application.onCreate()</code>, guarded to run once.</p>

<h3>Anti-pattern 2 — calling native React classes before SoLoader.init</h3>
<p>Any reference that triggers a <code>loadLibrary</code> before <code>SoLoader.init()</code> throws. SoLoader is line one of your React setup in <code>onCreate</code>.</p>

<h3>Anti-pattern 3 — hand-editing generated files in Expo projects</h3>
<p>Editing <code>MainApplication</code>/<code>MainActivity</code>/<code>PackageList</code> directly in a prebuild project; changes vanish on the next <code>expo prebuild --clean</code>. Use config plugins.</p>

<h3>Anti-pattern 4 — dropping arm64-v8a to shrink builds</h3>
<p>Filtering out the ABI real devices use. Ships fine to the emulator, crashes for every user. Never remove arm64-v8a from release.</p>

<h3>Anti-pattern 5 — forgetting super.onCreate(null)</h3>
<p>Overriding <code>onCreate</code> and passing <code>savedInstanceState</code> to super with <code>react-native-screens</code>. Crashes on process death / config change. Pass <code>null</code>.</p>

<h3>Anti-pattern 6 — component name typos</h3>
<p>Registering <code>"main"</code> in JS but returning <code>"App"</code> from <code>getMainComponentName()</code>. Instant red screen. Source the name from <code>app.json</code> on both sides.</p>

<h3>Anti-pattern 7 — mixing arch flags</h3>
<p>Setting <code>isNewArchEnabled</code> in code but not the Gradle <code>newArchEnabled</code> property (or the reverse). The build packages one arch, the host expects another. Keep a single source of truth.</p>

<h3>Anti-pattern 8 — assuming MainActivity starts React</h3>
<p>Putting host construction or SoLoader in the Activity. The host is process-scoped; it belongs on <code>MainApplication</code>. Brownfield apps break otherwise.</p>

<h3>Anti-pattern 9 — reaching for catalystInstance on new arch</h3>
<p>Legacy bridge access in bridgeless mode crashes. Program against <code>ReactContext</code>/<code>ReactHost</code> APIs, not the raw <code>CatalystInstance</code>.</p>

<h3>Anti-pattern 10 — no R8 keep rules for native modules</h3>
<p>Release strips reflected module classes → "module doesn't exist" only in production. Add keep rules and test the release build.</p>

<h3>Anti-pattern 11 — blocking onCreate with synchronous network/disk</h3>
<p>Long work in <code>Application.onCreate</code> delays every launch (ANR risk). Defer non-critical init off the main thread or lazily.</p>

<h3>Anti-pattern 12 — editing PackageList.java directly</h3>
<p>It's regenerated every build; your edit is overwritten. Add packages by appending in <code>getPackages()</code> or fix autolinking config.</p>

<h3>Anti-pattern 13 — leaving Flipper/dev tooling in release</h3>
<p>Debug-only init not guarded by <code>BuildConfig.DEBUG</code> bloats and slows release. Gate all dev support behind the flag.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. What do MainActivity and MainApplication each do?</div>
  <div class="qa-answer">
    <p><strong>MainApplication</strong> is the process-level entry (extends <code>Application</code>, implements <code>ReactApplication</code>). It owns the React runtime — the <code>ReactNativeHost</code>/<code>ReactHost</code>, the package list, and in <code>onCreate()</code> it initializes SoLoader and (on new arch) the C++ entry point. <strong>MainActivity</strong> is the launcher screen (extends <code>ReactActivity</code>); it returns the root component name via <code>getMainComponentName()</code> and builds a <code>ReactActivityDelegate</code> that mounts the React root view into the runtime that MainApplication already created.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Trace the boot sequence of an Android RN app.</div>
  <div class="qa-answer">
    <ol>
      <li>OS reads the manifest, instantiates <code>MainApplication</code>, calls <code>onCreate()</code>.</li>
      <li><code>SoLoader.init()</code> loads native <code>.so</code> libs; on new arch <code>DefaultNewArchitectureEntryPoint.load()</code> runs.</li>
      <li>The launcher <code>MainActivity</code> is created; <code>ReactActivity.onCreate</code> builds the delegate.</li>
      <li>The delegate asks the host for a <code>ReactInstanceManager</code>/<code>ReactHost</code> and calls <code>loadApp(getMainComponentName())</code>.</li>
      <li>A <code>ReactRootView</code> starts the app; the JS engine (Hermes) evaluates the bundle.</li>
      <li><code>AppRegistry.registerComponent(name, ...)</code> matches the name and mounts your root component.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. What must getMainComponentName() match, and what happens if it doesn't?</div>
  <div class="qa-answer">
    <p>It must equal the name passed to <code>AppRegistry.registerComponent</code> in JS, which by convention comes from <code>app.json</code>'s <code>"name"</code>. A mismatch throws "Application &lt;name&gt; has not been registered" — a red screen at launch. It is case-sensitive.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. What is SoLoader and why call it first?</div>
  <div class="qa-answer">
    <p>SoLoader is Facebook's native-library loader. <code>SoLoader.init()</code> registers where the packaged <code>.so</code> files live so later <code>SoLoader.loadLibrary("reactnativejni")</code> calls can <code>dlopen</code> them and resolve dependencies (handling old-Android and exopackage quirks). It must run before any React class touches native code, or you get <code>UnsatisfiedLinkError</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. How does PackageList get populated?</div>
  <div class="qa-answer">
    <p>By <strong>autolinking</strong>. At build time the RN CLI / Gradle plugin scans <code>node_modules</code> for packages declaring Android native code and codegens <code>PackageList.java</code> in the generated build folder, one <code>ReactPackage</code> per library. Your <code>getPackages()</code> returns <code>PackageList(this).packages</code> plus any custom packages you append. You never edit the generated file.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How do you register a custom local native module on Android?</div>
  <div class="qa-answer">
    <p>Write a class implementing <code>ReactPackage</code> whose <code>createNativeModules</code> returns your module instance(s), then append <code>packages.add(MyPackage())</code> inside <code>getPackages()</code> after the autolinked list. On new arch you also provide <code>ReactModuleInfo</code> with <code>isTurboModule=true</code> for lazy TurboModule resolution.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. What is JNI and how does RN use it?</div>
  <div class="qa-answer">
    <p>JNI (Java Native Interface) is the standard ABI letting Java/Kotlin call C/C++ and back. RN wraps raw JNI with <strong>fbjni</strong> (<code>libfbjni.so</code>). The C++ core — <code>libreactnativejni.so</code> (bridge/JSI glue), <code>libjsi.so</code>, and the engine <code>libhermes.so</code>/JSC — is reached from Kotlin through JNI. It's the seam where the managed Java world crosses into the native React runtime.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Hermes vs JSC — what changes at boot?</div>
  <div class="qa-answer">
    <p>Hermes is the default engine and precompiles the JS bundle to <strong>bytecode</strong> via <code>hermesc</code> at build time, so the device skips JS parsing/compiling at startup — faster time-to-interactive, lower memory. JSC runs plain JS source. Selection is the <code>hermesEnabled</code> Gradle flag; the matching <code>.so</code> is packaged and <code>isHermesEnabled</code> reflects it. Hermes also changes debugging (Hermes inspector vs legacy remote JS debugging).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Old arch vs new arch — what do these files reveal?</div>
  <div class="qa-answer">
    <p>Old arch (Paper): the host is a <code>ReactNativeHost</code>, JS↔native goes over the async <strong>Bridge</strong> (<code>CatalystInstance</code>, JSON-serialized, eager modules). New arch: the host is a <code>ReactHost</code> (via <code>DefaultReactHost</code>), <code>onCreate</code> calls <code>DefaultNewArchitectureEntryPoint.load()</code>, and JS↔native uses <strong>JSI</strong> directly with <strong>TurboModules</strong> (lazy) and <strong>Fabric</strong> (the <code>fabricEnabled</code> flag in the delegate), optionally <strong>bridgeless</strong> with no bridge object. The two files stay the same shape; the flags and host type flip. For the conceptual deep dive see the <code>rn-architecture</code> topic.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. What are ABIs and why do apps crash on real devices but not emulators?</div>
  <div class="qa-answer">
    <p>ABIs are CPU architectures the <code>.so</code> libs are compiled for: <code>arm64-v8a</code> (modern phones), <code>armeabi-v7a</code>, <code>x86</code>/<code>x86_64</code> (emulators). <code>abiFilters</code> and ABI splits in <code>build.gradle</code> decide which ship, landing under <code>jniLibs/&lt;abi&gt;/</code>. If arm64-v8a is filtered out, the app runs on an x86 emulator but throws <code>UnsatisfiedLinkError</code> on an arm phone. Play App Bundles deliver only the device's ABI automatically.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Why is heavy initialization put in MainApplication, not MainActivity?</div>
  <div class="qa-answer">
    <p>Because <code>Application.onCreate()</code> runs once per process, before any UI, while an Activity's <code>onCreate</code> runs for every screen (and re-runs on recreation). Process-wide singletons — the React host, SoLoader, crash reporting, analytics — belong on <code>MainApplication</code> so they exist for the app's lifetime and back any number of activities/root views.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. In an Expo project, how do you customize these files without losing edits?</div>
  <div class="qa-answer">
    <p>You don't hand-edit them — <code>expo prebuild --clean</code> regenerates them. Expo wraps the host (<code>ReactNativeHostWrapper</code>, <code>ApplicationLifecycleDispatcher.onApplicationCreate</code>). Instead write a <strong>config plugin</strong> using <code>withMainApplication</code>/<code>withMainActivity</code> mods, or set flags like <code>newArchEnabled</code>/<code>hermesEnabled</code> through <code>expo-build-properties</code>. The plugin re-applies on every prebuild so the change survives.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. What does the ReactActivityDelegate do, and what is fabricEnabled?</div>
  <div class="qa-answer">
    <p>The delegate is where <code>ReactActivity</code> defers the real work of creating and mounting the React root view (and forwarding lifecycle/back/permission callbacks). <code>DefaultReactActivityDelegate</code> is the arch-aware default; the <code>fabricEnabled</code> argument tells it to build a Fabric-backed root view when the new architecture is on, versus a legacy Paper root view otherwise.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. A native module works on the emulator but "doesn't exist" on a phone in release. Diagnose it.</div>
  <div class="qa-answer">
    <ol>
      <li>Check ABIs — is arm64-v8a shipped? Missing <code>.so</code> gives <code>UnsatisfiedLinkError</code>.</li>
      <li>Check R8/ProGuard — a reflected module class stripped in release needs keep rules.</li>
      <li>Confirm the package is in <code>getPackages()</code> / autolinked (<code>PackageList</code>).</li>
      <li>Verify Gradle arch flags match the host (<code>newArchEnabled</code>).</li>
      <li>Read logcat around <code>MainApplication.onCreate</code> for load failures.</li>
    </ol>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You separate process scope (MainApplication) from screen scope (MainActivity).</li>
    <li>You can trace OS → SoLoader → host → delegate → ReactRootView → AppRegistry.</li>
    <li>You know the three names (app.json / registerComponent / getMainComponentName) must match.</li>
    <li>You explain autolinking generating PackageList and how to add a custom package.</li>
    <li>You name the native stack: SoLoader, JNI/fbjni, libreactnativejni, libhermes.</li>
    <li>You contrast old-arch ReactNativeHost/Bridge with new-arch ReactHost/JSI/Fabric/bridgeless.</li>
    <li>You reason about ABIs and why arm64-v8a must ship.</li>
    <li>You know Expo generates these files and edit them via config plugins.</li>
  </ul>
</div>
` },

  ]
});
