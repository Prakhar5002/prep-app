window.PREP_SITE.registerTopic({
  id: "api-webrtc",
  module: "api-design",
  title: "WebRTC Deep",
  estimatedReadTime: "55 min",
  tags: ["webrtc","sdp","ice","stun","turn","nat","sfu","simulcast","dtls-srtp","datachannel","getstats","react-native-webrtc","realtime"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">WebRTC = <strong>your signalling swaps SDP (what) and ICE candidates (where)</strong>, ICE finds a path using STUN and falls back to a TURN relay, then media flows as DTLS-SRTP over UDP — peer-to-peer for two, through an SFU with simulcast for groups.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Three JS APIs:</strong> <code>getUserMedia</code>/<code>getDisplayMedia</code> (capture), <code>RTCPeerConnection</code> (media + transport), <code>RTCDataChannel</code> (data); underneath ICE, STUN/TURN, DTLS, SRTP, SCTP. Encryption cannot be turned off.</li>
    <li><strong>Signalling isn't in the spec</strong> — usually a WebSocket (authenticated, TLS); WHIP/WHEP use HTTP POST/DELETE. The server relays SDP/ICE as opaque blobs.</li>
    <li><strong>SDP</strong> carries tracks (<code>m=</code> lines), codecs, ICE ufrag/pwd and the <strong>DTLS fingerprint</strong>; Unified Plan only; prefer <code>setCodecPreferences</code>/<code>setParameters</code> over munging.</li>
    <li><strong>Candidates:</strong> host (mDNS-hidden), srflx (STUN), prflx, relay (TURN). ICE tests pairs and nominates one; candidates trickle while checks run.</li>
    <li><strong>Symmetric NAT / CGNAT / UDP-blocking firewalls → TURN.</strong> Serve TURN on UDP, TCP and TLS-443; ~10–20% of sessions relay (measure yours).</li>
    <li><strong>TURN is the cost line</strong> — full call bitrate through your servers. Time-limited HMAC credentials; <code>denied-peer-ip</code> for private ranges.</li>
    <li><strong>Perfect negotiation</strong> (polite/impolite + implicit rollback) handles glare on renegotiation.</li>
    <li><strong>connectionState</strong>: <code>disconnected</code> may self-heal; <code>failed</code> → <code>restartIce()</code>; network switches need signalling reconnect + ICE restart.</li>
    <li><strong>DTLS-SRTP is mandatory but hop-by-hop</strong> — an SFU sees plaintext; true E2EE needs frame encryption (Insertable Streams/SFrame) and kills server-side recording/AI.</li>
    <li><strong>Mesh ≤ 3–4, SFU for groups, MCU for mixing/legacy.</strong> Mesh uplink grows N−1; SFU uplink is constant.</li>
    <li><strong>Simulcast</strong> = several independent encodings (rid q/h/f); <strong>SVC</strong> = one layered stream (VP9/AV1, <code>L3T3</code>). Adaptive stream + dynacast build on them.</li>
    <li><strong>Quality machinery:</strong> Opus (FEC, DTX), jitter buffer, NACK, PLI keyframes, GCC congestion control → encoder lowers bitrate, then fps, then resolution.</li>
    <li><strong>Data channels</strong> choose reliability/ordering per channel; chunk ≤ 16 KB; respect <code>bufferedAmount</code>.</li>
    <li><strong>getStats</strong>: loss/jitter from <code>inbound-rtp</code>, RTT + relay from <code>candidate-pair</code>/candidates, <code>qualityLimitationReason</code> for cpu vs bandwidth; counters are cumulative — use deltas.</li>
    <li><strong>React Native:</strong> <code>react-native-webrtc</code> + <code>RTCView</code>; the real work is permissions, audio routing, background modes, CallKit/ConnectionService, Expo dev client.</li>
    <li><strong>Voice AI rides on it:</strong> the OpenAI Realtime API accepts a WebRTC offer over HTTP; LiveKit is a WebRTC SFU with an agent framework on top.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Testing on the office LAN and shipping with STUN only.</strong> Host candidates connect instantly in dev, so nobody notices that users behind symmetric NAT, CGNAT or UDP-blocking firewalls never connect. Fix: deploy TURN on UDP + TCP + TLS/443 with short-lived credentials, and run a test pass with <code>iceTransportPolicy: 'relay'</code> before launch.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Signalling is mine — I swap the SDP offer/answer and trickle ICE candidates over an authenticated WebSocket; ICE uses STUN for public addresses and TURN when NAT or firewalls block direct, and then media is DTLS-SRTP over UDP."</div>
  <div class="revision-say">"Past three or four people I use an SFU with simulcast: each publisher uploads once, the SFU forwards the right layer per subscriber without decoding, and adaptive stream plus dynacast keep bandwidth in check."</div>
  <div class="revision-say">"When a call is bad I don't guess — getStats tells me loss, jitter, RTT, whether we're on a TURN relay and whether the encoder is limited by CPU or bandwidth."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What WebRTC actually is</h3>
<p>Two things wearing one name:</p>
<ol>
  <li><strong>A W3C JavaScript API</strong> — <code>RTCPeerConnection</code>, <code>RTCRtpSender</code>/<code>Receiver</code>/<code>Transceiver</code>, <code>RTCDataChannel</code>, <code>getStats()</code>, plus <code>mediaDevices</code> from Media Capture.</li>
  <li><strong>An IETF protocol suite</strong> — ICE (connectivity), STUN/TURN (NAT traversal), DTLS (key exchange), SRTP (encrypted media), SCTP (data channels), RTP/RTCP (media packets + feedback), SDP (session description).</li>
</ol>
<p>The reference implementation is Google's <strong>libwebrtc</strong>. Chrome, Safari (partly), Android, iOS SDKs, <code>react-native-webrtc</code> and most native SDKs (including LiveKit's) wrap it. Pure-Go <strong>Pion</strong> and Rust <strong>webrtc-rs</strong> are independent implementations used server-side.</p>

<h3>Why UDP, and why not just send audio over a WebSocket?</h3>
<p>Real-time media has a property normal data doesn't: <strong>late data is worthless</strong>. A voice packet that arrives 400 ms late is worse than one that never arrives, because the playout has already moved on. TCP (and therefore WebSocket) guarantees in-order delivery — one lost packet stalls every packet behind it (<em>head-of-line blocking</em>) until a retransmit lands. On a 2% lossy mobile link that turns into audible stutter and growing delay.</p>
<table>
  <thead><tr><th>Concern</th><th>WebSocket (TCP)</th><th>WebRTC (UDP)</th></tr></thead>
  <tbody>
    <tr><td>Packet loss</td><td>Retransmit + stall everything behind it</td><td>Conceal (Opus PLC/FEC), selectively NACK video, move on</td></tr>
    <tr><td>Jitter</td><td>You build your own buffer</td><td>Adaptive jitter buffer built in (NetEQ in libwebrtc)</td></tr>
    <tr><td>Bandwidth drops</td><td>Queue grows, latency grows</td><td>Congestion control lowers encoder bitrate/resolution</td></tr>
    <tr><td>Echo / noise</td><td>Nothing</td><td>AEC, noise suppression, AGC in the capture pipeline</td></tr>
    <tr><td>Codec</td><td>You ship raw PCM (~384 kbps for 24 kHz 16-bit) or bring your own</td><td>Opus at ~16–40 kbps, negotiated automatically</td></tr>
    <tr><td>Encryption</td><td>TLS (wss)</td><td>DTLS-SRTP — mandatory</td></tr>
    <tr><td>NAT traversal</td><td>Client → server only</td><td>Peer-to-peer via ICE, relay via TURN</td></tr>
  </tbody>
</table>
<p>That table is exactly why the OpenAI Realtime API recommends WebRTC for browser/mobile clients and WebSocket for server-to-server (see <a href="#/topic/ai-realtime-voice">OpenAI Realtime API</a>).</p>

<h3>Where you meet WebRTC as a full-stack / FDE engineer</h3>
<ul>
  <li><strong>Video/voice calls</strong> — 1:1 consults, telehealth, support calls, meeting-room devices.</li>
  <li><strong>Voice AI agents</strong> — the user's browser or phone app sends mic audio over WebRTC to a model or an agent server (OpenAI Realtime, LiveKit Agents).</li>
  <li><strong>Screen share and remote assistance</strong> — <code>getDisplayMedia</code> + a data channel for annotations.</li>
  <li><strong>Low-latency broadcast ingest</strong> — OBS/browser → media server via <strong>WHIP</strong> (sub-second, vs 5–30 s for HLS).</li>
  <li><strong>P2P data</strong> — file transfer, game state, collaborative cursors when you want to skip the server hop.</li>
</ul>

<h3>When WebRTC is the wrong tool</h3>
<table>
  <thead><tr><th>Need</th><th>Better choice</th><th>Why</th></tr></thead>
  <tbody>
    <tr><td>Broadcast to 10k+ passive viewers, seconds of delay OK</td><td>HLS / LL-HLS via CDN</td><td>CDNs cache segments; WebRTC fan-out costs a server connection per viewer</td></tr>
    <tr><td>Chat, presence, notifications</td><td><a href="#/topic/api-websockets">WebSocket</a> / SSE</td><td>Reliable ordered delivery is what you want; no NAT problem client→server</td></tr>
    <tr><td>Server-to-server audio streaming (your backend ↔ an AI model)</td><td>WebSocket / gRPC</td><td>Datacenter links are clean; TCP's downsides barely show; far simpler</td></tr>
    <tr><td>Large reliable file upload</td><td>HTTPS (multipart / presigned URL)</td><td>Resumable, cacheable, no ICE dance</td></tr>
  </tbody>
</table>
<div class="callout note">
  <div class="callout-title">Why this matters in interviews</div>
  <p>"We used WebRTC" on a resume invites three probes: <em>how does the connection get established</em> (signalling, SDP, ICE), <em>what happens when it fails</em> (NAT, TURN, ICE restart), and <em>how does it scale past two people</em> (SFU, simulcast). The rest of this topic is organised around those three.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Picture 1 — two planes: signalling vs media</h3>
<div class="diagram">
<pre>
             SIGNALLING PLANE (yours: WebSocket / HTTP, TCP+TLS)
   ┌────────┐   offer SDP, ICE candidates    ┌────────────────┐   answer SDP, ICE   ┌────────┐
   │ Peer A │ ─────────────────────────────► │ Signalling svc │ ──────────────────► │ Peer B │
   │        │ ◄───────────────────────────── │ (auth, rooms)  │ ◄────────────────── │        │
   └───┬────┘                                └────────────────┘                     └───┬────┘
       │                                                                                │
       │            MEDIA PLANE (WebRTC: ICE → DTLS → SRTP/SCTP over UDP)               │
       └══════════════════ direct, or via TURN relay, or via SFU ══════════════════════┘

   STUN server: "what is my public IP:port?"      TURN server: "relay my packets for me"
</pre>
</div>
<p>Your server never needs to understand SDP — it relays it. Once the media plane is up, the signalling plane is only needed for renegotiation (add screen share, ICE restart) and hang-up.</p>

<h3>Picture 2 — the protocol stack</h3>
<div class="diagram">
<pre>
  getUserMedia ─► MediaStreamTrack                    RTCDataChannel.send()
        │  (AEC / NS / AGC on audio)                         │
        ▼                                                    ▼
  Encoder: Opus (audio) / VP8·VP9·H.264·AV1 (video)      SCTP  (ordered? reliable? per channel)
        ▼                                                    │
  RTP packetizer  +  RTCP feedback (NACK, PLI, TWCC)         │
        ▼                                                    │
  SRTP  (keys derived from DTLS handshake) ◄── DTLS ─────────┘
        ▼                                     ▼
  ICE  (chosen candidate pair; consent checks every few seconds)
        ▼
  UDP   (or TCP / TLS-443 via TURN when UDP is blocked)
</pre>
</div>

<h3>Picture 3 — "SDP is the contract, ICE is the search"</h3>
<ul>
  <li><strong>SDP</strong> answers <em>what</em>: which tracks (<code>m=</code> sections), which codecs and payload types, the DTLS certificate fingerprint, ICE credentials (<code>ice-ufrag</code>/<code>ice-pwd</code>), BUNDLE, simulcast RIDs, header extensions.</li>
  <li><strong>ICE</strong> answers <em>where</em>: each side gathers candidates, both sides form candidate <em>pairs</em>, send STUN binding checks on every pair, and nominate the best working one. Candidates trickle in over signalling while checks already run.</li>
</ul>
<table>
  <thead><tr><th>Candidate type</th><th>Where it comes from</th><th>Works when</th></tr></thead>
  <tbody>
    <tr><td><code>host</code></td><td>Local interface IP (browsers hide it behind an mDNS <code>xxxx.local</code> name)</td><td>Same LAN</td></tr>
    <tr><td><code>srflx</code> (server-reflexive)</td><td>STUN server tells you your public IP:port as seen from outside</td><td>Both NATs are "cone"-like (endpoint-independent mapping)</td></tr>
    <tr><td><code>prflx</code> (peer-reflexive)</td><td>Discovered during connectivity checks from an unexpected address</td><td>Opportunistic — appears mid-check</td></tr>
    <tr><td><code>relay</code></td><td>TURN server allocates a public address and relays</td><td>Always (if TURN reachable) — costs you bandwidth</td></tr>
  </tbody>
</table>

<h3>Picture 4 — NAT behaviour decides whether P2P works</h3>
<table>
  <thead><tr><th>NAT behaviour (RFC 4787 terms)</th><th>Old name</th><th>STUN-derived address usable by peer?</th></tr></thead>
  <tbody>
    <tr><td>Endpoint-independent mapping + filtering</td><td>Full cone</td><td>Yes</td></tr>
    <tr><td>Endpoint-independent mapping, address-dependent filtering</td><td>(Port-)restricted cone</td><td>Yes, once both sides send (hole punching)</td></tr>
    <tr><td>Address-and-port-dependent <em>mapping</em></td><td>Symmetric</td><td>No — new public port per destination, so the port STUN saw is not the one the peer would hit → need TURN</td></tr>
    <tr><td>Carrier-grade NAT (mobile, some ISPs)</td><td>—</td><td>Often behaves symmetric; two CGNAT users frequently need TURN</td></tr>
    <tr><td>UDP blocked entirely (corporate)</td><td>—</td><td>Only TURN over TCP / TLS on 443 gets through</td></tr>
  </tbody>
</table>
<p>The commonly cited figure is that roughly 10–20% of real-world sessions end up on TURN — much higher for enterprise or mobile-heavy user bases. Treat it as a range to measure, not a constant.</p>

<h3>Picture 5 — topologies and the bandwidth math</h3>
<div class="diagram">
<pre>
  MESH (P2P)                SFU (forward)                    MCU (mix)
  A ◄──► B                  A ─► ┌─────┐ ─► B,C,D            A ─► ┌─────┐ ─► A (1 mixed)
  ▲ ╲  ╱ ▲                  B ─► │ SFU │ ─► A,C,D            B ─► │ MCU │ ─► B (1 mixed)
  │  ╳   │                  C ─► │     │ ─► A,B,D            C ─► │decode│ ─► C
  ▼ ╱  ╲ ▼                  D ─► └─────┘ ─► A,B,C            D ─► │ mix  │ ─► D
  C ◄──► D                  1 up, N-1 down per client             │encode│
  N-1 up, N-1 down          server: no decode, just routing       └─────┘ 1 up, 1 down
</pre>
</div>
<table>
  <thead><tr><th>Per client, 1 Mbps video</th><th>N = 2</th><th>N = 4</th><th>N = 8</th><th>N = 25</th></tr></thead>
  <tbody>
    <tr><td>Mesh uplink</td><td>1 Mbps</td><td>3 Mbps (3 encodes!)</td><td>7 Mbps — breaks most home/mobile uplinks</td><td>impossible</td></tr>
    <tr><td>SFU uplink (simulcast ≈ 0.15 + 0.5 + 1.5)</td><td>~2 Mbps</td><td>~2 Mbps</td><td>~2 Mbps</td><td>~2 Mbps</td></tr>
    <tr><td>SFU downlink (thumbnails at 0.15 for most)</td><td>1 Mbps</td><td>~1.3 Mbps</td><td>~2 Mbps</td><td>depends on layout + pagination</td></tr>
    <tr><td>MCU up / down</td><td colspan="4">1 / 1 Mbps — but the server decodes N streams and re-encodes, the expensive part</td></tr>
  </tbody>
</table>
<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"WebRTC is peer-to-peer, so it doesn't need servers." Production WebRTC needs <strong>at least three</strong>: a signalling server, STUN (cheap), and TURN (expensive, essential). Group calls add an SFU. "P2P" describes the media path in the best case, not the system.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. Capture — getUserMedia and constraints</h3>
<pre><code class="language-ts">// Requires a secure context (HTTPS or localhost) and a user permission prompt.
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,   // AEC — keep ON for any speaker/mic setup
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 1,
  },
  video: {
    width: { ideal: 1280 }, height: { ideal: 720 },
    frameRate: { ideal: 30, max: 30 },
    facingMode: 'user',       // mobile front camera
  },
});
// Device changes (AirPods connect mid-call) fire 'devicechange'
navigator.mediaDevices.addEventListener('devicechange', refreshDeviceList);</code></pre>

<h3>2. The peer connection and its configuration</h3>
<pre><code class="language-ts">const pc = new RTCPeerConnection({
  iceServers,                       // fetched from YOUR backend (short-lived TURN creds)
  iceTransportPolicy: 'all',        // 'relay' = TURN only: hides user IPs, costs more
  bundlePolicy: 'max-bundle',       // all media on one transport (fewer ports, faster ICE)
  rtcpMuxPolicy: 'require',
  iceCandidatePoolSize: 0,          // &gt;0 pre-gathers candidates before an offer exists
});

// Modern API: transceivers. One per m= line. addTrack creates one for you.
stream.getTracks().forEach((track) =&gt; pc.addTrack(track, stream));
// Receive-only (e.g. a viewer or an AI agent that only listens):
pc.addTransceiver('video', { direction: 'recvonly' });

pc.ontrack = ({ track, streams }) =&gt; { remoteVideo.srcObject = streams[0]; };
pc.onconnectionstatechange = () =&gt; console.log('pc', pc.connectionState);</code></pre>

<h3>3. SDP anatomy (annotated, trimmed)</h3>
<pre><code class="language-text">v=0
o=- 4611731400430051336 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0 1                       &lt;- both m= sections share one ICE/DTLS transport
a=msid-semantic: WMS
m=audio 9 UDP/TLS/RTP/SAVPF 111 63 0 8   &lt;- audio section; payload types offered in preference order
c=IN IP4 0.0.0.0
a=mid:0                                  &lt;- media id, used by BUNDLE and transceivers
a=ice-ufrag:F7gI                         &lt;- ICE credentials (change on ICE restart)
a=ice-pwd:x9cml/YzichV2+XlhiMu8g
a=fingerprint:sha-256 49:66:12:...:B1    &lt;- DTLS cert fingerprint: binds crypto to signalling
a=setup:actpass                          &lt;- who is DTLS client/server (answerer picks)
a=sendrecv
a=rtcp-mux
a=rtpmap:111 opus/48000/2                &lt;- PT 111 = Opus
a=fmtp:111 minptime=10;useinbandfec=1    &lt;- 10 ms min frame; in-band FEC on
a=rtpmap:0 PCMU/8000                     &lt;- G.711 mu-law (telephony interop)
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98
a=mid:1
a=rtpmap:96 VP8/90000
a=rtcp-fb:96 nack                        &lt;- receiver may request retransmits
a=rtcp-fb:96 nack pli                    &lt;- ...and keyframes
a=rtcp-fb:96 transport-cc                &lt;- transport-wide congestion control feedback
a=rid:q send                             &lt;- simulcast layers (when enabled)
a=rid:h send
a=rid:f send
a=simulcast:send q;h;f</code></pre>
<p>Modern browsers use <strong>Unified Plan</strong> SDP (one <code>m=</code> line per track/transceiver). The older Chrome-only "Plan B" is gone — if you see Plan B advice, it's outdated. Prefer APIs (<code>setCodecPreferences</code>, <code>setParameters</code>) over string-munging SDP.</p>

<h3>4. Offer/answer with trickle ICE — the sequence</h3>
<div class="diagram">
<pre>
 Caller (A)                         Signalling                         Callee (B)
 ──────────                         ──────────                         ──────────
 addTrack(mic, cam)
 createOffer() → setLocalDescription(offer)
   ├── offer ──────────────────────────►│──────────────────────────────► setRemoteDescription(offer)
   │                                    │                                addTrack(mic, cam)
   │                                    │                                createAnswer() → setLocalDescription(answer)
   │◄───────────────────────────────────│◄──────────────────────── answer ─┤
 setRemoteDescription(answer)
 onicecandidate → candidate ──────────►│─────────────────────────────► addIceCandidate()
 addIceCandidate() ◄───────────────────│◄────────────────────────── candidate ─ onicecandidate
                 ICE checks on candidate pairs (STUN binding requests both ways)
                 nominate pair → DTLS handshake → SRTP keys → ontrack fires → media flows
</pre>
</div>

<h3>5. "Perfect negotiation" — the pattern that survives glare</h3>
<p>Renegotiation happens mid-call (screen share added, ICE restart). If both sides create an offer at the same moment (<strong>glare</strong>), naive code deadlocks. The W3C/MDN "perfect negotiation" pattern gives one side the <em>polite</em> role: it rolls back its own offer and accepts the other's.</p>
<pre><code class="language-ts">// polite = true on exactly one side (e.g. whoever joined second; decided by the server)
let makingOffer = false;
let ignoreOffer = false;
let isSettingRemoteAnswerPending = false;

pc.onnegotiationneeded = async () =&gt; {
  try {
    makingOffer = true;
    await pc.setLocalDescription();                 // implicit createOffer()
    signal.send({ description: pc.localDescription });
  } finally {
    makingOffer = false;
  }
};

pc.onicecandidate = ({ candidate }) =&gt; signal.send({ candidate });

signal.onMessage(async ({ description, candidate }) =&gt; {
  if (description) {
    const readyForOffer =
      !makingOffer &amp;&amp; (pc.signalingState === 'stable' || isSettingRemoteAnswerPending);
    const offerCollision = description.type === 'offer' &amp;&amp; !readyForOffer;
    ignoreOffer = !polite &amp;&amp; offerCollision;
    if (ignoreOffer) return;                        // impolite peer wins the collision

    isSettingRemoteAnswerPending = description.type === 'answer';
    await pc.setRemoteDescription(description);     // polite peer: implicit rollback
    isSettingRemoteAnswerPending = false;

    if (description.type === 'offer') {
      await pc.setLocalDescription();               // implicit createAnswer()
      signal.send({ description: pc.localDescription });
    }
  } else if (candidate) {
    try {
      await pc.addIceCandidate(candidate);
    } catch (err) {
      if (!ignoreOffer) throw err;                  // candidates for an ignored offer are expected to fail
    }
  }
});</code></pre>

<h3>6. ICE in depth — states, consent, restart</h3>
<table>
  <thead><tr><th><code>connectionState</code></th><th>Meaning</th><th>What your app does</th></tr></thead>
  <tbody>
    <tr><td><code>new</code> / <code>connecting</code></td><td>Gathering / checking pairs</td><td>Show "connecting…"; start a timeout (e.g. 15 s)</td></tr>
    <tr><td><code>connected</code></td><td>A pair works, DTLS done</td><td>Hide spinner; start stats sampling</td></tr>
    <tr><td><code>disconnected</code></td><td>Consent checks failing (network blip, Wi-Fi→LTE)</td><td>Wait a few seconds — it often self-heals; show "reconnecting"</td></tr>
    <tr><td><code>failed</code></td><td>No working pair</td><td><code>pc.restartIce()</code> (new ufrag/pwd, regather) → renegotiate; if that fails, rebuild the PC</td></tr>
    <tr><td><code>closed</code></td><td><code>pc.close()</code> called</td><td>Release tracks, UI teardown</td></tr>
  </tbody>
</table>
<p><strong>Consent freshness</strong> (RFC 7675): once connected, peers keep sending STUN binding requests every few seconds; if the other side stops answering, the browser stops sending media (so a stale path can't be abused to flood someone) and the state drops to <code>disconnected</code>. <strong>ICE restart</strong> is how you move a live call to a new network path without tearing down tracks.</p>
<pre><code class="language-ts">let restartTimer: ReturnType&lt;typeof setTimeout&gt; | undefined;
pc.onconnectionstatechange = () =&gt; {
  clearTimeout(restartTimer);
  if (pc.connectionState === 'failed') pc.restartIce();     // triggers negotiationneeded
  if (pc.connectionState === 'disconnected') {
    restartTimer = setTimeout(() =&gt; {                        // give it ~3 s to self-heal first
      if (pc.connectionState === 'disconnected') pc.restartIce();
    }, 3000);
  }
};</code></pre>

<h3>7. STUN and TURN — and why TURN is the expensive line item</h3>
<ul>
  <li><strong>STUN</strong>: a tiny request/response — "what address do you see me from?". Stateless, near-free; public STUN servers exist but use your own in production so you control availability.</li>
  <li><strong>TURN</strong>: the client <em>allocates</em> a relay address on the TURN server and every media packet goes through it. TURN bandwidth = the whole call's bitrate, both directions. Run it on UDP 3478, TCP 3478 and <strong>TLS on 443</strong> (gets through firewalls that only allow HTTPS).</li>
  <li><strong>Credentials</strong>: never ship static TURN credentials in an app bundle (they get scraped and your relay becomes someone's free proxy). Use the "TURN REST API" convention: the backend issues a time-limited username + HMAC credential that coturn verifies with a shared secret.</li>
</ul>
<pre><code class="language-ts">// backend: GET /rtc/ice-servers  (authenticated)
import crypto from 'node:crypto';

export function iceServersFor(userId: string, ttlSeconds = 4 * 3600) {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const username = expiresAt + ':' + userId;               // coturn checks the timestamp prefix
  const credential = crypto
    .createHmac('sha1', process.env.TURN_SHARED_SECRET as string)
    .update(username)
    .digest('base64');

  return {
    ttl: ttlSeconds,
    iceServers: [
      { urls: 'stun:turn.example.com:3478' },
      {
        urls: [
          'turn:turn.example.com:3478?transport=udp',
          'turn:turn.example.com:3478?transport=tcp',
          'turns:turn.example.com:443?transport=tcp',     // corporate-firewall escape hatch
        ],
        username,
        credential,
      },
    ],
  };
}</code></pre>
<pre><code class="language-text"># /etc/turnserver.conf (coturn) — essentials
listening-port=3478
tls-listening-port=443
use-auth-secret
static-auth-secret=REPLACE_WITH_SAME_SECRET_AS_BACKEND
realm=turn.example.com
cert=/etc/ssl/turn/fullchain.pem
pkey=/etc/ssl/turn/privkey.pem
external-ip=203.0.113.10
min-port=49152
max-port=65535
no-cli
# Don't let the relay reach your private network (relay-as-SSRF):
denied-peer-ip=10.0.0.0-10.255.255.255
denied-peer-ip=172.16.0.0-172.31.255.255
denied-peer-ip=192.168.0.0-192.168.255.255</code></pre>

<h3>8. Security — DTLS-SRTP and what it does and doesn't protect</h3>
<ul>
  <li><strong>Mandatory encryption.</strong> There is no unencrypted WebRTC media. DTLS runs over the ICE path; the negotiated keys feed SRTP for media; data channels are SCTP inside DTLS.</li>
  <li><strong>The fingerprint ties it to signalling.</strong> Certificates are self-signed; trust comes from the <code>a=fingerprint</code> in the SDP. Whoever can tamper with your signalling can swap fingerprints and man-in-the-middle the call — so <strong>signalling must be authenticated and over TLS</strong>.</li>
  <li><strong>SFUs decrypt.</strong> DTLS-SRTP is hop-by-hop: client↔SFU. The SFU sees plaintext media (it needs RTP headers to route; it could record). For true end-to-end encryption, encrypt frames <em>inside</em> the media with Encoded Transforms / Insertable Streams (the SFrame approach) — supported by LiveKit and others, at the cost of server-side recording and transcription.</li>
  <li><strong>IP privacy.</strong> Browsers replace host IPs with mDNS names; srflx still reveals the public IP to the peer. <code>iceTransportPolicy: 'relay'</code> hides it completely (all traffic via TURN).</li>
  <li><strong>Permissions.</strong> Capture needs a secure context and user consent; on mobile, OS-level permissions too.</li>
</ul>

<h3>9. Media quality machinery</h3>
<table>
  <thead><tr><th>Mechanism</th><th>What it does</th><th>Knob / where you see it</th></tr></thead>
  <tbody>
    <tr><td><strong>Opus</strong></td><td>Audio codec, 6–510 kbps, 20 ms frames, built-in PLC, in-band FEC, DTX (silence suppression)</td><td><code>a=fmtp</code>; <code>sender.setParameters</code> maxBitrate</td></tr>
    <tr><td><strong>VP8 / VP9 / H.264 / AV1</strong></td><td>Video codecs; H.264 often has hardware encode on mobile, VP9/AV1 support SVC</td><td><code>transceiver.setCodecPreferences()</code></td></tr>
    <tr><td><strong>Jitter buffer</strong></td><td>Holds packets briefly to smooth arrival variance; adaptive (grows on bad networks → adds latency)</td><td><code>inbound-rtp.jitterBufferDelay / jitterBufferEmittedCount</code></td></tr>
    <tr><td><strong>NACK</strong></td><td>Receiver asks for a lost video packet to be resent (only if it can still arrive in time)</td><td><code>nackCount</code>, <code>retransmittedPacketsSent</code></td></tr>
    <tr><td><strong>PLI / FIR</strong></td><td>"Send me a keyframe" — after loss broke the decode chain or a new subscriber joins</td><td><code>pliCount</code>; frozen video until keyframe</td></tr>
    <tr><td><strong>FEC / RED</strong></td><td>Redundant data so loss can be repaired without a round trip</td><td>Opus <code>useinbandfec=1</code>; RED for audio</td></tr>
    <tr><td><strong>Congestion control</strong></td><td>GCC estimates available bandwidth from delay/loss using transport-wide feedback; encoder adapts bitrate, then frame rate, then resolution</td><td><code>candidate-pair.availableOutgoingBitrate</code>, <code>qualityLimitationReason</code></td></tr>
  </tbody>
</table>
<pre><code class="language-ts">// Cap bitrate on a sender (e.g. save cellular data) — no renegotiation needed
const sender = pc.getSenders().find((s) =&gt; s.track?.kind === 'video')!;
const params = sender.getParameters();
params.encodings[0].maxBitrate = 500_000;        // 500 kbps
params.encodings[0].maxFramerate = 20;
await sender.setParameters(params);

// Prefer a codec (e.g. H.264 for hardware encode on older phones)
const tx = pc.getTransceivers().find((t) =&gt; t.sender === sender)!;
const caps = RTCRtpSender.getCapabilities('video')!.codecs;
tx.setCodecPreferences([
  ...caps.filter((c) =&gt; c.mimeType === 'video/H264'),
  ...caps.filter((c) =&gt; c.mimeType !== 'video/H264'),
]);</code></pre>

<h3>10. Simulcast and SVC — how an SFU serves different receivers</h3>
<ul>
  <li><strong>Simulcast</strong>: the publisher encodes the same camera <em>2–3 times</em> at different resolutions/bitrates (layers, identified by <code>rid</code>). The SFU forwards whichever layer each subscriber can take — the phone on 3G gets 180p, the desktop on fibre gets 720p. Costs publisher CPU + uplink (~1.4× of the top layer).</li>
  <li><strong>SVC</strong> (scalable video coding): <em>one</em> encoded stream with embedded layers (temporal: drop frames; spatial: drop resolution). The SFU strips layers per subscriber. More efficient uplink; needs VP9/AV1 and SFU support. Described by <code>scalabilityMode</code> like <code>L1T3</code> (1 spatial, 3 temporal) or <code>L3T3</code>.</li>
</ul>
<pre><code class="language-ts">// Simulcast publish: three layers, low → high
pc.addTransceiver(cameraTrack, {
  direction: 'sendonly',
  streams: [stream],
  sendEncodings: [
    { rid: 'q', scaleResolutionDownBy: 4, maxBitrate: 150_000 },   // 320x180
    { rid: 'h', scaleResolutionDownBy: 2, maxBitrate: 500_000 },   // 640x360
    { rid: 'f', maxBitrate: 1_500_000 },                            // 1280x720
  ],
});

// SVC publish (VP9/AV1-capable browsers + SFU)
pc.addTransceiver(cameraTrack, {
  direction: 'sendonly',
  sendEncodings: [{ scalabilityMode: 'L3T3' }],
});</code></pre>
<p>SFU features built on this: <strong>adaptive stream</strong> (subscribe at the size the video element is actually rendered; pause hidden tiles) and <strong>dynacast</strong> (tell the publisher to stop encoding layers nobody is watching). LiveKit exposes both as client options — see <a href="#/topic/ai-livekit">LiveKit</a>.</p>

<h3>11. Data channels</h3>
<pre><code class="language-ts">// Reliable + ordered (default): chat, file chunks, control messages
const control = pc.createDataChannel('control');

// Unreliable + unordered: game state, cursor positions — newest wins
const state = pc.createDataChannel('state', { ordered: false, maxRetransmits: 0 });

// Partially reliable: retry for at most 150 ms then give up
const telemetry = pc.createDataChannel('telemetry', { ordered: false, maxPacketLifeTime: 150 });

// Pre-negotiated: both sides create with the same id, no in-band announcement
const ctrl2 = pc.createDataChannel('ctrl', { negotiated: true, id: 0 });</code></pre>
<ul>
  <li>Runs over SCTP inside DTLS — per-channel choice of reliability and ordering, which is the one thing WebSocket can never give you.</li>
  <li><strong>Message size:</strong> the negotiated <code>a=max-message-size</code> varies by browser; keep messages ≤ 16 KB for portability and chunk anything bigger.</li>
  <li><strong>Backpressure:</strong> <code>send()</code> never blocks — it queues. Watch <code>bufferedAmount</code> and wait for <code>bufferedamountlow</code>, or you'll balloon memory and eventually error (example in Examples).</li>
</ul>

<h3>12. getStats — the only honest source of truth</h3>
<table>
  <thead><tr><th>Stats type</th><th>Fields worth knowing</th></tr></thead>
  <tbody>
    <tr><td><code>inbound-rtp</code></td><td><code>packetsReceived</code>, <code>packetsLost</code>, <code>jitter</code> (s), <code>framesDecoded</code>, <code>framesDropped</code>, <code>freezeCount</code>, <code>concealedSamples</code> (audio PLC), <code>jitterBufferDelay</code></td></tr>
    <tr><td><code>outbound-rtp</code></td><td><code>bytesSent</code>, <code>framesEncoded</code>, <code>frameWidth/Height</code>, <code>qualityLimitationReason</code> (<code>bandwidth</code> / <code>cpu</code> / <code>none</code>), <code>retransmittedPacketsSent</code></td></tr>
    <tr><td><code>remote-inbound-rtp</code></td><td>What the <em>other side</em> reports about your stream: <code>roundTripTime</code>, <code>fractionLost</code></td></tr>
    <tr><td><code>candidate-pair</code></td><td><code>state</code>, <code>currentRoundTripTime</code>, <code>availableOutgoingBitrate</code>, <code>bytesSent/Received</code></td></tr>
    <tr><td><code>local-candidate</code> / <code>remote-candidate</code></td><td><code>candidateType</code> (host/srflx/prflx/relay), <code>protocol</code> (udp/tcp), <code>relayProtocol</code> (udp/tcp/tls)</td></tr>
    <tr><td><code>transport</code></td><td><code>selectedCandidatePairId</code>, <code>dtlsState</code></td></tr>
  </tbody>
</table>
<p>Counters are cumulative — compute <em>deltas</em> between two samples to get rates. In the browser, <code>chrome://webrtc-internals</code> (Chrome) and <code>about:webrtc</code> (Firefox) graph all of this live and can dump it to a file a customer can send you.</p>

<h3>13. Signalling options</h3>
<table>
  <thead><tr><th>Option</th><th>Fits</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>WebSocket (custom JSON)</td><td>1:1 and group apps</td><td>Most common; also carries presence, "ringing", hang-up</td></tr>
    <tr><td>HTTP POST (WHIP / WHEP)</td><td>Ingest to / playback from a media server</td><td>POST offer SDP → 201 + answer SDP + <code>Location</code>; DELETE to stop. WHIP is an IETF RFC. The OpenAI Realtime WebRTC flow uses the same shape.</td></tr>
    <tr><td>SIP over WebSocket</td><td>Bridging to telephony / PBXs</td><td>Usually via a gateway; LiveKit SIP or Twilio sit here</td></tr>
    <tr><td>Firebase / Supabase realtime rows</td><td>Prototypes</td><td>Fine for demos; you still need auth and cleanup</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — production-shaped 1:1 signalling server (Node + ws)</h3>
<p>Authenticated at upgrade time, rooms capped at 2, the server assigns the <code>polite</code> role, and SDP/ICE are relayed as opaque payloads. Single-instance; to scale horizontally, route a room to one instance (consistent hash) or relay through Redis pub/sub — see <a href="#/topic/api-websockets">WebSockets Deep</a>.</p>
<pre><code class="language-ts">// server/signalling.ts
import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { verifySessionToken } from './auth';        // your existing JWT/session check
import { iceServersFor } from './turn';

type Client = { ws: WebSocket; userId: string; roomId: string };
const rooms = new Map&lt;string, Client[]&gt;();

const server = http.createServer((req, res) =&gt; { res.writeHead(404).end(); });
const wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });  // SDP is a few KB

server.on('upgrade', async (req, socket, head) =&gt; {
  const url = new URL(req.url ?? '/', 'http://internal');
  const user = await verifySessionToken(url.searchParams.get('token')).catch(() =&gt; null);
  const roomId = url.searchParams.get('room');
  if (!user || !roomId || !(await canJoinRoom(user.id, roomId))) {
    socket.destroy();                                // reject before upgrading
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) =&gt; onConnect(ws, user.id, roomId));
});

function onConnect(ws: WebSocket, userId: string, roomId: string) {
  const peers = rooms.get(roomId) ?? [];
  if (peers.length &gt;= 2) { ws.close(4001, 'room full'); return; }

  const me: Client = { ws, userId, roomId };
  peers.push(me);
  rooms.set(roomId, peers);

  // Second joiner is polite; first joiner will receive 'peer-joined' and make the offer.
  send(ws, { type: 'welcome', polite: peers.length === 2, ...iceServersFor(userId) });
  peers.filter((p) =&gt; p !== me).forEach((p) =&gt; send(p.ws, { type: 'peer-joined' }));

  ws.on('message', (raw) =&gt; {
    let msg: { type: string; description?: unknown; candidate?: unknown };
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (msg.type !== 'description' &amp;&amp; msg.type !== 'candidate' &amp;&amp; msg.type !== 'hangup') return;
    // Relay as-is to the other peer; the server never parses SDP.
    peers.filter((p) =&gt; p !== me).forEach((p) =&gt; send(p.ws, msg));
  });

  ws.on('close', () =&gt; {
    const left = (rooms.get(roomId) ?? []).filter((p) =&gt; p !== me);
    if (left.length) rooms.set(roomId, left); else rooms.delete(roomId);
    left.forEach((p) =&gt; send(p.ws, { type: 'peer-left' }));
  });
}

function send(ws: WebSocket, data: object) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
}

server.listen(8080);</code></pre>

<h3>Example 2 — the matching browser client</h3>
<pre><code class="language-ts">// client/call.ts
export async function startCall(roomId: string, token: string, els: { local: HTMLVideoElement; remote: HTMLVideoElement }) {
  const ws = new WebSocket('wss://rtc.example.com/?room=' + encodeURIComponent(roomId) + '&amp;token=' + encodeURIComponent(token));
  const welcome = await new Promise&lt;any&gt;((resolve, reject) =&gt; {
    ws.addEventListener('message', function onMsg(e) {
      const m = JSON.parse(e.data);
      if (m.type === 'welcome') { ws.removeEventListener('message', onMsg); resolve(m); }
    });
    ws.addEventListener('close', () =&gt; reject(new Error('signalling closed')));
  });

  const pc = new RTCPeerConnection({ iceServers: welcome.iceServers, bundlePolicy: 'max-bundle' });
  const local = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
  els.local.srcObject = local;
  els.local.muted = true;                       // never play your own mic back
  local.getTracks().forEach((t) =&gt; pc.addTrack(t, local));

  pc.ontrack = ({ streams }) =&gt; {
    if (els.remote.srcObject !== streams[0]) {
      els.remote.srcObject = streams[0];
      els.remote.play().catch(() =&gt; showTapToUnmute());   // autoplay policy
    }
  };

  // Perfect negotiation (Mechanics §5) wired to ws
  wirePerfectNegotiation(pc, {
    polite: welcome.polite,
    send: (m) =&gt; ws.send(JSON.stringify({ type: m.description ? 'description' : 'candidate', ...m })),
    onMessage: (handler) =&gt; ws.addEventListener('message', (e) =&gt; {
      const m = JSON.parse(e.data);
      if (m.type === 'description' || m.type === 'candidate') handler(m);
      if (m.type === 'peer-left' || m.type === 'hangup') hangUp();
    }),
  });

  function hangUp() {
    local.getTracks().forEach((t) =&gt; t.stop());   // camera light off
    pc.close();
    ws.close();
  }
  return { pc, hangUp };
}</code></pre>
<p>Note: with perfect negotiation, adding tracks <em>before</em> the remote peer is present just fires <code>negotiationneeded</code>; the first joiner offers when it gets <code>peer-joined</code> (or you can let both sides' negotiationneeded race — the polite/impolite logic resolves it).</p>

<h3>Example 3 — file transfer over a data channel with backpressure</h3>
<pre><code class="language-ts">const CHUNK = 16 * 1024;                 // portable message size
const HIGH_WATER = 4 * 1024 * 1024;      // pause above 4 MB queued
const dc = pc.createDataChannel('file', { ordered: true });
dc.binaryType = 'arraybuffer';
dc.bufferedAmountLowThreshold = 1 * 1024 * 1024;

export async function sendFile(file: File, onProgress: (pct: number) =&gt; void) {
  dc.send(JSON.stringify({ kind: 'meta', name: file.name, size: file.size, mime: file.type }));
  let offset = 0;
  while (offset &lt; file.size) {
    if (dc.bufferedAmount &gt; HIGH_WATER) {
      await new Promise&lt;void&gt;((r) =&gt; dc.addEventListener('bufferedamountlow', () =&gt; r(), { once: true }));
    }
    const buf = await file.slice(offset, offset + CHUNK).arrayBuffer();
    dc.send(buf);
    offset += buf.byteLength;
    onProgress(Math.round((offset / file.size) * 100));
  }
  dc.send(JSON.stringify({ kind: 'done' }));
}

// Receiver
const parts: ArrayBuffer[] = [];
let meta: { name: string; size: number; mime: string } | null = null;
remoteDc.onmessage = ({ data }) =&gt; {
  if (typeof data === 'string') {
    const m = JSON.parse(data);
    if (m.kind === 'meta') meta = m;
    if (m.kind === 'done' &amp;&amp; meta) saveBlob(new Blob(parts, { type: meta.mime }), meta.name);
  } else {
    parts.push(data);
  }
};</code></pre>

<h3>Example 4 — screen share without renegotiation</h3>
<pre><code class="language-ts">const videoSender = pc.getSenders().find((s) =&gt; s.track?.kind === 'video')!;

export async function startScreenShare() {
  const display = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 15 }, audio: false });
  const [screen] = display.getVideoTracks();
  screen.contentHint = 'detail';                 // favour sharpness (text) over motion
  await videoSender.replaceTrack(screen);        // same m= line, no new offer
  screen.addEventListener('ended', () =&gt; videoSender.replaceTrack(cameraTrack)); // browser "Stop sharing"
}
// Want camera AND screen at once? addTrack(screen) instead — that needs renegotiation,
// which perfect negotiation handles automatically via negotiationneeded.</code></pre>

<h3>Example 5 — a call-quality sampler you can ship</h3>
<pre><code class="language-ts">type Quality = {
  rttMs?: number; lossPct?: number; jitterMs?: number; inKbps?: number;
  candidateType?: string; relayProtocol?: string; limitedBy?: string;
};

let prev: { ts: number; bytes: number; recv: number; lost: number } | undefined;

export async function sampleQuality(pc: RTCPeerConnection): Promise&lt;Quality&gt; {
  const stats = await pc.getStats();
  const byId = new Map&lt;string, any&gt;();
  stats.forEach((s: any) =&gt; byId.set(s.id, s));

  let audioIn: any, videoOut: any, pair: any;
  stats.forEach((s: any) =&gt; {
    if (s.type === 'inbound-rtp' &amp;&amp; s.kind === 'audio') audioIn = s;
    if (s.type === 'outbound-rtp' &amp;&amp; s.kind === 'video') videoOut = s;
    if (s.type === 'transport' &amp;&amp; s.selectedCandidatePairId) pair = byId.get(s.selectedCandidatePairId);
  });
  if (!pair) stats.forEach((s: any) =&gt; { if (s.type === 'candidate-pair' &amp;&amp; s.selected) pair = s; }); // Firefox

  const q: Quality = {};
  if (pair) {
    q.rttMs = pair.currentRoundTripTime != null ? pair.currentRoundTripTime * 1000 : undefined;
    const lc = byId.get(pair.localCandidateId);
    q.candidateType = lc?.candidateType;          // 'relay' =&gt; this call is costing TURN bandwidth
    q.relayProtocol = lc?.relayProtocol;          // 'tls' =&gt; firewall forced TURN over 443
  }
  if (audioIn) {
    q.jitterMs = audioIn.jitter * 1000;
    if (prev) {
      const dt = (audioIn.timestamp - prev.ts) / 1000;
      const recv = audioIn.packetsReceived - prev.recv;
      const lost = audioIn.packetsLost - prev.lost;
      q.lossPct = recv + lost &gt; 0 ? (100 * lost) / (recv + lost) : 0;
      q.inKbps = ((audioIn.bytesReceived - prev.bytes) * 8) / 1000 / dt;
    }
    prev = { ts: audioIn.timestamp, bytes: audioIn.bytesReceived, recv: audioIn.packetsReceived, lost: audioIn.packetsLost };
  }
  q.limitedBy = videoOut?.qualityLimitationReason;  // 'cpu' on an overheating phone, 'bandwidth' on bad Wi-Fi
  return q;
}

// Rule-of-thumb thresholds for a "poor connection" banner — tune with your own data
export const isPoor = (q: Quality) =&gt;
  (q.lossPct ?? 0) &gt; 5 || (q.rttMs ?? 0) &gt; 400 || (q.jitterMs ?? 0) &gt; 50;

// Sample every 2 s; ship a summary (p50/p95 + candidateType) to your backend at hang-up.</code></pre>

<h3>Example 6 — WHIP publish (HTTP signalling, no WebSocket)</h3>
<pre><code class="language-ts">export async function whipPublish(endpoint: string, token: string, stream: MediaStream) {
  const pc = new RTCPeerConnection();
  stream.getTracks().forEach((t) =&gt; pc.addTransceiver(t, { direction: 'sendonly' }));
  await pc.setLocalDescription(await pc.createOffer());
  await waitForIceGathering(pc, 2000);           // non-trickle: candidates baked into the SDP

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/sdp', Authorization: 'Bearer ' + token },
    body: pc.localDescription!.sdp,
  });
  if (res.status !== 201) throw new Error('WHIP publish failed: ' + res.status);
  const resource = new URL(res.headers.get('Location')!, endpoint).toString();
  await pc.setRemoteDescription({ type: 'answer', sdp: await res.text() });

  return async function stop() {
    pc.close();
    await fetch(resource, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
  };
}

function waitForIceGathering(pc: RTCPeerConnection, timeoutMs: number) {
  return new Promise&lt;void&gt;((resolve) =&gt; {
    if (pc.iceGatheringState === 'complete') return resolve();
    const t = setTimeout(resolve, timeoutMs);    // don't hang forever on a slow TURN server
    pc.addEventListener('icegatheringstatechange', () =&gt; {
      if (pc.iceGatheringState === 'complete') { clearTimeout(t); resolve(); }
    });
  });
}</code></pre>
<p>This "POST an SDP offer, get an SDP answer back" shape is exactly how a browser connects to the <a href="#/topic/ai-realtime-voice">OpenAI Realtime API</a> over WebRTC.</p>

<h3>Example 7 — React Native with react-native-webrtc</h3>
<pre><code class="language-tsx">import React, { useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform, View } from 'react-native';
import { RTCPeerConnection, RTCView, mediaDevices, MediaStream } from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';

export function CallScreen({ iceServers, signal }: Props) {
  const pcRef = useRef&lt;RTCPeerConnection | null&gt;(null);
  const [local, setLocal] = useState&lt;MediaStream | null&gt;(null);
  const [remote, setRemote] = useState&lt;MediaStream | null&gt;(null);

  useEffect(() =&gt; {
    let stream: MediaStream | null = null;
    (async () =&gt; {
      if (Platform.OS === 'android') {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
      }
      stream = await mediaDevices.getUserMedia({ audio: true, video: { facingMode: 'user', frameRate: 30 } });
      setLocal(stream);
      InCallManager.start({ media: 'video' });       // audio routing, proximity, keep-awake
      InCallManager.setForceSpeakerphoneOn(true);

      const pc = new RTCPeerConnection({ iceServers });
      pcRef.current = pc;
      stream.getTracks().forEach((t) =&gt; pc.addTrack(t, stream!));
      pc.addEventListener('track', (e: any) =&gt; setRemote(e.streams[0]));
      wirePerfectNegotiation(pc, signal);            // same logic as web
    })();

    return () =&gt; {
      stream?.getTracks().forEach((t) =&gt; t.stop());
      pcRef.current?.close();
      InCallManager.stop();
    };
  }, []);

  return (
    &lt;View style={{ flex: 1 }}&gt;
      {remote &amp;&amp; &lt;RTCView streamURL={remote.toURL()} objectFit="cover" style={{ flex: 1 }} /&gt;}
      {local &amp;&amp; &lt;RTCView streamURL={local.toURL()} mirror objectFit="cover" style={{ width: 110, height: 160, position: 'absolute', right: 16, top: 16 }} /&gt;}
    &lt;/View&gt;
  );
}</code></pre>
<ul>
  <li><strong>Expo:</strong> not in Expo Go — use a dev client + the <code>@config-plugins/react-native-webrtc</code> config plugin.</li>
  <li><strong>iOS:</strong> <code>NSCameraUsageDescription</code>, <code>NSMicrophoneUsageDescription</code>; <code>UIBackgroundModes</code> <code>audio</code> (and <code>voip</code> with CallKit) to survive backgrounding.</li>
  <li><strong>Android:</strong> <code>CAMERA</code>, <code>RECORD_AUDIO</code>, <code>MODIFY_AUDIO_SETTINGS</code>, <code>BLUETOOTH_CONNECT</code> (12+); a foreground service with the right type (microphone/camera on Android 14+) to keep capturing in the background.</li>
  <li><strong>Native call UI:</strong> CallKit (iOS) / ConnectionService (Android) via <code>react-native-callkeep</code>; incoming calls when the app is killed need VoIP push (PushKit) — a project in itself.</li>
  <li><strong>Simulator:</strong> the iOS simulator has no camera; test media on devices.</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. "Works in the office, fails for customers"</h3>
<p>Dev machines share a LAN (host candidates connect instantly). Real users sit behind symmetric NAT, CGNAT on mobile, or firewalls that block UDP. If you only configured STUN, those calls sit in <code>connecting</code> then go <code>failed</code>. Fix: TURN on UDP + TCP + TLS/443, and test with <code>iceTransportPolicy: 'relay'</code> to prove the relay path works.</p>

<h3>2. One-way audio or video</h3>
<p>Classic causes: a transceiver negotiated as <code>sendonly</code>/<code>recvonly</code> by mistake; the track was added after the answer and nobody renegotiated; a firewall allows outbound UDP but drops inbound on some ports; a remote <code>&lt;video&gt;</code> that was never <code>play()</code>ed due to autoplay policy. Check <code>inbound-rtp.bytesReceived</code> growing on both sides — that splits "network" from "rendering".</p>

<h3>3. Candidates arriving before the remote description</h3>
<p>Modern browsers chain <code>addIceCandidate</code> behind a pending <code>setRemoteDescription</code>, but older stacks (and some native wrappers) throw <code>InvalidStateError</code>. Defensive code queues candidates until <code>pc.remoteDescription</code> is set, then flushes.</p>

<h3>4. Glare during renegotiation</h3>
<p>Both sides add a track at once → both send offers → <code>have-local-offer</code> on both ends. Without the polite/impolite rule (Mechanics §5), the call wedges.</p>

<h3>5. Network switch (Wi-Fi → LTE, VPN toggled)</h3>
<p>The selected candidate pair's address disappears. State goes <code>disconnected</code>; it won't come back by itself because the old path is gone. You need <code>restartIce()</code> + a new offer — which needs your signalling socket, which also just dropped. Order: reconnect signalling (with backoff) → ICE restart → media resumes. SFU SDKs like LiveKit do this for you ("resume" vs full reconnect).</p>

<h3>6. Autoplay policies</h3>
<p>Browsers block unmuted autoplay without a user gesture. Safari also needs <code>playsinline</code> on iOS video. Symptom: connected, packets flowing, silence. Handle the <code>play()</code> rejection and show a "tap to enable audio" button.</p>

<h3>7. Echo and feedback</h3>
<p>Keep <code>echoCancellation: true</code>. AEC needs the far-end audio as a reference; unusual playback paths (routing remote audio through custom Web Audio graphs, external loudspeakers on meeting-room hardware) can degrade it in some browsers. On a meeting-room tablet with a separate speaker bar, test AEC on the actual hardware.</p>

<h3>8. Device changes mid-call</h3>
<p>AirPods connect → the OS switches input; the old track may end. Listen for <code>devicechange</code> and track <code>ended</code>, re-acquire with <code>getUserMedia</code>, and <code>replaceTrack</code>. On mobile, the OS (or CallKit) owns routing — use the native audio session APIs.</p>

<h3>9. Frozen video after loss</h3>
<p>A lost packet breaks the decode chain until the next keyframe. The receiver sends PLI; the sender emits a keyframe (big burst). If PLIs are rate-limited or the uplink is congested, video freezes for seconds. Watch <code>freezeCount</code> and <code>pliCount</code>.</p>

<h3>10. TURN credentials expiring</h3>
<p>Time-limited credentials are checked when the allocation is made/refreshed. Give them a TTL longer than your longest call, and if a long call later needs an ICE restart, fetch fresh <code>iceServers</code> and call <code>pc.setConfiguration()</code> before restarting.</p>

<h3>11. Data channel message too large / buffer runaway</h3>
<p>Messages above the peer's max-message-size fail (often by closing the channel). Unthrottled <code>send()</code> in a loop grows <code>bufferedAmount</code> until memory or the SCTP stack gives up. Chunk to ≤ 16 KB and use <code>bufferedamountlow</code>.</p>

<h3>12. Background tabs and mobile backgrounding</h3>
<p>Backgrounded tabs throttle timers (your stats sampler and heartbeats slow down). iOS suspends the app and kills the mic unless you're in an audio/VoIP background mode; Android needs a typed foreground service. A "call dropped when user checked WhatsApp" bug is almost always this.</p>

<h3>13. Safari and codec interop</h3>
<p>Safari historically preferred H.264 and lagged on VP9/AV1, simulcast behaviour, and some stats fields. Always negotiate (never assume a codec), and keep an H.264 path for older iOS devices.</p>

<h3>14. CPU-limited senders</h3>
<p><code>qualityLimitationReason: 'cpu'</code> on a low-end Android or hot phone means the encoder is dropping resolution because of CPU, not network. Fix with fewer simulcast layers, lower capture resolution, or a hardware-accelerated codec — more bandwidth won't help.</p>

<h3>15. Huge rooms on one SFU node</h3>
<p>Every subscriber adds forwarding work. A 500-person webinar on a single node hits CPU/NIC limits; you need cascading SFUs (rooms spanning nodes) or a hybrid where the stage is WebRTC and the audience gets LL-HLS.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — shipping without TURN</h3>
<p>"Public Google STUN is in the config, it works." It works for maybe 80–90% of users and silently fails for the rest — disproportionately enterprise customers. TURN is not optional.</p>

<h3>Anti-pattern 2 — static TURN credentials in the client bundle</h3>
<p>Scraped within weeks; your relay becomes a free bandwidth proxy and your bill spikes. Issue time-limited HMAC credentials from an authenticated endpoint.</p>

<h3>Anti-pattern 3 — unauthenticated signalling</h3>
<p>Anyone who guesses a room id can join, and anyone who can inject into signalling can swap DTLS fingerprints. Authenticate the WebSocket at upgrade time, authorise room membership, and use TLS.</p>

<h3>Anti-pattern 4 — mesh for "small" groups of 6–10</h3>
<p>Each participant encodes and uploads N−1 copies. Phones overheat and uplinks saturate around 4 participants. Use an SFU beyond 3–4.</p>

<h3>Anti-pattern 5 — renegotiating to switch camera or start screen share</h3>
<p>Tearing down the PC or adding/removing tracks for a simple swap causes glitches and glare. <code>sender.replaceTrack()</code> swaps the source with zero negotiation.</p>

<h3>Anti-pattern 6 — SDP munging as a first resort</h3>
<p>Regex-editing SDP to force codecs or bitrates breaks across browser versions. Use <code>setCodecPreferences</code>, <code>setParameters</code> and <code>sendEncodings</code>; munge only with tests pinned to browser versions.</p>

<h3>Anti-pattern 7 — no failure handling on connectionState</h3>
<p>No <code>restartIce</code>, no timeout, no "reconnecting" UI — users stare at a frozen frame. Treat <code>disconnected</code> and <code>failed</code> as first-class states.</p>

<h3>Anti-pattern 8 — not stopping tracks / not closing PCs</h3>
<p>The camera light stays on after hang-up (privacy complaint), or every call leaks a peer connection and its sockets. Stop every track, close the PC, close signalling.</p>

<h3>Anti-pattern 9 — streaming media over WebSocket "because it's simpler"</h3>
<p>Fine server-to-server; terrible for a user's flaky mobile link: no jitter buffer, no congestion control, head-of-line blocking, 10× the bandwidth of Opus. If the client is a phone or browser, use WebRTC.</p>

<h3>Anti-pattern 10 — no call-quality telemetry</h3>
<p>When a customer reports "calls are bad", you have nothing. Sample <code>getStats</code>, upload a summary per call (p95 RTT, loss, jitter, candidate type, limitation reason), and you can answer in minutes.</p>

<h3>Anti-pattern 11 — assuming the SFU can't see media</h3>
<p>DTLS-SRTP terminates at the SFU. If the requirement is "the provider must not be able to access call content", you need frame-level E2EE — and then server-side recording/transcription won't work. Surface that trade-off explicitly.</p>

<h3>Anti-pattern 12 — building your own SFU</h3>
<p>Simulcast layer switching, bandwidth estimation, keyframe management, reconnection, recording — years of work. Use LiveKit, mediasoup, Janus, or a managed service unless media infrastructure <em>is</em> your product.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. Walk me through how a WebRTC call is established, end to end.</div>
  <div class="qa-answer">
    <p>Both clients authenticate to a signalling server I own (usually a WebSocket). The caller captures media, adds tracks to an <code>RTCPeerConnection</code> configured with STUN/TURN servers, creates an SDP <strong>offer</strong> (tracks, codecs, DTLS fingerprint, ICE credentials), sets it as local description and sends it through signalling. The callee sets it as remote description, adds its tracks, creates an <strong>answer</strong> and sends it back. Meanwhile both sides gather ICE candidates — host, server-reflexive from STUN, relay from TURN — and trickle them over signalling. ICE pairs candidates, runs STUN connectivity checks, and nominates a working pair. Then DTLS handshakes over that path, SRTP keys are derived, <code>ontrack</code> fires, and media flows over UDP — directly, or via TURN if NAT prevented direct.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. If WebRTC is peer-to-peer, why do you need servers at all?</div>
  <div class="qa-answer">
    <p>Peers can't find each other on their own. You need (1) <strong>signalling</strong> to exchange SDP and candidates — deliberately left out of the spec so you can use whatever transport and auth you have; (2) <strong>STUN</strong> so a peer behind NAT learns its public address; (3) <strong>TURN</strong> to relay media when NATs or firewalls block a direct path; and for groups, (4) an <strong>SFU</strong>, because mesh doesn't scale. "P2P" describes the best-case media path, not the system.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. STUN vs TURN vs ICE — one sentence each, then: when does direct P2P fail?</div>
  <div class="qa-answer">
    <p><strong>STUN</strong> tells you your public IP:port as seen from outside. <strong>TURN</strong> allocates a relay address and forwards your media. <strong>ICE</strong> is the framework that gathers all candidate addresses, tests pairs, and picks the best working one. Direct fails when a NAT uses address-and-port-dependent mapping (symmetric NAT — common with CGNAT on mobile), because the public port STUN observed isn't the one the peer would reach; and when UDP is blocked outright (corporate networks), where only TURN over TCP or TLS on 443 gets through. Measured TURN usage is commonly 10–20%, higher for enterprise/mobile audiences.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Design video for a 10-person team meeting. Mesh, SFU or MCU?</div>
  <div class="qa-answer">
    <p>SFU. In mesh each client would upload nine copies — about 9 Mbps at 1 Mbps per stream and nine encoders, which no phone survives. An MCU would decode, composite and re-encode ten streams — high server CPU, extra latency and a fixed layout. An SFU receives one simulcast upload per publisher (~2 Mbps for three layers) and forwards packets without decoding; each subscriber gets the layer that fits its bandwidth and tile size (adaptive stream), and publishers stop encoding layers nobody watches (dynacast). Signalling over WebSocket to the SFU, TURN embedded or alongside, recording via a separate egress worker. I'd use LiveKit or mediasoup rather than build one. MCU still has a niche: mixing for SIP/PSTN legacy endpoints that can only take one stream.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Simulcast vs SVC — what's the difference and when do you pick each?</div>
  <div class="qa-answer">
    <p>Simulcast encodes the same source two or three times at different resolutions/bitrates as independent streams; the SFU switches which stream a subscriber receives. Works with VP8 and H.264, i.e. everywhere, but the publisher pays CPU and ~1.4× uplink. SVC produces one stream with embedded temporal/spatial layers (e.g. <code>L3T3</code>); the SFU drops layers per subscriber. More uplink-efficient and switches faster, but needs VP9/AV1 and SFU support. Default to simulcast for compatibility; consider SVC when your client mix and SFU support it, especially for screen share.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Is WebRTC encrypted? Can your SFU vendor listen to calls?</div>
  <div class="qa-answer">
    <p>Always encrypted: DTLS for key exchange, SRTP for media, SCTP-over-DTLS for data, and the certificate fingerprint travels in the SDP — so signalling integrity matters. But it's <strong>hop-by-hop</strong>: client↔SFU. The SFU decrypts to route, so the operator can technically access media (which is also what makes server-side recording and transcription possible). For end-to-end, add frame-level encryption with Encoded Transforms/Insertable Streams (SFrame-style) and keys distributed outside the SFU — and accept that server-side recording, transcription or AI agents then can't see the content.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Users say "video is choppy". How do you debug it?</div>
  <div class="qa-answer">
    <p>Data first. From <code>getStats</code> (or a webrtc-internals dump): is it the <em>sender</em> or the <em>receiver</em>? On the sender, <code>outbound-rtp.qualityLimitationReason</code> says <code>cpu</code> (device can't encode — lower resolution/layers, hardware codec) or <code>bandwidth</code> (uplink congested — check <code>availableOutgoingBitrate</code>). On the receiver, <code>inbound-rtp</code> loss %, jitter, <code>framesDropped</code>, <code>freezeCount</code> and <code>pliCount</code> separate network loss from decode trouble. <code>candidate-pair</code> RTT and the local candidate type tell me if we're relayed — TURN over TCP/TLS adds latency and TCP-style stalls. Then segment: one user, one network, one device model, or everyone (server issue)?</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. FDE scenario — a customer says: "Calls never connect for people in our head office, but work from home." What do you do?</div>
  <div class="qa-answer">
    <p>That pattern screams network policy, not code. (1) Ask for a <code>chrome://webrtc-internals</code> dump or our telemetry from an office user: I expect ICE stuck in <code>checking</code> then <code>failed</code>, with only host/srflx candidates or relay candidates that never succeed. (2) Hypothesis: the corporate firewall blocks outbound UDP and non-443 ports. (3) Verify our TURN offers <code>turns:</code> on TCP 443 with a valid certificate; test from their network with <code>iceTransportPolicy: 'relay'</code>. (4) If TLS-inspecting proxies break it, give their IT an allow-list (TURN/SFU domains and IPs, UDP port range) — written up so their network team can action it. (5) Afterwards add an alert on "ICE failure rate by customer/ASN" so we see it before they call. Tell them clearly what changed and the expected latency trade-off (TCP relay is slightly worse).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. A mobile user walks out of Wi-Fi range mid-call. What happens, and how should the app recover?</div>
  <div class="qa-answer">
    <p>The nominated pair's local address vanishes, consent checks fail, <code>connectionState</code> goes <code>disconnected</code>. It won't heal on its own because the path is gone. The app must: reconnect signalling (it also dropped) with backoff; then <code>pc.restartIce()</code>, which regathers candidates on the new interface with new ICE credentials and produces a new offer; media resumes on the new pair without recreating tracks. If the restart fails within a timeout, rebuild the peer connection. Show "reconnecting" throughout. SFU SDKs typically do a quick "resume" first and fall back to a full reconnect.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. Data channel or WebSocket for a multiplayer game's position updates?</div>
  <div class="qa-answer">
    <p>For position updates, an unordered, unreliable data channel (<code>ordered: false, maxRetransmits: 0</code>): a stale position is worthless, so I don't want a lost packet blocking newer ones — which TCP would do. Keep the WebSocket for reliable things: auth, matchmaking, chat, purchases. Caveats: data channels need the whole ICE/DTLS setup (and TURN for some users), and server-side you need a WebRTC stack. WebTransport datagrams are the newer alternative for client↔server.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. How would you run and scale TURN, and what drives its cost?</div>
  <div class="qa-answer">
    <p>coturn (or the SFU's embedded TURN) on public-IP instances in each region, on UDP 3478, TCP 3478 and TLS 443, with time-limited HMAC credentials from the backend and <code>denied-peer-ip</code> for private ranges so the relay can't be used to reach internal networks. Cost is egress bandwidth: every relayed call carries its full bitrate through you, both directions — a 1.5 Mbps video call relayed for an hour is about 1.3 GB in + out. Scale horizontally behind DNS/geo routing (TURN is stateful per allocation, so no ordinary L7 load balancing). Monitor relay percentage per customer; a jump usually means a network change on their side.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. What changes when the client is a React Native app?</div>
  <div class="qa-answer">
    <p>Same API surface via <code>react-native-webrtc</code> (libwebrtc underneath), rendered with <code>RTCView</code> using <code>stream.toURL()</code>. The hard parts are OS integration: runtime permissions; audio routing (speaker vs earpiece vs Bluetooth) via an in-call manager or native audio session; background survival (iOS audio/VoIP background modes, Android typed foreground services); CallKit/ConnectionService for native call UI; VoIP push to ring a killed app; and battery/thermal — hardware codecs and fewer simulcast layers. With Expo you need a dev client and a config plugin. Network switching is far more common on phones, so ICE restart is not optional.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Follow-ups interviewers love</div>
  <ul>
    <li>"Why is the DTLS fingerprint in the SDP?" (Self-signed certs; the authenticated signalling channel is the trust anchor.)</li>
    <li>"What's the difference between <code>iceConnectionState</code> and <code>connectionState</code>?" (The latter aggregates ICE <em>and</em> DTLS.)</li>
    <li>"What does <code>replaceTrack</code> avoid?" (Renegotiation — same transceiver, new source.)</li>
    <li>"Why might a call go through TURN even when P2P is possible?" (ICE picked relay because direct checks hadn't succeeded yet, or <code>iceTransportPolicy: 'relay'</code> for privacy.)</li>
    <li>"How is WHIP different from your WebSocket signalling?" (One HTTP POST per session, non-trickle by default, standard resource URL to DELETE.)</li>
  </ul>
</div>
` },

  ]
});
