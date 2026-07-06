window.PREP_SITE.registerTopic({
  id: 'eh-vuln',
  module: 'eh',
  title: 'Vulnerability Assessment',
  estimatedReadTime: '27 min',
  tags: ['ethical-hacking', 'security', 'vulnerability-assessment', 'cvss', 'scanning', 'nessus', 'openvas'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<div class="callout danger">
  <div class="callout-title">⚠️ Same rule as every other topic in this module</div>
  <p>Everything below — running Nessus, OpenVAS, Nikto, nuclei, or wpscan against a target — is <strong>active scanning</strong>. It sends real traffic that can be logged, alerted on, and in rare cases can destabilize a fragile service. It requires the same <strong>explicit, written, in-scope authorization</strong> covered in Foundations, Ethics &amp; Legal before it touches anything other than your own lab. "It's just a scan, not an exploit" is not a legal defense.</p>
</div>
<p><strong>Vulnerability assessment</strong> is the phase where you take the live hosts, open ports, and running services found during Scanning &amp; Enumeration and answer a much sharper question for each one: <em>which of the known, publicly-documented weaknesses (CVEs) does this specific version of this specific service have, and how severe is each one?</em> It's largely automated and aims for <strong>coverage</strong> — scan everything in scope and produce a prioritized list — rather than the narrow, manual, prove-it-with-exploitation depth of a penetration test.</p>
<ul>
  <li><strong>Scanners do the matching, you do the thinking.</strong> Tools like Nessus, OpenVAS/GVM, Nikto, nuclei, and wpscan fingerprint software and versions, then match what they find against databases of known vulnerabilities (CVEs) — but every scanner produces false positives, so every finding still needs human triage before it's trusted.</li>
  <li><strong>Severity is scored, not guessed.</strong> <strong>CVSS</strong> (Common Vulnerability Scoring System) turns a vulnerability's characteristics into a reproducible 0.0–10.0 score and a qualitative rating (None/Low/Medium/High/Critical). Knowing the Base, Temporal/Threat, and Environmental metric groups — and that CVSS v4.0 (2023) coexists with the still-dominant v3.1 — is core interview material.</li>
  <li><strong>A CVE is an identifier, not a score.</strong> <strong>CVE</strong> (Common Vulnerabilities and Exposures) is MITRE's naming scheme for a specific, publicly disclosed flaw (e.g. <code>CVE-2021-44228</code>, Log4Shell). The <strong>NVD</strong> (National Vulnerability Database, run by NIST) enriches each CVE with a CVSS score, affected software (CPE), and weakness type (CWE). <code>searchsploit</code> then answers the follow-up question a pentester actually cares about: does a working, weaponized exploit already exist for it on Exploit-DB?</li>
  <li><strong>Authenticated beats unauthenticated, almost always.</strong> Logging into a host with real (read-only, scoped) credentials during a scan gets you an accurate installed-software/patch-level inventory instead of a guess based on a banner string — dramatically fewer false positives and false negatives, at the cost of needing credentials the client trusts you with.</li>
  <li><strong>This topic feeds directly into the exploitation-focused topics that follow it</strong> (Web, Network, Wireless, Passwords, Exploitation/Metasploit, Active Directory) — a vulnerability assessment produces the candidate list; those topics are where a subset actually gets exploited to prove real-world impact.</li>
</ul>
<p><strong>Mantra:</strong> "The scanner finds candidates, CVSS ranks them, searchsploit tells you if a weapon already exists — and a human still has to confirm it's real before it goes in a report."</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Where this sits in the lifecycle</h3>
<p>Recall from Mental Model in Foundations, Ethics &amp; Legal that PTES folds "Vulnerability Analysis" into the same broad stage as scanning and enumeration. In practice, most real engagements — and this module — still treat it as its own distinct step with its own tools and its own deliverable: <strong>Scanning &amp; Enumeration</strong> answers "what's alive, and what's listening?" (hosts, ports, service banners, versions); <strong>Vulnerability Assessment</strong> takes those service/version fingerprints and answers "which of the thousands of publicly known CVEs actually apply here, and how bad is each one?"</p>

<h3>Vulnerability assessment vs. penetration test, again — the concrete difference</h3>
<p>Foundations, Ethics &amp; Legal already drew this distinction at a conceptual level; here's what it looks like in practice:</p>
<table>
  <thead><tr><th></th><th>Vulnerability Assessment</th><th>Penetration Test</th></tr></thead>
  <tbody>
    <tr><td>Goal</td><td>Breadth — list every known weakness across the whole in-scope environment</td><td>Depth — prove real-world impact on specific targets by actually exploiting them</td></tr>
    <tr><td>How</td><td>Mostly automated (scanner-driven): Nessus/OpenVAS/Nikto/nuclei/wpscan</td><td>Mostly manual: chaining findings, custom exploitation, privilege escalation</td></tr>
    <tr><td>Output</td><td>A ranked list of findings with CVSS scores, largely unverified</td><td>Confirmed, reproducible proof-of-concept exploitation with real impact</td></tr>
    <tr><td>Cadence</td><td>Frequent — weekly/monthly/quarterly, often continuous</td><td>Periodic — annually, or after major changes, per compliance requirements</td></tr>
  </tbody>
</table>
<p>Neither replaces the other. A vulnerability assessment is cheap to run often and gives coverage; a pentest is expensive to run but proves whether a finding is actually reachable and dangerous in context. Most mature security programs run both, on different cadences.</p>

<h3>Why this discipline exists at all: too many CVEs, too little time</h3>
<p>Tens of thousands of new CVEs are published every year across the software an average organization runs. No security team can manually research every one of them against every asset they own. Vulnerability assessment tooling exists to do that matching automatically, at scale, continuously — turning "somewhere in our estate, some version of some software has some known flaw" into a concrete, prioritized, actionable list.</p>

<h3>The core data sources this whole topic is built on</h3>
<ul>
  <li><strong>CVE (Common Vulnerabilities and Exposures)</strong> — a MITRE-maintained naming scheme; each entry is a unique identifier (<code>CVE-YYYY-NNNNN</code>) for one specific, publicly disclosed vulnerability, with a short description. CVE itself doesn't carry a severity score.</li>
  <li><strong>NVD (National Vulnerability Database)</strong> — NIST's US-government-run database that <em>enriches</em> each CVE: a CVSS score, the affected software expressed as <strong>CPE</strong> (Common Platform Enumeration) identifiers, and the underlying flaw category expressed as <strong>CWE</strong> (Common Weakness Enumeration, e.g. CWE-89 for SQL injection).</li>
  <li><strong>Exploit-DB / <code>searchsploit</code></strong> — a public archive of proof-of-concept and weaponized exploit code, searchable offline via the <code>searchsploit</code> CLI; answers the practical question "does someone already have working exploit code for this CVE?"</li>
</ul>
<p>Every scanner covered in this topic ultimately builds on top of this same data: fingerprint a service/version → look up which CVEs apply to that CPE → report the associated CVSS score → optionally point at a known exploit.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The vulnerability assessment pipeline</h3>
<pre><code class="language-text">Assets in scope  →  Scanner engine        →  Match against          →  Findings           →  Triage             →  Report
(from Scanning &     (Nessus / OpenVAS /       known-vuln databases      (CVE + CVSS           (confirm real vs.     (prioritized,
 Enumeration:         Nikto / nuclei /          — plugins / NVTs /        score per             false positive;       ranked by
 hosts, ports,        wpscan)                   templates, backed         host+service)         check exploit         severity +
 service banners,                               by CVE/NVD data)                                availability via      exploitability)
 versions)                                                                                       searchsploit/NVD)
</code></pre>
<p>Everything in Mechanics below — every tool, every flag, every CVSS metric — is a piece of this one pipeline. The scanner engine differs by target type (network services → Nessus/OpenVAS; web servers → Nikto; web apps/APIs → nuclei; WordPress specifically → wpscan), but the shape of the pipeline is identical every time.</p>

<h3>Authenticated vs. unauthenticated scanning: the single biggest mental fork in this topic</h3>
<table>
  <thead><tr><th></th><th>Unauthenticated (network) scan</th><th>Authenticated (credentialed) scan</th></tr></thead>
  <tbody>
    <tr><td>What it sees</td><td>Only what's visible from outside: open ports, service banners, response fingerprints</td><td>Actual installed packages, exact patch levels, local misconfigurations, registry/config state</td></tr>
    <tr><td>Access needed</td><td>None — just network reachability to the target</td><td>Valid credentials on the target (SSH key/password for *nix, a domain or local account for Windows via SMB/WinRM)</td></tr>
    <tr><td>Accuracy</td><td>Lower — versions are often inferred/guessed from banners, which produces more false positives <em>and</em> false negatives (a patched service can still show an old banner)</td><td>Much higher — the scanner asks the OS's own package manager or registry what's actually installed</td></tr>
    <tr><td>Realism</td><td>Simulates what an external attacker with no foothold sees</td><td>Simulates what a compliance auditor, or an attacker who already has a foothold, sees</td></tr>
  </tbody>
</table>
<p>This maps directly onto the black-box/grey-box/white-box spectrum from Foundations, Ethics &amp; Legal — unauthenticated scanning is the black-box end, authenticated scanning moves toward grey/white-box. Most mature vulnerability-management programs run authenticated scans wherever they can get credentials approved, precisely because the accuracy gain is so large.</p>

<h3>CVSS in one picture: three metric groups, one score</h3>
<pre><code class="language-text">Base            (always scored — intrinsic, unchanging severity of the flaw itself:
                  how is it reached, how hard is it, what does it cost the victim)
   +
Temporal/Threat (optional — does exploit code exist and how mature is it, right now)
   +
Environmental   (optional — how much does *this* organization's context change the risk:
                  is this asset business-critical, is there a compensating control)
   =
Final CVSS score (0.0–10.0) + qualitative rating (None/Low/Medium/High/Critical)
</code></pre>
<p>A single CVE has exactly one NVD-published <strong>Base</strong> score (intrinsic to the flaw, never changes). Temporal/Threat and Environmental scoring are optional refinements — an organization scoring a CVE for its own risk register should almost always layer Environmental metrics on top of the NVD Base score rather than treating the Base score alone as "the" risk to their business. The full metric-by-metric breakdown is in Mechanics.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Scanners, CVSS Scoring & Exploit Lookup', html: `
<h3>Nessus (Tenable) — the industry-standard commercial scanner</h3>
<p>Nessus is primarily driven from a web UI or its REST API, not interactively from the command line — it ships pre-built scan <strong>policies</strong> (templates like "Basic Network Scan," "Advanced Scan," "Credentialed Patch Audit," and dedicated web-app policies), each of which runs a selected set of <strong>plugins</strong> (checks written in Tenable's NASL — Nessus Attack Scripting Language). A free, capability-limited edition ("Nessus Essentials") exists for personal/lab use — check Tenable's current terms, since the free-tier IP/scan limits have changed more than once. Automating Nessus (e.g. from CI, or a script) goes through its REST API:</p>
<pre><code class="language-bash"># Authenticate against the Nessus server (default HTTPS port 8834) and get a session token
curl -k -X POST https://&lt;nessus-host&gt;:8834/session \\
  -H "Content-Type: application/json" \\
  -d '{"username": "&lt;user&gt;", "password": "&lt;pass&gt;"}'

# Launch a scan that was already configured (targets, policy, credentials) via the UI
curl -k -X POST https://&lt;nessus-host&gt;:8834/scans/&lt;scan_id&gt;/launch \\
  -H "X-Cookie: token=&lt;session_token&gt;"

# Poll scan status / pull results once it finishes
curl -k https://&lt;nessus-host&gt;:8834/scans/&lt;scan_id&gt; \\
  -H "X-Cookie: token=&lt;session_token&gt;"</code></pre>
<p>Every Nessus finding is a plugin output, and every plugin output is tagged with the CVE(s) it corresponds to and a CVSS score — this is the direct link between "scanner output" and the CVSS scoring covered later in this section.</p>

<h3>OpenVAS / GVM (Greenbone Vulnerability Management) — the open-source equivalent</h3>
<p>OpenVAS is the scanning engine; <strong>GVM</strong> is the full open-source stack around it (gvmd the manager daemon, gsad the web UI, and a feed of <strong>NVTs</strong> — Network Vulnerability Tests, GVM's equivalent of Nessus plugins). Like Nessus, day-to-day use is normally through the web UI, but <code>gvm-cli</code> drives it over <strong>GMP</strong> (the Greenbone Management Protocol) for automation:</p>
<pre><code class="language-bash"># List existing scan tasks over the local GMP socket
sudo -u _gvm gvm-cli --gmp-username admin --gmp-password &lt;password&gt; \\
  socket --socketpath /run/gvmd/gvmd.sock --xml "&lt;get_tasks/&gt;"

# Start a previously configured task (target + scan config already set up in the UI)
sudo -u _gvm gvm-cli --gmp-username admin --gmp-password &lt;password&gt; \\
  socket --socketpath /run/gvmd/gvmd.sock --xml "&lt;start_task task_id='&lt;task-uuid&gt;'/&gt;"</code></pre>
<p>Being fully open-source, GVM is the natural free choice for a home lab — pair it with Metasploitable or DVWA from Foundations, Ethics &amp; Legal to see real, scored CVE findings without needing a Nessus license.</p>

<h3>Nikto — fast, focused web-server scanner</h3>
<p>Nikto (a Perl script) checks a web <em>server</em> specifically: outdated server software and known-vulnerable versions, dangerous/default files and scripts left on the server, misconfigurations, and missing security headers. It's much narrower than Nessus/OpenVAS but far faster to run against a single web server:</p>
<pre><code class="language-bash"># Basic scan against a host (defaults to port 80 if none given)
nikto -h http://&lt;target&gt;

# Explicit HTTPS on a non-standard port, save an HTML report
nikto -h &lt;target&gt; -p 443 -ssl -o report.html -Format htm

# Restrict checks to specific tuning categories — e.g. 4 = XSS/script injection, 9 = SQL injection
nikto -h &lt;target&gt; -Tuning 49</code></pre>

<h3>nuclei (ProjectDiscovery) — fast, template-driven vulnerability scanning</h3>
<p>nuclei runs community-maintained YAML <strong>templates</strong> — each template encodes one specific check (a CVE, a misconfiguration, an exposed panel, a default credential) — against one or many targets, and is popular precisely because new CVE templates are published within hours of a public disclosure:</p>
<pre><code class="language-bash"># Scan a single URL with the full default community template set
nuclei -u https://&lt;target&gt;

# Only run critical/high-severity templates, write matches to a file
nuclei -u https://&lt;target&gt; -severity critical,high -o findings.txt

# Scan a list of hosts against just the CVE template category
nuclei -l targets.txt -t cves/ -o cve-findings.txt</code></pre>

<h3>wpscan — the WordPress specialist</h3>
<p>Roughly 40% of all websites run WordPress, which is exactly why it gets a dedicated scanner: wpscan fingerprints the WordPress core version, active theme, and installed plugins, then cross-references them against the WPScan Vulnerability Database:</p>
<pre><code class="language-bash"># Baseline scan: WP version, theme, readme/config leaks, basic checks
wpscan --url https://&lt;target&gt;

# Enumerate vulnerable plugins/themes and usernames, pulling CVE data
# with a free WPScan API token (register at wpscan.com)
wpscan --url https://&lt;target&gt; --enumerate vp,vt,u --api-token &lt;token&gt;</code></pre>
<p>The credential brute-force options (<code>--passwords</code>/<code>--usernames</code>) exist too, but — as with any brute-force technique covered later in Passwords — treat them as a separate, higher-impact, explicitly-authorized action, not something bundled quietly into a routine scan.</p>

<h3>searchsploit + Exploit-DB, and NVD lookups</h3>
<pre><code class="language-bash"># Offline keyword search against the local Exploit-DB mirror
searchsploit wordpress 5.8

# Search directly by CVE identifier — the natural handoff from a scanner's CVE tag
searchsploit --cve 2021-44228

# Show the full local path to a specific result, then copy it out for review
searchsploit -p 50592
searchsploit -m 50592

# Pull the NVD's own enrichment data for a CVE via its public REST API
curl "https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=CVE-2021-44228"</code></pre>
<p>The handoff every finding should go through: scanner reports a CVE → check NVD (or the scanner's own report) for the CVSS score → run <code>searchsploit --cve &lt;id&gt;</code> to see whether ready-made exploit code exists. A finding with a working public exploit and no patch is a very different priority than one with a high CVSS score but no known working exploit anywhere.</p>

<h3>CVSS v3.1 — Base, Temporal, and Environmental metrics, in full</h3>
<p>A CVSS v3.1 vector string looks like <code>CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H</code> — that particular example (network-reachable, low complexity, no privileges or user interaction needed, full confidentiality/integrity/availability impact) scores 9.8, Critical.</p>
<table>
  <thead><tr><th>Group</th><th>Metric</th><th>Abbrev.</th><th>Possible values</th></tr></thead>
  <tbody>
    <tr><td rowspan="8">Base <em>(always scored — intrinsic to the flaw)</em></td><td>Attack Vector</td><td>AV</td><td>Network (N) / Adjacent (A) / Local (L) / Physical (P)</td></tr>
    <tr><td>Attack Complexity</td><td>AC</td><td>Low (L) / High (H)</td></tr>
    <tr><td>Privileges Required</td><td>PR</td><td>None (N) / Low (L) / High (H)</td></tr>
    <tr><td>User Interaction</td><td>UI</td><td>None (N) / Required (R)</td></tr>
    <tr><td>Scope</td><td>S</td><td>Unchanged (U) / Changed (C) — does the exploited component impact resources beyond its own security scope</td></tr>
    <tr><td>Confidentiality Impact</td><td>C</td><td>None (N) / Low (L) / High (H)</td></tr>
    <tr><td>Integrity Impact</td><td>I</td><td>None (N) / Low (L) / High (H)</td></tr>
    <tr><td>Availability Impact</td><td>A</td><td>None (N) / Low (L) / High (H)</td></tr>
    <tr><td rowspan="3">Temporal <em>(optional — changes as exploit landscape evolves)</em></td><td>Exploit Code Maturity</td><td>E</td><td>Not Defined (X) / High (H) / Functional (F) / Proof-of-Concept (P) / Unproven (U)</td></tr>
    <tr><td>Remediation Level</td><td>RL</td><td>Not Defined (X) / Unavailable (U) / Workaround (W) / Temporary Fix (T) / Official Fix (O)</td></tr>
    <tr><td>Report Confidence</td><td>RC</td><td>Not Defined (X) / Confirmed (C) / Reasonable (R) / Unknown (U)</td></tr>
    <tr><td rowspan="2">Environmental <em>(optional — this organization's specific context)</em></td><td>Security Requirements</td><td>CR / IR / AR</td><td>Confidentiality/Integrity/Availability Requirement — Not Defined (X) / Low / Medium / High, based on how critical that property is for this asset</td></tr>
    <tr><td>Modified Base Metrics</td><td>MAV, MAC, MPR, MUI, MS, MC, MI, MA</td><td>Re-scores any Base metric for this environment (e.g. a compensating network control lowers MAV)</td></tr>
  </tbody>
</table>

<h3>CVSS v4.0 (published November 2023) — what actually changed</h3>
<p>CVSS v3.1 is still the version you'll see attached to most CVEs today, but v4.0 exists and is increasingly used — know both. v4.0 restructures the metric groups rather than just tweaking values:</p>
<table>
  <thead><tr><th>Change</th><th>v3.1</th><th>v4.0</th></tr></thead>
  <tbody>
    <tr><td>Scope</td><td>Single "Scope" (S) metric: Unchanged/Changed</td><td>Removed. Replaced by two separate 3-metric impact groups: <strong>Vulnerable System</strong> (VC/VI/VA) and <strong>Subsequent System</strong> (SC/SI/SA) impact — a more precise replacement for Scope</td></tr>
    <tr><td>Attack complexity granularity</td><td>Attack Complexity (AC) only</td><td>Adds <strong>Attack Requirements (AT)</strong>: None (N) / Present (P) — captures preconditions like a race condition or needing to be on-path (MITM)</td></tr>
    <tr><td>User Interaction detail</td><td>UI: None (N) / Required (R) — two values</td><td>UI: <strong>None (N) / Passive (P) / Active (A)</strong> — three values, distinguishing routine/involuntary interaction (Passive) from deliberate, conscious interaction (Active)</td></tr>
    <tr><td>Temporal group</td><td>E, RL, RC (three metrics)</td><td>Replaced by a single <strong>Threat</strong> metric, Exploit Maturity (E): Attacked (A) / POC (P) / Unreported (U) / Not Defined (X)</td></tr>
    <tr><td>Supplemental metrics</td><td>Did not exist</td><td>New, informational-only group (doesn't change the numeric score): Safety, Automatable, Recovery, Value Density, Vulnerability Response Effort, Provider Urgency</td></tr>
    <tr><td>Score nomenclature</td><td>Usually just "the CVSS score"</td><td>Explicit labels for which groups were used: <strong>CVSS-B</strong> (Base only), <strong>CVSS-BT</strong> (+Threat), <strong>CVSS-BE</strong> (+Environmental), <strong>CVSS-BTE</strong> (all three)</td></tr>
    <tr><td>Vector prefix</td><td><code>CVSS:3.1/...</code></td><td><code>CVSS:4.0/...</code></td></tr>
  </tbody>
</table>

<h3>The qualitative severity rating scale (v3.x and v4.0 share this scale)</h3>
<table>
  <thead><tr><th>Score range</th><th>Rating</th></tr></thead>
  <tbody>
    <tr><td>0.0</td><td>None</td></tr>
    <tr><td>0.1 – 3.9</td><td>Low</td></tr>
    <tr><td>4.0 – 6.9</td><td>Medium</td></tr>
    <tr><td>7.0 – 8.9</td><td>High</td></tr>
    <tr><td>9.0 – 10.0</td><td>Critical</td></tr>
  </tbody>
</table>

<h3>False positives (and false negatives) — the triage step every finding must pass</h3>
<p>Scanners infer a lot from imperfect signals (a service banner claiming a version that a sysadmin backported a patch into without changing; a plugin that fires on a generic error page; an authenticated check that misreads a nonstandard install path). A <strong>false positive</strong> is a reported finding that isn't actually exploitable or present; a <strong>false negative</strong> — arguably worse, and much harder to notice — is a real vulnerability the scanner simply missed (common with unauthenticated scanning against hardened banners). Standard triage practice before anything goes in a report: manually verify the specific version/config on the host where feasible, prefer authenticated results over unauthenticated ones when they disagree, and never forward raw, unverified scanner output as a "finding" — that's the difference between a vulnerability assessment and just running a tool.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Worked Examples', html: `
<h3>Example 1 — Authenticated scan → CVE → CVSS → exploit-availability chain</h3>
<p>Walking one finding through the entire pipeline from Mental Model, end to end, against a lab target (e.g. Metasploitable 2 on the isolated host-only network from Foundations, Ethics &amp; Legal):</p>
<pre><code class="language-bash"># 1. Kick off an authenticated (credentialed) scan in OpenVAS/GVM — credentials
#    let it read the actual installed package versions rather than guess from banners.
sudo -u _gvm gvm-cli --gmp-username admin --gmp-password &lt;password&gt; \\
  socket --socketpath /run/gvmd/gvmd.sock --xml "&lt;start_task task_id='&lt;task-uuid&gt;'/&gt;"

# 2. Once complete, the report lists a finding, e.g.:
#      Host: 192.168.56.102   Service: vsftpd 2.3.4 (port 21)
#      CVE-2011-2523   CVSS v3.1 Base: 9.8 (Critical)
#      Vector: CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H

# 3. Confirm the CVE and its score independently via the NVD API (don't just trust
#    one tool's plugin output):
curl "https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=CVE-2011-2523"

# 4. Check whether a ready-made exploit exists for it — this is what turns a
#    "known vulnerability" into "actually exploitable, right now, with low effort":
searchsploit --cve 2011-2523
# → returns "VSFTPD v2.3.4 - Backdoor Command Execution", confirming a public,
#   weaponized exploit is already available on Exploit-DB.</code></pre>
<p>Notice the shape: the scanner produced a CVE and a CVSS score, NVD independently corroborated both, and <code>searchsploit</code> answered the question a pentester actually needs answered before deciding what to prioritize next — this exact finding (CVE-2011-2523, the intentionally-backdoored vsftpd in Metasploitable 2) is the standard first "real" exploitation walkthrough later in the module's Exploitation topic.</p>

<h3>Example 2 — Web-app scan with nuclei + wpscan, and reading the CVSS vector by hand</h3>
<pre><code class="language-bash"># 1. Broad, fast template-driven scan of a lab web app for known CVEs and misconfigs
nuclei -u http://&lt;target&gt; -severity critical,high,medium -o nuclei-findings.txt

# 2. If the target turns out to be running WordPress, follow up with the specialist:
wpscan --url http://&lt;target&gt; --enumerate vp,vt,u --api-token &lt;token&gt;
# → e.g. reports a vulnerable plugin version with an associated CVE and CVSS vector:
#      CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:N</code></pre>
<p>Reading that vector by hand, metric by metric, using the Base table from Mechanics: <strong>AV:N</strong> — reachable over the network, no physical/local access needed. <strong>AC:L</strong> — no special conditions, straightforward to exploit. <strong>PR:N</strong> — no account needed on the target. <strong>UI:N</strong> — no victim has to click or open anything. <strong>S:C</strong> — Scope Changed, meaning the exploited plugin can impact resources outside its own security scope (e.g. the whole WordPress install, not just the plugin's own sandbox) — this is exactly the kind of cross-component impact that CVSS v4.0's split into Vulnerable/Subsequent System impact was designed to describe more precisely. <strong>C:H / I:H / A:N</strong> — full confidentiality and integrity impact, no availability impact. Being able to read a vector like this without a calculator, and explain in plain English what each letter means, is a very common interview check.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '⚠️ Defenses & Legal', html: `
<div class="callout danger">
  <div class="callout-title">⚠️ Scanning is access — it still needs authorization</div>
  <p>Running a vulnerability scanner against a system is exactly the kind of "access" the CFAA and its international equivalents (covered in Foundations, Ethics &amp; Legal) criminalize when done without authorization — even though nothing is "exploited," and even when the intent is purely defensive research. Only scan systems you own, or that you have explicit written, in-scope authorization to scan. Real engagements typically get the scanning source IP(s) allow-listed with the client's security/SOC team in advance, precisely so a legitimate authorized scan doesn't get mistaken for an attack and trigger an unnecessary incident response.</p>
</div>

<h3>Patch and vulnerability management: what happens after the report</h3>
<p>A vulnerability assessment's real value is realized in what happens next — the defensive lifecycle it feeds:</p>
<ul>
  <li><strong>Identify</strong> — the scan itself (this topic).</li>
  <li><strong>Prioritize</strong> — rank findings by more than raw CVSS alone: business criticality of the affected asset, exploit availability (searchsploit / Exploit-DB, as above), and increasingly by <strong>EPSS</strong> (the Exploit Prediction Scoring System, from FIRST.org — a probabilistic 0–1 score estimating the likelihood a CVE will actually be exploited in the wild in the next 30 days) and the <strong>CISA KEV catalog</strong> (the US Cybersecurity and Infrastructure Security Agency's living list of vulnerabilities confirmed to be actively exploited — a CVSS 9.8 with no real-world exploitation evidence and no KEV listing is a very different priority from a CVSS 7.5 that <em>is</em> on the KEV list).</li>
  <li><strong>Remediate</strong> — apply the vendor patch where one exists; where it doesn't (yet), apply a <strong>compensating control</strong> instead — a WAF rule blocking the specific attack pattern, a firewall rule restricting reachability, disabling the vulnerable feature/service entirely — anything that meaningfully reduces the actual risk until a real fix ships.</li>
  <li><strong>Verify</strong> — re-scan (or re-check) the specific finding to confirm the patch or control actually closed it, rather than assuming it did.</li>
  <li><strong>Repeat, continuously</strong> — new CVEs publish constantly, so this isn't a one-time project; it's a standing operational loop, which is exactly why vulnerability assessment tooling runs on a schedule rather than as a one-off.</li>
</ul>
<p>Many compliance frameworks encode explicit timeliness expectations for this loop (e.g. PCI-DSS ties patch timelines to severity), which is part of why the "prioritize" step needs to be defensible, not just "highest CVSS first."</p>

<h3>Scan safety: aggressive scanning can cause real harm</h3>
<p>Recall the CIA triad's <strong>Availability</strong> leg from Foundations, Ethics &amp; Legal — vulnerability scanning is one of the more common ways a well-intentioned authorized test accidentally causes an outage. Deep/aggressive scans (high-concurrency nuclei runs, wpscan's <code>--passwords</code> brute-force mode, broad Nikto tuning against a fragile app, unauthenticated fuzzing) have crashed production services, and legacy or embedded systems (older network appliances, printers, ICS/SCADA equipment) are especially fragile against traffic they were never tested to handle. Standard precautions, and things a Rules of Engagement document should explicitly cover for a vulnerability assessment specifically: agree scan timing (off-peak windows) and rate limits up front; start with lower-impact/read-only checks before enabling anything with brute-force or DoS potential; monitor target health during the scan and have an agreed stop condition; and never assume a "just a scan" is automatically safe to run against production without that conversation happening first.</p>

<h3>Handling scanning credentials</h3>
<p>Authenticated scanning (Mental Model) is more accurate, but the credentials it needs are themselves a security liability — a scanning service account with read access across the environment is an attractive target. Standard practice: use a dedicated, least-privilege service account for scanning (not a shared or administrative one), store its credentials in a vault rather than in the scanner's plaintext config, and rotate or revoke it at the end of the engagement rather than leaving it live indefinitely.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'cheat-sheet', title: '📋 Cheat Sheet', html: `
<table>
  <thead><tr><th>Category</th><th>Item</th><th>What it means</th></tr></thead>
  <tbody>
    <tr><td>Scanner</td><td>Nessus</td><td>Tenable's industry-standard scanner; UI/API-driven, policy + NASL-plugin based</td></tr>
    <tr><td>Scanner</td><td>OpenVAS / GVM</td><td>Open-source equivalent; gvmd + gsad + NVT feed, automated via gvm-cli/GMP</td></tr>
    <tr><td>Scanner</td><td>Nikto</td><td>Fast, focused web-<em>server</em> scanner — outdated software, dangerous files, misconfig</td></tr>
    <tr><td>Scanner</td><td>nuclei</td><td>ProjectDiscovery's fast, YAML-template-driven scanner; new CVE templates ship within hours</td></tr>
    <tr><td>Scanner</td><td>wpscan</td><td>WordPress specialist — core/theme/plugin version + vuln DB + user enumeration</td></tr>
    <tr><td>Data source</td><td>CVE</td><td>MITRE's identifier for one specific disclosed vulnerability (<code>CVE-YYYY-NNNNN</code>); no score</td></tr>
    <tr><td>Data source</td><td>NVD</td><td>NIST's database enriching each CVE with CVSS score, CPE (affected software), CWE (flaw type)</td></tr>
    <tr><td>Data source</td><td>Exploit-DB / searchsploit</td><td>Public exploit-code archive + offline CLI search tool; answers "does a working exploit exist?"</td></tr>
    <tr><td>Scoring</td><td>CVSS Base</td><td>AV, AC, PR, UI, S, C, I, A (v3.1) — intrinsic severity, always scored, never changes</td></tr>
    <tr><td>Scoring</td><td>CVSS Temporal (v3.1)</td><td>E (Exploit Code Maturity), RL (Remediation Level), RC (Report Confidence) — optional</td></tr>
    <tr><td>Scoring</td><td>CVSS Environmental</td><td>CR/IR/AR security requirements + modified Base metrics — optional, org-specific context</td></tr>
    <tr><td>Scoring</td><td>CVSS v4.0 (Nov 2023)</td><td>Scope → split into VC/VI/VA + SC/SI/SA; adds AT; UI gets 3 values; Temporal → single Threat metric E; adds Supplemental group</td></tr>
    <tr><td>Scoring</td><td>Score nomenclature (v4.0)</td><td>CVSS-B / CVSS-BT / CVSS-BE / CVSS-BTE — which metric groups were used</td></tr>
    <tr><td>Scoring</td><td>Severity scale</td><td>0.0 None · 0.1–3.9 Low · 4.0–6.9 Medium · 7.0–8.9 High · 9.0–10.0 Critical</td></tr>
    <tr><td>Scan type</td><td>Unauthenticated</td><td>External view only — banners/fingerprints; simulates an outside attacker; more false positives/negatives</td></tr>
    <tr><td>Scan type</td><td>Authenticated (credentialed)</td><td>Logs in with real credentials — actual installed versions/patch level; far more accurate</td></tr>
    <tr><td>Triage</td><td>False positive</td><td>Reported finding that isn't actually present/exploitable — must be verified out before reporting</td></tr>
    <tr><td>Triage</td><td>False negative</td><td>A real vulnerability the scanner missed entirely — harder to catch, common in unauthenticated scans</td></tr>
    <tr><td>Prioritization</td><td>EPSS</td><td>FIRST.org's 0–1 probability score: likelihood of real-world exploitation in the next 30 days</td></tr>
    <tr><td>Prioritization</td><td>CISA KEV</td><td>US CISA's catalog of vulnerabilities confirmed actively exploited in the wild</td></tr>
    <tr><td>Defense</td><td>Compensating control</td><td>WAF rule / firewall restriction / feature disablement used when no patch exists yet</td></tr>
    <tr><td>Defense</td><td>Patch mgmt loop</td><td>Identify → Prioritize → Remediate → Verify → repeat, continuously</td></tr>
    <tr><td>Legal must-have</td><td>Authorization to scan</td><td>Same CFAA-class rule as any other testing — scanning is still "access"</td></tr>
    <tr><td>Legal must-have</td><td>Scan-safety agreement</td><td>Timing windows, rate limits, stop conditions agreed in the RoE before aggressive scans run</td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">What's the difference between a vulnerability assessment and a penetration test?</div>
<div class="qa-a">
<p>A vulnerability assessment is broad and largely automated — scanners like Nessus, OpenVAS, Nikto, nuclei, or wpscan fingerprint software versions across the whole in-scope environment and match them against known CVE databases, producing a ranked list of findings with CVSS scores. It aims for coverage, runs frequently (often continuously), and rarely involves actually exploiting anything. A penetration test is narrower and manual: a tester picks targets, actually exploits weaknesses to prove real-world impact, chains smaller findings into serious ones, and reports with reproducible proof-of-concept steps. Neither replaces the other — assessments give frequent, broad coverage; pentests give periodic, deep, proven impact.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Walk me through the CVSS Base metrics and what they mean.</div>
<div class="qa-a">
<p>CVSS v3.1's eight Base metrics score the intrinsic severity of a flaw, independent of environment or exploit availability. Attack Vector (AV: Network/Adjacent/Local/Physical) — how the vulnerability is reached. Attack Complexity (AC: Low/High) — whether special conditions must exist. Privileges Required (PR: None/Low/High) — what access the attacker needs beforehand. User Interaction (UI: None/Required) — whether a victim has to do something. Scope (S: Unchanged/Changed) — whether the exploited component can impact resources beyond its own security scope. Confidentiality/Integrity/Availability Impact (C/I/A: None/Low/High) — what's actually lost. Together they produce a 0.0–10.0 Base score and a qualitative rating from None up to Critical. Temporal and Environmental metrics can optionally be layered on top to reflect exploit maturity and an organization's specific context, but the Base score is what's published on the NVD for every CVE.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What changed in CVSS v4.0 compared to v3.1?</div>
<div class="qa-a">
<p>v4.0 (published by FIRST in November 2023) restructures rather than just retunes the metric groups. The old single Scope metric is gone, replaced by two separate three-metric impact groups — Vulnerable System impact (VC/VI/VA) and Subsequent System impact (SC/SI/SA) — giving more precise scoring for vulnerabilities with cascading, cross-component effects. A new Attack Requirements (AT) metric adds granularity beyond Attack Complexity, capturing preconditions like race conditions or needing to be on-path. User Interaction expands from two values to three (None/Passive/Active), distinguishing routine involuntary interaction from deliberate conscious interaction. The three-metric Temporal group (E/RL/RC) is replaced by a single Threat metric, Exploit Maturity. And a new Supplemental metric group (Safety, Automatable, Recovery, and others) adds informational context without changing the numeric score. v3.1 is still what you'll see attached to most existing CVEs, but v4.0 adoption is growing, so knowing both is expected.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between authenticated and unauthenticated scanning, and why does it matter?</div>
<div class="qa-a">
<p>Unauthenticated scanning only sees what's visible from outside — open ports, service banners, response fingerprints — and has to infer software versions from those signals, which produces both false positives (inferring a vulnerable version that was actually patched without the banner changing) and false negatives (missing a real flaw the banner doesn't hint at). Authenticated (credentialed) scanning logs into the target with real credentials — SSH/SMB/WinRM — and asks the OS's own package manager or registry what's actually installed, which is dramatically more accurate. The tradeoff is that authenticated scanning needs the client to trust the tester with credentials, and those credentials themselves become something that needs to be protected — a dedicated least-privilege service account, vaulted, rotated after the engagement.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">A scanner reports a Critical CVSS 9.8 finding. What do you do before it goes in the report?</div>
<div class="qa-a">
<p>Treat it as a candidate, not a confirmed finding. First, verify it isn't a false positive — check the actual version/configuration on the host, and prefer an authenticated result over an unauthenticated one if they disagree. Then check exploit availability with <code>searchsploit --cve &lt;id&gt;</code> (and Exploit-DB) to see whether working exploit code already exists, and check whether it's listed in the CISA KEV catalog as actively exploited in the wild — a high CVSS score with no real-world exploitation evidence is a different priority than one that's actively being exploited. Only once it's manually confirmed real does it get ranked and included as a finding; forwarding raw, unverified scanner output as-is is exactly the gap between running a tool and performing a vulnerability assessment.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Is running a vulnerability scan against a system legally different from exploiting it?</div>
<div class="qa-a">
<p>No — not under laws like the US CFAA and its international equivalents, which criminalize unauthorized <em>access</em>, not just unauthorized exploitation. A vulnerability scan sends real traffic to a real system and can be logged, alerted on, and in some cases destabilize a fragile service, so it requires exactly the same explicit, written, in-scope authorization as any other testing technique covered in this module. In practice, authorized engagements typically get the scanning source IPs allow-listed with the client's security team in advance, both to avoid tripping an unnecessary incident response and to make clear the activity is expected and authorized.</p>
</div>
</div>
`}

]});
