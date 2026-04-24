window.PREP_SITE.registerTopic({
  id: 'sd-cases',
  module: 'Frontend System Design',
  title: 'Case Studies',
  estimatedReadTime: '40 min',
  tags: ['system-design', 'case-study', 'twitter', 'chat', 'docs', 'autocomplete', 'feed', 'youtube'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>Worked examples of the 10-Step Framework applied to popular system-design prompts. Each case study follows the same template — clarify → estimate → architecture → data → API → components → state → perf → edges → deep dive — so you can practice the pattern end-to-end.</p>
<p>Studies in this topic:</p>
<ol>
  <li><strong>Twitter / News Feed</strong> — infinite scroll, real-time tweets, optimistic likes.</li>
  <li><strong>Chat app (WhatsApp / Slack)</strong> — WebSockets, message ordering, offline replay.</li>
  <li><strong>Google Docs-style collaborative editor</strong> — CRDT, presence, offline sync.</li>
  <li><strong>Autocomplete / typeahead (Google Search)</strong> — debouncing, caching, ranking.</li>
  <li><strong>Video streaming (YouTube / Netflix)</strong> — adaptive bitrate, buffering, resume.</li>
  <li><strong>Photo/video upload (Instagram)</strong> — chunked upload, client-side compression, progress.</li>
</ol>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Read each study twice. First for the shape — what decisions were made where. Second for the vocabulary — the precise terms (cursor pagination, optimistic mutation with rollback, CRDT, adaptive bitrate) that make your interview answers sound senior.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'case-1-twitter', title: '🐦 Case 1 — Twitter / News Feed', html: `
<h3>Step 1 — Clarify</h3>
<pre><code>FUNCTIONAL
- View a home timeline of tweets from followed accounts
- Like, retweet, reply
- Live updates — new tweets appear without refresh
- Media (image, short video) inline
- Deep-link to a single tweet

NON-FUNCTIONAL
- LCP &lt; 2.5s on 4G mobile
- Support 500+ tweets scrolled in one session without jank
- Accessible — keyboard nav, screen reader, high-contrast
- Graceful offline (show cached tweets, queue likes)
- English + RTL (Arabic) + Japanese (CJK wrapping)

OUT OF SCOPE
- Compose flow, auth, DMs, search, lists, notifications tab</code></pre>

<h3>Step 2 — Scale</h3>
<pre><code>DAU:             200M
Concurrent peak: ~10M
Tweets/session:  ~500 scrolled, ~50 read fully
Avg tweet size:  1 KB text + media references
Media per screen: 3-5 images
Requests per initial load: 1 HTML, 3 JS chunks, 1 main CSS, ~20 images, 3 API
Session data:    ~15-25 MB (mostly media)
Live-update rate per user: ~1 new tweet / 10 sec at peak</code></pre>
<p>Implications: must virtualize (500 rows), CDN for media, WebSocket channel for live, aggressive image optimization.</p>

<h3>Step 3 — High-Level Architecture</h3>
<pre><code>┌──────────────┐   HTML (SSR) ──┐
│              │◄───────────────┤
│   Browser    │   API (REST)    │   ┌──────────┐
│  React + RSC │───────────────► │   │ Edge CDN │
│              │                 │   └────┬─────┘
│              │   WebSocket     │        │
│              │◄────────────────┤        ▼
│              │                 │   ┌──────────┐
│              │   Media (HTTP)  │   │ Origin + │
│              │◄────────────────┤   │ API GW   │
└──────────────┘                 │   └────┬─────┘
                                 │        │
                                 ▼        ▼
                            Realtime WS  Tweet DB / Redis / Media storage</code></pre>

<h3>Step 4 — Client Data Model</h3>
<pre><code>// Normalized cache
tweetsById:  { [id]: { id, authorId, text, mediaIds[], createdAt, likes, retweets, replies, liked, retweeted } }
usersById:   { [id]: { id, handle, name, avatar, verified } }
mediaById:   { [id]: { id, type, url, thumbUrl, width, height } }

// Views
feed.tweetIds:   string[]        // ordered, most recent first
feed.nextCursor: string          // opaque server cursor
feed.newPending: string[]        // IDs arrived via WS, not yet shown ("5 new")</code></pre>

<h3>Step 5 — API</h3>
<pre><code>GET  /feed?cursor&amp;limit=20
     → { tweets, users, media, nextCursor }
POST /tweet/:id/like      → { likesCount }
POST /tweet/:id/unlike
POST /tweet/:id/retweet
GET  /tweet/:id           → { tweet, replies:[], users, media }
WS   /feed/subscribe
     ← { type: 'new_tweet', tweet, author, media }
     ← { type: 'engagement', tweetId, likesCount }</code></pre>

<h3>Step 6 — Components</h3>
<pre><code>&lt;App&gt;
  &lt;NavBar /&gt;
  &lt;FeedPage&gt;
    &lt;FeedProvider&gt; // React Query + WS subscription
      &lt;NewTweetsPill /&gt;        // "5 new tweets — click to see"
      &lt;VirtualizedFeed&gt;
        &lt;TweetCard&gt;            // memoized
          &lt;Avatar /&gt; &lt;TweetText /&gt; &lt;MediaGrid /&gt;
          &lt;EngagementBar /&gt;    // like / retweet / reply
        &lt;/TweetCard&gt;
      &lt;/VirtualizedFeed&gt;
    &lt;/FeedProvider&gt;
  &lt;/FeedPage&gt;
  &lt;MediaLightbox /&gt;   // portal for full-screen media
  &lt;Toaster /&gt;
&lt;/App&gt;</code></pre>

<h3>Step 7 — State Management</h3>
<ul>
  <li><strong>Server state</strong>: React Query infinite query <code>['feed']</code>. Each page merged into normalized cache.</li>
  <li><strong>Live tweets</strong>: WS message prepends to <code>newPending</code>, shows pill. When pill clicked, merge into main list and scroll to top.</li>
  <li><strong>Engagement</strong>: optimistic mutation — increment counter locally, rollback on error.</li>
  <li><strong>URL state</strong>: <code>/tweet/:id</code> for deep links — opens modal over feed with scroll restoration.</li>
  <li><strong>UI state</strong>: lightbox open, composer open — local useState.</li>
</ul>

<h3>Step 8 — Performance</h3>
<ul>
  <li><strong>LCP</strong>: SSR first 10 tweets; hero image of first tweet preloaded + <code>fetchpriority="high"</code>. Critical CSS inlined. Fonts preloaded with <code>font-display: optional</code>.</li>
  <li><strong>INP</strong>: virtualized feed (<code>@tanstack/virtual</code>). Memoized TweetCard. <code>startTransition</code> when applying live updates.</li>
  <li><strong>CLS</strong>: fixed <code>aspect-ratio</code> on media; reserved skeleton space; avatars fixed size.</li>
  <li><strong>Bundle</strong>: route-split. Lightbox lazy. Media viewer only loaded if user taps image.</li>
  <li><strong>Perceived</strong>: optimistic likes; skeleton while loading next page; scroll position restored on back-nav.</li>
  <li><strong>Network-adaptive</strong>: check <code>navigator.connection.effectiveType</code>; on 2G, skip autoplay video, lower image quality.</li>
</ul>

<h3>Step 9 — Edge Cases</h3>
<ul>
  <li><strong>Offline</strong>: service worker caches last 100 tweets. Queue likes/retweets in IndexedDB; replay on reconnect. Show "offline" banner with sync status.</li>
  <li><strong>A11y</strong>: each tweet is an <code>&lt;article&gt;</code>; keyboard <code>j</code>/<code>k</code> for next/prev; ARIA live region announces "5 new tweets"; screen reader hides engagement counts until tweet focused.</li>
  <li><strong>i18n</strong>: <code>dir="rtl"</code> for Arabic; logical CSS properties (<code>margin-inline-start</code>); <code>Intl.RelativeTimeFormat</code> for "3m ago."</li>
  <li><strong>Errors</strong>: Error boundary per page; failed like rolls back; 429 rate-limit shows explicit "slow down" toast; 500 shows retry button.</li>
  <li><strong>Memory</strong>: evict tweets scrolled past a threshold (e.g., 200 rows away).</li>
  <li><strong>Tab backgrounded</strong>: pause WS heartbeat; on visible, refresh feed head.</li>
  <li><strong>Security</strong>: CSP, sanitize tweet HTML, escape URLs, safe image proxy.</li>
</ul>

<h3>Step 10 — Deep Dive: "How does a new tweet appear live?"</h3>
<ol>
  <li>Page mount: open WS to <code>/feed/subscribe</code>, auth via token in query or initial message.</li>
  <li>Server pushes <code>{ type: 'new_tweet', tweet, author, media }</code>.</li>
  <li>Client handler: write tweet + author + media to normalized cache via <code>queryClient.setQueryData</code>.</li>
  <li>Append id to <code>newPending</code>. If the feed is scrolled to top AND the tab is focused, merge immediately (no pill); otherwise show the "N new tweets" pill.</li>
  <li>Pill click: prepend <code>newPending</code> ids to <code>feed.tweetIds</code>, scroll to top (<code>scrollBehavior: 'smooth'</code>), clear <code>newPending</code>.</li>
  <li>WS drops: auto-reconnect with exponential backoff. On reconnect, request delta since last seen tweet id so we catch up.</li>
  <li>Memory cap: if <code>newPending</code> exceeds 100 (user left tab for hours), trim to latest 100 and show "100+ new tweets."</li>
  <li>A11y: update an <code>aria-live="polite"</code> region when the pill appears or count changes, so screen readers announce.</li>
</ol>
<p>Alternatives considered:</p>
<ul>
  <li><strong>Polling every 30s</strong>: simpler, no WS infra, but higher latency and server load at scale.</li>
  <li><strong>SSE</strong>: one-way push, simpler than WS; valid choice. We'd switch to WS if bidirectional (typing indicators, presence) is needed.</li>
  <li><strong>Full refresh on focus</strong>: not "live"; rejected given the prompt says live updates.</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'case-2-chat', title: '💬 Case 2 — Chat App (WhatsApp / Slack)', html: `
<h3>Step 1 — Clarify</h3>
<pre><code>FUNCTIONAL
- 1:1 and group chats
- Send text messages, images, emojis
- Typing indicators + presence (online/offline)
- Read receipts
- Message history — scroll back
- Offline: read cached, queue sends

NON-FUNCTIONAL
- Delivery latency &lt; 200ms for connected peers
- Preserve message order within a conversation
- Works after network drop (offline queue)
- Mobile web + desktop web

OUT OF SCOPE
- Voice / video calls, file upload beyond images, e2e encryption specifics (use TLS)</code></pre>

<h3>Step 2 — Scale</h3>
<pre><code>Users:      100M DAU
Active conversations per user: ~20
Messages/day/user: ~50
Message size: ~200 bytes text
Concurrent WS connections: ~20M peak
Messages/sec globally: ~500K at peak</code></pre>

<h3>Step 3 — Architecture</h3>
<pre><code>Browser ─WS─► Realtime Gateway ─► Kafka/bus ─► Message store (sharded)
       └─HTTP─► API GW ─► REST endpoints
       └─HTTP─► Media upload ─► Object storage (presigned URL flow)</code></pre>

<h3>Step 4 — Data Model</h3>
<pre><code>conversationsById: { [id]: { id, memberIds, lastMessageId, unreadCount, lastReadAt } }
messagesById:      { [id]: { id, convId, authorId, body, mediaId?, createdAt, deliveredAt, readBy[] } }
usersById:         { [id]: { id, name, avatar, presence } }

views:
conversationList: conversationId[]          // sorted by lastMessageAt
messagesByConv:   { [convId]: messageId[] } // ordered oldest → newest
pendingSends:     Message[]                 // offline queue, stored in IndexedDB</code></pre>

<h3>Step 5 — API</h3>
<pre><code>GET  /conversations
GET  /conversations/:id/messages?before=cursor&amp;limit=50
POST /messages                      // send — returns {id, createdAt}
POST /messages/:id/read
WS   /connect
  ← { type: 'message', msg }
  ← { type: 'typing', convId, userId }
  ← { type: 'read', convId, userId, messageId }
  ← { type: 'presence', userId, status }
  → { type: 'typing', convId }      // client sends typing</code></pre>

<h3>Step 6 — Components</h3>
<pre><code>&lt;App&gt;
  &lt;ConversationList /&gt;
  &lt;ConversationView convId&gt;
    &lt;MessageList&gt;             // virtualized, scroll-to-bottom on new
      &lt;MessageBubble /&gt;       // memoized; renders status: pending / sent / delivered / read
    &lt;/MessageList&gt;
    &lt;TypingIndicator /&gt;
    &lt;Composer /&gt;              // input + send + attach
  &lt;/ConversationView&gt;
  &lt;PresenceBadge /&gt;
&lt;/App&gt;</code></pre>

<h3>Step 7 — State</h3>
<ul>
  <li><strong>Server state</strong>: conversations via React Query; messages in a custom store keyed by conv id for append efficiency.</li>
  <li><strong>WS stream</strong>: single connection, dispatches to message store, conversation summaries, typing/presence state.</li>
  <li><strong>Composer</strong>: local controlled state; debounced "typing" events emitted.</li>
  <li><strong>Offline queue</strong>: IndexedDB-backed; replays on <code>online</code> event.</li>
  <li><strong>Read receipts</strong>: on scroll-to-bottom and tab focus, mark messages read; optimistic local update, then POST.</li>
</ul>

<h3>Step 8 — Performance</h3>
<ul>
  <li>Virtualized message list — 10K messages fine.</li>
  <li>Memoized <code>MessageBubble</code>; stable handlers via useCallback.</li>
  <li>Lazy-load older history on scroll up; prefetch when within 200px of top.</li>
  <li>Typing events throttled to 1/s.</li>
  <li>Images use responsive srcset + blur-up placeholder.</li>
</ul>

<h3>Step 9 — Edge Cases</h3>
<ul>
  <li><strong>Message ordering</strong>: server timestamp + tiebreaker (sequence number per conv). Client sorts by that, not by receive time.</li>
  <li><strong>Dedupe</strong>: client sends with a <code>clientId</code> (UUID). Server echoes it back. If the message already exists locally, replace the pending one.</li>
  <li><strong>Offline send</strong>: message enters cache as <code>status: pending</code>. On reconnect, flush pending queue in order.</li>
  <li><strong>Reconnect</strong>: WS closes → exponential backoff. On reconnect, server sends missed messages since <code>lastMessageId</code>.</li>
  <li><strong>Typing across reconnect</strong>: typing state is ephemeral; clear on disconnect.</li>
  <li><strong>A11y</strong>: <code>aria-live="polite"</code> for incoming messages; keyboard shortcut list (<code>?</code>).</li>
  <li><strong>Unread count</strong>: computed server-side; client increments optimistically on new message; reset to 0 on conv open + server confirm.</li>
  <li><strong>Large groups (1000 members)</strong>: typing indicator becomes "several people are typing" to avoid flooding.</li>
  <li><strong>Tab background</strong>: WS keeps alive; badge title updates with unread count; notifications API (permission-gated).</li>
</ul>

<h3>Step 10 — Deep Dive: "Guarantee message order and dedupe"</h3>
<ol>
  <li>Client assigns <code>clientId = uuid()</code> before send. Message is stored with <code>status: pending</code>.</li>
  <li>Send over WS or HTTP POST. Server returns <code>{id, serverTimestamp, sequence}</code>.</li>
  <li>On success, client replaces the pending entry; status becomes <code>sent</code>.</li>
  <li>If WS broadcasts the same message back (because client is also in the recipient list for group), the client looks up by <code>clientId</code> and dedupes.</li>
  <li>Ordering: messages sort by <code>(serverTimestamp, sequence)</code>. The sequence breaks ties for concurrent sends.</li>
  <li>Offline: clientId and optimistic message cached in IDB. On reconnect, replay in original order; server accepts idempotently (clientId as idempotency key).</li>
  <li>Missed messages after reconnect: client sends <code>GET /messages?since=lastSeenSeq</code>; merges into store.</li>
  <li>Failed send: after N retries, mark <code>status: failed</code>, show retry UI.</li>
</ol>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'case-3-docs', title: '📝 Case 3 — Collaborative Editor (Google Docs)', html: `
<h3>Step 1 — Clarify</h3>
<pre><code>FUNCTIONAL
- Rich-text editing (bold, italic, headings, lists, links)
- Real-time collaborative — multiple users editing, see each other's cursors
- Comments and suggestions
- Offline editing, resync on reconnect
- Version history (basic — restore to a previous version)

NON-FUNCTIONAL
- Keystroke latency perceived &lt; 50ms
- Convergence — all clients eventually see the same document
- Offline up to 24h, sync on return
- Works in the last 2 versions of Chrome/Safari/Firefox

OUT OF SCOPE
- Auth / sharing, permissions UI, mobile, drawing, charts, full Office compatibility</code></pre>

<h3>Step 2 — Scale</h3>
<pre><code>DAU:                 500M
Concurrent docs:     ~100M
Collaborators/doc:   typically 1-5, rarely &gt; 20
Edits/sec on hot doc: ~20
Doc size:            usually &lt; 1 MB text + formatting
Ops/sec globally:    ~1M</code></pre>

<h3>Step 3 — Architecture</h3>
<pre><code>Browser (CRDT replica Yjs) ─WS─► Collab Server (sync hub per doc) ─► Op log / Snapshot DB
     │ IndexedDB (local CRDT state, offline)
     └─HTTP─► API for doc metadata, version list, comments</code></pre>

<h3>Step 4 — Data Model</h3>
<pre><code>// CRDT (Yjs) handles content — opaque binary blob &amp; in-memory tree
doc:       YDoc        // the content — observable, mergeable
awareness: PresenceMap // ephemeral { userId: {cursor, selection, color} }

// Comments stored separately for queryability
commentsById: { [id]: { id, threadId, anchorCrdtId, authorId, text, resolved, createdAt } }
threadsById:  { [id]: { id, commentIds[], resolved } }</code></pre>

<h3>Step 5 — API</h3>
<pre><code>GET  /doc/:id            → { snapshot (CRDT state as binary), version, meta }
WS   /doc/:id/sync
  ← { type: 'update', op }          (ops from peers)
  ← { type: 'awareness', presence }
  → { type: 'update', op }          (local ops)
  → { type: 'awareness', presence }
POST /doc/:id/snapshot   (periodic server-side snapshotting)
GET  /doc/:id/versions   → list
POST /doc/:id/restore    → server applies restore
POST /doc/:id/comments   CRUD comments</code></pre>

<h3>Step 6 — Components</h3>
<pre><code>&lt;DocPage&gt;
  &lt;Toolbar /&gt;                  // bold / italic / heading / etc
  &lt;EditorSurface&gt;              // ProseMirror / TipTap / custom contentEditable
    &lt;CRDTBridge /&gt;             // sync Yjs ↔ editor state
    &lt;PresenceOverlay /&gt;        // remote cursors + selections
    &lt;CommentMarkers /&gt;         // inline comment highlights
  &lt;/EditorSurface&gt;
  &lt;CommentsSidebar /&gt;
  &lt;VersionHistoryPanel /&gt;      // lazy
&lt;/DocPage&gt;</code></pre>

<h3>Step 7 — State</h3>
<ul>
  <li><strong>Content</strong>: Yjs CRDT. Subscribed via observer for editor re-render.</li>
  <li><strong>UI</strong>: toolbar selection state, active formats — derived from editor cursor.</li>
  <li><strong>Presence</strong>: awareness protocol on same WS; peer cursors stored in ephemeral map keyed by userId.</li>
  <li><strong>Comments</strong>: React Query for CRUD; subscribe to doc updates for anchor resolution.</li>
  <li><strong>Offline</strong>: Yjs persists to IndexedDB. Ops generated while offline flush on reconnect.</li>
</ul>

<h3>Step 8 — Performance</h3>
<ul>
  <li>Editor virtualizes long docs — only visible pages rendered.</li>
  <li>Yjs merges offloaded to a Web Worker for large docs (server snapshot apply).</li>
  <li>Debounce awareness (cursor pos) updates to 10Hz.</li>
  <li>Batch editor DOM updates per animation frame.</li>
  <li>Persist CRDT state to IDB with debounce (e.g. 1s) to avoid hammering.</li>
</ul>

<h3>Step 9 — Edge Cases</h3>
<ul>
  <li><strong>Offline</strong>: Yjs records ops locally. On reconnect, sync protocol exchanges ops with server; CRDT guarantees convergence.</li>
  <li><strong>Concurrent edits</strong>: CRDT merge handles most. Moves of large blocks can feel "weird" under concurrent editing — UX hints: show the shift, don't auto-resolve silently.</li>
  <li><strong>Permission change mid-edit</strong>: server rejects new ops; client shows modal "You no longer have edit access"; revert local uncommitted state.</li>
  <li><strong>Server snapshot lag</strong>: snapshot async; op log is source of truth between snapshots.</li>
  <li><strong>A11y</strong>: announce presence changes via live region; keyboard shortcuts match Google Docs conventions; ensure screen reader can navigate comments.</li>
  <li><strong>Copy/paste</strong>: preserve formatting for intra-doc; sanitize HTML for cross-doc paste.</li>
  <li><strong>Undo</strong>: per-user local undo stack (only your own ops); NOT a global undo.</li>
  <li><strong>Version history</strong>: server stores periodic snapshots + op log between. Restore writes a new snapshot matching the old state.</li>
  <li><strong>Memory</strong>: very long docs need paging; keep only nearby pages in the editor.</li>
</ul>

<h3>Step 10 — Deep Dive: "Explain cursor presence"</h3>
<ol>
  <li>On selection change, client reads the current selection as a CRDT-stable anchor (<code>{headId, headOffset, anchorId, anchorOffset}</code>) — positions are ref-based so they track edits.</li>
  <li>Client throttles to 10Hz and sends <code>{type:'awareness', userId, cursor, color}</code> via WS.</li>
  <li>Server broadcasts to all other peers in the doc room.</li>
  <li>Each peer renders remote cursor as a colored caret with label. The cursor position re-computes on every local doc update (CRDT positions auto-update under insertions/deletions).</li>
  <li>Peer disconnect: after 3s without heartbeat, remove their cursor.</li>
  <li>Color: stable per peer for a session; chosen from a palette by userId hash.</li>
  <li>Reconnect: awareness re-published on reconnect.</li>
</ol>
<p>Alternatives:</p>
<ul>
  <li><strong>OT (Operational Transformation)</strong>: historical Google Docs approach. Tighter server control; harder offline story. CRDTs win for offline-first.</li>
  <li><strong>Polling-based awareness</strong>: unacceptable latency for cursor movement.</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'case-4-autocomplete', title: '🔎 Case 4 — Autocomplete / Typeahead', html: `
<h3>Step 1 — Clarify</h3>
<pre><code>FUNCTIONAL
- User types in search box
- Show up to 10 suggestions as they type
- Suggestions: past queries, popular queries, auto-complete, entity results
- Click a suggestion → submit as a search

NON-FUNCTIONAL
- Suggestion latency perceived &lt; 100ms
- Works on mobile with spotty network
- Accessible (ARIA combobox pattern)
- Handle 1000+ keystrokes/sec globally at scale

OUT OF SCOPE
- The actual search results page, spell correction deep model</code></pre>

<h3>Step 2 — Scale</h3>
<pre><code>DAU: 500M  |  Sessions with search: ~200M/day
Keystrokes per query: avg 5-10
Suggestion requests/sec: ~100K at peak (heavy debouncing helps)
Response size: ~1 KB (10 suggestions)
Cache hit rate target: &gt; 90%</code></pre>

<h3>Step 3 — Architecture</h3>
<pre><code>Browser ──HTTP──► Suggest API (CDN edge cached) ──► Ranking service
                                                    │
                                                    └─► Popular queries, user history, entity graph</code></pre>

<h3>Step 4 — Data Model</h3>
<pre><code>// Client cache
queryCache:     Map&lt;string, { suggestions: Suggestion[], timestamp }&gt;  // LRU, size 50
recentHistory:  Query[]                                             // stored locally</code></pre>

<h3>Step 5 — API</h3>
<pre><code>GET /suggest?q=&amp;locale=&amp;maxResults=10
 → { suggestions: [{ text, type, score, highlight, entityId? }] }</code></pre>
<p>Responses cached with appropriate <code>Cache-Control</code>; CDN served where possible.</p>

<h3>Step 6 — Components</h3>
<pre><code>&lt;SearchBox&gt;
  &lt;Input role="combobox" aria-autocomplete="list" /&gt;
  &lt;SuggestionList role="listbox"&gt;
    &lt;SuggestionItem role="option" /&gt;
  &lt;/SuggestionList&gt;
&lt;/SearchBox&gt;</code></pre>

<h3>Step 7 — State</h3>
<ul>
  <li><strong>Input value</strong>: controlled <code>useState</code>.</li>
  <li><strong>Suggestions</strong>: derived from React Query or custom hook.</li>
  <li><strong>Active suggestion</strong>: index for keyboard nav (<code>ArrowUp</code>/<code>Down</code>).</li>
  <li><strong>Cache</strong>: in-memory Map, LRU eviction, keyed by lowercased query.</li>
</ul>

<h3>Step 8 — Performance</h3>
<ul>
  <li><strong>Debounce</strong> 150ms between keystroke and request — avoids flooding API.</li>
  <li><strong>Cache</strong> recent queries; cache-first before network.</li>
  <li><strong>Request cancellation</strong>: abort in-flight requests when a new keystroke arrives (AbortController).</li>
  <li><strong>Stale-while-revalidate</strong>: show cached suggestions instantly, update when fresh data arrives.</li>
  <li><strong>Prefetch</strong>: on focus, fire an empty-query request for popular suggestions.</li>
  <li><strong>Keyboard-driven</strong> input stays responsive — small input state, memoized SuggestionItem.</li>
</ul>

<h3>Step 9 — Edge Cases</h3>
<ul>
  <li><strong>Out-of-order responses</strong>: user types "a" → "ab" → "abc". "a" response arriving after "abc" must be discarded. Track request sequence and drop stale.</li>
  <li><strong>Offline</strong>: fall back to local history only.</li>
  <li><strong>CJK / composition</strong>: while <code>compositionstart</code> → <code>compositionend</code> active, don't fire requests. Handle with <code>isComposing</code>.</li>
  <li><strong>Empty input</strong>: show recent history + popular (no query to server).</li>
  <li><strong>A11y</strong>: ARIA combobox pattern — <code>role="combobox"</code> on input, <code>aria-expanded</code>, <code>aria-controls</code> → listbox id, <code>aria-activedescendant</code> → currently highlighted option id. <code>Enter</code> selects; <code>Escape</code> closes. Announce suggestion count via live region.</li>
  <li><strong>Security</strong>: sanitize response text (highlighted spans specifically); never render arbitrary HTML.</li>
  <li><strong>Privacy</strong>: user can disable recent history; don't log queries.</li>
</ul>

<h3>Step 10 — Deep Dive: "How do you guarantee responsiveness?"</h3>
<ol>
  <li><strong>Debounce input</strong> by 150ms — first keystroke is immediate (if cache empty); subsequent only after typing pauses.</li>
  <li><strong>AbortController</strong> on every outgoing request. New input triggers <code>prevCtrl.abort()</code>.</li>
  <li><strong>Sequence guard</strong>: each request tagged with a <code>seq</code>. Dispatch a <code>seq</code> counter. Responses with <code>seq &lt; latestCompleted</code> are discarded even if they arrive.</li>
  <li><strong>Cache lookup FIRST</strong>: before issuing network request, check local LRU. Render instantly; network becomes revalidate.</li>
  <li><strong>Prefetch on focus</strong>: begin fetching popular/empty results before first keystroke.</li>
  <li><strong>Edge caching</strong>: cacheable responses get served by CDN POP closest to user — sub-50ms RTT.</li>
  <li><strong>Connection hint</strong>: on slow connection (<code>navigator.connection.effectiveType==='2g'</code>), increase debounce to 300ms and show cached suggestions longer.</li>
</ol>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'case-5-video', title: '📺 Case 5 — Video Streaming (YouTube / Netflix)', html: `
<h3>Step 1 — Clarify</h3>
<pre><code>FUNCTIONAL
- Play a video on a video page
- Adaptive quality — automatic and manual selection
- Pause / seek / speed / captions
- Resume playback where user left off
- Pre-roll ad (for YouTube) or skip intro button (Netflix)

NON-FUNCTIONAL
- Time-to-first-frame &lt; 1s
- Minimal rebuffering (&lt; 0.5% of playback time)
- Works on 4G, degrades gracefully to 3G
- Accessible player controls, captions
- Supports casting (Chromecast, AirPlay)

OUT OF SCOPE
- Recommendation algorithm, upload, DRM internals (assume widevine available)</code></pre>

<h3>Step 2 — Scale</h3>
<pre><code>DAU:   1B
Concurrent:  ~50M
Avg session length: ~20 min, 3-5 videos
Bitrate tiers: 240p, 480p, 720p, 1080p, 4K (100K-20Mbps)
Chunks: 2-10 seconds each</code></pre>

<h3>Step 3 — Architecture</h3>
<pre><code>Browser ──HTTP (HLS or DASH manifest) ──► CDN POP ──► Origin
       └─ Media segments ──►               CDN POP
       └─ API ──► Video metadata service</code></pre>
<p>Adaptive streaming: HLS (<code>.m3u8</code> + TS/fMP4 segments) or DASH (<code>.mpd</code> + fMP4 segments). Segments cached on CDN.</p>

<h3>Step 4 — Data Model</h3>
<pre><code>videoById: { id, title, duration, captions[], availableBitrates[], manifestUrl, posterUrl }
playbackState: { videoId, currentTime, selectedBitrate, bufferedRanges, quality:auto/manual }
resumePoints: { [videoId]: seconds }  // localStorage or server</code></pre>

<h3>Step 5 — API</h3>
<pre><code>GET /video/:id               → metadata, poster, manifest URL
GET /video/:id/heartbeat     ← client posts current position (analytics + resume)
POST /video/:id/watch-event  → {play, pause, seek, qualityChange}</code></pre>

<h3>Step 6 — Components</h3>
<pre><code>&lt;VideoPage&gt;
  &lt;Player&gt;                       // wraps MSE / hls.js / Shaka
    &lt;Video /&gt;                    // native &lt;video&gt; + MSE for adaptive
    &lt;Controls /&gt;                 // play, seek bar, volume, quality, captions
    &lt;CaptionLayer /&gt;             // SRT / WebVTT
    &lt;ProgressRing /&gt;             // initial buffering
    &lt;ErrorOverlay /&gt;             // network drop, DRM fail
  &lt;/Player&gt;
  &lt;MetadataPanel /&gt;
  &lt;RelatedVideos /&gt;              // lazy
&lt;/VideoPage&gt;</code></pre>

<h3>Step 7 — State</h3>
<ul>
  <li><strong>Playback state</strong>: synced with native <code>&lt;video&gt;</code> events (<code>timeupdate</code>, <code>play</code>, <code>pause</code>). Don't duplicate — subscribe.</li>
  <li><strong>Quality</strong>: ABR algorithm decides; user can override.</li>
  <li><strong>Resume</strong>: on mount, read from storage; set <code>video.currentTime</code>.</li>
  <li><strong>Heartbeat</strong>: POST current position every 10-30s while playing.</li>
</ul>

<h3>Step 8 — Performance</h3>
<ul>
  <li><strong>TTFF (time to first frame)</strong>: preload poster, prefetch manifest on video page mount. Start playback at lower bitrate, upgrade after buffer fills.</li>
  <li><strong>ABR (Adaptive Bitrate)</strong>: measure throughput + buffer; pick bitrate to fill buffer without underrun. Libraries: hls.js, Shaka Player, video.js.</li>
  <li><strong>CDN</strong>: manifest and segments served from nearest POP.</li>
  <li><strong>Prefetch next</strong>: hovering a thumbnail pre-fetches that video's manifest + first segment.</li>
  <li><strong>Chunk size</strong>: 2-6s sweet spot. Smaller = lower latency, higher overhead.</li>
  <li><strong>Service worker</strong>: can cache captions and poster for offline poster view.</li>
</ul>

<h3>Step 9 — Edge Cases</h3>
<ul>
  <li><strong>Network drop</strong>: player pauses, retries segment fetch with backoff; show "reconnecting" overlay.</li>
  <li><strong>Low bandwidth</strong>: ABR selects 240p; user can force higher but player warns.</li>
  <li><strong>DRM failure</strong>: user-friendly error with support link.</li>
  <li><strong>Autoplay policy</strong>: browsers block autoplay with sound; start muted OR require user gesture.</li>
  <li><strong>Background tab</strong>: pause playback if browser allows, reduce network.</li>
  <li><strong>Captions</strong>: native <code>&lt;track&gt;</code> or custom WebVTT renderer for styling. Toggle via controls.</li>
  <li><strong>A11y</strong>: full keyboard control (space=play, arrows=seek, M=mute), ARIA labels on buttons, captions default-on in silent auto-play.</li>
  <li><strong>Casting</strong>: Chrome cast + AirPlay APIs — player exposes "cast" button when available.</li>
  <li><strong>Picture-in-picture</strong>: native PiP API on supported browsers.</li>
  <li><strong>Seek past buffered</strong>: pause + load + resume.</li>
  <li><strong>Resume too stale</strong>: if resume point is at 95%+, restart from 0 (user probably re-watching).</li>
</ul>

<h3>Step 10 — Deep Dive: "How does ABR work?"</h3>
<ol>
  <li>Manifest lists available bitrates (e.g., 360p @ 800kbps, 480p @ 1.5Mbps, 720p @ 3Mbps, 1080p @ 5Mbps).</li>
  <li>Player measures downloaded segment size / time to compute <code>throughput</code> each segment.</li>
  <li>Player tracks <code>buffer</code> — how many seconds of video are ready ahead of currentTime.</li>
  <li>ABR decision each segment: if buffer is full (&gt; 20s) AND throughput &gt; targetBitrate × 1.5 → step up. If buffer is draining (&lt; 5s) → step down.</li>
  <li>Safety: never jump more than one tier per segment (avoid visible quality yo-yo).</li>
  <li>Startup: start at low bitrate for fast first frame, step up after buffer fills.</li>
  <li>User override: if user manually picks 1080p, ABR is disabled for this session.</li>
  <li>Client hints: read <code>navigator.connection</code> for initial bitrate seed on first load.</li>
</ol>
<p>Tradeoff: aggressive ABR reduces rebuffering but may show more quality changes; conservative ABR looks more stable but rebuffers more. Tune for p95 buffer underrun metric.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'case-6-upload', title: '📤 Case 6 — Photo/Video Upload (Instagram)', html: `
<h3>Step 1 — Clarify</h3>
<pre><code>FUNCTIONAL
- Select image or video from device
- Crop / filter / basic edit
- Upload with progress indicator
- Background upload (continues if user navigates away)
- Pause / resume / retry on failure

NON-FUNCTIONAL
- Handle files up to 4K video, 100 MB
- Resilient to network loss mid-upload
- Show real-time progress per file
- Accessible progress feedback

OUT OF SCOPE
- Video editing timeline, publishing workflow, feed rendering</code></pre>

<h3>Step 2 — Scale</h3>
<pre><code>Uploads/day:     500M
Concurrent uploads per peak minute: ~500K
Avg photo:       2 MB (JPEG from phone)
Avg short video: 30 MB (vertical 1080p, 15s)
Bandwidth/session: 20-100 MB</code></pre>

<h3>Step 3 — Architecture</h3>
<pre><code>Browser ─HTTP─► Upload Service (presigned URL) ─► Object Storage (S3)
       └─HTTP─► Metadata API (creates post, associates media)
       └─Worker─► Client-side compress + thumbnail
       └─IndexedDB─► Upload queue (persists across sessions)</code></pre>

<h3>Step 4 — Data Model</h3>
<pre><code>uploadTasks: {
  [taskId]: {
    id, file: File, type: 'image' | 'video',
    status: 'pending' | 'compressing' | 'uploading' | 'done' | 'failed',
    progress: 0-1,
    chunksDone: number,  // for resumable
    uploadUrl,
    mediaId?  // after server acknowledges
  }
}</code></pre>

<h3>Step 5 — API</h3>
<pre><code>POST /upload/initiate   → { uploadUrl, uploadId, chunkSize, expires }
PUT  [uploadUrl]        ← (presigned direct-to-S3 for single-part OR chunks)
POST /upload/complete   → { mediaId }
POST /post              → creates a post referencing mediaId</code></pre>

<h3>Step 6 — Components</h3>
<pre><code>&lt;Uploader&gt;
  &lt;FilePicker /&gt;
  &lt;CropEditor /&gt;           // uses canvas for crop/resize
  &lt;FilterPreview /&gt;        // CSS filter or WebGL
  &lt;UploadQueue&gt;
    &lt;UploadItem /&gt;         // per file with progress + actions
  &lt;/UploadQueue&gt;
&lt;/Uploader&gt;
&lt;BackgroundUploadIndicator /&gt; // persists at bottom of screen</code></pre>

<h3>Step 7 — State</h3>
<ul>
  <li><strong>Upload queue</strong>: Zustand store with persist middleware to IndexedDB (not localStorage — can't hold file handles cleanly).</li>
  <li><strong>Progress</strong>: derived from XHR / fetch stream events, throttled to 10Hz update.</li>
  <li><strong>Worker</strong>: compression and thumbnail generation off main thread (Canvas API in Worker via OffscreenCanvas).</li>
  <li><strong>Resume</strong>: on app restart, load queue, offer to resume pending tasks.</li>
</ul>

<h3>Step 8 — Performance</h3>
<ul>
  <li><strong>Client-side compression</strong>: target 1920px wide for photos, H.264 720p for videos. Reduces upload time 5-10×.</li>
  <li><strong>Chunked / resumable upload</strong>: for files &gt; 10 MB. Each chunk independently retryable. Uses S3 multipart or GCS resumable protocol.</li>
  <li><strong>Parallel chunks</strong>: 3-4 in parallel, not more (doesn't help beyond that and competes for bandwidth).</li>
  <li><strong>Progress UI</strong>: combined per-file progress (compress + upload weighted), not raw bytes.</li>
  <li><strong>Off-main-thread</strong>: compression / thumbnail in Web Worker.</li>
</ul>

<h3>Step 9 — Edge Cases</h3>
<ul>
  <li><strong>Network drop mid-chunk</strong>: chunk retries with backoff; multipart upload metadata survives (server tracks uploaded chunks).</li>
  <li><strong>Tab close mid-upload</strong>: IndexedDB preserves queue; on reopen, offer resume.</li>
  <li><strong>File &gt; server limit</strong>: client-side check before upload; show error early.</li>
  <li><strong>Disallowed format</strong>: HEIC on non-Safari — convert client-side or show error.</li>
  <li><strong>User navigates away</strong>: upload continues in background via service worker fetch; toast at bottom of app shows progress.</li>
  <li><strong>Disk full during temp write</strong>: surface as retriable.</li>
  <li><strong>A11y</strong>: progress bar with aria-valuenow; descriptive status text; screen reader announces completion.</li>
  <li><strong>Privacy</strong>: strip EXIF GPS metadata client-side before upload.</li>
  <li><strong>Bandwidth respect</strong>: if on cellular, ask user to confirm; auto-switch to wifi when available.</li>
  <li><strong>Giant video</strong>: warn and offer client-side trim.</li>
</ul>

<h3>Step 10 — Deep Dive: "How do you make uploads resumable?"</h3>
<ol>
  <li><strong>Initiate multipart</strong>: client calls <code>POST /upload/initiate</code> with file metadata. Server returns <code>uploadId</code>, <code>chunkSize</code> (e.g., 5 MB), and a signed URL per chunk (or a single resumable session URL for GCS).</li>
  <li><strong>Chunk the file</strong>: client reads file in <code>chunkSize</code> slices using <code>Blob.slice()</code>.</li>
  <li><strong>Upload each chunk</strong>: <code>PUT</code> with <code>Content-Range</code> or multipart chunk index. Track <code>chunksDone</code> in IDB after each success.</li>
  <li><strong>Parallelism</strong>: 3 chunks in flight at once; new chunk starts when one completes. Too many competes for bandwidth.</li>
  <li><strong>Retry on failure</strong>: per-chunk exponential backoff. Keep the chunk index in the task; re-read from File on retry (don't keep bytes in memory).</li>
  <li><strong>Resume after tab close</strong>: on app start, load pending tasks from IDB. For each, call <code>GET /upload/:id/status</code> to learn what server has. Resume from the next missing chunk.</li>
  <li><strong>Complete</strong>: POST <code>/upload/complete</code> with the part ETags (S3) or let GCS finalize. Server returns <code>mediaId</code>.</li>
  <li><strong>Abort</strong>: user-initiated abort triggers <code>DELETE /upload/:id</code> and IDB cleanup.</li>
  <li><strong>Service worker</strong>: intercept in a SW so upload survives page navigation; the SW keeps fetch alive and reports progress via <code>postMessage</code>.</li>
  <li><strong>Tradeoff</strong>: chunking adds overhead (server round-trips per chunk). For files under ~5 MB, single PUT is simpler. Tune threshold by measured success rate.</li>
</ol>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'patterns-summary', title: '🧩 Patterns Across Cases', html: `
<p>Across all six cases, the same patterns recur. Memorize these — they cover most interview prompts.</p>

<h3>Pattern: Normalized client cache</h3>
<p>Entities by id + views as id arrays. Updates touch one place; every view reads the latest. Used in Twitter, Chat, Autocomplete, video metadata.</p>

<h3>Pattern: Optimistic mutations with rollback</h3>
<p>Update UI immediately, remember previous state, submit to server, rollback on error. Used in likes, read receipts, any user action where latency would feel bad.</p>

<h3>Pattern: Real-time via WebSocket</h3>
<p>Single WS connection multiplexes messages, typing, presence, new entities. Fallback to polling if unsupported. Heartbeat + reconnect with exponential backoff + catch-up via "since" cursor.</p>

<h3>Pattern: Virtualized infinite list</h3>
<p>Cursor pagination + only-render-visible. Used in feed, chat messages, search results, any long list.</p>

<h3>Pattern: Offline-first with queue</h3>
<p>IndexedDB stores cached data + pending actions. Service worker serves cached. On reconnect, replay queue with idempotency keys.</p>

<h3>Pattern: Worker offload</h3>
<p>Compression, parsing, CRDT merges, heavy formatting — move off main thread. Keeps INP low.</p>

<h3>Pattern: Adaptive quality</h3>
<p>Bandwidth-aware rendering. Images (srcset, WebP/AVIF), video (ABR), update frequency (debounce based on <code>effectiveType</code>).</p>

<h3>Pattern: Cursor-based pagination</h3>
<p>Stable under inserts. Opaque cursor from server; client passes back. Used everywhere — feeds, chat history, search.</p>

<h3>Pattern: Presence / awareness protocol</h3>
<p>Ephemeral side-channel: cursor, typing, online status. Throttle (10Hz), don't persist.</p>

<h3>Pattern: Error hierarchy</h3>
<p>Error boundary per route → retry with backoff → offline fallback → toast for transient → modal for fatal.</p>

<h3>Pattern: Perf budget</h3>
<p>Explicit LCP/INP/CLS targets per page. Budget bundle size per route. CI enforces on PR.</p>

<h3>Pattern: Accessibility baseline</h3>
<p>Semantic HTML → ARIA where needed → keyboard nav → focus management → live regions for async updates → color + contrast.</p>

<h3>Pattern: i18n baseline</h3>
<p>Logical CSS (<code>margin-inline-start</code>), <code>dir="rtl"</code>, ICU message format, <code>Intl</code> for number/date/relative time, lazy locale bundles.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Meta-Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. Common prompts and their key deep-dive topics.</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Feed (Twitter / Facebook / Instagram)</strong>: live updates, virtualization, optimistic engagement, cursor pagination, offline, a11y for live regions.</li>
      <li><strong>Chat (WhatsApp / Slack / Discord)</strong>: message ordering with sequence tiebreaks, WebSocket reconnect+catch-up, offline queue with idempotency, typing indicator throttling.</li>
      <li><strong>Collaborative editor (Docs / Notion)</strong>: CRDT vs OT tradeoffs, presence protocol, offline sync, version history.</li>
      <li><strong>Autocomplete (Google / GitHub)</strong>: debouncing, AbortController for stale responses, LRU client cache, ARIA combobox, IME composition.</li>
      <li><strong>Video player (YouTube / Netflix)</strong>: adaptive bitrate algorithm, TTFF optimization, captions, autoplay policy, casting.</li>
      <li><strong>Upload (Instagram / Drive)</strong>: chunked + resumable, client compression, worker offload, service worker for background uploads.</li>
      <li><strong>Maps (Google Maps)</strong>: tile virtualization, Canvas/WebGL vs SVG, vector vs raster, zoom-dependent LOD.</li>
      <li><strong>E-commerce product page</strong>: SSR for SEO, ISR for freshness, image optimization, add-to-cart with optimistic UI.</li>
      <li><strong>Dashboard (analytics)</strong>: virtualized tables, chart performance, Web Worker for aggregations, export to CSV.</li>
      <li><strong>Email (Gmail)</strong>: threading, keyboard shortcuts, offline via service worker, virtualized inbox.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. How do you pick a pattern when you don't know the right answer?</div>
  <div class="qa-answer">
    <p>Lean on recurring patterns from the list above:</p>
    <ul>
      <li>Long list? Virtualize + cursor paginate.</li>
      <li>Real-time? WebSocket + reconnect + "since" cursor.</li>
      <li>User action feels slow? Optimistic + rollback.</li>
      <li>Collab editing? CRDT + presence + offline via IDB.</li>
      <li>Heavy work? Worker + debounce.</li>
      <li>SEO matters? SSR / SSG / ISR.</li>
      <li>Mobile users? Bundle small, network-adaptive.</li>
      <li>Access to devices without JS? Progressive enhancement.</li>
    </ul>
    <p>State the pattern by name, then justify for the specific prompt.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. What does a case study actually buy you in an interview?</div>
  <div class="qa-answer">
    <p>Vocabulary and sequencing. When you've walked through 5-10 case studies, you stop thinking "how do I even start?" and start thinking "this is basically the feed case — I know the components and tradeoffs." You recall the precise terms (cursor pagination, optimistic with rollback, presence throttling, adaptive bitrate) that make your answers sound senior. And you've already made the decisions once, so you can justify them quickly.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. What's the difference between senior and staff-level answers?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>Senior</strong>: clear framework, covers all 10 steps, names standard patterns, handles the deep dive with tradeoffs.</li>
      <li><strong>Staff</strong>: adds product thinking ("what if we prioritize low-data users?"), proposes tooling and measurement (budgets, SLOs, RUM), anticipates how the system evolves (migration paths, rollout), identifies org-scope concerns (bundle ownership, shared components, perf culture), and can downscope under pressure ("if we cut X we can ship in 2 weeks").</li>
      <li><strong>Both</strong>: confident communication, visibly collaborative, strong on tradeoffs.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Pick a case and do the 30-second elevator pitch.</div>
  <div class="qa-answer">
    <p>"For a Twitter-style feed: React + SSR for first 10 tweets so LCP is under 2.5s on mobile. Virtualized list for 500+ rows. React Query + normalized cache for tweets/users/media. WebSocket for new-tweet pushes; new arrivals buffer in a 'N new tweets' pill, merged into the list on user click or auto if at top. Optimistic likes with rollback. Offline via service worker caches last 100 tweets + IDB queue for likes. A11y: articles, aria-live for pill, keyboard j/k nav. Biggest open risk: scaling WebSocket to 10M concurrent — would want to deep-dive on connection infra."</p>
    <p>That's the shape. Practice doing this for each case in 30-60 seconds.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You have 3-5 case studies rehearsed end-to-end.</li>
    <li>You pattern-match new prompts to known cases ("this is basically a chat with...").</li>
    <li>You use precise vocabulary: cursor pagination, optimistic with rollback, presence protocol, ABR, CRDT.</li>
    <li>You cite specific libraries (React Query, Yjs, hls.js, Zustand) to ground choices.</li>
    <li>You identify the 1-2 deepest risks ("I'd want to prototype the WS at scale").</li>
    <li>You downscope explicitly when time pressure appears.</li>
  </ul>
</div>
`}

]
});
