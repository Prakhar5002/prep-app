window.PREP_SITE.registerTopic({
  id: 'mux-material',
  module: 'mobile-ux',
  title: 'Material Design 3',
  estimatedReadTime: '45 min',
  tags: ['android', 'material-design', 'material-3', 'm3', 'dynamic-color', 'monet', 'theming', 'navigation', 'react-native'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Material Design 3 (M3, "Material You")</strong> is Google's design system shipped with Android 12 (2021) and continuously updated. Its current shipping evolution is <strong>Material 3 Expressive</strong> (announced May 2025, rolled out with Android 16 QPR1 and on Pixel from September 2025) — springier emphasized motion, a refreshed type scale, and updated components layered on top of the same M3 foundation. It's what makes an Android app feel "from this decade" rather than feeling like a port of an iOS app or stuck in 2017's M2 visuals. For a React Native engineer, M3 is the Android counterpart to iOS's HIG — different tokens, different navigation primitives, different gestures.</p>
<ul>
  <li><strong>Three M3 fundamentals:</strong> Dynamic color (extracted from user's wallpaper via Monet), updated typography scale, redesigned components (cards, FAB, navigation bar, top app bar).</li>
  <li><strong>Navigation primitives:</strong> bottom navigation bar (3–5 destinations), navigation drawer (more destinations or modal nav), navigation rail (tablet/foldable), top app bar with overflow menu.</li>
  <li><strong>The hallmark FAB:</strong> Floating Action Button — primary screen action; extended FAB for "with text" variant; small FAB for compact contexts.</li>
  <li><strong>Material color system:</strong> 5 key colors (primary, secondary, tertiary, error, neutral) → 13 tone palettes → semantic roles (primary, on-primary, primary-container, on-primary-container).</li>
  <li><strong>Typography scale:</strong> Display / Headline / Title / Body / Label families × Large / Medium / Small sizes.</li>
  <li><strong>Elevation, ripples, motion:</strong> Tonal elevation (color shift) over shadows in M3; ripple touch feedback; emphasized motion easing curves.</li>
  <li><strong>RN reality:</strong> <code>react-native-paper</code> (M3-compliant out of the box) is the default; build custom only when Paper doesn't fit. Edge-to-edge layouts + system bar handling matter on Android 14+.</li>
  <li><strong>Predictive Back (Android 13+):</strong> a smooth animated back gesture; opt in via manifest + handle in your nav library.</li>
</ul>
<p><strong>Mantra:</strong> "Use Material primitives. Lean on tonal color + ripples + FAB. Honor the system back gesture. Edge-to-edge with proper insets."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What Material Design is</h3>
<p>A design system Google originated in 2014 as a unified language across Android, web, and Google's own apps. Iterated through Material 1 (2014) → Material 2 (2018, Google's "rebrand" with bolder typography) → <strong>Material 3</strong> (2021, "Material You" with Dynamic Color) → <strong>Material 3 Expressive</strong> (announced May 2025, shipped in Android 16 QPR1 / Pixel from September 2025 — springy emphasized motion, a new type scale, and updated components). M3 (in its Expressive form) is the current default and the only line Android 12+ system apps follow.</p>

<h3>Why Material matters on Android</h3>
<table>
  <thead><tr><th>Reason</th><th>Outcome</th></tr></thead>
  <tbody>
    <tr><td>System integration</td><td>Bottom nav + FAB + ripple are the patterns Android users expect. Drift = "weird app."</td></tr>
    <tr><td>Dynamic Color (Material You)</td><td>App matches user's wallpaper-derived palette automatically. Massive personalization win since Android 12.</td></tr>
    <tr><td>Tonal elevation + dark mode</td><td>System-correct color shifts at depth; dark mode looks right out of the box.</td></tr>
    <tr><td>Accessibility defaults</td><td>Material components ship with proper touch targets, content descriptions, focus rings.</td></tr>
    <tr><td>Foldable + tablet adaptiveness</td><td>Navigation rail / drawer reflows correctly across screen sizes.</td></tr>
    <tr><td>Predictive Back support</td><td>Material components animate as the system back gesture progresses.</td></tr>
  </tbody>
</table>

<h3>Why React Native makes this harder</h3>
<ul>
  <li>RN ships no Material components by default — vanilla View / Text / Pressable have no Material affordances.</li>
  <li>Cross-platform component temptation: design once for both, look subtly wrong on each.</li>
  <li>Dynamic Color requires reading system tokens — needs <code>react-native-dynamic-color</code> or similar; Expo provides <code>expo-system-ui</code>.</li>
  <li>Edge-to-edge layouts (Android 15 default) need <code>setStatusBarTranslucent</code> + insets handling.</li>
  <li>Predictive Back requires opting in via the Android manifest + bridging into navigation.</li>
</ul>

<h3>The Material 3 pillars</h3>
<table>
  <thead><tr><th>Pillar</th><th>Means</th><th>Practical</th></tr></thead>
  <tbody>
    <tr><td>Personal</td><td>Dynamic Color from user's wallpaper</td><td>App's primary color shifts with the system</td></tr>
    <tr><td>Adaptive</td><td>Same components reflow phone / tablet / foldable</td><td>Bottom nav → nav rail → nav drawer at width breakpoints</td></tr>
    <tr><td>Expressive</td><td>Bolder typography, generous shape, strong motion</td><td>Pill-shaped FAB, extended FAB with label, motion-emphasized transitions</td></tr>
  </tbody>
</table>

<h3>iOS HIG vs Material 3 — the key differences</h3>
<table>
  <thead><tr><th>Concern</th><th>iOS HIG</th><th>Material 3</th></tr></thead>
  <tbody>
    <tr><td>Top-level navigation</td><td>Bottom tab bar</td><td>Bottom navigation bar (similar)</td></tr>
    <tr><td>Side menu</td><td>Rare; not a native pattern</td><td>Navigation drawer (common)</td></tr>
    <tr><td>Primary action</td><td>Top-right of nav bar</td><td>Floating Action Button (FAB) on the screen</td></tr>
    <tr><td>Back button</td><td>Top-left chevron + edge-swipe</td><td>System back button (gesture or 3-button); back arrow in app bar</td></tr>
    <tr><td>Touch feedback</td><td>Opacity dim on press</td><td>Ripple from touch point</td></tr>
    <tr><td>Color</td><td>Static brand colors + system semantic</td><td>Dynamic Color from wallpaper + tonal palette</td></tr>
    <tr><td>Elevation</td><td>Shadow-based; subtle in light, none in dark</td><td>Tonal elevation in M3 (color shift); shadow secondary</td></tr>
    <tr><td>Modal</td><td>Slide-up sheet with detents; swipe-down dismiss</td><td>Bottom sheet (modal or persistent); swipe-down dismiss</td></tr>
    <tr><td>Top bar</td><td>Large title that shrinks on scroll</td><td>Top app bar with optional CenterAligned / Medium / Large variants</td></tr>
    <tr><td>Icons</td><td>SF Symbols (5,000+)</td><td>Material Symbols (3,000+)</td></tr>
  </tbody>
</table>

<h3>What "good Material on RN" looks like</h3>
<ul>
  <li>Uses <code>react-native-paper</code> or equivalent for all major components.</li>
  <li>Theme respects system Dynamic Color where available; falls back to a brand palette.</li>
  <li>Dark mode tonal elevation: cards visibly lighter than background by ~8dp tone shift.</li>
  <li>FAB on screens with one primary action; extended FAB with label on critical CTAs.</li>
  <li>Bottom navigation bar (not iOS tab bar styling) for top-level destinations.</li>
  <li>Back gesture / button works; Predictive Back animates smoothly on Android 13+.</li>
  <li>Top app bar has overflow menu (3-dot) for secondary actions.</li>
  <li>Ripple touch feedback on every interactive surface.</li>
  <li>Bottom sheets for transient tasks; full-screen dialogs only for critical interruption.</li>
  <li>Edge-to-edge: status bar translucent; system bar insets respected.</li>
</ul>

<h3>What "bad Material on RN" looks like</h3>
<ul>
  <li>iOS-style nav bar with chevron back button on Android — feels alien.</li>
  <li>Tab bar that doesn't match Material spec (no labels, wrong active indicator).</li>
  <li>No FAB even when there's a clear primary screen action.</li>
  <li>Opacity press feedback instead of ripple.</li>
  <li>Hard-coded brand color that doesn't honor Dynamic Color in M3 themes.</li>
  <li>Status bar overlapping content under the camera cutout.</li>
  <li>System back button blocked by override.</li>
  <li>"Hamburger" drawer when bottom nav would be the right choice.</li>
  <li>Modal that doesn't swipe-down or slide-from-bottom.</li>
  <li>Missing focus indicators (TalkBack users can't navigate).</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The Material color system (M3)</h3>
<p>5 key colors → 13 tones each → semantic roles (24 total slots).</p>
<table>
  <thead><tr><th>Key color</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td>Primary</td><td>Main brand identity; FAB, primary buttons, app bar tint</td></tr>
    <tr><td>Secondary</td><td>Less prominent; chips, filters</td></tr>
    <tr><td>Tertiary</td><td>Contrasting accent; small highlights</td></tr>
    <tr><td>Error</td><td>Validation, destructive states</td></tr>
    <tr><td>Neutral / Neutral Variant</td><td>Backgrounds, surfaces, outlines</td></tr>
  </tbody>
</table>

<p>Each key color has a "tonal palette" with tones 0–100. From those, M3 derives semantic role pairs:</p>

<table>
  <thead><tr><th>Pair</th><th>Light theme tones</th><th>Dark theme tones</th></tr></thead>
  <tbody>
    <tr><td>primary / on-primary</td><td>40 / 100</td><td>80 / 20</td></tr>
    <tr><td>primary-container / on-primary-container</td><td>90 / 10</td><td>30 / 90</td></tr>
    <tr><td>surface / on-surface</td><td>99 / 10</td><td>10 / 90</td></tr>
    <tr><td>surface-variant / on-surface-variant</td><td>90 / 30</td><td>30 / 80</td></tr>
    <tr><td>outline / outline-variant</td><td>50 / 80</td><td>60 / 30</td></tr>
  </tbody>
</table>

<p>Always pair the foreground "on-X" with the background "X" for guaranteed contrast.</p>

<h3>Tonal elevation</h3>
<p>M3 replaced shadow-heavy elevation with <strong>tonal elevation</strong>: surfaces at higher elevation get a slight color shift (towards primary) instead of (or in addition to) a shadow. In dark mode this is essential — shadows are invisible.</p>
<table>
  <thead><tr><th>Elevation</th><th>Tonal shift</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td>Level 0 (0dp)</td><td>none</td><td>Page background</td></tr>
    <tr><td>Level 1 (1dp)</td><td>+5% primary</td><td>Cards (resting)</td></tr>
    <tr><td>Level 2 (3dp)</td><td>+8% primary</td><td>Top app bar (scrolled)</td></tr>
    <tr><td>Level 3 (6dp)</td><td>+11% primary</td><td>FAB</td></tr>
    <tr><td>Level 4 (8dp)</td><td>+12% primary</td><td>Bottom sheet (open)</td></tr>
    <tr><td>Level 5 (12dp)</td><td>+14% primary</td><td>Modal dialog</td></tr>
  </tbody>
</table>

<h3>The typography scale</h3>
<table>
  <thead><tr><th>Family</th><th>Size variants</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td>Display</td><td>Large 57 / Medium 45 / Small 36</td><td>Hero text; rare</td></tr>
    <tr><td>Headline</td><td>Large 32 / Medium 28 / Small 24</td><td>Section heading</td></tr>
    <tr><td>Title</td><td>Large 22 / Medium 16 / Small 14</td><td>Card / list-row title</td></tr>
    <tr><td>Body</td><td>Large 16 / Medium 14 / Small 12</td><td>Body text, descriptions</td></tr>
    <tr><td>Label</td><td>Large 14 / Medium 12 / Small 11</td><td>Buttons, captions</td></tr>
  </tbody>
</table>
<p>Default Android font: Roboto, with Roboto Flex variable font in M3.</p>

<h3>Components every M3 app needs</h3>
<table>
  <thead><tr><th>Component</th><th>Purpose</th><th>RN (react-native-paper) name</th></tr></thead>
  <tbody>
    <tr><td>Top app bar</td><td>Screen title + actions; can be CenterAligned / Small / Medium / Large</td><td><code>Appbar.Header</code></td></tr>
    <tr><td>Bottom nav bar</td><td>3–5 top-level destinations</td><td>via <code>react-navigation/material-bottom-tabs</code> or Paper's <code>BottomNavigation</code></td></tr>
    <tr><td>Navigation drawer</td><td>5+ destinations or modal nav</td><td><code>Drawer</code></td></tr>
    <tr><td>Navigation rail</td><td>Tablet / foldable nav at sides</td><td>not first-class in Paper; build custom or use Adaptive layouts</td></tr>
    <tr><td>FAB</td><td>Primary screen action</td><td><code>FAB</code> / <code>FAB.Group</code> / <code>FAB extended</code></td></tr>
    <tr><td>Card</td><td>Content container with elevation</td><td><code>Card</code></td></tr>
    <tr><td>Chip</td><td>Filters, tags, suggestions, input chips</td><td><code>Chip</code></td></tr>
    <tr><td>Switch / Checkbox / Radio</td><td>Boolean / multi-select / single-select</td><td><code>Switch</code>, <code>Checkbox</code>, <code>RadioButton</code></td></tr>
    <tr><td>Snackbar</td><td>Brief in-context message; auto-dismiss</td><td><code>Snackbar</code></td></tr>
    <tr><td>Bottom sheet</td><td>Transient task or info; persistent or modal</td><td>via <code>@gorhom/bottom-sheet</code></td></tr>
    <tr><td>Dialog</td><td>Critical interruption</td><td><code>Dialog</code> / <code>Modal</code></td></tr>
    <tr><td>Menu</td><td>Overflow menu, dropdown</td><td><code>Menu</code></td></tr>
    <tr><td>Search bar</td><td>Search-first screens</td><td><code>Searchbar</code></td></tr>
    <tr><td>Date / Time picker</td><td>Date selection</td><td><code>DatePickerModal</code> from <code>react-native-paper-dates</code></td></tr>
  </tbody>
</table>

<h3>Touch target + grid</h3>
<table>
  <thead><tr><th>Concern</th><th>Value</th></tr></thead>
  <tbody>
    <tr><td>Minimum tap target</td><td>48 × 48dp</td></tr>
    <tr><td>Base grid</td><td>4dp; spacing in multiples of 4 or 8</td></tr>
    <tr><td>Edge inset (phone)</td><td>16dp</td></tr>
    <tr><td>Bottom navigation height</td><td>80dp</td></tr>
    <tr><td>Top app bar (Small)</td><td>64dp</td></tr>
    <tr><td>Top app bar (Large)</td><td>152dp expanded</td></tr>
    <tr><td>FAB</td><td>56 × 56dp standard, 40 × 40 small, 96 × 96 large</td></tr>
  </tbody>
</table>

<h3>Motion: emphasized vs standard easing</h3>
<table>
  <thead><tr><th>Motion type</th><th>Easing</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td>Standard</td><td>cubic-bezier(0.2, 0, 0, 1)</td><td>Most transitions</td></tr>
    <tr><td>Emphasized</td><td>cubic-bezier(0.2, 0, 0, 1) with longer outgoing tail</td><td>FAB transformations, screen transitions</td></tr>
    <tr><td>Decelerated</td><td>cubic-bezier(0, 0, 0, 1)</td><td>Entering motion</td></tr>
    <tr><td>Accelerated</td><td>cubic-bezier(0.3, 0, 1, 1)</td><td>Exiting motion</td></tr>
  </tbody>
</table>

<h3>System bars (status / nav)</h3>
<ul>
  <li><strong>Status bar:</strong> top; shows time / battery / notifications.</li>
  <li><strong>Navigation bar:</strong> bottom (3-button or gesture indicator).</li>
  <li><strong>Edge-to-edge (Android 15+ default):</strong> content draws under both bars; you must inset interactive content via <code>WindowInsetsCompat</code> / RN's <code>useSafeAreaInsets</code>.</li>
  <li><strong>Color:</strong> match system bars to surface color so the divider isn't visible — feels like one continuous canvas.</li>
</ul>

<h3>Predictive Back (Android 13+)</h3>
<p>The system back gesture animates a "preview" of the screen you're going back to — your foreground screen visually shrinks/slides as the user drags. Opt in via:</p>
<ol>
  <li>Add <code>android:enableOnBackInvokedCallback="true"</code> to the manifest's <code>&lt;application&gt;</code> tag.</li>
  <li>Use <code>react-navigation</code> v7+ which integrates with the new back-invocation API.</li>
  <li>Override only when needed (unsaved changes); use <code>onBackPress</code> + <code>BackHandler</code>.</li>
</ol>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>react-native-paper setup</h3>
<pre><code class="language-typescript">// App.tsx
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { useMaterial3Theme } from '@pchmn/expo-material3-theme'; // dynamic color

function App() {
  const scheme = useColorScheme();
  const { theme: m3 } = useMaterial3Theme({ fallbackSourceColor: '#6750A4' });

  const paperTheme = scheme === 'dark'
    ? { ...MD3DarkTheme, colors: m3.dark }
    : { ...MD3LightTheme, colors: m3.light };

  return (
    &lt;PaperProvider theme={paperTheme}&gt;
      &lt;NavigationContainer theme={paperTheme}&gt;
        &lt;Stack.Navigator&gt; ... &lt;/Stack.Navigator&gt;
      &lt;/NavigationContainer&gt;
    &lt;/PaperProvider&gt;
  );
}
</code></pre>
<p>The <code>@pchmn/expo-material3-theme</code> package reads the system's Dynamic Color palette on Android 12+ and falls back to a generated palette from your seed color elsewhere. Paper's MD3 themes consume the same shape.</p>

<h3>Bottom navigation</h3>
<pre><code class="language-typescript">import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';

const Tab = createMaterialBottomTabNavigator();

function MainTabs() {
  return (
    &lt;Tab.Navigator
      activeColor={theme.colors.primary}
      inactiveColor={theme.colors.onSurfaceVariant}
      barStyle={{ backgroundColor: theme.colors.surface }}
    &gt;
      &lt;Tab.Screen name="Home" component={HomeScreen} options={{
        tabBarIcon: ({ color }) =&gt; &lt;Icon name="home" color={color} size={24} /&gt;,
      }} /&gt;
      &lt;Tab.Screen name="Search" component={SearchScreen} options={{
        tabBarIcon: ({ color }) =&gt; &lt;Icon name="magnify" color={color} size={24} /&gt;,
      }} /&gt;
      &lt;Tab.Screen name="Library" component={LibraryScreen} options={{
        tabBarIcon: ({ color }) =&gt; &lt;Icon name="library" color={color} size={24} /&gt;,
      }} /&gt;
    &lt;/Tab.Navigator&gt;
  );
}
</code></pre>

<h3>Top app bar with overflow menu</h3>
<pre><code class="language-typescript">import { Appbar, Menu } from 'react-native-paper';

function HomeScreen({ navigation }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    &lt;&gt;
      &lt;Appbar.Header&gt;
        &lt;Appbar.Content title="Inbox" /&gt;
        &lt;Appbar.Action icon="magnify" onPress={() =&gt; navigation.navigate('Search')} /&gt;
        &lt;Menu
          visible={menuOpen}
          onDismiss={() =&gt; setMenuOpen(false)}
          anchor={&lt;Appbar.Action icon="dots-vertical" onPress={() =&gt; setMenuOpen(true)} /&gt;}
        &gt;
          &lt;Menu.Item leadingIcon="filter" onPress={() =&gt; {}} title="Filter" /&gt;
          &lt;Menu.Item leadingIcon="sort" onPress={() =&gt; {}} title="Sort" /&gt;
          &lt;Menu.Item leadingIcon="refresh" onPress={() =&gt; {}} title="Refresh" /&gt;
        &lt;/Menu&gt;
      &lt;/Appbar.Header&gt;
      {/* screen body */}
    &lt;/&gt;
  );
}
</code></pre>

<h3>FAB placement</h3>
<pre><code class="language-typescript">import { FAB } from 'react-native-paper';

function ListScreen() {
  return (
    &lt;View style={{ flex: 1 }}&gt;
      &lt;FlatList data={items} renderItem={renderRow} /&gt;
      &lt;FAB
        icon="plus"
        style={styles.fab}
        onPress={onCompose}
      /&gt;
    &lt;/View&gt;
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
</code></pre>

<p>For prominent CTAs use the extended FAB (icon + label):</p>
<pre><code class="language-typescript">&lt;FAB.Group
  open={fabOpen}
  visible
  icon={fabOpen ? 'close' : 'plus'}
  actions={[
    { icon: 'pencil', label: 'Compose', onPress: onCompose },
    { icon: 'camera', label: 'Photo', onPress: onPhoto },
  ]}
  onStateChange={({ open }) =&gt; setFabOpen(open)}
/&gt;
</code></pre>

<h3>Cards</h3>
<pre><code class="language-typescript">import { Card, Text, Button } from 'react-native-paper';

&lt;Card&gt;
  &lt;Card.Cover source={{ uri: 'https://...' }} /&gt;
  &lt;Card.Title title="Cardinals" subtitle="Bird type" /&gt;
  &lt;Card.Content&gt;
    &lt;Text variant="bodyMedium"&gt;Description...&lt;/Text&gt;
  &lt;/Card.Content&gt;
  &lt;Card.Actions&gt;
    &lt;Button onPress={onCancel}&gt;Cancel&lt;/Button&gt;
    &lt;Button mode="contained" onPress={onOk}&gt;OK&lt;/Button&gt;
  &lt;/Card.Actions&gt;
&lt;/Card&gt;
</code></pre>

<h3>Buttons by variant</h3>
<pre><code class="language-typescript">&lt;Button mode="contained"&gt;Primary&lt;/Button&gt;          {/* solid filled */}
&lt;Button mode="contained-tonal"&gt;Secondary&lt;/Button&gt;  {/* tonal container */}
&lt;Button mode="outlined"&gt;Outlined&lt;/Button&gt;           {/* border only */}
&lt;Button mode="text"&gt;Tertiary&lt;/Button&gt;               {/* text only */}
&lt;Button mode="elevated"&gt;Elevated&lt;/Button&gt;           {/* lifted with shadow */}
</code></pre>

<h3>Snackbar (transient feedback)</h3>
<pre><code class="language-typescript">import { Snackbar } from 'react-native-paper';

const [visible, setVisible] = useState(false);

&lt;Snackbar
  visible={visible}
  onDismiss={() =&gt; setVisible(false)}
  duration={3000}
  action={{ label: 'Undo', onPress: onUndo }}
&gt;
  Message archived
&lt;/Snackbar&gt;
</code></pre>

<h3>Bottom sheet (gorhom)</h3>
<pre><code class="language-typescript">import BottomSheet from '@gorhom/bottom-sheet';

const sheetRef = useRef&lt;BottomSheet&gt;(null);

&lt;BottomSheet
  ref={sheetRef}
  snapPoints={['25%', '50%', '90%']}
  enablePanDownToClose
  onClose={() =&gt; setOpen(false)}
&gt;
  &lt;View style={styles.sheetContent}&gt;
    &lt;Text variant="titleLarge"&gt;Filters&lt;/Text&gt;
    {/* content */}
  &lt;/View&gt;
&lt;/BottomSheet&gt;
</code></pre>

<h3>Edge-to-edge</h3>
<pre><code class="language-typescript">import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

function ScreenRoot() {
  const insets = useSafeAreaInsets();
  return (
    &lt;View style={{ flex: 1, backgroundColor: theme.colors.background }}&gt;
      &lt;StatusBar style="auto" backgroundColor="transparent" translucent /&gt;
      &lt;Appbar.Header style={{ marginTop: insets.top }}&gt; ... &lt;/Appbar.Header&gt;
      &lt;ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}&gt;
        {/* content */}
      &lt;/ScrollView&gt;
      &lt;FAB style={{ position: 'absolute', right: 16, bottom: insets.bottom + 16 }} icon="plus" /&gt;
    &lt;/View&gt;
  );
}
</code></pre>

<p>For Expo, set in <code>app.json</code>:</p>
<pre><code class="language-json">{
  "expo": {
    "android": { "edgeToEdgeEnabled": true }
  }
}
</code></pre>

<h3>Predictive Back</h3>
<pre><code class="language-xml">&lt;!-- AndroidManifest.xml --&gt;
&lt;application
  android:enableOnBackInvokedCallback="true"
  ...
&gt;
</code></pre>
<p>React Navigation v7 integrates automatically; older versions may need manual <code>OnBackInvokedDispatcher</code> wiring via a custom native module.</p>

<h3>Material Symbols (icons)</h3>
<pre><code class="language-typescript">// MaterialCommunityIcons (most popular, ships with react-native-vector-icons)
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

&lt;Icon name="heart" color={theme.colors.primary} size={24} /&gt;
</code></pre>
<p>Or use the newer Material Symbols (ligature-style font) via <code>@expo/vector-icons</code> or a wrapper.</p>

<h3>Ripples (touch feedback)</h3>
<pre><code class="language-typescript">&lt;Pressable
  onPress={onPress}
  android_ripple={{
    color: 'rgba(0,0,0,0.12)', // theme.colors.onSurface with low opacity
    borderless: false,
  }}
&gt;
  &lt;Text&gt;Tap me&lt;/Text&gt;
&lt;/Pressable&gt;
</code></pre>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Material-feeling email inbox</h3>
<pre><code class="language-typescript">function InboxScreen() {
  const [items, setItems] = useState&lt;Email[]&gt;([]);
  const [snackbar, setSnackbar] = useState&lt;{ visible: boolean; msg: string }&gt;({ visible: false, msg: '' });

  return (
    &lt;View style={{ flex: 1, backgroundColor: theme.colors.background }}&gt;
      &lt;Appbar.Header&gt;
        &lt;Appbar.Content title="Inbox" /&gt;
        &lt;Appbar.Action icon="magnify" onPress={onSearch} /&gt;
        &lt;Appbar.Action icon="dots-vertical" onPress={openMenu} /&gt;
      &lt;/Appbar.Header&gt;

      &lt;FlatList
        data={items}
        renderItem={({ item }) =&gt; (
          &lt;Card style={{ marginHorizontal: 16, marginVertical: 4 }} onPress={() =&gt; openEmail(item)}&gt;
            &lt;Card.Title
              title={item.from}
              subtitle={item.subject}
              left={() =&gt; &lt;Avatar.Text label={item.from[0]} size={40} /&gt;}
            /&gt;
            &lt;Card.Content&gt;
              &lt;Text variant="bodyMedium" numberOfLines={2}&gt;{item.preview}&lt;/Text&gt;
            &lt;/Card.Content&gt;
          &lt;/Card&gt;
        )}
        keyExtractor={(it) =&gt; it.id}
      /&gt;

      &lt;FAB
        icon="pencil"
        style={{ position: 'absolute', right: 16, bottom: 16 }}
        onPress={onCompose}
        label="Compose"
        extended
      /&gt;

      &lt;Snackbar
        visible={snackbar.visible}
        onDismiss={() =&gt; setSnackbar((s) =&gt; ({ ...s, visible: false }))}
        action={{ label: 'Undo', onPress: onUndo }}
      &gt;
        {snackbar.msg}
      &lt;/Snackbar&gt;
    &lt;/View&gt;
  );
}
</code></pre>

<h3>Example 2: Settings with grouped lists</h3>
<pre><code class="language-typescript">import { List, Switch, Divider } from 'react-native-paper';

function SettingsScreen() {
  return (
    &lt;ScrollView&gt;
      &lt;List.Section title="Account"&gt;
        &lt;List.Item
          title="Profile"
          description="p@x.com"
          left={() =&gt; &lt;List.Icon icon="account" /&gt;}
          right={() =&gt; &lt;List.Icon icon="chevron-right" /&gt;}
          onPress={onProfile}
        /&gt;
      &lt;/List.Section&gt;

      &lt;Divider /&gt;

      &lt;List.Section title="Notifications"&gt;
        &lt;List.Item
          title="Push"
          right={() =&gt; &lt;Switch value={push} onValueChange={setPush} /&gt;}
        /&gt;
        &lt;List.Item
          title="Email"
          right={() =&gt; &lt;Switch value={email} onValueChange={setEmail} /&gt;}
        /&gt;
      &lt;/List.Section&gt;

      &lt;Divider /&gt;

      &lt;List.Item
        title="Sign out"
        titleStyle={{ color: theme.colors.error }}
        onPress={onSignOut}
      /&gt;
    &lt;/ScrollView&gt;
  );
}
</code></pre>

<h3>Example 3: Compose modal with validation</h3>
<pre><code class="language-typescript">import { Modal, Portal, TextInput, Button } from 'react-native-paper';

function ComposeModal({ visible, onDismiss, onSend }) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const isValid = to.includes('@') &amp;&amp; subject.length &gt; 0;

  return (
    &lt;Portal&gt;
      &lt;Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}&gt;
        &lt;Text variant="titleLarge"&gt;New message&lt;/Text&gt;
        &lt;TextInput label="To" value={to} onChangeText={setTo} mode="outlined" autoCapitalize="none" keyboardType="email-address" /&gt;
        &lt;TextInput label="Subject" value={subject} onChangeText={setSubject} mode="outlined" /&gt;
        &lt;TextInput label="Body" value={body} onChangeText={setBody} mode="outlined" multiline numberOfLines={6} /&gt;
        &lt;View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}&gt;
          &lt;Button onPress={onDismiss}&gt;Cancel&lt;/Button&gt;
          &lt;Button mode="contained" disabled={!isValid} onPress={() =&gt; onSend({ to, subject, body })}&gt;Send&lt;/Button&gt;
        &lt;/View&gt;
      &lt;/Modal&gt;
    &lt;/Portal&gt;
  );
}
</code></pre>

<h3>Example 4: Filter chips</h3>
<pre><code class="language-typescript">import { Chip } from 'react-native-paper';

function FilterRow({ active, onChange }) {
  const filters = ['All', 'Unread', 'Starred', 'Drafts', 'Sent'];
  return (
    &lt;ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 8, gap: 8 }}&gt;
      {filters.map((f) =&gt; (
        &lt;Chip
          key={f}
          selected={active === f}
          onPress={() =&gt; onChange(f)}
          showSelectedCheck
        &gt;
          {f}
        &lt;/Chip&gt;
      ))}
    &lt;/ScrollView&gt;
  );
}
</code></pre>

<h3>Example 5: Confirmation dialog</h3>
<pre><code class="language-typescript">import { Dialog, Portal, Button, Text } from 'react-native-paper';

function DeleteDialog({ visible, onConfirm, onCancel }) {
  return (
    &lt;Portal&gt;
      &lt;Dialog visible={visible} onDismiss={onCancel}&gt;
        &lt;Dialog.Title&gt;Delete this message?&lt;/Dialog.Title&gt;
        &lt;Dialog.Content&gt;
          &lt;Text variant="bodyMedium"&gt;This action cannot be undone.&lt;/Text&gt;
        &lt;/Dialog.Content&gt;
        &lt;Dialog.Actions&gt;
          &lt;Button onPress={onCancel}&gt;Cancel&lt;/Button&gt;
          &lt;Button onPress={onConfirm} textColor={theme.colors.error}&gt;Delete&lt;/Button&gt;
        &lt;/Dialog.Actions&gt;
      &lt;/Dialog&gt;
    &lt;/Portal&gt;
  );
}
</code></pre>

<h3>Example 6: Theming with Dynamic Color + brand fallback</h3>
<pre><code class="language-typescript">import { useMaterial3Theme } from '@pchmn/expo-material3-theme';
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

function makeTheme(colorScheme) {
  const { theme: m3 } = useMaterial3Theme({ fallbackSourceColor: '#0058A3' });
  const base = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      ...(colorScheme === 'dark' ? m3.dark : m3.light),
    },
  };
}
</code></pre>
<p>On Android 12+ this picks up the user's wallpaper-derived palette. Elsewhere it generates a 5-tone palette from the seed.</p>

<h3>Example 7: Adaptive layout (phone vs tablet)</h3>
<pre><code class="language-typescript">import { useWindowDimensions } from 'react-native';

function AdaptiveNav() {
  const { width } = useWindowDimensions();
  if (width &gt;= 840) return &lt;NavigationDrawer /&gt;;     // tablet
  if (width &gt;= 600) return &lt;NavigationRail /&gt;;        // foldable / small tablet
  return &lt;BottomNavigation /&gt;;                         // phone
}
</code></pre>

<h3>Example 8: Bottom sheet with snap points</h3>
<pre><code class="language-typescript">import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

function FilterSheet({ open, onClose }) {
  const ref = useRef&lt;BottomSheet&gt;(null);
  const snapPoints = useMemo(() =&gt; ['30%', '60%', '95%'], []);

  useEffect(() =&gt; {
    if (open) ref.current?.expand();
    else ref.current?.close();
  }, [open]);

  return (
    &lt;BottomSheet ref={ref} snapPoints={snapPoints} enablePanDownToClose onClose={onClose}&gt;
      &lt;BottomSheetView style={{ padding: 16 }}&gt;
        &lt;Text variant="titleLarge"&gt;Filters&lt;/Text&gt;
        {/* body */}
      &lt;/BottomSheetView&gt;
    &lt;/BottomSheet&gt;
  );
}
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>Edge-to-edge migration (Android 15+)</h3>
<ul>
  <li>Android 15 forces edge-to-edge by default for apps targeting SDK 35+. Status / nav bars become transparent overlays; your content draws behind them.</li>
  <li>Without inset handling, headers hide under status bar; FABs sit under nav bar.</li>
  <li>Solution: <code>useSafeAreaInsets</code> at the screen root; pad headers / floating elements explicitly.</li>
  <li>Test on a Pixel emulator running Android 15.</li>
</ul>

<h3>Status bar contrast</h3>
<ul>
  <li>Status bar text auto-adapts on Android 12+ via <code>setStatusBarTextColor</code>; pre-Android 12 needs manual handling.</li>
  <li>Light status-bar text on light background = invisible time/battery.</li>
  <li>RN: <code>&lt;StatusBar barStyle="dark-content" /&gt;</code> per screen.</li>
</ul>

<h3>Camera cutout / hole-punch</h3>
<ul>
  <li>Many Android phones have a punch-hole or notch.</li>
  <li><code>android:windowLayoutInDisplayCutoutMode</code> defaults to LAYOUT_IN_DISPLAY_CUTOUT_MODE_DEFAULT; safe-area handles it.</li>
  <li>Test on devices with cutouts (Pixel 6 has a centered hole, Samsung Galaxy has off-center).</li>
</ul>

<h3>Predictive Back gotchas</h3>
<ul>
  <li>Opt-in via manifest; old <code>onBackPressed</code> overrides break Predictive Back.</li>
  <li>If using a custom modal that listens to back button, integrate via <code>OnBackInvokedDispatcher</code> not <code>BackHandler.addEventListener</code>.</li>
  <li>RN's <code>BackHandler</code> still works but doesn't animate the Predictive Back preview.</li>
  <li>Test by enabling "Predictive back animations" in developer options.</li>
</ul>

<h3>Dark mode oddities</h3>
<ul>
  <li>Tonal elevation uses primary tint at higher levels — if your primary is a vibrant red, cards in dark mode look pinkish.</li>
  <li>Text on tonal-elevated surface needs <code>onSurface</code>, not generic white.</li>
  <li>Shadows are essentially invisible in dark; rely on tone shift.</li>
</ul>

<h3>Dynamic Color limitations</h3>
<ul>
  <li>Dynamic Color requires Android 12+ (~75% of active devices in 2026).</li>
  <li>Fallback: generate palette from seed color (Material color utilities or <code>@pchmn/expo-material3-theme</code>).</li>
  <li>Some users disable wallpaper-derived themes — respect their setting.</li>
  <li>Brand purists may want to opt out entirely; provide a setting.</li>
</ul>

<h3>OEM customizations</h3>
<ul>
  <li>Samsung One UI, Xiaomi MIUI, OPPO ColorOS each tweak the system look.</li>
  <li>Material components render correctly but system context (notification shade, settings) may look different.</li>
  <li>Battery optimization on some OEMs aggressively kills background work; not strictly UX but affects user perception.</li>
  <li>Test on at least Samsung + Pixel + one Chinese OEM.</li>
</ul>

<h3>Foldable / large-screen layout</h3>
<ul>
  <li>Galaxy Fold, Pixel Fold: app must respond to <code>onConfigurationChanged</code>.</li>
  <li>Don't lock to portrait — let the system handle orientation.</li>
  <li>Use navigation rail (instead of bottom nav) at width ≥ 600dp.</li>
  <li>Use list-detail (split-view) at width ≥ 840dp.</li>
  <li>Test by enabling "Force tablet layout" in developer options.</li>
</ul>

<h3>Touch slop / gesture conflicts</h3>
<ul>
  <li>Edge gestures: system back gesture (left + right edges, ~24dp deep). Don't put scrollable content there without exclusion zones.</li>
  <li><code>setSystemGestureExclusionRects</code> via <code>react-native-edge-to-edge</code> or a custom native module.</li>
  <li>Bottom 28dp area is reserved for system gesture indicator.</li>
</ul>

<h3>Snackbar placement</h3>
<ul>
  <li>Snackbar should not cover FAB or bottom nav. Material expects FAB to lift above the snackbar.</li>
  <li>react-native-paper's Snackbar pins to bottom by default; lifts FAB if you wire it manually.</li>
  <li>Don't use Snackbar for critical info — it auto-dismisses.</li>
</ul>

<h3>Keyboard behavior</h3>
<ul>
  <li>Android keyboard pushes content up by default (<code>android:windowSoftInputMode="adjustResize"</code>).</li>
  <li>RN: <code>KeyboardAvoidingView behavior="height"</code> on Android — different from iOS.</li>
  <li>Edge-to-edge: keyboard insets need handling via <code>react-native-keyboard-controller</code> or similar.</li>
</ul>

<h3>RTL</h3>
<ul>
  <li>Arabic / Hebrew users get full RTL layout. Material handles it well; chevrons mirror, drawers slide from the right.</li>
  <li>Test: <code>Settings → System → Languages → Add Arabic → make primary</code>; restart app.</li>
  <li>Use <code>I18nManager.isRTL</code> in RN; mirror back-arrows and swipe directions.</li>
</ul>

<h3>Accessibility settings users may have on</h3>
<ul>
  <li>TalkBack: screen reader; test once per release.</li>
  <li>Font size scaling: up to 200%; layouts must reflow.</li>
  <li>Display size scaling: scales whole UI; test at largest.</li>
  <li>High-contrast text: thicker strokes; ensure your colors stay legible.</li>
  <li>Reduce animation: respect via <code>AccessibilityInfo.isReduceMotionEnabled</code>.</li>
</ul>

<h3>Play Store review</h3>
<ul>
  <li>Less strict than App Store but still has design / functionality requirements.</li>
  <li>"App targets old API level" rejections — keep target SDK up-to-date (currently 35+).</li>
  <li>Permission misuse rejections — declare and use; don't request what you don't need.</li>
  <li>Notification permission (Android 13+): must be requested at runtime.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common Material violations in RN apps</h3>
<ol>
  <li><strong>iOS-style nav bar with chevron back.</strong> Use Material top app bar with arrow icon.</li>
  <li><strong>No FAB when there's a primary action.</strong> Material expects it for "create new" / "compose" patterns.</li>
  <li><strong>Tab bar styled like iOS</strong> (no labels, wrong active indicator). Material bottom nav has labels and a pill-shaped active indicator.</li>
  <li><strong>Opacity press feedback instead of ripple.</strong> Use <code>android_ripple</code> on Pressable.</li>
  <li><strong>Hard-coded brand color, no Dynamic Color.</strong> Set fallback seed; honor system palette.</li>
  <li><strong>Status bar opaque + colored.</strong> Modern Android wants translucent + content underneath.</li>
  <li><strong>Hamburger drawer for 3 destinations.</strong> Use bottom nav.</li>
  <li><strong>Custom alert dialog instead of Material Dialog.</strong> Looks off; users notice.</li>
  <li><strong>Toast-style transient messages.</strong> Use Snackbar (Material primitive).</li>
  <li><strong>Bottom sheet that doesn't swipe-down to close.</strong> Users hunt for X.</li>
  <li><strong>Touch targets &lt; 48dp.</strong> Misses fingers.</li>
  <li><strong>Predictive Back not enabled in manifest.</strong> Misses the smoother UX since Android 13.</li>
</ol>

<h3>Anti-pattern: cross-platform nav bar</h3>
<pre><code class="language-typescript">// BAD — iOS-feeling chevron + centered title on Android
&lt;Header&gt;
  &lt;BackButton icon="chevron-left" /&gt;
  &lt;Title style={{ textAlign: 'center' }}&gt;Inbox&lt;/Title&gt;
&lt;/Header&gt;

// GOOD — Material-feeling left-aligned title with arrow back
&lt;Appbar.Header&gt;
  &lt;Appbar.BackAction onPress={onBack} /&gt;
  &lt;Appbar.Content title="Inbox" /&gt;
&lt;/Appbar.Header&gt;
</code></pre>

<h3>Anti-pattern: hard-coded brand colors</h3>
<pre><code class="language-typescript">// BAD
&lt;Button style={{ backgroundColor: '#0058A3' }}&gt;Save&lt;/Button&gt;

// GOOD — uses theme.colors.primary; respects dark mode and Dynamic Color
&lt;Button mode="contained" onPress={onSave}&gt;Save&lt;/Button&gt;
</code></pre>

<h3>Anti-pattern: Snackbar with critical info</h3>
<pre><code class="language-typescript">// BAD — auto-dismisses; user may miss "your data was deleted"
&lt;Snackbar visible duration={3000}&gt;Account permanently deleted.&lt;/Snackbar&gt;

// GOOD — use Dialog for critical confirmations
&lt;Dialog visible&gt;
  &lt;Dialog.Title&gt;Account permanently deleted&lt;/Dialog.Title&gt;
  &lt;Dialog.Content&gt;&lt;Text&gt;You can recover within 30 days.&lt;/Text&gt;&lt;/Dialog.Content&gt;
  &lt;Dialog.Actions&gt;&lt;Button&gt;OK&lt;/Button&gt;&lt;/Dialog.Actions&gt;
&lt;/Dialog&gt;
</code></pre>

<h3>Anti-pattern: blocking system back gesture</h3>
<pre><code class="language-typescript">// BAD — eats the back press; users feel trapped
useEffect(() =&gt; {
  const handler = BackHandler.addEventListener('hardwareBackPress', () =&gt; true);
  return () =&gt; handler.remove();
}, []);

// GOOD — only catch back when there's unsaved work; show confirmation
useEffect(() =&gt; {
  const handler = BackHandler.addEventListener('hardwareBackPress', () =&gt; {
    if (hasUnsaved) {
      Alert.alert('Discard changes?', '', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', onPress: () =&gt; navigation.goBack() },
      ]);
      return true;
    }
    return false; // allow default back
  });
  return () =&gt; handler.remove();
}, [hasUnsaved]);
</code></pre>

<h3>Anti-pattern: rasterized Material icons</h3>
<p>Designer exports Material Symbols as 24×24 PNG. Loses font scaling, dark-mode color, and looks blurry on high-DPI. Use vector font (<code>react-native-vector-icons/MaterialCommunityIcons</code>) or Material Symbols ligature font.</p>

<h3>Anti-pattern: FAB on every screen</h3>
<p>FAB is for the <em>primary screen action</em>. A settings screen has no primary action; an inbox does (compose). Putting a FAB everywhere dilutes its meaning.</p>

<h3>Anti-pattern: drawer + bottom nav</h3>
<p>Both at once = confusion about top-level destinations. Pick one based on count: ≤5 → bottom nav; 5+ → drawer (or grouped bottom nav).</p>

<h3>Anti-pattern: custom modal that doesn't swipe-down</h3>
<p>Bottom sheet is the Material modal; users expect <code>panDownToClose</code>. Without it, they tap outside or hunt for X.</p>

<h3>Anti-pattern: wrong elevation tone</h3>
<p>Card with <code>elevation={1}</code> in Paper applies +5% primary tint. If your primary is yellow, cards get a yellow cast; that's wrong if the design intends pure neutrality. Use <code>surfaceVariant</code> or override.</p>

<h3>Anti-pattern: M2 visuals in 2026</h3>
<p>Old <code>react-native-paper</code> v4 was M2 (different shapes, deeper shadows, bolder bottom nav). Migrate to v5 for M3.</p>

<h3>Anti-pattern: ignoring Material Symbols vs Material Icons</h3>
<p>Material Symbols (newer) supports 5 styles (outlined, rounded, sharp, two-tone, filled) and weight axes. Material Icons is the older static set. M3 prefers Symbols. Don't mix in the same screen.</p>

<h3>Anti-pattern: skipping ripple bounds</h3>
<pre><code class="language-typescript">// BAD — borderless ripple bleeds beyond the button
&lt;Pressable android_ripple={{ borderless: true }} style={styles.btn}&gt;...&lt;/Pressable&gt;

// GOOD — bounded ripple inside the button rect
&lt;Pressable android_ripple={{ color: 'rgba(0,0,0,0.12)', borderless: false }} style={styles.btn}&gt;...&lt;/Pressable&gt;
</code></pre>
<p>Borderless is for icon-only buttons where the ripple is round and breathy; not for chunky rectangular buttons.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common Material / Android-design interview prompts</h3>
<ol>
  <li>How do you make a React Native app feel native on Android?</li>
  <li>Walk me through Dynamic Color (Material You) and how you'd integrate it.</li>
  <li>Compare iOS HIG navigation patterns vs Material 3.</li>
  <li>How do you handle edge-to-edge layouts on Android 15?</li>
  <li>What's tonal elevation and why does it matter in dark mode?</li>
  <li>How do you support Predictive Back?</li>
  <li>How do you decide bottom nav vs drawer vs nav rail?</li>
  <li>Tell me about a time you fixed a Material design issue.</li>
</ol>

<h3>The 5-step framework</h3>
<ol>
  <li><strong>Identify the pattern:</strong> bottom nav / drawer / nav rail; FAB or no; top app bar variant.</li>
  <li><strong>Lean on Material primitives:</strong> react-native-paper components for everything composite.</li>
  <li><strong>Theme via M3 tokens:</strong> Dynamic Color where supported; brand fallback; tonal elevation in dark mode.</li>
  <li><strong>Honor system bars + back:</strong> edge-to-edge, status / nav bar insets, Predictive Back manifest opt-in.</li>
  <li><strong>Test the matrix:</strong> dark mode, Dynamic Color on/off, font scale 200%, TalkBack, foldable layout, Android 12 / 14 / 15.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"react-native-paper for the M3-compliant components — Snackbar, FAB, Card, Appbar, Dialog. Building those from scratch is weeks of native work."</em></li>
  <li><em>"@pchmn/expo-material3-theme reads the wallpaper palette on Android 12+; falls back to a generated palette from a seed elsewhere."</em></li>
  <li><em>"Tonal elevation over shadow in M3 — surfaces shift toward primary as they lift; works in dark mode where shadows would be invisible."</em></li>
  <li><em>"Material bottom nav with labels + pill-shaped active indicator; not the iOS-style icon-only bar."</em></li>
  <li><em>"FAB only on screens with a clear primary action; Extended FAB with label for emphasis."</em></li>
  <li><em>"Snackbar for transient feedback; Dialog for critical interruption; Bottom sheet for transient task."</em></li>
  <li><em>"Edge-to-edge with safe-area insets — content draws under translucent system bars; FAB and headers padded explicitly."</em></li>
  <li><em>"Predictive Back: enable in manifest, use react-navigation v7+; system gesture animates the preview automatically."</em></li>
  <li><em>"Adaptive layout: bottom nav at &lt; 600dp, navigation rail 600–840dp, drawer 840dp+."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"native Android feel"</td><td>react-native-paper + Dynamic Color + Predictive Back</td></tr>
    <tr><td>"top-level navigation"</td><td>Bottom nav (3–5 dest); rail / drawer at larger widths</td></tr>
    <tr><td>"primary action"</td><td>FAB or Extended FAB</td></tr>
    <tr><td>"transient feedback"</td><td>Snackbar with optional action</td></tr>
    <tr><td>"transient task"</td><td>Bottom sheet (gorhom)</td></tr>
    <tr><td>"critical confirmation"</td><td>Dialog</td></tr>
    <tr><td>"theming"</td><td>MD3LightTheme + MD3DarkTheme + Dynamic Color overrides</td></tr>
    <tr><td>"edge-to-edge"</td><td>safe-area insets + translucent system bars</td></tr>
    <tr><td>"icons"</td><td>Material Symbols / Material Community Icons</td></tr>
    <tr><td>"foldable"</td><td>Adaptive nav (rail vs bottom vs drawer) by width breakpoints</td></tr>
  </tbody>
</table>

<h3>Demo script</h3>
<ol>
  <li>Walk through a screen mockup; identify Material pattern (top app bar variant, body shape, FAB?).</li>
  <li>Sketch the safe-area + edge-to-edge layout.</li>
  <li>Replace iOS-style components with Paper equivalents.</li>
  <li>Wire Dynamic Color or generated palette.</li>
  <li>Add ripple feedback + Material motion easing.</li>
  <li>Confirm Predictive Back enabled in manifest.</li>
  <li>Test matrix: light / dark / Dynamic / 200% font / TalkBack / foldable.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"Adaptive layouts for foldables (Galaxy Fold, Pixel Fold) using width breakpoints + nav rail."</em></li>
  <li><em>"Material You wallpaper palette via @pchmn/expo-material3-theme; user toggle for brand vs system."</em></li>
  <li><em>"Predictive Back integration via OnBackInvokedCallback for custom modals."</em></li>
  <li><em>"App widgets via android Glance + Expo modules."</em></li>
  <li><em>"Quick Settings tile via native module for power users."</em></li>
  <li><em>"Material Symbols ligature font with weight + grade axes for fluid icon transitions."</em></li>
  <li><em>"High-contrast variant of theme for accessibility users."</em></li>
  <li><em>"Snapshot tests at 200% font + dark mode in Storybook."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Material fluency</td><td>Names M3 patterns by Google's terms (FAB, top app bar, bottom sheet)</td></tr>
    <tr><td>System primitive instinct</td><td>Reaches for Snackbar, Dialog, FAB rather than custom</td></tr>
    <tr><td>Dynamic Color awareness</td><td>Names Material You + fallback palette strategy</td></tr>
    <tr><td>Edge-to-edge handling</td><td>Insets, translucent bars, FAB padding</td></tr>
    <tr><td>Tonal elevation understanding</td><td>Color shift over shadow in dark mode</td></tr>
    <tr><td>Cross-platform discipline</td><td>Platform-specific nav primitives; not "one component for both"</td></tr>
    <tr><td>Predictive Back awareness</td><td>Knows manifest opt-in; doesn't block back</td></tr>
    <tr><td>Adaptive layout</td><td>Knows breakpoints for nav variant</td></tr>
    <tr><td>Accessibility default</td><td>Font scaling, TalkBack, high-contrast</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>react-native-paper is the standard M3 component library. Compatibility across RN 0.72+; Expo SDK 50+.</li>
  <li>Bare RN can do this too; Expo gives Dynamic Color + edge-to-edge + status bar utilities out of the box.</li>
  <li>Cross-platform: Material on Android, HIG on iOS — Platform.select for top-level primitives, share business logic.</li>
  <li>Test on Pixel + Samsung at minimum; ideally one Chinese OEM (Xiaomi / OPPO).</li>
  <li>Test on Android 12 (lowest with Dynamic Color), Android 14 (Predictive Back), Android 15 (edge-to-edge default).</li>
  <li>Foldables matter for premium product demos — even if user count is small, reviewers use them.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"How does Dynamic Color work?"</em> — Android 12+ extracts a 5-tone palette from the user's wallpaper via the Monet algorithm; system apps consume it via <code>colorPrimary</code>, <code>colorSecondary</code>, etc. Apps opt in by reading those system colors.</li>
  <li><em>"Why use tonal elevation instead of shadows?"</em> — Shadows are imperceptible in dark mode; tonal shift gives depth signal at any luminance.</li>
  <li><em>"How do you handle edge-to-edge on Android 15?"</em> — Apps targeting SDK 35+ get edge-to-edge by default; use <code>useSafeAreaInsets</code>; pad floating elements; status / nav bars are translucent overlays.</li>
  <li><em>"Why prefer bottom nav over drawer?"</em> — Bottom nav puts top-level destinations always-visible; drawer requires a tap to discover; bottom nav has higher engagement rates per Google's own studies.</li>
  <li><em>"How do you ship Material on iOS?"</em> — Don't. Use Material on Android; HIG on iOS. Cross-platform components flatten both apps' identity.</li>
  <li><em>"What's wrong with using a custom dialog?"</em> — Loses TalkBack accessibility, system rendering, look-and-feel users trust. Use Material Dialog.</li>
  <li><em>"How do you support foldables?"</em> — useWindowDimensions; switch nav primitive at width breakpoints; test split-screen in two-pane layout.</li>
  <li><em>"How does Predictive Back work?"</em> — Android 13+ system gesture API; system animates a preview of the destination as the user drags; opt in via manifest; integrate via OnBackInvokedDispatcher (rather than legacy onBackPressed).</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Read 3 M3 sections: Color, Components, Navigation.</li>
  <li>Build one RN screen end-to-end with react-native-paper: top app bar, bottom nav, FAB, Dialog, Snackbar, theme with Dynamic Color.</li>
  <li>Test on Pixel emulator at: light, dark, Dynamic Color on, 200% font, TalkBack on, Predictive Back on.</li>
  <li>Audit a real RN app — find 5 Material violations.</li>
  <li>Memorise the navigation breakpoints + tap target + grid.</li>
  <li>Practice the cross-platform tradeoff explanation.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Watch Google I/O sessions on Material 3 (yearly; latest is always relevant)."</li>
  <li>"Read the M3 web docs end to end — generously illustrated."</li>
  <li>"Reverse-engineer Google apps (Gmail, Photos) — note every micro-interaction."</li>
  <li>"Build a clone of one Google app's screen in RN with Paper; aim for indistinguishable."</li>
  <li>"Study the Material color utilities source to understand tone palette generation."</li>
</ul>
`
    }
  ]
});
