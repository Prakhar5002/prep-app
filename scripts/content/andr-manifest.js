window.PREP_SITE.registerTopic({
  id: "andr-manifest",
  module: "Android Native (Deep)",
  title: "Manifest, Permissions & Resources",
  estimatedReadTime: "24 min",
  tags: ["androidmanifest","permissions","intent-filter","resources","res","drawable","mipmap","deep-linking","app-links","exported","queries","manifest-merger","fileprovider","adaptive-icons","splash-screen","values-night","network-security-config","expo","config-plugin"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">The manifest is the app's OS contract — permissions, features, and the four components (activity/service/receiver/provider) made reachable by intent-filters; <code>res/</code> supplies the right asset per device via qualifier folders and the <code>R</code> class; the merger folds in every library's manifest; and on Expo all of it is generated from <code>app.json</code>.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Location:</strong> <code>android/app/src/main/AndroidManifest.xml</code>; the shipped file is the <strong>merged</strong> one in <code>build/intermediates/merged_manifests/&lt;variant&gt;/</code>.</li>
    <li><strong>Root:</strong> <code>&lt;manifest&gt;</code> with <code>xmlns:android</code> + <code>xmlns:tools</code>; app identity now comes from <code>applicationId</code>/<code>namespace</code> in <code>build.gradle</code>, not the legacy <code>package</code> attribute.</li>
    <li><strong>Permissions:</strong> <code>&lt;uses-permission&gt;</code>; normal = auto-granted (INTERNET), dangerous = manifest + runtime <code>PermissionsAndroid.request</code> on API 23+ (CAMERA, ACCESS_FINE_LOCATION, RECORD_AUDIO, POST_NOTIFICATIONS on 33+). <code>&lt;uses-feature required="false"&gt;</code> keeps the app installable on devices lacking the hardware.</li>
    <li><strong>&lt;application&gt; attrs:</strong> <code>name</code> (=.MainApplication), <code>label</code>, <code>icon</code>/<code>roundIcon</code> (@mipmap), <code>theme</code>, <code>allowBackup</code> (set false for security), <code>usesCleartextTraffic</code>, <code>networkSecurityConfig</code> (@xml), <code>largeHeap</code>.</li>
    <li><strong>Four components:</strong> <code>&lt;activity&gt;</code> (MainActivity: <code>exported</code>, <code>launchMode</code> singleTask/singleTop, <code>configChanges</code>, <code>windowSoftInputMode</code>), <code>&lt;service&gt;</code>, <code>&lt;receiver&gt;</code> (BroadcastReceiver), <code>&lt;provider&gt;</code> (ContentProvider / FileProvider).</li>
    <li><strong>Intent-filters:</strong> MAIN + LAUNCHER = home entry; VIEW + BROWSABLE + DEFAULT + <code>&lt;data scheme host&gt;</code> = deep link. <code>autoVerify="true"</code> on an https filter = App Link, verified against <code>assetlinks.json</code> signing fingerprint → opens app directly, no chooser.</li>
    <li><strong>android:exported</strong> is <strong>mandatory on API 31+</strong> for any component with an intent-filter — build fails otherwise; true only for real external entry points, false for everything internal.</li>
    <li><strong>&lt;queries&gt; (API 30+):</strong> declare intents/packages you inspect, or <code>Linking.canOpenURL</code>/<code>resolveActivity</code> silently return false/null.</li>
    <li><strong>Merger priority:</strong> build-variant &gt; main &gt; library; conflicts fail the build. <code>tools:replace</code> overrides, <code>tools:node="remove"</code> strips an injected permission, <code>tools:overrideLibrary</code> accepts higher minSdk. <code>tools:</code> is stripped from the APK.</li>
    <li><strong>res/ folders:</strong> <code>drawable*/</code>, <code>mipmap-*/</code> (launcher icons kept at all densities; <code>mipmap-anydpi-v26/ic_launcher.xml</code> = adaptive icon with foreground/background/monochrome), <code>values*/</code> (strings, colors, styles/themes, dimens), <code>values-night/</code> for dark mode, density/qualifier folders (<code>-hdpi</code>..<code>-xxxhdpi</code>, <code>-v26</code>, <code>-land</code>, locale), <code>xml/</code> (network_security_config, file_paths), <code>raw/</code>.</li>
    <li><strong>R class:</strong> every resource → integer ID; <code>@type/name</code> in XML, <code>R.type.name</code> in code. Missing qualifier match falls back silently to the default.</li>
    <li><strong>assets/ vs res/raw/:</strong> raw = by <code>R.raw.*</code> ID, flat, qualifier-aware; assets = by path via AssetManager, arbitrary tree, no IDs — the RN JS bundle (<code>index.android.bundle</code>) lives in assets.</li>
    <li><strong>Splash:</strong> classic = <code>android:windowBackground</code> layer-list drawable on the launch theme (paints before JS); modern = AndroidX <code>core-splashscreen</code> + <code>installSplashScreen()</code> / <code>setKeepOnScreenCondition</code>.</li>
    <li><strong>Expo:</strong> manifest, icons, permissions, intent filters, splash, colors all generated from <code>app.json</code> (<code>android.permissions</code>, <code>android.intentFilters</code>, <code>android.adaptiveIcon</code>, <code>expo-splash-screen</code>, <code>expo-build-properties</code>) and overwritten by prebuild; hand edits belong in a <strong>config plugin</strong> (<code>withAndroidManifest</code>).</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Debugging permissions or components from your own <code>src/main</code> manifest and forgetting it's the MERGED manifest that ships.</strong> Libraries inject permissions (AD_ID, location), providers (FileProvider), and activities into the merged output at <code>build/intermediates/merged_manifests/</code> — read that file (or Android Studio's Merged Manifest tab) and strip unwanted entries with <code>tools:node="remove"</code>. (Related traps: forgetting <code>&lt;queries&gt;</code> on Android 11 breaks <code>canOpenURL</code>; forgetting the runtime request makes a declared dangerous permission do nothing; and in Expo, hand edits vanish on <code>expo prebuild --clean</code>.)</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"The manifest is the app's contract with the OS — it declares permissions, hardware needs, and registers the four components; intent-filters make them reachable. On Android 12+ any component with an intent-filter must set <code>android:exported</code> explicitly, and I default that to false unless another app genuinely needs to launch it."</div>
  <div class="revision-say">"The manifest that ships is the merged one — build-variant over main over library manifests — so a library can inject a permission or a FileProvider. I inspect the merged manifest and use <code>tools:replace</code> and <code>tools:node=&quot;remove&quot;</code> to resolve conflicts and strip unwanted entries."</div>
  <div class="revision-say">"res/ decouples assets from code via qualifier folders — density, <code>-night</code>, locale — so one APK serves every device; each resource gets an <code>R</code>-class ID. Launcher icons stay in <code>mipmap</code> so all densities survive stripping. In my Expo apps all of this is generated from <code>app.json</code>, and anything it can't express I put in a config plugin."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What the manifest is</h3>
<p><code>AndroidManifest.xml</code> lives at <code>android/app/src/main/AndroidManifest.xml</code> in a React Native project. It is read by the Android <strong>PackageManager</strong> at install time and by the system whenever it needs to launch or bind to one of your components. Nothing your app can do — request the camera, show a launcher icon, respond to a deep link, run a background service — happens unless it is declared here.</p>

<h3>Why it exists</h3>
<ul>
  <li><strong>Security &amp; least privilege</strong> — the OS must know up-front what permissions and hardware an app wants, so the user (and Play Store) can see them.</li>
  <li><strong>Component discovery</strong> — Android starts components by <em>intent</em>, not by class reference. The manifest's <code>&lt;intent-filter&gt;</code> entries tell the system "this activity can handle a VIEW of an https URL" or "this is the launcher entry."</li>
  <li><strong>Configuration</strong> — theme, icon, label, backup policy, network security, and hundreds of flags that shape how the app runs.</li>
</ul>

<h3>Why <code>res/</code> is separate from code</h3>
<p>Android decouples assets from logic so the same APK can serve a tiny phone and a 10-inch tablet, light and dark mode, English and Hindi, without <code>if</code> statements. You put a string in <code>values/strings.xml</code>, a Hindi one in <code>values-hi/strings.xml</code>, and reference both as <code>@string/app_name</code>. The <strong>resource resolution</strong> system picks the best match at runtime based on the device configuration. This is why you almost never hardcode a color, dimension, or string in Android UI code.</p>

<h3>The React Native angle</h3>
<p>In bare RN, you own and hand-edit these files. A native module you install (via autolinking) ships its <em>own</em> manifest and resources, and the <strong>manifest merger</strong> folds them into yours at build time — which is why installing a library can silently add a permission. Understanding the merged output is essential for debugging "why does my app request <code>ACCESS_FINE_LOCATION</code> when I never asked for it."</p>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — you rarely edit these by hand</div>
  <p>In an Expo prebuild project (like <code>sw-mobile</code> or <code>sw-ticketing</code>), <code>AndroidManifest.xml</code>, the launcher icons, <code>colors.xml</code>, <code>strings.xml</code>, and the splash resources are all <strong>generated from <code>app.json</code>/<code>app.config.js</code></strong> during <code>expo prebuild</code>. Hand edits to <code>android/</code> get wiped on the next <code>expo prebuild --clean</code>. The correct place for a manifest change is <code>app.json</code> (for the common cases) or a <strong>config plugin</strong> (for anything <code>app.json</code> doesn't expose). We'll map each hand-edit to its <code>app.json</code> equivalent throughout.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>The manifest as the OS-facing contract</h3>
<div class="diagram">
<pre>
  AndroidManifest.xml  (the contract the OS reads at install + launch)
  ┌───────────────────────────────────────────────────────────┐
  │ &lt;manifest package="com.myapp"&gt;                             │
  │   &lt;uses-permission android:name="...CAMERA"/&gt;   ── may do  │
  │   &lt;uses-feature   android:name="...camera"/&gt;   ── needs HW │
  │   &lt;queries&gt; ... &lt;/queries&gt;                      ── can see  │
  │                                                            │
  │   &lt;application  name=".MainApplication"                    │
  │                 label / icon / theme / allowBackup&gt;        │
  │      ┌── the FOUR component types ──────────────────────┐  │
  │      │ &lt;activity&gt;   MainActivity  (+ intent-filters)    │  │
  │      │ &lt;service&gt;    background / bound work             │  │
  │      │ &lt;receiver&gt;   BroadcastReceiver                   │  │
  │      │ &lt;provider&gt;   ContentProvider / FileProvider      │  │
  │      └──────────────────────────────────────────────────┘  │
  │   &lt;/application&gt;                                            │
  │ &lt;/manifest&gt;                                                │
  └───────────────────────────────────────────────────────────┘
</pre>
</div>

<h3>How an intent-filter turns a component into an entry point</h3>
<div class="diagram">
<pre>
  User taps launcher icon        Browser opens https://app.myco.com/x
        │                                  │
        ▼                                  ▼
  Intent { action=MAIN,            Intent { action=VIEW,
           category=LAUNCHER }              data=https://app.myco.com/x,
        │                                   category=BROWSABLE }
        │   PackageManager matches against every &lt;intent-filter&gt;
        ▼                                  ▼
  MainActivity's MAIN/LAUNCHER     MainActivity's VIEW/&lt;data&gt; filter
  filter → app opens on home       → app opens on that screen (deep link)
</pre>
</div>

<h3>Manifest merging — three sources fold into one</h3>
<div class="diagram">
<pre>
  library manifests            build-variant manifests
  (node_modules/*/android)     src/debug  src/release
        │                              │
        └──────────┐        ┌──────────┘
                   ▼        ▼
             src/main/AndroidManifest.xml   (your manifest — highest priority)
                       │  Manifest Merger (Gradle)
                       ▼
        build/intermediates/merged_manifests/&lt;variant&gt;/AndroidManifest.xml
                       │  (this is what actually ships in the APK/AAB)
</pre>
</div>

<h3>Resource resolution — Android picks the best-matching folder</h3>
<div class="diagram">
<pre>
  Device: xxhdpi, night mode, portrait, en-US
                   │
   You ask for:  @drawable/logo   @color/bg   @string/title
                   │
   Android scans qualifier folders, best match wins:
     drawable-xxhdpi/ &gt; drawable-xhdpi/ &gt; drawable/
     values-night/    &gt; values/
     values-hi/       (skipped — device is en)
                   ▼
   Resolved asset handed to the view at runtime
</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"The manifest I wrote is the manifest that ships." It is not. The merged manifest in <code>build/intermediates/merged_manifests/</code> is what runs — it contains permissions, activities, and providers injected by every library. Always inspect that file (or the <strong>Merged Manifest</strong> tab in Android Studio) when debugging permission or component surprises.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1 — The &lt;manifest&gt; root and package</h3>
<pre><code class="language-xml">&lt;manifest xmlns:android="http://schemas.android.com/apk/res/android"
          xmlns:tools="http://schemas.android.com/tools"
          package="com.myapp"&gt;
  &lt;!-- everything nests inside here --&gt;
&lt;/manifest&gt;</code></pre>
<p>The <code>package</code> attribute historically defined both the app's install identity and the base for the generated <code>R</code> class. In modern Gradle, the shipping application ID comes from <code>applicationId</code> in <code>android/app/build.gradle</code>, and the <code>R</code>/BuildConfig package comes from the <code>namespace</code> — the manifest <code>package</code> attribute is deprecated for that purpose but still seen. The two <code>xmlns</code> declarations bind the <code>android:</code> and <code>tools:</code> namespaces (the latter is merger-only, stripped from the final APK).</p>

<h3>2 — Permissions and features</h3>
<pre><code class="language-xml">&lt;uses-permission android:name="android.permission.INTERNET"/&gt;
&lt;uses-permission android:name="android.permission.CAMERA"/&gt;
&lt;uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/&gt;
&lt;uses-permission android:name="android.permission.POST_NOTIFICATIONS"/&gt;  &lt;!-- API 33+ --&gt;

&lt;!-- "I use the camera but don't strictly require it" — keeps the app installable
     on camera-less devices; Play uses uses-feature to filter device compatibility --&gt;
&lt;uses-feature android:name="android.hardware.camera" android:required="false"/&gt;</code></pre>
<ul>
  <li><strong>Normal permissions</strong> (e.g. <code>INTERNET</code>, <code>ACCESS_NETWORK_STATE</code>) are granted automatically at install — no prompt.</li>
  <li><strong>Dangerous permissions</strong> (<code>CAMERA</code>, <code>ACCESS_FINE_LOCATION</code>, <code>RECORD_AUDIO</code>, <code>READ_CONTACTS</code>) must <em>also</em> be requested at runtime on API 23+.</li>
  <li><code>&lt;uses-feature&gt;</code> is about hardware, not permission — with <code>required="false"</code> it stops the Play Store from hiding your app from devices lacking that hardware.</li>
</ul>

<h3>3 — The &lt;application&gt; element</h3>
<pre><code class="language-xml">&lt;application
    android:name=".MainApplication"
    android:label="@string/app_name"
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:theme="@style/AppTheme"
    android:allowBackup="false"
    android:usesCleartextTraffic="false"
    android:networkSecurityConfig="@xml/network_security_config"
    android:largeHeap="true"&gt;
  &lt;!-- components go here --&gt;
&lt;/application&gt;</code></pre>
<table>
  <thead><tr><th>Attribute</th><th>Meaning</th></tr></thead>
  <tbody>
    <tr><td><code>android:name</code></td><td>Fully-qualified <code>Application</code> subclass — in RN this is <code>.MainApplication</code>, which creates the <code>ReactNativeHost</code> / <code>ReactHost</code>. If omitted, the base <code>android.app.Application</code> is used.</td></tr>
    <tr><td><code>android:label</code></td><td>User-visible app name (under the icon). Points to <code>@string/app_name</code>.</td></tr>
    <tr><td><code>android:icon</code> / <code>roundIcon</code></td><td>Launcher icon from <code>mipmap-*/</code>; <code>roundIcon</code> used by launchers that request circular icons.</td></tr>
    <tr><td><code>android:theme</code></td><td>Default theme for all activities — controls status bar, window background (splash), and Material styling.</td></tr>
    <tr><td><code>android:allowBackup</code></td><td>Whether Android auto-backup / adb backup can copy app data. Security reviews (VAPT) often require <code>false</code>.</td></tr>
    <tr><td><code>android:usesCleartextTraffic</code></td><td><code>false</code> blocks plain <code>http://</code> traffic app-wide (default false on API 28+). Overridable per-domain via network security config.</td></tr>
    <tr><td><code>android:networkSecurityConfig</code></td><td>Points to an <code>@xml/</code> file defining trust anchors, cleartext exceptions, and certificate pinning.</td></tr>
    <tr><td><code>android:largeHeap</code></td><td>Requests a larger Dalvik/ART heap — used by memory-hungry apps (image-heavy, some RN apps). Costs RAM; not a free win.</td></tr>
  </tbody>
</table>

<h3>4 — The four component types</h3>
<pre><code class="language-xml">&lt;!-- (a) ACTIVITY — a screen. RN apps have one: MainActivity --&gt;
&lt;activity
    android:name=".MainActivity"
    android:exported="true"
    android:launchMode="singleTask"
    android:configChanges="keyboard|keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize|uiMode"
    android:windowSoftInputMode="adjustResize"
    android:theme="@style/AppTheme"&gt;
  &lt;intent-filter&gt;
    &lt;action android:name="android.intent.action.MAIN"/&gt;
    &lt;category android:name="android.intent.category.LAUNCHER"/&gt;
  &lt;/intent-filter&gt;
&lt;/activity&gt;

&lt;!-- (b) SERVICE — background / bound work (headless JS, playback, sync) --&gt;
&lt;service android:name=".MyHeadlessService" android:exported="false"/&gt;

&lt;!-- (c) RECEIVER — a BroadcastReceiver reacting to system/app broadcasts --&gt;
&lt;receiver android:name=".BootReceiver" android:exported="false"&gt;
  &lt;intent-filter&gt;
    &lt;action android:name="android.intent.action.BOOT_COMPLETED"/&gt;
  &lt;/intent-filter&gt;
&lt;/receiver&gt;

&lt;!-- (d) PROVIDER — a ContentProvider; FileProvider shares file:// safely as content:// --&gt;
&lt;provider
    android:name="androidx.core.content.FileProvider"
    android:authorities="com.myapp.fileprovider"
    android:exported="false"
    android:grantUriPermissions="true"&gt;
  &lt;meta-data
      android:name="android.support.FILE_PROVIDER_PATHS"
      android:resource="@xml/file_paths"/&gt;
&lt;/provider&gt;</code></pre>
<ul>
  <li><strong>Activity</strong> — a UI screen. <code>launchMode="singleTask"</code> keeps a single MainActivity instance so a deep link re-enters the existing task rather than stacking a new copy. <code>singleTop</code> reuses the instance only if it's already on top. <code>configChanges</code> lists config changes the activity handles itself (so Android does NOT recreate it) — RN lists orientation/keyboard/uiMode so rotation and dark-mode toggles don't destroy the JS context. <code>windowSoftInputMode="adjustResize"</code> resizes the window when the keyboard appears (so inputs stay visible).</li>
  <li><strong>Service</strong> — long-running or bound work with no UI. Foreground services (playback, location) need a notification and a <code>foregroundServiceType</code> on modern APIs.</li>
  <li><strong>Receiver</strong> — responds to broadcasts (boot completed, connectivity, custom). Manifest-declared receivers are limited on modern Android for implicit broadcasts.</li>
  <li><strong>Provider</strong> — structured data sharing across apps. <code>FileProvider</code> is the one you'll actually touch in RN — it converts a private <code>file://</code> path into a grantable <code>content://</code> URI so you can share/open files (see the <code>sw-ticketing</code> attachment feature).</li>
</ul>

<h3>5 — Deep links and App Links</h3>
<pre><code class="language-xml">&lt;activity android:name=".MainActivity" android:exported="true"&gt;
  &lt;!-- LAUNCHER filter (from above) stays --&gt;

  &lt;!-- Custom-scheme deep link:  myapp://profile/42 --&gt;
  &lt;intent-filter&gt;
    &lt;action android:name="android.intent.action.VIEW"/&gt;
    &lt;category android:name="android.intent.category.DEFAULT"/&gt;
    &lt;category android:name="android.intent.category.BROWSABLE"/&gt;
    &lt;data android:scheme="myapp"/&gt;
  &lt;/intent-filter&gt;

  &lt;!-- Verified App Link (https), autoVerify triggers assetlinks.json check --&gt;
  &lt;intent-filter android:autoVerify="true"&gt;
    &lt;action android:name="android.intent.action.VIEW"/&gt;
    &lt;category android:name="android.intent.category.DEFAULT"/&gt;
    &lt;category android:name="android.intent.category.BROWSABLE"/&gt;
    &lt;data android:scheme="https" android:host="app.myco.com"/&gt;
  &lt;/intent-filter&gt;
&lt;/activity&gt;</code></pre>
<ul>
  <li><code>action.VIEW</code> + <code>category.BROWSABLE</code> = "a browser/other app can hand me this URI." <code>category.DEFAULT</code> is required for implicit intents.</li>
  <li><code>&lt;data&gt;</code> narrows the match: <code>scheme</code>, <code>host</code>, <code>pathPrefix</code>/<code>pathPattern</code>. A custom scheme (<code>myapp://</code>) always opens your app but any app can claim the same scheme — not secure.</li>
  <li><strong>App Links</strong> (<code>autoVerify="true"</code> on an <code>https</code> filter) make Android fetch <code>https://app.myco.com/.well-known/assetlinks.json</code> and verify your app's signing fingerprint. If it matches, the link opens your app <em>directly with no chooser</em>. This is the secure, no-disambiguation path.</li>
</ul>

<h3>6 — Why android:exported is mandatory on Android 12+</h3>
<p>Starting with <strong>Android 12 (API 31)</strong>, any <code>&lt;activity&gt;</code>, <code>&lt;service&gt;</code>, or <code>&lt;receiver&gt;</code> that declares an <code>&lt;intent-filter&gt;</code> <strong>must set <code>android:exported</code> explicitly</strong> — the build fails otherwise (<code>Manifest merger failed : android:exported needs to be explicitly specified</code>). Rationale: a component with an intent-filter is reachable by other apps, and defaulting that to "exported" was a security footgun. Rule of thumb: <code>exported="true"</code> only for components that genuinely need to be launched by other apps (your LAUNCHER activity, deep-link handlers). Everything else → <code>exported="false"</code>.</p>

<h3>7 — Package visibility with &lt;queries&gt; (Android 11+)</h3>
<pre><code class="language-xml">&lt;!-- API 30+ hides most installed apps from you unless you declare intent to see them --&gt;
&lt;queries&gt;
  &lt;!-- I want to know if a browser exists / launch https --&gt;
  &lt;intent&gt;
    &lt;action android:name="android.intent.action.VIEW"/&gt;
    &lt;data android:scheme="https"/&gt;
  &lt;/intent&gt;
  &lt;!-- I want to check for a specific app by package --&gt;
  &lt;package android:name="com.whatsapp"/&gt;
&lt;/queries&gt;</code></pre>
<p>On <strong>Android 11 (API 30)</strong>, <code>PackageManager.queryIntentActivities()</code> and <code>getPackageInfo()</code> stop seeing other apps by default. You must declare <code>&lt;queries&gt;</code> for the packages or intents you inspect — otherwise <code>canOpenURL</code>-style checks (RN <code>Linking.canOpenURL</code>) silently return false and <code>resolveActivity</code> returns null. Very common cause of "the share sheet / open-in-WhatsApp button stopped working on Android 11."</p>

<h3>8 — Manifest merging &amp; the tools: namespace</h3>
<pre><code class="language-xml">&lt;!-- Force YOUR value to win over a library that declares the same attribute --&gt;
&lt;application
    android:allowBackup="false"
    tools:replace="android:allowBackup"&gt; ... &lt;/application&gt;

&lt;!-- Remove a permission a library injected that you don't want --&gt;
&lt;uses-permission android:name="android.permission.AD_ID" tools:node="remove"/&gt;</code></pre>
<p>The merger combines manifests by <strong>priority</strong>: build-variant (<code>src/debug</code>, <code>src/release</code>) &gt; <code>src/main</code> &gt; library (AAR) manifests. When two sources set the same attribute to different values, the build fails with a merge conflict unless you resolve it. The <code>tools:</code> markers steer this:</p>
<ul>
  <li><code>tools:replace="attr"</code> — your value overrides a lower-priority one.</li>
  <li><code>tools:node="remove"</code> — delete an element a library injected (e.g., an ad-ID permission).</li>
  <li><code>tools:node="merge"</code> / <code>replace</code> / <code>strict</code> — control node-level merge behavior.</li>
  <li><code>tools:overrideLibrary</code> — accept a library with a higher <code>minSdk</code> than yours.</li>
</ul>
<p>The merged result is written to <code>android/app/build/intermediates/merged_manifests/&lt;variant&gt;/AndroidManifest.xml</code>. Android Studio's manifest editor has a <strong>Merged Manifest</strong> tab that shows the final document with the source of every line.</p>

<h3>9 — The res/ folder, end to end</h3>
<pre><code class="language-text">android/app/src/main/res/
├─ drawable/                 density-independent vectors + shared images
├─ drawable-hdpi..xxxhdpi/   density-bucketed raster PNGs
├─ mipmap-mdpi..xxxhdpi/     launcher icons (kept in mipmap, not drawable)
├─ mipmap-anydpi-v26/        adaptive icon XML (ic_launcher.xml) for API 26+
├─ values/                   strings.xml colors.xml styles.xml dimens.xml
├─ values-night/             dark-mode overrides (auto-selected in dark mode)
├─ values-land/              landscape overrides
├─ values-v23/  values-v26/  API-level overrides
├─ xml/                      network_security_config.xml, file_paths.xml
└─ raw/                      arbitrary files kept as-is, referenced by @raw/id</code></pre>
<p><strong>Why launcher icons live in <code>mipmap-*/</code>, not <code>drawable-*/</code>:</strong> launchers can display an icon at a higher density than the device's own (a hdpi device showing an xhdpi icon). The build tools strip unused densities from <code>drawable</code> for the device but keep all densities of <code>mipmap</code>, so the launcher always has a crisp icon.</p>

<h3>10 — values/ files and adaptive icons</h3>
<pre><code class="language-xml">&lt;!-- res/values/strings.xml --&gt;
&lt;resources&gt;
  &lt;string name="app_name"&gt;SmartWorks&lt;/string&gt;
&lt;/resources&gt;

&lt;!-- res/values/colors.xml --&gt;
&lt;resources&gt;
  &lt;color name="colorPrimary"&gt;#E5860B&lt;/color&gt;
  &lt;color name="ic_launcher_background"&gt;#0B1220&lt;/color&gt;
&lt;/resources&gt;

&lt;!-- res/values/styles.xml (themes) --&gt;
&lt;resources&gt;
  &lt;style name="AppTheme" parent="Theme.AppCompat.DayNight.NoActionBar"&gt;
    &lt;item name="android:windowBackground"&gt;@drawable/splashscreen&lt;/item&gt;
    &lt;item name="colorPrimary"&gt;@color/colorPrimary&lt;/item&gt;
  &lt;/style&gt;
&lt;/resources&gt;

&lt;!-- res/mipmap-anydpi-v26/ic_launcher.xml — the adaptive icon --&gt;
&lt;adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"&gt;
  &lt;background android:drawable="@color/ic_launcher_background"/&gt;
  &lt;foreground android:drawable="@mipmap/ic_launcher_foreground"/&gt;
  &lt;monochrome android:drawable="@mipmap/ic_launcher_monochrome"/&gt;  &lt;!-- themed icons, API 33+ --&gt;
&lt;/adaptive-icon&gt;</code></pre>
<p><strong>Adaptive icons</strong> (API 26+) split the icon into a <code>foreground</code> and <code>background</code> layer, each larger than the visible area, so the launcher can mask them into a circle, squircle, or rounded square and animate them. The <code>monochrome</code> layer (API 33+) feeds Android 13 "themed icons." <code>dimens.xml</code> holds named dimensions (<code>@dimen/spacing_md</code>) so spacing scales across screen sizes.</p>

<h3>11 — xml/ configs and R class</h3>
<pre><code class="language-xml">&lt;!-- res/xml/network_security_config.xml --&gt;
&lt;network-security-config&gt;
  &lt;domain-config cleartextTrafficPermitted="false"&gt;
    &lt;domain includeSubdomains="true"&gt;api.myco.com&lt;/domain&gt;
    &lt;pin-set&gt;
      &lt;pin digest="SHA-256"&gt;base64PublicKeyHash=&lt;/pin&gt;
    &lt;/pin-set&gt;
  &lt;/domain-config&gt;
&lt;/network-security-config&gt;

&lt;!-- res/xml/file_paths.xml (referenced by the FileProvider above) --&gt;
&lt;paths&gt;
  &lt;cache-path name="shared" path="."/&gt;
  &lt;external-files-path name="downloads" path="downloads/"/&gt;
&lt;/paths&gt;</code></pre>
<p>Every resource compiles to an integer constant in the generated <strong><code>R</code> class</strong> — <code>R.string.app_name</code>, <code>R.color.colorPrimary</code>, <code>R.drawable.logo</code>, <code>R.mipmap.ic_launcher</code>, <code>R.xml.file_paths</code>. XML references them as <code>@string/app_name</code>; Kotlin/Java as <code>R.string.app_name</code>; native RN modules resolve <code>getResources().getIdentifier(...)</code> when they need a name lookup.</p>

<h3>12 — assets/ vs res/raw/</h3>
<table>
  <thead><tr><th></th><th><code>res/raw/</code></th><th><code>assets/</code></th></tr></thead>
  <tbody>
    <tr><td>Access</td><td>By resource ID: <code>R.raw.myfile</code></td><td>By path/filename via <code>AssetManager</code></td></tr>
    <tr><td>Structure</td><td>Flat, no subfolders</td><td>Arbitrary folder tree preserved</td></tr>
    <tr><td>Qualifiers</td><td>Yes (e.g. <code>raw-hi/</code>)</td><td>No — raw bytes, no resolution</td></tr>
    <tr><td>Typical use</td><td>A bundled sound, a JSON config referenced by ID</td><td>Fonts, the RN JS bundle (<code>index.android.bundle</code>), web content, large blobs</td></tr>
  </tbody>
</table>
<p>The compiled JS bundle for a release RN build lands in <code>assets/</code> (as <code>index.android.bundle</code>), which is why it's read through <code>AssetManager</code>, not <code>R.raw</code>.</p>

<h3>13 — Splash screen</h3>
<p><strong>Classic approach:</strong> set <code>android:windowBackground</code> on the launch theme to a <code>@drawable</code> (a layer-list with a background color + centered logo). The window shows this the instant the process starts, before any view or JS loads — zero-latency splash. RN libraries like <code>react-native-splash-screen</code> then keep it visible until JS calls <code>hide()</code>.</p>
<pre><code class="language-xml">&lt;!-- res/drawable/splashscreen.xml --&gt;
&lt;layer-list xmlns:android="http://schemas.android.com/apk/res/android"&gt;
  &lt;item android:drawable="@color/splashscreen_background"/&gt;
  &lt;item android:gravity="center" android:drawable="@mipmap/splashscreen_logo"/&gt;
&lt;/layer-list&gt;</code></pre>
<p><strong>Modern approach (API 31+ / AndroidX <code>SplashScreen</code>):</strong> the <code>core-splashscreen</code> library backports the Android 12 splash API, driven by theme attributes <code>windowSplashScreenBackground</code> and <code>windowSplashScreenAnimatedIcon</code>, with <code>installSplashScreen()</code> called in <code>MainActivity.onCreate</code> before <code>super</code>. You can hold it via <code>setKeepOnScreenCondition</code> until RN is ready.</p>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — every one of these comes from app.json</div>
  <p>In Expo prebuild, you don't touch these files. Permissions come from <code>android.permissions</code>; deep links from <code>android.intentFilters</code> (and <code>scheme</code>); the icon from <code>android.adaptiveIcon</code> (foregroundImage / backgroundColor); label from <code>name</code>; splash from the <code>expo-splash-screen</code> plugin (image + backgroundColor, which writes <code>colors.xml</code> + the splash drawable + <code>values-night</code>); cleartext / network config from <code>expo-build-properties</code>. Anything with no <code>app.json</code> key — a custom <code>&lt;service&gt;</code>, a <code>tools:replace</code>, an extra <code>&lt;queries&gt;</code> entry — needs a <strong>config plugin</strong> using the <code>withAndroidManifest</code> / <code>withStringsXml</code> / <code>dangerouslyAddRawExperience</code>-style mods. Hand edits to <code>android/</code> are discarded on <code>expo prebuild --clean</code>.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — the minimal RN MainActivity + launcher</h3>
<pre><code class="language-xml">&lt;activity
    android:name=".MainActivity"
    android:exported="true"
    android:launchMode="singleTask"
    android:configChanges="keyboard|keyboardHidden|orientation|screenSize|uiMode"
    android:windowSoftInputMode="adjustResize"&gt;
  &lt;intent-filter&gt;
    &lt;action android:name="android.intent.action.MAIN"/&gt;
    &lt;category android:name="android.intent.category.LAUNCHER"/&gt;
  &lt;/intent-filter&gt;
&lt;/activity&gt;</code></pre>
<p>This is the beating heart of an RN app: one activity, exported, singleTask, with the MAIN/LAUNCHER filter that makes it the home-screen entry point.</p>

<h3>Example 2 — declaring a runtime (dangerous) permission and requesting it in RN</h3>
<pre><code class="language-xml">&lt;uses-permission android:name="android.permission.CAMERA"/&gt;</code></pre>
<pre><code class="language-ts">import { PermissionsAndroid, Platform } from 'react-native';

async function ensureCamera() {
  if (Platform.OS !== 'android') return true;
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
    { title: 'Camera', message: 'We need the camera to scan.', buttonPositive: 'OK' }
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}</code></pre>
<p>Declaring it in the manifest is necessary but <strong>not sufficient</strong> — dangerous permissions also need the runtime prompt on API 23+.</p>

<h3>Example 3 — a custom-scheme deep link (myapp://booking/42)</h3>
<pre><code class="language-xml">&lt;intent-filter&gt;
  &lt;action android:name="android.intent.action.VIEW"/&gt;
  &lt;category android:name="android.intent.category.DEFAULT"/&gt;
  &lt;category android:name="android.intent.category.BROWSABLE"/&gt;
  &lt;data android:scheme="myapp" android:host="booking"/&gt;
&lt;/intent-filter&gt;</code></pre>
<pre><code class="language-bash"># Test it from the shell without a browser:
adb shell am start -W -a android.intent.action.VIEW -d "myapp://booking/42" com.myapp</code></pre>

<h3>Example 4 — a verified App Link + assetlinks.json</h3>
<pre><code class="language-xml">&lt;intent-filter android:autoVerify="true"&gt;
  &lt;action android:name="android.intent.action.VIEW"/&gt;
  &lt;category android:name="android.intent.category.DEFAULT"/&gt;
  &lt;category android:name="android.intent.category.BROWSABLE"/&gt;
  &lt;data android:scheme="https" android:host="app.myco.com" android:pathPrefix="/booking"/&gt;
&lt;/intent-filter&gt;</code></pre>
<pre><code class="language-json">// hosted at https://app.myco.com/.well-known/assetlinks.json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.myapp",
    "sha256_cert_fingerprints": ["AB:CD:EF:...signing cert SHA-256..."]
  }
}]</code></pre>
<p>The fingerprint must match the <strong>signing</strong> cert of the installed build (Play App Signing key for production). Mismatch = the link silently opens in the browser instead of the app.</p>

<h3>Example 5 — FileProvider to share a downloaded file</h3>
<pre><code class="language-xml">&lt;provider
    android:name="androidx.core.content.FileProvider"
    android:authorities="com.myapp.fileprovider"
    android:exported="false"
    android:grantUriPermissions="true"&gt;
  &lt;meta-data android:name="android.support.FILE_PROVIDER_PATHS" android:resource="@xml/file_paths"/&gt;
&lt;/provider&gt;</code></pre>
<pre><code class="language-xml">&lt;!-- res/xml/file_paths.xml --&gt;
&lt;paths&gt;
  &lt;cache-path name="shared_files" path="."/&gt;
&lt;/paths&gt;</code></pre>
<p>This is exactly the mechanism behind the <code>sw-ticketing</code> attachment open/share feature — a private cache file becomes a grantable <code>content://com.myapp.fileprovider/shared_files/report.pdf</code> URI that a viewer app can read.</p>

<h3>Example 6 — a &lt;queries&gt; block so Linking.canOpenURL works on Android 11+</h3>
<pre><code class="language-xml">&lt;queries&gt;
  &lt;intent&gt;
    &lt;action android:name="android.intent.action.VIEW"/&gt;
    &lt;data android:scheme="https"/&gt;
  &lt;/intent&gt;
  &lt;intent&gt;
    &lt;action android:name="android.intent.action.SENDTO"/&gt;
    &lt;data android:scheme="mailto"/&gt;
  &lt;/intent&gt;
  &lt;package android:name="com.whatsapp"/&gt;
&lt;/queries&gt;</code></pre>
<pre><code class="language-ts">import { Linking } from 'react-native';
const can = await Linking.canOpenURL('whatsapp://send?text=hi'); // false w/o the &lt;package&gt; entry on API 30+</code></pre>

<h3>Example 7 — resolving a manifest merge conflict with tools:replace</h3>
<pre><code class="language-text">Manifest merger failed : Attribute application@allowBackup value=(false)
  is also present at [com.somelib:core] AndroidManifest.xml value=(true).
  Suggestion: add 'tools:replace="android:allowBackup"' to &lt;application&gt;</code></pre>
<pre><code class="language-xml">&lt;application android:allowBackup="false" tools:replace="android:allowBackup"&gt; ... &lt;/application&gt;</code></pre>

<h3>Example 8 — stripping a permission a library injected</h3>
<pre><code class="language-xml">&lt;!-- an ads/analytics SDK pulled in AD_ID; remove it for a privacy-clean build --&gt;
&lt;uses-permission android:name="com.google.android.gms.permission.AD_ID" tools:node="remove"/&gt;</code></pre>

<h3>Example 9 — dark-mode colors via values-night</h3>
<pre><code class="language-xml">&lt;!-- res/values/colors.xml --&gt;
&lt;color name="screen_bg"&gt;#FFFFFF&lt;/color&gt;

&lt;!-- res/values-night/colors.xml --&gt;
&lt;color name="screen_bg"&gt;#0B1220&lt;/color&gt;</code></pre>
<p>A view referencing <code>@color/screen_bg</code> flips automatically when the system switches to dark mode — no code, no conditional. The dashboard's dark theme and its light-theme variant map cleanly onto this <code>values</code> vs <code>values-night</code> split.</p>

<h3>Example 10 — adaptive launcher icon</h3>
<pre><code class="language-xml">&lt;!-- res/mipmap-anydpi-v26/ic_launcher.xml --&gt;
&lt;adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"&gt;
  &lt;background android:drawable="@color/ic_launcher_background"/&gt;
  &lt;foreground android:drawable="@mipmap/ic_launcher_foreground"/&gt;
&lt;/adaptive-icon&gt;</code></pre>
<p>Pre-API-26 devices fall back to the raster <code>ic_launcher.png</code> in each <code>mipmap-*dpi/</code> folder; API 26+ uses this vector-composited adaptive pair.</p>

<h3>Example 11 — the Expo equivalent (app.json), the whole picture at once</h3>
<pre><code class="language-json">{
  "expo": {
    "name": "SmartWorks",
    "scheme": "smartworks",
    "android": {
      "package": "com.workctrl.smartworks",
      "permissions": ["CAMERA", "ACCESS_FINE_LOCATION", "POST_NOTIFICATIONS"],
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-foreground.png",
        "backgroundColor": "#0B1220"
      },
      "intentFilters": [{
        "action": "VIEW",
        "autoVerify": true,
        "data": [{ "scheme": "https", "host": "app.myco.com", "pathPrefix": "/booking" }],
        "category": ["BROWSABLE", "DEFAULT"]
      }]
    },
    "plugins": [
      ["expo-splash-screen", { "image": "./assets/splash.png", "backgroundColor": "#0B1220" }],
      ["expo-build-properties", { "android": { "usesCleartextTraffic": false } }]
    ]
  }
}</code></pre>
<p>Running <code>expo prebuild</code> turns this into the exact manifest + <code>res/</code> files shown above. That is why editing <code>android/</code> by hand in these projects is a trap.</p>

<h3>Example 12 — a config plugin for the thing app.json can't express</h3>
<pre><code class="language-ts">// plugins/withCustomQueries.js — add a &lt;queries&gt; entry Expo doesn't expose
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withCustomQueries(config) {
  return withAndroidManifest(config, (cfg) =&gt; {
    const manifest = cfg.modResults.manifest;
    manifest.queries = manifest.queries || [{}];
    manifest.queries[0].package = manifest.queries[0].package || [];
    manifest.queries[0].package.push({ $: { 'android:name': 'com.whatsapp' } });
    return cfg;
  });
};</code></pre>
<p>This mod runs during prebuild and rewrites the generated manifest — the durable way to make a native manifest change survive <code>--clean</code> in a managed workflow.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. android:exported missing on Android 12+</h3>
<p>Any component with an <code>&lt;intent-filter&gt;</code> and no explicit <code>android:exported</code> fails the build on API 31+. The error names the offending component. Add <code>exported="true"</code> only if other apps must reach it; else <code>false</code>.</p>

<h3>2. Merged manifest ≠ your manifest</h3>
<p>Permissions/components you never wrote appear because a library injected them. Inspect <code>build/intermediates/merged_manifests/&lt;variant&gt;/AndroidManifest.xml</code> or Android Studio's Merged Manifest tab to find the source line-by-line.</p>

<h3>3. Play Console "app requests these permissions" surprises</h3>
<p>An SDK's manifest can add <code>AD_ID</code>, <code>ACCESS_COARSE_LOCATION</code>, etc. Strip unwanted ones with <code>tools:node="remove"</code>. This directly affects your Data Safety form.</p>

<h3>4. Linking.canOpenURL returns false on Android 11+</h3>
<p>Package visibility (API 30) hides other apps. Add a <code>&lt;queries&gt;</code> block for the scheme or package. Symptom: share/open buttons work on Android 10 but not 11+.</p>

<h3>5. App Link opens the browser, not the app</h3>
<p><code>autoVerify</code> failed — usually the <code>assetlinks.json</code> fingerprint doesn't match the installed build's <strong>signing</strong> cert (remember Play App Signing re-signs). Verify with <code>adb shell pm get-app-links com.myapp</code> and check the verification state.</p>

<h3>6. Custom scheme collisions</h3>
<p>Two apps can register the same <code>myapp://</code> scheme; the user gets a chooser or the wrong app opens. Custom schemes are not secure/exclusive — use verified App Links for anything sensitive (payment returns, auth callbacks).</p>

<h3>7. configChanges omissions destroy the activity</h3>
<p>If <code>orientation</code>/<code>uiMode</code> aren't in <code>configChanges</code>, rotating the device or toggling dark mode recreates MainActivity — in RN that can flash or reset state. RN's template lists them for this reason; don't trim them casually.</p>

<h3>8. largeHeap is not free</h3>
<p><code>android:largeHeap="true"</code> raises the heap ceiling but increases GC pause length and memory pressure; on low-RAM devices it can hurt. Use only after profiling OOMs, not as a default.</p>

<h3>9. allowBackup leaks data</h3>
<p><code>allowBackup="true"</code> (the historical default) lets <code>adb backup</code> and cloud backup pull app data — a VAPT finding. Set <code>false</code> unless you deliberately support backup, and pair with <code>fullBackupContent</code>/<code>dataExtractionRules</code>.</p>

<h3>10. usesCleartextTraffic vs network security config</h3>
<p>Setting <code>usesCleartextTraffic="true"</code> globally re-enables plain HTTP everywhere. Prefer a per-domain <code>networkSecurityConfig</code> exception so only your dev/staging host allows cleartext, not the whole app.</p>

<h3>11. mipmap vs drawable for icons</h3>
<p>Put launcher icons in <code>mipmap-*/</code>. If you place them in <code>drawable-*/</code>, density stripping can remove the density the launcher wants, giving a blurry icon on some devices.</p>

<h3>12. Density/qualifier folder typos silently fall back</h3>
<p>A misnamed folder (<code>values-nite</code>, <code>drawable-xxdpi</code>) is simply never matched — no error, just the default resource used. Watch for silent dark-mode or hi-dpi "it didn't apply" bugs.</p>

<h3>13. R class not regenerating</h3>
<p>A malformed resource (bad XML, duplicate name) breaks <code>R</code> generation and every <code>R.*</code> reference reports "cannot resolve symbol." Fix the resource, then <code>./gradlew clean</code>.</p>

<h3>14. POST_NOTIFICATIONS on Android 13+</h3>
<p>Notifications now require the <code>POST_NOTIFICATIONS</code> runtime permission (API 33). Declaring it in the manifest isn't enough — you must request it, or notifications are silently dropped.</p>

<h3>15. Foreground service type required</h3>
<p>On modern APIs a <code>&lt;service&gt;</code> started as foreground needs a declared <code>android:foregroundServiceType</code> and matching runtime permission (e.g., <code>FOREGROUND_SERVICE_LOCATION</code>), or it throws at start.</p>

<h3>16. assets vs res/raw wrong choice</h3>
<p>Referencing a bundled file by <code>R.raw.x</code> when it's actually in <code>assets/</code> (or vice versa) returns null. The RN JS bundle lives in <code>assets/</code> and needs <code>AssetManager</code>, not <code>R.raw</code>.</p>

<h3>17. Expo prebuild wipes hand edits</h3>
<p>Manual manifest/res edits in a managed project vanish on <code>expo prebuild --clean</code>. Symptom: "my permission/icon change disappeared after a rebuild." Move it into <code>app.json</code> or a config plugin.</p>

<h3>18. tools: attributes in the shipped APK</h3>
<p>The <code>tools:</code> namespace is merger-only and stripped from the final manifest — don't rely on it at runtime, and don't confuse a <code>tools:</code> attribute with an <code>android:</code> one.</p>

<h3>19. Manifest placeholders</h3>
<p>Gradle can inject values via <code>manifestPlaceholders</code> — dollar-brace tokens (written as a dollar sign followed by <code>{name}</code>, e.g. an <code>applicationId</code> or a per-flavor deep-link host) that Gradle resolves at build time. A missing placeholder definition fails the merge with "placeholder not found." Common with deep-link hosts parameterized per flavor.</p>

<h3>20. Adaptive icon safe zone</h3>
<p>Adaptive icon layers are 108dp with only the inner 72dp guaranteed visible after masking. Art outside the safe zone gets clipped into a circle/squircle — a foreground image that fills the whole canvas looks cropped on some launchers.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — exported="true" on everything</h3>
<p>Blindly exporting components to silence the API 31 build error opens them to other apps. Default to <code>false</code>; export only genuine entry points (launcher, deep-link, share targets).</p>

<h3>Anti-pattern 2 — trusting your manifest, ignoring the merged one</h3>
<p>Debugging permissions/components from <code>src/main</code> alone misses library injections. Always read the merged manifest.</p>

<h3>Anti-pattern 3 — custom scheme for auth/payment callbacks</h3>
<p>Custom schemes are hijackable by any app. Use verified App Links (<code>autoVerify</code> + assetlinks.json) for security-sensitive redirects.</p>

<h3>Anti-pattern 4 — leaving allowBackup default true</h3>
<p>Ships user data to adb/cloud backup. Set <code>false</code> (a standard VAPT remediation) unless backup is a real feature.</p>

<h3>Anti-pattern 5 — global usesCleartextTraffic="true"</h3>
<p>Re-enables HTTP app-wide to unblock one dev endpoint. Scope it to a domain in <code>network_security_config.xml</code> instead.</p>

<h3>Anti-pattern 6 — hardcoding strings/colors/dimens in code</h3>
<p>Defeats localization, theming, and density scaling. Use <code>@string/</code>, <code>@color/</code>, <code>@dimen/</code> and let qualifier folders resolve per device.</p>

<h3>Anti-pattern 7 — hand-editing android/ in an Expo project</h3>
<p>Edits are wiped on prebuild. Encode them in <code>app.json</code> or a config plugin so they regenerate deterministically.</p>

<h3>Anti-pattern 8 — icons in drawable instead of mipmap</h3>
<p>Density stripping can remove the launcher's preferred density → blurry icon. Keep launcher art in <code>mipmap-*/</code>.</p>

<h3>Anti-pattern 9 — trimming configChanges</h3>
<p>Removing <code>orientation</code>/<code>uiMode</code> makes Android recreate MainActivity on rotate/theme change, resetting the RN view. Keep the RN template's list.</p>

<h3>Anti-pattern 10 — no &lt;queries&gt; on Android 11+</h3>
<p>Silent <code>canOpenURL</code>/<code>resolveActivity</code> failures. Declare the intents/packages you inspect.</p>

<h3>Anti-pattern 11 — ignoring merge conflicts by forcing tools:replace everywhere</h3>
<p>Blanket <code>tools:replace</code> hides genuine incompatibilities (e.g., a library needing a permission you removed). Resolve conflicts deliberately, per attribute.</p>

<h3>Anti-pattern 12 — dumping large blobs in constants/strings</h3>
<p>Huge base64 in <code>strings.xml</code> bloats resources and slows loading. Use <code>assets/</code> or <code>res/raw/</code> for large files.</p>

<h3>Anti-pattern 13 — forgetting the runtime request for dangerous permissions</h3>
<p>Manifest declaration alone gives nothing on API 23+; the feature just fails. Pair every dangerous permission with a <code>PermissionsAndroid.request</code> flow (and POST_NOTIFICATIONS on 13+).</p>

<h3>Anti-pattern 14 — duplicate FileProvider authorities</h3>
<p>Two libraries both declaring <code>android:authorities="com.myapp.fileprovider"</code> collide and the install fails ("Duplicate provider authority"). Use a unique authority (often <code>&lt;applicationId&gt;.provider</code>).</p>

<h3>Anti-pattern 15 — assuming light-theme colors in a DayNight app</h3>
<p>Hardcoding a white background in code while the theme is <code>DayNight</code> yields unreadable dark-mode screens. Provide <code>values-night</code> overrides and reference tokens.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. What is AndroidManifest.xml responsible for?</div>
  <div class="qa-answer">
    <p>It's the app's contract with the OS, read by PackageManager at install and by the system at launch. It declares the package/application ID context, permissions (<code>&lt;uses-permission&gt;</code>) and hardware needs (<code>&lt;uses-feature&gt;</code>), the <code>&lt;application&gt;</code> config (name/label/icon/theme/backup/network), and registers the four component types — activity, service, receiver, provider — each with intent-filters that make them reachable. If a component isn't in the (merged) manifest, Android can't start it.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Name the four Android component types and how each is declared.</div>
  <div class="qa-answer">
    <p><strong>Activity</strong> (<code>&lt;activity&gt;</code>) — a screen; RN has one, MainActivity. <strong>Service</strong> (<code>&lt;service&gt;</code>) — background/bound work, no UI. <strong>BroadcastReceiver</strong> (<code>&lt;receiver&gt;</code>) — reacts to broadcasts like BOOT_COMPLETED. <strong>ContentProvider</strong> (<code>&lt;provider&gt;</code>) — structured data sharing; FileProvider is the common one, turning a private <code>file://</code> into a grantable <code>content://</code> URI. Each is started by intent, which is why intent-filters and <code>exported</code> matter.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Why is android:exported mandatory on Android 12+?</div>
  <div class="qa-answer">
    <p>On API 31+, any component declaring an <code>&lt;intent-filter&gt;</code> must set <code>android:exported</code> explicitly or the manifest merger fails the build. A component with an intent-filter is reachable by other apps, and silently defaulting that to exported was a security risk. You set <code>true</code> only for real external entry points (launcher, deep-link/share handlers) and <code>false</code> for everything internal.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. How does an intent-filter make an activity the launcher entry vs a deep-link handler?</div>
  <div class="qa-answer">
    <p>A filter with <code>action.MAIN</code> + <code>category.LAUNCHER</code> tells the system this activity is the home-screen entry. A separate filter with <code>action.VIEW</code> + <code>category.BROWSABLE</code> + <code>category.DEFAULT</code> and a <code>&lt;data&gt;</code> scheme/host makes the same activity handle URIs — a deep link. Android matches an incoming intent's action/category/data against every filter to decide which component to start.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Custom-scheme deep links vs verified App Links — difference and when to use each?</div>
  <div class="qa-answer">
    <p>A custom scheme (<code>myapp://</code>) always routes to your app but any app can register the same scheme, so it's hijackable and may show a chooser. A verified <strong>App Link</strong> is an <code>https</code> filter with <code>autoVerify="true"</code>; Android fetches <code>/.well-known/assetlinks.json</code> and checks your app's signing fingerprint, then opens the URL directly in your app with no chooser. Use App Links for anything sensitive (auth/payment callbacks); custom schemes are fine for internal, non-secure navigation.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Normal vs dangerous permissions, and what PermissionsAndroid does.</div>
  <div class="qa-answer">
    <p>Normal permissions (INTERNET, ACCESS_NETWORK_STATE) are granted at install with no prompt. Dangerous permissions (CAMERA, ACCESS_FINE_LOCATION, RECORD_AUDIO, and POST_NOTIFICATIONS on API 33+) must be declared in the manifest <em>and</em> requested at runtime on API 23+. In RN, <code>PermissionsAndroid.request(...)</code> shows the system dialog and returns GRANTED/DENIED/NEVER_ASK_AGAIN. Manifest declaration alone is necessary but not sufficient.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Explain manifest merging and its priority order.</div>
  <div class="qa-answer">
    <p>Gradle's manifest merger combines three tiers by priority: build-variant manifests (<code>src/debug</code>, <code>src/release</code>) &gt; your main manifest (<code>src/main</code>) &gt; library/AAR manifests. Same attribute with conflicting values fails the build unless resolved. The output is <code>build/intermediates/merged_manifests/&lt;variant&gt;/AndroidManifest.xml</code> — the actual shipped manifest. This is why installing a library can add permissions or providers you never wrote.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. What does the tools: namespace do?</div>
  <div class="qa-answer">
    <p>It steers the merger and is stripped from the final APK. <code>tools:replace="attr"</code> makes your value override a lower-priority library's; <code>tools:node="remove"</code> deletes an element a library injected (e.g., an AD_ID permission); <code>tools:node="merge|replace|strict"</code> controls node merge behavior; <code>tools:overrideLibrary</code> accepts a higher-minSdk library. It's the primary tool for resolving merge conflicts and cleaning unwanted injected entries.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. What changed with package visibility on Android 11, and how do you fix a broken canOpenURL?</div>
  <div class="qa-answer">
    <p>API 30 hides most other installed apps from <code>queryIntentActivities</code>/<code>getPackageInfo</code>. So <code>Linking.canOpenURL</code> and <code>resolveActivity</code> return false/null unless you declare a <code>&lt;queries&gt;</code> block listing the intents (by action+scheme) or specific packages you inspect. The classic symptom: an "open in WhatsApp" or share button that works on Android 10 and breaks on 11+.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Walk me through the res/ folder and how Android resolves a resource.</div>
  <div class="qa-answer">
    <p><code>res/</code> holds <code>drawable*/</code> (images/vectors), <code>mipmap-*/</code> (launcher icons), <code>values*/</code> (strings, colors, styles/themes, dimens), <code>xml/</code> (network config, file_paths), and <code>raw/</code>. Qualifier suffixes — density (<code>-hdpi</code>..<code>-xxxhdpi</code>), <code>-night</code>, <code>-land</code>, <code>-v26</code>, locale (<code>-hi</code>) — create variants. At runtime Android picks the best-matching folder for the device configuration; a missing match silently falls back to the default <code>values/</code>/<code>drawable/</code>. Each resource gets an integer ID in the generated <code>R</code> class, referenced as <code>@type/name</code> in XML or <code>R.type.name</code> in code.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Why are launcher icons in mipmap and everything else in drawable?</div>
  <div class="qa-answer">
    <p>Build tools density-strip <code>drawable</code> to the device's density to shrink the APK, but keep all densities of <code>mipmap</code>. Launchers sometimes render an icon at a higher density than the device (a hdpi phone using an xhdpi icon), so keeping every density in <code>mipmap</code> guarantees a crisp launcher icon. That's the whole reason for the split.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. What is an adaptive icon?</div>
  <div class="qa-answer">
    <p>API 26+ icons split into a <code>foreground</code> and <code>background</code> layer defined in <code>mipmap-anydpi-v26/ic_launcher.xml</code> as <code>&lt;adaptive-icon&gt;</code>. Each layer is 108dp with only the inner ~72dp guaranteed visible, so the launcher can mask them into a circle/squircle/rounded-square and animate parallax. A <code>monochrome</code> layer (API 33+) powers themed icons. Pre-26 devices fall back to per-density raster PNGs.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. How do you implement dark mode with resources?</div>
  <div class="qa-answer">
    <p>Use a <code>DayNight</code> theme and put light values in <code>values/</code> and dark overrides in <code>values-night/</code> (colors, styles, even drawables via <code>drawable-night/</code>). Views reference tokens like <code>@color/screen_bg</code>; when the system flips to dark mode Android re-resolves them from <code>values-night</code> with no code. Hardcoding colors in code defeats this and produces unreadable dark screens.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. assets/ vs res/raw/ — when do you use each?</div>
  <div class="qa-answer">
    <p><code>res/raw/</code> files get an <code>R.raw.*</code> ID, are flat (no subfolders), and support qualifiers — good for a bundled sound or a config referenced by ID. <code>assets/</code> preserves an arbitrary folder tree, is read by path via <code>AssetManager</code>, has no IDs or qualifiers — good for fonts, web content, and the RN JS bundle (<code>index.android.bundle</code>) itself, which is why release RN reads it through AssetManager.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. How does the classic Android splash screen work, and what changed in API 31?</div>
  <div class="qa-answer">
    <p>Classic: set <code>android:windowBackground</code> on the launch theme to a layer-list drawable (color + centered logo). The OS paints it the instant the process starts — before any view or JS — giving a zero-latency splash; a library holds it until RN is ready, then hides it. API 31+ introduced the system SplashScreen API (backported by AndroidX <code>core-splashscreen</code>), driven by <code>windowSplashScreenBackground</code>/<code>windowSplashScreenAnimatedIcon</code> and <code>installSplashScreen()</code> with <code>setKeepOnScreenCondition</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q16. In an Expo prebuild project, where do manifest and resource changes actually live?</div>
  <div class="qa-answer">
    <p>In <code>app.json</code>/<code>app.config.js</code>: permissions via <code>android.permissions</code>, deep links via <code>android.intentFilters</code> + <code>scheme</code>, icon via <code>android.adaptiveIcon</code>, splash via the <code>expo-splash-screen</code> plugin, cleartext/network via <code>expo-build-properties</code>. Prebuild generates the manifest and <code>res/</code> from these, overwriting hand edits on <code>--clean</code>. Anything <code>app.json</code> doesn't expose (a custom service, a <code>tools:replace</code>, an extra <code>&lt;queries&gt;</code> entry) goes in a config plugin using mods like <code>withAndroidManifest</code>.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You can explain why <code>android:exported</code> is mandatory on Android 12+ and when it's true vs false.</li>
    <li>You name all four component types and how intent-filters make them reachable.</li>
    <li>You distinguish custom-scheme deep links from verified App Links (autoVerify + assetlinks.json).</li>
    <li>You know normal vs dangerous permissions and pair them with the runtime request.</li>
    <li>You understand manifest merging priority and use <code>tools:replace</code>/<code>tools:node</code> deliberately.</li>
    <li>You explain <code>&lt;queries&gt;</code> and the Android 11 package-visibility gotcha.</li>
    <li>You describe the res/ qualifier system, R class, and mipmap-vs-drawable for icons.</li>
    <li>You know that in Expo prebuild all of this comes from app.json / config plugins.</li>
  </ul>
</div>
` },

  ]
});
