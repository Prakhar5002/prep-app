window.PREP_SITE.registerTopic({
  id: 'rn-native-modules',
  module: 'React Native',
  title: 'Native Modules',
  estimatedReadTime: '24 min',
  tags: ['react-native', 'native-modules', 'turbomodules', 'jsi', 'codegen', 'ios', 'android', 'interop'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>Native Modules let JS call platform-specific native code — Objective-C / Swift on iOS, Java / Kotlin on Android. Used when:</p>
<ul>
  <li>You need a platform API that RN / community doesn't wrap yet.</li>
  <li>You're integrating a native SDK (payments, sensors, OEM APIs).</li>
  <li>You have performance-critical code that benefits from native execution.</li>
</ul>
<p>Two APIs exist:</p>
<ul>
  <li><strong>TurboModules (new arch, recommended)</strong>: typed via codegen from a TypeScript spec, JSI-based, synchronous-capable, lazy-loaded. This is the path forward.</li>
  <li><strong>Legacy NativeModules (old arch)</strong>: bridge-based, async-only, untyped. Still widely deployed; supported as a fallback during migration.</li>
</ul>
<p>Before writing one, check if the community already ships it. Writing + maintaining native modules is expensive.</p>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Prefer community libraries. When you must write a native module, use TurboModules with a TypeScript spec + codegen. You get type safety, synchronous calls, and lazy loading — all of which the old bridge lacked.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What a native module is</h3>
<p>A class that exposes methods to JS. The bridge (old arch) or JSI (new arch) makes the class's methods callable from JS with marshaled arguments and return values. iOS implementations are ObjC or Swift; Android are Java or Kotlin.</p>

<h3>Why you'd write one</h3>
<ul>
  <li><strong>Platform API</strong> without a community wrapper (new iOS/Android version's feature, OEM-specific hardware).</li>
  <li><strong>Existing native SDK</strong> (payments, analytics, video player) that doesn't ship JS bindings.</li>
  <li><strong>Performance-critical</strong> code where native beats JS meaningfully (cryptography, image processing, heavy loops).</li>
  <li><strong>Background work</strong> that needs to run without JS (push notifications, background sync, audio playback).</li>
</ul>
<p>Native modules are expensive to maintain — platform version divergence, testing, two languages. Use community libs when possible.</p>

<h3>Why TurboModules over old NativeModules</h3>
<table>
  <thead><tr><th></th><th>Legacy NativeModules</th><th>TurboModules</th></tr></thead>
  <tbody>
    <tr><td>Loading</td><td>Eager at app startup</td><td>Lazy on first use</td></tr>
    <tr><td>Communication</td><td>Async bridge (JSON)</td><td>JSI (direct C++)</td></tr>
    <tr><td>Sync methods</td><td>Rare (blocking method returns are discouraged)</td><td>Natively supported</td></tr>
    <tr><td>Type safety</td><td>None at compile time</td><td>TypeScript spec → codegen → headers</td></tr>
    <tr><td>Bundle impact</td><td>All modules instantiated</td><td>Only what's used</td></tr>
    <tr><td>New arch required</td><td>No</td><td>Yes</td></tr>
  </tbody>
</table>

<h3>Why codegen</h3>
<p>Before codegen, you'd write native code that tried to match JS signatures and hope. Errors were runtime. With codegen: write a TypeScript spec → framework generates ObjC / Kotlin protocols → your native implementation extends those protocols → build-time type errors for mismatches.</p>

<h3>When NOT to write a native module</h3>
<ul>
  <li>Simple API you could polyfill in JS (polyfill).</li>
  <li>Feature already covered by a maintained community library (use it).</li>
  <li>You don't have iOS AND Android expertise in the team (maintenance burden).</li>
  <li>Short-lived experimental feature (write it in JS first; upgrade later).</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "call flow" picture (TurboModule)</h3>
<div class="diagram">
<pre>
 JS (TypeScript spec)              JSI (C++)                Native (iOS/Android)
 ───────────────────              ─────────                 ─────────────────────
 const name = NativeDevice.getModel();
      │
      ▼                              │
 JSI property access                  │ HostObject method dispatch
      │                              │
      └─────────────────────────────►│ call →
                                    │        ObjC / Kotlin method
                                    │ ◄─ return value
      ◄──────────────────────────────│
 name: string (sync!)
</pre>
</div>

<h3>The "call flow" picture (Legacy bridge)</h3>
<div class="diagram">
<pre>
 JS                                  Bridge (async queue)     Native
 ──                                  ────────────────────     ──────
 NativeModules.Device.getModel((name) =&gt; {});
   │                                 │                        │
   ├── serialize { method, args }───►│                        │
   │                                 │── dispatch ────────────►│
   │                                 │                    execute
   │                                 │◄── serialize result ───│
   │◄── callback(result) ────────────│                        │
</pre>
</div>

<h3>The "three files" picture (TurboModule)</h3>
<div class="diagram">
<pre>
 specs/NativeMyModule.ts          (TS spec — source of truth)
        │
        ├─ codegen ──► ios/MyModuleSpec.h  (ObjC protocol)
        │             android/MyModuleSpec.java  (abstract Kotlin class)
        │
        ├─ ios/MyModule.mm  (your impl, extends MyModuleSpec)
        └─ android/MyModule.kt  (your impl, extends MyModuleSpec)
</pre>
</div>

<h3>The "when to invoke native code" picture</h3>
<ul>
  <li><strong>From event handlers</strong> — standard async call pattern.</li>
  <li><strong>Synchronously</strong> (TurboModules only) — for cheap getters like device model, current time with precision, small computed values.</li>
  <li><strong>Event emitter</strong> — native → JS push (scroll positions from a native view, sensor readings).</li>
  <li><strong>From a UI thread worklet (Reanimated)</strong> — JSI allows direct native calls from worklets (rarely needed at app level).</li>
</ul>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"I'll just write Swift/Kotlin for this one feature to make it fast." Even a small native module doubles your maintenance surface — you now own iOS AND Android implementations, plus the bindings. Profile first: usually a JS or C++ (via JSI) solution is sufficient. Reach for full native modules only when platform APIs truly require it.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Step 1 — TypeScript spec</h3>
<pre><code class="language-ts">// specs/NativeDeviceInfo.ts
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  getModel(): string;                         // SYNC
  getBatteryLevel(): number;                  // SYNC
  vibrate(ms: number): void;                  // SYNC fire-and-forget
  getNetworkInfo(): Promise&lt;{ type: string; effectiveType: string }&gt;;
  readonly constants: { isTablet: boolean };  // emitted as getter
}

export default TurboModuleRegistry.getEnforcing&lt;Spec&gt;('DeviceInfo');</code></pre>

<h3>Step 2 — Configure codegen</h3>
<pre><code class="language-json">// package.json
{
  "codegenConfig": {
    "name": "AppSpecs",
    "type": "modules",
    "jsSrcsDir": "./specs",
    "android": { "javaPackageName": "com.myapp.specs" }
  }
}</code></pre>

<h3>Step 3 — iOS implementation (ObjC-C++)</h3>
<pre><code class="language-objc">// ios/DeviceInfo.mm
#import &lt;Foundation/Foundation.h&gt;
#import "AppSpecs/AppSpecs.h"   // codegen output
#import &lt;UIKit/UIKit.h&gt;

@interface DeviceInfo : NSObject &lt;NativeDeviceInfoSpec&gt;
@end

@implementation DeviceInfo
RCT_EXPORT_MODULE();

- (NSString *)getModel {
  return [[UIDevice currentDevice] model];
}

- (double)getBatteryLevel {
  return [[UIDevice currentDevice] batteryLevel];
}

- (void)vibrate:(double)ms {
  // iOS vibration API... AudioServicesPlaySystemSound etc.
}

- (void)getNetworkInfo:(RCTPromiseResolveBlock)resolve
              rejecter:(RCTPromiseRejectBlock)reject {
  resolve(@{ @"type": @"wifi", @"effectiveType": @"4g" });
}

- (NSDictionary *)constantsToExport {
  return @{ @"isTablet": @(UIUserInterfaceIdiomPad == UI_USER_INTERFACE_IDIOM()) };
}
@end</code></pre>

<h3>Step 4 — Android implementation (Kotlin)</h3>
<pre><code class="language-kotlin">// android/src/main/java/com/myapp/DeviceInfoModule.kt
package com.myapp

import com.facebook.react.bridge.*
import com.myapp.specs.NativeDeviceInfoSpec
import android.os.Build
import android.content.res.Configuration

class DeviceInfoModule(context: ReactApplicationContext) : NativeDeviceInfoSpec(context) {
  override fun getName() = "DeviceInfo"

  override fun getModel(): String = Build.MODEL

  override fun getBatteryLevel(): Double {
    val bm = reactApplicationContext.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
    return bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY) / 100.0
  }

  override fun vibrate(ms: Double) {
    val v = reactApplicationContext.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
    v.vibrate(ms.toLong())
  }

  override fun getNetworkInfo(promise: Promise) {
    val map = Arguments.createMap()
    map.putString("type", "wifi")
    map.putString("effectiveType", "4g")
    promise.resolve(map)
  }

  override fun getConstants(): Map&lt;String, Any&gt; = mapOf(
    "isTablet" to (reactApplicationContext.resources.configuration.smallestScreenWidthDp &gt;= 600)
  )
}</code></pre>

<h3>Step 5 — Register on Android</h3>
<pre><code class="language-kotlin">// PackageList or via autolinking
class DeviceInfoPackage : TurboReactPackage() {
  override fun getModule(name: String, ctx: ReactApplicationContext): NativeModule? =
    if (name == "DeviceInfo") DeviceInfoModule(ctx) else null

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf("DeviceInfo" to ReactModuleInfo(
      "DeviceInfo", DeviceInfoModule::class.java.name,
      canOverrideExistingModule = false, needsEagerInit = false,
      hasConstants = true, isCxxModule = false, isTurboModule = true,
    ))
  }
}</code></pre>

<h3>Step 6 — Use in JS</h3>
<pre><code class="language-ts">import DeviceInfo from './specs/NativeDeviceInfo';

const model: string = DeviceInfo.getModel();           // sync
const battery: number = DeviceInfo.getBatteryLevel();  // sync
DeviceInfo.vibrate(200);                                // sync void
const net = await DeviceInfo.getNetworkInfo();          // async
console.log(DeviceInfo.constants.isTablet);             // constant</code></pre>

<h3>Event emitter pattern (Native → JS)</h3>
<pre><code class="language-ts">// Spec
export interface Spec extends TurboModule {
  addListener(eventName: string): void;
  removeListeners(count: number): void;
  startLocationUpdates(): void;
  stopLocationUpdates(): void;
}

// In JS consumer
import { NativeEventEmitter } from 'react-native';
const emitter = new NativeEventEmitter(NativeLocation);
const sub = emitter.addListener('locationUpdate', (coords) =&gt; { ... });
NativeLocation.startLocationUpdates();
// later:
sub.remove();
NativeLocation.stopLocationUpdates();</code></pre>

<pre><code class="language-kotlin">// Android — emit event
val params = Arguments.createMap()
params.putDouble("lat", lat)
params.putDouble("lng", lng)
reactApplicationContext
  .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
  .emit("locationUpdate", params)</code></pre>

<h3>Legacy NativeModule (old arch) — for reference</h3>
<pre><code class="language-objc">// iOS
#import &lt;React/RCTBridgeModule.h&gt;
@interface RCTDeviceInfoLegacy : NSObject &lt;RCTBridgeModule&gt;
@end
@implementation RCTDeviceInfoLegacy
RCT_EXPORT_MODULE();
RCT_EXPORT_METHOD(getModel:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  resolve([[UIDevice currentDevice] model]);
}
@end

// JS
import { NativeModules } from 'react-native';
const model = await NativeModules.DeviceInfoLegacy.getModel();</code></pre>

<h3>JSI HostObject (advanced)</h3>
<p>Beyond TurboModules, you can install arbitrary C++ objects onto the JS global via JSI. Libraries like MMKV use this to provide sync APIs without a module wrapper:</p>
<pre><code class="language-cpp">// At native init time:
runtime.global().setProperty(runtime, "MMKV", jsi::Object::createFromHostObject(runtime, hostObj));
// Then from JS: MMKV.get("key")  ← direct sync call</code></pre>

<h3>Testing native modules</h3>
<p>Mock in Jest via module manual mocks. For integration: Detox / Maestro run against actual devices where native code executes.</p>
<pre><code class="language-js">// __mocks__/react-native.js
jest.mock('react-native', () =&gt; ({
  ...jest.requireActual('react-native'),
  NativeModules: {
    ...jest.requireActual('react-native').NativeModules,
    DeviceInfo: { getModel: jest.fn().mockReturnValue('iPhone') },
  },
}));</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — minimal "hello native" turbo module</h3>
<pre><code class="language-ts">// specs/NativeHello.ts
export interface Spec extends TurboModule {
  greet(name: string): string;
}
export default TurboModuleRegistry.getEnforcing&lt;Spec&gt;('Hello');

// iOS
- (NSString *)greet:(NSString *)name {
  return [NSString stringWithFormat:@"Hello, %@!", name];
}

// Android Kotlin
override fun greet(name: String): String = "Hello, $name!"

// JS usage
import Hello from './specs/NativeHello';
console.log(Hello.greet('Ada'));  // sync call → "Hello, Ada!"</code></pre>

<h3>Example 2 — Haptic feedback</h3>
<pre><code class="language-ts">// Spec
export interface Spec extends TurboModule {
  impact(style: 'light' | 'medium' | 'heavy'): void;
  notification(type: 'success' | 'warning' | 'error'): void;
}

// iOS
- (void)impact:(NSString *)style {
  UIImpactFeedbackStyle s = UIImpactFeedbackStyleMedium;
  if ([style isEqualToString:@"light"]) s = UIImpactFeedbackStyleLight;
  if ([style isEqualToString:@"heavy"]) s = UIImpactFeedbackStyleHeavy;
  UIImpactFeedbackGenerator *g = [[UIImpactFeedbackGenerator alloc] initWithStyle:s];
  [g prepare]; [g impactOccurred];
}</code></pre>

<h3>Example 3 — Secure storage wrapper</h3>
<pre><code class="language-ts">export interface Spec extends TurboModule {
  setItem(key: string, value: string): Promise&lt;void&gt;;
  getItem(key: string): Promise&lt;string | null&gt;;
  removeItem(key: string): Promise&lt;void&gt;;
}
// iOS — Keychain; Android — EncryptedSharedPreferences</code></pre>

<h3>Example 4 — Native module emitting events</h3>
<pre><code class="language-ts">// Spec
export interface Spec extends TurboModule {
  addListener(eventName: string): void;
  removeListeners(count: number): void;
  startMonitoring(): void;
  stopMonitoring(): void;
}

// JS consumer
const emitter = new NativeEventEmitter(NativeNetwork);
useEffect(() =&gt; {
  const sub = emitter.addListener('networkChange', (e) =&gt; setConnected(e.connected));
  NativeNetwork.startMonitoring();
  return () =&gt; { sub.remove(); NativeNetwork.stopMonitoring(); };
}, []);</code></pre>

<h3>Example 5 — MMKV as a JSI-based module</h3>
<pre><code class="language-ts">// MMKV doesn't use TurboModules — it uses direct JSI HostObject installation
import { MMKV } from 'react-native-mmkv';
const storage = new MMKV();  // under the hood: JSI host object
storage.set('k', 'v');       // synchronous C++ call, not through RN bridge</code></pre>

<h3>Example 6 — Legacy async pattern (old arch)</h3>
<pre><code class="language-ts">import { NativeModules } from 'react-native';
const { Calendar } = NativeModules;
const events = await Calendar.getUpcomingEvents(7);</code></pre>

<h3>Example 7 — Platform-check before calling</h3>
<pre><code class="language-ts">import { NativeModules, Platform } from 'react-native';
const MyMod = NativeModules.MyMod;
if (Platform.OS === 'ios' &amp;&amp; MyMod?.doThing) {
  MyMod.doThing();
} else {
  console.warn('MyMod not available');
}</code></pre>

<h3>Example 8 — JS fallback when native is missing</h3>
<pre><code class="language-ts">function getAppVersion() {
  try { return NativeDeviceInfo.getAppVersion(); }
  catch { return Constants.expoConfig?.version ?? 'unknown'; }
}</code></pre>

<h3>Example 9 — Typed events with module-specific EventEmitter</h3>
<pre><code class="language-ts">type NetworkEvent = { connected: boolean; type: 'wifi' | 'cellular' | 'unknown' };

const emitter = new NativeEventEmitter(NativeNetwork);
const sub = emitter.addListener('change', (e: NetworkEvent) =&gt; { /* e is typed */ });</code></pre>

<h3>Example 10 — Autolinking package.json entry</h3>
<pre><code class="language-json">{
  "name": "my-native-pkg",
  "react-native": {
    "ios": { "sourceDir": "./ios" },
    "android": { "sourceDir": "./android" }
  }
}</code></pre>

<h3>Example 11 — Expo config plugin</h3>
<p>If you ship a native module as an Expo config plugin, users can integrate via <code>app.json</code> without ejecting. Example: expo-secure-store, expo-battery. Your module becomes a turnkey <code>config-plugin</code> that modifies native config at prebuild.</p>

<h3>Example 12 — Fabric native view component (bonus)</h3>
<p>Beyond modules, you can expose custom native views to JSX. Spec as TypeScript; codegen generates Fabric view bindings. Example: a native map view, a camera view. Same codegen pipeline, different package type.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Autolinking missing</h3>
<p>If a library isn't autolinked (custom fork, manual integration), runtime error "Native module not found." Check <code>npx react-native config</code> lists it. For Expo bare, also verify gradle / pod install succeeded.</p>

<h3>2. iOS pod install after upgrade</h3>
<p>Adding a native module requires <code>npx pod-install</code> on iOS. JS-only reloads won't surface the new module.</p>

<h3>3. TurboModule availability check</h3>
<p><code>TurboModuleRegistry.getEnforcing&lt;Spec&gt;('Name')</code> throws if not found. Use <code>TurboModuleRegistry.get&lt;Spec&gt;('Name')</code> if you need a fallback.</p>

<h3>4. Thread safety</h3>
<p>Native module methods default to a queue. For UI work (calling UIKit), dispatch to main thread:</p>
<pre><code class="language-objc">dispatch_async(dispatch_get_main_queue(), ^{ /* UIKit calls */ });</code></pre>

<h3>5. Promise vs sync methods</h3>
<p>Old arch: all methods are async. New arch: you can declare sync methods. Sync methods BLOCK the JS thread — use only for fast operations (getters, cache reads). For long work, use Promise.</p>

<h3>6. Memory leaks from event listeners</h3>
<p>Every <code>addListener</code> must have a matching <code>remove()</code>. Forgetting leaks the listener's closure + captured state. Wrap in useEffect with cleanup.</p>

<h3>7. JS bridge errors in native</h3>
<p>If your native method throws an exception, JS may not see a clean error message. Convert to Promise.reject or NSError. Wrap all native calls in try/catch inside the module implementation.</p>

<h3>8. Constants lazy-loading</h3>
<p>On iOS's old arch, constants declared via <code>+ (NSDictionary *)constantsToExport</code> are computed at module registration — can slow startup. New arch supports lazy reads via <code>getConstants</code> + typed spec. Don't expose huge constants.</p>

<h3>9. Codegen cache staleness</h3>
<p>Changing the spec but not running codegen leaves stale generated headers. Clean build: <code>cd ios &amp;&amp; pod install</code>, and on Android <code>./gradlew clean</code>.</p>

<h3>10. Passing complex types</h3>
<p>TurboModules support primitives, arrays, maps, Promise, callbacks. No classes or functions across the boundary (for callbacks, use emit events). Structures map to:</p>
<pre><code class="language-ts">{ id: string; count: number; meta: Record&lt;string, string&gt; }
// iOS: NSDictionary * ; Android: ReadableMap / WritableMap</code></pre>

<h3>11. Android ReactApplicationContext lifecycle</h3>
<p>A module receives <code>ReactApplicationContext</code>. If you hold async callbacks beyond the RN instance lifetime (app backgrounded, instance destroyed), you crash. Check <code>reactContext.hasActiveReactInstance()</code> or handle exceptions.</p>

<h3>12. Hermes vs JSC behavior differences</h3>
<p>A native module returning specific JS types — Hermes and JSC treat edge cases like <code>NaN</code>, BigInt, undefined slightly differently. Test on the engine you ship (Hermes default).</p>

<h3>13. Main-thread blocking on old arch sync</h3>
<p>Old arch technically allowed synchronous methods via <code>RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD</code> but they blocked the JS thread until native returned. Rarely used; discouraged.</p>

<h3>14. Module name collisions</h3>
<p>If two libs register a module with the same name, one wins silently. Use unique prefixes.</p>

<h3>15. Expo support</h3>
<p>Expo Go doesn't include arbitrary native modules. Use Expo Dev Client (custom dev app) or build + install. Expo Config Plugins help with integration but don't bypass the need for a custom native build.</p>

<h3>16. Deprecated bridge APIs</h3>
<p>Old code using <code>RCTBridge</code>, <code>RCTEventEmitter</code> base classes works but is legacy. New arch uses <code>RCTBridgeModule</code> + generated protocols or TurboModule base classes.</p>

<h3>17. Debugging native crashes</h3>
<p>JS stack traces don't reach native crash points. Use Xcode or Android Studio to debug the native side; enable crash reporting (Sentry with native symbols) for production.</p>

<h3>18. Swift vs ObjC</h3>
<p>You can write native modules in Swift but need a bridging header and @objc attributes. Many teams use ObjC or ObjC-C++ (<code>.mm</code>) for simpler RN integration.</p>

<h3>19. Kotlin vs Java</h3>
<p>Kotlin is default for new RN modules. If you inherit a Java-based module, it still works. Mixing is allowed.</p>

<h3>20. Avoid circular dependency</h3>
<p>A native module importing a React component or vice versa creates initialization cycles. Keep native modules self-contained; use React via their JS wrapper only.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — writing a native module before checking community</h3>
<p>Custom native module for something <code>react-native-*</code> already does. Costly duplication. Search npm and Expo docs first.</p>

<h3>Anti-pattern 2 — synchronous method on old arch via blocking API</h3>
<p><code>RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD</code> is discouraged. If you need sync, migrate to TurboModules.</p>

<h3>Anti-pattern 3 — not using codegen</h3>
<p>Hand-maintained bridge wrappers on new arch miss type safety and will break with RN version changes. Always declare a TS spec.</p>

<h3>Anti-pattern 4 — leaking event listeners</h3>
<p>Every addListener needs remove. Wrap in useEffect. Tracker in native for active subscriptions too.</p>

<h3>Anti-pattern 5 — storing huge data in constants</h3>
<p>Constants computed at module registration. A huge list here slows startup. Expose via Promise method instead.</p>

<h3>Anti-pattern 6 — not handling main-thread UIKit calls</h3>
<p>Calling UIKit from a background queue crashes or misbehaves on iOS. Dispatch to main.</p>

<h3>Anti-pattern 7 — ignoring Android lifecycle</h3>
<p>Module holding a reference to React context outlives the context. Check <code>hasActiveReactInstance</code> before emitting events.</p>

<h3>Anti-pattern 8 — promise rejecting with strings</h3>
<p>Reject with <code>NSError</code> / <code>Error</code> instances for consistent JS-side <code>Error</code> objects.</p>

<h3>Anti-pattern 9 — no fallback for missing module</h3>
<p>App crashes at startup on a platform where the module isn't supported. Gate with <code>Platform.OS</code> + existence check.</p>

<h3>Anti-pattern 10 — large JSON serialization on old arch</h3>
<p>Passing a 5MB JSON object over the bridge per call kills perf. Stream via event emitter or move to JSI/TurboModules.</p>

<h3>Anti-pattern 11 — not testing on both platforms</h3>
<p>iOS works; Android silently does nothing. Always test both during native module dev.</p>

<h3>Anti-pattern 12 — starting custom native for a polyfill-able API</h3>
<p>Some "native" APIs are available via standard JS. <code>fetch</code>, <code>WebSocket</code>, <code>crypto.getRandomValues</code> all exist — no native module needed.</p>

<h3>Anti-pattern 13 — tying native module lifecycle to component lifecycle</h3>
<p>Native modules are singletons at the RN instance level. Don't expect per-mount init.</p>

<h3>Anti-pattern 14 — deep JS-to-native chain per event</h3>
<p>High-frequency events (scroll, gesture) over the old bridge cause jank. Move to JSI (Reanimated + GestureHandler handle this).</p>

<h3>Anti-pattern 15 — shipping without crash reporting hooks</h3>
<p>Native crashes don't show in JS stack traces. Without Sentry / Crashlytics, you're flying blind.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. When would you write a native module?</div>
  <div class="qa-answer">
    <p>When you need a platform API that no community library covers (new iOS/Android feature), when you're integrating a native SDK that doesn't ship JS bindings (payments, analytics, OEM sensors), or when you have performance-critical code that benefits from native. Otherwise, prefer community libraries — custom native modules have a significant maintenance cost (dual platform, two languages, testing).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Difference between old NativeModules and TurboModules?</div>
  <div class="qa-answer">
    <p>Old NativeModules: all loaded eagerly at startup, async bridge with JSON serialization, no type safety. TurboModules: lazy-loaded on first JS access, JSI-based (sync-capable, no JSON), typed via TypeScript spec + codegen-generated native headers. TurboModules require the new architecture but are strictly better.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. What's codegen?</div>
  <div class="qa-answer">
    <p>A tool that takes a TypeScript spec (an interface extending <code>TurboModule</code>) and generates native headers — ObjC protocols on iOS, abstract Kotlin classes on Android. Your native implementation extends these. Benefit: compile-time errors if spec and impl disagree. Runs as part of iOS pod install and Android gradle build.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Walk me through creating a simple TurboModule.</div>
  <div class="qa-answer">
    <ol>
      <li>Write a <code>specs/NativeX.ts</code> exporting an interface extending <code>TurboModule</code> with method signatures and a default export from <code>TurboModuleRegistry.getEnforcing</code>.</li>
      <li>Add <code>codegenConfig</code> to package.json pointing to the specs directory.</li>
      <li>Run <code>pod install</code> (iOS) or <code>gradle sync</code> (Android) — codegen generates native headers.</li>
      <li>Implement iOS in <code>.mm</code> extending the generated protocol; implement Android in Kotlin extending the generated abstract class.</li>
      <li>Register the module (autolinking handles most; may need explicit registration for custom modules).</li>
      <li>Use in JS: import the spec default and call methods.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. How does a native module emit events to JS?</div>
  <div class="qa-answer">
    <p>On the native side, obtain the <code>RCTDeviceEventEmitter</code> (or Android equivalent <code>DeviceEventManagerModule.RCTDeviceEventEmitter</code>) and call <code>emit(eventName, params)</code>. On the JS side, instantiate a <code>NativeEventEmitter</code> with your module and <code>addListener(eventName, callback)</code>. Always unsubscribe via the returned subscription's <code>remove()</code>, typically in a useEffect cleanup.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. What types can cross the JS / native boundary?</div>
  <div class="qa-answer">
    <p>Primitives (number, string, boolean), null/undefined, arrays, objects (maps), and Promise / callback for async returns. On TurboModules, also typed signatures for all of these. Not supported: class instances, functions, Maps/Sets, Dates (use ISO strings), binary Buffers (use base64 or a ByteArray wrapper). For streaming binary, use events or files.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How do you handle errors in a native module?</div>
  <div class="qa-answer">
    <ul>
      <li>For async methods: reject the Promise with an <code>NSError</code> (iOS) or call <code>promise.reject(errorCode, message)</code> (Android).</li>
      <li>For sync methods: return a sensible default or throw a <code>std::runtime_error</code> that JSI surfaces as a JS Error.</li>
      <li>Always wrap native calls in try/catch to avoid crashing the app on unexpected native exceptions.</li>
      <li>Report uncaught native crashes via Sentry/Crashlytics with symbols.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Why is MMKV fast?</div>
  <div class="qa-answer">
    <p>MMKV is implemented as a JSI HostObject — installed directly on the JS global by native code. Calls like <code>storage.get('k')</code> skip the bridge entirely: JS calls into C++ synchronously via JSI; C++ reads from an mmap'd file. No JSON, no async. Under 100μs per op, ~30× faster than AsyncStorage.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Describe the lifecycle of a TurboModule.</div>
  <div class="qa-answer">
    <p>Lazily instantiated on first JS access. The native class is created with the ReactApplicationContext (Android) or via the TurboModuleManager (iOS). Singleton per RN instance. On RN instance destruction (app background, reload), the module is torn down — any async operations should handle this via context checks. New arch also supports bridgeless mode where there's no traditional bridge, just TurboModule managers.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. How do you test a native module?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Unit tests</strong>: Jest manual mocks for <code>NativeModules.X</code> / the TurboModule — return fixture data.</li>
      <li><strong>Integration tests</strong>: Detox or Maestro run the actual native code on a simulator / device.</li>
      <li><strong>Platform-specific</strong>: XCTest on iOS, JUnit on Android for the native code directly.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. When is a sync method appropriate?</div>
  <div class="qa-answer">
    <p>For cheap, fast operations where the async ceremony adds overhead: reading device constants (model, OS version), synchronous storage reads (MMKV), simple computations, small getters. Not appropriate for: network, database queries over 1ms, UIKit work, file I/O on large files. Sync methods block the JS thread.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Explain autolinking.</div>
  <div class="qa-answer">
    <p>RN 0.60+ introduced autolinking: during <code>pod install</code> (iOS) or gradle sync (Android), RN CLI scans node_modules for packages declaring native code and automatically links them into the build. No manual Xcode / gradle config needed. Libraries opt in via <code>react-native.config.js</code> or <code>package.json#react-native</code> field. Custom local modules may need explicit config.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. How do you expose a native view (not just a module)?</div>
  <div class="qa-answer">
    <p>Similar pipeline to TurboModules but <code>type: 'components'</code> in codegen config. Write a TS spec declaring the component's props, generate Fabric native component bindings, implement on iOS (ObjC <code>RCTViewManager</code>) and Android (Kotlin <code>SimpleViewManager</code>). Use case: exposing a native map view, a custom camera, video player. React Native community has examples (e.g., <code>react-native-maps</code>).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Your native module works on iOS but not Android. How do you debug?</div>
  <div class="qa-answer">
    <ol>
      <li>Check Metro console + device logs: is the module registered? Reactotron or Flipper shows NativeModules list.</li>
      <li>If "module not found," check Package registration and autolinking config.</li>
      <li>Run <code>./gradlew clean</code> + rebuild.</li>
      <li>Verify codegen output exists in the generated folder.</li>
      <li>Check Android Studio logcat for initialization errors.</li>
      <li>Test via a tiny JS file calling one method with a breakpoint in Android Studio on the Kotlin impl.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. When should you reach for JSI HostObject instead of TurboModule?</div>
  <div class="qa-answer">
    <p>When you need even lower-level control than TurboModules give, or when TurboModules' spec-driven pattern doesn't fit (e.g., you're installing a C++ SDK that should look like a plain object on the JS side). MMKV, Skia, Reanimated's worklet runtime all use HostObject. Tradeoffs: more C++ complexity, no codegen type safety, deeper native knowledge required. For application-level code, TurboModule is almost always the right choice.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You know when NOT to write a native module (check community first).</li>
    <li>You prefer TurboModules + codegen over legacy NativeModules.</li>
    <li>You can write a TypeScript spec + stub iOS/Android implementations.</li>
    <li>You handle events via NativeEventEmitter with cleanup.</li>
    <li>You know sync is appropriate only for fast calls.</li>
    <li>You name MMKV as a JSI-based storage, not a TurboModule.</li>
    <li>You debug native crashes via Xcode / Android Studio.</li>
    <li>You handle platform fallbacks when a module isn't available.</li>
  </ul>
</div>
`}

]
});
