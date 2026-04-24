window.PREP_SITE.registerTopic({
  id: 'sd-framework',
  module: 'Frontend System Design',
  title: '10-Step Framework',
  estimatedReadTime: '35 min',
  tags: ['system-design', 'framework', 'interview', 'architecture', 'requirements', 'tradeoffs', 'rubric'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<p>A frontend system-design interview asks you to design a non-trivial UI product end-to-end in 45-60 minutes — YouTube, Facebook News Feed, Google Docs, a real-time chat, Gmail. The interviewer grades not the "right answer" (there isn't one) but your <strong>process</strong>: how you clarify, decompose, make tradeoffs, and reason about scale, UX, and constraints.</p>

<p>The <strong>10-Step Framework</strong> gives you a deterministic structure to cover everything interviewers look for without panicking:</p>
<ol>
  <li><strong>Clarify requirements</strong> — functional, non-functional, out-of-scope.</li>
  <li><strong>Estimate scale</strong> — users, data, events, bandwidth.</li>
  <li><strong>High-level architecture</strong> — boxes and arrows sketch.</li>
  <li><strong>Data model</strong> — entities, relationships, client-side shape.</li>
  <li><strong>API design</strong> — REST / GraphQL / WebSocket contracts.</li>
  <li><strong>Component design</strong> — break the UI into components, data flow.</li>
  <li><strong>State management</strong> — local, server, cache, URL.</li>
  <li><strong>Performance</strong> — rendering, networking, bundle, CWV.</li>
  <li><strong>Scalability & edge cases</strong> — offline, a11y, i18n, error handling, real-time.</li>
  <li><strong>Tradeoffs & deep dive</strong> — the interviewer picks a sub-system; you justify choices.</li>
</ol>

<div class="callout insight">
  <div class="callout-title">🧠 The one-liner to remember</div>
  <p>Ten steps in ~45 minutes = ~4 minutes per step on average, but biased toward 1-2 (clarify + estimate) and 10 (deep dive) since those are where scores are made. Go broad-then-deep: get a complete sketch by minute 25, then let the interviewer's follow-ups drive the detail.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What the interview is really testing</h3>
<p>Frontend system design is not "name some libraries." Interviewers want to see:</p>
<ol>
  <li><strong>Clarifying rigor.</strong> Can you shape an ambiguous "design YouTube" into a concrete, bounded problem?</li>
  <li><strong>Prioritization.</strong> With a 45-minute budget, which features and concerns do you focus on first?</li>
  <li><strong>Decomposition.</strong> Can you break a product into components, APIs, and data models that actually compose?</li>
  <li><strong>Tradeoff reasoning.</strong> Every decision has pros and cons; can you articulate them and pick one with justification?</li>
  <li><strong>Depth on demand.</strong> When asked to zoom into a specific piece (caching, real-time, accessibility), can you go 3-4 layers deep?</li>
  <li><strong>Communication.</strong> Are you visible (thinking aloud, diagramming), collaborative (asking, confirming), and time-aware?</li>
</ol>

<h3>Why a framework at all?</h3>
<p>Under interview stress, people forget structure. They either jump into implementation details for the first thing that came to mind (ignoring the whole system), or spend 20 minutes on requirements without ever producing a design. A framework gives you a checklist that guarantees:</p>
<ul>
  <li>You cover the product, not just one layer.</li>
  <li>You budget time across sections.</li>
  <li>You surface places the interviewer might want to dive into.</li>
</ul>

<h3>How frontend system design differs from backend</h3>
<table>
  <thead><tr><th></th><th>Backend SD</th><th>Frontend SD</th></tr></thead>
  <tbody>
    <tr><td>Scale dimensions</td><td>QPS, storage, throughput</td><td>DAU, peak concurrent users, data volume to render, client capabilities</td></tr>
    <tr><td>Bottlenecks</td><td>DB, network, compute</td><td>Main thread, DOM size, bundle, network (especially mobile)</td></tr>
    <tr><td>Data model</td><td>Normalized schemas, indexes</td><td>Normalized client cache, pagination shape</td></tr>
    <tr><td>Failure modes</td><td>Node down, replication lag</td><td>Bad network, offline, tab backgrounded, device low-memory</td></tr>
    <tr><td>Performance</td><td>Latency, throughput</td><td>LCP, INP, CLS, bundle size, time to interactive</td></tr>
    <tr><td>Concerns unique to FE</td><td>—</td><td>Accessibility, i18n/RTL, responsive/mobile, rendering strategy (CSR/SSR/SSG), hydration</td></tr>
  </tbody>
</table>
<p>A strong candidate spends most time on what's uniquely frontend (component architecture, client data layer, rendering, performance), not on backend concerns.</p>

<h3>Why clarifying requirements takes 5 minutes, not 30 seconds</h3>
<p>"Design YouTube" has a thousand interpretations. Is it the viewing page or the upload flow? Logged-in or anonymous? Mobile or desktop or both? Live streaming or VOD only? Comments? Recommendations? Without clarifying, you're designing something the interviewer didn't ask about. Spending 5 minutes upfront is cheap insurance.</p>

<h3>Why estimates matter even though numbers aren't asked</h3>
<p>"1 billion users" and "10 thousand users" design to very different architectures. Writing down quick numbers — DAU, concurrent users, messages per second, avg object size, bandwidth per session — guides downstream decisions: do we need virtualization? pagination? SSR for crawlers? Edge caching? The numbers don't have to be accurate; they have to be plausible and drive decisions.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The "broad then deep" timeline</h3>
<div class="diagram">
<pre>
 0 ────────── 5 ──── 10 ──── 15 ──── 20 ──── 25 ──── 35 ──── 45
 │ Clarify │ Est │ Arch │ Data │ API │ Components │  Deep dive   │
 │         │     │      │      │     │ +State     │  (driven by  │
 │                                        +Perf    │  interviewer)│
 │                                        +Edges   │              │
 │
 └── Wrap-up: 5 minutes leftover for "what would you improve next"
</pre>
</div>
<p>The first 25 minutes produces a complete skeleton — every layer touched at least briefly. Then you spend 15-20 minutes going deep wherever the interviewer steers, and close with 2-3 minutes of reflections ("given more time I'd explore X").</p>

<h3>The "diagram as shared artifact" picture</h3>
<p>Draw, don't just talk. Boxes for components, arrows for data flow, labels on the arrows. A simple 5-box diagram is far more communicative than 10 minutes of monologue. Update the diagram as decisions are made. In a remote interview, use Excalidraw, tldraw, or the interviewer's provided whiteboard.</p>

<h3>The "speak like an engineer" language</h3>
<p>Use the vocabulary the interviewer uses — it signals seniority. Replace:</p>
<ul>
  <li>"a bunch of data" → "a normalized cache keyed by entity id"</li>
  <li>"make it fast" → "we'd want to keep LCP under 2.5s, so the hero image needs priority-fetched"</li>
  <li>"load more" → "cursor-based pagination with prefetch on near-end-of-list"</li>
  <li>"handle errors" → "exponential backoff with jitter, global error boundary, optimistic rollback"</li>
</ul>

<h3>The "tradeoff ledger"</h3>
<p>Every design choice is a tradeoff. When you make one, name both sides:</p>
<blockquote>
  "I'd go with client-side pagination for the feed over infinite scroll because it makes CLS and keyboard nav simpler, at the cost of worse immersion for casual scrollers. Given this is a news reader, I think the tradeoff favors pagination."
</blockquote>
<p>Naming alternatives shows you considered them. Picking one shows conviction.</p>

<h3>The "interview-driven deep dive"</h3>
<p>Step 10 is not an open essay on your favorite topic. It's answering the interviewer's specific follow-up. Common probes:</p>
<ul>
  <li>"Walk me through how a message sends in real-time."</li>
  <li>"How does the feed stay up-to-date without full refresh?"</li>
  <li>"What happens when the user goes offline mid-edit?"</li>
  <li>"How do you scale the search autocomplete?"</li>
</ul>
<p>The deep dive rewards: structured thinking ("three options: polling, SSE, WebSocket"), concrete numbers, and tradeoffs.</p>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"I need to know the one right architecture for YouTube." There is no one right answer. The interviewer is grading your process, not your memorized design. A junior who recites "the YouTube architecture" without reasoning fares worse than a senior who confidently wrong-guesses a detail but shows clean decomposition and tradeoffs.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Mechanics', html: `
<h3>Step 1 — Clarify Requirements (~5 min)</h3>
<p>Split clarifying into three buckets:</p>
<ul>
  <li><strong>Functional requirements</strong> — what the user can do. "List the primary user actions."</li>
  <li><strong>Non-functional requirements</strong> — performance, scale, reliability, accessibility, security, offline support. "Any hard constraints?"</li>
  <li><strong>Out of scope</strong> — things you explicitly won't cover. "I'll skip authentication, admin tools, and mobile-specific behaviors unless asked."</li>
</ul>

<p>Example clarifying script for "Design Twitter feed":</p>
<pre><code>FUNCTIONAL
- View a timeline of tweets from followed accounts
- Like / retweet / reply
- Infinite scroll with new tweets arriving live
- Media (images, short video)

NON-FUNCTIONAL
- Load first paint &lt; 2s on 4G mobile
- Support 10K tweets over a session without perf degradation
- Accessible (screen reader, keyboard nav)
- Works offline for cached tweets
- English + 1-2 RTL languages (Arabic, Hebrew)

OUT OF SCOPE
- Compose / posting flow
- Authentication
- Search, hashtags, DMs
- Desktop-only features</code></pre>

<p>Confirm with the interviewer: "Does this scope match what you had in mind? Anything you want me to add or drop?"</p>

<h3>Step 2 — Estimate Scale (~2-3 min)</h3>
<p>Write a back-of-envelope table. These don't need to be exact; they need to drive design.</p>
<pre><code>Users:               100M DAU
Concurrent on web:   ~5M at peak
Tweets per session:  ~500 scrolled
Tweet size (avg):    1 KB text + 200 KB media reference
Images per screen:   ~3-5
Requests per load:   ~1 HTML, ~3 JS/CSS, ~20 images, ~5 API
Data per session:    ~10-20 MB (most in images/video)
Concurrent WebSocket connections: ~5M peak</code></pre>
<p>From these: we need virtualized lists (500 rows), aggressive image compression, CDN for all media, a realtime channel for new tweets.</p>

<h3>Step 3 — High-Level Architecture (~5 min)</h3>
<p>Draw 5-8 boxes: browser / server / CDN / API / data stores / realtime. Label arrows. Don't get lost in backend detail — one or two sentences on "the backend provides these APIs and WebSocket" is enough.</p>

<pre><code>┌──────────────┐   HTML/JS/CSS    ┌──────────────┐
│    Browser   │ ◄─────────────── │  Edge CDN    │
│  (React SPA) │                   └──────┬───────┘
│              │                          │
│              │──────── GET /feed ──────►│
│              │                          ▼
│              │                  ┌──────────────┐
│              │                  │  Origin +    │
│              │                  │  API gateway │
│              │                  └──────┬───────┘
│              │                          │
│              │   WebSocket (tweets) ◄───┤
│              │                          │
│              │───────────────────►      ▼
│              │                  ┌──────────────┐
│              │                  │  Tweet DB    │
│              │                  │  Media CDN   │
└──────────────┘                  └──────────────┘</code></pre>

<h3>Step 4 — Data Model (~3 min)</h3>
<p>Show client-side shape. Normalize.</p>
<pre><code>normalized cache:
tweetsById:   Record&lt;id, { id, authorId, text, mediaIds[], createdAt, likes, replies, retweets }&gt;
usersById:    Record&lt;id, { id, handle, name, avatar, verified }&gt;
mediaById:    Record&lt;id, { id, type, url, width, height, thumbUrl }&gt;

views (derived):
feed.tweetIds: string[]          // ordered by recency
feed.hasMore:  boolean
feed.cursor:   string            // opaque cursor for next page</code></pre>

<h3>Step 5 — API Design (~3-5 min)</h3>
<pre><code>GET  /api/feed?cursor=&amp;limit=20 → { tweets: Tweet[], users: User[], media: Media[], nextCursor: string }
POST /api/tweet/{id}/like
POST /api/tweet/{id}/retweet
WS   /feed/subscribe             → emits { type: 'new_tweet', tweet, author }</code></pre>
<p>Prefer cursor pagination (stable under inserts) over offset. Return entities denormalized in responses but normalize client-side. Include <code>nextCursor</code> rather than "page 2" — more resilient to live inserts.</p>

<h3>Step 6 — Component Design (~5 min)</h3>
<p>Sketch the component tree with 1-2 key props each.</p>
<pre><code>&lt;App&gt;
  &lt;NavBar/&gt;
  &lt;FeedPage&gt;
    &lt;FeedProvider&gt;          // sets up React Query + WS subscription
      &lt;TopBar/&gt;
      &lt;VirtualizedFeed&gt;     // renders visible slice only
        &lt;TweetCard key tweet/&gt;
      &lt;/VirtualizedFeed&gt;
      &lt;NewTweetsIndicator/&gt; // "5 new tweets" pill
    &lt;/FeedProvider&gt;
  &lt;/FeedPage&gt;
  &lt;MediaViewer/&gt;            // portal for expanded images/video
  &lt;Toaster/&gt;                // notifications
&lt;/App&gt;</code></pre>

<h3>Step 7 — State Management (~3 min)</h3>
<ul>
  <li><strong>Server state</strong>: React Query / SWR. Query key <code>['feed', cursor]</code>. Infinite query. Cache normalized via <code>setQueryData</code> helpers.</li>
  <li><strong>URL state</strong>: current viewed tweet id for /tweet/:id deep links.</li>
  <li><strong>UI state</strong>: "new tweets available" count, viewer open/close — local useState.</li>
  <li><strong>Global state</strong>: theme, auth user — Context or Zustand.</li>
  <li><strong>Real-time deltas</strong>: WS handler calls <code>queryClient.setQueryData(['feed'], merge(old, newTweet))</code> to prepend in the cache.</li>
</ul>

<h3>Step 8 — Performance (~3-5 min)</h3>
<p>Map the three Web Vitals to concrete choices:</p>
<ul>
  <li><strong>LCP</strong>: SSR the first ~10 tweets; stream the rest with Suspense. Hero avatar + first image preloaded. CDN for images.</li>
  <li><strong>INP</strong>: virtualized list, memoized TweetCard, <code>startTransition</code> around filter/sort updates.</li>
  <li><strong>CLS</strong>: fixed-height cards or <code>aspect-ratio</code> on media; stable avatar size; reserve skeleton space.</li>
  <li><strong>Bundle</strong>: lazy-load media viewer, compose dialog (the minority paths); split per route.</li>
  <li><strong>Perceived perf</strong>: optimistic likes/retweets, skeleton screens, scroll restoration on back-nav.</li>
</ul>

<h3>Step 9 — Scalability & Edge Cases (~3 min)</h3>
<p>Hit the standard list:</p>
<ul>
  <li><strong>Offline</strong>: service worker caches last N tweets; show "offline" banner; optimistic mutations queued for replay.</li>
  <li><strong>Accessibility</strong>: ARIA live region for "new tweets," keyboard-navigable feed (j/k), semantic <code>article</code> per card, focus restoration.</li>
  <li><strong>i18n</strong>: RTL via <code>dir="rtl"</code>, logical CSS properties, locale-aware timestamps.</li>
  <li><strong>Error handling</strong>: error boundary per route; retry with exponential backoff; 429 rate-limit UI; offline fallback.</li>
  <li><strong>Slow network</strong>: respect <code>navigator.connection.effectiveType</code> — defer media on 2G.</li>
  <li><strong>Tab backgrounded</strong>: pause polling, reduce WS heartbeat frequency; resume on visibility.</li>
  <li><strong>Memory</strong>: evict tweets out of the virtualized window; cap cache size.</li>
  <li><strong>Security</strong>: CSP, escape user-generated content, sanitize links, rate-limit optimistic actions client-side too.</li>
</ul>

<h3>Step 10 — Tradeoffs & Deep Dive (~10-15 min)</h3>
<p>The interviewer now picks a corner and asks you to go deeper. Common probes for a feed:</p>
<ul>
  <li>"Walk me through how a new tweet appears live."</li>
  <li>"What happens when the user is on the feed for an hour?"</li>
  <li>"Design the optimistic like flow with rollback."</li>
  <li>"How would you paginate so it feels instant?"</li>
</ul>
<p>Respond with: three options, tradeoffs, your pick with reasoning, and explicit follow-up risks. Draw diagrams where possible.</p>

<h3>Common anti-patterns to avoid</h3>
<ul>
  <li><strong>Starting with code.</strong> Code is the last thing. Architecture first.</li>
  <li><strong>Ignoring the interviewer's pushback.</strong> If they probe a choice, it usually means either you're wrong or they want tradeoffs spelled out.</li>
  <li><strong>Speaking in vague generalities.</strong> "We'd cache it" — where? For how long? Invalidated by what?</li>
  <li><strong>Running out of time on early steps.</strong> Don't spend 20 minutes on requirements. Budget.</li>
  <li><strong>Not covering non-functional</strong> (a11y, offline, error handling). These score points and most candidates forget.</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Examples', html: `
<h3>Example 1 — full framework applied to "Design Google Docs"</h3>
<p>Compact walkthrough; real interview expands each section.</p>

<h4>Step 1 — Clarify</h4>
<pre><code>FUNCTIONAL
- One user editing a doc (single-doc)
- Multiple users editing in real-time (collaborative)
- Text formatting: bold/italic/headings/lists
- Comments and suggestions
- Offline editing with sync

NON-FUNCTIONAL
- Low latency for keystrokes (&lt; 50ms perceived)
- Convergence guarantee (all users see the same doc eventually)
- Offline for 24h, then sync
- Accessibility — full keyboard / screen reader

OUT OF SCOPE
- Auth / sharing permissions
- Mobile (web-only)
- Drawing / charts / embed</code></pre>

<h4>Step 2 — Scale</h4>
<pre><code>DAU:         500M
Concurrent:  ~50M
Docs/user:   tens to hundreds
Doc size:    usually &lt; 1 MB text, up to 50 MB rich
Typing rate: ~5 chars/sec per user
Collaborators per doc: typically 1-5, rarely &gt; 20
Edits/sec per doc (hot): ~25 at peak</code></pre>

<h4>Step 3 — Architecture</h4>
<pre><code>Browser (Editor + CRDT replica) ─WS─► Collaboration server (OT/CRDT hub)
       │                              │
       │ HTTP load doc                │
       └──► API ─► Doc DB, Comment DB
       Document is snapshotted + event log (ops) appended</code></pre>

<h4>Step 4 — Data model (client)</h4>
<pre><code>doc: { id, version, crdt: YDoc, comments: CommentMap }
presence: { userId, cursorPos, selection } // per peer</code></pre>

<h4>Step 5 — API</h4>
<pre><code>GET /doc/{id}                → { snapshot, version }
WS  /doc/{id}/subscribe      → receives: { ops, presence } ; sends local ops
POST /doc/{id}/snapshot      (periodic rollup of ops)</code></pre>

<h4>Step 6 — Components</h4>
<pre><code>&lt;DocEditor&gt;
  &lt;Toolbar/&gt;
  &lt;EditorSurface&gt;           // contentEditable + CRDT bridge
    &lt;PresenceLayer/&gt;        // other users' cursors
    &lt;CommentsSidebar/&gt;
  &lt;/EditorSurface&gt;
&lt;/DocEditor&gt;</code></pre>

<h4>Step 7 — State</h4>
<ul>
  <li>CRDT (Yjs) as source of truth for content — handles offline + concurrent edits natively.</li>
  <li>Local React state for UI (selected toolbar, open menus).</li>
  <li>Presence via ephemeral channel over the same WS.</li>
</ul>

<h4>Step 8 — Performance</h4>
<ul>
  <li>Editor uses windowed rendering — only render visible lines of long docs.</li>
  <li>CRDT ops batched per animation frame; debounce keystrokes.</li>
  <li>Large docs: page-break virtualization, lazy-load unrendered pages.</li>
  <li>Long tasks offloaded to Worker (CRDT merges).</li>
</ul>

<h4>Step 9 — Edge cases</h4>
<ul>
  <li>Offline: local CRDT keeps edits; queue ops; replay on reconnect via IndexedDB.</li>
  <li>Conflict: CRDT guarantees convergence without explicit merge UI.</li>
  <li>Server reject (permissions changed): rollback local ops, show modal.</li>
  <li>A11y: live region announcing presence changes; reliable keyboard nav.</li>
  <li>Undo: per-user undo stack (local ops only) not global.</li>
</ul>

<h4>Step 10 — Deep dive (interviewer: "explain cursor presence")</h4>
<p>Send <code>{pos, sel}</code> over WS on every selection change, throttled to 10Hz. Server broadcasts to other peers in the doc room. Remote cursor rendered as a colored line at the peer's reported position (transformed through CRDT op log for local consistency). On peer disconnect, cursor removed after 3s grace. Perf: throttle, not debounce (don't lag visibly). Privacy: presence disabled in anonymous mode.</p>

<h3>Example 2 — 10-minute "mini" version for a warm-up question</h3>
<p>If the interviewer says "design a simple X in 15 min," collapse:</p>
<ol>
  <li>Clarify (2 min) — 3 bullets functional, 2 non-functional.</li>
  <li>Architecture (3 min) — 4 boxes.</li>
  <li>Components + state (5 min).</li>
  <li>One tradeoff + deep dive (5 min).</li>
</ol>

<h3>Example 3 — opening script you can memorize</h3>
<blockquote>
"Before I dive into the design, let me clarify a few things so we're aligned. Functionally, I'm assuming the user can X, Y, and Z — is that right? For non-functional, I'll target LCP under 2.5s on mobile, accessibility to WCAG AA, and graceful offline. I'll skip auth and admin tools. Does this scope match what you had in mind?"
</blockquote>

<h3>Example 4 — tradeoff phrasing template</h3>
<blockquote>
"For [X], the main options are A (pro: …, con: …), B (pro: …, con: …), and C (pro: …, con: …). Given our constraint of [Y], I'd go with B. The main risk is [Z], which I'd mitigate by [mitigation]. Happy to revisit if you want a different angle."
</blockquote>

<h3>Example 5 — diagram shorthand (text)</h3>
<pre><code>[Browser]─HTTP─►[CDN]─▲
     │                 │
     └─WS────►[Realtime server]─►[Kafka]─►[DB]
     │
     └─HTTP──►[API gateway]─►[Services]─►[DB]</code></pre>
<p>Memorize this shape — with small label tweaks it covers 80% of FE system design prompts.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '🕳️ Edge Cases', html: `
<h3>1. "Design X" where X is enormous</h3>
<p>"Design Facebook." Scope it yourself in clarify: "I'll focus on the News Feed viewing experience; other surfaces out of scope." An interviewer who wanted more will push back — that's fine. Don't try to design all of Facebook.</p>

<h3>2. Interviewer's follow-up contradicts your design</h3>
<p>If they say "but what if there are 10M concurrent users?" and your design doesn't handle it, acknowledge and redesign. "That's a good point — my earlier assumption was 100K. Let me rework the realtime channel for 10M." Don't defend bad decisions.</p>

<h3>3. Running long on clarifying</h3>
<p>After 5 minutes, stop and move on even if some things feel unresolved. You can revisit. "I have a few more I'd like to clarify but let me move to architecture and fold them in as we go."</p>

<h3>4. You don't know a term the interviewer uses</h3>
<p>Ask. "By 'optimistic concurrency,' do you mean the pattern where we update UI immediately and rollback on error?" Signals intellectual honesty, not weakness.</p>

<h3>5. The interviewer is silent</h3>
<p>Keep narrating. Silence doesn't mean "you're doing fine"; sometimes they're just waiting. Explicitly check: "I'm about to go into data model — does this pace work?"</p>

<h3>6. Your architecture doesn't fit the prompt</h3>
<p>If after 15 minutes you realize you've designed for the wrong scale or the wrong feature set, pivot explicitly: "I realize my assumption about scale was off — let me sketch a different architecture."</p>

<h3>7. Collaborative editing CRDTs vs OT</h3>
<p>If asked to pick for realtime collab, have a one-line answer: "I'd choose CRDT (Yjs/Automerge) for offline-first properties and simpler server design; OT (Google Docs historical) gives tighter cursor handling but requires a central OT server." Pick based on the prompt's offline requirement.</p>

<h3>8. Infinite scroll vs pagination — not a universal answer</h3>
<p>"Infinite is better for casual browsing; pagination is better for finding specific items and for a11y. Twitter / IG use infinite; JIRA / admin dashboards use pagination. For the prompt's feed, infinite makes sense; for search results, pagination does."</p>

<h3>9. CSR vs SSR vs RSC — when asked</h3>
<p>Map to the product:</p>
<ul>
  <li>Marketing / blog / doc pages → SSG or ISR.</li>
  <li>Per-user feed → SSR (first page) + client for subsequent.</li>
  <li>Dashboard behind auth → CSR is fine (SEO doesn't matter).</li>
  <li>Anything where initial content matters for LCP → SSR or RSC + streaming.</li>
</ul>

<h3>10. The "out of scope" defense</h3>
<p>If you've declared something out of scope and the interviewer asks about it, give a brief answer AND remind them of the scoping: "Out of scope originally, but briefly: I'd ... Happy to dive deeper if you want to replace another topic."</p>

<h3>11. Real-time: polling vs SSE vs WebSocket</h3>
<p>Memorize the selection rubric:</p>
<ul>
  <li><strong>Polling</strong>: low QPS, server-push not needed, simplest to implement / cache.</li>
  <li><strong>Long polling</strong>: near-real-time without WS complexity, still HTTP-friendly.</li>
  <li><strong>SSE</strong>: server→client only (notifications, feeds), HTTP2, simpler than WS, autoreconnect built in.</li>
  <li><strong>WebSocket</strong>: bidirectional, low latency, stateful — chat, collab editing, multiplayer games.</li>
</ul>

<h3>12. Accessibility as a bolt-on</h3>
<p>Treating a11y as a final-minute afterthought signals weakness. Weave it in: "I'd use <code>aria-live</code> for the new-tweets pill, focus management on route change, semantic article for tweets." Ideally during component design, not only at the end.</p>

<h3>13. i18n mentioned only as "oh and translations"</h3>
<p>Go deeper: "We'd use ICU message format, lazy-load locale bundles, handle RTL via logical CSS properties and <code>dir</code>, and ensure number/date formatting via Intl."</p>

<h3>14. Performance claims without numbers</h3>
<p>Don't say "we'll make it fast." Say: "Target LCP under 2.5s on 4G; bundle under 200KB gzipped for the critical path; INP under 200ms at p75."</p>

<h3>15. Ignoring the backend entirely</h3>
<p>FE system design doesn't demand deep backend design, but you should know the rough shape. "The backend would expose REST for CRUD, gRPC for realtime, and an object storage for media." Avoid "that's a backend concern, not my problem."</p>

<h3>16. Over-engineering for a warm-up problem</h3>
<p>"Design a TODO list" gets CRDT + multi-region active-active. The interviewer sees this as lacking judgment. Match complexity to prompt.</p>

<h3>17. Picking "the trendy" tech for no reason</h3>
<p>"We'd use Remix because it's cool." Tie choices to requirements: "We'd use Next.js for ISR which gives us near-static perf with a periodic refresh — matches our content freshness of &lt;60s."</p>

<h3>18. Claiming to solve things you can't</h3>
<p>"Offline-first with perfect sync" is hard. Be honest about limits: "CRDT handles most concurrent editing but conflict-prone operations like 'move entire paragraph' still need UX hints."</p>

<h3>19. Not budgeting time</h3>
<p>If 20 minutes in you're still on data model, it's time to fast-forward. Even cursory coverage of components, state, perf, and edges is better than a perfect data model and nothing else.</p>

<h3>20. Missing the "what would you improve next"</h3>
<p>Wrap up in the last 2 minutes: "If I had another 30 minutes, I'd deepen the offline sync, do a proper security review, and sketch a CI perf budget. My biggest open question is whether the realtime channel scales past 10M concurrent — that's where I'd focus next." Shows awareness of what's incomplete.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'bugs-antipatterns', title: '🐛 Bugs & Anti-Patterns', html: `
<h3>Anti-pattern 1 — jumping straight into React components</h3>
<p>"Well I'd use a FeedCard component with props for..." Stop. You haven't defined the feed yet. Clarify → estimate → architecture → then components.</p>

<h3>Anti-pattern 2 — reciting memorized answers</h3>
<p>If you've seen "Design YouTube" before, you might be tempted to recite. Interviewers notice — it comes across as inflexible when they probe. Use your framework; let the details emerge.</p>

<h3>Anti-pattern 3 — ignoring non-functional requirements</h3>
<p>A design without a11y, i18n, offline, error handling is incomplete. Even one sentence each scores points.</p>

<h3>Anti-pattern 4 — vague "we'd use Redux"</h3>
<p>Name what you're storing, which slices, why Redux and not Zustand or React Query. Every "we'd use X" needs a "because Y."</p>

<h3>Anti-pattern 5 — ignoring the interviewer</h3>
<p>They steer intentionally. If they say "tell me more about how pagination works," they want cursor vs offset with tradeoffs, not a one-liner.</p>

<h3>Anti-pattern 6 — overspecifying UI details</h3>
<p>Spending 5 minutes on button placement. They don't care. Component architecture, state, data flow — not pixel layouts.</p>

<h3>Anti-pattern 7 — underestimating scale</h3>
<p>"A few thousand users" when the prompt is YouTube. The design you pick for 5K doesn't work for 1B. Ground estimates in reality.</p>

<h3>Anti-pattern 8 — overestimating scale</h3>
<p>Inverse: treating an internal admin tool like Twitter. Over-engineering signals bad judgment.</p>

<h3>Anti-pattern 9 — talking only, no diagram</h3>
<p>A 20-minute monologue without any boxes or arrows. Interviewers process diagrams faster than words. Draw.</p>

<h3>Anti-pattern 10 — not asking clarifying questions</h3>
<p>Starting design without "is it mobile or desktop?" signals the candidate is guessing. Clarify the top 5 ambiguities.</p>

<h3>Anti-pattern 11 — presenting tech before purpose</h3>
<p>"We'll use GraphQL" — before saying why. Put constraints first, then tech.</p>

<h3>Anti-pattern 12 — ignoring costs</h3>
<p>Running a WS server for 50M concurrent is expensive. Name the cost of your choices: "This is expensive on infra; for an MVP I'd do polling instead."</p>

<h3>Anti-pattern 13 — losing time on one rabbit hole</h3>
<p>Spending 10 minutes on how the routing works. Time-box; move on when the topic doesn't serve the bigger picture.</p>

<h3>Anti-pattern 14 — no wrap-up</h3>
<p>Running out of time at the end without summary. Always save 1-2 minutes for "to recap the big decisions and what I'd do next."</p>

<h3>Anti-pattern 15 — defensive posture on pushback</h3>
<p>Interviewer pushes a decision; candidate doubles down without reconsidering. Listen, acknowledge, adjust. Flexibility is a strong signal.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
  <div class="qa-question">Q1. How do you approach a frontend system design question?</div>
  <div class="qa-answer">
    <p>Ten steps, roughly 45 minutes:</p>
    <ol>
      <li>Clarify requirements (functional + non-functional + out-of-scope).</li>
      <li>Estimate scale (users, data, concurrency).</li>
      <li>Sketch high-level architecture.</li>
      <li>Define the client data model.</li>
      <li>Design APIs (REST/GraphQL/WS).</li>
      <li>Decompose into components.</li>
      <li>Decide state management (local, server, URL, global).</li>
      <li>Plan performance (CWV, bundle, rendering strategy).</li>
      <li>Address scalability and edge cases (offline, a11y, i18n, errors).</li>
      <li>Deep-dive on the interviewer's chosen sub-system with tradeoffs.</li>
    </ol>
    <p>Broad first (steps 1-9 give a complete sketch by minute ~25), then deep wherever steered.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. What goes under "functional" vs "non-functional" requirements?</div>
  <div class="qa-answer">
    <p><strong>Functional</strong>: things the user can do. "View a feed, like a post, share, comment, upload a photo."</p>
    <p><strong>Non-functional</strong>: constraints on how the system behaves. "LCP under 2.5s on 4G, accessible to WCAG AA, works offline for 24h, supports RTL, 99.9% uptime, bundle under 250KB gzip."</p>
    <p><strong>Out of scope</strong>: explicit exclusions. "Auth, admin, payment flows, mobile-native — not covered."</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. How much time do you spend on each step?</div>
  <div class="qa-answer">
    <p>Rough budget for 45-minute interview:</p>
    <ul>
      <li>Clarify: 5 min</li>
      <li>Estimate: 2-3 min</li>
      <li>High-level arch: 5 min</li>
      <li>Data model: 3 min</li>
      <li>API: 3-5 min</li>
      <li>Components: 5 min</li>
      <li>State: 3 min</li>
      <li>Performance: 3-5 min</li>
      <li>Edges: 3 min</li>
      <li>Deep dive: 10-15 min</li>
      <li>Wrap-up: 2-3 min</li>
    </ul>
    <p>Don't treat as strict — the interviewer may want more depth mid-way. But if you're still on "clarify" at minute 15, fast-forward.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Walk me through clarifying requirements for "Design YouTube."</div>
  <div class="qa-answer">
    <p>Example clarifying questions:</p>
    <ul>
      <li>Viewing, uploading, or both? (usually just viewing for 45 min).</li>
      <li>Mobile web, desktop, native? (web for this session).</li>
      <li>Anonymous or logged-in? (both — personalized for logged-in).</li>
      <li>Live streaming or VOD? (VOD primary).</li>
      <li>Comments, likes, recommendations? (video player + comments in scope; recommendations maybe).</li>
      <li>What scale? (billions of views, not a startup).</li>
      <li>Any accessibility or localization requirements? (WCAG AA, 30+ locales, RTL).</li>
    </ul>
    <p>After 5 minutes, I'd recap and ask the interviewer to confirm scope before moving on.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. What estimates do you write down?</div>
  <div class="qa-answer">
    <p>Enough to drive design decisions:</p>
    <ul>
      <li>DAU (daily active users) — drives concurrency assumptions.</li>
      <li>Concurrent users at peak — drives realtime channel capacity.</li>
      <li>Data per session — drives caching and pagination strategy.</li>
      <li>Avg object size (tweet, video metadata) — drives request/response design.</li>
      <li>Requests per session — drives bundle + network budget.</li>
      <li>Event frequency (messages/sec, clicks/sec) — drives debounce and batch decisions.</li>
    </ul>
    <p>Round numbers, stated quickly. "100M DAU, ~5M concurrent peak, 10MB per session." Not exact; directional.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How do you pick between REST, GraphQL, and WebSocket?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>REST</strong>: simple CRUD, strong HTTP caching, well-understood tooling. Default for most CRUD.</li>
      <li><strong>GraphQL</strong>: clients need flexible queries across many entities, federated services, over-fetch avoidance. Good for heavy-read aggregated UIs (dashboards, feeds with many joins). Higher server complexity.</li>
      <li><strong>WebSocket</strong>: bidirectional real-time, low-latency. Chat, multiplayer, collaborative editing, live dashboards.</li>
      <li><strong>SSE</strong>: server→client only (notifications, feeds updates) — simpler than WS, HTTP-friendly.</li>
    </ul>
    <p>Often combine: REST for CRUD + WS or SSE for realtime. Don't force one tech to do everything.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. How do you decide on CSR, SSR, SSG, or RSC?</div>
  <div class="qa-answer">
    <ul>
      <li><strong>SSG</strong>: static content (blog, docs, marketing) — cheapest, fastest, great SEO.</li>
      <li><strong>ISR</strong>: same as SSG but with periodic regeneration (product pages, CMS).</li>
      <li><strong>SSR</strong>: personalized content, SEO-critical (logged-in dashboards that also need SEO).</li>
      <li><strong>CSR</strong>: internal tools, apps behind auth where SEO doesn't matter.</li>
      <li><strong>RSC + streaming</strong>: reduce client bundle dramatically, server-side data fetching without API layer, progressive interactivity.</li>
    </ul>
    <p>Modern frameworks (Next.js, Remix) let you mix per route.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. What edge cases do you always cover?</div>
  <div class="qa-answer">
    <ul>
      <li>Offline: cache read, queue writes, reconcile.</li>
      <li>Accessibility: semantic HTML, ARIA, keyboard nav, focus management, contrast.</li>
      <li>Internationalization: RTL, locale-aware formatting, lazy-loaded translations.</li>
      <li>Error handling: error boundaries, retry with backoff, graceful UI.</li>
      <li>Slow network: respect effective connection type; defer heavy media.</li>
      <li>Large data: virtualization, pagination, windowing.</li>
      <li>Tab backgrounded: reduce polling/WS heartbeat.</li>
      <li>Security: CSP, XSS sanitization, CSRF, rate limiting.</li>
    </ul>
    <p>Even one sentence each earns points. Most candidates forget these.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. How do you talk about tradeoffs?</div>
  <div class="qa-answer">
    <p>Three options, pros/cons, your pick with justification.</p>
    <p>Example: "For the feed's data-fetching library, I'm considering React Query, Apollo, or a plain fetch + Redux. React Query wins for server state: automatic caching, revalidation, retries, optimistic mutations. Apollo adds GraphQL integration but is heavier. Plain fetch + Redux gives full control but re-implements everything. Since we're REST + caching-heavy, React Query fits best. Main risk: if we later adopt GraphQL with a lot of normalization, we might migrate to Apollo — but that's future concern."</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. What does a strong candidate sound like vs a weak one?</div>
  <div class="qa-answer">
    <p><strong>Weak</strong>: jumps to components, uses "magic" ("we'd make it fast"), ignores a11y/offline, can't justify choices, can't handle follow-ups.</p>
    <p><strong>Strong</strong>: clarifies first, writes quick estimates, sketches boxes, uses precise vocabulary ("normalized cache keyed by id," "cursor pagination," "optimistic mutation with rollback"), pairs each decision with a tradeoff, invites pushback, adapts under scrutiny, wraps up with explicit open questions.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. The interviewer asks "how would you scale this to 1B users?" How do you answer?</div>
  <div class="qa-answer">
    <p>Two dimensions on the frontend:</p>
    <ol>
      <li><strong>Delivery at scale</strong>: CDN everywhere, edge SSR, aggressive caching, HTTP/2 multiplexing, regional POPs, static assets cache-busted with long TTLs.</li>
      <li><strong>Client resources</strong>: per-user data still has to fit in a browser tab. Virtualize lists, chunk fetches, aggressive prune old data, web worker for heavy tasks, RUM for percentile monitoring.</li>
    </ol>
    <p>Distinguish backend scale (your responsibility to know at a high level, not design) from frontend scale (the main topic).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. You're asked about real-time. What are the options?</div>
  <div class="qa-answer">
    <table>
      <thead><tr><th>Option</th><th>Direction</th><th>When to pick</th></tr></thead>
      <tbody>
        <tr><td>Polling</td><td>Client pulls</td><td>Low QPS, simplest, cache-friendly</td></tr>
        <tr><td>Long polling</td><td>Client pulls, server holds</td><td>Near-real-time without WS, still HTTP</td></tr>
        <tr><td>SSE</td><td>Server pushes (one-way)</td><td>Notifications, feed updates — simpler than WS</td></tr>
        <tr><td>WebSocket</td><td>Bidirectional</td><td>Chat, collab editing, multiplayer — low latency both ways</td></tr>
        <tr><td>WebRTC</td><td>Peer-to-peer</td><td>Voice/video calls, screen share</td></tr>
      </tbody>
    </table>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Describe a normalized client cache.</div>
  <div class="qa-answer">
    <p>Store entities by id in lookup tables, and views as lists of ids. Example:</p>
<pre><code>tweetsById: { [id]: Tweet }
usersById: { [id]: User }
feedTweetIds: [id, id, id, ...]</code></pre>
    <p>Updates to one tweet happen in one place; every view renders the latest version by looking up the id. Also: smaller memory, easy pagination (append ids), easy invalidation (evict entries selectively). Libraries: Apollo Cache, Redux Toolkit's <code>createEntityAdapter</code>, manual with React Query's <code>setQueryData</code>.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q14. How do you handle long lists (like a social feed)?</div>
  <div class="qa-answer">
    <p>Combination:</p>
    <ul>
      <li><strong>Cursor pagination</strong> (stable under inserts).</li>
      <li><strong>Virtualization</strong> (only render visible rows — <code>react-window</code>, <code>@tanstack/virtual</code>).</li>
      <li><strong>Prefetch</strong> next page when near bottom.</li>
      <li><strong>Cache eviction</strong> for rows scrolled far away to avoid memory growth.</li>
      <li><strong>Stable row component</strong> (memoized, stable handlers via useCallback).</li>
      <li><strong>Skeleton / placeholder</strong> during fetch to avoid CLS.</li>
    </ul>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q15. What's your wrap-up message?</div>
  <div class="qa-answer">
    <p>Reserve 1-2 minutes for explicit summary and forward-looking.</p>
    <blockquote>
    "To recap: I've sketched [high-level architecture], with [X] as the key data layer decision and [Y] for rendering. Main tradeoffs I made were [Z]. Given more time, I'd dive deeper into [A and B], and I'm least certain about [C] — that's where I'd want to prototype or measure. Happy to discuss anything else."
    </blockquote>
    <p>Shows self-awareness, invites continued discussion, leaves a positive closing impression.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You clarify in 3 buckets (functional, non-functional, out-of-scope) before designing.</li>
    <li>You estimate scale with round numbers that actually drive decisions.</li>
    <li>You draw — boxes + arrows, not just words.</li>
    <li>You name tradeoffs for every significant choice.</li>
    <li>You cover a11y, i18n, offline, error handling explicitly.</li>
    <li>You adjust under pushback rather than defending.</li>
    <li>You watch the clock; move on when time is short.</li>
    <li>You wrap up with explicit open questions and next-steps.</li>
  </ul>
</div>
`}

]
});
