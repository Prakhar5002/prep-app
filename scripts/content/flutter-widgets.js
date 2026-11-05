window.PREP_SITE.registerTopic({
  id: "flutter-widgets",
  module: "flutter",
  title: "Widgets & Rendering",
  estimatedReadTime: "32 min",
  tags: ["flutter","widgets","element-tree","render-object","constraints","impeller","performance","keys"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Flutter paints every pixel itself: <strong>widgets are throwaway blueprints, elements are persistent identity (BuildContext), render objects do layout and paint</strong> — and layout is "constraints down, sizes up, parent positions".</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>No platform widgets:</strong> Flutter ships its own rendering engine and paints every pixel onto a surface, like a game engine — it does not hand views to UIKit/Android Views.</li>
    <li><strong>Three trees:</strong> Widget (≈ React element, immutable, recreated every build) → Element (≈ fiber, = BuildContext, holds State) → RenderObject (layout/paint/hit-test, drawn by Flutter, not the OS).</li>
    <li><strong>Update vs replace:</strong> same <code>runtimeType</code> + <code>key</code> → update and keep State; otherwise dispose and recreate; identical (const) → skip subtree.</li>
    <li><strong>Lifecycle:</strong> createState → initState → didChangeDependencies → build → (didUpdateWidget / setState → build)* → deactivate → dispose. No inherited lookups in initState.</li>
    <li><strong>BuildContext</strong> looks <em>up</em> from its own element; use Builder/extract to get a context below a widget you just created; check <code>mounted</code> after awaits.</li>
    <li><strong>Keys:</strong> ValueKey for list identity, UniqueKey to reset, GlobalKey for cross-tree State access (costly), PageStorageKey for scroll.</li>
    <li><strong>Constraints:</strong> tight vs loose vs unbounded; Expanded in an unbounded axis errors; Row gives Text unbounded width → overflow → wrap in Expanded.</li>
    <li><strong>Frame pipeline:</strong> animate → build → layout → paint → composite on UI thread; rasterise on raster thread. Budget per thread: 16.7 ms @60 Hz, 8.3 ms @120 Hz.</li>
    <li><strong>Impeller</strong> replaced Skia (default on iOS and modern Android; check current docs per platform) and precompiles shaders → no first-use shader jank; it's a GPU renderer, unlike Fabric which is a commit layer over native views.</li>
    <li><strong>Performance:</strong> keep rebuilds small and layout/paint cheap — const, small widgets, push state down, lazy lists + itemExtent, RepaintBoundary, avoid saveLayer (Opacity/clips), size images, aspect-specific MediaQuery accessors.</li>
    <li><strong>Measure</strong> in profile mode on real low-end hardware with DevTools frame chart and rebuild stats.</li>
    <li><strong>Trade-off vs RN:</strong> pixel consistency and control vs emulated platform look, semantics-tree a11y and costly platform views.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Calling setState high in the tree for a value only one leaf shows</strong> (a ticking clock, a progress bar) — every frame rebuilds the whole screen. Fix: move the state into the leaf widget or wrap just that leaf in a ValueListenableBuilder/AnimatedBuilder, and make the rest const. (Runner-up: list items without keys keep the wrong State after removal.)</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Widgets are immutable blueprints; elements are the persistent identity that hold State and decide update-versus-replace by type and key; render objects do layout and paint."</div>
  <div class="revision-say">"Every layout bug I've hit comes down to constraints going down and sizes going up — a child can only pick a size inside what its parent allows."</div>
  <div class="revision-say">"For jank I check which bar is red in profile mode: UI means rebuild and Dart work, raster means expensive painting like saveLayer or oversized images."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>"Everything is a widget"</h3>
<p>Padding, alignment, gestures, themes and animations are widgets, not props or style objects. Where RN writes <code>&lt;View style={{padding: 16}}&gt;</code>, Flutter writes <code>Padding(padding: EdgeInsets.all(16), child: ...)</code>. It feels verbose but each widget does one thing, and composition is the only extension mechanism.</p>

<h3>Why Flutter draws its own pixels</h3>
<table>
  <thead><tr><th></th><th>React Native (Fabric)</th><th>Flutter</th></tr></thead>
  <tbody>
    <tr><td>Who draws a button?</td><td>Native UIKit / Android View created by the renderer</td><td>Flutter's engine paints it (Material/Cupertino widgets are re-implementations)</td></tr>
    <tr><td>Layout engine</td><td>Yoga (flexbox) in C++</td><td>Flutter's own box/sliver protocol in Dart</td></tr>
    <tr><td>Consistency across OS versions</td><td>Inherits native quirks per OS version</td><td>Pixel-identical across devices (you own the look)</td></tr>
    <tr><td>Platform look &amp; a11y</td><td>Free: real native controls</td><td>Emulated; a11y via a semantics tree mapped to native a11y APIs</td></tr>
    <tr><td>Embedding a native view</td><td>Natural (everything is native)</td><td>Platform views — possible but costly (see edge cases)</td></tr>
    <tr><td>Renderer analogy</td><td>Fabric: C++ shadow tree → commit → mount native views</td><td>Engine: layer tree → Impeller → GPU commands</td></tr>
  </tbody>
</table>
<p>Where the analogy "Impeller ↔ Fabric" breaks: Fabric is a <em>reconciler/commit layer</em> that still delegates drawing to the OS. Impeller is a <em>GPU renderer</em> — the part of Flutter that turns display lists into Metal/Vulkan/GL draw calls. The closer RN analogue to Impeller is "whatever UIKit/Android uses internally to draw" — RN doesn't own that layer at all (except libraries like Skia-based drawing).</p>

<h3>Why three trees instead of one</h3>
<ul>
  <li><strong>Widgets are cheap and immutable</strong>, so build methods can be pure and called often (React's "render is just a function" idea).</li>
  <li><strong>Elements preserve identity</strong> between builds so State, focus, scroll position and animation controllers survive (React keeps hook state on the fiber for the same reason).</li>
  <li><strong>RenderObjects are expensive</strong> (layout caches, painting), so they are reused and only marked dirty when their configuration actually changes.</li>
</ul>

<h3>Why interviewers care</h3>
<p>Every senior Flutter interview probes: "what happens when you call setState?", "why did my list items swap state?" (keys), "why does this throw an unbounded height error?" (constraints), and "how do you find and fix jank?" (rebuild scope, DevTools, raster vs UI thread). Those all fall out of this topic's mental model.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Picture 1 — the three trees</h3>
<div class="diagram">
<pre>
  WIDGET TREE (immutable,         ELEMENT TREE (persistent,        RENDER TREE (layout + paint)
  rebuilt every build)            = BuildContext)
  ───────────────────────         ──────────────────────────        ─────────────────────────────
  MyApp                ───────►   StatelessElement
   └ Scaffold          ───────►    └ StatefulElement ── State
      └ Padding        ───────►       └ SingleChildRenderObjectElement ──► RenderPadding
         └ Column      ───────►          └ MultiChildRenderObjectElement ──► RenderFlex
            ├ Text     ───────►             ├ StatelessElement
            │                               │  └ RichText element ─────────► RenderParagraph
            └ Counter  ───────►             └ StatefulElement ── _CounterState
                                               └ ... ──────────────────────► RenderParagraph

  Only "RenderObjectWidgets" (Padding, Flex, RichText, ...) create render objects.
  Stateless/Stateful widgets are pure composition: they have Elements but no RenderObject.
</pre>
</div>

<h3>Picture 2 — React mapping (and where it breaks)</h3>
<table>
  <thead><tr><th>Flutter</th><th>React / RN</th><th>Where the analogy breaks</th></tr></thead>
  <tbody>
    <tr><td>Widget</td><td>React element (JSX result)</td><td>Widgets are typed classes with constructors; you <em>can</em> <code>const</code> them for free memoisation.</td></tr>
    <tr><td>StatelessWidget</td><td>Function component without state</td><td>No hooks; side effects belong in a StatefulWidget's lifecycle.</td></tr>
    <tr><td>StatefulWidget + State</td><td>Component with <code>useState</code>/<code>useEffect</code></td><td>State is a separate long-lived object; the widget is recreated, the State is not.</td></tr>
    <tr><td>Element</td><td>Fiber</td><td>Exposed to you as <code>BuildContext</code>; React never exposes fibers.</td></tr>
    <tr><td>RenderObject</td><td>Yoga node + host view</td><td>Flutter paints it; RN asks the OS to.</td></tr>
    <tr><td><code>setState</code></td><td><code>setX</code> / re-render</td><td>Marks the element dirty; rebuild happens next frame, no batching API needed.</td></tr>
    <tr><td>Keys</td><td><code>key</code> prop</td><td>Same purpose, plus <code>GlobalKey</code> to reach State/RenderObject across the tree (like a ref, but heavier).</td></tr>
    <tr><td>InheritedWidget</td><td>Context provider</td><td>Lookup is O(1) and dependency-tracked per element.</td></tr>
  </tbody>
</table>

<h3>Picture 3 — constraints go down, sizes go up</h3>
<div class="diagram">
<pre>
  Parent (RenderBox)
     │  1. passes BoxConstraints(minW, maxW, minH, maxH) DOWN
     ▼
  Child.layout(constraints)
     │  2. child picks a Size that satisfies the constraints
     ▲  3. returns Size UP
     │
  Parent
     4. decides child's OFFSET (position) — the child never knows where it is

  tight:   min == max           (child has no choice: e.g. screen, SizedBox(w,h))
  loose:   min = 0, max = X     (child may be smaller: e.g. Center, Align)
  unbounded: max = infinity     (e.g. main axis of Column / ListView) → children
                                 that want to "fill" (Expanded-like) can't → error
</pre>
</div>
<p>RN/Yoga is two-pass flexbox with styles on the child (<code>flex: 1</code>, <code>width: '100%'</code>). In Flutter the <em>parent</em> decides the rules and a child can only ask for a size inside them — so "why is my <code>Container(width: 100)</code> full-width?" is answered by "its parent gave it tight constraints".</p>

<h3>Picture 4 — one frame</h3>
<div class="diagram">
<pre>
 vsync ─► UI thread (Dart):                                      Raster thread (C++):
          1 animate   (tickers advance AnimationControllers)
          2 build     (dirty elements call build())
          3 layout    (dirty render objects: constraints ↓ sizes ↑)
          4 paint     (record display lists into layers)
          5 composite (layer tree) ────── submit ─────────────► 6 rasterise with Impeller
                                                                   (GPU commands → screen)
 Budget: 16.7 ms @60 Hz, 8.3 ms @120 Hz — PER THREAD. The overlay shows both bars.
</pre>
</div>
<p>Other threads: the <em>platform</em> thread (iOS main / Android main — where plugins run) and I/O threads. Recent Flutter versions merged the UI and platform threads on mobile (check current docs) — relevant when a synchronous plugin call is slow.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. StatelessWidget</h3>
<pre><code class="language-dart">class RoomHeader extends StatelessWidget {
  const RoomHeader({super.key, required this.name, required this.isFree});
  final String name;
  final bool isFree;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);            // InheritedWidget lookup → dependency
    return Row(children: [
      Text(name, style: theme.textTheme.headlineMedium),
      const SizedBox(width: 8),                 // const: never rebuilt
      Icon(isFree ? Icons.check_circle : Icons.do_not_disturb,
           color: isFree ? Colors.green : Colors.red),
    ]);
  }
}</code></pre>
<p>Rebuilt when its parent rebuilds with a new instance, or when an InheritedWidget it depends on (Theme, MediaQuery) changes.</p>

<h3>2. StatefulWidget and the State lifecycle</h3>
<pre><code class="language-dart">class CountdownBadge extends StatefulWidget {
  const CountdownBadge({super.key, required this.endsAt});
  final DateTime endsAt;
  @override
  State&lt;CountdownBadge&gt; createState() =&gt; _CountdownBadgeState();
}

class _CountdownBadgeState extends State&lt;CountdownBadge&gt;
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulse;
  Timer? _timer;
  Duration _left = Duration.zero;

  @override
  void initState() {                       // once; like useEffect(() =&gt; ..., [])
    super.initState();
    _pulse = AnimationController(vsync: this, duration: const Duration(seconds: 1))..repeat(reverse: true);
    _restart();
  }

  @override
  void didUpdateWidget(CountdownBadge old) { // parent rebuilt with new config
    super.didUpdateWidget(old);
    if (old.endsAt != widget.endsAt) _restart(); // like an effect with [endsAt] deps
  }

  @override
  void didChangeDependencies() {           // an InheritedWidget we read changed
    super.didChangeDependencies();           // (also called once after initState)
  }

  void _restart() {
    _timer?.cancel();
    _tick();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) =&gt; _tick());
  }

  void _tick() =&gt; setState(() =&gt; _left = widget.endsAt.difference(DateTime.now()));

  @override
  void dispose() {                          // effect cleanup
    _timer?.cancel();
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) =&gt; FadeTransition(
        opacity: _pulse,
        child: Text('\${_left.inMinutes}m left'),
      );
}</code></pre>
<table>
  <thead><tr><th>State method</th><th>When</th><th>React hook analogue</th></tr></thead>
  <tbody>
    <tr><td><code>createState</code></td><td>Element mounted</td><td>component instance created</td></tr>
    <tr><td><code>initState</code></td><td>Once, before first build; no inherited lookups here</td><td><code>useEffect(..., [])</code> / lazy <code>useState</code> init</td></tr>
    <tr><td><code>didChangeDependencies</code></td><td>After initState and whenever a depended-on InheritedWidget changes</td><td>effect depending on context value</td></tr>
    <tr><td><code>build</code></td><td>Every time the element is dirty</td><td>render</td></tr>
    <tr><td><code>didUpdateWidget</code></td><td>Parent rebuilt with a new widget of same type/key</td><td>effect with prop deps</td></tr>
    <tr><td><code>setState</code></td><td>Marks element dirty; build next frame</td><td>state setter</td></tr>
    <tr><td><code>deactivate</code></td><td>Removed from tree (may be reinserted via GlobalKey this frame)</td><td>—</td></tr>
    <tr><td><code>dispose</code></td><td>Permanently removed</td><td>effect cleanup on unmount</td></tr>
  </tbody>
</table>
<p>Key difference from hooks: there are no dependency arrays and no stale-closure problem — <code>widget</code> and fields are always the current values because State is a long-lived object, not a re-run function.</p>

<h3>3. BuildContext</h3>
<p><code>BuildContext</code> is the Element's interface. It tells you <em>where</em> you are in the tree, so <code>Theme.of(context)</code> walks up from <em>this</em> element. Rules:</p>
<ul>
  <li>The <code>context</code> passed to a <code>build</code> method is the <em>widget's own</em> element — it can't see InheritedWidgets created inside that same build. Use a <code>Builder</code> or extract a widget to get a context below them (classic: <code>Scaffold.of(context)</code> failing).</li>
  <li>Don't use a context after an <code>await</code> without checking <code>context.mounted</code> (in State, <code>mounted</code>).</li>
  <li>Don't store a context in a long-lived object; it's tied to an element's lifetime.</li>
</ul>
<pre><code class="language-dart">Future&lt;void&gt; _cancel() async {
  final ok = await api.cancelBooking(widget.booking.id);
  if (!mounted) return;                       // or: if (!context.mounted) return;
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(ok ? 'Booking cancelled' : 'Could not cancel')),
  );
}</code></pre>

<h3>4. How an element decides: update or replace</h3>
<pre><code class="language-dart">// framework logic (simplified) — Widget.canUpdate
static bool canUpdate(Widget oldWidget, Widget newWidget) =&gt;
    oldWidget.runtimeType == newWidget.runtimeType &amp;&amp; oldWidget.key == newWidget.key;</code></pre>
<ul>
  <li>Same type + key → <strong>update</strong>: the element keeps its State, gets the new widget, calls <code>didUpdateWidget</code>, rebuilds.</li>
  <li>Different → <strong>replace</strong>: old element (and State) disposed, new one created.</li>
  <li>Identical instance (e.g. <code>const</code>) → <strong>skip</strong>: no rebuild of that subtree at all.</li>
</ul>
<p>Exactly React's reconciliation heuristic (type + key), with one addition: the <code>identical</code> short-circuit is automatic.</p>

<h3>5. Keys</h3>
<table>
  <thead><tr><th>Key</th><th>Use</th></tr></thead>
  <tbody>
    <tr><td><code>ValueKey(id)</code></td><td>Items in a reorderable/filterable list — the RN <code>keyExtractor</code> equivalent.</td></tr>
    <tr><td><code>ObjectKey(obj)</code></td><td>Identity by object when there's no single id field.</td></tr>
    <tr><td><code>UniqueKey()</code></td><td>Force a fresh element/State each build (reset). Never create it inside build by accident.</td></tr>
    <tr><td><code>GlobalKey</code></td><td>Unique across the app; lets you access <code>currentState</code> (e.g. <code>FormState.validate()</code>) and move a subtree without losing State. Expensive; use sparingly.</td></tr>
    <tr><td><code>PageStorageKey</code></td><td>Persist scroll offset across tab switches.</td></tr>
  </tbody>
</table>

<h3>6. Layout: BoxConstraints and the common widgets</h3>
<pre><code class="language-dart">// Row/Column = Flex. Main axis can be unbounded; Expanded/Flexible split the remainder.
Row(children: [
  const Icon(Icons.meeting_room),
  const SizedBox(width: 12),
  Expanded(                                   // flex: 1 in Yoga terms
    child: Text(room.name, overflow: TextOverflow.ellipsis),
  ),
  Flexible(child: Text(room.floor)),         // may be smaller than its share (loose)
]);

// Column inside a scrollable → unbounded height. Expanded inside it = error.
// LayoutBuilder exposes the constraints so you can build responsively:
LayoutBuilder(builder: (context, c) {
  return c.maxWidth &gt; 900 ? const TwoPaneSchedule() : const SinglePaneSchedule();
});</code></pre>
<table>
  <thead><tr><th>Need</th><th>Flutter</th><th>RN / Yoga</th></tr></thead>
  <tbody>
    <tr><td>Fill remaining space</td><td><code>Expanded</code></td><td><code>flex: 1</code></td></tr>
    <tr><td>Fixed size</td><td><code>SizedBox(width, height)</code></td><td><code>width</code>/<code>height</code></td></tr>
    <tr><td>Min/max size</td><td><code>ConstrainedBox</code></td><td><code>minWidth</code>/<code>maxWidth</code></td></tr>
    <tr><td>Overlay / absolute</td><td><code>Stack</code> + <code>Positioned</code></td><td><code>position: 'absolute'</code></td></tr>
    <tr><td>Aspect ratio</td><td><code>AspectRatio</code></td><td><code>aspectRatio</code></td></tr>
    <tr><td>Scroll a list</td><td><code>ListView.builder</code> (lazy)</td><td><code>FlatList</code></td></tr>
    <tr><td>Mixed scroll effects</td><td><code>CustomScrollView</code> + slivers</td><td>nested lists / headers (harder)</td></tr>
  </tbody>
</table>

<h3>7. Slivers in one paragraph</h3>
<p>Box layout asks "how big are you?". Sliver layout (used inside scroll views) asks "given this scroll offset and remaining viewport, what part of you is visible and how much space do you consume?". That's how <code>SliverAppBar</code>, <code>SliverList</code> and <code>SliverGrid</code> lazily build only visible children and combine collapsing headers with lists in one scroll — what you'd stitch together in RN with <code>FlatList</code> headers and Animated.</p>

<h3>8. The rendering pipeline and Impeller</h3>
<ul>
  <li><strong>Build</strong>: only dirty elements rebuild, depth-first, in one pass per frame (multiple <code>setState</code> calls coalesce).</li>
  <li><strong>Layout</strong>: single pass with <em>relayout boundaries</em> — if a render object's size can't affect its parent (tight constraints), relayout stops there.</li>
  <li><strong>Paint</strong>: render objects record drawing into layers. A <code>RepaintBoundary</code> gives a subtree its own layer, so repainting a spinner doesn't repaint the screen (and vice-versa).</li>
  <li><strong>Raster</strong>: the layer tree goes to the raster thread. With the old Skia backend, shaders were compiled at first use, causing first-run "shader compilation jank". Impeller precompiles a fixed set of shaders at build time, which removes that class of jank and gives more predictable frame times. It's the default on iOS and on modern Android devices, with fallbacks on older ones — check current docs.</li>
</ul>

<h3>9. Performance toolkit</h3>
<ul>
  <li><strong>Always measure in profile mode</strong> (<code>flutter run --profile</code>) on a real, preferably low-end, device. Debug mode is JIT + assertions and is 5–10× slower.</li>
  <li><strong>DevTools Performance view</strong>: frame chart (UI vs raster time), CPU profiler, "track widget builds", "rebuild stats" to see which widgets rebuilt.</li>
  <li><strong>Performance overlay</strong> (<code>showPerformanceOverlay: true</code>): two graphs — top raster, bottom UI. Red bars = missed frames, and which graph tells you which thread to fix.</li>
  <li><strong>Widget inspector</strong>: layout explorer for constraints/overflow bugs; "highlight repaints" to find paint storms.</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — narrowing rebuild scope</h3>
<p>Scenario: a booking timeline screen with a live clock at the top. The clock ticks every second via <code>setState</code> in the screen's State, rebuilding the 200-row timeline each tick.</p>
<pre><code class="language-dart">// BEFORE — the whole screen rebuilds every second
class _ScheduleScreenState extends State&lt;ScheduleScreen&gt; {
  DateTime _now = DateTime.now();
  late final Timer _t = Timer.periodic(const Duration(seconds: 1), (_) =&gt; setState(() =&gt; _now = DateTime.now()));
  @override
  void dispose() { _t.cancel(); super.dispose(); }
  @override
  Widget build(BuildContext context) =&gt; Column(children: [
        Text(DateFormat.Hms().format(_now)),
        Expanded(child: Timeline(bookings: widget.bookings)),  // rebuilt every tick
      ]);
}

// AFTER — push the changing state down into its own leaf widget
class ScheduleScreen extends StatelessWidget {
  const ScheduleScreen({super.key, required this.bookings});
  final List&lt;Booking&gt; bookings;
  @override
  Widget build(BuildContext context) =&gt; Column(children: [
        const LiveClock(),                                     // owns its timer
        Expanded(child: Timeline(bookings: bookings)),        // untouched by ticks
      ]);
}

// or, without a new class, a ValueListenableBuilder scopes the rebuild:
ValueListenableBuilder&lt;DateTime&gt;(
  valueListenable: clock,                 // ValueNotifier&lt;DateTime&gt;
  builder: (context, now, child) =&gt; Text(DateFormat.Hms().format(now)),
);</code></pre>
<p>React equivalent: moving <code>useState</code> into a child component instead of the screen. Same principle — state should live in the smallest subtree that needs it.</p>

<h3>Example 2 — the keys bug</h3>
<pre><code class="language-dart">// A list of attendee tiles, each a StatefulWidget holding an "expanded" bool.
// Remove the first attendee → the SECOND tile appears expanded instead.

Column(children: [
  for (final a in attendees) AttendeeTile(attendee: a),   // no key
]);

// Why: Column matches children by position + type. Element #0 is reused for the
// new first attendee and keeps the old State (expanded = true).

// FIX
Column(children: [
  for (final a in attendees) AttendeeTile(key: ValueKey(a.id), attendee: a),
]);</code></pre>
<p>Identical to the React "index as key" bug. In Flutter it's more common because people forget keys entirely for <code>Column</code> children (there's no warning, unlike React's console warning).</p>

<h3>Example 3 — fixing "unbounded height" and overflow</h3>
<pre><code class="language-dart">// ERROR: Vertical viewport was given unbounded height.
Column(children: [
  const Header(),
  ListView(children: rows),            // ListView wants to be as tall as possible; Column gives infinity
]);

// FIX A: give the list the remaining space
Column(children: [
  const Header(),
  Expanded(child: ListView(children: rows)),
]);

// FIX B: one scroll for everything (header scrolls away) — slivers
CustomScrollView(slivers: [
  const SliverToBoxAdapter(child: Header()),
  SliverList.builder(itemCount: rows.length, itemBuilder: (_, i) =&gt; rows[i]),
]);

// "A RenderFlex overflowed by 37 pixels on the right"
Row(children: [Text(longTitle), const Icon(Icons.star)]);       // Text is unconstrained in a Row
Row(children: [Expanded(child: Text(longTitle, overflow: TextOverflow.ellipsis)), const Icon(Icons.star)]);</code></pre>
<p>Avoid the "fix" <code>shrinkWrap: true</code> on a long ListView inside another scrollable: it lays out every child eagerly, killing virtualisation (like rendering a FlatList inside a ScrollView in RN).</p>

<h3>Example 4 — a performant long list</h3>
<pre><code class="language-dart">ListView.builder(
  itemCount: bookings.length,
  itemExtent: 72,                          // fixed height: no per-item layout to compute scroll extent
  itemBuilder: (context, i) {
    final b = bookings[i];
    return BookingRow(key: ValueKey(b.id), booking: b);   // small, const-friendly widget
  },
);

class BookingRow extends StatelessWidget {
  const BookingRow({super.key, required this.booking});
  final Booking booking;
  @override
  Widget build(BuildContext context) =&gt; ListTile(
        leading: const Icon(Icons.event),
        title: Text(booking.title),
        subtitle: Text('\${booking.start.hhmm} – \${booking.end.hhmm}'),  // hhmm: DateTime extension from Dart Essentials
      );
}</code></pre>
<p>RN mapping: <code>itemExtent</code> ≈ <code>getItemLayout</code>; <code>ListView.builder</code> ≈ <code>FlatList</code> (lazy); <code>ListView(children: ...)</code> ≈ <code>ScrollView</code> with all children rendered. Compare with <a href="#/topic/rn-performance">RN Performance</a>.</p>

<h3>Example 5 — CustomPainter with a RepaintBoundary</h3>
<pre><code class="language-dart">class OccupancyRing extends StatelessWidget {
  const OccupancyRing({super.key, required this.progress});
  final Animation&lt;double&gt; progress;
  @override
  Widget build(BuildContext context) =&gt; RepaintBoundary(       // isolate repaints to this layer
        child: CustomPaint(size: const Size.square(120), painter: _RingPainter(progress)),
      );
}

class _RingPainter extends CustomPainter {
  _RingPainter(this.progress) : super(repaint: progress);       // repaint on tick, no rebuild
  final Animation&lt;double&gt; progress;
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 10
      ..color = const Color(0xFFE5860B);
    canvas.drawArc(Offset.zero &amp; size, -1.57, 6.28 * progress.value, false, paint);
  }
  @override
  bool shouldRepaint(_RingPainter old) =&gt; old.progress != progress;
}</code></pre>
<p>Passing the animation as <code>repaint:</code> skips build and layout entirely — only paint runs per frame. The RN analogue is Reanimated driving a native/Skia property on the UI thread without touching React.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>Lifecycle corners</h3>
<ul>
  <li><strong><code>setState() called after dispose()</code></strong>: an async callback (HTTP, timer, stream) completes after the widget left the tree. Guard with <code>if (!mounted) return;</code> and cancel subscriptions in <code>dispose</code>.</li>
  <li><strong>Calling <code>Theme.of</code>/<code>MediaQuery.of</code> in <code>initState</code></strong> throws/asserts — dependencies aren't established yet. Use <code>didChangeDependencies</code>.</li>
  <li><strong>State not resetting when you expect it to</strong>: same widget type at the same position = same State. Changing a prop doesn't reset internal state (same as React). Use a <code>ValueKey</code> tied to the identity (e.g. <code>ValueKey(booking.id)</code>) to force a fresh State.</li>
  <li><strong>Initialising State from a widget prop once</strong> (<code>_value = widget.initial</code> in initState) then wondering why parent updates are ignored — handle <code>didUpdateWidget</code>.</li>
  <li><strong><code>UniqueKey()</code> inside build</strong>: a new key every build means a new State every build — silent state loss and wasted work.</li>
</ul>

<h3>Layout corners</h3>
<ul>
  <li><strong>Flex in an unbounded axis</strong>: <code>Expanded</code> inside a <code>Column</code> inside a <code>SingleChildScrollView</code> errors — infinity can't be divided.</li>
  <li><strong><code>Container(width: 100)</code> ignored</strong>: a tight parent constraint wins. Wrap in <code>Center</code>/<code>Align</code> (loosens constraints) to let the size apply.</li>
  <li><strong><code>IntrinsicHeight</code>/<code>IntrinsicWidth</code></strong>: ask children their natural size with a speculative layout pass — can be O(N²) in nested cases. Fine for a small row; avoid in list items.</li>
  <li><strong>Text scaling</strong>: large accessibility font sizes cause overflows. Test with the system text scale cranked up; don't clamp it to 1.0 globally (accessibility regression).</li>
</ul>

<h3>Rendering corners</h3>
<ul>
  <li><strong><code>Opacity</code>, <code>ShaderMask</code>, <code>ColorFilter</code>, clips with anti-aliasing</strong> may trigger <code>saveLayer</code> — an offscreen buffer per frame. Prefer <code>FadeTransition</code>/<code>AnimatedOpacity</code> (which can apply opacity at the layer level) or bake alpha into the colour.</li>
  <li><strong>Platform views</strong> (embedding a native map, WebView or ad SDK): extra composition cost, input/texture synchronisation and, on Android, different composition modes with different trade-offs (check current docs). Keep them few and avoid them inside scrolling lists.</li>
  <li><strong>Images</strong>: decoding a 4000×3000 photo into a 120 px thumbnail wastes memory; use <code>cacheWidth</code>/<code>cacheHeight</code> or <code>ResizeImage</code>.</li>
  <li><strong>Hot reload doesn't re-run <code>initState</code></strong> or global initialisers; changes there need hot restart. Enum/generic changes may require a restart too.</li>
</ul>

<h3>MediaQuery rebuild storms</h3>
<p><code>MediaQuery.of(context)</code> makes a widget depend on <em>all</em> of MediaQuery, so the keyboard opening (viewInsets change) rebuilds every dependent each frame of the animation. Use the aspect-specific accessors like <code>MediaQuery.sizeOf(context)</code> / <code>MediaQuery.paddingOf(context)</code> (Flutter 3.10+) so you only rebuild when that aspect changes.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>1. Helper methods instead of widgets</h3>
<pre><code class="language-dart">// ANTI-PATTERN — _buildHeader() is part of the parent's build; it can't be const,
// has no own Element, and always rebuilds with the parent.
Widget _buildHeader() =&gt; Row(children: [/* ... */]);

// PREFER — a small widget class: own element, const-able, rebuilds independently,
// shows up in DevTools by name.
class _Header extends StatelessWidget { const _Header(); /* build ... */ }</code></pre>
<p>It's the Flutter version of "inline render functions vs components" in React — functions are fine for tiny bits, but extraction gives you rebuild boundaries.</p>

<h3>2. Expensive work in build()</h3>
<p>Sorting, filtering, date formatting of hundreds of rows, regex compilation, or <code>jsonDecode</code> inside <code>build</code> runs on every rebuild. Compute once when data changes (in state/controller) and pass results down. Like computing in render without <code>useMemo</code>.</p>

<h3>3. Creating controllers in build()</h3>
<pre><code class="language-dart">// BUG — new controller each build: cursor jumps, text lost, leaks
Widget build(BuildContext context) =&gt; TextField(controller: TextEditingController(text: draft));

// FIX — create once in initState, dispose in dispose
late final _ctrl = TextEditingController(text: widget.draft);
@override
void dispose() { _ctrl.dispose(); super.dispose(); }</code></pre>

<h3>4. Wide setState at the root</h3>
<p>Holding app-wide state in the root State and calling <code>setState</code> rebuilds the whole app. Flutter's diffing is fast, but not free on a 2,000-widget screen at 120 Hz. Move state down, or use listenable/provider-based scoping (<a href="#/topic/flutter-state-arch">State, Navigation &amp; Platform</a>).</p>

<h3>5. Missing <code>const</code></h3>
<p>Not marking stateless subtrees <code>const</code> forfeits the identical-instance short-circuit. Enable the <code>prefer_const_constructors</code> / <code>prefer_const_literals_to_create_immutables</code> lints (part of <code>flutter_lints</code> sets; check current lint set contents).</p>

<h3>6. Using <code>GlobalKey</code> as a state-management tool</h3>
<p>Reaching into other widgets' State via <code>GlobalKey.currentState</code> to call methods is the Flutter version of imperative ref spaghetti. It's appropriate for <code>Form</code>, <code>Navigator</code>, <code>ScaffoldMessenger</code>; otherwise lift state up or use a controller/notifier.</p>

<h3>7. <code>shrinkWrap: true</code> everywhere</h3>
<p>Applied to fix "unbounded height" errors, it forces full layout of all children and disables lazy building. Use <code>Expanded</code> or slivers instead.</p>

<h3>8. Profiling in debug mode</h3>
<p>Decisions made from debug-mode frame times ("Flutter is slow on this screen") are routinely wrong. Use profile mode; release for startup timings.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. Explain the widget, element and render object trees.</div>
  <div class="qa-answer">
    <p>Widgets are immutable configuration, recreated every build. Elements are the persistent instantiation of widgets at a location — they hold State, manage children, and decide whether to update or replace when a new widget arrives (same <code>runtimeType</code> + <code>key</code> → update). RenderObjects, created only by RenderObjectWidgets, do layout, paint and hit-testing. Separating them lets builds be cheap and frequent while expensive layout/paint objects are reused. In React terms: elements ↔ JSX elements, Elements ↔ fibers, RenderObjects ↔ host nodes — except Flutter paints them itself.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. What exactly happens when you call setState?</div>
  <div class="qa-answer">
    <p>The callback runs synchronously to mutate fields; then the State's element is marked dirty and the framework schedules a frame. On the next vsync, the build phase rebuilds dirty elements (all setState calls in that frame coalesce), diffing new child widgets against old elements via <code>canUpdate</code>. Changed RenderObjects are marked needing layout/paint, then layout, paint and compositing run, and the raster thread draws. Calling setState during build or after dispose asserts/throws.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. What is BuildContext, and why does Scaffold.of(context) sometimes fail?</div>
  <div class="qa-answer">
    <p>BuildContext is the Element for the widget whose build is running. <code>X.of(context)</code> walks <em>up</em> from that element. If you create the <code>Scaffold</code> in the same build method, your context is <em>above</em> it, so the lookup misses. Fix with a <code>Builder</code> or by extracting the child into its own widget, giving you a context below the Scaffold.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. When do you need keys? Explain the different kinds.</div>
  <div class="qa-answer">
    <p>Whenever siblings of the same type can be reordered, inserted or removed and carry state (StatefulWidgets, text fields, animations). Without keys elements match by position, so state sticks to the wrong item. <code>ValueKey</code>/<code>ObjectKey</code> for identity, <code>UniqueKey</code> to force a reset, <code>GlobalKey</code> to access a State or move a subtree across parents (costly, must be unique app-wide), <code>PageStorageKey</code> for scroll persistence.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Explain "constraints go down, sizes go up, parent sets position".</div>
  <div class="qa-answer">
    <p>Layout is a single pass: a parent passes <code>BoxConstraints</code> (min/max width/height) to each child; the child chooses a size within them and returns it; the parent then positions the child. A child can't choose its position or exceed its constraints. This explains most layout surprises: a <code>SizedBox(width: 100)</code> under tight constraints is forced full width; an <code>Expanded</code> under an unbounded axis errors; a <code>Text</code> in a <code>Row</code> overflows because Row gives non-flex children unbounded width.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. What is Impeller and what problem did it solve?</div>
  <div class="qa-answer">
    <p>Impeller is Flutter's rendering backend that replaced Skia on iOS and (progressively) Android. Skia compiled shaders lazily at runtime, causing jank the first time an effect appeared ("shader compilation jank"), which teams patched with SkSL warm-up. Impeller uses a fixed set of shaders precompiled at engine build time and targets Metal/Vulkan directly, giving more predictable frame times. Compare with RN: Fabric is a reconciler/commit layer and drawing is still done by the OS; Impeller is the actual GPU renderer — Flutter owns that layer. For exact per-platform defaults and fallbacks, check current docs.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How do you find and fix jank in a Flutter screen?</div>
  <div class="qa-answer">
    <ol>
      <li>Profile mode on a real low-end device; turn on the performance overlay.</li>
      <li>Identify the thread: UI bar red → build/layout/Dart work; raster bar red → expensive painting (saveLayer, huge images, clips, platform views).</li>
      <li>UI fixes: narrow rebuild scope, <code>const</code>, extract widgets, lazy lists with <code>itemExtent</code>, move CPU work to isolates, avoid <code>MediaQuery.of</code> storms.</li>
      <li>Raster fixes: remove <code>Opacity</code>/clip layers, <code>RepaintBoundary</code> around animated parts, size images with <code>cacheWidth</code>.</li>
      <li>Verify in DevTools frame chart and rebuild stats; add a performance regression test or integration benchmark if it's critical.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Map the StatefulWidget lifecycle to React hooks. Where does the mapping break?</div>
  <div class="qa-answer">
    <p><code>initState</code> ≈ mount effect, <code>didUpdateWidget</code> ≈ effect with prop deps, <code>didChangeDependencies</code> ≈ effect on context value, <code>dispose</code> ≈ cleanup, <code>build</code> ≈ render. It breaks because State is a persistent object: there are no dependency arrays and no stale closures, you compare old vs new widget yourself, and controllers (animation, text, scroll) are explicit objects you must create and dispose. Also <code>initState</code> can't read inherited widgets.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Probing: why is a const widget cheaper, mechanically?</div>
  <div class="qa-answer">
    <p>When an element updates a child, it first checks <code>identical(oldWidget, newWidget)</code>. A const constructor call returns the same canonical instance each build, so the check passes and the element skips calling update/build for that subtree entirely. Non-const widgets with equal fields still trigger an update (Flutter widgets don't override <code>==</code>), which then rebuilds descendants.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Probing: how does Flutter do accessibility if it draws everything itself?</div>
  <div class="qa-answer">
    <p>Render objects contribute to a parallel <strong>semantics tree</strong> (labels, actions, roles), which the engine translates to native accessibility APIs (UIAccessibility, AccessibilityNodeInfo). Standard widgets fill this in; custom painters need a <code>Semantics</code> widget or <code>semanticsBuilder</code>. Test with TalkBack/VoiceOver and the semantics debugger. In RN you get this mostly for free because views are native.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. FDE scenario: a customer reports the room-schedule screen stutters when the on-screen keyboard opens on their Android tablets.</div>
  <div class="qa-answer">
    <p>Hypothesis first: the keyboard animation changes <code>viewInsets</code> every frame, and widgets calling <code>MediaQuery.of(context)</code> (or a Scaffold resizing a heavy body) rebuild and relayout each frame. Steps: reproduce in profile mode on that tablet class; DevTools rebuild stats while opening the keyboard; switch to <code>MediaQuery.sizeOf</code>/<code>viewInsetsOf</code> where appropriate; isolate the heavy timeline behind a <code>RepaintBoundary</code> and a const subtree; consider <code>resizeToAvoidBottomInset: false</code> with a scroll-into-view approach if layout thrash remains. Ship with before/after frame timings.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Probing: when would you write a custom RenderObject instead of composing widgets?</div>
  <div class="qa-answer">
    <p>Rarely — when you need a layout protocol no combination of widgets expresses efficiently (e.g. a timeline that positions bookings by time with overlap columns in a single pass), or hit-testing/painting that would otherwise need many layers. <code>CustomMultiChildLayout</code>/<code>Flow</code>/<code>CustomPainter</code> cover most cases first. Custom RenderObjects mean owning layout, paint, hit-test, semantics and intrinsic sizes.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You can draw the three trees and explain canUpdate (type + key).</li>
    <li>You explain layout bugs through constraints rather than trial-and-error wrapping.</li>
    <li>You split UI vs raster thread problems and measure in profile mode.</li>
    <li>You know why const, small widgets and RepaintBoundary help, mechanically.</li>
    <li>You can contrast Flutter's self-drawn model with RN's native views honestly (a11y, platform views, consistency).</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. You get "Vertical viewport was given unbounded height" and "A RenderFlex overflowed by 37 pixels". How do you diagnose and fix each using the constraints rule?</div>
  <div class="qa-answer">
    <p>Both come from a child receiving an unbounded constraint on one axis. A <code>ListView</code> inside a <code>Column</code> wants to be as tall as possible, but the Column's main axis gives it infinity, so it errors: wrap the list in <code>Expanded</code> to give it the remaining space, or switch to a <code>CustomScrollView</code> with slivers if the header should scroll away. The overflow happens because a <code>Row</code> gives non-flex children like <code>Text</code> unbounded width, so a long title runs past the edge: wrap it in <code>Expanded</code> with <code>overflow: TextOverflow.ellipsis</code>. Avoid the "fix" of <code>shrinkWrap: true</code> on a long list, because it lays out every child eagerly and kills virtualisation.</p>
  </div>
</div>
` },

  ]
});
