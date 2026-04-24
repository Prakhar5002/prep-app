window.PREP_SITE.registerTopic({
  id: 'react-testing',
  module: 'React Deep',
  title: 'Testing',
  estimatedReadTime: '26 min',
  tags: ['react', 'testing', 'jest', 'rtl', 'testing-library', 'e2e', 'mocking', 'msw'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>React testing follows the "test what the user experiences" philosophy popularized by Testing Library. Unit-test pure functions and hooks; integration-test components via the DOM they render; E2E-test critical flows in a real browser.</p>
<ul>
  <li><strong>Jest / Vitest</strong> run your tests, mocking modules, providing <code>expect</code>, running in JSDOM or Node.</li>
  <li><strong>React Testing Library (RTL)</strong> renders a component and provides queries (<code>getByRole</code>, <code>findByText</code>, etc.) that encourage accessibility-first selectors.</li>
  <li><strong>MSW (Mock Service Worker)</strong> intercepts HTTP at the network layer — use the real fetch code path in tests, return canned responses.</li>
  <li><strong>user-event</strong> simulates real user interactions (typing, clicking) more realistically than <code>fireEvent</code>.</li>
  <li><strong>Playwright / Cypress</strong> for E2E tests in real browsers. Slower, more expensive, reserve for critical paths.</li>
  <li>Golden rule: avoid testing <em>implementation details</em> (state names, internal method calls). Test behavior: "when I click X, I see Y."</li>
  <li>For React Native: <strong>Jest + RNTL</strong> for unit/integration; <strong>Detox</strong> or <strong>Maestro</strong> for E2E.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Test the component the way a user uses it, not the way it's implemented. Selectors should reflect accessibility; assertions should reflect user-visible outcomes. If a refactor changes internal state but the UI behaves the same, the test should still pass.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>The testing pyramid (or trophy)</h3>
<p>Classic advice: many unit tests, fewer integration tests, few E2E. Kent C. Dodds popularized the "testing trophy": heavy investment in integration tests (which exercise several units together and catch more real bugs) with fewer unit tests and some E2E at the top.</p>
<ul>
  <li><strong>Static:</strong> TypeScript, ESLint, type-check errors. Free bug prevention.</li>
  <li><strong>Unit:</strong> isolated pure functions, a single hook with renderHook. Fast; brittle if over-applied to implementation details.</li>
  <li><strong>Integration:</strong> a component + its children, mocking external services (MSW). Best ratio of bugs-caught to test-cost.</li>
  <li><strong>E2E:</strong> the real app in a real browser, hitting real (or staged) backends. Slow but catches wiring / infrastructure issues.</li>
</ul>

<h3>Why avoid testing implementation details?</h3>
<p>If your test asserts "state.count === 1" or "componentDidMount was called," then a refactor that produces the same UI breaks your test. Tests become maintenance burden rather than safety net. Test observable behavior: click the button → the counter reads "1." Refactor the state implementation freely.</p>

<h3>Why RTL's "accessibility-first" queries?</h3>
<p>RTL prefers <code>getByRole('button', { name: /save/i })</code> over <code>getByTestId('save-btn')</code>. Why?</p>
<ol>
  <li><strong>Accessibility is tested implicitly.</strong> If the button isn't reachable by screen readers, the test can't find it either.</li>
  <li><strong>Tests read like user instructions.</strong> "Click the 'Save' button" is clearer than "click the element with testid 'save-btn'."</li>
  <li><strong>Resilient to restyling.</strong> Changing from <code>&lt;button&gt;</code> to <code>&lt;a role="button"&gt;</code> or swapping CSS classes doesn't break tests.</li>
</ol>

<h3>Why use MSW?</h3>
<p>Alternative: mock <code>fetch</code> / axios module-wide. Problems: your real fetch logic (headers, retries, error mapping) is bypassed; every test file redeclares mocks; behavior drifts from production. MSW intercepts at the network layer — your app uses real <code>fetch</code>, MSW answers. Same mocks work in tests, Storybook, and local dev.</p>

<h3>Why user-event over fireEvent?</h3>
<p><code>fireEvent.click(btn)</code> fires a single click event. But real user interactions involve sequences: focus, mousedown, mouseup, click, input, change. <code>userEvent.click(btn)</code> fires the full sequence, catching bugs like "click handler doesn't run because focus moved away on mousedown." Use user-event for behavior; <code>fireEvent</code> only when you need to fire a specific event type directly.</p>

<h3>Why E2E in a real browser?</h3>
<p>JSDOM is a fake DOM — no layout, no rendering, limited CSS, no real events. A button visible in JSDOM might be off-screen in a real browser. Playwright/Cypress launch a real Chrome/Firefox, run your app, interact with real events, take screenshots. Catches integration issues invisible to unit tests.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "priorities of queries" (RTL)</h3>
<ol>
  <li><code>getByRole</code> — how assistive tech locates elements.</li>
  <li><code>getByLabelText</code> — form inputs.</li>
  <li><code>getByPlaceholderText</code> — when there's no label.</li>
  <li><code>getByText</code> — non-interactive text.</li>
  <li><code>getByDisplayValue</code> — current input value.</li>
  <li><code>getByAltText</code> — images.</li>
  <li><code>getByTitle</code> — tooltips.</li>
  <li><code>getByTestId</code> — last resort; sign of a hard-to-test UI or dynamic content.</li>
</ol>

<h3>The three query types</h3>
<table>
  <thead><tr><th>Variant</th><th>Found</th><th>Not found</th><th>Multiple found</th></tr></thead>
  <tbody>
    <tr><td><code>getBy*</code></td><td>element</td><td>throws</td><td>throws</td></tr>
    <tr><td><code>queryBy*</code></td><td>element</td><td>null</td><td>throws</td></tr>
    <tr><td><code>findBy*</code></td><td>element (async)</td><td>throws after timeout</td><td>throws</td></tr>
    <tr><td><code>getAllBy* / queryAllBy* / findAllBy*</code></td><td>array</td><td>per above</td><td>array</td></tr>
  </tbody>
</table>
<p>Rules of thumb: <code>getBy</code> when element <em>should</em> exist. <code>queryBy</code> when asserting absence (<code>expect(queryByText(...)).toBeNull()</code>). <code>findBy</code> for async (wait until visible).</p>

<h3>The "arrange / act / assert" picture</h3>
<pre><code class="language-js">test('increments counter', async () =&gt; {
  // arrange
  render(&lt;Counter/&gt;);
  const btn = screen.getByRole('button', { name: /increment/i });

  // act
  await userEvent.click(btn);

  // assert
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});</code></pre>

<h3>The "mock what you don't own" principle</h3>
<p>Don't mock your own modules — that's testing mocks, not your code. Do mock external boundaries: HTTP (via MSW), modules with side effects (analytics), time (Jest timers). Refactor hard-to-test code to isolate boundaries rather than reaching for a module mock.</p>

<h3>The "test pyramid allocation" guidance</h3>
<div class="diagram">
<pre>
            ╱╲
           ╱E2╲         ← 5%    critical flows, real browser
          ╱────╲
         ╱ INT  ╲       ← 50%   component + children + MSW
        ╱────────╲
       ╱  UNIT    ╲     ← 40%   pure fns, hooks, small components
      ╱────────────╲
     ╱    STATIC    ╲   ← ?     TypeScript, ESLint (free, always-on)
    ╱────────────────╲
</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"100% code coverage means the code is well-tested." Coverage counts executed lines, not asserted behavior. You can have 100% coverage with zero meaningful assertions. Focus on critical user flows and edge cases, not chasing a number.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Jest / Vitest setup</h3>
<p>Jest is the classic React runner (bundled with CRA). Vitest is the Vite-native equivalent — faster, Jest-compatible APIs, better ESM. For React 18+ and modern stacks, Vitest is often the default choice.</p>
<pre><code class="language-js">// vite.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', setupFiles: ['./test-setup.ts'] }
});</code></pre>

<h3>Testing Library basics</h3>
<pre><code class="language-js">import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Counter from './Counter';

test('counter', async () =&gt; {
  render(&lt;Counter/&gt;);
  expect(screen.getByText(/count: 0/i)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /\+/ }));
  expect(screen.getByText(/count: 1/i)).toBeInTheDocument();
});</code></pre>

<h3>Async UI — findBy / waitFor</h3>
<pre><code class="language-js">render(&lt;AsyncList/&gt;);
// Loading state
expect(screen.getByText(/loading/i)).toBeInTheDocument();
// Wait until data loaded
expect(await screen.findByText(/ada/i)).toBeInTheDocument();
// Or generic wait:
await waitFor(() =&gt; expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());</code></pre>

<h3>MSW — mock at the network layer</h3>
<pre><code class="language-js">// mocks/handlers.ts
import { http, HttpResponse } from 'msw';
export const handlers = [
  http.get('/api/user/:id', ({ params }) =&gt; HttpResponse.json({ id: params.id, name: 'Ada' })),
  http.post('/api/user', async ({ request }) =&gt; HttpResponse.json(await request.json(), { status: 201 })),
];

// mocks/server.ts (Node)
import { setupServer } from 'msw/node';
import { handlers } from './handlers';
export const server = setupServer(...handlers);

// test-setup.ts
beforeAll(() =&gt; server.listen());
afterEach(() =&gt; server.resetHandlers());
afterAll(() =&gt; server.close());

// Tests make real fetch calls; MSW intercepts them.</code></pre>

<h3>Per-test override of MSW handlers</h3>
<pre><code class="language-js">test('shows error', async () =&gt; {
  server.use(http.get('/api/user/:id', () =&gt; HttpResponse.json({ error: 'nope' }, { status: 500 })));
  render(&lt;UserProfile id="1"/&gt;);
  expect(await screen.findByText(/error/i)).toBeInTheDocument();
});</code></pre>

<h3>Testing hooks (renderHook)</h3>
<pre><code class="language-js">import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

test('counter', () =&gt; {
  const { result } = renderHook(() =&gt; useCounter(5));
  expect(result.current.count).toBe(5);
  act(() =&gt; result.current.increment());
  expect(result.current.count).toBe(6);
});</code></pre>
<p>Wrap hook interactions in <code>act</code> to flush React updates. <code>renderHook</code> returns <code>result.current</code> (rebuilt on each render).</p>

<h3>Fake timers for time-based code</h3>
<pre><code class="language-js">beforeEach(() =&gt; vi.useFakeTimers());
afterEach(() =&gt; vi.useRealTimers());

test('debounce', async () =&gt; {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(&lt;Search/&gt;);
  await user.type(screen.getByRole('searchbox'), 'hello');
  vi.advanceTimersByTime(500);
  expect(await screen.findByText(/results for hello/i)).toBeInTheDocument();
});</code></pre>

<h3>Mocking modules (last resort)</h3>
<pre><code class="language-js">vi.mock('./analytics', () =&gt; ({
  track: vi.fn(),
}));
import { track } from './analytics';
// In test:
expect(track).toHaveBeenCalledWith('click', { id: 1 });</code></pre>

<h3>Testing error boundaries</h3>
<pre><code class="language-js">function ThrowingChild() { throw new Error('boom'); }

test('shows error boundary fallback', () =&gt; {
  // Silence React's error log
  vi.spyOn(console, 'error').mockImplementation(() =&gt; {});
  render(&lt;ErrorBoundary fallback={&lt;div&gt;oops&lt;/div&gt;}&gt;&lt;ThrowingChild/&gt;&lt;/ErrorBoundary&gt;);
  expect(screen.getByText(/oops/i)).toBeInTheDocument();
});</code></pre>

<h3>Testing context providers</h3>
<pre><code class="language-js">function renderWithProviders(ui, options = {}) {
  const Providers = ({ children }) =&gt; (
    &lt;QueryClientProvider client={new QueryClient()}&gt;
      &lt;MemoryRouter&gt;{children}&lt;/MemoryRouter&gt;
    &lt;/QueryClientProvider&gt;
  );
  return render(ui, { wrapper: Providers, ...options });
}</code></pre>
<p>Extract a <code>renderWithProviders</code> helper when many tests need the same providers.</p>

<h3>Snapshot tests (use sparingly)</h3>
<pre><code class="language-js">expect(container.firstChild).toMatchSnapshot();</code></pre>
<p>Good for preventing unintentional markup changes, bad for assertions (changes silently pass after <code>-u</code>). Most teams limit snapshots to stable, visually-reviewable subtrees.</p>

<h3>E2E with Playwright</h3>
<pre><code class="language-js">import { test, expect } from '@playwright/test';
test('sign up flow', async ({ page }) =&gt; {
  await page.goto('/signup');
  await page.getByLabel('Email').fill('a@b.com');
  await page.getByLabel('Password').fill('secret');
  await page.getByRole('button', { name: /create/i }).click();
  await expect(page).toHaveURL('/welcome');
});</code></pre>

<h3>Visual regression</h3>
<p>Tools like Percy, Chromatic, Argos take screenshots on each PR and diff visually. Great for catching unintentional style regressions, typography changes, off-by-a-pixel issues that assertions don't catch.</p>

<h3>Testing React Native</h3>
<pre><code class="language-js">import { render, fireEvent } from '@testing-library/react-native';
test('tap increments', () =&gt; {
  const { getByRole } = render(&lt;Counter/&gt;);
  fireEvent.press(getByRole('button'));
  expect(getByRole('text')).toHaveTextContent('1');
});</code></pre>
<p>For E2E: Detox (iOS/Android, deterministic sync), Maestro (YAML flows, works cross-platform).</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — simple interaction</h3>
<pre><code class="language-js">import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from './LoginForm';

test('submits with credentials', async () =&gt; {
  const onSubmit = vi.fn();
  render(&lt;LoginForm onSubmit={onSubmit}/&gt;);
  await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
  await userEvent.type(screen.getByLabelText(/password/i), 'hunter2');
  await userEvent.click(screen.getByRole('button', { name: /log in/i }));
  expect(onSubmit).toHaveBeenCalledWith({ email: 'a@b.com', password: 'hunter2' });
});</code></pre>

<h3>Example 2 — async fetching</h3>
<pre><code class="language-js">test('shows user data', async () =&gt; {
  render(&lt;UserProfile id="1"/&gt;);
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
  expect(await screen.findByText(/ada lovelace/i)).toBeInTheDocument();
});</code></pre>

<h3>Example 3 — error state via MSW override</h3>
<pre><code class="language-js">test('shows error on server 500', async () =&gt; {
  server.use(http.get('/api/user/:id', () =&gt; HttpResponse.json({}, { status: 500 })));
  render(&lt;UserProfile id="1"/&gt;);
  expect(await screen.findByRole('alert')).toHaveTextContent(/something went wrong/i);
});</code></pre>

<h3>Example 4 — form validation</h3>
<pre><code class="language-js">test('shows validation errors', async () =&gt; {
  render(&lt;SignupForm/&gt;);
  await userEvent.click(screen.getByRole('button', { name: /create/i }));
  expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  expect(screen.getByText(/password is required/i)).toBeInTheDocument();
});</code></pre>

<h3>Example 5 — hooks with renderHook</h3>
<pre><code class="language-js">test('useCounter', () =&gt; {
  const { result, rerender } = renderHook(({ initial }) =&gt; useCounter(initial), {
    initialProps: { initial: 10 }
  });
  act(() =&gt; result.current.inc());
  expect(result.current.count).toBe(11);
  rerender({ initial: 20 });
  // Note: useCounter probably won't reset on rerender — that tests your hook's behavior.
});</code></pre>

<h3>Example 6 — context-dependent component</h3>
<pre><code class="language-js">test('shows theme', () =&gt; {
  render(
    &lt;ThemeCtx.Provider value="dark"&gt;
      &lt;ThemedButton/&gt;
    &lt;/ThemeCtx.Provider&gt;
  );
  expect(screen.getByRole('button')).toHaveAttribute('data-theme', 'dark');
});</code></pre>

<h3>Example 7 — routing</h3>
<pre><code class="language-js">import { MemoryRouter, Routes, Route } from 'react-router-dom';
test('navigates to user page', async () =&gt; {
  render(
    &lt;MemoryRouter initialEntries={['/']}&gt;
      &lt;Routes&gt;
        &lt;Route path="/" element={&lt;Home/&gt;}/&gt;
        &lt;Route path="/user/:id" element={&lt;User/&gt;}/&gt;
      &lt;/Routes&gt;
    &lt;/MemoryRouter&gt;
  );
  await userEvent.click(screen.getByRole('link', { name: /profile/i }));
  expect(screen.getByRole('heading', { name: /user profile/i })).toBeInTheDocument();
});</code></pre>

<h3>Example 8 — React Query</h3>
<pre><code class="language-js">function wrapper({ children }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return &lt;QueryClientProvider client={qc}&gt;{children}&lt;/QueryClientProvider&gt;;
}
test('fetches user', async () =&gt; {
  render(&lt;UserProfile id="1"/&gt;, { wrapper });
  expect(await screen.findByText(/ada/i)).toBeInTheDocument();
});</code></pre>

<h3>Example 9 — timer-dependent code</h3>
<pre><code class="language-js">test('shows message after 3 seconds', async () =&gt; {
  vi.useFakeTimers();
  render(&lt;DelayedToast/&gt;);
  expect(screen.queryByRole('alert')).toBeNull();
  act(() =&gt; vi.advanceTimersByTime(3000));
  expect(screen.getByRole('alert')).toBeInTheDocument();
  vi.useRealTimers();
});</code></pre>

<h3>Example 10 — snapshot (minimal use)</h3>
<pre><code class="language-js">test('empty state', () =&gt; {
  const { container } = render(&lt;List items={[]}/&gt;);
  expect(container).toMatchSnapshot();
});</code></pre>

<h3>Example 11 — testing accessibility</h3>
<pre><code class="language-js">import { axe } from 'vitest-axe'; // or jest-axe
test('no a11y violations', async () =&gt; {
  const { container } = render(&lt;Form/&gt;);
  expect(await axe(container)).toHaveNoViolations();
});</code></pre>

<h3>Example 12 — custom render with all providers</h3>
<pre><code class="language-js">function AllProviders({ children }) {
  return (
    &lt;QueryClientProvider client={new QueryClient()}&gt;
      &lt;ThemeProvider&gt;
        &lt;AuthProvider&gt;
          &lt;MemoryRouter&gt;{children}&lt;/MemoryRouter&gt;
        &lt;/AuthProvider&gt;
      &lt;/ThemeProvider&gt;
    &lt;/QueryClientProvider&gt;
  );
}
export function renderApp(ui, options) { return render(ui, { wrapper: AllProviders, ...options }); }</code></pre>

<h3>Example 13 — Playwright critical flow</h3>
<pre><code class="language-js">import { test, expect } from '@playwright/test';
test('checkout', async ({ page }) =&gt; {
  await page.goto('/products/1');
  await page.getByRole('button', { name: /add to cart/i }).click();
  await page.getByRole('link', { name: /cart/i }).click();
  await page.getByRole('button', { name: /checkout/i }).click();
  await expect(page.getByText(/thank you/i)).toBeVisible();
});</code></pre>

<h3>Example 14 — detox RN smoke test</h3>
<pre><code class="language-js">describe('Login', () =&gt; {
  beforeAll(async () =&gt; { await device.launchApp(); });
  it('logs in', async () =&gt; {
    await element(by.id('email')).typeText('a@b.com');
    await element(by.id('password')).typeText('x');
    await element(by.id('submit')).tap();
    await expect(element(by.text('Welcome'))).toBeVisible();
  });
});</code></pre>

<h3>Example 15 — snapshot diff with reviewer</h3>
<p>Prefer reviewing snapshots as actual HTML changes, not "just press -u." Chromatic / Percy make this a visual diff PR review experience.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. "not wrapped in act" warnings</h3>
<p>Almost always means async state updates after the test thinks it's done. Use <code>findBy</code>, <code>waitFor</code>, or explicit <code>act(async () =&gt; ...)</code> wrappers.</p>

<h3>2. Stale mocks leak between tests</h3>
<pre><code class="language-js">afterEach(() =&gt; {
  vi.clearAllMocks(); // reset spy call counts
  vi.restoreAllMocks(); // or full restore
});</code></pre>

<h3>3. JSDOM doesn't implement layout</h3>
<p><code>getBoundingClientRect()</code> always returns zeros. Mock the method or test layout-dependent code in Playwright.</p>

<h3>4. JSDOM doesn't implement IntersectionObserver / ResizeObserver</h3>
<p>Polyfill in setup:</p>
<pre><code class="language-js">global.IntersectionObserver = class {
  observe() {} disconnect() {} unobserve() {}
};</code></pre>

<h3>5. Mocking window.matchMedia</h3>
<pre><code class="language-js">Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(q =&gt; ({ matches: false, addEventListener: () =&gt; {}, removeEventListener: () =&gt; {} })),
});</code></pre>

<h3>6. StrictMode double-rendering in tests</h3>
<p>If your tests wrap in StrictMode, effects run twice. Intentional — surfaces cleanup bugs. Keep it; fix the code.</p>

<h3>7. Flaky tests from implicit timing</h3>
<pre><code class="language-js">// BAD
await new Promise(r =&gt; setTimeout(r, 100));
// GOOD
expect(await screen.findByText(/done/i)).toBeInTheDocument();</code></pre>

<h3>8. DOM cleanup between tests</h3>
<p>RTL auto-cleanup runs after each test. If disabled (<code>cleanup: false</code>), DOM persists — causes confusion. Keep it on.</p>

<h3>9. Selectors that don't match the user's mental model</h3>
<pre><code class="language-js">// BAD: testId tells you nothing about the UI
screen.getByTestId('btn-7');
// GOOD: semantic, also documents expected UX
screen.getByRole('button', { name: /save/i });</code></pre>

<h3>10. Asynchronous hooks + fake timers</h3>
<p>If you useFakeTimers and also rely on microtasks (promise.then), you may need <code>vi.advanceTimersByTimeAsync</code> (Vitest) or combine <code>vi.runAllTimers()</code> with <code>await Promise.resolve()</code> cycles.</p>

<h3>11. Testing error boundaries silences console</h3>
<p>React logs errors during the render that boundaries catch. Silence <code>console.error</code> in those tests to keep output clean.</p>

<h3>12. Snapshot noise</h3>
<p>Dynamic content (timestamps, generated IDs) ruins snapshots. Either normalize before snapshot, or use <code>useId</code> for stable IDs, or skip snapshots for such components.</p>

<h3>13. Coverage gaps in E2E metrics</h3>
<p>Playwright doesn't contribute to Jest coverage by default. Combine with <code>nyc</code> / <code>istanbul</code>, or track coverage separately.</p>

<h3>14. MSW in Node vs browser</h3>
<p>Node (<code>setupServer</code>) for Jest/Vitest. Browser (<code>setupWorker</code>) for dev + Cypress. Same handlers; different entry points.</p>

<h3>15. Testing Suspense + data in unit tests</h3>
<p>Components that suspend need a Suspense boundary and awaited resolution. Use MSW to provide deterministic responses and <code>findBy</code> to wait.</p>

<h3>16. Race conditions between AbortController and test cleanup</h3>
<p>Abort signals firing after test teardown can crash subsequent tests. Ensure useEffect cleanups cancel in-flight requests.</p>

<h3>17. Using fireEvent when userEvent is needed</h3>
<pre><code class="language-js">fireEvent.change(input, { target: { value: 'foo' } });
// Missing focus/blur events → onBlur validation doesn't fire → bug not caught.
userEvent.type(input, 'foo'); // realistic sequence</code></pre>

<h3>18. Flaky Playwright tests from animations</h3>
<p>Disable CSS transitions in test mode; Playwright has a <code>reducedMotion</code> option; or wait on specific state.</p>

<h3>19. Snapshot "everything" tests</h3>
<p>A snapshot of a 1000-node tree changes with any edit. Reviewers accept blindly. Prefer targeted assertions.</p>

<h3>20. Testing components that use <code>useSyncExternalStore</code></h3>
<p>Provide a matching server snapshot in tests, and ensure your store updates inside <code>act()</code> so React flushes.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — testing implementation details</h3>
<pre><code class="language-js">// BAD
expect(wrapper.state().count).toBe(1);
expect(component.instance().handleSubmit).toHaveBeenCalled();</code></pre>
<p>Breaks on any refactor. Test user-observable behavior instead.</p>

<h3>Anti-pattern 2 — module-mocking your own code</h3>
<pre><code class="language-js">vi.mock('./useUser', () =&gt; ({ useUser: () =&gt; ({ name: 'X' }) }));</code></pre>
<p>You're not testing your component with the real hook; you're testing a fake. Instead, let the component use the real hook and mock the underlying fetch via MSW.</p>

<h3>Anti-pattern 3 — over-using testid</h3>
<p>Test IDs are fine occasionally (dynamic content, elements without semantic roles), but if every query is by testid, your UI probably isn't accessible.</p>

<h3>Anti-pattern 4 — one-assert-many-setups mega tests</h3>
<p>Tests that do five interactions and then check one thing are fragile. Split into focused tests — easier to debug, faster to localize failures.</p>

<h3>Anti-pattern 5 — testing library internals</h3>
<p>Don't test React itself (<code>expect(useState).toHaveBeenCalled</code>). Don't test React Query's caching. Trust the library; test your app's behavior.</p>

<h3>Anti-pattern 6 — absolute coverage targets</h3>
<p>"Require 80% coverage" feels like rigor but drives teams to test trivial getters to hit the number. Focus on critical paths and edge cases.</p>

<h3>Anti-pattern 7 — snapshots for everything</h3>
<p>Silent approval via <code>-u</code> turns snapshots into noise. Limit to stable visual components that benefit from holistic review.</p>

<h3>Anti-pattern 8 — unmocked randomness / time</h3>
<p>Tests that rely on <code>Math.random()</code>, <code>Date.now()</code>, or unseeded IDs are flaky. Mock or fix.</p>

<h3>Anti-pattern 9 — shared state between tests</h3>
<p>Global singletons (Redux store, MSW handlers, localStorage) leak data. Reset in <code>beforeEach</code> / <code>afterEach</code>.</p>

<h3>Anti-pattern 10 — ignoring act warnings</h3>
<p>These indicate async updates escaping your test's awaited scope — real bugs in how you wait for UI. Fix by using <code>findBy</code> or <code>waitFor</code>.</p>

<h3>Anti-pattern 11 — reaching into internals with <code>container.querySelector</code></h3>
<pre><code class="language-js">container.querySelector('.btn-primary')</code></pre>
<p>Ties test to CSS class names. Use role-based or label-based queries.</p>

<h3>Anti-pattern 12 — E2E testing every variation</h3>
<p>E2E is expensive (seconds per test vs milliseconds). Use for critical user flows only (login, checkout, signup). Unit/integration for variations.</p>

<h3>Anti-pattern 13 — not cleaning up subscriptions in hooks under test</h3>
<p>Hook tests that don't unmount in the teardown leave subscribers that interfere with later tests. RTL's <code>renderHook</code> auto-unmounts, but custom patterns may not.</p>

<h3>Anti-pattern 14 — debugging with <code>screen.debug()</code> everywhere</h3>
<p>Useful while iterating, terrible committed. Remove before merge or replace with intentional assertions.</p>

<h3>Anti-pattern 15 — relying on <code>beforeAll</code> fixtures that mutate</h3>
<p>Tests that run in isolation pass; the suite fails. Prefer <code>beforeEach</code> for setup; make fixtures immutable; share only genuinely read-only data.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. How do you decide what to test?</div>
  <div class="qa-answer">
    <p>Start from user flows: login, primary action, happy path to value. For each flow, list: success, failure modes (network error, invalid input, 4xx, 5xx), edge cases (empty, many, slow). Write integration tests for each. Unit tests for pure functions and complex hooks. E2E for the 2-3 most critical flows. Avoid testing trivial getters or framework internals.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Why does Testing Library discourage testid?</div>
  <div class="qa-answer">
    <p>Tests should resemble how users interact with the app. <code>getByRole</code> / <code>getByLabelText</code> also test accessibility — if a screen reader can't find the button, neither can the test. Testid is an escape hatch that works but doesn't catch a11y issues and ties tests to arbitrary IDs instead of semantic content. Use testid only when semantic queries genuinely can't locate the element.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Difference between fireEvent and userEvent?</div>
  <div class="qa-answer">
    <p><code>fireEvent</code> fires a single DOM event — e.g., <code>fireEvent.click</code> fires a click event. <code>userEvent</code> simulates the real user interaction sequence — for a click, that's mousemove → mousedown → mouseup → click; for typing, it's keydown → keypress → input → keyup for each character plus focus management. Real users produce event sequences; use userEvent to catch bugs that only appear in sequences.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. What is MSW and why use it?</div>
  <div class="qa-answer">
    <p>Mock Service Worker intercepts HTTP requests at the network layer — using Service Workers in the browser, and <code>setupServer</code> in Node. Your app's real fetch/axios code runs; MSW returns canned responses. Benefits: same handlers across tests / Storybook / local dev; no need to mock per-test the fetch implementation; tests exercise your real HTTP code (retries, error mapping, headers). Alternatives — module-mocking fetch — leave real code untested.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. How do you test asynchronous components?</div>
  <div class="qa-answer">
    <ul>
      <li>Use <code>findBy*</code> which waits (default 1s timeout) for the element to appear.</li>
      <li>Use <code>waitFor</code> for assertions that become true (e.g., "loading" disappears).</li>
      <li>For loading → data → rendered flow: assert loading, then <code>findBy</code> data.</li>
      <li>Use MSW to control server response timing deterministically.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How do you test a custom hook?</div>
  <div class="qa-answer">
    <p>Use <code>renderHook</code> from Testing Library:</p>
<pre><code class="language-js">const { result, rerender } = renderHook(({ initial }) =&gt; useCounter(initial), {
  initialProps: { initial: 0 },
  wrapper: MyProviders,   // if hook uses context
});
act(() =&gt; result.current.inc());
expect(result.current.count).toBe(1);</code></pre>
    <p>Key: wrap state-changing calls in <code>act</code>, access <code>result.current</code> each time (rebuilt on re-render), provide wrappers for context-dependent hooks.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How do you decide between unit and integration tests?</div>
  <div class="qa-answer">
    <p>If the thing is a pure function (formatter, validator) — unit test. If it's a hook with complex logic — unit test with <code>renderHook</code>. If it's a component — integration test with RTL + MSW, rendering the component with realistic providers. Integration tests catch the wiring bugs that unit tests miss, so Kent C. Dodds recommends allocating more effort there than classical unit testing doctrine suggests.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How do you keep tests fast?</div>
  <div class="qa-answer">
    <ul>
      <li>Vitest over Jest for modern stacks (no Babel transform, parallel by default).</li>
      <li>Avoid real network (MSW) and real timers (fake timers).</li>
      <li>Don't spin up a full Redux store for each test; scope providers.</li>
      <li>Parallelize by file.</li>
      <li>Keep E2E suite small (critical flows only).</li>
      <li>Cache node_modules and CI dependencies.</li>
      <li>Avoid huge test fixtures that re-parse every run.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. When would you use a snapshot test?</div>
  <div class="qa-answer">
    <p>For stable UI where you want to catch unintended markup changes — e.g., a presentational component with complex conditional output, or a rendered error screen. Avoid for frequently-changing components; the diff becomes noise. Never treat snapshots as assertions — they confirm "nothing changed," not "something is correct." Prefer explicit <code>expect</code> assertions for behavior.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. What's the "act" warning?</div>
  <div class="qa-answer">
    <p>React uses <code>act()</code> to batch and flush updates during tests. If a test causes a state update outside an awaited <code>act</code> scope — e.g., a promise resolves after the test ends — React warns: "An update to X inside a test was not wrapped in act(...)." Fixes: use <code>findBy</code> / <code>waitFor</code> to await the async update, or wrap in <code>await act(async () =&gt; { ... })</code>. The warning indicates a real bug: your test is thinking it's done but state is still changing.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. How do you test a component that uses context?</div>
  <div class="qa-answer">
    <p>Wrap it in the provider in the test. If multiple tests need the same providers, extract a custom render helper that wraps with all the app's providers (theme, router, query client, etc.):</p>
<pre><code class="language-js">function renderWithProviders(ui) {
  return render(ui, { wrapper: AllProviders });
}</code></pre>
    <p>Then use <code>renderWithProviders(&lt;X/&gt;)</code> consistently. Avoid manually wrapping in every test.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. What's E2E best used for?</div>
  <div class="qa-answer">
    <p>The few critical flows where a real browser catches bugs unit tests can't: CSP issues, cross-origin problems, real event timings, CSS-driven visibility, service workers, caching. Examples: signup, checkout, payment, dashboard-access. 5-15 E2E tests covering business-critical paths; everything else in integration or unit.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. How do you test error boundaries?</div>
  <div class="qa-answer">
    <p>Render the boundary with a component that throws, then assert the fallback is shown:</p>
<pre><code class="language-js">function Boom() { throw new Error('boom'); }
test('boundary', () =&gt; {
  vi.spyOn(console, 'error').mockImplementation(() =&gt; {}); // silence React's log
  render(&lt;ErrorBoundary fallback={&lt;p&gt;oops&lt;/p&gt;}&gt;&lt;Boom/&gt;&lt;/ErrorBoundary&gt;);
  expect(screen.getByText('oops')).toBeInTheDocument();
});</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. How do you test React Native components?</div>
  <div class="qa-answer">
    <p><code>@testing-library/react-native</code> provides <code>render</code>, <code>fireEvent</code>, <code>screen</code> tailored to RN (uses <code>getByRole</code>, <code>getByText</code>, etc.). Mock native modules with Jest manual mocks. For E2E: <strong>Detox</strong> (most popular, deterministic sync with animations, iOS/Android) or <strong>Maestro</strong> (YAML flows, simpler, cross-platform). Both run on simulators/devices and exercise real JS + native code.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. You're asked to make a test suite faster without dropping tests. What do you do?</div>
  <div class="qa-answer">
    <ol>
      <li>Profile: <code>jest --logHeapUsage</code>, Vitest's <code>--reporter verbose</code>. Identify slow files.</li>
      <li>Mock time (fake timers) anywhere tests sleep.</li>
      <li>Replace real fetch with MSW.</li>
      <li>Reduce per-test setup: smaller stores, minimal providers, reusable fixtures.</li>
      <li>Run in parallel (default in Vitest; <code>--maxWorkers</code> in Jest).</li>
      <li>Move expensive E2E off the critical CI path to nightly.</li>
      <li>Cache <code>node_modules</code> and bundler artifacts in CI.</li>
      <li>Consider Vitest migration if Jest is the bottleneck.</li>
    </ol>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You articulate the Kent C. Dodds "test trophy" allocation.</li>
    <li>You prefer semantic queries over testids and explain why.</li>
    <li>You reach for MSW for network mocking.</li>
    <li>You distinguish userEvent and fireEvent.</li>
    <li>You correctly use findBy / waitFor for async UI.</li>
    <li>You mention renderHook for hook tests.</li>
    <li>You limit snapshots and E2E to the right use cases.</li>
    <li>You fix "act" warnings at the source rather than suppressing.</li>
  </ul>
</div>
`}

]
});
