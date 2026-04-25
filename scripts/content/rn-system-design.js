window.PREP_SITE.registerTopic({
  id: 'rn-system-design',
  module: 'React Native',
  title: 'Mobile System Design',
  estimatedReadTime: '40 min',
  tags: ['react-native', 'system-design', 'mobile', 'architecture', 'offline', 'sync', 'case-study', 'interview'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>A mobile system design interview asks you to design a non-trivial mobile product end-to-end in 45-60 minutes. The 10-step framework from Frontend System Design applies, with <strong>mobile-specific extensions</strong>: offline-first architecture, sync protocols, battery / data constraints, native vs JS thread coordination, app lifecycle, push, and cross-platform tradeoffs.</p>

<p><strong>Mobile-specific axes</strong> beyond the standard framework:</p>
<ul>
  <li><strong>Offline-first</strong> — assume the network can disappear at any time; design for graceful degradation.</li>
  <li><strong>Sync protocol</strong> — how do local changes propagate to server and back? CRDTs, op-logs, last-writer-wins.</li>
  <li><strong>Storage tiers</strong> — memory cache, MMKV, SQLite, file system, server. Pick per data shape.</li>
  <li><strong>Background work</strong> — push notifications, periodic fetch, foreground services. Limited and platform-dependent.</li>
  <li><strong>Threading model</strong> — what runs on JS thread vs UI thread vs native; Reanimated for animations.</li>
  <li><strong>Battery & data</strong> — cellular detection, polling cadence, image quality, background restraint.</li>
  <li><strong>App lifecycle</strong> — cold start, warm resume, backgrounding, kill states.</li>
  <li><strong>Cross-platform</strong> — iOS vs Android differences (push, permissions, file system, UI conventions).</li>
  <li><strong>Build & release</strong> — staged rollout, OTA updates, hotfix strategy.</li>
  <li><strong>Observability</strong> — Sentry crashes, RUM, analytics, A/B framework.</li>
</ul>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Mobile system design = standard frontend system design + offline + sync + lifecycle + battery + cross-platform. A senior answer covers all six, names the storage tier per data type, and shows how the system degrades on bad networks rather than just on perfect networks.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>How mobile system design differs from web</h3>
<table>
  <thead><tr><th></th><th>Web</th><th>Mobile</th></tr></thead>
  <tbody>
    <tr><td>Network</td><td>Mostly available</td><td>Often offline; cellular metered</td></tr>
    <tr><td>Storage</td><td>localStorage, IndexedDB, cookies</td><td>MMKV, SQLite, secure store, file system</td></tr>
    <tr><td>Lifecycle</td><td>Tab open/close</td><td>Cold start, warm resume, background, kill</td></tr>
    <tr><td>Push</td><td>Web Push (limited)</td><td>APNs, FCM (first-class)</td></tr>
    <tr><td>Threading</td><td>Main + workers</td><td>JS, UI, Shadow threads</td></tr>
    <tr><td>Battery</td><td>Not constrained</td><td>OS kills bg apps for battery</td></tr>
    <tr><td>Distribution</td><td>URL, instant deploy</td><td>App Store review, OTA limits</td></tr>
    <tr><td>Update</td><td>Refresh page</td><td>App update or OTA bundle</td></tr>
    <tr><td>Hardware</td><td>Limited (camera, location, etc.)</td><td>Rich (camera, biometrics, sensors)</td></tr>
  </tbody>
</table>

<h3>Why offline-first is the default mental model</h3>
<p>Mobile users are on subways, in tunnels, on flights, with 1 bar of cellular. A "show a spinner if no network" UX is amateur. Instead:</p>
<ul>
  <li>Cache data locally so the app shows content instantly on cold start.</li>
  <li>Queue writes locally; sync when network returns.</li>
  <li>Use optimistic mutations so taps feel instant even on slow networks.</li>
  <li>Indicate sync state (offline banner, "saving…" indicator) so users trust the system.</li>
</ul>

<h3>Why sync protocols matter</h3>
<p>Two devices editing the same record. Or one user editing across the airplane wifi divide. How do you reconcile? Choices:</p>
<ul>
  <li><strong>Last-writer-wins</strong> — simplest, often broken.</li>
  <li><strong>Op-log / event sourcing</strong> — replay logged operations server-side; works for append-mostly data.</li>
  <li><strong>CRDT (Yjs, Automerge)</strong> — automatic conflict resolution; great for collaborative editing, overkill for simple records.</li>
  <li><strong>3-way merge</strong> — track base version, merge local + server.</li>
  <li><strong>Manual reconciliation</strong> — UI shows conflict; user picks.</li>
</ul>

<h3>Why threading explicit matters</h3>
<p>RN's three-thread model is a constant constraint. Heavy work on JS → state lags. Heavy work on UI → animations stutter. Reanimated worklets keep gestures and animations smooth even when JS is busy. Native modules can leak data across thread boundaries. Knowing where work runs is half the design.</p>

<h3>Why mobile system design questions exist</h3>
<p>Companies hiring mobile specialists want senior signal beyond "you can build a screen." They want:</p>
<ul>
  <li>Architecture decisions explicit and justified.</li>
  <li>Sensitivity to platform constraints (battery, storage, app size).</li>
  <li>Understanding of native + JS interplay.</li>
  <li>Production patterns (rollout, observability, hotfix).</li>
  <li>Empathy for the mobile user (offline, slow networks, low-end devices).</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "10 + mobile" framework</h3>
<p>Same 10 steps as Frontend System Design, with mobile-specific lenses applied at each:</p>
<ol>
  <li><strong>Clarify</strong> — functional + non-functional + out-of-scope. Mobile additions: offline behavior, push expectations, supported platforms (iOS / Android / iPad / tablets), accessibility level, supported OS versions.</li>
  <li><strong>Estimate scale</strong> — DAU, concurrent users, data per session. Mobile additions: data per cellular session (separate from wifi), peak push fan-out, average session duration, app-size constraint.</li>
  <li><strong>High-level architecture</strong> — boxes + arrows. Mobile additions: client cache layer, sync layer, push channel, native modules, web/Realtime servers.</li>
  <li><strong>Data model</strong> — entities + relationships + storage tiers. Mobile addition: per-entity storage decision (memory / MMKV / SQLite / server-only).</li>
  <li><strong>API design</strong> — REST / GraphQL / WS. Mobile additions: cursor pagination (mandatory for unstable networks), batch endpoints, sync delta protocol, idempotency keys for mutations.</li>
  <li><strong>Component architecture</strong> — screens + components. Mobile additions: navigation shape (stack / tab / drawer), virtualized lists everywhere (FlashList default), Reanimated for animation, gesture-handler for gestures.</li>
  <li><strong>State management</strong> — Zustand / TanStack Query / MMKV. Mobile additions: persist cache for cold-start hydration, mutation queue for offline.</li>
  <li><strong>Performance</strong> — startup, render, scroll, memory. Mobile additions: Hermes + new arch, FlashList, expo-image, Reanimated, sub-1s cold start target.</li>
  <li><strong>Edge cases</strong> — offline, errors, a11y, i18n, lifecycle, low-end devices, low storage, bad clock, ATS, push throttling, OS killing background.</li>
  <li><strong>Deep dive</strong> — interviewer picks a sub-system. Mobile favorites: offline sync, push handling, real-time, photo upload pipeline.</li>
</ol>

<h3>The "storage tier" picture</h3>
<div class="diagram">
<pre>
  Memory (Zustand / React Query)         ← active screens, hot data
       │
       ▼
  MMKV (sync, JSI, sub-ms)              ← settings, tokens, small caches
       │
       ▼
  SQLite (queryable, &gt;1k rows)          ← messages, posts, contacts, structured app data
       │
       ▼
  File system (binary blobs)            ← photos, videos, downloads
       │
       ▼
  Server                                  ← source of truth, backup
</pre>
</div>

<h3>The "offline sync" picture</h3>
<div class="diagram">
<pre>
  User taps action
       │
       ▼
  Optimistic UI update (memory + persistent cache)
       │
       ▼
  Mutation queued in SQLite / MMKV with idempotency key
       │
       ├─ if online ─► POST to server ─► success → mark synced
       │                                fail (4xx) → rollback + show error
       │                                fail (5xx / net) → retry with backoff
       │
       └─ if offline ─► sit in queue, banner shows "X pending"
                          │
                          ▼
                       network returns ─► drain queue in order
                          │
                          ▼
                       resolve conflicts (server returns canonical state)</pre>
</div>

<h3>The "lifecycle" picture</h3>
<div class="diagram">
<pre>
 [killed] ──launch──► [active] ──user backgrounds──► [background]
                        │           │                    │
                        │           │                    └──OS kills──► [killed]
                        │           │
                        │           └──phone call──► [inactive]
                        │
                        └─── crash → [killed] ──user re-launch──► [active]

  Cold start: from killed
  Warm resume: from background → active
  State recovery: read MMKV / SQLite to reconstruct last state</pre>
</div>

<h3>The "real-time" picture (mobile-specific)</h3>
<div class="diagram">
<pre>
  Foreground: WebSocket / SSE for live updates
  Backgrounded: WS suspends; OS blocks long-running connections
       │
       ▼
  Use Push (silent or visible) to wake the app or notify user
       │
       ▼
  Foreground returns: re-establish WS, fetch delta since last seen</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"WebSocket connections persist while app is backgrounded." They don't reliably. iOS / Android suspend most network sockets within seconds of backgrounding. Real-time on mobile requires a hybrid: WS in foreground, push in background, re-sync on resume.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Step 1 — Clarify (mobile-specific additions)</h3>
<pre><code>FUNCTIONAL
- (standard product features)

NON-FUNCTIONAL — mobile additions
- Platforms: iOS + Android. Tablets / iPad? Wear / TV?
- Min OS versions (iOS 15+, Android 9+ typical).
- Offline behavior: read cached, queue writes, full disconnect tolerance?
- Push notifications: silent updates, visible notifications, both?
- Background tasks (location tracking, periodic sync)?
- App size budget (e.g., &lt; 80 MB).
- Cold-start time target (&lt; 2s on mid-range Android typical).
- Battery: any background CPU constraints?
- Data: respect cellular vs wifi (defer downloads, lower image quality)?
- Accessibility (VoiceOver, TalkBack, dynamic type).
- Internationalization, RTL support.

OUT OF SCOPE
- Backend implementation details (note the API shape, not implementation).
- Deep ML / AI features unless central to the product.</code></pre>

<h3>Step 2 — Estimate Scale</h3>
<pre><code>DAU:                      [N] million
Concurrent peak:          [M]
Sessions per user / day:  [k]
Avg session duration:     [s] seconds
Data downloaded / session: [d] MB (split wifi / cellular)
Push messages / user / day:[p]
Records on device after a year of use: [r]
Storage budget per user device: [g] GB
Offline window expected to handle: [o] hours / days</code></pre>

<h3>Step 3 — High-Level Architecture (mobile shape)</h3>
<pre><code>┌──────────────────────────────────────┐
│           Mobile Client              │
│  ┌──────────────────────────────┐    │
│  │ React Native (Hermes + Fabric)│    │
│  │ ┌──────────┐ ┌─────────────┐ │    │
│  │ │ React    │ │ Zustand /   │ │    │
│  │ │ trees    │ │ TanStack Q  │ │    │
│  │ └──────────┘ └─────────────┘ │    │
│  │ ┌──────────────────────────┐ │    │
│  │ │ JSI                       │ │    │
│  │ └──────────────────────────┘ │    │
│  └──────────────────────────────┘    │
│  ┌──────────────────────────────┐    │
│  │ Native Modules (TurboModules)│    │
│  │ - MMKV      - Camera          │    │
│  │ - Reanimated- Location        │    │
│  │ - SQLite    - Push (FCM/APNs) │    │
│  └──────────────────────────────┘    │
│  ┌──────────────────────────────┐    │
│  │ Storage                       │    │
│  │ - MMKV (kv)  - SQLite         │    │
│  │ - File system - SecureStore   │    │
│  └──────────────────────────────┘    │
└────────────┬─────────────────────────┘
             │
             ├── HTTPS REST / GraphQL ─► API gateway → services → DB
             ├── WebSocket / SSE ──────► Realtime hub
             ├── Object storage ───────► CDN (images, videos)
             └── Push channel
                 ├── APNs (iOS)
                 └── FCM (Android)</code></pre>

<h3>Step 4 — Data Model + Storage Tiers</h3>
<p>For each entity, decide: where does it live?</p>
<table>
  <thead><tr><th>Data</th><th>Storage tier</th><th>Why</th></tr></thead>
  <tbody>
    <tr><td>Auth token / refresh</td><td>SecureStore</td><td>Sensitive, hardware-backed</td></tr>
    <tr><td>User settings (theme, locale)</td><td>MMKV</td><td>Small, sync read on every screen</td></tr>
    <tr><td>Feed page data</td><td>TanStack Query + MMKV persist</td><td>Cold-start instant restore + revalidate</td></tr>
    <tr><td>Messages (10K+)</td><td>SQLite</td><td>Indexed query, append-mostly</td></tr>
    <tr><td>Photos / videos</td><td>File system + URL pointer in SQLite</td><td>Large blobs, separate management</td></tr>
    <tr><td>Pending mutations</td><td>SQLite or MMKV-keyed JSON</td><td>Survives restart, ordered</td></tr>
    <tr><td>Active screen state</td><td>Zustand / useState</td><td>Volatile, fast reads</td></tr>
  </tbody>
</table>

<h3>Step 5 — API Design (mobile-aware)</h3>
<ul>
  <li><strong>Cursor pagination</strong>, not offset (stable on inserts; networks drop responses, retry-safe).</li>
  <li><strong>Batch endpoints</strong> when possible (one round-trip vs many on mobile networks).</li>
  <li><strong>Idempotency keys</strong> on every mutation (client retries on flaky networks).</li>
  <li><strong>ETags / If-None-Match</strong> for conditional fetch — saves bytes on revalidate.</li>
  <li><strong>Sync delta endpoint</strong>: <code>GET /sync?since=cursor</code> returns events since the cursor.</li>
  <li><strong>Compressed payloads</strong> (Brotli / gzip).</li>
  <li><strong>Image variants</strong>: serve appropriate size per device DPR.</li>
  <li><strong>WebSocket</strong> protocol: heartbeat, reconnect, backfill via cursor.</li>
</ul>

<h3>Step 6 — Component & Navigation</h3>
<pre><code>App Root
 ├── &lt;SafeAreaProvider&gt;
 ├── &lt;QueryClientProvider&gt;
 ├── &lt;NavigationContainer linking={...}&gt;
 │   ├── Auth Stack (if unauth)
 │   └── Main Tabs (if auth)
 │       ├── Home tab → Stack
 │       ├── Search tab → Stack
 │       └── Profile tab → Stack
 ├── &lt;ErrorBoundary&gt;
 └── Modal screens (compose, image viewer)

Each screen:
 ├── Header (with insets)
 ├── Body (FlashList for long content)
 └── Composer / FAB / footer

Cross-cutting:
 - Toaster
 - Network banner (offline)
 - Loading states everywhere
 - Theme + i18n providers</code></pre>

<h3>Step 7 — State Management (the four kinds)</h3>
<ul>
  <li><strong>Server state</strong> (TanStack Query): feed, messages, profile data. Persisted to MMKV.</li>
  <li><strong>Client state</strong> (Zustand): selected tab, current filter, modal open, cart.</li>
  <li><strong>Persistent state</strong> (MMKV / SQLite / SecureStore): tokens, settings, drafts, message history, pending mutations.</li>
  <li><strong>URL state</strong> (Navigation params): current screen + params, deep-link entry points.</li>
</ul>

<h3>Step 8 — Performance Plan</h3>
<ul>
  <li>Hermes + new arch enabled.</li>
  <li>FlashList for any list &gt; 30 items.</li>
  <li>Reanimated for animations and gesture-driven UIs.</li>
  <li>expo-image with cache + placeholders.</li>
  <li>MMKV for sync settings reads.</li>
  <li>inlineRequires + lazy route imports for startup.</li>
  <li>Image CDN with on-the-fly resize + WebP/AVIF.</li>
  <li>Memoize hot components; profile to confirm wins.</li>
  <li>Target: cold start &lt; 2s mid-Android, p75 INP &lt; 200ms, 60fps scroll.</li>
</ul>

<h3>Step 9 — Edge Cases (mobile-specific list)</h3>
<ul>
  <li><strong>Offline</strong>: cache reads, queue writes, banner, retry.</li>
  <li><strong>Bad clock</strong>: device time drift; never trust client time for ordering — server timestamps with sequence numbers.</li>
  <li><strong>Low storage</strong>: cap caches; let user clear.</li>
  <li><strong>Tab killed by OS</strong>: state restoration on cold start.</li>
  <li><strong>Push token churn</strong>: re-register on refresh.</li>
  <li><strong>App version mismatch</strong>: server returns "upgrade required" status.</li>
  <li><strong>Cellular vs wifi</strong>: defer big downloads on cellular.</li>
  <li><strong>OS upgrade breaking change</strong>: capability check + graceful fallback.</li>
  <li><strong>Permission revoked</strong>: re-check on foreground.</li>
  <li><strong>Slow network</strong>: skeleton screens, paginated load, loading priority.</li>
  <li><strong>Accessibility</strong>: a11y roles, labels, focus, dynamic type, color contrast.</li>
  <li><strong>i18n / RTL</strong>: logical CSS, locale-aware formatting.</li>
  <li><strong>Different screen sizes</strong>: phone, tablet, foldable.</li>
  <li><strong>Locale-specific behavior</strong>: 24h clock, week starts.</li>
  <li><strong>Battery</strong>: pause heavy work on low battery.</li>
</ul>

<h3>Step 10 — Deep Dive (interviewer-driven)</h3>
<p>Common probes specific to mobile:</p>
<ul>
  <li>"How does the app behave on a 3G connection that drops mid-action?"</li>
  <li>"Walk me through cold start to first screen render."</li>
  <li>"How do messages stay in sync across reconnect?"</li>
  <li>"How do you ensure the photo upload finishes if the user backgrounds the app?"</li>
  <li>"Design the location-tracking mode; how do you avoid draining the battery?"</li>
  <li>"What happens when push delivery is lost?"</li>
  <li>"How do you validate the new architecture migration didn't break anything?"</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Worked Case Studies', html: `
<h3>Case 1 — Mobile chat app (WhatsApp-class)</h3>

<h4>Clarify</h4>
<pre><code>FUNCTIONAL
- 1:1 + group chats, text + media
- Real-time delivery + typing + presence
- Read receipts
- Offline send queue
- Push notifications

NON-FUNCTIONAL
- Latency &lt; 200ms (foreground, online)
- Offline messages queue + replay
- Cross-platform iOS + Android
- 100M+ users, ~20M concurrent

OUT
- Voice / video calls, end-to-end encryption details (assume Signal protocol layer)</code></pre>

<h4>Architecture</h4>
<pre><code>Mobile Client
  - Native: APNs/FCM token registration
  - JS: Zustand (UI), React Query (conversations metadata)
  - SQLite (messages history, indexed by convId, time)
  - WebSocket connection (foreground only)
  - Push (background)

Backend (sketch — not the focus)
  - Realtime hub (long-lived WS)
  - Message store (sharded by convId)
  - Push gateway (APNs / FCM)
  - Object storage for media</code></pre>

<h4>Data tiers</h4>
<table>
  <tbody>
    <tr><td>Auth tokens</td><td>SecureStore</td></tr>
    <tr><td>Settings, last-seen</td><td>MMKV</td></tr>
    <tr><td>Conversations metadata</td><td>TanStack Query + MMKV persist</td></tr>
    <tr><td>Messages</td><td>SQLite (indexed)</td></tr>
    <tr><td>Media (images)</td><td>File system, path in SQLite</td></tr>
    <tr><td>Pending sends</td><td>SQLite, ordered by clientId</td></tr>
  </tbody>
</table>

<h4>Sync protocol</h4>
<ol>
  <li>Each client maintains <code>lastSeq</code> per conversation.</li>
  <li>Foreground: WebSocket pushes new messages. Client appends to SQLite, updates UI via reactive query.</li>
  <li>Background: server sends silent push with conv id. Foreground on resume → request <code>GET /messages?convId=X&amp;since=lastSeq</code>.</li>
  <li>Send: client assigns <code>clientId</code> uuid, writes to SQLite as <code>status=pending</code>, posts to server. Server returns canonical id + sequence.</li>
  <li>Idempotency: server keyed on <code>clientId</code>; resending the same message dedupes.</li>
  <li>Order: messages sorted by <code>(serverTimestamp, sequence)</code>.</li>
</ol>

<h4>Offline</h4>
<ul>
  <li>Read history works fully offline (SQLite).</li>
  <li>Send queues into SQLite with <code>status=pending</code>; UI shows clock icon.</li>
  <li>NetInfo + onlineManager detects online → drain queue in order.</li>
  <li>Server confirms → status=sent → checkmark.</li>
  <li>Read receipts batched; mark on tab focus.</li>
</ul>

<h4>Performance</h4>
<ul>
  <li>FlashList for messages; 10K msgs OK.</li>
  <li>Memoized MessageBubble.</li>
  <li>Reanimated for keyboard slide + send animation.</li>
  <li>Image attachments: thumbnail + on-tap full.</li>
</ul>

<h4>Edge cases</h4>
<ul>
  <li>Server clock skew: trust server timestamps + sequence; never client time.</li>
  <li>Reconnect WS: exponential backoff; on success, request delta.</li>
  <li>Push lost: on resume, always re-fetch since lastSeq.</li>
  <li>Group with 1000 members: typing indicator switches to "several typing"; presence sampled, not per-user broadcast.</li>
  <li>OS killing background: state restored from SQLite + secure store on launch.</li>
</ul>

<h4>Deep dive prompt: "Implement reliable message delivery"</h4>
<ol>
  <li>Client generates <code>clientId = uuid()</code>; persists message in SQLite as pending.</li>
  <li>Send via WS or HTTP. Server stores with <code>(clientId, serverTimestamp, seq)</code>.</li>
  <li>Server broadcasts to other recipients.</li>
  <li>Server ACKs to sender → client updates row to <code>sent</code>.</li>
  <li>If sender's connection drops mid-send: on reconnect, client requests "tell me what happened to my pending messages" — server responds based on clientId lookup. Sent or not.</li>
  <li>Recipient ACK (delivered) and read marks bubble back via WS / push.</li>
</ol>

<h3>Case 2 — Feed app (Instagram / Twitter-class)</h3>

<h4>Clarify</h4>
<pre><code>FUNCTIONAL
- Home feed of posts (image / video)
- Like, comment, share
- Live updates (new posts arriving)
- Profile, follow, unfollow
- Push for engagement

NON-FUNCTIONAL
- LCP &lt; 2s on 4G
- Smooth 60fps scroll (FlashList)
- Offline: cached feed, optimistic engagement
- Cellular-aware: defer videos, smaller images</code></pre>

<h4>Storage tiers</h4>
<table>
  <tbody>
    <tr><td>Tokens</td><td>SecureStore</td></tr>
    <tr><td>Settings + last seen feed cursor</td><td>MMKV</td></tr>
    <tr><td>Feed cache</td><td>TanStack Query + MMKV persist (last 100 posts)</td></tr>
    <tr><td>Cached images / videos</td><td>expo-image disk cache + dedicated FS</td></tr>
    <tr><td>Pending engagements (likes, follows)</td><td>SQLite-backed mutation queue</td></tr>
  </tbody>
</table>

<h4>Architecture details</h4>
<ul>
  <li>FlashList with infinite query, cursor pagination.</li>
  <li>Reanimated for scroll-driven header, parallax, like-button animation.</li>
  <li>Gesture handler for swipe-to-like, double-tap to like.</li>
  <li>WebSocket / Push for new posts: when arriving, prepend to a "5 new posts" pill (don't auto-scroll).</li>
  <li>Optimistic likes: bump count locally, queue mutation, rollback on error.</li>
  <li>Video pre-buffer for next item only; pause on scroll out.</li>
  <li>Network-aware quality: cellular → 720p; wifi → 1080p.</li>
</ul>

<h4>Edge case: cellular</h4>
<p>NetInfo's <code>type === 'cellular'</code> + <code>effectiveType</code>. On cellular, autoplay videos muted, lower image quality, defer prefetching. User can override.</p>

<h4>Deep dive prompt: "How does feed stay current?"</h4>
<ol>
  <li>App opens → render last cached feed instantly from MMKV-persisted React Query cache.</li>
  <li>Background refetch on focus (TanStack focusManager); merge new posts.</li>
  <li>WebSocket for new-post events while foreground: append to <code>newPending</code> list.</li>
  <li>"X new posts" pill; tap to merge + scroll up.</li>
  <li>Push notifications for off-app new content; deep-link routes to specific post.</li>
  <li>Pull-to-refresh: invalidate top of feed cursor, fetch fresh.</li>
</ol>

<h3>Case 3 — Photo upload (Instagram-class)</h3>

<h4>Clarify</h4>
<pre><code>FUNCTIONAL
- Pick image / video, crop, filter
- Upload with progress + retry
- Background upload (continues if user navigates away)
- Resume on reconnect

NON-FUNCTIONAL
- Files up to 100MB
- Resilient to network changes mid-upload
- Privacy: strip EXIF GPS</code></pre>

<h4>Architecture</h4>
<pre><code>Pick → Crop → Compress (Worker) → Chunked upload (presigned URL) → Server completes
                                            │
                                            └─► IDB / SQLite-backed queue persists across restarts
                                            └─► Background fetch / SW continues on minimize</code></pre>

<h4>Pipeline details</h4>
<ol>
  <li>ImagePicker → original URI.</li>
  <li>Editor uses Skia / Canvas for filters + crop.</li>
  <li>Compress to target resolution (e.g., 1920px wide, 80% JPEG / WebP). Off main thread (Worker / native module).</li>
  <li>Strip EXIF GPS for privacy.</li>
  <li>POST <code>/upload/initiate</code> → server returns presigned URL, chunkSize, uploadId.</li>
  <li>Slice file via <code>Blob.slice</code>. Upload chunks in parallel (3 in-flight).</li>
  <li>Track <code>chunksDone</code> in SQLite. On retry, resume from next missing.</li>
  <li>Complete → server returns mediaId.</li>
  <li>POST <code>/post</code> with mediaId.</li>
</ol>

<h4>Background upload</h4>
<p>iOS: <code>URLSession</code> background config — system continues upload even after app terminates. Android: WorkManager with <code>foreground service</code> + persistent notification. Library: <code>react-native-background-upload</code> wraps both.</p>

<h4>Edge cases</h4>
<ul>
  <li>User force-closes app: queue persists; on next launch, offer to resume.</li>
  <li>File too large: client-side check; offer trim/compress.</li>
  <li>Network changes wifi → cellular: continue OK; user can pause.</li>
  <li>Server rejects (file type, virus): show error, remove from queue.</li>
</ul>

<h3>Case 4 — Ride-share / Maps (Uber-class)</h3>

<h4>Clarify</h4>
<pre><code>FUNCTIONAL
- Show user location + nearby drivers on map
- Request ride, track driver, ETA
- Receipt + history

NON-FUNCTIONAL
- Realtime driver location (1-2 sec update)
- Smooth map pan/zoom
- Battery — 4-hour ride should not drain phone
- Background location for active rides</code></pre>

<h4>Architecture</h4>
<ul>
  <li>Native MapView (<code>react-native-maps</code> or <code>@maplibre/maplibre-react-native</code>).</li>
  <li>WebSocket for driver position updates (foreground).</li>
  <li>Background location API for active ride (with notification).</li>
  <li>SQLite for ride history, settings.</li>
  <li>Push for "driver arrived," "trip completed."</li>
</ul>

<h4>Battery optimization</h4>
<ul>
  <li>Driver location updates throttled (1 update / sec foreground; 1 / 5sec background).</li>
  <li>Ride end → drop background tracking.</li>
  <li>Offer power-save mode (lower update rate).</li>
  <li>Use significant-location-change API on iOS instead of continuous when possible.</li>
</ul>

<h4>Edge cases</h4>
<ul>
  <li>Driver offline: last known position + "reconnecting" indicator.</li>
  <li>User offline: cached map tiles + last known driver pos; warn on action requiring network.</li>
  <li>GPS inaccurate (urban canyon): fuse with cell-tower / wifi positioning; show accuracy radius.</li>
  <li>iOS background fetch limit: rely on push for state changes when fully backgrounded.</li>
</ul>

<h3>Case 5 — Music player (Spotify-class)</h3>

<h4>Clarify</h4>
<pre><code>FUNCTIONAL
- Stream music
- Playlists, library
- Offline / downloaded tracks
- Background playback
- Audio focus (interrupt for calls, lower for nav prompts)

NON-FUNCTIONAL
- Continuous playback through screen lock, app backgrounding
- 4G + flaky network resilience (gapless skip, prebuffer)
- Battery efficient
- 100K-track library; instant search</code></pre>

<h4>Architecture</h4>
<ul>
  <li>Native audio player (TrackPlayer or react-native-track-player) — runs in service / foreground notification on Android, audio session on iOS.</li>
  <li>SQLite for library + downloads index.</li>
  <li>FS for downloaded files; encrypted to enforce DRM.</li>
  <li>Network-aware: high quality on wifi, lower on cellular by default.</li>
  <li>Prebuffer next track; gapless playback.</li>
</ul>

<h4>Background</h4>
<p>iOS: AVAudioSession with category <code>playback</code> + Info.plist <code>UIBackgroundModes: audio</code>. Android: foreground service with media notification (otherwise OS kills).</p>

<h4>Offline downloads</h4>
<p>User picks "Download playlist." Tracks queue in download manager; chunked, resumable, persistent. Each track encrypted with key tied to user. SQLite tracks <code>downloaded</code> state per track. On launch offline, library shows downloaded subset.</p>

<h4>Edge cases</h4>
<ul>
  <li>Network interrupt mid-stream: buffer drains; show paused; auto-resume on reconnect.</li>
  <li>Phone call: pause; resume on call end (audio focus).</li>
  <li>Lock screen controls: native MediaSession integration.</li>
  <li>DRM token expired: re-fetch on next play; if user is offline, show "license expired" UI.</li>
</ul>

<h3>Case 6 — Banking app (security-first)</h3>

<h4>Clarify</h4>
<pre><code>FUNCTIONAL
- View accounts, balances, transactions
- Transfer money, pay bills
- Biometric auth + passcode

NON-FUNCTIONAL
- Strong security: certificate pinning, jailbreak detection, no screenshot of sensitive screens
- Offline: read cached, NO writes (transactions need server confirmation)
- Compliance (SOC2, PCI-DSS-light)</code></pre>

<h4>Architecture differences</h4>
<ul>
  <li>SecureStore for auth tokens (hardware-backed).</li>
  <li>Biometric gating on app open after timeout (e.g., 1 min away → re-auth).</li>
  <li>Certificate pinning (TrustKit on iOS, OkHttp on Android) — prevents MITM.</li>
  <li>Jailbreak / root detection — refuse to run sensitive features (or reduce functionality).</li>
  <li>App backgrounded → blur the screen (privacy).</li>
  <li>Disable screenshots on Android (<code>FLAG_SECURE</code>).</li>
  <li>No optimistic mutations — every transfer awaits server confirmation.</li>
  <li>Mandatory MFA for sensitive actions.</li>
  <li>Detailed audit logs (server-side; client just reports actions).</li>
</ul>

<h4>Offline</h4>
<p>Read-only: balances + recent transactions cached encrypted. No writes offline (transfers require live confirmation).</p>

<h4>Edge cases</h4>
<ul>
  <li>SIM swap detection: 2FA via push + email.</li>
  <li>Suspicious activity: lockout, contact support.</li>
  <li>App version forced upgrade: server returns 426 Upgrade Required → blocking screen.</li>
  <li>Low battery + sensitive operation: warn, allow.</li>
  <li>Localization: currency, locale-specific decimal separators (€1.234,56 vs $1,234.56).</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. Cold-start state restoration</h3>
<p>Map every piece of UI state to a storage tier. On launch, hydrate from MMKV / SQLite before rendering — users see last state immediately, then async revalidation.</p>

<h3>2. Server returns "upgrade required"</h3>
<p>Add a status code (e.g., 426) or response header. Client detects, blocks app, shows store link. Critical for security or breaking-change deployments.</p>

<h3>3. Push delivery is unreliable</h3>
<p>iOS APNs and FCM both have varying delivery rates (network, OEM battery optimizations). Don't assume push fired = user notified. Always re-sync on app open.</p>

<h3>4. Timezone drift</h3>
<p>Device clock can be wrong. Use server time for ordering, comparisons, expirations. Display dates in user's locale.</p>

<h3>5. App size budget</h3>
<p>App Store / Play measure download size. RN apps add 30-50MB beyond your code. Audit dependencies; use <code>--analyze</code>; prefer libraries with smaller native footprints.</p>

<h3>6. Low storage warnings</h3>
<p>Listen for low storage events; suggest user clear caches. Cap caches to a fraction of available space.</p>

<h3>7. Token refresh race</h3>
<p>Multiple in-flight requests on expired token → all retry concurrently. Lock around refresh: only one refresh in-flight, others queue and resume.</p>

<h3>8. Push token rotation</h3>
<p>Token can change. Listen to <code>onTokenRefresh</code> and update server. Also re-register on app version upgrade if FCM SDK changed.</p>

<h3>9. Keyboard occluding inputs</h3>
<p>react-native-keyboard-controller / KeyboardAvoidingView with platform-specific config. Test for screen sizes.</p>

<h3>10. Cross-platform divergence</h3>
<p>Some features iOS-only (Live Activities, Dynamic Island), Android-only (notification channels, foreground services). Spec what platforms each feature targets.</p>

<h3>11. Background WS disconnects silently</h3>
<p>iOS / Android suspend WS in background. On resume, always re-establish + delta-fetch.</p>

<h3>12. App killed for memory pressure</h3>
<p>iOS jetsam, Android OOM killer. Backgrounded apps get killed. State must be persisted; relaunch must restore (not just splash).</p>

<h3>13. Network type changes mid-flight</h3>
<p>Wifi → cellular during a download. NetInfo events. Continue or pause? Configurable per-product.</p>

<h3>14. Permission revoked between sessions</h3>
<p>User toggled in Settings. App opens with cached data → tries to use API → fails. Re-check on foreground.</p>

<h3>15. Device locale changed</h3>
<p>iOS supports per-app language; Android system-wide. App should re-render with new strings on locale change event.</p>

<h3>16. Accessibility: VoiceOver mode</h3>
<p>Some gestures conflict with VoiceOver gestures (swipe). Provide keyboard / standard interaction equivalents.</p>

<h3>17. Foldable devices</h3>
<p>Layout changes mid-session. Use useWindowDimensions to react. Test on Galaxy Fold simulators / Pixel Fold devices.</p>

<h3>18. Tablet mode</h3>
<p>iPad layouts often master-detail (NavigationContainer with multi-column). Plan for landscape + larger viewport.</p>

<h3>19. Low-end device (entry-level Android)</h3>
<p>1-2GB RAM. Slower CPU. Choose libraries that work there. Test on a real Pixel 3a or Galaxy A12.</p>

<h3>20. Date / time / language oddities</h3>
<p>Right-to-left languages reverse layout direction. Some calendars (Hijri, Buddhist) shift dates. <code>Intl.DateTimeFormat</code> with explicit locale + calendar.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — designing for "happy path" only</h3>
<p>Senior signal: cover offline, errors, lifecycle, low-end. Junior answers focus on perfect-network use cases.</p>

<h3>Anti-pattern 2 — assuming WS works in background</h3>
<p>It doesn't reliably. Plan a hybrid: WS in foreground + push for background.</p>

<h3>Anti-pattern 3 — designing one storage layer</h3>
<p>"We'll use SQLite for everything." For a 10-byte boolean preference, that's overkill; for binary blobs, that's wrong. Decompose by data shape.</p>

<h3>Anti-pattern 4 — same architecture as web</h3>
<p>Mobile has constraints web doesn't. A pattern of "fetch on every screen mount" works on web; tanks battery on mobile.</p>

<h3>Anti-pattern 5 — ignoring native-thread coordination</h3>
<p>Reanimated and native modules require careful threading. "Just use useState for the gesture position" → janky 30fps gesture.</p>

<h3>Anti-pattern 6 — no offline UX</h3>
<p>App shows blank or error when offline. Cache + queue + banner is the minimum bar.</p>

<h3>Anti-pattern 7 — over-using push</h3>
<p>Spammy notifications get muted by users. Push budget per user (1-3/day max for non-critical).</p>

<h3>Anti-pattern 8 — designing for one OS</h3>
<p>iOS-only assumption → broken on Android. Or vice-versa. Always state "iOS does X, Android does Y, cross-platform we…" .</p>

<h3>Anti-pattern 9 — no observability plan</h3>
<p>Sentry + RUM + analytics + feature flags. Mobile bugs are mostly invisible without telemetry.</p>

<h3>Anti-pattern 10 — heavy work on JS thread</h3>
<p>JSON.parse 5MB on JS = visible freeze. Workers, native modules, or chunk + yield.</p>

<h3>Anti-pattern 11 — ignoring app size</h3>
<p>Shipping a 200MB app for a chat client. Users uninstall on storage pressure. Audit.</p>

<h3>Anti-pattern 12 — mid-interview scope creep</h3>
<p>Trying to cover every feature when interviewer asks "design X." Scope down explicitly: "I'll focus on the main flow; skipping Y, Z. Adjust if you'd rather."</p>

<h3>Anti-pattern 13 — no security thought</h3>
<p>Tokens in MMKV, no biometric gating, no certificate pinning. Banking / health apps need explicit security plan.</p>

<h3>Anti-pattern 14 — assuming permissions granted</h3>
<p>Camera, location, notifications all opt-in. Plan UI for denied states; offer rationale + Settings link.</p>

<h3>Anti-pattern 15 — no rollout / hotfix story</h3>
<p>Senior question: "How do you respond if we ship a bug to 100% of users?" Have an answer: staged rollout, OTA hotfix for JS, feature flag, kill switch.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. How would you approach a mobile system design interview?</div>
  <div class="qa-answer">
    <p>Same 10-step framework as frontend system design with mobile lenses applied:</p>
    <ol>
      <li>Clarify (incl. platforms, offline behavior, push, accessibility, OS versions).</li>
      <li>Estimate scale (DAU, concurrency, data per session, storage budget).</li>
      <li>Sketch architecture (mobile client + sync + push + native modules).</li>
      <li>Data model — pick storage tier per entity.</li>
      <li>API design — cursor pagination, idempotency keys, sync delta.</li>
      <li>Components + navigation (stacks/tabs, FlashList, Reanimated).</li>
      <li>State management (Zustand / TanStack Query / MMKV / SQLite).</li>
      <li>Performance plan (Hermes, FlashList, Reanimated, &lt;2s cold start).</li>
      <li>Edge cases (offline, lifecycle, low-end, errors, a11y, i18n).</li>
      <li>Deep dive — usually offline sync, real-time, or photo upload.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Design an offline-capable chat app.</div>
  <div class="qa-answer">
    <p>Storage: SQLite for messages indexed by convId, MMKV for settings, SecureStore for tokens. Realtime: WebSocket in foreground; push silent for background wake. Send: assign clientId UUID, write SQLite as <code>pending</code>, POST. Server returns canonical id+seq. Idempotency on clientId. Order by (serverTimestamp, seq). Reconnect → request <code>since=lastSeq</code> delta. Optimistic UI for sends. Read receipts batched on focus.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. How do you handle real-time updates on mobile?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Foreground</strong>: WebSocket or SSE with heartbeat + auto-reconnect.</li>
      <li><strong>Background</strong>: WS suspends; rely on push (silent or visible).</li>
      <li><strong>Resume</strong>: re-establish WS + request delta from last-known cursor.</li>
      <li><strong>Reconnect logic</strong>: exponential backoff with jitter; cap retries; show offline banner.</li>
      <li><strong>Token refresh</strong>: handle WS auth expiry; re-auth + reconnect.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Where would you store: user settings, auth token, message history, photos, pending mutations?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>User settings</strong>: MMKV (sync, fast, key-value).</li>
      <li><strong>Auth token</strong>: SecureStore (hardware-backed, encrypted).</li>
      <li><strong>Message history</strong>: SQLite (indexed query, &gt;1k records).</li>
      <li><strong>Photos</strong>: file system, path stored in SQLite.</li>
      <li><strong>Pending mutations</strong>: SQLite or MMKV-keyed JSON, ordered by timestamp + idempotency key.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Walk through cold-start to first screen.</div>
  <div class="qa-answer">
    <ol>
      <li>OS launches process; native splash shown.</li>
      <li>RN runtime initializes — JS VM (Hermes) loaded; bundled bytecode parsed.</li>
      <li>App.tsx mounts; Zustand stores rehydrate from MMKV (sync, sub-ms).</li>
      <li>SecureStore reads auth token (sync via JSI).</li>
      <li>Navigation determines: Auth or Main stack.</li>
      <li>First screen renders with cached data from TanStack Query persist.</li>
      <li>Behind the scenes: revalidate cache; WebSocket connects; native splash dismisses.</li>
      <li>Target: &lt; 2s on mid-range Android. Lazy-load anything not on critical path.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How do you handle a 100MB photo upload in the background?</div>
  <div class="qa-answer">
    <ol>
      <li>Compress client-side (Worker / native module) — typically 10× reduction.</li>
      <li>Strip EXIF GPS for privacy.</li>
      <li>Multipart / chunked upload via presigned URLs from server.</li>
      <li>Track chunks in SQLite — resume from missing on reconnect.</li>
      <li>iOS: <code>URLSession</code> background config — system continues even if app suspended.</li>
      <li>Android: WorkManager + foreground service with notification.</li>
      <li>Library: react-native-background-upload wraps both.</li>
      <li>Show progress in UI; offer pause / resume / cancel.</li>
      <li>On complete: server returns mediaId; create the post with reference.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. The interviewer asks "your app is on a 3G connection that drops mid-action. How does it behave?" Walk through.</div>
  <div class="qa-answer">
    <ol>
      <li>Action triggers optimistic update in memory + persistent cache.</li>
      <li>Mutation written to local queue (SQLite) with idempotency key.</li>
      <li>Network disconnect → request fails. Mutation stays in queue.</li>
      <li>UI shows pending state ("sending…") and offline banner.</li>
      <li>NetInfo observes reconnect → mutation queue drains in order.</li>
      <li>Each mutation includes its idempotency key; server dedupes.</li>
      <li>On success → mark mutation as synced; UI updates to confirmed.</li>
      <li>On 4xx error (validation) → rollback optimistic, surface error.</li>
      <li>On 5xx / network error → exponential backoff retry up to N times.</li>
      <li>For media uploads: chunks resume from last-uploaded chunk via stored state.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How do you minimize battery drain in a location-tracking app?</div>
  <div class="qa-answer">
    <ul>
      <li>Foreground-only by default (<code>WhenInUse</code>).</li>
      <li>For active tracking (during a ride), use <code>Always</code> with explicit user opt-in.</li>
      <li>Throttle update rate based on activity (running fast = more frequent; stationary = less).</li>
      <li>Use significant-location-change API on iOS for "did the user move significantly" rather than continuous fine-grained.</li>
      <li>Batch updates server-side instead of per-tick POSTs.</li>
      <li>Stop tracking when ride ends — explicit cleanup.</li>
      <li>Show user a battery indicator / notification — they should know what's running.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. How do you sync data across devices for the same user?</div>
  <div class="qa-answer">
    <p>Server is source of truth. Each device:</p>
    <ol>
      <li>Maintains a <code>lastSyncCursor</code> per data type.</li>
      <li>On focus / WS event, request <code>GET /sync/posts?since=cursor</code> → returns delta + new cursor.</li>
      <li>Merge into local store; SQLite for queryable, TanStack Query cache for read-mostly.</li>
      <li>Mutations: assign client UUID, send to server, server broadcasts to other devices via push / WS.</li>
      <li>Conflict resolution: usually last-writer-wins with server timestamp; for collaborative editing, CRDT.</li>
      <li>Each device's local view eventually converges to server state.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Design a music player that survives backgrounding.</div>
  <div class="qa-answer">
    <ul>
      <li>Native audio engine (react-native-track-player) — runs in service.</li>
      <li>iOS: AVAudioSession with category <code>playback</code>, Info.plist <code>UIBackgroundModes: audio</code>.</li>
      <li>Android: foreground service with media-style notification (otherwise OS kills).</li>
      <li>Audio focus: pause for calls, lower for nav voices.</li>
      <li>MediaSession / Now Playing integration for lock screen / control center / car play.</li>
      <li>Pre-buffer next track for gapless transitions.</li>
      <li>Network drops → buffer drains → pause → resume on reconnect.</li>
      <li>Offline: encrypted downloaded files; SQLite tracks downloaded state; license tokens for DRM.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. What's your strategy for cross-platform UI consistency?</div>
  <div class="qa-answer">
    <ul>
      <li>Design system with platform-aware tokens (e.g., iOS shadow vs Android elevation).</li>
      <li>Custom font shipped on both platforms — avoid OS-default differences.</li>
      <li>Pressable + custom feedback (ripple on Android, opacity on iOS) for consistency.</li>
      <li>Navigation: native stack (UINavigationController / Fragment) for native-feeling transitions; consistent across platforms.</li>
      <li>SafeArea via react-native-safe-area-context.</li>
      <li>Test in both early — never assume "iOS works → Android fine."</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. How does push notification routing work end to end?</div>
  <div class="qa-answer">
    <ol>
      <li>App requests permission, registers with APNs (iOS) / FCM (Android), gets token.</li>
      <li>Token sent to backend, associated with user account.</li>
      <li>Backend triggers push via APNs / FCM API.</li>
      <li>OS delivers payload + UI to device.</li>
      <li>User taps → app opens; payload contains route.</li>
      <li>Three handler cases: foreground (onMessage), background-tap (onNotificationOpenedApp), cold-start (getInitialNotification).</li>
      <li>App parses route, navigates via deep link.</li>
      <li>Token refresh: listener updates server.</li>
      <li>Engagement metrics: open rate per push category — drives content tuning.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. How do you ensure the app survives a forced upgrade scenario?</div>
  <div class="qa-answer">
    <ol>
      <li>Server returns "upgrade required" status code (e.g., 426) on incompatible client.</li>
      <li>App detects and shows blocking screen with App Store / Play Store link.</li>
      <li>App version comparison logic on launch + on each API call.</li>
      <li>Optionally: feature flags can disable specific features for old versions instead of full block.</li>
      <li>OTA updates can patch JS-only urgent fixes without full version bump.</li>
      <li>Notify users in advance via in-app banner before forced upgrade.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. The interviewer asks "what's different about banking apps vs social apps?" Answer.</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Security</strong>: SecureStore tokens, biometric gating, certificate pinning, jailbreak detection, screenshot blocking.</li>
      <li><strong>Compliance</strong>: PCI / SOC2; audit logs; mandatory MFA; regulated data handling.</li>
      <li><strong>Optimistic mutations</strong>: NO. Every transfer awaits server confirmation.</li>
      <li><strong>Offline</strong>: read-only (cached balances); writes always require live network.</li>
      <li><strong>Privacy</strong>: blur on background, no caching of sensitive screens.</li>
      <li><strong>Forced upgrade</strong>: more aggressive — security bugs require all users to update.</li>
      <li><strong>Push</strong>: minimal, transactional only.</li>
      <li><strong>Performance</strong>: less critical than absolute correctness.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. You're designing a feed app for users in countries with poor cellular networks. Adjustments?</div>
  <div class="qa-answer">
    <ul>
      <li>Smaller image variants by default; eager-load thumbnails only.</li>
      <li>Aggressive HTTP caching with long TTLs.</li>
      <li>Pre-fetch on wifi for next-likely views.</li>
      <li>Detect <code>navigator.connection.effectiveType</code> — adjust quality.</li>
      <li>Skeleton screens / blurhash placeholders to feel instant.</li>
      <li>Lite mode toggle: text-only feed.</li>
      <li>Smaller initial bundle (split features lazy).</li>
      <li>OTA-only fixes via EAS Update / CodePush — skip App Store latency.</li>
      <li>Heavier offline support — let user keep using last-loaded content.</li>
    </ul>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You apply the 10-step framework with mobile-specific extensions.</li>
    <li>You decompose storage by data shape (memory / MMKV / SQLite / FS / SecureStore / server).</li>
    <li>You design offline-first with mutation queues + idempotency.</li>
    <li>You handle real-time as foreground-WS + background-push hybrid.</li>
    <li>You name Hermes + new arch + FlashList + Reanimated as defaults.</li>
    <li>You distinguish platform behaviors (iOS vs Android) in your design.</li>
    <li>You plan rollout, observability, hotfix, kill switches.</li>
    <li>You consider battery, data, low-end devices, accessibility.</li>
    <li>You walk through cold-start, lifecycle, and degradation explicitly.</li>
    <li>You scope down when time-pressed and call out open questions at the end.</li>
  </ul>
</div>
`}

]
});
