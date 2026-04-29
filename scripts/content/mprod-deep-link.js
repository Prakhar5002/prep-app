window.PREP_SITE.registerTopic({
  id: 'mprod-deep-link',
  module: 'mobile-prod',
  title: 'Deep Linking',
  estimatedReadTime: '40 min',
  tags: ['deep-linking', 'universal-links', 'app-links', 'branch', 'firebase-dynamic-links', 'react-native', 'navigation', 'attribution'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Deep links</strong> turn URLs into in-app destinations. A user taps a link in an email or message; instead of opening Safari, your app opens directly to the right screen with the right context. Done well, this is the highest-leverage growth channel after push.</p>
<ul>
  <li><strong>Three flavors:</strong> <em>Custom URL schemes</em> (<code>myapp://product/123</code> — primitive, easily hijacked), <em>Universal Links</em> (iOS, https URLs verified via apple-app-site-association), <em>App Links</em> (Android, https URLs verified via assetlinks.json).</li>
  <li><strong>"Deferred deep links"</strong> survive the install: a user without the app taps a link → goes to App Store → installs → app opens to the original destination. Requires a routing service (Branch, Adjust, Firebase Dynamic Links).</li>
  <li><strong>The verification dance.</strong> iOS fetches <code>/.well-known/apple-app-site-association</code>; Android fetches <code>/.well-known/assetlinks.json</code>. Both must be served at the apex domain over HTTPS with correct content type.</li>
  <li><strong>Default tools:</strong> <strong>Branch</strong> (industry standard for attribution + deferred deep links), <strong>AppsFlyer</strong> + OneLink, <strong>Adjust</strong>, <strong>Firebase Dynamic Links</strong> (sunset Aug 2025 — migrate now).</li>
  <li><strong>Routing is your responsibility.</strong> The OS hands you a URL; you decode → navigate → restore state.</li>
  <li><strong>Edge cases everywhere:</strong> deferred install timing, attribution windows, web fallback when app not installed, "open in browser" preferences, iOS clipboard ATT, App Store Connect Universal Links banner.</li>
  <li><strong>Never trust the URL.</strong> Validate every parameter. URLs are user-controllable input — sanitize before navigating, and authenticate before granting access.</li>
</ul>
<p><strong>Mantra:</strong> "Universal Links over schemes; verify the domain; route in one place; handle deferred installs; treat URLs as untrusted input."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What is a deep link?</h3>
<p>A URL whose <em>handler</em> is your app rather than a browser. The user taps <code>https://myapp.com/products/abc123</code>; iOS / Android determine the registered app for that domain and hand the URL off; your app processes it and navigates to the product screen.</p>

<h3>The three flavors</h3>
<table>
  <thead><tr><th>Type</th><th>Format</th><th>Pros</th><th>Cons</th></tr></thead>
  <tbody>
    <tr><td>Custom URL scheme</td><td><code>myapp://product/123</code></td><td>Trivial setup; works without HTTPS</td><td>Any app can claim the same scheme; no fallback when not installed; deprecated for marketing</td></tr>
    <tr><td>Universal Links (iOS)</td><td><code>https://myapp.com/p/123</code></td><td>Works in browser if app missing; verified ownership; cannot be hijacked</td><td>Requires apple-app-site-association file; iOS sometimes ignores them ("long-tap → Open in Safari" hides the option)</td></tr>
    <tr><td>App Links (Android)</td><td><code>https://myapp.com/p/123</code></td><td>Same advantages</td><td>Requires assetlinks.json; user might still see "Open with…" disambiguation chooser</td></tr>
  </tbody>
</table>

<h3>Why mobile growth teams care</h3>
<table>
  <thead><tr><th>Use case</th><th>Why deep links matter</th></tr></thead>
  <tbody>
    <tr><td>Marketing campaigns</td><td>Email/SMS link → app opens to the promo, not the home screen</td></tr>
    <tr><td>Referrals</td><td>"Friend invited you to chat" → tap → app opens to the friend's chat after install</td></tr>
    <tr><td>Web → app handoff</td><td>User browsing on mobile web; tap "Open in app" → app opens at same product</td></tr>
    <tr><td>Push notifications</td><td>The push payload carries a URL; tap → app opens to the right screen</td></tr>
    <tr><td>Attribution</td><td>Each install attributable to the campaign that drove it</td></tr>
    <tr><td>OAuth / social login redirects</td><td>OAuth provider redirects to a deep link to return to your app with the auth code</td></tr>
    <tr><td>Magic link auth</td><td>Email a one-tap login URL that opens the app already authenticated</td></tr>
  </tbody>
</table>

<h3>Why "regular links" aren't enough</h3>
<p>If the user taps a normal web link, mobile Safari opens. They get your web experience. Maybe you have a "Smart Banner" prompting "Open in app." Most users ignore it. Conversion drops. Universal Links/App Links remove that step entirely — the OS knows your app handles this URL and goes straight there.</p>

<h3>Deferred deep links — the magic trick</h3>
<p>The hard problem: a user taps a link, your app isn't installed, they go to the App Store, they install, they launch... and the original context is lost. Deferred deep linking solves this:</p>
<ol>
  <li>User taps <code>https://myapp.com/p/123</code>.</li>
  <li>If app not installed, redirect to App Store with a <strong>routing service</strong> (Branch, etc.) that records the URL keyed by device fingerprint or IDFA.</li>
  <li>User installs and opens the app.</li>
  <li>App SDK calls the routing service → "what URL was supposed to bring this device here?"</li>
  <li>App receives the URL → routes to product 123.</li>
</ol>
<p>This is how referral links and ad campaigns drop users at the right screen post-install. Without it, post-install attribution and routing are crippled.</p>

<h3>What "good" looks like</h3>
<ul>
  <li>Universal Links + App Links configured with <strong>verified</strong> AASA / assetlinks.json files.</li>
  <li><strong>One routing function</strong> in the app handles all incoming URLs — no scattered handlers.</li>
  <li>Every URL is <strong>parsed, validated, navigated to</strong> in a single pipeline.</li>
  <li><strong>Web fallback</strong> exists for every deep link path — if the URL doesn't open the app, the web URL renders the same content.</li>
  <li><strong>Tracking parameters</strong> (<code>utm_source</code>, etc.) are extracted and stored as user properties on first launch.</li>
  <li><strong>Deferred deep linking</strong> is wired for marketing campaigns.</li>
  <li>Deep link routes are <strong>versioned</strong> — old marketing emails still work after a redesign.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The OS routing decision</h3>
<pre><code class="language-text">User taps a URL.
   ↓
Is it a custom scheme (myapp://...)?
   ↓ YES → Find app registered for "myapp"; if installed, hand off; else fail.
   ↓ NO  → Is it https://?
            ↓
         iOS: check Universal Links — does any installed app have this domain in its associated domains?
            ↓ YES → hand off to that app.
            ↓ NO  → open in Safari/browser.

         Android: check App Links — does any installed app have this domain verified?
            ↓ YES (verified, autoVerify=true) → hand off directly.
            ↓ YES (not verified) → show disambiguation chooser ("Open with…")
            ↓ NO  → open in browser.
</code></pre>

<h3>The verification files</h3>
<table>
  <thead><tr><th>iOS</th><th>Android</th></tr></thead>
  <tbody>
    <tr><td><code>https://myapp.com/.well-known/apple-app-site-association</code></td><td><code>https://myapp.com/.well-known/assetlinks.json</code></td></tr>
    <tr><td>Content-Type: application/json (no .json extension!)</td><td>Content-Type: application/json</td></tr>
    <tr><td>Lists app IDs, paths handled, paths excluded</td><td>Lists package name + signing fingerprint(s) + autoVerify</td></tr>
    <tr><td>Apple's CDN caches it; you may wait 24h after change</td><td>Google's installer fetches on every install</td></tr>
  </tbody>
</table>

<h3>The "deep link payload" model</h3>
<pre><code class="language-text">URL  → parse → route descriptor → navigation action

https://myapp.com/conversation/c_42?msg=m_99
       ↓
parsed: { kind: "conversation", id: "c_42", focusMessage: "m_99" }
       ↓
navigation:
  - if logged in: navigate("ChatStack", { screen: "Conversation", params: { id, focusMessage } })
  - if logged out: store pending; navigate("Login"); replay after auth
</code></pre>

<h3>State machine for incoming links</h3>
<pre><code class="language-text">                    ┌─────────────────┐
URL received  ──→   │  parse()        │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │  validate()     │  reject malformed/unknown routes
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │  authorize()    │  is user logged in? does this need auth?
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │  navigate()     │  one place; resolves params; restores state
                    └─────────────────┘
</code></pre>

<h3>Cold start vs warm start</h3>
<table>
  <thead><tr><th>Scenario</th><th>RN handler</th></tr></thead>
  <tbody>
    <tr><td>App not running, link taps launches it</td><td><code>Linking.getInitialURL()</code></td></tr>
    <tr><td>App in background, link taps brings to foreground</td><td><code>Linking.addEventListener('url', ...)</code></td></tr>
  </tbody>
</table>
<p>You must wire <strong>both</strong>. A common bug: cold-start works but background-launch doesn't because the listener isn't registered.</p>

<h3>Branch / dynamic-link service mental model</h3>
<pre><code class="language-text">Marketing creates a Branch link: https://yourapp.app.link/abc
   ↓
Branch's domain serves a redirect script.
   ↓
If user has app: Branch redirects to https://myapp.com/p/123 (Universal Link)
If no app: Branch redirects to App Store with a "remember this URL for this device fingerprint."
   ↓
After install, app launches.
   ↓
Branch SDK queries Branch service: "any pending URL for this device?"
   ↓
Service returns the original URL parameters.
   ↓
App routes to /p/123.
</code></pre>

<h3>The ATT clipboard surprise</h3>
<p>iOS 16+ shows "App pasted from clipboard" toasts whenever you read the pasteboard. Some attribution SDKs (Branch, AppsFlyer) historically read the clipboard for cross-app attribution. iOS 14.5+ banned that without ATT consent. Modern SDKs default to off; verify your version.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>iOS Universal Links — the full setup</h3>
<p><strong>1. Add associated domain to Xcode</strong></p>
<pre><code class="language-text">Target → Signing &amp; Capabilities → Add Capability → Associated Domains
Add entry:  applinks:myapp.com
            applinks:*.myapp.com   (for subdomains)
</code></pre>

<p><strong>2. Host the AASA file</strong></p>
<pre><code class="language-json">// served at https://myapp.com/.well-known/apple-app-site-association
// content-type: application/json (NO .json extension)
{
  "applinks": {
    "details": [{
      "appIDs": ["TEAMID.com.myapp.bundle"],
      "components": [
        { "/": "/p/*", "comment": "product pages" },
        { "/": "/c/*", "comment": "conversations" },
        { "/": "/login/magic", "comment": "magic links" },
        { "/": "/admin/*", "exclude": true }
      ]
    }]
  }
}
</code></pre>

<p><strong>3. Verify</strong></p>
<pre><code class="language-bash">curl -I https://myapp.com/.well-known/apple-app-site-association
# Must return 200, application/json, no redirect.

# Apple's validator
https://search.developer.apple.com/appsearch-validation-tool/
</code></pre>

<h3>Android App Links — the full setup</h3>
<p><strong>1. Declare intent filter</strong></p>
<pre><code class="language-xml">&lt;!-- AndroidManifest.xml --&gt;
&lt;activity android:name=".MainActivity"
    android:launchMode="singleTask"&gt;
  &lt;intent-filter android:autoVerify="true"&gt;
    &lt;action android:name="android.intent.action.VIEW" /&gt;
    &lt;category android:name="android.intent.category.DEFAULT" /&gt;
    &lt;category android:name="android.intent.category.BROWSABLE" /&gt;
    &lt;data android:scheme="https" android:host="myapp.com" /&gt;
  &lt;/intent-filter&gt;
&lt;/activity&gt;
</code></pre>

<p><strong>2. Host assetlinks.json</strong></p>
<pre><code class="language-json">// served at https://myapp.com/.well-known/assetlinks.json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.myapp",
    "sha256_cert_fingerprints": [
      "AA:BB:CC:DD:EE:..."   // your release keystore SHA-256
    ]
  }
}]
</code></pre>

<p><strong>3. Verify</strong></p>
<pre><code class="language-bash"># From the device
adb shell pm get-app-links com.myapp
# Should show: 'verified' for myapp.com

# Google's validator
https://developers.google.com/digital-asset-links/tools/generator
</code></pre>

<h3>RN routing pipeline</h3>
<pre><code class="language-tsx">// linking.ts
import { Linking } from 'react-native';
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

export function useDeepLinks() {
  const nav = useNavigation();

  useEffect(() =&gt; {
    // Cold start
    Linking.getInitialURL().then((url) =&gt; { if (url) handle(url); });

    // Warm start
    const sub = Linking.addEventListener('url', ({ url }) =&gt; handle(url));
    return () =&gt; sub.remove();
  }, []);

  function handle(url: string) {
    const parsed = parse(url);
    if (!parsed) return;

    // Authentication gate
    if (parsed.requiresAuth &amp;&amp; !isLoggedIn()) {
      pendingDeepLink.set(parsed);
      nav.navigate('Login' as never);
      return;
    }

    navigate(parsed);
  }
}

function parse(url: string): RouteDescriptor | null {
  try {
    const u = new URL(url);
    if (u.hostname !== 'myapp.com' &amp;&amp; u.hostname !== 'www.myapp.com') return null;

    const segments = u.pathname.split('/').filter(Boolean);
    const [first, second] = segments;

    if (first === 'p' &amp;&amp; second) return { kind: 'product', id: second };
    if (first === 'c' &amp;&amp; second) return { kind: 'conversation', id: second, requiresAuth: true };
    if (first === 'login' &amp;&amp; second === 'magic') return { kind: 'magicLogin', token: u.searchParams.get('token') ?? '' };
    return null;
  } catch {
    return null;
  }
}

function navigate(r: RouteDescriptor) {
  switch (r.kind) {
    case 'product':
      nav.navigate('ProductStack' as never, { screen: 'Product', params: { id: r.id } } as never);
      return;
    case 'conversation':
      nav.navigate('ChatStack' as never, { screen: 'Conversation', params: { id: r.id } } as never);
      return;
    case 'magicLogin':
      api.exchangeMagicToken(r.token);
      return;
  }
}
</code></pre>

<h3>React Navigation's <code>linking</code> prop (concise alternative)</h3>
<pre><code class="language-tsx">const linking = {
  prefixes: ['https://myapp.com', 'myapp://'],
  config: {
    screens: {
      ProductStack: {
        screens: { Product: 'p/:id' },
      },
      ChatStack: {
        screens: { Conversation: 'c/:id' },
      },
      MagicLogin: 'login/magic',
    },
  },
};

&lt;NavigationContainer linking={linking}&gt;...&lt;/NavigationContainer&gt;
</code></pre>
<p>Trades flexibility for compactness. Good for static URL → screen mappings; less suited when you have auth gates, query-param handling, or analytics on every link.</p>

<h3>Branch — the de facto deferred deep linking</h3>
<pre><code class="language-bash">yarn add react-native-branch
cd ios &amp;&amp; pod install
</code></pre>

<pre><code class="language-tsx">import branch from 'react-native-branch';

useEffect(() =&gt; {
  branch.subscribe(({ params, error }) =&gt; {
    if (error) return;
    if (params['+clicked_branch_link']) {
      // Branch link detected
      const path = params['$canonical_url'] ?? params['$desktop_url'];
      const customParams = {
        sku: params['sku'],
        campaignId: params['~campaign'],
      };
      handle(path, customParams);
    }
  });
}, []);

// Generate a Branch link from inside the app (for sharing)
const buo = await branch.createBranchUniversalObject('product/' + sku, {
  title: product.title,
  contentDescription: product.description,
  contentImageUrl: product.image,
});
const linkProperties = {
  feature: 'sharing',
  channel: 'app',
  campaign: 'organic_share',
};
const { url } = await buo.generateShortUrl(linkProperties, {});
Share.share({ url });
</code></pre>

<h3>Magic link login</h3>
<pre><code class="language-tsx">// User receives email with link: https://myapp.com/login/magic?token=abc...
// User taps; app opens.
function handleMagicLogin(token: string) {
  if (!token) return showError('Invalid login link.');
  api.exchangeMagicToken(token).then((session) =&gt; {
    storeSession(session);
    nav.navigate('Home');
  });
}
</code></pre>

<h3>OAuth callback handler</h3>
<pre><code class="language-tsx">// OAuth provider redirects to: myapp://oauth/callback?code=xyz
function handleOAuthCallback(url: string) {
  const u = new URL(url);
  const code = u.searchParams.get('code');
  if (!code) return showError('Invalid OAuth response.');
  api.exchangeCode(code).then((session) =&gt; {
    storeSession(session);
    nav.navigate('Home');
  });
}

// Tip: OAuth providers like Google now require https custom schemes (Universal Links) for production
</code></pre>

<h3>UTM parameter capture</h3>
<pre><code class="language-tsx">// On first launch, persist UTM from the deferred link as user properties
useEffect(() =&gt; {
  branch.subscribe(({ params }) =&gt; {
    if (params['+is_first_session']) {
      const attribution = {
        source: params['~feature'] ?? params['utm_source'],
        medium: params['utm_medium'],
        campaign: params['~campaign'] ?? params['utm_campaign'],
        referrer: params['~referring_link'],
      };
      storage.set('attribution', attribution);
      analytics.identify({ ...attribution });
    }
  });
}, []);
</code></pre>

<h3>Web fallback</h3>
<p>Every deep link URL must work on the open web (the marketing emails go there too). The web pages render the same content. The smart-app-banner (iOS Safari) and a "Get the app" button on the web help convert mobile-web users to app users.</p>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: A complete shareable link flow</h3>
<pre><code class="language-tsx">// 1. User taps "Share" on a product
async function shareProduct(product: Product) {
  const buo = await branch.createBranchUniversalObject(\`product/\${product.id}\`, {
    title: product.title,
    contentDescription: product.description,
    contentImageUrl: product.thumbnail,
  });
  const { url } = await buo.generateShortUrl(
    { feature: 'share', channel: 'whatsapp' },
    { '$desktop_url': \`https://myapp.com/p/\${product.id}\` },
  );
  await Share.share({ message: \`Check this: \${url}\`, url });
  logEvent('share_initiated', { product_id: product.id, channel: 'whatsapp' });
}

// 2. Recipient (without the app) taps the link.
//    Branch redirects to App Store with deferred attribution.
//    Recipient installs and opens.
//    Branch SDK fires 'open' with the original product id.
//    App routes to product page.
//    Attribution analytics record this as a referral install.
</code></pre>

<h3>Example 2: Cold-start vs background-start</h3>
<pre><code class="language-tsx">function App() {
  useEffect(() =&gt; {
    let active = true;

    // Cold start
    Linking.getInitialURL().then((url) =&gt; {
      if (!active) return;
      if (url) {
        // Wait for navigation to be ready
        InteractionManager.runAfterInteractions(() =&gt; handleUrl(url));
      }
    });

    // Background → foreground
    const sub = Linking.addEventListener('url', ({ url }) =&gt; handleUrl(url));
    return () =&gt; { active = false; sub.remove(); };
  }, []);

  return &lt;NavigationContainer&gt;...&lt;/NavigationContainer&gt;;
}
</code></pre>

<h3>Example 3: Auth-gated routing</h3>
<pre><code class="language-tsx">async function handleUrl(url: string) {
  const parsed = parse(url);
  if (!parsed) return;

  if (parsed.requiresAuth &amp;&amp; !(await isLoggedIn())) {
    await pendingDeepLink.save(parsed);
    nav.reset({ index: 0, routes: [{ name: 'Login' }] });
    return;
  }

  navigate(parsed);
}

// On login success, replay
async function onLoginSuccess() {
  const pending = await pendingDeepLink.consume();
  if (pending) navigate(pending);
  else nav.replace('Home');
}
</code></pre>

<h3>Example 4: Validating parameters</h3>
<pre><code class="language-ts">// Never trust URL parameters
function parseProductLink(u: URL): { kind: 'product', id: string } | null {
  const id = u.pathname.split('/').filter(Boolean)[1];
  if (!id) return null;
  if (!/^[a-z0-9_-]{1,50}$/i.test(id)) return null;   // simple allowlist
  return { kind: 'product', id };
}
</code></pre>

<h3>Example 5: Deferred deep link from an ad</h3>
<pre><code class="language-text">Marketing creates a Facebook ad with link https://myapp.app.link/promo-spring.
Branch link parameters: { utm_source: 'fb', utm_campaign: 'spring2026', $deeplink_path: 'promotions/spring' }

User clicks the ad → not installed → App Store → install → open.
Branch SDK fires open event with the parameters.
App routes to /promotions/spring.
Analytics SDK identifies the user with utm_source=fb, utm_campaign=spring2026.
PM later queries: "what % of fb-spring2026 cohort converted to paid?"
</code></pre>

<h3>Example 6: Magic link auth</h3>
<pre><code class="language-text">User on web requests a login email.
Server emails: https://myapp.com/login/magic?token=ENC_TOKEN

User on phone taps link.
- App not installed: web fallback shows "Open in app" → routes to App Store.
- App installed: Universal Link triggers app open with the token.

App handler:
  - validates token format (length, charset).
  - calls /api/auth/magic-exchange (single-use, server invalidates after first use).
  - on success: stores session, navigates Home.
  - on failure: shows "Link expired or invalid; request a new one."
</code></pre>

<h3>Example 7: Internal links</h3>
<pre><code class="language-tsx">// Inside the app, you may want to navigate via the same URL system
// (e.g., a marketing banner with a deeplink URL handed down by Remote Config).
function InternalDeepLink({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    &lt;Pressable onPress={() =&gt; handleUrl(url)}&gt;{children}&lt;/Pressable&gt;
  );
}

// Server can drop a CTA link configured remotely without an app update
</code></pre>

<h3>Example 8: Old-version compatibility</h3>
<pre><code class="language-ts">// In v1, route was https://myapp.com/product?id=123
// In v2, route is https://myapp.com/p/123
function parse(url: string) {
  const u = new URL(url);

  if (u.pathname === '/product' &amp;&amp; u.searchParams.get('id')) {
    return { kind: 'product', id: u.searchParams.get('id')! };
  }
  if (u.pathname.startsWith('/p/')) {
    const id = u.pathname.split('/')[2];
    return id ? { kind: 'product', id } : null;
  }

  // Server-side redirect old paths to new format for the web; the app handles both.
}
</code></pre>

<h3>Example 9: Tracking conversion from a link</h3>
<pre><code class="language-tsx">function navigate(r: RouteDescriptor) {
  logEvent('deep_link_resolved', {
    kind: r.kind,
    campaign_id: r.campaignId,
    referrer: r.referrer,
  });
  // route ...
}

// Funnel: clicked → resolved → action
//   clicked is logged on the link host (Branch dashboard)
//   resolved is logged in your app via deep_link_resolved
//   action = primary metric (purchase, signup, etc.)
</code></pre>

<h3>Example 10: Smart-banner fallback on mobile web</h3>
<pre><code class="language-html">&lt;!-- index.html on the web (mobile only) --&gt;
&lt;meta name="apple-itunes-app" content="app-id=123456789, app-argument=https://myapp.com/p/abc" /&gt;
</code></pre>
<p>Safari on iOS shows a "Get / Open" banner; tapping Open uses your Universal Link. <code>app-argument</code> ensures the app opens at the right page.</p>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>AASA file caching</h3>
<p>iOS aggressively caches the apple-app-site-association file via Apple's CDN. Updates can take ~24h to propagate. After updating:</p>
<ul>
  <li>Force re-fetch by uninstalling + reinstalling the app on device.</li>
  <li>Use Apple's <a href="https://search.developer.apple.com/appsearch-validation-tool/" target="_blank">App Search Validator</a>.</li>
  <li>Deploy the AASA file with no-cache headers.</li>
</ul>

<h3>"Long-tap → Open in app" hidden in some contexts</h3>
<p>On iOS, when a user taps a Universal Link from inside Safari (URL bar), it stays in Safari. Universal Links work from <em>outside</em> Safari (Mail, Notes, Messages, other apps). To "Open in app" from Safari, the user must long-press and pick "Open in MyApp." Don't expect Universal Links to round-trip within Safari.</p>

<h3>Android disambiguation chooser</h3>
<p>If <code>autoVerify="true"</code> fails (assetlinks.json missing or wrong fingerprint), Android falls back to the chooser dialog ("Open with…"). Worst-case: user picks Chrome and never sees your app again. Test verification on every release.</p>

<h3>Custom schemes can be hijacked</h3>
<p>Two apps can register the same custom scheme. The OS picks "first installed." A malicious app could intercept your auth callbacks. Universal Links + App Links are immune because they verify domain ownership.</p>

<h3>Cold start before nav is ready</h3>
<pre><code class="language-tsx">// BAD — handleUrl fires before NavigationContainer mounted, throws
useEffect(() =&gt; {
  Linking.getInitialURL().then((url) =&gt; url &amp;&amp; handleUrl(url));
}, []);

// GOOD — wait for nav ready
const navReady = useRef(false);
&lt;NavigationContainer onReady={() =&gt; { navReady.current = true; flushPending(); }}&gt;
</code></pre>

<h3>iOS clipboard ATT toast</h3>
<p>iOS 14.5+ shows a "App pasted from clipboard" toast every time you read clipboard. Old Branch SDK versions did this on every cold start. Update SDKs; verify behavior; users perceive clipboard reads as creepy.</p>

<h3>Universal Link doesn't open if app is foregrounded but on a different screen</h3>
<p>On iOS, if the app is in foreground and a notification with a Universal Link arrives, the link might not trigger the listener (depends on iOS version). Always also handle the URL via <code>onNotificationOpenedApp</code>.</p>

<h3>Domain switch breaks links</h3>
<p>You renamed myapp.com to my-newapp.com. Old links break. Either:</p>
<ul>
  <li>Add the new domain to associated domains; serve AASA on both.</li>
  <li>Server-side redirect old URLs to new (works for web; Universal Links must be from associated domains).</li>
</ul>

<h3>Deferred install attribution window</h3>
<p>Branch (and similar) hold the URL for ~24h keyed by device fingerprint. After that, attribution is lost. Most installs happen within hours; long tail beyond a day is gone.</p>

<h3>Firebase Dynamic Links sunset</h3>
<p>Google announced Firebase Dynamic Links shuts down August 25, 2025. If you're on FDL, migrate to Branch / AppsFlyer / Adjust. New apps shouldn't start with FDL.</p>

<h3>Encoded URLs / double-encoding</h3>
<pre><code class="language-text">https://myapp.com/p/123?ref=abc%26source%3Dfb
                                ↑ %26 means &amp; — should query be &amp;source=fb or part of ref?

URL libraries handle this; manual parsing breaks. Always use URL constructor.
</code></pre>

<h3>Non-ASCII paths</h3>
<p>Russian, Japanese, Arabic in path or query. URL must be percent-encoded; some routers split on '/' before decoding. Test with localized links.</p>

<h3>Multiple-app conflicts on same domain</h3>
<p>You publish two iOS apps that both claim <code>applinks:myapp.com</code>. AASA can list multiple appIDs. The OS routes based on which app is installed; if both, behavior is OS-defined. Avoid the situation by separating subdomains.</p>

<h3>iOS Universal Links don't work in some apps</h3>
<p>Apps with their own webviews (e.g., Instagram, Twitter) often open links in the in-app browser instead of triggering the OS-level Universal Link routing. There's no fix from your side.</p>

<h3>Stale routes after update</h3>
<p>You shipped 2.0 with new URL paths. Users on 1.x receive an old marketing email — link doesn't open in the old app. Maintain backwards-compatible URL parsers as long as you support old versions.</p>

<h3>Session restore vs link routing</h3>
<p>You restore the user's last screen on launch (state persistence). User taps a deep link that should override. Make sure the deep link handler runs after state restore but takes precedence over the restored route.</p>

<h3>iOS App Store Connect "Your App Has Universal Links" banner</h3>
<p>Apple shows this banner once you upload an app with Associated Domains. Users see "Open in App" suggestions on Safari for verified domains. Validate the AASA file is actually being served correctly post-release; the banner appears either way.</p>

<h3>Test on cold install, not just from Xcode</h3>
<p>Universal Links don't always trigger when the app was launched from Xcode (debugging mode bypasses the OS handoff). Test from a fresh install (TestFlight, ad hoc).</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: AASA served with wrong content-type</h3>
<pre><code class="language-text">Content-Type: text/plain   ❌  iOS rejects, Universal Links silently fail
Content-Type: application/json   ✅
</code></pre>

<h3>Bug 2: AASA served at wrong path</h3>
<pre><code class="language-text">/.well-known/apple-app-site-association   ✅
/.well-known/apple-app-site-association.json   ❌
/apple-app-site-association   ⚠ pre-iOS 9; deprecated
</code></pre>
<p>Place at the apex domain root. No file extension.</p>

<h3>Bug 3: assetlinks.json with wrong SHA-256</h3>
<p>You used the debug keystore's fingerprint. Production builds fail App Links verification. Always include the release keystore SHA-256, ideally both debug and release for testing.</p>

<h3>Bug 4: Custom scheme leaking auth tokens</h3>
<pre><code class="language-text">myapp://oauth/callback?token=secret
↑ Other apps registered for "myapp" intercept this token.

→ Use Universal Links / App Links for auth flows. Better still: PKCE.
</code></pre>

<h3>Bug 5: Listener registered before navigation is ready</h3>
<pre><code class="language-tsx">// Linking event fires; nav.navigate() throws because container hasn't mounted
function App() {
  useEffect(() =&gt; {
    Linking.addEventListener('url', ({ url }) =&gt; handleUrl(url));   // may run too early
  }, []);
}

// FIX — gate on navigation ready or use react-navigation's linking prop
</code></pre>

<h3>Bug 6: Two listeners → double-navigate</h3>
<p>You added <code>Linking.addEventListener</code> in two places (App and a child). Both fire; the user is navigated twice. Symptom: a flash of the wrong screen. <strong>Have one listener at the top.</strong></p>

<h3>Bug 7: Forgot to remove listener on unmount</h3>
<pre><code class="language-tsx">useEffect(() =&gt; {
  Linking.addEventListener('url', handle);
  // forgot return
}, []);
// In hot-reload, listener accumulates; in fast-refresh dev, links handled multiple times.
</code></pre>

<h3>Bug 8: Trusting the URL</h3>
<pre><code class="language-tsx">// BAD — uses the path verbatim as a SQL query / file path
nav.navigate(u.searchParams.get('next') ?? 'Home');

// GOOD — allowlist
const NEXT_ROUTES = new Set(['Home', 'Profile', 'Settings']);
const next = u.searchParams.get('next') ?? 'Home';
nav.navigate(NEXT_ROUTES.has(next) ? next : 'Home');
</code></pre>

<h3>Bug 9: Open redirect</h3>
<pre><code class="language-text">https://myapp.com/redirect?to=https://malicious.example.com

If your app blindly navigates to URLs from query parameters, you've created a phishing surface.

→ Never trust 'to' / 'next' / 'redirect' from untrusted input.
</code></pre>

<h3>Bug 10: Magic-link reuse</h3>
<pre><code class="language-text">User taps the magic link, gets logged in.
User shares it with a friend.
Friend clicks it, gets logged in too.

FIX — single-use tokens; server invalidates on first exchange.
      Short TTL (e.g., 10 minutes).
      Bind to device fingerprint (optional).
</code></pre>

<h3>Anti-pattern 1: scattering link handling</h3>
<p>One handler in App.tsx for cold start, one in a Hook for warm start, one in NotificationCenter. They diverge. Always centralize routing.</p>

<h3>Anti-pattern 2: relying on the chooser dialog (Android)</h3>
<p>If your assetlinks.json doesn't verify, Android shows the "Open with…" dialog every time. Users click Chrome by mistake; deep linking effectively breaks. Verify assetlinks; don't accept the chooser.</p>

<h3>Anti-pattern 3: building a parallel router</h3>
<p>You write a custom URL parser, route map, and navigation handler. React Navigation already provides one. Use <code>linking</code> prop unless you have specific needs (auth gates, complex param handling).</p>

<h3>Anti-pattern 4: ignoring web fallback</h3>
<p>Marketing email's link opens app for users with the app. For users without it, the link should open a web page rendering the same content (and a "Get the app" CTA). Without web fallback, you train users to ignore your links.</p>

<h3>Anti-pattern 5: unversioned URL paths</h3>
<p>You ship 2.0 with <code>/p/123</code>; old emails have <code>/product/123</code>. Old emails break. Keep parsers backwards compatible; document deprecations.</p>

<h3>Anti-pattern 6: heavy work on cold-start handler</h3>
<pre><code class="language-tsx">// BAD — hits server before app is rendered
async function handleUrl(url: string) {
  const data = await api.fetchProduct(id);   // long fetch
  nav.navigate('Product', { product: data });
}

// GOOD — navigate fast, fetch in screen
nav.navigate('Product', { id });
</code></pre>

<h3>Anti-pattern 7: forgetting to handle "/" or unknown routes</h3>
<p>User taps a malformed link (truncated email). Your app opens to a blank screen because no route matches. Have a fallback route (Home) for unparseable URLs.</p>

<h3>Anti-pattern 8: not testing on physical device</h3>
<p>Universal Links and App Links behave differently in simulator/emulator vs physical device. Always validate on device before shipping.</p>

<h3>Anti-pattern 9: long URLs</h3>
<p>Branch / Firebase Dynamic Links produce long URLs with embedded metadata. SMS messages truncate them; users distrust them. Use short branded domains (<code>myapp.app.link</code>) and alias.</p>

<h3>Anti-pattern 10: silent failure</h3>
<pre><code class="language-tsx">function handleUrl(url: string) {
  const parsed = parse(url);
  if (!parsed) return;   // user wonders why nothing happened
}
// Telemetry the failure; consider surfacing a toast for genuinely malformed links.
</code></pre>
`
    },
    {
      id: 'interview-patterns',
      title: '🎤 Interview Patterns',
      html: `
<h3>The 12 questions worth rehearsing</h3>
<table>
  <thead><tr><th>Question</th><th>One-liner</th></tr></thead>
  <tbody>
    <tr><td><em>What's a Universal Link?</em></td><td>iOS https URL that opens your app instead of Safari, verified via AASA file.</td></tr>
    <tr><td><em>What's an App Link?</em></td><td>Android equivalent; verified via assetlinks.json with autoVerify.</td></tr>
    <tr><td><em>Why not custom URL schemes?</em></td><td>Hijackable; no fallback when app missing; deprecated for marketing.</td></tr>
    <tr><td><em>What's deferred deep linking?</em></td><td>Survives the install: tap link → install → app opens to original destination.</td></tr>
    <tr><td><em>How does Branch work?</em></td><td>Routing service: redirects to App Store with a stash, app SDK queries it after install.</td></tr>
    <tr><td><em>Where do you handle URLs in RN?</em></td><td><code>Linking.getInitialURL</code> for cold start; <code>Linking.addEventListener</code> for warm start; or react-navigation's <code>linking</code> prop.</td></tr>
    <tr><td><em>How do you validate URLs?</em></td><td>Whitelist hosts; allowlist routes; sanitize parameters; never trust the URL directly.</td></tr>
    <tr><td><em>How do you handle auth-gated links?</em></td><td>Park the URL in a "pending" slot; navigate to Login; replay after auth.</td></tr>
    <tr><td><em>What's the AASA file?</em></td><td>JSON at <code>/.well-known/apple-app-site-association</code> declaring app IDs and paths.</td></tr>
    <tr><td><em>What's assetlinks.json?</em></td><td>JSON at <code>/.well-known/assetlinks.json</code> declaring package + signing fingerprint.</td></tr>
    <tr><td><em>How do you avoid open-redirect bugs?</em></td><td>Allowlist target routes; never blindly navigate to query-parameter URLs.</td></tr>
    <tr><td><em>What replaces Firebase Dynamic Links?</em></td><td>Branch, AppsFlyer, Adjust. FDL sunsets August 2025.</td></tr>
  </tbody>
</table>

<h3>Live design prompts</h3>
<ol>
  <li><em>"Design the deep-linking system for a marketplace app."</em>
    <ul>
      <li>Universal Links + App Links on <code>marketplace.com</code>.</li>
      <li>Routes: <code>/p/:id</code> (product), <code>/c/:slug</code> (category), <code>/seller/:handle</code>, <code>/order/:id</code> (auth-gated).</li>
      <li>Single routing function; auth gate; pending-link replay.</li>
      <li>Branch for ad/referral links with deferred routing.</li>
      <li>Web fallback for every path.</li>
      <li>Smart App Banner for mobile-Safari traffic.</li>
      <li>Telemetry: <code>deep_link_resolved</code> on every successful nav.</li>
    </ul>
  </li>
  <li><em>"Design a referral system."</em>
    <ul>
      <li>User generates Branch link with embedded referrer_id.</li>
      <li>Recipient taps; if no app, App Store; if app, opens to "claim referral" screen.</li>
      <li>Server-side: validate referrer_id, credit both users on first purchase.</li>
      <li>Deferred attribution: post-install, app SDK reports the original click; backend matches.</li>
      <li>Idempotent crediting (one referral per recipient).</li>
    </ul>
  </li>
  <li><em>"Walk me through how a magic-link login works on iOS."</em>
    <ul>
      <li>User on web: requests login; backend emails <code>https://myapp.com/login/magic?token=...</code>.</li>
      <li>User taps email link on phone with app installed.</li>
      <li>iOS routes to app via Universal Link.</li>
      <li>App's URL handler parses path → "magic login" route.</li>
      <li>App calls <code>/auth/magic-exchange</code> with token; receives session.</li>
      <li>If app not installed: web fallback shows "Open in app" with App Store link.</li>
      <li>Token: single-use, short TTL, server invalidates after first use.</li>
    </ul>
  </li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>AASA file served as <code>application/octet-stream</code> — iOS rejects it silently.</li>
  <li>Listener installed in App.tsx fires before NavigationContainer mounts — race condition.</li>
  <li>Custom scheme used for OAuth callback — token leakable to malicious apps.</li>
  <li>"Open with…" Android chooser appears every time — assetlinks.json or autoVerify broken.</li>
  <li>Magic link works once for the original tap, then breaks if reused — actually correct, but error message must explain.</li>
  <li>App opens but doesn't navigate — handler installed but never wired up to navigation.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Universal Links over schemes</td><td>You volunteer this without prompting.</td></tr>
    <tr><td>Verification fluency</td><td>You know the AASA / assetlinks.json paths and content-types.</td></tr>
    <tr><td>Single-routing-function discipline</td><td>You centralize deep link handling, not scatter it.</td></tr>
    <tr><td>Auth-gate handling</td><td>You handle "deep link before login" via pending-link replay.</td></tr>
    <tr><td>Security posture</td><td>You allowlist routes; you reject open redirects.</td></tr>
    <tr><td>Deferred linking awareness</td><td>You name Branch/AppsFlyer; you understand attribution windows.</td></tr>
    <tr><td>Web fallback</td><td>You always pair deep links with web pages serving the same content.</td></tr>
  </tbody>
</table>

<h3>Mobile-specific deep questions</h3>
<ul>
  <li><em>"Why is universal link routing not always reliable?"</em> — In-app browsers (Instagram, Twitter), Safari URL bar taps, AASA cache delays, OS bugs. Build redundancy: Smart App Banner + smart fallback.</li>
  <li><em>"How would you debug a Universal Link that won't open the app?"</em> — Validate AASA URL; check content-type; verify app's associated domains; uninstall + reinstall (forces re-fetch); check Console.app for swcd logs on iOS.</li>
  <li><em>"What's the difference between <code>applinks:</code> and <code>activitycontinuation:</code>?"</em> — applinks for Universal Links; activitycontinuation for Handoff between Apple devices. Both go in the same Associated Domains entitlement.</li>
  <li><em>"Why does Android's chooser appear despite autoVerify?"</em> — autoVerify failed: assetlinks.json missing, wrong fingerprint, redirect chain, or non-200 response. Run <code>adb shell pm get-app-links</code>.</li>
  <li><em>"What's the timeline of FDL sunset?"</em> — Google announced August 25, 2025 for full shutdown. Services like Branch and AppsFlyer have migration tooling.</li>
  <li><em>"What's a 'short link' and why do they matter?"</em> — Branch / Bitly-style branded short URLs; better in SMS, easier to remember, can hide attribution params from the user. Implement via your own redirect domain or Branch's.</li>
</ul>

<h3>"What I'd do day one on the team"</h3>
<ul>
  <li>Audit Universal Links and App Links — verify AASA / assetlinks.json on the apex domain.</li>
  <li>Trace one production deep link end-to-end: who handles it, where the parser lives, what routes match.</li>
  <li>Check for scattered <code>Linking.addEventListener</code> calls; consolidate to one place.</li>
  <li>Add telemetry: <code>deep_link_received</code>, <code>deep_link_failed</code>, <code>deep_link_resolved</code>.</li>
  <li>Verify each marketing campaign's deferred-link flow on a fresh install.</li>
  <li>Sunset Firebase Dynamic Links if used; pick a successor and plan migration.</li>
  <li>Document URL schema in a wiki page; treat it as part of the public API.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd add a CI test that hits the AASA + assetlinks endpoints and validates content type and structure."</li>
  <li>"I'd build a 'link preview' admin tool — paste a URL, see how it routes in our app."</li>
  <li>"I'd add server-side preview metadata (Open Graph, Twitter cards) for every deep link path so shared links render rich previews."</li>
  <li>"I'd add a smart 'open in app' banner on the web with a 90-day cookie so we don't pester returning users."</li>
  <li>"I'd add structured deep-link analytics: source channel, campaign, conversion rate per route."</li>
</ul>
`
    }
  ]
});
