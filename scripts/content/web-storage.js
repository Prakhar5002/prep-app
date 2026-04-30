window.PREP_SITE.registerTopic({
  id: 'web-storage',
  module: 'web',
  title: 'Storage',
  estimatedReadTime: '40 min',
  tags: ['storage', 'localstorage', 'sessionstorage', 'cookies', 'indexeddb', 'cachestorage', 'opaque-origin', 'web'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>The web has many storage APIs, each with different trade-offs. Senior frontend engineers know which to use for which data: small UI state vs auth tokens vs offline cache vs large structured data. Picking wrong = security holes, performance issues, or quota errors.</p>
<ul>
  <li><strong>localStorage:</strong> ~5MB, synchronous, string-only, persists across sessions. Good for UI prefs. <em>Bad for tokens</em> (XSS-vulnerable).</li>
  <li><strong>sessionStorage:</strong> Same API, scoped to a browser tab; cleared on tab close.</li>
  <li><strong>Cookies:</strong> Sent with every request to the domain; size-limited (~4KB); good for auth (with HttpOnly + Secure + SameSite).</li>
  <li><strong>IndexedDB:</strong> Asynchronous, structured (object stores + indexes), large quota (often hundreds of MB), supports binary data.</li>
  <li><strong>Cache API:</strong> Service Worker's request/response cache; programmable HTTP cache.</li>
  <li><strong>Origin Private File System (OPFS):</strong> File-system-like API for app-internal files; high performance.</li>
  <li><strong>WebSQL:</strong> Deprecated; don't use.</li>
  <li><strong>Storage quota:</strong> Enforced by browser; <code>navigator.storage.estimate()</code> tells you usage. Persistent storage avoids eviction.</li>
</ul>
<p><strong>Mantra:</strong> "Cookies for auth (with security flags). LocalStorage for non-sensitive prefs. IndexedDB for offline data. Cache API for service worker requests. Never store secrets in localStorage."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>The web storage landscape</h3>
<table>
  <thead><tr><th>API</th><th>Sync/Async</th><th>Size</th><th>Type</th><th>Persistent</th><th>JS-readable</th></tr></thead>
  <tbody>
    <tr><td>localStorage</td><td>Sync</td><td>~5MB</td><td>String</td><td>Yes</td><td>Yes</td></tr>
    <tr><td>sessionStorage</td><td>Sync</td><td>~5MB</td><td>String</td><td>Tab-only</td><td>Yes</td></tr>
    <tr><td>Cookies</td><td>Sync (read)</td><td>~4KB / cookie</td><td>String</td><td>Configurable</td><td>If not HttpOnly</td></tr>
    <tr><td>IndexedDB</td><td>Async</td><td>Large (depends)</td><td>Structured</td><td>Yes</td><td>Yes</td></tr>
    <tr><td>Cache API</td><td>Async (Promises)</td><td>Large</td><td>Request/Response</td><td>Yes</td><td>Service worker</td></tr>
    <tr><td>OPFS</td><td>Async</td><td>Very large</td><td>File-like</td><td>Yes</td><td>Yes (in worker)</td></tr>
  </tbody>
</table>

<h3>The "where to put what" decision</h3>
<table>
  <thead><tr><th>Data</th><th>Best storage</th></tr></thead>
  <tbody>
    <tr><td>Auth token (web)</td><td>HttpOnly cookie</td></tr>
    <tr><td>Auth token (mobile RN)</td><td>Keychain (iOS) / Keystore (Android)</td></tr>
    <tr><td>UI preferences (theme, sidebar)</td><td>localStorage</td></tr>
    <tr><td>Form draft</td><td>sessionStorage (tab-scoped) or localStorage</td></tr>
    <tr><td>Recently viewed items</td><td>localStorage</td></tr>
    <tr><td>Offline notes / drafts</td><td>IndexedDB</td></tr>
    <tr><td>Cached API responses</td><td>Cache API (service worker) or IndexedDB</td></tr>
    <tr><td>Large media files</td><td>IndexedDB or OPFS</td></tr>
    <tr><td>CSRF token</td><td>Cookie (readable) + custom header pattern</td></tr>
    <tr><td>Server session ID</td><td>HttpOnly cookie</td></tr>
  </tbody>
</table>

<h3>Why so many storage APIs</h3>
<p>Each fills a niche. Cookies sent with requests; localStorage easy synchronous read; IndexedDB for big structured data; Cache API for service worker offline mode. They've evolved over decades; web platform doesn't deprecate easily.</p>

<h3>Why interviewers ask</h3>
<ol>
  <li>Storage is where many security bugs originate (tokens in localStorage).</li>
  <li>Tests architectural reasoning — "where does this data live?"</li>
  <li>Mobile-relevance: offline support, persistence, secure storage.</li>
  <li>Performance: synchronous vs asynchronous storage matters.</li>
</ol>

<h3>What "good" looks like</h3>
<ul>
  <li>Auth tokens never in localStorage / sessionStorage.</li>
  <li>You categorize data by sensitivity, size, lifetime.</li>
  <li>You handle quota errors gracefully.</li>
  <li>You sync state across tabs when needed (StorageEvent).</li>
  <li>You use IndexedDB for any data &gt;100KB or non-string.</li>
  <li>You use Cache API for service worker offline support.</li>
  <li>You request persistent storage for offline-first apps.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>Origin + partition</h3>
<p>All storage is keyed by <strong>origin</strong> (scheme + host + port). Different origins = different storage. <code>https://app.example.com</code> and <code>https://api.example.com</code> have separate localStorage / IndexedDB / cookies.</p>

<p>Modern browsers also <strong>partition</strong> third-party storage by top-level site (privacy feature). An iframe from <code>tracker.com</code> embedded in <code>news.com</code> gets storage scoped to <code>(tracker.com, news.com)</code> — different from when embedded in <code>blog.com</code>.</p>

<h3>localStorage / sessionStorage API</h3>
<pre><code class="language-js">// Synchronous; string-only
localStorage.setItem('theme', 'dark');
const theme = localStorage.getItem('theme');   // 'dark' or null
localStorage.removeItem('theme');
localStorage.clear();
localStorage.length;                            // count
localStorage.key(0);                            // get key by index

// Common pattern: JSON
localStorage.setItem('user', JSON.stringify(user));
const user = JSON.parse(localStorage.getItem('user') ?? 'null');
</code></pre>

<h3>The localStorage XSS risk</h3>
<p>If your site has any XSS vulnerability, attacker JS reads localStorage and exfiltrates tokens. HttpOnly cookies are immune (JS can't read). For sessions: cookies. For non-sensitive: localStorage is fine.</p>

<h3>Cross-tab sync via StorageEvent</h3>
<pre><code class="language-js">// Listen for changes from OTHER tabs (not the current one)
window.addEventListener('storage', (e) =&gt; {
  console.log(e.key, e.oldValue, e.newValue, e.storageArea);
});

// Triggered by setItem/removeItem/clear in OTHER tabs of same origin
</code></pre>

<h3>BroadcastChannel for cross-tab messaging</h3>
<pre><code class="language-js">// Send message to all tabs of same origin
const bc = new BroadcastChannel('app-events');
bc.postMessage({ type: 'logout' });

// Receive
bc.onmessage = (e) =&gt; console.log(e.data);
bc.close();
</code></pre>

<h3>Cookies basics</h3>
<pre><code class="language-js">// Set
document.cookie = 'theme=dark; Path=/; SameSite=Lax; Max-Age=31536000';

// Read (all cookies as one string)
document.cookie;   // "theme=dark; consent=true"

// Delete
document.cookie = 'theme=; Path=/; Max-Age=0';

// Helper
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}
</code></pre>

<h3>Cookie attributes</h3>
<table>
  <thead><tr><th>Attribute</th><th>Effect</th></tr></thead>
  <tbody>
    <tr><td>Domain=example.com</td><td>Send to example.com + subdomains</td></tr>
    <tr><td>Path=/api</td><td>Only sent for /api/* URLs</td></tr>
    <tr><td>Max-Age=N</td><td>Expires in N seconds</td></tr>
    <tr><td>Expires=&lt;date&gt;</td><td>Absolute expiration</td></tr>
    <tr><td>Secure</td><td>HTTPS only</td></tr>
    <tr><td>HttpOnly</td><td>JS can't read</td></tr>
    <tr><td>SameSite=Strict | Lax | None</td><td>Cross-site request behavior</td></tr>
    <tr><td>__Host-prefix</td><td>Implies Secure + Path=/ + no Domain</td></tr>
  </tbody>
</table>

<h3>IndexedDB mental model</h3>
<p>NoSQL document database in the browser. Data is organized into:</p>
<ul>
  <li><strong>Database</strong> (versioned)</li>
  <li><strong>Object stores</strong> (like tables)</li>
  <li><strong>Indexes</strong> (for non-key lookups)</li>
  <li><strong>Records</strong> (key + value, value can be any structured-cloneable data: objects, arrays, Blobs, Files)</li>
</ul>

<pre><code class="language-js">// Open / create
const req = indexedDB.open('myDB', 1);   // version 1
req.onupgradeneeded = (e) =&gt; {
  const db = e.target.result;
  const store = db.createObjectStore('users', { keyPath: 'id' });
  store.createIndex('by-email', 'email', { unique: true });
};
req.onsuccess = (e) =&gt; useDb(e.target.result);
</code></pre>

<p>Modern wrappers: <code>idb</code> (Promise-based), Dexie (richer API). Use them — raw IndexedDB API is verbose.</p>

<h3>Cache API (service workers)</h3>
<pre><code class="language-js">// In a service worker
self.addEventListener('install', (event) =&gt; {
  event.waitUntil(
    caches.open('shell-v1').then((cache) =&gt;
      cache.addAll(['/', '/main.css', '/app.js'])
    )
  );
});

self.addEventListener('fetch', (event) =&gt; {
  event.respondWith(
    caches.match(event.request).then((cached) =&gt; cached || fetch(event.request))
  );
});
</code></pre>

<h3>Quota and persistence</h3>
<pre><code class="language-js">// Estimate usage / quota
const { usage, quota } = await navigator.storage.estimate();
console.log(\`Using \${usage} of \${quota} bytes\`);

// Request persistent storage (won't be evicted)
const persistent = await navigator.storage.persist();
console.log('Persistent:', persistent);

// Check
const isPersisted = await navigator.storage.persisted();
</code></pre>

<h3>OPFS (Origin Private File System)</h3>
<p>Modern API for app-internal file storage. Like IndexedDB but with file-like semantics. Available in workers; great for large binary data, sqlite-in-browser, etc.</p>

<pre><code class="language-js">// In a worker
const root = await navigator.storage.getDirectory();
const fileHandle = await root.getFileHandle('data.bin', { create: true });
const writable = await fileHandle.createWritable();
await writable.write(new Uint8Array([1, 2, 3]));
await writable.close();

// Read
const file = await fileHandle.getFile();
const buf = await file.arrayBuffer();
</code></pre>

<h3>The "third-party storage partitioning" change</h3>
<p>Modern browsers (Safari 16.1+, Firefox 103+, Chrome 116+) partition storage for third-party iframes by the top-level site. Tracking via cross-site cookies is significantly reduced.</p>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Wrapping localStorage with type safety</h3>
<pre><code class="language-ts">function getStored&lt;T&gt;(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStored&lt;T&gt;(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // QuotaExceededError or other
    console.warn('Failed to store:', e);
  }
}

// Usage
const theme = getStored&lt;'light' | 'dark'&gt;('theme', 'light');
setStored('theme', 'dark');
</code></pre>

<h3>useLocalStorage hook (React)</h3>
<pre><code class="language-tsx">function useLocalStorage&lt;T&gt;(key: string, initial: T) {
  const [value, setValue] = useState&lt;T&gt;(() =&gt; {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() =&gt; {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);

  return [value, setValue] as const;
}
</code></pre>

<h3>Cross-tab sync</h3>
<pre><code class="language-tsx">function useSyncedStorage&lt;T&gt;(key: string, initial: T) {
  const [value, setValue] = useLocalStorage(key, initial);

  useEffect(() =&gt; {
    function onStorage(e: StorageEvent) {
      if (e.key === key &amp;&amp; e.newValue !== null) {
        try { setValue(JSON.parse(e.newValue)); } catch {}
      }
    }
    window.addEventListener('storage', onStorage);
    return () =&gt; window.removeEventListener('storage', onStorage);
  }, [key]);

  return [value, setValue] as const;
}
</code></pre>

<h3>IndexedDB with idb library</h3>
<pre><code class="language-bash">yarn add idb
</code></pre>
<pre><code class="language-ts">import { openDB } from 'idb';

const dbPromise = openDB('mydb', 1, {
  upgrade(db) {
    const store = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
    store.createIndex('by-date', 'createdAt');
  },
});

async function addNote(note: Note) {
  const db = await dbPromise;
  return db.add('notes', note);
}

async function getNotes() {
  const db = await dbPromise;
  return db.getAllFromIndex('notes', 'by-date');
}

async function getNote(id: number) {
  const db = await dbPromise;
  return db.get('notes', id);
}

async function deleteNote(id: number) {
  const db = await dbPromise;
  return db.delete('notes', id);
}
</code></pre>

<h3>Transactions in IndexedDB</h3>
<pre><code class="language-ts">async function transferBalance(fromId: number, toId: number, amount: number) {
  const db = await dbPromise;
  const tx = db.transaction('accounts', 'readwrite');
  const store = tx.objectStore('accounts');

  const from = await store.get(fromId);
  const to = await store.get(toId);

  if (from.balance &lt; amount) throw new Error('Insufficient');

  from.balance -= amount;
  to.balance += amount;

  await store.put(from);
  await store.put(to);
  await tx.done;
}
</code></pre>

<h3>Upgrade IndexedDB schema</h3>
<pre><code class="language-ts">openDB('mydb', 2, {
  upgrade(db, oldVersion, newVersion, tx) {
    if (oldVersion &lt; 1) {
      db.createObjectStore('users', { keyPath: 'id' });
    }
    if (oldVersion &lt; 2) {
      const store = tx.objectStore('users');
      store.createIndex('by-email', 'email', { unique: true });
    }
  },
});
</code></pre>

<h3>Persistent storage request</h3>
<pre><code class="language-ts">async function ensurePersistent() {
  if (navigator.storage &amp;&amp; navigator.storage.persist) {
    const isPersisted = await navigator.storage.persisted();
    if (!isPersisted) {
      const result = await navigator.storage.persist();
      console.log('Persistent storage:', result);
    }
  }
}
</code></pre>

<h3>Service worker cache strategies</h3>
<pre><code class="language-js">// 1. Cache First — for shell assets
self.addEventListener('fetch', (event) =&gt; {
  if (event.request.url.match(/\\.(css|js|woff2?)$/)) {
    event.respondWith(
      caches.match(event.request).then(cached =&gt; cached || fetch(event.request))
    );
  }
});

// 2. Network First — for HTML / API
event.respondWith(
  fetch(event.request).catch(() =&gt; caches.match(event.request))
);

// 3. Stale While Revalidate
event.respondWith(
  caches.open('api').then(cache =&gt;
    cache.match(event.request).then(cached =&gt; {
      const fetched = fetch(event.request).then(r =&gt; {
        cache.put(event.request, r.clone());
        return r;
      });
      return cached || fetched;
    })
  )
);
</code></pre>

<h3>BroadcastChannel for sync</h3>
<pre><code class="language-js">// Setup
const bc = new BroadcastChannel('auth');

// On logout in any tab
bc.postMessage({ type: 'logout' });

// Listen in all tabs
bc.onmessage = (e) =&gt; {
  if (e.data.type === 'logout') {
    redirectToLogin();
  }
};

bc.close();   // when no longer needed
</code></pre>

<h3>SharedArrayBuffer + worker shared memory</h3>
<p>Advanced: shared memory between main thread and workers. Requires <code>Cross-Origin-Opener-Policy: same-origin</code> + <code>Cross-Origin-Embedder-Policy: require-corp</code>. Used for performance-critical apps (video editors, games).</p>

<h3>Origin Private File System</h3>
<pre><code class="language-js">// Inside a Web Worker
const root = await navigator.storage.getDirectory();
const dir = await root.getDirectoryHandle('logs', { create: true });
const file = await dir.getFileHandle('today.log', { create: true });

// Append data
const writable = await file.createWritable({ keepExistingData: true });
await writable.seek((await file.getFile()).size);
await writable.write('new line\\n');
await writable.close();
</code></pre>

<h3>Storage size budgets</h3>
<table>
  <thead><tr><th>API</th><th>Typical limits</th></tr></thead>
  <tbody>
    <tr><td>localStorage / sessionStorage</td><td>5-10MB per origin (browser-defined)</td></tr>
    <tr><td>Cookies</td><td>~4KB / cookie; ~50 cookies / domain; total ~8KB / request</td></tr>
    <tr><td>IndexedDB</td><td>"Best effort" — typically a fraction of disk; can be 100s of MB to GB</td></tr>
    <tr><td>Cache API</td><td>Same as IndexedDB; shared quota</td></tr>
    <tr><td>OPFS</td><td>Same shared quota</td></tr>
  </tbody>
</table>

<h3>Quota exceeded</h3>
<pre><code class="language-ts">try {
  localStorage.setItem('big', JSON.stringify(hugeObject));
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    // Free up space or fall back
    localStorage.clear();
  }
}
</code></pre>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Theme persistence</h3>
<pre><code class="language-tsx">function useTheme() {
  const [theme, setTheme] = useLocalStorage&lt;'light' | 'dark' | 'auto'&gt;('theme', 'auto');

  useEffect(() =&gt; {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return [theme, setTheme] as const;
}
</code></pre>

<h3>Example 2: Form draft auto-save</h3>
<pre><code class="language-tsx">function useDraft&lt;T&gt;(key: string, initial: T) {
  const [draft, setDraft] = useState&lt;T&gt;(() =&gt; {
    const saved = sessionStorage.getItem(key);
    return saved ? JSON.parse(saved) : initial;
  });

  useEffect(() =&gt; {
    sessionStorage.setItem(key, JSON.stringify(draft));
  }, [key, draft]);

  function clearDraft() {
    sessionStorage.removeItem(key);
    setDraft(initial);
  }

  return [draft, setDraft, clearDraft] as const;
}
</code></pre>

<h3>Example 3: Logout sync across tabs</h3>
<pre><code class="language-tsx">const authChannel = new BroadcastChannel('auth');

function logout() {
  // Server-side
  fetch('/api/logout', { method: 'POST' });
  // Local state
  localStorage.removeItem('user');
  // Broadcast to other tabs
  authChannel.postMessage({ type: 'logout' });
  navigate('/login');
}

// In root component
useEffect(() =&gt; {
  authChannel.onmessage = (e) =&gt; {
    if (e.data.type === 'logout') {
      navigate('/login');
    }
  };
}, []);
</code></pre>

<h3>Example 4: Offline drafts in IndexedDB</h3>
<pre><code class="language-ts">import { openDB } from 'idb';

const draftsDB = openDB('drafts', 1, {
  upgrade(db) {
    db.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
  }
});

async function saveDraft(content: string) {
  const db = await draftsDB;
  return db.add('items', { content, createdAt: Date.now(), synced: false });
}

async function syncPendingDrafts() {
  const db = await draftsDB;
  const all = await db.getAll('items');
  const pending = all.filter(d =&gt; !d.synced);

  for (const draft of pending) {
    try {
      await fetch('/api/drafts', { method: 'POST', body: JSON.stringify(draft) });
      draft.synced = true;
      await db.put('items', draft);
    } catch {
      // network failure; will retry next sync
      break;
    }
  }
}

window.addEventListener('online', syncPendingDrafts);
</code></pre>

<h3>Example 5: Service worker offline shell</h3>
<pre><code class="language-js">// sw.js
const CACHE = 'shell-v1';
const ASSETS = ['/', '/main.css', '/app.js', '/offline.html'];

self.addEventListener('install', (event) =&gt; {
  event.waitUntil(caches.open(CACHE).then(c =&gt; c.addAll(ASSETS)));
});

self.addEventListener('activate', (event) =&gt; {
  event.waitUntil(
    caches.keys().then(names =&gt;
      Promise.all(names.filter(n =&gt; n !== CACHE).map(n =&gt; caches.delete(n)))
    )
  );
});

self.addEventListener('fetch', (event) =&gt; {
  if (event.request.mode === 'navigate') {
    // Network first for HTML; fallback to offline page
    event.respondWith(
      fetch(event.request).catch(() =&gt; caches.match('/offline.html'))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(cached =&gt; cached || fetch(event.request))
    );
  }
});
</code></pre>

<h3>Example 6: API response caching with TTL</h3>
<pre><code class="language-ts">type CacheEntry&lt;T&gt; = { data: T; expires: number };

const apiCache = new Map&lt;string, CacheEntry&lt;any&gt;&gt;();

async function cachedFetch&lt;T&gt;(url: string, ttl: number = 60_000): Promise&lt;T&gt; {
  const now = Date.now();
  const cached = apiCache.get(url);
  if (cached &amp;&amp; cached.expires &gt; now) return cached.data;

  const r = await fetch(url);
  const data = await r.json();
  apiCache.set(url, { data, expires: now + ttl });
  return data;
}
</code></pre>

<h3>Example 7: localStorage quota check</h3>
<pre><code class="language-ts">async function safeStore(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (e: any) {
    if (e.name === 'QuotaExceededError') {
      // Evict oldest entries
      const keys = Object.keys(localStorage).filter(k =&gt; k.startsWith('cache:'));
      const oldest = keys[0];   // could be smarter
      if (oldest) localStorage.removeItem(oldest);
      try {
        localStorage.setItem(key, value);
      } catch {}
    }
  }
}
</code></pre>

<h3>Example 8: Full-text search in IndexedDB</h3>
<pre><code class="language-ts">const db = await openDB('search', 1, {
  upgrade(db) {
    const store = db.createObjectStore('docs', { keyPath: 'id' });
    store.createIndex('by-content', 'tokens', { multiEntry: true });
  }
});

async function indexDoc(id: string, text: string) {
  const tokens = text.toLowerCase().split(/\\W+/).filter(Boolean);
  await db.put('docs', { id, text, tokens });
}

async function search(query: string) {
  const tx = db.transaction('docs');
  const store = tx.objectStore('docs');
  const idx = store.index('by-content');
  const tokens = query.toLowerCase().split(/\\W+/);
  const results = new Map();
  for (const token of tokens) {
    const matches = await idx.getAll(token);
    for (const m of matches) {
      results.set(m.id, (results.get(m.id) ?? 0) + 1);
    }
  }
  return [...results.entries()].sort((a, b) =&gt; b[1] - a[1]).map(e =&gt; e[0]);
}
</code></pre>

<h3>Example 9: Persistent storage for offline-first app</h3>
<pre><code class="language-tsx">function App() {
  useEffect(() =&gt; {
    if (navigator.storage?.persist) {
      navigator.storage.persisted().then(p =&gt; {
        if (!p) navigator.storage.persist();
      });
    }
  }, []);

  return &lt;Routes /&gt;;
}
</code></pre>

<h3>Example 10: OPFS for large file processing</h3>
<pre><code class="language-js">// In a worker
async function downloadAndProcess(url) {
  const root = await navigator.storage.getDirectory();
  const file = await root.getFileHandle('big.bin', { create: true });
  const writable = await file.createWritable();

  const response = await fetch(url);
  const reader = response.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    await writable.write(value);
  }
  await writable.close();

  // Now process the file
  const fileObj = await file.getFile();
  // ... read in chunks, process
}
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Private browsing / incognito</h3>
<p>Some browsers allow localStorage in private mode but clear on tab close; some throw on setItem. Always wrap in try/catch.</p>

<h3>QuotaExceededError</h3>
<p>Thrown when you exceed the per-origin limit (~5MB for localStorage). Catch and fall back gracefully.</p>

<h3>Same-origin policy applied strictly</h3>
<p>Different protocol = different origin. <code>http://example.com</code> ≠ <code>https://example.com</code>. Migrating http → https loses storage.</p>

<h3>Subdomain cookie scope</h3>
<p>Cookie set on <code>example.com</code> with no Domain attribute is sent only to <code>example.com</code> exactly. With <code>Domain=example.com</code>, sent to subdomains too. <code>__Host-</code> prefix forces no-Domain (most secure).</p>

<h3>Cookie size limits per request</h3>
<p>Total cookie size in a request limited (~8KB). Putting JWTs in cookies can blow this; use HttpOnly session ID (small) + server-side session lookup.</p>

<h3>localStorage SSR</h3>
<p>Server-rendering reads localStorage during render → ReferenceError (window not defined). Guard with <code>typeof window !== 'undefined'</code> or move reads to useEffect.</p>

<h3>localStorage eviction</h3>
<p>Browsers may evict origins under storage pressure. Without persistent permission, your data can vanish. Request persistence for offline-first apps.</p>

<h3>IndexedDB transactions auto-commit</h3>
<p>If a transaction is idle (no pending requests), it commits. Don't <code>await</code> non-IDB Promises inside a transaction — break it into smaller transactions.</p>

<h3>StorageEvent doesn't fire in same tab</h3>
<p>Setting localStorage in tab A doesn't fire <code>storage</code> event in A; only in B, C, ... Use BroadcastChannel for same-tab notification.</p>

<h3>JSON.stringify with circular references</h3>
<p>Throws TypeError. Sanitize before saving:</p>
<pre><code class="language-js">JSON.stringify(obj, (key, value) =&gt; {
  if (typeof value === 'object' &amp;&amp; value !== null &amp;&amp; seen.has(value)) return '[circular]';
  seen.add(value);
  return value;
});
</code></pre>

<h3>localStorage event from same origin only</h3>
<p>Cross-origin iframes' storage events don't propagate. Storage isolation prevents leaks but also limits coordination.</p>

<h3>Service worker scope</h3>
<p>SW registered at <code>/sw.js</code> controls <code>/</code> and below. Subpath SWs (<code>/app/sw.js</code>) only see <code>/app/*</code>.</p>

<h3>SW + caches: cache deletion</h3>
<p>Old caches stay until explicitly deleted. Use a versioned cache name (<code>shell-v1</code>) and clean up old versions in <code>activate</code>.</p>

<h3>Cookie decoding</h3>
<p>Cookies may contain URL-encoded values. <code>decodeURIComponent</code> when reading; encode when setting.</p>

<h3>IndexedDB async cancellation</h3>
<p>No way to cancel a transaction once started. Long-running transactions block other writes.</p>

<h3>Cross-tab race conditions</h3>
<p>Two tabs both write to localStorage simultaneously. Last writer wins; you may lose data. For coordination, use BroadcastChannel + locks, or treat localStorage as eventually consistent.</p>

<h3>Web Locks API</h3>
<pre><code class="language-js">await navigator.locks.request('my-lock', async (lock) =&gt; {
  // exclusive access in this scope
  const data = JSON.parse(localStorage.getItem('shared') ?? '{}');
  data.counter++;
  localStorage.setItem('shared', JSON.stringify(data));
});
</code></pre>

<h3>Storage in Web Workers</h3>
<p>localStorage NOT available in workers. Use IndexedDB or Cache API. Or postMessage to the main thread.</p>

<h3>Cache API key matching</h3>
<p>Cache.match() matches by URL by default. Use <code>{ ignoreSearch: true }</code> to ignore query params; <code>{ ignoreVary: true }</code> to ignore Vary header.</p>

<h3>SharedWorker storage</h3>
<p>Shared workers can access IndexedDB; multiple tabs share the same worker. Useful for centralized data sync.</p>

<h3>Storage events with different origins</h3>
<p>Iframes from different origins each have their own storage. Postmessage between them, not via shared storage.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: Auth token in localStorage</h3>
<p>XSS reads it; attacker exfiltrates. Use HttpOnly cookies or in-memory + refresh token.</p>

<h3>Bug 2: Forgetting to JSON.parse</h3>
<pre><code class="language-js">const user = localStorage.getItem('user');
console.log(user.name);   // undefined — user is a string
// FIX
const user = JSON.parse(localStorage.getItem('user') ?? 'null');
</code></pre>

<h3>Bug 3: localStorage SSR crash</h3>
<pre><code class="language-jsx">function App() {
  const theme = localStorage.getItem('theme');   // ReferenceError on server
  return ...;
}

// FIX
const theme = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
// Or read in useEffect
</code></pre>

<h3>Bug 4: Mutating cached object</h3>
<pre><code class="language-js">const cached = JSON.parse(localStorage.getItem('user'));
cached.name = 'New';
// localStorage NOT updated; only the in-memory copy

// FIX
cached.name = 'New';
localStorage.setItem('user', JSON.stringify(cached));
</code></pre>

<h3>Bug 5: Quota exceeded silently fails</h3>
<pre><code class="language-js">try {
  localStorage.setItem('big', huge);
} catch {}
// data not saved; no warning
// FIX — log; clear stale entries; use IndexedDB for bigger
</code></pre>

<h3>Bug 6: Cross-tab sync via setTimeout polling</h3>
<pre><code class="language-js">// BAD — wasteful
setInterval(() =&gt; checkLocalStorage(), 1000);

// GOOD
window.addEventListener('storage', onStorage);
// or BroadcastChannel
</code></pre>

<h3>Bug 7: IndexedDB with no error handling</h3>
<pre><code class="language-js">const req = indexedDB.open('db', 1);
req.onsuccess = (e) =&gt; { /* use it */ };
// missing onerror, onblocked
</code></pre>

<h3>Bug 8: Cookie without security flags</h3>
<pre><code class="language-text">Set-Cookie: session=abc
// Sent over HTTP, readable by JS, sent cross-site

// FIX
Set-Cookie: session=abc; Path=/; Secure; HttpOnly; SameSite=Lax
</code></pre>

<h3>Bug 9: Storing PII in localStorage</h3>
<p>localStorage persists indefinitely; gets backed up; can be exfiltrated via XSS. Treat as public-ish.</p>

<h3>Bug 10: Service worker not waiting for cache</h3>
<pre><code class="language-js">self.addEventListener('install', () =&gt; {
  caches.open('v1').then(c =&gt; c.addAll(...));
  // missing event.waitUntil — install can complete before cache populated
});

// FIX
self.addEventListener('install', (event) =&gt; {
  event.waitUntil(caches.open('v1').then(c =&gt; c.addAll(...)));
});
</code></pre>

<h3>Anti-pattern 1: localStorage as a global state store</h3>
<p>Synchronous reads in render block the main thread. Use react state or context; sync to localStorage in useEffect for persistence.</p>

<h3>Anti-pattern 2: Using cookies for everything</h3>
<p>Cookies are sent with every request. Storing UI prefs in cookies adds bytes to every request. Use localStorage.</p>

<h3>Anti-pattern 3: Reinventing IndexedDB</h3>
<p>Building "my own database" with localStorage + JSON. Hits quotas fast; no querying. Use IndexedDB.</p>

<h3>Anti-pattern 4: Sync work in service worker</h3>
<p>Service workers wake briefly; long sync work delays activation. Use IndexedDB for state; do work asynchronously.</p>

<h3>Anti-pattern 5: Caching everything</h3>
<p>Service worker caches every response; cache grows; old data lingers. Use cache strategies (cache-first, network-first, SWR) per resource type.</p>

<h3>Anti-pattern 6: Skipping persistence request</h3>
<p>Offline-first apps without <code>navigator.storage.persist()</code> may have data evicted under disk pressure.</p>

<h3>Anti-pattern 7: Storage in main thread for big data</h3>
<p>Loading 100MB into memory blocks the page. Use IndexedDB streaming reads or OPFS in a worker.</p>

<h3>Anti-pattern 8: Migrations not handled</h3>
<p>localStorage shape changes between app versions. New code reads old shape → crash. Always version your stored data:</p>
<pre><code class="language-js">{ version: 2, data: { ... } }
</code></pre>

<h3>Anti-pattern 9: Cookie consent ignored</h3>
<p>EU GDPR / ePrivacy require consent for non-essential cookies. Storing user preferences before consent is set = potential violation.</p>

<h3>Anti-pattern 10: Encryption in localStorage</h3>
<p>Encrypting client-side data with a key stored client-side gives almost no security; XSS reads the key. If data needs to be secret, don't store it client-side.</p>
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
    <tr><td><em>localStorage vs sessionStorage?</em></td><td>localStorage persists; sessionStorage is tab-scoped.</td></tr>
    <tr><td><em>Where to store auth tokens?</em></td><td>HttpOnly cookies; not localStorage (XSS-vulnerable).</td></tr>
    <tr><td><em>localStorage vs cookies vs IndexedDB?</em></td><td>localStorage: small, sync, string. Cookies: auth, sent with requests. IndexedDB: large, async, structured.</td></tr>
    <tr><td><em>What's the Cache API?</em></td><td>Service worker request/response cache; programmable HTTP caching.</td></tr>
    <tr><td><em>How do you sync across tabs?</em></td><td>StorageEvent (passive) or BroadcastChannel (active).</td></tr>
    <tr><td><em>What's persistent storage?</em></td><td>navigator.storage.persist() — request that browser not evict your data under pressure.</td></tr>
    <tr><td><em>Cookie security flags?</em></td><td>Secure, HttpOnly, SameSite, __Host-/__Secure- prefix.</td></tr>
    <tr><td><em>How does IndexedDB version?</em></td><td>Open with a version number; upgradeneeded fires for migration.</td></tr>
    <tr><td><em>What's storage partitioning?</em></td><td>Browsers partition third-party storage by top-level site for privacy.</td></tr>
    <tr><td><em>Cache strategies in service workers?</em></td><td>Cache-first (shell), network-first (HTML), stale-while-revalidate (API).</td></tr>
    <tr><td><em>What's OPFS?</em></td><td>Origin Private File System; high-perf file-like storage in workers.</td></tr>
    <tr><td><em>How do you handle storage quota?</em></td><td>Try/catch QuotaExceededError; evict stale; navigator.storage.estimate() for reporting.</td></tr>
  </tbody>
</table>

<h3>Live coding warmups</h3>
<ol>
  <li>Build a useLocalStorage hook with cross-tab sync.</li>
  <li>Set a cookie with all security flags.</li>
  <li>Set up an IndexedDB database with idb library.</li>
  <li>Write a service worker with cache-first for assets and SWR for API.</li>
  <li>Implement an offline drafts queue.</li>
  <li>Request persistent storage on app load.</li>
  <li>Listen for cross-tab logout events.</li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>JWT in localStorage — XSS-vulnerable; switch to HttpOnly cookie.</li>
  <li>JSON.parse without try/catch — bad data crashes.</li>
  <li>localStorage during SSR — guard with typeof window.</li>
  <li>Cookie missing Secure / HttpOnly — security failure.</li>
  <li>Service worker without event.waitUntil — race condition.</li>
  <li>BroadcastChannel without close — leak.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Storage taxonomy</td><td>You match data to the right API.</td></tr>
    <tr><td>Security awareness</td><td>You volunteer "tokens never in localStorage."</td></tr>
    <tr><td>IndexedDB fluency</td><td>You name idb / Dexie; you know about migrations.</td></tr>
    <tr><td>Service worker cache strategies</td><td>You name cache-first, network-first, stale-while-revalidate.</td></tr>
    <tr><td>Quota handling</td><td>You handle QuotaExceededError; you call navigator.storage.estimate.</td></tr>
    <tr><td>Cross-tab patterns</td><td>You know StorageEvent and BroadcastChannel.</td></tr>
    <tr><td>Persistence</td><td>You call persist() for offline-first apps.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li><strong>AsyncStorage</strong> = RN's localStorage equivalent (async, not sync). Default for non-sensitive data.</li>
  <li><strong>react-native-mmkv</strong> = synchronous + ~30× faster + encrypted. Preferred over AsyncStorage in 2026.</li>
  <li><strong>Keychain (iOS) / Keystore (Android)</strong> via react-native-keychain — for tokens, secrets.</li>
  <li><strong>SQLite via expo-sqlite or react-native-quick-sqlite</strong> — for relational data, full-text search.</li>
  <li><strong>WatermelonDB / RxDB</strong> — offline-first reactive databases on top of SQLite.</li>
  <li><strong>RN cookie jar</strong> — managed by native networking; fetch sets cookies automatically.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"Why is localStorage synchronous?"</em> — Historical decision; was simpler API. Modern alternatives (IndexedDB, OPFS) are async to prevent main-thread blocking.</li>
  <li><em>"What happens to localStorage when an origin runs out of quota?"</em> — setItem throws QuotaExceededError. Browsers may also evict less-recently-used origins under disk pressure.</li>
  <li><em>"Why use IndexedDB over localStorage for a list of 1000 items?"</em> — IndexedDB is async (no main thread block), supports indexes, holds binary data, larger quota, and structured queries.</li>
  <li><em>"How does service worker cache differ from HTTP cache?"</em> — HTTP cache is browser-managed; SW cache is JS-controlled. SW can implement custom strategies (offline-first, network-first); HTTP cache obeys headers only.</li>
  <li><em>"Why does Safari clear localStorage after 7 days of inactivity?"</em> — Intelligent Tracking Prevention treats long-lived storage as a tracking signal. Persistent storage isn't covered; cookies have separate rules.</li>
  <li><em>"What's the relationship between Cache API and HTTP cache?"</em> — Independent. Cache API is per-origin programmable storage; HTTP cache is the standard browser cache. SW intercepts fetch and decides which to use.</li>
</ul>

<h3>"What I'd do day one on the team"</h3>
<ul>
  <li>Audit localStorage / cookies for sensitive data.</li>
  <li>Verify cookie security flags on all auth-related cookies.</li>
  <li>Look for offline support — is data in IndexedDB?</li>
  <li>Check service worker (if any) cache strategies.</li>
  <li>Verify persistent storage is requested for offline-first.</li>
  <li>Add quota error handling.</li>
  <li>Document storage decisions for the team.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd migrate offline drafts from localStorage to IndexedDB for scale and async."</li>
  <li>"I'd evaluate OPFS for our log-buffer needs (we currently chunk to localStorage)."</li>
  <li>"I'd add Web Locks for shared writes across tabs to avoid race conditions."</li>
  <li>"I'd write a small storage migration framework so schema changes are versioned."</li>
  <li>"I'd integrate Workbox for our service worker cache strategies — battle-tested."</li>
</ul>
`
    }
  ]
});
