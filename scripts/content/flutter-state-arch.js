window.PREP_SITE.registerTopic({
  id: "flutter-state-arch",
  module: "flutter",
  title: "State, Navigation & Platform",
  estimatedReadTime: "34 min",
  tags: ["flutter","state-management","provider","riverpod","bloc","go_router","platform-channels","ffi","testing"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">All Flutter state tools sit on <strong>InheritedWidget + Listenable/Stream</strong>; keep ephemeral state in setState, pick Provider / Riverpod / Bloc by scale and testability, route with go_router, and cross to native via channels (async, ≈ bridge), Pigeon (typed, ≈ codegen) or FFI (sync, ≈ JSI).</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>State ladder:</strong> setState → lift up → InheritedWidget → Provider + ChangeNotifier → Riverpod / Bloc. Climb only when the lower rung hurts. React map: InheritedWidget ≈ Context, Provider ≈ Context + a store, Riverpod ≈ Jotai/Recoil + React Query, Bloc ≈ Redux with async handlers as reducers.</li>
    <li><strong>InheritedWidget</strong>: O(1) lookup, per-element dependency, <code>updateShouldNotify</code> veto; ≈ React Context.</li>
    <li><strong>Provider</strong>: <code>watch</code>/<code>select</code> in build, <code>read</code> in callbacks; <code>create</code> owns lifecycle, <code>.value</code> doesn't.</li>
    <li><strong>Riverpod</strong>: providers outside the tree, compile-safe, <code>AsyncValue</code>, <code>family</code>, <code>autoDispose</code>, overrides in tests; API differs across major versions — check docs.</li>
    <li><strong>Bloc</strong>: events → handlers → emitted states; equal states are skipped; concurrency transformers ≈ saga takeLatest; <code>bloc_test</code>.</li>
    <li><strong>Pick by scale and testability, not hype:</strong> Provider for simple apps, Riverpod for compile-safe DI + async caching, Bloc for strict event-driven flows and large teams — and use one consistently.</li>
    <li><strong>Effects vs state:</strong> dialogs, snackbars and navigation go in listeners (<code>BlocListener</code>, <code>ref.listen</code>), never in build.</li>
    <li><strong>Navigation:</strong> Navigator 1 imperative (≈ <code>navigation.navigate</code>); Navigator 2 declarative pages; go_router = URL routes + redirect guards + StatefulShellRoute tabs; deep links need native config and URL-reconstructible pages. go_router ≈ Expo Router / React Navigation linking.</li>
    <li><strong>Pushed routes are not children of the pushing screen</strong> → ProviderNotFoundException; provide above MaterialApp or use <code>.value</code>.</li>
    <li><strong>Platform:</strong> MethodChannel (async, untyped, platform main thread), EventChannel (streams), Pigeon (typed codegen), FFI (sync C, block the isolate), platform views (native UI, costly).</li>
    <li><strong>Testing:</strong> unit + many widget tests (headless, fake time) + few goldens + few integration/Patrol flows on device. RN map: widget tests ≈ React Native Testing Library, <code>integration_test</code> ≈ Detox/Maestro.</li>
    <li><strong>Flutter vs RN:</strong> team skills, UI style, brownfield, OTA, platform targets, hiring — performance rarely decides it now.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Triggering side effects from build</strong> — showing the "Booking cancelled" dialog inside a BlocBuilder builder or a Consumer's build shows it on every rebuild (and can stack dialogs). Fix: put one-off effects in BlocListener / <code>ref.listen</code>, keep builders pure. (Runner-up: mutating a list in a Bloc state and re-emitting — equal state, no rebuild.)</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Every Flutter state library is InheritedWidget for lookup plus a Listenable or Stream for change — so I keep ephemeral state in setState and choose Riverpod or Bloc for shared state based on testability and team size."</div>
  <div class="revision-say">"Platform channels are Flutter's version of RN's old bridge — async and stringly typed — so I use Pigeon for typed codegen, and FFI when I need synchronous calls into C, like JSI."</div>
  <div class="revision-say">"I'd pick Flutter versus React Native on team skills, UI style, brownfield and OTA needs — not raw performance, because both are fast when built well."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>Why Flutter has "so many" state solutions</h3>
<p>The framework ships only primitives (<code>setState</code>, <code>InheritedWidget</code>, <code>ChangeNotifier</code>, <code>ValueNotifier</code>, <code>Stream</code>) and deliberately leaves architecture to packages — the same way React ships <code>useState</code> + Context and leaves Redux/Zustand/React Query to the ecosystem. The Flutter docs list many options; in industry three dominate: <strong>Provider</strong>, <strong>Riverpod</strong>, <strong>Bloc</strong> (plus GetX in some codebases, often viewed critically in interviews for mixing DI, routing and state with global access).</p>

<h3>React ↔ Flutter state map</h3>
<table>
  <thead><tr><th>React / RN</th><th>Flutter</th><th>Where the analogy breaks</th></tr></thead>
  <tbody>
    <tr><td><code>useState</code></td><td><code>setState</code> in a State</td><td>Mutate fields then call setState; no immutable snapshot per render.</td></tr>
    <tr><td>Context</td><td><code>InheritedWidget</code></td><td>Consumers subscribe per-element; <code>updateShouldNotify</code> lets the provider veto notifications.</td></tr>
    <tr><td>Context + <code>useReducer</code></td><td>Provider + <code>ChangeNotifier</code></td><td>ChangeNotifier is a mutable object that calls <code>notifyListeners()</code>.</td></tr>
    <tr><td>Zustand / Jotai</td><td>Riverpod</td><td>Providers are global <em>declarations</em> but state lives in a <code>ProviderContainer</code>/<code>ProviderScope</code>, so it's overridable in tests.</td></tr>
    <tr><td>React Query / RTK Query</td><td>Riverpod <code>FutureProvider</code>/<code>AsyncNotifier</code> (AsyncValue)</td><td>Caching/invalidation is simpler; no built-in stale-while-revalidate policies like React Query (check current docs).</td></tr>
    <tr><td>Redux / Redux-Saga</td><td>Bloc</td><td>Bloc handlers are async functions per event type with built-in concurrency transformers; state is a stream.</td></tr>
    <tr><td><code>useSyncExternalStore</code> + selector</td><td><code>context.select</code>, <code>BlocSelector</code>, <code>ref.watch(p.select(...))</code></td><td>Same idea: rebuild only when a slice changes.</td></tr>
  </tbody>
</table>

<h3>Why navigation got a second API</h3>
<p>Navigator 1 is an imperative stack: great for apps, awkward for the web URL bar, deep links and "the route stack should be a function of auth state". Navigator 2 (<code>Router</code> + <code>Navigator.pages</code>) made routing declarative but is verbose. <strong>go_router</strong> (a Flutter-team package) wraps Navigator 2 with a URL-first API — this is what most new apps use, alongside alternatives like auto_route.</p>

<h3>Why platform interop matters more than you'd expect</h3>
<p>Because Flutter draws its own UI, anything the OS owns — Bluetooth, NFC, biometrics, kiosk mode, MDM policies, background services, native SDKs — needs a plugin or your own channel. Senior interviews (and FDE work) often involve exactly this: a customer device feature that no plugin covers.</p>

<h3>Flutter vs React Native — the decision</h3>
<table>
  <thead><tr><th>Factor</th><th>Favours Flutter</th><th>Favours React Native</th></tr></thead>
  <tbody>
    <tr><td>Team skills</td><td>Greenfield team, or Android/Kotlin devs comfortable with typed OO</td><td>Existing React/TS web team; code + people shared with web</td></tr>
    <tr><td>UI</td><td>Custom, brand-heavy, pixel-identical across platforms; heavy custom animation/drawing</td><td>Must look and behave exactly native; heavy use of native UI components</td></tr>
    <tr><td>Performance profile</td><td>AOT code, no bridge, predictable rendering (Impeller)</td><td>New architecture (JSI/Fabric) closes most gaps; JS thread still single</td></tr>
    <tr><td>Brownfield</td><td>Add-to-app is supported but each engine has memory cost</td><td>Easier incremental adoption inside native apps</td></tr>
    <tr><td>OTA updates</td><td>No first-party code push (third-party options exist; check current status and store rules)</td><td>Mature OTA (EAS Update, CodePush successors)</td></tr>
    <tr><td>Web / desktop</td><td>Same codebase targets web, Windows, macOS, Linux, embedded</td><td>Web via react-native-web; desktop via Microsoft forks</td></tr>
    <tr><td>Ecosystem</td><td>pub.dev, strong first-party packages</td><td>npm — larger, plus web libraries usable directly</td></tr>
    <tr><td>Hiring</td><td>Smaller but growing pool</td><td>Large JS/React pool</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Picture 1 — the state ladder</h3>
<div class="diagram">
<pre>
 scope of state          tool                                  RN analogue
 ──────────────          ────                                  ───────────
 one widget              setState / ValueNotifier              useState
 parent + children       lift state up, pass callbacks         lift state up
 subtree                 InheritedWidget / InheritedNotifier   Context
 app-wide, simple        Provider + ChangeNotifier             Context + useReducer
 app-wide, async/DI      Riverpod (Notifier, AsyncNotifier)    Zustand + React Query
 app-wide, event-driven  Bloc / Cubit                          Redux (+ saga/thunk)

 Climb only when the lower rung hurts. Ephemeral UI state (tab index, text field,
 hover, animation) almost always stays in setState even in Bloc/Riverpod apps.
</pre>
</div>

<h3>Picture 2 — how InheritedWidget notifies</h3>
<div class="diagram">
<pre>
  AuthScope (InheritedWidget, user = A)
   ├─ Header  ── dependOnInheritedWidgetOfExactType&lt;AuthScope&gt;()  → registered dependent
   └─ Body
       └─ Avatar ── AuthScope.of(context)                         → registered dependent

  parent rebuilds AuthScope with user = B
     → updateShouldNotify(old) returns old.user != user  → true
     → ONLY Header and Avatar elements are marked dirty (didChangeDependencies + build)
     → Body is NOT rebuilt unless its own parent rebuilt it
</pre>
</div>
<p>Provider is a convenience layer over this: <code>ChangeNotifierProvider</code> = an InheritedWidget whose value is a listenable, which marks dependents dirty when <code>notifyListeners()</code> fires.</p>

<h3>Picture 3 — Bloc vs Riverpod data flow</h3>
<div class="diagram">
<pre>
 BLOC                                         RIVERPOD
 ────                                         ────────
 UI ──add(CancelPressed(id))──► Bloc           UI ──ref.read(p.notifier).cancel(id)──► Notifier
                                 │ on&lt;Event&gt;                                            │ state = ...
                                 ▼                                                      ▼
                         emit(State)                                     ProviderContainer notifies
                                 │                                                      │
 BlocBuilder / BlocListener ◄────┘ (Stream&lt;State&gt;)   ConsumerWidget ref.watch(p) ◄─────┘
                                                      other providers ref.watch(p) recompute
 Strengths: explicit events, traceable,       Strengths: compile-safe DI, derived/async state,
 concurrency transformers, bloc_test          no BuildContext needed, auto-dispose, overrides
</pre>
</div>

<h3>Picture 4 — platform channel round-trip</h3>
<div class="diagram">
<pre>
 Dart (UI isolate)                 Engine                    Android (Kotlin) / iOS (Swift)
 ────────────────                  ──────                    ───────────────────────────────
 await channel.invokeMethod(
   'setKioskMode', {'on': true})
    │ encode (StandardMessageCodec → bytes)
    └──────────────────────────────►│ BinaryMessenger ──────► platform thread handler
                                    │                          call.method / call.arguments
                                    │◄── result.success(true) / result.error(...) ──┘
    ◄── decode, complete Future ────┘
 Async only. Types: null, bool, num, String, Uint8List/typed lists, List, Map.
 FFI path: Dart ── direct C ABI call (sync, same thread) ──► C/C++/Rust/ObjC/JNI-bridged lib
</pre>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. InheritedWidget by hand (know it, rarely write it)</h3>
<pre><code class="language-dart">class AuthScope extends InheritedWidget {
  const AuthScope({super.key, required this.user, required super.child});
  final User? user;

  static User? of(BuildContext context) =&gt;
      context.dependOnInheritedWidgetOfExactType&lt;AuthScope&gt;()?.user;   // subscribes

  static User? peek(BuildContext context) =&gt;
      context.getInheritedWidgetOfExactType&lt;AuthScope&gt;()?.user;        // no subscription

  @override
  bool updateShouldNotify(AuthScope old) =&gt; old.user != user;
}</code></pre>
<p>Lookup is O(1) (each element carries a map of inherited widgets above it). Use <code>InheritedNotifier</code> to bind it to a <code>Listenable</code>, and <code>InheritedModel</code> for aspect-based subscriptions (this is how <code>MediaQuery.sizeOf</code> avoids rebuild storms).</p>

<h3>2. ValueNotifier / ChangeNotifier without packages</h3>
<pre><code class="language-dart">class CheckInController extends ChangeNotifier {
  CheckInController(this._api);
  final BookingApi _api;
  bool _checkedIn = false;
  bool _busy = false;
  bool get checkedIn =&gt; _checkedIn;
  bool get busy =&gt; _busy;

  Future&lt;void&gt; checkIn(String bookingId) async {
    _busy = true; notifyListeners();
    try {
      await _api.checkIn(bookingId);
      _checkedIn = true;
    } finally {
      _busy = false; notifyListeners();
    }
  }
}

// scoped rebuild without any library
ListenableBuilder(
  listenable: controller,
  builder: (context, _) =&gt; FilledButton(
    onPressed: controller.busy ? null : () =&gt; controller.checkIn(booking.id),
    child: Text(controller.checkedIn ? 'Checked in' : 'Check in'),
  ),
);</code></pre>

<h3>3. Provider</h3>
<pre><code class="language-dart">void main() =&gt; runApp(
  MultiProvider(
    providers: [
      Provider&lt;BookingApi&gt;(create: (_) =&gt; BookingApi(http.Client(), env.baseUrl)),
      ChangeNotifierProvider(create: (ctx) =&gt; CheckInController(ctx.read&lt;BookingApi&gt;())),
    ],
    child: const App(),
  ),
);

// in widgets
final c = context.watch&lt;CheckInController&gt;();                 // rebuild on any notify
final busy = context.select&lt;CheckInController, bool&gt;((c) =&gt; c.busy); // rebuild only if busy changes
onPressed: () =&gt; context.read&lt;CheckInController&gt;().checkIn(id); // no subscription — use in callbacks</code></pre>
<p>Rule: <code>watch</code>/<code>select</code> in <code>build</code>, <code>read</code> in callbacks. Using <code>read</code> in build means you never update; using <code>watch</code> in a callback asserts.</p>

<h3>4. Riverpod</h3>
<p>Riverpod (same author as Provider) moves providers <em>out of the widget tree</em>: they're top-level declarations, resolved by a <code>ProviderScope</code> at the root. Missing providers become compile errors rather than runtime <code>ProviderNotFoundException</code>s, and any provider can be overridden in tests. APIs differ across major versions (2.x vs 3.x, with or without the <code>@riverpod</code> code generator) — check current docs; the shapes below are the manual 2.x-style API.</p>
<pre><code class="language-dart">final bookingApiProvider = Provider&lt;BookingApi&gt;((ref) =&gt; BookingApi(http.Client(), env.baseUrl));

// async state with loading/error/data built in (AsyncValue)
final todayBookingsProvider =
    FutureProvider.autoDispose.family&lt;List&lt;Booking&gt;, String&gt;((ref, roomId) async {
  final api = ref.watch(bookingApiProvider);
  final result = await api.today(roomId);
  return switch (result) { Ok(:final value) =&gt; value, Err(:final failure) =&gt; throw failure };
});

// mutable state with methods
class CheckIn extends AsyncNotifier&lt;bool&gt; {
  @override
  Future&lt;bool&gt; build() async =&gt; false;

  Future&lt;void&gt; checkIn(String id) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await ref.read(bookingApiProvider).checkIn(id);
      return true;
    });
  }
}
final checkInProvider = AsyncNotifierProvider&lt;CheckIn, bool&gt;(CheckIn.new);

// widget
class TodayList extends ConsumerWidget {
  const TodayList({super.key, required this.roomId});
  final String roomId;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookings = ref.watch(todayBookingsProvider(roomId));
    return bookings.when(
      loading: () =&gt; const Center(child: CircularProgressIndicator()),
      error: (e, _) =&gt; ErrorView(e, onRetry: () =&gt; ref.invalidate(todayBookingsProvider(roomId))),
      data: (list) =&gt; BookingListView(list),
    );
  }
}</code></pre>
<ul>
  <li><code>ref.watch</code> in build/providers (reactive), <code>ref.read</code> in callbacks, <code>ref.listen</code> for side effects (snackbars, navigation).</li>
  <li><code>autoDispose</code> frees state when no one listens (like React Query's GC); <code>family</code> parameterises (like a query key).</li>
  <li><code>ref.invalidate</code> ≈ <code>queryClient.invalidateQueries</code>.</li>
</ul>

<h3>5. Bloc / Cubit</h3>
<pre><code class="language-dart">// Cubit: methods → emit(state). Bloc: events → handlers → emit(state).
sealed class CancelEvent {}
final class CancelRequested extends CancelEvent { CancelRequested(this.bookingId); final String bookingId; }

sealed class CancelState {}
final class CancelIdle extends CancelState {}
final class CancelInProgress extends CancelState {}
final class CancelDone extends CancelState {}
final class CancelFailed extends CancelState { CancelFailed(this.reason); final String reason; }

class CancelBookingBloc extends Bloc&lt;CancelEvent, CancelState&gt; {
  CancelBookingBloc(this._api) : super(CancelIdle()) {
    on&lt;CancelRequested&gt;(_onCancel, transformer: droppable()); // ignore double-taps (bloc_concurrency)
  }
  final BookingApi _api;

  Future&lt;void&gt; _onCancel(CancelRequested e, Emitter&lt;CancelState&gt; emit) async {
    emit(CancelInProgress());
    try {
      await _api.cancel(e.bookingId);
      emit(CancelDone());
    } on HttpFailure catch (err) {
      emit(CancelFailed('Server said \${err.status}'));
    }
  }
}

// UI
BlocProvider(
  create: (ctx) =&gt; CancelBookingBloc(ctx.read&lt;BookingApi&gt;()),
  child: BlocConsumer&lt;CancelBookingBloc, CancelState&gt;(
    listener: (context, state) {                    // one-off side effects
      if (state is CancelDone) showSuccessDialog(context, 'Booking cancelled');
    },
    builder: (context, state) =&gt; FilledButton(
      onPressed: state is CancelInProgress
          ? null
          : () =&gt; context.read&lt;CancelBookingBloc&gt;().add(CancelRequested(booking.id)),
      child: state is CancelInProgress ? const CircularProgressIndicator() : const Text('Cancel meeting'),
    ),
  ),
);</code></pre>
<p>Concurrency transformers (<code>sequential</code>, <code>concurrent</code>, <code>droppable</code>, <code>restartable</code>) are Bloc's equivalent of redux-saga's <code>takeLatest</code>/<code>takeLeading</code>.</p>

<h3>6. Comparison</h3>
<table>
  <thead><tr><th></th><th>setState / Notifiers</th><th>Provider</th><th>Riverpod</th><th>Bloc</th></tr></thead>
  <tbody>
    <tr><td>Boilerplate</td><td>Lowest</td><td>Low</td><td>Low–medium (less with codegen)</td><td>Highest (events + states)</td></tr>
    <tr><td>Needs BuildContext</td><td>Yes</td><td>Yes</td><td>No (uses <code>ref</code>)</td><td>Yes for lookup</td></tr>
    <tr><td>Compile-time safety of lookup</td><td>n/a</td><td>Runtime error if missing</td><td>Compile-time</td><td>Runtime error if missing</td></tr>
    <tr><td>Async loading/error</td><td>Hand-rolled</td><td>Hand-rolled / FutureProvider</td><td>First-class (<code>AsyncValue</code>)</td><td>Model as states</td></tr>
    <tr><td>Traceability</td><td>Low</td><td>Medium</td><td>Medium (observers)</td><td>High (every event + transition, <code>BlocObserver</code>)</td></tr>
    <tr><td>Testing</td><td>Widget tests</td><td>Inject fakes via providers</td><td><code>ProviderContainer</code> + overrides</td><td><code>bloc_test</code> (given events, expect states)</td></tr>
    <tr><td>Fits</td><td>Ephemeral UI state</td><td>Small–medium apps</td><td>Most new apps; DI + async heavy</td><td>Large teams, regulated / auditable flows</td></tr>
  </tbody>
</table>

<h3>7. Navigation</h3>
<pre><code class="language-dart">// Navigator 1 — imperative, returns a result like a modal
final picked = await Navigator.of(context).push&lt;Room&gt;(
  MaterialPageRoute(builder: (_) =&gt; const RoomPicker()),
);
Navigator.of(context).pop(selectedRoom);  // inside RoomPicker

// go_router — URL-first, declarative config
final router = GoRouter(
  initialLocation: '/rooms',
  refreshListenable: authController,                 // re-run redirect when auth changes
  redirect: (context, state) {
    final loggedIn = authController.isLoggedIn;
    final goingToLogin = state.matchedLocation == '/login';
    if (!loggedIn) return goingToLogin ? null : '/login?from=\${state.uri}';
    if (goingToLogin) return '/rooms';
    return null;                                     // no redirect
  },
  routes: [
    GoRoute(path: '/login', builder: (_, __) =&gt; const LoginScreen()),
    StatefulShellRoute.indexedStack(                 // bottom tabs, each with its own stack
      builder: (_, __, shell) =&gt; AppShell(shell: shell),
      branches: [
        StatefulShellBranch(routes: [
          GoRoute(
            path: '/rooms',
            builder: (_, __) =&gt; const RoomsScreen(),
            routes: [
              GoRoute(
                path: ':roomId',                     // /rooms/12
                builder: (_, state) =&gt; RoomScreen(id: state.pathParameters['roomId']!),
              ),
            ],
          ),
        ]),
        StatefulShellBranch(routes: [
          GoRoute(path: '/settings', builder: (_, __) =&gt; const SettingsScreen()),
        ]),
      ],
    ),
  ],
);

MaterialApp.router(routerConfig: router);
context.go('/rooms/12');     // replace stack to match URL (like linking.navigate / router.replace)
context.push('/rooms/12');   // push on top (keeps back history)</code></pre>
<table>
  <thead><tr><th>Concept</th><th>go_router</th><th>React Navigation / Expo Router</th></tr></thead>
  <tbody>
    <tr><td>Route table</td><td><code>GoRoute(path:)</code> tree</td><td>Navigators + <code>linking.config</code> / file-based routes</td></tr>
    <tr><td>Auth guard</td><td><code>redirect</code> + <code>refreshListenable</code></td><td>Conditional screens in the navigator / redirect in layout</td></tr>
    <tr><td>Tabs with own stacks</td><td><code>StatefulShellRoute</code></td><td>Tab navigator with nested stacks</td></tr>
    <tr><td>Params</td><td><code>state.pathParameters</code>, <code>uri.queryParameters</code>, <code>extra</code></td><td><code>route.params</code> / <code>useLocalSearchParams</code></td></tr>
    <tr><td>Back handling</td><td><code>PopScope</code> (replaced <code>WillPopScope</code>; check current callback names)</td><td><code>beforeRemove</code> / <code>BackHandler</code></td></tr>
  </tbody>
</table>
<p>Deep links: configure Android intent filters / App Links and iOS Universal Links (associated domains) natively, then the router receives the URL. Avoid putting large objects in <code>extra</code> — they're lost on web refresh and deep links; pass ids.</p>

<h3>8. Platform channels</h3>
<pre><code class="language-dart">// Dart
class KioskPlatform {
  static const _ch = MethodChannel('com.acme.rooms/kiosk');
  static const _battery = EventChannel('com.acme.rooms/battery');

  Future&lt;bool&gt; setLockTask(bool on) async {
    try {
      return await _ch.invokeMethod&lt;bool&gt;('setLockTask', {'on': on}) ?? false;
    } on PlatformException catch (e) {
      log('kiosk failed: \${e.code} \${e.message}');
      return false;
    } on MissingPluginException {
      return false;                  // e.g. running on iOS / web / in a widget test
    }
  }

  Stream&lt;int&gt; get batteryLevel =&gt; _battery.receiveBroadcastStream().map((e) =&gt; e as int);
}</code></pre>
<pre><code class="language-kotlin">// Android — MainActivity.kt
class MainActivity : FlutterActivity() {
  override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
    super.configureFlutterEngine(flutterEngine)
    MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "com.acme.rooms/kiosk")
      .setMethodCallHandler { call, result -&gt;
        when (call.method) {
          "setLockTask" -&gt; {
            val on = call.argument&lt;Boolean&gt;("on") ?: false
            try {
              if (on) startLockTask() else stopLockTask()
              result.success(true)
            } catch (e: Exception) {
              result.error("LOCK_TASK_FAILED", e.message, null)
            }
          }
          else -&gt; result.notImplemented()
        }
      }
  }
}</code></pre>
<pre><code class="language-swift">// iOS — AppDelegate.swift (inside application(_:didFinishLaunchingWithOptions:))
let controller = window?.rootViewController as! FlutterViewController
let channel = FlutterMethodChannel(name: "com.acme.rooms/kiosk",
                                   binaryMessenger: controller.binaryMessenger)
channel.setMethodCallHandler { call, result in
  switch call.method {
  case "setLockTask":
    result(FlutterError(code: "UNSUPPORTED", message: "Use Guided Access / MDM on iOS", details: nil))
  default:
    result(FlutterMethodNotImplemented)
  }
}</code></pre>
<table>
  <thead><tr><th>Mechanism</th><th>Sync?</th><th>Typed?</th><th>RN analogue</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td><code>MethodChannel</code></td><td>No (async)</td><td>No (string method names, dynamic args)</td><td>Legacy NativeModules (bridge)</td><td>Simple calls to OS APIs / SDKs</td></tr>
    <tr><td><code>EventChannel</code></td><td>Stream</td><td>No</td><td><code>NativeEventEmitter</code></td><td>Sensors, battery, connectivity, SDK callbacks</td></tr>
    <tr><td><code>BasicMessageChannel</code></td><td>Async</td><td>Codec-defined</td><td>—</td><td>Custom bidirectional messaging</td></tr>
    <tr><td><strong>Pigeon</strong></td><td>Async (generated)</td><td>Yes — codegen Dart/Kotlin/Swift/ObjC/C++</td><td>TurboModule spec + codegen</td><td>Any non-trivial plugin API</td></tr>
    <tr><td><code>dart:ffi</code> (+ ffigen)</td><td><strong>Yes</strong>, same thread</td><td>Yes (C signatures)</td><td>JSI / C++ TurboModule</td><td>C/C++/Rust libs: crypto, codecs, SQLite, ML runtimes</td></tr>
    <tr><td>Platform views</td><td>—</td><td>—</td><td>Native UI component (Fabric component)</td><td>Maps, WebView, camera preview, ad SDKs</td></tr>
  </tbody>
</table>
<p>Handlers run on the platform main thread: do heavy native work on a background queue/coroutine and reply on the main thread. Channel names are global strings — namespace them by reverse domain.</p>

<h3>9. dart:ffi in brief</h3>
<pre><code class="language-dart">import 'dart:ffi';
import 'dart:io' show Platform;

typedef _CrcNative = Uint32 Function(Pointer&lt;Uint8&gt; data, IntPtr len);
typedef _CrcDart = int Function(Pointer&lt;Uint8&gt; data, int len);

final _lib = Platform.isAndroid ? DynamicLibrary.open('libcrc.so') : DynamicLibrary.process();
final crc32 = _lib.lookupFunction&lt;_CrcNative, _CrcDart&gt;('crc32');
// memory: allocate with package:ffi's calloc / malloc and free it yourself (or use an Arena)</code></pre>
<p>FFI calls are synchronous and block the calling isolate — so call long C functions from a worker isolate. Generate bindings from headers with <code>ffigen</code>; newer toolchains add build hooks / native assets for bundling native code (check current docs).</p>

<h3>10. Testing</h3>
<pre><code class="language-dart">// widget test — headless, runs in milliseconds, no device
testWidgets('cancel shows success dialog', (tester) async {
  final api = MockBookingApi();
  when(() =&gt; api.cancel('b1')).thenAnswer((_) async {});

  await tester.pumpWidget(MaterialApp(
    home: Provider&lt;BookingApi&gt;.value(value: api, child: const BookingDetails(id: 'b1')),
  ));

  await tester.tap(find.text('Cancel meeting'));
  await tester.pump();                       // one frame: shows progress
  expect(find.byType(CircularProgressIndicator), findsOneWidget);
  await tester.pumpAndSettle();              // until animations/microtasks finish
  expect(find.text('Booking cancelled'), findsOneWidget);
  verify(() =&gt; api.cancel('b1')).called(1);
});

class MockBookingApi extends Mock implements BookingApi {}   // mocktail

// bloc test
blocTest&lt;CancelBookingBloc, CancelState&gt;(
  'emits progress then done',
  build: () =&gt; CancelBookingBloc(FakeApi()),
  act: (b) =&gt; b.add(CancelRequested('b1')),
  expect: () =&gt; [isA&lt;CancelInProgress&gt;(), isA&lt;CancelDone&gt;()],
);

// riverpod test
final container = ProviderContainer(overrides: [bookingApiProvider.overrideWithValue(FakeApi())]);
addTearDown(container.dispose);
expect(await container.read(todayBookingsProvider('r1').future), hasLength(3));</code></pre>
<table>
  <thead><tr><th>Layer</th><th>Flutter</th><th>RN analogue</th><th>Speed</th></tr></thead>
  <tbody>
    <tr><td>Unit</td><td><code>package:test</code> + mocktail</td><td>Jest</td><td>ms</td></tr>
    <tr><td>Widget</td><td><code>testWidgets</code>, <code>WidgetTester</code>, finders</td><td>RN Testing Library</td><td>ms–s (no device)</td></tr>
    <tr><td>Golden</td><td><code>matchesGoldenFile</code></td><td>Snapshot + screenshot tests</td><td>s (font/platform-sensitive)</td></tr>
    <tr><td>Integration / E2E</td><td><code>integration_test</code> on device; Patrol for native dialogs</td><td>Detox / Maestro</td><td>minutes</td></tr>
  </tbody>
</table>
<p>Widget tests fake time (<code>pump(Duration)</code>), so timers and animations are deterministic — and real HTTP is blocked by default (requests fail), which forces dependency injection.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — choosing state tools for a meeting-room tablet app</h3>
<table>
  <thead><tr><th>State</th><th>Choice</th><th>Why</th></tr></thead>
  <tbody>
    <tr><td>Selected timeline slot, dialog open, text input</td><td><code>setState</code></td><td>Ephemeral, one widget.</td></tr>
    <tr><td>Theme (light/dark), environment (UAT/PROD)</td><td>Notifier provider at root</td><td>App-wide, rarely changes; persisted to storage.</td></tr>
    <tr><td>Today's bookings for the room</td><td>Riverpod <code>FutureProvider.family</code> / <code>AsyncNotifier</code> with polling or websocket</td><td>Server cache with loading/error, invalidation on cancel.</td></tr>
    <tr><td>Check-in / extend / end meeting</td><td>Notifier with optimistic update; local persistence until backend exists</td><td>User actions with side effects; easy to swap local storage for API later.</td></tr>
    <tr><td>Cancel flow (confirm → API → success dialog)</td><td>Bloc or AsyncNotifier with <code>ref.listen</code> for the dialog</td><td>One-off side effects separated from rendered state.</td></tr>
  </tbody>
</table>

<h3>Example 2 — "developer options" after 5 taps, without leaking state</h3>
<pre><code class="language-dart">class VersionLabel extends StatefulWidget {
  const VersionLabel({super.key});
  @override
  State&lt;VersionLabel&gt; createState() =&gt; _VersionLabelState();
}

class _VersionLabelState extends State&lt;VersionLabel&gt; {
  int _taps = 0;
  DateTime _last = DateTime.fromMillisecondsSinceEpoch(0);

  void _onTap() {
    final now = DateTime.now();
    _taps = now.difference(_last) &lt; const Duration(milliseconds: 600) ? _taps + 1 : 1;
    _last = now;
    if (_taps &gt;= 5) {
      _taps = 0;
      showModalBottomSheet(context: context, builder: (_) =&gt; const DeveloperOptionsSheet());
    }
  }

  @override
  Widget build(BuildContext context) =&gt; GestureDetector(
        onTap: _onTap,
        child: Text('v\${AppInfo.version}', style: Theme.of(context).textTheme.bodySmall),
      );
}

// DeveloperOptionsSheet reads/writes app-wide settings through a provider:
//   ref.read(settingsProvider.notifier).setEnvironment(Env.uat);
//   ref.read(settingsProvider.notifier).setThemeMode(ThemeMode.light);</code></pre>
<p>Tap counting is ephemeral (setState); environment and theme are app-wide (provider). Note no <code>setState</code> is needed for the tap counter because nothing visible changes.</p>

<h3>Example 3 — a typed channel with Pigeon</h3>
<pre><code class="language-dart">// pigeons/device.dart — input to the generator
import 'package:pigeon/pigeon.dart';

class DeviceInfo {
  DeviceInfo({required this.serial, required this.isManaged});
  String serial;
  bool isManaged;
}

@HostApi()                      // Dart calls native
abstract class DeviceApi {
  DeviceInfo getInfo();
  @async
  bool setLockTask(bool on);
}

@FlutterApi()                   // native calls Dart
abstract class DeviceEvents {
  void onPolicyChanged(String policy);
}
// generator emits Dart + Kotlin + Swift classes; you implement the native interface.</code></pre>
<p>This is the TurboModule playbook from <a href="#/topic/rn-native-modules">Native Modules</a>: a spec is the source of truth, codegen produces both sides, mismatches become build errors instead of runtime <code>MissingPluginException</code>s. Configuration flags for output paths vary by Pigeon version — check current docs.</p>

<h3>Example 4 — auth-aware routing with Riverpod + go_router</h3>
<pre><code class="language-dart">final routerProvider = Provider&lt;GoRouter&gt;((ref) {
  final auth = ref.watch(authNotifierProvider.notifier);   // a Listenable notifier
  return GoRouter(
    refreshListenable: auth,
    redirect: (_, state) {
      final signedIn = auth.isSignedIn;
      if (!signedIn &amp;&amp; state.matchedLocation != '/login') return '/login';
      if (signedIn &amp;&amp; state.matchedLocation == '/login') return '/';
      return null;
    },
    routes: appRoutes,
  );
});

class App extends ConsumerWidget {
  const App({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) =&gt;
      MaterialApp.router(routerConfig: ref.watch(routerProvider));
}</code></pre>
<p>Watch the notifier (not its state) so the router is created once; recreating the GoRouter on every auth change resets navigation history.</p>

<h3>Example 5 — integration test on device</h3>
<pre><code class="language-dart">// integration_test/booking_flow_test.dart
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('book a 30 min slot', (tester) async {
    app.main(flavor: Flavor.uat);
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('slot-10:00')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Book'));
    await tester.pumpAndSettle(const Duration(seconds: 2));
    expect(find.textContaining('Booked'), findsOneWidget);
  });
}
// flutter test integration_test/booking_flow_test.dart -d &lt;device-id&gt;</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>State management corners</h3>
<ul>
  <li><strong><code>ProviderNotFoundException</code></strong> (Provider/Bloc): the widget reading it is above the provider, or in a new route pushed from a context above it. Routes are siblings under the Navigator, not children of the screen that pushed them — re-provide with <code>BlocProvider.value</code>/<code>ChangeNotifierProvider.value</code> or move the provider above <code>MaterialApp</code>.</li>
  <li><strong><code>.value</code> vs <code>create</code></strong>: <code>create</code> owns and disposes the object; <code>.value</code> doesn't. Using <code>.value</code> with a freshly constructed object in build leaks and recreates it each build.</li>
  <li><strong>notifyListeners after dispose</strong>: an async method finishing after the provider is disposed throws in debug. Guard or cancel work on dispose (Riverpod: <code>ref.onDispose</code>, check <code>ref.mounted</code> where available — check current docs).</li>
  <li><strong>Bloc state equality</strong>: Bloc skips emitting a state equal to the current one. Emitting the same mutable list instance after mutating it = no rebuild. Emit new instances (copyWith) and give states value equality.</li>
  <li><strong>autoDispose surprises</strong>: navigating away disposes cached data, so going back refetches. Use <code>ref.keepAlive()</code> or drop autoDispose for data you want cached.</li>
  <li><strong>Side effects in build</strong>: showing a dialog or navigating inside <code>build</code> (or a <code>BlocBuilder</code> builder) fires on every rebuild. Use <code>BlocListener</code> / <code>ref.listen</code> / <code>addPostFrameCallback</code>.</li>
</ul>

<h3>Navigation corners</h3>
<ul>
  <li><strong><code>context.go</code> vs <code>push</code></strong>: <code>go</code> rebuilds the stack from the URL (back button may leave the app); <code>push</code> stacks. Mixing them carelessly produces broken back behaviour.</li>
  <li><strong>Android back / predictive back</strong>: newer Android versions use predictive back gestures that require declaring the pop intent ahead of time — that's why <code>WillPopScope</code> was replaced by <code>PopScope(canPop: ...)</code>. Check current docs for the callback signature.</li>
  <li><strong>Dialogs are routes</strong>: <code>showDialog</code> pushes onto the Navigator; <code>Navigator.pop(context)</code> with the wrong context pops the page instead of the dialog. Pop with the dialog's own context (or <code>rootNavigator</code> awareness when using shells).</li>
  <li><strong>Web refresh</strong> loses in-memory state and <code>extra</code>; anything needed to restore a page must be in the URL or fetched by id.</li>
</ul>

<h3>Platform corners</h3>
<ul>
  <li><strong><code>MissingPluginException</code></strong>: plugin not registered (needs a full rebuild, not hot reload, after adding a plugin), wrong channel name, or called from a background isolate without the background messenger.</li>
  <li><strong>Codec limits</strong>: no custom classes or <code>DateTime</code> over <code>StandardMessageCodec</code> — use maps/ISO strings or Pigeon. Large payloads (images) are copied; prefer file paths or textures.</li>
  <li><strong>Threading</strong>: method handlers run on the platform main thread; blocking it freezes the whole app (and, with merged UI/platform threads, Flutter's frames too — check current docs). Offload to a coroutine / dispatch queue.</li>
  <li><strong>Add-to-app</strong>: each <code>FlutterEngine</code> costs memory; pre-warm and cache engines, or use <code>FlutterEngineGroup</code> for multiple.</li>
</ul>

<h3>Testing corners</h3>
<ul>
  <li><code>pumpAndSettle</code> times out with infinite animations (a spinner that repeats forever). Use <code>pump(Duration)</code> instead.</li>
  <li>Golden tests differ across OSes/fonts — generate and compare goldens on the same CI platform; load real fonts or accept the test font.</li>
  <li>Platform channels in widget tests: mock with <code>TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(...)</code> or inject an interface.</li>
</ul>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>1. One giant ChangeNotifier "AppState"</h3>
<p>Every <code>notifyListeners()</code> rebuilds every watcher. Split by domain (auth, settings, bookings) and use <code>select</code>/<code>BlocSelector</code>/<code>ref.watch(p.select(...))</code>. Same lesson as one giant React Context.</p>

<h3>2. Business logic in widgets</h3>
<pre><code class="language-dart">// ANTI-PATTERN
onPressed: () async {
  final res = await http.post(Uri.parse('$base/bookings/$id/cancel'));
  if (res.statusCode == 200) { setState(() =&gt; bookings.removeWhere((b) =&gt; b.id == id)); }
}

// BETTER — widget dispatches intent; repository + notifier/bloc own the logic
onPressed: () =&gt; context.read&lt;CancelBookingBloc&gt;().add(CancelRequested(id)),</code></pre>
<p>Typical layering: UI → state holder (Notifier/Bloc/ViewModel) → repository → data sources (API, cache, platform). Testable at each seam.</p>

<h3>3. Using <code>ref.read</code>/<code>context.read</code> in build</h3>
<p>The widget never rebuilds when data changes — a "stale UI" bug that looks like a backend issue. <code>watch</code> in build, <code>read</code> in callbacks.</p>

<h3>4. Navigation from deep inside business logic</h3>
<p>Blocs/notifiers calling <code>Navigator</code> with a stored <code>BuildContext</code> crash after the context is unmounted and are untestable. Emit a state/effect and navigate in a listener.</p>

<h3>5. Stringly-typed channels everywhere</h3>
<p>Dozens of <code>invokeMethod('doThing')</code> calls with hand-built maps drift between Dart, Kotlin and Swift. Use Pigeon (or a single typed facade class) and test the native side.</p>

<h3>6. Ignoring iOS/Android parity in channels</h3>
<p>Implementing a method only on Android and forgetting iOS yields <code>MissingPluginException</code>/<code>notImplemented</code> in production. Return an explicit "unsupported" error on the other platform and handle it in Dart.</p>

<h3>7. Over-mocking in widget tests</h3>
<p>Mocking every class makes tests mirror implementation. Prefer fakes for repositories, real notifiers/blocs, and assert on what the user sees (finders), like RN Testing Library's philosophy.</p>

<h3>8. Picking GetX or a new library for a "simple" app</h3>
<p>Global service locators and magic context-free navigation are convenient early and hard to test and reason about later. Interviewers often probe this; justify any choice with testing and team-scaling arguments.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. How do you decide between setState, Provider, Riverpod and Bloc?</div>
  <div class="qa-answer">
    <p>Ephemeral UI state stays in <code>setState</code> regardless. For shared state: Provider for small/medium apps and teams already using it; Riverpod when I want compile-time-safe DI, first-class async (<code>AsyncValue</code>), derived providers and easy test overrides without BuildContext; Bloc when the domain is event-driven, auditability matters, or a large team benefits from a strict event → state contract and <code>bloc_test</code>. I'd rather a team use one consistently than mix three.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. How does InheritedWidget work, and how does it compare to React Context?</div>
  <div class="qa-answer">
    <p>Each element keeps a map of InheritedWidgets above it, so <code>dependOnInheritedWidgetOfExactType</code> is O(1) and registers the calling element as a dependent. When the InheritedWidget is rebuilt, <code>updateShouldNotify</code> decides whether dependents are marked dirty. React Context re-renders all consumers when the value identity changes; Flutter has the explicit <code>updateShouldNotify</code> veto and <code>InheritedModel</code> aspects for finer subscriptions. Both suffer if you put a frequently-changing giant object in them.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Explain Navigator 1 vs Navigator 2 vs go_router.</div>
  <div class="qa-answer">
    <p>Navigator 1 is an imperative stack (<code>push</code>/<code>pop</code>, can return results). Navigator 2 adds a declarative <code>pages</code> list and the <code>Router</code> API (RouterDelegate, RouteInformationParser) so the stack is a function of state and syncs with URLs — powerful but verbose. go_router wraps Navigator 2 with a path-based route tree, redirects for guards, shell routes for tabs, and deep-link handling. In RN terms: Navigator 1 ≈ <code>navigation.navigate</code>, go_router ≈ React Navigation with linking config or Expo Router.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. How do platform channels work, and how do they compare to RN native modules?</div>
  <div class="qa-answer">
    <p>Dart encodes a method call with a codec into bytes, the engine's BinaryMessenger delivers it to a handler on the platform thread, and the reply completes a Future. It's async, untyped and copy-based — close to RN's legacy bridge NativeModules. Pigeon adds a spec + codegen for type safety (≈ TurboModule specs). For synchronous calls into C, <code>dart:ffi</code> is the analogue of JSI. EventChannel ≈ NativeEventEmitter for native → Dart streams.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. When would you choose FFI over a MethodChannel?</div>
  <div class="qa-answer">
    <p>When the code is C/C++/Rust (SQLite, codecs, crypto, ML runtimes), when you need synchronous calls or many small calls where channel overhead dominates, or when you want the same native library on all platforms including desktop. Choose channels for OS APIs that live in Kotlin/Swift (permissions, intents, UIKit). FFI calls block the isolate, so long ones go on a worker isolate, and you manage memory yourself.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. What's your testing strategy for a Flutter app?</div>
  <div class="qa-answer">
    <p>Many unit tests for repositories and state holders (<code>bloc_test</code> or <code>ProviderContainer</code> with overrides); a solid layer of widget tests for screens with fakes injected, asserting user-visible output — they're fast because they run headless with fake time; a few goldens for design-critical components on a fixed CI platform; and a small set of <code>integration_test</code>/Patrol flows on real devices for login, core booking and platform-channel paths. Same pyramid as RN (Jest + RNTL + Detox), but Flutter's widget tests cover more because no native renderer is needed.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How do you implement an auth guard and deep links?</div>
  <div class="qa-answer">
    <p>In go_router, a top-level <code>redirect</code> reads auth state and returns <code>/login</code> (with a <code>from</code> param) or <code>null</code>; <code>refreshListenable</code> re-runs it when auth changes. Deep links need native config (Android App Links intent filters, iOS associated domains), and every deep-linkable route must be reconstructible from the URL alone — ids in the path, data fetched on entry, no reliance on <code>extra</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Probing: a Bloc emits a new list but the UI doesn't update. Why?</div>
  <div class="qa-answer">
    <p>Most likely the state was mutated in place and re-emitted — Bloc compares the new state with the current one and skips equal emissions, and with value equality (Equatable/freezed) a mutated-then-reemitted object compares equal to itself. Or the widget uses <code>context.read</code> instead of a builder/watch, or a <code>buildWhen</code> filters it out. Fix: immutable states with copyWith and new list instances.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Probing: why did ProviderNotFoundException appear only after navigating?</div>
  <div class="qa-answer">
    <p>Pushed routes are children of the Navigator, which is above your screen — so a provider created inside screen A isn't an ancestor of screen B. Provide it above the Navigator/MaterialApp, or pass the existing instance into the new route with a <code>.value</code> provider. Riverpod avoids this class of bug because providers don't live in the widget tree.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Flutter or React Native for a new product — how do you decide?</div>
  <div class="qa-answer">
    <p>I'd weigh team skills (a React/TS team ships faster in RN and can share with web), UI needs (custom, brand-heavy, pixel-consistent → Flutter; truly native look and lots of native components → RN), brownfield integration (RN is easier to embed incrementally), OTA update requirements (RN has mature options), platform targets (Flutter covers desktop/embedded from one codebase), and hiring. Performance is rarely the deciding factor now that RN has JSI/Fabric — both are fast when built well. I'd prototype the riskiest screen in both if the team is split.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. FDE scenario: a customer's Flutter kiosk shows "Checked in" on the tablet but the web dashboard doesn't. What do you do?</div>
  <div class="qa-answer">
    <ol>
      <li>Clarify: is check-in persisted locally only (e.g. backend endpoint not built yet) or is the API call failing silently? Check the state holder — an optimistic update with a swallowed error is the usual culprit.</li>
      <li>Reproduce with network logs (DevTools network tab / proxy) on their environment (UAT vs PROD switch).</li>
      <li>Fix the flow so the notifier only commits after the API succeeds (or rolls back and shows an error), and surface sync status in the UI.</li>
      <li>Add a widget test with a failing fake API asserting the rollback, and a repository test for retries.</li>
      <li>Report back with root cause, the fix, and whether the dashboard needs a backfill for affected bookings.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Probing: how would you call a plugin from a background isolate or run Dart when the app is killed?</div>
  <div class="qa-answer">
    <p>From a background isolate spawned by the app, pass the <code>RootIsolateToken</code> and call <code>BackgroundIsolateBinaryMessenger.ensureInitialized</code> so channels work (limits apply; check current docs). For work when the app is not running, the native side must start a headless <code>FlutterEngine</code> and invoke a registered top-level Dart callback (this is how packages like workmanager and background messaging do it), subject to OS background limits — the same constraints as RN headless JS tasks.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You keep ephemeral state local and justify any library with testability and scale.</li>
    <li>You explain InheritedWidget as the primitive behind Provider/Bloc lookups.</li>
    <li>You separate rendered state from one-off effects (listeners) and never navigate from build.</li>
    <li>You can write a MethodChannel on both platforms and know when Pigeon or FFI is better.</li>
    <li>You give a balanced Flutter vs RN decision, not a fan's answer.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. How does InheritedWidget notify its dependents, and how does Provider build on top of it?</div>
  <div class="qa-answer">
    <p>A widget that calls <code>dependOnInheritedWidgetOfExactType</code> (usually via an <code>X.of(context)</code> helper) is registered as a dependent of the nearest InheritedWidget of that type. When a parent rebuilds the InheritedWidget with a new value, <code>updateShouldNotify(old)</code> decides whether to notify; if it returns true, <strong>only the registered dependent elements</strong> are marked dirty and get <code>didChangeDependencies</code> + <code>build</code>, while siblings that never looked it up are not rebuilt. Provider is a convenience layer over this: <code>ChangeNotifierProvider</code> is an InheritedWidget whose value is a listenable, and it marks dependents dirty whenever <code>notifyListeners()</code> fires. Its <code>create</code> constructor also owns the object's lifecycle, while <code>.value</code> exposes an existing instance without disposing it.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q14. Compare Provider, Riverpod and Bloc on boilerplate, safety, async handling and testing.</div>
  <div class="qa-answer">
    <p><strong>Boilerplate:</strong> Provider is low, Riverpod low to medium (less with codegen), Bloc highest because you write events and states. <strong>Safety:</strong> Provider and Bloc look things up through BuildContext and fail at runtime if the provider is missing; Riverpod uses <code>ref</code>, needs no BuildContext and is compile-time safe. <strong>Async:</strong> Provider is hand-rolled or <code>FutureProvider</code>, Riverpod has first-class <code>AsyncValue</code>, Bloc models loading/error as states. <strong>Testing:</strong> Provider injects fakes via providers, Riverpod uses <code>ProviderContainer</code> + overrides, Bloc uses <code>bloc_test</code> (given events, expect states) and has the best traceability via <code>BlocObserver</code>. So: Provider for small to medium apps, Riverpod for most new apps heavy on DI and async, Bloc for large teams and auditable, event-driven flows, and one choice used consistently.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q15. How would you set up go_router with an auth redirect, a parameterised route, and tabs that each keep their own stack?</div>
  <div class="qa-answer">
    <p>Create one <code>GoRouter</code> passed to <code>MaterialApp.router</code>. A top-level <code>redirect</code> reads auth state and returns <code>/login</code> (with a <code>from</code> param) when logged out, <code>/rooms</code> if a logged-in user hits the login page, or <code>null</code> for no redirect; <code>refreshListenable: authController</code> re-runs it when auth changes. A nested route with <code>path: ':roomId'</code> under <code>/rooms</code> matches <code>/rooms/12</code>, and the builder reads <code>state.pathParameters['roomId']</code>. Bottom tabs with independent stacks use <code>StatefulShellRoute.indexedStack</code> with one <code>StatefulShellBranch</code> per tab. Navigate with <code>context.go</code> to replace the stack to match a URL, or <code>context.push</code> to keep back history, and pass ids rather than large objects in <code>extra</code> so deep links and web refresh still work.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q16. Walk me through writing a MethodChannel on the Dart, Kotlin and Swift sides. When would you switch to Pigeon or FFI?</div>
  <div class="qa-answer">
    <p>On Dart, create a <code>MethodChannel('com.acme.rooms/kiosk')</code> (namespaced by reverse domain) and <code>await _ch.invokeMethod&lt;bool&gt;('setLockTask', {'on': on})</code>, catching <code>PlatformException</code> and <code>MissingPluginException</code> (e.g. on a platform or test without the handler). On Android, in <code>configureFlutterEngine</code> create a <code>MethodChannel</code> on <code>flutterEngine.dartExecutor.binaryMessenger</code> and <code>setMethodCallHandler</code>, switching on <code>call.method</code> and replying with <code>result.success</code>, <code>result.error</code> or <code>result.notImplemented()</code>. On iOS, create a <code>FlutterMethodChannel</code> with the controller's <code>binaryMessenger</code> and reply with a value, a <code>FlutterError</code> or <code>FlutterMethodNotImplemented</code>. Handlers run on the platform main thread, so heavy work goes to a background queue. Switch to <strong>Pigeon</strong> for any non-trivial API, because hand-written string method names drift between three languages; switch to <strong>dart:ffi</strong> for synchronous or very chatty calls into C/C++/Rust libraries such as SQLite, codecs or crypto.</p>
  </div>
</div>
` },

  ]
});
