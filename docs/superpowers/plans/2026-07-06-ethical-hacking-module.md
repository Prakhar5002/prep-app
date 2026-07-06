# Ethical Hacking Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a comprehensive progressive "Ethical Hacking" notes module — 13 beginner→advanced teaching topics (each with a Cheat Sheet) covering the full pentest lifecycle + a 14th master Tools Arsenal reference — as educational, authorized-testing/lab-oriented security material.

**Architecture:** Fourteen vanilla-JS IIFE topic files register via `window.PREP_SITE.registerTopic`; a new `eh` module in `_index.js` drives the sidebar. The structural checker (`tools/verify-topics.mjs`) is generalized to validate the `eh` module (teaching topics get full teaching-section checks; the reference topic gets tldr + ≥3 sections). Accuracy + responsible-use framing gated by expert review.

**Tech Stack:** Vanilla ES5/ES6 browser JS in IIFEs on `window.PREP_SITE`; existing Prism + theme; Node (ESM, `node:vm`) for the structural checker. No bundler/framework/test runner.

## Global Constraints

From the spec (`docs/superpowers/specs/2026-07-06-ethical-hacking-module-design.md`). Every task implicitly includes these:

- **No build step.** Topic files load via `<script>` tags in `index.html`.
- **Registration pattern.** Each topic is an IIFE calling `window.PREP_SITE.registerTopic({ id, module, title, estimatedReadTime, tags, sections })`. `module: 'eh'`.
- **Topic ids (exact) + files:** `eh-foundations`, `eh-recon`, `eh-scanning`, `eh-vuln`, `eh-web`, `eh-network`, `eh-wireless`, `eh-passwords`, `eh-exploitation`, `eh-postexploit`, `eh-activedirectory`, `eh-social-physical`, `eh-reporting-cloud`, `eh-tools-arsenal` → files `scripts/content/<id>.js`.
- **Sections:** `{ id, title, html }` (+ `collapsible: false` on the first, `tldr`). Commands use `<pre><code class="language-bash">…</code></pre>`; inline `<code>`; tables `<table>`. Command placeholders (`<target>`, `<ip>`, `<url>`, `<hash>`) MUST be escaped `&lt;target&gt;`.
- **Teaching topics (1–13):** must include section ids `tldr` (collapsible:false), `what-why`, `mental-model`, `mechanics`, `examples`, `interview-patterns`, plus a `cheat-sheet` section (a `<table>`: tool/technique · purpose · typical usage). `edge-cases` optional (often used as a "⚠️ Legal & Safety / Defenses" callout).
- **Reference topic (14, `eh-tools-arsenal`):** `tldr` first (collapsible:false) + one `<table>` section per tool category, ids: `ref-recon`, `ref-scanning`, `ref-vuln`, `ref-web`, `ref-network`, `ref-wireless`, `ref-password`, `ref-exploit`, `ref-postexploit`, `ref-ad`, `ref-social`, `ref-reporting`. NO teaching sections. Aggregates only tools taught in topics 1–13 (no new tools).
- **RESPONSIBLE-USE FRAMING (binding, per spec §2):** Educational, authorized-testing/lab orientation. `eh-foundations` LEADS with law (CFAA + equivalents), authorization, written scope, rules of engagement, and "only test systems you own or are authorized to test." EVERY offensive teaching topic includes a **Defenses / Detection** note (an `edge-cases`/legal-safety callout or a dedicated subsection) and repeats the authorization reminder. Sensitive areas (AV/EDR evasion, malware, golden/silver tickets, persistence, exfiltration, anti-forensics) are covered CONCEPTUALLY (methodology + tool purpose, as an OSCP/CEH course does) with defensive framing — NOT as turnkey, targeted, real-world attack payloads. Do NOT omit standard-curriculum content; the framing is HOW it's presented.
- **Tool accuracy (verify; current 2026):** every tool name, command, flag is real + correct. Current tooling: `netexec` is the maintained successor to `crackmapexec` (mention both); OWASP Top 10 **2021**; MITRE ATT&CK tactic/technique names correct; `hashcat`/`john` modes, `nmap` flags, `impacket` script names accurate.
- **No auto-commit / no auto-build.** Never run `git commit`/`git push`/build. End each task at verification; user commits manually on request.

---

## File Structure

**Modify:**
- `scripts/content/_index.js` — add the `eh` module to `registry.modules`.
- `index.html` — add 14 `eh-*.js` `<script>` tags (before `scripts/app.js`).
- `tools/verify-topics.mjs` — add `'eh'` to target modules; the 13 eh teaching topics to the full-section set; `eh-tools-arsenal` to reference set.

**Create:** the 14 `scripts/content/eh-*.js` files listed above.

---

### Task 1: Add the eh module + generalize the checker

**Files:**
- Modify: `scripts/content/_index.js`, `tools/verify-topics.mjs`

**Interfaces:**
- Produces: `eh` registry module (14 topics); `node tools/verify-topics.mjs` validates redux + git + linux + eh, with teaching vs reference rules.

- [ ] **Step 1: Add the module to `_index.js`**

Add to `registry.modules` (placement: after the `linux` module):
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
    },
```

- [ ] **Step 2: Generalize `tools/verify-topics.mjs`**

Read the current file (it validates redux/git/linux). Make three edits:

(a) Add `'eh'` to `TARGET_MODULES`:
```js
const TARGET_MODULES = ['redux', 'git', 'linux', 'eh'];
```
(b) Add the 13 eh TEACHING topics to `NEW_TOPICS` (do NOT add `eh-tools-arsenal`):
```js
  'eh-foundations', 'eh-recon', 'eh-scanning', 'eh-vuln', 'eh-web', 'eh-network',
  'eh-wireless', 'eh-passwords', 'eh-exploitation', 'eh-postexploit',
  'eh-activedirectory', 'eh-social-physical', 'eh-reporting-cloud',
```
(add these entries inside the existing `new Set([...])` literal alongside the redux/git/linux ids).
(c) Add `eh-tools-arsenal` to the existing `REFERENCE_TOPICS` set:
```js
const REFERENCE_TOPICS = new Set(['linux-command-reference', 'eh-tools-arsenal']);
```
(The existing reference-branch validation — tldr-first + ≥3 sections, not teaching sections — already handles it.)

- [ ] **Step 3: Run the checker**

Run: `node tools/verify-topics.mjs`
Expected: `[redux]`, `[git]`, `[linux]` blocks unchanged; a new `[eh]` block where all 14 eh topics show `… not registered yet (pending)`; overall `✅ PASS`.

- [ ] **Step 4: Syntax-check**

Run: `node --check scripts/content/_index.js && node --check tools/verify-topics.mjs`
Expected: exit 0.

**Deliverable:** eh module registered (14 "coming soon" topics) + checker validates it. No commit.

---

### Task 2: `eh-foundations` topic + wiring (the slice)

**Files:**
- Create: `scripts/content/eh-foundations.js`
- Modify: `index.html`

- [ ] **Step 1: Author `eh-foundations.js`**

Create the file as an IIFE. Look at `scripts/content/linux-fundamentals.js` for house style/tone (sibling "topic 1"). Skeleton:
```js
window.PREP_SITE.registerTopic({
  id: 'eh-foundations', module: 'eh', title: 'Foundations, Ethics & Legal',
  estimatedReadTime: '26 min', tags: ['ethical-hacking','security','pentest','ethics','legal','methodology'],
  sections: [
    { id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `…` },
    { id: 'what-why', title: '🧠 What & Why', html: `…` },
    { id: 'mental-model', title: '🗺️ Mental Model', html: `…` },
    { id: 'mechanics', title: '⚙️ Methodology & Lab Setup', html: `…` },
    { id: 'examples', title: '🧪 Worked Examples', html: `…` },
    { id: 'edge-cases', title: '⚠️ Legal & Safety', html: `…` },
    { id: 'cheat-sheet', title: '📋 Cheat Sheet', html: `…` },
    { id: 'interview-patterns', title: '🎤 Interview Patterns', html: `…` },
  ],
});
```
Content outline (beginner; **leads with ethics/legal**):
- **TL;DR:** what ethical hacking / pentesting is; you MUST have written authorization; the phases; that this module is for authorized testing, labs, and CTFs only.
- **What & Why:** white/grey/black hats; why authorized testing exists (find flaws before attackers); the value of the pentest.
- **Mental Model:** the engagement lifecycle (recon → scanning → exploitation → post-exploitation → reporting) mapped to methodologies — **PTES**, OSSTMM, NIST, Lockheed **cyber kill chain**, **MITRE ATT&CK** (tactics), CIA triad. A phase diagram.
- **Methodology & Lab Setup:** engagement types (black/grey/white-box), **rules of engagement + scope + written authorization** (this is the legal core), the CFAA and international computer-misuse laws, responsible disclosure; then **lab setup** — Kali/Parrot, VirtualBox/VMware, deliberately-vulnerable targets (DVWA, Metasploitable 2/3, OWASP Juice Shop, VulnHub), practice platforms (Hack The Box, TryHackMe); certs (eJPT/CEH/PNPT/OSCP).
- **Worked Examples:** a scoping/authorization checklist before an engagement; setting up a Kali VM + a vulnerable target VM on a host-only network.
- **Legal & Safety:** the "only test systems you own or are explicitly authorized to test" rule; get-out-of-jail authorization letter; staying in scope; data handling. (This satisfies the Global Constraints responsible-use framing.)
- **Cheat Sheet:** a `<table>` — the phases, the methodologies, the key lab targets/platforms, the legal must-haves.
- **Interview Patterns:** "phases of a pentest?", "black vs grey vs white box?", "what's in a rules-of-engagement doc?", "PTES vs the kill chain vs ATT&CK?", "what makes hacking legal vs illegal?", "responsible disclosure?".

- [ ] **Step 2: Wire the script tag**

In `index.html`, add among the content `<script>` tags (before `scripts/app.js`):
```html
<script src="scripts/content/eh-foundations.js"></script>
```

- [ ] **Step 3: Structural check**

Run: `node tools/verify-topics.mjs`
Expected: in `[eh]`, `✓ eh-foundations: N sections`, the other 13 still `… pending`, overall `✅ PASS`. Fix any `✗`. Then `node --check scripts/content/eh-foundations.js`; `grep -c 'eh-foundations.js' index.html` → 1; `grep -noE '<[a-z-]+>' scripts/content/eh-foundations.js` returns no raw command placeholders.

- [ ] **Step 4: Manual browser verification**

Open `index.html`. Verify: the **Ethical Hacking** module appears with **Foundations, Ethics & Legal** first (others "coming soon"); the topic renders all sections incl. the Legal & Safety callout and Cheat Sheet; both themes fine; Prev/Next present.

**Deliverable:** eh module + topic 1 live end-to-end. **STOP for user review of tone/depth + the responsible-use framing + cheat-sheet format before authoring the rest.** No commit.

---

### Tasks 3–14: Remaining teaching topics

Each task creates one `scripts/content/eh-<suffix>.js` using the same skeleton as Task 2 (its own id/title/tags, incl. the `cheat-sheet` section AND a Defenses/Legal-Safety note per the Global Constraints), authoring each section per the tool inventory below, then adds its `<script>` tag to `index.html`, runs `node tools/verify-topics.mjs` (its topic `✓` with teaching sections + cheat-sheet; overall `✅ PASS`), `node --check`s the file, and confirms no raw command placeholders (`grep -noE '<[a-z-]+>' <file>`). No commit. Commands in `<pre><code class="language-bash">`; match `eh-foundations`/`linux-fundamentals` style; **verify every tool/flag; include the Defenses note + authorization reminder; keep sensitive techniques conceptual** (Global Constraints).

### Task 3: `eh-recon.js` — "Reconnaissance & OSINT"
Tools/concepts: passive vs active; WHOIS; DNS (`dig`, `nslookup`, `dnsrecon`, `dnsenum`, `fierce`), zone transfers (`AXFR`); subdomain enum (`amass`, `subfinder`, `sublist3r`, `assetfinder`); Google dorking/GHDB; `theHarvester`; **Shodan**/Censys; `Maltego`; `recon-ng`; `spiderfoot`; `exiftool` metadata. Defenses: attack-surface reduction, OSINT hygiene, DNS hardening.

### Task 4: `eh-scanning.js` — "Scanning & Enumeration"
Tools: host discovery (`arp-scan`, `netdiscover`, ping sweep); **nmap deep** (`-sT`/`-sS`/`-sU`, `-sV`, `-O`, `-p-`, `-T0..5`, `--script`/NSE, `-oN/-oX/-oG`), `masscan`, `rustscan`; service enum — SMB (`enum4linux`(-ng), `smbclient`, `smbmap`, `nmblookup`), SNMP (`snmpwalk`, `onesixtyone`), LDAP (`ldapsearch`), NFS (`showmount`), SMTP (`smtp-user-enum`), `nc` banner grab. Defenses: firewalling, IDS/IPS, scan detection, service hardening.

### Task 5: `eh-vuln.js` — "Vulnerability Assessment"
Tools: `Nessus`, `OpenVAS`/GVM, `Nikto`, `nuclei`, `wpscan`; CVE / **CVSS** (base/temporal/environmental); `searchsploit` + Exploit-DB, NVD; false positives; authenticated vs unauthenticated scans; scan safety/impact. Defenses: patch/vuln management lifecycle, compensating controls.

### Task 6: `eh-web.js` — "Web Application Hacking"
Tools/concepts: **OWASP Top 10 (2021)**; **Burp Suite** (Proxy/Repeater/Intruder/Decoder/Comparer/Scanner) + OWASP ZAP; **SQLi** (`sqlmap`; UNION/error/blind/time-based); **XSS** (reflected/stored/DOM); CSRF; **SSRF**; XXE; IDOR/BOLA; auth/session (JWT `none`/weak-secret); file upload; **LFI/RFI**; command injection; SSTI; content discovery (`gobuster`, `ffuf`, `feroxbuster`, `dirb`); `wpscan`, `nikto`. Defenses: parameterized queries, output encoding/CSP, CSRF tokens, SSRF allow-lists, WAF (cross-link the `web-security` topic).

### Task 7: `eh-network.js` — "Network Attacks"
Tools: sniffing (**Wireshark**, `tcpdump`, `tshark`); MITM & ARP spoofing (`bettercap`, `ettercap`, `arpspoof`); DNS spoofing; **Responder** (LLMNR/NBT-NS/mDNS poisoning → NTLMv2 capture); SSL-strip concept; VLAN hopping concept; intro to pivoting. Defenses: dynamic ARP inspection, port security, disable LLMNR/NBT-NS, segmentation, SMB signing.

### Task 8: `eh-wireless.js` — "Wireless Security"
Tools: 802.11 + 4-way handshake; WEP/WPA/WPA2/WPA3; **aircrack-ng suite** (`airmon-ng`, `airodump-ng`, `aireplay-ng`, `aircrack-ng`), monitor mode, handshake capture, **deauth**, PMKID; `wifite`; `hcxdumptool` + `hashcat` (mode 22000); **evil twin** (`airgeddon`/`hostapd`) concept; Bluetooth (`bluetoothctl`) + RFID/NFC (`proxmark3`) intro. Defenses: WPA3/SAE, strong PSK, 802.1X/EAP, rogue-AP/WIDS, disabling WPS.

### Task 9: `eh-passwords.js` — "Password Attacks & Cracking"
Tools: hashing vs encryption, salting, common hash types (`hashid`/`hash-identifier`); **online** (`hydra`, `medusa`, `ncrack`, `patator`) + lockout awareness; **offline** — `john` and **`hashcat`** (attack modes 0/1/3/6/7, masks `?a?d?l?u?s`, rules); wordlists (`rockyou`, SecLists, `crunch`, `cewl`); rainbow tables; spraying/stuffing concepts (with lockout/defense caveats). Defenses: bcrypt/argon2/scrypt, MFA, password policy, lockout/rate-limiting, credential monitoring.

### Task 10: `eh-exploitation.js` — "Exploitation & Metasploit"
Tools/concepts: exploit vs payload vs shellcode; **Metasploit** (`msfconsole`, `search`/`use`/`set`/`options`/`run`, `sessions`, **meterpreter**), `msfvenom` (payload formats/`-p`/`-f`/`LHOST`/`LPORT`); listeners/`multi/handler`; bind vs reverse shells (`nc`, `socat`, `rlwrap`); manual exploit from `searchsploit`; **stack buffer overflow** intro (EIP control, bad chars, NOP sled, JMP ESP — conceptual lab walkthrough), DEP/ASLR overview; **AV/EDR evasion CONCEPTS** (encoders/obfuscation — conceptual, with detection framing). Defenses: EDR, exploit mitigations (DEP/ASLR/CFG), least privilege, patching. Keep payloads lab-oriented, not targeted real-world weapons.

### Task 11: `eh-postexploit.js` — "Post-Exploitation & Privilege Escalation"
Tools/concepts: situational awareness; **Linux priv-esc** (`LinPEAS`, `linux-exploit-suggester`, SUID/SGID, sudo `-l`/GTFOBins, cron, capabilities, writable PATH, kernel exploits); **Windows priv-esc** (`WinPEAS`, `PowerUp`, tokens/`SeImpersonate`/potato concepts, unquoted service paths, AlwaysInstallElevated, UAC-bypass concepts); credential dumping (`mimikatz`, LSASS/SAM) — conceptual; **persistence** & **lateral movement** — conceptual; pivoting/tunneling (`chisel`, `ligolo-ng`, `proxychains`, SSH `-L`/`-D`); exfil & anti-forensics — conceptual, with detection/defense framing. Defenses: least privilege, LAPS, EDR, logging/monitoring, credential guard.

### Task 12: `eh-activedirectory.js` — "Active Directory Attacks"
Tools/concepts: AD + Kerberos basics (TGT/TGS, SPNs); enum (**BloodHound**/SharpHound, **PowerView**, `ldapdomaindump`, `netexec`/`crackmapexec`); **Kerberoasting** (`GetUserSPNs`), **AS-REP roasting** (`GetNPUsers`), **Pass-the-Hash/Ticket**, **DCSync** (`secretsdump`), **golden/silver tickets** (conceptual), delegation abuse, **ADCS** (ESC1 overview); **Impacket** (`psexec`, `wmiexec`, `secretsdump`, `GetUserSPNs`, `GetNPUsers`), `evil-winrm`. Defenses: tiering/PAW, LAPS, gMSA, strong SPN passwords, disable unconstrained delegation, ADCS hardening, monitoring (event IDs).

### Task 13: `eh-social-physical.js` — "Social Engineering & Physical"
Tools/concepts: human attack surface; **phishing** (`GoPhish`, **SET**/Social-Engineer Toolkit), spear-phishing, pretexting, vishing, BEC — conceptual; physical (tailgating, USB drops, badge cloning, lock-picking overview) — conceptual, authorization-gated. Defenses: security-awareness training, email auth (SPF/DKIM/**DMARC**), reporting culture, physical access controls, MFA.

### Task 14: `eh-reporting-cloud.js` — "Reporting, Cloud & Modern"
Tools/concepts: **reporting** (executive summary, technical findings, evidence/screenshots, **CVSS** risk rating, remediation, retest), note-taking (Obsidian/CherryTree); **cloud pentest** intro (AWS/Azure/GCP shared responsibility, `ScoutSuite`, `prowler`, `pacu`, IMDS/SSRF); **container/K8s** (`trivy`, `kube-hunter`) intro; mobile (`MobSF`) + IoT intro; **blue/purple team** & defense mindset (SIEM, detection engineering, MITRE ATT&CK mapping). Defenses are the theme here.

---

### Task 15: `eh-tools-arsenal.js` — "Tools Arsenal (Reference)" (built last)

**Files:**
- Create: `scripts/content/eh-tools-arsenal.js`
- Modify: (none — Task 16 wires the tag with the others, OR wire here; see Step 2)

- [ ] **Step 1: Author the reference topic**

Create `scripts/content/eh-tools-arsenal.js`. REFERENCE structure:
```js
window.PREP_SITE.registerTopic({
  id: 'eh-tools-arsenal', module: 'eh', title: 'Tools Arsenal (Reference)',
  estimatedReadTime: '18 min', tags: ['ethical-hacking','tools','reference','cheat-sheet'],
  sections: [
    { id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `…how to use this + legal reminder…` },
    { id: 'ref-recon',      title: '🔍 Recon & OSINT',       html: `<table>…</table>` },
    { id: 'ref-scanning',   title: '📡 Scanning & Enum',      html: `<table>…</table>` },
    { id: 'ref-vuln',       title: '🩹 Vulnerability',        html: `<table>…</table>` },
    { id: 'ref-web',        title: '🕸️ Web',                  html: `<table>…</table>` },
    { id: 'ref-network',    title: '🌐 Network',              html: `<table>…</table>` },
    { id: 'ref-wireless',   title: '📶 Wireless',             html: `<table>…</table>` },
    { id: 'ref-password',   title: '🔑 Password',             html: `<table>…</table>` },
    { id: 'ref-exploit',    title: '💥 Exploitation',         html: `<table>…</table>` },
    { id: 'ref-postexploit',title: '🧗 Post-Exploit & PrivEsc',html: `<table>…</table>` },
    { id: 'ref-ad',         title: '🏛️ Active Directory',     html: `<table>…</table>` },
    { id: 'ref-social',     title: '🎭 Social Engineering',   html: `<table>…</table>` },
    { id: 'ref-reporting',  title: '📝 Reporting & Cloud',    html: `<table>…</table>` },
  ],
});
```
Each table header row `Tool | Category / Purpose | Typical usage | Notes`, one row per tool. AGGREGATE from the 13 teaching topics — read them (`scripts/content/eh-*.js`, excluding this file) to harvest the exact tool names + typical usage + flags, keeping them CONSISTENT with the teaching topics and introducing NO new tools. Escape command placeholders in the usage/example cells (`&lt;target&gt;`). The `tldr` must include the authorization/legal reminder.

- [ ] **Step 2: Wire the script tag**

Add to `index.html` (before `scripts/app.js`): `<script src="scripts/content/eh-tools-arsenal.js"></script>`.

- [ ] **Step 3: Structural check**

Run: `node tools/verify-topics.mjs`
Expected: `✓ eh-tools-arsenal: 13 sections (reference)` (tldr + 12 tables), overall `✅ PASS`. Then `node --check scripts/content/eh-tools-arsenal.js`; `grep -noE '<[a-z-]+>' scripts/content/eh-tools-arsenal.js` shows no raw command placeholders.

**Deliverable:** the master Tools Arsenal reference. No commit.

---

### Task 16: Final structural check + review pass

**Files:** none (verification only).

- [ ] **Step 1: Full structural check**

Run: `node tools/verify-topics.mjs`
Expected: `[eh]` block shows all 14 topics `✓` (13 teaching with teaching sections + cheat-sheet, the reference with tldr + 12 tables); `[redux]`/`[git]`/`[linux]` unchanged; overall `✅ PASS`.

- [ ] **Step 2: Confirm files parse + tags wired + placeholders escaped**

Run: `for f in scripts/content/eh-*.js; do node --check "$f" || echo "FAIL $f"; done` (expect no FAIL). `grep -c 'scripts/content/eh-' index.html` (expect 14). `grep -rnoE '<(target|ip|url|host|hash|file|user|domain|port|path|interface|ssid|dc|pid)>' scripts/content/eh-*.js` (expect nothing — all escaped).

- [ ] **Step 3: Responsible-use spot-check**

Confirm `eh-foundations` leads with legal/authorization; grep each offensive teaching topic for a Defenses/Legal-Safety note (`grep -li 'defen\|mitigat\|authoriz\|only.*own\|legal' scripts/content/eh-*.js` should include every offensive topic). Confirm sensitive areas are conceptual (no targeted real-world payloads).

- [ ] **Step 4: Final manual browser pass**

Open the site: the **Ethical Hacking** module lists all 14 topics in order; each renders (teaching topics show their Cheat Sheet + Defenses note; the reference shows 12 category tables); Prev/Next threads them foundations → … → tools-arsenal; tables render in both themes; search finds the new topics. Confirm no existing module regressed.

**Deliverable:** complete 14-topic Ethical Hacking module, structurally valid and wired. Accuracy + responsible-use framing separately gated by the expert-review step in execution. No commit.

---

## Self-Review

**Spec coverage:**
- §2 Responsible-use framing → Global Constraints (binding) + Task 2 (foundations legal lead) + Tasks 3–14 (Defenses note per topic) + Task 16 Step 3 spot-check. ✓
- §4 Architecture (module, 14 topic files, script tags, generalized checker w/ reference rule) → Tasks 1, 2, 3–14, 15, 16. ✓
- §5 Registration shape (module 'eh', teaching sections + cheat-sheet, reference structure, first-section collapsible) → Task 1 checker enforces; Tasks 2–15 author. ✓
- §6 Topic outlines (14 topics, tool inventories, cheat-sheets, reference tables) → Tasks 2–15 per-topic tool lists. ✓
- §7 Correctness (tool/flag accuracy + current-2026 + structural check teaching-vs-reference + expert review + responsible framing) → Global Constraints fact list; Task 1 checker; accuracy via SDD review; Task 16 spot-check. ✓
- §8 Rollout (module + foundations slice first, STOP, then rest, reference last, final) → Task ordering + explicit STOP at Task 2 + reference at Task 15. ✓
- §9 Risks (wrong tool/flag, responsible-use, reference drift, HTML-safety, checker false-fail, module size) → Global Constraints + Task 1 reference-rule + Task 15/16 cross-check + placeholder greps + batched tasks. ✓

**Placeholder scan:** Content tasks carry per-topic tool inventories + section outlines, not "TODO"; prose authored during execution + gated by structural-check + expert review; `…` in skeletons are author-fill markers. Infrastructure (checker edits, registry entry) shown in full. No "handle errors / similar to Task N" placeholders in code steps.

**Type consistency:** Topic ids, `module: 'eh'`, the `NEW_TOPICS`/`REFERENCE_TOPICS` additions in the checker, the teaching section ids + `cheat-sheet`, the reference section ids (`ref-*`, 12 of them → tldr + 12 = 13 sections, matching Task 15 Step 3's "13 sections" expectation), and the `registerTopic` fields are used identically across Task 1 (checker + registry), Tasks 2–15. File names match ids.

**Deviation note:** Standard TDD "commit each task" + execution tests are replaced by (a) the Node structural checker and (b) expert accuracy + responsible-use review, because topics are prose (no runnable output) and per project rules must not auto-commit/build.
