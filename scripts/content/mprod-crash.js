window.PREP_SITE.registerTopic({
  id: 'mprod-crash',
  module: 'mobile-prod',
  title: 'Crash Reporting',
  estimatedReadTime: '40 min',
  tags: ['crash-reporting', 'sentry', 'crashlytics', 'symbolication', 'sourcemap', 'react-native', 'observability', 'production'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Crash reporting</strong> is the production safety net for mobile apps. Without it, you ship blind: a 1% crash rate among 10M users is 100k unhappy people you never hear from. The job of a crash reporter is to capture every fatal error (and ideally every non-fatal one), enrich it with device + app + user context, deduplicate similar crashes into a single "issue," and surface the stack trace in a form humans can read.</p>
<ul>
  <li><strong>Three pieces:</strong> SDK in the app captures the error → backend ingests + groups → dashboard surfaces issues with frequency, affected users, and trend.</li>
  <li><strong>Three layers of crash:</strong> JS (uncaught throws, unhandled promise rejections), native iOS (Objective-C/Swift uncaught exceptions, Mach signals), native Android (Java/Kotlin uncaught exceptions, JNI crashes, ANRs).</li>
  <li><strong>Symbolication is mandatory.</strong> Stack traces are addresses + minified names without dSYMs (iOS), ProGuard mappings (Android), and source maps (RN/Hermes).</li>
  <li><strong>Default tools:</strong> <strong>Sentry</strong> (cross-platform, web + mobile + RN, generous free tier, custom severity), <strong>Firebase Crashlytics</strong> (free, deeply integrated with Firebase + GA4), <strong>Bugsnag</strong> (mid-market, breadcrumb-rich), <strong>Instabug</strong> (in-app feedback + crash combined).</li>
  <li><strong>Crash rate KPIs:</strong> Apple's "crash-free user rate" (target ≥ 99.5%), Google's "ANR rate" (&lt;0.47% of users daily), and the team's own "p99 session crash" budget.</li>
  <li><strong>Don't capture PII.</strong> Strip emails, names, tokens before send. Most SDKs have a <code>beforeSend</code> hook for this.</li>
  <li><strong>Release-aware:</strong> tag every event with build number, release version, environment (dev/staging/prod), commit SHA. Without these, "Did this regress in 2.4.0?" is unanswerable.</li>
</ul>
<p><strong>Mantra:</strong> "Capture everything, deduplicate aggressively, symbolicate religiously, never log PII."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What is a crash, technically?</h3>
<p>A crash is the runtime termination of your app (or a thread within it) due to an unhandled error. On mobile this comes from three sources, layered on top of each other:</p>
<table>
  <thead><tr><th>Layer</th><th>Trigger</th><th>OS response</th></tr></thead>
  <tbody>
    <tr><td>JavaScript</td><td>Uncaught throw, unhandled rejection in JSC/Hermes/V8</td><td>Red box (dev) or silent (release) — RN may keep running but feature broken</td></tr>
    <tr><td>iOS native</td><td>Unhandled NSException, signal (SIGSEGV, SIGBUS, SIGABRT)</td><td>App killed; iOS writes a <code>.ips</code> log</td></tr>
    <tr><td>Android native</td><td>Uncaught Java/Kotlin Throwable, NDK SIGSEGV in C++</td><td>App killed; Android writes a tombstone</td></tr>
    <tr><td>ANR (Android)</td><td>UI thread blocked &gt;5s</td><td>System dialog "App not responding"; user kills</td></tr>
    <tr><td>App Hang (iOS)</td><td>Main thread blocked &gt;~250ms</td><td>Watchdog (gauge) triggers a 0x8badf00d kill if &gt;~20s</td></tr>
  </tbody>
</table>

<h3>Why crash reporting matters</h3>
<ol>
  <li><strong>You can't fix what you don't see.</strong> Most users never report; they uninstall. Crash reporting is the only feedback channel that scales.</li>
  <li><strong>App store gating.</strong> Apple's App Store Connect "App Analytics" surfaces crash rate; Google Play Console flags "bad behavior threshold" excesses (1.09% perceptible ANR, 8% crash) which can suppress you in search.</li>
  <li><strong>Release decisions.</strong> "Crash-free 99.7% on 1.4.0 vs 99.3% on 1.5.0 → roll back" depends on real-time data.</li>
  <li><strong>SLO accountability.</strong> Many product teams set a quarterly "≥ 99.5% crash-free users" target.</li>
  <li><strong>Triage focus.</strong> Without grouping, you have 10,000 stack traces. With grouping, you have 50 issues sorted by user impact.</li>
</ol>

<h3>Why mobile crash is harder than web</h3>
<table>
  <thead><tr><th>Problem</th><th>Web reality</th><th>Mobile reality</th></tr></thead>
  <tbody>
    <tr><td>Symbolication</td><td>Source maps (1 file per release)</td><td>dSYMs (iOS) + ProGuard mappings (Android) + JS source maps (RN) — 3 artifacts × 2 platforms</td></tr>
    <tr><td>Network during crash</td><td>Hard refresh — most stale state gone</td><td>SDK must persist event to disk, send on next launch</td></tr>
    <tr><td>Process model</td><td>Single page</td><td>Background services, content providers, push receivers — each can crash independently</td></tr>
    <tr><td>OS fragmentation</td><td>Few engines</td><td>iOS 14–17, Android 6–14, dozens of OEM forks of Android</td></tr>
    <tr><td>Native + JS</td><td>JS only</td><td>Crash can originate in any of three layers; you need symbols for all of them</td></tr>
  </tbody>
</table>

<h3>The two reporters you'll meet most</h3>
<ul>
  <li><strong>Sentry.</strong> Pro-grade across web/mobile/backend; great RN support; release-aware; integrates with GitHub for "first-seen-in commit X." Best when you want one tool for the whole stack.</li>
  <li><strong>Firebase Crashlytics.</strong> Free, exceptional Android symbolication, automatically links to GA4 events for context. Best when you're already in Firebase and want zero billing.</li>
</ul>

<h3>What "good" looks like</h3>
<ul>
  <li>Every release tagged with <strong>version, build number, environment, commit SHA</strong>.</li>
  <li>Every event has <strong>device model, OS version, locale, free disk, RAM at crash, network type</strong>.</li>
  <li>Every event has <strong>last 50 breadcrumbs</strong> (route changes, button taps, network calls, console logs).</li>
  <li>Symbolication is <strong>fully automated in CI</strong> — humans never upload dSYMs by hand.</li>
  <li>Crash dashboards are <strong>checked daily</strong>; new issues opened in tracker the same day.</li>
  <li>The on-call has a <strong>"crash spike"</strong> alert (e.g., &gt;3× baseline in 15 min) wired to Slack/PagerDuty.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The four phases of an event's life</h3>
<pre><code class="language-text">1. Capture     → SDK hooks JS error handler, NSExceptionHandler, Java Thread.UncaughtExceptionHandler, signal handler
2. Persist     → Write event to disk locally (crash by definition kills the process; no network)
3. Send        → On next app launch, drain queue to backend
4. Triage      → Backend symbolicates, groups by fingerprint, dedupes, dashboards
</code></pre>

<h3>The "fingerprint" model</h3>
<p>Every crash report has a fingerprint — a stable hash that identifies "the same bug." If 10,000 users hit the same null-deref in <code>UserCard.render</code>, you want one dashboard issue with count = 10,000, not 10,000 separate ones.</p>
<p>Fingerprints are usually computed from:</p>
<ul>
  <li>Top N frames of the stack trace (after stripping addresses).</li>
  <li>Exception type / message.</li>
  <li>Sometimes the source file + line, sometimes just function names.</li>
</ul>
<p>You can override fingerprints when the default is wrong — e.g., a generic "TypeError" with different stacks should be split, or two different stacks that share a root cause should be merged.</p>

<h3>Symbolication, in plain English</h3>
<table>
  <thead><tr><th>Format</th><th>Without symbols</th><th>With symbols</th></tr></thead>
  <tbody>
    <tr><td>iOS</td><td><code>0x102a4abcd MyApp + 245680</code></td><td><code>-[UserCard updateAvatar:] (UserCard.m:142)</code></td></tr>
    <tr><td>Android</td><td><code>com.x.a.b(c.java:1)</code></td><td><code>com.example.user.UserCard.updateAvatar(UserCard.kt:142)</code></td></tr>
    <tr><td>RN/JS</td><td><code>at e.n (index.android.bundle:1:34123)</code></td><td><code>at handleSubmit (LoginScreen.tsx:87:12)</code></td></tr>
  </tbody>
</table>
<p>The artifact that does the translation:</p>
<ul>
  <li><strong>iOS:</strong> dSYM (debug symbols) generated at build time. Match by UUID. Apple offers automatic upload via App Store Connect; Sentry/Crashlytics SDKs ship build-phase scripts to upload to their backend during archive.</li>
  <li><strong>Android:</strong> ProGuard/R8 mapping.txt — the de-obfuscation map produced when minify is enabled. Upload during the release build (CI step).</li>
  <li><strong>RN:</strong> JavaScript source map produced by Metro. Hermes adds an extra step (compose Hermes bytecode-to-JS map with Metro's JS-to-source map). Upload to Sentry/Crashlytics with the bundle hash as the key.</li>
</ul>

<h3>Breadcrumbs — context before the crash</h3>
<p>A crash trace tells you <em>where</em> the app died. Breadcrumbs tell you <em>what was happening</em>. They're a ring buffer of recent events: route changes, network calls, redux actions, taps, console.warns. The default ring buffer holds the last 100. When the crash fires, the breadcrumbs are bundled into the event.</p>

<h3>Severity levels</h3>
<table>
  <thead><tr><th>Severity</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td>Fatal</td><td>Unhandled crash; the SDK auto-marks these</td></tr>
    <tr><td>Error</td><td>Caught exceptions you logged manually (<code>captureException</code>)</td></tr>
    <tr><td>Warning</td><td>Recoverable issues (network timeout, validation failure)</td></tr>
    <tr><td>Info</td><td>Major lifecycle (login success, purchase complete)</td></tr>
    <tr><td>Debug</td><td>Verbose; usually not sent to production</td></tr>
  </tbody>
</table>

<h3>Sample rate vs. all-events</h3>
<p>For pure crashes, send 100%. For non-fatal errors, networking timeouts, performance traces — sample. Sentry's <code>tracesSampleRate</code> defaults to 0; setting <code>0.1</code> keeps 10% of perf events. Cost-control wins; insight loss is acceptable because the bias is uniform.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Sentry — the setup-in-15-minutes path</h3>
<pre><code class="language-bash"># Install
yarn add @sentry/react-native

# Run the wizard — auto-edits ios + android + js
npx @sentry/wizard@latest -i reactNative -p ios android
</code></pre>

<pre><code class="language-tsx">// App.tsx
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://&lt;publicKey&gt;@&lt;org&gt;.ingest.sentry.io/&lt;project&gt;',
  environment: __DEV__ ? 'development' : 'production',
  release: 'myapp@2.4.0+431',          // version+build
  dist: '431',                          // Android versionCode / iOS CFBundleVersion
  tracesSampleRate: 0.1,                // 10% of transactions
  enableAutoSessionTracking: true,
  attachStacktrace: true,
  beforeSend(event) {
    // strip PII
    if (event.user?.email) delete event.user.email;
    return event;
  },
});

export default Sentry.wrap(App);   // wraps for ErrorBoundary + perf
</code></pre>

<h3>Adding context to every event</h3>
<pre><code class="language-tsx">// On login:
Sentry.setUser({ id: user.id, segment: user.tier });   // never email/name

// Tag a release channel
Sentry.setTag('channel', 'beta');

// Custom context (large, free-form)
Sentry.setContext('feature_flags', { newCheckout: true, fastList: false });

// Breadcrumb for any custom event
Sentry.addBreadcrumb({
  category: 'navigation',
  message: 'Navigated to /profile',
  level: 'info',
});
</code></pre>

<h3>Manual capture — non-fatal errors</h3>
<pre><code class="language-tsx">try {
  await syncToServer();
} catch (err) {
  Sentry.captureException(err, {
    tags: { feature: 'sync' },
    extra: { lastSyncTs: lastSync },
  });
  showToast('Sync failed');   // user sees recoverable UX
}
</code></pre>

<h3>Error boundary — the JS top-level catch</h3>
<pre><code class="language-tsx">// React Error Boundary catches render-tree throws so the screen swaps to a fallback UI.
// Without one, RN unmounts the whole tree on JS error in render.

class AppErrorBoundary extends React.Component&lt;{children: React.ReactNode}, {hasError: boolean}&gt; {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }
  render() {
    if (this.state.hasError) return &lt;CrashFallback /&gt;;
    return this.props.children;
  }
}
</code></pre>

<h3>Source-map upload (RN + Hermes)</h3>
<pre><code class="language-bash">## CI step after archive — Sentry CLI
sentry-cli react-native gradle \\
  --bundle android/app/build/generated/assets/react/release/index.android.bundle \\
  --sourcemap android/app/build/generated/sourcemaps/react/release/index.android.bundle.map \\
  --release "myapp@2.4.0+431" \\
  --dist "431"

## For Hermes — must compose maps first
node node_modules/react-native/scripts/compose-source-maps.js \\
  hermes.map metro.map -o composed.map
</code></pre>

<p>Sentry's CLI for Hermes-on-iOS:</p>
<pre><code class="language-bash">sentry-cli react-native xcode \\
  --release "myapp@2.4.0+431" \\
  --dist "431" \\
  --bundle main.jsbundle --sourcemap main.jsbundle.map
</code></pre>

<h3>Crashlytics — the Firebase route</h3>
<pre><code class="language-bash">yarn add @react-native-firebase/app @react-native-firebase/crashlytics
cd ios && pod install
</code></pre>
<pre><code class="language-tsx">import crashlytics from '@react-native-firebase/crashlytics';

await crashlytics().setCrashlyticsCollectionEnabled(true);
await crashlytics().setUserId(user.id);
await crashlytics().setAttribute('tier', user.tier);
await crashlytics().log('User opened checkout');
crashlytics().recordError(new Error('Sync failed'));   // non-fatal
</code></pre>

<p>For a forced test crash:</p>
<pre><code class="language-tsx">if (__DEV__) crashlytics().crash();   // hard native crash, ONLY in dev/staging
</code></pre>

<h3>iOS dSYM upload</h3>
<p>For Sentry: build phase script auto-runs. For Crashlytics: a build phase script (added by their wizard) runs at archive time. Both upload to their backend keyed by the dSYM UUID. App Store Connect can also upload to Apple — toggle "Include app symbols" in the archive options.</p>

<h3>Android ProGuard/R8 mapping</h3>
<p>Enable shrinking + obfuscation in <code>android/app/build.gradle</code>:</p>
<pre><code class="language-gradle">android {
  buildTypes {
    release {
      minifyEnabled true
      shrinkResources true
      proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
  }
}
</code></pre>
<p>Mapping uploads — Crashlytics auto-uploads via the Gradle plugin; Sentry uploads via <code>sentry-cli upload-proguard --android-manifest ... mapping.txt</code>. CI runs both.</p>

<h3>Native crash on iOS — Mach signals</h3>
<pre><code class="language-objective-c">// Sentry SDK installs:
NSSetUncaughtExceptionHandler(handler);   // catches NSException
signal(SIGSEGV, signalHandler);            // catches access violations
signal(SIGBUS, signalHandler);
signal(SIGABRT, signalHandler);
// At handler time, write minimal info (no async-signal-unsafe calls!)
// to a binary file. On next launch the SDK reads + sends.
</code></pre>

<h3>Native crash on Android — Java + NDK</h3>
<pre><code class="language-java">Thread.setDefaultUncaughtExceptionHandler((thread, ex) -&gt; {
  // serialize stack trace to disk
  // call previous handler (likely the OS one)
});
// For NDK (C/C++) crashes — install signal handlers via NDK in JNI_OnLoad.
</code></pre>

<h3>ANR detection (Android)</h3>
<p>An ANR is the OS deciding the UI thread is wedged. Crashlytics and Sentry detect ANRs by sampling the main thread state every N seconds and checking how long it's been since the last response. Reports include the main thread stack at the time it stalled.</p>
<pre><code class="language-text">Common ANR causes:
- synchronous network call on UI thread
- giant for-loop computing layout
- locked database write triggered from UI
- third-party SDK doing IO synchronously on main
</code></pre>

<h3>App Hang detection (iOS)</h3>
<p>iOS doesn't expose a hang event the way Android does, but sentry-cocoa samples the main thread; if main is unresponsive &gt;2s, it logs a hang event with the suspended stack.</p>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: A real Sentry init for a production RN app</h3>
<pre><code class="language-tsx">// monitoring/sentry.ts
import * as Sentry from '@sentry/react-native';
import Config from 'react-native-config';
import DeviceInfo from 'react-native-device-info';

export function initSentry() {
  const env = Config.ENV ?? 'production';
  const isProd = env === 'production';

  Sentry.init({
    dsn: Config.SENTRY_DSN,
    environment: env,
    release: \`\${DeviceInfo.getBundleId()}@\${DeviceInfo.getVersion()}+\${DeviceInfo.getBuildNumber()}\`,
    dist: DeviceInfo.getBuildNumber(),

    // Sample rates
    sampleRate: 1.0,                       // 100% of crashes
    tracesSampleRate: isProd ? 0.1 : 1.0,  // 10% of perf in prod, all in dev
    profilesSampleRate: isProd ? 0.1 : 0,
    replaysSessionSampleRate: 0.0,         // off by default
    replaysOnErrorSampleRate: 0.5,         // 50% of error sessions get a replay

    // Performance integration
    integrations: [
      Sentry.reactNavigationIntegration(),
      Sentry.reactNativeTracingIntegration({
        enableAppStartTracking: true,
        enableNativeFramesTracking: true,
        enableStallTracking: true,
      }),
    ],

    // Global filters
    ignoreErrors: [
      /Network request failed/,           // recoverable network errors
      /AbortError/,                        // user-cancelled fetches
      'Non-Error promise rejection captured', // RN noisy warning
    ],

    beforeSend(event, hint) {
      // Strip PII
      if (event.user) {
        delete event.user.email;
        delete event.user.username;
        delete event.user.ip_address;
      }
      // Strip auth headers from breadcrumbs
      event.breadcrumbs?.forEach(b =&gt; {
        if (b.data?.headers) delete b.data.headers;
      });
      // Don't send events in dev unless explicitly forced
      if (__DEV__ &amp;&amp; !Config.SENTRY_FORCE) return null;
      return event;
    },
  });
}
</code></pre>

<h3>Example 2: Wiring breadcrumbs from Redux + Navigation</h3>
<pre><code class="language-tsx">// Navigation breadcrumb (auto via integration)
// Redux breadcrumb middleware
const sentryMiddleware: Middleware = () =&gt; (next) =&gt; (action) =&gt; {
  Sentry.addBreadcrumb({
    category: 'redux',
    message: action.type,
    level: 'info',
    data: pickSafe(action.payload),   // strip PII before logging
  });
  return next(action);
};

// Network breadcrumb middleware (custom fetch wrapper)
async function loggedFetch(input: RequestInfo, init?: RequestInit) {
  const start = Date.now();
  try {
    const r = await fetch(input, init);
    Sentry.addBreadcrumb({
      category: 'http',
      message: \`\${init?.method ?? 'GET'} \${typeof input === 'string' ? input : input.url}\`,
      data: { status: r.status, durationMs: Date.now() - start },
      level: r.ok ? 'info' : 'warning',
    });
    return r;
  } catch (err) {
    Sentry.addBreadcrumb({
      category: 'http',
      message: 'Network failed',
      level: 'error',
      data: { url: String(input), error: String(err) },
    });
    throw err;
  }
}
</code></pre>

<h3>Example 3: Custom fingerprinting for a noisy generic exception</h3>
<pre><code class="language-tsx">// All your "TypeError: Cannot read property 'x' of undefined" are merged into ONE Sentry issue.
// You want to split by call site (frame[0].fn).
Sentry.init({
  // ...
  beforeSend(event) {
    if (event.exception?.values?.[0]?.type === 'TypeError') {
      const topFrame = event.exception.values[0].stacktrace?.frames?.slice(-1)[0];
      const fn = topFrame?.function ?? 'unknown';
      event.fingerprint = ['{{ default }}', 'TypeError', fn];
    }
    return event;
  },
});
</code></pre>

<h3>Example 4: Crash spike alert via Sentry alerts</h3>
<pre><code class="language-text">Alert rule: "When the count of issues with severity = error
is &gt; 100 in 5 minutes, send to #mobile-oncall."

Plus:
- "When a NEW issue affects &gt; 1% of users, page on-call."
- "When crash-free user rate drops below 99.5% on the latest release, alert PM."
</code></pre>

<h3>Example 5: Reproducing a crash from a stack trace</h3>
<pre><code class="language-text">Stack trace from Sentry:
  TypeError: Cannot read property 'avatar' of undefined
    at UserCard (src/components/UserCard.tsx:42:15)
    at renderItem (src/screens/Feed.tsx:88:21)
    at FlatListRow

Breadcrumbs:
  [info] navigation: Pushed Feed (params: { userId: "u_1" })
  [info] http: GET /api/feed?cursor=null → 200, 2.4s
  [warning] redux: feed/loadMore.fulfilled (data missing user field on item idx=12)

Hypothesis: a feed item lacks a 'user' object. Fix:
  - frontend: defensive default { avatar: PLACEHOLDER }
  - backend: investigate why item 12 has null user
</code></pre>

<h3>Example 6: Symbolication CI step (GitHub Actions)</h3>
<pre><code class="language-yaml">- name: Build Android Release
  run: ./gradlew bundleRelease

- name: Upload mapping + JS sourcemaps to Sentry
  env:
    SENTRY_AUTH_TOKEN: \${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: \${{ secrets.SENTRY_ORG }}
    SENTRY_PROJECT: myapp-android
  run: |
    sentry-cli releases new "myapp@\${VERSION}+\${BUILD}"
    sentry-cli upload-proguard --android-manifest android/app/src/main/AndroidManifest.xml \\
      android/app/build/outputs/mapping/release/mapping.txt
    sentry-cli react-native gradle \\
      --bundle android/app/build/generated/assets/react/release/index.android.bundle \\
      --sourcemap android/app/build/generated/sourcemaps/react/release/index.android.bundle.map \\
      --release "myapp@\${VERSION}+\${BUILD}" --dist "\${BUILD}"
    sentry-cli releases finalize "myapp@\${VERSION}+\${BUILD}"
</code></pre>

<h3>Example 7: A "test crash" gated for staging</h3>
<pre><code class="language-tsx">// Hidden dev panel
if (Config.ENV !== 'production') {
  &lt;DevButton onPress={() =&gt; { throw new Error('Test JS crash'); }} title="JS crash" /&gt;
  &lt;DevButton onPress={() =&gt; Sentry.nativeCrash()} title="Native crash" /&gt;
  &lt;DevButton onPress={() =&gt; Sentry.captureException(new Error('Manual report'))} title="Manual" /&gt;
}
</code></pre>
<p>Native crash button hits SIGABRT — proves your dSYM/ProGuard/source-map pipeline works end-to-end. Run before every store release.</p>

<h3>Example 8: Throttling noisy non-fatals</h3>
<pre><code class="language-tsx">const seen = new Map&lt;string, number&gt;();

function reportThrottled(err: Error) {
  const key = err.message.slice(0, 100);
  const count = (seen.get(key) ?? 0) + 1;
  seen.set(key, count);
  if (count &gt; 5) return;     // skip past 5 of the same in this session
  Sentry.captureException(err, { tags: { throttled: count &gt; 1 ? 'true' : 'false' } });
}
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Crash before SDK init</h3>
<p>If Sentry hasn't initialized when the crash fires, you get nothing. The native side of <code>@sentry/react-native</code> auto-installs on app start before JS runs, so JS crashes after init are caught. But:</p>
<ul>
  <li>Crashes <em>during</em> SDK init are usually lost.</li>
  <li>Initialize Sentry as the very first JS statement, before any UI render or third-party SDK.</li>
  <li>Native crashes from third-party SDKs that init in <code>application:didFinishLaunchingWithOptions:</code> before Sentry are missed.</li>
</ul>

<h3>Network during crash</h3>
<p>The whole point of "crash" is the process can't continue, including HTTP. SDKs persist events to disk and drain the queue on the next launch. Issue: if the user uninstalls before the next launch, the event is lost forever. Acceptable; rare.</p>

<h3>Out-of-memory kills</h3>
<p>The OS kills your process for memory pressure. There's no exception, no signal. Sentry/Crashlytics infer OOM by detecting "we were running, then we weren't, with no crash artifact" — heuristic only. Reports as "App may have been terminated due to memory pressure."</p>

<h3>Background crashes</h3>
<p>Audio playback, geolocation, push handler — apps run in the background. Crashes there are real but invisible to the user. SDKs catch them; the report shows up next foreground launch.</p>

<h3>Hermes specifics</h3>
<p>Hermes outputs bytecode, not JS. Stack traces have a <code>SourceURL</code> that includes the bundle hash. Source-map composition is mandatory: the Hermes map maps bytecode→JS, and the Metro map maps JS→source. You combine both into a single map. Sentry CLI's <code>compose-source-maps</code> handles it; if you skip the step, traces remain in bytecode space.</p>

<h3>RN's "Module AppRegistry is not registered"</h3>
<p>Common bootstrap crash on cold start. Causes:</p>
<ul>
  <li>JS bundle didn't load (Metro down in dev; missing bundle in release).</li>
  <li>Native module crashed during init and threw before AppRegistry call.</li>
  <li>Hermes loaded the wrong bundle path.</li>
</ul>
<p>Sentry sees this as a native exception with no JS stack — useless. Workaround: log a "JS started" event from the very top of <code>index.js</code>; absence of it on a session means "JS never executed."</p>

<h3>Source map mismatch</h3>
<p>Symptom: Sentry shows obfuscated frames despite "release" upload. Causes:</p>
<ol>
  <li>Wrong release tag (different version or dist).</li>
  <li>Wrong bundle hash (rebuilt the bundle without re-uploading).</li>
  <li>Sentry-CLI uploaded but with the wrong <code>--release</code> flag.</li>
  <li>Release was finalized then bundle changed (Sentry caches by hash).</li>
</ol>
<p>Always validate post-deploy: trigger a known crash via the dev menu, look it up in Sentry, confirm the trace is symbolicated.</p>

<h3>OEM-specific Android crashes</h3>
<p>Xiaomi, Huawei, Oppo, Samsung add OS layers that occasionally throw exceptions other devices don't. Common culprits:</p>
<ul>
  <li>"Permission denial: opening provider" on Xiaomi — work-around: request explicit permission.</li>
  <li>"BadTokenException" — adding a window after the activity is finishing on Samsung.</li>
</ul>
<p>Tag every event with <code>device.brand</code> + <code>device.model</code> so you can filter by OEM.</p>

<h3>Privacy / GDPR / App Tracking Transparency</h3>
<ul>
  <li>iOS 14.5+: ATT prompt is required before any tracker that's classified as tracking. Crash reporting <em>is not</em> tracking under Apple's policy as long as you don't link to identifiers across apps. Set Sentry's <code>sendDefaultPii</code> to false.</li>
  <li>EU: get consent for non-essential data. Crash reporting can usually run on legitimate-interest basis if you scrub PII; coordinate with legal.</li>
  <li>Children's apps (COPPA): Crashlytics can be configured to not collect IDFA/AAID; verify.</li>
</ul>

<h3>Sample-rate at high traffic</h3>
<p>At 1M DAU, even tiny defect rates produce thousands of events/day per issue. Most reporters quota by event count; you may need to:</p>
<ul>
  <li>Increase <code>maxBreadcrumbs</code> only for fatal events, not all.</li>
  <li>Drop "warning" level in <code>beforeSend</code> in prod.</li>
  <li>Use server-side ingest sampling (e.g., Sentry's "Inbound Filters").</li>
</ul>

<h3>Code-push / OTA updates and release tagging</h3>
<p>If you use CodePush / EAS Update / Expo OTA, the JS bundle can change without an app store version bump. Tag the JS bundle hash as a separate field (e.g., <code>jsRevision</code>). Without this, "this JS version causes the crash" is unanswerable.</p>

<h3>JNI crashes (Android)</h3>
<p>NDK code (C/C++) crashes with SIGSEGV. Default Java handlers don't catch them. Crashlytics installs an NDK signal handler if you add the <code>firebase-crashlytics-ndk</code> dependency. Without it, native crashes show only as "App stopped responding."</p>

<h3>Watchdog kills (iOS)</h3>
<p>If you exceed Apple's startup time budget (~20s for cold start, varies), iOS kills you with a watchdog termination logged as "0x8badf00d" (literally "ate bad food"). These don't trigger NSException handlers; you see them via App Store Connect "App Hangs" report or via App Hang detection in your SDK.</p>

<h3>Re-entrancy in error handlers</h3>
<p>If your <code>beforeSend</code> hook throws, the event is dropped silently and may corrupt subsequent events. Always wrap with try/catch:</p>
<pre><code class="language-ts">beforeSend(event) {
  try {
    return scrub(event);
  } catch {
    return event;     // never break the pipeline
  }
}
</code></pre>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: dSYM not uploaded → "App Store" symbolicated only</h3>
<p>If you forget to upload dSYMs to your reporter, Sentry/Crashlytics show stack frames as raw addresses. App Store Connect symbolicates Apple's own internal reports but Sentry can't access those. <strong>Always</strong> wire the build-phase script.</p>

<h3>Bug 2: Stack trace shows minified frames in production</h3>
<pre><code class="language-text">at e.n (index.android.bundle:1:34123)
at o (index.android.bundle:1:35001)
</code></pre>
<p>Three causes:</p>
<ol>
  <li>Source map not uploaded.</li>
  <li>Release tag in SDK init doesn't match the one used in the upload command.</li>
  <li>Hermes — you uploaded only the Metro map, not the composed map.</li>
</ol>
<p>Always test with a known crash before signing off on a release.</p>

<h3>Bug 3: SDK init after a third-party SDK's init</h3>
<pre><code class="language-tsx">// BAD — third-party SDK can crash before Sentry is ready
import './polyfills';
import { initAnalytics } from 'analytics';
initAnalytics();        // ← what if this throws?
import { initSentry } from './sentry';
initSentry();           // too late

// GOOD — sentry first
import './polyfills';
import { initSentry } from './sentry';
initSentry();
import { initAnalytics } from 'analytics';
initAnalytics();
</code></pre>

<h3>Bug 4: Logging full request bodies as breadcrumbs</h3>
<pre><code class="language-tsx">// BAD — captures access tokens, PII, full content
Sentry.addBreadcrumb({
  category: 'http',
  data: { request: req, response: res },
});

// GOOD — capture metadata only
Sentry.addBreadcrumb({
  category: 'http',
  data: { url: req.url, status: res.status, durationMs: t },
});
</code></pre>

<h3>Bug 5: <code>captureException(err)</code> losing the original message</h3>
<pre><code class="language-tsx">// BAD — wraps the error in another error
try { ... } catch (e) {
  Sentry.captureException(new Error('caught'));   // loses 'e'
}

// GOOD
try { ... } catch (e) {
  Sentry.captureException(e);
}
</code></pre>

<h3>Bug 6: Using <code>console.error</code> assuming Sentry catches it</h3>
<p>Sentry's RN integration <em>may</em> capture <code>console.error</code> by default, but with config drift it's unreliable. Use <code>captureException</code> for known errors and an <code>Error.prototype</code>-typed value, not a string.</p>

<h3>Bug 7: Forgetting to set <code>release</code> dynamically</h3>
<pre><code class="language-tsx">// BAD — hardcoded; forgotten on every bump
release: 'myapp@1.0.0',

// GOOD
release: \`\${pkg.name}@\${pkg.version}+\${buildNumber}\`,
</code></pre>

<h3>Bug 8: User context not cleared on logout</h3>
<pre><code class="language-tsx">// BAD — next user inherits previous user.id; events misattributed
await logout();
// Sentry still has setUser({ id: oldId })

// GOOD
await logout();
Sentry.setUser(null);
</code></pre>

<h3>Bug 9: Test crashes from production</h3>
<pre><code class="language-tsx">// BAD — left in production build, gets discovered by curious users
&lt;Button title="Test crash" onPress={() =&gt; { throw new Error('test') }} /&gt;

// GOOD
{__DEV__ &amp;&amp; &lt;Button title="Test crash" onPress={...} /&gt;}
</code></pre>

<h3>Bug 10: Forgetting to disable in tests</h3>
<pre><code class="language-tsx">// Sentry init runs during jest tests → captures harmless test errors as real crashes
if (process.env.JEST_WORKER_ID) return;   // skip init in test
</code></pre>

<h3>Anti-pattern 1: shipping without an error boundary</h3>
<p>One unhandled render-phase throw blanks the whole RN app. <strong>Wrap your top-level App with an ErrorBoundary</strong> that shows a fallback and reports.</p>

<h3>Anti-pattern 2: ignoring "warning" events</h3>
<p>Caught timeouts, validation failures, and recoverable errors quietly accumulate. Sample them and watch trends; a 10× spike often precedes a real crash.</p>

<h3>Anti-pattern 3: configuring two crash reporters</h3>
<p>"Sentry + Crashlytics + Bugsnag" — duplicate cost, conflicting symbolication pipelines, two dashboards to triage. Pick one and own it.</p>

<h3>Anti-pattern 4: not closing issues</h3>
<p>Sentry/Crashlytics issues should be resolved when the fix ships. Without that habit, "open issues" balloons into the thousands and signal is lost in noise. Set <strong>"Resolve in next release"</strong> on every fix PR.</p>

<h3>Anti-pattern 5: capturing every redux action</h3>
<p>Breadcrumb count is bounded (default 100); if you flood it with 80 redux actions you have no headroom for navigation, network, or taps. Filter to <em>significant</em> actions only.</p>

<h3>Anti-pattern 6: skipping QA on the release-tagging pipeline</h3>
<p>The most common production-grade bug: a release ships with broken release tagging, all events go to "unknown release," and post-deploy you can't tell what's broken. <strong>Trigger a known crash on every release candidate</strong> and validate it appears with the right tag in your dashboard.</p>

<h3>Anti-pattern 7: PII leakage via custom contexts</h3>
<p>"Just to debug, I'll attach the user object to every event." Now emails, phones, addresses are in third-party storage. Audit <code>setContext</code>/<code>setExtra</code> calls quarterly.</p>

<h3>Anti-pattern 8: ignoring the "ANR" tab on Play Console</h3>
<p>Play Console publishes ANR rate independently of Crashlytics. Even with 0 crashes you can be flagged for high ANR. Watch both.</p>

<h3>Anti-pattern 9: relying on user-reported bugs only</h3>
<p>Users report &lt; 1% of issues. Crash reporting + analytics together get you to 95% visibility. The remaining 5% is intermittent, OEM-specific, or recovery-loop weird; investigate one example end-to-end per quarter.</p>
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
    <tr><td><em>What does a crash reporter do?</em></td><td>Capture, persist, send, group, dedupe, surface stack traces from JS + native + system layers.</td></tr>
    <tr><td><em>Why is symbolication necessary?</em></td><td>Stack traces are addresses or minified names; symbols make them human-readable.</td></tr>
    <tr><td><em>What's a dSYM?</em></td><td>iOS debug-symbols file produced at archive time; matched to crashes by UUID.</td></tr>
    <tr><td><em>Why is RN harder?</em></td><td>Three layers — JS, iOS native, Android native — each with its own symbols artifact.</td></tr>
    <tr><td><em>What's an ANR?</em></td><td>Android UI-thread block &gt; 5s; OS shows "App not responding"; impacts Play store ranking.</td></tr>
    <tr><td><em>What's a fingerprint?</em></td><td>The stable hash of "the same bug" — usually top frames + exception type — used to dedupe.</td></tr>
    <tr><td><em>Why use breadcrumbs?</em></td><td>Recent context (navigation, http, taps) attached to every event so you know what was happening.</td></tr>
    <tr><td><em>How would you handle PII?</em></td><td><code>beforeSend</code> hook strips email/name/phone; never put user objects in <code>setContext</code>.</td></tr>
    <tr><td><em>How do you tag releases?</em></td><td>App version + build number + commit SHA + JS bundle hash for OTA-aware apps.</td></tr>
    <tr><td><em>What metric do you watch?</em></td><td>Crash-free user rate (target ≥ 99.5%); crash-free session rate; ANR rate.</td></tr>
    <tr><td><em>What's your alerting threshold?</em></td><td>Crash spike &gt; 3× baseline in 15 min; new issue affecting &gt; 1% of users.</td></tr>
    <tr><td><em>Sentry vs Crashlytics?</em></td><td>Sentry: cross-stack, paid tiers, richer perf. Crashlytics: free, Firebase-tied, great Android support.</td></tr>
  </tbody>
</table>

<h3>Live design prompts</h3>
<ol>
  <li><em>"Walk me through what happens from a JS throw to the crash showing in Sentry."</em>
    <ul>
      <li>RN's <code>ErrorUtils.setGlobalHandler</code> calls Sentry's listener.</li>
      <li>SDK builds an event (stack trace, breadcrumbs, user, tags, release).</li>
      <li>Native side persists event to disk.</li>
      <li>Process exits.</li>
      <li>Next launch: native side reads queued events and sends.</li>
      <li>Server symbolicates with the matching source map keyed by release.</li>
      <li>Server hashes top N frames to fingerprint.</li>
      <li>Issue grouped, count incremented, dashboard updated, alerts fired.</li>
    </ul>
  </li>
  <li><em>"Design a release-promotion gate based on crash data."</em>
    <ul>
      <li>Stage 1: 1% rollout. After 24h, require crash-free &gt; 99.0% AND no new "first-seen" issue with &gt;100 events.</li>
      <li>Stage 2: 10%. Same thresholds + ANR rate &lt; 0.5%.</li>
      <li>Stage 3: 100%. Auto-rollback if crash-free drops &gt;0.3pp from previous version within 6h.</li>
    </ul>
  </li>
  <li><em>"How would you debug a crash that only happens in production?"</em>
    <ul>
      <li>Stack trace + breadcrumbs to form hypothesis.</li>
      <li>Check device.model / OS distribution in dashboard — OEM-specific?</li>
      <li>Filter by app version + JS bundle hash — regression?</li>
      <li>Reproduce locally with same OS, network conditions, locale.</li>
      <li>If no repro: add targeted logging in next release to gather more breadcrumbs around the failure point.</li>
    </ul>
  </li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>Stack trace is minified despite "production release upload" — the release tag in init differs from the upload command's tag.</li>
  <li>Crash spike but no fingerprint match in dashboard — generic <code>TypeError</code>, all merged into one issue; needs custom fingerprinting.</li>
  <li>User context lingers across logouts — missing <code>setUser(null)</code>.</li>
  <li>Network-fail noise drowning real crashes — filter via <code>ignoreErrors</code>.</li>
  <li>Old release responsible for 80% of today's crashes — users on old version, can't be patched; flag for forced-update prompt.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Pipeline thinking</td><td>You can describe SDK → backend → dashboard end-to-end.</td></tr>
    <tr><td>Symbolication fluency</td><td>You name dSYM, ProGuard, source map, Hermes composition.</td></tr>
    <tr><td>Operational discipline</td><td>You wire CI to upload symbols; you test crashes pre-release.</td></tr>
    <tr><td>Privacy by default</td><td>You scrub PII in <code>beforeSend</code>; you don't ship user objects in contexts.</td></tr>
    <tr><td>Rollout gating</td><td>You tie release promotion to crash-free thresholds.</td></tr>
    <tr><td>Multiple-layer awareness</td><td>You know JS crashes, native crashes, ANRs, OOMs, watchdog kills all need different handling.</td></tr>
    <tr><td>Communication</td><td>You triage with breadcrumbs, not panic; you know "what was the user doing?"</td></tr>
  </tbody>
</table>

<h3>"What I'd do day one on the team"</h3>
<ul>
  <li>Audit the current setup: are dSYMs uploading? Is the source map composed? Is release tagged dynamically?</li>
  <li>Add an end-to-end "test crash" smoke test on every release branch.</li>
  <li>Set up the crash spike alert if missing.</li>
  <li>Walk the open issue list; resolve anything fixed in older versions; close noise.</li>
  <li>Add release-promotion gates if the team rolls out via App Store Connect Phased Release / Play Console staged rollout.</li>
  <li>Build a simple weekly digest: top 5 issues by user impact, week-over-week trend.</li>
</ul>

<h3>Mobile-specific deep questions</h3>
<ul>
  <li><em>"Why are some iOS crashes only visible in App Store Connect and not in Sentry?"</em> — Watchdog terminations and OOMs may not trigger SDK handlers; Apple captures them at the OS level.</li>
  <li><em>"How do you handle a customer report of a crash you can't reproduce?"</em> — Ask for app version + device + OS; pull their session in Sentry/Crashlytics by user ID; check for an open issue with matching trace; if missing, instrument the suspected code path in next release.</li>
  <li><em>"How do you separate dev vs staging vs prod crashes?"</em> — <code>environment</code> tag in init; filter by env in dashboard; alert only on prod.</li>
  <li><em>"What's your strategy for OTA updates and crash attribution?"</em> — Tag JS bundle revision (CodePush hash, EAS Update revision) on every event so you can tell native-version vs JS-version regressions apart.</li>
  <li><em>"How do you handle a crash that happens in a third-party SDK?"</em> — File a bug with the SDK vendor with reproducer; pin to last-known-good version; consider a wrapper that catches at the boundary.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd add Sentry Performance / Crashlytics Performance to correlate slow screens with crashes — most jank precedes crashes."</li>
  <li>"I'd add session replay for top-of-funnel screens so we can see exactly what the user did before the crash."</li>
  <li>"I'd build a regression alert that fingerprints by file+function and flags re-introduction of resolved issues."</li>
  <li>"I'd integrate with the support tool so customer complaints auto-link to their Sentry session."</li>
</ul>
`
    }
  ]
});
