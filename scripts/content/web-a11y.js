window.PREP_SITE.registerTopic({
  id: 'web-a11y',
  module: 'web',
  title: 'Accessibility',
  estimatedReadTime: '50 min',
  tags: ['a11y', 'accessibility', 'aria', 'wcag', 'screen-reader', 'keyboard', 'focus', 'semantic', 'web'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Accessibility (a11y)</strong> is making your app usable by everyone — including users of screen readers, keyboard-only navigation, voice control, switch access, magnifiers, and reduced motion. It's a legal requirement (ADA, EU Accessibility Act, Section 508), a moral baseline, and a quality signal. Senior frontend engineers internalize a11y from the start; retrofitting is painful.</p>
<ul>
  <li><strong>WCAG 2.2</strong> is the standard; Level AA is the practical target. Four principles: Perceivable, Operable, Understandable, Robust.</li>
  <li><strong>Semantic HTML first.</strong> Use <code>&lt;button&gt;</code>, <code>&lt;a&gt;</code>, <code>&lt;label&gt;</code>, <code>&lt;input&gt;</code> — they bring built-in a11y. ARIA is the second tool, not the first.</li>
  <li><strong>Keyboard support is non-negotiable.</strong> Tab order, Enter/Space activation, Escape to dismiss, arrow keys for menus.</li>
  <li><strong>Focus management:</strong> visible focus, programmatic focus on route change, focus trap in modals.</li>
  <li><strong>Color contrast:</strong> 4.5:1 for normal text, 3:1 for large text. Don't rely on color alone.</li>
  <li><strong>ARIA roles and properties</strong> when semantic HTML doesn't suffice. The first rule of ARIA: don't use ARIA when HTML has a built-in equivalent.</li>
  <li><strong>Screen reader testing</strong> is mandatory. NVDA + VoiceOver are the dominant readers; test with both.</li>
  <li><strong>Mobile a11y</strong> mirrors web: VoiceOver (iOS), TalkBack (Android), Switch Control, Voice Control, Reduce Motion.</li>
</ul>
<p><strong>Mantra:</strong> "Semantic HTML, keyboard works, focus visible, contrast passes, screen reader tested. ARIA only when HTML can't."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>Who needs accessibility?</h3>
<table>
  <thead><tr><th>Population</th><th>What they need</th></tr></thead>
  <tbody>
    <tr><td>Blind / low vision</td><td>Screen reader compatibility, text alternatives for images, sufficient contrast, zoom support</td></tr>
    <tr><td>Color blind (~8% men, 0.5% women)</td><td>Don't convey info via color alone; sufficient contrast</td></tr>
    <tr><td>Motor impaired</td><td>Keyboard-only navigation, large click targets, sufficient time</td></tr>
    <tr><td>Cognitive / dyslexic</td><td>Clear language, predictable navigation, no excess motion, consistent layout</td></tr>
    <tr><td>Deaf / hard of hearing</td><td>Captions, transcripts, visual alternatives to audio cues</td></tr>
    <tr><td>Vestibular sensitivity</td><td>Honor prefers-reduced-motion</td></tr>
    <tr><td>Aging users</td><td>Larger text, higher contrast, longer time, less motion</td></tr>
    <tr><td>Situational (sun glare, hands-busy)</td><td>All of the above benefit non-disabled users in adverse contexts</td></tr>
  </tbody>
</table>

<h3>Why a11y is the right default</h3>
<ol>
  <li><strong>Legal:</strong> ADA (US), EU Accessibility Act (2025+), AODA (Canada/Ontario). Lawsuits are common; settlements expensive.</li>
  <li><strong>Market:</strong> 1 in 4 US adults has a disability. Excluding them = leaving money on the table.</li>
  <li><strong>SEO:</strong> Semantic HTML helps search engines parse content.</li>
  <li><strong>Quality:</strong> a11y bugs are usually UX bugs in disguise.</li>
  <li><strong>Mobile-friendliness:</strong> a11y patterns (large targets, semantic structure) overlap with mobile-friendly patterns.</li>
</ol>

<h3>WCAG levels</h3>
<table>
  <thead><tr><th>Level</th><th>Scope</th></tr></thead>
  <tbody>
    <tr><td>A (minimum)</td><td>Critical bare minimum</td></tr>
    <tr><td>AA (industry target)</td><td>Practical compliance for most public sites</td></tr>
    <tr><td>AAA (high)</td><td>Aspirational; not always feasible for all content</td></tr>
  </tbody>
</table>

<h3>The four WCAG principles (POUR)</h3>
<table>
  <thead><tr><th>Principle</th><th>Means</th></tr></thead>
  <tbody>
    <tr><td>Perceivable</td><td>Users can perceive content (alt text, captions, contrast, zoom).</td></tr>
    <tr><td>Operable</td><td>Users can interact (keyboard, sufficient time, no seizure-triggering content).</td></tr>
    <tr><td>Understandable</td><td>Users can comprehend (clear language, predictable navigation, error help).</td></tr>
    <tr><td>Robust</td><td>Works across assistive tech (semantic HTML, valid markup).</td></tr>
  </tbody>
</table>

<h3>Why interviewers ask</h3>
<ol>
  <li>Senior engineers must understand a11y. Junior code = many a11y bugs.</li>
  <li>Tests "do you build for users, not just developers?" mindset.</li>
  <li>Distinguishes "ships features" from "ships features that work for everyone."</li>
  <li>Mobile-relevant: every mobile interview round touches a11y at some level.</li>
</ol>

<h3>What "good" looks like</h3>
<ul>
  <li>You use semantic elements by default.</li>
  <li>You test with keyboard-only — every action accessible without mouse.</li>
  <li>You test with VoiceOver / NVDA on critical flows.</li>
  <li>Your forms have labels; your images have alt; your headings form a hierarchy.</li>
  <li>Your modals trap focus; your route changes announce.</li>
  <li>Color contrast passes WCAG AA; you don't rely on color alone.</li>
  <li>You honor <code>prefers-reduced-motion</code>.</li>
  <li>You include axe / pa11y in CI; you fix violations.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The accessibility tree</h3>
<p>Browsers expose two trees: the DOM (what you wrote) and the accessibility tree (what assistive tech sees). The a11y tree is derived from the DOM but only includes meaningful elements. Semantic HTML maps cleanly; <code>&lt;div&gt;</code>-soup loses information.</p>

<pre><code class="language-text">DOM:                                    Accessibility tree:
&lt;header&gt;                                banner
  &lt;nav&gt;                                   navigation
    &lt;ul&gt;                                    list
      &lt;li&gt;&lt;a href="/"&gt;Home&lt;/a&gt;            link "Home"
      &lt;li&gt;&lt;a href="/about"&gt;About&lt;/a&gt;     link "About"

&lt;main&gt;                                  main
  &lt;article&gt;                               article
    &lt;h1&gt;Title&lt;/h1&gt;                         heading level 1 "Title"
    &lt;p&gt;Body...&lt;/p&gt;                         text
</code></pre>

<h3>The 3 rules of ARIA</h3>
<ol>
  <li><strong>Don't use ARIA when HTML works.</strong> A <code>&lt;button&gt;</code> is better than <code>&lt;div role="button"&gt;</code>.</li>
  <li><strong>Don't change native semantics.</strong> Don't put <code>role="button"</code> on a <code>&lt;p&gt;</code>; use a button.</li>
  <li><strong>All interactive elements must be keyboard-operable.</strong> If you make a div clickable, you must also handle Enter/Space.</li>
</ol>

<h3>Keyboard navigation expectations</h3>
<table>
  <thead><tr><th>Key</th><th>Action</th></tr></thead>
  <tbody>
    <tr><td>Tab</td><td>Move forward through focusable elements</td></tr>
    <tr><td>Shift+Tab</td><td>Move backward</td></tr>
    <tr><td>Enter</td><td>Activate buttons, follow links, submit forms</td></tr>
    <tr><td>Space</td><td>Activate buttons, toggle checkboxes</td></tr>
    <tr><td>Arrow keys</td><td>Navigate radios, menus, listbox, tabs, sliders</td></tr>
    <tr><td>Escape</td><td>Close modals, popovers, menus</td></tr>
    <tr><td>Home / End</td><td>First / last item in a list / table</td></tr>
    <tr><td>Page Up / Down</td><td>Scroll lists / tables</td></tr>
  </tbody>
</table>

<h3>What's focusable by default</h3>
<table>
  <thead><tr><th>Focusable</th><th>Not focusable</th></tr></thead>
  <tbody>
    <tr><td>&lt;a href&gt;, &lt;button&gt;, &lt;input&gt;, &lt;select&gt;, &lt;textarea&gt;, &lt;summary&gt;</td><td>&lt;div&gt;, &lt;span&gt;, &lt;p&gt;, &lt;img&gt; (without tabindex)</td></tr>
    <tr><td>contenteditable elements</td><td>Static content</td></tr>
    <tr><td>iframes</td><td></td></tr>
    <tr><td>Elements with tabindex=0 or positive</td><td>Elements with tabindex=-1 (programmatically focusable only)</td></tr>
  </tbody>
</table>

<h3>tabindex in 60 seconds</h3>
<table>
  <thead><tr><th>tabindex</th><th>Meaning</th></tr></thead>
  <tbody>
    <tr><td>0</td><td>In tab order; default for natively focusable; needed for custom controls</td></tr>
    <tr><td>-1</td><td>Programmatically focusable but not in tab order; for managed focus (modals, lists)</td></tr>
    <tr><td>positive (1, 2, ...)</td><td>Forces tab order; almost always wrong; breaks expected flow</td></tr>
  </tbody>
</table>

<h3>Focus management — the 3 cases</h3>
<table>
  <thead><tr><th>Scenario</th><th>What to do</th></tr></thead>
  <tbody>
    <tr><td>Open a modal</td><td>Move focus into modal; trap focus inside; restore on close</td></tr>
    <tr><td>Route change in SPA</td><td>Move focus to top of new page (often h1); announce route</td></tr>
    <tr><td>Async content load</td><td>Use ARIA live region to announce; don't move focus mid-task</td></tr>
  </tbody>
</table>

<h3>ARIA live regions</h3>
<pre><code class="language-html">&lt;!-- Politely announce when content updates --&gt;
&lt;div aria-live="polite" id="status"&gt;&lt;/div&gt;

&lt;!-- Assertive — interrupts; for critical only --&gt;
&lt;div aria-live="assertive" id="errors"&gt;&lt;/div&gt;

&lt;!-- Convenience: roles imply live regions --&gt;
&lt;div role="status"&gt;...&lt;/div&gt;     // polite
&lt;div role="alert"&gt;...&lt;/div&gt;      // assertive
&lt;div role="log"&gt;...&lt;/div&gt;        // polite, log-style accumulation
</code></pre>

<h3>The contrast rule</h3>
<table>
  <thead><tr><th>Text</th><th>WCAG AA</th><th>WCAG AAA</th></tr></thead>
  <tbody>
    <tr><td>Normal (≤24px or ≤19px bold)</td><td>4.5:1</td><td>7:1</td></tr>
    <tr><td>Large (≥24px or ≥19px bold)</td><td>3:1</td><td>4.5:1</td></tr>
    <tr><td>UI components / graphics</td><td>3:1</td><td>—</td></tr>
  </tbody>
</table>

<h3>Don't rely on color alone</h3>
<pre><code class="language-text">BAD: Required field marked only with red asterisk color.
GOOD: Required field marked with red color AND text "Required" or icon.

BAD: Status indicator only by background color.
GOOD: Status indicator with color + icon + text label.
</code></pre>

<h3>Touch target size</h3>
<p>WCAG 2.2 added a Level AA criterion: touch targets ≥ 24×24 CSS pixels (with exceptions). Apple HIG: ≥ 44pt × 44pt. Material: ≥ 48dp × 48dp.</p>

<h3>Semantic landmarks</h3>
<table>
  <thead><tr><th>Element</th><th>Role</th><th>One per page?</th></tr></thead>
  <tbody>
    <tr><td>&lt;header&gt; (top-level)</td><td>banner</td><td>One</td></tr>
    <tr><td>&lt;nav&gt;</td><td>navigation</td><td>Multiple OK; label each</td></tr>
    <tr><td>&lt;main&gt;</td><td>main</td><td>One</td></tr>
    <tr><td>&lt;footer&gt; (top-level)</td><td>contentinfo</td><td>One</td></tr>
    <tr><td>&lt;aside&gt;</td><td>complementary</td><td>Multiple OK</td></tr>
    <tr><td>&lt;form aria-label="..."&gt;</td><td>form</td><td>Multiple OK</td></tr>
    <tr><td>&lt;search&gt; (newer)</td><td>search</td><td>Multiple OK</td></tr>
  </tbody>
</table>

<h3>Heading hierarchy</h3>
<p>One <code>&lt;h1&gt;</code> per page. <code>&lt;h2&gt;</code>-<code>&lt;h6&gt;</code> form a tree. Don't skip levels. Screen reader users navigate by headings ("press H").</p>

<h3>Reduced motion</h3>
<pre><code class="language-css">@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
</code></pre>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Form labels (the basics)</h3>
<pre><code class="language-html">&lt;!-- Explicit (preferred) --&gt;
&lt;label for="email"&gt;Email&lt;/label&gt;
&lt;input id="email" type="email" /&gt;

&lt;!-- Implicit (label wraps input) --&gt;
&lt;label&gt;Email &lt;input type="email" /&gt;&lt;/label&gt;

&lt;!-- BAD --&gt;
&lt;span&gt;Email&lt;/span&gt;
&lt;input type="email" /&gt;

&lt;!-- aria-label as fallback only when visible label impossible --&gt;
&lt;input type="search" aria-label="Search products" /&gt;

&lt;!-- aria-labelledby for complex labels --&gt;
&lt;h2 id="title"&gt;Card title&lt;/h2&gt;
&lt;button aria-labelledby="title"&gt;Open&lt;/button&gt;
</code></pre>

<h3>Form validation messages</h3>
<pre><code class="language-html">&lt;label for="age"&gt;Age&lt;/label&gt;
&lt;input
  id="age"
  type="number"
  aria-describedby="age-error age-hint"
  aria-invalid="true"
/&gt;
&lt;p id="age-hint" class="hint"&gt;Must be 18 or older&lt;/p&gt;
&lt;p id="age-error" class="error"&gt;Please enter a valid age&lt;/p&gt;
</code></pre>

<h3>Image alt text</h3>
<pre><code class="language-html">&lt;!-- Informative image — describe content --&gt;
&lt;img src="dog.jpg" alt="Golden retriever puppy lying on grass" /&gt;

&lt;!-- Decorative — empty alt (still required) --&gt;
&lt;img src="divider.png" alt="" /&gt;

&lt;!-- Functional image (e.g., logo as link) — describe destination --&gt;
&lt;a href="/"&gt;
  &lt;img src="logo.png" alt="Acme home" /&gt;
&lt;/a&gt;

&lt;!-- Complex image (chart) — short alt + long description --&gt;
&lt;img src="sales.png" alt="Bar chart of Q4 sales" aria-describedby="chart-desc" /&gt;
&lt;p id="chart-desc"&gt;Q4 sales rose 15%, with November peaking at $1.2M...&lt;/p&gt;
</code></pre>

<h3>Skip-to-content link</h3>
<pre><code class="language-html">&lt;a href="#main" class="skip-link"&gt;Skip to main content&lt;/a&gt;
...
&lt;main id="main" tabindex="-1"&gt;...&lt;/main&gt;
</code></pre>
<pre><code class="language-css">.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px 16px;
  z-index: 100;
}
.skip-link:focus {
  top: 0;
}
</code></pre>

<h3>Focus styles (don't hide them)</h3>
<pre><code class="language-css">/* BAD — invisible focus */
button:focus { outline: none; }

/* GOOD — custom focus that's visible */
button:focus-visible {
  outline: 2px solid #0a84ff;
  outline-offset: 2px;
}

/* Use :focus-visible to show focus only on keyboard, not mouse */
</code></pre>

<h3>Modal with focus trap</h3>
<pre><code class="language-html">&lt;dialog id="myDialog" aria-labelledby="dialog-title"&gt;
  &lt;h2 id="dialog-title"&gt;Settings&lt;/h2&gt;
  &lt;form method="dialog"&gt;
    &lt;label&gt;Theme &lt;select&gt;...&lt;/select&gt;&lt;/label&gt;
    &lt;menu&gt;
      &lt;button value="cancel"&gt;Cancel&lt;/button&gt;
      &lt;button value="save"&gt;Save&lt;/button&gt;
    &lt;/menu&gt;
  &lt;/form&gt;
&lt;/dialog&gt;

&lt;script&gt;
  const dlg = document.getElementById('myDialog');
  openButton.addEventListener('click', () =&gt; dlg.showModal());
  // showModal() handles focus trap + Escape automatically
&lt;/script&gt;
</code></pre>

<h3>Custom modal (without &lt;dialog&gt;)</h3>
<pre><code class="language-tsx">// Trap focus manually
function Modal({ open, onClose, children }) {
  const ref = useRef&lt;HTMLDivElement&gt;(null);

  useEffect(() =&gt; {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement;
    const focusable = ref.current?.querySelectorAll&lt;HTMLElement&gt;(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' &amp;&amp; focusable?.length) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey &amp;&amp; document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey &amp;&amp; document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () =&gt; {
      document.removeEventListener('keydown', onKey);
      previousFocus?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    &lt;div role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={ref}&gt;
      {children}
    &lt;/div&gt;
  );
}
</code></pre>

<h3>SPA route change announcement</h3>
<pre><code class="language-tsx">function App() {
  const location = useLocation();
  const announceRef = useRef&lt;HTMLDivElement&gt;(null);

  useEffect(() =&gt; {
    if (announceRef.current) {
      announceRef.current.textContent = \`Navigated to \${location.pathname}\`;
    }
    // Also move focus to top of new page
    const main = document.getElementById('main');
    main?.focus();
  }, [location]);

  return (
    &lt;&gt;
      &lt;div aria-live="polite" aria-atomic="true" className="sr-only" ref={announceRef} /&gt;
      &lt;main id="main" tabIndex={-1}&gt;...&lt;/main&gt;
    &lt;/&gt;
  );
}
</code></pre>

<h3>Visually hidden (still accessible)</h3>
<pre><code class="language-css">.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</code></pre>
<pre><code class="language-html">&lt;button&gt;
  &lt;svg&gt;...&lt;/svg&gt;
  &lt;span class="sr-only"&gt;Open menu&lt;/span&gt;
&lt;/button&gt;
</code></pre>

<h3>aria-expanded for disclosures</h3>
<pre><code class="language-html">&lt;button aria-expanded="false" aria-controls="content"&gt;
  Show details
&lt;/button&gt;
&lt;div id="content" hidden&gt;...&lt;/div&gt;
</code></pre>
<pre><code class="language-js">btn.addEventListener('click', () =&gt; {
  const isOpen = btn.getAttribute('aria-expanded') === 'true';
  btn.setAttribute('aria-expanded', !isOpen);
  content.hidden = isOpen;
});
</code></pre>

<h3>Tabs (proper a11y)</h3>
<pre><code class="language-html">&lt;div role="tablist" aria-label="Account settings"&gt;
  &lt;button role="tab" aria-selected="true"  aria-controls="profile" id="tab-profile" tabindex="0"&gt;Profile&lt;/button&gt;
  &lt;button role="tab" aria-selected="false" aria-controls="security" id="tab-security" tabindex="-1"&gt;Security&lt;/button&gt;
&lt;/div&gt;

&lt;div role="tabpanel" id="profile" aria-labelledby="tab-profile"&gt;...&lt;/div&gt;
&lt;div role="tabpanel" id="security" aria-labelledby="tab-security" hidden&gt;...&lt;/div&gt;
</code></pre>
<pre><code class="language-js">// Arrow keys navigate tabs; Enter activates
tabs.forEach((tab, i) =&gt; {
  tab.addEventListener('keydown', (e) =&gt; {
    if (e.key === 'ArrowRight') tabs[(i + 1) % tabs.length].focus();
    if (e.key === 'ArrowLeft') tabs[(i - 1 + tabs.length) % tabs.length].focus();
    if (e.key === 'Home') tabs[0].focus();
    if (e.key === 'End') tabs[tabs.length - 1].focus();
  });
});
</code></pre>

<h3>aria-current</h3>
<pre><code class="language-html">&lt;nav&gt;
  &lt;a href="/"&gt;Home&lt;/a&gt;
  &lt;a href="/about" aria-current="page"&gt;About&lt;/a&gt;   &lt;!-- screen reader: "current page" --&gt;
&lt;/nav&gt;
</code></pre>

<h3>Live regions for async</h3>
<pre><code class="language-html">&lt;div aria-live="polite" id="status"&gt;&lt;/div&gt;
</code></pre>
<pre><code class="language-js">// On data update
document.getElementById('status').textContent = 'Profile saved successfully';
// Screen reader announces it; visual users see in a status bar
</code></pre>

<h3>Tables (proper)</h3>
<pre><code class="language-html">&lt;table&gt;
  &lt;caption&gt;Q4 sales by region&lt;/caption&gt;
  &lt;thead&gt;
    &lt;tr&gt;&lt;th scope="col"&gt;Region&lt;/th&gt;&lt;th scope="col"&gt;Sales&lt;/th&gt;&lt;/tr&gt;
  &lt;/thead&gt;
  &lt;tbody&gt;
    &lt;tr&gt;&lt;th scope="row"&gt;North&lt;/th&gt;&lt;td&gt;$1.2M&lt;/td&gt;&lt;/tr&gt;
    &lt;tr&gt;&lt;th scope="row"&gt;South&lt;/th&gt;&lt;td&gt;$0.8M&lt;/td&gt;&lt;/tr&gt;
  &lt;/tbody&gt;
&lt;/table&gt;
</code></pre>

<h3>Error summary</h3>
<pre><code class="language-html">&lt;div role="alert"&gt;
  &lt;h2&gt;3 errors found&lt;/h2&gt;
  &lt;ul&gt;
    &lt;li&gt;&lt;a href="#email"&gt;Email is invalid&lt;/a&gt;&lt;/li&gt;
    &lt;li&gt;&lt;a href="#password"&gt;Password too short&lt;/a&gt;&lt;/li&gt;
    &lt;li&gt;&lt;a href="#dob"&gt;Invalid date of birth&lt;/a&gt;&lt;/li&gt;
  &lt;/ul&gt;
&lt;/div&gt;
</code></pre>

<h3>Testing tools</h3>
<table>
  <thead><tr><th>Tool</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td>axe DevTools</td><td>Browser extension for automated audit</td></tr>
    <tr><td>Lighthouse</td><td>Built into Chrome DevTools; a11y category</td></tr>
    <tr><td>WAVE</td><td>Visual a11y errors in-page</td></tr>
    <tr><td>NVDA</td><td>Free Windows screen reader</td></tr>
    <tr><td>VoiceOver</td><td>Built-in macOS / iOS screen reader</td></tr>
    <tr><td>TalkBack</td><td>Built-in Android screen reader</td></tr>
    <tr><td>jest-axe / pa11y</td><td>Automated tests in CI</td></tr>
    <tr><td>Storybook a11y addon</td><td>Per-component a11y check</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Accessible icon button</h3>
<pre><code class="language-html">&lt;button type="button" aria-label="Delete item"&gt;
  &lt;svg aria-hidden="true"&gt;...&lt;/svg&gt;
&lt;/button&gt;
</code></pre>

<h3>Example 2: Loading state with live region</h3>
<pre><code class="language-tsx">function SaveButton() {
  const [status, setStatus] = useState&lt;'idle' | 'saving' | 'saved' | 'error'&gt;('idle');

  return (
    &lt;&gt;
      &lt;button onClick={save} disabled={status === 'saving'}&gt;
        {status === 'saving' ? 'Saving...' : 'Save'}
      &lt;/button&gt;
      &lt;div role="status" className="sr-only"&gt;
        {status === 'saved' &amp;&amp; 'Saved successfully'}
        {status === 'error' &amp;&amp; 'Save failed'}
      &lt;/div&gt;
    &lt;/&gt;
  );
}
</code></pre>

<h3>Example 3: Custom dropdown (combobox pattern)</h3>
<pre><code class="language-html">&lt;label for="cb"&gt;Country&lt;/label&gt;
&lt;input
  id="cb"
  type="text"
  role="combobox"
  aria-expanded="false"
  aria-controls="cb-listbox"
  aria-autocomplete="list"
/&gt;
&lt;ul id="cb-listbox" role="listbox" hidden&gt;
  &lt;li role="option" aria-selected="false"&gt;Canada&lt;/li&gt;
  &lt;li role="option" aria-selected="false"&gt;United States&lt;/li&gt;
&lt;/ul&gt;
</code></pre>
<p>Plus arrow keys to navigate, Enter to select, Escape to close. The full pattern is detailed in WAI-ARIA Authoring Practices.</p>

<h3>Example 4: Modal with all the right hooks</h3>
<pre><code class="language-tsx">function ConfirmModal({ open, onConfirm, onCancel, message }) {
  const dialogRef = useRef&lt;HTMLDialogElement&gt;(null);

  useEffect(() =&gt; {
    if (open) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [open]);

  return (
    &lt;dialog ref={dialogRef} aria-labelledby="confirm-title" onClose={onCancel}&gt;
      &lt;h2 id="confirm-title"&gt;Confirm action&lt;/h2&gt;
      &lt;p&gt;{message}&lt;/p&gt;
      &lt;menu&gt;
        &lt;button onClick={onCancel}&gt;Cancel&lt;/button&gt;
        &lt;button onClick={onConfirm} autoFocus&gt;Confirm&lt;/button&gt;
      &lt;/menu&gt;
    &lt;/dialog&gt;
  );
}
</code></pre>
<p>The native <code>&lt;dialog&gt;</code> with <code>showModal()</code> handles focus trap, Escape, backdrop click natively.</p>

<h3>Example 5: Form with errors</h3>
<pre><code class="language-html">&lt;form noValidate&gt;
  &lt;div&gt;
    &lt;label for="email"&gt;Email&lt;/label&gt;
    &lt;input
      id="email"
      type="email"
      required
      aria-describedby="email-help"
      aria-invalid="true"
    /&gt;
    &lt;p id="email-help" class="error" role="alert"&gt;
      Please enter a valid email address.
    &lt;/p&gt;
  &lt;/div&gt;
&lt;/form&gt;
</code></pre>

<h3>Example 6: SPA route announce</h3>
<pre><code class="language-tsx">function RouteAnnouncer() {
  const location = useLocation();
  const ref = useRef&lt;HTMLDivElement&gt;(null);

  useEffect(() =&gt; {
    if (ref.current) {
      ref.current.textContent = document.title;   // or compute from route
    }
  }, [location]);

  return (
    &lt;div
      ref={ref}
      aria-live="assertive"
      aria-atomic="true"
      className="sr-only"
    /&gt;
  );
}
</code></pre>

<h3>Example 7: Disabled vs aria-disabled</h3>
<pre><code class="language-html">&lt;!-- Disabled: not focusable, not announced as actionable --&gt;
&lt;button disabled&gt;Submit&lt;/button&gt;

&lt;!-- aria-disabled: focusable, announced as "dimmed" or "disabled" but still focusable --&gt;
&lt;button aria-disabled="true"&gt;Submit&lt;/button&gt;
&lt;!-- Use aria-disabled if you want users to TAB through and discover why it's disabled --&gt;
</code></pre>

<h3>Example 8: Reduced motion handling</h3>
<pre><code class="language-tsx">function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() =&gt; {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) =&gt; setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () =&gt; mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

// Usage
function FadeIn({ children }) {
  const reduced = useReducedMotion();
  return (
    &lt;div style={{ transition: reduced ? 'none' : 'opacity 300ms' }}&gt;
      {children}
    &lt;/div&gt;
  );
}
</code></pre>

<h3>Example 9: Toast notification</h3>
<pre><code class="language-html">&lt;!-- Polite toast: queues, doesn't interrupt --&gt;
&lt;div aria-live="polite" aria-atomic="true" id="toasts"&gt;
  &lt;div role="status"&gt;
    Message sent successfully
  &lt;/div&gt;
&lt;/div&gt;
</code></pre>

<h3>Example 10: Accessible link card</h3>
<pre><code class="language-html">&lt;article class="card"&gt;
  &lt;h2&gt;
    &lt;a href="/post/123"&gt;Article title&lt;/a&gt;
  &lt;/h2&gt;
  &lt;p&gt;Excerpt...&lt;/p&gt;
&lt;/article&gt;

&lt;!-- Anti-pattern: wrapping the entire card in &lt;a&gt; — works but confusing --&gt;
&lt;a href="/post/123" class="card"&gt;
  &lt;h2&gt;Article title&lt;/h2&gt;
  &lt;p&gt;Excerpt...&lt;/p&gt;
&lt;/a&gt;

&lt;!-- Modern: pseudo-link card pattern with link only on heading --&gt;
&lt;article class="card"&gt;
  &lt;h2&gt;&lt;a href="/post/123"&gt;Title&lt;/a&gt;&lt;/h2&gt;
  &lt;p&gt;Excerpt...&lt;/p&gt;
&lt;/article&gt;
&lt;style&gt;
  .card { position: relative; }
  .card a::after {
    content: '';
    position: absolute;
    inset: 0;   /* makes whole card clickable */
  }
&lt;/style&gt;
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Hidden vs aria-hidden vs visibility</h3>
<table>
  <thead><tr><th>Approach</th><th>Visible</th><th>In a11y tree</th><th>Tabbable</th></tr></thead>
  <tbody>
    <tr><td>display: none</td><td>No</td><td>No</td><td>No</td></tr>
    <tr><td>visibility: hidden</td><td>No</td><td>No</td><td>No</td></tr>
    <tr><td>aria-hidden="true"</td><td>Yes</td><td>No</td><td>Yes (BAD!)</td></tr>
    <tr><td>hidden attribute</td><td>No</td><td>No</td><td>No</td></tr>
    <tr><td>opacity: 0</td><td>No</td><td>Yes</td><td>Yes</td></tr>
    <tr><td>.sr-only (clipped)</td><td>No (visually)</td><td>Yes</td><td>Depends on element</td></tr>
  </tbody>
</table>
<p>Don't put aria-hidden on focusable elements; they remain tabbable but invisible to screen readers — confusing.</p>

<h3>Skip links and focus</h3>
<p>Skip-link href targets <code>#main</code>. Without <code>tabindex="-1"</code> on the main element, browsers may not actually move focus there (only scroll). Add tabindex.</p>

<h3>Modal that doesn't close on Escape</h3>
<p>Most users expect Escape to close. Native <code>&lt;dialog&gt;</code> handles it; custom modals must wire it manually.</p>

<h3>Custom controls without keyboard</h3>
<pre><code class="language-tsx">// BAD — div+onClick; no keyboard
&lt;div onClick={...}&gt;Click me&lt;/div&gt;

// GOOD — button (best)
&lt;button onClick={...}&gt;Click me&lt;/button&gt;

// If you MUST use a div (rare)
&lt;div
  role="button"
  tabIndex={0}
  onClick={handle}
  onKeyDown={(e) =&gt; { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handle(); } }}
&gt;Click me&lt;/div&gt;
</code></pre>

<h3>aria-label on non-interactive elements</h3>
<p><code>aria-label</code> only applies to elements that have a role. <code>&lt;div aria-label="..."&gt;</code> is silently ignored unless the div has a role (interactive or landmark).</p>

<h3>Empty alt for decorative images</h3>
<p><code>alt=""</code> tells screen readers "skip this." Missing <code>alt</code> entirely makes them announce the filename. Always include alt; empty for decorative.</p>

<h3>Live region timing</h3>
<p>Live regions announce when content changes. They must be in the DOM <em>before</em> the change; a freshly inserted live region's content may not be announced. Mount empty; update.</p>

<h3>Multiple live regions</h3>
<p>Many simultaneous live regions can cause "VoiceOver chaos" where announcements interrupt each other. Use one <code>polite</code> region for status, one <code>assertive</code> for errors only.</p>

<h3>Focus restoration after navigation</h3>
<p>SPA route change keeps focus where it was (often on a link in nav). Screen reader users hear the navigation but no announce of the new page. Manually focus a heading or main on each route change.</p>

<h3>iframes need title</h3>
<p>Without <code>title</code>, screen readers say "frame" — useless. Always include.</p>

<h3>Buttons inside tables</h3>
<pre><code class="language-html">&lt;td&gt;
  &lt;button&gt;Delete&lt;/button&gt;   &lt;!-- ambiguous: delete what? --&gt;
&lt;/td&gt;

&lt;!-- Better --&gt;
&lt;td&gt;
  &lt;button aria-label="Delete row for John Smith"&gt;Delete&lt;/button&gt;
&lt;/td&gt;
</code></pre>

<h3>VoiceOver vs NVDA vs JAWS differences</h3>
<p>Each screen reader behaves slightly differently. Test with multiple. VoiceOver + Safari is iOS / macOS. NVDA + Firefox/Chrome is Windows. JAWS is enterprise Windows.</p>

<h3>Focus visible vs focus</h3>
<p><code>:focus</code> applies to all focused elements (mouse + keyboard). <code>:focus-visible</code> applies only when the focus is keyboard-driven. Use <code>:focus-visible</code> to show focus rings only when needed.</p>

<h3>Reduced motion is per-OS</h3>
<p>iOS / macOS / Android / Windows all expose this preference. Honor it. Reanimated and CSS both respect it.</p>

<h3>Dynamic content that doesn't update</h3>
<p>Updating a div's text doesn't announce by default. Use <code>aria-live="polite"</code> or <code>role="status"</code> on the container.</p>

<h3>Color contrast in dark mode</h3>
<p>Light-mode contrast may pass; dark-mode fails. Test both color schemes.</p>

<h3>Touch target spacing</h3>
<p>Two 24px buttons next to each other with no spacing fail WCAG 2.2 because tappable area overlaps. Add 8-12px gap.</p>

<h3>Auto-rotating carousels</h3>
<p>Auto-advance is hostile to readers (text disappears mid-read) and motion-sensitive users. Provide pause and respect prefers-reduced-motion.</p>

<h3>Time limits</h3>
<p>WCAG requires that time limits be adjustable, extendable, or removable. "Session expires in 30 sec" with no way to extend = WCAG fail.</p>

<h3>Captions and transcripts</h3>
<p>Videos need captions; audio needs transcripts. Auto-captions are a starting point but not sufficient for compliance.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: div+onClick instead of button</h3>
<p>Not focusable, not announced as interactive, no keyboard support. Use <code>&lt;button&gt;</code>.</p>

<h3>Bug 2: Missing alt</h3>
<pre><code class="language-html">&lt;img src="..." /&gt;   ← screen reader announces filename
&lt;img src="..." alt="..." /&gt;   ← required even if empty
</code></pre>

<h3>Bug 3: outline: none without alternative</h3>
<pre><code class="language-css">/* BAD — invisible focus */
button:focus { outline: none; }

/* GOOD */
button:focus-visible {
  outline: 2px solid var(--focus-color);
  outline-offset: 2px;
}
</code></pre>

<h3>Bug 4: Invisible focus, visible text-color</h3>
<p>Buttons styled with no focus ring, just text-color change. Insufficient for many users. Add a real outline or border change.</p>

<h3>Bug 5: aria-label on disabled element</h3>
<p>Disabled elements aren't focusable; aria-label may not be read. If you want users to discover why a button is disabled, use aria-disabled instead.</p>

<h3>Bug 6: Skipped heading level</h3>
<pre><code class="language-html">&lt;h1&gt;Page&lt;/h1&gt;
&lt;h3&gt;Subsection&lt;/h3&gt;   ← skipped h2; confuses screen readers
</code></pre>

<h3>Bug 7: aria-live="assertive" overuse</h3>
<p>Assertive interrupts whatever the user is reading. Overuse means screen reader users can't read anything in peace. Use polite by default.</p>

<h3>Bug 8: form input without label</h3>
<pre><code class="language-html">&lt;input type="email" placeholder="Email" /&gt;   ← placeholder is not a label

&lt;label for="e"&gt;Email&lt;/label&gt;
&lt;input id="e" type="email" placeholder="user@example.com" /&gt;
</code></pre>

<h3>Bug 9: Decorative SVG announced</h3>
<pre><code class="language-html">&lt;svg&gt;...&lt;/svg&gt;   ← may be announced as "image"

&lt;svg aria-hidden="true"&gt;...&lt;/svg&gt;
&lt;!-- or --&gt;
&lt;svg role="img" aria-label="Description"&gt;...&lt;/svg&gt;
</code></pre>

<h3>Bug 10: Nested interactive elements</h3>
<pre><code class="language-html">&lt;a href="..."&gt;
  &lt;button&gt;Click&lt;/button&gt;   ← invalid; ambiguous what click does
&lt;/a&gt;
</code></pre>

<h3>Anti-pattern 1: Adding ARIA to "fix" semantic gaps</h3>
<p>If you find yourself adding lots of role + aria-label + aria-controls, ask if a native element would solve the problem.</p>

<h3>Anti-pattern 2: Color as the only differentiator</h3>
<p>Required field marked only with red color. Add text "Required" or icon.</p>

<h3>Anti-pattern 3: Hover-only interactions</h3>
<p>Tooltips that only appear on hover are unreachable on touch + keyboard. Make them appear on focus and tap.</p>

<h3>Anti-pattern 4: Skipping a11y testing</h3>
<p>Lighthouse / axe catches many issues automatically. Manual screen reader testing catches real-world ones. Both are needed.</p>

<h3>Anti-pattern 5: a11y as "afterthought"</h3>
<p>Retrofitting a11y after launch is 10× more expensive than building it in. Test with keyboard from day 1.</p>

<h3>Anti-pattern 6: Animating into reduced-motion</h3>
<p>Motion that respects prefers-reduced-motion across the app inconsistently. One animation respects, another doesn't. Build a hook / utility that all motion uses.</p>

<h3>Anti-pattern 7: Custom focus management without restoration</h3>
<p>Modal opens, focus moves in. Modal closes, focus is lost (body). Always restore to the trigger element.</p>

<h3>Anti-pattern 8: ARIA roles on landmarks</h3>
<p><code>&lt;header role="banner"&gt;</code> is redundant; the element implies the role. Don't add ARIA when HTML provides it.</p>

<h3>Anti-pattern 9: Custom tooltips with no keyboard reach</h3>
<p>Hover-only tooltip is unreachable for keyboard / touch. Use native <code>title</code> attribute or a real tooltip widget with focus-visible behavior.</p>

<h3>Anti-pattern 10: Treating a11y as someone else's job</h3>
<p>"The QA team will catch a11y bugs." They might catch some; many require code changes that aren't trivial. Make a11y everyone's responsibility.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '🎤 Interview Patterns',
      html: `
<h3>The 14 questions worth rehearsing</h3>
<table>
  <thead><tr><th>Question</th><th>One-liner</th></tr></thead>
  <tbody>
    <tr><td><em>What's WCAG?</em></td><td>Web Content Accessibility Guidelines; AA is the practical target.</td></tr>
    <tr><td><em>What are POUR?</em></td><td>Perceivable, Operable, Understandable, Robust — WCAG's four principles.</td></tr>
    <tr><td><em>Why semantic HTML?</em></td><td>Built-in a11y, keyboard support, screen reader recognition for free.</td></tr>
    <tr><td><em>3 rules of ARIA?</em></td><td>Don't use it when HTML works; don't change semantics; keyboard-operable.</td></tr>
    <tr><td><em>How to make a div clickable?</em></td><td>Use button. If you must use div: role="button", tabIndex=0, onKeyDown for Enter/Space.</td></tr>
    <tr><td><em>What's a focus trap?</em></td><td>Keep keyboard focus within a container (modal). Native <code>&lt;dialog&gt;</code> with showModal handles it.</td></tr>
    <tr><td><em>Live region — polite vs assertive?</em></td><td>Polite waits for current speech; assertive interrupts. Default polite.</td></tr>
    <tr><td><em>Color contrast ratio?</em></td><td>4.5:1 normal, 3:1 large/UI components for AA.</td></tr>
    <tr><td><em>How to handle SPA route changes?</em></td><td>Move focus to top of new page; announce route via live region.</td></tr>
    <tr><td><em>Disabled vs aria-disabled?</em></td><td>disabled: not focusable. aria-disabled: focusable but inert; lets keyboard users discover.</td></tr>
    <tr><td><em>Decorative image?</em></td><td>alt="" (empty alt), or aria-hidden on SVG.</td></tr>
    <tr><td><em>Skip link?</em></td><td>Top-of-page link to main content; visually hidden until focused.</td></tr>
    <tr><td><em>Reduced motion?</em></td><td>prefers-reduced-motion media query; respect for vestibular sensitivity.</td></tr>
    <tr><td><em>Testing tools?</em></td><td>axe DevTools, Lighthouse, NVDA / VoiceOver, jest-axe, pa11y.</td></tr>
  </tbody>
</table>

<h3>Live coding warmups</h3>
<ol>
  <li>Add labels to a form.</li>
  <li>Make a custom dropdown keyboard accessible.</li>
  <li>Implement a focus trap in a modal.</li>
  <li>Add a skip-to-content link.</li>
  <li>Add live region for async status updates.</li>
  <li>Audit a page with axe DevTools and fix top issues.</li>
  <li>Write an icon button with proper aria-label.</li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>div+onClick — should be button.</li>
  <li>img without alt — accessibility failure.</li>
  <li>outline: none with no alternative — invisible focus.</li>
  <li>Modal without focus trap — keyboard escapes the modal.</li>
  <li>Color-only required field marker — fails for color-blind.</li>
  <li>placeholder used as label — disappears on focus.</li>
  <li>aria-live region added when message arrives — should pre-exist.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Semantic discipline</td><td>You reach for native elements first.</td></tr>
    <tr><td>Keyboard fluency</td><td>You verify keyboard works without thinking.</td></tr>
    <tr><td>Screen reader awareness</td><td>You name VoiceOver / NVDA, you understand the a11y tree.</td></tr>
    <tr><td>Focus management</td><td>You handle modals, route changes, async correctly.</td></tr>
    <tr><td>WCAG knowledge</td><td>You know contrast ratios, the four principles, AA target.</td></tr>
    <tr><td>ARIA restraint</td><td>You volunteer "don't use ARIA when HTML works."</td></tr>
    <tr><td>Testing discipline</td><td>You include axe in CI; you test manually with screen readers.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN's a11y model mirrors web's: <code>accessibilityRole</code> ↔ HTML role; <code>accessibilityLabel</code> ↔ aria-label; <code>accessibilityState</code> ↔ ARIA states.</li>
  <li><strong>VoiceOver (iOS) and TalkBack (Android)</strong> are the dominant mobile screen readers.</li>
  <li><strong>Switch Control / Voice Control</strong> are alternative input modes; touch targets and clearly-labeled controls help.</li>
  <li><strong>Dynamic Type</strong> on iOS lets users scale text; respect via <code>allowFontScaling</code>.</li>
  <li><strong>Reduce Motion</strong> via <code>AccessibilityInfo.isReduceMotionEnabled()</code>.</li>
  <li><strong>Focus management</strong> in RN: <code>setAccessibilityFocus</code> after navigation.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"What's the accessibility tree?"</em> — Browser-derived tree of meaningful elements that assistive tech queries; built from DOM + ARIA + computed styles.</li>
  <li><em>"Why is keyboard navigation important?"</em> — Many assistive tech (screen readers, switch access, voice control) speaks to the browser via keyboard. Keyboard-first ensures all those work.</li>
  <li><em>"How does the screen reader pick up dynamic content?"</em> — Via aria-live regions; the region must exist before content updates.</li>
  <li><em>"What's the difference between aria-hidden and visually hidden?"</em> — aria-hidden removes from a11y tree (still visible). .sr-only hides visually but keeps in a11y tree.</li>
  <li><em>"Why is placeholder not a label?"</em> — Disappears on focus; insufficient contrast; not announced consistently. Use a real label.</li>
  <li><em>"How does WCAG 2.2 differ from 2.1?"</em> — Adds focus-visible appearance, dragging movements alternative, target size minimum (24×24), accessible authentication, redundant entry, consistent help.</li>
</ul>

<h3>"What I'd do day one on the team"</h3>
<ul>
  <li>Run axe DevTools on the homepage and top 5 routes.</li>
  <li>Verify keyboard navigation works across the entire app.</li>
  <li>Test top flows with VoiceOver (Mac) or NVDA (Windows).</li>
  <li>Audit color contrast across the design system.</li>
  <li>Add jest-axe / pa11y to CI.</li>
  <li>Verify form labels, image alts, button types.</li>
  <li>Document a11y conventions in the team wiki.</li>
  <li>Identify the worst-offender page; create a focused fix plan.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd add automated a11y testing on every PR via axe-core."</li>
  <li>"I'd integrate Storybook a11y addon for per-component checks."</li>
  <li>"I'd run a screen-reader testing session monthly with a person who uses one."</li>
  <li>"I'd add a 'a11y review' step to every design doc."</li>
  <li>"I'd build a design-system component library where every component is a11y-tested by default."</li>
</ul>
`
    }
  ]
});
