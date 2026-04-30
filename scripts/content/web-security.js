window.PREP_SITE.registerTopic({
  id: 'web-security',
  module: 'web',
  title: 'Security (XSS/CSRF/CSP)',
  estimatedReadTime: '50 min',
  tags: ['security', 'xss', 'csrf', 'csp', 'sri', 'cors', 'cookies', 'sanitization', 'web', 'owasp'],
  sections: [
    {
      id: 'tldr',
      title: '🎯 TL;DR',
      collapsible: false,
      html: `
<p>Frontend security boils down to: <strong>don't execute attacker-controlled code</strong>, <strong>don't leak credentials</strong>, and <strong>don't perform actions on user's behalf without their intent</strong>. The OWASP top 10 maps to a small set of vulnerabilities: XSS, CSRF, clickjacking, open redirect, supply-chain attacks, weak cookies, mixed content, and (server-side) SQL injection / SSRF / authentication failures. Senior frontend engineers internalize the prevention recipes.</p>
<ul>
  <li><strong>XSS:</strong> attacker injects script that runs in your origin. Defense: HTML-escape output, never <code>innerHTML</code> with user content, CSP, sanitize HTML when needed.</li>
  <li><strong>CSRF:</strong> attacker forces user to perform an action on a logged-in site. Defense: SameSite cookies, CSRF tokens, double-submit pattern, custom headers + CORS.</li>
  <li><strong>CSP (Content Security Policy):</strong> a header that whitelists which sources can load scripts/styles/etc. Strict CSP with nonces is the modern best practice.</li>
  <li><strong>Subresource Integrity (SRI):</strong> hash of third-party scripts; browser refuses if hash doesn't match (supply-chain protection).</li>
  <li><strong>Clickjacking:</strong> attacker iframes your site with transparent overlays. Defense: <code>X-Frame-Options: DENY</code> or <code>frame-ancestors</code> in CSP.</li>
  <li><strong>Cookie security:</strong> <code>Secure</code> + <code>HttpOnly</code> + <code>SameSite</code> + <code>__Host-</code> prefix.</li>
  <li><strong>Open redirect:</strong> <code>?next=...</code> URL params unsanitized → attacker bounces user to evil site. Defense: allowlist destinations.</li>
  <li><strong>Supply chain:</strong> npm packages can be compromised. Pin versions, audit, minimize dependencies, SRI on CDN-loaded scripts.</li>
</ul>
<p><strong>Mantra:</strong> "Escape on output, validate at the boundary, restrict cookies, lock down with CSP, audit dependencies, never trust the client."</p>
`
    },
    {
      id: 'what-why',
      title: '🧠 What & Why',
      html: `
<h3>The OWASP top 10 (2021 edition)</h3>
<table>
  <thead><tr><th>#</th><th>Category</th></tr></thead>
  <tbody>
    <tr><td>A01</td><td>Broken Access Control (mostly server)</td></tr>
    <tr><td>A02</td><td>Cryptographic Failures</td></tr>
    <tr><td>A03</td><td>Injection (XSS belongs here for client)</td></tr>
    <tr><td>A04</td><td>Insecure Design</td></tr>
    <tr><td>A05</td><td>Security Misconfiguration</td></tr>
    <tr><td>A06</td><td>Vulnerable Components (supply chain)</td></tr>
    <tr><td>A07</td><td>Identification and Authentication Failures</td></tr>
    <tr><td>A08</td><td>Software and Data Integrity (SRI relevant)</td></tr>
    <tr><td>A09</td><td>Security Logging Failures</td></tr>
    <tr><td>A10</td><td>Server-Side Request Forgery</td></tr>
  </tbody>
</table>
<p>Frontend engineers are responsible for A03 (XSS, CSRF), A06 (deps), A08 (SRI), and contribute to A05 / A07 via secure cookies, headers, etc.</p>

<h3>What XSS actually is</h3>
<p>Cross-Site Scripting: attacker injects HTML/JS that runs in your origin. The script can:</p>
<ul>
  <li>Read cookies (if not HttpOnly).</li>
  <li>Read localStorage / sessionStorage.</li>
  <li>Send authenticated requests on the user's behalf.</li>
  <li>Read DOM contents (passwords, sensitive UI).</li>
  <li>Install keyloggers, fake login forms.</li>
</ul>

<table>
  <thead><tr><th>Type</th><th>How</th></tr></thead>
  <tbody>
    <tr><td>Reflected XSS</td><td>Attacker URL contains payload; site reflects it into HTML.</td></tr>
    <tr><td>Stored XSS</td><td>Payload saved server-side (e.g., in a comment); served to all users.</td></tr>
    <tr><td>DOM-based XSS</td><td>Client-side JS reads attacker-controlled value (e.g., URL hash) and inserts into DOM.</td></tr>
  </tbody>
</table>

<h3>What CSRF is</h3>
<p>Cross-Site Request Forgery. Attacker tricks an authenticated user (you, logged into bank.com) into making a request from another site (evil.com). Browser auto-attaches your session cookie. Bank executes the action.</p>

<pre><code class="language-html">&lt;!-- evil.com --&gt;
&lt;form action="https://bank.com/transfer" method="POST"&gt;
  &lt;input name="to" value="attacker" /&gt;
  &lt;input name="amount" value="10000" /&gt;
&lt;/form&gt;
&lt;script&gt;document.forms[0].submit();&lt;/script&gt;
</code></pre>
<p>Without CSRF protection, the bank performs the transfer.</p>

<h3>What CSP does</h3>
<p>Content Security Policy is an HTTP header that tells the browser: "only execute scripts from these sources." If an XSS attacker manages to inject <code>&lt;script src="evil.com/x.js"&gt;</code>, CSP blocks it. CSP is defense-in-depth — even if your sanitization fails, CSP can prevent the injected script from running.</p>

<h3>The strict CSP recipe</h3>
<pre><code class="language-text">Content-Security-Policy:
  default-src 'self';
  script-src 'nonce-{random}' 'strict-dynamic';
  object-src 'none';
  base-uri 'none';
</code></pre>
<p>Each script tag includes <code>nonce="{random}"</code> matching the header; injected scripts without the nonce won't run.</p>

<h3>Why interviewers ask</h3>
<ol>
  <li>Senior frontend engineers are accountable for shipping secure code.</li>
  <li>Tests OWASP literacy.</li>
  <li>Tests defensive thinking — "what could go wrong if user input is treated as code?"</li>
  <li>Distinguishes engineers who copy-paste from those who understand the threat model.</li>
</ol>

<h3>What "good" looks like</h3>
<ul>
  <li>You escape on output by default; never <code>innerHTML</code> user content.</li>
  <li>You use <code>textContent</code> / React-style auto-escaping.</li>
  <li>If you must render user HTML, sanitize via a library (<code>DOMPurify</code>).</li>
  <li>Auth cookies are <code>Secure</code> + <code>HttpOnly</code> + <code>SameSite=Lax</code> (or Strict).</li>
  <li>Strict CSP with nonces or hashes.</li>
  <li>SRI on third-party CDN scripts.</li>
  <li>You don't store secrets in localStorage.</li>
  <li>You audit dependencies; pin versions; subscribe to advisories.</li>
  <li>You allowlist redirect destinations.</li>
</ul>
`
    },
    {
      id: 'mental-model',
      title: '🗺️ Mental Model',
      html: `
<h3>The "trust boundary"</h3>
<p>Every input crosses a boundary. Outside the boundary: untrusted (URL params, form data, request bodies, third-party APIs). Inside: trusted (after validation/sanitization). Most security bugs happen when you treat outside-boundary data as inside-boundary.</p>

<h3>The XSS prevention recipe</h3>
<table>
  <thead><tr><th>Sink</th><th>Defense</th></tr></thead>
  <tbody>
    <tr><td>HTML output (text content)</td><td>HTML-escape: &amp; → &amp;amp; etc. React does this automatically for JSX.</td></tr>
    <tr><td>HTML attributes</td><td>HTML-escape AND quote attribute values.</td></tr>
    <tr><td>JavaScript context (e.g., inline script)</td><td>JSON-encode and validate.</td></tr>
    <tr><td>URL context (href, src)</td><td>URL-encode AND validate scheme (no javascript:).</td></tr>
    <tr><td>CSS context (style)</td><td>Reject anything looking like url(...) or expressions.</td></tr>
    <tr><td>HTML rendering of user content</td><td>Use a sanitizer (DOMPurify) with a strict allowlist.</td></tr>
  </tbody>
</table>

<h3>React's safety model</h3>
<p>JSX auto-escapes interpolations: <code>&lt;p&gt;{userInput}&lt;/p&gt;</code> renders as text, never HTML. The escape hatch is <code>dangerouslySetInnerHTML</code> — the name reflects the danger. Use only with sanitized HTML.</p>

<h3>The CSRF prevention recipe</h3>
<ul>
  <li><strong>SameSite=Lax / Strict cookies</strong> — modern browsers default to Lax; Strict is safer where applicable.</li>
  <li><strong>CSRF tokens</strong> — server generates per-session token; client sends in form / header; server verifies.</li>
  <li><strong>Double-submit cookie</strong> — token in cookie + token in custom header; server verifies they match.</li>
  <li><strong>Custom headers + CORS</strong> — require <code>X-Requested-With: XMLHttpRequest</code> or similar; cross-origin can't add custom headers without preflight.</li>
  <li><strong>JSON content-type</strong> — forms can only POST <code>application/x-www-form-urlencoded</code>, <code>text/plain</code>, or <code>multipart/form-data</code> without preflight; <code>application/json</code> requires CORS preflight.</li>
</ul>

<h3>Cookies for security</h3>
<table>
  <thead><tr><th>Flag</th><th>Effect</th></tr></thead>
  <tbody>
    <tr><td>Secure</td><td>Only sent over HTTPS</td></tr>
    <tr><td>HttpOnly</td><td>JS can't read; defense vs XSS exfiltration</td></tr>
    <tr><td>SameSite=Strict</td><td>Only sent on same-site requests</td></tr>
    <tr><td>SameSite=Lax</td><td>Sent on top-level nav (default modern)</td></tr>
    <tr><td>SameSite=None; Secure</td><td>Sent cross-site (must be Secure)</td></tr>
    <tr><td>__Host- prefix</td><td>Implies Secure + Path=/ + no Domain attr</td></tr>
    <tr><td>__Secure- prefix</td><td>Implies Secure</td></tr>
  </tbody>
</table>

<h3>The "where to store the auth token" question</h3>
<table>
  <thead><tr><th>Storage</th><th>XSS risk</th><th>CSRF risk</th><th>Use case</th></tr></thead>
  <tbody>
    <tr><td>localStorage</td><td>HIGH (any JS reads)</td><td>None (no auto-attach)</td><td>SPA with strict CSP, accepting XSS risk</td></tr>
    <tr><td>HttpOnly cookie</td><td>None (JS can't read)</td><td>YES (auto-attached)</td><td>Standard web apps (mitigate CSRF)</td></tr>
    <tr><td>In-memory + refresh token in HttpOnly cookie</td><td>Lower (token only in memory)</td><td>YES (refresh)</td><td>Modern SPAs</td></tr>
  </tbody>
</table>

<h3>CSP directives</h3>
<table>
  <thead><tr><th>Directive</th><th>Controls</th></tr></thead>
  <tbody>
    <tr><td>default-src</td><td>Fallback for all resource types</td></tr>
    <tr><td>script-src</td><td>JS sources</td></tr>
    <tr><td>style-src</td><td>CSS sources</td></tr>
    <tr><td>img-src</td><td>Image sources</td></tr>
    <tr><td>connect-src</td><td>fetch / WebSocket / EventSource targets</td></tr>
    <tr><td>font-src</td><td>Font sources</td></tr>
    <tr><td>frame-src</td><td>iframe sources</td></tr>
    <tr><td>frame-ancestors</td><td>Who can iframe THIS page (replaces X-Frame-Options)</td></tr>
    <tr><td>base-uri</td><td>Allowed values for &lt;base&gt;</td></tr>
    <tr><td>form-action</td><td>Form submission targets</td></tr>
    <tr><td>object-src</td><td>&lt;object&gt; / &lt;embed&gt; sources</td></tr>
    <tr><td>upgrade-insecure-requests</td><td>Auto-upgrade http → https</td></tr>
    <tr><td>block-all-mixed-content</td><td>Block any non-HTTPS subresource</td></tr>
  </tbody>
</table>

<h3>CSP source values</h3>
<table>
  <thead><tr><th>Value</th><th>Meaning</th></tr></thead>
  <tbody>
    <tr><td>'self'</td><td>Same origin</td></tr>
    <tr><td>'none'</td><td>No sources allowed</td></tr>
    <tr><td>'unsafe-inline'</td><td>Inline scripts/styles allowed (avoid)</td></tr>
    <tr><td>'unsafe-eval'</td><td>eval() and similar allowed (avoid)</td></tr>
    <tr><td>'nonce-{random}'</td><td>Tags with matching nonce attribute</td></tr>
    <tr><td>'sha256-{hash}'</td><td>Inline tags with matching hash</td></tr>
    <tr><td>'strict-dynamic'</td><td>Trust scripts that are dynamically loaded by trusted scripts</td></tr>
    <tr><td>https:</td><td>Any HTTPS origin</td></tr>
    <tr><td>https://cdn.example.com</td><td>Specific origin</td></tr>
  </tbody>
</table>

<h3>Other security headers</h3>
<table>
  <thead><tr><th>Header</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td>Strict-Transport-Security</td><td>Force HTTPS for the domain</td></tr>
    <tr><td>X-Content-Type-Options: nosniff</td><td>Don't MIME-sniff; trust Content-Type</td></tr>
    <tr><td>X-Frame-Options: DENY (legacy)</td><td>Prevent embedding in iframe (use CSP frame-ancestors instead)</td></tr>
    <tr><td>Referrer-Policy</td><td>Control what referrer is sent</td></tr>
    <tr><td>Permissions-Policy</td><td>Restrict camera / mic / geolocation / payment APIs</td></tr>
    <tr><td>Cross-Origin-Embedder-Policy</td><td>require-corp; needed for SharedArrayBuffer / WebAssembly threads</td></tr>
    <tr><td>Cross-Origin-Opener-Policy</td><td>same-origin; isolates window from cross-origin parents</td></tr>
    <tr><td>Cross-Origin-Resource-Policy</td><td>Restrict cross-origin resource loading</td></tr>
  </tbody>
</table>

<h3>Subresource Integrity (SRI)</h3>
<pre><code class="language-html">&lt;script
  src="https://cdn.example.com/lib-1.0.0.js"
  integrity="sha384-abc123..."
  crossorigin="anonymous"
&gt;&lt;/script&gt;
</code></pre>
<p>Browser hashes the response and compares to the integrity value; refuses to execute if mismatch. Defense vs CDN compromise.</p>

<h3>The clickjacking model</h3>
<p>Attacker iframes your bank's "transfer" page with a transparent overlay. User thinks they're clicking "claim free prize"; actually clicks "transfer $1000." Defense:</p>
<pre><code class="language-text">Content-Security-Policy: frame-ancestors 'self';
# OR (legacy, still works)
X-Frame-Options: DENY
</code></pre>

<h3>Open redirect</h3>
<pre><code class="language-text">https://yourapp.com/redirect?next=https://evil.com/login

If your code does location.href = next; without validation,
attacker phishing page can use yourapp.com's URL to bounce.

Defense:
  - Allowlist destinations (only your domain).
  - Validate that next is a relative URL or in your allowlist.
  - Show "you're being redirected to https://..." confirmation page.
</code></pre>
`
    },
    {
      id: 'mechanics',
      title: '⚙️ Mechanics',
      html: `
<h3>Escaping HTML output</h3>
<pre><code class="language-js">function escape(str) {
  return String(str)
    .replace(/&amp;/g, '&amp;amp;')
    .replace(/&lt;/g, '&amp;lt;')
    .replace(/&gt;/g, '&amp;gt;')
    .replace(/"/g, '&amp;quot;')
    .replace(/'/g, '&amp;#39;');
}

el.innerHTML = '&lt;div&gt;' + escape(userInput) + '&lt;/div&gt;';
// Or simpler:
el.textContent = userInput;
</code></pre>

<h3>React safe vs dangerous</h3>
<pre><code class="language-jsx">// Safe — auto-escaped
&lt;p&gt;{userInput}&lt;/p&gt;

// Safe — auto-escaped
&lt;a href={url}&gt;...&lt;/a&gt;
// BUT: if url is "javascript:..." React 16+ throws a warning; doesn't fully block

// Dangerous — only if HTML is sanitized
import DOMPurify from 'dompurify';
&lt;div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} /&gt;
</code></pre>

<h3>DOMPurify usage</h3>
<pre><code class="language-js">import DOMPurify from 'dompurify';

const clean = DOMPurify.sanitize(dirtyHtml, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
  ALLOWED_ATTR: ['href', 'title'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):)/,
});

el.innerHTML = clean;
</code></pre>

<h3>Validating URL inputs</h3>
<pre><code class="language-js">function safeUrl(input) {
  try {
    const url = new URL(input, window.location.origin);
    if (url.protocol !== 'http:' &amp;&amp; url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

el.href = safeUrl(userInput) ?? '#';
</code></pre>

<h3>Setting CSP via meta tag</h3>
<pre><code class="language-html">&lt;meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'nonce-{nonce}' 'strict-dynamic';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
"&gt;
</code></pre>
<p>Server-side via header is preferred (covers more cases).</p>

<h3>CSP report-only mode</h3>
<pre><code class="language-text">Content-Security-Policy-Report-Only: ...; report-uri /csp-report
</code></pre>
<p>Logs violations without enforcing. Use to test policy before flipping to enforce.</p>

<h3>CSRF token (server)</h3>
<pre><code class="language-js">// Express middleware (csurf-style)
import csrf from 'csurf';
app.use(csrf({ cookie: true }));

app.get('/form', (req, res) =&gt; {
  res.render('form', { csrfToken: req.csrfToken() });
});

app.post('/submit', (req, res) =&gt; {
  // csurf middleware verifies the token automatically
});
</code></pre>

<h3>Double-submit cookie pattern</h3>
<pre><code class="language-text">1. Server sets cookie: __Host-csrf=abc123 (HttpOnly NOT required for this pattern, see notes)
2. Client reads CSRF token (e.g., from cookie if not HttpOnly, or via /csrf-token endpoint)
3. Client sends as X-CSRF-Token header
4. Server compares header value to cookie value

Cross-site request can't read the cookie (SameSite) and can't set the header (CORS).
</code></pre>

<h3>Cookie set with all flags (server-side)</h3>
<pre><code class="language-text">Set-Cookie: session=abc;
  Path=/;
  Secure;
  HttpOnly;
  SameSite=Lax;
  Max-Age=604800;
  __Host-prefix-version: __Host-session=abc; Path=/; Secure; HttpOnly; SameSite=Strict
</code></pre>

<h3>Permissions-Policy</h3>
<pre><code class="language-text">Permissions-Policy:
  camera=(),
  microphone=(),
  geolocation=(self),
  payment=(self https://payment.example.com),
  fullscreen=*
</code></pre>
<p>Disables features for the page (and its iframes); even if attacker injects code, browser refuses to grant access.</p>

<h3>SRI generation</h3>
<pre><code class="language-bash"># Generate hash for a script
cat lib.js | openssl dgst -sha384 -binary | openssl base64 -A
# → ...

# Use:
&lt;script src="..." integrity="sha384-..." crossorigin="anonymous"&gt;&lt;/script&gt;
</code></pre>

<h3>Subresource Integrity for fetched scripts</h3>
<pre><code class="language-js">// Modern: built-in fetch SRI (where supported)
const r = await fetch('https://cdn.com/lib.js', {
  integrity: 'sha384-...'
});
</code></pre>

<h3>Trusted Types (Chrome / Edge)</h3>
<pre><code class="language-text">Content-Security-Policy:
  require-trusted-types-for 'script';
  trusted-types my-policy;
</code></pre>
<pre><code class="language-js">// Code MUST go through a Trusted Types policy to assign innerHTML
const policy = trustedTypes.createPolicy('my-policy', {
  createHTML: (input) =&gt; DOMPurify.sanitize(input)
});

el.innerHTML = policy.createHTML(userInput);   // works
el.innerHTML = userInput;                       // throws
</code></pre>

<h3>Input validation pattern</h3>
<pre><code class="language-js">// Never trust client. Validate at every server boundary.
function validateEmail(email) {
  if (typeof email !== 'string') return null;
  if (email.length &gt; 254) return null;
  if (!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)) return null;
  return email.toLowerCase();
}
</code></pre>

<h3>File upload validation</h3>
<table>
  <thead><tr><th>Check</th><th>Why</th></tr></thead>
  <tbody>
    <tr><td>MIME type</td><td>Reject obvious wrong types (don't accept image when expecting CSV)</td></tr>
    <tr><td>Magic bytes</td><td>Don't trust extension; check actual file header</td></tr>
    <tr><td>Size limit</td><td>Prevent DoS</td></tr>
    <tr><td>Filename sanitization</td><td>Strip path traversal (../), special chars</td></tr>
    <tr><td>Content scanning</td><td>For docs / images, run virus / malware scan server-side</td></tr>
    <tr><td>Storage on different origin</td><td>Serve uploads from CDN with strict CSP / sandbox</td></tr>
  </tbody>
</table>

<h3>Auth flow with refresh tokens</h3>
<pre><code class="language-text">Login:
  Server returns:
    - access_token (short-lived, ~15min) → stored in memory
    - refresh_token (long-lived, ~30 days) → HttpOnly cookie

Subsequent requests:
  Authorization: Bearer &lt;access_token&gt;

Access token expires:
  Client calls /refresh; cookie sent automatically;
  Server validates refresh token; issues new access token.

Logout:
  Server invalidates refresh token (revocation list);
  Clear cookies.
</code></pre>

<h3>Open redirect prevention</h3>
<pre><code class="language-js">function safeRedirect(next) {
  // Allow only relative paths
  if (next.startsWith('/') &amp;&amp; !next.startsWith('//')) {
    return next;
  }
  // Or allowlist of full URLs
  const allowedHosts = ['app.example.com', 'admin.example.com'];
  try {
    const url = new URL(next);
    if (allowedHosts.includes(url.host)) return next;
  } catch {}
  return '/'; // safe fallback
}
</code></pre>

<h3>Dependency audit</h3>
<pre><code class="language-bash">npm audit
yarn audit
npm audit fix          # apply non-breaking fixes
npm audit fix --force  # apply major-version bumps (review first)

# Snyk, Dependabot — automated PRs to bump vulnerable deps
</code></pre>

<h3>Lockfile commits</h3>
<p>Always commit <code>package-lock.json</code> / <code>yarn.lock</code> / <code>pnpm-lock.yaml</code>. Without lockfile, transitive deps shift; you might pull a compromised version.</p>
`
    },
    {
      id: 'examples',
      title: '🧪 Worked Examples',
      html: `
<h3>Example 1: Reflected XSS via URL param</h3>
<pre><code class="language-js">// VULNERABLE
const params = new URLSearchParams(location.search);
document.querySelector('h1').innerHTML = 'Hello, ' + params.get('name');

// URL: ?name=&lt;img src=x onerror=alert(1)&gt;
// Page injects script.

// FIX 1: textContent
document.querySelector('h1').textContent = 'Hello, ' + params.get('name');

// FIX 2: escape
document.querySelector('h1').innerHTML = 'Hello, ' + escape(params.get('name'));
</code></pre>

<h3>Example 2: Stored XSS in comments</h3>
<pre><code class="language-jsx">// VULNERABLE
function Comment({ html }) {
  return &lt;div dangerouslySetInnerHTML={{ __html: html }} /&gt;;
}

// FIX
import DOMPurify from 'dompurify';

function Comment({ html }) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href'],
  });
  return &lt;div dangerouslySetInnerHTML={{ __html: clean }} /&gt;;
}
</code></pre>

<h3>Example 3: DOM-based XSS via location.hash</h3>
<pre><code class="language-js">// VULNERABLE
document.querySelector('#info').innerHTML = decodeURIComponent(location.hash.slice(1));

// URL: #&lt;script&gt;alert(1)&lt;/script&gt;
// Browser: &lt;script&gt; in innerHTML doesn't execute, but &lt;img onerror&gt; does.

// FIX
document.querySelector('#info').textContent = decodeURIComponent(location.hash.slice(1));
</code></pre>

<h3>Example 4: CSRF protection (express)</h3>
<pre><code class="language-js">import express from 'express';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';

const app = express();
app.use(cookieParser());
app.use(csrf({ cookie: { httpOnly: true, secure: true, sameSite: 'lax' } }));

app.get('/csrf-token', (req, res) =&gt; {
  res.json({ token: req.csrfToken() });
});

app.post('/transfer', (req, res) =&gt; {
  // csurf middleware already verified the token
  doTransfer(req.body);
});
</code></pre>
<pre><code class="language-js">// Client
const { token } = await fetch('/csrf-token').then(r =&gt; r.json());

await fetch('/transfer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
  body: JSON.stringify({ to, amount }),
});
</code></pre>

<h3>Example 5: Strict CSP with nonces</h3>
<pre><code class="language-js">// Server middleware (Express + crypto)
import crypto from 'crypto';

app.use((req, res, next) =&gt; {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  res.setHeader('Content-Security-Policy',
    \`default-src 'self'; script-src 'nonce-\${res.locals.cspNonce}' 'strict-dynamic'; object-src 'none'; base-uri 'none'\`);
  next();
});
</code></pre>
<pre><code class="language-html">&lt;!-- Server-rendered HTML --&gt;
&lt;script nonce="<%= cspNonce %>" src="/main.js"&gt;&lt;/script&gt;
</code></pre>

<h3>Example 6: SRI for CDN scripts</h3>
<pre><code class="language-html">&lt;script
  src="https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js"
  integrity="sha384-{hash}"
  crossorigin="anonymous"
&gt;&lt;/script&gt;
</code></pre>

<h3>Example 7: Auth flow with HttpOnly refresh token</h3>
<pre><code class="language-js">// Login response
res.cookie('refresh', refreshToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/api/auth/refresh',
  maxAge: 30 * 24 * 60 * 60 * 1000,
});
res.json({ accessToken });   // short-lived; client stores in memory

// Refresh
app.post('/api/auth/refresh', (req, res) =&gt; {
  const refresh = req.cookies.refresh;
  if (!isValid(refresh)) return res.status(401).end();
  const newAccess = sign(...);
  res.json({ accessToken: newAccess });
});
</code></pre>

<h3>Example 8: Clickjacking protection</h3>
<pre><code class="language-text">Content-Security-Policy: frame-ancestors 'none';

// Or for embedding only on your own domain:
Content-Security-Policy: frame-ancestors 'self';

// Legacy (still respected by older browsers):
X-Frame-Options: DENY
</code></pre>

<h3>Example 9: Open redirect prevention</h3>
<pre><code class="language-js">function getReturnUrl(input) {
  // Allow relative URLs only
  if (typeof input === 'string' &amp;&amp; input.startsWith('/') &amp;&amp; !input.startsWith('//')) {
    return input;
  }
  return '/';
}

const next = new URLSearchParams(location.search).get('next');
location.href = getReturnUrl(next);
</code></pre>

<h3>Example 10: File upload with MIME + magic-byte check</h3>
<pre><code class="language-js">// Server-side
import { fileTypeFromBuffer } from 'file-type';

async function validateUpload(buffer, claimedMime) {
  if (buffer.length &gt; 5 * 1024 * 1024) throw new Error('Too large');
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected) throw new Error('Unknown type');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(detected.mime)) {
    throw new Error('Disallowed type');
  }
  if (detected.mime !== claimedMime) {
    throw new Error('Type mismatch');
  }
  return true;
}
</code></pre>
`
    },
    {
      id: 'edge-cases',
      title: '⚠️ Edge Cases',
      html: `
<h3>React's URL handling</h3>
<p>React 16+ blocks <code>javascript:</code> in <code>href</code>; React 17 throws warnings for "URL containing javascript: scheme." But other URL contexts (CSS url()) aren't policed by React.</p>

<h3>HtmlOnly cookie + JS-side login</h3>
<p>SPA login: response sets HttpOnly session cookie. JS can't read the cookie, but subsequent <code>fetch</code> requests automatically include it. The token is "available" but invisible to JS — preventing XSS exfiltration.</p>

<h3>SameSite=Strict and OAuth</h3>
<p>OAuth callbacks come from a different domain; <code>SameSite=Strict</code> cookies aren't sent. Use <code>SameSite=Lax</code> for session cookies that need cross-origin redirects to work.</p>

<h3>SameSite=None requires Secure</h3>
<p>Browsers reject SameSite=None without Secure flag. Common bug: setting None on http://localhost or http://staging.</p>

<h3>CSP nonces and SSR</h3>
<p>Each request needs a fresh nonce. The HTML can't be cached unless you do nonce substitution at edge / CDN. For SPA with no SSR, hash-based CSP may be more practical.</p>

<h3>CSP and inline event handlers</h3>
<p><code>&lt;button onclick="handle()"&gt;</code> is an inline script under CSP. Strict CSP rejects it. Migrate to addEventListener.</p>

<h3>CSP unsafe-eval and frameworks</h3>
<p>Some frameworks / libraries use <code>eval</code> or <code>new Function()</code> internally. Webpack with HMR uses eval; Vue templates use Function constructor. Removing 'unsafe-eval' may break dev mode but should work in production builds.</p>

<h3>Trusted Types compatibility</h3>
<p>Trusted Types is Chrome / Edge only. Safari and Firefox don't enforce. Useful as defense-in-depth but not universal.</p>

<h3>Postel's law and security</h3>
<p>"Be liberal in what you accept" — bad security advice. Be strict. Reject malformed input rather than guessing.</p>

<h3>WAF (Web Application Firewall) bypasses</h3>
<p>WAFs catch common XSS payloads but creative encoding bypasses them. Don't rely on WAFs alone; do server-side validation.</p>

<h3>Iframes and <code>postMessage</code></h3>
<pre><code class="language-js">// Listening
window.addEventListener('message', (e) =&gt; {
  if (e.origin !== 'https://trusted.com') return;   // CRITICAL — verify origin
  // process e.data
});

// Sending
otherWindow.postMessage(data, 'https://trusted.com');   // specify target origin
</code></pre>

<h3>Storage events leak across tabs</h3>
<p>localStorage <code>storage</code> event fires across tabs of same origin. If one tab is compromised (XSS), attacker can broadcast to others. Limit sensitive data in localStorage; use sessionStorage for tab-isolated data.</p>

<h3>iframe sandbox quirks</h3>
<p><code>sandbox=""</code> (empty) blocks everything including same-origin. Add <code>allow-same-origin</code> only when needed. <code>allow-scripts</code> + <code>allow-same-origin</code> is dangerous: an iframe can break out of the sandbox via <code>parent.</code> access.</p>

<h3>Service worker scope</h3>
<p>A service worker registered at <code>/sw.js</code> controls only <code>/</code> and below. Subpath service workers don't see ancestor scopes. Compromise of one SW doesn't automatically affect others.</p>

<h3>Cookie tossing</h3>
<p>Subdomain attacker can set cookies that affect parent domain (e.g., <code>evil.foo.com</code> setting <code>auth=...</code> for <code>foo.com</code>). Mitigation: use <code>__Host-</code> prefix on critical cookies.</p>

<h3>Length-extension vs hash truncation</h3>
<p>For SRI, use SHA-256 or higher. SHA-1 is broken. Don't truncate hashes.</p>

<h3>JWT pitfalls</h3>
<p>JWT carries claims signed with a secret. Common mistakes: accepting <code>alg: none</code>; not verifying signature; storing JWT in localStorage with sensitive claims (anyone can decode the body, just can't forge); not handling expiration. JWT is fine if used carefully; many teams oversimplify.</p>

<h3>OAuth implicit flow deprecated</h3>
<p>Implicit flow (token in URL fragment) leaks tokens via referrer / browser history. Use Authorization Code with PKCE for SPAs.</p>

<h3>Password input gotchas</h3>
<ul>
  <li>autocomplete="current-password" / "new-password" — let password managers help.</li>
  <li>Don't disable paste — accessibility.</li>
  <li>Don't truncate length silently — frustrating.</li>
  <li>Don't ban special chars — encourages weaker passwords.</li>
</ul>

<h3>Insecure direct object references (IDOR)</h3>
<p><code>GET /users/123</code> — attacker tries <code>/users/124</code> and sees another user. Authorization is server-side; never trust client. Always verify the requesting user has access to the requested resource.</p>
`
    },
    {
      id: 'bugs-anti-patterns',
      title: '🐛 Bugs & Anti-Patterns',
      html: `
<h3>Bug 1: <code>innerHTML</code> with user input</h3>
<pre><code class="language-js">// XSS waiting to happen
el.innerHTML = userMessage;

// FIX
el.textContent = userMessage;
// Or sanitize if HTML must be rendered
el.innerHTML = DOMPurify.sanitize(userMessage);
</code></pre>

<h3>Bug 2: <code>eval</code> on user input</h3>
<pre><code class="language-js">// CRITICAL — direct code injection
eval(userInput);

// Almost never the right answer. Use Function (slightly safer) only when truly necessary,
// and never with untrusted input.
</code></pre>

<h3>Bug 3: localStorage for auth tokens</h3>
<p>JS can read it. Any XSS exfiltrates the token. Move to HttpOnly cookies or in-memory + refresh-token-in-cookie pattern.</p>

<h3>Bug 4: Origin "*" with credentials</h3>
<pre><code class="language-text">Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true   ← rejected by browser
</code></pre>
<p>Credentials-bearing requests require a specific origin, not wildcard.</p>

<h3>Bug 5: Trusting client-side validation</h3>
<p>Client-side validation is UX. Server must re-validate. Anyone can bypass JS.</p>

<h3>Bug 6: SameSite=None without Secure</h3>
<p>Browsers reject. Always pair: <code>SameSite=None; Secure</code>.</p>

<h3>Bug 7: Long-lived JWT</h3>
<p>JWTs without expiration or with 1-year expiration are time bombs. Short-lived access tokens (15 min) + refresh tokens.</p>

<h3>Bug 8: <code>postMessage</code> without origin check</h3>
<pre><code class="language-js">window.addEventListener('message', (e) =&gt; {
  // missing: if (e.origin !== 'https://trusted.com') return;
  doSensitiveThing(e.data);
});
</code></pre>

<h3>Bug 9: Sensitive data in URL</h3>
<p>URLs are logged everywhere — server access logs, browser history, analytics, third-party scripts. Never put tokens, passwords, sensitive IDs in URL params.</p>

<h3>Bug 10: Skipping CSP because "we trust our code"</h3>
<p>CSP is defense-in-depth. Even your code may have an XSS bug. CSP catches what your code doesn't.</p>

<h3>Anti-pattern 1: Disabling CSP for dev</h3>
<p>Common: dev mode runs without CSP, prod has it. Result: prod-only bugs. Run with CSP everywhere; use report-only mode in dev.</p>

<h3>Anti-pattern 2: Storing secrets in client code</h3>
<p>API keys, Firebase admin secrets, anything sensitive — never in client code. Anyone can extract.</p>

<h3>Anti-pattern 3: Custom crypto</h3>
<p>Don't roll your own crypto. Use Web Crypto API or established libraries.</p>

<h3>Anti-pattern 4: No CSP / weak CSP</h3>
<p><code>default-src *; script-src * 'unsafe-inline' 'unsafe-eval'</code> is no protection at all. Use strict CSP with nonces or hashes.</p>

<h3>Anti-pattern 5: Treating client validation as security</h3>
<p>"User can't enter &gt; 100 chars" — server must enforce. Client is a hint; server is the authority.</p>

<h3>Anti-pattern 6: Ignoring dep audits</h3>
<p>npm audit reports 47 vulnerabilities; team ignores. One of them is a real RCE in your build chain. Triage; fix; subscribe to alerts.</p>

<h3>Anti-pattern 7: Click-only consent for sensitive actions</h3>
<p>Critical actions (delete, transfer, refund) should require step-up auth or 2FA, not just a click. Defense in depth.</p>

<h3>Anti-pattern 8: Logging full URLs / headers</h3>
<p>Auth tokens, session cookies, PII — all leak into logs. Sanitize.</p>

<h3>Anti-pattern 9: Auto-redirect on form submit</h3>
<p>If your <code>?next=</code> param is unsanitized, attackers craft phishing URLs that look like your domain.</p>

<h3>Anti-pattern 10: Mixing security headers</h3>
<p>Setting both <code>X-Frame-Options: DENY</code> and <code>Content-Security-Policy: frame-ancestors *</code> — modern browsers honor CSP; legacy honor X-Frame-Options. Inconsistent. Standardize on CSP frame-ancestors and let X-Frame-Options be a fallback.</p>
`
    },
    {
      id: 'interview-patterns',
      title: '🎤 Interview Patterns',
      html: `
<h3>The 14 questions worth rehearsing</h3>
<table>
  <thead><tr><th>Question</th><th>One-liner</th></tr></thead>
  <tbody>
    <tr><td><em>What is XSS?</em></td><td>Attacker injects script into your page; runs with your origin's privileges.</td></tr>
    <tr><td><em>Three types of XSS?</em></td><td>Reflected, stored, DOM-based.</td></tr>
    <tr><td><em>How do you prevent XSS?</em></td><td>Escape on output (textContent, React auto-escape), sanitize HTML if needed (DOMPurify), CSP defense-in-depth.</td></tr>
    <tr><td><em>What is CSRF?</em></td><td>Attacker tricks logged-in user into making a request from another site; browser auto-attaches cookies.</td></tr>
    <tr><td><em>How do you prevent CSRF?</em></td><td>SameSite cookies, CSRF token, double-submit cookie, custom header + CORS.</td></tr>
    <tr><td><em>What is CSP?</em></td><td>HTTP header restricting which sources can load scripts/styles/etc.; defense-in-depth against XSS.</td></tr>
    <tr><td><em>What's a CSP nonce?</em></td><td>Random per-request value in CSP header; only matching script tags execute.</td></tr>
    <tr><td><em>What's SRI?</em></td><td>Cryptographic hash on third-party scripts; browser refuses execution if tampered.</td></tr>
    <tr><td><em>Where to store auth tokens?</em></td><td>HttpOnly cookies safest from XSS; localStorage convenient but vulnerable.</td></tr>
    <tr><td><em>What's clickjacking?</em></td><td>Attacker iframes your site with overlays; tricks user into unintended clicks.</td></tr>
    <tr><td><em>Cookie security flags?</em></td><td>Secure (HTTPS), HttpOnly (no JS), SameSite (Lax/Strict/None), Domain, Path, __Host- prefix.</td></tr>
    <tr><td><em>What's an open redirect?</em></td><td>Unsanitized redirect parameter lets attacker bounce users to evil sites.</td></tr>
    <tr><td><em>How do you handle file uploads safely?</em></td><td>MIME check, magic bytes, size limit, sanitize filename, separate origin for served files.</td></tr>
    <tr><td><em>How do you mitigate supply-chain attacks?</em></td><td>Pin versions, audit, lockfile, SRI on CDN scripts, minimize deps.</td></tr>
  </tbody>
</table>

<h3>Live coding warmups</h3>
<ol>
  <li>Write an HTML escape function.</li>
  <li>Use DOMPurify to render user-submitted Markdown safely.</li>
  <li>Configure CSP with nonces in Express.</li>
  <li>Set up CSRF token via double-submit pattern.</li>
  <li>Add SRI to a CDN script include.</li>
  <li>Write a safe redirect helper.</li>
  <li>Configure all cookie security flags on a session cookie.</li>
</ol>

<h3>Spot the issue</h3>
<ul>
  <li>innerHTML with user input — should be textContent or sanitized.</li>
  <li>localStorage holding session token — vulnerable to XSS.</li>
  <li>postMessage handler without origin check.</li>
  <li>SameSite=None without Secure — rejected.</li>
  <li>Origin: '*' with credentials — invalid.</li>
  <li>?next= URL param without validation — open redirect.</li>
  <li>JWT without expiration — long-lived auth.</li>
</ul>

<h3>What FAANG / mid-size shops grade</h3>
<table>
  <thead><tr><th>Signal</th><th>What they want</th></tr></thead>
  <tbody>
    <tr><td>OWASP literacy</td><td>You know the top vulnerabilities and prevention recipes.</td></tr>
    <tr><td>XSS prevention</td><td>You volunteer "escape on output, sanitize when needed, CSP."</td></tr>
    <tr><td>Cookie hygiene</td><td>You include all security flags by default.</td></tr>
    <tr><td>CSP awareness</td><td>You can configure strict CSP with nonces.</td></tr>
    <tr><td>Defense in depth</td><td>You don't rely on one mechanism; you stack.</td></tr>
    <tr><td>Server-trust discipline</td><td>You re-validate on server; client is hint only.</td></tr>
    <tr><td>Supply chain awareness</td><td>You audit, pin, SRI, dependabot.</td></tr>
  </tbody>
</table>

<h3>Mobile / RN angle</h3>
<ul>
  <li>RN apps don't have XSS in the browser sense, but WebViews inside RN do.</li>
  <li><strong>WebView security:</strong> set <code>originWhitelist</code>, disable JS where possible, validate all <code>postMessage</code> origins.</li>
  <li><strong>Deep link injection:</strong> attackers craft URLs that exploit your deep-link handler. Validate every URL parameter.</li>
  <li><strong>Insecure storage:</strong> AsyncStorage is plaintext; use Keychain (iOS) / Keystore (Android) for tokens.</li>
  <li><strong>Certificate pinning:</strong> protects against MITM. Use react-native-cert-pinner or built-in mechanisms.</li>
  <li><strong>OAuth deep-link callback:</strong> use Universal Links / App Links, not custom schemes (which can be hijacked).</li>
  <li>Don't store secrets in JS bundles; even minified bundles can be reversed.</li>
</ul>

<h3>Deep questions</h3>
<ul>
  <li><em>"Why is XSS still common?"</em> — JavaScript-heavy frontends introduce many sinks; user-generated content is everywhere; legacy code uses innerHTML; framework escape hatches (dangerouslySetInnerHTML) get misused.</li>
  <li><em>"How does SameSite=Lax compare to a CSRF token?"</em> — SameSite is browser-enforced and broad; CSRF tokens are app-enforced. Lax catches most cases; tokens close gaps (e.g., compromised subdomains setting cookies).</li>
  <li><em>"Why is unsafe-inline considered dangerous?"</em> — Allows inline scripts and styles; if XSS lets attacker inject HTML, inline scripts execute. Strict CSP requires nonces or hashes for inline.</li>
  <li><em>"What's strict-dynamic in CSP?"</em> — Trust scripts loaded by trusted scripts; reduces nonce ceremony for dynamic loaders. Modern recommendation.</li>
  <li><em>"Why is OAuth implicit flow deprecated?"</em> — Tokens in URL fragments leak via Referer / browser history. PKCE provides equivalent security with stronger guarantees.</li>
  <li><em>"How would you protect against a compromised npm package?"</em> — Lockfiles, audits, SRI on CDN; minimize deps; security review for new deps; monitor advisories.</li>
</ul>

<h3>"What I'd do day one on the team"</h3>
<ul>
  <li>Audit security headers: CSP, HSTS, COOP, CORP, Permissions-Policy.</li>
  <li>Verify cookie flags on all auth-related cookies.</li>
  <li>Search codebase for innerHTML, dangerouslySetInnerHTML, eval — check each usage.</li>
  <li>Run npm audit; fix or document open vulnerabilities.</li>
  <li>Add SRI to all CDN-loaded scripts.</li>
  <li>Set up CSP report-only first, then enforce.</li>
  <li>Document security conventions for the team.</li>
  <li>Review file upload, redirect, postMessage handlers.</li>
</ul>

<h3>"If I had more time" closers</h3>
<ul>
  <li>"I'd add a security-focused linter (eslint-plugin-security, eslint-plugin-no-unsanitized)."</li>
  <li>"I'd integrate Snyk or Dependabot for automated dep updates."</li>
  <li>"I'd build a 'security review' template for new features (data flow, auth, validation, output)."</li>
  <li>"I'd add Trusted Types in dev mode to catch innerHTML mistakes."</li>
  <li>"I'd run penetration tests on a quarterly basis or after major architecture changes."</li>
</ul>
`
    }
  ]
});
