window.PREP_SITE.registerTopic({
  id: 'eh-tools-arsenal',
  module: 'eh',
  title: 'Tools Arsenal (Reference)',
  estimatedReadTime: '18 min',
  tags: ['ethical-hacking', 'tools', 'reference', 'cheat-sheet'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<div class="callout danger">
  <div class="callout-title">⚠️ Reference only — the authorization rule still applies to every tool below</div>
  <p>This is a scannable master index of the tools introduced across the Ethical Hacking module, grouped by phase. Every one of them may only be run against systems you own or are explicitly authorized (in writing, in scope) to test — see <strong>Foundations, Ethics &amp; Legal</strong>. Practice on deliberately vulnerable labs (DVWA, Metasploitable, Juice Shop, Hack The Box, TryHackMe), never on systems you don't own.</p>
</div>
<p>Each teaching topic covers its tools in depth with worked examples and defenses; this page collects them in one place for quick lookup once you already understand what they do. Columns are <strong>Tool</strong> · <strong>Purpose</strong> · <strong>Typical usage</strong>. Nothing new is introduced here — if a tool is unfamiliar, read its home topic first. Sensitive techniques (exploitation payloads, credential dumping, ticket forging) are kept conceptual throughout the module and are not weaponized here either.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'ref-recon', title: '🔍 Recon & OSINT', html: `
<table>
  <thead><tr><th>Tool</th><th>Purpose</th><th>Typical usage</th></tr></thead>
  <tbody>
    <tr><td>whois</td><td>Domain registration data (registrar, dates, name servers)</td><td><code>whois &lt;domain&gt;</code></td></tr>
    <tr><td>dig / nslookup</td><td>Query individual DNS record types</td><td><code>dig &lt;domain&gt; MX</code></td></tr>
    <tr><td>dig axfr / dnsrecon</td><td>Test for an unrestricted DNS zone transfer</td><td><code>dig axfr &lt;domain&gt; @&lt;nameserver&gt;</code> · <code>dnsrecon -d &lt;domain&gt; -t axfr</code></td></tr>
    <tr><td>dnsenum / fierce</td><td>DNS enumeration + subdomain brute force</td><td><code>dnsenum &lt;domain&gt;</code> · <code>fierce --domain &lt;domain&gt;</code></td></tr>
    <tr><td>amass</td><td>Subdomain enum — passive (80+ sources) or active</td><td><code>amass enum -passive -d &lt;domain&gt;</code></td></tr>
    <tr><td>subfinder / sublist3r / assetfinder</td><td>Fast passive subdomain discovery</td><td><code>subfinder -d &lt;domain&gt; -all</code></td></tr>
    <tr><td>Google dorking / GHDB</td><td>Surface indexed files/panels/errors via operators</td><td><code>site:&lt;domain&gt; filetype:pdf</code></td></tr>
    <tr><td>theHarvester</td><td>Emails, names, subdomains from OSINT sources</td><td><code>theHarvester -d &lt;domain&gt; -b duckduckgo</code></td></tr>
    <tr><td>Shodan / Censys</td><td>Search pre-built internet-wide scan indexes (passive)</td><td><code>shodan host &lt;ip&gt;</code></td></tr>
    <tr><td>Maltego</td><td>Visual link analysis across entities</td><td>GUI: run transforms to expand a graph</td></tr>
    <tr><td>recon-ng / SpiderFoot</td><td>Modular OSINT automation frameworks</td><td><code>sf.py -s &lt;domain&gt; -u passive</code></td></tr>
    <tr><td>exiftool</td><td>Read (or strip) document/image metadata</td><td><code>exiftool &lt;file&gt;</code></td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'ref-scanning', title: '📡 Scanning & Enumeration', html: `
<table>
  <thead><tr><th>Tool</th><th>Purpose</th><th>Typical usage</th></tr></thead>
  <tbody>
    <tr><td>arp-scan / netdiscover</td><td>Local-subnet host discovery (ARP)</td><td><code>arp-scan --localnet</code></td></tr>
    <tr><td>nmap (scan types)</td><td>Port scanning — connect / SYN / UDP</td><td><code>nmap -sS -sV -O -p- &lt;target&gt;</code></td></tr>
    <tr><td>nmap NSE / timing / output</td><td>Scripts, stealth/speed dial, output formats</td><td><code>--script=vuln</code> · <code>-T4</code> · <code>-oA &lt;name&gt;</code></td></tr>
    <tr><td>masscan / rustscan</td><td>Very fast wide-range port discovery</td><td><code>rustscan -a &lt;target&gt; -- -sV</code></td></tr>
    <tr><td>enum4linux(-ng) / smbclient / smbmap</td><td>SMB share/user/permission enumeration</td><td><code>enum4linux-ng -A &lt;target&gt;</code> · <code>smbmap -H &lt;target&gt;</code></td></tr>
    <tr><td>snmpwalk / onesixtyone</td><td>SNMP tree walk / community-string brute force</td><td><code>snmpwalk -c public -v1 &lt;target&gt;</code></td></tr>
    <tr><td>ldapsearch</td><td>Directory tree search (anon/authenticated)</td><td><code>ldapsearch -x -H ldap://&lt;target&gt;</code></td></tr>
    <tr><td>showmount / smtp-user-enum</td><td>NFS export listing / SMTP mailbox enum</td><td><code>showmount -e &lt;target&gt;</code></td></tr>
    <tr><td>netcat</td><td>Manual banner grabbing</td><td><code>nc -nv &lt;target&gt; &lt;port&gt;</code></td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'ref-vuln', title: '🩹 Vulnerability Assessment', html: `
<table>
  <thead><tr><th>Tool</th><th>Purpose</th><th>Typical usage</th></tr></thead>
  <tbody>
    <tr><td>Nessus</td><td>Industry-standard scanner (UI/API, NASL plugins)</td><td>Policy-driven scan → export findings</td></tr>
    <tr><td>OpenVAS / GVM</td><td>Open-source scanner (NVT feed)</td><td>Automated via <code>gvm-cli</code> / GMP</td></tr>
    <tr><td>Nikto</td><td>Web-server misconfig / known-vuln scanner</td><td><code>nikto -h &lt;url&gt;</code></td></tr>
    <tr><td>nuclei</td><td>Fast YAML-template scanner (new CVEs quickly)</td><td><code>nuclei -u &lt;url&gt; -severity critical,high</code></td></tr>
    <tr><td>wpscan</td><td>WordPress core/theme/plugin + user enum</td><td><code>wpscan --url &lt;url&gt; --enumerate vp,u</code></td></tr>
    <tr><td>searchsploit / Exploit-DB</td><td>"Does a public exploit exist for this?"</td><td><code>searchsploit --cve &lt;id&gt;</code></td></tr>
    <tr><td>CVSS (v3.1 / v4.0)</td><td>Severity scoring (Base always present)</td><td>0.0 None → 9.0–10.0 Critical</td></tr>
    <tr><td>EPSS / CISA KEV</td><td>Exploit-likelihood / actively-exploited prioritization</td><td>Rank real risk beyond raw CVSS</td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'ref-web', title: '🕸️ Web Application Hacking', html: `
<table>
  <thead><tr><th>Tool</th><th>Purpose</th><th>Typical usage</th></tr></thead>
  <tbody>
    <tr><td>Burp Suite</td><td>Intercepting proxy + Repeater/Intruder/Decoder/Scanner</td><td>Proxy browser → tamper &amp; replay requests</td></tr>
    <tr><td>OWASP ZAP</td><td>Free proxy + spider + active scan</td><td><code>zap-baseline.py -t &lt;url&gt;</code></td></tr>
    <tr><td>sqlmap</td><td>Automated SQLi detection/exploitation</td><td><code>sqlmap -u &lt;url&gt; --dbs --batch</code></td></tr>
    <tr><td>gobuster / ffuf / feroxbuster / dirb</td><td>Directory &amp; file content discovery</td><td><code>ffuf -u &lt;url&gt;/FUZZ -w &lt;wordlist&gt;</code></td></tr>
    <tr><td>wpscan / nikto</td><td>CMS-specific / web-server vuln fingerprinting</td><td><code>wpscan --url &lt;url&gt;</code></td></tr>
    <tr><td>jwt_tool + hashcat</td><td>JWT tampering / offline secret cracking</td><td><code>jwt_tool -C</code> · <code>hashcat -m 16500</code></td></tr>
    <tr><td>OWASP Top 10 (2021)</td><td>The vulnerability-class reference (A01–A10)</td><td>A01 Access Control … A03 Injection … A10 SSRF</td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'ref-network', title: '🌐 Network Attacks', html: `
<table>
  <thead><tr><th>Tool</th><th>Purpose</th><th>Typical usage</th></tr></thead>
  <tbody>
    <tr><td>Wireshark / tcpdump / tshark</td><td>Packet capture &amp; analysis</td><td><code>tcpdump -i &lt;iface&gt; host &lt;ip&gt; -w cap.pcap</code></td></tr>
    <tr><td>arpspoof / ettercap / bettercap</td><td>MITM via ARP spoofing (lab / explicit scope)</td><td><code>bettercap</code> → <code>arp.spoof on</code></td></tr>
    <tr><td>DNS spoofing</td><td>Redirect name resolution in a MITM position</td><td>ettercap <code>dns_spoof</code> / bettercap <code>dns.spoof</code></td></tr>
    <tr><td>Responder</td><td>LLMNR/NBT-NS/mDNS poisoning → NTLMv2 capture</td><td><code>responder -I &lt;iface&gt;</code></td></tr>
    <tr><td>hashcat</td><td>Crack captured NTLMv2 hashes</td><td><code>hashcat -m 5600 &lt;hashfile&gt; &lt;wordlist&gt;</code></td></tr>
    <tr><td>Pivoting</td><td>Route through a foothold to reach other segments</td><td><code>ssh -D</code> + proxychains · <code>chisel</code></td></tr>
    <tr><td>Defenses</td><td>What actually stops these</td><td>DAI · disable LLMNR/NBT-NS · SMB signing · segmentation</td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'ref-wireless', title: '📶 Wireless Security', html: `
<table>
  <thead><tr><th>Tool</th><th>Purpose</th><th>Typical usage</th></tr></thead>
  <tbody>
    <tr><td>airmon-ng</td><td>Enable/disable monitor mode</td><td><code>airmon-ng start &lt;iface&gt;</code></td></tr>
    <tr><td>airodump-ng</td><td>Recon + targeted handshake capture</td><td><code>airodump-ng --bssid &lt;bssid&gt; -c &lt;ch&gt; -w cap &lt;iface&gt;</code></td></tr>
    <tr><td>aireplay-ng</td><td>Frame injection — deauth to force a handshake</td><td><code>aireplay-ng --deauth 5 -a &lt;bssid&gt; &lt;iface&gt;</code></td></tr>
    <tr><td>aircrack-ng</td><td>Offline crack of a captured handshake</td><td><code>aircrack-ng -w &lt;wordlist&gt; cap.cap</code></td></tr>
    <tr><td>wifite</td><td>Automates PMKID/handshake/WPS attacks</td><td><code>wifite</code></td></tr>
    <tr><td>hcxdumptool + hcxpcapngtool</td><td>Clientless PMKID capture → hashcat format</td><td>Capture → convert to mode-22000 hash</td></tr>
    <tr><td>hashcat -m 22000</td><td>Current unified WPA hash mode (PMKID + handshake)</td><td><code>hashcat -m 22000 &lt;hash&gt; &lt;wordlist&gt;</code></td></tr>
    <tr><td>airgeddon / hostapd</td><td>Evil-twin / rogue-AP orchestration (concept)</td><td>Menu-driven rogue AP</td></tr>
    <tr><td>bluetoothctl / proxmark3</td><td>Bluetooth recon / RFID-NFC assessment</td><td><code>bluetoothctl scan on</code> · <code>proxmark3</code></td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'ref-password', title: '🔑 Password Attacks', html: `
<table>
  <thead><tr><th>Tool</th><th>Purpose</th><th>Typical usage</th></tr></thead>
  <tbody>
    <tr><td>hashid / hash-identifier</td><td>Identify a hash's algorithm (+ hashcat mode)</td><td><code>hashid -m -j &lt;hash&gt;</code></td></tr>
    <tr><td>hydra / medusa / ncrack / patator</td><td>Online (network) credential guessing</td><td><code>hydra -l &lt;user&gt; -P &lt;wordlist&gt; ssh://&lt;target&gt;</code></td></tr>
    <tr><td>john</td><td>Offline CPU cracker (autodetect/rules/incremental)</td><td><code>john --wordlist=&lt;wordlist&gt; --rules &lt;hashfile&gt;</code></td></tr>
    <tr><td>hashcat</td><td>Offline GPU cracker (<code>-m</code> type, <code>-a</code> mode)</td><td><code>hashcat -m &lt;mode&gt; -a 0 &lt;hashfile&gt; &lt;wordlist&gt;</code></td></tr>
    <tr><td>rockyou.txt / SecLists</td><td>Standard leaked-password / curated wordlists</td><td><code>/usr/share/wordlists/rockyou.txt</code></td></tr>
    <tr><td>crunch / cewl</td><td>Generate charset / site-specific wordlists</td><td><code>cewl -d 2 -m 5 -w &lt;wordlist&gt; &lt;url&gt;</code></td></tr>
    <tr><td>RainbowCrack / Ophcrack</td><td>Precomputed rainbow-table cracking (defeated by salt)</td><td><code>rcrack &lt;tables&gt; -h &lt;hash&gt;</code></td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'ref-exploit', title: '💥 Exploitation', html: `
<table>
  <thead><tr><th>Item</th><th>Purpose / role</th><th>Key idea</th></tr></thead>
  <tbody>
    <tr><td>Exploit / Payload / Shellcode</td><td>Technique / what runs after / low-level payload form</td><td>Exploit delivers payload; decoupled</td></tr>
    <tr><td>msfconsole</td><td>Metasploit's main interface</td><td>search → use → set options → run → sessions</td></tr>
    <tr><td>Module types</td><td>exploit / payload / auxiliary / post / encoder</td><td>Auxiliary = scanners; post = run vs a session</td></tr>
    <tr><td>Meterpreter</td><td>In-memory post-exploitation agent</td><td>Caught by behavioral / memory EDR</td></tr>
    <tr><td>msfvenom</td><td>Standalone payload generator (role)</td><td>Stock output is well-signatured</td></tr>
    <tr><td>multi/handler</td><td>Listener that catches incoming sessions</td><td>Pairs with a reverse payload</td></tr>
    <tr><td>searchsploit</td><td>Offline Exploit-DB search</td><td><code>-m &lt;id&gt;</code> to copy; READ before running</td></tr>
    <tr><td>DEP/NX · ASLR · canary · CFG</td><td>Exploit mitigations (the defensive half)</td><td>Non-exec memory · random layout · guard value · flow validation</td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'ref-postexploit', title: '🧗 Post-Exploit & PrivEsc', html: `
<table>
  <thead><tr><th>Tool / vector</th><th>Purpose</th><th>Key idea</th></tr></thead>
  <tbody>
    <tr><td>LinPEAS / WinPEAS</td><td>Automated Linux/Windows privesc enumeration</td><td>Color-coded by likelihood</td></tr>
    <tr><td>linux-exploit-suggester / PowerUp</td><td>Kernel-CVE / Windows-misconfig checkers</td><td><code>Invoke-AllChecks</code></td></tr>
    <tr><td>SUID/SGID · sudo -l · GTFOBins</td><td>Linux privesc vectors</td><td>Map an allowed binary to escalation syntax</td></tr>
    <tr><td>getcap (capabilities) · cron · writable PATH</td><td>More Linux privesc vectors</td><td>Slice of root without full SUID</td></tr>
    <tr><td>Unquoted service paths · AlwaysInstallElevated</td><td>Windows privesc vectors</td><td>Writable early segment / any .msi as SYSTEM</td></tr>
    <tr><td>Potato family · UAC bypass (concept)</td><td>Windows token/integrity abuse</td><td>SeImpersonate → SYSTEM (conceptual)</td></tr>
    <tr><td>mimikatz (concept)</td><td>Credential dumping from LSASS / SAM</td><td>Countered by Credential Guard + EDR</td></tr>
    <tr><td>chisel / ligolo-ng / proxychains / SSH -L,-D</td><td>Pivoting &amp; tunneling</td><td>Reach segments only the foothold can</td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'ref-ad', title: '🏛️ Active Directory', html: `
<table>
  <thead><tr><th>Tool / technique</th><th>Purpose</th><th>Typical usage</th></tr></thead>
  <tbody>
    <tr><td>BloodHound CE + SharpHound</td><td>Graph AD relationships → attack paths</td><td><code>SharpHound.exe -c All</code> → query in UI</td></tr>
    <tr><td>PowerView</td><td>Scriptable AD/LDAP enumeration</td><td><code>Get-DomainUser -SPN</code></td></tr>
    <tr><td>netexec (crackmapexec successor)</td><td>Sweep hosts for creds/shares/access</td><td><code>netexec smb &lt;target&gt; -u &lt;user&gt; -p &lt;pass&gt; --shares</code></td></tr>
    <tr><td>GetUserSPNs.py (Kerberoasting)</td><td>Request SPN tickets to crack offline</td><td>Crack with <code>hashcat -m 13100</code></td></tr>
    <tr><td>GetNPUsers.py (AS-REP roasting)</td><td>Target no-preauth accounts</td><td>Crack with <code>hashcat -m 18200</code></td></tr>
    <tr><td>Pass-the-Hash / Pass-the-Ticket</td><td>Authenticate with a hash/ticket, no password</td><td><code>psexec.py -hashes :&lt;hash&gt;</code></td></tr>
    <tr><td>Impacket suite / evil-winrm</td><td>Remote exec &amp; credential access</td><td><code>wmiexec.py</code> · <code>secretsdump.py</code> · <code>evil-winrm</code></td></tr>
    <tr><td>DCSync · golden/silver tickets (concept)</td><td>Replicate secrets / forge tickets</td><td>Conceptual — defenses: krbtgt rotation, monitoring</td></tr>
    <tr><td>ADCS ESC1 (concept)</td><td>Certificate-template abuse</td><td>Audit with Certipy; restrict enrollment</td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'ref-social', title: '🎭 Social Engineering & Physical', html: `
<table>
  <thead><tr><th>Tool / vector</th><th>Purpose</th><th>Key idea</th></tr></thead>
  <tbody>
    <tr><td>GoPhish</td><td>Phishing-simulation framework</td><td>Templates, tracked pages, campaign metrics</td></tr>
    <tr><td>SET (Social-Engineer Toolkit)</td><td>Spear-phishing / site-cloning modules</td><td>Pre-installed on Kali (<code>setoolkit</code>)</td></tr>
    <tr><td>Phishing / spear-phishing / vishing</td><td>Deceptive email/voice vectors</td><td>Bulk vs researched vs phone-based</td></tr>
    <tr><td>Pretexting / BEC (concept)</td><td>Invented identity / payment-redirect fraud</td><td>Often no malware at all</td></tr>
    <tr><td>Tailgating · USB drop · badge cloning (concept)</td><td>Physical vectors</td><td>Authorization-gated; get-out-of-jail letter</td></tr>
    <tr><td>SPF / DKIM / DMARC</td><td>Email authentication (defense)</td><td>DMARC needs SPF/DKIM alignment; <code>p=reject</code></td></tr>
    <tr><td>Awareness training + phishing-resistant MFA</td><td>Primary human-layer defenses</td><td>FIDO2/WebAuthn resist AiTM relay</td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'ref-reporting', title: '📝 Reporting & Cloud', html: `
<table>
  <thead><tr><th>Tool / concept</th><th>Purpose</th><th>Key idea</th></tr></thead>
  <tbody>
    <tr><td>Report structure</td><td>Communicate risk + fixes</td><td>Exec summary · findings (CVSS + repro + evidence) · retest</td></tr>
    <tr><td>Obsidian / CherryTree</td><td>Engagement note-taking</td><td>One note per host/finding</td></tr>
    <tr><td>Shared responsibility model</td><td>Defines cloud pentest scope</td><td>Provider "of the cloud", customer "in the cloud"</td></tr>
    <tr><td>ScoutSuite / prowler</td><td>Read-only multi-cloud config auditors</td><td><code>prowler aws</code></td></tr>
    <tr><td>pacu</td><td>Active AWS exploitation framework</td><td>Not read-only — scope carefully</td></tr>
    <tr><td>IMDS / IMDSv2</td><td>Instance metadata (SSRF target) + its mitigation</td><td><code>169.254.169.254</code>; IMDSv2 token + hop-limit 1</td></tr>
    <tr><td>trivy / kube-bench / kube-hunter</td><td>Container &amp; K8s scanning</td><td>kube-hunter archived (2024) — technique reference</td></tr>
    <tr><td>MobSF</td><td>Mobile app static + dynamic analysis</td><td>Android/iOS</td></tr>
    <tr><td>SIEM · detection engineering · ATT&amp;CK mapping</td><td>Blue/purple-team defensive side</td><td>Turn techniques into tuned detections</td></tr>
  </tbody>
</table>
`},

  ],
});
