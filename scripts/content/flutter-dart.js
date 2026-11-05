window.PREP_SITE.registerTopic({
  id: "flutter-dart",
  module: "flutter",
  title: "Dart Essentials",
  estimatedReadTime: "30 min",
  tags: ["flutter","dart","null-safety","async","isolates","records","patterns","mixins"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Dart is <strong>TypeScript with sound, runtime-real types</strong>, JIT for hot reload and AOT for release, a JS-style event loop per isolate — and isolates (separate heaps, message passing) are the only real parallelism.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>JIT in debug</strong> enables stateful hot reload; <strong>AOT in release</strong> gives native code with no interpreter or bridge.</li>
    <li><strong>Sound null safety:</strong> <code>T</code> is never null; <code>T?</code> may be. Escape hatches <code>!</code>, <code>late</code>, <code>dynamic</code> all fail loudly at runtime.</li>
    <li><strong>Promotion</strong> works on locals and private final fields (Dart 3.2+), not public fields/getters — copy to a local or use <code>if (x case final v?)</code>.</li>
    <li><strong><code>final</code> = runtime once; <code>const</code> = compile-time, deeply immutable, canonicalised</strong> — const widgets skip rebuilds.</li>
    <li><strong>Equality is identity by default</strong>; override <code>==</code> + <code>hashCode</code> together. Lists compare by identity; records compare structurally.</li>
    <li><strong>Constructors:</strong> initializing formals, initializer lists, named, factory (fromJson/caching), const. Boilerplate usually generated (freezed / json_serializable).</li>
    <li><strong>Mixins</strong> reuse behaviour (linearised, last wins); <strong>extensions</strong> add static methods to types you don't own; every class is an implicit interface.</li>
    <li><strong>Dart 3:</strong> sealed classes + exhaustive <code>switch</code> expressions replace TS discriminated unions; records + patterns replace ad-hoc tuples and casts.</li>
    <li><strong>Generics are reified</strong> (runtime <code>is List&lt;int&gt;</code>) and covariant (can throw at runtime on add).</li>
    <li><strong>Future ≈ Promise, Stream ≈ async iterable</strong>; single-subscription streams throw on second listen, broadcast streams drop unheard events.</li>
    <li><strong>Event loop:</strong> drain microtasks, then one event — same as JS; long sync work delays frames.</li>
    <li><strong>Isolates:</strong> like Web Workers, not shared-memory Java threads (and not RN's JS thread + native thread) — separate heap, copied messages, per-isolate statics; <code>Isolate.run</code>/<code>compute</code> for one-shot jobs; watch the transfer cost.</li>
    <li><strong>Hygiene:</strong> cancel subscriptions, close controllers, cancel timers; lint <code>unawaited_futures</code>; convert JSON to typed models at the edge.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Thinking <code>async</code> moves work off the UI thread.</strong> It doesn't — an async function that decodes a 4 MB JSON still blocks the UI isolate and drops frames. Fix: <code>Isolate.run</code>/<code>compute</code> for CPU-bound work, measured in profile mode on a low-end device. (Runner-up trap: <code>[1,2] == [1,2]</code> is false.)</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Dart gives Flutter both a JIT for stateful hot reload and an AOT compiler for native release code — that's why there's no JS engine or bridge in a Flutter app."</div>
  <div class="revision-say">"Null safety is sound: the escape hatches — bang, late, dynamic — are runtime-checked, so I validate at the JSON boundary and keep models non-null inside."</div>
  <div class="revision-say">"async is concurrency, not parallelism. For CPU work I use Isolate.run, keeping in mind messages are copied and statics are per isolate."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>Why Flutter uses Dart (and why interviewers ask)</h3>
<p>Flutter's design needs a language that can do two contradictory things: iterate in sub-second loops during development, and start fast + run without a JS engine in production. Dart is one of very few languages with both a production JIT and a production AOT compiler:</p>
<ul>
  <li><strong>Debug builds → JIT (Dart VM)</strong>: code is compiled incrementally, which is what makes <em>stateful hot reload</em> possible — the VM swaps class definitions while keeping the heap (your widget state) alive.</li>
  <li><strong>Release builds → AOT</strong>: Dart compiles to native ARM/x64 machine code. There is no interpreter and no bridge at runtime; the framework and your app are one native binary (plus the Flutter engine in C++).</li>
  <li><strong>Web → dart2js or dart2wasm</strong>: compiled to JavaScript or WebAssembly (check current docs for the default renderer/compiler).</li>
  <li><strong>Allocation-friendly GC</strong>: Flutter rebuilds create and throw away thousands of short-lived widget objects per frame. Dart's generational GC (a fast young-generation scavenger) is tuned for exactly that pattern.</li>
</ul>

<h3>Compare with React Native</h3>
<table>
  <thead><tr><th></th><th>React Native</th><th>Flutter / Dart</th></tr></thead>
  <tbody>
    <tr><td>Language</td><td>JS/TS (types erased at build)</td><td>Dart (types reified, enforced at runtime)</td></tr>
    <tr><td>Release execution</td><td>Hermes bytecode interpreted (+ native code for the framework)</td><td>AOT native machine code</td></tr>
    <tr><td>Dev loop</td><td>Metro + Fast Refresh (re-evaluates modules, preserves hook state)</td><td>Dart VM JIT + stateful hot reload (patches classes, preserves State objects)</td></tr>
    <tr><td>Concurrency</td><td>One JS thread, native threads behind modules, worklets (Reanimated)</td><td>One isolate per "thread"; isolates share no memory</td></tr>
    <tr><td>Talking to native</td><td>JSI / TurboModules (<a href="#/topic/rn-native-modules">Native Modules</a>)</td><td>Platform channels (async messages) or <code>dart:ffi</code> (sync C calls)</td></tr>
    <tr><td>Null handling</td><td>Optional via <code>strictNullChecks</code>; <code>any</code> defeats it</td><td>Sound null safety, always on in Dart 3</td></tr>
  </tbody>
</table>

<h3>Dart vs TypeScript — the mental map</h3>
<table>
  <thead><tr><th>TypeScript</th><th>Dart</th><th>Where the analogy breaks</th></tr></thead>
  <tbody>
    <tr><td><code>let</code> / <code>const</code></td><td><code>var</code> / <code>final</code> / <code>const</code></td><td>Dart <code>const</code> is a <em>compile-time constant</em> (deeply immutable, canonicalized). TS <code>const</code> is just "no reassignment" — that's Dart <code>final</code>.</td></tr>
    <tr><td><code>string | null</code></td><td><code>String?</code></td><td>Dart has no <code>undefined</code>; only <code>null</code>.</td></tr>
    <tr><td><code>any</code></td><td><code>dynamic</code></td><td><code>dynamic</code> calls are checked at runtime and throw <code>NoSuchMethodError</code>; prefer <code>Object?</code>, which forces you to check.</td></tr>
    <tr><td>Union types <code>A | B</code></td><td>No ad-hoc unions; use <code>sealed class</code> hierarchies</td><td>Discriminated unions become sealed classes + exhaustive <code>switch</code>.</td></tr>
    <tr><td>Structural typing</td><td>Nominal typing</td><td>Two classes with the same shape are not interchangeable; every class is also an implicit interface (<code>implements</code>).</td></tr>
    <tr><td>Object literal <code>{a: 1}</code></td><td>Records <code>(a: 1)</code> or a class</td><td>A Dart <code>Map</code> is not an object; JSON decodes to <code>Map&lt;String, dynamic&gt;</code>.</td></tr>
    <tr><td><code>Promise&lt;T&gt;</code></td><td><code>Future&lt;T&gt;</code></td><td>Nearly identical semantics; Future errors are also "unhandled" if nobody listens.</td></tr>
    <tr><td><code>AsyncIterable&lt;T&gt;</code> / RxJS Observable</td><td><code>Stream&lt;T&gt;</code></td><td>Streams are single-subscription by default; listening twice throws.</td></tr>
    <tr><td>Web Worker</td><td>Isolate</td><td>Very close; both copy messages and share no heap.</td></tr>
    <tr><td>Module imports</td><td><code>import 'package:x/x.dart';</code></td><td>Privacy is <em>library-level</em> via a leading underscore (<code>_name</code>), not <code>private</code> keywords.</td></tr>
  </tbody>
</table>

<h3>Why this matters in an interview</h3>
<p>Flutter interviews for senior roles rarely ask "what is a Future". They ask why your list janks (heavy work on the UI isolate), why a <code>late</code> field crashed in production, why <code>==</code> on two lists returned false, how you'd model loading/error/data states (sealed classes), and whether you understand that a Flutter app has no JS thread to offload to. A good Dart answer shows you know the <em>runtime</em> consequences of the type system.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Picture 1 — an isolate is a JS runtime with its own heap</h3>
<div class="diagram">
<pre>
 ┌──────────────── Main (UI) isolate ─────────────────┐     ┌──── Worker isolate ────┐
 │  heap: widgets, state, your objects                │     │  heap: its own objects │
 │                                                     │     │                        │
 │  event loop:                                        │     │  event loop            │
 │    1. run all MICROTASKS  (scheduleMicrotask,       │     │                        │
 │       completed-Future callbacks)                   │     │                        │
 │    2. take ONE EVENT (timer, I/O, tap, frame,       │     │                        │
 │       port message) → run it → back to step 1      │     │                        │
 │                                                     │     │                        │
 │  SendPort ─────────── message (copied) ───────────────────► ReceivePort           │
 │  ReceivePort ◄──────── result (copied / moved) ──────────── SendPort              │
 └─────────────────────────────────────────────────────┘     └────────────────────────┘
   no shared memory, no locks, no data races on Dart objects
</pre>
</div>
<p>This is the JavaScript event loop you already know (microtasks drain before the next macrotask). The difference from RN: in RN your JS thread is <em>separate</em> from the UI thread, so a busy JS thread freezes interactions but native scroll can keep going. In Flutter, the UI isolate <em>builds every frame</em>: block it for 50 ms and you drop ~3 frames at 60 Hz, period.</p>

<h3>Picture 2 — null safety is flow analysis</h3>
<div class="diagram">
<pre>
 String? name = maybeName();      // type: String?
 if (name == null) return;        // ── flow analysis ──►
 print(name.length);              // promoted: String  (no ! needed)

 Escape hatches (all fail LOUDLY at runtime, never silently):
   name!            → throws TypeError if null
   late String x;   → LateInitializationError if read before write
   dynamic d;       → NoSuchMethodError on a bad call
</pre>
</div>

<h3>Picture 3 — the type hierarchy</h3>
<div class="diagram">
<pre>
                Object?            (top type: everything, incl. null)
               /                 Object       Null
      /    |       num  String  List&lt;T&gt; ... your classes
   /  int double

                 Never              (bottom type: e.g. a function that always throws)
 dynamic = "turn off static checking", not a real supertype you should design with
</pre>
</div>

<h3>Picture 4 — how a TS discriminated union maps to Dart 3</h3>
<pre><code class="language-ts">// TypeScript
type LoadState&lt;T&gt; =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'data'; value: T };</code></pre>
<pre><code class="language-dart">// Dart 3 — sealed class + exhaustive switch
sealed class LoadState&lt;T&gt; {}
class Loading&lt;T&gt; extends LoadState&lt;T&gt; {}
class Failure&lt;T&gt; extends LoadState&lt;T&gt; { Failure(this.message); final String message; }
class Data&lt;T&gt; extends LoadState&lt;T&gt; { Data(this.value); final T value; }

String describe(LoadState&lt;int&gt; s) =&gt; switch (s) {
  Loading()             =&gt; 'loading…',
  Failure(:final message) =&gt; 'error: $message',
  Data(:final value)    =&gt; 'got $value',
}; // add a 4th subclass → compile error here until handled</code></pre>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"<code>async</code> makes my code run in the background." No — exactly like JS, <code>async</code> just lets you <em>wait</em> without blocking. A tight loop inside an <code>async</code> function still runs on the UI isolate and still janks. CPU-bound work needs another isolate.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. Variables, finality and const</h3>
<pre><code class="language-dart">var count = 0;               // inferred int, reassignable
final now = DateTime.now();  // set once at runtime (TS const)
const maxRetries = 3;        // compile-time constant
const pad = EdgeInsets.all(8); // const constructor → canonical instance

final list = [1, 2, 3];      // binding is final, list is still mutable
list.add(4);                 // OK
const frozen = [1, 2, 3];    // deeply immutable
// frozen.add(4);            // runtime UnsupportedError

late final String token;     // non-null, assigned later exactly once
late final config = loadConfig(); // lazy: computed on first read</code></pre>
<p><strong>Why const matters in Flutter:</strong> two <code>const Text('Hi')</code> expressions are the <em>same object</em>. The framework short-circuits rebuilding a subtree when the new widget is identical to the old one, so <code>const</code> is a free rebuild optimisation (see <a href="#/topic/flutter-widgets">Widgets &amp; Rendering</a>).</p>

<h3>2. Sound null safety — operators</h3>
<table>
  <thead><tr><th>Syntax</th><th>Meaning</th><th>TS equivalent</th></tr></thead>
  <tbody>
    <tr><td><code>T?</code></td><td>nullable type</td><td><code>T | null</code></td></tr>
    <tr><td><code>a?.b</code></td><td>null-aware access</td><td><code>a?.b</code></td></tr>
    <tr><td><code>a ?? b</code></td><td>default if null</td><td><code>a ?? b</code></td></tr>
    <tr><td><code>a ??= b</code></td><td>assign if null</td><td><code>a ??= b</code></td></tr>
    <tr><td><code>a!</code></td><td>assert non-null, <strong>throws</strong> if null</td><td><code>a!</code> (but TS's is a lie with no runtime check)</td></tr>
    <tr><td><code>[...?list]</code></td><td>null-aware spread</td><td><code>...(list ?? [])</code></td></tr>
    <tr><td><code>required</code></td><td>named param must be passed</td><td>non-optional property</td></tr>
  </tbody>
</table>
<p><strong>Type promotion</strong> works on local variables and (since Dart 3.2) on private <code>final</code> fields of the same library. It does <em>not</em> work on public fields or getters, because a subclass could override the getter to return something different the second time. Fix: copy to a local.</p>
<pre><code class="language-dart">class Profile {
  Profile(this.avatarUrl);
  final String? avatarUrl;
}

void show(Profile p) {
  // if (p.avatarUrl != null) print(p.avatarUrl.length); // error: not promoted (public field)
  final url = p.avatarUrl;         // copy to a local
  if (url != null) print(url.length); // promoted to String
  // or with a pattern:
  if (p.avatarUrl case final u?) print(u.length);
}</code></pre>

<h3>3. Functions and parameters</h3>
<pre><code class="language-dart">// positional, optional positional, named, required named
String greet(String name, [String? title]) =&gt; title == null ? 'Hi $name' : 'Hi $title $name';

Future&lt;void&gt; book({
  required String roomId,
  required DateTime start,
  Duration length = const Duration(minutes: 30),
  bool notify = true,
}) async { /* ... */ }

book(roomId: 'r-12', start: DateTime.now()); // named args read like an options object

// functions are objects; typedefs name function types
typedef Validator = String? Function(String value);
final Validator notEmpty = (v) =&gt; v.isEmpty ? 'Required' : null;

// cascade: call several members on the same object
final sb = StringBuffer()
  ..write('a')
  ..write('b');</code></pre>

<h3>4. Classes, constructors and equality</h3>
<pre><code class="language-dart">class Booking {
  // generative constructor with initializing formals + initializer list + assert
  Booking({required this.id, required this.start, required this.end, this.title = ''})
      : assert(end.isAfter(start), 'end must be after start');

  // named constructor
  Booking.instant(String id)
      : this(id: id, start: DateTime.now(), end: DateTime.now().add(const Duration(minutes: 30)));

  // factory constructor: may return a cached/sub-type instance, used for fromJson
  factory Booking.fromJson(Map&lt;String, dynamic&gt; json) =&gt; Booking(
        id: json['id'] as String,
        start: DateTime.parse(json['start'] as String),
        end: DateTime.parse(json['end'] as String),
        title: json['title'] as String? ?? '',
      );

  final String id;
  final DateTime start;
  final DateTime end;
  final String title;

  Duration get length =&gt; end.difference(start); // getter

  Booking copyWith({DateTime? end, String? title}) =&gt;
      Booking(id: id, start: start, end: end ?? this.end, title: title ?? this.title);

  // value equality is OPT-IN (default == is identity, like JS ===)
  @override
  bool operator ==(Object other) =&gt;
      other is Booking &amp;&amp; other.id == id &amp;&amp; other.start == start &amp;&amp; other.end == end &amp;&amp; other.title == title;

  @override
  int get hashCode =&gt; Object.hash(id, start, end, title);
}</code></pre>
<p>In real projects the boilerplate (<code>copyWith</code>, <code>==</code>, <code>hashCode</code>, <code>fromJson</code>) is usually generated with <code>freezed</code> / <code>json_serializable</code> via <code>build_runner</code>, or reduced with <code>equatable</code>. Know how to hand-write it; know that teams generate it.</p>

<h3>5. Inheritance, interfaces, mixins, extensions</h3>
<pre><code class="language-dart">abstract interface class Clock { DateTime now(); } // pure interface (Dart 3 modifier)

class SystemClock implements Clock {
  @override
  DateTime now() =&gt; DateTime.now();
}

// mixin: reusable members "mixed into" a class (like a trait; NOT a React mixin/HOC)
mixin Logging {
  void log(String msg) =&gt; print('[\${runtimeType}] $msg');
}

mixin Retry on Object {
  Future&lt;T&gt; retry&lt;T&gt;(Future&lt;T&gt; Function() run, {int times = 3}) async {
    for (var i = 0; ; i++) {
      try { return await run(); } catch (_) { if (i == times - 1) rethrow; }
      await Future.delayed(Duration(milliseconds: 200 * (1 &lt;&lt; i))); // 200, 400, 800 ms
    }
  }
}

class BookingRepo with Logging, Retry { /* gets log() and retry() */ }

// extension: add methods to a type you don't own (like a TS module augmentation, but scoped by import)
extension DateTimeX on DateTime {
  bool isSameDay(DateTime o) =&gt; year == o.year &amp;&amp; month == o.month &amp;&amp; day == o.day;
  String get hhmm =&gt; '\${hour.toString().padLeft(2, '0')}:\${minute.toString().padLeft(2, '0')}';
}</code></pre>
<p><strong>Mixin linearisation:</strong> <code>class C extends A with M1, M2</code> builds the chain <code>A → A+M1 → A+M1+M2 → C</code>. If two mixins define <code>log</code>, the last one wins and can call <code>super.log</code> to reach the previous one. This is how Flutter's own <code>SingleTickerProviderStateMixin</code> and <code>WidgetsBindingObserver</code> work.</p>
<p><strong>Extensions are static:</strong> they are resolved by the <em>static</em> type, so they don't work on <code>dynamic</code> and can't be overridden polymorphically.</p>
<p><strong>Class modifiers (Dart 3):</strong> <code>sealed</code> (closed set of subtypes in this library → exhaustiveness), <code>final</code> (no subclassing/implementing outside the library), <code>base</code> (can extend, not implement), <code>interface</code> (can implement, not extend), <code>mixin class</code>. Extension types (Dart 3.3) are zero-cost wrappers over another type — e.g. <code>extension type UserId(String value) {}</code> — like a TS branded type but checked by the compiler.</p>

<h3>6. Collections</h3>
<pre><code class="language-dart">final ids = &lt;String&gt;['a', 'b'];              // List&lt;String&gt;
final seen = &lt;String&gt;{};                     // Set — note {} alone is a Map
final byId = &lt;String, Booking&gt;{};            // Map

// collection-if / collection-for / spread — you will see these in every build()
final items = [
  'Header',
  if (isAdmin) 'Admin panel',
  for (final b in bookings) b.title,
  ...?extraItems,
];

// iterable methods are LAZY (like generators), unlike JS array methods
final titles = bookings.where((b) =&gt; b.length &gt; const Duration(hours: 1)).map((b) =&gt; b.title);
// nothing has run yet; .toList() materialises it
final list = titles.toList();</code></pre>
<p><code>where</code>/<code>map</code> return a lazy <code>Iterable</code>. Iterating it twice re-runs the closures. In a <code>build()</code> method that is a hidden cost; call <code>.toList()</code> once if you iterate more than once.</p>

<h3>7. Records and patterns (Dart 3)</h3>
<pre><code class="language-dart">// record: anonymous, immutable, structurally-typed tuple with value equality
(int, String) pair = (1, 'one');
({double lat, double lng}) point = (lat: 28.6, lng: 77.2);
print(point.lat);

// multiple return values without a class
(List&lt;Booking&gt;, int total) page(List&lt;Booking&gt; all, int n) =&gt; (all.take(n).toList(), all.length);
final (items, total) = page(all, 20);   // destructuring

// destructure JSON safely
void handle(Map&lt;String, dynamic&gt; json) {
  if (json case {'id': String id, 'start': String start, 'end': String end}) {
    print('valid booking $id from $start to $end');
  } else {
    throw FormatException('bad booking json: $json');
  }
}

// switch expression with guards
String label(int minutes) =&gt; switch (minutes) {
  &lt;= 0 =&gt; 'now',
  &lt; 60 =&gt; 'in $minutes min',
  final m when m % 60 == 0 =&gt; 'in \${m ~/ 60} h',
  _ =&gt; 'later',
};</code></pre>
<p>Records are the closest thing Dart has to a TS object literal/tuple. Records <em>do</em> have structural equality (<code>(1, 'a') == (1, 'a')</code> is true), unlike classes and lists.</p>

<h3>8. Generics are reified</h3>
<pre><code class="language-dart">final xs = &lt;int&gt;[1, 2];
print(xs is List&lt;int&gt;);     // true
print(xs is List&lt;String&gt;);  // false — impossible to know in TS at runtime

T firstOfType&lt;T&gt;(List&lt;Object&gt; items) =&gt; items.whereType&lt;T&gt;().first; // uses T at runtime

// bounded generics
class Cache&lt;K extends Object, V&gt; { final _m = &lt;K, V&gt;{}; }</code></pre>

<h3>9. Async: Future, async/await, error handling</h3>
<pre><code class="language-dart">Future&lt;List&lt;Booking&gt;&gt; fetchBookings(String roomId) async {
  final res = await http
      .get(Uri.parse('$baseUrl/rooms/$roomId/bookings'))
      .timeout(const Duration(seconds: 10));             // TimeoutException
  if (res.statusCode != 200) {
    throw HttpFailure(res.statusCode, res.body);
  }
  final list = jsonDecode(res.body) as List&lt;dynamic&gt;;
  return list.cast&lt;Map&lt;String, dynamic&gt;&gt;().map(Booking.fromJson).toList();
}

// parallel, like Promise.all
final (rooms, me) = await (fetchRooms(), fetchMe()).wait;   // record .wait (Dart 3)
final results = await Future.wait([a(), b(), c()]);          // classic form

// try / on / catch / finally — 'on' filters by type
try {
  await fetchBookings('r-1');
} on TimeoutException {
  showRetry();
} on HttpFailure catch (e) {
  if (e.status == 401) logout();
} catch (e, st) {
  reportError(e, st);   // st = StackTrace
  rethrow;
}</code></pre>
<p><code>Future</code> ≈ Promise. Two differences worth naming: (1) a Future's callbacks run as microtasks just like Promise <code>then</code>; (2) Dart distinguishes <code>Exception</code> (expected, catch it) from <code>Error</code> (programmer bug — <code>TypeError</code>, <code>StateError</code>, <code>RangeError</code> — don't catch-and-continue).</p>

<h3>10. Streams and async*</h3>
<pre><code class="language-dart">// async* generator → Stream (like an async generator in JS)
Stream&lt;int&gt; countdown(int from) async* {
  for (var i = from; i &gt;= 0; i--) {
    await Future.delayed(const Duration(seconds: 1));
    yield i;
  }
}

// consume
await for (final n in countdown(3)) { print(n); }   // like for await...of

// StreamController: push-based source (like an RxJS Subject)
final _events = StreamController&lt;String&gt;.broadcast(); // broadcast = many listeners
Stream&lt;String&gt; get events =&gt; _events.stream;
void emit(String e) =&gt; _events.add(e);
Future&lt;void&gt; dispose() =&gt; _events.close();          // ALWAYS close

// transform
final sub = searchQueries
    .map((q) =&gt; q.trim())
    .where((q) =&gt; q.length &gt;= 2)
    .distinct()
    .asyncMap(api.search)     // sequential; use switchMap from rxdart for "latest wins"
    .listen(render, onError: showError);
// later: await sub.cancel();</code></pre>
<table>
  <thead><tr><th></th><th>Single-subscription (default)</th><th>Broadcast</th></tr></thead>
  <tbody>
    <tr><td>Listeners</td><td>Exactly one; second <code>listen</code> throws <code>StateError</code></td><td>Any number</td></tr>
    <tr><td>Buffering</td><td>Buffers events until listened</td><td>Events with no listener are dropped</td></tr>
    <tr><td>Typical source</td><td>File read, HTTP body, <code>async*</code></td><td>UI events, app-wide event bus</td></tr>
  </tbody>
</table>

<h3>11. The event loop in detail</h3>
<pre><code class="language-dart">void main() {
  print('1 sync');
  Future(() =&gt; print('4 event queue'));            // like setTimeout(0)
  Future.microtask(() =&gt; print('3 microtask'));    // like queueMicrotask
  Future.value(1).then((_) =&gt; print('3b microtask (completed future)'));
  print('2 sync');
}
// 1 sync, 2 sync, 3 microtask, 3b microtask, 4 event queue</code></pre>
<p>Same ordering rules as JS. The Flutter-specific consequence: frame callbacks are events too, so an endless chain of microtasks can starve rendering.</p>

<h3>12. Isolates</h3>
<pre><code class="language-dart">import 'dart:isolate';
import 'package:flutter/foundation.dart' show compute;

// one-shot: spawn, run, return result, exit (Dart 2.19+)
Future&lt;List&lt;Booking&gt;&gt; parseInBackground(String body) =&gt;
    Isolate.run(() =&gt; _parse(body));

// must be a top-level/static function or a closure that captures only sendable values
List&lt;Booking&gt; _parse(String body) =&gt;
    (jsonDecode(body) as List).cast&lt;Map&lt;String, dynamic&gt;&gt;().map(Booking.fromJson).toList();

// Flutter's helper (also works on web, where it runs on the same thread)
final bookings = await compute(_parse, body);</code></pre>
<ul>
  <li><strong>Cost:</strong> spawning an isolate is cheap-ish (well under the cost of a large parse — but still milliseconds), and messages are <em>copied</em>. Sending a 20 MB object graph back can cost as much as the work you saved. <code>Isolate.exit</code> (used by <code>Isolate.run</code>) transfers the result without a copy.</li>
  <li><strong>Long-lived workers:</strong> use <code>Isolate.spawn</code> with a <code>SendPort</code>/<code>ReceivePort</code> pair, or a package that pools isolates.</li>
  <li><strong>Plugins in background isolates:</strong> calling platform channels from a background isolate needs <code>BackgroundIsolateBinaryMessenger.ensureInitialized(token)</code> (Flutter 3.7+; check current docs for limits).</li>
  <li><strong>Web:</strong> isolates are not available the same way (no shared Dart VM); <code>compute</code> falls back to the main thread. Check current docs for web workers with Wasm.</li>
</ul>

<h3>13. Libraries, packages and privacy</h3>
<pre><code class="language-dart">// pubspec.yaml is package.json; pub.dev is npm; 'flutter pub get' is npm install
import 'package:http/http.dart' as http;       // prefix import
import 'src/booking.dart' show Booking;        // only these names
import 'dart:math' hide Rectangle;

part 'booking.g.dart';   // generated code joined to this library (json_serializable/freezed)

class _Cache {}          // underscore = private to THIS LIBRARY (file), not to the class</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — a typed API client with a sealed Result</h3>
<p>Scenario: a meeting-room tablet app fetches today's bookings. You want callers to handle every outcome without exceptions leaking into widgets.</p>
<pre><code class="language-dart">sealed class Result&lt;T&gt; {
  const Result();
}
final class Ok&lt;T&gt; extends Result&lt;T&gt; { const Ok(this.value); final T value; }
final class Err&lt;T&gt; extends Result&lt;T&gt; { const Err(this.failure); final AppFailure failure; }

sealed class AppFailure { const AppFailure(); }
final class Offline extends AppFailure { const Offline(); }
final class Unauthorized extends AppFailure { const Unauthorized(); }
final class Server extends AppFailure { const Server(this.status); final int status; }

class BookingApi {
  BookingApi(this._client, this._baseUrl);
  final http.Client _client;
  final String _baseUrl;

  Future&lt;Result&lt;List&lt;Booking&gt;&gt;&gt; today(String roomId) async {
    try {
      final res = await _client
          .get(Uri.parse('$_baseUrl/rooms/$roomId/bookings?day=today'))
          .timeout(const Duration(seconds: 8));
      return switch (res.statusCode) {
        200 =&gt; Ok(await Isolate.run(() =&gt; _parse(res.body))),
        401 || 403 =&gt; const Err(Unauthorized()),
        final s =&gt; Err(Server(s)),
      };
    } on SocketException {
      return const Err(Offline());
    } on TimeoutException {
      return const Err(Offline());
    }
  }
}

// caller — the compiler forces you to handle every case
String banner(Result&lt;List&lt;Booking&gt;&gt; r) =&gt; switch (r) {
  Ok(value: final list) when list.isEmpty =&gt; 'Room is free all day',
  Ok(value: final list) =&gt; '\${list.length} bookings today',
  Err(failure: Offline()) =&gt; 'You are offline — showing cached schedule',
  Err(failure: Unauthorized()) =&gt; 'Session expired',
  Err(failure: Server(:final status)) =&gt; 'Server error $status',
};</code></pre>
<p>RN equivalent: a TS discriminated union <code>{ ok: true, value } | { ok: false, error }</code>. The Dart version adds compile-time exhaustiveness: add a <code>RateLimited</code> failure and every <code>switch</code> that doesn't handle it stops compiling.</p>

<h3>Example 2 — debounced search with Streams</h3>
<pre><code class="language-dart">class RoomSearch {
  final _queries = StreamController&lt;String&gt;();
  late final Stream&lt;List&lt;Room&gt;&gt; results = _queries.stream
      .map((q) =&gt; q.trim())
      .distinct()
      .transform(_debounce(const Duration(milliseconds: 300)))
      .asyncExpand((q) =&gt; Stream.fromFuture(_api.search(q)));

  RoomSearch(this._api);
  final RoomApi _api;

  void onChanged(String q) =&gt; _queries.add(q);
  Future&lt;void&gt; dispose() =&gt; _queries.close();
}

StreamTransformer&lt;T, T&gt; _debounce&lt;T&gt;(Duration d) {
  return StreamTransformer.fromBind((input) {
    Timer? timer;
    late StreamController&lt;T&gt; out;
    StreamSubscription&lt;T&gt;? sub;
    out = StreamController&lt;T&gt;(
      onListen: () {
        sub = input.listen(
          (v) { timer?.cancel(); timer = Timer(d, () =&gt; out.add(v)); },
          onError: out.addError,
          onDone: () { timer?.cancel(); out.close(); },
        );
      },
      onCancel: () { timer?.cancel(); return sub?.cancel(); },
    );
    return out.stream;
  });
}</code></pre>
<p>In production most teams pull in <code>rxdart</code> for <code>debounceTime</code> / <code>switchMap</code>. Writing it once by hand shows you understand subscription lifecycle — the Dart equivalent of cleaning up a <code>useEffect</code>.</p>

<h3>Example 3 — moving a big JSON parse off the UI isolate</h3>
<pre><code class="language-dart">// BEFORE: 4 MB catalogue parsed on the UI isolate → ~200 ms frame on a mid-range Android
final data = jsonDecode(body);                       // blocks build/layout/paint

// AFTER: parse + map to models in a worker isolate, return typed objects
final catalogue = await Isolate.run(() {
  final raw = jsonDecode(body) as List&lt;dynamic&gt;;
  return [for (final j in raw) Product.fromJson(j as Map&lt;String, dynamic&gt;)];
});</code></pre>
<p>Rule of thumb used by many teams: anything that would take more than a few ms (a frame is 16.7 ms at 60 Hz, 8.3 ms at 120 Hz) goes to an isolate. Measure in <strong>profile mode</strong> on a real low-end device; debug mode JIT numbers are meaningless. RN comparison: this is the job you'd push to a JSI/C++ module or accept on the JS thread — see <a href="#/topic/rn-performance">RN Performance</a>.</p>

<h3>Example 4 — a mixin + extension combo you'll see in real code</h3>
<pre><code class="language-dart">mixin Disposable {
  final _disposers = &lt;void Function()&gt;[];
  void onDispose(void Function() fn) =&gt; _disposers.add(fn);
  void disposeAll() { for (final d in _disposers.reversed) d(); _disposers.clear(); }
}

class CheckInController with Disposable {
  CheckInController(Stream&lt;Booking&gt; updates) {
    final sub = updates.listen(_onUpdate);
    onDispose(sub.cancel);
    final timer = Timer.periodic(const Duration(seconds: 30), (_) =&gt; _tick());
    onDispose(timer.cancel);
  }
  void _onUpdate(Booking b) {}
  void _tick() {}
}

extension on Duration {
  String get human =&gt; inHours &gt; 0 ? '\${inHours}h \${inMinutes % 60}m' : '\${inMinutes}m';
}</code></pre>

<h3>Example 5 — patterns for parsing a heterogeneous websocket payload</h3>
<pre><code class="language-dart">sealed class RoomEvent {}
class Booked extends RoomEvent { Booked(this.b); final Booking b; }
class Cancelled extends RoomEvent { Cancelled(this.id); final String id; }
class Unknown extends RoomEvent { Unknown(this.raw); final Object? raw; }

RoomEvent decode(Object? msg) =&gt; switch (msg) {
  {'type': 'booked', 'booking': Map&lt;String, dynamic&gt; b} =&gt; Booked(Booking.fromJson(b)),
  {'type': 'cancelled', 'id': String id} =&gt; Cancelled(id),
  _ =&gt; Unknown(msg),
};</code></pre>
<p>Map patterns check keys <em>and</em> runtime types in one go. In TS you'd write a zod schema or hand-written type guards for the same safety.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>Equality surprises</h3>
<ul>
  <li><code>[1, 2] == [1, 2]</code> is <strong>false</strong> (identity), but <code>const [1, 2] == const [1, 2]</code> is <strong>true</strong> (canonicalised — same object). Use <code>listEquals</code> from <code>package:flutter/foundation.dart</code> or <code>package:collection</code>'s <code>DeepCollectionEquality</code>.</li>
  <li>Records compare structurally; classes don't unless you override <code>==</code> and <code>hashCode</code> together. Overriding one without the other breaks <code>Set</code>/<code>Map</code> lookups.</li>
  <li>A mutable object used as a <code>Map</code> key whose fields change after insertion becomes unfindable (hash changed).</li>
</ul>

<h3>Numbers</h3>
<ul>
  <li>On native, <code>int</code> is 64-bit two's complement and overflows silently (wraps). On the web, <code>int</code> is a JS number (53-bit safe integer range). Code that hashes or does bit tricks can behave differently on web.</li>
  <li><code>~/</code> is integer division; <code>/</code> always returns <code>double</code>. <code>5 / 2 == 2.5</code>, <code>5 ~/ 2 == 2</code>.</li>
  <li><code>int</code> is not a subtype of <code>double</code>: <code>double x = 1;</code> is fine (literal), but <code>double x = someInt;</code> is a compile error — call <code>.toDouble()</code>. A JSON number like <code>3</code> decodes as <code>int</code>, so <code>json['price'] as double</code> throws; use <code>(json['price'] as num).toDouble()</code>.</li>
</ul>

<h3>Null safety corners</h3>
<ul>
  <li><code>late</code> fields that are read before assignment throw <code>LateInitializationError</code> — a runtime crash with no compile-time warning. <code>late final</code> assigned twice also throws.</li>
  <li><code>late</code> with an initializer is lazy: the initializer runs on first access, possibly at a surprising time (and on whatever isolate reads it first).</li>
  <li>Generic <code>T</code> is potentially nullable: inside <code>class Box&lt;T&gt;</code>, <code>T</code> could be <code>String?</code>. Use <code>T extends Object</code> when you need non-null.</li>
  <li><code>Map</code> lookup <code>map[key]</code> always returns <code>V?</code> — even when you "know" the key exists.</li>
</ul>

<h3>Async corners</h3>
<ul>
  <li><strong>Unawaited futures:</strong> calling an <code>async</code> function without <code>await</code> means its exception goes to the zone's uncaught-error handler, not your try/catch. Enable the <code>unawaited_futures</code> lint and use <code>unawaited(...)</code> from <code>dart:async</code> when fire-and-forget is intentional.</li>
  <li><strong>Error before listener:</strong> a Future that completes with an error before anyone attaches a handler is reported as unhandled (like an unhandled Promise rejection), even if you <code>await</code> it a moment later. Common when you create several futures and then await them one by one — use <code>Future.wait</code> / record <code>.wait</code>.</li>
  <li><strong>Listening twice</strong> to a single-subscription stream throws <code>Bad state: Stream has already been listened to</code> — classic with <code>StreamBuilder</code> rebuilt with a new <code>stream:</code> getter each build.</li>
  <li><strong>Broadcast streams drop events</strong> when no one is listening — late subscribers miss the current value (use <code>rxdart</code>'s <code>BehaviorSubject</code> or a <code>ValueNotifier</code> if "latest value" semantics are needed).</li>
  <li><strong>Timer leak:</strong> <code>Timer.periodic</code> keeps firing forever unless cancelled; inside a disposed widget it will call into dead state.</li>
  <li><strong>Async gap + BuildContext:</strong> after an <code>await</code> in a widget, the widget may be gone. Check <code>if (!context.mounted) return;</code> before using context (covered in <a href="#/topic/flutter-widgets">Widgets &amp; Rendering</a>).</li>
</ul>

<h3>Isolate corners</h3>
<ul>
  <li>The closure passed to <code>Isolate.run</code> must only capture <em>sendable</em> objects. Accidentally capturing <code>this</code> (a State, a controller holding a socket) either fails or copies a huge graph. Pull the data into a local first.</li>
  <li>Static/global variables are <em>per isolate</em>: a singleton initialised on the main isolate is uninitialised (fresh copy) in the worker.</li>
  <li>Plugins/platform channels aren't available in a plain background isolate until the background messenger is initialised.</li>
</ul>

<h3>Generic variance</h3>
<p>Dart generics are covariant: <code>List&lt;Object&gt; objs = &lt;String&gt;['a'];</code> compiles, and <code>objs.add(1)</code> then throws a <code>TypeError</code> at runtime. This is one of the few places Dart's soundness is enforced by a runtime check rather than the compiler.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>1. Bang-operator everywhere</h3>
<pre><code class="language-dart">// BAD — every ! is a crash you've promised won't happen
Text(user!.profile!.displayName!)

// GOOD — model the absence, or fail with context
final name = user?.profile?.displayName ?? 'Guest';
// or validate once at the boundary (fromJson) and keep the model non-null inside</code></pre>
<p>RN analogue: <code>user!.profile!.name</code> in TS compiles to <em>nothing</em> and gives you "undefined is not an object" later. In Dart you get an immediate <code>Null check operator used on a null value</code> — better, but still a crash.</p>

<h3>2. <code>dynamic</code> leaking from JSON</h3>
<pre><code class="language-dart">// BAD — dynamic flows through the app, no static checks, crashes at random distances
final data = jsonDecode(body);
final title = data['items'][0]['title'];   // dynamic

// GOOD — convert at the edge into typed models (hand-written, json_serializable, freezed)
final items = (jsonDecode(body) as Map&lt;String, dynamic&gt;)['items'] as List&lt;dynamic&gt;;
final models = items.map((e) =&gt; Item.fromJson(e as Map&lt;String, dynamic&gt;)).toList();</code></pre>
<p>Turn on <code>strict-casts</code>, <code>strict-inference</code> and <code>strict-raw-types</code> in <code>analysis_options.yaml</code> to make implicit dynamic a compile error.</p>

<h3>3. CPU work in an <code>async</code> function</h3>
<p>Believing <code>async</code> means background. Sorting 50k items or decoding a large image header inside an async function still runs on the UI isolate. Fix: <code>Isolate.run</code>/<code>compute</code>, or chunk the work and yield between chunks with <code>await Future.delayed(Duration.zero)</code> (crude, but avoids a dedicated isolate for medium jobs).</p>

<h3>4. Forgetting to close controllers and cancel subscriptions</h3>
<pre><code class="language-dart">class _ClockState extends State&lt;Clock&gt; {
  late final StreamSubscription&lt;DateTime&gt; _sub;
  @override
  void initState() {
    super.initState();
    _sub = ticker.listen((t) =&gt; setState(() =&gt; _now = t));
  }
  @override
  void dispose() {
    _sub.cancel();        // without this: setState() called after dispose() + leak
    super.dispose();
  }
  DateTime _now = DateTime.now();
  @override
  Widget build(BuildContext context) =&gt; Text(_now.toIso8601String());
}</code></pre>
<p>Same bug class as a missing <code>useEffect</code> cleanup in React.</p>

<h3>5. "Immutable" models with mutable collections</h3>
<pre><code class="language-dart">class Schedule {
  const Schedule(this.bookings);
  final List&lt;Booking&gt; bookings;    // final binding, but list is mutable
}
schedule.bookings.add(b);          // mutates shared state, no rebuild, == unchanged

// FIX: copy defensively and expose unmodifiable views
Schedule(List&lt;Booking&gt; bookings) : bookings = List.unmodifiable(bookings);</code></pre>
<p>This is the Dart version of mutating Redux state: the reference doesn't change, so selectors/rebuild checks think nothing happened.</p>

<h3>6. Overriding <code>==</code> but not <code>hashCode</code></h3>
<p>Objects that are "equal" land in different hash buckets; <code>Set</code> holds duplicates and <code>Map</code> lookups miss. Always override both (or use <code>equatable</code>/<code>freezed</code>).</p>

<h3>7. Catching <code>Error</code>s</h3>
<p><code>catch (e)</code> with no type swallows <code>TypeError</code>, <code>StateError</code> and <code>AssertionError</code> — real bugs. Catch specific exception types with <code>on</code>; let errors crash in dev and reach your crash reporter in prod (<code>FlutterError.onError</code> + <code>PlatformDispatcher.instance.onError</code>).</p>

<h3>8. Iterating a lazy Iterable repeatedly</h3>
<pre><code class="language-dart">final visible = all.where(expensiveFilter);   // lazy
print(visible.length);                        // runs filter over all
for (final v in visible) {}                   // runs it AGAIN
// fix: final visible = all.where(expensiveFilter).toList();</code></pre>

<h3>9. Global singletons as hidden state</h3>
<p>Top-level <code>final api = Api();</code> is easy but untestable and per-isolate. Inject dependencies (constructor params, Provider/Riverpod — see <a href="#/topic/flutter-state-arch">State, Navigation &amp; Platform</a>).</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. Why does Flutter use Dart instead of JavaScript?</div>
  <div class="qa-answer">
    <p>Dart has both a JIT (enables stateful hot reload in debug) and an AOT compiler (native machine code in release, fast startup, no interpreter or bridge). Its GC is tuned for many short-lived allocations — exactly what widget rebuilds produce. And Google controls the language, so it could evolve features Flutter needs (sound null safety, const canonicalisation, patterns). With JS you'd need an engine like Hermes in the app and a boundary to native — which is precisely RN's architecture (<a href="#/topic/rn-architecture">RN Architecture</a>).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. What does "sound" null safety mean, and how is it different from TypeScript's strictNullChecks?</div>
  <div class="qa-answer">
    <p>Sound means the static type is a guarantee: an expression of type <code>String</code> can never evaluate to null at runtime. The compiler can even use it to drop null checks. TS's checks are unsound by design — <code>any</code>, type assertions and unchecked index access let null slip through with no runtime trace. Dart's escape hatches (<code>!</code>, <code>late</code>, <code>dynamic</code>) all insert runtime checks, so failure is immediate and located at the lie.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Explain final vs const, and why const matters for Flutter performance.</div>
  <div class="qa-answer">
    <p><code>final</code> = assigned once at runtime. <code>const</code> = value known at compile time, deeply immutable, and canonicalised (identical expressions share one instance). Flutter's element update step checks whether the new widget is <em>identical</em> to the old one; for a <code>const</code> widget it is, so the whole subtree is skipped during rebuild. It's free memoisation — the closest RN analogue is <code>React.memo</code> on a component with stable props, but without writing any comparison.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Walk me through the Dart event loop. How does it compare to JS?</div>
  <div class="qa-answer">
    <p>Each isolate runs one loop with two queues: microtasks (completed future callbacks, <code>scheduleMicrotask</code>) and events (timers, I/O, pointer events, port messages, frame callbacks). It drains <em>all</em> microtasks, then processes one event, then drains microtasks again. It's the same model as JS (microtasks = promise jobs, events = macrotasks). The practical consequence: long sync work or runaway microtasks delay the next frame event — jank.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. What is an isolate? When and how would you use one?</div>
  <div class="qa-answer">
    <p>An isolate is an independent Dart execution context with its own heap and event loop; isolates communicate only through ports, with messages copied (or transferred on exit). Use one for CPU-bound work that would take more than a few ms on the UI isolate: big JSON decode, image/crypto processing, diffing large lists, search indexing. <code>Isolate.run</code>/<code>compute</code> for one-shot jobs; <code>Isolate.spawn</code> + ports for a long-lived worker. Watch the message cost — returning a giant object graph can eat the savings — and remember statics are per-isolate and plugins need the background messenger.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Future vs Stream — and single-subscription vs broadcast?</div>
  <div class="qa-answer">
    <p>A <code>Future</code> delivers one value or error (Promise). A <code>Stream</code> delivers zero or more values then done (async iterable / Observable). Single-subscription streams buffer until one listener attaches and throw if listened twice — good for a file or HTTP body. Broadcast streams allow many listeners and drop events when none are attached — good for event buses. If late listeners need the current value, you want a <code>ValueNotifier</code> or rxdart's <code>BehaviorSubject</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Mixins vs inheritance vs extensions — when do you use each?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Inheritance</strong> (<code>extends</code>): a true "is-a" with shared implementation; single only.</li>
      <li><strong>Interfaces</strong> (<code>implements</code>): every class is an implicit interface; use for test fakes and contracts.</li>
      <li><strong>Mixins</strong> (<code>with</code>): reuse behaviour across unrelated classes, e.g. <code>TickerProviderStateMixin</code> adding vsync to a State. Can be constrained with <code>on</code>. Linearised, so order matters.</li>
      <li><strong>Extensions</strong>: add methods to types you don't own (<code>DateTime</code>, <code>BuildContext</code>). Resolved statically; no polymorphism, no state.</li>
    </ul>
    <p>React mapping: mixins are what React used to have with <code>createClass</code> mixins and later replaced with hooks; in Flutter they are still idiomatic because widgets are classes.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How would you model loading/error/data states in Dart 3?</div>
  <div class="qa-answer">
    <p>A <code>sealed class</code> with one subclass per state, consumed with a <code>switch</code> expression and patterns. The compiler enforces exhaustiveness, so adding a state is a compile-time to-do list. Before Dart 3, teams used <code>freezed</code> unions (<code>when/map</code>). Riverpod's <code>AsyncValue</code> is the same idea built into the library.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. What are records and patterns, and what problem do they solve?</div>
  <div class="qa-answer">
    <p>Records are anonymous immutable aggregates with structural typing and value equality — <code>(int, String)</code> or <code>({double lat, double lng})</code> — for multiple returns and lightweight grouping without a class. Patterns destructure and test shape + type in one step (in <code>switch</code>, <code>if-case</code>, variable declarations), which makes JSON validation and state handling concise and safe. They replace a lot of hand-written casts and helper classes.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Probing: "Generics are reified" — give a case where that matters.</div>
  <div class="qa-answer">
    <p><code>whereType&lt;T&gt;()</code>, <code>is List&lt;int&gt;</code>, and DI lookups like <code>context.read&lt;AuthRepo&gt;()</code> in Provider all use the runtime type argument. In TS, <code>get&lt;AuthRepo&gt;()</code> is impossible without passing a token, because <code>T</code> is erased. The flip side: covariant generics mean <code>List&lt;Object&gt; x = &lt;String&gt;[]; x.add(1);</code> compiles and throws at runtime.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Probing: a teammate wrapped everything in try/catch and the app still reports unhandled exceptions. Why?</div>
  <div class="qa-answer">
    <p>Likely unawaited futures (errors go to the zone, not the caller's try/catch), errors in stream listeners without <code>onError</code>, futures that error before a handler is attached, or exceptions thrown in widget build/layout (routed to <code>FlutterError.onError</code>). Fix: lint for <code>unawaited_futures</code>, use <code>Future.wait</code>, add <code>onError</code>, and install global handlers (<code>FlutterError.onError</code>, <code>PlatformDispatcher.instance.onError</code>) that forward to Crashlytics/Sentry.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. FDE scenario: a customer says "your Flutter kiosk freezes for a second every time the schedule refreshes". What do you do?</div>
  <div class="qa-answer">
    <ol>
      <li>Reproduce on their hardware class (often a low-end Android tablet) in <strong>profile</strong> mode; debug mode is JIT and misleading.</li>
      <li>Open DevTools → Performance; look for a long UI-thread frame at refresh time and see what's on the CPU profile (typically <code>jsonDecode</code>, model mapping, or sorting).</li>
      <li>Move parse + mapping into <code>Isolate.run</code>; return compact typed models. If the payload is huge, ask whether the API can paginate or send a delta — often the real fix is server-side.</li>
      <li>Check whether the refresh rebuilds the entire screen (wide <code>setState</code>) — narrow it (see <a href="#/topic/flutter-widgets">Widgets &amp; Rendering</a>).</li>
      <li>Verify with before/after frame timings and ship behind a flag if the customer is change-averse.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Probing: what's the difference between Exception and Error in Dart?</div>
  <div class="qa-answer">
    <p><code>Exception</code>s represent expected failure conditions callers should handle (I/O, format, timeout). <code>Error</code>s represent programming bugs (type errors, null-check failures, state errors, range errors) that shouldn't be caught and continued; they should crash in dev and be reported in prod. Catching <code>Error</code> to keep going hides bugs.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You explain JIT (hot reload) vs AOT (release) and why Dart has both.</li>
    <li>You treat <code>!</code>, <code>late</code> and <code>dynamic</code> as runtime-checked escape hatches, not conveniences.</li>
    <li>You know <code>async</code> isn't parallelism and reach for isolates for CPU work, aware of copy cost.</li>
    <li>You model states with sealed classes and exhaustive switches.</li>
    <li>You can map every concept back to TS/React and say where the analogy breaks.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Why is [1, 2] == [1, 2] false in Dart, and how do you give a class value equality correctly?</div>
  <div class="qa-answer">
    <p>Equality is identity by default (like JS <code>===</code>), so two separately created lists are different objects. <code>const [1, 2] == const [1, 2]</code> is true only because const values are canonicalised into the same object. To compare contents use <code>listEquals</code> from <code>package:flutter/foundation.dart</code> or <code>DeepCollectionEquality</code> from <code>package:collection</code>. Records compare structurally, but classes don't unless you override <code>==</code> and <code>hashCode</code> together. Overriding only one puts "equal" objects in different hash buckets, so a <code>Set</code> holds duplicates and <code>Map</code> lookups miss. In real projects this boilerplate is generated with <code>freezed</code> or reduced with <code>equatable</code>.</p>
<pre><code class="language-dart">@override
bool operator ==(Object other) =&gt;
    other is Booking &amp;&amp; other.id == id &amp;&amp; other.title == title;

@override
int get hashCode =&gt; Object.hash(id, title);</code></pre>
  </div>
</div>
` },

  ]
});
