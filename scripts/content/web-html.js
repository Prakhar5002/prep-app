window.PREP_SITE.registerTopic({
  id: 'web-html',
  module: 'web',
  title: 'HTML',
  estimatedReadTime: '40 min',
  tags: ['html', 'semantic-html', 'forms', 'meta', 'doctype', 'parsing', 'preload', 'aria', 'web'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>HTML</strong> is not just markup — it's the document model the browser parses into the DOM, the contract for accessibility, the surface for SEO, and the configuration layer for everything from caching to security policies. Senior frontend engineers treat HTML deliberately: choosing semantic elements, structuring forms correctly, adding the right meta tags, controlling resource loading priority.</p>
<ul>
  <li><strong>Doctype matters:</strong> <code>&lt;!DOCTYPE html&gt;</code> triggers standards mode; missing it = quirks mode + bugs.</li>
  <li><strong>Semantic elements</strong> (<code>&lt;header&gt;</code>, <code>&lt;nav&gt;</code>, <code>&lt;main&gt;</code>, <code>&lt;article&gt;</code>, <code>&lt;section&gt;</code>) signal structure to assistive tech and search engines for free.</li>
  <li><strong>Forms have rich semantics:</strong> <code>label</code>, <code>fieldset</code>, <code>autocomplete</code>, <code>inputmode</code>, validation attributes — most "form bugs" come from skipping these.</li>
  <li><strong>Meta tags</strong> control SEO, social sharing, viewport, theme color, and security headers (CSP).</li>
  <li><strong>Resource hints:</strong> <code>preload</code>, <code>prefetch</code>, <code>preconnect</code>, <code>dns-prefetch</code> — when used right, shave hundreds of ms.</li>
  <li><strong>Loading attributes:</strong> <code>defer</code> vs <code>async</code> on scripts; <code>loading="lazy"</code> on images and iframes.</li>
  <li><strong>The blocking model:</strong> CSS blocks render; sync scripts block parse + render; <code>defer</code> scripts wait for parse to complete.</li>
  <li><strong>HTML for mobile:</strong> viewport meta, theme-color, app icons, touch handling, native-app banners.</li>
</ul>
<p><strong>Mantra:</strong> "Semantic, accessible, performance-aware. HTML is the foundation; get it right or fight it forever in CSS and JS."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What HTML actually is</h3>
<p>HTML (HyperText Markup Language) is a markup language that describes the structure of web documents. The browser parses HTML into a DOM tree, applies CSS to style it, runs JS to make it interactive. HTML is the seed; everything else is downstream.</p>

<p>But "describes structure" undersells it. HTML also:</p>
<ul>
  <li>Declares the document's accessibility tree (used by screen readers, voice control, switch access).</li>
  <li>Configures resource loading priorities and caching strategies via <code>&lt;link&gt;</code>, <code>&lt;script&gt;</code>, <code>&lt;meta&gt;</code>.</li>
  <li>Sets security context via meta tags and request headers from <code>&lt;link&gt;</code>.</li>
  <li>Provides SEO signals (title, meta description, headings, structured data).</li>
  <li>Configures mobile-specific rendering via viewport, theme-color, etc.</li>
</ul>

<h3>HTML5 vs older versions</h3>
<p>"HTML5" is shorthand for the modern, living standard. Doctype <code>&lt;!DOCTYPE html&gt;</code> activates it. Earlier doctypes (XHTML 1.0, HTML 4.01) had stricter parsing rules; HTML5 codified what browsers actually do, including error recovery.</p>

<h3>Why semantic HTML matters</h3>
<table>
  <thead><tr><th>Reason</th><th>Detail</th></tr></thead>
  <tbody>
    <tr><td>Accessibility</td><td>Screen readers announce <code>&lt;nav&gt;</code> as "navigation," <code>&lt;main&gt;</code> as the main content, <code>&lt;button&gt;</code> as actionable. <code>&lt;div&gt;</code> says nothing.</td></tr>
    <tr><td>SEO</td><td>Search engines extract structure from headings, articles, sections.</td></tr>
    <tr><td>Reader mode / parsers</td><td>Safari Reader, browser-based "view-as-text" tools, RSS readers, AI scrapers — all benefit.</td></tr>
    <tr><td>Free behaviors</td><td><code>&lt;button&gt;</code> handles Enter/Space natively; <code>&lt;a&gt;</code> handles right-click "open in new tab"; <code>&lt;input type="checkbox"&gt;</code> handles keyboard.</td></tr>
    <tr><td>Less code</td><td>Native elements bring built-in styling, focus management, ARIA defaults.</td></tr>
  </tbody>
</table>

<h3>Why interviewers ask about HTML</h3>
<ol>
  <li>Tests "fundamentals" — many candidates skip HTML in favor of frameworks.</li>
  <li>Accessibility literacy is a senior signal.</li>
  <li>Performance: knowing <code>defer</code> vs <code>async</code>, <code>preload</code>, lazy loading saves real time.</li>
  <li>Security: knowing CSP meta tags, sandbox iframes, opener-noopener.</li>
  <li>Mobile-relevance: viewport meta, theme-color, app icons, web app manifests.</li>
</ol>

<h3>HTML for React / RN devs</h3>
<p>RN doesn't render HTML — it renders native components. But:</p>
<ul>
  <li>If you build web (RN Web, Next.js, your team's marketing site), HTML matters.</li>
  <li>RN's accessibility model mirrors HTML's — <code>accessibilityRole</code> maps to <code>role</code>; <code>accessibilityLabel</code> to <code>aria-label</code>.</li>
  <li>System design rounds often touch on web platform basics.</li>
</ul>

<h3>What "good" looks like</h3>
<ul>
  <li>You use semantic elements without thinking ("button" not "div with onClick").</li>
  <li>Every form input has a label.</li>
  <li>Every image has alt text (or empty alt for decorative).</li>
  <li>The page has one <code>&lt;h1&gt;</code> and a logical heading order.</li>
  <li>Scripts use <code>defer</code> by default; <code>async</code> for analytics.</li>
  <li>Critical resources are preloaded; non-critical are lazy-loaded.</li>
  <li>Your meta tags cover viewport, charset, theme-color, social cards.</li>
  <li>You know when to use <code>&lt;dialog&gt;</code>, <code>&lt;details&gt;</code>, <code>&lt;datalist&gt;</code>, <code>&lt;output&gt;</code>.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The document structure</h3>
<pre><code class="language-html">&lt;!DOCTYPE html&gt;
&lt;html lang="en"&gt;
  &lt;head&gt;
    &lt;meta charset="UTF-8" /&gt;
    &lt;meta name="viewport" content="width=device-width, initial-scale=1" /&gt;
    &lt;title&gt;Page Title&lt;/title&gt;
    &lt;meta name="description" content="..." /&gt;
    &lt;link rel="stylesheet" href="/styles.css" /&gt;
  &lt;/head&gt;
  &lt;body&gt;
    &lt;header&gt;...&lt;/header&gt;
    &lt;nav&gt;...&lt;/nav&gt;
    &lt;main&gt;
      &lt;article&gt;
        &lt;h1&gt;Title&lt;/h1&gt;
        &lt;section&gt;...&lt;/section&gt;
      &lt;/article&gt;
    &lt;/main&gt;
    &lt;aside&gt;...&lt;/aside&gt;
    &lt;footer&gt;...&lt;/footer&gt;
    &lt;script src="/app.js" defer&gt;&lt;/script&gt;
  &lt;/body&gt;
&lt;/html&gt;
</code></pre>

<h3>The semantic landmark elements</h3>
<table>
  <thead><tr><th>Element</th><th>Meaning</th><th>ARIA role</th></tr></thead>
  <tbody>
    <tr><td><code>&lt;header&gt;</code></td><td>Banner for the page or section</td><td>banner (when top-level)</td></tr>
    <tr><td><code>&lt;nav&gt;</code></td><td>Navigation links</td><td>navigation</td></tr>
    <tr><td><code>&lt;main&gt;</code></td><td>The main content (one per page)</td><td>main</td></tr>
    <tr><td><code>&lt;article&gt;</code></td><td>Self-contained piece (post, card)</td><td>article</td></tr>
    <tr><td><code>&lt;section&gt;</code></td><td>Generic section with heading</td><td>region (when labeled)</td></tr>
    <tr><td><code>&lt;aside&gt;</code></td><td>Tangentially related content</td><td>complementary</td></tr>
    <tr><td><code>&lt;footer&gt;</code></td><td>Footer for page or section</td><td>contentinfo (when top-level)</td></tr>
    <tr><td><code>&lt;form&gt;</code></td><td>Form</td><td>form (when labeled)</td></tr>
    <tr><td><code>&lt;search&gt;</code></td><td>Search section (newer)</td><td>search</td></tr>
  </tbody>
</table>

<h3>The interactive elements</h3>
<table>
  <thead><tr><th>Element</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td><code>&lt;button&gt;</code></td><td>Action; same-page interaction</td></tr>
    <tr><td><code>&lt;a&gt;</code></td><td>Link to another URL or in-page anchor</td></tr>
    <tr><td><code>&lt;input&gt;</code></td><td>Text, number, email, date, file, checkbox, radio, range</td></tr>
    <tr><td><code>&lt;textarea&gt;</code></td><td>Multi-line text</td></tr>
    <tr><td><code>&lt;select&gt; / &lt;option&gt;</code></td><td>Dropdown</td></tr>
    <tr><td><code>&lt;details&gt; / &lt;summary&gt;</code></td><td>Accordion / disclosure widget (free toggle behavior)</td></tr>
    <tr><td><code>&lt;dialog&gt;</code></td><td>Modal dialog (free focus trap and Escape handling)</td></tr>
    <tr><td><code>&lt;output&gt;</code></td><td>Result of a calculation; live region by default</td></tr>
    <tr><td><code>&lt;progress&gt;</code></td><td>Progress bar</td></tr>
    <tr><td><code>&lt;meter&gt;</code></td><td>Value within a range (battery, score)</td></tr>
  </tbody>
</table>

<h3>Heading hierarchy</h3>
<p>One <code>&lt;h1&gt;</code> per page (the document title). <code>&lt;h2&gt;</code>-<code>&lt;h6&gt;</code> form a hierarchy. Don't skip levels (<code>h1</code> → <code>h3</code> is bad). Screen reader users navigate by heading; broken hierarchy = lost users.</p>

<h3>Form anatomy</h3>
<pre><code class="language-html">&lt;form action="/submit" method="POST"&gt;
  &lt;fieldset&gt;
    &lt;legend&gt;Account details&lt;/legend&gt;

    &lt;label for="email"&gt;Email&lt;/label&gt;
    &lt;input
      id="email"
      name="email"
      type="email"
      required
      autocomplete="email"
      inputmode="email"
    /&gt;

    &lt;label for="pw"&gt;Password&lt;/label&gt;
    &lt;input
      id="pw"
      name="password"
      type="password"
      minlength="8"
      autocomplete="new-password"
    /&gt;
  &lt;/fieldset&gt;

  &lt;button type="submit"&gt;Sign Up&lt;/button&gt;
&lt;/form&gt;
</code></pre>

<h3>The blocking model — what slows page load</h3>
<table>
  <thead><tr><th>Resource</th><th>Blocks parsing?</th><th>Blocks render?</th></tr></thead>
  <tbody>
    <tr><td>Synchronous <code>&lt;script&gt;</code></td><td>Yes</td><td>Yes</td></tr>
    <tr><td><code>&lt;script defer&gt;</code></td><td>No (executes after parse)</td><td>No</td></tr>
    <tr><td><code>&lt;script async&gt;</code></td><td>No (executes when ready)</td><td>No</td></tr>
    <tr><td><code>&lt;script type="module"&gt;</code></td><td>No (deferred by default)</td><td>No</td></tr>
    <tr><td><code>&lt;link rel="stylesheet"&gt;</code></td><td>No</td><td>Yes</td></tr>
    <tr><td><code>&lt;link rel="preload"&gt;</code></td><td>No</td><td>No</td></tr>
    <tr><td>Images / fonts</td><td>No</td><td>No (but trigger reflow when loaded)</td></tr>
  </tbody>
</table>

<h3>defer vs async</h3>
<table>
  <thead><tr><th>defer</th><th>async</th></tr></thead>
  <tbody>
    <tr><td>Downloads in parallel with parsing</td><td>Downloads in parallel with parsing</td></tr>
    <tr><td>Executes AFTER parse, in document order</td><td>Executes AS SOON AS downloaded (any order)</td></tr>
    <tr><td>Scripts can depend on DOM and each other</td><td>Scripts must be self-contained</td></tr>
    <tr><td>Use for: app code</td><td>Use for: analytics, feature-flag SDKs (independent)</td></tr>
  </tbody>
</table>

<h3>Resource hints</h3>
<table>
  <thead><tr><th>Hint</th><th>What it does</th></tr></thead>
  <tbody>
    <tr><td><code>&lt;link rel="preload" as="font" href="..."&gt;</code></td><td>"I will use this resource soon — fetch with high priority"</td></tr>
    <tr><td><code>&lt;link rel="prefetch" href="..."&gt;</code></td><td>"I might use this on a future page — fetch with low priority"</td></tr>
    <tr><td><code>&lt;link rel="preconnect" href="https://api..."&gt;</code></td><td>"Open the connection now (DNS + TCP + TLS)"</td></tr>
    <tr><td><code>&lt;link rel="dns-prefetch" href="..."&gt;</code></td><td>"Resolve DNS for this host now"</td></tr>
    <tr><td><code>&lt;link rel="modulepreload" href="..."&gt;</code></td><td>Like preload, optimized for ES modules</td></tr>
  </tbody>
</table>

<h3>Image loading</h3>
<table>
  <thead><tr><th>Attribute</th><th>Effect</th></tr></thead>
  <tbody>
    <tr><td><code>loading="lazy"</code></td><td>Browser defers loading until near viewport</td></tr>
    <tr><td><code>loading="eager"</code></td><td>Default; load immediately</td></tr>
    <tr><td><code>decoding="async"</code></td><td>Don't block render on image decode</td></tr>
    <tr><td><code>fetchpriority="high"</code></td><td>Bumps priority (e.g., LCP image)</td></tr>
    <tr><td><code>fetchpriority="low"</code></td><td>Below-fold images</td></tr>
    <tr><td><code>srcset</code></td><td>Multiple resolution candidates; browser picks</td></tr>
    <tr><td><code>sizes</code></td><td>Hints viewport widths to help srcset selection</td></tr>
  </tbody>
</table>

<h3>Mobile viewport</h3>
<pre><code class="language-html">&lt;meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" /&gt;
</code></pre>
<ul>
  <li><code>width=device-width</code> — match the device's CSS pixel width.</li>
  <li><code>initial-scale=1</code> — no zoom on load.</li>
  <li><code>viewport-fit=cover</code> — extend below the iOS home indicator (with safe-area-inset).</li>
  <li>Avoid <code>user-scalable=no</code> — accessibility issue; users may need to zoom.</li>
</ul>

<h3>Social / SEO meta</h3>
<pre><code class="language-html">&lt;title&gt;Page Title — Site Name&lt;/title&gt;
&lt;meta name="description" content="..." /&gt;
&lt;link rel="canonical" href="https://..." /&gt;

&lt;!-- Open Graph (Facebook, LinkedIn, Slack) --&gt;
&lt;meta property="og:title" content="..." /&gt;
&lt;meta property="og:description" content="..." /&gt;
&lt;meta property="og:image" content="..." /&gt;
&lt;meta property="og:url" content="..." /&gt;
&lt;meta property="og:type" content="website" /&gt;

&lt;!-- Twitter Card --&gt;
&lt;meta name="twitter:card" content="summary_large_image" /&gt;
&lt;meta name="twitter:image" content="..." /&gt;
</code></pre>

<h3>Theme & icons</h3>
<pre><code class="language-html">&lt;meta name="theme-color" content="#0a84ff" /&gt;
&lt;meta name="theme-color" content="#0a84ff" media="(prefers-color-scheme: light)" /&gt;
&lt;meta name="theme-color" content="#1a1a1a" media="(prefers-color-scheme: dark)" /&gt;

&lt;link rel="icon" href="/favicon.ico" /&gt;
&lt;link rel="apple-touch-icon" href="/apple-touch-icon.png" /&gt;
&lt;link rel="manifest" href="/manifest.json" /&gt;
</code></pre>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Semantic vs div-soup</h3>
<pre><code class="language-html">&lt;!-- div-soup --&gt;
&lt;div class="header"&gt;
  &lt;div class="nav"&gt;
    &lt;div class="link"&gt;Home&lt;/div&gt;
    &lt;div class="link"&gt;About&lt;/div&gt;
  &lt;/div&gt;
&lt;/div&gt;

&lt;!-- semantic --&gt;
&lt;header&gt;
  &lt;nav&gt;
    &lt;ul&gt;
      &lt;li&gt;&lt;a href="/"&gt;Home&lt;/a&gt;&lt;/li&gt;
      &lt;li&gt;&lt;a href="/about"&gt;About&lt;/a&gt;&lt;/li&gt;
    &lt;/ul&gt;
  &lt;/nav&gt;
&lt;/header&gt;
</code></pre>

<h3>Native dialog</h3>
<pre><code class="language-html">&lt;dialog id="myDialog"&gt;
  &lt;h2&gt;Confirm action&lt;/h2&gt;
  &lt;p&gt;Are you sure?&lt;/p&gt;
  &lt;form method="dialog"&gt;
    &lt;button value="cancel"&gt;Cancel&lt;/button&gt;
    &lt;button value="confirm"&gt;Confirm&lt;/button&gt;
  &lt;/form&gt;
&lt;/dialog&gt;
</code></pre>
<pre><code class="language-js">const dlg = document.getElementById('myDialog');
dlg.showModal();   // opens with native focus trap, Escape-to-close
dlg.addEventListener('close', () =&gt; console.log(dlg.returnValue));
</code></pre>

<h3>Native disclosure</h3>
<pre><code class="language-html">&lt;details&gt;
  &lt;summary&gt;FAQ: How does this work?&lt;/summary&gt;
  &lt;p&gt;Detail text...&lt;/p&gt;
&lt;/details&gt;

&lt;details open&gt;
  &lt;summary&gt;Already expanded&lt;/summary&gt;
  &lt;p&gt;Visible by default.&lt;/p&gt;
&lt;/details&gt;
</code></pre>

<h3>Form validation attributes</h3>
<table>
  <thead><tr><th>Attribute</th><th>Meaning</th></tr></thead>
  <tbody>
    <tr><td><code>required</code></td><td>Must be filled</td></tr>
    <tr><td><code>minlength / maxlength</code></td><td>Length bounds for text</td></tr>
    <tr><td><code>min / max</code></td><td>Numeric / date bounds</td></tr>
    <tr><td><code>step</code></td><td>Increment for number / date</td></tr>
    <tr><td><code>pattern</code></td><td>Regex (use sparingly; clear UX hard)</td></tr>
    <tr><td><code>type="email" / "url" / "tel"</code></td><td>Built-in format validation</td></tr>
    <tr><td><code>autocomplete</code></td><td>Hints to browser autofill</td></tr>
    <tr><td><code>inputmode</code></td><td>Soft keyboard hint (mobile)</td></tr>
  </tbody>
</table>

<h3>autocomplete values that matter</h3>
<table>
  <thead><tr><th>Value</th><th>Use case</th></tr></thead>
  <tbody>
    <tr><td><code>name</code> / <code>given-name</code> / <code>family-name</code></td><td>Person names</td></tr>
    <tr><td><code>email</code></td><td>Email</td></tr>
    <tr><td><code>tel</code></td><td>Phone</td></tr>
    <tr><td><code>street-address</code> / <code>postal-code</code> / <code>country</code></td><td>Shipping</td></tr>
    <tr><td><code>cc-name</code> / <code>cc-number</code> / <code>cc-exp</code> / <code>cc-csc</code></td><td>Credit card (browser may inject from saved cards)</td></tr>
    <tr><td><code>username</code></td><td>Login username</td></tr>
    <tr><td><code>current-password</code></td><td>Login password</td></tr>
    <tr><td><code>new-password</code></td><td>Signup / change password</td></tr>
    <tr><td><code>one-time-code</code></td><td>OTP / 2FA</td></tr>
  </tbody>
</table>

<h3>inputmode for mobile keyboards</h3>
<table>
  <thead><tr><th>Value</th><th>Keyboard</th></tr></thead>
  <tbody>
    <tr><td><code>text</code></td><td>Default</td></tr>
    <tr><td><code>numeric</code></td><td>Number pad (no decimals)</td></tr>
    <tr><td><code>decimal</code></td><td>Number pad with decimal point</td></tr>
    <tr><td><code>tel</code></td><td>Phone-style keypad</td></tr>
    <tr><td><code>email</code></td><td>QWERTY with @ visible</td></tr>
    <tr><td><code>url</code></td><td>QWERTY with .com / / visible</td></tr>
    <tr><td><code>search</code></td><td>Search-style with Search action</td></tr>
    <tr><td><code>none</code></td><td>No on-screen keyboard (custom widget)</td></tr>
  </tbody>
</table>

<h3>The <code>&lt;picture&gt;</code> element</h3>
<pre><code class="language-html">&lt;picture&gt;
  &lt;source srcset="hero.avif" type="image/avif" /&gt;
  &lt;source srcset="hero.webp" type="image/webp" /&gt;
  &lt;img src="hero.jpg" alt="Description" width="800" height="600" /&gt;
&lt;/picture&gt;

&lt;!-- Art direction (different crops per breakpoint) --&gt;
&lt;picture&gt;
  &lt;source media="(min-width: 768px)" srcset="hero-wide.jpg" /&gt;
  &lt;img src="hero-narrow.jpg" alt="..." /&gt;
&lt;/picture&gt;
</code></pre>

<h3>Responsive images via <code>srcset</code></h3>
<pre><code class="language-html">&lt;img
  src="hero-800.jpg"
  srcset="hero-400.jpg 400w, hero-800.jpg 800w, hero-1600.jpg 1600w"
  sizes="(min-width: 1024px) 800px, 100vw"
  alt="..."
  width="800" height="600"
  loading="lazy"
  decoding="async"
/&gt;
</code></pre>

<h3>Iframes</h3>
<pre><code class="language-html">&lt;iframe
  src="https://embed.example.com/x"
  title="Embedded content (required for a11y)"
  loading="lazy"
  sandbox="allow-scripts"
  referrerpolicy="no-referrer"
  allow="fullscreen; clipboard-read"
&gt;&lt;/iframe&gt;
</code></pre>
<table>
  <thead><tr><th>Attribute</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td><code>title</code></td><td>Required for a11y; describes what the iframe shows</td></tr>
    <tr><td><code>sandbox</code></td><td>Restrict capabilities (no scripts, no forms, no top-level nav, etc.)</td></tr>
    <tr><td><code>allow</code></td><td>Permissions Policy (camera, microphone, etc.)</td></tr>
    <tr><td><code>referrerpolicy</code></td><td>What referer to send</td></tr>
    <tr><td><code>loading="lazy"</code></td><td>Defer loading until near viewport</td></tr>
  </tbody>
</table>

<h3>Linking to apps from web (deep links)</h3>
<pre><code class="language-html">&lt;!-- Apple Smart App Banner --&gt;
&lt;meta name="apple-itunes-app" content="app-id=123456, app-argument=https://myapp.com/x" /&gt;

&lt;!-- Google "Open in app" via app links --&gt;
&lt;link rel="alternate" href="android-app://com.myapp/https/myapp.com/x" /&gt;
</code></pre>

<h3>The base tag</h3>
<pre><code class="language-html">&lt;base href="https://example.com/" /&gt;
</code></pre>
<p>Sets the base URL for relative links. Rarely needed; mostly used in legacy multi-document setups.</p>

<h3>Preload critical resources</h3>
<pre><code class="language-html">&lt;link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin /&gt;
&lt;link rel="preload" href="/hero.jpg" as="image" /&gt;
&lt;link rel="modulepreload" href="/main.js" /&gt;
</code></pre>

<h3>Preconnect to upcoming origins</h3>
<pre><code class="language-html">&lt;link rel="preconnect" href="https://api.myapp.com" /&gt;
&lt;link rel="preconnect" href="https://fonts.gstatic.com" crossorigin /&gt;
</code></pre>

<h3>Speculation Rules (Chrome 109+)</h3>
<pre><code class="language-html">&lt;script type="speculationrules"&gt;
{
  "prerender": [{ "where": { "href_matches": "/*" } }]
}
&lt;/script&gt;
</code></pre>
<p>Tells the browser which links are safe to prerender (full page rendered ahead of time, ready instantly on click).</p>

<h3>Microdata / structured data (SEO)</h3>
<pre><code class="language-html">&lt;script type="application/ld+json"&gt;
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Page Title",
  "author": { "@type": "Person", "name": "Jane" },
  "datePublished": "2026-04-30"
}
&lt;/script&gt;
</code></pre>

<h3>Web app manifest</h3>
<pre><code class="language-json">// manifest.json
{
  "name": "My App",
  "short_name": "App",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0a84ff",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
</code></pre>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Login form done right</h3>
<pre><code class="language-html">&lt;form action="/login" method="POST"&gt;
  &lt;label for="email"&gt;Email&lt;/label&gt;
  &lt;input
    id="email"
    name="email"
    type="email"
    required
    autocomplete="username"
    inputmode="email"
    autocapitalize="none"
    autocorrect="off"
    spellcheck="false"
  /&gt;

  &lt;label for="pw"&gt;Password&lt;/label&gt;
  &lt;input
    id="pw"
    name="password"
    type="password"
    required
    minlength="8"
    autocomplete="current-password"
  /&gt;

  &lt;button type="submit"&gt;Log in&lt;/button&gt;
&lt;/form&gt;
</code></pre>
<p>autocapitalize/autocorrect/spellcheck off prevent iOS auto-capitalizing emails. autocomplete="username" / "current-password" enables password manager autofill.</p>

<h3>Example 2: OTP input mobile-optimized</h3>
<pre><code class="language-html">&lt;input
  type="text"
  inputmode="numeric"
  autocomplete="one-time-code"
  pattern="[0-9]*"
  maxlength="6"
  aria-label="One-time verification code"
/&gt;
</code></pre>
<p>iOS suggests SMS codes via <code>autocomplete="one-time-code"</code>. inputmode shows numeric keypad.</p>

<h3>Example 3: Article with metadata</h3>
<pre><code class="language-html">&lt;article&gt;
  &lt;header&gt;
    &lt;h1&gt;Article title&lt;/h1&gt;
    &lt;p&gt;
      By &lt;a href="/authors/jane"&gt;Jane&lt;/a&gt; ·
      &lt;time datetime="2026-04-30"&gt;April 30, 2026&lt;/time&gt;
    &lt;/p&gt;
  &lt;/header&gt;

  &lt;p&gt;Lead paragraph...&lt;/p&gt;

  &lt;section aria-labelledby="part1"&gt;
    &lt;h2 id="part1"&gt;Part 1&lt;/h2&gt;
    &lt;p&gt;...&lt;/p&gt;
  &lt;/section&gt;

  &lt;footer&gt;
    &lt;p&gt;Tags: &lt;a href="/t/web"&gt;web&lt;/a&gt;&lt;/p&gt;
  &lt;/footer&gt;
&lt;/article&gt;
</code></pre>

<h3>Example 4: Loader script setup</h3>
<pre><code class="language-html">&lt;!-- Critical inline CSS --&gt;
&lt;style&gt;body { font-family: system-ui; }&lt;/style&gt;

&lt;!-- Preload critical resources --&gt;
&lt;link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin /&gt;
&lt;link rel="preload" href="/hero.webp" as="image" /&gt;

&lt;!-- DNS / connect for upcoming origins --&gt;
&lt;link rel="preconnect" href="https://api.myapp.com" /&gt;

&lt;!-- Render-blocking CSS --&gt;
&lt;link rel="stylesheet" href="/main.css" /&gt;

&lt;!-- App script — defer so doesn't block parse --&gt;
&lt;script src="/app.js" defer&gt;&lt;/script&gt;

&lt;!-- Analytics — async (independent) --&gt;
&lt;script src="/analytics.js" async&gt;&lt;/script&gt;
</code></pre>

<h3>Example 5: Image card</h3>
<pre><code class="language-html">&lt;article&gt;
  &lt;picture&gt;
    &lt;source srcset="cover.avif" type="image/avif" /&gt;
    &lt;source srcset="cover.webp" type="image/webp" /&gt;
    &lt;img
      src="cover.jpg"
      srcset="cover-400.jpg 400w, cover-800.jpg 800w"
      sizes="(min-width: 768px) 50vw, 100vw"
      alt="Yosemite valley at sunset"
      width="800" height="500"
      loading="lazy"
      decoding="async"
    /&gt;
  &lt;/picture&gt;
  &lt;h2&gt;Card title&lt;/h2&gt;
  &lt;p&gt;...&lt;/p&gt;
&lt;/article&gt;
</code></pre>

<h3>Example 6: Modal via &lt;dialog&gt;</h3>
<pre><code class="language-html">&lt;button id="open"&gt;Show settings&lt;/button&gt;

&lt;dialog id="settings"&gt;
  &lt;form method="dialog"&gt;
    &lt;h2&gt;Settings&lt;/h2&gt;
    &lt;fieldset&gt;
      &lt;legend&gt;Theme&lt;/legend&gt;
      &lt;label&gt;&lt;input type="radio" name="theme" value="light" /&gt; Light&lt;/label&gt;
      &lt;label&gt;&lt;input type="radio" name="theme" value="dark" /&gt; Dark&lt;/label&gt;
    &lt;/fieldset&gt;
    &lt;menu&gt;
      &lt;button value="cancel"&gt;Cancel&lt;/button&gt;
      &lt;button value="save"&gt;Save&lt;/button&gt;
    &lt;/menu&gt;
  &lt;/form&gt;
&lt;/dialog&gt;
</code></pre>
<pre><code class="language-js">const dlg = document.getElementById('settings');
document.getElementById('open').addEventListener('click', () =&gt; dlg.showModal());
dlg.addEventListener('close', () =&gt; {
  if (dlg.returnValue === 'save') saveSettings();
});
</code></pre>

<h3>Example 7: Skip-to-content link</h3>
<pre><code class="language-html">&lt;a href="#main" class="skip-link"&gt;Skip to main content&lt;/a&gt;
...
&lt;main id="main"&gt;...&lt;/main&gt;
</code></pre>
<pre><code class="language-css">.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
}
.skip-link:focus {
  top: 0;   /* visible on keyboard focus */
}
</code></pre>

<h3>Example 8: Native progress bar with live region</h3>
<pre><code class="language-html">&lt;progress id="upload" value="0" max="100" aria-label="Upload progress"&gt;0%&lt;/progress&gt;
&lt;output for="upload"&gt;0%&lt;/output&gt;
</code></pre>

<h3>Example 9: SEO + social meta block</h3>
<pre><code class="language-html">&lt;head&gt;
  &lt;meta charset="UTF-8" /&gt;
  &lt;meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" /&gt;
  &lt;title&gt;Article Title — Site Name&lt;/title&gt;
  &lt;meta name="description" content="A 150-character summary..." /&gt;
  &lt;link rel="canonical" href="https://site.com/article" /&gt;

  &lt;meta property="og:title" content="Article Title" /&gt;
  &lt;meta property="og:description" content="..." /&gt;
  &lt;meta property="og:image" content="https://site.com/og.jpg" /&gt;
  &lt;meta property="og:url" content="https://site.com/article" /&gt;
  &lt;meta property="og:type" content="article" /&gt;

  &lt;meta name="twitter:card" content="summary_large_image" /&gt;
  &lt;meta name="twitter:image" content="https://site.com/twitter.jpg" /&gt;

  &lt;meta name="theme-color" content="#0a84ff" /&gt;
  &lt;link rel="icon" href="/favicon.ico" /&gt;
  &lt;link rel="apple-touch-icon" href="/apple-touch-icon.png" /&gt;

  &lt;script type="application/ld+json"&gt;
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Article Title",
    "datePublished": "2026-04-30"
  }
  &lt;/script&gt;
&lt;/head&gt;
</code></pre>

<h3>Example 10: Sandboxed iframe (e.g., for user-generated content)</h3>
<pre><code class="language-html">&lt;iframe
  title="User-submitted preview"
  src="/preview"
  sandbox="allow-scripts allow-same-origin"
  loading="lazy"
  width="600" height="400"
&gt;&lt;/iframe&gt;
</code></pre>
<p>The sandbox prevents form submission, top-level navigation, popups, etc. Add only the capabilities needed.</p>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Quirks mode</h3>
<p>Missing or wrong doctype triggers quirks mode (legacy IE behaviors). Box model differs, layout breaks. Always start documents with <code>&lt;!DOCTYPE html&gt;</code>.</p>

<h3>Charset must be early</h3>
<p><code>&lt;meta charset="UTF-8"&gt;</code> must appear within the first 1024 bytes of the document; otherwise the browser may misinterpret bytes. Put it as the first meta tag.</p>

<h3>Default form submit on Enter</h3>
<p>If a form has only one input and a submit button, pressing Enter submits. Sometimes desired, sometimes not. Use <code>type="button"</code> on non-submit buttons inside forms.</p>

<h3>iOS form zoom</h3>
<p>iOS Safari zooms in when an input's font-size is &lt; 16px. To prevent: set font-size: 16px on inputs (CSS) or use <code>maximum-scale=1.0</code> in viewport meta (accessibility tradeoff).</p>

<h3>The "lazy iframe" race</h3>
<p><code>loading="lazy"</code> on iframes works but timing of "load when in viewport" is browser-decided. Some embedded analytics depend on load timing; coordinate with their docs.</p>

<h3>Async script ordering</h3>
<p>Multiple <code>async</code> scripts execute in arbitrary order. If one depends on another, use <code>defer</code> instead.</p>

<h3>Defer with body-end placement</h3>
<p>Putting <code>defer</code> scripts at the end of <code>&lt;body&gt;</code> is redundant — they're deferred either way. <code>defer</code> in <code>&lt;head&gt;</code> is the canonical place; downloads start earlier.</p>

<h3>Modules are deferred by default</h3>
<p><code>&lt;script type="module"&gt;</code> defers automatically. Don't add <code>defer</code> (no-op). Use <code>async</code> on modules if execution order doesn't matter.</p>

<h3>Conditional comments are gone</h3>
<p>IE conditional comments (<code>&lt;!--[if IE]&gt;</code>) don't work in any modern browser. Remove from templates.</p>

<h3>Empty alt for decorative images</h3>
<pre><code class="language-html">&lt;!-- Decorative — alt MUST be present but empty --&gt;
&lt;img src="divider.png" alt="" /&gt;

&lt;!-- BAD — missing alt; screen reader announces filename --&gt;
&lt;img src="divider.png" /&gt;
</code></pre>

<h3>Form without submit button</h3>
<p>Forms with no submit button can't be submitted via Enter on a single input field. Either include a submit button (can be visually hidden) or handle submission via JS.</p>

<h3>Label associations</h3>
<pre><code class="language-html">&lt;!-- explicit --&gt;
&lt;label for="email"&gt;Email&lt;/label&gt;
&lt;input id="email" /&gt;

&lt;!-- implicit (label wraps input) --&gt;
&lt;label&gt;Email &lt;input type="email" /&gt;&lt;/label&gt;

&lt;!-- BAD — no association --&gt;
&lt;span&gt;Email&lt;/span&gt;
&lt;input /&gt;
</code></pre>

<h3>Buttons inside forms default to submit</h3>
<pre><code class="language-html">&lt;form&gt;
  &lt;button onclick="...handle..."&gt;Click me&lt;/button&gt;   &lt;!-- submits the form! --&gt;
&lt;/form&gt;

&lt;!-- FIX --&gt;
&lt;button type="button"&gt;Click me&lt;/button&gt;
</code></pre>

<h3>Nested links / interactive elements</h3>
<p>HTML doesn't allow nesting interactive elements: <code>&lt;a&gt;</code> inside <code>&lt;a&gt;</code> or <code>&lt;button&gt;</code> inside <code>&lt;a&gt;</code> is invalid; browsers may behave inconsistently. Restructure.</p>

<h3>tabindex misuse</h3>
<table>
  <thead><tr><th>Value</th><th>Meaning</th></tr></thead>
  <tbody>
    <tr><td>tabindex="0"</td><td>In tab order; default for natively focusable</td></tr>
    <tr><td>tabindex="-1"</td><td>Programmatically focusable; not in tab order</td></tr>
    <tr><td>tabindex="1+" (positive)</td><td>Brings to front of tab order — almost always wrong</td></tr>
  </tbody>
</table>

<h3>Hidden vs aria-hidden vs display:none</h3>
<table>
  <thead><tr><th>Approach</th><th>Visible</th><th>In a11y tree</th><th>Tabbable</th></tr></thead>
  <tbody>
    <tr><td>display: none</td><td>No</td><td>No</td><td>No</td></tr>
    <tr><td>visibility: hidden</td><td>No</td><td>No</td><td>No</td></tr>
    <tr><td>aria-hidden="true"</td><td>Yes</td><td>No</td><td>Yes (bad)</td></tr>
    <tr><td>hidden attribute</td><td>No</td><td>No</td><td>No</td></tr>
    <tr><td>opacity: 0</td><td>No (visually)</td><td>Yes</td><td>Yes</td></tr>
  </tbody>
</table>

<h3>iframes — opener noopener</h3>
<p><code>&lt;a target="_blank"&gt;</code> without <code>rel="noopener"</code> gives the new tab access to your <code>window.opener</code>. Modern browsers default to noopener; older ones don't. Always include.</p>

<h3>Conditional rendering and IDs</h3>
<p>Multiple components rendering the same ID at once breaks accessibility associations. Use unique IDs (often via <code>useId()</code> in React 18+).</p>

<h3>Heading-only semantics</h3>
<p>Just adding <code>&lt;h2&gt;</code> doesn't make a section navigable; pair with <code>&lt;section aria-labelledby="heading-id"&gt;</code> for the screen-reader to identify it as a region.</p>

<h3>The "live region" gotcha</h3>
<p><code>aria-live="polite"</code> announces changes; "assertive" interrupts. Misuse can drive screen-reader users crazy. Use <code>polite</code> by default; <code>off</code> for purely visual updates.</p>

<h3>Iframe sandbox without same-origin</h3>
<p><code>sandbox=""</code> (empty) blocks everything including same-origin. Subtle: even reading the iframe's URL is blocked. Add specific permissions explicitly.</p>

<h3>Speculation Rules cost</h3>
<p>Prerendering eats CPU and bandwidth. Don't speculate "all links"; target high-confidence next-clicks.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: div+onClick instead of button</h3>
<pre><code class="language-html">&lt;!-- BAD — not focusable, not announced as interactive --&gt;
&lt;div onClick={handle}&gt;Click me&lt;/div&gt;

&lt;!-- GOOD --&gt;
&lt;button type="button" onClick={handle}&gt;Click me&lt;/button&gt;
</code></pre>

<h3>Bug 2: missing alt</h3>
<pre><code class="language-html">&lt;!-- BAD --&gt;
&lt;img src="hero.jpg" /&gt;

&lt;!-- GOOD (descriptive) --&gt;
&lt;img src="hero.jpg" alt="Yosemite valley at sunset" /&gt;

&lt;!-- GOOD (decorative) --&gt;
&lt;img src="divider.png" alt="" /&gt;
</code></pre>

<h3>Bug 3: forgetting <code>&lt;label&gt;</code></h3>
<pre><code class="language-html">&lt;!-- BAD --&gt;
&lt;p&gt;Email:&lt;/p&gt;
&lt;input type="email" /&gt;

&lt;!-- GOOD --&gt;
&lt;label for="email"&gt;Email&lt;/label&gt;
&lt;input id="email" type="email" /&gt;
</code></pre>

<h3>Bug 4: no defer / async on scripts in head</h3>
<pre><code class="language-html">&lt;!-- BAD — blocks parsing --&gt;
&lt;head&gt;
  &lt;script src="/app.js"&gt;&lt;/script&gt;
&lt;/head&gt;

&lt;!-- GOOD --&gt;
&lt;head&gt;
  &lt;script src="/app.js" defer&gt;&lt;/script&gt;
&lt;/head&gt;
</code></pre>

<h3>Bug 5: viewport without device-width</h3>
<pre><code class="language-html">&lt;!-- BAD — desktop scale, tiny on phones --&gt;
&lt;meta name="viewport" content="width=320" /&gt;

&lt;!-- GOOD --&gt;
&lt;meta name="viewport" content="width=device-width, initial-scale=1" /&gt;
</code></pre>

<h3>Bug 6: charset late</h3>
<p>Charset declared after non-ASCII content earlier in the document. Symptom: garbled characters. Place <code>&lt;meta charset="UTF-8"&gt;</code> as the first child of <code>&lt;head&gt;</code>.</p>

<h3>Bug 7: missing <code>title</code> on iframe</h3>
<p>Required for accessibility. Without it, screen readers say "frame" — useless to the user.</p>

<h3>Bug 8: skip in heading hierarchy</h3>
<pre><code class="language-html">&lt;h1&gt;Page&lt;/h1&gt;
&lt;h3&gt;Subsection&lt;/h3&gt;   &lt;!-- BAD: skipped h2 --&gt;
</code></pre>

<h3>Bug 9: autocomplete="off" on password fields</h3>
<p>Browsers ignore "off" for password fields (correctly — they want password managers to work). Use <code>current-password</code> or <code>new-password</code> instead.</p>

<h3>Bug 10: nesting block elements in inline</h3>
<pre><code class="language-html">&lt;!-- BAD --&gt;
&lt;a href="..."&gt;
  &lt;div&gt;...&lt;/div&gt;
&lt;/a&gt;
</code></pre>
<p>Modern HTML5 actually allows block in inline (relaxed rules), but check: text-decoration handling, focus styling, link wrapping all change.</p>

<h3>Anti-pattern 1: div soup</h3>
<p>Every UI element rendered as <code>&lt;div&gt;</code> with classes. Loses all built-in semantics, accessibility, SEO. Use semantic elements.</p>

<h3>Anti-pattern 2: skip skipping</h3>
<p>Single Page Apps without a skip-to-content link. Keyboard users hit the same nav on every route.</p>

<h3>Anti-pattern 3: <code>onclick</code> on links / forms preventing default</h3>
<p>SPA nav often hijacks <code>&lt;a&gt;</code> without preserving keyboard / screen-reader behaviors. If you intercept, ensure focus moves to new content.</p>

<h3>Anti-pattern 4: ignoring resource hints</h3>
<p>Three round trips to fetch the LCP image because no preload, no preconnect. Fix with one <code>&lt;link rel="preload"&gt;</code>.</p>

<h3>Anti-pattern 5: shipping all CSS/JS up front</h3>
<p>5MB CSS bundle blocking render. Split critical from non-critical; defer non-critical.</p>

<h3>Anti-pattern 6: ignoring <code>lang</code></h3>
<p><code>&lt;html lang="en"&gt;</code> tells browsers and screen readers the document language. Without it, voice synthesis uses wrong pronunciation.</p>

<h3>Anti-pattern 7: title-as-tooltip</h3>
<p><code>title</code> attribute renders as tooltip on hover only. Doesn't help touch users. Don't use for important info.</p>

<h3>Anti-pattern 8: aria everything</h3>
<p>Adding ARIA roles to native elements (e.g., <code>&lt;button role="button"&gt;</code>) is redundant and sometimes wrong. The first rule of ARIA: don't use ARIA when native HTML suffices.</p>

<h3>Anti-pattern 9: SEO-cargoculting</h3>
<p>Stuffing meta keywords (deprecated since ~2010), or invisible text. Modern SEO comes from semantic structure + structured data + page speed + content quality.</p>

<h3>Anti-pattern 10: no hreflang for multi-lingual</h3>
<p>Multi-lingual sites need <code>&lt;link rel="alternate" hreflang="..."&gt;</code> and proper <code>lang</code> on root. Without these, search engines may serve the wrong locale.</p>
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
    <tr><td><em>Why semantic HTML?</em></td><td>Accessibility, SEO, free behaviors, less code, parser support.</td></tr>
    <tr><td><em>What's the difference between <code>&lt;section&gt;</code> and <code>&lt;div&gt;</code>?</em></td><td>section implies a thematic group with a heading; div is generic.</td></tr>
    <tr><td><em>defer vs async?</em></td><td>defer: runs after parse, in order. async: runs as soon as downloaded, any order.</td></tr>
    <tr><td><em>What blocks render?</em></td><td>CSS (always); sync scripts (parse + render); JS execution.</td></tr>
    <tr><td><em>What's preload?</em></td><td>"I will use this resource imminently — fetch with high priority."</td></tr>
    <tr><td><em>Form best practices?</em></td><td>label + autocomplete + inputmode + validation attributes + meaningful types.</td></tr>
    <tr><td><em>How do you make an iframe safer?</em></td><td>sandbox, referrerpolicy, allow, title, loading=lazy.</td></tr>
    <tr><td><em>Why &lt;dialog&gt; over a custom modal?</em></td><td>Free focus trap, Escape to close, semantic, keyboard-accessible.</td></tr>
    <tr><td><em>What's <code>loading="lazy"</code>?</em></td><td>Defers loading the image / iframe until near viewport.</td></tr>
    <tr><td><em>Why <code>&lt;picture&gt;</code> vs srcset?</em></td><td><code>&lt;picture&gt;</code> for art direction or format selection; srcset for resolution selection.</td></tr>
    <tr><td><em>What does <code>autocomplete</code> do?</em></td><td>Hints to browser autofill; specific values like "current-password" / "one-time-code" enable rich features.</td></tr>
    <tr><td><em>What's the viewport meta?</em></td><td>Tells mobile browsers how to scale. <code>width=device-width, initial-scale=1</code> is standard.</td></tr>
    <tr><td><em>Why include <code>lang</code> attribute?</em></td><td>Browser uses it for spell-check, voice synthesis, translation hints.</td></tr>
    <tr><td><em>What's an opener / noopener?</em></td><td><code>&lt;a target="_blank" rel="noopener"&gt;</code> prevents new tab from accessing parent window — security + perf.</td></tr>
  </tbody>
</table>

<h3>Live coding warmups</h3>
<ol>
  <li>Build a semantic article page from scratch.</li>
  <li>Write a login form with all best-practice attributes.</li>
  <li>Write an OTP input that triggers iOS auto-fill.</li>
  <li>Use &lt;dialog&gt; for a confirm modal.</li>
  <li>Add resource hints + lazy loading to a hero image.</li>
  <li>Add structured data (JSON-LD) to an article.</li>
  <li>Write an iframe with appropriate sandbox + a11y.</li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>div+onClick — should be button.</li>
  <li>img without alt — accessibility issue.</li>
  <li>Sync script in head blocking parse — add defer.</li>
  <li>autocomplete="off" on password — incorrect; use specific values.</li>
  <li>Multiple h1s on one page — SEO + a11y issue.</li>
  <li>iframe missing title — a11y bug.</li>
  <li>label not associated with input — form a11y broken.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Semantic discipline</td><td>You reach for button/article/nav/main without prompting.</td></tr>
    <tr><td>Form fluency</td><td>You include label, autocomplete, inputmode, validation attributes.</td></tr>
    <tr><td>Resource hints</td><td>You volunteer preload/preconnect for critical paths.</td></tr>
    <tr><td>Loading attributes</td><td>You know defer vs async; you use loading=lazy on appropriate resources.</td></tr>
    <tr><td>A11y baseline</td><td>You've internalized the "no ARIA needed if HTML semantic" rule.</td></tr>
    <tr><td>Mobile aware</td><td>You include proper viewport, theme-color, app-icon, autocapitalize/spellcheck for mobile inputs.</td></tr>
    <tr><td>Security aware</td><td>You add rel="noopener", sandbox iframes, etc.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN doesn't render HTML, but <strong>RN's accessibility model mirrors it</strong>: <code>accessibilityRole</code> ↔ <code>role</code>; <code>accessibilityLabel</code> ↔ <code>aria-label</code>; <code>accessibilityState</code> ↔ ARIA states.</li>
  <li>If your app has a <strong>marketing site / web fallback</strong>, HTML quality there matters as much as in the app itself.</li>
  <li>Smart App Banners (<code>apple-itunes-app</code> meta) and Android app links (<code>&lt;link rel="alternate"&gt;</code>) bridge web visitors to your app.</li>
  <li>Web app manifests + theme-color + apple-touch-icon make web pages "feel like apps" when added to home screen.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"Why does <code>&lt;script&gt;</code> in <code>&lt;head&gt;</code> default to blocking?"</em> — Historically, scripts can <code>document.write()</code>, which inserts content during parsing. The browser must pause parse to handle that. <code>defer</code> / <code>async</code> opt out by promising the script doesn't write.</li>
  <li><em>"What's the order of script execution?"</em> — Sync: in document order. Defer: parse-complete, in document order. Async: when download finishes, any order. Module: deferred by default, in document order.</li>
  <li><em>"How does <code>preload</code> interact with caching?"</em> — Preload caches the resource; subsequent fetch in the page picks it up. If the URL doesn't match exactly, the preload is wasted (Chrome warns).</li>
  <li><em>"What happens when the same id is on multiple elements?"</em> — Spec says ids should be unique; in practice, <code>document.getElementById</code> returns the first; ARIA references may resolve to either. Avoid duplicates.</li>
  <li><em>"What's the role of the <code>lang</code> attribute in form filling?"</em> — Browsers may pick locale-appropriate input formatting (e.g., date pickers, number formatting). Some autocomplete features depend on it.</li>
</ul>

<h3>"What I'd do day one on the team"</h3>
<ul>
  <li>Audit the homepage for: doctype, charset, viewport, lang, semantic structure, alt text, label coverage.</li>
  <li>Run Lighthouse a11y + SEO audits.</li>
  <li>Check script loading: any sync scripts in head? Switch to defer.</li>
  <li>Verify resource hints for critical assets.</li>
  <li>Ensure structured data covers article / product / breadcrumb where applicable.</li>
  <li>Add skip-to-content link if missing.</li>
  <li>Write a "HTML conventions" doc for the team.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd add a CI check that fails on missing alt attributes or unlabelled form inputs."</li>
  <li>"I'd run automated a11y testing on every PR (axe-core, pa11y)."</li>
  <li>"I'd add Speculation Rules for high-confidence next-page navigations."</li>
  <li>"I'd build a meta-tag template module so SEO meta is consistent across pages."</li>
  <li>"I'd add an 'HTML linter' to flag common mistakes (div+onClick, missing labels, wrong button types)."</li>
</ul>
`
    }
  ]
});
