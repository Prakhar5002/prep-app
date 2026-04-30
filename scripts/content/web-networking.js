window.PREP_SITE.registerTopic({
  id: 'web-networking',
  module: 'web',
  title: 'Networking (HTTP/TLS/CDN)',
  estimatedReadTime: '50 min',
  tags: ['networking', 'http', 'http2', 'http3', 'tls', 'cdn', 'cors', 'caching', 'cookies', 'dns', 'web'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>Web networking is the layer that delivers your content to users. Knowing how it works is non-negotiable for senior frontend engineers: HTTP versions, TLS handshakes, caching headers, CDNs, CORS, cookies, and DNS all directly affect your app's load time, security, and reliability.</p>
<ul>
  <li><strong>HTTP/1.1</strong> sequential per connection (head-of-line blocking); <strong>HTTP/2</strong> multiplexed over one TCP connection; <strong>HTTP/3</strong> over QUIC (UDP) — eliminates TCP HOL blocking, faster on lossy connections.</li>
  <li><strong>TLS 1.3</strong> reduces handshake to 1-RTT (or 0-RTT with session resumption); critical for first-byte time.</li>
  <li><strong>CDN</strong> = global edge cache + faster TLS + DDoS protection. Almost every production app should use one.</li>
  <li><strong>HTTP caching:</strong> <code>Cache-Control</code> (max-age, s-maxage, no-cache, no-store, immutable) + <code>ETag</code> / <code>Last-Modified</code> for revalidation.</li>
  <li><strong>CORS:</strong> the same-origin policy + opt-in mechanism for cross-origin requests; preflight (OPTIONS) for non-simple requests.</li>
  <li><strong>Cookies:</strong> <code>Secure</code>, <code>HttpOnly</code>, <code>SameSite</code>, <code>__Host-</code> prefix for security; <code>Domain</code> + <code>Path</code> for scope.</li>
  <li><strong>DNS</strong> resolves names; DNS-over-HTTPS / DoH increasingly default. <code>preconnect</code> warms the connection.</li>
  <li><strong>WebSockets / Server-Sent Events / WebTransport</strong> for real-time; HTTP for everything else.</li>
</ul>
<p><strong>Mantra:</strong> "HTTP/3 + TLS 1.3 over a CDN, with proper cache headers and locked-down cookies. Measure RTT and TTFB; optimize the slowest hop."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>What "networking" means for frontend engineers</h3>
<p>Every byte your app sends or receives crosses a network. Understanding the layers (DNS → TCP / QUIC → TLS → HTTP → application) tells you why one site is fast and another isn't, what to optimize, and what's not your problem.</p>

<h3>The OSI / TCP-IP layers (simplified)</h3>
<table>
  <thead><tr><th>Layer</th><th>Job</th><th>Examples</th></tr></thead>
  <tbody>
    <tr><td>Application</td><td>Your protocol</td><td>HTTP, WebSocket, gRPC</td></tr>
    <tr><td>Security</td><td>Encryption + auth</td><td>TLS</td></tr>
    <tr><td>Transport</td><td>Reliable delivery</td><td>TCP, UDP/QUIC</td></tr>
    <tr><td>Network</td><td>Routing</td><td>IP</td></tr>
  </tbody>
</table>

<h3>HTTP versions in 60 seconds</h3>
<table>
  <thead><tr><th>Version</th><th>Year</th><th>Key features</th></tr></thead>
  <tbody>
    <tr><td>HTTP/1.0</td><td>1996</td><td>One request per TCP connection</td></tr>
    <tr><td>HTTP/1.1</td><td>1997</td><td>Persistent connections, pipelining (rarely used due to HOL blocking)</td></tr>
    <tr><td>HTTP/2</td><td>2015</td><td>Binary, multiplexed over one TCP, header compression (HPACK), server push (deprecated)</td></tr>
    <tr><td>HTTP/3</td><td>2022</td><td>Runs over QUIC (UDP-based); eliminates TCP HOL blocking; faster on lossy connections</td></tr>
  </tbody>
</table>

<h3>Why HTTP/2 was a big deal</h3>
<ul>
  <li><strong>Multiplexing:</strong> dozens of requests over one connection without head-of-line blocking (at HTTP layer). HTTP/1.1 needed 6+ parallel connections.</li>
  <li><strong>Header compression (HPACK):</strong> headers don't repeat across requests.</li>
  <li><strong>Binary protocol:</strong> faster to parse than HTTP/1.1's text.</li>
  <li>Practical wins: 20-50% faster page loads on resource-heavy sites.</li>
</ul>

<h3>Why HTTP/3 matters</h3>
<p>HTTP/2 still has TCP head-of-line blocking: if a TCP packet drops, all multiplexed streams pause until retransmission. HTTP/3 uses QUIC (over UDP), which manages streams independently — one dropped packet only affects its own stream.</p>
<p>Practical impact: significantly faster on flaky mobile connections; minor on stable broadband. Adoption is widespread (~50% of internet traffic by 2026).</p>

<h3>TLS — what it is, why it's everywhere</h3>
<p>TLS encrypts and authenticates the connection. Modern web is HTTPS-only; HTTP/2 and HTTP/3 require TLS in browsers. TLS 1.3 (2018) reduced the handshake to 1-RTT (one round trip) and supports 0-RTT for repeat visitors.</p>

<table>
  <thead><tr><th>TLS version</th><th>Status</th></tr></thead>
  <tbody>
    <tr><td>TLS 1.2</td><td>Common; 2-RTT handshake; widely supported</td></tr>
    <tr><td>TLS 1.3</td><td>Modern default; 1-RTT (or 0-RTT for repeat); better security</td></tr>
    <tr><td>SSL 3.0 / TLS 1.0/1.1</td><td>Deprecated; insecure</td></tr>
  </tbody>
</table>

<h3>What's a CDN?</h3>
<p>Content Delivery Network — a globally distributed set of servers that cache your static assets near users. User requests are routed to the nearest edge; data travels short distances; latency drops dramatically.</p>

<table>
  <thead><tr><th>Provider</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>Cloudflare</td><td>Free tier; large network; security features</td></tr>
    <tr><td>Fastly</td><td>VCL config; popular for media</td></tr>
    <tr><td>AWS CloudFront</td><td>AWS-integrated</td></tr>
    <tr><td>Akamai</td><td>Enterprise; massive network</td></tr>
    <tr><td>Vercel / Netlify</td><td>Built-in for their hosted apps</td></tr>
  </tbody>
</table>

<h3>What CORS is</h3>
<p>The Same-Origin Policy blocks JS from one origin (scheme + host + port) reading responses from a different origin. CORS is the opt-in mechanism: the destination server sends headers (<code>Access-Control-Allow-Origin</code>, etc.) explicitly granting cross-origin access. Without CORS, your <code>fetch()</code> from <code>https://app.com</code> to <code>https://api.com</code> fails.</p>

<h3>Why interviewers ask</h3>
<ol>
  <li>Performance: networking is often the bottleneck. You should be able to diagnose.</li>
  <li>Security: CORS, cookies, HTTPS. Senior engineers don't ship insecure defaults.</li>
  <li>Architecture: deciding when to put work at the edge (CDN), in middleware, or in the origin server.</li>
  <li>Mobile: poor network conditions hit hardest. Mobile-first apps need network resilience.</li>
</ol>

<h3>What "good" looks like</h3>
<ul>
  <li>You serve everything over HTTPS via HTTP/2 or HTTP/3.</li>
  <li>Static assets are CDN-edged with long cache + immutable hashes.</li>
  <li>API responses have appropriate Cache-Control headers.</li>
  <li>You measure TTFB and RTT; you know where the time goes.</li>
  <li>You handle CORS deliberately; you understand preflights.</li>
  <li>Cookies are <code>Secure</code>, <code>HttpOnly</code>, <code>SameSite=Lax</code> by default.</li>
  <li>You use <code>preconnect</code> for upcoming origins.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>Anatomy of a request</h3>
<pre><code class="language-text">User clicks link →
  1. DNS lookup     (0-200ms, depending on cache)
  2. TCP / QUIC connect  (1 RTT)
  3. TLS handshake   (1 RTT for TLS 1.3, 0 RTT if resumed)
  4. HTTP request sent
  5. Server processes (TTFB)
  6. Response bytes stream
  7. Browser parses + renders

For an unconnected origin, that's 3+ RTTs before any data flows.
</code></pre>

<h3>RTT — the unit of network performance</h3>
<p>Round-Trip Time = time for a packet to go to server and come back. Typical RTTs:</p>
<table>
  <thead><tr><th>Scenario</th><th>RTT</th></tr></thead>
  <tbody>
    <tr><td>Same datacenter</td><td>0.5 - 2ms</td></tr>
    <tr><td>Same continent</td><td>20 - 80ms</td></tr>
    <tr><td>Cross-continent</td><td>100 - 200ms</td></tr>
    <tr><td>Mobile 4G</td><td>50 - 100ms</td></tr>
    <tr><td>Mobile 3G</td><td>200 - 500ms</td></tr>
  </tbody>
</table>
<p>Each RTT before HTTP data starts is "dead time." Reducing RTTs is more impactful than reducing bandwidth for small payloads.</p>

<h3>Why CDNs are about RTT, not bandwidth</h3>
<p>Bandwidth is rarely the bottleneck for small assets. The 100ms RTT to a cross-continent origin dominates. CDN edge servers cut RTT to ~5-20ms. That's why CDNs feel "fast" even with the same bandwidth.</p>

<h3>Connection reuse</h3>
<p>HTTP/1.1 keeps connections alive after a request; subsequent requests skip DNS / TCP / TLS. HTTP/2 multiplexes — one connection serves many requests in parallel. Implication: fewer origins = fewer handshakes = faster.</p>

<h3>HTTP/2 vs HTTP/3 head-of-line blocking</h3>
<pre><code class="language-text">HTTP/2 over TCP:
  Stream A: ████ . . . ███ ███
  Stream B: ████ ████ . . . ███
  Stream C: ████ ████ ███ . . .

  TCP packet on stream B drops at "."
  All streams pause until retransmission.

HTTP/3 over QUIC:
  Stream A: ████ ████ ████
  Stream B: ████ ████ ████
  Stream C: ████ ████ ████

  QUIC stream B drops at "."
  Only stream B pauses; A and C keep flowing.
</code></pre>

<h3>HTTP caching layers</h3>
<pre><code class="language-text">Browser cache (memory + disk)
   ↓ miss
Service Worker cache (if registered)
   ↓ miss
HTTP cache (browser disk)
   ↓ miss
CDN edge cache
   ↓ miss
Origin server
</code></pre>

<h3>Cache-Control directives</h3>
<table>
  <thead><tr><th>Directive</th><th>Meaning</th></tr></thead>
  <tbody>
    <tr><td><code>max-age=N</code></td><td>Fresh for N seconds (browser)</td></tr>
    <tr><td><code>s-maxage=N</code></td><td>Fresh for N seconds (shared cache, CDN)</td></tr>
    <tr><td><code>public</code></td><td>Cacheable by any cache</td></tr>
    <tr><td><code>private</code></td><td>Only by browser (per-user)</td></tr>
    <tr><td><code>no-cache</code></td><td>Must revalidate with origin every time</td></tr>
    <tr><td><code>no-store</code></td><td>Don't cache at all</td></tr>
    <tr><td><code>immutable</code></td><td>Will never change (hashed asset filenames)</td></tr>
    <tr><td><code>must-revalidate</code></td><td>Once stale, must check with origin</td></tr>
    <tr><td><code>stale-while-revalidate=N</code></td><td>Use stale up to N seconds while refreshing in background</td></tr>
  </tbody>
</table>

<h3>Cache strategies</h3>
<table>
  <thead><tr><th>Asset</th><th>Strategy</th></tr></thead>
  <tbody>
    <tr><td>Hashed JS / CSS (e.g., main.abc123.js)</td><td><code>Cache-Control: public, max-age=31536000, immutable</code></td></tr>
    <tr><td>HTML</td><td><code>Cache-Control: no-cache</code> (always revalidate; hash bumps when JS changes)</td></tr>
    <tr><td>API JSON</td><td><code>Cache-Control: private, max-age=60</code> or <code>no-store</code></td></tr>
    <tr><td>Images</td><td><code>Cache-Control: public, max-age=86400</code></td></tr>
    <tr><td>Sensitive data</td><td><code>Cache-Control: no-store, private</code></td></tr>
  </tbody>
</table>

<h3>ETag and conditional requests</h3>
<pre><code class="language-text">First request:
  GET /api/user/123
  → 200 OK, ETag: "abc123", Cache-Control: max-age=60

After 60s (now stale):
  GET /api/user/123
  If-None-Match: "abc123"
  → 304 Not Modified  (no body; just confirmation)
  → Browser uses cached body
</code></pre>
<p>304 saves bandwidth but still pays an RTT. Long max-age + immutable beats ETag for static assets.</p>

<h3>CORS in 60 seconds</h3>
<pre><code class="language-text">Origin: https://app.com
Target: https://api.com

Simple request (GET, POST with form data, no custom headers):
  Browser sends Origin header.
  Server replies with Access-Control-Allow-Origin: https://app.com
  → Browser delivers response to JS.

Non-simple (custom header, JSON content-type, PUT/DELETE):
  Browser sends OPTIONS preflight FIRST.
    OPTIONS /api/x
    Origin: https://app.com
    Access-Control-Request-Method: POST
    Access-Control-Request-Headers: Content-Type, Authorization
  Server replies:
    Access-Control-Allow-Origin: https://app.com
    Access-Control-Allow-Methods: POST, GET
    Access-Control-Allow-Headers: Content-Type, Authorization
    Access-Control-Max-Age: 86400  (cache preflight for a day)
  Then real request.
</code></pre>

<h3>Cookies — the security flags</h3>
<table>
  <thead><tr><th>Attribute</th><th>Effect</th></tr></thead>
  <tbody>
    <tr><td><code>Secure</code></td><td>Only sent over HTTPS</td></tr>
    <tr><td><code>HttpOnly</code></td><td>JS can't read (defense vs XSS)</td></tr>
    <tr><td><code>SameSite=Strict</code></td><td>Only sent on same-site requests</td></tr>
    <tr><td><code>SameSite=Lax</code></td><td>Default since 2020; sent on top-level navigation but not sub-resources</td></tr>
    <tr><td><code>SameSite=None; Secure</code></td><td>Cross-site allowed (e.g., embedded widgets)</td></tr>
    <tr><td><code>Domain=example.com</code></td><td>Scope to domain + subdomains</td></tr>
    <tr><td><code>Path=/api</code></td><td>Scope to URL path</td></tr>
    <tr><td><code>Max-Age=N</code></td><td>Expires in N seconds</td></tr>
    <tr><td><code>__Host- prefix</code></td><td>Implies Secure + Path=/ + no Domain (strongest scoping)</td></tr>
    <tr><td><code>__Secure- prefix</code></td><td>Implies Secure</td></tr>
  </tbody>
</table>

<h3>DNS</h3>
<table>
  <thead><tr><th>Record</th><th>Use</th></tr></thead>
  <tbody>
    <tr><td>A / AAAA</td><td>Hostname → IPv4 / IPv6</td></tr>
    <tr><td>CNAME</td><td>Alias to another hostname</td></tr>
    <tr><td>TXT</td><td>Verification, SPF / DKIM</td></tr>
    <tr><td>MX</td><td>Email routing</td></tr>
    <tr><td>HTTPS / SVCB</td><td>Modern hint records (alt-svc, ECH)</td></tr>
  </tbody>
</table>
<p>DNS-over-HTTPS (DoH) tunnels DNS over HTTPS to hide queries from local network observers; default in Firefox / iOS.</p>

<h3>WebSockets vs SSE vs HTTP polling</h3>
<table>
  <thead><tr><th>Technology</th><th>Direction</th><th>Use case</th></tr></thead>
  <tbody>
    <tr><td>HTTP polling</td><td>Client → Server (request/response)</td><td>Infrequent updates; simplest</td></tr>
    <tr><td>Long polling</td><td>Same; server holds open</td><td>Legacy; replaced by SSE/WS</td></tr>
    <tr><td>Server-Sent Events (SSE)</td><td>Server → Client (one-way push)</td><td>Live feeds, notifications</td></tr>
    <tr><td>WebSocket</td><td>Bidirectional, low-latency</td><td>Chat, collaboration, games</td></tr>
    <tr><td>WebTransport</td><td>Bidirectional over QUIC</td><td>Newer; gaming, real-time AV</td></tr>
  </tbody>
</table>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Inspecting the network</h3>
<p>Chrome DevTools → Network panel. Each request shows:</p>
<ul>
  <li>Status, size, time waterfall (DNS, connect, SSL, TTFB, download).</li>
  <li>Request / response headers, cookies, body.</li>
  <li>Initiator (which file triggered this request).</li>
  <li>Priority (High / Medium / Low).</li>
</ul>

<h3>Cache-Control examples</h3>
<pre><code class="language-text"># Static asset, hashed filename
Cache-Control: public, max-age=31536000, immutable

# HTML
Cache-Control: no-cache

# API user data (1-min cache, per-user)
Cache-Control: private, max-age=60

# Sensitive data
Cache-Control: no-store, private

# Stale-while-revalidate (background refresh)
Cache-Control: max-age=60, stale-while-revalidate=86400
</code></pre>

<h3>Resource hints (HTML)</h3>
<pre><code class="language-html">&lt;!-- DNS lookup ahead --&gt;
&lt;link rel="dns-prefetch" href="https://api.example.com" /&gt;

&lt;!-- DNS + TCP + TLS ahead --&gt;
&lt;link rel="preconnect" href="https://api.example.com" crossorigin /&gt;

&lt;!-- Specific resource --&gt;
&lt;link rel="preload" href="/font.woff2" as="font" type="font/woff2" crossorigin /&gt;

&lt;!-- Future-page navigation --&gt;
&lt;link rel="prefetch" href="/next-page.html" /&gt;
</code></pre>

<h3>fetch() with credentials</h3>
<pre><code class="language-js">// Default — does NOT send cookies cross-origin
fetch('/api/me', { credentials: 'same-origin' });

// Send cookies even cross-origin (server must opt in via CORS)
fetch('https://api.example.com/me', { credentials: 'include' });

// Never send cookies
fetch('/api/x', { credentials: 'omit' });
</code></pre>

<h3>CORS server config (Node / Express)</h3>
<pre><code class="language-js">app.use((req, res, next) =&gt; {
  res.setHeader('Access-Control-Allow-Origin', 'https://app.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});
</code></pre>

<h3>Cookie set in JS (with all flags)</h3>
<pre><code class="language-js">document.cookie = 'session=abc; Path=/; Secure; SameSite=Lax; Max-Age=86400';
// Note: HttpOnly can only be set by the SERVER, not JS.
</code></pre>

<h3>Cookie set by server</h3>
<pre><code class="language-text">Set-Cookie: session=abc; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=86400
Set-Cookie: __Host-csrf=xyz; Path=/; Secure; HttpOnly; SameSite=Strict
</code></pre>

<h3>Authorization header (Bearer)</h3>
<pre><code class="language-js">fetch('/api/me', {
  headers: { 'Authorization': \`Bearer \${token}\` }
});
</code></pre>

<h3>Compressed responses</h3>
<table>
  <thead><tr><th>Algorithm</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>gzip</td><td>Universal; ~70% reduction on text</td></tr>
    <tr><td>br (Brotli)</td><td>Better than gzip; ~80% reduction; supported by all modern browsers</td></tr>
    <tr><td>zstd</td><td>Newer; even better; gradual support</td></tr>
  </tbody>
</table>
<p>Server checks <code>Accept-Encoding</code> request header; sends compressed response if supported. Static asset CDNs typically pre-compress to Brotli once.</p>

<h3>Service Worker — programmable cache</h3>
<pre><code class="language-js">// sw.js
self.addEventListener('fetch', (event) =&gt; {
  event.respondWith(
    caches.match(event.request).then((cached) =&gt; {
      if (cached) return cached;
      return fetch(event.request).then((response) =&gt; {
        const clone = response.clone();
        caches.open('v1').then(cache =&gt; cache.put(event.request, clone));
        return response;
      });
    })
  );
});
</code></pre>

<h3>HTTP/2 server push (deprecated)</h3>
<p>Allowed servers to push resources before the client requested. Removed from Chrome in 2022 — performance gains didn't materialize at scale. Use <code>preload</code> hints instead.</p>

<h3>HTTP/3 detection</h3>
<p>Server includes <code>Alt-Svc: h3=":443"</code> header. Clients remember and use HTTP/3 on subsequent connections.</p>

<h3>WebSocket basics</h3>
<pre><code class="language-js">const ws = new WebSocket('wss://example.com/socket');

ws.addEventListener('open', () =&gt; ws.send('hello'));
ws.addEventListener('message', (e) =&gt; console.log(e.data));
ws.addEventListener('close', () =&gt; console.log('closed'));
ws.addEventListener('error', (e) =&gt; console.error(e));

ws.send(JSON.stringify({ type: 'subscribe', channel: 'alerts' }));
ws.close();
</code></pre>

<h3>Server-Sent Events</h3>
<pre><code class="language-js">const es = new EventSource('/stream');

es.addEventListener('message', (e) =&gt; console.log(e.data));
es.addEventListener('custom', (e) =&gt; console.log('custom event', e.data));
es.addEventListener('error', () =&gt; console.error('stream error'));
es.close();
</code></pre>
<p>SSE auto-reconnects on disconnect; tracks last-event-id for resumption. Good for one-way push (notifications, live dashboard updates).</p>

<h3>Beacon for analytics</h3>
<pre><code class="language-js">// Fire-and-forget; doesn't block unload
navigator.sendBeacon('/analytics', JSON.stringify({ event: 'page_unload' }));

// Backup: fetch with keepalive
fetch('/analytics', { method: 'POST', body: '...', keepalive: true });
</code></pre>

<h3>Reading network info</h3>
<pre><code class="language-js">// Network Information API (Chrome / Edge)
const conn = navigator.connection;
console.log(conn.effectiveType);   // "4g" | "3g" | "2g" | "slow-2g"
console.log(conn.downlink);        // Mbps
console.log(conn.rtt);             // ms
console.log(conn.saveData);        // user opted into data saver

conn.addEventListener('change', () =&gt; {
  console.log('Connection changed:', conn.effectiveType);
});
</code></pre>

<h3>Retries with backoff</h3>
<pre><code class="language-js">async function fetchWithRetry(url, opts = {}, retries = 3) {
  for (let i = 0; i &lt; retries; i++) {
    try {
      const r = await fetch(url, opts);
      if (r.ok) return r;
      if (r.status &gt;= 500) throw new Error(\`Server \${r.status}\`);
      return r;   // 4xx — don't retry
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((res) =&gt; setTimeout(res, Math.pow(2, i) * 200));
    }
  }
}
</code></pre>

<h3>AbortController for fetch cancellation</h3>
<pre><code class="language-js">const controller = new AbortController();
fetch('/api/x', { signal: controller.signal });
controller.abort();   // fetch promise rejects with AbortError
</code></pre>

<h3>Streaming responses</h3>
<pre><code class="language-js">const response = await fetch('/big-file');
const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  // process chunk (Uint8Array)
  process(value);
}
</code></pre>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Optimal cache headers per asset type</h3>
<pre><code class="language-text"># Hashed JS / CSS (filename includes hash like main.abc123.js)
Cache-Control: public, max-age=31536000, immutable

# Unhashed HTML (must revalidate to get latest)
Cache-Control: no-cache

# User-specific JSON
Cache-Control: private, max-age=60, must-revalidate

# Public images (cache for a day)
Cache-Control: public, max-age=86400

# Sensitive (account info, payments)
Cache-Control: no-store, private
</code></pre>

<h3>Example 2: CORS preflight diagnostic</h3>
<pre><code class="language-text">Symptom: fetch from https://app.com to https://api.com fails

Network panel shows:
  OPTIONS /api/x → 200 OK
  POST /api/x   → CORS error: missing Access-Control-Allow-Origin

Causes:
  - Server's OPTIONS response is fine, but POST response missing CORS header
  - OR server is checking the request origin and rejecting

Fix: ensure CORS headers are on EVERY response, not just OPTIONS
</code></pre>

<h3>Example 3: Service Worker offline cache</h3>
<pre><code class="language-js">// Pre-cache shell
const CACHE = 'shell-v1';
const SHELL = ['/', '/main.css', '/app.js'];

self.addEventListener('install', (e) =&gt; {
  e.waitUntil(caches.open(CACHE).then(c =&gt; c.addAll(SHELL)));
});

self.addEventListener('fetch', (e) =&gt; {
  e.respondWith(
    caches.match(e.request).then(cached =&gt; cached || fetch(e.request))
  );
});

// Stale-while-revalidate for API
self.addEventListener('fetch', (e) =&gt; {
  if (e.request.url.includes('/api/')) {
    e.respondWith(
      caches.open('api-v1').then(cache =&gt;
        cache.match(e.request).then(cached =&gt; {
          const fetched = fetch(e.request).then(r =&gt; {
            cache.put(e.request, r.clone());
            return r;
          });
          return cached || fetched;
        })
      )
    );
  }
});
</code></pre>

<h3>Example 4: Auth flow with httpOnly cookies</h3>
<pre><code class="language-js">// Server (login)
res.setHeader('Set-Cookie', \`session=\${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800\`);

// Client — fetch sends cookie automatically (if same-origin or credentials: 'include')
const r = await fetch('/api/me', { credentials: 'include' });
</code></pre>

<h3>Example 5: CSRF token via __Host- prefix</h3>
<pre><code class="language-text">Server sets:
  Set-Cookie: __Host-csrf=abc123; Path=/; Secure; HttpOnly; SameSite=Strict

Server also exposes the value via a meta tag or header so client can read it:
  &lt;meta name="csrf-token" content="abc123" /&gt;

Client sends it in a custom header:
  fetch('/api/x', { headers: { 'X-CSRF-Token': csrfToken } })

Server verifies header matches cookie (double-submit cookie pattern).
</code></pre>

<h3>Example 6: Detecting slow network and adapting</h3>
<pre><code class="language-js">function shouldFetchHeavy() {
  if (!navigator.connection) return true;
  const { effectiveType, saveData } = navigator.connection;
  if (saveData) return false;
  if (effectiveType === '2g' || effectiveType === 'slow-2g') return false;
  return true;
}

if (shouldFetchHeavy()) {
  fetch('/heavy-asset.json');
}
</code></pre>

<h3>Example 7: Streaming JSON parse</h3>
<pre><code class="language-js">// For very large JSON arrays, stream-parse instead of waiting for full body
async function streamArray(url) {
  const response = await fetch(url);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    // ... parse complete JSON chunks; yield to consumer ...
  }
}
</code></pre>

<h3>Example 8: Aborting an in-flight fetch on filter change</h3>
<pre><code class="language-js">let controller;

function search(q) {
  controller?.abort();
  controller = new AbortController();
  fetch(\`/api/search?q=\${q}\`, { signal: controller.signal })
    .then(r =&gt; r.json())
    .then(setResults)
    .catch(e =&gt; { if (e.name !== 'AbortError') console.error(e); });
}
</code></pre>

<h3>Example 9: Preconnect to upcoming origins</h3>
<pre><code class="language-html">&lt;!-- About to call api.example.com --&gt;
&lt;link rel="preconnect" href="https://api.example.com" /&gt;
&lt;link rel="preconnect" href="https://cdn.example.com" crossorigin /&gt;
&lt;link rel="preconnect" href="https://fonts.gstatic.com" crossorigin /&gt;
</code></pre>
<p>Each saves a DNS + TCP + TLS round-trip when the actual request fires.</p>

<h3>Example 10: Beacon on unload</h3>
<pre><code class="language-js">window.addEventListener('beforeunload', () =&gt; {
  navigator.sendBeacon('/analytics/exit', JSON.stringify({
    page: location.pathname,
    timeOnPage: Date.now() - pageStart,
  }));
});

// Or use 'visibilitychange' which is more reliable on mobile
document.addEventListener('visibilitychange', () =&gt; {
  if (document.visibilityState === 'hidden') {
    navigator.sendBeacon('/analytics/page-blur', '...');
  }
});
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>Mixed content</h3>
<p>HTTPS page with HTTP resources gets blocked. Modern browsers refuse to load mixed-content scripts / iframes outright. Use HTTPS for all subresources.</p>

<h3>Cookies and localhost</h3>
<p>Cookies set on production domain don't apply on <code>localhost</code>. Use <code>localhost</code>-specific cookies in dev or test against a staging origin.</p>

<h3>SameSite=None requires Secure</h3>
<p>Browsers reject <code>SameSite=None</code> cookies that aren't <code>Secure</code> (HTTPS only). Common bug when migrating to cross-site cookies.</p>

<h3>Preflight caching (Access-Control-Max-Age)</h3>
<p>Without max-age, every request triggers a preflight. Set <code>Access-Control-Max-Age: 86400</code> to cache for a day. Each browser has its own ceiling (Chrome: 2 hours; Firefox: 24 hours).</p>

<h3>credentials: 'include' + Origin: '*'</h3>
<p>Fetch with credentials requires server to send specific Allow-Origin (not <code>*</code>). Common error: "Cannot use wildcard with credentials."</p>

<h3>HTTP/2 connection coalescing</h3>
<p>Browsers coalesce connections: same IP + same TLS cert means same connection across multiple hostnames. Implication: putting all assets on one CDN cert improves connection reuse.</p>

<h3>HTTP/3 fallback</h3>
<p>If a connection fails, browsers fall back from HTTP/3 to HTTP/2 to HTTP/1.1. Slow networks may be HTTP/3-capable but the fallback dance costs round trips.</p>

<h3>Stale-while-revalidate isn't universal</h3>
<p>Some CDNs / browsers ignore SWR. Fastly + Cloudflare support it; others may not. Test.</p>

<h3>Vary header</h3>
<p>If response varies by Accept-Encoding / Authorization / cookie, set <code>Vary</code> header so caches don't serve wrong variant. <code>Vary: Accept-Encoding</code> is universal; <code>Vary: Authorization</code> often disables CDN cache entirely.</p>

<h3>cache-control no-cache vs no-store</h3>
<table>
  <thead><tr><th>no-cache</th><th>no-store</th></tr></thead>
  <tbody>
    <tr><td>Can be cached but must revalidate every time</td><td>Must NOT be cached anywhere</td></tr>
  </tbody>
</table>
<p>For HTML you usually want <code>no-cache</code> (revalidate; benefit from 304). For sensitive data you want <code>no-store</code>.</p>

<h3>OPTIONS preflight on simple requests</h3>
<p>Some clients trigger preflight unnecessarily (e.g., <code>Content-Type: application/json</code> isn't a "simple" type — preflight is required). Optimization: use <code>application/x-www-form-urlencoded</code> + URL params for small idempotent calls.</p>

<h3>Cookies and Path</h3>
<p>Cookie <code>Path=/api</code> is sent only for /api/* URLs. Be deliberate; default <code>/</code> is broadest.</p>

<h3>Cookie size limits</h3>
<p>Per-cookie ~4KB; per-domain ~50 cookies; total per request ~8KB headers. Storing JWT in cookie can blow this up; use <code>localStorage</code> + Authorization header for big tokens.</p>

<h3>Cookie attribute order</h3>
<p>Browsers parse cookie attributes loosely; spec says they should match. Use a library to set cookies safely.</p>

<h3>SameSite default change</h3>
<p>2020: Chrome flipped default from <code>None</code> to <code>Lax</code>. Many embedded widgets / iframes broke. If you ship a widget, set <code>SameSite=None; Secure</code> explicitly.</p>

<h3>TLS-SNI requirement</h3>
<p>HTTPS sites on shared IPs require SNI (Server Name Indication) in the TLS handshake. Old clients (XP, Android 2.x) lack SNI; server picks a default cert and breaks. Modern browsers all have SNI; your servers need ECH / TLS 1.3.</p>

<h3>Public Suffix List</h3>
<p>Domains like <code>foo.github.io</code> aren't actually under <code>github.io</code> ownership — that's a "public suffix." Cookies set on <code>github.io</code> would leak to all repos' sites. Browsers consult the Public Suffix List to prevent this.</p>

<h3>HSTS — Strict-Transport-Security</h3>
<pre><code class="language-text">Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
</code></pre>
<p>Tells browsers to always use HTTPS for this domain. Once set, can't be undone for max-age. Adopt with care.</p>

<h3>Subresource Integrity (SRI)</h3>
<pre><code class="language-html">&lt;script src="https://cdn.com/lib.js" integrity="sha384-..." crossorigin="anonymous"&gt;&lt;/script&gt;
</code></pre>
<p>Browser verifies the script's hash matches; rejects if tampered. Useful for third-party CDN scripts.</p>

<h3>Connection limits</h3>
<p>Browsers limit connections per origin (Chrome: 6 over HTTP/1.1, 1 over HTTP/2). Sharding domains was needed for HTTP/1.1; counterproductive for HTTP/2.</p>

<h3>WebSockets and proxies</h3>
<p>Some corporate proxies don't support WebSocket (RFC 6455); protocol upgrades fail. Fallback: SSE or long polling.</p>

<h3>SSE limit on HTTP/1.1</h3>
<p>HTTP/1.1 has 6 connections per origin; SSE consumes one. With 6+ tabs open, the 7th can't connect. HTTP/2 multiplexes; not an issue.</p>

<h3>Network failures don't always reject fetch</h3>
<p><code>fetch</code> rejects only on network errors (DNS fail, CORS, abort). HTTP errors (4xx, 5xx) still resolve; check <code>response.ok</code> or <code>response.status</code>.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: API response missing CORS headers on errors</h3>
<p>Server adds CORS to 200 responses but not 500s. Client gets cryptic "Network error" instead of seeing the 500.</p>

<h3>Bug 2: Cache-Control: no-cache treated as no-store</h3>
<p>Many engineers use no-cache thinking it disables caching entirely. It doesn't — it allows caching but requires revalidation. For "never cache," use <code>no-store</code>.</p>

<h3>Bug 3: Treating fetch errors</h3>
<pre><code class="language-js">// BAD
fetch('/api').then(r =&gt; r.json()).then(use);
// 500 response → r.json() returns {message: "error"}, not throws

// GOOD
const r = await fetch('/api');
if (!r.ok) throw new Error(\`HTTP \${r.status}\`);
const data = await r.json();
</code></pre>

<h3>Bug 4: HttpOnly cookies and JS-side reads</h3>
<p>Code tries to read <code>document.cookie</code> for the session; HttpOnly cookies aren't there. Either remove HttpOnly (insecure) or use a non-HttpOnly token for client-side use cases.</p>

<h3>Bug 5: Cookies not sent with cross-origin fetch</h3>
<p>Default <code>credentials: 'same-origin'</code> doesn't include cookies cross-origin. Add <code>credentials: 'include'</code> AND ensure CORS allows credentials.</p>

<h3>Bug 6: ETag mismatch causing constant 200s</h3>
<p>Server generates a new ETag on every request (e.g., timestamp). Clients always re-download. Fix: ETag based on content hash.</p>

<h3>Bug 7: Vary header excluding important variations</h3>
<p>Response varies by user (private data) but no <code>Vary: Cookie</code> header. CDN caches one user's response and serves it to others. Either add Vary or set Cache-Control: private.</p>

<h3>Bug 8: Forgetting Set-Cookie in CORS</h3>
<p>CORS allows credentials; cookies set via <code>Set-Cookie</code> on cross-origin response should work, but some browsers / paths fail. Test cross-origin set-cookie explicitly.</p>

<h3>Bug 9: Long-running fetch without abort</h3>
<p>Component unmounts while fetch is in flight; setState fires on unmounted component. Always wire AbortController + cleanup.</p>

<h3>Bug 10: WebSocket reconnect loop</h3>
<p>WebSocket disconnects → instant reconnect → server still down → instant reconnect → DDoS your own server. Always exponential backoff with cap.</p>

<h3>Anti-pattern 1: HTTP for sub-resources of HTTPS pages</h3>
<p>Mixed content errors. Always HTTPS everywhere.</p>

<h3>Anti-pattern 2: Static assets served from origin</h3>
<p>Bypassing CDN means every user across the globe hits your origin. Use a CDN; use long max-age for hashed filenames.</p>

<h3>Anti-pattern 3: Many domains for asset sharding</h3>
<p>Was a HTTP/1.1 trick; now harmful with HTTP/2 connection coalescing. Consolidate to one origin per CDN.</p>

<h3>Anti-pattern 4: localStorage for session tokens</h3>
<p>Vulnerable to XSS. Use HttpOnly cookies or refresh-token + memory pattern with short-lived access tokens.</p>

<h3>Anti-pattern 5: JWT in URL</h3>
<p>URLs are logged everywhere (server logs, browser history, analytics). Never put tokens in URL parameters.</p>

<h3>Anti-pattern 6: No retries on transient failures</h3>
<p>Fail-fast is fine for some cases, but mobile networks blip frequently. Retry once with backoff for idempotent requests.</p>

<h3>Anti-pattern 7: Polling when WebSocket / SSE available</h3>
<p>Polling every second wastes battery and bandwidth. Use SSE for one-way; WebSocket for bidirectional.</p>

<h3>Anti-pattern 8: Returning sensitive data in error messages</h3>
<p>500 errors with stack traces leaking server paths or user data. Sanitize errors before returning.</p>

<h3>Anti-pattern 9: CDN cache without versioning</h3>
<p>Update <code>main.css</code> at the CDN; users still get the old version cached for 30 days. Use hashed filenames + immutable cache.</p>

<h3>Anti-pattern 10: Ignoring Save-Data header</h3>
<p>Mobile users opt into data saver via OS / browser settings. Server / CDN can read <code>Save-Data: on</code> header and serve smaller assets. Ignored by most apps.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '🎤 Interview Patterns',
      html: `
<h3>The 14 questions worth rehearsing</h3>
<table>
  <thead><tr><th>Question</th><th>One-liner</th></tr></thead>
  <tbody>
    <tr><td><em>HTTP/1.1 vs 2 vs 3?</em></td><td>1.1: sequential per connection. 2: multiplexed over TCP. 3: over QUIC, no TCP HOL.</td></tr>
    <tr><td><em>What's a CDN?</em></td><td>Globally distributed cache of static assets near users; reduces RTT.</td></tr>
    <tr><td><em>What's CORS?</em></td><td>Same-origin policy + opt-in for cross-origin via response headers.</td></tr>
    <tr><td><em>What's a CORS preflight?</em></td><td>OPTIONS request before the real request, for non-simple cross-origin calls.</td></tr>
    <tr><td><em>Cache-Control directives?</em></td><td>max-age, s-maxage, no-cache, no-store, immutable, public/private, stale-while-revalidate.</td></tr>
    <tr><td><em>What's an ETag?</em></td><td>Server-provided fingerprint; client revalidates; server returns 304 if unchanged.</td></tr>
    <tr><td><em>Cookie security flags?</em></td><td>Secure (HTTPS), HttpOnly (no JS), SameSite (Lax / Strict / None), Domain, Path.</td></tr>
    <tr><td><em>What's TLS 1.3?</em></td><td>Modern TLS; 1-RTT handshake; 0-RTT for repeat visitors; better security.</td></tr>
    <tr><td><em>What's HSTS?</em></td><td>HTTP header forcing browsers to use HTTPS for the domain.</td></tr>
    <tr><td><em>WebSocket vs SSE?</em></td><td>WebSocket: bidirectional. SSE: server-to-client one-way; simpler, auto-reconnect.</td></tr>
    <tr><td><em>What's a service worker?</em></td><td>Programmable proxy for fetch events; offline support, custom caching.</td></tr>
    <tr><td><em>What's preconnect vs preload?</em></td><td>Preconnect: warm DNS + TCP + TLS. Preload: fetch a specific resource ahead.</td></tr>
    <tr><td><em>How does the browser limit connections?</em></td><td>HTTP/1.1: 6 per origin. HTTP/2: 1 multiplexed. HTTP/3: similar.</td></tr>
    <tr><td><em>How would you debug a slow API?</em></td><td>Check TTFB; DNS; TCP; TLS; server processing; response size; compression; CDN miss/hit.</td></tr>
  </tbody>
</table>

<h3>Live coding warmups</h3>
<ol>
  <li>Set up CORS on an Express server.</li>
  <li>Configure cache headers for hashed JS, HTML, API responses.</li>
  <li>Write a fetch wrapper with timeout + retry + backoff.</li>
  <li>Build a service worker with offline shell + SWR for API.</li>
  <li>Add resource hints to a page's head.</li>
  <li>Detect connection type and adapt resource loading.</li>
  <li>Set HttpOnly + SameSite + Secure cookie via Set-Cookie.</li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>fetch('/api') returns 500; treated as success — should check response.ok.</li>
  <li>CORS allows credentials but Origin: '*' — must specify origin.</li>
  <li>HTML cached for a year — should be no-cache.</li>
  <li>API response cached publicly with user-specific data — should be private + Vary.</li>
  <li>localStorage holding session token — should be HttpOnly cookie.</li>
  <li>WebSocket reconnect with no backoff — DDoS risk.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>Layer awareness</td><td>You name DNS, TCP/QUIC, TLS, HTTP layers and their roles.</td></tr>
    <tr><td>Cache strategy</td><td>You distinguish browser cache, CDN, service worker; you set headers correctly.</td></tr>
    <tr><td>CORS fluency</td><td>You explain preflights, credentials, simple vs non-simple.</td></tr>
    <tr><td>Cookie security</td><td>You volunteer all the security flags; you know about __Host- prefix.</td></tr>
    <tr><td>Tool fluency</td><td>You can read a Network panel waterfall and identify bottlenecks.</td></tr>
    <tr><td>Real-time choice</td><td>You pick polling / SSE / WebSocket / WebTransport based on use case.</td></tr>
    <tr><td>Mobile reality</td><td>You account for slow networks, save-data, retries.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN's <code>fetch</code> uses native networking (NSURLSession on iOS, OkHttp on Android). Same HTTP semantics; cookies handled by native cookie jar.</li>
  <li>RN doesn't have CORS (it's not a browser); you can hit any URL.</li>
  <li>iOS requires HTTPS by default (App Transport Security); HTTP requires explicit opt-in.</li>
  <li>Native HTTP/2 / HTTP/3 support depends on platform version; iOS 14+ and Android 9+ have HTTP/3.</li>
  <li><code>react-native-mmkv</code> + <code>react-native-keychain</code> replace localStorage / cookies for client-side storage.</li>
  <li>Network library options: fetch (built-in), axios, ky, react-query — all wrap native networking.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"Why does HTTP/2 reduce page load times?"</em> — Multiplexing (no per-request connection overhead), HPACK header compression, binary protocol parsing speed. The 6-connection limit of HTTP/1.1 caused waterfall blocking.</li>
  <li><em>"Why is HTTP/3 better on mobile?"</em> — QUIC eliminates TCP head-of-line blocking. On lossy 3G/4G connections, packet drops on one stream don't pause others.</li>
  <li><em>"What does TLS 1.3 0-RTT enable?"</em> — Repeat visitors send their first request data with the TLS handshake, no waiting. Slight risk of replay attacks; only safe for idempotent requests.</li>
  <li><em>"How does HSTS prevent downgrade attacks?"</em> — Browser remembers the domain requires HTTPS; subsequent navigations rewrite http:// to https:// before the request is sent.</li>
  <li><em>"How does the SameSite=Lax change affect tracking?"</em> — Third-party cookies don't get sent on top-level cross-site navigation by default; reduces tracking + CSRF surface but breaks legitimate embeds.</li>
  <li><em>"When would you use WebTransport?"</em> — Real-time game / video / audio streaming where you need low-latency unreliable streams in addition to reliable ones; WebSocket is reliable-only.</li>
</ul>

<h3>"What I'd do day one on the team"</h3>
<ul>
  <li>Audit response headers: cache-control, content-encoding, security headers.</li>
  <li>Verify CDN setup: cache-hit ratio, geographic distribution.</li>
  <li>Check cookie flags: Secure, HttpOnly, SameSite on all sensitive cookies.</li>
  <li>Set up monitoring: TTFB, LCP, CWV with breakdown by region.</li>
  <li>Add resource hints (preconnect, preload) to top pages.</li>
  <li>Audit fetch calls: error handling, abort, retry, timeout.</li>
  <li>Verify HTTPS-only with HSTS preload.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd POC HTTP/3 across our CDN tier and measure real-user impact."</li>
  <li>"I'd build a fetch wrapper that handles timeout, abort, retry, and circuit-breaking centrally."</li>
  <li>"I'd add Subresource Integrity to every third-party script we include."</li>
  <li>"I'd build a service-worker cache strategy by route type for offline support."</li>
  <li>"I'd add a Save-Data-aware asset path for users with data saver enabled."</li>
</ul>
`
    }
  ]
});
