window.PREP_SITE.registerTopic({
  id: "iosn-debugging",
  module: "iOS Native (Deep)",
  title: "Debugging Native iOS Errors",
  estimatedReadTime: "26 min",
  tags: ["debugging","crash-log","symbolication","dsym","atos","symbolicatecrash","sigabrt","exc-bad-access","sigsegv","exc-breakpoint","sigtrap","nszombie","lldb","instruments","cocoapods-errors","code-signing-errors","provisioning-profile","dyld","undefined-symbol","excluded-archs","privacy-manifest","ats","hermes","source-maps","expo","eas-build","sentry","crashlytics","ios","react-native"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Debugging native iOS is a pipeline: <strong>get the report → symbolicate (dSYM + atos, source map for Hermes) → read Exception Type to classify → walk down to your first frame → isolate and fix</strong> — and half of "crashes" are toolchain state (pods, DerivedData, signing), not your code.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Crash-report anatomy:</strong> Exception Type (what signal killed it), Exception Codes (address/detail), Termination Reason (who/why), Triggered-by-Thread, the crashed-thread backtrace, and — for SIGABRT — the <strong>Last Exception Backtrace</strong> (where the NSException was thrown). <code>Binary Images</code> lists UUIDs for symbolication.</li>
    <li><strong>Read a backtrace:</strong> frame 0 is usually a system function (objc_msgSend/abort) — walk DOWN to the first frame you own; that line is the lead.</li>
    <li><strong>Where crashes appear:</strong> Xcode console, Devices &amp; Simulators device logs, Organizer → Crashes, Console.app <code>log stream</code>, on-device Analytics Data (<code>.ips</code>), App Store Connect/TestFlight, Crashlytics/Sentry.</li>
    <li><strong>Symbolication:</strong> release strips symbols into a <code>.dSYM</code>; map addresses back with <code>atos -o dSYM -arch arm64 -l LOAD ADDR</code>, or <code>symbolicatecrash</code>/Xcode for a whole report. dSYM UUID must match the binary (<code>dwarfdump --uuid</code>). Upload dSYMs to App Store Connect / Crashlytics / Sentry. The JS half uses the <strong>Hermes source map</strong> via <code>metro-symbolicate</code>, not a dSYM.</li>
    <li><strong>SIGABRT</strong> = uncaught NSException: unrecognized selector, NSRange/invalid-argument, Auto Layout constraint exception, KVO imbalance, or a missing <code>NS*UsageDescription</code> at runtime. Read Last Exception Backtrace; set an All-Exceptions breakpoint.</li>
    <li><strong>EXC_BAD_ACCESS / SIGSEGV</strong> = freed/dangling/over-released memory (use-after-free). Enable <strong>Zombie Objects</strong>, Address Sanitizer, Malloc Scribble.</li>
    <li><strong>EXC_BREAKPOINT / SIGTRAP</strong> = Swift trap: nil force-unwrap, <code>fatalError</code>/precondition, <code>try!</code>/<code>as!</code> failure (Hermes aborts too).</li>
    <li><strong>Launch-time SIGABRT / dyld</strong> = "Library not loaded … image not found" (framework not embedded/linked), missing/renamed resource, bad Info.plist, a pod/Swift-runtime not linked, or an OS-version break.</li>
    <li><strong>CocoaPods:</strong> "Unable to find a specification" → <code>pod repo update</code>; CDN transport error → retry/switch source; version conflict → relax a pin; <code>[CP] Check Pods Manifest.lock</code> fails / "sandbox not in sync" → <code>pod install</code>; corrupt state → <code>pod deintegrate</code> + delete Pods/Podfile.lock/DerivedData + reinstall.</li>
    <li><strong>Build errors:</strong> "framework not found", "Undefined symbol" (link the lib, add <code>-ObjC</code>, open <code>.xcworkspace</code>), "duplicate symbol", header-search-path, <code>EXCLUDED_ARCHS</code>/arm64-simulator, Swift-version mismatch, C++-standard mismatch.</li>
    <li><strong>Code signing:</strong> "No profiles found" / "requires a provisioning profile" (auto-signing + Team), entitlement mismatch (regenerate profile with the capability), expired profile/revoked cert (regenerate, delete stale <code>.mobileprovision</code>).</li>
    <li><strong>Rejections that look like crashes:</strong> missing privacy usage strings, ATS violations, missing <code>PrivacyInfo.xcprivacy</code> privacy manifest.</li>
    <li><strong>Hex hints:</strong> <code>0x8badf00d</code> = watchdog kill (too long on main thread — profile launch), <code>0xdead10cc</code> = held a lock while suspended.</li>
    <li><strong>Tools:</strong> lldb (<code>bt</code>, <code>bt all</code>, <code>po</code>, <code>image lookup</code>), Instruments (Leaks/Allocations), Console.app <code>log stream</code>, Xcode Debug Navigator, the <strong>exception breakpoint</strong>; RN DevTools / Flipper for the JS side.</li>
    <li><strong>Worked example:</strong> sw-mobile (Expo 53 / RN 0.79, old arch) launch crash on iOS 26 needed <strong>four coupled patches</strong> — Podfile + AppDelegate.h + AppDelegate.mm + a <code>noop-file.swift</code> — applied together; new OS breaking launch usually spans several native files at once.</li>
    <li><strong>Expo/EAS:</strong> EAS build logs, <code>npx expo prebuild --clean</code> resets <code>ios/</code> (so encode native fixes as config plugins), <code>npx expo-doctor</code> flags version mismatches, and the Sentry Expo plugin uploads dSYMs + Hermes source maps per build.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Debugging an unsymbolicated release stack and blaming the top system frame.</strong> Hex addresses + <code>objc_msgSend</code>/<code>abort</code> at frame 0 tell you nothing. Fix: symbolicate with the matching dSYM (UUID must match) first, read the Last Exception Backtrace for SIGABRT, then walk DOWN to the first frame you own. And remember many "crashes" are really toolchain state (stale <code>Podfile.lock</code>, dirty DerivedData, an expired profile) or a store-policy rejection (missing privacy string / ATS / privacy manifest), not a bug in your Swift/ObjC.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"First I symbolicate — native frames with the matching dSYM, JS with the Hermes source map — then I read Exception Type to classify: SIGABRT is an uncaught NSException, EXC_BAD_ACCESS is bad memory, EXC_BREAKPOINT is a Swift trap, dyld is a link/launch problem. Then I walk down to my first frame."</div>
  <div class="revision-say">"For SIGABRT I read the Last Exception Backtrace and set an all-exceptions breakpoint so Xcode stops at the throw; for EXC_BAD_ACCESS I turn on Zombie Objects and Address Sanitizer to catch the use-after-free."</div>
  <div class="revision-say">"When a new iOS broke sw-mobile's launch, the fix wasn't one line — it spanned the Podfile, AppDelegate.h, AppDelegate.mm and an empty Swift shim together; in Expo I encode that as a config plugin so prebuild doesn't wipe it."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What "a native iOS error" actually is</h3>
<p>A native iOS failure is any error that occurs below the JavaScript layer — in Objective-C, Swift, C++, the RN native runtime, a linked SDK, or the OS itself. When it happens the process either (a) fails to build, (b) fails to launch, or (c) is killed at runtime by a Unix signal (SIGABRT, SIGSEGV, SIGTRAP…) or a watchdog. Unlike a JS error, a native crash does NOT produce a red-box or a JS stack trace — it terminates the whole app and (in release) leaves only a low-level <strong>crash report</strong> full of memory addresses.</p>

<h3>Why RN developers must own this</h3>
<ul>
  <li><strong>Autolinked pods and native SDKs run below JS.</strong> A camera, a payments SDK, a maps view, or Hermes itself can crash natively while your JS is blameless.</li>
  <li><strong>A new OS or a new Xcode routinely breaks native launch.</strong> iOS 26 broke launch for several Expo 53 / RN 0.79 apps until coupled native patches landed (see the worked example in Mechanics).</li>
  <li><strong>Release-mode crashes are invisible without symbolication.</strong> A JS-only debugging habit leaves you blind exactly when it matters — TestFlight and production.</li>
  <li><strong>Store review "crashes" are often policy failures</strong> (missing privacy strings, ATS violations, a missing privacy manifest) that read like a crash but are really a rejected binary.</li>
</ul>

<h3>Where crashes surface — and how much detail you get</h3>
<table>
  <thead><tr><th>Source</th><th>When</th><th>Symbolicated?</th></tr></thead>
  <tbody>
    <tr><td>Xcode console (debug run)</td><td>Attached debugger, Debug build</td><td>Yes — full, with lldb</td></tr>
    <tr><td>Xcode → Window → Devices &amp; Simulators → View Device Logs</td><td>On-device crash, USB attached</td><td>Usually (Xcode has the dSYM)</td></tr>
    <tr><td>Xcode → Window → Organizer → Crashes</td><td>TestFlight / App Store builds</td><td>Yes if dSYMs were uploaded</td></tr>
    <tr><td>Console.app (macOS)</td><td>Live device logs, <code>log stream</code></td><td>Partial — needs matching dSYM</td></tr>
    <tr><td>Settings → Privacy → Analytics &amp; Improvements → Analytics Data (on device)</td><td>Any crash, even offline</td><td>Raw <code>.ips</code> — you symbolicate</td></tr>
    <tr><td>App Store Connect → TestFlight / Xcode Organizer</td><td>Real users</td><td>Yes if dSYMs uploaded</td></tr>
    <tr><td>Crashlytics / Sentry</td><td>Production, aggregated</td><td>Yes — server-side symbolication from uploaded dSYMs + source maps</td></tr>
  </tbody>
</table>

<h3>The mental split: build-time vs launch-time vs runtime</h3>
<ul>
  <li><strong>Build-time</strong> — it never produced an <code>.app</code>. CocoaPods errors, "Undefined symbol", "framework not found", code-signing failures. Fixed in Xcode / terminal, no device involved.</li>
  <li><strong>Launch-time</strong> — the binary exists but dies in the first moments. <code>dyld: Library not loaded</code>, a missing resource, a bad Info.plist, an OS-version incompatibility. Backtrace usually points at <code>dyld</code> / <code>start</code> / <code>UIApplicationMain</code>.</li>
  <li><strong>Runtime</strong> — it launched and ran, then crashed on some action. SIGABRT / EXC_BAD_ACCESS / EXC_BREAKPOINT with a backtrace into your (or a pod's) code.</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>The crash-report anatomy (what each block means)</h3>
<div class="diagram">
<pre>
 ┌──────────────────────────────────────────────────────────────┐
 │ Incident Identifier / Hardware Model / OS Version            │  ← environment
 │ Process:  MyApp [12345]                                       │
 ├──────────────────────────────────────────────────────────────┤
 │ Exception Type:   EXC_CRASH (SIGABRT)                         │  ← WHAT KILLED IT
 │ Exception Codes:  0x0000000000000000                         │  ← address / detail
 │ Termination Reason: SIGNAL 6 Abort trap: 6                   │  ← who/why killed
 │ Triggered by Thread: 0                                        │  ← which thread
 ├──────────────────────────────────────────────────────────────┤
 │ Last Exception Backtrace:                                    │  ← the ObjC NSException
 │   0 CoreFoundation __exceptionPreprocess                     │     (SIGABRT only)
 │   1 libobjc     objc_exception_throw                         │
 │   2 CoreFoundation -[__NSArray0 objectAtIndex:]              │  ← the real culprit
 │   ...                                                         │
 ├──────────────────────────────────────────────────────────────┤
 │ Thread 0 Crashed:   (the crashed thread backtrace)          │  ← call stack at death
 │   0  MyApp   -[LoginVC submit:]   LoginVC.m:88   ← YOUR FRAME │
 │   1  UIKit   -[UIControl sendAction:...]                     │  ← system frame
 │   ...                                                         │
 ├──────────────────────────────────────────────────────────────┤
 │ Thread 0 crashed with ARM Thread State (registers)          │
 │ Binary Images:  0x104... MyApp arm64  &lt;uuid&gt; /path  ← dSYM   │  ← for symbolication
 └──────────────────────────────────────────────────────────────┘
</pre>
</div>

<h3>How to read a backtrace: top-of-stack + your frames</h3>
<div class="diagram">
<pre>
 Frame 0  = where it died (often a system fn: objc_msgSend, abort)
 Frame 1  = who called that
    ...
 Frame N  = YOUR code  ← scan DOWN until you hit your app / a pod name

 Rule: the OS function at frame 0 is rarely the bug.
       Walk down to the FIRST frame you own — that line is your lead.
       For SIGABRT, the "Last Exception Backtrace" is truer than the
       thread backtrace: it shows where the NSException was THROWN.
</pre>
</div>

<h3>Classify by Exception Type → category</h3>
<div class="diagram">
<pre>
 Exception Type                     Likely category
 ────────────────                   ───────────────
 EXC_CRASH (SIGABRT)          →     uncaught NSException (selector,
                                    constraint, missing Info.plist key)
 EXC_BAD_ACCESS (SIGSEGV)     →     bad / freed / over-released memory
 EXC_BAD_ACCESS (SIGBUS)      →     misaligned / bad address
 EXC_BREAKPOINT (SIGTRAP)     →     Swift fatalError / nil force-unwrap /
                                    precondition / Hermes abort
 EXC_BAD_INSTRUCTION (SIGILL) →     Swift trap / undefined instruction
 dyld: Library not loaded     →     link/launch: missing framework/dylib
 0x8badf00d (Term. Reason)    →     watchdog killed it ("ate bad food" —
                                    too long on main thread at launch)
 0xdead10cc                   →     held a file/db lock while suspended
</pre>
</div>

<div class="callout note">
  <div class="callout-title">Reading the hex hints</div>
  <p>Apple encodes some causes as leetspeak in Exception Codes / Termination Reason. <code>0x8badf00d</code> ("ate bad food") = the watchdog killed you for blocking too long (commonly a slow launch on the main thread). <code>0xdead10cc</code> ("deadlock") = you held a system resource (SQLite lock, file) while being suspended. <code>0xbaaaaaad</code> = a full stackshot (not a crash). Recognizing these instantly saves an hour.</p>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"The crash is in <code>objc_msgSend</code> / <code>abort</code> / <code>__pthread_kill</code>, so the bug is in the OS." No — those are just where the process was executed when the fatal signal fired. The bug lives in the first frame <em>you</em> own (your app or a pod), further down the stack. Symbolicate, then walk down.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>Symbolication — turning addresses into file + line</h3>
<p>A <strong>Debug</strong> build keeps symbols inline, so Xcode/lldb show file+line automatically. A <strong>Release</strong> build strips symbols into a separate <strong>dSYM</strong> ("debug symbols") bundle — so a raw release crash report shows only hex addresses + a load address. <em>Symbolication</em> is the act of mapping those addresses back to functions and lines using the dSYM whose UUID matches the crashing binary.</p>

<h4>The pieces that must line up</h4>
<ul>
  <li><strong>The crash report</strong> lists each loaded image with a UUID under <code>Binary Images:</code> and a load address (e.g. <code>0x104a30000 MyApp arm64 &lt;a1b2...&gt;</code>).</li>
  <li><strong>The dSYM</strong> for that exact build carries the same UUID. If UUIDs differ, symbolication silently fails — you must keep the dSYM from the <em>exact</em> archive you shipped.</li>
</ul>

<pre><code class="language-bash"># Find a binary's UUID(s)
dwarfdump --uuid MyApp.app/MyApp
xcrun dwarfdump --uuid MyApp.app.dSYM

# Locate a dSYM by UUID on your machine (Spotlight indexes archives)
mdfind "com_apple_xcode_dsym_uuids == A1B2C3D4-...-...-..."</code></pre>

<h4>atos — symbolicate a single address</h4>
<pre><code class="language-bash"># -o dSYM  -arch arm64  -l &lt;load address&gt;  &lt;runtime address&gt;
atos -o MyApp.app.dSYM/Contents/Resources/DWARF/MyApp \\
     -arch arm64 -l 0x104a30000 0x104a3f2ac
# → -[LoginViewController submit:] (in MyApp) (LoginViewController.m:88)</code></pre>

<h4>symbolicatecrash — symbolicate a whole .crash/.ips</h4>
<pre><code class="language-bash"># Point it at the dSYM search path, then feed the report
export DEVELOPER_DIR="$(xcode-select -p)"
SYMCRASH="$DEVELOPER_DIR/../SharedFrameworks/DVTFoundation.framework/Versions/A/Resources/symbolicatecrash"
"$SYMCRASH" MyApp-crash.ips MyApp.app.dSYM &gt; symbolicated.crash</code></pre>
<p>In practice: drop the <code>.ips</code>/<code>.crash</code> into Xcode → Organizer, or Window → Devices &amp; Simulators → View Device Logs — Xcode symbolicates automatically if it can find the archive. Command-line <code>atos</code> is your fallback for one-off frames and CI.</p>

<h4>Upload dSYMs so server-side tools can symbolicate</h4>
<ul>
  <li><strong>App Store Connect</strong>: check "Upload your app's symbols" when uploading; then Xcode Organizer symbolicates production crashes.</li>
  <li><strong>Firebase Crashlytics</strong>: run its <code>upload-symbols</code> script (or the Fastlane <code>upload_symbols_to_crashlytics</code> action) on the archive's dSYMs. Bitcode-recompiled dSYMs must be downloaded from App Store Connect first.</li>
  <li><strong>Sentry</strong>: <code>sentry-cli debug-files upload</code> (or the Sentry Xcode build phase / Expo plugin) uploads dSYMs by UUID.</li>
</ul>

<h4>The JS half — Hermes bytecode + source maps</h4>
<p>RN ships Hermes by default. A JS crash in release does not show file+line either — the stack is Hermes bytecode addresses. You symbolicate it with the <strong>source map</strong> generated at bundle time, not with a dSYM.</p>
<pre><code class="language-bash"># Symbolicate a Hermes/JS stack with the bundle's source map
npx metro-symbolicate ios/main.jsbundle.map &lt; js-stack.txt

# Sentry/Crashlytics want BOTH: the native dSYMs AND the JS source map
# (Sentry RN uploads the Hermes source map via sentry-cli / the plugin)</code></pre>

<div class="callout info">
  <div class="callout-title">Two symbol worlds, one crash</div>
  <p>A production RN crash may need BOTH: the <strong>dSYM</strong> to symbolicate native frames and the <strong>Hermes source map</strong> to symbolicate the JS frames. Sentry/Crashlytics ingest both; keep both artifacts per build (tag by app version + build number).</p>
</div>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — where dSYMs and source maps come from on EAS</div>
  <p>With <code>eas build</code> you never open Xcode Organizer to grab the dSYM — EAS produces it in the build artifacts. Configure the <strong>Sentry Expo plugin</strong> (<code>@sentry/react-native/expo</code> in <code>app.json</code>/<code>app.config.js</code>) so the build automatically uploads dSYMs AND the Hermes source map keyed to the release. If you hand-edit <code>ios/</code> to add a symbol-upload build phase, remember <code>npx expo prebuild --clean</code> will wipe it — put it in a <strong>config plugin</strong> instead so it survives Continuous Native Generation.</p>
</div>

<h3>A catalogue of common native errors</h3>

<h4>SIGABRT — an uncaught Objective-C NSException</h4>
<p>SIGABRT means some ObjC code called <code>abort()</code>, almost always because an <code>NSException</code> was thrown and never caught. The <code>Last Exception Backtrace</code> block is your best evidence. The classic causes:</p>
<ul>
  <li><strong>unrecognized selector sent to instance</strong> — you called a method that does not exist on that object (a renamed API, a nil-vs-wrong-type, a typo in a bridging name). Console shows: <code>-[__NSCFString count]: unrecognized selector sent to instance 0x...</code></li>
  <li><strong>NSRangeException / NSInvalidArgumentException</strong> — index out of bounds, inserting nil into an array/dictionary.</li>
  <li><strong>Auto Layout constraint exception</strong> — "Unable to simultaneously satisfy constraints" escalating to a thrown exception, or a bad constraint on a native view.</li>
  <li><strong>KVO imbalance</strong> — an observer deallocated while still registered: "was deallocated while key value observers were still registered".</li>
  <li><strong>Missing Info.plist usage-description at runtime</strong> — accessing camera/mic/location/photos WITHOUT the matching <code>NSCameraUsageDescription</code> / <code>NSMicrophoneUsageDescription</code> / <code>NSLocationWhenInUseUsageDescription</code> / <code>NSPhotoLibraryUsageDescription</code> key throws and aborts. The console prints exactly which key is missing.</li>
</ul>
<pre><code class="language-text">*** Terminating app due to uncaught exception 'NSInvalidArgumentException',
    reason: '-[__NSCFString count]: unrecognized selector sent to instance 0x600...'
Fix: set an Exception Breakpoint (see Tools) — it stops at the THROW,
     not at abort(), so you see the offending call directly.</code></pre>

<h4>EXC_BAD_ACCESS / SIGSEGV — bad memory access</h4>
<p>You dereferenced a pointer that is freed, nil-in-a-nonnull-way, or otherwise invalid — a classic use-after-free / over-release / dangling pointer. Exception Codes often includes <code>KERN_INVALID_ADDRESS</code> and the faulting address (e.g. <code>0x10</code> — a small offset off a nil base points at a nil object member access). These are the hardest because the crash site is where you <em>touched</em> the bad memory, not where it was freed.</p>
<ul>
  <li><strong>Enable Zombie Objects</strong> (Scheme → Run → Diagnostics → "Zombie Objects") so a freed object survives as a "zombie" and, on the next message, reports exactly which deallocated instance you messaged: <code>*** -[MyClass foo]: message sent to deallocated instance 0x...</code>.</li>
  <li><strong>Address Sanitizer (ASan)</strong> (Diagnostics → "Address Sanitizer") catches heap-buffer-overflow / use-after-free with a precise report — use for C/C++ or tricky pods.</li>
  <li><strong>Malloc Scribble / Guard Malloc</strong> fill freed memory with poison so use-after-free faults immediately.</li>
  <li>Common in RN with hand-written C++/JSI, unsafe pod bridging, or an over-released delegate.</li>
</ul>

<h4>EXC_BREAKPOINT (SIGTRAP) — a Swift trap</h4>
<p>Swift inserts a trap instruction for <em>logic</em> failures. The process gets EXC_BREAKPOINT even with no debugger attached. Causes:</p>
<ul>
  <li><strong>Force-unwrap of nil</strong>: <code>let x = optional!</code> when it is nil → "Fatal error: Unexpectedly found nil while unwrapping an Optional value".</li>
  <li><strong>fatalError() / preconditionFailure() / assertionFailure()</strong> hit.</li>
  <li><strong>Array out of range</strong> in Swift, forced <code>try!</code> that throws, integer overflow with <code>&amp;</code>-less arithmetic, or a failed <code>as!</code> cast.</li>
  <li>Hermes and some native runtimes also raise SIGTRAP on their own <code>abort</code> paths; check whether the crashed frame is Swift or the JS engine.</li>
</ul>

<h4>"Thread 1: signal SIGABRT" AT LAUNCH — the launch-time family</h4>
<p>A SIGABRT (or a dyld error) in the first moments — the backtrace tops out in <code>dyld</code>, <code>start</code>, <code>UIApplicationMain</code>, <code>RCTAppDelegate</code>. Usual suspects:</p>
<ul>
  <li><strong>dyld: Library not loaded … Reason: image not found</strong> — a dynamic framework/dylib the binary needs is not embedded/linked. Fix embedding ("Embed &amp; Sign" in Frameworks, or the pod's <code>use_frameworks!</code> setting), or a missing <code>@rpath</code>.</li>
  <li><strong>Missing / renamed resource</strong> — a required asset, storyboard, <code>main.jsbundle</code>, or <code>.mobileprovision</code> not in the bundle.</li>
  <li><strong>Bad Info.plist</strong> — malformed plist, missing <code>CFBundleExecutable</code>, wrong <code>UILaunchStoryboardName</code>.</li>
  <li><strong>A pod not linked / a Swift pod missing its runtime</strong> — "Library not loaded: @rpath/libswift*.dylib".</li>
  <li><strong>OS-version incompatibility</strong> — a new iOS breaks an assumption in native launch code (see the iOS 26 worked example below).</li>
</ul>

<h4>CocoaPods errors (build-time)</h4>
<pre><code class="language-ruby"># 1) "Unable to find a specification for 'SomePod'"
pod repo update            # refresh the local spec repos
pod install --repo-update  # or force it inline

# 2) "CDN: trunk URL couldn't be downloaded / CDN transport error"
#    → network/CDN issue; retry, or switch source at top of Podfile:
# source 'https://github.com/CocoaPods/Specs.git'   # git repo instead of CDN

# 3) Version conflict: "Unable to satisfy the following requirements"
#    → two pods pin incompatible versions; relax a pin or bump the dep.

# 4) "The sandbox is not in sync with the Podfile.lock" /
#    build phase "[CP] Check Pods Manifest.lock" FAILS
#    → Podfile.lock and Pods/Manifest.lock diverged. Re-run:
pod install

# 5) Nuclear reset when Pods state is corrupt:
pod deintegrate            # remove Pods integration from the project
pod cache clean --all
rm -rf Pods Podfile.lock ~/Library/Developer/Xcode/DerivedData
pod install</code></pre>
<p>The <code>[CP] Check Pods Manifest.lock</code> build phase compares <code>Podfile.lock</code> (source of truth) with <code>Pods/Manifest.lock</code> (what is actually installed). They diverge when someone edits the Podfile or pulls new deps without re-running <code>pod install</code> — the fix is literally to run <code>pod install</code>.</p>

<h4>Build errors (compile/link-time)</h4>
<ul>
  <li><strong>"framework not found X"</strong> — Framework Search Paths (<code>FRAMEWORK_SEARCH_PATHS</code>) missing the path, or the pod did not build. Clean + <code>pod install</code>.</li>
  <li><strong>"Undefined symbol: _OBJC_CLASS_$_Foo" / "Undefined symbols for architecture arm64"</strong> — a library referenced but not linked (missing in "Link Binary With Libraries", or <code>OTHER_LDFLAGS</code> missing <code>-ObjC</code> / <code>-l</code> flag).</li>
  <li><strong>"duplicate symbol"</strong> — the same symbol linked twice (a pod vendored a lib you also link, or <code>-all_load</code>/<code>-ObjC</code> pulling duplicates). Remove the duplicate dependency.</li>
  <li><strong>Header search path issues</strong> — "'React/RCTBridge.h' file not found": <code>HEADER_SEARCH_PATHS</code> wrong, or you opened the <code>.xcodeproj</code> instead of the <code>.xcworkspace</code> (with CocoaPods you MUST open <code>.xcworkspace</code>).</li>
  <li><strong>EXCLUDED_ARCHS / arm64 simulator</strong> — on Apple Silicon, some pods without an arm64-simulator slice force <code>EXCLUDED_ARCHS[sdk=iphonesimulator*] = arm64</code> (older RN template). Newer builds prefer real fixes / XCFrameworks.</li>
  <li><strong>Swift version mismatch</strong> — "Module compiled with Swift X cannot be imported by Swift Y": align <code>SWIFT_VERSION</code> / update Xcode / update the pod.</li>
  <li><strong>C++ standard mismatch</strong> — RN/Folly need a specific <code>CLANG_CXX_LANGUAGE_STANDARD</code> (e.g. <code>c++17</code>/<code>c++20</code>); a pod compiled against a different one throws template/compile errors.</li>
</ul>

<h4>Code signing errors (build/archive/install-time)</h4>
<ul>
  <li><strong>"No profiles for 'com.app.id' were found"</strong> — no provisioning profile matches the bundle id/team. Fix: enable "Automatically manage signing" and select the Team, or install the correct profile.</li>
  <li><strong>"requires a provisioning profile"</strong> — a target (often a pod/extension) has no profile; set one or turn on automatic signing for it.</li>
  <li><strong>Certificate / entitlement mismatch</strong> — the app requests an entitlement (Push, App Groups, Keychain Sharing, Associated Domains) the profile does not include → "provisioning profile doesn't include the … entitlement". Regenerate the profile with the capability enabled.</li>
  <li><strong>Expired profile / revoked cert</strong> — "The provisioning profile has expired": regenerate on the Developer portal and re-download; delete stale ones from <code>~/Library/MobileDevice/Provisioning Profiles</code>.</li>
  <li><strong>"Failed to register bundle identifier"</strong> — the id is taken / not registered under your team.</li>
</ul>

<h4>App Store rejections that LOOK like crashes</h4>
<ul>
  <li><strong>Missing privacy usage strings</strong> — Guideline 5.1.1: the app accesses a protected resource without the matching <code>NS*UsageDescription</code>. On device this is a runtime SIGABRT; in review it is a rejection.</li>
  <li><strong>ATS (App Transport Security) violation</strong> — plaintext HTTP without an <code>NSAppTransportSecurity</code> exception; network calls fail (look like a "crash"/hang). Fix: use HTTPS or add a justified exception.</li>
  <li><strong>Missing privacy manifest</strong> — since 2024 Apple requires <code>PrivacyInfo.xcprivacy</code> declaring data collection + "required reason API" usage; missing/incomplete manifests trigger email warnings or rejection. Many RN libs now ship their own.</li>
</ul>

<h3>Worked example — sw-mobile launch crash on iOS 26 simulators</h3>
<p>A concrete "new OS breaks native launch; the fix spans several native files together" case. Prakhar's <strong>sw-mobile</strong> (Expo 53 / RN 0.79, old architecture / Paper, Hermes) crashed on launch on iOS 26 simulators. The fix was NOT one line — it was <strong>four coupled native patches</strong> that had to land together:</p>
<ol>
  <li><strong>Podfile</strong> — the pods/build settings needed to be adjusted for the new SDK.</li>
  <li><strong>AppDelegate.h</strong> — the header had to be brought in line with the new expected shape.</li>
  <li><strong>AppDelegate.mm</strong> — the implementation (the RN bootstrap / bridge setup) patched to launch correctly under iOS 26.</li>
  <li><strong>A <code>noop-file.swift</code></strong> — an empty Swift file added so the Swift runtime/bridging is embedded (a common trick to force the <code>libswift*.dylib</code> embedding a pure-ObjC target otherwise lacks).</li>
</ol>
<p>Debugging lesson from this case: the symptom was a launch-time crash (top-of-stack in the RN bootstrap, not in JS), it reproduced only on the new OS, and no <em>single</em> file change fixed it — you had to patch the Podfile, both AppDelegate files, and add the Swift shim as one coherent set. When a new iOS/Xcode breaks launch, expect the fix to span <strong>Podfile + AppDelegate.h + AppDelegate.mm + a Swift shim</strong> together, and change them as a unit.</p>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — these native files are generated</div>
  <p>In an Expo prebuild project, <code>ios/</code> (Podfile, AppDelegate.h/.mm) is produced by Continuous Native Generation. Hand-editing them to fix a launch crash works until the next <code>npx expo prebuild --clean</code> wipes <code>ios/</code>. The durable fix is a <strong>config plugin</strong> (or an <code>expo-build-properties</code> setting for Podfile-level values) so the patch is re-applied on every prebuild. Also run <code>npx expo-doctor</code> — it flags version mismatches that cause exactly these OS-launch breakages, and prefer bumping the Expo SDK where the fix has already been merged upstream.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — symbolicate one address with atos</h3>
<pre><code class="language-bash"># Report says: 4  MyApp  0x0000000104a3f2ac 0x104a30000 + 62124
#              (binary)  (runtime addr)     (load addr)
atos -o MyApp.app.dSYM/Contents/Resources/DWARF/MyApp -arch arm64 \\
     -l 0x104a30000 0x104a3f2ac
# → -[PaymentManager charge:] (PaymentManager.m:142)</code></pre>

<h3>Example 2 — read a SIGABRT "unrecognized selector"</h3>
<pre><code class="language-text">Exception Type:  EXC_CRASH (SIGABRT)
Last Exception Backtrace:
 2  CoreFoundation  -[NSObject(NSObject) doesNotRecognizeSelector:]
 3  CoreFoundation  ___forwarding___
 5  MyApp           -[ProfileVC didTapSave:]  ProfileVC.m:73  ← your frame
Console: -[__NSCFNumber length]: unrecognized selector sent to instance
Diagnosis: you called a String method on an NSNumber (wrong type at
run time). Set an Exception Breakpoint → it stops on line 73.</code></pre>

<h3>Example 3 — missing Info.plist usage description (runtime SIGABRT)</h3>
<pre><code class="language-text">*** Terminating app due to uncaught exception, reason:
'This app has crashed because it attempted to access privacy-sensitive
 data without a usage description. The app's Info.plist must contain an
 NSCameraUsageDescription key ...'</code></pre>
<pre><code class="language-xml">&lt;!-- ios/MyApp/Info.plist --&gt;
&lt;key&gt;NSCameraUsageDescription&lt;/key&gt;
&lt;string&gt;We use the camera to scan your meeting-room QR code.&lt;/string&gt;</code></pre>
<p>In Expo, you would not hand-edit Info.plist — you set <code>ios.infoPlist.NSCameraUsageDescription</code> in <code>app.json</code> (or the library's config-plugin prop) so prebuild writes it.</p>

<h3>Example 4 — EXC_BAD_ACCESS with Zombies</h3>
<pre><code class="language-text">Before: Exception Type: EXC_BAD_ACCESS (SIGSEGV) at 0x0000000000000010
After enabling Zombie Objects (Diagnostics):
  *** -[CALayer release]: message sent to deallocated instance 0x600001f...
Diagnosis: an over-released layer/delegate. The zombie names the exact
class + instance you messaged after it was freed.</code></pre>

<h3>Example 5 — EXC_BREAKPOINT from a nil force-unwrap</h3>
<pre><code class="language-swift">// Crashes with EXC_BREAKPOINT (SIGTRAP):
let token = keychain.read("auth")!     // nil when logged out
// Console: Fatal error: Unexpectedly found nil while unwrapping an Optional
// Fix: guard let token = keychain.read("auth") else { return }</code></pre>

<h3>Example 6 — dyld: Library not loaded at launch</h3>
<pre><code class="language-text">dyld: Library not loaded: @rpath/Stripe.framework/Stripe
  Referenced from: /.../MyApp.app/MyApp
  Reason: image not found
Fix: the framework isn't embedded. In Xcode → target → General →
"Frameworks, Libraries, and Embedded Content" set Stripe to
"Embed &amp; Sign", or ensure the pod uses dynamic-framework linkage.</code></pre>

<h3>Example 7 — Pods manifest out of sync</h3>
<pre><code class="language-text">error: The sandbox is not in sync with the Podfile.lock. Run 'pod install'
       or update your CocoaPods installation.
       ([CP] Check Pods Manifest.lock)
Fix: cd ios &amp;&amp; pod install   (Podfile.lock changed but Pods/ didn't)</code></pre>

<h3>Example 8 — Undefined symbol at link time</h3>
<pre><code class="language-text">Undefined symbols for architecture arm64:
  "_OBJC_CLASS_$_RNCameraModule", referenced from: ...
ld: symbol(s) not found for architecture arm64
Fixes to try: pod install (link the pod), add -ObjC to OTHER_LDFLAGS,
confirm the module is in "Link Binary With Libraries",
open the .xcworkspace (NOT .xcodeproj).</code></pre>

<h3>Example 9 — code signing "No profiles found"</h3>
<pre><code class="language-text">error: No profiles for 'tech.workctrl.smartworks' were found: Xcode couldn't
find any iOS App Development provisioning profiles matching ...
Fix: Signing &amp; Capabilities → enable "Automatically manage signing",
pick your Team; or install the matching .mobileprovision. For CI, use a
manual profile + the exact certificate in the keychain.</code></pre>

<h3>Example 10 — full atos loop over a report (CI-style)</h3>
<pre><code class="language-bash"># Symbolicate every address attributed to MyApp in a report
DSYM=MyApp.app.dSYM/Contents/Resources/DWARF/MyApp
LOAD=0x104a30000
grep 'MyApp  *0x' symbolicated-input.txt | awk '{print $3}' | while read A; do
  atos -o "$DSYM" -arch arm64 -l "$LOAD" "$A"
done</code></pre>

<h3>Example 11 — symbolicate a Hermes/JS release stack</h3>
<pre><code class="language-bash"># You captured a JS stack with bytecode offsets in production:
# at anonymous (address at unknown:1:12345)
npx metro-symbolicate ios/build/main.jsbundle.map &lt; prod-js-stack.txt
# → at submitBooking (src/screens/Booking.tsx:88:14)</code></pre>

<h3>Example 12 — watchdog kill at launch (0x8badf00d)</h3>
<pre><code class="language-text">Exception Type: EXC_CRASH (SIGKILL)
Termination Reason: Namespace ASSERTIOND, Code 0x8badf00d
Diagnosis: the app spent too long on the main thread at launch and the
watchdog killed it. Move heavy work (DB open, sync network, big JSON
parse) off the main thread / defer past didFinishLaunching.</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. Symbolication silently fails on a UUID mismatch</h3>
<p>If the dSYM's UUID does not match the crashing binary's UUID, tools produce a report that still shows hex (or wrong lines) with no error. Always verify with <code>dwarfdump --uuid</code> on both. Keep the dSYM from the <em>exact</em> archive you shipped — a rebuild changes the UUID.</p>

<h3>2. Bitcode-recompiled dSYMs</h3>
<p>If you uploaded with Bitcode, Apple recompiles your binary server-side, so your local dSYM no longer matches the store binary. Download the store dSYMs from App Store Connect (or Xcode Organizer → Download Debug Symbols) before symbolicating production crashes. (Apple has deprecated Bitcode, but legacy builds still hit this.)</p>

<h3>3. Simulator vs device architecture</h3>
<p>A crash reproduced only on device (arm64) may not reproduce on an arm64 simulator, and vice-versa. Some pods ship only device slices; some bugs are memory-layout-dependent. Note the <code>Hardware Model</code> and reproduce on matching hardware where possible.</p>

<h3>4. Release-only crashes (optimizer + assertions)</h3>
<p>Debug keeps assertions and disables optimization; Release strips <code>NSAssert</code> and optimizes aggressively. A bug hidden by an assert in Debug can surface only in Release — and inlining makes backtraces shallower. Test a Release build before shipping.</p>

<h3>5. The crash is in a background thread, not Thread 0</h3>
<p>"Triggered by Thread: 7" means the fatal frame is on thread 7, NOT the main thread shown first. Scroll to that thread's backtrace. Off-main UIKit calls are a classic culprit here.</p>

<h3>6. Last Exception Backtrace beats the thread backtrace for SIGABRT</h3>
<p>For an ObjC exception, the crashed-thread backtrace shows <code>abort</code> — not useful. The <code>Last Exception Backtrace</code> shows where the exception was thrown. Read that block first for any SIGABRT.</p>

<h3>7. Stale DerivedData masks or fabricates errors</h3>
<p>Phantom "file not found", stale generated headers, or a build that "shouldn't compile but does" often means a dirty <code>~/Library/Developer/Xcode/DerivedData</code>. Delete it (or Product → Clean Build Folder, Shift-Cmd-K) before trusting a build error.</p>

<h3>8. Opening .xcodeproj instead of .xcworkspace</h3>
<p>With CocoaPods you must open <code>MyApp.xcworkspace</code>. Opening <code>.xcodeproj</code> gives "'React/…' file not found" and undefined symbols because the Pods project is not included.</p>

<h3>9. Hermes vs JSC crash signatures differ</h3>
<p>A JS-engine-level abort under Hermes may surface as SIGABRT/SIGTRAP with <code>hermes::</code> frames; under JSC the frames differ. Know which engine you ship (Hermes is the RN default) so you read the right frames and upload the right source map.</p>

<h3>10. New-arch (Fabric/TurboModules/bridgeless) changes launch frames</h3>
<p>On the New Architecture the bootstrap goes through <code>RCTAppDelegate</code>/bridgeless TurboModule managers rather than the classic bridge. Launch-crash backtraces look different from Paper. sw-mobile is on OLD arch (Paper) — see the <code>rn-architecture</code> topic for the delta — so its launch frames go through the classic bridge.</p>

<h3>11. Watchdog (0x8badf00d) vs a real crash</h3>
<p>A SIGKILL with <code>0x8badf00d</code> is not a bug in your code path — it is "you were too slow on the main thread". Do not hunt for a null pointer; profile launch time and move work off the main thread.</p>

<h3>12. 0xdead10cc — killed for holding a lock while suspended</h3>
<p>Backgrounding while holding a SQLite/file lock (or a shared-container resource) gets you terminated with <code>0xdead10cc</code>. Release locks in <code>applicationDidEnterBackground</code> / finish writes with a background task.</p>

<h3>13. Third-party SDK frames with no symbols</h3>
<p>A crash deep inside a closed-source SDK shows only the SDK's public symbols (or none). You cannot symbolicate their internals — reproduce, capture the args you pass in, and file with the vendor. Your job is to prove your input is valid.</p>

<h3>14. dSYMs missing from an Expo/EAS artifact</h3>
<p>If EAS did not surface a dSYM (or the Sentry plugin was misconfigured), production native crashes stay unsymbolicated. Verify the upload happened for that exact build/version; re-upload with <code>sentry-cli debug-files upload</code> against the archived dSYM.</p>

<h3>15. Constraint warnings vs constraint crashes</h3>
<p>"Unable to simultaneously satisfy constraints" is usually a <em>warning</em> (the layout engine breaks one and continues). It becomes a crash only when code throws on the ambiguity or an assertion fires — do not assume every constraint log is your crash.</p>

<h3>16. Different crash on CI than locally</h3>
<p>CI uses a fixed Xcode/SDK/pod versions; your machine may drift. "Works on my machine" build errors are often a Ruby/CocoaPods/Xcode version gap. Pin versions (<code>.ruby-version</code>, <code>Gemfile</code> with a locked CocoaPods, an Xcode version selector) so CI and local match.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — debugging an unsymbolicated release stack</h3>
<p>Staring at hex addresses and guessing. Symbolicate first (dSYM + <code>atos</code>/Organizer); the file+line usually makes the bug obvious.</p>

<h3>Anti-pattern 2 — blaming the top-of-stack system frame</h3>
<p>Concluding the bug is in <code>objc_msgSend</code>/<code>abort</code>/UIKit. Walk DOWN to the first frame you own — that is your lead.</p>

<h3>Anti-pattern 3 — ignoring the Last Exception Backtrace on SIGABRT</h3>
<p>Reading only the crashed-thread backtrace (which shows <code>abort</code>) and missing the block that shows where the NSException was thrown.</p>

<h3>Anti-pattern 4 — not setting an Exception Breakpoint</h3>
<p>Trying to reproduce a SIGABRT by adding print statements. Add an <strong>All Exceptions</strong> breakpoint in Xcode's Breakpoint Navigator — it stops at the throw site, showing the offending call directly.</p>

<h3>Anti-pattern 5 — hand-editing ios/ in an Expo prebuild app</h3>
<p>Patching Podfile/Info.plist/AppDelegate directly; the next <code>expo prebuild --clean</code> wipes it and the crash returns. Encode the fix as a config plugin / <code>app.json</code> setting.</p>

<h3>Anti-pattern 6 — "just delete DerivedData and pods" without reading the error</h3>
<p>The nuke sometimes works, but blindly deintegrating every time hides the real cause (a version conflict, a bad pin). Read the error, then reset if it is genuinely a state problem.</p>

<h3>Anti-pattern 7 — shipping without uploading dSYMs (and source maps)</h3>
<p>Production crashes arrive unsymbolicated and useless. Wire dSYM + Hermes source-map upload into the build (Crashlytics/Sentry) keyed to app version + build number.</p>

<h3>Anti-pattern 8 — treating a store rejection as a code crash (or vice-versa)</h3>
<p>Chasing a "camera crash" that is actually a missing <code>NSCameraUsageDescription</code> (policy + runtime), or an ATS/privacy-manifest rejection. Read the reviewer note; it names the guideline.</p>

<h3>Anti-pattern 9 — force-unwrapping in Swift native code</h3>
<p><code>value!</code>, <code>try!</code>, <code>as!</code> turn a recoverable nil/mismatch into EXC_BREAKPOINT. Use <code>guard let</code> / <code>if let</code> / <code>try?</code>.</p>

<h3>Anti-pattern 10 — calling UIKit off the main thread</h3>
<p>Touching UIViews/CALayers from a background queue causes intermittent EXC_BAD_ACCESS / weird corruption. Dispatch UI work to the main queue.</p>

<h3>Anti-pattern 11 — heavy work in didFinishLaunching</h3>
<p>Synchronous DB open, network, or huge JSON parse at launch invites the <code>0x8badf00d</code> watchdog kill. Defer and background it.</p>

<h3>Anti-pattern 12 — not pinning CocoaPods / Ruby / Xcode versions</h3>
<p>Un-pinned toolchains give "works locally, fails on CI" build errors. Commit a <code>Gemfile</code> with a locked CocoaPods and a <code>.ruby-version</code>; select a fixed Xcode.</p>

<h3>Anti-pattern 13 — keeping a stale spec / manifest after a spec change</h3>
<p>Editing native module specs or the Podfile without re-running <code>pod install</code> → the <code>[CP] Check Pods Manifest.lock</code> phase fails or stale codegen headers mislead you.</p>

<h3>Anti-pattern 14 — over-releasing / retain-cycle-hiding via unsafe pointers</h3>
<p>Manual retain/release or <code>unsafe</code>/unowned references that dangle → EXC_BAD_ACCESS that is painful to trace. Turn on Zombies + ASan; prefer ARC-safe patterns.</p>

<h3>Anti-pattern 15 — assuming Debug behavior equals Release</h3>
<p>Shipping without ever running a Release/Archive build. Optimizer + stripped asserts surface release-only crashes you never saw in Debug.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. Walk me through debugging a production iOS crash in an RN app.</div>
  <div class="qa-answer">
    <p>Get the report (Xcode Organizer → Crashes, or Crashlytics/Sentry). Symbolicate it — native frames via the matching dSYM (UUID must match), JS/Hermes frames via the bundle source map. Read <strong>Exception Type / Exception Codes / Termination Reason</strong> to classify (SIGABRT = uncaught NSException, EXC_BAD_ACCESS = bad memory, EXC_BREAKPOINT = Swift trap, dyld = link/launch). Walk the backtrace down to the first frame I own. For SIGABRT, read the <em>Last Exception Backtrace</em>. Reproduce, isolate (clean DerivedData / reinstall pods / bisect), fix, and add a regression guard.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. What is symbolication and why is a dSYM needed?</div>
  <div class="qa-answer">
    <p>Release builds strip debug symbols into a separate dSYM bundle, so the crash report has only memory addresses. Symbolication maps each address back to function + file + line using the dSYM whose UUID matches the crashing binary. Tools: <code>atos</code> for a single address, <code>symbolicatecrash</code>/Xcode for a whole report, and server-side symbolication in Crashlytics/Sentry from uploaded dSYMs. The JS half uses a Hermes source map, not a dSYM.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. SIGABRT — what does it usually mean and how do you find the cause?</div>
  <div class="qa-answer">
    <p>An uncaught Objective-C <code>NSException</code> called <code>abort()</code>. Classic causes: "unrecognized selector sent to instance" (wrong type / renamed API), NSRange/invalid-argument (bad index, nil into a collection), an Auto Layout constraint exception, a KVO imbalance, or accessing a protected resource without the Info.plist usage description. To find it: read the <em>Last Exception Backtrace</em> and set an <strong>All Exceptions</strong> breakpoint so Xcode stops at the throw site.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. EXC_BAD_ACCESS — cause and tooling?</div>
  <div class="qa-answer">
    <p>Accessing freed / dangling / invalid memory — use-after-free or over-release. Hardest to trace because the crash is where you touch it, not where it was freed. Turn on <strong>Zombie Objects</strong> (it reports "message sent to deallocated instance" naming the class), <strong>Address Sanitizer</strong> for heap overflow / use-after-free, and Malloc Scribble/Guard Malloc to poison freed memory. Common with hand-written C++/JSI or an over-released delegate.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. EXC_BREAKPOINT / SIGTRAP without a debugger attached — why?</div>
  <div class="qa-answer">
    <p>Swift emits a trap instruction for logic failures: a nil force-unwrap (<code>x!</code>), <code>fatalError()</code>/<code>preconditionFailure()</code>, a forced <code>try!</code> that throws, a failed <code>as!</code> cast, or an out-of-range/overflow. The console shows "Fatal error: Unexpectedly found nil…". Hermes can also raise SIGTRAP on its abort path, so check whether the frame is Swift or the JS engine.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. App crashes at launch with "dyld: Library not loaded … image not found". Diagnose.</div>
  <div class="qa-answer">
    <p>A dynamic framework/dylib the binary needs was not embedded or linked. Fix embedding ("Embed &amp; Sign" for the framework, or the pod's dynamic-framework linkage / <code>use_frameworks!</code>), check <code>@rpath</code>, and confirm the Swift runtime is embedded for pure-ObjC targets (the "empty <code>noop-file.swift</code>" trick). Other launch-time causes: missing/renamed resource, bad Info.plist, an OS-version incompatibility.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. "The sandbox is not in sync with the Podfile.lock" — what and why?</div>
  <div class="qa-answer">
    <p>The <code>[CP] Check Pods Manifest.lock</code> build phase compares <code>Podfile.lock</code> (source of truth) with <code>Pods/Manifest.lock</code> (what is installed). They diverge when the Podfile changed or deps were pulled without re-running <code>pod install</code>. Fix: <code>cd ios &amp;&amp; pod install</code>. If Pods state is corrupt: <code>pod deintegrate</code>, delete <code>Pods</code> + <code>Podfile.lock</code> + DerivedData, then <code>pod install</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. "Undefined symbols for architecture arm64" at link time — how do you fix it?</div>
  <div class="qa-answer">
    <p>A referenced symbol was not linked. Check the library is in "Link Binary With Libraries", run <code>pod install</code>, add <code>-ObjC</code> (and any <code>-l</code>/<code>-framework</code> flags) to <code>OTHER_LDFLAGS</code>, and confirm you opened the <code>.xcworkspace</code>, not the <code>.xcodeproj</code>. "duplicate symbol" is the opposite — the same symbol linked twice; remove the duplicate dependency.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Common code-signing errors and their fixes?</div>
  <div class="qa-answer">
    <p>"No profiles found" / "requires a provisioning profile" → enable Automatic signing and pick the Team, or install the matching profile. Entitlement mismatch (Push/App Groups/Keychain) → regenerate the profile with the capability enabled. Expired profile / revoked cert → regenerate and re-download, delete stale <code>.mobileprovision</code> files. For CI, use a manual profile plus the exact certificate in the keychain.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Which "crashes" are actually App Store rejections?</div>
  <div class="qa-answer">
    <p>Missing <code>NS*UsageDescription</code> privacy strings (5.1.1 — a runtime SIGABRT on device, a rejection in review), ATS violations (plaintext HTTP without an <code>NSAppTransportSecurity</code> exception), and a missing/incomplete <strong>privacy manifest</strong> (<code>PrivacyInfo.xcprivacy</code> declaring data collection + required-reason APIs). They look like crashes/failures but are policy issues named in the reviewer note.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Tell me about a time a new iOS version broke your app's native launch.</div>
  <div class="qa-answer">
    <p>sw-mobile (Expo 53 / RN 0.79, old arch, Hermes) crashed on launch on iOS 26 simulators. The symptom was a launch-time crash topping out in the RN bootstrap (not JS), reproducing only on the new OS. No single line fixed it — the fix was <strong>four coupled native patches</strong>: the Podfile, AppDelegate.h, AppDelegate.mm, and an empty <code>noop-file.swift</code> (to force Swift-runtime embedding). Lesson: when a new OS/Xcode breaks launch, expect the fix to span the Podfile + both AppDelegate files + a Swift shim, applied as a unit — and in Expo, encode it as a config plugin so prebuild does not wipe it.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. A crash report shows EXC_CRASH (SIGKILL) with 0x8badf00d. What is it?</div>
  <div class="qa-answer">
    <p>The watchdog killed the app ("ate bad food") for spending too long on the main thread — usually a slow launch. It is not a null-pointer bug; profile launch and move heavy work (DB open, sync network, big JSON parse) off the main thread. Related: <code>0xdead10cc</code> = terminated for holding a file/DB lock while suspended.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. What lldb commands do you use during a native debug session?</div>
  <div class="qa-answer">
    <p><code>bt</code> (backtrace of the current thread), <code>bt all</code> (all threads), <code>po object</code> / <code>p expr</code> (print object / evaluate), <code>frame select N</code> + <code>frame variable</code> to inspect locals, and <code>image lookup --address 0x…</code> to symbolicate an address inline. I also add an <strong>All Exceptions</strong> breakpoint, and enable Zombie Objects / Malloc Stack in the scheme's Diagnostics for memory bugs.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Your iOS build works locally but fails on CI. How do you approach it?</div>
  <div class="qa-answer">
    <p>Almost always a toolchain drift: CocoaPods, Ruby, Xcode/SDK, or Node versions differ. Pin them (<code>Gemfile</code> with a locked CocoaPods, <code>.ruby-version</code>, a selected Xcode, an <code>.nvmrc</code>), commit the lockfiles, and make CI run the same <code>pod install</code>. Read the exact CI error before nuking DerivedData/pods — it usually names the mismatch.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. How do you debug a crash you cannot reproduce that only real users hit?</div>
  <div class="qa-answer">
    <p>Lean on aggregated crash reporting (Crashlytics/Sentry) with dSYMs + source maps uploaded, grouped by signature and app version. Add breadcrumbs / logs around the suspected path, correlate with device model / OS version (note the <code>Hardware Model</code>), and try a matching simulator/device. If it is a watchdog or lock kill (0x8badf00d / 0xdead10cc), profile instead of hunting a pointer. Ship a hypothesis-driven fix and watch the crash-free-users metric.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You symbolicate first (dSYM + <code>atos</code>) and know UUIDs must match.</li>
    <li>You classify by Exception Type before touching code.</li>
    <li>You read the Last Exception Backtrace for SIGABRT and set an exception breakpoint.</li>
    <li>You reach for Zombies / ASan on EXC_BAD_ACCESS.</li>
    <li>You separate build-time (pods, linker, signing) from launch-time (dyld) from runtime crashes.</li>
    <li>You recognize <code>0x8badf00d</code> as a watchdog kill, not a pointer bug.</li>
    <li>You know store rejections (privacy strings, ATS, privacy manifest) can masquerade as crashes.</li>
    <li>You upload dSYMs AND Hermes source maps for production symbolication, and handle the Expo/EAS specifics.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q16. Walk me through the blocks of an iOS crash report and what each one tells you.</div>
  <div class="qa-answer">
    <p>The header (Incident Identifier, Hardware Model, OS Version, Process) gives the environment. <strong>Exception Type</strong> (e.g. <code>EXC_CRASH (SIGABRT)</code>) is what killed the app and is how you classify it. <strong>Exception Codes</strong> carry the address or detail (e.g. <code>KERN_INVALID_ADDRESS</code> plus the faulting address, or leetspeak like <code>0x8badf00d</code>). <strong>Termination Reason</strong> says who killed it and why, and <strong>Triggered by Thread</strong> says which thread's backtrace to read; it may not be the main thread shown first. For SIGABRT, the <strong>Last Exception Backtrace</strong> shows where the NSException was thrown and is truer than the thread backtrace. The crashed-thread backtrace is the call stack at death: frame 0 is usually a system function, so walk down to the first frame you own. Finally, <strong>Binary Images</strong> lists each image's UUID and load address, which you need to symbolicate with the matching dSYM.</p>
  </div>
</div>
` },

  ]
});
