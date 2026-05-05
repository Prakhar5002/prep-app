window.PREP_SITE.registerTopic({
  id: 'test-philosophy',
  module: 'testing',
  title: 'Testing Philosophy',
  estimatedReadTime: '40 min',
  tags: ['testing', 'philosophy', 'pyramid', 'trophy', 'tdd', 'kent-beck', 'kent-c-dodds', 'confidence', 'flake'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Testing philosophy</strong> is the layer above tools — what to test, how much, in what shape, and why. The job of a test suite is to give you <strong>confidence to ship</strong> at the speed your team needs to ship. Anything that doesn't serve that goal is overhead.</p>
<ul>
  <li><strong>The shape:</strong> the old "pyramid" (lots of unit, few E2E) has largely been replaced by Kent C. Dodds's "<strong>Testing Trophy</strong>" — static + lots of integration + some unit + a few E2E. Integration is where most bugs live.</li>
  <li><strong>The unit:</strong> test <em>behaviour</em>, not implementation. Refactors should not break tests.</li>
  <li><strong>The mantra:</strong> "The more your tests resemble the way your software is used, the more confidence they can give you." (Kent C. Dodds.)</li>
  <li><strong>The cost:</strong> slow tests, flaky tests, brittle tests, snapshot graveyards. Treat your test suite like production code — maintain it.</li>
  <li><strong>TDD:</strong> tool, not religion. Use it where it helps you think (algorithms, edge-heavy code); skip it for UI exploration.</li>
  <li><strong>Coverage:</strong> a smell, not a goal. 80% with no behavioural tests is worse than 40% with focused integration tests.</li>
  <li><strong>Mobile / RN:</strong> add device fragmentation, slow CI, and OS-version drift as first-class concerns.</li>
</ul>
<p><strong>Mantra:</strong> "Test behaviour, not implementation. Optimise for confidence, not coverage. Delete what doesn't earn its keep."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What tests are actually for</h3>
<p>Tests have one job: <strong>tell you whether the change you just made broke something that matters</strong>. Everything else — coverage metrics, "documentation," "design pressure" — is downstream of that core function.</p>

<h3>Why most teams over-test or under-test</h3>
<table>
  <thead><tr><th>Failure mode</th><th>Cause</th><th>Symptom</th></tr></thead>
  <tbody>
    <tr><td>Over-testing implementation</td><td>"Coverage as goal"</td><td>Refactors break 200 tests; nothing real broke.</td></tr>
    <tr><td>Snapshot abuse</td><td>"Quick coverage win"</td><td>Snapshots get stale, get blindly updated, never catch anything.</td></tr>
    <tr><td>Flaky E2E</td><td>Slow + race-prone + over-broad</td><td>Engineers hit "retry" reflexively; nobody trusts the CI signal.</td></tr>
    <tr><td>No tests for the hardest code</td><td>Hard code = hard to test</td><td>Bugs concentrate where tests are absent.</td></tr>
    <tr><td>Mocks all the way down</td><td>"Unit tests should be isolated"</td><td>Tests pass; integration silently broken.</td></tr>
  </tbody>
</table>

<h3>Confidence as the primary metric</h3>
<p>Coverage is easy to game. Confidence is what you actually buy with tests. A 95%-covered codebase where the tests mock every dependency gives you less confidence than a 60%-covered one with focused integration tests through the real stack.</p>
<p>Practical heuristic: <em>If I delete this test, what bug class can now reach production?</em> If the answer is "none," delete it.</p>

<h3>The three eras of test pyramids</h3>
<table>
  <thead><tr><th>Era</th><th>Shape</th><th>Why</th></tr></thead>
  <tbody>
    <tr><td>Mike Cohn (2009)</td><td>Pyramid: 70% unit / 20% integration / 10% E2E</td><td>UI tests were slow + flaky; unit was cheap.</td></tr>
    <tr><td>Google Pyramid (2010s)</td><td>Same shape, sharper definitions, with "service tests" middle</td><td>Speed-first; build your own at-scale tools.</td></tr>
    <tr><td>Kent C. Dodds Trophy (2018+)</td><td>Static (TS / lint) bottom, then integration biggest, then unit, then E2E top</td><td>Tooling matured; integration tests on JSDOM are fast and high-signal.</td></tr>
  </tbody>
</table>
<p>Modern frontend default: <strong>Trophy.</strong> Backend / hot-loop algorithm: <strong>Pyramid still wins</strong> because units there are cheap and exhaustive.</p>

<h3>Behaviour vs implementation</h3>
<p>The single biggest philosophy choice. Two equivalent code shapes:</p>
<pre><code class="language-javascript">// Test A — implementation
expect(component.find('button').props().disabled).toBe(true);

// Test B — behaviour
expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
</code></pre>
<p>Test B survives a refactor from button to <code>&lt;Pressable&gt;</code>; test A doesn't. The cost: you have to think about user-visible behaviour, not internal state.</p>

<h3>What good test files look like</h3>
<ul>
  <li><strong>Each test names a behaviour</strong>, not a method: <em>"shows error when password is too short"</em>, not <em>"validatePassword returns false"</em>.</li>
  <li><strong>Arrange / Act / Assert</strong> spacing — eyes can pick out the three phases.</li>
  <li><strong>One assertion-cluster per test</strong>; don't smuggle 5 behaviours in.</li>
  <li><strong>Tests read like specs</strong> from the user's perspective.</li>
  <li><strong>Setup helpers</strong> over deep <code>beforeEach</code> — explicit beats magical.</li>
  <li><strong>Failures point at the cause</strong>, not just the symptom.</li>
</ul>

<h3>Why senior engineers care about test philosophy</h3>
<ul>
  <li>Bad test suites cost more than no test suite (false positives erode trust; flaky CI burns hours).</li>
  <li>Test discipline reflects code discipline; test smell predicts production smell.</li>
  <li>"How do you test X?" is a discriminating interview question — it reveals whether you've shipped real systems or just toy projects.</li>
  <li>Test architecture decisions compound: the wrong choice 6 months in is a 6-month migration to undo.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The Testing Trophy (Kent C. Dodds)</h3>
<pre><code class="language-text">             E2E (~5%)
            ────────────
        Integration (~50%)
       ──────────────────
          Unit (~25%)
        ──────────────
       Static (~20%, TS + lint + types)
</code></pre>
<p>Why the rebalance: integration tests on tools like RTL run in milliseconds, give "user sees the right thing" coverage, and survive refactors. Static analysis catches a huge class of bugs (typos, undefined access) for free.</p>

<h3>The Testing Pyramid (still right for backend)</h3>
<pre><code class="language-text">          E2E (~5%)
         ──────────
      Integration (~15%)
     ────────────────
        Unit (~80%)
      ──────────────
</code></pre>
<p>Pure-function-heavy backends, parsers, algorithms still benefit from many fast unit tests. You'd build a SQL parser this way; you wouldn't build a React form this way.</p>

<h3>The 5 layers of any test</h3>
<table>
  <thead><tr><th>Layer</th><th>Speed</th><th>Confidence per test</th><th>Maintenance cost</th></tr></thead>
  <tbody>
    <tr><td>Static (TS, lint, type tests)</td><td>Instant</td><td>Catches whole classes (typos, null derefs)</td><td>Low</td></tr>
    <tr><td>Unit</td><td>~1ms</td><td>One function correctness</td><td>Low if behaviour-focused; high if mock-heavy</td></tr>
    <tr><td>Integration (component / module)</td><td>~10ms</td><td>Multiple units cooperating</td><td>Medium — most bugs live here</td></tr>
    <tr><td>Contract</td><td>~10–100ms</td><td>API shape between services</td><td>Low if Pact / OpenAPI; medium if hand-rolled</td></tr>
    <tr><td>E2E</td><td>~seconds</td><td>Full user flow</td><td>High — brittle, flaky, slow</td></tr>
  </tbody>
</table>

<h3>The "test diamond" anti-shape</h3>
<pre><code class="language-text">    E2E (lots — too brittle)
     ──────────
  Integration (some)
     ──────
    Unit (lots — fine)
</code></pre>
<p>Diamond happens when teams skip integration and double down on E2E "because it tests the real thing." Result: slow CI, flaky pipelines, low confidence. Push the middle layer; cut E2E to the critical paths.</p>

<h3>The behaviour-vs-implementation axis</h3>
<table>
  <thead><tr><th>Axis</th><th>Implementation tests</th><th>Behaviour tests</th></tr></thead>
  <tbody>
    <tr><td>Refactor cost</td><td>High — break on rename</td><td>Low — survive renames</td></tr>
    <tr><td>Bug detection</td><td>Catch internal regressions</td><td>Catch user-facing regressions</td></tr>
    <tr><td>Documentation value</td><td>Reads like internals</td><td>Reads like spec</td></tr>
    <tr><td>When to use</td><td>Algorithm internals (parser steps), DSA</td><td>UI, business logic, anything user-facing</td></tr>
  </tbody>
</table>

<h3>Cost-of-failure mental model</h3>
<p>Triangle: cost of bug × probability × detectability.</p>
<table>
  <thead><tr><th>Code</th><th>Cost if it breaks</th><th>Probability</th><th>Test priority</th></tr></thead>
  <tbody>
    <tr><td>Money / payments</td><td>Catastrophic</td><td>Medium</td><td>Heavy: unit + integration + E2E</td></tr>
    <tr><td>Auth flow</td><td>High</td><td>Low</td><td>Integration + critical-path E2E</td></tr>
    <tr><td>Marketing copy</td><td>Low</td><td>Low</td><td>Skip; lint at most</td></tr>
    <tr><td>Internal admin tool</td><td>Medium</td><td>Medium</td><td>Light integration</td></tr>
    <tr><td>Brand-new feature, day-one users</td><td>Medium</td><td>High</td><td>Integration heavy; E2E later</td></tr>
  </tbody>
</table>

<h3>Speed budget</h3>
<ul>
  <li>Test feedback &lt; 10s: tight loop; engineers will run before each commit.</li>
  <li>10s–60s: still fine; engineers run before push.</li>
  <li>1–10 min: only on PR / CI.</li>
  <li>&gt; 10 min: only on merge / nightly.</li>
</ul>
<p>Each layer up costs ~10× speed for ~2× confidence. Plan budgets accordingly.</p>

<h3>The "delete the test" thought experiment</h3>
<p>For each test ask: <em>"If I deleted this and a bug shipped, would the bug be caught elsewhere?"</em></p>
<ul>
  <li>"Yes, an integration test would catch it" → delete the unit test.</li>
  <li>"Yes, TypeScript would catch it" → delete the test.</li>
  <li>"No, this is the only thing that catches the bug" → keep it.</li>
</ul>
<p>This is how you keep a suite small + fast + meaningful as code grows.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>The four kinds of failures a test can have</h3>
<table>
  <thead><tr><th>Failure</th><th>What it means</th><th>Fix</th></tr></thead>
  <tbody>
    <tr><td>True positive</td><td>Bug exists, test caught it</td><td>Fix the bug</td></tr>
    <tr><td>True negative</td><td>No bug, test passed</td><td>Nothing</td></tr>
    <tr><td>False positive (flake)</td><td>No bug, test failed anyway</td><td>Fix or delete the test</td></tr>
    <tr><td>False negative (gap)</td><td>Bug shipped, test passed</td><td>Add a regression test at the right level</td></tr>
  </tbody>
</table>
<p>A high-quality suite minimises FPs and FNs. Most teams tolerate too many FPs (engineers retry-on-red) and don't notice FNs (until prod).</p>

<h3>The "AAA" structure</h3>
<pre><code class="language-javascript">test('shows inline error when email is invalid', async () =&gt; {
  // Arrange
  render(&lt;SignUpForm /&gt;);

  // Act
  await user.type(screen.getByLabelText(/email/i), 'not-an-email');
  await user.click(screen.getByRole('button', { name: /sign up/i }));

  // Assert
  expect(await screen.findByText(/please enter a valid email/i)).toBeVisible();
});
</code></pre>
<p>Clear visual breaks let reviewers diff intent from setup; tools like ESLint plugins can enforce.</p>

<h3>Naming tests</h3>
<table>
  <thead><tr><th>Bad</th><th>Good</th></tr></thead>
  <tbody>
    <tr><td><code>test('it works')</code></td><td><code>test('navigates to /home after successful login')</code></td></tr>
    <tr><td><code>test('updateUser')</code></td><td><code>test('updates display name when user submits the form')</code></td></tr>
    <tr><td><code>test('error case')</code></td><td><code>test('shows toast when API returns 500')</code></td></tr>
    <tr><td><code>test('returns false')</code></td><td><code>test('rejects passwords shorter than 8 chars')</code></td></tr>
  </tbody>
</table>
<p>Good test names read like the test file is a spec document.</p>

<h3>Test isolation rules</h3>
<ol>
  <li>Tests must be order-independent. <code>jest --randomize</code> / <code>vitest --shuffle</code> should pass.</li>
  <li>No shared mutable state between tests. Reset DBs, caches, mocks per test.</li>
  <li>No real time, real network, real files unless you mean it (and label those tests).</li>
  <li>No global test pollution: <code>beforeEach</code> for setup, <code>afterEach</code> for cleanup.</li>
  <li>Failure of one test should not cascade to others.</li>
</ol>

<h3>The "pinning" trap (snapshots)</h3>
<pre><code class="language-javascript">// BAD — pins everything; nothing readable; updates by reflex
expect(component).toMatchSnapshot();

// BETTER — narrow snapshot of the specific output you care about
expect(formatCurrency(1234.56, 'USD')).toMatchInlineSnapshot('"$1,234.56"');

// BEST — explicit assertion
expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
</code></pre>
<p>Snapshots are useful for outputs you genuinely can't easily express otherwise (e.g., generated CSS-in-JS, large reduced state). For most cases, write the assertion.</p>

<h3>TDD: when it's worth it</h3>
<table>
  <thead><tr><th>Worth TDD</th><th>Skip TDD</th></tr></thead>
  <tbody>
    <tr><td>Algorithm with clear inputs/outputs (parser, formatter, calc)</td><td>UI exploration ("does this layout feel right?")</td></tr>
    <tr><td>Edge-case-heavy domain (date math, currency, validation)</td><td>API shape research</td></tr>
    <tr><td>Bug fix (write failing test first to reproduce)</td><td>Throwaway scripts, prototypes</td></tr>
    <tr><td>Refactoring with safety net</td><td>Visual / interaction tweaks</td></tr>
  </tbody>
</table>

<h3>Mutation testing</h3>
<p>Tools like <strong>Stryker</strong> / <strong>PIT</strong> mutate your code (flip booleans, swap operators, return null) and re-run tests. If your tests still pass, your suite has gaps. Heavyweight; useful occasionally as a "is our coverage real?" audit.</p>

<h3>Property-based testing</h3>
<p>Use <strong>fast-check</strong> (JS) / <strong>jsverify</strong> / <strong>Hypothesis</strong> (Python) for code where you can state invariants:</p>
<pre><code class="language-javascript">import fc from 'fast-check';

test('reverse(reverse(arr)) === arr', () =&gt; {
  fc.assert(fc.property(
    fc.array(fc.anything()),
    (arr) =&gt; expect(reverse(reverse(arr))).toEqual(arr)
  ));
});
</code></pre>
<p>Best for parsers, serialisers, encoders, math. Often finds the edge case you didn't think of.</p>

<h3>Contract testing</h3>
<p>For micro-service teams: <strong>Pact</strong> codifies "consumer expects X shape from provider; provider promises Y." Each side runs the contract; CI fails on drift. Cheaper than full integration; catches the bugs E2E tests miss.</p>

<h3>Visual regression</h3>
<p><strong>Chromatic</strong> / <strong>Percy</strong> / <strong>Playwright snapshots</strong>: capture component renders as images; diff against baseline. Catches CSS / layout bugs no functional test will. Use for design-system components and key marketing pages.</p>

<h3>The "trust budget"</h3>
<p>Every flaky test spends trust. When trust hits zero, engineers ignore the suite. Track flake rate; auto-quarantine flaky tests; budget time for fixes. A suite at 0.5% flake rate is healthy; 5% is debt; 10% is bankrupt.</p>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Refactor-resilient component test</h3>
<p>Goal: test a "Sign up" form. Survive: button → Pressable; div → fieldset; class → Tailwind; controlled → uncontrolled.</p>
<pre><code class="language-javascript">import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('submits the form with email and password', async () =&gt; {
  const onSubmit = vi.fn();
  render(&lt;SignUp onSubmit={onSubmit} /&gt;);
  const user = userEvent.setup();

  await user.type(screen.getByLabelText(/email/i), 'p@x.com');
  await user.type(screen.getByLabelText(/password/i), 'hunter2hunter2');
  await user.click(screen.getByRole('button', { name: /sign up/i }));

  expect(onSubmit).toHaveBeenCalledWith({
    email: 'p@x.com',
    password: 'hunter2hunter2',
  });
});
</code></pre>
<p>Notes: queries by <em>role + accessible name</em>; never selects by class or test ID for visible elements; uses <code>userEvent</code> for realistic interactions (focus, typing, blur).</p>

<h3>Example 2: When unit beats integration</h3>
<p>Goal: a date utility that computes "days until next billing cycle."</p>
<pre><code class="language-javascript">// 50 lines of edge cases; perfect unit-test fodder
import { daysUntilNextBilling } from './billing';

test.each([
  ['2026-04-30', '2026-05-01', 1],
  ['2026-04-30', '2026-04-30', 0],
  ['2026-12-31', '2027-01-15', 15],
  // … leap years, month-end edges, timezone shifts
])('from %s, billing on %s → %i days', (today, anchor, expected) =&gt; {
  expect(daysUntilNextBilling(new Date(today), new Date(anchor))).toBe(expected);
});
</code></pre>
<p>Pure function + edge cases = unit test. Don't run a JSDOM render to test this.</p>

<h3>Example 3: Mocking only at boundaries</h3>
<pre><code class="language-javascript">// BAD — mocks the implementation under test
vi.mock('./userApi');
import { fetchUser } from './userApi';

test('renders user', async () =&gt; {
  fetchUser.mockResolvedValue({ id: 1, name: 'P' });
  render(&lt;UserCard id={1} /&gt;);
  expect(await screen.findByText('P')).toBeVisible();
});

// GOOD — mocks the network, tests the real flow through the real fetcher
import { server } from '../tests/msw';
import { http, HttpResponse } from 'msw';

beforeEach(() =&gt; server.use(
  http.get('/api/users/1', () =&gt; HttpResponse.json({ id: 1, name: 'P' }))
));

test('renders user', async () =&gt; {
  render(&lt;UserCard id={1} /&gt;);
  expect(await screen.findByText('P')).toBeVisible();
});
</code></pre>
<p>The MSW version exercises the fetcher, the parser, the cache, the renderer. The mock-the-module version exercises only the renderer.</p>

<h3>Example 4: TDD for an algorithm</h3>
<p>Goal: implement a function that compresses repeated chars: <code>"aaabb" → "a3b2"</code>, returns original if compression isn't shorter.</p>
<ol>
  <li>Red: <code>test('compresses repeated chars', () =&gt; expect(compress('aaabb')).toBe('a3b2'));</code> — fails.</li>
  <li>Green: minimal loop that builds the compressed string.</li>
  <li>Refactor: clean up; extract counter.</li>
  <li>Add: <code>test('returns original when shorter', () =&gt; expect(compress('ab')).toBe('ab'));</code></li>
  <li>Add: empty string, single char, all same char, very long.</li>
</ol>
<p>TDD pays off here: edges keep nudging the implementation toward correctness.</p>

<h3>Example 5: Behaviour test for an async UI</h3>
<pre><code class="language-javascript">test('shows loading, then results, then empty state', async () =&gt; {
  const fetcher = vi.fn()
    .mockResolvedValueOnce([{ id: 1, label: 'apple' }])
    .mockResolvedValueOnce([]);

  render(&lt;Search fetcher={fetcher} /&gt;);
  const user = userEvent.setup();

  await user.type(screen.getByRole('searchbox'), 'apple');
  expect(await screen.findByText(/loading/i)).toBeVisible();
  expect(await screen.findByText('apple')).toBeVisible();

  await user.clear(screen.getByRole('searchbox'));
  await user.type(screen.getByRole('searchbox'), 'banana');
  expect(await screen.findByText(/no results/i)).toBeVisible();
});
</code></pre>

<h3>Example 6: Test that earned its keep (regression)</h3>
<p>Bug shipped: paying-customer feature flag was off due to a typo in flag name. Engineers thought "this is hard to test." Real test:</p>
<pre><code class="language-javascript">test.each(Object.keys(featureFlags))(
  'flag "%s" is registered with the flag service',
  (key) =&gt; {
    expect(remoteFlagService.knownFlags).toContain(key);
  }
);
</code></pre>
<p>Static-ish test that catches a class of bugs (typos in flag names) for ~5 lines of code. The cheapest tests catch the most.</p>

<h3>Example 7: Anti-test (delete it)</h3>
<pre><code class="language-javascript">// BAD — tests TS would catch
test('Button takes a label prop', () =&gt; {
  expect(typeof Button.propTypes.label).toBe('object'); // ???
});

// BAD — tests internals
test('useState is called once', () =&gt; {
  const spy = vi.spyOn(React, 'useState');
  render(&lt;Counter /&gt;);
  expect(spy).toHaveBeenCalledTimes(1);
});

// BAD — pinning UI text
test('renders correctly', () =&gt; {
  expect(render(&lt;Welcome /&gt;).asFragment()).toMatchSnapshot();
});
</code></pre>
<p>None of these catch bugs. Each one breaks under benign refactors. Delete.</p>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>Time, randomness, and the network</h3>
<table>
  <thead><tr><th>Source</th><th>Strategy</th></tr></thead>
  <tbody>
    <tr><td>Time (<code>Date.now</code>, <code>setTimeout</code>)</td><td>Fake clocks (<code>vi.useFakeTimers()</code> / <code>jest.useFakeTimers()</code>)</td></tr>
    <tr><td>Random (<code>Math.random</code>, UUIDs)</td><td>Inject the RNG; mock with seed; assert on shape, not value</td></tr>
    <tr><td>Network</td><td>MSW; never <code>fetch.mockResolvedValue</code> at the call site</td></tr>
    <tr><td>File system</td><td>memfs / tmpdir; never write to repo</td></tr>
    <tr><td>Crypto</td><td>Inject; mock signing in unit tests; real crypto in integration</td></tr>
  </tbody>
</table>

<h3>Async + timers + React</h3>
<ul>
  <li><code>findBy*</code> queries auto-retry; use them for things that appear after a tick.</li>
  <li><code>waitFor</code> for assertions that aren't tied to a query.</li>
  <li>If using fake timers, advance with <code>vi.advanceTimersByTimeAsync(ms)</code>; otherwise debounced effects never fire.</li>
  <li>Don't <code>await new Promise(r =&gt; setTimeout(r, 0))</code> as a hack — use <code>findBy</code>.</li>
</ul>

<h3>Flaky test taxonomy</h3>
<table>
  <thead><tr><th>Cause</th><th>Symptom</th><th>Fix</th></tr></thead>
  <tbody>
    <tr><td>Race condition</td><td>Passes locally, fails in CI</td><td>Wait for state, not time; use <code>findBy</code></td></tr>
    <tr><td>Shared state</td><td>Passes alone, fails in suite</td><td>Reset between tests; isolate</td></tr>
    <tr><td>Animation timing</td><td>Sometimes flake</td><td>Disable animations; <code>prefers-reduced-motion</code>; deterministic transitions</td></tr>
    <tr><td>Unmocked time</td><td>Flakes near month boundaries</td><td>Fake the clock</td></tr>
    <tr><td>Network in test</td><td>Flakes on bad network</td><td>Mock at <code>fetch</code> with MSW</td></tr>
    <tr><td>UI-thread starvation</td><td>Slow CI machines</td><td>Increase timeout; parallelize less; debug with traces</td></tr>
  </tbody>
</table>

<h3>Coverage as a smell</h3>
<ul>
  <li>100% coverage with mocks all the way down = false confidence.</li>
  <li>50% coverage with focused integration tests = real confidence.</li>
  <li>Coverage is useful as a <em>regression-prevention floor</em> ("don't drop below 60%"); not a goal.</li>
  <li>Watch line vs branch coverage — line is easy to inflate, branch isn't.</li>
</ul>

<h3>Mobile / RN-specific edges</h3>
<ul>
  <li><strong>Device fragmentation:</strong> a behaviour test in JSDOM doesn't exercise iOS keyboard, Android back button, or native gestures.</li>
  <li><strong>Detox / Maestro</strong> for native flows — slow, but the only way to catch true mobile-only bugs.</li>
  <li><strong>OS-version drift:</strong> iOS 16 vs 17 vs 18 behave differently; test on a matrix or accept your risk.</li>
  <li><strong>Slow CI:</strong> emulator boot is minutes; budget accordingly.</li>
  <li><strong>Native modules:</strong> mock or stub at the JS bridge boundary; integration test on device.</li>
  <li><strong>Network:</strong> mock with <code>fetch-mock</code> or MSW (works in RN with Node 18+).</li>
</ul>

<h3>The "test only what changed" trap</h3>
<p>"We only test new code" → quickly drifts into "old code has no tests." Either invest in retro coverage on critical paths or accept the gap explicitly. Pretending it's fine because new code is tested is the lie that produces production fires.</p>

<h3>The "100% TDD" trap</h3>
<p>TDD shines for code where you can express expected behaviour clearly before writing it. UI exploration, layout, design discovery — TDD slows you down without help. Use it where it fits; skip it where it doesn't.</p>

<h3>The "test the test" infinite regress</h3>
<p>Tests are simple by design — usually a single behavioural assertion. If your test code needs its own tests, the test is doing too much. Split or simplify.</p>

<h3>Accessibility-aware queries</h3>
<p>RTL's role-based queries double as a11y tests. <code>getByRole('button')</code> fails if your button is a <code>div</code>. Cheap a11y win.</p>

<h3>The "snapshot graveyard"</h3>
<ul>
  <li>Snapshots accumulate; nobody reads them; updates are blind <code>--u</code>.</li>
  <li>Audit periodically — if a snapshot has been "blind-updated" in the last 5 PRs, delete it.</li>
  <li>Limit snapshots to: serialisation, generated CSS, complex AST output. Not entire UI trees.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common testing-philosophy mistakes</h3>
<ol>
  <li><strong>Coverage as goal.</strong> Hits 80% by mocking everything; catches nothing.</li>
  <li><strong>Implementation tests.</strong> Refactor breaks 200 tests; nothing user-facing changed.</li>
  <li><strong>Snapshot abuse.</strong> One <code>toMatchSnapshot</code> per render; updated by reflex.</li>
  <li><strong>Mock-everything unit tests.</strong> Tests pass; integration breaks.</li>
  <li><strong>E2E for everything.</strong> Slow CI, flaky pipelines, low confidence.</li>
  <li><strong>Flake tolerance.</strong> "Just rerun it" — the suite slowly stops mattering.</li>
  <li><strong>Tests that need their own tests.</strong> Setup helpers with branching logic; abstractions on abstractions.</li>
  <li><strong>Test names that don't describe behaviour.</strong> <code>test('it works')</code>, <code>test('returns true')</code>.</li>
  <li><strong>Order-dependent tests.</strong> Pass when run alphabetically; fail randomized.</li>
  <li><strong>Tests written after the bug shipped.</strong> No regression test means the bug ships again.</li>
  <li><strong>One giant test per feature.</strong> 50 assertions in one <code>test()</code>; first failure hides the rest.</li>
  <li><strong>Skipped/xit'd tests piling up.</strong> "We'll fix it later" → never. Delete or fix.</li>
</ol>

<h3>Anti-pattern: testing private methods</h3>
<pre><code class="language-javascript">// BAD — exposes internals; refactor breaks it
test('_validatePassword returns false for short input', () =&gt; {
  expect(form._validatePassword('abc')).toBe(false);
});

// GOOD — tests the behaviour through the public API
test('shows length error when password is too short', async () =&gt; {
  render(&lt;Form /&gt;);
  await user.type(screen.getByLabelText(/password/i), 'abc');
  await user.click(screen.getByRole('button', { name: /sign up/i }));
  expect(await screen.findByText(/at least 8 chars/i)).toBeVisible();
});
</code></pre>

<h3>Anti-pattern: testing the framework</h3>
<pre><code class="language-javascript">// BAD — proves React works
test('useState updates the value', () =&gt; {
  const { result } = renderHook(() =&gt; useState(0));
  act(() =&gt; result.current[1](1));
  expect(result.current[0]).toBe(1);
});
</code></pre>

<h3>Anti-pattern: shallow rendering</h3>
<p>Enzyme's <code>shallow</code> renders the outer component but stubs children. RTL deliberately doesn't support it — testing UI in isolation from its actual children gives confidence in something that doesn't exist in production. Render the real tree.</p>

<h3>Anti-pattern: querying by class / test ID for visible elements</h3>
<pre><code class="language-javascript">// BAD — tied to implementation
const { container } = render(&lt;Card /&gt;);
const heading = container.querySelector('.card-title');

// BAD — extra attribute clutter
&lt;h2 data-testid="card-title"&gt;{title}&lt;/h2&gt;

// GOOD — semantic query
const heading = screen.getByRole('heading', { name: /the title/i });
</code></pre>
<p><code>data-testid</code> is fine for genuinely semantically-empty containers (e.g., a wrapper div for animation), but never for buttons, headings, links, inputs, etc.</p>

<h3>Anti-pattern: 100% mocked unit tests</h3>
<p>Every dependency mocked; the only real code under test is one function. You've effectively reimplemented the function in the mocks. The bug case the mocks didn't anticipate ships.</p>

<h3>Anti-pattern: arbitrary <code>setTimeout</code> in tests</h3>
<pre><code class="language-javascript">// BAD — flaky on slow CI
await new Promise(r =&gt; setTimeout(r, 100));
expect(screen.getByText('Done')).toBeVisible();

// GOOD — wait for the actual condition
expect(await screen.findByText('Done')).toBeVisible();
</code></pre>

<h3>Anti-pattern: console-pollution swallowing</h3>
<pre><code class="language-javascript">// BAD — hides real warnings
beforeEach(() =&gt; vi.spyOn(console, 'error').mockImplementation(() =&gt; {}));

// GOOD — fail tests on unexpected console.error
beforeEach(() =&gt; {
  vi.spyOn(console, 'error').mockImplementation((msg) =&gt; {
    throw new Error(\`Unexpected console.error: \${msg}\`);
  });
});
</code></pre>

<h3>Anti-pattern: shared state between test files</h3>
<p>Tests in <code>file-A.test.js</code> mutate a singleton; <code>file-B.test.js</code> sees the changes. Tests pass alone, fail together. Use modules with explicit setup/teardown; never modify globals across files.</p>

<h3>Anti-pattern: golden files outside source control</h3>
<p>If your tests rely on files in <code>/tmp</code> or environment, CI machines fail mysteriously. Vendor everything; <code>git add</code> all fixtures.</p>

<h3>Anti-pattern: skipping flaky tests instead of fixing</h3>
<p><code>test.skip</code> piles up. Either fix the test, delete it, or move it to a quarantine suite that doesn't block merges but still runs.</p>

<h3>Anti-pattern: "the test broke; revert the test"</h3>
<p>If a test was protecting a behaviour, deleting it because it's inconvenient is a future-bug subscription. Either prove the behaviour is no longer needed (then update the spec, then the test) or fix the code.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common testing-philosophy interview prompts</h3>
<ol>
  <li>How would you test this component / function / feature?</li>
  <li>What's your testing strategy at $LAST_COMPANY?</li>
  <li>How do you decide what to test?</li>
  <li>How do you deal with flaky tests?</li>
  <li>When do you reach for E2E vs integration vs unit?</li>
  <li>What's your stance on TDD?</li>
  <li>How do you balance test speed and confidence?</li>
  <li>Tell me about a time tests caught a bug / failed to catch a bug.</li>
</ol>

<h3>The 5-step framework for "how would you test X?"</h3>
<ol>
  <li><strong>Identify the bug classes:</strong> what could go wrong? (logic errors, async races, integration drift, regressions.)</li>
  <li><strong>Map bug classes to test layers:</strong> static catches typos; unit catches logic; integration catches user-facing; E2E catches critical paths.</li>
  <li><strong>Pick the cheapest layer that gives confidence:</strong> prefer integration over E2E unless cross-system.</li>
  <li><strong>Mock at boundaries, not internals:</strong> network with MSW; everything else real.</li>
  <li><strong>Name what you'd skip and why:</strong> seniority signal — "I wouldn't snapshot this", "I wouldn't unit-test the view layer here, integration covers it".</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"Tests should resemble how the software is used — query by role, not by class."</em></li>
  <li><em>"Behaviour over implementation; refactors should not break tests."</em></li>
  <li><em>"Trophy shape: lots of integration, few E2E. Most bugs live in component-cooperation, and integration tests on JSDOM are fast."</em></li>
  <li><em>"Mock at the network with MSW — exercises the real fetcher, parser, cache, renderer."</em></li>
  <li><em>"Coverage is a floor, not a goal. 80% with snapshots gives less confidence than 60% with focused integration."</em></li>
  <li><em>"TDD where it helps me think — algorithms, edges, bug fixes. Skip it for UI exploration."</em></li>
  <li><em>"Track flake rate as a real metric. Quarantine flaky tests; budget time to fix."</em></li>
  <li><em>"Test critical paths with E2E; everything else with integration."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt keyword</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"how would you test this form"</td><td>RTL integration with userEvent; MSW for network</td></tr>
    <tr><td>"how would you test this util"</td><td>Pure unit test; consider property-based</td></tr>
    <tr><td>"end to end of payments"</td><td>Critical-path E2E with Playwright; idempotency keys; fixtures with test API keys</td></tr>
    <tr><td>"prevent flakes"</td><td><code>findBy</code>, fake timers, MSW, no real network, isolated state, retry-on-CI not retry-blindly</td></tr>
    <tr><td>"micro-services drift"</td><td>Contract testing with Pact</td></tr>
    <tr><td>"design system regression"</td><td>Visual regression (Chromatic / Playwright snapshot)</td></tr>
    <tr><td>"mobile-only bug"</td><td>Detox / Maestro on emulator; staging on real device</td></tr>
    <tr><td>"covers all edges"</td><td>fast-check property-based test</td></tr>
  </tbody>
</table>

<h3>Demo script (whiteboard / spec)</h3>
<ol>
  <li>State what could go wrong (bug classes).</li>
  <li>Pick the cheapest layer per bug class.</li>
  <li>Sketch one integration test from a user's POV.</li>
  <li>Sketch one unit test for a hot pure function.</li>
  <li>Talk about what you'd <em>not</em> test and why.</li>
  <li>Talk about flake mitigation and trust budget.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"Add property-based tests for the encoder/decoder."</em></li>
  <li><em>"Add a contract test against the orders service."</em></li>
  <li><em>"Visual regression on key design-system components."</em></li>
  <li><em>"Mutation testing once — audit suite quality."</em></li>
  <li><em>"Auto-quarantine flaky tests; weekly fix rotation."</em></li>
  <li><em>"E2E only on critical paths; integration covers the rest."</em></li>
  <li><em>"Test naming + AAA structure enforced via ESLint."</em></li>
  <li><em>"Failure analytics dashboard — who flakes, what changes correlate."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Test-shape fluency</td><td>Names Trophy / Pyramid; chooses by domain</td></tr>
    <tr><td>Behaviour-first instinct</td><td>Queries by role, not by class</td></tr>
    <tr><td>Mocking discipline</td><td>Mocks at boundaries (MSW), not internals</td></tr>
    <tr><td>Flake awareness</td><td>Names sources + fixes</td></tr>
    <tr><td>TDD nuance</td><td>Uses where it helps, skips where it doesn't</td></tr>
    <tr><td>Coverage maturity</td><td>Treats coverage as floor, not goal</td></tr>
    <tr><td>Restraint</td><td>Names tests they'd delete; not just what they'd add</td></tr>
    <tr><td>Mobile empathy</td><td>Names emulator / device strategy for RN</td></tr>
    <tr><td>Communication</td><td>Tradeoffs spoken; not silent</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>Trophy applies, but with native module shims at the boundary. Most logic-layer testing happens in Jest + RTL with mocked native modules.</li>
  <li>Native flow tests on Detox (US-style, JS-driven) or Maestro (declarative YAML, faster setup) or EAS-managed cloud devices.</li>
  <li>Visual regression matters more on mobile — different OS versions render differently.</li>
  <li>Real-device test sparingly; emulators / simulators for the bulk; cloud device farms (BrowserStack, Sauce, AWS Device Farm) for matrix coverage.</li>
  <li>Performance tests (cold start, JS thread time, frame drops) are a separate test track; not part of behavioural CI.</li>
  <li>OS-version matrix: target latest + N-1; document deviations.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"Tell me about a test you deleted."</em> — Demonstrates judgement; pure-coverage tests, snapshot-of-everything tests, framework-pinning tests.</li>
  <li><em>"What's the right ratio of unit to integration?"</em> — "It depends on the domain. Pure logic = unit-heavy. UI / cooperation = integration-heavy. Same ratio is suspicious."</li>
  <li><em>"How do you know your tests are good?"</em> — Mutation testing periodically; bugs that escape into prod indicate suite gaps; flake rate; engineer trust survey.</li>
  <li><em>"How do you handle a flaky test?"</em> — Fix at root cause (race condition, timing, shared state); never blindly retry. Quarantine with deadline.</li>
  <li><em>"How do you onboard juniors to a test culture?"</em> — Pair on review; write the first test together for their first PR; share team conventions; lead with examples in <code>CONTRIBUTING.md</code>.</li>
  <li><em>"How do you test a feature you don't have requirements for?"</em> — Test what you observe in the design / mock; surface ambiguity to PM; don't TDD specs you haven't agreed on.</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Read Kent C. Dodds's "Common Mistakes with React Testing Library" + Trophy article.</li>
  <li>Memorise the 5-step "how would you test X" framework.</li>
  <li>Build a tiny project with Trophy-shaped tests end to end.</li>
  <li>Learn MSW well — it's the modern mocking primitive.</li>
  <li>Practice 3 tradeoff lines for live use.</li>
  <li>Have an answer to "tell me about a test that caught a bug" + "a test that didn't."</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read the testing chapters of <em>Working Effectively with Legacy Code</em> by Michael Feathers."</li>
  <li>"Watch Hillel Wayne's talks on property-based testing."</li>
  <li>"Compare Detox vs Maestro on a small RN app — feel the tradeoffs."</li>
  <li>"Audit one of your prior projects: which tests would you delete now?"</li>
</ul>
`
    }
  ]
});
