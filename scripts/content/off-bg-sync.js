window.PREP_SITE.registerTopic({
  id: 'off-bg-sync',
  module: 'offline',
  title: 'Background Sync',
  estimatedReadTime: '40 min',
  tags: ['background-sync', 'periodic-sync', 'service-worker', 'workbox', 'offline', 'queue', 'idempotency', 'mobile'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>Background Sync</strong> is a Service Worker API that lets you <em>defer</em> work — typically a queued mutation — until the device has a stable network connection. It's how an offline-aware web app makes "send tweet" feel instant: the UI succeeds locally, the request goes into a queue, and the SW retries the fetch when connectivity returns, even if the user has closed the tab. <strong>Periodic Background Sync</strong> is a related API that fires a SW event at regular intervals (subject to user engagement signals) — useful for daily content refresh.</p>
<ul>
  <li><strong>Two specs:</strong> <code>SyncManager</code> (one-shot, for "send when online") and <code>PeriodicSyncManager</code> (recurring, for "refresh data every few hours").</li>
  <li><strong>Browser support is uneven.</strong> Background Sync: Chrome / Edge / Opera. <em>Not</em> Safari, <em>not</em> Firefox. Periodic Sync: Chrome / Edge only and gated on PWA install + user engagement.</li>
  <li><strong>Always have a fallback.</strong> Try the request immediately; if it fails AND Background Sync is supported, register the sync; otherwise hold the queue and flush on next visit / online event.</li>
  <li><strong>Workbox</strong> ships <code>BackgroundSyncPlugin</code> and a <code>Queue</code> class — the de facto implementation.</li>
  <li><strong>Idempotency keys are mandatory.</strong> Network failures cause replays; server must dedupe.</li>
  <li><strong>The pattern:</strong> page enqueues to IndexedDB → SW listens for <code>sync</code> event → SW iterates queue, calls fetch, retries on failure with exponential backoff.</li>
  <li><strong>Mobile RN parallel:</strong> <code>react-native-background-fetch</code> + native task scheduling (<code>BackgroundTasks</code> on iOS, <code>WorkManager</code> on Android).</li>
</ul>
<p><strong>Mantra:</strong> "Enqueue locally, fire-and-forget, retry on reconnect, dedupe with idempotency keys, fall back gracefully where the API isn't supported."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>The two background sync APIs</h3>
<table>
  <thead><tr><th>API</th><th>Trigger</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td><code>SyncManager</code> (one-shot)</td><td>Connectivity returns AND the OS thinks now is a good time</td><td>Send queued mutations after offline session</td></tr>
    <tr><td><code>PeriodicSyncManager</code></td><td>Recurring (~daily on Chrome), gated on engagement + PWA install</td><td>Refresh content (newsfeed, weather)</td></tr>
  </tbody>
</table>

<h3>What problem this solves</h3>
<p>Without Background Sync, here's what happens when a user submits a form offline:</p>
<ol>
  <li>User taps "Send."</li>
  <li>Page tries <code>fetch</code>. Fails.</li>
  <li>Page shows error or queues in localStorage / IDB.</li>
  <li>User closes the tab.</li>
  <li>Network returns. Nothing happens. Queue sits.</li>
  <li>User opens the tab again later. Page boots, checks queue, retries. <strong>Hours / days later.</strong></li>
</ol>

<p>With Background Sync:</p>
<ol>
  <li>User taps "Send."</li>
  <li>Page tries <code>fetch</code>. Fails.</li>
  <li>Page enqueues to IDB AND calls <code>registration.sync.register('queue-name')</code>.</li>
  <li>User closes the tab.</li>
  <li>Network returns. Browser wakes the SW with a <code>sync</code> event.</li>
  <li>SW flushes the queue. <strong>Within seconds-to-minutes of reconnect.</strong></li>
</ol>

<h3>Why browser support is uneven</h3>
<table>
  <thead><tr><th>Browser</th><th>Background Sync</th><th>Periodic Sync</th></tr></thead>
  <tbody>
    <tr><td>Chrome (desktop + Android)</td><td>✅</td><td>✅ (PWA + engagement)</td></tr>
    <tr><td>Edge</td><td>✅</td><td>✅</td></tr>
    <tr><td>Opera</td><td>✅</td><td>✅</td></tr>
    <tr><td>Firefox</td><td>❌</td><td>❌</td></tr>
    <tr><td>Safari (desktop + iOS)</td><td>❌</td><td>❌</td></tr>
    <tr><td>Samsung Internet</td><td>✅</td><td>partial</td></tr>
  </tbody>
</table>
<p>Apple has historically opposed Background Sync; Mozilla cited concerns over fingerprinting + battery. Both rejections persist as of 2026. Treat Background Sync as a <em>progressive enhancement</em>; design for the fallback first.</p>

<h3>The fallback pattern</h3>
<ol>
  <li>Always try the fetch immediately.</li>
  <li>On failure, store in IDB queue.</li>
  <li>If <code>SyncManager</code> available → register sync.</li>
  <li>Always: also flush the queue on <code>online</code> event, on app boot, on visibility change to visible.</li>
  <li>Server: dedupe by idempotency key.</li>
</ol>

<p>This works on every browser (because the fallback alone is enough); Background Sync just makes the "user closed the tab" case work faster.</p>

<h3>Why use this at all if the fallback works?</h3>
<table>
  <thead><tr><th>Scenario</th><th>Without Background Sync</th><th>With Background Sync</th></tr></thead>
  <tbody>
    <tr><td>User closes tab; reconnects later</td><td>Queue waits until next open</td><td>Queue flushes within minutes</td></tr>
    <tr><td>User on flaky transit network</td><td>Each retry on next visit</td><td>OS tries on every reconnect</td></tr>
    <tr><td>Push notification arrives but server hasn't seen the user's last actions</td><td>State out of sync</td><td>State usually current</td></tr>
    <tr><td>Battery / data costs</td><td>Same — work happens whenever app opens</td><td>Slightly more — OS may try multiple times</td></tr>
  </tbody>
</table>

<h3>Periodic Sync — the rarer cousin</h3>
<p>Less powerful than push notifications + waking the SW on demand, but useful for:</p>
<ul>
  <li>Pre-fetching daily content so the next open is instant.</li>
  <li>Refreshing analytics / leaderboard caches.</li>
  <li>Sending batched usage telemetry on a daily cadence.</li>
</ul>
<p>Constraints: only fires for installed PWAs with site-engagement score (Chrome's internal heuristic). Real interval is ~12–24 hours; you don't get to set the exact period — only a minimum.</p>

<h3>What "good Background Sync" looks like</h3>
<ul>
  <li>Mutations queued in IDB with idempotency keys + timestamps + attempt counts.</li>
  <li>Workbox <code>BackgroundSyncPlugin</code> handles the queue + sync lifecycle.</li>
  <li>Always-on fallback: page-side <code>online</code> listener + visibility listener also flushes queue.</li>
  <li>Exponential backoff per item with a max attempt count + dead-letter handling.</li>
  <li>Server dedupes via idempotency key with a 24h+ window.</li>
  <li>UX shows pending state ("Will send when online") with optional manual retry.</li>
  <li>Quotas respected — don't queue 10MB blobs without cap.</li>
  <li>Telemetry: track queue depth, sync success rate, time-to-flush.</li>
</ul>

<h3>What "bad Background Sync" looks like</h3>
<ul>
  <li>Relies on Background Sync only; Safari + Firefox users lose all offline submissions.</li>
  <li>No idempotency keys; retries duplicate mutations.</li>
  <li>Queue grows unboundedly; eventually the app fails on quota.</li>
  <li>UI claims "sent" but item silently fails on retry; user has no way to know.</li>
  <li>Periodic sync registered without checking permission; silently no-ops.</li>
  <li>One queue for everything; one bad item blocks the whole queue.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The lifecycle of a queued mutation</h3>
<pre><code class="language-text">User submits form
   ↓
Page POSTs to /api/...
   ├── success → done; clear pending state
   └── failure → enqueue in IDB
                  ↓
                  Register sync('mutation-queue')
                  ↓
                  (also: listen to online, visibility events)
                  ↓
[browser may close, network may drop, time passes]
                  ↓
Network returns → browser fires sync event
                  ↓
SW iterates queue:
  for each item:
    fetch /api/...
      success → delete from queue
      failure → increment attempt; throw to trigger retry
                ↓ (if too many attempts)
                move to dead-letter; surface to user
</code></pre>

<h3>Three places to flush the queue</h3>
<ol>
  <li><strong>Background Sync event</strong> (Chrome / Edge): browser-driven on reconnect.</li>
  <li><strong>Page-side <code>online</code> event</strong> (universal fallback): fires when navigator goes back online.</li>
  <li><strong>Page-side <code>visibilitychange</code> event</strong> (universal fallback): fires when user comes back to the tab.</li>
</ol>

<p>Always set up at least #2 + #3. They cover Safari + Firefox where Background Sync is unavailable.</p>

<h3>SyncManager API surface</h3>
<table>
  <thead><tr><th>Method / property</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td><code>registration.sync.register(tag)</code></td><td>Schedule a one-shot sync with the given tag.</td></tr>
    <tr><td><code>registration.sync.getTags()</code></td><td>List currently scheduled tags.</td></tr>
    <tr><td><code>self.addEventListener('sync', e =&gt; ...)</code></td><td>SW handler; fires when conditions met. <code>e.tag</code> identifies which sync.</td></tr>
    <tr><td><code>e.lastChance</code></td><td>True on the final retry attempt before browser gives up.</td></tr>
    <tr><td><code>e.waitUntil(promise)</code></td><td>Keep the SW alive; if promise rejects, browser will retry.</td></tr>
  </tbody>
</table>

<h3>PeriodicSyncManager API surface</h3>
<table>
  <thead><tr><th>Method / property</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td><code>registration.periodicSync.register(tag, { minInterval })</code></td><td>Schedule a periodic sync; minInterval is hint, not guarantee.</td></tr>
    <tr><td><code>registration.periodicSync.getTags()</code></td><td>List scheduled periodic tags.</td></tr>
    <tr><td><code>registration.periodicSync.unregister(tag)</code></td><td>Cancel.</td></tr>
    <tr><td><code>self.addEventListener('periodicsync', e =&gt; ...)</code></td><td>SW handler.</td></tr>
    <tr><td><strong>Permission required</strong></td><td><code>navigator.permissions.query({ name: 'periodic-background-sync' })</code></td></tr>
  </tbody>
</table>

<h3>The queue data structure</h3>
<table>
  <thead><tr><th>Field</th><th>Why</th></tr></thead>
  <tbody>
    <tr><td><code>id</code></td><td>Auto-incrementing primary key.</td></tr>
    <tr><td><code>idempotencyKey</code></td><td>Server dedupes on this; uuid generated at enqueue.</td></tr>
    <tr><td><code>method</code></td><td>POST / PUT / DELETE / PATCH.</td></tr>
    <tr><td><code>url</code></td><td>Endpoint.</td></tr>
    <tr><td><code>headers</code></td><td>Auth, content type, idempotency-key header.</td></tr>
    <tr><td><code>body</code></td><td>Serialized payload.</td></tr>
    <tr><td><code>createdAt</code></td><td>For UI ("queued 5 minutes ago"); for sorting / TTL.</td></tr>
    <tr><td><code>attempts</code></td><td>Retry count; dead-letter past N.</td></tr>
    <tr><td><code>lastError</code></td><td>For debugging + user-facing diagnostics.</td></tr>
    <tr><td><code>nextRetryAt</code></td><td>Exponential backoff timestamp.</td></tr>
  </tbody>
</table>

<h3>Backoff strategy</h3>
<pre><code class="language-text">Attempt 1: immediate
Attempt 2: +30s
Attempt 3: +2 min
Attempt 4: +10 min
Attempt 5: +1 hr
Attempt 6: +6 hr (final)
After: dead-letter, surface to user
</code></pre>
<p>Workbox uses similar default schedule. Tune by request type (financial = more attempts; analytics = fewer).</p>

<h3>Idempotency key — non-negotiable</h3>
<p>Network failures cause replays. Without an idempotency key:</p>
<ul>
  <li>Sync fails mid-response (server processed, client never got 200).</li>
  <li>Browser retries.</li>
  <li>Server processes again.</li>
  <li>User sees double charge / double comment / double order.</li>
</ul>
<p>With an idempotency key + server-side dedupe window (24h), the second request returns the cached response without re-executing.</p>

<h3>The Workbox model</h3>
<p>Workbox provides <code>BackgroundSyncPlugin</code> which auto-queues failed requests, and <code>Queue</code> for fine-grained control:</p>
<table>
  <thead><tr><th>Component</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td><code>BackgroundSyncPlugin('queue-name', { maxRetentionTime })</code></td><td>Plug into a strategy; auto-queue failures.</td></tr>
    <tr><td><code>Queue('queue-name', { onSync, maxRetentionTime })</code></td><td>Manual queue; you control flush logic.</td></tr>
    <tr><td><code>queue.pushRequest({ request })</code></td><td>Enqueue.</td></tr>
    <tr><td><code>queue.shiftRequest()</code></td><td>Pop oldest.</td></tr>
    <tr><td><code>queue.replayRequests()</code></td><td>Try to send all queued.</td></tr>
  </tbody>
</table>

<h3>What you don't get</h3>
<ul>
  <li>Guaranteed delivery — browser may give up after retries.</li>
  <li>Exact timing — sync fires "soon after reconnect," not at a precise interval.</li>
  <li>Cross-device sync — only this browser, this profile.</li>
  <li>Notification of failure to the user — you have to surface that yourself from the queue state.</li>
</ul>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Page side: enqueue + register sync</h3>
<pre><code class="language-javascript">// app.js
import { openDB } from 'idb';

const dbPromise = openDB('app', 1, {
  upgrade(db) {
    db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
  },
});

export async function postWithRetry(url, body) {
  // Try immediately
  try {
    const idempotencyKey = crypto.randomUUID();
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(body),
    });
    if (res.ok) return res;
    if (res.status &gt;= 500) throw new Error('server-side; retry');
    return res; // 4xx: don't retry
  } catch (err) {
    // Network or 5xx: enqueue
    const db = await dbPromise;
    const id = await db.add('queue', {
      url,
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      createdAt: Date.now(),
      attempts: 0,
    });

    // Register Background Sync if available
    if ('serviceWorker' in navigator &amp;&amp; 'SyncManager' in window) {
      const reg = await navigator.serviceWorker.ready;
      try {
        await reg.sync.register('flush-queue');
      } catch {
        // Some browsers throw if no permission; fall through
      }
    }

    return { ok: true, queued: true, id };
  }
}
</code></pre>

<h3>Page side: fallback flush on online + visibility</h3>
<pre><code class="language-javascript">async function flushQueueViaPage() {
  const db = await dbPromise;
  const items = await db.getAll('queue');

  for (const item of items) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });
      if (res.ok) await db.delete('queue', item.id);
      else if (res.status &gt;= 500) {
        const tx = db.transaction('queue', 'readwrite');
        await tx.objectStore('queue').put({ ...item, attempts: item.attempts + 1 });
        await tx.done;
        break; // stop on first failure; backoff
      } else {
        // 4xx: dead-letter
        await db.delete('queue', item.id);
        notifyUser('Request failed permanently', item);
      }
    } catch {
      break; // network error; stop
    }
  }
}

window.addEventListener('online', flushQueueViaPage);
document.addEventListener('visibilitychange', () =&gt; {
  if (document.visibilityState === 'visible') flushQueueViaPage();
});
</code></pre>

<h3>SW side: handle sync event</h3>
<pre><code class="language-javascript">// sw.js
import { openDB } from 'idb';

self.addEventListener('sync', (event) =&gt; {
  if (event.tag === 'flush-queue') {
    event.waitUntil(flushQueueInSW(event));
  }
});

async function flushQueueInSW(event) {
  const db = await openDB('app', 1);
  const items = await db.getAll('queue');

  for (const item of items) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });
      if (res.ok) {
        await db.delete('queue', item.id);
      } else if (res.status &gt;= 500) {
        const tx = db.transaction('queue', 'readwrite');
        await tx.objectStore('queue').put({
          ...item,
          attempts: item.attempts + 1,
          lastError: \`HTTP \${res.status}\`,
        });
        await tx.done;
        if (event.lastChance) break; // give up on this attempt
        throw new Error('retry'); // browser will retry sync
      } else {
        // 4xx: dead-letter
        await db.delete('queue', item.id);
        await postNotificationToClients({ type: 'queue-failed', item });
      }
    } catch (err) {
      throw err; // tells browser to retry the sync event
    }
  }
}

async function postNotificationToClients(message) {
  const clients = await self.clients.matchAll();
  for (const client of clients) client.postMessage(message);
}
</code></pre>

<h3>Workbox approach (recommended)</h3>
<pre><code class="language-javascript">// sw.js
import { registerRoute } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

const bgSyncPlugin = new BackgroundSyncPlugin('mutations', {
  maxRetentionTime: 24 * 60, // minutes — 24 hours
  onSync: async ({ queue }) =&gt; {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request.clone());
      } catch (err) {
        await queue.unshiftRequest(entry);
        throw err; // tells Workbox to retry
      }
    }
    // notify client
    const clients = await self.clients.matchAll();
    clients.forEach(c =&gt; c.postMessage({ type: 'queue-flushed' }));
  },
});

registerRoute(
  /\\/api\\/.*/,
  new NetworkOnly({ plugins: [bgSyncPlugin] }),
  'POST'
);
</code></pre>

<h3>Periodic Sync</h3>
<pre><code class="language-javascript">// page side: register
async function setupPeriodicRefresh() {
  const reg = await navigator.serviceWorker.ready;
  const status = await navigator.permissions.query({
    name: 'periodic-background-sync',
  });
  if (status.state !== 'granted') {
    return; // user hasn't engaged enough; PWA not installed
  }
  await reg.periodicSync.register('refresh-feed', {
    minInterval: 12 * 60 * 60 * 1000, // 12 hours hint
  });
}
</code></pre>

<pre><code class="language-javascript">// sw.js: handle
self.addEventListener('periodicsync', (event) =&gt; {
  if (event.tag === 'refresh-feed') {
    event.waitUntil(refreshFeed());
  }
});

async function refreshFeed() {
  const cache = await caches.open('feed-v1');
  const response = await fetch('/api/feed');
  if (response.ok) {
    cache.put('/api/feed', response.clone());
  }
}
</code></pre>

<h3>Workbox periodic sync wrapper</h3>
<pre><code class="language-javascript">// Pre-cache content during periodic syncs
self.addEventListener('periodicsync', (event) =&gt; {
  if (event.tag === 'content-sync') {
    event.waitUntil(updateContent());
  }
});

async function updateContent() {
  const cache = await caches.open('articles-v1');
  const list = await fetch('/api/articles?limit=20').then(r =&gt; r.json());
  await Promise.all(list.map(article =&gt;
    cache.add(\`/articles/\${article.id}\`)
  ));
}
</code></pre>

<h3>Client → SW message for "I'm idle, run sync now"</h3>
<pre><code class="language-javascript">// page
navigator.serviceWorker.controller?.postMessage({ type: 'flush-now' });

// sw
self.addEventListener('message', (event) =&gt; {
  if (event.data?.type === 'flush-now') {
    event.waitUntil(flushQueueInSW({ lastChance: false }));
  }
});
</code></pre>

<h3>Telemetry hooks</h3>
<pre><code class="language-javascript">async function logSyncMetric(name, data) {
  await fetch('/api/metrics', {
    method: 'POST',
    body: JSON.stringify({ name, ...data, ts: Date.now() }),
    keepalive: true, // hint to browser to send even if SW shuts down
  });
}

// Inside flushQueueInSW
const start = Date.now();
let succeeded = 0, failed = 0;
// ... flush ...
await logSyncMetric('queue-flushed', {
  durationMs: Date.now() - start,
  succeeded,
  failed,
  remaining: (await db.count('queue')),
});
</code></pre>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Offline-first comments app</h3>
<pre><code class="language-typescript">// app.ts
async function postComment(postId: string, body: string) {
  // Optimistic UI update
  const tempId = \`temp-\${crypto.randomUUID()}\`;
  insertOptimisticComment(postId, tempId, body);

  try {
    const idempotencyKey = crypto.randomUUID();
    const res = await fetch(\`/api/posts/\${postId}/comments\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({ body }),
    });

    if (res.ok) {
      const real = await res.json();
      replaceOptimisticComment(tempId, real);
      return;
    }
    throw new Error(\`HTTP \${res.status}\`);
  } catch {
    // Queue + register sync
    await enqueueMutation({
      url: \`/api/posts/\${postId}/comments\`,
      body: { body },
      tempId,
    });
    markCommentPending(tempId);

    if ('SyncManager' in window) {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('flush-mutations').catch(() =&gt; {});
    }
  }
}

// SW message listener (page)
navigator.serviceWorker?.addEventListener('message', (event) =&gt; {
  if (event.data?.type === 'mutation-succeeded') {
    replaceOptimisticComment(event.data.tempId, event.data.real);
  } else if (event.data?.type === 'mutation-failed') {
    markCommentFailed(event.data.tempId, event.data.error);
  }
});
</code></pre>

<h3>Example 2: Chat message queue</h3>
<pre><code class="language-typescript">// Each message has client-generated ID; server uses it for dedupe
async function sendChatMessage(roomId: string, text: string) {
  const messageId = crypto.randomUUID();
  const message = { id: messageId, roomId, text, ts: Date.now(), status: 'sending' };

  // Optimistic
  appendToChat(message);

  try {
    const res = await fetch(\`/api/rooms/\${roomId}/messages\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': messageId,
      },
      body: JSON.stringify(message),
    });
    if (res.ok) {
      updateMessageStatus(messageId, 'sent');
      return;
    }
    throw new Error('failed');
  } catch {
    await enqueueMutation({
      url: \`/api/rooms/\${roomId}/messages\`,
      body: message,
      idempotencyKey: messageId,
    });
    updateMessageStatus(messageId, 'queued');
    if ('SyncManager' in window) {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('chat-queue').catch(() =&gt; {});
    }
  }
}
</code></pre>

<h3>Example 3: Photo upload with chunking</h3>
<pre><code class="language-typescript">// Large uploads — chunk + queue per chunk
async function uploadPhoto(blob: Blob) {
  const uploadId = crypto.randomUUID();
  const CHUNK = 1024 * 1024; // 1MB

  const chunks: Blob[] = [];
  for (let i = 0; i &lt; blob.size; i += CHUNK) {
    chunks.push(blob.slice(i, Math.min(i + CHUNK, blob.size)));
  }

  // Tell server about the upload
  await postMutation({
    url: '/api/uploads/init',
    body: { uploadId, totalChunks: chunks.length, mimeType: blob.type },
  });

  // Upload each chunk
  for (let i = 0; i &lt; chunks.length; i++) {
    const formData = new FormData();
    formData.append('chunk', chunks[i]);
    formData.append('index', String(i));
    formData.append('uploadId', uploadId);
    await postMutation({ url: '/api/uploads/chunk', body: formData });
  }

  // Finalize
  await postMutation({ url: '/api/uploads/complete', body: { uploadId } });
}
</code></pre>
<p>If any chunk fails, it's queued + retried via Background Sync. Server tracks chunks received; only finalizes when all in.</p>

<h3>Example 4: Workbox-driven mutation queue</h3>
<pre><code class="language-javascript">// sw.js
import { registerRoute } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

const mutationQueue = new BackgroundSyncPlugin('mutations', {
  maxRetentionTime: 7 * 24 * 60, // 1 week
});

registerRoute(/\\/api\\/(comments|posts|votes)/, new NetworkOnly({
  plugins: [mutationQueue],
}), 'POST');

registerRoute(/\\/api\\/(comments|posts|votes)/, new NetworkOnly({
  plugins: [mutationQueue],
}), 'PUT');

registerRoute(/\\/api\\/(comments|posts|votes)/, new NetworkOnly({
  plugins: [mutationQueue],
}), 'DELETE');
</code></pre>
<p>Workbox handles enqueue + retry + sync event registration automatically. Page-side fetch fails → Workbox queues → SW retries on reconnect.</p>

<h3>Example 5: Periodic sync for daily digest pre-fetch</h3>
<pre><code class="language-javascript">// page
async function enableDailyRefresh() {
  if (!('periodicSync' in self.registration)) return;
  const status = await navigator.permissions.query({
    name: 'periodic-background-sync',
  });
  if (status.state !== 'granted') return;
  await self.registration.periodicSync.register('daily-digest', {
    minInterval: 24 * 60 * 60 * 1000,
  });
}

// sw.js
self.addEventListener('periodicsync', (event) =&gt; {
  if (event.tag === 'daily-digest') {
    event.waitUntil(prefetchDigest());
  }
});

async function prefetchDigest() {
  const response = await fetch('/api/digest/today');
  if (response.ok) {
    const cache = await caches.open('digest-v1');
    await cache.put('/api/digest/today', response);
  }
}
</code></pre>

<h3>Example 6: Dead-letter handling</h3>
<pre><code class="language-typescript">async function flushQueueWithDeadLetter() {
  const items = await db.getAll('queue');
  const MAX_ATTEMPTS = 5;

  for (const item of items) {
    if (item.attempts &gt;= MAX_ATTEMPTS) {
      await db.delete('queue', item.id);
      await db.add('dead-letter', {
        ...item,
        deadAt: Date.now(),
      });
      await notifyUser({
        type: 'dead-letter',
        message: \`Could not send "\${item.summary}" — please retry manually\`,
        itemId: item.id,
      });
      continue;
    }

    try {
      await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });
      await db.delete('queue', item.id);
    } catch {
      await db.put('queue', { ...item, attempts: item.attempts + 1 });
    }
  }
}

// User-facing retry UX
async function retryDeadLetter(itemId) {
  const item = await db.get('dead-letter', itemId);
  await db.delete('dead-letter', itemId);
  await db.add('queue', { ...item, attempts: 0 });
  await flushQueue();
}
</code></pre>

<h3>Example 7: Telemetry on queue health</h3>
<pre><code class="language-typescript">// On app boot, log queue depth
async function reportQueueDepth() {
  const queueCount = await db.count('queue');
  const deadCount = await db.count('dead-letter');
  if (queueCount &gt; 0 || deadCount &gt; 0) {
    fetch('/api/metrics', {
      method: 'POST',
      keepalive: true,
      body: JSON.stringify({
        type: 'queue-depth',
        queueCount,
        deadCount,
      }),
    }).catch(() =&gt; {});
  }
}
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>Browser support gaps</h3>
<ul>
  <li>Safari + Firefox: no Background Sync, no Periodic Sync.</li>
  <li>Always implement the page-side <code>online</code> + <code>visibilitychange</code> fallback.</li>
  <li>Detect via <code>'SyncManager' in window</code> before calling.</li>
  <li>Don't wrap fetch failures in user-visible errors that say "background sync failed" — confusing on browsers without the API.</li>
</ul>

<h3>Permission for Periodic Sync</h3>
<ul>
  <li>Chrome only grants periodic sync to PWAs the user has installed AND has high site engagement.</li>
  <li>Engagement is opaque (visit frequency, time on site, install state).</li>
  <li>Always check <code>navigator.permissions.query({ name: 'periodic-background-sync' })</code>; gracefully no-op if not granted.</li>
</ul>

<h3>Sync event timing</h3>
<ul>
  <li>"Soon after reconnect" can mean seconds or minutes; the OS decides.</li>
  <li>If app is foregrounded, page-side fallback usually wins anyway.</li>
  <li>Sync may fire multiple times — your handler must be idempotent (check queue, do work, repeat).</li>
</ul>

<h3>The <code>lastChance</code> attempt</h3>
<ul>
  <li>Browser gives ~3 retry attempts; the final one has <code>event.lastChance === true</code>.</li>
  <li>Use this to surface a notification to the user: "Couldn't send your message; please try again."</li>
  <li>Don't keep throwing on lastChance — browser will give up; you have to handle in subsequent sessions.</li>
</ul>

<h3>Idempotency keys + server</h3>
<ul>
  <li>Server must dedupe on <code>Idempotency-Key</code> header for at least 24h.</li>
  <li>Same key + different body = error (422 typically).</li>
  <li>Returns the cached response (status + body) on replay; client can update UI as if successful.</li>
  <li>Without server-side dedupe, you'll get duplicate writes; this isn't a "background sync issue" — it's an API design issue.</li>
</ul>

<h3>Quota exhaustion</h3>
<ul>
  <li>Queue grows unboundedly during a long offline session.</li>
  <li>Cap queue size; reject enqueue when at limit; surface to user.</li>
  <li>For large blobs (image uploads), consider OPFS or chunked references rather than blob in IDB.</li>
</ul>

<h3>Stale queue items</h3>
<ul>
  <li>An item queued 6 days ago — is it still valid?</li>
  <li>Workbox's <code>maxRetentionTime</code> auto-deletes after N minutes.</li>
  <li>For your own implementation: add <code>expiresAt</code>; skip + delete past expiry.</li>
  <li>Stale chat message from a deleted conversation — server should reject; UI should ignore the failure.</li>
</ul>

<h3>Mutation order</h3>
<ul>
  <li>If user does A then B then C while offline, server must apply in order.</li>
  <li>Process queue sequentially; one at a time; halt on failure (don't skip ahead).</li>
  <li>For independent mutations across different resources, parallel is fine.</li>
  <li>Compound flows (create + update + delete) — best to track as a single saga, not 3 queue entries.</li>
</ul>

<h3>Queue corruption</h3>
<ul>
  <li>Schema migration of the queue store after a feature change leaves old items in wrong shape.</li>
  <li>Defensive code: validate each item; skip + log if shape is bad.</li>
  <li>Provide manual "Clear queue" UI.</li>
</ul>

<h3>Auth tokens</h3>
<ul>
  <li>Token in queued request expires before sync flushes.</li>
  <li>Refresh token in SW (if available) before retry; or fail with 401 + re-auth UX.</li>
  <li>Don't ship long-lived tokens just to make queue work — refresh properly.</li>
</ul>

<h3>SW update mid-sync</h3>
<ul>
  <li>If a new SW activates while a sync is in-flight, the new SW handles future events.</li>
  <li>Old SW's pending work is best-effort (browser policy varies).</li>
  <li>Avoid renaming the queue store across versions; use schema migration to preserve in-flight items.</li>
</ul>

<h3>Mobile (web on mobile)</h3>
<ul>
  <li>Mobile Chrome: Background Sync works as expected.</li>
  <li>iOS Safari: no Background Sync; rely on page-side fallback when user opens the PWA again.</li>
  <li>Battery / data usage: Background Sync respects OS power policies; sync may delay when battery low.</li>
  <li>Periodic sync on installed PWAs: Chrome on Android works; iOS doesn't support.</li>
</ul>

<h3>Testing</h3>
<ul>
  <li>DevTools → Application → Service Workers → Sync section: trigger syncs manually.</li>
  <li>Network tab → throttle to "Offline" to simulate.</li>
  <li>Workbox logs sync attempts to console (DEBUG=workbox in dev).</li>
  <li>Production telemetry: queue depth, sync success rate, time-to-flush percentiles.</li>
</ul>

<h3>RN parallel</h3>
<ul>
  <li>RN equivalents: <code>react-native-background-fetch</code> wraps iOS BackgroundTasks + Android WorkManager.</li>
  <li>Constraints: iOS limits to ~10s of CPU, ~30 min between fires; Android more flexible.</li>
  <li>Same patterns apply: queue with idempotency, server dedupe, fallback to foreground flush.</li>
  <li>Push-triggered wake-up (silent push) is more reliable than scheduled background sync on iOS.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common Background Sync mistakes</h3>
<ol>
  <li><strong>Relying on Background Sync only.</strong> Safari + Firefox users lose offline submissions.</li>
  <li><strong>No idempotency keys.</strong> Retries cause duplicates.</li>
  <li><strong>No queue size cap.</strong> Unbounded growth → quota error.</li>
  <li><strong>No dead-letter / user notification.</strong> Items silently fail forever.</li>
  <li><strong>No <code>event.waitUntil</code>.</strong> Browser kills SW mid-sync.</li>
  <li><strong>One queue for everything.</strong> One bad item blocks all.</li>
  <li><strong>Auth tokens in queue without refresh logic.</strong> Expired tokens → all syncs fail.</li>
  <li><strong>Throwing forever — even on <code>lastChance</code>.</strong> Browser gives up; user never knows.</li>
  <li><strong>Sync registered without <code>navigator.serviceWorker.ready</code>.</strong> Race conditions.</li>
  <li><strong>Optimistic UI without rollback.</strong> User sees "sent"; mutation fails; UI lies.</li>
  <li><strong>Mutation order ignored.</strong> Server applies update before create; chaos.</li>
  <li><strong>Periodic sync without permission check.</strong> Silently no-ops; engineers think it's working.</li>
</ol>

<h3>Anti-pattern: no fallback</h3>
<pre><code class="language-javascript">// BAD — Safari users lose data
if (!response.ok) {
  await reg.sync.register('mutations'); // Safari: throws
  throw new Error('Will retry in background');
}

// GOOD — fallback to page-side flush
await enqueue(request);
if ('SyncManager' in window) {
  const reg = await navigator.serviceWorker.ready;
  await reg.sync.register('mutations').catch(() =&gt; {});
}
// online + visibilitychange listeners flush regardless of API support
</code></pre>

<h3>Anti-pattern: no idempotency</h3>
<pre><code class="language-javascript">// BAD — server sees N copies if retries fire
fetch('/api/orders', { method: 'POST', body: JSON.stringify(order) });

// GOOD — idempotency key
fetch('/api/orders', {
  method: 'POST',
  headers: { 'Idempotency-Key': crypto.randomUUID() },
  body: JSON.stringify(order),
});
</code></pre>

<h3>Anti-pattern: no queue size limit</h3>
<pre><code class="language-javascript">// BAD — unbounded
await db.add('queue', request);

// GOOD — cap and reject
const count = await db.count('queue');
if (count &gt;= 1000) {
  showWarning('Outbox full; please reconnect to send pending messages');
  return;
}
await db.add('queue', request);
</code></pre>

<h3>Anti-pattern: silent dead letters</h3>
<pre><code class="language-javascript">// BAD — past 5 attempts; just delete
if (item.attempts &gt; 5) {
  await db.delete('queue', item.id);
  return;
}

// GOOD — surface to user
if (item.attempts &gt; 5) {
  await db.delete('queue', item.id);
  await db.add('dead-letter', { ...item, deadAt: Date.now() });
  await notifyUser({
    type: 'sync-failed',
    message: \`Couldn't sync "\${item.summary}". Tap to retry.\`,
    itemId: item.id,
  });
}
</code></pre>

<h3>Anti-pattern: no <code>event.waitUntil</code></h3>
<pre><code class="language-javascript">// BAD — browser may kill SW before flush completes
self.addEventListener('sync', (event) =&gt; {
  if (event.tag === 'queue') flushQueue();
});

// GOOD
self.addEventListener('sync', (event) =&gt; {
  if (event.tag === 'queue') event.waitUntil(flushQueue());
});
</code></pre>

<h3>Anti-pattern: optimistic UI without rollback</h3>
<pre><code class="language-javascript">// BAD — UI shows "sent" forever, even if eventually fails
appendComment(text); // never tied back to result

// GOOD — track status; update on success / failure
const tempId = crypto.randomUUID();
appendOptimisticComment(tempId, text); // shows pending state
// later, when sync completes:
//   replaceWithReal(tempId, real)
//   or markFailed(tempId)
</code></pre>

<h3>Anti-pattern: throwing past lastChance</h3>
<pre><code class="language-javascript">// BAD — browser gives up; user never knows
async function flushQueue(event) {
  for (const item of items) {
    try { await fetch(...); } catch (err) { throw err; } // throws even on lastChance
  }
}

// GOOD — handle lastChance specially
async function flushQueue(event) {
  for (const item of items) {
    try { await fetch(...); }
    catch (err) {
      if (event.lastChance) {
        await markDeadLetter(item);
      } else {
        throw err;
      }
    }
  }
}
</code></pre>

<h3>Anti-pattern: stale token in queue</h3>
<pre><code class="language-javascript">// BAD — token captured at enqueue; expired by sync
await db.add('queue', {
  url, method, headers: { Authorization: \`Bearer \${currentToken}\` }, body,
});

// GOOD — get fresh token at sync time
async function flush(item) {
  const token = await getFreshToken();
  await fetch(item.url, {
    method: item.method,
    headers: { ...item.headers, Authorization: \`Bearer \${token}\` },
    body: item.body,
  });
}
</code></pre>

<h3>Anti-pattern: out-of-order processing</h3>
<pre><code class="language-javascript">// BAD — parallel sync; create reaches server after update
await Promise.all(items.map(flushItem));

// GOOD — sequential
for (const item of items.sort((a, b) =&gt; a.createdAt - b.createdAt)) {
  await flushItem(item);
}
</code></pre>

<h3>Anti-pattern: periodic sync without permission</h3>
<pre><code class="language-javascript">// BAD — silently no-ops if not granted
await registration.periodicSync.register('refresh', { minInterval: 86400000 });

// GOOD — check first
const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
if (status.state === 'granted') {
  await registration.periodicSync.register('refresh', { minInterval: 86400000 });
} else {
  // Fallback: refresh on visibility change
}
</code></pre>

<h3>Anti-pattern: no telemetry</h3>
<p>Without queue depth + sync success rate visibility, you can't tell if your sync is working in production. Log via <code>fetch(..., { keepalive: true })</code>.</p>

<h3>Anti-pattern: no manual retry UX</h3>
<p>If sync fails permanently, the user needs a way to trigger another attempt — a "Retry" button on the failed item, a "Sync now" action in settings.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common Background Sync interview prompts</h3>
<ol>
  <li>How would you handle offline form submissions in a PWA?</li>
  <li>Compare Background Sync vs Periodic Sync vs page-side polling.</li>
  <li>Walk through the queue + retry pattern.</li>
  <li>How do you ensure idempotency across retries?</li>
  <li>What happens on Safari / Firefox where Background Sync isn't supported?</li>
  <li>How do you handle dead letters?</li>
  <li>Tell me about a time you debugged a sync issue.</li>
  <li>How would you implement WhatsApp-style "send when online"?</li>
</ol>

<h3>The 5-step framework for "design offline mutations"</h3>
<ol>
  <li><strong>Optimistic UI:</strong> show success immediately with pending state.</li>
  <li><strong>Try fetch + enqueue on failure</strong> with idempotency key.</li>
  <li><strong>Register Background Sync</strong> if available; always-on page-side fallback (online + visibility events).</li>
  <li><strong>SW handles sync event:</strong> iterate queue, fetch, retry on failure with backoff.</li>
  <li><strong>Dead-letter + user notification</strong> after max attempts; manual retry UX.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"Background Sync is a progressive enhancement; my fallback is page-side <code>online</code> + <code>visibilitychange</code> listeners. Safari users still get reliable retry, just not while the tab is closed."</em></li>
  <li><em>"Workbox's BackgroundSyncPlugin handles enqueue + retry + sync registration in a few lines; rolling my own gets the same shape but more boilerplate."</em></li>
  <li><em>"Idempotency keys per request — server dedupes for 24h. Without this, a network failure that the server already processed becomes a double-charge."</em></li>
  <li><em>"Queue cap of N items; dead-letter beyond max attempts; user-visible retry UX. Silent failures destroy trust."</em></li>
  <li><em>"Sequential processing of the queue — out-of-order writes break server invariants."</em></li>
  <li><em>"Optimistic UI with explicit pending state ('Will send when online'); rollback on dead-letter."</em></li>
  <li><em>"Periodic sync only fires for installed PWAs with engagement; not a substitute for push for time-sensitive updates."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"send while offline"</td><td>Optimistic UI + IDB queue + Background Sync + page fallback</td></tr>
    <tr><td>"don't double-charge"</td><td>Idempotency key + server dedupe</td></tr>
    <tr><td>"order matters"</td><td>Sequential processing + sort by createdAt</td></tr>
    <tr><td>"large file upload"</td><td>Chunk + queue per chunk + finalize</td></tr>
    <tr><td>"daily content refresh"</td><td>Periodic Sync if installed PWA; otherwise polling on visibility</td></tr>
    <tr><td>"telemetry"</td><td>fetch with keepalive: true; SW logs queue depth</td></tr>
    <tr><td>"dead letter"</td><td>Move to separate store; notify user; manual retry button</td></tr>
    <tr><td>"Safari support"</td><td>Page-side online + visibilitychange listeners</td></tr>
  </tbody>
</table>

<h3>Demo script</h3>
<ol>
  <li>Sketch the architecture: page → IDB queue → SW → retries → server.</li>
  <li>Show enqueue code with idempotency key.</li>
  <li>Show SW sync handler with backoff.</li>
  <li>Show page-side fallback (online + visibility).</li>
  <li>Talk dead-letter + user UX.</li>
  <li>Address browser support gracefully.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"Workbox BackgroundSyncPlugin migration; cuts code 50%."</em></li>
  <li><em>"Server-side idempotency key tracking with 24h Redis TTL."</em></li>
  <li><em>"Per-mutation-type queue weights (chat &gt; analytics)."</em></li>
  <li><em>"Periodic sync for daily content pre-fetch on installed PWAs."</em></li>
  <li><em>"Telemetry: queue depth, sync success rate, time-to-flush p50/p95."</em></li>
  <li><em>"Dead-letter dashboard for ops + automatic alerting at threshold."</em></li>
  <li><em>"User-visible 'Outbox' screen showing pending + failed messages."</em></li>
  <li><em>"Token refresh in SW before retry; no stale-token failures."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Fallback discipline</td><td>Doesn't rely on Background Sync alone</td></tr>
    <tr><td>Idempotency awareness</td><td>Key per request; server dedupes</td></tr>
    <tr><td>Queue design</td><td>IDB store with status / attempts / timestamps</td></tr>
    <tr><td>Retry strategy</td><td>Exponential backoff + max attempts + dead letter</td></tr>
    <tr><td>UX awareness</td><td>Optimistic UI + pending state + manual retry</td></tr>
    <tr><td>Workbox awareness</td><td>Knows the plugin exists</td></tr>
    <tr><td>SW lifecycle handling</td><td>event.waitUntil + lastChance + token refresh</td></tr>
    <tr><td>Permissions for Periodic Sync</td><td>Checks before registering</td></tr>
    <tr><td>Mobile awareness</td><td>RN equivalents named (background-fetch + WorkManager / BackgroundTasks)</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN apps can't use Service Workers; equivalent is <code>react-native-background-fetch</code> wrapping native scheduling.</li>
  <li>Native iOS BackgroundTasks: limited to ~10s CPU, fires every ~30 min; battery-aware.</li>
  <li>Android WorkManager: more flexible; respects Doze mode; supports constraints (network, charging).</li>
  <li>Push notification (silent push) is the most reliable wake-up on iOS.</li>
  <li>The pattern is identical: optimistic UI + IDB-equivalent (MMKV / SQLite) queue + idempotency keys + server dedupe.</li>
  <li>For RN: use <code>react-query</code>'s mutation queue with persistence (<code>persistQueryClient</code>) for the optimistic + retry layer.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"Why not use Background Sync everywhere?"</em> — Browser support is uneven (no Safari, no Firefox); also OS may delay; user has no visibility. Use it as a progressive enhancement, not a single source of reliability.</li>
  <li><em>"How do you handle server returning 200 to a duplicate idempotency-key request?"</em> — Server returns the cached original response (status + body); client treats it as success and updates UI accordingly.</li>
  <li><em>"What if a queued mutation depends on another queued mutation?"</em> — Process sequentially; or model as a saga with explicit dependency. Don't parallelize across dependent mutations.</li>
  <li><em>"How do you size the queue retention window?"</em> — Workbox default is 7 days; longer for critical (financial) flows; shorter for analytics. Trade off: longer = more storage, less data loss; shorter = quicker recovery from broken state.</li>
  <li><em>"How do you debug a stuck sync in production?"</em> — Telemetry on queue depth + dead-letter rate; user-visible Outbox screen; logging via fetch with keepalive; SW console accessible via remote debugging.</li>
  <li><em>"What happens if the SW gets unregistered while the queue has items?"</em> — IDB persists; next page load can flush via fallback path. Don't lose data because SW lifecycle changed.</li>
  <li><em>"How do you cancel a queued mutation?"</em> — Find by id in IDB; delete; if it's already in-flight on SW, cancel via AbortController in fetch (more involved); UI removes optimistic update.</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Build a tiny offline form-submission demo with Workbox BackgroundSyncPlugin.</li>
  <li>Test on Chrome (Background Sync) AND Safari (fallback).</li>
  <li>Implement page-side <code>online</code> + <code>visibilitychange</code> fallback.</li>
  <li>Add idempotency keys + server dedupe (mock).</li>
  <li>Add dead-letter store + retry UX.</li>
  <li>Read Workbox background-sync docs end to end.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Compare Background Sync to silent-push wake-up patterns on iOS."</li>
  <li>"Read Pinterest / Twitter PWA case studies on offline mutations."</li>
  <li>"Build the same pattern in RN with react-query persistence."</li>
  <li>"Audit a real PWA's offline mutations — does it dedupe? does it surface failures?"</li>
</ul>
`
    }
  ]
});
