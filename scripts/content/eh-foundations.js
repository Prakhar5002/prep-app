window.PREP_SITE.registerTopic({
  id: 'eh-foundations',
  module: 'eh',
  title: 'Foundations, Ethics & Legal',
  estimatedReadTime: '26 min',
  tags: ['ethical-hacking', 'security', 'pentest', 'ethics', 'legal', 'methodology'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<div class="callout danger">
  <div class="callout-title">⚠️ Read this before anything else in this module</div>
  <p>Everything taught across this Ethical Hacking module assumes you have <strong>explicit, written authorization</strong> to test the systems involved — your own lab VMs, an employer's asset you've been contracted to test under a signed agreement, or a platform (Hack The Box, TryHackMe, a bug-bounty program's published scope) that has already agreed to be tested. Running any of these techniques against a system you don't own and haven't been authorized to test is a crime in most of the world, regardless of intent. This module is for authorized testing, personal labs, and CTF/practice platforms only.</p>
</div>
<p><strong>Ethical hacking</strong> (also called <strong>penetration testing</strong> or "pentesting") is the practice of legally and systematically attacking computer systems, networks, and applications — with the owner's permission — to find security weaknesses before someone without permission finds and exploits them. It's the same technical skill set as malicious hacking; the entire difference is <strong>authorization, scope, and intent</strong>.</p>
<ul>
  <li><strong>The one rule above all others:</strong> only test systems you own, or that you have explicit written permission to test, within an agreed scope. No exceptions — not "it looked insecure," not "I was just curious," not "I didn't cause any damage."</li>
  <li><strong>A pentest follows a lifecycle, not a random walk.</strong> Every serious methodology — PTES, NIST SP 800-115, the Cyber Kill Chain, MITRE ATT&amp;CK — describes broadly the same shape: agree scope and get authorization, reconnaissance, scanning/enumeration, exploitation, post-exploitation, and reporting. This module's later topics are organized around exactly this lifecycle.</li>
  <li><strong>This topic is topic 1 of the Ethical Hacking module — beginner start, zero assumptions.</strong> It covers the legal and ethical framing every other topic depends on, the major methodologies you'll hear referenced constantly (PTES, OSSTMM, NIST, the kill chain, ATT&amp;CK), the phases of an engagement, and how to build a safe, isolated practice lab (Kali/Parrot + deliberately vulnerable targets) so every later topic has somewhere legal to practice against.</li>
  <li><strong>Later topics assume a lab, not a target.</strong> Reconnaissance, scanning, web app hacking, exploitation, and everything else in this module will be demonstrated and practiced against the vulnerable-by-design targets and platforms set up in this topic (DVWA, Metasploitable, Juice Shop, Hack The Box, TryHackMe) — never against real, unauthorized systems.</li>
</ul>
<p><strong>Mantra:</strong> "Get it in writing, stay in scope, report what you find — the hacking is the easy part; the authorization is what makes it ethical and legal."</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What ethical hacking / penetration testing actually is</h3>
<p>A <strong>penetration test</strong> ("pentest") is a time-boxed, authorized, simulated attack against a system, network, or application, performed by someone skilled in attacker techniques, under a signed agreement that defines exactly what may be tested, when, and how. The goal isn't to "break things for fun" — it's to answer a concrete business question: <em>if a real attacker came after this target, what could they actually reach, and how bad would it be?</em> The output is a report: concrete, reproducible findings, how severe each one is, and what to fix first.</p>
<p><strong>Ethical hacking</strong> is the broader umbrella term for using attacker skills for defensive, authorized purposes — penetration testing is the most common form of it, but the umbrella also covers red teaming, bug-bounty hunting, and security research, all covered in the distinctions below.</p>

<h3>White hat, grey hat, black hat — and why "ethical" means authorized</h3>
<table>
  <thead><tr><th>Hat</th><th>Authorization</th><th>Intent</th><th>Legal status</th></tr></thead>
  <tbody>
    <tr><td><strong>White hat</strong></td><td>Explicit, written, in-scope</td><td>Help the owner find and fix flaws</td><td>Legal</td></tr>
    <tr><td><strong>Grey hat</strong></td><td>None obtained beforehand</td><td>Often well-intentioned (e.g. reports a bug it finds)</td><td>Illegal in most jurisdictions, even when well-intentioned — access without authorization is the crime, regardless of what happens next</td></tr>
    <tr><td><strong>Black hat</strong></td><td>None, and none sought</td><td>Personal gain, damage, espionage, ideology</td><td>Illegal</td></tr>
  </tbody>
</table>
<p>The colors describe intent, but only one column actually decides legality: <strong>authorization</strong>. A grey-hat "I found this open server and poked around, then told them about it" story is a common one online, and it still describes an unauthorized-access crime in most legal systems — good intentions and "no harm done" are not a legal defense for exceeding or lacking authorization (more in Methodology &amp; Lab Setup and Legal &amp; Safety below). This module only teaches and practices the white-hat path: authorization first, always.</p>

<h3>Why authorized testing exists: finding the flaw before the attacker does</h3>
<p>Defenders have to protect every entry point, every day; an attacker only needs to find one weakness, once. That asymmetry is the entire reason authorized offensive testing exists as a discipline: organizations pay skilled people, under contract, to find the same weaknesses a real attacker would find — recruiters, criminal groups, opportunistic scanners, and nation-state actors are already probing internet-facing systems constantly — and report them privately so they can be fixed before anyone with bad intent gets there first. It converts "hopefully nobody finds this" into "someone we trust already found it and told us how to fix it."</p>

<h3>Pentest vs. vulnerability assessment vs. red team vs. bug bounty</h3>
<p>These terms get used loosely, but they're meaningfully different engagement shapes:</p>
<ul>
  <li><strong>Vulnerability assessment</strong> — broad, largely automated (scanner-driven), aims for coverage: "list every known weakness across this whole environment." Rarely involves actual exploitation.</li>
  <li><strong>Penetration test</strong> — narrower and manual: pick a target within scope, actually exploit weaknesses to prove real-world impact (not just "the scanner flagged it"), chain smaller issues into serious ones, and report with reproducible proof-of-concept steps.</li>
  <li><strong>Red team engagement</strong> — goal-oriented and stealthy ("can you reach the crown-jewel database without being detected?"), longer timeframe, multiple vectors (technical, social, sometimes physical), and it also tests the defenders (the "blue team") and their detection/response — not just the systems. When red and blue teams collaborate and share findings in real time, that's called a <strong>purple team</strong> exercise.</li>
  <li><strong>Bug bounty</strong> — continuous and crowd-sourced: an organization publishes a standing scope and pays independent researchers per valid finding, via a platform like HackerOne or Bugcrowd, which also provides a legal "safe harbor" for good-faith research within the published scope.</li>
</ul>

<h3>What a pentest actually delivers</h3>
<p>The value isn't the exploit — it's the report. A credible pentest delivers prioritized, reproducible findings (not raw scanner output), a severity rating (commonly via CVSS or a business-impact rating) tied to real exploited impact, clear remediation guidance the client's engineers can act on, and — very often — evidence needed for a compliance requirement (PCI-DSS, SOC 2, ISO 27001, HIPAA, and similar frameworks frequently mandate periodic third-party testing). This whole module builds toward being able to produce exactly that kind of finding and report.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>One lifecycle, described by several methodologies</h3>
<p>Every real engagement moves through roughly the same shape, from "agree what we're doing" to "here's the report." Different methodologies and frameworks name the stages slightly differently — the flow underneath is consistent:</p>
<pre><code class="language-text">Pre-engagement  →  Reconnaissance  →  Scanning &amp; Enumeration  →  Exploitation  →  Post-Exploitation  →  Reporting
  (scope, RoE,        (passive +           (find live hosts,         (turn a found       (persist, escalate,    (findings, risk,
   written auth)        active recon)       ports, services,          weakness into        move laterally,        remediation)
                                             misconfigs)               real access)         gather evidence)
</code></pre>
<p>This module's later topics are organized directly on top of this lifecycle: Reconnaissance &amp; OSINT, Scanning &amp; Enumeration, Vulnerability Assessment, then the exploitation-focused topics (Web, Network, Wireless, Passwords, Exploitation/Metasploit, Active Directory), Post-Exploitation &amp; Privilege Escalation, Social Engineering &amp; Physical, and finally Reporting, Cloud &amp; Modern.</p>

<h3>The same lifecycle, in each major methodology's own language</h3>
<table>
  <thead><tr><th>Our stage</th><th>PTES</th><th>NIST SP 800-115</th><th>Lockheed Martin Cyber Kill Chain</th><th>MITRE ATT&amp;CK</th></tr></thead>
  <tbody>
    <tr><td>Pre-engagement</td><td>Pre-engagement Interactions</td><td>Planning</td><td>—</td><td>—</td></tr>
    <tr><td>Reconnaissance</td><td>Intelligence Gathering</td><td>Discovery</td><td>Reconnaissance</td><td>Reconnaissance</td></tr>
    <tr><td>Scanning &amp; Enumeration</td><td>Threat Modeling, Vulnerability Analysis</td><td>Discovery (cont.)</td><td>—</td><td>Reconnaissance (Active Scanning, T1595)</td></tr>
    <tr><td>Exploitation</td><td>Exploitation</td><td>Attack</td><td>Weaponization → Delivery → Exploitation</td><td>Initial Access, Execution</td></tr>
    <tr><td>Post-Exploitation</td><td>Post Exploitation</td><td>Attack (cont.)</td><td>Installation → Command and Control → Actions on Objectives</td><td>Persistence, Privilege Escalation, Defense Evasion, Credential Access, Discovery, Lateral Movement, Collection, Command and Control, Exfiltration, Impact</td></tr>
    <tr><td>Reporting</td><td>Reporting</td><td>Reporting</td><td>—</td><td>—</td></tr>
  </tbody>
</table>
<ul>
  <li><strong>PTES (Penetration Testing Execution Standard)</strong> — the most widely referenced end-to-end pentest methodology; its seven phases (the table above condenses two of them, "Threat Modeling" and "Vulnerability Analysis," into the single Scanning &amp; Enumeration row — Threat Modeling identifies which assets and threat actors actually matter before testing) are the backbone most real-world engagements structure themselves around.</li>
  <li><strong>OSSTMM (Open Source Security Testing Methodology Manual)</strong> — developed by ISECOM; last major version 3.0 (2010), not actively updated since. It isn't phase-based like PTES. Instead it's metrics-driven: it measures "operational security" across channels (Human, Physical, Wireless, Telecommunications, Data Networks) and produces a quantified risk score (a RAV, "Risk Assessment Value"). Teams often use OSSTMM's measurement rigor alongside PTES's phase structure rather than choosing one exclusively.</li>
  <li><strong>NIST SP 800-115</strong> ("Technical Guide to Information Security Testing and Assessment") — a US government-published methodology with four phases: Planning, Discovery, Attack, Reporting. Common in engagements involving US federal or regulated environments.</li>
  <li><strong>Lockheed Martin Cyber Kill Chain</strong> — describes an <em>attacker's</em> perspective on a single intrusion, not a tester's methodology: Reconnaissance, Weaponization, Delivery, Exploitation, Installation, Command and Control, Actions on Objectives. Its real value is defensive — if a defender can break the chain at any link, the attack fails, which is why it's referenced constantly in blue-team and detection contexts.</li>
  <li><strong>MITRE ATT&amp;CK</strong> — not a linear phase model at all. It's a continuously updated, community- and MITRE-maintained <em>knowledge base</em> of real-world adversary <strong>Tactics</strong> (the "why" — the attacker's goal, e.g. Initial Access, Persistence, Lateral Movement) and, under each tactic, specific <strong>Techniques</strong> (the "how"). It's used both to plan realistic red-team engagements and to map defensive detection coverage.</li>
</ul>

<h3>Why we test at all: the CIA triad</h3>
<p>Nearly every finding in a pentest report ultimately threatens one of three properties, together called the <strong>CIA triad</strong>:</p>
<ul>
  <li><strong>Confidentiality</strong> — data is only accessible to those authorized to see it (a SQL injection that dumps customer records breaks this).</li>
  <li><strong>Integrity</strong> — data and systems can be trusted to be accurate and unmodified (an attacker silently altering an invoice amount breaks this).</li>
  <li><strong>Availability</strong> — authorized users can actually get to the system when they need it (a denial-of-service attack breaks this — and is exactly why DoS/DDoS testing is almost always explicitly excluded from a pentest's Rules of Engagement, covered next).</li>
</ul>
<p>Every phase of every methodology above ultimately exists to find where one of these three properties can be broken — and every finding in a report should be traceable back to which one (or more) is at risk.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Methodology & Lab Setup', html: `
<h3>Engagement types: how much does the tester know going in?</h3>
<table>
  <thead><tr><th>Type</th><th>Tester's starting knowledge</th><th>Simulates</th></tr></thead>
  <tbody>
    <tr><td><strong>Black-box</strong></td><td>None — maybe just a company name or a URL</td><td>An external attacker with no inside information</td></tr>
    <tr><td><strong>Grey-box</strong></td><td>Partial — e.g. a low-privileged user account, or basic network diagrams</td><td>A malicious insider, or an attacker who already gained a foothold</td></tr>
    <tr><td><strong>White-box (crystal-box)</strong></td><td>Full — source code, architecture diagrams, credentials, admin access</td><td>Nothing in particular; trades realism for thoroughness and speed, since nothing has to be discovered from scratch</td></tr>
  </tbody>
</table>
<p>Grey-box is the most common real-world choice — it balances realism against the cost of a tester spending most of the engagement just on discovery.</p>

<h3>The legal core: written authorization, scope, and Rules of Engagement</h3>
<p>This is the part of the module that matters more than any tool or technique. Before a single scan runs against anything other than your own lab, an engagement needs:</p>
<ul>
  <li><strong>Written authorization</strong>, signed by someone who actually has the authority to grant it for that specific asset — not just any employee, and not a verbal "sure, go ahead." If the asset is hosted by a third party (cloud provider, SaaS vendor), that provider's own testing policy may also need to be checked and, in some cases, separately notified.</li>
  <li><strong>A defined scope</strong> — the exact IP ranges, domains, applications, and/or physical locations that are in bounds, and (just as important) an explicit list of what is <em>out</em> of bounds.</li>
  <li><strong>A Rules of Engagement (RoE) document</strong>, which typically spells out: the scope above; the authorized testing window and any blackout periods (e.g. not during a sales launch); which techniques are explicitly permitted or prohibited (denial-of-service testing and social-engineering specific named individuals are commonly excluded by default); emergency contacts and an escalation path if something goes wrong; data-handling and confidentiality requirements for anything sensitive that's discovered; and signatures from the actual asset owner.</li>
  <li><strong>A "get-out-of-jail-free" letter</strong> for on-site or physical-access work — an authorization letter the tester physically carries, so that if they're stopped by security staff or law enforcement while testing (e.g. during a physical social-engineering or badge-cloning exercise), there's an immediate, verifiable authorization to show. Covered further in Legal &amp; Safety below.</li>
</ul>

<h3>The law: the CFAA and its international equivalents</h3>
<p>In the United States, the primary law governing this is the <strong>Computer Fraud and Abuse Act (CFAA, 18 U.S.C. § 1030)</strong>, originally enacted in 1986 and amended several times since. It criminalizes accessing a computer "without authorization or exceeding authorized access" — note that this covers both breaking in from the outside <em>and</em> a legitimate user going beyond what they were permitted to do. (The scope of "exceeding authorized access" was narrowed by the US Supreme Court in <em>Van Buren v. United States</em> (2021), but unauthorized access itself remains squarely illegal.)</p>
<p>Nearly every country has its own equivalent statute, and they don't always align on details — always check local law for the jurisdiction(s) involved in an engagement:</p>
<ul>
  <li><strong>United Kingdom</strong> — the Computer Misuse Act 1990 (amended 2015).</li>
  <li><strong>European Union</strong> — Directive 2013/40/EU on attacks against information systems, implemented into each member state's national law.</li>
  <li><strong>International</strong> — the Council of Europe's Convention on Cybercrime (the "Budapest Convention," 2001) is the main international treaty harmonizing computer-crime law across signatory countries.</li>
  <li><strong>India</strong> — the Information Technology Act, 2000 (notably Sections 43 and 66).</li>
  <li>Australia, Canada, and most other jurisdictions have their own comparable unauthorized-access statutes.</li>
</ul>
<p>The common thread across all of them: <strong>authorization is the line between a legitimate security engagement and a crime</strong> — not skill, not intent, not whether anything was actually damaged.</p>

<h3>Responsible (coordinated) disclosure</h3>
<p>If a vulnerability is found — during an authorized engagement, a bug bounty, or independent research within a published scope — the expected practice is <strong>coordinated vulnerability disclosure</strong>: report it privately to the vendor or asset owner first, agree on a reasonable remediation timeline (a common industry convention, popularized by Google Project Zero, is around 90 days), and don't publicize details before the fix ships or the agreed date passes, whichever comes first. Bug-bounty platforms like HackerOne and Bugcrowd formalize this process and typically provide a legal "safe harbor" for researchers who stay within the program's published scope and rules.</p>

<h3>Lab setup: a safe, isolated place to practice everything else in this module</h3>
<p>Every later topic in this module is demonstrated and practiced against deliberately vulnerable targets in an isolated lab — never against real, unauthorized systems. The standard setup:</p>
<ul>
  <li><strong>Attack platform:</strong> <strong>Kali Linux</strong> (Debian-based, maintained by Offensive Security, preloaded with pentesting tools) or <strong>Parrot OS</strong> (a similar Debian-based alternative, lighter-weight, with extra privacy/anonymity tooling) — either works fine for this module.</li>
  <li><strong>Hypervisor:</strong> <strong>VirtualBox</strong> (free, Oracle) or <strong>VMware Workstation/Fusion</strong> — run the attack VM and the target VM(s) as guests on your own machine.</li>
  <li><strong>Isolated networking:</strong> put the attacker and target VMs on a <strong>host-only (or internal) network</strong>, never bridged or NAT'd out to the real internet or your home/office LAN, so lab traffic can never accidentally reach — or be reached by — anything outside the lab.</li>
</ul>
<pre><code class="language-bash"># Create an isolated host-only network in VirtualBox (traffic on this
# network never leaves the host machine or reaches the real internet):
VBoxManage hostonlyif create

# Confirm it exists (commonly named vboxnet0):
VBoxManage list hostonlyifs

# Attach a VM's first network adapter to that isolated network instead
# of the default NAT/Bridged mode:
VBoxManage modifyvm "Kali" --nic1 hostonly --hostonlyadapter1 vboxnet0
VBoxManage modifyvm "Metasploitable2" --nic1 hostonly --hostonlyadapter1 vboxnet0

# From inside the Kali VM, confirm you only have an address on the
# isolated lab subnet before touching anything:
ip a</code></pre>
<p><strong>Deliberately vulnerable practice targets</strong> (run these only inside the isolated lab network above):</p>
<ul>
  <li><strong>DVWA (Damn Vulnerable Web Application)</strong> — a small PHP/MySQL web app with intentional, adjustable-difficulty flaws (SQLi, XSS, and more); great first web-app target.</li>
  <li><strong>Metasploitable 2</strong> — a deliberately vulnerable Ubuntu-based VM (published by Rapid7) loaded with outdated, misconfigured services; the classic first network/exploitation target.</li>
  <li><strong>Metasploitable 3</strong> — a more advanced successor (Windows and Linux variants), built via Vagrant/Packer rather than downloaded as a single image.</li>
  <li><strong>OWASP Juice Shop</strong> — a modern, intentionally-insecure Node.js/Angular web app covering the OWASP Top 10, easy to run disposably via Docker.</li>
  <li><strong>VulnHub</strong> — a large free library of downloadable, deliberately vulnerable VM images built by the community, spanning beginner to advanced.</li>
</ul>
<pre><code class="language-bash"># Spin up OWASP Juice Shop as a disposable container instead of a full VM:
docker run --rm -p 3000:3000 bkimminich/juice-shop
# then browse to http://localhost:3000 on the lab network</code></pre>
<p><strong>Online practice platforms</strong> (no local lab required): <strong>Hack The Box (HTB)</strong> — cloud-hosted retired/active vulnerable machines plus structured HTB Academy courses; <strong>TryHackMe (THM)</strong> — guided, beginner-friendly "rooms" and learning paths. Both provide their own pre-authorized, legal scope to practice against.</p>
<p><strong>Certifications</strong> commonly pursued alongside this kind of self-study, roughly beginner to advanced: <strong>eJPT</strong> (INE/eLearnSecurity Junior Penetration Tester — entry-level, practical) → <strong>CEH</strong> (Certified Ethical Hacker, EC-Council — broad, knowledge-based) → <strong>PNPT</strong> (Practical Network Penetration Tester, TCM Security — hands-on, report-graded) → <strong>OSCP</strong> (Offensive Security Certified Professional — a demanding, hands-on ~23h45m proctored practical exam, followed by a separate 24-hour window to submit the written report, widely respected in the industry).</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Worked Examples', html: `
<h3>Example 1 — A scoping and authorization checklist before any engagement starts</h3>
<p>Before a single tool runs against anything other than your own personal lab, confirm every item below:</p>
<ul>
  <li>☐ Written authorization is signed by someone with actual authority over the target asset (not just any contact at the company).</li>
  <li>☐ Scope is documented explicitly — exact IP ranges, domains, application URLs, and/or physical locations that are in bounds.</li>
  <li>☐ Out-of-scope systems are explicitly listed too, not just implied by omission.</li>
  <li>☐ The testing window (start/end dates, allowed hours, any blackout periods) is agreed and documented.</li>
  <li>☐ Prohibited techniques are listed (denial-of-service testing and social-engineering specific named individuals are commonly excluded unless separately negotiated).</li>
  <li>☐ Emergency contacts and an escalation path exist in case something breaks or an unexpected critical finding turns up mid-engagement.</li>
  <li>☐ Data-handling rules are clear — how discovered sensitive data (credentials, PII, source code) will be stored, reported, and destroyed after the engagement.</li>
  <li>☐ A "get-out-of-jail-free" letter is prepared and carried for any on-site/physical component.</li>
  <li>☐ Everyone on the testing team has read and understood the Rules of Engagement document before touching anything.</li>
</ul>
<p>If any box above isn't checked, the engagement doesn't start — this checklist <em>is</em> the pre-engagement phase from the Mental Model diagram.</p>

<h3>Example 2 — Building an isolated Kali + vulnerable-target lab</h3>
<pre><code class="language-bash"># 1. Create the isolated host-only network first, before importing any VM:
VBoxManage hostonlyif create
VBoxManage list hostonlyifs
# → confirms something like "vboxnet0" now exists

# 2. Import the Kali Linux OVA (downloaded from Kali's official site) and
#    the Metasploitable 2 image (from Rapid7/VulnHub) as two separate VMs.

# 3. Attach BOTH VMs' network adapters to the same host-only network,
#    so they can reach each other but nothing outside the lab can reach them:
VBoxManage modifyvm "Kali" --nic1 hostonly --hostonlyadapter1 vboxnet0
VBoxManage modifyvm "Metasploitable2" --nic1 hostonly --hostonlyadapter1 vboxnet0

# 4. Boot both VMs. Inside Kali, confirm the lab-only address:
ip a
# → e.g. 192.168.56.101 on the vboxnet0 subnet, no route to the real internet

# 5. Confirm the target is reachable ONLY on that isolated subnet before
#    running any tool against it:
ping -c 3 &lt;target-vm-ip&gt;
ping -c 3 192.168.56.102</code></pre>
<p>Notice the sequencing: the isolated network is created <em>first</em>, both VMs are pinned to it <em>before</em> either boots with real network access, and the very first thing done inside Kali is confirm the address really is on the isolated lab subnet — that verification step is the safety habit worth keeping for every lab session, in every later topic of this module.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '⚠️ Legal & Safety', html: `
<div class="callout danger">
  <div class="callout-title">⚠️ The one rule that overrides everything else in this module</div>
  <p><strong>Only test systems you own, or that you have explicit, written, in-scope authorization to test.</strong> This applies even if the system looks obviously insecure, even if you don't intend to cause harm, even if you plan to report anything you find, and even if you "just" run a scan without exploiting anything. Unauthorized access — or authorized access used beyond its granted scope — is what the CFAA and its international equivalents criminalize, regardless of intent or outcome. When in doubt, don't — get authorization first, or use one of the legal practice platforms covered in Methodology &amp; Lab Setup (your own lab, DVWA/Metasploitable/Juice Shop locally, Hack The Box, TryHackMe).</p>
</div>

<h3>The "get-out-of-jail-free" letter</h3>
<p>For any engagement with a physical or on-premises component (badge cloning, tailgating, on-site network drops, physical social engineering), the tester should carry a signed authorization letter — often literally called a "get-out-of-jail-free" letter — naming the tester, the authorizing party, the dates, and the scope. If security staff or law enforcement intervenes mid-test, this letter is the immediate proof that the activity is authorized. It's typically backed by the emergency contact listed in the Rules of Engagement, who can verbally confirm the engagement if needed.</p>

<h3>Staying in scope — and what to do if you find something outside it</h3>
<p>Scope creep is one of the easiest ways to accidentally turn a legal engagement into an unauthorized one. If, during testing, you discover a system, subdomain, or data set that appears connected to the target but wasn't listed in scope: <strong>stop interacting with it immediately</strong>, document what was observed (without further probing it), and report it to the engagement's point of contact so scope can be formally expanded in writing if the client wants it tested. Never assume "it's probably fine, it's clearly related" — get it added to the written scope first.</p>

<h3>Handling data you encounter during testing</h3>
<p>Pentests routinely surface sensitive data — credentials, personal information, source code, internal documents. Standard practice, and usually a specific clause in the RoE: extract only the minimum evidence needed to prove impact (a screenshot or a single redacted record, not a full database dump), encrypt findings and reports in transit and at rest, and destroy any retained client data at the agreed retention period after the engagement closes — don't keep it "just in case."</p>

<h3>Production systems are real systems — treat availability as a real risk</h3>
<p>Unlike a personal lab, a real target may be a production system serving real users. Techniques that risk denial-of-service (aggressive scanning, brute-forcing, fuzzing that could crash a service) are commonly excluded from scope by default precisely because they threaten <strong>availability</strong> (one leg of the CIA triad from the Mental Model section) — confirm explicitly in the RoE whether such techniques are permitted, and prefer testing during agreed low-traffic windows when they are.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'cheat-sheet', title: '📋 Cheat Sheet', html: `
<table>
  <thead><tr><th>Category</th><th>Item</th><th>What it means</th></tr></thead>
  <tbody>
    <tr><td>Phase</td><td>Pre-engagement</td><td>Scope agreed, Rules of Engagement signed, written authorization obtained</td></tr>
    <tr><td>Phase</td><td>Reconnaissance</td><td>Passive + active information gathering about the target</td></tr>
    <tr><td>Phase</td><td>Scanning &amp; Enumeration</td><td>Find live hosts, open ports, running services and versions, misconfigurations</td></tr>
    <tr><td>Phase</td><td>Exploitation</td><td>Turn a found weakness into actual, proven access</td></tr>
    <tr><td>Phase</td><td>Post-Exploitation</td><td>Persistence, privilege escalation, lateral movement, evidence gathering</td></tr>
    <tr><td>Phase</td><td>Reporting</td><td>Prioritized findings, risk ratings, reproducible steps, remediation guidance</td></tr>
    <tr><td>Methodology</td><td>PTES</td><td>Penetration Testing Execution Standard — 7-phase end-to-end pentest methodology</td></tr>
    <tr><td>Methodology</td><td>OSSTMM</td><td>Open Source Security Testing Methodology Manual — metrics-driven (RAV scores), not phase-based</td></tr>
    <tr><td>Methodology</td><td>NIST SP 800-115</td><td>US government methodology — Planning, Discovery, Attack, Reporting</td></tr>
    <tr><td>Methodology</td><td>Cyber Kill Chain</td><td>Lockheed Martin's attacker-perspective model — 7 links from Recon to Actions on Objectives</td></tr>
    <tr><td>Methodology</td><td>MITRE ATT&amp;CK</td><td>Community-maintained knowledge base of adversary Tactics (why) and Techniques (how); not linear</td></tr>
    <tr><td>Concept</td><td>CIA Triad</td><td>Confidentiality, Integrity, Availability — the three properties every finding ultimately threatens</td></tr>
    <tr><td>Engagement type</td><td>Black / Grey / White-box</td><td>None / partial / full tester knowledge of the target beforehand</td></tr>
    <tr><td>Lab platform</td><td>Kali Linux / Parrot OS</td><td>Debian-based attack VM distros preloaded with pentest tooling</td></tr>
    <tr><td>Lab target</td><td>DVWA</td><td>Damn Vulnerable Web Application — adjustable-difficulty web app flaws</td></tr>
    <tr><td>Lab target</td><td>Metasploitable 2 / 3</td><td>Deliberately vulnerable Linux (and Windows, in v3) VMs from Rapid7</td></tr>
    <tr><td>Lab target</td><td>OWASP Juice Shop</td><td>Modern intentionally-insecure Node.js/Angular app; runs easily via Docker</td></tr>
    <tr><td>Lab target</td><td>VulnHub</td><td>Free community library of downloadable vulnerable VM images</td></tr>
    <tr><td>Practice platform</td><td>Hack The Box / TryHackMe</td><td>Cloud-hosted, pre-authorized machines and guided learning paths</td></tr>
    <tr><td>Certification</td><td>eJPT → CEH → PNPT → OSCP</td><td>Roughly beginner to advanced, knowledge-based to fully hands-on</td></tr>
    <tr><td>Legal must-have</td><td>Written authorization</td><td>Signed by someone with actual authority over the specific asset</td></tr>
    <tr><td>Legal must-have</td><td>Defined scope</td><td>Explicit in-scope AND out-of-scope systems, documented</td></tr>
    <tr><td>Legal must-have</td><td>Rules of Engagement (RoE)</td><td>Scope, testing window, permitted/prohibited techniques, contacts, data handling, signatures</td></tr>
    <tr><td>Legal must-have</td><td>Get-out-of-jail letter</td><td>Carried during on-site/physical testing as immediate proof of authorization</td></tr>
    <tr><td>Legal must-have</td><td>Local law awareness</td><td>CFAA (US) and its international equivalents (UK CMA, EU Directive, Budapest Convention, India's IT Act, etc.)</td></tr>
    <tr><td>Legal must-have</td><td>Responsible disclosure</td><td>Report privately, agree a remediation timeline (commonly ~90 days), don't disclose publicly before it's fixed</td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">What are the phases of a penetration test?</div>
<div class="qa-a">
<p>The commonly-taught lifecycle is: pre-engagement (scope and authorization agreed), reconnaissance (passive and active information gathering), scanning and enumeration (finding live hosts, open ports, running services and misconfigurations), exploitation (turning a found weakness into actual access), post-exploitation (persistence, privilege escalation, lateral movement, gathering evidence of impact), and reporting (prioritized findings with risk ratings and remediation guidance). This maps closely onto PTES's seven phases and onto NIST SP 800-115's four (Planning, Discovery, Attack, Reporting) — the underlying shape is the same across methodologies, just named slightly differently.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between black-box, grey-box, and white-box testing?</div>
<div class="qa-a">
<p>They differ in how much the tester knows before starting. Black-box gives the tester no prior information — simulating an external attacker starting from nothing. White-box (or "crystal-box") gives full information — source code, architecture diagrams, credentials — trading realism for thoroughness and speed since nothing needs to be discovered from scratch. Grey-box sits in between, giving partial knowledge such as a low-privileged account, simulating either a malicious insider or an attacker who's already gained an initial foothold. Grey-box is the most common real-world choice because it balances realism against how much of the engagement's limited time gets spent purely on discovery.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What should a Rules of Engagement (RoE) document contain?</div>
<div class="qa-a">
<p>At minimum: the exact in-scope (and explicitly out-of-scope) systems, domains, or locations; the authorized testing window and any blackout periods; which techniques are explicitly permitted or prohibited (denial-of-service testing and targeting specific named individuals via social engineering are commonly excluded by default); emergency contacts and an escalation path; data-handling and confidentiality requirements for anything sensitive discovered; and signatures from someone with actual authority over the asset being tested. For engagements with a physical component, it typically also covers or references a "get-out-of-jail-free" authorization letter the tester carries on-site.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">How do PTES, the Cyber Kill Chain, and MITRE ATT&amp;CK relate to each other?</div>
<div class="qa-a">
<p>They operate at different altitudes and serve different purposes. PTES is a tester's end-to-end methodology for running an engagement, from pre-engagement interactions through reporting. The Cyber Kill Chain describes a single intrusion from an attacker's perspective (Reconnaissance through Actions on Objectives) and is mainly used defensively — break any one link and the attack fails. MITRE ATT&amp;CK isn't a linear model at all; it's a continuously updated knowledge base of real-world adversary Tactics (the attacker's goals, like Persistence or Lateral Movement) and, under each, specific Techniques (how those goals are actually achieved) — used both to plan realistic red-team engagements and to map defensive detection coverage. In short: PTES structures the engagement, the kill chain models a single attack chain defensively, and ATT&amp;CK is the detailed, real-world technique reference underneath both.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What makes hacking legal versus illegal?</div>
<div class="qa-a">
<p>Authorization — not skill, intent, or whether damage occurred. Laws like the US Computer Fraud and Abuse Act (CFAA) criminalize accessing a computer "without authorization or exceeding authorized access," and equivalent statutes exist internationally (the UK's Computer Misuse Act, the EU's Directive 2013/40/EU, India's IT Act, and others, all harmonized loosely under the international Budapest Convention on Cybercrime). Testing a system you own, or that you have explicit written, in-scope authorization to test, is legal white-hat work. The exact same technical actions against a system without that authorization are a crime, even if the tester's intent was good, even if they planned to responsibly report anything found, and even if no lasting damage occurred.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What is responsible (coordinated) disclosure?</div>
<div class="qa-a">
<p>It's the practice of reporting a discovered vulnerability privately to the vendor or asset owner first — rather than publishing it immediately — and agreeing on a reasonable remediation timeline before any public disclosure (a common industry convention, popularized by Google Project Zero, is around 90 days). This gives the affected party a fair chance to fix the issue before attackers can learn about and exploit it. Bug-bounty platforms like HackerOne and Bugcrowd formalize this process and typically provide researchers a legal "safe harbor" as long as they stay within the program's published scope and rules.</p>
</div>
</div>
`}

]});
