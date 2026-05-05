window.PREP_SITE.registerTopic({
  id: 'off-idb',
  module: 'offline',
  title: 'IndexedDB Strategies',
  estimatedReadTime: '50 min',
  tags: ['indexeddb', 'idb', 'offline', 'storage', 'dexie', 'idb-keyval', 'transactions', 'versioning', 'sync'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p><strong>IndexedDB (IDB)</strong> is the browser's native, structured, transactional, offline-friendly database — a key-value store with secondary indexes, schema migrations, and large quotas (typically hundreds of MB to GBs). It's what you reach for when localStorage isn't enough: structured records, queryable indexes, large data, async access from a Service Worker.</p>
<ul>
  <li><strong>It's a real database in the browser.</strong> Object stores (≈ tables), indexes (≈ secondary indexes), transactions (ACID within a database), versioning, cursors.</li>
  <li><strong>Async + event-driven by default.</strong> Raw API is awkward; almost always wrap with <strong>idb</strong> (Promise wrapper) or <strong>Dexie</strong> (full ORM) or <strong>idb-keyval</strong> (simple kv).</li>
  <li><strong>Quotas:</strong> Chrome ~60% of disk; Firefox ~50%; Safari ~1GB then user-prompted. Persistence is best-effort; <code>navigator.storage.persist()</code> elevates.</li>
  <li><strong>Versioning:</strong> schema changes happen in an <code>onupgradeneeded</code> handler; runs once per browser; old DBs migrate forward.</li>
  <li><strong>Transactions are scoped:</strong> read-only or readwrite; auto-commit when no further work queued; can't span async work outside the IDB request chain.</li>
  <li><strong>Use cases:</strong> offline-first app data, queued mutations, full-text search index, large blobs (files, images), cached API responses keyed by URL.</li>
  <li><strong>Don't use IDB for:</strong> small flags / settings (use localStorage), session data (memory), encryption-required data (use crypto + IDB).</li>
  <li><strong>RN parallel:</strong> MMKV / SQLite / WatermelonDB. IDB knowledge transfers to thinking about offline-first stores generally.</li>
</ul>
<p><strong>Mantra:</strong> "It's a real database. Use a wrapper. Version your schema. Plan migrations. Persist deliberately."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What IndexedDB is</h3>
<p>A browser-built-in database that stores structured JS objects (and Blobs, Files, ArrayBuffers) in <strong>object stores</strong>. Each store has a primary key (in-line, out-of-line, or auto-incremented) and zero or more <strong>indexes</strong> over its fields for queryable lookup. Multiple databases can exist per origin; each database has multiple stores.</p>

<h3>The four pillars of IDB</h3>
<table>
  <thead><tr><th>Pillar</th><th>What it gives you</th></tr></thead>
  <tbody>
    <tr><td>Async I/O</td><td>Doesn't block the UI thread; works in Service Workers, Web Workers, and pages.</td></tr>
    <tr><td>Transactions</td><td>Atomic operations across multiple stores; auto-rollback on error.</td></tr>
    <tr><td>Indexes</td><td>Query by any indexed field; cursor for streaming over large result sets.</td></tr>
    <tr><td>Versioning</td><td>Schema migrations as the database structure evolves.</td></tr>
  </tbody>
</table>

<h3>Why IDB is unique among browser storage</h3>
<table>
  <thead><tr><th>Storage</th><th>Capacity</th><th>Sync/Async</th><th>Type</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td>localStorage</td><td>~5MB</td><td>Sync (blocks UI)</td><td>String key/value</td><td>Tiny flags, theme, user prefs</td></tr>
    <tr><td>sessionStorage</td><td>~5MB</td><td>Sync</td><td>String key/value</td><td>Per-tab session state</td></tr>
    <tr><td>Cookies</td><td>~4KB each</td><td>Sync, sent on every request</td><td>String</td><td>Auth tokens, server-side state</td></tr>
    <tr><td>Cache API</td><td>Bound by quota</td><td>Async</td><td>Request → Response</td><td>HTTP-style caching in SW</td></tr>
    <tr><td>IndexedDB</td><td>Bound by quota (large)</td><td>Async</td><td>Structured records + indexes</td><td>App data, queues, search indexes</td></tr>
    <tr><td>OPFS (Origin Private File System)</td><td>Bound by quota</td><td>Async (sync in worker)</td><td>File-based</td><td>SQLite-in-browser, large blobs</td></tr>
  </tbody>
</table>

<h3>Why use IDB at all</h3>
<ul>
  <li><strong>Offline-first:</strong> data persists; users see content with zero network.</li>
  <li><strong>Performance:</strong> reading 10k records from IDB is ~100ms; from network ~seconds.</li>
  <li><strong>Reduce server load:</strong> client-side filtering / sorting / paginating saves backend cycles.</li>
  <li><strong>Reliable queues:</strong> mutations made offline survive page reload, crash, browser restart.</li>
  <li><strong>Large media:</strong> image / video / file caching beyond what cookies + localStorage allow.</li>
  <li><strong>Available in Service Workers:</strong> SW can read/write IDB to handle fetch / push / sync events.</li>
</ul>

<h3>Why people avoid IDB</h3>
<ul>
  <li><strong>The raw API is hostile:</strong> event-based, no Promises out of the box, transaction lifecycle traps.</li>
  <li><strong>Schema migrations are scary:</strong> you can't easily test in production; bugs persist for users until you ship a fix.</li>
  <li><strong>Quota eviction:</strong> browser may delete data under storage pressure; can't fully prevent.</li>
  <li><strong>No SQL:</strong> no JOINs, no ad-hoc queries; you index ahead of time or scan.</li>
  <li><strong>Cross-tab coordination:</strong> two tabs writing the same DB need locking discipline.</li>
</ul>

<h3>What "good IDB usage" looks like</h3>
<ul>
  <li>Wrapped with idb / Dexie / idb-keyval; raw API only when learning.</li>
  <li>Schema versioned; <code>onupgradeneeded</code> handles forward migrations.</li>
  <li>Indexes deliberately chosen for the queries you actually run.</li>
  <li>Transactions narrow: read-only when reading, readwrite only when needed.</li>
  <li>Persistence requested: <code>navigator.storage.persist()</code> after engagement signal.</li>
  <li>Quota monitored: <code>navigator.storage.estimate()</code> on app boot, surfacing at 80%.</li>
  <li>Encryption: sensitive data encrypted via WebCrypto before storing.</li>
  <li>Mutations queue with idempotency keys; flush on reconnect.</li>
</ul>

<h3>What "bad IDB usage" looks like</h3>
<ul>
  <li>Hand-rolled event handlers; broken on the second feature.</li>
  <li>One giant store with all data mixed; no indexes; queries become full scans.</li>
  <li>Schema migrations skipped; old user data unreadable.</li>
  <li>Transactions awaited across unrelated promises (auto-closes mid-transaction).</li>
  <li>localStorage used for 5MB+ of structured data (blocks UI).</li>
  <li>Sensitive data stored unencrypted.</li>
  <li>No quota check; browser silently evicts under pressure; users lose work.</li>
  <li>Reactive UI re-querying IDB on every render instead of caching in memory.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The hierarchy</h3>
<pre><code class="language-text">Origin (https://example.com)
  └─ Database (e.g., "myapp")
      ├─ Object Store (e.g., "users")
      │   ├─ Primary key (e.g., id)
      │   ├─ Indexes (e.g., by-email, by-createdAt)
      │   └─ Records {id, name, email, createdAt, ...}
      ├─ Object Store (e.g., "posts")
      └─ Object Store (e.g., "queue")
</code></pre>

<h3>Object stores ≈ tables</h3>
<table>
  <thead><tr><th>SQL concept</th><th>IDB concept</th></tr></thead>
  <tbody>
    <tr><td>Table</td><td>Object store</td></tr>
    <tr><td>Row</td><td>Record (any JS-serializable object)</td></tr>
    <tr><td>Primary key</td><td>Key path (in-line) or out-of-line key</td></tr>
    <tr><td>Index on column</td><td>Index on field path</td></tr>
    <tr><td>JOIN</td><td>Manual fetch + merge in JS</td></tr>
    <tr><td>WHERE / ORDER BY</td><td>Cursor with index + range</td></tr>
    <tr><td>LIMIT</td><td>Cursor + counter, or <code>getAll(query, count)</code></td></tr>
  </tbody>
</table>

<h3>Key strategies</h3>
<table>
  <thead><tr><th>Type</th><th>Means</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td>In-line key</td><td>Key is a property of the record itself</td><td>Store has <code>keyPath: 'id'</code>; record <code>{ id: 1, ... }</code></td></tr>
    <tr><td>Out-of-line key</td><td>Key passed separately when adding</td><td><code>store.put(record, key)</code></td></tr>
    <tr><td>Auto-incrementing</td><td>Database assigns key</td><td><code>autoIncrement: true</code>; useful for queues</td></tr>
    <tr><td>Compound key</td><td>Multi-field key</td><td><code>keyPath: ['userId', 'postId']</code></td></tr>
  </tbody>
</table>

<h3>Indexes (your queries are indexed scans)</h3>
<p>If you'll query by email, create an index on <code>email</code>. Without it, every query is a full scan.</p>
<pre><code class="language-javascript">store.createIndex('by-email', 'email', { unique: true });
store.createIndex('by-createdAt', 'createdAt');
store.createIndex('by-tag', 'tags', { multiEntry: true }); // tag is array; one entry per item
</code></pre>

<h3>Transactions</h3>
<table>
  <thead><tr><th>Mode</th><th>Permits</th></tr></thead>
  <tbody>
    <tr><td>readonly</td><td>get, getAll, count, openCursor</td></tr>
    <tr><td>readwrite</td><td>add, put, delete, clear, plus all read ops</td></tr>
    <tr><td>versionchange</td><td>create/delete stores + indexes; only inside <code>onupgradeneeded</code></td></tr>
  </tbody>
</table>

<p>Transactions are scoped to specific stores you list at creation. They auto-commit when no more work is queued. The big trap: <strong>you can't await unrelated work mid-transaction</strong> — the transaction will close.</p>

<pre><code class="language-javascript">// BAD — awaiting unrelated promise mid-transaction
const tx = db.transaction('users', 'readwrite');
const user = await tx.objectStore('users').get(1);
await fetch('/api/something'); // tx closes here
tx.objectStore('users').put({ ...user, updated: true }); // throws

// GOOD — keep all IDB work in one tick
const tx = db.transaction('users', 'readwrite');
const store = tx.objectStore('users');
const user = await store.get(1);
await store.put({ ...user, updated: true });
await tx.done;
</code></pre>

<h3>Versioning + migrations</h3>
<pre><code class="language-javascript">const db = await openDB('myapp', 3, {
  upgrade(db, oldVersion, newVersion, transaction) {
    if (oldVersion &lt; 1) {
      const users = db.createObjectStore('users', { keyPath: 'id' });
      users.createIndex('by-email', 'email', { unique: true });
    }
    if (oldVersion &lt; 2) {
      const posts = db.createObjectStore('posts', { keyPath: 'id' });
      posts.createIndex('by-author', 'authorId');
    }
    if (oldVersion &lt; 3) {
      // Add a new index to existing store
      const tx = transaction;
      const users = tx.objectStore('users');
      users.createIndex('by-createdAt', 'createdAt');
    }
  },
  blocked() { /* old version held by another tab */ },
  blocking() { /* this version is preventing a newer one from opening */ },
});
</code></pre>

<p>Rules:</p>
<ul>
  <li>Version is an integer that monotonically increases.</li>
  <li>Migrations always run forward; you can't downgrade.</li>
  <li>The upgrade transaction can read + write existing stores to transform data.</li>
  <li>If another tab has the database open at a lower version, the upgrade <em>blocks</em>. Listen to <code>blocked</code>; prompt user to close other tabs.</li>
</ul>

<h3>Cursors (streaming queries)</h3>
<pre><code class="language-javascript">// Iterate over all records with createdAt &gt; X, newest first
const tx = db.transaction('posts', 'readonly');
const index = tx.objectStore('posts').index('by-createdAt');
const range = IDBKeyRange.lowerBound(cutoffDate);

let cursor = await index.openCursor(range, 'prev');
const results = [];
while (cursor &amp;&amp; results.length &lt; 50) {
  results.push(cursor.value);
  cursor = await cursor.continue();
}
</code></pre>

<h3>Quota and persistence</h3>
<pre><code class="language-javascript">// Check usage
const { usage, quota } = await navigator.storage.estimate();
console.log(\`Using \${usage} of \${quota} bytes\`);

// Request persistent storage (won't be evicted under pressure)
const persisted = await navigator.storage.persist();
console.log('Persistent:', persisted);

// Check if already persistent
const isPersistent = await navigator.storage.persisted();
</code></pre>

<p>Browser policy:</p>
<ul>
  <li><strong>Chrome:</strong> grants persistence based on engagement (added to home screen, bookmarked, push permission).</li>
  <li><strong>Firefox:</strong> prompts the user.</li>
  <li><strong>Safari:</strong> evicts data after 7 days of no use; PWAs survive longer.</li>
</ul>

<h3>The wrappers — pick one</h3>
<table>
  <thead><tr><th>Library</th><th>Niche</th></tr></thead>
  <tbody>
    <tr><td><strong>idb</strong> (Jake Archibald)</td><td>Promise wrapper around raw IDB. Tiny (~5KB). Closest to the API; best for learning + small projects.</td></tr>
    <tr><td><strong>idb-keyval</strong></td><td>Bare-minimum kv interface. Fits a single use case (k → v storage). ~1KB.</td></tr>
    <tr><td><strong>Dexie</strong></td><td>Full ORM-ish. Schema definition, where-clause queries, hooks, observable mutations, sync layer. ~30KB. Best for serious offline-first apps.</td></tr>
    <tr><td><strong>RxDB</strong></td><td>Reactive database; sync engine, multi-tab, replication, encryption. Heavy but powerful.</td></tr>
    <tr><td><strong>WatermelonDB</strong></td><td>RN-focused but works in browser via IDB adapter; opinionated reactive layer.</td></tr>
    <tr><td><strong>PouchDB</strong></td><td>CouchDB-style replication; pairs with CouchDB for sync.</td></tr>
    <tr><td><strong>SQLite via OPFS / WASM</strong></td><td>Real SQL in the browser via OPFS-backed SQLite. Bigger but full SQL semantics.</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Opening a database (raw idb)</h3>
<pre><code class="language-javascript">import { openDB } from 'idb';

const db = await openDB('myapp', 1, {
  upgrade(db) {
    const users = db.createObjectStore('users', { keyPath: 'id' });
    users.createIndex('by-email', 'email', { unique: true });
    users.createIndex('by-createdAt', 'createdAt');

    db.createObjectStore('settings'); // out-of-line key
    db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
  },
});
</code></pre>

<h3>CRUD basics</h3>
<pre><code class="language-javascript">// Create / update
await db.put('users', { id: 1, email: 'p@x.com', name: 'Prakhar' });

// Read by primary key
const user = await db.get('users', 1);

// Read by index
const userByEmail = await db.getFromIndex('users', 'by-email', 'p@x.com');

// Read all
const all = await db.getAll('users');

// Read range
const recent = await db.getAllFromIndex('users', 'by-createdAt',
  IDBKeyRange.lowerBound(yesterday));

// Delete
await db.delete('users', 1);

// Count
const count = await db.count('users');

// Clear
await db.clear('users');
</code></pre>

<h3>Transactions across multiple stores</h3>
<pre><code class="language-javascript">async function reassignPost(db, postId, newAuthorId) {
  const tx = db.transaction(['posts', 'users'], 'readwrite');
  const posts = tx.objectStore('posts');
  const users = tx.objectStore('users');

  const [post, newAuthor] = await Promise.all([
    posts.get(postId),
    users.get(newAuthorId),
  ]);

  if (!post || !newAuthor) {
    tx.abort();
    throw new Error('not found');
  }

  await posts.put({ ...post, authorId: newAuthorId });
  await users.put({ ...newAuthor, postCount: (newAuthor.postCount ?? 0) + 1 });

  await tx.done; // commits if all succeeded
}
</code></pre>

<h3>Querying with cursors + ranges</h3>
<pre><code class="language-javascript">// Posts created in the last 7 days, by author 42
async function recentPostsByAuthor(db, authorId) {
  const tx = db.transaction('posts', 'readonly');
  const index = tx.objectStore('posts').index('by-author-created');
  const range = IDBKeyRange.bound(
    [authorId, sevenDaysAgo()],
    [authorId, Date.now()]
  );

  const results = [];
  for await (const cursor of index.iterate(range, 'prev')) {
    results.push(cursor.value);
    if (results.length &gt;= 50) break;
  }
  return results;
}
</code></pre>
<p><strong>Compound index</strong> by (author, createdAt) makes this query an indexed range scan — fast even with millions of records.</p>

<h3>Mutation queue (offline-first writes)</h3>
<pre><code class="language-javascript">// Schema upgrade
db.createObjectStore('mutations', { keyPath: 'id', autoIncrement: true });

// Enqueue
async function queueMutation(db, mutation) {
  const id = await db.add('mutations', {
    type: mutation.type,
    payload: mutation.payload,
    idempotencyKey: crypto.randomUUID(),
    createdAt: Date.now(),
    attempts: 0,
  });
  return id;
}

// Flush
async function flushQueue(db) {
  const tx = db.transaction('mutations', 'readonly');
  const all = await tx.objectStore('mutations').getAll();

  for (const m of all) {
    try {
      await fetch(\`/api/\${m.type}\`, {
        method: 'POST',
        headers: { 'Idempotency-Key': m.idempotencyKey },
        body: JSON.stringify(m.payload),
      });
      await db.delete('mutations', m.id);
    } catch (err) {
      const retryTx = db.transaction('mutations', 'readwrite');
      await retryTx.objectStore('mutations').put({
        ...m,
        attempts: m.attempts + 1,
        lastError: String(err),
      });
      await retryTx.done;
      if (m.attempts &gt; 5) break; // dead-letter; stop
    }
  }
}
</code></pre>

<h3>Dexie example (more ergonomic for medium-large apps)</h3>
<pre><code class="language-javascript">import Dexie from 'dexie';

class AppDB extends Dexie {
  users!: Dexie.Table&lt;User, number&gt;;
  posts!: Dexie.Table&lt;Post, number&gt;;
  mutations!: Dexie.Table&lt;Mutation, number&gt;;

  constructor() {
    super('myapp');
    this.version(1).stores({
      users: '++id, &amp;email, createdAt',
      posts: '++id, authorId, createdAt, [authorId+createdAt]',
      mutations: '++id, idempotencyKey, createdAt',
    });
  }
}

export const db = new AppDB();

// Queries
const user = await db.users.where('email').equals('p@x.com').first();
const recentPosts = await db.posts
  .where('[authorId+createdAt]')
  .between([42, sevenDaysAgo()], [42, Date.now()])
  .reverse()
  .limit(50)
  .toArray();

// Reactive subscription
const liveCount = await db.posts.count();
db.posts.hook('creating', () =&gt; refreshUI());
</code></pre>

<h3>idb-keyval (simplest)</h3>
<pre><code class="language-javascript">import { get, set, del, keys, clear } from 'idb-keyval';

await set('settings', { theme: 'dark', volume: 0.7 });
const settings = await get('settings');
await del('settings');
const allKeys = await keys();
await clear();
</code></pre>
<p>If your IDB use case is "store this object by key," you don't need a full DB.</p>

<h3>Storing Blobs (images, files)</h3>
<pre><code class="language-javascript">// Cache user-uploaded photo
async function cachePhoto(db, photoId, blob) {
  await db.put('photos', { id: photoId, blob, savedAt: Date.now() });
}

// Retrieve and use
const record = await db.get('photos', photoId);
const url = URL.createObjectURL(record.blob);
img.src = url;
// Don't forget to revoke when done
URL.revokeObjectURL(url);
</code></pre>

<h3>Encrypting sensitive data</h3>
<pre><code class="language-javascript">async function encryptAndStore(db, key, value) {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey, // imported once, derived from password / passkey
    enc.encode(JSON.stringify(value))
  );
  await db.put('secrets', { id: key, iv, ciphertext });
}

async function readAndDecrypt(db, key) {
  const record = await db.get('secrets', key);
  if (!record) return null;
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: record.iv },
    cryptoKey,
    record.ciphertext
  );
  return JSON.parse(new TextDecoder().decode(plaintext));
}
</code></pre>

<h3>Cross-tab coordination</h3>
<p>Two tabs writing the same record simultaneously can race. IDB transactions are atomic <em>per database</em> — the second write waits for the first. For higher-level coordination, use <code>BroadcastChannel</code>:</p>
<pre><code class="language-javascript">const channel = new BroadcastChannel('myapp');

// Notify other tabs of change
async function saveAndBroadcast(db, record) {
  await db.put('users', record);
  channel.postMessage({ type: 'user-updated', id: record.id });
}

// Listen
channel.onmessage = (event) =&gt; {
  if (event.data.type === 'user-updated') refreshUserUI(event.data.id);
};
</code></pre>

<h3>Storage estimate + persistence</h3>
<pre><code class="language-javascript">async function ensurePersistent() {
  if (!('storage' in navigator)) return false;

  const isPersistent = await navigator.storage.persisted();
  if (isPersistent) return true;

  // Request only after a meaningful engagement signal
  const granted = await navigator.storage.persist();
  return granted;
}

async function checkQuota() {
  const { usage, quota } = await navigator.storage.estimate();
  const percent = (usage / quota) * 100;
  if (percent &gt; 80) showWarning('Running low on storage; clear cache?');
}
</code></pre>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Offline-capable note app</h3>
<pre><code class="language-typescript">import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface MyDB extends DBSchema {
  notes: {
    key: string; // uuid
    value: { id: string; title: string; body: string; updatedAt: number; deleted: boolean };
    indexes: { 'by-updated': number };
  };
  pending: {
    key: number;
    value: { id?: number; noteId: string; op: 'put' | 'delete'; payload?: object; ts: number };
  };
}

let dbPromise: Promise&lt;IDBPDatabase&lt;MyDB&gt;&gt;;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB&lt;MyDB&gt;('notes-app', 1, {
      upgrade(db) {
        const notes = db.createObjectStore('notes', { keyPath: 'id' });
        notes.createIndex('by-updated', 'updatedAt');
        db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
      },
    });
  }
  return dbPromise;
}

export async function listNotes() {
  const db = await getDB();
  return db.getAllFromIndex('notes', 'by-updated');
}

export async function saveNote(note: { id: string; title: string; body: string }) {
  const db = await getDB();
  const record = { ...note, updatedAt: Date.now(), deleted: false };

  const tx = db.transaction(['notes', 'pending'], 'readwrite');
  await tx.objectStore('notes').put(record);
  await tx.objectStore('pending').add({
    noteId: note.id,
    op: 'put',
    payload: record,
    ts: Date.now(),
  });
  await tx.done;

  // Try to flush immediately if online
  if (navigator.onLine) flushPending();
}

export async function deleteNote(id: string) {
  const db = await getDB();
  const tx = db.transaction(['notes', 'pending'], 'readwrite');
  const existing = await tx.objectStore('notes').get(id);
  if (existing) {
    await tx.objectStore('notes').put({ ...existing, deleted: true, updatedAt: Date.now() });
  }
  await tx.objectStore('pending').add({
    noteId: id,
    op: 'delete',
    ts: Date.now(),
  });
  await tx.done;

  if (navigator.onLine) flushPending();
}

async function flushPending() {
  const db = await getDB();
  const all = await db.getAll('pending');
  for (const item of all) {
    try {
      if (item.op === 'put') {
        await fetch(\`/api/notes/\${item.noteId}\`, {
          method: 'PUT',
          body: JSON.stringify(item.payload),
        });
      } else {
        await fetch(\`/api/notes/\${item.noteId}\`, { method: 'DELETE' });
      }
      await db.delete('pending', item.id!);
    } catch {
      // network failure; leave it for next try
      break;
    }
  }
}

window.addEventListener('online', flushPending);
</code></pre>

<h3>Example 2: Full-text search index</h3>
<pre><code class="language-javascript">// Token-based naive index (one entry per word per record)
db.version(1).stores({
  posts: '++id, *tags',  // multi-entry on tags
  search: '++id, [post+token]', // compound index for search
});

async function indexPost(db, post) {
  const tokens = post.body.toLowerCase().match(/\\w+/g) ?? [];
  const tx = db.transaction(['posts', 'search'], 'readwrite');
  await tx.objectStore('posts').put(post);
  for (const token of new Set(tokens)) {
    await tx.objectStore('search').add({ post: post.id, token });
  }
  await tx.done;
}

async function searchPosts(db, query) {
  const tokens = query.toLowerCase().match(/\\w+/g) ?? [];
  const idSets = await Promise.all(
    tokens.map(token =&gt;
      db.getAllFromIndex('search', '[post+token]',
        IDBKeyRange.bound([0, token], [Infinity, token])
      ).then(rows =&gt; new Set(rows.map(r =&gt; r.post)))
    )
  );
  // Intersection — posts containing all tokens
  const matchingIds = idSets.reduce((a, b) =&gt; new Set([...a].filter(x =&gt; b.has(x))));
  return Promise.all([...matchingIds].map(id =&gt; db.get('posts', id)));
}
</code></pre>

<h3>Example 3: Cache API responses keyed by URL</h3>
<pre><code class="language-javascript">// Schema
db.createObjectStore('http-cache', { keyPath: 'url' });

async function fetchWithCache(db, url, ttlMs = 5 * 60_000) {
  const cached = await db.get('http-cache', url);
  if (cached &amp;&amp; Date.now() - cached.fetchedAt &lt; ttlMs) {
    return cached.data;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
    const data = await response.json();

    await db.put('http-cache', {
      url,
      data,
      fetchedAt: Date.now(),
      etag: response.headers.get('etag'),
    });

    return data;
  } catch (err) {
    if (cached) {
      console.warn('Network failed; returning stale', url);
      return cached.data;
    }
    throw err;
  }
}
</code></pre>

<h3>Example 4: Bulk import with progress</h3>
<pre><code class="language-javascript">async function importLargeDataset(db, items) {
  const BATCH = 1000;
  for (let i = 0; i &lt; items.length; i += BATCH) {
    const tx = db.transaction('items', 'readwrite');
    const store = tx.objectStore('items');
    for (const item of items.slice(i, i + BATCH)) {
      store.put(item);
    }
    await tx.done;
    onProgress(Math.min(i + BATCH, items.length) / items.length);
  }
}
</code></pre>
<p>Don't put 100k items in one transaction — slow + may exceed memory. Batch.</p>

<h3>Example 5: Schema migration with data transform</h3>
<pre><code class="language-javascript">openDB('myapp', 4, {
  async upgrade(db, oldVersion, newVersion, tx) {
    if (oldVersion &lt; 4) {
      // Migrate: split full_name into firstName + lastName
      const store = tx.objectStore('users');
      let cursor = await store.openCursor();
      while (cursor) {
        const u = cursor.value;
        if (u.full_name &amp;&amp; !u.firstName) {
          const [first, ...rest] = u.full_name.split(' ');
          u.firstName = first;
          u.lastName = rest.join(' ');
          delete u.full_name;
          await cursor.update(u);
        }
        cursor = await cursor.continue();
      }
    }
  },
});
</code></pre>

<h3>Example 6: LRU cache with size cap</h3>
<pre><code class="language-javascript">async function setLRU(db, key, value, maxEntries = 100) {
  const tx = db.transaction('lru', 'readwrite');
  const store = tx.objectStore('lru');
  await store.put({ key, value, accessedAt: Date.now() });

  const count = await store.count();
  if (count &gt; maxEntries) {
    const index = store.index('by-accessedAt');
    let cursor = await index.openCursor(); // oldest first
    while (cursor &amp;&amp; (await store.count()) &gt; maxEntries) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
  }
  await tx.done;
}
</code></pre>

<h3>Example 7: Multi-tab sync via BroadcastChannel</h3>
<pre><code class="language-javascript">const channel = new BroadcastChannel('myapp-sync');

async function updateUser(db, user) {
  await db.put('users', user);
  channel.postMessage({ type: 'user-updated', id: user.id });
}

channel.onmessage = async (event) =&gt; {
  if (event.data.type === 'user-updated') {
    const fresh = await db.get('users', event.data.id);
    rerenderUserView(fresh);
  }
};
</code></pre>

<h3>Example 8: Quota-aware persistence flow</h3>
<pre><code class="language-javascript">async function bootApp() {
  if ('storage' in navigator) {
    const { usage, quota } = await navigator.storage.estimate();
    if (usage / quota &gt; 0.9) {
      showBanner('Storage almost full');
    }
  }

  // Defer persistence request until user has signaled engagement
  // (e.g., signed in, added to home screen, etc.)
  document.addEventListener('userEngaged', async () =&gt; {
    if (!(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  }, { once: true });
}
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>Transaction auto-close</h3>
<ul>
  <li>Awaiting a non-IDB Promise inside a transaction closes it. Always batch IDB calls in a single tick.</li>
  <li>Use the wrapper's <code>tx.done</code> as your "transaction completed" signal.</li>
  <li>Don't open a transaction in a click handler and then await user input — finish the IDB work, return, do work, open a new transaction later.</li>
</ul>

<h3>Schema upgrade trapped by other tabs</h3>
<ul>
  <li>If another tab has the DB open at the old version, your <code>onupgradeneeded</code> waits forever.</li>
  <li>Listen to <code>blocked</code> + tell the user "Close other tabs to update."</li>
  <li>Or use <code>db.close()</code> via BroadcastChannel signal: tab A signals tab B to close, then opens new version.</li>
</ul>

<h3>Migration bugs in production</h3>
<ul>
  <li>You ship v3 → v4 migration; some users had data shapes you didn't anticipate; migration crashes; their app is broken.</li>
  <li>Always: defensive code in upgrade (try/catch per record, default values).</li>
  <li>Test by exporting real production-shaped DB (anonymised) and replaying migrations.</li>
  <li>Have a "reset DB" button for unrecoverable corruption.</li>
</ul>

<h3>Quota eviction</h3>
<ul>
  <li>Browser may evict your IDB under storage pressure or after extended idle (Safari: ~7 days).</li>
  <li>Persistent storage (granted via <code>persist</code>) reduces but doesn't eliminate eviction.</li>
  <li>Treat IDB as a cache-with-benefits, not durable system of record. Backend is source of truth.</li>
  <li>Sync regularly so eviction is recoverable.</li>
</ul>

<h3>Private browsing</h3>
<ul>
  <li>Safari incognito: IDB available but ephemeral and tiny (~1MB).</li>
  <li>Firefox private: IDB available but cleared on session end.</li>
  <li>Detect via probing storage estimate or attempting to write.</li>
</ul>

<h3>Cross-tab race conditions</h3>
<ul>
  <li>Two tabs writing the same key — last-write-wins semantically; intermediate state may be inconsistent.</li>
  <li>BroadcastChannel for cache invalidation; <code>navigator.locks</code> for coordinated work.</li>
  <li>For optimistic concurrency, store a version field; reject writes with stale version.</li>
</ul>

<h3>Large blobs</h3>
<ul>
  <li>IDB handles blobs but they're stored as opaque records; no streaming.</li>
  <li>For huge files, consider OPFS (Origin Private File System) — file-style API with sync access in workers.</li>
  <li>Blobs in IDB don't compress; account for actual byte count.</li>
</ul>

<h3>Date / Map / Set serialization</h3>
<ul>
  <li>IDB structured-clones values — Date, Map, Set, ArrayBuffer all preserved.</li>
  <li>Functions and DOM nodes can't be cloned — throws.</li>
  <li>Test with your actual data shape; surprises hide in arrays of class instances.</li>
</ul>

<h3>Atomic-cross-store invariants</h3>
<ul>
  <li>"User X has Y posts" — invariant across two stores. Easy to violate without transactions.</li>
  <li>Always span the transaction across both stores.</li>
  <li>Or: avoid the invariant; recompute counts on read.</li>
</ul>

<h3>Indexing strategy</h3>
<ul>
  <li>Indexes cost write performance (every put updates indexes) and storage.</li>
  <li>Don't index everything; only fields you query.</li>
  <li>Compound indexes are powerful: <code>[authorId+createdAt]</code> answers "posts by author X in date range."</li>
  <li>Multi-entry indexes for array fields: <code>{ multiEntry: true }</code> on a tags field — one index entry per item, fast tag lookup.</li>
</ul>

<h3>Versioning gotchas</h3>
<ul>
  <li>You can't decrement the version number.</li>
  <li>You can't dynamically determine the version — it's hardcoded at <code>openDB</code>.</li>
  <li>If two engineers ship competing version bumps in the same release, the larger wins; the other's migration is skipped.</li>
  <li>Write idempotent migrations — running twice should produce the same shape.</li>
</ul>

<h3>Encryption</h3>
<ul>
  <li>IDB itself isn't encrypted on disk; OS encryption helps but isn't IDB-specific.</li>
  <li>For sensitive fields, encrypt at app layer with WebCrypto before storing.</li>
  <li>Key management is the hard part — store the key in IndexedDB-protected scope, derive from a passphrase, or use Web Authentication for a hardware-backed key.</li>
</ul>

<h3>Mobile (web on mobile)</h3>
<ul>
  <li>Mobile Safari evicts IDB after 7 days of inactivity unless the user added to home screen.</li>
  <li>Mobile Chrome behaves like desktop Chrome.</li>
  <li>Background tabs may have throttled IDB performance.</li>
  <li>Test on real iOS Safari — that's where most surprises hide.</li>
</ul>

<h3>RN parallel</h3>
<ul>
  <li>RN doesn't have IDB. Equivalents: AsyncStorage (kv, slow), MMKV (kv, fast, sync), SQLite (relational), WatermelonDB (reactive ORM over SQLite), realm (object DB).</li>
  <li>The patterns transfer: schema migrations, transactions, queues, persistence policy, sync layer.</li>
  <li>For shared code between web + RN, use a wrapper (Dexie web + WatermelonDB native, or RxDB cross-platform).</li>
</ul>

<h3>DevTools</h3>
<ul>
  <li>Application → IndexedDB: see databases, stores, records; manually edit / delete.</li>
  <li>Storage section shows quota usage.</li>
  <li>Lighthouse PWA audit checks for offline capability.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 12 most common IDB mistakes</h3>
<ol>
  <li><strong>Using the raw API.</strong> Hand-rolled event handlers; bugs everywhere. Use idb / Dexie.</li>
  <li><strong>Awaiting unrelated promises mid-transaction.</strong> Transaction auto-closes; subsequent ops throw.</li>
  <li><strong>One giant store with no indexes.</strong> Every query is a full scan; perf dies past 1k records.</li>
  <li><strong>Skipping schema versioning.</strong> Old user data unreadable after refactor.</li>
  <li><strong>localStorage instead of IDB for 5MB+ structured data.</strong> Blocks UI; quota explodes.</li>
  <li><strong>No quota check.</strong> Browser silently evicts; users lose work.</li>
  <li><strong>No persistence request.</strong> Eviction probability stays high.</li>
  <li><strong>No backend sync.</strong> IDB-only "source of truth" — eviction = data loss.</li>
  <li><strong>Storing sensitive data unencrypted.</strong> Disk encryption isn't enough for PII.</li>
  <li><strong>Two tabs racing on the same record.</strong> No version field; concurrent writes corrupt.</li>
  <li><strong>Putting React state in IDB synchronously.</strong> Async by design; render before write completes.</li>
  <li><strong>Skipping the upgrade <code>blocked</code> handler.</strong> Other tabs hold the DB open; users stuck.</li>
</ol>

<h3>Anti-pattern: raw API</h3>
<pre><code class="language-javascript">// BAD — event-based; error-prone; verbose
const request = indexedDB.open('myapp', 1);
request.onsuccess = () =&gt; {
  const db = request.result;
  const tx = db.transaction('users', 'readonly');
  const store = tx.objectStore('users');
  const getReq = store.get(1);
  getReq.onsuccess = () =&gt; useResult(getReq.result);
};

// GOOD — Promise wrapper
import { openDB } from 'idb';
const db = await openDB('myapp', 1);
const user = await db.get('users', 1);
</code></pre>

<h3>Anti-pattern: awaiting external promise mid-transaction</h3>
<pre><code class="language-javascript">// BAD
const tx = db.transaction('users', 'readwrite');
const user = await tx.objectStore('users').get(1);
const fromServer = await fetch('/api/users/1').then(r =&gt; r.json()); // tx closes
await tx.objectStore('users').put({ ...user, ...fromServer }); // throws

// GOOD — finish IDB tx; do external; new IDB tx
const user = await db.get('users', 1);
const fromServer = await fetch('/api/users/1').then(r =&gt; r.json());
await db.put('users', { ...user, ...fromServer });
</code></pre>

<h3>Anti-pattern: full scan instead of index</h3>
<pre><code class="language-javascript">// BAD — fetches all, filters in JS
const users = await db.getAll('users');
const byEmail = users.find(u =&gt; u.email === 'p@x.com');

// GOOD — indexed lookup
const byEmail = await db.getFromIndex('users', 'by-email', 'p@x.com');
</code></pre>

<h3>Anti-pattern: localStorage for too much</h3>
<pre><code class="language-javascript">// BAD — 5MB of JSON; blocks UI on read; quota errors
localStorage.setItem('data', JSON.stringify(largeData));

// GOOD — IDB; async; large quota
await db.put('data', largeData);
</code></pre>

<h3>Anti-pattern: schema bump without migration</h3>
<pre><code class="language-javascript">// BAD — bump version; old fields not migrated; queries break
db.version(2).stores({
  users: '++id, &amp;email, createdAt' // added createdAt; old records don't have it
});

// GOOD — migrate in upgrade
db.version(2).stores({
  users: '++id, &amp;email, createdAt'
}).upgrade(tx =&gt; {
  return tx.objectStore('users').toCollection().modify(u =&gt; {
    u.createdAt = u.createdAt ?? Date.now();
  });
});
</code></pre>

<h3>Anti-pattern: re-opening DB on every call</h3>
<pre><code class="language-javascript">// BAD — opens + closes connection per query; slow
async function getUser(id) {
  const db = await openDB('myapp', 1);
  return db.get('users', id);
}

// GOOD — one promise, reused
let dbPromise;
function getDB() {
  if (!dbPromise) dbPromise = openDB('myapp', 1);
  return dbPromise;
}
async function getUser(id) {
  const db = await getDB();
  return db.get('users', id);
}
</code></pre>

<h3>Anti-pattern: silent eviction</h3>
<pre><code class="language-javascript">// BAD — assume IDB is durable; never sync
await db.put('notes', note); // user thinks it's saved

// GOOD — backend sync, queue + flush
await db.put('notes', note);
await queueMutation('PUT /api/notes', note);
flushQueue(); // best-effort
</code></pre>

<h3>Anti-pattern: storing functions / DOM nodes</h3>
<pre><code class="language-javascript">// BAD — structured-clone fails
await db.put('cache', { handler: () =&gt; {} }); // throws DataCloneError

// GOOD — only serializable data
await db.put('cache', { id: 1, data: 'plain' });
</code></pre>

<h3>Anti-pattern: too many indexes</h3>
<p>10 indexes on a frequently-written store = each <code>put</code> updates 10 secondary structures. Profile; remove indexes you don't query.</p>

<h3>Anti-pattern: not handling <code>blocked</code> on upgrade</h3>
<pre><code class="language-javascript">// BAD — upgrade hangs forever if another tab is open
openDB('myapp', 2, { upgrade(db) { /* ... */ } });

// GOOD — surface to user
openDB('myapp', 2, {
  upgrade(db, oldV, newV, tx) { /* ... */ },
  blocked() { showBanner('Close other tabs to update'); },
  blocking() { /* this tab is preventing newer; close ourselves */
    db.close();
    location.reload();
  },
});
</code></pre>

<h3>Anti-pattern: PII without encryption</h3>
<pre><code class="language-javascript">// BAD — auth token in plain IDB; shared device leaks it
await db.put('auth', { token: '...' });

// GOOD — encrypt with WebCrypto-derived key
await encryptAndStore(db, 'auth', { token: '...' });
</code></pre>

<h3>Anti-pattern: ignoring write failures</h3>
<pre><code class="language-javascript">// BAD — quota exceeded silently
db.put('huge', blob); // returns promise; no await; no catch

// GOOD — handle errors
try {
  await db.put('huge', blob);
} catch (err) {
  if (err.name === 'QuotaExceededError') showStorageWarning();
  else throw err;
}
</code></pre>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common IDB interview prompts</h3>
<ol>
  <li>How would you store offline app data in the browser?</li>
  <li>Compare IndexedDB, localStorage, Cache API, OPFS.</li>
  <li>Walk through schema versioning + migrations.</li>
  <li>Design an offline-first todo / notes app.</li>
  <li>How do you handle quota eviction?</li>
  <li>How do transactions work in IDB?</li>
  <li>Why use Dexie / idb / RxDB?</li>
  <li>Tell me about a time you debugged an IDB issue.</li>
</ol>

<h3>The 5-step framework for "design offline storage"</h3>
<ol>
  <li><strong>Identify data:</strong> what's persisted? Size? Sensitivity? Access patterns?</li>
  <li><strong>Pick the store:</strong> kv (idb-keyval), structured (idb / Dexie), relational (SQLite WASM), files (OPFS).</li>
  <li><strong>Plan schema + indexes</strong> by query patterns.</li>
  <li><strong>Plan sync:</strong> mutation queue with idempotency keys; flush on reconnect.</li>
  <li><strong>Plan persistence:</strong> request <code>storage.persist</code> after engagement; monitor quota; handle eviction.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"IDB for structured data + queries; localStorage only for tiny synchronous flags; Cache API for HTTP responses keyed by URL."</em></li>
  <li><em>"Wrapped with idb (Promise wrapper) by default; Dexie if we need ORM-like queries + reactive layer; idb-keyval if it's literally key→value."</em></li>
  <li><em>"Schema versioned; upgrade handler does forward migrations only; defensive coding for partially-corrupted records."</em></li>
  <li><em>"Indexes for the queries we run, not every field — each index costs write performance."</em></li>
  <li><em>"Mutation queue with idempotency keys; flush on reconnect; backend is source of truth."</em></li>
  <li><em>"navigator.storage.persist after engagement signal — bookmarked / installed PWAs get persistence; transient visitors don't."</em></li>
  <li><em>"BroadcastChannel for multi-tab cache invalidation; navigator.locks for coordinated work."</em></li>
  <li><em>"WebCrypto encryption for PII; key derived from passphrase or hardware-bound via WebAuthn."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"offline app"</td><td>IDB + Service Worker + sync queue</td></tr>
    <tr><td>"notes / docs"</td><td>IDB with last-write-wins or CRDT</td></tr>
    <tr><td>"queue mutations"</td><td>auto-incrementing store + Background Sync</td></tr>
    <tr><td>"search index"</td><td>Compound index or external lib (FlexSearch)</td></tr>
    <tr><td>"large files"</td><td>Blob in IDB or OPFS</td></tr>
    <tr><td>"http cache"</td><td>Cache API; IDB only if you need TTL / metadata</td></tr>
    <tr><td>"multi-tab"</td><td>BroadcastChannel + navigator.locks</td></tr>
    <tr><td>"sensitive data"</td><td>WebCrypto AES-GCM at app layer</td></tr>
    <tr><td>"sync with backend"</td><td>Mutation queue + idempotency keys + delta API</td></tr>
  </tbody>
</table>

<h3>Demo script</h3>
<ol>
  <li>Sketch the schema: stores, primary keys, indexes.</li>
  <li>Show a CRUD flow: put / get / delete.</li>
  <li>Show one cross-store transaction.</li>
  <li>Show schema upgrade with migration.</li>
  <li>Talk persistence + quota.</li>
  <li>Talk sync queue + idempotency.</li>
  <li>Address multi-tab + encryption if relevant.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"Migrations tested with production-shaped fixtures in CI."</em></li>
  <li><em>"navigator.locks for cross-tab coordination on critical writes."</em></li>
  <li><em>"WebCrypto key derived from WebAuthn for hardware-bound encryption."</em></li>
  <li><em>"Quota dashboard with auto-cleanup of LRU cache stores."</em></li>
  <li><em>"OPFS with SQLite WASM for read-heavy analytics over local data."</em></li>
  <li><em>"Sync engine with vector clocks / CRDT for conflict-free merges."</em></li>
  <li><em>"Telemetry on schema-version distribution to retire old migrations."</em></li>
  <li><em>"User-visible storage UX: 'You're using 42MB; clear cache?'"</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Storage choice fluency</td><td>IDB vs localStorage vs Cache vs OPFS chosen by access pattern</td></tr>
    <tr><td>Wrapper preference</td><td>idb / Dexie; not raw API</td></tr>
    <tr><td>Schema design</td><td>Indexed for actual queries; not every field</td></tr>
    <tr><td>Migration discipline</td><td>Forward-only; defensive; <code>blocked</code> handler</td></tr>
    <tr><td>Transaction awareness</td><td>Knows the auto-close trap</td></tr>
    <tr><td>Sync model</td><td>Queue + idempotency; backend as source of truth</td></tr>
    <tr><td>Quota awareness</td><td>navigator.storage.estimate + persist</td></tr>
    <tr><td>Multi-tab coordination</td><td>BroadcastChannel / locks</td></tr>
    <tr><td>Restraint</td><td>Doesn't IDB everything</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN has no IDB; equivalents: AsyncStorage (kv slow), MMKV (kv fast sync), SQLite (relational), WatermelonDB (reactive ORM), Realm (object DB).</li>
  <li>The patterns transfer: schema versioning, mutation queues, sync layer, encryption.</li>
  <li>For shared web + RN code, RxDB or PouchDB unify IDB + native SQLite under one API.</li>
  <li>Mobile Safari evicts IDB after 7 days idle — significant pitfall for PWAs that aren't installed.</li>
  <li>iOS Safari PWAs share storage with Safari itself — clearing Safari history clears PWA data.</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"Why IDB over localStorage?"</em> — IDB is async (no UI block), large (hundreds of MB), structured + indexed; localStorage is sync, ~5MB, string-only.</li>
  <li><em>"Walk me through a schema migration from v3 to v4."</em> — Open with version 4; <code>upgrade</code> sees oldVersion 3; create / modify stores + indexes; iterate cursor to transform data; transaction commits at end of upgrade.</li>
  <li><em>"What's the auto-close transaction trap?"</em> — Awaiting unrelated promises mid-transaction lets it auto-commit before you finish; subsequent IDB calls throw <code>InvalidStateError</code>.</li>
  <li><em>"How do you handle quota eviction?"</em> — Treat IDB as cache-with-benefits, not durable system of record; sync to backend; request persistence; monitor quota; surface to user when high.</li>
  <li><em>"Two tabs writing the same record — what happens?"</em> — IDB serializes writes within an origin; last-write-wins; for higher-level coordination use navigator.locks or version field with optimistic concurrency.</li>
  <li><em>"How do you migrate users between schema versions when their tabs are open?"</em> — onupgradeneeded blocks until other tabs close DB. Listen to <code>blocked</code>; show "Close other tabs" UI; or signal via BroadcastChannel for graceful close.</li>
  <li><em>"What's the difference between Cache API and IDB?"</em> — Cache API is keyed by Request → Response (HTTP-style); IDB is structured records + indexes (database-style). Cache for HTTP, IDB for app data.</li>
  <li><em>"How do you encrypt PII in IDB?"</em> — Encrypt with WebCrypto AES-GCM at app layer; key derived from passphrase via PBKDF2 / Argon2 or hardware-bound via WebAuthn. IDB stores ciphertext + IV.</li>
</ul>

<h3>"What I'd do day one prepping"</h3>
<ul>
  <li>Build a tiny offline notes app with idb + Service Worker.</li>
  <li>Practice writing a schema migration that transforms data.</li>
  <li>Build a mutation queue with idempotency keys.</li>
  <li>Test quota eviction (Application → DevTools → Clear storage).</li>
  <li>Compare idb / Dexie / RxDB by building the same toy app in each.</li>
  <li>Read Jake Archibald's IDB articles; the spec is denser but less practical.</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read 'Working with IndexedDB' on web.dev."</li>
  <li>"Build a CRDT-based note sync demo over IDB."</li>
  <li>"Try OPFS + SQLite WASM for a read-heavy app."</li>
  <li>"Audit a real PWA's IDB schema; identify missing indexes / over-indexing."</li>
</ul>
`
    }
  ]
});
