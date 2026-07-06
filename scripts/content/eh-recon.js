window.PREP_SITE.registerTopic({
  id: 'eh-recon',
  module: 'eh',
  title: 'Reconnaissance & OSINT',
  estimatedReadTime: '28 min',
  tags: ['ethical-hacking', 'security', 'pentest', 'recon', 'osint', 'dns', 'shodan', 'footprinting'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<div class="callout danger">
  <div class="callout-title">⚠️ Same rule as every other topic in this module</div>
  <p>Reconnaissance looks harmless — most of it is just reading public information — which is exactly why it's the technique people are most tempted to run against a real company "just to see." Don't. Everything below is for a target you own, a lab, or an engagement you have explicit written authorization and an agreed scope for (see Foundations, Ethics &amp; Legal). Some techniques here never touch the target's infrastructure at all (passive); others — zone-transfer attempts, active subdomain brute-forcing, direct queries against a live target's own nameservers — unambiguously do, and those must be explicitly in scope.</p>
</div>
<p><strong>Reconnaissance ("recon")</strong> is the information-gathering phase that comes right after pre-engagement in the pentest lifecycle: before you scan a single port or exploit a single flaw, you build a map of what the target actually has — domains, subdomains, IP ranges, technologies, employees, exposed devices, leaked documents. Most of it is drawn from <strong>OSINT (Open Source Intelligence)</strong> — information that's already public, just scattered across many sources.</p>
<ul>
  <li><strong>The core distinction is passive vs. active.</strong> Passive recon pulls from third parties (WHOIS registries, search engine caches, Shodan/Censys's own pre-built scan databases) and never sends a single packet to the target itself — it's effectively undetectable by them. Active recon queries the target's own infrastructure directly (its nameservers, its live hosts) and can show up in their logs.</li>
  <li><strong>This topic covers, in order of the recon funnel:</strong> domain intelligence (WHOIS, DNS via <code>dig</code>/<code>nslookup</code>/<code>dnsrecon</code>/<code>dnsenum</code>/<code>fierce</code>, zone transfers), subdomain/asset discovery (<code>amass</code>, <code>subfinder</code>, <code>sublist3r</code>, <code>assetfinder</code>), search-engine intelligence (Google dorking / the GHDB), people and email OSINT (<code>theHarvester</code>), internet-wide device/service exposure (Shodan, Censys), link analysis (Maltego), automation frameworks (<code>recon-ng</code>, SpiderFoot), and metadata leakage (<code>exiftool</code>).</li>
  <li><strong>The output is an asset inventory, not a party trick.</strong> Everything gathered here — verified domains, live subdomains, exposed IPs and services, employee emails, leaked technical details — feeds directly into the next topic, Scanning &amp; Enumeration, which turns this map into a list of live, probed targets.</li>
  <li><strong>MITRE ATT&amp;CK maps all of this to the Reconnaissance tactic (TA0043)</strong> — techniques an adversary uses to gather information before or without gaining access. This is <em>not</em> the Discovery tactic (TA0007), which is a post-compromise tactic used from inside an already-compromised environment (covered later, in Post-Exploitation &amp; Privilege Escalation) — a very common mix-up worth getting right.</li>
</ul>
<p><strong>Mantra:</strong> "Passive first, active only in scope — recon builds the map that every later phase of the engagement depends on."</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What reconnaissance actually is</h3>
<p>Reconnaissance is the deliberate, structured collection of information about a target before touching it with anything resembling an attack. The goal isn't a single fact — it's an <strong>attack surface map</strong>: every domain and subdomain the organization owns, every IP range and exposed service, the technologies and software versions in use, the employees who work there and how they can be reached or impersonated, and any documents or metadata that leak more than the organization intended. A thorough recon phase makes every later phase faster and more precise — you scan the hosts that actually exist instead of guessing, and you exploit weaknesses you already know are there instead of stumbling into them blind.</p>

<h3>OSINT: the discipline underneath most of this topic</h3>
<p><strong>OSINT (Open Source Intelligence)</strong> is the broader discipline of collecting and correlating information that is already publicly available — nothing here requires breaking in anywhere. It's borrowed directly from traditional intelligence tradecraft, which describes an <strong>intelligence cycle</strong>: Direction (what do we need to know?) → Collection (gather from many sources) → Processing (normalize and de-duplicate raw data) → Analysis (correlate it into something meaningful) → Dissemination (turn it into a usable report). A recon phase runs through exactly this cycle: pull raw data from WHOIS, DNS, search engines, Shodan, and social sources; de-duplicate and cross-reference it (the same subdomain often shows up from three different tools); and turn the result into the asset inventory that Scanning &amp; Enumeration consumes next.</p>

<h3>Passive vs. active recon</h3>
<table>
  <thead><tr><th>Aspect</th><th>Passive recon</th><th>Active recon</th></tr></thead>
  <tbody>
    <tr><td>Touches target infrastructure?</td><td>No — queries third-party/public sources only</td><td>Yes — sends requests directly to the target's own systems</td></tr>
    <tr><td>Detection risk</td><td>Effectively undetectable by the target</td><td>Can appear in the target's own DNS/web/IDS logs</td></tr>
    <tr><td>Typical examples</td><td>WHOIS, Google dorking, theHarvester, Shodan/Censys (someone else already scanned the internet), Maltego, exiftool on a publicly-downloaded document</td><td>Direct DNS queries and zone-transfer attempts against the target's own nameservers, active subdomain brute-forcing, <code>fierce</code></td></tr>
    <tr><td>Authorization needed</td><td>Still requires the target be your own asset, an authorized engagement's scope, or a legal practice target — "it's public" is not blanket permission to profile a real company</td><td>Must be explicitly listed in scope — this is the point where recon starts to look like the target's own security monitoring would expect an attacker to look</td></tr>
  </tbody>
</table>
<p>A well-run recon phase deliberately sequences these: exhaust the passive sources first to build the broadest possible picture with zero footprint, then use active techniques only where necessary, and only within scope, to confirm and complete that picture.</p>

<h3>Why recon is the phase that pays for itself later</h3>
<p>Most real-world breaches don't start with an exotic zero-day — they start with something recon-shaped: an old subdomain nobody remembered still pointing at a decommissioned service, an employee email harvested and used for a convincing phishing pretext, a misconfigured cloud storage bucket surfaced by a single Google dork, or an exposed admin panel found sitting in Shodan's database because someone else already scanned the whole internet and indexed it. Recon exists to find these before an attacker does — and because a good recon phase is passive and cheap to run, there's rarely an excuse to skip it and go straight to scanning.</p>

<h3>MITRE ATT&amp;CK: Reconnaissance (TA0043) — not Discovery (TA0007)</h3>
<p>ATT&amp;CK places every technique in this topic under the <strong>Reconnaissance tactic (TA0043)</strong>: techniques an adversary uses to gather information before gaining any access at all. This is easy to confuse with the similarly-named <strong>Discovery tactic (TA0007)</strong>, which is a completely different, later stage — techniques an attacker uses <em>after</em> already compromising a host, to learn about the internal environment they've landed in (covered in this module's Post-Exploitation &amp; Privilege Escalation topic). A rough, approximate mapping of this topic's tools onto Reconnaissance sub-techniques:</p>
<table>
  <thead><tr><th>ATT&amp;CK technique (TA0043)</th><th>What it covers</th><th>Tools in this topic</th></tr></thead>
  <tbody>
    <tr><td>T1596.002 — Search Open Technical Databases: WHOIS</td><td>Domain registration data</td><td><code>whois</code></td></tr>
    <tr><td>T1596.001 / T1590.002 — Passive/Active DNS</td><td>DNS records, name servers, zone data</td><td><code>dig</code>, <code>nslookup</code>, <code>dnsrecon</code>, <code>dnsenum</code></td></tr>
    <tr><td>T1595.001 / T1595.003 — Active Scanning: IP Blocks / Wordlist Scanning</td><td>Direct probing and brute-force enumeration of the target's own infrastructure</td><td><code>fierce</code>, active-mode <code>amass</code>, zone-transfer (AXFR) attempts</td></tr>
    <tr><td>T1593.002 — Search Open Websites/Domains: Search Engines</td><td>Indexed pages, exposed files, misconfigurations</td><td>Google dorking / GHDB</td></tr>
    <tr><td>T1589.002 — Gather Victim Identity Information: Email Addresses</td><td>Employee names and emails</td><td><code>theHarvester</code></td></tr>
    <tr><td>T1596.005 — Search Open Technical Databases: Scan Databases</td><td>Pre-scanned internet-wide device/service data</td><td>Shodan, Censys</td></tr>
    <tr><td>T1591 — Gather Victim Org Information</td><td>Org structure, business relationships, roles</td><td>Maltego, <code>recon-ng</code>, SpiderFoot (correlation across all of the above)</td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The recon funnel: broad passive collection narrowing to a verified inventory</h3>
<p>Every recon phase, regardless of which tools get used, moves through the same funnel shape:</p>
<pre><code class="language-text">Passive / Third-Party Sources          Active Confirmation              Verified Asset Inventory
(WHOIS, passive DNS, Shodan/Censys,    (direct DNS queries, zone         (deduped domains & subdomains,
 GHDB, theHarvester, Maltego,           transfer attempts, active         live hosts, exposed services,
 recon-ng, SpiderFoot, exiftool)        brute-force subdomain enum,       employee emails, leaked
                                        fierce — ONLY if in scope)        metadata)
              │                                  │                                 │
              └──────────────► cross-referenced, deduplicated, verified ───────────┘
                                                  │
                                                  ▼
                                  feeds directly into Scanning &amp; Enumeration
</code></pre>
<p>No single tool or source has full coverage — the same subdomain routinely turns up from three different sources and is missed by a fourth — so the funnel's middle step is as much about cross-referencing and de-duplication as it is about running more tools.</p>

<h3>Recon categories, mapped to what each is actually for</h3>
<table>
  <thead><tr><th>Category</th><th>What it answers</th><th>Representative tools</th></tr></thead>
  <tbody>
    <tr><td>Domain/registration intel</td><td>Who owns this domain, since when, via which registrar/nameservers?</td><td>WHOIS</td></tr>
    <tr><td>DNS intel</td><td>What does the DNS infrastructure look like — mail servers, name servers, misconfigurations?</td><td><code>dig</code>, <code>nslookup</code>, <code>dnsrecon</code>, <code>dnsenum</code>, <code>fierce</code>, zone transfer (AXFR)</td></tr>
    <tr><td>Subdomain/asset discovery</td><td>How wide is the attack surface — what else does this org run?</td><td><code>amass</code>, <code>subfinder</code>, <code>sublist3r</code>, <code>assetfinder</code></td></tr>
    <tr><td>Search-engine intel</td><td>What has already been indexed that shouldn't have been?</td><td>Google dorking / GHDB</td></tr>
    <tr><td>People/email OSINT</td><td>Who works here, and how are they reachable?</td><td><code>theHarvester</code></td></tr>
    <tr><td>Internet-wide device/service exposure</td><td>What's already been scanned and indexed by someone else?</td><td>Shodan, Censys</td></tr>
    <tr><td>Link/relationship analysis</td><td>How do these entities (domains, IPs, people, orgs) connect to each other?</td><td>Maltego</td></tr>
    <tr><td>Automation/orchestration</td><td>Can I run and correlate many of the above at once?</td><td><code>recon-ng</code>, SpiderFoot</td></tr>
    <tr><td>Metadata leakage</td><td>What's hidden inside files this org has already published?</td><td><code>exiftool</code></td></tr>
  </tbody>
</table>

<h3>recon-ng and SpiderFoot aren't techniques — they're orchestration</h3>
<p>It's easy to list <code>recon-ng</code> and SpiderFoot alongside individual tools like <code>whois</code> or <code>theHarvester</code>, but they sit at a different altitude: both are <strong>frameworks</strong> whose individual modules wrap many of the techniques above (WHOIS lookups, DNS resolution, search-engine queries, Shodan lookups, and more) and automatically store, correlate, and cross-reference the results in one place. Running one of these frameworks well still means understanding what each underlying module is actually doing — the framework saves you from re-typing individual tool invocations and manually merging their output, it doesn't replace understanding what's being collected.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Recon Techniques & Tools', html: `
<h3>WHOIS — domain registration intelligence</h3>
<p><strong>WHOIS</strong> queries a domain registry/registrar's public database for registration metadata: registrar name, creation and expiry dates, and name servers. Registrant contact details (name, email, phone) are frequently redacted behind a registrar privacy proxy today — largely a consequence of GDPR-driven privacy requirements since 2018 — so treat any contact info WHOIS does return as a bonus, not a guarantee.</p>
<pre><code class="language-bash"># Basic WHOIS lookup
whois &lt;domain&gt;

# Filter straight to the useful lines
whois &lt;domain&gt; | grep -Ei 'registrar|creation|expir|name server'</code></pre>

<h3>DNS enumeration — dig, nslookup, dnsrecon, dnsenum, fierce</h3>
<p><code>dig</code> and <code>nslookup</code> are the baseline tools for querying individual DNS record types directly:</p>
<pre><code class="language-bash"># dig: query individual record types
dig &lt;domain&gt; A
dig &lt;domain&gt; MX
dig &lt;domain&gt; NS
dig &lt;domain&gt; TXT
dig &lt;domain&gt; +short A          # terse output, address only
dig &lt;domain&gt; +trace            # walk the delegation chain from the root down

# nslookup equivalents
nslookup -type=MX &lt;domain&gt;
nslookup -type=NS &lt;domain&gt;</code></pre>
<p><strong>dnsrecon</strong> and <strong>dnsenum</strong> automate a full standard DNS sweep (NS, SOA, A/AAAA, MX, TXT, SRV records, plus a zone-transfer test) in one pass, and can brute-force subdomains against a wordlist:</p>
<pre><code class="language-bash"># dnsrecon: standard sweep, then a dedicated brute-force pass
dnsrecon -d &lt;domain&gt;
dnsrecon -d &lt;domain&gt; -D /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -t brt

# dnsenum: standard sweep, or brute force against a specific name server
dnsenum &lt;domain&gt;
dnsenum --enum --dnsserver &lt;nameserver-ip&gt; -f /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -o dnsenum-results.xml &lt;domain&gt;</code></pre>
<p><strong>fierce</strong> is a lighter, focused DNS reconnaissance tool built specifically to locate non-contiguous IP space and hostnames as a precursor step before scanning tools like Nmap:</p>
<pre><code class="language-bash">fierce --domain &lt;domain&gt;
fierce --domain &lt;domain&gt; --subdomain-file /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt</code></pre>

<h3>Zone transfers (AXFR) — the misconfiguration everyone still checks for</h3>
<p>A DNS <strong>zone transfer (AXFR)</strong> is meant to replicate an entire zone's records from a primary name server to its secondaries. If a public-facing name server answers an AXFR request from <em>anyone</em>, it hands over the organization's complete internal DNS record set in one request — hostnames, internal IPs, and infrastructure that was never meant to be public. Correctly configured DNS restricts AXFR to known secondary-server IPs only, so a successful transfer against a random tester is a real, reportable finding, not routine.</p>
<pre><code class="language-bash"># Ask a specific name server for the whole zone directly
dig axfr &lt;domain&gt; @&lt;nameserver&gt;

# dnsrecon tests every listed NS for the domain automatically
dnsrecon -d &lt;domain&gt; -t axfr

# A deliberately permissive practice target maintained for exactly this purpose:
dig axfr zonetransfer.me @nsztm1.digi.ninja</code></pre>

<h3>Subdomain enumeration — amass, subfinder, sublist3r, assetfinder</h3>
<p><strong>OWASP Amass</strong> queries 80+ third-party sources for passive results, and can additionally resolve and brute-force directly against the target's own DNS when run in active mode:</p>
<pre><code class="language-bash"># Passive only — never touches the target's own infrastructure
amass enum -passive -d &lt;domain&gt;

# Active — adds direct resolution and wordlist brute-forcing against the target's DNS (in-scope only)
amass enum -active -brute -d &lt;domain&gt; -o amass-results.txt</code></pre>
<p><strong>subfinder</strong> (ProjectDiscovery) is a fast, purely passive subdomain-discovery tool built to chain into the rest of that team's toolchain (httpx, nuclei, and others, covered in later topics):</p>
<pre><code class="language-bash">subfinder -d &lt;domain&gt; -all -o subfinder-results.txt   # -all: query every configured source (slower, widest coverage)
echo &lt;domain&gt; | subfinder -silent                       # pipe-friendly, output only</code></pre>
<p><strong>Sublist3r</strong> aggregates results from multiple search engines and OSINT sources, with an optional brute-force module:</p>
<pre><code class="language-bash">python3 sublist3r.py -d &lt;domain&gt; -b -o sublist3r-results.txt   # -b enables the subbrute brute-force module</code></pre>
<p><strong>assetfinder</strong> is a small, single-purpose tool that finds domains and subdomains potentially related to a target from public sources:</p>
<pre><code class="language-bash">assetfinder --subs-only &lt;domain&gt;   # restrict output to actual subdomains of the given domain</code></pre>
<p>Run more than one of these and merge the output — coverage varies noticeably between them:</p>
<pre><code class="language-bash">cat amass-results.txt subfinder-results.txt sublist3r-results.txt &lt;(assetfinder --subs-only &lt;domain&gt;) | sort -u &gt; all-subdomains.txt</code></pre>

<h3>Google dorking / the GHDB</h3>
<p><strong>Google dorking</strong> uses search-engine operators to surface content that's been indexed but was never meant to be found — exposed files, admin panels, error messages, sensitive directories. The <strong>Google Hacking Database (GHDB)</strong>, maintained via Exploit-DB, is a curated, categorized library of these dork queries contributed by the community. Core operators: <code>site:</code> (restrict to a domain), <code>filetype:</code>/<code>ext:</code> (restrict to a file type), <code>intitle:</code> (page title contains), <code>inurl:</code> (URL contains), <code>intext:</code> (page body contains).</p>
<pre><code class="language-bash"># Paste these into a search engine — not shell commands, but shown here for consistent formatting
site:&lt;domain&gt; filetype:pdf
site:&lt;domain&gt; ext:sql OR ext:env OR ext:log
intitle:"index of" site:&lt;domain&gt;
inurl:admin site:&lt;domain&gt;
site:&lt;domain&gt; intext:"internal use only"</code></pre>

<h3>theHarvester — emails, employee names, and subdomains via search sources</h3>
<p><strong>theHarvester</strong> queries a configurable list of public sources (search engines, certificate-transparency logs, code hosts, breach-adjacent aggregators, and more) to collect email addresses, employee names, subdomains, and open ports associated with a domain. Many sources require an API key configured in its <code>api-keys.yaml</code> file.</p>
<pre><code class="language-bash">theHarvester -d &lt;domain&gt; -b duckduckgo -l 500                    # -b: source, -l: result limit
theHarvester -d &lt;domain&gt; -b crtsh,hackertarget,otx -f harvester-results   # -f: write results to file (json/xml)</code></pre>

<h3>Shodan &amp; Censys — internet-wide device/service exposure</h3>
<p><strong>Shodan</strong> and <strong>Censys</strong> continuously scan the public internet and index what they find — open ports, service banners, TLS certificates, geolocation. Querying either is passive from the tester's side: you're reading a database someone else already built, not scanning the target yourself.</p>
<pre><code class="language-bash"># Shodan — one-time setup, then query
shodan init &lt;YOUR_API_KEY&gt;
shodan host &lt;target-ip&gt;                        # full detail on one IP: ports, banners, org, geolocation
shodan search 'org:"&lt;Target Org&gt;" port:22'      # filtered search across Shodan's index
shodan count "hostname:&lt;domain&gt;"               # just the result count, no results consumed

# Censys — configure credentials once, then search the hosts or certificates index
censys config
censys search 'services.http.response.html_title: "&lt;title-string&gt;"'
censys search 'names: &lt;domain&gt;' --index-type certificates</code></pre>

<h3>Maltego — link analysis / visual OSINT</h3>
<p><strong>Maltego</strong> is a GUI link-analysis platform (no CLI) built around two concepts: <strong>entities</strong> (a domain, an IP, an email address, a person, an organization) and <strong>transforms</strong> (a query — built-in or from Maltego's Transform Hub — that turns one entity into a set of newly discovered, linked entities). Running transforms repeatedly builds an interactive graph: a domain entity transforms into its DNS records, which transform into IPs, which transform into a hosting org and any other domains sharing that same IP — surfacing relationships that are hard to see from flat tool output alone.</p>

<h3>recon-ng — a modular OSINT automation framework</h3>
<p><strong>recon-ng</strong> is structured like Metasploit but for reconnaissance: a console-driven framework where each installable module wraps one OSINT technique or source, and results are stored in a per-engagement workspace's local database so later modules can build on earlier ones.</p>
<pre><code class="language-bash">recon-ng
[recon-ng][default] &gt; workspaces create &lt;engagement-name&gt;
[recon-ng][engagement-name] &gt; marketplace install recon/domains-hosts/hackertarget
[recon-ng][engagement-name] &gt; modules load recon/domains-hosts/hackertarget
[recon-ng][engagement-name][hackertarget] &gt; options set SOURCE &lt;domain&gt;
[recon-ng][engagement-name][hackertarget] &gt; run
[recon-ng][engagement-name] &gt; show hosts</code></pre>

<h3>SpiderFoot — full OSINT automation &amp; correlation</h3>
<p><strong>SpiderFoot</strong> runs 200+ modules against a target and — its real value — automatically correlates the combined output to flag things a single module would miss on its own: typosquat domains, breach-exposed credentials, exposed cloud storage, leaked API keys, and more.</p>
<pre><code class="language-bash"># CLI scan mode: run a chosen module set and print correlated results as JSON
python3 sf.py -s &lt;domain&gt; -m sfp_dnsresolve,sfp_whois,sfp_crt -o json

# -u selects a use-case preset instead of naming modules individually
python3 sf.py -s &lt;domain&gt; -u passive -o json

# Or launch the web UI for a point-and-click, cross-referenced view
python3 sf.py -l 127.0.0.1:5001</code></pre>

<h3>exiftool — metadata leakage in published files</h3>
<p>PDFs, Office documents, and images routinely retain metadata their authors never intended to publish: usernames or author names (often revealing an internal naming convention like firstname.lastname), the software and version used to create the file, GPS coordinates embedded in photos, and revision history. <strong>exiftool</strong> reads (and can strip) all of it.</p>
<pre><code class="language-bash"># Dump every metadata field from a document harvested during recon
exiftool &lt;downloaded-file.pdf&gt;

# Look specifically for embedded GPS data in an image
exiftool -gps:all &lt;photo.jpg&gt;

# Bulk-scan every document collected so far for the fields that matter most
exiftool -r -author -software -createdate &lt;recon-downloads-directory&gt;/</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Worked Examples', html: `
<h3>Example 1 — A full passive-recon pass against an authorized/lab target</h3>
<p>Passive first, always: none of the steps below send a single request to the target's own infrastructure.</p>
<pre><code class="language-bash"># 1. Domain registration basics
whois &lt;domain&gt;

# 2. DNS shape from public resolvers (not the target's own name servers)
dig &lt;domain&gt; MX
dig &lt;domain&gt; TXT
dig &lt;domain&gt; NS

# 3. Passive subdomain discovery from multiple sources, then merge and dedupe
amass enum -passive -d &lt;domain&gt; -o amass-passive.txt
subfinder -d &lt;domain&gt; -all -o subfinder-passive.txt
cat amass-passive.txt subfinder-passive.txt | sort -u &gt; subdomains-passive.txt

# 4. Employee emails / names from search-indexed sources
theHarvester -d &lt;domain&gt; -b crtsh,hackertarget -l 500 -f harvester-out

# 5. Any public IPs discovered so far — check what's already indexed about them
shodan host &lt;discovered-ip&gt;

# 6. Any documents harvested along the way — check for leaked metadata
exiftool -r -author -software -createdate ./harvested-docs/</code></pre>
<p>The output of this pass — a domain, its DNS shape, a deduped subdomain list, a set of employee emails, and any metadata findings — <em>is</em> the recon deliverable: an asset inventory ready to hand to Scanning &amp; Enumeration, built without a single request touching the target's own systems.</p>

<h3>Example 2 — Escalating to active recon once it's explicitly in scope</h3>
<p>Only proceed past this point if active techniques are named in the Rules of Engagement (see Foundations, Ethics &amp; Legal).</p>
<pre><code class="language-bash"># 1. Test whether the target's own name servers will hand over the full zone
dnsrecon -d &lt;domain&gt; -t axfr
dig axfr &lt;domain&gt; @&lt;nameserver&gt;
# → if this succeeds, stop and flag it immediately: it's a serious, reportable
#   misconfiguration on its own, independent of anything found afterward

# 2. Confirm and extend the passive subdomain list with active brute-forcing
amass enum -active -brute -d &lt;domain&gt; -o amass-active.txt
fierce --domain &lt;domain&gt; --subdomain-file /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt

# 3. Merge every source gathered across both passes, passive and active
cat subdomains-passive.txt amass-active.txt | sort -u &gt; subdomains-final.txt

# 4. Log what ran, against what, and when — this record belongs in the report
echo "$(date -u): active recon (AXFR test, amass -active, fierce) run against &lt;domain&gt; per signed RoE" &gt;&gt; recon-log.txt</code></pre>
<p>Notice the sequencing again: passive sources are exhausted and merged first, active techniques are used only to confirm and fill gaps once explicitly authorized, and every active step gets logged — the same "verify before you touch anything" discipline from the lab-safety habit in Foundations, Ethics &amp; Legal, applied here to a live, in-scope target instead of a lab VM.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '⚠️ Defenses & Legal', html: `
<div class="callout danger">
  <div class="callout-title">⚠️ Authorization applies to recon too — not just exploitation</div>
  <p>It's tempting to treat recon as exempt from the module's core rule because so much of it is passive and "just public information." It isn't exempt. Run every technique in this topic only against your own assets, a lab target, or an engagement with explicit written authorization and an agreed scope — never against a real organization "just to practice," even when a step looks harmless. Active techniques (zone-transfer attempts, active subdomain brute-forcing, direct queries against a live target's own name servers) unambiguously touch someone else's infrastructure and must be named in scope before they're run.</p>
</div>

<h3>Attack-surface reduction — close what a recon pass would find</h3>
<ul>
  <li><strong>Maintain a living asset inventory</strong> of every domain, subdomain, and IP range the organization owns, and decommission what's no longer needed — a forgotten subdomain with a dangling CNAME pointing at a deprovisioned cloud resource is a classic subdomain-takeover risk, and it's exactly the kind of thing <code>amass</code>/<code>subfinder</code>/<code>sublist3r</code>/<code>assetfinder</code> will surface.</li>
  <li><strong>Harden DNS:</strong> restrict zone transfers (AXFR) to known secondary-name-server IPs only — a public-facing server that answers AXFR from anyone is handing out its entire internal DNS record set. Where practical, keep internal hostnames out of public zones entirely (split-horizon DNS).</li>
  <li><strong>Use registrar privacy/proxy protection on WHOIS records</strong> so registrant contact details aren't directly harvestable.</li>
  <li><strong>Publish a <code>security.txt</code> file</strong> (RFC 9116, served at <code>/.well-known/security.txt</code>) pointing researchers to a proper vulnerability-disclosure channel — it gives them a legitimate path instead of digging through the GHDB or social engineering to find a contact.</li>
</ul>

<h3>OSINT hygiene — reduce what people and files leak</h3>
<ul>
  <li><strong>Strip metadata before publishing anything externally</strong> — the defensive flip side of exiftool from Mechanics: <code>exiftool -all= &lt;file&gt;</code> before a document or image goes on the public site or in a public repo.</li>
  <li><strong>Limit what employees and job postings overshare</strong> — detailed org charts, internal tool names, and exact tech-stack versions on LinkedIn, résumés, or conference talks are exactly the kind of material Maltego link-analysis and <code>theHarvester</code> thrive on.</li>
  <li><strong>Monitor your own footprint proactively</strong> — periodically run Shodan/Censys queries against your own ASN or organization name to catch an exposed service before an attacker's recon does, and periodically self-dork your own domain (GHDB-style queries) to catch accidentally indexed sensitive files.</li>
  <li><strong>Consider canary/honeytoken assets</strong> — some organizations seed decoy subdomains or documents specifically so that any interaction with them signals someone is actively probing the environment.</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'cheat-sheet', title: '📋 Cheat Sheet', html: `
<table>
  <thead><tr><th>Tool</th><th>Purpose</th><th>Typical usage</th></tr></thead>
  <tbody>
    <tr><td>whois</td><td>Domain registration data (registrar, dates, name servers)</td><td><code>whois &lt;domain&gt;</code></td></tr>
    <tr><td>dig / nslookup</td><td>Query individual DNS record types</td><td><code>dig &lt;domain&gt; MX</code> / <code>nslookup -type=NS &lt;domain&gt;</code></td></tr>
    <tr><td>AXFR (via dig / dnsrecon)</td><td>Test whether a name server will hand over the whole DNS zone</td><td><code>dig axfr &lt;domain&gt; @&lt;nameserver&gt;</code></td></tr>
    <tr><td>dnsrecon</td><td>Full DNS sweep + zone-transfer test + brute force</td><td><code>dnsrecon -d &lt;domain&gt; -t axfr</code></td></tr>
    <tr><td>dnsenum</td><td>DNS enumeration + wordlist-based subdomain brute force</td><td><code>dnsenum --enum -f &lt;wordlist&gt; &lt;domain&gt;</code></td></tr>
    <tr><td>fierce</td><td>Lightweight DNS recon; precursor to port scanning</td><td><code>fierce --domain &lt;domain&gt;</code></td></tr>
    <tr><td>amass</td><td>Subdomain enumeration — passive (80+ sources) or active (brute force)</td><td><code>amass enum -passive -d &lt;domain&gt;</code></td></tr>
    <tr><td>subfinder</td><td>Fast, passive subdomain discovery</td><td><code>subfinder -d &lt;domain&gt; -all</code></td></tr>
    <tr><td>sublist3r</td><td>Subdomain enumeration via search engines + optional brute force</td><td><code>python3 sublist3r.py -d &lt;domain&gt; -b</code></td></tr>
    <tr><td>assetfinder</td><td>Find domains/subdomains related to a target</td><td><code>assetfinder --subs-only &lt;domain&gt;</code></td></tr>
    <tr><td>Google dorking / GHDB</td><td>Surface indexed files/panels/errors via search operators</td><td><code>site:&lt;domain&gt; filetype:pdf</code></td></tr>
    <tr><td>theHarvester</td><td>Emails, employee names, subdomains from search/OSINT sources</td><td><code>theHarvester -d &lt;domain&gt; -b duckduckgo -l 500</code></td></tr>
    <tr><td>Shodan</td><td>Search a pre-built index of internet-wide scanned devices/services</td><td><code>shodan host &lt;ip&gt;</code></td></tr>
    <tr><td>Censys</td><td>Search internet-wide hosts/certificates index</td><td><code>censys search 'names: &lt;domain&gt;' --index-type certificates</code></td></tr>
    <tr><td>Maltego</td><td>Visual link analysis across entities (domains, IPs, people, orgs)</td><td>GUI: run transforms on an entity to expand its graph</td></tr>
    <tr><td>recon-ng</td><td>Modular OSINT automation framework (Metasploit-like)</td><td><code>modules load recon/domains-hosts/hackertarget</code> → <code>run</code></td></tr>
    <tr><td>SpiderFoot</td><td>Automated OSINT across 200+ modules with correlation</td><td><code>python3 sf.py -s &lt;domain&gt; -u passive -o json</code></td></tr>
    <tr><td>exiftool</td><td>Read (or strip) metadata from documents/images</td><td><code>exiftool &lt;file&gt;</code> / <code>exiftool -all= &lt;file&gt;</code></td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">What's the difference between passive and active reconnaissance?</div>
<div class="qa-a">
<p>Passive recon draws entirely from third-party or public sources — WHOIS registries, search engines, Shodan/Censys's pre-built scan databases — and never sends a request to the target's own infrastructure, so it's effectively undetectable by the target. Active recon queries the target's own systems directly — direct DNS queries against their name servers, zone-transfer attempts, active subdomain brute-forcing — and can appear in the target's own logs. A disciplined recon phase exhausts passive sources first, then uses active techniques only where necessary and only when they're explicitly within the engagement's authorized scope.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What is a DNS zone transfer (AXFR), and why is a successful one a serious finding?</div>
<div class="qa-a">
<p>A zone transfer is the mechanism a primary DNS server uses to replicate an entire zone's records to its secondary servers. Correctly configured DNS restricts who can request this to known secondary-server IPs only. If a public-facing name server answers an AXFR request from anyone — testable directly with <code>dig axfr &lt;domain&gt; @&lt;nameserver&gt;</code>, or automated across every listed NS with <code>dnsrecon -d &lt;domain&gt; -t axfr</code> — it hands over the organization's complete internal DNS record set, including hostnames and internal IPs that were never meant to be public, in a single unauthenticated request. That combination of ease and impact is why it's still routinely tested for and reported as a real misconfiguration when found.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">How would you enumerate subdomains for an authorized target, and why use more than one tool?</div>
<div class="qa-a">
<p>Start passive: tools like <code>amass enum -passive</code> and <code>subfinder</code> query dozens of third-party sources without touching the target directly. <code>sublist3r</code> and <code>assetfinder</code> add further, differently-sourced coverage. No single tool has complete coverage of every certificate-transparency log, search index, and passive-DNS dataset out there, so the same subdomain routinely appears from one tool and is missed by another — merging and de-duplicating (<code>sort -u</code> across all the outputs) is a normal, expected part of the workflow, not an afterthought. Only if active techniques are explicitly in scope would a brute-force pass — <code>amass enum -active -brute</code>, or <code>fierce</code> — be added to fill in what passive sources missed.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What is Google dorking / the GHDB, and what can it expose?</div>
<div class="qa-a">
<p>Google dorking uses search-engine operators — <code>site:</code>, <code>filetype:</code>/<code>ext:</code>, <code>intitle:</code>, <code>inurl:</code>, <code>intext:</code> — to surface content that's already been indexed but was never meant to be publicly found: exposed configuration or log files (<code>site:&lt;domain&gt; ext:env</code>), open directory listings (<code>intitle:"index of"</code>), or admin panels (<code>inurl:admin</code>). The GHDB (Google Hacking Database), maintained via Exploit-DB, is a curated, categorized library of these dork queries contributed by the security community, organized by what kind of exposure each one tends to find.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Where does reconnaissance sit in MITRE ATT&amp;CK, and why isn't it "Discovery"?</div>
<div class="qa-a">
<p>Reconnaissance is its own dedicated tactic, TA0043 — techniques an adversary uses to gather information before, or without, gaining any access at all: things like WHOIS/DNS lookups, searching open technical databases (T1596, which is where Shodan/Censys-style scan-database lookups fit), and gathering victim identity or org information. Discovery (TA0007) is a different, later tactic entirely — it covers techniques used <em>after</em> a compromise, from inside an already-compromised host, to learn about the internal environment the attacker has landed in. The names sound similar, but they describe opposite ends of an engagement: Reconnaissance happens with zero access, Discovery happens after access has already been gained.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between querying Shodan/Censys and running your own scan against a target?</div>
<div class="qa-a">
<p>Shodan and Censys continuously scan the public internet themselves and index what they find — open ports, service banners, TLS certificates, geolocation — so querying either one is passive from the tester's side: you're reading a database someone else already built, and the target sees no traffic from you at all. Running your own scan (covered in the next topic, Scanning &amp; Enumeration) sends live probes directly to the target's hosts, is active, and will appear in the target's own logs. Shodan/Censys data can also be stale — a service the index shows as open might have since changed — so a pentest typically uses it to build an initial hypothesis about exposure, then confirms it with an authorized active scan.</p>
</div>
</div>
`}

]});
