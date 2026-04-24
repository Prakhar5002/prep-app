window.PREP_SITE.registerTopic({
  id: 'rn-testing',
  module: 'React Native',
  title: 'Testing',
  estimatedReadTime: '22 min',
  tags: ['react-native', 'testing', 'jest', 'rntl', 'detox', 'maestro', 'e2e', 'snapshot', 'mocking'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>RN testing mirrors React testing principles — test what the user experiences, not implementation details — with RN-specific runners and E2E tools.</p>
<ul>
  <li><strong>Jest</strong> — default test runner, bundled with RN. Supports snapshot + assertion tests.</li>
  <li><strong>@testing-library/react-native (RNTL)</strong> — RN-adapted Testing Library. Same API as RTL, uses <code>render</code>, <code>screen</code>, <code>fireEvent</code>, <code>waitFor</code>.</li>
  <li><strong>user-event</strong> — less mature on RN; most RNTL tests use <code>fireEvent</code>.</li>
  <li><strong>MSW</strong> — works in RN via msw-rn or using fetch interception; great for API mocking.</li>
  <li><strong>Detox</strong> — gray-box E2E for iOS + Android. Auto-sync with animations / network; runs on simulator / device.</li>
  <li><strong>Maestro</strong> — newer alternative; YAML-based flows, cross-platform, simpler setup.</li>
  <li><strong>Mocking native modules</strong> — Jest manual mocks in <code>__mocks__</code> directory or <code>jest.mock</code>.</li>
  <li>Goal: cover the critical flows (login, primary action, checkout), not everything. E2E is expensive; reserve for high-value paths.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Unit-test pure functions, RNTL-test components the way users interact, Detox-test the 5 critical user flows. Mock native modules (no shortcut for bare-metal APIs in Jest). Snapshots sparingly.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Why a layered testing strategy</h3>
<p>Same rationale as web:</p>
<ul>
  <li><strong>Static</strong>: TypeScript + ESLint catches most silly bugs.</li>
  <li><strong>Unit</strong>: pure functions, hooks, small components.</li>
  <li><strong>Integration</strong>: a component + its children, mocked external services (API via MSW, native modules).</li>
  <li><strong>E2E</strong>: real simulators/devices, full flow — login, checkout, core tasks.</li>
</ul>
<p>Mobile adds a wrinkle: simulators are slower than web headless, and E2E infra is trickier. Keep E2E small (5-15 tests for the money paths).</p>

<h3>Why RNTL over enzyme</h3>
<p>Same reasons as web: RNTL tests the rendered output (via a custom renderer that mounts components to a fake host), uses accessibility-based queries, resilient to refactors. Enzyme (dead) tested implementation details. RNTL is the current standard.</p>

<h3>Why Detox</h3>
<ul>
  <li><strong>Gray-box</strong> — talks to the app's native bridge/JSI to know exact animation state. Waits automatically instead of sleeping.</li>
  <li><strong>Matchers</strong>: <code>by.id</code>, <code>by.text</code>, <code>by.type</code>.</li>
  <li>iOS + Android support.</li>
  <li>Requires native build — you ship a special Detox-instrumented binary.</li>
</ul>

<h3>Why Maestro</h3>
<p>YAML-based flows — describe taps, swipes, expectations declaratively. No native integration — uses standard accessibility APIs (iOS XCUITest, Android UIAutomator). Simpler setup, no native build. Downside: less deterministic than Detox, slower in some cases. Good for cross-platform flows where Detox setup is heavy.</p>

<h3>Why mock native modules</h3>
<p>Jest runs on Node, not a mobile device. Native modules are ObjC/Swift/Kotlin — don't exist in the test environment. You must mock them. Strategies:</p>
<ul>
  <li>Jest manual mock: a <code>__mocks__/react-native-mmkv.js</code> file returning fixtures.</li>
  <li>Inline <code>jest.mock('lib', ...)</code>.</li>
  <li><code>jest-setup.ts</code> installing globals.</li>
</ul>

<h3>Why not test native code in Jest</h3>
<p>Jest can't execute ObjC / Kotlin. For native code tests: XCTest on iOS, JUnit on Android. Most RN teams skip native unit tests and rely on E2E to cover the bridge.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "trophy" picture (same as web, adjusted for RN)</h3>
<div class="diagram">
<pre>
      ╱╲
     ╱  ╲         E2E (Detox / Maestro)        5-15 tests, critical flows
    ╱────╲
   ╱ INT  ╲       RNTL integration             most of your effort
  ╱────────╲
 ╱  UNIT    ╲     Jest unit (fns, hooks)       smaller share
╱────────────╲
 STATIC (TS + ESLint + CI)                     always-on, free</pre>
</div>

<h3>The "what to mock" picture</h3>
<pre><code>Don't mock (real):
  - Your components
  - Your hooks
  - Your reducers
  - Simple utility functions

Mock (at boundaries):
  - react-native native modules (MMKV, SecureStore, DeviceInfo)
  - Network (MSW or fetch mock)
  - Navigation (partial — mock useNavigation in component unit tests)
  - Third-party SDKs (Firebase, analytics)
  - Timers (jest fake timers)</code></pre>

<h3>The "Detox vs Maestro" decision</h3>
<pre><code>Detox                         Maestro
────────                       ───────
Gray-box, auto-sync            Black-box, UIAutomator / XCUITest
Requires Detox native build    No native build — uses release/debug directly
JS test files + matchers        YAML flow files
Faster (sync waits)             Simpler to write
Better for complex flows        Better for visual regression + simple flows
RN-native                       Cross-platform any mobile app</code></pre>

<h3>The "test file organization" picture</h3>
<pre><code>src/
  components/
    Button/
      Button.tsx
      Button.test.tsx              ← unit + integration
  hooks/
    useAuth.ts
    useAuth.test.ts
  services/
    api.ts
    api.test.ts
e2e/
  login.test.ts                    ← Detox / Maestro
  checkout.test.ts
__mocks__/
  react-native-mmkv.ts             ← global mocks
  react-native-device-info.ts
jest-setup.ts                      ← shared test config</code></pre>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"E2E tests catch everything, so skip unit tests." E2E is slow (seconds per test) and flaky. Most bugs live at component / hook / reducer level — where unit and integration tests are fast and reliable. Use E2E for the last-mile confirmation, not primary defense.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Jest setup</h3>
<pre><code class="language-js">// jest.config.js
module.exports = {
  preset: 'react-native',
  setupFilesAfterEach: ['&lt;rootDir&gt;/jest-setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-mmkv)/)',
  ],
  moduleNameMapper: {
    '\\\\.(png|jpg|svg)$': '&lt;rootDir&gt;/__mocks__/file-mock.js',
  },
};</code></pre>
<pre><code class="language-ts">// jest-setup.ts
import '@testing-library/jest-native/extend-expect';
// Silence LogBox / Animated warnings in tests
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
// Reanimated mock (required)
require('react-native-reanimated/mock');</code></pre>

<h3>RNTL basics</h3>
<pre><code class="language-tsx">import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import Counter from './Counter';

test('increments', () =&gt; {
  render(&lt;Counter /&gt;);
  expect(screen.getByText('Count: 0')).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: /\+/ }));
  expect(screen.getByText('Count: 1')).toBeOnTheScreen();
});</code></pre>

<h3>Async UI</h3>
<pre><code class="language-tsx">test('loads user', async () =&gt; {
  render(&lt;UserProfile id="1" /&gt;);
  expect(screen.getByText(/loading/i)).toBeOnTheScreen();
  expect(await screen.findByText(/ada/i)).toBeOnTheScreen();
});</code></pre>

<h3>Mocking fetch / API</h3>
<pre><code class="language-ts">// Simple approach — jest.spyOn
jest.spyOn(global, 'fetch').mockResolvedValue({
  ok: true,
  json: async () =&gt; ({ id: 1, name: 'Ada' }),
} as any);

// Better — MSW (msw/native works in RN with additional setup)
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.get('/api/user/:id', () =&gt; HttpResponse.json({ id: 1, name: 'Ada' }))
);

beforeAll(() =&gt; server.listen());
afterEach(() =&gt; server.resetHandlers());
afterAll(() =&gt; server.close());</code></pre>

<h3>Mocking native modules</h3>
<pre><code class="language-ts">// __mocks__/react-native-mmkv.ts
export class MMKV {
  private store = new Map();
  set(k: string, v: any) { this.store.set(k, v); }
  getString(k: string) { return this.store.get(k); }
  getNumber(k: string) { return this.store.get(k); }
  getBoolean(k: string) { return this.store.get(k); }
  delete(k: string) { this.store.delete(k); }
  clearAll() { this.store.clear(); }
}

// Tests use it transparently.</code></pre>

<pre><code class="language-ts">// For ad-hoc inline mocks:
jest.mock('expo-secure-store', () =&gt; ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
}));</code></pre>

<h3>Testing hooks</h3>
<pre><code class="language-ts">import { renderHook, act } from '@testing-library/react-native';
import { useCounter } from './useCounter';

test('counter hook', () =&gt; {
  const { result } = renderHook(() =&gt; useCounter(5));
  expect(result.current.count).toBe(5);
  act(() =&gt; { result.current.increment(); });
  expect(result.current.count).toBe(6);
});</code></pre>

<h3>Navigation mocks</h3>
<pre><code class="language-ts">// Lightweight — mock useNavigation
jest.mock('@react-navigation/native', () =&gt; ({
  useNavigation: () =&gt; ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () =&gt; ({ params: { id: '1' } }),
  useFocusEffect: jest.fn((fn) =&gt; fn()),
}));

// Heavyweight — real navigation in tests
function renderWithNav(ui) {
  return render(
    &lt;NavigationContainer&gt;
      &lt;Stack.Navigator&gt;
        &lt;Stack.Screen name="Test" component={() =&gt; ui} /&gt;
      &lt;/Stack.Navigator&gt;
    &lt;/NavigationContainer&gt;
  );
}</code></pre>

<h3>Testing with providers</h3>
<pre><code class="language-tsx">function renderWithProviders(ui, options = {}) {
  const Providers = ({ children }) =&gt; (
    &lt;QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}&gt;
      &lt;ThemeProvider theme={lightTheme}&gt;
        &lt;NavigationContainer&gt;{children}&lt;/NavigationContainer&gt;
      &lt;/ThemeProvider&gt;
    &lt;/QueryClientProvider&gt;
  );
  return render(ui, { wrapper: Providers, ...options });
}</code></pre>

<h3>Fake timers</h3>
<pre><code class="language-ts">beforeEach(() =&gt; jest.useFakeTimers());
afterEach(() =&gt; jest.useRealTimers());

test('debounce', async () =&gt; {
  render(&lt;Search /&gt;);
  fireEvent.changeText(screen.getByPlaceholderText('Search'), 'hello');
  act(() =&gt; { jest.advanceTimersByTime(500); });
  expect(await screen.findByText(/results for hello/i)).toBeOnTheScreen();
});</code></pre>

<h3>Snapshot (sparingly)</h3>
<pre><code class="language-tsx">test('empty state', () =&gt; {
  const tree = render(&lt;List items={[]} /&gt;).toJSON();
  expect(tree).toMatchSnapshot();
});</code></pre>

<h3>Detox basics</h3>
<pre><code># Install
npm install -D detox detox-cli
# iOS: npm install -D applesimutils
# Android: set up AVDs

# detox.config.js
module.exports = {
  apps: { 'ios.debug': { type: 'ios.app', binaryPath: 'ios/build/...App.app', build: 'xcodebuild -workspace ios/App.xcworkspace -scheme App -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build' } },
  devices: { simulator: { type: 'ios.simulator', device: { type: 'iPhone 15' } } },
  configurations: { 'ios.sim.debug': { device: 'simulator', app: 'ios.debug' } },
};

# Build + run
detox build --configuration ios.sim.debug
detox test --configuration ios.sim.debug</code></pre>

<pre><code class="language-ts">// e2e/login.test.ts
describe('Login flow', () =&gt; {
  beforeAll(async () =&gt; { await device.launchApp({ newInstance: true }); });
  beforeEach(async () =&gt; { await device.reloadReactNative(); });

  it('signs in with email', async () =&gt; {
    await element(by.id('email')).typeText('a@b.com');
    await element(by.id('password')).typeText('secret');
    await element(by.id('submit')).tap();
    await expect(element(by.text('Welcome'))).toBeVisible();
  });

  it('shows error on bad creds', async () =&gt; {
    await element(by.id('email')).typeText('x');
    await element(by.id('submit')).tap();
    await expect(element(by.text(/invalid/i))).toBeVisible();
  });
});</code></pre>

<h3>Maestro basics</h3>
<pre><code># Install
curl -Ls "https://get.maestro.mobile.dev" | bash

# YAML flow — .maestro/login.yaml
appId: com.myapp
---
- launchApp
- tapOn:
    id: "email"
- inputText: "a@b.com"
- tapOn:
    id: "password"
- inputText: "secret"
- tapOn:
    id: "submit"
- assertVisible: "Welcome"

# Run
maestro test .maestro/login.yaml</code></pre>

<h3>Testing IDs</h3>
<pre><code class="language-tsx">&lt;Button testID="submit" onPress={...}&gt;Submit&lt;/Button&gt;
// Prefer semantic queries (getByRole, getByText) over testID in RNTL,
// but for E2E (Detox / Maestro), testID is often required.</code></pre>

<h3>Visual regression</h3>
<p>Tools: Maestro's snapshots, Percy, Applitools, <code>react-native-owl</code>. Cover key screens to catch unintentional style changes.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — component with press</h3>
<pre><code class="language-tsx">test('button calls onPress', () =&gt; {
  const onPress = jest.fn();
  render(&lt;Button label="Save" onPress={onPress} /&gt;);
  fireEvent.press(screen.getByText('Save'));
  expect(onPress).toHaveBeenCalled();
});</code></pre>

<h3>Example 2 — async loading</h3>
<pre><code class="language-tsx">test('shows user data', async () =&gt; {
  server.use(http.get('/api/user/1', () =&gt; HttpResponse.json({ name: 'Ada' })));
  render(&lt;UserProfile id="1" /&gt;);
  expect(screen.getByText(/loading/i)).toBeOnTheScreen();
  expect(await screen.findByText('Ada')).toBeOnTheScreen();
});</code></pre>

<h3>Example 3 — form validation</h3>
<pre><code class="language-tsx">test('shows error on empty submit', () =&gt; {
  render(&lt;SignupForm /&gt;);
  fireEvent.press(screen.getByText(/create/i));
  expect(screen.getByText(/email is required/i)).toBeOnTheScreen();
});</code></pre>

<h3>Example 4 — hook test with deps</h3>
<pre><code class="language-ts">test('useUser fetches', async () =&gt; {
  const qc = new QueryClient();
  const wrapper = ({ children }) =&gt; (
    &lt;QueryClientProvider client={qc}&gt;{children}&lt;/QueryClientProvider&gt;
  );
  const { result } = renderHook(() =&gt; useUser('1'), { wrapper });
  await waitFor(() =&gt; expect(result.current.data).toBeDefined());
  expect(result.current.data.name).toBe('Ada');
});</code></pre>

<h3>Example 5 — mocking react-native-permissions</h3>
<pre><code class="language-ts">jest.mock('react-native-permissions', () =&gt; ({
  PERMISSIONS: { IOS: { CAMERA: 'cam' }, ANDROID: { CAMERA: 'cam' } },
  RESULTS: { GRANTED: 'granted', DENIED: 'denied', BLOCKED: 'blocked' },
  check: jest.fn().mockResolvedValue('granted'),
  request: jest.fn().mockResolvedValue('granted'),
}));</code></pre>

<h3>Example 6 — snapshot with mock data</h3>
<pre><code class="language-tsx">test('card snapshot', () =&gt; {
  const { toJSON } = render(&lt;Card title="Hello" body="World" /&gt;);
  expect(toJSON()).toMatchSnapshot();
});</code></pre>

<h3>Example 7 — fake timer scenario</h3>
<pre><code class="language-ts">test('toast auto-hides after 3s', () =&gt; {
  jest.useFakeTimers();
  render(&lt;Toast message="Hi" /&gt;);
  expect(screen.getByText('Hi')).toBeOnTheScreen();
  act(() =&gt; { jest.advanceTimersByTime(3000); });
  expect(screen.queryByText('Hi')).toBeNull();
  jest.useRealTimers();
});</code></pre>

<h3>Example 8 — assert accessibility</h3>
<pre><code class="language-tsx">test('button is accessible', () =&gt; {
  render(&lt;IconButton label="Close" icon="x" /&gt;);
  expect(screen.getByRole('button', { name: /close/i })).toBeOnTheScreen();
  // Underlying element has accessibilityLabel="Close" + accessibilityRole="button"
});</code></pre>

<h3>Example 9 — Detox flow</h3>
<pre><code class="language-ts">describe('Checkout', () =&gt; {
  beforeEach(async () =&gt; { await device.reloadReactNative(); });

  it('full checkout', async () =&gt; {
    await element(by.id('product-1')).tap();
    await element(by.id('add-to-cart')).tap();
    await element(by.id('cart-tab')).tap();
    await expect(element(by.text('Total: $10.00'))).toBeVisible();
    await element(by.id('checkout')).tap();
    await element(by.id('cvv')).typeText('123');
    await element(by.id('pay')).tap();
    await waitFor(element(by.text('Success'))).toBeVisible().withTimeout(10000);
  });
});</code></pre>

<h3>Example 10 — Maestro flow</h3>
<pre><code>appId: com.myapp
---
- launchApp:
    clearState: true
- assertVisible: "Log in"
- tapOn:
    id: "email"
- inputText: "a@b.com"
- tapOn:
    id: "password"
- inputText: "secret"
- tapOn:
    text: "Sign in"
- assertVisible:
    id: "home-tab"</code></pre>

<h3>Example 11 — deep-link test</h3>
<pre><code class="language-ts">// Detox
await device.launchApp({ url: 'myapp://post/42' });
await expect(element(by.id('post-title'))).toHaveText('Post 42');</code></pre>

<h3>Example 12 — network mocking in Detox</h3>
<pre><code class="language-ts">// Launch app with launch args that point to a mock server
await device.launchApp({
  newInstance: true,
  launchArgs: { apiBaseUrl: 'http://127.0.0.1:3001/mock' },
});</code></pre>

<h3>Example 13 — store isolation</h3>
<pre><code class="language-ts">afterEach(() =&gt; {
  // Reset Zustand stores
  useAuth.setState({ user: null });
  useCart.setState({ items: [] });
});</code></pre>

<h3>Example 14 — React Query test helper</h3>
<pre><code class="language-tsx">function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) =&gt; &lt;QueryClientProvider client={qc}&gt;{children}&lt;/QueryClientProvider&gt;;
}
// Use as { wrapper: createWrapper() } in renderHook</code></pre>

<h3>Example 15 — native-side test with XCTest (iOS)</h3>
<pre><code class="language-swift">// ios/AppTests/DeviceInfoTests.swift
import XCTest
@testable import App

final class DeviceInfoTests: XCTestCase {
  func testGetModel() {
    let model = DeviceInfoModule().getModel()
    XCTAssertFalse(model.isEmpty)
  }
}</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Reanimated in tests</h3>
<p>Reanimated must be mocked: <code>require('react-native-reanimated/mock');</code> in jest setup. Otherwise: parse errors on worklet code.</p>

<h3>2. Gesture Handler mock</h3>
<p>Similarly needs setup:</p>
<pre><code class="language-ts">jest.mock('react-native-gesture-handler', () =&gt; {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    Swipeable: View, DrawerLayout: View,
    State: {}, Gesture: {}, GestureDetector: View,
    // ...
  };
});</code></pre>

<h3>3. Transform patterns</h3>
<p><code>transformIgnorePatterns</code> must include every lib that ships untranspiled source. Common: react-native, @react-native, @react-navigation, @shopify/flash-list. Missing one causes ESM parse errors.</p>

<h3>4. Image require() in tests</h3>
<p>Tests can't resolve image imports. Use <code>moduleNameMapper</code> to alias to a mock module that returns a dummy.</p>

<h3>5. Flipper / dev-mode code</h3>
<p><code>__DEV__</code> is true in Jest. If you gate dev-only code on it, tests execute it. Mock or check <code>process.env.JEST_WORKER_ID</code>.</p>

<h3>6. Fast Refresh not relevant in tests</h3>
<p>Jest runs each test file isolated. No Fast Refresh artifacts; state is reset automatically.</p>

<h3>7. Detox build time</h3>
<p>Each change to native code or major JS re-bundle requires rebuilding the Detox binary. CI caches help; dev iteration is slow. Keep native stable.</p>

<h3>8. Detox flakiness</h3>
<p>Gray-box sync is mostly reliable but still occasionally flakes on animations. Use <code>waitFor</code> with increased timeout. Avoid <code>await sleep(...)</code>.</p>

<h3>9. Maestro relies on accessibility labels</h3>
<p>If your components lack <code>accessibilityLabel</code>, Maestro can't find them. Adds implicit a11y benefit.</p>

<h3>10. Simulator vs real device behavior differs</h3>
<p>Keyboards, biometrics, camera, geolocation differ between simulators and devices. E2E on simulators misses device-specific issues. Run a subset on real devices via CI services (Firebase Test Lab, BrowserStack).</p>

<h3>11. Test cleanup leaks</h3>
<p>Timers not cleared between tests affect other tests. Reset with <code>jest.useRealTimers()</code>. RNTL auto-unmounts on test end but only for <code>render</code>-produced components.</p>

<h3>12. Query cache carries between tests</h3>
<p>Default singleton QueryClient across tests means cache hits you didn't set up. Create a new QueryClient per test.</p>

<h3>13. Store state</h3>
<p>Zustand / Redux stores are modules — persist across tests in the same file. Reset in afterEach.</p>

<h3>14. RNTL's "not wrapped in act" warnings</h3>
<p>When state updates after the test thinks it's done. Use <code>findBy</code> / <code>waitFor</code> to await async work.</p>

<h3>15. Snapshot instability</h3>
<p>Dates, IDs, random values in rendered output cause churn. Mock Date.now, use useId, or normalize before snapshot.</p>

<h3>16. Navigation state in tests</h3>
<p>If you use real <code>NavigationContainer</code>, initial navigation can happen async. Wait for the target screen before assertions.</p>

<h3>17. Mocking async-storage</h3>
<p><code>@react-native-async-storage/async-storage</code> needs a mock — built-in one ships with the lib:</p>
<pre><code class="language-ts">jest.mock('@react-native-async-storage/async-storage', () =&gt;
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);</code></pre>

<h3>18. Parallel test runs and ports</h3>
<p>MSW on port 3001 — two test workers collide. Use <code>mswjs/node</code> properly (no network port).</p>

<h3>19. CI signing for Detox iOS</h3>
<p>Detox builds need signing like the app does. Use a shared dev/distribution profile; configure Fastlane Match for certs.</p>

<h3>20. Hermes bytecode vs tests</h3>
<p>Tests run in Node, not Hermes. JS behavior mostly matches but some edge cases (regex, Intl support) can differ. Rare problem.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — testing implementation details</h3>
<p>Asserting internal state or method calls. Breaks on refactor. Test user-visible behavior.</p>

<h3>Anti-pattern 2 — over-reliance on testID</h3>
<p>RNTL query by role/label when possible. testID for E2E-only.</p>

<h3>Anti-pattern 3 — E2E for everything</h3>
<p>Expensive and flaky. Reserve for critical flows.</p>

<h3>Anti-pattern 4 — no native module mocks</h3>
<p>First test that touches a native module crashes. Set up mocks in <code>jest-setup.ts</code>.</p>

<h3>Anti-pattern 5 — sleeping in tests</h3>
<p><code>await sleep(1000)</code> — flaky. Use <code>waitFor</code> / <code>findBy</code>.</p>

<h3>Anti-pattern 6 — snapshot-only tests</h3>
<p>Snapshots approve whatever changes. No semantic assertion. Write explicit expectations.</p>

<h3>Anti-pattern 7 — shared test state</h3>
<p>Global Zustand store, singleton query cache persist across tests. Reset per test.</p>

<h3>Anti-pattern 8 — no cleanup of subscriptions in tested hooks</h3>
<p>Hook's internal useEffect with a listener never unsubscribes → later tests trigger double-handlers.</p>

<h3>Anti-pattern 9 — mocking your own components</h3>
<p>If you mock <code>&lt;Header /&gt;</code> in every test, you never test <code>&lt;Header /&gt;</code>. Only mock at boundaries.</p>

<h3>Anti-pattern 10 — ignoring transformIgnorePatterns</h3>
<p>ESM lib fails to transform → parse errors. Add lib to the transformIgnorePatterns.</p>

<h3>Anti-pattern 11 — Detox without CI</h3>
<p>Only one developer runs E2E locally. Bit rot kicks in; tests stop running after a year. Wire into CI from day 1.</p>

<h3>Anti-pattern 12 — no visual regression</h3>
<p>CSS changes silently affect UX. Consider Percy / Chromatic-native equivalents for high-visibility screens.</p>

<h3>Anti-pattern 13 — huge CI test suites</h3>
<p>60-minute CI demotivates developers. Parallelize, shard, cache.</p>

<h3>Anti-pattern 14 — no coverage target, or 100% coverage target</h3>
<p>Neither extreme works. Coverage below 40% is risky; above 80% often drives towards trivial tests. Target 60-75% focused on critical paths.</p>

<h3>Anti-pattern 15 — no rehearsal of production data scenarios</h3>
<p>Tests use happy-path fixtures; production has weird nulls, long strings, missing fields. Add fuzz tests or property-based tests for data layer.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. What tools do you use for RN testing?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Jest + @testing-library/react-native</strong> for unit + integration.</li>
      <li><strong>MSW</strong> (or jest.spyOn on fetch) for API mocks.</li>
      <li><strong>jest-native</strong> matchers (<code>toBeOnTheScreen</code>, <code>toHaveTextContent</code>, etc).</li>
      <li><strong>Detox</strong> or <strong>Maestro</strong> for E2E.</li>
      <li><strong>Native mocks</strong> for RN modules (manual mocks in <code>__mocks__</code>).</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Detox vs Maestro — differences?</div>
  <div class="qa-answer">
    <p><strong>Detox</strong>: gray-box — talks to the app's internal sync, waits for animations/network automatically. Faster, more deterministic. Requires a Detox-instrumented build.</p>
    <p><strong>Maestro</strong>: black-box via UIAutomator / XCUITest. YAML flows, no native integration, simpler setup, cross-platform. Can be slower and more flaky but easier to write and maintain.</p>
    <p>Detox for complex RN flows with animations; Maestro for smoke tests + visual assertions.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. How do you mock a native module?</div>
  <div class="qa-answer">
<pre><code class="language-ts">// __mocks__/react-native-mmkv.ts
export class MMKV {
  private data = new Map();
  set(k, v) { this.data.set(k, v); }
  getString(k) { return this.data.get(k); }
  // ...
}
</code></pre>
    <p>Or inline: <code>jest.mock('react-native-mmkv', () =&gt; ({ MMKV: jest.fn(...) }))</code>. Either way, the test environment gets a JS-only fixture that mimics the API without touching native code.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. How do you test a screen that uses navigation?</div>
  <div class="qa-answer">
    <p>Two options:</p>
    <ol>
      <li><strong>Mock hooks</strong>: <code>jest.mock('@react-navigation/native', () =&gt; ({ useNavigation: () =&gt; ({ navigate: jest.fn() }) }))</code>. Fast; isolates the screen.</li>
      <li><strong>Real NavigationContainer + Stack</strong> in a test helper. Heavier; tests the real navigation behavior. Useful when navigation is part of the test's logic.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. What's the "act" warning and how do you fix it?</div>
  <div class="qa-answer">
    <p>React update happens outside the test's async scope — usually because you didn't await an async state update. Fixes: use <code>findBy*</code> or <code>waitFor</code> to await the update; or wrap with <code>await act(async () =&gt; { ... })</code>. The warning points to a real bug in how you wait for state.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Which tests should you write first?</div>
  <div class="qa-answer">
    <ol>
      <li>Pure functions — validators, formatters, reducers.</li>
      <li>Hooks with logic (useFeatureFlags, useAuthFlow, useTimer).</li>
      <li>Components at user interaction boundaries (Button, Modal, Form).</li>
      <li>Screens composing components with state.</li>
      <li>E2E smoke for the 3-5 critical user flows.</li>
    </ol>
    <p>Skip trivial UI (pass-through components) and don't test framework code.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How do you test offline behavior?</div>
  <div class="qa-answer">
    <p>Mock NetInfo to return offline; verify UI shows offline banner, queued mutations are stored. In Detox, you can disable airplane mode on the simulator to test real offline. For React Query offline: use <code>onlineManager.setOnline(false)</code> in setup, verify queries pause / replay.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How do you test a form?</div>
  <div class="qa-answer">
<pre><code class="language-tsx">test('signup form', async () =&gt; {
  const onSubmit = jest.fn();
  render(&lt;SignupForm onSubmit={onSubmit} /&gt;);
  fireEvent.changeText(screen.getByLabelText(/email/i), 'a@b.com');
  fireEvent.changeText(screen.getByLabelText(/password/i), 'secret');
  fireEvent.press(screen.getByRole('button', { name: /sign up/i }));
  await waitFor(() =&gt; expect(onSubmit).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret' }));
});</code></pre>
    <p>For React Hook Form: library provides test-friendly hooks; use <code>register</code> + <code>handleSubmit</code> normally.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. How do you handle flaky Detox tests?</div>
  <div class="qa-answer">
    <ol>
      <li>Look for animations that don't finish — Detox's sync should catch them; if not, check for manual timers or setInterval in the app.</li>
      <li>Replace sleep/wait with <code>waitFor(...).withTimeout(ms)</code>.</li>
      <li>Reset app state between tests: <code>await device.reloadReactNative()</code>.</li>
      <li>Increase launch timeout if CI is slow.</li>
      <li>Check screenshots on failure (<code>takeScreenshot</code>) to see what the app looked like.</li>
      <li>If persistent, move to Maestro for that specific flow.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. What's a reasonable coverage target?</div>
  <div class="qa-answer">
    <p>60-75% line coverage, with 80%+ on business-critical code (auth, checkout, data layer). Don't chase 100% — you end up testing trivial code. Focus on branching and edge cases rather than raw line count.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. How do you test a component using Reanimated?</div>
  <div class="qa-answer">
    <p>Reanimated ships an official mock. Install it in jest setup:</p>
<pre><code class="language-ts">require('react-native-reanimated/mock');</code></pre>
    <p>All worklet functions become no-ops; shared values are regular mutable objects. Animations don't actually run in tests — just ensure the component renders and responds to props.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. How do you run tests in CI?</div>
  <div class="qa-answer">
<pre><code class="language-yaml">name: Tests
on: [push, pull_request]
jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test -- --coverage
  e2e-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: cd ios &amp;&amp; pod install
      - run: detox build --configuration ios.sim.release
      - run: detox test --configuration ios.sim.release</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Name some common testing anti-patterns.</div>
  <div class="qa-answer">
    <ul>
      <li>Testing implementation details (state names, method calls).</li>
      <li>Over-mocking (your own components, not boundaries).</li>
      <li>Snapshots as the main assertion.</li>
      <li>E2E everything (slow, flaky).</li>
      <li>Sleep() instead of waitFor.</li>
      <li>Global test state leaking between tests.</li>
      <li>No cleanup of listeners, stores, timers.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. How do you test a component that uses MMKV?</div>
  <div class="qa-answer">
<pre><code class="language-ts">// __mocks__/react-native-mmkv.ts
export class MMKV {
  data = new Map();
  set(k, v) { this.data.set(k, v); }
  getString(k) { return this.data.get(k); }
  delete(k) { this.data.delete(k); }
  clearAll() { this.data.clear(); }
}
// Test uses real component + real MMKV class, backed by Map in memory
import { MMKV } from 'react-native-mmkv';
beforeEach(() =&gt; new MMKV().clearAll());</code></pre>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Walk me through testing an offline-first feature.</div>
  <div class="qa-answer">
    <ol>
      <li><strong>Unit</strong> — queue reducer, mutation serializer, idempotency key generation.</li>
      <li><strong>Integration</strong> — render component, set NetInfo offline, trigger mutation, assert it's queued and UI shows optimistic state.</li>
      <li><strong>Integration</strong> — set NetInfo online, assert queue drains (MSW handler called), UI updates to confirmed state.</li>
      <li><strong>E2E (Detox)</strong> — full flow on simulator: navigate to feature, toggle network in dev menu or via Detox API, perform action, verify queued, toggle back, verify sync.</li>
    </ol>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You distinguish unit / integration / E2E and use the right tool.</li>
    <li>You use RNTL queries in priority order (role, label, text, testID last).</li>
    <li>You mock native modules via <code>__mocks__</code>.</li>
    <li>You write Detox or Maestro tests for critical flows.</li>
    <li>You handle async with findBy/waitFor, never sleep.</li>
    <li>You set up Reanimated + Gesture Handler mocks.</li>
    <li>You keep E2E lean and CI-runnable.</li>
    <li>You avoid testing implementation details and over-snapshotting.</li>
  </ul>
</div>
`}

]
});
