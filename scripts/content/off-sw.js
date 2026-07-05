window.PREP_SITE.registerTopic({
  id: 'off-sw',
  module: 'offline',
  title: 'Service Workers Deep',
  estimatedReadTime: '50 min',
  tags: ['service-worker', 'offline', 'pwa', 'cache-api', 'workbox', 'fetch', 'lifecycle', 'push'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>A <strong>Service Worker (SW)</strong> is a JavaScript program that lives between your web app and the network. It runs in a separate worker thread, has no DOM access, and intercepts every <code>fetch</code> the page makes — letting you serve from cache, transform responses, queue requests, deliver push notifications, and run background sync. It's the engine that turns a website into an installable, offline-capable app (PWA).</p>
<ul>
  <li><strong>It's a separate thread, separate process, separate context.</strong> No <code>window</code>, no DOM, no synchronous storage. <code>self</code> is the global. Promises everywhere.</li>
  <li><strong>Lifecycle:</strong> install → waiting → activate → idle → fetch/message events. New SWs sit in "waiting" until all tabs close (or you call <code>skipWaiting</code>).</li>
  <li><strong>Caching strategies:</strong> Cache-first (assets), Network-first (API), Stale-while-revalidate (best of both), Network-only (mutations), Cache-only (offline-only).</li>
  <li><strong>Storage:</strong> Cache API (Request → Response key/value), IndexedDB (structured data), no localStorage / sessionStorage in SW context.</li>
  <li><strong>Scope:</strong> SW controls only pages under its scope (path-prefix); usually register at <code>/</code>.</li>
  <li><strong>Registration is HTTPS-only</strong> (except localhost). One SW per origin (effectively).</li>
  <li><strong>Workbox</strong> is Google's library that ships pre-built strategies, routing, precaching, and a build plugin. Default for new PWAs.</li>
  <li><strong>Updates are sticky:</strong> a new SW deployed today doesn't activate until the user has zero open tabs of the old one. Plan upgrade UX.</li>
</ul>
<p><strong>Mantra:</strong> "It's a network proxy that runs in the browser. Cache deliberately, version everything, plan the update flow."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What a Service Worker actually is</h3>
<p>A JS file the browser registers and runs in its own thread. After registration, the browser routes every <code>fetch</code> from any page in the SW's scope through the SW's <code>fetch</code> event handler. The SW can return a cached response, generate one synthetically, modify the request, or pass through to the network.</p>

<p>It also receives <code>push</code> events (from your push server), <code>sync</code> events (when connectivity returns), <code>periodicsync</code> events, and <code>message</code> events from pages.</p>

<h3>Why Service Workers exist</h3>
<table>
  <thead><tr><th>Need</th><th>SW solution</th></tr></thead>
  <tbody>
    <tr><td>Apps that work offline</td><td>Intercept fetches; serve from Cache API.</td></tr>
    <tr><td>Push notifications on web</td><td>Background SW receives <code>push</code> from FCM / VAPID-signed source.</td></tr>
    <tr><td>Reliable background sync after reconnect</td><td><code>sync</code> event fires when network returns.</td></tr>
    <tr><td>Faster repeat visits</td><td>Precache app shell; serve instantly.</td></tr>
    <tr><td>Custom cache strategies</td><td>Stale-while-revalidate, network-with-fallback, etc.</td></tr>
    <tr><td>Installable app experience</td><td>SW + manifest = PWA, can be installed to home screen.</td></tr>
  </tbody>
</table>

<h3>Why SWs are deceptively hard</h3>
<ul>
  <li><strong>Lifecycle is sticky.</strong> A buggy SW persists for users until they close every tab; remote-fix tools are limited.</li>
  <li><strong>Update timing is intricate.</strong> Old SW controls open pages; new SW waits until they're gone unless you manually <code>skipWaiting</code> + <code>clients.claim</code>.</li>
  <li><strong>Two separate caches:</strong> HTTP cache (browser native) and Cache API (your code). They don't know about each other.</li>
  <li><strong>You can't use most browser APIs.</strong> No DOM, no <code>localStorage</code>, no <code>alert</code>, no <code>document</code>.</li>
  <li><strong>Debugging is split:</strong> page vs SW vs network — three console contexts.</li>
  <li><strong>Versioning the SW itself</strong> requires care; cache busting on the SW source URL or relying on byte-difference detection.</li>
</ul>

<h3>What "good SW" looks like</h3>
<ul>
  <li>Registered after page load, not blocking initial render.</li>
  <li>Precaches the app shell (HTML, CSS, JS) at install.</li>
  <li>Routes API calls through cache strategy chosen per route (network-first / SWR / etc.).</li>
  <li>Versioned cache names so old caches can be garbage-collected on activate.</li>
  <li>Update flow surfaced to user: "A new version is available — refresh?"</li>
  <li>Errors logged to a remote endpoint (the SW has no DevTools for end users).</li>
  <li>Built with Workbox or a similar library; no hand-rolled cache management for an MVP.</li>
  <li>Push handler shows notifications + opens the right deep link.</li>
</ul>

<h3>What "bad SW" looks like</h3>
<ul>
  <li>SW registered synchronously in the head; blocks the page.</li>
  <li>Caches everything forever; users get stuck on yesterday's bug.</li>
  <li>No version bump on cache name; old entries never cleaned up.</li>
  <li>Hand-rolled <code>fetch</code> handler with no fallback for misses; users see white screen offline.</li>
  <li>Push handler doesn't <code>waitUntil</code> the notification show — Chrome may kill the SW mid-handler.</li>
  <li>SW caches POST responses (silently breaks).</li>
  <li>Update never surfaces; users on stale code for weeks.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The lifecycle</h3>
<pre><code class="language-text">┌──────────────┐
│   Register   │  navigator.serviceWorker.register('/sw.js')
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Installing  │  'install' event fires; precache assets here
└──────┬───────┘
       │  if all caches succeed
       ▼
┌──────────────┐
│  Installed   │  Wait until no other SW controls clients
└──────┬───────┘
       │  (or skipWaiting() called)
       ▼
┌──────────────┐
│  Activating  │  'activate' event; clean up old caches
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Activated  │  Now controls pages
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Idle / Active│  Handles fetch, push, message, sync events
└──────┬───────┘
       │
       │  When new sw.js byte-different
       ▼
┌──────────────┐
│   Redundant  │  Old SW; replaced by next version
└──────────────┘
</code></pre>

<h3>The 5 caching strategies</h3>
<table>
  <thead><tr><th>Strategy</th><th>How it works</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td>Cache-first</td><td>Try cache; if miss, fetch + cache.</td><td>Static assets, fonts, images that don't change.</td></tr>
    <tr><td>Network-first</td><td>Try network; if fail, cache.</td><td>API responses, dynamic pages.</td></tr>
    <tr><td>Stale-while-revalidate</td><td>Return cache immediately; fetch in background; update cache.</td><td>News feed, profile data — fresh-but-fast.</td></tr>
    <tr><td>Network-only</td><td>Never cache; always network.</td><td>Mutations (POST/PUT/DELETE), analytics beacons.</td></tr>
    <tr><td>Cache-only</td><td>Never network; serve from cache or fail.</td><td>Truly offline-only assets; precached shell after install.</td></tr>
  </tbody>
</table>

<h3>Cache API vs HTTP cache</h3>
<table>
  <thead><tr><th></th><th>HTTP cache</th><th>Cache API</th></tr></thead>
  <tbody>
    <tr><td>Controlled by</td><td>HTTP headers (<code>Cache-Control</code>, <code>ETag</code>)</td><td>Your SW code</td></tr>
    <tr><td>Storage</td><td>Browser-managed</td><td>Origin-scoped, persistent until evicted</td></tr>
    <tr><td>Eviction</td><td>Browser quota + LRU</td><td>You manage; browser may evict under storage pressure</td></tr>
    <tr><td>Available offline</td><td>Sometimes (browser-dependent)</td><td>Always (you control)</td></tr>
    <tr><td>Programmable</td><td>No (config-driven)</td><td>Yes (per fetch event)</td></tr>
  </tbody>
</table>

<h3>What's available in the SW global scope</h3>
<table>
  <thead><tr><th>Available</th><th>Not available</th></tr></thead>
  <tbody>
    <tr><td><code>self</code> (global)</td><td><code>window</code></td></tr>
    <tr><td><code>fetch</code></td><td><code>document</code></td></tr>
    <tr><td><code>caches</code> (Cache API)</td><td><code>localStorage</code> / <code>sessionStorage</code></td></tr>
    <tr><td><code>indexedDB</code></td><td><code>alert</code> / <code>confirm</code> / <code>prompt</code></td></tr>
    <tr><td><code>Notification.show</code> via <code>self.registration.showNotification</code></td><td>Direct DOM manipulation</td></tr>
    <tr><td><code>postMessage</code> to clients</td><td>Synchronous XHR</td></tr>
    <tr><td>Promise + async/await</td><td>Most timer APIs persist briefly only</td></tr>
    <tr><td>WebCrypto, Streams, URL, Headers</td><td>—</td></tr>
  </tbody>
</table>

<h3>Scope and registration</h3>
<ul>
  <li>SW only controls pages within its <strong>scope</strong> — defined by where the SW file lives unless overridden in registration.</li>
  <li><code>navigator.serviceWorker.register('/sw.js')</code> defaults to scope <code>/</code>.</li>
  <li><code>navigator.serviceWorker.register('/admin/sw.js')</code> defaults to <code>/admin/</code>.</li>
  <li>You can broaden scope with <code>Service-Worker-Allowed</code> response header from the SW file.</li>
  <li>Register at root unless you have a clear reason for sub-scope.</li>
</ul>

<h3>The three event categories</h3>
<table>
  <thead><tr><th>Category</th><th>Events</th></tr></thead>
  <tbody>
    <tr><td>Lifecycle</td><td><code>install</code>, <code>activate</code></td></tr>
    <tr><td>Functional</td><td><code>fetch</code>, <code>message</code>, <code>messageerror</code></td></tr>
    <tr><td>Background</td><td><code>push</code>, <code>notificationclick</code>, <code>notificationclose</code>, <code>sync</code>, <code>periodicsync</code></td></tr>
  </tbody>
</table>

<h3>The <code>event.waitUntil()</code> rule</h3>
<p>The SW can be killed at any time — between events, during idle. Anything async you start must be wrapped in <code>event.waitUntil()</code> so the browser keeps the SW alive until your work finishes:</p>
<pre><code class="language-javascript">self.addEventListener('install', (event) =&gt; {
  event.waitUntil(
    caches.open('v1').then(cache =&gt; cache.addAll([
      '/',
      '/styles/main.css',
      '/scripts/app.js',
    ]))
  );
});
</code></pre>
<p>Without <code>waitUntil</code>, the browser may kill the SW before <code>addAll</code> completes.</p>

<h3>Versioning + update flow</h3>
<ol>
  <li>Browser checks for updated SW: every 24 hours, on every navigation, on every reload (whichever happens first).</li>
  <li>If <code>sw.js</code> is byte-different from cached version → install new SW.</li>
  <li>New SW enters <strong>waiting</strong> while old SW still controls pages.</li>
  <li>When all controlled pages close (or refresh with old SW gone), new SW activates.</li>
  <li>Or: new SW calls <code>self.skipWaiting()</code> to activate immediately + <code>clients.claim()</code> to take over open pages.</li>
</ol>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Registering a Service Worker</h3>
<pre><code class="language-javascript">// app.js (page-side; runs in window context)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () =&gt; {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) =&gt; console.log('SW registered:', reg.scope))
      .catch((err) =&gt; console.error('SW registration failed:', err));
  });
}
</code></pre>
<p>Wait for <code>load</code> so registration doesn't compete with critical-path resources.</p>

<h3>Minimal SW with precache</h3>
<pre><code class="language-javascript">// sw.js — runs in SW context (self)
const CACHE = 'app-shell-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/app.js',
  '/images/logo.svg',
];

self.addEventListener('install', (event) =&gt; {
  event.waitUntil(
    caches.open(CACHE).then((cache) =&gt; cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) =&gt; {
  event.waitUntil(
    caches.keys().then((keys) =&gt;
      Promise.all(keys.filter(k =&gt; k !== CACHE).map(k =&gt; caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', (event) =&gt; {
  if (event.request.method !== 'GET') return; // never cache mutations
  event.respondWith(
    caches.match(event.request).then((cached) =&gt; cached || fetch(event.request))
  );
});
</code></pre>

<h3>Cache-first strategy</h3>
<pre><code class="language-javascript">async function cacheFirst(request) {
  const cache = await caches.open('assets-v1');
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}
</code></pre>

<h3>Network-first with fallback</h3>
<pre><code class="language-javascript">async function networkFirst(request) {
  const cache = await caches.open('api-v1');
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}
</code></pre>

<h3>Stale-while-revalidate</h3>
<pre><code class="language-javascript">async function staleWhileRevalidate(request) {
  const cache = await caches.open('swr-v1');
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) =&gt; {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() =&gt; cached);

  return cached || fetchPromise;
}
</code></pre>

<h3>Routing fetches by URL</h3>
<pre><code class="language-javascript">self.addEventListener('fetch', (event) =&gt; {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request));
  } else if (url.pathname.match(/\\.(woff2|png|jpg|svg|css|js)$/)) {
    event.respondWith(cacheFirst(event.request));
  } else {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});
</code></pre>

<h3>Workbox version (recommended)</h3>
<pre><code class="language-javascript">// sw.js with Workbox
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Injected at build time
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ request }) =&gt; ['style', 'script', 'worker'].includes(request.destination),
  new CacheFirst({ cacheName: 'static-resources' })
);

registerRoute(
  ({ request }) =&gt; request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 86400 })],
  })
);

registerRoute(
  ({ url }) =&gt; url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api',
    networkTimeoutSeconds: 3,
  })
);

registerRoute(
  ({ request }) =&gt; request.mode === 'navigate',
  new StaleWhileRevalidate({ cacheName: 'pages' })
);
</code></pre>
<p>Workbox handles cache versioning, expiration, plugins (broadcast updates, range requests, background sync), all in ~10 lines per route.</p>

<h3>The build pipeline (Workbox)</h3>
<table>
  <thead><tr><th>Tool</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td><code>workbox-webpack-plugin</code></td><td>Webpack — generates <code>__WB_MANIFEST</code> from build outputs</td></tr>
    <tr><td><code>workbox-build</code></td><td>CLI / programmatic build script</td></tr>
    <tr><td><code>vite-plugin-pwa</code></td><td>Vite — wraps Workbox with sensible defaults</td></tr>
    <tr><td>Next.js</td><td><code>next-pwa</code> plugin (community) wraps Workbox</td></tr>
    <tr><td>Remix / SvelteKit</td><td>Adapter-specific or use Workbox build directly</td></tr>
  </tbody>
</table>

<h3>Update flow with user prompt</h3>
<pre><code class="language-javascript">// app.js (page side)
let refreshing = false;

navigator.serviceWorker.addEventListener('controllerchange', () =&gt; {
  if (refreshing) return;
  refreshing = true;
  window.location.reload();
});

navigator.serviceWorker.register('/sw.js').then((reg) =&gt; {
  reg.addEventListener('updatefound', () =&gt; {
    const newWorker = reg.installing;
    newWorker.addEventListener('statechange', () =&gt; {
      if (newWorker.state === 'installed' &amp;&amp; navigator.serviceWorker.controller) {
        // New SW waiting; offer refresh
        showRefreshBanner(() =&gt; {
          newWorker.postMessage({ type: 'SKIP_WAITING' });
        });
      }
    });
  });
});
</code></pre>

<pre><code class="language-javascript">// sw.js
self.addEventListener('message', (event) =&gt; {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
</code></pre>

<h3>Push notifications</h3>
<pre><code class="language-javascript">// sw.js
self.addEventListener('push', (event) =&gt; {
  const data = event.data?.json() ?? { title: 'Update', body: 'New activity' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      data: { url: data.url ?? '/' },
      actions: [{ action: 'open', title: 'Open' }, { action: 'dismiss', title: 'Dismiss' }],
    })
  );
});

self.addEventListener('notificationclick', (event) =&gt; {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) =&gt; {
      for (const w of wins) {
        if (w.url === url &amp;&amp; 'focus' in w) return w.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
</code></pre>

<h3>Communicating between page and SW</h3>
<pre><code class="language-javascript">// page → SW
navigator.serviceWorker.controller?.postMessage({ type: 'CLEAR_CACHE' });

// SW receives
self.addEventListener('message', (event) =&gt; {
  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(caches.keys().then(keys =&gt; Promise.all(keys.map(k =&gt; caches.delete(k)))));
  }
});

// SW → all clients
self.clients.matchAll().then(clients =&gt; clients.forEach(c =&gt; c.postMessage({ type: 'UPDATED' })));

// page receives
navigator.serviceWorker.addEventListener('message', (event) =&gt; {
  if (event.data?.type === 'UPDATED') showToast('Content refreshed');
});
</code></pre>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Offline-capable news app</h3>
<pre><code class="language-javascript">// sw.js
const CACHE_VERSION = 'v4';
const SHELL_CACHE = \`shell-\${CACHE_VERSION}\`;
const RUNTIME_CACHE = \`runtime-\${CACHE_VERSION}\`;
const SHELL_ASSETS = [
  '/', '/offline.html',
  '/styles/main.css', '/scripts/app.js',
  '/icons/icon-192.png',
];

self.addEventListener('install', (event) =&gt; {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache =&gt; cache.addAll(SHELL_ASSETS))
      .then(() =&gt; self.skipWaiting()) // activate immediately on install
  );
});

self.addEventListener('activate', (event) =&gt; {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys =&gt;
        Promise.all(keys.filter(k =&gt; !k.endsWith(CACHE_VERSION)).map(k =&gt; caches.delete(k)))
      ),
      self.clients.claim(),
    ])
  );
});

self.addEventListener('fetch', (event) =&gt; {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Navigation: try network, fallback offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =&gt; caches.match('/offline.html'))
    );
    return;
  }

  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/articles')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (url.pathname.match(/\\.(woff2|png|jpg|svg|css|js)$/)) {
    event.respondWith(cacheFirst(request));
    return;
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(r =&gt; { if (r.ok) cache.put(request, r.clone()); return r; });
  return cached || fetchPromise;
}
</code></pre>

<h3>Example 2: API call with timeout fallback</h3>
<pre><code class="language-javascript">async function networkFirstWithTimeout(request, timeoutMs = 3000) {
  const cache = await caches.open('api-v1');
  try {
    const network = await Promise.race([
      fetch(request),
      new Promise((_, reject) =&gt; setTimeout(() =&gt; reject(new Error('timeout')), timeoutMs)),
    ]);
    if (network.ok) cache.put(request, network.clone());
    return network;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      // Mark as stale via header
      const headers = new Headers(cached.headers);
      headers.set('X-Stale', 'true');
      return new Response(await cached.blob(), { status: cached.status, headers });
    }
    return new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
</code></pre>

<h3>Example 3: Limit cache size</h3>
<pre><code class="language-javascript">async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length &gt; maxItems) {
    await cache.delete(keys[0]); // oldest first (insertion order)
    return trimCache(cacheName, maxItems);
  }
}

async function cacheImageWithLimit(request) {
  const cache = await caches.open('images-v1');
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
    trimCache('images-v1', 100);
  }
  return response;
}
</code></pre>

<h3>Example 4: Offline-first form submit (Background Sync API)</h3>
<pre><code class="language-javascript">// page side
async function submitFeedback(data) {
  await db.feedbackQueue.add({ data, timestamp: Date.now() });
  if ('serviceWorker' in navigator &amp;&amp; 'SyncManager' in window) {
    const reg = await navigator.serviceWorker.ready;
    await reg.sync.register('feedback-sync');
  } else {
    // Fallback: try immediately
    fetch('/api/feedback', { method: 'POST', body: JSON.stringify(data) });
  }
}

// sw.js
self.addEventListener('sync', (event) =&gt; {
  if (event.tag === 'feedback-sync') {
    event.waitUntil(flushFeedbackQueue());
  }
});

async function flushFeedbackQueue() {
  const queue = await getQueueFromIDB();
  for (const item of queue) {
    try {
      await fetch('/api/feedback', { method: 'POST', body: JSON.stringify(item.data) });
      await deleteFromIDB(item.id);
    } catch {
      throw new Error('retry');
    }
  }
}
</code></pre>

<h3>Example 5: Prefetch on hover (passing data to SW)</h3>
<pre><code class="language-javascript">// page side — when user hovers a link
linkEl.addEventListener('mouseenter', () =&gt; {
  navigator.serviceWorker.controller?.postMessage({
    type: 'PREFETCH',
    url: linkEl.href,
  });
});

// sw.js
self.addEventListener('message', async (event) =&gt; {
  if (event.data?.type === 'PREFETCH') {
    const cache = await caches.open('prefetch-v1');
    cache.add(event.data.url);
  }
});
</code></pre>

<h3>Example 6: Push notification with rich payload</h3>
<pre><code class="language-javascript">// sw.js
self.addEventListener('push', (event) =&gt; {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'New activity', {
      body: data.body,
      icon: '/icons/192.png',
      badge: '/icons/badge.png',
      tag: data.threadId, // group/replace by tag
      renotify: true,
      requireInteraction: false,
      data: { url: data.url, threadId: data.threadId },
      actions: [
        { action: 'reply', title: 'Reply', icon: '/icons/reply.png' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  );
});

self.addEventListener('notificationclick', (event) =&gt; {
  event.notification.close();
  const action = event.action;
  const url = action === 'reply'
    ? \`\${event.notification.data.url}?compose=true\`
    : event.notification.data.url;
  event.waitUntil(clients.openWindow(url));
});
</code></pre>

<h3>Example 7: Self-healing on cache corruption</h3>
<pre><code class="language-javascript">async function safeFetch(request) {
  try {
    return await caches.match(request) || await fetch(request);
  } catch (err) {
    // Cache may be corrupted; nuke + restart
    const keys = await caches.keys();
    await Promise.all(keys.map(k =&gt; caches.delete(k)));
    return fetch(request);
  }
}
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>The dreaded "stuck SW"</h3>
<ul>
  <li>Bug ships in SW; SW caches stale assets; users see broken app for weeks.</li>
  <li>Defenses: <em>always</em> version cache names; ship an "emergency reset" SW endpoint; track SW version in analytics; document a "Clear cache" UX.</li>
  <li>Last resort: ship a SW that just unregisters itself and clears all caches. Browser-side users get prompted to reload, sees fresh app.</li>
</ul>

<pre><code class="language-javascript">// sw.js — kill switch
self.addEventListener('install', (event) =&gt; {
  event.waitUntil(
    self.registration.unregister().then(() =&gt;
      caches.keys().then(keys =&gt; Promise.all(keys.map(k =&gt; caches.delete(k))))
    ).then(() =&gt; self.clients.matchAll())
     .then(clients =&gt; clients.forEach(c =&gt; c.navigate(c.url)))
  );
});
</code></pre>

<h3>SW updates not detected</h3>
<ul>
  <li>Browser caches the SW file itself per HTTP cache headers. <code>Cache-Control: max-age=0</code> on <code>sw.js</code> ensures fresh-check on every load.</li>
  <li>Or use <code>updateViaCache: 'none'</code> in registration: <code>navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })</code>.</li>
  <li>Manual update check: <code>reg.update()</code> on app focus.</li>
</ul>

<h3>POST / mutation requests</h3>
<ul>
  <li>Cache API doesn't store responses to non-GET requests by default; <code>cache.put</code> throws on POST.</li>
  <li>For offline POSTs, queue the requests in IndexedDB; flush via Background Sync.</li>
  <li>Use <code>workbox-background-sync</code> or roll your own queue.</li>
</ul>

<h3>Range requests</h3>
<ul>
  <li>Video / audio uses Range requests; cached responses without range support break playback.</li>
  <li>Workbox provides <code>RangeRequestsPlugin</code>; reads cached blob and returns the requested byte range.</li>
</ul>

<h3>CORS</h3>
<ul>
  <li>Opaque cross-origin responses (no <code>Access-Control-Allow-Origin</code>) take ~7MB in cache regardless of actual size — eviction trigger.</li>
  <li>Either request CORS-enabled assets (<code>crossorigin="anonymous"</code> on script/link tags) or accept the cost.</li>
</ul>

<h3>Storage quota</h3>
<ul>
  <li>Browsers cap origin storage. Chrome: 60% of disk; Firefox: 50%; Safari: ~1GB then prompts user.</li>
  <li>Eviction under pressure: LRU; Cache + IndexedDB for the same origin compete.</li>
  <li>Check via <code>navigator.storage.estimate()</code>; request persistence via <code>navigator.storage.persist()</code> (granted based on engagement).</li>
</ul>

<h3>HTTPS-only</h3>
<ul>
  <li>SW registration fails on plain HTTP. Localhost is exempt for dev.</li>
  <li>Self-signed certs work in some browsers with explicit trust.</li>
  <li>If you need to test over LAN, use <code>chrome://flags/#unsafely-treat-insecure-origin-as-secure</code> or set up a proper cert.</li>
</ul>

<h3>Iframes and SW</h3>
<ul>
  <li>Iframes get the SW only if their URL matches the parent's SW scope and origin.</li>
  <li>Cross-origin iframes have their own SW (or none).</li>
  <li>Embedded payment forms / OAuth popups bypass your SW entirely.</li>
</ul>

<h3>Safari-specific</h3>
<ul>
  <li>Safari supports SWs since iOS 11.3 / Safari 11.1 (macOS 10.13.4), but with quirks:</li>
  <li>No Background Sync API (use <code>periodicsync</code> on Chrome only; manual polling on Safari).</li>
  <li>Push notifications on iOS Safari only since iOS 16.4 (and only for installed PWAs).</li>
  <li>Storage eviction is more aggressive: 7-day idle eviction for browsing data.</li>
  <li>Test on real Safari, not just Chrome — they diverge.</li>
</ul>

<h3>SW startup latency</h3>
<ul>
  <li>SW must boot before handling first <code>fetch</code> on a page session — adds 30–200ms.</li>
  <li>Don't load huge libraries in the SW; keep <code>importScripts</code> minimal.</li>
  <li>Workbox is already heavy; tree-shake unused strategies.</li>
</ul>

<h3>Testing</h3>
<ul>
  <li>DevTools → Application → Service Workers: pause, update, unregister, simulate offline.</li>
  <li>"Update on reload" toggle for development.</li>
  <li>"Bypass for network" to skip SW during dev.</li>
  <li>Lighthouse → PWA audit catches missing manifest, no offline support, etc.</li>
  <li>Workbox provides <code>workbox-window</code> with events for update lifecycle — easier than raw API.</li>
</ul>

<h3>Mobile (web on mobile)</h3>
<ul>
  <li>Mobile Chrome / Firefox: SWs work full-featured.</li>
  <li>Mobile Safari (iOS 16.4+): full PWA support including push, but only for installed apps.</li>
  <li>iOS PWAs share storage with Safari — clearing Safari history nukes PWA data.</li>
  <li>Background Sync not available on iOS Safari; design for this.</li>
</ul>

<h3>RN comparison</h3>
<ul>
  <li>RN apps don't run in browsers — no SW. Equivalent layers:</li>
  <li>Caching: react-query / SWR with persistence (MMKV / AsyncStorage).</li>
  <li>Background sync: <code>react-native-background-fetch</code> + native task scheduling.</li>
  <li>Push: APNs / FCM via native modules.</li>
  <li>Offline: design data layer to queue mutations with idempotency keys.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common SW mistakes</h3>
<ol>
  <li><strong>No cache version bump.</strong> Old assets persist forever.</li>
  <li><strong>Caching everything (HTML, API, assets) cache-first.</strong> Users stuck on yesterday's UI.</li>
  <li><strong>No update prompt.</strong> New SW waits forever; users never see fresh code.</li>
  <li><strong>Caching POST responses.</strong> Throws or silently corrupts.</li>
  <li><strong>No <code>waitUntil</code> in event handlers.</strong> Browser kills SW mid-work.</li>
  <li><strong>Synchronous SW registration before page load.</strong> Blocks paint.</li>
  <li><strong>SW served with long cache headers.</strong> Updates never detected.</li>
  <li><strong>One giant <code>fetch</code> handler.</strong> Hard to reason about; route by URL pattern.</li>
  <li><strong>Forgetting to handle <code>fetch</code> errors.</strong> Returns nothing; page sees a bad fetch.</li>
  <li><strong>Skipping the offline fallback page.</strong> Users see browser default error.</li>
  <li><strong>Caching opaque responses without limits.</strong> 7MB each fills storage.</li>
  <li><strong>Hand-rolling everything when Workbox would do.</strong> Bugs you'd never write Workbox already handles.</li>
</ol>

<h3>Anti-pattern: cache-everything</h3>
<pre><code class="language-javascript">// BAD — HTML cached cache-first; users get stale shell forever
self.addEventListener('fetch', (event) =&gt; {
  event.respondWith(
    caches.match(event.request).then(c =&gt; c || fetch(event.request))
  );
});

// GOOD — HTML network-first; assets cache-first
self.addEventListener('fetch', (event) =&gt; {
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request));
  } else {
    event.respondWith(cacheFirst(event.request));
  }
});
</code></pre>

<h3>Anti-pattern: caching POSTs</h3>
<pre><code class="language-javascript">// BAD — throws on POST
self.addEventListener('fetch', (event) =&gt; {
  event.respondWith(cacheFirst(event.request));
});

// GOOD — guard mutations
self.addEventListener('fetch', (event) =&gt; {
  if (event.request.method !== 'GET') return;
  event.respondWith(/* strategy */);
});
</code></pre>

<h3>Anti-pattern: skipWaiting without warning</h3>
<pre><code class="language-javascript">// BAD — old tab is mid-task; new SW takes over; in-flight requests fail
self.addEventListener('install', (event) =&gt; {
  self.skipWaiting(); // dangerous default
  event.waitUntil(precache());
});

// GOOD — wait for user signal; show prompt; user clicks "Refresh"
self.addEventListener('install', (event) =&gt; {
  event.waitUntil(precache());
  // No skipWaiting; let UI prompt user
});
</code></pre>

<h3>Anti-pattern: huge importScripts</h3>
<pre><code class="language-javascript">// BAD — pulls 200KB into SW context on every event-driven wakeup
importScripts('/lib/lodash.js', '/lib/moment.js');
</code></pre>
<p>SW startup parses + executes everything imported. Keep tiny; tree-shake; build with Workbox via webpack/vite.</p>

<h3>Anti-pattern: no version</h3>
<pre><code class="language-javascript">// BAD — single cache name; can't clean up old entries
caches.open('app').then(cache =&gt; cache.addAll(ASSETS));

// GOOD — version in name; activate cleans up old
const VERSION = 'v3';
caches.open(\`app-\${VERSION}\`).then(cache =&gt; cache.addAll(ASSETS));

self.addEventListener('activate', (event) =&gt; {
  event.waitUntil(
    caches.keys().then(keys =&gt;
      Promise.all(keys.filter(k =&gt; !k.endsWith(VERSION)).map(k =&gt; caches.delete(k)))
    )
  );
});
</code></pre>

<h3>Anti-pattern: no offline fallback page</h3>
<pre><code class="language-html">&lt;!-- BAD — first network failure shows browser error --&gt;

&lt;!-- GOOD — cache /offline.html in install; fallback navigate failures --&gt;
self.addEventListener('install', (event) =&gt; {
  event.waitUntil(caches.open('shell').then(c =&gt; c.add('/offline.html')));
});

self.addEventListener('fetch', (event) =&gt; {
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() =&gt; caches.match('/offline.html')));
  }
});
</code></pre>

<h3>Anti-pattern: notifying SW with stale messages</h3>
<p>Page sends <code>postMessage</code> on a state change; SW handles. Page closes between change and SW arrival. Browser may discard. Use <code>navigator.serviceWorker.ready.then(reg =&gt; ...)</code> to wait for the SW or fall back.</p>

<h3>Anti-pattern: logging via <code>console.log</code> only</h3>
<p>SW console output is in the SW DevTools panel, not the page panel. End users will never see it. Send important events to a remote logger.</p>

<h3>Anti-pattern: caching analytics</h3>
<p>Analytics endpoints should be network-only (or use <code>sendBeacon</code>). Caching pings causes duplicate events on replay.</p>

<h3>Anti-pattern: SW that mutates request URLs</h3>
<p>Fetch handler that rewrites <code>/api/v1/...</code> to <code>/api/v2/...</code> for "migration." Page sees the wrong URL in DevTools network tab; debugging becomes impossible. Migrate properly.</p>

<h3>Anti-pattern: no fetch fallback when handler throws</h3>
<pre><code class="language-javascript">// BAD — handler throws; page sees TypeError
self.addEventListener('fetch', (event) =&gt; {
  event.respondWith(handle(event.request)); // may throw
});

// GOOD — wrap in try/catch
self.addEventListener('fetch', (event) =&gt; {
  event.respondWith(
    handle(event.request).catch(() =&gt; new Response('Error', { status: 500 }))
  );
});
</code></pre>

<h3>Anti-pattern: tracking PII in caches</h3>
<p>Authenticated responses cached without scope cleanup leak across users on shared devices. Use <code>Vary: Authorization</code> or skip caching authed routes entirely.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common SW interview prompts</h3>
<ol>
  <li>Explain the Service Worker lifecycle.</li>
  <li>Compare cache-first, network-first, stale-while-revalidate.</li>
  <li>How would you handle a stuck-bad-SW in production?</li>
  <li>Design an offline-capable news app.</li>
  <li>How does push notification delivery work end-to-end?</li>
  <li>Why use Workbox? When would you not?</li>
  <li>How do you version cached assets?</li>
  <li>Tell me about a time you debugged a SW issue.</li>
</ol>

<h3>The 5-step framework for "design offline support"</h3>
<ol>
  <li><strong>Audit data types:</strong> static (assets), dynamic (API), user-action (mutations).</li>
  <li><strong>Map each to a strategy:</strong> assets cache-first, API SWR or network-first, mutations queue.</li>
  <li><strong>Plan the cache lifecycle:</strong> versioned names, install precache, activate cleanup.</li>
  <li><strong>Plan the update UX:</strong> prompt user, skipWaiting on confirm, reload.</li>
  <li><strong>Plan failure modes:</strong> offline page, kill-switch SW, debug logging to remote.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"Network-first for HTML so users get the latest shell; cache-first for fingerprinted assets that never change."</em></li>
  <li><em>"Stale-while-revalidate gives instant render plus background freshness — best for personalisation views like profile or feed."</em></li>
  <li><em>"Versioned cache names; activate event cleans up old. Without versioning, SWs become permanent garbage."</em></li>
  <li><em>"skipWaiting only when the user clicks Refresh — otherwise mid-task users lose state when SW takes over."</em></li>
  <li><em>"Workbox by default — pre-built strategies, expiration plugins, range request support, background sync. Hand-rolling is bug-attractant."</em></li>
  <li><em>"Push handler always uses event.waitUntil; otherwise Chrome may kill the SW mid-show."</em></li>
  <li><em>"Storage quota: ~60% of disk on Chrome. Use navigator.storage.estimate to monitor; persist if engaged user."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"offline app"</td><td>Cache app shell + offline fallback page</td></tr>
    <tr><td>"static assets"</td><td>Cache-first + expiration</td></tr>
    <tr><td>"API responses"</td><td>Network-first or SWR with timeout</td></tr>
    <tr><td>"news feed"</td><td>SWR — instant cached + background fresh</td></tr>
    <tr><td>"queue offline mutations"</td><td>IDB queue + Background Sync (Workbox plugin)</td></tr>
    <tr><td>"push notifications"</td><td>VAPID + push event + showNotification</td></tr>
    <tr><td>"update prompt"</td><td>controllerchange + updatefound + skipWaiting on user signal</td></tr>
    <tr><td>"stuck SW"</td><td>Kill-switch SW + cache nuke + reload</td></tr>
    <tr><td>"PWA install"</td><td>Manifest + SW + beforeinstallprompt</td></tr>
  </tbody>
</table>

<h3>Demo script</h3>
<ol>
  <li>Sketch lifecycle (install → waiting → activate → idle).</li>
  <li>Sketch a fetch routing diagram (HTML → network-first; assets → cache-first; API → SWR).</li>
  <li>Show one strategy implementation in code (~5 lines).</li>
  <li>Show the update prompt flow.</li>
  <li>Talk through versioning + cache cleanup.</li>
  <li>Address kill-switch + debugging via remote log.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"Workbox windowing for update lifecycle UX."</em></li>
  <li><em>"navigator.storage.persist() request after engagement signal."</em></li>
  <li><em>"Per-route cache size limits via ExpirationPlugin."</em></li>
  <li><em>"Background sync fallback queue for mutations."</em></li>
  <li><em>"Periodic sync for daily content refresh on engaged users."</em></li>
  <li><em>"Push notification A/B testing via tag-based grouping."</em></li>
  <li><em>"Lighthouse PWA audit in CI."</em></li>
  <li><em>"SW analytics events forwarded via sendBeacon."</em></li>
  <li><em>"Cross-origin asset fetching via crossorigin attribute to avoid opaque-cache bloat."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Lifecycle fluency</td><td>Names install / waiting / activate / claim / skipWaiting</td></tr>
    <tr><td>Strategy taxonomy</td><td>Cache-first / Network-first / SWR / Network-only / Cache-only</td></tr>
    <tr><td>Versioning instinct</td><td>Cache name with version; cleanup in activate</td></tr>
    <tr><td>Update UX</td><td>User-prompted skipWaiting, not silent</td></tr>
    <tr><td>Workbox awareness</td><td>Knows when it's the right tool</td></tr>
    <tr><td>Offline fallback</td><td>Has /offline.html cached</td></tr>
    <tr><td>Kill-switch awareness</td><td>Has a plan for stuck-bad-SW</td></tr>
    <tr><td>Quota awareness</td><td>navigator.storage.estimate; opaque-response cost</td></tr>
    <tr><td>Push handler discipline</td><td>event.waitUntil always</td></tr>
    <tr><td>Communication</td><td>Tradeoffs spoken; not silent</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN apps don't have SWs (no browser). The patterns translate: cache via react-query persistence; queue mutations with idempotency keys; rely on FCM/APNs for push.</li>
  <li>iOS Safari supports SW + push since 16.4 — but only for installed PWAs. RN equivalents (push notifications) are first-class.</li>
  <li>If you ship a web mobile experience alongside RN, SW gives you offline-capable web — without it, the web version feels degraded compared to native.</li>
  <li>Test SW on Android Chrome (full features) AND iOS Safari (limited; no background sync, no periodic sync).</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"Why does the new SW wait?"</em> — Old SW controls open clients; if new SW activates immediately, in-flight requests routed by old SW could be inconsistent. Waiting ensures atomic transition. Override with skipWaiting + clients.claim only when user-confirmed.</li>
  <li><em>"How do you handle a SW caching a broken build?"</em> — Versioned caches; emergency kill-switch SW that unregisters + nukes caches; remote analytics tracking SW version; document a "Clear cache" UX.</li>
  <li><em>"Cache-first vs network-first — when each?"</em> — Cache-first for content-addressed (fingerprinted) assets that never change; network-first for HTML / API where freshness matters.</li>
  <li><em>"Why use Workbox instead of writing your own?"</em> — Strategies + expiration + range requests + background sync + broadcast updates + builds — all battle-tested. Hand-rolling is hundreds of lines + bugs.</li>
  <li><em>"How does push notification arrive?"</em> — Your server signs payload with VAPID, posts to push service (FCM, Mozilla, Apple); push service routes to user's browser; browser wakes SW; SW receives push event; SW shows notification via showNotification.</li>
  <li><em>"How do you debug a SW issue in prod?"</em> — Remote logging from SW via fetch to your endpoint; track SW version + cache version in analytics; user-facing "report a problem" with diagnostic dump.</li>
  <li><em>"What's the difference between Cache API and HTTP cache?"</em> — Cache API is your code's storage, scoped per origin, accessed via JS; HTTP cache is browser-managed, controlled by response headers. Both can serve the same request; SW reads Cache API directly.</li>
  <li><em>"How do you precache the right files at build time?"</em> — Workbox build plugin emits a manifest of all build outputs with revision hashes; SW uses precacheAndRoute to cache them on install.</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Build a tiny PWA with vite-plugin-pwa: manifest + Workbox SW + offline fallback.</li>
  <li>Test offline mode in DevTools; verify cache routing.</li>
  <li>Add update prompt + kill-switch + remote logging.</li>
  <li>Wire push notifications end to end (VAPID, server, SW handler).</li>
  <li>Read Workbox docs for routing + strategies + plugins.</li>
  <li>Memorise lifecycle + 5 strategies + versioning pattern.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read Jake Archibald's Service Worker articles — he wrote the spec."</li>
  <li>"Read Workbox source for one strategy — see how it handles edge cases."</li>
  <li>"Build a SW from scratch without Workbox; feel the boilerplate."</li>
  <li>"Audit a real PWA — find versioning, update, kill-switch gaps."</li>
</ul>
`
    }
  ]
});
