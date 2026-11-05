window.PREP_SITE.registerTopic({
  id: "ai-livekit",
  module: "ai",
  title: "LiveKit",
  estimatedReadTime: "55 min",
  tags: ["livekit","webrtc","sfu","voice-ai","agents","access-tokens","sip","telephony","egress","react-native","scaling"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">LiveKit is an <strong>open-source WebRTC SFU plus SDKs, an agents framework, SIP and egress</strong>: your backend mints a scoped JWT, clients join a room, an agent worker is dispatched in as a participant running VAD → STT → LLM → TTS (or a realtime model), and phone callers arrive as SIP participants.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Why not raw WebRTC:</strong> LiveKit (Go, on the Pion stack; self-host or Cloud) absorbs the hard parts — signalling, rooms, auth, SFU routing with simulcast, embedded TURN, reconnection, mobile audio sessions, recording and phone dial-in.</li>
    <li><strong>Objects:</strong> Room → Participants (unique identity; kinds incl. agent and SIP) → Track publications (mic/camera/screen) → subscriptions; plus data packets, text/byte streams and RPC.</li>
    <li><strong>Tokens:</strong> JWT signed with API key/secret; identity from your auth; grants scoped to one room; no admin grants on clients; TTL in minutes.</li>
    <li><strong>SFU routing:</strong> publish once (simulcast), forward without decoding; <strong>adaptive stream</strong> (send what's rendered) and <strong>dynacast</strong> (stop unused layers).</li>
    <li><strong>Server APIs:</strong> RoomService (create/list/remove/mute/delete), AgentDispatch, SIP, Egress; <strong>webhooks</strong> signed, at-least-once, unordered → dedupe and enqueue.</li>
    <li><strong>Agents:</strong> worker registers → server dispatches a job → entrypoint connects → <code>AgentSession</code> runs the pipeline; <code>agent_name</code> = explicit dispatch only; prewarm VAD; tools via <code>@function_tool</code>; handoffs by returning another Agent.</li>
    <li><strong>Turn-taking:</strong> VAD + STT endpointing + an end-of-utterance model; interruptions stop TTS and keep only what was played in context.</li>
    <li><strong>Realtime option:</strong> swap the cascade for <code>openai.realtime.RealtimeModel</code> — same agent and tools, transport unchanged.</li>
    <li><strong>SIP:</strong> inbound trunk + dispatch rule (room per caller + agent); outbound via SIP participant on an outbound trunk; 8 kHz audio, DTMF, REFER transfers, carrier channel limits.</li>
    <li><strong>Egress</strong> (room composite / participant / track) to S3/GCS — CPU-heavy, separate pool; <strong>Ingress</strong> brings RTMP/WHIP in.</li>
    <li><strong>Self-host:</strong> host networking, UDP range, TURN/TLS on 443, Redis for multi-node, room on one node, graceful drain. <strong>Cloud:</strong> global mesh, managed everything, usage pricing.</li>
    <li><strong>Scale bottlenecks:</strong> agent CPU (local models) and provider quotas/regions, not the SFU, for voice agents.</li>
    <li><strong>Clients:</strong> <code>livekit-client</code> (handle <code>startAudio</code> for autoplay), React components, <code>@livekit/react-native</code> with <code>registerGlobals</code> + <code>AudioSession</code>.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Trusting the client for identity and context.</strong> A token endpoint that takes identity/room from the request, or an agent that reads tenant/role from client-editable metadata, lets users impersonate others and escalate. Fix: derive identity from your auth, scope grants to one unguessable room, pass trusted context via server-side dispatch metadata, and re-authorise every tool call in your API.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"LiveKit is a WebRTC SFU with SDKs, an agents framework and SIP — the agent joins the room as a participant, so app users, phone callers and recording all work with the same agent code."</div>
  <div class="revision-say">"My backend mints a short-lived JWT scoped to one room with identity from our auth, and dispatches the agent with trusted metadata — the client never describes who it is."</div>
  <div class="revision-say">"For latency I read the per-turn metrics — endpointing, STT, LLM time-to-first-token, TTS — and fix placement first: user, LiveKit edge, agent worker and model providers in the same region."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What problem LiveKit solves</h3>
<p>Raw WebRTC gives you a peer connection. A product needs rooms, auth, group calls, mobile reconnection, recording, phone dial-in, and — now — AI agents that join calls. Each of those is months of media engineering:</p>
<table>
  <thead><tr><th>You'd have to build</th><th>LiveKit gives you</th></tr></thead>
  <tbody>
    <tr><td>Signalling server, room state, presence</td><td>Built into the server; WebSocket signalling handled by the SDKs</td></tr>
    <tr><td>An SFU with simulcast layer switching and bandwidth estimation</td><td>The core server; adaptive stream + dynacast in the client SDKs</td></tr>
    <tr><td>TURN deployment and credentials</td><td>Embedded TURN (TLS/UDP) on the server; Cloud runs it for you</td></tr>
    <tr><td>Reconnect on network change, ICE restarts</td><td>SDK "resume" then full reconnect, with events for your UI</td></tr>
    <tr><td>iOS/Android/RN audio session handling</td><td>Native SDKs + <code>@livekit/react-native</code></td></tr>
    <tr><td>Recording, RTMP/HLS out, RTMP/WHIP in</td><td>Egress and Ingress services</td></tr>
    <tr><td>PSTN/SIP bridging</td><td>LiveKit SIP (inbound + outbound, DTMF, transfers)</td></tr>
    <tr><td>Voice-agent orchestration (VAD, STT, LLM, TTS, interruptions)</td><td>Agents framework (Python first, Node.js too) with provider plugins</td></tr>
  </tbody>
</table>

<h3>Why it became the default transport for voice AI</h3>
<ul>
  <li><strong>The agent is a participant.</strong> It joins the same room as the human, so you get media transport near the user, multi-party (human + agent + supervisor), recording and telephony "for free".</li>
  <li><strong>Provider-agnostic pipeline.</strong> Swap Deepgram for another STT, GPT for another LLM, or the whole cascade for a realtime model, by changing plugin lines — clients don't change.</li>
  <li><strong>Turn-taking is solved at the framework level</strong>: VAD, an end-of-utterance model, interruption handling with context truncation, noise cancellation.</li>
  <li><strong>Server-side tools.</strong> The agent runs in your infrastructure next to your APIs and secrets — unlike a browser-direct Realtime connection where tool calls arrive on the client.</li>
</ul>

<h3>Where it sits among alternatives</h3>
<table>
  <thead><tr><th>Option</th><th>What it is</th><th>Pick it when</th></tr></thead>
  <tbody>
    <tr><td>Raw P2P WebRTC</td><td>Your own signalling + TURN</td><td>Strictly 1:1, tiny scope, no recording/agents</td></tr>
    <tr><td>LiveKit (OSS / Cloud)</td><td>SFU + SDKs + agents + SIP + egress</td><td>Group media and/or voice agents; want open source with a managed option</td></tr>
    <tr><td>mediasoup / Janus</td><td>SFU libraries / servers</td><td>You want to own signalling and room logic in detail</td></tr>
    <tr><td>Daily, Agora, Vonage, Twilio (managed video)</td><td>Hosted real-time platforms</td><td>Fully managed, vendor SDKs, less infra ownership</td></tr>
    <tr><td>Pipecat (by Daily)</td><td>Open-source Python voice-agent pipeline, transport-agnostic</td><td>You prefer its frame-based pipeline or a different transport</td></tr>
    <tr><td>Vapi / Retell-style platforms</td><td>Hosted voice-agent products (config + webhooks)</td><td>Fastest launch, least control, per-minute markup</td></tr>
    <tr><td>Direct OpenAI Realtime from the client</td><td>Browser ↔ model over WebRTC</td><td>One user, one model, no telephony/recording/multi-party</td></tr>
  </tbody>
</table>

<h3>When LiveKit is overkill</h3>
<ul>
  <li>A single user talking to a single model in a web app with no recording or phone — connect to the Realtime API directly.</li>
  <li>One-to-many broadcast to tens of thousands of passive viewers — HLS through a CDN (LiveKit Egress can produce it, but viewers shouldn't be WebRTC participants).</li>
  <li>Pure server-to-server audio streaming — a WebSocket is simpler.</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Picture 1 — the system</h3>
<div class="diagram">
<pre>
                    ┌──────────────── YOUR BACKEND ────────────────┐
                    │ auth → mint access token (API key/secret)     │
                    │ RoomService / AgentDispatch / SIP / Egress API│
                    │ webhook receiver → queue → post-call jobs     │
                    └───────▲──────────────────────────┬────────────┘
             token (JWT)    │                          │ server API (signed JWT)
  ┌──────────┐  WebSocket   │   ┌──────────────────────▼───────────┐   jobs   ┌──────────────────┐
  │ Web / RN │──signalling──┼──►│        LIVEKIT SERVER (SFU)      │◄────────►│ AGENT WORKERS     │
  │  client  │══WebRTC media═══►│ rooms · participants · tracks    │  WebRTC  │ (Python / Node)   │
  └──────────┘                  │ embedded TURN · Redis (multi-node)│◄════════►│ AgentSession:     │
  ┌──────────┐  SIP/RTP  ┌─────┐│                                   │          │ VAD→STT→LLM→TTS   │
  │  Phone   │──────────►│ SIP ├┤  Egress ──► S3/GCS (mp4, ogg, HLS)│          │ or realtime model │
  └──────────┘  (PSTN)   └─────┘│  Ingress ◄── RTMP / WHIP / URL    │          └────────┬─────────┘
                                └───────────────────────────────────┘                   │ HTTPS
                                                                    STT / LLM / TTS providers + your APIs
</pre>
</div>

<h3>Picture 2 — the object model</h3>
<table>
  <thead><tr><th>Concept</th><th>What it is</th><th>Things to know</th></tr></thead>
  <tbody>
    <tr><td><strong>Room</strong></td><td>A named session; created on first join or via API</td><td><code>emptyTimeout</code>, <code>maxParticipants</code>, room metadata; closes when empty</td></tr>
    <tr><td><strong>Participant</strong></td><td>A connection with a unique <code>identity</code> in a room</td><td>Kinds: standard, agent, SIP, egress, ingress. <code>name</code>, <code>metadata</code>, <code>attributes</code> (key/value, observable). Same identity joining again kicks the older one.</td></tr>
    <tr><td><strong>Track / TrackPublication</strong></td><td>A published media stream and its metadata</td><td>Source: microphone, camera, screen_share, screen_share_audio. Subscribers subscribe to <em>publications</em>.</td></tr>
    <tr><td><strong>Subscription</strong></td><td>Who receives which track</td><td>Auto-subscribe by default; selective subscription for large rooms</td></tr>
    <tr><td><strong>Data</strong></td><td>Packets (reliable/lossy), text and byte streams, RPC</td><td>Chat, UI commands, agent transcriptions, "show booking card" from the agent</td></tr>
  </tbody>
</table>

<h3>Picture 3 — agent lifecycle</h3>
<div class="diagram">
<pre>
 1. worker starts ──register (WebSocket)──► LiveKit server        "I can run agent 'booking-agent'"
 2. room needs an agent  (automatic on room start, OR explicit dispatch via API / token room config)
 3. server picks a worker with spare capacity ──► job request ──► worker accepts
 4. worker spawns/assigns a job process (prewarmed: VAD model already loaded)
 5. entrypoint(ctx): ctx.connect() → agent joins the room as a participant
 6. AgentSession.start(room, agent): subscribe to user audio, publish agent audio track
 7. loop: listen → detect end of turn → think (LLM + tools) → speak → handle interruptions
 8. user leaves / room closes → shutdown callbacks → job ends → capacity freed
</pre>
</div>
<p>A worker that sets an <code>agent_name</code> is <strong>only</strong> dispatched explicitly — the pattern you want in production so you control which rooms get which agent.</p>

<h3>Picture 4 — the voice pipeline inside AgentSession</h3>
<div class="diagram">
<pre>
 user audio track
   ─► noise cancellation (optional)
   ─► VAD (Silero)            "is someone speaking?"  ──► interruption signal while agent speaks
   ─► STT (streaming)         interim + final transcripts
   ─► turn detector (EOU)     "is the utterance finished?" (text model + silence timing)
   ─► LLM (+ function tools)  streamed tokens
   ─► TTS (streaming)         audio frames
   ─► agent audio track ──► user
 On interruption: stop TTS playout, drop the unsent text, and keep only what was actually
 spoken in the chat context (same idea as Realtime API truncation).

 Realtime variant:  user audio ─► speech-to-speech model (e.g. OpenAI Realtime) ─► agent audio
                    (VAD/turn detection can be the model's own or LiveKit's)
</pre>
</div>

<h3>Picture 5 — media routing (why it scales)</h3>
<ul>
  <li>Each publisher uploads <strong>once</strong> (with simulcast layers for video); the SFU forwards packets to subscribers without decoding.</li>
  <li><strong>Adaptive stream</strong>: the client SDK tells the SFU how big each video element is (and whether it's visible); the SFU sends a matching layer and pauses hidden tiles.</li>
  <li><strong>Dynacast</strong>: the SFU tells publishers to stop encoding layers that nobody is subscribed to — saves publisher CPU and uplink.</li>
  <li>Voice-agent rooms are typically <strong>2 audio-only participants</strong> — trivial for the SFU; the cost is in the agent and the model providers.</li>
</ul>
<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"The agent talks to OpenAI, so LiveKit is in the audio path to OpenAI." LiveKit carries audio between <em>participants</em> (user ↔ agent worker). The agent worker then talks to STT/LLM/TTS providers over their own APIs (HTTPS/WebSocket). Placement of all three — user, LiveKit node, worker + providers — decides latency.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<div class="callout note"><div class="callout-title">Version note</div><p>SDK method names below match the LiveKit SDKs at time of writing (server SDK v2, client SDK v2, Agents 1.x). LiveKit iterates quickly — anything marked "verify" has changed shape before or is newer; check current docs before pasting.</p></div>

<h3>1. Access tokens and grants</h3>
<pre><code class="language-ts">import { AccessToken } from 'livekit-server-sdk';

export async function joinToken(user: { id: string; firstName: string }, roomName: string) {
  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: 'user:' + user.id,           // unique per participant; derived from YOUR auth, never client input
    name: user.firstName,                   // display name
    ttl: '10m',                             // only needs to be valid at connect time
    metadata: JSON.stringify({ role: 'member' }),
  });
  at.addGrant({
    roomJoin: true,
    room: roomName,                         // scoped to ONE room
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });
  return at.toJwt();                        // async in server SDK v2
}</code></pre>
<table>
  <thead><tr><th>Grant</th><th>Meaning</th><th>Client token?</th></tr></thead>
  <tbody>
    <tr><td><code>roomJoin</code> + <code>room</code></td><td>May join this specific room</td><td>Yes</td></tr>
    <tr><td><code>canPublish</code> / <code>canSubscribe</code> / <code>canPublishData</code></td><td>Send media / receive media / send data</td><td>Yes — a viewer gets <code>canPublish: false</code></td></tr>
    <tr><td><code>canPublishSources</code></td><td>Restrict to e.g. microphone only (no camera/screen)</td><td>Yes — good for voice-only apps</td></tr>
    <tr><td><code>canUpdateOwnMetadata</code></td><td>Participant may change its own name/metadata/attributes</td><td>Usually no</td></tr>
    <tr><td><code>hidden</code></td><td>Invisible participant (monitoring, QA supervisors)</td><td>Server-issued only</td></tr>
    <tr><td><code>roomCreate</code>, <code>roomList</code>, <code>roomAdmin</code>, <code>roomRecord</code></td><td>Server-side administration</td><td><strong>Never</strong> in a client token</td></tr>
  </tbody>
</table>
<p>The token is checked when the client connects; the SDK handles resumes after that. Keep TTLs short (minutes) — the SDK default is hours. For long sessions, LiveKit can refresh the token over the signalling connection so a later full reconnect still works (verify current behaviour).</p>

<h3>2. Server APIs (Node)</h3>
<pre><code class="language-ts">import { RoomServiceClient, AgentDispatchClient } from 'livekit-server-sdk';

const host = process.env.LIVEKIT_URL!;   // https://... form for server APIs
const rooms = new RoomServiceClient(host, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);
const dispatch = new AgentDispatchClient(host, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);

await rooms.createRoom({ name: roomName, emptyTimeout: 120, maxParticipants: 4 });
const participants = await rooms.listParticipants(roomName);
await rooms.removeParticipant(roomName, 'user:42');                 // kick
await rooms.mutePublishedTrack(roomName, 'user:42', trackSid, true); // moderator mute
await rooms.updateRoomMetadata(roomName, JSON.stringify({ topic: 'Q3 review' }));
await rooms.deleteRoom(roomName);                                    // ends it for everyone

// Explicit agent dispatch (verify signature)
await dispatch.createDispatch(roomName, 'booking-agent', {
  metadata: JSON.stringify({ userId: '42', tenantId: 'acme' }),
});</code></pre>

<h3>3. Webhooks</h3>
<p>LiveKit POSTs events to your endpoint, signed with a JWT in the <code>Authorization</code> header (it includes a hash of the body). Events include <code>room_started</code>, <code>room_finished</code>, <code>participant_joined</code>, <code>participant_left</code>, <code>track_published</code>, <code>track_unpublished</code>, <code>egress_started</code>, <code>egress_updated</code>, <code>egress_ended</code>, <code>ingress_started</code>, <code>ingress_ended</code>.</p>
<pre><code class="language-ts">import express from 'express';
import { WebhookReceiver } from 'livekit-server-sdk';

const receiver = new WebhookReceiver(process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!);

app.post('/livekit/webhook', express.raw({ type: 'application/webhook+json' }), async (req, res) =&gt; {
  let event;
  try {
    event = await receiver.receive(req.body.toString('utf8'), req.get('Authorization'));  // verifies signature
  } catch {
    return res.status(401).end();
  }
  // At-least-once + no ordering guarantee: dedupe on event id, make handlers idempotent
  if (await alreadyProcessed(event.id)) return res.status(200).end();

  switch (event.event) {
    case 'room_finished':
      await postCallQueue.send({ room: event.room?.name, endedAt: Date.now() });   // transcript → scoring
      break;
    case 'egress_ended':
      await recordings.markReady(event.egressInfo?.egressId, event.egressInfo?.fileResults);
      break;
    case 'participant_left':
      await sessions.close(event.room?.name, event.participant?.identity);
      break;
  }
  await markProcessed(event.id);
  res.status(200).end();               // ack fast; do heavy work on the queue
});</code></pre>
<p>Raw body matters: if a JSON body parser runs first, the signature check fails. Heavy work goes to a queue — see <a href="#/topic/be-queues">Queues</a>.</p>

<h3>4. Web client SDK</h3>
<pre><code class="language-ts">import { Room, RoomEvent, Track, DisconnectReason } from 'livekit-client';

const room = new Room({
  adaptiveStream: true,     // subscribe at rendered size; pause hidden video
  dynacast: true,           // publisher stops encoding unused layers
});

room
  .on(RoomEvent.TrackSubscribed, (track, _pub, participant) =&gt; {
    if (track.kind === Track.Kind.Audio) document.body.appendChild(track.attach()); // creates &lt;audio&gt;
    if (track.kind === Track.Kind.Video) tileFor(participant.identity).appendChild(track.attach());
  })
  .on(RoomEvent.TrackUnsubscribed, (track) =&gt; track.detach().forEach((el) =&gt; el.remove()))
  .on(RoomEvent.ActiveSpeakersChanged, (speakers) =&gt; highlight(speakers.map((s) =&gt; s.identity)))
  .on(RoomEvent.ConnectionQualityChanged, (quality, participant) =&gt; showQuality(participant.identity, quality))
  .on(RoomEvent.Reconnecting, () =&gt; banner('Reconnecting…'))
  .on(RoomEvent.Reconnected, () =&gt; banner(null))
  .on(RoomEvent.AudioPlaybackStatusChanged, () =&gt; {
    if (!room.canPlaybackAudio) showButton('Enable audio', () =&gt; room.startAudio()); // autoplay policy
  })
  .on(RoomEvent.Disconnected, (reason) =&gt; {
    if (reason === DisconnectReason.DUPLICATE_IDENTITY) toast('You joined from another device');
  });

const { serverUrl, token } = await fetch('/api/rooms/' + roomId + '/join', { method: 'POST' }).then((r) =&gt; r.json());
await room.connect(serverUrl, token);                 // wss://... URL
await room.localParticipant.setMicrophoneEnabled(true);
await room.localParticipant.setCameraEnabled(true);</code></pre>

<h3>5. Data, text streams and RPC</h3>
<pre><code class="language-ts">// Small packets: reliable (ordered, retransmitted) or lossy (UDP-like)
const enc = new TextEncoder();
await room.localParticipant.publishData(enc.encode(JSON.stringify({ type: 'reaction', emoji: '👍' })), {
  reliable: true,
  topic: 'reactions',
});
room.on(RoomEvent.DataReceived, (payload, participant, _kind, topic) =&gt; { /* decode by topic */ });

// RPC: the agent can ask the app to do something and await a result (verify method names)
room.localParticipant.registerRpcMethod('showBookingCard', async (data) =&gt; {
  const booking = JSON.parse(data.payload);
  openBookingSheet(booking);
  return JSON.stringify({ shown: true });
});

// Agent transcriptions arrive as text streams on a well-known topic (verify topic name)
room.registerTextStreamHandler('lk.transcription', async (reader, info) =&gt; {
  const text = await reader.readAll();
  appendTranscript(info.identity, text);
});</code></pre>
<p>Keep data packets small (low KB); for larger payloads use text/byte streams, or upload to storage and send a URL.</p>

<h3>6. React and React Native</h3>
<pre><code class="language-tsx">// React (components evolve — verify current names)
import { LiveKitRoom, RoomAudioRenderer, useVoiceAssistant, BarVisualizer } from '@livekit/components-react';

function AgentView() {
  const { state, audioTrack } = useVoiceAssistant();   // 'listening' | 'thinking' | 'speaking' ...
  return &lt;BarVisualizer state={state} trackRef={audioTrack} barCount={5} /&gt;;
}

export function VoicePanel({ serverUrl, token }: { serverUrl: string; token: string }) {
  return (
    &lt;LiveKitRoom serverUrl={serverUrl} token={token} connect audio video={false}&gt;
      &lt;AgentView /&gt;
      &lt;RoomAudioRenderer /&gt;
    &lt;/LiveKitRoom&gt;
  );
}</code></pre>
<pre><code class="language-ts">// React Native — once at app start
import { registerGlobals, AudioSession } from '@livekit/react-native';
registerGlobals();                     // installs WebRTC globals for livekit-client

// in the call screen
useEffect(() =&gt; {
  AudioSession.startAudioSession();    // configures the native audio session for a call
  return () =&gt; { AudioSession.stopAudioSession(); };
}, []);</code></pre>
<ul>
  <li>RN uses LiveKit's fork of <code>react-native-webrtc</code> (<code>@livekit/react-native-webrtc</code>); the components package works on RN too.</li>
  <li>Expo: dev client + LiveKit's Expo config plugin (and the WebRTC plugin). Not in Expo Go.</li>
  <li>Same OS chores as any RN call app: permissions, background audio/foreground service, Bluetooth routing — see <a href="#/topic/api-webrtc">WebRTC Deep</a>.</li>
</ul>

<h3>7. Agents framework (Python — the primary SDK)</h3>
<pre><code class="language-python"># agent.py — LiveKit Agents 1.x style; verify imports/params against current docs
from livekit.agents import Agent, AgentSession, JobContext, JobProcess, RunContext, WorkerOptions, cli, function_tool
from livekit.plugins import deepgram, openai, cartesia, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel


class Assistant(Agent):
    def __init__(self) -&gt; None:
        super().__init__(instructions="You are a concise, friendly voice assistant. One or two sentences per reply.")

    @function_tool
    async def get_office_hours(self, context: RunContext, site: str) -&gt; str:
        """Return opening hours for an office site.

        Args:
            site: The office site name, e.g. "Bengaluru" or "Pune".
        """
        return "9am to 7pm, Monday to Friday"


def prewarm(proc: JobProcess) -&gt; None:
    proc.userdata["vad"] = silero.VAD.load()           # load once per process, not per call


async def entrypoint(ctx: JobContext) -&gt; None:
    await ctx.connect()
    session = AgentSession(
        vad=ctx.proc.userdata["vad"],
        stt=deepgram.STT(model="nova-3"),
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=cartesia.TTS(),
        turn_detection=MultilingualModel(),            # end-of-utterance model
    )
    await session.start(room=ctx.room, agent=Assistant())
    await session.generate_reply(instructions="Greet the user and offer help.")


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm, agent_name="assistant"))</code></pre>
<ul>
  <li><strong>Worker vs job:</strong> <code>cli.run_app</code> starts a worker that registers with LiveKit; each dispatched room runs your <code>entrypoint</code> in a job process (a pool of prewarmed processes is kept ready).</li>
  <li><strong>Tools:</strong> <code>@function_tool</code> methods; the docstring and type hints become the schema. Return values go back to the LLM; raise a tool error type to signal failure (verify name). Returning another <code>Agent</code> from a tool performs a <strong>handoff</strong> (e.g. triage agent → billing agent).</li>
  <li><strong>Realtime model instead of the cascade:</strong> <code>AgentSession(llm=openai.realtime.RealtimeModel(voice="marin"))</code> — the same <code>Agent</code> and tools, speech-to-speech underneath.</li>
  <li><strong>Session controls:</strong> <code>session.say(text)</code> (fixed phrasing, e.g. legal disclosures), <code>session.generate_reply(...)</code>, <code>session.interrupt()</code>.</li>
  <li><strong>Node.js:</strong> <code>@livekit/agents</code> offers the same concepts (<code>defineAgent</code>, a voice <code>AgentSession</code>/<code>Agent</code>, plugins); Python usually gets features first — verify parity before choosing.</li>
</ul>

<h3>8. Turn detection and interruptions in Agents</h3>
<table>
  <thead><tr><th>Layer</th><th>Role</th><th>Knobs (names vary by version — verify)</th></tr></thead>
  <tbody>
    <tr><td>VAD (Silero)</td><td>Detects speech/silence on raw audio; fast, local CPU</td><td>activation threshold, min silence</td></tr>
    <tr><td>STT endpointing</td><td>Provider says "final transcript"</td><td>provider-specific endpointing ms</td></tr>
    <tr><td>Turn detector model</td><td>Small language model judging whether the transcript <em>sounds finished</em> ("my number is 98…" → wait)</td><td><code>min_endpointing_delay</code>, <code>max_endpointing_delay</code></td></tr>
    <tr><td>Interruptions</td><td>User speech during agent speech stops playout</td><td><code>allow_interruptions</code>, <code>min_interruption_duration</code> (ignore coughs/"mm-hm")</td></tr>
    <tr><td>Preemptive generation</td><td>Start the LLM on a likely-final transcript before the turn is confirmed</td><td>on/off (newer feature)</td></tr>
  </tbody>
</table>
<p>When the user interrupts, the framework stops TTS, discards unspoken text, and records in the chat context only what was actually played — the same reason the Realtime API needs truncation.</p>

<h3>9. Telephony (SIP)</h3>
<div class="diagram">
<pre>
 INBOUND:  caller ─► carrier number (Twilio/Telnyx/…) ─► SIP trunk ─► LiveKit SIP
           └─► inbound trunk matches number ─► dispatch rule: "individual room per caller,
               prefix call-" + room config dispatches 'booking-agent' ─► agent + SIP participant

 OUTBOUND: your backend ─► create room + dispatch agent ─► CreateSIPParticipant(outbound trunk,
           +91…) ─► carrier dials ─► callee answers ─► SIP participant joins the room
</pre>
</div>
<pre><code class="language-json">// inbound-trunk.json  (lk sip inbound create inbound-trunk.json) — verify schema
{ "trunk": { "name": "acme-inbound", "numbers": ["+918045550100"] } }

// dispatch-rule.json  (lk sip dispatch create dispatch-rule.json) — verify schema
{
  "dispatch_rule": {
    "name": "acme-inbound-agent",
    "rule": { "dispatchRuleIndividual": { "roomPrefix": "call-" } },
    "room_config": { "agents": [{ "agent_name": "booking-agent" }] }
  }
}</code></pre>
<ul>
  <li>The SIP participant has <code>kind: SIP</code> and attributes such as the caller's number (useful for lookup) — verify attribute keys.</li>
  <li><strong>Audio is 8 kHz narrowband</strong> (G.711) — choose STT models tuned for telephony and a telephony-tuned noise cancellation model.</li>
  <li>DTMF (keypad tones) arrive as events; warm/cold transfer to a human via SIP REFER (a transfer API on the SIP client — verify).</li>
  <li>The PSTN adds 100–200+ ms each way; your latency budget for phone is worse than for app users.</li>
</ul>

<h3>10. Egress and Ingress</h3>
<table>
  <thead><tr><th>Type</th><th>What it does</th><th>Use</th></tr></thead>
  <tbody>
    <tr><td>Room composite egress</td><td>Renders the room (headless browser layout) to MP4/OGG, HLS or RTMP</td><td>Meeting recordings, livestream to YouTube; audio-only mode for call recordings</td></tr>
    <tr><td>Participant egress</td><td>One participant's audio+video, composited</td><td>Per-speaker recordings</td></tr>
    <tr><td>Track egress</td><td>A single track, no transcoding</td><td>Cheap raw audio for transcription pipelines</td></tr>
    <tr><td>Ingress</td><td>RTMP / WHIP / file URL into a room as a participant</td><td>OBS streamers, pre-recorded media</td></tr>
  </tbody>
</table>
<p>Egress is CPU-heavy (room composite runs a browser + encoder per job): run it on separate nodes from the SFU and scale it independently. Outputs go to S3/GCS/Azure; completion arrives as <code>egress_ended</code> webhooks.</p>

<h3>11. Self-host vs LiveKit Cloud</h3>
<pre><code class="language-yaml"># livekit.yaml (abridged — verify keys against the current config reference)
port: 7880                    # HTTP + WebSocket signalling (put TLS in front, or use the built-in)
rtc:
  tcp_port: 7881              # ICE over TCP fallback
  port_range_start: 50000     # UDP media range — must be open in the security group
  port_range_end: 60000
  use_external_ip: true       # discover public IP on cloud VMs
redis:
  address: redis.internal:6379   # required for multi-node routing
keys:
  APIxxxxxxxx: REPLACE_WITH_SECRET
turn:
  enabled: true
  domain: turn.example.com
  tls_port: 5349              # often fronted on 443 for corporate firewalls
  udp_port: 3478
webhook:
  api_key: APIxxxxxxxx
  urls: [ "https://api.example.com/livekit/webhook" ]
room:
  empty_timeout: 300</code></pre>
<table>
  <thead><tr><th></th><th>Self-host (OSS)</th><th>LiveKit Cloud</th></tr></thead>
  <tbody>
    <tr><td>Cost model</td><td>Your VMs + bandwidth egress + ops time</td><td>Usage-based (participant/agent minutes, bandwidth) — verify pricing</td></tr>
    <tr><td>Networking</td><td>Host networking, wide UDP range, public IPs, TLS certs, TURN</td><td>Done; global edge</td></tr>
    <tr><td>Multi-node</td><td>Redis; a room lives on one node</td><td>Mesh where rooms can span nodes/regions</td></tr>
    <tr><td>Data residency</td><td>Full control (on-prem / customer VPC)</td><td>Region options — check if it meets the requirement</td></tr>
    <tr><td>Agents hosting</td><td>Your Kubernetes/ECS</td><td>Managed agent hosting available (verify)</td></tr>
    <tr><td>Pick when</td><td>Compliance/on-prem, very large steady volume, strong infra team</td><td>Speed, global users, small team, spiky load</td></tr>
  </tbody>
</table>
<p>Kubernetes notes for self-hosting: SFU pods typically need host networking (UDP port ranges don't play well with Services/NAT), one pod per node, and graceful draining on deploy so live rooms aren't cut. Agent workers are ordinary stateless deployments that drain active jobs before exiting.</p>

<h3>12. Scaling model</h3>
<ul>
  <li><strong>SFU:</strong> cost scales with packets forwarded ≈ Σ(publishers × subscribers). A 2-person audio room is tiny; a 50-person video room is not. Use LiveKit's published benchmarks as a starting point and load-test your shape with the CLI's load-test command.</li>
  <li><strong>Agent workers:</strong> each job runs local models (VAD, turn detector, noise cancellation) on CPU plus network calls to providers. Workers report load; the server stops dispatching to a worker above its load threshold. Autoscale on CPU or active jobs; keep headroom because a job can't move mid-call.</li>
  <li><strong>Providers:</strong> STT/LLM/TTS concurrency and rate limits are usually the first wall at scale. Request quotas early; use fallback adapters / secondary providers.</li>
  <li><strong>Placement:</strong> user ↔ LiveKit edge ↔ agent worker ↔ model providers should be in the same region wherever possible; a cross-ocean hop between worker and LLM can cost more than all your tuning saves.</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — "start a voice session" endpoint: room + token + agent dispatch</h3>
<pre><code class="language-ts">// server/voice-session.ts
import crypto from 'node:crypto';
import express from 'express';
import { AccessToken, AgentDispatchClient } from 'livekit-server-sdk';
import { requireUser } from './auth';

const dispatch = new AgentDispatchClient(process.env.LIVEKIT_URL!, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);
export const router = express.Router();

router.post('/api/voice/session', requireUser, async (req: any, res) =&gt; {
  const user = req.user;
  const roomName = 'voice-' + user.tenantId + '-' + crypto.randomUUID();   // unguessable, one per session

  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: 'user:' + user.id,
    name: user.firstName,
    ttl: '5m',
  });
  at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true, canPublishData: true });

  try {
    // The agent gets trusted context from the SERVER, not from the client
    await dispatch.createDispatch(roomName, 'booking-agent', {
      metadata: JSON.stringify({ userId: user.id, tenantId: user.tenantId, locale: user.locale }),
    });
  } catch (err) {
    req.log.error({ err }, 'agent dispatch failed');
    return res.status(503).json({ error: 'voice_unavailable' });
  }

  await auditLog.write({ type: 'voice_session_started', userId: user.id, roomName });
  res.json({ serverUrl: process.env.LIVEKIT_WS_URL, token: await at.toJwt(), roomName });
});</code></pre>
<p>Alternative (verify): put the dispatch in the token itself via a room configuration (<code>RoomConfiguration</code> with <code>RoomAgentDispatch</code> from <code>@livekit/protocol</code>), so the agent is dispatched exactly when the user connects.</p>

<h3>Example 2 — the booking agent (Python, tools hitting your API)</h3>
<pre><code class="language-python"># booking_agent.py — verify imports/params against current LiveKit Agents docs
import json
import logging

import httpx
from livekit.agents import Agent, AgentSession, JobContext, JobProcess, RunContext, WorkerOptions, cli, function_tool
from livekit.plugins import deepgram, openai, cartesia, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

log = logging.getLogger("booking-agent")
API = "https://api.internal.example.com"


class BookingAgent(Agent):
    def __init__(self, user_id: str, tenant_id: str, room_name: str) -&gt; None:
        super().__init__(instructions=(
            "You are the front-desk assistant for this office. Reply in one or two sentences. "
            "Before booking, read back room, date, start time and duration and get a yes. "
            "Never read out internal IDs. If you cannot help, offer to connect a human."
        ))
        self.user_id = user_id
        self.tenant_id = tenant_id
        self.room_name = room_name
        # Service-to-service auth; the backend still checks the END USER's permissions
        self.http = httpx.AsyncClient(base_url=API, timeout=6.0,
                                      headers={"X-On-Behalf-Of": user_id, "X-Tenant": tenant_id})

    @function_tool
    async def find_free_rooms(self, context: RunContext, start_iso: str, duration_minutes: int, attendees: int) -&gt; dict:
        """Find meeting rooms free for a time window. Call this before suggesting a room.

        Args:
            start_iso: Start time, ISO 8601 in the office timezone.
            duration_minutes: Meeting length in minutes, 15 to 480.
            attendees: Number of people.
        """
        r = await self.http.get("/rooms/free", params={"start": start_iso, "duration": duration_minutes, "attendees": attendees})
        r.raise_for_status()
        rooms = r.json()["rooms"][:3]                 # small, speakable result
        return {"rooms": [{"room_id": x["id"], "name": x["name"], "seats": x["capacity"], "floor": x["floor"]} for x in rooms]}

    @function_tool
    async def book_room(self, context: RunContext, room_id: str, start_iso: str, duration_minutes: int) -&gt; dict:
        """Book a room. Only call after the user explicitly confirmed the details."""
        idem = ":".join([self.room_name, room_id, start_iso])      # retried tool call can't double-book
        r = await self.http.post("/bookings", json={"roomId": room_id, "start": start_iso, "duration": duration_minutes},
                                 headers={"Idempotency-Key": idem})
        if r.status_code == 409:
            return {"ok": False, "reason": "That slot was just taken."}
        if r.status_code == 403:
            return {"ok": False, "reason": "You are not allowed to book that room."}
        r.raise_for_status()
        b = r.json()
        return {"ok": True, "booking_ref": b["shortRef"], "room": b["roomName"], "start": b["start"]}


def prewarm(proc: JobProcess) -&gt; None:
    proc.userdata["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext) -&gt; None:
    meta = json.loads(ctx.job.metadata or "{}")      # from createDispatch — trusted
    await ctx.connect()

    session = AgentSession(
        vad=ctx.proc.userdata["vad"],
        stt=deepgram.STT(model="nova-3"),
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=cartesia.TTS(),
        turn_detection=MultilingualModel(),
    )

    @session.on("metrics_collected")                 # per-turn STT/LLM/TTS/EOU timings — verify event name
    def _metrics(ev) -&gt; None:
        log.info("metrics room=%s %s", ctx.room.name, ev.metrics)

    agent = BookingAgent(meta["userId"], meta["tenantId"], ctx.room.name)

    async def _cleanup() -&gt; None:
        await agent.http.aclose()
    ctx.add_shutdown_callback(_cleanup)

    await session.start(room=ctx.room, agent=agent)
    await session.generate_reply(instructions="Greet the user briefly and ask what they would like to book.")


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm, agent_name="booking-agent"))</code></pre>
<p>Swap the cascade for speech-to-speech by replacing the four pipeline arguments with <code>llm=openai.realtime.RealtimeModel(voice="marin")</code>; the agent class and tools stay the same.</p>

<h3>Example 3 — web client for the voice agent (vanilla)</h3>
<pre><code class="language-ts">import { Room, RoomEvent, Track, ParticipantKind } from 'livekit-client';

export async function startVoice(ui: { setState: (s: string) =&gt; void; addLine: (who: string, t: string) =&gt; void }) {
  const { serverUrl, token } = await fetch('/api/voice/session', { method: 'POST' }).then((r) =&gt; r.json());
  const room = new Room();

  room.on(RoomEvent.TrackSubscribed, (track) =&gt; {
    if (track.kind === Track.Kind.Audio) document.body.appendChild(track.attach());
  });
  // Agents publish their state as a participant attribute (verify key name)
  room.on(RoomEvent.ParticipantAttributesChanged, (changed, p) =&gt; {
    if (p.kind === ParticipantKind.AGENT &amp;&amp; changed['lk.agent.state']) ui.setState(changed['lk.agent.state']);
  });
  room.registerTextStreamHandler('lk.transcription', async (reader, info) =&gt; {
    ui.addLine(info.identity, await reader.readAll());
  });
  room.on(RoomEvent.AudioPlaybackStatusChanged, () =&gt; {
    if (!room.canPlaybackAudio) ui.setState('tap-to-enable-audio');   // call room.startAudio() on tap
  });

  await room.connect(serverUrl, token);
  await room.localParticipant.setMicrophoneEnabled(true);
  return () =&gt; room.disconnect();
}</code></pre>

<h3>Example 4 — outbound reminder call (agent dials a phone number)</h3>
<pre><code class="language-ts">// server/reminder-call.ts — verify SipClient option names
import crypto from 'node:crypto';
import { AgentDispatchClient, SipClient } from 'livekit-server-sdk';

const sip = new SipClient(process.env.LIVEKIT_URL!, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);
const dispatch = new AgentDispatchClient(process.env.LIVEKIT_URL!, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);

export async function callForReminder(booking: { id: string; phoneE164: string; tenantId: string }) {
  if (!(await consent.hasCallConsent(booking.phoneE164))) return { skipped: 'no_consent' };
  const roomName = 'reminder-' + booking.id + '-' + crypto.randomUUID().slice(0, 8);

  // 1) agent first, so it is listening when the callee answers
  await dispatch.createDispatch(roomName, 'reminder-agent', {
    metadata: JSON.stringify({ bookingId: booking.id, tenantId: booking.tenantId }),
  });
  // 2) dial out through the outbound trunk; the callee joins as a SIP participant
  await sip.createSipParticipant(process.env.SIP_OUTBOUND_TRUNK_ID!, booking.phoneE164, roomName, {
    participantIdentity: 'phone:' + booking.phoneE164,
    participantName: 'Callee',
  });
  return { roomName };
}</code></pre>
<p>Run this from a queue consumer with retry limits and quiet-hours checks — not from a request handler. Carriers cap concurrent channels per trunk, so the queue doubles as a rate limiter.</p>

<h3>Example 5 — post-call pipeline: webhook → queue → transcript → scoring</h3>
<div class="diagram">
<pre>
 room_finished webhook ─► dedupe ─► SQS/queue msg {room}
                                     │
                                     ▼
 worker: fetch transcript (saved by the agent on shutdown) + recording URL (egress_ended)
       ─► redact PII ─► LLM rubric scoring ─► store scores ─► dashboard / alerts
</pre>
</div>
<pre><code class="language-python"># in the agent: persist the conversation when the job shuts down (verify history API)
async def _save_transcript() -&gt; None:
    await http.post("/calls/transcripts", json={
        "room": ctx.room.name,
        "items": session.history.to_dict(),          # chat context incl. tool calls
    })
ctx.add_shutdown_callback(_save_transcript)</code></pre>
<p>This is the bridge from a live voice product to an offline call-scoring system: the agent writes the transcript, a webhook kicks off async processing — see <a href="#/topic/be-queues">Queues</a> for delivery semantics.</p>

<h3>Example 6 — record a call to S3 (audio-only room composite)</h3>
<pre><code class="language-ts">// verify constructor/field shapes — the v2 server SDK uses protobuf-style "oneof" objects
import { EgressClient, EncodedFileOutput, S3Upload } from 'livekit-server-sdk';

const egress = new EgressClient(process.env.LIVEKIT_URL!, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);

export async function startRecording(roomName: string) {
  const file = new EncodedFileOutput({
    filepath: 'calls/{room_name}-{time}.ogg',              // LiveKit template variables
    output: { case: 's3', value: new S3Upload({ bucket: 'acme-call-recordings', region: 'ap-south-1' }) },
  });
  const info = await egress.startRoomCompositeEgress(roomName, { file }, { audioOnly: true });
  return info.egressId;                                      // completion arrives as egress_ended webhook
}</code></pre>
<p>Announce recording to all parties (a fixed <code>session.say</code> line at call start), and set S3 lifecycle rules for retention.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. The agent never joins</h3>
<p>Usual suspects: the worker registered under an <code>agent_name</code> (explicit dispatch only) but nobody dispatched it; the worker points at a different LiveKit URL/project or wrong keys; the worker is at capacity (load above threshold) so the job is never accepted; or the entrypoint crashed before <code>ctx.connect()</code>. Check worker logs for job requests first.</p>

<h3>2. Two agents in one room</h3>
<p>Automatic dispatch plus an explicit <code>createDispatch</code>, or a retried dispatch call, puts two agents in the room talking over each other. Pick one dispatch mechanism; make dispatch idempotent per room (check participants before dispatching).</p>

<h3>3. Duplicate identity</h3>
<p>The same identity joining again (second tab, or reconnect from another device) disconnects the earlier participant with a duplicate-identity reason. Decide whether that's desired (single session per user) or generate per-device identities.</p>

<h3>4. Autoplay blocked</h3>
<p>The browser refuses to play the agent's audio until a user gesture: connected, agent "speaking", user hears nothing. Watch <code>AudioPlaybackStatusChanged</code> and call <code>room.startAudio()</code> from a click.</p>

<h3>5. Echo makes the agent interrupt itself</h3>
<p>On laptops/tablets without headphones, agent audio leaks into the mic; VAD flags "user speech" and the agent stops. Keep browser echo cancellation on, add noise cancellation, raise <code>min_interruption_duration</code>, and test on the actual device (meeting-room tablets with external speakers are the worst case).</p>

<h3>6. Phone callers sound worse and get misunderstood</h3>
<p>SIP audio is 8 kHz narrowband with carrier noise and extra latency. Use telephony-tuned STT and noise cancellation, expect more mis-hearings of names/numbers, and confirm critical values.</p>

<h3>7. Corporate firewalls</h3>
<p>UDP blocked → ICE falls back to TCP or TURN/TLS. Self-hosters must configure TURN with a valid TLS certificate on 443 (or a port the customer allows); otherwise "it works at home, not at the office" — see <a href="#/topic/api-webrtc">WebRTC Deep</a>.</p>

<h3>8. Rooms that never close / close too early</h3>
<p><code>emptyTimeout</code> too long keeps idle rooms (and billing) alive; departure timeouts too short close a room while a mobile user is reconnecting. Tune both, and end voice-agent rooms explicitly when the call is done.</p>

<h3>9. Agent deploys cut live calls</h3>
<p>Killing worker pods kills in-progress jobs. Workers should drain: stop accepting jobs, let active ones finish (with a max drain timeout), then exit. Configure your orchestrator's termination grace period to match.</p>

<h3>10. Webhooks out of order or repeated</h3>
<p><code>participant_left</code> can arrive after <code>room_finished</code>; retries can duplicate. Dedupe by event id, make handlers idempotent, and derive state from the latest timestamps rather than arrival order.</p>

<h3>11. Large rooms on one node (self-hosted)</h3>
<p>In open-source LiveKit a room is hosted on a single node; a 500-participant video room can exceed one machine. Selective subscription, audio-only audiences, or Egress to HLS for viewers; or Cloud's multi-node rooms.</p>

<h3>12. Region mismatch</h3>
<p>Users in India, LiveKit Cloud edge in Mumbai, agent workers in us-east-1, LLM in the US: every turn crosses the ocean twice. Co-locate workers with the media region and choose provider regions/endpoints accordingly.</p>

<h3>13. Tool calls that take longer than patience</h3>
<p>A slow booking API creates dead air. Use <code>session.say</code> to acknowledge, cap tool timeouts, return errors as results, and consider prefetching (look up the user's usual site when the call starts).</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Anti-pattern 1 — API secret in the client, or minting tokens on the client</h3>
<p>The secret can mint admin tokens for every room. Tokens are minted only by your backend after authenticating the user.</p>

<h3>Anti-pattern 2 — identity and room from client input</h3>
<p>A token endpoint that does <code>identity: req.body.identity, room: req.body.room</code> lets anyone impersonate anyone and join any room. Derive identity from your auth; authorise room membership server-side; use unguessable room names.</p>

<h3>Anti-pattern 3 — admin grants or long TTLs in client tokens</h3>
<p><code>roomAdmin</code> in a client token lets a user kick and mute everyone. Six-hour TTLs widen the window for a leaked token. Minimal grants, minutes of TTL.</p>

<h3>Anti-pattern 4 — passing trusted context through the client</h3>
<p>The agent reading the user's tenant/role from participant metadata the client controls. Pass trusted context via dispatch metadata from the server, and have tools re-check permissions in your API.</p>

<h3>Anti-pattern 5 — blocking the agent's event loop</h3>
<p>Synchronous HTTP calls, heavy JSON parsing or CPU work in a tool stalls the async loop that's also feeding audio frames — the agent stutters. Use async clients; offload CPU work.</p>

<h3>Anti-pattern 6 — loading models per call</h3>
<p>Loading VAD or other local models inside the entrypoint adds seconds to the first turn of every call. Load in <code>prewarm</code>.</p>

<h3>Anti-pattern 7 — disabling adaptiveStream/dynacast "to be safe"</h3>
<p>Every subscriber then receives full-resolution video for tiles that are thumbnails or hidden — bandwidth and battery burn for nothing.</p>

<h3>Anti-pattern 8 — Egress on the SFU nodes</h3>
<p>Room-composite egress runs a browser and an encoder per recording. Co-locating with the SFU steals CPU from live media. Separate pools.</p>

<h3>Anti-pattern 9 — no per-turn metrics</h3>
<p>Without STT/LLM/TTS/end-of-utterance timings per turn, "the bot is slow" turns into guesswork. Log the framework's metrics with room and turn ids, and chart p50/p95.</p>

<h3>Anti-pattern 10 — over-eager endpointing</h3>
<p>Chasing latency by cutting endpointing delay to the bone makes the agent cut people off — worse UX than 300 ms of extra wait. Tune with real recordings, use the turn detector model, and measure interruption rate alongside latency.</p>

<h3>Anti-pattern 11 — LiveKit for a one-user, one-model web toy</h3>
<p>If there's no telephony, recording, multi-party or server-side tool need, a direct Realtime API connection is fewer moving parts. Choose LiveKit for what it adds.</p>

<h3>Anti-pattern 12 — heavy work in the webhook handler</h3>
<p>Transcribing or scoring inside the webhook request times out and triggers retries (duplicate work). Ack fast, enqueue, process asynchronously.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. What is LiveKit, and why use it instead of raw WebRTC?</div>
  <div class="qa-answer">
    <p>An open-source WebRTC SFU with client and server SDKs, plus an agents framework, SIP telephony and recording/streaming services, available self-hosted or as LiveKit Cloud. Raw WebRTC gives me a peer connection; a product needs signalling, rooms, auth, group routing with simulcast, TURN, reconnection, mobile audio handling, recording and phone dial-in. LiveKit packages all of it, and for voice AI it lets the agent be just another participant in the room — so app users, phone callers, recording and multi-party work with the same agent code.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Explain how LiveKit routes media in a 10-person video call.</div>
  <div class="qa-answer">
    <p>Each participant publishes once to the SFU — video with simulcast layers — and subscribes to others' tracks. The SFU forwards RTP without decoding, choosing a layer per subscriber based on bandwidth estimates. With <strong>adaptive stream</strong>, the client reports each video element's size and visibility so the SFU sends a matching layer and pauses hidden tiles; with <strong>dynacast</strong>, publishers stop encoding layers nobody subscribes to. Signalling runs over a WebSocket to the server; media over UDP with TCP/TURN fallbacks. In OSS a room lives on one node; nodes coordinate via Redis.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. How does auth work? Design the token endpoint.</div>
  <div class="qa-answer">
    <p>The backend holds the API key/secret and signs a JWT access token per participant. My endpoint authenticates the user with our existing auth, authorises their access to the room (or creates a fresh unguessable room for a voice session), sets identity from our user id — never from request input — and grants only what's needed: <code>roomJoin</code> on that one room, publish/subscribe/data as appropriate, microphone-only sources for a voice app, no admin grants. Short TTL. If an agent is needed, the server dispatches it with trusted metadata (user id, tenant) rather than letting the client describe itself. Every issuance is audit-logged.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Walk through a voice agent turn in LiveKit Agents. Where does the latency go?</div>
  <div class="qa-answer">
    <p>The user's audio track reaches the agent worker via the SFU. VAD detects speech; streaming STT produces interim and final transcripts; when VAD sees silence, the turn detector model judges whether the utterance is complete (waiting longer if it sounds unfinished). The LLM streams tokens, possibly calling tools; TTS streams audio from the first sentence; frames are published on the agent's audio track. Latency: endpointing (often the biggest, a few hundred ms), STT finalisation (~100–300 ms), LLM time-to-first-token (~200–800 ms), TTS time-to-first-byte (~100–300 ms), plus WebRTC transport both ways and any tool calls — typically around a second end to end. The framework's per-turn metrics break this down, which is where I'd start optimising.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. Cascade pipeline vs a realtime speech-to-speech model inside LiveKit — trade-offs?</div>
  <div class="qa-answer">
    <p>Same <code>Agent</code> and tools either way; only the session's model configuration changes. Realtime model: one hop, usually lower latency, natural prosody, hears tone — but locked to that provider's voices and models, harder to filter text before it's spoken, transcripts are a side channel, and cost per minute is typically higher. Cascade: choose best-of-breed STT/LLM/TTS per language or brand voice, inspect and guard text before TTS, often cheaper, but more hops and more tuning. Because LiveKit keeps transport and clients constant, I can A/B them on real traffic.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. How do turn detection and interruptions work, and how would you tune them?</div>
  <div class="qa-answer">
    <p>VAD gives fast speech/silence on raw audio. On silence, a small end-of-utterance model looks at the transcript to judge whether the user has finished — so "my number is nine eight four…" waits longer than "yes, book it". Min/max endpointing delays bound that wait. Interruptions: if the user speaks for longer than a minimum duration while the agent is talking, TTS stops and only the portion actually played stays in the chat context. Tuning: raise the minimum interruption duration for noisy/echoey environments, use the turn detector rather than ever-shorter silence for latency, and measure both latency and false-interruption rate on recorded calls before changing defaults.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Put the same agent on a phone number. What's the design?</div>
  <div class="qa-answer">
    <p>Buy a number from a carrier, point its SIP trunk at LiveKit SIP. Create an inbound trunk for that number and a dispatch rule that puts each caller in their own room (prefix <code>call-</code>) with the agent configured in the room config. The caller joins as a SIP participant; caller number is available as an attribute for CRM lookup. For outbound, my backend dispatches the agent to a new room and creates a SIP participant through an outbound trunk. Differences from app users: 8 kHz audio (telephony-tuned STT and noise cancellation), extra PSTN latency, DTMF input, transfer to a human via SIP REFER, recording consent, and carrier concurrent-channel limits — so outbound runs through a queue.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. Self-host or LiveKit Cloud?</div>
  <div class="qa-answer">
    <p>Cloud by default for speed: global edge, multi-node rooms, managed TURN, scaling and (verify) agent hosting, usage-based pricing. Self-host when data must stay on-prem or in the customer's VPC, when volume is large and steady enough that infra cost beats usage pricing, and when there's a team to run it. Self-hosting means host-networked SFU pods, open UDP ranges, public IPs, TLS for TURN on 443, Redis for multi-node, separate egress pools, graceful drains and monitoring. Since the server is open source, starting on Cloud and moving later (or the reverse) doesn't change client code — a useful hedge.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. How would you scale to 1,000 concurrent voice-agent calls?</div>
  <div class="qa-answer">
    <p>Break it into four capacity pools. <strong>SFU:</strong> 1,000 two-participant audio rooms is light; spread rooms across nodes (or Cloud). <strong>Agent workers:</strong> each call is a job process running VAD/turn detection/noise cancellation locally; load-test to find calls per core, autoscale on load with headroom since jobs can't migrate, prewarm processes, drain on deploy. <strong>Providers:</strong> STT/LLM/TTS concurrency and token limits are usually the real wall — get quota increases, add fallback providers, pick regions near the workers. <strong>Telephony:</strong> trunk channel limits with the carrier. Then post-call work (transcripts, scoring) goes through queues so spikes don't affect live calls. I'd track cost per minute per component — LiveKit minutes, STT minutes, LLM tokens, TTS characters, PSTN minutes.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. FDE scenario — a customer says: "Your phone agent takes two seconds to answer and talks over our callers."</div>
  <div class="qa-answer">
    <p>Measure first: pull per-turn metrics for their calls — end-of-utterance delay, STT, LLM TTFT, TTS TTFB — and where each component runs. Typical findings: workers in a different region from the SIP/media region and the LLM (fix placement); a large LLM for a simple booking flow (smaller/faster model, shorter prompt); TTS not streaming sentence by sentence; slow tool APIs (cache, prefetch, acknowledgement phrases). "Talks over callers" usually means interruptions aren't firing — echo/noise on the line makes VAD unreliable, or interruptions disabled — or the opposite, endpointing so aggressive the agent jumps in during pauses. Fix with telephony noise cancellation, the turn detector, and interruption thresholds; validate on recorded calls; report p50/p95 before and after to the customer.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. How do you record calls and feed them into analytics without hurting the live call?</div>
  <div class="qa-answer">
    <p>Start an audio-only room-composite or track egress to object storage when the call starts (after a consent announcement). The agent persists its conversation history — including tool calls — on shutdown. The <code>room_finished</code> and <code>egress_ended</code> webhooks are verified, deduped and turned into queue messages; asynchronous workers then redact PII, score the call against a rubric with an LLM, and store results for dashboards. Egress runs on its own nodes, analytics on its own workers, so nothing competes with live media. Retention is enforced with storage lifecycle rules.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. LiveKit Agents vs Pipecat vs a hosted voice-agent platform — how do you choose?</div>
  <div class="qa-answer">
    <p>Hosted platforms (Vapi/Retell-style) when the customer needs a working phone agent this week and the flow is standard — but you trade control, data residency and per-minute margin. LiveKit Agents when you want open source with an integrated transport, telephony, recording and a managed option — agent code stays portable between self-hosted and Cloud. Pipecat when the team prefers its frame-pipeline model or must use a different transport. For an FDE, the deciding questions are: who owns the phone numbers and data, latency targets, required providers (e.g. a specific TTS voice or on-prem LLM), and who will operate it after handover.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Follow-ups interviewers love</div>
  <ul>
    <li>"What happens if the same user joins from two devices?" (Duplicate identity disconnects the older one — or use per-device identities.)</li>
    <li>"Why does a worker with an <code>agent_name</code> never get jobs?" (Named agents are dispatched only explicitly.)</li>
    <li>"Where do tool calls execute?" (In the agent worker, server-side, next to your APIs — not on the client.)</li>
    <li>"How is an interrupted reply kept consistent in context?" (Only the played portion is kept — same idea as Realtime truncation.)</li>
    <li>"What breaks first at scale?" (Usually provider quotas and region placement, not the SFU.)</li>
  </ul>
</div>

<div class="qa-block">
  <div class="qa-question">Q13. Walk through the agent lifecycle in LiveKit Agents, from worker start to job end.</div>
  <div class="qa-answer">
    <p>A <strong>worker</strong> process starts (<code>cli.run_app</code>) and registers with the LiveKit server over a WebSocket, saying which agent it can run. When a room needs an agent — automatically on room start, or by explicit dispatch via the API or the token's room config — the server <strong>dispatches</strong> a job request to a worker with spare capacity, and the worker assigns it to a <strong>job process</strong> from a prewarmed pool (VAD already loaded in <code>prewarm</code>).</p>
    <p>The job's <code>entrypoint</code> calls <code>ctx.connect()</code>, so the agent joins the room as a participant, then <code>AgentSession.start</code> subscribes to the user's audio and publishes the agent's audio track. It loops: listen, detect end of turn, think (LLM + tools), speak, handle interruptions. When the user leaves or the room closes, shutdown callbacks run, the job ends and capacity is freed. In production set an <code>agent_name</code> so the worker is only dispatched explicitly, and you control which rooms get which agent.</p>
  </div>
</div>
` },

  ]
});
