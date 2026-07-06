window.PREP_SITE.registerTopic({
  id: 'eh-passwords',
  module: 'eh',
  title: 'Password Attacks & Cracking',
  estimatedReadTime: '34 min',
  tags: ['ethical-hacking', 'security', 'pentest', 'passwords', 'hashcat', 'john-the-ripper', 'hydra', 'credential-stuffing', 'spraying'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<div class="callout danger">
  <div class="callout-title">⚠️ Authorized targets only — this is exactly as illegal to misuse as anything else in this module</div>
  <p>Every technique below — online brute-forcing with <code>hydra</code>/<code>medusa</code>/<code>ncrack</code>/<code>patator</code>, offline cracking with <code>john</code>/<code>hashcat</code>, password spraying, credential stuffing — is unauthorized access under the CFAA and its international equivalents (covered in Foundations, Ethics &amp; Legal) the instant it's pointed at a live account, service, or hash dump you don't own and haven't been explicitly authorized to test. Every example in this topic targets hashes generated in your own lab, deliberately vulnerable lab VMs, or hash dumps pulled during a scoped, authorized engagement — never a real account belonging to someone else.</p>
</div>
<p><strong>Password attacks</strong> are the family of techniques for recovering or guessing a valid credential. They split along one fundamental axis: <strong>online</strong> attacks guess repeatedly against a live authentication endpoint (rate-limited, loud, and risks locking out the very account you're testing), while <strong>offline</strong> attacks crack a stolen password <em>hash</em> with no rate limit at all — the only limit is your hardware and how well-chosen your wordlist, rules, and masks are.</p>
<ul>
  <li><strong>Hashing is one-way; encryption is reversible.</strong> Passwords are (or should be) stored as a salted hash, never encrypted — there's no legitimate reason a server should ever be able to recover your plaintext password. Salting defeats precomputed <strong>rainbow tables</strong> and hides which users share a password.</li>
  <li><strong>Identify the hash before attacking it.</strong> <code>hashid</code> (its modern, maintained replacement for the deprecated <code>hash-identifier</code>) fingerprints a hash string and suggests candidate algorithms plus the matching <code>hashcat</code> mode and John format — the mandatory first step before either cracker can be pointed at it correctly.</li>
  <li><strong>Online guessing</strong> (<code>hydra</code>, <code>medusa</code>, <code>ncrack</code>, <code>patator</code>) attacks a live service directly and is throttled by network latency and, critically, by account-lockout policy — a handful of failed attempts can lock the account you're testing, so online attacks are run carefully, slowly, and only against explicitly in-scope accounts.</li>
  <li><strong>Offline cracking</strong> (<code>john</code>, and especially GPU-accelerated <code>hashcat</code>) attacks a stolen hash with no lockout risk at all. <code>hashcat</code>'s five core attack modes — <strong>0 straight/dictionary, 1 combinator, 3 mask/brute-force, 6 hybrid wordlist+mask, 7 hybrid mask+wordlist</strong> — cover almost everything from "try this leaked wordlist" to "I know the company's password pattern, brute-force the rest."</li>
  <li><strong>Wordlists and mutation rules do the real work.</strong> <code>rockyou.txt</code> and SecLists supply raw candidate passwords; <code>crunch</code> generates exhaustive charset-based lists; <code>cewl</code> scrapes a target's own website for site-specific jargon; hashcat/john <strong>rules</strong> mutate each word (capitalize, append digits, leetspeak) to model real human habits.</li>
  <li><strong>Spraying and stuffing are credential-reuse attacks, not cracking</strong> — conceptually simple (try one common password across many accounts, or replay creds leaked from an unrelated breach), extremely effective against real organizations, and covered here conceptually with their lockout and legal implications, not as a live-fire walkthrough.</li>
  <li><strong>None of this matters if the defenses are done right</strong>: slow, memory-hard hashing (bcrypt/argon2/scrypt), MFA, sane password policy, and lockout/rate-limiting turn every technique in this topic from "trivial" into "impractical" — covered in Defenses &amp; Legal below.</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>Hashing vs. encryption: why passwords are never "decrypted"</h3>
<p><strong>Encryption</strong> is reversible by design — encrypt with a key, decrypt with the (same or paired) key, get the original plaintext back. <strong>Hashing</strong> is deliberately one-way: a hash function takes an input of any length and produces a fixed-length digest, and there is no key or operation that turns the digest back into the input. A well-designed authentication system never stores a password anywhere in a form that could be decrypted — it stores a hash, and login works by hashing whatever the user just typed and comparing the two hashes. If a database of hashes leaks, the attacker doesn't "decrypt" anything; they <strong>guess</strong> candidate passwords, hash each guess the same way the server would, and check for a match. Every technique in this topic — online and offline alike — is a variation on that same guess-and-compare loop; the only thing that changes is where the comparison happens (a live login endpoint vs. a stolen hash) and how the guesses are generated.</p>
<p>Common hash algorithms fall into two very different buckets in this context:</p>
<table>
  <thead><tr><th>Bucket</th><th>Examples</th><th>Why it matters here</th></tr></thead>
  <tbody>
    <tr><td><strong>Fast, general-purpose digests</strong></td><td>MD5, SHA-1, SHA-256, SHA-512, NTLM (MD4-based)</td><td>Designed for speed (file integrity, checksums) — which makes them <em>bad</em> for passwords: a modern GPU computes billions of these per second, so cracking is fast whenever one of these is (mis)used to store a password.</td></tr>
    <tr><td><strong>Slow, purpose-built password hashes</strong></td><td>bcrypt, scrypt, Argon2 (Argon2id), PBKDF2, and Unix <code>md5crypt</code>/<code>sha512crypt</code></td><td>Deliberately slow and (for scrypt/Argon2) memory-hard, specifically to make large-scale guessing expensive even on GPUs/ASICs. This is what "correctly stored" passwords look like — detailed in Defenses &amp; Legal below.</td></tr>
  </tbody>
</table>

<h3>Salting: why two identical passwords don't produce identical hashes</h3>
<p>A <strong>salt</strong> is random data generated per-password and stored alongside the hash (it doesn't need to be secret). The server computes <code>hash(salt + password)</code> instead of <code>hash(password)</code> alone. Salting solves two concrete problems: it means two users with the same password ("password123") get completely different stored hashes, so a leak doesn't reveal who shares a password; and, far more importantly for this topic, it defeats <strong>rainbow tables</strong> — precomputed hash→password lookup tables become useless once every hash in a leak effectively needs its own table, because each one was salted differently (covered further in Mechanics). A <strong>pepper</strong> is a related but separate concept: a single secret value, not stored in the database at all (kept in application config or a secrets manager), added to every password before hashing — it adds defense-in-depth against a database-only leak, but unlike a salt it isn't unique per-user.</p>

<h3>Why password attacks are worth an entire topic</h3>
<p>Stolen, weak, reused, or guessed credentials are consistently one of the most common ways real attackers get their initial foothold — industry breach reports year after year put compromised credentials among the top few initial-access vectors, ahead of most exploit-based techniques. That's precisely why this topic exists in a pentest methodology: an engagement that only checks for software vulnerabilities and ignores credential weaknesses is testing half the actual attack surface. Password attacks let a tester answer concrete questions a client actually needs answered — "if an employee's password leaked in an unrelated breach, could it get someone into our VPN?", "does our password policy actually resist a dictionary attack?", "if our password database is ever stolen, how expensive is it to crack in practice?" — and the answers directly drive the Defenses &amp; Legal recommendations at the end of this topic.</p>

<h3>Online vs. offline: the split everything else in this topic hangs on</h3>
<table>
  <thead><tr><th></th><th>Online attack</th><th>Offline attack</th></tr></thead>
  <tbody>
    <tr><td><strong>What's attacked</strong></td><td>A live authentication endpoint (SSH, RDP, a web login form, an API)</td><td>A password hash already obtained (a leaked/dumped database, a captured handshake, a <code>/etc/shadow</code> file)</td></tr>
    <tr><td><strong>Speed limit</strong></td><td>Network round-trip time, and deliberately, the service's own rate limiting</td><td>Local hardware — CPU for John, GPU for hashcat; billions of guesses/sec is realistic for fast hashes</td></tr>
    <tr><td><strong>Lockout risk</strong></td><td>High — most services lock or throttle an account after N failed attempts</td><td>None — nothing is contacted, so nothing can be locked or alerted</td></tr>
    <tr><td><strong>Detectability</strong></td><td>High — failed-login events land straight in the target's own logs/SIEM</td><td>None — happens entirely on the attacker's own hardware</td></tr>
    <tr><td><strong>Representative tools</strong></td><td><code>hydra</code>, <code>medusa</code>, <code>ncrack</code>, <code>patator</code></td><td><code>john</code>, <code>hashcat</code></td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>The pipeline: identify → choose a strategy → attack → (if offline) accelerate with rules and masks</h3>
<pre><code class="language-text">Got a credential surface
        │
        ├── It's a live login (SSH/RDP/web form/API)
        │         └── ONLINE attack: hydra / medusa / ncrack / patator
        │              (bounded by lockout policy — go slow, stay in scope)
        │
        └── It's a stolen/dumped hash (DB dump, /etc/shadow, captured handshake)
                  └── 1. Identify it:      hashid  →  algorithm + hashcat mode + John format
                      2. OFFLINE attack:   john  /  hashcat
                            ├─ Straight/dictionary (mode 0) — rockyou.txt, SecLists, cewl output
                            ├─ + Rules (best64.rule, etc.)  — mutate each word (Capitalize1, append 23!, leet)
                            ├─ Combinator (mode 1)           — glue two wordlists together
                            ├─ Mask / brute-force (mode 3)   — ?u?l?l?l?l?d?d (charset per position)
                            └─ Hybrid (mode 6 / mode 7)      — wordlist+mask or mask+wordlist
                      3. Nothing cracks?  → bigger/better wordlist (SecLists), custom crunch list,
                                             wider mask, or accept the hash resisted this attack budget
</code></pre>
<p>Rainbow tables are a special case that sits entirely on the offline side but bypasses the guess-and-hash loop above: instead of hashing each candidate password at attack time, a rainbow table <em>precomputes</em> chains of hash→password mappings ahead of time, trading disk space for near-instant lookups later — right up until a salt is involved, at which point the precomputation would have to be redone per-salt and the whole trade-off collapses (why virtually no modern, correctly-salted system is vulnerable to them).</p>

<h3>Where spraying and stuffing sit relative to "cracking"</h3>
<p>Password spraying and credential stuffing are deliberately kept separate from the pipeline above because they don't crack anything — they're <strong>online, credential-reuse</strong> attacks that exploit human and organizational behavior rather than weak hashing:</p>
<table>
  <thead><tr><th></th><th>Password spraying</th><th>Credential stuffing</th></tr></thead>
  <tbody>
    <tr><td><strong>What varies</strong></td><td>One (or a few) common password(s), tried against <em>many</em> usernames</td><td>Full username+password pairs, taken verbatim from an unrelated breach</td></tr>
    <tr><td><strong>Why it works</strong></td><td>Some fraction of a large user base always uses a common/seasonal password ("Summer2026!")</td><td>Large-scale password reuse across unrelated sites/services</td></tr>
    <tr><td><strong>Why it evades lockout</strong></td><td>Each individual account only ever receives one attempt (or a few, spaced out) — never enough to trip that account's own lockout threshold</td><td>Same — each account is tried once with its own already-known password, not brute-forced</td></tr>
  </tbody>
</table>
<p>Both are covered in Mechanics purely conceptually — the caveats (lockout-threshold awareness, and that this is squarely unauthorized access against any account you weren't explicitly told to test) apply just as strongly as they do to the more mechanical brute-force tools.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Tools & Techniques', html: `
<h3>Step 1 — Identify the hash: <code>hashid</code> (and the deprecated <code>hash-identifier</code>)</h3>
<p>Before cracking anything, confirm what it actually is — a hash pulled from a CTF, a leaked database, or an authorized engagement's dump rarely comes labeled. <code>hashid</code> is the current, actively maintained tool for this (it supersedes the older <code>hash-identifier</code>, which is still present on many Kali installs but no longer updated); it fingerprints a hash string by length and character set and lists candidate algorithms, and — critically — can print the exact <code>hashcat</code> mode number and John format name to plug straight into the next step.</p>
<pre><code class="language-bash"># Identify a single hash, with candidate hashcat mode(s) and John format shown:
hashid -m -j '5f4dcc3b5aa765d61d8327deb882cf99'

# Identify every hash in a dump, one per line:
hashid -m -j -o results.txt hashes.txt

# Legacy alternative (older Kali installs, interactive menu, no longer updated):
hash-identifier</code></pre>

<h3>Online attacks: <code>hydra</code>, <code>medusa</code>, <code>ncrack</code>, <code>patator</code></h3>
<p>All four attack a <em>live</em> service directly — a username/password pair is sent, the response is checked, repeat. They differ mainly in protocol coverage, performance characteristics, and syntax style, not in what they fundamentally do.</p>
<div class="callout warn">
  <div class="callout-title">Lockout awareness is not optional</div>
  <p>Most real services lock or throttle an account after a handful of failed logins (3–10 is typical), and many alert a SOC on the first one. Running any of these tools at default thread counts against a production login can lock out the legitimate account you were supposed to be testing, or every account in a lockout policy that locks on IP rather than per-account. Always check the Rules of Engagement for whether online brute-force/lockout-risking techniques are in scope at all, throttle heavily (low thread counts, delays between attempts), and prefer testing against a single, explicitly-designated test account first.</p>
</div>
<pre><code class="language-bash"># hydra — one username, a password list, against SSH; -t caps parallel tasks low
# on purpose (lockout-safe), -f stops at the first valid hit found:
hydra -l &lt;user&gt; -P rockyou.txt -t 4 -f ssh://&lt;target&gt;

# hydra — a username list against a list of passwords, HTTP POST login form:
hydra -L users.txt -P passwords.txt &lt;target&gt; http-post-form \\
  "/login:username=^USER^&amp;password=^PASS^:Invalid credentials"

# medusa — same idea, -M selects the protocol module:
medusa -h &lt;target&gt; -u &lt;user&gt; -P rockyou.txt -M ssh

# ncrack — nmap-project brute-forcer, built for large-scale/parallel service testing:
ncrack -p 22 --user &lt;user&gt; -P rockyou.txt &lt;target&gt;

# patator — module-based like the others, but every option is an explicit
# key=value pair (FILE0/FILE1 wire in wordlists), which makes complex,
# multi-variable attacks easier to express precisely:
patator ssh_login host=&lt;target&gt; user=&lt;user&gt; password=FILE0 0=rockyou.txt -x ignore:mesg='Authentication failed'</code></pre>

<h3>Offline attacks: <code>john</code> (John the Ripper)</h3>
<p>John autodetects most hash formats and supports single-crack mode (mutating the username/GECOS fields as candidates — useful when the password is a variant of the account's own username or real name), straight wordlist mode, and incremental (pure brute-force) mode. <code>--format</code> pins the exact hash type when autodetection is ambiguous, <code>--wordlist</code> supplies candidates, and <code>--rules</code> applies word-mutation rules from <code>john.conf</code> (Jumbo builds ship many rule sets beyond the default).</p>
<pre><code class="language-bash"># Let john autodetect the format and try single-crack mode against a
# combined passwd+shadow file (unshadow merges the two first):
unshadow /etc/passwd /etc/shadow &gt; combined.txt
john --single combined.txt

# Pin the format explicitly and run a straight dictionary attack:
john --format=sha512crypt --wordlist=rockyou.txt combined.txt

# Add rule-based mutation on top of the wordlist (Jumbo builds):
john --format=sha512crypt --wordlist=rockyou.txt --rules=Jumbo combined.txt

# Show whatever john has already cracked and stored in its pot file:
john --show combined.txt

# Pure incremental (brute-force) mode as a last resort, using john's
# built-in character-frequency model:
john --incremental combined.txt</code></pre>

<h3>Offline attacks: <code>hashcat</code> — GPU-accelerated, and the core tool for everything above dictionary-only</h3>
<p><code>hashcat</code> is GPU-accelerated (orders of magnitude faster than CPU-bound John for most fast hash types) and organizes every attack around two flags: <code>-m</code> selects the <strong>hash type</strong>, <code>-a</code> selects the <strong>attack mode</strong>.</p>
<table>
  <thead><tr><th>Mode (<code>-a</code>)</th><th>Name</th><th>What it does</th></tr></thead>
  <tbody>
    <tr><td><strong>0</strong></td><td>Straight</td><td>Classic dictionary attack — try each wordlist entry as-is, optionally mutated by <code>-r</code> rules</td></tr>
    <tr><td><strong>1</strong></td><td>Combinator</td><td>Concatenate every word from wordlist A with every word from wordlist B (e.g. first names + suffix words)</td></tr>
    <tr><td><strong>3</strong></td><td>Mask / brute-force</td><td>Try every combination of a defined charset per character position — fully supersedes classic brute force</td></tr>
    <tr><td><strong>6</strong></td><td>Hybrid: wordlist + mask</td><td>Append a mask to every wordlist word (e.g. "password" + <code>?d?d</code> → password00…password99)</td></tr>
    <tr><td><strong>7</strong></td><td>Hybrid: mask + wordlist</td><td>Prepend a mask to every wordlist word (e.g. <code>?d?d?d?d</code> + "password" → 2020password…2026password)</td></tr>
  </tbody>
</table>
<p>Some representative <code>-m</code> hash-type numbers you'll use constantly (confirm the exact one with <code>hashid -m</code> rather than guessing):</p>
<table>
  <thead><tr><th><code>-m</code></th><th>Hash type</th></tr></thead>
  <tbody>
    <tr><td>0</td><td>Raw MD5</td></tr>
    <tr><td>100</td><td>Raw SHA1</td></tr>
    <tr><td>1400</td><td>Raw SHA2-256</td></tr>
    <tr><td>1700</td><td>Raw SHA2-512</td></tr>
    <tr><td>1000</td><td>NTLM (Windows)</td></tr>
    <tr><td>500</td><td>md5crypt (Unix <code>$1$</code>)</td></tr>
    <tr><td>1800</td><td>sha512crypt (Unix <code>$6$</code>)</td></tr>
    <tr><td>3200</td><td>bcrypt (<code>$2*$</code>)</td></tr>
    <tr><td>13100</td><td>Kerberos 5 TGS-REP etype 23 (Kerberoasting)</td></tr>
    <tr><td>22000</td><td>WPA-PBKDF2-PMKID+EAPOL (current unified Wi-Fi handshake/PMKID mode)</td></tr>
  </tbody>
</table>
<p><strong>Masks</strong> build a candidate space position-by-position from built-in charsets: <code>?l</code> = lowercase, <code>?u</code> = uppercase, <code>?d</code> = digits, <code>?s</code> = special characters, and <code>?a</code> = all of the above combined. Up to four custom charsets (<code>-1</code>/<code>-2</code>/<code>-3</code>/<code>-4</code>) let a mask reference an exact, narrower set per position.</p>
<pre><code class="language-bash"># Mode 0 — straight dictionary attack against an NTLM hash dump, with the
# popular best64 rule set applied to every candidate word:
hashcat -m 1000 -a 0 ntlm_hashes.txt rockyou.txt -r rules/best64.rule

# Mode 1 — combinator: glue a first-names list to a suffix-words list
# (e.g. "john" + "2026" → "john2026"):
hashcat -m 0 -a 1 md5_hashes.txt firstnames.txt suffixes.txt

# Mode 3 — mask attack: a 9-char password known to be Capitalized-word +
# 2 digits + 1 special char (?u?l?l?l?l?l?d?d?s):
hashcat -m 1800 -a 3 shadow_hashes.txt ?u?l?l?l?l?l?d?d?s

# Mode 6 — hybrid wordlist+mask: every rockyou word with 2 trailing digits
# appended (models "password" → password00...password99):
hashcat -m 1400 -a 6 sha256_hashes.txt rockyou.txt ?d?d

# Mode 7 — hybrid mask+wordlist: a 4-digit year prefixed onto every
# rockyou word (models "2026password"):
hashcat -m 1400 -a 7 sha256_hashes.txt ?d?d?d?d rockyou.txt

# Show already-cracked results from hashcat's potfile:
hashcat -m 1000 ntlm_hashes.txt --show</code></pre>

<h3>Wordlists: <code>rockyou.txt</code>, SecLists, <code>crunch</code>, <code>cewl</code></h3>
<ul>
  <li><strong><code>rockyou.txt</code></strong> — roughly 14 million real passwords exposed in the 2009 RockYou breach; ships pre-installed (gzipped) on Kali at <code>/usr/share/wordlists/rockyou.txt.gz</code> and remains the single most-used starting dictionary because it's real human password behavior, not a theoretical list.</li>
  <li><strong>SecLists</strong> — a much broader curated collection (maintained on GitHub by Daniel Miessler and contributors) covering not just passwords but usernames, common web paths, fuzzing payloads, and more; its <code>Passwords/</code> directory includes rockyou itself plus many other breach-derived and "most common password" lists.</li>
  <li><strong><code>crunch</code></strong> — generates an exhaustive wordlist from a length range and character set rather than relying on real breach data; the right tool when you know the exact structure (e.g. "exactly 6 digits") but not the value.</li>
  <li><strong><code>cewl</code></strong> — spiders a target's own website and extracts the words actually used on it (product names, internal jargon, staff names) into a custom wordlist — a company-specific list that generic wordlists like rockyou will never contain, often combined with rule mutation afterward.</li>
</ul>
<pre><code class="language-bash"># crunch: every 8-character combination of lowercase letters + digits
# (huge — always estimate the output size before running for real):
crunch 8 8 abcdefghijklmnopqrstuvwxyz0123456789 -o custom.txt

# cewl: scrape a target's own site to depth 2, minimum word length 5,
# write results to a wordlist file:
cewl -d 2 -m 5 -w site_words.txt https://&lt;target&gt;

# Decompress and point a cracker at rockyou (Kali ships it gzipped):
gunzip /usr/share/wordlists/rockyou.txt.gz</code></pre>

<h3>Rainbow tables</h3>
<p>A rainbow table trades disk space for lookup speed by precomputing long chains of hash→plaintext reductions ahead of time, then compressing them into a much smaller table than "every hash mapped to every password" would require; cracking becomes a fast table lookup instead of a live guess-and-hash loop. <strong>RainbowCrack</strong> (<code>rtgen</code> to generate tables, <code>rcrack</code> to look up against them) is the classic open-source implementation; <strong>Ophcrack</strong> packages precomputed tables specifically for cracking Windows LM/NTLM hashes with a GUI. Rainbow tables are almost entirely neutralized by salting: a precomputed table is built for one specific, unsalted hash function, so as soon as every password hash in a leak carries its own random salt, the attacker would need a separate precomputed table per salt — which defeats the entire "precompute once, reuse forever" economics that make rainbow tables worthwhile in the first place. This is precisely why they're mentioned here mostly as a concept and a history lesson: modern, correctly-salted systems (bcrypt, Argon2, scrypt, and even salted SHA-2/md5crypt/sha512crypt) are not meaningfully vulnerable to them.</p>

<h3>Password spraying and credential stuffing (conceptual)</h3>
<p>These are covered conceptually, not as a live command walkthrough, because the entire point of both techniques is patient, low-and-slow behavior against real accounts — exactly the kind of activity that must stay inside an explicitly authorized, carefully-scoped engagement:</p>
<ul>
  <li><strong>Password spraying</strong> — try one, or a small handful of, very common/seasonal passwords against a <em>large list of usernames</em>, spaced out over time (often one attempt per account per lockout window, e.g. once every 30 minutes) so no single account ever accumulates enough failed attempts to trigger its own lockout threshold. It relies on the statistical certainty that in any sufficiently large user base, some fraction of accounts use a common password. Authorized spraying engagements agree the exact password(s), the spray rate, and the lockout-window math with the client in writing before anything runs, precisely because getting the timing wrong can still lock out real employees.</li>
  <li><strong>Credential stuffing</strong> — take username+password pairs verbatim from an unrelated, already-public breach dump and try them against a different target, betting on password reuse across services. It requires no guessing at all — every attempt uses a password already known to be real for that username somewhere — which is exactly why it's so effective against organizations whose users reuse passwords, and exactly why it's normally tested (when authorized at all) using a small, agreed sample rather than an entire breach corpus.</li>
</ul>
<p>Both techniques are online, both are throttled by the same lockout math covered above for hydra/medusa/ncrack/patator, and both are unauthorized-access crimes the moment they're run against any account outside an explicit, signed scope — see Defenses &amp; Legal below.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Worked Examples', html: `
<h3>Example 1 — Identify an unknown hash, then crack it with a dictionary + rules</h3>
<pre><code class="language-bash"># 1. Identify what the hash actually is, and get hashcat's mode number
#    plus John's format name for it in one step:
hashid -m -j '$6$aBcD1234$abunchofrandomlookingcharacters...'
# → suggests sha512crypt; hashcat mode 1800; John format sha512crypt

# 2. Run hashcat with the correct mode, a real-world wordlist, and a
#    popular rule set that models common human password habits
#    (capitalize first letter, append digits, common leetspeak swaps):
hashcat -m 1800 -a 0 shadow_hashes.txt rockyou.txt -r rules/best64.rule

# 3. If nothing cracks, don't immediately jump to brute force — try a
#    bigger, more diverse dictionary first (SecLists has many beyond
#    rockyou), since most real passwords are dictionary-derived, not
#    randomly brute-forceable within a practical time budget:
hashcat -m 1800 -a 0 shadow_hashes.txt /usr/share/seclists/Passwords/Leaked-Databases/rockyou-75.txt -r rules/best64.rule</code></pre>
<p>Notice the order: identify first (never guess the mode), dictionary+rules second (cheapest attack that matches real human behavior), and only escalate to a bigger wordlist or a mask/brute-force approach once that's exhausted.</p>

<h3>Example 2 — A policy-aware mask attack (hashcat mode 3)</h3>
<p>Suppose reconnaissance (or a client-provided password policy document) reveals the organization enforces exactly: one uppercase letter, five lowercase letters, two digits, in that fixed order — e.g. "Xabcde12". A mask attack encodes that structure directly instead of blindly trying every possible 8-character string:</p>
<pre><code class="language-bash">hashcat -m 1000 -a 3 ntlm_hashes.txt ?u?l?l?l?l?l?d?d</code></pre>
<p>This mask attack only searches the exact structure the policy allows — dramatically smaller than a generic 8-character <code>?a</code> brute force across the same length, and it's the direct payoff of understanding a target's actual password policy before choosing an attack mode.</p>

<h3>Example 3 — Hybrid attacks: modeling "word + suffix" and "prefix + word" habits (modes 6 and 7)</h3>
<pre><code class="language-bash"># Mode 6: append a 2-digit mask to every rockyou word — models the very
# common "wordSeason/Year + two digits" pattern (Summer26, Password99...):
hashcat -m 1400 -a 6 sha256_hashes.txt rockyou.txt ?d?d

# Mode 7: prepend a 4-digit year mask to every rockyou word instead —
# models "2026Summer", "2025Password" style patterns:
hashcat -m 1400 -a 7 sha256_hashes.txt ?d?d?d?d rockyou.txt</code></pre>
<p>Hybrid modes exist specifically because real chosen passwords are rarely pure dictionary words <em>or</em> pure random strings — they're almost always a recognizable word plus a small, guessable structured addition, and hybrid mode targets exactly that middle ground far more efficiently than either a pure dictionary or a pure mask attack would alone.</p>

<h3>Example 4 — John the Ripper against a Linux shadow dump</h3>
<pre><code class="language-bash"># Merge passwd + shadow into the combined format john expects:
unshadow /etc/passwd /etc/shadow &gt; combined.txt

# Try single-crack mode first — cracks fast when a password is a
# variant of the account's own username or GECOS/full-name field:
john --single combined.txt

# Then a pinned-format dictionary attack with rule mutation:
john --format=sha512crypt --wordlist=/usr/share/wordlists/rockyou.txt --rules=Jumbo combined.txt

# Review everything cracked so far without re-running the attack:
john --show combined.txt</code></pre>

<h3>Example 5 — A lockout-safe online attack against a single, in-scope test account</h3>
<pre><code class="language-bash"># A single named test account, a small curated password list (NOT the
# full rockyou.txt — that would trip lockout almost instantly), a low
# thread count, and -f to stop the moment a valid credential is found:
hydra -l svc-test-account -P common-200.txt -t 2 -f ssh://&lt;target&gt;</code></pre>
<p>The choices here are deliberate: a single account named explicitly in the Rules of Engagement (never a swept username list against a production system without separate authorization for that), a short curated list rather than a multi-million-entry dictionary, low parallelism, and an immediate stop on success — all specifically to respect whatever lockout threshold the target enforces and stay inside scope.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '⚠️ Defenses & Legal', html: `
<div class="callout danger">
  <div class="callout-title">⚠️ Authorization is the line — not skill, not intent, not "it was just a test account"</div>
  <p>Everything in this topic — identifying hashes, cracking them offline, brute-forcing a login online, spraying a common password across usernames, replaying stuffed credentials — is unauthorized access the moment it targets an account, service, or hash dump outside an explicit, written, in-scope authorization, exactly as covered in Foundations, Ethics &amp; Legal. "I only tried one password" or "the account was disabled anyway" is not a legal defense. Every command in this topic should only ever be run against your own lab-generated hashes, a deliberately vulnerable lab/CTF target, or an asset and account list explicitly named in a signed engagement's scope.</p>
</div>

<h3>Modern password hashing: bcrypt, scrypt, and Argon2id</h3>
<p>The single biggest defense against everything in this topic is simply not using a fast, general-purpose digest (MD5, SHA-1, SHA-256/512, or unsalted anything) to store passwords in the first place. Current OWASP Password Storage guidance recommends, in order of preference:</p>
<ul>
  <li><strong>Argon2id</strong> — the current default recommendation; memory-hard (tunable memory cost, commonly tens of MiB per hash), which specifically punishes GPU/ASIC cracking rigs that gain their speed advantage from massive parallelism but comparatively limited memory per core.</li>
  <li><strong>bcrypt</strong> — the long-standing, widely-supported fallback where Argon2 isn't available; tune the work factor as high as the server can absorb (a cost factor of 12 or higher is a reasonable current baseline, revisited periodically as hardware gets faster) and be aware of its 72-byte input limit.</li>
  <li><strong>scrypt</strong> — also memory-hard, a reasonable alternative to Argon2id where it's already the platform standard.</li>
  <li><strong>PBKDF2-HMAC-SHA256</strong> — not memory-hard, so weaker against GPU cracking than the three above, but the one to reach for when FIPS-140 validation is a hard requirement; compensate with a high iteration count (current guidance is in the hundreds of thousands).</li>
</ul>
<p>All four should always be paired with a unique, random, sufficiently long per-password salt (usually handled automatically by the library/function) — hashing algorithm choice and salting are complementary, not substitutes for each other.</p>

<h3>Multi-factor authentication: neutralizing the password even after it's cracked or guessed</h3>
<p>Every technique in this topic ultimately produces one thing: a valid password. <strong>MFA</strong> — an authenticator app (TOTP), a hardware/passkey-based factor (WebAuthn/FIDO2), or at minimum a push notification — means a correctly-guessed or cracked password alone isn't enough to log in, which is why it's the single most effective mitigation against everything covered here, including spraying and stuffing where the "password" was never actually guessed at all, just replayed. SMS-based OTP is better than no MFA but is the weakest common option (vulnerable to SIM-swapping and interception) — app-based or hardware-based factors are preferred where feasible.</p>

<h3>Password policy: length and breach-screening over forced complexity and rotation</h3>
<p>Current NIST SP 800-63B guidance (and OWASP's aligned recommendations) has moved away from the old "complexity rules" model that this whole topic's mask/hybrid attacks exploit so effectively:</p>
<ul>
  <li><strong>Favor length over mandated complexity</strong> — support long passphrases (64+ characters) rather than forcing "1 uppercase, 1 digit, 1 special character," which in practice produces predictable, guessable patterns (exactly the patterns Examples 2 and 3 above target with mask/hybrid attacks) rather than genuinely stronger passwords.</li>
  <li><strong>Screen new passwords against known-breached and commonly-used password lists</strong> at registration and change time (e.g. against a corpus like Have I Been Pwned's Pwned Passwords) — this directly blocks the exact passwords that <code>rockyou.txt</code>-style dictionary attacks would try first.</li>
  <li><strong>Don't force periodic rotation</strong> absent evidence of actual compromise — mandatory rotation has been shown to push users toward predictable, incrementing variants ("Summer2025!" → "Summer2026!") that are, again, exactly what dictionary and hybrid attacks are built to catch.</li>
</ul>

<h3>Lockout, rate-limiting, and their own trade-off</h3>
<p>Account lockout and request rate-limiting are what make online attacks (hydra/medusa/ncrack/patator, spraying, stuffing) impractical at scale — the entire "lockout awareness" caveat throughout this topic exists because these controls work. But lockout has a real trade-off worth knowing: an attacker who knows a target locks accounts after N failed attempts can deliberately trigger lockouts as a denial-of-service against legitimate users. Mature implementations mitigate this with exponential backoff and CAPTCHA challenges instead of (or in addition to) hard lockouts, IP/device-based rate limiting rather than pure per-account counting, and alerting/monitoring on unusual failed-login patterns (a burst of failures across many different usernames from one source is the signature of spraying; the same valid-looking credential pair tried from many different sources in a short window is the signature of stuffing) so a security team can respond before either succeeds at scale.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'cheat-sheet', title: '📋 Cheat Sheet', html: `
<table>
  <thead><tr><th>Tool</th><th>Purpose</th><th>Usage</th></tr></thead>
  <tbody>
    <tr><td>hashid</td><td>Identify a hash's algorithm; can print matching hashcat mode / John format</td><td><code>hashid -m -j &lt;hash&gt;</code></td></tr>
    <tr><td>hash-identifier</td><td>Legacy hash-identification tool (superseded by hashid, no longer updated)</td><td><code>hash-identifier</code> (interactive)</td></tr>
    <tr><td>hydra</td><td>Online brute force / credential guessing across many protocols</td><td><code>hydra -l &lt;user&gt; -P &lt;wordlist&gt; ssh://&lt;target&gt;</code></td></tr>
    <tr><td>medusa</td><td>Online brute force, module-based (<code>-M</code> selects protocol)</td><td><code>medusa -h &lt;target&gt; -u &lt;user&gt; -P &lt;wordlist&gt; -M ssh</code></td></tr>
    <tr><td>ncrack</td><td>Online brute force built for large-scale/parallel network auth testing</td><td><code>ncrack -p 22 --user &lt;user&gt; -P &lt;wordlist&gt; &lt;target&gt;</code></td></tr>
    <tr><td>patator</td><td>Online brute force with explicit key=value module options</td><td><code>patator ssh_login host=&lt;target&gt; user=&lt;user&gt; password=FILE0 0=&lt;wordlist&gt;</code></td></tr>
    <tr><td>john</td><td>Offline CPU-based cracker; autodetect, single-crack, wordlist, incremental modes</td><td><code>john --format=&lt;fmt&gt; --wordlist=&lt;wordlist&gt; --rules=Jumbo &lt;hashfile&gt;</code></td></tr>
    <tr><td>hashcat</td><td>Offline GPU-accelerated cracker; <code>-m</code> hash type, <code>-a</code> attack mode</td><td><code>hashcat -m &lt;mode&gt; -a 0 &lt;hashfile&gt; &lt;wordlist&gt; -r &lt;rulefile&gt;</code></td></tr>
    <tr><td>rockyou.txt</td><td>~14M real leaked passwords; default first-choice dictionary</td><td>Kali: <code>/usr/share/wordlists/rockyou.txt.gz</code> (gunzip first)</td></tr>
    <tr><td>SecLists</td><td>Broad curated wordlist/payload collection beyond rockyou</td><td><code>github.com/danielmiessler/SecLists</code> → <code>Passwords/</code></td></tr>
    <tr><td>crunch</td><td>Generate an exhaustive wordlist from a length + charset</td><td><code>crunch &lt;min&gt; &lt;max&gt; &lt;charset&gt; -o &lt;wordlist&gt;</code></td></tr>
    <tr><td>cewl</td><td>Scrape a target website into a site-specific custom wordlist</td><td><code>cewl -d 2 -m 5 -w &lt;wordlist&gt; https://&lt;target&gt;</code></td></tr>
    <tr><td>RainbowCrack (rtgen / rcrack)</td><td>Generate / look up precomputed rainbow tables</td><td><code>rcrack &lt;table-dir&gt; -h &lt;hash&gt;</code></td></tr>
    <tr><td>Ophcrack</td><td>GUI rainbow-table cracker specifically for Windows LM/NTLM</td><td>Load precomputed tables, import hashes, crack</td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">What's the difference between hashing and encryption, and why does it matter for password storage?</div>
<div class="qa-a">
<p>Encryption is reversible — the same or a paired key turns ciphertext back into plaintext. Hashing is deliberately one-way — there's no operation that recovers the original input from a digest. A correctly built authentication system stores only a (salted) hash, never anything encrypted-but-recoverable, because there's no legitimate reason a server should ever be able to produce a user's plaintext password again. Login works by hashing the submitted password with the same function and comparing digests, not by decrypting anything — which is also exactly why every attack in this topic is a guess-and-compare loop rather than a decryption process.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Why does salting defeat rainbow tables?</div>
<div class="qa-a">
<p>A rainbow table is a precomputed hash→plaintext lookup built once, in advance, for one specific unsalted hash function — its entire value proposition is "compute the expensive part once, then reuse it against any leak of that hash type forever." A salt makes the actual stored value <code>hash(salt + password)</code>, unique per user even for identical passwords, which means an attacker would need a separate precomputed table for every distinct salt in the leak — effectively as much precomputation work as just cracking each hash directly. That collapses the entire time/space trade-off rainbow tables depend on, which is why virtually no modern, correctly-salted system (bcrypt, Argon2id, scrypt, salted SHA-2, etc.) is meaningfully vulnerable to them.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Walk through hashcat's core attack modes — 0, 1, 3, 6, and 7 — and when you'd choose each.</div>
<div class="qa-a">
<p>Mode <strong>0 (straight)</strong> tries each wordlist entry as-is (optionally rule-mutated) — the default first move, since most real passwords are dictionary-derived. Mode <strong>1 (combinator)</strong> concatenates every word from one wordlist with every word from a second, useful when a password is plausibly two recognizable words glued together. Mode <strong>3 (mask/brute-force)</strong> tries every combination of a defined charset per character position — the right tool once you know the exact structure (length, and which positions are letters/digits/symbols) but not the value, and it fully replaces classic pure brute force. Modes <strong>6 and 7 (hybrid)</strong> combine a wordlist with a mask — mode 6 appends the mask after the word (models "word" + digits, e.g. password99), mode 7 prepends it before the word (models digits + "word", e.g. 2026password) — targeting the very common real-world pattern of a recognizable word plus a small structured addition, more efficiently than either a pure dictionary or a pure mask attack alone.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between online and offline password attacks, and why does that distinction drive tool choice?</div>
<div class="qa-a">
<p>Online attacks (hydra, medusa, ncrack, patator) guess directly against a live authentication endpoint, so they're bounded by network latency and, critically, by account-lockout and rate-limiting policy — a handful of failed attempts can lock the very account being tested, and every attempt lands in the target's own logs. Offline attacks (john, hashcat) work against an already-obtained password hash with no service being contacted at all, so there's no lockout risk and no detectability during the attack itself — the only limit is the attacker's hardware and the quality of the wordlist/rules/mask chosen. That's why offline cracking can afford to be exhaustive (full rockyou.txt plus rule sets, wide masks) while online attacks have to be small, targeted, and paced deliberately.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between password spraying and credential stuffing?</div>
<div class="qa-a">
<p>Password spraying holds the password constant and varies the username — trying one or a few common/seasonal passwords across a large list of accounts, spaced out so no single account ever accumulates enough failures to trip its own lockout threshold; it relies on the statistical certainty that some fraction of a large user base uses a common password. Credential stuffing instead replays full username+password pairs taken verbatim from an unrelated breach dump against a different target, betting on password reuse across services — it involves no guessing at all, since every credential tried is already known to be real somewhere. Both are online, credential-reuse attacks rather than cracking techniques, both are throttled by the same lockout math as brute-force tools, and both are unauthorized access outside an explicitly scoped, authorized engagement.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What actually stops these attacks from working in practice?</div>
<div class="qa-a">
<p>Layered defenses, not any single control: storing passwords with a slow, memory-hard hash (Argon2id preferred, bcrypt as a widely-supported fallback, scrypt as an alternative, PBKDF2 where FIPS-140 is required) makes offline cracking expensive even after a full database leak; MFA means a correctly cracked or guessed password alone still isn't enough to log in, which also neutralizes spraying and stuffing even though no cracking was involved there at all; sane password policy (favoring length and breach-corpus screening over forced complexity and rotation) removes the predictable patterns that mask/hybrid attacks and dictionaries are built to catch; and lockout/rate-limiting (ideally with exponential backoff and CAPTCHA rather than a hard lockout alone, to avoid enabling a lockout-based denial-of-service) makes online guessing at scale impractical. None of it substitutes for the others — a single missing layer is often exactly the gap a real attacker finds.</p>
</div>
</div>
`}

]});
