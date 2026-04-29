window.PREP_SITE.registerTopic({
  id: 'mprod-ab',
  module: 'mobile-prod',
  title: 'A/B Testing',
  estimatedReadTime: '40 min',
  tags: ['ab-testing', 'experimentation', 'feature-flags', 'firebase', 'optimizely', 'launchdarkly', 'statsig', 'growthbook', 'guardrails', 'cuped'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>A/B testing</strong> (online controlled experiments) is the discipline of randomly assigning users to a Control or Treatment variant, measuring a primary metric, and using statistics to decide whether the difference is real. On mobile, it's how you de-risk product launches: instead of "we think this onboarding is better," you ship the new flow to 50% and measure.</p>
<ul>
  <li><strong>Two pieces:</strong> a <strong>feature flag</strong> system that decides at runtime which variant a user sees, and an <strong>experimentation platform</strong> that assigns users to variants and analyzes the metric difference.</li>
  <li><strong>Default tools:</strong> <strong>Statsig</strong>, <strong>LaunchDarkly</strong>, <strong>Optimizely</strong>, <strong>Firebase Remote Config + A/B Testing</strong>, <strong>GrowthBook</strong> (open source), or in-house on top of your warehouse.</li>
  <li><strong>The metric matters more than the variant.</strong> Pick a primary metric tied to a real business outcome, not "% who tapped the new button."</li>
  <li><strong>Guardrails are mandatory.</strong> Crash rate, session length, revenue, ANR rate — any treatment must not regress them.</li>
  <li><strong>Sample size first, ship later.</strong> Compute MDE (minimum detectable effect) → sample size → expected duration. Don't peek early.</li>
  <li><strong>Mobile-specific tax:</strong> assignments must persist across launches, survive offline, and respect ATT/GDPR. Server-side assignment + client cache is the default.</li>
  <li><strong>Common failures:</strong> SRM (sample ratio mismatch), instrumentation skew, peeking, novelty effects, multiple comparisons, segment chasing.</li>
</ul>
<p><strong>Mantra:</strong> "Pick the right metric, power the test, randomize cleanly, don't peek, ship the winner."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What is an A/B test?</h3>
<p>You take a random subset of users, give them a different version of the product, and compare a measurable outcome to the rest. If "Treatment" produces 5% more purchases than "Control" with statistical significance, you ship Treatment.</p>

<p>The technical setup involves:</p>
<ol>
  <li><strong>Random assignment.</strong> Each user lands deterministically in one bucket using a hash of <code>(user_id, experiment_key)</code>. Same user, same variant, every session.</li>
  <li><strong>Variant delivery.</strong> A feature flag system reads the assignment and exposes the variant to the code: "show Variant B copy."</li>
  <li><strong>Exposure logging.</strong> The first time a user actually <em>sees</em> the experiment, log an "exposure" event tying user_id → variant.</li>
  <li><strong>Metric collection.</strong> Standard analytics events — purchases, signups, screen views — feed into the experiment platform.</li>
  <li><strong>Analysis.</strong> Compute effect size, confidence interval, p-value. Decide.</li>
</ol>

<h3>Why mobile complicates everything</h3>
<table>
  <thead><tr><th>Problem</th><th>Mobile reality</th></tr></thead>
  <tbody>
    <tr><td>App update lag</td><td>Users on 1.4.0 can't get the new flag if the code wasn't shipped — your test runs only on a subset.</td></tr>
    <tr><td>Cold caches</td><td>First launch may not have the flag yet; show fallback (usually Control).</td></tr>
    <tr><td>Offline</td><td>Cached assignment must persist; new users on a flaky network may get stuck on Control.</td></tr>
    <tr><td>Privacy</td><td>iOS ATT may block IDFA, but doesn't block your own user_id randomization.</td></tr>
    <tr><td>Release gates</td><td>App Store review takes 1–7 days; you need the flag deployed before review.</td></tr>
    <tr><td>OTA</td><td>If you push JS via CodePush/EAS Update, the variant may change beneath the user mid-session.</td></tr>
  </tbody>
</table>

<h3>Why a/b test instead of just shipping</h3>
<ol>
  <li><strong>Most product changes have zero or negative effect.</strong> Industry data: ~70% of features tested at Microsoft, Booking, Airbnb show no improvement or regression. Without testing, you ship the regression.</li>
  <li><strong>Rollback safety.</strong> Bad change in 1% of users? Flip the flag. No app update needed.</li>
  <li><strong>Quantified decisions.</strong> "Onboarding redesign" goes from religious debate to "+2.1% D7 retention, p=0.003."</li>
  <li><strong>Compounding learning.</strong> Even null results teach the team what doesn't work.</li>
</ol>

<h3>Feature flags vs experiments</h3>
<table>
  <thead><tr><th>Term</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td>Feature flag</td><td>Toggle a feature on/off without redeploy. Used for kill switches, gradual rollouts, region gating.</td></tr>
    <tr><td>Experiment</td><td>Random assignment + measurement. Backed by a feature flag, but with cohort tracking + analysis.</td></tr>
    <tr><td>Rollout</td><td>A flag that ramps from 0% → 100% over time, often paired with health monitoring.</td></tr>
  </tbody>
</table>
<p>Most platforms (Statsig, LaunchDarkly, GrowthBook) unify the three.</p>

<h3>What "good" looks like</h3>
<ul>
  <li>Every meaningful product change goes through an experiment template.</li>
  <li>Sample size, MDE, primary metric, guardrails, expected duration are written <em>before</em> shipping.</li>
  <li>SRM check runs daily; experiments with skew &gt; 1% are flagged.</li>
  <li>The team has a "decision rule" doc: "ship if primary +X% with p&lt;0.05 AND no guardrail regresses by Y%."</li>
  <li>Experiments have an <strong>owner</strong> and a <strong>death date</strong> — flags don't live forever.</li>
  <li>Post-experiment, the flag is removed from code within 30 days.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The lifecycle of an experiment</h3>
<pre><code class="language-text">1. Hypothesis     → "If we change X, then Y will improve because Z."
2. Plan           → Primary metric, secondary metrics, guardrails, MDE, sample size, duration.
3. Build          → Implement Variant B behind a flag. Default = Control.
4. QA             → Force-set yourself to each variant; verify both render and instrument correctly.
5. Ramp           → 1% → 10% → 50% over a few days, watching guardrails.
6. Observe        → Wait for sample size. Don't peek.
7. Analyze        → Effect, CI, p-value, segment splits, guardrails.
8. Decide         → Ship 100%, kill, iterate, or extend.
9. Cleanup        → Remove flag from code. Document learning.
</code></pre>

<h3>Statistics — the parts you must know</h3>
<table>
  <thead><tr><th>Term</th><th>Plain English</th></tr></thead>
  <tbody>
    <tr><td><strong>Primary metric</strong></td><td>The single number you'd ship on. Often revenue, retention, or activation.</td></tr>
    <tr><td><strong>Effect size</strong></td><td>The difference between Treatment and Control (e.g., +3.2% relative lift).</td></tr>
    <tr><td><strong>p-value</strong></td><td>Probability of observing this effect by chance if the variants were identical. Convention: p &lt; 0.05.</td></tr>
    <tr><td><strong>Confidence interval (CI)</strong></td><td>The range the true effect likely falls in (95% CI is the default).</td></tr>
    <tr><td><strong>Power (1 - β)</strong></td><td>Probability of detecting an effect if there is one. Convention: 80% (β = 0.20).</td></tr>
    <tr><td><strong>α</strong></td><td>False-positive rate. Convention: 0.05.</td></tr>
    <tr><td><strong>MDE</strong></td><td>Minimum detectable effect — the smallest lift you can statistically distinguish from noise given your sample.</td></tr>
    <tr><td><strong>Sample size</strong></td><td>Users per arm needed to detect MDE at α/β. Doubles per halving of MDE.</td></tr>
  </tbody>
</table>

<h3>The "intent-to-treat" rule</h3>
<p>Once a user is assigned to a variant, they stay in that variant for analysis purposes <em>even if they never actually saw the change</em>. This protects you from selection bias: if you only count "saw it" users, you're conditioning on engagement, which is itself an outcome.</p>

<h3>The "exposure" event vs the "assignment" event</h3>
<table>
  <thead><tr><th>Event</th><th>When fires</th></tr></thead>
  <tbody>
    <tr><td>Assignment</td><td>The instant user_id is hashed into a bucket — even before they see anything.</td></tr>
    <tr><td>Exposure</td><td>The first time the variant is actually rendered to the user.</td></tr>
  </tbody>
</table>
<p>Best practice: log <strong>exposure</strong>, then analyze on <strong>intent-to-treat</strong> using all assigned users. Some teams analyze "exposed-only" — that's fine for proxy metrics but biases revenue/retention.</p>

<h3>Guardrails</h3>
<p>Tests are about lifting one metric. But other metrics matter too — you can't ship a "+5% conversions" change that also "+10% crash rate." Guardrails define hard floors:</p>
<ul>
  <li>Crash-free rate: must not drop &gt; 0.1pp.</li>
  <li>App-launch latency: must not regress &gt; 50ms p95.</li>
  <li>Revenue: must not drop &gt; 1%.</li>
  <li>Notification opt-out rate: must not increase.</li>
</ul>
<p>Most platforms compute these continuously; experiments auto-pause if a guardrail breaches.</p>

<h3>Random assignment — the math</h3>
<pre><code class="language-text">bucket = hash(user_id || device_id, experiment_key) mod 100
if bucket &lt; 50: variant = "control"
else: variant = "treatment"
</code></pre>
<p>Properties:</p>
<ul>
  <li><strong>Deterministic.</strong> Same user always lands in same bucket — no flips between sessions.</li>
  <li><strong>Independent across experiments.</strong> The hash is keyed by experiment, so a user's bucket in Test A is independent of their bucket in Test B.</li>
  <li><strong>Stratified, optionally.</strong> Hash within strata (e.g., new vs returning users) to ensure balanced sampling.</li>
</ul>

<h3>SRM (sample ratio mismatch) — the canary</h3>
<p>If you set 50/50 and the actual ratio is 52/48, something is broken in your randomization or instrumentation. Run a chi-squared test daily; flag any experiment with p &lt; 0.001 on the ratio. Cause is almost always:</p>
<ul>
  <li>Bot / QA traffic only hits one variant.</li>
  <li>Variant has a crash on cold start → users churn out.</li>
  <li>Filtering rule applied to one variant (e.g., "must have an account").</li>
  <li>Old app version doesn't have the new variant code → all in Control.</li>
</ul>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Statsig — the modern default</h3>
<pre><code class="language-bash">yarn add statsig-react-native
cd ios &amp;&amp; pod install
</code></pre>
<pre><code class="language-tsx">// App.tsx
import { StatsigProvider, useExperiment, useGate } from 'statsig-react-native';

&lt;StatsigProvider
  sdkKey={process.env.STATSIG_KEY!}
  user={{ userID: user?.id, customIDs: { deviceID } }}
  options={{ environment: { tier: __DEV__ ? 'staging' : 'production' } }}
&gt;
  &lt;App /&gt;
&lt;/StatsigProvider&gt;

// In a component:
function CheckoutButton() {
  const { config } = useExperiment('new_checkout_copy');
  const cta = config.get('cta', 'Buy now');
  return &lt;Button title={cta} onPress={...} /&gt;;
}
</code></pre>

<h3>Firebase Remote Config + A/B</h3>
<pre><code class="language-tsx">import remoteConfig from '@react-native-firebase/remote-config';

await remoteConfig().setDefaults({
  cta_copy: 'Buy now',
  show_recommendations: false,
});

await remoteConfig().fetchAndActivate();

const cta = remoteConfig().getValue('cta_copy').asString();
const showRec = remoteConfig().getValue('show_recommendations').asBoolean();
</code></pre>
<p>Firebase A/B tests are configured in the console: pick a remote config key, set variants, target audience, primary metric (linked GA4 conversion). Free tier is generous; analysis is decent but less flexible than Statsig.</p>

<h3>LaunchDarkly — flags-first, experiments add-on</h3>
<pre><code class="language-tsx">import { LDClient, LDProvider } from 'launchdarkly-react-native-client-sdk';

&lt;LDProvider config={{ mobileKey: process.env.LD_KEY }} user={{ key: user.id }}&gt;
  &lt;App /&gt;
&lt;/LDProvider&gt;

// In a component:
const newFlow = useBoolVariation('new-onboarding-flow', false);
</code></pre>

<h3>GrowthBook — open source, warehouse-native</h3>
<pre><code class="language-tsx">import { GrowthBook, GrowthBookProvider, useFeatureValue } from '@growthbook/growthbook-react';

const gb = new GrowthBook({
  apiHost: 'https://your-growthbook-api.com',
  clientKey: process.env.GROWTHBOOK_KEY,
  enableDevMode: __DEV__,
  attributes: { id: user.id, country, deviceType },
  trackingCallback: (experiment, result) =&gt; {
    logEvent('experiment_viewed', {
      experiment_id: experiment.key,
      variant: result.variationId,
    });
  },
});

await gb.loadFeatures();

&lt;GrowthBookProvider growthbook={gb}&gt;...&lt;/GrowthBookProvider&gt;

const cta = useFeatureValue('cta_copy', 'Buy now');
</code></pre>

<h3>Server-side assignment vs client-side</h3>
<table>
  <thead><tr><th>Mode</th><th>Pros</th><th>Cons</th></tr></thead>
  <tbody>
    <tr><td>Server-side</td><td>Single source of truth; can't be tampered with; supports cross-platform consistency</td><td>Adds a network call before render; cache to disk on first response</td></tr>
    <tr><td>Client-side</td><td>Fast (no extra request); offline-friendly</td><td>Old SDK versions / clock skew can drift assignment; security-sensitive flags shouldn't be client-only</td></tr>
  </tbody>
</table>
<p>Default: server-side, with a local cache that warms on app start. SDKs all do this for you.</p>

<h3>Exposure tracking</h3>
<pre><code class="language-tsx">// Statsig logs exposure automatically the first time you call useExperiment.
// Custom: log only when the variant is actually visible
useEffect(() =&gt; {
  if (isVisible) {
    Statsig.logEvent('experiment_exposed', null, {
      experiment: 'new_checkout_copy',
      variant,
    });
  }
}, [isVisible]);
</code></pre>

<h3>Computing sample size</h3>
<pre><code class="language-text">For a binary metric (e.g., conversion rate):
  n_per_arm ≈ 16 × p × (1 - p) / MDE²

For p = 0.05 (5% conversion), MDE = 0.5% absolute:
  n ≈ 16 × 0.05 × 0.95 / 0.005² ≈ 30,400 per arm = 60,800 total

If your DAU is 10k, that's ~6 days at 100% allocation, ~30 days at 20%.
</code></pre>
<p>For revenue or continuous metrics: use a power calculator (Statsig, Optimizely, Evan Miller's online tool) — simple closed-form requires the metric's standard deviation.</p>

<h3>Variance reduction (CUPED)</h3>
<p>CUPED uses pre-experiment data per user to subtract their "baseline" from the post-experiment metric. Result: 30–50% smaller variance, which means 30–50% smaller required sample size. Statsig and Eppo support it natively. Worth turning on for any experiment with a noisy metric.</p>

<h3>Multiple comparisons</h3>
<p>If you're testing 5 variants vs Control on 1 metric, your false-positive rate jumps from 5% to ~23%. Either:</p>
<ul>
  <li><strong>Bonferroni correction:</strong> divide α by the number of comparisons. Conservative.</li>
  <li><strong>Sequential testing</strong> (e.g., Statsig's CUPED+sequential): valid p-values even when peeking.</li>
  <li><strong>Pre-register</strong> a single primary metric and ignore the rest for the ship decision.</li>
</ul>

<h3>Mobile rollout pattern</h3>
<pre><code class="language-text">Day 0: ship code with flag default = control.
Day 1: 1% allocation. Watch for SRM, crashes, ANR.
Day 3: 10% allocation. Watch for guardrails.
Day 7: 50% allocation. Begin counting toward sample size.
Day 14+: ramp to 100% if winning, kill if not.
</code></pre>
<p>Always wait until at least one full weekly cycle before reading the result; weekday/weekend behavior differs.</p>

<h3>Deep-link the QA into a variant</h3>
<pre><code class="language-tsx">// Internal QA needs to test variant B without waiting for assignment
import { Linking } from 'react-native';

Linking.addEventListener('url', ({ url }) =&gt; {
  const params = new URL(url).searchParams;
  const force = params.get('force_variant');
  if (force === 'B') {
    Statsig.overrideExperiment('new_checkout_copy', 'B');
  }
});
</code></pre>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: New onboarding flow — full plan</h3>
<pre><code class="language-text">Hypothesis:
  Adding a 3-screen value-prop tour before signup will increase
  D7 activation by lifting users' commitment.

Primary metric:
  D7 activation = % of new installs who complete the
  "first key action" within 7 days.

Secondary metrics:
  - Signup completion rate
  - Time to first action
  - 30-day retention

Guardrails:
  - Crash-free user rate &gt; 99.5%
  - App size growth &lt; 1MB
  - App launch latency p95 &lt; 1.6s

MDE: +1.5pp absolute (current 38% → target ≥ 39.5%)
Sample size: ~22,000 per arm (computed via Statsig's calculator)
Duration: ~10 days at 50/50 allocation
</code></pre>

<h3>Example 2: Wiring the flag</h3>
<pre><code class="language-tsx">function OnboardingRoot() {
  const { config } = useExperiment('onboarding_v2');
  const showTour = config.get('show_tour', false);
  if (showTour) return &lt;OnboardingV2 /&gt;;
  return &lt;OnboardingV1 /&gt;;
}
</code></pre>

<h3>Example 3: Reading the result</h3>
<pre><code class="language-text">Day 12 readout:
  Control:    n = 22,840   D7 activation = 38.2%   (95% CI 37.5–38.9)
  Treatment:  n = 22,914   D7 activation = 39.8%   (95% CI 39.1–40.5)
  Lift:       +1.6pp       p = 0.014
  Guardrails: all green

Decision: ship Treatment to 100%. Cleanup ticket created
to remove the flag.
</code></pre>

<h3>Example 4: An SRM spike investigation</h3>
<pre><code class="language-text">Day 3 of test:
  Allocation set to 50/50.
  Actual: control 51.8%, treatment 48.2%, n = 12,000.
  Chi-square p &lt; 0.001 → SRM detected.

Investigation:
  - Treatment had a crash on cold start in iOS 14 (skipped check
    for older OS in the new component).
  - Crashed users churned before exposure event fired.
  - Net effect: ~3% of treatment users dropped out before
    bucketing was logged.

Fix: deploy crash patch; reset experiment; re-run.
</code></pre>

<h3>Example 5: Multiple-variant test</h3>
<pre><code class="language-tsx">// Three CTA variants — uses a multi-arm test
const { variant } = useExperiment('cta_copy_test');
const cta = ({
  control: 'Sign up',
  variant_b: 'Get started',
  variant_c: 'Try it free',
} as const)[variant] ?? 'Sign up';
</code></pre>
<p>Statistical caveat: with 3 arms vs 1 control, you have 3 comparisons → adjust α or use sequential testing.</p>

<h3>Example 6: Holdout group</h3>
<pre><code class="language-text">Setup: every "shipped" experiment now ships to 95% of users;
       a 5% global holdout never sees any new feature.

Why: measures cumulative effect of the team's quarterly work.
     If the holdout retains better, your features are net-negative.

Lifetime: 1 quarter; rotate users in/out to avoid permanent fatigue.
</code></pre>

<h3>Example 7: Server-side authoritative metric</h3>
<pre><code class="language-tsx">// Frontend "purchase_completed" can fire twice on retry → false positives.
// Use server-side IAP webhook as ground truth.

// Backend pseudocode
function onAppleReceiptValidated(userId, receipt) {
  experimentationClient.logEvent({
    user_id: userId,
    name: 'purchase_completed',
    revenue: receipt.amount,
    currency: receipt.currency,
  });
}
</code></pre>

<h3>Example 8: Force-set for QA</h3>
<pre><code class="language-tsx">// In your dev panel
&lt;Picker
  selectedValue={currentVariant}
  onValueChange={(v) =&gt; Statsig.overrideExperiment('onboarding_v2', v)}
&gt;
  &lt;Picker.Item label="Control" value="control" /&gt;
  &lt;Picker.Item label="V2" value="treatment" /&gt;
&lt;/Picker&gt;
</code></pre>

<h3>Example 9: Reading guardrails</h3>
<pre><code class="language-text">Experiment: button_color_test
  Primary: conversion +2.1%, p=0.03  ✅
  Guardrails:
    Crash-free user rate:  99.7% (control) → 99.4% (treatment)  ❌ regression
    Decision: do NOT ship despite primary positive.
    Investigate crashes in treatment first.
</code></pre>

<h3>Example 10: Post-test cleanup</h3>
<pre><code class="language-tsx">// Original
function OnboardingRoot() {
  const { config } = useExperiment('onboarding_v2');
  return config.get('show_tour', false) ? &lt;OnboardingV2 /&gt; : &lt;OnboardingV1 /&gt;;
}

// After ship
function OnboardingRoot() {
  return &lt;OnboardingV2 /&gt;;
}

// Then delete OnboardingV1.tsx, the experiment config from Statsig,
// and the test analysis dashboard. Document the result in the team wiki.
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Novelty effect</h3>
<p>Users react to <em>change</em>, not to the change's quality. A new button color may "win" for the first 3 days, then revert. Mitigation: run experiments at least 7 days, ideally 14, to span the novelty fade.</p>

<h3>Primacy / habit effect</h3>
<p>Inverse of novelty: existing users hate the change because it disrupts habits. Run long enough that habits adjust.</p>

<h3>Network effects / interference</h3>
<p>If users in different variants interact (chat, marketplace, social feed), the assumption of independence breaks. Variant A users sending messages to Variant B users contaminates both. Mitigation: cluster-based randomization (assign whole communities to one variant) or geo-based (Tokyo vs Osaka).</p>

<h3>Cohort drift across releases</h3>
<p>Users on 1.4.0 vs 1.5.0 are different populations. If your experiment is in 1.5.0 only, you're testing on the early-adopter slice — not generalizable. Mitigation: only conclude when 1.5.0 has &gt;50% adoption.</p>

<h3>Hidden segmentation</h3>
<p>Aggregate result null, but iOS shows +5% and Android shows -5% (Simpson's paradox). Always inspect per-platform, per-region splits — but pre-register them; chasing post-hoc segments is p-hacking.</p>

<h3>Allocation switching mid-flight</h3>
<p>"Let's expand from 10% to 50% to speed it up." Anyone exposed at 10% and reassigned at 50% may switch variants — most platforms detect this and pin existing users. Verify yours does.</p>

<h3>Crash in one variant skews everything</h3>
<p>If Treatment crashes on cold start, only resilient users stay → Treatment user pool is biased upward. Always check guardrails before reading the primary.</p>

<h3>Cookie/identity reset</h3>
<p>iOS users reinstalling get a new device_id. They may flip variants on reinstall. If you have a logged-in user_id, prefer it for assignment to maintain consistency across reinstalls.</p>

<h3>Pre-experiment regression</h3>
<p>Your experiment goes live the same day as a marketing campaign or major release. Confounder. Run a "pre-test A/A" — split the same population into two control groups and verify no significant difference.</p>

<h3>Stopping early — don't peek</h3>
<p>Looking at p-value daily and stopping when p &lt; 0.05 inflates false-positive rate to ~30%. Either:</p>
<ul>
  <li>Pre-register a duration / sample size and don't look until then.</li>
  <li>Use sequential testing (Statsig, Eppo support it).</li>
</ul>

<h3>Underpowered experiments</h3>
<p>You ran 3 days, got n=500 per arm, claimed "no effect." But your MDE was 20% — far above any realistic effect. Always state the MDE you can detect, not just the p-value.</p>

<h3>Holdout overlap</h3>
<p>Running 5 experiments simultaneously in the same population: a user may be in Control of A, Treatment of B, and so on. This is fine — orthogonal experiments add noise but don't bias — <em>unless</em> they interact. If A interacts with B, plan a factorial design or stagger them.</p>

<h3>App version skew</h3>
<p>Your test launches on 1.5.0; users on 1.4.0 silently fall through to Control because they don't have the variant code. Either:</p>
<ul>
  <li>Restrict the experiment audience to 1.5.0+ users.</li>
  <li>Treat 1.4.0 users as ineligible (don't count them in either arm).</li>
</ul>

<h3>OTA mid-experiment</h3>
<p>If you push a JS update via CodePush during the experiment, the variant code may change. Either pause the experiment, version-pin the variant, or accept the noise.</p>

<h3>iOS App Store review delay</h3>
<p>You ship the experiment code in 1.5.0, but Apple takes 5 days to review. By the time it's available, your test plan is stale. Bake the buffer into the timeline.</p>

<h3>p-hacking via segments</h3>
<p>Null overall result, but "+8% for users in Texas, age 25–34, on Android." Tempting to ship for that segment. Reality: with 100 segments tested, ~5 will reach p&lt;0.05 by chance. Pre-register segments or treat post-hoc finds as hypotheses for a follow-up test.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: Assignment based on a field that changes</h3>
<pre><code class="language-tsx">// BAD — using anonymous_id which can change on reinstall
StatsigProvider user={{ userID: anonId }}

// GOOD — stable user_id post-login, device_id pre-login, alias on signup
</code></pre>

<h3>Bug 2: Logging the variant before exposure</h3>
<pre><code class="language-tsx">// BAD — logs every render, including hidden ones
useEffect(() =&gt; {
  Statsig.logEvent('exposure', null, { variant });
}, []);

// GOOD — only when actually visible
useEffect(() =&gt; {
  if (isVisible) Statsig.logEvent('exposure', null, { variant });
}, [isVisible]);
</code></pre>

<h3>Bug 3: Force-set in production</h3>
<pre><code class="language-tsx">// BAD
Statsig.overrideExperiment('new_flow', 'treatment');   // shipped to prod

// GOOD
if (__DEV__) Statsig.overrideExperiment('new_flow', 'treatment');
</code></pre>

<h3>Bug 4: Computing the metric in two places</h3>
<pre><code class="language-text">Frontend: counts purchase_completed events
Backend: counts subscription.active rows

→ Two definitions, two answers. PMs argue.
→ Pick ONE source of truth (usually backend / warehouse).
</code></pre>

<h3>Bug 5: Treatment-specific instrumentation</h3>
<pre><code class="language-tsx">// BAD — only Treatment fires the event, Control doesn't
&lt;NewCheckoutButton onPress={() =&gt; { logEvent('checkout_tapped'); }} /&gt;
// vs
&lt;OldCheckoutButton onPress={() =&gt; {}} /&gt;
// → Funnel comparison broken; both arms must instrument identically.

// GOOD — both arms log the same event with a 'variant' property
</code></pre>

<h3>Bug 6: Peeking and stopping early</h3>
<pre><code class="language-text">Day 3: p = 0.04 → "Ship!"
But α-spending on daily peeks inflates false positive to ~30%.
Don't conclude until pre-registered duration OR use sequential testing.
</code></pre>

<h3>Bug 7: Forgetting the holdout flag</h3>
<p>You declared a 5% global holdout. After 6 months, three engineers have implemented "if treatment, do X" without checking the holdout. Holdout users now get half the new features. Run a quarterly audit; verify holdout users don't see any post-launch feature.</p>

<h3>Bug 8: Default = treatment in code</h3>
<pre><code class="language-tsx">// BAD — if SDK fails to fetch, ALL users get treatment
const showTour = config.get('show_tour', true);   // default true

// GOOD — default to safer, well-known control
const showTour = config.get('show_tour', false);
</code></pre>

<h3>Bug 9: Long-lived flags become tech debt</h3>
<p>Flags from 2 years ago, no owner, code paths still branching. Each flag is a runtime branch you keep paying for. Remove flags within 30 days of decision. Auto-flag stale ones in CI.</p>

<h3>Bug 10: Different populations per variant</h3>
<pre><code class="language-text">Treatment requires iOS 16+; Control runs everywhere.
You're not comparing apples to apples — you've selected for newer hardware.

FIX: target both arms to the same eligibility (iOS 16+ users only).
</code></pre>

<h3>Anti-pattern 1: HiPPO ("highest paid person's opinion")</h3>
<p>Skipping the test because "the CEO loves V2." If V2 is right, the test will confirm it. If wrong, you avoid a costly mistake. Test anyway.</p>

<h3>Anti-pattern 2: testing changes too small to matter</h3>
<p>Button color from #4a4 to #5b5 is unlikely to move retention 1pp. Save tests for changes that the team has a real hypothesis about; don't burn statistical budget on noise.</p>

<h3>Anti-pattern 3: ignoring guardrails when primary wins</h3>
<p>"+3% conversions, who cares if crashes also went up." Customers care. Future revenue depends on retention. Don't ship into regressed guardrails.</p>

<h3>Anti-pattern 4: testing UX and copy at the same time</h3>
<p>Treatment changes both the layout and the words. You don't know which mattered. Either decompose into two tests or accept the answer is "the package."</p>

<h3>Anti-pattern 5: forever-experiments</h3>
<p>Test "running" for 9 months without a decision. By month 9, the population has churned, the platform has changed, and the result is meaningless. Set a hard end date.</p>

<h3>Anti-pattern 6: ignoring weekday cycles</h3>
<p>Running a 4-day test that covers Tue–Fri. Weekend behavior differs. Conclusion biased. Run at least 7 days.</p>

<h3>Anti-pattern 7: no rollback plan</h3>
<p>"We pushed treatment to 100% directly." A bug surfaces. Now you need an app store update to roll back. Always ramp gradually so you can flag-flip the regression away in seconds.</p>

<h3>Anti-pattern 8: variant-specific bugs that only show up in QA on one variant</h3>
<p>"Tested control, looked fine, didn't test treatment because it was a small change." Common cause of SRM and crashes. QA every variant.</p>

<h3>Anti-pattern 9: ignoring "no effect" as a result</h3>
<p>Null results teach the team. They free engineering capacity. They prevent shipping a regression. Celebrate them, document them, move on.</p>
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
    <tr><td><em>What's an A/B test?</em></td><td>Random assignment + measurement of a primary metric to decide which variant ships.</td></tr>
    <tr><td><em>What's a feature flag?</em></td><td>Runtime toggle that turns code paths on/off without redeploy. Backbone of A/B tests.</td></tr>
    <tr><td><em>What's MDE?</em></td><td>Minimum detectable effect — smallest lift the test can distinguish from noise given sample size and power.</td></tr>
    <tr><td><em>What's a guardrail?</em></td><td>A secondary metric that must not regress; experiment auto-pauses if it does.</td></tr>
    <tr><td><em>What's SRM?</em></td><td>Sample ratio mismatch — actual variant split differs from planned. Indicates a bug in randomization or instrumentation.</td></tr>
    <tr><td><em>How do you avoid p-hacking?</em></td><td>Pre-register primary metric + segments; don't peek; use sequential testing if you must.</td></tr>
    <tr><td><em>How do you handle small samples?</em></td><td>Variance reduction (CUPED), longer duration, or larger MDE. Don't conclude on underpowered tests.</td></tr>
    <tr><td><em>What's intent-to-treat?</em></td><td>Analyze users by their assigned variant, even if they never saw it. Avoids selection bias.</td></tr>
    <tr><td><em>What's a holdout?</em></td><td>A persistent group never exposed to recent launches; measures cumulative team impact.</td></tr>
    <tr><td><em>How do you handle mobile-specific issues?</em></td><td>Server-side assignment with cache; restrict to compatible app version; ramp gradually; respect ATT.</td></tr>
    <tr><td><em>When do you NOT use A/B?</em></td><td>Tiny user base (DAU &lt; 5k); measurable change too small to detect; legal/compliance changes; brand-affecting decisions where the answer is values-driven.</td></tr>
    <tr><td><em>How do you decide on ship?</em></td><td>Primary metric reaches MDE with p &lt; 0.05 AND no guardrail regresses beyond threshold AND segment effects are sane.</td></tr>
  </tbody>
</table>

<h3>Live design prompts</h3>
<ol>
  <li><em>"Design an A/B test for a new push notification copy."</em>
    <ul>
      <li>Primary: push open rate (or D7 retention if downstream).</li>
      <li>Guardrails: notification opt-out rate (must not increase), uninstall rate.</li>
      <li>Sample size: depends on baseline open rate (~10%), MDE (e.g., +1pp).</li>
      <li>Duration: at least 1 week to span weekly notification cycle.</li>
      <li>Randomization: by user_id; same user gets same variant on every send.</li>
    </ul>
  </li>
  <li><em>"Plan a rollout of a major redesign."</em>
    <ul>
      <li>Phase 1: 1% test for 2 weeks. Detect crashes, ANRs.</li>
      <li>Phase 2: 50/50 split for 4 weeks. Measure D7, D30 retention vs current.</li>
      <li>Phase 3: ramp winner to 100% over 1 week.</li>
      <li>Holdout: keep 5% on the old design indefinitely for ground-truth comparison over 6 months.</li>
    </ul>
  </li>
  <li><em>"How would you A/B test a paywall change for a subscription app?"</em>
    <ul>
      <li>Primary: 30-day revenue per user (server-side ground truth).</li>
      <li>Guardrails: trial-to-paid conversion, churn rate, refund rate.</li>
      <li>Watch for novelty: users on Day 0 vs Day 7 react differently to price.</li>
      <li>Compute LTV — short-term lift can mask long-term churn.</li>
      <li>Region-based — pricing perception varies; segment by country.</li>
    </ul>
  </li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>"+3% lift, p=0.04 after 2 days, n=500 per arm" — underpowered, p-hacked.</li>
  <li>SRM of 53/47 with planned 50/50 — randomization broken; investigate before reading metric.</li>
  <li>Treatment-only crash → exposure under-counted on Treatment side → spurious uplift on remaining users.</li>
  <li>Variant copy testing: Control's button is grey, Treatment's is blue + new copy — confounded.</li>
  <li>Experiment running 9 months with no decision — kill it.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Statistical literacy</td><td>You name MDE, power, α, sample size, p-value with intuitive definitions.</td></tr>
    <tr><td>Mobile awareness</td><td>You volunteer release-tagging, version eligibility, ATT, server-side authoritative metrics.</td></tr>
    <tr><td>Pre-registration</td><td>You write the plan before shipping code.</td></tr>
    <tr><td>Guardrail discipline</td><td>You never read primary without guardrail check.</td></tr>
    <tr><td>Cleanup hygiene</td><td>You schedule flag removal in the same PR that ships the winner.</td></tr>
    <tr><td>Decision frameworks</td><td>You have a clear "ship if X AND Y AND Z" rule.</td></tr>
    <tr><td>Honest about limits</td><td>You acknowledge when not to A/B (small base, ethical changes, brand decisions).</td></tr>
  </tbody>
</table>

<h3>Mobile-specific deep questions</h3>
<ul>
  <li><em>"Why is sample-size estimation harder on mobile?"</em> — You can't acquire users at will; reach is bounded by store rankings, ad spend, and seasonality. DAU is also smaller than web, often by 10×.</li>
  <li><em>"How do you handle iOS App Store review delays?"</em> — Submit early; use Remote Config / feature flags so the actual variant flip can happen post-review without resubmitting.</li>
  <li><em>"When the device clock is wrong, can it bias randomization?"</em> — Randomization should depend on user_id hash, not time. If your bucket function uses Date.now(), fix it.</li>
  <li><em>"Why do you alias device_id → user_id in experiments?"</em> — So pre- and post-login behavior of the same user count under one assignment, preventing dilution.</li>
  <li><em>"How do you detect a treatment-induced churn that hides in your data?"</em> — Compute "exposed retention" but always report "intent-to-treat retention" alongside; if ITT is flat but exposed-retention is up, you have churn-induced bias.</li>
</ul>

<h3>"What I'd do day one on the team"</h3>
<ul>
  <li>Audit currently-running experiments: are guardrails wired? Is SRM monitored? Are durations pre-registered?</li>
  <li>Find the longest-running flag in code; coordinate cleanup.</li>
  <li>Add a CI check that flags experiments without an owner or end date.</li>
  <li>Build a simple "weekly experiments digest" doc — what's running, what's decided, what's tech debt.</li>
  <li>Write a 1-page "how to run an A/B test" doc; replace tribal knowledge.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd switch the platform to support sequential testing so we can ramp faster without inflating false positives."</li>
  <li>"I'd build a segment-watchdog: post-hoc segments flagged, not used as ship criteria."</li>
  <li>"I'd add CUPED for our top 5 metrics — variance reduction can cut sample-size needs 30–50%."</li>
  <li>"I'd require a written hypothesis + power calculation in the PR template before any experiment goes live."</li>
  <li>"I'd integrate the experimentation platform with crash reporting so a treatment-induced crash auto-pauses the experiment."</li>
</ul>
`
    }
  ]
});
