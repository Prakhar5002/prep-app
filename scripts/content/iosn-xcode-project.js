window.PREP_SITE.registerTopic({
  id: 'iosn-xcode-project',
  module: 'iOS Native (Deep)',
  title: 'Xcode Project Model',
  estimatedReadTime: '25 min',
  tags: ['xcodeproj', 'xcworkspace', 'pbxproj', 'target', 'scheme', 'build-configuration', 'build-settings', 'build-phases', 'xcconfig', 'cocoapods', 'deriveddata', 'derived-data', 'modulecache', 'ios', 'react-native', 'expo', 'prebuild', 'archive', 'code-signing', 'excluded-archs', 'hermes'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>The iOS side of a React Native app is an <strong>Xcode project</strong>, and almost every "it builds on my machine but not yours", "the simulator won't compile", or "pod install broke everything" bug lives in one of six concepts:</p>
<ul>
  <li><strong>.xcodeproj</strong> — a folder-bundle whose real payload is <code>project.pbxproj</code>, an old-style plist that lists every file, target, and build setting. It is why Xcode merges conflict so badly.</li>
  <li><strong>.xcworkspace</strong> — a thin container that references your app project <em>and</em> the <code>Pods</code> project. Once CocoaPods runs, you must open the workspace, never the bare project.</li>
  <li><strong>Targets</strong> — each produces exactly one product (your app, a test bundle, an extension, or one static library per pod).</li>
  <li><strong>Schemes</strong> — the recipe that says "build these targets, in this configuration, for Run / Test / Profile / Analyze / Archive".</li>
  <li><strong>Build configurations</strong> (Debug / Release) and <strong>build settings</strong> resolved through a layered cascade, often fed by <strong>.xcconfig</strong> files that CocoaPods generates.</li>
  <li><strong>Build phases</strong> — the ordered steps (Compile Sources, Link Binary, Copy Bundle Resources, plus RN's "Bundle React Native code and images" and the <code>[CP]</code> Pods script phases).</li>
</ul>
<p>And when a build goes haunted — stale headers, "module not found", ghost errors that survive a code fix — the answer is almost always <strong>DerivedData</strong>: Xcode's per-project cache of build products and precompiled modules.</p>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>A <code>.xcodeproj</code> is a graph of <em>targets</em> and <em>build settings</em> stored in <code>project.pbxproj</code>; a <code>.xcworkspace</code> just glues your project to the Pods project; a <em>scheme</em> chooses which targets and which configuration a given action builds; and <em>DerivedData</em> is the cache you nuke when reality and the build disagree.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What an Xcode "project" actually is</h3>
<p>When you open <code>ios/</code> in a React Native app you see something like <code>MyApp.xcodeproj</code>, <code>MyApp.xcworkspace</code>, a <code>Podfile</code>, a <code>Pods/</code> folder, and a source folder <code>MyApp/</code> with <code>AppDelegate</code>, <code>Info.plist</code>, and asset catalogs. The <code>.xcodeproj</code> is not a file — it is a <strong>bundle</strong> (a directory macOS shows as one icon). Inside it, the file that matters is <code>project.pbxproj</code>. That single text file <em>is</em> the project: it enumerates every source file reference, every target, every build configuration, and every build setting, all as a graph of objects with 24-character hex identifiers.</p>

<h3>Why RN developers get lost here</h3>
<p>In JavaScript land your "project" is <code>package.json</code> plus a folder tree — declarative, diff-friendly, human-editable. The Xcode equivalent is <code>project.pbxproj</code>, which is a machine-managed object graph in the OpenStep/NeXT plist format. You rarely edit it by hand; you click checkboxes in Xcode and it rewrites the graph. This is the root of three recurring pains: (1) merge conflicts in <code>project.pbxproj</code> are brutal, (2) "which target is this file in?" is invisible from the filesystem, and (3) settings live in a cascade you can't see by reading one file.</p>

<h3>Why the workspace exists at all</h3>
<p>Left alone, an app is one <code>.xcodeproj</code>. But the moment you run <code>pod install</code>, CocoaPods generates a <em>second</em> project, <code>Pods/Pods.xcodeproj</code>, containing a target per dependency, and stitches both projects into <code>MyApp.xcworkspace</code>. From then on, opening the bare <code>.xcodeproj</code> gives you an app that can't find any of its libraries — the workspace is where the app target and the pod targets are visible to each other. React Native apps always use CocoaPods, so you always open the <code>.xcworkspace</code>.</p>

<h3>The mental split you need</h3>
<table>
  <thead><tr><th>Concept</th><th>Answers the question</th><th>Stored in</th></tr></thead>
  <tbody>
    <tr><td>Project (.xcodeproj)</td><td>What files and targets exist?</td><td>project.pbxproj</td></tr>
    <tr><td>Workspace (.xcworkspace)</td><td>Which projects build together?</td><td>contents.xcworkspacedata</td></tr>
    <tr><td>Target</td><td>What single product do I produce?</td><td>a PBXNativeTarget in pbxproj</td></tr>
    <tr><td>Scheme</td><td>Which targets + config for Run/Test/Archive?</td><td>.xcscheme XML</td></tr>
    <tr><td>Configuration</td><td>Debug or Release flavour?</td><td>XCBuildConfiguration + .xcconfig</td></tr>
    <tr><td>Build setting</td><td>What value does a knob resolve to?</td><td>layered cascade</td></tr>
    <tr><td>Build phase</td><td>What ordered steps run to build a target?</td><td>PBX*BuildPhase objects</td></tr>
    <tr><td>DerivedData</td><td>Where did the outputs and caches go?</td><td>~/Library/Developer/Xcode/DerivedData</td></tr>
  </tbody>
</table>

<h3>Why this matters for debugging native errors</h3>
<p>Nearly every "works for me / broken for you" iOS issue reduces to one of these layers disagreeing: a build setting overridden at the wrong level, a scheme building the wrong configuration, a pod's <code>.xcconfig</code> not being included, a script phase failing, or DerivedData caching a stale artifact. If you can name the layer, you can fix the bug. This topic is about giving each ghost a name.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "what opens what" picture</h3>
<div class="diagram">
<pre>
 MyApp.xcworkspace          ← you OPEN this (RN always uses Pods)
   │
   ├── MyApp.xcodeproj       (your app project)
   │      └── project.pbxproj   ← the real graph: files, targets, settings
   │             ├── PBXNativeTarget "MyApp"        → MyApp.app
   │             ├── PBXNativeTarget "MyAppTests"   → MyAppTests.xctest
   │             └── XCBuildConfiguration Debug / Release
   │
   └── Pods/Pods.xcodeproj   (generated by CocoaPods)
          ├── target "RNScreens"      → libRNScreens.a
          ├── target "hermes-engine"  → (prebuilt)
          ├── target "Pods-MyApp"     → aggregate: links everything
          └── *.xcconfig files        → injected into your app target
</pre>
</div>

<h3>The "settings cascade" picture (lowest wins is a myth — highest specificity wins)</h3>
<div class="diagram">
<pre>
 Resolved value a build uses
        ▲
        │ (each layer below can be overridden by the one above)
 ┌──────┴───────────────────────────────────────────┐
 │ 5. Command line   xcodebuild SETTING=value         │ highest
 │ 4. Target level   (Target ▸ Build Settings)        │
 │ 3. xcconfig       (Pods-MyApp.debug.xcconfig)      │
 │ 2. Project level  (Project ▸ Build Settings)       │
 │ 1. Xcode defaults (SDK / platform defaults)        │ lowest
 └────────────────────────────────────────────────────┘
   Combined view shows the merge; "Levels" view shows each layer;
   the bold / rightmost "Resolved" column shows the final value.
</pre>
</div>

<h3>The "one build" picture — how a scheme drives targets, configs and phases</h3>
<div class="diagram">
<pre>
 Scheme "MyApp"  (press ⌘R / Run)
   action = Run  →  configuration = Debug
        │
        ▼
   builds target "Pods-MyApp"  (dependency)
        │  build phases, in order:
        ▼
   builds target "MyApp"
     1. [CP] Check Pods Manifest.lock   (script)
     2. Compile Sources                 (.m/.mm/.swift → .o)
     3. Bundle React Native code+images (script → main.jsbundle in Release)
     4. Link Binary With Libraries      (.a/.framework → executable)
     5. Copy Bundle Resources           (assets, Info.plist)
     6. [CP] Copy Pods Resources        (script)
        │
        ▼
   product: MyApp.app  →  written into DerivedData/Build/Products/Debug-iphonesimulator
</pre>
</div>

<h3>The "same action, different configuration" picture</h3>
<ul>
  <li><strong>Run</strong> (⌘R) → Debug by default → fast incremental compile, JS served by Metro, dev menu on.</li>
  <li><strong>Test</strong> (⌘U) → Debug → builds the app target plus the test bundle target.</li>
  <li><strong>Profile</strong> (⌘I) → Release → launches Instruments against an optimized build.</li>
  <li><strong>Analyze</strong> → Debug → static analyzer, no product run.</li>
  <li><strong>Archive</strong> (Product ▸ Archive) → Release → produces the <code>.xcarchive</code> you upload to App Store Connect; JS is bundled into <code>main.jsbundle</code>.</li>
</ul>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"I'll just edit <code>project.pbxproj</code> in a text editor to add my file." You can, but a single mismatched brace or a duplicated object ID corrupts the whole project and Xcode refuses to open it. Let Xcode (or a config plugin / CocoaPods) mutate the graph. Read the pbxproj to <em>understand</em>; don't hand-author it.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>1 — Inside the .xcodeproj bundle</h3>
<p>Right-click <code>MyApp.xcodeproj</code> ▸ Show Package Contents and you see:</p>
<pre><code class="language-text">MyApp.xcodeproj/
├── project.pbxproj                     ← the object graph (the whole project)
├── xcshareddata/xcschemes/MyApp.xcscheme   ← SHARED schemes (committed)
└── xcuserdata/you.xcuserdatad/          ← per-user state (gitignored)
       └── xcschemes/                    ← user-only schemes + last selection</code></pre>
<p>The <code>project.pbxproj</code> is an OpenStep/NeXTSTEP-style property list (older than XML plists). Its top-level keys are <code>objects</code> (a dictionary keyed by 24-hex-char IDs) and <code>rootObject</code>. A trimmed excerpt:</p>
<pre><code class="language-text">// !$*UTF8*$!
{
  archiveVersion = 1;
  objectVersion = 56;
  objects = {
    13B07F861A680F5B00A75B9A /* MyApp */ = {
      isa = PBXNativeTarget;
      buildConfigurationList = 13B07F93... ;
      buildPhases = ( 13B07F871A... /* Sources */, ... );
      productType = "com.apple.product-type.application";
      name = MyApp;
    };
    /* every file is a PBXFileReference; membership is a PBXBuildFile */
  };
  rootObject = 83CBB9F71A601CBA00E9B192 /* Project object */;
}</code></pre>
<p>Key object types to recognize: <code>PBXProject</code> (root), <code>PBXNativeTarget</code> (a buildable product), <code>PBXFileReference</code> (a file on disk), <code>PBXBuildFile</code> (a file's <em>membership</em> in a target's phase), <code>PBXGroup</code> (the yellow folders in the navigator — often NOT real folders), <code>PBXSourcesBuildPhase</code> / <code>PBXFrameworksBuildPhase</code> / <code>PBXResourcesBuildPhase</code> / <code>PBXShellScriptBuildPhase</code>, and <code>XCBuildConfiguration</code> / <code>XCConfigurationList</code> (settings). Because a file appears as both a <code>PBXFileReference</code> and one <code>PBXBuildFile</code> per target, two branches adding files produce overlapping-but-not-identical edits — that is why pbxproj merges conflict.</p>

<h3>2 — The workspace and why Pods forces it</h3>
<pre><code class="language-xml">&lt;!-- MyApp.xcworkspace/contents.xcworkspacedata --&gt;
&lt;Workspace version="1.0"&gt;
  &lt;FileRef location="group:MyApp.xcodeproj"&gt;&lt;/FileRef&gt;
  &lt;FileRef location="group:Pods/Pods.xcodeproj"&gt;&lt;/FileRef&gt;
&lt;/Workspace&gt;</code></pre>
<p>The workspace itself holds almost nothing — just references. Its job is scope: within one workspace, targets in different projects can depend on and link against each other, and DerivedData is shared. That is exactly what a pod-based build needs. Rule of thumb after any <code>pod install</code>: quit Xcode, reopen the <code>.xcworkspace</code>. Opening the raw <code>.xcodeproj</code> yields "library not found for -lPods-MyApp" style link errors.</p>

<h3>3 — Targets</h3>
<p>A <strong>target</strong> produces exactly one product. Select the project in the navigator and the target list shows on the left. In a typical RN app:</p>
<ul>
  <li><code>MyApp</code> — the app target, product <code>MyApp.app</code>, productType <code>application</code>.</li>
  <li><code>MyAppTests</code> — a unit-test bundle, product <code>MyAppTests.xctest</code>, productType <code>unit-test-bundle</code>.</li>
  <li>Optional extensions — a share extension, a notification service extension, a widget — each its own target and product.</li>
  <li>In the Pods project: one target per pod (e.g. <code>RNScreens</code>, <code>RNGestureHandler</code>, <code>hermes-engine</code>), usually building a static library <code>lib&lt;Name&gt;.a</code>, plus the <strong>aggregate</strong> target <code>Pods-MyApp</code> that links them all together and is what your app target actually depends on.</li>
</ul>
<p><strong>Target membership</strong> is the invisible-from-the-filesystem property: a source file compiles only into the targets it "belongs" to. In the File Inspector (right panel) the "Target Membership" checkboxes control this. A file present on disk but unchecked for the app target simply won't compile into the app — a classic "why is my new native file not found" cause.</p>

<h3>4 — Schemes</h3>
<p>A <strong>scheme</strong> is a saved recipe. It names, for each of the five actions (Run, Test, Profile, Analyze, Archive), which targets to build and which build configuration to use. Stored as <code>.xcscheme</code> XML:</p>
<pre><code class="language-xml">&lt;Scheme&gt;
  &lt;BuildAction&gt;
    &lt;BuildActionEntries&gt;
      &lt;BuildActionEntry&gt;&lt;BuildableReference BlueprintName="MyApp" /&gt;&lt;/BuildActionEntry&gt;
    &lt;/BuildActionEntries&gt;
  &lt;/BuildAction&gt;
  &lt;LaunchAction   buildConfiguration="Debug"   /&gt;
  &lt;TestAction     buildConfiguration="Debug"   /&gt;
  &lt;ProfileAction  buildConfiguration="Release" /&gt;
  &lt;AnalyzeAction  buildConfiguration="Debug"   /&gt;
  &lt;ArchiveAction  buildConfiguration="Release" /&gt;
&lt;/Scheme&gt;</code></pre>
<p><strong>Shared vs user schemes</strong> is a frequent CI gotcha. A scheme in <code>xcshareddata/xcschemes/</code> is committed to git and visible to teammates and CI; a scheme in <code>xcuserdata/</code> is yours alone. If CI reports "scheme MyApp not found", the fix is to tick "Shared" in Product ▸ Scheme ▸ Manage Schemes and commit the resulting file. Edit a scheme via Product ▸ Scheme ▸ Edit Scheme (⌘&lt;) — that dialog is where you flip a Run from Debug to Release, add pre/post-action scripts, set launch arguments and environment variables, or pick the test plan.</p>

<h3>5 — Build configurations and .xcconfig</h3>
<p>Out of the box every target has two <strong>build configurations</strong>, <code>Debug</code> and <code>Release</code>. Debug means no optimization (<code>-Onone</code>), assertions on, faster builds; Release means optimized (<code>-Os</code>), assertions off, what you ship. CocoaPods can add more (it keys its <code>.xcconfig</code> files by configuration name), and some apps add <code>Staging</code> / <code>Production</code> configurations for different bundle IDs and API endpoints.</p>
<p>An <strong>.xcconfig</strong> is a plain-text file of <code>SETTING = value</code> lines — a way to keep build settings in version control instead of buried in pbxproj. CocoaPods generates them per target per configuration and wires them in:</p>
<pre><code class="language-text"># Pods/Target Support Files/Pods-MyApp/Pods-MyApp.debug.xcconfig
HEADER_SEARCH_PATHS = $(inherited) "$(PODS_ROOT)/Headers/Public"
OTHER_LDFLAGS = $(inherited) -ObjC -l"RNScreens" -framework "hermes"
GCC_PREPROCESSOR_DEFINITIONS = $(inherited) COCOAPODS=1
PODS_ROOT = $(SRCROOT)/Pods</code></pre>
<p>The app target's Debug configuration is set to <em>base</em> on <code>Pods-MyApp.debug.xcconfig</code>; that is the mechanism by which every pod's header paths and linker flags reach your app. If <code>pod install</code> didn't run, or the base configuration got detached, your app compiles but fails to find pod headers. The single most-quoted line in these files is <code>$(inherited)</code> — it means "keep the values from lower layers and append", and omitting it is how people accidentally wipe out settings.</p>

<h3>6 — Build settings a RN dev meets</h3>
<table>
  <thead><tr><th>Setting</th><th>What it controls</th></tr></thead>
  <tbody>
    <tr><td><code>IPHONEOS_DEPLOYMENT_TARGET</code></td><td>Minimum iOS version. Must match the Podfile <code>platform :ios</code> or pods complain. RN bumps this over versions.</td></tr>
    <tr><td><code>PRODUCT_BUNDLE_IDENTIFIER</code></td><td>The app's bundle ID (com.company.app). Drives code signing and App Store identity.</td></tr>
    <tr><td><code>MARKETING_VERSION</code></td><td>The user-facing version string (CFBundleShortVersionString), e.g. 1.4.0.</td></tr>
    <tr><td><code>CURRENT_PROJECT_VERSION</code></td><td>The build number (CFBundleVersion), e.g. 42. Must increase per App Store upload.</td></tr>
    <tr><td><code>ONLY_ACTIVE_ARCH</code></td><td>YES in Debug builds only the active architecture (faster); NO in Release builds all.</td></tr>
    <tr><td><code>EXCLUDED_ARCHS</code></td><td>Architectures to skip. The famous <code>arm64</code>-simulator workaround lived here.</td></tr>
    <tr><td><code>ENABLE_BITCODE</code></td><td>Bitcode intermediate representation. Deprecated by Apple; RN sets NO.</td></tr>
    <tr><td><code>SWIFT_VERSION</code></td><td>Swift language version (e.g. 5.0). Required once any Swift file exists.</td></tr>
    <tr><td><code>HEADER_SEARCH_PATHS</code></td><td>Where the compiler looks for #import headers. Pod xcconfigs fill this.</td></tr>
    <tr><td><code>OTHER_LDFLAGS</code></td><td>Extra linker flags, e.g. <code>-ObjC</code>, <code>-l"SomeLib"</code>, <code>-framework X</code>.</td></tr>
    <tr><td><code>CODE_SIGN_IDENTITY</code> / <code>DEVELOPMENT_TEAM</code> / <code>PROVISIONING_PROFILE_SPECIFIER</code> / <code>CODE_SIGN_STYLE</code></td><td>The code-signing group: which certificate, which Apple team, which profile, and Automatic vs Manual signing.</td></tr>
  </tbody>
</table>
<p><strong>Reading the cascade in Xcode:</strong> select a target ▸ Build Settings. The toggles that matter: <strong>Basic / All</strong> (show common vs every setting), <strong>Combined / Levels</strong> (Combined shows one resolved value; Levels shows a column per layer — Resolved, target, xcconfig, project, iOS default — so you can see <em>where</em> a value comes from), and the search box. A green (inherited) value comes from a lower layer; a bold value is overridden at this level. When a setting is "mysteriously wrong", switch to <strong>Levels</strong> and read left along the row to find which layer set it.</p>

<h3>7 — The arm64 simulator saga (why EXCLUDED_ARCHS exists in RN)</h3>
<p>On Apple-Silicon Macs the simulator is <code>arm64</code>, but some older prebuilt binaries only shipped device-<code>arm64</code> + simulator-<code>x86_64</code> slices, so linking the simulator build failed with "building for iOS Simulator, but linking ... built for iOS". The historical fix was to exclude arm64 for the simulator SDK:</p>
<pre><code class="language-text"># In the app target's Build Settings (or via post_install in the Podfile)
EXCLUDED_ARCHS[sdk=iphonesimulator*] = arm64</code></pre>
<p>Modern RN + xcframework-based pods and Hermes largely removed the need, but you will still meet this line in older <code>Podfile</code> post-install hooks and in interview war stories.</p>

<h3>8 — Build phases</h3>
<p>Select a target ▸ Build Phases. The ordered steps for the app target:</p>
<ul>
  <li><strong>[CP] Check Pods Manifest.lock</strong> — a script phase that fails the build early if <code>Podfile.lock</code> and <code>Manifest.lock</code> disagree (i.e. you forgot to run <code>pod install</code> after changing pods). The famous red "The sandbox is not in sync with the Podfile.lock" error.</li>
  <li><strong>Compile Sources</strong> (<code>PBXSourcesBuildPhase</code>) — compiles every <code>.m</code>/<code>.mm</code>/<code>.swift</code>/<code>.c</code> whose target membership includes this target, into object files.</li>
  <li><strong>Bundle React Native code and images</strong> — a shell script phase running <code>react-native-xcode.sh</code>. In Release it invokes Metro to produce <code>main.jsbundle</code> and copies assets into the app; in Debug it is a no-op because JS is served live by Metro.</li>
  <li><strong>Link Binary With Libraries</strong> (<code>PBXFrameworksBuildPhase</code>) — links the compiled objects with the static libs / frameworks (including <code>libPods-MyApp.a</code> and Hermes) into the executable.</li>
  <li><strong>Copy Bundle Resources</strong> (<code>PBXResourcesBuildPhase</code>) — copies assets, storyboards, <code>Info.plist</code>, asset catalogs into the <code>.app</code>.</li>
  <li><strong>[CP] Copy Pods Resources</strong> — copies resource bundles that pods ship (fonts, images, localized strings).</li>
  <li><strong>[CP] Embed Pods Frameworks</strong> — for dynamic frameworks (when <code>use_frameworks!</code> is set), embeds them into the app.</li>
  <li>On Release archives you may also see a <strong>Hermes dSYM</strong> / "Upload Debug Symbols" phase, so crash symbolication works.</li>
</ul>
<p>A script phase's raw form in pbxproj is a <code>PBXShellScriptBuildPhase</code> with a <code>shellScript</code> string plus declared <code>inputPaths</code>/<code>outputPaths</code> (which let Xcode skip the phase when nothing changed).</p>

<h3>9 — DerivedData</h3>
<p><code>~/Library/Developer/Xcode/DerivedData/&lt;ProjectName&gt;-&lt;randomhash&gt;/</code> is Xcode's per-project scratch area. Its key subfolders:</p>
<pre><code class="language-text">DerivedData/MyApp-abcd1234/
├── Build/
│   ├── Products/Debug-iphonesimulator/MyApp.app   ← the built app
│   └── Intermediates.noindex/                      ← .o files, generated headers
├── ModuleCache.noindex/     ← precompiled Clang modules (.pcm) shared across builds
├── Index.noindex/           ← the code-index (autocomplete / jump-to-definition)
└── Logs/                    ← build + test logs (xcactivitylog)</code></pre>
<p>Two "reset" gestures every RN dev needs: <strong>Product ▸ Clean Build Folder</strong> (⇧⌘K) empties the <em>current</em> configuration's build products so the next build recompiles; and <strong>deleting the DerivedData folder</strong> nukes everything including the <code>ModuleCache</code> and index. Why deleting DerivedData exorcises "ghost" errors: a stale precompiled module (<code>.pcm</code>), an out-of-date generated header, or a leftover <code>.o</code> can make the build reference code that no longer matches your source. Clearing the cache forces a from-scratch rebuild that reflects reality. The order to try, cheapest first: (1) ⇧⌘K clean, (2) delete DerivedData, (3) <code>pod deintegrate</code> + <code>pod install</code>, (4) reinstall node_modules and re-run <code>pod install</code>.</p>

<h3>10 — Variable substitution: xcconfig ↔ Info.plist</h3>
<p>Build settings flow into <code>Info.plist</code> via <code>$(VAR)</code> substitution at build time. This is why the plist can read a version defined once in build settings:</p>
<pre><code class="language-xml">&lt;key&gt;CFBundleShortVersionString&lt;/key&gt;
&lt;string&gt;$(MARKETING_VERSION)&lt;/string&gt;
&lt;key&gt;CFBundleVersion&lt;/key&gt;
&lt;string&gt;$(CURRENT_PROJECT_VERSION)&lt;/string&gt;
&lt;key&gt;CFBundleDisplayName&lt;/key&gt;
&lt;string&gt;$(PRODUCT_NAME)&lt;/string&gt;
&lt;key&gt;CFBundleIdentifier&lt;/key&gt;
&lt;string&gt;$(PRODUCT_BUNDLE_IDENTIFIER)&lt;/string&gt;</code></pre>
<p><code>PRODUCT_NAME</code> defaults to <code>$(TARGET_NAME)</code> and names the built product; <code>$(inherited)</code>, <code>$(SRCROOT)</code> (project dir), <code>$(PODS_ROOT)</code>, <code>$(CONFIGURATION)</code>, and <code>$(PLATFORM_NAME)</code> are the other substitutions you meet constantly. The <code>$(VAR)</code> form (and its curly-brace sibling with braces instead of parentheses) are both valid in xcconfig / plist context.</p>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — you don't hand-edit any of this</div>
  <p>In an Expo project with prebuild (Continuous Native Generation), the entire <code>ios/</code> folder — <code>project.pbxproj</code>, targets, schemes, build settings, Info.plist — is <strong>generated</strong> from <code>app.json</code>/<code>app.config.js</code> and the installed config plugins. Running <code>npx expo prebuild --clean</code> deletes and regenerates <code>ios/</code>, so any build setting you tweaked in Xcode by hand is silently wiped. Instead: set the deployment target, versions, and flags through <code>expo-build-properties</code> in <code>app.json</code> (e.g. <code>ios.deploymentTarget</code>), and for anything else write a <strong>config plugin</strong> using <code>withXcodeProject</code> / <code>withInfoPlist</code> / <code>withBuildProperties</code> that mutates the pbxproj at prebuild time. Versions come from <code>version</code> and <code>ios.buildNumber</code> in app config. And EAS Build owns the archive/scheme step in the cloud — you rarely open Xcode to Archive. Prakhar's <code>sw-mobile</code> and <code>sw-ticketing</code> are Expo + prebuild, so treat the committed <code>ios/</code> as a build artifact, not a place to make lasting edits.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — Open the right thing</h3>
<pre><code class="language-bash"># WRONG after pods are installed — app can't find libraries
open ios/MyApp.xcodeproj

# RIGHT — the workspace wires app + Pods together
open ios/MyApp.xcworkspace</code></pre>

<h3>Example 2 — Bump version and build number without opening Xcode</h3>
<p>Because Info.plist reads <code>$(MARKETING_VERSION)</code> and <code>$(CURRENT_PROJECT_VERSION)</code>, you can set them from the CLI:</p>
<pre><code class="language-bash">cd ios
xcrun agvtool new-marketing-version 1.4.0     # MARKETING_VERSION
xcrun agvtool new-version -all 43             # CURRENT_PROJECT_VERSION</code></pre>

<h3>Example 3 — Build a specific scheme + configuration from the terminal</h3>
<pre><code class="language-bash">xcodebuild \\
  -workspace ios/MyApp.xcworkspace \\
  -scheme MyApp \\
  -configuration Release \\
  -sdk iphonesimulator \\
  -derivedDataPath ./build \\
  build</code></pre>
<p>Note it is <code>-workspace</code>, not <code>-project</code>, for any pod-using app, and the scheme must be <strong>shared</strong> or the command can't see it.</p>

<h3>Example 4 — Inspect what schemes exist</h3>
<pre><code class="language-bash">xcodebuild -list -workspace ios/MyApp.xcworkspace
# prints Targets, Build Configurations (Debug/Release), and Schemes</code></pre>

<h3>Example 5 — The Pods xcconfig that feeds your app</h3>
<pre><code class="language-text"># Pods/Target Support Files/Pods-MyApp/Pods-MyApp.release.xcconfig
HEADER_SEARCH_PATHS = $(inherited) "$(PODS_ROOT)/Headers/Public" "$(PODS_ROOT)/Headers/Public/React-Core"
OTHER_LDFLAGS = $(inherited) -ObjC -lc++ -framework "hermes"
FRAMEWORK_SEARCH_PATHS = $(inherited) "$(PODS_CONFIGURATION_BUILD_DIR)/..."
# Your app target's Release config is "based on" this file.</code></pre>

<h3>Example 6 — The arm64 simulator exclusion in a Podfile post_install</h3>
<pre><code class="language-ruby"># ios/Podfile
post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['EXCLUDED_ARCHS[sdk=iphonesimulator*]'] = 'arm64'
    end
  end
end</code></pre>

<h3>Example 7 — Reading the settings cascade with the CLI</h3>
<pre><code class="language-bash"># Dump every RESOLVED build setting for a target/config
xcodebuild -workspace ios/MyApp.xcworkspace -scheme MyApp \\
  -configuration Debug -showBuildSettings | grep -E "DEPLOYMENT_TARGET|BUNDLE_ID|EXCLUDED_ARCHS"</code></pre>

<h3>Example 8 — The full "haunted build" reset for RN iOS</h3>
<pre><code class="language-bash">cd ios
rm -rf ~/Library/Developer/Xcode/DerivedData/*   # nuke cache + ModuleCache
pod deintegrate &amp;&amp; pod install                    # rebuild the Pods project + workspace
cd .. &amp;&amp; watchman watch-del-all                   # clear Metro's file watcher
npx react-native start --reset-cache             # fresh Metro bundler cache</code></pre>

<h3>Example 9 — Target membership from the File Inspector</h3>
<p>New native file <code>MyBridge.m</code> added but "Undefined symbol" at link time? Open it, right panel ▸ Target Membership, and check the <code>MyApp</code> box. Without membership the file exists in the group but never enters the Compile Sources phase.</p>

<h3>Example 10 — "The sandbox is not in sync" script-phase failure</h3>
<pre><code class="language-text">error: The sandbox is not in sync with the Podfile.lock. Run 'pod install'
       or update your CocoaPods installation.</code></pre>
<p>This is the <code>[CP] Check Pods Manifest.lock</code> build phase catching that <code>Manifest.lock</code> (inside <code>Pods/</code>) differs from <code>Podfile.lock</code>. Fix: <code>cd ios &amp;&amp; pod install</code>.</p>

<h3>Example 11 — Expo: set the deployment target the supported way</h3>
<pre><code class="language-json">// app.json
{
  "expo": {
    "version": "1.4.0",
    "ios": { "buildNumber": "43" },
    "plugins": [
      ["expo-build-properties", { "ios": { "deploymentTarget": "15.1" } }]
    ]
  }
}</code></pre>
<p>Then <code>npx expo prebuild</code> writes those into <code>IPHONEOS_DEPLOYMENT_TARGET</code>, <code>MARKETING_VERSION</code>, and <code>CURRENT_PROJECT_VERSION</code> for you — do not edit them in Xcode, they'll be regenerated.</p>

<h3>Example 12 — Expo config plugin editing the pbxproj</h3>
<pre><code class="language-js">// A config plugin using withXcodeProject to mutate the graph safely at prebuild
const { withXcodeProject } = require('@expo/config-plugins');

module.exports = function withMySetting(config) {
  return withXcodeProject(config, (cfg) =&gt; {
    const proj = cfg.modResults;
    proj.addBuildProperty('ENABLE_USER_SCRIPT_SANDBOXING', 'NO');
    return cfg;
  });
};</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Opened the .xcodeproj instead of the workspace</h3>
<p>Link errors like "library not found for -lPods-MyApp" or every pod header "file not found". You bypassed the workspace that makes the Pods project visible. Close and open the <code>.xcworkspace</code>.</p>

<h3>2. Scheme not shared → CI can't find it</h3>
<p>Local builds work; CI fails with "scheme MyApp not found". The scheme lives in <code>xcuserdata/</code> (gitignored). Mark it Shared in Manage Schemes and commit the <code>xcshareddata/xcschemes/*.xcscheme</code>.</p>

<h3>3. Setting overridden at a higher level than you're editing</h3>
<p>You change a value at the project level but the target level (or an xcconfig) still overrides it. Switch Build Settings to <strong>Levels</strong> and read the row; edit at the layer that actually wins, or add <code>$(inherited)</code>.</p>

<h3>4. Forgot $(inherited) and wiped pod flags</h3>
<p>Setting <code>OTHER_LDFLAGS = -ObjC</code> (without <code>$(inherited)</code>) drops every linker flag CocoaPods injected, so pods fail to link. Always prepend <code>$(inherited)</code>.</p>

<h3>5. arm64 simulator link failure on Apple Silicon</h3>
<p>"building for iOS Simulator, but linking ... built for iOS" with a legacy pod. Historically fixed via <code>EXCLUDED_ARCHS[sdk=iphonesimulator*] = arm64</code>. Prefer updating the pod to an xcframework build if one exists.</p>

<h3>6. Deployment target mismatch between Podfile and target</h3>
<p>A pod requires iOS 15 but your target is 13.4 → "compiling for iOS 13.4, but module requires 15.0". Align <code>IPHONEOS_DEPLOYMENT_TARGET</code> with the Podfile <code>platform :ios</code> and the strictest pod.</p>

<h3>7. Two configurations, one wrong bundle ID</h3>
<p>Release archives with the Debug bundle ID (or vice-versa) because a value was set in only one configuration. Build settings are <em>per configuration</em>; expand the setting's disclosure triangle and check both Debug and Release.</p>

<h3>8. DerivedData holds a stale build after a git checkout</h3>
<p>You switch branches and the app still shows old behavior, or compiles code you deleted. The incremental build reused cached <code>.o</code>/module files. ⇧⌘K, or delete the project's DerivedData folder.</p>

<h3>9. ModuleCache corruption after an Xcode upgrade</h3>
<p>Cryptic "PCH file built with a different version" / "module compiled with X cannot be loaded in Y". The precompiled module cache is from the old Xcode. Delete DerivedData (which holds <code>ModuleCache.noindex</code>).</p>

<h3>10. Info.plist shows literal $(MARKETING_VERSION)</h3>
<p>The app displays the variable name instead of a version. The substitution only happens when Info.plist is processed as part of a target build with that setting defined — a stray/duplicated plist not owned by the target won't be substituted.</p>

<h3>11. Yellow group ≠ real folder</h3>
<p>Xcode's navigator "groups" (<code>PBXGroup</code>) don't have to mirror disk folders. Deleting a file from a group may leave it on disk (or vice-versa), and "New Group" doesn't create a directory. Use "New Group with Folder" for a real one.</p>

<h3>12. pbxproj merge conflict after a rebase</h3>
<p>Two branches added files → overlapping <code>PBXFileReference</code>/<code>PBXBuildFile</code> blocks. Hand-resolving risks a corrupt project. Prefer re-adding files on one branch, or use a merge tool aware of pbxproj; on Expo, regenerate via prebuild instead.</p>

<h3>13. Test target can't see app symbols</h3>
<p>The test scheme's Test action doesn't include the app target, or "Host Application" isn't set. Edit Scheme ▸ Test, and check the test target's Host Application / <code>TEST_HOST</code>.</p>

<h3>14. use_frameworks! changes everything</h3>
<p>Switching to <code>use_frameworks!</code> turns static libs into dynamic frameworks, adds an "Embed Pods Frameworks" phase, and can break Hermes/Flipper/RN assumptions. RN's default is static libraries; only enable it if a pod (e.g. some Firebase/Swift pods) demands it.</p>

<h3>15. Script sandboxing (ENABLE_USER_SCRIPT_SANDBOXING)</h3>
<p>Newer Xcode defaults user script phases to sandboxed, breaking RN's "Bundle React Native code and images" and some pod scripts with permission errors. Setting <code>ENABLE_USER_SCRIPT_SANDBOXING = NO</code> (RN sets this) restores access.</p>

<h3>16. Multiple Xcode versions / wrong toolchain</h3>
<p>Builds pick up the wrong SDK because <code>xcode-select</code> points at a different Xcode than you opened. Check <code>xcode-select -p</code> and <code>xcodebuild -version</code>; align the CLI toolchain with the app you're building.</p>

<h3>17. Expo prebuild wiped your Xcode edit</h3>
<p>You fixed a build setting in Xcode, then a teammate's <code>expo prebuild --clean</code> regenerated <code>ios/</code> and the fix vanished. Move the change into a config plugin or <code>expo-build-properties</code> so CNG reproduces it.</p>

<h3>18. Code signing: Automatic vs Manual</h3>
<p>"No profiles for 'com.x.app' were found" on CI. Automatic signing needs an Apple account logged in; CI usually wants Manual with an explicit <code>PROVISIONING_PROFILE_SPECIFIER</code> and <code>CODE_SIGN_IDENTITY</code>, or a tool like Fastlane match / EAS handling credentials.</p>

<h3>19. Duplicate symbols at link time</h3>
<p>A file added to two targets that both link into the app, or a pod vendored twice, produces "duplicate symbol". Check target membership and that a library isn't both statically linked and embedded.</p>

<h3>20. Archive greyed out / builds for simulator</h3>
<p>Product ▸ Archive is disabled or produces a simulator build because the run destination is a simulator, not "Any iOS Device (arm64)". Archive requires a generic device destination.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — hand-editing project.pbxproj</h3>
<p>Manually adding objects or IDs to the pbxproj to "save a step". One typo corrupts the project. Let Xcode, CocoaPods, or a config plugin mutate the graph.</p>

<h3>Anti-pattern 2 — committing the wrong scheme scope</h3>
<p>Relying on a user scheme in <code>xcuserdata/</code> for CI, or committing your personal <code>xcuserdata/</code>. Share the schemes you need on CI; gitignore <code>xcuserdata/</code>.</p>

<h3>Anti-pattern 3 — editing settings without checking the level</h3>
<p>Changing a value at project level while a target-level or xcconfig override silently wins. Always read the Levels view and edit where it takes effect.</p>

<h3>Anti-pattern 4 — dropping $(inherited)</h3>
<p>Overwriting <code>OTHER_LDFLAGS</code>/<code>HEADER_SEARCH_PATHS</code> without <code>$(inherited)</code> nukes CocoaPods' injected values. Always append.</p>

<h3>Anti-pattern 5 — opening the .xcodeproj in a pod project</h3>
<p>Muscle memory double-clicking the project instead of the workspace, then fighting phantom link errors. In a RN app it is always the workspace.</p>

<h3>Anti-pattern 6 — treating "clean" as the first resort</h3>
<p>Nuking DerivedData for every small change wastes minutes rebuilding. Try ⇧⌘K first; reserve full DerivedData deletion for genuine cache corruption.</p>

<h3>Anti-pattern 7 — hardcoding version in Info.plist</h3>
<p>Typing a literal version string instead of <code>$(MARKETING_VERSION)</code>/<code>$(CURRENT_PROJECT_VERSION)</code>, then forgetting to bump it. Drive versions from build settings / app config.</p>

<h3>Anti-pattern 8 — hand-editing android/ or ios/ in an Expo prebuild app</h3>
<p>Making native tweaks directly in the generated folders, which <code>expo prebuild --clean</code> wipes. Use config plugins / <code>expo-build-properties</code> so changes survive regeneration.</p>

<h3>Anti-pattern 9 — committing DerivedData or build output</h3>
<p>Accidentally tracking <code>DerivedData/</code>, <code>build/</code>, or <code>Pods/</code> churn. Gitignore build artifacts; whether to commit <code>Pods/</code> is a team decision but the CocoaPods default is to ignore it.</p>

<h3>Anti-pattern 10 — enabling use_frameworks! casually</h3>
<p>Flipping <code>use_frameworks!</code> to satisfy one Swift pod, then breaking Hermes/static-link assumptions across the app. Understand the linkage change first; prefer <code>:linkage =&gt; :static</code> if needed.</p>

<h3>Anti-pattern 11 — ignoring the [CP] Check Manifest phase error</h3>
<p>Deleting or disabling the "sandbox not in sync" script phase instead of running <code>pod install</code>. The phase is a guardrail — fix the cause.</p>

<h3>Anti-pattern 12 — mismatched deployment targets</h3>
<p>Leaving the app target below the Podfile's <code>platform :ios</code> or a pod's minimum. Keep <code>IPHONEOS_DEPLOYMENT_TARGET</code>, the Podfile, and the strictest pod aligned.</p>

<h3>Anti-pattern 13 — assuming a group is a folder</h3>
<p>Reorganizing files by dragging groups and expecting disk to follow. Groups are logical; verify on-disk paths, especially before deleting.</p>

<h3>Anti-pattern 14 — one giant target for everything</h3>
<p>Putting test code, extension code, and app code in one target to avoid membership management, then shipping test-only symbols. Keep one product per target and manage membership deliberately.</p>

<h3>Anti-pattern 15 — Archiving from a simulator destination</h3>
<p>Trying to Archive with a simulator selected and getting a broken/greyed archive. Select "Any iOS Device (arm64)" (or let EAS build) before archiving.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. What is the difference between an .xcodeproj and an .xcworkspace?</div>
  <div class="qa-answer">
    <p>An <code>.xcodeproj</code> is a bundle whose payload is <code>project.pbxproj</code> — the object graph of files, targets, build configurations, and build settings. An <code>.xcworkspace</code> is a lightweight container that references one or more projects so they build together and share DerivedData. In a React Native app, CocoaPods generates a second project (<code>Pods.xcodeproj</code>) and a workspace tying it to your app project — so you always open the workspace, never the bare project.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Why does project.pbxproj cause such bad merge conflicts?</div>
  <div class="qa-answer">
    <p>It is a single machine-managed file in the OpenStep plist format where every file appears as a <code>PBXFileReference</code> plus one <code>PBXBuildFile</code> per target it belongs to, each with a 24-char hex ID. Two branches adding files produce overlapping edits in the same <code>objects</code> dictionary that git can't cleanly merge, and a mis-resolve corrupts the whole project. Expo prebuild sidesteps this by regenerating the file from app config.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. What is a target?</div>
  <div class="qa-answer">
    <p>A target produces exactly one product: the app (<code>.app</code>), a test bundle (<code>.xctest</code>), an app extension, or — in the Pods project — one static library per dependency. Files compile only into the targets whose "Target Membership" includes them. The app target depends on the <code>Pods-MyApp</code> aggregate target, which links all the individual pod libraries together.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. What is a scheme, and what's the shared-vs-user distinction?</div>
  <div class="qa-answer">
    <p>A scheme is a recipe mapping each action — Run, Test, Profile, Analyze, Archive — to a set of targets and a build configuration (Run defaults to Debug, Archive to Release). A shared scheme lives in <code>xcshareddata/xcschemes/</code> and is committed for teammates and CI; a user scheme lives in gitignored <code>xcuserdata/</code>. "Scheme not found" on CI almost always means the scheme wasn't marked Shared.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Explain the build-settings cascade.</div>
  <div class="qa-answer">
    <p>A setting resolves through layers, higher overriding lower: iOS/SDK defaults, then project level, then any <code>.xcconfig</code> the target is based on, then target level, then command-line <code>xcodebuild</code> overrides. Xcode's Build Settings can show <strong>Combined</strong> (one resolved value) or <strong>Levels</strong> (a column per layer) so you can see which layer set a value. <code>$(inherited)</code> means "append to the lower layer's value" — omit it and you wipe out everything below, including CocoaPods' injected flags.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. What does the EXCLUDED_ARCHS arm64 line do and why did it exist?</div>
  <div class="qa-answer">
    <p>On Apple-Silicon Macs the simulator is arm64, but older prebuilt pods only shipped device-arm64 and simulator-x86_64 slices, so linking the simulator build failed. <code>EXCLUDED_ARCHS[sdk=iphonesimulator*] = arm64</code> tells the compiler to skip arm64 for the simulator SDK, forcing x86_64 (run under Rosetta). Modern xcframework pods and Hermes largely removed the need, but it survives in older Podfile post_install hooks.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Walk me through the app target's build phases in a RN app.</div>
  <div class="qa-answer">
    <ol>
      <li><strong>[CP] Check Pods Manifest.lock</strong> — fails early if you forgot <code>pod install</code>.</li>
      <li><strong>Compile Sources</strong> — .m/.mm/.swift with matching target membership → object files.</li>
      <li><strong>Bundle React Native code and images</strong> — runs <code>react-native-xcode.sh</code>; in Release it builds <code>main.jsbundle</code> via Metro, in Debug it's a no-op.</li>
      <li><strong>Link Binary With Libraries</strong> — links objects with static libs/frameworks (incl. <code>libPods-MyApp.a</code>, Hermes).</li>
      <li><strong>Copy Bundle Resources</strong> — assets, Info.plist into the .app.</li>
      <li><strong>[CP] Copy Pods Resources</strong> / <strong>Embed Pods Frameworks</strong> — pod resource bundles and dynamic frameworks.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. What is DerivedData and when do you delete it?</div>
  <div class="qa-answer">
    <p>It's Xcode's per-project cache under <code>~/Library/Developer/Xcode/DerivedData/</code>: built products, intermediate <code>.o</code> files and generated headers, the <code>ModuleCache</code> of precompiled Clang modules, and the code index. You delete it when reality and the build disagree — stale artifacts, "PCH built with a different version" after an Xcode upgrade, ghost errors that survive a code fix. Order: try Clean Build Folder (⇧⌘K) first, then delete DerivedData, then <code>pod install</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. How does the app version end up in Info.plist?</div>
  <div class="qa-answer">
    <p>Info.plist uses <code>$(VAR)</code> substitution resolved at build time. <code>CFBundleShortVersionString</code> is <code>$(MARKETING_VERSION)</code> and <code>CFBundleVersion</code> is <code>$(CURRENT_PROJECT_VERSION)</code>, both build settings. So you set the version once in build settings (or via <code>agvtool</code>, or Expo's <code>version</code>/<code>ios.buildNumber</code>) and the plist reflects it. Same mechanism for <code>$(PRODUCT_BUNDLE_IDENTIFIER)</code> and <code>$(PRODUCT_NAME)</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. What is an .xcconfig and how does CocoaPods use it?</div>
  <div class="qa-answer">
    <p>An <code>.xcconfig</code> is a text file of <code>SETTING = value</code> lines that keeps build settings in version control instead of pbxproj. CocoaPods generates one per target per configuration (e.g. <code>Pods-MyApp.debug.xcconfig</code>) with the header search paths, linker flags, and preprocessor defines every pod needs, and sets your app target's configuration to be "based on" it. That's the mechanism by which pod headers and flags reach your app — if it detaches, the app can't find pod headers.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. What's the difference between Debug and Release configurations for a RN app?</div>
  <div class="qa-answer">
    <p>Debug: no optimization (<code>-Onone</code>), assertions on, <code>ONLY_ACTIVE_ARCH=YES</code>, and JS is served live by Metro (the RN bundle script is a no-op), dev menu enabled. Release: optimized (<code>-Os</code>), all archs, JS pre-bundled into <code>main.jsbundle</code> and shipped in the app, dev menu off. Archive uses Release; Run and Test default to Debug; Profile uses Release.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. A build fails for a teammate but works for you. How do you reason about it?</div>
  <div class="qa-answer">
    <p>Name the layer. Check: are they opening the workspace not the project? Did they run <code>pod install</code> (the Check Manifest phase)? Is the scheme shared? Is a build setting overridden at a different level (Levels view)? Is DerivedData stale (clean / delete)? Different Xcode/toolchain (<code>xcode-select</code>)? Different arch needs (EXCLUDED_ARCHS)? Almost every "works for me" bug maps to one of workspace, pods, scheme, settings-level, or cache.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. What controls whether a file compiles into the app?</div>
  <div class="qa-answer">
    <p>Target membership. A file exists on disk and as a <code>PBXFileReference</code>, but it only enters a target's Compile Sources phase (via a <code>PBXBuildFile</code>) if that target's membership includes it — the checkbox in the File Inspector. A new <code>.m</code> file with membership unchecked gives "Undefined symbol" at link even though the file is right there in the navigator.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. How does all of this change in an Expo (prebuild) project?</div>
  <div class="qa-answer">
    <p>The whole <code>ios/</code> folder — pbxproj, targets, schemes, settings, Info.plist — is generated from <code>app.json</code>/<code>app.config.js</code> and config plugins via Continuous Native Generation. <code>npx expo prebuild --clean</code> regenerates it, wiping hand edits. You set deployment target/flags via <code>expo-build-properties</code>, versions via <code>version</code>/<code>ios.buildNumber</code>, and anything deeper via a config plugin using <code>withXcodeProject</code>/<code>withInfoPlist</code>. EAS Build owns the archive/scheme step in the cloud.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. What are the code-signing build settings and Automatic vs Manual signing?</div>
  <div class="qa-answer">
    <p><code>DEVELOPMENT_TEAM</code> (your Apple team ID), <code>CODE_SIGN_IDENTITY</code> (the certificate), <code>PROVISIONING_PROFILE_SPECIFIER</code> (the profile), and <code>CODE_SIGN_STYLE</code> (Automatic or Manual). Automatic lets Xcode manage certs/profiles for a logged-in account — great locally, awkward on CI. Manual pins explicit identities and profiles — what CI, Fastlane match, and EAS use for reproducible signing.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You always open the <code>.xcworkspace</code> in a pod-based app and know why.</li>
    <li>You can explain the pbxproj object graph and why it merges badly.</li>
    <li>You define target = one product, and know target membership controls compilation.</li>
    <li>You can map each scheme action to Debug/Release and know shared vs user schemes.</li>
    <li>You can read the build-settings cascade in the Levels view and explain <code>$(inherited)</code>.</li>
    <li>You know the RN build phases including the "Bundle React Native code and images" script.</li>
    <li>You reach for ⇧⌘K then DerivedData deletion for stale-build ghosts.</li>
    <li>You explain <code>$(VAR)</code> substitution into Info.plist for versions and bundle ID.</li>
    <li>You know Expo prebuild regenerates <code>ios/</code> so you configure via plugins, not Xcode.</li>
  </ul>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'revision', title: '⚡ Revision — Points to Remember', collapsible: true, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">A <code>.xcodeproj</code> is the <strong>graph of targets and build settings</strong> in <code>project.pbxproj</code>; a <code>.xcworkspace</code> glues your app project to the Pods project; a <strong>scheme</strong> picks which targets and configuration each action builds; and <strong>DerivedData</strong> is the cache you clear when the build and reality disagree.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>.xcodeproj is a bundle</strong> around <code>project.pbxproj</code> — an OpenStep/plist object graph of <code>PBXFileReference</code>, <code>PBXBuildFile</code> (membership), <code>PBXNativeTarget</code>, build phases, and <code>XCBuildConfiguration</code>; every object has a 24-hex ID, which is why pbxproj merges conflict. Don't hand-edit it.</li>
    <li><strong>.xcworkspace</strong> is a thin container (<code>contents.xcworkspacedata</code>) referencing your app project + <code>Pods/Pods.xcodeproj</code>. After <code>pod install</code> you MUST open the workspace, or you get "library not found for -lPods-MyApp".</li>
    <li><strong>Target = one product</strong>: app (<code>.app</code>), test bundle (<code>.xctest</code>), extension, or one static lib per pod, plus the <code>Pods-MyApp</code> aggregate the app depends on. <strong>Target membership</strong> (File Inspector checkbox) decides if a file compiles into a target.</li>
    <li><strong>Scheme = recipe</strong> mapping Run / Test / Profile / Analyze / Archive to targets + a configuration. Run=Debug, Archive=Release, Profile=Release. <strong>Shared</strong> schemes (<code>xcshareddata/xcschemes</code>) are committed for CI; <strong>user</strong> schemes (<code>xcuserdata</code>) are gitignored → "scheme not found" on CI = not shared.</li>
    <li><strong>Configurations</strong> Debug (<code>-Onone</code>, Metro-served JS, dev menu) vs Release (optimized, <code>main.jsbundle</code> shipped). Pods/apps can add more (Staging/Production).</li>
    <li><strong>.xcconfig</strong> files (text <code>SETTING = value</code>) keep settings in VCS; CocoaPods generates <code>Pods-MyApp.debug/release.xcconfig</code> with <code>HEADER_SEARCH_PATHS</code>, <code>OTHER_LDFLAGS</code>, defines, and your target is "based on" them — that's how pod headers reach the app. <code>$(inherited)</code> appends; omit it and you wipe lower layers.</li>
    <li><strong>Settings cascade</strong> (high overrides low): SDK defaults → project → xcconfig → target → command line. Read it in <strong>Levels</strong> view; Combined shows the single Resolved value.</li>
    <li><strong>Key settings:</strong> <code>IPHONEOS_DEPLOYMENT_TARGET</code>, <code>PRODUCT_BUNDLE_IDENTIFIER</code>, <code>MARKETING_VERSION</code> / <code>CURRENT_PROJECT_VERSION</code>, <code>ONLY_ACTIVE_ARCH</code>, <code>EXCLUDED_ARCHS</code> (arm64 simulator fix), <code>ENABLE_BITCODE</code> (off), <code>SWIFT_VERSION</code>, <code>HEADER_SEARCH_PATHS</code>, <code>OTHER_LDFLAGS</code>, and the <code>CODE_SIGN_*</code> / <code>DEVELOPMENT_TEAM</code> / <code>PROVISIONING_PROFILE_SPECIFIER</code> group (Automatic vs Manual).</li>
    <li><strong>Build phases</strong> (ordered): [CP] Check Pods Manifest.lock → Compile Sources → Bundle React Native code and images (Metro → <code>main.jsbundle</code> in Release only) → Link Binary With Libraries → Copy Bundle Resources → [CP] Copy Pods Resources / Embed Frameworks (+ Hermes dSYM on archive).</li>
    <li><strong>DerivedData</strong> at <code>~/Library/Developer/Xcode/DerivedData/</code> holds Build/Products, Intermediates, <code>ModuleCache.noindex</code> (.pcm), and the index. <strong>⇧⌘K</strong> cleans build products; <strong>deleting DerivedData</strong> kills the module cache — the cure for stale headers / ghost errors / post-Xcode-upgrade PCH mismatches.</li>
    <li><strong>Variable substitution:</strong> Info.plist reads <code>$(MARKETING_VERSION)</code>, <code>$(CURRENT_PROJECT_VERSION)</code>, <code>$(PRODUCT_BUNDLE_IDENTIFIER)</code>, <code>$(PRODUCT_NAME)</code> (defaults to <code>$(TARGET_NAME)</code>) at build time; other common vars: <code>$(SRCROOT)</code>, <code>$(PODS_ROOT)</code>, <code>$(CONFIGURATION)</code>.</li>
    <li><strong>Expo (prebuild):</strong> the whole <code>ios/</code> is generated from app config + config plugins; <code>expo prebuild --clean</code> wipes hand edits. Configure via <code>expo-build-properties</code> (deploymentTarget), <code>version</code>/<code>ios.buildNumber</code>, and <code>withXcodeProject</code>/<code>withInfoPlist</code> plugins. EAS owns archive/scheme.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Opening the bare <code>.xcodeproj</code> instead of the <code>.xcworkspace</code></strong> in a pod-based RN app → the Pods project is invisible and everything fails to link ("library not found for -lPods-MyApp", pod headers "file not found"). Always open the workspace. (Runner-up trap: editing a build setting at the wrong level, or dropping <code>$(inherited)</code> and wiping CocoaPods' injected flags — read the Levels view.)</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"The <code>.xcodeproj</code> is the object graph in <code>project.pbxproj</code> — files, targets, settings — which is why it merges badly. The <code>.xcworkspace</code> just references my app project and the CocoaPods-generated Pods project so they build together, so in a RN app I always open the workspace."</div>
  <div class="revision-say">"A scheme maps each action — Run, Test, Profile, Analyze, Archive — to targets and a configuration; Run is Debug, Archive is Release. Shared schemes are committed for CI; a 'scheme not found' failure usually means it's still a user scheme."</div>
  <div class="revision-say">"Build settings resolve through a cascade — defaults, project, xcconfig, target, command line — readable in the Levels view, and <code>$(inherited)</code> appends. When a build goes haunted I clean the build folder, then delete DerivedData to clear the module cache."</div>
</div>
`},

{ id: 'checklist', title: '✅ Interview Checklist', collapsible: true, html: `
<div class="callout success">
  <div class="callout-title">Can you answer these before moving on?</div>
  <ul>
    <li>Can you explain the difference between <code>.xcodeproj</code> and <code>.xcworkspace</code>, and why a pod-based RN app must open the workspace?</li>
    <li>Can you describe what <code>project.pbxproj</code> stores and why it produces bad merge conflicts?</li>
    <li>Can you define a target, name the ones in a typical RN app, and explain how target membership decides what compiles?</li>
    <li>Can you map each scheme action to its default configuration and explain shared vs user schemes for CI?</li>
    <li>Can you read the build-settings cascade in the Levels view and explain what <code>$(inherited)</code> and <code>.xcconfig</code> files do?</li>
    <li>Can you list the RN app's build phases in order, including the "Bundle React Native code and images" script?</li>
    <li>Can you say what DerivedData holds and when to clean the build folder vs delete DerivedData?</li>
    <li>Can you explain how Expo prebuild changes who owns the pbxproj and how you configure build settings instead?</li>
  </ul>
</div>
`}

]
});
