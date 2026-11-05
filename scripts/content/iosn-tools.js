window.PREP_SITE.registerTopic({
  id: "iosn-tools",
  module: "iOS Native (Deep)",
  title: "Tools: Xcode, xcodebuild, Simulators",
  estimatedReadTime: "24 min",
  tags: ["xcode","xcodebuild","xcrun","simctl","simulator","instruments","console","lldb","deriveddata","dsym","atos","symbolicate","cocoapods","xcode-select","expo","eas","ios","react-native","signing","excluded-archs"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Xcode is a GUI over a CLI stack — <strong><code>xcode-select</code></strong> picks the toolchain, <strong><code>xcodebuild</code></strong> builds, <strong><code>xcrun simctl</code></strong> drives the Simulator, <strong>LLDB</strong> debugs, <strong>Instruments</strong> profiles, <strong>DerivedData</strong> caches, and a <strong>.dSYM</strong> + <strong>atos</strong> turns a crash back into a stack; RN's <code>run-ios</code> and Expo's <code>run:ios</code> are thin wrappers over exactly these.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>run-ios pipeline:</strong> RN/Expo CLI → resolve <code>.xcworkspace</code> + scheme → <code>xcodebuild</code> (using the toolchain from <code>xcode-select -p</code>) → <code>.app</code> in DerivedData → <code>xcrun simctl</code> boot/install/launch; Metro serves the JS bundle separately on 8081.</li>
    <li><strong>Xcode navigators:</strong> Project (Cmd+1), Debug (Cmd+7, live CPU/mem/threads), Breakpoint (Cmd+8, symbolic breakpoints), Report (Cmd+9, the actual build/xcodebuild logs); Debug area (Cmd+Shift+Y) is the LLDB console + variables view.</li>
    <li><strong>Scheme + run destination</strong> pick target+config and which Simulator/device; Edit Scheme ▸ Run ▸ Build Configuration → Release reproduces production-only bugs.</li>
    <li><strong>Signing &amp; Capabilities</strong> (Team, Bundle ID, provisioning, Push/Associated Domains/Keychain) lives only in Xcode; the <strong>Organizer</strong> holds Archives, Crashes (auto-symbolicated), Energy; <strong>Devices &amp; Simulators</strong> (Cmd+Shift+2) manages hardware + simulators.</li>
    <li><strong>xcode-select:</strong> <code>-p</code> prints active dir, <code>--install</code> gets standalone CLT, <code>--switch</code> changes Xcode; run <code>sudo xcodebuild -license accept</code> after updates or every build fails.</li>
    <li><strong>xcodebuild:</strong> <code>-workspace -scheme -configuration -sdk -destination</code> + <code>build</code>/<code>clean</code>/<code>test</code>/<code>archive</code>/<code>-exportArchive</code>; <code>-list</code> shows schemes, <code>-quiet</code> cuts noise; only <strong>shared</strong> schemes are visible to CLI/CI.</li>
    <li><strong>xcrun</strong> runs a tool in the active toolchain; <strong>simctl</strong>: <code>list</code>, <code>boot</code>/<code>shutdown</code>, <code>install</code>/<code>launch</code>, <code>openurl</code> (deep links), <code>get_app_container</code> (sandbox), <code>erase</code> (factory reset), <code>push</code>, <code>spawn booted log stream</code> (logs).</li>
    <li><strong>Simulator vs device:</strong> different SDKs (<code>iphonesimulator</code> vs <code>iphoneos</code>); on Apple Silicon both are arm64, so a device-only framework needs a simulator slice (<code>.xcframework</code>) or the stopgap <code>EXCLUDED_ARCHS[sdk=iphonesimulator*] = arm64</code> (forces x86_64/Rosetta).</li>
    <li><strong>Instruments</strong> (Cmd+I, builds Release): Time Profiler (CPU), Allocations/Leaks (memory), Core Animation/Animation Hitches (FPS), Energy Log, Network; CLI capture via <code>xcrun xctrace record</code>. Never profile Debug.</li>
    <li><strong>Logs:</strong> <code>NSLog</code>/<code>os_log</code>/RN native logs go to unified logging → Console.app or <code>log stream --predicate 'process == "YourApp"'</code>; on simulator <code>xcrun simctl spawn booted log stream</code>. Always filter; values show <code>&lt;private&gt;</code> unless <code>%{public}@</code>.</li>
    <li><strong>LLDB:</strong> <code>b</code> (file:line or symbolic), <code>po</code>, <code>p</code>, <code>bt</code> / <code>thread backtrace all</code>, <code>frame variable</code>, <code>c</code>/<code>n</code>/<code>s</code>; an All-Exceptions breakpoint stops at the throw.</li>
    <li><strong>DerivedData</strong> (<code>~/Library/Developer/Xcode/DerivedData</code>) caches products + ModuleCache + indexes; Cmd+Shift+K cleans the scheme, <code>rm -rf</code> the folder is the deep reset — fixes stale headers after RN bumps, pod installs, codegen/New-Arch toggles, branch switches.</li>
    <li><strong>.dSYM</strong> maps hex→symbols; matched by UUID (<code>dwarfdump --uuid</code>). <code>atos -o …/DWARF/App -arch arm64 -l &lt;load&gt; &lt;addr&gt;</code> for one frame, <code>symbolicatecrash</code>/Organizer for a full report; upload dSYMs to Sentry/Crashlytics.</li>
    <li><strong>CocoaPods:</strong> <code>bundle exec pod install</code> (pinned via Gemfile) generates the <code>.xcworkspace</code> (open the workspace, never the <code>.xcodeproj</code>); <code>ios/.xcode.env</code> sets <code>NODE_BINARY</code> so build phases find Node (fixes nvm "node: command not found").</li>
    <li><strong>Expo:</strong> <code>expo run:ios</code> (prebuild + xcodebuild), Dev Client, <code>eas build -p ios</code> (cloud macOS), <code>expo-doctor</code>; managed projects rarely open Xcode but still use simctl/Console/Instruments — and <code>expo prebuild --clean</code> wipes hand edits to <code>ios/</code>, so configure via app.json/config plugins/<code>expo-build-properties</code>.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Assuming Metro builds the app and that <code>console.log</code> shows everything.</strong> Metro only bundles JS; the native <code>.app</code> is built by <strong>xcodebuild</strong>, and native warnings/crashes/permission denials only appear in Console/<code>log</code>, Xcode's Report navigator, or a symbolicated crash log. Runner-up trap: deleting DerivedData as a reflex instead of reading the actual error, and leaving the <code>EXCLUDED_ARCHS</code> Rosetta hack in permanently.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Xcode is a GUI over a CLI stack: <code>xcode-select</code> picks the toolchain, <code>xcodebuild</code> builds it, <code>xcrun simctl</code> drives the Simulator, LLDB debugs, Instruments profiles, DerivedData caches. <code>run-ios</code> and Expo's <code>run:ios</code> just orchestrate those."</div>
  <div class="revision-say">"For a native crash I set an All-Exceptions breakpoint or read Console with a process predicate, then symbolicate the production stack with the matching dSYM via atos or the Organizer — I always check the dSYM UUID first."</div>
  <div class="revision-say">"On Apple Silicon a device-only framework fails the simulator link because both are arm64; I fix it with a real <code>.xcframework</code> simulator slice and only fall back to <code>EXCLUDED_ARCHS[sdk=iphonesimulator*]=arm64</code> as a stopgap. And in Expo I never hand-edit <code>ios/</code> — prebuild wipes it, so I configure through app.json and config plugins."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What "the iOS toolchain" actually is</h3>
<p>When you type <code>npx react-native run-ios</code> or <code>npx expo run:ios</code>, a chain of Apple tools fires: the RN CLI resolves your <code>.xcworkspace</code>, calls <strong>xcodebuild</strong> to compile, xcodebuild uses the <strong>active developer directory</strong> (chosen by <code>xcode-select</code>) to find the compiler and SDKs, the compiled <code>.app</code> lands in <strong>DerivedData</strong>, then <strong>simctl</strong> boots a Simulator and installs + launches it. Every one of those is a tool you can invoke yourself, and being able to do so is how you debug the whole pipeline instead of guessing.</p>

<h3>Why an RN dev must know it (not just "let Metro handle it")</h3>
<ul>
  <li><strong>Native crashes don't show in the JS red box.</strong> A crash in a native module, in AppDelegate, or in a Pod surfaces as an EXC_BAD_ACCESS or SIGABRT — you need LLDB, Console, and a symbolicated crash log to read it.</li>
  <li><strong>Signing lives only in Xcode.</strong> Provisioning profiles, capabilities (Push, Associated Domains, Keychain sharing), and the Team ID are configured under Signing &amp; Capabilities — no CLI substitute for the first-time setup.</li>
  <li><strong>Stale builds are the #1 "works on my machine" bug.</strong> DerivedData and the module cache silently serve old artifacts; knowing where they live and how to nuke them saves hours.</li>
  <li><strong>Profiling the native side needs Instruments.</strong> A janky <code>FlatList</code>, a memory leak in a native view, energy drain — the JS profiler can't see native frames; Instruments can.</li>
  <li><strong>Interviewers probe it.</strong> "Your app crashes only in Release on device — walk me through it" is a toolchain question (dSYM, atos, Organizer), not a JS question.</li>
</ul>

<h3>The mental split: GUI vs CLI</h3>
<table>
  <thead><tr><th>Task</th><th>GUI (Xcode)</th><th>CLI</th></tr></thead>
  <tbody>
    <tr><td>Build the app</td><td>Cmd+B / Product ▸ Build</td><td><code>xcodebuild build</code></td></tr>
    <tr><td>Pick toolchain</td><td>Xcode ▸ Settings ▸ Locations</td><td><code>xcode-select --switch</code></td></tr>
    <tr><td>Drive a Simulator</td><td>Simulator.app menus</td><td><code>xcrun simctl ...</code></td></tr>
    <tr><td>Read logs</td><td>Console.app / Debug area</td><td><code>log stream</code> / <code>xcrun simctl spawn ... log</code></td></tr>
    <tr><td>Debug natively</td><td>Debug navigator + breakpoints</td><td><code>lldb</code></td></tr>
    <tr><td>Profile</td><td>Product ▸ Profile ▸ Instruments</td><td><code>xctrace record</code></td></tr>
    <tr><td>Symbolicate a crash</td><td>Organizer ▸ Crashes</td><td><code>atos</code> / <code>symbolicatecrash</code></td></tr>
  </tbody>
</table>
<p>The GUI is friendlier for setup; the CLI is scriptable, reproducible, and what CI (EAS Build, Fastlane, GitHub Actions) actually runs. Master both — they are two front-ends to the same engine.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>The "what runs when you run-ios" picture</h3>
<div class="diagram">
<pre>
 npx react-native run-ios   (or expo run:ios)
        │
        ▼
 RN/Expo CLI  ── resolves ──► ios/YourApp.xcworkspace  (workspace, NOT .xcodeproj — Pods live here)
        │
        ▼
 xcodebuild  -workspace -scheme -configuration Debug -sdk iphonesimulator -destination ...
        │            │
        │            └── uses active toolchain from  xcode-select -p
        │                (clang, swiftc, the iOS SDK, codegen)
        ▼
 compiled YourApp.app  ──► ~/Library/Developer/Xcode/DerivedData/YourApp-xxxx/Build/Products/
        │
        ▼
 xcrun simctl boot / install / launch   ──►   Simulator.app shows your app
        │
        ▼
 Metro (JS bundler, port 8081) serves the JS bundle over http to the running app
</pre>
</div>

<h3>The "toolchain layers" picture</h3>
<div class="diagram">
<pre>
 ┌─────────────────────────────────────────────┐
 │ Xcode.app  (IDE: editor, navigators, GUI)   │  ◄─ you here for signing/native debug
 ├─────────────────────────────────────────────┤
 │ xcodebuild / xcrun  (CLI front-ends)        │  ◄─ RN & CI call these
 ├─────────────────────────────────────────────┤
 │ Command Line Tools: clang, swiftc, lldb,    │
 │ ld, simctl, atos, dsymutil, ...             │
 ├─────────────────────────────────────────────┤
 │ SDKs + Simulators + Toolchain               │
 │ (chosen by xcode-select's active dir)       │
 └─────────────────────────────────────────────┘
</pre>
</div>

<h3>The "where do my logs and builds live" picture</h3>
<div class="diagram">
<pre>
 ~/Library/Developer/Xcode/DerivedData/    ← compiled products, indexes, module cache, logs
 ~/Library/Developer/CoreSimulator/Devices/&lt;UDID&gt;/data/   ← a simulator's sandbox (app data)
 ~/Library/Developer/Xcode/Archives/       ← .xcarchive (app + .dSYM) from Product ▸ Archive
 ~/Library/Developer/Xcode/iOS DeviceSupport/  ← symbols per physical-device iOS version
 &lt;archive&gt;/dSYMs/YourApp.app.dSYM           ← the map from hex addresses → symbols
</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Metro builds my iOS app." No — Metro only bundles and serves the JavaScript. The native <code>.app</code> is built entirely by <strong>xcodebuild</strong> before Metro is even needed. If your build fails at the native stage, Metro logs won't help you; you read the <strong>xcodebuild</strong> / Xcode Report navigator output instead.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1 — Xcode the IDE: the parts you touch</h3>
<p>Open <code>ios/YourApp.xcworkspace</code> (the <strong>workspace</strong>, never the bare <code>.xcodeproj</code> — CocoaPods integrates via the workspace). Orient by area:</p>
<ul>
  <li><strong>Navigator area (left, Cmd+1..9):</strong> Project navigator (Cmd+1, files + targets), Source Control navigator, Debug navigator (Cmd+7, live CPU/memory/threads while running), Breakpoint navigator (Cmd+8, all breakpoints + symbolic ones), Report navigator (Cmd+9, every build/run log — where xcodebuild errors actually print).</li>
  <li><strong>Editor + Assistant:</strong> the center pane; the Assistant editor (two panes) pairs a file with its counterpart. Jump Bar at the top navigates symbols.</li>
  <li><strong>Inspectors (right, Cmd+Alt+1..):</strong> File inspector, and for Interface Builder the Attributes/Size inspectors. For RN you mostly use the File inspector + the target editor.</li>
  <li><strong>Debug area (bottom, Cmd+Shift+Y):</strong> two halves — the <strong>variables view</strong> and the <strong>console</strong> (this is your LLDB prompt and where <code>NSLog</code>/RN native logs print).</li>
  <li><strong>Scheme selector + run destination (top-left toolbar):</strong> the scheme picks target + build config (Debug/Release); the destination picks which Simulator or device to run on. "Edit Scheme…" is where you flip the Run build configuration to Release to reproduce production-only bugs.</li>
  <li><strong>Signing &amp; Capabilities (target editor):</strong> Team, Bundle Identifier, "Automatically manage signing", provisioning profile, and the + Capability button (Push Notifications, Associated Domains, Keychain Sharing, Background Modes).</li>
  <li><strong>Organizer (Window ▸ Organizer):</strong> Archives (for App Store upload), Crashes (aggregated, auto-symbolicated from App Store Connect), Energy, and Metrics/Hangs.</li>
  <li><strong>Devices &amp; Simulators (Window ▸ Devices and Simulators, Cmd+Shift+2):</strong> pair/manage physical devices, view device logs, install <code>.app</code>s, and add/delete Simulators.</li>
</ul>

<h3>2 — Command Line Tools + xcode-select</h3>
<p>Xcode ships a bundle of CLIs (clang, swiftc, lldb, git, make, simctl, atos). Which install is "active" is chosen by <code>xcode-select</code>:</p>
<pre><code class="language-bash"># Print the active developer directory (which Xcode the CLIs use)
xcode-select -p
# → /Applications/Xcode.app/Contents/Developer

# Install the standalone Command Line Tools (no full Xcode)
xcode-select --install

# Point the toolchain at a specific Xcode (e.g. switching Xcode versions)
sudo xcode-select --switch /Applications/Xcode_15.4.app/Contents/Developer

# You must accept the license once, or builds fail with a license error
sudo xcodebuild -license accept</code></pre>
<p>Symptom that this is your problem: <code>xcodebuild</code> errors with "tool 'xcodebuild' requires Xcode, but active developer directory is a Command Line Tools instance." Fix with <code>--switch</code> to a full Xcode.</p>

<h3>3 — xcodebuild: the build engine</h3>
<p>Everything Xcode's Cmd+B does, this does headlessly. The canonical RN invocation:</p>
<pre><code class="language-bash">xcodebuild   -workspace ios/YourApp.xcworkspace   -scheme YourApp   -configuration Debug   -sdk iphonesimulator   -destination 'platform=iOS Simulator,name=iPhone 15,OS=17.5'   build

# Other verbs / flags you will meet:
xcodebuild ... clean            # wipe this scheme's build products
xcodebuild ... test             # run the test scheme (XCTest)
xcodebuild ... archive -archivePath build/YourApp.xcarchive
xcodebuild -exportArchive -archivePath build/YourApp.xcarchive   -exportOptionsPlist ExportOptions.plist -exportPath build/ipa
xcodebuild -list -workspace ios/YourApp.xcworkspace   # list schemes/targets/configs
xcodebuild -showsdks                                   # available SDKs
xcodebuild -quiet ...                                  # cut the log noise</code></pre>
<p>Why RN and Expo call it: <code>react-native run-ios</code> resolves the workspace + scheme and shells out to <code>xcodebuild build</code>, then hands the resulting <code>.app</code> to simctl. <code>expo run:ios</code> does the same after running prebuild to generate the <code>ios/</code> folder. The log noise is real — pipe through <code>xcbeautify</code> or <code>xcpretty</code> in CI, and use <code>-quiet</code> to suppress the per-file chatter (errors still print).</p>

<h3>4 — xcrun + simctl: driving Simulators from the terminal</h3>
<p><code>xcrun</code> locates and runs a tool inside the active toolchain (<code>xcrun --find clang</code> prints its path). <code>simctl</code> is the Simulator control CLI:</p>
<pre><code class="language-bash"># List devices, runtimes, and which are Booted
xcrun simctl list
xcrun simctl list devices booted        # only running ones

# Boot / shut down a simulator by name or UDID
xcrun simctl boot "iPhone 15"
xcrun simctl shutdown all

# Install and launch your built .app
xcrun simctl install booted /path/to/YourApp.app
xcrun simctl launch booted com.yourco.yourapp

# Deep-link / universal-link testing — no need to tap through the app
xcrun simctl openurl booted "yourapp://booking/123"
xcrun simctl openurl booted "https://yourco.com/booking/123"

# Tail the system log of the booted simulator (see NSLog / os_log / RN native logs)
xcrun simctl spawn booted log stream --level debug --predicate 'processImagePath CONTAINS "YourApp"'

# Find an installed app's sandbox container (inspect its files / AsyncStorage sqlite)
xcrun simctl get_app_container booted com.yourco.yourapp data

# Reset a simulator to factory (clears all app data + permissions)
xcrun simctl erase "iPhone 15"
xcrun simctl erase all

# Other handy ones
xcrun simctl io booted screenshot shot.png
xcrun simctl privacy booted grant location com.yourco.yourapp
xcrun simctl push booted com.yourco.yourapp payload.apns    # test a push locally</code></pre>

<h3>5 — Simulators vs physical devices (the arch story)</h3>
<p>A Simulator is not an emulator — it runs your app compiled for the host Mac's CPU inside a simulated iOS environment. On Apple Silicon the Simulator slice is <strong>arm64</strong>, and so is a real device — but they are different platforms (<code>iphonesimulator</code> SDK vs <code>iphoneos</code> SDK). A binary framework (a <code>.framework</code> / <code>.xcframework</code> in a Pod) must ship a slice for each. When a third-party Pod ships only device slices, the Simulator build fails to link, and the classic workaround is to exclude the simulator arch:</p>
<pre><code class="language-ruby"># Podfile post_install — the old "exclude arm64 for simulator" hack
installer.pods_project.build_configurations.each do |config|
  config.build_settings['EXCLUDED_ARCHS[sdk=iphonesimulator*]'] = 'arm64'
end</code></pre>
<p>This forces the Simulator build to x86_64 (via Rosetta) so a device-only framework links — a crutch for libraries not yet shipping proper <code>.xcframework</code> simulator slices. Prefer libraries that ship xcframeworks; the exclude-arch hack breaks Apple-Silicon-native simulator runs.</p>

<h3>6 — Instruments: profiling the native side</h3>
<p>Product ▸ Profile (Cmd+I) builds a Release-optimized binary and opens <strong>Instruments</strong>. Pick a template:</p>
<ul>
  <li><strong>Time Profiler</strong> — sampling CPU profiler; find the native functions eating main-thread time (hitches during navigation, heavy JSON parse in a native module).</li>
  <li><strong>Allocations</strong> — track every heap allocation; find what's growing and never freed.</li>
  <li><strong>Leaks</strong> — detect abandoned memory / retain cycles in native (Obj-C/Swift) code.</li>
  <li><strong>Core Animation / Animation Hitches</strong> — FPS and dropped frames for scrolling and animations; on RN this catches native-side render/commit cost.</li>
  <li><strong>Energy Log</strong> — CPU, GPU, network, location energy impact (battery-drain complaints).</li>
  <li><strong>Network</strong> — connections, throughput, and timing of native URLSession traffic.</li>
</ul>
<p>CLI equivalent for CI: <code>xcrun xctrace record --template 'Time Profiler' --launch -- YourApp.app</code> produces a <code>.trace</code> you open later.</p>

<h3>7 — Console.app and the log command</h3>
<p>System logs (from <code>NSLog</code>, <code>os_log</code>, and RN's native logging) go to Apple's unified logging system, readable in <strong>Console.app</strong> or via the <code>log</code> CLI:</p>
<pre><code class="language-bash"># Live stream, filtered by process and log level
log stream --level debug --predicate 'process == "YourApp"'

# Filter by subsystem (os_log(subsystem:category:) you or a Pod defined)
log stream --predicate 'subsystem == "com.yourco.yourapp"'

# Dump the last 10 minutes into a file for after-the-fact reading
log show --last 10m --predicate 'process == "YourApp"' --info --debug &gt; out.log

# For the SIMULATOR specifically, run log inside the simulator:
xcrun simctl spawn booted log stream --predicate 'process == "YourApp"'</code></pre>
<p>In Console.app: select the device/simulator in the sidebar, hit Start, and use the search bar to filter by process, subsystem, or message. This is where you see native logs a JS <code>console.log</code> never reaches — Pod warnings, permission-denied messages, low-memory warnings.</p>

<h3>8 — LLDB: debugging the native side</h3>
<p>Xcode's console is an LLDB prompt; you can also run <code>lldb</code> standalone. Core commands:</p>
<pre><code class="language-bash">b MyNativeModule.m:42     # breakpoint at file:line
b -[RCTView setFrame:]    # symbolic breakpoint on an Obj-C method
br list                   # list breakpoints
po someObject             # "print object" — description of an object
p expression              # print a scalar / evaluate
bt                        # backtrace of the current thread
thread backtrace all      # backtraces of every thread (great for deadlocks)
frame variable            # locals in the current frame
continue   (c)            # resume
next (n) / step (s)       # step over / into
image lookup -a 0x1045...  # what symbol lives at this address</code></pre>
<p>In the GUI, a <strong>symbolic breakpoint</strong> (Breakpoint navigator ▸ + ▸ Symbolic Breakpoint) stops on a method by name even without source — invaluable for stopping in a Pod or in UIKit (e.g. break on <code>UIApplicationMain</code> or an exception with an "All Exceptions" breakpoint). To catch a native crash: add an "All Objective-C Exceptions" breakpoint, reproduce, then read <code>bt</code>.</p>

<h3>9 — DerivedData + ModuleCache: the caching layer</h3>
<p>Xcode caches everything per project under DerivedData: compiled objects, the precompiled-module cache (<code>ModuleCache.noindex</code>), indexes for autocomplete, and build logs.</p>
<pre><code class="language-bash"># Location (per-project subfolders inside)
~/Library/Developer/Xcode/DerivedData/

# The nuclear "stale build" fix
rm -rf ~/Library/Developer/Xcode/DerivedData

# Just this project (safer)
rm -rf ~/Library/Developer/Xcode/DerivedData/YourApp-*</code></pre>
<ul>
  <li><strong>Cmd+Shift+K (Clean Build Folder):</strong> deletes this scheme's build products — the everyday "clean rebuild".</li>
  <li><strong>Cmd+Shift+Alt+K (Clean Build Folder…, deeper):</strong> in current Xcode this is the same Clean action surfaced with options; historically the extra modifier meant a deeper clean. The stronger reset is deleting DerivedData by hand.</li>
</ul>
<p>Why it fixes things: after a dependency version bump, a <code>pod install</code>, a codegen change (New Architecture), or a branch switch, cached objects reference headers that no longer match — you get bizarre "symbol not found" or "module map" errors that clean the moment DerivedData is gone.</p>

<h3>10 — .dSYM + symbolicating crashes</h3>
<p>A Release build strips symbols out of the binary and into a <strong>.dSYM</strong> (debug symbol bundle). A crash log then contains only hex addresses; you re-attach names with the matching dSYM. The two tools:</p>
<pre><code class="language-bash"># atos — turn one address into a symbol (needs the exact dSYM + load address + arch)
atos -o YourApp.app.dSYM/Contents/Resources/DWARF/YourApp   -arch arm64 -l 0x102b40000 0x102b6d1a4
# → -[BookingManager cancel:] (in YourApp) BookingManager.m:88

# symbolicatecrash — symbolicate a whole .crash/.ips file at once
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
"$DEVELOPER_DIR"/Platforms/iPhoneOS.platform/Developer/Library/PrivateFrameworks/DTDeviceKitBase.framework/symbolicatecrash   crash.ips YourApp.app.dSYM &gt; symbolicated.txt</code></pre>
<p>The dSYM and the binary are matched by a <strong>UUID</strong> (<code>dwarfdump --uuid YourApp.app.dSYM</code> must equal the binary's) — the #1 symbolication failure is a mismatched or missing dSYM. Xcode's Organizer ▸ Crashes symbolicates automatically when it has the archive; crash reporters (Sentry, Crashlytics) want you to upload the dSYM so their servers can do it. See the crash-debugging topic for the full workflow.</p>

<h3>11 — CocoaPods / Ruby tooling recap</h3>
<p>iOS dependencies for RN are CocoaPods. The RN template pins Ruby gem versions via a <code>Gemfile</code>, so you run Pods through Bundler to avoid version drift:</p>
<pre><code class="language-bash">cd ios
bundle install              # install the pinned cocoapods gem
bundle exec pod install      # resolve Podfile.lock, generate .xcworkspace
# RN convenience wrapper from the repo root:
npx pod-install</code></pre>
<p>The generated <code>.xcode.env</code> (and optional <code>.xcode.env.local</code>) sets <code>NODE_BINARY</code> so Xcode's build phases (Metro bundle, codegen) can find your Node even when launched from Finder with a minimal PATH:</p>
<pre><code class="language-bash"># ios/.xcode.env
export NODE_BINARY=$(command -v node)</code></pre>
<p>A wrong or missing <code>NODE_BINARY</code> is the classic "Command PhaseScriptExecution failed / node: command not found" build error, especially with nvm.</p>

<h3>12 — Expo reality: what you actually run</h3>
<pre><code class="language-bash">npx expo run:ios              # prebuild (generate ios/) + xcodebuild + launch
npx expo run:ios --device      # onto a physical device
npx expo prebuild              # (re)generate native projects from app.json/config plugins
npx expo-doctor                # check deps/config for known native mismatches
eas build -p ios               # cloud macOS build (no local Xcode needed)</code></pre>
<p>With Expo Dev Client you build a custom dev app once and then reload JS over the network like Expo Go — but with your native modules included.</p>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — prebuild owns the ios/ folder</div>
  <p>In a managed/prebuild project the entire <code>ios/</code> directory is generated. Hand-editing the Xcode project, the Podfile, <code>Info.plist</code>, or entitlements gets <strong>wiped on the next <code>expo prebuild --clean</code></strong>. Persist native settings through <code>app.json</code>/<code>app.config.js</code> and config plugins instead — e.g. <code>expo-build-properties</code> sets <code>ios.deploymentTarget</code>, <code>useFrameworks</code>, and pod flags; capabilities/entitlements go under the <code>ios</code> key or a plugin. You still use <code>simctl</code>, Console, Instruments, and LLDB for native debugging exactly the same way — those tools don't care that Expo generated the project.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — Boot a simulator and install a fresh build from the CLI</h3>
<pre><code class="language-bash">xcrun simctl boot "iPhone 15"
open -a Simulator                       # bring the window up
APP=$(find ~/Library/Developer/Xcode/DerivedData -name "YourApp.app" -path "*Debug-iphonesimulator*" | head -1)
xcrun simctl install booted "$APP"
xcrun simctl launch booted com.yourco.yourapp</code></pre>

<h3>Example 2 — Test a deep link without touching the app UI</h3>
<pre><code class="language-bash"># Universal link and custom scheme both work
xcrun simctl openurl booted "https://yourco.com/booking/998877"
xcrun simctl openurl booted "yourapp://timeline?date=2026-08-26"</code></pre>
<p>This is how you verify React Navigation linking config or a booking deep link in seconds.</p>

<h3>Example 3 — Reproduce a production-only crash in Release</h3>
<p>Edit Scheme (Cmd+&lt;) ▸ Run ▸ Build Configuration → <strong>Release</strong>. Now Cmd+R runs the optimized, symbol-stripped build the way the App Store ships it. A bug that only appears in Release (dead-code elimination, <code>NDEBUG</code>, missing dev-only shims) now reproduces, and you symbolicate with the dSYM.</p>

<h3>Example 4 — Tail only your app's native logs on the simulator</h3>
<pre><code class="language-bash">xcrun simctl spawn booted log stream   --level debug   --predicate 'processImagePath CONTAINS "YourApp"'   --style compact</code></pre>

<h3>Example 5 — Inspect the app sandbox (find the AsyncStorage sqlite)</h3>
<pre><code class="language-bash">DIR=$(xcrun simctl get_app_container booted com.yourco.yourapp data)
echo "$DIR"
ls "$DIR/Documents"
# RN AsyncStorage / SQLite files live under the app's Library/Application Support</code></pre>

<h3>Example 6 — Symbolicate a single crash address</h3>
<pre><code class="language-bash">atos -o YourApp.app.dSYM/Contents/Resources/DWARF/YourApp   -arch arm64 -l 0x104b28000 0x104b5c8f0
# → -[RNBookingModule cancelBooking:] BookingModule.m:142</code></pre>

<h3>Example 7 — Full clean when a build is haunted</h3>
<pre><code class="language-bash">rm -rf ~/Library/Developer/Xcode/DerivedData/YourApp-*
cd ios &amp;&amp; bundle exec pod install &amp;&amp; cd ..
# in Xcode also: Product ▸ Clean Build Folder (Cmd+Shift+K)
npx react-native run-ios</code></pre>

<h3>Example 8 — Switch Xcode versions for a build</h3>
<pre><code class="language-bash">sudo xcode-select --switch /Applications/Xcode_15.4.app/Contents/Developer
xcode-select -p        # verify
xcodebuild -version    # confirm the version you expect</code></pre>

<h3>Example 9 — List schemes when run-ios can't find one</h3>
<pre><code class="language-bash">xcodebuild -list -workspace ios/YourApp.xcworkspace
# Shows Targets / Build Configurations / Schemes.
# A scheme not marked "Shared" won't be visible to the CLI/CI —
# fix in Xcode ▸ Product ▸ Scheme ▸ Manage Schemes ▸ check "Shared".</code></pre>

<h3>Example 10 — Profile a janky screen with Instruments (CLI capture)</h3>
<pre><code class="language-bash">xcrun xctrace record --template 'Time Profiler'   --launch -- "$APP"   --output trace.trace
open trace.trace     # inspect the heaviest stacks in Instruments</code></pre>

<h3>Example 11 — Send a test push to the simulator</h3>
<pre><code class="language-json">// booking.apns
{
  "Simulator Target Bundle": "com.yourco.yourapp",
  "aps": { "alert": { "title": "Booking confirmed", "body": "Room A, 3 PM" }, "sound": "default" }
}</code></pre>
<pre><code class="language-bash">xcrun simctl push booted com.yourco.yourapp booking.apns</code></pre>

<h3>Example 12 — Catch a native exception with a symbolic breakpoint</h3>
<p>Breakpoint navigator ▸ + ▸ "Exception Breakpoint…" ▸ set to <strong>Objective-C</strong>, All. Run, reproduce the crash; execution stops <em>at the throw</em> (not after), and <code>bt</code> in the console shows the exact native frame — far more useful than the post-mortem SIGABRT stack.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. Opening the .xcodeproj instead of the .xcworkspace</h3>
<p>With CocoaPods, the Pods are only wired into the <strong>workspace</strong>. Open <code>YourApp.xcodeproj</code> and you get hundreds of "header not found" errors. Always open <code>YourApp.xcworkspace</code>.</p>

<h3>2. "active developer directory is a Command Line Tools instance"</h3>
<p><code>xcodebuild</code> needs a full Xcode; a bare CLT install isn't enough. Fix: <code>sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer</code>.</p>

<h3>3. Unaccepted license blocks all builds</h3>
<p>After an Xcode update, every build fails until you run <code>sudo xcodebuild -license accept</code>. CI images hit this constantly.</p>

<h3>4. Simulator vs device arch mismatch</h3>
<p>A device-only binary framework won't link for the Simulator, giving "building for iOS Simulator, but linking … built for iOS". Either the lib must ship an <code>.xcframework</code> with a simulator slice, or you apply the <code>EXCLUDED_ARCHS[sdk=iphonesimulator*] = arm64</code> hack (which forces x86_64/Rosetta on Apple Silicon).</p>

<h3>5. Stale DerivedData after codegen / New Architecture toggles</h3>
<p>Flipping <code>RCT_NEW_ARCH_ENABLED</code>, bumping RN, or changing a TurboModule spec leaves generated headers stale — cryptic C++/module-map errors. Delete DerivedData and re-<code>pod install</code>.</p>

<h3>6. NODE_BINARY / nvm not found in build phase</h3>
<p>Xcode build phases run with a minimal PATH; nvm's node isn't on it. "node: command not found" during "Bundle React Native code and images". Fix <code>ios/.xcode.env(.local)</code> to a real node path.</p>

<h3>7. dSYM UUID mismatch → un-symbolicated crash</h3>
<p>If the dSYM doesn't match the binary that crashed (rebuilt since, or Bitcode-recompiled by Apple), <code>atos</code> returns garbage or the same address. Verify with <code>dwarfdump --uuid</code>; for App Store builds download the dSYMs from App Store Connect / Organizer.</p>

<h3>8. Simulator "erase" wipes permissions and data</h3>
<p><code>simctl erase</code> resets the device to factory — great for testing first-launch permission prompts, but you lose logged-in state and granted permissions. Use <code>simctl privacy grant</code> to re-grant quickly.</p>

<h3>9. A non-shared scheme is invisible to CLI/CI</h3>
<p><code>xcodebuild</code>/EAS/Fastlane only see <strong>shared</strong> schemes. If run-ios says "scheme not found", mark it Shared in Manage Schemes (and commit the <code>xcshareddata</code> folder).</p>

<h3>10. os_log privacy redaction hides your values</h3>
<p>Dynamic strings in <code>os_log</code> print as <code>&lt;private&gt;</code> by default in Console. Native code must mark them <code>%{public}@</code> to show — so a Pod's logs may look empty when the data is simply redacted.</p>

<h3>11. Wrong simulator runtime not installed</h3>
<p>A destination like <code>OS=16.4</code> fails if that runtime isn't installed. <code>xcrun simctl list runtimes</code> shows what you have; add more via Xcode ▸ Settings ▸ Components (Platforms).</p>

<h3>12. Multiple booted simulators + "booted" ambiguity</h3>
<p><code>simctl ... booted</code> targets "the" booted device, but with several booted it can pick the wrong one. Use the explicit UDID from <code>simctl list devices booted</code>.</p>

<h3>13. Rosetta Xcode vs native</h3>
<p>Running Xcode under Rosetta (or a terminal under Rosetta) changes which arch tools default to and can mask the arm64 simulator issue — check "Open using Rosetta" is off in Get Info unless you need it.</p>

<h3>14. Console flood on the Simulator</h3>
<p>Unfiltered <code>log stream</code> on a simulator is thousands of lines/sec from the whole OS. Always add a <code>--predicate</code> on process/subsystem or you'll never find your line.</p>

<h3>15. Archive built for the simulator can't be uploaded</h3>
<p>Product ▸ Archive must target "Any iOS Device (arm64)", not a simulator, or the Organizer shows a "generic" archive that App Store Connect rejects. Set the run destination to a device (or Any iOS Device) before archiving.</p>

<h3>16. Derived indexing vs building</h3>
<p>Autocomplete/indexing lives in DerivedData too; a corrupt index shows phantom "cannot find in scope" errors while the build succeeds. Deleting DerivedData forces a re-index.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — "just delete DerivedData" as the only debugging move</h3>
<p>It fixes stale-cache bugs, but reaching for it reflexively hides real errors (a missing Pod, a bad NODE_BINARY). Read the Report navigator / xcodebuild output first; nuke the cache when the error is genuinely a stale artifact.</p>

<h3>Anti-pattern 2 — hand-editing native files in an Expo prebuild project</h3>
<p>Any change to <code>ios/</code>, the Podfile, or entitlements is erased by <code>expo prebuild --clean</code>. Encode it in <code>app.json</code>/config plugins (<code>expo-build-properties</code>) instead, or you'll re-fix the same thing forever.</p>

<h3>Anti-pattern 3 — leaving EXCLUDED_ARCHS in permanently</h3>
<p>The arm64-simulator exclude hack forces Rosetta and slows/greys-out Apple-Silicon simulator runs. It's a stopgap for a library without simulator slices — remove it once the lib ships a proper <code>.xcframework</code>.</p>

<h3>Anti-pattern 4 — reading logs only from Metro / console.log</h3>
<p>Native warnings, permission denials, and low-memory events never reach the JS console. If a native feature "does nothing", open Console.app / <code>log stream</code> before assuming your JS is wrong.</p>

<h3>Anti-pattern 5 — shipping without uploading dSYMs</h3>
<p>Production crashes come back as raw hex. Without the dSYM in your crash reporter, you can't symbolicate. Automate dSYM upload (EAS does it; Fastlane <code>upload_symbols_to_crashlytics</code> / Sentry CLI otherwise).</p>

<h3>Anti-pattern 6 — profiling a Debug build</h3>
<p>Debug binaries are unoptimized, so Instruments numbers are meaningless. Always Product ▸ Profile (which builds Release) or record a Release build; otherwise you'll "optimize" phantom cost.</p>

<h3>Anti-pattern 7 — opening the wrong project file / non-shared scheme</h3>
<p>Opening <code>.xcodeproj</code> or forgetting to share the scheme breaks both local builds and CI in confusing ways. Standardize on the <code>.xcworkspace</code> and commit shared schemes.</p>

<h3>Anti-pattern 8 — mismatched Xcode across the team/CI</h3>
<p>Different Xcode versions produce different Swift ABIs and pod behavior; "works locally, fails on CI" is often just a version gap. Pin the Xcode version (xcode-select on CI, <code>image</code> in EAS) and document it.</p>

<h3>Anti-pattern 9 — not accepting the license / not running pod install after upgrade</h3>
<p>Post-upgrade builds fail on the license and on stale Pods. Bundle both into your setup script: <code>xcodebuild -license accept</code> then <code>bundle exec pod install</code>.</p>

<h3>Anti-pattern 10 — unfiltered log stream, then giving up</h3>
<p>Without a predicate the simulator/device log is unreadable; devs conclude "there are no logs". Filter by process/subsystem and the signal appears.</p>

<h3>Anti-pattern 11 — archiving with a simulator destination</h3>
<p>Produces a non-uploadable generic archive. Set "Any iOS Device (arm64)" before Product ▸ Archive.</p>

<h3>Anti-pattern 12 — trusting po on a stripped Release build</h3>
<p>In Release, LLDB can't resolve symbols/locals that were optimized away; <code>po</code> lies or errors. Debug native logic in Debug, and use symbolicated crash logs for Release-only issues.</p>

<h3>Anti-pattern 13 — committing DerivedData or the Pods folder blindly</h3>
<p>DerivedData is machine-local and must be gitignored; whether to commit <code>Pods/</code> is a team choice, but never commit DerivedData or <code>*.xcuserdata</code>.</p>

<h3>Anti-pattern 14 — using the .app from the wrong DerivedData folder</h3>
<p>Multiple checkouts create multiple <code>YourApp-xxxx</code> DerivedData dirs; installing an old one onto the simulator ships stale native code. Resolve the path from the current build, not a hard-coded one.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. What actually happens when you run <code>npx react-native run-ios</code>?</div>
  <div class="qa-answer">
    <p>The RN CLI resolves the <code>.xcworkspace</code> and a scheme, then calls <strong>xcodebuild</strong> to compile against the active toolchain (chosen by <code>xcode-select</code>). The compiled <code>.app</code> lands in DerivedData. The CLI then uses <code>xcrun simctl</code> to boot a Simulator and install + launch the app. Separately, Metro serves the JS bundle over port 8081. Expo's <code>run:ios</code> is the same, preceded by a prebuild that generates the <code>ios/</code> folder.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Difference between Xcode, xcodebuild, and xcrun?</div>
  <div class="qa-answer">
    <p>Xcode is the IDE. <strong>xcodebuild</strong> is the CLI build engine the IDE wraps — same builds, headless and scriptable. <strong>xcrun</strong> locates and runs a tool inside the active toolchain (so <code>xcrun simctl</code>, <code>xcrun atos</code>, <code>xcrun --find clang</code> all resolve against whichever Xcode <code>xcode-select -p</code> points at). CI uses xcodebuild + xcrun; humans use Xcode for signing and native debugging.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. How do you drive a Simulator without opening Xcode?</div>
  <div class="qa-answer">
    <p><code>xcrun simctl</code>: <code>list</code> devices, <code>boot</code>/<code>shutdown</code>, <code>install</code>/<code>launch</code> an <code>.app</code>, <code>openurl</code> to fire a deep link, <code>get_app_container</code> to inspect the sandbox, <code>erase</code> to factory-reset, <code>push</code> to send a test notification, and <code>spawn booted log stream</code> to tail its logs. It's the scriptable Simulator control surface.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Your app runs on device but won't build for the Simulator — why?</div>
  <div class="qa-answer">
    <p>Almost always an architecture/slice issue: a binary framework (Pod) ships only device (<code>iphoneos</code>) slices and no simulator slice. On Apple Silicon the simulator arch is arm64, which collides with the device arm64 slice. Fixes: use a library that ships a proper multi-slice <code>.xcframework</code>, or temporarily set <code>EXCLUDED_ARCHS[sdk=iphonesimulator*] = arm64</code> to force x86_64/Rosetta for the simulator build.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Where do native logs go, and how do you read them?</div>
  <div class="qa-answer">
    <p>To Apple's unified logging system (<code>NSLog</code>/<code>os_log</code> and RN native logs). Read them in <strong>Console.app</strong> or via the <code>log</code> CLI — <code>log stream --predicate 'process == "YourApp"'</code>, or for a simulator <code>xcrun simctl spawn booted log stream</code>. Always filter by process or subsystem or you drown in OS noise. Values may show as <code>&lt;private&gt;</code> unless logged with <code>%{public}@</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. A user sends a crash with only hex addresses. Walk me through symbolication.</div>
  <div class="qa-answer">
    <p>Find the <strong>.dSYM</strong> that matches the crashing binary (verify UUIDs with <code>dwarfdump --uuid</code>). Use <code>atos -o …/DWARF/YourApp -arch arm64 -l &lt;loadAddress&gt; &lt;address&gt;</code> for a single frame, or <code>symbolicatecrash</code> (or Xcode's Organizer ▸ Crashes) for a whole report. For App Store builds, download the dSYMs from App Store Connect. Crash reporters like Sentry/Crashlytics symbolicate server-side if you've uploaded the dSYM.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. When and why do you delete DerivedData?</div>
  <div class="qa-answer">
    <p>DerivedData (<code>~/Library/Developer/Xcode/DerivedData</code>) caches compiled objects, the module cache, and indexes. After a RN bump, a <code>pod install</code>, a New-Architecture/codegen change, or a branch switch, cached artifacts reference headers that no longer match, producing bogus "symbol/module not found" errors. Deleting it forces a clean rebuild. Cmd+Shift+K cleans the current scheme's products; deleting the folder is the deeper reset. I read the actual error first, though — it's not a substitute for a real fix.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How do you profile a React Native app's native side?</div>
  <div class="qa-answer">
    <p>Product ▸ Profile (Cmd+I) builds Release and opens <strong>Instruments</strong>. Time Profiler for CPU hotspots, Allocations + Leaks for memory, Core Animation / Animation Hitches for FPS and dropped frames, Energy Log for battery, Network for URLSession traffic. Never profile a Debug build — it's unoptimized and the numbers are meaningless. In CI you can capture a <code>.trace</code> with <code>xcrun xctrace record</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Give me five LLDB commands and when you'd use them.</div>
  <div class="qa-answer">
    <p><code>b file:line</code> / a symbolic <code>b -[Class method:]</code> to set breakpoints (even inside a Pod without source); <code>po obj</code> to print an object's description; <code>bt</code> for the current backtrace and <code>thread backtrace all</code> for deadlocks; <code>frame variable</code> for locals; <code>c</code>/<code>n</code>/<code>s</code> to continue/step. An "All Objective-C Exceptions" breakpoint stops at the throw so you catch a native crash where it happens, not post-mortem.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. What does <code>xcode-select</code> do and when does it bite you?</div>
  <div class="qa-answer">
    <p>It sets the active developer directory — which Xcode/toolchain the CLIs use. <code>-p</code> prints it, <code>--install</code> installs the standalone Command Line Tools, <code>--switch</code> points at a specific Xcode. It bites you when the active dir is a bare CLT install ("requires Xcode" error) or the wrong Xcode version (Swift ABI / pod mismatches, "works locally fails on CI"). Pin it on CI.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Why open the <code>.xcworkspace</code> and not the <code>.xcodeproj</code>?</div>
  <div class="qa-answer">
    <p>CocoaPods integrates the Pods project into the <strong>workspace</strong>, not the app's <code>.xcodeproj</code>. Opening the bare project means the Pod headers/libraries aren't wired in, so you get "header not found"/link errors. Always use <code>YourApp.xcworkspace</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. What is <code>.xcode.env</code> / NODE_BINARY for?</div>
  <div class="qa-answer">
    <p>Xcode build phases (bundling the JS, running codegen) need to find Node, but they run with a minimal PATH — so nvm's node isn't visible and you get "node: command not found". <code>ios/.xcode.env</code> (and <code>.xcode.env.local</code>, gitignored, per-machine) export <code>NODE_BINARY</code> to a concrete node path so those phases succeed.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. As an Expo dev, do you ever need Xcode?</div>
  <div class="qa-answer">
    <p>Rarely day to day — <code>expo run:ios</code>, Dev Client, and EAS Build (cloud macOS) cover most work, and native settings live in <code>app.json</code>/config plugins. But for native crashes, deep signing/capability edits, LLDB debugging, and Instruments profiling I still open Xcode, and I use <code>simctl</code>, Console, and Instruments regardless. I never hand-edit the generated <code>ios/</code> folder because <code>expo prebuild --clean</code> wipes it.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. How would you reproduce a bug that only happens in the App Store build?</div>
  <div class="qa-answer">
    <p>Edit Scheme ▸ Run ▸ Build Configuration → Release, then run — that gives the optimized, symbol-stripped binary the store ships (dead-code elimination, <code>NDEBUG</code>, no dev shims). If it crashes, symbolicate with the matching dSYM via atos/Organizer. For device-only issues I also check Organizer ▸ Crashes and Console device logs.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. What's an .xcarchive and what's inside it?</div>
  <div class="qa-answer">
    <p>The product of Product ▸ Archive (targeting Any iOS Device, not a simulator). It bundles the built <code>.app</code> plus its <strong>.dSYM</strong>s and metadata, stored under <code>~/Library/Developer/Xcode/Archives</code> and shown in the Organizer. From it you export an IPA (<code>xcodebuild -exportArchive</code>) for App Store / ad-hoc distribution, and you keep its dSYMs to symbolicate future crashes.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You can trace <code>run-ios</code> down to xcodebuild + simctl + Metro.</li>
    <li>You know Xcode is a GUI over xcodebuild/xcrun and can do both.</li>
    <li>You drive Simulators from the CLI (boot/install/launch/openurl/erase/logs).</li>
    <li>You explain the simulator-vs-device arch issue and EXCLUDED_ARCHS honestly (as a stopgap).</li>
    <li>You read native logs via Console / <code>log</code> with predicates, not just Metro.</li>
    <li>You can symbolicate a crash with a matching dSYM (atos / Organizer) and check UUIDs.</li>
    <li>You reach for DerivedData deletion deliberately, after reading the real error.</li>
    <li>You profile with Instruments on a Release build, naming the right template.</li>
    <li>You respect that Expo prebuild owns <code>ios/</code> and configure via app.json/plugins.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q16. Give me a tour of the Xcode UI: where do build errors, signing, breakpoints, and the LLDB console live?</div>
  <div class="qa-answer">
    <p>The navigator area on the left (Cmd+1..9) has the Project navigator (Cmd+1, files and targets), the Debug navigator (Cmd+7, live CPU/memory/threads), the Breakpoint navigator (Cmd+8, including symbolic breakpoints), and the Report navigator (Cmd+9, every build/run log, which is where xcodebuild errors actually print). The Debug area at the bottom (Cmd+Shift+Y) splits into the variables view and the console, which is your LLDB prompt and where <code>NSLog</code>/RN native logs print. Signing lives in the target editor's Signing &amp; Capabilities tab (Team, Bundle Identifier, automatic signing, profile, + Capability). The scheme selector and run destination in the toolbar pick target + build configuration and the Simulator/device. Window ▸ Organizer holds Archives, auto-symbolicated Crashes, Energy and Metrics.</p>
  </div>
</div>
` },

  ]
});
