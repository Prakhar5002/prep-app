window.PREP_SITE.registerTopic({
  id: 'test-jest-rtl',
  module: 'testing',
  title: 'Jest + RTL Deep',
  estimatedReadTime: '50 min',
  tags: ['jest', 'vitest', 'rtl', 'react-testing-library', 'user-event', 'msw', 'queries', 'async', 'matchers', 'config'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Jest</strong> (and its faster cousin <strong>Vitest</strong>) is the runner / assertion / mocking stack; <strong>React Testing Library (RTL)</strong> is the rendering + querying layer designed around accessibility and user-perspective testing. Together they're the default for React + RN unit/integration tests.</p>
<ul>
  <li><strong>RTL philosophy:</strong> "The more your tests resemble the way your software is used, the more confidence they can give you." Query by role / label / text; use <code>userEvent</code> to type, click, focus.</li>
  <li><strong>Five query priority levels:</strong> <code>getByRole</code> &gt; <code>getByLabelText</code> &gt; <code>getByPlaceholderText</code> &gt; <code>getByText</code> &gt; <code>getByDisplayValue</code> — then <code>getByAltText</code>, <code>getByTitle</code>, <code>getByTestId</code> as last resort.</li>
  <li><strong>Three query suffixes:</strong> <code>get*</code> (must exist now), <code>query*</code> (returns null if absent), <code>find*</code> (async, retries).</li>
  <li><strong>userEvent vs fireEvent:</strong> <code>userEvent</code> simulates real interaction (focus, blur, key sequences). <code>fireEvent</code> dispatches a single DOM event — only when you specifically need it.</li>
  <li><strong>Mock at the network with MSW</strong> — never <code>fetch.mockResolvedValue</code> at every call site.</li>
  <li><strong>Async patterns:</strong> <code>findBy</code> for "wait for it"; <code>waitFor</code> for non-query assertions; fake timers for debounce/throttle.</li>
  <li><strong>Vitest is faster:</strong> drop-in replacement for Jest in many setups; native ESM, watch mode is instant.</li>
</ul>
<p><strong>Mantra:</strong> "Query by role. Interact via userEvent. Mock at the network. Wait by condition, not by time."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What Jest gives you</h3>
<table>
  <thead><tr><th>Layer</th><th>Jest provides</th></tr></thead>
  <tbody>
    <tr><td>Runner</td><td>Discovery (<code>*.test.js</code>), worker pool, watch mode, parallel execution</td></tr>
    <tr><td>Assertions</td><td><code>expect(x).toBe(y)</code>, deep equality, custom matchers</td></tr>
    <tr><td>Mocks</td><td><code>jest.fn()</code>, <code>jest.mock(modulePath)</code>, spies, hoisted module mocks</td></tr>
    <tr><td>Snapshots</td><td><code>toMatchSnapshot</code>, inline snapshots</td></tr>
    <tr><td>Environments</td><td>Node (default), JSDOM (browser-like), custom</td></tr>
    <tr><td>Coverage</td><td>Istanbul-based; v8 coverage in Vitest</td></tr>
  </tbody>
</table>

<h3>What RTL gives you</h3>
<ul>
  <li><strong>Render</strong> a React tree into a JSDOM document.</li>
  <li><strong>Query</strong> via accessibility-first APIs.</li>
  <li><strong>Cleanup</strong> the tree between tests automatically.</li>
  <li><strong>Tools</strong>: <code>screen</code> for global queries, <code>within</code> for scoped queries.</li>
  <li><strong>Encourages</strong> behaviour testing over implementation; deliberately doesn't expose internal state.</li>
</ul>

<h3>Vitest: Jest-compatible, faster</h3>
<table>
  <thead><tr><th>Feature</th><th>Jest</th><th>Vitest</th></tr></thead>
  <tbody>
    <tr><td>Speed (cold)</td><td>Slow on TS / Babel transforms</td><td>Native ESM via Vite; fast cold start</td></tr>
    <tr><td>Watch mode</td><td>Decent</td><td>Instant; HMR-style reactive</td></tr>
    <tr><td>Config</td><td><code>jest.config.js</code></td><td>Inherits Vite config; <code>vitest.config.ts</code></td></tr>
    <tr><td>API</td><td><code>jest.fn()</code>, <code>describe/test</code></td><td><code>vi.fn()</code>, <code>describe/test</code> — same API otherwise</td></tr>
    <tr><td>RTL support</td><td>Yes</td><td>Yes</td></tr>
    <tr><td>RN support</td><td>Mature (Jest is RN's default)</td><td>Possible but rougher</td></tr>
  </tbody>
</table>
<p>For React web: Vitest is the modern default. For RN: stick with Jest (RN ships with Jest config baked in).</p>

<h3>Why this stack works</h3>
<ul>
  <li>Tests run in seconds, not minutes — JSDOM is faster than a real browser.</li>
  <li>Behaviour-first queries survive refactors.</li>
  <li>Massive ecosystem: matchers (<code>jest-dom</code>), DOM events (<code>user-event</code>), network (<code>msw</code>), accessibility (<code>jest-axe</code>).</li>
  <li>Standard across React / RN / Next.js / Remix / Vite — one stack everywhere.</li>
</ul>

<h3>The reach-for hierarchy</h3>
<ol>
  <li><strong>Pure utility?</strong> Jest unit test; no RTL.</li>
  <li><strong>Hook?</strong> <code>renderHook</code> from <code>@testing-library/react</code>.</li>
  <li><strong>Component?</strong> RTL <code>render</code> + queries + userEvent.</li>
  <li><strong>Component fetching data?</strong> RTL + MSW.</li>
  <li><strong>Cross-page flow?</strong> E2E with Playwright / Cypress (covered separately).</li>
</ol>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>RTL's query API at a glance</h3>
<table>
  <thead><tr><th>Variant</th><th>Found 0</th><th>Found 1</th><th>Found 2+</th><th>Async</th></tr></thead>
  <tbody>
    <tr><td><code>getBy*</code></td><td>throws</td><td>returns</td><td>throws</td><td>no</td></tr>
    <tr><td><code>queryBy*</code></td><td>null</td><td>returns</td><td>throws</td><td>no</td></tr>
    <tr><td><code>findBy*</code></td><td>retries; throws after timeout</td><td>returns</td><td>throws</td><td>yes (Promise)</td></tr>
    <tr><td><code>getAllBy*</code></td><td>throws</td><td>returns array</td><td>returns array</td><td>no</td></tr>
    <tr><td><code>queryAllBy*</code></td><td>[]</td><td>returns array</td><td>returns array</td><td>no</td></tr>
    <tr><td><code>findAllBy*</code></td><td>retries</td><td>returns array</td><td>returns array</td><td>yes</td></tr>
  </tbody>
</table>
<ul>
  <li><strong>Use <code>get*</code></strong> when the element <em>must</em> exist; failure should be the test failure.</li>
  <li><strong>Use <code>query*</code></strong> only when asserting absence: <code>expect(screen.queryByText('Error')).toBeNull()</code>.</li>
  <li><strong>Use <code>find*</code></strong> when the element appears asynchronously (after a fetch / state update / animation).</li>
</ul>

<h3>Query priority (RTL recommended order)</h3>
<ol>
  <li><strong>Accessible to everyone:</strong>
    <ul>
      <li><code>getByRole</code> — most preferred. <code>getByRole('button', { name: /submit/i })</code></li>
      <li><code>getByLabelText</code> — form inputs.</li>
      <li><code>getByPlaceholderText</code> — only when no label exists (rare; usually a bug).</li>
      <li><code>getByText</code> — non-interactive text.</li>
      <li><code>getByDisplayValue</code> — current input/select/textarea value.</li>
    </ul>
  </li>
  <li><strong>Semantic:</strong>
    <ul>
      <li><code>getByAltText</code> — images, areas, inputs of type image.</li>
      <li><code>getByTitle</code> — uncommon; SVG title-text elements.</li>
    </ul>
  </li>
  <li><strong>Last resort:</strong>
    <ul>
      <li><code>getByTestId</code> — when nothing else works (e.g., generic wrapper for animation).</li>
    </ul>
  </li>
</ol>

<h3>What "role" means</h3>
<p>An accessibility role assigned by the browser via implicit semantics or explicit <code>role</code> attribute. The same query that works for assistive tech works for tests. Common roles:</p>
<table>
  <thead><tr><th>Element</th><th>Implicit role</th></tr></thead>
  <tbody>
    <tr><td><code>&lt;button&gt;</code></td><td>button</td></tr>
    <tr><td><code>&lt;a href&gt;</code></td><td>link</td></tr>
    <tr><td><code>&lt;h1&gt;</code>–<code>&lt;h6&gt;</code></td><td>heading</td></tr>
    <tr><td><code>&lt;input type="text"&gt;</code></td><td>textbox</td></tr>
    <tr><td><code>&lt;input type="checkbox"&gt;</code></td><td>checkbox</td></tr>
    <tr><td><code>&lt;input type="radio"&gt;</code></td><td>radio</td></tr>
    <tr><td><code>&lt;select&gt;</code></td><td>combobox / listbox</td></tr>
    <tr><td><code>&lt;ul&gt;</code> / <code>&lt;ol&gt;</code></td><td>list</td></tr>
    <tr><td><code>&lt;li&gt;</code></td><td>listitem</td></tr>
    <tr><td><code>&lt;nav&gt;</code></td><td>navigation</td></tr>
    <tr><td><code>&lt;main&gt;</code></td><td>main</td></tr>
    <tr><td><code>&lt;section aria-label&gt;</code></td><td>region</td></tr>
    <tr><td><code>&lt;dialog&gt;</code> / <code>role="dialog"</code></td><td>dialog</td></tr>
  </tbody>
</table>

<h3>userEvent vs fireEvent</h3>
<table>
  <thead><tr><th>Action</th><th>userEvent</th><th>fireEvent</th></tr></thead>
  <tbody>
    <tr><td>Click a button</td><td>focus + mousedown + mouseup + click</td><td>just click</td></tr>
    <tr><td>Type "abc"</td><td>3 keydown/keypress/keyup + input + change</td><td>just one change</td></tr>
    <tr><td>Tab to next field</td><td>blur + focus</td><td>not natively</td></tr>
    <tr><td>Paste</td><td>paste event + input</td><td>just paste</td></tr>
  </tbody>
</table>
<p>Default to <code>userEvent</code>. Reach for <code>fireEvent</code> only when you need to dispatch a custom event userEvent doesn't model (e.g., <code>input</code> with no key sequence, or scroll events).</p>

<h3>Async — three tools, one decision</h3>
<table>
  <thead><tr><th>Tool</th><th>Use when</th></tr></thead>
  <tbody>
    <tr><td><code>findBy*</code></td><td>Querying for an element that appears later</td></tr>
    <tr><td><code>waitFor</code></td><td>Asserting a condition unrelated to a query</td></tr>
    <tr><td><code>waitForElementToBeRemoved</code></td><td>Waiting for an element to disappear</td></tr>
  </tbody>
</table>
<pre><code class="language-javascript">// Element appears
expect(await screen.findByText(/loaded/i)).toBeVisible();

// Function called eventually
await waitFor(() =&gt; expect(onSubmit).toHaveBeenCalled());

// Spinner disappears
await waitForElementToBeRemoved(() =&gt; screen.queryByRole('progressbar'));
</code></pre>

<h3>The matcher zoo (jest-dom)</h3>
<p>The <code>@testing-library/jest-dom</code> package adds DOM-aware matchers:</p>
<ul>
  <li><code>toBeInTheDocument()</code></li>
  <li><code>toBeVisible()</code></li>
  <li><code>toBeDisabled()</code> / <code>toBeEnabled()</code></li>
  <li><code>toHaveValue(v)</code> / <code>toHaveDisplayValue(v)</code></li>
  <li><code>toHaveTextContent(text|regex)</code></li>
  <li><code>toHaveAttribute(name, value)</code></li>
  <li><code>toHaveClass(name)</code></li>
  <li><code>toHaveFocus()</code></li>
  <li><code>toBeChecked()</code> / <code>toBePartiallyChecked()</code></li>
  <li><code>toBeRequired()</code> / <code>toBeInvalid()</code></li>
</ul>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Bootstrapping (Vitest + RTL)</h3>
<pre><code class="language-typescript">// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.ts',
    coverage: { reporter: ['text', 'lcov'], exclude: ['**/*.stories.*'] },
  },
});
</code></pre>
<pre><code class="language-typescript">// src/tests/setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(cleanup);
</code></pre>

<h3>Bootstrapping (Jest + RTL)</h3>
<pre><code class="language-json">// package.json
{
  "jest": {
    "testEnvironment": "jsdom",
    "setupFilesAfterEach": ["&lt;rootDir&gt;/src/tests/setup.ts"]
  }
}
</code></pre>
<pre><code class="language-typescript">// setup.ts
import '@testing-library/jest-dom';
</code></pre>

<h3>Custom <code>render</code> with providers</h3>
<pre><code class="language-typescript">import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { ThemeProvider } from '@/theme';

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) =&gt; (
    &lt;ThemeProvider theme="light"&gt;
      &lt;QueryClientProvider client={client}&gt;{children}&lt;/QueryClientProvider&gt;
    &lt;/ThemeProvider&gt;
  );
}

export function renderWithProviders(ui: ReactNode, options: RenderOptions = {}) {
  return render(ui, { wrapper: makeWrapper(), ...options });
}
</code></pre>
<p>Re-export your custom <code>render</code> as the default to keep tests clean. <em>Never share the same QueryClient across tests</em> — cache leakage causes flake.</p>

<h3>Testing a controlled form</h3>
<pre><code class="language-typescript">test('submits when fields are valid', async () =&gt; {
  const onSubmit = vi.fn();
  renderWithProviders(&lt;SignUp onSubmit={onSubmit} /&gt;);
  const user = userEvent.setup();

  await user.type(screen.getByLabelText(/email/i), 'p@x.com');
  await user.type(screen.getByLabelText(/password/i), 'hunter2hunter2');
  await user.click(screen.getByRole('button', { name: /sign up/i }));

  expect(onSubmit).toHaveBeenCalledWith({ email: 'p@x.com', password: 'hunter2hunter2' });
});
</code></pre>

<h3>Testing async UI with MSW</h3>
<pre><code class="language-typescript">// src/tests/server.ts
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const server = setupServer(
  http.get('/api/users/:id', ({ params }) =&gt;
    HttpResponse.json({ id: params.id, name: 'Default User' })
  ),
);

// setup.ts
import { beforeAll, afterAll, afterEach } from 'vitest';
import { server } from './server';

beforeAll(() =&gt; server.listen({ onUnhandledRequest: 'error' }));
afterEach(() =&gt; server.resetHandlers());
afterAll(() =&gt; server.close());
</code></pre>
<pre><code class="language-typescript">// In a test
test('shows error toast when API fails', async () =&gt; {
  server.use(
    http.get('/api/users/1', () =&gt; HttpResponse.json({ error: 'oops' }, { status: 500 }))
  );

  renderWithProviders(&lt;UserCard id="1" /&gt;);
  expect(await screen.findByText(/something went wrong/i)).toBeVisible();
});
</code></pre>

<h3>Hooks</h3>
<pre><code class="language-typescript">import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

test('increments', () =&gt; {
  const { result } = renderHook(() =&gt; useCounter(0));
  expect(result.current.count).toBe(0);
  act(() =&gt; result.current.increment());
  expect(result.current.count).toBe(1);
});
</code></pre>
<p>Use <code>act</code> when manipulating state outside of <code>userEvent</code> / RTL events. Most modern RTL APIs handle <code>act</code> for you.</p>

<h3>Fake timers (debounce, throttle, intervals)</h3>
<pre><code class="language-typescript">import { vi } from 'vitest';

beforeEach(() =&gt; { vi.useFakeTimers(); });
afterEach(() =&gt; { vi.useRealTimers(); });

test('debounces search input', async () =&gt; {
  const fetcher = vi.fn().mockResolvedValue([]);
  renderWithProviders(&lt;Search fetcher={fetcher} /&gt;);
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

  await user.type(screen.getByRole('searchbox'), 'apple');
  expect(fetcher).not.toHaveBeenCalled();

  await vi.advanceTimersByTimeAsync(300);
  expect(fetcher).toHaveBeenCalledOnce();
});
</code></pre>
<p>When using fake timers with <code>userEvent</code>, you must pass <code>advanceTimers</code> in <code>setup()</code> or typing hangs forever.</p>

<h3>Mocking modules</h3>
<pre><code class="language-typescript">// Hoisted automatically
vi.mock('@/lib/analytics', () =&gt; ({
  track: vi.fn(),
  identify: vi.fn(),
}));

import { track } from '@/lib/analytics';

test('tracks signup', async () =&gt; {
  // …
  expect(track).toHaveBeenCalledWith('signup', { method: 'email' });
});
</code></pre>
<p>Prefer mocking at boundaries (network, native modules) over mocking your own modules. Module mocks are useful for analytics, logging, error reporting (you don't want test runs sending real events).</p>

<h3>Spying without replacing</h3>
<pre><code class="language-typescript">const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() =&gt; {});
// runs the real impl by default unless you mock; <code>spy</code> tracks calls.
</code></pre>

<h3>Snapshot best practices</h3>
<ul>
  <li>Inline snapshots: <code>expect(x).toMatchInlineSnapshot()</code> — diffs are visible in PRs.</li>
  <li>External snapshots: avoid for component trees; use for serialised data only.</li>
  <li>Audit periodically; delete stale snapshots.</li>
  <li>Use <code>toMatchObject</code> when you want to assert a subset, not the entire shape.</li>
</ul>

<h3>Coverage</h3>
<pre><code class="language-bash">vitest --coverage  # or jest --coverage
</code></pre>
<p>Treat coverage as a floor, not a goal. Add per-folder thresholds for critical paths:</p>
<pre><code class="language-typescript">// vitest.config.ts
test: {
  coverage: {
    thresholds: {
      'src/billing/**': { branches: 90, functions: 90, lines: 90 },
      'src/marketing/**': { branches: 0 },
    },
  },
}
</code></pre>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Login form, full flow</h3>
<pre><code class="language-typescript">import { http, HttpResponse } from 'msw';
import { server } from '../tests/server';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../tests/render';
import { LoginScreen } from './LoginScreen';

describe('LoginScreen', () =&gt; {
  test('logs in and navigates', async () =&gt; {
    server.use(http.post('/api/login', () =&gt; HttpResponse.json({ token: 't1' })));
    const onSuccess = vi.fn();
    renderWithProviders(&lt;LoginScreen onSuccess={onSuccess} /&gt;);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'p@x.com');
    await user.type(screen.getByLabelText(/password/i), 'hunter2hunter2');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() =&gt; expect(onSuccess).toHaveBeenCalledWith({ token: 't1' }));
  });

  test('shows error on 401', async () =&gt; {
    server.use(http.post('/api/login', () =&gt; HttpResponse.json({ error: 'bad creds' }, { status: 401 })));
    renderWithProviders(&lt;LoginScreen onSuccess={vi.fn()} /&gt;);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'p@x.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/incorrect/i);
  });

  test('disables submit while logging in', async () =&gt; {
    server.use(http.post('/api/login', async () =&gt; {
      await new Promise(r =&gt; setTimeout(r, 50));
      return HttpResponse.json({ token: 't1' });
    }));
    renderWithProviders(&lt;LoginScreen onSuccess={vi.fn()} /&gt;);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'p@x.com');
    await user.type(screen.getByLabelText(/password/i), 'hunter2hunter2');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(screen.getByRole('button', { name: /log in/i })).toBeDisabled();
  });
});
</code></pre>

<h3>Example 2: A custom hook</h3>
<pre><code class="language-typescript">test('useDebounce delays the value', async () =&gt; {
  vi.useFakeTimers();
  const { result, rerender } = renderHook(({ v }) =&gt; useDebounce(v, 200), {
    initialProps: { v: 'a' },
  });
  expect(result.current).toBe('a');

  rerender({ v: 'ab' });
  expect(result.current).toBe('a'); // not yet updated
  await vi.advanceTimersByTimeAsync(199);
  expect(result.current).toBe('a');
  await vi.advanceTimersByTimeAsync(2);
  expect(result.current).toBe('ab');
  vi.useRealTimers();
});
</code></pre>

<h3>Example 3: Modal with focus trap</h3>
<pre><code class="language-typescript">test('Modal traps focus and restores it on close', async () =&gt; {
  function Demo() {
    const [open, setOpen] = useState(false);
    return (
      &lt;&gt;
        &lt;button onClick={() =&gt; setOpen(true)}&gt;Open&lt;/button&gt;
        {open &amp;&amp; (
          &lt;Modal title="Hi" onClose={() =&gt; setOpen(false)}&gt;
            &lt;button&gt;First&lt;/button&gt;
            &lt;button&gt;Second&lt;/button&gt;
          &lt;/Modal&gt;
        )}
      &lt;/&gt;
    );
  }

  renderWithProviders(&lt;Demo /&gt;);
  const user = userEvent.setup();

  const opener = screen.getByRole('button', { name: /open/i });
  await user.click(opener);

  const dialog = await screen.findByRole('dialog', { name: /hi/i });
  expect(within(dialog).getByRole('button', { name: /first/i })).toHaveFocus();

  await user.keyboard('{Escape}');
  expect(opener).toHaveFocus();
});
</code></pre>

<h3>Example 4: Asserting accessibility</h3>
<pre><code class="language-typescript">import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

test('Form has no a11y violations', async () =&gt; {
  const { container } = renderWithProviders(&lt;SignUp /&gt;);
  expect(await axe(container)).toHaveNoViolations();
});
</code></pre>

<h3>Example 5: Mocking analytics module</h3>
<pre><code class="language-typescript">vi.mock('@/lib/analytics', () =&gt; ({ track: vi.fn() }));
import { track } from '@/lib/analytics';

test('tracks form submission', async () =&gt; {
  const user = userEvent.setup();
  renderWithProviders(&lt;SignUp /&gt;);
  await user.type(screen.getByLabelText(/email/i), 'p@x.com');
  await user.type(screen.getByLabelText(/password/i), 'hunter2hunter2');
  await user.click(screen.getByRole('button', { name: /sign up/i }));

  expect(track).toHaveBeenCalledWith('signup_attempt', expect.objectContaining({ method: 'email' }));
});
</code></pre>

<h3>Example 6: Test data builders</h3>
<pre><code class="language-typescript">// fixtures/user.ts
export const aUser = (overrides: Partial&lt;User&gt; = {}): User =&gt; ({
  id: 1,
  name: 'Default',
  email: 'd@x.com',
  role: 'MEMBER',
  ...overrides,
});

// usage
test('admin sees admin link', () =&gt; {
  renderWithProviders(&lt;Header viewer={aUser({ role: 'ADMIN' })} /&gt;);
  expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument();
});
</code></pre>

<h3>Example 7: A bad test, then a good test</h3>
<pre><code class="language-typescript">// BAD — pinned to class names
test('renders avatar', () =&gt; {
  const { container } = renderWithProviders(&lt;Avatar src="x.jpg" /&gt;);
  expect(container.querySelector('.avatar-img')).toBeInTheDocument();
});

// GOOD — semantic, behaviour-focused
test('renders avatar with alt text', () =&gt; {
  renderWithProviders(&lt;Avatar src="x.jpg" alt="Prakhar" /&gt;);
  expect(screen.getByRole('img', { name: 'Prakhar' })).toBeInTheDocument();
});
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3><code>act</code> warnings</h3>
<p>"An update to X inside a test was not wrapped in act(...)" usually means an async state change happened outside of an awaited interaction. Fixes:</p>
<ul>
  <li>Use <code>await user.click(...)</code> — userEvent handles act for you.</li>
  <li>Wait for the resulting state with <code>findBy*</code> or <code>waitFor</code>.</li>
  <li>If you've fired off a promise that updates state after the test ends, await it inside the test.</li>
  <li>If the warning is from inside a hook update during render, the implementation has a bug — fix the code, not the test.</li>
</ul>

<h3>Cleanup</h3>
<ul>
  <li>RTL auto-cleans rendered trees in modern setups; older setups need <code>afterEach(cleanup)</code>.</li>
  <li>Always reset MSW handlers between tests (<code>server.resetHandlers()</code>).</li>
  <li>Always reset mocks: <code>vi.restoreAllMocks()</code> in <code>afterEach</code>.</li>
  <li>Use a fresh QueryClient per test; never share.</li>
</ul>

<h3>JSDOM limitations</h3>
<table>
  <thead><tr><th>What's missing</th><th>Workaround</th></tr></thead>
  <tbody>
    <tr><td>Layout (offsetWidth, getBoundingClientRect)</td><td>Mock manually or use <code>happy-dom</code>; or move to Playwright</td></tr>
    <tr><td>IntersectionObserver</td><td>Polyfill in setup file</td></tr>
    <tr><td>ResizeObserver</td><td>Polyfill</td></tr>
    <tr><td>matchMedia</td><td>Polyfill</td></tr>
    <tr><td>Animation frames</td><td>Use jest-jsdom-mock-rAF or fake timers</td></tr>
    <tr><td>scrollIntoView</td><td>Mock as no-op</td></tr>
    <tr><td>HTMLCanvasElement</td><td>Use <code>jest-canvas-mock</code></td></tr>
  </tbody>
</table>
<pre><code class="language-typescript">// setup.ts polyfills
class IntersectionObserverMock {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}
vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) =&gt; ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
</code></pre>

<h3>Async race conditions</h3>
<ul>
  <li>Order MSW handlers correctly; <code>server.use()</code> overrides for the test only.</li>
  <li>Don't mix <code>findBy</code> and <code>waitFor</code> on the same promise — pick one.</li>
  <li>Always <code>await</code> async setup; missing await = flake.</li>
</ul>

<h3>Snapshot pitfalls</h3>
<ul>
  <li>Snapshots of dates / IDs / random values change every run. Mock or transform.</li>
  <li>Inline snapshots are auto-updated by <code>--update</code>; review diffs in PR.</li>
  <li>Don't snapshot full component trees — partial snapshots of computed output only.</li>
</ul>

<h3>RN-specific gotchas</h3>
<ul>
  <li>RN uses Jest by default with a custom preset (<code>jest-expo</code>, <code>react-native</code> preset). Vitest doesn't fit cleanly — stick with Jest for RN.</li>
  <li>RTL ships <code>@testing-library/react-native</code> with the same API but RN-aware queries (text instead of role for many components).</li>
  <li>Mock native modules at the JS bridge: <code>jest.mock('@react-native-async-storage/async-storage', () =&gt; mockStorage)</code>.</li>
  <li>Animations: mock <code>Animated.timing</code> or use <code>jest.useFakeTimers()</code>; Reanimated has its own mock helper.</li>
  <li>Query by <code>accessibilityLabel</code> + <code>accessibilityRole</code> in RTL-RN.</li>
  <li>Don't forget to mock <code>react-native</code> modules used in deeply imported transitive dependencies.</li>
</ul>

<h3>Performance</h3>
<ul>
  <li>Most tests should run in &lt; 50ms each. If integration tests crawl, profile with <code>--reporter=verbose</code>.</li>
  <li>Slow heaviest cause is usually expensive providers — minimal provider wrappers per test.</li>
  <li>Vitest's <code>--threads</code> mode parallelises across cores; Jest's <code>--maxWorkers</code> for tuning.</li>
  <li>Big test files: split by feature, not by file convention.</li>
</ul>

<h3>Watch mode UX</h3>
<ul>
  <li><code>vitest</code> rerun-on-save with HMR-style speed.</li>
  <li><code>jest --watch</code> + <code>--testPathPattern</code> to focus.</li>
  <li>Both support filter by test name (<code>p</code> in watch UI).</li>
</ul>

<h3>Console errors</h3>
<p>React logs warnings on bad keys, missing props, deprecated APIs. Fail tests on any unexpected <code>console.error</code> to catch regressions early.</p>
<pre><code class="language-typescript">beforeEach(() =&gt; {
  vi.spyOn(console, 'error').mockImplementation((msg, ...args) =&gt; {
    throw new Error(\`Unexpected console.error: \${msg}\`);
  });
});
</code></pre>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common Jest+RTL mistakes</h3>
<ol>
  <li><strong>Querying by class / id / data-testid</strong> when role works.</li>
  <li><strong>Using <code>fireEvent</code> when <code>userEvent</code> would model the real interaction.</strong></li>
  <li><strong>Mocking modules instead of network.</strong></li>
  <li><strong>Sharing QueryClient across tests.</strong></li>
  <li><strong>Forgetting <code>await</code> on async user actions.</strong></li>
  <li><strong>Using <code>setTimeout</code> in tests instead of <code>findBy</code> / <code>waitFor</code>.</strong></li>
  <li><strong>Snapshotting full trees.</strong></li>
  <li><strong>Skipping flaky tests instead of fixing.</strong></li>
  <li><strong>Calling <code>act</code> manually when userEvent / RTL handles it.</strong></li>
  <li><strong>Asserting on internal state via <code>renderHook</code> for UI.</strong></li>
  <li><strong>Mocking React itself or other framework code.</strong></li>
  <li><strong>Tests that pass alone but fail in suite</strong> — order-dependent or shared-state.</li>
</ol>

<h3>Anti-pattern: <code>screen.debug()</code> spam in committed code</h3>
<p>Useful for local dev; remove before commit. ESLint rule <code>no-debug</code> in <code>eslint-plugin-testing-library</code>.</p>

<h3>Anti-pattern: directly accessing the rendered DOM</h3>
<pre><code class="language-typescript">// BAD
const { container } = render(&lt;Form /&gt;);
container.querySelector('input[name="email"]').value = 'x@y.com';

// GOOD
await user.type(screen.getByLabelText(/email/i), 'x@y.com');
</code></pre>

<h3>Anti-pattern: <code>getBy</code> + <code>not.toBeInTheDocument</code></h3>
<pre><code class="language-typescript">// BAD — getBy throws when missing; assertion never runs
expect(screen.getByText('Error')).not.toBeInTheDocument();

// GOOD — queryBy returns null
expect(screen.queryByText('Error')).not.toBeInTheDocument();
</code></pre>

<h3>Anti-pattern: blanket <code>jest.mock('react')</code></h3>
<p>You don't test React; you test what your code does with React. Mocking React breaks RTL itself.</p>

<h3>Anti-pattern: per-test re-mount of context</h3>
<pre><code class="language-typescript">// BAD — same client object reused; cache leaks
const client = new QueryClient();

beforeEach(() =&gt; renderWithProviders(&lt;App /&gt;, { client }));

// GOOD — fresh client per test
beforeEach(() =&gt; renderWithProviders(&lt;App /&gt;)); // makeWrapper creates a new one
</code></pre>

<h3>Anti-pattern: relying on <code>data-testid</code></h3>
<p>If you're reaching for <code>data-testid</code>, ask why role / label doesn't work. Usually: missing label, generic <code>div</code> instead of semantic element, or test wants to grip implementation. Fix the component, not the test.</p>

<h3>Anti-pattern: huge <code>beforeEach</code></h3>
<pre><code class="language-typescript">// BAD — magic state per test; readers must scroll up
beforeEach(() =&gt; {
  // 50 lines setting up mocks, fixtures, state...
});

// GOOD — explicit per test
test('something', () =&gt; {
  const user = aUser({ role: 'ADMIN' });
  server.use(...);
  renderWithProviders(&lt;Admin user={user} /&gt;);
  // …
});
</code></pre>

<h3>Anti-pattern: <code>describe.skip</code> on production code</h3>
<p>An entire suite skipped for "we'll fix it later." Either fix or delete; never let it rot.</p>

<h3>Anti-pattern: 200-line tests</h3>
<p>If a test reads like a story, split it. Each test should answer one question; long tests obscure failures.</p>

<h3>Anti-pattern: skipping a11y</h3>
<p>RTL's role-based queries already pressure you toward accessibility. Add <code>jest-axe</code> on key flows for the rest.</p>

<h3>Anti-pattern: testing CSS</h3>
<p>JSDOM doesn't compute layout. <code>toHaveStyle('display: none')</code> only works for inline styles. For real visual regression, use Playwright snapshots or Chromatic. JSDOM tests should focus on logic.</p>

<h3>Anti-pattern: not failing on <code>console.error</code></h3>
<p>React's helpful warnings get swallowed. Configure your setup to throw on unexpected errors.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common Jest+RTL interview prompts</h3>
<ol>
  <li>Walk me through how you'd test this component.</li>
  <li>Compare RTL to Enzyme; why did the industry move?</li>
  <li>How do you mock the network in tests?</li>
  <li>How do you handle async UI in tests?</li>
  <li>What's the difference between <code>userEvent</code> and <code>fireEvent</code>?</li>
  <li>How do you test a custom hook?</li>
  <li>How do you decide what's worth a test?</li>
  <li>How do you debug a flaky test?</li>
</ol>

<h3>The 5-step framework</h3>
<ol>
  <li><strong>Identify behaviours</strong> the user can observe (visible text, focus, navigation, network calls).</li>
  <li><strong>Pick the layer:</strong> integration via RTL by default; unit for pure functions.</li>
  <li><strong>Render with real providers</strong> through a custom <code>renderWithProviders</code>.</li>
  <li><strong>Mock at boundaries</strong> with MSW for HTTP; module mocks for analytics, native modules.</li>
  <li><strong>Query semantically</strong> (role &gt; label &gt; text); interact with <code>userEvent</code>; assert with jest-dom matchers.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"Query by role with the accessible name — same selectors a screen reader would use."</em></li>
  <li><em>"<code>userEvent</code> over <code>fireEvent</code> because it models the full interaction sequence (focus, type, blur)."</em></li>
  <li><em>"MSW for network — exercises the real fetcher, parser, cache, renderer."</em></li>
  <li><em>"<code>findBy</code> for elements that appear async; <code>queryBy</code> for asserting absence."</em></li>
  <li><em>"<code>jest-dom</code> matchers for DOM-aware assertions like <code>toBeVisible</code>, <code>toBeDisabled</code>, <code>toHaveAccessibleName</code>."</em></li>
  <li><em>"Vitest for web; Jest for RN — same API, faster cold start on web because of native ESM."</em></li>
  <li><em>"Fresh QueryClient per test, MSW handlers reset between tests, mocks restored — avoids order-dependence."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt keyword</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"test this form"</td><td>RTL + userEvent + label-based queries + MSW</td></tr>
    <tr><td>"async data"</td><td><code>findBy</code> + MSW handler override per test</td></tr>
    <tr><td>"debounce"</td><td>Fake timers + <code>userEvent.setup({ advanceTimers })</code></td></tr>
    <tr><td>"custom hook"</td><td><code>renderHook</code> + <code>act</code></td></tr>
    <tr><td>"navigation"</td><td>Wrap in MemoryRouter; assert on location or screen content after route</td></tr>
    <tr><td>"a11y"</td><td>Role-based queries + <code>jest-axe</code></td></tr>
    <tr><td>"mocked module"</td><td>Top-level <code>vi.mock</code>; reach for it sparingly</td></tr>
    <tr><td>"flaky test"</td><td>Replace timers, replace network, isolate state</td></tr>
  </tbody>
</table>

<h3>Demo script (whiteboard / IDE)</h3>
<ol>
  <li>List behaviours.</li>
  <li>Sketch <code>renderWithProviders</code> import.</li>
  <li>Show one test for the happy path with userEvent + findBy.</li>
  <li>Show one test for an error path with MSW override.</li>
  <li>Show one assertion with role-based query + jest-dom matcher.</li>
  <li>Talk fake timers / cleanup / fresh client per test.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"Add jest-axe on each form to enforce a11y in CI."</em></li>
  <li><em>"Fail tests on console.error to catch React warnings."</em></li>
  <li><em>"Custom <code>renderWithProviders</code> wrapping all providers + MSW handler factories."</em></li>
  <li><em>"Test data builders (<code>aUser</code>, <code>anOrder</code>) to keep tests readable."</em></li>
  <li><em>"Per-folder coverage thresholds — billing 90%, marketing 0%."</em></li>
  <li><em>"Mutation testing once a quarter to audit suite quality."</em></li>
  <li><em>"Visual regression for design-system components."</em></li>
  <li><em>"Lint rules from <code>eslint-plugin-testing-library</code> + <code>eslint-plugin-jest-dom</code>."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Query priority fluency</td><td>Reaches for role; falls back deliberately</td></tr>
    <tr><td>Async discipline</td><td>findBy / waitFor; not setTimeout</td></tr>
    <tr><td>userEvent over fireEvent</td><td>Default; knows when to deviate</td></tr>
    <tr><td>Network mocking</td><td>MSW; not call-site fetch.mockResolvedValue</td></tr>
    <tr><td>Provider hygiene</td><td>Custom render with fresh providers per test</td></tr>
    <tr><td>Cleanup discipline</td><td>Reset handlers, mocks, timers</td></tr>
    <tr><td>jest-dom usage</td><td>Reaches for <code>toBeDisabled</code>, <code>toBeVisible</code> instead of asserting raw DOM</td></tr>
    <tr><td>RN awareness</td><td>Knows to swap to react-native preset for RN</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>Same RTL API via <code>@testing-library/react-native</code>.</li>
  <li>Query by <code>accessibilityRole</code>, <code>accessibilityLabel</code>; many components don't have implicit roles.</li>
  <li>Mock native modules: AsyncStorage, MMKV, Reanimated, BlurView, NetInfo, etc., often via <code>jest.setup.js</code>.</li>
  <li>Animations: Reanimated provides <code>react-native-reanimated/mock</code>; require it in setup.</li>
  <li>FlatList / SectionList: items only render visible window; use <code>initialNumToRender</code> overrides in tests or query rendered text.</li>
  <li>Navigation: wrap in <code>NavigationContainer</code> with mocked routes; <code>react-navigation</code> ships testing helpers.</li>
  <li>Native gestures: PanResponder / Reanimated gesture handler can't be exercised in JSDOM/Node — push to Detox / Maestro for those flows.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"Why did the industry move from Enzyme to RTL?"</em> — Enzyme exposed instance internals (state, props), encouraged implementation tests; RTL forces user-perspective queries; refactor-resilient.</li>
  <li><em>"Why MSW over fetch.mockResolvedValue?"</em> — MSW exercises the real fetcher; survives migration from fetch to axios; centralises responses; supports realistic delays / errors.</li>
  <li><em>"How do you debug a slow test suite?"</em> — Profile with <code>--reporter=verbose</code>; minimise providers; check for N×N rendering in <code>renderWithProviders</code>; parallelise.</li>
  <li><em>"How do you make sure tests don't leak state?"</em> — Fresh providers; reset MSW; restore mocks; <code>vitest --shuffle</code> / <code>jest --randomize</code> in CI.</li>
  <li><em>"How do you test a hook that uses navigation?"</em> — Wrap in router, render hook with custom <code>wrapper</code>, assert on navigation calls or rendered output.</li>
  <li><em>"How do you mock network for SSR tests?"</em> — MSW with <code>setupServer</code> in Node; same API.</li>
  <li><em>"What's your stance on snapshots?"</em> — Inline only, narrow scope, audit periodically; never full-tree.</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Set up Vitest + RTL + MSW + jest-dom in a tiny project.</li>
  <li>Write 10 component tests using only role + label queries.</li>
  <li>Write 5 hook tests with <code>renderHook</code>.</li>
  <li>Write a slow test on purpose; profile and fix it.</li>
  <li>Memorise the query priority + async tools.</li>
  <li>Memorise the jest-dom matcher list.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read Kent C. Dodds's RTL recipes and pitfalls posts."</li>
  <li>"Read the MSW docs cover to cover; the philosophy is half the value."</li>
  <li>"Build a tiny RN project with @testing-library/react-native to feel the differences."</li>
  <li>"Profile a real codebase's test suite; write down the top 5 wins."</li>
</ul>
`
    }
  ]
});
