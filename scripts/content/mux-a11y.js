window.PREP_SITE.registerTopic({
  id: 'mux-a11y',
  module: 'mobile-ux',
  title: 'Mobile Accessibility',
  estimatedReadTime: '50 min',
  tags: ['accessibility', 'a11y', 'voiceover', 'talkback', 'wcag', 'mobile', 'react-native', 'aria', 'screen-reader', 'dynamic-type'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>Mobile accessibility is how users with disabilities — visual, motor, cognitive, or hearing — actually use your app. It's also a legal requirement (ADA in the US, EAA in EU from June 2025, AODA in Canada, equivalent laws worldwide), and a discriminator in App Store / Play Store reviews. For React Native, it's a thin layer of well-named props that map to native iOS UIAccessibility and Android AccessibilityNodeInfo APIs — easy to do, easy to skip, expensive to retrofit.</p>
<ul>
  <li><strong>Three big screen readers:</strong> VoiceOver (iOS), TalkBack (Android), VoiceControl + Switch Control. Test with each at least once per release.</li>
  <li><strong>The five RN a11y props that matter most:</strong> <code>accessibilityLabel</code>, <code>accessibilityRole</code>, <code>accessibilityState</code>, <code>accessibilityHint</code>, <code>accessibilityActions</code>.</li>
  <li><strong>Dynamic Type / font scaling:</strong> users can scale text 2–3×. Layouts must reflow.</li>
  <li><strong>Touch targets:</strong> 44pt (iOS) / 48dp (Android) minimum.</li>
  <li><strong>Color contrast:</strong> 4.5:1 for body text, 3:1 for large text and UI components (WCAG 2.2 AA).</li>
  <li><strong>Reduce Motion:</strong> kill non-essential animation when the user prefers it.</li>
  <li><strong>Captions / transcripts:</strong> for video, audio, and live media.</li>
  <li><strong>Order matters:</strong> the focus order screen readers traverse must be logical, not visual.</li>
  <li><strong>RN reality:</strong> default <code>View</code> isn't focusable by screen readers; you opt in. Custom gestures need <code>accessibilityActions</code> alternatives.</li>
</ul>
<p><strong>Mantra:</strong> "Test with VoiceOver and TalkBack. Type the labels. Respect the system settings. Ship for everyone."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What "accessibility" means in mobile</h3>
<p>Accessibility (often abbreviated <strong>a11y</strong>) means designing and building so that people with disabilities can use the app. The most common categories:</p>
<table>
  <thead><tr><th>Disability type</th><th>How users interact</th><th>What you must support</th></tr></thead>
  <tbody>
    <tr><td>Blind / low vision</td><td>Screen reader (VoiceOver, TalkBack)</td><td>Labels, roles, state, focus order, captions</td></tr>
    <tr><td>Low vision (not blind)</td><td>Larger text, higher contrast, zoom</td><td>Dynamic Type, contrast 4.5:1+, layout reflow</td></tr>
    <tr><td>Motor impairment</td><td>Switch Control, voice, large tap targets</td><td>≥ 44pt taps, no time-pressured inputs, gesture alternatives</td></tr>
    <tr><td>Cognitive disability</td><td>Plain language, predictable patterns</td><td>Clear copy, error recovery, no flashing content</td></tr>
    <tr><td>Deaf / hard of hearing</td><td>Captions, transcripts, visual cues</td><td>Captions for video, no audio-only feedback</td></tr>
    <tr><td>Photosensitive</td><td>Reduced motion / no flashing</td><td>Respect Reduce Motion, no &gt; 3 flashes/sec</td></tr>
  </tbody>
</table>

<h3>Why it matters</h3>
<table>
  <thead><tr><th>Reason</th><th>Detail</th></tr></thead>
  <tbody>
    <tr><td>Legal exposure</td><td>ADA Title III lawsuits in the US average $35k settlements. EU's EAA (effective June 28, 2025) covers all consumer apps. Domino's, Target, Beyoncé — all sued and lost over a11y.</td></tr>
    <tr><td>Market reach</td><td>~15% of the global population has some disability. ~7M VoiceOver users on iOS alone. Aging population grows the share.</td></tr>
    <tr><td>App Store / Play Store reviews</td><td>Apple's HIG explicitly grades on a11y. Apps cited in editorial features tend to ace it.</td></tr>
    <tr><td>Better defaults for everyone</td><td>Captions help in noisy environments. Larger taps help fat fingers. Dark mode helps everyone in low light.</td></tr>
    <tr><td>Procurement</td><td>Government contracts (US Section 508) require WCAG conformance. Enterprise buyers ask for VPATs.</td></tr>
    <tr><td>SEO + indexing analogy</td><td>The same semantic structure that helps screen readers helps app indexing, deep links, voice assistants.</td></tr>
  </tbody>
</table>

<h3>What "good a11y on RN" looks like</h3>
<ul>
  <li>Every interactive element has an <code>accessibilityLabel</code> or text content a screen reader can announce.</li>
  <li>Roles are correct: <code>button</code> for buttons, <code>link</code> for links, <code>header</code> for headings.</li>
  <li>State changes (loading, selected, disabled) communicated via <code>accessibilityState</code>.</li>
  <li>Focus order matches reading order — not visual order if they differ.</li>
  <li>Custom gestures expose <code>accessibilityActions</code> (e.g., swipe-to-delete also reachable via VoiceOver actions menu).</li>
  <li>Forms have <code>accessibilityLabel</code> and <code>accessibilityHint</code> for help text; errors announced with <code>liveRegion</code>.</li>
  <li>Tap targets ≥ 44pt / 48dp.</li>
  <li>Color contrast meets WCAG 2.2 AA (4.5:1 body, 3:1 large + UI).</li>
  <li>Dynamic Type scales — layout doesn't break at AX5.</li>
  <li>Reduce Motion respected — animations gated.</li>
  <li>Modals trap focus inside; ESC / back closes.</li>
</ul>

<h3>What "bad a11y on RN" looks like</h3>
<ul>
  <li>VoiceOver reads "button button button" because every interactive element is unlabeled.</li>
  <li>Custom <code>View</code> with onPress — invisible to screen readers (no role).</li>
  <li>Color is the only signal for state (red for error with no icon or text).</li>
  <li>Font size hard-coded; large-text users get truncated content.</li>
  <li>Loading spinner with no <code>aria-busy</code> equivalent.</li>
  <li>Modal that doesn't trap focus — VoiceOver moves to background content.</li>
  <li>Toast that auto-dismisses before screen reader announces it.</li>
  <li>Error message appears visually but is invisible to screen readers (no live region).</li>
  <li>Gesture-only actions (swipe-to-delete with no alternative).</li>
  <li>Video without captions.</li>
</ul>

<h3>Conformance levels (WCAG 2.2)</h3>
<table>
  <thead><tr><th>Level</th><th>Means</th><th>Practical bar</th></tr></thead>
  <tbody>
    <tr><td>A</td><td>Minimum; product is technically usable</td><td>Skip this and you fail; everyone targets at least this.</td></tr>
    <tr><td>AA</td><td>Standard; most laws + procurement reference</td><td>Default target for shipped products.</td></tr>
    <tr><td>AAA</td><td>Best-in-class; not always achievable for all content</td><td>Aspirational; specific niches (gov, healthcare) require it.</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The four WCAG principles (POUR)</h3>
<table>
  <thead><tr><th>Principle</th><th>Means</th><th>Mobile examples</th></tr></thead>
  <tbody>
    <tr><td>Perceivable</td><td>User can perceive the content (vision, hearing, touch)</td><td>Alt text, captions, sufficient contrast, Dynamic Type</td></tr>
    <tr><td>Operable</td><td>User can operate the UI (touch, voice, switch)</td><td>Tap targets, no time pressure, gesture alternatives</td></tr>
    <tr><td>Understandable</td><td>User can understand content + behavior</td><td>Plain language, predictable nav, helpful errors</td></tr>
    <tr><td>Robust</td><td>Works with assistive tech now and in future</td><td>Use system primitives; semantic roles; not custom DOM</td></tr>
  </tbody>
</table>

<h3>Screen readers — the dominant a11y tool</h3>
<table>
  <thead><tr><th>Tool</th><th>Platform</th><th>Activation</th></tr></thead>
  <tbody>
    <tr><td>VoiceOver</td><td>iOS / iPadOS / macOS</td><td>Settings → Accessibility → VoiceOver, or triple-press side button</td></tr>
    <tr><td>TalkBack</td><td>Android</td><td>Settings → Accessibility → TalkBack, or volume-key shortcut</td></tr>
    <tr><td>Voice Control</td><td>iOS / macOS</td><td>Settings → Accessibility → Voice Control. "Tap login button"</td></tr>
    <tr><td>Switch Control</td><td>iOS / Android</td><td>One or more external switches; sequential focus traversal</td></tr>
    <tr><td>Spoken Content (iOS)</td><td>iOS</td><td>Highlights + reads selected text — for users who don't need full screen reader</td></tr>
  </tbody>
</table>

<h3>How a screen reader announces an element</h3>
<p>VoiceOver / TalkBack focus an element and read out, in order:</p>
<ol>
  <li><strong>Label</strong>: what the element is. From <code>accessibilityLabel</code> or visible text.</li>
  <li><strong>Value</strong>: current state. From <code>accessibilityValue</code> ("3 of 5 selected", "$24.50").</li>
  <li><strong>Role</strong>: what kind of element. From <code>accessibilityRole</code> ("button", "link", "header").</li>
  <li><strong>State</strong>: dynamic state. From <code>accessibilityState</code> ("disabled", "selected", "expanded").</li>
  <li><strong>Hint</strong>: optional what-happens-next. From <code>accessibilityHint</code>. Spoken last after a pause.</li>
</ol>
<p>Example: A "Like" button on a post with 14 likes already pressed:<br><em>"Like, 14, button, selected. Double-tap to unlike."</em></p>

<h3>The RN a11y prop catalog</h3>
<table>
  <thead><tr><th>Prop</th><th>Use for</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td><code>accessibilityLabel</code></td><td>What the element is</td><td><code>"Compose new email"</code></td></tr>
    <tr><td><code>accessibilityHint</code></td><td>What happens on activation (only when not obvious)</td><td><code>"Opens new message screen"</code></td></tr>
    <tr><td><code>accessibilityRole</code></td><td>Element type</td><td><code>"button"</code> / <code>"link"</code> / <code>"header"</code> / <code>"image"</code> / <code>"none"</code></td></tr>
    <tr><td><code>accessibilityState</code></td><td>Current dynamic state</td><td><code>{ disabled, selected, checked, busy, expanded }</code></td></tr>
    <tr><td><code>accessibilityValue</code></td><td>Current value (sliders, etc.)</td><td><code>{ min: 0, max: 100, now: 30, text: "30 percent" }</code></td></tr>
    <tr><td><code>accessibilityActions</code></td><td>Custom actions for screen-reader users</td><td><code>[{ name: "delete", label: "Delete email" }]</code></td></tr>
    <tr><td><code>accessible</code></td><td>Group children into one focusable element</td><td><code>true</code> on a card; reads label + content as one unit</td></tr>
    <tr><td><code>accessibilityElementsHidden</code> (iOS)</td><td>Hide element from VoiceOver but visible</td><td><code>true</code> on decorative or duplicate elements</td></tr>
    <tr><td><code>importantForAccessibility</code> (Android)</td><td>Same as above for TalkBack</td><td><code>"no-hide-descendants"</code></td></tr>
    <tr><td><code>accessibilityLiveRegion</code> (Android)</td><td>Announce dynamic content changes</td><td><code>"polite"</code> / <code>"assertive"</code></td></tr>
    <tr><td><code>accessibilityViewIsModal</code> (iOS)</td><td>Trap VO inside a modal</td><td><code>true</code> on modal containers</td></tr>
    <tr><td><code>onAccessibilityEscape</code></td><td>Z-shape gesture to dismiss</td><td>Close modal callback</td></tr>
    <tr><td><code>accessibilityLanguage</code></td><td>Override locale for pronunciation</td><td><code>"ja-JP"</code> for a Japanese phrase</td></tr>
  </tbody>
</table>

<h3>Roles every RN engineer should memorise</h3>
<ul>
  <li><code>button</code> — anything tappable that performs an action</li>
  <li><code>link</code> — navigates somewhere (web link or app deep link)</li>
  <li><code>header</code> — section heading; users can swipe by header in VoiceOver</li>
  <li><code>image</code> — decorative or content image; pair with label or set <code>accessible={false}</code></li>
  <li><code>imagebutton</code> — image that is also tappable</li>
  <li><code>text</code> — non-interactive text</li>
  <li><code>search</code> — search input</li>
  <li><code>checkbox</code> / <code>radio</code> / <code>switch</code> — form controls</li>
  <li><code>tab</code> / <code>tablist</code> — tab navigation</li>
  <li><code>spinbutton</code> — increment/decrement value</li>
  <li><code>menu</code> / <code>menuitem</code> — popover menu</li>
  <li><code>none</code> / <code>"none"</code> — explicitly no role; for purely visual containers</li>
  <li><code>summary</code> — collapse/expand summary</li>
  <li><code>alert</code> — important announcement (errors)</li>
  <li><code>progressbar</code> — loading progress</li>
</ul>

<h3>Color contrast (WCAG 2.2 AA)</h3>
<table>
  <thead><tr><th>Use</th><th>Min ratio</th><th>Means</th></tr></thead>
  <tbody>
    <tr><td>Body text (&lt; 18pt regular or &lt; 14pt bold)</td><td>4.5:1</td><td>e.g., #595959 on #fff = 4.5:1</td></tr>
    <tr><td>Large text (≥ 18pt regular or ≥ 14pt bold)</td><td>3:1</td><td>Headlines</td></tr>
    <tr><td>UI components + graphical objects</td><td>3:1</td><td>Icons, button outlines, focus indicators</td></tr>
  </tbody>
</table>
<p>Tools: Stark plugin in Figma, <code>accessible-colors</code>, Chrome DevTools contrast picker. RN runtime: no built-in checker; integrate <code>react-native-accessibility-engine</code> or test in Storybook with @storybook/addon-a11y.</p>

<h3>Touch target sizes (Apple + Google)</h3>
<table>
  <thead><tr><th>Platform</th><th>Min size</th><th>Source</th></tr></thead>
  <tbody>
    <tr><td>iOS</td><td>44 × 44 pt</td><td>HIG</td></tr>
    <tr><td>Android</td><td>48 × 48 dp</td><td>Material 3</td></tr>
    <tr><td>WCAG 2.2 AAA</td><td>44 × 44 CSS px</td><td>WCAG 2.2</td></tr>
  </tbody>
</table>
<p>Use <code>hitSlop</code> on RN <code>Pressable</code> to expand touchable area without growing visible.</p>

<h3>Dynamic Type / font scaling</h3>
<ul>
  <li><strong>iOS:</strong> Settings → Display → Text Size; Accessibility → Larger Text Sizes for AX1–AX5 (up to ~310% of default).</li>
  <li><strong>Android:</strong> Settings → Display → Font Size (50–200%); Accessibility → Display Size (UI scaling, separate).</li>
  <li>RN <code>Text</code> respects <code>allowFontScaling</code> (default true). Pin to <code>false</code> only with strong justification (rare).</li>
  <li>Layouts must reflow: variable-height rows, wrapping containers, scrollable bodies.</li>
  <li>Test at AX5 (iOS) + 200% (Android) — most layouts break.</li>
</ul>

<h3>Reduce Motion</h3>
<ul>
  <li>iOS: Settings → Accessibility → Motion → Reduce Motion.</li>
  <li>Android: Settings → Accessibility → Remove animations.</li>
  <li>RN: <code>AccessibilityInfo.isReduceMotionEnabled()</code> → fall back to instant transitions or simple fades.</li>
  <li>Vestibular conditions (motion sickness, vertigo) — parallax / large transitions can cause real symptoms.</li>
</ul>

<h3>Other system settings to respect</h3>
<table>
  <thead><tr><th>Setting</th><th>RN check</th></tr></thead>
  <tbody>
    <tr><td>Reduce Transparency (iOS)</td><td><code>AccessibilityInfo.isReduceTransparencyEnabled()</code></td></tr>
    <tr><td>Increase Contrast (iOS)</td><td><code>AccessibilityInfo.isHighTextContrastEnabled()</code></td></tr>
    <tr><td>Bold Text (iOS)</td><td><code>AccessibilityInfo.isBoldTextEnabled()</code></td></tr>
    <tr><td>Invert Colors / Smart Invert</td><td>Don't fight; use SF Symbols (auto-inverts), avoid hard-coded image colors</td></tr>
    <tr><td>Grayscale</td><td>Make sure color isn't the only signal (use icon + text)</td></tr>
    <tr><td>VoiceOver / TalkBack on?</td><td><code>AccessibilityInfo.isScreenReaderEnabled()</code> + listener</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Labeling buttons</h3>
<pre><code class="language-typescript">// BAD — VoiceOver reads "image button"
&lt;Pressable onPress={onShare}&gt;
  &lt;Image source={shareIcon} /&gt;
&lt;/Pressable&gt;

// GOOD — explicit label and role
&lt;Pressable
  onPress={onShare}
  accessibilityLabel="Share this article"
  accessibilityRole="button"
&gt;
  &lt;Image source={shareIcon} accessible={false} /&gt;
&lt;/Pressable&gt;
</code></pre>

<h3>Grouping content (cards)</h3>
<pre><code class="language-typescript">// BAD — VoiceOver moves through each child individually
&lt;View onTouchEnd={onPress}&gt;
  &lt;Image source={post.image} /&gt;
  &lt;Text&gt;{post.title}&lt;/Text&gt;
  &lt;Text&gt;{post.author}&lt;/Text&gt;
&lt;/View&gt;

// GOOD — grouped as one focusable element with combined label
&lt;Pressable
  onPress={onPress}
  accessible={true}
  accessibilityLabel={\`\${post.title}, by \${post.author}\`}
  accessibilityRole="button"
  accessibilityHint="Opens post detail"
&gt;
  &lt;Image source={post.image} accessible={false} /&gt;
  &lt;Text&gt;{post.title}&lt;/Text&gt;
  &lt;Text&gt;{post.author}&lt;/Text&gt;
&lt;/Pressable&gt;
</code></pre>

<h3>State (loading, selected, disabled)</h3>
<pre><code class="language-typescript">&lt;Pressable
  onPress={onSave}
  disabled={isLoading}
  accessibilityRole="button"
  accessibilityLabel="Save changes"
  accessibilityState={{ disabled: isLoading, busy: isLoading }}
&gt;
  {isLoading ? &lt;Spinner /&gt; : &lt;Text&gt;Save&lt;/Text&gt;}
&lt;/Pressable&gt;
</code></pre>

<h3>Forms with labels and errors</h3>
<pre><code class="language-typescript">function EmailField({ value, onChange, error }) {
  return (
    &lt;View&gt;
      &lt;Text accessibilityRole="text"&gt;Email&lt;/Text&gt;
      &lt;TextInput
        value={value}
        onChangeText={onChange}
        accessibilityLabel="Email"
        accessibilityHint="Enter your email address"
        autoComplete="email"
        keyboardType="email-address"
        autoCapitalize="none"
        accessibilityState={{ invalid: !!error }}
      /&gt;
      {error &amp;&amp; (
        &lt;Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={styles.error}
        &gt;
          {error}
        &lt;/Text&gt;
      )}
    &lt;/View&gt;
  );
}
</code></pre>
<p><code>accessibilityRole="alert"</code> + <code>liveRegion="polite"</code> ensures VoiceOver / TalkBack reads the error when it appears, without rudely interrupting current speech.</p>

<h3>Custom gesture alternatives</h3>
<pre><code class="language-typescript">function EmailRow({ email, onArchive, onDelete }) {
  return (
    &lt;Swipeable
      renderRightActions={() =&gt; &lt;DeleteAction onPress={onDelete} /&gt;}
      renderLeftActions={() =&gt; &lt;ArchiveAction onPress={onArchive} /&gt;}
    &gt;
      &lt;Pressable
        accessible
        accessibilityLabel={email.subject}
        accessibilityRole="button"
        accessibilityActions={[
          { name: 'archive', label: 'Archive' },
          { name: 'delete',  label: 'Delete' },
        ]}
        onAccessibilityAction={(e) =&gt; {
          if (e.nativeEvent.actionName === 'archive') onArchive();
          if (e.nativeEvent.actionName === 'delete')  onDelete();
        }}
      &gt;
        &lt;EmailRowContent {...email} /&gt;
      &lt;/Pressable&gt;
    &lt;/Swipeable&gt;
  );
}
</code></pre>
<p>Now VoiceOver users get a "rotor" of "archive" / "delete" actions instead of being forced to swipe.</p>

<h3>Modal focus trap</h3>
<pre><code class="language-typescript">&lt;View
  accessibilityViewIsModal={true} // iOS
  importantForAccessibility="yes" // Android
  accessible={false} // group container, not focusable itself
&gt;
  &lt;Text accessibilityRole="header"&gt;Delete photo?&lt;/Text&gt;
  &lt;Text&gt;This cannot be undone.&lt;/Text&gt;
  &lt;Button title="Cancel" onPress={onCancel} /&gt;
  &lt;Button title="Delete" onPress={onDelete} /&gt;
&lt;/View&gt;
</code></pre>

<h3>Reduce Motion</h3>
<pre><code class="language-typescript">import { useReducedMotion } from 'react-native-reanimated';

function AnimatedCard({ children }) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(0);

  useEffect(() =&gt; {
    opacity.value = withTiming(1, { duration: reduceMotion ? 0 : 300 });
  }, [reduceMotion]);

  const style = useAnimatedStyle(() =&gt; ({ opacity: opacity.value }));
  return &lt;Animated.View style={style}&gt;{children}&lt;/Animated.View&gt;;
}
</code></pre>

<h3>Detecting screen reader on</h3>
<pre><code class="language-typescript">import { AccessibilityInfo } from 'react-native';

function useScreenReader() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() =&gt; {
    AccessibilityInfo.isScreenReaderEnabled().then(setEnabled);
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setEnabled);
    return () =&gt; sub.remove();
  }, []);
  return enabled;
}

// Use it to swap interactive patterns
const screenReaderOn = useScreenReader();
const SkipPagination = screenReaderOn ? PaginationButton : PaginationDots;
</code></pre>

<h3>Programmatic announcements</h3>
<pre><code class="language-typescript">import { AccessibilityInfo } from 'react-native';

// "Item added to cart"
AccessibilityInfo.announceForAccessibility('Added to cart');
</code></pre>
<p>Use sparingly — important state changes only. Spamming this trains users to ignore your app.</p>

<h3>Focus management</h3>
<pre><code class="language-typescript">import { findNodeHandle, AccessibilityInfo } from 'react-native';

const ref = useRef&lt;View&gt;(null);

function focusError() {
  const node = findNodeHandle(ref.current);
  if (node) AccessibilityInfo.setAccessibilityFocus(node);
}

&lt;View ref={ref}&gt;
  &lt;Text accessibilityRole="alert"&gt;Email is invalid&lt;/Text&gt;
&lt;/View&gt;
</code></pre>

<h3>Dynamic Type — let it scale</h3>
<pre><code class="language-typescript">// BAD — fixed size; user's setting ignored
&lt;Text style={{ fontSize: 16 }}&gt;Body text&lt;/Text&gt;

// GOOD — system style respects Dynamic Type
&lt;Text style={[styles.body, { fontSize: 16 }]} allowFontScaling&gt;
  Body text
&lt;/Text&gt;

// BEST — scale with system + cap to avoid blowout at AX5
&lt;Text
  style={styles.body}
  maxFontSizeMultiplier={2.5}
  allowFontScaling
&gt;
  Body text
&lt;/Text&gt;
</code></pre>

<h3>Captions for video</h3>
<pre><code class="language-typescript">import Video from 'react-native-video';

&lt;Video
  source={{ uri: videoUrl }}
  textTracks={[{ title: 'English captions', type: 'text/vtt', uri: captionsUrl, language: 'en' }]}
  selectedTextTrack={{ type: 'language', value: 'en' }}
/&gt;
</code></pre>
<p>iOS / Android both render system captions UI; users control style via Settings → Accessibility → Subtitles &amp; Captioning.</p>

<h3>Testing tools</h3>
<table>
  <thead><tr><th>Tool</th><th>What it does</th></tr></thead>
  <tbody>
    <tr><td>VoiceOver / TalkBack</td><td>Real screen reader; mandatory test</td></tr>
    <tr><td>Accessibility Inspector (Xcode)</td><td>Real-time tree of accessibility elements</td></tr>
    <tr><td>Accessibility Scanner (Android)</td><td>Auto-detects contrast, target size, label issues</td></tr>
    <tr><td>axe-core for RN (eslint-plugin-react-native-a11y)</td><td>Lint-time checks</td></tr>
    <tr><td>Storybook + @storybook/addon-a11y</td><td>Per-component a11y check</td></tr>
    <tr><td>jest-axe</td><td>Accessibility tests in CI (web + RTL)</td></tr>
    <tr><td>Detox + accessibility queries</td><td>E2E queries by accessibility label</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Accessible icon button</h3>
<pre><code class="language-typescript">function IconButton({ icon, onPress, label, hint }) {
  return (
    &lt;Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityRole="button"
      hitSlop={12}
      style={({ pressed }) =&gt; [
        styles.iconButton,
        pressed &amp;&amp; styles.pressed,
      ]}
    &gt;
      &lt;Image source={icon} accessible={false} /&gt;
    &lt;/Pressable&gt;
  );
}

// Use:
&lt;IconButton icon={shareIcon} onPress={share} label="Share article" /&gt;
&lt;IconButton icon={trashIcon} onPress={remove} label="Remove from list" hint="Removes the item permanently" /&gt;
</code></pre>

<h3>Example 2: Accessible custom slider</h3>
<pre><code class="language-typescript">function VolumeSlider({ value, onChange, max = 100 }) {
  return (
    &lt;Pressable
      accessibilityRole="adjustable"
      accessibilityLabel="Volume"
      accessibilityValue={{ min: 0, max, now: value, text: \`\${value} percent\` }}
      onAccessibilityAction={(e) =&gt; {
        if (e.nativeEvent.actionName === 'increment') onChange(Math.min(value + 10, max));
        if (e.nativeEvent.actionName === 'decrement') onChange(Math.max(value - 10, 0));
      }}
    &gt;
      &lt;SliderUI value={value} onChange={onChange} /&gt;
    &lt;/Pressable&gt;
  );
}
</code></pre>
<p>VoiceOver users swipe up/down on the focused slider to increment/decrement; the system reads "Volume, 50 percent."</p>

<h3>Example 3: Form with live error announcement</h3>
<pre><code class="language-typescript">function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const errorRef = useRef&lt;Text&gt;(null);

  async function onSubmit() {
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
      // Move screen reader focus to the error
      setTimeout(() =&gt; {
        const node = findNodeHandle(errorRef.current);
        if (node) AccessibilityInfo.setAccessibilityFocus(node);
      }, 100);
    }
  }

  return (
    &lt;View&gt;
      &lt;Text accessibilityRole="header"&gt;Sign in&lt;/Text&gt;
      &lt;TextInput
        value={email}
        onChangeText={setEmail}
        accessibilityLabel="Email"
        autoComplete="email"
        keyboardType="email-address"
      /&gt;
      &lt;TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        accessibilityLabel="Password"
        autoComplete="current-password"
      /&gt;
      &lt;Pressable
        onPress={onSubmit}
        accessibilityLabel="Sign in"
        accessibilityRole="button"
      &gt;
        &lt;Text&gt;Sign in&lt;/Text&gt;
      &lt;/Pressable&gt;
      {!!error &amp;&amp; (
        &lt;Text
          ref={errorRef}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
          style={styles.error}
        &gt;
          {error}
        &lt;/Text&gt;
      )}
    &lt;/View&gt;
  );
}
</code></pre>

<h3>Example 4: Tab bar with proper roles</h3>
<pre><code class="language-typescript">function TabBar({ tabs, activeId, onSelect }) {
  return (
    &lt;View accessibilityRole="tablist" style={styles.tabBar}&gt;
      {tabs.map((tab) =&gt; (
        &lt;Pressable
          key={tab.id}
          onPress={() =&gt; onSelect(tab.id)}
          accessibilityRole="tab"
          accessibilityLabel={tab.label}
          accessibilityState={{ selected: activeId === tab.id }}
          style={[styles.tab, activeId === tab.id &amp;&amp; styles.activeTab]}
        &gt;
          &lt;Image source={tab.icon} accessible={false} /&gt;
          &lt;Text&gt;{tab.label}&lt;/Text&gt;
        &lt;/Pressable&gt;
      ))}
    &lt;/View&gt;
  );
}
</code></pre>

<h3>Example 5: Modal that traps focus</h3>
<pre><code class="language-typescript">function ConfirmModal({ visible, title, body, onConfirm, onCancel }) {
  const titleRef = useRef&lt;Text&gt;(null);

  useEffect(() =&gt; {
    if (visible) {
      // Move VoiceOver to title on open
      setTimeout(() =&gt; {
        const node = findNodeHandle(titleRef.current);
        if (node) AccessibilityInfo.setAccessibilityFocus(node);
      }, 100);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    &lt;Modal transparent animationType="fade"&gt;
      &lt;Pressable style={styles.backdrop} onPress={onCancel} /&gt;
      &lt;View
        style={styles.dialog}
        accessibilityViewIsModal={true}
        importantForAccessibility="yes"
        onAccessibilityEscape={onCancel}
      &gt;
        &lt;Text ref={titleRef} accessibilityRole="header"&gt;{title}&lt;/Text&gt;
        &lt;Text&gt;{body}&lt;/Text&gt;
        &lt;View style={styles.actions}&gt;
          &lt;Pressable onPress={onCancel} accessibilityLabel="Cancel" accessibilityRole="button"&gt;
            &lt;Text&gt;Cancel&lt;/Text&gt;
          &lt;/Pressable&gt;
          &lt;Pressable onPress={onConfirm} accessibilityLabel="Confirm" accessibilityRole="button"&gt;
            &lt;Text&gt;Confirm&lt;/Text&gt;
          &lt;/Pressable&gt;
        &lt;/View&gt;
      &lt;/View&gt;
    &lt;/Modal&gt;
  );
}
</code></pre>

<h3>Example 6: Accessible carousel</h3>
<pre><code class="language-typescript">function Carousel({ pages, currentIndex, onChange }) {
  return (
    &lt;View accessibilityLabel={\`Carousel, \${currentIndex + 1} of \${pages.length}\`}&gt;
      &lt;Animated.ScrollView
        horizontal
        pagingEnabled
        onMomentumScrollEnd={onScrollEnd}
        accessibilityElementsHidden={false}
      &gt;
        {pages.map((page, i) =&gt; (
          &lt;View
            key={i}
            accessibilityLabel={\`Slide \${i + 1} of \${pages.length}: \${page.title}\`}
            accessibilityElementsHidden={i !== currentIndex}
            importantForAccessibility={i === currentIndex ? 'yes' : 'no-hide-descendants'}
          &gt;
            &lt;Page {...page} /&gt;
          &lt;/View&gt;
        ))}
      &lt;/Animated.ScrollView&gt;

      {/* Pagination dots — also need labels */}
      &lt;View accessibilityRole="tablist"&gt;
        {pages.map((_, i) =&gt; (
          &lt;Pressable
            key={i}
            onPress={() =&gt; onChange(i)}
            accessibilityRole="tab"
            accessibilityLabel={\`Go to slide \${i + 1}\`}
            accessibilityState={{ selected: i === currentIndex }}
          /&gt;
        ))}
      &lt;/View&gt;
    &lt;/View&gt;
  );
}
</code></pre>

<h3>Example 7: Skip-link pattern (RN-style)</h3>
<p>RN doesn't have HTML skip links, but you can simulate by setting initial focus on an "Open menu" button after navigation:</p>
<pre><code class="language-typescript">function ScreenWithLongHeader() {
  const mainRef = useRef&lt;View&gt;(null);

  useEffect(() =&gt; {
    // Skip past the long header to the main content for VO/TB users
    if (AccessibilityInfo.isScreenReaderEnabled()) {
      setTimeout(() =&gt; {
        const node = findNodeHandle(mainRef.current);
        if (node) AccessibilityInfo.setAccessibilityFocus(node);
      }, 200);
    }
  }, []);

  return (
    &lt;ScrollView&gt;
      &lt;LongMarketingHeader /&gt;
      &lt;View ref={mainRef} accessible accessibilityLabel="Main content"&gt;
        &lt;ProductGrid /&gt;
      &lt;/View&gt;
    &lt;/ScrollView&gt;
  );
}
</code></pre>

<h3>Example 8: Captioned video</h3>
<pre><code class="language-typescript">&lt;Video
  source={{ uri: videoUrl }}
  controls
  paused={false}
  textTracks={[
    { title: 'English', type: 'text/vtt', uri: enCaptionsUrl, language: 'en' },
    { title: 'Spanish', type: 'text/vtt', uri: esCaptionsUrl, language: 'es' },
  ]}
  selectedTextTrack={{ type: 'system' }} // honor user's preferred language
  audioOnly={false}
/&gt;
</code></pre>

<h3>Example 9: Theme respecting accessibility settings</h3>
<pre><code class="language-typescript">function useAccessibilityAwareTheme() {
  const scheme = useColorScheme();
  const [boldText, setBoldText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() =&gt; {
    AccessibilityInfo.isBoldTextEnabled?.().then(setBoldText);
    AccessibilityInfo.isHighTextContrastEnabled?.().then(setHighContrast);
    AccessibilityInfo.isReduceTransparencyEnabled?.().then(setReduceTransparency);
  }, []);

  return {
    ...baseTheme,
    isDark: scheme === 'dark',
    fontWeight: boldText ? '700' : '400',
    contrast: highContrast ? 'high' : 'normal',
    blurBackgrounds: !reduceTransparency,
  };
}
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>Generic <code>View</code> isn't focusable</h3>
<ul>
  <li>RN <code>View</code> is invisible to screen readers by default. Add <code>accessible={true}</code> to make it focusable.</li>
  <li>Children of an accessible View are merged into one announcement; the children's individual a11y settings are ignored.</li>
  <li>So: only mark the outermost focusable element (card, row) as <code>accessible</code>; leave children as defaults.</li>
</ul>

<h3>Image accessibility</h3>
<table>
  <thead><tr><th>Image purpose</th><th>How to mark</th></tr></thead>
  <tbody>
    <tr><td>Decorative (visual only, no info)</td><td><code>accessible={false}</code> + <code>accessibilityElementsHidden={true}</code></td></tr>
    <tr><td>Informative (carries info)</td><td><code>accessibilityLabel="Description of image"</code> + <code>accessibilityRole="image"</code></td></tr>
    <tr><td>Tappable (icon button)</td><td>Wrap in Pressable with label; image itself <code>accessible={false}</code></td></tr>
    <tr><td>Inside a link</td><td>Image label combined with link label; group via <code>accessible={true}</code> on parent</td></tr>
  </tbody>
</table>

<h3>Long lists + screen reader fatigue</h3>
<ul>
  <li>VoiceOver / TalkBack reads each item's label individually. A 200-row list = 200 announcements.</li>
  <li>Add <code>accessibilityLabel</code> to the parent: <em>"Inbox, 47 messages"</em>.</li>
  <li>Allow rotor / quick-nav: use <code>header</code> roles for section breaks; users swipe by header.</li>
  <li>Skip pagination dots in favor of next/prev buttons with labels.</li>
</ul>

<h3>Loading states</h3>
<ul>
  <li>Spinner with no label = silence to screen reader.</li>
  <li>Use <code>accessibilityRole="progressbar"</code> on the spinner; <code>accessibilityState={{ busy: true }}</code> on the parent container.</li>
  <li>Announce "Loading..." with <code>announceForAccessibility</code>; "Loaded" on completion.</li>
  <li>Skeleton screens should be marked <code>accessibilityElementsHidden</code> so VoiceOver doesn't read placeholder boxes.</li>
</ul>

<h3>Toast / Snackbar</h3>
<ul>
  <li>Auto-dismiss before VO reads = invisible to screen-reader users.</li>
  <li>Use <code>accessibilityLiveRegion="polite"</code>; ensure duration is at least 5s when SR is on.</li>
  <li>Or call <code>announceForAccessibility</code> separately so the announcement isn't tied to display duration.</li>
</ul>

<h3>Custom gesture-only actions</h3>
<ul>
  <li>Swipe-to-delete, pinch-to-zoom, long-press-for-menu — invisible to switch-control / VO users without alternatives.</li>
  <li>Always pair with <code>accessibilityActions</code> exposing named actions, or visible buttons.</li>
  <li>Test with VO on: can you complete every flow?</li>
</ul>

<h3>Animations as the only feedback</h3>
<ul>
  <li>Card slides off screen to "delete" — invisible to SR users.</li>
  <li>Pair with announcement: <em>"Item deleted"</em>.</li>
  <li>Same for like/heart pulse, success checkmark, error shake.</li>
</ul>

<h3>Color as the only signal</h3>
<ul>
  <li>Red status dot = error, green = success — invisible to colorblind / SR users.</li>
  <li>Pair color with icon (✓ / ✕) and text ("active" / "error").</li>
  <li>Test with grayscale filter (iOS: Settings → Accessibility → Display &amp; Text Size → Color Filters → Grayscale).</li>
</ul>

<h3>Time-pressured inputs</h3>
<ul>
  <li>OTP input that auto-dismisses after 30s = unfair to slow users.</li>
  <li>Provide options to extend, retry without re-entering full data.</li>
  <li>WCAG 2.2 SC 2.2.1: time limits must be adjustable, extendable, or removable.</li>
</ul>

<h3>Flashing content</h3>
<ul>
  <li>WCAG SC 2.3.1: no more than 3 flashes per second (photosensitive epilepsy).</li>
  <li>Holiday confetti, celebratory bursts — gate with Reduce Motion.</li>
  <li>Strobing video = reject from App Store reviews.</li>
</ul>

<h3>Modal vs full-screen page</h3>
<ul>
  <li>Modal: trap focus inside; <code>accessibilityViewIsModal</code> on iOS; ensure background isn't readable.</li>
  <li>Full-screen page: navigate normally; back-gesture works.</li>
  <li>Use <code>onAccessibilityEscape</code> for Z-shape gesture (VoiceOver) to close modals.</li>
</ul>

<h3>Localization + a11y labels</h3>
<ul>
  <li>Translate <code>accessibilityLabel</code> via your i18n system.</li>
  <li>Don't forget hint, value, and action labels.</li>
  <li>Use <code>accessibilityLanguage</code> when a label is in a different language than the app default.</li>
</ul>

<h3>Numeric labels</h3>
<ul>
  <li>VoiceOver reads "$5.99" as "five dollars and ninety-nine cents" — usually correct.</li>
  <li>"5/10" reads as "five slash ten" — confusing. Use <code>accessibilityLabel="5 of 10"</code>.</li>
  <li>Phone numbers: hyphens / dots get spelled out. Use <code>accessibilityLabel</code> with proper grouping.</li>
</ul>

<h3>RN-specific gotchas</h3>
<ul>
  <li><code>TouchableOpacity</code> defaults to <code>accessibilityRole="button"</code> — fine for buttons; use <code>"link"</code> for navigation.</li>
  <li><code>Pressable</code> defaults to nothing — always set role.</li>
  <li>FlatList items use <code>keyExtractor</code> for identity, not for a11y; each item still needs its own label.</li>
  <li>Animated.View is not accessible by default; same rules as View.</li>
  <li>WebView content has its own a11y tree (web-style ARIA); RN can't override.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common a11y mistakes in RN</h3>
<ol>
  <li><strong>Missing labels on icon buttons.</strong> VoiceOver reads "image button" with no context.</li>
  <li><strong>Custom div / View with onPress.</strong> Invisible to screen readers; no role.</li>
  <li><strong>Color-only state signal.</strong> Red border for error; missed by colorblind / SR users.</li>
  <li><strong>Hard-coded font size ignoring Dynamic Type.</strong> Layout truncates at AX5.</li>
  <li><strong>Tap targets &lt; 44pt.</strong> Misses motor-impaired users.</li>
  <li><strong>Modals that don't trap focus.</strong> VoiceOver wanders to background.</li>
  <li><strong>Auto-dismiss toasts faster than SR can read.</strong> Critical state goes unannounced.</li>
  <li><strong>Custom gestures with no alternative.</strong> Swipe-to-delete invisible to switch users.</li>
  <li><strong>Form errors invisible to SR.</strong> No role="alert" or live region.</li>
  <li><strong>Animations with no reduce-motion fallback.</strong> Vestibular triggers.</li>
  <li><strong>Decorative images announced as "image."</strong> Should be hidden.</li>
  <li><strong>No testing with VoiceOver / TalkBack.</strong> Engineers ship blind.</li>
</ol>

<h3>Anti-pattern: missing label on icon</h3>
<pre><code class="language-typescript">// BAD
&lt;Pressable onPress={onShare}&gt;
  &lt;Image source={shareIcon} /&gt;
&lt;/Pressable&gt;

// GOOD
&lt;Pressable
  onPress={onShare}
  accessibilityLabel="Share article"
  accessibilityRole="button"
  hitSlop={12}
&gt;
  &lt;Image source={shareIcon} accessible={false} /&gt;
&lt;/Pressable&gt;
</code></pre>

<h3>Anti-pattern: View as button</h3>
<pre><code class="language-typescript">// BAD
&lt;View onTouchEnd={onPress}&gt;Click me&lt;/View&gt;

// GOOD
&lt;Pressable
  onPress={onPress}
  accessibilityRole="button"
  accessibilityLabel="Click me"
&gt;
  &lt;Text&gt;Click me&lt;/Text&gt;
&lt;/Pressable&gt;
</code></pre>

<h3>Anti-pattern: color-only state</h3>
<pre><code class="language-typescript">// BAD — red dot only
&lt;View style={{ backgroundColor: hasError ? 'red' : 'green', width: 8, height: 8 }} /&gt;

// GOOD — color + icon + label
&lt;View accessible accessibilityLabel={hasError ? 'Error' : 'OK'}&gt;
  &lt;Icon name={hasError ? 'alert-circle' : 'check-circle'} color={hasError ? 'red' : 'green'} /&gt;
  &lt;Text&gt;{hasError ? 'Error' : 'OK'}&lt;/Text&gt;
&lt;/View&gt;
</code></pre>

<h3>Anti-pattern: hardcoded fontSize</h3>
<pre><code class="language-typescript">// BAD — ignores Dynamic Type
&lt;Text style={{ fontSize: 14, allowFontScaling: false }}&gt;Body&lt;/Text&gt;

// GOOD — scales; capped at 2.5x to prevent blowout
&lt;Text style={{ fontSize: 14 }} maxFontSizeMultiplier={2.5}&gt;Body&lt;/Text&gt;
</code></pre>

<h3>Anti-pattern: modal without trap</h3>
<pre><code class="language-typescript">// BAD — VoiceOver users navigate background while modal is open
&lt;Modal visible={open}&gt;
  &lt;Dialog /&gt;
&lt;/Modal&gt;

// GOOD — trap focus inside; signal modality
&lt;Modal visible={open}&gt;
  &lt;View
    accessibilityViewIsModal={true}
    importantForAccessibility="yes"
  &gt;
    &lt;Dialog /&gt;
  &lt;/View&gt;
&lt;/Modal&gt;
</code></pre>

<h3>Anti-pattern: silent loading</h3>
<pre><code class="language-typescript">// BAD — spinner with no announcement
{isLoading &amp;&amp; &lt;Spinner /&gt;}

// GOOD — busy state + role
&lt;View
  accessibilityState={{ busy: isLoading }}
  accessibilityLiveRegion="polite"
&gt;
  {isLoading &amp;&amp; (
    &lt;Spinner accessibilityLabel="Loading" accessibilityRole="progressbar" /&gt;
  )}
&lt;/View&gt;
</code></pre>

<h3>Anti-pattern: custom dropdown without combobox role</h3>
<pre><code class="language-typescript">// BAD
&lt;Pressable onPress={openDropdown}&gt;
  &lt;Text&gt;Select country&lt;/Text&gt;
&lt;/Pressable&gt;

// GOOD
&lt;Pressable
  onPress={openDropdown}
  accessibilityRole="combobox"
  accessibilityLabel="Country"
  accessibilityValue={{ text: selected ?? 'None selected' }}
  accessibilityState={{ expanded: dropdownOpen }}
&gt;
  &lt;Text&gt;{selected ?? 'Select country'}&lt;/Text&gt;
&lt;/Pressable&gt;
</code></pre>

<h3>Anti-pattern: error announced visually only</h3>
<pre><code class="language-typescript">// BAD — error red text appears; SR doesn't know
{error &amp;&amp; &lt;Text style={styles.error}&gt;{error}&lt;/Text&gt;}

// GOOD — alert role + live region; focus moves
{error &amp;&amp; (
  &lt;Text
    accessibilityRole="alert"
    accessibilityLiveRegion="assertive"
    style={styles.error}
  &gt;
    {error}
  &lt;/Text&gt;
)}
</code></pre>

<h3>Anti-pattern: animation without Reduce Motion</h3>
<pre><code class="language-typescript">// BAD — runs even for vestibular-sensitive users
withSpring(target);

// GOOD — fall back to instant
const reduceMotion = useReducedMotion();
reduceMotion ? withTiming(target, { duration: 0 }) : withSpring(target);
</code></pre>

<h3>Anti-pattern: skip a11y in component library</h3>
<p>If <code>&lt;Button&gt;</code> doesn't ship with role / label / state defaults, every consumer reinvents the wheel — most forget. Bake a11y into reusable primitives at the design-system layer.</p>

<h3>Anti-pattern: shipping without testing with SR</h3>
<p>Engineers run the app, see no errors, ship. VoiceOver users discover broken flows post-launch. Mandatory: at least one VoiceOver pass per release on critical flows.</p>

<h3>Anti-pattern: overusing announceForAccessibility</h3>
<p>Spam announcements ("Item added", "Item removed", "Page loaded", "Now scrolling") train users to ignore VoiceOver. Reserve for state changes that aren't otherwise visible.</p>

<h3>Anti-pattern: skipping testing on small phones</h3>
<p>Layouts that work on iPhone 16 Pro Max may break on iPhone SE 1st gen with AX5 text. Test the smallest screen × largest text combination.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common a11y interview prompts</h3>
<ol>
  <li>How do you ensure your RN app is accessible?</li>
  <li>Walk me through making a custom component accessible.</li>
  <li>How do you handle Dynamic Type / font scaling?</li>
  <li>How do you support VoiceOver / TalkBack on a custom gesture?</li>
  <li>How do you test accessibility?</li>
  <li>Compare web a11y (ARIA) vs RN a11y.</li>
  <li>Tell me about an a11y bug you fixed.</li>
  <li>What WCAG level do you target and why?</li>
</ol>

<h3>The 5-step framework for "make this accessible"</h3>
<ol>
  <li><strong>Label everything interactive</strong> with <code>accessibilityLabel</code>.</li>
  <li><strong>Apply correct roles</strong> (<code>button</code>, <code>link</code>, <code>header</code>, <code>image</code>, <code>tab</code>, etc.).</li>
  <li><strong>Communicate state</strong> via <code>accessibilityState</code> (selected, disabled, busy, expanded).</li>
  <li><strong>Provide alternatives for gesture-only flows</strong> via <code>accessibilityActions</code>.</li>
  <li><strong>Test with VoiceOver + TalkBack + Dynamic Type AX5 + Reduce Motion</strong>.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"Accessibility is built into RN's primitives — accessibilityLabel, accessibilityRole, accessibilityState. The cost of doing it right is small; the cost of skipping is lawsuits + lost users."</em></li>
  <li><em>"Touch target 44pt minimum on iOS, 48dp on Android. Use hitSlop to expand without growing visible bounds."</em></li>
  <li><em>"Color contrast 4.5:1 for body, 3:1 for large text and UI per WCAG 2.2 AA. Stark in Figma, axe-core in CI."</em></li>
  <li><em>"Custom gestures expose accessibilityActions so swipe-to-delete works via VoiceOver rotor."</em></li>
  <li><em>"Modal focus trap via accessibilityViewIsModal + initial focus on the title via setAccessibilityFocus."</em></li>
  <li><em>"Errors announced via role='alert' + accessibilityLiveRegion='assertive' + setAccessibilityFocus to move VoiceOver to the message."</em></li>
  <li><em>"Reduce Motion respected via useReducedMotion — vestibular conditions are real."</em></li>
  <li><em>"Test matrix: VoiceOver on, TalkBack on, AX5 text, Reduce Motion, Bold Text, smallest device. Most layouts break at the intersection."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"icon button"</td><td>accessibilityLabel + accessibilityRole="button" + hitSlop</td></tr>
    <tr><td>"form errors"</td><td>role="alert" + liveRegion="assertive" + setAccessibilityFocus</td></tr>
    <tr><td>"modal"</td><td>accessibilityViewIsModal + onAccessibilityEscape</td></tr>
    <tr><td>"swipe action"</td><td>accessibilityActions + onAccessibilityAction</td></tr>
    <tr><td>"slider"</td><td>accessibilityRole="adjustable" + accessibilityValue + onAccessibilityAction increment/decrement</td></tr>
    <tr><td>"tab bar"</td><td>tablist / tab roles + accessibilityState selected</td></tr>
    <tr><td>"loading state"</td><td>accessibilityState busy + role="progressbar" + announceForAccessibility</td></tr>
    <tr><td>"video"</td><td>captions via textTracks; selectedTextTrack="system"</td></tr>
    <tr><td>"animation"</td><td>useReducedMotion fallback</td></tr>
    <tr><td>"image"</td><td>label OR accessible={false} for decorative</td></tr>
  </tbody>
</table>

<h3>Demo script</h3>
<ol>
  <li>Identify all interactive elements on a screen.</li>
  <li>Walk through labeling: each gets accessibilityLabel + role.</li>
  <li>Identify state changes: apply accessibilityState.</li>
  <li>Identify gesture-only flows: add accessibilityActions.</li>
  <li>Identify dynamic content: add liveRegion or programmatic announceForAccessibility.</li>
  <li>Demo with VoiceOver enabled.</li>
  <li>Test at AX5 text + Reduce Motion + Bold Text.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"axe-core integration in Storybook for per-component a11y testing."</em></li>
  <li><em>"jest-axe in CI on RTL component tests."</em></li>
  <li><em>"E2E a11y queries via Detox accessibility props."</em></li>
  <li><em>"Per-flow VoiceOver / TalkBack QA checklist tied to PRs."</em></li>
  <li><em>"VPAT (Voluntary Product Accessibility Template) for procurement."</em></li>
  <li><em>"Localized accessibility labels via i18n; accessibilityLanguage for non-default phrases."</em></li>
  <li><em>"Captions pipeline for video — auto-generate via Whisper, human-review."</em></li>
  <li><em>"Screen reader analytics — track if SR is on, look for stuck flows."</em></li>
  <li><em>"Designer + engineer a11y checklist baked into design handoff."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Vocabulary</td><td>Names POUR + WCAG AA + roles + Dynamic Type</td></tr>
    <tr><td>RN-specific fluency</td><td>Knows accessibilityLabel / Role / State / Actions / liveRegion</td></tr>
    <tr><td>Testing instinct</td><td>Mentions VoiceOver + TalkBack + AX5 + Reduce Motion testing matrix</td></tr>
    <tr><td>Gesture awareness</td><td>Custom gestures expose accessibilityActions</td></tr>
    <tr><td>Color discipline</td><td>Color never the only signal; contrast 4.5:1</td></tr>
    <tr><td>Modal handling</td><td>Focus trap + escape gesture</td></tr>
    <tr><td>Error pattern</td><td>role="alert" + liveRegion + focus management</td></tr>
    <tr><td>Restraint</td><td>Doesn't spam announceForAccessibility</td></tr>
    <tr><td>Production sense</td><td>Names CI tools, design-system level enforcement, VPAT</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN has near-perfect parity with native a11y APIs — UIAccessibility on iOS, AccessibilityNodeInfo on Android. The bridge is well-maintained.</li>
  <li>Test on real devices with screen readers — simulator screen readers are buggy.</li>
  <li>Dynamic Type / font scaling needs layout testing on every screen at the largest setting.</li>
  <li>Switch Control + Voice Control are smaller but real user populations; smoke-test once per release.</li>
  <li>Captions for video are non-negotiable; FCC-mandated for many content types.</li>
  <li>Apple's App Store reviewers do test with VoiceOver; serious gaps cause rejection.</li>
  <li>WCAG conformance is an ongoing process, not a one-time audit.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"How does a screen reader announce a button?"</em> — Label, value, role, state, hint (in that order, with pause before hint). "Like, 14, button, selected. Double-tap to unlike."</li>
  <li><em>"What's the minimum tap target?"</em> — 44pt iOS / 48dp Android. Use hitSlop to extend without growing visible.</li>
  <li><em>"How do you handle a custom slider for a11y?"</em> — accessibilityRole="adjustable" + accessibilityValue + onAccessibilityAction handling increment / decrement. VoiceOver users swipe up/down on focused element.</li>
  <li><em>"How do you trap focus in a modal?"</em> — accessibilityViewIsModal on iOS, importantForAccessibility on Android, plus initial setAccessibilityFocus on the modal title; restore focus to trigger on close.</li>
  <li><em>"How do you ensure forms are accessible?"</em> — Labels via accessibilityLabel; errors via role="alert" + liveRegion + setAccessibilityFocus to move SR to the error.</li>
  <li><em>"How do you test a11y at scale?"</em> — eslint-plugin-react-native-a11y for static checks; jest-axe in component tests; storybook addon-a11y for design system; manual VoiceOver / TalkBack pass per release on critical flows.</li>
  <li><em>"What's the difference between accessibilityLabel and accessibilityHint?"</em> — Label is what the element is ("Save"); hint is what happens on activation ("Saves the form"). Hints announce after a pause; use sparingly.</li>
  <li><em>"How do you handle a11y for users with cognitive disabilities?"</em> — Plain language; predictable navigation; clear errors with recovery; no time-pressured inputs; consistent layouts.</li>
  <li><em>"Why does Reduce Motion matter?"</em> — Vestibular disorders: parallax, large transitions, fast animations cause real symptoms (nausea, vertigo). Respect the system setting.</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Enable VoiceOver and use your phone for an hour. Realize how broken your favorite app is.</li>
  <li>Memorize the 5 main RN a11y props.</li>
  <li>Memorize the 6 most common roles + 3 most common states.</li>
  <li>Test one of your apps at AX5 + Reduce Motion + dark mode + Bold Text.</li>
  <li>Read WCAG 2.2 quick reference (1 page).</li>
  <li>Practice the demo script: label, role, state, actions, test.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Watch Apple's WWDC sessions on Accessibility (yearly; rich)."</li>
  <li>"Read Material 3 Accessibility docs end to end."</li>
  <li>"Subscribe to Adrian Roselli + Marcy Sutton blogs."</li>
  <li>"Spend a day with a screen-reader user; learn what's actually painful."</li>
  <li>"Audit one of your prior apps — count the a11y violations."</li>
</ul>

<h3>Mobile UX module summary</h3>
<p>The complete Mobile UX & Patterns module covers:</p>
<ul>
  <li><strong>iOS Human Interface Guidelines</strong> — system primitives, navigation patterns, safe-area, Dynamic Type, dark mode, haptics.</li>
  <li><strong>Material Design 3</strong> — Dynamic Color, tonal elevation, M3 components, Predictive Back, edge-to-edge.</li>
  <li><strong>Mobile Gestures</strong> — RNGH + Reanimated worklets, composition operators, system gesture respect, haptic discipline.</li>
  <li><strong>Mobile Accessibility</strong> (this topic) — VoiceOver / TalkBack, RN a11y prop catalog, WCAG 2.2 AA, Dynamic Type, Reduce Motion, focus management.</li>
</ul>
<p>4 topics. Together they cover the platform-design literacy that separates "RN engineer who's used a phone" from "RN engineer who builds for everyone on iOS and Android."</p>
`
    }
  ]
});
