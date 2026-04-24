window.PREP_SITE.registerTopic({
  id: 'rn-styling',
  module: 'React Native',
  title: 'Styling',
  estimatedReadTime: '22 min',
  tags: ['react-native', 'styling', 'stylesheet', 'flexbox', 'theme', 'nativewind', 'tamagui', 'platform'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>RN styles are plain JavaScript objects, not CSS. No cascade, no selectors, no media queries. Flexbox is the layout primitive — via Facebook's Yoga engine.</p>
<ul>
  <li><strong>StyleSheet.create</strong> — defines style objects once, references stable, values validated.</li>
  <li><strong>Flexbox defaults differ</strong>: <code>flexDirection: 'column'</code> (not row), items stretch by default.</li>
  <li><strong>No inheritance except Text</strong> — font styles on a parent <code>&lt;Text&gt;</code> inherit to child <code>&lt;Text&gt;</code>s. Nothing else inherits.</li>
  <li><strong>No hover</strong> on mobile. <strong>No media queries</strong> — use <code>useWindowDimensions</code> / <code>Dimensions.get('window')</code> for responsive logic.</li>
  <li><strong>Platform differences</strong>: shadows (iOS shadow*, Android elevation), text rendering, safe areas. Use <code>Platform.select</code>.</li>
  <li><strong>Modern styling libs</strong>: <strong>NativeWind</strong> (Tailwind classes), <strong>Tamagui</strong> (compile-time optimized design system), <strong>Dripsy</strong>, <strong>Unistyles</strong>.</li>
  <li><strong>Theming</strong>: context-based theme with tokens (colors, spacing, typography). Supported natively by most design system libs.</li>
  <li><strong>Dynamic sizing</strong>: percentage values (<code>width: '50%'</code>), flex, aspectRatio, <code>useWindowDimensions</code>.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Styles are JS objects + Flexbox. Master the three differences from web (column default, no cascade except Text, no media queries) and you've moved past the friction. For a design system, use tokens and a library (NativeWind, Tamagui) to stop writing inline styles.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Why styles are JavaScript, not CSS</h3>
<p>RN doesn't have a CSS parser or cascade engine. Styles are plain JS objects passed to the <code>style</code> prop. The renderer (Fabric) reads them and applies to native views. Result: no selectors, no stylesheets in the HTML sense, no cascade.</p>
<p>Why? Performance and simplicity. Parsing CSS selectors across thousands of native views would be expensive. JS objects with direct property → attribute mapping are trivial to apply. The tradeoff: you lose the cascade.</p>

<h3>Why StyleSheet.create</h3>
<p>You <em>can</em> pass inline objects, but <code>StyleSheet.create</code> gives you:</p>
<ul>
  <li><strong>Stable references</strong> — same object each render, safer for React.memo.</li>
  <li><strong>Validation</strong> — unknown properties warned in dev.</li>
  <li><strong>Conceptual clarity</strong> — styles grouped as a style sheet, not scattered in JSX.</li>
</ul>
<p>Historically also a small numeric-ID optimization (styles converted to IDs crossing the bridge); less relevant with new arch but still good practice.</p>

<h3>Why Flexbox (via Yoga)</h3>
<p>Yoga is Facebook's C++ Flexbox implementation used by RN, Litho, and others. It's a subset of CSS Flexbox optimized for performance and predictability. Most flexbox knowledge transfers from web, with key differences:</p>
<ul>
  <li><code>flexDirection: 'column'</code> by default, not row.</li>
  <li><code>alignItems: 'stretch'</code> by default.</li>
  <li><code>flex: 1</code> expands a child to fill available space.</li>
  <li>Percentages supported for width, height, margin, padding.</li>
</ul>
<p>No float, no grid (as of today — CSS Grid not supported in RN).</p>

<h3>Why no media queries</h3>
<p>Mobile apps typically target two or three form factors (phone portrait/landscape, tablet). Instead of media queries, RN gives you <code>Dimensions.get('window')</code> (static) or <code>useWindowDimensions()</code> (reactive). Conditional styles based on width/height are written in JS.</p>

<h3>Why third-party styling libs</h3>
<p>Vanilla StyleSheet works but can be verbose. Modern alternatives:</p>
<ul>
  <li><strong>NativeWind</strong>: Tailwind classes in RN. <code>className="flex-1 bg-white p-4"</code>. Compiled to RN styles at build time. Best for teams familiar with Tailwind.</li>
  <li><strong>Tamagui</strong>: design system + style library with compile-time optimization. Atomic CSS for web + RN. Fast, typed, opinionated.</li>
  <li><strong>Unistyles</strong>: JS API closer to StyleSheet but with theme + runtime switching.</li>
  <li><strong>Dripsy</strong>: theme-ui-like responsive style props.</li>
  <li><strong>Restyle (Shopify)</strong>: type-safe style props with theme.</li>
</ul>
<p>Pick one and stick. Consistency beats cleverness.</p>

<h3>Why theming matters on mobile</h3>
<p>Users expect light/dark mode following system preferences. Design systems use semantic tokens (bg.primary, text.muted) so a theme switch updates all colors coherently. Implementation: a ThemeContext at the root with current tokens; components consume via hook.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "flex by default" picture</h3>
<div class="diagram">
<pre>
  &lt;View style={{ flex: 1 }}&gt;           ← fills parent
    &lt;View /&gt;                            ← flexDirection: column
    &lt;View /&gt;                            ← stretches horizontally (alignItems: stretch)
  &lt;/View&gt;

  To get rows:
  &lt;View style={{ flexDirection: 'row' }}&gt;
    &lt;View style={{ flex: 1 }} /&gt;       ← shares space horizontally
    &lt;View style={{ flex: 2 }} /&gt;
  &lt;/View&gt;
</pre>
</div>

<h3>The "style merging" picture</h3>
<pre><code class="language-tsx">&lt;View style={[styles.base, disabled &amp;&amp; styles.disabled, { marginTop: 16 }]} /&gt;</code></pre>
<p>Pass an array; later values win. <code>false</code> / <code>null</code> / <code>undefined</code> ignored. This is your "cascade" substitute.</p>

<h3>The "dimensions" picture</h3>
<pre><code class="language-tsx">import { useWindowDimensions } from 'react-native';
function Responsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width &gt;= 768;
  return &lt;View style={[styles.base, isTablet &amp;&amp; styles.tablet]} /&gt;;
}</code></pre>
<p>Updates on rotation automatically.</p>

<h3>The "theme" picture</h3>
<pre><code class="language-tsx">// ThemeProvider at root
const tokens = {
  colors: { bg: '#fff', text: '#111', accent: '#0066ff' },
  space: { xs: 4, sm: 8, md: 16, lg: 24 },
  radii: { sm: 4, md: 8, lg: 16 },
  type: { body: { fontSize: 15, lineHeight: 20 } },
};

// Hook
function useTheme() { return useContext(ThemeCtx); }

// Usage
function Card() {
  const t = useTheme();
  return &lt;View style={{ backgroundColor: t.colors.bg, padding: t.space.md, borderRadius: t.radii.md }} /&gt;;
}</code></pre>

<h3>The "platform quirks" picture</h3>
<pre><code class="language-tsx">import { Platform } from 'react-native';

const styles = StyleSheet.create({
  button: {
    paddingVertical: Platform.select({ ios: 12, android: 10, default: 11 }),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
});</code></pre>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Styles inherit like CSS." Only font styles on a <code>&lt;Text&gt;</code> parent inherit to child <code>&lt;Text&gt;</code>s. Nothing else inherits. A background color on a parent View doesn't "paint through" to children. If you want a style applied everywhere, pass it explicitly or use a theme tokens + helper component.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>StyleSheet basics</h3>
<pre><code class="language-tsx">const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', color: '#111' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});

&lt;View style={styles.container}&gt;
  &lt;Text style={styles.title}&gt;Hello&lt;/Text&gt;
&lt;/View&gt;</code></pre>

<h3>Composition via arrays</h3>
<pre><code class="language-tsx">&lt;View style={[styles.card, pressed &amp;&amp; styles.pressed, { marginTop: insets.top }]} /&gt;</code></pre>

<h3>Flexbox in RN</h3>
<pre><code class="language-ts">// Container
flex: 1                         // grow to fill
flexDirection: 'row' | 'column' // default column
justifyContent: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'
alignItems: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
gap: 16                         // supported
rowGap / columnGap              // supported
flexWrap: 'nowrap' | 'wrap'

// Child
flex: 1
flexGrow, flexShrink, flexBasis
alignSelf
aspectRatio: 16 / 9             // great for images</code></pre>

<h3>Common layout idioms</h3>
<pre><code class="language-tsx">// Center child
&lt;View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}&gt;
  &lt;Text&gt;Centered&lt;/Text&gt;
&lt;/View&gt;

// Equal-width columns
&lt;View style={{ flexDirection: 'row' }}&gt;
  &lt;View style={{ flex: 1 }} /&gt;
  &lt;View style={{ flex: 1 }} /&gt;
  &lt;View style={{ flex: 1 }} /&gt;
&lt;/View&gt;

// Pinned footer
&lt;View style={{ flex: 1 }}&gt;
  &lt;ScrollView style={{ flex: 1 }}&gt;...&lt;/ScrollView&gt;
  &lt;View style={styles.footer} /&gt;
&lt;/View&gt;

// Overlay (absolute fill)
&lt;View style={StyleSheet.absoluteFill}&gt;
  {/* behaves like position:absolute; top/right/bottom/left: 0 */}
&lt;/View&gt;</code></pre>

<h3>Absolute positioning</h3>
<pre><code class="language-tsx">&lt;View style={{
  position: 'absolute',
  top: 20, right: 20,
  width: 40, height: 40,
  backgroundColor: 'red',
}} /&gt;
// absolute relative to closest positioned ancestor (any View with position: 'relative' or 'absolute')</code></pre>

<h3>Text styling</h3>
<pre><code class="language-tsx">&lt;Text style={{
  fontSize: 16,
  fontWeight: '600',        // '100' - '900' or 'normal' / 'bold'
  fontFamily: 'Inter-Regular',
  color: '#333',
  lineHeight: 24,
  letterSpacing: 0.2,
  textAlign: 'center',
  textDecorationLine: 'underline',
  textShadowColor: '#000',
}}&gt;
  Hello &lt;Text style={{ fontWeight: '700' }}&gt;world&lt;/Text&gt;  {/* inherits parent font, overrides weight */}
&lt;/Text&gt;</code></pre>

<h3>Shadows</h3>
<pre><code class="language-tsx">const shadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  android: { elevation: 3 },  // Material-style shadow
});</code></pre>
<p>Background must not be transparent on Android for elevation to show.</p>

<h3>Borders</h3>
<pre><code class="language-ts">borderWidth, borderColor, borderRadius
borderTopWidth, borderLeftColor, ...
borderTopLeftRadius, borderBottomEndRadius
borderStyle: 'solid' | 'dashed' | 'dotted'</code></pre>

<h3>Using PixelRatio for crisp lines</h3>
<pre><code class="language-tsx">import { PixelRatio, StyleSheet } from 'react-native';
const hairline = StyleSheet.hairlineWidth;   // ~0.33-0.5 on retina
// 1px lines look thick on Retina — use hairlineWidth for native feel</code></pre>

<h3>NativeWind example</h3>
<pre><code class="language-tsx">// tailwind.config.js configured for react-native
// Then:
&lt;View className="flex-1 items-center justify-center bg-white dark:bg-gray-900"&gt;
  &lt;Text className="text-2xl font-bold text-gray-900 dark:text-white"&gt;Hello&lt;/Text&gt;
&lt;/View&gt;</code></pre>

<h3>Theme context</h3>
<pre><code class="language-tsx">const ThemeCtx = createContext(lightTheme);

function ThemeProvider({ children }) {
  const scheme = useColorScheme();   // 'light' | 'dark' | null
  const theme = scheme === 'dark' ? darkTheme : lightTheme;
  return &lt;ThemeCtx.Provider value={theme}&gt;{children}&lt;/ThemeCtx.Provider&gt;;
}

export const useTheme = () =&gt; useContext(ThemeCtx);</code></pre>

<h3>Platform-specific files</h3>
<p>Metro resolves <code>Component.ios.tsx</code> or <code>Component.android.tsx</code> per platform. Useful for deeper divergence beyond Platform.select.</p>

<h3>Responsive scale</h3>
<pre><code class="language-ts">import { Dimensions } from 'react-native';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = (size: number) =&gt; (SCREEN_WIDTH / 375) * size;  // 375 = base iPhone width
// Then: fontSize: scale(16)
// Or use useWindowDimensions() for reactivity</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — card</h3>
<pre><code class="language-tsx">const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
});
&lt;View style={styles.card}&gt;&lt;Text&gt;Hi&lt;/Text&gt;&lt;/View&gt;</code></pre>

<h3>Example 2 — responsive grid</h3>
<pre><code class="language-tsx">function Grid({ items }) {
  const { width } = useWindowDimensions();
  const cols = width &gt; 600 ? 3 : 2;
  return (
    &lt;View style={{ flexDirection: 'row', flexWrap: 'wrap' }}&gt;
      {items.map((it) =&gt; (
        &lt;View key={it.id} style={{ width: \`\${100/cols}%\`, padding: 8 }}&gt;
          &lt;Card item={it} /&gt;
        &lt;/View&gt;
      ))}
    &lt;/View&gt;
  );
}</code></pre>

<h3>Example 3 — themed component</h3>
<pre><code class="language-tsx">function Button({ title, onPress }) {
  const t = useTheme();
  return (
    &lt;Pressable
      onPress={onPress}
      style={({ pressed }) =&gt; ({
        backgroundColor: pressed ? t.colors.accentPressed : t.colors.accent,
        paddingVertical: t.space.sm,
        paddingHorizontal: t.space.md,
        borderRadius: t.radii.sm,
      })}
    &gt;
      &lt;Text style={{ color: t.colors.onAccent, fontWeight: '600' }}&gt;{title}&lt;/Text&gt;
    &lt;/Pressable&gt;
  );
}</code></pre>

<h3>Example 4 — full-screen overlay</h3>
<pre><code class="language-tsx">&lt;View style={StyleSheet.absoluteFill}&gt;
  &lt;View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} /&gt;
  &lt;View style={styles.modal}&gt; ... &lt;/View&gt;
&lt;/View&gt;</code></pre>

<h3>Example 5 — Text with inline styling</h3>
<pre><code class="language-tsx">&lt;Text style={styles.paragraph}&gt;
  Welcome back, &lt;Text style={{ fontWeight: '700' }}&gt;{name}&lt;/Text&gt;!
  {'\n'}Your last login was &lt;Text style={{ color: '#666' }}&gt;{time}&lt;/Text&gt;.
&lt;/Text&gt;</code></pre>

<h3>Example 6 — NativeWind</h3>
<pre><code class="language-tsx">import { View, Text, Pressable } from 'react-native';
&lt;Pressable
  className="bg-blue-500 active:bg-blue-700 px-4 py-2 rounded-lg"
  onPress={...}
&gt;
  &lt;Text className="text-white font-bold text-center"&gt;Submit&lt;/Text&gt;
&lt;/Pressable&gt;</code></pre>

<h3>Example 7 — dark mode toggle</h3>
<pre><code class="language-tsx">function App() {
  const [scheme, setScheme] = useState&lt;'light'|'dark'|'system'&gt;('system');
  const systemScheme = useColorScheme();
  const effective = scheme === 'system' ? systemScheme ?? 'light' : scheme;
  const theme = effective === 'dark' ? darkTheme : lightTheme;
  return (
    &lt;ThemeCtx.Provider value={theme}&gt;
      &lt;StatusBar barStyle={effective === 'dark' ? 'light-content' : 'dark-content'} /&gt;
      &lt;Nav /&gt;
    &lt;/ThemeCtx.Provider&gt;
  );
}</code></pre>

<h3>Example 8 — aspectRatio for images</h3>
<pre><code class="language-tsx">&lt;Image
  source={{ uri }}
  style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 8 }}
/&gt;
// Height derived from width × aspectRatio — no layout shift.</code></pre>

<h3>Example 9 — gap for spacing</h3>
<pre><code class="language-tsx">&lt;View style={{ flexDirection: 'row', gap: 12 }}&gt;
  &lt;Chip /&gt;&lt;Chip /&gt;&lt;Chip /&gt;
&lt;/View&gt;
// 12px between children; no margin hacks.</code></pre>

<h3>Example 10 — safe area integration</h3>
<pre><code class="language-tsx">function Screen({ children }) {
  const insets = useSafeAreaInsets();
  return (
    &lt;View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}&gt;
      {children}
    &lt;/View&gt;
  );
}</code></pre>

<h3>Example 11 — Tamagui</h3>
<pre><code class="language-tsx">import { YStack, Text, Button } from 'tamagui';
&lt;YStack padding="$4" gap="$2" backgroundColor="$background"&gt;
  &lt;Text size="$5"&gt;Hello&lt;/Text&gt;
  &lt;Button theme="active"&gt;Save&lt;/Button&gt;
&lt;/YStack&gt;
// Tokens ($4, $background) defined in theme config; compiled at build time.</code></pre>

<h3>Example 12 — hairline divider</h3>
<pre><code class="language-tsx">&lt;View style={{ height: StyleSheet.hairlineWidth, backgroundColor: '#ccc' }} /&gt;</code></pre>

<h3>Example 13 — conditional style</h3>
<pre><code class="language-tsx">&lt;View style={[
  styles.badge,
  type === 'success' &amp;&amp; { backgroundColor: 'green' },
  type === 'error' &amp;&amp; { backgroundColor: 'red' },
]} /&gt;</code></pre>

<h3>Example 14 — fixed + flex child</h3>
<pre><code class="language-tsx">&lt;View style={{ flexDirection: 'row', alignItems: 'center' }}&gt;
  &lt;Image style={{ width: 40, height: 40 }} /&gt;   {/* fixed */}
  &lt;View style={{ flex: 1, marginLeft: 12 }}&gt;   {/* fills remaining */}
    &lt;Text&gt;Name&lt;/Text&gt;
    &lt;Text&gt;Subtitle&lt;/Text&gt;
  &lt;/View&gt;
&lt;/View&gt;</code></pre>

<h3>Example 15 — custom font registration</h3>
<pre><code>// Expo
npx expo install expo-font
// In app entry:
import { useFonts } from 'expo-font';
const [loaded] = useFonts({ 'Inter-Regular': require('./assets/Inter-Regular.ttf') });
if (!loaded) return &lt;Splash /&gt;;
// Bare RN: add fonts to iOS (Info.plist) and Android (assets/fonts), then re-link.</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. flexDirection defaults to column</h3>
<p>Web's Flexbox defaults to row. Easy mistake — you write a "horizontal bar" and see it stacked vertically. Always explicit on flexDirection when intentional.</p>

<h3>2. percentages need a defined parent size</h3>
<p><code>width: '50%'</code> fails if the parent has no explicit width. On a flex parent, parent sizes from content. Add <code>flex: 1</code> on the container or explicit dimensions.</p>

<h3>3. <code>overflow: 'hidden'</code> required for rounded corners on Android</h3>
<p>An image with borderRadius may overflow on Android unless the container has <code>overflow: 'hidden'</code>. iOS handles it automatically.</p>

<h3>4. Shadow on transparent background (Android)</h3>
<p><code>elevation</code> requires a non-transparent background on the elevated view. Workaround: set <code>backgroundColor: '#fff'</code> or wrap.</p>

<h3>5. lineHeight tricky on Android</h3>
<p>Android adds extra padding around text. <code>includeFontPadding: false</code> can fix vertical centering.</p>

<h3>6. gap on older RN versions</h3>
<p>gap / rowGap / columnGap supported in RN 0.71+. Older versions need margin tricks.</p>

<h3>7. Absolute within ScrollView</h3>
<p>Absolutely positioned child does NOT scroll with content (it's positioned relative to the ScrollView container, not the content). Use <code>position: absolute</code> + <code>top</code> on the content wrapper for in-scroll overlays.</p>

<h3>8. Rotating the device</h3>
<p><code>Dimensions.get('window')</code> is static at read time — doesn't update on rotation. <code>useWindowDimensions</code> is reactive. Prefer the hook for responsive layouts.</p>

<h3>9. PixelRatio effects</h3>
<p>Sizes measured in DPI-independent points. <code>PixelRatio.getPixelSizeForLayoutSize</code> converts for native calls. Usually you don't care; for precise graphics work, you do.</p>

<h3>10. Keyboard height</h3>
<p>Keyboard height varies by device and language (Chinese IMEs are taller). Use <code>Keyboard.addListener('keyboardDidShow', e =&gt; e.endCoordinates.height)</code> or the keyboard-controller library.</p>

<h3>11. StyleSheet.create vs inline</h3>
<p>Modern RN (Fabric) removes the ID-mapping optimization StyleSheet once had, so performance difference is minimal. Still use StyleSheet.create for organization and stable references.</p>

<h3>12. Negative margins</h3>
<p>Work but can cause overflow cliping bugs. Prefer padding adjustments.</p>

<h3>13. transform uses its own syntax</h3>
<pre><code class="language-tsx">transform: [{ translateX: 10 }, { rotate: '45deg' }, { scale: 1.1 }]</code></pre>
<p>Array of one-key objects, not CSS-string.</p>

<h3>14. fontWeight values</h3>
<p>Strings '100' - '900' and 'normal' / 'bold'. Numbers also work but inconsistent. On Android, only specific weights render if the font file supports them (e.g., Inter-Bold installed separately).</p>

<h3>15. Custom fonts require platform config</h3>
<p>On Expo, <code>useFonts</code> hook. Bare RN: add files to Xcode project + Info.plist (iOS) and assets/fonts + Java config (Android). Then reference by file name.</p>

<h3>16. Inheritable style on non-Text</h3>
<p>Setting <code>color</code> on a View doesn't affect children. Only Text inside Text inherits.</p>

<h3>17. flex: 1 inside a row</h3>
<p>In a row, <code>flex: 1</code> means "fill horizontally." A nested <code>flex: 1</code> column child inside will fill vertically. Axes change with flexDirection.</p>

<h3>18. Dimensions change on split screen (iPad)</h3>
<p>iPad split view resizes the app. useWindowDimensions reacts; components relying on initial dimensions will be wrong. Use the hook.</p>

<h3>19. Status bar overlap</h3>
<p>Without SafeAreaView or insets, content can render under the status bar. Always handle. Even on Android where StatusBar is a separate native bar, iOS X+ notch requires explicit padding.</p>

<h3>20. Third-party libs may break your dark mode</h3>
<p>A library that hard-codes colors ignores your ThemeProvider. Check docs for themable variants. Sometimes you need to patch (patch-package) or wrap.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — inline styles everywhere</h3>
<pre><code class="language-tsx">&lt;View style={{ flex: 1, padding: 16, backgroundColor: '#fff' }} /&gt;</code></pre>
<p>New object every render — breaks memoization of children, pollutes diff. Use StyleSheet.create for stable objects.</p>

<h3>Anti-pattern 2 — hard-coded colors everywhere</h3>
<p>No theming path. Dark mode requires touching dozens of files. Use theme tokens from day 1.</p>

<h3>Anti-pattern 3 — hand-rolled responsive with Dimensions.get</h3>
<p>Static; doesn't respond to rotation. Use <code>useWindowDimensions</code>.</p>

<h3>Anti-pattern 4 — excessive wrappers</h3>
<pre><code class="language-tsx">&lt;View&gt;&lt;View&gt;&lt;View&gt;&lt;Text&gt;Hi&lt;/Text&gt;&lt;/View&gt;&lt;/View&gt;&lt;/View&gt;</code></pre>
<p>Each View is a native view. Deep trees cost layout time. Flatten via padding, gap, and fewer containers.</p>

<h3>Anti-pattern 5 — fixed pixel sizes for everything</h3>
<p>Doesn't adapt to tablets or accessibility font scaling. Prefer flex + percentages where appropriate.</p>

<h3>Anti-pattern 6 — ignoring accessibility font scaling</h3>
<p>Users can increase system font size. If your layout is pixel-perfect at 100%, it breaks at 200%. Test with larger text. Consider <code>allowFontScaling</code> prop and <code>maxFontSizeMultiplier</code>.</p>

<h3>Anti-pattern 7 — relying on CSS properties RN doesn't support</h3>
<p><code>display: 'grid'</code>, <code>float</code>, <code>position: 'fixed'</code>, <code>@media</code>, <code>::before</code>, <code>transition</code>. None exist. Check the RN docs or use a polyfill library (few exist for grid).</p>

<h3>Anti-pattern 8 — using Tailwind on RN via string replacement</h3>
<p>Some libs parse className strings at runtime — slow. Use NativeWind (compiled at build time) if you want Tailwind.</p>

<h3>Anti-pattern 9 — duplicate style definitions for light/dark</h3>
<pre><code class="language-tsx">const lightStyles = StyleSheet.create({ card: {...} });
const darkStyles = StyleSheet.create({ card: {...} });
const styles = isDark ? darkStyles : lightStyles;</code></pre>
<p>Doubles maintenance. Use tokens + computed styles:</p>
<pre><code class="language-tsx">const styles = useMemo(() =&gt; StyleSheet.create({
  card: { backgroundColor: theme.bg, borderColor: theme.border }
}), [theme]);</code></pre>

<h3>Anti-pattern 10 — not testing on both platforms</h3>
<p>iOS renders fine; Android has different text padding, different shadow, different keyboard behavior. Build + test both per PR.</p>

<h3>Anti-pattern 11 — forgetting safe area</h3>
<p>Content under notch or home indicator. Provide a Screen wrapper that handles insets.</p>

<h3>Anti-pattern 12 — overusing StatusBar manipulation</h3>
<p>Changing StatusBar per screen can flicker. Manage globally via navigation events or one component.</p>

<h3>Anti-pattern 13 — using margin when gap is cleaner</h3>
<p><code>marginRight</code> on every child except last (negative workflow) vs <code>gap: 12</code> on container — gap wins readability.</p>

<h3>Anti-pattern 14 — assuming PX matches design system</h3>
<p>RN sizes are DPI-independent "points." A 16pt font looks the same-ish across densities but not exact pixels. Don't expect pixel-perfection; ensure layout correctness.</p>

<h3>Anti-pattern 15 — not configuring custom fonts properly</h3>
<p>Font loaded but name mismatch with actual PostScript name → falls back to system. Use <code>expo-font</code> or a tool to verify names. Check both platforms.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. How does RN styling differ from CSS?</div>
  <div class="qa-answer">
    <ul>
      <li>Styles are JS objects, not parsed CSS.</li>
      <li>No selectors or cascade (except Text→Text font inheritance).</li>
      <li>Flexbox is the layout primitive; <code>flexDirection</code> defaults to <code>column</code>.</li>
      <li>No <code>:hover</code>, no media queries — use <code>useWindowDimensions</code>.</li>
      <li>Numeric values are DPI-independent points, not pixels.</li>
      <li>Platform differences (shadow, elevation, text metrics) require <code>Platform.select</code>.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Why StyleSheet.create?</div>
  <div class="qa-answer">
    <p>It groups styles into named objects with stable references, validates unknown properties in dev, and historically optimized bridge traffic by mapping to IDs. Modern Fabric mostly removes the bridge optimization but the organizational and stability benefits remain.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. How do you implement dark mode?</div>
  <div class="qa-answer">
    <ol>
      <li>Define light/dark token objects (colors, spacing consistent).</li>
      <li>Create a ThemeContext; provider reads <code>useColorScheme()</code> or a user preference.</li>
      <li>Components use <code>useTheme()</code> to get current tokens; pass to styles (inline or useMemo'd StyleSheet).</li>
      <li>Update StatusBar <code>barStyle</code> per theme.</li>
      <li>Handle images that differ per theme (logos) by conditional asset.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Flexbox in RN — key differences from web?</div>
  <div class="qa-answer">
    <ul>
      <li><code>flexDirection: 'column'</code> default (web is 'row').</li>
      <li><code>alignItems: 'stretch'</code> default.</li>
      <li><code>flex: 1</code> is standard for "fill parent in main axis."</li>
      <li>No CSS Grid support.</li>
      <li>Percentages for most dimensions.</li>
      <li><code>gap</code>/<code>rowGap</code>/<code>columnGap</code> supported in 0.71+.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. How do you handle platform differences?</div>
  <div class="qa-answer">
    <ul>
      <li><code>Platform.OS</code> for conditionals.</li>
      <li><code>Platform.select</code> for style objects.</li>
      <li>Platform-specific files (<code>Component.ios.tsx</code> / <code>.android.tsx</code>).</li>
      <li>Shadow (<code>shadow*</code> iOS) vs elevation (Android).</li>
      <li>Text padding (<code>includeFontPadding</code> Android).</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Why NativeWind / Tamagui over StyleSheet?</div>
  <div class="qa-answer">
    <p>Vanilla StyleSheet is verbose; color tokens drift; responsive logic is ad-hoc. Libraries provide:</p>
    <ul>
      <li>Design tokens out of the box.</li>
      <li>Familiar ergonomics (Tailwind class names for NativeWind; design-system primitives for Tamagui).</li>
      <li>Dark mode baked in.</li>
      <li>Tamagui also has compile-time optimization for web + RN.</li>
    </ul>
    <p>Tradeoff: learning curve + build tooling. Many teams prefer the lib for consistency; some stay on StyleSheet.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How do you make a layout responsive to screen size?</div>
  <div class="qa-answer">
<pre><code class="language-tsx">const { width } = useWindowDimensions();
const isTablet = width &gt;= 768;
const styles = StyleSheet.create({
  wrapper: { padding: isTablet ? 32 : 16, flexDirection: isTablet ? 'row' : 'column' },
});</code></pre>
    <p>Reactive to rotation. Breakpoints defined by you; no standard. Can build a useBreakpoint hook for your app's tokens.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How do you add custom fonts?</div>
  <div class="qa-answer">
    <p>Expo: <code>useFonts</code> hook in root, pass font files via <code>expo-font</code>. Bare RN: add font files to iOS (Xcode project, Info.plist UIAppFonts entry) and Android (<code>android/app/src/main/assets/fonts/</code>). Reference via fontFamily name exactly as PostScript name. Test on both platforms.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. When would you use absolute positioning?</div>
  <div class="qa-answer">
    <p>Overlays, floating action buttons, badges on icons, drag-and-drop positioning, custom modals. Absolute children don't participate in flex layout. Careful in ScrollView (absolute child sticks to viewport, not content).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Explain aspectRatio.</div>
  <div class="qa-answer">
    <p><code>aspectRatio: 16/9</code> sets the width-to-height ratio. Given either width or height, the other is computed. Great for images and videos — reserves layout space before the resource loads, avoiding CLS-like shifts.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. How do you prevent a large Text from expanding layout?</div>
  <div class="qa-answer">
<pre><code class="language-tsx">&lt;View style={{ flex: 1 }}&gt;
  &lt;Text numberOfLines={1} ellipsizeMode="tail"&gt;Very long text that needs truncating&lt;/Text&gt;
&lt;/View&gt;</code></pre>
    <p><code>numberOfLines</code> forces truncation; <code>ellipsizeMode</code> picks where to clip.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Style array: explain the merge behavior.</div>
  <div class="qa-answer">
<pre><code class="language-tsx">&lt;View style={[styles.base, condition &amp;&amp; styles.variant, { marginTop: 10 }]} /&gt;</code></pre>
    <p>Later values override earlier; false/null/undefined ignored. RN flattens the array and merges into one style object. Preferred pattern for conditional styles.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. How do you handle font scaling for accessibility?</div>
  <div class="qa-answer">
    <p>iOS / Android users can enable larger system font size. By default, RN Text scales with it. If your layout assumes fixed size, large fonts break it. Options:</p>
    <ul>
      <li>Design with variable text sizes in mind — use <code>flex</code>, <code>flexWrap</code>.</li>
      <li>Cap scaling per Text: <code>maxFontSizeMultiplier={1.4}</code>.</li>
      <li>Disable for critical UI: <code>allowFontScaling={false}</code>.</li>
      <li>Test with system font size 200% to catch breakage.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. Hairline divider — why is it special?</div>
  <div class="qa-answer">
    <p><code>StyleSheet.hairlineWidth</code> gives ~0.33 on 3x retina, ~0.5 on 2x, 1 on 1x — whatever creates a "1 physical pixel" line. Crucial for the thin dividers iOS uses. A regular <code>1</code> is chunky on retina.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. How do transforms differ from web?</div>
  <div class="qa-answer">
    <pre><code class="language-tsx">transform: [{ translateX: 10 }, { rotate: '45deg' }, { scale: 1.1 }]</code></pre>
    <p>Array of one-key objects. Order matters (applied left to right). Rotate takes a string with unit ('45deg' / '0.5rad'). Translate in points. Animatable via Animated / Reanimated.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You distinguish RN styles (JS objects, no cascade) from CSS.</li>
    <li>You know flexDirection defaults to column.</li>
    <li>You handle platform differences with Platform.select / .ios.tsx files.</li>
    <li>You use theme tokens and a ThemeContext.</li>
    <li>You know useWindowDimensions for responsive layouts.</li>
    <li>You use StyleSheet.hairlineWidth for crisp dividers.</li>
    <li>You reach for NativeWind or Tamagui for design systems.</li>
    <li>You handle font scaling and dark mode from day 1.</li>
  </ul>
</div>
`}

]
});
