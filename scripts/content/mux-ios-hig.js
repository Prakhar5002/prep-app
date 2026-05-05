window.PREP_SITE.registerTopic({
  id: 'mux-ios-hig',
  module: 'mobile-ux',
  title: 'iOS Human Interface Guidelines',
  estimatedReadTime: '45 min',
  tags: ['ios', 'hig', 'human-interface-guidelines', 'sf-symbols', 'safe-area', 'dynamic-type', 'haptics', 'navigation', 'tab-bar', 'react-native'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>Apple's <strong>Human Interface Guidelines (HIG)</strong> are the design contract iOS users implicitly expect. Following them isn't aesthetic preference — it's how your app feels "native" rather than "an Android port" and is a <em>reviewable signal</em> in App Store rejections. For a React Native engineer, the HIG is what closes the gap between "it runs on iOS" and "it feels like an iOS app."</p>
<ul>
  <li><strong>Three pillars:</strong> Clarity (legible, focused, beautiful), Deference (UI helps users understand content, doesn't compete), Depth (visual layers + motion convey hierarchy).</li>
  <li><strong>Navigation patterns:</strong> tab bar (5 tabs max), navigation stack with back-swipe, modal presentation for self-contained tasks, sheets for inspector-style.</li>
  <li><strong>System primitives to lean on:</strong> SF Symbols (5,000+ icons matching system weight + scale), Dynamic Type (text scales with user setting), system colours (auto dark mode), haptics (UIImpactFeedbackGenerator).</li>
  <li><strong>Layout fundamentals:</strong> Safe Area for notch / Dynamic Island / home indicator; 44×44pt minimum tap target; 8pt grid; status bar awareness.</li>
  <li><strong>Native feel checklist:</strong> back-swipe gesture works; swipe-to-dismiss modals; pull-to-refresh; large titles on top-level views; context menus on long-press.</li>
  <li><strong>RN gotchas:</strong> swap default <code>Touchable*</code> for <code>Pressable</code>; use <code>useSafeAreaInsets</code> from <code>react-native-safe-area-context</code>; don't fight the system Status Bar; use native modal stacks (react-navigation native-stack).</li>
  <li><strong>Review reality:</strong> Apple does reject for "doesn't feel native" (Guideline 4.0 Design); the HIG is the appeal document.</li>
</ul>
<p><strong>Mantra:</strong> "Use system primitives. Respect safe area. Honor Dynamic Type. Don't reinvent the navigation patterns users already know."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What the HIG actually is</h3>
<p>A ~600-page living document at <code>developer.apple.com/design/human-interface-guidelines</code> covering every UI pattern, component, gesture, and interaction Apple ships across iPhone, iPad, Mac, watchOS, tvOS, visionOS. It's <em>opinionated</em>: each section gives "do this" and "don't do that" examples with exact spacing, sizes, and behaviour.</p>

<h3>Why following the HIG matters</h3>
<table>
  <thead><tr><th>Reason</th><th>What you get</th></tr></thead>
  <tbody>
    <tr><td>User muscle memory</td><td>Back-swipe, pull-to-refresh, long-press for context — users do these without thinking. Break them and they think your app is broken.</td></tr>
    <tr><td>Accessibility for free</td><td>System primitives ship with VoiceOver labels, Dynamic Type support, Reduce Motion respect.</td></tr>
    <tr><td>Dark mode automatic</td><td>System colors flip; custom hex colors don't.</td></tr>
    <tr><td>App Store approval</td><td>Guideline 4.0 (Design) rejections cite "doesn't feel native"; following HIG is your evidence.</td></tr>
    <tr><td>Credibility</td><td>Apps that look "designed by people who don't use iPhones" lose 1-star reviews fast.</td></tr>
    <tr><td>Future-proof</td><td>iOS 17 → 18 → 19 visual changes flow through system components automatically.</td></tr>
  </tbody>
</table>

<h3>Why React Native makes this harder</h3>
<ul>
  <li>RN's defaults (<code>TouchableOpacity</code>, <code>Modal</code>, manual stack navigators) skew Android — they predate the modern iOS feel.</li>
  <li>Cross-platform design temptation: one set of components for both. Looks like neither's native.</li>
  <li>RN doesn't auto-generate SF Symbols; you need <code>react-native-sf-symbols</code> or a similar lib.</li>
  <li>Safe area, status bar, status of various edges have to be handled by hand.</li>
  <li>Dynamic Type isn't on by default — text uses a fixed size unless you opt in.</li>
</ul>

<h3>The three HIG pillars (Apple's framing)</h3>
<table>
  <thead><tr><th>Pillar</th><th>Means</th><th>Practical</th></tr></thead>
  <tbody>
    <tr><td>Clarity</td><td>Text legible, icons precise, layouts intentional</td><td>Use SF Pro / system fonts; SF Symbols; generous whitespace</td></tr>
    <tr><td>Deference</td><td>UI helps content shine; doesn't compete</td><td>Translucent bars, blur backgrounds, subtle separators</td></tr>
    <tr><td>Depth</td><td>Visual layers + motion give meaning</td><td>Cards float above background; modals slide up; large title shrinks on scroll</td></tr>
  </tbody>
</table>

<h3>What "good iOS RN" looks like</h3>
<ul>
  <li>Safe area honored; nothing under the notch / Dynamic Island / home indicator.</li>
  <li>Native back-swipe works on every screen.</li>
  <li>Tab bar with 3–5 items at the bottom; large titles on top-level screens.</li>
  <li>Swipe-down dismisses modals; sheets snap to detents.</li>
  <li>Pull-to-refresh on any list that updates.</li>
  <li>Context menus (long press → preview + actions) on rich items.</li>
  <li>Haptic on confirmations / errors; never gratuitous.</li>
  <li>Dark mode flips with system; SF Symbols stay crisp at any size.</li>
  <li>Dynamic Type scales — large-accessibility text doesn't break the layout.</li>
  <li>System share sheet for sharing, system alerts for confirmations, system action sheets for choices.</li>
</ul>

<h3>What "bad iOS RN" looks like</h3>
<ul>
  <li>Material Design hamburger menu on every screen.</li>
  <li>Custom back button in the top-left, no back-swipe.</li>
  <li>Hard-coded white background that stays white in dark mode.</li>
  <li>Fixed-size text, ignoring Dynamic Type.</li>
  <li>Custom modals that don't swipe-down.</li>
  <li>Tap targets smaller than 44pt.</li>
  <li>Toast notifications drifting in from the side (Android pattern; iOS uses banners).</li>
  <li>FAB (floating action button) on a list — that's Material, not HIG.</li>
  <li>Status bar text invisible because background is light.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The three navigation patterns iOS uses</h3>
<table>
  <thead><tr><th>Pattern</th><th>Use for</th><th>RN equivalent</th></tr></thead>
  <tbody>
    <tr><td>Tab bar</td><td>Top-level destinations (3–5)</td><td><code>@react-navigation/bottom-tabs</code> with system iOS look</td></tr>
    <tr><td>Navigation stack</td><td>Drill-down hierarchies (list → detail → sub-detail)</td><td><code>@react-navigation/native-stack</code> (uses native UIKit nav)</td></tr>
    <tr><td>Modal / Sheet</td><td>Self-contained task; halt the user's flow</td><td>Native stack with <code>presentation: 'modal' | 'formSheet' | 'pageSheet'</code></td></tr>
  </tbody>
</table>

<h3>Sheets and detents (iOS 16+)</h3>
<p>Sheets that "snap" to medium / large heights — quick previews without losing context. Native-stack supports them via:</p>
<pre><code class="language-typescript">&lt;Stack.Screen name="Filter" component={FilterScreen} options={{
  presentation: 'formSheet',
  sheetAllowedDetents: ['medium', 'large'],
  sheetGrabberVisible: true,
  sheetCornerRadius: 24,
}} /&gt;
</code></pre>

<h3>Layout grid + safe areas</h3>
<table>
  <thead><tr><th>Concern</th><th>Value</th></tr></thead>
  <tbody>
    <tr><td>Base grid</td><td>8pt; padding / margins in multiples of 4 or 8</td></tr>
    <tr><td>Standard horizontal margin</td><td>16pt edge inset on phones</td></tr>
    <tr><td>Tap target minimum</td><td>44 × 44pt</td></tr>
    <tr><td>Status bar height (iPhone with notch)</td><td>Variable; never hard-code — use <code>useSafeAreaInsets</code></td></tr>
    <tr><td>Tab bar height</td><td>49pt + bottom safe-area inset</td></tr>
    <tr><td>Nav bar height</td><td>44pt collapsed, 96pt with large title</td></tr>
    <tr><td>Bottom safe-area (home indicator)</td><td>~34pt on Face ID phones</td></tr>
  </tbody>
</table>

<h3>SF Symbols</h3>
<p>5,000+ system icons that automatically match font weight, size, and Dynamic Type. Three weights (Light/Regular/Bold), three scales (Small/Medium/Large), nine font weights. Critical: they look <em>right</em>; custom-drawn icons usually don't.</p>
<p>RN access via:</p>
<ul>
  <li><code>react-native-sfsymbols</code> — native bridge to UIKit's SF Symbols.</li>
  <li><code>expo-symbols</code> — Expo's wrapper, easier setup.</li>
  <li>Do <em>not</em> rasterize SF Symbols into PNGs and ship them — you lose Dynamic Type sizing + dark-mode color adaptation.</li>
</ul>

<h3>System colors (semantic, dark-mode aware)</h3>
<table>
  <thead><tr><th>Token</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td><code>label</code> / <code>secondaryLabel</code> / <code>tertiaryLabel</code></td><td>Body text, captions, disabled text</td></tr>
    <tr><td><code>systemBackground</code> / <code>secondarySystemBackground</code></td><td>Page background; grouped lists' background</td></tr>
    <tr><td><code>systemFill</code> / <code>secondarySystemFill</code></td><td>Filled controls, hover states</td></tr>
    <tr><td><code>separator</code> / <code>opaqueSeparator</code></td><td>Hairlines between items</td></tr>
    <tr><td><code>systemBlue</code>, <code>systemGreen</code>, <code>systemRed</code>, ...</td><td>Tints; flip in dark mode</td></tr>
    <tr><td><code>tintColor</code></td><td>App accent; default <code>systemBlue</code></td></tr>
  </tbody>
</table>
<p>Hard-coded hexes (<code>#000</code>, <code>#fff</code>, <code>#ff3b30</code>) don't flip. Use semantic colors via your design system — RN libraries like <code>react-native-ios-utilities</code> expose them; Expo gives a <code>useColorScheme</code> hook.</p>

<h3>Typography ladder (SF Pro + Dynamic Type)</h3>
<table>
  <thead><tr><th>Style</th><th>Default size</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td>Large Title</td><td>34pt bold</td><td>Top-level screen heading</td></tr>
    <tr><td>Title 1</td><td>28pt</td><td>Major section</td></tr>
    <tr><td>Title 2</td><td>22pt</td><td>Sub-section</td></tr>
    <tr><td>Title 3</td><td>20pt</td><td>Card heading</td></tr>
    <tr><td>Headline</td><td>17pt semibold</td><td>List item title</td></tr>
    <tr><td>Body</td><td>17pt regular</td><td>Default body text</td></tr>
    <tr><td>Callout</td><td>16pt</td><td>Inline emphasis</td></tr>
    <tr><td>Subhead</td><td>15pt</td><td>Sub-text</td></tr>
    <tr><td>Footnote</td><td>13pt</td><td>Small label</td></tr>
    <tr><td>Caption 1 / 2</td><td>12 / 11pt</td><td>Tiny meta</td></tr>
  </tbody>
</table>
<p>Each style scales with Dynamic Type. RN: pass <code>allowFontScaling</code> (default true) and use <code>Platform.select</code> for SF Pro fallback to system font.</p>

<h3>Haptics</h3>
<table>
  <thead><tr><th>Type</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td>Light impact</td><td>Selection change, toggle</td></tr>
    <tr><td>Medium impact</td><td>Confirmation tap, success</td></tr>
    <tr><td>Heavy impact</td><td>Drop / commit / lock-in</td></tr>
    <tr><td>Selection (UISelectionFeedbackGenerator)</td><td>Picker scroll, segmented control</td></tr>
    <tr><td>Notification (success / warning / error)</td><td>End-of-action feedback (saved, error)</td></tr>
  </tbody>
</table>
<p>RN: <code>react-native-haptic-feedback</code> or <code>expo-haptics</code>. Rule: meaningful only. Haptics on every tap = annoying.</p>

<h3>Gestures users expect</h3>
<table>
  <thead><tr><th>Gesture</th><th>Default behaviour</th></tr></thead>
  <tbody>
    <tr><td>Edge swipe right (from left edge)</td><td>Go back in nav stack</td></tr>
    <tr><td>Pull down at top of list</td><td>Refresh</td></tr>
    <tr><td>Swipe down on modal</td><td>Dismiss</td></tr>
    <tr><td>Long press</td><td>Context menu / preview</td></tr>
    <tr><td>Swipe left on row</td><td>Reveal actions (Mail, Messages style)</td></tr>
    <tr><td>Tap status bar</td><td>Scroll to top</td></tr>
    <tr><td>Two-finger pan</td><td>System gesture for selection / zoom — don't override</td></tr>
  </tbody>
</table>

<h3>Status bar awareness</h3>
<ul>
  <li>iOS uses light-content (white text) on dark backgrounds, dark-content on light.</li>
  <li>RN: <code>&lt;StatusBar barStyle="dark-content" /&gt;</code> per screen.</li>
  <li>Set via React Navigation <code>screenOptions</code> for whole-stack consistency.</li>
  <li>Don't disable the status bar without a strong reason (full-screen video, camera).</li>
</ul>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Setting up native-stack with iOS niceties</h3>
<pre><code class="language-typescript">import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

function App() {
  return (
    &lt;Stack.Navigator
      screenOptions={{
        headerLargeTitle: true,
        headerLargeTitleShadowVisible: false,
        headerTransparent: false,
        headerTintColor: '#007aff',
      }}
    &gt;
      &lt;Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Inbox' }} /&gt;
      &lt;Stack.Screen name="Detail" component={DetailScreen} /&gt;
      &lt;Stack.Screen
        name="Compose"
        component={ComposeScreen}
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: ['medium', 'large'],
          sheetGrabberVisible: true,
        }}
      /&gt;
    &lt;/Stack.Navigator&gt;
  );
}
</code></pre>

<h3>Safe-area handling</h3>
<pre><code class="language-typescript">import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

function Root() {
  return (
    &lt;SafeAreaProvider&gt;
      &lt;NavigationContainer&gt; ... &lt;/NavigationContainer&gt;
    &lt;/SafeAreaProvider&gt;
  );
}

function ScreenWithFloatingButton() {
  const insets = useSafeAreaInsets();
  return (
    &lt;View style={{ flex: 1 }}&gt;
      &lt;ScrollView&gt; ... &lt;/ScrollView&gt;
      &lt;Pressable
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
      /&gt;
    &lt;/View&gt;
  );
}
</code></pre>
<p>Use insets directly; don't wrap everything in <code>&lt;SafeAreaView&gt;</code> — it adds hard padding that fights with native nav bars.</p>

<h3>Tab bar (iOS-styled)</h3>
<pre><code class="language-typescript">import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SymbolView } from 'expo-symbols';

const Tabs = createBottomTabNavigator();

function MainTabs() {
  return (
    &lt;Tabs.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007aff',
        tabBarStyle: { borderTopWidth: 0 }, // iOS uses translucent material instead
      }}
    &gt;
      &lt;Tabs.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) =&gt; (
            &lt;SymbolView name="house.fill" tintColor={color} size={size} /&gt;
          ),
        }}
      /&gt;
      {/* ... 2–4 more tabs */}
    &lt;/Tabs.Navigator&gt;
  );
}
</code></pre>

<h3>SF Symbols in RN</h3>
<pre><code class="language-typescript">import { SymbolView } from 'expo-symbols'; // Expo
// or:
import { SFSymbol } from 'react-native-sfsymbols'; // bare RN

&lt;SymbolView
  name="heart.fill"
  weight="medium"
  scale="large"
  tintColor="#ff3b30"
  size={28}
/&gt;
</code></pre>
<p>Render only on iOS — gracefully fall back to a different icon system on Android (<code>Platform.OS === 'ios' ? &lt;SymbolView /&gt; : &lt;Icon /&gt;</code>).</p>

<h3>Dynamic Type</h3>
<p>Text should use named Apple text styles, not raw point sizes:</p>
<pre><code class="language-typescript">import { Text, Platform } from 'react-native';

const styles = {
  body: Platform.select({
    ios: { fontFamily: 'System', fontSize: 17 },
    android: { fontFamily: 'Roboto', fontSize: 16 },
  }),
};

&lt;Text style={styles.body} accessibilityRole="text"&gt;...&lt;/Text&gt;
</code></pre>
<p>RN's <code>Text</code> respects Dynamic Type by default via <code>allowFontScaling</code>. Test at the largest accessibility setting (<code>Settings → Display → Text Size → All the way up</code>); ensure layouts don't break.</p>

<h3>Dark mode</h3>
<pre><code class="language-typescript">import { useColorScheme, View, Text } from 'react-native';

function MyView() {
  const scheme = useColorScheme(); // 'light' | 'dark' | null
  const isDark = scheme === 'dark';
  return (
    &lt;View style={{ backgroundColor: isDark ? '#000' : '#fff' }}&gt;
      &lt;Text style={{ color: isDark ? '#fff' : '#000' }}&gt;Hello&lt;/Text&gt;
    &lt;/View&gt;
  );
}
</code></pre>
<p>Better: define a theme object with semantic tokens (<code>theme.colors.background</code>, <code>theme.colors.label</code>) and switch the whole theme on color scheme change.</p>

<h3>Haptic feedback</h3>
<pre><code class="language-typescript">import * as Haptics from 'expo-haptics';

// On a confirm tap
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// After successful save
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Picker scroll
await Haptics.selectionAsync();
</code></pre>

<h3>Pull-to-refresh</h3>
<pre><code class="language-typescript">&lt;FlatList
  data={items}
  refreshControl={
    &lt;RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} /&gt;
  }
  renderItem={renderItem}
/&gt;
</code></pre>
<p>Looks identical to system pull-to-refresh on iOS.</p>

<h3>Swipe-to-action rows</h3>
<pre><code class="language-typescript">import { Swipeable } from 'react-native-gesture-handler';

&lt;Swipeable
  renderRightActions={() =&gt; (
    &lt;Pressable style={styles.deleteButton} onPress={onDelete}&gt;
      &lt;Text style={{ color: '#fff' }}&gt;Delete&lt;/Text&gt;
    &lt;/Pressable&gt;
  )}
&gt;
  &lt;ListRow {...item} /&gt;
&lt;/Swipeable&gt;
</code></pre>

<h3>Context menu (long-press preview)</h3>
<pre><code class="language-typescript">import ContextMenu from 'react-native-context-menu-view';

&lt;ContextMenu
  actions={[{ title: 'Edit' }, { title: 'Share' }, { title: 'Delete', destructive: true }]}
  onPress={(e) =&gt; handleAction(e.nativeEvent.name)}
&gt;
  &lt;Card item={item} /&gt;
&lt;/ContextMenu&gt;
</code></pre>

<h3>System share sheet</h3>
<pre><code class="language-typescript">import { Share } from 'react-native';

await Share.share({ message: 'Check this out', url: 'https://...' });
// On iOS opens UIActivityViewController — system sheet with installed apps
</code></pre>

<h3>System alert vs custom modal</h3>
<pre><code class="language-typescript">import { Alert } from 'react-native';

Alert.alert('Delete photo?', 'This cannot be undone.', [
  { text: 'Cancel', style: 'cancel' },
  { text: 'Delete', style: 'destructive', onPress: handleDelete },
]);
</code></pre>
<p>Always use system alerts for destructive confirmations — users trust them.</p>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: A native-feeling email inbox</h3>
<p>Layout: tab bar (Inbox / Sent / Settings); large title on inbox; list rows with swipe actions; tap row → drill-down detail with back-swipe.</p>
<pre><code class="language-typescript">function InboxScreen() {
  return (
    &lt;ScrollView contentInsetAdjustmentBehavior="automatic"&gt;
      {messages.map(m =&gt; (
        &lt;Swipeable
          key={m.id}
          renderRightActions={() =&gt; &lt;DeleteAction onPress={() =&gt; deleteMsg(m.id)} /&gt;}
          renderLeftActions={() =&gt; &lt;ArchiveAction onPress={() =&gt; archive(m.id)} /&gt;}
        &gt;
          &lt;Pressable onPress={() =&gt; nav.push('Detail', { id: m.id })}&gt;
            &lt;MessageRow {...m} /&gt;
          &lt;/Pressable&gt;
        &lt;/Swipeable&gt;
      ))}
    &lt;/ScrollView&gt;
  );
}
</code></pre>
<p>Why <code>contentInsetAdjustmentBehavior="automatic"</code>: makes the ScrollView play nicely with the large title shrink-on-scroll behaviour. Otherwise the content sits awkwardly under the nav bar.</p>

<h3>Example 2: Compose modal with form sheet</h3>
<pre><code class="language-typescript">&lt;Stack.Screen
  name="Compose"
  component={ComposeScreen}
  options={{
    presentation: 'formSheet',
    sheetAllowedDetents: ['large'],
    headerLeft: () =&gt; &lt;Button title="Cancel" onPress={() =&gt; nav.goBack()} /&gt;,
    headerRight: () =&gt; &lt;Button title="Send" onPress={onSend} /&gt;,
  }}
/&gt;
</code></pre>
<p>Native iOS pattern: modal slides up; user can swipe down to dismiss. Cancel left, primary action right.</p>

<h3>Example 3: Settings screen with grouped list</h3>
<p>iOS Settings.app uses grouped lists: insets, rounded corners, section headers in caps.</p>
<pre><code class="language-typescript">function SettingsScreen() {
  return (
    &lt;ScrollView style={{ backgroundColor: theme.groupedBackground }}&gt;
      &lt;Section title="ACCOUNT"&gt;
        &lt;Row label="Profile" rightAccessory={&lt;Chevron /&gt;} onPress={...} /&gt;
        &lt;Row label="Email" rightAccessory={&lt;Text&gt;p@x.com&lt;/Text&gt;} /&gt;
      &lt;/Section&gt;

      &lt;Section title="NOTIFICATIONS"&gt;
        &lt;Row label="Push" rightAccessory={&lt;Switch value={push} onValueChange={setPush} /&gt;} /&gt;
        &lt;Row label="Email" rightAccessory={&lt;Switch value={email} onValueChange={setEmail} /&gt;} /&gt;
      &lt;/Section&gt;

      &lt;Section&gt;
        &lt;Row label="Sign out" textColor="#ff3b30" onPress={onSignOut} /&gt;
      &lt;/Section&gt;
    &lt;/ScrollView&gt;
  );
}
</code></pre>

<h3>Example 4: Action sheet for "more options"</h3>
<pre><code class="language-typescript">import { ActionSheetIOS, Platform } from 'react-native';

function showMore(item) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', 'Edit', 'Share', 'Delete'],
        destructiveButtonIndex: 3,
        cancelButtonIndex: 0,
      },
      (idx) =&gt; { /* handle */ }
    );
  } else {
    // Android: bottom sheet equivalent
  }
}
</code></pre>

<h3>Example 5: Confirmation with haptics + system alert</h3>
<pre><code class="language-typescript">async function onDelete() {
  Alert.alert('Delete this item?', 'This cannot be undone.', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: async () =&gt; {
        await deleteFromServer();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
    },
  ]);
}
</code></pre>

<h3>Example 6: Search bar in nav</h3>
<pre><code class="language-typescript">&lt;Stack.Screen
  name="Browse"
  component={BrowseScreen}
  options={{
    headerLargeTitle: true,
    headerSearchBarOptions: {
      placeholder: 'Search',
      onChangeText: (e) =&gt; setQuery(e.nativeEvent.text),
      hideWhenScrolling: true, // iOS pattern
    },
  }}
/&gt;
</code></pre>
<p>Native UISearchController; appears as a sub-bar under the large title; auto-hides on scroll.</p>

<h3>Example 7: Theming with semantic colors</h3>
<pre><code class="language-typescript">// theme.ts
const lightColors = {
  background: '#fff',
  groupedBackground: '#f2f2f7',
  label: '#000',
  secondaryLabel: '#6c6c70',
  separator: 'rgba(60,60,67,0.29)',
  tint: '#007aff',
  destructive: '#ff3b30',
};

const darkColors = {
  background: '#000',
  groupedBackground: '#1c1c1e',
  label: '#fff',
  secondaryLabel: '#8e8e93',
  separator: 'rgba(84,84,88,0.65)',
  tint: '#0a84ff',
  destructive: '#ff453a',
};

export function useTheme() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
}
</code></pre>
<p>Use named semantic tokens; never <code>#007aff</code> directly in a component.</p>

<h3>Example 8: Respecting Reduce Motion</h3>
<pre><code class="language-typescript">import { AccessibilityInfo } from 'react-native';

const [reduceMotion, setReduceMotion] = useState(false);

useEffect(() =&gt; {
  AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
  return () =&gt; sub.remove();
}, []);

// In your animated transition
const duration = reduceMotion ? 0 : 300;
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>Notch / Dynamic Island</h3>
<ul>
  <li>Don't render text or interactive controls under the notch.</li>
  <li>Use <code>useSafeAreaInsets().top</code> for top padding.</li>
  <li>Dynamic Island (iPhone 14 Pro+) is a UI element you can target via Live Activities (native-only; no RN binding currently mainstream).</li>
  <li>Background color extends through the notch — pick wisely; don't suddenly switch under the notch.</li>
</ul>

<h3>Home indicator (Face ID phones)</h3>
<ul>
  <li>The bottom indicator can be hidden in immersive contexts (video, camera) but defaults to visible.</li>
  <li>Use <code>useSafeAreaInsets().bottom</code>; don't hard-code 34pt — older phones don't have it.</li>
  <li>Avoid placing tap targets in the bottom 34pt — they conflict with the home gesture.</li>
</ul>

<h3>Status bar collisions</h3>
<ul>
  <li>Light content on white = invisible. Set <code>StatusBar barStyle</code> per screen.</li>
  <li>Translucent vs opaque: iOS bars are translucent by default with material backdrop.</li>
  <li>If you customize, ensure status bar contrast remains adequate.</li>
</ul>

<h3>Dynamic Type breakpoints</h3>
<ul>
  <li>Default size = "Large" (XL on iOS terminology). Users can scale up to "AX5" (Accessibility Extra Large 5) — text effectively 2.5–3× normal.</li>
  <li>Layouts with fixed-height rows break: ellipsis cuts critical info, controls overflow.</li>
  <li>Test: <code>Settings → Display → Text Size → All the way up</code> + <code>Larger Accessibility Sizes ON</code>.</li>
  <li>Solution: variable-height rows; Stack instead of Row when text grows; truncation only on non-essential meta.</li>
</ul>

<h3>Dark mode pitfalls</h3>
<ul>
  <li>Hard-coded white logo on dark background → invisible.</li>
  <li>Custom illustrations need a dark variant or use SVG with currentColor.</li>
  <li>Shadows: dark mode usually doesn't use them — depth comes from elevation in lighter background.</li>
  <li>Brand colors may need a dark-mode tweak (lower saturation, higher luminance).</li>
</ul>

<h3>Back-swipe gesture conflicts</h3>
<ul>
  <li>Native-stack gives you back-swipe automatically.</li>
  <li>Custom horizontal-swipe components (carousels) on the leftmost area conflict with edge-swipe-to-back.</li>
  <li>Solution: <code>fullScreenGestureEnabled: false</code> per screen, or use only <code>screen edge swipe</code>.</li>
</ul>

<h3>Modal vs nav screen</h3>
<ul>
  <li>Modal: self-contained task (compose, settings); user explicitly cancels / completes.</li>
  <li>Nav screen: drill-down; user can return naturally with back.</li>
  <li>Mixing: avoid presenting a full-screen "modal" via nav stack with no obvious dismiss; users will hit back-swipe and be confused.</li>
</ul>

<h3>iPad considerations</h3>
<ul>
  <li>iPad runs the iPhone app at 1× scaling unless you opt into iPad-native layouts.</li>
  <li>For a full iPad experience: split view, sidebar, popovers, hover (with trackpad/mouse).</li>
  <li>RN: layouts that work on phone often look wrong stretched to iPad — use <code>useWindowDimensions</code> + breakpoints.</li>
  <li>Multitasking: app may be ¼, ½, or ⅓ of screen — test responsive layouts.</li>
</ul>

<h3>Keyboard behavior</h3>
<ul>
  <li>iOS keyboard slides up over content; doesn't push.</li>
  <li>Use <code>KeyboardAvoidingView behavior="padding"</code> on iOS, <code>"height"</code> on Android — different mental models.</li>
  <li>Keyboard accessory bar (suggestion strip) above keyboard adds ~44pt; account for it.</li>
  <li>Inputs near bottom should scroll into view automatically.</li>
</ul>

<h3>Locale + RTL</h3>
<ul>
  <li>Arabic / Hebrew users get full RTL layout — back-swipe is from the right edge, not left.</li>
  <li>Test with <code>Settings → General → Language &amp; Region → Add Hebrew</code>; restart app.</li>
  <li>Use <code>I18nManager.isRTL</code> in RN to mirror chevrons, swipe directions.</li>
</ul>

<h3>Accessibility shortcuts users may have on</h3>
<ul>
  <li>VoiceOver: screen reader; test at least once per release.</li>
  <li>Reduce Motion: parallax / transitions should disable.</li>
  <li>Reduce Transparency: replace blur with opaque colors.</li>
  <li>Increase Contrast: thicken hairlines / borders.</li>
  <li>Bold Text: opt into bolder weights of system font.</li>
  <li>Invert Colors / Smart Invert: don't fight; let the OS handle it.</li>
</ul>

<h3>App Store review trip wires</h3>
<ul>
  <li>Custom alert that looks like a system alert but isn't = phishing concern; rejected.</li>
  <li>"App tracks across apps without ATT prompt" = rejected (App Tracking Transparency).</li>
  <li>Login required for content that doesn't need it = rejected; offer guest browsing.</li>
  <li>Sign in with Apple required if you offer any other social SSO.</li>
  <li>3rd-party billing for digital goods inside app = rejected; must use IAP.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common HIG violations in RN apps</h3>
<ol>
  <li><strong>Material hamburger menu on iOS.</strong> Use tab bar.</li>
  <li><strong>FAB (floating action button) on a list.</strong> That's Material; use bottom toolbar or "+" in nav bar.</li>
  <li><strong>Custom back button without back-swipe.</strong> Users hit edge-swipe and nothing happens.</li>
  <li><strong>Hard-coded white background.</strong> Stays white in dark mode.</li>
  <li><strong>Fixed-size text.</strong> Ignores Dynamic Type; accessibility users can't read.</li>
  <li><strong>Modal that doesn't swipe-down.</strong> Users hunt for the X button.</li>
  <li><strong>Tap targets &lt; 44pt.</strong> Misses fingers.</li>
  <li><strong>Toast slides in from corner.</strong> Android pattern; iOS uses banners or in-app notifications.</li>
  <li><strong>Custom share UI.</strong> Use <code>UIActivityViewController</code> via <code>Share</code> API.</li>
  <li><strong>No safe-area handling.</strong> Buttons under home indicator; text under notch.</li>
  <li><strong>Hidden status bar without justification.</strong> Lose system context (time, battery).</li>
  <li><strong>Light content status bar on light background.</strong> Invisible time + battery.</li>
</ol>

<h3>Anti-pattern: cross-platform component dogma</h3>
<pre><code class="language-typescript">// BAD — same component for both platforms; pleases neither
function Button({ title, onPress }) {
  return (
    &lt;TouchableOpacity onPress={onPress} style={styles.button}&gt;
      &lt;Text&gt;{title}&lt;/Text&gt;
    &lt;/TouchableOpacity&gt;
  );
}

// GOOD — Pressable + Platform.select for native-feeling press
function Button({ title, onPress }) {
  return (
    &lt;Pressable
      onPress={onPress}
      style={({ pressed }) =&gt; [
        styles.button,
        Platform.OS === 'ios' &amp;&amp; pressed &amp;&amp; { opacity: 0.6 },
      ]}
      android_ripple={{ color: '#0001' }}
    &gt;
      &lt;Text&gt;{title}&lt;/Text&gt;
    &lt;/Pressable&gt;
  );
}
</code></pre>

<h3>Anti-pattern: hard-coded colors</h3>
<pre><code class="language-typescript">// BAD
&lt;View style={{ backgroundColor: '#fff' }}&gt;
  &lt;Text style={{ color: '#000' }}&gt;Hello&lt;/Text&gt;
&lt;/View&gt;

// GOOD
const t = useTheme();
&lt;View style={{ backgroundColor: t.background }}&gt;
  &lt;Text style={{ color: t.label }}&gt;Hello&lt;/Text&gt;
&lt;/View&gt;
</code></pre>

<h3>Anti-pattern: SafeAreaView everywhere</h3>
<pre><code class="language-typescript">// BAD — nests SafeAreaView; double-pads when nav header already insets
&lt;SafeAreaView style={{ flex: 1 }}&gt;
  &lt;NavigationContainer&gt;
    &lt;SafeAreaView style={{ flex: 1 }}&gt;
      &lt;Stack.Navigator&gt; ... &lt;/Stack.Navigator&gt;
    &lt;/SafeAreaView&gt;
  &lt;/NavigationContainer&gt;
&lt;/SafeAreaView&gt;

// GOOD — SafeAreaProvider once at root; useSafeAreaInsets where you need raw values
&lt;SafeAreaProvider&gt;
  &lt;NavigationContainer&gt;
    &lt;Stack.Navigator&gt; ... &lt;/Stack.Navigator&gt;
  &lt;/NavigationContainer&gt;
&lt;/SafeAreaProvider&gt;
</code></pre>

<h3>Anti-pattern: rasterized SF Symbols</h3>
<p>Designer exports an SF Symbol as a 32×32 PNG; you ship it. Loses Dynamic Type scaling, dark-mode color, and looks blurry on Retina. Always render via <code>SymbolView</code>.</p>

<h3>Anti-pattern: gratuitous haptics</h3>
<p>Every button press vibrates. Battery drain + annoyance. Reserve haptics for moments of confirmation, error, or commit.</p>

<h3>Anti-pattern: blocking the back-swipe</h3>
<pre><code class="language-typescript">// BAD — users can't go back
&lt;Stack.Screen options={{ gestureEnabled: false }} /&gt;

// Only justify when the screen has unsaved-changes confirmation;
// even then, prefer letting back-swipe work + showing alert on dismiss
</code></pre>

<h3>Anti-pattern: custom alert dialog</h3>
<pre><code class="language-typescript">// BAD — looks "iOS-ish" but isn't system-rendered; uncanny
&lt;CustomAlertModal title="..." actions={...} /&gt;

// GOOD — use the real one
Alert.alert('Title', 'Message', actions);
</code></pre>

<h3>Anti-pattern: navigation in the wrong direction</h3>
<p>Tapping "Settings" pushes a new screen with a back button. Settings is a top-level destination — use a tab. Or it's a rarely-visited modal — present as form sheet. Pushing it on a stack the user is in mid-flow disorients.</p>

<h3>Anti-pattern: bottom sheet that grabs vertical scroll</h3>
<p>Custom bottom sheet stops respecting the inner ScrollView. Users can't scroll the content. iOS native sheets handle this correctly; use them via native-stack <code>presentation: 'pageSheet'</code> + <code>sheetAllowedDetents</code>.</p>

<h3>Anti-pattern: long-press without feedback</h3>
<p>Long-press triggers an action but provides no visual / haptic feedback that something happened. iOS expects scale-down + haptic for long-press preview.</p>

<h3>Anti-pattern: ignoring keyboard accessory</h3>
<p>Input fields scroll under the keyboard suggestion strip; users can't see what they typed. Add bottom padding equal to <code>keyboardHeight + 44</code>.</p>

<h3>Anti-pattern: web-styled toast</h3>
<p>Slide-in toast from corner. iOS has no native equivalent; the closest is in-app notifications or system banners. Use a sheet with auto-dismiss instead, or a localized banner pinned to the top of the screen.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common HIG / iOS-design interview prompts</h3>
<ol>
  <li>How do you make a React Native app feel native on iOS?</li>
  <li>Walk me through implementing dark mode + Dynamic Type.</li>
  <li>What are the iOS navigation patterns and when do you use each?</li>
  <li>How do you handle safe-area on modern iPhones?</li>
  <li>Compare iOS and Android UX paradigms; how does your app handle both?</li>
  <li>What's your approach to haptics, sound, and animation?</li>
  <li>How do you support accessibility on iOS?</li>
  <li>Tell me about a time HIG fluency caught a design issue.</li>
</ol>

<h3>The 5-step framework</h3>
<ol>
  <li><strong>Identify the pattern:</strong> tab bar / nav stack / modal / sheet — match user mental model.</li>
  <li><strong>Lean on system primitives:</strong> SF Symbols, system colors, Dynamic Type, haptics.</li>
  <li><strong>Honor safe area + grid:</strong> 8pt grid, 44pt taps, useSafeAreaInsets.</li>
  <li><strong>Test the accessibility surface:</strong> Dynamic Type AX5, dark mode, VoiceOver, Reduce Motion.</li>
  <li><strong>Differentiate from Android:</strong> swap Touchable→Pressable; bottom tab bar not drawer; native modal not custom.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"Native-stack via react-navigation gives us back-swipe + large titles + sheet detents for free — looks indistinguishable from native."</em></li>
  <li><em>"SF Symbols via expo-symbols: 5,000+ icons that scale with Dynamic Type and flip color in dark mode automatically. Custom-drawn icons can't do that."</em></li>
  <li><em>"Semantic colors in a theme object — useColorScheme switches the whole theme; no per-component dark-mode logic."</em></li>
  <li><em>"useSafeAreaInsets at the root; raw values where I need to position over content. SafeAreaView only for full-bleed screens; not nested."</em></li>
  <li><em>"Form sheets with detents for compose / filter screens — the modern iOS pattern; respects swipe-to-dismiss out of the box."</em></li>
  <li><em>"Haptics deliberate, not gratuitous. Medium impact on commits; success notification on save; nothing on regular taps."</em></li>
  <li><em>"Cross-platform: shared logic, platform-specific UI primitives. Pressable + Platform.select; iOS tab bar, Android drawer."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"native-feeling navigation"</td><td>react-navigation native-stack + tab bar</td></tr>
    <tr><td>"dark mode"</td><td>useColorScheme + semantic theme tokens</td></tr>
    <tr><td>"accessibility text"</td><td>Dynamic Type via system text styles + flexible row heights</td></tr>
    <tr><td>"compose / filter screen"</td><td>formSheet with detents</td></tr>
    <tr><td>"long-press menu"</td><td>react-native-context-menu-view</td></tr>
    <tr><td>"swipe to delete"</td><td>react-native-gesture-handler Swipeable</td></tr>
    <tr><td>"share to other apps"</td><td>RN Share API → UIActivityViewController</td></tr>
    <tr><td>"destructive confirmation"</td><td>Alert.alert with style: destructive</td></tr>
    <tr><td>"icons"</td><td>SF Symbols on iOS; Material Icons on Android via Platform.select</td></tr>
  </tbody>
</table>

<h3>Demo script</h3>
<ol>
  <li>Walk through a screen mockup; identify nav pattern.</li>
  <li>Sketch the safe-area layout (insets at top + bottom).</li>
  <li>Replace Touchable with Pressable; add Platform.select for press feedback.</li>
  <li>Swap hard-coded colors for semantic theme tokens.</li>
  <li>Add SF Symbol references; show Dynamic Type scale at AX1 + AX5.</li>
  <li>Add haptics on the destructive action.</li>
  <li>Talk through testing matrix: light / dark, default / AX5, VoiceOver, Reduce Motion.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"Live Activities for in-progress tasks (iOS 16.1+) — needs a thin native module."</em></li>
  <li><em>"Dynamic Island integration for Now Playing-style states."</em></li>
  <li><em>"Widget extension via Expo modules + WidgetKit."</em></li>
  <li><em>"App Shortcuts for Siri / Spotlight."</em></li>
  <li><em>"Focus filters (Do Not Disturb mode awareness)."</em></li>
  <li><em>"Stage Manager + iPad split view layouts."</em></li>
  <li><em>"Custom theme system with high-contrast variant for accessibility users."</em></li>
  <li><em>"Snapshot tests at AX5 + dark mode in Storybook."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>HIG fluency</td><td>Names patterns by Apple's terms (form sheet, large title, action sheet)</td></tr>
    <tr><td>System primitives instinct</td><td>Reaches for SF Symbols, system colors, native modals</td></tr>
    <tr><td>Safe-area awareness</td><td>useSafeAreaInsets; doesn't hard-code 34/44</td></tr>
    <tr><td>Dynamic Type respect</td><td>Variable row heights; tested at AX5</td></tr>
    <tr><td>Dark mode discipline</td><td>Semantic tokens, not hex</td></tr>
    <tr><td>Cross-platform balance</td><td>Platform.select where it matters; not "one component for both"</td></tr>
    <tr><td>Restraint with custom UI</td><td>Custom alert / share / picker = red flag</td></tr>
    <tr><td>Accessibility-as-default</td><td>Dynamic Type + VoiceOver + Reduce Motion all considered</td></tr>
    <tr><td>App Store review awareness</td><td>Knows what gets rejected (custom alerts, ATT skip, IAP for digital)</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN's defaults skew Android — Touchable*, Modal, manual stacks. Modern RN with native-stack + Pressable + safe-area context closes the gap.</li>
  <li>The cost of "iOS-native" feel is platform-specific code; embrace it. Trying to share one component across both usually pleases neither.</li>
  <li>Expo gives you SF Symbols, haptics, color scheme, blur views in days; bare RN takes weeks of native module work.</li>
  <li>Test on a real iPhone — simulators don't fully simulate haptics, Dynamic Type rendering, or true OLED dark mode.</li>
  <li>Test at the largest accessibility text size + dark mode + Reduce Motion — most layouts break.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"Why use react-navigation native-stack over the JS stack?"</em> — Native-stack bridges to UIKit's UINavigationController on iOS and FragmentNavigator on Android — gestures, transitions, headers all native; the JS stack reimplements them in JS and looks subtly off.</li>
  <li><em>"How do you decide tab bar vs drawer?"</em> — iOS doesn't ship drawers natively; tab bar is the canonical top-level nav. Drawers are an Android pattern. Use tab bar on iOS; if the app has 6+ destinations, group them into the tab bar's "More" tab or rethink the IA.</li>
  <li><em>"How do you ship dark mode for an existing app?"</em> — Audit hard-coded colors; replace with semantic tokens; create a parallel dark theme; switch via useColorScheme; QA every screen at light + dark.</li>
  <li><em>"What's the most common HIG violation you've fixed?"</em> — Hard-coded white background, missing safe-area, custom alert that should have been system Alert.</li>
  <li><em>"How does your app handle Dynamic Type at AX5?"</em> — Variable-height rows; truncation only on non-essential meta; tested with Accessibility Inspector in Xcode.</li>
  <li><em>"How do you design for iPad without rebuilding?"</em> — useWindowDimensions + breakpoints; sidebar-style nav at iPad widths; modal as popover instead of full sheet on iPad.</li>
  <li><em>"How do you avoid App Store rejections?"</em> — Use system primitives; respect ATT; offer guest browsing; pair every social SSO with Sign in with Apple; never IAP-bypass for digital goods.</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Read 3 HIG sections: Navigation, Layout, Color.</li>
  <li>Build one RN screen end-to-end: tab bar, large title, list with swipe actions, sheet modal, semantic theme, SF Symbols, haptics.</li>
  <li>Test at: light mode, dark mode, AX5 text, VoiceOver on, Reduce Motion on.</li>
  <li>Audit a real RN app you've shipped — find 5 HIG violations.</li>
  <li>Memorise the navigation-pattern decision tree and 8pt grid.</li>
  <li>Practice the cross-platform tradeoff explanation.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Watch WWDC sessions on Designing for iOS (session number changes yearly; the latest is always relevant)."</li>
  <li>"Read Apple's 'Designing for iOS' book on Apple Books — free, illustrated."</li>
  <li>"Reverse-engineer an Apple app (Notes, Reminders) — note every micro-interaction."</li>
  <li>"Build a clone of one Apple app's screen in RN; aim for indistinguishable from native."</li>
</ul>
`
    }
  ]
});
