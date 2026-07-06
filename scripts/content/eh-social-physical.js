window.PREP_SITE.registerTopic({
  id: 'eh-social-physical',
  module: 'eh',
  title: 'Social Engineering & Physical',
  estimatedReadTime: '27 min',
  tags: ['ethical-hacking', 'security', 'pentest', 'social-engineering', 'phishing', 'spear-phishing', 'vishing', 'pretexting', 'bec', 'physical-security', 'tailgating', 'badge-cloning'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<div class="callout danger">
  <div class="callout-title">⚠️ These vectors target people and premises — the authorization bar is higher, not the same</div>
  <p>Everything in this topic — phishing, vishing, pretexting, BEC simulation, tailgating, USB drops, badge cloning, lock-picking — is taught <strong>conceptually</strong>: the methodology and mindset a pentester uses, not a ready-to-run kit. A network pentest's written authorization covers systems; a social-engineering or physical engagement's authorization must additionally name <em>which people or premises</em> can be targeted, what's absolutely off-limits (no impersonating law enforcement or emergency responders, no physical contact or intimidation, no accessing anything beyond proving the door opened), and what to do if you're stopped — because these techniques manipulate real employees and can involve trespassing on real property. Get every one of those specifics in writing before anything here is practiced against anyone but yourself.</p>
</div>
<p><strong>Social engineering</strong> is the practice of manipulating human psychology — trust, authority, urgency, fear, helpfulness — to get a person to do something that bypasses a technical control: click a link, read out a one-time code, hold a door open, plug in a USB drive. <strong>Physical social engineering</strong> applies the same manipulation in person, to defeat physical access controls instead of (or on the way to) digital ones. Both exist as a tested discipline because the strongest firewall and the most current patch schedule don't matter if someone can simply be asked, convincingly enough, to open the door.</p>
<ul>
  <li><strong>The human attack surface is the target, not a bug.</strong> Every employee, contractor, and receptionist is a decision-maker who can be influenced — patching this "surface" means training and culture, not a software update, which is why this topic pairs every technique with the defense that actually counters it.</li>
  <li><strong>Email-borne social engineering</strong> — phishing (bulk), spear-phishing (targeted), and vishing (voice) — is simulated conceptually with platforms like <strong>GoPhish</strong> (open-source phishing-simulation framework: templates, tracked landing pages, campaign metrics) and <strong>SET</strong> (the Social-Engineer Toolkit, TrustedSec's <code>setoolkit</code>, covering spear-phishing and cloned-site attack vectors) — described here as methodology and what a simulated campaign measures, not as usable lure content.</li>
  <li><strong>BEC (Business Email Compromise)</strong> skips malware entirely: an attacker impersonates an executive or vendor and simply asks finance to redirect a payment — it's consistently one of the costliest categories of cybercrime the FBI's IC3 tracks, precisely because it needs no exploit at all.</li>
  <li><strong>Physical vectors</strong> — tailgating through a badge-controlled door, USB drops in a parking lot, cloning a weak RFID badge, picking a simple lock — test whether physical access controls hold up the same way phishing tests whether email/security awareness does. Covered at concept level only, and always under a scope that names the specific building, hours, and get-out-of-jail letter.</li>
  <li><strong>Defenses are the majority of the value here:</strong> recurring security-awareness training with simulated phishing, SPF/DKIM/<strong>DMARC</strong> email authentication, a blameless reporting culture, layered physical access controls, and MFA (ideally phishing-resistant) as the safety net when a credential does get phished anyway — all covered in depth in Defenses &amp; Legal below.</li>
</ul>
<p><strong>Mantra:</strong> "You're not testing a system here — you're testing a person who did nothing wrong except trust convincingly. Scope who can be targeted as carefully as you'd scope which server can be scanned, and let every finding turn into training, never into blame."</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What social engineering testing actually is</h3>
<p>A social-engineering assessment measures whether an organization's people, process, and culture — not its firewalls — would stop a realistic manipulation attempt. Instead of looking for a missing patch or a misconfigured server, the tester designs a believable <strong>pretext</strong> (a plausible cover story: "I'm from IT, I need you to verify your password reset," "I'm the new contractor, can you let me in, my hands are full") and measures whether that pretext, delivered through email, phone, or in person, gets the intended human reaction. <strong>Physical social engineering</strong> is the same discipline applied to buildings instead of inboxes: can a tester get past reception, through a badge reader, or into a server room using charm, confidence, and a plausible story instead of a lockpick or an exploit?</p>

<h3>Why this gets tested at all: the human element dominates real breaches</h3>
<p>Industry breach research consistently attributes the majority of real-world incidents to a human element rather than a pure technical exploit — Verizon's annual Data Breach Investigations Report (DBIR) has repeatedly found the human element (phishing, pretexting, credential misuse, simple error) present in roughly six out of every ten breaches it analyzes. Firewalls, patching, and network segmentation don't stop a convincingly pretexted phone call that talks a help-desk agent into resetting a CFO's password. Testing this layer answers the same question a network pentest answers for infrastructure: if a real attacker tried this against our actual people, right now, would it work — and does anyone notice and report it?</p>

<h3>The core categories, and how they differ</h3>
<table>
  <thead><tr><th>Vector</th><th>Channel</th><th>Targeting</th><th>Typical goal</th></tr></thead>
  <tbody>
    <tr><td><strong>Phishing</strong></td><td>Email, bulk</td><td>Broad — many recipients, generic lure</td><td>Credential harvest, malware execution, click-rate/report-rate metrics</td></tr>
    <tr><td><strong>Spear-phishing</strong></td><td>Email, targeted</td><td>A specific person or small group, researched via OSINT</td><td>Higher-value credential or access, often a stepping stone to a specific system</td></tr>
    <tr><td><strong>Vishing</strong></td><td>Phone / voice</td><td>Usually a specific role (help desk, IT support, finance)</td><td>Verbal credential/code disclosure, password reset, remote-access grant</td></tr>
    <tr><td><strong>Pretexting</strong></td><td>Any — in person, phone, email, or chained across all three</td><td>Whoever holds the access the pretext needs</td><td>An invented, credible identity/reason used to justify a request</td></tr>
    <tr><td><strong>BEC (Business Email Compromise)</strong></td><td>Email, often no malware at all</td><td>Finance/payroll staff, via a spoofed or compromised executive/vendor account</td><td>Direct financial fraud — redirected wire transfer, fraudulent invoice payment</td></tr>
    <tr><td><strong>Physical (tailgating, USB drops, badge cloning, lock-picking)</strong></td><td>In person / on media</td><td>Whoever holds a badge, a door, or curiosity about a found USB drive</td><td>Physical entry, network foothold via dropped media, cloned-badge access</td></tr>
  </tbody>
</table>
<p>Pretexting isn't really a separate channel — it's the identity and story underneath most of the others: a phishing email has a pretext ("IT security team"), a vishing call has a pretext ("vendor support"), and a tailgating attempt has a pretext ("delivery driver, hands full"). Framing it this way matters because the same OSINT that builds a good spear-phishing pretext (job titles, org charts, vendor relationships, out-of-office replies — see Reconnaissance &amp; OSINT) is exactly what builds a good vishing or in-person pretext too.</p>

<h3>Why BEC gets its own line: no exploit required, and it's expensive</h3>
<p>BEC is worth calling out separately because it often involves zero malware and zero credential theft — the attacker just needs a convincing enough email (a spoofed look-alike domain, or a genuinely compromised mailbox) asking finance to change a payment's bank details or rush an urgent wire transfer, usually under invented time pressure ("I'm in a meeting, can't talk, just process this before end of day"). Because there's no payload to detect, BEC consistently ranks among the costliest categories of cybercrime tracked by the FBI's Internet Crime Complaint Center (IC3), with reported losses in the billions of dollars annually — which is exactly why the defenses for it (covered in Defenses &amp; Legal) are procedural (callback verification, dual approval) rather than technical.</p>

<h3>Why physical testing is a distinct sibling discipline, not an afterthought</h3>
<p>A network can be perfectly patched and still be reachable by someone who simply walked in: plugged a laptop into an unattended network jack, cloned a badge left carelessly readable in a bag, or was let through a door by someone being polite. Physical engagements test the layer underneath all the digital ones — the assumption that "you have to actually be inside the building" is itself a security control, and like any control it can be bypassed by a convincing enough person rather than a convincing enough exploit. This is why serious red-team engagements (see Foundations &amp; Ethics) often include a physical component alongside the digital one: a "crown jewel" objective is rarely protected by only one kind of control.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>One campaign, one lifecycle</h3>
<p>Every social-engineering vector — email, phone, or in person — follows the same underlying shape, which mirrors the general pentest lifecycle (Foundations &amp; Ethics) but is worth naming explicitly for this topic:</p>
<pre><code class="language-text">OSINT / Recon on org &amp; targets  →  Pretext design &amp; approval  →  Delivery  →  Human action  →  Objective  →  Report &amp; train
   (names, roles, org chart,         (cover story, urgency         (email,      (click, read out    (credential,     (aggregate metrics,
    vendor relationships,             hook, approved scope)         call,        code, open door,     access, funds,   train — never
    out-of-office replies)                                          in person,   plug in drive)       foothold)        name-and-shame)
                                                                     media)
</code></pre>
<p>The recon stage here draws directly on the OSINT techniques covered in Reconnaissance &amp; OSINT — an org chart, a job posting mentioning specific internal tools, or an out-of-office auto-reply naming a colleague are exactly the raw material a pretext is built from. The "objective" stage is deliberately generic because it's whatever the engagement scoped as a goal: a clicked link and entered credential, a code read aloud over the phone, a held-open door, or an executed file from a dropped USB drive.</p>

<h3>Cialdini's principles of influence — the psychology underneath every pretext</h3>
<p>Nearly every social-engineering pretext, in any channel, leans on one or more of psychologist Robert Cialdini's well-documented principles of persuasion:</p>
<ul>
  <li><strong>Authority</strong> — "I'm from IT / the CEO's office / a regulator" — people default to complying with perceived authority. (A spoofed executive email requesting an urgent wire transfer is authority weaponized.)</li>
  <li><strong>Urgency / scarcity</strong> — "this needs to happen before end of day" or "your account will be locked in 10 minutes" — pressure short-circuits careful verification.</li>
  <li><strong>Social proof</strong> — "everyone on your team already did this" — people look to others' behavior to decide what's normal.</li>
  <li><strong>Liking / rapport</strong> — a friendly, personable delivery (a warm voice on a vishing call, a helpful-seeming stranger at a door) lowers a target's guard simply because refusing feels rude.</li>
  <li><strong>Reciprocity</strong> — offering something small first (holding a door, a small favor) creates a felt obligation to return the favor (letting the person through, answering "just one quick question").</li>
  <li><strong>Commitment / consistency</strong> — once a target has verbally agreed to something small ("yes, I can help with that"), they're psychologically more likely to follow through on a larger related ask that follows.</li>
</ul>
<p>Recognizing which principle a given pretext leans on is useful in both directions: it's how a tester designs a realistic scenario, and it's exactly what security-awareness training should teach employees to notice in the moment (covered in Defenses &amp; Legal).</p>

<h3>Physical access as defense-in-depth layers — and where each vector bypasses one</h3>
<table>
  <thead><tr><th>Layer</th><th>Typical control</th><th>Physical SE technique that targets it</th></tr></thead>
  <tbody>
    <tr><td>Perimeter</td><td>Fencing, gated parking, external cameras</td><td>USB drop in the parking lot; observing badge/entry patterns from outside</td></tr>
    <tr><td>Building entry</td><td>Reception/sign-in, visitor badges, locked main doors</td><td>Tailgating/piggybacking behind an authorized employee; a plausible visitor pretext</td></tr>
    <tr><td>Internal doors / restricted areas</td><td>RFID/NFC badge readers, PIN locks</td><td>Badge cloning (weak/unencrypted cards); tailgating between internal zones</td></tr>
    <tr><td>Specific asset (server room, cabinet, desk)</td><td>Mechanical locks, cable locks, clean-desk policy</td><td>Basic lock-picking (conceptual overview only); opportunistic access to an unlocked/unattended asset</td></tr>
  </tbody>
</table>
<p>The pattern to notice: each layer's control is only as strong as the assumption behind it, and every physical SE technique in this topic targets exactly one such assumption — that people don't hold doors for strangers, that RFID cards can't be cheaply read at a distance, that a found USB drive won't be plugged in out of curiosity, that a simple pin-tumbler lock is actually a meaningful barrier. None of these assumptions are safe defaults, which is exactly why layered, redundant controls (covered in Defenses &amp; Legal) matter more than any single one of them.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Methodology (Conceptual)', html: `
<div class="callout danger">
  <div class="callout-title">⚠️ Methodology, not a kit</div>
  <p>Everything below describes <em>what a pentester does and measures</em> during an authorized social-engineering or physical engagement — the process, the tooling's role, and the metrics that make the exercise valuable. It deliberately stops short of usable lure copy, scripts, exploit payloads, or lock-picking technique detail, because none of that is the point: the point is understanding the methodology well enough to run, scope, and defend against it.</p>
</div>

<h3>Phishing &amp; spear-phishing: how a simulated campaign is actually run</h3>
<p>An authorized phishing simulation — whether for security-awareness measurement or as part of a red-team engagement — follows a fixed sequence, all inside a scope agreed in advance:</p>
<ul>
  <li><strong>Scope the target list explicitly.</strong> "All employees" is rarely the real scope — a specific department, distribution list, or named set of individuals is agreed with the client point of contact in writing, exactly like the asset scope in a network pentest's Rules of Engagement.</li>
  <li><strong>Design and get the pretext approved.</strong> The lure theme (a fake password-expiry notice, a fake shared-document link, a fake HR announcement) is reviewed and approved before sending — some themes (e.g. anything referencing a real ongoing crisis, medical topics, or bonus/layoff news) are commonly excluded by policy because of the distress they can cause.</li>
  <li><strong>Stand up tracked infrastructure.</strong> <strong>GoPhish</strong> is the most commonly referenced open-source platform for this: it serves templates and a tracked landing page, and records opens, clicks, and (if the exercise calls for it) submitted data, all inside the engagement's own infrastructure — never against a real production login page. <strong>SET</strong>'s Spear-Phishing Attack Vectors module serves a similar purpose for a single, highly targeted send with an attached or cloned-page pretext.</li>
  <li><strong>Launch, measure, and stop cleanly.</strong> The campaign runs for an agreed window, then stops — metrics are aggregated (open rate, click rate, credential-submission rate, and critically, <em>report rate</em> — how many recipients flagged it to security) rather than reported per-individual, specifically so the exercise trains rather than punishes (see Defenses &amp; Legal).</li>
</ul>
<pre><code class="language-bash"># Standing up Gophish's own admin/tracking infrastructure inside an
# authorized lab or engagement environment (conceptual — no lure content):
./gophish
# → admin UI on https://127.0.0.1:3333, phishing listener on :80/:443
# Campaigns, templates, landing pages, and the target group are all
# configured through the admin UI against the pre-approved scope.

# Launching SET's menu-driven toolkit on Kali (conceptual — no payload detail):
sudo setoolkit
# → interactive menu: Social-Engineering Attacks → Spear-Phishing Attack
#   Vectors / Website Attack Vectors / Infectious Media Generator, etc.</code></pre>

<h3>Vishing: the phone-based version of the same discipline</h3>
<p>Vishing (voice phishing) applies the identical pretext-and-measure discipline over the phone, most often against a help desk, IT support line, or reception — roles trained to be helpful, which is exactly why they're a common target. An authorized vishing engagement scopes the specific phone numbers/roles that may be called, defines what may be requested (e.g. "attempt a password reset," never "obtain and use a real working credential"), and — because phone calls raise call-recording consent law (one-party vs. two-party/all-party consent varies by US state and by country) — explicitly covers recording and consent in the same written authorization. Caller-ID spoofing, sometimes used to add pretext credibility, is separately regulated in many jurisdictions (e.g. the US Truth in Caller ID Act) and needs its own explicit sign-off, not an assumption that "the pentest authorization covers it."</p>

<h3>Pretexting: the identity underneath the delivery channel</h3>
<p>A pretext is a constructed, plausible identity and reason: a delivery driver, an auditor, a new hire who "hasn't gotten their badge yet," a building-management contractor. Building a credible one, for an authorized engagement, means: research (the OSINT covered in Reconnaissance &amp; OSINT — real vendor names, real internal terminology, real org-chart context make a story land), a consistent story that survives a follow-up question, and — critically — a hard boundary on what the pretext will never do: it will not involve impersonating law enforcement, fire/medical responders, or government officials (illegal in most jurisdictions regardless of authorization), and it stops the moment it's directly and reasonably challenged rather than escalating pressure on a suspicious employee.</p>

<h3>BEC: simulating the fraud pattern, not the crime</h3>
<p>Simulating BEC as part of an authorized engagement means demonstrating the <em>pattern</em> — a spoofed or look-alike-domain "executive" email requesting an out-of-band payment change, timed with invented urgency — and then measuring whether the target's own verification procedure (a callback to a known number, a second approver) actually catches it, rather than actually attempting to move any real funds. The finding that matters is procedural: does a second person have to independently verify payment-detail changes, and do they actually do it under simulated pressure?</p>

<h3>Physical vectors, at concept level</h3>
<ul>
  <li><strong>Tailgating / piggybacking</strong> — following an authorized person through a badge-controlled door without badging in yourself, typically enabled by a plausible reason to have your hands full or be in a hurry, and by the social awkwardness of challenging a confident-looking stranger. The engagement's success metric is simply: did it work, and did anyone challenge it?</li>
  <li><strong>USB drops</strong> — leaving branded or enticingly labeled removable media (a USB drive) somewhere an employee is likely to find and plug it in out of curiosity or a sense of "I should return this." In an authorized red-team engagement this is usually paired with a benign, logged "phone home" action rather than any real payload, specifically to measure whether it gets plugged in and reported at all — devices like a USB Rubber Ducky or Bash Bunny are sometimes referenced in this context conceptually, as programmable HID-emulating hardware used <em>only</em> within signed scope.</li>
  <li><strong>Badge cloning</strong> — many organizations still use older 125kHz low-frequency proximity cards, which broadcast an unencrypted, static ID readable at short range with inexpensive RFID hardware (a <code>Proxmark3</code>, covered in Wireless Security's RFID section) — meaning the card's ID can be captured and replayed onto a blank card. Higher-security systems (MIFARE DESFire, HID iCLASS SE, and similar) use mutual authentication and encrypted credentials specifically to resist this. An authorized physical engagement tests which category the client's actual badge system falls into.</li>
  <li><strong>Lock-picking (overview only)</strong> — testing whether a simple pin-tumbler lock (on a server room, a cabinet, a supply closet) provides real resistance versus a determined, skilled attempt, using standard manual picking tools (a tension wrench and pick set). This module treats it strictly as a named, conceptual category of physical testing — not a how-to — because possessing lock-picking tools is itself separately regulated or restricted in some jurisdictions, and carrying them on-site during an engagement requires both the written engagement authorization <em>and</em> a check of local law before the tools are ever brought along.</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Worked Examples', html: `
<h3>Example 1 — A social-engineering/physical-specific scoping checklist</h3>
<p>This extends the general pre-engagement checklist from Foundations &amp; Ethics with the items unique to testing people and premises. Every box needs to be checked before anyone but the tester is targeted:</p>
<ul>
  <li>☐ The target list is explicit and named/role-scoped in writing — not an open-ended "all employees."</li>
  <li>☐ The pretext theme(s) are reviewed and approved in advance; distressing themes (real crises, medical, layoffs/bonuses) are excluded unless separately negotiated.</li>
  <li>☐ An absolute do-not-do list is signed: no impersonating law enforcement, fire, medical, or government officials; no physical contact, intimidation, or following a target home; no accessing systems or areas beyond what's needed to prove the objective was reached.</li>
  <li>☐ Stop conditions are defined: if physically detained, if police or security are called, if a target becomes visibly distressed, the tester identifies themselves and produces the "get-out-of-jail-free" letter immediately — no arguing the pretext further.</li>
  <li>☐ Recording/consent law for the relevant jurisdiction (phone or in-person audio/video) is checked and covered explicitly in the authorization, not assumed.</li>
  <li>☐ Caller-ID spoofing (if used for vishing) has its own separate written sign-off, given it's independently regulated in many jurisdictions.</li>
  <li>☐ The get-out-of-jail-free letter is prepared, current, and physically carried for any on-site component.</li>
  <li>☐ Reporting will aggregate results (click rate, report rate, tailgate-success rate) rather than naming individuals who were fooled — the exercise trains, it doesn't punish.</li>
</ul>
<p>Notice how many of these items exist because the "target" here can be a real, unsuspecting employee or a real physical door — the checklist is deliberately heavier than a pure network-pentest scope for exactly that reason.</p>

<h3>Example 2 — Structuring an authorized phishing-simulation campaign (methodology, not lure content)</h3>
<pre><code class="language-text">Campaign plan (reviewed and approved before anything is sent):
  Target group:     &lt;named distribution list agreed with client PoC&gt;
  Pretext theme:     &lt;approved theme, e.g. "internal IT password-policy update"&gt;
  Sending domain:    &lt;look-alike domain, separately authorized for registration/use&gt;
  Landing page:      &lt;tracked page on Gophish infra — captures click + submit, nothing else&gt;
  Window:            &lt;start date/time – end date/time&gt;
  Excluded groups:    &lt;e.g. new hires in first 30 days, employees on leave&gt;
  Metrics captured:  open rate, click rate, credential-submission rate, report rate
  Reporting:          aggregate only; no individual is named in the client report</code></pre>
<p>The plan intentionally separates "what's being measured" (aggregate behavior) from "who did what" — a well-run simulation reports "22% clicked, 9% submitted credentials, 4% reported it to security" and uses that as a training baseline to improve next cycle, never as a list of individuals to call out.</p>

<h3>Example 3 — A vishing pretext planning artifact (structure, not a script)</h3>
<pre><code class="language-text">Pretext plan (approved in writing before any call is placed):
  Target role:        &lt;e.g. IT help-desk agent&gt;
  Approved numbers:    &lt;specific extensions/lines in scope&gt;
  Cover identity:      &lt;e.g. "employee from &lt;dept&gt;, locked out of &lt;system&gt;"&gt;
  Requested action:    &lt;e.g. "attempt a password reset" — never "obtain a working credential and use it"&gt;
  Hard stop:            call ends immediately if the agent verifies identity correctly per policy
  Recording/consent:    &lt;jurisdiction's consent rule confirmed; recording authorized in writing&gt;
  Escalation contact:   &lt;named emergency contact who can confirm the engagement is real&gt;</code></pre>
<p>The finding that matters from a call like this isn't "we got a password reset" — it's whether the help desk's own verification procedure was followed under a bit of social pressure, which is exactly the kind of procedural gap security-awareness training exists to close.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '⚠️ Defenses & Legal', html: `
<div class="callout danger">
  <div class="callout-title">⚠️ Extra authorization, not the same authorization</div>
  <p>Everything in Foundations &amp; Ethics about written authorization, scope, and Rules of Engagement still applies here in full — and then some. A social-engineering or physical engagement's authorization must additionally: name specifically <em>who</em> or which role can be targeted; carry an explicit do-not-do list (no impersonating law enforcement/emergency responders, no physical contact or intimidation, no following anyone, no probing beyond proving the objective); cover recording/consent law for the relevant jurisdiction; and include a current, physically-carried "get-out-of-jail-free" letter plus a named emergency contact who can confirm the engagement in real time if a tester is stopped by security staff or police. Because these techniques target real, unsuspecting people and can involve entering real property, the legal exposure (trespass, impersonation, wiretap/recording-consent violations) is broader than a pure network engagement's — when in doubt, get legal counsel to review the authorization before anyone is targeted.</p>
</div>

<h3>Security-awareness training and simulated phishing — the core recurring defense</h3>
<p>The single highest-leverage defense against this whole topic is a recurring (not one-time) training program: teaching employees to recognize the Cialdini-style pressure tactics covered in Mental Model (urgency, authority, unexpected requests), paired with regular, low-stakes simulated phishing campaigns run the same way described in Mechanics. The metric that actually matters over time isn't the click rate in isolation — it's the trend of click rate going down and report rate going up release over release, which is why results should always be aggregated and used as a training signal, never as a blame list for individuals who were fooled.</p>

<h3>Email authentication: SPF, DKIM, and DMARC</h3>
<p>Because so much of this topic arrives by email, the DNS-based email-authentication trio is a core technical defense against spoofed sender addresses — the foundation of both phishing and BEC:</p>
<ul>
  <li><strong>SPF (Sender Policy Framework)</strong> — a DNS TXT record listing which mail servers are allowed to send email for a domain; a receiving server checks the sending IP against this list.</li>
  <li><strong>DKIM (DomainKeys Identified Mail)</strong> — the sending server cryptographically signs outgoing mail with a private key; the receiving server verifies the signature against a public key published in DNS, proving the message wasn't altered in transit and really came from a system holding that key.</li>
  <li><strong>DMARC (Domain-based Message Authentication, Reporting &amp; Conformance)</strong> — sits on top of both: it requires that SPF and/or DKIM actually <em>align</em> with the visible "From" domain, and it publishes a policy (<code>p=none</code> for monitoring only, <code>p=quarantine</code> to send failures to spam, or <code>p=reject</code> to block them outright) telling receiving mail servers what to do with messages that fail. DMARC also enables aggregate failure reports back to the domain owner, which is how spoofing attempts against a domain get visibility at all.</li>
</ul>
<p>A domain with SPF and DKIM configured but no DMARC policy (or a DMARC policy left at <code>p=none</code>) still leaves a look-alike or outright spoofed "From" address exploitable for phishing and BEC — moving toward <code>p=reject</code> once alignment is confirmed working is the actual defensive payoff, not just having the records present.</p>

<h3>Building a reporting culture — the human detection layer</h3>
<p>No amount of filtering catches everything, so the last line of defense is whether an employee who suspects something reports it — fast, and without fear of embarrassment. That means a genuinely easy reporting mechanism (a one-click "Report Phishing" button in the mail client, a known number/channel for "this call felt off"), and — just as important — a <strong>no-blame culture</strong> around it: someone who reports a real phish late, or reports something that turns out to be legitimate, should be thanked for reporting, not corrected in front of peers. A reporting culture that feels punitive trains people to stay quiet, which is the opposite of the desired outcome.</p>

<h3>Physical access controls — layered, and redundant on purpose</h3>
<p>Following the defense-in-depth layers from Mental Model, physical controls should never rely on a single mechanism: staffed reception with mandatory visitor sign-in and escort (not just a sign-in sheet nobody checks), badge systems upgraded away from cloneable low-frequency prox cards toward mutual-authentication credentials (MIFARE DESFire, HID iCLASS SE, or similar), mantraps or anti-tailgating turnstiles at higher-security boundaries, CCTV coverage of entry points, a clean-desk policy so badges and sensitive material aren't left visible, and — arguably most important — a trained <strong>"challenge culture"</strong> where employees are explicitly empowered and encouraged to politely stop and question anyone without a visible badge, rather than assuming someone else will.</p>

<h3>MFA — the safety net for when a credential gets phished anyway</h3>
<p>Multi-factor authentication is the backstop that limits the blast radius when a phishing or vishing attempt does succeed in obtaining a password: a stolen password alone shouldn't be enough to log in. It's worth noting that not all MFA is equally resistant to being phished itself — SMS codes and simple push approvals can be relayed in real time by an attacker-in-the-middle phishing page, or worn down via "MFA fatigue" (repeatedly triggering push prompts until one is accepted by accident or frustration) — whereas phishing-resistant methods like FIDO2/WebAuthn security keys and passkeys cryptographically bind the authentication to the legitimate site's origin, so a look-alike phishing domain simply can't complete the handshake at all. Rolling out phishing-resistant MFA for high-value accounts (IT admins, finance, executives — exactly the roles this topic's pretexts target) closes the gap that basic MFA leaves open.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'cheat-sheet', title: '📋 Cheat Sheet', html: `
<table>
  <thead><tr><th>Category</th><th>Item</th><th>What it means</th></tr></thead>
  <tbody>
    <tr><td>Vector</td><td>Phishing</td><td>Bulk, broadly-targeted deceptive email</td></tr>
    <tr><td>Vector</td><td>Spear-phishing</td><td>Researched, targeted deceptive email aimed at a specific person/group</td></tr>
    <tr><td>Vector</td><td>Vishing</td><td>Voice/phone-based social engineering, often targeting help desk/IT support</td></tr>
    <tr><td>Vector</td><td>Pretexting</td><td>An invented, credible identity/story used to justify a request, across any channel</td></tr>
    <tr><td>Vector</td><td>BEC (Business Email Compromise)</td><td>Executive/vendor impersonation to redirect a real payment — usually no malware at all</td></tr>
    <tr><td>Physical vector</td><td>Tailgating / piggybacking</td><td>Following an authorized person through a badge-controlled door unbadged</td></tr>
    <tr><td>Physical vector</td><td>USB drop</td><td>Enticingly-labeled media left where a target is likely to find and plug it in</td></tr>
    <tr><td>Physical vector</td><td>Badge cloning</td><td>Reading/replaying an unencrypted low-frequency RFID prox card's static ID</td></tr>
    <tr><td>Physical vector</td><td>Lock-picking</td><td>Testing whether a simple pin-tumbler lock resists a skilled manual attempt (concept only)</td></tr>
    <tr><td>Tool</td><td>GoPhish</td><td>Open-source phishing-simulation framework — templates, tracked landing pages, campaign metrics</td></tr>
    <tr><td>Tool</td><td>SET (Social-Engineer Toolkit)</td><td>TrustedSec's <code>setoolkit</code> — spear-phishing and cloned-site attack-vector modules, pre-installed on Kali</td></tr>
    <tr><td>Tool</td><td>Proxmark3</td><td>RFID/NFC read-write hardware used to assess badge-cloning resistance (see Wireless Security)</td></tr>
    <tr><td>Psychology</td><td>Cialdini's principles</td><td>Authority, urgency/scarcity, social proof, liking, reciprocity, commitment/consistency</td></tr>
    <tr><td>Email defense</td><td>SPF</td><td>DNS record listing which servers may send mail for a domain</td></tr>
    <tr><td>Email defense</td><td>DKIM</td><td>Cryptographic signature proving mail wasn't altered and came from a key-holder</td></tr>
    <tr><td>Email defense</td><td>DMARC</td><td>Requires SPF/DKIM alignment with the From domain; policy p=none/quarantine/reject; enables reporting</td></tr>
    <tr><td>Defense</td><td>Security-awareness training</td><td>Recurring, not one-time; paired with simulated phishing; track click-rate down / report-rate up</td></tr>
    <tr><td>Defense</td><td>Reporting culture</td><td>Easy "Report Phishing" mechanism; no-blame response to reports, even false ones</td></tr>
    <tr><td>Defense</td><td>Physical access controls</td><td>Staffed reception + visitor escort, non-cloneable badges, mantraps, CCTV, "challenge culture"</td></tr>
    <tr><td>Defense</td><td>MFA (phishing-resistant)</td><td>FIDO2/WebAuthn/passkeys resist relay/AiTM attacks better than SMS or simple push</td></tr>
    <tr><td>Authorization must-have</td><td>Named target scope</td><td>Specific people/roles/list — never an open-ended "all employees"</td></tr>
    <tr><td>Authorization must-have</td><td>Absolute do-not-do list</td><td>No impersonating law enforcement/emergency responders; no contact/intimidation</td></tr>
    <tr><td>Authorization must-have</td><td>Get-out-of-jail-free letter</td><td>Physically carried for any on-site/physical component; named emergency contact</td></tr>
    <tr><td>Authorization must-have</td><td>Recording/consent check</td><td>One-party vs. two-party consent laws vary by jurisdiction — confirm before recording</td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">Why is social engineering considered such an effective attack vector?</div>
<div class="qa-a">
<p>Because it targets human psychology rather than a technical control, and humans are consistently the weak point — industry breach research such as Verizon's DBIR repeatedly finds a human element present in roughly six out of ten breaches. No firewall, patch level, or network segmentation stops a convincingly pretexted phone call or email, because the "vulnerability" being exploited is trust, urgency, authority, or helpfulness rather than a software flaw. That's also why the defense is different in kind: awareness training and culture, not a patch.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between phishing, spear-phishing, vishing, and pretexting?</div>
<div class="qa-a">
<p>Phishing is bulk and broadly targeted deceptive email; spear-phishing is the same channel but researched and aimed at a specific person or small group for a higher-value goal. Vishing moves the same idea to the phone, usually against a role like help desk or IT support. Pretexting isn't really a separate channel — it's the invented, credible identity and story underneath most of the others: a phishing email, a vishing call, and an in-person tailgating attempt all rely on a pretext to be convincing; only the delivery channel differs.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What is BEC (Business Email Compromise) and why is it dangerous?</div>
<div class="qa-a">
<p>BEC is an attacker impersonating (via a spoofed look-alike domain or a genuinely compromised mailbox) an executive or vendor to trick finance or payroll staff into redirecting a real payment — a fraudulent wire transfer or invoice change — usually under invented urgency. It's dangerous specifically because it often requires no malware and no stolen credential at all, so purely technical defenses miss it; it consistently ranks among the costliest categories of cybercrime tracked by the FBI's IC3. The defense is procedural: independent callback verification and dual approval before changing payment details, not a technical filter.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">How does SPF/DKIM/DMARC help against phishing and BEC?</div>
<div class="qa-a">
<p>SPF publishes which mail servers are authorized to send for a domain; DKIM cryptographically signs outgoing mail so a receiver can verify it wasn't altered and came from a legitimate key-holder; DMARC ties both together by requiring their result to align with the visible "From" domain and publishes a policy (none/quarantine/reject) for what to do when that fails, plus reporting back to the domain owner. Together they make it much harder to spoof a trusted domain convincingly — but only if DMARC is actually enforced at p=quarantine or p=reject, since p=none is monitoring-only and doesn't block anything by itself.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What extra authorization does a physical or social-engineering engagement need beyond a normal pentest's scope?</div>
<div class="qa-a">
<p>Beyond the standard written authorization, defined scope, and Rules of Engagement every pentest needs, these engagements require: a named target list or role scope (never open-ended "all employees"); an explicit do-not-do list (no impersonating law enforcement or emergency responders, no physical contact or intimidation); coverage of recording/consent law for the relevant jurisdiction; and a physically-carried "get-out-of-jail-free" letter plus a named emergency contact who can confirm the engagement in real time if a tester is stopped. This is heavier than a pure network engagement's authorization because these techniques manipulate real, unsuspecting people and can involve entering real physical property, both of which carry legal exposure (impersonation, trespass, wiretap/consent violations) beyond unauthorized computer access alone.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the single most important defense against social engineering, and why?</div>
<div class="qa-a">
<p>A blameless reporting culture paired with recurring security-awareness training — because no filter or policy catches every attempt, so the last line of defense is whether an employee who suspects something actually reports it quickly, and keeps reporting things in the future. A punitive response to someone who got fooled (or who reported something that turned out to be harmless) trains people to stay quiet instead, which is the opposite of the intended effect. The right metric to track over time is click rate trending down and report rate trending up across successive training/simulation cycles, not a one-time pass/fail.</p>
</div>
</div>
`}

]});
