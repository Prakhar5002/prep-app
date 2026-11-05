window.PREP_SITE.registerTopic({
  id: "cloud-firebase",
  module: "cloud",
  title: "Firebase",
  estimatedReadTime: "42 min",
  tags: ["firebase","firestore","security-rules","cloud-functions","fcm","firebase-auth","baas","gcp","push-notifications"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">Firebase lets the <strong>client talk directly to managed backends guarded by Security Rules</strong>, with trusted logic in Cloud Functions — you get speed, realtime and offline, and pay with per-read pricing and limited querying.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Two doors:</strong> client SDK requests are checked by Security Rules; Cloud Functions use the Admin SDK and bypass rules — anything needing trust or secrets (prices, cross-user counters, third-party API keys) goes through the server door.</li>
    <li><strong>Auth:</strong> hosted identity (email, phone, Google, Apple, anonymous); ID token is a ~1 h JWT plus a refresh token; verify it server-side with <code>verifyIdToken</code>; roles and tenant go in <strong>custom claims</strong> (small, refresh with the token — force-refresh after changes).</li>
    <li><strong>Firestore model:</strong> collections → documents → subcollections, with realtime listeners and an offline cache; queries are shallow and index-backed; you pay <strong>per document read</strong>, so cost and latency scale with the result set.</li>
    <li><strong>Model from the screen backwards:</strong> denormalise display fields, precompute aggregates, subcollections for unbounded children; 1 MiB doc cap; ~1 sustained write/sec per document → shard counters.</li>
    <li><strong>Composite indexes</strong> for equality + range/sort combos, committed in <code>firestore.indexes.json</code>; exempt large text fields.</li>
    <li><strong>Rules are not filters</strong> — the query must be provably constrained to match the rule or the whole query fails; rules also validate (<code>keys().hasOnly</code>, types, <code>request.time</code>); Firestore rules don't cascade; <code>get()</code>/<code>exists()</code> cost reads and are capped.</li>
    <li><strong>Billing traps:</strong> unfiltered listeners, offset pagination, empty queries still cost a read, re-attach after ~30 min offline re-reads, counting by reading, trigger loops, single-document write hotspots, rules left in test mode — use cursors, limits, <code>getCountFromServer</code>.</li>
    <li><strong>RTDB</strong> = older JSON tree, lower latency, bandwidth billing, weak querying, <code>onDisconnect()</code> — use for presence and chatty tiny updates.</li>
    <li><strong>Functions:</strong> HTTPS, callables (auth + App Check built in), Firestore/Storage/scheduled triggers; 2nd gen runs on Cloud Run (many requests per instance); triggers are <strong>at-least-once and unordered</strong> → idempotent, loop-guarded; secrets via <code>defineSecret</code>; set region and <code>maxInstances</code>.</li>
    <li><strong>Uniqueness</strong> (no double-booking) = deterministic document IDs created in a transaction through a callable.</li>
    <li><strong>FCM:</strong> free push; token per install → store per user/device; notification vs data messages; send with the HTTP v1 API (the Admin SDK does this); iOS goes via APNs (upload the .p8 key); prune "not registered" tokens; foreground display is your job.</li>
    <li><strong>Storage</strong> = GCS buckets behind rules. <strong>Emulator Suite</strong> + <code>@firebase/rules-unit-testing</code> in CI; one Firebase project per environment; App Check against scripted abuse.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Treating Firestore like a SQL database with rules as a filter</strong> — fetching whole collections, joining on the client and expecting rules to hide other users' rows. The query is rejected (or, with loose rules, leaks data) and every document is billed. Fix: constrain the query to match the rule, denormalise for the screen, and put cross-user logic in a callable.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"With Firebase I think in two doors: the client door guarded by Security Rules, and the server door — Cloud Functions with the Admin SDK — for anything that needs trust or secrets."</div>
  <div class="revision-say">"Firestore cost scales with documents read, so I model from the screen backwards: denormalise, precompute counts, paginate with cursors, and review every listener."</div>
  <div class="revision-say">"Triggers are at-least-once and unordered, so I dedupe on the event id inside the same transaction as the side effect and guard against self-triggering loops."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What Firebase actually is</h3>
<p>A suite of managed services on top of Google Cloud. Every Firebase project <em>is</em> a Google Cloud project: Firestore, Cloud Functions and Cloud Storage are GCP products with Firebase SDKs and a friendlier console on top. There are two billing plans at time of writing: <strong>Spark</strong> (free, fixed quotas) and <strong>Blaze</strong> (pay-as-you-go, with the same free quota applied first). Deploying Cloud Functions needs Blaze, and new Cloud Storage buckets have moved behind Blaze too (check current docs for the exact cut-over).</p>

<h3>The product map (and the AWS equivalent you will be asked about)</h3>
<table>
  <thead><tr><th>Firebase product</th><th>What it gives you</th><th>Nearest AWS service</th><th>Typical use</th></tr></thead>
  <tbody>
    <tr><td>Authentication</td><td>Hosted user directory, OAuth/social providers, ID tokens</td><td>Cognito user pools — see <a href="#/topic/cloud-cognito">Cognito</a></td><td>Sign-in for mobile and web</td></tr>
    <tr><td>Cloud Firestore</td><td>Document DB, realtime listeners, offline sync</td><td>DynamoDB (+ AppSync subscriptions)</td><td>App data, chat, feeds, bookings</td></tr>
    <tr><td>Realtime Database</td><td>One JSON tree synced over a persistent connection</td><td>API Gateway WebSocket + DynamoDB</td><td>Presence, typing indicators, live cursors</td></tr>
    <tr><td>Cloud Functions</td><td>Serverless functions with Firebase triggers</td><td>Lambda — see <a href="#/topic/cloud-lambda">AWS Lambda</a></td><td>Trusted logic, webhooks, fan-out</td></tr>
    <tr><td>Cloud Storage</td><td>Object storage guarded by rules</td><td>S3 + presigned URLs — see <a href="#/topic/cloud-s3">S3</a></td><td>Avatars, uploads, recordings</td></tr>
    <tr><td>Cloud Messaging (FCM)</td><td>Push to Android / iOS / web</td><td>SNS mobile push (check current docs)</td><td>Push notifications</td></tr>
    <tr><td>Hosting / App Hosting</td><td>CDN static hosting; App Hosting for SSR frameworks</td><td>S3 + CloudFront, Amplify Hosting — see <a href="#/topic/cloud-amplify">Amplify</a></td><td>Web apps, landing pages</td></tr>
    <tr><td>App Check</td><td>Attests that requests come from your genuine app</td><td>No direct equivalent (WAF + custom attestation)</td><td>Stop scripted abuse of client-reachable backends</td></tr>
    <tr><td>Remote Config, Crashlytics, Analytics</td><td>Feature config, crash reports, product analytics</td><td>AppConfig, CloudWatch RUM, Pinpoint-era analytics</td><td>Mobile product operations</td></tr>
  </tbody>
</table>

<h3>Why teams pick Firebase</h3>
<ul>
  <li><strong>Time to first feature.</strong> Auth + database + push in a day, with no servers to run.</li>
  <li><strong>Realtime and offline by default.</strong> Listeners push changes; the mobile SDKs cache data and queue writes while offline, then sync.</li>
  <li><strong>Strong mobile SDKs.</strong> <code>@react-native-firebase/*</code> wraps the native iOS/Android SDKs, so you get native offline persistence, FCM and Crashlytics.</li>
  <li><strong>No capacity planning.</strong> Scales from zero without provisioning; cost tracks usage.</li>
</ul>

<h3>Why teams outgrow or avoid it</h3>
<ul>
  <li><strong>Query limits.</strong> No joins, limited aggregation, no full-text search (you bolt on Algolia / Typesense / Elastic), and every query needs an index.</li>
  <li><strong>Per-read pricing.</strong> Read-heavy apps get expensive, and one careless listener can multiply the bill.</li>
  <li><strong>Authorization in a rules language.</strong> Fine for ownership and org membership; painful for deep permission graphs.</li>
  <li><strong>Lock-in.</strong> Proprietary data model and SDKs; leaving means rewriting the data layer.</li>
  <li><strong>Enterprise asks.</strong> VPC isolation, per-tenant data residency, heavy reporting (you end up exporting to BigQuery), customer-run deployments.</li>
</ul>

<h3>Where it shows up in interviews</h3>
<p>For full-stack and FDE roles expect: "You used Firebase — why, and what would you change at 10× scale?", "How do you secure a client that talks straight to the database?", "Firebase or AWS for this customer?". You may be asked to write security rules, design a Firestore schema for a specific screen, or explain a bill spike.</p>

<div class="callout note">
  <div class="callout-title">React Native: which SDK?</div>
  <p><strong><code>@react-native-firebase/*</code></strong> wraps the native SDKs: offline persistence on by default, FCM, Crashlytics, but it needs a dev build (not Expo Go). The <strong><code>firebase</code> JS SDK</strong> is pure JS: works in Expo Go and matches the web API, but has no FCM on native and persistence is your job. Most production RN apps use RNFirebase. Push UX details live in <a href="#/topic/mprod-push">Push Notifications</a>.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>The "two doors" picture</h3>
<div class="diagram">
<pre>
 ┌──────────────────────────────── CLIENT DOOR ────────────────────────────────┐
 │                                                                             │
 │  RN / web app ── ID token ──► Firestore / Storage / RTDB                    │
 │  (Auth SDK)                    ▲   Security Rules evaluated on EVERY        │
 │                                │   client read and write                    │
 └────────────────────────────────┼────────────────────────────────────────────┘
                                  │ events (onCreate / onWrite / onFinalize)
                                  ▼
 ┌──────────────────────────────── SERVER DOOR ────────────────────────────────┐
 │  Cloud Functions ── Admin SDK (BYPASSES rules, authorised by IAM) ──► DB     │
 │        ▲                                   └──► Stripe, LLM APIs (secrets)   │
 │        │ callable / HTTPS (ID token + App Check token verified)              │
 │  RN / web app                                                                │
 └──────────────────────────────────────────────────────────────────────────────┘
</pre>
</div>
<p>Almost every Firebase design question reduces to <strong>"which door does this operation use?"</strong> Reading or writing data the user owns or is allowed to see → client door, guarded by rules. Anything that needs trust — computing a price, touching other users' data, enforcing a uniqueness constraint, using a secret key — → server door.</p>

<h3>The Firestore data model</h3>
<div class="diagram">
<pre>
orgs                       (collection)
 └─ orgA                   (document)  { name, plan, createdAt }
     ├─ rooms              (subcollection)
     │   └─ room42         { name, capacity, floor }
     ├─ bookings           (subcollection)
     │   └─ bk_9f2         { roomId: "room42", roomName: "Everest", start, end, ownerUid }
     └─ stats
         └─ today          { bookings: 37 }        ← precomputed, written by a Function
users
 └─ uid_123                { displayName, orgId, fcmTokens: [...] }
</pre>
</div>
<ul>
  <li>Collections hold documents; documents hold fields <em>and</em> subcollections.</li>
  <li><strong>Queries are shallow</strong>: reading <code>orgs/orgA</code> does not read its rooms. A <strong>collection-group query</strong> searches every subcollection with the same name (e.g. all <code>bookings</code> across orgs).</li>
  <li><code>roomName</code> is copied onto the booking (denormalised) so the list screen needs one query, not one per row.</li>
</ul>

<h3>"Cost and latency scale with the result set, not the data set"</h3>
<p>Firestore guarantees that a query's speed depends on how many documents it returns, because every query is served from an index. The consequences shape everything:</p>
<ul>
  <li>You cannot run an un-indexed query. Equality filters on single fields work automatically; mixing a range filter or sort with other filters needs a <strong>composite index</strong>.</li>
  <li>There are no joins, so you <strong>denormalise</strong> (copy display fields) and <strong>precompute</strong> (counts, summaries) at write time.</li>
  <li>You pay per document returned, so model <strong>from the screen backwards</strong>: "what does this screen need in one or two queries?"</li>
</ul>

<h3>Firestore vs Realtime Database</h3>
<table>
  <thead><tr><th></th><th>Cloud Firestore</th><th>Realtime Database</th></tr></thead>
  <tbody>
    <tr><td>Data model</td><td>Collections / documents with typed fields</td><td>One large JSON tree</td></tr>
    <tr><td>Queries</td><td>Compound, index-backed, cursor pagination</td><td>One orderBy + one filter per query; reading a node reads its whole subtree</td></tr>
    <tr><td>Billing</td><td>Per document read / write / delete, plus storage</td><td>Bandwidth downloaded + storage; no per-operation charge</td></tr>
    <tr><td>Scaling</td><td>Automatic; limits are per document and per index range</td><td>Per-database connection and throughput limits; shard into several databases</td></tr>
    <tr><td>Rules</td><td>Per <code>match</code> block, do not cascade</td><td>JSON rules that <em>cascade</em> down the tree</td></tr>
    <tr><td>Presence</td><td>No built-in disconnect hook</td><td><code>onDisconnect()</code> built in</td></tr>
    <tr><td>Pick it for</td><td>Default for application data</td><td>Presence, typing indicators, live cursors, very chatty small updates</td></tr>
  </tbody>
</table>
<p>A common hybrid: Firestore for app data, RTDB for presence, with a Function mirroring "online" status into Firestore if lists need it.</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"Security Rules filter my query results." They do not. Rules check whether the <em>query as written</em> could only ever return permitted documents. With a rule <code>allow read: if resource.data.ownerUid == request.auth.uid</code>, the query <code>getDocs(collection(db, 'bookings'))</code> fails entirely with <code>permission-denied</code>. You must write <code>where('ownerUid', '==', uid)</code> so the query matches the rule.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. Authentication and ID tokens</h3>
<p>The client signs in with a provider; the SDK stores an <strong>ID token</strong> (a JWT signed by Google, valid about an hour) and a long-lived <strong>refresh token</strong>, and refreshes automatically. ID token claims include <code>sub</code>/uid, <code>email</code>, <code>email_verified</code>, <code>firebase.sign_in_provider</code>, plus any <strong>custom claims</strong> you set server-side.</p>
<pre><code class="language-ts">// Client (web modular SDK — RNFirebase exposes the same concepts)
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

const app = initializeApp(firebaseConfig);    // this config is PUBLIC — it is not a secret
const auth = getAuth(app);

onAuthStateChanged(auth, async (user) =&gt; {
  if (!user) return showLogin();
  const { token, claims } = await user.getIdTokenResult();   // cached, auto-refreshed
  setSession({ uid: user.uid, role: (claims.role as string) ?? 'member', token });
});

await signInWithEmailAndPassword(auth, email, password);</code></pre>

<p>Your own backend (Express on Lambda, Cloud Run, anywhere) verifies the token with the Admin SDK:</p>
<pre><code class="language-ts">import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { Request, Response, NextFunction } from 'express';

initializeApp({ credential: applicationDefault() });

export async function requireUser(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'missing_token' });
  try {
    // 2nd arg checkRevoked=true costs an extra lookup — use it on sensitive routes
    const decoded = await getAuth().verifyIdToken(token, true);
    res.locals.user = { uid: decoded.uid, role: decoded.role, orgId: decoded.orgId };
    next();
  } catch {
    res.status(401).json({ error: 'invalid_token' });
  }
}</code></pre>

<p>Roles and tenancy go into <strong>custom claims</strong>, set only by trusted code:</p>
<pre><code class="language-ts">await getAuth().setCustomUserClaims(uid, { role: 'admin', orgId: 'orgA' });
// Claims appear in the NEXT ID token. Tell the client to force-refresh:
await auth.currentUser?.getIdToken(true);</code></pre>
<ul>
  <li>Claims payload is small (about 1000 bytes — check docs): store a role and an org id, not a permission list.</li>
  <li><strong>Anonymous auth</strong> gives a real uid immediately; <code>linkWithCredential</code> later upgrades the same account so the user keeps their data.</li>
  <li>Upgrading to <strong>Identity Platform</strong> adds MFA, SAML/OIDC enterprise SSO, multi-tenancy and <strong>blocking functions</strong> (<code>beforeUserCreated</code> / <code>beforeUserSignedIn</code>). Pricing changes past a free MAU tier — check current docs.</li>
</ul>

<h3>2. Firestore data modelling</h3>
<table>
  <thead><tr><th>Option</th><th>Use when</th><th>Watch out for</th></tr></thead>
  <tbody>
    <tr><td>Subcollection <code>orgs/{org}/bookings</code></td><td>Unbounded children, usually queried per parent; rules scope naturally by path</td><td>Deleting the parent does <em>not</em> delete subcollections</td></tr>
    <tr><td>Root collection + foreign key (<code>bookings.orgId</code>)</td><td>You query across parents a lot</td><td>Every rule must check the field</td></tr>
    <tr><td>Array / map inside the parent</td><td>Small, bounded (tens of items), always read together</td><td>1 MiB doc limit; whole doc rewritten; cannot query by inner fields of array objects</td></tr>
    <tr><td>Denormalised copy (<code>roomName</code> on booking)</td><td>List screens need display data from another entity</td><td>Fan-out updates when the source changes — do them in a Function</td></tr>
    <tr><td>Aggregate doc (<code>stats/today</code>)</td><td>Counts, totals, dashboards</td><td>Write contention — shard it or batch updates</td></tr>
  </tbody>
</table>
<p>Limits worth quoting (at time of writing — check current docs): max document size <strong>1 MiB</strong>; sustained writes to a <strong>single document</strong> of roughly <strong>1 per second</strong>; ramp new high-traffic collections gradually (Google's "500/50/5" guidance); avoid monotonically increasing indexed values (sequential IDs, timestamps) at very high write rates because they hotspot one index range. Use auto-generated document IDs.</p>
<pre><code class="language-ts">// Distributed counter: spread writes across N shard docs, sum them on read
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
const db = getFirestore();
const SHARDS = 10;

export async function incrementLikes(postId: string) {
  const shard = String(Math.floor(Math.random() * SHARDS));
  await db.doc('posts/' + postId + '/likeShards/' + shard)
    .set({ count: FieldValue.increment(1) }, { merge: true });
}

export async function getLikes(postId: string) {
  const snap = await db.collection('posts/' + postId + '/likeShards').get();   // N reads
  return snap.docs.reduce((sum, d) =&gt; sum + (d.get('count') ?? 0), 0);
}</code></pre>

<h3>3. Queries, indexes, pagination, listeners</h3>
<pre><code class="language-ts">import { getFirestore, collection, query, where, orderBy, limit, startAfter, getDocs,
  onSnapshot, getCountFromServer, type QueryDocumentSnapshot } from 'firebase/firestore';

const db = getFirestore(app);

// Upcoming bookings for one room — equality + range + sort → composite index (roomId, start)
const q = query(
  collection(db, 'orgs', orgId, 'bookings'),
  where('roomId', '==', roomId),
  where('start', '&gt;=', new Date()),
  orderBy('start', 'asc'),
  limit(20),
);

// Cursor pagination: you pay for 20 docs per page, not "offset + 20"
let last: QueryDocumentSnapshot | undefined;
export async function nextPage() {
  const snap = await getDocs(last ? query(q, startAfter(last)) : q);
  last = snap.docs[snap.docs.length - 1];
  return snap.docs.map((d) =&gt; ({ id: d.id, ...d.data() }));
}

// Live listener — ALWAYS detach (listeners keep billing and leak memory)
useEffect(() =&gt; {
  const unsub = onSnapshot(q, (snap) =&gt; {
    snap.docChanges().forEach((c) =&gt; applyChange(c.type, c.doc));   // 'added' | 'modified' | 'removed'
  }, (err) =&gt; reportError(err));
  return unsub;
}, [orgId, roomId]);

// Count without reading every document (aggregation query, billed per batch of index entries)
const total = (await getCountFromServer(q)).data().count;</code></pre>

<pre><code class="language-json">// firestore.indexes.json — deploy with: firebase deploy --only firestore:indexes
{
  "indexes": [
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "roomId", "order": "ASCENDING" },
        { "fieldPath": "start",  "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": [
    { "collectionGroup": "bookings", "fieldPath": "notes",
      "indexes": [] }
  ]
}</code></pre>
<ul>
  <li>The "missing index" error message contains a console link that creates the exact index. Commit the result to <code>firestore.indexes.json</code> so environments stay in sync.</li>
  <li>The <code>fieldOverrides</code> entry <strong>exempts</strong> a large free-text field from indexing — cheaper writes and avoids index-entry limits.</li>
  <li>Operators: <code>==</code>, <code>!=</code>, <code>&lt;</code>, <code>&lt;=</code>, <code>&gt;</code>, <code>&gt;=</code>, <code>array-contains</code>, <code>array-contains-any</code>, <code>in</code>, <code>not-in</code>, and <code>or()</code>. <code>in</code> / <code>array-contains-any</code> take a capped number of values (30 at time of writing). Range filters on multiple fields are now supported but read more index entries — check current docs.</li>
</ul>

<h3>4. Security Rules</h3>
<pre><code class="language-text">rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn()     { return request.auth != null; }
    function isMember(org)  { return signedIn() &amp;&amp; request.auth.token.orgId == org; }
    function isAdmin(org)   { return isMember(org) &amp;&amp; request.auth.token.role == 'admin'; }

    match /users/{uid} {
      allow read: if signedIn() &amp;&amp; request.auth.uid == uid;
      // users may change ONLY these fields of their own profile
      allow update: if signedIn() &amp;&amp; request.auth.uid == uid
        &amp;&amp; request.resource.data.diff(resource.data).affectedKeys()
             .hasOnly(['displayName', 'photoURL', 'fcmTokens']);
      allow create, delete: if false;                 // created by a Function at sign-up
    }

    match /orgs/{orgId} {
      allow read:  if isMember(orgId);
      allow write: if isAdmin(orgId);

      match /rooms/{roomId} {
        allow read:  if isMember(orgId);
        allow write: if isAdmin(orgId);
      }

      match /bookings/{bookingId} {
        allow read: if isMember(orgId);
        allow create: if isMember(orgId)
          &amp;&amp; request.resource.data.keys().hasOnly(['roomId', 'start', 'end', 'title', 'ownerUid', 'createdAt'])
          &amp;&amp; request.resource.data.ownerUid == request.auth.uid
          &amp;&amp; request.resource.data.title is string
          &amp;&amp; request.resource.data.title.size() &lt;= 120
          &amp;&amp; request.resource.data.start is timestamp
          &amp;&amp; request.resource.data.end &gt; request.resource.data.start
          &amp;&amp; request.resource.data.createdAt == request.time
          &amp;&amp; exists(/databases/$(database)/documents/orgs/$(orgId)/rooms/$(request.resource.data.roomId));
        allow update, delete: if resource.data.ownerUid == request.auth.uid || isAdmin(orgId);
      }
      // stats/* has no rule → default DENY for clients; only Functions (Admin SDK) write it
    }
  }
}</code></pre>
<ul>
  <li><code>resource.data</code> = the stored document; <code>request.resource.data</code> = the document as it would look <em>after</em> the write; <code>request.auth.token</code> = ID token claims (including custom claims).</li>
  <li><code>createdAt == request.time</code> forces the client to use <code>serverTimestamp()</code>, so timestamps cannot be forged.</li>
  <li><code>get()</code> / <code>exists()</code> each cost a document read and are capped per request (roughly 10 for single-document requests, 20 for batches/transactions — check docs). Prefer claims over lookups on hot paths.</li>
  <li>Firestore rules <strong>do not cascade</strong>: allowing <code>/orgs/{orgId}</code> grants nothing on <code>/orgs/{orgId}/rooms</code>. Anything with no matching <code>allow</code> is denied.</li>
  <li>Rules are also <strong>validation</strong>: <code>keys().hasOnly(...)</code> stops clients from smuggling extra fields like <code>isAdmin: true</code>.</li>
</ul>

<pre><code class="language-text">// storage.rules — avatars: owner-only writes, images only, under 5 MB
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{uid}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &amp;&amp; request.auth.uid == uid
        &amp;&amp; request.resource.size &lt; 5 * 1024 * 1024
        &amp;&amp; request.resource.contentType.matches('image/.*');
    }
  }
}</code></pre>

<h3>5. Transactions and batched writes</h3>
<ul>
  <li><strong>Batched write</strong> — a group of writes that commit atomically; no reads.</li>
  <li><strong>Transaction</strong> — reads then writes, atomically. Client SDKs use <strong>optimistic concurrency</strong>: if a read document changes before commit, the whole update function re-runs, so it must have no side effects (no network calls, no UI state). Server (Admin) SDKs take locks on what they read (pessimistic). Client transactions fail when offline.</li>
  <li>Historically batches and transactions were capped at 500 operations; check current docs for limits, and chunk large backfills anyway.</li>
</ul>

<h3>6. Cloud Functions (2nd gen, TypeScript)</h3>
<pre><code class="language-ts">// functions/src/index.ts
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions';

initializeApp();
const db = getFirestore();
// Same region as Firestore + your users; maxInstances caps blast radius AND cost
setGlobalOptions({ region: 'asia-south1', maxInstances: 20 });

const LLM_API_KEY = defineSecret('LLM_API_KEY');     // lives in Secret Manager, not in code

// (1) Callable — the SDK attaches the user's ID token and App Check token automatically
export const summarizeMeeting = onCall(
  { secrets: [LLM_API_KEY], enforceAppCheck: true, timeoutSeconds: 60, memory: '512MiB' },
  async (request) =&gt; {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first');
    const { bookingId } = request.data as { bookingId?: string };
    if (!bookingId) throw new HttpsError('invalid-argument', 'bookingId is required');
    const orgId = request.auth.token.orgId as string;
    const snap = await db.doc('orgs/' + orgId + '/bookings/' + bookingId).get();
    if (!snap.exists) throw new HttpsError('not-found', 'No such booking');
    const summary = await callLlm(LLM_API_KEY.value(), snap.get('notes'));   // key never ships to the device
    return { summary };
  },
);

// (2) Firestore trigger — delivered AT LEAST ONCE, possibly out of order → idempotent
export const onBookingCreated = onDocumentCreated(
  { document: 'orgs/{orgId}/bookings/{bookingId}', retry: true },
  async (event) =&gt; {
    if (!event.data) return;
    const { orgId, bookingId } = event.params;
    await db.runTransaction(async (tx) =&gt; {
      const marker = db.doc('processedEvents/' + event.id);      // CloudEvent id = dedupe key
      if ((await tx.get(marker)).exists) return;                // duplicate delivery → no-op
      tx.create(marker, { at: FieldValue.serverTimestamp() });
      tx.set(db.doc('orgs/' + orgId + '/stats/today'),
        { bookings: FieldValue.increment(1) }, { merge: true });
    });
    logger.info('booking counted', { orgId, bookingId });
  },
);

// (3) Scheduled job — Cloud Scheduler under the hood
export const releaseNoShows = onSchedule(
  { schedule: 'every 5 minutes', timeZone: 'Asia/Kolkata' },
  async () =&gt; {
    const cutoff = new Date(Date.now() - 10 * 60 * 1000);
    const stale = await db.collectionGroup('bookings')
      .where('checkedIn', '==', false).where('start', '&lt;', cutoff).limit(200).get();
    const batch = db.batch();
    stale.docs.forEach((d) =&gt; batch.update(d.ref, { status: 'released' }));
    await batch.commit();
  },
);</code></pre>
<ul>
  <li><strong>Retries are off by default</strong> for event triggers; with <code>retry: true</code> a thrown error re-delivers the event, so idempotency is mandatory, and permanent failures (bad data) should be logged and swallowed rather than retried forever.</li>
  <li>Old marker documents can be cleaned with a Firestore <strong>TTL policy</strong> on the <code>at</code> field instead of another cron.</li>
  <li><strong>Cold starts</strong>: initialise clients at module scope (reused across invocations), keep dependencies lean, and set <code>minInstances</code> on latency-critical callables (you pay for idle instances).</li>
</ul>
<table>
  <thead><tr><th></th><th>1st gen</th><th>2nd gen</th></tr></thead>
  <tbody>
    <tr><td>Runs on</td><td>Legacy Cloud Functions infrastructure</td><td>Cloud Run + Eventarc</td></tr>
    <tr><td>Concurrency</td><td>One request per instance</td><td>Many requests per instance (configurable)</td></tr>
    <tr><td>Max timeout</td><td>~9 min</td><td>Longer for HTTP (up to ~60 min), ~9 min for events — check docs</td></tr>
    <tr><td>Notes</td><td>Some legacy triggers (e.g. the non-blocking Auth <code>user().onCreate</code>) are 1st-gen only — check docs</td><td>Default for new code; traffic splitting, bigger instances</td></tr>
  </tbody>
</table>

<h3>7. Firebase Cloud Messaging (FCM)</h3>
<div class="diagram">
<pre>
 App starts ─► registers with FCM ─► gets REGISTRATION TOKEN ─► sends it to your backend
                                                                   (users/{uid}.fcmTokens)
 Your server (Admin SDK, HTTP v1 API)
      │
      ▼
   FCM backend ──► Android: Google Play services transport ──► device
              ├──► iOS: APNs (needs your APNs .p8 key uploaded to Firebase) ──► device
              └──► Web: Web Push (VAPID)
</pre>
</div>
<table>
  <thead><tr><th>Message type</th><th>Who displays it</th><th>Background behaviour</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td><strong>Notification</strong> (<code>notification: {title, body}</code>)</td><td>The OS, when the app is in background/killed</td><td>Shown automatically; your code runs only when tapped</td><td>Simple user-visible alerts</td></tr>
    <tr><td><strong>Data</strong> (<code>data: {...}</code> only)</td><td>Your code</td><td>Delivered to your handler; Android high priority can wake the app; iOS background delivery is throttled</td><td>Silent sync, custom UI</td></tr>
    <tr><td>Both</td><td>OS in background, your code in foreground</td><td>Data available when the user taps</td><td>Alert + deep-link payload</td></tr>
  </tbody>
</table>
<pre><code class="language-ts">// Server: send to all of a user's devices and prune dead tokens
import { getMessaging } from 'firebase-admin/messaging';

export async function notifyUser(uid: string, title: string, body: string, data: Record&lt;string, string&gt;) {
  const userRef = db.doc('users/' + uid);
  const tokens: string[] = (await userRef.get()).get('fcmTokens') ?? [];
  if (tokens.length === 0) return;

  const res = await getMessaging().sendEachForMulticast({
    tokens,                                       // up to 500 per call
    notification: { title, body },
    data,                                         // string values only; whole payload ~4 KB max
    android: { priority: 'high' },
    apns: { payload: { aps: { sound: 'default' } } },
  });

  const dead = res.responses
    .map((r, i) =&gt; (!r.success &amp;&amp; isDeadToken(r.error?.code) ? tokens[i] : null))
    .filter((t): t is string =&gt; t !== null);
  if (dead.length) await userRef.update({ fcmTokens: FieldValue.arrayRemove(...dead) });
}

const isDeadToken = (code?: string) =&gt;
  code === 'messaging/registration-token-not-registered' ||
  code === 'messaging/invalid-registration-token';</code></pre>

<pre><code class="language-ts">// RN client (@react-native-firebase/messaging, namespaced API)
import messaging from '@react-native-firebase/messaging';

// Must be registered at module scope in index.js, BEFORE AppRegistry.registerComponent
messaging().setBackgroundMessageHandler(async (msg) =&gt; { await syncFromData(msg.data); });

export async function registerForPush(uid: string) {
  const status = await messaging().requestPermission();  // iOS prompt; Android 13+ needs POST_NOTIFICATIONS too
  if (status === messaging.AuthorizationStatus.DENIED) return;
  await saveToken(uid, await messaging().getToken());   // arrayUnion into users/{uid}.fcmTokens
  return messaging().onTokenRefresh((t) =&gt; saveToken(uid, t));
}

// Foreground: the OS does NOT show the notification while your app is open — render it yourself
messaging().onMessage(async (msg) =&gt; showInAppBanner(msg.notification?.title, msg.notification?.body));</code></pre>
<p>Recent RNFirebase majors add a modular API (<code>getMessaging()</code>, <code>getToken(m)</code>) and deprecate the namespaced style above — check current docs. The legacy FCM server APIs (server key) were shut down in 2024; use HTTP v1 via the Admin SDK. For topics, <code>send({ topic: 'org_orgA', ... })</code> fans out without you storing tokens.</p>

<h3>8. Cloud Storage + a processing trigger</h3>
<pre><code class="language-ts">import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { getStorage } from 'firebase-admin/storage';

export const makeThumbnail = onObjectFinalized({ memory: '1GiB' }, async (event) =&gt; {
  const { name, contentType, bucket } = event.data;
  if (!name || !contentType?.startsWith('image/')) return;
  if (name.startsWith('thumbs/')) return;              // LOOP GUARD: our own output re-triggers us
  const [buf] = await getStorage().bucket(bucket).file(name).download();
  const thumb = await resize(buf, 256);                // e.g. sharp
  await getStorage().bucket(bucket).file('thumbs/' + name).save(thumb, { contentType });
});</code></pre>
<p>The client uploads straight to Storage (rules check size/type/owner), exactly like an S3 presigned upload — the bytes never pass through your functions.</p>

<h3>9. Emulator Suite and rules tests</h3>
<pre><code class="language-json">// firebase.json
{
  "firestore": { "rules": "firestore.rules", "indexes": "firestore.indexes.json" },
  "storage": { "rules": "storage.rules" },
  "functions": [{ "source": "functions", "codebase": "default" }],
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "functions": { "port": 5001 },
    "storage": { "port": 9199 },
    "ui": { "enabled": true }
  }
}</code></pre>
<pre><code class="language-ts">// firestore.rules.test.ts — run via: firebase emulators:exec --only firestore "npx jest"
import { initializeTestEnvironment, assertFails, assertSucceeds,
  type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { doc, getDoc, setDoc } from 'firebase/firestore';

let env: RulesTestEnvironment;
beforeAll(async () =&gt; {
  env = await initializeTestEnvironment({
    projectId: 'demo-rooms',            // "demo-" prefix: can never touch a real project
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});
afterAll(() =&gt; env.cleanup());

test('a member of another org cannot read bookings', async () =&gt; {
  await env.withSecurityRulesDisabled(async (ctx) =&gt; {
    await setDoc(doc(ctx.firestore(), 'orgs/orgA/bookings/b1'), { ownerUid: 'alice', title: 'Standup' });
  });
  const mallory = env.authenticatedContext('mallory', { orgId: 'orgB' }).firestore();
  await assertFails(getDoc(doc(mallory, 'orgs/orgA/bookings/b1')));

  const alice = env.authenticatedContext('alice', { orgId: 'orgA' }).firestore();
  await assertSucceeds(getDoc(doc(alice, 'orgs/orgA/bookings/b1')));
});</code></pre>
<p>Wire this into the pipeline (see <a href="#/topic/cloud-cicd">CI/CD &amp; Infrastructure as Code</a>): every PR runs the rules tests against the emulator; merges to main deploy with <code>firebase deploy --only firestore:rules,firestore:indexes,functions</code>.</p>

<h3>10. App Check</h3>
<p>Your Firebase config is public, so anyone can script your Firestore with a real (or anonymous) account. <strong>App Check</strong> attaches an attestation token from Play Integrity (Android), App Attest / DeviceCheck (iOS) or reCAPTCHA Enterprise (web), and Firestore, Storage, RTDB and callables can enforce it. It stops bots and scripts, <em>not</em> a malicious user inside your genuine app — rules are still your authorization. Roll it out in monitoring mode first, check the verified-request ratio, then enforce.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — Meeting-room booking with no double-booking</h3>
<p>Firestore has no unique constraints and no "overlapping interval" constraint. The trick: turn time into <strong>slot documents with deterministic IDs</strong> (one per room per 15 minutes). Creating a document that already exists fails, so the slot IDs act as a uniqueness constraint. Do it through the <strong>server door</strong> so clients cannot skip the check.</p>
<pre><code class="language-ts">export const createBooking = onCall({ enforceAppCheck: true }, async (request) =&gt; {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in');
  const { roomId, start, end, title } =
    request.data as { roomId: string; start: string; end: string; title: string };
  const orgId = request.auth.token.orgId as string;
  const uid = request.auth.uid;

  const slots = slotIds(roomId, new Date(start), new Date(end), 15);  // ['room42_202611051000', ...]
  if (slots.length === 0 || slots.length &gt; 32) throw new HttpsError('invalid-argument', 'Bad range');

  const bookingRef = db.collection('orgs/' + orgId + '/bookings').doc();
  await db.runTransaction(async (tx) =&gt; {
    const slotRefs = slots.map((s) =&gt; db.doc('orgs/' + orgId + '/slots/' + s));
    const snaps = await tx.getAll(...slotRefs);                 // Admin tx locks these docs
    if (snaps.some((s) =&gt; s.exists)) throw new HttpsError('already-exists', 'Room already booked');
    slotRefs.forEach((ref) =&gt; tx.create(ref, { bookingId: bookingRef.id }));
    tx.create(bookingRef, {
      roomId, title, ownerUid: uid, status: 'confirmed', checkedIn: false,
      start: new Date(start), end: new Date(end), createdAt: FieldValue.serverTimestamp(),
    });
  });
  return { bookingId: bookingRef.id };
});</code></pre>
<ul>
  <li>Cancellation deletes the booking <em>and</em> its slot docs in one transaction.</li>
  <li>Each room tablet runs <strong>one listener</strong> on today's bookings for its room → reads ≈ bookings changed per day, which is tiny.</li>
  <li>The relational version of the same problem (exclusion constraints, optimistic locking) is in <a href="#/topic/lld-booking-system">Case: Meeting Room Booking</a>.</li>
</ul>

<h3>Example 2 — Admin roles end to end</h3>
<pre><code class="language-ts">// Only an existing admin of the same org can promote someone
export const setRole = onCall(async (request) =&gt; {
  const caller = request.auth?.token;
  if (!caller || caller.role !== 'admin') throw new HttpsError('permission-denied', 'Admins only');
  const { uid, role } = request.data as { uid: string; role: 'admin' | 'member' };
  const target = await getAuth().getUser(uid);
  if (target.customClaims?.orgId !== caller.orgId) throw new HttpsError('permission-denied', 'Other org');
  await getAuth().setCustomUserClaims(uid, { ...target.customClaims, role });
  await db.doc('users/' + uid).update({ claimsUpdatedAt: FieldValue.serverTimestamp() });  // client listens → force refresh
  return { ok: true };
});</code></pre>
<p>Flow: bootstrap the first admin with a one-off Admin SDK script; rules read <code>request.auth.token.role</code>; the client listens to its own user document and calls <code>getIdToken(true)</code> when <code>claimsUpdatedAt</code> changes, so new permissions apply in seconds rather than at the next hourly refresh. To lock someone out immediately, call <code>revokeRefreshTokens(uid)</code>, verify with <code>checkRevoked</code> on your APIs, and keep a <code>disabled</code> flag the rules can read, because rules cannot see revocation.</p>

<h3>Example 3 — Chat with unread counts</h3>
<div class="diagram">
<pre>
chats/{chatId}                 { memberUids: [a, b], lastMessage: {text, at, by} }   ← denormalised for the inbox
chats/{chatId}/messages/{id}   { text, by, at }
chats/{chatId}/members/{uid}   { unread: 3, lastReadAt }
</pre>
</div>
<ul>
  <li><strong>Inbox</strong>: <code>where('memberUids', 'array-contains', uid)</code> + <code>orderBy('lastMessage.at', 'desc')</code> → one query, one composite index.</li>
  <li><strong>Thread</strong>: listener on the last 50 messages ordered by <code>at</code>; older pages via cursors.</li>
  <li><strong>Unread</strong>: an <code>onDocumentCreated</code> trigger on messages updates <code>lastMessage</code> and increments <code>unread</code> for every other member (server door — clients cannot touch other users' counters); the reader resets their own counter.</li>
  <li><strong>Push</strong>: the same trigger calls <code>notifyUser</code> for members who are not currently in the thread (presence from RTDB).</li>
</ul>

<h3>Example 4 — Estimating the Firestore read bill</h3>
<pre><code class="language-text">App: room booking, 5,000 DAU, home screen opened 6 times/day
Home screen = 20 bookings + 1 user doc + 1 org doc = 22 reads
  5,000 x 6 x 22                       = 660,000 reads/day
Room tablets: 300 tablets x ~40 changes/day = 12,000 reads/day
Total ~ 672K reads/day ~ 20M reads/month
Free tier covers 50K/day (at time of writing); the rest is billed per 100K reads
  -&gt; tens of dollars a month. Fine.

The bug: a developer adds onSnapshot(collection(db, 'orgs', orgId, 'bookings'))
with no filter. Org has 10,000 bookings.
  5,000 x 6 x 10,000 = 300,000,000 reads/day  (~450x more)
At an illustrative $0.06 per 100K reads (check your region's price) = ~$180/day.</code></pre>
<p>The lesson interviewers want: <strong>cost is driven by query shape × screen opens, not by user count</strong>. Put a budget alert on the project, add a dashboard of reads per collection (Firestore usage / Cloud Monitoring), and code-review every new listener.</p>

<h3>Example 5 — Hybrid: Firebase Auth + an AWS backend</h3>
<p>A very common real-world shape: keep Firebase Auth and FCM for the mobile app, run the API on AWS. Firebase ID tokens are standard OIDC JWTs, so an API Gateway HTTP API JWT authorizer can validate them directly (issuer <code>https://securetoken.google.com/&lt;projectId&gt;</code>, audience = project id — check current docs).</p>
<pre><code class="language-ts">import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpJwtAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

const authorizer = new HttpJwtAuthorizer('FirebaseJwt',
  'https://securetoken.google.com/' + firebaseProjectId,
  { jwtAudience: [firebaseProjectId] });

const api = new HttpApi(this, 'BookingApi');
api.addRoutes({
  path: '/bookings', methods: [HttpMethod.POST],
  integration: new HttpLambdaIntegration('CreateBooking', createBookingFn),
  authorizer,
});</code></pre>
<p>Custom claims (<code>role</code>, <code>orgId</code>) arrive in the Lambda event's JWT claims. This is also the gentlest migration path off Firebase: move data and APIs first, identity last. See <a href="#/topic/cloud-api-gateway">API Gateway</a> and <a href="#/topic/cloud-cognito">Cognito</a>.</p>

<h3>Example 6 — Analytics without hammering Firestore</h3>
<p>Dashboards that aggregate across all bookings ("utilisation by floor by week") are a bad fit for Firestore queries. Stream changes to <strong>BigQuery</strong> (the official "Stream Firestore to BigQuery" extension, or scheduled exports) and query there; or maintain rollup docs (<code>stats/2026-W45</code>) from triggers for the handful of numbers the app itself shows.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. Listener fires twice for one write</h3>
<p>Latency compensation: the local write fires the listener immediately with <code>metadata.hasPendingWrites === true</code>, then again when the server confirms. Don't treat the first event as "saved" for anything important.</p>

<h3>2. serverTimestamp() is null locally</h3>
<p>Until the server confirms, a pending <code>serverTimestamp()</code> reads as <code>null</code>. Sorting by it puts new items in the wrong place. Use <code>doc.data({ serverTimestamps: 'estimate' })</code> for display.</p>

<h3>3. Deleting a document leaves its subcollections</h3>
<p>Subcollections are independent; deleting <code>orgs/orgA</code> orphans every booking. Use a recursive delete (the CLI's recursive flag or the Admin SDK's recursive delete) from a trusted job.</p>

<h3>4. "permission-denied" on a list that works for single docs</h3>
<p>Rules are not filters. The list query lacks the <code>where</code> clause that makes it provably safe. Add the same constraint the rule checks.</p>

<h3>5. Stale custom claims</h3>
<p>Changed claims only appear after the next token refresh (up to ~1 hour). Force-refresh on the client after role changes; for revocation, rules alone cannot help — check a <code>disabled</code> flag.</p>

<h3>6. Write hotspots</h3>
<p>A single "global counter" doc or a strictly increasing indexed field at thousands of writes/sec causes contention errors and latency. Shard counters, use auto-IDs, and exempt hot timestamp fields from indexing if you never query them.</p>

<h3>7. Client transactions re-run</h3>
<p>The update function can execute several times under contention. A <code>fetch()</code> or analytics event inside it fires several times. Keep it pure; do side effects after it resolves.</p>

<h3>8. Duplicate and out-of-order triggers</h3>
<p>Event delivery is at-least-once with no ordering guarantee. Dedupe on <code>event.id</code> and, for updates, compare a <code>version</code> or <code>updatedAt</code> so an older event cannot overwrite newer derived state.</p>

<h3>9. Trigger loops</h3>
<p>An <code>onDocumentWritten</code> handler that writes to the <em>same</em> document triggers itself forever — a classic surprise bill. Exit early when the fields you care about did not change, or write derived data elsewhere.</p>

<h3>10. iOS push silently never arrives</h3>
<p>Tokens are issued even if the APNs key is missing or the Push Notifications capability / <code>aps-environment</code> entitlement is wrong. Upload the APNs auth key (.p8) to Firebase and test on a real device.</p>

<h3>11. Android data messages and killed apps</h3>
<p>Data-only messages need <code>priority: 'high'</code> to wake the app, and aggressive OEM battery managers may still delay them. For must-see alerts, include a <code>notification</code> block so the OS displays it.</p>

<h3>12. Multiple devices and logout</h3>
<p>Tokens are per app install. Store an array (or a <code>devices</code> subcollection) per user; on logout delete that device's token so the next user of a shared tablet does not receive the previous user's pushes.</p>

<h3>13. Offset pagination is billed</h3>
<p>Skipped documents in an <code>offset</code> query are still charged as reads. Use cursors (<code>startAfter</code>).</p>

<h3>14. Region mismatch</h3>
<p>Firestore's location is fixed at creation. Functions default to <code>us-central1</code>; a function there talking to a Firestore in <code>asia-south1</code> adds a cross-region round trip to every call. Set the function region explicitly.</p>

<h3>15. Empty queries still cost</h3>
<p>A query that returns zero documents is billed a minimum of one read. Polling an empty collection every few seconds from thousands of clients adds up.</p>

<h3>16. Listener reconnect after a long offline period</h3>
<p>If a listener has been disconnected for more than about 30 minutes, re-attaching is billed as a new query (all results re-read). Apps that background/foreground often should not hold huge listeners.</p>

<h3>17. <code>in</code> query value cap</h3>
<p><code>in</code> / <code>array-contains-any</code> accept a limited number of values (30 at time of writing). Chunk the list and merge results, or restructure the data.</p>

<h3>18. 1 MiB document creep</h3>
<p>Arrays that grow with usage (all bookings inside the room doc, all messages inside the chat doc) eventually hit the size cap, and every write rewrites the whole document. Move unbounded lists to subcollections early.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — shipping test-mode rules</h3>
<p><code>allow read, write: if true;</code> (or the time-limited test-mode rule) in production. Either your data is public, or the app suddenly breaks when the date passes. Start from deny-all and add rules with tests.</p>

<h3>Anti-pattern 2 — trusting client-writable fields for authorization</h3>
<p>A rule like <code>if resource.data.isAdmin == true</code> on a document the user can edit. Roles belong in custom claims or in documents only Functions can write; use <code>affectedKeys().hasOnly([...])</code> to lock fields.</p>

<h3>Anti-pattern 3 — filtering on the client</h3>
<p>Downloading a whole collection and filtering in JS. You pay for every document, leak data the user should not see, and it gets slower as data grows. Push the filter into the query (and the rule).</p>

<h3>Anti-pattern 4 — a normalised SQL schema in Firestore</h3>
<p>Bookings that store only <code>roomId</code> and <code>userId</code>, then one extra read per row to show names — an N+1 that multiplies reads. Denormalise display fields and keep them in sync from a trigger.</p>

<h3>Anti-pattern 5 — leaking listeners</h3>
<p><code>onSnapshot</code> without returning the unsubscribe from <code>useEffect</code>. Every remount adds another listener — duplicate UI updates, memory growth and multiplied reads.</p>

<h3>Anti-pattern 6 — the god document</h3>
<p>One user document holding profile, settings, history and device tokens. Hits the 1 MiB cap, causes write contention across features, and every small change re-sends a large payload to every listener.</p>

<h3>Anti-pattern 7 — non-idempotent triggers</h3>
<p>Sending an email or charging a card directly in a retried trigger. At-least-once delivery means it will eventually happen twice. Record a dedupe marker in the same transaction as the effect, or use the provider's idempotency key.</p>

<h3>Anti-pattern 8 — secrets in the client or in function source</h3>
<p>An LLM or payment key in the RN bundle can be extracted in minutes. Put it in Secret Manager via <code>defineSecret</code> and call the provider from a callable.</p>

<h3>Anti-pattern 9 — ignoring dead FCM tokens</h3>
<p>Never pruning <code>registration-token-not-registered</code> errors: send latency and failure rates grow forever, and analytics show phantom "sent" counts.</p>

<h3>Anti-pattern 10 — no cost guardrails</h3>
<p>No <code>maxInstances</code> on functions, no budget alert, no per-collection read monitoring. Note that budget alerts <em>notify</em>; they do not cap spending unless you wire a function to react.</p>

<h3>Anti-pattern 11 — RTDB for everything, or Firestore for presence</h3>
<p>RTDB for complex querying ends in client-side joins; Firestore for typing indicators ends in a write per keystroke per user. Use each for what it is good at.</p>

<h3>Anti-pattern 12 — testing rules by clicking around</h3>
<p>Rules are code that guards every byte of data. Without emulator tests in CI, a refactor that widens access ships silently.</p>

<h3>Anti-pattern 13 — one Firebase project for dev, staging and prod</h3>
<p>Shared data, shared quotas, and a dev deploy can overwrite prod rules. Use one project per environment and select with <code>firebase use</code> aliases.</p>

<h3>Anti-pattern 14 — counting by reading</h3>
<p><code>getDocs(...).size</code> to show "37 bookings" reads 37 documents every time. Use <code>getCountFromServer</code> or a maintained counter.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. Firestore or Realtime Database — how do you choose?</div>
  <div class="qa-answer">
    <p>Firestore by default: collections and documents, compound indexed queries, cursor pagination, better scaling model. It bills per document operation. Realtime Database is one JSON tree with very low latency, bandwidth-based billing and built-in <code>onDisconnect()</code>, but weak querying and per-database limits. I use RTDB for presence, typing indicators and live cursors — many tiny frequent updates where per-operation billing would hurt — and Firestore for everything else, often both in one app.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. The client talks straight to the database. How is that secure?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Authentication</strong>: every request carries a Firebase ID token; rules see it as <code>request.auth</code>.</li>
      <li><strong>Authorization + validation in Security Rules</strong>: ownership, org membership via custom claims, field whitelists with <code>keys().hasOnly</code>, type and size checks, <code>request.time</code> for timestamps.</li>
      <li><strong>Server door for trusted logic</strong>: anything involving secrets, other users' data or invariants (uniqueness, payments) goes through callables using the Admin SDK.</li>
      <li><strong>App Check</strong> to block scripted clients using the public config.</li>
      <li><strong>Emulator tests</strong> for rules in CI, deny-by-default, one project per environment.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. Explain "rules are not filters" with an example.</div>
  <div class="qa-answer">
    <p>Rules don't remove forbidden documents from a result; they decide whether a query is allowed at all, by checking that every document it <em>could</em> return satisfies the rule. If bookings are readable only when <code>ownerUid == request.auth.uid</code>, then querying the whole collection is rejected even if every booking happens to be yours. The query must include <code>where('ownerUid', '==', uid)</code>. This is what lets Firestore evaluate rules once per query instead of once per document.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Design the Firestore schema for a meeting-room booking app. How do you stop double-booking?</div>
  <div class="qa-answer">
    <p>Start from screens: room tablet (today's bookings for one room), "my bookings", org admin dashboard. Schema: <code>orgs/{org}/rooms</code>, <code>orgs/{org}/bookings</code> with <code>roomId</code>, <code>start</code>, <code>end</code>, <code>ownerUid</code>, and a denormalised <code>roomName</code>; composite index on <code>(roomId, start)</code>. Firestore has no overlap constraint, so I model 15-minute <strong>slot documents with deterministic IDs</strong> (<code>room42_202611051000</code>) and create them in an Admin SDK transaction inside a callable: if any slot exists, abort. Creating an existing doc fails, so the IDs act as a unique index. Cancellation deletes booking and slots in one transaction. Daily stats are maintained by a trigger, not counted on read.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. How does Firestore pricing work, and how would you cut a bill?</div>
  <div class="qa-answer">
    <p>You pay per document read, write and delete, plus storage and egress, with a daily free quota. Reads dominate. Listeners bill per document in the initial result and per change; queries with zero results still cost one read; offset-skipped docs are billed; a listener reconnecting after ~30 minutes offline re-reads everything. To cut it: find the hot collections in usage metrics; add filters and <code>limit</code> to unbounded queries and listeners; cursor pagination; denormalise to kill N+1 reads; replace count-by-reading with aggregation queries or counters; cache rarely-changing data on the client; move analytics to BigQuery; and code-review every new <code>onSnapshot</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How do you implement RBAC in Firebase?</div>
  <div class="qa-answer">
    <p>Coarse roles and tenant id go into <strong>custom claims</strong> set by an admin-only callable or back-office script; rules read <code>request.auth.token.role</code> with no extra document read. Claims are size-limited and only refresh with the token, so I force a refresh after changes and never put fine-grained permission lists in them. Finer permissions (per-room managers, sharing) live in documents that only Functions write, checked with <code>get()</code> in rules — costing a read and counting toward the per-request lookup cap. For deep permission graphs I'd move authorization to an API layer. Broader models are in <a href="#/topic/api-auth-rbac">AuthN, AuthZ &amp; RBAC</a>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Cloud Functions event triggers are at-least-once. What does that change in your code?</div>
  <div class="qa-answer">
    <p>Any handler may run twice, and events may arrive out of order. So: make effects idempotent (dedupe marker keyed by <code>event.id</code> created in the same transaction as the effect, or provider idempotency keys); compare versions/timestamps before overwriting derived state; separate retryable errors (throw, with <code>retry: true</code>) from permanent ones (log and return, otherwise you retry forever); and guard against self-triggering loops by exiting when the relevant fields did not change. Same thinking as SQS consumers in <a href="#/topic/be-queues">Queues &amp; Streaming</a>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Walk me through push notifications with FCM, including iOS.</div>
  <div class="qa-answer">
    <p>The app requests permission (iOS prompt; Android 13+ <code>POST_NOTIFICATIONS</code>), gets an FCM registration token and sends it to the backend, which stores tokens per user and device and listens for refreshes. The server sends via the HTTP v1 API (Admin SDK <code>send</code> / <code>sendEachForMulticast</code>, up to 500 tokens), choosing notification, data or both: notification messages are shown by the OS in background; data messages go to your handler. On iOS, FCM relays through APNs, so the APNs auth key must be uploaded and the entitlement present. In foreground the OS does not display the alert — the app does. The server prunes tokens that return "not registered". Topics give fan-out without storing tokens.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. What changed with 2nd-gen Cloud Functions, and how do you handle cold starts?</div>
  <div class="qa-answer">
    <p>2nd gen runs on Cloud Run + Eventarc: one instance can serve many concurrent requests, HTTP functions can run much longer, and you get bigger instances and traffic splitting. Fewer instances under load means fewer cold starts and connection reuse — but module-level state is now shared across concurrent requests, so it must be safe. Cold-start mitigations: initialise SDK clients at module scope, keep bundles small, lazy-import heavy libraries, set <code>minInstances</code> for latency-critical callables (paid idle time), and keep functions in the same region as Firestore.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. How do you test rules and functions before deploying?</div>
  <div class="qa-answer">
    <p>The Emulator Suite runs Auth, Firestore, Functions and Storage locally. Rules are tested with <code>@firebase/rules-unit-testing</code>: seed data with rules disabled, then <code>assertSucceeds</code> / <code>assertFails</code> as different authenticated contexts with different claims — including the negative cases (other org, extra fields, forged timestamps). Functions are tested against the emulators end to end. CI runs <code>firebase emulators:exec "npm test"</code> on every PR, and deploys rules, indexes and functions from the pipeline, never from a laptop.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. (FDE) A customer says: "Our Firebase bill went up 10× overnight." What do you do?</div>
  <div class="qa-answer">
    <ol>
      <li><strong>Stop the bleeding if it is still climbing</strong>: identify the product (Firestore reads? Functions invocations? egress?) in the billing report; if a function is looping, cap <code>maxInstances</code> or disable it.</li>
      <li><strong>Correlate with deploys</strong>: what shipped yesterday — a new screen, listener, trigger, or app release?</li>
      <li><strong>Firestore usage by collection</strong> and Functions invocation counts: the usual suspects are an unfiltered listener, a trigger writing to the doc that triggers it, a polling loop, or a scraper using the public config (App Check metrics show unverified traffic).</li>
      <li><strong>Fix + guardrails</strong>: hotfix the query or guard the trigger; add budget alerts, <code>maxInstances</code>, App Check enforcement, and a CI check or review rule for new listeners.</li>
      <li><strong>Communicate</strong>: a short write-up for the customer with cause, fix, cost impact, and prevention; ask Google support about a billing adjustment if it was a clear bug.</li>
    </ol>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. Firebase or AWS for a new product — and how would you migrate later?</div>
  <div class="qa-answer">
    <table>
      <thead><tr><th>Lean Firebase when</th><th>Lean AWS when</th></tr></thead>
      <tbody>
        <tr><td>Small team, mobile-first, needs realtime/offline fast</td><td>Complex backend logic, relational data, heavy reporting</td></tr>
        <tr><td>Simple ownership/membership authorization</td><td>Enterprise customers: VPC, SSO, data residency, audits</td></tr>
        <tr><td>Unpredictable early traffic, near-zero ops</td><td>Predictable high volume where per-read pricing hurts</td></tr>
        <tr><td>Prototype / MVP / FDE proof-of-concept</td><td>Customer already standardised on AWS, or needs to run it in their account</td></tr>
      </tbody>
    </table>
    <p>Migration: hybrid first — keep Firebase Auth (an API Gateway JWT authorizer can validate its tokens) and FCM, move new features to an AWS API with Postgres, dual-write or export/import existing collections, then flip reads, then retire Firestore. Identity moves last because it forces users to re-authenticate. If an AWS-native "Firebase-like" experience is wanted, compare with <a href="#/topic/cloud-amplify">Amplify</a>.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You separate the client door (rules) from the server door (Admin SDK) without prompting.</li>
    <li>You say "rules are not filters" and write a rule with field whitelisting.</li>
    <li>You model Firestore from the screen backwards and denormalise on purpose.</li>
    <li>You estimate reads per screen × opens and know the listener billing traps.</li>
    <li>You treat triggers as at-least-once and guard against loops.</li>
    <li>You know FCM goes through APNs on iOS and prune dead tokens.</li>
    <li>You can argue Firebase vs AWS for a specific customer, including a migration path.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Write Firestore rules for an org-scoped bookings collection that whitelist fields and force server timestamps.</div>
  <div class="qa-answer">
    <p>Nest the match under the org so membership (from custom claims) gates everything, and validate the document as it would look <em>after</em> the write (<code>request.resource.data</code>):</p>
    <pre><code class="language-text">match /orgs/{orgId}/bookings/{bookingId} {
  allow read: if isMember(orgId);
  allow create: if isMember(orgId)
    &amp;&amp; request.resource.data.keys().hasOnly(['roomId', 'start', 'end', 'title', 'ownerUid', 'createdAt'])
    &amp;&amp; request.resource.data.ownerUid == request.auth.uid
    &amp;&amp; request.resource.data.title is string
    &amp;&amp; request.resource.data.title.size() &lt;= 120
    &amp;&amp; request.resource.data.end &gt; request.resource.data.start
    &amp;&amp; request.resource.data.createdAt == request.time;
  allow update, delete: if resource.data.ownerUid == request.auth.uid || isAdmin(orgId);
}</code></pre>
    <p><code>keys().hasOnly(...)</code> stops clients smuggling extra fields like <code>isAdmin: true</code>, and <code>createdAt == request.time</code> forces the client to send <code>serverTimestamp()</code>, so timestamps can't be forged. Rules don't cascade, so anything without a matching <code>allow</code> (for example a <code>stats</code> collection only Functions write) is denied by default.</p>
  </div>
</div>
<div class="qa-block">
  <div class="qa-question">Q14. Estimate the daily Firestore read cost of a screen. What drives it?</div>
  <div class="qa-answer">
    <p>Reads ≈ users × screen opens × documents read per open, plus listener changes. Example: a booking app with 5,000 DAU opening a home screen 6 times a day that reads 20 bookings + 1 user doc + 1 org doc = 22 reads, so 5,000 × 6 × 22 = 660K reads/day; 300 room tablets with one listener each at ~40 changes/day add 12K. That is ~672K reads/day (~20M/month): tens of dollars a month, fine.</p>
    <p>Now someone adds an unfiltered <code>onSnapshot</code> on an org's 10,000 bookings: 5,000 × 6 × 10,000 = 300M reads/day, about 450× more. The lesson is that cost is driven by <strong>query shape × screen opens, not user count</strong>, so I put a budget alert on the project, watch reads per collection, and code-review every new listener (prices are illustrative; check your region).</p>
  </div>
</div>
` },

  ]
});
