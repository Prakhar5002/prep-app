window.PREP_SITE.registerTopic({
  id: "mprod-clarity",
  module: "mobile-prod",
  title: "Microsoft Clarity & Session Analytics",
  estimatedReadTime: "35 min",
  tags: ["clarity","session-replay","heatmaps","rage-clicks","ux-analytics","privacy","masking","consent","react-native","web"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Clarity is free <strong>session analytics</strong> — replays, heatmaps and frustration signals — that explains <em>why</em> users struggle; you load it behind consent, mask PII on the client, and tag sessions with the same ids/vocabulary as your event analytics so you can pivot between the two.</div>
  <h4>Key points</h4>
  <ul>
    <li>Features: session recordings, click/scroll/area heatmaps, insights (rage clicks, dead clicks, excessive scrolling, quick-backs, errors), filters/segments.</li>
    <li>Web capture = DOM snapshot + mutations + input events, rebuilt in the player; mobile SDKs capture a lightweight representation of the screen — neither is video, so masking happens on the device before anything is sent.</li>
    <li>Web API: tag (<code>window.clarity('set'|'identify'|'event'|'upgrade'|'consent', ...)</code>) or npm <code>@microsoft/clarity</code> (<code>init</code>, <code>identify</code>, <code>setTag</code>, <code>event</code>, <code>upgrade</code>, <code>consent</code>).</li>
    <li>RN: <code>@microsoft/react-native-clarity</code> wraps native SDKs; <code>initialize</code> + custom user id, tags, events, screen names, pause/resume; needs a dev build, not Expo Go.</li>
    <li>Set RN screen names from the navigator or every screen collapses into one.</li>
    <li>Masking: project mode (strict/balanced/relaxed) + <code>data-clarity-mask</code>/<code>unmask</code> on web; mask APIs on mobile (check current docs for RN shape); pause on sensitive screens.</li>
    <li>Identity: opaque internal ids only — never email/phone (Clarity also hashes the custom user id client-side).</li>
    <li>Enrich sessions with custom tags + events so you can filter "checkout failed for plan=pro on Android 14", and start every investigation from that filtered set of rage/dead-click recordings, not random replays.</li>
    <li>Consent: gate init on the CMP or use the consent API; EEA/UK/CH requires a consent signal (check current docs).</li>
    <li>Pairs with GA4/Mixpanel: quant finds <em>where</em>, Clarity shows <em>why</em>, quant proves the fix; built-in GA4 integration.</li>
    <li>Not a crash reporter, APM, A/B tool or source of truth for KPIs — sample is biased by consent and blockers.</li>
    <li>One project per environment; URL grouping or tags for dynamic routes.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>"Install the snippet and watch replays."</strong> Without consent gating, masking review, opaque ids, RN screen names and a tag vocabulary, you get a privacy liability full of unfilterable sessions — and engineers watching random replays instead of starting from a funnel drop or a frustration signal.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Event analytics tells me where users drop; session analytics like Clarity shows me why — I go funnel, then filtered replays, then back to the funnel to prove the fix."</div>
  <div class="revision-say">"Masking happens on the client before data leaves, so I set strict masking, unmask only static labels, use opaque user ids and pause recording on payment and ID screens."</div>
  <div class="revision-say">"In React Native I initialise Clarity after consent, set screen names from the navigation container, and tag sessions with the same variant and plan values my analytics uses."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What Clarity gives you</h3>
<table>
  <thead><tr><th>Feature</th><th>What it is</th><th>Question it answers</th></tr></thead>
  <tbody>
    <tr><td>Session recordings</td><td>Replay of a user's session: pages/screens, scrolls, taps, inputs (masked), navigation</td><td>"What did this user actually do before giving up?"</td></tr>
    <tr><td>Heatmaps</td><td>Aggregated click/tap maps, scroll-depth maps, area maps per page or screen</td><td>"Does anyone see the CTA below the fold? Which element gets tapped that isn't a button?"</td></tr>
    <tr><td>Insights / smart signals</td><td>Auto-detected <strong>rage clicks</strong> (rapid repeated clicks in one spot), <strong>dead clicks</strong> (click with no response), <strong>excessive scrolling</strong>, <strong>quick backs</strong>, JavaScript errors / crashes on mobile</td><td>"Where is the UI frustrating people right now?"</td></tr>
    <tr><td>Filters &amp; segments</td><td>Filter sessions by device, OS, country, URL/screen, custom tags, custom events, signals</td><td>"Show me Android sessions with a dead click on the Pay button."</td></tr>
    <tr><td>Dashboard metrics</td><td>Sessions, pages per session, scroll depth, time on page, frustration-signal rates</td><td>"Did the release make frustration better or worse?"</td></tr>
    <tr><td>AI summaries (Copilot features)</td><td>Natural-language summaries of sessions / heatmaps (availability varies — check current Clarity docs)</td><td>"Summarise what users do on the pricing page."</td></tr>
  </tbody>
</table>

<h3>Why it matters for an app/full-stack engineer</h3>
<ul>
  <li><strong>Reproducing UX bugs:</strong> "Users say the form doesn't submit" — a recording shows the keyboard covering the button, or a validation message rendered off-screen.</li>
  <li><strong>Prioritising:</strong> rage-click counts on an element give product a number to rank fixes by.</li>
  <li><strong>Verifying a release:</strong> compare dead-click rate on the new checkout vs old, per platform.</li>
  <li><strong>Forward-deployed debugging:</strong> a customer reports "your widget is broken on our site". Clarity on their deployment (with their consent and masking) shows the CSS collision or the blocked script in minutes.</li>
</ul>

<h3>Clarity vs other session tools</h3>
<table>
  <thead><tr><th></th><th>Clarity</th><th>Hotjar / FullStory / LogRocket / Smartlook-class tools</th><th>Product analytics (GA4, Mixpanel, Amplitude)</th></tr></thead>
  <tbody>
    <tr><td>Primary output</td><td>Replays, heatmaps, frustration signals</td><td>Replays + (varies) funnels, dev tooling, console/network capture</td><td>Events, funnels, retention, cohorts</td></tr>
    <tr><td>Price</td><td>Free (at time of writing)</td><td>Paid tiers, usage-based</td><td>Free tiers + paid</td></tr>
    <tr><td>Developer-debugging depth</td><td>Basic (errors, some console info)</td><td>LogRocket-class tools capture network/console/Redux in depth</td><td>None</td></tr>
    <tr><td>Data ownership / export</td><td>Limited export; data hosted by Microsoft</td><td>Varies; some offer warehouse export</td><td>Strong export (BigQuery, etc.)</td></tr>
    <tr><td>Best at</td><td>Cheap, broad qualitative coverage</td><td>Deep debugging or enterprise needs</td><td>Quantitative questions</td></tr>
  </tbody>
</table>
<div class="callout warn">
  <div class="callout-title">What it is not</div>
  <p>Clarity is not a crash reporter (use Crashlytics / Sentry — see <a href="#/topic/mprod-crash">Crash Reporting</a>), not an A/B test tool (<a href="#/topic/mprod-ab">A/B Testing</a>), and not your source of truth for business metrics. Its numbers are sampled/approximate in places and filtered by consent; use it for <em>insight</em>, not for revenue reporting.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>1. Quantitative vs qualitative loop</h3>
<div class="diagram">
<pre>
  Product analytics (GA4/Mixpanel)          Clarity
  ────────────────────────────────          ──────────────────────────────
  Funnel: step 3 → step 4 drops 40%   ──►   Filter: URL = /checkout/step-3
                                              + rage click OR dead click
                                              + tag plan=pro
                                       ◄──   Watch 15–20 replays, find pattern
  Ship fix behind flag, measure             Heatmap: taps on non-tappable
  conversion change                          label "Apply coupon"
</pre>
</div>
<p>Start quantitative to find <em>where</em>, go qualitative to find <em>why</em>, return to quantitative to prove the fix worked.</p>

<h3>2. How web capture works</h3>
<div class="diagram">
<pre>
 Browser (your page)                                   Clarity backend
 ───────────────────                                   ───────────────
 clarity.js loads (async) ──► snapshot of DOM (masked text/inputs)
 MutationObserver ──────────► stream DOM diffs           │
 pointer/scroll/resize ─────► stream interaction events  ├─► stores session
 custom tags / events / identify ─────────────────────► │   indexes signals
                                                         │   builds heatmaps
 Player: rebuilds DOM from snapshot + diffs ◄────────────┘
         (re-fetches your CSS/images from your origin at playback time)
</pre>
</div>
<p>Two consequences: (1) masking is applied <strong>in the browser</strong>, so masked text never leaves the device; (2) the player loads assets from your site when you watch — if assets are behind auth or have since changed, the replay can look broken even though the capture was fine.</p>

<h3>3. How mobile capture works (conceptually)</h3>
<p>Native Clarity SDKs capture the screen's view hierarchy / drawing commands plus touch events, compress them, and upload in batches (configurable to avoid metered networks in some SDK versions — check current docs). React Native has no DOM, so the RN package wraps the native Android/iOS SDKs; your JS code mostly calls <code>initialize</code> and metadata methods. Screen names come from the native layer unless you set them from your navigator.</p>

<h3>4. The session as a filterable record</h3>
<div class="diagram">
<pre>
 Session
 ├── automatic: device, OS, browser/app version, country, entry URL/screen,
 │              duration, pages/screens, signals (rage, dead, quick-back, errors)
 ├── identify:  custom user id (hashed by Clarity), custom session id,
 │              friendly name (web identify)
 ├── tags:      key → value(s)   e.g. plan=pro, experiment=checkout_v2:B, tenant=acme
 └── events:    named moments    e.g. coupon_failed, payment_error
</pre>
</div>
<p>Everything you will want to filter by later must be attached <em>during</em> the session. Decide your tag/event vocabulary up front — ideally re-using the names from your event-analytics tracking plan.</p>

<h3>5. Privacy layers</h3>
<table>
  <thead><tr><th>Layer</th><th>Control</th><th>Who owns it</th></tr></thead>
  <tbody>
    <tr><td>Whether to record at all</td><td>Consent banner / CMP → call Clarity's consent API or delay loading</td><td>Engineering + legal</td></tr>
    <tr><td>What text is visible</td><td>Project masking mode (strict / balanced / relaxed) + per-element mask/unmask</td><td>Engineering</td></tr>
    <tr><td>Which pages/screens</td><td>Don't load / pause on sensitive routes (payment, health, documents)</td><td>Engineering</td></tr>
    <tr><td>Who can watch</td><td>Clarity project team membership and roles</td><td>Ops / admin</td></tr>
    <tr><td>How long data lives</td><td>Clarity retention policy (check current docs); favourites kept longer</td><td>Vendor policy</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. Web — script tag</h3>
<p>Create a project at clarity.microsoft.com, copy the tracking snippet into <code>&lt;head&gt;</code>. The snippet defines a <code>window.clarity</code> queue function and loads <code>clarity.js</code> asynchronously, so calls made before the script finishes loading are queued, not lost.</p>
<pre><code class="language-js">// Global API exposed by the tag (calls are queued until the script loads)
window.clarity('set', 'plan', 'pro');                       // custom tag
window.clarity('identify', 'user-123', 'sess-abc', 'checkout', 'Ada'); // id, session id, page id, friendly name
window.clarity('event', 'coupon_failed');                   // custom event (smart-event filterable)
window.clarity('upgrade', 'payment_error');                 // prioritise this session for recording
window.clarity('consent');                                  // signal consent was granted (see consent section)</code></pre>

<h3>2. Web — npm package (SPA / Next.js / React)</h3>
<pre><code class="language-ts">// src/analytics/clarity.ts
import Clarity from '@microsoft/clarity';

let started = false;

export function startClarity(projectId: string) {
  if (started || typeof window === 'undefined') return;   // SSR-safe, idempotent
  Clarity.init(projectId);
  started = true;
}

export function identifyUser(user: { id: string; displayName?: string }, sessionId?: string) {
  if (!started) return;
  // Clarity hashes the custom id on the client before sending — still, never pass emails/phones
  Clarity.identify(user.id, sessionId, undefined, user.displayName);
}

export function tag(key: string, value: string | string[]) {
  if (started) Clarity.setTag(key, value);
}

export function trackFrustrationPoint(name: string) {
  if (started) Clarity.event(name);
}

export function prioritise(reason: string) {
  if (started) Clarity.upgrade(reason);
}</code></pre>
<p>Load it only in the browser (in Next.js App Router: a client component in the root layout, or the <code>next/script</code> component with an <code>afterInteractive</code>-style strategy for the tag). Never call it during server rendering.</p>

<h3>3. Web — masking</h3>
<pre><code class="language-html">&lt;!-- Mask everything inside this element (text replaced in the recording) --&gt;
&lt;section data-clarity-mask="true"&gt;
  &lt;p&gt;Account number: 1234-5678&lt;/p&gt;
&lt;/section&gt;

&lt;!-- In strict/balanced modes, explicitly reveal non-sensitive content you need to read --&gt;
&lt;h1 data-clarity-unmask="true"&gt;Choose your plan&lt;/h1&gt;</code></pre>
<ul>
  <li><strong>Masking modes</strong> (project settings): <em>Strict</em> masks all text; <em>Balanced</em> (default at time of writing) masks sensitive inputs and common sensitive text patterns; <em>Relaxed</em> masks only obviously sensitive inputs. Password inputs are always masked.</li>
  <li>Mask on the element closest to the data; masking a container masks all descendants.</li>
  <li>Don't forget <strong>non-input PII</strong>: names in headers, addresses on confirmation pages, IDs in URLs (Clarity records URLs — strip PII from query strings).</li>
</ul>

<h3>4. Web — consent</h3>
<pre><code class="language-ts">// Pattern A: don't load Clarity at all until the CMP says yes (simplest, strictest)
cmp.onConsentChange((c) =&gt; {
  if (c.analytics) startClarity(process.env.NEXT_PUBLIC_CLARITY_ID as string);
});

// Pattern B: load in a cookieless/limited mode and signal consent when given.
// The SDK exposes a consent API (Clarity.consent(), and a newer consent-v2 call that takes
// ad/analytics storage flags) — exact shape: check current Clarity docs.
cmp.onConsentChange((c) =&gt; {
  if (c.analytics) Clarity.consent();
});</code></pre>
<div class="callout danger">
  <div class="callout-title">Consent requirement</div>
  <p>Microsoft announced that, for visitors in the EEA, UK and Switzerland, Clarity requires a valid consent signal (it integrates with consent-mode signals from common CMPs) — without one, functionality is limited. Dates and exact behaviour: check current Clarity docs and your legal team before going live in those regions.</p>
</div>

<h3>5. React Native — setup</h3>
<pre><code class="language-bash">npm install @microsoft/react-native-clarity
cd ios &amp;&amp; pod install            # bare RN
# Expo: works in a development build / prebuild (native code), NOT in Expo Go</code></pre>
<pre><code class="language-ts">// app/analytics/clarity.ts
import * as Clarity from '@microsoft/react-native-clarity';

const CLARITY_ID = process.env.EXPO_PUBLIC_CLARITY_ID;   // per-environment project id

export function startClarity(hasConsent: boolean) {
  if (!CLARITY_ID || !hasConsent || __DEV__) return;
  Clarity.initialize(CLARITY_ID, {
    logLevel: Clarity.LogLevel.None,   // Verbose while integrating
  });
}

export function onLogin(userId: string) {
  Clarity.setCustomUserId(userId);      // stable internal id, never email/phone
}

export function onScreen(name: string) {
  Clarity.setCurrentScreenName(name);   // RN screens are one native Activity/VC — name them yourself
}

export function onCheckoutVariant(variant: string) {
  Clarity.setCustomTag('checkout_variant', variant);
}

export function markEvent(name: string) {
  Clarity.sendCustomEvent(name);
}

// Pause recording around sensitive flows (payments, document capture)
export const pauseClarity = () =&gt; Clarity.pause();
export const resumeClarity = () =&gt; Clarity.resume();</code></pre>
<p>The method names above (<code>initialize</code>, <code>setCustomUserId</code>, <code>setCustomSessionId</code>, <code>setCustomTag</code>, <code>setCurrentScreenName</code>, <code>sendCustomEvent</code>, <code>pause</code>/<code>resume</code>, <code>getCurrentSessionUrl</code>) are from the package README at time of writing — <strong>verify against the current README</strong>, as the RN wrapper has changed config options between major versions (iOS support and config fields in particular).</p>

<h3>6. React Native — screen names from React Navigation</h3>
<pre><code class="language-ts">// App.tsx
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { onScreen } from './analytics/clarity';

export default function App() {
  const navRef = useNavigationContainerRef();
  return (
    &lt;NavigationContainer
      ref={navRef}
      onReady={() =&gt; onScreen(navRef.getCurrentRoute()?.name ?? 'Unknown')}
      onStateChange={() =&gt; onScreen(navRef.getCurrentRoute()?.name ?? 'Unknown')}
    &gt;
      {/* ...navigators */}
    &lt;/NavigationContainer&gt;
  );
}</code></pre>
<p>Without this, every RN screen looks like "MainActivity" in Clarity's screen filters and heatmaps become useless.</p>

<h3>7. React Native — masking</h3>
<p>Mobile projects also have a masking mode in project settings, and the native SDKs provide APIs to mask or unmask specific views. How that is exposed in React Native (component wrapper vs native-view API) has varied by version — <strong>check current Clarity docs</strong>. Safe defaults regardless: use the strictest mode that still lets you read the UI, and <code>pause()</code> on screens that show card numbers, IDs, health data or camera feeds.</p>

<h3>8. Linking Clarity with your event analytics</h3>
<pre><code class="language-ts">// Use the SAME identifiers in both tools so you can pivot between them
export function onSignIn(user: { id: string; plan: string }) {
  analytics.identify(user.id, { plan: user.plan });     // Mixpanel/Amplitude/Segment
  Clarity.setCustomUserId(user.id);
  Clarity.setCustomTag('plan', user.plan);
}

// When a funnel-critical error happens, record it in both
export function onPaymentError(code: string) {
  analytics.track('payment_failed', { code });
  Clarity.sendCustomEvent('payment_failed');
  Clarity.setCustomTag('last_error', code);
}

// Optional: attach the replay link to a support ticket or error report
export async function replayLink(): Promise&lt;string | undefined&gt; {
  try { return await Clarity.getCurrentSessionUrl(); } catch { return undefined; }
}</code></pre>
<p>For GA4 specifically, Clarity offers a built-in integration (enable in Clarity settings) that adds a Clarity playback link into GA so you can jump from a GA segment to recordings.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — Debugging a "button does nothing" report</h3>
<ol>
  <li>Dashboard → dead clicks → filter URL/screen = <code>/booking/confirm</code>, last 7 days.</li>
  <li>Click map shows a cluster on the price summary card, not the Confirm button: users think the card is tappable.</li>
  <li>Watch 10 recordings: on small Android screens the Confirm button sits under the gesture bar / keyboard; users tap the card instead, then rage-tap.</li>
  <li>Fix: sticky footer with safe-area inset, make the card tappable (scrolls to button). Ship behind a flag.</li>
  <li>Verify: dead-click rate on that screen before/after, split by tag <code>app_version</code>, plus funnel conversion in product analytics.</li>
</ol>

<h3>Example 2 — Tagging an experiment so replays split by variant</h3>
<pre><code class="language-ts">// After the experiment SDK assigns a variant (see A/B Testing)
const variant = experiments.getVariant('checkout_v2');   // 'control' | 'B'
Clarity.setCustomTag('exp_checkout_v2', variant);
// Clarity: filter custom tag exp_checkout_v2 = B AND signal = rage click
// → qualitative read of WHY variant B under/over-performs, alongside the quant result.</code></pre>

<h3>Example 3 — A privacy-safe web integration for a B2B dashboard</h3>
<pre><code class="language-ts">// Next.js App Router: app/clarity-provider.tsx
'use client';
import { useEffect } from 'react';
import Clarity from '@microsoft/clarity';
import { useConsent } from './consent';
import { useSession } from './auth';

const SENSITIVE = [/^\\/billing/, /^\\/settings\\/api-keys/];

export function ClarityProvider() {
  const consent = useConsent();
  const session = useSession();

  useEffect(() =&gt; {
    if (!consent.analytics) return;
    if (SENSITIVE.some((r) =&gt; r.test(window.location.pathname))) return; // never start on these
    Clarity.init(process.env.NEXT_PUBLIC_CLARITY_ID as string);
  }, [consent.analytics]);

  useEffect(() =&gt; {
    if (!consent.analytics || !session) return;
    Clarity.identify(session.userId);                 // opaque id only
    Clarity.setTag('tenant', session.tenantSlug);     // filter replays per customer
    Clarity.setTag('role', session.role);
  }, [consent.analytics, session]);

  return null;
}</code></pre>
<p>Plus: set the project to <em>Strict</em> masking, add <code>data-clarity-unmask</code> only to static UI labels you need to read, and strip tokens from URLs (no <code>?token=</code> in links).</p>

<h3>Example 4 — Meeting-room booking tablet + companion mobile app</h3>
<p>A booking product with a wall-mounted tablet app and an employee RN app. Event analytics showed "extend meeting" was rarely used on tablets. Clarity heatmaps of the tablet's "in progress" screen showed most taps landed on the room name and the clock — people expected tapping the current meeting card to show actions. Recordings also showed users giving up after the confirmation dialog timed out. Changes: make the whole card the action target, lengthen the dialog timeout, and tag sessions with <code>device_type=room_tablet</code> so tablet and phone heatmaps never mix.</p>

<h3>Example 5 — Decision table: which tool for which question</h3>
<table>
  <thead><tr><th>Question</th><th>Tool</th></tr></thead>
  <tbody>
    <tr><td>How many users completed onboarding last week?</td><td>Product analytics funnel</td></tr>
    <tr><td>Why do people abandon onboarding step 3?</td><td>Clarity: filter step 3 + signals, watch replays</td></tr>
    <tr><td>Is the crash rate up after 4.2.0?</td><td>Crashlytics / Sentry</td></tr>
    <tr><td>Did variant B increase conversion?</td><td>Experimentation tool + product analytics</td></tr>
    <tr><td>Is anyone scrolling to the pricing FAQ?</td><td>Clarity scroll heatmap</td></tr>
    <tr><td>Which API call failed for this user?</td><td>Backend logs / APM (Clarity is not network-level)</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<ul>
  <li><strong>SPAs:</strong> Clarity tracks client-side route changes, but heatmaps group by URL. If your SPA keeps one URL for many states (modals, wizards), heatmaps blend them — use distinct routes or custom tags/events per step.</li>
  <li><strong>Dynamic URLs:</strong> <code>/orders/8812</code> and <code>/orders/8813</code> are different pages for heatmaps. Use Clarity's URL grouping/wildcard features where available, or filter by tag.</li>
  <li><strong>Assets behind auth / CSP:</strong> the web player fetches your CSS/fonts at playback; if they require cookies or are blocked by CORS, replays look unstyled. Captures are fine; fix asset accessibility or accept it.</li>
  <li><strong>Canvas, video, iframes:</strong> canvas drawings and cross-origin iframe contents are generally not captured as-is (the iframe needs its own Clarity tag). Map-heavy or game-like UIs replay poorly.</li>
  <li><strong>Shadow DOM / web components:</strong> capture support has improved over time — check current docs if your design system uses shadow roots.</li>
  <li><strong>Content Security Policy:</strong> the tag needs script and connect permissions for Clarity's domains; a strict CSP silently blocks it (check browser console for CSP violations).</li>
  <li><strong>Ad blockers:</strong> some users block Clarity entirely — recordings are a biased sample (often skewing away from technical users).</li>
  <li><strong>RN WebViews:</strong> content inside a WebView is a separate web context; native capture may not record it (check current docs for WebView capture options), and the web tag inside it creates a separate session.</li>
  <li><strong>Mobile network/battery:</strong> uploads are batched; very short sessions or app kills can lose the last moments. Don't use Clarity as an audit log.</li>
  <li><strong>Sampling at scale:</strong> on very high-traffic properties not every session may be retained or shown — use <code>upgrade</code> (web) / custom events to prioritise sessions you care about. Check current docs for limits.</li>
  <li><strong>Multiple environments:</strong> one project per environment (dev/staging/prod) or dev traffic pollutes heatmaps and signals.</li>
  <li><strong>Kiosk / shared devices:</strong> many people share one session context. Reset identity at logout (start a new custom session id) or sessions merge different users.</li>
</ul>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<table>
  <thead><tr><th>Anti-pattern</th><th>Why it hurts</th><th>Do instead</th></tr></thead>
  <tbody>
    <tr><td>Passing email/phone to <code>identify</code> / <code>setCustomUserId</code></td><td>PII in a third-party system; may violate your privacy policy even if hashed</td><td>Opaque internal user id</td></tr>
    <tr><td>Relaxed masking "so we can read the screens"</td><td>Records names, addresses, messages</td><td>Strict/balanced + targeted unmask on static labels</td></tr>
    <tr><td>Loading before consent in regions that need it</td><td>Regulatory exposure; Clarity may limit functionality anyway</td><td>Gate init on CMP or use the consent API</td></tr>
    <tr><td>Recording payment, ID-capture or health screens</td><td>Highest-risk data in the least-needed recordings</td><td>Don't load on those routes / <code>pause()</code> on those screens</td></tr>
    <tr><td>No screen names in RN</td><td>Every screen = one activity; heatmaps meaningless</td><td>Set screen name on navigation state change</td></tr>
    <tr><td>Watching random replays</td><td>Hours lost, anecdote-driven decisions</td><td>Start from a funnel drop or a signal filter; watch 10–20 targeted sessions; write down patterns</td></tr>
    <tr><td>Treating Clarity counts as business metrics</td><td>Consent, ad blockers, sampling make them incomplete</td><td>Business KPIs from product analytics / backend</td></tr>
    <tr><td>Initialising in <code>__DEV__</code> / staging with the prod project id</td><td>Polluted heatmaps and signals</td><td>Per-environment project ids, skip in dev</td></tr>
    <tr><td>Calling Clarity during SSR</td><td><code>window is not defined</code> crashes, hydration noise</td><td>Client-only init guarded by <code>typeof window</code></td></tr>
    <tr><td>Different user ids across tools</td><td>Can't pivot from a funnel segment to replays</td><td>One identity, set in all tools at the same moment</td></tr>
    <tr><td>Tag explosion (free-text values, ids as tag values)</td><td>Unfilterable noise</td><td>Small controlled vocabulary, like an event taxonomy</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. What is session analytics, and how is it different from event analytics?</div>
  <div class="qa-answer">
    <p>Event analytics records named events you instrument (<code>checkout_started</code>) and aggregates them into funnels, retention and cohorts — the quantitative "what" and "how many". Session analytics records the user's actual interaction with the UI (replays, heatmaps, frustration signals) — the qualitative "why". You use event analytics to find where users drop and session analytics to understand the cause.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. What are rage clicks and dead clicks, and what do they usually indicate?</div>
  <div class="qa-answer">
    <p>A rage click is several rapid clicks in the same spot — the user expected something and it didn't happen fast enough (slow handler, disabled-looking-enabled button, broken element). A dead click is a click that produces no visible change — usually something that looks interactive but isn't (a label, an image, a card), or a handler that silently failed. Both are leading indicators of UX bugs and often of JavaScript errors.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. How does Clarity record a web session without recording video?</div>
  <div class="qa-answer">
    <p>It snapshots the DOM, then streams DOM mutations (via MutationObserver) and input events (pointer, scroll, resize). The player rebuilds the page from those, re-fetching your static assets. Masking is applied in the browser before data leaves, so masked text never reaches Clarity. The side effect is that replays can look broken if your CSS/fonts aren't reachable at playback time.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. How do you keep PII out of recordings?</div>
  <div class="qa-answer">
    <p>Layers: choose a strict or balanced masking mode; mask specific elements (<code>data-clarity-mask</code> on web; mask APIs on mobile); unmask only static, non-sensitive labels; don't load or pause on sensitive screens; keep PII out of URLs and out of custom tags/ids (use opaque ids); limit who can view the project; and confirm against your privacy policy and DPA. Then audit by actually watching recordings of sensitive-adjacent flows.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. How do you integrate Clarity into a React Native app, and what's different from web?</div>
  <div class="qa-answer">
    <p>Install <code>@microsoft/react-native-clarity</code> (native code — bare RN or an Expo dev build, not Expo Go), call <code>initialize(projectId, config)</code> after consent, and set metadata: custom user id on login, tags for plan/variant, custom events for key moments. Differences from web: there's no DOM — capture comes from the native SDKs; screen names must be set from your navigator because RN typically runs in one Activity/ViewController; masking is via project mode plus native mask APIs; and you should <code>pause</code> on sensitive screens.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How would you combine Clarity with GA4 or Mixpanel?</div>
  <div class="qa-answer">
    <p>Use the same opaque user id and the same vocabulary for tags/events in both. Find the problem in the funnel tool (step 3 drop on Android), pivot to Clarity filtered by the same screen, platform and tags, watch targeted sessions, form a hypothesis, ship a fix, and measure back in the funnel. For GA4 there's a built-in Clarity integration that links GA data to Clarity recordings. You can also attach the Clarity session URL to support tickets or error reports.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How do you handle consent?</div>
  <div class="qa-answer">
    <p>Either don't load Clarity until the consent platform reports analytics consent (strictest, simplest), or load it in its consent-pending mode and call the consent API when the user agrees. For EEA/UK/CH traffic Microsoft requires a consent signal for full functionality — check current docs for the exact API and dates. Revocation must stop recording too, so wire the "withdraw" path, not only the "accept" path.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Your heatmap for /orders/:id looks empty. Why?</div>
  <div class="qa-answer">
    <p>Each order id is a distinct URL, so data is spread thinly across thousands of pages. Group URLs (Clarity's URL grouping/wildcards where available), or add a tag like <code>page_type=order_detail</code> and analyse by that. The same issue appears in SPAs that change state without changing URL — the opposite problem, where unrelated states merge.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. When would you NOT use Clarity?</div>
  <div class="qa-answer">
    <p>When the data is too sensitive to record at all (health, banking screens) and you can't mask reliably; when you need deep dev debugging (network payloads, Redux state — a LogRocket-class tool fits better); when you need warehouse export and data ownership; or when policy forbids sending behavioural data to a third party. Also for anything you'd report as a business metric.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. FDE scenario: a customer says "users complain the booking form is broken, but your logs show no errors". What do you do?</div>
  <div class="qa-answer">
    <p>No server errors suggests a client-side or UX problem. With the customer's agreement, filter Clarity sessions on the form's URL with dead/rage clicks or quick-backs, segmented by browser/device. Watch 10–20. Typical finds: a third-party script on their site overlaying the submit button, a CSP blocking our widget's script, validation errors rendered off-screen on mobile, or an autofill quirk. Reproduce locally with the same browser, fix, and verify with the signal rate and form-completion events — then share the before/after with the customer.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. How do you avoid wasting hours watching replays?</div>
  <div class="qa-answer">
    <p>Always start from a question and a filter: a funnel step, a page, a signal, a tag. Watch a fixed sample (10–20), note patterns in a shared doc with timestamps and links, stop when patterns repeat. Use heatmaps to see aggregate behaviour first, replays to explain it. Where available, AI session summaries can triage — but verify by watching.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Besides rage and dead clicks, what are quick-backs and excessive scrolling, and how do you use these signals?</div>
  <div class="qa-answer">
    <p>Clarity's insights auto-detect four frustration signals: <strong>rage clicks</strong> (rapid repeated clicks in one spot), <strong>dead clicks</strong> (a click with no response), <strong>excessive scrolling</strong>, and <strong>quick-backs</strong>, where a user lands on a page or screen and almost immediately navigates back, a sign the destination wasn't what they expected or didn't load usefully. On mobile, JavaScript errors and crashes are surfaced alongside them. Treat them as filters, not conclusions: for a reported problem, filter sessions on the affected URL or screen by dead/rage clicks or quick-backs, segment by browser or device, and watch 10 to 20 recordings to form a hypothesis.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q13. How do you add Clarity to a Next.js app so it is consent-gated and SSR-safe?</div>
  <div class="qa-answer">
    <p>Load it only in the browser, never during server rendering, or you get <code>window is not defined</code> crashes and hydration noise. In the App Router, put a <code>'use client'</code> provider component in the root layout that calls <code>Clarity.init(process.env.NEXT_PUBLIC_CLARITY_ID)</code> inside a <code>useEffect</code> that returns early unless <code>consent.analytics</code> is true, and skips sensitive routes such as billing or API-key settings. A second effect, once there is both consent and a session, calls <code>Clarity.identify(session.userId)</code> with an opaque id only and <code>setTag</code> for things like tenant and role. Keep the init helper idempotent and guarded by <code>typeof window === 'undefined'</code>, set the project to Strict masking, and wire the consent-withdraw path to stop recording too.</p>
  </div>
</div>
` },

  ]
});
