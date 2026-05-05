window.PREP_SITE.registerTopic({
  id: 'test-strategies',
  module: 'testing',
  title: 'Test Strategies',
  estimatedReadTime: '45 min',
  tags: ['test-strategy', 'pyramid', 'trophy', 'ci-cd', 'flake-budget', 'shift-left', 'risk-based-testing', 'test-data', 'mobile-testing'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>A <strong>test strategy</strong> is the design doc that answers: <em>what gets tested, at which layer, by whom, when, with what data, against what reliability bar?</em> It's the layer above tools and individual tests — the one most teams skip and pay for later.</p>
<ul>
  <li><strong>Strategy = the contract between testing investment and confidence to ship.</strong> No strategy = ad-hoc tests that pass coverage but miss critical paths.</li>
  <li><strong>Risk-based first.</strong> Map features to "cost if broken" × "probability of breaking" × "detectability"; invest where the product is together (payments, auth, core flows).</li>
  <li><strong>Pick a shape:</strong> Trophy for frontend, Pyramid for backend / hot-loop algorithms. Anti-shape: diamond (lots of E2E, no integration).</li>
  <li><strong>Test data is half the strategy.</strong> Fixtures, factories, seed scripts, anonymised prod snapshots — explicit choice per project.</li>
  <li><strong>CI strategy:</strong> what runs on PR (fast, deterministic), what runs on merge (broader), what runs nightly (matrix, smoke, slow E2E).</li>
  <li><strong>Flake budget:</strong> &lt; 0.5% target; quarantine + fix policy; the suite either earns trust or loses it.</li>
  <li><strong>Mobile / RN:</strong> add device matrix, OS-version drift, real-device cloud farm cadence as separate tracks.</li>
  <li><strong>Coverage is a floor, not a goal.</strong> Per-folder thresholds beat one global number.</li>
</ul>
<p><strong>Mantra:</strong> "Strategy before suite. Risk-based investment. Trophy by default, Pyramid where it fits, never diamond. Fast feedback close to the engineer."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What a test strategy is</h3>
<p>A short, living document (1–3 pages) that codifies:</p>
<ul>
  <li><strong>Goals:</strong> what confidence does the team need to ship safely?</li>
  <li><strong>Risks:</strong> which bug classes are most likely / most costly?</li>
  <li><strong>Coverage shape:</strong> Trophy / Pyramid / hybrid; what's each layer's job?</li>
  <li><strong>Test data:</strong> fixtures, seed scripts, anonymisation, environments.</li>
  <li><strong>CI policy:</strong> what runs when, retry rules, flake quarantine.</li>
  <li><strong>Ownership:</strong> who writes what; how PR reviews enforce it.</li>
  <li><strong>Tooling:</strong> Jest / Vitest, RTL, MSW, Playwright / Detox, axe, Pact, etc.</li>
  <li><strong>Metrics:</strong> coverage thresholds, flake rate, suite time, escaped-bug rate.</li>
</ul>
<p>It is <em>not</em> a list of every test. It's the framework against which individual test decisions are made.</p>

<h3>Why a strategy matters more than tools</h3>
<table>
  <thead><tr><th>Without strategy</th><th>With strategy</th></tr></thead>
  <tbody>
    <tr><td>Each engineer tests ad-hoc; suite mirrors author's habits.</td><td>Coherent layering; predictable CI signal.</td></tr>
    <tr><td>Coverage drifts; gaps in critical flows hidden by 80% number.</td><td>Per-folder thresholds; critical paths protected.</td></tr>
    <tr><td>E2E and integration overlap and waste time.</td><td>Each layer has a clear job; no double coverage.</td></tr>
    <tr><td>Flake tolerated; CI ignored.</td><td>Flake budget tracked; retries bounded; trust intact.</td></tr>
    <tr><td>Slow CI; engineers skip local runs.</td><td>Fast feedback loops; full suite runs &lt; 10 min.</td></tr>
    <tr><td>Test code is the worst code in the repo.</td><td>Test code maintained; reviewed; refactored.</td></tr>
  </tbody>
</table>

<h3>The risk-based premise</h3>
<p>Not all code is equally important. A 1% bug in the payment flow costs more than a 50% bug on the marketing landing page. Testing budget should reflect this:</p>
<table>
  <thead><tr><th>Code area</th><th>Cost if broken</th><th>Probability</th><th>Strategy</th></tr></thead>
  <tbody>
    <tr><td>Payments / billing</td><td>Catastrophic</td><td>Medium</td><td>Unit + integration + E2E + visual + a11y; per-folder coverage 90%; nightly smoke</td></tr>
    <tr><td>Auth / login</td><td>High</td><td>Low</td><td>Integration + critical-path E2E; coverage 80%</td></tr>
    <tr><td>Core feature happy path</td><td>High</td><td>High</td><td>Integration heavy; one E2E; coverage 70%</td></tr>
    <tr><td>Marketing pages</td><td>Low</td><td>Low</td><td>Visual regression; lint; no E2E</td></tr>
    <tr><td>Internal admin tool</td><td>Medium</td><td>Medium</td><td>Light integration; no E2E</td></tr>
    <tr><td>Experimental feature (1% rollout)</td><td>Low–Medium</td><td>High</td><td>Spot-check tests; rely on small blast radius</td></tr>
  </tbody>
</table>

<h3>What "good strategy" looks like</h3>
<ul>
  <li>One-page summary readable by PMs / managers, not just engineers.</li>
  <li>Each feature gets a test plan (fits in a PR description).</li>
  <li>CI is fast (PR &lt; 10 min, merge &lt; 20 min) and deterministic (&lt; 0.5% flake).</li>
  <li>Coverage is per-folder; critical paths defended.</li>
  <li>Test data is consistent across environments (factories, seeds).</li>
  <li>Visual + a11y + perf budgets explicit, not afterthoughts.</li>
  <li>Mobile has its own track for device / OS matrix.</li>
  <li>Escaped-bug analysis runs monthly: which layer should have caught this?</li>
</ul>

<h3>What "bad strategy" looks like</h3>
<ul>
  <li>"100% coverage" as the only goal.</li>
  <li>Same coverage thresholds for marketing and billing.</li>
  <li>"We use Jest" stated; nothing else specified.</li>
  <li>Test code lives in a separate repo, untouched for 18 months.</li>
  <li>E2E suite covers every form variation; no integration coverage.</li>
  <li>Flaky tests retried 3× automatically; nobody fixes them.</li>
  <li>One global "test command" that takes 45 minutes.</li>
  <li>No mobile test plan despite shipping iOS + Android.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The strategy as a portfolio</h3>
<p>Think of a test strategy like an investment portfolio: each layer (static, unit, integration, contract, E2E, visual, a11y, perf, mobile) earns confidence at a different speed-cost ratio. You allocate budget to maximise total confidence per minute of CI time.</p>

<h3>The five test layers and their jobs</h3>
<table>
  <thead><tr><th>Layer</th><th>Catches</th><th>Speed</th><th>Cost</th></tr></thead>
  <tbody>
    <tr><td>Static (TS, lint, tsc, ESLint, Knip)</td><td>typos, bad imports, unused code, type errors</td><td>seconds</td><td>near-zero</td></tr>
    <tr><td>Unit</td><td>pure-logic bugs, edge cases</td><td>ms</td><td>low</td></tr>
    <tr><td>Integration (component / module)</td><td>cooperating units, user-visible logic</td><td>tens of ms</td><td>medium</td></tr>
    <tr><td>Contract (Pact / OpenAPI)</td><td>cross-service API drift</td><td>~100ms</td><td>medium</td></tr>
    <tr><td>E2E</td><td>full-stack regressions, hydration, build, CSP</td><td>seconds</td><td>high</td></tr>
    <tr><td>Visual regression</td><td>CSS / layout drift</td><td>seconds</td><td>medium-high</td></tr>
    <tr><td>A11y (axe)</td><td>accessibility regressions</td><td>ms–seconds</td><td>low</td></tr>
    <tr><td>Performance (Lighthouse / Reassure)</td><td>perf regressions</td><td>seconds</td><td>medium</td></tr>
  </tbody>
</table>

<h3>Trophy vs Pyramid (revisited)</h3>
<table>
  <thead><tr><th>Domain</th><th>Best fit</th></tr></thead>
  <tbody>
    <tr><td>React / RN UI / Next.js / Remix</td><td>Trophy — integration is the workhorse</td></tr>
    <tr><td>Pure backend services</td><td>Pyramid — units are exhaustive, integration covers wiring</td></tr>
    <tr><td>SQL parser / compiler / DSL</td><td>Pyramid — unit-test the AST + every operator</td></tr>
    <tr><td>Mobile RN app</td><td>Trophy + dedicated E2E track for native flows (Detox / Maestro)</td></tr>
    <tr><td>Game / animation</td><td>Pyramid for systems (collision, physics) + visual regression for rendering</td></tr>
  </tbody>
</table>

<h3>The "who tests" matrix</h3>
<table>
  <thead><tr><th>Layer</th><th>Author</th></tr></thead>
  <tbody>
    <tr><td>Static</td><td>Tooling (no human author)</td></tr>
    <tr><td>Unit</td><td>Feature engineer</td></tr>
    <tr><td>Integration</td><td>Feature engineer</td></tr>
    <tr><td>Contract</td><td>Both consumer + provider; CI enforces</td></tr>
    <tr><td>E2E</td><td>Feature engineer (small) + dedicated QA / SDET (large suites)</td></tr>
    <tr><td>Visual / a11y</td><td>Design system team owns the framework; feature engineer adds per-feature</td></tr>
    <tr><td>Performance</td><td>Perf-aware engineer or platform team</td></tr>
    <tr><td>Manual exploratory</td><td>QA / engineers in rotation</td></tr>
  </tbody>
</table>

<h3>"Shift left" — find bugs before they're committed</h3>
<ul>
  <li><strong>IDE:</strong> TypeScript + ESLint live; engineer sees errors as they type.</li>
  <li><strong>Pre-commit hook:</strong> lint + format + run tests for changed files.</li>
  <li><strong>Pre-push hook:</strong> faster integration tests; full unit.</li>
  <li><strong>PR CI:</strong> full unit + integration + critical E2E; visual snapshots.</li>
  <li><strong>Merge CI:</strong> full E2E + cross-browser + perf budgets.</li>
  <li><strong>Nightly:</strong> mobile device matrix + smoke against staging + visual full sweep.</li>
  <li><strong>Production:</strong> synthetic monitoring + RUM + error tracking — tests after deploy.</li>
</ul>
<p>Each layer pushes detection earlier; cheaper to fix and less rework.</p>

<h3>The CI pipeline shape</h3>
<pre><code class="language-text">PR
├─ static (tsc, lint, format)            ~30s
├─ unit + integration                    ~3min
├─ component snapshots / a11y           ~1min
├─ critical-path E2E (chromium)         ~3min
└─ build smoke                           ~2min
                                        ───────
                                        ~10min total

merge
├─ everything above
├─ full E2E (chromium + firefox + webkit) ~10min
└─ perf budgets (lighthouse-ci)          ~3min

nightly
├─ mobile device matrix (Detox / EAS)
├─ visual regression full sweep
└─ smoke against prod
</code></pre>

<h3>The flake budget</h3>
<table>
  <thead><tr><th>Flake rate</th><th>Health</th><th>Action</th></tr></thead>
  <tbody>
    <tr><td>0% (impossible)</td><td>—</td><td>Don't optimise to zero; eradicating the last 0.1% wastes time.</td></tr>
    <tr><td>&lt; 0.5%</td><td>Healthy</td><td>Track; investigate spikes.</td></tr>
    <tr><td>0.5–2%</td><td>Watch</td><td>Auto-quarantine; weekly fix rotation.</td></tr>
    <tr><td>2–5%</td><td>Debt</td><td>Pause new tests; pay down.</td></tr>
    <tr><td>&gt; 5%</td><td>Bankrupt</td><td>Engineers ignore CI; signal worthless.</td></tr>
  </tbody>
</table>

<h3>Coverage as a per-folder floor</h3>
<pre><code class="language-typescript">// vitest.config.ts (or jest.config.js equivalent)
test: {
  coverage: {
    thresholds: {
      'src/billing/**': { branches: 90, functions: 90, lines: 90 },
      'src/auth/**':    { branches: 85, functions: 85, lines: 85 },
      'src/core/**':    { branches: 70, functions: 70, lines: 70 },
      'src/marketing/**': { branches: 0 }, // pages with visual regression instead
    },
  },
}
</code></pre>

<h3>Test data strategy</h3>
<table>
  <thead><tr><th>Source</th><th>Use for</th><th>Caveats</th></tr></thead>
  <tbody>
    <tr><td>Hand-written fixtures</td><td>Small, well-known shapes</td><td>Drift; need maintenance</td></tr>
    <tr><td>Factories (<code>aUser({...})</code>)</td><td>Most tests; readable + evolvable</td><td>Defaults can hide bugs</td></tr>
    <tr><td>Seed scripts</td><td>Integration / E2E DB setup</td><td>Slow if heavy; isolate per worker</td></tr>
    <tr><td>Anonymised prod snapshot</td><td>Realistic perf / shape testing</td><td>Compliance; data drift</td></tr>
    <tr><td>Property-based (fast-check)</td><td>Pure functions, encoders</td><td>Random seeds — capture failing case</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Writing a test strategy doc (1-pager template)</h3>
<pre><code class="language-text">## Goals
- Confidence to deploy daily without manual QA.
- &lt; 1 escaped bug per quarter in payments / auth.

## Risks (top 5)
1. Payment flow regression — catastrophic.
2. Auth token refresh — high.
3. Mobile cold start &gt; 2s — medium.
4. iOS 17 keyboard reflow bug — medium.
5. Stripe SDK upgrade breaking — medium.

## Coverage shape: Trophy
- Static: TS strict + ESLint + Knip (always-on).
- Unit: pure logic only (date utils, validators, parsers).
- Integration: component + hook tests with RTL + MSW. Workhorse.
- Contract: Pact between web ↔ orders service; nightly.
- E2E: Playwright; 8 critical-path specs; cross-browser nightly.
- Visual: Chromatic for design system; per-page snapshots for marketing.
- A11y: jest-axe on every form; AxeBuilder on E2E homepage / checkout.
- Mobile: Detox on iOS + Android emulator (PR); EAS Build cloud (nightly matrix).

## CI policy
- PR: static + unit + integration + 8 E2E (chromium) + a11y; budget 10 min.
- Merge: + cross-browser E2E + Lighthouse + Pact.
- Nightly: mobile matrix + full visual sweep + smoke against staging.

## Coverage thresholds
- src/billing — 90%
- src/auth — 85%
- src/core — 70%
- src/marketing — 0% (visual covers)

## Flake policy
- Budget: &lt; 0.5%.
- Auto-quarantine after 3 flakes in 7 days.
- Fix or delete within 1 sprint; no merge to main with quarantined critical-path tests.

## Owners
- Product engineers own unit + integration + a11y on their features.
- Platform team owns CI infra, MSW handlers, Playwright fixtures.
- Mobile team owns Detox / Maestro setup + emulator pipeline.

## Metrics (tracked weekly)
- Suite time: PR &lt; 10min, merge &lt; 20min.
- Flake rate per spec; aggregate &lt; 0.5%.
- Coverage per folder; alert on regression.
- Escaped-bug rate; root-cause to test layer.
</code></pre>

<h3>The PR-level "test plan"</h3>
<pre><code class="language-markdown">## Test plan
- [ ] Unit: validate edge cases for new pricing util (zero, negative, overflow).
- [ ] Integration: cart updates total when item quantity changes.
- [ ] E2E: smoke checkout flow with new pricing applied.
- [ ] Visual: cart summary screenshot updated.
- [ ] A11y: axe scan on cart page.
- [ ] Manual: tested on iPhone 14 / Pixel 7 emulator.

## Risks
- Pricing rounding could differ from old logic; documented assertions on boundary cents.

## What I deliberately didn't test
- Marketing landing — covered by existing visual snapshot.
- Admin internal tool — out of scope.
</code></pre>

<h3>Test data factories</h3>
<pre><code class="language-typescript">// fixtures/user.ts
export const aUser = (overrides: Partial&lt;User&gt; = {}): User =&gt; ({
  id: \`u-\${Math.random().toString(36).slice(2, 8)}\`,
  email: \`test-\${Date.now()}@example.com\`,
  role: 'MEMBER',
  joinedAt: new Date('2026-01-01'),
  ...overrides,
});

// usage
const admin = aUser({ role: 'ADMIN' });
const newcomer = aUser({ joinedAt: new Date() });
</code></pre>

<h3>Seed script for integration / E2E</h3>
<pre><code class="language-typescript">// scripts/seed-test-db.ts
import { db } from './db';

export async function seed() {
  await db.users.insert([
    { id: 'u-admin', email: 'admin@x.com', role: 'ADMIN' },
    { id: 'u-member', email: 'member@x.com', role: 'MEMBER' },
  ]);
  await db.products.insert(/* … */);
}

if (require.main === module) seed().then(() =&gt; process.exit(0));
</code></pre>

<h3>Per-worker isolation (Postgres)</h3>
<pre><code class="language-typescript">// playwright fixture
export const test = base.extend({
  workerSchema: [async ({}, use, info) =&gt; {
    const schema = \`test_w\${info.workerIndex}\`;
    await db.exec(\`CREATE SCHEMA IF NOT EXISTS "\${schema}"\`);
    await db.exec(\`SET search_path TO "\${schema}"\`);
    await migrate();
    await use(schema);
    await db.exec(\`DROP SCHEMA "\${schema}" CASCADE\`);
  }, { scope: 'worker' }],
});
</code></pre>

<h3>Escaped-bug analysis</h3>
<p>When a bug ships, ask:</p>
<ol>
  <li>Which test layer <em>should</em> have caught it?</li>
  <li>Why didn't it? (Missing test? Mock too lenient? Skipped layer?)</li>
  <li>Add the missing test (regression test).</li>
  <li>If the gap is structural (e.g., contract drift), update the strategy.</li>
</ol>
<p>Run this for every Sev 1–2 prod incident. Suite improves over time; gaps shrink.</p>

<h3>Test pyramid for a single feature (worked through)</h3>
<p>Feature: "Apply discount code at checkout."</p>
<table>
  <thead><tr><th>Layer</th><th>What to test</th></tr></thead>
  <tbody>
    <tr><td>Static</td><td>Discount code type narrowing; can't pass undefined</td></tr>
    <tr><td>Unit</td><td>Pricing util: percentage vs fixed; max % cap; rounding</td></tr>
    <tr><td>Integration</td><td>Cart shows applied discount; clears on remove; error on invalid code</td></tr>
    <tr><td>Contract</td><td>POST <code>/api/cart/discount</code> returns expected shape</td></tr>
    <tr><td>E2E (1 spec)</td><td>User applies code → sees lower total → completes checkout</td></tr>
    <tr><td>Visual</td><td>Discount badge renders correctly</td></tr>
    <tr><td>A11y</td><td>Discount code input has label + error live region</td></tr>
  </tbody>
</table>

<h3>Smoke vs regression vs critical-path</h3>
<table>
  <thead><tr><th>Type</th><th>Purpose</th><th>Run when</th></tr></thead>
  <tbody>
    <tr><td>Smoke</td><td>Sanity check ("does the app boot")</td><td>After deploy; against staging / prod</td></tr>
    <tr><td>Regression</td><td>Specific past-bug repro</td><td>On every PR if affected area</td></tr>
    <tr><td>Critical-path E2E</td><td>Top 5–10 user journeys</td><td>On every PR</td></tr>
    <tr><td>Full E2E</td><td>Every flow we've ever written</td><td>Nightly only — too slow for PR</td></tr>
    <tr><td>Synthetic monitoring</td><td>Probe prod every 5 min</td><td>Continuously, post-deploy</td></tr>
  </tbody>
</table>

<h3>Mobile-specific test tracks</h3>
<table>
  <thead><tr><th>Track</th><th>Cadence</th><th>Tools</th></tr></thead>
  <tbody>
    <tr><td>JS unit + integration (RTL-RN)</td><td>Every PR</td><td>Jest + RTL-RN + MSW</td></tr>
    <tr><td>Native Detox / Maestro on emulator</td><td>Every PR (key flows)</td><td>Detox or Maestro</td></tr>
    <tr><td>Real-device matrix</td><td>Nightly</td><td>BrowserStack / Sauce / EAS Build</td></tr>
    <tr><td>OS-version compatibility</td><td>Weekly</td><td>iOS N, N-1; Android 13/14</td></tr>
    <tr><td>Performance (cold start, JS thread)</td><td>Per-PR (light); nightly (deep)</td><td>Reassure; Flipper</td></tr>
    <tr><td>Visual snapshots</td><td>Per-PR</td><td>react-native-owl or Storybook + Chromatic</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Strategy for a B2B SaaS dashboard</h3>
<p>Profile: read-heavy admin tool, 500 internal users, 5 engineers.</p>
<ul>
  <li><strong>Shape:</strong> Trophy.</li>
  <li><strong>Static:</strong> TS strict, ESLint, Knip on dead code; mandatory.</li>
  <li><strong>Unit:</strong> only for pure utilities (date, currency, search ranking).</li>
  <li><strong>Integration:</strong> RTL + MSW for every dashboard widget; coverage 70%.</li>
  <li><strong>Contract:</strong> none — single backend, internal team owns both sides.</li>
  <li><strong>E2E:</strong> 4 critical paths (login, list view, create record, export). Playwright. Cross-browser nightly.</li>
  <li><strong>Visual:</strong> Chromatic for design-system components only.</li>
  <li><strong>A11y:</strong> jest-axe on forms; spot-check internal screens.</li>
  <li><strong>Mobile:</strong> none (web-only).</li>
</ul>

<h3>Example 2: Strategy for a fintech mobile app</h3>
<p>Profile: high-stakes payments, RN, iOS + Android, 10M+ users.</p>
<ul>
  <li><strong>Shape:</strong> Trophy + dedicated mobile track.</li>
  <li><strong>Static:</strong> TS strict, ESLint, Detox-style ESLint plugins.</li>
  <li><strong>Unit:</strong> heavy on money / fees / interest util tests + property-based for boundaries.</li>
  <li><strong>Integration:</strong> RTL-RN + MSW; coverage 90% on billing-adjacent.</li>
  <li><strong>Contract:</strong> Pact between app and core banking service; CI-enforced.</li>
  <li><strong>E2E:</strong> Detox on emulator (PR) + Maestro on real-device cloud (nightly); 12 critical flows.</li>
  <li><strong>Visual:</strong> Storybook + Chromatic for design system; per-screen snapshots for key flows.</li>
  <li><strong>A11y:</strong> automated axe checks + manual VoiceOver / TalkBack testing weekly.</li>
  <li><strong>Performance:</strong> Reassure for cold start (PR budget); deep profiling weekly.</li>
  <li><strong>Production:</strong> synthetic monitoring on key API endpoints; Sentry alerting on crash rate.</li>
</ul>

<h3>Example 3: Strategy for a marketing site</h3>
<p>Profile: Next.js, mostly static, 10 pages, 2 engineers.</p>
<ul>
  <li><strong>Shape:</strong> Static + visual + a11y dominate; very few unit tests.</li>
  <li><strong>Static:</strong> TS, lint, broken-link checker, MDX schema validation.</li>
  <li><strong>Unit:</strong> minimal — only pure utils.</li>
  <li><strong>Integration:</strong> RTL + MSW for newsletter signup, contact form (the few interactive widgets).</li>
  <li><strong>E2E:</strong> 1 spec — landing → CTA → form submit.</li>
  <li><strong>Visual:</strong> Percy on every page, every PR.</li>
  <li><strong>A11y:</strong> axe on every page in CI.</li>
  <li><strong>Performance:</strong> Lighthouse CI with budgets per page.</li>
</ul>

<h3>Example 4: PR test plan for a real feature</h3>
<pre><code class="language-markdown">## Feature: Add discount code support to checkout

## Test plan
- [x] Unit: <code>applyDiscount(price, code)</code> handles percentage, fixed, max-cap, rounding (16 cases).
- [x] Integration: <code>CheckoutSummary</code> updates total when valid code entered; shows error on invalid; clears on remove.
- [x] Integration: <code>useCart</code> hook applies + removes discount; persists across page reload.
- [x] Contract: server contract test for POST <code>/api/cart/discount</code>.
- [x] E2E: 1 new spec — apply code, complete checkout, verify receipt total matches.
- [x] Visual: discount badge in cart summary (Chromatic).
- [x] A11y: discount input has label + aria-describedby for error.
- [ ] Mobile: not yet — feature flag-gated to web first.

## Risks
- Rounding differs between old and new util on $99.99-style edge cases — covered by 4 dedicated unit tests.
- Stripe doesn't update line items live — verified via E2E that final charge matches displayed total.

## What I deliberately didn't test
- Admin "create discount code" UI — out of scope, separate PR.
- Existing cart logic — already covered.
</code></pre>

<h3>Example 5: Escaped-bug post-mortem</h3>
<p>Bug: customers received $0 charges due to incorrect rounding in applied discount.</p>
<table>
  <thead><tr><th>Question</th><th>Answer</th></tr></thead>
  <tbody>
    <tr><td>Severity</td><td>Sev 1; ~$50k revenue loss in 2 hours.</td></tr>
    <tr><td>Which layer should have caught it?</td><td>Unit test of <code>applyDiscount</code>.</td></tr>
    <tr><td>Why didn't it?</td><td>Test didn't include "100% off + sub-cent" edge case.</td></tr>
    <tr><td>Why was that edge missed?</td><td>Property-based tests not enabled; only example-based.</td></tr>
    <tr><td>Fix</td><td>Regression test for the specific bug; add fast-check property test for "discount never produces negative or sub-cent total"; raise <code>billing/**</code> coverage threshold.</td></tr>
    <tr><td>Strategy update</td><td>Property-based testing added as required for billing module.</td></tr>
  </tbody>
</table>

<h3>Example 6: Choosing what NOT to test</h3>
<p>Things explicitly out of scope, written down to prevent scope creep:</p>
<ul>
  <li>Marketing copy text — pinned in CMS, not React; CMS has its own QA.</li>
  <li>Admin internal tool — internal users; bug fixes within hours; not worth E2E.</li>
  <li>Experimental feature behind 1% flag — small blast radius; spot-check only.</li>
  <li>Third-party SDK behaviour — they own their tests; we wrap + mock the wrapper.</li>
  <li>Browser version &lt; 1% market share — best-effort; no CI matrix slot.</li>
</ul>
<p>Senior signal: writing this list down. "We don't test X because Y" is a position; "we forgot to test X" is a gap.</p>

<h3>Example 7: Selling a strategy to a skeptical team</h3>
<p>Common pushback + responses:</p>
<table>
  <thead><tr><th>Pushback</th><th>Response</th></tr></thead>
  <tbody>
    <tr><td>"Tests slow us down."</td><td>"Bad tests slow us down. Strategy is how we keep tests cheap.";</td></tr>
    <tr><td>"100% coverage is the goal."</td><td>"Coverage with mocks is theatre. Per-folder thresholds + behavioural tests give real signal."</td></tr>
    <tr><td>"E2E catches everything."</td><td>"E2E is slow + flaky. We use it sparingly; integration is where most bugs live."</td></tr>
    <tr><td>"We don't have time to write a strategy."</td><td>"One page. We'll save the time back in two months on flake debugging."</td></tr>
    <tr><td>"Our domain is too unique for a strategy."</td><td>"Then the strategy will reflect that — but the act of writing it surfaces the assumptions."</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>Test data drift</h3>
<ul>
  <li>Anonymised prod snapshot ages out; tests start failing on schema changes.</li>
  <li>Refresh policy: rotate snapshots monthly; document anonymisation.</li>
  <li>Compliance: PII in test fixtures = audit risk. Use generated names / emails / IDs only.</li>
</ul>

<h3>Per-worker isolation</h3>
<ul>
  <li>Tests share a DB → race conditions. Per-worker schema solves it.</li>
  <li>For Redis / Elasticsearch / Kafka: namespace keys / topics / indices by worker ID.</li>
  <li>Cleanup: drop schema after test run; CI shouldn't accumulate.</li>
</ul>

<h3>Time zone / locale</h3>
<ul>
  <li>Tests pass in UTC, fail in IST. Always run CI with <code>TZ=UTC</code> + <code>LANG=en_US.UTF-8</code>.</li>
  <li>For locale-sensitive tests (currency, dates), inject the locale; test specific cases.</li>
</ul>

<h3>Production parity</h3>
<ul>
  <li>Test env diverges: different Postgres version, different Redis, different node modules.</li>
  <li>Use Testcontainers for prod-shaped services in CI; or pin versions in Docker Compose.</li>
  <li>Smoke against staging weekly catches drift mocks won't.</li>
</ul>

<h3>Long-lived branches</h3>
<ul>
  <li>Branch open 6 weeks; main has shipped 50 changes. Merge conflicts in tests + features.</li>
  <li>Strategy: rebase weekly; CI runs main + branch in matrix; surface drift early.</li>
</ul>

<h3>Cross-team contract drift</h3>
<ul>
  <li>Two services own each side of an API; one changes shape; the other breaks at runtime.</li>
  <li>Pact contract test in CI on both sides; fails the PR that introduces drift.</li>
  <li>OpenAPI / GraphQL SDL diff in CI; fail on breaking changes.</li>
</ul>

<h3>Mobile-specific edges</h3>
<ul>
  <li><strong>OS-version drift:</strong> iOS 16 vs 17 vs 18 — keyboard, gesture, safe-area behaviour shifts.</li>
  <li><strong>Emulator vs real device:</strong> emulators don't model GPU, sensors, battery. Real-device farm catches.</li>
  <li><strong>Network conditions:</strong> simulate slow 3G, offline, high latency in mobile E2E.</li>
  <li><strong>Push notifications:</strong> can't fully test without a device; use Detox <code>sendUserNotification</code> and accept the gap.</li>
  <li><strong>App Store / Play Store review:</strong> not testable; track separately.</li>
  <li><strong>OTA updates (Expo / EAS Update):</strong> test the update flow in staging.</li>
</ul>

<h3>Visual regression noise</h3>
<ul>
  <li>Font rendering varies across OS / browser versions → snapshots fail by 1px.</li>
  <li>Use diff thresholds (e.g., <code>maxDiffPixels: 100</code>); not zero-tolerance.</li>
  <li>Mask dynamic regions (timestamps, ads, randomised content).</li>
  <li>Pin Playwright + browser version + OS in CI image.</li>
</ul>

<h3>Performance test flake</h3>
<ul>
  <li>CI runner load varies; perf budgets fail intermittently.</li>
  <li>Run perf tests on dedicated runners or median-of-N runs.</li>
  <li>Track trends, not absolute thresholds; alert on regression.</li>
</ul>

<h3>Coverage gaming</h3>
<ul>
  <li>Engineers write tests that exercise code without asserting outcomes.</li>
  <li>Counter: per-folder thresholds + branch coverage + mutation testing audit.</li>
  <li>PR review responsibility: spot tautological tests.</li>
</ul>

<h3>Test rot</h3>
<ul>
  <li>Skipped tests pile up; flaky tests rerun until "stable"; TODO comments accumulate.</li>
  <li>Quarterly audit: count <code>.skip</code>, <code>.todo</code>; budget time to clean.</li>
  <li>Tests are code; refactor + delete + maintain like any other.</li>
</ul>

<h3>The strategy itself rots</h3>
<ul>
  <li>Strategy doc gets stale; team reality diverges; 6 months in nobody reads it.</li>
  <li>Quarterly review: 30-min meeting; update + announce.</li>
  <li>Tie strategy to onboarding doc; new joiners ask "is this still right?"</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common test-strategy mistakes</h3>
<ol>
  <li><strong>No strategy at all.</strong> Each engineer tests ad-hoc; suite mirrors their habits.</li>
  <li><strong>Coverage as the only metric.</strong> 90% coverage doesn't mean 90% confidence.</li>
  <li><strong>Same threshold for every folder.</strong> Marketing and billing have different stakes.</li>
  <li><strong>Diamond shape: heavy E2E, no integration.</strong> Slow, flaky, low confidence.</li>
  <li><strong>Tolerating &gt; 1% flake.</strong> Trust collapses; engineers ignore CI.</li>
  <li><strong>One global "test command."</strong> 45 minutes; nobody runs locally.</li>
  <li><strong>No PR-level test plan.</strong> Reviewers can't tell what was tested.</li>
  <li><strong>Test code is second-class.</strong> Untouched for 18 months; rotting; impossible to read.</li>
  <li><strong>No mobile-specific track despite shipping mobile.</strong></li>
  <li><strong>Skipping a11y, perf, visual entirely.</strong></li>
  <li><strong>Strategy doc written, never updated.</strong> Reality diverges.</li>
  <li><strong>No escaped-bug analysis.</strong> Same bug class ships twice.</li>
</ol>

<h3>Anti-pattern: blanket coverage threshold</h3>
<pre><code class="language-typescript">// BAD — punishes well-tested code; rewards tautological coverage
test: { coverage: { thresholds: { global: { lines: 80 } } } }

// GOOD — risk-based; per-folder
test: {
  coverage: {
    thresholds: {
      'src/billing/**': { branches: 90 },
      'src/auth/**': { branches: 85 },
      'src/marketing/**': { branches: 0 },
    },
  },
}
</code></pre>

<h3>Anti-pattern: "test everything in E2E"</h3>
<p>Slow CI, flaky pipelines, false confidence. Map bug classes to layers; E2E only for full-stack regressions JSDOM/RTL can't catch.</p>

<h3>Anti-pattern: silent skip</h3>
<pre><code class="language-typescript">// BAD — rots forever
test.skip('TODO: fix this', async () =&gt; { /* ... */ });

// GOOD — track + delete or fix within sprint
// ESLint rule: jest/no-disabled-tests
</code></pre>

<h3>Anti-pattern: retry-on-CI to mask flake</h3>
<pre><code class="language-yaml"># BAD
retries: 3

# OK if paired with: surface flake-rate metrics; quarantine after N flakes
retries: process.env.CI ? 2 : 0
</code></pre>
<p>Retries are a coping mechanism, not a fix. Use to keep CI green while you find the root cause; don't use to ignore.</p>

<h3>Anti-pattern: monolithic test command</h3>
<pre><code class="language-bash"># BAD
npm test  # runs everything; 45 min

# GOOD — granular commands
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:visual
</code></pre>
<p>Engineers run targeted commands locally; CI orchestrates all.</p>

<h3>Anti-pattern: PR with no test changes</h3>
<p>Feature PR, zero new tests. Either:</p>
<ul>
  <li>The feature is genuinely untestable (rare; redesign).</li>
  <li>The author skipped tests (catch in review).</li>
  <li>Existing tests cover it (then PR description should say so).</li>
</ul>

<h3>Anti-pattern: PR test plan as afterthought</h3>
<pre><code class="language-markdown">## Test plan
- [x] Tested manually.
</code></pre>
<p>Useless. PR template should require specifics: what tests, what's covered, what's deferred.</p>

<h3>Anti-pattern: ignoring escaped bugs</h3>
<p>Sev 1 ships; engineers fix the code; no test added; same bug class returns. Always: regression test + strategy update.</p>

<h3>Anti-pattern: test code with no review</h3>
<p>"It's just tests" → reviewers skip; tests rot. Test code reviewed with same rigour as production. Half the bugs come from bad tests, not bad code.</p>

<h3>Anti-pattern: visual regression without diff thresholds</h3>
<pre><code class="language-typescript">// BAD — every 1px font-rendering shift fails
expect(page).toHaveScreenshot('home.png'); // zero tolerance

// GOOD
expect(page).toHaveScreenshot('home.png', { maxDiffPixels: 100 });
</code></pre>

<h3>Anti-pattern: no escape hatch for known false positives</h3>
<p>Suite hates a flaky integration with a third-party. No way to skip / quarantine; engineers manually retry. Quarantine list with deadlines beats invisible retry.</p>

<h3>Anti-pattern: strategy without ownership</h3>
<p>"We have a strategy doc." Who owns updates? Who reviews escaped bugs? Who tunes thresholds? Without an owner, strategy rots; reality drifts.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common test-strategy interview prompts</h3>
<ol>
  <li>Walk me through your testing strategy at $LAST_COMPANY.</li>
  <li>Design the test strategy for a [fintech mobile app / e-commerce site / B2B SaaS / marketing site].</li>
  <li>How do you decide what gets tested at which layer?</li>
  <li>How do you handle flaky tests at scale?</li>
  <li>What's your CI / CD test pipeline shape?</li>
  <li>How do you measure test suite health?</li>
  <li>How do you onboard a team to a new test strategy?</li>
  <li>How do you balance test speed and confidence?</li>
  <li>Tell me about an escaped bug; what did you change?</li>
</ol>

<h3>The 6-step framework for "design our test strategy"</h3>
<ol>
  <li><strong>Clarify scope:</strong> what's the product? Who are users? What's the cost of bugs?</li>
  <li><strong>Identify risks:</strong> top 5 bug classes by cost × probability.</li>
  <li><strong>Pick the shape:</strong> Trophy / Pyramid; per-folder coverage thresholds; layers' jobs.</li>
  <li><strong>Plan CI:</strong> PR / merge / nightly buckets; budget per stage; flake policy.</li>
  <li><strong>Plan test data:</strong> factories / seed scripts / per-worker isolation / anonymised snapshots.</li>
  <li><strong>Plan ownership + metrics:</strong> who maintains; what's tracked; quarterly review.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"Risk-based testing — billing gets 90% coverage with property-based; marketing gets visual regression instead."</em></li>
  <li><em>"Trophy shape for the React UI; integration is the workhorse — 50% of suite, 80% of bugs caught."</em></li>
  <li><em>"E2E only on critical paths — payments, auth, search, the 5 flows where breakage = revenue. Everything else is integration."</em></li>
  <li><em>"Per-folder coverage thresholds; one global number is theatre."</em></li>
  <li><em>"Flake budget &lt; 0.5%; auto-quarantine after 3 fails in 7 days; weekly fix rotation. Trust is the real currency."</em></li>
  <li><em>"PR CI &lt; 10 min; merge CI &lt; 20 min; nightly absorbs the slow stuff. Engineers stay in flow."</em></li>
  <li><em>"Mobile gets its own track — Detox on emulator for PR, real-device matrix nightly via cloud farm."</em></li>
  <li><em>"Escaped-bug analysis on every Sev 1–2; regression test + strategy update."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt keyword</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"high-stakes domain"</td><td>Heavy unit + property-based + contract; nightly smoke</td></tr>
    <tr><td>"marketing site"</td><td>Visual regression dominant; minimal unit; 1 E2E</td></tr>
    <tr><td>"mobile app"</td><td>Trophy + dedicated mobile track + device matrix nightly</td></tr>
    <tr><td>"micro-services"</td><td>Pact contract testing CI-enforced</td></tr>
    <tr><td>"slow CI"</td><td>Layer + shard; PR vs merge vs nightly bucket</td></tr>
    <tr><td>"flaky pipelines"</td><td>Track flake rate; quarantine; root-cause not retry</td></tr>
    <tr><td>"how to onboard team"</td><td>1-page strategy doc; PR template; pair on first test</td></tr>
    <tr><td>"escaped bug"</td><td>Layer-mapping post-mortem; regression test; strategy update</td></tr>
  </tbody>
</table>

<h3>Demo script (whiteboard)</h3>
<ol>
  <li>Sketch the 5 layers vertically.</li>
  <li>Annotate "what's each layer's job + budget."</li>
  <li>Per-folder coverage table.</li>
  <li>CI pipeline horizontal: PR / merge / nightly with stages and time budgets.</li>
  <li>Flake budget + quarantine policy.</li>
  <li>Mobile track if applicable.</li>
  <li>Metrics dashboard sketch: flake rate, suite time, escaped bugs.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"Mutation testing pass quarterly to audit suite quality."</em></li>
  <li><em>"Property-based testing for billing utilities."</em></li>
  <li><em>"Contract tests via Pact between web and orders service."</em></li>
  <li><em>"Lighthouse CI tracking perf budgets per page."</em></li>
  <li><em>"axe in every E2E critical-path; jest-axe on every form."</em></li>
  <li><em>"Per-worker DB schema with fast resets via TRUNCATE."</em></li>
  <li><em>"Real-device cloud farm matrix nightly."</em></li>
  <li><em>"Test data factories shared across unit / integration / E2E."</em></li>
  <li><em>"Quarterly strategy review tied to OKR cycle."</em></li>
  <li><em>"Escaped-bug post-mortem template + monthly review."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Strategy fluency</td><td>Names risk-based + per-folder coverage</td></tr>
    <tr><td>Layer mapping</td><td>Each layer has a clear job; no overlap</td></tr>
    <tr><td>CI shape</td><td>PR / merge / nightly buckets; budgets named</td></tr>
    <tr><td>Flake mindset</td><td>Tracks rate; quarantines; doesn't tolerate</td></tr>
    <tr><td>Test data plan</td><td>Factories + seed + per-worker isolation</td></tr>
    <tr><td>Ownership</td><td>Names who maintains the strategy</td></tr>
    <tr><td>Mobile awareness</td><td>Dedicated track if shipping mobile</td></tr>
    <tr><td>Restraint</td><td>What's not tested; written down</td></tr>
    <tr><td>Improvement loop</td><td>Escaped-bug analysis; quarterly review</td></tr>
    <tr><td>Communication</td><td>Tradeoffs explicit; not silent</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN apps need a separate test track; the JS layer covered by Jest + RTL-RN; native flows by Detox / Maestro.</li>
  <li>Real-device matrix is non-negotiable for production-grade apps — emulators miss GPU / sensor / battery / push edges.</li>
  <li>OS-version drift: target N + N-1; document deviations; weekly compatibility test.</li>
  <li>Performance: Reassure for cold start / JS thread on PR; deeper profiling weekly with Flipper / Hermes profiler.</li>
  <li>App store review can't be tested; track via release pipeline runbook instead.</li>
  <li>OTA updates (EAS Update / CodePush): staging channel + canary rollout + rollback plan in strategy.</li>
  <li>Push notifications: Detox <code>sendUserNotification</code> for handler logic; manual on real device for delivery quirks.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"How do you decide between integration and E2E?"</em> — Bug class. JSDOM / RTL can catch most React + state bugs cheaply; E2E for full-stack regressions, hydration, build, CSP, real-browser quirks.</li>
  <li><em>"How do you keep CI under 10 minutes as the suite grows?"</em> — Shard parallel; cache deps; share workers across runs; move slow stuff to nightly; profile + delete dead tests.</li>
  <li><em>"What's your approach to test data?"</em> — Factories for unit/integration; seed scripts for E2E with per-worker isolation; anonymised prod snapshots for shape testing.</li>
  <li><em>"How do you measure test suite health?"</em> — Suite time, flake rate, coverage per folder, escaped-bug rate, time-to-fix-flake.</li>
  <li><em>"How do you handle a 3rd-party SDK that's flaky in tests?"</em> — Wrap behind own module; mock the wrapper; integration-test the wrapper alone with sandbox / smoke nightly.</li>
  <li><em>"How do you sell a strategy to skeptical engineers?"</em> — One-page doc + concrete metrics + escaped-bug analysis showing return on investment.</li>
  <li><em>"What would you change at our company?"</em> — Run the 6-step framework on what they describe; identify the biggest gap; propose one concrete change.</li>
  <li><em>"How do you onboard a junior to a test culture?"</em> — Pair on first PR's tests; share team conventions; <code>CONTRIBUTING.md</code>; code review focus on test quality.</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Write a 1-page strategy for a hypothetical product you've worked on.</li>
  <li>Map your last 3 production incidents to test layers — would each have been caught?</li>
  <li>Draft a CI pipeline diagram with PR / merge / nightly stages.</li>
  <li>Memorise the risk-based + Trophy / Pyramid + flake budget vocabulary.</li>
  <li>Have stories ready: a strategy you wrote, an escaped bug, a flaky test you killed.</li>
  <li>Review your last team's actual numbers if you have them — flake rate, suite time, coverage.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read Microsoft's testing-strategy posts on the .NET org evolution."</li>
  <li>"Read Google's 'Software Engineering at Google' chapters on testing."</li>
  <li>"Audit a real codebase: write its de-facto strategy in one page; note the gaps."</li>
  <li>"Run an escaped-bug post-mortem on a real incident with the 'which layer should have caught it' lens."</li>
</ul>

<h3>Testing module summary</h3>
<p>The complete Testing module covers:</p>
<ul>
  <li><strong>Testing Philosophy</strong> — Trophy vs Pyramid, behaviour over implementation, confidence as the metric.</li>
  <li><strong>Jest + RTL Deep</strong> — runner, queries, userEvent, async, custom render, mock-tooling fluency.</li>
  <li><strong>E2E (Playwright/Detox/Maestro)</strong> — critical-path-only, auto-wait, fixtures, traces, mobile tracks.</li>
  <li><strong>Mocking Strategies</strong> — five test doubles, MSW, fake timers, DI over module mocking, boundary-first.</li>
  <li><strong>Test Strategies</strong> (this topic) — risk-based investment, layered coverage, CI buckets, flake budget, escaped-bug analysis.</li>
</ul>
<p>5 topics. Together they cover the philosophy, tools, tactics, and meta-strategy that make a test suite earn its keep instead of becoming dead weight.</p>
`
    }
  ]
});
