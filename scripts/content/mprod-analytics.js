window.PREP_SITE.registerTopic({
  id: 'mprod-analytics',
  module: 'mobile-prod',
  title: 'Analytics',
  estimatedReadTime: '40 min',
  tags: ['analytics', 'tracking', 'ga4', 'amplitude', 'mixpanel', 'event-taxonomy', 'funnels', 'retention', 'privacy', 'react-native'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Analytics</strong> is how product, growth, marketing, and engineering see how a mobile app is actually used. The job: capture user behavior as a stream of <em>events</em> with structured properties, attribute those events to a user (or anonymous device), and aggregate them into funnels, retention, segmentation, and revenue dashboards.</p>
<ul>
  <li><strong>Three pieces:</strong> SDK in the app fires events → ingestion service buffers → warehouse (Snowflake/BigQuery/Redshift) or product-analytics tool (Amplitude/Mixpanel/PostHog) materializes funnels &amp; cohorts.</li>
  <li><strong>Event = name + properties.</strong> "<code>purchase_completed</code>" with <code>{ amount, currency, sku }</code>. Names are nouns/verbs; properties are stable keys with stable types.</li>
  <li><strong>Two identity tracks:</strong> anonymous device id (pre-login) → user id (post-login). Always alias the two so funnels survive sign-up.</li>
  <li><strong>Default tools:</strong> <strong>Amplitude</strong> (best for product analytics, free up to 10M events/mo), <strong>Mixpanel</strong> (similar; strong cohort UX), <strong>Firebase GA4</strong> (free, deep Google Ads integration), <strong>PostHog</strong> (open source, self-host option), <strong>Segment</strong> (router that fans events to multiple tools).</li>
  <li><strong>Event taxonomy is the hard part.</strong> A messy schema renders the data useless. A tracking plan + governance review per release is non-negotiable.</li>
  <li><strong>Privacy:</strong> ATT on iOS, consent banners in EU, opt-out toggles, PII scrubbing on the way out.</li>
  <li><strong>Cost:</strong> events are billed; you can hemorrhage budget by over-tracking. Sample noisy events, not signal events.</li>
</ul>
<p><strong>Mantra:</strong> "Events are forever. Define them once, document them always, scrub PII at the seam, and never name two events the same thing."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What is "analytics" in this context?</h3>
<p>Product analytics is the practice of <em>instrumenting</em> a mobile app — emitting structured events at every meaningful user action — and then querying that stream to answer business questions. "What % of new signups complete onboarding?" "Which screen has the worst bounce?" "Did Day-30 retention improve in 1.5.0 vs 1.4.0?" Every answer comes from event data.</p>

<h3>The three categories of tools</h3>
<table>
  <thead><tr><th>Category</th><th>Examples</th><th>Strength</th></tr></thead>
  <tbody>
    <tr><td>Product analytics</td><td>Amplitude, Mixpanel, PostHog, Heap</td><td>Funnels, retention, paths, cohorts — point-and-click for PMs</td></tr>
    <tr><td>Marketing analytics</td><td>Firebase GA4, Adjust, Branch, AppsFlyer</td><td>Attribution: which ad / channel drove this install</td></tr>
    <tr><td>Data warehouse</td><td>Snowflake, BigQuery, Redshift</td><td>Custom SQL / ML on raw events; expensive but flexible</td></tr>
  </tbody>
</table>

<h3>Why analytics matter</h3>
<ol>
  <li><strong>Product decisions.</strong> "Should we cut feature X?" — look at adoption curve.</li>
  <li><strong>Growth experiments.</strong> A/B tests need event data to compute lift; otherwise the experiment is theater.</li>
  <li><strong>Funnel optimization.</strong> Every drop-off step is a $-leak; you can't fix what you can't measure.</li>
  <li><strong>Retention investigation.</strong> Day 1, Day 7, Day 30 cohorts — the canonical "is the product working?" diagnostic.</li>
  <li><strong>Marketing attribution.</strong> Which campaign converts? Which channel has the highest LTV?</li>
  <li><strong>Engineering health.</strong> Performance traces, error rates per screen, slow-screen lists. Often blurs into the crash-reporting tool.</li>
</ol>

<h3>Why mobile analytics is harder than web</h3>
<table>
  <thead><tr><th>Problem</th><th>Mobile reality</th></tr></thead>
  <tbody>
    <tr><td>Offline</td><td>Events fire while plane mode; SDK must persist + retry</td></tr>
    <tr><td>App states</td><td>Background, foreground, suspended — different lifecycle hooks</td></tr>
    <tr><td>Identity</td><td>No cookies; install-IDs reset on reinstall; ATT may block IDFA</td></tr>
    <tr><td>Releases</td><td>You can't roll back instrumentation — once shipped, every install on that version emits forever</td></tr>
    <tr><td>Battery</td><td>Each event is a small wakeup; flooding the network drains battery and breaks the rating</td></tr>
    <tr><td>App store privacy nutrition label</td><td>Apple requires you to declare every category of data you collect</td></tr>
  </tbody>
</table>

<h3>Three identity models</h3>
<ul>
  <li><strong>Device-only.</strong> No login required (e.g., a calculator). Anonymous device ID; reset means new "user."</li>
  <li><strong>Account-based.</strong> User signs in. Pre-signin events fire under device ID; post-signin under user ID; alias the two.</li>
  <li><strong>Cross-device.</strong> Same user on iOS + Android + web. Send a stable user ID across all platforms; tools merge sessions.</li>
</ul>

<h3>What "good" looks like</h3>
<ul>
  <li>Every release has a <strong>tracking plan</strong> in source control — markdown or YAML — listing every event and property.</li>
  <li>The plan is <strong>code-generated</strong> into typed wrappers, so an unknown event name fails to compile.</li>
  <li>PII is <strong>never</strong> in event names, property keys, or values. Reviewed in PR.</li>
  <li>The <strong>tracking lint</strong> runs in CI — unknown events, missing required properties → fail.</li>
  <li>Per-release <strong>QA pass</strong> uses the tool's "live event stream" feature to verify the funnel fires correctly.</li>
  <li>Event budget is monitored; the team rejects "track everything" attitudes.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The event model</h3>
<pre><code class="language-text">user_id: "u_1234"
device_id: "anon_xyz"
event_name: "purchase_completed"
timestamp: 1714403284123
properties: {
  amount_cents: 1499,
  currency: "USD",
  sku: "premium_monthly",
  trial: false,
  source: "checkout_button"
}
context: {
  app_version: "2.4.0",
  build: 431,
  platform: "ios",
  os_version: "17.4",
  device_model: "iPhone15,3",
  locale: "en-US",
  network: "wifi"
}
</code></pre>
<p>Every event has the same shape; only <code>event_name</code> + <code>properties</code> vary. <code>context</code> is auto-injected by the SDK. <code>user_id</code> + <code>device_id</code> are the identity columns.</p>

<h3>Naming convention — pick one and enforce</h3>
<table>
  <thead><tr><th>Style</th><th>Example</th><th>When</th></tr></thead>
  <tbody>
    <tr><td><strong>Object_action</strong> (snake_case)</td><td><code>checkout_started</code>, <code>video_played</code></td><td>Most common; sorts well alphabetically</td></tr>
    <tr><td><strong>Action_object</strong></td><td><code>started_checkout</code>, <code>played_video</code></td><td>Reads more naturally; harder to scan</td></tr>
    <tr><td><strong>Title Case spaces</strong></td><td><code>"Checkout Started"</code></td><td>Mixpanel default; nice in dashboards; rarely used in code</td></tr>
  </tbody>
</table>
<p><strong>Pick one. Document it. Code-review against it.</strong> Inconsistency is the most expensive analytics bug — "checkoutStarted", "Checkout Started", and "checkout_started" all live separately and fragment your funnels.</p>

<h3>Property typing — the silent killer</h3>
<pre><code class="language-text">// Bad — string vs number drift
purchase_completed { amount: "14.99" }   // some events
purchase_completed { amount: 14.99 }     // others

→ Now SUM(amount) is broken. Funnels split. Devs blame analytics tool.
</code></pre>
<p>Lock types per property. <code>amount_cents</code> is <em>always</em> integer; <code>currency</code> is <em>always</em> ISO 4217 string. A typed wrapper is the only durable enforcement.</p>

<h3>The four canonical event types</h3>
<table>
  <thead><tr><th>Type</th><th>Cadence</th><th>Examples</th></tr></thead>
  <tbody>
    <tr><td>Lifecycle</td><td>Once per session</td><td><code>app_opened</code>, <code>session_started</code>, <code>app_backgrounded</code></td></tr>
    <tr><td>Screen / page view</td><td>Per nav</td><td><code>screen_viewed</code> with <code>{ name }</code></td></tr>
    <tr><td>User action</td><td>Per tap / submit</td><td><code>checkout_started</code>, <code>like_tapped</code></td></tr>
    <tr><td>System / background</td><td>Per server response</td><td><code>push_received</code>, <code>auth_failed</code></td></tr>
  </tbody>
</table>

<h3>The "five W's" of every event</h3>
<ol>
  <li><strong>Who</strong> — user_id, device_id, segment</li>
  <li><strong>What</strong> — event_name + properties</li>
  <li><strong>When</strong> — timestamp + session_id</li>
  <li><strong>Where</strong> — screen, route, source</li>
  <li><strong>Why</strong> — referring action (e.g., notification_id, campaign_id, experiment_variant)</li>
</ol>

<h3>The "tracking plan" artifact</h3>
<pre><code class="language-yaml"># tracking-plan.yaml — under version control
events:
  checkout_started:
    description: "User taps the primary checkout button on a product page"
    properties:
      sku: { type: string, required: true }
      price_cents: { type: integer, required: true }
      currency: { type: string, required: true, enum: [USD, EUR, GBP, INR] }
      source: { type: string, enum: [pdp, cart, recommendation] }
  purchase_completed:
    description: "Stripe / IAP success callback"
    properties:
      sku: { type: string, required: true }
      amount_cents: { type: integer, required: true }
      currency: { type: string, required: true }
      payment_method: { type: string, enum: [card, applepay, googlepay, paypal] }
      coupon: { type: string, required: false }
</code></pre>
<p>This file is the source of truth. Codegen produces typed wrappers. Lint compares emitted events against the plan.</p>

<h3>Aliases &amp; identity reconciliation</h3>
<pre><code class="language-text">Anonymous user opens app → SDK emits events with device_id only.
User signs up → emit "alias(device_id, user_id)".
Tool merges past device_id events into the new user_id history.
</code></pre>
<p>Without alias, a user's pre-signup activity is lost forever. Always alias on first login AND on every sign-in (idempotent).</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Amplitude — the canonical setup</h3>
<pre><code class="language-bash">yarn add @amplitude/analytics-react-native
cd ios &amp;&amp; pod install
</code></pre>
<pre><code class="language-tsx">// analytics/index.ts
import { init, track, identify, Identify, setUserId, reset } from '@amplitude/analytics-react-native';

export async function initAnalytics() {
  await init(process.env.AMPLITUDE_KEY!, undefined, {
    serverZone: 'EU',                  // GDPR — keep data in EU
    flushIntervalMillis: 10_000,
    flushQueueSize: 30,
    minIdLength: 5,
    trackingOptions: {
      ipAddress: false,
      adid: false,                      // honor ATT
    },
  }).promise;
}

// Pre-login: device-only.
// Post-login:
export async function onSignIn(user: { id: string; tier: 'free' | 'pro' }) {
  setUserId(user.id);
  const ident = new Identify();
  ident.set('tier', user.tier);
  identify(ident);
}

export function onSignOut() {
  reset();   // forget device-id; new anonymous identity next session
}

export function logEvent&lt;K extends keyof EventMap&gt;(name: K, properties: EventMap[K]) {
  track(name, properties);
}
</code></pre>

<h3>The typed wrapper — the most important file</h3>
<pre><code class="language-tsx">// analytics/events.ts
type Currency = 'USD' | 'EUR' | 'GBP' | 'INR';

export type EventMap = {
  app_opened: { cold_start: boolean };
  screen_viewed: { name: string; params?: Record&lt;string, string | number | boolean&gt; };
  checkout_started: { sku: string; price_cents: number; currency: Currency; source: 'pdp' | 'cart' | 'recommendation' };
  purchase_completed: { sku: string; amount_cents: number; currency: Currency; payment_method: 'card' | 'applepay' | 'googlepay' | 'paypal'; coupon?: string };
  push_opened: { campaign_id?: string; notification_id: string };
};

// Now logEvent('checkout_started', { sku: 'x' }) — TS error: missing fields.
</code></pre>
<p>Typing the events at the source eliminates an entire class of "I forgot to pass amount" bugs.</p>

<h3>Codegen from the YAML plan</h3>
<pre><code class="language-bash"># scripts/generate-events.ts (sketch) — read tracking-plan.yaml, emit events.ts
import yaml from 'js-yaml';
import fs from 'node:fs';

const plan = yaml.load(fs.readFileSync('tracking-plan.yaml', 'utf8')) as any;
const lines: string[] = ['export type EventMap = {'];
for (const [name, def] of Object.entries(plan.events)) {
  // ... build a TS type from the YAML
}
lines.push('};');
fs.writeFileSync('analytics/events.ts', lines.join('\\n'));
</code></pre>
<p>Run in CI; commit the generated file; <code>git diff</code> on the file equals "what changed in instrumentation."</p>

<h3>Auto-screen tracking with React Navigation</h3>
<pre><code class="language-tsx">import { NavigationContainer } from '@react-navigation/native';
import { logEvent } from './analytics';

const navRef = createNavigationContainerRef();

&lt;NavigationContainer
  ref={navRef}
  onStateChange={() =&gt; {
    const route = navRef.getCurrentRoute();
    if (route?.name) {
      logEvent('screen_viewed', { name: route.name, params: route.params as any });
    }
  }}
  onReady={() =&gt; {
    const route = navRef.getCurrentRoute();
    if (route?.name) logEvent('screen_viewed', { name: route.name });
  }}
/&gt;
</code></pre>

<h3>Queueing &amp; offline</h3>
<p>SDKs (Amplitude, Mixpanel, Firebase) all queue events to disk and retry on next foreground. Defaults are sane; you rarely need to override. Things to know:</p>
<ul>
  <li>Queue is bounded (~1000 events). Beyond that, oldest events are dropped.</li>
  <li>Battery-friendly defaults: flush every 10–30s, max 30 events per request.</li>
  <li>For high-volume "telemetry" events (scroll, hover), consider a separate pipeline (Datadog, OpenTelemetry) — analytics tools are designed for product events.</li>
</ul>

<h3>App lifecycle hooks</h3>
<pre><code class="language-tsx">import { AppState } from 'react-native';

let lastState: 'active' | 'background' | 'inactive' = 'active';

AppState.addEventListener('change', (next) =&gt; {
  if (lastState !== 'active' &amp;&amp; next === 'active') {
    logEvent('app_opened', { cold_start: false });
  }
  if (lastState === 'active' &amp;&amp; next !== 'active') {
    logEvent('app_backgrounded', {});
  }
  lastState = next as any;
});

// Cold start fires on the first event of the process
logEvent('app_opened', { cold_start: true });
</code></pre>

<h3>iOS App Tracking Transparency (ATT) — the legal hoop</h3>
<pre><code class="language-tsx">import { request, RESULTS } from 'react-native-permissions';

// In Info.plist add NSUserTrackingUsageDescription with reason text
async function requestATT() {
  const r = await request('ios.permission.APP_TRACKING_TRANSPARENCY' as any);
  return r === RESULTS.GRANTED;
}

// On grant, attach IDFA via the SDK; otherwise leave anonymous
const allowed = await requestATT();
if (allowed) {
  // SDK auto-attaches IDFA
} else {
  // Set Amplitude/Firebase to NOT collect IDFA
}
</code></pre>
<p>Without explicit consent, you cannot use IDFA. Most analytics still work fine; attribution accuracy degrades.</p>

<h3>EU consent banners (GDPR)</h3>
<pre><code class="language-tsx">// Pseudocode: gate analytics init on consent
const consent = await loadConsent();   // null on first launch
if (consent === null) {
  await showConsentSheet();   // user picks accept / reject / customize
  consent = await loadConsent();
}
if (consent.analytics) initAnalytics();
if (consent.marketing) initFirebaseGA();
</code></pre>

<h3>PII scrubbing — last line of defense</h3>
<pre><code class="language-tsx">// Wrap track to refuse known-bad properties
const FORBIDDEN_KEYS = new Set(['email', 'phone', 'name', 'password', 'token', 'address']);

export function logEventSafe&lt;K extends keyof EventMap&gt;(name: K, props: EventMap[K]) {
  for (const k of Object.keys(props as object)) {
    if (FORBIDDEN_KEYS.has(k)) {
      if (__DEV__) throw new Error(\`PII key '\${k}' in '\${String(name)}'\`);
      continue;   // silently drop in prod
    }
  }
  return logEvent(name, props);
}
</code></pre>

<h3>QA tooling — the live event stream</h3>
<p>Every analytics tool has a "live events" view. During QA you log into the app, perform the funnel, and watch the events appear in real time. Default debug build pattern:</p>
<pre><code class="language-tsx">if (__DEV__) {
  // Mirror every event to console for visual confirmation
  const original = track;
  (track as any) = (name: string, props: any) =&gt; {
    console.log('[analytics]', name, props);
    return original(name, props);
  };
}
</code></pre>

<h3>Server-side events</h3>
<p>For purchases, refunds, churn — fire from the server (the source of truth) not the device. Server-side events use the same identity model (user_id) and feed the same warehouse. Avoids duplicate purchase events when the user retries on a flaky network.</p>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: A clean purchase funnel</h3>
<pre><code class="language-tsx">// PDP screen
&lt;Button onPress={() =&gt; {
  logEvent('checkout_started', {
    sku: product.sku,
    price_cents: product.priceCents,
    currency: product.currency,
    source: 'pdp',
  });
  navigation.navigate('Checkout', { sku: product.sku });
}} title="Buy now" /&gt;

// Checkout screen — payment selected
function onPaymentSelected(method: PaymentMethod) {
  logEvent('payment_method_selected', { sku, payment_method: method });
}

// Server-side webhook for purchase success
// (best practice — device may have backgrounded)
//   POST /events { user_id, event_name: 'purchase_completed', properties: {...} }

// Funnel question:
//   "Of users who fired checkout_started today,
//    what % fired purchase_completed within 30 minutes?"
</code></pre>

<h3>Example 2: A retention cohort table</h3>
<pre><code class="language-text">Cohort: users who fired 'app_opened' on day 0.
        Day 1   Day 7   Day 30
2024-04-01    100%    52%     31%
2024-04-08    100%    58%     33%   ← retention up after 1.5.0 release
2024-04-15    100%    61%     35%

Reasoning: tie a release tag to each cohort row;
"app_opened" is enough to define the cohort;
"app_opened" again on day N defines retention.
</code></pre>

<h3>Example 3: Event-driven attribution</h3>
<pre><code class="language-tsx">// Deep link / install referrer drops off campaign params
// On launch, capture them once
const initial = await Linking.getInitialURL();
if (initial) {
  const url = new URL(initial);
  const utm = {
    source: url.searchParams.get('utm_source'),
    medium: url.searchParams.get('utm_medium'),
    campaign: url.searchParams.get('utm_campaign'),
  };
  if (utm.campaign) {
    logEvent('app_install_attributed', utm);
    // Persist attribution context for the lifetime of the install
    await storage.set('attribution', utm);
  }
}

// On every signup event, attach attribution as user property
const attribution = await storage.get('attribution');
if (attribution) {
  const id = new Identify();
  id.set('utm_source', attribution.source);
  id.set('utm_medium', attribution.medium);
  id.set('utm_campaign', attribution.campaign);
  identify(id);
}
</code></pre>

<h3>Example 4: A typed wrapper that's a teaching tool</h3>
<pre><code class="language-tsx">// analytics/track.ts
const REGISTRY = {
  app_opened:        { cold_start: 'boolean' },
  screen_viewed:     { name: 'string', params: 'object?' },
  checkout_started:  { sku: 'string', price_cents: 'integer', currency: 'currency', source: 'enum:pdp|cart|recommendation' },
} as const;

// (sketch — derive a TS type from REGISTRY at build time using a small codegen)
</code></pre>
<p>The benefit: every event has a single source of truth in code, generated as both a TS type and a runtime validator.</p>

<h3>Example 5: Debouncing scroll events</h3>
<pre><code class="language-tsx">// You want to know "did the user scroll past row 50 in the feed?"
// Don't fire on every scroll — fire when crossing the boundary.

let lastReportedRow = 0;

&lt;FlatList
  data={posts}
  onViewableItemsChanged={({ viewableItems }) =&gt; {
    const maxRow = Math.max(...viewableItems.map(i =&gt; i.index ?? 0));
    if (maxRow &gt;= lastReportedRow + 25) {
      logEvent('feed_scrolled', { reached_row: Math.floor(maxRow / 25) * 25 });
      lastReportedRow = maxRow;
    }
  }}
  viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
/&gt;
</code></pre>

<h3>Example 6: Session ID as a bucket key</h3>
<pre><code class="language-tsx">import { v4 as uuid } from 'uuid';

let sessionId = uuid();
let sessionStart = Date.now();
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

AppState.addEventListener('change', (state) =&gt; {
  if (state === 'active' &amp;&amp; Date.now() - sessionStart &gt; SESSION_TIMEOUT_MS) {
    sessionId = uuid();
    sessionStart = Date.now();
  }
});

// Inject into every event via SDK middleware
const middleware = (event: any) =&gt; {
  event.properties = { ...event.properties, session_id: sessionId };
  return event;
};
</code></pre>

<h3>Example 7: Feature-flag-aware events</h3>
<pre><code class="language-tsx">// When testing a new screen behind a flag, attach the variant to events
function logViewedNewCheckout() {
  logEvent('checkout_viewed', {
    variant: featureFlags.newCheckoutEnabled ? 'B' : 'A',
  });
}

// Funnel comparison: 'B' variant conversion vs 'A'.
</code></pre>

<h3>Example 8: Cross-platform user property hygiene</h3>
<pre><code class="language-tsx">// Same user on iOS and Android.
// Both platforms call setUserId(user.id) and identify(...) — Amplitude
// merges them.

// Common bug: incorrect user_id casing across platforms ("u_1" vs "U_1").
// Fix: backend returns canonical user.id; app trusts it; never lowercase/uppercase locally.
</code></pre>

<h3>Example 9: Funnel-completion analysis with a session window</h3>
<pre><code class="language-text">Question: "Of users who tapped 'checkout_started' yesterday,
            what % completed 'purchase_completed' within 30 min,
            same session?"

Amplitude funnel:
  Step 1: checkout_started (where source = 'pdp')
  Step 2: purchase_completed
  Window: 30 min, same session
  Group by: payment_method to see which converts best
</code></pre>

<h3>Example 10: Sampling noisy events</h3>
<pre><code class="language-tsx">// Track every scroll event? You'll be drowning in $.
// Track 1% — still gives a useful denominator.
function sampleTrack(rate: number, name: string, props: any) {
  if (Math.random() &lt; rate) logEvent(name as any, props);
}

sampleTrack(0.01, 'feed_scrolled', { row: 100 });
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Event ordering on poor networks</h3>
<p>SDKs persist events to disk and replay them on retry. Replays may arrive out of order, hours later, even after a reinstall. Implications:</p>
<ul>
  <li>Funnel queries should use <em>event timestamp from device</em>, not server-arrival timestamp.</li>
  <li>Beware of clock skew — devices have wrong clocks. Subtract a server-anchored offset where possible.</li>
  <li>"First seen" calculations must take min(client_ts) per user, not server arrival.</li>
</ul>

<h3>Renamed events break history</h3>
<p>If you change <code>checkout_started</code> to <code>started_checkout</code> in 2.5.0, all data before is under the old name and after under the new. Funnels break silently. Either alias on the server (mapping rule) or never rename.</p>

<h3>Property type drift</h3>
<p>One release sends <code>amount: "14.99"</code>, the next sends <code>amount: 14.99</code>. Now <code>SUM(amount)</code> works on half the data. Ingestion tools usually retain the first observed type — subsequent mismatched events are dropped or coerced silently. Catch with the typed wrapper.</p>

<h3>Bot &amp; QA traffic</h3>
<p>Internal QA, automated tests, and the dev team's daily exploratory testing all hit production analytics. Mark them with a <code>environment: 'qa'</code> user property; filter out in dashboards.</p>

<h3>"Crashed mid-event"</h3>
<p>If the app crashes after enqueue but before disk persist, the event is lost. SDKs persist immediately for important events (purchases, signups). For "nice to have" events, accept the small loss.</p>

<h3>iOS ATT denial</h3>
<p>~50–70% of users deny ATT. Without IDFA you can't do device-level cross-app attribution. SKAdNetwork is Apple's privacy-preserving alternative — limited 24-hour conversion window, aggregated postbacks. Plan for low signal here.</p>

<h3>Anonymous → known identity merge race</h3>
<pre><code class="language-text">User taps "Buy" before signing in (event A under device_id).
User signs in (alias device_id → user_id).
User completes purchase (event B under user_id).

Amplitude/Mixpanel merge histories on alias. But:
- If the alias call fails (rare network blip), event A is orphaned.
- If the same device alias to two different user_ids over time
  (shared device), the second alias may overwrite or split.
</code></pre>
<p>Defensive: send <code>previous_id</code> on every alias and verify the tool's merge semantics for your case.</p>

<h3>Event volume vs cost</h3>
<p>Amplitude / Mixpanel charge per event over their free tier. A spammy "scroll_progress" event on 10M MAU at 100 fires/session = 1B events/month — orders of magnitude over the free tier. Always sample high-volume events at 1–5%.</p>

<h3>Apple privacy nutrition label</h3>
<p>App Store Connect requires you to declare:</p>
<ul>
  <li>Identifiers collected (user ID, device ID, IDFA).</li>
  <li>Linked to user identity (yes / no).</li>
  <li>Used for tracking across apps (yes / no).</li>
</ul>
<p>If you turn on a new SDK and forget to update the label, Apple may reject your next release.</p>

<h3>Mid-funnel A/B test contamination</h3>
<p>Users in variant A who upgrade to a new app version may be assigned variant B; cohort assignment shifts. Bake the variant into the event itself (variant property) so you can query the cohort the user was in <em>at event time</em>.</p>

<h3>Server-time vs client-time</h3>
<p>Use client-time for funnels and behavioral cohorts (you care about user-perceived order). Use server-time for revenue / billing reconciliation (you care about wall-clock).</p>

<h3>Browser webview events</h3>
<p>If your RN app embeds a webview that has its own analytics SDK, you'll have two pipelines for the same user. Either pass the user_id into the webview via <code>postMessage</code> and use the same SDK there, or accept the duplication and deduplicate downstream.</p>

<h3>Reinstall = new device</h3>
<p>Most analytics tools generate a fresh device_id on reinstall (the keychain may persist on iOS, defaulting to a stable id; Android's Settings.Secure.ANDROID_ID is restored on backup). Plan for "30% of users on Mondays look like new users" if you measure DAU naively.</p>

<h3>Daylight savings / timezone</h3>
<p>"Day 7 retention" — what timezone? Standardize on UTC for cohort buckets; localize only for display.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: PII in event names</h3>
<pre><code class="language-tsx">// BAD — user email in event name
logEvent(\`checkout_started_\${user.email}\`, {});
// Now Amplitude has 100k unique event names, dashboards explode.

// GOOD
logEvent('checkout_started', {});
</code></pre>

<h3>Bug 2: PII in property values</h3>
<pre><code class="language-tsx">// BAD
logEvent('search_performed', { query: rawSearchQuery });
// rawSearchQuery may include addresses, names, credit-card-shaped strings

// GOOD — categorize, not echo
logEvent('search_performed', { length: rawSearchQuery.length, has_special_chars: /[^a-z0-9 ]/i.test(rawSearchQuery) });
</code></pre>

<h3>Bug 3: silently swallowing the alias</h3>
<pre><code class="language-tsx">// BAD — pre-login data lost
async function signIn(creds) {
  const user = await api.login(creds);
  setUserId(user.id);   // forgot to alias the prior device_id
}

// GOOD
async function signIn(creds) {
  const prevDeviceId = await getDeviceId();
  const user = await api.login(creds);
  setUserId(user.id);
  alias(prevDeviceId, user.id);
}
</code></pre>

<h3>Bug 4: race between init and first event</h3>
<pre><code class="language-tsx">// BAD — init is async; first event fires immediately, before init resolves
initAnalytics();   // returns a promise
logEvent('app_opened', { cold_start: true });   // queued, may drop

// GOOD
await initAnalytics();
logEvent('app_opened', { cold_start: true });
</code></pre>

<h3>Bug 5: setting user properties from device data</h3>
<pre><code class="language-tsx">// BAD — overwrites server-canonical fields with stale device cache
identify(new Identify().set('email', user.email));   // user.email may be old

// GOOD — only set fields the server is the source of truth for, on backend events
</code></pre>

<h3>Bug 6: typo in event name</h3>
<pre><code class="language-tsx">logEvent('chekout_started', {});
// Spelled wrong; now data fragments. No compiler warning, no SDK warning.

// FIX — typed wrapper rejects unknown names at build time
</code></pre>

<h3>Bug 7: using analytics for engineering metrics</h3>
<pre><code class="language-tsx">// BAD — paying $$$ to track scroll latency
logEvent('scroll_latency_ms', { value: t });

// GOOD — push to your APM/observability tool (Datadog, NewRelic, OpenTelemetry)
otel.metric('scroll.latency_ms', t);
</code></pre>

<h3>Bug 8: forgetting to opt-out the QA / staff devices</h3>
<pre><code class="language-tsx">// BAD — internal usage skews funnels
// FIX — set a property on internal users
identify(new Identify().set('is_staff', user.is_staff));
// Filter out in every dashboard
</code></pre>

<h3>Bug 9: tracking on every render</h3>
<pre><code class="language-tsx">function Home() {
  logEvent('home_viewed', {});   // fires on every re-render
  return ...;
}

// FIX — fire once
useEffect(() =&gt; { logEvent('home_viewed', {}); }, []);
</code></pre>

<h3>Bug 10: using SDK in tests without disabling</h3>
<pre><code class="language-tsx">// jest produces hundreds of events per CI run → poisons the QA env
if (process.env.JEST_WORKER_ID) return;   // skip init
</code></pre>

<h3>Anti-pattern 1: track everything</h3>
<p>"More data = better." False. More data = more cost, more PII risk, more dashboards to maintain, and a noisier signal when you actually want to find something. Track the events that answer specific questions.</p>

<h3>Anti-pattern 2: no tracking plan</h3>
<p>"Engineering tracks what they think is useful." Three quarters later, the data is a mess and the org has to do a whole "schema migration." Plans cost a day; recovery costs months.</p>

<h3>Anti-pattern 3: stringly-typed property keys</h3>
<pre><code class="language-tsx">logEvent('purchase_completed', { sku: '...', amt: 100, curr: 'USD' });
// Tomorrow: 'amt' or 'amount'? 'curr' or 'currency'? Drift.

// Use the typed wrapper; deviation is a compile error.
</code></pre>

<h3>Anti-pattern 4: per-platform event divergence</h3>
<p>"iOS sends <code>purchase_completed</code>; Android sends <code>purchase_complete</code>." Now the funnel is fragmented per platform. Single source: shared TS types between iOS+Android RN code; codegen if you have native code too.</p>

<h3>Anti-pattern 5: console.log "for now"</h3>
<p>"We'll instrument when we have time." When the time comes you've shipped a year of features and have no signal. Wire analytics on day 1, even if just <code>app_opened</code>.</p>

<h3>Anti-pattern 6: event-property explosion</h3>
<pre><code class="language-tsx">// BAD — every search variant a new property
logEvent('search', { query_for_pizza: '...', query_for_pasta: '...' });

// GOOD
logEvent('search', { category: 'pizza', query_length: 5 });
</code></pre>

<h3>Anti-pattern 7: ignoring deprecated events</h3>
<p>Old releases keep firing old events forever. Treat instrumentation as code: deprecate, mark in dashboard, eventually drop the dashboard query.</p>

<h3>Anti-pattern 8: relying on the dashboard for ground truth</h3>
<p>Dashboards have caching, sampling, and timezone quirks. Always validate suspicious findings with raw SQL on the warehouse. The dashboard is convenient; the warehouse is authoritative.</p>
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
    <tr><td><em>What goes into an event?</em></td><td>Name + properties + identity (user_id / device_id) + auto-context (app version, OS, locale).</td></tr>
    <tr><td><em>How do you handle pre-login activity?</em></td><td>Anonymous device_id; alias to user_id on signup so history merges.</td></tr>
    <tr><td><em>Why a tracking plan?</em></td><td>Single source of truth for event names &amp; property types; prevents drift; enables codegen.</td></tr>
    <tr><td><em>How do you avoid PII leaks?</em></td><td>Never put email/name/phone in event names or values; <code>beforeSend</code>-style scrub at SDK boundary; typed wrapper rejects forbidden keys.</td></tr>
    <tr><td><em>How do you compute Day 7 retention?</em></td><td>Cohort by app_opened day 0; users who fired app_opened again on day 7 / total cohort users.</td></tr>
    <tr><td><em>Amplitude vs Mixpanel vs Firebase?</em></td><td>Amplitude/Mixpanel: best product analytics. Firebase: free + Google Ads attribution. PostHog: open source.</td></tr>
    <tr><td><em>How do you handle ATT?</em></td><td>Prompt explicitly with a NSUserTrackingUsageDescription; on deny, drop IDFA, accept reduced attribution accuracy.</td></tr>
    <tr><td><em>How do you handle GDPR?</em></td><td>Consent banner on first launch; gate SDK init on consent; respect user opt-out toggles; store data in EU region.</td></tr>
    <tr><td><em>How would you design event ID for a/b experiments?</em></td><td>Attach <code>variant</code> to every funnel-relevant event so cohort is recoverable.</td></tr>
    <tr><td><em>How do you prevent QA traffic from polluting metrics?</em></td><td>Set <code>is_staff</code> or <code>environment: 'qa'</code> user property; filter in every dashboard.</td></tr>
    <tr><td><em>How do you keep cost down?</em></td><td>Sample noisy events; never instrument scroll/render-rate as analytics events; push perf to APM.</td></tr>
    <tr><td><em>How do you debug "events aren't showing up"?</em></td><td>Live event view + console mirror + reinstall fresh; check init promise resolution; check ATT/consent state; check release tag.</td></tr>
  </tbody>
</table>

<h3>Live design prompts</h3>
<ol>
  <li><em>"Design the analytics for a checkout flow that has Apple Pay, Google Pay, and credit card."</em>
    <ul>
      <li>Events: <code>checkout_started</code>, <code>payment_method_selected</code>, <code>payment_attempted</code>, <code>payment_succeeded</code>, <code>payment_failed</code>.</li>
      <li>Properties: <code>payment_method</code>, <code>amount_cents</code>, <code>currency</code>, <code>error_code</code> on failure.</li>
      <li>Server-side authoritative for <code>purchase_completed</code> (not device).</li>
      <li>Funnel: started → method → attempted → succeeded.</li>
      <li>Variant tracking if A/B testing the layout.</li>
    </ul>
  </li>
  <li><em>"Investigate why retention dropped 5pp in 1.5.0."</em>
    <ul>
      <li>Cohort by app version. Did onboarding-completion drop? If yes, check screen_viewed funnel through onboarding.</li>
      <li>Did push opt-in drop? Push delivery affects D7+.</li>
      <li>Crash rate up? Cross-reference with Sentry.</li>
      <li>Time to first key action up? Performance trace per screen.</li>
    </ul>
  </li>
  <li><em>"Build a tracking plan for a chat app's messaging feature."</em>
    <ul>
      <li><code>conversation_opened</code>, <code>message_sent</code>, <code>message_received</code>, <code>message_read</code>, <code>typing_started</code>, <code>media_attached</code>, <code>conversation_archived</code>.</li>
      <li>Properties: conversation_id (hashed), message_type (text/image/video/audio), char_count_bucket (1-50, 51-200, etc), recipient_count for groups.</li>
      <li>Never log message content.</li>
    </ul>
  </li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>Funnel split between iOS and Android — event name differs (case, snake vs camel).</li>
  <li>"User_id" appears as null on a third of events — alias never called or alias call failed silently.</li>
  <li>Property value type mismatch — string vs number drift across releases.</li>
  <li>D7 retention drops sharply on weekends — bot/QA traffic pattern not filtered.</li>
  <li>Same user has 4 device_ids — reinstall pattern; dashboard treats each as new user.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Schema discipline</td><td>You volunteer "we'd write a tracking plan and codegen TS types from it" before being asked.</td></tr>
    <tr><td>Identity model</td><td>You distinguish device_id vs user_id and explain the alias step.</td></tr>
    <tr><td>Privacy fluency</td><td>You name ATT, GDPR, COPPA, the App Privacy nutrition label, and have a default scrub strategy.</td></tr>
    <tr><td>Cost awareness</td><td>You sample noisy events; you don't ship scroll-tracking to a per-event-priced tool.</td></tr>
    <tr><td>Release-aware</td><td>Every event is tagged with app version, build, JS revision (for OTA).</td></tr>
    <tr><td>Tool selection</td><td>You can defend Amplitude vs Mixpanel vs GA4 vs PostHog with use-case-specific reasoning.</td></tr>
    <tr><td>Funnel literacy</td><td>You can describe how to compute D1/D7/D30 retention and a 4-step purchase funnel.</td></tr>
  </tbody>
</table>

<h3>Mobile-specific deep questions</h3>
<ul>
  <li><em>"Same user on iOS and Android — how does the dashboard merge them?"</em> — Send the same <code>user_id</code> on both; the tool merges histories. <code>device_id</code> is platform-specific and remains separate.</li>
  <li><em>"Why might a Day 7 cohort look bigger on Tuesday?"</em> — Push schedule (Mondays) drives Day 1 spike; QA traffic on weekdays only; release rollout on a specific day adds unique installs.</li>
  <li><em>"What's the biggest analytics anti-pattern you've seen?"</em> — A team with 1,200 distinct events, no tracking plan, and four engineers who each named events differently. Migration took 6 months.</li>
  <li><em>"Tracking plan vs schema registry — same thing?"</em> — Same idea, different terminology. Plan is the human-readable doc; registry is the machine-readable enforcement.</li>
  <li><em>"How do you handle a brand-new event that didn't exist when 1.0 shipped?"</em> — Backwards compatibility: old releases never fire it; new releases do; queries handle the absence gracefully.</li>
</ul>

<h3>"What I'd do day one on the team"</h3>
<ul>
  <li>Read the tracking plan. If none exists, propose one.</li>
  <li>Audit the events firing today: live stream view, sample 100, classify by type and PII risk.</li>
  <li>Identify the top 3 funnels the org cares about; verify they're complete and accurate.</li>
  <li>Set up alerts: drop in <code>app_opened</code> &gt; 20% week-over-week; sudden spike in any event with new properties.</li>
  <li>Verify ATT/GDPR consent flow with a fresh install on each platform.</li>
  <li>Write a 1-page "how to add a new event" doc for the team.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd codegen typed wrappers from the YAML plan and add a CI lint that fails on unknown events."</li>
  <li>"I'd add a server-side event pipeline so purchases / refunds aren't dependent on device retry."</li>
  <li>"I'd audit privacy nutrition labels quarterly to stay compliant with App Store policy changes."</li>
  <li>"I'd integrate event data with Sentry sessions — when a crash happens we see the user's last 50 analytics events."</li>
  <li>"I'd build a 'session replay' for top funnels with PostHog or LogRocket — the cheapest way to find UX bugs."</li>
</ul>
`
    }
  ]
});
