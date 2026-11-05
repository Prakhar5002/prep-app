window.PREP_SITE.registerTopic({
  id: "api-auth-rbac",
  module: "api-design",
  title: "AuthN, AuthZ & RBAC",
  estimatedReadTime: "40 min",
  tags: ["authentication","authorization","rbac","abac","rebac","oauth2","oidc","jwt","multi-tenant","audit"],
  sections: [

// ─────────────────────────────────────────────────────────────
{ id: "revision", title: "⚡ Revision — Points to Remember", collapsible: false, html: `
<div class="revision-card">
  <h4>In one line</h4>
  <div class="revision-oneline">AuthN proves <strong>who</strong> is calling (buy it from an IdP); AuthZ decides <strong>whether this principal may do this to this resource now</strong> (build it) — checked as permissions, ownership and tenant in several layers through one decision point, and audited.</div>
  <h4>Key points</h4>
  <ul>
    <li><strong>Broken access control is #1 in the OWASP Top 10 (2021)</strong> — this is where senior interviews dig. <strong>401</strong> = not authenticated, <strong>403</strong> = authenticated but forbidden, <strong>404</strong> for other tenants' resources so ids can't be probed.</li>
    <li><strong>Sessions</strong>: opaque id → server state, instant revocation, rotate id on login. <strong>JWT</strong>: signed snapshot, no lookup, valid until <code>exp</code>; once you need instant revocation you've added a lookup.</li>
    <li><strong>Verify JWTs fully:</strong> signature via JWKS + <code>kid</code>, <code>iss</code>, <code>aud</code>, <code>exp</code>/<code>nbf</code> with 30–60 s tolerance, algorithm allowlist (blocks <code>none</code> and RS256→HS256 confusion).</li>
    <li><strong>Revocation menu:</strong> short TTL (5–15 min), refresh rotation with reuse detection (revoke the family), <code>jti</code> denylist, per-user token version, opaque tokens + introspection.</li>
    <li><strong>OAuth 2.0</strong> = delegated authorization; <strong>OIDC</strong> adds identity (the ID token). <strong>Flows:</strong> auth code + PKCE for users (web/BFF, SPA, mobile via system browser), client credentials for M2M, device code for tablets/TVs; implicit and password grants are deprecated.</li>
    <li><strong>PKCE</strong> binds the code to the starter (stolen code useless); <strong>state</strong> = CSRF on redirect; <strong>nonce</strong> = ID-token replay. ID token → client; access token → API.</li>
    <li><strong>Scopes</strong> limit the client; <strong>permissions</strong> limit the user; effective = intersection.</li>
    <li><strong>RBAC / ABAC / ReBAC:</strong> roles → permissions; attribute conditions; relationship graph (OpenFGA/SpiceDB). Production = hybrid behind one PDP.</li>
    <li><strong>Model:</strong> memberships (user × tenant) → roles (system + custom) → permissions (code-defined <code>resource:action:scope</code>). Check permissions, never role names; cache briefly; no self-escalation.</li>
    <li><strong>Enforcement layers:</strong> gateway (token) → guard (permission) → domain (ownership/state) → DB RLS (tenant). UI is UX only.</li>
    <li><strong>RLS:</strong> <code>FORCE ROW LEVEL SECURITY</code>, policy on <code>current_setting('app.tenant_id', true)</code>, <code>set_config(..., true)</code> per transaction (pooler-safe), non-owner role without BYPASSRLS, fails closed.</li>
    <li><strong>Multi-tenant:</strong> tenant from principal only; composite FKs; tenant-keyed caches, indexes, S3 prefixes, messages; pool vs bridge vs silo.</li>
    <li><strong>Impersonation:</strong> act-as token (<code>act</code> claim), short TTL, read-only default, deny-list, banner, both ids audited; break-glass accounts page security.</li>
    <li><strong>Audit:</strong> append-only (revoke UPDATE/DELETE), same transaction as the change, log denials and auth events, ship to immutable storage/SIEM.</li>
  </ul>
  <h4>Common trap</h4>
  <div class="revision-trap"><strong>Doing authorization at the route level only</strong> — "has <code>booking:read</code>" — and then loading <code>WHERE id = $1</code>. That's IDOR: any user with the permission reads any booking in any tenant. Fix: scope every query by tenant and visibility from the verified principal, decide ownership in the domain layer, and back it with RLS so a forgotten <code>WHERE</code> fails closed.</div>
  <h4>Say this in the interview</h4>
  <div class="revision-say">"I buy authentication from an IdP and build authorization myself, because authorization is business logic — permissions, ownership and tenant — enforced in layers through one decision point."</div>
  <div class="revision-say">"A JWT is a signed snapshot that's valid until it expires, so I keep access tokens to minutes, rotate refresh tokens with reuse detection, and add a token-version check when I need instant revocation."</div>
  <div class="revision-say">"For tenant isolation the tenant id only ever comes from the verified principal, and Postgres row-level security is my safety net so a query that forgets its WHERE clause returns nothing instead of another customer's data."</div>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "what-why", title: "🧠 What & Why", collapsible: true, html: `
<h3>AuthN vs AuthZ</h3>
<table>
  <thead><tr><th></th><th>Authentication</th><th>Authorization</th></tr></thead>
  <tbody>
    <tr><td>Question</td><td>Who are you? Can you prove it?</td><td>Are you allowed to do <em>this</em> to <em>that</em>?</td></tr>
    <tr><td>Inputs</td><td>Password, passkey, OTP, SSO assertion, client secret, certificate</td><td>Principal + action + resource (+ context: time, IP, tenant)</td></tr>
    <tr><td>Output</td><td>A verified identity → session or token</td><td>Allow / deny (and ideally a reason)</td></tr>
    <tr><td>Failure status</td><td><code>401 Unauthorized</code> (really "unauthenticated") + <code>WWW-Authenticate</code></td><td><code>403 Forbidden</code> — or <code>404</code> to avoid revealing a resource exists</td></tr>
    <tr><td>Often outsourced to</td><td>An identity provider: Cognito, Auth0, Okta, Entra ID, Firebase Auth, Keycloak</td><td>Rarely outsourced — it encodes <em>your</em> business rules (policy engines help)</td></tr>
  </tbody>
</table>
<p>The asymmetry matters: you can (and usually should) buy authentication, but authorization is your domain logic. An IdP can tell you Priya is in the "Facilities" group; only your code knows whether Facilities may cancel a board-room booking made by the CEO's assistant.</p>

<h3>Why this matters for Full Stack and FDE roles</h3>
<ul>
  <li><strong>It's where breaches happen.</strong> IDOR (<code>GET /bookings/124</code> returns someone else's booking), missing tenant filters and privilege escalation via role assignment are routine findings in pen tests and VAPT reports.</li>
  <li><strong>Enterprise deals hinge on it.</strong> SSO (SAML/OIDC), SCIM deprovisioning, custom roles, audit-log export and support-access controls are standard items on security questionnaires. As an FDE you'll wire a customer's Okta or Entra ID into your product.</li>
  <li><strong>It's cross-cutting.</strong> REST, GraphQL resolvers, WebSocket subscriptions (<a href="#/topic/api-websockets">WebSockets Deep</a>), queue consumers and admin tools all need the same decisions — so the model has to live in one place.</li>
</ul>

<h3>Vocabulary you should use precisely</h3>
<table>
  <thead><tr><th>Term</th><th>Meaning</th></tr></thead>
  <tbody>
    <tr><td>Principal / subject</td><td>The authenticated actor: a user, a service, a device</td></tr>
    <tr><td>Identity provider (IdP) / authorization server</td><td>Authenticates users and issues tokens (Okta, Cognito, Auth0, Keycloak)</td></tr>
    <tr><td>Client</td><td>The application requesting tokens (web app, mobile app, backend job)</td></tr>
    <tr><td>Resource server</td><td>Your API, which validates tokens and enforces authorization</td></tr>
    <tr><td>Claim</td><td>A statement inside a token: <code>sub</code>, <code>email</code>, <code>tid</code>, <code>roles</code></td></tr>
    <tr><td>Scope</td><td>What the <em>client application</em> was allowed to do on the user's behalf (consent)</td></tr>
    <tr><td>Permission</td><td>An atomic capability: <code>booking:cancel:any</code></td></tr>
    <tr><td>Role</td><td>A named bundle of permissions assigned to principals</td></tr>
    <tr><td>Policy</td><td>A rule that combines attributes/relationships into a decision</td></tr>
    <tr><td>Tenant</td><td>The customer organisation whose data must be isolated from other customers</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mental-model", title: "🗺️ Mental Model", collapsible: true, html: `
<h3>Passport vs door rules</h3>
<p>Authentication issues a <strong>passport</strong>: who you are, signed by someone the API trusts, valid until a date. Authorization is the <strong>door rules</strong> of each building: the passport is necessary but the building decides, at the door, whether this passport opens this door today. Two consequences: (1) don't print the building's whole rulebook into the passport (tokens bloat and go stale), and (2) a passport issued yesterday says nothing about whether you were fired this morning.</p>

<h3>One request through the layers</h3>
<div class="diagram">
<pre>
 DELETE /v1/bookings/bk_91   Authorization: Bearer eyJ...
   │
   ▼
 ① Gateway / edge          verify signature, exp, iss, aud; rate-limit     → 401
   │                       (coarse: "has scope bookings.write")
   ▼
 ② Auth middleware         build Principal { userId, tenantId, permissions,
   │                       actor? (impersonator), tokenId }
   ▼
 ③ Route guard (RBAC)      principal has 'booking:cancel:own' or ':any'?   → 403
   │
   ▼
 ④ Domain policy           load booking WHERE id=$1 AND tenant_id=$2       → 404
   │                       ':own' only if booking.organizerId === userId    → 403
   │                       not already started, not a locked board meeting
   ▼
 ⑤ Database (RLS)          policy: tenant_id = current_setting('app.tenant_id')
   │                       → a forgotten WHERE clause still can't leak
   ▼
 ⑥ Audit log               actor, impersonator, action, resource, decision, ip
</pre>
</div>
<p>Each layer catches what the previous one can't see. The gateway doesn't know who organised booking 91; the database doesn't know about "can't cancel a meeting that already started". Senior answers name at least three layers.</p>

<h3>PEP, PDP, PIP, PAP — the enterprise vocabulary</h3>
<table>
  <thead><tr><th>Term</th><th>Role</th><th>In a Node service</th></tr></thead>
  <tbody>
    <tr><td>PEP — Policy Enforcement Point</td><td>Intercepts the request and enforces the decision</td><td>Express middleware, NestJS guard, GraphQL resolver wrapper</td></tr>
    <tr><td>PDP — Policy Decision Point</td><td>Evaluates policy, returns allow/deny</td><td>An <code>authz.can()</code> module, or OPA / Cedar / OpenFGA</td></tr>
    <tr><td>PIP — Policy Information Point</td><td>Supplies attributes the PDP needs</td><td>Postgres membership tables, the booking row, the IdP's groups</td></tr>
    <tr><td>PAP — Policy Administration Point</td><td>Where policies/roles are managed</td><td>Your admin UI for custom roles; policy files in git</td></tr>
  </tbody>
</table>
<p>The design goal: many PEPs (every endpoint, every consumer), <strong>one PDP</strong> (one place that encodes the rules), so a WebSocket subscription and a REST call can never disagree.</p>

<h3>The three modelling styles in one picture</h3>
<div class="diagram">
<pre>
 RBAC    user ──has──► role ──grants──► permission          "Receptionists can cancel any booking"

 ABAC    allow if  subject.dept == resource.dept            "Can edit rooms in your own building,
               and env.time in business_hours                 during business hours"

 ReBAC   user ──member──► team ──manager──► room             "Can book rooms that a team you belong
         check(user:priya, booker, room:R12) by graph walk     to manages"
</pre>
</div>

<div class="callout warn">
  <div class="callout-title">Common misconception</div>
  <p>"The JWT says <code>role: admin</code>, so they're an admin." The token is a <em>cached snapshot</em> of what was true when it was issued. If you demote someone, every token they hold keeps saying admin until it expires. Token TTL is your maximum staleness window for anything you put inside it — which is why permissions that change often belong in a server-side lookup, not in the token.</p>
</div>
` },

// ─────────────────────────────────────────────────────────────
{ id: "mechanics", title: "⚙️ Mechanics", collapsible: true, html: `
<h3>1. Sessions vs JWTs</h3>
<table>
  <thead><tr><th>Concern</th><th>Server-side session (opaque id)</th><th>JWT access token (self-contained)</th></tr></thead>
  <tbody>
    <tr><td>What the client holds</td><td>Random 128+ bit id, usually an HttpOnly cookie</td><td>Signed <code>header.payload.signature</code></td></tr>
    <tr><td>Validation cost</td><td>Store lookup per request (Redis: sub-millisecond)</td><td>Signature check, no network (keys cached from JWKS)</td></tr>
    <tr><td>Revocation</td><td>Delete the row → instant</td><td>Hard: valid until <code>exp</code> unless you add a denylist/lookup</td></tr>
    <tr><td>Data freshness</td><td>Always current</td><td>Snapshot at issue time</td></tr>
    <tr><td>Cross-service use</td><td>Every service needs the session store</td><td>Any service with the public key can verify</td></tr>
    <tr><td>Size</td><td>~32 bytes</td><td>Hundreds of bytes to several KB</td></tr>
    <tr><td>Best fit</td><td>First-party web app, admin consoles, BFFs</td><td>APIs called by many services/clients, mobile apps, third-party integrations</td></tr>
  </tbody>
</table>
<p>Session essentials: generate ids with a CSPRNG; keep both an idle timeout and an absolute lifetime; <strong>rotate the session id on login and on privilege change</strong> (prevents session fixation); store a server-side list of a user's sessions so "log out everywhere" and "a password reset kills all sessions" are one query.</p>

<h4>JWT anatomy and verification</h4>
<pre><code class="language-json">// header
{ "alg": "RS256", "kid": "2026-10-key-b", "typ": "at+jwt" }
// payload (base64url-encoded, NOT encrypted — anyone can read it)
{
  "iss": "https://auth.example.com/",
  "sub": "usr_7f3a",
  "aud": "https://api.example.com",
  "exp": 1793000000, "iat": 1792999100, "nbf": 1792999100,
  "jti": "tok_01JC9...",
  "scope": "bookings.read bookings.write",
  "tid": "ten_acme",
  "roles": ["receptionist"]
}</code></pre>
<ul>
  <li><strong>Symmetric (HS256):</strong> one shared secret signs and verifies — every verifier could also mint tokens. Fine inside a single service, wrong across services.</li>
  <li><strong>Asymmetric (RS256 / ES256 / EdDSA):</strong> the IdP signs with a private key; APIs verify with the public key fetched from a JWKS endpoint, selected by <code>kid</code>. Key rotation = publish the new key, start signing with it, keep the old one until its tokens expire.</li>
  <li><strong>Always verify</strong> signature, <code>iss</code>, <code>aud</code>, <code>exp</code>/<code>nbf</code> (with 30–60 s clock tolerance), and pin the allowed algorithms — that blocks <code>alg: none</code> and the RS256→HS256 confusion attack where the public key is used as an HMAC secret.</li>
</ul>
<pre><code class="language-ts">import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

const ISSUER = 'https://auth.example.com/';
const AUDIENCE = 'https://api.example.com';
const JWKS = createRemoteJWKSet(new URL(ISSUER + '.well-known/jwks.json')); // cached, refetched on unknown kid

export type AccessClaims = JWTPayload &amp; { tid: string; scope?: string; roles?: string[]; act?: { sub: string } };

export async function verifyAccessToken(token: string): Promise&lt;AccessClaims&gt; {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: ['RS256'],      // allowlist: never trust the token's own alg header
    clockTolerance: '30s',
  });
  if (typeof payload.tid !== 'string') throw new Error('missing tenant claim');
  return payload as AccessClaims;
}</code></pre>

<h4>Revoking JWTs — the menu</h4>
<table>
  <thead><tr><th>Technique</th><th>How</th><th>Cost</th></tr></thead>
  <tbody>
    <tr><td>Short TTL</td><td>Access tokens live 5–15 min</td><td>Staleness window = TTL; more refresh traffic</td></tr>
    <tr><td>Refresh rotation + reuse detection</td><td>Each refresh returns a new refresh token; reusing an old one revokes the whole family</td><td>A table of refresh tokens; detects stolen refresh tokens</td></tr>
    <tr><td><code>jti</code> denylist</td><td>Store revoked token ids in Redis until their <code>exp</code></td><td>A lookup per request (but a small, hot set)</td></tr>
    <tr><td>Token version</td><td><code>users.token_version</code> in the token as <code>tv</code>; bump on logout-all / role change</td><td>A cached lookup per request; revokes all of a user's tokens</td></tr>
    <tr><td>Opaque token + introspection</td><td>API asks the auth server (RFC 7662) whether the token is active</td><td>Network call per request (cache for seconds)</td></tr>
  </tbody>
</table>
<p>Honest summary for interviews: once you need instant revocation, you have reintroduced a lookup — at which point a JWT's main advantage is cross-service verification, not statelessness.</p>

<h3>2. OAuth 2.0 and OpenID Connect</h3>
<p>Roles: <strong>resource owner</strong> (the user), <strong>client</strong> (your app), <strong>authorization server</strong> (the IdP), <strong>resource server</strong> (your API). OAuth answers "may this client call this API on the user's behalf?"; OIDC adds "and here's who the user is" via an <strong>ID token</strong> plus discovery (<code>/.well-known/openid-configuration</code>) and a userinfo endpoint.</p>
<table>
  <thead><tr><th>Flow / grant</th><th>Use for</th><th>Status</th></tr></thead>
  <tbody>
    <tr><td>Authorization code + PKCE</td><td>Any app with a human user: server-rendered web, BFF, SPA, mobile, desktop</td><td>The default. PKCE is recommended even for confidential clients</td></tr>
    <tr><td>Client credentials</td><td>Machine-to-machine: cron jobs, backend → backend, partner integrations</td><td>Standard; no user involved</td></tr>
    <tr><td>Device authorization (RFC 8628)</td><td>Input-constrained devices: TVs, kiosks, meeting-room tablets, CLIs</td><td>Standard</td></tr>
    <tr><td>Refresh token</td><td>Getting new access tokens without re-login</td><td>Standard; rotate for public clients</td></tr>
    <tr><td>Token exchange (RFC 8693)</td><td>Service A calls B on a user's behalf with a narrower token; impersonation</td><td>Standard, less widely supported</td></tr>
    <tr><td>Implicit</td><td>(old SPAs) token returned in the URL fragment</td><td>Deprecated — leaks tokens via history/referrer</td></tr>
    <tr><td>Resource owner password</td><td>App collects the user's password directly</td><td>Deprecated — defeats SSO and MFA</td></tr>
  </tbody>
</table>
<p>OAuth 2.1 (in draft) folds these lessons in, and the OAuth 2.0 Security Best Current Practice (RFC 9700) is the document to cite for "why PKCE everywhere and no implicit flow".</p>

<h4>Authorization code + PKCE, step by step</h4>
<div class="diagram">
<pre>
 Browser/App            Your backend (BFF)               Authorization server
     │  click "Sign in"         │                                 │
     │─────────────────────────►│ make verifier (random 43–128 ch)│
     │                          │ challenge = BASE64URL(SHA256(v))│
     │                          │ save {verifier, state, nonce}   │
     │◄── 302 /authorize?response_type=code&amp;client_id&amp;redirect_uri   │
     │        &amp;scope=openid ...&amp;state&amp;nonce&amp;code_challenge&amp;method=S256 │
     │──────────────────────────────────────────────────────────►│ login + MFA + consent
     │◄────────────────────────── 302 redirect_uri?code=…&amp;state=… │
     │─────────────────────────►│ check state                     │
     │                          │── POST /token code + verifier ─►│ SHA256(verifier) == challenge?
     │                          │◄─ access_token, id_token, ──────│
     │                          │   refresh_token                 │
     │                          │ verify id_token (sig, aud, nonce)
     │◄── Set-Cookie: session ──│ tokens stay server-side         │
</pre>
</div>
<ul>
  <li><strong><code>state</code></strong> ties the callback to the browser that started the flow (CSRF on the redirect).</li>
  <li><strong><code>nonce</code></strong> ties the ID token to this login (stops replaying an old ID token).</li>
  <li><strong>PKCE</strong> ties the authorization code to the client instance that started the flow: a stolen code is useless without the verifier, which never left your backend/app. This is what makes public clients (mobile, SPA) safe without a client secret.</li>
  <li><strong>ID token vs access token:</strong> the ID token's audience is your <em>client</em>; it's for the client to learn who logged in. The access token's audience is your <em>API</em>. Never send an ID token as a bearer token to an API.</li>
  <li><strong>Scopes vs permissions:</strong> scopes limit what the <em>client</em> may do (user consented to "read your bookings"); permissions are what the <em>user</em> may do. Effective access = user permissions ∩ client scopes.</li>
</ul>
<pre><code class="language-ts">// BFF login + callback with Express, express-session and jose (no SPA ever sees a token)
import { randomBytes, createHash } from 'node:crypto';

app.get('/auth/login', (req, res) =&gt; {
  const verifier = randomBytes(32).toString('base64url');                       // 43 chars
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const state = randomBytes(16).toString('base64url');
  const nonce = randomBytes(16).toString('base64url');
  req.session.oauth = { verifier, state, nonce, returnTo: safeRelativePath(req.query.returnTo) };

  const url = new URL(oidc.authorization_endpoint);                             // from discovery doc
  url.search = new URLSearchParams({
    response_type: 'code', client_id: CLIENT_ID, redirect_uri: REDIRECT_URI,
    scope: 'openid profile email offline_access bookings.read bookings.write',
    state, nonce, code_challenge: challenge, code_challenge_method: 'S256',
  }).toString();
  res.redirect(url.toString());
});

app.get('/auth/callback', async (req, res) =&gt; {
  const saved = req.session.oauth;
  if (!saved || req.query.state !== saved.state) return res.status(400).send('invalid state');

  const tokenRes = await fetch(oidc.token_endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code', code: String(req.query.code), redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code_verifier: saved.verifier,
    }),
  });
  if (!tokenRes.ok) return res.status(502).send('token exchange failed');
  const tokens = await tokenRes.json();

  const { payload: id } = await jwtVerify(tokens.id_token, IDP_JWKS, { issuer: oidc.issuer, audience: CLIENT_ID });
  if (id.nonce !== saved.nonce) return res.status(400).send('invalid nonce');

  await new Promise&lt;void&gt;((ok, fail) =&gt; req.session.regenerate((e) =&gt; (e ? fail(e) : ok()))); // anti-fixation
  req.session.userId = await upsertUserFromIdp(id);           // JIT provisioning, map IdP groups → roles
  req.session.tokens = encryptAtRest(tokens);                 // refresh token never reaches the browser
  res.redirect(saved.returnTo ?? '/');
});</code></pre>

<h4>Mobile (React Native) specifics</h4>
<ul>
  <li>Use the <strong>system browser</strong> (ASWebAuthenticationSession on iOS, Custom Tabs on Android) via <code>react-native-app-auth</code> or <code>expo-auth-session</code> — not an embedded WebView, which can capture passwords, loses SSO cookies, and some IdPs (Google among them) block it.</li>
  <li>The app is a <strong>public client</strong>: no client secret in the binary; PKCE is mandatory. Prefer claimed HTTPS redirects (universal links / app links) over custom schemes, which another app can register.</li>
  <li>Store the refresh token in Keychain / Keystore (e.g. <code>expo-secure-store</code>), the access token in memory, and make refresh <strong>single-flight</strong>: if five requests get a 401 at once, one refresh runs and the others await it (otherwise rotation's reuse detection logs the user out).</li>
</ul>

<h4>Client credentials and device code</h4>
<pre><code class="language-ts">// Service-to-service: cache the token until shortly before expiry.
let cached: { token: string; expiresAt: number } | undefined;

export async function serviceToken(): Promise&lt;string&gt; {
  if (cached &amp;&amp; Date.now() &lt; cached.expiresAt - 60_000) return cached.token;
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
    },
    body: new URLSearchParams({ grant_type: 'client_credentials', scope: 'calendar.sync' }),
  });
  if (!res.ok) throw new Error('token endpoint ' + res.status);
  const body = await res.json();
  cached = { token: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return cached.token;
}</code></pre>
<p>Device code (RFC 8628) for a meeting-room tablet: the tablet POSTs to the device authorization endpoint, shows the returned <code>user_code</code> and <code>verification_uri</code> ("go to example.com/activate, enter WDJB-MJHT"), then polls the token endpoint with <code>grant_type=urn:ietf:params:oauth:grant-type:device_code</code>, backing off on <code>authorization_pending</code> and <code>slow_down</code>. A facility admin approves on their laptop, and the tablet receives a token whose subject is the <em>device</em>, scoped to one room.</p>

<h3>3. Authorization models</h3>
<table>
  <thead><tr><th></th><th>RBAC</th><th>ABAC</th><th>ReBAC</th></tr></thead>
  <tbody>
    <tr><td>Decision based on</td><td>Roles held by the subject</td><td>Attributes of subject, resource, action, environment</td><td>Relationships in a graph (user → team → room)</td></tr>
    <tr><td>Example rule</td><td>Receptionist ⇒ <code>booking:cancel:any</code></td><td>Allow edit if <code>user.building == room.building</code> and within business hours</td><td>Can book <code>room:R12</code> if member of a team that manages it</td></tr>
    <tr><td>"Who can access X?"</td><td>Easy (join roles)</td><td>Hard (must evaluate policies)</td><td>Supported via reverse graph queries</td></tr>
    <tr><td>Failure mode</td><td>Role explosion: <code>receptionist_blr_floor3</code></td><td>Opaque, hard-to-audit policies</td><td>New infrastructure; consistency of the tuple store</td></tr>
    <tr><td>Tools</td><td>Your own tables; Cognito groups; IdP roles</td><td>OPA (Rego), Cedar (Amazon Verified Permissions), Casbin, CASL</td><td>OpenFGA, SpiceDB, Permify (Zanzibar-inspired)</td></tr>
    <tr><td>Reach for it when</td><td>Fewer than ~20 roles; capabilities are org-wide</td><td>Rules depend on data values, time, location, risk</td><td>Sharing, hierarchies, nested groups (Drive/Notion/GitHub-style)</td></tr>
  </tbody>
</table>
<p>The realistic production answer is a <strong>hybrid</strong>: RBAC for capabilities ("can cancel bookings at all"), an ownership/relationship check for the specific resource ("is this your booking or your team's room"), and a few ABAC-style conditions ("not within 15 minutes of start"). Check <strong>permissions</strong> in code, never role names — roles are data that customers will rename and customise.</p>

<h3>4. A permission data model in Postgres</h3>
<pre><code class="language-sql">CREATE TABLE tenants     (id uuid PRIMARY KEY, name text NOT NULL);
CREATE TABLE users       (id uuid PRIMARY KEY, email citext UNIQUE NOT NULL, token_version int NOT NULL DEFAULT 0);

-- A user can belong to many tenants; status lets you suspend without deleting.
CREATE TABLE memberships (
  id         uuid PRIMARY KEY,
  tenant_id  uuid NOT NULL REFERENCES tenants(id),
  user_id    uuid NOT NULL REFERENCES users(id),
  status     text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  UNIQUE (tenant_id, user_id)
);

-- Permissions are code-defined capabilities: 'booking:cancel:any', 'room:manage', 'audit:read'.
CREATE TABLE permissions (key text PRIMARY KEY, description text NOT NULL);

-- System roles have tenant_id NULL; enterprise customers create custom roles in their tenant.
CREATE TABLE roles (
  id        uuid PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  key       text NOT NULL,
  name      text NOT NULL,
  UNIQUE NULLS NOT DISTINCT (tenant_id, key)          -- Postgres 15+
);
CREATE TABLE role_permissions (role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
                               permission_key text REFERENCES permissions(key),
                               PRIMARY KEY (role_id, permission_key));
CREATE TABLE membership_roles (membership_id uuid REFERENCES memberships(id) ON DELETE CASCADE,
                               role_id uuid REFERENCES roles(id),
                               PRIMARY KEY (membership_id, role_id));

-- Effective permissions for (user, tenant)
SELECT DISTINCT rp.permission_key
FROM memberships m
JOIN membership_roles mr ON mr.membership_id = m.id
JOIN roles r             ON r.id = mr.role_id AND (r.tenant_id IS NULL OR r.tenant_id = m.tenant_id)
JOIN role_permissions rp ON rp.role_id = r.id
WHERE m.user_id = $1 AND m.tenant_id = $2 AND m.status = 'active';</code></pre>
<ul>
  <li><strong>Naming:</strong> <code>resource:action[:scope]</code> — <code>booking:cancel:own</code> vs <code>booking:cancel:any</code> makes ownership explicit in the model instead of buried in an <code>if</code>.</li>
  <li><strong>Permissions live in code</strong> (a typed constant list, seeded by migration); <strong>roles live in data</strong>. Code checks permissions; admins assign roles.</li>
  <li><strong>Caching:</strong> cache effective permissions per <code>(tenant, user)</code> in Redis for 30–60 s, and delete the key on role/membership change. Put <code>roles</code> (short) in the token if you like, but resolve <code>permissions</code> server-side.</li>
  <li><strong>Escalation guard:</strong> a user may only assign roles whose permissions are a subset of their own; the last org admin can't remove themselves.</li>
</ul>

<h3>5. Enforcement points</h3>
<table>
  <thead><tr><th>Layer</th><th>Checks</th><th>Can't see</th></tr></thead>
  <tbody>
    <tr><td>Edge / API gateway</td><td>Token valid, audience, coarse scope, rate limits, WAF</td><td>Your data: who owns booking 91</td></tr>
    <tr><td>Route middleware / guard</td><td>Principal has the permission for this endpoint</td><td>The specific resource's owner/state</td></tr>
    <tr><td>Domain / service layer</td><td>Ownership, relationships, resource state, business rules</td><td>Queries written elsewhere that forget the check</td></tr>
    <tr><td>Database (RLS)</td><td>Tenant isolation on every query, including ad-hoc and buggy ones</td><td>Business rules; per-user nuance (possible but costly)</td></tr>
    <tr><td>UI</td><td>Hide buttons the user can't use</td><td>Nothing — it's UX only; attackers call the API directly</td></tr>
  </tbody>
</table>
<pre><code class="language-ts">// Express: principal middleware + permission guard
export type Principal = {
  userId: string; tenantId: string; permissions: Set&lt;string&gt;;
  actorUserId?: string;            // set when an admin is impersonating
  kind: 'user' | 'service' | 'device';
};
declare global { namespace Express { interface Request { principal?: Principal } } }

export const authenticate: RequestHandler = async (req, res, next) =&gt; {
  const header = req.headers.authorization ?? '';
  if (!header.startsWith('Bearer ')) return res.status(401).set('WWW-Authenticate', 'Bearer').end();
  try {
    const claims = await verifyAccessToken(header.slice(7));
    const permissions = await permissionCache.get(claims.sub!, claims.tid); // Redis → SQL above on miss
    if (!permissions) return res.status(403).json({ error: 'no_active_membership' });
    req.principal = { userId: claims.sub!, tenantId: claims.tid, permissions,
                      actorUserId: claims.act?.sub, kind: 'user' };
    next();
  } catch {
    res.status(401).set('WWW-Authenticate', 'Bearer error="invalid_token"').end();
  }
};

export const requirePermission = (...anyOf: string[]): RequestHandler =&gt; (req, res, next) =&gt; {
  const p = req.principal;
  if (p &amp;&amp; anyOf.some((perm) =&gt; p.permissions.has(perm))) return next();
  audit.deny(req, anyOf);                                  // denials are signal: log them
  res.status(403).json({ error: 'forbidden', required: anyOf });
};</code></pre>
<p>Row-level security as the safety net (tenant isolation even if a developer forgets a <code>WHERE</code>):</p>
<pre><code class="language-sql">ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings FORCE ROW LEVEL SECURITY;            -- apply to the table owner too

CREATE POLICY tenant_isolation ON bookings
  USING      (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- The app connects as a role WITHOUT superuser/BYPASSRLS. If app.tenant_id is unset,
-- current_setting(..., true) returns NULL and the policy matches zero rows (fail closed).</code></pre>
<pre><code class="language-ts">// Every request-scoped DB call goes through this; 'true' = setting is local to the transaction,
// which is what makes it safe with pooled connections (PgBouncer transaction mode).
export async function withTenant&lt;T&gt;(tenantId: string, fn: (tx: PoolClient) =&gt; Promise&lt;T&gt;): Promise&lt;T&gt; {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}</code></pre>

<h3>6. Multi-tenant isolation</h3>
<table>
  <thead><tr><th>Model</th><th>Shape</th><th>Isolation</th><th>Cost / ops</th></tr></thead>
  <tbody>
    <tr><td>Pool</td><td>Shared tables, <code>tenant_id</code> on every row</td><td>Logical (app + RLS)</td><td>Cheapest, one migration path; noisy-neighbour risk</td></tr>
    <tr><td>Bridge</td><td>Schema per tenant in one database</td><td>Stronger; per-schema grants</td><td>Migrations × N schemas; connection/catalog bloat at thousands of tenants</td></tr>
    <tr><td>Silo</td><td>Database (or AWS account) per tenant</td><td>Physical; per-tenant keys, regions, backups</td><td>Most expensive; fleet management; often reserved for enterprise tier</td></tr>
  </tbody>
</table>
<ul>
  <li><strong>Tenant comes from the verified principal</strong> (token claim or session membership), never from a body field, query param or unverified header. A subdomain (<code>acme.app.com</code>) may <em>select</em> a tenant, but membership must still be checked.</li>
  <li><strong>Make cross-tenant references impossible:</strong> composite foreign keys including <code>tenant_id</code> (<code>FOREIGN KEY (tenant_id, room_id) REFERENCES rooms (tenant_id, id)</code>), unique constraints scoped by tenant.</li>
  <li><strong>Everything else is tenant-scoped too:</strong> cache keys, search indexes, S3 prefixes (with IAM conditions), queue messages, analytics exports, logs.</li>
  <li><strong>Prefer 404 over 403</strong> for resources in another tenant — don't confirm that <code>bk_91</code> exists.</li>
  <li><strong>Per-tenant limits</strong> (rate limits, job concurrency) stop one customer's batch import from degrading everyone.</li>
</ul>

<h3>7. Admin access, impersonation and break-glass</h3>
<p>Support staff need to "see what the customer sees". Doing it by adding staff to the customer's tenant as admins is how audit trails and trust die. Do it with explicit, time-boxed impersonation:</p>
<pre><code class="language-ts">// Support console → mint a short-lived act-as token (claim shape follows RFC 8693's 'act').
export async function startImpersonation(staff: Principal, targetUserId: string, tenantId: string, reason: string, ticketId: string) {
  if (!staff.permissions.has('support:impersonate')) throw new ForbiddenError();
  const target = await loadPrincipal(targetUserId, tenantId);
  if (target.permissions.has('tenant:owner') &amp;&amp; !staff.permissions.has('support:impersonate:owner')) {
    throw new ForbiddenError('cannot impersonate tenant owners');
  }
  if (!(await tenantAllowsSupportAccess(tenantId))) throw new ForbiddenError('customer has disabled support access');

  await audit.write({ tenantId, action: 'support.impersonation.start', actorUserId: staff.userId,
                      subjectUserId: targetUserId, metadata: { reason, ticketId } });

  return signAccessToken({
    sub: targetUserId, tid: tenantId,
    act: { sub: staff.userId },          // who is really acting
    scope: 'read_only',                  // default; write requires a second approval
    exp: nowSeconds() + 30 * 60,         // 30 minutes, no refresh token
  });
}
// Middleware then blocks a deny-list for any token with 'act': change password/MFA,
// payment methods, API keys, deleting the tenant, exporting all data.</code></pre>
<p>Plus: a visible banner in the UI while impersonating, the customer-facing audit log showing "Support (Ravi) viewed as you", and <strong>break-glass</strong> accounts for emergencies that page security on use and are reviewed afterwards.</p>

<h3>8. Audit logs</h3>
<pre><code class="language-sql">CREATE TABLE audit_events (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occurred_at     timestamptz NOT NULL DEFAULT now(),
  tenant_id       uuid NOT NULL,
  actor_type      text NOT NULL,             -- user | service | device | system
  actor_id        text NOT NULL,             -- who it acted as
  impersonator_id text,                      -- real human when impersonating
  action          text NOT NULL,             -- 'booking.cancel', 'role.assign', 'auth.login.failed'
  resource_type   text, resource_id text,
  decision        text NOT NULL CHECK (decision IN ('allow','deny')),
  request_id      text, ip inet, user_agent text,
  changes         jsonb,                     -- redacted before/after diff, never secrets
  prev_hash       bytea, hash bytea          -- optional hash chain for tamper evidence
);
-- The application role can only append:
REVOKE UPDATE, DELETE, TRUNCATE ON audit_events FROM app_rw;</code></pre>
<ul>
  <li><strong>Write audit rows in the same transaction</strong> as the change they describe (or via the outbox), so you never have a change without its record.</li>
  <li><strong>Log denials and auth events</strong> (logins, MFA changes, failed logins, token issuance, role assignments, impersonation) — denials are often the first signal of an attack or a broken role.</li>
  <li><strong>Ship to immutable storage</strong> (e.g. S3 with Object Lock) or a SIEM for compliance; retention is set by contract/regime (often a year or more).</li>
  <li><strong>Customers want it:</strong> an audit-log viewer and export/stream (to Splunk, Datadog) is a standard enterprise ask.</li>
</ul>

<h3>9. Authentication hygiene in one table</h3>
<table>
  <thead><tr><th>Topic</th><th>Do</th></tr></thead>
  <tbody>
    <tr><td>Passwords</td><td>argon2id (OWASP's first choice) or bcrypt with a tuned work factor; never fast hashes; breached-password check</td></tr>
    <tr><td>MFA</td><td>TOTP or, better, passkeys/WebAuthn (phishing-resistant); step-up MFA for sensitive actions</td></tr>
    <tr><td>Brute force</td><td>Rate-limit per account and per IP, progressive delays, generic "invalid email or password" messages</td></tr>
    <tr><td>Enterprise SSO</td><td>OIDC or SAML 2.0 per tenant, JIT provisioning on first login, SCIM 2.0 for create/update/deprovision, IdP groups → your roles mapping</td></tr>
    <tr><td>Buy vs build</td><td>Use an IdP (Cognito, Auth0, Okta, Entra ID, Firebase Auth, Keycloak) — build authorization, not password storage</td></tr>
  </tbody>
</table>
` },

// ─────────────────────────────────────────────────────────────
{ id: "examples", title: "🧪 Examples", collapsible: true, html: `
<h3>Example 1 — Meeting-room booking SaaS: the permission design</h3>
<table>
  <thead><tr><th>Permission</th><th>Employee</th><th>Receptionist</th><th>Facility admin</th><th>Org admin</th><th>Room tablet (device)</th></tr></thead>
  <tbody>
    <tr><td><code>booking:create</code></td><td>✓</td><td>✓</td><td>✓</td><td>✓</td><td>✓ (own room, walk-up)</td></tr>
    <tr><td><code>booking:cancel:own</code></td><td>✓</td><td>✓</td><td>✓</td><td>✓</td><td>—</td></tr>
    <tr><td><code>booking:cancel:any</code></td><td>—</td><td>✓</td><td>✓</td><td>✓</td><td>—</td></tr>
    <tr><td><code>booking:checkin</code></td><td>✓ (own)</td><td>✓</td><td>✓</td><td>✓</td><td>✓ (own room)</td></tr>
    <tr><td><code>room:manage</code></td><td>—</td><td>—</td><td>✓</td><td>✓</td><td>—</td></tr>
    <tr><td><code>role:assign</code>, <code>audit:read</code></td><td>—</td><td>—</td><td>—</td><td>✓</td><td>—</td></tr>
  </tbody>
</table>
<pre><code class="language-ts">// Domain policy: one PDP function used by REST, WebSocket subscriptions and queue consumers alike.
export function canCancelBooking(p: Principal, b: Booking, now = new Date()): { ok: true } | { ok: false; reason: string } {
  if (b.tenantId !== p.tenantId) return { ok: false, reason: 'not_found' };          // never leak existence
  if (b.status !== 'confirmed') return { ok: false, reason: 'not_cancellable' };
  if (b.endsAt &lt;= now) return { ok: false, reason: 'already_ended' };
  if (p.permissions.has('booking:cancel:any')) return { ok: true };
  if (p.permissions.has('booking:cancel:own') &amp;&amp; b.organizerId === p.userId) return { ok: true };
  return { ok: false, reason: 'forbidden' };
}

// Route: the guard is a fast pre-check; the domain policy is the real decision.
router.delete('/v1/bookings/:id',
  authenticate,
  requirePermission('booking:cancel:own', 'booking:cancel:any'),
  async (req, res) =&gt; {
    const p = req.principal!;
    const result = await withTenant(p.tenantId, async (tx) =&gt; {
      const booking = await bookingsRepo.findForUpdate(tx, req.params.id);  // RLS also scopes this
      if (!booking) return { status: 404 as const };
      const decision = canCancelBooking(p, booking);
      await audit.write(tx, { principal: p, action: 'booking.cancel', resourceType: 'booking',
                              resourceId: booking.id, decision: decision.ok ? 'allow' : 'deny' });
      if (!decision.ok) return { status: decision.reason === 'not_found' ? 404 as const : 403 as const };
      await bookingsRepo.cancel(tx, booking.id, p.userId);
      await outbox.add(tx, 'booking.cancelled', { bookingId: booking.id, roomId: booking.roomId });
      return { status: 204 as const };
    });
    res.status(result.status).end();
  });</code></pre>
<p>The tablet authenticates as a <strong>device principal</strong> (device code flow or a provisioning token), with <code>kind: 'device'</code> and an attribute <code>roomId</code>; its policy allows check-in and walk-up booking only for that room. The booking aggregate itself — slots, conflict detection, concurrency — is in <a href="#/topic/lld-booking-system">Case: Meeting Room Booking</a>.</p>

<h3>Example 2 — NestJS: decorator + guard</h3>
<pre><code class="language-ts">import { SetMetadata, Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const PERMS_KEY = 'requiredPermissions';
export const RequirePermissions = (...perms: string[]) =&gt; SetMetadata(PERMS_KEY, perms);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride&lt;string[]&gt;(PERMS_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (!required?.length) return true;                       // or default-deny: see Bugs
    const principal = ctx.switchToHttp().getRequest().principal as Principal | undefined;
    if (principal &amp;&amp; required.some((p) =&gt; principal.permissions.has(p))) return true;
    throw new ForbiddenException({ error: 'forbidden', required });
  }
}

@Controller('rooms')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RoomsController {
  @Patch(':id')
  @RequirePermissions('room:manage')
  update(@Param('id') id: string, @Body() dto: UpdateRoomDto, @Req() req: AuthedRequest) {
    return this.rooms.update(req.principal, id, dto);          // service still checks tenant + state
  }
}</code></pre>

<h3>Example 3 — Refresh-token rotation with reuse detection</h3>
<pre><code class="language-sql">CREATE TABLE refresh_tokens (
  id          uuid PRIMARY KEY,
  family_id   uuid NOT NULL,                 -- one family per login
  user_id     uuid NOT NULL,
  token_hash  bytea NOT NULL UNIQUE,         -- store SHA-256, never the token
  used_at     timestamptz,
  revoked_at  timestamptz,
  expires_at  timestamptz NOT NULL
);</code></pre>
<pre><code class="language-ts">export async function rotateRefreshToken(presented: string) {
  const hash = sha256(presented);
  return db.tx(async (tx) =&gt; {
    const row = await tx.oneOrNone('SELECT * FROM refresh_tokens WHERE token_hash = $1 FOR UPDATE', [hash]);
    if (!row || row.revoked_at || row.expires_at &lt; new Date()) throw new UnauthorizedError();

    if (row.used_at) {
      // Reuse of an already-rotated token: someone has a copy. Kill the whole family.
      await tx.none('UPDATE refresh_tokens SET revoked_at = now() WHERE family_id = $1', [row.family_id]);
      await audit.write(tx, { action: 'auth.refresh.reuse_detected', actorId: row.user_id, decision: 'deny' });
      throw new UnauthorizedError();
    }

    await tx.none('UPDATE refresh_tokens SET used_at = now() WHERE id = $1', [row.id]);
    const next = randomToken();
    await tx.none(
      'INSERT INTO refresh_tokens (id, family_id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4, $5)',
      [uuid(), row.family_id, row.user_id, sha256(next), addDays(new Date(), 30)],
    );
    return { refreshToken: next, accessToken: await signAccessTokenFor(tx, row.user_id) };
  });
}</code></pre>
<p>Mobile clients with flaky networks can lose the response after the server rotated. Many implementations allow a short grace window (a few seconds) in which the immediately previous token is still accepted once; combine it with single-flight refresh on the client.</p>

<h3>Example 4 — Proving tenant isolation in a test</h3>
<pre><code class="language-ts">it('RLS hides other tenants even when the query forgets WHERE tenant_id', async () =&gt; {
  await seedBooking({ tenantId: ACME, id: 'bk_acme' });
  await seedBooking({ tenantId: GLOBEX, id: 'bk_globex' });

  const rows = await withTenant(ACME, (tx) =&gt; tx.query('SELECT id FROM bookings'));  // deliberately unscoped
  expect(rows.rows.map((r) =&gt; r.id)).toEqual(['bk_acme']);

  await expect(
    withTenant(ACME, (tx) =&gt; tx.query("INSERT INTO bookings (id, tenant_id) VALUES ('x', $1)", [GLOBEX])),
  ).rejects.toThrow(/row-level security/);                                          // WITH CHECK blocks it
});</code></pre>

<h3>Example 5 — ReBAC with an OpenFGA-style model</h3>
<pre><code class="language-text">model
  schema 1.1

type user

type team
  relations
    define member: [user]

type room
  relations
    define manager: [user, team#member]
    define booker: [user, team#member] or manager

# Tuples (data):
#   team:facilities-blr#member@user:priya
#   room:R12#manager@team:facilities-blr#member
#   room:R12#booker@team:sales#member
# Question: check(user:priya, booker, room:R12) → true (via manager → team membership)</code></pre>
<pre><code class="language-ts">const { allowed } = await fga.check({ user: 'user:' + p.userId, relation: 'booker', object: 'room:' + roomId });
if (!allowed) throw new ForbiddenError();</code></pre>
<p>Worth it when access is shaped by sharing and hierarchy (rooms managed by teams, nested teams, delegated access). For a fixed set of org-wide roles it's extra infrastructure — and every relationship change must now be written to the tuple store consistently with your database (often via the outbox; see <a href="#/topic/be-event-driven">Event-Driven Systems</a>).</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "pitfalls", title: "🕳️ Pitfalls", collapsible: true, html: `<div class="pitfalls-part">🕳️ Edge cases</div>

<h3>1. Demoted or deactivated user with a valid token</h3>
<p>The JWT keeps working until <code>exp</code>. Mitigate with short access-token TTLs, a <code>token_version</code> check (cached) for "revoke everything for this user", server-side permission lookup instead of permissions-in-token, and pushing a disconnect to their live WebSockets.</p>

<h3>2. Clock skew</h3>
<p>A token issued by a server whose clock runs 40 s ahead is "not yet valid" (<code>nbf</code>/<code>iat</code>) on yours. Allow 30–60 s of tolerance and run NTP everywhere. Mobile device clocks are not trustworthy — never validate expiry with the device clock for security decisions.</p>

<h3>3. Token too big for headers</h3>
<p>Embedding 200 permissions or 80 group names makes the <code>Authorization</code> header several KB. Proxies and servers commonly cap individual headers or total header size around 8–16 KB and return 431 or 400. Keep tokens small (subject, tenant, a few roles) and resolve permissions server-side.</p>

<h3>4. Signing-key rotation</h3>
<p>If you start signing with a new key before verifiers can fetch it, every request fails. Publish the new key in JWKS first, wait for caches to refresh, then switch signing, and keep the old public key until the longest-lived token signed with it has expired.</p>

<h3>5. One user, many tenants</h3>
<p>A consultant belongs to three customer orgs. Either issue a token per tenant (switching orgs = new token) or carry the selected tenant and verify active membership on every request. Never let the tenant float in from a query param without a membership check.</p>

<h3>6. Background jobs have no request</h3>
<p>Queue consumers and cron jobs run without a logged-in user. Put <code>tenantId</code> and the originating <code>actorId</code> in the message, run under an explicit service principal with narrow permissions, and still go through <code>withTenant</code>. See <a href="#/topic/be-event-driven">Event-Driven Systems</a>.</p>

<h3>7. Role assignment as privilege escalation</h3>
<p>A user with <code>role:assign</code> grants themselves Org Admin. Enforce "you can only grant permissions you hold", and require a second admin (or step-up MFA) for owner-level changes.</p>

<h3>8. 401 vs 403 vs 404</h3>
<p>401 = no or invalid credentials (client should re-authenticate). 403 = authenticated but not allowed. 404 = the resource doesn't exist <em>for you</em> — use it for other tenants' resources so ids can't be probed. Clients must treat 401 as "refresh and retry once", 403 as final.</p>

<h3>9. Cached personalised responses</h3>
<p>A CDN or shared cache stores <code>GET /me/bookings</code> for user A and serves it to user B. Responses that depend on <code>Authorization</code> need <code>Cache-Control: private</code> (or <code>no-store</code>), and cache keys in your own layers must include tenant and user.</p>

<h3>10. Loose <code>redirect_uri</code> matching</h3>
<p>If the IdP accepts any redirect under <code>https://app.example.com/*</code>, an open redirect on your site becomes an authorization-code theft vector. Register exact redirect URIs; PKCE limits the damage but doesn't excuse it.</p>

<h3>11. Parallel refreshes on mobile</h3>
<p>Five API calls get 401 at once, five refreshes race, rotation sees four "reused" tokens and revokes the family — the user is logged out. Single-flight the refresh on the client (one promise others await) and consider a short server-side grace window.</p>

<h3>12. Support staff needing access</h3>
<p>The tempting shortcut — a global "superadmin" flag that bypasses tenant checks — turns one leaked staff credential into access to every customer. Use impersonation tokens with reasons, TTLs, deny-lists and customer-visible audit entries.</p>

<h3>13. Deprovisioning lag with SSO</h3>
<p>An employee is removed from the customer's Okta but still has a 30-day refresh token in your app. SCIM deprovisioning (or IdP session checks on refresh) must revoke sessions and refresh tokens, not just mark the user inactive.</p>

<div class="pitfalls-part">🐛 Bugs &amp; anti-patterns</div>

<h3>Bug 1 — IDOR: fetching by id without scoping</h3>
<pre><code class="language-ts">// BAD — any authenticated user can read any booking by guessing ids
router.get('/v1/bookings/:id', authenticate, async (req, res) =&gt; {
  res.json(await db.one('SELECT * FROM bookings WHERE id = $1', [req.params.id]));
});

// GOOD — tenant and visibility are part of the query; not-yours looks like not-found
router.get('/v1/bookings/:id', authenticate, requirePermission('booking:read'), async (req, res) =&gt; {
  const p = req.principal!;
  const booking = await withTenant(p.tenantId, (tx) =&gt; bookingsRepo.findVisible(tx, req.params.id, p));
  if (!booking) return res.status(404).end();
  res.json(booking);
});</code></pre>
<p>UUIDs make ids harder to guess but are not authorization. See also IDOR in <a href="#/topic/web-security">Security (XSS/CSRF/CSP)</a>.</p>

<h3>Bug 2 — Trusting the tenant from the request</h3>
<pre><code class="language-ts">// BAD
const tenantId = req.headers['x-tenant-id'] ?? req.body.tenantId;
// GOOD
const tenantId = req.principal!.tenantId;   // from the verified token / session membership</code></pre>

<h3>Bug 3 — Mass assignment of privilege fields</h3>
<p><code>PATCH /users/me</code> with <code>{"name":"A","role":"admin"}</code> and a handler that spreads the body into the update. Use explicit DTOs/allowlists (zod, class-validator with <code>whitelist</code>) and separate endpoints for role changes guarded by <code>role:assign</code>.</p>

<h3>Bug 4 — <code>decode</code> instead of <code>verify</code></h3>
<p>Reading claims with a decode helper (no signature check) "because the gateway already verified it" — until a route is exposed without the gateway, or an internal caller forges a token. Verify at every trust boundary, with an algorithm allowlist.</p>

<h3>Bug 5 — Sending the ID token to the API</h3>
<p>The ID token's audience is the client app, so the API either rejects it (good) or accepts a token not meant for it (bad: any app using the same IdP can now call you). APIs accept access tokens whose <code>aud</code> is the API.</p>

<h3>Anti-pattern 6 — Role names in code</h3>
<pre><code class="language-ts">// BAD — breaks the day a customer creates a custom "Front Desk" role
if (user.role === 'admin' || user.role === 'receptionist') cancel();
// GOOD
if (principal.permissions.has('booking:cancel:any')) cancel();</code></pre>

<h3>Anti-pattern 7 — Authorization only in the UI</h3>
<p>Hiding the "Cancel" button is UX. The API must enforce the same rule — anyone can replay the request with curl or a modified app build.</p>

<h3>Anti-pattern 8 — Default-allow guards</h3>
<p>A guard that returns <code>true</code> when no permission metadata is present means every new endpoint ships public until someone remembers the decorator. Prefer default-deny with an explicit <code>@Public()</code> marker, and a test that enumerates routes and fails on unguarded ones.</p>

<h3>Anti-pattern 9 — Long-lived access tokens with no revocation path</h3>
<p>24-hour or 30-day JWTs used directly against APIs. Lost phone, fired employee, leaked log line — all stay valid. Short access tokens + revocable refresh tokens.</p>

<h3>Anti-pattern 10 — Duplicated authorization logic</h3>
<p>The REST controller checks ownership, the GraphQL resolver checks something slightly different, the WebSocket subscription checks nothing. Centralise decisions in one PDP module (or engine) and call it from every entry point.</p>

<h3>Anti-pattern 11 — Mutable, incomplete audit logs</h3>
<p>Audit rows in a table the app can <code>UPDATE</code>, written outside the transaction, with no denials and no impersonator column. It fails the first serious security review. Append-only grants, same transaction, both actor ids, denials included.</p>

<h3>Anti-pattern 12 — Zanzibar for three roles</h3>
<p>Adopting a ReBAC service, a policy language and a tuple-sync pipeline for an app with Admin/Member/Viewer. Start with tables + a PDP function; move to an engine when sharing/hierarchy requirements actually appear.</p>
` },

// ─────────────────────────────────────────────────────────────
{ id: "interview-qa", title: "🎤 Interview Q&A", collapsible: true, html: `
<div class="qa-block">
  <div class="qa-question">Q1. What's the difference between authentication and authorization, and between 401, 403 and 404?</div>
  <div class="qa-answer">
    <p>Authentication establishes identity — a verified principal. Authorization decides whether that principal may perform an action on a resource now. A 401 means "I don't know who you are" (missing, expired or invalid credentials), and the client should re-authenticate. A 403 means "I know who you are and you can't do this". For resources owned by another tenant or user I return 404, so the API doesn't confirm that the id exists. I'd also mention we usually buy authentication from an IdP but build authorization, because it encodes our business rules.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q2. Sessions or JWTs — which would you use and why?</div>
  <div class="qa-answer">
    <p>It depends on who calls the API. For a first-party web app I prefer a server-side session in an HttpOnly cookie, often behind a BFF: instant revocation, always-fresh permissions, nothing sensitive in the browser. For APIs called by mobile apps, multiple services or third parties, I use short-lived JWT access tokens (5–15 minutes) signed asymmetrically and verified via JWKS, plus rotating refresh tokens. The trade-off is revocation: a JWT is valid until <code>exp</code>, so as soon as I need instant revocation I add a lookup (denylist or token version), and at that point the real benefit of JWTs is cross-service verification, not statelessness.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q3. A user's laptop is stolen. How do you revoke their JWTs?</div>
  <div class="qa-answer">
    <p>Layered: revoke all their refresh tokens (delete or mark the families revoked) so no new access tokens can be minted; bump <code>users.token_version</code> so outstanding access tokens carrying the old <code>tv</code> fail the cached check; kill their server-side sessions and push a disconnect to live WebSockets. Without a version check or denylist, existing access tokens survive until expiry — which is exactly why access tokens should be short-lived. I'd also audit-log the revocation and, for SSO users, revoke at the IdP.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q4. Walk me through authorization code + PKCE. Why PKCE, and what's the difference between the ID token and the access token?</div>
  <div class="qa-answer">
    <p>The client makes a random code verifier and sends its SHA-256 hash (the code challenge) with the authorize redirect, along with <code>state</code> and, for OIDC, a <code>nonce</code>. The user authenticates at the IdP, which redirects back with a short-lived code. The client exchanges code + verifier at the token endpoint; the server checks that the verifier hashes to the challenge and returns tokens. PKCE binds the code to the instance that started the flow, so an intercepted code (malicious app on the same redirect scheme, logs, referrer) is useless — which is what makes it safe for public clients without a secret. <code>state</code> protects the redirect from CSRF; <code>nonce</code> stops ID-token replay. The ID token is for the <em>client</em> (audience = client id) to learn who logged in; the access token is for the <em>API</em> (audience = API). The API should never accept an ID token as a bearer.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q5. RBAC vs ABAC vs ReBAC — when do you choose each?</div>
  <div class="qa-answer">
    <p>RBAC when capabilities are org-wide and the role set is small and stable — it's simple to reason about and to audit ("who can delete rooms?" is a join). ABAC when decisions depend on data or context — same building, business hours, risk score, data classification — at the cost of policies that are harder to audit. ReBAC when access follows relationships and hierarchy — sharing, teams managing rooms, nested folders — which is what Zanzibar-style systems like OpenFGA or SpiceDB model. In practice I build a hybrid: RBAC permissions for capabilities, a relationship/ownership check for the specific resource, and a few attribute conditions, all behind one decision function. I'd warn about role explosion as the sign that RBAC alone is no longer enough.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q6. Design the permission model for a multi-tenant B2B SaaS where enterprise customers want custom roles.</div>
  <div class="qa-answer">
    <p>Tables: tenants, users, memberships (user × tenant, with status), permissions (code-defined keys like <code>booking:cancel:any</code>), roles (system roles with null tenant plus tenant-specific custom roles), role_permissions and membership_roles. Code checks only permissions; roles are data customers can create. Effective permissions for (user, tenant) are computed with one join and cached in Redis briefly, invalidated on change. Guardrails: you can only assign roles whose permissions you hold, the last owner can't be removed, and every role change is audited. Tokens carry subject and tenant (maybe role keys), not the permission list. For SSO customers I map IdP groups to roles at login and via SCIM. If they later need per-resource sharing, I add a grants/relationship table or a ReBAC engine rather than inventing more roles.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q7. Where do you enforce authorization?</div>
  <div class="qa-answer">
    <p>In layers, because each sees different things. The gateway validates the token, audience, coarse scopes and rate limits. Route middleware or a NestJS guard checks the principal has the endpoint's permission — a cheap, declarative pre-check. The domain layer makes the real decision on the specific resource: tenant, ownership, state ("can't cancel a meeting that ended"). The database enforces tenant isolation with row-level security as a safety net for the query someone forgets to scope. The UI only hides what you can't do. Importantly, the decision logic lives in one PDP module called by REST, GraphQL, WebSocket subscriptions and queue consumers, so they can't drift apart.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q8. How do you make cross-tenant data leaks structurally hard?</div>
  <div class="qa-answer">
    <p>Tenant id comes only from the verified principal. Every tenant-owned table has <code>tenant_id</code>, with composite foreign keys so a booking can't reference another tenant's room, and tenant-scoped unique constraints. Postgres RLS with <code>FORCE ROW LEVEL SECURITY</code> and a policy on <code>current_setting('app.tenant_id', true)</code>, set per transaction with <code>set_config(..., true)</code> so it's safe with connection pooling; the app connects as a non-owner role without BYPASSRLS, and an unset tenant fails closed. Caches, search indexes, S3 prefixes and queue messages are tenant-keyed too. And tests that deliberately run unscoped queries to prove RLS holds. For enterprise tiers, schema- or database-per-tenant silos give physical isolation at higher ops cost.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q9. Support wants to "log in as the customer". Design it.</div>
  <div class="qa-answer">
    <p>Impersonation, not shared credentials or a global superadmin. A staff member with <code>support:impersonate</code> requests a session for a target user, giving a reason and ticket id; tenants can disable or require approval for this. The system mints a short-lived token (say 30 minutes, no refresh) whose subject is the customer and whose <code>act</code> claim is the staff member — the RFC 8693 shape. It's read-only by default; a deny-list blocks password/MFA changes, payment details, API keys and data exports. The UI shows a banner, every action is audited with both ids, and the customer can see "Support viewed as you" in their audit log. Owners and other staff can't be impersonated without a higher permission.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q10. How do services authenticate to each other, and how do you keep the user's context?</div>
  <div class="qa-answer">
    <p>Service identity options: OAuth client credentials (tokens with an audience per downstream API), mTLS with workload identities (e.g. SPIFFE-style certificates in a mesh), or cloud-native identity (IAM roles with SigV4 on AWS). For user context, don't forward the user's original broad token everywhere; either pass a token exchanged for a narrower audience and scope (RFC 8693), or pass a signed internal context with tenant and user id that the downstream service trusts only from authenticated callers. Downstream services still apply their own authorization — never "it came from inside, so it's allowed" (the confused-deputy problem).</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q11. (FDE) An enterprise customer wants SSO with their Okta, automatic deprovisioning, and their AD groups mapped to your roles. How do you deliver it?</div>
  <div class="qa-answer">
    <p>Per-tenant IdP configuration: OIDC (preferred) or SAML 2.0, with the customer's issuer, client credentials or metadata stored per tenant, and email-domain or org-slug routing on the login page. On first login, JIT-provision the user into their tenant. Map IdP group claims to our roles via a per-tenant mapping table the customer's admin can edit, applied on every login. For deprovisioning, implement SCIM 2.0 endpoints (create/update/deactivate users and groups) authenticated with a per-tenant bearer token; deactivation revokes sessions and refresh tokens immediately. Also enforce "SSO required" for that tenant so local passwords can't bypass Okta, keep a break-glass admin, and give them audit logs of logins. I'd validate end-to-end in a sandbox Okta org before touching their production IdP and document the exact claims and attributes we need.</p>
  </div>
</div>

<div class="qa-block">
  <div class="qa-question">Q12. (FDE) A customer reports that a user in one team can see another team's bookings. What do you do?</div>
  <div class="qa-answer">
    <p>Treat it as a potential security incident. First, contain: reproduce with the reported user's permissions (impersonation in read-only mode, audited) and, if confirmed, ship a hotfix or feature-flag the endpoint off. Second, scope the blast radius: is it within one tenant (a team-visibility rule bug) or cross-tenant (a P0)? Use the audit log and access logs to list who accessed which resources while the bug existed. Third, root-cause: usually a list endpoint or export missing the visibility filter, a cache keyed without user/team, or a new GraphQL field resolving without the PDP. Fix at the right layer (central policy, not a one-off <code>if</code>), add a regression test that asserts the denial, and add a test that enumerates endpoints for missing guards. Finally, communicate clearly to the customer with the timeline and exposure — that's often the FDE's job.</p>
  </div>
</div>

<div class="callout success">
  <div class="callout-title">Interviewer's green-flag list for this topic</div>
  <ul>
    <li>You separate identity (bought) from authorization (built) and use 401/403/404 precisely.</li>
    <li>You state the JWT revocation trade-off honestly and offer short TTLs + rotation + version checks.</li>
    <li>You explain PKCE, <code>state</code> and <code>nonce</code>, and refuse ID tokens at the API.</li>
    <li>You check permissions, not role names, and model ownership (<code>:own</code> / <code>:any</code>) explicitly.</li>
    <li>You enforce in layers with one central decision point, including RLS for tenant isolation.</li>
    <li>You design impersonation with an actor claim, TTL, deny-list and audit — not a superadmin backdoor.</li>
    <li>You know the enterprise checklist: SSO, SCIM, custom roles, audit export.</li>
  </ul>
</div>
` },

  ]
});
