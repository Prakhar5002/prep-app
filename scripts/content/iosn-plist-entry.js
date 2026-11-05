window.PREP_SITE.registerTopic({
  id: "iosn-plist-entry",
  module: "iOS Native (Deep)",
  title: "Plist, Entitlements & Entry Code",
  estimatedReadTime: "24 min",
  tags: ["info-plist","entitlements","appdelegate","main","ats","url-scheme","capabilities","privacy","react-native","ios","xcode","cfbundleidentifier","nsapptransportsecurity","privacy-manifest","universal-links","push-notifications","app-groups","main-jsbundle","rctappdelegate","expo","scenedelegate"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Info.plist <strong>declares</strong> what the app is and wants to touch (crash if a usage string is missing), the <strong>.entitlements</strong> file <strong>signs</strong> the capabilities the OS must grant (fails code signing if unprovisioned), and <strong>main.m → AppDelegate</strong> boots React Native and picks the JS bundle URL (Metro in debug, main.jsbundle in release).</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Info.plist</strong> is an XML property-list dictionary the OS reads at runtime + App Review; edit via Xcode's Info tab, raw source, or <code>plutil</code>/PlistBuddy.</li>
    <li><strong>Identity keys:</strong> <code>CFBundleIdentifier</code> (reverse-DNS id), <code>CFBundleName</code>/<code>CFBundleDisplayName</code> (icon label), <code>CFBundleShortVersionString</code> = marketing version (3.4.1), <code>CFBundleVersion</code> = build number (218, must increase per upload).</li>
    <li><strong>Deep links:</strong> <code>CFBundleURLTypes</code> registers custom schemes (<code>myapp://</code>); <code>LSApplicationQueriesSchemes</code> whitelists schemes you can <code>canOpenURL:</code>. Universal Links use the Associated Domains entitlement, not the plist.</li>
    <li><strong>Launch/behavior keys:</strong> <code>UILaunchStoryboardName</code>, <code>UISupportedInterfaceOrientations</code>, <code>UIBackgroundModes</code> (remote-notification, fetch, location, audio, voip), <code>UIApplicationSceneManifest</code> (multi-window → SceneDelegate path).</li>
    <li><strong>Privacy usage strings</strong> are mandatory purpose text: <code>NSCameraUsageDescription</code>, <code>NSPhotoLibraryUsageDescription</code>, <code>NSLocationWhenInUseUsageDescription</code>, <code>NSMicrophoneUsageDescription</code>, <code>NSFaceIDUsageDescription</code>, <code>NSUserTrackingUsageDescription</code>. Missing one = SIGABRT crash on access + review rejection.</li>
    <li><strong>ATS</strong> (<code>NSAppTransportSecurity</code>) blocks cleartext HTTP since iOS 9; use scoped <code>NSExceptionDomains</code> with <code>NSExceptionAllowsInsecureHTTPLoads</code> rather than the blanket <code>NSAllowsArbitraryLoads</code>. Explains HTTP failing on iOS but not Android.</li>
    <li><strong>$(VARIABLE)</strong> tokens (<code>$(PRODUCT_BUNDLE_IDENTIFIER)</code>, <code>$(MARKETING_VERSION)</code>, <code>$(CURRENT_PROJECT_VERSION)</code>) are substituted from Build Settings / xcconfig at build time.</li>
    <li><strong>PrivacyInfo.xcprivacy</strong> — Apple-required manifest declaring collected data, required-reason APIs (UserDefaults, file timestamps, disk space, boot time) with reason codes, and tracking domains; missing on app or a pod blocks upload.</li>
    <li><strong>.entitlements</strong> are signed capabilities matched to the provisioning profile: <code>aps-environment</code> (push; development vs production), <code>com.apple.security.application-groups</code> (<code>group.*</code>), <code>com.apple.developer.associated-domains</code> (<code>applinks:</code>), <code>keychain-access-groups</code>, <code>com.apple.developer.applesignin</code>. Xcode's Signing &amp; Capabilities tab edits the file AND the App ID together.</li>
    <li><strong>Entry code:</strong> <code>main.m</code> calls <code>UIApplicationMain</code> → creates UIApplication + AppDelegate → <code>application:didFinishLaunchingWithOptions:</code>. Failure modes differ by file: plist misses crash at runtime, entitlement mismatches fail at signing, AppDelegate mistakes fail at launch.</li>
    <li><strong>RN in AppDelegate:</strong> old arch builds <code>RCTBridge</code> + <code>RCTRootView</code>; new arch (bridgeless) uses <code>RCTReactNativeFactory</code>/<code>RCTAppDelegate</code>. You set <code>moduleName</code> and override <code>bundleURL</code>. Cross-reference <code>rn-architecture</code> for bridge/JSI internals.</li>
    <li><strong>bundleURL:</strong> DEBUG → Metro (<code>localhost:8081/index.bundle</code>), RELEASE → embedded <code>main.jsbundle</code>. Wrong branch = "No bundle URL present" / white screen.</li>
    <li><strong>main.jsbundle</strong> is produced by the "Bundle React Native code and images" build phase (react-native-xcode.sh → Metro → Hermes bytecode) and copied into the .app for release.</li>
    <li><strong>Delegate hooks:</strong> <code>openURL:</code> (custom scheme) and <code>continueUserActivity:</code> (Universal Links) forward to <code>RCTLinkingManager</code>; <code>didRegisterForRemoteNotificationsWithDeviceToken:</code> for push.</li>
    <li><strong>Expo reality:</strong> all four artifacts are generated at <code>expo prebuild</code> from <code>app.json</code> (<code>ios.bundleIdentifier</code>, <code>ios.buildNumber</code>, <code>ios.infoPlist</code>, <code>ios.entitlements</code>, <code>ios.associatedDomains</code>) + config plugins. Hand edits to <code>ios/</code> are wiped by <code>--clean</code>. The sw-mobile iOS 26 fix coupled AppDelegate.h + AppDelegate.mm + Podfile.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Confusing "declare" with "sign".</strong> You can add any key to Info.plist freely, but you cannot self-grant an entitlement — it must be provisioned on your App ID or code signing fails. And a missing privacy usage string is a <strong>crash</strong>, not a silent permission denial. Secondary trap: hardcoding the Metro URL (or leaving <code>aps-environment</code> as <code>development</code>) in the release build.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Info.plist declares what the app is and what protected resources it wants — miss a usage string and the OS crashes the app on first access. Entitlements are different: they're signed capabilities like push and App Groups that must match the provisioning profile, or code signing fails."</div>
  <div class="revision-say">"Boot goes main.m → UIApplicationMain → AppDelegate's didFinishLaunchingWithOptions, which builds the RN root and resolves the bundle URL — Metro in debug, the embedded main.jsbundle in release."</div>
  <div class="revision-say">"ATS blocks cleartext HTTP on iOS since iOS 9, which is why an http API works on Android but silently fails on iOS unless you add a scoped exception domain — I avoid the blanket NSAllowsArbitraryLoads."</div>
  <div class="revision-say">"In Expo these files aren't hand-written — they're generated at prebuild from app.json's ios.infoPlist and ios.entitlements plus config plugins, so editing ios/ directly gets wiped on a clean prebuild."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What Info.plist is</h3>
<p>Every iOS app bundle ships an <code>Info.plist</code> — an XML <strong>property list</strong> (a serialized dictionary) that the operating system reads to learn about your app <em>before and while</em> it runs. It lives at the root of the built <code>.app</code> bundle. The launcher, Springboard, the App Store, and dozens of system frameworks consult it: to know your bundle identifier, your display name under the icon, your supported orientations, which URL schemes you can open, and — crucially — which sensitive resources you intend to use and the human-readable reason you'll show the user.</p>

<h3>Why it matters so much on iOS</h3>
<p>iOS is permission-gated and privacy-strict. You cannot call the camera API and <em>then</em> apologize — if the matching usage-description string is absent from Info.plist, the app <strong>crashes on the spot</strong> the moment you request access, and App Review will reject a binary that requests a permission without a purpose string. So the plist is not a "nice to have config file"; it is a contract the OS enforces at runtime and Apple enforces at submission.</p>

<h3>What entitlements are</h3>
<p>Entitlements are <strong>capabilities that must be cryptographically signed into the app</strong>. Where Info.plist is unsigned declarative metadata, an entitlement is a claim baked into the code signature and cross-checked against your <strong>provisioning profile</strong> and App ID configuration on Apple's servers. Push notifications, App Groups (shared container between your app and its extensions/widgets), Keychain Sharing, Associated Domains (Universal Links), Sign in with Apple, HealthKit, background modes that need special grants — all are entitlements. If the .entitlements file claims something your provisioning profile doesn't allow, code signing fails and you can't install or ship.</p>

<h3>What the entry code is</h3>
<p>An iOS process starts at C's <code>main()</code>, historically in <code>main.m</code>, which calls <code>UIApplicationMain(...)</code>. That function creates the <code>UIApplication</code> singleton and your <strong>AppDelegate</strong>, then fires <code>application:didFinishLaunchingWithOptions:</code> — the first place <em>your</em> code runs. In a React Native app, that method is where the JavaScript runtime is bootstrapped: the bridge (old architecture) or the bridgeless <code>RCTReactNativeFactory</code> (new architecture) is created, the root view is attached to a window, and the JS bundle URL is resolved.</p>

<h3>Why an RN developer must know all three</h3>
<table>
  <thead><tr><th>Artifact</th><th>Fails when…</th><th>Symptom</th></tr></thead>
  <tbody>
    <tr><td>Info.plist</td><td>a usage string is missing / ATS blocks a URL</td><td>runtime crash on permission; network requests silently fail</td></tr>
    <tr><td>.entitlements</td><td>a capability isn't in the provisioning profile</td><td>code-signing error; push tokens never arrive</td></tr>
    <tr><td>AppDelegate / main</td><td>bundle URL wrong, bridge misconfigured</td><td>red screen, "No bundle URL present", or launch crash</td></tr>
  </tbody>
</table>
<p>Every one of these surfaces during native debugging — the exact skill you're sharpening. When a push token never arrives, when a deep link doesn't open the app, when a release build shows a white screen, the root cause is almost always in one of these three files.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>The "declare vs sign vs boot" picture</h3>
<div class="diagram">
<pre>
        DECLARE                 SIGN                   BOOT
    ┌───────────────┐    ┌──────────────────┐   ┌──────────────────┐
    │  Info.plist   │    │  App.entitlements│   │  main.m          │
    │  (XML dict)   │    │  (signed caps)   │   │   └ UIAppMain()  │
    │               │    │                  │   │        │         │
    │ bundle id     │    │ aps-environment  │   │        ▼         │
    │ versions      │    │ group.* (App Grp)│   │  AppDelegate     │
    │ URL schemes   │    │ applinks: (UL)   │   │   didFinishLaunch│
    │ NSCameraUsage │    │ keychain-access  │   │        │         │
    │ NSAppTransport│    │ Sign in w/ Apple │   │   RCTRootView /  │
    └──────┬────────┘    └────────┬─────────┘   │   RCTReactNative │
           │                      │             │   Factory        │
           ▼                      ▼             │        │         │
   read by OS at runtime   checked at CODE      │        ▼         │
   + at App Review         SIGNING vs profile   │  sourceURLForBridge
                                                │  (Metro | jsbundle)
                                                └──────────────────┘
</pre>
</div>

<h3>The "who reads what, when" timeline</h3>
<div class="diagram">
<pre>
 BUILD TIME        SIGN TIME          INSTALL         LAUNCH            RUNTIME
 ─────────         ─────────          ───────         ──────            ───────
 codegen +         codesign reads     Springboard     main() →          camera API →
 $(VAR) subst      .entitlements      reads plist     UIAppMain →       OS checks plist
 into plist        vs provisioning    (name, icon)    AppDelegate       NSCameraUsage...
                   profile                            didFinishLaunch   present? yes→prompt
 "Bundle RN code                                      builds RN root    absent? CRASH
  and images" →                                       + loads JS bundle
  main.jsbundle
</pre>
</div>

<h3>The "RN launch chain" picture (old arch)</h3>
<div class="diagram">
<pre>
 main.m
   └ UIApplicationMain(argc, argv, nil, "AppDelegate")
        │
        ▼
 AppDelegate application:didFinishLaunchingWithOptions:
        │
        ├─ RCTBridge(delegate:self launchOptions:...)
        │       └ asks: sourceURLForBridge(bridge) ?
        │            DEBUG   → http://localhost:8081/index.bundle (Metro)
        │            RELEASE → main.jsbundle in the app bundle
        │
        ├─ RCTRootView(bridge, moduleName:"AppName")
        │
        └─ window.rootViewController.view = rootView
                 └ JS runs, React renders, first frame paints
</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Info.plist and entitlements are the same kind of settings." They are not. Info.plist is <strong>unsigned</strong> declarative metadata the OS trusts at face value. Entitlements are <strong>part of the signature</strong> and must be authorized by your Apple Developer account's App ID + provisioning profile. You can add any key to Info.plist freely; you cannot grant yourself an entitlement Apple hasn't provisioned for your App ID.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1 — Info.plist format and how to edit it</h3>
<p>It is an XML plist: a <code>&lt;dict&gt;</code> of <code>&lt;key&gt;</code> elements each followed by a typed value (<code>&lt;string&gt;</code>, <code>&lt;true/&gt;</code>, <code>&lt;array&gt;</code>, <code>&lt;dict&gt;</code>, <code>&lt;integer&gt;</code>). Three ways to edit it:</p>
<ul>
  <li><strong>Xcode target → Info tab</strong> — a friendly key/value table (shows human-readable names like "Privacy - Camera Usage Description").</li>
  <li><strong>Right-click the file → Open As → Source Code</strong> — raw XML, the source of truth.</li>
  <li><strong>PlistBuddy / plutil</strong> from the command line for scripting (<code>/usr/libexec/PlistBuddy</code>, <code>plutil -lint Info.plist</code>).</li>
</ul>
<pre><code class="language-xml">&lt;?xml version="1.0" encoding="UTF-8"?&gt;
&lt;plist version="1.0"&gt;
&lt;dict&gt;
  &lt;key&gt;CFBundleIdentifier&lt;/key&gt;
  &lt;string&gt;$(PRODUCT_BUNDLE_IDENTIFIER)&lt;/string&gt;
  &lt;key&gt;CFBundleDisplayName&lt;/key&gt;
  &lt;string&gt;SmartWorks&lt;/string&gt;
  &lt;key&gt;CFBundleShortVersionString&lt;/key&gt;
  &lt;string&gt;3.4.1&lt;/string&gt;
  &lt;key&gt;CFBundleVersion&lt;/key&gt;
  &lt;string&gt;218&lt;/string&gt;
&lt;/dict&gt;
&lt;/plist&gt;</code></pre>

<h3>2 — The identity keys</h3>
<table>
  <thead><tr><th>Key</th><th>Meaning</th></tr></thead>
  <tbody>
    <tr><td><code>CFBundleIdentifier</code></td><td>Reverse-DNS unique id (com.company.app). Ties the binary to its App ID, provisioning, push, and App Store record. Usually set to <code>$(PRODUCT_BUNDLE_IDENTIFIER)</code>.</td></tr>
    <tr><td><code>CFBundleName</code></td><td>Short internal bundle name (defaults to <code>$(PRODUCT_NAME)</code>, max 15 chars historically).</td></tr>
    <tr><td><code>CFBundleDisplayName</code></td><td>The name shown under the home-screen icon; can differ from CFBundleName and be localized.</td></tr>
    <tr><td><code>CFBundleShortVersionString</code></td><td><strong>Marketing version</strong> — the user-facing "3.4.1". Shown on the App Store.</td></tr>
    <tr><td><code>CFBundleVersion</code></td><td><strong>Build number</strong> — must increase every upload to App Store Connect; "218", "218.1". Users rarely see it.</td></tr>
  </tbody>
</table>
<div class="callout info">
  <div class="callout-title">Version vs build — the classic confusion</div>
  <p><code>CFBundleShortVersionString</code> is the release you talk about (semver-ish). <code>CFBundleVersion</code> is a monotonically increasing build counter unique <em>within</em> a version. You can ship builds 218, 219, 220 all under marketing version 3.4.1 to TestFlight; only the last becomes 3.4.1 in the store.</p>
</div>

<h3>3 — Custom URL schemes (deep links) — CFBundleURLTypes</h3>
<p>Register a scheme so the OS opens your app for <code>myapp://path</code> links:</p>
<pre><code class="language-xml">&lt;key&gt;CFBundleURLTypes&lt;/key&gt;
&lt;array&gt;
  &lt;dict&gt;
    &lt;key&gt;CFBundleURLName&lt;/key&gt;
    &lt;string&gt;com.company.app&lt;/string&gt;
    &lt;key&gt;CFBundleURLSchemes&lt;/key&gt;
    &lt;array&gt;
      &lt;string&gt;smartworks&lt;/string&gt;
    &lt;/array&gt;
  &lt;/dict&gt;
&lt;/array&gt;</code></pre>
<p>To <em>query</em> or open OTHER apps' schemes (e.g. checking if WhatsApp is installed via <code>canOpenURL:</code>), list them under <code>LSApplicationQueriesSchemes</code> — iOS 9+ blocks unlisted scheme queries:</p>
<pre><code class="language-xml">&lt;key&gt;LSApplicationQueriesSchemes&lt;/key&gt;
&lt;array&gt;
  &lt;string&gt;whatsapp&lt;/string&gt;
  &lt;string&gt;tel&lt;/string&gt;
  &lt;string&gt;mailto&lt;/string&gt;
&lt;/array&gt;</code></pre>
<p><strong>Custom schemes vs Universal Links:</strong> a scheme (<code>smartworks://</code>) is easy but spoofable and shows no fallback if the app is absent. Universal Links (<code>https://app.company.com/...</code>) are the modern, secure path and use the <em>Associated Domains entitlement</em>, not Info.plist — covered below.</p>

<h3>4 — Launch, orientation, scenes, background</h3>
<table>
  <thead><tr><th>Key</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td><code>UILaunchStoryboardName</code></td><td>Name of the launch screen storyboard (splash) shown instantly before first frame. RN apps ship <code>LaunchScreen.storyboard</code>.</td></tr>
    <tr><td><code>UISupportedInterfaceOrientations</code></td><td>Allowed orientations (portrait, landscape); a separate <code>~ipad</code> variant for iPad.</td></tr>
    <tr><td><code>UIBackgroundModes</code></td><td>Array enabling background execution: <code>remote-notification</code>, <code>fetch</code>, <code>location</code>, <code>audio</code>, <code>voip</code>, <code>processing</code>. Some also require a matching entitlement.</td></tr>
    <tr><td><code>UIApplicationSceneManifest</code></td><td>Declares multi-window / <code>UIScene</code> support. Presence changes the launch path toward a SceneDelegate (see entry code).</td></tr>
    <tr><td><code>UIRequiresFullScreen</code>, <code>UIStatusBarStyle</code>, <code>UIViewControllerBasedStatusBarAppearance</code></td><td>Full-screen requirement and status-bar styling behavior.</td></tr>
  </tbody>
</table>

<h3>5 — Privacy usage-description strings (the crash-makers)</h3>
<p>Any protected resource needs a purpose string. iOS shows this text in the permission prompt; missing it = crash on first access + review rejection:</p>
<pre><code class="language-xml">&lt;key&gt;NSCameraUsageDescription&lt;/key&gt;
&lt;string&gt;Scan a QR code to check in to your booked desk.&lt;/string&gt;
&lt;key&gt;NSPhotoLibraryUsageDescription&lt;/key&gt;
&lt;string&gt;Attach a photo to your support ticket.&lt;/string&gt;
&lt;key&gt;NSLocationWhenInUseUsageDescription&lt;/key&gt;
&lt;string&gt;Show meeting rooms near you.&lt;/string&gt;
&lt;key&gt;NSMicrophoneUsageDescription&lt;/key&gt;
&lt;string&gt;Record a voice note on a ticket.&lt;/string&gt;
&lt;key&gt;NSFaceIDUsageDescription&lt;/key&gt;
&lt;string&gt;Unlock the app securely with Face ID.&lt;/string&gt;
&lt;key&gt;NSUserTrackingUsageDescription&lt;/key&gt;
&lt;string&gt;Allow tracking to measure ad performance.&lt;/string&gt;</code></pre>
<table>
  <thead><tr><th>Key</th><th>Guards</th></tr></thead>
  <tbody>
    <tr><td><code>NSCameraUsageDescription</code></td><td>AVCaptureDevice camera — QR scan, photo capture</td></tr>
    <tr><td><code>NSPhotoLibraryUsageDescription</code> / <code>...AddUsageDescription</code></td><td>Reading / writing the photo library</td></tr>
    <tr><td><code>NSLocationWhenInUseUsageDescription</code> / <code>NSLocationAlwaysAndWhenInUseUsageDescription</code></td><td>Core Location (foreground / background)</td></tr>
    <tr><td><code>NSMicrophoneUsageDescription</code></td><td>Audio recording</td></tr>
    <tr><td><code>NSFaceIDUsageDescription</code></td><td>LocalAuthentication biometrics (Face ID)</td></tr>
    <tr><td><code>NSUserTrackingUsageDescription</code></td><td>App Tracking Transparency (IDFA) — required to call <code>requestTrackingAuthorization</code></td></tr>
    <tr><td><code>NSContactsUsageDescription</code>, <code>NSCalendarsUsageDescription</code>, <code>NSBluetoothAlwaysUsageDescription</code>, <code>NSMotionUsageDescription</code></td><td>Contacts, calendar, Bluetooth, motion sensors</td></tr>
  </tbody>
</table>

<h3>6 — App Transport Security (ATS)</h3>
<p><code>NSAppTransportSecurity</code> controls network security. Since iOS 9, ATS <strong>blocks cleartext HTTP by default</strong> — only HTTPS (TLS 1.2+) is allowed. To permit exceptions you add a dictionary. Blanket <code>NSAllowsArbitraryLoads</code> = <code>true</code> disables ATS entirely and now triggers App Review scrutiny; prefer scoped exception domains:</p>
<pre><code class="language-xml">&lt;key&gt;NSAppTransportSecurity&lt;/key&gt;
&lt;dict&gt;
  &lt;!-- avoid this global switch if you can --&gt;
  &lt;key&gt;NSAllowsArbitraryLoads&lt;/key&gt;
  &lt;false/&gt;
  &lt;key&gt;NSExceptionDomains&lt;/key&gt;
  &lt;dict&gt;
    &lt;key&gt;legacy-api.internal.company.com&lt;/key&gt;
    &lt;dict&gt;
      &lt;key&gt;NSExceptionAllowsInsecureHTTPLoads&lt;/key&gt;
      &lt;true/&gt;
      &lt;key&gt;NSIncludesSubdomains&lt;/key&gt;
      &lt;true/&gt;
    &lt;/dict&gt;
  &lt;/dict&gt;
&lt;/dict&gt;</code></pre>
<div class="callout warn">
  <div class="callout-title">Why your fetch() silently fails on iOS but works on Android</div>
  <p>If your API is plain <code>http://</code>, iOS ATS rejects it with an error like "The resource could not be loaded because the App Transport Security policy requires the use of a secure connection." Android has no equivalent by default (it uses <code>usesCleartextTraffic</code> in the manifest / network security config). This asymmetry is a classic cross-platform bug — the request just fails on iOS.</p>
</div>

<h3>7 — $(VARIABLE) build-setting substitution</h3>
<p>Info.plist values can reference <strong>build settings</strong> via <code>$(NAME)</code>. At build time Xcode substitutes them, which is how one plist serves Debug/Release and multiple schemes:</p>
<pre><code class="language-xml">&lt;key&gt;CFBundleIdentifier&lt;/key&gt;
&lt;string&gt;$(PRODUCT_BUNDLE_IDENTIFIER)&lt;/string&gt;
&lt;key&gt;CFBundleShortVersionString&lt;/key&gt;
&lt;string&gt;$(MARKETING_VERSION)&lt;/string&gt;
&lt;key&gt;CFBundleVersion&lt;/key&gt;
&lt;string&gt;$(CURRENT_PROJECT_VERSION)&lt;/string&gt;</code></pre>
<p>Common tokens: <code>$(PRODUCT_BUNDLE_IDENTIFIER)</code>, <code>$(PRODUCT_NAME)</code>, <code>$(MARKETING_VERSION)</code>, <code>$(CURRENT_PROJECT_VERSION)</code>, <code>$(DEVELOPMENT_LANGUAGE)</code>, <code>$(EXECUTABLE_NAME)</code>. Values come from the target's Build Settings or an <code>.xcconfig</code> file.</p>

<h3>8 — PrivacyInfo.xcprivacy (the privacy manifest)</h3>
<p>Since 2024 Apple <strong>requires</strong> a privacy manifest (<code>PrivacyInfo.xcprivacy</code>, itself a plist) for many apps and SDKs. It declares (a) the data types you collect, (b) the "required-reason APIs" you call and the approved reason code for each, and (c) tracking domains. Common required-reason API categories: file timestamp APIs, <code>UserDefaults</code>, system boot time, disk space, active keyboard. Third-party SDKs (including some RN libraries) must ship their own <code>.xcprivacy</code>; missing ones now block App Store upload.</p>
<pre><code class="language-xml">&lt;key&gt;NSPrivacyAccessedAPITypes&lt;/key&gt;
&lt;array&gt;
  &lt;dict&gt;
    &lt;key&gt;NSPrivacyAccessedAPIType&lt;/key&gt;
    &lt;string&gt;NSPrivacyAccessedAPICategoryUserDefaults&lt;/string&gt;
    &lt;key&gt;NSPrivacyAccessedAPITypeReasons&lt;/key&gt;
    &lt;array&gt;&lt;string&gt;CA92.1&lt;/string&gt;&lt;/array&gt;
  &lt;/dict&gt;
&lt;/array&gt;
&lt;key&gt;NSPrivacyTracking&lt;/key&gt;
&lt;false/&gt;</code></pre>

<h3>9 — The .entitlements file</h3>
<p>A plist listing signed capabilities. Xcode's <strong>Signing &amp; Capabilities</strong> tab is the front-end: adding a capability there edits BOTH the <code>.entitlements</code> file AND the App ID / provisioning profile on Apple's side.</p>
<pre><code class="language-xml">&lt;?xml version="1.0" encoding="UTF-8"?&gt;
&lt;plist version="1.0"&gt;
&lt;dict&gt;
  &lt;key&gt;aps-environment&lt;/key&gt;
  &lt;string&gt;production&lt;/string&gt;

  &lt;key&gt;com.apple.security.application-groups&lt;/key&gt;
  &lt;array&gt;
    &lt;string&gt;group.com.company.app&lt;/string&gt;
  &lt;/array&gt;

  &lt;key&gt;com.apple.developer.associated-domains&lt;/key&gt;
  &lt;array&gt;
    &lt;string&gt;applinks:app.company.com&lt;/string&gt;
    &lt;string&gt;webcredentials:app.company.com&lt;/string&gt;
  &lt;/array&gt;

  &lt;key&gt;keychain-access-groups&lt;/key&gt;
  &lt;array&gt;
    &lt;string&gt;$(AppIdentifierPrefix)com.company.app&lt;/string&gt;
  &lt;/array&gt;

  &lt;key&gt;com.apple.developer.applesignin&lt;/key&gt;
  &lt;array&gt;&lt;string&gt;Default&lt;/string&gt;&lt;/array&gt;
&lt;/dict&gt;
&lt;/plist&gt;</code></pre>
<table>
  <thead><tr><th>Entitlement</th><th>Grants</th></tr></thead>
  <tbody>
    <tr><td><code>aps-environment</code> (development / production)</td><td>Push Notifications — no token without it</td></tr>
    <tr><td><code>com.apple.security.application-groups</code></td><td>App Groups — shared container/UserDefaults between app, extensions, widgets</td></tr>
    <tr><td><code>com.apple.developer.associated-domains</code></td><td>Universal Links (<code>applinks:</code>), shared web credentials (<code>webcredentials:</code>)</td></tr>
    <tr><td><code>keychain-access-groups</code></td><td>Keychain Sharing across your apps / extensions</td></tr>
    <tr><td><code>com.apple.developer.applesignin</code></td><td>Sign in with Apple</td></tr>
    <tr><td><code>com.apple.developer.usernotifications.time-sensitive</code>, HealthKit, background modes</td><td>Various OS-granted capabilities</td></tr>
  </tbody>
</table>
<div class="callout danger">
  <div class="callout-title">aps-environment must match the build</div>
  <p>Debug/TestFlight builds signed with a development profile use <code>development</code>; App Store builds use <code>production</code>. A token minted under the wrong environment silently fails to receive pushes from the other APNs endpoint. Xcode manages this per-configuration; hand-editing it is a frequent "push works in debug, dead in production" bug.</p>
</div>

<h3>10 — Entry code: main.m and UIApplicationMain</h3>
<pre><code class="language-objc">// main.m
#import &lt;UIKit/UIKit.h&gt;
#import "AppDelegate.h"

int main(int argc, char *argv[]) {
  @autoreleasepool {
    return UIApplicationMain(argc, argv, nil,
                             NSStringFromClass([AppDelegate class]));
  }
}</code></pre>
<p><code>UIApplicationMain</code> creates the <code>UIApplication</code> singleton, instantiates your AppDelegate (the 4th argument names the class), sets up the main run loop, and begins delivering lifecycle events.</p>

<h3>11 — AppDelegate (old architecture, ObjC-C++)</h3>
<pre><code class="language-objc">// AppDelegate.h
#import &lt;RCTAppDelegate.h&gt;
#import &lt;UIKit/UIKit.h&gt;

@interface AppDelegate : RCTAppDelegate
@end</code></pre>
<pre><code class="language-objc">// AppDelegate.mm
#import "AppDelegate.h"
#import &lt;React/RCTBundleURLProvider.h&gt;

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  self.moduleName = @"SmartWorks";
  self.initialProps = @{};
  return [super application:application
      didFinishLaunchingWithOptions:launchOptions];
}

// Where React Native gets its JS from:
- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
  return [self bundleURL];
}

- (NSURL *)bundleURL {
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings]
          jsBundleURLForBundleRoot:@"index"];   // Metro dev server
#else
  return [[NSBundle mainBundle]
          URLForResource:@"main" withExtension:@"jsbundle"]; // embedded
#endif
}

// Deep link (custom URL scheme) delivery:
- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url
            options:(NSDictionary&lt;UIApplicationOpenURLOptionsKey, id&gt; *)options {
  return [RCTLinkingManager application:app openURL:url options:options];
}

// Universal Links delivery:
- (BOOL)application:(UIApplication *)application
    continueUserActivity:(NSUserActivity *)userActivity
      restorationHandler:(void (^)(NSArray&lt;id&lt;UIUserActivityRestoring&gt;&gt; *))handler {
  return [RCTLinkingManager application:application
      continueUserActivity:userActivity restorationHandler:handler];
}

// Push registration callbacks:
- (void)application:(UIApplication *)application
    didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  // forward token to your push library (e.g. OneSignal)
}
@end</code></pre>
<p>The critical line is <code>sourceURLForBridge</code> / <code>bundleURL</code>: in <strong>DEBUG</strong> it points to Metro at <code>http://localhost:8081/index.bundle</code> (live reload), in <strong>RELEASE</strong> it loads the embedded <code>main.jsbundle</code> from the app bundle. Get this wrong and you see "No bundle URL present" or a white screen in release.</p>

<h3>12 — Old vs New architecture inside AppDelegate</h3>
<p>Historically you constructed an <code>RCTBridge</code> and an <code>RCTRootView</code> yourself. Modern templates hide this behind <code>RCTAppDelegate</code> (RN 0.71+): you just set <code>moduleName</code> and override <code>bundleURL</code>. Under the <strong>New Architecture</strong> (bridgeless, Fabric, TurboModules) the base class wires up an <code>RCTReactNativeFactory</code> / <code>RCTFabricSurface</code> instead of a classic bridge — but your override points stay the same (module name + bundle URL). For the bridge/JSI internals, cross-reference the <code>rn-architecture</code> topic.</p>
<pre><code class="language-objc">// Old, explicit form (pre-RCTAppDelegate) — for reference:
RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self
                                          launchOptions:launchOptions];
RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                 moduleName:@"SmartWorks"
                                          initialProperties:nil];
self.window = [[UIWindow alloc] initWithFrame:UIScreen.mainScreen.bounds];
UIViewController *vc = [UIViewController new];
vc.view = rootView;
self.window.rootViewController = vc;
[self.window makeKeyAndVisible];</code></pre>

<h3>13 — SceneDelegate note</h3>
<p>If Info.plist declares <code>UIApplicationSceneManifest</code>, iOS drives UI lifecycle through a <code>UISceneDelegate</code> (per-window) rather than putting the window on the AppDelegate. Most RN templates still use the single-window AppDelegate path and do <em>not</em> ship a SceneDelegate, but you'll meet it in newer native iOS code and some iPad multi-window setups.</p>

<h3>14 — main.jsbundle and the "Bundle React Native code and images" phase</h3>
<p>In a <strong>release</strong> build there is no Metro server, so the JavaScript must be pre-compiled and embedded. Xcode runs a build phase named <strong>"Bundle React Native code and images"</strong> (a shell script invoking <code>react-native-xcode.sh</code> → the Metro bundler) that produces <code>main.jsbundle</code> plus the asset files, and copies them into the <code>.app</code>. With Hermes enabled this bundle is further compiled to Hermes bytecode. That is the file <code>bundleURL</code> loads in the <code>#else</code> branch above.</p>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — you don't hand-write any of this</div>
  <p>In an Expo managed / prebuild project, Info.plist, the .entitlements file, main.m, and AppDelegate are all <strong>generated</strong> from <code>app.json</code> / <code>app.config.js</code> at <code>expo prebuild</code>. You set:</p>
  <ul>
    <li><code>ios.bundleIdentifier</code> → CFBundleIdentifier</li>
    <li><code>ios.buildNumber</code> → CFBundleVersion, and top-level <code>version</code> → CFBundleShortVersionString</li>
    <li><code>ios.infoPlist</code> → arbitrary Info.plist keys (usage strings, ATS, URL schemes)</li>
    <li><code>ios.entitlements</code> → entitlements (App Groups, associated domains), or a config plugin like <code>expo-notifications</code> that injects <code>aps-environment</code> and background modes for you</li>
    <li><code>ios.associatedDomains</code> → the associated-domains entitlement for Universal Links</li>
  </ul>
  <p>Config plugins (<code>expo-camera</code>, <code>expo-location</code>, etc.) add their own required usage strings during prebuild. <strong>Hand-editing <code>ios/</code> gets wiped by <code>expo prebuild --clean</code></strong> — put changes in app config or a custom plugin instead.</p>
</div>

<div class="callout note">
  <div class="callout-title">Real-world: the sw-mobile iOS 26 launch fix</div>
  <p>On <code>sw-mobile</code> (Expo 53 / RN 0.79, old arch), launching on iOS 26 simulators required three coupled patches: the <strong>Podfile</strong>, <strong>AppDelegate.h</strong>, and <strong>AppDelegate.mm</strong> edited together (plus a noop Swift file). This is exactly the entry-code layer — the AppDelegate header + implementation had to change in lockstep with the pod configuration for the app to boot. Because it's a prebuild project, those native edits live behind config / patches so <code>--clean</code> doesn't erase them.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — Minimal Info.plist identity block</h3>
<pre><code class="language-xml">&lt;key&gt;CFBundleIdentifier&lt;/key&gt;   &lt;string&gt;$(PRODUCT_BUNDLE_IDENTIFIER)&lt;/string&gt;
&lt;key&gt;CFBundleDisplayName&lt;/key&gt;  &lt;string&gt;SmartWorks&lt;/string&gt;
&lt;key&gt;CFBundleShortVersionString&lt;/key&gt; &lt;string&gt;3.4.1&lt;/string&gt;
&lt;key&gt;CFBundleVersion&lt;/key&gt;      &lt;string&gt;218&lt;/string&gt;</code></pre>

<h3>Example 2 — Camera + photo permission (crash-safe)</h3>
<pre><code class="language-xml">&lt;key&gt;NSCameraUsageDescription&lt;/key&gt;
&lt;string&gt;SmartWorks uses the camera to scan the desk QR code.&lt;/string&gt;
&lt;key&gt;NSPhotoLibraryUsageDescription&lt;/key&gt;
&lt;string&gt;Attach an image to your support ticket.&lt;/string&gt;</code></pre>
<p>The matching Expo config:</p>
<pre><code class="language-json">{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "SmartWorks uses the camera to scan the desk QR code.",
        "NSPhotoLibraryUsageDescription": "Attach an image to your support ticket."
      }
    }
  }
}</code></pre>

<h3>Example 3 — Custom URL scheme + querying other apps</h3>
<pre><code class="language-xml">&lt;key&gt;CFBundleURLTypes&lt;/key&gt;
&lt;array&gt;&lt;dict&gt;
  &lt;key&gt;CFBundleURLSchemes&lt;/key&gt;
  &lt;array&gt;&lt;string&gt;smartworks&lt;/string&gt;&lt;/array&gt;
&lt;/dict&gt;&lt;/array&gt;
&lt;key&gt;LSApplicationQueriesSchemes&lt;/key&gt;
&lt;array&gt;&lt;string&gt;tel&lt;/string&gt;&lt;string&gt;mailto&lt;/string&gt;&lt;/array&gt;</code></pre>

<h3>Example 4 — ATS scoped exception for a legacy HTTP endpoint</h3>
<pre><code class="language-xml">&lt;key&gt;NSAppTransportSecurity&lt;/key&gt;
&lt;dict&gt;
  &lt;key&gt;NSExceptionDomains&lt;/key&gt;
  &lt;dict&gt;
    &lt;key&gt;api-old.company.com&lt;/key&gt;
    &lt;dict&gt;
      &lt;key&gt;NSExceptionAllowsInsecureHTTPLoads&lt;/key&gt;&lt;true/&gt;
    &lt;/dict&gt;
  &lt;/dict&gt;
&lt;/dict&gt;</code></pre>

<h3>Example 5 — Push notifications entitlement</h3>
<pre><code class="language-xml">&lt;!-- App.entitlements --&gt;
&lt;key&gt;aps-environment&lt;/key&gt;
&lt;string&gt;development&lt;/string&gt;   &lt;!-- production for App Store --&gt;</code></pre>
<pre><code class="language-xml">&lt;!-- Info.plist background mode so a push can wake the app --&gt;
&lt;key&gt;UIBackgroundModes&lt;/key&gt;
&lt;array&gt;&lt;string&gt;remote-notification&lt;/string&gt;&lt;/array&gt;</code></pre>

<h3>Example 6 — App Group shared between app and widget</h3>
<pre><code class="language-xml">&lt;key&gt;com.apple.security.application-groups&lt;/key&gt;
&lt;array&gt;&lt;string&gt;group.com.company.smartworks&lt;/string&gt;&lt;/array&gt;</code></pre>
<p>Both the main app target AND the widget/extension target must carry the same group id in their entitlements to share a container.</p>

<h3>Example 7 — Universal Links via Associated Domains</h3>
<pre><code class="language-xml">&lt;key&gt;com.apple.developer.associated-domains&lt;/key&gt;
&lt;array&gt;&lt;string&gt;applinks:app.company.com&lt;/string&gt;&lt;/array&gt;</code></pre>
<p>Plus an <code>apple-app-site-association</code> file served at <code>https://app.company.com/.well-known/</code>. The AppDelegate's <code>continueUserActivity</code> then receives the tapped URL.</p>

<h3>Example 8 — Debug vs release bundle URL</h3>
<pre><code class="language-objc">- (NSURL *)bundleURL {
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings]
          jsBundleURLForBundleRoot:@"index"];        // Metro
#else
  return [NSBundle.mainBundle URLForResource:@"main"
                              withExtension:@"jsbundle"]; // embedded
#endif
}</code></pre>

<h3>Example 9 — Handling a deep link into JS</h3>
<pre><code class="language-objc">- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url
            options:(NSDictionary&lt;UIApplicationOpenURLOptionsKey,id&gt; *)options {
  return [RCTLinkingManager application:app openURL:url options:options];
}</code></pre>
<pre><code class="language-ts">// JS side (react-native Linking)
import { Linking } from 'react-native';
Linking.addEventListener('url', ({ url }) =&gt; navigate(url));
const initial = await Linking.getInitialURL();</code></pre>

<h3>Example 10 — Expo entitlements + associated domains in app.json</h3>
<pre><code class="language-json">{
  "expo": {
    "version": "3.4.1",
    "ios": {
      "bundleIdentifier": "com.company.smartworks",
      "buildNumber": "218",
      "associatedDomains": ["applinks:app.company.com"],
      "entitlements": {
        "com.apple.security.application-groups": ["group.com.company.smartworks"]
      },
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"],
        "NSFaceIDUsageDescription": "Unlock SmartWorks with Face ID."
      }
    }
  }
}</code></pre>

<h3>Example 11 — Privacy manifest for UserDefaults reason</h3>
<pre><code class="language-xml">&lt;!-- PrivacyInfo.xcprivacy --&gt;
&lt;key&gt;NSPrivacyAccessedAPITypes&lt;/key&gt;
&lt;array&gt;&lt;dict&gt;
  &lt;key&gt;NSPrivacyAccessedAPIType&lt;/key&gt;
  &lt;string&gt;NSPrivacyAccessedAPICategoryUserDefaults&lt;/string&gt;
  &lt;key&gt;NSPrivacyAccessedAPITypeReasons&lt;/key&gt;
  &lt;array&gt;&lt;string&gt;CA92.1&lt;/string&gt;&lt;/array&gt;
&lt;/dict&gt;&lt;/array&gt;</code></pre>

<h3>Example 12 — Verifying what actually shipped</h3>
<pre><code class="language-bash"># Inspect the built app's Info.plist
plutil -p "MyApp.app/Info.plist" | grep -i version

# Dump the signed entitlements from a binary
codesign -d --entitlements :- "MyApp.app"

# Lint a plist for XML errors before building
plutil -lint ios/SmartWorks/Info.plist</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. Missing usage string = hard crash, not a warning</h3>
<p>Call the camera without <code>NSCameraUsageDescription</code> and the app terminates immediately with a console message naming the missing key. It is not a silent denial — it is <code>SIGABRT</code>. Always add the string before shipping the feature.</p>

<h3>2. Version vs build swap</h3>
<p>Uploading a build whose <code>CFBundleVersion</code> isn't higher than an existing one under the same <code>CFBundleShortVersionString</code> is rejected by App Store Connect ("bundle version must be higher"). Bump the build number every upload.</p>

<h3>3. ATS blocks HTTP even for localhost images</h3>
<p>Loading an <code>http://</code> image or hitting an <code>http://</code> API fails on iOS with no visible error in RN except a failed request. Android works. Add a scoped exception domain or move to HTTPS. (<code>localhost</code> Metro traffic is exempted automatically in debug.)</p>

<h3>4. aps-environment mismatch</h3>
<p>Development-signed builds must use <code>development</code>; store builds <code>production</code>. Mixing means a token registered against the wrong APNs environment — push works in TestFlight but not the store build, or vice versa.</p>

<h3>5. Entitlement not in provisioning profile</h3>
<p>Adding <code>aps-environment</code> or App Groups in the file but not enabling the capability on the App ID causes a code-signing failure: "provisioning profile doesn't include the ... entitlement." The Xcode Capabilities tab keeps both sides in sync; hand-editing one drifts.</p>

<h3>6. LSApplicationQueriesSchemes limit</h3>
<p><code>canOpenURL:</code> returns false for any scheme not whitelisted here (iOS 9+), and the list is capped (~50 entries). If a "is WhatsApp installed?" check always returns false, the scheme is missing from the array.</p>

<h3>7. No bundle URL present (release white screen)</h3>
<p>If the "Bundle React Native code and images" phase didn't run or <code>main.jsbundle</code> isn't copied, a release build launches to a white/red screen. Verify the build phase exists and Hermes settings match.</p>

<h3>8. Info.plist $(VAR) not substituted</h3>
<p>A literal <code>$(PRODUCT_BUNDLE_IDENTIFIER)</code> showing at runtime means the build setting is undefined or the file isn't the target's "Info.plist File". Check Build Settings → Packaging.</p>

<h3>9. Duplicate / conflicting keys after merge</h3>
<p>Merge conflicts can leave two <code>&lt;key&gt;</code> entries; plist parsing takes one arbitrarily. Run <code>plutil -lint</code> to catch malformed or duplicated plists early.</p>

<h3>10. Privacy manifest missing on a dependency</h3>
<p>App Store upload now warns/blocks if an SDK uses a required-reason API without a <code>.xcprivacy</code>. The offending pod, not your app, may be the culprit — update the library.</p>

<h3>11. SceneDelegate vs AppDelegate window ownership</h3>
<p>If <code>UIApplicationSceneManifest</code> is present but you set <code>self.window</code> on the AppDelegate, the window may be nil or ignored. Pick one lifecycle model consistently.</p>

<h3>12. Associated domains need the AASA file live first</h3>
<p>Universal Links silently fall back to Safari if <code>apple-app-site-association</code> isn't reachable over HTTPS (no redirects, correct JSON, right team+bundle id). The entitlement alone isn't enough.</p>

<h3>13. Face ID vs Touch ID key</h3>
<p><code>NSFaceIDUsageDescription</code> covers Face ID; Touch ID needs no separate string but the same LocalAuthentication flow. Missing the Face ID string crashes on Face-ID devices only — passes QA on an older Touch-ID device.</p>

<h3>14. Background modes without entitlement</h3>
<p>Some <code>UIBackgroundModes</code> (e.g. <code>location</code>, <code>voip</code>) also require an entitlement or extra review justification. Declaring the mode alone doesn't grant unlimited background time.</p>

<h3>15. Expo prebuild --clean wipes native edits</h3>
<p>Any manual change to <code>ios/…/Info.plist</code>, the entitlements file, or AppDelegate is erased on a clean prebuild. Move it into <code>app.json</code> (<code>ios.infoPlist</code> / <code>ios.entitlements</code>) or a config plugin.</p>

<h3>16. CFBundleDisplayName length + localization</h3>
<p>Long display names get truncated under the icon; localize via <code>InfoPlist.strings</code> per language rather than hardcoding.</p>

<h3>17. Encryption compliance key</h3>
<p><code>ITSAppUsesNonExemptEncryption</code> (usually <code>false</code>) avoids a manual export-compliance prompt on every TestFlight upload; omit it and App Store Connect asks each time.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — NSAllowsArbitraryLoads = true to "just make networking work"</h3>
<p>Disabling ATS globally is the lazy fix, invites App Review questions, and hides insecure endpoints. Use scoped <code>NSExceptionDomains</code>, or fix the server to HTTPS.</p>

<h3>Anti-pattern 2 — Adding a permission API without its usage string</h3>
<p>Shipping camera/location code and forgetting the plist string = guaranteed crash for users who trigger it. Add the string in the same commit as the feature.</p>

<h3>Anti-pattern 3 — Vague or dishonest usage descriptions</h3>
<p>"This app needs camera access" is rejected. Say <em>why</em>: "Scan the desk QR to check in." Apple rejects generic or misleading purpose strings.</p>

<h3>Anti-pattern 4 — Hand-editing ios/ in an Expo prebuild project</h3>
<p>Edits vanish on the next <code>expo prebuild --clean</code> and cause "works on my machine" drift. Configure through <code>app.json</code> / a plugin so the native output is reproducible.</p>

<h3>Anti-pattern 5 — Forgetting to bump CFBundleVersion</h3>
<p>Every failed upload for "build already exists" wastes an archive cycle. Automate the build number (Fastlane <code>increment_build_number</code> or a script).</p>

<h3>Anti-pattern 6 — aps-environment left as development in the store build</h3>
<p>Push works internally, then dies for real users. Let Xcode manage the value per configuration; never hardcode <code>development</code> in the shared entitlements.</p>

<h3>Anti-pattern 7 — Relying on custom URL schemes for critical deep links</h3>
<p>Schemes are spoofable and give no graceful fallback when the app isn't installed. Prefer Universal Links (Associated Domains) for anything security- or marketing-critical.</p>

<h3>Anti-pattern 8 — Committing an entitlement the App ID doesn't have</h3>
<p>Breaks CI signing for the whole team. Enable the capability on the App ID first (Xcode Capabilities tab does both), then commit.</p>

<h3>Anti-pattern 9 — Overriding didFinishLaunching without calling super</h3>
<p>With <code>RCTAppDelegate</code>, forgetting <code>return [super application:… didFinishLaunchingWithOptions:…]</code> means the React root never builds → blank launch. Always chain to super.</p>

<h3>Anti-pattern 10 — Hardcoding the Metro URL in release</h3>
<p>Pointing <code>bundleURL</code> at <code>localhost:8081</code> unconditionally makes the store build white-screen on any device without Metro. Guard with <code>#if DEBUG</code>.</p>

<h3>Anti-pattern 11 — Editing AppDelegate.mm but not AppDelegate.h (or the Podfile)</h3>
<p>The header, implementation, and pod config are coupled — the sw-mobile iOS 26 fix needed all three changed together. A method added to <code>.mm</code> without its declaration, or a super-class change in <code>.h</code> without the matching pods, fails to compile or crashes at launch.</p>

<h3>Anti-pattern 12 — Ignoring the privacy manifest</h3>
<p>Skipping <code>PrivacyInfo.xcprivacy</code> (or a dependency skipping it) now blocks App Store upload. Audit required-reason APIs and tracking domains before release.</p>

<h3>Anti-pattern 13 — Putting secrets in Info.plist</h3>
<p>The plist ships in cleartext inside the app bundle — anyone can unzip an IPA and read it. Never store API secrets/keys there; use the Keychain or server-issued tokens.</p>

<h3>Anti-pattern 14 — Requesting permissions at launch instead of in context</h3>
<p>Prompting for camera/location on first launch (before the user understands why) tanks acceptance. Request at the moment of use; the plist string is the same either way.</p>

<h3>Anti-pattern 15 — Blanket background modes to be "safe"</h3>
<p>Declaring <code>audio</code>, <code>location</code>, <code>voip</code> you don't use invites rejection and battery scrutiny. Declare only the modes you actually run.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. What is Info.plist and why is it central on iOS?</div>
  <div class="qa-answer">
    <p>It's the app bundle's metadata dictionary — an XML property list of key/value pairs the OS reads before and during runtime: bundle identifier, display name, versions, supported orientations, URL schemes, background modes, ATS policy, and privacy usage-description strings. It matters because iOS enforces it: request a protected resource without the matching usage string and the app crashes; ship a permission with no purpose string and App Review rejects it.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Difference between CFBundleShortVersionString and CFBundleVersion?</div>
  <div class="qa-answer">
    <p><code>CFBundleShortVersionString</code> is the marketing/release version users see on the App Store, like 3.4.1. <code>CFBundleVersion</code> is the build number — a value that must strictly increase with every upload to App Store Connect within a given marketing version, like 218 then 219. You can push many builds under one marketing version to TestFlight.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. How do Info.plist and the .entitlements file differ?</div>
  <div class="qa-answer">
    <p>Info.plist is unsigned declarative metadata the OS trusts at face value — you can add any key. Entitlements are capabilities baked into the code signature and validated against your provisioning profile / App ID on Apple's servers: push (<code>aps-environment</code>), App Groups, Keychain Sharing, Associated Domains, Sign in with Apple. You can't self-grant an entitlement Apple hasn't provisioned; a mismatch fails code signing.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. What is App Transport Security and how does it affect networking?</div>
  <div class="qa-answer">
    <p>ATS (<code>NSAppTransportSecurity</code>) blocks cleartext HTTP by default since iOS 9, requiring HTTPS with TLS 1.2+. To allow an exception you add <code>NSExceptionDomains</code> with per-domain flags like <code>NSExceptionAllowsInsecureHTTPLoads</code>; the blanket <code>NSAllowsArbitraryLoads</code> disables ATS entirely and draws App Review scrutiny. It's why an <code>http://</code> API works on Android but silently fails on iOS.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. How do custom URL schemes and Universal Links differ, and where is each configured?</div>
  <div class="qa-answer">
    <p>Custom schemes (<code>myapp://</code>) are declared in Info.plist under <code>CFBundleURLTypes</code> — simple but spoofable, with no fallback if the app is absent. Universal Links (<code>https://app.company.com/...</code>) use the <strong>Associated Domains entitlement</strong> (<code>applinks:</code>) plus a server-hosted <code>apple-app-site-association</code> file — secure, and they fall back to the website if the app isn't installed. To query other apps' schemes you also need <code>LSApplicationQueriesSchemes</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Walk me through what happens from process start to the first React Native frame.</div>
  <div class="qa-answer">
    <p><code>main.m</code> calls <code>UIApplicationMain</code>, which creates the <code>UIApplication</code> and the AppDelegate, then calls <code>application:didFinishLaunchingWithOptions:</code>. There the app sets its module name and builds React Native — an <code>RCTBridge</code> + <code>RCTRootView</code> on the old arch, or an <code>RCTReactNativeFactory</code> under bridgeless new arch — attaches the root view to a window, and resolves the JS bundle via <code>sourceURLForBridge</code>/<code>bundleURL</code>. JS then runs and React paints the first frame.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. What does sourceURLForBridge / bundleURL return, and why the DEBUG check?</div>
  <div class="qa-answer">
    <p>In DEBUG it returns the Metro dev-server URL (<code>http://localhost:8081/index.bundle</code>) for live reload; in RELEASE it returns the embedded <code>main.jsbundle</code> from the app bundle, since there's no Metro in production. The <code>#if DEBUG</code> guard is essential — pointing at localhost in a release build white-screens on real devices.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. What is main.jsbundle and how is it produced?</div>
  <div class="qa-answer">
    <p>It's the pre-bundled JavaScript embedded in release builds. Xcode's "Bundle React Native code and images" build phase runs <code>react-native-xcode.sh</code>, invokes Metro to bundle JS + assets into <code>main.jsbundle</code>, and (with Hermes) compiles it to bytecode, copying it into the <code>.app</code>. <code>bundleURL</code> loads it in the release branch.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Which privacy usage strings do you commonly set, and what happens if one is missing?</div>
  <div class="qa-answer">
    <p><code>NSCameraUsageDescription</code>, <code>NSPhotoLibraryUsageDescription</code>, <code>NSLocationWhenInUseUsageDescription</code>, <code>NSMicrophoneUsageDescription</code>, <code>NSFaceIDUsageDescription</code>, <code>NSUserTrackingUsageDescription</code>. If the resource is accessed with the string absent, the app crashes immediately (SIGABRT) rather than showing a denial — and App Review rejects a permission without a purpose string.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. What is the privacy manifest (PrivacyInfo.xcprivacy)?</div>
  <div class="qa-answer">
    <p>A plist Apple now requires that declares collected data types, required-reason API usage (e.g. UserDefaults, file timestamps, disk space — each with an approved reason code), and tracking domains. Third-party SDKs must ship their own; a missing manifest on your app or a dependency blocks App Store upload.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Give three real entitlements and what they enable.</div>
  <div class="qa-answer">
    <ul>
      <li><code>aps-environment</code> (development/production) — Push Notifications; no APNs token without it.</li>
      <li><code>com.apple.security.application-groups</code> (<code>group.*</code>) — a shared container/UserDefaults between the app and its extensions or widgets.</li>
      <li><code>com.apple.developer.associated-domains</code> (<code>applinks:</code>) — Universal Links and shared web credentials.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Push works in TestFlight but not the App Store build. What do you check?</div>
  <div class="qa-answer">
    <p>The <code>aps-environment</code> entitlement: dev-signed builds use <code>development</code>, store builds <code>production</code>, and each talks to a different APNs endpoint. A token registered under the wrong environment won't receive from the other. Confirm the store build is signed with a distribution profile and <code>production</code>, and that the server sends to the matching APNs environment.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Where do these files come from in an Expo project?</div>
  <div class="qa-answer">
    <p>They're generated at <code>expo prebuild</code> from <code>app.json</code>/<code>app.config.js</code>: <code>ios.bundleIdentifier</code> → CFBundleIdentifier, <code>ios.buildNumber</code> → CFBundleVersion, top-level <code>version</code> → CFBundleShortVersionString, <code>ios.infoPlist</code> for arbitrary keys, <code>ios.entitlements</code> and <code>ios.associatedDomains</code> for capabilities, and config plugins (like <code>expo-notifications</code>) that inject <code>aps-environment</code>, background modes, and usage strings. Hand edits to <code>ios/</code> are wiped by <code>--clean</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. When does a SceneDelegate come into play?</div>
  <div class="qa-answer">
    <p>When Info.plist declares <code>UIApplicationSceneManifest</code>, iOS drives per-window UI lifecycle through a <code>UISceneDelegate</code> instead of hanging the window off the AppDelegate — used for multi-window and iPad. Most RN templates keep the single-window AppDelegate path and don't ship a SceneDelegate; mixing the two (setting <code>self.window</code> while a scene manifest exists) causes a nil/ignored window.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. How do the AppDelegate .h, .mm, and Podfile relate — and how did that bite in practice?</div>
  <div class="qa-answer">
    <p>The header declares the AppDelegate's superclass and method signatures; the <code>.mm</code> implements them; the Podfile controls which React Native pods and build settings back them. They're coupled — a method in <code>.mm</code> needs its declaration in <code>.h</code>, and a base-class change needs matching pods. On sw-mobile the iOS 26 launch fix required patching AppDelegate.h, AppDelegate.mm, and the Podfile together (plus a noop Swift file) for the app to boot.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You distinguish Info.plist (unsigned, declarative) from entitlements (signed, provisioning-checked).</li>
    <li>You know marketing version vs build number and the "bump build" upload rule.</li>
    <li>You can explain ATS and why HTTP fails on iOS but not Android.</li>
    <li>You name privacy usage strings and know a missing one crashes, not denies.</li>
    <li>You trace main.m → UIApplicationMain → AppDelegate → RN root → bundle URL.</li>
    <li>You explain the DEBUG Metro vs RELEASE main.jsbundle bundle-URL split.</li>
    <li>You prefer Universal Links (Associated Domains) over custom URL schemes.</li>
    <li>You know Expo generates all of this from app.json at prebuild.</li>
  </ul>
</div>
` },

  ]
});
