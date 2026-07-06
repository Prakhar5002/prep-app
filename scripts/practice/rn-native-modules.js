/* Practice challenges — RN Deep Dives: Native Modules & Bridging */
(function () {
  var reg = window.PREP_SITE.registerChallenge;

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-nm-when-to-write', track: 'rn', category: 'rn-native-modules',
    difficulty: 'core', type: 'deep-dive',
    prompt: 'When does a problem actually require writing a native module (or a Fabric native component), versus reaching for a JS library or an existing platform-API wrapper?',
    answer: {
      core: `Write native code only when one of these is genuinely true: (a) the platform capability has no maintained JS-callable wrapper (a brand-new OS API, an OEM/hardware-specific SDK), (b) you're integrating an existing native SDK that ships no JS bindings (payment SDKs, analytics SDKs with native-only init), (c) a specific, profiled hot path is provably CPU-bound in a way native code meaningfully beats JS/Hermes at (cryptographic hashing, per-pixel image processing, heavy parsing), or (d) the work must keep running without JS present at all (a background service, push-notification handling before the JS runtime has even started). "I need a custom-looking view" is a different question entirely — that's a Fabric native component (a tree participant), not a native module (callable business logic with no UI).`,
      mechanism: `Before writing anything, check whether a maintained community library already solves it (React Native Directory, the library's own New Architecture support status) — a native module you write is a native module you now own forever, across two platforms and every OS/RN version bump. The decision order that holds up under scrutiny: 1) does a maintained JS/TurboModule library already do this? 2) can a pure-JS or Reanimated-worklet solution get close enough without native code at all? 3) only then, is this a callable-logic problem (native module / TurboModule) or a rendered-view problem (Fabric native component) — sometimes it's legitimately both, wired together (see the camera-SDK example below).`,
      tradeoffs: `Every native module doubles your surface area: two languages, two build toolchains, two sets of platform-version quirks, and tests that can silently rot on one platform while the other keeps working. That cost is easily justified for (a)/(b)/(d) above; for (c) it's only justified after profiling shows JS/Hermes genuinely can't get there — "this feels slow" is not the same evidence as "this specific function is the measured bottleneck."`,
      followups: [
        { q: 'How do you tell if slow JS code should become a native module versus just being optimized in JS?', a: 'Profile first. Hermes bytecode is precompiled and often fast enough that a general "the app feels slow" complaint resolves with JS-level fixes (memoization, avoiding re-renders, offloading to a worklet). Reach for native code only when profiling isolates a specific, provably native-code-shaped hot path — a tight cryptographic loop, a per-pixel transform — not as a first response to vague slowness.' },
        { q: 'Does needing a custom native UI element mean you write a native module?', a: 'No. A visible custom view is a Fabric native component — a ComponentDescriptor/ShadowNode pair participating in layout and the tree — a structurally different spec and codegen output from a TurboModule, which has no view at all, just callable methods.' }
      ],
      redFlags: `Writing a native module for something a well-maintained community library already solves (check the ecosystem first); conflating "I need a custom view" with "I need a native module" — those are different specs and different codegen artifacts (Fabric component vs. TurboModule).`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-nm-turbomodule-authoring', track: 'rn', category: 'rn-native-modules',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'Walk through authoring a TurboModule end-to-end: what do you write, what does Codegen produce from it, and where does your native implementation actually plug in?',
    answer: {
      core: `You write exactly one source of truth: a TypeScript spec file describing the module's shape. Codegen — a build-time step, not something that runs on-device — reads that spec and emits per-platform native scaffolding (an Objective-C++ protocol, a Kotlin/Java abstract class). Your native implementation then extends/conforms to that generated scaffolding, so a signature mismatch between the spec and your native code is a compile-time build failure, not a runtime surprise a user discovers.`,
      mechanism: `<pre><code class="language-ts">// specs/NativeDeviceInfo.ts
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  getModel(): string;                                   // sync — cheap getter
  getBatteryLevel(): Promise&lt;number&gt;;                    // async — real I/O
  readonly constants: { isTablet: boolean };
}

export default TurboModuleRegistry.getEnforcing&lt;Spec&gt;('DeviceInfo');
</code></pre>
This spec file is what app code actually imports and calls — <code>import DeviceInfo from './specs/NativeDeviceInfo'; DeviceInfo.getModel()</code> — a typed function call, not a <code>NativeModules.Foo</code> string lookup. Codegen is wired into the build (a Gradle plugin on Android, a CocoaPods build phase on iOS, both hooked up via autolinking) and runs during <code>pod install</code>/Gradle sync, emitting the generated Spec base class into each platform's build output. Your <code>.mm</code>/<code>.kt</code> implementation extends that generated base class and fills in each method body; the generated base class is what makes a divergent native signature fail to compile rather than silently mismatch at call time.`,
      tradeoffs: `Codegen's type vocabulary is deliberately restrictive — numbers, strings, booleans, and objects/arrays/callbacks/Promises built from those — so you can't just pass an arbitrary dynamic JS shape across the boundary the way legacy NativeModules effectively allowed. That's a real ergonomic constraint traded for compile-time safety and the removal of a whole class of "worked in dev, broke in prod because native forgot an argument" bugs.`,
      followups: [
        { q: 'What happens if the iOS and Android native implementations\' method signatures diverge from the TS spec?', a: 'The build fails — the native code doesn\'t satisfy the generated protocol/abstract-class contract Codegen produced — instead of shipping a mismatch that only surfaces as a runtime crash or silent wrong-value bug in production, which is what happened routinely with the untyped legacy bridge.' },
        { q: 'Can a single TurboModule mix synchronous and async methods?', a: 'Yes — sync vs. async is a per-method decision in the spec (a plain return type vs. a Promise-returning one), not a module-wide setting. Most methods should stay async/Promise-based; sync is reserved for genuinely cheap, non-blocking reads.' }
      ],
      redFlags: `Calling Codegen "just TypeScript types for the IDE" (it emits real native code consumed by the actual build, not editor hints); assuming a spec can carry arbitrary nested/dynamic shapes across the boundary the way old NativeModules loosely allowed.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-nm-jsi-hostobjects', track: 'rn', category: 'rn-native-modules',
    difficulty: 'staff', type: 'deep-dive',
    prompt: 'At the C++ level, what is a JSI HostObject, and how does it let a TurboModule expose a genuinely synchronous method to JS?',
    answer: {
      core: `A JSI HostObject is a C++ class (subclassing <code>facebook::jsi::HostObject</code>) that overrides <code>get</code>/<code>set</code>/<code>getPropertyNames</code>, installed directly into the JS runtime so JS code can address it like an ordinary object — except each property access dispatches synchronously into native C++, in the same process, with no message queue in between. A TurboModule is, underneath, exactly this: a HostObject whose <code>get</code> lazily resolves a requested method name into a native function pointer on first access.`,
      mechanism: `When JS reads <code>NativeDeviceInfo.getModel</code>, the runtime calls the HostObject's <code>get(runtime, propName)</code>, which — on first access — looks up and binds the native implementation, returning a <code>jsi::Function</code> (a HostFunction). Calling that function from JS runs the native method body in place, on whatever thread issued the call, with arguments handed over as <code>jsi::Value</code>s — tagged references into the JS heap that native code reads directly, not JSON strings. Because Codegen has already constrained a TurboModule spec's type vocabulary, the native side knows exactly what shape to expect for each argument without needing to inspect an arbitrary payload.`,
      tradeoffs: `JSI makes synchronous native calls technically possible for any method — that capability used to not exist at all on the old bridge. But "possible" isn't "advisable": every sync method is a promise to whatever thread calls it that the native work will return fast. JSI removes the *forced* async-plus-serialization tax; it does not remove the responsibility to think about which thread is now blocked while that native call runs.`,
      followups: [
        { q: 'Does using a HostObject mean the method literally always runs on the JS thread?', a: 'No — it runs on whatever thread invoked it. Typical app call sites are on the JS thread, but a Reanimated worklet running directly on the UI thread can invoke a HostObject method right there too; the HostObject itself has no inherent thread affinity.' },
        { q: 'How is jsi::Value marshaling different from the old bridge\'s JSON serialization?', a: 'A jsi::Value is a tagged reference to the actual value living in the JS heap/runtime that native code reads directly — no intermediate stringify/parse round trip, versus the bridge\'s "stringify everything, ship the string across, parse it back" model on both ends of every call.' }
      ],
      redFlags: `Describing a HostObject as "a JSON adapter" (the entire point is that it removes serialization, not re-implements it); assuming every TurboModule method is synchronous simply because JSI makes that possible — it's opt-in per method, and most legitimately stay async.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-nm-threading-model', track: 'rn', category: 'rn-native-modules',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'Which thread does a native module\'s method body actually execute on — old architecture vs. new — and what has to happen for a method that touches UIKit or an Android View?',
    answer: {
      core: `Legacy (old-arch) NativeModules run their method bodies on a dedicated background "native modules thread" by default — a serial GCD queue on iOS, a background thread on Android — not the JS thread and not the main/UI thread, unless the module explicitly opts into the main queue. On the New Architecture, that automatic placement goes away only for SYNCHRONOUS TurboModule methods: a sync method body executes directly, via JSI, on whichever thread issued the call — typically the JS thread for ordinary app code, but genuinely wherever the caller was (including the UI thread, for a Reanimated worklet invoking it directly). There is no implicit "hop to a safe background queue" for sync methods the way old-arch modules got by default. ASYNC (Promise/callback-returning) TurboModule methods are not affected by that change — they still route through methodQueue exactly as before, dispatched onto a background queue by default unless the module overrides methodQueue to something else (e.g. main). So thread-placement responsibility shifts to the author specifically for sync methods; async methods keep the familiar methodQueue-governed dispatch.`,
      mechanism: `On iOS, a legacy module can override <code>-(dispatch_queue_t)methodQueue</code> to pin itself to <code>dispatch_get_main_queue()</code> (required whenever a method touches UIKit, since UIKit is main-thread-only) or to a custom queue; <code>requiresMainQueueSetup</code> similarly controls where the module's <code>init</code> runs. On Android, methods dispatch onto a background executor by default, and explicit UI work must go through <code>UiThreadUtil.runOnUiThread(...)</code>. On new arch, none of that automatic queue-hopping happens for a SYNCHRONOUS TurboModule method: one that needs to read a UIView/Android View property has to dispatch to main/UI itself, inside the method body, even though the call into it was synchronous JSI. Async TurboModule methods are the exception to that: they're still dispatched via methodQueue exactly as legacy async methods were, so overriding methodQueue to main affects them the same way it always did — it's specifically sync methods that opt out of methodQueue entirely.`,
      tradeoffs: `Pinning an entire module's queue to main to satisfy one UIKit-touching method also serializes every other async method in that module onto the UI thread — true for every method on old arch, and still true on new arch for any async (Promise-based) methods on that module, though new-arch SYNC methods are unaffected by methodQueue entirely. Better to dispatch selectively inside just the methods that need it, rather than pinning the whole module and paying that cost for calls that never needed main-thread access.`,
      followups: [
        { q: 'If a synchronous TurboModule method needs to read a UIView property, where should the main-thread dispatch happen?', a: 'Inside that specific method\'s implementation — a targeted dispatch_sync (or direct call if already on main) to read just that UIKit value — not by pinning the whole module\'s queue to main, which would also drag every unrelated method onto the UI thread.' },
        { q: 'What\'s the deadlock risk with dispatch_sync onto the main queue from inside a native method?', a: 'If the calling thread already IS the main thread (e.g., a sync method invoked from a UI event handler), dispatch_sync targeting the main queue blocks forever waiting on a queue it\'s already running on — you must check isMainThread and call directly in that case instead of dispatching.' }
      ],
      redFlags: `Claiming old-arch native modules run on the JS thread by default (false — a distinct dedicated background thread); assuming new-arch synchronous calls automatically land on some safe background thread (they run wherever the caller was, which is exactly why blocking the calling thread is a real risk).`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-nm-data-serialization', track: 'rn', category: 'rn-native-modules',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'What actually happens to a value crossing the JS↔native boundary, and how does that differ between the legacy bridge and JSI/TurboModules?',
    answer: {
      core: `On the legacy bridge, every argument and return value is serialized to JSON-compatible types, batched, stringified, shipped across the wire, and parsed back on the other side — real, measurable CPU and allocation cost paid twice per call, and structurally async-only since there's no synchronous channel to return a value over. On JSI/TurboModules, arguments are <code>jsi::Value</code> references directly into the shared JS runtime; native code reads them via typed accessors with no intermediate stringify/parse step, and Codegen has already constrained the type surface to a vocabulary with a direct, defined native mapping.`,
      mechanism: `Codegen's supported types are strings, numbers, booleans, arrays/objects built from those, callbacks, Promises, and nullable variants of each — a real but bounded vocabulary that, as of today, still has no first-class ArrayBuffer/typed-array type (that's an active RFC, not something a plain spec file can declare yet). Getting genuine zero-copy binary transfer means dropping below an ordinary TurboModule spec to hand-write a custom JSI HostObject binding: raw JSI (what TurboModules are themselves built from) can hand over binary data via ArrayBuffers/typed arrays with true zero-copy semantics — genuinely sharing the same memory rather than copying it — but that's bespoke native/C++ work, not something Codegen emits for you from a spec. The old bridge had no equivalent at any level: a binary payload (an image buffer, audio samples) had to be Base64-encoded into a JSON string, which is both a real size increase (roughly +33%) and a CPU cost to encode on one side and decode on the other, on every single call.`,
      tradeoffs: `JSI removes the serialization tax for typical calls, but it doesn't mean "pass anything for free" — Codegen's type vocabulary is still a real constraint on ordinary TurboModule specs, and genuinely large/binary payloads still need an explicit pattern (ArrayBuffer/shared-buffer handoff) rather than assuming arbitrary-size object graphs are now costless.`,
      followups: [
        { q: 'How were large binary payloads, like an image buffer, handled across the old bridge?', a: 'Base64-encoded into a JSON string on one side and decoded back into bytes on the other — a real size penalty and real CPU cost on every call. JSI/new-arch code can instead hand over an ArrayBuffer or typed-array reference directly via a custom JSI binding — ordinary Codegen specs don\'t have a first-class ArrayBuffer type yet — skipping that copy-and-reencode round trip entirely.' },
        { q: 'Does removing serialization mean a TurboModule call is now "free"?', a: 'No — cheaper, not free. Marshaling jsi::Value references into native types still happens, and the native method still does real work on the calling thread; "no JSON round trip" isn\'t the same as "no cost at all."' }
      ],
      redFlags: `Describing bridge JSON serialization as "basically free" (it's real, measurable overhead, especially on high-frequency calls like scroll/gesture events); claiming JSI itself imposes the restricted TurboModule type vocabulary (that constraint comes from Codegen — raw JSI HostObjects can pass richer things like ArrayBuffers directly).`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-nm-fabric-vs-native-modules', track: 'rn', category: 'rn-native-modules',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'How is authoring a Fabric native component (a custom view) fundamentally different from authoring a native module — a different problem, or the same machinery wearing a different name?',
    answer: {
      core: `A native module exposes callable business logic — methods, no rendered UI, a TurboModule spec producing a JSI HostObject. A Fabric native component exposes a rendered VIEW that participates in the tree — it gets a Yoga layout pass, a <code>ComponentDescriptor</code>/<code>ShadowNode</code> pair, and gets measured and mounted like any built-in host component. They share the general new-arch build pipeline and Codegen tooling, but the spec shape and the native artifacts produced are genuinely different.`,
      mechanism: `A module spec (<code>TurboModuleRegistry.getEnforcing&lt;Spec&gt;(...)</code>) produces a callable-method protocol/abstract class. A component spec — typically <code>codegenNativeComponent&lt;NativeProps&gt;('MyCustomView')</code> wrapping a plain React component describing props — produces prop-config and <code>ComponentDescriptor</code>/<code>ShadowNode</code> scaffolding instead; your native implementation is a view class (an <code>RCTViewComponentView</code> subclass on iOS, a <code>ViewGroup</code>-descendant with its binding on Android), not a class implementing method calls. A real feature often needs both side by side: a camera SDK typically has a TurboModule for capture/torch/zoom control methods, and a separate Fabric native component for the live camera preview surface itself, coordinating through refs/native commands.`,
      tradeoffs: `Forcing one pattern to do both jobs is a common mistake — e.g. building a "module" that returns an opaque native view handle instead of a real Fabric component, which loses proper layout participation, measurement, and clean lifecycle management that a genuine ComponentDescriptor gives you for free.`,
      followups: [
        { q: 'Can a single feature legitimately need both a TurboModule and a Fabric component?', a: 'Commonly, yes — a camera SDK is the canonical example: capture/torch/zoom control methods are a TurboModule, while the live preview surface is a Fabric native component; the two are authored side by side and coordinate via refs or native commands.' },
        { q: 'What does the interop layer do differently for a legacy view manager vs. a legacy native module?', a: 'For a module it routes old-style NativeModules lookups onto the JSI-backed registry (still async, no type safety). For a view, it auto-generates a generic fallback ComponentDescriptor so the legacy view manager still renders under Fabric — but that generic fallback can\'t support custom shadow-node or measurement behavior the way a true Fabric component can.' }
      ],
      redFlags: `Calling a Fabric component "just a native module that happens to return a view" (it's a structurally different tree participant — ComponentDescriptor plus ShadowNode — not a callable-method spec); assuming Codegen emits the same artifact shape for both module and component specs.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-nm-expo-modules-api', track: 'rn', category: 'rn-native-modules',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'What is the Expo Modules API, and how does it differ from hand-authoring a TurboModule spec plus Codegen yourself?',
    answer: {
      core: `The Expo Modules API is a Swift/Kotlin-first DSL — a <code>ModuleDefinition</code> built from <code>Function</code>, <code>AsyncFunction</code>, <code>Constants</code>, <code>Events</code>, and <code>View</code> — that generates the TurboModule/Fabric plumbing directly from your native implementation, instead of you hand-writing a separate TS spec file for Codegen to turn into native protocols you then implement. It's become the modern default authoring path recommended for new native modules, and it isn't Expo-managed-only: a bare React Native app can adopt it by installing the lightweight <code>expo</code> package (which brings the autolinking/config-plugin infrastructure <code>expo-modules-core</code> relies on) — no EAS or the managed workflow required.`,
      mechanism: `<pre><code class="language-swift">public class DeviceInfoModule: Module {
  public func definition() -> ModuleDefinition {
    Name("DeviceInfo")
    Function("getModel") { () -> String in
      return UIDevice.current.model
    }
    AsyncFunction("getBatteryLevel") { () -> Double in
      return Double(UIDevice.current.batteryLevel)
    }
  }
}
</code></pre>
The DSL infers argument/return types from the Swift/Kotlin function signature itself rather than requiring a hand-maintained parallel TS spec file — the implementation IS the spec, removing an entire class of "spec and native impl silently drifted apart" risk. Under the hood it still compiles down to genuine TurboModules and Fabric native components (a <code>View(...)</code> definition produces a real Fabric component), and it includes its own old/new-architecture compatibility handling, so module authors don't have to hand-write the classic <code>TurboModuleRegistry ? ... : NativeModules</code> conditional themselves.`,
      tradeoffs: `Less native boilerplate and no separate spec-drift risk, at the cost of an additional dependency layer (Expo's DSL/runtime) sitting between your Swift/Kotlin code and the RN internals. A codebase that has other modules hand-authored via bare Codegen specs ends up mixing two authoring styles, which is a real (if usually minor) consistency cost for the team.`,
      followups: [
        { q: 'Does using the Expo Modules API require adopting Expo/EAS for the whole app?', a: 'No — a bare React Native app adopts it by installing the lightweight expo package (for autolinking/config-plugin support) alongside expo-modules-core, giving you the authoring DSL without adopting EAS build/update services or the managed workflow.' },
        { q: 'Does an Expo module produce a "real" TurboModule/Fabric component, or a separate abstraction living alongside them?', a: 'It compiles down to genuine TurboModules and Fabric native components under the hood — it\'s a nicer authoring layer on top of the same new-arch primitives, not a parallel bridge-like system running side by side with them.' }
      ],
      redFlags: `Describing the Expo Modules API as "Expo-only, unusable in a plain RN app" (false — a bare RN app can install the lightweight expo package plus expo-modules-core to get the DSL, with no EAS or managed-workflow requirement); assuming it bypasses TurboModules/Fabric entirely rather than generating them from your Swift/Kotlin code.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-nm-old-new-arch-interop', track: 'rn', category: 'rn-native-modules',
    difficulty: 'staff', type: 'deep-dive',
    prompt: 'You maintain a native module library used by apps on a mix of RN versions. What actually happens when a legacy NativeModule runs on a New Architecture app, and what does a library author do to support both?',
    answer: {
      core: `The interop layer intercepts old-style <code>NativeModules.Foo</code> lookups on a New Architecture app and routes them onto the same JSI-backed registry TurboModules use, so a legacy module keeps working — but only at legacy fidelity: still async-only, still no Codegen type safety, no sync methods. The direction is strictly one-way: a legacy module can ride the interop shim forward onto new arch, but a real TurboModule (registered purely via <code>TurboModuleRegistry.getEnforcing</code>) has no reverse path onto an old-architecture app — the registry it depends on simply isn't present there.`,
      mechanism: `The classic dual-registration pattern a library author writes to support both architectures from one package: <pre><code class="language-js">import { NativeModules, TurboModuleRegistry } from 'react-native';

const isTurboModuleEnabled = global.__turboModuleProxy != null;
const NativeDeviceInfo = isTurboModuleEnabled
  ? TurboModuleRegistry.getEnforcing('DeviceInfo')
  : NativeModules.DeviceInfo;

export default NativeDeviceInfo;
</code></pre>
On the native side, this typically means implementing both the legacy registration (<code>RCTBridgeModule</code> / <code>ReactContextBaseJavaModule</code>) and the generated TurboModule Spec base class in the same native class where feasible, gated by architecture-conditional build flags. Since RN 0.82, New Architecture can no longer even be disabled, but plenty of consumer apps still sit on versions below that where old-arch support genuinely matters for a library shipping today.`,
      tradeoffs: `Dual-path support is ongoing real maintenance cost — two registration paths, potentially two sets of native tests to keep green. Most actively maintained libraries have now dropped old-arch support outright given the mandatory 0.82 cutover, which shifts the interop conversation from "how do I support both" to "when is it safe to drop legacy support entirely."`,
      followups: [
        { q: 'Can a genuine TurboModule (JSI-only) run at all on an old-architecture app?', a: 'No — TurboModuleRegistry depends on the new native-module registry, which doesn\'t exist pre-New-Architecture. A library that wants old-arch support has to ship a real legacy NativeModules implementation alongside it; there\'s no downgrade shim in that direction.' },
        { q: 'With New Architecture mandatory since 0.82, is the old/new dual-registration pattern still worth writing today?', a: 'Only for libraries that must keep supporting consumer apps pinned below 0.82. For anything targeting 0.82+ exclusively, it\'s dead weight — most maintained libraries have shifted from "support both" to actively planning when to drop the legacy path.' }
      ],
      redFlags: `Assuming the interop layer works in both directions (it only carries legacy modules forward onto new arch, never new-only TurboModules backward onto old arch); calling a library "New Architecture supported" just because it doesn't crash, without checking whether it's actually running through the interop shim at reduced fidelity.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-nm-event-emitting', track: 'rn', category: 'rn-native-modules',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'How does a native module push events to JS — a sensor reading, a native SDK callback — instead of JS pulling via a method call, and how does that differ old arch vs. new?',
    answer: {
      core: `On the old arch, a module extends <code>RCTEventEmitter</code> (iOS) or emits through <code>DeviceEventManagerModule.RCTDeviceEventEmitter</code> (Android), calling <code>sendEventWithName:body:</code> / <code>emit(...)</code>, which the bridge serializes and delivers to any JS listener registered via <code>NativeEventEmitter</code>/<code>DeviceEventEmitter.addListener</code>. On new arch, eventing is a first-class part of the TurboModule/Fabric story, but the app-facing API is unchanged — <code>NativeEventEmitter</code> still works — it's now backed by direct JSI dispatch instead of bridge serialization, so the payload skips the JSON round trip and high-frequency emits (sensor data, scroll deltas) stop paying that tax.`,
      mechanism: `<pre><code class="language-js">import { NativeEventEmitter, NativeModules } from 'react-native';

const emitter = new NativeEventEmitter(NativeModules.DeviceInfo);
const subscription = emitter.addListener('batteryLevelDidChange', (level) => {
  console.log('battery:', level);
});

// cleanup — always required, on either architecture
subscription.remove();
</code></pre>
Emitting is inherently native-initiated and JS-received — there's no "caller" on the JS side waiting for a synchronous return, so this stays a push/subscribe model regardless of architecture; JSI's synchronous-call capability doesn't apply here the way it does to ordinary TurboModule methods. On iOS, an emitter module still needs a correct <code>supportedEvents</code> list and appropriate <code>requiresMainQueueSetup</code> handling if the emit call itself touches UIKit state.`,
      tradeoffs: `The architectural change here is entirely about overhead, not shape or synchronicity — the win from JSI is reduced serialization cost on high-frequency emitters, which is exactly the pattern (sensors, scroll, per-frame data) that stressed the old bridge hardest. The app-facing subscribe/unsubscribe contract, and its footguns, are unchanged.`,
      followups: [
        { q: 'Can an emitted event be synchronous, the way a TurboModule method can?', a: 'No — emitting is inherently native-initiated with JS as the receiver; there\'s no JS-side caller blocked waiting for a return value, so this remains a push/subscribe model on both architectures.' },
        { q: 'What\'s the most common production bug with native event emitters?', a: 'Forgetting to remove the JS-side subscription on unmount/cleanup — each remount adds another listener to the same native emitter, so screens that are gone keep receiving (and reacting to) events, a classic leak-and-duplicate-handler bug independent of architecture.' }
      ],
      redFlags: `Assuming NativeEventEmitter's JS-facing API changed for the New Architecture (it didn't — the improvement is underneath, in dispatch cost, not a new consumer-facing API); forgetting that high-frequency emitters were exactly the old bridge's weakest case, which JSI directly addresses.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-nm-blocking-main-thread', track: 'rn', category: 'rn-native-modules',
    difficulty: 'senior', type: 'spot-the-bug',
    prompt: 'A TurboModule method is declared synchronous for what looks like a "simple, fast" device-fingerprint lookup. Users report that the whole app — touches and animations, not just JS — freezes for a moment every time this screen mounts. Find the bug.',
    code: "// NativeDeviceInfo.ts (TurboModule spec)\nexport interface Spec extends TurboModule {\n  getDeviceFingerprint(): string; // declared SYNC — \"it's just reading a hash\"\n}\nexport default TurboModuleRegistry.getEnforcing<Spec>('DeviceInfo');\n\n// DeviceInfo.mm (iOS native implementation)\n- (dispatch_queue_t)methodQueue {\n  // BAD PRACTICE (but NOT the cause of this freeze): pins the module's\n  // ASYNC methods onto the main queue, copy-pasted from an unrelated\n  // method that legitimately touched UIKit. getDeviceFingerprint below is\n  // declared SYNC, and sync TurboModule methods bypass methodQueue\n  // entirely — they run directly, via JSI, on whichever thread calls them.\n  return dispatch_get_main_queue();\n}\n\n- (NSString *)getDeviceFingerprint {\n  // THE ACTUAL BUG: blocking disk read + CPU-heavy hash, done synchronously,\n  // on whatever thread this method happens to be CALLED FROM — here, the\n  // JS thread, since ProfileScreen invokes it during render.\n  NSData *certData = [NSData dataWithContentsOfFile:certPath];\n  NSString *hash = SHA256HashOfData(certData);\n  return hash; // caller blocks until this fully completes\n}\n\n// ProfileScreen.tsx — called on every mount\nfunction ProfileScreen() {\n  const fingerprint = NativeDeviceInfo.getDeviceFingerprint(); // blocks the JS thread — stalls JS-driven touch handling + state updates\n  // ...\n}",
    answer: "// DeviceInfo.mm — this methodQueue override doesn't affect the SYNC method below at all\n// (sync TurboModule methods bypass methodQueue and run on the calling thread via JSI).\n// It's still bad practice, though: it needlessly forces every ASYNC method on this module\n// onto the main thread. Remove it, or return a dedicated background queue, unless an\n// async method genuinely touches UIKit.\n\n- (NSString *)computeFingerprintSync {\n  NSData *certData = [NSData dataWithContentsOfFile:certPath];\n  return SHA256HashOfData(certData);\n}\n\n// The real fix: compute once, cache the result — repeat calls become free, so\n// the calling thread (JS, here) is never blocked on disk + hashing again.\n- (NSString *)getDeviceFingerprint {\n  static NSString *cached = nil;\n  static dispatch_once_t onceToken;\n  dispatch_once(&onceToken, ^{\n    cached = [self computeFingerprintSync];\n  });\n  return cached;\n}\n\n// Or, better still, make it genuinely async so no calling thread is ever blocked:\n// getDeviceFingerprint(): Promise<string>;  — resolved off the calling thread entirely.",
    explanation: "Two issues here, but only one of them is actually why this call freezes anything. First, methodQueue is overridden to return dispatch_get_main_queue() — that's still bad practice, since it needlessly forces every ASYNC (Promise/callback) method on this module onto the main thread, typically copy-pasted from a method that legitimately needed UIKit access. But getDeviceFingerprint is declared SYNCHRONOUS, and synchronous TurboModule methods bypass methodQueue entirely — they execute directly, via JSI, on whichever thread issues the call. methodQueue governs dispatch only for async methods; it has no say over where this sync method's body runs. So pinning methodQueue to main is not why this specific call stalls anything — it's a real bug worth fixing, just not this bug. Second — the actual cause — the method does blocking disk I/O plus a CPU-heavy hash directly in a synchronous method body, and ProfileScreen calls it during render, which runs on the JS thread. That blocks the JS thread for as long as the read+hash takes, stalling JS-driven touch handling (React's gesture responder system) and preventing state updates/re-renders from committing — which is what users perceive as the app \"freezing,\" even though the UI thread itself isn't necessarily blocked. (If this same synchronous method were instead called from a call site that already runs on the main thread — say, native code or a Reanimated worklet invoking it synchronously from the UI thread — then yes, the UI thread itself would stall; that's just not what's happening at this call site.) The fix is twofold: don't pin the whole module's queue to main unless an async method genuinely needs UIKit — a real but orthogonal issue, not this bug's cause — and don't do slow, uncached blocking work inside a synchronous method body at all: compute it once and cache it, or make it properly async (Promise-returning) so no calling thread, JS or otherwise, is ever blocked waiting on it."
  });

})();
