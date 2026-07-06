# Ethical Hacking Module (Beginner → Advanced) — Design Spec

**Date:** 2026-07-06
**Status:** Approved design, pending implementation plan
**Repo:** Prep-Site (static, offline-first study site; no build step; vanilla JS via `<script>` tags)

## 1. Goal

Add a comprehensive, progressive **Ethical Hacking** learning module covering the full
penetration-testing lifecycle beginner→advanced — the standard offensive-security body of
knowledge (CEH / OSCP / PNPT scope) — plus a master **Tools Arsenal** reference. This is
**educational security-study material**: it teaches methodology, concepts, and what each tool
does, oriented to authorized testing, labs, and CTFs.

Success = a learner starting at topic 1 understands the ethics/law/methodology, then works
through recon → scanning → vuln assessment → exploitation → post-exploitation → AD →
social/physical → reporting, with a tool reference for lookup — all framed for authorized,
legal, lab-based practice.

## 2. Responsible-Use Framing (binding for all content)

- **Educational + authorized-testing orientation.** Content targets deliberately-vulnerable
  labs (DVWA, Metasploitable, VulnHub, Hack The Box, TryHackMe), CTFs, and engagements the
  reader is **authorized** to test. Topic 1 leads with law (CFAA and equivalents), scope,
  written authorization, and rules of engagement; every later topic reiterates "only on
  systems you own or are authorized to test."
- **Concepts + defenses, not weaponized operations.** Techniques are explained at the
  methodology/tool-usage level (as an OSCP/CEH course does), and each offensive area is paired
  with **detection/defensive countermeasures**. Sensitive areas (AV/EDR evasion, malware,
  golden/silver tickets, persistence, exfiltration) are covered **conceptually** with
  defensive framing — not as turnkey, targeted, real-world attack payloads.
- **No content is omitted** for the standard curriculum; the framing above is *how* it's
  presented (the professional-course norm), not a reduction of scope.

## 3. Scope

**In scope**
- A new sidebar **module** ("Ethical Hacking") in `_index.js`, id `eh`.
- 13 teaching topic files + 1 tools-reference topic (files `scripts/content/eh-*.js`).
- Full-lifecycle coverage + the tool arsenal (see §6).
- A "📋 Cheat Sheet" section in each of the 13 teaching topics.
- The tools-arsenal reference topic aggregating tools into category tables.
- Generalizing the structural checker (`tools/verify-topics.mjs`) to validate the `eh` module
  (teaching topics vs the reference topic).

**Out of scope**
- No practice-hub challenges (this is notes).
- No new site features (existing topic-rendering pipeline reused).
- No live/operational exploit code targeting specific real systems; no malware distribution.

## 4. Architecture & Integration

Follow the existing content pattern (same as the Redux / Git / Linux modules). Each topic is an
IIFE calling `window.PREP_SITE.registerTopic({...})`; the module list in `_index.js` drives
sidebar order and Prev/Next.

**Modify**
- `scripts/content/_index.js` — add a new module to `registry.modules`:
  ```js
  {
    id: "eh",
    title: "Ethical Hacking",
    topics: [
      { id: "eh-foundations",     title: "Foundations, Ethics & Legal" },
      { id: "eh-recon",           title: "Reconnaissance & OSINT" },
      { id: "eh-scanning",        title: "Scanning & Enumeration" },
      { id: "eh-vuln",            title: "Vulnerability Assessment" },
      { id: "eh-web",             title: "Web Application Hacking" },
      { id: "eh-network",         title: "Network Attacks" },
      { id: "eh-wireless",        title: "Wireless Security" },
      { id: "eh-passwords",       title: "Password Attacks & Cracking" },
      { id: "eh-exploitation",    title: "Exploitation & Metasploit" },
      { id: "eh-postexploit",     title: "Post-Exploitation & Privilege Escalation" },
      { id: "eh-activedirectory", title: "Active Directory Attacks" },
      { id: "eh-social-physical", title: "Social Engineering & Physical" },
      { id: "eh-reporting-cloud", title: "Reporting, Cloud & Modern" },
      { id: "eh-tools-arsenal",   title: "Tools Arsenal (Reference)" },
    ],
  }
  ```
- `index.html` — add 14 `<script src="scripts/content/eh-*.js">` tags among the content
  scripts (before `scripts/app.js`).
- `tools/verify-topics.mjs` — add `'eh'` to `TARGET_MODULES`; add the 13 teaching topics to the
  full-section set (`NEW_TOPICS`); add `eh-tools-arsenal` to `REFERENCE_TOPICS`.

**Create** — 14 topic files: `eh-foundations.js`, `eh-recon.js`, `eh-scanning.js`, `eh-vuln.js`,
`eh-web.js`, `eh-network.js`, `eh-wireless.js`, `eh-passwords.js`, `eh-exploitation.js`,
`eh-postexploit.js`, `eh-activedirectory.js`, `eh-social-physical.js`, `eh-reporting-cloud.js`,
`eh-tools-arsenal.js`.

**Module-id note:** the checker globs content files by `<module-id>-` prefix, so module id `eh`
matches the `eh-*.js` files. (`id: "eh"` internal; sidebar shows the title "Ethical Hacking".)

**No change** to the router, search, theme, progress, or the frontend `web-security` topic.

## 5. Topic Registration Shape

Each topic uses the site's standard shape (`module: 'eh'`):

```js
window.PREP_SITE.registerTopic({
  id: 'eh-foundations', module: 'eh', title: 'Foundations, Ethics & Legal',
  estimatedReadTime: '25 min', tags: ['ethical-hacking','security','pentest','ethics'],
  sections: [ { id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `…` }, … ],
});
```

- Section `html` is raw trusted HTML; commands use `<pre><code class="language-bash">…</code></pre>`,
  inline `<code>`, tables via `<table>`. Command placeholders (`<target>`, `<ip>`, `<url>`) must
  be escaped `&lt;target&gt;`.
- **Teaching topics (1–13)** include at least: `tldr` (collapsible:false), `what-why`,
  `mental-model`, `mechanics`, `examples`, `interview-patterns`, plus a **`cheat-sheet`**
  section (a `<table>`: tool/technique · purpose · typical usage). `edge-cases` optional (often
  used here as a "⚠️ Legal & Safety" / defenses callout). Every offensive topic includes a
  **defenses/detection** note.
- **Reference topic (14, `eh-tools-arsenal`)** structure: `tldr` (collapsible:false) + one
  `<table>` section per tool category (ids: `ref-recon`, `ref-scanning`, `ref-vuln`, `ref-web`,
  `ref-network`, `ref-wireless`, `ref-password`, `ref-exploit`, `ref-postexploit`, `ref-ad`,
  `ref-social`, `ref-reporting`), each row: tool · category/purpose · typical usage · notes.
  Aggregates only tools already covered in topics 1–13 (no new tools).

## 6. Topic Content Outline (beginner → advanced)

Tool inventory per topic (taught in Mechanics + Worked Examples, summarized in each Cheat Sheet;
all offensive techniques paired with defenses):

1. **`eh-foundations`** — hats (white/grey/black), the law (CFAA + international equivalents,
   computer-misuse acts), authorization & written scope, rules of engagement, engagement types
   (black/grey/white-box), pentest phases, methodologies (**PTES**, OSSTMM, **MITRE ATT&CK**,
   Lockheed **cyber kill chain**, NIST), CIA triad, threat modeling basics, **lab setup**
   (Kali/Parrot, VirtualBox/VMware, target VMs DVWA/Metasploitable2-3/OWASP Juice Shop, HTB/THM),
   certs (CEH/OSCP/PNPT/eJPT). Leads with ethics/legal.
2. **`eh-recon`** — passive vs active; footprinting; WHOIS, DNS (`dig`, `nslookup`, `dnsrecon`,
   `dnsenum`, `fierce`), zone transfers; subdomain enum (`amass`, `subfinder`, `sublist3r`,
   `assetfinder`); Google dorking / GHDB; `theHarvester`; **Shodan**/Censys; `Maltego`;
   `recon-ng`; `spiderfoot`; email/username OSINT; metadata (`exiftool`). Defense: attack-surface
   reduction, OSINT hygiene.
3. **`eh-scanning`** — host discovery (ping sweep, `arp-scan`, `netdiscover`); **nmap deep**
   (TCP connect/SYN/UDP, `-sV`/`-O`, timing `-T`, `-p`, NSE `--script`, output formats),
   `masscan`, `rustscan`; enumeration by service — SMB (`enum4linux`, `smbclient`,
   `smbmap`), SNMP (`snmpwalk`, `onesixtyone`), LDAP, NFS (`showmount`), SMTP (`smtp-user-enum`),
   `netcat` banner grabbing. Defense: firewalling, IDS/IPS, port-scan detection.
4. **`eh-vuln`** — scanners (`Nessus`, `OpenVAS/GVM`, `Nikto`, `nuclei`, `wpscan`), CVE/**CVSS**
   scoring, `searchsploit`/Exploit-DB, NVD, interpreting results, false positives, scan safety.
   Defense: patch management, vuln management lifecycle.
5. **`eh-web`** — **OWASP Top 10** (2021), **Burp Suite** (proxy/repeater/intruder/decoder/scanner)
   and OWASP ZAP; **SQLi** (`sqlmap`, UNION/blind/error), **XSS** (reflected/stored/DOM), CSRF,
   **SSRF**, XXE, IDOR/BOLA, auth & session flaws (JWT), file upload, **LFI/RFI**, command
   injection, SSTI, dir/param discovery (`gobuster`, `ffuf`, `dirb`, `feroxbuster`), `wpscan`,
   `nikto`. Defense: input validation, parameterized queries, CSP, WAF (map to `web-security` topic).
6. **`eh-network`** — sniffing (**Wireshark**, `tcpdump`, `tshark`); MITM & **ARP spoofing**
   (`bettercap`, `ettercap`, `arpspoof`); DNS spoofing; **Responder** / LLMNR/NBT-NS poisoning &
   NTLM capture; SSL strip concepts; VLAN hopping; pivoting overview. Defense: switch security,
   dynamic ARP inspection, disabling LLMNR, network segmentation.
7. **`eh-wireless`** — 802.11 basics; WEP/WPA/WPA2/WPA3 & the 4-way handshake; **aircrack-ng
   suite** (`airmon-ng`/`airodump-ng`/`aireplay-ng`/`aircrack-ng`), monitor mode, handshake
   capture, **deauth**, PMKID; `wifite`, `hcxdumptool`+`hashcat`; **evil twin** (`hostapd`/
   `airgeddon`) concepts; Bluetooth (`bluetoothctl`, `btscanner`) & RFID/NFC (`proxmark`) intro.
   Defense: WPA3, strong PSKs, 802.1X, rogue-AP detection.
8. **`eh-passwords`** — hashing vs encryption, salting; **online** attacks (`hydra`, `medusa`,
   `ncrack`, `patator`), lockout awareness; **offline** cracking (`john`, **`hashcat`** — attack
   modes, masks, rules, hash types via `hashid`/`hash-identifier`); wordlists (`rockyou`,
   `crunch`, `cewl`, SecLists); rainbow tables; credential stuffing/spraying concepts. Defense:
   strong hashing (bcrypt/argon2), MFA, password policy, lockouts.
9. **`eh-exploitation`** — exploit vs payload vs shellcode; **Metasploit Framework**
   (`msfconsole`, modules, `set`/`run`, sessions, **meterpreter**), `msfvenom` payload
   generation, listeners/handlers; manual exploitation from `searchsploit`; bind vs reverse
   shells (`nc`, socat); **stack buffer overflow** intro (EIP control, bad chars, NOP sled — lab
   walkthrough conceptually), DEP/ASLR overview; **AV/EDR evasion concepts** (encoders, obfuscation
   — conceptual, with detection framing). Defense: EDR, exploit mitigations, least privilege.
10. **`eh-postexploit`** — situational awareness; **Linux priv-esc** (`LinPEAS`, SUID/SGID, sudo
    rules, cron, capabilities, kernel exploits, PATH); **Windows priv-esc** (`WinPEAS`, tokens,
    unquoted service paths, AlwaysInstallElevated, UAC bypass concepts); credential dumping
    (`mimikatz`, LSASS) concepts; **persistence** & **lateral movement** concepts; pivoting/
    tunneling (`chisel`, `proxychains`, SSH tunnels, `ligolo-ng`); data-exfil & anti-forensics
    concepts (with detection/defense framing). Defense: EDR, logging, LAPS, least privilege.
11. **`eh-activedirectory`** — AD/Kerberos basics; enumeration (**BloodHound**/SharpHound,
    **PowerView**, `ldapdomaindump`); **Kerberoasting**, **AS-REP roasting**, **Pass-the-Hash/
    Ticket**, **golden/silver tickets** (conceptual), **DCSync**, delegation abuse, **ADCS**
    (ESC1- x) overview; **Impacket** suite (`secretsdump`, `psexec`, `GetUserSPNs`,
    `GetNPUsers`), `crackmapexec`/`netexec`, `evil-winrm`. Defense: tiering, LAPS, gMSA,
    monitoring, ADCS hardening.
12. **`eh-social-physical`** — human attack surface; **phishing** (`GoPhish`, **SET** — Social-
    Engineer Toolkit), spear-phishing, vishing, pretexting, BEC concepts; physical (tailgating,
    lock picking overview, USB drops, badge cloning) concepts; awareness. Defense: security
    awareness training, email security (DMARC/SPF/DKIM), physical controls.
13. **`eh-reporting-cloud`** — **reporting** (executive summary, findings, evidence, risk rating
    via CVSS, remediation, retest), note-taking (CherryTree/Obsidian), engagement wrap-up; **cloud
    pentesting** intro (AWS/Azure/GCP shared-responsibility, `ScoutSuite`, `pacu`, `prowler`,
    metadata SSRF); **container/K8s** security intro (`kube-hunter`, `trivy`); mobile (MobSF) &
    IoT intro; the **blue-team/purple-team** and defense mindset (SIEM, detection engineering).
14. **`eh-tools-arsenal`** — master reference: TL;DR on how to use it + 12 category tables
    (Recon, Scanning, Vuln, Web, Network, Wireless, Password, Exploitation, Post-Exploit, AD,
    Social, Reporting/Cloud). Each row: tool · category/purpose · typical usage · notes.
    Aggregates the tools from topics 1–13 (no new tools).

## 7. Correctness (accuracy)

Prose notes — no execution harness. Accuracy is gated by **expert review**, seeded with:
- Every tool name, command, and flag is real and correct (a wrong nmap/hashcat/impacket flag is
  the main risk); current for 2026 (e.g. `netexec` is the maintained successor to `crackmapexec`;
  OWASP Top 10 **2021**; MITRE ATT&CK tactic/technique names correct).
- Concepts (Kerberos attacks, CVSS, the OSI/handshake details, priv-esc vectors) technically
  correct; the reference-topic tables consistent with the teaching topics.
- **Responsible-use framing present** (per §2): topic 1 legal/authorization; each offensive
  topic pairs technique with defenses; sensitive areas kept conceptual.
- Reviewer flags any wrong tool/flag/concept, any missing defense framing, and any
  reference-vs-teaching inconsistency.

A structural check (`tools/verify-topics.mjs`, generalized to `eh`) confirms each topic registers
with `module:'eh'`, unique id, `tldr` first (collapsible:false); teaching topics (1–13) have the
teaching sections + cheat-sheet; the reference topic (14) has `tldr` + its category tables.

## 8. Rollout Plan

Reviewable batches; nothing committed unless the user asks.

1. **Slice:** add the `eh` module to `_index.js`; generalize `tools/verify-topics.mjs`; author
   **`eh-foundations`** end-to-end (ethics/legal/methodology/lab-setup + Cheat Sheet); wire its
   tag. User reviews the module + topic-1 depth/tone + the responsible-use framing + cheat-sheet
   format. **STOP for review.**
2–13. The remaining 12 teaching topics (recon → reporting-cloud), each authored, cheat-sheet
   included, structurally checked, accuracy-reviewed.
14. **`eh-tools-arsenal`** built last (aggregates tools from 1–13).
15. Final accuracy-review pass across all 14 + structural check + browser pass (module ordered,
   all render, Prev/Next threads them, cheat-sheets + reference tables render, defenses present).

Each content batch: author → structural check → accuracy review → fix → summarize.

## 9. Risks & Mitigations

- **Wrong tool/flag/technique** → §7 expert-review gate; every tool/command/flag verified;
  current-2026 tooling (netexec vs crackmapexec, OWASP 2021, ATT&CK names).
- **Responsible-use** → §2 framing enforced in every task and checked in review (topic-1 legal
  lead-in; defenses per offensive topic; sensitive areas conceptual). This is educational,
  authorized-testing/lab-oriented material.
- **Reference drift** (tools/usages disagreeing with teaching topics) → build topic 14 last;
  final review cross-checks it against topics 1–13.
- **HTML-safety** → escape command placeholders (`&lt;target&gt;`); large tables use `<table>`.
- **Checker false-fail on the reference topic** → teaching-vs-reference section rules (§4, §7).
- **Module size (14 topics)** → batched rollout with a review pass; reference built last.

## 10. Open Questions

None blocking. Exact per-topic tool depth and which optional sections (edge-cases / legal-safety
callout) each teaching topic uses are left to the author within the §5 minimums; adjustable
during review.
