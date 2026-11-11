window.PREP_SITE.registerTopic({
  id: "bsd-bb-edge",
  module: 'backend-sd',
  title: "Edge & Traffic (DNS, CDN, LBs, Gateways)",
  estimatedReadTime: "50 min",
  tags: ["system-design","dns","geodns","anycast","cdn","load-balancer","l4","l7","api-gateway","reverse-proxy","tls","sticky-sessions","interview"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline"><strong>The edge is a chain of choosers, caches and guards: DNS picks a region (slowly, because of TTL caching), anycast and the CDN get the user to a nearby box and answer from cache, L4 balancers spread connections, L7 proxies and gateways spread and police requests, and every hop is also a place where TLS ends, state can leak, timeouts disagree and a bad config fails globally.</strong></div>
  <h4>Key points</h4>
  <ul>
    <li><strong>DNS:</strong> stub → recursive resolver → root → TLD → authoritative, cached at every level for the TTL. Low TTL = faster steering but more queries; resolvers and runtimes don't always honour it, so <em>DNS failover takes minutes and has a long tail</em>, not seconds.</li>
    <li><strong>GeoDNS / latency routing</strong> answers by the <em>resolver's</em> location (or the client subnet, if the resolver sends EDNS Client Subnet). A user on a far-away resolver or a corporate VPN gets the wrong region.</li>
    <li><strong>Anycast:</strong> one IP announced over BGP from many sites; the network delivers to the nearest-by-routing site. Failover is a route withdrawal (seconds to a minute or so), not a TTL. Used by root DNS, 1.1.1.1/8.8.8.8, Cloudflare, Google's global LB, AWS Global Accelerator.</li>
    <li><strong>CDN:</strong> pull (fetch from origin on miss, the default) vs push (pre-upload or pre-position, for large or predictable content). The <em>cache key</em> decides correctness and hit ratio. Prefer versioned (content-hashed) URLs over purges; use tag purges for data; add an origin shield and request collapsing so a purge does not stampede the origin.</li>
    <li><strong>Hit ratio is leverage:</strong> going from 95% to 99% cuts origin traffic 5× (5% → 1% of requests miss).</li>
    <li><strong>L4 vs L7:</strong> L4 balances <em>connections</em> by the 5-tuple, sees no HTTP, is cheap and can pass TLS through (NLB, Maglev, Katran, IPVS). L7 terminates the connection and balances <em>requests</em>, routing by host/path/header with retries (ALB, Envoy, nginx, HAProxy). gRPC and HTTP/2 need L7 or client-side balancing, because L4 pins a whole multiplexed connection to one pod.</li>
    <li><strong>Algorithms:</strong> round robin (equal backends, equal requests), least outstanding requests (uneven request cost), power of two choices (many independent balancers, avoids herding), consistent hash (cache affinity). Least-connections alone sends extra traffic to a backend that <em>fails fast</em>, and floods new pods unless you have slow start.</li>
    <li><strong>Roughly, for L7 products: reverse proxy ⊂ load balancer ⊂ API gateway</strong> in features (an L4 LB like NLB isn't a reverse proxy, and AWS API Gateway doesn't balance a pool): a gateway adds per-client auth, quotas, transforms and API lifecycle. Keep business logic out of it.</li>
    <li><strong>TLS:</strong> terminate at the edge or LB to inspect and route; re-encrypt (or mTLS in a mesh) behind it when the network is not trusted. A full TLS 1.3 handshake needs 1 RTT (TLS 1.2: 2), on top of TCP's 1. Automate certificates: public cert lifetimes are being cut toward 47 days by 2029.</li>
    <li><strong>Sticky sessions</strong> hide server-side state in the routing layer: uneven load, lost sessions on node failure, painful deploys. Make servers stateless (session in Redis or a signed token). Affinity is fine when it is a <em>performance hint</em> (cache locality) or inherent (a live WebSocket), not when correctness depends on it.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap">Drawing one box labelled "LB" and moving on. Interviewers then ask: L4 or L7, and why? What balances the balancer? How long does failover really take, given DNS caching? What is in the CDN cache key, and can user A see user B's page? The edge is where "it works in the diagram" meets TTLs, idle timeouts and connection limits.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"Users hit an anycast edge, so a dead PoP is a BGP withdrawal, not a DNS TTL. TLS ends at the edge; static and media come from the CDN with content-hashed URLs, so deploys never need a purge."</div>
  <div class="revision-say">"Behind the edge, an L4 tier spreads connections to an L7 tier of Envoys that balance per request with least-request (power of two choices), slow start for new pods, and outlier detection. App servers are stateless, so no sticky sessions."</div>
  <div class="revision-say">"For regional failover I wouldn't rely on DNS alone: with a 60 s TTL I still expect a tail of clients for many minutes, so the dead region's edge also fails over at the proxy layer."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>The problem: getting a request to a healthy box, fast</h3>
<p>Between a user's tap and your code sit several decisions (<em>which region</em>, <em>which site</em>, <em>which machine</em>, <em>which process</em>) and several jobs no app server wants to do itself: serve static content, end TLS, block abuse, check API keys. The edge does all of it, for every request, so its mistakes are global.</p>

<h3>Five jobs, five components</h3>
<table>
  <thead><tr><th>Job</th><th>Component</th><th>Granularity</th><th>Real systems</th></tr></thead>
  <tbody>
    <tr><td><strong>Find</strong> a region or site</td><td>DNS (GeoDNS, latency, weighted, failover policies)</td><td>Per resolver, cached for TTL</td><td>Route 53, Cloudflare DNS, NS1, Google Cloud DNS</td></tr>
    <tr><td><strong>Get close</strong> to the user</td><td>Anycast + edge PoPs</td><td>Per packet route (BGP)</td><td>Cloudflare, Google Front End, AWS Global Accelerator, root DNS</td></tr>
    <tr><td><strong>Answer without the origin</strong></td><td>CDN cache, edge compute</td><td>Per object (cache key)</td><td>Akamai, Cloudflare, Fastly, CloudFront, Netflix Open Connect</td></tr>
    <tr><td><strong>Spread load</strong> across machines</td><td>L4 and L7 load balancers</td><td>Per connection (L4) or per request (L7)</td><td>Maglev, Katran, NLB, ALB, Envoy, HAProxy, nginx</td></tr>
    <tr><td><strong>Guard and police</strong> the API</td><td>Reverse proxy, API gateway, WAF</td><td>Per request, per client</td><td>Kong, AWS API Gateway, Apigee, Envoy Gateway, Cloudflare WAF</td></tr>
  </tbody>
</table>

<h3>Why a deep interviewer cares</h3>
<ul>
  <li><strong>Latency:</strong> a new HTTPS connection costs 2–4 round trips before the first byte. If the user is 200 ms from your origin, that is most of a second. Ending connections near the user is often the biggest latency win in the whole design (the RTT story is in <a href="#/topic/web-networking">Networking</a> and the numbers in <a href="#/topic/bsd-estimation">Estimation</a>).</li>
  <li><strong>Capacity:</strong> media egress hits a box's NIC (10 Gbps ≈ 1.25 GB/s) before its CPU; the CDN is how media scales.</li>
  <li><strong>Availability:</strong> failover is only as fast as the slowest steering layer. DNS is the slowest.</li>
  <li><strong>Blast radius:</strong> one edge config change touches every request (outages in Pitfalls).</li>
</ul>

<h3>When <em>not</em> to add more edge</h3>
<p>A small app (hundreds of requests per second, one region) needs a managed DNS zone, a CDN or proxy in front for TLS and static files, one reverse proxy or managed LB, and two app instances. A separate gateway, a mesh and multi-region steering add cost, hops and failure modes with no benefit at that size.</p>
<div class="callout insight"><div class="callout-title">What a deep interviewer is really testing</div>
<p>Whether you know the <em>granularity</em> and the <em>speed</em> of each steering layer. DNS steers resolvers, slowly. Anycast steers packets, in seconds to minutes. L4 steers connections. L7 steers requests, in milliseconds. Most follow-up questions ("why does traffic still go to the dead region?", "why is one gRPC pod hot?") are a mismatch between the layer you chose and the granularity you needed.</p></div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>The path of one request</h3>
<div class="diagram"><pre>
  phone / browser
     │ 1. DNS: api.example.com ?  (stub → recursive resolver,
     │    cached for TTL; GeoDNS answers by resolver location)
     ▼
  ┌──────────────────────── EDGE PoP (anycast IP) ────────────────┐
  │ 2. TCP + TLS end here, ~10-30 ms from the user                │
  │ 3. WAF / bot rules / rate limits                              │
  │ 4. CDN cache:  HIT ──► respond (origin never sees it)         │
  │                MISS ─► (origin shield) ─► warm conn to origin │
  └───────────────────────────────┬───────────────────────────────┘
                                  │ long-lived, pooled connections
                                  ▼
  ┌──────────── REGION ───────────────────────────────────────────┐
  │ 5. L4 LB (NLB / Maglev / Katran): hash 5-tuple ─► L7 node     │
  │ 6. L7 LB / API gateway (Envoy, ALB, Kong): route by host,     │
  │    path, header; auth, quotas; least-request to a pod         │
  │ 7. service pod ─► DB / cache / queue                          │
  └───────────────────────────────────────────────────────────────┘
</pre></div>
<p>Three kinds of box: <strong>choosers</strong> (DNS, anycast, L4, L7), <strong>caches</strong> (resolver, CDN, gateway) and <strong>guards</strong> (WAF, auth, rate limits). Every cache can serve stale or wrong data, every chooser has a failover speed, every guard can become the bottleneck.</p>

<h3>The steering layers by speed and granularity</h3>
<table>
  <thead><tr><th>Layer</th><th>Steers</th><th>Failover speed</th><th>Knows about health?</th><th>Typical failure</th></tr></thead>
  <tbody>
    <tr><td>DNS (GeoDNS, failover records)</td><td>Resolvers, then everyone behind them</td><td>Health-check detection (~30–90 s) + TTL + resolvers and clients that overstay it: minutes, long tail</td><td>Only via provider health checks</td><td>Stale answers long after failover</td></tr>
    <tr><td>Anycast (BGP)</td><td>Packets, per network path</td><td>Route withdrawal converges in seconds to a minute or so</td><td>Only if the site withdraws itself</td><td>Traffic lands at a "near" site that is far in km; a route flap can reset connections</td></tr>
    <tr><td>L4 load balancer</td><td>Connections (5-tuple)</td><td>Health checks: seconds</td><td>Yes, TCP/HTTP checks</td><td>Long-lived connections stay pinned and never rebalance</td></tr>
    <tr><td>L7 proxy / gateway</td><td>Individual requests</td><td>Retry on another host: milliseconds</td><td>Yes, active checks + outlier detection</td><td>Retry storms; proxy becomes the bottleneck</td></tr>
    <tr><td>Client-side balancing (gRPC, service mesh)</td><td>Requests, from the caller</td><td>Milliseconds</td><td>Yes, per client</td><td>Every client needs a fresh endpoint list (service discovery)</td></tr>
  </tbody>
</table>

<h3>Three hooks that make it stick</h3>
<ol>
  <li><strong>DNS is a cache you do not control.</strong> Setting a TTL is a request, not a command. Plan failover for clients that ignore it.</li>
  <li><strong>L4 counts connections, L7 counts requests.</strong> If one connection carries thousands of requests (HTTP/2, gRPC, WebSocket), L4 balancing is effectively random pinning.</li>
  <li><strong>Every hop has its own idle timeout.</strong> Client, CDN, LB, proxy and app each decide when an idle connection dies. When two adjacent hops disagree, you get intermittent 502s.</li>
</ol>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. DNS: resolution, TTL and steering</h3>
<p><strong>Resolution.</strong> The OS stub resolver asks a <em>recursive resolver</em> (ISP, corporate, or a public one like 8.8.8.8 or 1.1.1.1). On a cache miss the resolver walks the hierarchy: a root server (13 named root identities served by well over a thousand anycast instances) refers it to the TLD servers for <code>.com</code>, which refer it to your <em>authoritative</em> servers, which give the answer with a TTL. Every layer (browser, OS, resolver) caches for up to that TTL. Negative answers (NXDOMAIN) are cached too, for a time taken from the zone's SOA record, which is why "the record I just created still doesn't resolve" happens.</p>
<p><strong>TTL trade-off.</strong></p>
<table>
  <thead><tr><th>TTL</th><th>Good for</th><th>Costs</th></tr></thead>
  <tbody>
    <tr><td>Long (hours to a day)</td><td>Stable records (MX, NS); fewer queries; survives an authoritative DNS outage longer</td><td>A wrong record or a dead IP lives for hours</td></tr>
    <tr><td>Short (30–60 s)</td><td>Failover and traffic steering; managed LB records (AWS ELB names use 60 s)</td><td>More queries (and DNS bills), an extra lookup on more cold requests, more exposure to DNS provider outages</td></tr>
    <tr><td>Very short (under ~30 s)</td><td>Rarely worth it</td><td>Some resolvers enforce a minimum anyway; the gain is lost in the long tail</td></tr>
  </tbody>
</table>
<p>The common practice: keep TTLs moderate, and <em>lower them a day or two before a planned migration</em> (the old long TTL has to expire first), then raise them again.</p>
<p><strong>Why DNS failover has a long tail.</strong> Detection takes time (Route 53 checks every 30 s by default, or 10 s at extra cost, and needs a few failures in a row). Then resolvers serve the cached answer until its TTL ends, some resolvers and middleboxes stretch TTLs, and applications cache resolved addresses: connection pools keep sockets to the old IP open indefinitely, and older JVM setups with a security manager cached lookups forever (the default without one is 30 s). Long-lived clients only re-resolve when they reconnect. So plan for most traffic to move within a few minutes and a tail that needs the old target to fail closed or forward.</p>
<p><strong>Steering policies.</strong> Simple round-robin DNS (several A records) spreads load roughly but knows nothing about health or load. Managed DNS adds <em>weighted</em> (canary 5% to a new region), <em>latency-based</em> (the region with the lowest measured latency from the resolver's network), <em>geolocation</em> (by country, also for data residency), and <em>failover</em> (primary/secondary with health checks).</p>
<p><strong>GeoDNS sees the resolver, not the user.</strong> The authoritative server only sees the recursive resolver's IP. EDNS Client Subnet (ECS) lets the resolver pass a truncated client subnet, so answers can be per user network. Google Public DNS sends ECS to authoritative servers that support it; Cloudflare's 1.1.1.1 deliberately does not, for privacy. Corporate VPNs and centralised resolvers routinely put users in the wrong region. Anycast avoids this problem entirely, which is one reason large edges prefer it.</p>
<p><strong>Apex records.</strong> A zone apex (<code>example.com</code>) cannot be a CNAME, so pointing it at a managed LB or CDN hostname needs a provider feature: Route 53 ALIAS, Cloudflare CNAME flattening, or ANAME in other providers.</p>

<h3>2. Anycast</h3>
<p>Many sites announce the same IP prefix over BGP. Each router forwards to the "best" path by BGP policy, so a user reaches a nearby site without any DNS logic. It is "nearest by routing", which usually but not always means nearest in distance.</p>
<ul>
  <li><strong>Failover:</strong> a sick site withdraws its announcement and traffic shifts to the next site as routes converge (seconds to a minute or so). No client cache is involved.</li>
  <li><strong>DDoS:</strong> a volumetric attack is split across every site instead of hitting one. This is why DNS roots, public resolvers and CDNs use it.</li>
  <li><strong>TCP caveat:</strong> a route change mid-connection can deliver packets to a site that has no state for that connection, which resets it. In practice routes are stable for the length of most connections, so large edges run TCP (and QUIC) over anycast; very long-lived connections need to tolerate a reconnect.</li>
  <li><strong>Cost:</strong> you need your own IP space and BGP sessions at every site, or you buy it (Cloudflare, Google Cloud's global external LB, AWS Global Accelerator).</li>
</ul>

<h3>3. CDN: pull vs push, cache keys, TTLs, invalidation</h3>
<table>
  <thead><tr><th></th><th>Pull (origin pull)</th><th>Push / pre-positioning</th></tr></thead>
  <tbody>
    <tr><td>How</td><td>Edge fetches from origin on the first miss, caches per headers</td><td>You upload to CDN storage, or the CDN pre-fills edges on a schedule</td></tr>
    <tr><td>Good for</td><td>Most web assets, images, API responses; long-tail catalogues</td><td>Large, predictable, popular content (video catalogue, game patches, app releases)</td></tr>
    <tr><td>Costs</td><td>First request per edge is slow; a purge triggers a refill wave</td><td>You manage what is where; storage on every edge; stale if you forget to update</td></tr>
    <tr><td>Example</td><td>CloudFront / Cloudflare / Fastly in front of S3 or R2 or an app</td><td>Netflix Open Connect appliances filled overnight during off-peak windows</td></tr>
  </tbody>
</table>
<p><strong>The cache key</strong> is the identity of a cached object. The default is roughly scheme + host + path + query string. Everything that changes the response must be in it, and nothing else should be:</p>
<ul>
  <li><strong>Too little in the key</strong> (it ignores a header or cookie the origin used) → user A's response is served to user B. This is a correctness and privacy bug.</li>
  <li><strong>Too much in the key</strong> (all cookies, all query params including <code>utm_*</code> or a cache-buster, <code>Vary: User-Agent</code>) → thousands of variants of one object and the hit ratio collapses.</li>
  <li><strong>Normalise:</strong> sort or allow-list query params, lowercase the host, collapse device detection into 2–3 buckets, and strip auth tokens from the key for signed URLs (validate the signature, then cache on the path).</li>
  <li><strong>Vary</strong> is the HTTP way to say "the key includes this header". <code>Vary: Accept-Encoding</code> is normal. Some CDNs ignore other Vary values or treat them as uncacheable, so state variants explicitly in the CDN's cache-key config.</li>
</ul>
<p><strong>Freshness.</strong> <code>Cache-Control: max-age</code> (browsers and shared caches), <code>s-maxage</code> (shared caches only, so the CDN can hold longer than the browser), <code>private</code> (never in a shared cache), <code>no-store</code>. <code>stale-while-revalidate</code> serves the old copy while refreshing in the background (check your CDN honours it); <code>stale-if-error</code> serves the old copy if the origin is down. Check each provider's defaults: CloudFront, for example, has a default TTL of 24 h for responses without caching headers on its common settings, which surprises teams that never set Cache-Control.</p>
<p><strong>Invalidation, best first.</strong></p>
<ol>
  <li><strong>Versioned URLs</strong> for build assets: <code>app.3f9c2a.js</code> with a one-year immutable TTL. A deploy changes the HTML to point at new names; nothing is purged and old pages keep working.</li>
  <li><strong>Tag (surrogate-key) purges</strong> for data-driven pages: tag every response with the entities it contains (<code>product-42</code>) and purge the tag when product 42 changes. Fastly surrogate keys and Cloudflare Cache-Tags (all plans since 2025) support this.</li>
  <li><strong>Short TTL + stale-while-revalidate</strong> when a few seconds of staleness is fine: no purge logic at all (check your CDN honours SWR).</li>
  <li><strong>Path or wildcard purges</strong> as the emergency tool. Speed varies widely: Fastly advertises global purges in roughly 150 ms; CloudFront invalidations have historically taken seconds to minutes and are billed per path beyond a free monthly allowance.</li>
</ol>
<p><strong>Protecting the origin.</strong> An <em>origin shield</em> (tiered cache: CloudFront Origin Shield, Cloudflare Tiered Cache, Fastly shielding) makes edges fetch from one regional parent instead of each going to origin, so a miss wave of 300 PoPs becomes a few origin requests. <em>Request collapsing</em> makes concurrent misses for the same key wait on one origin fetch (most CDNs do it; nginx needs <code>proxy_cache_lock</code>). And the origin should only accept traffic from the CDN (IP allow-list, a secret header, or authenticated origin pulls), or attackers simply bypass the CDN.</p>
<p><strong>Dynamic content benefits too.</strong> Even with zero cache hits, the CDN ends TCP and TLS near the user and forwards over warm, pooled connections to the origin. That saves the handshake round trips across the long path (worked numbers in Examples). Edge compute (Cloudflare Workers, CloudFront Functions and Lambda@Edge, Fastly Compute) adds per-request logic: auth checks, A/B bucketing, redirects, header rewrites.</p>

<h3>4. L4 vs L7 load balancing</h3>
<table>
  <thead><tr><th></th><th>L4 (transport)</th><th>L7 (application)</th></tr></thead>
  <tbody>
    <tr><td>Sees</td><td>IPs, ports, TCP/UDP packets</td><td>HTTP method, host, path, headers, cookies, gRPC service</td></tr>
    <tr><td>Balances</td><td>Connections (hash of the 5-tuple, or a pick per new flow)</td><td>Each request, over pooled backend connections</td></tr>
    <tr><td>TLS</td><td>Pass-through possible (end-to-end encryption, LB never sees plaintext)</td><td>Terminates (or re-encrypts) to read HTTP</td></tr>
    <tr><td>Cost / throughput</td><td>Very cheap per packet; can be kernel-bypass or XDP; can use direct server return</td><td>Parses every request: more CPU, a few ms at most when healthy</td></tr>
    <tr><td>Features</td><td>Static IPs, any protocol (MQTT, game UDP, databases), client IP preserved</td><td>Path routing, header routing, retries, timeouts, canary weights, WAF, compression, auth</td></tr>
    <tr><td>Weakness</td><td>One long HTTP/2 or WebSocket connection stays pinned; no per-request retry</td><td>Is itself a fleet to scale; extra hop; must handle huge connection counts</td></tr>
    <tr><td>Examples</td><td>AWS NLB, Google Maglev, Meta Katran, GitHub GLB, Linux IPVS, HAProxy TCP mode</td><td>AWS ALB, Envoy, nginx, HAProxy HTTP mode, Traefik, Google Front End</td></tr>
  </tbody>
</table>
<p><strong>Why big systems stack them.</strong> Routers spread packets across L4 machines with ECMP. The L4 machines (Maglev, Katran) use consistent hashing on the 5-tuple plus a connection table, so every L4 machine picks the same backend for a given flow and losing one L4 machine does not break most connections. The L4 tier then spreads connections across a fleet of L7 proxies, which do the clever per-request work. The L4 tier makes the L7 tier horizontally scalable; the L7 tier makes routing smart.</p>
<p><strong>Forwarding modes at L4.</strong> <em>NAT</em> (LB rewrites addresses both ways, so replies come back through it), <em>tunnelling</em> (LB encapsulates; backend decapsulates) and <em>direct server return</em> (backend replies straight to the client, bypassing the LB). DSR fits asymmetric traffic like video, where responses are far bigger than requests.</p>
<p><strong>Client IP.</strong> An L7 proxy appends the client IP to <code>X-Forwarded-For</code>; trust only the entries added by your own proxies (counting from the right), never the leftmost value, which the client can forge. At L4, the PROXY protocol (from HAProxy) prepends the original addresses to the TCP stream, or the LB preserves the source IP.</p>

<h3>5. Balancing algorithms</h3>
<table>
  <thead><tr><th>Algorithm</th><th>How</th><th>Pick it when</th><th>Watch out</th></tr></thead>
  <tbody>
    <tr><td>Round robin / weighted RR</td><td>Next backend in turn (weights for bigger boxes)</td><td>Backends are equal and requests cost about the same</td><td>A slow request mix piles up on whoever got it; ignores load</td></tr>
    <tr><td>Least connections / least outstanding requests</td><td>Backend with the fewest in-flight</td><td>Request cost varies a lot (reports vs lookups); long requests</td><td>A backend that fails fast has the fewest in flight and attracts traffic; new backends get flooded</td></tr>
    <tr><td>Power of two choices (P2C)</td><td>Pick 2 at random, send to the less loaded</td><td>Many independent balancers with stale load info (sidecars, many proxies)</td><td>Needs some load signal (in-flight count, latency)</td></tr>
    <tr><td>Latency-aware (EWMA)</td><td>Prefer backends with low recent latency, usually with P2C</td><td>Heterogeneous or noisy backends (Finagle, Linkerd)</td><td>Can starve a backend that has recovered unless it is probed</td></tr>
    <tr><td>Consistent hash (ring, Maglev, IP hash)</td><td>Same key → same backend</td><td>Cache affinity (per-user or per-object local cache), L4 flow stickiness</td><td>Hot keys; uneven load; affinity breaks when membership changes (see <a href="#/topic/bsd-bb-partitioning">Partitioning</a>)</td></tr>
    <tr><td>Random</td><td>Uniform random</td><td>Simple and surprisingly fine at large scale</td><td>Variance at small backend counts</td></tr>
  </tbody>
</table>
<p><strong>Why P2C beats "always pick the least loaded".</strong> When many balancers each see slightly stale load numbers, they all choose the same "best" backend at the same moment and flood it (herding). Picking two at random and taking the better one keeps most of the benefit with almost none of the herding. In the classic balls-into-bins result, the maximum load drops from about log n / log log n with one random choice to about log log n with two. Envoy's least-request balancer uses P2C by default, and nginx offers <code>random two least_conn</code>.</p>
<p><strong>Slow start and outlier detection.</strong> A new pod has cold caches, a cold JIT and an empty connection pool, and least-connections sees it as idle. Slow start ramps its weight up over tens of seconds (ALB and Envoy both support it). Outlier detection (passive health checking) ejects a backend after consecutive 5xx or high latency, even while its active health check still passes. Envoy also has a <em>panic threshold</em>: by default, if fewer than 50% of hosts look healthy, it balances across all of them, on the theory that a mass failure is more likely a broken health check than a broken fleet. AWS ELBs similarly fail open when every target is unhealthy.</p>

<h3>6. Reverse proxy vs load balancer vs API gateway vs mesh</h3>
<table>
  <thead><tr><th>Thing</th><th>Adds</th><th>Traffic</th><th>Examples</th></tr></thead>
  <tbody>
    <tr><td>Reverse proxy</td><td>Terminates client connections; TLS, compression, caching, buffering slow clients, static files, routing</td><td>North-south</td><td>nginx, Caddy, HAProxy, Envoy</td></tr>
    <tr><td>Load balancer</td><td>A reverse proxy (or packet forwarder) with a backend pool, health checks and an algorithm</td><td>North-south and internal</td><td>ALB, NLB, HAProxy, Envoy</td></tr>
    <tr><td>API gateway</td><td>Per-client concerns: API keys and JWT validation, quotas and rate limits, request/response transforms, versioning, usage plans, developer portal, sometimes aggregation</td><td>North-south, at the API boundary</td><td>Kong (on nginx/OpenResty), AWS API Gateway, Apigee, Tyk, Envoy Gateway</td></tr>
    <tr><td>Service mesh</td><td>The same L7 features between services: mTLS, retries, timeouts, client-side balancing, telemetry</td><td>East-west</td><td>Istio (Envoy sidecars), Linkerd</td></tr>
  </tbody>
</table>
<p>Put cross-cutting, per-client policy in the gateway. Keep business rules out, or the gateway turns into a distributed monolith that every team has to deploy through. The managed-gateway details (authorizers, throttling, payload limits) are in <a href="#/topic/cloud-api-gateway">AWS API Gateway</a>; architecture patterns like BFF are in <a href="#/topic/be-architecture">Architecture</a>; rate-limit algorithms are in <a href="#/topic/lld-rate-limiter">Rate Limiter (LLD)</a>.</p>

<h3>7. TLS termination</h3>
<table>
  <thead><tr><th>Where TLS ends</th><th>Gains</th><th>Costs</th></tr></thead>
  <tbody>
    <tr><td>At the CDN / edge</td><td>Handshake near the user (big latency win), WAF and caching can read requests, DDoS absorbed</td><td>The provider sees plaintext; you trust them with keys (or use options like keyless TLS)</td></tr>
    <tr><td>At the regional LB</td><td>One place for certificates; L7 routing; app servers are simpler</td><td>Plaintext inside the VPC unless you re-encrypt</td></tr>
    <tr><td>Re-encrypt to backends / mTLS mesh</td><td>Encryption in transit everywhere; service identity (zero trust)</td><td>A second handshake per backend connection (amortised by pooling); certificate rotation for every service</td></tr>
    <tr><td>Pass-through to the pod (L4)</td><td>End-to-end; the LB never holds keys</td><td>No L7 routing, no WAF, no per-request balancing at the LB</td></tr>
  </tbody>
</table>
<ul>
  <li><strong>Round trips:</strong> TCP needs 1 RTT; TLS 1.3 adds 1 (TLS 1.2 adds 2); then the request needs 1. Resumption cuts this, and TLS 1.3 0-RTT can send data in the first flight, but that early data can be <em>replayed</em>, so only allow it for idempotent requests. QUIC (HTTP/3) folds transport and TLS into 1 RTT.</li>
  <li><strong>CPU:</strong> the handshake's asymmetric crypto is the expensive part; bulk encryption is cheap with AES hardware support. ECDSA certificates are much cheaper for the server to sign with than RSA. Connection reuse and session resumption matter more than raw cipher speed.</li>
  <li><strong>SNI</strong> lets one IP serve many certificates. <strong>Certificate automation</strong> (ACME, Let's Encrypt, cert-manager, managed certs) is mandatory: under CA/Browser Forum ballot SC-081 the maximum public certificate lifetime has been 200 days since 15 March 2026, drops to 100 days in March 2027 and to 47 days in March 2029, and domain-validation reuse drops to 10 days. Manual renewal stops being viable.</li>
</ul>

<h3>8. Sticky sessions</h3>
<p><strong>Mechanisms:</strong> an LB-inserted cookie (ALB's <code>AWSALB</code>, HAProxy cookie insert), an application cookie the LB reads, source-IP hashing, or consistent hashing on a header such as a user id.</p>
<p><strong>Why to avoid them:</strong></p>
<ul>
  <li><strong>Uneven load:</strong> heavy users stay pinned, and scale-out only helps <em>new</em> sessions.</li>
  <li><strong>State loss:</strong> when the node dies, every session on it dies (lost cart, forced logout).</li>
  <li><strong>Deploys:</strong> draining a node means waiting for its sessions to end or breaking them.</li>
  <li><strong>IP-based affinity misfires:</strong> thousands of users behind one corporate NAT or a carrier-grade NAT land on one backend, and a phone that switches from Wi-Fi to 4G changes IP mid-session.</li>
</ul>
<p><strong>Instead:</strong> stateless app servers; session state in Redis or the database, or in a signed token (see <a href="#/topic/api-auth-rbac">Auth &amp; RBAC</a>); carts in the database.</p>
<p><strong>When affinity is fine:</strong> as a <em>soft performance hint</em> (consistent hashing so a user usually hits a warm local cache, and a miss is only slower); when the connection itself is the state (a live WebSocket is sticky by nature, but reconnects must work on any node, see <a href="#/topic/api-websockets">WebSockets</a>); when a protocol requires it (Socket.IO's HTTP long-polling fallback needs sticky routing across several requests); and for stateful game or media servers where the session really lives in one process.</p>

<h3>9. Connection limits</h3>
<ul>
  <li><strong>Ephemeral ports.</strong> A connection is identified by (src IP, src port, dst IP, dst port). Linux's default local port range gives ~28K ports, so one proxy IP can hold ~28K concurrent connections to one backend IP:port. Closed connections sit in TIME_WAIT for 60 s on Linux on whichever side closes first, so if the proxy closes first and connections are not reused, one proxy-to-backend pair sustains only about 28K / 60 ≈ 470 new connections per second. Fixes: keep-alive and pooling (the real fix), <code>net.ipv4.tcp_tw_reuse</code> for outgoing connections, more backend IP:ports, more source IPs on the proxy, a wider port range.</li>
  <li><strong>File descriptors and memory.</strong> Each socket is a descriptor (raise <code>ulimit -n</code>) plus kernel buffers and application state, from a few KB to tens of KB idle. A million idle WebSockets therefore needs on the order of tens of GB across the fleet, and tuned servers have held millions per box (WhatsApp's Erlang servers famously reported ~2M connections per server in 2012).</li>
  <li><strong>Proxy limits.</strong> Proxies cap concurrency per backend on purpose. Envoy's default per-cluster circuit-breaker limits are 1,024 connections, 1,024 pending requests and 1,024 active requests, a classic surprise when a service first gets real traffic (503s with an overflow flag).</li>
  <li><strong>Managed LBs scale by adding nodes,</strong> and an ALB's IPs change as it does, which is why you point DNS at its name (60 s TTL) and never pin IPs. Use NLB or Global Accelerator when a client needs static IPs. Very sudden step-changes in traffic can outrun a managed LB's scaling; providers offer pre-provisioning for planned events.</li>
</ul>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1: What a CDN buys on a dynamic API (RTT arithmetic)</h3>
<p>A user in Mumbai calls an API whose origin is in us-east-1, roughly 200 ms RTT away. The edge PoP is ~15 ms away. Count round trips for a <em>new</em> HTTPS connection with TLS 1.3 (TCP 1 + TLS 1 + request 1 = 3 RTTs).</p>
<div class="diagram"><pre>
 Direct to origin:       3 RTT × 200 ms                   ≈ 600 ms
 Via edge (cache MISS):  2 RTT × 15 ms (TCP+TLS at edge)  ≈  30 ms
                         + 1 RTT × 15 ms (request to edge) ≈  15 ms
                         + 1 RTT × 200 ms (warm conn to origin)
                                                           ≈ 200 ms
                         total                             ≈ 245 ms
 Via edge (cache HIT):   3 RTT × 15 ms                     ≈  45 ms
 (plus server time; TLS 1.2 adds one more RTT to each handshake)
</pre></div>
<p><strong>Decision:</strong> even uncacheable APIs go behind the edge for global users, because it saves two long round trips per new connection. Cacheable reads get the 45 ms path. If the 200 ms per request still breaks the p99 budget, that is the signal for a regional deployment with local data, not a better CDN.</p>

<h3>Example 2: Sizing the origin behind a CDN</h3>
<p>A media-heavy app serves 50K requests/s at peak, average 20 KB per response.</p>
<ul>
  <li>Total egress: 50K × 20 KB = 1 GB/s ≈ 8 Gbps. One 10 Gbps NIC (~1.25 GB/s line rate) would run at ~80% at peak. Too close.</li>
  <li>At a 95% hit ratio the origin sees 5% = 2.5K req/s and 50 MB/s. At 99%: 500 req/s and 10 MB/s.</li>
</ul>
<p><strong>Decision:</strong> the CDN is not optional, and the hit ratio is the number to watch: 95% → 99% is a 5× cut in origin load. Spend effort on the cache key (strip tracking params), long TTLs with versioned URLs, and an origin shield, before adding origin servers.</p>

<h3>Example 3: Small production app, done right (an app on one droplet)</h3>
<p>A real shape: a NestJS API and Postgres on one DigitalOcean droplet, media in object storage (R2) behind a CDN subdomain, a managed DNS zone with the proxy enabled.</p>
<div class="diagram"><pre>
 user ─► CDN/proxy edge (TLS, WAF, caching)
           ├── cdn.example.com ─► object storage (media, long TTL)
           └── api.example.com ─► droplet: Caddy (TLS via ACME)
                                     └─► NestJS ─► Postgres
</pre></div>
<ul>
  <li><strong>Edge:</strong> the proxy terminates TLS near users and absorbs junk. Media never touches the droplet.</li>
  <li><strong>Reverse proxy:</strong> Caddy gets and renews certificates automatically and forwards to the app. No separate LB at one instance.</li>
  <li><strong>Lock the origin:</strong> firewall the droplet so ports 80/443 only accept the proxy's IP ranges, otherwise anyone who finds the origin IP (old DNS records, certificate transparency logs, email headers) bypasses the WAF.</li>
  <li><strong>Next step when it grows:</strong> a managed LB and a second app instance, which forces the app to be stateless (no in-memory sessions or uploads on local disk). That is the real cost of the second box, not the LB itself.</li>
</ul>

<h3>Example 4: Active-active in two regions</h3>
<p>Requirement: survive a region loss with under a minute of user impact.</p>
<ul>
  <li><strong>DNS-only (latency routing + health checks, 60 s TTL):</strong> detection ~30–90 s, then up to a TTL, then the tail of clients that cached longer. Realistic: most users move within a few minutes. Fails the requirement.</li>
  <li><strong>Anycast front door</strong> (Global Accelerator, Google's global LB, a CDN with origin failover): users always hit the same IPs; the edge stops sending to the sick region's origin based on its own health checks within seconds. Meets the requirement for the edge path.</li>
  <li><strong>The hard part is not the edge:</strong> the surviving region must already have the data (replication lag, write ownership, see <a href="#/topic/bsd-bb-replication">Replication</a>) and the capacity (each region sized for the other's peak, or fast autoscaling plus load shedding).</li>
</ul>

<h3>Example 5: WebSocket fleet for meeting-room tablets</h3>
<p>Thousands of tablets keep a WebSocket open for live room status.</p>
<ul>
  <li><strong>Idle timeouts:</strong> ALB's default idle timeout is 60 s, so send an application ping every ~25–30 s or connections are silently cut.</li>
  <li><strong>Balancing:</strong> connections are long-lived, so a pod added during scale-out gets nothing until clients reconnect. Cap connection age (reconnect every N hours with jitter) so load spreads again.</li>
  <li><strong>Deploys:</strong> draining a pod disconnects its tablets at once; they must reconnect with jittered exponential backoff or the reconnect wave becomes a thundering herd (see <a href="#/topic/be-resilience">Resilience</a>).</li>
  <li><strong>No stickiness needed for correctness:</strong> a reconnect can land on any pod because subscriptions are re-established from the client and fan-out goes through pub/sub.</li>
</ul>

<h3>Example 6: The reverse-proxy config that encodes the lessons</h3>
<pre><code class="language-nginx">upstream api {
  random two least_conn;          # power of two choices
  server 10.0.1.10:3000 max_fails=3 fail_timeout=10s;
  server 10.0.1.11:3000 max_fails=3 fail_timeout=10s;
  keepalive 64;                   # reuse upstream connections
}
proxy_cache_path /var/cache/nginx keys_zone=edge:50m max_size=5g;
server {
  listen 443 ssl;
  http2 on;
  location /api/ {
    proxy_pass http://api;
    proxy_http_version 1.1;
    proxy_set_header Connection "";   # needed for upstream keepalive
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_cache edge;
    proxy_cache_key "$scheme$host$uri$arg_page";  # allow-listed param
    proxy_cache_lock on;              # collapse concurrent misses
    proxy_cache_use_stale error timeout updating;  # serve stale
    proxy_cache_background_update on; # refresh without blocking
    # nginx caches even with Authorization: skip it for authed calls
    proxy_no_cache $http_authorization;
    proxy_cache_bypass $http_authorization;
  }
}</code></pre>
<p>Note the cache key allow-lists one query parameter instead of using the full query string, and that the app behind this must not set cookies on cacheable responses. (<code>http2 on;</code> needs nginx 1.25.1+.)</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>Failover that DNS cannot deliver</h3>
<p>Connection pools, mobile apps that resolve once at start-up, and JVMs with long DNS caches keep talking to the old IP long after the record changed. Keep the old target alive and forwarding (or failing fast with a clear error) for at least hours after a migration.</p>

<h3>GeoDNS sends users to the wrong continent</h3>
<p>The user's resolver is far away (corporate VPN, a public resolver without ECS). Symptom: one customer's users are slow, others are fine. Check which resolver and which answer they actually get before tuning servers.</p>

<h3>Purge stampede</h3>
<p>A full-site purge turns every edge's next request into an origin request at once. Without an origin shield and request collapsing, the origin falls over just after the deploy that triggered the purge. Purge by tag, not "everything", and keep <code>stale-while-revalidate</code> on.</p>

<h3>Long-lived connections never rebalance</h3>
<p>HTTP/2, gRPC and WebSockets behind an L4 LB: new pods get no traffic after scale-out, old pods stay hot. Set a maximum connection age (gRPC servers support <code>MAX_CONNECTION_AGE</code>), use L7 or client-side balancing.</p>

<h3>The health check that takes the fleet down</h3>
<p>A health endpoint that checks the database marks every instance unhealthy during a short DB blip, and the LB removes all of them. Health checks should test the instance (liveness, readiness), not shared dependencies (see <a href="#/topic/be-resilience">Resilience</a>). Fail-open behaviour (ELB, Envoy's panic threshold) exists because of this mistake.</p>

<h3>Origin IP leak</h3>
<p>A WAF and DDoS protection in front are useless if the origin answers anyone who finds its IP. Firewall the origin to the CDN's ranges or use authenticated origin pulls.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Caching personalised responses</h3>
<p>A page varies by session cookie, but the CDN key does not include it, so one user's account page is served to others. In December 2015 a CDN caching rule deployed during a DDoS at Steam served users other people's account pages. Fix: <code>Cache-Control: private</code> or <code>no-store</code> on personalised responses by default; cache only what you explicitly mark public. Related: <em>web cache poisoning</em> (an unkeyed header like <code>X-Forwarded-Host</code> changes the response, and the poisoned copy is cached for everyone) and <em>cache deception</em> (<code>/account/settings.css</code> tricks a path-based rule into caching a private page).</p>

<h3>Mismatched idle timeouts</h3>
<p>The app server closes idle keep-alive connections sooner than the LB does, so the LB occasionally sends a request on a socket the app just closed: sporadic 502s. Rule: each hop's idle timeout should be <em>longer</em> than the hop in front of it (full walkthrough in Q13).</p>

<h3>Retries at every layer</h3>
<p>Client retries 3×, gateway 3×, mesh 3×: one failing call becomes 27 backend attempts during exactly the moment the backend is struggling. Retry at one layer, with budgets and jitter.</p>

<h3>Least-connections into a black hole</h3>
<p>A broken instance returns 500s in 1 ms, so it always has the fewest requests in flight, and least-connections sends it <em>more</em> traffic. Outlier detection (eject on consecutive 5xx) is the fix.</p>

<h3>The edge as a global single point of failure</h3>
<p>Edge config is pushed everywhere quickly, so a bad rule is a global outage: Cloudflare's July 2019 WAF regex (catastrophic backtracking pegged CPUs worldwide for about half an hour), Fastly's June 2021 outage (one customer's valid config change triggered a latent bug), and Meta's October 2021 outage (a backbone change caused its DNS servers to withdraw their BGP routes, so its domains stopped resolving). In October 2025, a long us-east-1 outage began with automation that left the DynamoDB regional endpoint's DNS record empty. Lessons: stage edge changes like code (canary PoPs first), keep out-of-band access, and consider a secondary DNS provider (the 2016 Mirai DDoS on Dyn took many large sites offline).</p>

<h3>Sticky sessions as a substitute for shared state</h3>
<p>"We'll enable stickiness so the in-memory session works" works until the first node failure or deploy. Move the state out.</p>

<h3>Trusting X-Forwarded-For blindly</h3>
<p>Rate limiting or geo-blocking on the leftmost XFF value lets any client spoof its IP. Take the address added by your own outermost trusted proxy.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block"><div class="qa-question">1. Walk me through everything between a user typing api.example.com and your code running. Where can each hop fail?</div><div class="qa-answer">
<p>"DNS first: browser, OS and the recursive resolver may have it cached; otherwise the resolver walks root → TLD → our authoritative servers, and gets an answer with a TTL. That can fail if our DNS provider is down or the record is wrong, and a wrong record is cached for the TTL. Then TCP and TLS to that IP. With an anycast edge, that is a PoP near the user, which can run WAF rules and answer from cache. On a miss it forwards over a warm connection to our region, where an L4 balancer spreads connections across L7 proxies, which route by host and path and pick a pod per request. Failure points: the PoP (BGP withdrawal), the origin path (edge health checks, origin failover), the L7 fleet (scaled behind L4), the pod (health checks, outlier ejection, retries), and disagreeing timeouts between hops."</p>
</div></div>

<div class="qa-block"><div class="qa-question">2. You fail over a dead region by changing DNS, with a 60 s TTL. Twenty minutes later some traffic still hits the dead region. Why?</div><div class="qa-answer">
<p>"The TTL only bounds well-behaved caches. Some resolvers stretch or floor TTLs; apps cache resolved IPs in connection pools and keep using open sockets indefinitely; mobile apps may resolve once per launch; some runtimes cache lookups longer than the TTL. Long-lived connections never re-resolve until they reconnect. Plus detection took its own 30–90 s before the record changed. So DNS failover moves the bulk in minutes and leaves a tail. I'd make the dead region's front door fail fast or forward to the healthy region, and for fast failover I'd put an anycast or global LB in front so the client's IP never changes."</p>
</div></div>

<div class="qa-block"><div class="qa-question">3. Then why not use anycast for everything? What is the catch, especially with TCP?</div><div class="qa-answer">
<p>"Cost and control. You need your own address space and BGP at every site, or a provider that sells it. 'Nearest' is by BGP policy, not distance, so some users land on a far PoP and you can't steer them as precisely as with DNS. And a TCP connection only works while its packets keep reaching the same site: if routes change mid-connection, packets go to a site with no state and the connection resets. In practice routes are stable enough that CDNs run TCP and QUIC over anycast, and long-lived clients just need to reconnect cleanly. Inside a site the L4 tier then uses consistent hashing plus connection tracking so any L4 machine forwards a flow to the same backend."</p>
</div></div>

<div class="qa-block"><div class="qa-question">4. L4 or L7 load balancer for a gRPC service? Why would an L4 balancer leave one pod at 90% CPU and others idle?</div><div class="qa-answer">
<p>"L7, or client-side balancing. gRPC runs over HTTP/2, which multiplexes all of a client's calls over one long-lived connection. An L4 balancer picks a backend once per connection, so each client's entire traffic is pinned to one pod. A few heavy clients means a few hot pods, and pods added later receive nothing until clients reconnect. An L7 proxy like Envoy terminates the HTTP/2 connection and balances each request across its own pool. Without a proxy, gRPC's client-side round robin with a DNS or xDS endpoint list does the same. A cheap mitigation on L4 is a maximum connection age so clients reconnect and redistribute."</p>
</div></div>

<div class="qa-block"><div class="qa-question">5. You use least-connections. After a scale-out, the new pod gets crushed and starts timing out. Why, and what is the fix?</div><div class="qa-answer">
<p>"Least-connections sees the new pod at zero in-flight requests, so every balancer sends it new work at once, while its caches, JIT and connection pools are cold. With many independent balancers each acting on its own view, they all pile on together. Fixes: slow start, which ramps the new pod's weight over tens of seconds; power of two choices instead of a global minimum, which limits herding; and readiness that only passes after warm-up. The same algorithm has a mirror-image bug: a pod that fails fast has the fewest requests in flight and attracts more traffic, so pair it with outlier detection that ejects on consecutive 5xx."</p>
</div></div>

<div class="qa-block"><div class="qa-question">6. Why does power of two choices work so well, when a global least-loaded pick seems strictly better?</div><div class="qa-answer">
<p>"Because the 'global' view is stale and shared. If 100 proxies all see the same least-loaded backend, they all send to it in the same instant, and it overshoots. Picking two at random means different proxies pick different pairs, so their choices spread, and taking the less loaded of the two still avoids the bad backends. The theory: with one random choice the worst backend's load grows like log n / log log n; with two it grows like log log n, an exponential improvement from one extra sample. It needs no coordination, only a local in-flight count or latency estimate, which is why Envoy's least-request uses it by default."</p>
</div></div>

<div class="qa-block"><div class="qa-question">7. The load balancer is now a single point of failure. How do you make the balancing tier itself highly available?</div><div class="qa-answer">
<p>"Never one box. Small setups run two proxies sharing a floating IP (VRRP with keepalived): the standby takes the IP on failure, in seconds, and open connections drop unless connection state is synced (conntrackd). Large setups make the L4 tier a horizontally scaled set behind ECMP: the router hashes flows across N identical L4 machines. Each one uses the same consistent hash (Maglev hashing, for example) plus a local connection table, so if one dies, the router rehashes its flows to the others, and they mostly pick the same backend, so most connections survive. Above that, multiple sites behind anycast, and multiple regions. Managed LBs are already multi-node and multi-AZ; my job is to enable cross-zone balancing, use their DNS name rather than IPs, and not rely on a single AZ."</p>
</div></div>

<div class="qa-block"><div class="qa-question">8. Do we need an API gateway, or is a reverse proxy enough? What belongs in the gateway?</div><div class="qa-answer">
<p>"A reverse proxy is enough when clients are our own apps and auth lives in the services: it terminates TLS, routes and balances. A gateway earns its place when we expose APIs to third parties or many clients: API keys or JWT validation at the door, per-client quotas and rate limits, usage plans, request validation, versioned routing, a developer portal. What does not belong: business logic, orchestration across services, or data transformations specific to one feature. Those turn the gateway into a shared deploy bottleneck owned by no one. Cost: an extra hop of a few ms and one more critical tier, so it needs the same HA and canary discipline as the services. In AWS terms, that's API Gateway vs an ALB in front of the services."</p>
</div></div>

<div class="qa-block"><div class="qa-question">9. Where do you terminate TLS? Doesn't terminating at the load balancer break 'encryption in transit'?</div><div class="qa-answer">
<p>"I terminate at the edge for latency, since the handshake round trips happen near the user, and because the WAF, cache and L7 routing need plaintext. Then I re-encrypt to the region and, if the internal network is not trusted or compliance requires it, use TLS or mTLS from the LB to the pods, usually via a mesh so services get identities and rotation is automated. The extra handshake is amortised because proxy-to-pod connections are pooled. If even the LB must not see plaintext, for example a regulated payload or a customer bringing their own keys, I'd use L4 pass-through and give up L7 features for that path. TLS 1.3 everywhere; 0-RTT early data only for idempotent requests, because it can be replayed."</p>
</div></div>

<div class="qa-block"><div class="qa-question">10. A team wants sticky sessions so their in-memory cart works. Push back, or allow it?</div><div class="qa-answer">
<p>"Push back for correctness, allow it for performance. If the cart only exists in one process, a deploy, a crash or a scale-in loses carts, and load stays uneven because sessions can't move. IP-based stickiness is worse: everyone behind a corporate NAT lands on one node, and phones change IP. Move the cart to the database or Redis and the servers become interchangeable. Affinity is fine as a soft hint, such as consistent hashing on user id so a local cache stays warm, where losing affinity only costs a cache miss. And it's inherent for a live WebSocket, as long as a reconnect can land anywhere."</p>
</div></div>

<div class="qa-block"><div class="qa-question">11. You want to cache an API response at the CDN. How do you pick the cache key, and how do you make sure user A never sees user B's data?</div><div class="qa-answer">
<p>"Default to not caching: personalised responses are <code>private</code> or <code>no-store</code>, and only responses that are the same for everyone with the same URL are marked public with <code>s-maxage</code>. For those, the key is host + path + an allow-list of the query params that change the result; tracking params are stripped, cookies are excluded, and the origin must not set cookies on them. If a response varies by something like language or device class, I put that in the key explicitly as a small set of values rather than relying on Vary with a raw header. For semi-personal data, such as 'prices for region X', the region becomes a key component. And I test it: two different users, same URL, compare responses and cache-status headers. Unkeyed inputs are also how cache-poisoning attacks work, so the origin should ignore headers that aren't in the key."</p>
</div></div>

<div class="qa-block"><div class="qa-question">12. You deploy a JS fix but users still get the old bundle for hours. Then after a full purge, the origin falls over. Design the invalidation strategy.</div><div class="qa-answer">
<p>"Two different mistakes. Build assets should never need purging: content-hashed filenames with a one-year immutable TTL, and only the small HTML or manifest that references them gets a short TTL or revalidation. A deploy then switches to new names atomically, and old tabs keep loading the old files that still exist. For data-driven responses I tag each response with the entities it contains and purge by tag on change, so a product edit purges a handful of objects, not the site. The origin fell over because a full purge made every PoP miss at once. An origin shield turns hundreds of PoP misses into a few, request collapsing turns concurrent misses into one fetch, and <code>stale-while-revalidate</code> keeps serving while refreshing. The full purge stays as a break-glass tool."</p>
</div></div>

<div class="qa-block"><div class="qa-question">13. (FDE) A customer reports intermittent 502s behind an AWS ALB. They're rare, happen more after quiet periods, and nothing shows in the app logs. Walk me through it.</div><div class="qa-answer">
<p>"Rare 502s with nothing in the app logs, worse after idle, points to a keep-alive race between the ALB and the app. First I'd confirm with the ALB access logs: the 502s should have a target status of '-' or a connection error, meaning the target closed the connection rather than returning 502 itself. The usual cause: the ALB keeps idle connections to targets for its idle timeout, 60 s by default, but the app closes idle keep-alive sockets sooner. Node's HTTP server, for example, defaults to a 5 s keepAliveTimeout. The ALB picks a socket the app is closing at that instant, sends the request, gets a reset, and returns 502. The fix is to make the app's keep-alive timeout longer than the LB's:</p>
<pre><code class="language-js">const server = app.listen(3000);
server.keepAliveTimeout = 65000; // &gt; ALB idle timeout (60 s)
server.headersTimeout = 66000;   // keep it above keepAliveTimeout</code></pre>
<p>The same applies to nginx or gunicorn behind any LB. I'd also check the other usual suspects: 502s during deploys (targets killed before deregistration finished, so add a graceful shutdown that outlasts the deregistration delay, 300 s by default), and 504s, which are a different problem: the target did not answer within the idle timeout. Verification for the customer: the ALB 502 metric drops to zero."</p>
</div></div>

<div class="qa-block"><div class="qa-question">14. You need to hold 1M concurrent WebSocket connections. What limits do you hit at the edge and the LB, and how do you design around them?</div><div class="qa-answer">
<p>"Memory and descriptors first: a million sockets at a few KB to tens of KB each is on the order of tens of GB, so I spread across many nodes, maybe 10–20 nodes at 50–100K connections each to keep a node failure survivable, and raise fd limits. Ports next: if a proxy fronts the pods, each proxy IP to pod IP:port pair caps at ~28K concurrent connections with Linux's default port range, so I need several pods per proxy or more source IPs. Proxy circuit breakers like Envoy's 1,024 defaults must be raised. Then idle timeouts: app pings below every hop's idle timeout, 60 s on an ALB by default. Then churn: a deploy or LB failure disconnects tens of thousands at once, so clients reconnect with jittered backoff and the connect path, especially auth, must handle a reconnect storm. Last, balancing: connections don't rebalance, so cap connection age with jitter. State lives in pub/sub, not in the connection, so any pod can take any client (detail in <a href="#/topic/api-websockets">WebSockets</a>)."</p>
</div></div>
` }

  ]
});
