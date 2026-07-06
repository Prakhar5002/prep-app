/* Practice challenges — RN Deep Dives: Platform APIs & Permissions */
(function () {
  var reg = window.PREP_SITE.registerChallenge;

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-plat-permissions-denial', track: 'rn', category: 'rn-platform-apis',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'How do iOS and Android\'s permission models fundamentally differ, and what\'s the right way to design a request flow — including what happens after the user denies?',
    answer: {
      core: `iOS grants access per capability via a system dialog shown the first time your code actually touches that API (camera, location, notifications, contacts…), gated by a required <code>Info.plist</code> "usage description" string — e.g. <code>NSCameraUsageDescription</code> — whose absence is a build/review-time failure, not a silent runtime denial. Android instead splits permissions into "normal" (granted automatically at install — <code>INTERNET</code>, <code>VIBRATE</code>, no dialog ever) and "dangerous" (<code>CAMERA</code>, <code>ACCESS_FINE_LOCATION</code>, <code>RECORD_AUDIO</code>, <code>POST_NOTIFICATIONS</code> since API 33) which require an explicit runtime request via <code>PermissionsAndroid.request</code> or an Expo/RN-permissions wrapper. The decisive asymmetry: Android exposes <code>shouldShowRequestPermissionRationale</code> so you can tell, programmatically, whether it's still worth explaining and asking again — iOS has no such introspection. You get exactly one real system-dialog opportunity per capability, ever; every later call to the same request API just silently returns the already-decided status.`,
      mechanism: `Because iOS gives you a single shot, the standard senior-level pattern is a "soft ask": a custom, in-app explanatory screen shown BEFORE ever calling the real permission API, so the one real OS dialog fires with context already established, not cold. On denial, the recovery path is the same shape on both platforms — detect the settled "blocked" state and route to system settings rather than re-prompting into a void:
<pre><code class="language-js">import { Linking } from 'react-native';
import * as Notifications from 'expo-notifications';

async function ensureNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  if (current.canAskAgain) {
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  }

  // canAskAgain is false: iOS after its one dialog, or Android after
  // "don't ask again" — no dialog will ever show again, only Settings can help.
  showBlockedExplainer(() => Linking.openSettings());
  return false;
}
</code></pre>
On Android specifically, checking <code>shouldShowRequestPermissionRationale</code> BEFORE calling request tells you whether the user is still in "can be persuaded" territory (show rationale UI, then ask) versus "permanently blocked" territory (skip straight to the Settings deep link) — conflating the two produces a request loop that reads as broken.`,
      tradeoffs: `A soft-ask screen adds a tap for every user, including ones who'd have granted access cold — over-using it (asking to explain something as low-stakes as clipboard access) is friction for no reason. But skipping it on iOS specifically burns your only real dialog on a context-free ask; if that gets denied, there is no native "did you mean to allow this" nudge ever again, just a permanent Settings detour. The soft-ask cost is asymmetric: cheap to add, expensive to have skipped once the one shot is gone.`,
      followups: [
        { q: 'The user denies a permission on iOS — is there any way to make the system dialog appear again?', a: 'No. Once decided, only Settings > [App] > [Permission] changes it; every future call to the request API returns the settled status with no dialog, unconditionally. That\'s why the pre-permission explanatory screen is your only real lever on iOS — it has to land before the one real ask, not after.' },
        { q: 'How do you distinguish "denied, can ask again" from "permanently blocked" on Android?', a: 'Call shouldShowRequestPermissionRationale (or check for a BLOCKED-style status from a permissions wrapper) — it returns true if you can still legitimately explain and re-ask, false once the user chose "don\'t ask again" or was denied enough times that the system settled it; false means your only remaining move is Linking.openSettings().' }
      ],
      redFlags: `Assuming iOS supports an Android-style rationale/re-ask flow (it categorically does not — one dialog, ever, per capability); firing the real OS permission dialog cold with zero explanation on either platform, when a lightweight pre-ask screen is nearly free and directly protects the one iOS attempt you get.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-plat-push-notifications', track: 'rn', category: 'rn-platform-apis',
    difficulty: 'staff', type: 'deep-dive',
    prompt: 'Design the push-notification pipeline for an RN app end-to-end — token registration, sending, and delivery by app state — and call out what\'s actually true about FCM today versus what teams still assume.',
    answer: {
      core: `A device first needs a native platform token: an APNs device token on iOS, obtained by registering with <code>UNUserNotificationCenter</code> (which requires notification permission first), and an FCM registration token on Android via Firebase's SDK (no notification-specific permission needed before Android 13; <code>POST_NOTIFICATIONS</code> is required from API 33 onward). Expo Notifications unifies both behind a single Expo Push Token that Expo's relay service exchanges for the right native transport, which is the fastest path to working push on both platforms with one API. Teams needing finer control — custom Android notification channels/importance, iOS critical alerts, a non-Expo backend — drop to notifee (paired with <code>@react-native-firebase/messaging</code> for token/delivery) and talk to APNs/FCM tokens directly.`,
      mechanism: `The two transports are genuinely different wire protocols, not just different SDKs: APNs is a persistent HTTP/2 connection Apple's infrastructure holds open to each device, addressed by device token, with your backend (or Expo's relay) as sender. FCM today is HTTP v1 only — sending means minting a short-lived OAuth2 access token from a service-account JSON key and POSTing JSON to a v1 endpoint scoped to your Firebase project. Google shut down the legacy FCM server-key HTTP/XMPP APIs in June 2024; any backend code still building a request against that legacy endpoint, or gating on a static server-key header, doesn't "still work but deprecated" — it fails outright. Delivery also genuinely differs by app state: a foreground message arrives as raw data your JS must explicitly display (no automatic OS banner); a backgrounded or killed-state notification is rendered by the OS straight from the payload; and a data-only background message can wake a headless JS task on Android, while iOS's equivalent (a background, <code>content-available</code> silent push) gets a much smaller, OS-throttled processing window with no guarantee it runs at all.`,
      tradeoffs: `Expo Notifications gets both platforms working fastest with no client-side service-account juggling, at the cost of some customization ceiling (fine-grained Android channel behavior, some APNs categories) — notifee/bare RNFirebase hands you the real native primitives but means owning both platforms' setup yourself. Separately: Expo Go on Android dropped remote push support as of SDK 53 (support was already deprecated there in SDK 52) — Expo Go on iOS still supports remote push. Testing real push delivery on Android specifically requires a development build rather than the Expo Go client app; iOS testing in Expo Go remains viable for remote push.`,
      followups: [
        { q: 'A backend team says they\'re "still using the FCM server key" to send pushes in 2026 — what\'s wrong with that?', a: 'That\'s the legacy HTTP API, which Google shut down in June 2024 — any send attempt against it now fails outright, it doesn\'t just degrade. It has to be migrated to FCM HTTP v1, authenticated with a service-account-derived OAuth2 access token rather than a static server key.' },
        { q: 'Why might a push notification silently show nothing while the app is in the foreground, even though it clearly arrived?', a: 'Foreground delivery hands you the raw payload as data with no automatic OS banner — that only happens in background/killed state — so unless your foreground handler explicitly calls the display API, nothing visibly appears even though the message was received and your handler ran.' }
      ],
      redFlags: `Any design that assumes legacy FCM (server-key HTTP or XMPP) still functions — it was shut down mid-2024 and should be flagged the moment it appears in a diagram or ticket; assuming Expo Go can't receive remote push on any platform on a current SDK — the drop is Android-only (since SDK 53, deprecated in SDK 52) and a dev build is required to test real delivery there, while Expo Go on iOS still supports remote push.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-plat-background-tasks', track: 'rn', category: 'rn-platform-apis',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'What are the real OS-level limits on "background work" in an RN app today, and how does expo-background-task actually schedule around them?',
    answer: {
      core: `Neither OS lets an app run arbitrary background JS on a timer it controls — both treat background execution as an opportunistic, budget-limited privilege the OS schedules, not something the app commands. iOS's <code>BGTaskScheduler</code> (what <code>expo-background-task</code> sits on) lets you register a task identifier and an earliest-desired-run date, but the OS alone decides if and when it actually fires, based on usage patterns, battery, and Low Power Mode — real-world cadence is often hours apart, never a guaranteed interval. Specifically, <code>expo-background-task</code> registers a <code>BGProcessingTask</code> (declared via the "processing" <code>UIBackgroundModes</code> entry) rather than the lighter-weight <code>BGAppRefreshTask</code> — so once the OS actually grants an execution window, it's budgeted in <strong>minutes</strong>, not the ~30-second window typical of a plain app-refresh task, though the OS can still interrupt it early if conditions (battery, thermal state, user activity) change mid-run. Android's <code>WorkManager</code> (the same underlying API) is more forgiving about frequency but is still throttled by Doze mode and App Standby buckets for apps the system judges rarely used.`,
      mechanism: `<pre><code class="language-js">import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

TaskManager.defineTask('sync-task', async () => {
  await syncPendingData();
  return BackgroundTask.BackgroundTaskResult.Success;
});

await BackgroundTask.registerTaskAsync('sync-task', {
  minimumInterval: 15, // minutes — a *floor*, never a guarantee
});
</code></pre>
<code>expo-background-task</code> replaced the older <code>expo-background-fetch</code> (now deprecated) specifically because it wires directly into each OS's current scheduler — <code>BGTaskScheduler</code> on iOS, <code>WorkManager</code> on Android — instead of the older, coarser fetch-status polling model <code>expo-background-fetch</code> was built on. A registered task can be silently skipped for long stretches if the OS decides the app is low priority (rarely opened, battery saver engaged); there's no callback telling you a cycle was skipped — absence of the task running is the only signal.`,
      tradeoffs: `Designing around this means treating background sync as best-effort acceleration of eventual consistency, never a guarantee. Anything genuinely time-critical (an alarm, a reminder at an exact time) has to go through the platform's dedicated scheduling primitive for that purpose — a locally scheduled notification the OS treats as a real commitment — rather than hoping a background-fetch-style task happens to fire on time.`,
      followups: [
        { q: 'Why did Expo deprecate expo-background-fetch in favor of expo-background-task?', a: 'expo-background-fetch was built on an older, coarser platform background-fetch model; expo-background-task wires directly into each OS\'s current scheduler (BGTaskScheduler on iOS, WorkManager on Android), giving more consistent, battery-respectful scheduling than the API it replaces.' },
        { q: 'Can you rely on a 15-minute minimumInterval actually firing close to every 15 minutes?', a: 'No — minimumInterval is a floor, not a promise. The OS can delay far beyond it or skip a cycle entirely based on battery state, Doze/App Standby bucket, and usage heuristics; it only tells the scheduler "not sooner than this."' }
      ],
      redFlags: `Assuming a registered background task fires on a reliable schedule — it's OS-discretionary, always; reaching for background-fetch-style APIs for something time-critical instead of a scheduled local notification, which is the primitive the OS actually treats as a commitment.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-plat-camera-media-files', track: 'rn', category: 'rn-platform-apis',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'Walk through the real permission surface for camera, photo-library, and file access in a modern RN app — where does Android\'s system photo picker change the calculus?',
    answer: {
      core: `Camera capture is a dangerous/runtime permission on both platforms — <code>CAMERA</code> on Android, an <code>AVCaptureDevice</code> authorization plus <code>NSCameraUsageDescription</code> on iOS — with no way around asking, since you're driving live hardware. Reading the photo library used to require a broad <code>READ_MEDIA_IMAGES</code>/<code>READ_EXTERNAL_STORAGE</code> grant on Android and a Photos usage permission on iOS, but Android 13's system Photo Picker (and iOS's true zero-permission equivalent, <code>PHPickerViewController</code>, available since iOS 14) changed the default answer: launching the OS-owned picker UI so the user hand-picks specific items requires NO runtime permission at all, because the picker runs out-of-process and hands your app back URIs only for exactly what was selected — this is distinct from iOS's "limited photo library" access, which is a permission tier the user grants from a real system dialog, not a permission-free picker. Broad media permission is only still needed when the feature genuinely browses/enumerates the whole library itself — not for a one-off "attach a photo" action.`,
      mechanism: `General file access on Android has been scoped since Android 10's Scoped Storage — apps get an app-specific directory plus <code>MediaStore</code>/Storage Access Framework access to their own content without a broad storage grant; a document/file picker (<code>expo-document-picker</code>, Android's <code>ACTION_OPEN_DOCUMENT</code>) similarly runs out-of-process, returning a scoped, persistable URI to just the chosen file rather than filesystem-wide access. iOS's equivalent is <code>UIDocumentPickerViewController</code> plus security-scoped bookmarks for referencing a file that lives outside the app's own sandbox across launches.`,
      tradeoffs: `Reaching straight for the broad "give me all photos" permission when the actual feature is "let the user pick one photo to attach" is worse on two fronts at once: an extra, scarier prompt for the user, and real app-store review friction — reviewers push back on requesting broader access than a feature demonstrably uses. Defaulting to picker-first avoids the permission entirely for the common case, at the cost of not being able to pre-filter/browse inside your own UI.`,
      followups: [
        { q: 'Does using the Android photo picker for an "attach a photo" feature require any runtime permission?', a: 'No — the picker is a separate, OS-owned process that hands your app a URI only for the items explicitly selected, so no READ_MEDIA_IMAGES/READ_EXTERNAL_STORAGE grant is needed for that flow specifically.' },
        { q: 'When do you still need the broad media-library permission instead of just the picker?', a: 'Only when the feature genuinely needs to enumerate or browse the user\'s whole library from inside your own UI (a custom gallery grid, a background photo-backup feature) — not for a one-off "attach a file" action, which the picker satisfies permission-free.' }
      ],
      redFlags: `Requesting broad photo-library/storage permission for a simple "attach one photo" feature when the system picker needs none; treating Android storage permission as still filesystem-wide the way it was before Scoped Storage.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-plat-linking-appswitch', track: 'rn', category: 'rn-platform-apis',
    difficulty: 'senior', type: 'deep-dive',
    prompt: 'How does deep linking / app-to-app navigation actually work in RN — custom URL schemes vs. Universal Links/App Links — and what has to be configured natively for each?',
    answer: {
      core: `A custom URL scheme (<code>myapp://path</code>) is the simplest form — any app can register one, and the OS routes a matching URL to whichever app claims it, with genuine ambiguity if two apps register the same scheme. It works even from a fully closed app, launching cold via <code>Linking.getInitialURL()</code>. Universal Links (iOS) / App Links (Android) instead bind ordinary <code>https://</code> URLs to your app, verified through a domain-hosted association file — <code>apple-app-site-association</code> on iOS, a Digital Asset Links JSON at <code>/.well-known/assetlinks.json</code> on Android — proving you control that domain, so there's no scheme-collision risk and the same link degrades gracefully to a normal webpage if the app isn't installed.`,
      mechanism: `Checking whether another app can handle a URL before attempting to open it — <code>Linking.canOpenURL('other-app://')</code> — requires the target scheme to be declared upfront on iOS: it must be pre-listed in <code>Info.plist</code>'s <code>LSApplicationQueriesSchemes</code> array, or <code>canOpenURL</code> silently reports false even if the target app IS installed — a deliberate Apple anti-fingerprinting measure, not a bug to debug around. On a cold start via a Universal/App Link, JS only receives the URL after the native side has already resolved and routed it: <code>Linking.getInitialURL()</code> covers the cold-start case, while <code>Linking.addEventListener('url', ...)</code> covers a link arriving while the app is already running.`,
      tradeoffs: `Custom schemes are trivial to set up but offer zero collision protection and no web fallback. Universal/App Links require real native configuration — a hosted, signed association file, the associated-domains entitlement on iOS, an <code>autoVerify</code> intent-filter on Android — but are what any production deep-link flow (marketing emails, links from other apps) should actually use, precisely because they can't be squatted by another app the way a custom scheme can.`,
      followups: [
        { q: 'Linking.canOpenURL returns false for an app you know is installed — why?', a: 'On iOS, unless that exact scheme is pre-declared in LSApplicationQueriesSchemes, canOpenURL always reports false regardless of actual install state — a deliberate anti-fingerprinting restriction, not a detection failure. Add the scheme to that array to get a real answer.' },
        { q: 'What stops another app from registering the same custom URL scheme as yours and hijacking your deep links?', a: 'Nothing, at the OS level — custom schemes carry no ownership verification, so routing behavior when two apps claim the same scheme is genuinely inconsistent across install order and OS version. That collision risk is exactly what Universal Links/App Links solve via domain-ownership verification.' }
      ],
      redFlags: `Relying on a custom URL scheme for anything security-sensitive (password reset, auth callback links) without also validating the payload server-side, given schemes can be hijacked; assuming canOpenURL's false result on iOS means "not installed" rather than checking LSApplicationQueriesSchemes first.`
    }
  });

  // ────────────────────────────────────────────────────────────
  reg({
    id: 'rn-plat-platform-split', track: 'rn', category: 'rn-platform-apis',
    difficulty: 'core', type: 'deep-dive',
    prompt: 'What\'s the actual difference between Platform.select and splitting a file into .ios.tsx/.android.tsx, and when should you reach for each?',
    answer: {
      core: `<code>Platform.select({ ios: ..., android: ..., default: ... })</code> is a runtime, inline choice — evaluated wherever it's called, well suited to a small divergence (a style value, one prop) inside an otherwise shared component. Platform-suffixed files (<code>Button.ios.tsx</code> / <code>Button.android.tsx</code>) are a build-time, bundler-level choice — Metro resolves the matching file automatically when something imports <code>'./Button'</code> with no suffix at all, so the other platform's file is never even included in that platform's bundle.`,
      mechanism: `<pre><code class="language-js">// inline — good for a small style/prop divergence
const styles = StyleSheet.create({
  shadow: Platform.select({
    ios: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4 },
    android: { elevation: 4 },
  }),
});

// file-split — good when the whole component's structure diverges
// Button.ios.tsx and Button.android.tsx each export a default Button;
import Button from './Button'; // Metro resolves the right file per platform
</code></pre>
File-splitting has a real bundle-size upside inline <code>Platform.select</code> doesn't: the platform you're not building for is excluded entirely at bundle time, not merely branched around at runtime — meaningful when one platform's implementation pulls in a native-only dependency the other should never reference at all.`,
      tradeoffs: `Overusing file-splitting for a trivial one-line difference fragments a component across two files a reader has to open both of to follow, and duplicates whatever IS shared (prop types, shared sub-logic) unless factored into a third common module both import. Platform.select keeps that shared context in one place, at the cost of a few inline branches accumulating if the divergence grows.`,
      followups: [
        { q: 'Does Platform.select exclude the unused branch\'s code from the final bundle, the way file-splitting does?', a: 'No — every branch is an ordinary JS value living in the same file, so all of them ship in the bundle for both platforms; only the matching one gets picked at runtime. True bundle exclusion requires the .ios/.android file-split, which Metro resolves at build time.' },
        { q: 'A component\'s entire layout structure differs by platform, not just one style value — which approach fits better?', a: 'File-splitting. Cramming a structurally different render tree into one file via nested Platform.OS/Platform.select branches gets unreadable fast; splitting keeps each platform\'s full implementation clean, with shared logic factored into a common imported module if needed.' }
      ],
      redFlags: `Assuming Platform.select removes the other platform's code from the bundle (it doesn't — only file-splitting does); over-fragmenting into .ios/.android files for a single-line style difference that Platform.select handles inline just as well.`
    }
  });
})();
