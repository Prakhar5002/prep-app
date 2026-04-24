window.PREP_SITE.registerTopic({
  id: 'rn-device-apis',
  module: 'React Native',
  title: 'Device APIs & Permissions',
  estimatedReadTime: '24 min',
  tags: ['react-native', 'device', 'permissions', 'camera', 'location', 'push', 'biometrics', 'file-system'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>Most device APIs in RN are accessed via community libraries. Permissions are a cross-cutting concern: iOS requires usage descriptions in <code>Info.plist</code>; Android requires <code>&lt;uses-permission&gt;</code> in the manifest and runtime requests for dangerous permissions.</p>
<ul>
  <li><strong>Permissions</strong>: <code>react-native-permissions</code> (bare RN) or Expo's per-API permission hooks.</li>
  <li><strong>Camera</strong>: <code>react-native-vision-camera</code> (modern, frame processing) or <code>expo-camera</code>.</li>
  <li><strong>Location</strong>: <code>react-native-geolocation-service</code> / <code>expo-location</code>. Foreground + background variants.</li>
  <li><strong>Push notifications</strong>: <code>@react-native-firebase/messaging</code> (Android FCM + iOS APNs), <code>expo-notifications</code> for Expo.</li>
  <li><strong>File system</strong>: <code>expo-file-system</code>, <code>react-native-fs</code>, or the newer <code>react-native-blob-util</code>.</li>
  <li><strong>Biometrics</strong>: <code>expo-local-authentication</code> or <code>react-native-biometrics</code>. Face ID / Touch ID / Android fingerprint.</li>
  <li><strong>Clipboard, Share, Linking, Haptics, AppState</strong>: built-in or thin Expo wrappers.</li>
  <li><strong>Background tasks</strong>: <code>expo-background-fetch</code> / <code>expo-task-manager</code> / <code>react-native-background-fetch</code>.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Every device API touches permissions, platform quirks, and lifecycle. Pick a maintained library, handle "denied" / "blocked" states explicitly, and test on a real device — simulators don't do everything (no camera, fake location, no biometrics).</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Why permissions are cross-cutting</h3>
<p>Any feature touching user data or hardware needs permission. iOS requires a usage description string in <code>Info.plist</code> (<code>NSCameraUsageDescription</code>, <code>NSLocationWhenInUseUsageDescription</code>, etc.) — missing strings cause immediate rejection from App Store review. Android 6+ requires runtime permission requests for dangerous permissions (camera, location, microphone, contacts); normal permissions are granted at install.</p>

<h3>Why permissions have states</h3>
<p>Not a boolean. The common states, from <code>react-native-permissions</code>:</p>
<ul>
  <li><strong>unavailable</strong> — feature doesn't exist on this device (e.g., no camera).</li>
  <li><strong>denied</strong> — not requested yet or rejected once; requesting again will show the dialog.</li>
  <li><strong>blocked</strong> — user said "Don't ask again" (Android) or denied multiple times (iOS). Must route to Settings.</li>
  <li><strong>granted</strong> — permission given.</li>
  <li><strong>limited</strong> (iOS only) — user granted partial access (e.g., selected specific photos).</li>
</ul>
<p>Your UI has to handle all cases. A "grant permission" button that doesn't work when blocked is broken.</p>

<h3>Why Vision Camera over expo-camera for serious use</h3>
<p><code>react-native-vision-camera</code>:</p>
<ul>
  <li>New arch (Fabric) compatible.</li>
  <li>Frame processors — run JS/worklets on each camera frame for ML, OCR, barcode scan.</li>
  <li>HDR, super resolution, ultra-wide camera selection.</li>
  <li>High-performance video recording.</li>
</ul>
<p><code>expo-camera</code> is simpler but less feature-rich. For scanning or ML, Vision Camera.</p>

<h3>Why push notifications are complicated</h3>
<p>Two completely different provider systems:</p>
<ul>
  <li><strong>iOS</strong>: Apple Push Notification service (APNs). Uses device tokens.</li>
  <li><strong>Android</strong>: Firebase Cloud Messaging (FCM).</li>
</ul>
<p>Then: foreground vs background notifications differ (foreground often requires your app to display it explicitly; background is delivered by the OS). Rich media, actions, channels (Android), categories (iOS), silent pushes, token refresh — all platform-specific. Firebase Messaging wraps most of this.</p>

<h3>Why biometric patterns matter</h3>
<p>Users expect biometrics to unlock sensitive actions (payment confirmation, password vault, 2FA). Caveat: biometrics don't encrypt your data by themselves — they authenticate the user. The actual cryptographic key should be in hardware-backed keychain (iOS Keychain with Biometry, Android Keystore with BiometricPrompt).</p>

<h3>Why background tasks are limited</h3>
<p>Both iOS and Android heavily restrict background execution to save battery. iOS: background fetch (~15min windows, OS-decided), background processing tasks, silent pushes. Android: WorkManager (long-running guaranteed work), foreground services (with visible notification). Don't expect "run every minute in background."</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "permission flow" picture</h3>
<div class="diagram">
<pre>
  Check current status ──► UNAVAILABLE  → disable feature
                    │    DENIED      → show rationale + request
                    │    BLOCKED     → route to OS Settings
                    │    GRANTED     → use the API
                    │    LIMITED     → iOS: use what you have, optionally re-ask

  Request (if DENIED) ──► user taps Allow → GRANTED
                      └── user taps Deny → DENIED (again) or BLOCKED after N times
</pre>
</div>

<h3>The "foreground vs background permission" picture</h3>
<pre><code>Location When In Use (foreground)   — while app visible
Location Always (background)        — even when backgrounded (stricter approval)
Push Notifications                  — explicit opt-in, can be disabled per app
Camera / Microphone                 — per-session dangerous</code></pre>

<h3>The "token lifecycle" (push)</h3>
<div class="diagram">
<pre>
  App launch ─► register with APNs / FCM ─► get token
                                              │
                                         Send to your server
                                              │
  Token may change (reinstall, restore, etc.) ─► listen for refresh event
                                              │
                                         Update server</code></pre>

<h3>The "background task" picture</h3>
<div class="diagram">
<pre>
  Task registered at app start ─► OS schedules based on device state
         │
         └─ fires (maybe) ─► your handler runs briefly
                                 │
                                 └─ must finish within budget (~30s iOS, ~10min Android WorkManager)
</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"I'll just ask for permission at app start." Bad UX. Request permissions <em>contextually</em>, right when the user takes the action that needs them. Precede the system dialog with a screen explaining why — users are more likely to grant when they understand.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Permissions — react-native-permissions</h3>
<pre><code class="language-ts">import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import { Platform } from 'react-native';

const CAMERA = Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;

async function ensureCamera() {
  const status = await check(CAMERA);
  switch (status) {
    case RESULTS.UNAVAILABLE: return false;
    case RESULTS.GRANTED: return true;
    case RESULTS.BLOCKED:
      Alert.alert('Enable Camera', 'Open Settings to grant permission', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Settings', onPress: openSettings },
      ]);
      return false;
    case RESULTS.DENIED:
      const r = await request(CAMERA);
      return r === RESULTS.GRANTED;
  }
}</code></pre>

<h3>Info.plist / AndroidManifest setup</h3>
<p>iOS (<code>ios/YourApp/Info.plist</code>):</p>
<pre><code class="language-xml">&lt;key&gt;NSCameraUsageDescription&lt;/key&gt;&lt;string&gt;We need the camera to let you take photos for your profile.&lt;/string&gt;
&lt;key&gt;NSLocationWhenInUseUsageDescription&lt;/key&gt;&lt;string&gt;We use your location to show nearby places.&lt;/string&gt;
&lt;key&gt;NSMicrophoneUsageDescription&lt;/key&gt;&lt;string&gt;We need the mic to record videos.&lt;/string&gt;
&lt;key&gt;NSPhotoLibraryUsageDescription&lt;/key&gt;&lt;string&gt;Select photos to upload.&lt;/string&gt;
&lt;key&gt;NSFaceIDUsageDescription&lt;/key&gt;&lt;string&gt;Authenticate securely.&lt;/string&gt;</code></pre>
<p>Android (<code>android/app/src/main/AndroidManifest.xml</code>):</p>
<pre><code class="language-xml">&lt;uses-permission android:name="android.permission.CAMERA" /&gt;
&lt;uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" /&gt;
&lt;uses-permission android:name="android.permission.RECORD_AUDIO" /&gt;
&lt;uses-feature android:name="android.hardware.camera" android:required="false" /&gt;</code></pre>

<h3>Camera (Vision Camera)</h3>
<pre><code class="language-tsx">import { Camera, useCameraDevice, useCameraFormat } from 'react-native-vision-camera';

function CameraScreen() {
  const device = useCameraDevice('back');
  const ref = useRef&lt;Camera&gt;(null);

  const takePhoto = async () =&gt; {
    const photo = await ref.current?.takePhoto({ qualityPrioritization: 'balanced' });
    console.log(photo?.path);
  };

  if (!device) return &lt;Text&gt;No camera&lt;/Text&gt;;
  return (
    &lt;&gt;
      &lt;Camera ref={ref} style={StyleSheet.absoluteFill} device={device} isActive photo /&gt;
      &lt;Pressable onPress={takePhoto}&gt;&lt;Text&gt;Shoot&lt;/Text&gt;&lt;/Pressable&gt;
    &lt;/&gt;
  );
}</code></pre>

<h3>Location (expo-location)</h3>
<pre><code class="language-tsx">import * as Location from 'expo-location';

async function getCurrent() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Permission denied');
  const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return coords;
}

// Watch
const sub = await Location.watchPositionAsync(
  { accuracy: Location.Accuracy.High, distanceInterval: 10 },
  (loc) =&gt; setLocation(loc.coords)
);
// sub.remove() to stop</code></pre>

<h3>Push notifications (Firebase Messaging)</h3>
<pre><code class="language-ts">import messaging from '@react-native-firebase/messaging';

async function registerForPush() {
  const authStatus = await messaging().requestPermission();
  if (authStatus !== messaging.AuthorizationStatus.AUTHORIZED) return;

  const token = await messaging().getToken();
  await fetch('/api/register-push', { method: 'POST', body: JSON.stringify({ token }) });

  // Token refresh
  messaging().onTokenRefresh((newToken) =&gt; api.updateToken(newToken));
}

// Foreground message
messaging().onMessage(async (msg) =&gt; {
  // App in foreground — you must display manually if you want a UI
  showInAppBanner(msg);
});

// Background / killed — opened via tap
useEffect(() =&gt; {
  messaging().onNotificationOpenedApp((msg) =&gt; { navigate(msg.data.route); });
  messaging().getInitialNotification().then((msg) =&gt; { if (msg) navigate(msg.data.route); });
}, []);</code></pre>

<h3>Biometrics (expo-local-authentication)</h3>
<pre><code class="language-tsx">import * as LocalAuth from 'expo-local-authentication';

async function unlock() {
  const hasHardware = await LocalAuth.hasHardwareAsync();
  const isEnrolled = await LocalAuth.isEnrolledAsync();
  if (!hasHardware || !isEnrolled) return false;

  const res = await LocalAuth.authenticateAsync({
    promptMessage: 'Unlock your vault',
    cancelLabel: 'Cancel',
    fallbackLabel: 'Use passcode',
  });
  return res.success;
}</code></pre>

<h3>File system (expo-file-system)</h3>
<pre><code class="language-ts">import * as FileSystem from 'expo-file-system';

const dir = FileSystem.documentDirectory;                  // persistent
const cacheDir = FileSystem.cacheDirectory;                // evictable

await FileSystem.writeAsStringAsync(dir + 'data.json', JSON.stringify(data));
const content = await FileSystem.readAsStringAsync(dir + 'data.json');

// Download
const { uri } = await FileSystem.downloadAsync('https://...', dir + 'file.pdf');

// Streaming download with progress
const downloadResumable = FileSystem.createDownloadResumable(
  url, dir + 'big.mp4', {},
  (progress) =&gt; setProgress(progress.totalBytesWritten / progress.totalBytesExpectedToWrite)
);
const { uri } = await downloadResumable.downloadAsync();</code></pre>

<h3>Share + Linking + Clipboard (built-in)</h3>
<pre><code class="language-ts">import { Share, Linking, Clipboard } from 'react-native';

await Share.share({ message: 'Check this out: https://...', url: 'https://...' });
await Linking.openURL('https://example.com');
await Linking.openURL('tel:+15551234567');
await Linking.openURL('mailto:a@b.com');
await Linking.openSettings();

Clipboard.setString('copied!');
const s = await Clipboard.getString();</code></pre>

<h3>AppState + BackHandler</h3>
<pre><code class="language-ts">import { AppState, BackHandler } from 'react-native';

useEffect(() =&gt; {
  const sub = AppState.addEventListener('change', (status) =&gt; {
    if (status === 'active') refresh();
    if (status === 'background') savePendingChanges();
  });
  return () =&gt; sub.remove();
}, []);

// Android back button
useEffect(() =&gt; {
  const sub = BackHandler.addEventListener('hardwareBackPress', () =&gt; {
    if (canGoBack) { goBack(); return true; }
    return false;
  });
  return () =&gt; sub.remove();
}, [canGoBack]);</code></pre>

<h3>Haptics</h3>
<pre><code class="language-ts">import * as Haptics from 'expo-haptics';
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
Haptics.selectionAsync();</code></pre>

<h3>Background fetch (Expo)</h3>
<pre><code class="language-ts">import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const TASK = 'SYNC_UNREAD';
TaskManager.defineTask(TASK, async () =&gt; {
  const ok = await syncUnread();
  return ok ? BackgroundFetch.Result.NewData : BackgroundFetch.Result.NoData;
});

await BackgroundFetch.registerTaskAsync(TASK, {
  minimumInterval: 60 * 15,         // 15 min — OS decides actual cadence
  stopOnTerminate: false,
  startOnBoot: true,
});</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — permission pre-request rationale</h3>
<pre><code class="language-tsx">async function openCamera() {
  const status = await check(PERMISSIONS.IOS.CAMERA);
  if (status === RESULTS.GRANTED) return startCamera();
  if (status === RESULTS.BLOCKED) return openSettingsDialog();

  // Show rationale before system prompt
  const proceed = await Alert.alert('Camera access', 'We use your camera to take profile photos.', [
    { text: 'Cancel', style: 'cancel' }, { text: 'Continue', onPress: () =&gt; request(PERMISSIONS.IOS.CAMERA) }
  ]);
}</code></pre>

<h3>Example 2 — location with graceful degrade</h3>
<pre><code class="language-tsx">async function findNearby() {
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    // Fall back to user-entered city
    return askForCityInput();
  }
  const { coords } = await Location.getCurrentPositionAsync();
  return searchNearby(coords);
}</code></pre>

<h3>Example 3 — barcode scan with Vision Camera</h3>
<pre><code class="language-tsx">import { useCodeScanner } from 'react-native-vision-camera';

const scanner = useCodeScanner({
  codeTypes: ['qr', 'ean-13'],
  onCodeScanned: (codes) =&gt; {
    if (codes.length &gt; 0) handleCode(codes[0].value!);
  },
});

&lt;Camera device={device} isActive codeScanner={scanner} style={StyleSheet.absoluteFill} /&gt;</code></pre>

<h3>Example 4 — push registration lifecycle</h3>
<pre><code class="language-tsx">useEffect(() =&gt; {
  (async () =&gt; {
    const authStatus = await messaging().requestPermission();
    if (authStatus === messaging.AuthorizationStatus.AUTHORIZED) {
      const token = await messaging().getToken();
      api.registerDevice(token);
    }
  })();
  const unsub = messaging().onTokenRefresh((t) =&gt; api.updateToken(t));
  return unsub;
}, []);</code></pre>

<h3>Example 5 — biometric-gated sensitive action</h3>
<pre><code class="language-tsx">async function confirmPayment(amount: number) {
  const ok = await LocalAuth.authenticateAsync({ promptMessage: \`Confirm $\${amount} payment\` });
  if (!ok.success) return;
  await api.pay(amount);
}</code></pre>

<h3>Example 6 — cache image to disk</h3>
<pre><code class="language-ts">const localPath = FileSystem.cacheDirectory + hash(url) + '.jpg';
const info = await FileSystem.getInfoAsync(localPath);
if (!info.exists) {
  await FileSystem.downloadAsync(url, localPath);
}
setSrc({ uri: localPath });</code></pre>

<h3>Example 7 — pick image from library</h3>
<pre><code class="language-tsx">import * as ImagePicker from 'expo-image-picker';

async function pickImage() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  if (!result.canceled) setUri(result.assets[0].uri);
}</code></pre>

<h3>Example 8 — AppState-driven refetch</h3>
<pre><code class="language-tsx">useEffect(() =&gt; {
  const sub = AppState.addEventListener('change', (s) =&gt; {
    if (s === 'active') queryClient.invalidateQueries({ queryKey: ['feed'] });
  });
  return () =&gt; sub.remove();
}, []);</code></pre>

<h3>Example 9 — share sheet</h3>
<pre><code class="language-tsx">async function onShare(post) {
  try {
    await Share.share({
      title: post.title,
      message: \`\${post.title}\n\nhttps://example.com/post/\${post.id}\`,
    });
  } catch (e) { /* user cancelled */ }
}</code></pre>

<h3>Example 10 — deep-link phone dial</h3>
<pre><code class="language-ts">Linking.canOpenURL('tel:+15551234567').then((supported) =&gt; {
  if (supported) Linking.openURL('tel:+15551234567');
});</code></pre>

<h3>Example 11 — location watcher with cleanup</h3>
<pre><code class="language-tsx">useEffect(() =&gt; {
  let sub: Location.LocationSubscription | null = null;
  (async () =&gt; {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    sub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 10 },
      (loc) =&gt; setCoords(loc.coords)
    );
  })();
  return () =&gt; { sub?.remove(); };
}, []);</code></pre>

<h3>Example 12 — haptic on press</h3>
<pre><code class="language-tsx">&lt;Pressable onPress={() =&gt; {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  onLike();
}}&gt; ... &lt;/Pressable&gt;</code></pre>

<h3>Example 13 — clipboard paste handler</h3>
<pre><code class="language-ts">const paste = async () =&gt; {
  const s = await Clipboard.getString();
  if (/^https?:\\/\\//.test(s)) setUrl(s);
};</code></pre>

<h3>Example 14 — opening OS settings</h3>
<pre><code class="language-ts">import { Linking, Platform } from 'react-native';
await Linking.openSettings();   // iOS: app settings page; Android: app info
// For specific screen on Android:
// Linking.sendIntent('android.settings.APPLICATION_DETAILS_SETTINGS', [{ key: 'package', value: 'com.myapp' }]);</code></pre>

<h3>Example 15 — background fetch handler</h3>
<pre><code class="language-ts">TaskManager.defineTask('REFRESH_CART', async () =&gt; {
  try {
    await syncCart();
    return BackgroundFetch.Result.NewData;
  } catch { return BackgroundFetch.Result.Failed; }
});
// Register in app init:
await BackgroundFetch.registerTaskAsync('REFRESH_CART', { minimumInterval: 1800 });</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. iOS 14+ partial Photo Library access</h3>
<p>Users can grant access to "Selected Photos" only. Permission state = <code>limited</code>. Your UI must adapt (show "pick more photos" option, trigger <code>presentLimitedLibraryPicker</code>).</p>

<h3>2. Android 13+ granular media permissions</h3>
<p>Old <code>READ_EXTERNAL_STORAGE</code> replaced with <code>READ_MEDIA_IMAGES</code>, <code>READ_MEDIA_VIDEO</code>, <code>READ_MEDIA_AUDIO</code>. Update manifest, request the specific one.</p>

<h3>3. App Store rejection for missing usage descriptions</h3>
<p>Forgetting to add <code>NS*UsageDescription</code> to Info.plist causes rejection. Include all permissions you might request — even if feature-flagged.</p>

<h3>4. Location "Always" requires staged approval (iOS)</h3>
<p>You can't ask for "Always" directly. Request WhenInUse first; after some time, request Always which shows a separate dialog. Users can deny one and grant the other.</p>

<h3>5. Push token changes</h3>
<p>Device tokens can change: app reinstall, restored from backup, user resets. Listen to <code>onTokenRefresh</code> and update your server.</p>

<h3>6. Notification channels (Android)</h3>
<p>Android 8+ requires notifications to be posted on a channel. Define channels at app start (importance, sound, vibration). Users can disable channels individually.</p>

<h3>7. Silent / background push</h3>
<p>iOS: send a push with <code>content-available: 1</code>. App gets ~30s to do work in background. Too many silent pushes and iOS throttles your app.</p>

<h3>8. Background task execution not guaranteed</h3>
<p>iOS Background Fetch runs at OS discretion — could be 15 min, could be never if the device is low on battery. Don't rely on it for critical work; use push to nudge the app.</p>

<h3>9. Biometric "lockout"</h3>
<p>After too many failures (5 Face ID, 5 Touch ID), the device locks out biometrics until passcode entry. Your app should fall back to passcode or manual auth.</p>

<h3>10. Camera in background</h3>
<p>iOS aggressively suspends camera when the app backgrounds. On return, you often need to re-initialize the camera session.</p>

<h3>11. Linking canOpenURL whitelist</h3>
<p>iOS: custom URL schemes you want to probe must be declared in <code>LSApplicationQueriesSchemes</code> in Info.plist. Otherwise <code>canOpenURL</code> returns false.</p>

<h3>12. Share sheet cancellation</h3>
<p>Share.share throws if the user cancels. Wrap in try/catch or check <code>action === dismissedAction</code>.</p>

<h3>13. File system paths differ</h3>
<p>iOS: <code>documentDirectory</code> backed up to iCloud unless excluded. <code>cacheDirectory</code> NOT backed up, can be purged by OS. Android: app-private storage similar but no iCloud. Pick the right directory.</p>

<h3>14. Haptics on Android</h3>
<p>Older Android has limited haptic APIs. <code>expo-haptics</code> wraps sensibly but the sensation differs across devices.</p>

<h3>15. AppState "inactive" state (iOS)</h3>
<p>Between "active" and "background" when the user swipes up to reveal control center or multi-tasks. Be careful about assuming "inactive = background."</p>

<h3>16. BackHandler on iOS</h3>
<p>iOS has no hardware back button — <code>BackHandler</code> only fires on Android. Don't rely on it for cross-platform.</p>

<h3>17. Clipboard monitoring restrictions</h3>
<p>iOS 14+ shows a system indicator when your app reads clipboard. Avoid reading on app foreground; read only on explicit user action.</p>

<h3>18. Permissions revoked while app is running</h3>
<p>User can toggle permissions in Settings while your app is backgrounded. On return, re-check before using the API.</p>

<h3>19. Simulator limitations</h3>
<p>iOS simulator: no camera (Xcode 15+ has virtual camera), fake location (set in Debug menu), no Face ID enrollment unless simulated. Android emulator: can simulate GPS, has camera via webcam. Always test critical paths on physical devices.</p>

<h3>20. Deep linking through notifications</h3>
<p>A notification's payload carries a URL; tapping it opens your app to that screen. Handle three cases: app already active (onMessage), backgrounded (onNotificationOpenedApp), killed (getInitialNotification). Forgetting the killed case = cold-start link doesn't route.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — asking permissions at app start</h3>
<p>User sees a barrage of permission prompts before understanding what they unlock. Grant rates drop. Request contextually.</p>

<h3>Anti-pattern 2 — no "blocked" state handling</h3>
<p>User denied-then-blocked; your app shows "allow permission" button that does nothing. Always detect BLOCKED and route to Settings.</p>

<h3>Anti-pattern 3 — permission request without rationale</h3>
<p>System dialog pops without context. User thinks "no" by default. Pre-flight with an explanation screen.</p>

<h3>Anti-pattern 4 — not handling revocation</h3>
<p>User granted last session, revoked in Settings, your app assumes still granted and crashes on first API call. Re-check on foreground.</p>

<h3>Anti-pattern 5 — using old-arch unmaintained libs for camera / location</h3>
<p>Many older libs lag behind RN versions. Stuck on old arch, miss Fabric, security patches. Vet maintenance activity.</p>

<h3>Anti-pattern 6 — not handling cold-start notifications</h3>
<p>App launches from a tapped notification; user ends up on home screen not the linked content. Must call <code>getInitialNotification</code> on mount.</p>

<h3>Anti-pattern 7 — leaking location subscriptions</h3>
<p>Starting <code>watchPositionAsync</code> without unsubscribing drains battery and keeps running even after screen unmount.</p>

<h3>Anti-pattern 8 — pushing huge data in notifications</h3>
<p>Both APNs and FCM have payload size limits (~4KB). Send an ID, app fetches the full content.</p>

<h3>Anti-pattern 9 — not unbinding AppState listener</h3>
<p>Memory leak + double-firing handlers after hot reload.</p>

<h3>Anti-pattern 10 — assuming simulator == device</h3>
<p>Camera, biometrics, some sensors, push notification delivery all behave differently. Physical device tests required.</p>

<h3>Anti-pattern 11 — storing sensitive data in FS without encryption</h3>
<p>Auth tokens, PII written to documentDirectory plain-text. Use secure storage.</p>

<h3>Anti-pattern 12 — one-shot background task that fails silently</h3>
<p>No logging, no retry logic. Background runs are rare opportunities — make each one count, log outcomes.</p>

<h3>Anti-pattern 13 — requesting overly broad permissions</h3>
<p>Location Always when WhenInUse suffices; Contacts when the user only needs to invite friends via share sheet. Ask for the minimum.</p>

<h3>Anti-pattern 14 — hardcoded error messages</h3>
<p>"Permission denied" is useless. Explain what's missing, how to grant, link to Settings.</p>

<h3>Anti-pattern 15 — no feature flag for device-dependent features</h3>
<p>Biometrics / AR / NFC don't exist on all devices. Detect via capability check (<code>hasHardwareAsync</code>) and hide unavailable features gracefully.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. How do you request a permission in RN?</div>
  <div class="qa-answer">
    <ol>
      <li>Declare the usage description in Info.plist (iOS) and uses-permission in AndroidManifest (Android).</li>
      <li>Use <code>react-native-permissions</code> (bare) or the API-specific hook (expo).</li>
      <li>Check current status first. Handle: unavailable → disable feature; granted → use; blocked → Settings; denied → request.</li>
      <li>Show a rationale screen before the system dialog.</li>
      <li>On grant, proceed. On deny, show a non-blocking fallback path.</li>
      <li>Re-check on app foreground in case user toggled in Settings.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. What happens if you don't add Info.plist usage description?</div>
  <div class="qa-answer">
    <p>The app crashes immediately when you try to use the API (e.g., present camera). Apple doesn't allow silent denial — they force you to explain to the user. Apps shipped without the right descriptions are rejected from the App Store.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. How do push notifications work in RN?</div>
  <div class="qa-answer">
    <ol>
      <li>App requests notification permission.</li>
      <li>App registers with APNs (iOS) / FCM (Android) to get a device token.</li>
      <li>App sends the token to your backend, associated with the user.</li>
      <li>Backend sends pushes via APNs / FCM APIs.</li>
      <li>OS delivers to device; app displays (foreground needs manual) or OS displays (background).</li>
      <li>User taps → app opens; JS handler reads payload and routes.</li>
    </ol>
    <p>Firebase Messaging unifies the client-side APIs across platforms.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. How do you handle a cold-start deep link from a notification?</div>
  <div class="qa-answer">
<pre><code class="language-tsx">useEffect(() =&gt; {
  // App was killed, launched from notification
  messaging().getInitialNotification().then((msg) =&gt; {
    if (msg?.data?.route) navigate(msg.data.route);
  });
  // App was in background, tapped notification
  const unsub = messaging().onNotificationOpenedApp((msg) =&gt; {
    if (msg.data?.route) navigate(msg.data.route);
  });
  return unsub;
}, []);</code></pre>
    <p>Three cases: foreground (onMessage), background-tap (onNotificationOpenedApp), cold-start (getInitialNotification).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. What's the difference between foreground and background location?</div>
  <div class="qa-answer">
    <p>Foreground: app has location access only while it's visible and interactive. Background: access continues when app is backgrounded or suspended. Background is subject to much stricter user approval — iOS asks twice (WhenInUse first, then Always after a while). Backgrounded tracking burns battery and has platform-specific rules (background modes, foreground service with notification on Android).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How do biometrics work?</div>
  <div class="qa-answer">
    <p>You call an API (<code>LocalAuthentication.authenticateAsync</code>) which prompts the OS biometric dialog. The OS verifies the user's fingerprint/face. Your app only receives success/failure — never the biometric data itself. For sensitive data: store the actual secret in the hardware-backed keychain with biometric binding so decryption requires the biometric check. Biometrics alone don't encrypt; they authenticate.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. When would you use Vision Camera vs expo-camera?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Vision Camera</strong>: modern (Fabric), frame processors for ML/OCR/barcode, HDR, multiple lens selection, advanced recording. For serious camera use.</li>
      <li><strong>expo-camera</strong>: simpler API, built into Expo. For basic photo/video capture.</li>
    </ul>
    <p>Both handle permissions, both expose preview view. Vision Camera's frame processors unlock scanning + AR use cases.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How do you persist a background task reliably?</div>
  <div class="qa-answer">
    <p>Use expo-background-fetch / expo-task-manager (or react-native-background-fetch for bare). Register at app init; OS runs per its scheduling heuristics. Don't rely on cadence — design the task to be idempotent. Alternatives: push-driven sync (server sends push when there's new data; app wakes for ~30s to fetch), foreground service on Android (visible notification, guaranteed execution).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. How do you handle the Android back button?</div>
  <div class="qa-answer">
<pre><code class="language-tsx">useEffect(() =&gt; {
  const sub = BackHandler.addEventListener('hardwareBackPress', () =&gt; {
    if (modalOpen) { closeModal(); return true; }
    return false; // let default handling run (navigation back)
  });
  return () =&gt; sub.remove();
}, [modalOpen]);</code></pre>
    <p>Return <code>true</code> to prevent default (you handled it); return <code>false</code> to let the system handle (navigation back, app exit).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. How do you share content from your app?</div>
  <div class="qa-answer">
<pre><code class="language-ts">await Share.share({ message: 'Look at this', url: 'https://example.com' });</code></pre>
    <p>Opens native share sheet. For richer share (images, files): libraries like <code>react-native-share</code> support base64 / file URIs. Wrap in try/catch — user cancellation throws on some platforms.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. Your camera works on iOS but not Android. What do you check?</div>
  <div class="qa-answer">
    <ol>
      <li>AndroidManifest declares <code>&lt;uses-permission android:name="android.permission.CAMERA"/&gt;</code>.</li>
      <li>Runtime permission request happened and was granted.</li>
      <li>Android version ≥ 6 handles runtime permissions (older versions granted at install).</li>
      <li>Native camera library linked via autolinking (pod install / gradle sync).</li>
      <li>Device actually has a camera (emulator without webcam support won't work).</li>
      <li>Logcat for native errors.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. How do you handle partial photo library access?</div>
  <div class="qa-answer">
    <p>On iOS 14+, permission state <code>limited</code> means user selected specific photos. Your UI should:</p>
    <ul>
      <li>Show only the photos they granted.</li>
      <li>Offer "Select more photos" (presents the limited picker so user can add more without navigating to Settings).</li>
      <li>Not assume full library access.</li>
    </ul>
    <p><code>react-native-permissions</code> exposes <code>RESULTS.LIMITED</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. What triggers the iOS clipboard indicator?</div>
  <div class="qa-answer">
    <p>Any <code>Clipboard.getString()</code> shows a small system banner. Reading on every app foreground feels creepy and some users complain. Only read in response to explicit user action (paste button, URL import, etc.).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. How do you unit-test code that uses device APIs?</div>
  <div class="qa-answer">
    <p>Mock the native module via Jest:</p>
<pre><code class="language-ts">jest.mock('expo-location', () =&gt; ({
  requestForegroundPermissionsAsync: jest.fn(() =&gt; Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() =&gt; Promise.resolve({ coords: { latitude: 0, longitude: 0 } })),
}));</code></pre>
    <p>For end-to-end, Detox / Maestro on simulators / devices — they actually exercise native APIs.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. Describe a secure biometric-gated password vault.</div>
  <div class="qa-answer">
    <ol>
      <li>Store the vault's encryption key in the hardware keychain, bound to biometric access (iOS kSecAccessControlBiometryAny / Android BiometricPrompt + Keystore).</li>
      <li>On app open: prompt biometric via <code>LocalAuthentication.authenticateAsync</code>.</li>
      <li>OS verifies; on success, the keychain releases the key.</li>
      <li>Decrypt vault contents with the key.</li>
      <li>Keep key in memory only while vault is open; zero on close.</li>
      <li>Fallback to passcode / recovery phrase if biometrics fail.</li>
    </ol>
    <p>Libraries: expo-secure-store (simple), react-native-keychain (more control), react-native-biometrics (auth + signing).</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You handle all permission states (unavailable / denied / blocked / granted / limited).</li>
    <li>You request contextually, with rationale, not at app start.</li>
    <li>You test on real devices, not just simulators.</li>
    <li>You handle push notifications' three cases (foreground / background-tap / cold-start).</li>
    <li>You use expo-secure-store / keychain for sensitive data.</li>
    <li>You clean up location watchers / AppState listeners.</li>
    <li>You gate biometric UI on capability checks.</li>
    <li>You know notification channels (Android) and categories (iOS).</li>
  </ul>
</div>
`}

]
});
