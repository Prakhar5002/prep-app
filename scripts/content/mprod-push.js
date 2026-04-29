window.PREP_SITE.registerTopic({
  id: 'mprod-push',
  module: 'mobile-prod',
  title: 'Push Notifications',
  estimatedReadTime: '45 min',
  tags: ['push-notifications', 'apns', 'fcm', 'silent-push', 'rich-notifications', 'react-native', 'permissions', 'segmentation'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Push notifications</strong> are the only way your mobile app talks to the user when it's not running. Done well, they're the highest-leverage retention lever you have. Done badly, they tank opt-in rate, drag down store ratings, and erode trust permanently.</p>
<ul>
  <li><strong>Two carriers.</strong> iOS uses <strong>APNs</strong> (Apple Push Notification service), Android uses <strong>FCM</strong> (Firebase Cloud Messaging — formerly GCM). Both speak HTTP/2 from your server.</li>
  <li><strong>Two payload types.</strong> <em>Visible</em> (banner/sound/badge — user-facing) and <em>silent</em> (data-only — wake the app for background work).</li>
  <li><strong>Three-step pipeline.</strong> Device registers → server stores token → server sends → carrier delivers → device displays / dispatches.</li>
  <li><strong>Permissions are everything.</strong> iOS requires explicit user opt-in (<code>UNAuthorizationOptions</code>); Android 13+ does too. Once denied, getting it back is hostile (Settings → app → Notifications). <strong>Time the prompt.</strong></li>
  <li><strong>Default tools:</strong> <strong>Firebase Messaging</strong> (free, cross-platform, scales), <strong>OneSignal</strong> (free with caps, web UI), <strong>Braze</strong> (enterprise, lifecycle automation), <strong>Customer.io</strong>, <strong>Iterable</strong>, or roll-your-own atop APNs/FCM.</li>
  <li><strong>Rich notifications.</strong> Images, action buttons, expanded content, in-app badges. iOS Notification Service Extension + Notification Content Extension. Android NotificationCompat with BigPictureStyle.</li>
  <li><strong>Segmentation &gt; broadcast.</strong> "Send to everyone who hasn't logged in in 7 days who's iOS who lives in EU and previously bought item X." Requires user-property pipeline.</li>
  <li><strong>Measure outcomes, not opens.</strong> Open rate is vanity; conversion (the action you wanted them to do) is reality.</li>
</ul>
<p><strong>Mantra:</strong> "Earn the opt-in. Send rarely. Personalize precisely. Measure conversion. Respect the off switch."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What is a push notification, technically?</h3>
<p>It's a JSON payload your server sends to Apple's APNs or Google's FCM. The carrier finds the device using a device token your app obtained at registration time, delivers the payload (when the device next has connectivity), and the OS either:</p>
<ul>
  <li>Displays a banner / plays a sound / updates the badge (visible push), or</li>
  <li>Wakes your app in background to run a handler (silent push / data message).</li>
</ul>

<h3>Why mobile teams obsess over them</h3>
<table>
  <thead><tr><th>Reason</th><th>Detail</th></tr></thead>
  <tbody>
    <tr><td>Retention lever</td><td>Push-enabled users retain ~2× as long as opted-out users in most consumer apps.</td></tr>
    <tr><td>Engagement loop</td><td>"Friend tagged you," "Order shipped," "Match found" — the app's nervous system.</td></tr>
    <tr><td>Re-engagement</td><td>The only channel to bring back a user who hasn't opened the app in days.</td></tr>
    <tr><td>Transactional must-haves</td><td>OTP, ride status, payment receipts — non-negotiable to function.</td></tr>
  </tbody>
</table>

<h3>Why they're hard to get right</h3>
<ul>
  <li><strong>Permission economics.</strong> Default iOS opt-in rate without a smart prompt: ~30%. With a soft pre-prompt, ~60–70%. The asymmetry is enormous.</li>
  <li><strong>OS divergence.</strong> iOS visible vs silent rules differ from Android's; Android 13+ now requires runtime permission.</li>
  <li><strong>Reliability tax.</strong> APNs/FCM may delay or drop low-priority pushes; "delivered" means "the carrier accepted it," not "the user saw it."</li>
  <li><strong>Privacy regulations.</strong> EU GDPR/PECR requires consent for marketing pushes (transactional pushes are usually exempt).</li>
  <li><strong>App store policy.</strong> Apple bans "abusive marketing" pushes; users tap "Report a concern" and your developer account suffers.</li>
  <li><strong>Quiet hours.</strong> Sending notifications at 3am loses you users — they won't uninstall, they'll just turn off pushes.</li>
</ul>

<h3>The categories of push</h3>
<table>
  <thead><tr><th>Category</th><th>Purpose</th><th>Opt-in implication</th></tr></thead>
  <tbody>
    <tr><td>Transactional</td><td>OTP, order status, friend's reply</td><td>Most users tolerate; lawful even without marketing consent</td></tr>
    <tr><td>Promotional</td><td>Sale, recommendation, "we miss you"</td><td>Easy way to lose opt-in; needs explicit consent in EU</td></tr>
    <tr><td>Lifecycle / re-engagement</td><td>"Day 7 — finish setup," "Try this feature"</td><td>Smart targeting earns engagement; spray-and-pray loses opt-out</td></tr>
    <tr><td>Silent / data</td><td>Background sync, badge update, location-aware refresh</td><td>No user permission needed (doesn't show); rate-limited by OS</td></tr>
  </tbody>
</table>

<h3>What "good" looks like</h3>
<ul>
  <li>Permission prompt is <strong>delayed</strong> until the user has experienced value — not on first launch.</li>
  <li>You ship a <strong>soft prompt</strong> first ("would you like to be notified when…?") — if user says no, you don't fire the OS prompt.</li>
  <li>Categories are <strong>opt-in granular</strong> (post-onboarding settings: "match alerts," "promotions," "product news").</li>
  <li>Sending is <strong>throttled per user</strong> (e.g., max 1 marketing push/day, max 5/week).</li>
  <li>Quiet hours are respected (<strong>localized</strong> to user's timezone, not server's).</li>
  <li>Every send logs an <strong>event</strong>: <em>sent → delivered → opened → converted</em>; conversion is the KPI.</li>
  <li>Failed-send tokens are <strong>auto-pruned</strong> (FCM/APNs return "InvalidToken" → mark dead).</li>
  <li>You have a <strong>kill switch</strong> for outbound campaigns in case of bug or abuse.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The end-to-end pipeline</h3>
<pre><code class="language-text">1. App startup → SDK requests device token from APNs/FCM.
2. SDK returns token to app.
3. App sends token + user_id to your backend.
4. Backend stores (user_id, token, platform, app_version, last_seen).
5. When you want to send: backend constructs payload → posts to APNs/FCM HTTP/2.
6. Carrier finds device, delivers (or queues if offline, retries up to ~28 days).
7. OS displays / wakes app.
8. App fires "push_received" / "push_opened" event back to analytics.
</code></pre>

<h3>Token management — the database</h3>
<p>Tokens rotate. Backup &amp; restore can transfer them across devices. Reinstall changes them. Lock-screen permission revocation may invalidate them. Treat the token registry as a <em>dynamic</em> table:</p>
<ul>
  <li>One user can have many tokens (iPhone + iPad + work phone).</li>
  <li>One token can never have multiple users (next user invalidates the previous).</li>
  <li>Always update token on every app launch.</li>
  <li>Delete token on user logout (so the next signed-out user doesn't get the previous user's pushes).</li>
  <li>Auto-prune tokens that return InvalidToken / NotRegistered (after the next send attempt).</li>
</ul>

<h3>The payload anatomy (APNs)</h3>
<pre><code class="language-json">{
  "aps": {
    "alert": {
      "title": "Sara sent you a message",
      "subtitle": "1 new message",
      "body": "Hey, are you free?"
    },
    "badge": 1,
    "sound": "default",
    "category": "MESSAGE",
    "thread-id": "conversation_42",
    "mutable-content": 1,
    "content-available": 1
  },
  "data": {
    "conversation_id": "c_42",
    "deep_link": "myapp://chat/c_42"
  }
}
</code></pre>

<h3>The payload anatomy (FCM)</h3>
<pre><code class="language-json">{
  "message": {
    "token": "&lt;device_token&gt;",
    "notification": {
      "title": "Sara sent you a message",
      "body": "Hey, are you free?"
    },
    "data": {
      "conversation_id": "c_42",
      "deep_link": "myapp://chat/c_42"
    },
    "android": {
      "priority": "high",
      "notification": {
        "channel_id": "messages",
        "click_action": "OPEN_CHAT"
      }
    },
    "apns": { /* APNs override */ }
  }
}
</code></pre>

<h3>Visible vs silent — the routing matrix</h3>
<table>
  <thead><tr><th>iOS</th><th>"alert" present</th><th>"content-available": 1</th></tr></thead>
  <tbody>
    <tr><td>Visible push</td><td>yes</td><td>optional (lets app modify)</td></tr>
    <tr><td>Silent / background</td><td>no</td><td>1</td></tr>
  </tbody>
</table>
<table>
  <thead><tr><th>Android (FCM)</th><th>"notification" key</th><th>"data" key</th></tr></thead>
  <tbody>
    <tr><td>Visible (system displays)</td><td>yes</td><td>optional</td></tr>
    <tr><td>Data-only (app handles)</td><td>no</td><td>yes</td></tr>
  </tbody>
</table>
<p>Default: send <strong>data-only</strong> on Android so your code controls when/what to display (channels, throttling, deduping). Send <strong>alert</strong> with <strong>mutable-content</strong> on iOS so you can modify in your Notification Service Extension before display.</p>

<h3>OS rate limiting</h3>
<ul>
  <li><strong>Silent push on iOS:</strong> capped to ~2-3 per hour by the OS. Not delivered if it would impact battery. Use sparingly.</li>
  <li><strong>FCM "high priority":</strong> Google rate-limits abusive senders; over-use degrades delivery.</li>
  <li><strong>Doze / App Standby (Android):</strong> when the device is idle, only "high-priority" pushes wake the app immediately; "normal" are batched.</li>
</ul>

<h3>The "open" → "convert" funnel</h3>
<pre><code class="language-text">Sent      100,000
Delivered  98,500    (1.5% loss to invalid/rate-limit)
Displayed  62,000    (35% of devices have notifications muted/snoozed)
Opened      6,200    (10% open rate of displayed)
Converted   1,860    (30% of openers do the action)
</code></pre>
<p>Optimize each rung. Most teams obsess over open rate; the real lever is delivered → displayed (segmentation, timing) and opened → converted (deep linking, content match).</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>React Native + Firebase Messaging — the standard setup</h3>
<pre><code class="language-bash">yarn add @react-native-firebase/app @react-native-firebase/messaging
cd ios &amp;&amp; pod install
</code></pre>

<pre><code class="language-tsx">// notifications/index.ts
import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import notifee, { AndroidImportance } from '@notifee/react-native';

export async function registerPushDevice(userId: string) {
  // 1. ask permission (iOS auto-prompts; Android 13+ needs runtime permission)
  if (Platform.OS === 'android' &amp;&amp; Platform.Version &gt;= 33) {
    const r = await PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS' as any);
    if (r !== 'granted') return null;
  }
  const settings = await messaging().requestPermission({ provisional: false });
  if (settings === messaging.AuthorizationStatus.DENIED) return null;

  // 2. get token
  const token = await messaging().getToken();

  // 3. send to your backend (with user_id, platform, app version)
  await api.upsertPushToken({
    user_id: userId,
    token,
    platform: Platform.OS,
    app_version: getAppVersion(),
  });

  // 4. listen for token rotation
  messaging().onTokenRefresh(async (next) =&gt; {
    await api.upsertPushToken({ user_id: userId, token: next, platform: Platform.OS, app_version: getAppVersion() });
  });

  return token;
}
</code></pre>

<h3>Handling pushes in foreground / background / quit</h3>
<pre><code class="language-tsx">// Foreground — your app is open
messaging().onMessage(async (msg) =&gt; {
  // RN's default doesn't display foreground notifications.
  // Use notifee to show a local notification:
  await notifee.displayNotification({
    title: msg.notification?.title,
    body: msg.notification?.body,
    android: { channelId: 'messages' },
    data: msg.data,
  });
});

// Background / quit — handled automatically by the OS for visible payloads,
// but you may want to do work for data-only payloads:
messaging().setBackgroundMessageHandler(async (msg) =&gt; {
  // sync data, update badge, etc.
  // return Promise; iOS gives you ~30s, Android ~10s
});

// User taps the notification → open the right screen
messaging().onNotificationOpenedApp((msg) =&gt; {
  if (msg.data?.deep_link) Linking.openURL(msg.data.deep_link);
});

// Cold start from push
messaging().getInitialNotification().then((msg) =&gt; {
  if (msg?.data?.deep_link) Linking.openURL(msg.data.deep_link);
});
</code></pre>

<h3>Android channels (mandatory on 8+)</h3>
<pre><code class="language-tsx">// Create channels at app start
await notifee.createChannelGroup({ id: 'main', name: 'Main' });
await notifee.createChannel({
  id: 'messages',
  name: 'Messages',
  importance: AndroidImportance.HIGH,
  vibration: true,
  groupId: 'main',
});
await notifee.createChannel({
  id: 'promotions',
  name: 'Promotions',
  importance: AndroidImportance.LOW,   // user can't disable individual channels above LOW
});
</code></pre>
<p>Without channels, Android &gt;=8 silently drops your notifications. Group related channels so users can mute "Promotions" while keeping "Messages."</p>

<h3>iOS rich pushes — Notification Service Extension</h3>
<p>You add a target to your Xcode project. The Service Extension intercepts the push <em>before</em> it's displayed and can:</p>
<ul>
  <li>Download an attachment (image, video) from the server.</li>
  <li>Decrypt an end-to-end encrypted payload.</li>
  <li>Modify title/body based on local state.</li>
</ul>
<pre><code class="language-objective-c">// NotificationService.m (iOS)
- (void)didReceiveNotificationRequest:(UNNotificationRequest *)request
                  withContentHandler:(void (^)(UNNotificationContent *))handler {
  self.contentHandler = handler;
  self.bestAttemptContent = [request.content mutableCopy];
  // download attachment from request.content.userInfo[@"image_url"]
  // attach via UNNotificationAttachment
  handler(self.bestAttemptContent);
}
</code></pre>

<h3>iOS Notification Content Extension</h3>
<p>For long-press-expanded UI: a custom view you ship that renders rich content (e.g., a chat snippet, video preview).</p>

<h3>Server-side send (Node + firebase-admin)</h3>
<pre><code class="language-ts">import { getMessaging } from 'firebase-admin/messaging';

export async function sendChatPush(token: string, conversationId: string, text: string) {
  const msg = {
    token,
    notification: { title: 'New message', body: text },
    data: { conversation_id: conversationId, deep_link: \`myapp://chat/\${conversationId}\` },
    android: { priority: 'high' as const, notification: { channelId: 'messages' } },
    apns: { headers: { 'apns-priority': '10' }, payload: { aps: { 'content-available': 1, 'mutable-content': 1, sound: 'default' } } },
  };
  try {
    const id = await getMessaging().send(msg);
    return id;
  } catch (e: any) {
    if (e.code === 'messaging/registration-token-not-registered') {
      // mark token dead
      await db.tokens.delete({ token });
    }
    throw e;
  }
}
</code></pre>

<h3>Soft prompt before OS prompt</h3>
<pre><code class="language-tsx">function MaybeRequestPushPerm() {
  const [done, setDone] = useStoredFlag('hasAskedPush');
  const [showSoft, setShowSoft] = useState(false);

  useEffect(() =&gt; {
    if (!done) setTimeout(() =&gt; setShowSoft(true), 30_000);   // ask after 30s of useful activity
  }, [done]);

  if (!showSoft) return null;
  return (
    &lt;Sheet&gt;
      &lt;Text&gt;Get notified when someone messages you?&lt;/Text&gt;
      &lt;Button title="Yes, notify me" onPress={async () =&gt; {
        await registerPushDevice(currentUser.id);   // triggers OS prompt
        setDone(true);
        setShowSoft(false);
      }} /&gt;
      &lt;Button title="Not now" onPress={() =&gt; { setShowSoft(false); /* don't fire OS prompt */ }} /&gt;
    &lt;/Sheet&gt;
  );
}
</code></pre>
<p><strong>Critical:</strong> if user taps "Not now," do NOT show the OS prompt. Once they say no to OS, the only way back is Settings → app — many users will never go there. Wait, ask again later.</p>

<h3>Granular categories at the user level</h3>
<pre><code class="language-tsx">// Settings screen
&lt;Switch value={prefs.messages} onValueChange={(v) =&gt; api.savePrefs({ messages: v })} label="Messages" /&gt;
&lt;Switch value={prefs.promotions} onValueChange={(v) =&gt; api.savePrefs({ promotions: v })} label="Promotions" /&gt;
&lt;Switch value={prefs.matchAlerts} onValueChange={(v) =&gt; api.savePrefs({ matchAlerts: v })} label="Match alerts" /&gt;

// Server side, before sending: respect prefs
if (campaign.category === 'promotions' &amp;&amp; !user.prefs.promotions) skip();
</code></pre>

<h3>Quiet hours (timezone-aware)</h3>
<pre><code class="language-ts">function inQuietHours(user: User, now: Date): boolean {
  const local = utcToZonedTime(now, user.timezone);
  const hour = local.getHours();
  return hour &lt; 8 || hour &gt;= 22;
}
</code></pre>

<h3>Throttling per user</h3>
<pre><code class="language-ts">const RECENT_MAX_DAY = 3;
async function shouldSend(userId: string, category: string): Promise&lt;boolean&gt; {
  if (category === 'transactional') return true;   // never throttle transactional
  const sent24h = await db.pushLog.count({ user_id: userId, ts: { gt: dayAgo() }, category });
  return sent24h &lt; RECENT_MAX_DAY;
}
</code></pre>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: A complete onboarding push prompt flow</h3>
<pre><code class="language-tsx">// Day 0 install — DO NOT prompt yet
// Day 0+, after user finishes their first chat:
function MessageSentScreen() {
  const askedRef = useRef(false);
  useEffect(() =&gt; {
    if (askedRef.current) return;
    askedRef.current = true;
    showSoftPushPrompt();   // soft sheet
  }, []);
}

// If user accepts the soft prompt:
async function showSoftPushPrompt() {
  const r = await Alert.confirm({
    title: 'Stay in the loop?',
    message: 'Get notified when Sara replies.',
    confirmText: 'Yes, notify me',
  });
  if (r) {
    await registerPushDevice(currentUser.id);   // fires OS prompt
    logEvent('push_permission_requested', { source: 'first_message' });
  } else {
    logEvent('push_permission_soft_declined', { source: 'first_message' });
    // try again in 7 days, with a different framing
  }
}
</code></pre>

<h3>Example 2: Deep-linking from a tap</h3>
<pre><code class="language-tsx">// Server payload includes a deep_link
// On tap → navigate to the right screen
useEffect(() =&gt; {
  const sub = messaging().onNotificationOpenedApp((msg) =&gt; {
    handleDeepLink(msg.data?.deep_link);
  });
  messaging().getInitialNotification().then((msg) =&gt; {
    if (msg) handleDeepLink(msg.data?.deep_link);
  });
  return sub;
}, []);

function handleDeepLink(url?: string) {
  if (!url) return;
  // Mark conversion before navigating
  logEvent('push_opened', {
    notification_id: '...',
    campaign_id: '...',
    seconds_to_open: '...',
  });
  Linking.openURL(url);
}
</code></pre>

<h3>Example 3: Silent push for badge sync</h3>
<pre><code class="language-tsx">// Server sends content-available:1 with no alert.
// App wakes in background, fetches unread count, updates badge.

messaging().setBackgroundMessageHandler(async (msg) =&gt; {
  if (msg.data?.kind === 'badge_sync') {
    const count = await fetchUnreadCount();
    await notifee.setBadgeCount(count);
  }
});
</code></pre>
<p><strong>iOS caveat:</strong> silent pushes are <em>throttled</em> by the OS. Don't rely on every one being delivered. For badge sync, also reconcile on foreground.</p>

<h3>Example 4: Localized message bodies</h3>
<pre><code class="language-ts">// Server-side renders the message in user's locale
async function buildBody(user: User, conversationId: string) {
  const t = i18n.for(user.locale);
  return t('chat.new_message', { name: getOtherParticipantName(conversationId, user.id) });
}
</code></pre>
<p>Don't ship English copy to non-English users. Localized bodies dramatically improve open rates.</p>

<h3>Example 5: Action buttons</h3>
<pre><code class="language-objective-c">// iOS — register a category at app launch
let yes = UNNotificationAction(identifier: "yes", title: "Yes", options: [.foreground])
let no = UNNotificationAction(identifier: "no", title: "No", options: [])
let category = UNNotificationCategory(identifier: "INVITE", actions: [yes, no], intentIdentifiers: [])
UNUserNotificationCenter.current().setNotificationCategories([category])
</code></pre>
<pre><code class="language-tsx">// React Native handler (via notifee or messaging())
notifee.onForegroundEvent(({ type, detail }) =&gt; {
  if (type === EventType.ACTION_PRESS) {
    const action = detail.pressAction?.id;
    const data = detail.notification?.data;
    if (action === 'yes') api.acceptInvite(data.invite_id);
    if (action === 'no') api.declineInvite(data.invite_id);
  }
});
</code></pre>

<h3>Example 6: Throttling with category respect</h3>
<pre><code class="language-ts">async function maybeSend(user: User, category: PushCategory, payload: PushPayload) {
  if (!user.prefs[category]) return { skipped: 'prefs_off' };
  if (inQuietHours(user, new Date())) return { skipped: 'quiet_hours' };
  if (await throttled(user, category)) return { skipped: 'throttled' };
  return await sendPush(user, payload);
}
</code></pre>

<h3>Example 7: Token cleanup loop</h3>
<pre><code class="language-ts">// Run nightly: prune tokens that haven't been seen in 90+ days
await db.pushTokens.deleteMany({
  last_seen_at: { lt: ninetyDaysAgo() },
});
// Plus: any token that returned UNREGISTERED in the last 24h
</code></pre>

<h3>Example 8: A/B-testable push copy</h3>
<pre><code class="language-ts">// Server-side: pick variant for this user
const variant = await statsig.getExperiment(user.id, 'push_copy_test');
const body = variant.value === 'B'
  ? \`\${name} just messaged you 💬\`
  : \`\${name}: "\${preview}"\`;

// Log variant alongside send
await db.pushSends.insert({ user_id, campaign, variant: variant.value });
</code></pre>

<h3>Example 9: Funnel measurement</h3>
<pre><code class="language-text">campaign_id: 'lifecycle_d3'
  sent:      120,000
  delivered: 118,400
  opened:     14,300  (12% of delivered)
  converted:   3,800  (27% of opened)
  → primary metric: D7 retention
     +1.4pp vs control (no push), p=0.001
</code></pre>

<h3>Example 10: Crash-safe foreground display</h3>
<pre><code class="language-tsx">// Don't trust message structure on receive
messaging().onMessage(async (msg) =&gt; {
  try {
    const title = msg.notification?.title ?? 'New activity';
    const body = msg.notification?.body ?? '';
    await notifee.displayNotification({ title, body, data: msg.data ?? {} });
  } catch (err) {
    Sentry.captureException(err, { extra: { msg } });
  }
});
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Token rotation</h3>
<p>FCM/APNs may rotate the token at any time (OS updates, restore from backup, app reinstall). Always update on every launch and listen for <code>onTokenRefresh</code>. If you don't, you're sending to dead addresses.</p>

<h3>Reinstall transfers token (sometimes)</h3>
<p>iOS keychain may persist data across reinstalls; the same Apple ID may restore the same APNs token. Android FCM tokens are usually new on reinstall. Don't assume tokens are unique to one install lifetime.</p>

<h3>Permission revoked silently</h3>
<p>User opens Settings, turns off your notifications. Your server doesn't know. Symptom: you keep sending; the carrier returns "delivered" but the user sees nothing. Solution: client-side, on each foreground, check current authorization status and report to server (<code>permission_status: granted | denied | provisional</code>). If denied, stop sending non-transactional.</p>

<h3>Quiet hours off-by-timezone</h3>
<p>"Quiet hours = 10pm–7am" — but in whose timezone? Always store the user's timezone and convert at send time. A user in Tokyo getting a "good morning" push at 4am Tokyo is your fault, not Apple's.</p>

<h3>Daylight savings</h3>
<p>"Send at 9am every day." Sunday DST jump → "9am" shifts. Use <code>zonedTime</code> conversions; don't store a UTC offset.</p>

<h3>Background fetch limits (iOS)</h3>
<p>iOS heavily limits background work for the sake of battery. Silent push delivery is <em>opportunistic</em>; you may not see every payload. Don't depend on silent push for correctness — always reconcile state on foreground.</p>

<h3>Doze / App Standby (Android)</h3>
<p>If the device is idle, normal-priority FCM messages are batched; high-priority ones break through. Marking everything high-priority gets you flagged for abuse and downgraded by Google. Pick deliberately.</p>

<h3>Notification Service Extension memory limit</h3>
<p>iOS Service Extensions have ~24MB memory and ~30 seconds. If you crash, the OS displays the original payload (without modifications). Test with low-memory devices.</p>

<h3>Mutable-content required for image attachments</h3>
<p>Without <code>mutable-content: 1</code> in the iOS payload, your Service Extension never runs. Set it server-side; common bug.</p>

<h3>Android channel changes after install</h3>
<p>Once a channel is created, you can't change its <code>importance</code> level (the user "owns" their setting). Renaming/migrating channels means creating a new one and deprecating the old — users won't see the new one until next launch and must re-toggle.</p>

<h3>Apple's "ATT-protected" tokens</h3>
<p>Push token itself isn't ATT-restricted, but <em>using it for cross-app tracking</em> is. Don't share tokens with marketing partners without explicit consent.</p>

<h3>FCM topics — broadcast trap</h3>
<p>FCM "topics" let you send to all devices subscribed to a topic in one call. Tempting, but:</p>
<ul>
  <li>You can't easily unsubscribe one device.</li>
  <li>You lose per-user analytics.</li>
  <li>Easy to spam.</li>
</ul>
<p>Use topics only for genuinely broadcast scenarios (e.g., breaking-news app where everyone gets every alert).</p>

<h3>Long content strings</h3>
<p>iOS body limit ~256 chars; Android ~4KB; APNs payload limit 4KB total (256 bytes pre-iOS 13, but expanded). Truncate server-side; don't rely on the client to wrap.</p>

<h3>Locale fallback</h3>
<p>Server doesn't know the user's locale because they haven't logged in yet (push to anonymous). Default to English; provide a "language preference" early in onboarding.</p>

<h3>iOS Focus / Do Not Disturb / Time-Sensitive</h3>
<p>iOS 15+ adds Focus modes. To break through Focus for genuinely urgent pushes (DM, emergency), set <code>"interruption-level": "time-sensitive"</code>. Misuse will get you reported by users.</p>

<h3>Notification grouping</h3>
<p>iOS auto-groups by app; Android groups within a channel. Use <code>thread-id</code> (iOS) or <code>android.notification.tag</code> to group related pushes (e.g., per-conversation). Without grouping, "10 new messages" looks like spam.</p>

<h3>Stale data in payloads</h3>
<p>"Sara just messaged you" — but the user is currently <em>in</em> Sara's chat. Silent-push the badge update; don't display a banner. Server-side: track user's current foreground state via heartbeat to avoid this.</p>

<h3>Priority and battery</h3>
<p>"high-priority" wakes the device immediately. Overuse = OS deprioritizes you. Reserve for truly time-critical (chat, ride matches, transactional). Use "normal" for marketing.</p>

<h3>Lock screen content privacy</h3>
<p>iOS users can hide content on lock screen. APNs <code>"interruption-level": "passive"</code> + <code>"thread-id"</code> respect their settings. Don't put sensitive content (OTP, message preview) in title/body; put it in deep-linked content.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: Asking for permission on first launch</h3>
<pre><code class="language-tsx">// BAD — user has no idea what they're consenting to
useEffect(() =&gt; {
  messaging().requestPermission();   // first 2 seconds of app
}, []);

// GOOD — earn it
//   - Onboard the user
//   - Show value (let them complete their first action)
//   - Then soft-prompt with context
//   - Only fire OS prompt on soft-yes
</code></pre>

<h3>Bug 2: OS prompt before soft prompt</h3>
<p>Once OS denied, you're locked out for the install lifetime (unless user goes to Settings). Always soft-prompt first; if "no," do not fire OS prompt.</p>

<h3>Bug 3: Token registered without user_id</h3>
<pre><code class="language-tsx">// BAD — push registered before login
const token = await messaging().getToken();
await api.upsertToken({ token, user_id: null });

// You can't target users; you can only broadcast.

// GOOD — register on login (or when user_id becomes known)
</code></pre>

<h3>Bug 4: Forgetting to remove token on logout</h3>
<pre><code class="language-tsx">async function logout() {
  await api.signOut();
  // forgot:
  // await messaging().deleteToken();
  // await api.deletePushToken({ user_id: prevUser.id, token });
}
// Result: previous user keeps getting pushes meant for the next signed-in user.
</code></pre>

<h3>Bug 5: Hardcoded channel ID without creating the channel</h3>
<pre><code class="language-tsx">// Server sends with channel_id "messages"
// App never created a "messages" channel
// → Android &gt;=8 silently drops the notification
</code></pre>

<h3>Bug 6: Treating "delivered" as "seen"</h3>
<p>APNs/FCM "delivered" means the device acknowledged receipt. The user may have notifications muted, the device may be locked, the OS may have grouped it. Always log a separate "displayed" event from the client where possible.</p>

<h3>Bug 7: Silent push for important state</h3>
<pre><code class="language-tsx">// BAD — relying on silent push to update critical badge
// silent push is OS-throttled; not all delivered
messaging().setBackgroundMessageHandler(async (msg) =&gt; {
  await api.refreshBadge();
});

// GOOD — also reconcile on foreground
AppState.addEventListener('change', (s) =&gt; {
  if (s === 'active') api.refreshBadge();
});
</code></pre>

<h3>Bug 8: Badge counter never resets</h3>
<p>You increment the iOS badge to 1, 2, 3 with every push. User opens the app, reads everything. Badge still says 5. Reset on relevant action (open, mark read).</p>

<h3>Bug 9: Personalization that exposes data</h3>
<pre><code class="language-text">"Sara: 'I love you' — sent 7:42pm"

User's phone is on the table. Roommate sees it on the lock screen.
Use redacted previews for sensitive content; let users opt in to "show preview".
</code></pre>

<h3>Bug 10: "Try the new feature" promo to power users</h3>
<p>Sending "Try our new feature!" to a user who already uses it daily looks robotic. Segment harder: only send to users who haven't used the feature in N days.</p>

<h3>Anti-pattern 1: spray-and-pray broadcast</h3>
<p>"We have 1M users; let's send everyone the sale." Result: 5% open, 0.1% conversion, 2% turn off pushes. Cumulative damage compounds.</p>

<h3>Anti-pattern 2: no kill switch</h3>
<p>Bug in the campaign tool sends 50,000 users a "test" push at 3am. By the time you wake up, 5,000 have uninstalled. Always wire a "halt all outbound" switch and a per-campaign budget alert.</p>

<h3>Anti-pattern 3: ignoring opt-out signals</h3>
<p>User mutes "Promotions" channel. You keep sending to it because "the OS handles muting." Fine — but the user has signaled disinterest. Stop sending; save budget; reconfigure.</p>

<h3>Anti-pattern 4: timestamps in user's body</h3>
<pre><code class="language-text">"You haven't logged in for 3 days, 17 hours, 22 minutes."
Creepy. Round to "a few days."
</code></pre>

<h3>Anti-pattern 5: emoji vomit</h3>
<p>"🎉🎁🎊 BIG SALE 🎊🎁🎉" performs well in initial A/B but burns out fast. Variety + restraint &gt; novelty.</p>

<h3>Anti-pattern 6: same payload for both platforms</h3>
<p>iOS title 30 chars, Android title 40+ chars. Different fonts. Different display widths. Test on both.</p>

<h3>Anti-pattern 7: not measuring delivered</h3>
<p>Most teams measure sent → opened. The biggest leak is sent → delivered (~30% of audiences have notifications fully muted) and delivered → displayed (Doze, Focus). Log both.</p>

<h3>Anti-pattern 8: no localization</h3>
<p>English-only push to non-English users → low open rate, immediate uninstall. Localize the body even if you don't translate the in-app UI yet.</p>

<h3>Anti-pattern 9: mixing transactional and marketing</h3>
<p>OTP arrives + 5 minutes later: "Have you seen our new feature?" User confused, marks as spam. Separate channels (Android), separate categories (iOS), separate consent.</p>

<h3>Anti-pattern 10: no quiet hours</h3>
<p>Sending at 3am because the cron job runs in UTC. Set quiet hours and respect timezones. Always.</p>
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
    <tr><td><em>How does push work end-to-end?</em></td><td>Device gets token from APNs/FCM → sends to backend → backend posts payload to APNs/FCM → carrier delivers → OS displays / wakes app.</td></tr>
    <tr><td><em>APNs vs FCM?</em></td><td>Apple's vs Google's push carrier. Both HTTP/2; APNs auth via JWT or .p8 cert; FCM via service account / OAuth.</td></tr>
    <tr><td><em>Visible vs silent?</em></td><td>Visible: shows banner. Silent: <code>content-available:1</code> with no alert; wakes app for background work; OS rate-limited.</td></tr>
    <tr><td><em>How do you ask permission well?</em></td><td>Soft prompt with context after value, only fire OS prompt on soft-yes; never on app launch.</td></tr>
    <tr><td><em>Android channels?</em></td><td>Mandatory on 8+. Group notification types so users can mute granularly.</td></tr>
    <tr><td><em>Token rotation?</em></td><td>Tokens change; listen to <code>onTokenRefresh</code>; always update on launch; prune dead tokens.</td></tr>
    <tr><td><em>Granular categories?</em></td><td>Per-user prefs (messages, promotions) — server-side gate before send.</td></tr>
    <tr><td><em>Quiet hours?</em></td><td>Localized to user's timezone; never send marketing 10pm–8am local.</td></tr>
    <tr><td><em>Throttling?</em></td><td>Per-user max/day for marketing; transactional always allowed.</td></tr>
    <tr><td><em>How do you measure success?</em></td><td>Sent → delivered → displayed → opened → converted; conversion is KPI.</td></tr>
    <tr><td><em>How do you handle iOS Focus?</em></td><td>Use <code>interruption-level: time-sensitive</code> sparingly for genuinely urgent pushes.</td></tr>
    <tr><td><em>Privacy considerations?</em></td><td>Lock-screen previews, GDPR for marketing, ATT for cross-app tracking, no PII in payloads.</td></tr>
  </tbody>
</table>

<h3>Live design prompts</h3>
<ol>
  <li><em>"Design the push system for a chat app."</em>
    <ul>
      <li>One push per message; collapse by thread-id (iOS) / tag (Android).</li>
      <li>Don't push if user is currently in the conversation foreground.</li>
      <li>Service Extension on iOS to fetch sender avatar.</li>
      <li>Reset badge on conversation open.</li>
      <li>Silent push for read-receipts/typing (OS-rate-limited).</li>
      <li>Channel: "messages" (high importance) + "promotions" (low).</li>
    </ul>
  </li>
  <li><em>"Implement a smart re-engagement push."</em>
    <ul>
      <li>Trigger: user inactive 7+ days who has push opt-in.</li>
      <li>Personalized body (recent activity, pending invite, friend's update).</li>
      <li>Quiet hours respected.</li>
      <li>Throttled — max 1 per 7 days per user.</li>
      <li>Suppress if user already has high recent engagement.</li>
      <li>A/B test copy variants; primary metric = D14 retention lift.</li>
    </ul>
  </li>
  <li><em>"How would you debug 'my pushes aren't arriving'?"</em>
    <ul>
      <li>Token: did backend store it? Has it rotated?</li>
      <li>Permission: is it currently granted on the device? Have you confirmed via authorizationStatus?</li>
      <li>Send: did APNs/FCM accept it? Check error response.</li>
      <li>Delivery: APNs feedback service / FCM error response — is the token marked invalid?</li>
      <li>Display: Android channel created? iOS Service Extension crashing? Lock-screen preview off?</li>
      <li>App handler: foreground-only handler missing? notifee channel mismatch?</li>
    </ul>
  </li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>App requests OS permission on first launch — denial cliff; rewrite for soft prompt.</li>
  <li>Push token not refreshed on launch — silently dead after a backup restore.</li>
  <li>No channel created on Android — system drops notifications without warning.</li>
  <li>Server cron at 03:00 UTC — wakes Tokyo at midday, NYC at 11pm. Add timezone awareness.</li>
  <li>Silent push relied on for badge sync — only ~50% delivered; reconcile on foreground.</li>
  <li>Same token for two users on a shared device — last logged-in user wins; explicit logout-deletes-token logic missing.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Permission strategy</td><td>You volunteer "soft prompt first; OS prompt only on yes."</td></tr>
    <tr><td>Lifecycle hygiene</td><td>You delete token on logout; refresh on launch; prune dead tokens server-side.</td></tr>
    <tr><td>Reliability awareness</td><td>You don't trust silent push for state; you reconcile on foreground.</td></tr>
    <tr><td>Privacy</td><td>You discuss lock-screen previews, GDPR consent, no PII in payloads.</td></tr>
    <tr><td>Measurement</td><td>You measure conversion, not opens.</td></tr>
    <tr><td>Throttling</td><td>You volunteer per-user budgets and category prefs.</td></tr>
    <tr><td>Tooling</td><td>You can defend Firebase / OneSignal / Braze choice based on use-case.</td></tr>
  </tbody>
</table>

<h3>Mobile-specific deep questions</h3>
<ul>
  <li><em>"How would you design end-to-end-encrypted push for a messaging app?"</em>
    <ul>
      <li>Server pushes only metadata (conversation id, sender id) + ciphertext.</li>
      <li>Notification Service Extension fetches the encrypted message, decrypts using the device's private key, writes plain text to the displayed payload.</li>
      <li>Fallback if extension fails: generic "New message" with no preview.</li>
    </ul>
  </li>
  <li><em>"How do you ensure the push opt-in survives a "Don't Disturb" toggle?"</em> — Permission status and OS DND are independent. Track both: <code>permission_status</code> and <code>currently_silenced</code>.</li>
  <li><em>"Why might 100k pushes show 100% delivered but only 10% displayed?"</em> — DND, Focus, channel muted, app uninstalled but token not pruned, user mute on the channel.</li>
  <li><em>"How do you handle a user who's logged into iOS + iPad + Android?"</em> — Three tokens for one user; send to all by default; provide "primary device" pref for selective notifications.</li>
  <li><em>"What's a 'time-sensitive' notification?"</em> — iOS 15+ flag that breaks through Focus for high-priority real-time alerts. Misuse damages user trust and can be reported.</li>
</ul>

<h3>"What I'd do day one on the team"</h3>
<ul>
  <li>Audit current opt-in rate (sent vs displayed).</li>
  <li>Verify soft-prompt-then-OS-prompt pattern.</li>
  <li>Inspect token lifecycle: register on launch? Delete on logout? Prune dead?</li>
  <li>Check channel discipline on Android.</li>
  <li>Review quiet hours + throttling in send pipeline.</li>
  <li>Add conversion (not just open) as the success metric.</li>
  <li>Wire a kill switch for outbound campaigns.</li>
  <li>Audit privacy: lock-screen previews, GDPR consent, no PII in payloads.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd add per-user push fatigue scoring and auto-pause campaigns when the score is high."</li>
  <li>"I'd run an A/B on body length, emoji presence, and time-of-send to find the local maxima per region."</li>
  <li>"I'd integrate with the notification service extension to render rich previews for top-priority conversations."</li>
  <li>"I'd add a 'lock-screen privacy' toggle so power users can opt into full content previews."</li>
  <li>"I'd build an in-app inbox so users who turned off pushes don't miss key activity."</li>
</ul>
`
    }
  ]
});
