window.PREP_SITE.registerTopic({
  id: 'eh-reporting-cloud',
  module: 'eh',
  title: 'Reporting, Cloud & Modern',
  estimatedReadTime: '32 min',
  tags: ['ethical-hacking', 'security', 'reporting', 'cvss', 'cloud-security', 'aws', 'azure', 'gcp', 'kubernetes', 'container-security', 'mobsf', 'blue-team', 'mitre-attack'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<div class="callout danger">
  <div class="callout-title">⚠️ Cloud, containers, and mobile add a second layer of authorization</div>
  <p>Every earlier topic in this module assumed a target where the asset owner's written authorization (Foundations, Ethics &amp; Legal) was the whole story. The surfaces in this closing topic add a party who <em>also</em> gets a say: <strong>AWS, Azure, and Google Cloud each publish their own penetration-testing policy</strong>, and those policies differ — some actions are pre-approved, others (denial-of-service simulation, command-and-control testing, red/blue/purple-team exercises) explicitly require the provider's prior approval even when the client has fully authorized you. A managed Kubernetes control plane and a mobile app's app-store terms work the same way. Get the asset owner's written authorization <strong>and</strong> check the specific provider's current policy before a tool touches anything beyond your own lab.</p>
</div>
<p>This is the <strong>final, wrap-up topic of the Ethical Hacking module</strong>, and it deliberately shifts the lens: every prior topic built an attacker's skill set; this one closes the loop with the deliverable that actually makes an organization safer (the report), a fast-moving tour of the infrastructure most real engagements run into today (cloud, containers/Kubernetes, mobile, IoT), and the <strong>defensive, blue/purple-team mindset</strong> that the rest of the module has been building toward without saying so out loud.</p>
<ul>
  <li><strong>Reporting is the actual product of a pentest.</strong> A professional report has a consistent anatomy: an <strong>executive summary</strong> for leadership (business risk, no jargon), <strong>technical findings</strong> with reproducible steps and <strong>evidence/screenshots</strong>, a <strong>CVSS</strong> severity rating per finding (mechanics covered in Vulnerability Assessment — this topic covers how it's <em>used</em> in a report), concrete <strong>remediation</strong> guidance, and a follow-up <strong>retest</strong> to confirm fixes actually landed. Document as you go, in <strong>Obsidian</strong> or <strong>CherryTree</strong>, not from memory at the end.</li>
  <li><strong>Cloud pentesting starts with the shared-responsibility model.</strong> The provider secures the cloud (physical hardware, hypervisor, managed-service internals); the customer secures what's <em>in</em> the cloud (IAM, configuration, data, workloads) — and that boundary defines what's even legal or possible to test. <strong>ScoutSuite</strong> and <strong>prowler</strong> audit configuration read-only across AWS/Azure/GCP; <strong>pacu</strong> actively exploits what they find inside an AWS account you're authorized to attack.</li>
  <li><strong>Cloud instance metadata is a recurring, high-value target.</strong> The metadata endpoint (<code>169.254.169.254</code>) can hand an attacker an instance's IAM credentials via an SSRF bug — <strong>IMDSv2</strong> is AWS's session-oriented mitigation, and knowing exactly why it blocks most SSRF chains is a favorite interview question.</li>
  <li><strong>Containers and Kubernetes get the same three-tool pattern.</strong> <code>trivy</code> scans images and clusters for known vulnerabilities and misconfigurations; <code>kube-bench</code> checks a cluster against the CIS Kubernetes Benchmark; <code>kube-hunter</code> actively probes a live cluster's attack surface (now archived by its maintainer — still taught for the technique, no longer the recommended default for new work).</li>
  <li><strong>Mobile (<code>MobSF</code>) and IoT get an intro, not a deep dive</strong> — each is a full discipline of its own, with its own module-length treatment elsewhere on this site (or a future one); what matters here is knowing the tool names and what category of surface they cover.</li>
  <li><strong>The theme of this closing topic is defense.</strong> Everything attacked in this module has a blue-team counterpart: a <strong>SIEM</strong> ingesting the logs, a <strong>detection engineer</strong> turning a technique into a rule, and <strong>MITRE ATT&amp;CK</strong> as the shared map between what red teams do and what blue teams watch for. A <strong>purple team</strong> is simply red and blue running that loop together, on purpose.</li>
</ul>
<p><strong>Mantra:</strong> "The exploit gets you in the door; the report, the CVSS score, and the detection rule someone builds afterward are what actually make the organization safer next time — that loop is what this whole module has been building toward."</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Why this is the wrap-up topic, not just one more attack surface</h3>
<p>Every topic before this one answered "how do you find and prove a weakness?" This one answers three different questions that a real engagement can't skip: <em>how do you communicate what you found so it actually gets fixed</em> (reporting), <em>what changes when the target isn't a server in a rack but an API-driven cloud account, a container, or a phone</em> (modern surfaces), and <em>what does the organization on the receiving end of all this need to do with it</em> (blue/purple team). It closes the module by turning attacker skill into organizational improvement — which was the entire point, all the way back to the CIA triad and "why authorized testing exists" in Foundations, Ethics &amp; Legal.</p>

<h3>Anatomy of a professional pentest report</h3>
<p>Reports vary in template from firm to firm, but a credible one always contains the same core parts:</p>
<ul>
  <li><strong>Executive summary</strong> — one to two pages, written for people who will never read the technical findings: overall risk posture, the handful of findings that matter most in business terms (data exposure, financial impact, compliance exposure), and a plain-English bottom line. No CVE numbers, no payloads, no jargon.</li>
  <li><strong>Scope &amp; methodology recap</strong> — what was tested, when, by whom, and against which methodology (PTES, NIST SP 800-115, or the client's own framework) — establishes exactly what the report does and doesn't cover.</li>
  <li><strong>Technical findings</strong> — the heart of the report. Each finding gets its own entry: a title, a description of the flaw, the specific affected asset (host, URL, S3 bucket, API endpoint), step-by-step reproduction instructions a client engineer can follow exactly, <strong>evidence</strong> (screenshots, request/response captures, command output — enough to prove it, not a full data dump), a <strong>CVSS</strong> score and vector string (or an equivalent business-risk rating), and remediation guidance specific enough to act on (not just "patch the software").</li>
  <li><strong>Risk summary / heatmap</strong> — findings rolled up by severity, often as a simple table or chart, so a reader can see the shape of the risk at a glance before diving into details.</li>
  <li><strong>Appendices</strong> — raw scanner output, tool versions used, and anything too granular for the main body but useful for the client's own records.</li>
  <li><strong>Retest section</strong> — added after the client applies fixes: for each original finding, confirm whether it's now resolved, still present, or only partially mitigated. A pentest without a retest leaves the client guessing whether their fix actually worked.</li>
</ul>

<h3>Executive summary vs. technical findings: two audiences, one report</h3>
<p>The single most common reporting mistake is writing one section for both audiences. An executive reading "an unauthenticated SSRF chain via the IMDS endpoint yielded a temporary IAM credential with S3:GetObject scope" has no way to act on it; an engineer reading "attackers could have accessed sensitive customer data" has no way to fix it. Good reports translate the same finding twice, deliberately: business impact and priority up top, exact technical mechanism and fix further down.</p>

<h3>Documenting as you go: Obsidian and CherryTree</h3>
<p>A report written entirely from memory after the engagement ends is where findings get lost, evidence goes missing, and reproduction steps turn vague. The fix is a note-taking discipline that runs the whole engagement, not just the write-up phase:</p>
<ul>
  <li><strong>Obsidian</strong> — a local, markdown-first note app with bidirectional linking and a graph view; popular for pentest notes because a "vault" per engagement can hold one note per host/finding, cross-link related findings, and embed screenshots and code blocks directly, with everything staying in plain markdown files on disk (nothing locked into a proprietary format).</li>
  <li><strong>CherryTree</strong> — a hierarchical, tree-structured note app (each host or phase becomes a node with child nodes underneath) that's long been a staple in the OSCP/CTF community specifically because its outline structure mirrors a pentest's own structure (recon → host → service → finding), and it embeds images, code, and rich text directly in each node.</li>
</ul>
<p>Either tool works; the habit matters more than the choice: log the command run, the raw output, and a screenshot the moment a finding is confirmed — not at the end of a multi-week engagement when the details have blurred together.</p>

<h3>Cloud, containers, mobile, IoT: same principles, new shape</h3>
<p>Most organizations today don't run a rack of self-managed servers — they run workloads on AWS/Azure/GCP, packaged into containers orchestrated by Kubernetes, alongside a mobile app and, increasingly, IoT devices. None of this changes the fundamentals from earlier topics (authorization, scope, CVSS, reporting) — it changes <em>where the weaknesses live</em>: from "outdated service on a host" to "an over-permissive IAM policy," "a container image with a known-vulnerable base layer," "a misconfigured Kubernetes RBAC role," or "an Android app that ships an API key in its APK." The <strong>shared responsibility model</strong> is the concept that governs all of it: the cloud provider is responsible for the security <em>of</em> the cloud (physical data centers, the hypervisor, the internals of managed services); the customer is responsible for security <em>in</em> the cloud (how they configure IAM, how they write their application code, what they put in a storage bucket, how they lock down a container image). A cloud pentest, almost by definition, only ever tests the customer's half of that line — the provider's half is permanently out of scope, no matter how curious a finding makes you.</p>

<h3>Why this topic ends on defense</h3>
<p>Every technique this module has taught — ARP spoofing, SQL injection, Kerberoasting, phishing pretexts, cloud metadata SSRF — has a mirror image on the defensive side: something a <strong>SIEM</strong> could log, a <strong>detection engineer</strong> could turn into an alert, and a defender mapping to <strong>MITRE ATT&amp;CK</strong> could use to measure their own coverage. Ending the module here is deliberate: the entire justification for teaching any of this, back in Foundations, Ethics &amp; Legal, was that organizations pay skilled people to find these weaknesses <em>before</em> a real attacker does — and the other half of that sentence is that the finding only has value if someone on the defending side turns it into detection and remediation. A <strong>purple team</strong> exercise is exactly that loop made explicit and collaborative: red team runs a technique, blue team tries to catch it, and both sides compare notes in real time.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>From finding to fixed: the loop this topic closes</h3>
<pre><code class="language-text">Finding discovered  →  Logged in real time      →  Structured into report      →  Delivered + retest   →  Mapped to ATT&amp;CK   →  Blue team builds
 (during any earlier      (Obsidian / CherryTree:      (finding + evidence +          (client fixes it,       technique             detection (SIEM rule)
  topic's techniques)      command, output, screenshot)  CVSS + remediation)           tester confirms)        (e.g. T1552.005)       → purple team validates
</code></pre>
<p>Every earlier topic in this module produces the leftmost box. This topic is everything to the right of it — and the loop doesn't actually close until the rightmost box happens, which is why "the exploit is the easy part" from the Foundations mantra was true from the very first topic.</p>

<h3>CVSS score to severity rating, applied inside a report</h3>
<p>Vulnerability Assessment covers how a CVSS score is actually calculated (Base, Temporal/Threat, Environmental metric groups, v3.1 vs. v4.0); what matters for reporting is the standard mapping every reader of a report is expected to recognize on sight:</p>
<table>
  <thead><tr><th>CVSS v3.1 score</th><th>Qualitative severity</th></tr></thead>
  <tbody>
    <tr><td>0.0</td><td>None</td></tr>
    <tr><td>0.1 – 3.9</td><td>Low</td></tr>
    <tr><td>4.0 – 6.9</td><td>Medium</td></tr>
    <tr><td>7.0 – 8.9</td><td>High</td></tr>
    <tr><td>9.0 – 10.0</td><td>Critical</td></tr>
  </tbody>
</table>
<p>A report's risk summary/heatmap is almost always this table applied across every finding — which is why a consistent, defensible CVSS score per finding (not a gut-feel "High" with no vector string behind it) is what separates a credible report from an opinionated one.</p>

<h3>The modern-surface map: one pattern, repeated per environment</h3>
<p>Notice the same three-tool shape recurring across every surface below: a <strong>read-only configuration auditor</strong>, an <strong>active exploitation/live-attack tool</strong>, and (where one exists) a <strong>compliance/benchmark checker</strong>. Recognizing this pattern is more useful than memorizing any single tool's flags.</p>
<table>
  <thead><tr><th>Surface</th><th>Read-only config auditor</th><th>Active exploitation / live-attack tool</th><th>Compliance / benchmark tool</th></tr></thead>
  <tbody>
    <tr><td>AWS / Azure / GCP</td><td><code>ScoutSuite</code>, <code>prowler</code></td><td><code>pacu</code> (AWS)</td><td><code>prowler</code> (CIS AWS/Azure/GCP benchmarks)</td></tr>
    <tr><td>Containers &amp; Kubernetes</td><td><code>trivy</code> (image/cluster scan)</td><td><code>kube-hunter</code> (live cluster hunting)</td><td><code>kube-bench</code> (CIS Kubernetes Benchmark)</td></tr>
    <tr><td>Mobile (Android/iOS)</td><td><code>MobSF</code> static analysis</td><td><code>MobSF</code> dynamic analysis (Frida-based instrumentation)</td><td>— (app-store review guidelines instead)</td></tr>
    <tr><td>IoT (intro only)</td><td>Firmware extraction/analysis</td><td>Physical (UART/JTAG) and radio (BLE/Zigbee) attacks</td><td>—</td></tr>
  </tbody>
</table>

<h3>Attack technique to defense: the ATT&amp;CK-to-SIEM mapping</h3>
<p>Blue teams don't defend against "hacking" in the abstract — they defend against specific, named techniques, each with a MITRE ATT&amp;CK ID, mapped to a tactic (the attacker's goal) and a detection data source. The cloud-metadata SSRF chain covered in Mechanics below is a clean example of the whole mapping in miniature:</p>
<table>
  <thead><tr><th>ATT&amp;CK Tactic</th><th>Technique</th><th>What a SIEM would look for</th></tr></thead>
  <tbody>
    <tr><td>Credential Access</td><td>T1552.005 — Unsecured Credentials: Cloud Instance Metadata API</td><td>A workload's IAM role credentials used from an IP/session that never actually touched the instance's metadata endpoint, or a burst of <code>GetCallerIdentity</code>/<code>AssumeRole</code> calls right after unusual outbound traffic from a web-facing host</td></tr>
    <tr><td>Initial Access</td><td>T1190 — Exploit Public-Facing Application</td><td>Anomalous outbound requests from an application server to an internal or link-local address (the SSRF itself, before it ever reaches the metadata endpoint)</td></tr>
    <tr><td>Discovery</td><td>T1613 / T1526 — Container and Resource Discovery (cloud)</td><td>An identity enumerating IAM roles, S3 buckets, or Kubernetes API objects far outside its normal, narrow baseline of calls</td></tr>
  </tbody>
</table>
<p>This is exactly what "detection engineering" means in practice: pick a technique, decide what evidence it necessarily leaves behind, and write a rule that fires on that evidence — covered further in Mechanics.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Reporting, Cloud, Container & Defense Mechanics', html: `
<h3>Writing the report: structure in practice</h3>
<p>A typical engagement's note vault, whether in Obsidian or CherryTree, mirrors the report it will become:</p>
<pre><code class="language-text">Engagement - Acme Corp Q3/
├── 00-scope-and-RoE.md
├── 01-recon/
│   └── subdomains, whois, OSINT notes
├── 02-scanning-enumeration/
│   └── nmap output, service versions
├── 03-findings/
│   ├── F01-s3-bucket-public-read.md
│   ├── F02-imds-ssrf-credential-theft.md
│   └── F03-k8s-rbac-overpermissive.md
└── 04-report-draft.md
</code></pre>
<p>Each finding note (<code>F01</code>, <code>F02</code>, ...) captures, at the moment it's confirmed: the exact command/request used, raw output, a screenshot, the affected asset, and a first-pass CVSS vector — so writing the final report becomes assembly, not reconstruction from memory.</p>

<h3>Cloud pentesting: shared responsibility, in one line per provider</h3>
<p>Before any tool runs, confirm which half of the shared-responsibility line you're even allowed to touch, and what the specific provider's own pentest policy currently requires (this changes — always check the current published policy, not last year's memory of it):</p>
<ul>
  <li><strong>AWS</strong> — many core services (EC2, RDS, CloudFront, API Gateway, Lambda, Lightsail) can be tested without prior AWS approval; <strong>DDoS simulation, command-and-control testing, and red/blue/purple-team exercises require AWS's prior approval</strong>, and DDoS simulation specifically must be run through an AWS-approved partner against a Shield Advanced–protected resource.</li>
  <li><strong>Azure</strong> — prior notification is no longer required, but all testing must comply with the published <strong>Microsoft Cloud Unified Penetration Testing Rules of Engagement</strong>; testing your own tenant, surge-capacity testing, and attempting to break out of a shared container service (with immediate disclosure on success) are explicitly permitted, while post-compromise actions like lateral movement or dumping secrets are explicitly prohibited.</li>
  <li><strong>GCP</strong> — no prior approval is required as long as testing stays within your own projects and the Cloud Platform Acceptable Use Policy; <strong>denial-of-service testing and anything that could impact other tenants on shared infrastructure is strictly prohibited</strong>, full stop.</li>
</ul>

<h3>Cloud configuration auditing: ScoutSuite and prowler</h3>
<p><code>ScoutSuite</code> and <code>prowler</code> are both read-only: they call the provider's own APIs to pull configuration and compare it against known-bad patterns, and never modify anything in the account.</p>
<pre><code class="language-bash"># ScoutSuite — pulls config via the cloud provider's API and produces a
# single, offline, self-contained HTML report (no data leaves your machine):
pip install scoutsuite

scout aws --profile &lt;profile&gt;
scout azure --cli
scout gcp --service-account --key-file &lt;path-to-key.json&gt;
# → opens scoutsuite-report/scoutsuite_results_*.html</code></pre>
<pre><code class="language-bash"># prowler — CIS-benchmark-aware, checks-based cloud security auditor;
# modern CLI takes the provider as a subcommand:
pip install prowler

prowler aws --profile &lt;profile&gt;
prowler aws --severity critical high --compliance cis_2.0_aws
prowler azure --az-cli-auth
prowler gcp --credentials-file &lt;path-to-key.json&gt;
prowler dashboard   # local web dashboard over the latest results</code></pre>

<h3>Active cloud exploitation: pacu</h3>
<p><code>pacu</code> (Rhino Security Labs) is categorically different from ScoutSuite/prowler: it's an <strong>exploitation framework</strong> that actively uses discovered credentials and misconfigurations to escalate privilege, enumerate further, and prove impact inside an AWS account — which means it needs the same "actual exploitation, not just a scan" authorization tier as any other active-exploitation tool covered earlier in this module.</p>
<pre><code class="language-bash">python3 pacu.py
# inside the Pacu shell:
Pacu (new:default) &gt; import_keys --all
Pacu (default:default) &gt; run iam__enum_permissions
Pacu (default:default) &gt; run iam__privesc_scan
Pacu (default:default) &gt; data ec2</code></pre>

<h3>Cloud instance metadata, SSRF, and the IMDSv2 mitigation</h3>
<p>Every major cloud instance exposes a link-local metadata endpoint (on AWS, <code>http://169.254.169.254/latest/meta-data/</code>) that answers unauthenticated requests from anything running <em>on</em> the instance — including, critically, an IAM role's temporary credentials. The classic chain: a web app has an SSRF flaw (Server-Side Request Forgery, covered in Web Application Hacking) that lets an attacker make the server fetch an attacker-chosen URL; point it at the metadata endpoint, and the original IMDSv1 protocol would simply hand back the instance's IAM credentials over a plain GET, no authentication required.</p>
<pre><code class="language-bash"># IMDSv1 — classic SSRF-to-credential-theft, a single unauthenticated GET:
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/&lt;role-name&gt;

# IMDSv2 — session-oriented; requires a PUT to fetch a token first, using a
# custom header most SSRF bugs can't forge (they usually can only issue GET
# requests with attacker-controlled URLs, not attacker-controlled headers):
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" \\
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")

curl -H "X-aws-ec2-metadata-token: $TOKEN" \\
  http://169.254.169.254/latest/meta-data/iam/security-credentials/&lt;role-name&gt;</code></pre>
<p>IMDSv2 also defaults to a network hop limit of 1, which blocks the token request from succeeding through an extra network hop (such as from inside a container or behind a misconfigured proxy) — a second layer of defense-in-depth against exactly the kind of SSRF chain most real breaches have used. Enforcing IMDSv2-only (and disabling IMDSv1) account-wide is a standard hardening recommendation in any cloud pentest report that finds this pattern.</p>

<h3>Containers &amp; Kubernetes: trivy, kube-bench, kube-hunter</h3>
<pre><code class="language-bash"># trivy — single binary covering image vulnerabilities, misconfigurations,
# secrets, and (with the k8s subcommand) live cluster scanning:
trivy image --severity HIGH,CRITICAL --ignore-unfixed &lt;image&gt;:&lt;tag&gt;

trivy k8s --report summary cluster
trivy k8s --compliance k8s-cis --report summary cluster</code></pre>
<pre><code class="language-bash"># kube-bench — checks a running cluster's kubelet/apiserver/etcd config
# against the CIS Kubernetes Benchmark (configuration only, not live attack):
docker run --rm --pid=host \\
  -v /etc:/etc:ro -v /var/lib/kubelet:/var/lib/kubelet:ro \\
  -v $(which kubectl):/usr/local/mount-from-host/bin/kubectl:ro \\
  aquasec/kube-bench:latest run</code></pre>
<pre><code class="language-bash"># kube-hunter — actively probes a cluster's live attack surface (open
# dashboards, exposed kubelet API, misconfigured RBAC); passive by default,
# --active enables intrusive checks. NOTE: the upstream project has been
# archived since 2024 — still taught here for the technique it demonstrates,
# but treat kube-bench + trivy's k8s operator as the actively maintained
# default for new work, per the accuracy note below.
docker run -it --rm --network host aquasec/kube-hunter          # from inside the cluster network
kube-hunter --remote &lt;cluster-ip-or-domain&gt; --active            # from outside, with authorization</code></pre>
<p>A managed control plane (EKS/AKS/GKE) reintroduces the provider-authorization question from earlier: the worker nodes and workloads you deploy are yours to test under the client's authorization, but the managed control plane itself belongs to the same "of the cloud" half of the shared-responsibility line as any other managed service — treat it under that provider's own pentest policy, not the client's.</p>

<h3>Mobile (MobSF) and IoT — a brief intro</h3>
<pre><code class="language-bash"># MobSF — one container, static + dynamic analysis for Android/iOS/Windows apps:
docker run -it --rm -p 8000:8000 opensecurity/mobile-security-framework-mobsf:latest
# then browse to http://127.0.0.1:8000 and drop in an APK/IPA, or drive it via API:
curl -F "file=@app.apk" http://127.0.0.1:8000/api/v1/upload \\
  -H "Authorization: &lt;mobsf-api-key&gt;"</code></pre>
<p>MobSF's static analyzer extracts a mobile app's manifest, permissions, certificates, and hardcoded secrets from the binary alone; its dynamic analyzer runs the app in an instrumented environment (using Frida under the hood) to observe real runtime behavior, network traffic, and crypto calls. <strong>IoT</strong> security is introduced here only as a category to be aware of, not a skill this topic builds: it layers firmware analysis (extracting and inspecting an embedded device's filesystem), physical access (UART/JTAG debug interfaces), and radio protocols (BLE, Zigbee) on top of everything else in this module — each of those is a discipline deep enough to be its own course, and each one adds its own physical-access and RF-specific legal considerations on top of the authorization basics from Foundations, Ethics &amp; Legal.</p>

<h3>Blue/purple team: turning a technique into a detection</h3>
<p>Detection engineering, in practice, is a repeatable loop: pick an attacker technique, identify what evidence it necessarily produces, write a rule against that evidence in the SIEM, then validate the rule actually fires by having a red or purple team run the real technique against it.</p>
<pre><code class="language-text">1. Technique:        credential theft via cloud instance metadata (ATT&amp;CK T1552.005)
2. Evidence it must leave behind:
     - CloudTrail: GetCallerIdentity / AssumeRole calls using an instance-role
       credential, originating from outside the instance's own known egress pattern
     - VPC Flow Logs: outbound traffic from an app server to 169.254.169.254
       that doesn't match the app's normal, documented behavior
3. SIEM rule (conceptual):
     ALERT WHEN instance-role credential is used from a source IP/session
     that never made the corresponding metadata-token request from that instance
4. Validate: purple team runs the SSRF→IMDS chain from Mechanics above
   against a lab instance and confirms the rule fires within the expected window
</code></pre>
<p><strong>MITRE ATT&amp;CK</strong> (Mental Model) is what makes this repeatable across an entire security program rather than one clever rule at a time: mapping every technique a red team runs, and every rule a blue team builds, to the same shared technique IDs turns "did we cover this?" into a checklist instead of a guess — and is exactly the kind of ATT&amp;CK-coverage mapping most mature SOCs maintain as a living artifact.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Worked Examples', html: `
<h3>Example 1 — From a ScoutSuite finding to a finished report entry</h3>
<p>A ScoutSuite scan of an authorized client AWS account flags a publicly readable S3 bucket. Turning that raw finding into a report entry:</p>
<pre><code class="language-bash">scout aws --profile client-prod
# → HTML report flags: "S3 bucket 'client-uploads-prod' allows public READ"

aws s3api get-bucket-acl --bucket client-uploads-prod --profile client-prod
# → confirms grantee: http://acs.amazonaws.com/groups/global/AllUsers, permission: READ

aws s3 ls s3://client-uploads-prod/ --profile client-prod --no-sign-request
# → confirms the bucket is readable anonymously, without any client credentials at all</code></pre>
<p>That evidence becomes a report finding with exactly the anatomy from What &amp; Why:</p>
<ul>
  <li><strong>Title:</strong> Publicly Readable S3 Bucket Exposes Customer Uploads</li>
  <li><strong>Affected asset:</strong> <code>s3://client-uploads-prod</code></li>
  <li><strong>CVSS v3.1:</strong> 7.5 (High) — <code>AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N</code> (network-reachable, no privileges or user interaction needed, high confidentiality impact, no integrity/availability impact)</li>
  <li><strong>Evidence:</strong> the three command outputs above, plus a screenshot of an anonymous <code>aws s3 ls</code> listing real file names</li>
  <li><strong>Business risk (executive summary language):</strong> "Customer-uploaded files are downloadable by anyone on the internet who guesses or discovers the bucket name, with no login required."</li>
  <li><strong>Remediation:</strong> remove the public-read grant, enable S3 Block Public Access at the account level, and add the bucket to the client's ScoutSuite/prowler baseline so a regression trips a future scan.</li>
  <li><strong>Retest:</strong> re-run the same three commands after the client applies the fix; confirm the anonymous <code>aws s3 ls</code> now returns Access Denied.</li>
</ul>
<p>Notice the finding never needed to download the actual customer files to prove impact — a directory listing and an ACL check are enough evidence, in line with the "minimum evidence needed" data-handling principle from Foundations, Ethics &amp; Legal's Legal &amp; Safety topic.</p>

<h3>Example 2 — IMDSv1 SSRF credential theft, the IMDSv2 fix, and the detection that catches it</h3>
<p>A web app in the client's authorized scope has an SSRF flaw (found the way Web Application Hacking teaches). Chaining it into cloud credential theft, and then closing the loop with the defensive side this topic adds:</p>
<pre><code class="language-http">POST /api/fetch-preview HTTP/1.1
Host: app.client-lab.internal
Content-Type: application/json

{"url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/app-role"}</code></pre>
<p>On an instance still running <strong>IMDSv1</strong>, that single unauthenticated request returns the role's temporary <code>AccessKeyId</code>, <code>SecretAccessKey</code>, and <code>SessionToken</code> — full IAM credentials, exfiltrated through an application bug that was never supposed to touch AWS at all. On an instance enforcing <strong>IMDSv2</strong>, the same request fails: the SSRF vector can only make the app issue a simple <code>GET</code> with attacker-controlled content in the response body, not the two-step <code>PUT</code>-for-a-token dance IMDSv2 requires — which is exactly why "require IMDSv2, disable IMDSv1" is the headline remediation for this entire finding class.</p>
<p>Following the ATT&amp;CK-to-SIEM mapping from Mental Model, the finding's report entry also documents the detection side, closing this topic's loop end to end: CloudTrail should show <code>sts:AssumeRole</code>/<code>GetCallerIdentity</code> activity under the <code>app-role</code> identity from an unexpected source shortly after the SSRF request — a rule watching for that pattern (mapped to ATT&amp;CK T1552.005) is what a blue team builds from this exact finding, and what a purple-team follow-up session would deliberately re-trigger to confirm actually fires.</p>

<h3>Example 3 — A container/Kubernetes finding, start to report</h3>
<p>A client's CI pipeline builds and deploys an internal service; the engagement is authorized to test the client's own cluster and images (not the managed control plane, per the provider-authorization note in Mechanics):</p>
<pre><code class="language-bash"># 1. Image scan finds a known-vulnerable base layer:
trivy image --severity CRITICAL --ignore-unfixed client-registry/internal-api:1.4.0
# → CVE-2024-XXXXX in an outdated OpenSSL package, CVSS 9.8 (Critical)

# 2. CIS benchmark check on the cluster finds a config gap alongside it:
docker run --rm --pid=host -v /etc:/etc:ro -v /var/lib/kubelet:/var/lib/kubelet:ro \\
  -v $(which kubectl):/usr/local/mount-from-host/bin/kubectl:ro \\
  aquasec/kube-bench:latest run
# → flags: kubelet --anonymous-auth is not explicitly set to false

# 3. Live hunt (explicitly authorized, in-scope) confirms it's actually reachable:
kube-hunter --remote &lt;cluster-ip&gt; --active
# → confirms an unauthenticated request to the kubelet API succeeds</code></pre>
<p>Three tools, three layers of the same finding: a vulnerable dependency baked into the image (<code>trivy</code>), a configuration gap that would let an attacker who reaches the node exploit it further (<code>kube-bench</code>), and live proof that the gap is actually reachable, not just theoretical (<code>kube-hunter</code>). The report bundles all three as one finding — "Anonymous Kubelet API Access Combined with a Critical Vulnerable Base Image" — rather than three disconnected line items, because that's the real, chained risk a reader needs to understand.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '⚠️ Defenses & Legal', html: `
<div class="callout danger">
  <div class="callout-title">⚠️ Cloud pentests need the provider's authorization too — not just the asset owner's</div>
  <p>The asset owner's written authorization (Foundations, Ethics &amp; Legal) is necessary but, on cloud/managed infrastructure, <strong>not sufficient</strong> on its own. AWS, Azure, and GCP each publish their own penetration-testing / acceptable-use policy governing what can be tested without prior notice and what still needs the provider's explicit approval — DDoS simulation, command-and-control testing, and red/blue/purple-team exercises are common examples that need AWS's prior sign-off even on a fully client-authorized engagement; Azure requires compliance with its published Rules of Engagement regardless of notification; GCP strictly prohibits anything that risks denial-of-service or impacts other tenants on shared infrastructure. <strong>Always pull the specific provider's current published policy before an engagement starts</strong> — these policies are updated periodically, and testing under an out-of-date understanding of them is exactly the kind of scope violation covered next.</p>
</div>

<h3>The shared-responsibility line is also the scope line</h3>
<p>The customer's half of shared responsibility (IAM, configuration, application code, data, container images, cluster RBAC) is what a cloud/container pentest tests. The provider's half — physical data centers, the hypervisor, the internals of a fully managed service, a managed Kubernetes control plane's own implementation — is <strong>never</strong> in scope for a customer-authorized engagement, no matter how interesting a finding there might look. If a technique or a tool's output starts pointing at infrastructure the provider operates rather than infrastructure the client configured, stop and treat it exactly like the "scope creep" guidance in Foundations, Ethics &amp; Legal: document it without further probing, and report it to the engagement point of contact rather than continuing.</p>

<h3>Active exploitation tools carry a higher authorization bar than config auditors</h3>
<p>ScoutSuite and prowler are read-only and low-risk to run against an authorized account. <code>pacu</code>, <code>kube-hunter --active</code>, and MobSF's dynamic analysis are categorically different — they actively exploit, probe, or execute against a live target, which is the same "actual exploitation, not just a scan" authorization tier the rest of this module has treated as a distinct, higher bar throughout (Exploitation &amp; Metasploit, Post-Exploitation &amp; Privilege Escalation). Confirm the Rules of Engagement explicitly covers active/exploitative tooling for the specific surface being tested, not just "a cloud assessment" in general terms.</p>

<h3>Evidence, retention, and responsible disclosure still apply here</h3>
<p>A cloud/container finding routinely surfaces the same kind of sensitive material Foundations, Ethics &amp; Legal already covers for any pentest: IAM credentials, customer data in a bucket, secrets baked into a container image. The same standard applies without modification — capture the minimum evidence needed to prove impact (a directory listing, a redacted credential, one file name — not a full data export), and destroy retained evidence at the engagement's agreed retention period. If a finding also happens to be a genuine, previously-unknown vulnerability in the cloud provider's own platform (rather than the client's configuration of it), route it through the provider's own vulnerability disclosure or bug-bounty program using the coordinated-disclosure practice from Foundations, Ethics &amp; Legal — not the client's report, since the client doesn't own that half of the fix.</p>

<h3>This is a defense-first course, and the report is where that shows up</h3>
<p>Everything in this closing topic — the report's structure, the CVSS rating that lets severity be compared apples-to-apples, the ATT&amp;CK mapping that lets a technique translate into a detection rule — exists to make the organization measurably better at catching a real attacker, not just to prove a tester was clever. A pentest that produces a technically impressive exploit chain but no usable report, no prioritized remediation, and no path to detection has, in the terms this whole module opened with, failed at the one thing that actually justifies doing any of it: making the defender's job easier the next time someone without permission tries the same thing.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'cheat-sheet', title: '📋 Cheat Sheet', html: `
<table>
  <thead><tr><th>Category</th><th>Item</th><th>What it means</th></tr></thead>
  <tbody>
    <tr><td>Report part</td><td>Executive summary</td><td>Business-risk overview for leadership; no jargon, no CVE numbers</td></tr>
    <tr><td>Report part</td><td>Technical findings</td><td>Title, description, affected asset, reproduction steps, evidence, CVSS, remediation per finding</td></tr>
    <tr><td>Report part</td><td>Retest</td><td>Post-fix confirmation: resolved / still present / partially mitigated, per finding</td></tr>
    <tr><td>Risk rating</td><td>CVSS v3.1 bands</td><td>0.0 None · 0.1–3.9 Low · 4.0–6.9 Medium · 7.0–8.9 High · 9.0–10.0 Critical</td></tr>
    <tr><td>Note-taking</td><td>Obsidian</td><td>Local markdown vault, bidirectional links, graph view — one note per host/finding</td></tr>
    <tr><td>Note-taking</td><td>CherryTree</td><td>Hierarchical tree-structured notes; long-time OSCP/CTF community staple</td></tr>
    <tr><td>Cloud concept</td><td>Shared responsibility model</td><td>Provider secures "of the cloud"; customer secures "in the cloud" — defines pentest scope</td></tr>
    <tr><td>Cloud tool</td><td>ScoutSuite</td><td>Read-only multi-cloud (AWS/Azure/GCP+) config auditor; offline HTML report</td></tr>
    <tr><td>Cloud tool</td><td>prowler</td><td>Checks-based cloud security/CIS-benchmark auditor; <code>prowler aws/azure/gcp</code></td></tr>
    <tr><td>Cloud tool</td><td>pacu</td><td>Active AWS exploitation framework (Rhino Security Labs) — not read-only</td></tr>
    <tr><td>Cloud concept</td><td>IMDS / metadata endpoint</td><td><code>169.254.169.254</code> — instance metadata, incl. IAM credentials; classic SSRF target</td></tr>
    <tr><td>Cloud mitigation</td><td>IMDSv2</td><td>Session/token-based (PUT for token, custom header) — blocks most simple-GET SSRF chains; hop limit 1</td></tr>
    <tr><td>Container tool</td><td>trivy</td><td>Image + cluster vulnerability, misconfig, and secret scanner; single binary</td></tr>
    <tr><td>Container tool</td><td>kube-bench</td><td>CIS Kubernetes Benchmark compliance checker (config only)</td></tr>
    <tr><td>Container tool</td><td>kube-hunter</td><td>Active live-cluster attack-surface hunter; archived upstream since 2024, still taught for technique</td></tr>
    <tr><td>Mobile tool</td><td>MobSF</td><td>Static + dynamic (Frida-based) analysis for Android/iOS/Windows apps</td></tr>
    <tr><td>Modern surface</td><td>IoT (intro only)</td><td>Firmware analysis + physical (UART/JTAG) + radio (BLE/Zigbee) — own discipline</td></tr>
    <tr><td>Defense concept</td><td>SIEM</td><td>Central log aggregation/correlation platform a blue team detects from</td></tr>
    <tr><td>Defense concept</td><td>Detection engineering</td><td>Turning a specific attacker technique into a validated, tuned detection rule</td></tr>
    <tr><td>Defense concept</td><td>MITRE ATT&amp;CK mapping</td><td>Tying red-team techniques and blue-team detections to the same shared technique IDs</td></tr>
    <tr><td>Defense concept</td><td>Purple team</td><td>Red + blue running the attack-then-detect loop together, deliberately</td></tr>
    <tr><td>ATT&amp;CK example</td><td>T1552.005</td><td>Unsecured Credentials: Cloud Instance Metadata API (Credential Access tactic)</td></tr>
    <tr><td>Cloud provider rule</td><td>AWS</td><td>Many services pre-approved; DDoS/C2/red-blue-purple exercises need AWS's prior approval</td></tr>
    <tr><td>Cloud provider rule</td><td>Azure</td><td>No notification required; must comply with Microsoft's published pentest Rules of Engagement</td></tr>
    <tr><td>Cloud provider rule</td><td>GCP</td><td>No prior approval needed within your own projects/AUP; DoS and multi-tenant impact strictly prohibited</td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">What should a professional penetration test report contain?</div>
<div class="qa-a">
<p>At minimum: an executive summary written for a non-technical, business-risk audience; a scope and methodology recap; a set of technical findings, each with a title, description, affected asset, reproducible steps, supporting evidence (screenshots, captured requests, command output), a CVSS score/vector or equivalent risk rating, and specific remediation guidance; a risk summary or heatmap rolling findings up by severity; and a retest section confirming, after the client applies fixes, whether each finding is resolved, still present, or partially mitigated. The executive summary and the technical findings are deliberately written for two different audiences — leadership needs business impact in plain language, engineers need the exact technical mechanism and fix.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What is the cloud shared-responsibility model, and why does it matter for a cloud pentest?</div>
<div class="qa-a">
<p>It's the division of security duties between a cloud provider and its customer: the provider secures everything "of the cloud" — physical data centers, the hypervisor, the internals of fully managed services — while the customer secures everything "in the cloud" — IAM configuration, application code, data, container images, and how they've configured the services they use. It matters directly for scope: a cloud pentest, almost by definition, only ever tests the customer's half of that line. The provider's half is permanently out of scope for a customer-authorized engagement, no matter what a scan turns up there, because the customer doesn't own — and can't authorize testing of — infrastructure the provider operates.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">How does IMDSv2 mitigate SSRF-based cloud credential theft?</div>
<div class="qa-a">
<p>IMDSv1 answers a simple, unauthenticated GET request to the instance metadata endpoint with sensitive data, including an attached IAM role's temporary credentials — which means an SSRF bug that lets an attacker make the server fetch an arbitrary URL can point it at the metadata endpoint and steal those credentials directly. IMDSv2 makes the endpoint session-oriented: a caller must first issue a PUT request carrying a custom header to obtain a short-lived session token, then include that token in a custom header on every subsequent GET. Most SSRF vulnerabilities can only make the vulnerable server issue simple GET requests with an attacker-controlled URL — they typically can't inject custom headers or switch the HTTP method to PUT — so the two-step, header-based flow blocks the vast majority of real-world SSRF-to-credential-theft chains. IMDSv2 also defaults to a network hop limit of 1, adding a second layer of defense against the token request succeeding through an extra hop, such as from inside a container.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between a tool like ScoutSuite or prowler and a tool like pacu?</div>
<div class="qa-a">
<p>ScoutSuite and prowler are both read-only configuration auditors: they call the cloud provider's own APIs to pull configuration data and compare it against known-bad patterns (public buckets, overly permissive IAM policies, unencrypted resources), and never modify anything in the account — closer in spirit to a vulnerability scanner. Pacu is categorically different: it's an active exploitation framework that takes discovered credentials or misconfigurations and actually uses them — escalating privilege, enumerating further, extracting data — to prove real impact inside an AWS account, the same way an exploitation tool like Metasploit does on a traditional network. That distinction matters for authorization: read-only auditing is comparatively low-risk to run against an authorized account, while active exploitation needs the same higher authorization bar this module has applied to any other exploitation activity.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between trivy, kube-bench, and kube-hunter?</div>
<div class="qa-a">
<p>They cover three different layers of container/Kubernetes security. Trivy scans container images and, via its <code>k8s</code> subcommand, live clusters for known vulnerabilities, misconfigurations, and exposed secrets — closest to a traditional vulnerability scanner, but aimed at images and cluster objects instead of hosts. Kube-bench checks a running cluster's configuration (kubelet, API server, etcd settings) against the CIS Kubernetes Benchmark — a compliance check, not a live attack. Kube-hunter actively probes a live cluster from the network for exploitable weaknesses like an exposed kubelet API or an open dashboard — the closest of the three to an active exploitation tool, though the project itself has been archived by its maintainer since 2024, so kube-bench plus trivy's cluster-scanning mode is generally the recommended default for new work, with kube-hunter still worth understanding for the technique it demonstrates.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What is purple teaming, and how does it relate to MITRE ATT&amp;CK?</div>
<div class="qa-a">
<p>A purple team exercise is a red team and a blue team running the attack-then-detect loop together, deliberately and collaboratively, rather than the red team operating covertly and reporting findings only at the end (as in a traditional red team engagement, covered in Foundations, Ethics &amp; Legal). MITRE ATT&amp;CK is the shared vocabulary that makes this collaboration concrete: the red team runs a specific, named technique (for example, T1552.005, credential theft via the cloud instance metadata API); the blue team checks in real time whether their detection stack actually caught it, mapped to that same technique ID; and any gap found becomes a specific, prioritized detection engineering task rather than a vague "we should probably detect cloud attacks better."</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Why does a security-focused engineer need to understand blue-team concepts like SIEM and detection engineering?</div>
<div class="qa-a">
<p>Because the value of an offensive finding is capped by what the defending organization can actually do with it. A finding reported without any sense of how it would be detected leaves the client only able to fix that one instance, not build lasting capability to catch the next attacker who tries something similar. Understanding that a SIEM centralizes and correlates logs, that detection engineering is the practice of turning a specific technique into a validated alert rule, and that MITRE ATT&amp;CK gives both red and blue teams a shared map of techniques and coverage, lets an offensive practitioner report findings in a way a blue team can directly act on — which is the throughline this entire module has been building toward since its first topic: authorized offensive testing exists specifically to make organizations more resilient against real attackers, not to showcase clever exploitation for its own sake.</p>
</div>
</div>
`}

]});
