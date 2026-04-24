window.PREP_SITE.registerTopic({
  id: 'rn-components',
  module: 'React Native',
  title: 'Core Components',
  estimatedReadTime: '26 min',
  tags: ['react-native', 'components', 'view', 'text', 'flatlist', 'textinput', 'image', 'scrollview', 'pressable'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>RN ships a small set of primitive components that wrap the native equivalents. Master these; everything else is built from them.</p>
<ul>
  <li><strong>View</strong> — the container. Maps to <code>UIView</code> / <code>android.view.View</code>. Supports flexbox, positioning, borders, shadows.</li>
  <li><strong>Text</strong> — the only way to render text. Cannot contain non-Text children except nested <code>&lt;Text&gt;</code>. Inherits font styles to children.</li>
  <li><strong>Image</strong> — wraps native image views. <code>resizeMode</code>, caching, network images. Prefer <strong>react-native-fast-image</strong> or <strong>expo-image</strong> for production.</li>
  <li><strong>ScrollView</strong> — renders ALL children at once. Use for small content. Bad for long lists.</li>
  <li><strong>FlatList / SectionList</strong> — virtualized lists. Only renders visible items. Use for long lists. Consider <strong>FlashList</strong> (Shopify) for even better perf.</li>
  <li><strong>TextInput</strong> — text input. Controlled or uncontrolled. Many platform-specific props.</li>
  <li><strong>Pressable</strong> — modern way to handle press. Replaces older TouchableOpacity/TouchableHighlight. Gives you hover, focus, press states.</li>
  <li><strong>Modal</strong> — native modal overlay. For simple cases; heavy UIs prefer navigation library's presentation.</li>
  <li><strong>SafeAreaView / useSafeAreaInsets</strong> — avoid notches and home indicators. Use the "react-native-safe-area-context" package for reliable insets.</li>
  <li><strong>KeyboardAvoidingView</strong> — adjust layout when keyboard appears. Flaky; many teams prefer "react-native-keyboard-controller" today.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>View + Text + Image + FlatList + TextInput + Pressable covers 90% of screens. Learn their platform quirks (keyboard on Android, safe area on iOS, touch feedback differences) — the rest is composition.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Why RN has its own component set</h3>
<p>RN components map to native views, not DOM elements. <code>&lt;View&gt;</code> becomes <code>UIView</code> on iOS, <code>android.view.View</code> on Android. <code>&lt;Text&gt;</code> becomes <code>UILabel</code> / <code>TextView</code>. The API surface is smaller than HTML but targets different concerns — no <code>&lt;a&gt;</code>, no <code>&lt;div&gt;</code>, no form elements except <code>TextInput</code>. Want HTML? You're on the web.</p>

<h3>Why Text is special</h3>
<p>In HTML, any element can contain text. In RN, <em>only</em> <code>&lt;Text&gt;</code> can. Putting a string directly in a <code>&lt;View&gt;</code> throws at runtime. Text nodes in RN need explicit rendering semantics — font, color, line-height — so they're scoped to a specific component type. Font styles set on a <code>&lt;Text&gt;</code> inherit to child <code>&lt;Text&gt;</code> elements (the one place in RN where "cascade" applies).</p>

<h3>Why ScrollView vs FlatList</h3>
<p><code>ScrollView</code> renders every child immediately. Fine for a few cards; terrible for 1000. <code>FlatList</code> virtualizes — only items visible (plus a small overscan) are mounted. Uses <code>keyExtractor</code> to identify items, <code>renderItem</code> to render. For list-shaped data, always reach for FlatList/SectionList or FlashList.</p>

<h3>Why FlashList</h3>
<p>Shopify's drop-in FlatList replacement. Big performance gains from:</p>
<ul>
  <li>Recycling view cells (like native RecyclerView/UITableView) instead of unmounting.</li>
  <li>Better heuristics for <code>estimatedItemSize</code> — fewer layout passes.</li>
  <li>Cell type-awareness — if you have mixed item types, FlashList handles them efficiently.</li>
</ul>
<p>Most modern RN apps use FlashList for long lists.</p>

<h3>Why Pressable replaces TouchableOpacity</h3>
<p>Old touchables (<code>TouchableOpacity</code>, <code>TouchableHighlight</code>, <code>TouchableWithoutFeedback</code>, <code>TouchableNativeFeedback</code>) had inconsistent behaviors across platforms and didn't support modern press states well. <code>Pressable</code> is one API that exposes all states via a function-as-child or style-function pattern. It's the recommended primitive since RN 0.63+.</p>

<h3>Why platform-specific text input behavior matters</h3>
<p>iOS and Android keyboards differ substantially: return-key label, input types (email, phone, numeric), autocorrect behavior, software keyboard appearance timing. <code>TextInput</code> unifies many props but some leak through (<code>autoCompleteType</code> behaves differently). Forms need platform-specific tuning.</p>

<h3>Why Image is more complex than it looks</h3>
<p>Networking, caching, prioritization, progressive loading, placeholders, resize modes, native format support (HEIC, AVIF). Built-in <code>&lt;Image&gt;</code> is functional but lacks modern features. Production apps use:</p>
<ul>
  <li><strong>expo-image</strong>: modern, Fabric-compatible, supports SVG + animated formats, placeholders, priorities.</li>
  <li><strong>react-native-fast-image</strong>: widely adopted, GIF/WebP, priorities, better caching. Note: not Fabric-native yet.</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "tree of primitives" picture</h3>
<div class="diagram">
<pre>
  Your screen
       │
       ├── &lt;SafeAreaView&gt;
       │       │
       │       ├── &lt;View&gt;  (header)
       │       │       └── &lt;Text&gt;Title&lt;/Text&gt;
       │       │
       │       ├── &lt;FlatList&gt;  (content)
       │       │       │
       │       │       └── renderItem: &lt;Pressable&gt;&lt;Image/&gt;&lt;Text/&gt;&lt;/Pressable&gt;
       │       │
       │       └── &lt;KeyboardAvoidingView&gt;
       │               └── &lt;TextInput /&gt;
       │
       └── &lt;Modal visible={...}&gt;&lt;View&gt;...&lt;/View&gt;&lt;/Modal&gt;
</pre>
</div>

<h3>The "text nesting" rule</h3>
<pre><code class="language-tsx">&lt;Text style={{ fontSize: 16 }}&gt;
  Hello &lt;Text style={{ fontWeight: 'bold' }}&gt;world&lt;/Text&gt;!
&lt;/Text&gt;
// OK — Text inside Text. Outer font inherits; bold overrides.

&lt;View&gt;Hi&lt;/View&gt;
// ERROR: "Text strings must be rendered within a &lt;Text&gt; component."
</code></pre>

<h3>The "flex defaults" picture</h3>
<p>In CSS, <code>display</code> defaults to <code>block</code> or <code>inline</code>. In RN, every component is already <code>flex</code>. And <code>flexDirection</code> defaults to <code>column</code> (not <code>row</code> like web), which is the most confusing adjustment for web devs.</p>

<h3>The "FlatList lifecycle" picture</h3>
<div class="diagram">
<pre>
  data: Item[]                  ──► viewport-based slice
         │                             │
         │ keyExtractor(item) → key    ├── visible items (~5-10)
         │                             ├── cached items (small buffer)
         │ renderItem({item})          └── everything else: NOT mounted
         │
  Scroll → FlatList recomputes which items should be mounted.
  Items going off-screen are UNMOUNTED by default (FlashList recycles).
</pre>
</div>

<h3>The "safe area" picture</h3>
<p>iPhones with a notch, Android with system bars, Dynamic Island — the visible drawable area varies per device. SafeAreaView (or <code>useSafeAreaInsets</code>) gives you the padding needed to avoid these regions. Apply padding, not margin, so backgrounds still fill under the notch.</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"I can use <code>&lt;div&gt;</code> / <code>&lt;span&gt;</code> by importing them." No. RN has only these primitives. Even <code>&lt;button&gt;</code> is not a component — use <code>&lt;Pressable&gt;</code> with a <code>&lt;Text&gt;</code> inside. Bringing web-like primitives requires third-party libs that emulate them.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>View — the container</h3>
<pre><code class="language-tsx">&lt;View
  style={{
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,   // Android shadow
  }}
  onLayout={(e) =&gt; console.log(e.nativeEvent.layout)}
/&gt;</code></pre>
<p>Note: iOS shadows require separate shadow* props; Android uses <code>elevation</code>. Cross-platform shadows need explicit handling.</p>

<h3>Text — inherited font styling</h3>
<pre><code class="language-tsx">&lt;Text style={{ fontSize: 16, color: '#333' }}&gt;
  Hello, &lt;Text style={{ fontWeight: 'bold' }}&gt;world&lt;/Text&gt;!
  &lt;Text style={{ color: 'red' }}&gt; (warning)&lt;/Text&gt;
&lt;/Text&gt;</code></pre>
<p>Props on Text: <code>numberOfLines</code>, <code>ellipsizeMode</code>, <code>selectable</code>, <code>onTextLayout</code>, <code>adjustsFontSizeToFit</code>, <code>onPress</code> (makes it tappable inline).</p>

<h3>Image — built-in</h3>
<pre><code class="language-tsx">&lt;Image
  source={require('./local.png')}          // local (bundler-resolved)
  style={{ width: 100, height: 100 }}
  resizeMode="cover"
/&gt;
&lt;Image
  source={{ uri: 'https://example.com/x.jpg', cache: 'force-cache' }}
  style={{ width: '100%', aspectRatio: 16/9 }}
  onLoad={() =&gt; {}}
  onError={() =&gt; {}}
  defaultSource={require('./placeholder.png')}
/&gt;</code></pre>
<p><code>resizeMode</code>: <code>cover</code> (fill, crop), <code>contain</code> (fit, letterbox), <code>stretch</code>, <code>repeat</code> (iOS), <code>center</code>.</p>

<h3>expo-image (modern)</h3>
<pre><code class="language-tsx">import { Image } from 'expo-image';
&lt;Image
  source={{ uri }}
  placeholder={{ blurhash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH' }}
  transition={200}
  contentFit="cover"
  priority="high"
/&gt;</code></pre>
<p>Supports placeholders, blurhash/thumbhash, progressive loading, memory + disk cache, SVG, animated formats.</p>

<h3>FlatList</h3>
<pre><code class="language-tsx">&lt;FlatList
  data={items}
  keyExtractor={(item) =&gt; item.id}
  renderItem={({ item, index }) =&gt; &lt;Row item={item} /&gt;}
  ItemSeparatorComponent={() =&gt; &lt;View style={styles.sep} /&gt;}
  ListHeaderComponent={&lt;Header /&gt;}
  ListEmptyComponent={&lt;Empty /&gt;}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
  refreshing={isRefreshing}
  onRefresh={refresh}
  removeClippedSubviews
  initialNumToRender={10}
  maxToRenderPerBatch={5}
  windowSize={10}
  getItemLayout={(_, index) =&gt; ({ length: 80, offset: 80 * index, index })}
/&gt;</code></pre>
<p>Perf tips: stable <code>keyExtractor</code>, memoized <code>renderItem</code> (wrap Row in <code>React.memo</code>), <code>getItemLayout</code> when items are fixed height (enables skip-to-index).</p>

<h3>FlashList</h3>
<pre><code class="language-tsx">import { FlashList } from '@shopify/flash-list';
&lt;FlashList
  data={items}
  keyExtractor={(item) =&gt; item.id}
  estimatedItemSize={80}          // REQUIRED
  renderItem={({ item }) =&gt; &lt;Row item={item} /&gt;}
/&gt;</code></pre>
<p>Drop-in replacement for FlatList with recycling. <code>estimatedItemSize</code> is mandatory.</p>

<h3>TextInput</h3>
<pre><code class="language-tsx">&lt;TextInput
  value={text}
  onChangeText={setText}
  placeholder="Email"
  keyboardType="email-address"
  autoCapitalize="none"
  autoCorrect={false}
  autoComplete="email"
  returnKeyType="go"
  onSubmitEditing={submit}
  secureTextEntry={false}
  multiline={false}
  maxLength={100}
  style={{ borderWidth: 1, padding: 8 }}
/&gt;</code></pre>
<p>Uncontrolled pattern: <code>defaultValue</code> + <code>ref.current.value</code> (via <code>getNativeRef</code>).</p>

<h3>Pressable</h3>
<pre><code class="language-tsx">&lt;Pressable
  onPress={() =&gt; {}}
  onLongPress={() =&gt; {}}
  delayLongPress={500}
  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
  style={({ pressed }) =&gt; [styles.btn, pressed &amp;&amp; styles.btnPressed]}
  android_ripple={{ color: '#0003' }}
&gt;
  {({ pressed }) =&gt; &lt;Text style={pressed &amp;&amp; { opacity: 0.6 }}&gt;Tap me&lt;/Text&gt;}
&lt;/Pressable&gt;</code></pre>

<h3>SafeArea handling</h3>
<pre><code class="language-tsx">// App.tsx wrap with provider
import { SafeAreaProvider } from 'react-native-safe-area-context';
&lt;SafeAreaProvider&gt;&lt;App /&gt;&lt;/SafeAreaProvider&gt;;

// Screen.tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const insets = useSafeAreaInsets();
&lt;View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}&gt; ... &lt;/View&gt;</code></pre>

<h3>KeyboardAvoidingView</h3>
<pre><code class="language-tsx">&lt;KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={64}
&gt;
  &lt;TextInput /&gt;
&lt;/KeyboardAvoidingView&gt;</code></pre>
<p>Behavior differs across platforms; many teams use <strong>react-native-keyboard-controller</strong> for consistent UX.</p>

<h3>Modal</h3>
<pre><code class="language-tsx">&lt;Modal
  visible={open}
  transparent
  animationType="slide"
  onRequestClose={() =&gt; setOpen(false)}
  statusBarTranslucent
&gt;
  &lt;View&gt;...&lt;/View&gt;
&lt;/Modal&gt;</code></pre>
<p>Native Modal is fine for simple cases. For a design-system-consistent modal, use navigation library's presentation (e.g., React Navigation's modal screens) or <code>react-native-modal</code> (third-party).</p>

<h3>ScrollView for short content</h3>
<pre><code class="language-tsx">&lt;ScrollView
  contentContainerStyle={{ padding: 16 }}
  showsVerticalScrollIndicator
  keyboardShouldPersistTaps="handled"
  refreshControl={&lt;RefreshControl refreshing={r} onRefresh={f} /&gt;}
&gt;
  {/* children mounted immediately — don't use for 1000 items */}
&lt;/ScrollView&gt;</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — card component</h3>
<pre><code class="language-tsx">function Card({ title, body, onPress }) {
  return (
    &lt;Pressable onPress={onPress} style={({ pressed }) =&gt; [styles.card, pressed &amp;&amp; { opacity: 0.8 }]}&gt;
      &lt;Text style={styles.title}&gt;{title}&lt;/Text&gt;
      &lt;Text style={styles.body} numberOfLines={3}&gt;{body}&lt;/Text&gt;
    &lt;/Pressable&gt;
  );
}</code></pre>

<h3>Example 2 — memoized FlatList item</h3>
<pre><code class="language-tsx">const Row = React.memo(function Row({ item, onPress }) {
  return (
    &lt;Pressable onPress={() =&gt; onPress(item.id)}&gt;
      &lt;Text&gt;{item.name}&lt;/Text&gt;
    &lt;/Pressable&gt;
  );
});

function List({ items }) {
  const onPress = useCallback((id) =&gt; {}, []);
  const renderItem = useCallback(({ item }) =&gt; &lt;Row item={item} onPress={onPress} /&gt;, [onPress]);
  return &lt;FlatList data={items} keyExtractor={(i) =&gt; i.id} renderItem={renderItem} /&gt;;
}</code></pre>

<h3>Example 3 — fixed-height list with getItemLayout</h3>
<pre><code class="language-tsx">const ITEM_HEIGHT = 80;
&lt;FlatList
  data={items}
  renderItem={renderItem}
  getItemLayout={(_, i) =&gt; ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * i, index: i })}
/&gt;
// Enables scrollToIndex and skips measurement passes.</code></pre>

<h3>Example 4 — SectionList with headers</h3>
<pre><code class="language-tsx">&lt;SectionList
  sections={[
    { title: 'A', data: itemsA },
    { title: 'B', data: itemsB },
  ]}
  keyExtractor={(item) =&gt; item.id}
  renderItem={({ item }) =&gt; &lt;Row item={item} /&gt;}
  renderSectionHeader={({ section }) =&gt; &lt;Text&gt;{section.title}&lt;/Text&gt;}
  stickySectionHeadersEnabled
/&gt;</code></pre>

<h3>Example 5 — form with TextInput ref</h3>
<pre><code class="language-tsx">function LoginForm() {
  const pwRef = useRef&lt;TextInput&gt;(null);
  return (
    &lt;&gt;
      &lt;TextInput
        placeholder="Email"
        keyboardType="email-address"
        returnKeyType="next"
        onSubmitEditing={() =&gt; pwRef.current?.focus()}
      /&gt;
      &lt;TextInput
        ref={pwRef}
        placeholder="Password"
        secureTextEntry
        returnKeyType="go"
        onSubmitEditing={submit}
      /&gt;
    &lt;/&gt;
  );
}</code></pre>

<h3>Example 6 — full-screen modal with dismiss</h3>
<pre><code class="language-tsx">&lt;Modal visible={open} animationType="slide" onRequestClose={close}&gt;
  &lt;SafeAreaView style={{ flex: 1 }}&gt;
    &lt;Pressable onPress={close}&gt;&lt;Text&gt;Close&lt;/Text&gt;&lt;/Pressable&gt;
    &lt;Content /&gt;
  &lt;/SafeAreaView&gt;
&lt;/Modal&gt;</code></pre>

<h3>Example 7 — platform-specific styling</h3>
<pre><code class="language-tsx">import { Platform } from 'react-native';
const styles = StyleSheet.create({
  input: {
    padding: Platform.select({ ios: 12, android: 8, default: 10 }),
    ...Platform.select({
      ios: { borderRadius: 8 },
      android: { borderRadius: 4, elevation: 2 },
    }),
  },
});</code></pre>

<h3>Example 8 — image with blurhash placeholder</h3>
<pre><code class="language-tsx">import { Image } from 'expo-image';
&lt;Image
  source={{ uri: user.avatar }}
  placeholder={{ blurhash: user.avatarBlurhash }}
  style={{ width: 40, height: 40, borderRadius: 20 }}
  contentFit="cover"
  transition={150}
/&gt;</code></pre>

<h3>Example 9 — pull to refresh</h3>
<pre><code class="language-tsx">const [refreshing, setRefreshing] = useState(false);
const refresh = useCallback(async () =&gt; {
  setRefreshing(true);
  await refetch();
  setRefreshing(false);
}, [refetch]);
&lt;FlatList data={items} refreshing={refreshing} onRefresh={refresh} renderItem={...} /&gt;</code></pre>

<h3>Example 10 — infinite scroll</h3>
<pre><code class="language-tsx">&lt;FlatList
  data={items}
  renderItem={renderItem}
  onEndReachedThreshold={0.5}
  onEndReached={() =&gt; loadMore()}
  ListFooterComponent={isLoading ? &lt;ActivityIndicator /&gt; : null}
/&gt;</code></pre>

<h3>Example 11 — KeyboardAvoidingView with ScrollView</h3>
<pre><code class="language-tsx">&lt;KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}&gt;
  &lt;ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16 }}&gt;
    &lt;Form /&gt;
  &lt;/ScrollView&gt;
&lt;/KeyboardAvoidingView&gt;</code></pre>

<h3>Example 12 — nested text with different styles</h3>
<pre><code class="language-tsx">&lt;Text style={{ fontSize: 16 }}&gt;
  Welcome, &lt;Text style={{ fontWeight: 'bold' }}&gt;{user.name}&lt;/Text&gt;!
  {'\n'}
  &lt;Text style={{ color: '#666' }}&gt;You have {unread} new messages.&lt;/Text&gt;
&lt;/Text&gt;</code></pre>

<h3>Example 13 — Pressable with style function</h3>
<pre><code class="language-tsx">&lt;Pressable style={({ pressed }) =&gt; ({
  backgroundColor: pressed ? '#e0e0e0' : '#f5f5f5',
  padding: 12,
  borderRadius: 8,
})}&gt;
  &lt;Text&gt;Tap me&lt;/Text&gt;
&lt;/Pressable&gt;</code></pre>

<h3>Example 14 — handling keyboard dismiss</h3>
<pre><code class="language-tsx">import { Keyboard, TouchableWithoutFeedback } from 'react-native';
&lt;TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}&gt;
  &lt;View&gt;&lt;TextInput /&gt;&lt;/View&gt;
&lt;/TouchableWithoutFeedback&gt;</code></pre>

<h3>Example 15 — FlashList for long list</h3>
<pre><code class="language-tsx">import { FlashList } from '@shopify/flash-list';
&lt;FlashList
  data={items}
  renderItem={({ item }) =&gt; &lt;Card item={item} /&gt;}
  estimatedItemSize={120}
  keyExtractor={(item) =&gt; item.id}
/&gt;</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. FlexDirection default is <code>column</code>, not <code>row</code></h3>
<p>Web muscle memory fails here. Every time you create a horizontal layout, set <code>flexDirection: 'row'</code> explicitly.</p>

<h3>2. <code>flex: 1</code> vs <code>flexGrow: 1</code></h3>
<p>RN's <code>flex: 1</code> is shorthand for <code>flexGrow: 1, flexShrink: 1, flexBasis: 0%</code>. On web, <code>flex: 1</code> is similar but with different default basis. Test layout intentions.</p>

<h3>3. Text can't contain Views (but can be tapped)</h3>
<pre><code class="language-tsx">&lt;Text onPress={() =&gt; {}}&gt; Tap me &lt;/Text&gt;  // OK
&lt;Text&gt;&lt;View /&gt;&lt;/Text&gt; // error
&lt;Text&gt;&lt;Image /&gt;&lt;/Text&gt; // OK — Image is a special child allowed inline</code></pre>

<h3>4. Image doesn't auto-size</h3>
<p>Unlike HTML <code>&lt;img&gt;</code>, RN Image defaults to zero size unless you give <code>width</code> and <code>height</code> or use <code>Image.getSize()</code> to compute. <code>aspectRatio</code> + one dimension also works.</p>

<h3>5. Network images and CORS</h3>
<p>No CORS on native (it's the OS, not a browser). But: certain hosts require User-Agent or Authorization headers. Use Image's <code>source={{ uri, headers }}</code> prop.</p>

<h3>6. FlatList requires stable keys</h3>
<p>Index keys break virtualization hint for items that move. Always use a stable ID from your data.</p>

<h3>7. FlatList onEndReached fires repeatedly</h3>
<p>Until data grows past the threshold, each scroll bounces can re-trigger. Guard with a "loading" flag:</p>
<pre><code class="language-tsx">const onEnd = () =&gt; { if (!isLoading &amp;&amp; hasMore) loadMore(); };</code></pre>

<h3>8. ScrollView inside ScrollView</h3>
<p>Nested scrolling is flaky. One scrolls, the other may not. Use <code>nestedScrollEnabled</code> (Android) and design around — horizontal carousel inside vertical scroll usually OK; vertical in vertical is fragile.</p>

<h3>9. Pressable's onPress fires on release, not press</h3>
<p>onPress is treated as a "tap" (press + release within bounds). Use <code>onPressIn</code> / <code>onPressOut</code> for press/release moments.</p>

<h3>10. TextInput's autocorrect on iOS</h3>
<p>Sometimes autocorrect suggestions persist after clearing value. Toggle <code>autoCorrect={false}</code>, or briefly blur and focus the input.</p>

<h3>11. Multiline TextInput scrolling</h3>
<p>Multiline on iOS scrolls within; on Android, scrolls the parent. For consistency use <code>scrollEnabled</code> and wrap in ScrollView with <code>keyboardShouldPersistTaps</code>.</p>

<h3>12. Modal statusBar behavior</h3>
<p>iOS modal covers status bar; Android does not by default. Use <code>statusBarTranslucent</code> prop on Modal for Android.</p>

<h3>13. SafeAreaView on Android</h3>
<p>Built-in <code>SafeAreaView</code> from <code>react-native</code> is iOS-focused. Use <code>react-native-safe-area-context</code> for cross-platform insets.</p>

<h3>14. KeyboardAvoidingView can't always fix layout</h3>
<p>Adjusts view size/margin based on keyboard. But deeply nested TextInputs, modal overlays, or ScrollView interactions often need custom handling or keyboard-controller.</p>

<h3>15. Text numberOfLines differences</h3>
<p>Ellipsis behavior varies. <code>numberOfLines={1}</code> on Android sometimes cuts mid-character. <code>ellipsizeMode='tail'</code> is default but <code>middle</code>, <code>head</code> exist.</p>

<h3>16. Image caching behavior</h3>
<p>Built-in Image uses a weakly-managed cache. For disk caching with limits, size, offline — use <code>expo-image</code> or <code>react-native-fast-image</code>.</p>

<h3>17. onLayout fires multiple times</h3>
<p>onLayout fires on mount AND on every layout change (keyboard, rotation). Guard or debounce if you use it for measurements.</p>

<h3>18. Pressable's hitSlop default</h3>
<p>No default hit expansion. Make taps more reliable for small icons with <code>hitSlop={{top:10,bottom:10,left:10,right:10}}</code>.</p>

<h3>19. FlatList sticky headers</h3>
<p><code>stickyHeaderIndices</code> prop makes certain indices sticky. On Android, sometimes flickers; test thoroughly.</p>

<h3>20. getItemLayout mismatch</h3>
<p>If you declare <code>getItemLayout</code> with wrong heights, FlatList scrolls to wrong positions and items appear misplaced. Very careful measurement required or skip it.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — ScrollView with 1000 children</h3>
<p>Mounts all items; main thread blocks at load. Always FlatList/FlashList for long lists.</p>

<h3>Anti-pattern 2 — index as FlatList keys</h3>
<p>Item movements re-key every item → entire list remounts. Use stable ids.</p>

<h3>Anti-pattern 3 — inline renderItem</h3>
<pre><code class="language-tsx">&lt;FlatList renderItem={({item}) =&gt; &lt;Row data={item}/&gt;} /&gt;
// New fn every parent render → Row can't memo. Extract to useCallback.</code></pre>

<h3>Anti-pattern 4 — non-memoized list row</h3>
<p>Without <code>React.memo</code>, every scroll re-renders all visible rows. Wrap Row.</p>

<h3>Anti-pattern 5 — over-nesting Views for styling</h3>
<p>Deep View trees cost layout time. Flatten when possible; use padding on parent instead of wrapper views.</p>

<h3>Anti-pattern 6 — inline styles created every render</h3>
<pre><code class="language-tsx">&lt;View style={{ flex: 1 }} /&gt; // new object per render
// For static styles, use StyleSheet.create — references are stable.</code></pre>

<h3>Anti-pattern 7 — synchronous heavy work in onPress</h3>
<p>Press handler runs on JS thread. 200ms of work = perceived delay. Defer with setTimeout(0) or InteractionManager.</p>

<h3>Anti-pattern 8 — built-in Image for production</h3>
<p>No advanced caching, no placeholders, no blurhash. Use expo-image or fast-image.</p>

<h3>Anti-pattern 9 — not handling image loading errors</h3>
<p>Broken network image shows empty box. Provide <code>defaultSource</code> or an <code>onError</code>-driven fallback.</p>

<h3>Anti-pattern 10 — using Touchable* over Pressable</h3>
<p>TouchableOpacity still works but has limitations. Pressable is the modern API; plan migration.</p>

<h3>Anti-pattern 11 — ignoring Android ripple</h3>
<p>Android design-language expects a ripple on tap. Use Pressable's <code>android_ripple</code>.</p>

<h3>Anti-pattern 12 — custom Modal when navigation offers it</h3>
<p>React Navigation's <code>presentation: 'modal'</code> gives native transitions. Save Modal for edge cases.</p>

<h3>Anti-pattern 13 — TextInput value race</h3>
<pre><code class="language-tsx">&lt;TextInput value={value} onChangeText={(t) =&gt; setValue(t.toUpperCase())} /&gt;
// User types fast: native value ≠ JS state briefly, cursor jumps.
// Use uncontrolled + onEndEditing for transformations.</code></pre>

<h3>Anti-pattern 14 — ignoring safe area</h3>
<p>Content under notch / home bar on iPhone X+ users. Test on physical or simulator with notch.</p>

<h3>Anti-pattern 15 — assuming iOS and Android behave the same</h3>
<p>Keyboard, shadow, status bar, animations, back button — all differ. Develop and test on both platforms per feature.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. When do you use ScrollView vs FlatList?</div>
  <div class="qa-answer">
    <p><strong>ScrollView</strong>: small content with known bounds (settings page, form). Mounts all children upfront.</p>
    <p><strong>FlatList</strong>: long lists, items can be many. Virtualized — only visible items mounted.</p>
    <p>For &gt; ~20 items or dynamic data, always FlatList. For even better perf, FlashList (Shopify) with its <code>estimatedItemSize</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. What props optimize a FlatList?</div>
  <div class="qa-answer">
    <ul>
      <li><code>keyExtractor</code> with stable id — avoids remount on reorder.</li>
      <li><code>renderItem</code> wrapped in <code>useCallback</code>; item component in <code>React.memo</code>.</li>
      <li><code>getItemLayout</code> when items are fixed height — skips measurement.</li>
      <li><code>initialNumToRender</code>, <code>maxToRenderPerBatch</code>, <code>windowSize</code> — tune render budget.</li>
      <li><code>removeClippedSubviews</code> — Android optimization to unmount off-screen views.</li>
    </ul>
    <p>For heavier lists, switch to FlashList.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Why Pressable over TouchableOpacity?</div>
  <div class="qa-answer">
    <p>Pressable is the unified modern API: exposes all press states (pressed, hovered, focused) via function-as-child or style-function. Cross-platform consistency. Supports hitSlop, android_ripple, onPressIn/Out/Long. Touchables are kept for compatibility but aren't the recommended default anymore.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. How do you handle the keyboard?</div>
  <div class="qa-answer">
    <p>Options, rough quality order:</p>
    <ol>
      <li><code>react-native-keyboard-controller</code> — modern, consistent across platforms, many hooks.</li>
      <li><code>KeyboardAvoidingView</code> — built-in; flaky on Android with nested scrolls.</li>
      <li>Manual with <code>Keyboard</code> API: listen to <code>keyboardDidShow</code> / <code>Hide</code>, compute insets.</li>
    </ol>
    <p>Also: <code>keyboardShouldPersistTaps="handled"</code> on ScrollView/FlatList so users can tap controls without dismissing first.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. How do you handle safe area (notches, home indicator)?</div>
  <div class="qa-answer">
    <p>Wrap app in <code>SafeAreaProvider</code> from <code>react-native-safe-area-context</code>. Use <code>useSafeAreaInsets</code> to get {top, bottom, left, right} per screen. Apply as padding. The built-in <code>SafeAreaView</code> from react-native is iOS-only and less reliable.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Why can't I put text directly in a View?</div>
  <div class="qa-answer">
    <p>RN requires text to be inside a <code>&lt;Text&gt;</code> component so that font, color, line-height, measurement can be resolved. A View doesn't have text-rendering semantics. Putting a string directly in a View throws: "Text strings must be rendered within a &lt;Text&gt; component." HTML <code>&lt;div&gt;Hi&lt;/div&gt;</code> has no analog — you always wrap in Text.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How does cross-platform shadow work?</div>
  <div class="qa-answer">
    <p>iOS uses <code>shadowColor</code>, <code>shadowOffset</code>, <code>shadowOpacity</code>, <code>shadowRadius</code>. Android uses <code>elevation</code> (renders a material-design shadow). You typically set all six and it works on both. Note: on Android, <code>elevation</code> also affects z-order, and transparent backgrounds may not show shadow. For arbitrary shadows, libs like <code>react-native-shadow-2</code> help.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. What's the difference between Image and expo-image / fast-image?</div>
  <div class="qa-answer">
    <p>Built-in Image: basic local + network images. Minimal cache. No placeholder. <strong>expo-image</strong>: modern wrapper, supports blurhash/thumbhash placeholders, progressive loading, memory+disk cache with quotas, Fabric-ready, broad format support. <strong>react-native-fast-image</strong>: older but widely adopted, priority, cache control, good GIF/WebP. For production, one of these two, not built-in.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. How do you measure the layout of a component?</div>
  <div class="qa-answer">
    <p>Options:</p>
    <ul>
      <li><code>onLayout</code> prop — fires after layout, gives <code>{x, y, width, height}</code>. Simplest.</li>
      <li><code>ref.current.measure(callback)</code> — async on old arch, sync on new arch (Fabric).</li>
      <li><code>ref.current.measureInWindow(callback)</code> — absolute coords.</li>
    </ul>
    <p>Fabric allows synchronous <code>measure</code> inside render-adjacent code; bridge-mode required callbacks.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. How would you build a pull-to-refresh + infinite-scroll list?</div>
  <div class="qa-answer">
<pre><code class="language-tsx">&lt;FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(i) =&gt; i.id}
  refreshing={refreshing}
  onRefresh={refresh}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
  ListFooterComponent={isFetchingMore ? &lt;ActivityIndicator /&gt; : null}
/&gt;</code></pre>
    <p>Pair with React Query's <code>useInfiniteQuery</code> for caching + dedupe. Guard <code>onEndReached</code> so it doesn't fire while already loading.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. How does styling work in RN?</div>
  <div class="qa-answer">
    <p>Styles are plain JS objects, not CSS. Use <code>StyleSheet.create</code> for performance (references are stable, validated). No cascading except for Text children inheriting Text parent's font styles. No media queries — use <code>Dimensions</code>/<code>useWindowDimensions</code>. No <code>:hover</code> (mobile). Pseudo-class-like behavior via Pressable's function-child. For a design system, consider Tailwind-style libs (NativeWind, Tamagui, Dripsy).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Describe the lifecycle of a FlatList item.</div>
  <div class="qa-answer">
    <p>FlatList tracks visible + buffered items. As you scroll, items entering the window are <strong>mounted</strong> (React renders); items leaving are <strong>unmounted</strong> (React destroys). This means per-item state (local useState, effect subscriptions) is lost when scrolled out. FlashList <strong>recycles</strong> native views instead of unmounting — the component instance stays, only props update. Critical difference for e.g. media playback state within items.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. How do you handle platform differences?</div>
  <div class="qa-answer">
    <ul>
      <li><code>Platform.OS</code> — 'ios' or 'android'.</li>
      <li><code>Platform.select({ ios: ..., android: ..., default: ... })</code>.</li>
      <li>File extensions: <code>Foo.ios.tsx</code> / <code>Foo.android.tsx</code> — Metro picks per platform.</li>
      <li>Platform-specific components (some built-in APIs are iOS-only or Android-only; check docs).</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. What's <code>hitSlop</code> for?</div>
  <div class="qa-answer">
    <p>Expands the touchable area of a component beyond its visual bounds without changing layout. For icons or small buttons, a bare tap target is often smaller than the 44×44 minimum recommended by Apple's HIG. <code>hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}</code> grows the invisible hit region. Supported on Pressable and Touchables.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. FlashList vs FlatList — when?</div>
  <div class="qa-answer">
    <p>FlashList's recycling is a win for:</p>
    <ul>
      <li>Long lists (hundreds to thousands).</li>
      <li>Uniform or few-type rows.</li>
      <li>Scroll-heavy UX.</li>
    </ul>
    <p>FlatList is fine for:</p>
    <ul>
      <li>Short lists (&lt; 30 items).</li>
      <li>Heavy dynamic composition.</li>
      <li>When item state must not persist across scroll-out (counterintuitive — FlatList unmounts, FlashList doesn't).</li>
    </ul>
    <p>Drop-in migration is usually easy. Requires <code>estimatedItemSize</code>.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You name the core primitives and their native counterparts.</li>
    <li>You optimize FlatList (keys, memo, getItemLayout) or reach for FlashList.</li>
    <li>You use Pressable as the default touch handler.</li>
    <li>You handle safe area via <code>react-native-safe-area-context</code>.</li>
    <li>You call out platform differences (shadow, keyboard, ripple).</li>
    <li>You use expo-image or fast-image in production.</li>
    <li>You know Text inheritance rules.</li>
    <li>You know FlatList unmounts off-screen items; FlashList recycles.</li>
  </ul>
</div>
`}

]
});
