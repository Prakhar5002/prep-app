window.PREP_SITE.registerTopic({
  id: 'andr-tools',
  module: 'Android Native (Deep)',
  title: 'Tools: Studio, SDK, adb, logcat',
  estimatedReadTime: '24 min',
  tags: ['android-studio', 'sdk-manager', 'adb', 'logcat', 'emulator', 'avd', 'avdmanager', 'ndk', 'platform-tools', 'build-tools', 'cmdline-tools', 'sdkmanager', 'gradlew', 'android-home', 'dumpsys', 'bugreport', 'profiler', 'layout-inspector', 'apk-analyzer', 'hermes', 'expo', 'react-native'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>The Android toolchain is four layers, and as a React Native dev you touch all of them:</p>
<ul>
  <li><strong>Android Studio</strong> — the IntelliJ-based IDE. You open the <code>android/</code> folder in it to read/edit native Kotlin/Java, run Gradle Sync, and use its debug panels (Logcat, Device Manager, Layout Inspector, Profiler, APK Analyzer, SDK Manager).</li>
  <li><strong>Android SDK</strong> — the platforms, build-tools, and command-line tools on disk under <code>ANDROID_HOME</code>. Managed via <strong>SDK Manager</strong> (GUI) or <code>sdkmanager</code> (CLI); virtual devices via <strong>AVD Manager</strong> / <code>avdmanager</code>.</li>
  <li><strong>adb</strong> — the Android Debug Bridge, your daily CLI: install APKs, stream logs, port-forward Metro over USB, drive the shell.</li>
  <li><strong>Gradle</strong> — the build system (<code>./gradlew</code>), covered in depth in the Gradle topics; here it's the thing Studio and <code>expo run:android</code> invoke.</li>
</ul>
<p>For managed Expo apps you rarely OPEN Android Studio — <code>expo run:android</code> / Expo Dev Client drives it under the hood — but you use <code>adb</code> and <code>logcat</code> constantly to install builds, read native crashes, and reconnect test devices.</p>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Android Studio is the IDE, the SDK is the toolbox on disk under <code>ANDROID_HOME</code>, and <code>adb</code> is the wire to the device. Master <code>adb logcat</code> and you can debug 80% of native Android problems from the terminal without ever opening the IDE.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What each tool actually is</h3>
<ul>
  <li><strong>Android Studio</strong> — Google's official IDE, built on JetBrains IntelliJ IDEA. It bundles the Android Gradle Plugin, a Kotlin/Java editor, a device emulator, and a suite of inspectors. It is NOT the compiler — it orchestrates Gradle, which does the building.</li>
  <li><strong>Android SDK</strong> — a directory tree of everything needed to compile and run Android apps: API platforms (<code>android.jar</code> per API level), <code>build-tools</code> (aapt2, d8/r8, zipalign, apksigner), <code>platform-tools</code> (adb, fastboot), <code>cmdline-tools</code> (sdkmanager, avdmanager), the <code>emulator</code>, <code>system-images</code>, and optionally the <code>ndk</code>.</li>
  <li><strong>adb</strong> — a client/server CLI that talks to devices and emulators over USB or TCP/IP. It is the single most-used tool in a native mobile workflow.</li>
  <li><strong>logcat</strong> — the Android system-wide log buffer. Every process (yours, the OS, other apps) writes to it; you filter to find your app's output and crashes.</li>
</ul>

<h3>Why an RN dev must know these</h3>
<ul>
  <li><strong>Native crashes never show in the JS stack.</strong> A <code>java.lang.NullPointerException</code> or a native library <code>UnsatisfiedLinkError</code> only appears in <code>logcat</code> under the <code>AndroidRuntime</code> tag. If you only watch Metro, you're blind to half your bugs.</li>
  <li><strong>Metro-over-USB</strong> needs <code>adb reverse tcp:8081 tcp:8081</code>. Without understanding adb you can't explain why a physical device can't reach the packager.</li>
  <li><strong>Version mismatches</strong> (compileSdk, buildToolsVersion, ndkVersion) are resolved by knowing what the SDK Manager installed. RN upgrade pain is often "you don't have build-tools 34.0.0 installed."</li>
  <li><strong>Performance and UI bugs</strong> (jank, overdraw, memory leaks) are diagnosed with the Profiler and Layout Inspector on the native side.</li>
</ul>

<h3>How the pieces connect (RN + Expo reality)</h3>
<p>In a bare/prebuilt RN project, <code>npx react-native run-android</code> (or Expo's <code>expo run:android</code>) calls Gradle, which reads <code>ANDROID_HOME</code> to find the SDK, compiles with the pinned <code>buildToolsVersion</code>, links native code with the pinned <code>ndkVersion</code>, builds an APK, and hands it to <code>adb install</code> which pushes it to the device selected by <code>adb devices</code>. The Metro bundler serves JS on port 8081; the app reaches it via <code>adb reverse</code> (USB) or the LAN IP (Wi-Fi). Every arrow in that sentence is one of the tools in this topic.</p>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — you still need the SDK and adb</div>
  <p>Managed Expo hides the <code>android/</code> folder until you run <code>expo prebuild</code>, but it does NOT hide the toolchain. <code>expo run:android</code> still requires <code>ANDROID_HOME</code>, an installed platform + build-tools, and a device/emulator reachable by <code>adb</code>. <code>npx expo-doctor</code> checks your environment (SDK path, versions). You rarely open Android Studio for a managed app, but you live in <code>adb</code> and <code>logcat</code>.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The layered toolchain picture</h3>
<div class="diagram">
<pre>
 YOU / IDE            BUILD               SDK ON DISK ($ANDROID_HOME)      DEVICE
 ─────────            ─────               ──────────────────────────      ──────
 Android Studio ───► Gradle (AGP) ──────► build-tools/ (aapt2,d8,r8)  ──► APK
   or                (./gradlew)          platforms/android-34/            │
 expo run:android          │              ndk/  (C++ toolchain)           │
                           │              cmdline-tools/ (sdkmanager)      ▼
 Metro (JS, :8081) ────────┼───────────►  platform-tools/ adb  ──────────► app runs
                           │              emulator/ + system-images/       │
                           ▼                                               ▼
                        signs w/ apksigner                            logcat buffer
</pre>
</div>

<h3>The adb client / server / device model</h3>
<div class="diagram">
<pre>
 adb (CLI client)          adb server (host daemon, :5037)        adbd (on device)
 ────────────────          ───────────────────────────────        ────────────────
 adb devices  ───────────► started on first command ───────────► USB / TCP transport
 adb install app.apk        tracks all transports                 each phone/emulator
 adb logcat                 multiplexes commands  ───────────────► runs the command
 adb -s <serial> shell ───► routes to one device                  returns stream
</pre>
</div>
<p>Key idea: there is ONE adb server per host, listening on port 5037. Every <code>adb</code> command is a thin client to it. When two tools fight (Studio's bundled adb vs a Homebrew adb of a different version), you get "adb server version mismatch" — fix by using one adb everywhere (<code>adb kill-server</code> then let one own it).</p>

<h3>The SDK directory picture</h3>
<div class="diagram">
<pre>
 $ANDROID_HOME  (macOS default: ~/Library/Android/sdk)
 ├── platform-tools/      adb, fastboot            (one, latest)
 ├── platforms/
 │     └── android-34/    android.jar (compileSdk target)
 ├── build-tools/
 │     └── 34.0.0/        aapt2, d8, r8, zipalign, apksigner
 ├── cmdline-tools/
 │     └── latest/bin/    sdkmanager, avdmanager
 ├── emulator/            the emulator binary
 ├── system-images/
 │     └── android-34/google_apis/arm64-v8a/   (AVD boots from these)
 └── ndk/
       └── 26.1.10909125/  clang, C++ stdlib, headers  (RN native code)
</pre>
</div>

<div class="callout info">
  <div class="callout-title">The two env vars</div>
  <p><code>ANDROID_HOME</code> is the modern name; <code>ANDROID_SDK_ROOT</code> is the older/deprecated alias. Set both to the same path for maximum tool compatibility. Gradle also reads <code>sdk.dir</code> from <code>android/local.properties</code>, which takes precedence for that project — a frequent "works in terminal, fails in Studio" cause when the two disagree.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Android Studio — the panels you actually use</h3>
<p>You open <strong>the <code>android/</code> folder</strong> (not the repo root) in Android Studio so it recognizes the Gradle project. On open it runs <strong>Gradle Sync</strong> — reading <code>build.gradle</code> / <code>settings.gradle</code> to build the project model and download dependencies. Nothing works until sync succeeds.</p>
<table>
  <thead><tr><th>Panel / tool window</th><th>What it's for</th></tr></thead>
  <tbody>
    <tr><td><strong>Project</strong> view (Android vs Project view toggle)</td><td>Browse modules (<code>:app</code>), source sets, and generated files. "Android" view groups logically; "Project" view shows the raw tree.</td></tr>
    <tr><td><strong>Build</strong> / <strong>Build Output</strong></td><td>Gradle task output, compile errors, AGP warnings.</td></tr>
    <tr><td><strong>Logcat</strong></td><td>Live device logs with filtering by process, tag, level. Your primary debug window.</td></tr>
    <tr><td><strong>Device Manager</strong></td><td>Create/launch AVDs (emulators); see connected physical devices.</td></tr>
    <tr><td><strong>Gradle</strong> tool window</td><td>Tree of all Gradle tasks you can run with a double-click (assembleDebug, clean, etc.).</td></tr>
    <tr><td><strong>App Inspection</strong></td><td>Database Inspector, Background Task Inspector, Network Inspector for a running app.</td></tr>
    <tr><td><strong>Layout Inspector</strong></td><td>Live view hierarchy of the running UI — 3D exploded view, attributes, overdraw.</td></tr>
    <tr><td><strong>Profiler</strong></td><td>CPU, Memory (heap dumps, allocations), Energy, Network timelines.</td></tr>
    <tr><td><strong>APK Analyzer</strong> (Build ▸ Analyze APK)</td><td>Open any .apk/.aab and see size breakdown by dex, resources, native libs.</td></tr>
    <tr><td><strong>SDK Manager</strong></td><td>Install/remove platforms, build-tools, NDK, system images, accept licenses.</td></tr>
    <tr><td><strong>Device Explorer</strong> (Device File Explorer)</td><td>Browse the device filesystem; pull/push files from a GUI.</td></tr>
  </tbody>
</table>
<p>When Gradle Sync or the build is stuck on stale state, <strong>File ▸ Invalidate Caches / Restart</strong> clears IntelliJ's index and caches.</p>

<h3>Android SDK — installing pieces from the CLI</h3>
<pre><code class="language-bash"># list installed + available packages
sdkmanager --list

# install a platform, build-tools, platform-tools, and an NDK
sdkmanager "platforms;android-34" "build-tools;34.0.0" "platform-tools" "ndk;26.1.10909125"

# install a system image for an emulator
sdkmanager "system-images;android-34;google_apis;arm64-v8a"

# accept ALL SDK licenses non-interactively (CI-friendly)
yes | sdkmanager --licenses

# update everything installed
sdkmanager --update</code></pre>
<p>On a fresh machine you first install <code>cmdline-tools;latest</code>, and put <code>$ANDROID_HOME/cmdline-tools/latest/bin</code> and <code>$ANDROID_HOME/platform-tools</code> on your PATH so <code>sdkmanager</code> and <code>adb</code> resolve.</p>

<h3>AVD Manager — creating emulators from the CLI</h3>
<pre><code class="language-bash"># create an AVD from an installed system image
avdmanager create avd -n Pixel7_API34 \
  -k "system-images;android-34;google_apis;arm64-v8a" -d pixel_7

# list AVDs and boot one headlessly / with options
avdmanager list avd
emulator -list-avds
emulator -avd Pixel7_API34 -no-snapshot -gpu host</code></pre>

<h3>NDK — what it is and why RN needs it</h3>
<p>The <strong>NDK (Native Development Kit)</strong> is the C/C++ toolchain (a bundled clang, the C++ standard library, headers, and CMake glue) for building native <code>.so</code> libraries. React Native needs it because the RN core (JSI, the C++ TurboModule/Fabric layers, the Hermes engine) and libraries like Reanimated compile C++. The version is pinned so everyone builds identically:</p>
<pre><code class="language-groovy">// android/build.gradle (project-level)
buildscript {
  ext {
    buildToolsVersion = "34.0.0"
    minSdkVersion = 24
    compileSdkVersion = 34
    targetSdkVersion = 34
    ndkVersion = "26.1.10909125"
  }
}</code></pre>

<h3>adb — the command reference you actually use</h3>
<pre><code class="language-bash"># which devices/emulators are connected (starts the server if needed)
adb devices -l

# install / reinstall keeping data (-r) / downgrade (-d)
adb install app-debug.apk
adb install -r app-debug.apk
adb uninstall com.myapp

# THE React Native one: let a USB device reach Metro on 8081
adb reverse tcp:8081 tcp:8081

# connect a device over Wi-Fi (after enabling adb tcpip 5555)
adb connect 10.12.70.142:5555

# open a shell; run package manager / activity manager
adb shell
adb shell pm list packages | grep myapp
adb shell pm clear com.myapp                 # wipe app data
adb shell am start -n com.myapp/.MainActivity # launch an activity
adb shell am force-stop com.myapp

# move files
adb pull /sdcard/Download/log.txt ./log.txt
adb push ./config.json /sdcard/Download/

# system state + full diagnostic bundle
adb shell dumpsys activity activities
adb shell dumpsys meminfo com.myapp
adb bugreport ./bugreport.zip

# target a specific device when several are attached
adb -s emulator-5554 shell
adb -s 10.12.70.142:5555 install app-debug.apk</code></pre>

<div class="callout note">
  <div class="callout-title">Wi-Fi adb, the two-step setup</div>
  <p>With the device on USB first: <code>adb tcpip 5555</code> restarts adbd in TCP mode, then <code>adb connect 10.12.70.142:5555</code> attaches over the LAN — after which you can unplug USB. Android 11+ also offers "Wireless debugging" with a pairing code (<code>adb pair host:port</code>). The device IP can change on DHCP, so reconnecting sometimes means re-checking the IP under Settings ▸ Wi-Fi.</p>
</div>

<h3>logcat — reading the log buffer</h3>
<pre><code class="language-bash"># raw stream (very noisy)
adb logcat

# clear the buffer first, then watch — great before reproducing a bug
adb logcat -c &amp;&amp; adb logcat

# only your app's process (needs the pid)
adb logcat --pid=$(adb shell pidof -s com.myapp)

# only errors and fatals, any tag  (PRIORITY: V D I W E F S)
adb logcat *:E

# a specific tag at Debug+, silence everything else
adb logcat ReactNativeJS:D *:S

# the two tags RN devs care about most
adb logcat ReactNativeJS:V AndroidRuntime:E *:S

# choose an output format
adb logcat -v time      # timestamps
adb logcat -v threadtime # pid+tid+timestamp (default-ish, most useful)
adb logcat -v brief</code></pre>
<table>
  <thead><tr><th>Tag</th><th>What appears there</th></tr></thead>
  <tbody>
    <tr><td><code>ReactNativeJS</code></td><td>Everything from JS <code>console.log</code>/<code>warn</code>/<code>error</code> and the RN redbox message text.</td></tr>
    <tr><td><code>AndroidRuntime</code></td><td>Uncaught native (Java/Kotlin) exceptions — the "FATAL EXCEPTION" crash stack.</td></tr>
    <tr><td><code>ReactNative</code></td><td>Native RN infra logs (bridge/TurboModule setup, module registration).</td></tr>
    <tr><td><code>System.err</code>, <code>DEBUG</code></td><td>stderr output and native (libc) tombstone / signal crashes (SIGSEGV).</td></tr>
  </tbody>
</table>

<h3>Log levels</h3>
<p>Every logcat line has a single-letter priority: <strong>V</strong>erbose &lt; <strong>D</strong>ebug &lt; <strong>I</strong>nfo &lt; <strong>W</strong>arn &lt; <strong>E</strong>rror &lt; <strong>F</strong>atal (and <strong>S</strong>ilent, used only in filters to mute a tag). A filter <code>TAG:LEVEL</code> shows that tag at that level and above; <code>*:S</code> silences all other tags.</p>

<h3>Gradle tasks recap (the wrapper Studio calls)</h3>
<pre><code class="language-bash">cd android

./gradlew tasks                 # list available tasks
./gradlew assembleDebug         # build the debug APK
./gradlew installDebug          # build + adb install to device
./gradlew clean                 # delete build/ outputs
./gradlew :app:dependencies     # print the dependency tree
./gradlew assembleRelease       # signed release build (needs signing config)</code></pre>
<p>When builds go weird, escalate: delete <code>android/app/build</code> and <code>android/build</code>, delete the project <code>.gradle</code> and (last resort) <code>~/.gradle/caches</code>, then in Studio <strong>Invalidate Caches / Restart</strong>.</p>

<h3>Emulator vs physical device, and acceleration</h3>
<ul>
  <li><strong>System image ABI</strong> — pick <code>arm64-v8a</code> images on Apple Silicon (M-series) and <code>x86_64</code> on Intel. A mismatched ABI runs under slow emulation or fails to boot.</li>
  <li><strong>Hardware acceleration</strong> — historically HAXM on Intel macOS; now AEHD / the platform hypervisor. On Apple Silicon the emulator uses the ARM images natively, no HAXM. Without acceleration the emulator is unusably slow.</li>
  <li><strong>Cold boot vs snapshot</strong> — the emulator saves a snapshot on quit and restores it on next launch (fast). <code>-no-snapshot</code> forces a clean cold boot when state is corrupt.</li>
  <li><strong>Writable system</strong> — <code>emulator -writable-system</code> lets you remount <code>/system</code> as read-write (e.g., to install a CA cert for HTTPS proxying) which a normal boot forbids.</li>
  <li><strong>Physical device</strong> needs Developer Options + USB debugging enabled; the first connection shows an RSA fingerprint prompt you must accept.</li>
</ul>

<h3>Profiler, Layout Inspector, APK Analyzer</h3>
<ul>
  <li><strong>Profiler</strong> (View ▸ Tool Windows ▸ Profiler): record a <strong>CPU</strong> trace to find hot native methods and jank; capture a <strong>Memory</strong> heap dump to hunt leaks (retained Activities, growing bitmaps); watch <strong>Energy</strong> and <strong>Network</strong>. For RN, the JS thread work won't show meaningfully — use it for native/UI-thread and memory issues, and use Hermes/Flipper/React DevTools for JS profiling.</li>
  <li><strong>Layout Inspector</strong>: freeze and inspect the live view tree, spot deep nesting, wrong constraints, and overdraw. RN renders to real Android <code>View</code>s (or Fabric-managed views), so your JSX shows up here as a native hierarchy.</li>
  <li><strong>APK Analyzer</strong>: open the built <code>.apk</code>/<code>.aab</code> to see the size contribution of <code>classes.dex</code>, resources, and <code>lib/</code> native <code>.so</code> files (Hermes bytecode, JSC, Reanimated). The quickest way to answer "why is my APK 60MB?"</li>
</ul>

<div class="callout warn">
  <div class="callout-title">🧩 Expo note — the tools under the hood</div>
  <p><code>expo run:android</code> runs prebuild (if needed), then the same Gradle + adb pipeline. <code>expo-build-properties</code> (a config plugin in <code>app.json</code>/<code>app.config.js</code>) is how you set <code>compileSdkVersion</code>, <code>targetSdkVersion</code>, <code>ndkVersion</code>, etc. WITHOUT hand-editing <code>android/build.gradle</code> — because <code>expo prebuild --clean</code> regenerates the native folder and wipes manual edits. <code>npx expo-doctor</code> validates the SDK/toolchain setup. EAS Build runs all of this on a cloud machine, but locally you still need the SDK + adb.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — first-run environment setup (macOS)</h3>
<pre><code class="language-bash"># ~/.zshrc
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$PATH:$ANDROID_HOME/platform-tools"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin"
export PATH="$PATH:$ANDROID_HOME/emulator"

# verify
adb --version
sdkmanager --version
avdmanager list avd</code></pre>

<h3>Example 2 — run a bare/prebuilt RN app on a USB device</h3>
<pre><code class="language-bash">adb devices -l                     # confirm the phone is listed
adb reverse tcp:8081 tcp:8081      # so the app can reach Metro
npx react-native run-android       # builds + installs + launches
# or, Expo:
npx expo run:android</code></pre>

<h3>Example 3 — reconnect a Wi-Fi test phone (Prakhar's daily)</h3>
<pre><code class="language-bash"># phone already put in tcpip mode earlier; just reattach
adb connect 10.12.70.142:5555
adb devices               # should show 10.12.70.142:5555   device
adb -s 10.12.70.142:5555 reverse tcp:8081 tcp:8081</code></pre>

<h3>Example 4 — watch only this app's logs, cleanly</h3>
<pre><code class="language-bash">adb logcat -c                                   # clear old noise
adb logcat --pid=$(adb shell pidof -s com.smartworks.mobile) -v threadtime</code></pre>

<h3>Example 5 — catch a native crash</h3>
<pre><code class="language-text">adb logcat AndroidRuntime:E *:S

--------- beginning of crash
E AndroidRuntime: FATAL EXCEPTION: main
E AndroidRuntime: Process: com.smartworks.mobile, PID: 12874
E AndroidRuntime: java.lang.ClassCastException: java.lang.Boolean cannot be cast to ...
E AndroidRuntime:   at com.jailmonkey.JailMonkeyModule.getConstants(...)
E AndroidRuntime:   at com.facebook.react....</code></pre>
<p>This is exactly the shape of the jail-monkey launch crash — the JS side shows nothing; only <code>AndroidRuntime:E</code> reveals the ClassCastException in <code>getConstants()</code>.</p>

<h3>Example 6 — read a JS console.log / redbox from native side</h3>
<pre><code class="language-bash">adb logcat ReactNativeJS:V *:S
# I ReactNativeJS: Running "SmartWorks" with {...}
# E ReactNativeJS: TypeError: undefined is not an object (evaluating 'user.name')</code></pre>

<h3>Example 7 — install the exact build tools an RN upgrade needs</h3>
<pre><code class="language-bash">sdkmanager "platforms;android-34" "build-tools;34.0.0"
yes | sdkmanager --licenses     # unblocks "You have not accepted the license"</code></pre>

<h3>Example 8 — create and boot an emulator entirely from CLI</h3>
<pre><code class="language-bash">sdkmanager "system-images;android-34;google_apis;arm64-v8a"
avdmanager create avd -n Pixel7_API34 \
  -k "system-images;android-34;google_apis;arm64-v8a" -d pixel_7
emulator -avd Pixel7_API34 -no-snapshot-load</code></pre>

<h3>Example 9 — clear app state to reproduce a first-launch bug</h3>
<pre><code class="language-bash">adb shell pm clear com.smartworks.mobile   # wipes prefs, DB, MMKV, caches
adb shell am start -n com.smartworks.mobile/.MainActivity</code></pre>

<h3>Example 10 — inspect APK size after a build</h3>
<pre><code class="language-bash">cd android &amp;&amp; ./gradlew assembleRelease
# then Android Studio ▸ Build ▸ Analyze APK ▸ open app-release.apk
# see: classes.dex size, lib/arm64-v8a/libhermes.so, resources</code></pre>

<h3>Example 11 — pull a database / file off the device</h3>
<pre><code class="language-bash"># run-as works for debuggable apps without root
adb shell run-as com.smartworks.mobile ls databases/
adb exec-out run-as com.smartworks.mobile cat databases/app.db &gt; app.db</code></pre>

<h3>Example 12 — grab a full diagnostic bundle for a hard bug</h3>
<pre><code class="language-bash">adb bugreport ./mrt-crash-bugreport.zip
adb shell dumpsys meminfo com.smartworks.mobile   # memory snapshot
adb shell dumpsys gfxinfo com.smartworks.mobile   # frame render times (jank)</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. adb server version mismatch</h3>
<p>Two adb binaries of different versions (Studio's bundled one and a Homebrew/standalone one) fight over port 5037. Symptom: "adb server version (NN) doesn't match this client." Fix: use ONE adb everywhere (put <code>$ANDROID_HOME/platform-tools</code> first on PATH), then <code>adb kill-server &amp;&amp; adb start-server</code>.</p>

<h3>2. "device unauthorized"</h3>
<p><code>adb devices</code> shows <code>unauthorized</code> until you accept the RSA fingerprint dialog on the phone. If it never appears: revoke USB debugging authorizations in Developer Options, replug, re-accept. Headless/kiosk devices (FR Kiosk) may need "Always allow from this computer" checked.</p>

<h3>3. Metro unreachable on a physical device</h3>
<p>Red screen "Could not connect to development server." On USB you forgot <code>adb reverse tcp:8081 tcp:8081</code>; on Wi-Fi the device isn't on the same subnet as your Mac, or a firewall blocks 8081. <code>adb reverse</code> is per-connection — reconnecting the cable drops it.</p>

<h3>4. Licenses not accepted</h3>
<p>Gradle fails with "You have not accepted the license agreements of the following SDK components." Run <code>yes | sdkmanager --licenses</code>. CI needs the license hashes committed or this step scripted.</p>

<h3>5. Wrong system-image ABI</h3>
<p>On Apple Silicon, an <code>x86_64</code> system image boots painfully slowly or not at all; use <code>arm64-v8a</code>. Conversely some closed-source native libs ship only x86_64/arm64 for real devices, so an emulator ABI without that lib gives <code>UnsatisfiedLinkError</code>.</p>

<h3>6. logcat is truncated / rolls too fast</h3>
<p>The ring buffer overwrites old lines. Increase it: <code>adb logcat -G 16M</code>. Or filter aggressively (<code>--pid</code>, <code>*:S</code>) so the signal isn't lost. Use <code>adb logcat -d</code> to dump-and-exit (snapshot) instead of streaming.</p>

<h3>7. ndkVersion mismatch</h3>
<p>"No version of NDK matched the requested version" — the pinned <code>ndkVersion</code> isn't installed. Install exactly that one: <code>sdkmanager "ndk;26.1.10909125"</code>. Two RN libs demanding different NDKs is a real upgrade headache.</p>

<h3>8. local.properties vs ANDROID_HOME</h3>
<p><code>android/local.properties</code> pins <code>sdk.dir</code> for that project and OVERRIDES <code>ANDROID_HOME</code>. After migrating machines (M4 Pro), a stale <code>sdk.dir</code> path is a classic "builds in terminal, fails in Studio" cause. It's git-ignored — regenerate it.</p>

<h3>9. Emulator won't cold boot</h3>
<p>A corrupt snapshot hangs at the boot logo. <code>emulator -avd NAME -no-snapshot-load</code> (ignore saved state) or <code>-wipe-data</code> (factory reset the AVD). Persistent failure: delete and recreate the AVD.</p>

<h3>10. Multiple devices attached</h3>
<p>Plain <code>adb</code> commands error "more than one device/emulator." Always specify with <code>-s &lt;serial&gt;</code> (from <code>adb devices</code>), or set <code>ANDROID_SERIAL</code> in the env.</p>

<h3>11. pm clear also wipes MMKV and Keychain-equivalents</h3>
<p><code>adb shell pm clear</code> deletes ALL app data — MMKV stores, EncryptedSharedPreferences, SQLite DBs, cached tokens. Great for first-launch testing, but you'll be logged out and any local dev flags reset.</p>

<h3>12. reverse vs forward direction confusion</h3>
<p><code>adb reverse</code> maps a DEVICE port to a HOST port (device reaches your Mac's Metro) — this is the RN one. <code>adb forward</code> maps a HOST port to a DEVICE port (your Mac reaches something on the device, e.g., a debugger). Mixing them up means Metro still can't connect.</p>

<h3>13. Studio uses a different JDK than your terminal</h3>
<p>Android Studio ships its own embedded JDK (JetBrains Runtime) and may build with a different Java version than your shell's <code>JAVA_HOME</code>. AGP version errors that appear only in one place are often this. Point both at the same JDK (Studio ▸ Settings ▸ Gradle JDK).</p>

<h3>14. dumpsys output is huge</h3>
<p><code>adb shell dumpsys</code> with no argument dumps every system service (megabytes). Always scope it: <code>dumpsys activity</code>, <code>dumpsys meminfo &lt;pkg&gt;</code>, <code>dumpsys package &lt;pkg&gt;</code>, <code>dumpsys gfxinfo &lt;pkg&gt;</code>.</p>

<h3>15. Hermes bytecode isn't human-readable in logcat</h3>
<p>A Hermes engine crash may log an address, not a JS line. You need source maps (<code>compose-source-maps</code>) and symbolication (Sentry with the Hermes bundle uploaded) to map back to JS. Plain logcat won't give you the JS frame.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — debugging RN with only Metro open</h3>
<p>Native crashes (<code>AndroidRuntime</code>), <code>UnsatisfiedLinkError</code>, ANRs, and libc SIGSEGV tombstones NEVER reach the Metro console. Keep an <code>adb logcat</code> running alongside Metro at all times.</p>

<h3>Anti-pattern 2 — reading raw unfiltered logcat</h3>
<p>Staring at <code>adb logcat</code> firehose and missing your line in thousands of OS logs. Always filter: <code>--pid</code>, <code>*:E</code>, or a tag list ending in <code>*:S</code>.</p>

<h3>Anti-pattern 3 — hand-editing android/ in a managed Expo app</h3>
<p>Editing <code>android/build.gradle</code> to bump <code>compileSdkVersion</code>, then losing it on the next <code>expo prebuild --clean</code>. Use <code>expo-build-properties</code> in <code>app.json</code> instead so the change is regenerated every time.</p>

<h3>Anti-pattern 4 — forgetting adb reverse after replugging</h3>
<p><code>adb reverse</code> is per-connection. Unplug/replug USB and the packager becomes unreachable again. Re-run it (many teams add it to a run script).</p>

<h3>Anti-pattern 5 — two adb versions on PATH</h3>
<p>Brew-installed adb + Studio's bundled adb of different versions → constant "server version mismatch" and flaky device lists. Pick one, remove the other from PATH.</p>

<h3>Anti-pattern 6 — installing the whole SDK "to be safe"</h3>
<p>Grabbing every platform and system image bloats the SDK to tens of GB and slows sdkmanager. Install only the API levels + build-tools your projects pin.</p>

<h3>Anti-pattern 7 — committing local.properties</h3>
<p><code>sdk.dir</code> is machine-specific. Committing it breaks every teammate whose SDK lives elsewhere. It belongs in <code>.gitignore</code>.</p>

<h3>Anti-pattern 8 — using pm clear when you meant to just restart</h3>
<p><code>pm clear</code> nukes all app data; you only wanted a fresh launch. Use <code>am force-stop</code> + <code>am start</code> to restart without wiping storage.</p>

<h3>Anti-pattern 9 — ignoring the emulator ABI</h3>
<p>Running an x86_64 image on Apple Silicon and blaming "React Native is slow." The emulator is the bottleneck; use an arm64-v8a image.</p>

<h3>Anti-pattern 10 — building release without checking APK Analyzer</h3>
<p>Shipping a bloated APK because a stray asset, both Hermes AND JSC, or unstripped native libs snuck in. Analyze APK before every release to catch size regressions.</p>

<h3>Anti-pattern 11 — Profiler on the JS thread expecting JS insight</h3>
<p>Android Studio's CPU Profiler shows native/Java threads well but won't meaningfully profile Hermes JS work. Use React DevTools Profiler / Hermes sampling profiler for JS; use Studio's Profiler for native and memory.</p>

<h3>Anti-pattern 12 — never clearing the log buffer before repro</h3>
<p>Reproducing a bug then scrolling up through stale logs. Always <code>adb logcat -c</code> immediately before the repro so the crash is at the top.</p>

<h3>Anti-pattern 13 — skipping expo-doctor after an upgrade</h3>
<p>Chasing a cryptic Gradle failure that <code>npx expo-doctor</code> would have named (wrong SDK path, mismatched package versions, missing NDK).</p>

<h3>Anti-pattern 14 — leaving Invalidate Caches as a first resort</h3>
<p>Nuking caches for every hiccup wastes 5-minute re-index cycles. Try Gradle Sync, then <code>./gradlew clean</code>, THEN invalidate caches — escalate, don't start there.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. What is Android Studio and do you need it for React Native?</div>
  <div class="qa-answer">
    <p>Android Studio is Google's official IDE, built on IntelliJ IDEA; it bundles the Android Gradle Plugin, an emulator, and debugging tools (Logcat, Profiler, Layout Inspector, APK Analyzer, SDK/AVD Manager). For a managed Expo app you rarely open it — <code>expo run:android</code> drives Gradle and adb under the hood — but you still need the Android SDK it manages, and you use <code>adb</code> + <code>logcat</code> constantly. You open the <code>android/</code> folder in Studio when you need to read/debug native Kotlin/Java or use the visual profilers.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. What lives under ANDROID_HOME?</div>
  <div class="qa-answer">
    <p><code>platform-tools</code> (adb, fastboot), <code>platforms/android-XX</code> (the <code>android.jar</code> per API level = compileSdk), <code>build-tools/NN.N.N</code> (aapt2, d8/r8, zipalign, apksigner), <code>cmdline-tools/latest</code> (sdkmanager, avdmanager), <code>emulator</code>, <code>system-images</code> (what AVDs boot from), and optionally <code>ndk</code>. <code>ANDROID_HOME</code> is the modern env var; <code>ANDROID_SDK_ROOT</code> is the deprecated alias — set both the same.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Explain the adb client/server/device model.</div>
  <div class="qa-answer">
    <p>There's one adb server per host on port 5037. Each <code>adb</code> CLI invocation is a client to it; the server tracks all transports (USB and TCP devices) and multiplexes commands to <code>adbd</code> running on each device/emulator. If two adb binaries of different versions try to own 5037 you get "server version mismatch" — the fix is to standardize on one adb.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. A physical device shows "Could not connect to development server." What's wrong?</div>
  <div class="qa-answer">
    <p>The app can't reach Metro on port 8081. On USB you need <code>adb reverse tcp:8081 tcp:8081</code>, which maps the device's 8081 to your host's Metro; it's per-connection, so replugging drops it. On Wi-Fi the device must be on the same subnet and no firewall may block 8081. Confirm the device is listed in <code>adb devices</code> first.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Where do you look for a native crash vs a JS error?</div>
  <div class="qa-answer">
    <p>JS errors and <code>console.log</code> appear under the <code>ReactNativeJS</code> tag (and in Metro). Uncaught native Java/Kotlin exceptions appear under <code>AndroidRuntime</code> as "FATAL EXCEPTION" with a full stack. Native C/C++ (libc) crashes like SIGSEGV appear as tombstones under <code>DEBUG</code>. So: <code>adb logcat AndroidRuntime:E *:S</code> for native crashes, <code>ReactNativeJS:V *:S</code> for JS.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. What are the logcat priority levels and how do filters work?</div>
  <div class="qa-answer">
    <p>V(erbose), D(ebug), I(nfo), W(arn), E(rror), F(atal), plus S(ilent) used only in filters. A filter is <code>TAG:LEVEL</code> and matches that level and higher; <code>*:E</code> means all tags at Error+, and <code>*:S</code> silences all other tags. So <code>adb logcat ReactNativeJS:D *:S</code> shows only that tag at Debug and above.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. What is the NDK and why does React Native need it?</div>
  <div class="qa-answer">
    <p>The NDK (Native Development Kit) is the C/C++ toolchain — a bundled clang, the C++ standard library, headers, CMake glue — for building native <code>.so</code> libraries. RN needs it because its core (JSI, the C++ TurboModule/Fabric layers, the Hermes engine) and libs like Reanimated compile C++. The version is pinned via <code>ndkVersion</code> in <code>android/build.gradle</code> so all builds are reproducible.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How do you set up an emulator without the GUI?</div>
  <div class="qa-answer">
    <p><code>sdkmanager "system-images;android-34;google_apis;arm64-v8a"</code> to get the image, <code>avdmanager create avd -n NAME -k "&lt;image&gt;" -d pixel_7</code> to create the AVD, then <code>emulator -avd NAME</code> to boot. Pick an arm64-v8a image on Apple Silicon for hardware-accelerated speed; x86_64 images run painfully slow there.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Difference between adb reverse and adb forward?</div>
  <div class="qa-answer">
    <p><code>adb reverse tcp:8081 tcp:8081</code> maps a DEVICE port back to a HOST port — the device reaches your Mac's Metro; this is the RN one. <code>adb forward</code> maps a HOST port to a DEVICE port — your Mac reaches a server running on the device (e.g., a debug socket). RN dev needs reverse.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. How do you connect a device over Wi-Fi?</div>
  <div class="qa-answer">
    <p>With the device on USB, run <code>adb tcpip 5555</code> to restart adbd in TCP mode, then <code>adb connect &lt;ip&gt;:5555</code> and unplug. Android 11+ also has Wireless debugging with a pairing code (<code>adb pair host:port</code>). The DHCP IP can change, so reconnecting sometimes means re-reading the IP under Wi-Fi settings.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Your app builds in the terminal but fails in Android Studio (or vice versa). Where do you look?</div>
  <div class="qa-answer">
    <p>Two likely causes: (1) <code>android/local.properties</code> pins <code>sdk.dir</code> which overrides <code>ANDROID_HOME</code> — a stale path after a machine migration breaks one path; (2) Studio uses its embedded JetBrains Runtime JDK while the terminal uses a different <code>JAVA_HOME</code>. Align the SDK path and the Gradle JDK.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. How do you diagnose why an APK is too large?</div>
  <div class="qa-answer">
    <p>Build ▸ Analyze APK in Android Studio, open the <code>.apk</code>/<code>.aab</code>, and read the size breakdown: <code>classes.dex</code> (Java/Kotlin bytecode), <code>res/</code> and <code>resources.arsc</code>, and <code>lib/&lt;abi&gt;/*.so</code> native libs (Hermes, Reanimated). Common culprits: shipping both Hermes and JSC, unsplit ABIs, or large bundled assets. Fix with ABI splits / app bundles and asset trimming.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. When would you use the Profiler vs Layout Inspector?</div>
  <div class="qa-answer">
    <p>Profiler for performance/resources: CPU traces for native jank, Memory heap dumps to find leaks (retained Activities, growing bitmaps), Energy and Network timelines. Layout Inspector for UI structure: the live native view hierarchy, deep nesting, wrong constraints, overdraw. For RN, note the Profiler won't meaningfully profile Hermes JS — use React DevTools / Hermes sampler for that.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. What does sdkmanager --licenses do and why does CI need it?</div>
  <div class="qa-answer">
    <p>It prompts you to accept each SDK component's license; unaccepted licenses make Gradle fail with "You have not accepted the license agreements." On CI you run <code>yes | sdkmanager --licenses</code> (or commit the license hash files) so the build machine can install components non-interactively.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. How do you fully wipe an app's state to test a first launch?</div>
  <div class="qa-answer">
    <p><code>adb shell pm clear &lt;package&gt;</code> deletes all app data — SharedPreferences/MMKV, EncryptedSharedPreferences, SQLite DBs, caches — equivalent to a fresh install without reinstalling. Then <code>adb shell am start -n &lt;pkg&gt;/.MainActivity</code> to launch. Note it logs you out and resets any local flags; if you only wanted a restart, use <code>am force-stop</code> instead.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You know native crashes live in <code>logcat</code> under <code>AndroidRuntime</code>, not in Metro.</li>
    <li>You can filter logcat by pid, priority, and tag (<code>*:S</code> to silence).</li>
    <li>You explain <code>adb reverse tcp:8081</code> as the Metro-over-USB mechanism.</li>
    <li>You name what lives under <code>ANDROID_HOME</code> (platform-tools, platforms, build-tools, ndk, system-images).</li>
    <li>You use <code>sdkmanager</code>/<code>avdmanager</code> from the CLI and accept licenses.</li>
    <li>You know the NDK is why RN's C++ core and Reanimated build, and it's pinned via <code>ndkVersion</code>.</li>
    <li>You pick arm64-v8a system images on Apple Silicon.</li>
    <li>You reach for Profiler/Layout Inspector/APK Analyzer for native perf, UI, and size.</li>
    <li>You know Expo hides the IDE but not the SDK/adb, and edits go through <code>expo-build-properties</code>.</li>
  </ul>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'revision', title: '⚡ Revision — Points to Remember', collapsible: true, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Android Studio is the IntelliJ-based IDE, the SDK is the toolbox on disk under <strong>ANDROID_HOME</strong>, <strong>adb</strong> is the wire to the device, and <strong>logcat</strong> is where native crashes live — as an RN dev you rarely open Studio for managed apps but use adb + logcat every day.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Android Studio</strong> = Google's IDE on IntelliJ IDEA; open the <code>android/</code> folder, it runs <strong>Gradle Sync</strong>, and gives you Logcat, Device Manager, Gradle tool window, App Inspection, Layout Inspector, Profiler, APK Analyzer, SDK Manager, Device Explorer. It orchestrates Gradle; it isn't the compiler. <strong>Invalidate Caches / Restart</strong> clears stale index/caches.</li>
    <li><strong>ANDROID_HOME</strong> (modern) / <strong>ANDROID_SDK_ROOT</strong> (deprecated alias) point at the SDK: <code>platform-tools/</code> (adb), <code>platforms/android-XX/</code> (android.jar = compileSdk), <code>build-tools/NN.N.N/</code> (aapt2, d8/r8, zipalign, apksigner), <code>cmdline-tools/latest/</code> (sdkmanager, avdmanager), <code>emulator/</code>, <code>system-images/</code>, <code>ndk/</code>.</li>
    <li><strong>SDK Manager</strong> (GUI) / <code>sdkmanager</code> (CLI) install platforms, build-tools, NDK, system images; <code>yes | sdkmanager --licenses</code> accepts licenses (CI). <strong>AVD Manager</strong> / <code>avdmanager</code> create emulators from a system image.</li>
    <li><strong>NDK</strong> = C/C++ toolchain (clang, libc++, CMake) that builds native <code>.so</code> libs; RN needs it for JSI/TurboModule/Fabric C++ + Hermes + Reanimated; pinned via <code>ndkVersion</code> in <code>android/build.gradle</code>.</li>
    <li><strong>adb</strong> = client/server (host daemon on :5037) / device (adbd) model. Core commands: <code>adb devices -l</code>, <code>install -r</code>/<code>uninstall</code>, <code>shell</code>, <code>pm clear</code>, <code>am start</code>/<code>force-stop</code>, <code>pull</code>/<code>push</code>, <code>bugreport</code>, <code>dumpsys &lt;svc&gt;</code>. Target one device with <code>-s &lt;serial&gt;</code>.</li>
    <li><strong>adb reverse tcp:8081 tcp:8081</strong> = the Metro-over-USB mechanism (device reaches host); per-connection, dropped on replug. <strong>adb connect &lt;ip&gt;:5555</strong> after <code>adb tcpip 5555</code> = Wi-Fi debugging (Prakhar's <code>adb connect 10.12.70.142:5555</code>).</li>
    <li><strong>logcat</strong> levels V &lt; D &lt; I &lt; W &lt; E &lt; F (+ S silent). Filters: <code>TAG:LEVEL</code>, <code>*:E</code>, end with <code>*:S</code> to mute the rest, <code>--pid=$(adb shell pidof -s pkg)</code>, <code>-c</code> to clear, <code>-v threadtime</code> format, <code>-G 16M</code> to enlarge buffer.</li>
    <li><strong>Key tags:</strong> <code>ReactNativeJS</code> = JS console + redbox text; <code>AndroidRuntime</code> = FATAL native exceptions; <code>DEBUG</code> = libc SIGSEGV tombstones; <code>ReactNative</code> = native infra. JS errors also hit Metro; native crashes do NOT.</li>
    <li><strong>Emulator:</strong> pick <code>arm64-v8a</code> images on Apple Silicon (x86_64 on Intel); acceleration was HAXM/now AEHD/hypervisor; snapshots save/restore state, <code>-no-snapshot</code> cold-boots, <code>-wipe-data</code> factory-resets, <code>-writable-system</code> remounts <code>/system</code> RW.</li>
    <li><strong>Gradle recap:</strong> <code>./gradlew assembleDebug</code>/<code>installDebug</code>/<code>clean</code>/<code>tasks</code>/<code>:app:dependencies</code>. Escalate build fixes: Gradle Sync → <code>./gradlew clean</code> + delete <code>build/</code> and <code>.gradle</code> → Invalidate Caches.</li>
    <li><strong>Profiler</strong> = CPU/Memory/Energy/Network (native + leaks, not Hermes JS); <strong>Layout Inspector</strong> = live native view hierarchy + overdraw; <strong>APK Analyzer</strong> = size by dex/res/native .so.</li>
    <li><strong>Expo reality:</strong> <code>expo run:android</code> drives Gradle+adb; still needs SDK + device; edit native config via <code>expo-build-properties</code> in <code>app.json</code> (hand edits to <code>android/</code> are wiped by <code>expo prebuild --clean</code>); <code>npx expo-doctor</code> validates the setup.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Debugging RN with only Metro open and missing the crash.</strong> Native Java/Kotlin exceptions surface ONLY in <code>logcat</code> under <code>AndroidRuntime</code> (and libc SIGSEGV under <code>DEBUG</code>) — never in the Metro console. Always run <code>adb logcat -c</code> then <code>adb logcat AndroidRuntime:E *:S</code> alongside Metro, and remember <code>adb reverse</code> is per-connection so a replug silently breaks Metro-over-USB.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Android Studio is the IntelliJ-based IDE; the SDK is what it manages on disk under ANDROID_HOME — platform-tools, platforms, build-tools, cmdline-tools, emulator, system-images, ndk. For managed Expo apps I rarely open Studio, but I use adb and logcat constantly."</div>
  <div class="revision-say">"Native crashes never reach Metro — I filter <code>adb logcat AndroidRuntime:E *:S</code> for the FATAL EXCEPTION stack, and <code>ReactNativeJS:V *:S</code> for JS console output and redbox text."</div>
  <div class="revision-say">"<code>adb reverse tcp:8081 tcp:8081</code> is how a USB device reaches Metro; it's per-connection so replugging drops it. For Wi-Fi I do <code>adb tcpip 5555</code> then <code>adb connect &lt;ip&gt;:5555</code>."</div>
</div>
`},

{ id: 'checklist', title: '✅ Interview Checklist', collapsible: true, html: `
<div class="callout success">
  <div class="callout-title">Can you answer these before moving on?</div>
  <ul>
    <li>Can you list what lives under <code>ANDROID_HOME</code> and what each folder (platform-tools, platforms, build-tools, cmdline-tools, ndk, system-images) is for?</li>
    <li>Can you explain the adb client/server/device model and why "server version mismatch" happens?</li>
    <li>Can you say why <code>adb reverse tcp:8081 tcp:8081</code> is needed and how Wi-Fi debugging is set up?</li>
    <li>Can you filter logcat to only your app's native crash, and name which tag it appears under?</li>
    <li>Can you explain what the NDK is and why React Native depends on it?</li>
    <li>Can you create and boot an emulator entirely from the CLI, and pick the right ABI for Apple Silicon?</li>
    <li>Can you say what you'd use Profiler, Layout Inspector, and APK Analyzer for, and how Expo changes when you open Android Studio at all?</li>
  </ul>
</div>
`}

]
});
