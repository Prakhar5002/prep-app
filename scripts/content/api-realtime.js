window.PREP_SITE.registerTopic({
  id: 'api-realtime',
  module: 'api-design',
  title: 'Realtime Decision Tree',
  estimatedReadTime: '50 min',
  tags: ['realtime', 'websocket', 'sse', 'long-polling', 'webrtc', 'push-notifications', 'pub-sub', 'backpressure'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>"<strong>Realtime</strong>" is a fuzzy word that hides six different transports with very different tradeoffs. The first thing to do in any realtime prompt is decide <em>which kind</em> of realtime you actually need. Direction (server→client, bidirectional, peer-to-peer), frequency, latency budget, payload size, mobile background behaviour, and scaling shape all push you toward different answers.</p>
<ul>
  <li><strong>Polling</strong> — simple but expensive at scale. Default when "realtime" really means "every 30s is fine."</li>
  <li><strong>Long polling</strong> — older, mostly replaced. Useful when intermediaries forbid WebSockets.</li>
  <li><strong>SSE (Server-Sent Events)</strong> — server→client only, HTTP-friendly, auto-reconnect, text-only. Best for one-way streams (notifications, dashboards, AI streaming responses).</li>
  <li><strong>WebSocket</strong> — bidirectional binary/text frames over one TCP connection. Default for chat, presence, multiplayer, live cursors.</li>
  <li><strong>WebRTC</strong> — peer-to-peer; low-latency audio/video/data; requires signalling + STUN/TURN. Used for calls, screen-share, P2P file transfer.</li>
  <li><strong>Push (FCM / APNs / Web Push)</strong> — OS-level delivery to a possibly-offline client; high latency, low reliability for "realtime," but the only thing that works when the app is backgrounded or terminated.</li>
</ul>
<p><strong>Mantra:</strong> "Direction first, frequency next, mobile background reality last. Pick transport for the slowest realistic case."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>Why "realtime" needs a decision tree</h3>
<p>People say "make this realtime" when they want anything from "update within 60 seconds" to "less than 50ms latency." The right answer for "show new comments instantly" is not the right answer for "stream the user's voice." Mismatching costs money, batteries, or both.</p>

<h3>The 6 transports at a glance</h3>
<table>
  <thead><tr><th>Transport</th><th>Direction</th><th>Latency</th><th>Connection</th><th>Browser?</th><th>Mobile bg?</th></tr></thead>
  <tbody>
    <tr><td>Polling</td><td>Pull</td><td>= interval</td><td>Short HTTP</td><td>✅</td><td>⚠️ via background fetch</td></tr>
    <tr><td>Long polling</td><td>Pull, server holds</td><td>~ seconds</td><td>Long HTTP</td><td>✅</td><td>❌ killed on suspend</td></tr>
    <tr><td>SSE</td><td>Server → client</td><td>~ ms</td><td>Long HTTP</td><td>✅ (no IE)</td><td>❌ killed on suspend</td></tr>
    <tr><td>WebSocket</td><td>Bidirectional</td><td>~ ms</td><td>Long TCP, upgraded HTTP</td><td>✅</td><td>❌ killed on suspend</td></tr>
    <tr><td>WebRTC</td><td>Peer-to-peer</td><td>~ ms</td><td>UDP (DataChannel) / RTP</td><td>✅</td><td>limited</td></tr>
    <tr><td>Push (FCM/APNs/Web Push)</td><td>Server → client OS</td><td>seconds–minutes</td><td>OS-managed</td><td>✅ (Web Push)</td><td>✅ (the point)</td></tr>
  </tbody>
</table>

<h3>The decision tree</h3>
<pre><code class="language-text">Q1. Does the client need to receive updates without asking?
    No  → Polling (or just request/response on user action)
    Yes → Q2

Q2. Does the client also need to send messages on the same channel?
    No  → SSE (or long polling if SSE blocked by infra)
    Yes → Q3

Q3. Is this a peer-to-peer call (audio/video/screen) or massive low-latency data?
    Yes → WebRTC + signalling server
    No  → WebSocket

Q4. Does the message need to reach the user even when the app is closed/backgrounded?
    Yes → Push notification (FCM / APNs / Web Push) — usually IN ADDITION to a socket
    No  → Whatever Q2/Q3 picked
</code></pre>

<h3>Don't confuse latency budget with frequency</h3>
<table>
  <thead><tr><th>Use case</th><th>Acceptable latency</th><th>Right transport</th></tr></thead>
  <tbody>
    <tr><td>Email arrival notification</td><td>seconds–minutes</td><td>Push + foreground SSE/WS</td></tr>
    <tr><td>Stock ticker dashboard</td><td>~1s</td><td>SSE or WebSocket</td></tr>
    <tr><td>Chat message</td><td>~100ms</td><td>WebSocket</td></tr>
    <tr><td>Multiplayer game position</td><td>~50ms</td><td>WebSocket / WebTransport</td></tr>
    <tr><td>Voice call</td><td>~150ms one-way</td><td>WebRTC</td></tr>
    <tr><td>Live cursors / presence</td><td>~100ms</td><td>WebSocket (CRDT-friendly)</td></tr>
    <tr><td>AI streaming response</td><td>~30ms inter-token</td><td>SSE (most LLM APIs)</td></tr>
    <tr><td>Build status dashboard</td><td>1–5s</td><td>SSE or polling</td></tr>
  </tbody>
</table>

<h3>Mobile reality check</h3>
<ul>
  <li>iOS suspends background apps within ~30s. WebSockets / SSE die.</li>
  <li>Android is more lenient but battery optimisation kills sockets too.</li>
  <li>True "even when the app is closed" delivery on mobile = push notifications. Period.</li>
  <li>Push has its own quirks: FCM/APNs queue but may drop; throttle when frequent; don't use for live data.</li>
  <li>Common mobile pattern: open WebSocket while app is foreground; rely on push to wake the user when backgrounded; reconnect WebSocket on resume + replay missed messages from a "since" cursor.</li>
</ul>

<h3>What "good realtime" looks like</h3>
<ul>
  <li>Transport chosen deliberately, not "we used WebSockets because everyone else does."</li>
  <li>Reconnection logic with exponential backoff + jitter.</li>
  <li>"Catch up" mechanism: server gives clients a cursor / sequence ID so reconnect = "give me messages after X."</li>
  <li>Backpressure handling: slow consumers don't break the producer.</li>
  <li>Heartbeats (ping/pong) to detect half-open connections.</li>
  <li>Mobile-aware: foreground = socket, background = push, resume = catch up.</li>
  <li>Pub/sub backbone (Redis / NATS / Kafka) so multi-instance servers don't fragment fanout.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The "5 axes" of any realtime feature</h3>
<table>
  <thead><tr><th>Axis</th><th>Question</th><th>Affects</th></tr></thead>
  <tbody>
    <tr><td>Direction</td><td>Server → client only? Both ways? Peer-to-peer?</td><td>Transport choice</td></tr>
    <tr><td>Latency</td><td>End-to-end budget?</td><td>Polling vs push vs streaming</td></tr>
    <tr><td>Frequency</td><td>Messages per second per user?</td><td>Backpressure, batching</td></tr>
    <tr><td>Reliability</td><td>OK to drop? Need at-least-once? Exactly-once?</td><td>Acks, dedupe, persistent queue</td></tr>
    <tr><td>Lifecycle</td><td>Foreground only? Always-on? Across closed app?</td><td>Push vs socket vs both</td></tr>
  </tbody>
</table>

<h3>Polling — the boring default</h3>
<p>Client asks every N seconds. Server responds with current state.</p>
<ul>
  <li><strong>Pro:</strong> trivially scalable; works on any infra; no socket maintenance.</li>
  <li><strong>Con:</strong> wasteful; latency = interval / 2 on average.</li>
  <li><strong>Use when:</strong> updates are infrequent, latency budget is loose (build status every 30s), or infra forbids long-lived connections.</li>
  <li><strong>Tip:</strong> use ETags + 304 — most polls return "nothing changed" cheaply.</li>
</ul>

<h3>Long polling — legacy bridge</h3>
<p>Client makes a request; server holds it open until something to send (or a timeout). Client immediately re-opens.</p>
<ul>
  <li><strong>Pro:</strong> works across any HTTP infrastructure; no special protocols.</li>
  <li><strong>Con:</strong> per-event HTTP overhead; harder to scale (one connection per active user); reconnect chatter.</li>
  <li><strong>Use when:</strong> WebSockets blocked by hostile proxies / firewalls (rare today); compatibility shim for ancient clients.</li>
  <li><strong>Most realtime libs (Socket.IO, Ably) fall back to long polling automatically.</strong></li>
</ul>

<h3>Server-Sent Events (SSE)</h3>
<p>Browser-native one-way stream over HTTP. <code>EventSource</code> on the client; <code>text/event-stream</code> on the server. Auto-reconnect with <code>Last-Event-ID</code>.</p>
<ul>
  <li><strong>Pro:</strong> HTTP-friendly, works through proxies, auto-reconnects, ordered delivery, simple server code.</li>
  <li><strong>Con:</strong> server → client only; text only (binary needs base64); browsers cap connections per origin (~6 over HTTP/1.1 — fine over HTTP/2).</li>
  <li><strong>Use when:</strong> dashboards, notifications, log streams, AI token streaming, build progress.</li>
  <li><strong>Format:</strong></li>
</ul>
<pre><code class="language-text">event: comment
id: 9911
data: {"id":42,"body":"Hello"}

event: heartbeat
data: {}

</code></pre>

<h3>WebSocket</h3>
<p>HTTP <em>upgrade</em> handshake; afterwards, full-duplex frames over one TCP socket. Text or binary. Custom subprotocols.</p>
<ul>
  <li><strong>Pro:</strong> bidirectional, low overhead per message, low latency, browser + native.</li>
  <li><strong>Con:</strong> stateful; harder to scale (sticky sessions or pub/sub backbone); proxies / load balancers need configuration.</li>
  <li><strong>Use when:</strong> chat, presence, live cursors, multiplayer state, real-time collaborative editing.</li>
  <li><strong>Subprotocols:</strong> <code>graphql-ws</code> (GraphQL subscriptions), STOMP, MQTT-over-WS, custom JSON message envelopes.</li>
</ul>

<h3>WebRTC</h3>
<p>Peer-to-peer. Uses STUN to discover public address, TURN to relay when NAT prevents direct connection, ICE to negotiate. <code>RTCPeerConnection</code> for media; <code>RTCDataChannel</code> for low-latency arbitrary data over UDP/SCTP.</p>
<ul>
  <li><strong>Pro:</strong> ultra-low latency, server bandwidth ~zero (P2P), built for media.</li>
  <li><strong>Con:</strong> complex setup; needs signalling server (often WebSocket); needs TURN servers (cost real money); NAT traversal sometimes fails (~5–20% need TURN).</li>
  <li><strong>Use when:</strong> audio/video calls, screen-share, low-latency game data, collaborative drawing.</li>
</ul>

<h3>Push notifications</h3>
<table>
  <thead><tr><th>Service</th><th>Platforms</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>FCM (Firebase)</td><td>Android + iOS + Web</td><td>Most popular; supports data-only and notification messages.</td></tr>
    <tr><td>APNs</td><td>iOS</td><td>Apple-direct alternative; FCM proxies to it.</td></tr>
    <tr><td>Web Push (VAPID)</td><td>All evergreen browsers</td><td>Service Worker delivery; user opt-in required.</td></tr>
    <tr><td>OneSignal / Pushwoosh</td><td>SaaS layer</td><td>Wraps FCM/APNs with segmentation, scheduling, A/B.</td></tr>
  </tbody>
</table>
<p>Push delivery is best-effort: messages can be coalesced, dropped, delayed, or rate-limited by OS / vendor. <strong>Never</strong> rely on push for state synchronisation — only as a wake-up trigger.</p>

<h3>Pub/sub: the backbone</h3>
<p>Realtime fanout across multiple server instances requires a shared pub/sub layer:</p>
<table>
  <thead><tr><th>Tool</th><th>Sweet spot</th></tr></thead>
  <tbody>
    <tr><td>Redis Pub/Sub</td><td>Simple, low ops, fire-and-forget; small scale</td></tr>
    <tr><td>Redis Streams</td><td>Persistent, consumer groups, replay</td></tr>
    <tr><td>NATS / NATS JetStream</td><td>Lightweight, very fast, persistence option</td></tr>
    <tr><td>Apache Kafka</td><td>High throughput, durable, replayable; heavy ops</td></tr>
    <tr><td>AWS SNS + SQS</td><td>Managed pub/sub; reliable but high latency</td></tr>
    <tr><td>Cloud Pub/Sub (GCP)</td><td>Managed; at-least-once</td></tr>
    <tr><td>MQTT (Mosquitto / EMQX)</td><td>IoT, low-bandwidth devices</td></tr>
  </tbody>
</table>

<h3>Reliability semantics</h3>
<table>
  <thead><tr><th>Guarantee</th><th>Means</th><th>How</th></tr></thead>
  <tbody>
    <tr><td>At-most-once</td><td>Fire-and-forget; may lose</td><td>Default raw publish; trade reliability for speed</td></tr>
    <tr><td>At-least-once</td><td>Delivered, possibly duplicated</td><td>Acks + retry; receivers must dedupe by message ID</td></tr>
    <tr><td>Exactly-once</td><td>Delivered exactly once</td><td>Idempotent receivers + dedupe window; rare to truly achieve</td></tr>
    <tr><td>Ordered</td><td>Per-key sequence preserved</td><td>Partition by key (Kafka); single consumer per partition</td></tr>
  </tbody>
</table>

<h3>Backpressure</h3>
<p>Producer outpaces consumer. Options:</p>
<ul>
  <li><strong>Drop:</strong> live cursors, telemetry — newer is more relevant than complete.</li>
  <li><strong>Buffer + bound:</strong> keep last N; reject when full.</li>
  <li><strong>Throttle:</strong> producer slows to consumer speed (TCP does this naturally; app-layer must mimic).</li>
  <li><strong>Coalesce:</strong> merge "user typing" events; emit once per 100ms.</li>
</ul>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>SSE server (Express)</h3>
<pre><code class="language-typescript">app.get('/events', (req, res) =&gt; {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // disable nginx buffering
  });
  res.flushHeaders();

  const send = (event: string, data: unknown, id?: string) =&gt; {
    if (id) res.write(\`id: \${id}\\n\`);
    res.write(\`event: \${event}\\n\`);
    res.write(\`data: \${JSON.stringify(data)}\\n\\n\`);
  };

  const heartbeat = setInterval(() =&gt; res.write(': heartbeat\\n\\n'), 15000);
  const onComment = (c: Comment) =&gt; send('comment', c, String(c.id));
  events.on('comment', onComment);

  req.on('close', () =&gt; {
    clearInterval(heartbeat);
    events.off('comment', onComment);
  });
});
</code></pre>

<h3>SSE client (browser)</h3>
<pre><code class="language-javascript">const es = new EventSource('/events');
es.addEventListener('comment', (ev) =&gt; {
  const c = JSON.parse(ev.data);
  appendComment(c);
});
es.addEventListener('error', (ev) =&gt; {
  // EventSource auto-reconnects unless you close it
  console.warn('reconnecting…', ev);
});

// Resume after reconnect using Last-Event-ID
// EventSource sets it automatically from event id: lines.
</code></pre>

<h3>WebSocket server (ws library)</h3>
<pre><code class="language-typescript">import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws, req) =&gt; {
  const token = new URL(req.url!, 'http://x').searchParams.get('token');
  const user = verifyJwt(token);
  if (!user) { ws.close(4001, 'unauthorized'); return; }

  const heartbeat = setInterval(() =&gt; {
    if (ws.readyState !== ws.OPEN) return;
    ws.ping();
  }, 30000);

  ws.on('pong', () =&gt; { /* mark alive */ });

  ws.on('message', async (raw) =&gt; {
    const msg = JSON.parse(raw.toString());
    switch (msg.type) {
      case 'subscribe': /* track topic */ break;
      case 'send':      await handleSend(user, msg); break;
    }
  });

  ws.on('close', () =&gt; clearInterval(heartbeat));
});
</code></pre>

<h3>WebSocket client with reconnection + catch-up</h3>
<pre><code class="language-typescript">class RealtimeClient {
  private ws: WebSocket | null = null;
  private retryDelay = 500;
  private lastSeq: number | null = null;

  connect() {
    const url = \`wss://api.example.com/ws?token=\${getToken()}\${this.lastSeq ? \`&amp;since=\${this.lastSeq}\` : ''}\`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () =&gt; { this.retryDelay = 500; };
    this.ws.onmessage = (e) =&gt; {
      const msg = JSON.parse(e.data);
      if (msg.seq) this.lastSeq = msg.seq;
      this.handle(msg);
    };
    this.ws.onclose = () =&gt; {
      const jitter = Math.random() * 0.3 * this.retryDelay;
      const delay = Math.min(this.retryDelay + jitter, 30000);
      setTimeout(() =&gt; this.connect(), delay);
      this.retryDelay = Math.min(this.retryDelay * 2, 30000);
    };
  }

  send(msg: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      // queue + flush on open, with size cap
    }
  }

  handle(msg: { type: string; [k: string]: unknown }) { /* dispatch */ }
}
</code></pre>

<h3>Heartbeats / dead connection detection</h3>
<ul>
  <li>WebSocket: server sends <code>ping</code> frame every 30s; expects <code>pong</code> within 60s, else terminate.</li>
  <li>SSE: server sends a comment line <code>: heartbeat</code> every 15s — keeps proxies from closing idle HTTP/1.1 connections.</li>
  <li>Long polling: server returns empty payload on timeout; client immediately reconnects.</li>
  <li>Mobile: foreground heartbeat 30s; on resume, force reconnect immediately.</li>
</ul>

<h3>Reconnection: exponential backoff with jitter</h3>
<pre><code class="language-typescript">const baseMs = 500;
const maxMs = 30_000;
let attempt = 0;

function nextDelay() {
  const exp = Math.min(maxMs, baseMs * 2 ** attempt);
  const jitter = Math.random() * exp * 0.3;
  attempt++;
  return exp + jitter;
}

function reset() { attempt = 0; }
</code></pre>

<h3>Catch-up after disconnect</h3>
<p>Client tracks last sequence ID. On reconnect, requests <code>?since=&lt;seq&gt;</code>. Server replays missed events from a buffer (Redis Streams, in-memory ring buffer, Kafka topic).</p>
<pre><code class="language-text">Client receives: { seq: 100, ... }
Network drops.
Client reconnects with ?since=100.
Server replays seqs 101–105 from buffer, then resumes live stream.
</code></pre>

<h3>Pub/sub fanout (multi-instance server)</h3>
<pre><code class="language-typescript">// publisher
await redis.publish('channel:room:42', JSON.stringify({ type: 'message', body }));

// subscriber (each ws server instance)
const sub = redis.duplicate();
await sub.subscribe('channel:room:42');
sub.on('message', (channel, raw) =&gt; {
  const msg = JSON.parse(raw);
  for (const ws of socketsInRoom42) ws.send(JSON.stringify(msg));
});
</code></pre>

<h3>Push notification — FCM</h3>
<pre><code class="language-typescript">import { getMessaging } from 'firebase-admin/messaging';

await getMessaging().send({
  token: deviceFcmToken,
  notification: { title: 'New comment', body: 'Prakhar replied to you' },
  data: { type: 'comment', postId: '42', commentId: '99' },
  android: { priority: 'high' },
  apns: { headers: { 'apns-priority': '10' } },
});
</code></pre>
<p>Always send a <code>data</code> payload too — it's what your app uses to deep-link or refetch the canonical state.</p>

<h3>WebRTC sketch</h3>
<pre><code class="language-typescript">// Both peers
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:turn.example.com:3478', username, credential },
  ],
});

pc.onicecandidate = (e) =&gt; e.candidate &amp;&amp; ws.send({ type: 'ice', candidate: e.candidate });
pc.ontrack = (e) =&gt; (videoEl.srcObject = e.streams[0]);

// Caller
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
ws.send({ type: 'offer', sdp: offer });

// Callee
ws.on('offer', async (sdp) =&gt; {
  await pc.setRemoteDescription(sdp);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  ws.send({ type: 'answer', sdp: answer });
});
</code></pre>
<p>The signalling channel (here, a <code>ws</code> connection) is just for SDP + ICE exchange; media flows directly between peers via UDP after that.</p>

<h3>WebTransport — the future</h3>
<p>WebTransport (HTTP/3 + QUIC) gives bidirectional streams + datagrams with multiplexing and unreliable delivery. Browser support is improving; useful for games, real-time CRDTs. Production-ready in Chrome / Edge; Safari + Firefox lag.</p>
`
    },
    {
      id: 'worked-examples',
      title: '🧩 Worked Examples',
      html: `
<h3>Example 1: Picking transport for a chat app</h3>
<p>Requirements: 1:1 + group chat, presence indicators, typing dots, message reactions, push when app closed, mobile + web.</p>
<table>
  <thead><tr><th>Feature</th><th>Direction</th><th>Latency</th><th>Transport</th></tr></thead>
  <tbody>
    <tr><td>Send/receive messages</td><td>bidirectional</td><td>~100ms</td><td>WebSocket</td></tr>
    <tr><td>Presence (online/offline)</td><td>server → client</td><td>~1s</td><td>WebSocket (same)</td></tr>
    <tr><td>Typing dots</td><td>both ways, ephemeral</td><td>~100ms</td><td>WebSocket; coalesce 100ms</td></tr>
    <tr><td>Reactions</td><td>both ways</td><td>~200ms</td><td>WebSocket</td></tr>
    <tr><td>App-closed delivery</td><td>server → device</td><td>seconds</td><td>FCM/APNs push</td></tr>
    <tr><td>Catch-up on resume</td><td>client → server</td><td>once</td><td>HTTP <code>GET /messages?since=...</code></td></tr>
  </tbody>
</table>
<p>Architecture: WebSocket while foreground; backend publishes to Redis Streams; consumer also fans out push to FCM/APNs for offline users; on app foreground, client reconnects + fetches missed messages by sequence ID.</p>

<h3>Example 2: Stock ticker dashboard</h3>
<p>Requirements: 100 symbols updating ~1/s, web only, read-only.</p>
<ul>
  <li>SSE — one-way fits perfectly; reconnect with <code>Last-Event-ID</code>; no client → server needed.</li>
  <li>Server pushes updates batched 200ms; clients render with requestAnimationFrame.</li>
  <li>Backpressure: drop intermediate updates; only the latest matters per symbol.</li>
</ul>

<h3>Example 3: AI streaming response</h3>
<p>Requirements: server emits tokens as the LLM produces them; latency budget &lt; 30ms inter-token; HTTP-friendly.</p>
<ul>
  <li>SSE — every major LLM API (OpenAI, Anthropic) ships streaming as SSE.</li>
  <li>Server emits one event per token (or chunk); browser appends incrementally.</li>
  <li>On error, mark the stream complete; client retries the prompt.</li>
</ul>

<h3>Example 4: Multiplayer cursor / collaborative editing</h3>
<p>Requirements: many concurrent users editing the same doc; CRDT for state; cursor positions update at 60Hz.</p>
<ul>
  <li>WebSocket for low-latency state sync.</li>
  <li>Operations broadcast through Redis Streams keyed by document ID.</li>
  <li>Cursor positions throttled / coalesced on the producer (60Hz → 30Hz emission).</li>
  <li>Catch-up via CRDT vector clock or Yjs / Automerge update protocol.</li>
  <li>Persistent storage: append every op to the doc's stream; snapshots periodically.</li>
</ul>

<h3>Example 5: Video call</h3>
<p>Requirements: 1:1 video with screen-share; latency &lt; 150ms one-way; cost-conscious server bandwidth.</p>
<ul>
  <li>WebRTC peer-to-peer; signalling via WebSocket.</li>
  <li>STUN public; TURN private (e.g., coturn) for NATs that block direct.</li>
  <li>Datachannel for in-call chat (low-overhead, peer-to-peer).</li>
  <li>For 3+ participants, switch to SFU (Selective Forwarding Unit, e.g., LiveKit) — server relays media; still WebRTC at the edge.</li>
</ul>

<h3>Example 6: Build status dashboard</h3>
<p>Requirements: CI runs ~50 builds/hour; engineers want "is mine done?" updates within seconds.</p>
<table>
  <thead><tr><th>Approach</th><th>Verdict</th></tr></thead>
  <tbody>
    <tr><td>Polling every 30s</td><td>Fine if "few seconds" isn't strict</td></tr>
    <tr><td>SSE</td><td>Better; per-build event stream; auto-reconnect</td></tr>
    <tr><td>WebSocket</td><td>Overkill — no client → server needed</td></tr>
    <tr><td>Push</td><td>Great for "your build is done" while user is in another app</td></tr>
  </tbody>
</table>
<p>Sweet spot: SSE for the live page + push for "build done while you were away."</p>

<h3>Example 7: Mobile push + WebSocket together</h3>
<p>Requirements: chat app feature parity foreground/background.</p>
<ol>
  <li>Foreground: WebSocket connected, messages stream live.</li>
  <li>App backgrounds → iOS suspends after ~30s; WebSocket dies.</li>
  <li>Server detects no socket; routes new messages via FCM/APNs.</li>
  <li>Push payload includes message ID + last-seen sequence so app can fetch on resume.</li>
  <li>App resumes → reconnect WebSocket with <code>?since=&lt;seq&gt;</code>; server replays missed messages.</li>
  <li>UI dedupe by message ID — push-displayed messages may also arrive via socket.</li>
</ol>
`
    },
    {
      id: 'edge-cases',
      title: '🚧 Edge Cases',
      html: `
<h3>Half-open connections</h3>
<p>TCP doesn't always notice when the other side dies — especially over wifi, cellular, or NAT timeouts. Without heartbeats, your "connected" socket is silently dead. Always:</p>
<ul>
  <li>Send WebSocket ping every 30s; tear down on missed pong.</li>
  <li>Send SSE heartbeat comments every 15s.</li>
  <li>Force reconnect on app foreground (don't trust state).</li>
</ul>

<h3>Reconnect storms</h3>
<p>Server restarts, 100,000 clients reconnect at once → thundering herd that crashes the server again.</p>
<ul>
  <li>Exponential backoff + jitter (always jitter; never sync everyone).</li>
  <li>Server-side connection rate limit; reject excess with <code>Retry-After</code>.</li>
  <li>Pre-warm caches before fully reopening.</li>
</ul>

<h3>Message ordering across reconnect</h3>
<ul>
  <li>Server assigns monotonic sequence IDs per stream / topic.</li>
  <li>Client tracks last seen; on reconnect requests <code>?since=&lt;n&gt;</code>.</li>
  <li>Buffer must persist long enough for typical disconnection windows (mobile background = minutes; CDN failover = seconds).</li>
  <li>If buffer rolled past client's last seen → fall back to "fetch full state, then resume live."</li>
</ul>

<h3>Duplicates</h3>
<ul>
  <li>At-least-once means duplicates are guaranteed eventually.</li>
  <li>Receiver must dedupe by message ID (LRU cache of last N IDs).</li>
  <li>UI applies operations idempotently — applying the same comment twice should not double it.</li>
</ul>

<h3>Multi-instance fanout</h3>
<ul>
  <li>WebSocket server keeps connections in memory of one instance. Other instances don't know about them.</li>
  <li>Pub/sub layer (Redis / NATS) is the bus. Every instance subscribes; routes to its local sockets.</li>
  <li>Sticky sessions help with reconnect to the same instance but aren't a substitute for pub/sub.</li>
</ul>

<h3>Mobile background</h3>
<ul>
  <li>iOS: backgrounded app suspended within ~30s. Even backgrounded WebSockets die.</li>
  <li>Android: similar with battery optimisation; OEM-specific (Xiaomi / Huawei aggressive).</li>
  <li>Don't try to "keep the connection alive in the background" — OS will kill you, drain battery, get app reviewed badly.</li>
  <li>Use push for delivery; reconnect on foreground; use background fetch for "once an hour" check-in.</li>
  <li>Silent push (data-only) on iOS lets server wake the app briefly to update local state — but rate-limited by Apple to ~1/3 hours.</li>
</ul>

<h3>Push reliability</h3>
<ul>
  <li>FCM/APNs are best-effort. Messages can be coalesced (same channel, same key), dropped on quota, or queued for hours.</li>
  <li>Don't use push for state. Use it as a wake-up: "fetch the truth from the server."</li>
  <li>Time-sensitive notifications need <code>apns-priority: 10</code> on iOS, <code>priority: high</code> on Android — but high-priority is rate-limited; abuse causes throttling or app review issues.</li>
  <li>Token rotation: APNs/FCM tokens change. Refresh on each app open; clear on logout.</li>
</ul>

<h3>Authentication</h3>
<ul>
  <li>WebSocket: pass JWT in URL query (encode with TLS — fine since URL is over the wire encrypted) or send first-message auth handshake.</li>
  <li>Cookies don't always travel with WebSocket connections cross-origin; query/header is more reliable.</li>
  <li>Token refresh: WS connection authed at connect; if token expires mid-connection, server may need to disconnect or re-auth on demand.</li>
  <li>Subscriptions: validate authorisation per-channel; viewer A can't subscribe to viewer B's room.</li>
</ul>

<h3>Proxies, load balancers, CDNs</h3>
<ul>
  <li>L7 load balancers (ALB, nginx) need WebSocket-aware config or they 502 the upgrade.</li>
  <li>Idle timeout: AWS ALB default 60s. Increase or heartbeat.</li>
  <li>SSE behind nginx: disable <code>proxy_buffering</code> + set <code>proxy_read_timeout</code> high, otherwise events queue.</li>
  <li>Cloudflare WebSockets are supported on all plans; SSE works as a streaming response (sometimes buffered on free tier).</li>
</ul>

<h3>Scaling math</h3>
<ul>
  <li>10k concurrent WebSockets per server is normal; 100k achievable with tuning (file descriptors, socket buffers).</li>
  <li>Memory per connection: ~10–30 KB baseline + your app state.</li>
  <li>Pub/sub bus is usually the bottleneck before sockets are.</li>
  <li>"Fan out" cost: a single message to a room of 1k = 1k socket writes from one instance.</li>
</ul>

<h3>Security</h3>
<ul>
  <li>Always TLS — <code>wss://</code>, never <code>ws://</code> in production.</li>
  <li>Validate every message from the client; never trust client-supplied identity fields.</li>
  <li>Rate-limit messages per socket; one bad client shouldn't melt the server.</li>
  <li>Audit log message origins for compliance / abuse investigations.</li>
  <li>Cross-Site WebSocket Hijacking (CSWSH): WebSocket doesn't enforce same-origin like fetch; check <code>Origin</code> header at handshake.</li>
</ul>

<h3>Cost</h3>
<ul>
  <li>WebSocket: cheap per message but expensive per connection (memory, fd, LB hours).</li>
  <li>SSE: cheap per message (HTTP/2 multiplexed); same per-connection cost as WS.</li>
  <li>WebRTC TURN bandwidth: real money, often the most expensive part of voice/video.</li>
  <li>Push: usually free (FCM / APNs); managed services (OneSignal) charge by volume.</li>
  <li>Pub/sub: Redis cheap; Kafka heavy.</li>
</ul>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>The 10 most common realtime mistakes</h3>
<ol>
  <li><strong>Picking WebSocket by reflex.</strong> SSE is enough for most one-way streams and simpler to operate.</li>
  <li><strong>No heartbeat.</strong> Half-open connections accumulate; users think they're connected but get nothing.</li>
  <li><strong>No reconnect with backoff + jitter.</strong> Mass reconnect storms melt the server.</li>
  <li><strong>No catch-up mechanism.</strong> Reconnect = potentially missing messages. Sequence IDs solve this.</li>
  <li><strong>Trusting push for delivery.</strong> Push is a wake-up signal, not a state channel.</li>
  <li><strong>Single-instance assumption.</strong> Works in dev with one server; fanout breaks in prod.</li>
  <li><strong>Coupling business logic to the socket.</strong> Logic should publish to pub/sub; sockets are dumb fan-out.</li>
  <li><strong>Sending dates as <code>Date</code> objects.</strong> JSON loses them; use ISO strings or superjson.</li>
  <li><strong>Forgetting to validate <code>Origin</code> header on WS upgrade.</strong> Cross-Site WebSocket Hijacking.</li>
  <li><strong>Mobile app trying to keep socket alive in background.</strong> OS kills it; battery dies; users uninstall.</li>
</ol>

<h3>Anti-pattern: WebSocket for everything</h3>
<p>"Let's use WebSocket because it's bidirectional." But your feature is server → client only and updates 1/s. SSE is simpler, HTTP-cacheable in proxies, has built-in reconnect via <code>Last-Event-ID</code>, and is one less moving part to operate.</p>

<h3>Anti-pattern: in-memory pub/sub for production</h3>
<pre><code class="language-typescript">// BAD — only works on a single server instance
const events = new EventEmitter();
events.on('comment', (c) =&gt; broadcastToAllSockets(c));

// GOOD — Redis Pub/Sub or Streams; every server subscribes
await redis.publish('comments', JSON.stringify(c));
</code></pre>

<h3>Anti-pattern: no message IDs</h3>
<pre><code class="language-typescript">// BAD — server sends opaque payloads
ws.send(JSON.stringify({ body: 'hi' }));

// GOOD — message ID + sequence + timestamp
ws.send(JSON.stringify({ id: 'msg-9911', seq: 4710, ts: Date.now(), body: 'hi' }));
</code></pre>
<p>Clients need IDs to dedupe; sequences to detect gaps and request catch-up; timestamps to display "just now" and to debug latency.</p>

<h3>Anti-pattern: no backpressure on the producer</h3>
<pre><code class="language-typescript">// BAD — every cursor move emits; bus floods
window.addEventListener('mousemove', (e) =&gt; ws.send({ type: 'cursor', x: e.x, y: e.y }));

// GOOD — coalesce / throttle
let last = 0;
window.addEventListener('mousemove', (e) =&gt; {
  const now = performance.now();
  if (now - last &gt; 33) { ws.send({ type: 'cursor', x: e.x, y: e.y }); last = now; }
});
</code></pre>

<h3>Anti-pattern: building "presence" with WebSocket alone</h3>
<p>Naive presence: "user is online iff their socket is connected." Fails because:</p>
<ul>
  <li>Tab-switched users have idle sockets.</li>
  <li>Mobile-backgrounded users have no socket but are still "online" semantically.</li>
  <li>Multiple tabs = multiple sockets per user.</li>
</ul>
<p>Real presence needs heartbeats + last-active timestamp + UI definitions ("active in last 5 min"). Don't promise more than you deliver.</p>

<h3>Anti-pattern: "exactly once" with at-least-once infra</h3>
<p>Most pub/sub is at-least-once. Pretending it's exactly-once silently double-charges users when retries occur. Make receivers idempotent by message ID + dedupe window. The infra delivers ≥1, you de-dupe to 1.</p>

<h3>Anti-pattern: cleartext <code>ws://</code> in production</h3>
<p>Always <code>wss://</code>. Tokens travel as query params or headers; cleartext is unacceptable.</p>

<h3>Anti-pattern: ignoring the <code>Origin</code> header</h3>
<p>Browsers send <code>Origin</code> on WebSocket upgrades. Validate it server-side; otherwise any cross-origin page can open a WebSocket using the user's cookies.</p>

<h3>Anti-pattern: long polling instead of SSE in 2026</h3>
<p>Long polling is from 2008. Use SSE unless you're propping up IE11. Server-side simpler; client-side simpler; auto-reconnect; ordered.</p>

<h3>Anti-pattern: no pruning of buffered events</h3>
<p>Server keeps every event ever for catch-up. Buffer grows unboundedly; memory dies. Use Redis Streams with <code>MAXLEN</code> or sliding window (e.g., last 24 hours / last 10k events).</p>

<h3>Anti-pattern: same channel for "data" and "control"</h3>
<p>Mixing application messages and protocol messages (heartbeats, schema versions) on the same envelope. Use a typed envelope with <code>kind: 'data' | 'ping' | 'error'</code>.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '💼 Interview Patterns',
      html: `
<h3>Common realtime design prompts</h3>
<ol>
  <li>Design WhatsApp / Slack / Discord chat.</li>
  <li>Design a presence / "online status" system.</li>
  <li>Design a real-time collaborative editor (Google Docs / Figma).</li>
  <li>Design a video call platform (Zoom / Meet).</li>
  <li>Design a stock ticker / live dashboard.</li>
  <li>Design notifications across web + iOS + Android.</li>
  <li>Design a multiplayer game's state sync.</li>
  <li>Design AI chat streaming.</li>
  <li>Design Uber / Lyft live driver location updates.</li>
</ol>

<h3>The 5-step framework for any realtime prompt</h3>
<ol>
  <li><strong>Walk the decision tree.</strong> Direction → frequency → bidirectional? → P2P? → mobile background?</li>
  <li><strong>Pick the transport(s) deliberately.</strong> Often two: socket for foreground + push for backgrounded delivery.</li>
  <li><strong>Pick the bus.</strong> Redis Pub/Sub / Streams / NATS / Kafka, sized to throughput + replay needs.</li>
  <li><strong>Address reliability:</strong> sequence IDs, catch-up, dedupe, heartbeat, backoff, backpressure.</li>
  <li><strong>Address mobile:</strong> push for closed-app delivery, reconnect on foreground, "since" cursor.</li>
</ol>

<h3>Tradeoff vocabulary to use out loud</h3>
<ul>
  <li><em>"For one-way notifications I'd use SSE — auto-reconnect with Last-Event-ID, simpler ops than WebSocket."</em></li>
  <li><em>"Bidirectional + low-latency = WebSocket. Add Redis Streams for fanout across server instances."</em></li>
  <li><em>"WebRTC for the actual media; signalling over WebSocket; TURN for NATs that block direct."</em></li>
  <li><em>"On mobile we can't keep the socket alive when backgrounded. Push wakes the app; on foreground we reconnect and replay missed messages from the last sequence ID."</em></li>
  <li><em>"At-least-once delivery; receivers dedupe by message ID. Exactly-once is a lie at scale."</em></li>
  <li><em>"Backpressure on the producer: coalesce cursor moves to 30Hz, drop intermediate ticker prices."</em></li>
  <li><em>"Heartbeats every 30s on WS, every 15s on SSE — proxies kill idle connections silently."</em></li>
</ul>

<h3>Pattern recognition cheat sheet</h3>
<table>
  <thead><tr><th>Prompt keyword</th><th>Reach for</th></tr></thead>
  <tbody>
    <tr><td>"chat", "messages", "presence"</td><td>WebSocket + Redis + push</td></tr>
    <tr><td>"notifications", "live dashboard"</td><td>SSE + push for closed app</td></tr>
    <tr><td>"video call", "voice"</td><td>WebRTC + signalling WS + TURN</td></tr>
    <tr><td>"collaborative editing"</td><td>WebSocket + CRDT + persistent stream</td></tr>
    <tr><td>"AI streaming"</td><td>SSE</td></tr>
    <tr><td>"multiplayer game"</td><td>WebSocket / WebTransport for state; UDP via WebRTC datachannel for hot-path</td></tr>
    <tr><td>"location updates"</td><td>WebSocket; backpressure; geohash partition for fanout</td></tr>
    <tr><td>"reliable delivery while app closed"</td><td>Push notification (FCM / APNs)</td></tr>
    <tr><td>"audit / replay"</td><td>Kafka or Redis Streams (durable)</td></tr>
  </tbody>
</table>

<h3>Demo script (whiteboard)</h3>
<ol>
  <li>State the requirements; clarify direction and latency budget.</li>
  <li>Walk the decision tree out loud; pick transport.</li>
  <li>Sketch architecture: client ↔ socket server ↔ pub/sub ↔ workers / DB.</li>
  <li>Mark the catch-up cursor + push integration on the diagram.</li>
  <li>Describe reconnect policy; heartbeat cadence; dedupe strategy.</li>
  <li>Talk scaling: connections per instance, pub/sub throughput, hot rooms.</li>
</ol>

<h3>"If I had more time" closers</h3>
<ul>
  <li><em>"Per-channel rate limit on producers."</em></li>
  <li><em>"Geo-distributed socket servers with Redis cluster across regions."</em></li>
  <li><em>"WebTransport experiment for game traffic; HTTP/3 multiplexing wins for many small messages."</em></li>
  <li><em>"Telemetry: per-message latency p50/p95/p99 from server publish to client ACK."</em></li>
  <li><em>"Replay buffer with TTL tuned to typical reconnection window (30s mobile, 5min desktop)."</em></li>
  <li><em>"Push deduplication so users don't get the same notification on web + iOS + Android."</em></li>
  <li><em>"TURN bandwidth budget + alerting; it's the most expensive line item."</em></li>
  <li><em>"Graceful upgrade path from polling → SSE → WebSocket as features mature."</em></li>
</ul>

<h3>What graders write down</h3>
<table>
  <thead><tr><th>Signal</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td>Decision tree fluency</td><td>Names direction / latency / mobile-bg before picking transport</td></tr>
    <tr><td>Reliability awareness</td><td>Heartbeats, reconnect, sequence IDs, dedupe</td></tr>
    <tr><td>Scaling instinct</td><td>Pub/sub backbone for fanout; sizing pub/sub before sockets</td></tr>
    <tr><td>Mobile empathy</td><td>Push for backgrounded delivery; foreground reconnect</td></tr>
    <tr><td>Backpressure</td><td>Coalesce / drop / buffer named explicitly</td></tr>
    <tr><td>Security</td><td>TLS, Origin header, per-channel auth, rate limit</td></tr>
    <tr><td>Cost awareness</td><td>TURN bandwidth; pub/sub volume</td></tr>
    <tr><td>Restraint</td><td>Picks SSE or polling when WS isn't needed</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN has good WebSocket and SSE polyfills (<code>react-native-event-source</code>, native <code>WebSocket</code>); WebRTC via <code>react-native-webrtc</code>.</li>
  <li>Push: <code>@react-native-firebase/messaging</code> for FCM (Android + iOS); APNs token capture via Firebase or directly.</li>
  <li>Background fetch: limited; use push (data-only on iOS, notification on Android) for wake-ups.</li>
  <li>iOS PushKit (VoIP push) has its own rules — can wake app for incoming calls reliably; abuse → app rejection.</li>
  <li>Sockets must be torn down on background and rebuilt on foreground; tracking app state via <code>AppState</code> in RN.</li>
  <li>Battery: aggressive heartbeats drain. Tune to 30–60s; rely on TCP keep-alive + OS network changes for liveness.</li>
  <li>Cellular costs: minimise message size; binary frames where bandwidth is dear (CBOR, Protobuf).</li>
</ul>

<h3>Deep questions interviewers ask</h3>
<ul>
  <li><em>"How do you guarantee message ordering after reconnect?"</em> — Server-assigned monotonic sequence IDs; client requests <code>?since=&lt;n&gt;</code>; server replays from buffer.</li>
  <li><em>"What happens if the buffer rolled past my last seen?"</em> — Fall back to "fetch full state, then resume live." Document the buffer retention SLA.</li>
  <li><em>"How do you prevent abuse on a public WebSocket?"</em> — Origin check, per-socket rate limit, message size cap, channel-level auth, audit log.</li>
  <li><em>"How does presence handle multiple tabs?"</em> — Track per-connection state; user is "online" if any connection is alive. UI shows "online" with a fudge factor (last 30s).</li>
  <li><em>"How do you scale to 1M concurrent connections?"</em> — Many instances behind L4 LB; Redis Cluster or NATS for fanout; sticky sessions optional; horizontal scale on connection count, not just CPU.</li>
  <li><em>"Why not use HTTP/2 server push?"</em> — Browsers deprecated it; SSE + WebSocket cover the same use cases more reliably.</li>
  <li><em>"How do you A/B test transports?"</em> — Feature flag at connect time; route a fraction of users through alternate path; compare error / latency dashboards.</li>
</ul>

<h3>"What I'd do day one prepping realtime"</h3>
<ul>
  <li>Memorise the decision tree.</li>
  <li>Build a tiny chat app with WebSocket + Redis Pub/Sub + sequence catch-up.</li>
  <li>Build a tiny dashboard with SSE.</li>
  <li>Read about LiveKit / mediasoup for SFU; even at high level it changes how you think about WebRTC group calls.</li>
  <li>Practice the 5-step framework on 5 prompts.</li>
  <li>Memorise reconnect / backoff / jitter / heartbeat numbers (30s WS, 15s SSE, 500ms→30s backoff with 30% jitter).</li>
</ul>

<h3>"If I had more time" closers (for prep itself)</h3>
<ul>
  <li>"Read 'Designing Data-Intensive Applications' chapter on stream processing for the theory."</li>
  <li>"Build a WebRTC 1:1 + signalling end-to-end once — demystifies all the SDP / ICE jargon."</li>
  <li>"Explore WebTransport — likely the future of low-latency browser realtime."</li>
  <li>"Compare Phoenix Channels (Elixir), ActionCable (Rails), Apollo subscriptions, tRPC subs — different ecosystems hit the same problems."</li>
</ul>
`
    }
  ]
});
