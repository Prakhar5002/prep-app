window.PREP_SITE.registerTopic({
  id: 'iosn-folder-tour',
  module: 'iOS Native (Deep)',
  title: 'Anatomy of ios/ Folder',
  estimatedReadTime: '22 min',
  tags: ['ios', 'xcodeproj', 'xcworkspace', 'podfile', 'podfile-lock', 'pods', 'appdelegate', 'info-plist', 'entitlements', 'xcassets', 'launchscreen', 'privacyinfo', 'noop-file-swift', 'bridging-header', 'cocoapods', 'gemfile', 'xcode-env', 'deriveddata', 'react-native', 'expo', 'prebuild', 'cng', 'config-plugins'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>The <code>ios/</code> folder is the real, buildable Xcode project that wraps your React Native app. It is a mix of two things: a small amount of <strong>native app scaffolding</strong> (AppDelegate, Info.plist, assets, entitlements) that YOU own, and a large amount of <strong>generated machinery</strong> (Pods, DerivedData, codegen output) that tooling owns and can regenerate.</p>
<p>The single most important habit: after CocoaPods runs, you open <code>&lt;AppName&gt;.xcworkspace</code>, never <code>&lt;AppName&gt;.xcodeproj</code>. The workspace stitches your app project together with the <code>Pods</code> project; opening the bare project builds without your dependencies and fails in confusing ways.</p>
<p>Three files you actually hand-edit: <code>AppDelegate.mm</code> (app launch + RN root), <code>Info.plist</code> (permissions, config, URL schemes), and the <code>Podfile</code> (native dependency declarations). Almost everything else is either generated or touched rarely.</p>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Open the <strong>.xcworkspace</strong>, not the <strong>.xcodeproj</strong>. The <code>.xcodeproj</code> is your app target; <code>Pods/</code> is generated dependencies; the <code>.xcworkspace</code> is the container that builds both together. Edit AppDelegate + Info.plist + Podfile; let Pods and DerivedData regenerate.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What the ios/ folder actually is</h3>
<p>When you run <code>npx react-native init</code> (bare RN) or <code>expo prebuild</code> (Expo), the CLI drops a fully-formed native iOS app into <code>ios/</code>. It is a standard Xcode project — the same thing a pure-Swift iOS engineer would recognize — with a few React-Native-specific hooks bolted in: an <code>AppDelegate</code> that boots a JS bundle into a root view, a <code>Podfile</code> that pulls in RN's native pods, and a codegen step that generates C++ glue for the New Architecture.</p>
<p>The folder answers a simple question at build time: "how do I turn your JS + native code into a signed <code>.app</code> / <code>.ipa</code> that iOS will run?" Xcode reads the project, CocoaPods supplies third-party native libraries, the Metro/Hermes step bundles your JS, and the linker fuses it all into one binary.</p>

<h3>Why it splits into "yours" vs "generated"</h3>
<table>
  <thead><tr><th>You own (commit, hand-edit)</th><th>Tooling owns (regenerate, git-ignore)</th></tr></thead>
  <tbody>
    <tr><td><code>AppDelegate.h/.mm</code>, <code>main.m</code></td><td><code>Pods/</code></td></tr>
    <tr><td><code>Info.plist</code>, <code>*.entitlements</code></td><td><code>build/</code></td></tr>
    <tr><td><code>Podfile</code>, <code>Gemfile</code></td><td><code>~/Library/Developer/Xcode/DerivedData</code></td></tr>
    <tr><td><code>Images.xcassets</code>, <code>LaunchScreen.storyboard</code></td><td>codegen output (build/generated)</td></tr>
    <tr><td><code>Podfile.lock</code>, <code>Gemfile.lock</code> (commit!)</td><td><code>.xcode.env.local</code> (per-machine)</td></tr>
    <tr><td><code>project.pbxproj</code> (inside <code>.xcodeproj</code>)</td><td><code>xcuserdata/</code> (per-user UI state)</td></tr>
  </tbody>
</table>

<h3>Why you must not fear it</h3>
<p>Most RN developers treat <code>ios/</code> as an opaque box until a build breaks. The moment a pod fails to install, a permission string is missing, or the app crashes on launch, you need to know exactly which file owns that concern. This topic is the map. For the deep dives, three sibling topics go further: <strong>iosn-xcode-project</strong> (the <code>.xcodeproj</code>/<code>.pbxproj</code>/target/scheme internals), <strong>iosn-cocoapods</strong> (Podfile syntax, resolution, the lockfile), and <strong>iosn-plist-entry</strong> (every Info.plist key). Here we tour the whole folder and hand off to those.</p>

<h3>Why Expo changes the ownership story</h3>
<p>In a managed / prebuild Expo app, the ENTIRE <code>ios/</code> folder is generated output. It is produced from <code>app.json</code> / <code>app.config.js</code> plus config plugins by <code>expo prebuild</code>. That flips the "you own AppDelegate" rule on its head — you can delete and regenerate the whole folder, and you configure native values declaratively instead of by hand-editing. We flag this with an Expo note at each relevant file.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The tree (bare RN 0.7x app named "MyApp")</h3>
<div class="diagram">
<pre>
ios/
├── MyApp.xcodeproj/            ← YOUR app project (a bundle/folder)
│   ├── project.pbxproj         ← the actual project graph (targets, files, build settings)
│   ├── xcshareddata/           ← shared schemes (commit these)
│   └── xcuserdata/             ← per-user UI state (git-ignore)
│
├── MyApp.xcworkspace/          ← OPEN THIS. Container = app project + Pods project
│   └── contents.xcworkspacedata
│
├── MyApp/                      ← the app "group" — source & resources
│   ├── AppDelegate.h           ← app lifecycle header (ObjC) [RN &lt; 0.77]
│   ├── AppDelegate.mm           ← app launch, RN root view, JS bundle URL
│   ├── main.m                  ← int main() → UIApplicationMain
│   ├── Info.plist              ← permissions, config, URL schemes, bundle id
│   ├── MyApp.entitlements      ← capabilities (push, keychain, associated domains)
│   ├── Images.xcassets/        ← AppIcon, images, named colors
│   ├── LaunchScreen.storyboard ← splash shown before JS loads
│   ├── PrivacyInfo.xcprivacy   ← Apple privacy manifest
│   ├── noop-file.swift         ← forces Swift toolchain linkage (when needed)
│   └── MyApp-Bridging-Header.h ← Swift ↔ ObjC bridge (only if you write Swift)
│
├── Podfile                     ← declares native pods (RN, Hermes, your libs)
├── Podfile.lock                ← resolved exact pod versions (COMMIT)
├── Pods/                       ← installed pod sources (GENERATED, git-ignore)
├── Gemfile                     ← pins CocoaPods/fastlane Ruby gems
├── Gemfile.lock                ← resolved gem versions (COMMIT)
├── .xcode.env                  ← exports NODE_BINARY (committed, portable)
├── .xcode.env.local            ← machine-specific NODE_BINARY (git-ignore)
└── build/                      ← local build artifacts (GENERATED, git-ignore)

~/Library/Developer/Xcode/DerivedData/   ← Xcode's global build cache (outside repo)
</pre>
</div>

<h3>The "who assembles the binary" picture</h3>
<div class="diagram">
<pre>
  app.json / Podfile / package.json
        │
        │  (Expo: expo prebuild)   (bare: already there)
        ▼
   ios/  native project  ──┐
                          │   pod install
   node_modules (RN libs) ─┼──────────────►  Pods/  +  Podfile.lock
                          │                    │
                          ▼                    ▼
                   MyApp.xcworkspace  =  app project + Pods project
                          │
                          │  xcodebuild / Xcode
                          ▼
          compile native + run codegen + bundle JS (Hermes)
                          │
                          ▼
                   MyApp.app  →  MyApp.ipa (signed)
</pre>
</div>

<h3>The mental split that makes the folder click</h3>
<ul>
  <li><strong>Project</strong> (<code>.xcodeproj</code>) = one app, its targets, its files, its build settings. Self-contained but knows nothing about pods.</li>
  <li><strong>Pods</strong> (<code>Pods/</code> + <code>Pods.xcodeproj</code>) = a SECOND project holding every native dependency, generated by CocoaPods.</li>
  <li><strong>Workspace</strong> (<code>.xcworkspace</code>) = a thin container that says "build these two projects together and let them see each other's headers." That is why the workspace exists and why you open it.</li>
</ul>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"The <code>.xcodeproj</code> is the project so I should open it." No — once you run CocoaPods, opening the bare project omits the Pods project, so React, Hermes, and every native dependency are missing. You get "module 'React' not found" or thousands of linker errors. The <code>.xcworkspace</code> is the only correct entry point in a RN app.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Top level — the project & workspace bundles</h3>

<h4><code>MyApp.xcodeproj</code> (a bundle, not a file)</h4>
<p>On disk it is a folder that Finder shows as a single document. Inside, the important payload is <code>project.pbxproj</code> — an old-style ASCII plist that IS your project graph: every source file reference, every build phase, every target, and every build setting. Merge conflicts here are notorious because Xcode rewrites large regions on any change. You rarely edit it by hand; when you do (or when it conflicts), see <strong>iosn-xcode-project</strong> for how to read the <code>PBX*</code> object graph, targets, schemes, and build configurations.</p>
<pre><code class="language-text">MyApp.xcodeproj/
├── project.pbxproj          ← the project graph (targets, files, settings)
├── project.xcworkspace/     ← implicit workspace (do not open this one)
├── xcshareddata/xcschemes/  ← shared schemes → COMMIT
└── xcuserdata/              ← breakpoints, window state → git-ignore</code></pre>

<h4><code>MyApp.xcworkspace</code> — open THIS</h4>
<p>Also a bundle. Its <code>contents.xcworkspacedata</code> is a tiny XML file listing the projects the workspace contains — your app project plus the generated <code>Pods/Pods.xcodeproj</code>. CocoaPods creates this workspace the first time you run <code>pod install</code>. Open it with <code>xed ios</code> or <code>open ios/MyApp.xcworkspace</code>.</p>
<pre><code class="language-xml">&lt;!-- contents.xcworkspacedata --&gt;
&lt;Workspace version="1.0"&gt;
  &lt;FileRef location="group:MyApp.xcodeproj"&gt;&lt;/FileRef&gt;
  &lt;FileRef location="group:Pods/Pods.xcodeproj"&gt;&lt;/FileRef&gt;
&lt;/Workspace&gt;</code></pre>

<h4><code>Podfile</code> — native dependency manifest</h4>
<p>Ruby DSL that declares which native pods your app links: React Native itself (via <code>use_react_native!</code>), Hermes, and any pod-based third-party library. Autolinking injects pods for RN community libraries automatically. Full syntax, <code>use_frameworks!</code>, modular headers, post_install hooks, and resolution live in <strong>iosn-cocoapods</strong>.</p>
<pre><code class="language-ruby"># Podfile (RN 0.7x, trimmed)
require Pod::Executable.execute_command('node', ['-p',
  'require.resolve("react-native/scripts/react_native_pods.rb", {paths: [process.argv[1]]})',
  __dir__]).strip

platform :ios, min_ios_version_supported
prepare_react_native_project!

target 'MyApp' do
  config = use_native_modules!
  use_react_native!(
    :path =&gt; config[:reactNativePath],
    :hermes_enabled =&gt; true,
    :app_path =&gt; "#{Pod::Config.instance.installation_root}/.."
  )
  post_install do |installer|
    react_native_post_install(installer, config[:reactNativePath])
  end
end</code></pre>

<h4><code>Podfile.lock</code> — commit it</h4>
<p>Records the EXACT resolved version of every pod plus a checksum. It is the iOS analogue of <code>package-lock.json</code>. Committing it guarantees every machine and CI installs identical native code. Never delete it to "fix" a build; delete <code>Pods/</code> and re-run <code>pod install</code> instead so it re-derives from the lock.</p>

<h4><code>Pods/</code> — generated, git-ignored</h4>
<p>Holds the downloaded source of every pod plus <code>Pods.xcodeproj</code> and the <code>Pods-MyApp.*.xcconfig</code> files that feed build settings into your target. This directory is fully reproducible from <code>Podfile</code> + <code>Podfile.lock</code>, so the standard RN <code>.gitignore</code> excludes it. If it is committed in your repo, that is a deliberate (heavy) choice some teams make for CI determinism.</p>

<h4><code>Gemfile</code> / <code>Gemfile.lock</code> — pin the tooling itself</h4>
<p>CocoaPods is a Ruby gem; so is fastlane. The <code>Gemfile</code> pins their versions so everyone runs the SAME CocoaPods (a mismatched <code>pod</code> version can rewrite <code>Podfile.lock</code> or the pbxproj differently). Run pods via <code>bundle exec pod install</code>, not bare <code>pod install</code>, to honor the pinned version.</p>
<pre><code class="language-ruby"># Gemfile
source 'https://rubygems.org'
ruby '&gt;= 2.6.10'
gem 'cocoapods', '~&gt; 1.15'
gem 'activesupport', '&gt;= 6.1.7.5', '!= 7.1.0'</code></pre>

<h4><code>.xcode.env</code> / <code>.xcode.env.local</code> — where Node lives</h4>
<p>RN's Xcode build phases (bundling JS, running codegen) need to invoke <code>node</code>. These files export <code>NODE_BINARY</code> so the build script finds the right Node even when Xcode runs with a minimal PATH. <code>.xcode.env</code> is committed and portable (uses <code>command -v node</code>); <code>.xcode.env.local</code> overrides it with an absolute path for one machine and is git-ignored. A missing/incorrect <code>NODE_BINARY</code> is a classic "PhaseScriptExecution failed" cause on CI or after switching Node managers (nvm, asdf, Homebrew).</p>
<pre><code class="language-bash"># .xcode.env  (committed)
export NODE_BINARY=$(command -v node)

# .xcode.env.local  (per-machine, git-ignored)
export NODE_BINARY=/Users/you/.nvm/versions/node/v20.11.0/bin/node</code></pre>

<h4><code>build/</code> and DerivedData — throwaway artifacts</h4>
<p><code>ios/build/</code> appears when you build from the CLI. The bigger cache is Xcode's global <code>~/Library/Developer/Xcode/DerivedData/</code>, holding compiled objects, indexes, and module caches for every project you have ever opened. Both are safe to delete and are the first thing to nuke when Xcode behaves irrationally (stale headers, ghost errors). Neither is committed.</p>

<h3>Inside the <code>MyApp/</code> group — your app's source</h3>

<h4><code>AppDelegate.h</code> + <code>AppDelegate.mm</code></h4>
<p>The entry class of the native app. On RN 0.7x it is Objective-C++ (<code>.mm</code>) so it can call into C++ (Hermes, TurboModules, Fabric). It creates the RN root view, tells RN where to load the JS bundle from (Metro in dev, the baked-in <code>main.jsbundle</code> in release), and hosts app-lifecycle callbacks like <code>application:didFinishLaunchingWithOptions:</code> where you initialize SDKs (push, analytics). RN 0.77+ replaced this pair with a single Swift <code>AppDelegate.swift</code>; the concept is identical.</p>
<pre><code class="language-objc">// AppDelegate.mm  (RN 0.7x shape, trimmed)
#import "AppDelegate.h"
#import &lt;React/RCTBundleURLProvider.h&gt;

@implementation AppDelegate
- (BOOL)application:(UIApplication *)application
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  self.moduleName = @"MyApp";
  self.initialProps = @{};
  // init native SDKs here (push, crash reporting)
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

// dev: Metro URL. release: the bundled main.jsbundle.
- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}
@end</code></pre>

<h4><code>main.m</code></h4>
<p>The literal C entry point: <code>int main()</code> calling <code>UIApplicationMain</code> and naming your <code>AppDelegate</code> as the app's delegate class. You almost never touch it. It exists because that is how every iOS binary starts.</p>
<pre><code class="language-objc">int main(int argc, char *argv[]) {
  @autoreleasepool {
    return UIApplicationMain(argc, argv, nil, NSStringFromClass([AppDelegate class]));
  }
}</code></pre>

<h4><code>Info.plist</code> — the app's config surface</h4>
<p>An XML property list of key/value pairs iOS reads at install/launch: bundle identifier and version (<code>CFBundleIdentifier</code>, <code>CFBundleShortVersionString</code>, <code>CFBundleVersion</code>), display name, supported orientations, App Transport Security, URL schemes / deep links, and — critically — every permission usage string (<code>NSCameraUsageDescription</code>, <code>NSLocationWhenInUseUsageDescription</code>, etc.). Missing a required usage string is an automatic App Store rejection or a hard crash the instant you call that API. Every key is catalogued in <strong>iosn-plist-entry</strong>.</p>
<pre><code class="language-xml">&lt;key&gt;CFBundleShortVersionString&lt;/key&gt;
&lt;string&gt;1.4.0&lt;/string&gt;
&lt;key&gt;NSCameraUsageDescription&lt;/key&gt;
&lt;string&gt;We use the camera to scan your check-in QR code.&lt;/string&gt;
&lt;key&gt;CFBundleURLTypes&lt;/key&gt;
&lt;array&gt;
  &lt;dict&gt;
    &lt;key&gt;CFBundleURLSchemes&lt;/key&gt;
    &lt;array&gt;&lt;string&gt;myapp&lt;/string&gt;&lt;/array&gt;
  &lt;/dict&gt;
&lt;/array&gt;</code></pre>

<h4><code>MyApp.entitlements</code></h4>
<p>A plist declaring CAPABILITIES the app requests from the OS and that must match your provisioning profile / App ID: push notifications (<code>aps-environment</code>), Keychain sharing / access groups, Associated Domains (Universal Links, <code>applinks:</code>), App Groups, Sign in with Apple, HealthKit, etc. Entitlements are signed into the binary — a mismatch between the entitlements file and the provisioning profile is the classic "Provisioning profile doesn't include the ... entitlement" signing failure.</p>

<h4><code>Images.xcassets</code> / <code>Assets.xcassets</code></h4>
<p>An asset catalog: a structured folder of <code>.imageset</code>, <code>.appiconset</code>, and <code>.colorset</code> entries with per-scale (@1x/@2x/@3x) and per-appearance (light/dark) variants. <code>AppIcon.appiconset</code> holds every icon size iOS demands. Xcode compiles this catalog into an optimized <code>Assets.car</code> at build time. This is where your app icon and any native-side images/colors live (as opposed to JS-bundled images which ship in the JS bundle).</p>

<h4><code>LaunchScreen.storyboard</code> (or a SplashScreen)</h4>
<p>The static screen iOS renders INSTANTLY at launch, before your JS bundle has loaded and rendered a single React view. It is a real UIKit storyboard (or, in some setups, a <code>.xib</code> / a splash provided by <code>expo-splash-screen</code>). Because it shows during the RN cold-start gap, matching its background to your app's first screen removes the jarring white flash.</p>

<h4><code>PrivacyInfo.xcprivacy</code> — the privacy manifest</h4>
<p>Apple's required (as of 2024) privacy manifest: a plist declaring the data types your app collects, the tracking domains it contacts, and — importantly — your <strong>reasons for using "required-reason" APIs</strong> (e.g., <code>UserDefaults</code>, file timestamps, <code>systemUptime</code>). Many RN libraries now ship their own <code>.xcprivacy</code> that gets merged. A missing or incomplete manifest triggers App Store Connect warnings/rejections at upload.</p>

<h4><code>noop-file.swift</code> — force the Swift toolchain</h4>
<p>An empty Swift file whose ONLY job is to make Xcode link the Swift standard library and run the Swift compile phase for a target that is otherwise pure ObjC/C++. Some pods ship Swift code; if your app target has no Swift file of its own, the Swift runtime may not be embedded and you get runtime dyld errors about missing <code>libswift*</code> dylibs. Adding one empty <code>.swift</code> file flips Xcode's "this target uses Swift" flag. CocoaPods and Expo sometimes inject exactly this file for that reason.</p>

<h4><code>MyApp-Bridging-Header.h</code></h4>
<p>Only present when your app target mixes Swift and Objective-C. It exposes ObjC headers to your Swift code (Swift imports whatever this header <code>#import</code>s). Xcode points to it via the <code>SWIFT_OBJC_BRIDGING_HEADER</code> build setting. Pure-ObjC or pure-Swift targets do not need one.</p>

<h3>Concepts, tied together</h3>
<ul>
  <li><strong>Group vs folder reference.</strong> In Xcode, a yellow "group" is a logical grouping in the navigator that may or may not match a real folder on disk; a blue "folder reference" mirrors a real directory. RN's <code>MyApp/</code> is a group. This matters when files exist on disk but the pbxproj never added them to a build phase — they silently do not compile. See <strong>iosn-xcode-project</strong>.</li>
  <li><strong>Why the workspace exists.</strong> Two Xcode projects (yours + Pods) need to share headers and build products. A workspace is the container that lets them; the <code>.xcodeproj</code> alone cannot see the pods.</li>
  <li><strong>How RN native + pods assemble.</strong> Your <code>AppDelegate</code> + assets compile as the app target; <code>use_react_native!</code> + autolinking pull RN and community native code as pods; codegen turns your JS specs into C++/ObjC glue during the build; Hermes bundles + bytecode-compiles your JS; the linker fuses everything into <code>MyApp.app</code>.</li>
</ul>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — this whole folder is generated (CNG)</div>
  <p>In a managed / prebuild Expo project, <code>ios/</code> is produced by <code>expo prebuild</code> from <code>app.json</code>/<code>app.config.js</code> + config plugins. This is Continuous Native Generation (CNG). Consequences: (1) hand-edits to <code>AppDelegate</code>, <code>Info.plist</code>, entitlements, or the <code>Podfile</code> are WIPED by <code>expo prebuild --clean</code>; (2) you can safely add <code>ios/</code> to <code>.gitignore</code> and regenerate on demand. Configure native values declaratively instead: <code>infoPlist</code> and <code>entitlements</code> keys under <code>ios</code> in <code>app.json</code>, <code>expo-build-properties</code> for pod/deployment-target settings, and custom <code>config-plugins</code> for anything else. Cross-reference the <strong>rn-architecture</strong> / plugin topics for how a plugin mutates these files at prebuild.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — the correct open/build sequence</h3>
<pre><code class="language-bash"># fresh clone or after adding a native dep:
cd ios
bundle install            # install pinned CocoaPods from Gemfile
bundle exec pod install   # generate Pods/ + MyApp.xcworkspace
cd ..
open ios/MyApp.xcworkspace  # NOT MyApp.xcodeproj</code></pre>

<h3>Example 2 — what a wrong-file-open error looks like</h3>
<pre><code class="language-text"># Symptom after opening MyApp.xcodeproj instead of the workspace:
error: module 'React' not found
ld: framework 'hermes' not found
# Fix: close it, open MyApp.xcworkspace instead.</code></pre>

<h3>Example 3 — reading the ownership from .gitignore</h3>
<pre><code class="language-text"># RN's default ios/.gitignore (trimmed) — "generated" made explicit
ios/build/
ios/Pods/
ios/*.xcworkspace        # sometimes ignored; workspace is regenerated by pods
.xcode.env.local
*.xcuserstate
# NOT ignored (you commit these):
#   Podfile, Podfile.lock, Gemfile, Gemfile.lock
#   MyApp.xcodeproj/project.pbxproj, AppDelegate.mm, Info.plist</code></pre>

<h3>Example 4 — adding a permission string (bare RN)</h3>
<pre><code class="language-xml">&lt;!-- ios/MyApp/Info.plist --&gt;
&lt;key&gt;NSLocationWhenInUseUsageDescription&lt;/key&gt;
&lt;string&gt;Your location shows nearby meeting rooms.&lt;/string&gt;</code></pre>

<h3>Example 5 — the SAME permission in Expo (app.json)</h3>
<pre><code class="language-json">{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Your location shows nearby meeting rooms."
      }
    }
  }
}</code></pre>

<h3>Example 6 — set iOS deployment target without hand-editing the Podfile (Expo)</h3>
<pre><code class="language-json">{
  "plugins": [
    ["expo-build-properties", {
      "ios": { "deploymentTarget": "15.1", "useFrameworks": "static" }
    }]
  ]
}</code></pre>

<h3>Example 7 — where DerivedData lives, and nuking it</h3>
<pre><code class="language-bash"># the global cache (outside your repo):
ls ~/Library/Developer/Xcode/DerivedData/
# clean-slate an ugly build:
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf ios/build
cd ios &amp;&amp; bundle exec pod install</code></pre>

<h3>Example 8 — reading contents.xcworkspacedata to confirm both projects</h3>
<pre><code class="language-bash">cat ios/MyApp.xcworkspace/contents.xcworkspacedata
# expect FileRefs for BOTH MyApp.xcodeproj and Pods/Pods.xcodeproj</code></pre>

<h3>Example 9 — fixing "NODE_BINARY not set" on CI</h3>
<pre><code class="language-bash"># .xcode.env.local is git-ignored, so CI lacks it. Either:
echo "export NODE_BINARY=$(command -v node)" &gt; ios/.xcode.env.local
# or rely on the committed ios/.xcode.env using command -v node.</code></pre>

<h3>Example 10 — real: sw-mobile's iOS 26 launch patches</h3>
<p>Prakhar's <code>sw-mobile</code> (Expo 53 / RN 0.79, Paper/old arch, Hermes) needed FOUR coupled native edits to launch on iOS 26 simulators — and because it is an Expo prebuild app, they are applied via config plugins / patches so <code>expo prebuild --clean</code> does not erase them: a <code>Podfile</code> post_install tweak, an <code>AppDelegate.h</code> change, an <code>AppDelegate.mm</code> change, and an empty <code>noop-file.swift</code> added to the target to force Swift-stdlib linkage. This is the exact "these files travel together" lesson: the launch path spans Podfile + AppDelegate (both files) + a Swift noop, and touching one without the others left the app crashing on cold start.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Opening the wrong bundle</h3>
<p>Opening <code>MyApp.xcodeproj</code> (or the implicit <code>MyApp.xcodeproj/project.xcworkspace</code>) instead of the top-level <code>MyApp.xcworkspace</code> omits the Pods project. Symptom: "module 'React' not found" or a flood of linker errors. Always open the <code>.xcworkspace</code> that sits directly in <code>ios/</code>.</p>

<h3>2. Podfile.lock committed but Pods/ stale</h3>
<p>If teammate A bumps a pod and commits <code>Podfile.lock</code>, teammate B's local <code>Pods/</code> is now behind. Xcode links old headers → weird runtime mismatches. Fix: <code>bundle exec pod install</code> after every pull that touches the lock or <code>package.json</code>.</p>

<h3>3. .pbxproj merge conflicts</h3>
<p>Two branches adding files both rewrite <code>project.pbxproj</code>, producing conflicts in an unreadable ASCII plist. Resolve carefully (or regenerate on Expo). This is a top reason teams move to CNG so nobody hand-edits the pbxproj.</p>

<h3>4. Missing Info.plist usage string</h3>
<p>Calling an API (camera, location, contacts) whose <code>NS...UsageDescription</code> is absent crashes IMMEDIATELY with a console message naming the missing key — not a permission denial, a hard crash. Add the string before shipping.</p>

<h3>5. Entitlements vs provisioning profile mismatch</h3>
<p>Enabling a capability in the <code>.entitlements</code> file (push, associated domains) without adding it to the App ID / provisioning profile fails code signing: "provisioning profile doesn't include the ... entitlement." Entitlements must be a subset of what the profile grants.</p>

<h3>6. noop-file.swift missing → dyld crash</h3>
<p>A target that links Swift pods but has NO Swift file of its own may not embed the Swift runtime, crashing at launch with "Library not loaded: @rpath/libswiftCore.dylib." Adding one empty <code>noop-file.swift</code> forces the Swift build phase and runtime embedding.</p>

<h3>7. Bridging header only when mixing languages</h3>
<p>A <code>-Bridging-Header.h</code> is required only when your app target has BOTH Swift and ObjC sources. If Xcode auto-created one and you removed all Swift, the dangling <code>SWIFT_OBJC_BRIDGING_HEADER</code> setting can error; clear it.</p>

<h3>8. DerivedData poisoning</h3>
<p>Stale module caches in <code>~/Library/Developer/Xcode/DerivedData</code> cause "ghost" errors that survive code fixes. Deleting DerivedData (and <code>ios/build</code>) is the canonical first debugging step; it costs only a rebuild.</p>

<h3>9. PrivacyInfo.xcprivacy incomplete</h3>
<p>Since 2024, uploading without required-reason API declarations (or with an incomplete data-collection manifest) triggers App Store Connect emails/rejections. Library-supplied <code>.xcprivacy</code> files are merged, but your app's own usage still needs declaring.</p>

<h3>10. Two Info.plist copies (main vs test target)</h3>
<p>Projects often have a second <code>Info.plist</code> for the test target. Editing the wrong one changes nothing at runtime. Confirm which target's build settings point to the plist you are editing.</p>

<h3>11. .xcode.env.local absent on a new machine</h3>
<p>Because it is git-ignored, a fresh clone or CI has no <code>.xcode.env.local</code>. If the committed <code>.xcode.env</code> can find Node via <code>command -v node</code> you are fine; otherwise the JS-bundling build phase fails with "NODE_BINARY not set" / "node: command not found."</p>

<h3>12. Expo prebuild --clean wipes hand-edits</h3>
<p>In a CNG project, ANY manual change under <code>ios/</code> is discarded by <code>expo prebuild --clean</code>. Edits must live in <code>app.json</code>, <code>expo-build-properties</code>, or a config plugin. Forgetting this loses your native patch on the next regen — exactly why sw-mobile's iOS 26 fixes are captured as plugins/patches.</p>

<h3>13. Asset catalog vs JS images</h3>
<p>The app ICON must live in <code>Images.xcassets/AppIcon.appiconset</code> (native), while <code>&lt;Image source={require('./x.png')}&gt;</code> ships in the JS bundle. Putting a UI image only in the asset catalog does not make it available to JS, and vice versa.</p>

<h3>14. LaunchScreen edits not appearing</h3>
<p>iOS aggressively caches the launch screen snapshot. After editing <code>LaunchScreen.storyboard</code>, delete the app from the device/simulator (or wipe the snapshot cache) or you keep seeing the old splash.</p>

<h3>15. Committing Pods/ vs ignoring it</h3>
<p>Default RN ignores <code>Pods/</code>. Some teams commit it for hermetic CI (no network at build). Both are valid but be consistent — a half-committed <code>Pods/</code> diverging from <code>Podfile.lock</code> is worse than either extreme.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — opening the .xcodeproj in a RN app</h3>
<p>It silently drops the Pods project and produces "React not found" errors that send people down rabbit holes. Always open the <code>.xcworkspace</code>.</p>

<h3>Anti-pattern 2 — deleting Podfile.lock to fix a build</h3>
<p>Removing the lock lets pods re-resolve to newer versions, changing native code under you. Delete <code>Pods/</code> and re-run <code>pod install</code> instead; keep the lock as the source of truth.</p>

<h3>Anti-pattern 3 — hand-editing ios/ in an Expo prebuild app</h3>
<p>Any manual native edit is erased on <code>expo prebuild --clean</code>. Encode the change in <code>app.json</code> / <code>expo-build-properties</code> / a config plugin so it survives regeneration.</p>

<h3>Anti-pattern 4 — running bare pod install</h3>
<p>Bare <code>pod install</code> uses whatever CocoaPods is on PATH, which may differ from the pinned <code>Gemfile</code> version and rewrite the lock/pbxproj inconsistently. Use <code>bundle exec pod install</code>.</p>

<h3>Anti-pattern 5 — committing DerivedData or ios/build</h3>
<p>They are huge, machine-specific caches. Committing them bloats the repo and causes phantom conflicts. Keep them git-ignored; they always regenerate.</p>

<h3>Anti-pattern 6 — editing generated files under Pods/</h3>
<p>Any change inside <code>Pods/</code> is blown away on the next <code>pod install</code>. Patch upstream via a <code>post_install</code> hook, <code>patch-package</code>, or a fork instead.</p>

<h3>Anti-pattern 7 — forgetting a permission usage string</h3>
<p>Shipping code that calls camera/location without the matching <code>NS...UsageDescription</code> is a guaranteed crash the first time the API is hit, and an App Store rejection. Add strings when you add the feature.</p>

<h3>Anti-pattern 8 — enabling a capability only in entitlements</h3>
<p>Flipping on push / associated domains in the <code>.entitlements</code> without matching the App ID + profile fails signing. Capabilities must be granted on BOTH sides.</p>

<h3>Anti-pattern 9 — treating main.m / project.pbxproj as "just edit it"</h3>
<p><code>main.m</code> is boilerplate you should not need to touch, and <code>project.pbxproj</code> is machine-managed — hand-edits there are error-prone and merge-hostile. Change project config through Xcode's UI or (on Expo) plugins.</p>

<h3>Anti-pattern 10 — dropping a file in the folder and expecting it to compile</h3>
<p>Because <code>MyApp/</code> is a group, putting a <code>.m</code>/<code>.swift</code> on disk does NOT add it to the target's Compile Sources build phase. It must be added to the target, or it is silently ignored.</p>

<h3>Anti-pattern 11 — removing noop-file.swift to "clean up"</h3>
<p>It looks pointless, so someone deletes it — and the app crashes at launch with a missing libswift dylib. If Swift pods are present and no other Swift file exists, that noop is load-bearing.</p>

<h3>Anti-pattern 12 — putting the app icon in the JS bundle</h3>
<p>The app icon is a NATIVE asset (<code>AppIcon.appiconset</code>). Trying to set it from JS does nothing. Keep the distinction between asset-catalog images and JS-bundled images.</p>

<h3>Anti-pattern 13 — ignoring the privacy manifest</h3>
<p>Skipping <code>PrivacyInfo.xcprivacy</code> now blocks or warns at upload. Declare data collection and required-reason API usage rather than discovering it at submission time.</p>

<h3>Anti-pattern 14 — divergent iOS/Android native config</h3>
<p>Setting a deployment target, permission, or feature on iOS but forgetting the Android counterpart yields platform-specific bugs. Keep parity; on Expo, prefer plugins that write both platforms from one declaration.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. Why do you open the .xcworkspace and not the .xcodeproj in a React Native app?</div>
  <div class="qa-answer">
    <p>Because CocoaPods puts your dependencies in a SEPARATE Xcode project (<code>Pods/Pods.xcodeproj</code>). The <code>.xcworkspace</code> is a container that builds your app project AND the Pods project together and lets them share headers/products. Opening the bare <code>.xcodeproj</code> omits the Pods project, so React, Hermes, and every native library are missing — you get "module 'React' not found" or a wall of linker errors.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. What is inside a .xcodeproj bundle, and what is project.pbxproj?</div>
  <div class="qa-answer">
    <p>The <code>.xcodeproj</code> is a folder Finder shows as one document. Its core file is <code>project.pbxproj</code> — an ASCII plist that IS the project graph: targets, every file reference, build phases, and build settings. It also holds <code>xcshareddata</code> (shared schemes, commit these) and <code>xcuserdata</code> (per-user UI state, git-ignored). It is machine-managed and merge-hostile, so you configure it via Xcode's UI, not by hand.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Which files in ios/ do you commit, and which are generated?</div>
  <div class="qa-answer">
    <p><strong>Commit:</strong> <code>AppDelegate</code>, <code>main.m</code>, <code>Info.plist</code>, <code>*.entitlements</code>, asset catalog, <code>Podfile</code>, <code>Podfile.lock</code>, <code>Gemfile</code>, <code>Gemfile.lock</code>, <code>project.pbxproj</code>, <code>.xcode.env</code>, shared schemes. <strong>Generated / git-ignore:</strong> <code>Pods/</code>, <code>ios/build/</code>, DerivedData, <code>.xcode.env.local</code>, <code>xcuserdata</code>. Lockfiles are committed so every machine and CI resolve identical native versions.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. What does AppDelegate.mm do in a RN app, and why .mm?</div>
  <div class="qa-answer">
    <p>It is the native app's entry class: it bootstraps the RN root view, tells RN where the JS bundle lives (Metro URL in DEBUG, the baked-in <code>main.jsbundle</code> in release), and hosts lifecycle callbacks like <code>didFinishLaunchingWithOptions</code> where you init SDKs. The <code>.mm</code> extension is Objective-C++ so it can call C++ — Hermes, TurboModules, Fabric all need that. RN 0.77+ replaced the <code>.h</code>/<code>.mm</code> pair with a single <code>AppDelegate.swift</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Difference between Podfile, Podfile.lock, and Pods/?</div>
  <div class="qa-answer">
    <p><code>Podfile</code> DECLARES which native pods you want (Ruby DSL). <code>Podfile.lock</code> RECORDS the exact resolved versions + checksums (commit it — it is like package-lock.json). <code>Pods/</code> is the INSTALLED source of those pods plus <code>Pods.xcodeproj</code> — fully reproducible from the two files above, so it is git-ignored by default. To fix a bad state, delete <code>Pods/</code> and re-run <code>pod install</code>; never delete the lock.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. What is Info.plist responsible for? Name some keys.</div>
  <div class="qa-answer">
    <p>App configuration iOS reads at install/launch: <code>CFBundleIdentifier</code>, <code>CFBundleShortVersionString</code> / <code>CFBundleVersion</code>, display name, orientations, App Transport Security, URL schemes (<code>CFBundleURLTypes</code>), and every permission usage string (<code>NSCameraUsageDescription</code>, <code>NSLocationWhenInUseUsageDescription</code>, etc.). A missing required usage string crashes the app the moment that API is called and gets you rejected.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Info.plist vs .entitlements — what is the distinction?</div>
  <div class="qa-answer">
    <p><code>Info.plist</code> is general app config + permission prompt strings. <code>.entitlements</code> declares CAPABILITIES that the OS and your provisioning profile must grant and that get signed into the binary: push (<code>aps-environment</code>), Keychain access groups, Associated Domains / Universal Links, App Groups, Sign in with Apple. Enabling an entitlement without matching the App ID/profile fails code signing.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. What is noop-file.swift and why would a project have one?</div>
  <div class="qa-answer">
    <p>An empty Swift file added to a target whose only purpose is to force Xcode to run the Swift compile phase and embed the Swift runtime. When a target links Swift-based pods but has no Swift source of its own, the Swift stdlib may not be embedded and the app crashes at launch with a missing <code>libswiftCore.dylib</code>. The noop file flips the "target uses Swift" flag. CocoaPods/Expo inject it for exactly this reason.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. What is a bridging header and when do you need one?</div>
  <div class="qa-answer">
    <p><code>MyApp-Bridging-Header.h</code> exposes Objective-C headers to Swift code within the same target — Swift can use whatever this header imports. You need it only when your app target mixes Swift AND ObjC. Xcode wires it via the <code>SWIFT_OBJC_BRIDGING_HEADER</code> build setting. Pure-Swift or pure-ObjC targets do not need one.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. What is a "group" vs a "folder reference" in Xcode, and why does it bite RN devs?</div>
  <div class="qa-answer">
    <p>A yellow GROUP is a logical navigator grouping that need not match a disk folder; a blue FOLDER REFERENCE mirrors a real directory. RN's app folder is a group, so simply dropping a source file on disk does NOT add it to the target's Compile Sources phase — it silently never compiles. You must add it to the target. Missing/duplicate group entries are a common cause of "my file isn't being built."</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. What do .xcode.env and .xcode.env.local do?</div>
  <div class="qa-answer">
    <p>They export <code>NODE_BINARY</code> so RN's Xcode build phases (JS bundling, codegen) can find Node even under Xcode's minimal PATH. <code>.xcode.env</code> is committed and portable (uses <code>command -v node</code>); <code>.xcode.env.local</code> is a per-machine absolute-path override, git-ignored. A wrong/missing value is a classic "PhaseScriptExecution failed: node: command not found," especially on CI or after switching nvm/asdf/Homebrew Node.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Where is DerivedData, and when do you clear it?</div>
  <div class="qa-answer">
    <p><code>~/Library/Developer/Xcode/DerivedData/</code> — Xcode's global build cache (compiled objects, module cache, indexes) shared across all projects, outside your repo. Clear it (plus <code>ios/build</code>) when you hit "ghost" errors that survive code fixes — stale headers, phantom compile failures. It always regenerates, so deleting it only costs a rebuild.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. What is PrivacyInfo.xcprivacy?</div>
  <div class="qa-answer">
    <p>Apple's privacy manifest (required since 2024): a plist declaring the data types your app collects, tracking domains, and your reasons for calling "required-reason" APIs (UserDefaults, file timestamps, systemUptime, etc.). RN libraries ship their own <code>.xcprivacy</code> that merges in, but your app's own usage still needs declaring or you get App Store Connect warnings/rejections at upload.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. In an Expo project, who owns the ios/ folder?</div>
  <div class="qa-answer">
    <p>Tooling does. <code>expo prebuild</code> GENERATES the whole folder from <code>app.json</code>/<code>app.config.js</code> + config plugins (Continuous Native Generation). You can git-ignore <code>ios/</code> entirely and regenerate. Consequently hand-edits are wiped by <code>expo prebuild --clean</code>; you configure natively via <code>infoPlist</code>/<code>entitlements</code> in app.json, <code>expo-build-properties</code>, or custom config plugins instead of editing files directly.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. A native patch keeps disappearing in your Expo app after teammates rebuild. What is happening and how do you fix it?</div>
  <div class="qa-answer">
    <p>The patch was hand-applied under <code>ios/</code>, and <code>expo prebuild --clean</code> regenerated the folder and erased it. Fix: move the change into a durable source — <code>app.json</code> (<code>infoPlist</code>, <code>entitlements</code>), <code>expo-build-properties</code> (deployment target, pod settings), a custom config plugin, or a committed patch (e.g. a <code>post_install</code> hook / patch file). That is exactly how sw-mobile's iOS 26 launch fixes (Podfile + AppDelegate.h + AppDelegate.mm + noop-file.swift) are kept — as plugins/patches, not raw edits.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You open the <code>.xcworkspace</code> and can explain WHY (Pods is a separate project).</li>
    <li>You name the commit-vs-generated split confidently, including both lockfiles.</li>
    <li>You know AppDelegate hosts the RN root + JS bundle URL, and why it is <code>.mm</code>.</li>
    <li>You distinguish Info.plist (config + permission strings) from entitlements (signed capabilities).</li>
    <li>You can explain noop-file.swift and bridging headers as real launch-time concerns.</li>
    <li>You understand groups vs folder references and why a file may not compile.</li>
    <li>You know DerivedData/build are throwaway caches and the first thing to nuke.</li>
    <li>You know that in Expo the whole folder is CNG output and edits go in app.json / plugins.</li>
  </ul>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'revision', title: '⚡ Revision — Points to Remember', collapsible: true, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline"><code>ios/</code> is a real Xcode project split into <strong>files you own</strong> (AppDelegate, Info.plist, entitlements, Podfile, lockfiles) and <strong>generated machinery</strong> (Pods, build, DerivedData) — and you always open the <strong>.xcworkspace</strong>, never the <strong>.xcodeproj</strong>.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>.xcworkspace vs .xcodeproj vs Pods/:</strong> the <code>.xcodeproj</code> is your app project (its graph lives in <code>project.pbxproj</code>); <code>Pods/</code> is a SECOND generated project of dependencies; the <code>.xcworkspace</code> is the container that builds both together and shares headers. Open the workspace or you get "module 'React' not found."</li>
    <li><strong>Commit vs generated:</strong> commit <code>AppDelegate</code>, <code>main.m</code>, <code>Info.plist</code>, <code>*.entitlements</code>, asset catalog, <code>Podfile</code>, <code>Podfile.lock</code>, <code>Gemfile</code>, <code>Gemfile.lock</code>, <code>project.pbxproj</code>, <code>.xcode.env</code>. Git-ignore <code>Pods/</code>, <code>ios/build/</code>, DerivedData, <code>.xcode.env.local</code>, <code>xcuserdata</code>.</li>
    <li><strong>AppDelegate.h/.mm</strong> (ObjC++ so it can call C++/Hermes/TurboModules) boots the RN root view + sets the JS bundle URL (Metro in DEBUG, <code>main.jsbundle</code> in release) + hosts <code>didFinishLaunchingWithOptions</code>. RN 0.77+ uses a single <code>AppDelegate.swift</code>. <code>main.m</code> is the <code>UIApplicationMain</code> entry point you rarely touch.</li>
    <li><strong>Info.plist</strong> = bundle id/version, orientations, ATS, URL schemes, and permission usage strings (<code>NS...UsageDescription</code>) — missing one crashes on first API call. <strong>.entitlements</strong> = signed capabilities (push <code>aps-environment</code>, Keychain, Associated Domains, App Groups) that must match the provisioning profile.</li>
    <li><strong>Assets:</strong> <code>Images.xcassets</code> holds <code>AppIcon.appiconset</code>, imagesets, colorsets (@1x/@2x/@3x, light/dark) → compiled to <code>Assets.car</code>. App icon is NATIVE, not JS-bundled. <code>LaunchScreen.storyboard</code> is the pre-JS splash.</li>
    <li><strong>PrivacyInfo.xcprivacy</strong> = Apple's required (2024+) privacy manifest: data collected + tracking domains + required-reason API justifications. Missing/incomplete → upload rejection.</li>
    <li><strong>noop-file.swift</strong> = empty Swift file forcing Swift-stdlib embedding when Swift pods exist but the target has no Swift; without it → launch crash "libswiftCore.dylib not loaded." <strong>-Bridging-Header.h</strong> exposes ObjC to Swift, needed only when mixing both languages.</li>
    <li><strong>Podfile</strong> declares pods (<code>use_react_native!</code> + autolinking), <strong>Podfile.lock</strong> pins exact versions (commit), <strong>Pods/</strong> is regenerated source (ignore). Run <code>bundle exec pod install</code> so the <code>Gemfile</code>-pinned CocoaPods runs. <strong>Gemfile/Gemfile.lock</strong> pin the Ruby tooling itself.</li>
    <li><strong>.xcode.env / .xcode.env.local</strong> export <code>NODE_BINARY</code> for the JS-bundling/codegen build phases; missing → "node: command not found" / "PhaseScriptExecution failed," common on CI.</li>
    <li><strong>build/ + DerivedData</strong> (<code>~/Library/Developer/Xcode/DerivedData</code>) are throwaway caches; delete them first when hitting ghost errors.</li>
    <li><strong>Group vs folder reference:</strong> RN's app folder is a group, so a file on disk is NOT auto-added to Compile Sources — it must be added to the target or it silently never compiles.</li>
    <li><strong>Deep dives:</strong> <code>iosn-xcode-project</code> (pbxproj/targets/schemes), <code>iosn-cocoapods</code> (Podfile/resolution/lock), <code>iosn-plist-entry</code> (every Info.plist key).</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Opening <code>MyApp.xcodeproj</code> instead of <code>MyApp.xcworkspace</code></strong> — the project alone has no Pods project, so React/Hermes are missing and you get "module 'React' not found" or endless linker errors. (Second trap: in an Expo prebuild app, ANY hand-edit under <code>ios/</code> is wiped by <code>expo prebuild --clean</code> — encode changes in app.json / expo-build-properties / a config plugin instead.)</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"The <code>ios/</code> folder is a normal Xcode project. The <code>.xcodeproj</code> is my app; <code>Pods/</code> is a separate generated project of dependencies; the <code>.xcworkspace</code> is the container that builds both — so I always open the workspace, never the project."</div>
  <div class="revision-say">"I commit AppDelegate, Info.plist, entitlements, the Podfile and both lockfiles; I git-ignore Pods, build, DerivedData, and .xcode.env.local because they regenerate. Info.plist holds permission strings; entitlements hold signed capabilities that must match the provisioning profile."</div>
  <div class="revision-say">"In my Expo apps the whole <code>ios/</code> folder is generated by <code>expo prebuild</code> from app.json plus config plugins, so I never hand-edit it — I use infoPlist keys, expo-build-properties, and custom plugins, which is how I kept sw-mobile's iOS 26 launch patches from being wiped."</div>
</div>
`},

{ id: 'checklist', title: '✅ Interview Checklist', collapsible: true, html: `
<div class="callout success">
  <div class="callout-title">Can you answer these before moving on?</div>
  <ul>
    <li>Can you explain why you open <code>.xcworkspace</code> instead of <code>.xcodeproj</code>, and what breaks if you don't?</li>
    <li>Can you list which files in <code>ios/</code> you commit versus which are generated and git-ignored?</li>
    <li>Can you say what <code>AppDelegate.mm</code> does, why it is Objective-C++, and where it gets the JS bundle URL?</li>
    <li>Can you distinguish <code>Info.plist</code> from <code>.entitlements</code>, and give an example key from each?</li>
    <li>Can you explain what <code>noop-file.swift</code> and a bridging header are for, and the crash each prevents?</li>
    <li>Can you describe the roles of <code>Podfile</code>, <code>Podfile.lock</code>, and <code>Pods/</code>, and why you run <code>bundle exec pod install</code>?</li>
    <li>Can you explain how the <code>ios/</code> folder is generated in an Expo prebuild app and where native config should live instead?</li>
  </ul>
</div>
`}

]
});
