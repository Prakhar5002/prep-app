window.PREP_SITE.registerTopic({
  id: 'eh-scanning',
  module: 'eh',
  title: 'Scanning & Enumeration',
  estimatedReadTime: '30 min',
  tags: ['ethical-hacking', 'security', 'pentest', 'scanning', 'enumeration', 'nmap', 'nse', 'smb', 'snmp'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<div class="callout danger">
  <div class="callout-title">⚠️ This topic assumes eh-foundations: lab/authorization first</div>
  <p>Everything below is <strong>active</strong> reconnaissance — unlike the passive OSINT covered in the previous Reconnaissance topic, every technique here sends packets directly at the target: ARP requests, TCP/UDP probes, authentication attempts against SMB/SNMP/LDAP/SMTP services. That traffic lands in firewall logs, IDS/IPS alerts, and target-side connection logs the moment you run it. Only ever point these tools at your own lab VMs (Metasploitable, DVWA, etc. — see eh-foundations) or a system you have explicit, written, in-scope authorization to test. Running an nmap SYN scan against a system you don't own or aren't authorized to test is itself an unauthorized-access act in most jurisdictions, independent of anything you do afterward.</p>
</div>
<p><strong>Scanning &amp; enumeration</strong> is the phase where reconnaissance's "who and what is out there" turns into a concrete technical map: which hosts on a network are alive, which ports are open on them, which services and versions are running behind those ports, which OS the host is likely running, and — critically — what those services will hand over if you simply ask nicely (a null SMB session, a public SNMP community string, an anonymous NFS export, an LDAP anonymous bind). Everything in later exploitation-focused topics starts from the map this phase produces.</p>
<ul>
  <li><strong>Scanning</strong> answers "what's there?" — live hosts, open ports, running services/versions, and (best-effort) the OS. The core tools are <strong>nmap</strong> (the deep, flexible standard), plus fast large-range scanners <strong>masscan</strong> and <strong>rustscan</strong>.</li>
  <li><strong>Enumeration</strong> goes one level deeper per-service: once you know port 445 is open, <em>what</em> does SMB actually expose — shares, users, OS build? Once 161/UDP answers, what does SNMP's community string unlock? This topic covers the standard tool for each of the classic enumerable services: SMB, SNMP, LDAP, NFS, and SMTP.</li>
  <li><strong>MITRE ATT&amp;CK nuance worth remembering for interviews:</strong> scanning an <em>external</em> target you don't yet have a foothold in maps to the <strong>Reconnaissance</strong> tactic's <strong>Active Scanning (T1595)</strong> technique. It's easy to mislabel this as "Discovery" — but ATT&amp;CK's <strong>Discovery</strong> tactic (e.g. T1046 Network Service Discovery) specifically describes an attacker who <em>already has a foothold</em> mapping the internal environment from the inside. Same activity, different tactic, depending entirely on whether you're already on the network.</li>
  <li><strong>The core trade-off running through every tool here is stealth vs. speed vs. accuracy</strong> — a full <code>-p-</code> SYN scan with default timing is thorough but loud and slow; <code>masscan</code> at a high <code>--rate</code> is blisteringly fast but easy for an IDS to fingerprint and easy to overwhelm a target/network with; a <code>-T0</code> paranoid nmap scan is quiet but can take hours. Every real engagement picks a point on that spectrum deliberately, based on the Rules of Engagement agreed in eh-foundations.</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Why this phase exists: you can't attack what you can't see</h3>
<p>Reconnaissance (the previous topic) is largely passive — OSINT, WHOIS, DNS, search engines, social media, never a packet touching the target directly. Scanning &amp; enumeration is where testing turns active: you send traffic straight at the target's infrastructure and read back what it tells you. The output is a concrete attack surface: a list of live hosts, each with a list of open ports, each port tagged with a service and (ideally) a version number, and for the handful of services that are historically chatty by design (SMB, SNMP, LDAP, NFS, SMTP), a much deeper dump of what they'll disclose to an unauthenticated or lightly-authenticated caller. Every later exploitation topic in this module — web, network, Active Directory, passwords — starts by picking a target off this map.</p>

<h3>Scanning vs. enumeration: two related but distinct jobs</h3>
<ul>
  <li><strong>Host discovery</strong> — is anything even alive at this address? (ARP on a local segment, ICMP/TCP/UDP probes across a routed network.)</li>
  <li><strong>Port scanning</strong> — for each live host, which of the 65,535 TCP and UDP ports are open, closed, or filtered?</li>
  <li><strong>Service/version detection</strong> — for each open port, exactly which software and version is listening (not just "something is on 445" but "Samba 4.6.2 on Ubuntu")? Version numbers are what later map directly onto known CVEs.</li>
  <li><strong>OS fingerprinting</strong> — best-effort identification of the underlying operating system, from subtle differences in how each OS's TCP/IP stack responds to unusual packets.</li>
  <li><strong>Enumeration</strong> — the deepest layer, service by service: SMB shares and usernames, SNMP-exposed system data, LDAP directory trees, NFS exports, SMTP-valid mailboxes. This is where a scan result ("port 445 open") turns into a finding ("anonymous SMB session lists 14 shares including an unauthenticated \\\\BACKUPS share").</li>
</ul>

<h3>TCP vs. UDP: why scan types behave so differently</h3>
<p>Most scanning technique differences trace back to one fact: TCP is connection-oriented with an explicit handshake (SYN → SYN/ACK → ACK), so a scanner can send a SYN and read the response to know instantly whether a port is open, closed, or filtered — without ever completing a real connection. UDP has no handshake at all: sending a UDP probe to an open port often gets <em>no response whatsoever</em> (many UDP services only reply to a correctly-formatted request for their specific protocol), while a closed UDP port typically replies with an ICMP "port unreachable." That asymmetry is exactly why UDP scanning (<code>-sU</code>, covered in Mechanics) is dramatically slower and less reliable than TCP scanning, and why it's so often skipped or under-scanned in practice despite UDP services (SNMP, DNS, NFS, TFTP) being common footholds.</p>

<h3>Why version detection and OS fingerprinting matter beyond curiosity</h3>
<p>"Port 445 is open" tells you almost nothing actionable. "Port 445 is open running Samba 3.0.20, Debian" tells you the exact service and version to cross-reference against known vulnerabilities (this specific example famously maps to the "username map script" backdoor, CVE-2007-2447) — turning a scan line into an exploitation lead. OS fingerprinting similarly narrows which exploit families, default credentials, and privilege-escalation techniques are even plausible before you spend time trying them.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The scanning pipeline: each stage narrows the next</h3>
<pre><code class="language-text">Host Discovery  →  Port Scanning  →  Service/Version  →  OS Fingerprint  →  Deep Enumeration
 (who's alive?)     (which ports        Detection            (-O)          (SMB/SNMP/LDAP/
                     are open?)         (-sV)                                NFS/SMTP)
 arp-scan,           nmap -sS/-sT/       nmap -sV,                          enum4linux-ng,
 netdiscover,        -sU, masscan,       --script                          smbmap, snmpwalk,
 ping sweep          rustscan                                              ldapsearch, showmount,
                                                                            smtp-user-enum
</code></pre>
<p>Each stage exists to cut down the work of the next: discovery narrows "the whole subnet" down to "these 12 live hosts"; port scanning narrows that to "host .15 has 445, 161, 389 open"; version detection and enumeration then go deep on exactly those three services instead of blindly probing all of them everywhere.</p>

<h3>Scan type trade-offs: stealth, privilege, and reliability</h3>
<table>
  <thead><tr><th>Scan type</th><th>How it works</th><th>Needs root/raw sockets?</th><th>Stealth</th><th>Reliability</th></tr></thead>
  <tbody>
    <tr><td><strong>TCP Connect (<code>-sT</code>)</strong></td><td>Completes the full 3-way handshake via the OS socket API (SYN → SYN/ACK → ACK → RST)</td><td>No</td><td>Low — a full connection is logged by the target application, not just the OS</td><td>High — most reliable, works over any OS/permission level</td></tr>
    <tr><td><strong>TCP SYN ("half-open", <code>-sS</code>)</strong></td><td>Sends SYN, reads SYN/ACK (open) or RST (closed), then sends RST instead of completing the handshake</td><td>Yes (raw sockets)</td><td>Higher — never completes a connection, so many application-level logs never see it (though OS-level firewalls/IDS still can)</td><td>High, and nmap's default scan type when privileged</td></tr>
    <tr><td><strong>UDP (<code>-sU</code>)</strong></td><td>Sends a UDP packet; open|filtered if no reply, closed if ICMP port-unreachable comes back</td><td>Yes</td><td>Moderate</td><td>Low/slow — no reply is ambiguous (open vs. filtered), and ICMP rate-limiting on the target slows large scans dramatically</td></tr>
  </tbody>
</table>

<h3>Timing templates: the stealth/speed dial</h3>
<table>
  <thead><tr><th>Template</th><th>Name</th><th>Behavior</th></tr></thead>
  <tbody>
    <tr><td><code>-T0</code></td><td>Paranoid</td><td>One probe every 5 minutes — built for IDS evasion, can take days on a large scope</td></tr>
    <tr><td><code>-T1</code></td><td>Sneaky</td><td>One probe every ~15 seconds — still IDS-evasion-oriented</td></tr>
    <tr><td><code>-T2</code></td><td>Polite</td><td>Slows down to use less bandwidth/target resources; noticeably slower than default</td></tr>
    <tr><td><code>-T3</code></td><td>Normal</td><td>Default — no explicit throttling beyond nmap's adaptive timing</td></tr>
    <tr><td><code>-T4</code></td><td>Aggressive</td><td>Assumes a fast, reliable network; the common choice on lab/CTF targets and internal engagements where speed matters more than stealth</td></tr>
    <tr><td><code>-T5</code></td><td>Insane</td><td>Fastest, sacrifices accuracy — packets can be dropped/missed on anything but a very fast, low-latency network</td></tr>
  </tbody>
</table>

<h3>MITRE ATT&amp;CK placement: Reconnaissance, not Discovery</h3>
<div class="callout insight">
  <div class="callout-title">💡 The mapping interviewers actually check</div>
  <p>ATT&amp;CK has two tactics that both sound like "figuring out what's on the network," and the difference between them is entirely about <strong>whether you already have a foothold</strong>:</p>
  <ul>
    <li><strong>Reconnaissance → Active Scanning (T1595)</strong> — an outsider, with no access yet, probing a target's external attack surface (exactly what this topic covers: nmap/masscan/rustscan against an external or not-yet-compromised target).</li>
    <li><strong>Discovery → e.g. Network Service Discovery (T1046), System Network Connections Discovery, Account Discovery</strong> — an attacker who has <em>already compromised a host</em> and is now enumerating the internal environment from the inside to plan lateral movement.</li>
  </ul>
  <p>Same nmap command, run from two different starting points, maps to two different ATT&amp;CK tactics. On an external pentest engagement, the scanning phase in this topic is Reconnaissance; the same techniques run again later, from inside a compromised host during Post-Exploitation, become Discovery.</p>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Tools & Techniques', html: `
<h3>1. Host discovery — find what's alive before you scan ports</h3>
<p>On a local (same-broadcast-domain) network, ARP is faster and more reliable than ICMP, since it can't be firewalled off the way ping often is:</p>
<pre><code class="language-bash"># arp-scan: sweep the local subnet via ARP (needs root for raw sockets)
sudo arp-scan --interface=&lt;interface&gt; --localnet
sudo arp-scan -I &lt;interface&gt; 192.168.1.0/24   # explicit target range instead of --localnet

# netdiscover: active/passive ARP reconnaissance, live-updating display
sudo netdiscover -i &lt;interface&gt; -r 192.168.1.0/24
sudo netdiscover -i &lt;interface&gt; -p             # passive mode: just listen, send nothing

# nmap ping sweep: routed/remote-network-friendly host discovery, no port scan (-sn)
nmap -sn 192.168.1.0/24
nmap -sn -PR 192.168.1.0/24    # force ARP ping even if nmap would default to something else on-LAN

# Plain ICMP sweep with the shell, when nmap/arp-scan aren't available
for ip in 192.168.1.{1..254}; do ping -c1 -W1 "$ip" &gt;/dev/null && echo "$ip is up"; done</code></pre>

<h3>2. nmap — the deep dive</h3>
<p><strong>Scan types</strong> (pick the underlying TCP/UDP behavior):</p>
<pre><code class="language-bash">sudo nmap -sS &lt;target&gt;      # SYN ("half-open") scan — nmap's default when run as root; fast, less logged
nmap    -sT &lt;target&gt;        # TCP connect scan — full handshake; the fallback when you don't have raw-socket privileges
sudo nmap -sU &lt;target&gt;      # UDP scan — slow, but necessary for SNMP/DNS/NFS/TFTP-type targets</code></pre>
<p><strong>Version, OS, and full port-range coverage:</strong></p>
<pre><code class="language-bash">nmap -sV &lt;target&gt;                 # service/version detection (banner + probe fingerprinting)
sudo nmap -O &lt;target&gt;             # OS fingerprinting (needs at least one open and one closed TCP port to be reliable)
nmap -p- &lt;target&gt;                 # scan all 65535 TCP ports (default nmap scans only the top 1000)
nmap -p 22,80,443,445 &lt;target&gt;    # scan a specific port list instead
nmap -sS -sV -O -p- &lt;target&gt;      # a common "give me everything" combination</code></pre>
<p><strong>Timing (stealth vs. speed):</strong></p>
<pre><code class="language-bash">nmap -T4 -sV &lt;target&gt;      # aggressive — common default choice on labs/CTFs and fast internal networks
nmap -T1 -sS &lt;target&gt;      # sneaky — used when the RoE calls for evading IDS/IPS thresholds</code></pre>
<p><strong>NSE — the Nmap Scripting Engine.</strong> <code>--script</code> runs Lua scripts from nmap's built-in library against matched services — everything from banner grabs to vulnerability checks to brute-forcers:</p>
<pre><code class="language-bash">nmap --script=default -sV &lt;target&gt;         # the "safe" default script category
nmap --script=vuln &lt;target&gt;                # check for known vulnerabilities against detected services
nmap --script=smb-enum-shares,smb-enum-users -p445 &lt;target&gt;   # targeted NSE scripts by name
nmap --script-updatedb                     # refresh nmap's local NSE script database</code></pre>
<p><strong>Output formats</strong> — always save scans; you'll reference them again in reporting and later phases:</p>
<pre><code class="language-bash">nmap -sV -oN scan.txt &lt;target&gt;     # -oN: normal, human-readable text
nmap -sV -oX scan.xml &lt;target&gt;     # -oX: XML — machine-parseable, feeds tools like Metasploit's db_import
nmap -sV -oG scan.gnmap &lt;target&gt;   # -oG: grepable — one line per host, easy to pipe through grep/awk
nmap -sV -oA scan_baseline &lt;target&gt; # -oA: write all three formats at once (scan_baseline.nmap/.xml/.gnmap)</code></pre>

<h3>3. Fast large-range scanners: masscan and rustscan</h3>
<pre><code class="language-bash"># masscan: an internet-scale, asynchronous scanner — built to sweep huge ranges for open ports
# fast, but --rate needs to be set deliberately: too high can flood your own uplink or the target/network
sudo masscan 10.0.0.0/8 -p80,443 --rate=1000 -e &lt;interface&gt; -oX masscan-results.xml

# rustscan: scans ports extremely fast, then hands the discovered open ports to nmap for the deep work
# "--" marks the end of rustscan's own flags; anything after it is passed straight through to nmap
rustscan -a &lt;target&gt; --ulimit 5000 -- -sV -sC -oN rustscan-nmap.txt</code></pre>
<p>The usual division of labor: masscan/rustscan answer "which ports are open, across a huge range, fast" — then nmap runs its slower, deeper <code>-sV</code>/<code>-O</code>/NSE analysis only against the narrow port list they found, instead of against every port on every host.</p>

<h3>4. Service enumeration — SMB (ports 139/445)</h3>
<pre><code class="language-bash"># enum4linux / enum4linux-ng: the classic all-in-one SMB/Samba enumerator
# (wraps nmblookup, net, rpcclient, smbclient under the hood)
enum4linux -a &lt;target&gt;                 # -a: do all simple enumeration
enum4linux-ng -A &lt;target&gt;               # -ng rewrite: -A = all simple enumeration incl. nmblookup; supports -oY/-oJ for YAML/JSON export

# smbclient: interactively browse shares, or just list them non-interactively
smbclient -L //&lt;target&gt;/ -N            # -L: list shares, -N: no password (null session)
smbclient //&lt;target&gt;/&lt;share&gt; -N        # connect to a specific share

# smbmap: enumerate share names AND permissions in one pass (read/write/no-access per share)
smbmap -H &lt;target&gt; -u '' -p ''         # null session
smbmap -H &lt;target&gt; -u &lt;user&gt; -p &lt;password&gt; -r   # -r: recursive directory listing on accessible shares

# nmblookup: NetBIOS name resolution / name-table queries
nmblookup -A &lt;target&gt;                  # -A: query the NetBIOS name table by IP address</code></pre>

<h3>5. Service enumeration — SNMP (port 161/UDP)</h3>
<pre><code class="language-bash"># snmpwalk: walk an OID tree once you know (or guess) the community string
snmpwalk -c public -v1 &lt;target&gt;         # -c: community string, -v1: SNMP version 1
snmpwalk -c public -v2c &lt;target&gt; 1.3.6.1.2.1.1   # walk a specific OID subtree (system group)

# onesixtyone: fast brute-force of community strings across one or many hosts
onesixtyone -c communities.txt &lt;target&gt;          # -c: wordlist of community strings to try
onesixtyone -c communities.txt -i hosts.txt       # -i: file of target hosts, for scanning many at once</code></pre>

<h3>6. Service enumeration — LDAP (port 389/636)</h3>
<pre><code class="language-bash">ldapsearch -x -H ldap://&lt;target&gt; -s base -b "" "(objectClass=*)" "*" +   # -x: simple auth, unauthenticated/anonymous bind
ldapsearch -x -H ldap://&lt;target&gt; -b "dc=example,dc=com"                 # -b: search base — walk the directory tree
ldapsearch -x -H ldap://&lt;target&gt; -D "&lt;bind-dn&gt;" -w &lt;password&gt; -b "dc=example,dc=com"   # authenticated bind</code></pre>

<h3>7. Service enumeration — NFS (port 2049)</h3>
<pre><code class="language-bash">showmount -e &lt;target&gt;      # -e: list the target's exported NFS shares
showmount -a &lt;target&gt;      # -a: list all client:directory mounts currently active
# Mounting a misconfigured (no_root_squash / world-readable) export:
mkdir /tmp/nfs-mount &amp;&amp; sudo mount -t nfs &lt;target&gt;:/&lt;export-path&gt; /tmp/nfs-mount</code></pre>

<h3>8. Service enumeration — SMTP (port 25)</h3>
<pre><code class="language-bash"># smtp-user-enum: enumerate valid mailboxes via VRFY, EXPN, or RCPT TO
smtp-user-enum -M VRFY -U users.txt -t &lt;target&gt;    # -M: method (VRFY default, EXPN, or RCPT)
smtp-user-enum -M EXPN -u admin -t &lt;target&gt;         # -u: check a single username instead of a wordlist
smtp-user-enum -M RCPT -U users.txt -T targets.txt  # -T: file of multiple target hosts</code></pre>

<h3>9. Manual banner grabbing with nc</h3>
<pre><code class="language-bash"># Netcat as a lightweight manual service-fingerprinting tool — connect and read the banner
nc -nv &lt;target&gt; 22        # SSH banner: e.g. "SSH-2.0-OpenSSH_9.6p1 Ubuntu-3ubuntu13"
nc -nv &lt;target&gt; 25        # SMTP banner
nc -nv &lt;target&gt; 21        # FTP banner
# For HTTP, send a request manually since the server won't speak first:
printf 'HEAD / HTTP/1.0\\r\\n\\r\\n' | nc -nv &lt;target&gt; 80</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Worked Examples', html: `
<h3>Example 1 — From "unknown subnet" to a prioritized nmap target list</h3>
<p>Walking a lab subnet (e.g. the host-only network from eh-foundations, with a Metasploitable2 VM on it) from nothing to a saved, deep scan result:</p>
<pre><code class="language-bash"># 1. Discover what's alive on the isolated lab subnet (ARP is fastest/most reliable on-LAN)
sudo arp-scan --interface=eth1 --localnet
# → 192.168.56.102  08:00:27:xx:xx:xx  PCS Systemtechnik GmbH   (the Metasploitable2 VM)

# 2. Confirm with an nmap ping sweep (also works across routed networks, not just local ARP)
nmap -sn 192.168.56.0/24

# 3. Fast first pass: which ports are even open, across the full range, before investing time?
sudo masscan 192.168.56.102 -p1-65535 --rate=2000 -e eth1

# 4. Deep pass on exactly the ports masscan found — version, OS, default NSE scripts, all saved
sudo nmap -sS -sV -O --script=default -p22,25,80,111,139,445,3306,5432 \\
  -oA metasploitable2_scan 192.168.56.102

# 5. Read back the saved normal-format output
cat metasploitable2_scan.nmap
# → 445/tcp open  netbios-ssn  Samba smbd 3.X - 4.X
# → 139/tcp open  netbios-ssn  Samba smbd 3.X - 4.X
# → OS details: Linux 2.6.9 - 2.6.33</code></pre>
<p>Notice the sequencing mirrors the pipeline from Mental Model: discovery narrows the whole /24 to one host, a fast wide scan narrows 65,535 ports to a handful, and only then does the slower <code>-sV -O --script</code> pass run — against a small, already-justified target list instead of blindly against everything.</p>

<h3>Example 2 — Chaining service enumeration once nmap flags SMB and SNMP as open</h3>
<pre><code class="language-bash"># nmap already showed 445/tcp (SMB) and 161/udp (SNMP) open on 192.168.56.102 — go deep on each.

# SMB: try a null session first (extremely common misconfiguration on legacy Samba)
smbclient -L //192.168.56.102/ -N
# → Sharename: tmp, opt, IPC$ — all listed without credentials

# Full enum4linux-ng pass once a null session is confirmed reachable
enum4linux-ng -A 192.168.56.102
# → OS version, share list + permissions, user list via RID cycling, password policy

# Confirm read/write permissions per share (enum4linux tells you shares exist; smbmap tells you what you can DO)
smbmap -H 192.168.56.102 -u '' -p ''
# → tmp    READ, WRITE    (an anonymous-writable share — a classic finding worth flagging)

# SNMP: brute the community string, then walk the tree once one hits
onesixtyone -c /usr/share/wordlists/seclists/Discovery/SNMP/common-snmp-community-strings-onesixtyone.txt 192.168.56.102
# → 192.168.56.102 [public]
snmpwalk -c public -v1 192.168.56.102
# → sysDescr, running processes, installed software, network interfaces — often a full system inventory
# for free, from an unauthenticated read-only community string.</code></pre>
<p>The pattern worth keeping: a scan result ("port open") is a lead, not a finding — enumeration is the step that turns it into something reportable (an anonymous-writable share, a public SNMP string dumping the process list), which is exactly the kind of evidence a pentest report (covered at the end of this module) needs to be credible.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '⚠️ Defenses & Legal', html: `
<div class="callout danger">
  <div class="callout-title">⚠️ Authorization reminder — active scanning is not passive recon</div>
  <p>Every technique in this topic sends traffic directly at a target's infrastructure and will show up in firewall, IDS/IPS, and target-side logs. The authorization requirement from eh-foundations (written, in-scope, signed) applies in full here — running <code>nmap -sS</code>, <code>masscan</code>, or any of the enumeration tools above against a system you don't own or aren't authorized to test is unauthorized computer access in most jurisdictions the moment the first packet is sent, regardless of whether you find or exploit anything afterward. Confirm the agreed scanning window and any explicitly excluded techniques (aggressive <code>-T4</code>/<code>-T5</code> scans and UDP floods risk availability on fragile devices — printers, IoT, older embedded systems — and are sometimes excluded by the RoE for exactly that reason) before running anything beyond your own lab.</p>
</div>

<h3>Firewalling: the first layer scanning has to get past</h3>
<p>A properly configured firewall (network-level, or host-based like <code>iptables</code>/<code>nftables</code>/Windows Defender Firewall) is the first thing standing between a scanner and a real result. A closed port replies with a TCP RST (or nothing, if silently dropped); a <strong>filtered</strong> port — one where a firewall is silently dropping packets rather than rejecting them — gives nmap no reliable answer at all, which is exactly why nmap reports states as <code>open</code>, <code>closed</code>, <code>filtered</code>, or <code>open|filtered</code> rather than a simple binary. Default-deny inbound rules, allowing only the specific ports a service actually needs, remove most of the low-hanging fruit this topic's tools are built to find.</p>

<h3>IDS/IPS and scan detection</h3>
<p>Network intrusion detection/prevention systems (Snort, Suricata, and commercial equivalents) and host-based tools commonly detect scanning through pattern and threshold signatures rather than single packets: a high rate of SYN packets with no completed handshake from one source (the SYN-scan signature), sequential port-touch patterns across a short time window, or malformed/unusual TCP flag combinations (some of nmap's rarer scan types, like FIN/NULL/Xmas scans, exist specifically to probe for exactly this kind of stack-quirk detection). This is exactly why nmap's timing templates (<code>-T0</code>/<code>-T1</code>, covered in Mental Model) exist — spreading probes out over time is a direct attempt to fall under a detector's rate threshold. On the defensive side, tools like <strong>fail2ban</strong> (ban an IP after repeated failed auth/connection attempts), <strong>port knocking</strong> (a port only opens after a specific secret sequence of connection attempts hits it in order), and TCP-wrapper-style access control lists all raise the cost of scanning and enumeration meaningfully.</p>

<h3>Service hardening reduces what enumeration can actually extract</h3>
<p>Most of Mechanics' deep findings (anonymous SMB null sessions, public SNMP community strings, anonymous LDAP binds, world-exported NFS shares, VRFY-enabled SMTP) are misconfigurations, not inherent protocol flaws — and each has a direct, standard fix: disable SMBv1 and null-session access; change default/public SNMP community strings (or move to SNMPv3 with real authentication); require authenticated LDAP binds; restrict NFS exports to specific trusted client IPs with <code>no_root_squash</code> disabled; and disable or rate-limit SMTP's VRFY/EXPN commands on the mail server. Every tool covered in Mechanics doubles as a defender's own audit checklist — running <code>enum4linux-ng</code> or <code>onesixtyone</code> against your own estate, with authorization, is a legitimate and common way to verify these fixes actually landed.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'cheat-sheet', title: '📋 Cheat Sheet', html: `
<table>
  <thead><tr><th>Category</th><th>Tool / Flag</th><th>What it does</th></tr></thead>
  <tbody>
    <tr><td>Host discovery</td><td><code>arp-scan --localnet</code></td><td>ARP sweep of the local subnet (fast, reliable, needs root)</td></tr>
    <tr><td>Host discovery</td><td><code>netdiscover -i &lt;iface&gt; -r &lt;subnet&gt;</code></td><td>Active/passive ARP reconnaissance with live display</td></tr>
    <tr><td>Host discovery</td><td><code>nmap -sn &lt;subnet&gt;</code></td><td>Ping sweep — host discovery only, no port scan</td></tr>
    <tr><td>nmap scan type</td><td><code>-sT</code></td><td>TCP connect scan — full handshake, no root needed, more logged</td></tr>
    <tr><td>nmap scan type</td><td><code>-sS</code></td><td>TCP SYN ("half-open") scan — needs root, nmap's default, stealthier</td></tr>
    <tr><td>nmap scan type</td><td><code>-sU</code></td><td>UDP scan — slow/ambiguous but required for SNMP/DNS/NFS/TFTP</td></tr>
    <tr><td>nmap detection</td><td><code>-sV</code></td><td>Service/version detection via banner + probe fingerprinting</td></tr>
    <tr><td>nmap detection</td><td><code>-O</code></td><td>OS fingerprinting (needs root; ideally 1 open + 1 closed TCP port)</td></tr>
    <tr><td>nmap coverage</td><td><code>-p-</code></td><td>Scan all 65,535 TCP ports (default is top 1000 only)</td></tr>
    <tr><td>nmap timing</td><td><code>-T0</code> → <code>-T5</code></td><td>Paranoid → Insane; stealth/speed dial (T0 slowest/quietest, T5 fastest/loudest)</td></tr>
    <tr><td>nmap NSE</td><td><code>--script=vuln</code> / <code>--script=&lt;name&gt;</code></td><td>Run Nmap Scripting Engine (Lua) checks — vuln detection, enum scripts, brute-forcers</td></tr>
    <tr><td>nmap output</td><td><code>-oN</code> / <code>-oX</code> / <code>-oG</code> / <code>-oA</code></td><td>Normal text / XML / grepable / all three formats at once</td></tr>
    <tr><td>Fast scanner</td><td><code>masscan &lt;range&gt; -p&lt;ports&gt; --rate=&lt;n&gt;</code></td><td>Asynchronous internet-scale port scanner; set rate deliberately</td></tr>
    <tr><td>Fast scanner</td><td><code>rustscan -a &lt;target&gt; -- -sV</code></td><td>Very fast port discovery, hands results to nmap after <code>--</code></td></tr>
    <tr><td>SMB enum</td><td><code>enum4linux -a</code> / <code>enum4linux-ng -A</code></td><td>All-in-one SMB/Samba enumeration (shares, users, policy, OS)</td></tr>
    <tr><td>SMB enum</td><td><code>smbclient -L //&lt;target&gt;/ -N</code></td><td>List shares via null session (<code>-N</code> = no password)</td></tr>
    <tr><td>SMB enum</td><td><code>smbmap -H &lt;target&gt; -u '' -p ''</code></td><td>List shares AND read/write permission level per share</td></tr>
    <tr><td>SMB enum</td><td><code>nmblookup -A &lt;target&gt;</code></td><td>NetBIOS name table query by IP</td></tr>
    <tr><td>SNMP enum</td><td><code>snmpwalk -c &lt;community&gt; -v1 &lt;target&gt;</code></td><td>Walk the SNMP OID tree using a known/guessed community string</td></tr>
    <tr><td>SNMP enum</td><td><code>onesixtyone -c &lt;wordlist&gt; &lt;target&gt;</code></td><td>Brute-force SNMP community strings, fast (connectionless)</td></tr>
    <tr><td>LDAP enum</td><td><code>ldapsearch -x -H ldap://&lt;target&gt; -b "dc=..."</code></td><td>Anonymous/authenticated directory tree search</td></tr>
    <tr><td>NFS enum</td><td><code>showmount -e &lt;target&gt;</code></td><td>List a target's exported NFS shares</td></tr>
    <tr><td>SMTP enum</td><td><code>smtp-user-enum -M VRFY/EXPN/RCPT -U &lt;list&gt; -t &lt;target&gt;</code></td><td>Enumerate valid mailboxes via SMTP command abuse</td></tr>
    <tr><td>Manual</td><td><code>nc -nv &lt;target&gt; &lt;port&gt;</code></td><td>Manual banner grab — read whatever the service says first</td></tr>
    <tr><td>ATT&amp;CK mapping</td><td>Reconnaissance → Active Scanning (T1595)</td><td>Scanning an external/not-yet-compromised target</td></tr>
    <tr><td>ATT&amp;CK mapping</td><td>Discovery → Network Service Discovery (T1046)</td><td>Same techniques, run from an already-compromised internal host</td></tr>
    <tr><td>Defense</td><td>Firewalling</td><td>Default-deny inbound; filtered ports return no reliable state to a scanner</td></tr>
    <tr><td>Defense</td><td>IDS/IPS scan detection</td><td>Snort/Suricata-style rate and pattern signatures (SYN floods, sequential port touches)</td></tr>
    <tr><td>Defense</td><td>Service hardening</td><td>Disable SMB null sessions/SMBv1, change default SNMP strings, require authenticated LDAP binds, restrict NFS exports, disable SMTP VRFY/EXPN</td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">What's the difference between a TCP connect scan, a SYN scan, and a UDP scan?</div>
<div class="qa-a">
<p>A TCP connect scan (<code>-sT</code>) completes the full three-way handshake through the operating system's normal socket API — reliable and requires no elevated privileges, but every attempt is a real, fully-logged connection at the application level. A SYN scan (<code>-sS</code>, sometimes called "half-open") sends only the initial SYN and reads the response — SYN/ACK means open, RST means closed — then sends a RST instead of completing the handshake, so it never finishes a real connection; it needs raw-socket privileges (root) but is faster and less visible to application-level logging (though not invisible to network-level firewalls or IDS). UDP scanning (<code>-sU</code>) is fundamentally different because UDP has no handshake at all: an open port frequently gives no response whatsoever unless the probe matches the exact expected protocol format, while a closed port typically replies with an ICMP port-unreachable — which is why UDP scans are slow, often ambiguous ("open|filtered"), and commonly under-scanned despite UDP services like SNMP and DNS being common real footholds.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Why does external network scanning map to MITRE ATT&amp;CK's Reconnaissance tactic and not Discovery?</div>
<div class="qa-a">
<p>ATT&amp;CK separates the two tactics entirely by whether the attacker already has a foothold. Reconnaissance's Active Scanning (T1595) describes probing a target's attack surface from the outside, before any access has been gained — exactly what nmap/masscan/rustscan do against an external or not-yet-compromised target. Discovery (e.g. Network Service Discovery, T1046) describes an attacker who has already compromised a host and is now enumerating the internal environment from the inside to plan lateral movement or find more targets. The underlying commands can be identical — the tactic label depends entirely on which side of "do I already have access" the activity happens on.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What do nmap's timing templates (-T0 through -T5) actually control, and when would you use a slower one?</div>
<div class="qa-a">
<p>They control the trade-off between scan speed and how much load/signature the scan generates — from <code>-T0</code> (Paranoid: a probe every 5 minutes, built for evading IDS rate-based detection, can take days) up to <code>-T5</code> (Insane: fastest possible, but can drop or miss results on anything but a very fast, low-latency network). <code>-T3</code> (Normal) is the default; <code>-T4</code> (Aggressive) is the common choice for labs, CTFs, and internal engagements where speed matters more than stealth. You'd deliberately choose a slower template like <code>-T1</code> or <code>-T0</code> when the engagement's Rules of Engagement call for staying under an IDS/IPS's detection threshold, or when scanning fragile production infrastructure where an aggressive scan risks availability problems.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Walk through how you'd enumerate SMB on a host once nmap shows port 445 open.</div>
<div class="qa-a">
<p>Start by testing for a null session — <code>smbclient -L //&lt;target&gt;/ -N</code> lists shares with no credentials at all, which historically works surprisingly often against misconfigured or legacy Samba. If that succeeds, run a full pass with <code>enum4linux-ng -A &lt;target&gt;</code> (or the original <code>enum4linux -a</code>), which wraps <code>nmblookup</code>, <code>rpcclient</code>, and <code>smbclient</code> to pull the OS/build version, share list, user list (often via RID cycling), and password policy in one pass. Then use <code>smbmap -H &lt;target&gt; -u '' -p ''</code> specifically to confirm read/write permission level per share — enum4linux tells you shares exist, smbmap tells you what you can actually do with them, and an anonymous-writable share is exactly the kind of concrete, reportable finding a pentest report needs.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Why is version detection (nmap -sV) important beyond just knowing a port is open?</div>
<div class="qa-a">
<p>"Port 445 open" is not actionable on its own — every host has open ports. "Port 445 open running Samba 3.0.20, Debian" is actionable, because a specific service and version number can be cross-referenced against known CVEs and exploit databases immediately, turning a bare scan line into a concrete exploitation lead. Version detection is also what feeds NSE's <code>--script=vuln</code> category and later exploitation-phase tool selection (e.g. picking the right Metasploit module) — without it, every later phase is guessing at what's actually running behind an open port.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the practical difference between using nmap, masscan, and rustscan?</div>
<div class="qa-a">
<p>nmap is the deep, flexible standard — it does version detection, OS fingerprinting, and NSE scripting well, but scanning very large ranges or the full 65,535-port space with it is slow. masscan is built for internet-scale speed: an asynchronous scanner that can sweep huge IP ranges for open ports far faster than nmap, at the cost of the deep analysis nmap provides — and its <code>--rate</code> needs to be set deliberately, since too aggressive a rate can flood your own uplink or overwhelm the target/network. rustscan sits in between: it scans ports very fast, then automatically hands the discovered open ports off to nmap (via a <code>--</code> separator) for the deep <code>-sV</code>/NSE work — the common practical pattern across all three is "use a fast scanner to narrow down open ports across a wide range, then run nmap's slower deep analysis only against that narrow list."</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What defenses actually reduce what scanning and enumeration can find?</div>
<div class="qa-a">
<p>Layered: a default-deny firewall reduces the open surface itself and makes many ports show as "filtered" rather than giving a scanner a clean open/closed answer. IDS/IPS systems (Snort, Suricata) detect scanning through rate and pattern signatures — a high volume of unanswered SYNs or sequential port touches from one source — which is exactly what nmap's slow timing templates try to evade. But the highest-leverage fix is usually service hardening at the target itself: disabling SMB null sessions and SMBv1, changing default/public SNMP community strings (or moving to SNMPv3), requiring authenticated LDAP binds, restricting NFS exports to specific trusted client IPs, and disabling or rate-limiting SMTP's VRFY/EXPN commands — since most of what deep enumeration extracts is a misconfiguration, not an inherent flaw in the protocol.</p>
</div>
</div>
`}

]});
