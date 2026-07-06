window.PREP_SITE.registerTopic({
  id: 'eh-wireless',
  module: 'eh',
  title: 'Wireless Security',
  estimatedReadTime: '30 min',
  tags: ['ethical-hacking', 'security', 'pentest', 'wireless', 'wifi', 'wpa2', 'wpa3', 'aircrack-ng', 'hashcat', 'bluetooth', 'rfid'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<div class="callout danger">
  <div class="callout-title">⚠️ Authorized networks only</div>
  <p>Every technique in this topic — monitor mode, handshake/PMKID capture, deauthentication, offline cracking, evil twin, Bluetooth and RFID probing — must be practiced only against a network, device, or card <strong>you own</strong>, or that you have <strong>explicit written authorization</strong> to test (your own home router in your own lab, a signed pentest scope, or a platform that has agreed to be tested). Deauthenticating someone else's access point, capturing someone else's handshake, or cloning someone else's badge without authorization is a crime almost everywhere, exactly as covered in Legal &amp; Safety in the Foundations topic — nothing about wireless makes it an exception.</p>
</div>
<p><strong>Wireless security</strong> covers attacking and defending Wi-Fi (802.11), plus a look at the neighboring short-range wireless protocols — Bluetooth and RFID/NFC — that show up in the same physical-proximity threat model. The core Wi-Fi story is the evolution of one handshake: WEP was broken by design, WPA/WPA2 secure a shared password behind a <strong>4-way handshake</strong> that can still be captured and cracked <em>offline</em>, and WPA3's <strong>SAE (Simultaneous Authentication of Equals)</strong> handshake finally closes that offline-cracking door for well-implemented deployments.</p>
<ul>
  <li><strong>The attack chain for WPA/WPA2-PSK:</strong> put a card into <strong>monitor mode</strong> (<code>airmon-ng</code>), find and target the AP (<code>airodump-ng</code>), optionally force a fresh handshake by kicking a client off with a <strong>deauth</strong> attack (<code>aireplay-ng</code>), then crack the captured handshake offline (<code>aircrack-ng</code>, or <code>hashcat</code> mode <strong>22000</strong>). The entire <strong>aircrack-ng suite</strong> — <code>airmon-ng</code>, <code>airodump-ng</code>, <code>aireplay-ng</code>, <code>aircrack-ng</code> — is the classic toolkit for exactly this chain.</li>
  <li><strong>PMKID is the modern shortcut:</strong> many APs cache a PMKID that can be requested directly from the AP itself — no client, no deauth, no waiting. <code>hcxdumptool</code> captures it, <code>hcxpcapngtool</code> converts it (and any handshakes) into hashcat's unified <strong>mode 22000</strong> format, and <code>hashcat</code> cracks it at GPU speed.</li>
  <li><strong>Wifite</strong> automates this whole decision tree — PMKID, handshake capture, and WPS attacks — against every visible target in one run, wrapping <code>aircrack-ng</code>, <code>hcxdumptool</code>, and other tools underneath.</li>
  <li><strong>Evil twin</strong> (conceptually, via tools like <code>airgeddon</code> orchestrating <code>hostapd</code>) attacks the human instead of the crypto: clone the SSID, lure or force clients onto a rogue AP, and harvest whatever they hand over.</li>
  <li><strong>Bluetooth</strong> (<code>bluetoothctl</code>) and <strong>RFID/NFC</strong> (<code>proxmark3</code>) extend the same "nearby, unauthenticated radio" threat model beyond Wi-Fi — device recon and, for RFID, low-security card cloning.</li>
  <li><strong>Defenses close this whole topic:</strong> WPA3-SAE, strong/long PSKs, 802.1X/EAP for anything beyond a home network, WIDS/rogue-AP detection, and disabling WPS — covered in Defenses &amp; Legal below.</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What wireless security testing actually is</h3>
<p>Wireless (Wi-Fi) security testing is the practice of assessing whether an 802.11 network's authentication and encryption actually hold up — usually by trying to obtain and crack the cryptographic material that protects it (a captured handshake or PMKID), and by testing whether the humans and infrastructure around it can be tricked (rogue APs, weak WPS PINs). It's a distinct discipline from web or network pentesting because the entire attack surface is <strong>physical radio proximity</strong>: an attacker doesn't need a foothold on the network or the internet, just an antenna within range.</p>

<h3>Why Wi-Fi is worth its own topic</h3>
<p>Wi-Fi sits in almost every home, office, and public space, and its threat model is unusual in three ways that don't apply to most of this module's other topics:</p>
<ul>
  <li><strong>Broadcast medium, no perimeter.</strong> Anyone in range can passively receive every frame sent over the air, whether or not they're "on" the network — there's no cable to physically tap.</li>
  <li><strong>Management frames were historically unauthenticated.</strong> Before 802.11w (Protected Management Frames), a client had no way to tell a genuine "disconnect" management frame from a forged one — which is exactly what makes the deauthentication attack (covered in Mechanics) possible at all.</li>
  <li><strong>The password is the whole perimeter, for most home/SOHO networks.</strong> WPA2-Personal collapses "who's allowed on this network" down to a single shared secret — so if that handshake is captured and the passphrase is weak, the entire network's confidentiality is gone in one offline crack, with no further interaction needed.</li>
</ul>

<h3>The encryption generations, and why each one replaced the last</h3>
<table>
  <thead><tr><th>Standard</th><th>Cipher / handshake</th><th>Core weakness</th><th>Status</th></tr></thead>
  <tbody>
    <tr><td><strong>WEP</strong> (1997)</td><td>RC4 stream cipher, small/reused IVs</td><td>IV reuse lets an attacker statistically recover the key from enough captured traffic — <code>aircrack-ng</code> breaks it in minutes</td><td>Broken by design; deprecated, should never appear in a modern network</td></tr>
    <tr><td><strong>WPA</strong> (2003)</td><td>TKIP (still RC4-based), 4-way handshake introduced</td><td>Interim fix for WEP; TKIP itself has known weaknesses (e.g. limited packet-injection attacks)</td><td>Legacy; effectively superseded by WPA2</td></tr>
    <tr><td><strong>WPA2</strong> (2004)</td><td>AES-CCMP, 4-way handshake (PSK or Enterprise/802.1X)</td><td>The handshake itself is sound cryptographically, but it's <em>capturable</em> — an attacker who captures it can crack the passphrase <strong>offline</strong>, at whatever speed their hardware allows, with zero further network interaction</td><td>Still the most widely deployed standard; secure only if the PSK is strong</td></tr>
    <tr><td><strong>WPA3</strong> (2018)</td><td>AES-GCMP, <strong>SAE</strong> (Dragonfly) handshake replaces the PSK exchange</td><td>SAE provides forward secrecy and resists offline dictionary attacks by design — but real-world implementations have shipped flaws (the "Dragonblood" research), and "transition mode" (WPA3 + WPA2 on the same SSID) reopens the WPA2 offline-cracking path</td><td>Current standard; adoption still catching up as of 2026</td></tr>
  </tbody>
</table>
<p>The throughline: every generation tries to remove the previous one's shortcut for an attacker, and every generation after WEP is only as strong as its actual deployment (a long, random WPA2 PSK is still solid; a WPA3 AP left in transition mode for "old device compatibility" gives an attacker the WPA2 downgrade path right back).</p>

<h3>Why Bluetooth and RFID/NFC belong in the same topic</h3>
<p>Bluetooth and RFID/NFC aren't Wi-Fi, but they share the exact same threat model that makes wireless testing its own discipline: short-range, broadcast, radio-based, and frequently protected by weak or no authentication by default (a discoverable Bluetooth device, or a MIFARE Classic access card using the long-broken Crypto1 cipher). They're covered here as an intentionally brief intro — enough to recognize the attack surface and the standard tooling (<code>bluetoothctl</code>, <code>proxmark3</code>), not as a deep dive.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>802.11 frames: why some of them can be forged</h3>
<p>802.11 traffic is split into three frame types, and the split explains almost every attack in this topic:</p>
<ul>
  <li><strong>Data frames</strong> — the actual payload. Encrypted end-to-end by whatever the network's cipher is (RC4/TKIP/CCMP/GCMP).</li>
  <li><strong>Control frames</strong> — low-level radio housekeeping (ACKs, RTS/CTS).</li>
  <li><strong>Management frames</strong> — beacons, probe requests/responses, association, authentication, and <strong>deauthentication</strong>. Critically, <em>these were not encrypted or authenticated at all</em> until 802.11w (Protected Management Frames, "PMF") — meaning any nearby device could forge a "deauth" frame appearing to come from the AP or a client, and the receiver had no way to tell it was fake. This single gap is the entire basis of the deauth attack covered below.</li>
</ul>

<h3>The 4-way handshake, and why capturing it is the whole game (WPA/WPA2-PSK)</h3>
<p>When a client joins a WPA/WPA2-PSK network, the AP and client don't send the passphrase over the air — they run a 4-message exchange that proves both sides know it, while deriving fresh per-session encryption keys:</p>
<pre><code class="language-text">1. AP  → Client : ANonce (AP's random nonce)
2. Client → AP  : SNonce (client's random nonce) + MIC
                   (client can now compute the PTK: PSK + ANonce + SNonce + both MAC addresses → PMK → PTK)
3. AP  → Client : GTK (group key) + MIC
                   (AP independently computes the same PTK and confirms the MIC)
4. Client → AP  : ACK
</code></pre>
<p>Everything needed to <em>verify</em> a candidate passphrase — both nonces, both MAC addresses, and a MIC to check the guess against — flies across the air in messages 1 and 2, and neither message is encrypted (they're establishing the keys, so they can't be). An attacker who captures just those two messages can walk away and try candidate passphrases against the MIC completely offline, as fast as their hardware allows, with zero further contact with the network. That's the single fact that makes handshake-capture-then-crack the standard attack, and it's also exactly why a long, high-entropy PSK (covered in Defenses &amp; Legal) is the only real mitigation — the crypto isn't broken, the passphrase's search space is the target.</p>

<h3>PMKID: a shortcut that skips the handshake entirely</h3>
<p>Separately, many access points support a roaming optimization: they compute and cache a <strong>PMKID</strong> (derived from the PMK, the AP's MAC, and the client's MAC) and will hand it to <em>any</em> device that starts an EAPOL association attempt — including an attacker who never actually associates or brings a real client into the picture. Because the PMKID is derived the same way the PTK is, it can be attacked offline exactly like a captured handshake, just via a different, often faster and more reliable path (no client, no deauth, no waiting for a reconnect).</p>

<h3>WPA3's SAE: closing the offline door</h3>
<p>WPA3-Personal replaces the PSK 4-way handshake with <strong>SAE</strong> ("Simultaneous Authentication of Equals," also called the Dragonfly handshake). SAE is a password-authenticated key exchange: each side proves knowledge of the password through a zero-knowledge-style exchange that <em>doesn't</em> hand an attacker enough material to brute-force offline — every guess requires a fresh live interaction with the real AP, which can be rate-limited, unlike an offline WPA2 crack that runs at full GPU speed with no one watching. SAE also provides forward secrecy (past sessions stay safe even if the password later leaks). The catch, covered in What &amp; Why's table, is that this guarantee depends on correct implementation and on not falling back to WPA2 via transition mode.</p>

<h3>The overall attack-chain map for this topic</h3>
<pre><code class="language-text">                              ┌─ Handshake path ─┐
Monitor mode  →  Recon        │  deauth (optional) │  → Offline crack
(airmon-ng)      (airodump-ng)│  → capture 4-way    │    (aircrack-ng /
                              │     handshake        │     hashcat -m 22000)
                              └─ PMKID path ──────┘
                                 hcxdumptool → hcxpcapngtool

Automated across both paths + WPS:  wifite

Attacking the human instead of the crypto:  evil twin (airgeddon/hostapd)

Sibling short-range protocols:  Bluetooth (bluetoothctl)  |  RFID/NFC (proxmark3)
</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Tools & Attack Mechanics', html: `
<h3>Step 1 — Monitor mode: <code>airmon-ng</code></h3>
<p>A normal Wi-Fi adapter only hears traffic addressed to it. <strong>Monitor mode</strong> puts a compatible adapter into a mode where it captures every 802.11 frame in the air on its current channel, regardless of destination — the prerequisite for everything that follows.</p>
<pre><code class="language-bash"># Kill processes that commonly interfere with monitor mode (NetworkManager, wpa_supplicant):
sudo airmon-ng check kill

# Put the adapter into monitor mode (creates e.g. wlan0mon):
sudo airmon-ng start wlan0

# Confirm the new monitor-mode interface:
iwconfig</code></pre>

<h3>Step 2 — Recon and targeted capture: <code>airodump-ng</code></h3>
<p>With the card in monitor mode, <code>airodump-ng</code> both discovers nearby networks/clients and, when targeted at one BSSID, writes every frame it hears (including a 4-way handshake, if one occurs) to a capture file.</p>
<pre><code class="language-bash"># Broad recon: list every AP and connected client in range, with channel and signal:
sudo airodump-ng wlan0mon

# Target one AP on its channel, writing captured frames (and any handshake) to disk:
sudo airodump-ng --bssid &lt;bssid&gt; -c &lt;channel&gt; -w capture wlan0mon</code></pre>
<p>The top-right of <code>airodump-ng</code>'s display shows <code>WPA handshake: &lt;bssid&gt;</code> the moment a full 4-way handshake is captured — that's the signal to stop and move to cracking.</p>

<h3>Step 3 — Forcing a handshake: <code>aireplay-ng</code> and the deauthentication attack</h3>
<p>If no client reconnects on its own, an attacker can force one: send forged deauthentication frames (exploiting the unauthenticated-management-frame gap from Mental Model) impersonating the AP, kicking a connected client off — which, on an ordinary client, triggers an automatic reconnect and a fresh 4-way handshake for <code>airodump-ng</code> to capture.</p>
<pre><code class="language-bash"># Send 10 deauth frames at a specific client (-c), targeting the AP (-a):
sudo aireplay-ng --deauth 10 -a &lt;bssid&gt; -c &lt;client-mac&gt; wlan0mon

# Omit -c to deauth every client on the AP at once:
sudo aireplay-ng --deauth 10 -a &lt;bssid&gt; wlan0mon

# 0 means "send continuously until interrupted" instead of a fixed count:
sudo aireplay-ng --deauth 0 -a &lt;bssid&gt; wlan0mon</code></pre>
<p>This is the attack that 802.11w (PMF) was specifically designed to stop — on a PMF-enforcing network, forged deauth frames are rejected, which is one reason PMF/WPA3 close this whole avenue off.</p>

<h3>Step 4 — Offline cracking: <code>aircrack-ng</code></h3>
<p>With a captured handshake in hand, cracking never touches the network again — it's a pure offline dictionary (or brute-force) attack against the MIC from Mental Model's handshake diagram.</p>
<pre><code class="language-bash"># Crack a captured handshake against a wordlist, restricting to one BSSID:
aircrack-ng -w wordlist.txt -b &lt;bssid&gt; capture-01.cap</code></pre>

<h3>The PMKID shortcut: <code>hcxdumptool</code> + <code>hcxpcapngtool</code> + <code>hashcat</code> mode 22000</h3>
<p>Instead of waiting for a client and deauthing it, <code>hcxdumptool</code> requests the PMKID directly from the AP — no client interaction and no deauth needed, which also makes it stealthier and often faster.</p>
<pre><code class="language-bash"># Capture PMKIDs (and any handshakes seen in passing) into a pcapng file:
sudo hcxdumptool -i wlan0mon -o capture.pcapng --active_beacon --enable_status=15

# Convert the capture into hashcat's unified WPA hash format:
hcxpcapngtool -o wpa.22000 capture.pcapng

# Crack it — mode 22000 is hashcat's current, unified WPA hash mode: it
# handles BOTH PMKID and full 4-way-handshake hashes in the same run, and
# has replaced the older, now-deprecated modes 2500 (handshake-only) and
# 16800 (PMKID-only):
hashcat -m 22000 -a 0 wpa.22000 wordlist.txt</code></pre>
<div class="callout info">
  <div class="callout-title">Accuracy note: hashcat WPA mode is 22000, not 2500</div>
  <p>Older guides (pre-2021) reference hashcat mode <code>2500</code> for handshakes and <code>16800</code> for PMKID-only. Both are superseded — current hashcat consolidates both hash types into mode <strong>22000</strong>, produced directly by <code>hcxpcapngtool</code>. Use 22000 for anything written in 2026.</p>
</div>

<h3>Automating the whole decision tree: <code>wifite</code></h3>
<p><code>wifite</code> wraps <code>aircrack-ng</code>, <code>hcxdumptool</code>, and WPS tooling (<code>reaver</code>-style pixie-dust/PIN attacks) behind one interactive tool: point it at an interface, and by default it tries PMKID capture first, then a handshake-capture-plus-deauth attack, then WPS attacks, against every visible target in range — exactly the two paths mapped in Mental Model, automated end to end.</p>
<pre><code class="language-bash"># Scan and interactively attack every visible target with default attack order
# (PMKID → handshake capture+deauth → WPS):
sudo wifite

# Target one specific SSID, kill interfering processes first, use a specific wordlist:
sudo wifite --kill -e "&lt;ssid&gt;" --dict wordlist.txt

# Restrict to WPA/WPA2 attacks only (skip WEP and WPS attempts):
sudo wifite --wpa</code></pre>

<h3>Evil twin: attacking the client, not the crypto (concept only)</h3>
<p>An <strong>evil twin</strong> is a rogue access point broadcasting the same (or a confusingly similar) SSID as a legitimate network, hoping victims connect to it instead — either because their device auto-reconnects to a remembered SSID, or because a deauth attack pushed them off the real AP right as the fake one appeared. Once a client is on the rogue AP, the attacker controls its DHCP/DNS and can serve a fake captive portal asking the victim to "re-enter the Wi-Fi password" (which then gets checked against the real handshake) or simply observe unencrypted traffic. Under the hood, the rogue AP itself is usually just <strong>hostapd</strong> (the standard Linux AP daemon) paired with a DHCP/DNS service (commonly <code>dnsmasq</code>); tools like <strong>airgeddon</strong> exist purely to orchestrate that setup — scan for a target, clone its SSID, launch <code>hostapd</code> and a captive-portal page, and log whatever a victim submits — through a menu-driven interface instead of hand-configuring each piece. This module treats evil twin conceptually: recognize the components (clone SSID → hostapd rogue AP → optional deauth of the real AP → captive portal or open traffic capture) rather than running a full credential-harvesting exercise, and never against a real, non-lab SSID or unwitting third parties.</p>

<h3>Bluetooth: recon with <code>bluetoothctl</code></h3>
<p>Bluetooth shares Wi-Fi's "nearby broadcast radio" threat model: discoverable devices advertise their presence and, depending on pairing mode and firmware, can be vulnerable to eavesdropping, forced pairing, or protocol-stack exploits (e.g. the historical "BlueBorne" vulnerability class). <code>bluetoothctl</code> is BlueZ's interactive control shell — the standard starting point for Bluetooth recon on Linux.</p>
<pre><code class="language-bash">bluetoothctl
# inside the interactive shell:
power on              # ensure the local adapter is powered
agent on               # enable a pairing agent
scan on                 # start discovering nearby advertising devices
devices                 # list discovered device addresses and names
info &lt;device-mac&gt;      # show detail (services, class) for one device
pair &lt;device-mac&gt;      # attempt to pair with it</code></pre>

<h3>RFID/NFC: intro with <code>proxmark3</code></h3>
<p>Many building-access cards and low-cost RFID tags use weak or nonexistent cryptography — low-frequency (125 kHz) prox cards typically have none at all, and high-frequency MIFARE Classic cards rely on the long-broken proprietary Crypto1 cipher. The <strong>Proxmark3</strong> is the standard hardware/software platform for RFID/NFC research: identify a card, and where the cipher is weak, read and clone it onto a blank, writable tag.</p>
<pre><code class="language-bash"># Launch the Proxmark3 client against the device:
proxmark3 /dev/ttyACM0

# Inside the client — identify what's on the antenna:
hf search               # identify a high-frequency card (e.g. MIFARE Classic)
lf search                # identify a low-frequency card (e.g. a basic 125 kHz prox card)

# Clone a read low-frequency HID prox card's ID onto a writable T5577 tag:
lf hid clone &lt;card-id&gt;</code></pre>
<p>As with Bluetooth, this is intentionally an intro: recognize the tool and the weak-crypto threat model, not a full RFID-cloning methodology — and only ever against a card/badge you own or are explicitly authorized to test.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Worked Examples', html: `
<h3>Example 1 — Manual WPA2 handshake capture and crack, with the full aircrack-ng suite</h3>
<pre><code class="language-bash"># 1. Stop interfering processes and enable monitor mode:
sudo airmon-ng check kill
sudo airmon-ng start wlan0
# → creates wlan0mon

# 2. Recon: find the target AP's BSSID and channel (your own lab AP only):
sudo airodump-ng wlan0mon
# → note BSSID and channel from the listing, e.g. channel 6

# 3. Lock onto that AP and start writing captured frames to disk:
sudo airodump-ng --bssid &lt;bssid&gt; -c 6 -w capture wlan0mon

# 4. In a second terminal, force a fresh handshake by deauthing one client:
sudo aireplay-ng --deauth 10 -a &lt;bssid&gt; -c &lt;client-mac&gt; wlan0mon

# 5. Watch the airodump-ng terminal for "WPA handshake: &lt;bssid&gt;" top-right,
#    then stop the capture (Ctrl+C).

# 6. Crack the captured handshake offline, entirely disconnected from the network:
aircrack-ng -w wordlist.txt -b &lt;bssid&gt; capture-01.cap</code></pre>
<p>Notice the handoff at step 5→6: once the handshake is on disk, the AP is never touched again — cracking is a pure offline computation against the MIC, exactly as described in Mental Model, which is why a strong passphrase (not a "harder to find" network) is the actual defense.</p>

<h3>Example 2 — The PMKID shortcut: no client, no deauth</h3>
<pre><code class="language-bash"># 1. Same monitor-mode prerequisite as Example 1:
sudo airmon-ng check kill
sudo airmon-ng start wlan0

# 2. Ask hcxdumptool to request PMKIDs from any AP that supports the caching
#    optimization — note there's no --bssid targeting step and no deauth call:
sudo hcxdumptool -i wlan0mon -o capture.pcapng --active_beacon --enable_status=15
# let it run for a short window, then Ctrl+C

# 3. Convert whatever was captured (PMKIDs and/or handshakes) into hashcat's
#    unified format:
hcxpcapngtool -o wpa.22000 capture.pcapng

# 4. Crack with hashcat's current WPA mode — 22000, not the deprecated 2500/16800:
hashcat -m 22000 -a 0 wpa.22000 wordlist.txt</code></pre>
<p>The clientless design is the entire advantage over Example 1: no client needs to be present or coaxed into reconnecting, there's no deauth traffic for a WIDS to flag, and it's often faster in practice against APs that support PMKID caching.</p>

<h3>Example 3 — Automating both paths with wifite, plus a quick Bluetooth/RFID recon pass</h3>
<pre><code class="language-bash"># Let wifite try PMKID, then handshake-capture-plus-deauth, then WPS attacks,
# against every visible target, entirely automated:
sudo wifite --kill --dict wordlist.txt

# Or aim it at one known SSID (your own lab AP):
sudo wifite -e "&lt;ssid&gt;" --dict wordlist.txt

# ── Separately, a short Bluetooth recon pass with bluetoothctl: ──
bluetoothctl
power on
scan on
devices
info &lt;device-mac&gt;

# ── And a quick RFID identification pass with a Proxmark3: ──
proxmark3 /dev/ttyACM0
hf search
lf search</code></pre>
<p>The pattern across all three tools is the same "identify, then attack only if authorized" shape: <code>wifite</code> and <code>bluetoothctl</code>'s <code>scan</code>/<code>devices</code> and the Proxmark3's <code>search</code> commands are all recon-only — nothing here is exploited or cloned until a specific, in-scope target is chosen deliberately, on hardware you own or are authorized to test.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '⚠️ Defenses & Legal', html: `
<div class="callout danger">
  <div class="callout-title">⚠️ Authorization and "test your own network" still apply here, without exception</div>
  <p>Deauthenticating a network, capturing a handshake or PMKID, running an evil twin, or probing Bluetooth/RFID devices you don't own and aren't explicitly authorized to test is unauthorized access and/or wireless-interference activity under the CFAA and its international equivalents (covered in the Foundations topic's Legal &amp; Safety) — the same "own it or have it in writing" rule from every other topic in this module, with zero wireless-specific exception. Practice exclusively against your own router/AP in your own isolated lab, or within a signed, in-scope engagement.</p>
</div>

<h3>WPA3 / SAE — close the offline-cracking door WEP/WPA/WPA2 all leave open</h3>
<p>Migrating an AP to <strong>WPA3-Personal (SAE)</strong> is the single highest-leverage fix covered in this topic: SAE's zero-knowledge-style exchange means an attacker who captures the handshake still can't brute-force it offline — every password guess requires a live, rate-limitable interaction with the real AP, unlike a captured WPA2 handshake which can be attacked at full GPU speed with nobody watching. The one operational trap: leaving the AP in <strong>WPA3/WPA2 transition mode</strong> "for compatibility with older devices" reopens exactly the WPA2 offline-crack path this topic covers — disable transition mode as soon as every connecting device supports WPA3.</p>

<h3>Strong PSK — the mitigation that still matters even without WPA3</h3>
<p>For any network still on WPA2-PSK (the large majority, as of 2026), the entire defense against Example 1 and 2's handshake/PMKID cracking is passphrase strength: a long (16+ character), high-entropy, non-dictionary passphrase makes offline cracking computationally infeasible regardless of how fast the attacker's hardware is — because the crypto isn't what's being attacked, the passphrase's search space is.</p>

<h3>802.1X / EAP — move beyond a shared secret entirely</h3>
<p>For anything beyond a home network, <strong>WPA2-Enterprise or WPA3-Enterprise with 802.1X/EAP</strong> removes the shared-PSK model altogether: each user or device authenticates individually against a RADIUS server (commonly with per-user credentials or certificates), so there's no single passphrase whose capture compromises the whole network, and a compromised or departing user's access can be revoked individually instead of forcing a network-wide password rotation.</p>

<h3>WIDS / rogue-AP detection — catch the deauth and evil-twin attacks, not just the crypto</h3>
<p>A <strong>Wireless Intrusion Detection System (WIDS)</strong> monitors the RF environment for exactly the anomalies this topic's attacks produce: bursts of deauthentication frames, an unexpected AP broadcasting a known SSID from an unrecognized BSSID (the signature of an evil twin), or unusual client-disconnect/reconnect patterns — and can alert or, in some enterprise deployments, actively counter a detected rogue AP. This is the defensive answer to both the deauth attack and the evil-twin concept covered in Mechanics.</p>

<h3>Disable WPS</h3>
<p><strong>WPS (Wi-Fi Protected Setup)</strong>, the "push a button or enter an 8-digit PIN" convenience feature, has shipped with widespread implementation flaws (its PIN design and, in many devices, a "pixie dust" offline weakness that <code>wifite</code>'s bundled WPS attacks target by default) that can hand over the PSK regardless of how strong the passphrase itself is. Disabling WPS in the router's admin settings removes this shortcut entirely, independent of every other defense above.</p>

<h3>Authorization and test-your-own-network — the constant from every other topic</h3>
<p>None of the defenses above matter if the underlying rule from this module's Foundations topic is skipped: only ever run these tools against your own equipment in an isolated lab, or within a written, in-scope authorization. That's not a wireless-specific caveat — it's the same one rule this entire module is built on, applied here to routers, phones, and RFID badges instead of web apps and servers.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'cheat-sheet', title: '📋 Cheat Sheet', html: `
<table>
  <thead><tr><th>Category</th><th>Item</th><th>What it means</th></tr></thead>
  <tbody>
    <tr><td>Encryption</td><td>WEP</td><td>RC4 + small/reused IVs; broken by design, cracked by <code>aircrack-ng</code> in minutes</td></tr>
    <tr><td>Encryption</td><td>WPA</td><td>TKIP (still RC4-based) interim fix; legacy</td></tr>
    <tr><td>Encryption</td><td>WPA2</td><td>AES-CCMP; sound crypto, but the 4-way handshake is capturable and crackable offline</td></tr>
    <tr><td>Encryption</td><td>WPA3</td><td>AES-GCMP + SAE handshake; resists offline dictionary attacks if not left in WPA2 transition mode</td></tr>
    <tr><td>Concept</td><td>4-way handshake</td><td>ANonce/SNonce exchange that derives the PTK; messages 1-2 give an attacker everything needed to crack the PSK offline</td></tr>
    <tr><td>Concept</td><td>SAE / Dragonfly</td><td>WPA3's password-authenticated key exchange; every guess needs a live AP interaction, no offline shortcut</td></tr>
    <tr><td>Concept</td><td>PMKID</td><td>AP-cached roaming key material; requestable directly from the AP with no client or deauth needed</td></tr>
    <tr><td>Concept</td><td>Monitor mode</td><td>Adapter mode that captures all nearby 802.11 frames, not just ones addressed to it</td></tr>
    <tr><td>Concept</td><td>Deauthentication</td><td>Forged unauthenticated management frame that disconnects a client, forcing a fresh handshake</td></tr>
    <tr><td>Tool</td><td><code>airmon-ng</code></td><td>Enable/disable monitor mode (<code>airmon-ng start wlan0</code>)</td></tr>
    <tr><td>Tool</td><td><code>airodump-ng</code></td><td>Recon + targeted capture of frames/handshakes to a file</td></tr>
    <tr><td>Tool</td><td><code>aireplay-ng</code></td><td>Inject frames — most commonly <code>--deauth</code> to force a handshake</td></tr>
    <tr><td>Tool</td><td><code>aircrack-ng</code></td><td>Offline dictionary/brute-force crack of a captured handshake (WEP or WPA/WPA2)</td></tr>
    <tr><td>Tool</td><td><code>wifite</code></td><td>Automates PMKID + handshake + WPS attacks against every visible target</td></tr>
    <tr><td>Tool</td><td><code>hcxdumptool</code></td><td>Captures PMKIDs (and handshakes) directly from APs, clientless</td></tr>
    <tr><td>Tool</td><td><code>hcxpcapngtool</code></td><td>Converts captures into hashcat's unified WPA hash format (mode 22000)</td></tr>
    <tr><td>Tool</td><td><code>hashcat -m 22000</code></td><td>Current unified WPA hash mode — handles both PMKID and handshake hashes; replaces deprecated 2500/16800</td></tr>
    <tr><td>Tool</td><td><code>airgeddon</code> / <code>hostapd</code></td><td>Menu-driven orchestration of a rogue AP (evil twin) — hostapd is the underlying AP daemon</td></tr>
    <tr><td>Tool</td><td><code>bluetoothctl</code></td><td>BlueZ interactive shell — Bluetooth device scan/pair/recon</td></tr>
    <tr><td>Tool</td><td><code>proxmark3</code></td><td>RFID/NFC identification (<code>hf search</code>/<code>lf search</code>) and low-security card cloning</td></tr>
    <tr><td>Attack</td><td>Evil twin</td><td>Rogue AP cloning a legitimate SSID to lure/force clients and harvest credentials or traffic</td></tr>
    <tr><td>Attack</td><td>WPS pixie dust / PIN</td><td>Implementation weaknesses in WPS that can recover the PSK regardless of passphrase strength</td></tr>
    <tr><td>Defense</td><td>WPA3-SAE (no transition mode)</td><td>Removes offline-cracking as a viable attack against the PSK</td></tr>
    <tr><td>Defense</td><td>Strong PSK</td><td>Long, high-entropy, non-dictionary passphrase — the main defense while still on WPA2</td></tr>
    <tr><td>Defense</td><td>802.1X / EAP (Enterprise)</td><td>Per-user/device RADIUS authentication instead of one shared secret</td></tr>
    <tr><td>Defense</td><td>WIDS / rogue-AP detection</td><td>Flags deauth floods and unauthorized APs broadcasting a known SSID</td></tr>
    <tr><td>Defense</td><td>Disable WPS</td><td>Removes a PSK-recovery shortcut independent of passphrase strength</td></tr>
    <tr><td>Legal must-have</td><td>Authorization / own network only</td><td>Every technique above requires ownership or explicit written, in-scope authorization</td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">Walk me through the WPA2 4-way handshake, and explain why capturing it matters for an attacker.</div>
<div class="qa-a">
<p>The AP sends an ANonce, the client replies with its own SNonce plus a MIC, the AP replies with the group key plus its own MIC, and the client ACKs. Both sides independently derive the same PTK from the PSK, both nonces, and both MAC addresses. The key fact for security is that messages 1 and 2 aren't encrypted — they can't be, since they're what establishes the keys in the first place — so an attacker who simply captures those two frames off the air has everything needed to test candidate passphrases against the MIC completely offline, at whatever speed their hardware allows, with no further contact with the network. That's why handshake-capture-then-crack (via <code>airodump-ng</code> to capture and <code>aircrack-ng</code> or <code>hashcat</code> to crack) is the standard WPA2 attack, and why passphrase strength — not the crypto itself — is the actual thing being attacked.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Why does a deauthentication attack work at all, and what stops it?</div>
<div class="qa-a">
<p>802.11 management frames — including deauthentication frames — were unauthenticated and unencrypted until 802.11w (Protected Management Frames). That means historically, any nearby device could forge a deauth frame that looked like it came from the AP, and a client receiving it had no way to verify it was real — it would simply disconnect, exactly as designed. Tools like <code>aireplay-ng --deauth</code> exploit this to force a client off the network so it reconnects and produces a fresh, capturable 4-way handshake. The fix is enforcing 802.11w/PMF, which cryptographically protects management frames so forged deauth frames are rejected — WPA3 requires PMF, which is one of several reasons WPA3 closes off attacks that work fine against WPA2.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What is a PMKID attack, and why is it considered better than the classic handshake-capture approach?</div>
<div class="qa-a">
<p>Many access points cache a PMKID — derived from the PMK plus the AP's and client's MAC addresses — as a roaming optimization, and will hand it to any device that initiates an association attempt, whether or not a real client or handshake is ever involved. <code>hcxdumptool</code> requests this directly from the AP, <code>hcxpcapngtool</code> converts it into hashcat's hash format, and it's crackable offline the same way a captured handshake is. The advantage over the classic approach is that it needs no connected client to deauth and no waiting for a reconnect — it's clientless, often faster, and produces no deauth traffic for a WIDS to flag.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What hashcat mode is used to crack WPA/WPA2 today, and what did it replace?</div>
<div class="qa-a">
<p>Mode <strong>22000</strong> is hashcat's current, unified WPA hash mode — it handles both PMKID hashes and full 4-way-handshake hashes in the same run, and is produced directly by <code>hcxpcapngtool</code> from an <code>hcxdumptool</code> capture. It replaced two older, now-deprecated modes: <strong>2500</strong> (handshake-only) and <strong>16800</strong> (PMKID-only). Anyone citing mode 2500 in 2026 is working from outdated material — 22000 is the one to use and the one interviewers expect to hear.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">How does WPA3's SAE handshake actually prevent the offline cracking that works against WPA2?</div>
<div class="qa-a">
<p>SAE ("Simultaneous Authentication of Equals," the Dragonfly handshake) is a password-authenticated key exchange rather than a nonce-based handshake like WPA2's. Critically, it doesn't leak enough material in the exchange for an attacker to verify password guesses purely offline — every single guess requires an actual live interaction with the real AP, which can be detected and rate-limited, unlike an offline WPA2 crack running unattended at full GPU speed. It also provides forward secrecy. The important caveat: this guarantee is about the SAE design — real implementations have shipped flaws (the "Dragonblood" research found side-channel leaks and downgrade issues), and leaving an AP in WPA3/WPA2 "transition mode" for backward compatibility reopens the WPA2 offline-cracking path entirely, so transition mode should be disabled once it's no longer needed.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What is an evil twin attack, and what's the actual defense against it?</div>
<div class="qa-a">
<p>An evil twin is a rogue access point broadcasting the same SSID as a legitimate network — usually paired with <code>hostapd</code> as the underlying AP daemon and, in tools like <code>airgeddon</code>, an automated captive portal — hoping victims connect to it (either automatically, via a remembered-network reconnect, or after being pushed off the real AP by a deauth attack) so their traffic or resubmitted credentials can be captured. It attacks the human and the client device's trust in a familiar SSID, not the encryption itself. The defense is mainly detective and procedural rather than purely cryptographic: WIDS/rogue-AP detection to flag an unrecognized BSSID broadcasting a known SSID, 802.1X/EAP so clients validate the network via certificates rather than trusting an SSID name alone, and user awareness not to re-enter a Wi-Fi password into a captive portal that suddenly reappears.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Why are WPS, weak Bluetooth pairing, and low-frequency RFID cards grouped together as a security concern?</div>
<div class="qa-a">
<p>All three are convenience features that trade authentication strength for ease of use, and all three have a documented history of that trade going too far: WPS's PIN design and common "pixie dust" implementation flaws can recover a WPA2 PSK regardless of how strong the passphrase is (which is why tools like <code>wifite</code> attack WPS by default); many Bluetooth devices ship discoverable and accept pairing with weak or no user confirmation; and low-frequency 125 kHz prox cards typically carry no cryptography at all, while HF MIFARE Classic relies on the long-broken Crypto1 cipher, making both readable and cloneable with a tool like a Proxmark3. The common lesson across all three: disable the convenience feature (WPS) or the weak protocol/card type where a stronger alternative exists, rather than assuming "it's proprietary" or "it's short-range" makes it secure.</p>
</div>
</div>
`}

]});
