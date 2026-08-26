window.PREP_SITE.registerTopic({
  id: 'iosn-cocoapods',
  module: 'iOS Native (Deep)',
  title: 'CocoaPods & Dependencies',
  estimatedReadTime: '24 min',
  tags: ['cocoapods', 'podfile', 'podfile-lock', 'pods', 'use-frameworks', 'ruby', 'gem', 'bundler', 'gemfile', 'autolinking', 'use-native-modules', 'spm', 'swift-package-manager', 'hermes', 'hermes-engine', 'podspec', 'post-install', 'pod-install', 'xcconfig', 'new-architecture', 'expo', 'ios', 'react-native'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p><strong>CocoaPods</strong> is the Ruby-based dependency manager that stitches your React Native app's native iOS code together. It reads a <code>Podfile</code>, resolves every native library (React itself, Hermes, and each autolinked native module) into the <code>Pods/</code> folder, and wires them into an <code>.xcworkspace</code> that Xcode opens instead of the bare <code>.xcodeproj</code>.</p>
<p>On RN, you almost never write pod declarations by hand. <strong>Autolinking</strong> (<code>use_native_modules!</code>) scans <code>node_modules</code> and injects a pod for every package that ships a <code>.podspec</code>. Your job is understanding the <code>Podfile</code>, the <code>post_install</code> hook that patches build settings, and the <code>Podfile.lock</code> that pins exact versions.</p>
<p>The two commands you live by: <code>bundle exec pod install</code> (resolve + integrate, run after any native dependency change) and reading errors out of the <strong>"[CP] Check Pods Manifest.lock"</strong> build phase when the lock drifts. A JS/Metro reload never picks up a native pod change — you must reinstall pods and rebuild.</p>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>CocoaPods is a Ruby gem that turns your <code>Podfile</code> + autolinked native modules into a <code>Pods/</code> project and an <code>.xcworkspace</code>; <code>Podfile.lock</code> pins the exact versions you commit, and the <code>post_install</code> hook is where RN patches deployment target, excluded archs, Hermes, and C++ flags.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What CocoaPods actually is</h3>
<p>CocoaPods is a <strong>dependency manager for Cocoa (iOS/macOS) projects</strong>, written in Ruby and distributed as a <strong>Ruby gem</strong>. It plays the same role for native iOS libraries that npm/yarn plays for JS packages: you declare what you want, it resolves a compatible version graph, downloads the source, and integrates it into your Xcode build. A single library it manages is called a <strong>pod</strong>.</p>
<p>Each pod is described by a <code>.podspec</code> (a Ruby file) that says what source files it ships, which frameworks it links, and what other pods it depends on. CocoaPods reads all the podspecs it needs, resolves versions, generates a separate <code>Pods.xcodeproj</code>, and creates a <strong><code>.xcworkspace</code></strong> that contains both your app project and the Pods project. That is why after adding pods you must open <code>MyApp.xcworkspace</code>, never <code>MyApp.xcodeproj</code> — the bare project doesn't know about the pods.</p>

<h3>Why React Native uses it</h3>
<ul>
  <li><strong>React Native itself is native code.</strong> The <code>React-Core</code>, <code>React-RCTNetwork</code>, <code>ReactCommon</code>, <code>Yoga</code>, and dozens of other subspecs are shipped as pods via <code>use_react_native!</code>. Your app compiles them from source.</li>
  <li><strong>Native modules ship podspecs.</strong> Every community library with iOS code (<code>react-native-reanimated</code>, <code>react-native-mmkv</code>, <code>react-native-firebase</code>) ships a <code>.podspec</code>. Autolinking turns each into a pod without you editing Xcode.</li>
  <li><strong>Hermes</strong> (the JS engine) is delivered as the <code>hermes-engine</code> pod, prebuilt or built from source.</li>
  <li><strong>One resolved, reproducible graph.</strong> The <code>Podfile.lock</code> gives every teammate and every CI run the exact same native dependency versions.</li>
</ul>

<h3>The Ruby / Bundler layer (why <code>bundle exec</code>)</h3>
<p>CocoaPods is a gem, and the version of the <code>cocoapods</code> gem matters — a Podfile written for CocoaPods 1.14 can break under 1.11. To pin the tool itself, RN projects ship a <strong><code>Gemfile</code></strong> at the repo root:</p>
<pre><code class="language-ruby"># Gemfile
source 'https://rubygems.org'
ruby '&gt;= 2.6.10'

gem 'cocoapods', '&gt;= 1.13', '!= 1.15.0', '!= 1.15.1'
gem 'activesupport', '&gt;= 6.1.7.5', '!= 7.1.0'</code></pre>
<p><code>bundle install</code> reads the <code>Gemfile</code>, resolves gem versions, and writes <code>Gemfile.lock</code>. Then <code>bundle exec pod install</code> runs the <em>pinned</em> CocoaPods rather than whatever global <code>pod</code> happens to be on your PATH. This is why the RN docs always say <code>bundle exec pod install</code>, not bare <code>pod install</code> — it guarantees everyone runs the same CocoaPods version.</p>

<div class="callout note">
  <div class="callout-title">Gemfile vs Podfile — don't confuse them</div>
  <p><code>Gemfile</code> pins the <em>tools</em> (the CocoaPods gem itself). <code>Podfile</code> declares the <em>native libraries</em> your app links. <code>bundle install</code> sets up the tools; <code>pod install</code> uses them to set up the libraries.</p>
</div>

<h3>CocoaPods CDN vs <code>pod repo update</code></h3>
<p>Historically CocoaPods cloned the entire <strong>Specs repo</strong> (~1GB of every podspec ever published) to your machine. Modern CocoaPods uses the <strong>CDN</strong> (<code>trunk</code> at <code>cdn.cocoapods.org</code>) declared as <code>source 'https://cdn.cocoapods.org/'</code> at the top of the Podfile, fetching only the podspecs it needs on demand — much faster first install. When a pod version fails to resolve because your local spec cache is stale, <code>pod repo update</code> (or <code>pod install --repo-update</code>) refreshes the spec index. On the CDN this is mostly automatic, but <code>--repo-update</code> is still the fix for "could not find compatible versions" after a library publishes a new release.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "who reads what" picture</h3>
<div class="diagram">
<pre>
 Gemfile ──bundle install──► Gemfile.lock      (pins the CocoaPods GEM)
    │
    │ bundle exec pod install
    ▼
 Podfile ───────────────────────────────► resolver
    │  platform, use_react_native!,        │
    │  use_native_modules! (autolink),     │ reads each .podspec
    │  post_install hook                    │
    ▼                                       ▼
 node_modules/*/  *.podspec  ──────► Pods/  (downloaded sources)
                                       ├─ Pods.xcodeproj
                                       ├─ Target Support Files/
                                       │    Pods-MyApp/*.xcconfig
                                       └─ Manifest.lock  (copy of Podfile.lock)
    │
    ▼
 MyApp.xcworkspace  ◄─── open THIS in Xcode (app project + Pods project)
    +
 Podfile.lock  ◄─── COMMIT THIS (exact versions + checksums)
</pre>
</div>

<h3>The "reload vs reinstall" picture</h3>
<div class="diagram">
<pre>
 Changed JS only ......................► Metro reload  (Cmd+R)   ✔ enough
 Changed a native dep / added a pod ...► bundle exec pod install ► rebuild in Xcode
 Bumped RN version / weird link error .► pod deintegrate ► pod install ► clean build
</pre>
</div>
<p>The single most common iOS confusion: you <code>npm install</code> a native library, reload the app, and it crashes with "module not found." Metro only rebundles JS. The native side of that library lives in a pod that isn't in your binary until you <code>pod install</code> and rebuild the app in Xcode.</p>

<h3>The "three lock files" picture</h3>
<div class="diagram">
<pre>
 Gemfile.lock   → which cocoapods gem version (the tool)
 Podfile.lock   → which native library versions (committed, source of truth)
 Pods/Manifest.lock → a COPY of Podfile.lock written at last successful install
</pre>
</div>
<p>The "[CP] Check Pods Manifest.lock" build phase compares <code>Podfile.lock</code> against <code>Pods/Manifest.lock</code>. If they differ (someone pulled a branch that changed pods but you didn't reinstall), the build fails early with "The sandbox is not in sync with the Podfile.lock. Run 'pod install'." That mismatch is a feature, not a bug — it stops you shipping a binary built against the wrong native versions.</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"The <code>Pods/</code> folder is my dependency source of truth, so I should commit it." No. <code>Pods/</code> is <strong>generated</strong> and typically git-ignored in RN apps; <code>Podfile</code> + <code>Podfile.lock</code> are the source of truth, and <code>pod install</code> regenerates <code>Pods/</code> deterministically from them.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Podfile anatomy — line by line</h3>
<pre><code class="language-ruby"># ios/Podfile
# 1. Resolve RN + Hermes helper scripts from node_modules
require Pod::Executable.execute_command('node', ['-p',
  'require.resolve(
    "react-native/scripts/react_native_pods.rb",
    {paths: [process.argv[1]]},
  )', __dir__]).strip

# 2. Minimum iOS version RN supports (a helper, e.g. "15.1")
platform :ios, min_ios_version_supported
prepare_react_native_project!

# 3. Linkage mode (see the use_frameworks! section)
linkage = ENV['USE_FRAMEWORKS']
if linkage != nil
  use_frameworks! :linkage =&gt; linkage.to_sym
end

target 'MyApp' do
  config = use_native_modules!          # AUTOLINKING — scans node_modules

  use_react_native!(
    :path =&gt; config[:reactNativePath],
    :hermes_enabled =&gt; true,             # ship Hermes (default on modern RN)
    :fabric_enabled =&gt; false,           # new-arch renderer; toggled by RCT_NEW_ARCH_ENABLED
    :app_path =&gt; "#{Pod::Config.instance.installation_root}/.."
  )

  # A hand-declared pod (rare in RN, common in native SDK integration):
  pod 'SomeSDK', '~&gt; 4.2'                          # version from CDN
  pod 'MyLocalPod', :path =&gt; '../modules/MyLocalPod'  # local path
  pod 'ForkedLib', :git =&gt; 'https://github.com/me/lib.git', :branch =&gt; 'fix'
  pod 'DebugOnly', :configurations =&gt; ['Debug']   # only in Debug builds

  post_install do |installer|
    # THE patch block — see below
    react_native_post_install(installer, config[:reactNativePath])
  end
end</code></pre>

<p>What each key piece does:</p>
<ul>
  <li><strong><code>platform :ios, min_ios_version_supported</code></strong> — sets the deployment target floor. RN exposes a helper so it stays in sync with what React itself requires; you can also hardcode e.g. <code>platform :ios, '15.1'</code>.</li>
  <li><strong><code>use_native_modules!</code></strong> — the autolinking call. It shells out to <code>npx react-native config</code>, gets the list of packages with iOS podspecs, and returns a config hash. This is what makes "install the npm package, run pod install, done" work without touching Xcode.</li>
  <li><strong><code>use_react_native!</code></strong> — pulls in all React/Hermes/Fabric pods. <code>:hermes_enabled</code> toggles the <code>hermes-engine</code> pod; <code>:fabric_enabled</code> and the <code>RCT_NEW_ARCH_ENABLED</code> env var toggle the new architecture renderer and codegen.</li>
  <li><strong><code>pod 'Name', ...</code></strong> — an explicit dependency. Sources: a version string (<code>'~&gt; 4.2'</code> = 4.2 up to but not 5.0), <code>:path</code> for a local folder, <code>:git</code>/<code>:branch</code>/<code>:tag</code>/<code>:commit</code> for a fork, <code>:configurations</code> to scope it to Debug/Release.</li>
  <li><strong><code>use_expo_modules!</code></strong> — in Expo projects, autolinks all Expo modules (their own resolver on top of CocoaPods).</li>
</ul>

<h3>The <code>post_install</code> hook — where RN patches build settings</h3>
<p>This block runs <em>after</em> pods are generated but <em>before</em> the project is written to disk, so it can rewrite build settings on every pod target. It is the single most-edited part of the Podfile:</p>
<pre><code class="language-ruby">post_install do |installer|
  # RN's own catch-all: fixes Hermes, C++ flags, codegen, search paths
  react_native_post_install(
    installer,
    config[:reactNativePath],
    :mac_catalyst_enabled =&gt; false,
  )

  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |cfg|
      # Force a consistent deployment target across every pod
      cfg.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'

      # Drop arm64 for the simulator slice on Intel Macs (classic fix)
      cfg.build_settings['EXCLUDED_ARCHS[sdk=iphonesimulator*]'] = 'arm64'

      # Bump C++ language level some pods need
      cfg.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++20'
    end
  end
end</code></pre>
<p>Common settings patched here: <code>IPHONEOS_DEPLOYMENT_TARGET</code> (a pod defaulting to iOS 12 breaks a build targeting 15), <code>EXCLUDED_ARCHS</code> (the arm64 simulator dance), Hermes dSYM handling, <code>GCC_PREPROCESSOR_DEFINITIONS</code>, <code>OTHER_CPLUSPLUSFLAGS</code>, and bitcode/signing tweaks. Because <code>pod install</code> regenerates everything, you can't hand-edit a pod's build settings in Xcode and have it stick — you patch it here so it survives every reinstall.</p>

<h3><code>pod install</code> vs <code>pod update</code> vs <code>pod deintegrate</code></h3>
<table>
  <thead><tr><th>Command</th><th>What it does</th><th>When</th></tr></thead>
  <tbody>
    <tr><td><code>pod install</code></td><td>Installs the exact versions in <code>Podfile.lock</code> if present; resolves only pods not yet locked. Regenerates <code>Pods/</code> + workspace.</td><td>After adding a native lib, cloning the repo, or any Podfile change. The everyday command.</td></tr>
    <tr><td><code>pod update [Name]</code></td><td>Ignores the lock for the named pod (or all pods) and resolves the newest allowed version, then rewrites <code>Podfile.lock</code>.</td><td>Deliberately bumping a dependency. Never run bare <code>pod update</code> casually — it can move every native version at once.</td></tr>
    <tr><td><code>pod deintegrate</code></td><td>Rips CocoaPods back out of the <code>.xcodeproj</code> (removes build phases, xcconfig links).</td><td>When the workspace is corrupted or you get inexplicable link errors. Follow with <code>pod install</code>.</td></tr>
  </tbody>
</table>
<p>The recovery ritual for a broken iOS build: <code>pod deintegrate &amp;&amp; pod install</code>, then in Xcode <code>Product &gt; Clean Build Folder</code> (Cmd+Shift+K), and if still broken clear <code>~/Library/Developer/Xcode/DerivedData</code> and <code>~/Library/Caches/CocoaPods</code>.</p>

<div class="callout warn">
  <div class="callout-title">Native change ⇒ reinstall, not reload</div>
  <p>Metro/Fast Refresh only rebundles JavaScript. Anything that changes native code — a new native module, a bumped RN version, a Podfile edit, toggling the new arch — requires <code>pod install</code> and a full rebuild in Xcode. A JS reload can never surface a native change.</p>
</div>

<h3><code>Podfile.lock</code> — the committed source of truth</h3>
<pre><code class="language-text">PODS:
  - hermes-engine (0.79.2):
    - hermes-engine/Pre-built (= 0.79.2)
  - RNReanimated (3.16.1):
    - RCT-Folly (= 2024.01.01.00)
    - React-Core

DEPENDENCIES:
  - hermes-engine (from "../node_modules/react-native/sdks/hermes-engine/hermes-engine.podspec")

SPEC CHECKSUMS:
  hermes-engine: a1b2c3...
  RNReanimated: d4e5f6...

PODFILE CHECKSUM: 9f8e7d...
COCOAPODS: 1.14.3</code></pre>
<p><code>Podfile.lock</code> pins <strong>exact resolved versions</strong>, records a <strong>SHA checksum per pod</strong> (so a tampered/changed source is detected), stores a checksum of the Podfile itself, and even the CocoaPods version used. <strong>Always commit it.</strong> It is what makes a teammate's <code>pod install</code> reproduce your exact native graph, and it is what the "[CP] Check Pods Manifest.lock" build phase validates against <code>Pods/Manifest.lock</code>.</p>

<h3>Inside the <code>Pods/</code> folder (generated, git-ignored)</h3>
<ul>
  <li><strong><code>Pods.xcodeproj</code></strong> — the Xcode project that builds every pod as its own target.</li>
  <li><strong><code>Target Support Files/Pods-MyApp/</code></strong> — the glue: <code>Pods-MyApp.debug.xcconfig</code> / <code>.release.xcconfig</code> (header search paths, linker flags, framework paths that your app target inherits), plus the "Copy Frameworks" and "Copy Resources" scripts.</li>
  <li><strong><code>Manifest.lock</code></strong> — a copy of <code>Podfile.lock</code> written at the last successful install; the drift check compares against it.</li>
  <li><strong><code>Headers/</code></strong> — <code>Public/</code> and <code>Private/</code> header symlinks so pods can <code>#import</code> each other.</li>
</ul>
<p>All of it is reproducible from <code>Podfile</code> + <code>Podfile.lock</code>, which is why the standard RN <code>.gitignore</code> excludes <code>ios/Pods/</code>.</p>

<h3><code>use_frameworks!</code> — static vs dynamic (the classic RN pain)</h3>
<p>By default CocoaPods links pods as <strong>static libraries</strong> (<code>.a</code>) with headers. <code>use_frameworks!</code> switches to building each pod as a <strong>framework</strong> instead — required by any pod containing Swift or by SDKs distributed only as frameworks. You choose the linkage:</p>
<pre><code class="language-ruby">use_frameworks! :linkage =&gt; :static   # static frameworks (most common RN choice)
# or
use_frameworks! :linkage =&gt; :dynamic  # dynamic frameworks (.framework at runtime)</code></pre>
<ul>
  <li><strong>Static linkage</strong> — code baked into the app binary; faster launch, no extra dylibs to sign/embed. But some pods (notably ones that register categories or expect a dynamic image) misbehave, and mixing Swift static frameworks can trip duplicate-symbol issues.</li>
  <li><strong>Dynamic linkage</strong> — each pod ships a <code>.framework</code> embedded and signed in the app; slower launch (dyld loads each), and you must manage the "Embed Frameworks" phase and their <strong>dSYM</strong> files for symbolication.</li>
</ul>
<p>Firebase is the textbook headache: with <code>use_frameworks! :linkage =&gt; :static</code> you often must also set <code>$RNFirebaseAsStaticFramework = true</code> at the top of the Podfile so the Firebase pods are built as static frameworks to match. Historically <strong>Flipper</strong> (the old debug tool) was incompatible with <code>use_frameworks!</code> at all — one big reason teams avoided frameworks mode. Turning <code>use_frameworks!</code> on or off is a whole-project decision; flipping it mid-project usually forces a <code>pod deintegrate</code> + clean rebuild.</p>

<div class="callout danger">
  <div class="callout-title">use_frameworks! is contagious</div>
  <p>You can't enable it for one pod. It changes the linkage of the entire target, so every pod and Hermes must be compatible with the mode you pick. This is why "add Firebase" can cascade into deployment-target, static-framework, and Hermes settings all needing adjustment at once.</p>
</div>

<h3>Hermes as a pod</h3>
<p>Hermes ships as the <strong><code>hermes-engine</code></strong> pod, resolved from <code>react-native/sdks/hermes-engine/hermes-engine.podspec</code>. On release it uses a <strong>prebuilt</strong> tarball (the <code>hermes-engine/Pre-built</code> subspec you see in the lock); you can force building from source with <code>HERMES_ENGINE_TARBALL_PATH</code> or by pointing at the Hermes source. When Hermes is on, it ships its own <strong>dSYM</strong> (<code>hermes.framework.dSYM</code> / a <code>.hermes</code> debug bundle) which you need to symbolicate native crash reports — miss it and Hermes frames show as raw addresses in Crashlytics/Sentry. <code>:hermes_enabled =&gt; true</code> in <code>use_react_native!</code> is what pulls the pod in; setting it false falls back to JSC (the <code>React-jsc</code> pod).</p>

<h3>Anatomy of a <code>.podspec</code></h3>
<pre><code class="language-ruby"># RNMyModule.podspec — what a native module ships for autolinking
require 'json'
package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = 'RNMyModule'
  s.version      = package['version']
  s.summary      = package['description']
  s.homepage     = package['homepage']
  s.license      = package['license']
  s.platforms    = { :ios =&gt; '15.1' }
  s.source       = { :git =&gt; package['repository']['url'] }

  s.source_files = 'ios/**/*.{h,m,mm,swift}'   # what compiles
  s.dependency 'React-Core'                     # needs RN core
  s.dependency 'SomeThirdPartySDK', '~&gt; 2.0'

  # New-arch / codegen wiring (RN provides a helper)
  install_modules_dependencies(s)
end</code></pre>
<p>A native module exposes a podspec at its package root. Because autolinking scans <code>node_modules</code> for exactly this file, shipping a valid <code>.podspec</code> is what makes a library "just work" after <code>npm install</code> + <code>pod install</code>. <code>s.source_files</code> lists the compiled sources, <code>s.dependency</code> declares other pods it needs, and <code>s.platforms</code> sets its own deployment floor (a too-high one here is a frequent cause of "increase your deployment target" build errors).</p>

<h3>RN autolinking on iOS</h3>
<p><code>use_native_modules!</code> is autolinking's iOS half. At install time it runs <code>npx react-native config</code>, which enumerates every dependency in <code>package.json</code> that has an iOS <code>.podspec</code>, and injects a <code>pod</code> declaration for each into the target automatically — no manual Xcode linking, no manual <code>pod 'react-native-x'</code> lines. Its Android counterpart is the Gradle <code>settings.gradle</code>/<code>native_modules.gradle</code> scan. You only hand-write a <code>pod</code> line for a raw native SDK that isn't an RN package, or to override/patch a library.</p>

<h3>Swift Package Manager (SPM) — the slow encroachment</h3>
<p><strong>SPM</strong> is Apple's built-in dependency manager (declared in Xcode via "Add Package Dependencies", stored in <code>Package.swift</code> / the project's <code>Package.resolved</code>). RN has <em>gradual, partial</em> SPM support and many native SDKs now ship both a podspec and an SPM package. You'd reach for SPM when a third-party SDK is SPM-only, or to avoid the Ruby/CocoaPods toolchain. But CocoaPods still dominates RN because: autolinking, Hermes, codegen, and the vast majority of community modules are all wired through podspecs; the whole <code>post_install</code> patching model has no clean SPM equivalent yet; and mixing SPM + CocoaPods in one target is fiddly. Practically, in an RN app you keep CocoaPods and add the occasional SPM package in Xcode alongside it.</p>

<h3>Enabling the New Architecture at install</h3>
<pre><code class="language-bash"># From ios/, force codegen + Fabric/TurboModules on this install:
RCT_NEW_ARCH_ENABLED=1 bundle exec pod install

# Back to old arch (Paper):
RCT_NEW_ARCH_ENABLED=0 bundle exec pod install</code></pre>
<p>The <code>RCT_NEW_ARCH_ENABLED</code> env var flips codegen and Fabric on for that <code>pod install</code>, generating the TurboModule/Fabric C++ glue. Cross-reference the <code>rn-architecture</code> topic for what old (Bridge/Paper) vs new (Fabric, TurboModules, JSI, Codegen, bridgeless) actually change at runtime — here the point is just that the switch is thrown at <code>pod install</code> time on iOS.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — first-time setup after cloning an RN repo</h3>
<pre><code class="language-bash">git clone git@github.com:me/sw-mobile.git
cd sw-mobile
npm install                      # JS deps (also lays down node_modules podspecs)
bundle install                   # pins the CocoaPods gem from Gemfile
cd ios
bundle exec pod install          # resolves + installs pods from Podfile.lock
open MyApp.xcworkspace            # NOT .xcodeproj</code></pre>

<h3>Example 2 — adding a native library</h3>
<pre><code class="language-bash">npm install react-native-mmkv
cd ios &amp;&amp; bundle exec pod install   # picks up the new podspec via autolinking
# then rebuild in Xcode / re-run the app — a JS reload is NOT enough</code></pre>

<h3>Example 3 — a hand-declared pod for a raw SDK</h3>
<pre><code class="language-ruby">target 'MyApp' do
  config = use_native_modules!
  use_react_native!(:path =&gt; config[:reactNativePath], :hermes_enabled =&gt; true)

  # Native SDK with no RN wrapper — declare it yourself:
  pod 'GoogleMaps', '8.4.0'
  pod 'GoogleWTF', :git =&gt; 'https://github.com/org/fork.git', :tag =&gt; 'v1.2.3'
end</code></pre>

<h3>Example 4 — Firebase static-framework combo</h3>
<pre><code class="language-ruby"># Top of Podfile, before the target:
$RNFirebaseAsStaticFramework = true

use_frameworks! :linkage =&gt; :static

target 'MyApp' do
  # ...use_react_native!...
  # @react-native-firebase/* pods now build as static frameworks
end</code></pre>

<h3>Example 5 — a post_install that patches deployment target + archs</h3>
<pre><code class="language-ruby">post_install do |installer|
  react_native_post_install(installer, config[:reactNativePath])
  installer.pods_project.targets.each do |t|
    t.build_configurations.each do |c|
      c.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'
      c.build_settings['EXCLUDED_ARCHS[sdk=iphonesimulator*]'] = 'arm64'
    end
  end
end</code></pre>

<h3>Example 6 — reading a Manifest-mismatch failure</h3>
<pre><code class="language-text">error: The sandbox is not in sync with the Podfile.lock. Run 'pod install'
       or update your CocoaPods installation.
# Cause: you pulled a branch that changed Podfile.lock but didn't reinstall.
# Fix:
cd ios &amp;&amp; bundle exec pod install</code></pre>

<h3>Example 7 — the nuclear clean</h3>
<pre><code class="language-bash">cd ios
bundle exec pod deintegrate
rm -rf Pods Podfile.lock
rm -rf ~/Library/Developer/Xcode/DerivedData/*
bundle exec pod install --repo-update
# then Xcode: Product &gt; Clean Build Folder (Cmd+Shift+K)</code></pre>

<h3>Example 8 — deliberately bumping ONE pod</h3>
<pre><code class="language-bash">cd ios
bundle exec pod update GoogleMaps    # only GoogleMaps re-resolves; rest stay locked
# (bare 'pod update' would move EVERY pod — avoid)</code></pre>

<h3>Example 9 — enabling the new architecture</h3>
<pre><code class="language-bash">cd ios
RCT_NEW_ARCH_ENABLED=1 bundle exec pod install
# codegen runs; Fabric + TurboModule glue is generated for this install</code></pre>

<h3>Example 10 — Expo prebuild does pod install for you</h3>
<pre><code class="language-bash"># Expo managed/prebuild flow — you rarely touch the Podfile directly:
npx expo prebuild --platform ios     # generates ios/ AND runs pod install
npx expo run:ios                     # build + launch
# expo-build-properties (in app.json) sets deploymentTarget / useFrameworks</code></pre>

<h3>Example 11 — expo-build-properties instead of hand-editing the Podfile</h3>
<pre><code class="language-json">{
  "expo": {
    "plugins": [
      ["expo-build-properties", {
        "ios": {
          "deploymentTarget": "15.1",
          "useFrameworks": "static"
        }
      }]
    ]
  }
}</code></pre>

<h3>Example 12 — a minimal native-module podspec</h3>
<pre><code class="language-ruby">Pod::Spec.new do |s|
  s.name         = 'RNTorch'
  s.version      = '1.0.0'
  s.summary      = 'Toggle the flashlight'
  s.platforms    = { :ios =&gt; '15.1' }
  s.source_files = 'ios/**/*.{h,m,mm}'
  s.dependency 'React-Core'
end</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Opening the wrong file</h3>
<p>Opening <code>MyApp.xcodeproj</code> after pods are installed gives "module not found" / missing header errors because the bare project doesn't reference the Pods. Always open <code>MyApp.xcworkspace</code>.</p>

<h3>2. Bare <code>pod install</code> vs <code>bundle exec pod install</code></h3>
<p>Your global <code>pod</code> may be a different version than <code>Gemfile.lock</code> pins. That mismatch can rewrite <code>Podfile.lock</code>'s <code>COCOAPODS:</code> line and produce spurious diffs or resolution differences. Use <code>bundle exec</code>.</p>

<h3>3. Manifest.lock drift</h3>
<p>"The sandbox is not in sync with the Podfile.lock" means <code>Podfile.lock</code> and <code>Pods/Manifest.lock</code> differ — you pulled changes without reinstalling. Run <code>pod install</code>. Never "fix" it by deleting the Check Pods Manifest.lock build phase.</p>

<h3>4. arm64 simulator on Apple Silicon vs Intel</h3>
<p>The classic <code>EXCLUDED_ARCHS[sdk=iphonesimulator*] = arm64</code> patch was needed on Intel Macs / certain SDKs. On Apple Silicon it can <em>break</em> the simulator build (the simulator IS arm64). Whether you need it is machine- and pod-dependent — don't cargo-cult it.</p>

<h3>5. Deployment target too low in a dependency</h3>
<p>A pod whose podspec sets <code>:ios =&gt; '12.0'</code> can fail against an app targeting 15. Patch <code>IPHONEOS_DEPLOYMENT_TARGET</code> for all pod targets in <code>post_install</code>.</p>

<h3>6. use_frameworks! flips linkage for everything</h3>
<p>Turning it on to satisfy one Swift SDK can break Hermes, Flipper (legacy), or static-only pods. It is a whole-target decision, not per-pod.</p>

<h3>7. Missing dSYMs → unsymbolicated crashes</h3>
<p>With dynamic frameworks or Hermes, the <code>.dSYM</code> files must be uploaded to your crash reporter. Miss the <code>hermes.framework.dSYM</code> and Hermes stack frames are just addresses.</p>

<h3>8. Stale CDN spec cache</h3>
<p>"Unable to find a specification for 'Foo (~&gt; 2.0)'" right after the library published 2.0 usually means the spec index is stale. Run <code>pod install --repo-update</code> or <code>pod repo update</code>.</p>

<h3>9. Committing the Pods/ folder</h3>
<p>Some teams commit <code>Pods/</code> for hermetic CI, but the RN default is to git-ignore it and rely on <code>Podfile.lock</code>. If you don't commit it, you MUST commit <code>Podfile.lock</code> or builds are non-reproducible.</p>

<h3>10. Ruby version / gem conflicts</h3>
<p>System Ruby, rbenv, and a stray Homebrew CocoaPods can collide. "Bad interpreter" or activesupport version errors trace back to which Ruby is on PATH. RN pins <code>activesupport</code> in the Gemfile for exactly this reason.</p>

<h3>11. New-arch env var not sticking</h3>
<p><code>RCT_NEW_ARCH_ENABLED</code> only affects the <code>pod install</code> it's set for. Run pod install again without it and you silently drop back to old arch — set it in your shell profile or a script if you want it persistent.</p>

<h3>12. Codegen artifacts staleness</h3>
<p>Changing a TurboModule spec but not reinstalling leaves stale generated C++ in <code>build/generated/ios</code>. Re-run <code>pod install</code>; for deep breakage, delete DerivedData too.</p>

<h3>13. Hermes prebuilt vs from source mismatch</h3>
<p>Mixing a prebuilt <code>hermes-engine</code> with source builds (or a custom Hermes) causes link errors. Keep the Hermes source consistent; clear the pod cache when switching.</p>

<h3>14. Local <code>:path</code> pod not picked up</h3>
<p>A <code>pod 'X', :path =&gt; '../x'</code> only re-copies on <code>pod install</code>. Editing the local pod's source and rebuilding may need another <code>pod install</code> for header changes to register.</p>

<h3>15. Expo prebuild wipes hand edits</h3>
<p>Manually editing <code>ios/Podfile</code> and then running <code>expo prebuild --clean</code> discards the change. Configure via <code>expo-build-properties</code> or a config plugin instead.</p>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — the ios/ folder is generated</div>
  <p>In Expo prebuild / Continuous Native Generation (CNG) projects like <code>sw-mobile</code> and <code>sw-ticketing</code>, the entire <code>ios/</code> directory (Podfile included) is generated from <code>app.json</code>/<code>app.config.js</code> + config plugins. <code>expo prebuild --clean</code> deletes and regenerates it, wiping any hand edits to the Podfile or <code>post_install</code>. Set deployment target and framework linkage through <strong><code>expo-build-properties</code></strong>, and use a <strong>config plugin</strong> (a <code>withPodfile</code>/<code>withDangerousMod</code> mod) for anything the Podfile needs that build-properties can't express. On EAS Build the resolved Pods are cached between builds for speed.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — not committing Podfile.lock</h3>
<p>Without it, every teammate and CI resolves potentially different native versions. Commit <code>Podfile.lock</code> always; that's the whole point of a lock file.</p>

<h3>Anti-pattern 2 — running bare <code>pod update</code></h3>
<p>Bumps every pod to the newest allowed version at once, producing a giant unreviewable diff and surprise breakages. Use <code>pod update SpecificPod</code> or just <code>pod install</code>.</p>

<h3>Anti-pattern 3 — hand-editing pod build settings in Xcode</h3>
<p>Any change to a pod target in Xcode is erased on the next <code>pod install</code>. Do it in <code>post_install</code> instead so it survives.</p>

<h3>Anti-pattern 4 — deleting the Check Pods Manifest.lock phase</h3>
<p>People delete this build phase to silence "sandbox not in sync." That just lets you ship a binary built against the wrong native versions. Run <code>pod install</code> instead.</p>

<h3>Anti-pattern 5 — expecting a JS reload to load native code</h3>
<p>Installing a native library and only reloading Metro. Native changes need <code>pod install</code> + a full rebuild. This is the most common "why isn't my module there" bug.</p>

<h3>Anti-pattern 6 — cargo-culting the arm64 EXCLUDED_ARCHS patch</h3>
<p>Copy-pasting <code>EXCLUDED_ARCHS = arm64</code> from an old Stack Overflow answer breaks simulator builds on Apple Silicon. Understand why it exists before adding it.</p>

<h3>Anti-pattern 7 — flipping use_frameworks! to fix one pod</h3>
<p>Enabling it for a single Swift SDK can cascade into Hermes/Firebase/static-linkage breakage across the whole target. Weigh it as a project-wide decision.</p>

<h3>Anti-pattern 8 — bare <code>pod install</code> without Bundler</h3>
<p>Using a global CocoaPods that differs from <code>Gemfile.lock</code> creates churn in the <code>COCOAPODS:</code> line and subtle resolution differences. Always <code>bundle exec pod install</code>.</p>

<h3>Anti-pattern 9 — committing Pods/ AND ignoring Podfile.lock</h3>
<p>The worst of both: a huge repo and still no version guarantee. Pick one model; the RN default is ignore <code>Pods/</code>, commit <code>Podfile.lock</code>.</p>

<h3>Anti-pattern 10 — ignoring dSYM upload</h3>
<p>Shipping dynamic frameworks / Hermes without uploading dSYMs means production crash reports are unsymbolicated addresses. Wire dSYM upload into the build.</p>

<h3>Anti-pattern 11 — pinning a pod to a git branch long-term</h3>
<p><code>:git =&gt; ..., :branch =&gt; 'main'</code> means your build silently changes whenever that branch moves. Pin a <code>:tag</code> or <code>:commit</code> for reproducibility.</p>

<h3>Anti-pattern 12 — hand-editing ios/Podfile in an Expo prebuild app</h3>
<p><code>expo prebuild --clean</code> wipes it. Use <code>expo-build-properties</code> or a config plugin so the change regenerates.</p>

<h3>Anti-pattern 13 — deleting Podfile.lock to "fix" a resolution error</h3>
<p>This throws away your entire pinned graph and re-resolves everything, potentially bumping dozens of pods. Prefer <code>pod install --repo-update</code> targeting the real issue.</p>

<h3>Anti-pattern 14 — mismatched deployment targets left unpatched</h3>
<p>Letting each pod keep its own low <code>IPHONEOS_DEPLOYMENT_TARGET</code> produces warnings/errors and inconsistent behavior. Normalize it in <code>post_install</code>.</p>

<h3>Anti-pattern 15 — ignoring the CocoaPods gem version in the lock</h3>
<p>The <code>COCOAPODS:</code> line in <code>Podfile.lock</code> flip-flopping between commits signals people running different tool versions. Pin it in the <code>Gemfile</code> and use Bundler.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. What is CocoaPods and why does React Native use it?</div>
  <div class="qa-answer">
    <p>CocoaPods is a Ruby-based dependency manager for Cocoa (iOS/macOS) projects, installed as a Ruby gem. It reads a <code>Podfile</code>, resolves native libraries (called pods) described by <code>.podspec</code> files, downloads them into <code>Pods/</code>, and integrates them into an <code>.xcworkspace</code>. RN uses it because React Native itself, Hermes, and every native module are shipped as pods; autolinking injects a pod per native dependency automatically. It gives a reproducible native graph via <code>Podfile.lock</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Why <code>bundle exec pod install</code> and not just <code>pod install</code>?</div>
  <div class="qa-answer">
    <p>Because CocoaPods is a gem, and its version affects resolution. The <code>Gemfile</code> pins the <code>cocoapods</code> gem; <code>bundle install</code> resolves it into <code>Gemfile.lock</code>; <code>bundle exec pod install</code> then runs that exact pinned version instead of whatever global <code>pod</code> is on PATH. This keeps every developer and CI on the same CocoaPods, avoiding churn in the <code>COCOAPODS:</code> line and subtle resolution differences.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Difference between <code>pod install</code>, <code>pod update</code>, and <code>pod deintegrate</code>?</div>
  <div class="qa-answer">
    <p><code>pod install</code> installs the exact versions in <code>Podfile.lock</code> (resolving only pods not yet locked) — the everyday command after any Podfile/native change. <code>pod update [Name]</code> ignores the lock for that pod (or all pods), resolves the newest allowed version, and rewrites the lock — for deliberate bumps. <code>pod deintegrate</code> removes CocoaPods from the <code>.xcodeproj</code> entirely (build phases, xcconfig) — a recovery step before a clean reinstall.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. What's in <code>Podfile.lock</code> and why must it be committed?</div>
  <div class="qa-answer">
    <p>It pins the exact resolved version of every pod, a SHA checksum per pod (tamper detection), a checksum of the Podfile, and the CocoaPods version used. Committing it makes everyone's <code>pod install</code> reproduce the identical native graph. The "[CP] Check Pods Manifest.lock" build phase validates it against <code>Pods/Manifest.lock</code> and fails the build on drift, so you never ship a binary built against unexpected native versions.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. What does the <code>post_install</code> hook do?</div>
  <div class="qa-answer">
    <p>It runs after pods are generated but before the project is written to disk, so it can rewrite build settings on every pod target. RN calls <code>react_native_post_install</code> there to fix Hermes, C++ flags, codegen, and search paths, and teams add loops that set <code>IPHONEOS_DEPLOYMENT_TARGET</code>, <code>EXCLUDED_ARCHS</code>, and language-standard flags. Because <code>pod install</code> regenerates everything, this hook is the only place build-setting patches survive.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Explain <code>use_frameworks!</code> static vs dynamic and why it causes RN pain.</div>
  <div class="qa-answer">
    <p>By default pods link as static libraries. <code>use_frameworks!</code> builds each pod as a framework — required for Swift pods or framework-only SDKs — with linkage <code>:static</code> (baked into the binary, faster launch) or <code>:dynamic</code> (embedded/signed <code>.framework</code>s, slower dyld launch, dSYMs to manage). The pain: it flips linkage for the entire target, so Hermes, Firebase (needs <code>$RNFirebaseAsStaticFramework = true</code> with static), and legacy Flipper can all break. It's a whole-project decision, not per-pod.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How is Hermes delivered through CocoaPods?</div>
  <div class="qa-answer">
    <p>As the <code>hermes-engine</code> pod, resolved from <code>react-native/sdks/hermes-engine/hermes-engine.podspec</code>, usually as a prebuilt tarball on release (the <code>hermes-engine/Pre-built</code> subspec). <code>:hermes_enabled =&gt; true</code> in <code>use_react_native!</code> pulls it in; false falls back to JSC. Hermes ships its own dSYM, which you must upload to your crash reporter or Hermes frames stay unsymbolicated.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. What is a <code>.podspec</code> and how does it enable autolinking?</div>
  <div class="qa-answer">
    <p>A <code>.podspec</code> is a Ruby manifest describing a pod: <code>s.source_files</code> (what compiles), <code>s.dependency</code> (other pods needed), <code>s.platforms</code> (its deployment floor), version, license. A native module ships one at its package root. Autolinking's <code>use_native_modules!</code> runs <code>npx react-native config</code>, finds every dependency with an iOS podspec, and injects a pod for each — so after <code>npm install</code> + <code>pod install</code> the library "just works" with no Xcode wiring.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Walk me through what <code>use_native_modules!</code> does.</div>
  <div class="qa-answer">
    <p>It's the iOS half of RN autolinking. At install time it shells out to <code>npx react-native config</code>, which enumerates <code>package.json</code> dependencies that ship an iOS podspec, and returns a config hash; CocoaPods then adds a pod declaration for each into the target automatically. That's why you don't hand-write <code>pod 'react-native-x'</code> lines. The Android equivalent is the Gradle <code>native_modules.gradle</code> scan.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. What's in the <code>Pods/</code> folder and should you commit it?</div>
  <div class="qa-answer">
    <p><code>Pods.xcodeproj</code> (builds each pod), <code>Target Support Files/Pods-MyApp/*.xcconfig</code> (header/linker/framework paths your app inherits) plus copy scripts, <code>Manifest.lock</code> (a copy of Podfile.lock for the drift check), and <code>Headers/</code>. It's generated and, by RN default, git-ignored — reproducible from <code>Podfile</code> + <code>Podfile.lock</code>. If you don't commit it, you must commit <code>Podfile.lock</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. You added a native library and it crashes with "module not found" after a reload. Why?</div>
  <div class="qa-answer">
    <p>Metro/Fast Refresh only rebundles JavaScript. The library's native side lives in a pod that isn't in your binary until you run <code>pod install</code> and rebuild the app in Xcode. Any native change — new module, RN bump, Podfile edit, new-arch toggle — needs a pod reinstall plus a full native rebuild, never just a JS reload.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. How does CocoaPods relate to Swift Package Manager for RN?</div>
  <div class="qa-answer">
    <p>SPM is Apple's built-in manager (Package.swift / Package.resolved, added via Xcode). RN has gradual, partial SPM support and some SDKs ship both. But CocoaPods still dominates RN because autolinking, Hermes, codegen, and the vast majority of community modules are wired through podspecs, the <code>post_install</code> patching model has no clean SPM equivalent, and mixing the two in one target is fiddly. In practice you keep CocoaPods and add the occasional SPM package alongside it.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. How do you enable the New Architecture on iOS?</div>
  <div class="qa-answer">
    <p>Run <code>RCT_NEW_ARCH_ENABLED=1 bundle exec pod install</code>. The env var flips codegen and Fabric on for that install, generating the TurboModule/Fabric C++ glue. It only affects that one install, so re-running <code>pod install</code> without it drops back to old arch (Paper). The runtime differences — Fabric, TurboModules, JSI, bridgeless — are a separate topic; here the switch is thrown at pod-install time.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. "The sandbox is not in sync with the Podfile.lock" — what happened and how do you fix it?</div>
  <div class="qa-answer">
    <p>The "[CP] Check Pods Manifest.lock" build phase found <code>Podfile.lock</code> and <code>Pods/Manifest.lock</code> differ — typically you pulled a branch that changed pods but didn't reinstall. Fix by running <code>bundle exec pod install</code>. Do NOT delete the build phase to silence it; that lets you ship against the wrong native versions.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. In an Expo prebuild app, how do you change the iOS deployment target or framework linkage?</div>
  <div class="qa-answer">
    <p>Not by hand-editing <code>ios/Podfile</code> — <code>expo prebuild --clean</code> regenerates the whole <code>ios/</code> folder and wipes it. Use the <code>expo-build-properties</code> config plugin in <code>app.json</code> to set <code>ios.deploymentTarget</code> and <code>ios.useFrameworks</code>, and write a custom config plugin (a Podfile/dangerous mod) for anything build-properties can't express. Expo prebuild runs <code>pod install</code> for you, and EAS caches the pods between builds.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q16. Give a real example where a Podfile change was coupled to other native changes.</div>
  <div class="qa-answer">
    <p>Launching an Expo 53 / RN 0.79 app on iOS 26 simulators needed coordinated patches: a Podfile change plus a <code>post_install</code>-adjacent adjustment, together with an <code>AppDelegate.h</code> / <code>AppDelegate.mm</code> edit and a <code>noop-file.swift</code> (a Swift file added so the target links the Swift runtime). The lesson: native launch bugs often span the Podfile, the app delegate, and the Swift toolchain at once — fixing the Podfile alone wasn't enough.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You know CocoaPods is a Ruby gem and can explain the Gemfile/Bundler layer.</li>
    <li>You always say <code>bundle exec pod install</code> and know why.</li>
    <li>You can name the Podfile pieces: <code>platform</code>, <code>use_native_modules!</code>, <code>use_react_native!</code>, <code>post_install</code>.</li>
    <li>You commit <code>Podfile.lock</code> and can explain the Manifest.lock drift check.</li>
    <li>You understand <code>use_frameworks!</code> static vs dynamic and its blast radius.</li>
    <li>You know Hermes is the <code>hermes-engine</code> pod and needs its dSYM.</li>
    <li>You can explain autolinking via podspecs and why a JS reload can't load native code.</li>
    <li>You know SPM exists but why CocoaPods still dominates RN.</li>
    <li>You know Expo prebuild owns the Podfile and you patch via expo-build-properties / config plugins.</li>
  </ul>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'revision', title: '⚡ Revision — Points to Remember', collapsible: true, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">CocoaPods is a <strong>Ruby gem</strong> that turns your <code>Podfile</code> plus autolinked native module podspecs into a <code>Pods/</code> project and an <code>.xcworkspace</code>; <code>Podfile.lock</code> pins the exact versions you commit, and the <code>post_install</code> hook is where RN patches deployment target, excluded archs, Hermes, and C++ flags.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Ruby all the way down:</strong> CocoaPods is a gem; the <code>Gemfile</code> pins the gem, <code>bundle install</code> resolves it, and <code>bundle exec pod install</code> runs that pinned version so everyone uses the same CocoaPods.</li>
    <li><strong>Podfile anatomy:</strong> <code>platform :ios, min_ios_version_supported</code>, the <code>require</code> of RN's ruby scripts, <code>use_native_modules!</code> (autolinking), <code>use_react_native!(:path, :hermes_enabled, :fabric_enabled)</code>, hand-written <code>pod</code> lines (<code>:path</code>/<code>:git</code>/<code>:tag</code>/<code>:configurations</code>), <code>use_expo_modules!</code>, and the <code>post_install do |installer|</code> hook.</li>
    <li><strong><code>post_install</code> is the patch block:</strong> it calls <code>react_native_post_install</code> and loops pod targets to set <code>IPHONEOS_DEPLOYMENT_TARGET</code>, <code>EXCLUDED_ARCHS</code>, Hermes settings, and C++ flags — the only place build-setting patches survive a reinstall.</li>
    <li><strong>install vs update vs deintegrate:</strong> <code>pod install</code> honors the lock (everyday); <code>pod update Name</code> bumps that pod and rewrites the lock; <code>pod deintegrate</code> rips CocoaPods out of the project for a clean recovery.</li>
    <li><strong>Native change ⇒ reinstall, not reload.</strong> Metro only rebundles JS; a new native module / RN bump / Podfile edit needs <code>pod install</code> + a full Xcode rebuild.</li>
    <li><strong><code>Podfile.lock</code> is committed:</strong> pins exact versions + per-pod checksums + the CocoaPods version; the "[CP] Check Pods Manifest.lock" build phase fails when it drifts from <code>Pods/Manifest.lock</code> ("sandbox is not in sync") — fix with <code>pod install</code>.</li>
    <li><strong><code>Pods/</code> is generated + git-ignored:</strong> holds <code>Pods.xcodeproj</code>, <code>Target Support Files/Pods-App/*.xcconfig</code>, <code>Manifest.lock</code>, <code>Headers/</code>. Open <code>.xcworkspace</code>, never <code>.xcodeproj</code>.</li>
    <li><strong><code>use_frameworks!</code> static vs dynamic:</strong> switches every pod from static libs to frameworks; <code>:static</code> bakes into the binary, <code>:dynamic</code> embeds/signs <code>.framework</code>s (slower launch, dSYMs). It's target-wide — Firebase needs <code>$RNFirebaseAsStaticFramework = true</code> with static, and legacy Flipper was incompatible.</li>
    <li><strong>Hermes is the <code>hermes-engine</code> pod</strong> (usually the prebuilt subspec); ships its own dSYM you must upload or Hermes crash frames stay unsymbolicated.</li>
    <li><strong><code>.podspec</code></strong> = a pod's Ruby manifest: <code>s.source_files</code>, <code>s.dependency</code>, <code>s.platforms</code>. Autolinking (<code>use_native_modules!</code> → <code>npx react-native config</code>) injects a pod for every node_modules package that ships one.</li>
    <li><strong>SPM</strong> is Apple's manager (Package.swift); RN support is gradual, but CocoaPods dominates because autolinking, Hermes, codegen, and most modules are podspec-wired and <code>post_install</code> has no SPM equivalent.</li>
    <li><strong>New arch on iOS:</strong> <code>RCT_NEW_ARCH_ENABLED=1 bundle exec pod install</code> flips codegen + Fabric for that install only.</li>
    <li><strong>Expo reality:</strong> prebuild generates <code>ios/</code> (Podfile included) and runs <code>pod install</code> for you; set deployment target / linkage via <code>expo-build-properties</code>, patch the Podfile via a config plugin, and know <code>expo prebuild --clean</code> wipes hand edits. EAS caches pods.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Installing a native library, reloading Metro, and expecting it to work.</strong> A JS reload never loads native code — the library's pod isn't in the binary until you run <code>bundle exec pod install</code> and rebuild in Xcode. (And never delete the "Check Pods Manifest.lock" phase to silence "sandbox not in sync" — that ships a binary built against the wrong native versions; run <code>pod install</code> instead.)</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"CocoaPods is a Ruby gem that reads the Podfile and autolinked podspecs, resolves them into <code>Pods/</code>, and builds an <code>.xcworkspace</code>. <code>Podfile.lock</code> pins exact versions with checksums and I always commit it."</div>
  <div class="revision-say">"Autolinking's <code>use_native_modules!</code> injects a pod per native package, so after <code>npm install</code> I run <code>bundle exec pod install</code> and rebuild — a JS reload can't load native code."</div>
  <div class="revision-say">"<code>use_frameworks!</code> flips linkage for the whole target, so enabling it for one Swift SDK can cascade into Hermes and Firebase settings; the <code>post_install</code> hook is where I patch deployment target, excluded archs, and C++ flags."</div>
</div>
`},

{ id: 'checklist', title: '✅ Interview Checklist', collapsible: true, html: `
<div class="callout success">
  <div class="callout-title">Can you answer these before moving on?</div>
  <ul>
    <li>Can you explain what CocoaPods is, that it's a Ruby gem, and why RN depends on it?</li>
    <li>Can you walk through the Podfile pieces — <code>platform</code>, <code>use_native_modules!</code>, <code>use_react_native!</code>, and the <code>post_install</code> hook — and what each does?</li>
    <li>Can you say what <code>Podfile.lock</code> pins, why it's committed, and what the "Check Pods Manifest.lock" build phase enforces?</li>
    <li>Can you contrast <code>pod install</code>, <code>pod update</code>, and <code>pod deintegrate</code>, and explain why a JS reload can't pick up a native pod change?</li>
    <li>Can you explain <code>use_frameworks!</code> static vs dynamic and why it's a whole-target decision that breaks Hermes/Firebase/Flipper?</li>
    <li>Can you describe how a <code>.podspec</code> plus autolinking makes a native module "just work," and why CocoaPods still beats SPM for RN?</li>
    <li>Can you explain how Expo prebuild owns the Podfile and how you patch deployment target / linkage without hand-editing it?</li>
  </ul>
</div>
`}

]
});
