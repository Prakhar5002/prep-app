/* Practice challenges — RN Deep Dives: Lists & Rendering (FlatList, FlashList v2, SectionList) */
(function () {
  var reg = window.PREP_SITE.registerChallenge;

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-list-flatlist-windowing', track: 'rn', category: 'rn-lists',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'Walk through FlatList\'s windowing internals — what do windowSize and maxToRenderPerBatch actually control, and does FlatList recycle view instances the way a native RecyclerView/UICollectionView does?',
    answer: {
      core: `FlatList (built on <code>VirtualizedList</code>) does <strong>not</strong> recycle view instances — it virtualizes: as items enter or leave a "rendered window" around the current viewport, their component instances are mounted or unmounted from scratch, not handed a reused view slot to redraw. <code>windowSize</code> controls how many screen-lengths of content stay mounted around the viewport; <code>maxToRenderPerBatch</code> controls how many new cells get mounted per incremental render pass as the window advances during scroll.`,
      mechanism: `<code>windowSize</code> is measured in units of the visible viewport length, not pixels or item count — the default, <code>21</code>, means "visible area + up to 10 screens above + 10 screens below" stay mounted at once. As the user scrolls past that boundary, VirtualizedList advances the window and schedules mounting of the next chunk of cells, capped per pass by <code>maxToRenderPerBatch</code> (default <code>10</code>) so a single scroll tick doesn't try to mount, say, 200 cells synchronously and stall the JS thread. Related knobs: <code>initialNumToRender</code> (how many cells mount on first paint, before any scroll), <code>updateCellsBatchingPeriod</code> (how long to coalesce batches before committing them), and <code>removeClippedSubviews</code> (an additional native-side clipping optimization, mainly relevant on Android). None of this reuses a view instance across different data items — that's precisely the capability a real recycler (native <code>RecyclerView</code>, or FlashList's JS-level recycle pool) adds on top of plain virtualization.
<pre><code class="language-jsx">&lt;FlatList
  data={items}
  keyExtractor={(item) =&gt; item.id}
  renderItem={renderItem}
  windowSize={11}              // fewer off-screen screens kept mounted → less memory
  maxToRenderPerBatch={8}      // smaller batches → less JS-thread work per tick
  initialNumToRender={6}
  removeClippedSubviews={true}
/&gt;</code></pre>`,
      tradeoffs: `Shrinking <code>windowSize</code>/<code>maxToRenderPerBatch</code> reduces memory pressure and per-batch JS-thread work, but increases the odds that a fast fling outruns the mounted window and reveals momentary blank cells. Growing them fills the screen more reliably during fast scrolling at the cost of more concurrent mounted instances and longer per-batch JS work, which can itself cause the batch to land late. There's no universally-correct value — it's a tuning knob against your item complexity and target device tier. <code>removeClippedSubviews</code> has historically had edge-case rendering glitches on Android and is not free to enable blindly.`,
      followups: [
        { q: 'What\'s the practical failure mode of setting windowSize too small for the content?', a: 'Blank/empty cells flash into view during fast scrolling or flinging, because content just outside the (too-small) mounted window hasn\'t been mounted yet when the viewport reaches it.' },
        { q: 'Does increasing maxToRenderPerBatch always make scrolling smoother?', a: 'No — a larger batch mounts more cells per pass, which does more synchronous JS-thread work per tick and can itself delay when that batch finishes and commits, trading "less blank space" for "more risk of a janky pause." It has to be tuned empirically against real item complexity and device class.' }
      ],
      redFlags: `Saying "FlatList recycles views like RecyclerView" — it doesn't; it mounts/unmounts fresh component instances as the window moves, with no view-instance reuse pool. That distinction is exactly what separate libraries like FlashList add. Also: describing windowSize as a pixel or item-count value (it's in screen-length units).`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-list-flashlist-v2', track: 'rn', category: 'rn-lists',
    difficulty: 'staff', type: 'deep-dive',
    prompt: 'FlashList went through a ground-up rewrite in v2 (2025). What changed mechanically, and specifically — do you still need to pass estimatedItemSize?',
    answer: {
      core: `No — v2 removed <code>estimatedItemSize</code> entirely; item sizing is now auto-measured, with no size hint required or even accepted the way v1 needed it. v2 is a full JS-only rewrite (no native code/native dependencies) that <strong>hard-requires the New Architecture</strong>, unlike v1, which shipped an actual native recycler implementation and could run on the old architecture too.`,
      mechanism: `v2's sizing works via three cooperating pieces: <strong>progressive rendering</strong> (mount only the first item or two, build up a real layout map as more items render, rather than assuming layout up front), <strong>predictions</strong> (estimate the size of not-yet-rendered items from already-measured items of the same type), and <strong>corrections</strong> (fix any layout error before paint, inside <code>useLayoutEffect</code>, so users never see a visible jump). That correction step is only possible because Fabric (New Architecture) exposes <strong>synchronous</strong> layout measurement — the old bridge's async-only measurement couldn't support "measure, then correct, before this frame paints," which is exactly why v1 needed a native module (<code>AutoLayoutView</code>) to paper over the async gap, and why v2 can drop native code entirely once that gap no longer exists. Recycling itself is still real: v2 keeps a JS-managed recycle pool (tunable via <code>maxItemsInRecyclePool</code> for pathological heterogeneous-size cases) that reuses cell slots by item type instead of mounting/unmounting fresh instances the way plain FlatList does. Masonry layouts moved from a separate <code>MasonryFlashList</code> component to a plain prop (with <code>overrideItemLayout</code> for per-item column spans), and <code>maintainVisibleContentPosition</code> is on by default, so prepending items (e.g. loading older messages above the viewport) doesn't visually yank the scroll position.`,
      tradeoffs: `v2's requirement of New Architecture is a non-issue in practice, since New Architecture has been mandatory since RN 0.82 anyway — there's no longer a "stay on old arch to keep using v1" escape hatch worth planning around. Migrating from v1 mostly means deleting now-meaningless <code>estimatedItemSize</code> props (harmless if left, but signal you haven't actually re-read the sizing model) and re-checking any code that assumed v1's native recycler internals or the old separate Masonry component.`,
      followups: [
        { q: 'If v2 has no native code, what made v1 fast, and is that benefit lost?', a: 'v1\'s speed came from an actual native recycler (reusing host views, RecyclerView-style) precisely because the old architecture couldn\'t give JS synchronous measurement — the native side had to own recycling. v2 replaces that with a JS-level recycle pool plus Fabric\'s synchronous measurement/correction, so the recycling benefit is retained without needing native code, because sync measurement removes the original reason v1 had to hop into native at all.' },
        { q: 'What do you actually need to pass to FlashList v2 that you didn\'t with v1, or vice versa?', a: 'Less, not more — data/renderItem/keyExtractor are typically sufficient; there is no size-estimate prop to tune at all. The main new knob worth knowing is maxItemsInRecyclePool, relevant mainly for extreme, highly heterogeneous item-size scenarios.' }
      ],
      redFlags: `Saying estimatedItemSize is "required" or even "recommended" for FlashList v2 — it's removed, and recommending it signals v1-era knowledge applied to v2. Also: claiming FlashList v2 still runs on the old architecture (it doesn't — New Architecture only), or conflating v1's native recycler with v2's JS-only design as if nothing about the implementation changed.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-list-key-stability', track: 'rn', category: 'rn-lists',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'Why does keyExtractor / key stability matter beyond "React wants a key" — what actually breaks when keys aren\'t stable across renders?',
    answer: {
      core: `A key is how React's reconciler decides "this element in the new tree is the same logical thing as that component instance in the old tree" versus "this is a brand-new thing, mount fresh." When keys are unstable — missing, duplicated, or derived from array index on a list whose order or membership changes — React can't track identity correctly, so local component state, in-flight animations, and (in a recycling list) view slot handoff can all attach to the wrong logical item.`,
      mechanism: `FlatList's default <code>keyExtractor</code> looks for <code>item.key</code> or <code>item.id</code>, falling back to stringified array index with a dev-mode warning if neither exists. The reconciler matches by key within a given render pass: same key next render → same fiber/instance is reused (and any local <code>useState</code> in that row's component survives); different key → old instance unmounts, new instance mounts fresh. That's harmless for a static, append-only list where index and identity always coincide. It stops being harmless the moment the list is reordered, filtered, or has items removed from the middle, because the item that "is" index 2 today may be a completely different logical item than the one that was index 2 a moment ago — yet a stable-looking key ("2") tells React to treat them as the same thing and hand over whatever state the old row instance was carrying.`,
      tradeoffs: `Getting a truly unique, stable key sometimes requires backend cooperation (a real, unique record id) rather than something derivable purely on the client. Where no natural id exists, a content hash can work but costs computation per item; index-as-key is only genuinely safe when the list provably never reorders, filters, inserts, or removes from the middle for the lifetime of that render — which is a narrower guarantee than it usually looks like in a growing codebase.`,
      followups: [
        { q: 'Is using index as a key ever fine?', a: 'Only for a strictly static list — never reordered, filtered, or mutated in the middle, with items only ever appended at the end (or never changing at all). The moment order or membership changes, index-derived keys start misattributing state to the wrong logical item.' },
        { q: 'How does key stability interact with FlashList\'s recycling pool specifically?', a: 'Recycling reuses a host view/component instance across different data items bucketed by item type — a separate mechanism from reconciliation keys. But an unstable key can still cause visible glitches during the recycling handoff: React reconciling the "same" key onto what the recycle pool considers a different physical slot, or vice versa, produces a moment of stale/wrong content before the correction pass catches up.' }
      ],
      redFlags: `Treating keyExtractor as decorative boilerplate rather than the mechanism that preserves per-row state correctly; asserting array index is "always safe" as a key without qualifying it against reordering/filtering/insertion.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-list-getitemlayout', track: 'rn', category: 'rn-lists',
    difficulty: 'core', type: 'deep-dive',
    prompt: 'What does getItemLayout actually do mechanically, and when does providing it stop paying off?',
    answer: {
      core: `<code>getItemLayout</code> gives FlatList/VirtualizedList a synchronous, precomputed answer to "what offset and length does item N have" purely from index arithmetic, without waiting for an actual measured layout pass. That unlocks instant <code>scrollToIndex</code>/<code>scrollToOffset</code>, a more accurate initial render window, and skips the async onLayout-driven remeasurement churn other items rely on.`,
      mechanism: `It's a function of shape <code>(data, index) => ({ length, offset, index })</code>, where <code>offset</code> is the cumulative distance from the start of the list to that item and <code>length</code> is that item's size along the scroll axis. Because it's pure index math, it only produces correct answers when every item's size is known in advance — typically a fixed row height:
<pre><code class="language-jsx">const ITEM_HEIGHT = 72;
&lt;FlatList
  data={items}
  keyExtractor={(item) =&gt; item.id}
  renderItem={renderItem}
  getItemLayout={(data, index) =&gt; ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/&gt;</code></pre>
For variable-size rows, the formula must still be knowable ahead of render (e.g. the server returns each item's height, or items fall into a small number of known-size categories) — it cannot be derived by actually measuring rendered content, since the whole point is to skip that measurement step.`,
      tradeoffs: `<code>getItemLayout</code> only pays off cleanly for fixed-size (or size-known-in-advance) items. Applying a formula to genuinely dynamic/variable-height content produces confidently wrong offsets — the API has no way to tell you it guessed wrong — which surfaces as scroll-to jumps, overlapping rows, or gaps that only show up once real content diverges from the assumed size. This is exactly the class of problem FlashList v2 solves structurally, by measuring/predicting/correcting automatically rather than asking the developer to hand-derive an offset formula.`,
      followups: [
        { q: 'What breaks if the getItemLayout formula is wrong for some items (e.g. secretly-mixed heights)?', a: 'scrollToIndex/scrollToOffset land in the wrong place, and the render window\'s guessed offsets diverge from the actually-rendered layout, producing visible jumps, overlaps, or gaps once the divergence between assumed and real size is large enough to matter.' },
        { q: 'Does FlashList v2 still benefit from something like getItemLayout?', a: 'No — v2\'s design goal is removing that manual sizing contract entirely; it measures, predicts, and corrects automatically instead of requiring a developer-supplied offset formula, which is the opposite tradeoff of getItemLayout.' }
      ],
      redFlags: `Recommending getItemLayout for a list with genuinely variable, unpredictable-in-advance heights without a real per-item-type size formula; confusing it with FlashList's (now-removed) estimatedItemSize — different libraries, different mechanisms, different failure modes when wrong.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-list-rerender-pitfalls', track: 'rn', category: 'rn-lists',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'A FlatList feels janky under real data, and profiling shows every row re-rendering on every scroll/state tick even though most rows\' underlying data hasn\'t changed. What are the classic causes, and how do you actually fix them?',
    answer: {
      core: `Two classic, compounding causes: (1) an <strong>inline <code>renderItem</code></strong> — an anonymous function defined directly in the parent's render body — which gets a brand-new function identity on every parent render; and (2) a <strong>non-memoized row component</strong>, so even with a stable renderItem, every row re-renders whenever the parent re-renders, whether or not that specific row's own data changed. Reaching for <code>extraData</code> as a blunt "just re-render everything" hammer instead of fixing the reference instability compounds the problem rather than solving it.`,
      mechanism: `FlatList and the VirtualizedList it's built on are both <code>PureComponent</code>s — they skip re-rendering when their own props are shallow-equal to last time. <code>renderItem</code> is one of those props. If it's declared inline in the parent's JSX, it's a new function reference every parent render, which fails FlatList/VirtualizedList's own shallow-prop check and forces re-rendering to propagate back down into cell rendering — independent of whether the individual row component underneath is wrapped in <code>React.memo</code>, because a changed renderItem means the parent is handing down newly-created elements for those cells in the first place, not just new props on an existing element instance.
<pre><code class="language-jsx">// Bad: new function identity every parent render, plus an inline onPress closure
&lt;FlatList
  data={items}
  renderItem={({ item }) =&gt; (
    &lt;Row item={item} onPress={() =&gt; select(item.id)} /&gt;
  )}
/&gt;

// Better: stable renderItem reference + memoized row + stable callback identity
const renderItem = useCallback(({ item }) =&gt; &lt;Row item={item} onPress={onSelect} /&gt;, [onSelect]);
const Row = React.memo(function Row({ item, onPress }) {
  return &lt;Pressable onPress={() =&gt; onPress(item.id)}&gt;&lt;Text&gt;{item.title}&lt;/Text&gt;&lt;/Pressable&gt;;
});</code></pre>
<code>extraData</code> exists for a real, narrower purpose: telling FlatList "re-render rows anyway, because something a row depends on lives outside <code>item</code> itself" (e.g. a "currently selected id" held in parent state) — FlatList has no way to know rows depend on that unless you say so via extraData.`,
      tradeoffs: `Over-memoizing everything has its own cost (shallow-comparison overhead on every prop, on every row, every render), so the fix isn't "wrap literally everything in memo/useCallback" — it's specifically: hoist renderItem out of the render body (or wrap in <code>useCallback</code> with correct deps), wrap the row component in <code>React.memo</code>, and keep any callbacks passed into rows referentially stable too, since an inline onPress inside a "fixed" renderItem quietly reintroduces the same problem one level down.`,
      followups: [
        { q: 'Why does declaring renderItem inline break things even if the row component itself is memo\'d underneath?', a: 'Because renderItem is itself a prop on FlatList/VirtualizedList (both PureComponents), a new function reference every parent render fails their own shallow-prop check and forces re-rendering to propagate into cell rendering — the memo on the row component never even gets a chance to short-circuit anything, since new elements are being created and handed down regardless.' },
        { q: 'When is extraData actually the right tool, versus a memoization fix?', a: 'When a row\'s rendered output genuinely depends on state that lives outside that row\'s own item — e.g. "is this row the selected one" tracked in parent state. FlatList has no way to infer that dependency on its own, so extraData tells it to re-render for that change. It\'s not a substitute for fixing an unstable renderItem/callback reference, which is a different (self-inflicted) problem.' }
      ],
      redFlags: `Wrapping the row component in memo() while renderItem stays inline in the parent's render body and calling that "fixed" (it isn't, for the reason above); reaching for extraData as a first-line fix for churn caused by unstable function references rather than fixing the references themselves.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-list-sectionlist', track: 'rn', category: 'rn-lists',
    difficulty: 'core', type: 'deep-dive',
    prompt: 'How is SectionList different from FlatList mechanically, and what do you actually gain or lose by flattening grouped data into a single FlatList with header-tagged rows instead?',
    answer: {
      core: `SectionList sits on the exact same <code>VirtualizedList</code> windowing/virtualization core as FlatList — it isn't a separate, less-optimized rendering path — but adds section-aware structure on top: a <code>[{ title, data: [...] }]</code> data shape, a dedicated <code>renderSectionHeader</code>, and built-in <code>stickySectionHeadersEnabled</code> sticky-header behavior, rather than requiring you to reimplement "is this row a header or a regular item" tagging and sticky-position math yourself.`,
      mechanism: `Internally, SectionList flattens its sectioned data into a single virtualized cell sequence (injecting header cells at section boundaries) so the same windowing machinery — <code>windowSize</code>, <code>maxToRenderPerBatch</code>, etc. — applies uniformly across headers and items. Sticky headers work by tracking which section is currently "active" as the scroll offset crosses section boundaries, and pinning that section's header in place until the next boundary is crossed — logic you'd otherwise have to hand-roll (offset math, boundary detection, header-swap timing) if you flattened grouped data into a plain FlatList with a type discriminant per row.`,
      tradeoffs: `Rolling your own flattened-FlatList-plus-type-tag approach can be marginally more flexible for genuinely custom section behavior (non-standard sticky animation, sections that restructure constantly), but for standard grouped-list UI — contacts by letter, messages by date, a categorized menu — it reimplements bookkeeping SectionList already gives you correctly, for comparable performance since both ultimately run on the same virtualization core.`,
      followups: [
        { q: 'Does SectionList support getItemLayout for fixed-size rows across sections?', a: 'Yes, but the formula has to account for header heights interleaved with row heights, which is meaningfully more bookkeeping than a flat fixed-row FlatList — many teams skip it for SectionList specifically because of that added complexity, unless section counts/sizes are also fixed and known.' },
        { q: 'Can you use FlashList for grouped/sectioned data?', a: 'FlashList doesn\'t ship its own SectionList equivalent — its core list model is flat. The common pattern is flattening sections into one data array with a type discriminant per row (header vs. item) and branching in renderItem/overrideItemLayout, effectively reimplementing what SectionList gives you for free on FlatList.' }
      ],
      redFlags: `Claiming SectionList "doesn't virtualize" or is inherently less performant than FlatList (it shares the same VirtualizedList core); claiming sticky headers require manual scroll-position math when stickySectionHeadersEnabled already implements that.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-list-pagination-pull-to-refresh', track: 'rn', category: 'rn-lists',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'Design pagination/infinite scroll and pull-to-refresh for a huge remote-backed list. What are the real failure modes to defend against, beyond wiring up onEndReached and a RefreshControl?',
    answer: {
      core: `<code>onEndReached</code> (gated by <code>onEndReachedThreshold</code>) triggers loading the next page as the user nears the bottom; pull-to-refresh is <code>refreshControl</code>/<code>onRefresh</code> plus a <code>refreshing</code> boolean. The real engineering is in the edges: <code>onEndReached</code> can fire more than once for what feels like "one" arrival at the bottom before your fetch resolves and updates data; a refresh can race with an in-flight pagination fetch; and prepending or appending pages has to keep the user's scroll position stable rather than yanking it.`,
      mechanism: `<code>onEndReachedThreshold</code> is a fraction of the visible viewport length from the bottom — crossing that boundary fires <code>onEndReached</code>, but continued scrolling through that same zone (or a layout change that shifts what counts as "the bottom") can fire it again before your first fetch's result has landed and re-rendered the list, so a re-entrancy guard (a ref-based "isFetchingNextPage" flag checked at the top of the handler) is load-bearing, not optional polish. New page results should be appended as a <em>new array reference</em> (never mutated in place) so FlatList's shallow prop check actually detects the change. For huge/high-churn lists, prefer cursor-based pagination (an opaque "next" token from the API) over raw offset/page-number pagination, since offset-based paging silently duplicates or skips items when the underlying dataset is mutated between page fetches (someone else inserts/deletes a row server-side while you're still paging). <code>maintainVisibleContentPosition</code> (available on FlatList/VirtualizedList, and on by default in FlashList v2) anchors visible content by adjusting scroll offset when items are inserted above the current viewport — the standard fix for "loading older messages above what I'm looking at shouldn't move what I'm looking at."`,
      tradeoffs: `A larger <code>onEndReachedThreshold</code> triggers prefetching earlier (smoother perceived UX) but multiplies the number of times the handler fires while the user lingers in that zone, so it raises the stakes on having a real re-entrancy guard rather than lowering them. Offset-based pagination is simpler to implement and reason about but fragile under concurrent writes; cursor-based pagination is more robust to concurrent mutation but requires backend support and can't easily support "jump to page N."`,
      followups: [
        { q: 'Why can onEndReached fire more than once for what feels like a single "reaching the bottom" event?', a: 'It\'s driven by scroll offset crossing a threshold distance, and the user can keep scrolling (or layout can shift, e.g. as items above resize) while still within that threshold zone — so without a guard flag, the fetch-next-page callback can dispatch multiple times before the first request resolves and the appended data changes the threshold calculation.' },
        { q: 'How do you keep scroll position stable when pull-to-refresh (or an older-messages fetch) prepends items above what the user is currently viewing?', a: 'maintainVisibleContentPosition — built into FlatList/VirtualizedList and enabled by default in FlashList v2 — tracks the currently-visible anchor item and adjusts the scroll offset as content is inserted above it, so the user\'s viewport doesn\'t visually jump when new items land above what they were already looking at.' }
      ],
      redFlags: `Shipping pagination with no re-entrancy guard and blaming resulting duplicate fetches/rows on "a flaky backend"; using raw offset/page-number math as a pseudo-cursor instead of an actual server-provided cursor, especially for a dataset that can mutate between page fetches.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-list-spot-bug-duplicate-keys', track: 'rn', category: 'rn-lists',
    difficulty: 'senior', type: 'spot-the-bug',
    prompt: 'This chat list is supposed to let each message expand independently, but expanding one message sometimes visually expands a different, unrelated message instead — and it gets worse the more you scroll. Find the bug.',
    code: "function ChatList({ messages }) {\n  // `messages` comes from a paginated fetch. The backend pages by timestamp,\n  // and overlapping pages can occasionally return the SAME message twice\n  // (same `id`) when a new message arrives right at a page boundary.\n  return (\n    <FlatList\n      data={messages}\n      keyExtractor={(item) => item.id}\n      renderItem={({ item }) => <MessageRow message={item} />}\n    />\n  );\n}\n\nfunction MessageRow({ message }) {\n  const [expanded, setExpanded] = useState(false);\n  return (\n    <Pressable onPress={() => setExpanded((e) => !e)}>\n      <Text>{expanded ? message.fullText : message.preview}</Text>\n    </Pressable>\n  );\n}\n\n// Tapping the message at id 'm1' (say, the 2nd occurrence, position 8) sometimes\n// expands the FIRST message with id 'm1' (position 2) instead, or vice versa —\n// and which one visually reacts changes depending on what's currently mounted.",
    answer: "// Dedupe by id BEFORE handing data to FlatList — keyExtractor can only be as\n// unique as the data actually is.\nfunction ChatList({ messages }) {\n  const dedupedMessages = useMemo(() => {\n    const seen = new Set();\n    return messages.filter((m) => {\n      if (seen.has(m.id)) return false;\n      seen.add(m.id);\n      return true;\n    });\n  }, [messages]);\n\n  return (\n    <FlatList\n      data={dedupedMessages}\n      keyExtractor={(item) => item.id}\n      renderItem={({ item }) => <MessageRow message={item} />}\n    />\n  );\n}",
    explanation: "React's reconciler uses the key to match one-to-one: \"this element in the new render\" to \"that component instance from the previous render.\" When two entries in the SAME data array share a key (here, a duplicated message id from an overlapping pagination fetch), React can only resolve that key to a single fiber — the local <code>expanded</code> state ends up attached to whichever occurrence React's reconciliation happens to bind that key to, and which occurrence that is can shift between renders and especially between virtualization passes, since FlatList mounts/unmounts different subsets of rows as the window moves. The visible symptom is exactly what's described: tapping one message toggles a DIFFERENT message's expanded state, and it gets worse under scroll because a different subset of duplicate-key rows gets mounted/matched on each windowing pass. The fix is to guarantee key uniqueness at the data layer (dedupe before rendering) rather than trying to paper over it in keyExtractor — keyExtractor can only be as unique as the underlying data actually is."
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-list-spot-bug-index-key-reorder', track: 'rn', category: 'rn-lists',
    difficulty: 'senior', type: 'spot-the-bug',
    prompt: 'Users can drag-and-drop reorder this task list. After reordering, the checked/unchecked state shows up on the wrong tasks — it seems to stay attached to a screen position rather than following the task. Find the bug.',
    code: "function TaskList({ tasks }) {\n  // `tasks`: array of { id, title }. Order changes freely via drag-and-drop,\n  // which calls a reorder handler (not shown) that reassigns array order.\n  return (\n    <FlatList\n      data={tasks}\n      keyExtractor={(item, index) => index.toString()} // BUG\n      renderItem={({ item }) => <TaskRow task={item} />}\n    />\n  );\n}\n\nfunction TaskRow({ task }) {\n  const [checked, setChecked] = useState(false);\n  return (\n    <Pressable onPress={() => setChecked((c) => !c)}>\n      <Text style={{ textDecorationLine: checked ? 'line-through' : 'none' }}>\n        {task.title}\n      </Text>\n    </Pressable>\n  );\n}\n\n// Check off task 'Buy milk' at position 2, then drag a different task into\n// position 2 — the line-through now shows on the NEW task at position 2,\n// not on 'Buy milk', which moved elsewhere and lost its checked mark.",
    answer: "function TaskList({ tasks }) {\n  return (\n    <FlatList\n      data={tasks}\n      keyExtractor={(item) => item.id} // keyed by the task's own stable id\n      renderItem={({ item }) => <TaskRow task={item} />}\n    />\n  );\n}",
    explanation: "Using the array index as the key ties each rendered row's identity — and therefore its <code>TaskRow</code> instance's local <code>checked</code> state — to a POSITION in the list, not to the task that currently occupies that position. After a reorder, whatever task now lands at index 2 is still handed the key <code>\"2\"</code>, so React reuses the same fiber (and the same already-mounted component instance, carrying whatever <code>checked</code> value it already had) for that slot instead of recognizing that a different task moved there and needs its OWN state. The checked mark visually \"stays behind\" at the old screen position rather than following the task it actually belonged to. Keying by the task's own stable <code>id</code> instead lets React correctly treat \"same id, new position\" as the same logical task (state follows it wherever it moves) and \"different id in this slot\" as a genuinely new instance (fresh state, no bleed-over)."
  });

})();
