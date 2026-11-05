window.PREP_SITE.registerTopic({
  id: "api-websockets",
  module: "api-design",
  title: "WebSockets Deep",
  estimatedReadTime: "38 min",
  tags: ["websockets","realtime","rfc6455","socket.io","scaling","backpressure","api-gateway","node"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">A WebSocket is an HTTP upgrade into an ordered, full-duplex frame pipe <strong>pinned to one server process</strong> — auth, heartbeats, acks, ordering across reconnects, fanout and backpressure are all application protocol you design on top.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Handshake:</strong> an ordinary HTTP/1.1 <code>GET</code> + <code>Upgrade: websocket</code> → <code>101 Switching Protocols</code> (RFC 6455). <code>Sec-WebSocket-Accept</code> = base64(SHA-1(key + fixed GUID)) — proves WebSocket support, not identity.</li>
    <li><strong>Any non-101 = failure</strong>, shown in the browser only as <code>onclose(1006)</code> with no reason — debug with <code>curl -i</code> / <code>wscat</code>.</li>
    <li><strong>Frames:</strong> FIN, RSV1 (deflate), 4-bit opcode (text 0x1, binary 0x2, close 0x8, ping 0x9, pong 0xA), MASK, 7/16/64-bit length. Overhead 2 B server→client, 6 B client→server.</li>
    <li><strong>Client frames are masked</strong> to protect intermediaries from cache poisoning — not for confidentiality; that's <code>wss://</code>.</li>
    <li><strong>Close codes:</strong> 1000 normal, 1001 going away, 1006 abnormal (local only), 1008 policy, 1009 too big, 1011 internal, 1012/1013 restart/try later, 4000–4999 yours. Branch reconnect policy on the code.</li>
    <li><strong>Heartbeats are asymmetric:</strong> server pings (browsers auto-pong), but browser JS can't ping, so add an app-level ping for client-side half-open detection. Interval &lt; smallest idle timeout; reap with <code>terminate()</code>.</li>
    <li><strong>Auth at upgrade:</strong> no custom headers in the browser API → single-use ticket (~30 s TTL) or cookie + <code>Origin</code> allowlist (else CSWSH). Authorise every subscription; close at token expiry (4001).</li>
    <li><strong>Ordering:</strong> TCP orders one connection only. Use per-channel <code>seq</code> from one sequencer, resume with <code>sinceSeq</code>, <code>reset</code> + snapshot if outside retention.</li>
    <li><strong>Delivery:</strong> request ids + acks + resend, and <code>clientMsgId</code> with a unique constraint → effectively-once.</li>
    <li><strong>Backpressure:</strong> <code>send()</code> buffers forever; watch <code>bufferedAmount</code>, drop/coalesce ephemeral messages, close slow consumers (1013), cap <code>maxPayload</code> (ws default 100 MiB), rate-limit inbound.</li>
    <li><strong>Scale:</strong> thin gateways + local channel index + pub/sub backbone; presence/resume state in Redis or a log. Sticky sessions only for Socket.IO polling.</li>
    <li><strong>Infra timeouts:</strong> ALB 60 s idle default, nginx <code>proxy_read_timeout</code> 60 s, Cloudflare ~100 s, GCP backend timeout = max lifetime. Regular disconnect period → timeout.</li>
    <li><strong>Deploys:</strong> fail readiness, close in batches with 1012, jittered client reconnect, grace period &gt; drain time.</li>
    <li><strong>API Gateway WS:</strong> <code>$connect</code>/<code>$disconnect</code>/<code>$default</code> + custom routes, auth on connect only, connection ids in DynamoDB, push via <code>PostToConnection</code>, 410 = dead; ~2 h max lifetime, 10 min idle (verify current quotas).</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Treating "it's TCP" as a delivery guarantee</strong> and putting state, rooms or presence in one node's memory. A Wi-Fi drop loses in-flight messages in both directions, the reconnect may land on another node, and in-memory rooms silently drop messages for users on other nodes. Fix: sequence numbers + resume + idempotent publishes, and a pub/sub backbone with state in a shared store.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"RFC 6455 gives me an ordered byte pipe and nothing else — acks, resume, auth, fanout and backpressure are an application protocol I design, and every scaling decision follows from the connection being pinned to one process."</div>
  <div class="revision-say">"Browsers can't set headers on a WebSocket, so I authenticate at the upgrade with a single-use ticket or a cookie plus an Origin allowlist, then authorise every subscription and close the socket when the token expires."</div>
  <div class="revision-say">"If connections drop on an exact period, I look for an idle timeout on the path — ALB and nginx both default to 60 seconds — and heartbeat from both sides at about half the smallest timeout."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What a WebSocket is</h3>
<p>Standardised as <strong>RFC 6455</strong> (2011). URL schemes <code>ws://</code> (port 80) and <code>wss://</code> (port 443, over TLS). It deliberately starts life as HTTP so it can traverse the same ports, proxies and load balancers as normal web traffic, then switches to its own lightweight framing. After the switch there are no headers per message — a small server-to-client message costs 2 bytes of framing, a client-to-server message 6 bytes (2 + a 4-byte mask key).</p>

<h3>Why it exists</h3>
<p>Before WebSockets, "server push" in browsers meant polling or long polling: a full HTTP request per update, hundreds of bytes of headers, and a round-trip of latency. WebSockets give you a persistent, bidirectional channel with single-digit-millisecond added latency once open. If you only need server → client, SSE is usually simpler — the full decision tree (polling vs SSE vs WebSocket vs WebRTC vs push) is in <a href="#/topic/api-realtime">Realtime Decision Tree</a>. This topic assumes you have already chosen WebSockets.</p>

<h3>What the protocol does NOT give you</h3>
<p>This table is the heart of the topic. Interviewers love "what would you have to build?"</p>
<table>
  <thead><tr><th>You might assume…</th><th>Reality</th><th>What you build</th></tr></thead>
  <tbody>
    <tr><td>Messages are acknowledged</td><td>No app-level acks. TCP acks bytes to the kernel, not to the other app.</td><td>Message ids + explicit <code>ack</code> messages + resend on timeout</td></tr>
    <tr><td>Reconnects automatically</td><td>Browser API never reconnects</td><td>Backoff + jitter reconnect loop (see <a href="#/topic/api-realtime">api-realtime</a>)</td></tr>
    <tr><td>Messages arrive in order</td><td>Only within one connection's lifetime</td><td>Per-channel sequence numbers + resume from last seq</td></tr>
    <tr><td>Request/response</td><td>Fire-and-forget frames, no correlation</td><td>A request <code>id</code> echoed in the reply</td></tr>
    <tr><td>Auth / permissions</td><td>None beyond the HTTP upgrade request</td><td>Authenticate at upgrade, authorise per subscription/message</td></tr>
    <tr><td>Rooms / topics / broadcast</td><td>None — one socket is one pipe</td><td>Subscription registry + pub/sub backbone</td></tr>
    <tr><td>Dead-peer detection</td><td>Ping/pong frames exist, but you must send them; browser JS cannot send pings</td><td>Server ping loop + app-level heartbeat from the client</td></tr>
    <tr><td>Flow control</td><td><code>send()</code> buffers without limit</td><td>Watch <code>bufferedAmount</code>; drop, coalesce or disconnect</td></tr>
  </tbody>
</table>

<h3>Where a full-stack / FDE engineer meets it</h3>
<ul>
  <li><strong>Product realtime:</strong> chat, notifications, collaborative editing, live dashboards, presence.</li>
  <li><strong>Device fleets:</strong> kiosks and meeting-room tablets that must reflect a booking change within a second or two.</li>
  <li><strong>LLM / voice APIs:</strong> provider realtime APIs (e.g. OpenAI's Realtime API) use a WebSocket session with a JSON event protocol — exactly the "application protocol over frames" model below.</li>
  <li><strong>Customer integrations:</strong> exchanges, trading feeds, IoT gateways and some CRMs expose WebSocket streams you have to consume reliably.</li>
</ul>

<h3>The library / platform landscape (Node-centric)</h3>
<table>
  <thead><tr><th>Option</th><th>What it is</th><th>Pick it when</th></tr></thead>
  <tbody>
    <tr><td><code>ws</code></td><td>Bare RFC 6455 server + client for Node. Fast, small, no opinions.</td><td>You want control and will write the app protocol yourself</td></tr>
    <tr><td>Socket.IO</td><td>Its own protocol (Engine.IO) over WebSocket with long-polling fallback, rooms, acks, reconnection, adapters</td><td>Product team wants batteries included; you control both client and server</td></tr>
    <tr><td>uWebSockets.js</td><td>C++ server with JS bindings; very high connection density</td><td>Hundreds of thousands of connections per box; you accept a less conventional API</td></tr>
    <tr><td>NestJS gateways</td><td><code>@WebSocketGateway</code> on top of Socket.IO or <code>ws</code> adapters</td><td>Your backend is already NestJS — reuse guards, pipes, DI</td></tr>
    <tr><td>API Gateway WebSocket APIs</td><td>AWS holds connections, invokes Lambda per route</td><td>Serverless shop, spiky or modest traffic, no servers to babysit</td></tr>
    <tr><td>Managed pub/sub (Pusher, Ably, etc.)</td><td>Hosted connection layer + channels + presence</td><td>Time-to-market beats per-message cost; compliance allows a third party</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Letters vs a phone call</h3>
<p>HTTP is letters: each request is self-contained, any server can answer it, and the load balancer can send consecutive letters to different servers. A WebSocket is a phone call: once connected, the line is pinned to <strong>one process on one machine</strong> until it hangs up. Almost every hard WebSocket question — scaling, deploys, fanout, failover — is a consequence of that pinning.</p>

<h3>The connection lifecycle</h3>
<div class="diagram">
<pre>
 Client                                              Server
   │── TCP SYN / SYN-ACK / ACK ──────────────────────►│   1 RTT
   │── TLS handshake (wss) ──────────────────────────►│   1 RTT (TLS 1.3)
   │── GET /ws  Upgrade: websocket ──────────────────►│   auth happens HERE
   │◄───────────────── 101 Switching Protocols ───────│   (or 401/403 and close)
   │                                                  │
   │◄════════ frames (text/binary/ping/pong) ════════►│   full duplex, no headers
   │                                                  │
   │── CLOSE (1000 "bye") ───────────────────────────►│
   │◄──────────────────────────────── CLOSE (1000) ───│   echo
   │◄──────────────────────────────── TCP FIN ────────│   server closes TCP first
</pre>
</div>

<h3>Three layers you own</h3>
<div class="diagram">
<pre>
 ┌────────────────────────────────────────────────────────────┐
 │ 3. APPLICATION PROTOCOL  (you design this)                 │
 │    envelope {type, id, seq, channel, data}, acks, errors,   │
 │    subscribe/unsubscribe, resume-from-seq, versioning       │
 ├────────────────────────────────────────────────────────────┤
 │ 2. SESSION  (you implement this)                           │
 │    auth at upgrade, token expiry, heartbeats, reconnect,   │
 │    backpressure, rate limits, graceful close               │
 ├────────────────────────────────────────────────────────────┤
 │ 1. TRANSPORT  (RFC 6455 — the library does this)           │
 │    handshake, frames, masking, fragmentation, ping/pong,   │
 │    close codes, permessage-deflate                         │
 └────────────────────────────────────────────────────────────┘
</pre>
</div>
<p>Socket.IO is essentially a pre-built layer 2 + a generic layer 3. With <code>ws</code> you write both yourself.</p>

<h3>The scaled-out picture</h3>
<div class="diagram">
<pre>
  clients ──► LB (L4 or L7, idle timeout!) ──► gateway-1  [sockets: u1,u7,u9]
                                          ├─► gateway-2  [sockets: u2,u3]
                                          └─► gateway-3  [sockets: u4,u5,u6]
                                                 ▲    │
                                    subscribe    │    │  publish
                                                 │    ▼
                                 ┌───────────────────────────────┐
                                 │ pub/sub backbone (Redis/NATS) │
                                 └───────────────────────────────┘
                                                 ▲
                         domain services publish │ (booking changed, msg sent)
                                                 │
                                       booking-svc / chat-svc
</pre>
</div>
<ul>
  <li><strong>Gateways are dumb and stateless-ish:</strong> they hold sockets and subscriptions, nothing else. Business logic lives in services that publish events.</li>
  <li><strong>Every gateway subscribes</strong> to the channels its local sockets care about and forwards to them.</li>
  <li><strong>State that must survive a reconnect</strong> (messages, presence, last seq) lives in a store, never only on the socket object.</li>
</ul>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"It's TCP, so messages can't be lost." TCP guarantees in-order delivery <em>while the connection lives</em>. When a phone switches from Wi-Fi to 4G, everything in the kernel send buffer, the proxy's buffer and in flight is gone — in both directions — and neither side is told which messages made it. Reliability across reconnects is always an application-level design.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. The opening handshake</h3>
<pre><code class="language-text">GET /ws?ticket=6f1c... HTTP/1.1
Host: rt.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
Origin: https://app.example.com
Sec-WebSocket-Protocol: bookings.v2, bookings.v1
Sec-WebSocket-Extensions: permessage-deflate; client_max_window_bits

HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
Sec-WebSocket-Protocol: bookings.v2</code></pre>
<ul>
  <li><strong><code>Sec-WebSocket-Key</code></strong>: 16 random bytes, base64. The server appends the fixed GUID <code>258EAFA5-E914-47DA-95CA-C5AB0DC85B11</code>, SHA-1 hashes it and base64-encodes the result into <code>Sec-WebSocket-Accept</code>. This proves the server <em>speaks WebSocket</em> (a plain HTTP server or cache cannot accidentally produce it). It is <strong>not</strong> security — anyone can compute it.</li>
  <li><strong><code>Origin</code></strong>: set by browsers, not by native apps or curl. It is your defence against Cross-Site WebSocket Hijacking when you use cookies (see Auth below).</li>
  <li><strong><code>Sec-WebSocket-Protocol</code></strong>: subprotocol negotiation. The client offers a list; the server must echo exactly one or omit the header. Use it to version your application protocol (<code>bookings.v2</code>).</li>
  <li><strong>Anything other than 101 is a failure.</strong> The browser hides the status: you get <code>onerror</code> then <code>onclose</code> with code <code>1006</code> and no reason. Debug the handshake with <code>wscat</code>/<code>curl</code>, not the browser console.</li>
</ul>
<pre><code class="language-ts">import { createHash } from 'node:crypto';

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

export function acceptFor(secWebSocketKey: string): string {
  return createHash('sha1').update(secWebSocketKey + WS_GUID).digest('base64');
}

acceptFor('dGhlIHNhbXBsZSBub25jZQ=='); // 's3pPLMBiTxaQ9kYGzzhZRbK+xOo=' (the RFC example)</code></pre>

<h3>2. Frame anatomy</h3>
<div class="diagram">
<pre>
  byte 0                byte 1               bytes 2..
 ┌─┬─┬─┬─┬───────┐   ┌─┬─────────────┐   ┌──────────────────────┬──────────────┬─────────┐
 │F│R│R│R│opcode │   │M│ payload len │   │ ext. length 0/2/8 B  │ mask key 0/4 │ payload │
 │I│S│S│S│ 4 bit │   │A│   7 bit     │   │ (if len = 126 / 127) │ (if MASK=1)  │         │
 │N│1│2│3│       │   │S│             │   │                      │              │         │
 └─┴─┴─┴─┴───────┘   └─┴─────────────┘   └──────────────────────┴──────────────┴─────────┘
  FIN=1 → last fragment of a message     len 0–125 inline · 126 → 16-bit · 127 → 64-bit
  RSV1 → set by permessage-deflate       MASK must be 1 client→server, 0 server→client
</pre>
</div>
<table>
  <thead><tr><th>Opcode</th><th>Meaning</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td><code>0x0</code></td><td>Continuation</td><td>Follows a text/binary frame with FIN=0</td></tr>
    <tr><td><code>0x1</code></td><td>Text</td><td>Payload must be valid UTF-8 or the peer closes with 1007</td></tr>
    <tr><td><code>0x2</code></td><td>Binary</td><td>Arbitrary bytes (protobuf, MessagePack, audio chunks)</td></tr>
    <tr><td><code>0x8</code></td><td>Close</td><td>Optional 2-byte code + UTF-8 reason</td></tr>
    <tr><td><code>0x9</code></td><td>Ping</td><td>Peer must answer with a pong carrying the same payload</td></tr>
    <tr><td><code>0xA</code></td><td>Pong</td><td>May also be sent unsolicited as a one-way heartbeat</td></tr>
  </tbody>
</table>
<ul>
  <li><strong>Control frames</strong> (close/ping/pong) have payloads of at most 125 bytes, can't be fragmented, and <em>may be interleaved</em> between fragments of a large data message — so a ping isn't stuck behind a 50 MB upload.</li>
  <li><strong>Fragmentation</strong> lets a sender stream a message of unknown size. Libraries reassemble for you; your <code>maxPayload</code> limit applies to the reassembled message.</li>
  <li><strong>Why clients mask:</strong> a 4-byte random key XORs every payload byte. It exists to stop an attacker's page from writing predictable bytes onto the wire that a broken transparent proxy might interpret as an HTTP request and cache (cache poisoning). It is <em>not</em> encryption — use <code>wss://</code> for confidentiality. Servers must reject unmasked client frames; servers must not mask.</li>
</ul>

<h3>3. The close handshake and close codes</h3>
<p>Either side sends a close frame; the other echoes it; then the <em>server</em> closes TCP (so the server, not the client, holds the TIME_WAIT state). A connection that dies without a close frame is reported locally as <code>1006</code> — that code is never sent on the wire.</p>
<table>
  <thead><tr><th>Code</th><th>Name</th><th>When you'll see / send it</th></tr></thead>
  <tbody>
    <tr><td>1000</td><td>Normal closure</td><td>Logout, user navigated away cleanly</td></tr>
    <tr><td>1001</td><td>Going away</td><td>Server shutting down, browser tab closing</td></tr>
    <tr><td>1002</td><td>Protocol error</td><td>Unmasked client frame, bad opcode</td></tr>
    <tr><td>1003</td><td>Unsupported data</td><td>Binary sent to a text-only endpoint</td></tr>
    <tr><td>1006</td><td>Abnormal (local only)</td><td>Network drop, LB idle kill, failed handshake — no close frame received</td></tr>
    <tr><td>1007</td><td>Invalid payload</td><td>Non-UTF-8 text frame</td></tr>
    <tr><td>1008</td><td>Policy violation</td><td>Auth expired, rate limit exceeded, forbidden subscription</td></tr>
    <tr><td>1009</td><td>Message too big</td><td>Exceeded the server's <code>maxPayload</code></td></tr>
    <tr><td>1011</td><td>Internal error</td><td>Unhandled server exception</td></tr>
    <tr><td>1012 / 1013</td><td>Service restart / Try again later</td><td>Deploy drain / overload shedding (IANA-registered additions)</td></tr>
    <tr><td>4000–4999</td><td>Private use</td><td>Your own: <code>4001 token_expired</code>, <code>4003 forbidden</code>, <code>4009 replaced_by_new_session</code></td></tr>
  </tbody>
</table>
<p>Design rule: the client's reconnect policy should branch on the code. <code>4001</code> → refresh the token then reconnect; <code>4003</code> → don't retry; <code>1012/1013</code> → reconnect after a jittered delay; <code>1006</code> → standard backoff.</p>

<h3>4. Heartbeats: who pings whom</h3>
<p>The intervals and "why" are covered in <a href="#/topic/api-realtime">api-realtime</a>; the deeper detail interviewers probe is <em>asymmetry</em>:</p>
<ul>
  <li><strong>Browsers answer server pings automatically</strong>, but browser JavaScript can neither send a ping frame nor observe a pong. So the server can detect a dead client with protocol pings, but the <em>client</em> cannot detect a dead server that way.</li>
  <li><strong>Therefore you need both:</strong> server-side protocol pings (cheap, handled in the library) to reap dead clients, and an application-level <code>{"type":"ping"}</code> / <code>{"type":"pong"}</code> from the client so it can notice a half-open connection and reconnect.</li>
  <li><strong>Interval rule:</strong> heartbeat period &lt; the smallest idle timeout on the path (LB, proxy, carrier NAT). With an ALB at 60 s, a 25–30 s heartbeat leaves margin for one lost beat.</li>
  <li><strong>Reap with <code>terminate()</code>, not <code>close()</code>:</strong> <code>close()</code> starts a polite handshake that a dead peer will never complete; <code>terminate()</code> destroys the socket immediately.</li>
  <li>TCP keepalive is not a substitute: Linux defaults to the first probe after 2 hours of idleness.</li>
</ul>
<pre><code class="language-ts">import { WebSocketServer, WebSocket } from 'ws';

type LiveSocket = WebSocket &amp; { isAlive?: boolean };

export function startReaper(wss: WebSocketServer, everyMs = 30_000) {
  wss.on('connection', (ws: LiveSocket) =&gt; {
    ws.isAlive = true;
    ws.on('pong', () =&gt; { ws.isAlive = true; });
  });

  const timer = setInterval(() =&gt; {
    for (const client of wss.clients as Set&lt;LiveSocket&gt;) {
      if (client.isAlive === false) { client.terminate(); continue; } // missed a whole cycle
      client.isAlive = false;
      client.ping();
    }
  }, everyMs);

  wss.on('close', () =&gt; clearInterval(timer));
}</code></pre>

<h3>5. Authentication at connect</h3>
<p>The browser <code>WebSocket</code> constructor accepts only a URL and subprotocols — <strong>no custom headers</strong>. (React Native's implementation accepts a non-standard third <code>options</code> argument with <code>headers</code>; native clients generally can set headers.) Your options:</p>
<table>
  <thead><tr><th>Approach</th><th>How</th><th>Pros</th><th>Cons</th></tr></thead>
  <tbody>
    <tr><td>Session cookie + Origin allowlist</td><td>Browser sends cookies on the upgrade if same-site; server validates cookie <em>and</em> <code>Origin</code></td><td>No token in URL; reuses web session</td><td>Without the Origin check → CSWSH. Cross-site deployments fight SameSite rules</td></tr>
    <tr><td><strong>Short-lived ticket</strong> (recommended)</td><td>Authenticated <code>POST /ws-ticket</code> returns a random one-time ticket (TTL ~30 s); client connects with <code>?ticket=</code></td><td>Works cross-origin and on mobile; the URL credential is useless after first use, so access logs don't leak a reusable token</td><td>One extra request; needs a shared store (Redis)</td></tr>
    <tr><td>JWT in query string</td><td><code>wss://…?token=eyJ…</code></td><td>Simplest</td><td>Long-lived bearer token lands in LB/proxy access logs and APM traces</td></tr>
    <tr><td>Token in <code>Sec-WebSocket-Protocol</code></td><td>Smuggle the token as a fake subprotocol (Kubernetes has used this trick)</td><td>Not in URL logs</td><td>Hacky; header size limits; you must still echo a real subprotocol</td></tr>
    <tr><td>First-message auth</td><td>Connect unauthenticated, send <code>{type:'auth', token}</code> first</td><td>Token never in URL or headers</td><td>Unauthenticated sockets consume resources — enforce a ~5 s auth deadline</td></tr>
  </tbody>
</table>
<p>Authenticate <strong>before</strong> completing the upgrade, so unauthenticated clients never become sockets. In Node that means handling the HTTP server's <code>upgrade</code> event yourself:</p>
<pre><code class="language-ts">import http from 'node:http';
import { randomBytes } from 'node:crypto';
import express from 'express';
import Redis from 'ioredis';
import { WebSocketServer } from 'ws';

const redis = new Redis(process.env.REDIS_URL!);
const app = express();
const ALLOWED_ORIGINS = new Set(['https://app.example.com']);

// 1. Authenticated HTTP endpoint mints a single-use ticket.
app.post('/ws-ticket', requireSession, async (req, res) =&gt; {
  const ticket = randomBytes(24).toString('base64url');
  const claims = { userId: req.user.id, tenantId: req.user.tenantId, roles: req.user.roles };
  await redis.set('wsticket:' + ticket, JSON.stringify(claims), 'EX', 30);
  res.json({ ticket });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });

// 2. Validate during the upgrade; reject before a socket exists.
server.on('upgrade', async (req, socket, head) =&gt; {
  try {
    const origin = req.headers.origin;
    if (origin &amp;&amp; !ALLOWED_ORIGINS.has(origin)) return reject(socket, 403);

    const url = new URL(req.url ?? '/', 'http://internal');
    const ticket = url.searchParams.get('ticket');
    if (!ticket) return reject(socket, 401);

    const raw = await redis.getdel('wsticket:' + ticket); // single use (Redis 6.2+)
    if (!raw) return reject(socket, 401);
    const claims = JSON.parse(raw);

    wss.handleUpgrade(req, socket, head, (ws) =&gt; wss.emit('connection', ws, req, claims));
  } catch {
    reject(socket, 500);
  }
});

function reject(socket: import('node:stream').Duplex, status: 401 | 403 | 500) {
  const text = { 401: 'Unauthorized', 403: 'Forbidden', 500: 'Internal Server Error' }[status];
  socket.write('HTTP/1.1 ' + status + ' ' + text + '\\r\\nConnection: close\\r\\n\\r\\n');
  socket.destroy();
}</code></pre>
<p><strong>Connection auth is not enough.</strong> Every <code>subscribe</code> must be authorised against the resource (<em>may this user watch room 42 in tenant 7?</em>) using the same permission checks as your REST API — see <a href="#/topic/api-auth-rbac">AuthN, AuthZ &amp; RBAC</a>. And because the connection outlives the token, either schedule a server-side close at token expiry (<code>4001</code>) or accept an in-band <code>{type:'reauth', ticket}</code> message that extends it.</p>

<h3>6. Designing the application protocol</h3>
<pre><code class="language-ts">import { z } from 'zod';

// Client → server
export const ClientMsg = z.discriminatedUnion('type', [
  z.object({ type: z.literal('subscribe'),   id: z.string(), channel: z.string(), sinceSeq: z.number().int().optional() }),
  z.object({ type: z.literal('unsubscribe'), id: z.string(), channel: z.string() }),
  z.object({ type: z.literal('publish'),     id: z.string(), channel: z.string(), clientMsgId: z.string().uuid(), body: z.unknown() }),
  z.object({ type: z.literal('ping'),        id: z.string() }),
]);
export type ClientMsg = z.infer&lt;typeof ClientMsg&gt;;

// Server → client
export type ServerMsg =
  | { type: 'ack';   id: string; seq?: number }                 // reply to a client request id
  | { type: 'error'; id?: string; code: 'forbidden' | 'bad_request' | 'rate_limited'; message: string }
  | { type: 'event'; channel: string; seq: number; event: string; data: unknown }
  | { type: 'reset'; channel: string; reason: 'gap_too_large' } // client must refetch snapshot
  | { type: 'pong';  id: string };</code></pre>
<ul>
  <li><strong><code>id</code></strong> correlates a request with its <code>ack</code>/<code>error</code> — WebSockets have no request/response semantics otherwise.</li>
  <li><strong><code>seq</code></strong> is a per-channel, gap-free, monotonically increasing number assigned by the server; the client tracks the last seq per channel for resume.</li>
  <li><strong><code>clientMsgId</code></strong> makes client publishes idempotent: a resend after a lost ack must not create a duplicate chat message or booking.</li>
  <li><strong>Version the protocol</strong> via subprotocol (<code>bookings.v2</code>) or a <code>v</code> field, and only make additive changes within a version — old mobile builds live for years.</li>
</ul>

<h3>7. Ordering and acknowledgements</h3>
<table>
  <thead><tr><th>Layer</th><th>Ordering guarantee</th></tr></thead>
  <tbody>
    <tr><td>One WebSocket connection</td><td>Total order of frames, both directions (TCP)</td></tr>
    <tr><td>Across a reconnect</td><td>None — in-flight data is lost and the new connection may land on another node</td></tr>
    <tr><td>Two publishers to one channel</td><td>None — two gateway nodes publishing to Redis race each other</td></tr>
    <tr><td>Redis Pub/Sub, single publisher</td><td>Delivered in publish order to connected subscribers; nothing stored for disconnected ones</td></tr>
  </tbody>
</table>
<p>The robust recipe: <strong>a single sequencer per channel</strong> (a Postgres row lock, a Redis <code>INCR</code>, or a Kafka partition) assigns <code>seq</code> when the event is persisted; gateways forward in seq order; clients detect gaps (<code>seq != last + 1</code>) and resume. For client → server publishes, the server persists with a unique <code>(channel, client_msg_id)</code>, acks with the assigned seq, and the client resends unacked messages after a timeout. This is <em>at-least-once delivery + idempotent receiver = effectively-once</em>, the same idea as consumers in <a href="#/topic/be-queues">Queues &amp; Streaming</a>.</p>

<h3>8. Backpressure and flow control</h3>
<p>In Node <code>ws</code> and the browser, <code>send()</code> returns immediately and queues data in user-space; <code>bufferedAmount</code> tells you how many bytes are waiting. A client on a bad 3G link that receives a 200 msg/s market feed will grow that buffer until the server runs out of memory — one slow consumer can take down a node serving 50,000 healthy ones.</p>
<pre><code class="language-ts">const HIGH_WATER = 1 * 1024 * 1024;   // 1 MB queued for one client
const HARD_LIMIT = 8 * 1024 * 1024;   // give up on this client

export function sendWithBackpressure(ws: WebSocket, msg: ServerMsg, droppable: boolean): void {
  if (ws.readyState !== WebSocket.OPEN) return;
  if (ws.bufferedAmount &gt; HARD_LIMIT) {
    metrics.increment('ws.slow_consumer_disconnect');
    ws.close(1013, 'slow consumer');       // client reconnects and resumes from last seq
    return;
  }
  if (droppable &amp;&amp; ws.bufferedAmount &gt; HIGH_WATER) {
    metrics.increment('ws.dropped_droppable');
    return;                                 // e.g. cursor positions, typing indicators
  }
  ws.send(JSON.stringify(msg));
}</code></pre>
<ul>
  <li><strong>Classify messages:</strong> state-bearing (bookings, chat) must not be dropped — they can be recovered via resume; ephemeral (cursors, typing, presence pings) can be dropped or coalesced (send only the latest value every 100 ms).</li>
  <li><strong>Inbound flood:</strong> set <code>maxPayload</code> (the <code>ws</code> default is 100 MiB — far too high for chat), rate-limit messages per socket with a token bucket, close with <code>1008</code> on abuse.</li>
  <li><strong>Browser receive side has no backpressure</strong> in the classic API — messages are pushed into your <code>onmessage</code> as fast as they arrive. The newer streams-based <code>WebSocketStream</code> API addresses this but browser support is limited (check current status).</li>
</ul>

<h3>9. Compression (permessage-deflate)</h3>
<p>Negotiated via <code>Sec-WebSocket-Extensions</code>; sets RSV1 on compressed frames. JSON compresses well (often 60–80% smaller), but each connection with context takeover keeps zlib state in memory, and compression costs CPU on every message. The <code>ws</code> library leaves it <strong>off by default on the server</strong> and its docs warn about memory and performance costs under concurrency. Sensible default: off; if your payloads are large text, enable it with a size threshold (e.g. only compress messages over 1 KB). For high-volume feeds, a compact binary encoding (MessagePack, protobuf) usually beats deflate on both CPU and bytes.</p>

<h3>10. Scaling out</h3>
<ul>
  <li><strong>Per-node capacity:</strong> raise the file-descriptor limit (many Linux defaults are 1,024; set <code>LimitNOFILE</code> to hundreds of thousands), budget memory per connection (a few KB for the socket plus your per-connection state and send buffers — tens of KB is a safe planning number), and measure. 10k–50k connections per Node process is routine; beyond that, connection density favours uWebSockets.js or a managed layer.</li>
  <li><strong>Fanout:</strong> each node subscribes to the backbone for channels its sockets use (Redis Pub/Sub sketch in <a href="#/topic/api-realtime">api-realtime</a>). Keep a local index <code>channel → Set&lt;socket&gt;</code>; never iterate all sockets per message.</li>
  <li><strong>Presence:</strong> store in Redis with expiry (e.g. a sorted set of <code>userId → lastHeartbeat</code>), not in node memory — a node crash would otherwise leave users "online" forever.</li>
  <li><strong>Sticky sessions</strong> pin a client to the same node across <em>HTTP requests</em>. Raw WebSockets don't need them: the upgrade and all frames already travel on one TCP connection. Socket.IO <em>does</em> need them when long-polling is enabled, because its handshake and subsequent polling requests are separate HTTP requests that must reach the node holding the session. Using <code>transports: ['websocket']</code> removes that need (and the fallback).</li>
  <li><strong>Graceful deploys:</strong> on <code>SIGTERM</code>: fail the readiness probe so the LB stops routing new upgrades, close existing sockets with <code>1012</code> in batches over 30–60 s (not all at once), then exit. Clients reconnect with jitter to the remaining nodes and resume by seq. Without this, a rolling deploy of 10 nodes becomes 10 reconnect storms.</li>
</ul>

<h3>11. Load balancers and proxies</h3>
<table>
  <thead><tr><th>Hop</th><th>Gotcha (defaults at time of writing — check current docs)</th><th>Fix</th></tr></thead>
  <tbody>
    <tr><td>AWS ALB</td><td>Supports WebSockets natively; idle timeout default 60 s (configurable)</td><td>Heartbeat &lt; 60 s or raise the idle timeout</td></tr>
    <tr><td>AWS NLB</td><td>L4 pass-through; TCP idle timeout ~350 s by default</td><td>Heartbeat; terminate TLS on NLB or on the node</td></tr>
    <tr><td>nginx / ingress-nginx</td><td>Needs explicit <code>Upgrade</code>/<code>Connection</code> headers; <code>proxy_read_timeout</code> default 60 s</td><td>Config below; ingress annotation <code>nginx.ingress.kubernetes.io/proxy-read-timeout</code></td></tr>
    <tr><td>Cloudflare</td><td>Proxies WebSockets; closes idle connections after roughly 100 s</td><td>Heartbeat well under that</td></tr>
    <tr><td>Google Cloud external HTTP(S) LB</td><td>The backend service timeout acts as the <em>maximum lifetime</em> of a WebSocket (default 30 s)</td><td>Raise the backend timeout; expect periodic reconnects anyway</td></tr>
    <tr><td>Corporate proxies</td><td>Some strip <code>Upgrade</code> on plain <code>ws://</code> or break it via TLS inspection</td><td>Always <code>wss://</code> on 443; offer an SSE/long-poll fallback</td></tr>
  </tbody>
</table>
<pre><code class="language-text"># nginx: WebSocket-aware reverse proxy
map $http_upgrade $connection_upgrade {
  default upgrade;
  ''      close;
}

upstream ws_gateways {
  server 10.0.1.10:8080;
  server 10.0.1.11:8080;
}

server {
  listen 443 ssl;
  location /ws {
    proxy_pass http://ws_gateways;
    proxy_http_version 1.1;                       # upgrade needs HTTP/1.1
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_read_timeout 3600s;                     # idle limit between frames
    proxy_send_timeout 3600s;
  }
}</code></pre>

<h3>12. Socket.IO vs ws</h3>
<table>
  <thead><tr><th>Concern</th><th><code>ws</code></th><th>Socket.IO</th></tr></thead>
  <tbody>
    <tr><td>Wire protocol</td><td>Plain RFC 6455 — any client works</td><td>Engine.IO/Socket.IO packets on top; needs the Socket.IO client (a plain WebSocket client can't talk to it)</td></tr>
    <tr><td>Fallback</td><td>None</td><td>HTTP long-polling (needs sticky sessions)</td></tr>
    <tr><td>Reconnect</td><td>You write it</td><td>Built in, with backoff</td></tr>
    <tr><td>Rooms / namespaces</td><td>You write it</td><td><code>socket.join(room)</code>, <code>io.to(room).emit()</code></td></tr>
    <tr><td>Acks</td><td>You write it</td><td>Callback acks; <code>socket.timeout(ms).emitWithAck()</code> (v4.6+)</td></tr>
    <tr><td>Multi-node fanout</td><td>You wire Redis/NATS</td><td>Adapters, e.g. <code>@socket.io/redis-adapter</code></td></tr>
    <tr><td>Missed-message recovery</td><td>You write it (seq + resume)</td><td>"Connection state recovery" — short window, only with certain adapters</td></tr>
    <tr><td>Overhead</td><td>Minimal</td><td>Extra framing and client bundle; fine for most apps</td></tr>
    <tr><td>Interop (IoT, 3rd-party, other languages)</td><td>Excellent</td><td>Needs a Socket.IO client library in that language</td></tr>
  </tbody>
</table>
<p>Rule of thumb: <strong>Socket.IO</strong> for a product app where you own both ends and want rooms/acks/reconnect today; <strong><code>ws</code></strong> (or uWebSockets.js) for public APIs, non-JS clients, very high connection counts, or when you need precise control of the protocol.</p>

<h3>13. API Gateway WebSocket APIs (AWS)</h3>
<div class="diagram">
<pre>
 client ══ wss ══► API Gateway (holds the TCP/TLS connection, assigns connectionId)
                      │ $connect     ──► Lambda: auth (authorizer) + store connectionId
                      │ $disconnect  ──► Lambda: delete connectionId (best effort!)
                      │ sendMessage  ──► Lambda: business logic  (route chosen by
                      │ $default     ──► Lambda: fallback          $request.body.action)
                      ▼
 any backend ──► POST @connections/{connectionId}  (ApiGatewayManagementApi)
                 410 Gone → connection is dead → delete it from your table
</pre>
</div>
<ul>
  <li><strong>Routing:</strong> a <em>route selection expression</em> such as <code>$request.body.action</code> picks the route from each JSON message.</li>
  <li><strong>Auth:</strong> authorizers run only on <code>$connect</code> (Lambda REQUEST authorizer or IAM). Browsers still can't send headers, so pass a ticket/token in the query string. Whatever the authorizer returns as context is available to later routes.</li>
  <li><strong>State:</strong> you keep <code>connectionId → userId / subscriptions</code> in DynamoDB (with a TTL) because API Gateway only knows connection ids.</li>
  <li><strong>Limits to know</strong> (at time of writing — verify against current quotas): maximum connection duration 2 hours, idle timeout 10 minutes, message payload 128 KB (sent as frames of up to 32 KB), and a per-account rate of new connections. Clients must reconnect at least every 2 hours regardless.</li>
  <li><strong>Cost model:</strong> billed per message and per connection-minute. Cheap at low/spiky volume; a chatty, always-on fleet can cost more than a few containers.</li>
  <li><strong>Fanout is your loop:</strong> broadcasting to 10,000 connections is 10,000 <code>PostToConnection</code> calls. Batch with concurrency limits, or move to a self-hosted gateway for big rooms.</li>
</ul>
<p>Deeper API Gateway material (REST vs HTTP APIs, authorizers, throttling) is in <a href="#/topic/cloud-api-gateway">API Gateway</a>.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — Production-shaped <code>ws</code> gateway (rooms, Redis fanout, backpressure, drain)</h3>
<p>Continues from the ticket-auth upgrade handler in Mechanics §5. Business services publish to Redis; this node forwards to local subscribers.</p>
<pre><code class="language-ts">import type { WebSocket } from 'ws';
import Redis from 'ioredis';
import { ClientMsg, type ServerMsg } from './protocol';
import { canSubscribe } from './authz';           // same policy code as the REST API
import { readSince } from './channel-log';        // persisted events by (channel, seq)

type Claims = { userId: string; tenantId: string; roles: string[] };
type Conn = WebSocket &amp; { claims: Claims; channels: Set&lt;string&gt;; isAlive: boolean; bucket: TokenBucket };

const sub = new Redis(process.env.REDIS_URL!);    // subscriber connection (dedicated)
const local = new Map&lt;string, Set&lt;Conn&gt;&gt;();      // channel → sockets on THIS node
let draining = false;

wss.on('connection', (ws: Conn, _req, claims: Claims) =&gt; {
  if (draining) return ws.close(1012, 'restarting');
  ws.claims = claims;
  ws.channels = new Set();
  ws.isAlive = true;
  ws.bucket = new TokenBucket({ capacity: 20, refillPerSec: 10 });

  ws.on('pong', () =&gt; { ws.isAlive = true; });
  ws.on('error', (err) =&gt; log.warn({ err, userId: claims.userId }, 'ws error')); // never leave 'error' unhandled
  ws.on('close', () =&gt; { for (const ch of ws.channels) leave(ws, ch); });

  ws.on('message', async (data, isBinary) =&gt; {
    if (isBinary || !ws.bucket.take()) return ws.close(1008, 'rate limited');
    let msg: ClientMsg;
    try { msg = ClientMsg.parse(JSON.parse(data.toString())); }
    catch { return send(ws, { type: 'error', code: 'bad_request', message: 'invalid message' }); }

    switch (msg.type) {
      case 'ping':
        return send(ws, { type: 'pong', id: msg.id });
      case 'subscribe': {
        if (!(await canSubscribe(ws.claims, msg.channel))) {
          return send(ws, { type: 'error', id: msg.id, code: 'forbidden', message: 'not allowed' });
        }
        await join(ws, msg.channel);
        if (msg.sinceSeq !== undefined) {
          const missed = await readSince(msg.channel, msg.sinceSeq, 500);
          if (missed === 'gap_too_large') send(ws, { type: 'reset', channel: msg.channel, reason: 'gap_too_large' });
          else for (const e of missed) send(ws, { type: 'event', channel: msg.channel, seq: e.seq, event: e.type, data: e.data });
        }
        return send(ws, { type: 'ack', id: msg.id });
      }
      case 'unsubscribe':
        leave(ws, msg.channel);
        return send(ws, { type: 'ack', id: msg.id });
      case 'publish': {
        // Gateways don't own business logic: hand off to the domain service, which persists
        // with a unique (channel, client_msg_id), assigns seq, and publishes to Redis.
        const seq = await chatService.post(ws.claims, msg.channel, msg.clientMsgId, msg.body);
        return send(ws, { type: 'ack', id: msg.id, seq });
      }
    }
  });
});

async function join(ws: Conn, channel: string) {
  let set = local.get(channel);
  if (!set) { set = new Set(); local.set(channel, set); await sub.subscribe('ch:' + channel); }
  set.add(ws); ws.channels.add(channel);
}

function leave(ws: Conn, channel: string) {
  const set = local.get(channel);
  set?.delete(ws); ws.channels.delete(channel);
  if (set &amp;&amp; set.size === 0) { local.delete(channel); void sub.unsubscribe('ch:' + channel); }
}

// Fanout: one Redis message → only the sockets on this node that subscribed.
sub.on('message', (redisChannel: string, raw: string) =&gt; {
  const channel = redisChannel.slice(3);
  const event = JSON.parse(raw) as { seq: number; type: string; data: unknown; ephemeral?: boolean };
  for (const ws of local.get(channel) ?? []) {
    sendWithBackpressure(ws, { type: 'event', channel, seq: event.seq, event: event.type, data: event.data }, !!event.ephemeral);
  }
});

function send(ws: Conn, msg: ServerMsg) { sendWithBackpressure(ws, msg, false); }

// Graceful drain on deploy: stop new upgrades, close in batches with jitter-friendly code.
process.on('SIGTERM', async () =&gt; {
  draining = true;
  readiness.fail();                               // LB stops sending new upgrades
  const all = [...wss.clients] as Conn[];
  const batch = Math.ceil(all.length / 20);
  for (let i = 0; i &lt; all.length; i += batch) {
    for (const ws of all.slice(i, i + batch)) ws.close(1012, 'restarting');
    await new Promise((r) =&gt; setTimeout(r, 1_500)); // ~30 s total for 20 batches
  }
  server.close(() =&gt; process.exit(0));
});</code></pre>

<h3>Example 2 — Client with app-level heartbeat, acks and resume (works in browser and React Native)</h3>
<p>Backoff-with-jitter reconnect is in <a href="#/topic/api-realtime">api-realtime</a>; this adds the parts that make it reliable.</p>
<pre><code class="language-ts">// scheduleReconnect = backoff + jitter helper (see api-realtime); refetchSnapshot = GET the channel's current state.
// React Native: crypto.randomUUID needs a polyfill (e.g. expo-crypto) on older runtimes.
type Pending = { msg: object; timer: ReturnType&lt;typeof setTimeout&gt;; tries: number };

export class ReliableSocket {
  private ws?: WebSocket;
  private lastSeq = new Map&lt;string, number&gt;();     // channel → last applied seq
  private pending = new Map&lt;string, Pending&gt;();     // request id → unacked message
  private heartbeat?: ReturnType&lt;typeof setInterval&gt;;
  private lastPongAt = 0;

  constructor(private getUrl: () =&gt; Promise&lt;string&gt;, private onEvent: (ch: string, ev: string, data: unknown) =&gt; void) {}

  async connect() {
    this.ws = new WebSocket(await this.getUrl());   // getUrl fetches a fresh ticket each time
    this.ws.onopen = () =&gt; {
      this.lastPongAt = Date.now();
      for (const ch of this.lastSeq.keys()) this.request({ type: 'subscribe', channel: ch, sinceSeq: this.lastSeq.get(ch) });
      for (const p of this.pending.values()) this.ws!.send(JSON.stringify(p.msg)); // resend unacked
      this.heartbeat = setInterval(() =&gt; {
        if (Date.now() - this.lastPongAt &gt; 45_000) return this.ws?.close(4000, 'heartbeat timeout'); // half-open
        this.ws?.send(JSON.stringify({ type: 'ping', id: 'hb' }));
      }, 20_000);
    };
    this.ws.onmessage = (e) =&gt; this.handle(JSON.parse(e.data));
    this.ws.onclose = (e) =&gt; {
      clearInterval(this.heartbeat);
      if (e.code === 4003) return;                  // forbidden: don't retry
      scheduleReconnect(() =&gt; this.connect(), e.code === 1012 || e.code === 1013);
    };
  }

  subscribe(channel: string) { this.lastSeq.set(channel, this.lastSeq.get(channel) ?? 0); this.request({ type: 'subscribe', channel }); }

  publish(channel: string, body: unknown) {
    this.request({ type: 'publish', channel, clientMsgId: crypto.randomUUID(), body }); // same clientMsgId on resend
  }

  private request(partial: object) {
    const id = crypto.randomUUID();
    const msg = { ...partial, id };
    const timer = setTimeout(() =&gt; this.retry(id), 5_000);
    this.pending.set(id, { msg, timer, tries: 0 });
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }

  private retry(id: string) {
    const p = this.pending.get(id);
    if (!p) return;
    if (++p.tries &gt; 5) { this.pending.delete(id); return; /* surface failure to UI */ }
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(p.msg));
    p.timer = setTimeout(() =&gt; this.retry(id), 5_000 * 2 ** p.tries);
  }

  private handle(m: any) {
    if (m.type === 'pong') { this.lastPongAt = Date.now(); return; }
    if (m.type === 'ack' || m.type === 'error') {
      const p = this.pending.get(m.id); if (p) { clearTimeout(p.timer); this.pending.delete(m.id); }
      return;
    }
    if (m.type === 'reset') { this.lastSeq.set(m.channel, 0); refetchSnapshot(m.channel); return; }
    if (m.type === 'event') {
      const last = this.lastSeq.get(m.channel) ?? 0;
      if (m.seq &lt;= last) return;                    // duplicate (resume overlap)
      if (m.seq !== last + 1) { this.ws?.close(4000, 'gap'); return; } // reconnect + resume
      this.lastSeq.set(m.channel, m.seq);
      this.onEvent(m.channel, m.event, m.data);
    }
  }
}

// React Native: reconnect on foreground; don't fight the OS in background.
// AppState.addEventListener('change', (s) =&gt; { if (s === 'active') socket.forceReconnect(); });</code></pre>

<h3>Example 3 — NestJS gateway (Socket.IO adapter) with a guard</h3>
<pre><code class="language-ts">import { UseGuards } from '@nestjs/common';
import {
  WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket,
  OnGatewayConnection, WsException,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/rooms', cors: { origin: ['https://app.example.com'] }, transports: ['websocket'] })
export class RoomsGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;

  constructor(private readonly tickets: TicketService, private readonly authz: AuthzService) {}

  async handleConnection(client: Socket) {
    const claims = await this.tickets.redeem(client.handshake.auth?.ticket);
    if (!claims) return client.disconnect(true);
    client.data.claims = claims;
  }

  @UseGuards(WsClaimsGuard)
  @SubscribeMessage('room:subscribe')
  async subscribe(@ConnectedSocket() client: Socket, @MessageBody() body: { roomId: string }) {
    if (!(await this.authz.can(client.data.claims, 'room:view', body.roomId))) {
      throw new WsException('forbidden');
    }
    await client.join('room:' + body.roomId);
    return { ok: true };                       // returned value is sent back as the ack
  }

  // Called by the booking service (via an event listener) after a booking commits.
  broadcastRoomState(roomId: string, state: RoomState) {
    this.server.to('room:' + roomId).emit('room:state', state);
  }
}

// main.ts — multi-node fanout with the Redis adapter
// const pub = createClient({ url: process.env.REDIS_URL }); const subc = pub.duplicate();
// await Promise.all([pub.connect(), subc.connect()]);
// io.adapter(createAdapter(pub, subc));      // from '@socket.io/redis-adapter'</code></pre>

<h3>Example 4 — API Gateway WebSocket API with Lambda + DynamoDB</h3>
<pre><code class="language-ts">import type { APIGatewayProxyWebsocketEventV2 } from 'aws-lambda';
import {
  ApiGatewayManagementApiClient, PostToConnectionCommand, GoneException,
} from '@aws-sdk/client-apigatewaymanagementapi';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.CONNECTIONS_TABLE!;   // pk = connectionId, GSI on roomId

type WsEvent = APIGatewayProxyWebsocketEventV2 &amp; {
  requestContext: { authorizer?: { userId?: string; tenantId?: string } };
};

// $connect — the authorizer already validated the ticket and returned userId/tenantId as context.
export const onConnect = async (event: WsEvent) =&gt; {
  const { connectionId, authorizer } = event.requestContext;
  await ddb.send(new PutCommand({
    TableName: TABLE,
    Item: { connectionId, userId: authorizer?.userId, tenantId: authorizer?.tenantId,
            ttl: Math.floor(Date.now() / 1000) + 2 * 60 * 60 },   // matches the 2h max lifetime
  }));
  return { statusCode: 200 };
};

// $disconnect — best effort; TTL + 410 handling clean up whatever this misses.
export const onDisconnect = async (event: WsEvent) =&gt; {
  await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { connectionId: event.requestContext.connectionId } }));
  return { statusCode: 200 };
};

// Called from the booking service (e.g. an SQS consumer) to push a room update.
export async function broadcastToRoom(roomId: string, payload: unknown, endpoint: string) {
  const api = new ApiGatewayManagementApiClient({ endpoint }); // https://{apiId}.execute-api.{region}.amazonaws.com/{stage}
  const { Items = [] } = await ddb.send(new QueryCommand({
    TableName: TABLE, IndexName: 'byRoom',
    KeyConditionExpression: 'roomId = :r', ExpressionAttributeValues: { ':r': roomId },
  }));
  const data = Buffer.from(JSON.stringify(payload));
  await Promise.allSettled(Items.map(async ({ connectionId }) =&gt; {
    try {
      await api.send(new PostToConnectionCommand({ ConnectionId: connectionId, Data: data }));
    } catch (err) {
      if (err instanceof GoneException) {        // 410: client vanished without $disconnect
        await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { connectionId } }));
      } else throw err;
    }
  }));
}</code></pre>
<p>For large rooms, cap concurrency (e.g. 50 in-flight posts) instead of an unbounded <code>Promise.allSettled</code>, and watch API Gateway throttling. The SQS side of this pipeline is in <a href="#/topic/cloud-sqs">SQS (+ SNS / EventBridge)</a>.</p>

<h3>Example 5 — Design sketch: live status on meeting-room tablets</h3>
<pre><code class="language-text">Requirement: 2,000 wall tablets across 40 offices show "Free / Busy / Ends in 12 min".
A booking made on the web app must appear on the tablet within ~2 s.
Tablets are on flaky office Wi-Fi and get rebooted nightly.

Flow
  web app ──POST /bookings──► booking-svc ──(tx: booking + outbox row)──► Postgres
  outbox relay ──► Redis PUBLISH ch:room:{roomId} { seq, type:'booking.created', data }
  gateway nodes ──► tablets subscribed to room:{roomId}

Connection
  Tablet identity = device credential (not a user) scoped to its one room.
  POST /ws-ticket with the device token → ?ticket=... → subscribe room:{roomId}.

Reliability
  On (re)connect: GET /rooms/{id}/state (snapshot incl. currentSeq) → subscribe sinceSeq=currentSeq.
  App heartbeat 20 s (ALB idle timeout 60 s). Gap in seq → resubscribe with sinceSeq.
  Clock display computed locally from booking start/end; server only pushes changes.

Numbers
  2,000 connections = one small gateway node (run 2 for availability).
  Booking changes ~ a few per second at peak → trivial fanout.
  The hard part is not scale — it is correctness after Wi-Fi drops and reboots.</code></pre>
<p>The booking model, conflict detection and double-booking prevention behind this are in <a href="#/topic/lld-booking-system">Case: Meeting Room Booking</a>.</p>

<h3>Example 6 — Debugging a handshake from the terminal</h3>
<pre><code class="language-bash"># Inspect the handshake: anything but 101 explains the browser's silent 1006
curl -i -N --http1.1 \\
  -H "Connection: Upgrade" -H "Upgrade: websocket" \\
  -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \\
  -H "Origin: https://app.example.com" \\
  "https://rt.example.com/ws?ticket=$TICKET"

# Interactive session
npx wscat -c "wss://rt.example.com/ws?ticket=$TICKET"
&gt; {"type":"subscribe","id":"1","channel":"room:42"}</code></pre>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. The silent 1006</h3>
<p>Failed handshakes (401, 403, 404, 502 from a proxy), LB idle kills and network drops all surface in the browser as <code>onclose</code> with code <code>1006</code> and an empty reason. Log close codes server-side, and reproduce handshakes with <code>curl -i</code> to see the real HTTP status.</p>

<h3>2. Token expires mid-connection</h3>
<p>A 15-minute access token on a connection that lives for 8 hours means a revoked or demoted user keeps receiving data. Close with <code>4001</code> at expiry and let the client reconnect with a fresh ticket, or support in-band <code>reauth</code>. Also push a forced disconnect when a user is deactivated or their role changes.</p>

<h3>3. Permission changes after subscribe</h3>
<p>A user removed from a project is still subscribed to its channel. Either re-check permissions on each forwarded event for sensitive channels, or publish a <code>membership.revoked</code> event that makes gateways drop the subscription.</p>

<h3>4. Mobile backgrounding and network switches</h3>
<p>iOS suspends backgrounded apps; Android Doze defers network. A Wi-Fi → cellular switch changes the client IP, which kills the TCP connection. Reconnect on foreground (<code>AppState</code> in React Native) and on network-change events, and use push notifications for background delivery (see <a href="#/topic/api-realtime">api-realtime</a>).</p>

<h3>5. Multiple tabs, multiple connections</h3>
<p>A user with 12 tabs opens 12 sockets and receives 12 copies of each event. Elect one tab as leader (a <code>SharedWorker</code> or <code>BroadcastChannel</code> plus Web Locks) to own the socket and relay to other tabs. Browsers also cap total WebSocket connections per profile (on the order of a couple of hundred), which a buggy reconnect loop can hit.</p>

<h3>6. Message bigger than <code>maxPayload</code></h3>
<p>The server closes with <code>1009</code>. If the client blindly reconnects and resends, you get an infinite loop. Validate size client-side; send large blobs via presigned upload URLs and send only a reference over the socket.</p>

<h3>7. Invalid UTF-8 in a text frame</h3>
<p>Peers must close with <code>1007</code>. This bites when a client slices a string at a byte boundary or sends binary data with the text opcode. In <code>ws</code> v8 the <code>message</code> event gives a <code>Buffer</code> plus an <code>isBinary</code> flag — call <code>toString()</code> only for text.</p>

<h3>8. Reconnect thundering herd after a deploy or outage</h3>
<p>All clients reconnect simultaneously and each first fetches a snapshot from the database. Jittered backoff on the client, batched drain on the server, rate-limited upgrades with <code>1013</code>, and cached snapshots keep the herd from taking down the next tier.</p>

<h3>9. Resume window has expired</h3>
<p>A tablet offline for 3 days asks for <code>sinceSeq=10234</code> but the channel log only retains 24 hours. Send an explicit <code>reset</code> so the client fetches a fresh snapshot — never silently resume from the oldest available event, which would leave a hole.</p>

<h3>10. Ephemeral port and connection limits at the proxy</h3>
<p>An L7 proxy opens its own upstream connection per client socket. One proxy IP talking to one backend IP:port has roughly 64k source ports, which caps concurrent WebSockets per proxy–backend pair. Add backend ports/IPs or proxy instances, or use L4 pass-through.</p>

<h3>11. Cross-Site WebSocket Hijacking (CSWSH)</h3>
<p>WebSockets are not covered by CORS. If you authenticate with cookies and don't check <code>Origin</code>, any website the user visits can open a socket to your server <em>as the user</em> and read their data. Origin allowlist at the upgrade (or don't use ambient cookies).</p>

<h3>12. HTTP/2 and HTTP/3</h3>
<p>Classic WebSockets need an HTTP/1.1 upgrade, so each socket is its own TCP connection even when the rest of the page uses HTTP/2. RFC 8441 (HTTP/2 extended CONNECT) and RFC 9220 (HTTP/3) define WebSockets over those protocols, but support across browsers, CDNs and servers is uneven — don't assume it.</p>


<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Bug 1 — Unhandled <code>error</code> event crashes the process</h3>
<p>In Node, an <code>EventEmitter</code> that emits <code>'error'</code> with no listener throws. One malformed client frame can take down a node holding 30,000 sockets. Always attach <code>ws.on('error', …)</code> and wrap message handlers in try/catch (a thrown exception inside a listener is just as fatal).</p>

<h3>Bug 2 — Trusting identity fields in messages</h3>
<pre><code class="language-ts">// BAD — the client decides who it is
ws.on('message', (raw) =&gt; {
  const { userId, roomId, text } = JSON.parse(raw.toString());
  chat.post(userId, roomId, text);
});

// GOOD — identity comes from the authenticated connection; resource access is checked
ws.on('message', async (raw) =&gt; {
  const msg = ClientMsg.parse(JSON.parse(raw.toString()));
  if (msg.type !== 'publish') return;
  if (!(await authz.can(ws.claims, 'chat:post', msg.channel))) return sendError(ws, msg.id, 'forbidden');
  await chat.post(ws.claims.userId, msg.channel, msg.clientMsgId, msg.body);
});</code></pre>

<h3>Anti-pattern 3 — Long-lived JWT in the query string</h3>
<p>Query strings end up in LB access logs, CDN logs and APM traces. Use a single-use ticket with a ~30 s TTL, or first-message auth.</p>

<h3>Anti-pattern 4 — In-memory rooms on more than one node</h3>
<p>Works in dev, silently drops ~(N−1)/N of messages in production behind a load balancer. Any time you scale beyond one process you need a pub/sub backbone or an adapter.</p>

<h3>Anti-pattern 5 — Sticky sessions as a replacement for pub/sub</h3>
<p>Stickiness routes one client to one node; it does nothing for user A on node 1 messaging user B on node 2. It is only needed for Socket.IO's polling transport.</p>

<h3>Anti-pattern 6 — Business logic in the gateway</h3>
<p>Gateways that write bookings to the database become a second, untested API with different validation and permissions. Gateways authenticate, route and fan out; domain services own writes, emitted as events.</p>

<h3>Anti-pattern 7 — State only on the socket object</h3>
<p>Draft messages, cursor state, "last seen" — if they only live in <code>ws.someField</code>, they vanish on every reconnect and every deploy. Persist anything that must survive.</p>

<h3>Anti-pattern 8 — Every keystroke as a message</h3>
<p>Typing indicators and cursor moves at 60 Hz × 1,000 room members = 60,000 writes per second. Throttle on the client (e.g. 100–200 ms) and coalesce on the server.</p>

<h3>Anti-pattern 9 — Socket.IO client against a plain <code>ws</code> server (or vice versa)</h3>
<p>Socket.IO is its own protocol; a raw WebSocket client gets garbage and a disconnect. Pick one stack per endpoint and document it for integrators.</p>

<h3>Anti-pattern 10 — No close-code-aware retry</h3>
<p>Reconnecting immediately after <code>4003 forbidden</code> or <code>1009 too big</code> creates a tight loop that hammers auth and fills logs. Branch the retry policy on the close code.</p>

<h3>Anti-pattern 11 — Restarting every node at once</h3>
<p>Killing all gateways simultaneously drops every user and creates a reconnect storm against the database. Roll nodes one at a time with a batched drain.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. What actually happens when a browser runs <code>new WebSocket('wss://rt.example.com/ws')</code>?</div>
  <div class="qa-answer">
    <p>DNS, TCP handshake, TLS handshake, then an HTTP/1.1 <code>GET</code> with <code>Upgrade: websocket</code>, <code>Connection: Upgrade</code>, a random <code>Sec-WebSocket-Key</code>, <code>Sec-WebSocket-Version: 13</code>, the page's <code>Origin</code>, cookies if same-site, and any requested subprotocols. The server validates (auth, Origin), computes <code>Sec-WebSocket-Accept</code> = base64(SHA-1(key + fixed GUID)), and replies <code>101 Switching Protocols</code>. From then on both sides exchange frames — text, binary, ping, pong, close — on the same connection. Any non-101 response becomes an <code>onerror</code> + <code>onclose(1006)</code> with no detail in the browser.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Why must client-to-server frames be masked? Is that a security feature for my data?</div>
  <div class="qa-answer">
    <p>Masking XORs the payload with a random 4-byte key per frame so that a malicious page cannot place attacker-chosen bytes on the wire. The concern was cache poisoning of broken transparent proxies that might parse those bytes as an HTTP request. It protects intermediaries, not your data — the key is sent in the frame. Confidentiality comes from <code>wss://</code> (TLS). Servers reject unmasked client frames with 1002 and never mask their own frames.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. The browser API can't set an Authorization header. How do you authenticate?</div>
  <div class="qa-answer">
    <p>Authenticate at the upgrade, before the socket exists. My default is a short-lived, single-use ticket: the client calls an authenticated <code>POST /ws-ticket</code>, gets a random value stored in Redis with a ~30 s TTL, connects with <code>?ticket=</code>, and the server redeems it atomically (<code>GETDEL</code>). Logged URLs then contain only a dead credential. Alternatives: same-site session cookie plus a strict <code>Origin</code> allowlist (otherwise you're exposed to Cross-Site WebSocket Hijacking), or first-message auth with a short deadline. Then I authorise every subscription against the resource, and handle token expiry — close with a custom 4001 code at expiry or accept an in-band re-auth.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. How would you scale a WebSocket service from 10k to 1M concurrent connections?</div>
  <div class="qa-answer">
    <p>Separate concerns: a fleet of thin gateway nodes that only hold sockets, authenticate and fan out, and domain services that own the logic. Each gateway keeps a local <code>channel → sockets</code> index and subscribes to a pub/sub backbone (Redis Pub/Sub or NATS at moderate scale, sharded Redis or Kafka-backed fanout at large scale). Capacity math: at ~25k connections per Node process and several processes per host, 1M is a few dozen processes — I'd load test to find the real number, tune file descriptors and memory, and watch the backbone, which often saturates before sockets do. Presence and resume state live in Redis or a log, never in node memory. Operationally: heartbeats under LB timeouts, batched drains on deploy, jittered client reconnects and upgrade rate limits to survive reconnect storms. If the team is small and traffic spiky, I'd also price a managed layer (API Gateway WebSockets or a hosted provider) against running it.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Do WebSockets need sticky sessions?</div>
  <div class="qa-answer">
    <p>Raw WebSockets don't: the upgrade request and every subsequent frame ride one TCP connection, which the load balancer already keeps on one backend. Stickiness matters when a "session" spans multiple HTTP requests — classically Socket.IO with the long-polling transport, whose handshake and polls must hit the node holding the session. Either enable stickiness (cookie- or IP-based) or force <code>transports: ['websocket']</code>. And stickiness never replaces pub/sub: users on different nodes still need a backbone to reach each other.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How do you guarantee ordering and delivery over WebSockets?</div>
  <div class="qa-answer">
    <p>TCP only orders bytes within one connection; reconnects lose in-flight data and may land on another node. So: a single sequencer per channel assigns a gap-free <code>seq</code> when the event is persisted; clients track the last applied seq, ignore duplicates (<code>seq &lt;= last</code>), and on a gap or reconnect resubscribe with <code>sinceSeq</code> so the server replays from a retained log; if the gap is outside retention, the server sends a <code>reset</code> and the client refetches a snapshot. For client publishes I use request ids with explicit acks and resends, plus a <code>clientMsgId</code> with a unique constraint server-side so a resend is idempotent. That's at-least-once plus idempotency — "effectively once" — rather than a false promise of exactly-once.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. What is backpressure on a WebSocket server and how do you handle a slow consumer?</div>
  <div class="qa-answer">
    <p><code>send()</code> doesn't block; it queues bytes in user-space, visible as <code>bufferedAmount</code>. A client on a slow link fed a fast stream makes that buffer grow without limit, and a few such clients can OOM a node serving everyone else. I classify messages: ephemeral ones (cursor, typing, ticks) are dropped or coalesced to the latest value above a high-water mark (say 1 MB); state-bearing ones are never silently dropped — if the buffer passes a hard limit I close with 1013 and the client resumes by seq. Inbound, I cap <code>maxPayload</code>, rate-limit per socket with a token bucket and close with 1008 on abuse. I'd also emit metrics on buffered bytes and slow-consumer disconnects.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Socket.IO or <code>ws</code>? Defend your choice.</div>
  <div class="qa-answer">
    <p>For an internal product where we own web and mobile clients and want rooms, acks, reconnection and a Redis adapter on day one, Socket.IO saves weeks and its overhead rarely matters. For a public or partner-facing API, non-JS clients, IoT devices, or very high connection density, I'd use <code>ws</code> or uWebSockets.js, because Socket.IO is its own protocol and forces every integrator to use a Socket.IO client. Either way I'd still design the app protocol — sequence numbers and idempotent publishes — because Socket.IO's acks and short recovery window don't give you durable resume after a long outage.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Users report the connection drops exactly every 60 seconds when idle. Diagnose.</div>
  <div class="qa-answer">
    <p>A precise period points at an intermediary timeout, not application code. AWS ALB's default idle timeout and nginx's default <code>proxy_read_timeout</code> are both 60 s. I'd confirm from server logs (close code 1006 on the client, no close frame on the server, uniform connection lifetimes) and by bypassing the hop. Fix: heartbeat at ~25 s from the server (protocol ping) and from the client (app-level ping, since browsers can't send ping frames), and/or raise the timeout. Then check every hop — CDN, ingress, corporate proxy — because the smallest timeout wins.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. How do you deploy a WebSocket service without kicking everyone at once?</div>
  <div class="qa-answer">
    <p>Roll nodes one at a time. On SIGTERM a node fails its readiness check so the LB stops routing new upgrades to it, then closes its existing sockets in batches over 30–60 s with code 1012 (service restart). Clients treat 1012 as "reconnect after a jittered delay" and resume from their last seq on whichever node they land. The termination grace period (e.g. Kubernetes <code>terminationGracePeriodSeconds</code>) must exceed the drain time. Server-side upgrade rate limits with 1013 protect against the herd if something still goes wrong.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. API Gateway WebSocket APIs vs running your own gateway on ECS/Kubernetes?</div>
  <div class="qa-answer">
    <p>API Gateway removes servers: AWS holds connections, Lambdas handle <code>$connect</code>/<code>$disconnect</code>/routes, and you push with <code>PostToConnection</code>. It suits modest or spiky traffic and small teams. Costs: per-message and per-connection-minute billing, a maximum connection duration (2 hours at time of writing) and a 10-minute idle timeout, auth only at connect, a Lambda cold start in the message path, and broadcast as N API calls with 410 cleanup. A self-run gateway on ECS with Redis gives sub-millisecond fanout, any protocol, unlimited lifetime and better unit economics at steady high volume, but you own capacity, deploy draining and on-call. I'd start managed for an MVP or device fleet of a few thousand and revisit with real traffic numbers.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. (FDE) A customer says "live updates work at home but never in our office." What do you do?</div>
  <div class="qa-answer">
    <p>Suspect the network path, not the app. Steps: get a HAR or console log from an affected machine — a 1006 right after connecting means the upgrade failed. Run the <code>curl -i</code> upgrade test from inside their network: a 403/407 or a 200 with an HTML page means a proxy is intercepting; a 101 followed by a drop after N seconds means an idle timeout or TLS-inspecting proxy. Typical causes: corporate proxies that strip <code>Upgrade</code>, TLS inspection appliances that don't support WebSockets, or a firewall allowing only 443. Short-term: confirm we use <code>wss://</code> on 443 and enable an SSE or long-polling fallback for that tenant. Longer-term: give their IT team the exact hostnames to allowlist from inspection, and add a connection-health indicator plus telemetry tagged by tenant so we see it before they do.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You can narrate the upgrade handshake and know <code>Sec-WebSocket-Accept</code> is not security.</li>
    <li>You explain masking correctly (protects intermediaries, not confidentiality).</li>
    <li>You authenticate at the upgrade, check <code>Origin</code>, avoid long-lived tokens in URLs, and authorise per subscription.</li>
    <li>You say "the connection is pinned to one process" and derive fanout, presence and deploy strategy from it.</li>
    <li>You know sticky sessions matter for Socket.IO polling, not raw WebSockets.</li>
    <li>You design seq numbers, acks, idempotent publishes and snapshot+resume instead of trusting TCP.</li>
    <li>You handle backpressure with <code>bufferedAmount</code> and a slow-consumer policy.</li>
    <li>You recognise LB idle timeouts from a regular disconnect period.</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. What does Sec-WebSocket-Accept prove, and what does it not prove?</div>
  <div class="qa-answer">
    <p>The client sends <code>Sec-WebSocket-Key</code>, 16 random bytes base64-encoded. The server appends the fixed GUID <code>258EAFA5-E914-47DA-95CA-C5AB0DC85B11</code>, SHA-1 hashes the result and base64-encodes it into <code>Sec-WebSocket-Accept</code> on the <code>101</code> response. That proves the server genuinely <strong>speaks WebSocket</strong>: a plain HTTP server or a cache cannot produce it by accident. It is <strong>not</strong> security: anyone can compute it, so it proves nothing about the server's or the client's identity. Identity comes from TLS (<code>wss://</code>) and from your own authentication at the upgrade (a single-use ticket, or a cookie plus an <code>Origin</code> allowlist).</p>
  </div>
</div>
` },

  ]
});
