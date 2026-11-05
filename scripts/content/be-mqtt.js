window.PREP_SITE.registerTopic({
  id: "be-mqtt",
  module: "backend-stack",
  title: "MQTT & IoT Messaging",
  estimatedReadTime: "34 min",
  tags: ["mqtt","iot","pub-sub","qos","device-fleet","kiosk","aws-iot-core","mosquitto","emqx","mqtt.js","backend"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">MQTT is <strong>lightweight pub/sub over one long-lived device-initiated connection to a broker</strong>, with QoS, retained state, Last Will presence and persistent sessions built in — the standard edge protocol for device fleets, usually bridged into Kafka/queues in the backend.</div>
  <h4>Key points</h4>
  <ul>
    <li>Clients <strong>never talk to each other</strong>: they publish/subscribe to <strong>topics</strong>; the broker routes. Wildcards for subscribe only: <code>+</code> one level, <code>#</code> rest-of-tree (last). <code>$</code> topics are reserved.</li>
    <li><strong>QoS 0/1/2</strong> = at most / at least / exactly once <strong>per hop</strong>; delivered QoS = min(publish, subscription). QoS 1 = PUBACK (may duplicate); QoS 2 = 4-packet PUBLISH/PUBREC/PUBREL/PUBCOMP.</li>
    <li><strong>Retained</strong> = one latest message per topic, delivered on subscribe → use for state, never events; clear with an empty retained payload.</li>
    <li><strong>LWT</strong> = broker publishes on ungraceful disconnect; retained offline will + retained online on connect = fleet presence.</li>
    <li><strong>Persistent session</strong> (stable clientId + clean=false / sessionExpiry) keeps subscriptions and queued QoS 1/2 messages; check <code>sessionPresent</code>.</li>
    <li><strong>Keep-alive</strong>: PINGREQ/PINGRESP detects half-open TCP; PINGREQ when idle; broker drops after 1.5×; tune against NAT/firewall idle timeouts.</li>
    <li><strong>MQTT 5</strong>: reason codes, session/message expiry, user properties, response topic + correlation data, shared subscriptions, will delay, topic aliases, flow control.</li>
    <li>Brokers: Mosquitto (small, single-node), EMQX/HiveMQ (clustered), AWS IoT Core (managed, certs + policies, rules engine, shadows; no QoS 2).</li>
    <li>Security: TLS, per-device certs/tokens, clientId bound to identity, per-device topic ACLs, provisioning + revocation.</li>
    <li>MQTT at the edge, Kafka/SQS in the core: ingest via shared subscriptions or broker rules, key by device id.</li>
    <li>Design three things per fleet: the <strong>topic tree</strong> (who can publish/subscribe where), the <strong>QoS + retain choice per topic</strong>, and the <strong>session/LWT strategy</strong> for Wi-Fi drops.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap">Believing QoS 2 means "exactly-once processing". QoS is <strong>per hop</strong> (device→broker, broker→subscriber), downgrades to the subscriber's QoS, and says nothing about your handler crashing after receipt — real correctness still needs a message id and idempotent handling (and a local outbox on the device for data you can't lose).</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"For a fleet I design three things up front: the topic tree and ACLs, the QoS and retain choice per topic — retained for state, QoS 0 for telemetry, QoS 1 plus ids for commands — and the session and Last Will strategy for when devices drop off Wi-Fi."</div>
  <div class="revision-say">"Presence is a retained status topic: the will publishes 'offline', the device publishes 'online' on connect, and an MQTT 5 will delay stops it flapping on short network blips."</div>
  <div class="revision-say">"MQTT is the edge protocol, not the system of record — I bridge it into Kafka keyed by device id for durability, replay and multiple consumers."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>What MQTT is</h3>
<p>An OASIS-standard application protocol (versions in use: <strong>3.1.1</strong> and <strong>5.0</strong>). The minimum packet header is 2 bytes; a typical telemetry PUBLISH is tens of bytes of overhead versus hundreds for an HTTP request with headers and cookies. Standard ports: <strong>1883</strong> (plain TCP), <strong>8883</strong> (TLS); WebSocket ports are broker-specific (often 8083/8084, or 443 behind a load balancer).</p>
<p>Three roles only:</p>
<ul>
  <li><strong>Publisher</strong> — sends a message to a topic.</li>
  <li><strong>Subscriber</strong> — registers interest in topic filters.</li>
  <li><strong>Broker</strong> — authenticates clients, enforces ACLs, matches topics, stores sessions/retained messages, delivers.</li>
</ul>
<p>Any client can be both publisher and subscriber. A wall tablet publishes its battery level and subscribes to its room's schedule.</p>

<h3>Why devices use it</h3>
<ul>
  <li><strong>Server push over NAT.</strong> Devices sit behind office Wi-Fi and carrier NAT; nothing can connect <em>to</em> them. The device dials out once, keeps the connection open, and the backend can push commands down it.</li>
  <li><strong>Flaky networks are the design centre.</strong> Keep-alive, automatic reconnect, persistent sessions and QoS retries are part of the protocol, not your app code.</li>
  <li><strong>Presence for free.</strong> LWT + retained status gives a live "which kiosks are online" view without polling.</li>
  <li><strong>Decoupling.</strong> The occupancy sensor doesn't know the tablet or the analytics service exist. Add a new consumer = add a subscription.</li>
  <li><strong>Cheap at scale.</strong> Brokers like EMQX/HiveMQ handle very large numbers of concurrent connections per cluster (vendor benchmarks claim millions — treat as marketing until you test your payload pattern).</li>
</ul>

<h3>What it is not</h3>
<ul>
  <li><strong>Not a durable log.</strong> No replay of history (except the single retained message per topic). If you need "all readings from last Tuesday", bridge MQTT into Kafka / a time-series DB.</li>
  <li><strong>Not an end-to-end guarantee.</strong> QoS 2 between device and broker plus QoS 2 between broker and backend still isn't "the backend processed it exactly once" — your handler can crash after receipt.</li>
  <li><strong>Not request/response by default.</strong> MQTT 5 standardises the pattern, but you still build correlation and timeouts.</li>
</ul>

<h3>MQTT vs WebSockets vs HTTP for devices and kiosks</h3>
<table>
  <thead><tr><th></th><th>MQTT</th><th>Raw WebSocket (your protocol)</th><th>HTTP polling / long-poll</th><th>Mobile push (FCM/APNs)</th></tr></thead>
  <tbody>
    <tr><td>Direction</td><td>Bi-directional, pub/sub</td><td>Bi-directional, point-to-point</td><td>Client-initiated</td><td>Server → device only</td></tr>
    <tr><td>Routing / fan-out</td><td>Broker does it (topics, wildcards)</td><td>You build rooms/channels + a pub/sub backplane (e.g. Redis)</td><td>N/A</td><td>Topics/tokens via provider</td></tr>
    <tr><td>Delivery guarantees</td><td>QoS 0/1/2 per hop</td><td>None — you build acks</td><td>Request/response</td><td>Best effort, throttled</td></tr>
    <tr><td>Offline handling</td><td>Persistent session queues, retained state</td><td>You build catch-up</td><td>Next poll</td><td>Collapsed / dropped</td></tr>
    <tr><td>Presence</td><td>LWT + retained status</td><td>You build heartbeats</td><td>Last-seen timestamps</td><td>No</td></tr>
    <tr><td>Overhead</td><td>Very low</td><td>Low after handshake</td><td>High (headers per request)</td><td>N/A</td></tr>
    <tr><td>Browser / RN</td><td>Via MQTT-over-WebSocket</td><td>Native</td><td>Native</td><td>Native SDKs</td></tr>
    <tr><td>Best for</td><td>Device fleets, telemetry, commands, presence</td><td>Chat, collaborative apps, one backend owning the protocol</td><td>Infrequent updates, simplest infra</td><td>Waking backgrounded phones</td></tr>
  </tbody>
</table>
<div class="callout note">
  <div class="callout-title">Rule of thumb for a fleet of always-on tablets/kiosks</div>
  <p>If you'd otherwise build "WebSocket + rooms + acks + offline queue + presence + reconnect", MQTT gives you all of that as a standard with off-the-shelf brokers. If it's a consumer phone app that's mostly backgrounded, the OS will kill your socket anyway — use push notifications to wake it and fetch over HTTP.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Picture 1 — the broker in the middle</h3>
<div class="diagram">
<pre>
   tablet-0193 ─┐                         ┌─► room-schedule service (backend)
   tablet-0194 ─┤   PUBLISH / SUBSCRIBE   ├─► telemetry ingest ──► Kafka / TSDB
   kiosk-0007  ─┼────────►  BROKER  ──────┼─► ops dashboard (browser, MQTT over WSS)
   co2-sensor  ─┤   (auth, ACL, routing,  ├─► alerting
   gateway     ─┘    sessions, retained)  └─► device-command API (publishes cmds)

 Every arrow is ONE long-lived connection from client to broker.
 Nobody connects to a device. Devices dial out.
</pre>
</div>

<h3>Picture 2 — a topic tree for a device fleet</h3>
<div class="diagram">
<pre>
 v1/
 └── {tenant}/                         e.g. acme
     └── {site}/                       e.g. blr-01
         ├── rooms/{roomId}/
         │     ├── state               RETAINED  backend → tablets   (current + next booking)
         │     └── occupancy           QoS 0     sensor  → backend   (people count)
         └── devices/{deviceId}/
               ├── status              RETAINED  device  → all       ("online" / LWT "offline")
               ├── telemetry           QoS 0     device  → backend   (battery, temp, app version)
               ├── config              RETAINED  backend → device    (desired config)
               ├── cmd                 QoS 1     backend → device    (reboot, reload, check-in)
               └── cmd/res             QoS 1     device  → backend   (command results)

 Subscriptions (filters):
   tablet-0193       v1/acme/blr-01/rooms/4F-Orion/state
                     v1/acme/blr-01/devices/tablet-0193/config
                     v1/acme/blr-01/devices/tablet-0193/cmd
   ops dashboard     v1/acme/+/devices/+/status          ← + = exactly one level
   telemetry ingest  $share/ingest/v1/+/+/devices/+/telemetry
   audit / debug     v1/acme/blr-01/#                    ← # = this level and everything below
</pre>
</div>

<h3>Wildcard rules (memorise)</h3>
<table>
  <thead><tr><th>Filter</th><th>Matches</th><th>Doesn't match</th></tr></thead>
  <tbody>
    <tr><td><code>a/+/c</code></td><td><code>a/b/c</code>, <code>a/x/c</code></td><td><code>a/c</code>, <code>a/b/x/c</code></td></tr>
    <tr><td><code>a/#</code></td><td><code>a</code>, <code>a/b</code>, <code>a/b/c/d</code></td><td><code>b/a</code></td></tr>
    <tr><td><code>a/+</code></td><td><code>a/b</code>, <code>a/</code> (empty level)</td><td><code>a</code>, <code>a/b/c</code></td></tr>
    <tr><td><code>#</code></td><td>everything not starting with <code>$</code></td><td><code>$SYS/...</code>, <code>$aws/...</code></td></tr>
  </tbody>
</table>
<ul>
  <li><code>#</code> must be the last character and occupy a whole level; <code>+</code> occupies a whole level (<code>a/b+</code> is invalid).</li>
  <li>Wildcards are for <strong>subscribing only</strong> — you can't publish to <code>a/+</code>.</li>
  <li>Topics are case-sensitive; <code>/a/b</code> has an empty first level (avoid leading slashes).</li>
  <li>Topics starting with <code>$</code> are broker-reserved (<code>$SYS</code> stats, <code>$share</code> shared subscriptions, <code>$aws</code> on AWS IoT).</li>
</ul>

<h3>Picture 3 — QoS handshakes</h3>
<div class="diagram">
<pre>
 QoS 0  (at most once)          QoS 1  (at least once)          QoS 2  (exactly once, per hop)
 C ── PUBLISH ──► B             C ── PUBLISH(id=7) ──► B        C ── PUBLISH(id=9) ──► B   B stores id 9
                                C ◄── PUBACK(7) ──── B          C ◄── PUBREC(9) ───── B
 no ack, no retry               no PUBACK? resend with DUP=1    C ── PUBREL(9) ─────► B   B releases &amp; forwards once
                                → receiver may see it twice     C ◄── PUBCOMP(9) ──── B   both forget id 9

 Effective QoS to a subscriber = min(QoS the publisher used, QoS the subscriber asked for).
 Publisher → broker and broker → subscriber are SEPARATE QoS hops.
</pre>
</div>

<h3>Picture 4 — session state lives on BOTH sides</h3>
<div class="diagram">
<pre>
 BROKER keeps (per clientId, if session persists):    CLIENT keeps:
   • subscriptions                                      • outgoing QoS1/2 not yet acked
   • QoS1/2 messages queued while client offline        • incoming QoS2 ids awaiting PUBREL
   • in-flight QoS1/2 to the client
   (QoS 0 messages are NOT queued by spec; some brokers can be configured to)

 connect(clientId="tablet-0193", clean=false)   → "resume my session"   CONNACK sessionPresent=1
 connect(clientId="tablet-0193", clean=true)    → "start fresh"          CONNACK sessionPresent=0
</pre>
</div>

<h3>The four ideas that make everything else make sense</h3>
<ol>
  <li><strong>The clientId is the identity of the session.</strong> Two connections with the same clientId: the broker kicks the older one. Random clientIds + persistent sessions = leaked sessions.</li>
  <li><strong>Retained = "current state", non-retained = "event".</strong> Room schedule and online status are state; a door-open beep is an event.</li>
  <li><strong>QoS is per hop and per subscription.</strong> End-to-end correctness still needs idempotent handlers (message id in payload/user properties).</li>
  <li><strong>The broker is the security boundary.</strong> Each device gets its own credentials and may only touch its own subtree.</li>
</ol>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. Connection lifecycle</h3>
<div class="diagram">
<pre>
 TCP (+TLS) connect ─► CONNECT {clientId, keepAlive, clean/cleanStart, username/password,
                                will{topic,payload,qos,retain}, [v5: sessionExpiry, props]}
                   ◄─ CONNACK {sessionPresent, returnCode | v5 reasonCode + props}
 SUBSCRIBE {packetId, [filter, qos, v5 options]}   ◄─ SUBACK {granted QoS or failure per filter}
 PUBLISH ... ◄─► PUBLISH ...
 (idle) PINGREQ ─►  ◄─ PINGRESP
 DISCONNECT (clean)  → broker DISCARDS the will
 TCP drop / timeout  → broker PUBLISHES the will (v5: after Will Delay Interval)
</pre>
</div>

<h3>2. Keep-alive</h3>
<ul>
  <li>Client declares keep-alive in seconds (0 = disabled, max 65535). If it has sent nothing for that long, it sends PINGREQ.</li>
  <li>Broker disconnects a client it hasn't heard from in <strong>1.5 × keep-alive</strong> — and fires its will.</li>
  <li>Client treats a missing PINGRESP as a dead link and reconnects.</li>
  <li>Choose it against NAT/firewall idle timeouts: corporate firewalls and carrier NATs drop idle TCP mappings, sometimes after only a few minutes. 30–60 s is a common fleet default; lower = faster offline detection, more traffic and battery. MQTT 5 brokers can override it via Server Keep Alive in CONNACK.</li>
</ul>

<h3>3. Clean session (3.1.1) vs Clean Start + Session Expiry (5.0)</h3>
<table>
  <thead><tr><th></th><th>MQTT 3.1.1</th><th>MQTT 5</th></tr></thead>
  <tbody>
    <tr><td>Start fresh vs resume</td><td><code>cleanSession</code> flag does both jobs</td><td><code>cleanStart</code> = discard existing session at connect</td></tr>
    <tr><td>How long state survives offline</td><td>Forever (until broker config limits) if cleanSession=0</td><td><code>sessionExpiryInterval</code> seconds (0 = ends on disconnect)</td></tr>
    <tr><td>Typical device setting</td><td>cleanSession=0, stable clientId</td><td>cleanStart=false, sessionExpiry e.g. 1–24 h</td></tr>
  </tbody>
</table>
<p>Sessions cost broker memory, and queued messages pile up for devices that never return (a tablet thrown in a drawer). Brokers cap queue length (e.g. Mosquitto <code>max_queued_messages</code>) and expire sessions; set those deliberately.</p>

<h3>4. Retained messages</h3>
<ul>
  <li>PUBLISH with <code>retain=true</code> → broker stores it as <em>the</em> retained message for that exact topic (one per topic, replaced on each retained publish).</li>
  <li>New subscriber to a matching filter gets it immediately (with the retain flag set) — no waiting for the next update.</li>
  <li>Clear it by publishing a <strong>zero-length retained payload</strong> to the topic.</li>
  <li>MQTT 5 subscription option <em>Retain Handling</em>: send retained on every subscribe (0), only if new subscription (1), or never (2). <em>Retain As Published</em> preserves the flag for bridges.</li>
  <li>Retained + <code>#</code> subscription on a big tree = the broker floods you with every retained message on connect. Design subscriptions accordingly.</li>
</ul>

<h3>5. Last Will and Testament</h3>
<ul>
  <li>Registered in CONNECT; published by the broker if the connection ends without a DISCONNECT (network loss, keep-alive timeout, crash, protocol error).</li>
  <li>Classic presence pattern: will = <code>status</code> → <code>{"state":"offline"}</code> retained; on connect the client publishes <code>{"state":"online"}</code> retained to the same topic; on graceful shutdown it publishes <code>offline</code> itself, then DISCONNECTs.</li>
  <li>MQTT 5 <strong>Will Delay Interval</strong>: wait N seconds before publishing the will; if the client reconnects in time, the will is cancelled — removes "offline/online" flapping on brief Wi-Fi blips.</li>
</ul>

<h3>6. MQTT 5 features worth knowing</h3>
<table>
  <thead><tr><th>Feature</th><th>What it solves</th></tr></thead>
  <tbody>
    <tr><td>Reason codes on every ack + server DISCONNECT</td><td>"Why did that fail?" — not-authorized vs quota-exceeded vs topic-invalid, instead of a silent drop</td></tr>
    <tr><td>Session Expiry Interval</td><td>Bounded offline sessions (see above)</td></tr>
    <tr><td>Message Expiry Interval</td><td>Stale commands die: "unlock door" queued for an offline kiosk shouldn't fire 6 hours later</td></tr>
    <tr><td>User Properties</td><td>Key/value headers (traceId, messageId, schemaVersion) without touching the payload</td></tr>
    <tr><td>Content Type / Payload Format Indicator</td><td>Declare JSON/protobuf/UTF-8</td></tr>
    <tr><td>Response Topic + Correlation Data</td><td>Standard request/response over pub/sub</td></tr>
    <tr><td>Shared Subscriptions <code>$share/{group}/{filter}</code></td><td>Load-balance a topic across N backend instances (each message to one member) — like a consumer group. (Many brokers supported this as an extension under 3.1.1 too.)</td></tr>
    <tr><td>Topic Alias</td><td>Replace a long topic string with a 2-byte integer per connection — saves bandwidth on chatty telemetry</td></tr>
    <tr><td>Subscription options: No Local, Retain As Published, Retain Handling</td><td>Don't echo my own publishes back; bridge-friendly retain behaviour</td></tr>
    <tr><td>Flow control: Receive Maximum, Maximum Packet Size</td><td>Device tells broker how many in-flight QoS 1/2 messages / how big a packet it can handle</td></tr>
    <tr><td>Enhanced authentication (AUTH packet)</td><td>Challenge/response schemes (e.g. SCRAM, Kerberos) beyond username/password</td></tr>
  </tbody>
</table>

<h3>7. Brokers</h3>
<table>
  <thead><tr><th>Broker</th><th>Shape</th><th>Good for</th><th>Watch out</th></tr></thead>
  <tbody>
    <tr><td><strong>Mosquitto</strong></td><td>Single-process C broker, tiny footprint</td><td>Dev, on-prem gateways, edge, small/medium fleets</td><td>No native clustering; scale by bridging or a different broker</td></tr>
    <tr><td><strong>EMQX</strong></td><td>Clustered (Erlang), rule engine, data integrations (Kafka, DBs)</td><td>Large fleets, self-hosted or cloud</td><td>Licensing terms have changed across versions — check current terms</td></tr>
    <tr><td><strong>HiveMQ</strong></td><td>Clustered (Java), enterprise extensions (Kafka, security)</td><td>Enterprise / automotive / industrial</td><td>Commercial for most production features</td></tr>
    <tr><td><strong>VerneMQ, NanoMQ, RabbitMQ MQTT plugin</strong></td><td>Various</td><td>Specific niches (edge, existing RabbitMQ estate)</td><td>Feature parity with MQTT 5 varies — check docs</td></tr>
    <tr><td><strong>AWS IoT Core</strong></td><td>Fully managed, per-device X.509 certs, policies, rules engine, Device Shadow, Jobs</td><td>AWS shops, no broker ops</td><td>Not a full MQTT spec implementation (e.g. QoS 2 not supported); quotas on message size and rates — check current AWS docs</td></tr>
    <tr><td>Azure IoT Hub / Event Grid MQTT, HiveMQ Cloud, EMQX Cloud</td><td>Managed</td><td>Same idea on other clouds</td><td>Each has its own topic restrictions</td></tr>
  </tbody>
</table>

<h3>8. Security</h3>
<ul>
  <li><strong>Always TLS</strong> (8883 or WSS 443) outside a lab. Pin the CA on devices you control.</li>
  <li><strong>Authentication options:</strong> username/password (per-device, never one shared fleet password), <strong>mTLS client certificates</strong> (per-device cert; AWS IoT's default model), or tokens (JWT as password, validated by a broker auth plugin/HTTP hook).</li>
  <li><strong>Authorisation via topic ACLs:</strong> a device may publish only under <code>devices/{itsId}/...</code> and subscribe only to its own <code>cmd</code>/<code>config</code> and its room's <code>state</code>. Use broker substitutions (clientId / username / cert CN) so one rule covers the whole fleet.</li>
  <li><strong>clientId must equal the authenticated identity</strong>, or a device with valid creds can hijack another's session by connecting with its clientId.</li>
  <li><strong>Provisioning and rotation:</strong> factory or first-boot provisioning (AWS IoT fleet provisioning, or your own enrolment API that issues a cert after an admin pairs the device), plus revocation when a kiosk is stolen.</li>
  <li><strong>Payload trust:</strong> the backend must validate payloads like any API input (zod schema); a compromised device is an attacker with a valid connection.</li>
</ul>

<h3>9. mqtt.js essentials (Node, browser, React Native)</h3>
<table>
  <thead><tr><th>Option</th><th>Meaning</th><th>Fleet setting</th></tr></thead>
  <tbody>
    <tr><td><code>clientId</code></td><td>Session identity</td><td>Stable, equals device id</td></tr>
    <tr><td><code>protocolVersion</code></td><td>4 = 3.1.1, 5 = MQTT 5</td><td>5 if the broker supports it</td></tr>
    <tr><td><code>clean</code></td><td>Clean session / clean start</td><td><code>false</code> for devices that must get queued commands</td></tr>
    <tr><td><code>keepalive</code></td><td>Seconds (library default 60)</td><td>30–60</td></tr>
    <tr><td><code>reconnectPeriod</code></td><td>ms between reconnect attempts (default 1000; 0 disables)</td><td>Add your own jitter/backoff for large fleets</td></tr>
    <tr><td><code>connectTimeout</code></td><td>ms to wait for CONNACK</td><td>10–30 s</td></tr>
    <tr><td><code>will</code></td><td>{ topic, payload, qos, retain, properties }</td><td>Retained offline status</td></tr>
    <tr><td><code>properties</code></td><td>MQTT 5 CONNECT props (sessionExpiryInterval, etc.)</td><td>sessionExpiryInterval in seconds</td></tr>
    <tr><td><code>ca</code> / <code>cert</code> / <code>key</code></td><td>TLS / mTLS material (Node)</td><td>Per-device cert</td></tr>
  </tbody>
</table>
<p>In browsers and React Native, mqtt.js connects over <code>ws://</code> / <code>wss://</code> only (no raw TCP); RN setups typically need Node polyfills (Buffer, etc.) — check current mqtt.js docs for the supported RN recipe. Events you'll handle: <code>connect</code>, <code>reconnect</code>, <code>offline</code>, <code>close</code>, <code>disconnect</code> (v5 server-initiated), <code>error</code>, <code>message</code>. mqtt.js v5 also exposes promise variants (<code>connectAsync</code>, <code>publishAsync</code>, <code>subscribeAsync</code>, <code>endAsync</code>).</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — A meeting-room tablet client (presence, state, commands)</h3>
<p>The tablet needs: show its room's live schedule, report online/offline reliably, receive commands (reload, reboot, "end meeting early") even after a short Wi-Fi drop, and send light telemetry.</p>
<pre><code class="language-ts">// device/mqttClient.ts  (React Native or Node on the device)
import mqtt, { MqttClient, IClientOptions } from 'mqtt';

const TENANT = 'acme';
const SITE = 'blr-01';

export function connectDevice(deviceId: string, roomId: string, token: string): MqttClient {
  const base = 'v1/' + TENANT + '/' + SITE;
  const statusTopic = base + '/devices/' + deviceId + '/status';

  const opts: IClientOptions = {
    clientId: deviceId,                 // stable → session survives reconnects
    protocolVersion: 5,
    clean: false,                       // resume subscriptions + queued QoS1 commands
    keepalive: 30,
    reconnectPeriod: 2000 + Math.floor(Math.random() * 3000), // jitter so 500 tablets don't stampede
    connectTimeout: 15_000,
    username: deviceId,
    password: token,                    // short-lived device token validated by broker auth hook
    properties: { sessionExpiryInterval: 6 * 60 * 60 },   // keep session 6 h offline
    will: {
      topic: statusTopic,
      payload: Buffer.from(JSON.stringify({ state: 'offline', reason: 'lwt' })),
      qos: 1,
      retain: true,
      properties: { willDelayInterval: 20 },   // ignore blips shorter than 20 s
    },
  };

  const client = mqtt.connect('wss://mqtt.example.com:443/mqtt', opts);

  client.on('connect', (connack) =&gt; {
    // Announce presence (retained, so dashboards that subscribe later see it).
    client.publish(statusTopic,
      JSON.stringify({ state: 'online', appVersion: APP_VERSION, ts: Date.now() }),
      { qos: 1, retain: true });

    if (!connack.sessionPresent) {
      // Broker forgot us (first boot or session expired) → (re)subscribe.
      client.subscribe({
        [base + '/rooms/' + roomId + '/state']: { qos: 1 },
        [base + '/devices/' + deviceId + '/config']: { qos: 1 },
        [base + '/devices/' + deviceId + '/cmd']: { qos: 1, nl: true },
      });
    }
  });

  client.on('message', (topic, payload, packet) =&gt; {
    const body = safeJson(payload);
    if (!body) return;
    if (topic.endsWith('/state')) return roomStore.setSchedule(body);       // retained → arrives on subscribe
    if (topic.endsWith('/config')) return configStore.apply(body);
    if (topic.endsWith('/cmd')) return handleCommand(client, packet, body);
  });

  client.on('offline', () =&gt; ui.showBanner('Reconnecting…'));
  client.on('error', (err) =&gt; log.warn('mqtt_error', { message: err.message }));
  return client;
}

export async function shutdown(client: MqttClient, statusTopic: string) {
  // Graceful: publish offline ourselves (the will is discarded on clean DISCONNECT).
  await client.publishAsync(statusTopic, JSON.stringify({ state: 'offline', reason: 'shutdown' }),
    { qos: 1, retain: true });
  await client.endAsync();
}

function safeJson(buf: Buffer): any | null {
  try { return JSON.parse(buf.toString('utf8')); } catch { return null; }
}
</code></pre>
<p>Why each choice: retained room <code>state</code> means a tablet that reboots shows the schedule within a second, without an HTTP call; <code>clean:false</code> + session expiry means a "reload config" command sent during a 2-minute outage is delivered on reconnect; will delay avoids offline/online flapping on the ops dashboard; jittered reconnect stops a reconnect storm after a broker restart.</p>

<h3>Example 2 — Backend: commands with MQTT 5 request/response</h3>
<pre><code class="language-ts">// backend/deviceCommands.ts
import mqtt from 'mqtt';
import { randomUUID } from 'node:crypto';

const client = await mqtt.connectAsync(process.env.MQTT_URL!, {
  clientId: 'cmd-api-' + process.env.HOSTNAME,   // unique per backend instance
  protocolVersion: 5,
  clean: true,
  username: 'svc-cmd-api',
  password: process.env.MQTT_SVC_PASSWORD,
});

const REPLY_TOPIC = 'v1/_svc/cmd-api/' + process.env.HOSTNAME + '/replies';
const pending = new Map&lt;string, { resolve: (v: unknown) =&gt; void; timer: NodeJS.Timeout }&gt;();

await client.subscribeAsync(REPLY_TOPIC, { qos: 1 });
client.on('message', (_topic, payload, packet) =&gt; {
  const corr = packet.properties?.correlationData?.toString();
  const p = corr ? pending.get(corr) : undefined;
  if (!p) return;                                // late or unknown reply → ignore
  clearTimeout(p.timer);
  pending.delete(corr!);
  p.resolve(JSON.parse(payload.toString()));
});

export function sendCommand(tenant: string, site: string, deviceId: string,
                            name: 'reload' | 'reboot' | 'end-meeting', args: object = {}, timeoutMs = 10_000) {
  const id = randomUUID();
  const topic = 'v1/' + tenant + '/' + site + '/devices/' + deviceId + '/cmd';
  return new Promise((resolve, reject) =&gt; {
    const timer = setTimeout(() =&gt; { pending.delete(id); reject(new Error('device_timeout')); }, timeoutMs);
    pending.set(id, { resolve, timer });
    client.publish(topic, JSON.stringify({ id, name, args }), {
      qos: 1,
      properties: {
        responseTopic: REPLY_TOPIC,
        correlationData: Buffer.from(id),
        messageExpiryInterval: 60,             // don't execute a stale command an hour later
        userProperties: { traceId: id },
      },
    });
  });
}
</code></pre>
<p>Device side: on a <code>cmd</code> message, check <code>id</code> against a small "recently executed" set (QoS 1 can redeliver), execute, then publish the result to <code>packet.properties.responseTopic</code> with the same <code>correlationData</code>. The HTTP API that calls <code>sendCommand</code> returns 504 on timeout, and the ops UI shows "device didn't respond" rather than hanging.</p>

<h3>Example 3 — Scalable telemetry ingest with shared subscriptions → Kafka</h3>
<div class="diagram">
<pre>
 5,000 devices ──telemetry QoS0──► BROKER ──$share/ingest/v1/+/+/devices/+/telemetry──┬─► ingest-1 ─┐
                                                                                        ├─► ingest-2 ─┼─► Kafka telemetry.raw (key = deviceId)
                                                                                        └─► ingest-3 ─┘        │
                                                                                                               ├─► TSDB writer
                                                                                                               ├─► alerting
                                                                                                               └─► occupancy enricher
</pre>
</div>
<pre><code class="language-ts">// backend/telemetryIngest.ts
import mqtt from 'mqtt';
import { z } from 'zod';
import { getProducer } from './kafkaProducer';

const Telemetry = z.object({
  battery: z.number().min(0).max(100),
  tempC: z.number().optional(),
  appVersion: z.string().max(32),
  ts: z.number(),
});

const client = await mqtt.connectAsync(process.env.MQTT_URL!, {
  clientId: 'ingest-' + process.env.HOSTNAME,
  protocolVersion: 5,
  clean: true,
});
await client.subscribeAsync('$share/ingest/v1/+/+/devices/+/telemetry', { qos: 0 });

const producer = await getProducer();
let buffer: { key: string; value: string }[] = [];

client.on('message', (topic, payload) =&gt; {
  const [, tenant, site, , deviceId] = topic.split('/');   // v1/{tenant}/{site}/devices/{id}/telemetry
  const parsed = Telemetry.safeParse(safeJson(payload));
  if (!parsed.success) { metrics.inc('telemetry_invalid'); return; }
  buffer.push({ key: deviceId, value: JSON.stringify({ tenant, site, deviceId, ...parsed.data }) });
  if (buffer.length &gt;= 500) flush();
});
setInterval(flush, 250);

async function flush() {
  if (buffer.length === 0) return;
  const batch = buffer; buffer = [];
  await producer.send({ topic: 'telemetry.raw', messages: batch });   // Kafka owns durability from here
}
</code></pre>
<p>The broker spreads messages across ingest instances; Kafka gives replay, many downstream consumers and per-device ordering (key = deviceId). This MQTT-at-the-edge, Kafka-in-the-core shape is the standard IoT architecture — see <a href="#/topic/be-kafka">Kafka Deep</a> and <a href="#/topic/be-event-driven">Event-Driven Architecture</a>. If the ingest service is a NestJS app, its microservices package ships an MQTT transport — see <a href="#/topic/be-nestjs">NestJS (Advanced)</a>.</p>

<h3>Example 4 — Mosquitto with mTLS and per-device ACLs</h3>
<pre><code class="language-text"># /etc/mosquitto/conf.d/fleet.conf
per_listener_settings false
allow_anonymous false

# Devices: mutual TLS, cert CN becomes the username
listener 8883
cafile   /etc/mosquitto/certs/fleet-ca.crt
certfile /etc/mosquitto/certs/broker.crt
keyfile  /etc/mosquitto/certs/broker.key
require_certificate true
use_identity_as_username true

# Browser dashboards: WebSocket behind TLS-terminating load balancer
listener 8084
protocol websockets

password_file /etc/mosquitto/passwd     # for service accounts on the WS listener
acl_file      /etc/mosquitto/acl
max_queued_messages 200                 # cap per-session offline queue
persistence true
</code></pre>
<pre><code class="language-text"># /etc/mosquitto/acl
# Pattern rules apply to every client; %u = username (cert CN), %c = clientId.
pattern write v1/+/+/devices/%u/status
pattern write v1/+/+/devices/%u/telemetry
pattern write v1/+/+/devices/%u/cmd/res
pattern read  v1/+/+/devices/%u/cmd
pattern read  v1/+/+/devices/%u/config

# Room state: devices may read any room state on the tenant (tighten with a plugin if needed)
pattern read  v1/+/+/rooms/+/state

user svc-cmd-api
topic write v1/+/+/devices/+/cmd
topic read  v1/_svc/cmd-api/#

user svc-ingest
topic read  v1/+/+/devices/+/telemetry
</code></pre>
<p>Check the exact semantics of shared-subscription ACLs and pattern substitution in your Mosquitto version's docs. For real multi-tenant isolation (tenant A's devices can't read tenant B's rooms), use an auth plugin / HTTP auth hook that checks the device's tenant against the topic.</p>

<h3>Example 5 — AWS IoT Core: device cert + policy</h3>
<pre><code class="language-ts">// Node device using mqtt.js against AWS IoT Core (mTLS on 8883)
import fs from 'node:fs';
import mqtt from 'mqtt';

const thingName = 'tablet-0193';
const client = mqtt.connect('mqtts://' + process.env.IOT_ENDPOINT + ':8883', {
  clientId: thingName,                       // policy below requires clientId == thing name
  key: fs.readFileSync('/data/certs/device.key'),
  cert: fs.readFileSync('/data/certs/device.crt'),
  ca: fs.readFileSync('/data/certs/AmazonRootCA1.pem'),
  protocolVersion: 5,
  keepalive: 60,
});
// Note: QoS 2 isn't supported on AWS IoT Core — use QoS 0/1. Check current docs for
// MQTT 5 feature coverage, message size and per-connection rate quotas.
</code></pre>
<pre><code class="language-json">{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": "iot:Connect",
      "Resource": "arn:aws:iot:REGION:ACCOUNT:client/\${iot:Connection.Thing.ThingName}" },
    { "Effect": "Allow", "Action": "iot:Publish",
      "Resource": "arn:aws:iot:REGION:ACCOUNT:topic/v1/acme/*/devices/\${iot:Connection.Thing.ThingName}/*" },
    { "Effect": "Allow", "Action": "iot:Subscribe",
      "Resource": "arn:aws:iot:REGION:ACCOUNT:topicfilter/v1/acme/*/devices/\${iot:Connection.Thing.ThingName}/*" },
    { "Effect": "Allow", "Action": "iot:Receive",
      "Resource": "arn:aws:iot:REGION:ACCOUNT:topic/v1/acme/*/devices/\${iot:Connection.Thing.ThingName}/*" }
  ]
}
</code></pre>
<p>AWS-specific pieces you'd use alongside: <strong>Rules engine</strong> (SQL-like <code>SELECT ... FROM 'v1/+/+/devices/+/telemetry'</code> → Lambda / SQS / Kinesis / DynamoDB, no ingest service to run), <strong>Device Shadow</strong> (reported vs desired JSON per thing, with <code>$aws/things/{thing}/shadow/...</code> topics and delta notifications — a managed version of the retained <code>config</code> pattern), <strong>lifecycle events</strong> (connect/disconnect presence events on reserved <code>$aws/events/...</code> topics), and <strong>Jobs</strong> for OTA rollouts. See <a href="#/topic/cloud-sqs">AWS SQS</a> for the queue side of a rule action.</p>

<h3>Example 6 — Telemetry buffering on a device with no network</h3>
<pre><code class="language-ts">// QoS 0 telemetry is dropped while offline (mqtt.js may queue it in memory, but that's lost on app restart).
// For readings you must not lose (meeting check-ins, sensor counts used for billing), persist locally.
async function recordCheckIn(evt: CheckIn) {
  await localDb.insert('outbox', { id: evt.id, topic: checkInTopic, body: JSON.stringify(evt) });
  drainOutbox();
}

async function drainOutbox() {
  if (!client.connected) return;
  for (const row of await localDb.all('outbox', { limit: 50 })) {
    await client.publishAsync(row.topic, row.body, { qos: 1 });   // resolves on PUBACK
    await localDb.delete('outbox', row.id);                       // id lets the backend dedupe
  }
}
client.on('connect', drainOutbox);
</code></pre>
<p>Same idea as the transactional outbox in <a href="#/topic/be-queues">Queues &amp; Async Processing</a>, but on the device: QoS 1 guarantees broker receipt for one connection; the local outbox survives app restarts and long outages.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>Duplicate clientIds → connect/kick loop</h3>
<p>Two devices (a cloned kiosk image, a tablet restored from backup) use the same clientId. The broker disconnects the old connection when the new one arrives; the old one auto-reconnects and kicks the new one; repeat every second. Symptoms: both devices "flapping", wills firing constantly, broker logs full of takeovers. Fix: derive clientId from a provisioned per-device identity, never from an image default, and alert on takeover rate.</p>

<h3>LWT race on reconnect</h3>
<p>Wi-Fi drops; the device reconnects in 5 s on a new TCP connection and publishes <code>online</code>; the broker then times out the <em>old</em> connection (1.5 × keep-alive later) and publishes the will <code>offline</code> — which is now the retained state. Fixes: MQTT 5 Will Delay Interval with session expiry (the will is cancelled when the same session reconnects), or include a monotonically increasing connection counter / timestamp in status payloads and let consumers ignore older ones. Many brokers close the old connection on takeover, which helps, but don't rely on it without testing.</p>

<h3>Graceful shutdown doesn't fire the will</h3>
<p>A clean DISCONNECT discards the will (MQTT 5 lets the client ask for it to be sent via a reason code). If you rely on the will for "offline", publish <code>offline</code> yourself before disconnecting.</p>

<h3>Reconnect storm</h3>
<p>Broker restart or load-balancer failover disconnects 10,000 devices at once; all reconnect after the same 1 s and the TLS handshakes saturate the broker, which drops them again. Randomised initial delay + exponential backoff with jitter on devices; connection-rate limits on the broker.</p>

<h3>Persistent session with a random clientId</h3>
<p><code>clean:false</code> plus a new random clientId per app start creates a new session every launch; the broker keeps all the old ones (and queues messages for them) until expiry. Memory grows silently.</p>

<h3>Offline queue overflow and stale commands</h3>
<p>A device offline for a weekend has 3,000 queued messages; most are obsolete (room state changed 400 times). When it reconnects it is flooded and the UI replays stale states. Put <em>state</em> in retained messages (only the latest matters), keep queued messages for <em>commands</em> only, cap queue sizes, and use Message Expiry for commands.</p>

<h3>Retained message that should have been deleted</h3>
<p>A decommissioned room or device leaves a retained <code>state</code> / <code>status</code> forever; dashboards keep showing a "ghost" device. Clear with a zero-length retained publish as part of decommissioning.</p>

<h3>Ordering assumptions</h3>
<p>The spec orders messages per topic for a given QoS from one publisher, but messages on different topics, or with different QoS, or from shared-subscription groups across backend instances, can interleave. Include a sequence number or timestamp in state payloads and make consumers last-writer-wins on it.</p>

<h3>QoS downgrade</h3>
<p>Device publishes QoS 1, backend subscribed with QoS 0 → the broker delivers at QoS 0 to the backend. "We use QoS 1" isn't true end to end unless every subscriber also asked for QoS 1.</p>

<h3>Large payloads</h3>
<p>The protocol allows up to ~256 MB, but brokers and managed services cap far lower (AWS IoT Core historically 128 KB — check current docs). Firmware or log uploads go via pre-signed S3 URLs; MQTT carries the pointer.</p>

<h3>Android power management / backgrounded RN apps</h3>
<p>On a phone, Doze and app standby kill background sockets; MQTT can't keep a session alive for a backgrounded consumer app. Dedicated kiosk/tablet builds (device-owner mode, screen pinned, app in foreground) are fine. For phones: push to wake, MQTT/WebSocket only while foregrounded.</p>

<h3>Clock skew</h3>
<p>Devices with drifted clocks stamp telemetry in the future or 1970. Use broker/ingest receive time for ordering-critical logic, or sync time (NTP) on boot before publishing.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>1. One shared username/password for the whole fleet</h3>
<p>One leaked APK or kiosk image = an attacker can publish commands to every device. <strong>Fix:</strong> per-device credentials (certs or tokens), clientId bound to identity, ACLs per device subtree, revocation.</p>

<h3>2. Devices subscribing to <code>#</code></h3>
<p>Convenient in dev; in prod every device receives every other device's traffic (bandwidth, battery, privacy). <strong>Fix:</strong> subscribe to exact topics; ACLs that forbid wildcard reads for device identities.</p>

<h3>3. QoS 2 everywhere "to be safe"</h3>
<p>Four packets per message, broker state per message, slower throughput — and still not end-to-end exactly-once. <strong>Fix:</strong> QoS 0 for high-rate telemetry where the next reading supersedes this one; QoS 1 + idempotent handlers (message id) for commands/events; QoS 2 rarely, when duplicates are expensive and the handler can't be idempotent.</p>

<h3>4. Using non-retained messages for state</h3>
<pre><code class="language-ts">// ❌ tablet boots and shows "no schedule" until the next booking change (could be an hour)
client.publish(roomTopic + '/state', JSON.stringify(schedule), { qos: 1 });

// ✅ retained: every (re)subscriber gets the latest schedule immediately
client.publish(roomTopic + '/state', JSON.stringify({ ...schedule, seq: nextSeq() }), { qos: 1, retain: true });
</code></pre>

<h3>5. Retaining events</h3>
<p>Retaining "door-opened" or "meeting-started" means every new subscriber gets a stale event replayed as if it just happened (a new dashboard tab plays the alert sound). <strong>Fix:</strong> retain state only.</p>

<h3>6. Business logic inside the broker's rule engine with no tests</h3>
<p>Rule-engine SQL that filters, transforms and fans out to five targets becomes untested, unversioned production logic. <strong>Fix:</strong> keep broker rules thin (route to Kafka/SQS/Lambda); put logic in versioned, tested services.</p>

<h3>7. Treating the broker as a database</h3>
<p>"Query all devices whose battery is under 20%" against MQTT doesn't work — there's no query. <strong>Fix:</strong> project telemetry/status into a DB or time-series store and query that.</p>

<h3>8. Ignoring <code>sessionPresent</code></h3>
<p>Resubscribing on every connect works, but blindly <em>not</em> resubscribing assumes the broker remembered you. Brokers restart without persistence, sessions expire. <strong>Fix:</strong> resubscribe when <code>sessionPresent</code> is false (or always, idempotently).</p>

<h3>9. Topic names with identities or PII in free text</h3>
<p><code>rooms/Ravi's 1:1 with HR/state</code> — spaces, apostrophes, PII in broker logs and ACLs. <strong>Fix:</strong> opaque ids in topics; names in payloads; version prefix (<code>v1/</code>) so you can migrate the tree.</p>

<h3>10. No backpressure in the backend subscriber</h3>
<p>A Node subscriber doing a DB insert per message falls behind; mqtt.js keeps accepting, memory grows, the process OOMs. <strong>Fix:</strong> batch into Kafka/queue quickly, scale out with shared subscriptions, monitor broker-side queue depth for your client.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block"><div class="qa-question">Q1. What is MQTT and why is it used for IoT instead of HTTP?</div><div class="qa-answer">
<p>MQTT is a lightweight publish/subscribe protocol where clients keep one long-lived connection to a broker and exchange messages on hierarchical topics. For devices it beats HTTP because devices behind NAT can receive server push over the connection they opened, the per-message overhead is a few bytes, and the protocol itself handles flaky networks — keep-alive, QoS retries, persistent sessions that queue messages while offline, retained "current state" and Last Will for presence. With HTTP I'd be polling or rebuilding all of that myself.</p>
</div></div>

<div class="qa-block"><div class="qa-question">Q2. Explain QoS 0, 1 and 2. Which would you use for what?</div><div class="qa-answer">
<p>QoS 0 is at most once — fire and forget, no ack. QoS 1 is at least once — the sender resends until it gets PUBACK, so duplicates are possible. QoS 2 is exactly once per hop via PUBLISH, PUBREC, PUBREL, PUBCOMP. QoS is per hop, and the subscriber gets the minimum of the publish QoS and its subscription QoS. I use 0 for frequent telemetry where the next reading supersedes the last, 1 with an idempotency id for commands and business events, and 2 rarely, since it costs round trips and still doesn't make the backend's processing exactly-once.</p>
</div></div>

<div class="qa-block"><div class="qa-question">Q3. What are retained messages and Last Will, and how do they combine?</div><div class="qa-answer">
<p>A retained message is the last message on a topic that the broker stores and hands to any new subscriber immediately — perfect for current state. Last Will is a message the client registers at connect that the broker publishes if the client vanishes without a clean disconnect. Combined: each device's will is a retained "offline" on its status topic, and on connect the device publishes a retained "online" there. Any dashboard subscribing to <code>devices/+/status</code> instantly gets the presence of the whole fleet, and it stays correct as devices drop.</p>
</div></div>

<div class="qa-block"><div class="qa-question">Q4. What is a persistent session and what does the broker store?</div><div class="qa-answer">
<p>With a stable clientId and clean session off (3.1.1) or a session expiry interval (5.0), the broker keeps the client's subscriptions, QoS 1/2 messages that arrived while it was offline, and in-flight QoS 1/2 state. On reconnect, CONNACK says sessionPresent=1 and queued messages are delivered. Costs: broker memory, queues for devices that never return, and stale messages — so I bound session expiry, cap queue length, and use message expiry for commands.</p>
</div></div>

<div class="qa-block"><div class="qa-question">Q5. How does keep-alive work and how would you choose the value?</div><div class="qa-answer">
<p>The client declares a keep-alive interval; if it has nothing else to send it sends PINGREQ within that interval and expects PINGRESP. The broker considers the client dead after 1.5 times the interval and publishes its will. I pick it below the network's NAT/firewall idle timeout so mappings stay alive, and trade detection speed against traffic and battery — 30–60 seconds is typical for mains-powered tablets; battery sensors go longer or use sleep-and-reconnect patterns.</p>
</div></div>

<div class="qa-block"><div class="qa-question">Q6. Design the topic structure for a fleet of meeting-room tablets and kiosks across many customers and sites.</div><div class="qa-answer">
<p>Version prefix, then tenant, site, then either the room or device subtree: <code>v1/{tenant}/{site}/rooms/{roomId}/state</code> (retained, backend to tablets), <code>v1/{tenant}/{site}/devices/{deviceId}/status|telemetry|config|cmd|cmd/res</code>. Opaque ids only, no PII. State topics retained, events not. Devices may publish only under their own device subtree and read their own cmd/config plus their room's state; ACLs use the authenticated identity so one rule covers the fleet. Backend services use shared subscriptions like <code>$share/ingest/v1/+/+/devices/+/telemetry</code> to scale horizontally, and push the stream into Kafka for durability and analytics.</p>
</div></div>

<div class="qa-block"><div class="qa-question">Q7. What does MQTT 5 add that you'd actually use?</div><div class="qa-answer">
<p>Reason codes on acks and server-side DISCONNECT, so failures are diagnosable. Session expiry and message expiry, so offline queues are bounded and stale commands don't execute. User properties for trace ids and schema versions. Response topic plus correlation data for request/response commands. Shared subscriptions for load-balanced backends. Will delay interval to avoid presence flapping. Topic aliases for bandwidth on chatty devices. And flow control — receive maximum and maximum packet size — so small devices aren't overwhelmed.</p>
</div></div>

<div class="qa-block"><div class="qa-question">Q8. MQTT vs WebSockets for a kiosk fleet — which and why?</div><div class="qa-answer">
<p>They're different layers: WebSocket is a transport, MQTT is a messaging protocol that can run over TCP or over WebSocket. Raw WebSockets give me a pipe; I'd have to build topics/rooms, acks, offline queues, presence and a pub/sub backplane across server instances. MQTT gives those as a standard with existing brokers, client libraries on every platform, and managed options like AWS IoT Core. For a fleet I'd pick MQTT (over WSS on 443 if corporate firewalls block 8883). For a single web app's chat with one backend owning the protocol, plain WebSockets are fine.</p>
</div></div>

<div class="qa-block"><div class="qa-question">Q9. How do you secure an MQTT deployment?</div><div class="qa-answer">
<p>TLS everywhere. Per-device identity — X.509 client certs (mTLS) or short-lived tokens via a broker auth hook — never a shared fleet password. Bind clientId to that identity so one device can't take over another's session. Topic ACLs scoped to each device's subtree, no wildcard subscriptions for devices, tenant isolation checked in the auth layer. A provisioning flow that issues credentials when a device is enrolled, plus rotation and revocation for lost or stolen devices. And the backend validates every payload like untrusted API input.</p>
</div></div>

<div class="qa-block"><div class="qa-question">Q10. How would you send a command to a device and know it executed?</div><div class="qa-answer">
<p>Publish QoS 1 to the device's cmd topic with a unique command id, MQTT 5 response topic and correlation data, and a message expiry so it doesn't run hours late. The device dedupes by id (QoS 1 can redeliver), executes, and publishes the result to the response topic with the same correlation data. The backend keeps a pending map with a timeout and surfaces "timed out" vs "failed" vs "succeeded" to the API caller. For long operations — a firmware update — the device publishes progress events, and the source of truth is a job record in the DB, not the MQTT exchange.</p>
</div></div>

<div class="qa-block"><div class="qa-question">Q11. (FDE scenario) A customer says "the dashboard shows half our kiosks as offline, but they're clearly working, and some keep flipping between online and offline." How do you debug it?</div><div class="qa-answer">
<p>First scope it: which kiosks, which site, since when, any network or deploy change. Then check broker data: connection and disconnect logs for those clientIds, takeover events, keep-alive timeouts. Common causes in order: (1) duplicate clientIds from a cloned image — the broker keeps kicking one device for the other, wills fire constantly; (2) the LWT race — the device reconnects quickly, then the old connection times out and its retained "offline" overwrites the new "online"; (3) the customer's firewall or proxy killing idle connections sooner than our keep-alive, so connections silently die and reconnect. Fixes respectively: per-device clientIds from provisioning; Will Delay Interval or sequence numbers in status payloads; a lower keep-alive or WSS on 443. I'd confirm with the customer's network team, ship the fix to one site first, and show them the takeover and disconnect rates dropping before rolling out fleet-wide.</p>
</div></div>

<div class="qa-block"><div class="qa-question">Q12. (Senior probe) MQTT or Kafka for 50,000 sensors sending readings every 10 seconds?</div><div class="qa-answer">
<p>Both, at different layers. Sensors shouldn't speak Kafka — Kafka clients are heavy, assume a stable network and a trusted network position, and Kafka has no concept of per-device auth at that scale or of presence. MQTT handles the device edge: 50,000 connections, per-device certs and ACLs, QoS, offline sessions. Behind the broker, a bridge (shared-subscription ingest service, broker-native Kafka integration, or the AWS IoT rules engine) writes into Kafka keyed by sensor id. That's 5,000 messages/s — trivial for Kafka — and Kafka then gives replay, multiple consumers (TSDB, alerting, ML) and per-sensor ordering.</p>
</div></div>

<div class="qa-block">
  <div class="qa-question">Q13. How does MQTT compare with raw WebSockets, HTTP polling and push notifications, for an always-on device versus a phone app?</div>
  <div class="qa-answer">
    <p><strong>MQTT</strong> is bi-directional pub/sub where the broker does routing and fan-out, with QoS 0/1/2 per hop, persistent-session queues and retained state for offline devices, LWT presence and very low overhead: best for device fleets, telemetry, commands and presence. <strong>Raw WebSockets</strong> give a bi-directional point-to-point pipe, but you build rooms plus a pub/sub backplane, acks, catch-up and heartbeats yourself: good for chat or collaborative apps where one backend owns the protocol. <strong>HTTP polling</strong> is client-initiated with high per-request header overhead and offline handling is just "the next poll": fine for infrequent updates and the simplest infra. <strong>Push (FCM/APNs)</strong> is server-to-device only, best effort and throttled, with no presence. So for always-on tablets and kiosks I pick MQTT; for a mostly backgrounded phone app the OS kills the socket anyway, so I use push to wake it and fetch over HTTP.</p>
  </div>
</div>
` },

  ]
});
