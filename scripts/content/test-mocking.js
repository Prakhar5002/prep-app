window.PREP_SITE.registerTopic({
  id: 'test-mocking',
  module: 'testing',
  title: 'Mocking Strategies',
  estimatedReadTime: '45 min',
  tags: ['mocking', 'msw', 'spies', 'stubs', 'fakes', 'dependency-injection', 'test-doubles', 'fixtures'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Mocking</strong> replaces a real collaborator with a controlled stand-in for the duration of a test. Used right, mocks let you test fast, deterministic, and focused. Used wrong, mocks pin tests to implementation details and silently rot as the real thing changes underneath.</p>
<ul>
  <li><strong>The five test doubles (Gerard Meszaros):</strong> dummy, stub, fake, spy, mock. Don't conflate them.</li>
  <li><strong>Mock at boundaries, not internals.</strong> Mock the network, the clock, the file system, native modules — not your own functions under test.</li>
  <li><strong>Network mocking:</strong> use <strong>MSW</strong> (or a request interceptor) so the real fetcher / parser / cache run; don't <code>fetch.mockResolvedValue</code> at the call site.</li>
  <li><strong>Time:</strong> fake timers (<code>vi.useFakeTimers</code> / <code>jest.useFakeTimers</code>) for debounce / interval; <code>page.clock</code> in Playwright; inject the clock function in production code.</li>
  <li><strong>Module mocks (<code>vi.mock</code> / <code>jest.mock</code>):</strong> strong tool, easy to abuse — reach for it to mute analytics, native modules, third-party SDKs, <em>not</em> the function under test.</li>
  <li><strong>Dependency injection</strong> beats module mocking; pass collaborators in, swap with a fake in tests.</li>
  <li><strong>Mobile / RN:</strong> the bridge to native is your boundary — mock AsyncStorage, MMKV, NetInfo, FCM at the JS/native edge.</li>
</ul>
<p><strong>Mantra:</strong> "Mock at the boundary. Inject when you can. Test the real thing whenever the test stays fast and deterministic."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What "mocking" means</h3>
<p>"Mock" is colloquially used for any test stand-in. In Meszaros's vocabulary (and in serious testing literature), there are five distinct kinds of "test double":</p>
<table>
  <thead><tr><th>Kind</th><th>Behaviour</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td><strong>Dummy</strong></td><td>Passed but never used; placeholder.</td><td><code>new User('dummy', 'dummy@x.com', null)</code> when only id matters</td></tr>
    <tr><td><strong>Stub</strong></td><td>Returns canned values for queries; no verification.</td><td><code>fetcher.mockResolvedValue(['a', 'b'])</code></td></tr>
    <tr><td><strong>Fake</strong></td><td>Real working impl, simpler than prod. In-memory DB, fake clock.</td><td>SQLite for tests instead of Postgres; in-memory file system</td></tr>
    <tr><td><strong>Spy</strong></td><td>Records calls; real impl runs.</td><td><code>vi.spyOn(console, 'log')</code></td></tr>
    <tr><td><strong>Mock</strong></td><td>Pre-programmed expectations; verifies interactions.</td><td><code>vi.fn()</code> + <code>expect(mock).toHaveBeenCalledWith(...)</code></td></tr>
  </tbody>
</table>
<p>Mixing them up isn't a vocabulary issue — it's a design issue. Tests that look like "stubs" but assert on calls become accidental mocks; tests that "fake" with stubs lose realism.</p>

<h3>Why mock at all</h3>
<ul>
  <li><strong>Speed:</strong> avoid real DB / network / disk in unit / integration tests.</li>
  <li><strong>Determinism:</strong> network is flaky; clocks tick; files exist or don't. Tests must be reproducible.</li>
  <li><strong>Isolation:</strong> a test for the cart shouldn't depend on the inventory service being up.</li>
  <li><strong>Edge cases:</strong> simulate a 500 error, a slow network, a clock at year 9999.</li>
  <li><strong>Cost:</strong> avoid charging Stripe, hitting email-send quotas, paying for SMS in CI.</li>
</ul>

<h3>Why over-mocking is dangerous</h3>
<ul>
  <li><strong>Tests pass while integration breaks.</strong> Mocks drift from reality silently.</li>
  <li><strong>Refactor cost balloons.</strong> Every internal change breaks dozens of mock setups.</li>
  <li><strong>Confidence collapses.</strong> Coverage looks high; bugs ship anyway.</li>
  <li><strong>Tests reimplement the function under test.</strong> Mocks encode the same assumptions; bug case the mock didn't anticipate ships.</li>
</ul>

<h3>The "mock the boundary" rule</h3>
<p>Every system has boundaries between code <em>you control</em> and code / state <em>you don't</em>. The right place to mock is at those boundaries:</p>
<ul>
  <li>Network (HTTP, WS) — MSW</li>
  <li>Clock / time — fake timers</li>
  <li>Random — inject the RNG</li>
  <li>File system — memfs / tmpdir</li>
  <li>Browser APIs (geo, notifications, clipboard) — stub via <code>navigator.geolocation = ...</code></li>
  <li>Native modules (RN bridge) — Jest module mocks at the bridge</li>
  <li>Third-party SDKs — module mock the SDK; let your wrapper run real</li>
</ul>
<p>Inside those boundaries, run the real code. That's where the bugs are.</p>

<h3>What "good mocking" looks like</h3>
<ul>
  <li>Mocks live at the network / clock / native-module boundary, not sprinkled mid-call.</li>
  <li>You can read a test and tell what's real vs faked at a glance.</li>
  <li>The fake clock advances explicitly; the fake network has explicit handlers per route.</li>
  <li>Each mock is reset / restored between tests.</li>
  <li>The mock surface is small; if you find yourself mocking 20 functions, redesign.</li>
  <li>The wrapper around the third-party SDK is testable; the SDK itself is mocked.</li>
</ul>

<h3>What "bad mocking" looks like</h3>
<ul>
  <li>Mocking the function under test: tautological; tests prove nothing.</li>
  <li>Mocking React, useState, useEffect: testing the framework.</li>
  <li>Auto-mocking everything: brittle; loses behavioural coverage.</li>
  <li>Mocking by string-matching call args: pins tests to implementation.</li>
  <li>One <code>setupTests.ts</code> with 50 module mocks: invisible defaults; tests fail mysteriously.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The five test doubles in code</h3>

<h4>Dummy</h4>
<pre><code class="language-typescript">// Doesn't matter; not used inside the function under test
function processOrder(order: Order, _logger: Logger) { ... }
const dummy: Logger = { log() {}, error() {} };
processOrder(order, dummy);
</code></pre>

<h4>Stub</h4>
<pre><code class="language-typescript">const userApi = {
  byId: vi.fn().mockResolvedValue({ id: 1, name: 'P' }),
};
// Test only cares about the return; doesn't verify how byId was called
</code></pre>

<h4>Fake</h4>
<pre><code class="language-typescript">// In-memory implementation that behaves like the real thing
class FakeUserRepo {
  private store = new Map&lt;number, User&gt;();
  async byId(id: number) { return this.store.get(id); }
  async save(u: User) { this.store.set(u.id, u); }
}
</code></pre>

<h4>Spy</h4>
<pre><code class="language-typescript">const spy = vi.spyOn(console, 'error');
doThing();
expect(spy).not.toHaveBeenCalled();
// Real console.error still runs unless .mockImplementation is added
</code></pre>

<h4>Mock</h4>
<pre><code class="language-typescript">const onSubmit = vi.fn();
render(&lt;Form onSubmit={onSubmit} /&gt;);
// ... interact ...
expect(onSubmit).toHaveBeenCalledWith({ email: 'p@x.com' });
</code></pre>

<h3>The "where to mock" matrix</h3>
<table>
  <thead><tr><th>Boundary</th><th>Tool</th></tr></thead>
  <tbody>
    <tr><td>HTTP fetch / axios / GraphQL</td><td>MSW (request handlers)</td></tr>
    <tr><td>WebSocket</td><td>MSW WebSocket handlers / mock-socket</td></tr>
    <tr><td>Time (Date.now, setTimeout, setInterval)</td><td>vi.useFakeTimers / jest.useFakeTimers</td></tr>
    <tr><td>Random (Math.random, crypto.randomUUID)</td><td>Inject the RNG; mock with seed</td></tr>
    <tr><td>File system (Node)</td><td>memfs; <code>fs.promises</code> mock</td></tr>
    <tr><td>Database</td><td>SQLite / in-memory fake; or Testcontainers for real</td></tr>
    <tr><td>Browser globals (geolocation, clipboard)</td><td>Stub on <code>navigator</code> / <code>window</code></td></tr>
    <tr><td>Service Workers / Cache API</td><td>Mock or use a polyfill</td></tr>
    <tr><td>Native modules (RN)</td><td><code>jest.mock('@react-native-async-storage/async-storage', ...)</code></td></tr>
    <tr><td>Third-party SDKs (Stripe, FCM, Analytics)</td><td>Module-mock the SDK; test your wrapper around it</td></tr>
  </tbody>
</table>

<h3>Dependency injection: the un-mock</h3>
<p>If your function takes its collaborators as arguments, you can pass a fake in tests without any module-mocking machinery:</p>
<pre><code class="language-typescript">// PRODUCTION
async function getUserDisplay(id: string, deps = { fetch, now: () =&gt; Date.now() }) {
  const u = await deps.fetch(\`/users/\${id}\`).then(r =&gt; r.json());
  return \`\${u.name} (joined \${formatRelative(u.joinedAt, deps.now())})\`;
}

// TEST
const fakeFetch = async () =&gt; ({ json: async () =&gt; ({ name: 'P', joinedAt: 0 }) });
const fakeNow = () =&gt; 1_000_000;
expect(await getUserDisplay('1', { fetch: fakeFetch, now: fakeNow })).toBe('P (joined …)');
</code></pre>
<p>No module mocking; no global state. Survives module restructuring. Encourages testable code.</p>

<h3>The mock invocation hierarchy</h3>
<pre><code class="language-text">most preferred  ▸ pure function (no dependencies; no mocks)
                ▸ function with injected deps (DI)
                ▸ component with mocked network (MSW)
                ▸ component with module-mocked third-party
                ▸ component with module-mocked own code
least preferred ▸ component with framework mocked (React, etc.)
</code></pre>

<h3>Auto-mock vs manual mock</h3>
<table>
  <thead><tr><th>Approach</th><th>Use when</th></tr></thead>
  <tbody>
    <tr><td>Manual stub (<code>vi.fn()</code>)</td><td>You know what return value you need.</td></tr>
    <tr><td>Manual mock module (<code>vi.mock</code> with factory)</td><td>You want to replace a module entirely with a fake.</td></tr>
    <tr><td><code>vi.mock</code> auto-mock (no factory)</td><td>You don't care about behaviour; want all exports as no-ops.</td></tr>
    <tr><td><code>__mocks__</code> folder</td><td>Same module mocked the same way across many test files.</td></tr>
  </tbody>
</table>
<p>Auto-mock everywhere is a smell. Most module mocks should be intentional with a factory.</p>

<h3>Reset, restore, clear</h3>
<table>
  <thead><tr><th>Method</th><th>Effect</th></tr></thead>
  <tbody>
    <tr><td><code>mockClear()</code></td><td>Resets call history; keeps mock impl.</td></tr>
    <tr><td><code>mockReset()</code></td><td>Resets call history + impl.</td></tr>
    <tr><td><code>mockRestore()</code></td><td>Restores original (only for spies).</td></tr>
    <tr><td><code>vi.clearAllMocks()</code> / <code>jest.clearAllMocks()</code></td><td>All mocks: clear history.</td></tr>
    <tr><td><code>vi.resetAllMocks()</code></td><td>All mocks: clear + reset impl.</td></tr>
    <tr><td><code>vi.restoreAllMocks()</code></td><td>All spies: restore originals.</td></tr>
  </tbody>
</table>
<p>Common <code>afterEach</code>: <code>vi.restoreAllMocks()</code>. Pair with config-level <code>clearMocks: true</code> for the lazy default.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>MSW: the network mocking standard</h3>
<p>Mock Service Worker intercepts <code>fetch</code> / XHR at the request layer — your app calls <code>fetch('/api/users')</code> as in production; MSW returns a response defined by your handlers. Works in Node (tests), browser (dev), and RN.</p>

<pre><code class="language-typescript">// src/tests/server.ts
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const server = setupServer(
  http.get('/api/users/:id', ({ params }) =&gt;
    HttpResponse.json({ id: params.id, name: 'Default' })
  ),
  http.post('/api/users', async ({ request }) =&gt; {
    const body = await request.json();
    return HttpResponse.json({ id: 'new', ...body }, { status: 201 });
  }),
);
</code></pre>

<pre><code class="language-typescript">// setup file
import { server } from './server';

beforeAll(() =&gt; server.listen({ onUnhandledRequest: 'error' }));
afterEach(() =&gt; server.resetHandlers());
afterAll(() =&gt; server.close());
</code></pre>

<pre><code class="language-typescript">// per-test override
import { http, HttpResponse } from 'msw';
import { server } from '../tests/server';

test('shows error when API returns 500', async () =&gt; {
  server.use(
    http.get('/api/users/1', () =&gt;
      HttpResponse.json({ error: 'oops' }, { status: 500 })
    )
  );
  // ...
});
</code></pre>

<p>Why MSW beats <code>fetch.mockResolvedValue</code>:</p>
<ul>
  <li>Tests exercise your real fetcher (auth headers, retries, error mapping).</li>
  <li>Same handlers work for tests, Storybook, and dev mode.</li>
  <li>Network-shape changes show up everywhere at once.</li>
  <li>Realistic delays, errors, status codes.</li>
</ul>

<h3>Fake timers</h3>
<pre><code class="language-typescript">import { vi } from 'vitest';

beforeEach(() =&gt; { vi.useFakeTimers(); });
afterEach(() =&gt; { vi.useRealTimers(); });

test('debounced search fires once', async () =&gt; {
  const fetcher = vi.fn().mockResolvedValue([]);
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(&lt;Search fetcher={fetcher} /&gt;);

  await user.type(screen.getByRole('searchbox'), 'apple');
  expect(fetcher).not.toHaveBeenCalled();

  await vi.advanceTimersByTimeAsync(300);
  expect(fetcher).toHaveBeenCalledOnce();
});
</code></pre>
<ul>
  <li><code>vi.useFakeTimers</code> intercepts <code>setTimeout</code>, <code>setInterval</code>, <code>Date</code>, <code>requestAnimationFrame</code>.</li>
  <li><code>advanceTimersByTime(ms)</code> moves the clock forward synchronously.</li>
  <li><code>advanceTimersByTimeAsync(ms)</code> also flushes any awaited microtasks.</li>
  <li>If using fake timers with <code>userEvent</code>, pass <code>advanceTimers</code> in <code>setup()</code> or typing hangs.</li>
</ul>

<h3>Spies</h3>
<pre><code class="language-typescript">test('logs an error on bad input', () =&gt; {
  const spy = vi.spyOn(console, 'error').mockImplementation(() =&gt; {});
  doThing(badInput);
  expect(spy).toHaveBeenCalledWith(expect.stringMatching(/invalid/i));
});
</code></pre>
<p>Spy without <code>mockImplementation</code> still calls the real function; useful for "did this happen?" assertions without changing behaviour.</p>

<h3>Module mocks</h3>
<pre><code class="language-typescript">// Hoisted automatically — runs before imports
vi.mock('@/lib/analytics', () =&gt; ({
  track: vi.fn(),
  identify: vi.fn(),
  flush: vi.fn().mockResolvedValue(undefined),
}));

import { track } from '@/lib/analytics';

test('tracks signup attempts', async () =&gt; {
  // ...
  expect(track).toHaveBeenCalledWith('signup', expect.any(Object));
});
</code></pre>

<p>Partial module mocks:</p>
<pre><code class="language-typescript">vi.mock('@/lib/api', async (importOriginal) =&gt; {
  const actual = await importOriginal&lt;typeof import('@/lib/api')&gt;();
  return {
    ...actual,
    fetchUser: vi.fn().mockResolvedValue({ id: 1, name: 'P' }),
  };
});
</code></pre>
<p>Use sparingly — preserves accidental coupling. Prefer DI.</p>

<h3>Class mocks</h3>
<pre><code class="language-typescript">vi.mock('./AnalyticsClient', () =&gt; ({
  AnalyticsClient: vi.fn().mockImplementation(() =&gt; ({
    track: vi.fn(),
    flush: vi.fn().mockResolvedValue(undefined),
  })),
}));
</code></pre>

<h3>Mocking <code>Date</code></h3>
<pre><code class="language-typescript">vi.useFakeTimers();
vi.setSystemTime(new Date('2026-04-30T12:00:00Z'));
expect(Date.now()).toBe(new Date('2026-04-30T12:00:00Z').getTime());
vi.useRealTimers();
</code></pre>

<h3>Mocking randomness</h3>
<pre><code class="language-typescript">// Production
function generateId(rand = Math.random) {
  return Math.floor(rand() * 1_000_000);
}

// Test
const fixed = vi.fn().mockReturnValue(0.5);
expect(generateId(fixed)).toBe(500_000);
</code></pre>
<p>Or seed a deterministic PRNG (e.g., <code>seedrandom</code>) for property-based tests.</p>

<h3>Mocking <code>fetch</code> directly (when MSW is overkill)</h3>
<pre><code class="language-typescript">global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () =&gt; ({ id: 1 }),
});
</code></pre>
<p>Quick + dirty for one-off tests; not recommended at scale because it bypasses your fetcher's auth / retry / error handling.</p>

<h3>Mocking ESM imports (Vitest)</h3>
<p>Vitest hoists <code>vi.mock</code> calls to the top, regardless of where they appear. Same for Jest. ESM compatibility is solid in Vitest; Jest needs <code>--experimental-vm-modules</code> for full ESM.</p>

<h3>RN: mocking native modules</h3>
<pre><code class="language-javascript">// jest.setup.js
jest.mock('@react-native-async-storage/async-storage', () =&gt; ({
  getItem: jest.fn(() =&gt; Promise.resolve(null)),
  setItem: jest.fn(() =&gt; Promise.resolve()),
  removeItem: jest.fn(() =&gt; Promise.resolve()),
  clear: jest.fn(() =&gt; Promise.resolve()),
}));

jest.mock('react-native-reanimated', () =&gt; require('react-native-reanimated/mock'));

jest.mock('@react-native-firebase/messaging', () =&gt; ({
  __esModule: true,
  default: () =&gt; ({
    requestPermission: jest.fn().mockResolvedValue(1),
    getToken: jest.fn().mockResolvedValue('fake-fcm-token'),
    onMessage: jest.fn(() =&gt; () =&gt; {}),
  }),
}));
</code></pre>

<h3>Mocking the Stripe (or any) SDK</h3>
<pre><code class="language-typescript">// Hide the SDK behind a thin wrapper
// src/lib/stripe.ts
export async function chargeCustomer(customerId: string, amountCents: number) {
  return stripe.charges.create({ customer: customerId, amount: amountCents });
}

// In tests, mock the wrapper, not stripe internals
vi.mock('@/lib/stripe', () =&gt; ({
  chargeCustomer: vi.fn().mockResolvedValue({ id: 'ch_1', status: 'succeeded' }),
}));
</code></pre>
<p>Wrappers turn out-of-control SDKs into testable units.</p>

<h3>Snapshot of mock calls</h3>
<pre><code class="language-typescript">expect(track.mock.calls).toMatchInlineSnapshot(\`
  [
    ['signup_started', { method: 'email' }],
    ['signup_completed', { method: 'email', userId: '1' }],
  ]
\`);
</code></pre>
<p>Useful for asserting an ordered sequence of analytics events without 10 separate <code>toHaveBeenNthCalledWith</code>.</p>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: DI over module mocking</h3>
<pre><code class="language-typescript">// PRODUCTION — collaborator passed in
class CartService {
  constructor(
    private api: ApiClient,
    private now: () =&gt; number = () =&gt; Date.now()
  ) {}

  async addItem(itemId: string) {
    const ts = this.now();
    return this.api.post('/cart/items', { itemId, ts });
  }
}

// TEST — pass fakes
test('records timestamp on add', async () =&gt; {
  const api = { post: vi.fn().mockResolvedValue({}) };
  const cart = new CartService(api as any, () =&gt; 1_000);
  await cart.addItem('sku-1');
  expect(api.post).toHaveBeenCalledWith('/cart/items', { itemId: 'sku-1', ts: 1_000 });
});
</code></pre>

<h3>Example 2: MSW for the realistic path</h3>
<pre><code class="language-typescript">// component
function User({ id }: { id: string }) {
  const { data, error, isLoading } = useQuery(['user', id], () =&gt;
    fetch(\`/api/users/\${id}\`).then(r =&gt; { if (!r.ok) throw new Error(r.statusText); return r.json(); })
  );
  if (isLoading) return &lt;Spinner /&gt;;
  if (error) return &lt;Alert message="Failed to load user" /&gt;;
  return &lt;h1&gt;{data.name}&lt;/h1&gt;;
}

// test
test('renders user name', async () =&gt; {
  server.use(http.get('/api/users/1', () =&gt; HttpResponse.json({ name: 'Prakhar' })));
  render(&lt;User id="1" /&gt;);
  expect(await screen.findByRole('heading', { name: 'Prakhar' })).toBeInTheDocument();
});

test('shows error when API fails', async () =&gt; {
  server.use(http.get('/api/users/1', () =&gt; HttpResponse.json({}, { status: 500 })));
  render(&lt;User id="1" /&gt;);
  expect(await screen.findByText(/failed to load/i)).toBeInTheDocument();
});
</code></pre>

<h3>Example 3: Fake clock for time-dependent UI</h3>
<pre><code class="language-typescript">test('shows "5 minutes ago" for recent comments', () =&gt; {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-04-30T12:00:00Z'));

  render(&lt;Comment createdAt="2026-04-30T11:55:00Z" /&gt;);
  expect(screen.getByText('5 minutes ago')).toBeInTheDocument();

  vi.useRealTimers();
});
</code></pre>

<h3>Example 4: Spy on logger without changing behaviour</h3>
<pre><code class="language-typescript">test('logs slow requests', async () =&gt; {
  const spy = vi.spyOn(logger, 'warn');
  await fetchWithMetrics('/slow', { simulateSlowMs: 600 });
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('slow request'));
});
</code></pre>

<h3>Example 5: Stub the third-party SDK behind a wrapper</h3>
<pre><code class="language-typescript">// production wrapper
// src/lib/payments.ts
export async function chargeCard(token: string, cents: number) {
  return stripe.charges.create({ source: token, amount: cents });
}

// tests
vi.mock('@/lib/payments', () =&gt; ({
  chargeCard: vi.fn(),
}));
import { chargeCard } from '@/lib/payments';

test('checkout calls chargeCard', async () =&gt; {
  (chargeCard as any).mockResolvedValue({ id: 'ch_1' });
  // exercise the checkout flow
  expect(chargeCard).toHaveBeenCalledWith('tok_test', 1234);
});
</code></pre>

<h3>Example 6: In-memory fake DB</h3>
<pre><code class="language-typescript">interface UserRepo {
  byId(id: string): Promise&lt;User | null&gt;;
  save(u: User): Promise&lt;void&gt;;
}

class InMemoryUserRepo implements UserRepo {
  private store = new Map&lt;string, User&gt;();
  async byId(id: string) { return this.store.get(id) ?? null; }
  async save(u: User) { this.store.set(u.id, u); }
}

test('updates name', async () =&gt; {
  const repo = new InMemoryUserRepo();
  await repo.save({ id: '1', name: 'P' });
  await renameUser(repo, '1', 'Prakhar');
  expect((await repo.byId('1'))?.name).toBe('Prakhar');
});
</code></pre>
<p>Fakes are typically more honest than mocks — you can verify behaviour without coupling to call signatures.</p>

<h3>Example 7: Mock <code>navigator.geolocation</code></h3>
<pre><code class="language-typescript">test('shows local weather using user location', async () =&gt; {
  const getCurrentPosition = vi.fn((success: any) =&gt;
    success({ coords: { latitude: 12.97, longitude: 77.59 } })
  );
  Object.defineProperty(global.navigator, 'geolocation', {
    value: { getCurrentPosition },
    writable: true,
  });

  render(&lt;Weather /&gt;);
  expect(await screen.findByText(/bangalore/i)).toBeInTheDocument();
});
</code></pre>

<h3>Example 8: Mock RN AsyncStorage</h3>
<pre><code class="language-typescript">// jest.setup.js
jest.mock('@react-native-async-storage/async-storage', () =&gt; ({
  getItem: jest.fn(() =&gt; Promise.resolve(null)),
  setItem: jest.fn(() =&gt; Promise.resolve()),
  removeItem: jest.fn(() =&gt; Promise.resolve()),
}));

// in test
import AsyncStorage from '@react-native-async-storage/async-storage';

test('caches user profile', async () =&gt; {
  await loadProfile('1');
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('profile-1', expect.any(String));
});
</code></pre>

<h3>Example 9: Property-based testing without a mock</h3>
<pre><code class="language-typescript">import fc from 'fast-check';

test('formatCurrency round-trips through parse', () =&gt; {
  fc.assert(fc.property(fc.integer({ min: 0, max: 1_000_000 }), (cents) =&gt; {
    const formatted = formatCurrency(cents, 'USD');
    expect(parseCurrency(formatted)).toBe(cents);
  }));
});
</code></pre>
<p>For pure functions, property-based testing often beats mocking because it explores edge cases automatically.</p>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>Mock leakage between tests</h3>
<ul>
  <li>One test calls <code>vi.spyOn(console, 'error').mockImplementation(() =&gt; {})</code>; next test loses real console errors.</li>
  <li>Set <code>restoreMocks: true</code> in config; or <code>afterEach(() =&gt; vi.restoreAllMocks())</code>.</li>
  <li>Module mocks are sticky across files in the same test run unless reset.</li>
</ul>

<h3>Hoisting surprises</h3>
<ul>
  <li><code>vi.mock</code> / <code>jest.mock</code> are hoisted to top of file by the transformer. Variables defined later <em>cannot</em> be referenced inside the factory:</li>
</ul>
<pre><code class="language-typescript">// BAD — fakeFn isn't defined when vi.mock runs
const fakeFn = vi.fn();
vi.mock('./api', () =&gt; ({ getUser: fakeFn })); // ReferenceError

// GOOD — define inside factory
vi.mock('./api', () =&gt; ({ getUser: vi.fn().mockResolvedValue({ id: 1 }) }));

// GOOD — vi.hoisted for shared instances
const { fakeFn } = vi.hoisted(() =&gt; ({ fakeFn: vi.fn() }));
vi.mock('./api', () =&gt; ({ getUser: fakeFn }));
</code></pre>

<h3>Async timer pitfalls</h3>
<ul>
  <li><code>vi.advanceTimersByTime</code> doesn't flush microtasks. Use <code>advanceTimersByTimeAsync</code>.</li>
  <li>Mixing real and fake timers: explicit <code>vi.useRealTimers()</code> in <code>afterEach</code>.</li>
  <li>Real <code>setImmediate</code> in Node may not be advanced; use <code>vi.runAllTimersAsync</code>.</li>
</ul>

<h3>MSW edge cases</h3>
<ul>
  <li>Set <code>onUnhandledRequest: 'error'</code> so unmocked fetches fail loudly. <code>'warn'</code> is the default; easy to miss.</li>
  <li>Per-test handler overrides via <code>server.use</code> — reset in <code>afterEach</code>.</li>
  <li>For SSR: <code>setupServer</code> in Node; for browser: <code>setupWorker</code>.</li>
  <li>RN: MSW Native (<code>msw/native</code>) for fetch mocking on RN 0.71+.</li>
</ul>

<h3>Spying on getters / setters / classes</h3>
<pre><code class="language-typescript">// Class instance method
const spy = vi.spyOn(myInstance, 'doThing');

// Static method
const spy = vi.spyOn(MyClass, 'staticMethod');

// Getter / setter
const spy = vi.spyOn(target, 'prop', 'get');
spy.mockReturnValue(42);
</code></pre>

<h3>Mock matchers</h3>
<table>
  <thead><tr><th>Matcher</th><th>Use</th></tr></thead>
  <tbody>
    <tr><td><code>expect.any(Class)</code></td><td>Type-only check</td></tr>
    <tr><td><code>expect.anything()</code></td><td>Anything but null/undefined</td></tr>
    <tr><td><code>expect.objectContaining({ ... })</code></td><td>Subset match</td></tr>
    <tr><td><code>expect.arrayContaining([...])</code></td><td>Subset of array</td></tr>
    <tr><td><code>expect.stringMatching(/.../)</code></td><td>Regex string</td></tr>
    <tr><td><code>expect.closeTo(0.3, 5)</code></td><td>Float within precision</td></tr>
  </tbody>
</table>
<p>Use sparingly — over-loose matchers hide real bugs.</p>

<h3>Snapshot mock-call serialisation</h3>
<p>Functions, dates, and class instances stringify oddly in snapshots. Custom serialisers help:</p>
<pre><code class="language-typescript">expect.addSnapshotSerializer({
  test: (val) =&gt; val instanceof Date,
  serialize: (val: Date) =&gt; \`Date(\${val.toISOString()})\`,
});
</code></pre>

<h3>Testing real network when you must</h3>
<ul>
  <li>"Smoke" suite that runs against a deployed staging — finds CORS, headers, edge bugs.</li>
  <li>Run nightly, not on every PR.</li>
  <li>Tag tests <code>@network</code>; CI flag toggles inclusion.</li>
  <li>Use a contract test (Pact) instead when feasible — cheaper than full smoke.</li>
</ul>

<h3>Mobile / RN edges</h3>
<ul>
  <li>Mock at the JS bridge boundary, not deep into native.</li>
  <li>Reanimated's worklets need a special mock (<code>react-native-reanimated/mock</code>).</li>
  <li>Native gestures can't run in Jest — push to Detox / Maestro.</li>
  <li>Push notifications: mock the FCM module; test the handler logic.</li>
  <li><code>react-native-screens</code> sometimes throws in Jest setups; mock with empty implementations if not relevant.</li>
</ul>

<h3>The "I'm mocking too much" smell</h3>
<p>If a test has more lines of mock setup than test body, redesign the function under test to take collaborators as arguments. The friction the test surfaces is real.</p>

<h3>The "this mock is wrong" lag</h3>
<ul>
  <li>Real API changed shape; mocks didn't. Tests pass; integration breaks.</li>
  <li>Pin OpenAPI spec; codegen mocks; or run periodic contract tests against staging.</li>
  <li>Generate MSW handlers from OpenAPI for free (<code>msw-snapshot</code> tooling exists).</li>
</ul>

<h3>Mocking React internals</h3>
<p>Don't. Tests that mock React, hooks, context — break on every minor RN/React update. Test what your component does, not how React works.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common mocking mistakes</h3>
<ol>
  <li><strong>Mocking the function under test.</strong> Tautological; tests prove nothing.</li>
  <li><strong>Mocking React / framework internals.</strong> Brittle; breaks on framework upgrades.</li>
  <li><strong>Auto-mocking everything.</strong> Loses behavioural coverage; pins on call sigs.</li>
  <li><strong><code>fetch.mockResolvedValue</code> instead of MSW.</strong> Skips your real fetcher's logic.</li>
  <li><strong>No mock cleanup between tests.</strong> Order-dependent suite.</li>
  <li><strong>Hoisting confusion.</strong> Variables referenced inside <code>vi.mock</code> factory aren't defined yet.</li>
  <li><strong>String-matching call args verbatim.</strong> Tests break on whitespace / format changes.</li>
  <li><strong>Mocking instead of injecting.</strong> Friction signals bad design; redesign instead.</li>
  <li><strong>Setting up mocks in <code>beforeEach</code> 50 lines deep.</strong> Tests can't be read in isolation.</li>
  <li><strong>Mocking time without restoring.</strong> Other tests fail in cryptic ways.</li>
  <li><strong>One mock function per real function.</strong> Surface area explodes; reach for fakes instead.</li>
  <li><strong>Pretending mocked tests prove integration.</strong> They don't. Run an end-to-end periodically.</li>
</ol>

<h3>Anti-pattern: tautological mocks</h3>
<pre><code class="language-typescript">// BAD
const fetcher = vi.fn().mockResolvedValue([{ id: 1 }]);
const result = await searchUsers(fetcher, 'a');
expect(result).toEqual([{ id: 1 }]);
// Tested nothing; we just proved <code>fetcher</code> returned what we set.

// GOOD — test the searchUsers logic with a real fake
const repo = new InMemoryUserRepo();
await repo.save({ id: 1, name: 'Alice' });
await repo.save({ id: 2, name: 'Bob' });
const result = await searchUsers(repo, 'a');
expect(result.map(u =&gt; u.name)).toEqual(['Alice']);
</code></pre>

<h3>Anti-pattern: deep call-arg matching</h3>
<pre><code class="language-typescript">// BAD — breaks on minor refactor
expect(track).toHaveBeenCalledWith('signup', {
  method: 'email',
  timestamp: expect.any(Number),
  source: 'web',
  userAgent: expect.any(String),
  // ... 10 more
});

// GOOD — assert the specific facts you care about
expect(track).toHaveBeenCalledWith('signup', expect.objectContaining({ method: 'email' }));
</code></pre>

<h3>Anti-pattern: mocking via global side effect</h3>
<pre><code class="language-typescript">// BAD — pollutes globalThis; risk of leak
global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () =&gt; ({}) });

// GOOD — MSW handler scoped to test
server.use(http.get('*', () =&gt; HttpResponse.json({})));
</code></pre>

<h3>Anti-pattern: leaving fake timers on</h3>
<pre><code class="language-typescript">// BAD — never restored
beforeAll(() =&gt; vi.useFakeTimers());

// GOOD — pair use + restore
beforeEach(() =&gt; vi.useFakeTimers());
afterEach(() =&gt; vi.useRestRealTimers());
</code></pre>

<h3>Anti-pattern: mocking your own logger</h3>
<p>If you mock the logger to assert "we logged something," you're testing implementation. Test the user-visible effect (Toast, Sentry event sent) instead — and let the real logger run.</p>

<h3>Anti-pattern: returning <code>undefined</code> from mocks</h3>
<pre><code class="language-typescript">// BAD — production code does <code>response.json()</code>, mock returns <code>undefined</code>
fetch.mockResolvedValue(undefined);

// Production crashes; test passed because it never reached that branch.
</code></pre>
<p>Always mock with shapes that match production reality. Or use MSW.</p>

<h3>Anti-pattern: manually building "the response object"</h3>
<pre><code class="language-typescript">// BAD — your code calls .json() and .ok and .headers; mock has only one
fetch.mockResolvedValue({ json: async () =&gt; ({ id: 1 }) });
// production: <code>if (!res.ok) throw ...</code> — undefined.ok crashes the wrapper

// GOOD — MSW returns a real Response object
http.get('/api/users', () =&gt; HttpResponse.json({ id: 1 }));
</code></pre>

<h3>Anti-pattern: 50-line <code>jest.setup.js</code> with module mocks</h3>
<p>Invisible defaults; test failures look mysterious. Pull mocks into per-test files; reserve setup file for genuinely global concerns (jest-dom matchers, polyfills).</p>

<h3>Anti-pattern: snapshot of the entire mock</h3>
<pre><code class="language-typescript">// BAD
expect(fetcher).toMatchSnapshot();

// GOOD
expect(fetcher).toHaveBeenCalledWith(expectedUrl, expect.objectContaining({ method: 'POST' }));
</code></pre>

<h3>Anti-pattern: mocking SDK methods one by one</h3>
<pre><code class="language-typescript">// BAD — 30 mocks for 30 SDK methods
vi.mock('stripe', () =&gt; ({
  default: vi.fn().mockImplementation(() =&gt; ({
    charges: { create: vi.fn(), retrieve: vi.fn(), list: vi.fn(), ... },
    customers: { ... },
    ...
  })),
}));

// GOOD — wrap the SDK; mock the wrapper
// src/lib/payments.ts wraps Stripe
vi.mock('@/lib/payments', () =&gt; ({
  chargeCard: vi.fn(),
  refund: vi.fn(),
}));
</code></pre>

<h3>Anti-pattern: ignoring "unhandled request" warnings</h3>
<p>MSW prints "found an unhandled request"; engineers tune it out. Set <code>onUnhandledRequest: 'error'</code> so they fail tests loudly.</p>

<h3>Anti-pattern: testing with real API in CI</h3>
<p>External outage → red CI; rate-limit → flake; secrets in CI → leak risk. Use sandbox APIs at most; mock by default.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common mocking interview prompts</h3>
<ol>
  <li>How do you mock the network in tests?</li>
  <li>When do you reach for a stub vs fake vs mock?</li>
  <li>How do you test a function that calls Stripe / FCM / a third-party SDK?</li>
  <li>How do you handle time-dependent logic in tests?</li>
  <li>What's wrong with mocking your own modules?</li>
  <li>How do you mock RN native modules?</li>
  <li>How would you test a payment flow?</li>
  <li>What does "mock at the boundary" mean?</li>
</ol>

<h3>The 5-step framework</h3>
<ol>
  <li><strong>Identify boundaries:</strong> network, time, random, file system, third-party SDK, native module.</li>
  <li><strong>Decide doubles:</strong> fake (in-memory impl) for stateful collaborators; stub for read-only return values; spy for "did this happen"; mock when verifying interaction.</li>
  <li><strong>Pick a tool:</strong> MSW for network, fake timers for clock, DI for collaborators, module mock for SDKs.</li>
  <li><strong>Set up cleanup:</strong> reset / restore between tests.</li>
  <li><strong>Test behaviour, not call signatures:</strong> assert observable outcomes, not which args you pretended to send.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"Mock at the boundary — network with MSW, time with fake timers, native modules at the bridge. Internals run real."</em></li>
  <li><em>"DI over module mocking when the function signature lets us — no global state, survives restructuring."</em></li>
  <li><em>"In-memory fake over a thicket of stubs when the collaborator has state — keeps tests honest."</em></li>
  <li><em>"MSW because the real fetcher / parser / cache run; <code>fetch.mockResolvedValue</code> bypasses all of that."</em></li>
  <li><em>"Reach for partial-module mock with <code>importOriginal</code> when only one export needs replacement."</em></li>
  <li><em>"Reset MSW handlers + restore mocks between tests; <code>onUnhandledRequest: 'error'</code> catches drift."</em></li>
  <li><em>"Wrap the SDK in a small module; mock the wrapper, not 30 SDK methods."</em></li>
  <li><em>"For RN: AsyncStorage / MMKV / Reanimated / FCM at the JS bridge boundary; native gestures push to Detox."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt keyword</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"mock the network"</td><td>MSW handlers; per-test override</td></tr>
    <tr><td>"time-dependent"</td><td>Fake timers + setSystemTime</td></tr>
    <tr><td>"random / UUID"</td><td>Inject the RNG; mock with seed</td></tr>
    <tr><td>"third-party SDK"</td><td>Wrap behind own module; mock the wrapper</td></tr>
    <tr><td>"verify analytics fires"</td><td>Module-mock analytics; spy on track</td></tr>
    <tr><td>"in-memory DB"</td><td>Build a fake repo; type-checks against the real interface</td></tr>
    <tr><td>"native module"</td><td>Jest setup file with module mock</td></tr>
    <tr><td>"property-based"</td><td>fast-check; no mocking needed</td></tr>
  </tbody>
</table>

<h3>Demo script</h3>
<ol>
  <li>List the boundaries.</li>
  <li>Pick double type for each.</li>
  <li>Show MSW server + per-test override.</li>
  <li>Show fake timer pattern with userEvent.</li>
  <li>Show one DI-style fake.</li>
  <li>Talk reset / restore / cleanup discipline.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"Generate MSW handlers from OpenAPI to keep mocks in sync with API."</em></li>
  <li><em>"Fail tests on unhandled requests / unexpected console errors."</em></li>
  <li><em>"Pact contract tests against critical service boundaries."</em></li>
  <li><em>"Wrap third-party SDKs behind in-house modules so tests are stable."</em></li>
  <li><em>"In-memory fakes for stateful repos; type-check against real interface."</em></li>
  <li><em>"Periodic smoke tests against staging — finds drift mocks won't."</em></li>
  <li><em>"Mutation testing pass to find places where mocks paper over real bugs."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Vocabulary precision</td><td>Knows stub vs spy vs mock vs fake vs dummy</td></tr>
    <tr><td>Boundary instinct</td><td>Mocks the network, clock, native module — not internals</td></tr>
    <tr><td>MSW fluency</td><td>Default network mocking strategy; per-test overrides</td></tr>
    <tr><td>DI preference</td><td>Reaches for collaborator injection before module mocking</td></tr>
    <tr><td>Cleanup discipline</td><td>Reset / restore between tests</td></tr>
    <tr><td>Restraint</td><td>Doesn't mock React; doesn't pin call args verbatim</td></tr>
    <tr><td>Mobile awareness</td><td>Knows the JS bridge boundary for RN</td></tr>
    <tr><td>Trade-offs</td><td>Speaks the cost of every mock + when to skip mocks entirely</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN's "boundary" is the JS bridge — mock <code>react-native</code>, <code>@react-native-async-storage/...</code>, <code>react-native-mmkv</code>, <code>@react-native-firebase/...</code>, <code>react-native-reanimated</code> at <code>jest.setup.js</code>.</li>
  <li>Reanimated mock: <code>require('react-native-reanimated/mock')</code>.</li>
  <li>Navigation: use <code>NavigationContainer</code> with stub routes; assert on rendered content.</li>
  <li>FlatList window: items render lazily; <code>initialNumToRender</code> can be overridden in tests.</li>
  <li>Native gestures (PanResponder, Reanimated gesture handler): can't be exercised in JSDOM/Node — push to Detox/Maestro.</li>
  <li>Push notifications: mock the FCM module; test handler logic separately.</li>
  <li>MMKV vs AsyncStorage: same mock pattern; production prefers MMKV (faster, sync).</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"What's the cost of mocking the function under test?"</em> — Tests prove nothing; refactors break them; bug ships in the function the mock pretended to verify.</li>
  <li><em>"When would you reach for a fake over a stub?"</em> — Stateful collaborator (DB, repo, queue); when behaviour matters more than return values.</li>
  <li><em>"Why not just <code>fetch.mockResolvedValue</code>?"</em> — Bypasses your real fetcher's auth / retry / parser / error mapping; tests pass while integration breaks.</li>
  <li><em>"How do you mock without coupling to internals?"</em> — DI; mock at the boundary; assert on behaviour not call args.</li>
  <li><em>"How do you keep mocks in sync with the real API?"</em> — Generate from OpenAPI / GraphQL SDL; contract tests against staging; periodic smoke tests.</li>
  <li><em>"How do you test a function that uses Date.now?"</em> — Inject the clock or fake timers; never let production code read time globally without an injection point.</li>
  <li><em>"What's the difference between <code>mockReset</code> and <code>mockRestore</code>?"</em> — Reset clears history + impl; restore returns the original (only for spies).</li>
  <li><em>"How do you mock crypto in tests?"</em> — Inject a crypto provider; in tests use a deterministic seed; in production use the real <code>crypto.randomUUID</code>.</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Memorise the five test doubles + when each fits.</li>
  <li>Build a tiny project with MSW + fake timers + DI fakes; feel the differences.</li>
  <li>Refactor a test that mocked too much into one with DI — note the friction reduction.</li>
  <li>Mock RN AsyncStorage + FCM + Reanimated at the bridge.</li>
  <li>Read MSW's "Best practices" doc.</li>
  <li>Practice the boundary-first explanation.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read xUnit Test Patterns by Gerard Meszaros — the source of the test-double vocabulary."</li>
  <li>"Read Martin Fowler's 'Mocks Aren't Stubs' essay."</li>
  <li>"Audit a real codebase — how many mocks would survive being replaced with DI?"</li>
  <li>"Try property-based testing on a pure function; replace half its unit tests."</li>
</ul>
`
    }
  ]
});
