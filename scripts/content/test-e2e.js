window.PREP_SITE.registerTopic({
  id: 'test-e2e',
  module: 'testing',
  title: 'E2E (Playwright/Detox/Maestro)',
  estimatedReadTime: '50 min',
  tags: ['e2e', 'playwright', 'cypress', 'detox', 'maestro', 'integration', 'flake', 'fixtures', 'visual-regression'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>End-to-end tests</strong> exercise a deployed (or near-deployed) build the way a real user does — driving a real browser or device, hitting (mostly) real backends, asserting on what the user actually sees. They are slow, flaky, expensive, and often the only way to catch a class of bugs that no other layer can.</p>
<ul>
  <li><strong>Web: Playwright</strong> is the modern default. Auto-wait, multi-browser, parallel by default, trace viewer, codegen. <strong>Cypress</strong> is the Old Reliable; great DX but architecturally limited (no multi-tab, no multi-origin without workarounds).</li>
  <li><strong>RN / mobile native: Detox</strong> for JS-driven gray-box automation; <strong>Maestro</strong> for declarative YAML flows that read like documentation; <strong>Appium</strong> for cross-platform native (older, more complex).</li>
  <li><strong>Pick critical paths only.</strong> E2E for: signup, login, payments, checkout, the 3–5 flows where breakage = revenue loss. Everything else: integration tests.</li>
  <li><strong>Speed budget:</strong> the entire E2E suite should run in &lt; 10 min on CI; individual specs &lt; 30s; full pipeline shouldn't be more than 20% of total CI time.</li>
  <li><strong>Stable selectors:</strong> <code>data-testid</code> or accessibility roles, never CSS classes that change with refactors.</li>
  <li><strong>Mock the boundary, not the journey:</strong> stub flaky 3rd-party services (analytics, payment redirects); let your own services run real.</li>
  <li><strong>Visual regression</strong> belongs alongside E2E for design-system protection (Chromatic, Percy, Playwright snapshots).</li>
</ul>
<p><strong>Mantra:</strong> "Few, fast, stable, focused. Critical path or not at all."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What E2E actually means</h3>
<p>"End-to-end" means the test exercises the full stack — frontend code, backend services, database, third-party integrations — as close to production as you can get. The test drives the UI (browser or device) just like a user would.</p>
<p>This is different from <strong>integration tests</strong> (multiple modules of the same app, often with mocked network) and <strong>system tests</strong> (cross-service contracts).</p>

<h3>Why E2E is necessary</h3>
<table>
  <thead><tr><th>Bug class</th><th>Caught by E2E only</th></tr></thead>
  <tbody>
    <tr><td>SSR / hydration mismatches</td><td>Yes — only a real browser hydrates</td></tr>
    <tr><td>Build / bundling regressions</td><td>Yes — JSDOM doesn't run the production bundle</td></tr>
    <tr><td>CSP / security header issues</td><td>Yes — JSDOM doesn't enforce</td></tr>
    <tr><td>Cross-origin / cookie / iframe issues</td><td>Often only here</td></tr>
    <tr><td>Real keyboard / IME / paste behaviour</td><td>Only in real browsers</td></tr>
    <tr><td>Native gestures (mobile)</td><td>Only on device / emulator</td></tr>
    <tr><td>Push notifications, deep links, background tasks</td><td>Only on device</td></tr>
  </tbody>
</table>

<h3>Why E2E is dangerous</h3>
<ul>
  <li><strong>Slow:</strong> seconds per test, minutes per suite, hours per matrix.</li>
  <li><strong>Flaky:</strong> race conditions, network timing, third-party outages, animation timing.</li>
  <li><strong>Brittle:</strong> selectors break under refactors; UI text changes break translations.</li>
  <li><strong>Expensive:</strong> CI runners, browser instances, mobile device farms cost real money.</li>
  <li><strong>Hard to debug:</strong> failure happens in a remote VM; trace files are mandatory.</li>
</ul>

<h3>The "few but mighty" principle</h3>
<p>Write E2E for the flows where bugs cost the most: signup, login, search, checkout/payment, core feature happy path. Aim for 5–20 specs per product, not hundreds. A good test for "user can sign up and complete onboarding" beats 50 brittle micro-tests.</p>

<h3>What "good E2E" looks like</h3>
<ul>
  <li>Each spec covers <em>one user journey</em> end-to-end (login → action → assertion).</li>
  <li>Specs run in &lt; 30s each; suite in &lt; 10 min.</li>
  <li>Selectors are stable (testid / role / label), not CSS classes.</li>
  <li>Tests reset state between runs (fresh DB per worker, or test API for cleanup).</li>
  <li>3rd-party services are mocked (Stripe redirects to test URLs; analytics is stubbed).</li>
  <li>Flake rate is tracked; failing tests are quarantined within 24h, fixed within a week.</li>
  <li>CI shows screenshots / videos / traces of failures.</li>
  <li>One spec per critical feature; skip "covers everything" prompts.</li>
</ul>

<h3>What "bad E2E" looks like</h3>
<ul>
  <li>Hundreds of specs covering every UI variation; suite takes 2 hours.</li>
  <li>Engineers retry-on-red and CI is permanently yellow.</li>
  <li>Selectors target <code>.btn-primary-large</code>; refactors break dozens of tests.</li>
  <li>Tests share state; running spec 7 alone passes, in suite fails.</li>
  <li>Real Stripe in tests; rate-limited or charged.</li>
  <li>No trace artefacts; debugging is "rerun and pray."</li>
  <li>The "100% E2E coverage" goal — diamond shape, slow + brittle.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The E2E tool landscape (web)</h3>
<table>
  <thead><tr><th>Tool</th><th>Strengths</th><th>Weaknesses</th></tr></thead>
  <tbody>
    <tr><td>Playwright</td><td>Multi-browser (Chromium, Firefox, WebKit), parallel, auto-wait, trace viewer, multi-origin, multi-tab, codegen, mobile emulation</td><td>Newer; slightly more setup than Cypress</td></tr>
    <tr><td>Cypress</td><td>Best DX, time-travel debugger, real-time browser, huge community</td><td>Single browser per test, single tab/origin (workarounds exist), runs in browser context (limits)</td></tr>
    <tr><td>Selenium / WebDriver</td><td>Cross-language (Java, Python, JS), broad ecosystem</td><td>Slow, flaky, dated API; legacy choice</td></tr>
    <tr><td>Puppeteer</td><td>Chromium scripting (not really a test runner)</td><td>Manual setup; Playwright superseded for testing</td></tr>
    <tr><td>WebdriverIO</td><td>WebDriver + Appium bridge; mobile + web</td><td>Steeper learning curve</td></tr>
  </tbody>
</table>

<h3>The E2E tool landscape (mobile / RN)</h3>
<table>
  <thead><tr><th>Tool</th><th>Strengths</th><th>Weaknesses</th></tr></thead>
  <tbody>
    <tr><td>Detox</td><td>Gray-box: knows when JS is idle; fast; JS-authored tests; iOS + Android</td><td>RN-only typically; iOS setup non-trivial; runs locally / EAS</td></tr>
    <tr><td>Maestro</td><td>Declarative YAML; very fast to author; one tool for iOS/Android/web; Maestro Cloud</td><td>Less control than code-based; some advanced flows awkward</td></tr>
    <tr><td>Appium</td><td>Cross-platform native + web; language-agnostic; mature</td><td>Slow setup; XPath-heavy; flake-prone; older feel</td></tr>
    <tr><td>EAS Build + Detox</td><td>Detox in Expo's cloud; no local Xcode setup</td><td>Cost; CI duration</td></tr>
    <tr><td>BrowserStack / Sauce / AWS Device Farm</td><td>Real-device cloud farms</td><td>Slow + costly; for matrix coverage only</td></tr>
  </tbody>
</table>

<h3>What "auto-wait" means</h3>
<p>Playwright (and to a lesser extent Cypress) automatically waits for the element to be:</p>
<ul>
  <li>Attached to the DOM</li>
  <li>Visible</li>
  <li>Stable (no animations)</li>
  <li>Enabled</li>
  <li>Receiving events</li>
</ul>
<p>This eliminates 90% of "flaky because I didn't wait long enough" bugs that plagued Selenium-era tools. You don't write <code>sleep</code>s.</p>

<h3>Selector strategies</h3>
<table>
  <thead><tr><th>Approach</th><th>Pro</th><th>Con</th></tr></thead>
  <tbody>
    <tr><td>Role + accessible name</td><td>Resilient; doubles as a11y test</td><td>Sometimes ambiguous; need <code>name</code> filter</td></tr>
    <tr><td>Label / placeholder</td><td>Stable for forms</td><td>Localised text breaks tests across languages</td></tr>
    <tr><td>Text content</td><td>Reads like the spec</td><td>Breaks on copy changes</td></tr>
    <tr><td><code>data-testid</code></td><td>Most stable; intentional</td><td>Pollutes markup; "test smell" if used everywhere</td></tr>
    <tr><td>CSS class</td><td>Quick</td><td>Worst — breaks on every refactor</td></tr>
    <tr><td>XPath</td><td>Powerful</td><td>Brittle; readability nightmare</td></tr>
  </tbody>
</table>
<p>Default order: <code>getByRole</code> → <code>getByLabel</code> → <code>getByText</code> → <code>data-testid</code>. Same priority as RTL.</p>

<h3>Test isolation strategies</h3>
<table>
  <thead><tr><th>Strategy</th><th>Use when</th></tr></thead>
  <tbody>
    <tr><td>Per-test API cleanup</td><td>Backend supports test endpoints (<code>/api/test/reset</code>)</td></tr>
    <tr><td>Per-test fresh user</td><td>Sign up a unique user per test (cheap if onboarding is fast)</td></tr>
    <tr><td>Per-worker DB</td><td>Each Playwright worker gets its own database / schema</td></tr>
    <tr><td>Per-suite seed</td><td>Re-seed once per suite; run read-only tests in parallel</td></tr>
    <tr><td>Snapshot / restore</td><td>Restore from a known DB snapshot per spec</td></tr>
  </tbody>
</table>

<h3>Mocking strategy</h3>
<ul>
  <li><strong>Real backend:</strong> default. Tests run against your dev / staging API.</li>
  <li><strong>Mocked third-party:</strong> Stripe, OAuth, analytics, push services — stub at the network with Playwright route handlers or sandbox APIs.</li>
  <li><strong>Mocked internal:</strong> only when an internal service is flaky in test env (common for ML / search).</li>
  <li><strong>Time:</strong> stub on the server (<code>NODE_ENV=test</code> uses a fixed clock) or via <code>page.clock</code> in Playwright.</li>
</ul>

<h3>Failure artefacts</h3>
<p>Always capture on failure:</p>
<ul>
  <li>Screenshot (PNG)</li>
  <li>Video (WebM / MP4) — Playwright records optional</li>
  <li>HTML trace (Playwright's <code>--trace on</code> is incredible — time-travel through every action)</li>
  <li>Network HAR</li>
  <li>Console logs</li>
  <li>Server logs correlated by request ID</li>
</ul>
<p>Trace viewer is the killer Playwright feature: opens a full timeline with DOM snapshots and network calls.</p>

<h3>The flake budget</h3>
<table>
  <thead><tr><th>Flake rate</th><th>Health</th><th>Action</th></tr></thead>
  <tbody>
    <tr><td>&lt; 0.5%</td><td>Healthy</td><td>Maintain</td></tr>
    <tr><td>0.5–2%</td><td>Watch</td><td>Quarantine flakes; fix weekly</td></tr>
    <tr><td>2–5%</td><td>Debt</td><td>Pause new E2E; pay down</td></tr>
    <tr><td>&gt; 5%</td><td>Bankrupt</td><td>Engineers ignore CI; signal worthless</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Playwright basics</h3>
<pre><code class="language-typescript">// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html'], ['github']],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
    { name: 'mobile',   use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
</code></pre>

<h3>A first Playwright test</h3>
<pre><code class="language-typescript">import { test, expect } from '@playwright/test';

test('user can sign up and reach dashboard', async ({ page }) =&gt; {
  await page.goto('/signup');

  await page.getByLabel('Email').fill('p@x.com');
  await page.getByLabel('Password').fill('hunter2hunter2');
  await page.getByRole('button', { name: 'Sign up' }).click();

  await expect(page).toHaveURL(/\\/dashboard$/);
  await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
});
</code></pre>
<p>No <code>sleep</code>. <code>fill</code> waits for the input to be editable; <code>click</code> waits for the button to be visible + enabled; <code>toHaveURL</code> auto-retries up to the timeout.</p>

<h3>Fixtures (per-test setup, isolated, parallel-safe)</h3>
<pre><code class="language-typescript">// fixtures.ts
import { test as base } from '@playwright/test';

type Fixtures = {
  authedPage: Page;
  apiClient: ApiClient;
};

export const test = base.extend&lt;Fixtures&gt;({
  apiClient: async ({}, use) =&gt; {
    const client = makeApiClient();
    const cleanups: Array&lt;() =&gt; Promise&lt;void&gt;&gt; = [];
    await use(client);
    for (const c of cleanups) await c();
  },

  authedPage: async ({ page, apiClient }, use) =&gt; {
    const user = await apiClient.createTestUser();
    await page.context().addCookies([{ name: 'sid', value: user.token, url: 'http://localhost:3000' }]);
    await use(page);
    await apiClient.deleteUser(user.id);
  },
});

export { expect } from '@playwright/test';
</code></pre>

<pre><code class="language-typescript">// in a spec
import { test, expect } from './fixtures';

test('logged-in user posts a comment', async ({ authedPage }) =&gt; {
  await authedPage.goto('/posts/42');
  await authedPage.getByRole('textbox', { name: /comment/i }).fill('Hi!');
  await authedPage.getByRole('button', { name: /post/i }).click();
  await expect(authedPage.getByText('Hi!')).toBeVisible();
});
</code></pre>

<h3>Mocking network in Playwright</h3>
<pre><code class="language-typescript">test('shows fallback when search API fails', async ({ page }) =&gt; {
  await page.route('**/api/search?**', (route) =&gt;
    route.fulfill({ status: 500, body: 'oops' })
  );
  await page.goto('/search?q=hello');
  await expect(page.getByText(/something went wrong/i)).toBeVisible();
});
</code></pre>

<h3>Multi-tab / multi-origin</h3>
<pre><code class="language-typescript">test('OAuth redirect completes', async ({ page, context }) =&gt; {
  await page.goto('/login');
  const popupPromise = context.waitForEvent('page');
  await page.getByRole('button', { name: /continue with github/i }).click();
  const popup = await popupPromise;
  await popup.getByLabel('Username').fill('test-user');
  await popup.getByLabel('Password').fill('test-pass');
  await popup.getByRole('button', { name: /authorize/i }).click();
  await expect(page).toHaveURL(/\\/dashboard/);
});
</code></pre>

<h3>Visual regression with Playwright</h3>
<pre><code class="language-typescript">test('design system buttons', async ({ page }) =&gt; {
  await page.goto('/storybook/buttons');
  await expect(page).toHaveScreenshot('buttons.png', { maxDiffPixels: 100 });
});
</code></pre>
<p>First run creates baseline; subsequent runs diff. CI fails on visual drift. <code>--update-snapshots</code> to refresh intentionally.</p>

<h3>Detox basics (RN)</h3>
<pre><code class="language-javascript">// e2e/login.test.ts
describe('Login', () =&gt; {
  beforeEach(async () =&gt; {
    await device.launchApp({ newInstance: true });
  });

  it('logs in successfully', async () =&gt; {
    await element(by.id('email-input')).typeText('p@x.com');
    await element(by.id('password-input')).typeText('hunter2hunter2');
    await element(by.id('login-button')).tap();
    await expect(element(by.id('dashboard-heading'))).toBeVisible();
  });
});
</code></pre>
<p>Selectors are <code>testID</code> props on RN components. Detox knows when JS is idle; no manual sleeps.</p>

<h3>Maestro basics (declarative YAML)</h3>
<pre><code class="language-yaml">appId: com.example.myapp
---
- launchApp
- tapOn:
    id: "email-input"
- inputText: "p@x.com"
- tapOn:
    id: "password-input"
- inputText: "hunter2hunter2"
- tapOn: "Log in"
- assertVisible: "Welcome"
</code></pre>
<p>Reads like a spec. Cross-platform (iOS / Android / web). Maestro Cloud runs on real devices.</p>

<h3>CI integration</h3>
<pre><code class="language-yaml"># .github/workflows/e2e.yml
- name: Install Playwright
  run: pnpm exec playwright install --with-deps
- name: Run E2E
  run: pnpm exec playwright test
- name: Upload trace
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: playwright-report/
</code></pre>

<h3>Sharding for speed</h3>
<pre><code class="language-yaml"># Run 4 shards in parallel
strategy:
  matrix:
    shard: [1, 2, 3, 4]
steps:
  - run: pnpm exec playwright test --shard=\${{ matrix.shard }}/4
</code></pre>

<h3>Trace viewer</h3>
<pre><code class="language-bash">pnpm exec playwright show-trace trace.zip
</code></pre>
<p>Time-travel debugger: hover any action, see DOM snapshot before/after, network calls, console logs. Single most powerful debugging tool in modern E2E.</p>

<h3>Codegen</h3>
<pre><code class="language-bash">pnpm exec playwright codegen http://localhost:3000
</code></pre>
<p>Records your interactions as a Playwright spec. Use to scaffold a test, then edit for assertions and stability.</p>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Critical-path checkout flow</h3>
<pre><code class="language-typescript">import { test, expect } from './fixtures';

test('user can complete a checkout', async ({ authedPage, apiClient }) =&gt; {
  const product = await apiClient.createProduct({ priceCents: 1000 });

  await authedPage.goto(\`/products/\${product.id}\`);
  await authedPage.getByRole('button', { name: /add to cart/i }).click();
  await authedPage.getByRole('link', { name: /checkout/i }).click();

  // Use Stripe test card via the test mode iframe
  const stripeFrame = authedPage.frameLocator('iframe[name^="__privateStripeFrame"]');
  await stripeFrame.getByPlaceholder('Card number').fill('4242 4242 4242 4242');
  await stripeFrame.getByPlaceholder('MM / YY').fill('12 / 30');
  await stripeFrame.getByPlaceholder('CVC').fill('123');

  await authedPage.getByRole('button', { name: /pay \\$10\\.00/i }).click();

  await expect(authedPage.getByRole('heading', { name: /order confirmed/i })).toBeVisible();
});
</code></pre>

<h3>Example 2: Search with mocked API</h3>
<pre><code class="language-typescript">test('search shows results then empty state', async ({ page }) =&gt; {
  let callCount = 0;
  await page.route('**/api/search**', (route) =&gt; {
    callCount++;
    const url = new URL(route.request().url());
    const q = url.searchParams.get('q') ?? '';
    if (q.startsWith('apple')) {
      return route.fulfill({ json: [{ id: 1, label: 'Apple' }] });
    }
    return route.fulfill({ json: [] });
  });

  await page.goto('/search');
  await page.getByRole('searchbox').fill('apple');
  await expect(page.getByText('Apple')).toBeVisible();

  await page.getByRole('searchbox').fill('banana');
  await expect(page.getByText(/no results/i)).toBeVisible();
});
</code></pre>

<h3>Example 3: Mobile viewport + slow network</h3>
<pre><code class="language-typescript">test.use({
  ...devices['iPhone 14'],
  // Slow 3G
  contextOptions: { offline: false },
});

test('renders mobile layout under slow network', async ({ page, context }) =&gt; {
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: (200 * 1024) / 8, // 200 kbps
    uploadThroughput: (50 * 1024) / 8,
    latency: 600,
  });

  await page.goto('/');
  await expect(page.getByRole('navigation', { name: /mobile/i })).toBeVisible();
});
</code></pre>

<h3>Example 4: Visual regression of a page</h3>
<pre><code class="language-typescript">test('marketing homepage visual', async ({ page }) =&gt; {
  await page.goto('/');
  await page.evaluate(() =&gt; document.fonts.ready);
  await expect(page).toHaveScreenshot('home.png', {
    fullPage: true,
    mask: [page.locator('[data-dynamic="true"]')], // mask timestamps, ads
  });
});
</code></pre>

<h3>Example 5: Detox login + logout (RN)</h3>
<pre><code class="language-javascript">describe('Auth flow', () =&gt; {
  beforeEach(async () =&gt; {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('logs in and logs out', async () =&gt; {
    await element(by.id('email')).typeText('p@x.com');
    await element(by.id('password')).typeText('hunter2hunter2');
    await element(by.id('login')).tap();

    await expect(element(by.id('dashboard'))).toBeVisible();

    await element(by.id('settings-tab')).tap();
    await element(by.id('logout')).tap();
    await expect(element(by.id('login'))).toBeVisible();
  });
});
</code></pre>

<h3>Example 6: Maestro flow with conditionals</h3>
<pre><code class="language-yaml">appId: com.example.myapp
---
- launchApp
- runFlow:
    when:
      visible: "Welcome back"
    commands:
      - tapOn: "Continue"
- runFlow:
    when:
      notVisible: "Welcome back"
    commands:
      - tapOn:
          id: "email-input"
      - inputText: "p@x.com"
      - tapOn: "Log in"
- assertVisible:
    id: "dashboard"
</code></pre>

<h3>Example 7: A flake we fixed</h3>
<p>Symptom: 1% of CI runs fail at "search shows results." Trace shows the input was filled while the page was hydrating, swallowing keystrokes.</p>
<pre><code class="language-typescript">// BAD — race with hydration
await page.goto('/search');
await page.getByRole('searchbox').fill('apple');

// GOOD — wait for the search box to be enabled (post-hydration)
await page.goto('/search');
const search = page.getByRole('searchbox');
await expect(search).toBeEnabled();
await search.fill('apple');
</code></pre>
<p>Lesson: Playwright auto-waits for visible + attached + stable, but not for "hydration finished." Assert on a post-hydration state explicitly.</p>

<h3>Example 8: Accessibility check inside an E2E</h3>
<pre><code class="language-typescript">import AxeBuilder from '@axe-core/playwright';

test('homepage has no a11y violations', async ({ page }) =&gt; {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>Animation timing</h3>
<ul>
  <li>Auto-wait waits for animations to settle, but you may not want to. Disable animations globally in test mode:</li>
</ul>
<pre><code class="language-typescript">await page.addInitScript(() =&gt; {
  const style = document.createElement('style');
  style.innerHTML = \`*, *::before, *::after { animation: none !important; transition: none !important; }\`;
  document.head.appendChild(style);
});
</code></pre>

<h3>Fonts + visual regression</h3>
<ul>
  <li>Web fonts load asynchronously; first screenshot is fallback font, baseline is web font → diff fails.</li>
  <li><code>await page.evaluate(() =&gt; document.fonts.ready)</code> before screenshot.</li>
  <li>Pin fonts for tests; consider self-hosting test-only WOFF2.</li>
  <li>Mask dynamic regions (timestamps, ads, randomised content).</li>
</ul>

<h3>Time-dependent UI</h3>
<ul>
  <li>"5 minutes ago" labels drift between baseline and re-run.</li>
  <li>Use <code>page.clock.install({ time: new Date('2026-04-30T12:00:00Z') })</code> in newer Playwright; otherwise stub on the server.</li>
  <li>Persist relative-time formatting in a controlled timezone.</li>
</ul>

<h3>Real-time / WebSocket</h3>
<ul>
  <li>Tests where a notification arrives via WS — the test must wait for the side effect, not a fixed time.</li>
  <li><code>await expect(page.getByText('New message')).toBeVisible()</code> with a generous timeout works; better, drive the WS server-side from test code via API.</li>
</ul>

<h3>Concurrency</h3>
<ul>
  <li>Parallel workers + shared test user = data races.</li>
  <li>Per-worker user / per-test user / per-test API cleanup.</li>
  <li>Per-worker DB schema (Postgres: <code>SCHEMA test_worker_\${workerId}</code>).</li>
  <li>If you can't isolate, use <code>test.describe.serial</code> for that suite (slow but safe).</li>
</ul>

<h3>Cross-browser flake</h3>
<ul>
  <li>WebKit (Safari) is stricter about cookies, third-party iframes, autoplay; tests pass on Chromium, fail on WebKit.</li>
  <li>Run multi-browser nightly, not on every PR — catches OS / engine drift without slowing PR feedback.</li>
  <li>Mobile Safari has unique gesture quirks; test in <code>iPhone 14</code> device profile.</li>
</ul>

<h3>Authentication strategies</h3>
<table>
  <thead><tr><th>Strategy</th><th>Pros</th><th>Cons</th></tr></thead>
  <tbody>
    <tr><td>Real login per test</td><td>Closest to user reality</td><td>Slow; many specs × seconds adds up</td></tr>
    <tr><td>Programmatic login (API + cookie set)</td><td>Fast</td><td>Skips real login flow — test login separately</td></tr>
    <tr><td>Storage state file</td><td>One real login, share auth across specs</td><td>Test isolation — log out side effects</td></tr>
    <tr><td>Test-only login token endpoint</td><td>Fast + isolated</td><td>Backend support required</td></tr>
  </tbody>
</table>

<h3>Third-party redirects</h3>
<ul>
  <li>OAuth, payment providers, SSO redirect to external domains.</li>
  <li>Cypress's same-origin restriction means you can't follow many redirects natively (use cy.origin in v12+).</li>
  <li>Playwright handles cross-origin natively.</li>
  <li>Best: use the provider's test mode + sandbox URLs; avoid real prod endpoints.</li>
</ul>

<h3>Mobile / device edges</h3>
<ul>
  <li>Emulator boot is slow (1–3 min). Pre-warm in CI; reuse across specs.</li>
  <li>iOS Simulator: only on macOS runners. Android Emulator: linux + KVM acceleration.</li>
  <li>Real-device farms: slow + flaky + expensive; reserve for matrix nightly.</li>
  <li>Native gestures (swipe, pinch) are device-specific; Maestro abstracts; Detox needs <code>matchers</code>.</li>
  <li>Permissions (camera, location, notifications): grant programmatically per test.</li>
</ul>

<h3>Push notifications</h3>
<ul>
  <li>FCM/APNs in test = unreliable. Use mock notification services or stub the OS handler.</li>
  <li>Detox: <code>device.sendUserNotification({ ... })</code> simulates a notification arrival.</li>
  <li>For deep-link from notification, simulate the URL handler.</li>
</ul>

<h3>Performance budgets in E2E</h3>
<ul>
  <li>Lighthouse CI alongside Playwright catches regressions in TTI, LCP, etc.</li>
  <li>Don't block PRs on it — flaky environment makes false positives common; track trends.</li>
</ul>

<h3>Snapshot drift</h3>
<ul>
  <li>OS version updates change font rendering by 1px → snapshot diffs everywhere.</li>
  <li>Pin Playwright + browser version in lockfile; pin OS in CI image.</li>
  <li>Use <code>maxDiffPixels</code> threshold; not zero-tolerance.</li>
  <li>Re-baseline on intentional design changes; review diffs in PR.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common E2E mistakes</h3>
<ol>
  <li><strong>E2E for everything.</strong> Slow, flaky, hides which layer broke.</li>
  <li><strong>Class-name selectors.</strong> Refactor breaks 50 tests; nothing user-facing changed.</li>
  <li><strong><code>page.waitForTimeout(1000)</code>.</strong> Flaky on slow CI; auto-wait already handles most cases.</li>
  <li><strong>Real Stripe / OAuth in CI.</strong> Rate-limited, charges money, flaky 3rd-party outage.</li>
  <li><strong>Shared test user across specs.</strong> Data races, order dependence.</li>
  <li><strong>No trace artefacts.</strong> Failures are unfixable post-mortem.</li>
  <li><strong>Auto-retry hiding flake.</strong> Tests retry 3× and pass; the bug is in production a week later.</li>
  <li><strong>"Just rerun it" culture.</strong> CI signal worthless.</li>
  <li><strong>Skipping accessibility.</strong> Screen-reader regressions ship.</li>
  <li><strong>One huge test per flow.</strong> 200 lines of assertions in one spec; first failure hides the rest.</li>
  <li><strong>No isolation.</strong> Spec 7 alone passes, in suite fails — same DB, same user.</li>
  <li><strong>Obsessing over visual pixel-perfect.</strong> Use diff thresholds; perfection is a debt machine.</li>
</ol>

<h3>Anti-pattern: arbitrary sleeps</h3>
<pre><code class="language-typescript">// BAD
await page.click('#submit');
await page.waitForTimeout(2000);
await expect(page.locator('.success')).toBeVisible();

// GOOD — wait for the actual condition
await page.click('#submit');
await expect(page.getByRole('alert', { name: /success/i })).toBeVisible();
</code></pre>

<h3>Anti-pattern: <code>data-testid</code> everywhere</h3>
<pre><code class="language-html">&lt;!-- BAD — visible interactive elements need semantic queries --&gt;
&lt;button data-testid="submit-btn" class="btn"&gt;Submit&lt;/button&gt;

&lt;!-- GOOD --&gt;
&lt;button class="btn"&gt;Submit&lt;/button&gt; &lt;!-- query by role + name --&gt;
</code></pre>
<p>Reach for <code>data-testid</code> only when role-based queries genuinely don't disambiguate (e.g., 5 identical buttons in a list).</p>

<h3>Anti-pattern: testing third-party UI</h3>
<pre><code class="language-typescript">// BAD — third-party can change anytime
await stripeFrame.getByText('I agree to terms').click();

// GOOD — let the third-party do its thing; assert your post-redirect
await page.click('Pay');
await expect(page).toHaveURL(/\\/order\\/success/);
</code></pre>

<h3>Anti-pattern: ignoring failures locally, hoping CI passes</h3>
<p>If you can't reproduce locally, you can't fix. Pull traces from CI; reproduce by running with the same seed / shard.</p>

<h3>Anti-pattern: 100% browsers on every PR</h3>
<p>Run Chromium on every PR; Firefox / WebKit nightly. Saves hours of CI without sacrificing meaningful coverage.</p>

<h3>Anti-pattern: skipping a flaky test "for now"</h3>
<pre><code class="language-typescript">test.skip('TODO: fix this flake', async ({ page }) =&gt; { /* ... */ });
</code></pre>
<p>Either fix it within the week or delete it. Skipped tests rot.</p>

<h3>Anti-pattern: not failing fast</h3>
<p>If a test takes &gt; 60s, something is wrong. Set per-test timeouts; investigate slow specs.</p>

<h3>Anti-pattern: real DB seeded per spec via UI</h3>
<pre><code class="language-typescript">// BAD — slow + flaky setup
await page.goto('/admin');
await page.click('Add product');
await page.fill('#name', 'Test product');
await page.click('Save');

// GOOD — call the API directly to set up state
const product = await apiClient.createProduct({ name: 'Test product' });
await page.goto(\`/products/\${product.id}\`);
</code></pre>

<h3>Anti-pattern: overlapping responsibilities with integration</h3>
<p>If RTL covers it, don't write an E2E too. E2E only for what RTL/JSDOM can't.</p>

<h3>Anti-pattern: no flake metrics</h3>
<p>If you don't track flake rate per test, you can't see the rot. <code>--retries</code> + reports per test in Playwright HTML reporter; aggregate in a dashboard.</p>

<h3>Anti-pattern: testing "the build works"</h3>
<p>A smoke test that "the homepage loads" is fine. Twenty tests that the homepage loads with different cookies is testing the framework, not your app.</p>

<h3>Anti-pattern: wrong device profile</h3>
<p>Testing on Chromium desktop when 80% of users are mobile Safari. Match prod traffic when prioritising browser matrix.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common E2E interview prompts</h3>
<ol>
  <li>Walk through your E2E strategy.</li>
  <li>How do you decide what gets an E2E vs an integration test?</li>
  <li>How do you handle flaky E2E tests?</li>
  <li>Compare Playwright vs Cypress vs Selenium.</li>
  <li>Compare Detox vs Maestro vs Appium.</li>
  <li>How would you set up E2E in a new project?</li>
  <li>How do you isolate test state in parallel runs?</li>
  <li>Tell me about a time E2E caught a critical bug.</li>
</ol>

<h3>The 5-step framework for "design our E2E suite"</h3>
<ol>
  <li><strong>Identify critical paths:</strong> 5–20 flows where bugs cost money or trust (login, signup, checkout, key feature).</li>
  <li><strong>Pick the tool:</strong> Playwright (web), Detox/Maestro (RN), Appium (cross-platform native).</li>
  <li><strong>Plan isolation:</strong> per-worker DB, per-test user, programmatic auth, MSW or route stubs for 3rd-party.</li>
  <li><strong>Plan CI:</strong> shards, retries on CI only, traces on first retry, screenshots / video on failure.</li>
  <li><strong>Plan flake budget:</strong> &lt; 0.5%; auto-quarantine; weekly fix rotation; report dashboard.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"E2E for the 5–10 flows where breakage equals revenue loss; integration covers the rest."</em></li>
  <li><em>"Playwright over Cypress for cross-origin, multi-tab, and trace viewer; Cypress wins on DX if those don't matter."</em></li>
  <li><em>"Detox for gray-box JS-driven flows; Maestro when YAML reads better and we need cross-platform; Appium only when we're already in Selenium ecosystem."</em></li>
  <li><em>"Auto-wait + assert-on-condition over <code>waitForTimeout</code> — sleep is the source of most flake."</em></li>
  <li><em>"Programmatic auth + per-worker DB schema for parallel isolation."</em></li>
  <li><em>"Mock third-party at the network — Stripe sandbox, OAuth test mode; let internal services run real."</em></li>
  <li><em>"Trace on first retry; screenshot + video on failure; trace viewer turns flake hunting from hours into minutes."</em></li>
  <li><em>"Visual regression alongside E2E for design-system protection — Percy / Chromatic / Playwright snapshots with diff thresholds."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt keyword</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"web E2E"</td><td>Playwright; Cypress if team prefers</td></tr>
    <tr><td>"cross-browser"</td><td>Playwright projects; nightly Firefox + WebKit</td></tr>
    <tr><td>"mobile RN"</td><td>Detox or Maestro</td></tr>
    <tr><td>"flake"</td><td>Trace viewer; auto-wait; remove sleeps; isolate state</td></tr>
    <tr><td>"parallel"</td><td>Per-worker DB / user; <code>fullyParallel</code> in Playwright</td></tr>
    <tr><td>"speed"</td><td>Shard across CI workers; auth via API; programmatic seeding</td></tr>
    <tr><td>"visual regression"</td><td>Playwright screenshots / Percy / Chromatic</td></tr>
    <tr><td>"a11y in E2E"</td><td>axe-core/playwright per critical page</td></tr>
    <tr><td>"OAuth / Stripe"</td><td>Sandbox / test mode; never real prod credentials</td></tr>
  </tbody>
</table>

<h3>Demo script (whiteboard / IDE)</h3>
<ol>
  <li>List the critical paths.</li>
  <li>Sketch playwright.config.ts (baseURL, projects, retries, trace).</li>
  <li>Show one test using fixtures (<code>authedPage</code>).</li>
  <li>Show one route mock for a flaky third-party.</li>
  <li>Show CI matrix shards.</li>
  <li>Talk flake budget + quarantine workflow.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"axe-core/playwright on every critical page."</em></li>
  <li><em>"Visual regression with Percy on the design system."</em></li>
  <li><em>"Lighthouse CI tracking perf budgets."</em></li>
  <li><em>"Per-worker DB schema with fast resets via <code>TRUNCATE</code>."</em></li>
  <li><em>"Test-only login endpoint signed by an internal key."</em></li>
  <li><em>"Trace artefacts auto-attached to PR failures."</em></li>
  <li><em>"Flake dashboard with per-test rate; auto-quarantine + weekly fix rotation."</em></li>
  <li><em>"Mobile matrix nightly: iOS 16/17/18, Android 13/14, real-device cloud farm."</em></li>
  <li><em>"Maestro flows in Storybook for component-level RN visual testing."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Restraint</td><td>Names what's E2E vs integration; doesn't blanket-E2E</td></tr>
    <tr><td>Selector hygiene</td><td>Role / label first; testid as fallback</td></tr>
    <tr><td>Auto-wait fluency</td><td>Reaches for assertions, not sleeps</td></tr>
    <tr><td>Isolation strategy</td><td>Per-worker / per-test data lifecycle</td></tr>
    <tr><td>Third-party handling</td><td>Sandboxes / mocks; never real prod creds</td></tr>
    <tr><td>CI pipeline awareness</td><td>Shards, retries, traces, artefacts</td></tr>
    <tr><td>Flake mindset</td><td>Tracks rate; quarantines; doesn't tolerate</td></tr>
    <tr><td>Mobile awareness</td><td>Detox / Maestro tradeoffs; emulator vs real-device strategy</td></tr>
    <tr><td>Communication</td><td>Tradeoffs spoken; not silent</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>Detox is JS-authored; integrates naturally with the RN codebase; gray-box (knows when JS is idle).</li>
  <li>Maestro YAML reads like documentation; cross-platform (iOS / Android / web); Maestro Cloud handles devices.</li>
  <li>EAS Build can run Detox in Expo's cloud; saves local Xcode setup time.</li>
  <li>Native gestures + permissions need Detox matchers or Maestro flows; can't be exercised in Jest+RTL.</li>
  <li>Push notifications: Detox <code>device.sendUserNotification</code>; Maestro <code>openLink</code> for deep-link handlers.</li>
  <li>Mobile-specific bugs: keyboard reflow, safe-area, gesture conflicts, OS-version differences. E2E is the only catch.</li>
  <li>Real-device cloud farms (BrowserStack, Sauce, AWS Device Farm, EAS Update channel rollouts) for matrix coverage.</li>
  <li>Performance: Reassure (RN perf testing tool) + Detox for cold-start measurement.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"Why Playwright over Cypress?"</em> — Multi-browser, multi-tab, multi-origin, cross-platform; trace viewer; faster parallel; codegen. Cypress's DX still wins for some teams; pick by use case.</li>
  <li><em>"How do you isolate parallel tests against shared infrastructure?"</em> — Per-worker DB schema (Postgres), per-test user, API-driven cleanup, namespace test data with worker ID.</li>
  <li><em>"How do you reduce flake to under 1%?"</em> — Auto-wait everywhere, no sleeps, mock third-party, isolate state, trace on retry to find root causes, quarantine + fix.</li>
  <li><em>"How do you handle flaky third-party services?"</em> — Mock at the network with route handlers; use sandbox modes; never depend on prod-grade external availability for CI.</li>
  <li><em>"What's the relationship between E2E and visual regression?"</em> — Visual catches CSS / layout drift no functional test will. Run alongside; different signal.</li>
  <li><em>"How do you debug a CI-only failure?"</em> — Trace viewer; rerun with same seed; check OS / browser version; check parallelism; check timezone / clock; pull artefacts.</li>
  <li><em>"How do you decide what's worth an E2E?"</em> — Cost of failure × probability × not-covered-by-other-layers. Money flows, auth, regulatory; that's it.</li>
  <li><em>"How would you onboard a team to E2E culture?"</em> — Codegen + fixtures library + clear "what's E2E" doc + flake quarantine policy + trace viewer demo.</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Set up Playwright on a real project; write 5 specs from scratch.</li>
  <li>Use the trace viewer on a deliberately flaky test.</li>
  <li>Build fixtures for auth + DB cleanup.</li>
  <li>Run cross-browser; see WebKit-only flakes.</li>
  <li>Set up Detox or Maestro on a small RN app; feel the ergonomics.</li>
  <li>Memorise the 5-step framework + flake budget.</li>
  <li>Read Playwright's "best practices" doc.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read Cypress's real-world examples repo — even if not using Cypress, the patterns transfer."</li>
  <li>"Read Detox's gray-box internals doc — clarifies why it's reliable."</li>
  <li>"Try Maestro Cloud free tier on a real RN app."</li>
  <li>"Compare BrowserStack vs Sauce vs AWS Device Farm pricing on a hypothetical matrix."</li>
</ul>
`
    }
  ]
});
