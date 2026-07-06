/* Practice challenges — RN Deep Dives: Styling & Layout */
(function () {
  var reg = window.PREP_SITE.registerChallenge;

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-style-flexbox-defaults', track: 'rn', category: 'rn-styling',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'A web developer newly on your RN team sets justifyContent: \'center\' on a container View, expecting its children to lay out left-to-right like a flexed div on the web — but they stack vertically instead. Explain exactly which Yoga/RN flexbox defaults diverge from the CSS spec, and why RN made those particular choices.',
    answer: {
      core: `Every <code>View</code> in RN is already a flex container — <code>display</code> defaults to <code>'flex'</code>, not <code>'block'</code> like a web <code>&lt;div&gt;</code>, so <code>justifyContent</code>/<code>alignItems</code> are live from the first render with no opt-in needed. The actual surprise is <code>flexDirection</code>, which defaults to <code>'column'</code> in RN versus <code>'row'</code> on the web — the single most-cited RN-vs-web flexbox gotcha. Two more Yoga defaults quietly diverge from the CSS spec alongside it: <code>flexShrink</code> defaults to <code>0</code> in RN (<code>1</code> on the web), and <code>alignContent</code> defaults to <code>'flex-start'</code> (<code>'stretch'</code> on the web). None of this is an oversight — RN's docs frame column-by-default as matching the natural top-to-bottom flow of a mobile screen (stacked cards, forms, lists), so the common case needs zero extra props, whereas defaulting to row would mean adding <code>flexDirection: 'row'</code> to almost every container that isn't literally a top nav bar.`,
      mechanism: `Yoga — RN's C++ flexbox engine — hardcodes these defaults in its own layout config rather than inheriting the CSS spec's defaults wholesale; under the New Architecture, Yoga runs on Fabric's own background Shadow thread — a distinct thread from the UI thread, not the UI thread itself — computing the shadow tree there and then handing the result to the UI thread via a JSI-synchronized commit (versus the old bridge, where layout was computed off-thread and shipped asynchronously over the bridge as a separate serialized message, a real source of visible layout-then-jump frames that Fabric's synchronous, JSI-backed commit was explicitly built to remove). Practically, this changes how you read a screen's structure: a <code>flexDirection: 'row'</code> container nested inside the (default) outer column is the normal way to build "a row of things inside a stack of rows," not an exception. <code>flex: 1</code> itself behaves the way you'd expect from CSS's shorthand (grow + shrink + zero basis along the main axis) — it's specifically the <em>defaults</em> that differ, not the meaning of <code>flex</code> once you set it.`,
      tradeoffs: `The flexShrink default has a real, easy-to-miss consequence: on the web, an overflowing row of flex children will shrink to fit by default; in RN, they won't — a row of fixed-width chips that would gracefully compress on the web will overflow past the container edge in RN unless you explicitly set <code>flexShrink: 1</code> or wrap with <code>flexWrap: 'wrap'</code>. That's the kind of bug that only shows up on narrower devices, which is exactly why it survives code review on a wide simulator.`,
      followups: [
        { q: 'Does flex: 1 on a child mean something different inside a row container versus a column container?', a: 'Mechanically it always fills the remaining space along the main axis — but the main axis flips with flexDirection, so in a row it grows width and in a column it grows height. A common gotcha is a flex: 1 child inside a ScrollView content container, whose main axis is column by default; without an explicit height constraint on an ancestor, "fill remaining space" has nothing concrete to fill.' },
        { q: 'Since Views default to a flex container, do you ever need display: \'flex\' explicitly?', a: 'Mostly only to toggle back from display: \'none\', which RN also supports to remove a view from layout entirely. Setting display: \'flex\' explicitly elsewhere is a no-op, not something required to opt in.' }
      ],
      redFlags: `Claiming RN's flexbox defaults are identical to web CSS flexbox — three real Yoga defaults diverge (flexDirection, flexShrink, alignContent); saying a View needs <code>display: 'flex'</code> to become a flex container when it already is one by default.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-style-no-css-grid', track: 'rn', category: 'rn-styling',
    difficulty: 'core', type: 'deep-dive',
    prompt: 'RN doesn\'t ship a CSS Grid engine. If a designer hands you a photo grid or a dashboard tile layout, what are your actual options, and why has Yoga never grown a display: \'grid\' mode?',
    answer: {
      core: `RN's layout engine, Yoga, implements Flexbox only — there is no <code>display: 'grid'</code>, no track sizing, no grid-template-areas, nothing. For pure content grids (equal-size tiles, a photo gallery) the standard move is <code>flexWrap: 'wrap'</code> on a row container with each child given an explicit percentage or fixed width (e.g. <code>width: '33.33%'</code> for three columns), which reflows automatically once a row's wrap boundary is hit. For scrollable data grids specifically, <code>numColumns</code> on <code>FlatList</code> (or FlashList) is the idiomatic answer, because it comes with virtualization built in — something a naive flexWrap list of hundreds of items does not have. For genuinely two-dimensional layout — simultaneous row and column alignment, spanning cells, named template areas — none of the flexbox-based approaches are a real substitute, and teams reach for a purpose-built grid library or hand-rolled measurement math instead.`,
      mechanism: `The deeper reason Yoga never grew a grid mode: CSS Grid requires resolving a genuinely two-dimensional constraint system (track sizing, <code>fr</code> units, item placement across both axes at once), which is an algorithmically different problem from flexbox's single-axis distribution — and it took web browser engines years to get that right even with a full spec to implement against. Yoga's relative simplicity is a real part of why it can compute layout synchronously fast enough to sit inside Fabric's shadow-tree commit on every frame; bolting on a full grid solver would meaningfully change that performance profile, for a feature most RN screens don't structurally need.`,
      tradeoffs: `flexWrap plus percentage widths breaks down the moment items have variable heights and a design wants strict row-aligned baselines (true grid) versus a masonry-style stagger — flexbox alone can't distinguish those cases. Spacing between wrapped items used to require manual negative-margin tricks; RN's <code>gap</code>, <code>rowGap</code>, and <code>columnGap</code> style props (supported on flex containers, wrapped or not) now solve that specific pain, but they still don't give you spanning cells or named areas.`,
      followups: [
        { q: 'Does React Native support the CSS gap property?', a: 'Yes — gap, rowGap, and columnGap are supported style props on flex containers, including wrapped ones, which removed most of the historical need for manual margin-based spacing hacks between grid-like tiles.' },
        { q: 'Would you reach for FlashList over FlatList for a photo grid?', a: 'For a large grid, yes — FlashList\'s recycling model handles numColumns layouts with materially better memory and frame behavior than FlatList\'s own virtualization. That said, plain numColumns (on either list) still assumes uniform item height; once item heights genuinely vary, you need FlashList v2\'s separate opt-in masonry prop, which lays items out column-by-column instead of strict row-by-row.' }
      ],
      redFlags: `Suggesting RN has a display: 'grid' you just haven't tried yet (it doesn't exist — Yoga is flexbox-only); recommending flexWrap for a data grid with hundreds of items with no mention of virtualization, which will visibly hurt scroll performance.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-style-stylesheet-vs-inline', track: 'rn', category: 'rn-styling',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'Does StyleSheet.create actually still buy you anything performance-wise on the New Architecture, or is "always use StyleSheet.create" a Paper-era rule carried forward out of habit?',
    answer: {
      core: `<code>StyleSheet.create</code> was originally sold on a bridge-era rationale: instead of serializing the same style object to JSON and shipping it across the async bridge on every render, RN registered each style once and handed back a small numeric ID, so only that ID needed to cross the bridge — native already had the full object cached. On the New Architecture that specific rationale is largely moot: JSI gives JS and C++ direct, synchronous access, so there's no serialize-and-post-across-a-bridge step to avoid in the first place. That does <strong>not</strong> mean <code>StyleSheet.create</code> stopped mattering — it matters for different reasons now.`,
      mechanism: `Three things it still gives you under Fabric: (1) reference stability — the object literal is created once at module scope, so every render returns the exact same object reference, unlike <code>style={{ padding: 8 }}</code> inline, which allocates a brand-new object every render; that matters for <code>React.memo</code>/<code>PureComponent</code> children whose shallow prop-equality check would otherwise see a "changed" style prop on every parent render even though nothing visually changed; (2) upfront dev-mode validation of style keys and values, which inline objects skip; (3) fewer per-render object allocations and less GC churn in hot code paths like list row renderers, independent of Fabric entirely. Fabric's synchronous shadow-tree diffing changed the <em>transport</em> cost of getting a style value from JS to native — it did not change JS-side object identity or allocation behavior, since those are React/JS-engine concerns, not shadow-tree concerns.
<pre><code class="language-js">// New object every render — breaks reference equality for memoized children
&lt;Row style={{ padding: 8 }} /&gt;

// Same object reference every render
const styles = StyleSheet.create({ row: { padding: 8 } });
&lt;Row style={styles.row} /&gt;</code></pre>`,
      tradeoffs: `The difference between StyleSheet.create and an inline object is invisible for a handful of top-level screens, and very real inside a list row renderer called hundreds of times per scroll — which is exactly why "always use StyleSheet.create" survives as a blanket rule even though its original justification (the bridge) is gone: the remaining justification (reference stability plus reduced allocation) is smaller in magnitude than the old bridge-serialization story, but non-zero, and non-zero at list scale still matters.`,
      followups: [
        { q: 'If a style depends on a runtime value, like a theme color from props, can you still use StyleSheet.create for it?', a: 'Only for the static parts — StyleSheet.create runs once at module scope and can\'t read per-render props or state, so the dynamic piece still needs an inline object or array, e.g. style={[styles.base, { color: theme.primary }]}, keeping everything static in the sheet and merging in only what genuinely varies.' },
        { q: 'Does StyleSheet.create merge or flatten style arrays at call time?', a: 'No — StyleSheet.create just registers each key\'s object individually. Flattening an array like style={[styles.a, styles.b]} into one resolved object happens later, via StyleSheet.flatten, which RN\'s rendering path calls internally whenever a view\'s style prop is an array.' }
      ],
      redFlags: `Saying StyleSheet.create "sends styles over the bridge once" as if the bridge still exists on the New Architecture (JSI removed that transport model entirely); claiming inline styles are "just as fast now" with no caveat about reference-equality-driven re-renders in memoized or list contexts.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-style-responsive-safearea', track: 'rn', category: 'rn-styling',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'Why do React Navigation\'s own docs steer people toward useSafeAreaInsets from react-native-safe-area-context over both RN\'s built-in SafeAreaView and hardcoded Dimensions.get(\'window\') calls for responsive layout?',
    answer: {
      core: `Two separate problems, two separate reasons. For screen-size responsiveness: <code>Dimensions.get('window')</code> is a one-time synchronous snapshot — it does not re-render your component when the window changes (rotation, split-screen/multi-window on a tablet, a foldable's fold state changing), so anything responsive built on it needs manual <code>Dimensions.addEventListener('change', ...)</code> plus <code>setState</code> wiring that <code>useWindowDimensions()</code> gives you for free as a hook that re-renders automatically on every dimension change. For safe-area insets: RN's own built-in <code>SafeAreaView</code> only ever implemented the concept on iOS — it's a no-op on Android — and current RN docs mark it for removal in favor of the community package, which computes real inset values (notch, status bar, home indicator, gesture-nav height) on both platforms and exposes them either declaratively or as raw numbers via <code>useSafeAreaInsets()</code> for custom layout math.`,
      mechanism: `<code>useWindowDimensions</code> subscribes to the same native dimension-change event <code>Dimensions.addEventListener</code> does, but wraps subscribe/unsubscribe and the re-render trigger inside a hook so you don't hand-roll it per component — every component calling the hook re-renders independently on a dimension change, fine for a handful of responsive containers but a real cost if used inside hundreds of list rows. <code>react-native-safe-area-context</code> computes real device insets natively (reading actual display-cutout/inset APIs on Android and safe-area layout guides on iOS) and publishes them through a <code>SafeAreaProvider</code> context at the app root, so <code>useSafeAreaInsets()</code> is just a context read — cheap, and it updates automatically on rotation because the provider's native side re-measures and re-publishes insets.
<pre><code class="language-js">const { width, height } = useWindowDimensions(); // re-renders on rotation/fold
const insets = useSafeAreaInsets(); // { top, bottom, left, right }
const numColumns = width &gt; 700 ? 3 : 2;</code></pre>`,
      tradeoffs: `Insets and window dimensions solve different problems and get conflated: safe-area insets tell you how much padding to reserve for hardware/OS chrome; window dimensions tell you the available layout size. A tablet in split-screen keeps the same safe-area insets as full-screen but has a much smaller window width — code that reaches for one where it needs the other produces a layout that looks fine on a phone and breaks on a foldable or tablet, exactly the kind of gap 2026-era interviews probe given how common split-screen and foldable support has become.`,
      followups: [
        { q: 'Would you call useWindowDimensions inside every row of a large FlatList?', a: 'No — that subscribes every rendered row independently to dimension-change events, multiplying re-renders on rotation. Better to read the dimension once at a parent/screen level and pass the derived layout value (e.g. a column count) down as a prop.' },
        { q: 'Is SafeAreaView from react-native-safe-area-context implemented identically on both platforms under the hood?', a: 'Conceptually yes — a native module reports real insets and the component applies them as padding — but the underlying inset source differs (iOS safe-area layout guides vs. Android WindowInsets/display-cutout APIs), which is exactly the platform-specific work the library abstracts away from you.' }
      ],
      redFlags: `Recommending RN's built-in SafeAreaView for a cross-platform app without caveating that it's iOS-only; treating Dimensions.get('window') as reactive when it's a one-time snapshot that goes stale the moment the device rotates.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-style-libraries-2026', track: 'rn', category: 'rn-styling',
    difficulty: 'staff', type: 'deep-dive',
    prompt: 'Your team is choosing a styling approach for a new cross-platform app (mobile plus RN Web) in 2026: NativeWind, Tamagui, or Unistyles. What mechanism does each actually rely on, and what\'s the real tradeoff — not just which has more GitHub stars?',
    answer: {
      core: `All three react to the same pain (static StyleSheet objects don't compose or theme well) with genuinely different mechanisms. <strong>NativeWind</strong> compiles Tailwind's className utility strings, ahead of time via a <code>jsxImportSource</code> transform wired in through Metro's <code>withNativeWind</code> helper (production NativeWind v4 moved off the older Babel-plugin transform), down into ordinary RN <code>StyleSheet</code> objects — at runtime it's just RN styling, so its value is almost entirely developer experience (Tailwind syntax and tokens) with effectively no new runtime cost. <strong>Tamagui</strong> is a universal (RN plus web) design-system compiler: it does static analysis, tree-flattening, and dead-code elimination on your styled components at build time, aiming to ship output close to hand-written platform code on each target — the tradeoff is being the most architecturally involved of the three to adopt. <strong>Unistyles 3</strong> took the newest approach: its engine moved into C++, tied directly to Fabric's shadow tree via JSI, so a dependency change (theme switch, breakpoint, orientation) updates only the affected native views directly with no React re-render, no context, no hook re-run — meaningfully different from the other two, which both still push style updates through a normal React render pass.`,
      mechanism: `NativeWind's <code>jsxImportSource</code> transform — configured via Metro's <code>withNativeWind</code> wrapper rather than a standalone Babel plugin — turns a className string into a resolved style object at build/transform time, so nothing parses a class string at runtime — the cost is identical to writing that StyleSheet object by hand. Tamagui's compiler does a deeper static-analysis pass across the whole styled-component tree, which is why it can flatten several nested styled wrappers into one output node where NativeWind, working at the single-className level, can't. Unistyles skips React's render cycle for style updates entirely by having its C++ core own the mapping from "a dependency changed" to "apply this new prop set to this specific native view" via JSI HostObjects, which is only possible because it's Fabric/New-Architecture-only — there is no legacy-bridge code path for it, the same all-or-nothing decision Reanimated 4 made.
<pre><code class="language-js">// NativeWind — compiles to a StyleSheet object at build time
&lt;View className="flex-1 items-center bg-white dark:bg-black" /&gt;

// Unistyles v3 — style access is the reactive primitive; no re-render on breakpoint/theme change
const { styles } = useStyles(stylesheet);</code></pre>`,
      tradeoffs: `NativeWind is the lowest-risk adoption — it's "just RN styling" underneath, with the largest weekly-download community of the three — but it doesn't move you any closer to true web-and-native design-system parity beyond shared utility classes. Tamagui gives the strongest cross-platform unification story and the highest optimization ceiling, at the cost of the heaviest architectural commitment: a real compiler in your build pipeline, a component API to learn, and materially smaller adoption than NativeWind's. Unistyles gives the strongest raw update-performance story (skip React entirely for style changes), but it's New-Architecture-only, so it's a non-starter for any app not yet migrated, and its no-re-render model means the component tree itself doesn't know a style changed — exactly right for a pure visual update, the wrong tool if that same change needs to also drive conditional rendering logic.`,
      followups: [
        { q: 'If a team is still on the legacy architecture, which of these three is available to them?', a: 'Only NativeWind (and older Tamagui usage patterns) — Unistyles 3 is Fabric/New-Arch-only by design, so a legacy-arch app has to either stay on an older Unistyles major or finish the New Architecture migration first before adopting v3.' },
        { q: 'Does adopting Tamagui or Unistyles lock a team out of plain StyleSheet.create elsewhere in the app?', a: 'No — both are designed to interoperate incrementally alongside plain RN styling, so a team doesn\'t have to convert every screen at once, which is the realistic adoption path for a codebase that didn\'t start with the library from day one.' }
      ],
      redFlags: `Picking a styling library by star count alone without naming the actual mechanism difference; claiming Unistyles works on the old architecture (it doesn't); describing NativeWind as adding runtime overhead for parsing class names when it's compiled ahead of time, not parsed at runtime.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-style-theming-tokens', track: 'rn', category: 'rn-styling',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'Design handed you light and dark themes plus a token sheet (spacing, radii, semantic colors). Walk through how you\'d wire system-driven light/dark switching in RN, and where token-based theming tends to go wrong at scale.',
    answer: {
      core: `The system-level piece is <code>Appearance</code> / <code>useColorScheme()</code>: RN subscribes to the OS-reported light/dark preference and re-renders any component calling <code>useColorScheme()</code> whenever the user, or the OS on a schedule, flips it. That hook only answers "is it light or dark right now" — the actual theming layer on top is entirely your own responsibility: a context provider that maps the current scheme to a token object (colors, spacing scale, radii, typography scale) and exposes it via a <code>useTheme()</code> hook, so components consume semantic names like <code>theme.colors.surface</code> rather than hardcoded hex values.`,
      mechanism: `Two structurally different ways to apply the resolved theme to actual style output: (1) build the style object at component render time from the theme value and splice it into an inline or array style — simplest, but reintroduces per-render object allocation for every themed component, exactly what <code>StyleSheet.create</code> is meant to avoid; or (2) let a styling library's built-in theming resolve the swap at the styling layer itself (Tamagui's and Unistyles' theme systems, or NativeWind's dark: variant classes), often without a full component re-render for pure style properties. This is where Unistyles' C++-level "update the native view directly" model has a real edge over hand-rolled Context theming: flipping a theme via plain React Context necessarily re-renders every consumer, which for a whole-screen theme swap is a real, if usually acceptable, render-tree pass.
<pre><code class="language-js">const scheme = useColorScheme(); // 'light' | 'dark' | null
const theme = scheme === 'dark' ? darkTokens : lightTokens;
// force a scheme regardless of the OS, for an in-app override
Appearance.setColorScheme('dark');</code></pre>`,
      tradeoffs: `Token systems tend to go wrong at scale in one recurring way: teams start with raw palette tokens (color.blue500) and let components reference them directly instead of through a semantic layer (color.textPrimary resolving to color.blue500 in light mode, something else in dark) — which is fine until the day dark mode ships, and every component hardcoded to a raw palette token needs a manual audit, because there was never a semantic indirection layer to swap underneath. The fix is enforcing components only ever reference semantic tokens, never raw palette values, from day one — before a second theme even exists.`,
      followups: [
        { q: 'Does useColorScheme() reflect an in-app "force dark mode" toggle, or only the OS setting?', a: 'Whichever is currently active — RN\'s Appearance API lets the app call Appearance.setColorScheme() to override the OS preference app-wide, and useColorScheme() reflects that override the same way it reflects OS changes, since both go through the same underlying subscription.' },
        { q: 'If the OS is set to dark but the app never consumes useColorScheme(), what happens?', a: 'Nothing automatic — the hook still faithfully reports \'dark\', but if no component in the tree reads it (e.g. tokens were hardcoded light-only), the app simply stays visually light regardless; respecting the value is an explicit choice you wire up, not something RN forces on you.' }
      ],
      redFlags: `Treating useColorScheme() itself as "the theming system" (it's only the OS-preference signal — the token mapping and application layer is entirely your own code); building a token sheet with only raw palette values and no semantic indirection layer, the single most common reason dark-mode retrofits become a full app audit.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-style-shadow-elevation-platform', track: 'rn', category: 'rn-styling',
    difficulty: 'staff', type: 'deep-dive',
    prompt: 'A designer\'s card shadow looks perfect on iOS and is invisible on Android (or vice versa). Explain why RN\'s classic shadow styling is inherently platform-forked, and what actually changed with the boxShadow style prop.',
    answer: {
      core: `iOS and Android never shared a shadow model, because the two native platforms don't: iOS shadows are drawn via CALayer shadow properties (<code>shadowColor</code>, <code>shadowOffset</code>, <code>shadowOpacity</code>, <code>shadowRadius</code> in RN) — a soft, offset, blurred shadow drawn under the view's rendered shape. Android's <code>elevation</code> is a different concept entirely — a single number the Android view system interprets as z-axis depth, which the OS renders as its own directionally-consistent ambient-plus-key-light shadow, and which also affects draw order relative to sibling views, something the iOS shadow props never touched. That's why the classic advice was always "set both," with no shared numeric scale between them — <code>shadowRadius: 4</code> and <code>elevation: 4</code> don't look remotely equivalent. RN's newer <code>boxShadow</code> style prop (New Architecture only) finally gives one CSS-syntax-compatible prop that renders consistently on both platforms, without touching elevation or the shadow* props at all.`,
      mechanism: `<pre><code class="language-js">// Classic — two separate, non-equivalent property sets
const styles = StyleSheet.create({
  card: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
      android: { elevation: 4 },
    }),
  },
});

// boxShadow — New Architecture only, one cross-platform prop
const cardNew = { boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' };</code></pre>
<code>boxShadow</code> accepts either that CSS-like string or an array of structured shadow objects, and Fabric renders it through its own cross-platform drawing path rather than deferring to each platform's native shadow primitive — which is also why it's gated to the New Architecture: it needs Fabric's rendering pipeline, not the legacy view-manager-per-platform model the shadow/elevation split grew out of. One platform wrinkle survives even with boxShadow: outset shadows require Android 9+ and inset shadows require Android 10+, so a boxShadow targeting very old Android versions can still silently no-op on the inset case.`,
      tradeoffs: `The same platform-fork pattern shows up across RN styling generally, via <code>Platform.select({ ios: ..., android: ... })</code> or the <code>.ios.js</code>/<code>.android.js</code> file-extension split for cases too divergent to express as one object — and pixel density is the other classic cross-platform trap: a hairline border drawn with <code>borderWidth: 1</code> can render as a visibly thick line on a high-density Android device, which is exactly why RN exposes <code>StyleSheet.hairlineWidth</code> (resolved per-device via <code>PixelRatio</code> to the thinnest line the device's display can actually render) instead of a hardcoded <code>1</code>. A senior RN dev should reach for hairlineWidth on dividers and borders by reflex, the same way Platform.select is the reflex for elevation-vs-shadow.`,
      followups: [
        { q: 'Can you use boxShadow if the app is still on the legacy architecture?', a: 'No — it\'s New Architecture only, the same constraint several newer style/animation features share. A legacy-arch app has to keep using the shadowColor/shadowOffset/shadowOpacity/shadowRadius plus elevation split until it migrates.' },
        { q: 'Does elevation on Android do anything besides drawing a shadow?', a: 'Yes — elevation also affects Android\'s z-ordering, so a higher-elevation view visually draws above lower-elevation siblings even without an explicit zIndex, a side effect the iOS shadow props have no equivalent for.' }
      ],
      redFlags: `Setting only shadow* props and assuming it "just works" on Android (Android silently ignores those props entirely); treating elevation and shadowRadius as the same numeric scale; hardcoding borderWidth: 1 for a divider instead of StyleSheet.hairlineWidth and being surprised it renders differently across devices.`
    }
  });

})();
