/* Practice challenges — RN Deep Dives: New Architecture & Internals */
(function () {
  var reg = window.PREP_SITE.registerChallenge;

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-arch-why-new-arch', track: 'rn', category: 'rn-architecture',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'Why does the New Architecture exist, and what actually broke or was limited under the legacy bridge that it fixes?',
    answer: {
      core: `The New Architecture (JSI + Fabric + TurboModules, running <strong>bridgeless</strong>) exists because the legacy bridge forced <em>every</em> JS↔native interaction through an async, batched, JSON-serialized message queue. That capped React Native in three concrete ways: no synchronous native calls, real serialization overhead on high-frequency traffic (gestures, scroll, layout reads), and no way for the renderer to participate in React 18's concurrent, interruptible rendering model — the bridge only knew how to dispatch one finished batch of mutations at a time.`,
      mechanism: `The legacy bridge (<code>RCTBridge</code>/<code>RCTCxxBridge</code>) ran a <code>MessageQueue</code> that batched calls at the end of each JS event-loop tick, turned every argument/return value into a JSON string, shipped it across, and deserialized it on the other side. The native-side <code>UIManager</code> owned the shadow tree and applied mutations only after that async round trip completed. There was no synchronous read path — even something like measuring a view's on-screen position required a callback, because JS had no direct memory access to anything native. <ul><li>Every native module call = JSON encode → queue → decode, even for tiny, latency-critical calls.</li><li>High-frequency events (scroll position, gesture deltas) could pile up behind a busy JS thread's batch boundary.</li><li>The shadow tree had no notion of "in-progress but discardable" work, so React's concurrent renderer (which needs to build and possibly throw away speculative render output) had nothing safe to hook into.</li></ul>`,
      tradeoffs: `For a lot of CRUD-shaped, list-and-form apps, the old bridge was "fine" — users never felt the JSON tax on a handful of infrequent native calls. The New Architecture's payoff is disproportionately large for animation/gesture-heavy apps, apps with many native modules, and apps that want React 18 concurrent features — and disproportionately small (but not zero, since it's now mandatory) for a simple CRUD app. Migration cost is real: it's not free just because the default flipped.`,
      followups: [
        { q: 'Give one concrete production example of the bridge breaking down.', a: 'A fling-gesture-driven animation stutters because the JS thread is busy with a re-render, delaying the JSON batch describing the next scroll offset to native — the animation has no path to run independent of the JS thread\'s batching cadence, unlike a Reanimated worklet on New Arch which runs directly on the UI thread via JSI.' },
        { q: 'Was the New Architecture experimental for years — when did it actually become the default?', a: 'It was opt-in starting around 0.68, became the default for new and upgraded projects in 0.76 (bridgeless by default), and as of 0.82 the legacy path can no longer even be re-enabled — the flags to opt out are simply ignored.' }
      ],
      redFlags: `"It's just faster" with no mechanism given; calling the New Architecture "experimental" or "opt-in" (wrong since 0.76, and impossible to disable since 0.82); describing Fabric as "a new component library" rather than a renderer.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-arch-jsi', track: 'rn', category: 'rn-architecture',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'What is JSI, concretely, and how does it let JS call native code synchronously? What does it unlock that the old bridge structurally could not?',
    answer: {
      core: `JSI (JavaScript Interface) is a C++ API embedded directly in the JS engine's runtime object (<code>jsi::Runtime</code>) that lets native code create/manipulate JS values in the JS heap, and lets JS hold references to native "HostObjects" and call their methods directly — in-process, no serialization, no message queue. TurboModules and Fabric are both built on top of it.`,
      mechanism: `JSI is engine-agnostic by design (Hermes, JSC, V8 can all host it). Native code exposes a <code>jsi::HostObject</code> with <code>get</code>/<code>set</code>/<code>getPropertyNames</code>, and JS code accesses it exactly like a normal JS object — except each property access invokes native C++ synchronously, on whatever thread made the call. Native can similarly expose callable <code>HostFunction</code>s. Because it's just references and function pointers into a shared runtime, JS and native can share memory instead of copying serialized snapshots of it back and forth:
<pre><code class="language-js">// Conceptually, what a JSI-backed synchronous storage API looks like from JS —
// no Promise, no bridge round trip, because the "get" call is a direct
// synchronous invocation into a native HostObject method.
import { MMKV } from 'react-native-mmkv';
const storage = new MMKV();
storage.set('token', 'abc123');
const token = storage.getString('token'); // returns synchronously
</code></pre>
Reanimated's shared values are the other canonical example: they're backed by JSI HostObjects that a UI-thread-bound worklet can read and mutate directly, without ever hopping back to the JS thread per frame.`,
      tradeoffs: `Sync calls run on whatever thread invoked them — call a slow HostFunction from the JS thread and you block the JS thread just as surely as a slow synchronous loop would. JSI removes the <em>forced</em> async-plus-serialization tax; it doesn't remove the need to think about threading, and not every native capability should be made synchronous just because JSI makes it possible (network calls, for example, should stay Promise-based).`,
      followups: [
        { q: 'How is a raw JSI HostObject different from a TurboModule?', a: 'A TurboModule is a specific, higher-level application of the JSI/HostObject pattern: a codegen-produced, typed spec with lazy registry lookup. A raw HostObject is the lower-level primitive TurboModules (and Fabric, and Reanimated) are all built out of.' },
        { q: 'Can a JSI call run on a background thread, not just the JS thread?', a: 'Yes — it\'s just a function invocation against the runtime; any thread that legitimately holds/owns the runtime context can invoke it. That\'s exactly how Reanimated worklets execute directly on the UI thread instead of hopping to the JS thread every frame.' }
      ],
      redFlags: `Calling JSI "a new bridge" (the whole point is that it replaces the message-passing/serialization model, not re-implements it); claiming JSI is React-specific (it's a generic C++ JS-engine-embedding API — the same idea is used to embed JSC/V8 in other non-RN host apps).`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-arch-fabric-internals', track: 'rn', category: 'rn-architecture',
    difficulty: 'staff', type: 'deep-dive',
    prompt: 'Walk through Fabric\'s internals: how does the C++ shadow tree work, and why does that specific design let concurrent-mode React run safely?',
    answer: {
      core: `Fabric moved the shadow tree — previously split across JS and a platform-specific <code>UIManager</code> (Java/ObjC) — into a single, cross-platform C++ core. Instead of mutating the existing tree in place, Fabric clones the shadow node(s) that changed (structural sharing, copy-on-write) to produce a new <em>immutable</em> tree, diffs it against the tree that's currently committed, and applies the resulting native view mutations in one atomic commit.`,
      mechanism: `Three phases: <strong>render → commit → mount</strong>.
<ul>
<li><strong>Render</strong> (JS thread): React's reconciler builds a candidate React Shadow Tree — structure and props only. No layout math happens here; this tree just describes what should exist, not where it should be positioned.</li>
<li><strong>Commit</strong> (background "shadow" thread): two things happen here. First, Yoga computes layout (flexbox) for the new tree, turning the props-only tree into one with concrete positions/sizes. Then the new tree is diffed against the previously committed tree, and a single pointer swap atomically promotes "next tree" to "current tree." Because the swap is atomic, any concurrent reader — a <code>measure()</code> call, another in-flight render — always sees either the fully-old or fully-new tree, never a half-built one.</li>
<li><strong>Mount</strong> (UI thread): the diff is applied to the actual host views (insert/remove/update).</li>
</ul>
Because the tree is a persistent, immutable data structure rather than something mutated node-by-node, multiple renders can be "in flight" simultaneously without corrupting each other — which is exactly the substrate React 18's concurrent renderer needs: it can build a render, pause it, throw it away, or resume it, and nothing reading the tree ever observes a torn/partial state.`,
      tradeoffs: `Real complexity cost: debugging requires knowing which tree "version" a given log or measurement corresponds to. Third-party native components written against the old Paper <code>UIManager</code> API don't automatically speak Fabric's <code>ShadowNode</code>/<code>ComponentDescriptor</code> model — hence the interop layer as a stopgap. For most app-level engineers, all of this is invisible; component-library authors are the ones who must actually port to Fabric's C++ types (often scaffolded by Codegen from a JS spec).`,
      followups: [
        { q: 'What is a ComponentDescriptor?', a: 'A per-component-type C++ factory that knows how to create, clone, and measure shadow nodes for a given native component. Codegen typically generates the boilerplate for it from a JS/TS component spec.' },
        { q: 'Why call the commit "atomic," and what would break without that guarantee?', a: 'Because promoting the new tree to "current" is a single pointer swap, no reader can ever observe a mix of old and new nodes. Without atomicity, a reader could dereference a tree that\'s partially updated — some nodes reflecting the new render, others stale — producing torn layouts or race conditions between the commit and mount threads.' }
      ],
      redFlags: `Describing Fabric as "just a faster React diffing algorithm" (it's a full renderer owning tree lifecycle and cross-thread safety, not a diffing optimization); claiming every native component must be rewritten from scratch for Fabric (the interop layer papers over much of this for components without custom shadow-node needs).`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-arch-turbomodules-vs-nativemodules', track: 'rn', category: 'rn-architecture',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'Mechanically, how do TurboModules differ from the legacy NativeModules system?',
    answer: {
      core: `Legacy NativeModules are <strong>eagerly</strong> instantiated at app startup (every registered module gets created whether or not it's ever used), untyped at the JS/native boundary, and always async. TurboModules are <strong>lazily</strong> instantiated on first access, have Codegen-produced statically typed bindings from a TS spec, and — because they're plain JSI HostObjects underneath — can optionally expose genuinely synchronous methods.`,
      mechanism: `<code>TurboModuleRegistry.getEnforcing&lt;Spec&gt;('ModuleName')</code> looks up — and lazily constructs — the native module the first time JS actually asks for it, replacing the old bridge's "instantiate every registered module up front" bootstrapping, which was a real, measurable startup-time cost on apps shipping 40-100+ native modules. Each module implements a Codegen-generated Spec interface (C++/ObjC/Kotlin) produced from a <code>NativeModuleName.ts</code> file, so a signature mismatch between JS call site and native implementation becomes a build-time error instead of a runtime crash a user discovers. Riding on JSI also means any given method <em>can</em> be declared synchronous when the semantics genuinely call for it — the old bridge special-cased a handful of "constants available synchronously at init" patterns; TurboModules generalize that to any method.`,
      tradeoffs: `Sync-capable doesn't mean everything should be sync — blocking the calling thread on slow native work is still bad regardless of architecture; reserve sync for fast, non-blocking native reads. Migrating a large legacy NativeModules surface is mechanical but not free: every method signature has to be re-expressed inside Codegen's supported type vocabulary, and arbitrary "just JSON.stringify whatever" shapes aren't allowed anymore.`,
      followups: [
        { q: 'What happens to an old NativeModule that hasn\'t been ported to a TurboModule spec, on New Architecture?', a: 'It runs through the interop layer, which adapts the old registration API onto the new JSI-backed registry — so it keeps working, but stays async-only and untyped, without codegen\'s compile-time guarantees.' },
        { q: 'Why does lazy instantiation matter for startup time specifically?', a: 'Eagerly constructing dozens of native modules at boot — many unused on the very first screen — is pure wasted CPU/memory during the most latency-sensitive part of the app\'s lifecycle. Lazy TurboModules only pay that cost the first time a module is actually touched.' }
      ],
      redFlags: `Saying "TurboModules are always synchronous" (false — sync is opt-in per method; most legitimately stay async/Promise-based); treating Codegen as optional glue you can skip while still calling something a TurboModule (the generated spec is the mechanism that makes it one).`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-arch-codegen', track: 'rn', category: 'rn-architecture',
    difficulty: 'core', type: 'deep-dive',
    prompt: 'What does Codegen actually generate, and from what input? Does it run on the device?',
    answer: {
      core: `Codegen is a <strong>build-time</strong> code generator. It reads a strongly-typed JS/TS "spec" file — a TurboModule spec, or a Fabric native-component spec — and emits the native-side interface code (shared C++, plus Objective-C++/Java/Kotlin glue) that the native implementation must then conform to. It never runs on the device.`,
      mechanism: `Spec files use a deliberately constrained TypeScript (or Flow) subset — numbers, strings, booleans, objects/arrays built from those, and callback shapes Codegen recognizes — so the generator can statically translate them into equivalent native type declarations:
<pre><code class="language-ts">// NativeStorage.ts — a minimal TurboModule spec
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  getString(key: string): string | null;
  setString(key: string, value: string): void;
}

export default TurboModuleRegistry.getEnforcing&lt;Spec&gt;('NativeStorage');
</code></pre>
Codegen runs as part of the build (invoked via the Gradle/CocoaPods build phase, integrated with RN's autolinking), producing generated headers/interfaces that the native implementation is checked against — a mismatched native method signature is now a compile-time error, not a silently-broken bridge call discovered in production.`,
      tradeoffs: `Because Codegen only understands a restricted type vocabulary, native module/component authors can no longer just pass "any JS shape" across the boundary — arbitrary or highly dynamic data has to be expressed as a well-known object type, or serialized explicitly. That's a real ergonomic constraint compared to the old NativeModules' effectively untyped JSON-anything freedom, traded for compile-time safety.`,
      followups: [
        { q: 'Does Codegen run at app runtime on the device?', a: 'No. It\'s strictly a build-time step; the compiled binary the device runs only ever contains the already-generated native glue code.' },
        { q: 'What are the two main artifacts Codegen produces specs for?', a: 'TurboModule native-module bindings, and Fabric native-component bindings (prop/view-config and ComponentDescriptor scaffolding).' }
      ],
      redFlags: `Confusing Codegen with Metro/Babel's JS transform step (Codegen is a separate native-code-generation build phase, not a JS bundler transform); claiming you still have to hand-write native glue for types Codegen already supports (the entire point is that you don't, for the covered type surface).`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-arch-bridgeless', track: 'rn', category: 'rn-architecture',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'What is bridgeless mode specifically, what does it remove, and since when has it been the default?',
    answer: {
      core: `Bridgeless mode removes the legacy <code>RCTBridge</code>/<code>RCTCxxBridge</code> object graph entirely — no <code>MessageQueue</code>, no per-frame batched JSON payloads, no <code>__fbBatchedBridge</code> global. Startup instead builds a JSI-native <code>ReactHost</code>/runtime setup where TurboModules and Fabric talk to JS directly through the JSI runtime. It's been the default for new and upgraded projects since RN 0.76 (Oct 2024), and as of RN 0.82 the legacy bridge path can no longer even be re-enabled — the old opt-out flags are simply ignored.`,
      mechanism: `Instead of constructing an <code>RCTBridge</code> that lazily wires NativeModules over a message queue, bridgeless RN constructs a <code>ReactHost</code>/<code>ReactInstance</code> that owns a JSI runtime directly. TurboModules register into a runtime-scoped registry, Fabric's C++ UIManager binding installs directly into that runtime, and anything that used to depend on bridge internals — some old debugging/inspector integrations, in-house native code that reached into <code>RCTBridge</code> directly rather than going through public APIs — breaks unless it goes through the interop shims (or gets rewritten).`,
      tradeoffs: `For the vast majority of app-level JS code, nothing observably changes — the public JS APIs are the same. The cost concentrates in libraries or in-house native code that poked at bridge internals directly, and in tooling: the classic Chrome remote debugger (which relied on bridge messages) doesn't work in bridgeless apps, which is why React Native DevTools (CDP-based, integrated with Hermes) became the default and recommended debugger starting at 0.76.`,
      followups: [
        { q: 'If bridgeless removes the bridge, how do legacy-style NativeModules still work at all?', a: 'Through the interop layer — a compatibility shim that emulates the old NativeModules registration API on top of the new TurboModule registry/JSI runtime, so old JS call sites keep working without the app author touching bridge internals.' },
        { q: 'What debugging tooling changed as a direct consequence of bridgeless?', a: 'Flipper\'s bridge-message-based inspection became unreliable/unsupported for New Arch apps; React Native DevTools replaced it as the default, built on the Chrome DevTools Protocol and integrated with Hermes.' }
      ],
      redFlags: `Saying bridgeless is "opt-in" or "experimental" (wrong since 0.76, and literally impossible to disable since 0.82); saying bridgeless "removes native modules" (it removes the bridge *transport*, not native modules themselves — they're still there, just accessed via TurboModules/JSI).`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-arch-thread-model', track: 'rn', category: 'rn-architecture',
    difficulty: 'core', type: 'deep-dive',
    prompt: 'Lay out React Native\'s thread model — JS, UI/main, Shadow/Yoga — and explain concretely what happens to the app when you block the JS thread.',
    answer: {
      core: `Three core roles run on real OS threads: the <strong>JS thread</strong> runs your React code, hooks, and business logic; the <strong>native UI/main thread</strong> owns the actual platform view hierarchy and raw touch input and must never be blocked; the <strong>Shadow thread</strong> computes layout via Yoga (flexbox), off the JS thread, so layout math doesn't compete with your render logic. New Architecture adds more legitimate off-JS-thread work (Fabric's background render/commit work, Reanimated worklets running directly on the UI thread) without collapsing this split.`,
      mechanism: `An event (touch, timer, JS-driven state update) is routed to the JS thread to run your handlers/reducers, which produces a new shadow tree computed by Yoga on the Shadow thread, and the resulting native view mutations are applied on the UI thread. If the JS thread is busy — a slow synchronous loop, an expensive re-render, a big <code>JSON.parse</code> — new state updates and touch-driven logic queue up behind it. Critically, the UI thread can still render whatever was last committed, and can still respond to native-driven work that doesn't need a per-frame JS decision: a <code>ScrollView</code>'s native momentum scrolling, or a Reanimated worklet-driven animation living entirely on the UI thread, both keep running. What stalls is anything that genuinely needs the JS thread to decide something — an <code>onPress</code> handler's logic, a state-driven UI change.`,
      tradeoffs: `This is why "my animation is janky" and "my UI is unresponsive to taps" are different bugs with different fixes: an animation should be moved off the JS thread (Reanimated worklets, or the old <code>Animated</code> native driver) so a busy JS thread can't stall it; a genuinely slow synchronous JS computation should be chunked, deferred (<code>InteractionManager</code>, <code>startTransition</code>), or moved to a native module — not "fixed" by touching the renderer.`,
      followups: [
        { q: 'Does the New Architecture add or remove threads?', a: 'It doesn\'t collapse the JS/UI/Shadow split. Fabric\'s C++ core makes it easier to run render/commit work off the JS thread, and lets Reanimated worklets execute directly on the UI thread via JSI — effectively adding more legitimate off-JS-thread work rather than reducing the number of threads involved.' },
        { q: 'What is InteractionManager for, in this model?', a: 'It defers non-urgent JS-thread work (e.g. heavy setup after navigation) until in-flight animations/interactions finish, so that work doesn\'t compete with time-sensitive JS-thread work for the same single thread.' }
      ],
      redFlags: `Saying RN "is single-threaded" as if that describes the whole app — JS execution is single-threaded, but the runtime spans several native threads; claiming blocking JS always freezes the entire screen (native-driven work like Reanimated worklets or OS-level scrolling can keep running).`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-arch-hermes', track: 'rn', category: 'rn-architecture',
    difficulty: 'core', type: 'deep-dive',
    prompt: 'Why does React Native use Hermes by default, and what\'s actually happening under the hood that makes it start faster than JSC?',
    answer: {
      core: `Hermes is a JS engine purpose-built for RN's constraints — mobile-scale binaries, cold-start sensitivity, tight memory budgets — rather than a general-purpose browser engine. Its headline advantage: it compiles JS to bytecode <strong>ahead of time, at build</strong>, so the shipped app loads precompiled bytecode instead of raw JS source, skipping the on-device parse+compile step JSC/V8 must do on every cold start. It's been the default engine since RN 0.70, and ships by default alongside the rest of the New Architecture from 0.76 on.`,
      mechanism: `At build time, the JS bundle is compiled to Hermes Bytecode (HBC) by <code>hermesc</code> — a real ahead-of-time compilation pass, not just minification — so on-device startup loads and executes bytecode directly with no JS parse phase. On memory: Hermes' default GC is <strong>Hades</strong>, a mostly-concurrent, generational collector — young objects still use a fast semi-space copying scheme, but old-generation collection happens on a background thread instead of the classic stop-the-world pause that Hermes' earlier GenGC used, cutting p99 GC pause times dramatically versus GenGC. Separately, <strong>Hermes V1</strong> is a rewritten Hermes compiler, bytecode format, and VM — better JS/TS language coverage and performance than the original Hermes — and has been the <em>default</em> JS engine for all RN apps since RN 0.84 (Feb 2026); it is not opt-in or experimental. Hermes V1 is distinct from <strong>Static Hermes</strong>, a separate, still-unshipped, research-stage effort to ahead-of-time-compile a typed JS subset down to native machine code — Hermes V1 doesn't include or imply Static Hermes, which hasn't shipped.`,
      tradeoffs: `Bytecode precompilation trades build time for runtime startup speed — you pay the compile cost once at build, not on every device at every install/launch. Hermes' JS feature coverage can lag brand-new/proposal-stage syntax slightly compared to evergreen JSC/V8, though in practice this rarely bites typical RN app code once it's gone through Metro/Babel's transform step anyway.`,
      followups: [
        { q: 'Does Hermes bytecode mean you no longer need Babel/Metro?', a: 'No — Metro/Babel still transpile modern JS/TS/JSX down to a Hermes-compatible subset first; hermesc then compiles that output into HBC bytecode as a separate, later build step.' },
        { q: 'What GC does Hermes use today, and why does RN specifically care?', a: 'Hades — a mostly-concurrent generational GC that offloads most old-generation collection work to a background thread. RN cares because a long stop-the-world GC pause on the JS thread shows up directly as dropped frames/jank, which is exactly what Hades\' concurrent design targets.' }
      ],
      redFlags: `Saying "Hermes is just a smaller JSC" (different engine/codebase entirely, different bytecode format and GC); claiming Hermes bytecode compilation happens on-device at runtime (it happens at build time — the device only ever loads already-compiled bytecode).`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-arch-interop-layer', track: 'rn', category: 'rn-architecture',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'What is the New Architecture\'s interop layer, and what breaks (or silently degrades) when a library relies on it instead of being a true Fabric/TurboModule citizen?',
    answer: {
      core: `The interop layer is a compatibility shim that lets old-style ("Paper"/legacy) native modules and native components keep working, largely unmodified, in an app running on the New Architecture. It's what makes "most popular libraries already work on New Arch" true even before a given library's maintainers have done a real Fabric/TurboModule port.`,
      mechanism: `For native <em>modules</em>, the interop layer intercepts old-style <code>NativeModules.Foo</code> lookups and routes them onto the same JSI-backed registry TurboModules use — JS call sites don't change, but the module itself still behaves like a legacy module underneath: async-only, no real synchronous path, no Codegen type safety. For native <em>components</em>, Fabric needs a <code>ComponentDescriptor</code>/<code>ShadowNode</code> per native view type — the interop layer auto-generates a generic fallback descriptor for legacy view managers so they still render, but that fallback can't expose custom shadow-node behavior (components needing custom measurement/layout logic) and doesn't support full participation in concurrent-rendering guarantees the way a genuine Fabric component does.`,
      tradeoffs: `The interop layer buys migration time — an app can flip to New Architecture even with some unmigrated dependencies — but it's explicitly a stopgap: it doesn't unlock the New Architecture's actual benefits (no sync calls, no shared memory, no custom shadow-node behavior) for whatever's still routed through it. Meta has been explicit that the interop layer does not support custom Shadow Nodes or full concurrent-feature participation, so an app can be "on New Arch" at the flag level while its most performance-critical native component is still effectively running old-arch semantics underneath.`,
      followups: [
        { q: 'If my app enables New Architecture and everything still works, have I gotten all the benefits?', a: 'Not necessarily. Anything still routed through the interop layer keeps old-arch semantics — async-only, no custom shadow node — so the platform capability is unlocked, but individual dependencies may not actually be using it.' },
        { q: 'How would you check whether a critical dependency is a true Fabric/TurboModule citizen versus riding the interop layer?', a: 'Check the library\'s own New-Architecture support documentation/changelog for an explicit Fabric component or TurboModule spec, or a community New-Architecture-support tracking page; the absence of a Codegen spec file in the library is a strong signal it\'s still on the interop path.' }
      ],
      redFlags: `Assuming the "New Architecture" toggle alone guarantees every dependency now behaves synchronously/concurrently (false — it's per-library, depending on real migration work, not just the app-level flag); treating the interop layer as a permanent solution rather than a bridge to finish migrating off of.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-arch-concurrent-react', track: 'rn', category: 'rn-architecture',
    difficulty: 'staff', type: 'deep-dive',
    prompt: 'Concretely, how does the New Architecture make React 18 concurrent features (Suspense, transitions, automatic batching) actually work in React Native, when the old architecture structurally couldn\'t support them?',
    answer: {
      core: `React 18's concurrent renderer needs to start rendering a tree of work, pause it, discard it, or resume it later, without ever exposing a half-finished tree to anything reading it. The old bridge/<code>UIManager</code> model had no such concept — mutations were dispatched immediately, one JSON batch at a time. Fabric's immutable, cloned shadow tree with an atomic commit step gives React's concurrent renderer exactly the substrate it needs: a candidate tree can be built off to the side, and only the atomic commit ever makes it visible, so speculative/interruptible rendering is safe.`,
      mechanism: `React's reconciler produces fiber work that the scheduler can pause/resume (time-slicing by priority); on RN, that reconciliation output becomes <code>ShadowNode</code> mutations against Fabric's C++ tree. Because Fabric never mutates a node in place — it clones and relinks — an in-progress or ultimately-discarded render never corrupts what other threads (a <code>measure()</code> call, another queued render) are reading. <code>startTransition</code>, <code>useDeferredValue</code>, and Suspense boundaries all depend on the renderer being able to keep the currently-committed UI on screen while a lower-priority update is prepared — and possibly thrown away — which requires exactly this non-destructive, commit-then-swap model. Automatic batching itself is <em>not</em> something Fabric or JSI unlocks — it's a React-core scheduler feature that coalesces multiple state updates (from event handlers, promises, timeouts, anything) into a single re-render, and it works identically in React DOM with no bridge or Fabric involved. What Fabric specifically contributes to the concurrent story is the atomic-commit model that makes concurrent rendering safely interruptible and discardable in the first place — since the shadow tree is never mutated in place, a render can be paused, thrown away, or resumed without ever exposing a torn tree to anything reading it.`,
      tradeoffs: `Mostly invisible to app code — you <code>import { startTransition } from 'react'</code> and it works on New Arch. But it also means concurrent features are effectively unavailable or unreliable for whatever UI is still running through the interop layer (legacy components without a true Fabric <code>ComponentDescriptor</code>), since those don't get the same atomic-tree guarantees for their own internal state.`,
      followups: [
        { q: 'What would happen trying to run React 18 concurrent features against the old bridge architecture?', a: 'RN gated this in practice — old-architecture apps got a React 18 "compatibility" mode without true concurrent rendering, because the bridge\'s synchronous-dispatch-per-JSON-batch model has no safe way to represent an interruptible, discardable render.' },
        { q: 'Does enabling New Architecture automatically mean my app benefits from concurrent rendering today?', a: 'It makes concurrent rendering possible, but you still have to opt into the concurrent APIs yourself (Suspense boundaries, transitions) in your own code — New Arch is necessary infrastructure, not a free performance switch on its own.' }
      ],
      redFlags: `Vaguely saying "Fabric is what makes React fast" without naming the mechanism (it's specifically the immutable-tree/atomic-commit design giving React 18's interruptible renderer a safe substrate); implying concurrent React "runs on the UI thread" (reconciliation is still JS-thread work — what changes is that Fabric lets that work be safely spread across time/priorities).`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-arch-legacy-gotchas', track: 'rn', category: 'rn-architecture',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'React Native has been "New Architecture by default" since 0.76 — so what actually still trips people up during migration, or still behaves like the old architecture underneath?',
    answer: {
      core: `The flag being on doesn't mean every code path is actually running New-Arch semantics. The recurring gotchas cluster around the interop layer, stale third-party native code, and in-house native modules that reached into bridge internals directly — plus tooling (older Flipper plugins, some profilers) that assumed bridge internals which no longer exist.`,
      mechanism: `Concretely:
<ul>
<li>Dependencies without a Fabric <code>ComponentDescriptor</code> fall back to the generic interop view manager, silently losing custom shadow-node/measurement behavior.</li>
<li><code>NativeEventEmitter</code> usage patterns that directly touched <code>RCTBridge</code>/<code>RCTEventEmitter</code> internals (common in older in-house native modules) can break outright, since those bridge objects don't exist in bridgeless mode.</li>
<li>"Fake sync" patterns that relied on constants cached at bridge-init time still work via the interop layer, but don't get the real synchronous JSI call path — worth re-auditing once a module is actually ported.</li>
<li>Debugging/perf instrumentation that hooked <code>__fbBatchedBridge</code> or similar bridge globals silently stops firing, with no obvious error.</li>
<li>Codegen's restricted type vocabulary means previously "loose" NativeModule signatures (arbitrary-shaped return objects) need to be re-expressed once a module actually moves off the interop layer onto a real TurboModule spec.</li>
</ul>`,
      tradeoffs: `For a pure app-code migration with well-maintained dependencies and no custom native modules, the 0.76+ upgrade is often nearly invisible. The pain concentrates in in-house native modules/components and dependencies that haven't done a real Fabric/TurboModule port — exactly the set of things "New Architecture is default" doesn't automatically fix for you.`,
      followups: [
        { q: 'How do you audit a large app to verify New Architecture is fully effective, not just enabled?', a: 'Inventory every native module/component, check each third-party dependency\'s New-Arch support status/changelog, grep in-house native code for direct bridge-object usage (RCTBridge, RCTEventEmitter internals, __fbBatchedBridge), and check debugging/perf tooling for bridge-message assumptions.' },
        { q: 'Since New Architecture is now mandatory as of a certain version, what\'s the real forcing function for teams still lagging?', a: 'RN 0.82 removed the ability to disable New Architecture at all — the old opt-out flags are ignored — so any app that wants to stay on a supported RN version has to actually close interop-layer gaps rather than defer them indefinitely.' }
      ],
      redFlags: `Assuming "New Architecture enabled" means every native dependency is fully migrated (many keep working only via the interop shim); treating a green build with no crashes as proof of full migration, rather than checking for interop fallbacks and silently-lost capabilities (custom shadow nodes, sync calls).`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-arch-migration-strategy', track: 'rn', category: 'rn-architecture',
    difficulty: 'staff', type: 'deep-dive',
    prompt: 'You inherit a large app (100+ screens, several in-house native modules, a dozen third-party native dependencies) still effectively running legacy-architecture behavior. How do you decide whether/when to migrate, and how do you sequence it?',
    answer: {
      core: `Given New Architecture is mandatory as of RN 0.82 (and has been default since 0.76), "whether" is largely already settled — it's forced by the RN version the app must eventually sit on to keep receiving security and OS-compatibility updates. The actual decision is <em>when and how to sequence</em> the migration to bound risk, not whether to do it at all.`,
      mechanism: `A concrete sequencing plan:
<ol>
<li><strong>Baseline &amp; audit</strong>: pin the current RN version, then categorize every native module/component — in-house and third-party — as (a) already Fabric/TurboModule-ported, (b) interop-compatible with no capability loss that matters, (c) interop-compatible but losing something needed (custom shadow node, sync calls), or (d) broken/unmaintained.</li>
<li><strong>De-risk the unknowns first</strong>: spike a Fabric/TurboModule port of category (c)/(d) items — especially in-house native modules — in isolation, before touching the main app. That's where silent breakage (interop fallbacks, direct bridge-internal usage) hides.</li>
<li><strong>Branch, don't flip on main</strong>: enable the architecture in a branch behind CI, run the full test suite, and manually verify the highest-traffic and most native-module-dependent screens (camera, payments, biometrics, maps) since interop gaps bite hardest there.</li>
<li><strong>Stage the rollout</strong>: beta/internal track before general release, watching crash reporting specifically for new native-crash signatures — bridge-internal assumptions breaking is a common source of a small tail of new native crashes.</li>
<li><strong>Sequence dependency upgrades alongside the flag flip</strong>: a large share of "New Arch broke my app" reports are actually stale dependency versions that hadn't shipped their own Fabric/TurboModule port yet, not RN itself.</li>
</ol>`,
      tradeoffs: `Rushing straight to "flip the flag and see what breaks" on a large app front-loads risk into production incident response. Over-indexing on "wait until every dependency is perfectly migrated" risks getting stuck on an unsupported RN version, since 0.82+ removed the legacy fallback entirely. For most large apps the right call is a time-boxed spike-then-branch approach with a hard internal deadline — the cost of staying behind compounds (security patches, OS compatibility requirements, hiring against a frozen legacy stack).`,
      followups: [
        { q: 'What\'s the single riskiest category of dependency in this kind of migration?', a: 'In-house native modules/components written years ago that reach into bridge internals directly — RCTBridge, custom event emitters, cached-constant "fake sync" patterns — rather than through public APIs. There\'s no upstream maintainer to do that port for you.' },
        { q: 'How do you get stakeholders to prioritize this over feature work?', a: 'Frame it as a forced timeline, not a preference — RN 0.82+ makes the legacy path unavailable at all, so staying on an old RN version indefinitely means falling behind on OS-compatibility requirements and security patches, which is a business risk, not just tech debt.' }
      ],
      redFlags: `Treating this as a binary "migrate or don't" decision when the real lever is sequencing and bounding risk; assuming flipping the flag is the finish line rather than the start of verifying each dependency actually got the New Architecture's benefits instead of just "still working" via the interop layer.`
    }
  });

})();
